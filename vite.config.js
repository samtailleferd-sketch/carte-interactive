import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// GitHub Pages sert ce projet sous /carte-interactive/ (pas à la racine du
// domaine), il faut donc indiquer ce préfixe à Vite pour que les assets
// buildés (JS/CSS) soient référencés au bon endroit. Le build Capacitor
// (app native, voir capacitor.config.ts) sert les fichiers depuis la racine
// de son propre bac à sable — d'où ce préfixe conditionnel, sans toucher au
// build GitHub Pages par défaut (`npm run build`, celui utilisé par le
// déploiement CI).
export default defineConfig({
  base: process.env.BUILD_TARGET === 'capacitor' ? '/' : '/carte-interactive/',
  plugins: [
    react(),
    // manifest.json et les meta tags iOS de index.html sont déjà écrits à
    // la main et corrects (icônes, couleurs, start_url) — ce plugin ne sert
    // ici qu'à générer et enregistrer le service worker, seule pièce
    // manquante pour l'installabilité PWA (voir plan "Street Map sur
    // téléphone"). `autoUpdate` recharge automatiquement la nouvelle
    // version dès qu'elle est détectée, pour ne jamais servir un ancien
    // build en cache après un déploiement.
    VitePWA({
      manifest: false,
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      },
    }),
  ],
})
