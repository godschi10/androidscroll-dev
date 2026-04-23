// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://androidscroll.com',
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    plugins: [tailwindcss()]
  },
  image: {
    domains: ['androidscroll.com', 'images.androidscroll.com'],
  },
  integrations: [
    mdx(),
  ]
});
