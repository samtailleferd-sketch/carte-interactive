function initials(nom) {
  const words = (nom || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function GymImage({ src, alt, type, nom, variant = "preview" }) {
  const className = `gym-image gym-image--${variant}`;

  if (src) {
    return (
      <div className={className}>
        <img
          src={src}
          alt={alt || nom}
          className={type === "logo" ? "gym-image__img gym-image__img--contain" : "gym-image__img gym-image__img--cover"}
        />
      </div>
    );
  }

  return (
    <div className={`${className} gym-image--placeholder`} aria-hidden="true">
      <span className="gym-image__initials">{initials(nom)}</span>
    </div>
  );
}
