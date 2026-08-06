import { useEffect, useState } from "react";
import { resolveAssetUrl } from "../utils/assetUrl";

// Uniquement pour les photos (les vignettes vidéo continuent d'ouvrir leur
// lien externe dans un nouvel onglet, voir SalleDetailPage.jsx) — `photos`
// ne contient donc jamais d'entrée `type === "video"`.
export default function Lightbox({ photos, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const photo = photos[index];

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + photos.length) % photos.length);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [photos.length, onClose]);

  if (!photo) return null;

  return (
    <div className="lightbox" role="dialog" aria-label="Photo en plein écran" onClick={onClose}>
      <button className="lightbox__close" onClick={onClose} aria-label="Fermer">
        ×
      </button>

      {photos.length > 1 && (
        <button
          className="lightbox__nav lightbox__nav--prev"
          aria-label="Photo précédente"
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => (i - 1 + photos.length) % photos.length);
          }}
        >
          ‹
        </button>
      )}

      <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
        <img src={resolveAssetUrl(photo.url)} alt={photo.alt || ""} className="lightbox__image" />
        {(photo.legende || photo.credit) && (
          <figcaption className="lightbox__caption">
            {[photo.legende, photo.credit && `© ${photo.credit}`].filter(Boolean).join(" — ")}
          </figcaption>
        )}
      </figure>

      {photos.length > 1 && (
        <button
          className="lightbox__nav lightbox__nav--next"
          aria-label="Photo suivante"
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => (i + 1) % photos.length);
          }}
        >
          ›
        </button>
      )}
    </div>
  );
}
