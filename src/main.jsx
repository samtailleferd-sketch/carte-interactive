import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// HashRouter plutôt que BrowserRouter : GitHub Pages ne sait pas rediriger
// une URL profonde (ex. /salles/vitrolles) vers index.html côté serveur
// (contrairement à Netlify avec son fichier _redirects). Le routage par hash
// (#/salles/vitrolles) reste 100% côté client, donc aucune configuration
// serveur n'est nécessaire.
//
// Supabase redirige parfois vers cette page avec des paramètres d'auth
// directement après le "#" (ex. #error=... si un lien de connexion a expiré),
// au lieu d'un vrai chemin de l'app (#/...). HashRouter interpréterait ça
// comme une route inconnue -> page blanche. On nettoie ce cas avant le
// montage de React, en gardant le message d'erreur pour l'afficher proprement
// dans l'app plutôt que de laisser un écran noir.
const rawHash = window.location.hash.slice(1);
if (rawHash.startsWith('error=')) {
  const params = new URLSearchParams(rawHash);
  const description = params.get('error_description');
  if (description) {
    sessionStorage.setItem('authError', description.replace(/\+/g, ' '));
  }
  window.location.hash = '#/';
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
