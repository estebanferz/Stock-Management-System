// @ts-check
import { defineConfig } from 'astro/config';

// Importa las integraciones que instalaste
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  // Define el modo de renderizado a "servidor" (SSR)
  output: 'server',
  adapter: node({ mode: "standalone" }),
  vite: {
    server: {
      host: true,
      port: 4321,              // importa que coincida con EXPOSE en Docker
      allowedHosts: [
        'ngrok-free.app',
        '.ngrok-free.app',     // permite cualquier subdominio dinámico
        'localhost',
        '0.0.0.0'
      ],
      strictPort: true        // evita que Vite cambie de puerto dentro de Docker
    }
  },

  // Configura las integraciones
  integrations: [// 1. Integración de Tailwind
  tailwind(), react()],
});