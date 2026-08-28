export function statusVariant(statut) {
  const s = (statut || "").toLowerCase();
  if (s.includes("à vérifier") || s.includes("a verifier")) return "unverified";
  if (s.includes("partenaire")) return "partner";
  if (s.includes("vérifi")) return "verified";
  return "test";
}

export const VARIANT_COLORS = {
  partner: "#4d9bff",
  verified: "#22e58a",
  unverified: "#8a93a3",
  test: "#ff5347",
};

export function statusColor(statut) {
  return VARIANT_COLORS[statusVariant(statut)];
}
