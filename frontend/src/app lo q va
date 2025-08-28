// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import PaymentPage from './pages/PaymentPage'; // Importa la nueva página de pago
import { Elements } from '@stripe/react-stripe-js'; // Importa Elements
import { loadStripe } from '@stripe/stripe-js'; // Importa loadStripe

// Remueve las líneas de las constantes y cámbialas por:
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);


function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Elements stripe={stripePromise}> {/* Envuelve tu aplicación con Elements */}
        <Router>
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/payment" element={<PaymentPage />} /> {/* Nueva ruta para pago */}
          </Routes>
        </Router>
      </Elements>
    </GoogleOAuthProvider>
  );
}

export default App;