// Envoie l'email d'alerte "nouvelle salle publiée" aux abonnés de la région
// FNSL ciblée. Appelée uniquement depuis /admin/alertes (AdminAlertsPage),
// jamais automatiquement — voir le plan pour le choix du déclenchement
// manuel. La sécurité réelle est ici (vérification JWT + email admin), pas
// côté client : masquer l'écran dans React n'empêche personne d'appeler
// cette fonction directement.
import { createClient } from "jsr:@supabase/supabase-js@2";
import { alertEmailHtml, alertEmailSubject, type AlertSalle } from "../_shared/alertEmail.ts";

// Garder synchronisé avec ADMIN_EMAIL dans src/config.js.
const ADMIN_EMAIL = "tailleferdsam@gmail.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
// Tant qu'aucun domaine n'est vérifié dans Resend, seul ce mode "sandbox"
// fonctionne (envoi limité à l'adresse du compte Resend lui-même) — à
// remplacer par une adresse @tondomaine.fr une fois le domaine vérifié.
const FROM_ADDRESS = "Street Map <onboarding@resend.dev>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") || "";
  // Client "identité" : vérifie qui appelle, sans jamais contourner les RLS.
  const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await callerClient.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return jsonResponse({ error: "Accès réservé à l'administrateur." }, 403);
  }

  let payload: { salle: AlertSalle & { id: string }; target_region: string | null; dry_run?: boolean };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Requête invalide." }, 400);
  }

  const { salle, target_region, dry_run } = payload;
  if (!salle?.id) return jsonResponse({ error: "Salle manquante." }, 400);

  // Client "privilégié" : seule cette fonction serveur peut lire les emails
  // (via le RPC security definer, dont l'exécution est révoquée pour
  // anon/authenticated en SQL — voir §4 du plan) et écrire l'historique.
  const adminClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (!dry_run) {
    const { data: existing } = await adminClient
      .from("salle_alerts")
      .select("salle_id")
      .eq("salle_id", salle.id)
      .maybeSingle();
    if (existing) {
      return jsonResponse({ error: "Une alerte a déjà été envoyée pour cette salle." }, 409);
    }
  }

  if (!target_region) {
    return jsonResponse({ recipient_count: 0, error_count: 0, message: "Région de la salle non déterminée : aucun envoi." });
  }

  const { data: recipients, error: rpcError } = await adminClient.rpc("get_alert_recipients", {
    target_region,
  });
  if (rpcError) return jsonResponse({ error: rpcError.message }, 500);

  if (!recipients || recipients.length === 0) {
    return jsonResponse({ recipient_count: 0, error_count: 0, message: "Aucun abonné dans cette région." });
  }

  // Prévisualisation "combien de personnes recevraient cet email" avant
  // l'envoi réel — ne déclenche ni email ni verrou de dédoublonnage.
  if (dry_run) {
    return jsonResponse({ recipient_count: recipients.length, error_count: 0 });
  }

  const subject = alertEmailSubject(salle);
  let successCount = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    const unsubscribeUrl = `${SUPABASE_URL}/functions/v1/unsubscribe?token=${recipient.unsubscribe_token}`;
    const html = alertEmailHtml(salle, unsubscribeUrl);

    let status = "ok";
    let errorMessage: string | null = null;
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: FROM_ADDRESS, to: recipient.email, subject, html }),
      });
      if (!res.ok) {
        status = "erreur";
        errorMessage = await res.text();
      } else {
        successCount += 1;
      }
    } catch (err) {
      status = "erreur";
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    if (errorMessage) errors.push(`${recipient.email} : ${errorMessage}`);

    await adminClient.from("email_log").insert({
      salle_id: salle.id,
      destinataire: recipient.email,
      statut: status,
      erreur: errorMessage,
    });
  }

  await adminClient.from("salle_alerts").insert({
    salle_id: salle.id,
    sent_by: user.id,
    region_targeted: target_region,
    recipient_count: successCount,
  });

  return jsonResponse({ recipient_count: successCount, error_count: errors.length, errors });
});
