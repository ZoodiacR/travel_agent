from fastapi import APIRouter, Depends, HTTPException, status,Request,Query
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Dict, Any
from ..core.security import create_access_token, get_current_user, authenticate_user, oauth2_scheme
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


user_sessions: Dict[str, dict] = {}

# Define el esquema de seguridad
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")


# ✅ Nuevo modelo de solicitud, ahora solo con el input del usuario
class ChatRequest(BaseModel):
    user_input: str


@router.post("/chat")
async def chat_with_agent(
        request: ChatRequest,
        token: str = Depends(oauth2_scheme)
):
    """
    Endpoint para chatear con el planificador de viajes.
    El estado de la conversación se gestiona en el backend.
    """
    try:
        # 1. Recupera el estado anterior de la "base de datos" de sesiones.
        # Si no existe (primera vez), previous_state será None.
        previous_state = user_sessions.get(token, None)

        print(f"📩 Payload recibido: user_input='{request.user_input}', previous_state={previous_state}")

        # 2. Llama a la función del agente con el estado recuperado.
        result = run_travel_planner(
            user_request=request.user_input,
            previous_state=previous_state
        )

        # 3. Guarda el nuevo estado del agente para futuras interacciones.
        user_sessions[token] = result

        # 4. Asegura que la respuesta sea un diccionario válido.
        if not isinstance(result, dict):
            return JSONResponse(
                status_code=500,
                content={
                    "response_type": "error",
                    "display_response": "Ocurrió un error inesperado.",
                    "itinerary": [],
                    "questions": [],
                    "city": "",
                    "interests": [],
                    "trip_type": ""
                }
            )

        # 5. Devuelve el estado final al frontend.
        return JSONResponse(content=result)

    except Exception as e:
        print("❌ ERROR en chat_with_agent:", str(e))
        # ✅ Retorna un error 500 para errores internos.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ocurrió un error interno en el servidor: {e}"
        )