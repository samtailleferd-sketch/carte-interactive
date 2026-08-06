const REPORT_EMAIL = "tailleferdsam@gmail.com";

// `message`/`email` optionnels : ReportModal les fournit (texte réellement
// saisi par l'utilisateur) ; sans eux, on retombe sur un gabarit à compléter
// (usage historique en lien direct, avant le formulaire).
export function reportErrorMailto(salle, { message, email } = {}) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const url = `${window.location.origin}${base}/#/salles/${salle.slug}`;
  const subject = `Signalement carte FNSL — ${salle.nom}`;
  const description = message?.trim() || "[décris ici ce qui est incorrect ou à mettre à jour]";
  const contact = email?.trim() ? `\n\nMe recontacter à : ${email.trim()}` : "";
  const body = `Bonjour,\n\nJe signale une information à corriger sur la fiche de "${salle.nom}" (${url}) :\n\n${description}${contact}\n\n`;
  return `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
