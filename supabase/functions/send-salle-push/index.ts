// Envoie la notification push "nouvelle salle publiée" aux abonnés de la
// région FNSL ciblée. Même sécurité et même déclenchement manuel que
// send-salle-alert (email) — voir ce fichier pour le raisonnement complet,
// non répété ici. Appelée en parallèle de send-salle-alert depuis
// /admin/alertes, jamais automatiquement.
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

// Garder synchronisé avec ADMIN_EMAIL dans src/config.js.
const ADMIN_EMAIL = "tailleferdsam@gmail.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
// mailto: requis par la spec VAPID (contact en cas d'abus signalé par un
// navigateur push provider), sans lien avec l'envoi d'email applicatif.
const VAPID_SUBJECT = "mailto:tailleferdsam@gmail.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

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
  const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await callerClient.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return jsonResponse({ error: "Accès réservé à l'administrateur." }, 403);
  }

  let payload: {
    salle: { id: string; nom: string; ville: string; slug: string };
    target_region: string | null;
    dry_run?: boolean;
  };
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Requête invalide." }, 400);
  }

  const { salle, target_region, dry_run } = payload;
  if (!salle?.id) return jsonResponse({ error: "Salle manquante." }, 400);

  const adminClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Même verrou anti-doublon que send-salle-alert (table salle_alerts
  // partagée entre les deux canaux) : le parcours admin envoie email + push
  // ensemble, une seule alerte doit jamais partir deux fois pour une même
  // salle, peu importe le canal appelé.
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

  const { data: recipients, error: rpcError } = await adminClient.rpc("get_push_recipients", {
    target_region,
  });
  if (rpcError) return jsonResponse({ error: rpcError.message }, 500);

  if (!recipients || recipients.length === 0) {
    return jsonResponse({ recipient_count: 0, error_count: 0, message: "Aucun abonné push dans cette région." });
  }

  if (dry_run) {
    return jsonResponse({ recipient_count: recipients.length, error_count: 0 });
  }

  const notificationPayload = JSON.stringify({
    title: "Nouvelle salle sur Street Map",
    body: `${salle.nom} (${salle.ville}) vient d'être publiée près de chez toi.`,
    url: `${Deno.env.get("SITE_URL") || ""}#/salles/${salle.slug}`,
  });

  let successCount = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    let status = "ok";
    let errorMessage: string | null = null;
    try {
      await webpush.sendNotification(
        { endpoint: recipient.endpoint, keys: { p256dh: recipient.p256dh, auth: recipient.auth } },
        notificationPayload
      );
      successCount += 1;
    } catch (err) {
      status = "erreur";
      errorMessage = err instanceof Error ? err.message : String(err);
      // 404/410 : l'abonnement n'est plus valide (désinstallation, expiration
      // navigateur...) — Web Push standard, on le retire pour ne plus
      // gaspiller d'envois dessus.
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await adminClient.from("push_subscriptions").delete().eq("endpoint", recipient.endpoint);
      }
    }

    if (errorMessage) errors.push(`${recipient.endpoint} : ${errorMessage}`);

    await adminClient.from("push_log").insert({
      salle_id: salle.id,
      endpoint: recipient.endpoint,
      statut: status,
      erreur: errorMessage,
    });
  }

  return jsonResponse({ recipient_count: successCount, error_count: errors.length, errors });
});
