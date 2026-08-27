import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { statusColor } from "../statusStyle";
import { getMarkerInitials } from "../utils/markerInitials";
import ZonesLayer from "./ZonesLayer";

function markerIcon(salle, active) {
  const color = statusColor(salle.statut);
  const size = active ? 30 : 24;
  const initials = getMarkerInitials(salle);
  return L.divIcon({
    className: "gym-marker-icon",
    html: `<span class="gym-marker" style="--marker-color:${color};--marker-size:${size}px">${initials}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyToSelection({ salle }) {
  const map = useMap();
  useEffect(() => {
    if (salle) {
      map.flyTo([salle.lat, salle.lng], Math.max(map.getZoom(), 13), { duration: 0.6 });
    }
  }, [salle, map]);
  return null;
}

// Recentre/zoome automatiquement sur les résultats d'une recherche texte
// (ville ou nom de salle) pour donner un vrai contexte local — une seule
// salle trouvée : zoom serré dessus ; plusieurs : la carte cadre l'ensemble.
// Débounce court pour ne pas faire voler la carte à chaque lettre tapée, et
// ne se déclenche que sur un changement du texte de recherche lui-même (pas
// sur les autres filtres, ni sur le simple fait que la liste change).
function SearchFocus({ query, salles }) {
  const map = useMap();
  useEffect(() => {
    const trimmed = (query || "").trim();
    if (!trimmed || salles.length === 0) return undefined;

    const timer = setTimeout(() => {
      if (salles.length === 1) {
        map.flyTo([salles[0].lat, salles[0].lng], 13, { duration: 0.7 });
      } else {
        const bounds = L.latLngBounds(salles.map((s) => [s.lat, s.lng]));
        map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 13, duration: 0.7 });
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, map]);
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

export default function GymMap({
  salles,
  selectedId,
  onSelect,
  showZones,
  initialView,
  onViewChange,
  userLocation,
  searchQuery,
}) {
  const center = initialView?.center || [44.6, 5.6];
  const zoom = initialView?.zoom || 7;

  const selectedSalle = salles.find((s) => s.id === selectedId);

  return (
    <MapContainer center={center} zoom={zoom} className="map" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {showZones && <ZonesLayer />}
      {salles.map((salle) => (
        <Marker
          key={salle.id}
          position={[salle.lat, salle.lng]}
          icon={markerIcon(salle, salle.id === selectedId)}
          alt={salle.nom}
          title={salle.nom}
          eventHandlers={{ click: () => onSelect(salle.id) }}
        />
      ))}
      <FlyToSelection salle={selectedSalle} />
      <SearchFocus query={searchQuery} salles={salles} />
      <UserLocationMarker userLocation={userLocation} />
      <ViewTracker onViewChange={onViewChange} />
      <MapResizeObserver />
      <RemoveLeafletPrefix />
    </MapContainer>
  );
}
