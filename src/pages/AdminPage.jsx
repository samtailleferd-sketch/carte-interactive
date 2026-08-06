import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ADMIN_EMAIL } from "../config";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div className="admin-alerts-page">
      <header className="detail-header">
        <Link to="/" className="detail-header__back">
          ← Retour à la carte
        </Link>
        <div className="detail-header__brand">
          <span className="app__brand-mark">Street</span>
          <span className="app__brand-sub">Map</span>
        </div>
      </header>

      <div className="admin-alerts-page__content">
        <h1>Admin</h1>

        {loading && <p className="account-page__hint">Chargement...</p>}
        {!loading && !isAdmin && <p className="account-page__hint">Accès réservé à l'administrateur.</p>}

        {!loading && isAdmin && (
          <ul className="admin-alerts-page__list">
            <li className="admin-alerts-page__item">
              <Link to="/admin/alertes" className="admin-alerts-page__item-nom">
                Alertes email →
              </Link>
              <p className="admin-alerts-page__item-meta">Prévisualiser et envoyer les alertes de nouvelles salles.</p>
            </li>
            <li className="admin-alerts-page__item">
              <Link to="/admin/propositions" className="admin-alerts-page__item-nom">
                Salles proposées →
              </Link>
              <p className="admin-alerts-page__item-meta">Consulter et valider les salles proposées par la communauté.</p>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
