import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
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

const userLocationIcon = L.divIcon({
  className: "user-location-icon",
  html: '<span class="user-location-dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function UserLocationMarker({ userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], Math.max(map.getZoom(), 12), { duration: 0.6 });
    }
  }, [userLocation, map]);

  if (!userLocation) return null;
  return <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon} interactive={false} />;
}

function ViewTracker({ onViewChange }) {
  useMapEvents({
    moveend(e) {
      if (!onViewChange) return;
      const map = e.target;
      const center = map.getCenter();
      onViewChange({ center: [center.lat, center.lng], zoom: map.getZoom() });
    },
  });
  return null;
}

// Retire le petit crédit "Leaflet" ajouté par défaut par la librairie — pas
// une obligation légale (contrairement à OpenStreetMap/CARTO ci-dessous, qui
// doivent rester visibles pour respecter leurs conditions d'utilisation
// gratuites).
function RemoveLeafletPrefix() {
  const map = useMap();
  useEffect(() => {
    map.attributionControl.setPrefix(false);
  }, [map]);
  return null;
}

// Leaflet ne détecte pas automatiquement un changement de taille de son
// conteneur (ex. repli/dépli de la sidebar de filtres) — seul un resize de
// la fenêtre déclenche un recalcul. On observe donc le conteneur directement.
function MapResizeObserver() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export default function GymMap({ salles, selectedId, onSelect, showZones, initialView, onViewChange, userLocation }) {
  const center = initialView?.center || [44.6, 5.6];
  const zoom = initialView?.zoom || 7;

  const selectedSalle = salles.find((s) => s.id === selectedId);

  return (
    <MapContainer center={center} zoom={zoom} className="map" scrollWheelZoom>
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
      <UserLocationMarker userLocation={userLocation} />
      <ViewTracker onViewChange={onViewChange} />
      <MapResizeObserver />
      <RemoveLeafletPrefix />
    </MapContainer>
  );
}
