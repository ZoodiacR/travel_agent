import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Box, TextField, Button, Typography, Paper, Link, CircularProgress, Alert } from '@mui/material';
import { motion } from "framer-motion";


const MotionPaper = motion(Paper);

const BACKEND_URL = "http://localhost:8000";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const formBody = new URLSearchParams();
        formBody.append("username", email);
        formBody.append("password", password);

        const response = await fetch(`${BACKEND_URL}/api/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formBody.toString(),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Credenciales incorrectas");
        }

        const data = await response.json();
        localStorage.setItem("access_token", data.access_token);
        navigate('/dashboard');

      } else {
        const response = await fetch(`${BACKEND_URL}/api/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email, password: password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Error en el registro");
        }

        const data = await response.json();
        console.log("Registro exitoso:", data);
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    setError(null);
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: response.credential }),
      });

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        throw new Error(errorData.detail || "Autenticación de Google fallida en el backend");
      }

      const data = await backendResponse.json();
      localStorage.setItem("access_token", data.access_token);
      navigate('/dashboard');

    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Fallo en el inicio de sesión con Google. Por favor, inténtalo de nuevo.");
    console.error("Fallo en el inicio de sesión con Google.");
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
      <MotionPaper
    elevation={6}
    sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f0f2f5',
        p: 2,
      }}

  >
        <Paper elevation={6} sx={{ p: 4, borderRadius: 2, width: { xs: '100%', sm: 400 } }}>
          <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
            Travel Agent AI
          </Typography>
          <Typography variant="h6" align="center" mb={3}>
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleAuth}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              margin="normal"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
            </Button>
          </Box>
          <Typography align="center" my={2}>
            O
          </Typography>
          <Box display="flex" justifyContent="center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? '¿No tienes una cuenta? Regístrate' : '¿Ya tienes una cuenta? Inicia sesión'}
            </Link>
          </Box>
        </Paper>
      </MotionPaper>
    </Box>
  );
};

export default AuthPage;