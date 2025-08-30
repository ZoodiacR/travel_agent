import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Send, AccountCircle, ExitToApp, Payment } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import MapComponent from "../components/MapComponent";
import "./Dashboard.css";

const BACKEND_URL = "http://localhost:8000";

const DashboardPage = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentState, setAgentState] = useState(null); // 📌 Estado del agente para la memoria
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

      // ✅ Nuevo payload con el estado anterior
      const payload = {
        user_input: userMessage.text,
        previous_state: agentState, // Enviamos el estado anterior para la memoria
      };

      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Error en la respuesta del servidor: ${res.status}`);
      }

      const data = await res.json();
      console.log("✅ Respuesta del backend (JSON):", data);

      // ✅ Guarda el nuevo estado del agente para la siguiente interacción
      setAgentState(data);
      console.log("✅ Estado del agente actualizado:", data);

      const agentResponse = {
        text: data.display_response,
        sender: "agent",
        type: data.response_type,
        questions: data.questions,
      };

      setMessages((prev) => [...prev, agentResponse]);
    } catch (error) {
      console.error("❌ Error en el fetch:", error);
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

  // 📌 Determina el itinerario a pasar al mapa
  const itinerary = agentState?.itinerary || [];
  console.log("✅ Itinerario pasado al mapa:", itinerary);

  return (
    <Box className="dashboard-grid">
      <Box className="map-container">
        {/* ✅ Pasa el itinerario al MapComponent */}
        <MapComponent itinerary={itinerary} />
      </Box>

      <Box className="chat-container">
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
                  {/* ✅ Renderiza el mensaje principal */}
                  <Typography variant="body1">{msg.text}</Typography>

                  {/* ✅ Renderiza las preguntas si existen */}
                  {msg.questions && Array.isArray(msg.questions) && msg.questions.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <List dense disablePadding>
                        {msg.questions.map((q, qIndex) => (
                          <ListItem key={qIndex} disableGutters>
                            <ListItemText secondary={`- ${q}`} />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Paper>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </Box>

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