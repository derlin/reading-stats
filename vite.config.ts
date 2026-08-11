import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sitemap from 'vite-plugin-sitemap';

const BASE_URL = process.env.BASE_URL || '';
const HOSTNAME = BASE_URL || 'http://localhost:5173';

export default defineConfig({
  base: BASE_URL,
  plugins: [react(), sitemap({ hostname: HOSTNAME })],
  server: {
    host: '0.0.0.0',
  },
});
