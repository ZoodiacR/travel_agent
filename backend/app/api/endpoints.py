from fastapi import APIRouter, Depends, HTTPException, status,Request,Query
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Dict, Any
from ..core.security import create_access_token, get_current_user, authenticate_user
from fastapi.responses import JSONResponse
from ..core.agent import run_travel_planner


from google.oauth2 import id_token
from google.auth.transport import requests
import os
import traceback
from fastapi import Header
from typing import Optional


from langchain_core.messages import HumanMessage
import traceback


router = APIRouter()

# --- Endpoint de Autenticación de Google ---

class GoogleAuthRequest(BaseModel):
    token: str


# Define el modelo de datos para el cuerpo de la solicitud
class UserCreate(BaseModel):
    email: str
    password: str

@router.post("/users")
def create_user(user: UserCreate):
    # Aquí iría la lógica para crear un usuario en tu base de datos
    # Por ahora, simplemente devolvemos un mensaje de éxito
    print(f"Intento de registro de usuario: {user.email}")
    return {"message": f"Usuario {user.email} registrado exitosamente"}

# ... Tus otros endpoints, como el de Google, irían aquí



import traceback

@router.post("/auth/google")
async def google_auth(request: GoogleAuthRequest):
    try:
        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        print("DEBUG CLIENT_ID:", GOOGLE_CLIENT_ID)

        request_session = requests.Request()

        # Decodificación sin validar aud
        #decoded = id_token.verify_oauth2_token(request.token, request_session)
        #print("DEBUG AUD:", decoded.get("aud"))
        #print("DEBUG EMAIL:", decoded.get("email"))

        # Validación con tu CLIENT_ID
        idinfo = id_token.verify_oauth2_token(request.token, request_session, GOOGLE_CLIENT_ID)

        email = idinfo['email']
        user = {"username": email, "email": email}

        access_token = create_access_token(data={"sub": user["username"]})
        return {"access_token": access_token, "token_type": "bearer"}

    except ValueError as e:
        print("DEBUG ERROR ValueError:", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token de Google inválido: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        print("DEBUG ERROR Exception:", e)
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la autenticación de Google: {e}"
        )
# --- Endpoints de Autenticación Existentes ---

@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # ... (código existente del endpoint /token) ...
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Endpoint del Agente IA (Chat) ---

class ChatRequest(BaseModel):
    user_input: str


@router.get("/chat")
async def chat_with_agent(
    message: str = Query(..., description="Tu mensaje para el asistente de viajes"),
    city: str = Query(..., description="Ciudad a la que quieres viajar"),
    interests: List[str] = Query(..., description="Lista de intereses del usuario, separados por &interests="),
):
    """
    Endpoint GET para probar en Swagger fácilmente.
    Se reciben:
    - message: pregunta o solicitud del usuario
    - city: ciudad destino
    - interests: lista de intereses (varios parámetros ?interests=museos&interests=comida)
    """
    try:
        print("📩 Payload recibido:", {"message": message, "city": city, "interests": interests})

        result = run_travel_planner(message, city.strip(), interests)

        # fallback por si el agente falla
        if not isinstance(result, dict):
            result = {
                "response_type": "error",
                "city": city.strip(),
                "interests": interests,
                "questions": [],
                "itinerary": []
            }

        return JSONResponse(content=result)

    except Exception as e:
        print("❌ ERROR en chat_with_agent:", str(e))
        return JSONResponse(
            status_code=500,
            content={
                "response_type": "error",
                "city": city.strip(),
                "interests": interests,
                "questions": [],
                "itinerary": [],
                "error": str(e),
            }
        )