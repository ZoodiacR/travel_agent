import os
import stripe
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from ..core.security import get_current_user

router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class PaymentIntentRequest(BaseModel):
    plan: str

@router.post("/create-payment-intent")
async def create_payment_intent(request: PaymentIntentRequest, current_user: str = Depends(get_current_user)):
    """
    Crea un PaymentIntent en Stripe para un plan específico.
    """
    plans = {
        "plan1": {"amount": 300, "tokens": 5000, "currency": "usd"}, # 3.00 USD
        "plan2": {"amount": 700, "tokens": 15000, "currency": "usd"}, # 7.00 USD
    }

    if request.plan not in plans:
        raise HTTPException(status_code=400, detail="Plan no válido")

    plan_info = plans[request.plan]

    try:
        intent = stripe.PaymentIntent.create(
            amount=plan_info["amount"],
            currency=plan_info["currency"],
            metadata={"user_id": current_user, "tokens": plan_info["tokens"]},
        )
        return {"clientSecret": intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Endpoint para recibir eventos de webhook de Stripe.
    Valida el evento y procesa los pagos exitosos.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET")
        )
    except ValueError as e:
        # Payload inválido
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Firma de webhook inválida
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Maneja los eventos de pago
    if event.type == "payment_intent.succeeded":
        payment_intent = event.data.object
        print("Pago exitoso para:", payment_intent.metadata.user_id)
        # Aquí actualizas la base de datos del usuario, otorgando los tokens
        # (ej. db.add_tokens_to_user(user_id, payment_intent.metadata.tokens))

    return {"status": "success"}