import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "streetmap_favoris";

function readFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

// Stockage local uniquement (pas de compte requis) — cohérent avec le fait
// que la carte doit rester entièrement utilisable sans être connecté.
export function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const isFavorite = useCallback((id) => favorites.has(id), [favorites]);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}
