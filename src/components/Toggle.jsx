// Interrupteur réutilisable (filtres de statut, préférences de compte,
// connexion) — piste 44×26, bouton blanc qui glisse à droite quand actif.
export default function Toggle({ checked, onChange, label, ariaLabel }) {
  return (
    <label className="toggle-row">
      {label}
      <span className="toggle">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-label={ariaLabel || (typeof label === "string" ? label : undefined)}
        />
        <span className="toggle__track" aria-hidden="true">
          <span className="toggle__thumb" />
        </span>
      </span>
    </label>
  );
}
