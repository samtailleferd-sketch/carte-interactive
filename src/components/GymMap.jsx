import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { statusColor } from "../statusStyle";
import ZonesLayer from "./ZonesLayer";

function markerIcon(statut, active) {
  const color = statusColor(statut);
  const size = active ? 34 : 26;
  return L.divIcon({
    className: "gym-marker-icon",
    html: `<span class="gym-marker" style="--marker-color:${color};--marker-size:${size}px"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

function FlyToSelection({ salle }) {
  const map = useMap();
  useEffect(() => {
    if (salle) {
      map.flyTo([salle.lat, salle.lng], Math.max(map.getZoom(), 11), { duration: 0.6 });
    }
  }, [salle, map]);
  return null;
}

export default function GymMap({ salles, selectedId, onSelect, showZones }) {
  const center = [44.6, 5.6]; // centre approximatif Sud Est

  const selectedSalle = salles.find((s) => s.id === selectedId);

  return (
    <MapContainer center={center} zoom={7} className="map" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {showZones && <ZonesLayer />}
      {salles.map((salle) => (
        <Marker
          key={salle.id}
          position={[salle.lat, salle.lng]}
          icon={markerIcon(salle.statut, salle.id === selectedId)}
          eventHandlers={{ click: () => onSelect(salle.id) }}
        />
      ))}
      <FlyToSelection salle={selectedSalle} />
    </MapContainer>
  );
}
