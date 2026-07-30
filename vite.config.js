import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// GitHub Pages sert ce projet sous /carte-interactive/ (pas à la racine du
// domaine), il faut donc indiquer ce préfixe à Vite pour que les assets
// buildés (JS/CSS) soient référencés au bon endroit.
export default defineConfig({
  base: '/carte-interactive/',
  plugins: [react()],
})
