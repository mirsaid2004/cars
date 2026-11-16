import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Netlify exposes the site's address as URL at build time. Social crawlers
// need absolute links, so it is stamped into index.html here.
const siteUrl = (process.env.URL || '').replace(/\/$/, '')
const stampSiteUrl = {
  name: 'stamp-site-url',
  transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
}

export default defineConfig({
  plugins: [react(), stampSiteUrl],
  server: { port: 5173, host: true },
})
