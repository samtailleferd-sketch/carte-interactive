export function statusVariant(statut) {
  const s = (statut || "").toLowerCase();
  if (s.includes("à vérifier") || s.includes("a verifier")) return "unverified";
  if (s.includes("partenaire")) return "partner";
  if (s.includes("vérifi")) return "verified";
  return "test";
}

export const VARIANT_COLORS = {
  partner: "#ffb703",
  verified: "#4cc995",
  unverified: "#8a8d98",
  test: "#ff4d2e",
};

export function statusColor(statut) {
  return VARIANT_COLORS[statusVariant(statut)];
}
