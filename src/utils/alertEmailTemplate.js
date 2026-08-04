import { SITE_URL } from "../config";

// Quelques équipements clés à mettre en avant plutôt que la liste complète
// (un email doit rester lisible en quelques secondes sur mobile).
const MAX_EQUIPEMENTS = 5;

export function alertEmailSubject(salle) {
  return `Nouvelle salle ajoutée sur Street Map : ${salle.nom} à ${salle.ville}`;
}

// HTML complet de l'email, y compris le lien de désinscription. `unsubscribeUrl`
// est propre à chaque destinataire (token) : cette fonction sert à la fois à
// la prévisualisation admin (URL factice "#") et à send-salle-alert, qui la
// rappelle une fois par destinataire avec sa vraie URL de désinscription.
export function alertEmailHtml(salle, unsubscribeUrl = "#") {
  const salleUrl = `${SITE_URL}#/salles/${salle.slug}`;
  const equipements = (salle.equipements || []).slice(0, MAX_EQUIPEMENTS);

  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#0f0f12;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#e8e8ec;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f12;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background:#17171c;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 24px 0;">
                <span style="font-size:20px;font-weight:700;color:#ff4d2e;">Street</span><span style="font-size:20px;font-weight:700;color:#e8e8ec;">Map</span>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 0;">
                <h1 style="font-size:18px;margin:0 0 4px;color:#fff;">Nouvelle salle publiée</h1>
                <p style="margin:0;font-size:15px;color:#a3a3ab;">Une salle vient d'être ajoutée dans ta région FNSL.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 0;">
                <table role="presentation" width="100%" style="background:#1f1f26;border-radius:10px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0 0 6px;font-size:17px;font-weight:600;color:#fff;">${salle.nom}</p>
                      <p style="margin:0 0 2px;font-size:14px;color:#c7c7cf;">${salle.ville}</p>
                      <p style="margin:0 0 10px;font-size:13px;color:#8a8d98;">${salle.adresse || ""}</p>
                      <p style="margin:0 0 4px;font-size:13px;color:#c7c7cf;">Statut : ${salle.statut}</p>
                      ${
                        salle.niveau_pertinence
                          ? `<p style="margin:0 0 4px;font-size:13px;color:#c7c7cf;">Pertinence streetlifting : ${salle.niveau_pertinence}</p>`
                          : ""
                      }
                      ${
                        equipements.length > 0
                          ? `<p style="margin:8px 0 0;font-size:13px;color:#c7c7cf;">Équipements : ${equipements.join(", ")}</p>`
                          : ""
                      }
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 0;" align="center">
                <a href="${salleUrl}" style="display:inline-block;background:#ff4d2e;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border-radius:8px;">Voir la salle</a>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px 0;" align="center">
                <a href="${SITE_URL}" style="color:#8a8d98;font-size:13px;">Ouvrir la carte complète</a>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 24px;border-top:1px solid #26262e;margin-top:20px;">
                <p style="margin:16px 0 0;font-size:12px;color:#6b6b73;">
                  Tu reçois cet email car tu as choisi de suivre les nouvelles salles de ta région FNSL sur Street Map.
                  <a href="${unsubscribeUrl}" style="color:#8a8d98;">Se désinscrire de ces alertes</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
