import { Link, useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import GymImage from "../components/GymImage";
import FavoriteButton from "../components/FavoriteButton";
import { reportErrorMailto } from "../utils/report";
import { resolveAssetUrl } from "../utils/assetUrl";
import { useFavorites } from "../hooks/useFavorites";

function isRealLink(url) {
  return Boolean(url) && url !== "#";
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="detail-info-row">
      <span className="detail-info-row__label">{label}</span>
      <span className="detail-info-row__value">{value}</span>
    </div>
  );
}

function TagList({ items, emptyLabel }) {
  if (!items || items.length === 0) {
    return <p className="detail-section__empty">{emptyLabel}</p>;
  }
  return (
    <div className="detail-tags">
      {items.map((item) => (
        <span className="tag" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}

export default function SalleDetailPage({ salles, loading }) {
  const { slug } = useParams();
  const salle = salles.find((s) => s.slug === slug);
  const { isFavorite, toggleFavorite } = useFavorites();

  if (loading && !salle) {
    return (
      <div className="detail-page detail-page--state">
        <p>Chargement de la fiche...</p>
      </div>
    );
  }

  if (!salle) {
    return (
      <div className="detail-page detail-page--state">
        <p>Cette salle est introuvable ou n'est plus visible sur la carte.</p>
        <Link to="/" className="btn btn--primary">
          ← Retour à la carte
        </Link>
      </div>
    );
  }

  const directionsUrl =
    salle.google_maps_url || `https://www.google.com/maps/dir/?api=1&destination=${salle.lat},${salle.lng}`;

  return (
    <div className="detail-page">
      <header className="detail-header">
        <Link to="/" className="detail-header__back">
          ← Retour à la carte
        </Link>
        <div className="detail-header__brand">
          <span className="app__brand-mark">Street</span>
          <span className="app__brand-sub">Map</span>
        </div>
      </header>

      <div className="detail-hero">
        <GymImage
          src={salle.photoPrincipale}
          alt={salle.imageAlt}
          type={salle.imageType}
          nom={salle.nom}
          variant="hero"
        />
        <FavoriteButton
          active={isFavorite(salle.id)}
          onClick={() => toggleFavorite(salle.id)}
          className="detail-hero__favorite"
        />
        <div className="detail-hero__overlay">
          <div className="detail-hero__badges">
            <StatusBadge statut={salle.statut} />
            {salle.niveau_pertinence && <span className="badge badge--niveau">{salle.niveau_pertinence}</span>}
          </div>
          <h1>{salle.nom}</h1>
          <p className="detail-hero__ville">{salle.ville}</p>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-actions">
          <a className="btn btn--primary" href={directionsUrl} target="_blank" rel="noopener noreferrer">
            Itinéraire
          </a>
          {isRealLink(salle.site) && (
            <a className="btn" href={salle.site} target="_blank" rel="noopener noreferrer">
              Site web
            </a>
          )}
          {isRealLink(salle.instagram) && (
            <a className="btn btn--ghost" href={salle.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          )}
          {isRealLink(salle.reservation) && (
            <a className="btn btn--ghost" href={salle.reservation} target="_blank" rel="noopener noreferrer">
              Réserver
            </a>
          )}
        </div>

        {salle.descriptionLongue && (
          <section className="detail-section">
            <h2>Pourquoi cette salle est pertinente</h2>
            <p className="detail-section__text">{salle.descriptionLongue}</p>
          </section>
        )}

        <section className="detail-section">
          <h2>Équipements streetlifting</h2>
          <TagList
            items={salle.equipementsStreetlifting}
            emptyLabel="Aucun équipement streetlifting renseigné pour l'instant."
          />
        </section>

        <section className="detail-section">
          <h2>Équipements force</h2>
          <TagList
            items={salle.equipementsForce}
            emptyLabel="Aucun équipement force renseigné pour l'instant."
          />
        </section>

        <section className="detail-section">
          <h2>Informations pratiques</h2>
          <div className="detail-info-grid">
            <InfoRow label="Adresse" value={salle.adresse} />
            <InfoRow label="Horaires" value={salle.horaires} />
            <InfoRow label="Téléphone" value={salle.telephone} />
            <InfoRow label="Email" value={salle.email} />
            <InfoRow label="Conditions d'accès" value={salle.conditionsAcces} />
            <InfoRow label="Tarifs" value={salle.tarifs} />
          </div>
          {!salle.adresse && !salle.horaires && !salle.telephone && !salle.email && !salle.conditionsAcces && !salle.tarifs && (
            <p className="detail-section__empty">Informations pratiques pas encore renseignées.</p>
          )}
        </section>

        {(salle.coachingDisponible || salle.communaute) && (
          <section className="detail-section">
            <h2>Communauté et coaching</h2>
            <div className="detail-info-grid">
              <InfoRow label="Coaching disponible" value={salle.coachingDisponible} />
              <InfoRow label="Communauté" value={salle.communaute} />
            </div>
          </section>
        )}

        <section className="detail-section">
          <h2>Photos et vidéos</h2>
          {salle.photos && salle.photos.length > 0 ? (
            <div className="detail-gallery">
              {salle.photos.map((photo) => {
                const isVideo = photo.type === "video" && photo.lienExterne;
                return (
                  <a
                    key={photo.url}
                    href={isVideo ? photo.lienExterne : resolveAssetUrl(photo.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detail-gallery__figure"
                  >
                    <img
                      src={resolveAssetUrl(photo.url)}
                      alt={photo.alt || `${salle.nom} - photo`}
                      loading="lazy"
                      className="detail-gallery__item"
                    />
                    {isVideo && (
                      <span className="detail-gallery__play" aria-hidden="true">
                        ▶
                      </span>
                    )}
                    {(photo.legende || photo.credit) && (
                      <span className="detail-gallery__caption">
                        {[photo.legende, photo.credit && `© ${photo.credit}`].filter(Boolean).join(" — ")}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="detail-section__empty">Photos et vidéos à venir.</p>
          )}
        </section>

        <section className="detail-section detail-section--remarks">
          <h2>Remarques et vérification</h2>
          {salle.description && <p className="detail-section__text">{salle.description}</p>}
          <div className="detail-info-grid">
            <InfoRow label="Dernière vérification" value={salle.dateDerniereVerification} />
            <InfoRow label="Source" value={salle.sourceInformation} />
          </div>
          <p className="detail-disclaimer">
            Informations non garanties par la FNSL Sud Est — susceptibles d'évoluer, à vérifier avant de vous déplacer.
          </p>
          <a href={reportErrorMailto(salle)} className="detail-report-link">
            Signaler une erreur sur cette fiche
          </a>
        </section>

        <Link to="/" className="btn btn--full detail-back-bottom">
          ← Retour à la carte
        </Link>
      </div>
    </div>
  );
}
