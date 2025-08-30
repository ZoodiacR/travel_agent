import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Box, FormControl, InputLabel, Select, MenuItem, Typography } from "@mui/material";
// NOTE: format and es are not used, can be removed to clean up imports
import { format } from "date-fns";
import es from "date-fns/locale/es";

// Configuración del ícono por defecto de Leaflet (esto ya lo tienes)
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Ícono del marcador de usuario
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

// Función para crear un ícono de itinerario personalizado
const createItineraryIcon = (name, time, day) => {
  const formattedDay = `Día ${day}`;
  const formattedTime = `${time}`;
  const iconHtml = `
    <div style="background-color: #3388ff; color: white; padding: 5px 10px; border-radius: 5px; white-space: nowrap; font-weight: bold; font-size: 12px; position: relative; top: 12px; text-align: center;">
        <span style="display: block; font-size: 10px;">${formattedDay}</span>
        <span style="display: block; font-size: 12px;">${formattedTime}</span>
        <span style="display: block; font-size: 12px;">${name}</span>
    </div>
  `;

  return new L.DivIcon({
    className: "custom-div-icon",
    html: iconHtml,
    iconSize: [120, 50], // Ajusta el tamaño para que quepa todo el texto
    iconAnchor: [60, 25],
    popupAnchor: [0, -25],
  });
};

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

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, map.getZoom() || 13);
    }
  }, [center, map]);
  return null;
}

export default function MapComponent({ itinerary = [] }) {
  console.log("🔍 Recibiendo itinerario en MapComponent:", itinerary);

  const [mapType, setMapType] = useState("osm");
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([48.8566, 2.3522]); // Default a París

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = [position.coords.latitude, position.coords.longitude];
          setUserLocation(userPos);
          setMapCenter(userPos); // Centrar el mapa en el usuario
        },
        (error) => {
          console.error("No se pudo obtener la ubicación:", error);
        }
      );
    }
  }, []);

  // ✅ Actualizar el centro del mapa al generar un itinerario
  useEffect(() => {
    if (itinerary.length > 0) {
      const firstPoint = itinerary[0];
      console.log("🔍 Primer punto del itinerario:", firstPoint);

      if (typeof firstPoint.lat === 'number' && typeof firstPoint.lng === 'number' && !isNaN(firstPoint.lat) && !isNaN(firstPoint.lng)) {
        setMapCenter([firstPoint.lat, firstPoint.lng]);
        console.log("🗺️ Centrando mapa en:", [firstPoint.lat, firstPoint.lng]);
      } else {
        console.error("❌ Coordenadas del primer punto no válidas:", firstPoint);
      }
    } else if (userLocation) {
      setMapCenter(userLocation);
    }
  }, [itinerary, userLocation]);

  const itineraryPositions = itinerary.map(item => [item.lat, item.lng]);
  console.log("🔍 itineraryPositions:", itineraryPositions);

  return (
    <Box sx={{ position: "relative", height: "100%", width: "100%" }}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url={baseMaps[mapType].url}
          attribution={baseMaps[mapType].attribution}
        />
        <RecenterMap center={mapCenter} />

        {userLocation && <Marker position={userLocation} icon={userIcon} />}

        {/* ✅ Marcadores del itinerario */}
        {itinerary.map((item, index) => {
          // 📌 Paso 6: Verificamos cada item antes de renderizar
          if (item.lat && item.lng && typeof item.lat === 'number' && typeof item.lng === 'number') {
            console.log(`📍 Renderizando marcador para: ${item.name} en [${item.lat}, ${item.lng}]`);
            return (
              <Marker
                key={index}
                position={[item.lat, item.lng]}
                icon={createItineraryIcon(item.name, item.time, item.day)}
              >
                <Popup>
                  <Typography variant="h6">{item.name}</Typography>
                  <Typography variant="body2">
                    Día {item.day}, {item.time}
                  </Typography>
                  <Typography variant="body2">{item.description}</Typography>
                </Popup>
              </Marker>
            );
          } else {
            console.error(`❌ Item de itinerario inválido en el índice ${index}:`, item);
            return null; // No renderizamos marcadores con datos inválidos
          }
        })}

        {/* ✅ Ruta del itinerario */}
        {itineraryPositions.length > 1 && <Polyline positions={itineraryPositions} color="#007bff" weight={5} />}
      </MapContainer>

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
          zIndex: 1000
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