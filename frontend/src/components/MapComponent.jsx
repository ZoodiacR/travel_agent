import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

// Ícono del marcador de usuario
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png", // ícono simple
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const baseMaps = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  carto: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://www.carto.com/">CARTO</a>',
  },
};

// Hook para recentrar el mapa
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng]);
  return null;
}

export default function MapComponent({ itinerary = [] }) {
  const [mapType, setMapType] = useState("osm");
  const [userLocation, setUserLocation] = useState([51.505, -0.09]); // Default

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("No se pudo obtener la ubicación:", error);
        }
      );
    }
  }, []);

  return (
    <Box sx={{ position: "relative", height: "100%", width: "100%" }}>
      <MapContainer
        center={userLocation}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url={baseMaps[mapType].url}
          attribution={baseMaps[mapType].attribution}
        />
        <RecenterMap lat={userLocation[0]} lng={userLocation[1]} />

        {/* Marcador de ubicación del usuario */}
        <Marker position={userLocation} icon={userIcon} />

        {/* Ruta si hay itinerario */}
        {itinerary.length > 0 && <Polyline positions={itinerary} color="blue" />}
      </MapContainer>

      {/* Selector de mapas */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          right: 10,
          bgcolor: "white",
          borderRadius: 2,
          p: 1,
          boxShadow: 3,
          minWidth: 120,
        }}
      >
        <FormControl fullWidth size="small">
          <InputLabel>Mapa</InputLabel>
          <Select
            value={mapType}
            label="Mapa"
            onChange={(e) => setMapType(e.target.value)}
          >
            <MenuItem value="osm">OpenStreetMap</MenuItem>
            <MenuItem value="carto">Carto Light</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}
