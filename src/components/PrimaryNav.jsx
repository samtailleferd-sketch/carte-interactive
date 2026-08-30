import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Routes volontairement exclues de la navigation globale : les écrans
// d'administration (usage interne) et la page pro "Référencer votre salle"
// (accessible uniquement par lien direct, jamais depuis la navigation —
// voir le commentaire dans ReferencerSallePage.jsx).
function isHidden(pathname) {
  return pathname.startsWith("/admin") || pathname === "/referencer-votre-salle";
}

const ICONS = {
  carte: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Z" strokeLinejoin="round" />
      <path d="M9 4v13M15 6.5v13" />
    </svg>
  ),
  filtres: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  ),
  proposer: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  ),
  favoris: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path
        d="M12 20.2s-7.5-4.6-9.6-9.1C1.2 8.3 2.6 5 6 5c2 0 3.3 1.1 4 2.3C10.7 6.1 12 5 14 5c3.4 0 4.8 3.3 3.6 6.1-2.1 4.5-9.6 9.1-9.6 9.1Z"
        strokeLinejoin="round"
      />
    </svg>
  ),
  profil: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M4.5 20c1.2-3.6 4.2-5.5 7.5-5.5s6.3 1.9 7.5 5.5" strokeLinecap="round" />
    </svg>
  ),
};

export default function PrimaryNav() {
  const location = useLocation();
  const { user } = useAuth();

  if (isHidden(location.pathname)) return null;

  return (
    <nav className="primary-nav" aria-label="Navigation principale">
      <NavLink to="/" end className="primary-nav__item">
        {ICONS.carte}
        <span>Carte</span>
      </NavLink>

      <Link to="/?openFilters=1" className="primary-nav__item">
        {ICONS.filtres}
        <span>Filtres</span>
      </Link>

      <NavLink to="/proposer" className="primary-nav__item">
        {ICONS.proposer}
        <span>Proposer</span>
      </NavLink>

      <NavLink to="/favoris" className="primary-nav__item">
        {ICONS.favoris}
        <span>Favoris</span>
      </NavLink>

      <NavLink to="/compte" className="primary-nav__item">
        {ICONS.profil}
        <span>{user ? "Compte" : "Profil"}</span>
      </NavLink>
    </nav>
  );
}
