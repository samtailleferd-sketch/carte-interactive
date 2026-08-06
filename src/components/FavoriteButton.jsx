export default function FavoriteButton({ active, onClick, className = "" }) {
  return (
    <button
      type="button"
      className={`favorite-button ${active ? "favorite-button--active" : ""} ${className}`}
      onClick={onClick}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
    >
      {active ? "❤️" : "🤍"}
    </button>
  );
}
