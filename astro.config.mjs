// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://androidscroll.com',
  vite: {
    plugins: [tailwindcss()]
  },
  image: {
    domains: ['androidscroll.com', 'images.androidscroll.com'],
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/live/') &&
        !page.includes('/search/') &&
        !page.includes('/subscribe/')
    })
  ]
});
