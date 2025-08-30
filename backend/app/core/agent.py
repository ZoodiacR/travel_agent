from typing import TypedDict, Annotated, List, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_ollama import ChatOllama
from langchain.output_parsers import StructuredOutputParser, ResponseSchema, OutputFixingParser
import os


# ===============================
# 📌 Estado del agente
# ===============================
class PlannerState(TypedDict):
    messages: Annotated[List[str], "Historial de la conversación (solo texto)"]
    city: str
    interests: List[str]
    trip_type: str
    itinerary: List[Dict[str, Any]]
    questions: List[str]
    response_type: str
    display_response: str
    language: str


# ===============================
# 📌 Definición de esquema
# ===============================
response_schemas = [
    ResponseSchema(name="response_type", description="'questions', 'itinerary', o 'error'"),
    ResponseSchema(name="city", description="Ciudad de destino"),
    ResponseSchema(name="interests", description="Lista de intereses (array de strings)"),
    ResponseSchema(name="trip_type", description="Tipo de viaje"),
    ResponseSchema(name="questions", description="Preguntas para el usuario (array de strings)"),
    ResponseSchema(
        name="itinerary",
        description="Lista de actividades. Cada item debe incluir: day, time, name, description, lat, lng"
    ),
    ResponseSchema(
        name="display_response",
        description="Texto amigable estilo chat (NO JSON). Resumen bonito para mostrar al usuario"
    ),
]

# ===============================
# 📌 Configuración del modelo
# ===============================
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if OPENAI_API_KEY and OPENAI_API_KEY.startswith("sk-"):
    print("✅ Usando OpenAI GPT (API KEY válida detectada)")
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
else:
    print("✅ Usando Llama3 local en Ollama (sin API KEY válida)")
    llm = ChatOllama(model="llama3:8b", temperature=0, base_url="http://ollama:11434")

# Parser que corrige errores automáticamente
base_parser = StructuredOutputParser.from_response_schemas(response_schemas)
parser = OutputFixingParser.from_llm(parser=base_parser, llm=llm)
# ===============================
# 📌 Prompts
# ===============================
itinerary_prompt = ChatPromptTemplate.from_template("""
Eres un planificador de viajes experto.

Tu tarea es crear un itinerario de viaje detallado. No preguntes, solo genera el itinerario.

Responde en el mismo idioma que el usuario (dedúcelo de su mensaje).

Formato obligatorio:
{format_instructions}

Notas:
- `response_type` siempre debe ser 'itinerary'.
- `questions` siempre debe ser un array vacío [].
- Siempre incluye `lat` y `lng` reales aproximados para los puntos de interés.
- `itinerary` debe ser una lista de al menos 3 actividades por dia.
- `display_response` debe ser un resumen amigable para el usuario.
- El itinerario debe ser relevante para la ciudad, los intereses y el tipo de viaje.

Contexto del Viaje:
Ciudad: {city}
Intereses: {interests}
Tipo de Viaje: {trip_type}

Historial de conversación: {user_message}
""").partial(format_instructions=parser.get_format_instructions())

questions_prompt = ChatPromptTemplate.from_template("""
Eres un asistente de viajes.

Tu tarea es analizar el mensaje del usuario y determinar qué información falta para planificar su viaje. Si tienes toda la información necesaria, devuelves un `response_type` de 'itinerary' para que el planificador cree el itinerario.

Responde en el mismo idioma que el usuario (dedúcelo de su mensaje).

Formato obligatorio:
{format_instructions}

Notas:
- `itinerary` siempre debe ser un array vacío [].
- Si YA CONOCES la ciudad, el tipo de viaje y los intereses, establece `response_type` como 'itinerary' y `questions` como un array vacío []. Esto es crucial para que el sistema avance.
- Si falta alguno de estos datos, establece `response_type` como 'questions' y formula las preguntas necesarias en el array `questions`.
- `display_response` debe ser un resumen amigable.

Contexto del Viaje:
Ciudad: {city}
Intereses: {interests}
Tipo de Viaje: {trip_type}

Historial de conversación: {user_message}
""").partial(format_instructions=parser.get_format_instructions())

# ===============================
# 📌 Funciones auxiliares
# ===============================
def normalize_response(response: Dict[str, Any]) -> Dict[str, Any]:
    """Normaliza la respuesta para asegurar consistencia."""
    if isinstance(response.get("questions"), str):
        response["questions"] = [response["questions"]] if response["questions"] else []
    if isinstance(response.get("interests"), str):
        response["interests"] = [response["interests"]] if response["interests"] else []
    if not isinstance(response.get("itinerary"), list):
        response["itinerary"] = []
    if response.get("display_response") is None:
        response["display_response"] = ""
    return response


# ===============================
# 📌 Nodos del grafo
# ===============================
def check_missing_info(state: PlannerState) -> PlannerState:
    message = state["messages"][-1] if state["messages"] else ""

    # 📝 Se le pasa al LLM todo el historial para que tenga el contexto completo
    full_context = f"Historial: {state.get('messages', [])}\nÚltimo mensaje: {message}"

    chain = questions_prompt | llm | parser
    response = chain.invoke({
        "user_message": full_context,
        "city": state.get("city", ""),
        "interests": ", ".join(state.get("interests", [])),
        "trip_type": state.get("trip_type", "")
    })

    response = normalize_response(response)
    print("🤔 Respuesta de check_missing_info (cruda):", response)

    # 🚀 Aquí está la clave: Fusión del estado

    # Mantén los valores existentes a menos que la nueva respuesta los actualice.
    new_state = {}

    # 1. Conserva los datos existentes si no son sobrescritos o si la nueva data está vacía.
    new_state['city'] = response.get('city') or state.get('city', '')
    new_state['trip_type'] = response.get('trip_type') or state.get('trip_type', '')

    # 2. Combina las listas de intereses
    old_interests = set(state.get('interests', []))
    new_interests = set(response.get('interests', []))
    new_state['interests'] = list(old_interests.union(new_interests))

    # 3. Actualiza los campos que siempre deben venir de la respuesta del LLM.
    new_state['response_type'] = response.get('response_type', 'questions')
    new_state['questions'] = response.get('questions', [])
    new_state['itinerary'] = response.get('itinerary', [])  # Esto podría ser un []
    new_state['display_response'] = response.get('display_response', '')

    # 4. Actualiza el historial de mensajes
    new_state['messages'] = state['messages'] + [response.get('display_response', '')]

    # Actualiza el estado global con la nueva información fusionada
    state.update(new_state)
    print("✅ Estado fusionado:", state)
    return state


def create_itinerary(state: PlannerState) -> PlannerState:
    message = state["messages"][-1] if state["messages"] else ""
    chain = itinerary_prompt | llm | parser
    response = chain.invoke({
        "user_message": message,
        "city": state.get("city", ""),
        "interests": ", ".join(state.get("interests", [])),
        "trip_type": state.get("trip_type", "")
    })
    response = normalize_response(response)
    print("📤 Itinerario generado:", response)

    # Aseguramos que la respuesta final tenga un mensaje amigable
    if not response.get("display_response"):
        response["display_response"] = f"¡Aquí está tu itinerario en {state.get('city', 'tu destino')}! ¡Disfruta!"

    # Limpiamos las preguntas antes de finalizar
    response["questions"] = []
    response["response_type"] = "itinerary"
    state.update(response)
    return state


# ===============================
# 📌 Grafo Corregido
# ===============================
workflow = StateGraph(PlannerState)
workflow.add_node("check_missing_info", check_missing_info)
workflow.add_node("create_itinerary", create_itinerary)

workflow.set_entry_point("check_missing_info")

# ✅ Sintaxis corregida para la transición condicional
# La función lambda retorna la clave 'should_create_itinerary' o 'should_ask_questions'
# El diccionario mapea esas claves a los nodos 'create_itinerary' o 'end'
workflow.add_conditional_edges(
    "check_missing_info",
    lambda state: "itinerary_ready" if state["response_type"] == "itinerary" else "still_asking",
    {"itinerary_ready": "create_itinerary", "still_asking": END}
)

workflow.add_edge("create_itinerary", END)
app = workflow.compile()

# ===============================
# 📌 Función pública
# ===============================
def run_travel_planner(user_request: str, previous_state: dict = None):
    # Si previous_state no se proporciona, inicializa el estado con valores por defecto
    if previous_state is None:
        state = {
            "messages": [user_request],
            "city": "",
            "interests": [],
            "trip_type": "",
            "itinerary": [],
            "questions": [],
            "response_type": "questions",
            "display_response": "",
            "language": ""
        }
    else:
        # Si existe un estado anterior, cárgalo y añade el nuevo mensaje del usuario
        state = previous_state
        state["messages"].append(user_request)

    # El resto del código se mantiene igual
    try:
        final_state = {}
        for step in app.stream(state):
            for node, node_state in step.items():
                final_state.update(node_state)
        print("✅ FINAL_STATE:", final_state)
        return final_state
    except Exception as e:
        print("❌ ERROR en run_travel_planner:", str(e))
        return {
            "response_type": "error",
            "city": state.get("city", ""),
            "interests": state.get("interests", []),
            "trip_type": state.get("trip_type", ""),
            "questions": [],
            "itinerary": [],
            "display_response": "Ocurrió un error al generar el itinerario." if "á" in user_request else "An error occurred while generating the itinerary."
        }