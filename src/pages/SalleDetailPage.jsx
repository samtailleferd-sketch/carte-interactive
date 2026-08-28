import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import GymImage from "../components/GymImage";
import Lightbox from "../components/Lightbox";
import ReportModal from "../components/ReportModal";
import { resolveAssetUrl } from "../utils/assetUrl";
import { useFavorites } from "../hooks/useFavorites";
import { instagramHandle } from "../utils/instagram";

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

function TagList({ items, emptyLabel, primary }) {
  if (!items || items.length === 0) {
    return <p className="detail-section__empty">{emptyLabel}</p>;
  }
  return (
    <div className={`detail-tags ${primary ? "detail-tags--primary" : ""}`}>
      {items.map((item) => (
        <span className="tag" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}

// Grande photo à gauche + jusqu'à deux petites à droite (une seule case si
// une seule photo dispo, aucune mosaïque si le seul visuel est un logo).
function PhotoMosaic({ salle, photosOnly, onOpen }) {
  if (photosOnly.length === 0) {
    return (
      <div className="detail-mosaic detail-mosaic--single">
        <div className="detail-mosaic__main">
          <GymImage
            src={salle.photoPrincipale}
            alt={salle.imageAlt}
            type={salle.imageType}
            nom={salle.nom}
            variant="preview"
          />
        </div>
      </div>
    );
  }

  if (photosOnly.length === 1) {
    return (
      <div className="detail-mosaic detail-mosaic--single">
        <button type="button" className="detail-mosaic__main" onClick={() => onOpen(0)}>
          <img src={resolveAssetUrl(photosOnly[0].url)} alt={photosOnly[0].alt || salle.nom} loading="lazy" />
        </button>
      </div>
    );
  }

  const [main, ...rest] = photosOnly;
  const side = rest.slice(0, 2);
  const extraCount = photosOnly.length - 1 - side.length;

  return (
    <div className="detail-mosaic">
      <button type="button" className="detail-mosaic__main" onClick={() => onOpen(0)}>
        <img src={resolveAssetUrl(main.url)} alt={main.alt || salle.nom} loading="lazy" />
      </button>
      {side.map((photo, i) => {
        const isLast = i === side.length - 1;
        return (
          <button type="button" className="detail-mosaic__side" key={photo.url} onClick={() => onOpen(i + 1)}>
            <img src={resolveAssetUrl(photo.url)} alt={photo.alt || salle.nom} loading="lazy" />
            {isLast && extraCount > 0 && (
              <span className="detail-mosaic__more">
                <span className="detail-mosaic__more-badge">+{extraCount} photos</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function SalleDetailPage({ salles, loading }) {
  const { slug } = useParams();
  const salle = salles.find((s) => s.slug === slug);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showReport, setShowReport] = useState(false);

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
  const photosOnly = (salle.photos || []).filter((p) => !(p.type === "video" && p.lienExterne));
  const favorite = isFavorite(salle.id);

  const stats = [
    salle.niveau_pertinence && { label: "Pertinence", value: salle.niveau_pertinence },
    salle.prixSeance && { label: "Prix à la séance", value: `${salle.prixSeance} €` },
    salle.horaires && { label: "Horaires", value: salle.horaires },
    { label: "Zone FNSL", value: "Sud Est" },
  ].filter(Boolean);

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

      <div className="detail-content">
        <PhotoMosaic salle={salle} photosOnly={photosOnly} onOpen={setLightboxIndex} />

        <div className="detail-identity">
          <div className="detail-identity__top">
            <div className="detail-identity__main">
              <div className="detail-identity__badges">
                <StatusBadge statut={salle.statut} />
                {salle.dateDerniereVerification && (
                  <span className="badge badge--verified">Vérifiée le {salle.dateDerniereVerification}</span>
                )}
              </div>
              <h1>{salle.nom}</h1>
              <p className="detail-identity__ville">{salle.ville}{salle.adresse ? ` — ${salle.adresse}` : ""}</p>
              {isRealLink(salle.instagram) && instagramHandle(salle.instagram) && (
                <a
                  className="detail-instagram-link"
                  href={salle.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {instagramHandle(salle.instagram)}
                </a>
              )}
            </div>
            <button
              type="button"
              className="detail-favorite-btn"
              onClick={() => toggleFavorite(salle.id)}
              aria-pressed={favorite}
            >
              <span className="detail-favorite-btn__icon">{favorite ? "❤️" : "🤍"}</span>
              <span className="detail-favorite-btn__label">Enregistrer</span>
            </button>
          </div>

          {stats.length > 0 && (
            <div className="stat-strip">
              {stats.map((s) => (
                <div className="stat-strip__item" key={s.label}>
                  <div className="stat-strip__value">{s.value}</div>
                  <div className="stat-strip__label">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="detail-actions">
            <a className="btn btn--primary" href={directionsUrl} target="_blank" rel="noopener noreferrer">
              Itinéraire
            </a>
            {isRealLink(salle.site) && (
              <a className="btn" href={salle.site} target="_blank" rel="noopener noreferrer">
                Site web
              </a>
            )}
            {salle.telephone && (
              <a className="btn" href={`tel:${salle.telephone}`} title={salle.telephone}>
                Appeler
              </a>
            )}
            {isRealLink(salle.reservation) && (
              <a className="btn btn--ghost" href={salle.reservation} target="_blank" rel="noopener noreferrer">
                Réserver
              </a>
            )}
          </div>
        </div>

        {salle.descriptionLongue && (
          <section className="detail-section">
            <h2>Pourquoi cette salle est pertinente</h2>
            <p className="detail-section__text">{salle.descriptionLongue}</p>
          </section>
        )}

        <div className="detail-section-grid">
          <section className="detail-section">
            <h2>Équipements streetlifting</h2>
            <TagList
              items={salle.equipementsStreetlifting}
              emptyLabel="Aucun équipement streetlifting renseigné pour l'instant."
              primary
            />
          </section>

          <section className="detail-section">
            <h2>Équipements force</h2>
            <TagList
              items={salle.equipementsForce}
              emptyLabel="Aucun équipement force renseigné pour l'instant."
            />
          </section>
        </div>

        <section className="detail-section">
          <h2>Informations pratiques</h2>
          <div className="detail-info-grid">
            <InfoRow label="Adresse" value={salle.adresse} />
            <InfoRow label="Horaires" value={salle.horaires} />
            <InfoRow label="Téléphone" value={salle.telephone} />
            <InfoRow label="Email" value={salle.email} />
            <InfoRow label="Conditions d'accès" value={salle.conditionsAcces} />
            <InfoRow label="Tarifs" value={salle.tarifs} />
            <InfoRow label="Prix à la séance (sans abonnement)" value={salle.prixSeance && `${salle.prixSeance} €`} />
            <InfoRow label="Coaching disponible" value={salle.coachingDisponible} />
            <InfoRow label="Communauté" value={salle.communaute} />
          </div>
          {!salle.adresse &&
            !salle.horaires &&
            !salle.telephone &&
            !salle.email &&
            !salle.conditionsAcces &&
            !salle.tarifs &&
            !salle.prixSeance &&
            !salle.coachingDisponible &&
            !salle.communaute && <p className="detail-section__empty">Informations pratiques pas encore renseignées.</p>}
        </section>

        <section className="detail-section">
          <h2>Photos et vidéos</h2>
          {salle.photos && salle.photos.length > 0 ? (
            <div className="detail-gallery">
              {salle.photos.map((photo) => {
                const isVideo = photo.type === "video" && photo.lienExterne;
                const caption = (photo.legende || photo.credit) && (
                  <span className="detail-gallery__caption">
                    {[photo.legende, photo.credit && `© ${photo.credit}`].filter(Boolean).join(" — ")}
                  </span>
                );

                if (isVideo) {
                  return (
                    <a
                      key={photo.url}
                      href={photo.lienExterne}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="detail-gallery__figure"
                    >
                      <img
                        src={resolveAssetUrl(photo.url)}
                        alt={photo.alt || `${salle.nom} - vidéo`}
                        loading="lazy"
                        className="detail-gallery__item"
                      />
                      <span className="detail-gallery__play" aria-hidden="true">
                        ▶
                      </span>
                      {caption}
                    </a>
                  );
                }

                const photoIndex = photosOnly.indexOf(photo);
                return (
                  <button
                    key={photo.url}
                    type="button"
                    className="detail-gallery__figure"
                    onClick={() => setLightboxIndex(photoIndex)}
                  >
                    <img
                      src={resolveAssetUrl(photo.url)}
                      alt={photo.alt || `${salle.nom} - photo`}
                      loading="lazy"
                      className="detail-gallery__item"
                    />
                    {caption}
                  </button>
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
          <button type="button" className="detail-report-link" onClick={() => setShowReport(true)}>
            Signaler une erreur sur cette fiche
          </button>
        </section>

        <Link to="/" className="btn btn--full detail-back-bottom">
          ← Retour à la carte
        </Link>
      </div>

      {lightboxIndex !== null && (
        <Lightbox photos={photosOnly} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      {showReport && <ReportModal salle={salle} onClose={() => setShowReport(false)} />}
    </div>
  );
}
