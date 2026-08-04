// Désinscription en un clic depuis le lien présent dans chaque email
// d'alerte — volontairement publique (pas de connexion requise) : c'est
// l'attente standard d'un lien de désinscription. Le token identifie le
// profil sans jamais exposer ni exiger l'email en clair dans l'URL.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

function htmlResponse(body: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="fr"><body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#0f0f12;color:#e8e8ec;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
      <div style="max-width:420px;text-align:center;padding:24px;">${body}</div>
    </body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return htmlResponse("<p>Lien de désinscription invalide.</p>", 400);

  const adminClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await adminClient
    .from("profiles")
    .update({ alertes_locales_consent: false })
    .eq("unsubscribe_token", token)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return htmlResponse("<p>Lien de désinscription invalide ou déjà utilisé.</p>", 404);
  }

  return htmlResponse(
    "<p style='font-size:18px;font-weight:600;color:#fff;'>Tu ne recevras plus d'alertes de nouvelles salles.</p><p style='color:#a3a3ab;font-size:14px;'>Tu peux réactiver ces alertes à tout moment depuis ton compte Street Map.</p>"
  );
});
