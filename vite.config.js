import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sitemap from 'vite-plugin-sitemap';

const BASE_URL = process.env.BASE_URL || '';
const HOSTNAME = BASE_URL || 'http://localhost:5173';

console.log('Using base url', BASE_URL, 'hostname', HOSTNAME);

export default defineConfig({
  base: BASE_URL,
  esbuild: {
    jsxInject: `import React from 'react'`,
  },

  plugins: [
    react(),
    {
      name: 'manual-base-replacement',
      transformIndexHtml(html) {
        // For some reason, it doesn't work with %BASE_URL%, so let's replace it
        // ourselves.
        return html.replace(/%PUBLIC_URL%/g, BASE_URL || '.');
      },
    },
    sitemap({
      hostname: HOSTNAME,
    }),
  ],
});
