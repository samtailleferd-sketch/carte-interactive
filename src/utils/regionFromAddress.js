import { zoneForDepartment } from "../data/fnslZones";

// Corse (2A/2B) et DOM-TOM (97x/98x) ne sont couverts par aucune zone FNSL
// (voir fnslZones.js) — un code postal commençant par ces préfixes ne peut
// donc jamais être rattaché à une région, par construction.
const CORSE_PREFIX = "20";

function departmentFromPostalCode(postalCode) {
  if (postalCode.startsWith("97") || postalCode.startsWith("98")) return null;
  if (postalCode.startsWith(CORSE_PREFIX)) return null;
  return postalCode.slice(0, 2);
}

// Extrait la région FNSL d'une salle à partir du code postal présent dans
// son adresse (ex. "12 Rue de la République, 13001 Marseille" → "Sud Est"),
// en réutilisant zoneForDepartment déjà utilisé pour colorer la carte des
// zones (ZonesLayer.jsx) — pas de géocodage, pas de service externe.
export function regionFromAddress(adresse) {
  const match = (adresse || "").match(/\b(\d{5})\b/);
  if (!match) return null;
  const department = departmentFromPostalCode(match[1]);
  if (!department) return null;
  return zoneForDepartment(department)?.name || null;
}
