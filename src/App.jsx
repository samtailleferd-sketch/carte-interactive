import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./App.css";
import GymMap from "./components/GymMap";
import GymPanel from "./components/GymPanel";
import BetaBanner from "./components/BetaBanner";
import { fetchSalles } from "./data/fetchSalles";

function App() {
  const [salles, setSalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetchSalles()
      .then(setSalles)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return salles;
    return salles.filter(
      (s) => s.ville.toLowerCase().includes(q) || s.nom.toLowerCase().includes(q)
    );
  }, [query, salles]);

  const selectedSalle = salles.find((s) => s.id === selectedId) || null;

  return (
    <div className="app">
      <BetaBanner />

      <header className="app__header">
        <div className="app__brand">
          <span className="app__brand-mark">FNSL</span>
          <span className="app__brand-sub">Sud Est</span>
        </div>
        <div className="app__search">
          <input
            type="text"
            placeholder="Chercher une ville ou une salle..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <main className="app__body">
        <GymMap salles={filtered} selectedId={selectedId} onSelect={setSelectedId} />

        {selectedSalle && (
          <GymPanel salle={selectedSalle} onClose={() => setSelectedId(null)} />
        )}

        {!selectedSalle && !loading && (
          <p className="app__hint">
            {filtered.length} salle{filtered.length > 1 ? "s" : ""} affichée
            {filtered.length > 1 ? "s" : ""} — cliquez sur un point de la carte
          </p>
        )}

        {loading && <p className="app__hint">Chargement des salles...</p>}
      </main>
    </div>
  );
}

export default App;
