import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

// Expose la session utilisateur courante + sa ligne "profiles" associée à
// toute l'app. Tolère l'absence de Supabase configuré (supabase === null) :
// dans ce cas user/profile restent null et loading passe à false — la carte
// continue de fonctionner normalement pour un visiteur non connecté.
export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!!supabase);

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

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      loadProfile(session?.user?.id);
    });

    return () => subscription.subscription.unsubscribe();
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(user?.id), [loadProfile, user]);

  return { user, profile, loading, refreshProfile };
}
