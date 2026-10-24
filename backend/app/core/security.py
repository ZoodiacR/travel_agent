import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

# Configuración de JWT: sin valor por defecto, la app no arranca sin un secreto real
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY no está configurada. Defínela en backend/.env (ver .env.example).")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Lógica de seguridad
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Usuario de demo (solo para pruebas): se crea únicamente si sus credenciales vienen del entorno
users_db: dict[str, dict[str, str]] = {}
_demo_username = os.getenv("DEMO_USERNAME")
_demo_password = os.getenv("DEMO_PASSWORD")
if _demo_username and _demo_password:
    users_db[_demo_username] = {
        "username": _demo_username,
        "password": pwd_context.hash(_demo_password),
    }


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si el password en texto plano coincide con el hash."""
    return pwd_context.verify(plain_password, hashed_password)


def authenticate_user(username: str, password: str) -> dict | None:
    """Autentica a un usuario contra la base de datos fake."""
    user = users_db.get(username)
    if not user or not verify_password(password, user["password"]):
        return None
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Genera un JWT firmado con el secreto configurado."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    """Decodifica un JWT y devuelve el usuario actual."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except JWTError:
        raise credentials_exception
