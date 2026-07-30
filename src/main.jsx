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
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
