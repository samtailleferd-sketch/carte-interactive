export function statusVariant(statut) {
  const s = (statut || "").toLowerCase();
  if (s.includes("à vérifier") || s.includes("a verifier")) return "unverified";
  if (s.includes("partenaire")) return "partner";
  if (s.includes("vérifi")) return "verified";
  return "test";
}

export const VARIANT_COLORS = {
  partner: "#3d7fff",
  verified: "#4cc995",
  unverified: "#8a8d98",
  test: "#ef4136",
};

export function statusColor(statut) {
  return VARIANT_COLORS[statusVariant(statut)];
}
