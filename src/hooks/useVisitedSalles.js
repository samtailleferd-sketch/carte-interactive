import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const CHECKIN_THROTTLE_MS = 24 * 60 * 60 * 1000;

// Donnée de profil (contrairement aux favoris, en localStorage) : marquer
// une salle comme visitée nécessite un compte. Prend l'id utilisateur en
// paramètre plutôt que d'appeler useAuth() ici, pour éviter un abonnement
// onAuthStateChange redondant sur les pages qui l'appellent déjà.
//
// L'ajout d'une visite (checkIn) est volontairement limité à une par 24h —
// dissuasif, pas infaillible, mais empêche de cocher dix salles d'un coup
// depuis son canapé. Le retrait (removeVisited) reste libre, sans contrôle :
// se rétracter n'a pas besoin d'être vérifié.
export function useVisitedSalles(userId) {
  const [visited, setVisited] = useState(new Map());
  const [loading, setLoading] = useState(!!userId);

  useEffect(() => {
    if (!supabase || !userId) {
      setVisited(new Map());
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("salle_visites")
      .select("salle_id, created_at")
      .eq("user_id", userId)
      .then(({ data }) => {
        setVisited(new Map((data || []).map((row) => [row.salle_id, row.created_at])));
        setLoading(false);
      });
  }, [userId]);

  const isVisited = useCallback((id) => visited.has(id), [visited]);

  const checkIn = useCallback(
    async (id) => {
      if (!supabase || !userId) return { ok: false, reason: "no-user" };
      if (visited.has(id)) return { ok: true };

      const mostRecent = [...visited.values()].sort().at(-1);
      if (mostRecent && Date.now() - new Date(mostRecent).getTime() < CHECKIN_THROTTLE_MS) {
        return { ok: false, reason: "throttled" };
      }

      const { error } = await supabase.from("salle_visites").insert({ user_id: userId, salle_id: id });
      if (error) return { ok: false, reason: "error" };

      setVisited((prev) => new Map(prev).set(id, new Date().toISOString()));
      return { ok: true };
    },
    [userId, visited]
  );

  const removeVisited = useCallback(
    async (id) => {
      if (!supabase || !userId) return;
      await supabase.from("salle_visites").delete().eq("user_id", userId).eq("salle_id", id);
      setVisited((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    },
    [userId]
  );

  return { visited, isVisited, checkIn, removeVisited, loading };
}
