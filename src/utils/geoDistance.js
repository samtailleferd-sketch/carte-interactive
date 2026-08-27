const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Distance à vol d'oiseau entre deux points (formule de haversine), en km.
export function distanceKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// "à 450 m" en dessous d'1 km, "à 2,4 km" au-dessus — format court adapté à
// une fiche salle plutôt qu'un calcul d'itinéraire précis.
export function formatDistance(km) {
  if (km < 1) return `à ${Math.round(km * 1000)} m`;
  return `à ${km.toFixed(1).replace(".", ",")} km`;
}
