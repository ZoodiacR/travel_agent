# TravelAgent-AI

**TravelAgent-AI** es un agente de viajes impulsado por IA que utiliza un LLM local (Ollama) con fallback a OpenAI para crear planes de viaje personalizados.

## Características

- **Backend**: FastAPI, LangGraph, LangChain.
- **Frontend**: React, Material-UI, Framer Motion.
- **Autenticación**: JWT y Google OAuth.
- **Pagos**: Integración con Stripe Checkout.
- **RAG**: Agente de Recuperación Aumentada (RAG) con Pinecone para información contextual.

## Requisitos

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

## Instalación

1.  **Clona el repositorio**:
    ```bash
    git clone [https://github.com/tu-usuario/travel-agent-ai.git](https://github.com/tu-usuario/travel-agent-ai.git)
    cd travel-agent-ai
    ```

2.  **Configura las variables de entorno**:
    Copia los archivos de ejemplo para crear tus archivos `.env`.

    ```bash
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```

3.  **Completa las variables de entorno**:
    Edita los archivos `.env` y `.env` con tus claves API.

    -   `backend/.env`: `OPENAI_API_KEY`, `PINECONE_API_KEY`, `JWT_SECRET_KEY`, `STRIPE_SECRET_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
    -   `frontend/.env`: `REACT_APP_STRIPE_PUBLISHABLE_KEY`.

4.  **Inicia los servicios con Docker Compose**:
    Este comando construirá las imágenes y levantará todos los contenedores.

    ```bash
    docker compose up --build
    ```

5.  **Instala el modelo Llama 3 (8B) en Ollama**  
    Una vez que el contenedor de Ollama esté corriendo, necesitas descargar el modelo para que el backend pueda usarlo:

    ```bash
    docker exec -it ollama-llm ollama pull llama3:8b
    ```

    > ⚠️ Este paso es obligatorio. Si no lo haces, obtendrás un error de tipo  
    `model "llama3" not found, try pulling it first`.

6.  **Accede a la aplicación**:
    -   **Frontend**: `http://localhost:3000`
    -   **Backend**: `http://localhost:8000`

## Guía para Vender la Aplicación (Stripe)

Si planeas vender esta aplicación, es crucial que reemplaces las claves de prueba de Stripe por las de producción.

1.  **Obtén tus claves de producción de Stripe**:
    -   Inicia sesión en tu [Dashboard de Stripe](https://dashboard.stripe.com/).
    -   Ve a **Developers > API keys**.
    -   Copia la **clave publicable** (que empieza con `pk_live_...`) y la **clave secreta** (que empieza con `sk_live_...`).

2.  **Actualiza los archivos `.env`**:
    -   En `frontend/.env`, reemplaza el valor de `REACT_APP_STRIPE_PUBLISHABLE_KEY` con tu clave de producción.
    -   En `backend/.env`, reemplaza el valor de `STRIPE_SECRET_KEY` con tu clave de producción.

3.  **Configura los Webhooks**:
    -   En tu Dashboard de Stripe, ve a **Developers > Webhooks**.
    -   Agrega un endpoint de webhook que apunte a la URL de tu backend para manejar los eventos de pago (p. ej., `payment_intent.succeeded`).
    -   Copia la **clave secreta del webhook** (que empieza con `whsec_...`) y agrégala a tu `backend/.env` en la variable `STRIPE_WEBHOOK_SECRET`. Esto es vital para verificar que las solicitudes provienen de Stripe.

¡Listo! Con esto, tu aplicación estará lista para procesar pagos reales.
