import { defineConfig } from 'vite'
// On GitHub Pages the site lives under /<repo>/; the workflow passes the repo name in BASE_PATH.
export default defineConfig({ base: process.env.BASE_PATH || '/' })
