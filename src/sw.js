import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

// Remplace le service worker généré automatiquement (mode `generateSW`) —
// nécessaire pour pouvoir écouter les événements `push`/`notificationclick`,
// que Workbox ne gère pas lui-même. `self.__WB_MANIFEST` est l'emplacement
// où vite-plugin-pwa injecte la liste des fichiers à précacher (stratégie
// `injectManifest`, voir vite.config.js) — il doit rester tel quel.
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Street Map", body: event.data.text() };
  }

  const iconUrl = new URL("icons/icon-192.png", self.registration.scope).href;

  event.waitUntil(
    self.registration.showNotification(payload.title || "Street Map", {
      body: payload.body || "",
      icon: iconUrl,
      badge: iconUrl,
      data: { url: payload.url || self.registration.scope },
    })
  );
});

// Au clic sur la notification : ramène un onglet déjà ouvert au premier
// plan s'il y en a un, sinon en ouvre un nouveau — comportement standard
// attendu pour une PWA installée.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || self.registration.scope;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
