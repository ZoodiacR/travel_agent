import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Paper, Alert, CircularProgress, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';

const BACKEND_URL =  "http://localhost:8000";

const PaymentPage = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('plan1'); // Default plan

  const plans = [
    { value: 'plan1', label: 'Plan Básico (5000 tokens - $3.00 USD)' },
    { value: 'plan2', label: 'Plan Premium (15000 tokens - $7.00 USD)' },
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    const cardElement = elements.getElement(CardElement);
    const token = localStorage.getItem("access_token");

    try {
      // 1. Crear PaymentIntent en el backend
      const response = await fetch(`${BACKEND_URL}/api/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al crear la intención de pago.");
      }

      const { clientSecret } = await response.json();

      // 2. Confirmar el pago en el frontend con Stripe.js
      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              // Puedes añadir detalles del cliente si los tienes
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === "succeeded") {
        setSuccess("¡Pago exitoso! Tus tokens han sido añadidos.");
        // Redirigir al dashboard o mostrar un mensaje de éxito
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setError(`Estado del pago: ${paymentIntent.status}`);
      }

    } catch (err) {
      setError(err.message);
      console.error("Error en el pago:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
        p: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Paper elevation={6} sx={{ p: 4, borderRadius: 2, width: { xs: '100%', sm: 500 } }}>
          <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
            Realizar Pago
          </Typography>
          <Typography variant="body1" align="center" mb={3}>
            Selecciona un plan para adquirir más tokens.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="plan-select-label">Seleccionar Plan</InputLabel>
              <Select
                labelId="plan-select-label"
                value={selectedPlan}
                label="Seleccionar Plan"
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                {plans.map((plan) => (
                  <MenuItem key={plan.value} value={plan.value}>
                    {plan.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ border: '1px solid #ccc', borderRadius: 1, p: 2, mt: 3, mb: 2 }}>
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !stripe || !elements}
            >
              {loading ? <CircularProgress size={24} /> : 'Pagar'}
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default PaymentPage;