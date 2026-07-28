import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    // The dev server runs in the compose network; the browser is on the host.
    // Polling because a bind-mounted volume does not deliver inotify events.
    watch: { usePolling: true },
    proxy: {
      // Same-origin in development, so there is no CORS configuration to get
      // wrong and no credentials to explain to the browser.
      '/v1': { target: 'http://server:3000', changeOrigin: true },
    },
  },
});
