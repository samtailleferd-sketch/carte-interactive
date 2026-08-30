import { Link, useNavigate } from "react-router-dom";
import { useFavorites } from "../hooks/useFavorites";
import GymResultCard from "../components/GymResultCard";

// Stockage 100% local (voir useFavorites.js) — accessible sans compte,
// cohérent avec le fait que mettre une salle en favori ne nécessite pas
// de connexion ailleurs dans l'app.
export default function FavoritesPage({ salles, loading }) {
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const favoriteSalles = salles.filter((s) => favorites.has(s.id));

  return (
    <div className="account-page">
      <header className="detail-header">
        <Link to="/" className="detail-header__back">
          ← Retour à la carte
        </Link>
        <div className="detail-header__brand">
          <span className="app__brand-mark">Street</span>
          <span className="app__brand-sub">Map</span>
        </div>
      </header>

      <div className="account-page__content">
        <h1>Mes favoris</h1>

        {loading && <p className="account-page__hint">Chargement...</p>}

        {!loading && favoriteSalles.length === 0 && (
          <p className="account-page__hint">
            Aucune salle favorite pour l'instant. Explore la carte et appuie sur ♥ sur une salle pour l'enregistrer
            ici.
            <br />
            <Link to="/" className="app__hint-reset">
              Retourner à la carte
            </Link>
          </p>
        )}

        {!loading && favoriteSalles.length > 0 && (
          <div className="account-page__favorites-list">
            {favoriteSalles.map((salle) => (
              <GymResultCard key={salle.id} salle={salle} onClick={() => navigate(`/salles/${salle.slug}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
