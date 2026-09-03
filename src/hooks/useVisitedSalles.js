import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Donnée de profil (contrairement aux favoris, en localStorage) : marquer
// une salle comme visitée nécessite un compte. Prend l'id utilisateur en
// paramètre plutôt que d'appeler useAuth() ici, pour éviter un abonnement
// onAuthStateChange redondant sur les pages qui l'appellent déjà.
export function useVisitedSalles(userId) {
  const [visited, setVisited] = useState(new Set());
  const [loading, setLoading] = useState(!!userId);

  useEffect(() => {
    if (!supabase || !userId) {
      setVisited(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("salle_visites")
      .select("salle_id")
      .eq("user_id", userId)
      .then(({ data }) => {
        setVisited(new Set((data || []).map((row) => row.salle_id)));
        setLoading(false);
      });
  }, [userId]);

  const isVisited = useCallback((id) => visited.has(id), [visited]);

  const toggleVisited = useCallback(
    async (id) => {
      if (!supabase || !userId) return;
      if (visited.has(id)) {
        await supabase.from("salle_visites").delete().eq("user_id", userId).eq("salle_id", id);
        setVisited((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        await supabase.from("salle_visites").insert({ user_id: userId, salle_id: id });
        setVisited((prev) => new Set(prev).add(id));
      }
    },
    [userId, visited]
  );

  return { visited, isVisited, toggleVisited, loading };
}
