import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

// Choisies dans AuthModal avant que le compte n'existe (le lien de connexion
// par email ramène l'utilisateur sur une nouvelle page, sans l'état du
// composant d'origine) — on les récupère ici juste après la connexion.
export const PENDING_CONSENT_KEY = "streetmap_pending_consent";

async function applyPendingConsent(userId) {
  const raw = localStorage.getItem(PENDING_CONSENT_KEY);
  if (!raw || !userId) return;
  localStorage.removeItem(PENDING_CONSENT_KEY);
  try {
    await supabase.from("profiles").upsert({ id: userId, ...JSON.parse(raw) });
  } catch {
    // Préférences non-bloquantes : une fiche profile minimale sans elles
    // reste utilisable, l'utilisateur peut les régler sur /compte.
  }
}

// Expose la session utilisateur courante + sa ligne "profiles" associée à
// toute l'app. Tolère l'absence de Supabase configuré (supabase === null) :
// dans ce cas user/profile restent null et loading passe à false — la carte
// continue de fonctionner normalement pour un visiteur non connecté.
export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!supabase);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const loadProfile = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    setProfile(data || null);
  }, []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      loadProfile(session?.user?.id).finally(() => setLoading(false));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null);
      if (event === "SIGNED_IN") {
        await applyPendingConsent(session?.user?.id);
      }
      // Émis par Supabase quand l'utilisateur arrive via un lien "mot de
      // passe oublié" — MapPage.jsx ouvre alors AuthModal directement en
      // mode "nouveau mot de passe" plutôt que la connexion normale.
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
      }
      loadProfile(session?.user?.id);
    });

    return () => subscription.subscription.unsubscribe();
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(user?.id), [loadProfile, user]);

  const clearPasswordRecovery = useCallback(() => setPasswordRecovery(false), []);

  return { user, profile, loading, refreshProfile, passwordRecovery, clearPasswordRecovery };
}
