import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { getMarkerInitials } from "../utils/markerInitials";
import { getMarkerColors } from "../utils/markerColors";
import ZonesLayer from "./ZonesLayer";

function markerIcon(salle, active) {
  const { primary, secondary, text } = getMarkerColors(salle);
  const size = active ? 34 : 28;
  const initials = getMarkerInitials(salle);
  const style =
    `--marker-color:${primary};--marker-border:${secondary};` +
    `--marker-text:${text};--marker-size:${size}px`;
  return L.divIcon({
    className: "gym-marker-icon",
    html: `<span class="gym-marker" style="${style}"><span class="gym-marker__label">${initials}</span></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

// Recentre sur la salle sélectionnée (clic marqueur ou carte-résultat) sans
// changer le niveau de zoom — l'utilisateur voit déjà la zone, inutile de
// forcer un zoom qui déplacerait le contexte visuel.
function FlyToSelection({ salle }) {
  const map = useMap();
  useEffect(() => {
    if (salle) {
      map.flyTo([salle.lat, salle.lng], map.getZoom(), { duration: 0.5 });
    }
  }, [salle, map]);
  return null;
}

// Boutons de zoom + recentrage custom (remplacent le contrôle Leaflet par
// défaut, pour matcher le style du design system). Vivent dans l'arbre de
// MapContainer pour avoir accès à l'instance de carte via useMap().
function MapControls({ onRecenter, locating, hasLocation }) {
  const map = useMap();
  return (
    <div className="map-controls">
      <div className="map-controls__zoom">
        <button type="button" onClick={() => map.zoomIn()} aria-label="Zoomer">
          +
        </button>
        <button type="button" onClick={() => map.zoomOut()} aria-label="Dézoomer">
          –
        </button>
      </div>
      {onRecenter && (
        <button
          type="button"
          className={`map-controls__recenter ${hasLocation ? "map-controls__recenter--active" : ""} ${
            locating ? "map-controls__recenter--locating" : ""
          }`}
          onClick={onRecenter}
          disabled={locating}
          aria-label="Ma position"
          title="Ma position"
        >
          {locating ? (
            <span className="map-controls__spinner" aria-hidden="true" />
          ) : (
            <svg className="map-controls__recenter-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <circle cx="12" cy="12" r="3.2" fill="currentColor" />
              <path
                d="M12 2v3.2M12 18.8V22M22 12h-3.2M5.2 12H2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
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
  // Plafonné pour éviter un cercle géant quand la précision est faible
  // (géoloc par IP sur desktop, parfois plusieurs km) ; pas de cercle du
  // tout en dessous de 30m, le point bleu suffit déjà à cette échelle.
  const accuracyRadius = userLocation.accuracy ? Math.min(userLocation.accuracy, 1500) : null;
  return (
    <>
      {accuracyRadius && accuracyRadius > 30 && (
        <Circle
          center={[userLocation.lat, userLocation.lng]}
          radius={accuracyRadius}
          pathOptions={{ color: "#4d9bff", weight: 1, fillColor: "#4d9bff", fillOpacity: 0.12, opacity: 0.35 }}
          interactive={false}
        />
      )}
      <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon} interactive={false} />
    </>
  );
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
  hoveredId,
  onSelect,
  showZones,
  initialView,
  onViewChange,
  userLocation,
  searchQuery,
  onRecenter,
  locating,
}) {
  const center = initialView?.center || [44.6, 5.6];
  const zoom = initialView?.zoom || 7;

  const selectedSalle = salles.find((s) => s.id === selectedId);

  return (
    <MapContainer center={center} zoom={zoom} className="map" scrollWheelZoom zoomControl={false}>
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
          icon={markerIcon(salle, salle.id === selectedId || salle.id === hoveredId)}
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
      <MapControls onRecenter={onRecenter} locating={locating} hasLocation={!!userLocation} />
    </MapContainer>
  );
}
