// src/pages/DashboardPage.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { Send, AccountCircle, ExitToApp, Payment } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MapComponent from "../components/MapComponent"; // asegúrate de la ruta
import "./Dashboard.css";

const BACKEND_URL = "http://localhost:8000";

const DashboardPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("No se encontró el token. Inicia sesión primero.");
      }

      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_input: input }),
      });

      if (!res.ok) {
        throw new Error(`Error en la respuesta del servidor: ${res.status}`);
      }

     const data = await res.json();
     console.log("Respuesta backend:", data);

     const agentResponse = {
        text: data.content,
        sender: "agent",
        type: data.response_type
        };


      setMessages((prev) => [...prev, agentResponse]);
    } catch (error) {
      console.error("Error en el fetch:", error);
      const errorMessage = {
        text: "⚠️ Error al conectar con el servidor",
        sender: "agent",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/");
  };

  const handlePayment = () => {
    navigate("/payment");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Box className="dashboard-grid">
      {/* Columna del mapa */}
      <Box className="map-container">
        <MapComponent />
      </Box>

      {/* Columna del chat */}
      <Box className="chat-container">
        {/* Botones arriba */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1, gap: 1 }}>
          <IconButton sx={{ color: "text.secondary" }}>
            <AccountCircle />
          </IconButton>
          <IconButton onClick={handlePayment} sx={{ color: "text.secondary" }}>
            <Payment />
          </IconButton>
          <IconButton onClick={handleLogout} sx={{ color: "text.secondary" }}>
            <ExitToApp />
          </IconButton>
        </Box>

        {/* Mensajes */}
        <Box sx={{ flexGrow: 1, overflowY: "auto", p: 1 }}>
          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    bgcolor:
                      msg.sender === "user" ? "primary.main" : "grey.300",
                    color: msg.sender === "user" ? "white" : "black",
                    textAlign: msg.sender === "user" ? "right" : "left",
                    borderRadius: "20px",
                    borderBottomRightRadius: msg.sender === "user" ? 0 : 20,
                    borderBottomLeftRadius: msg.sender === "user" ? 20 : 0,
                  }}
                >
                  <Typography variant="body1">{msg.text}</Typography>
                </Paper>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box
          component="form"
          onSubmit={sendMessage}
          sx={{ display: "flex", gap: 1, mt: 2 }}
        >
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Escribe un mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ borderRadius: "50%", minWidth: "48px", height: "48px" }}
          >
            {loading ? <CircularProgress size={24} /> : <Send />}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardPage;
