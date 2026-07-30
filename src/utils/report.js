const REPORT_EMAIL = "tailleferdsam@gmail.com";

export function reportErrorMailto(salle) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const url = `${window.location.origin}${base}/#/salles/${salle.slug}`;
  const subject = `Signalement carte FNSL — ${salle.nom}`;
  const body = `Bonjour,\n\nJe signale une information à corriger sur la fiche de "${salle.nom}" (${url}) :\n\n[décris ici ce qui est incorrect ou à mettre à jour]\n\n`;
  return `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
