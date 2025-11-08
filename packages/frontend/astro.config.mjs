// @ts-check
import { defineConfig } from 'astro/config';

// Importa las integraciones que instalaste
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  // Define el modo de renderizado a "servidor" (SSR)
  output: 'server',
  adapter: node({ mode: "standalone" }),

  // Configura las integraciones
  integrations: [
    // 1. Integración de Tailwind
    tailwind(),
  ],
});