// Suppression réelle et définitive du compte de l'appelant. Nécessite la clé
// service role (jamais exposée côté client, voir config.js) — même schéma de
// sécurité que send-salle-push : un client "appelant" avec le JWT reçu sert
// uniquement à identifier qui appelle (jamais à faire confiance à un id
// envoyé dans le corps de la requête), un client admin fait l'action
// privilégiée. Contrairement à send-salle-push (réservé à ADMIN_EMAIL), toute
// personne authentifiée peut appeler cette fonction, mais uniquement pour
// supprimer son propre compte.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

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

  if (!user) {
    return jsonResponse({ error: "Non authentifié." }, 401);
  }

  const adminClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const uid = user.id;

  // Nettoyage explicite des données liées avant de supprimer le compte
  // lui-même — ne dépend d'aucune cascade DB potentiellement absente selon
  // comment chaque table a été créée.
  await adminClient.from("salle_visites").delete().eq("user_id", uid);
  await adminClient.from("push_subscriptions").delete().eq("user_id", uid);
  // Les propositions déjà soumises (parfois déjà publiées sur la carte) ne
  // doivent pas disparaître parce que leur auteur supprime son compte —
  // seul le lien vers l'auteur est retiré.
  await adminClient.from("salle_propositions").update({ submitted_by: null }).eq("submitted_by", uid);
  await adminClient.storage.from("avatars").remove([`${uid}/avatar.jpg`]);
  await adminClient.from("profiles").delete().eq("id", uid);

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(uid);
  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 500);
  }

  return jsonResponse({ ok: true });
});
