# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import endpoints, payment
from .core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

# Configuración de CORS para permitir la comunicación con el frontend
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5173",
    "http://localhost:5174",




]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(endpoints.router,prefix="/api",tags=["api"])
app.include_router(payment.router,prefix="/api",tags=["api"])

@app.get("/")
def read_root():
    return {"message": "Welcome to TravelAgent-AI Backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)