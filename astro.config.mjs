// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

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
    sitemap({
      filter: (page) =>
        !page.includes('/live/') &&
        !page.includes('/search/') &&
        !page.includes('/subscribe/') &&
        !page.includes('/offer/') &&
        !page.includes('/privacy-policy/') &&
        !page.includes('/cookie-policy/') &&
        !page.includes('/disclaimer/') &&
        !page.includes('/comments-policy/') &&
        !page.includes('/contact/') &&
        !page.includes('/about-androidscroll/') &&
        page !== 'https://androidscroll.com/category/'
    })
  ]
});
