from typing import TypedDict, Annotated, List, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from langchain_core.output_parsers import JsonOutputParser
import os, json, re

# ===============================
# 📌 Estado del agente
# ===============================
class PlannerState(TypedDict):
    messages: Annotated[List[HumanMessage | AIMessage], "Historial de la conversación"]
    city: str
    interests: List[str]
    itinerary: List[Dict[str, Any]]
    questions: List[str]
    response_type: str

# ===============================
# 📌 Configuración del modelo
# ===============================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if OPENAI_API_KEY and not OPENAI_API_KEY.startswith("tu-clave"):
    print("✅ Usando OpenAI GPT (API KEY detectada)")
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
else:
    print("✅ Usando Llama3 local en Ollama (sin API KEY)")
    llm = ChatOllama(model="llama3:8b", temperature=0, base_url="http://ollama:11434")

# ===============================
# 📌 Prompt del itinerario
# ===============================
itinerary_prompt = ChatPromptTemplate.from_template("""
Eres un planificador de viajes,cuando planifiques un viaje haz varias recomendaciones por dia para q el usuario aproveche bien su dia.

Genera un itinerario en formato JSON válido **sin texto adicional**.

El itinerario debe estar adaptado a:
- Ciudad: {city}
- Intereses: {interests}
- Petición del usuario: {user_message}

El formato exacto de salida debe ser:

{{
  "response_type": "itinerary",
  "questions": [],
  "itinerary": [
    {{
      "day": "Día 1",
      "time": "09:00",
      "name": "Nombre del lugar",
      "description": "Descripción breve",
      "lat": 0.0,
      "lng": 0.0
    }}
  ]
}}

⚠️ IMPORTANTE:
- No incluyas nada antes ni después del JSON.
- Solo responde con JSON válido.
""")

# ===============================
# 📌 Funciones de nodos
# ===============================
def input_city(state: PlannerState) -> PlannerState:
    return state

def input_interests(state: PlannerState) -> PlannerState:
    return state

def create_itinerary(state: PlannerState) -> PlannerState:
    message = state["messages"][-1].content if state["messages"] else ""
    city = state.get("city", "")
    interests = state.get("interests", [])

    print("📤 Enviando al modelo:")
    print("  city:", city)
    print("  interests:", interests)
    print("  user_message:", message)

    chain = itinerary_prompt | llm | JsonOutputParser()

    try:
        response = chain.invoke({
            "city": city,
            "interests": ", ".join(interests),
            "user_message": message
        })
        print("✅ Respuesta cruda del modelo:", response)
        return response
    except Exception as e:
        print("❌ ERROR en create_itinerary:", str(e))
        return {
            "response_type": "error",
            "city": city,
            "interests": interests,
            "questions": [],
            "itinerary": []
        }

# ===============================
# 📌 Grafo del agente
# ===============================
workflow = StateGraph(PlannerState)
workflow.add_node("input_city", input_city)
workflow.add_node("input_interests", input_interests)
workflow.add_node("create_itinerary", create_itinerary)
workflow.set_entry_point("input_city")
workflow.add_edge("input_city", "input_interests")
workflow.add_edge("input_interests", "create_itinerary")
workflow.add_edge("create_itinerary", END)
app = workflow.compile()

# ===============================
# 📌 Función pública
# ===============================
def run_travel_planner(user_request: str, city: str, interests: List[str]):
    state = {
        "messages": [HumanMessage(content=user_request)],
        "city": city,
        "interests": interests,
        "itinerary": [],
        "questions": [],
        "response_type": "itinerary"
    }

    try:
        final_state = {}
        for step in app.stream(state):
            print("🔎 Paso intermedio:", step)
            # step es un dict con un nodo como clave
            for node, node_state in step.items():
                final_state.update(node_state)

        print("✅ FINAL_STATE (aplanado):", final_state)

        if not final_state:
            return {
                "response_type": "error",
                "city": city,
                "interests": interests,
                "questions": [],
                "itinerary": []
            }

        return {
            "response_type": final_state.get("response_type", "error"),
            "city": final_state.get("city", city),
            "interests": final_state.get("interests", interests),
            "questions": final_state.get("questions", []),
            "itinerary": final_state.get("itinerary", []),
        }

    except Exception as e:
        print("❌ ERROR en run_travel_planner:", str(e))
        return {
            "response_type": "error",
            "city": city,
            "interests": interests,
            "questions": [],
            "itinerary": []
        }
