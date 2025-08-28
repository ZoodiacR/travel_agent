import React, { useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

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

export default function MapComponent() {
  const [mapType, setMapType] = useState("osm");

  return (
    <Box sx={{ position: "relative", height: "100%", width: "100%" }}>
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url={baseMaps[mapType].url}
          attribution={baseMaps[mapType].attribution}
        />
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
