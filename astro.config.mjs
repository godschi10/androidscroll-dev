// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const _require = createRequire(import.meta.url);

/** Recursively collect source file contents for PurgeCSS */
function collectSources(dir, exts = ['.astro', '.ts', '.js', '.tsx', '.jsx', '.html']) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectSources(full, exts));
    } else if (exts.includes(extname(entry.name))) {
      results.push({ raw: readFileSync(full, 'utf-8'), extension: extname(entry.name).slice(1) });
    }
  }
  return results;
}

function vitePurgeCss() {
  /** @type {import('vite').Plugin} */
  return {
    name: 'vite-purgecss',
    apply: 'build',
    async generateBundle(_options, bundle) {
      const purgecssPkgPath = _require.resolve('purgecss/lib/purgecss.js');
      const { PurgeCSS } = await import(pathToFileURL(purgecssPkgPath).href);

      const srcDir = join(process.cwd(), 'src');
      const content = collectSources(srcDir);

      const cssChunks = Object.entries(bundle).filter(([, chunk]) =>
        chunk.type === 'asset' && chunk.fileName.endsWith('.css')
      );

      for (const [key, chunk] of cssChunks) {
        if (chunk.type !== 'asset') continue;
        const source = typeof chunk.source === 'string' ? chunk.source : chunk.source.toString();

        if (source.length < 10_000) continue;

        const [result] = await new PurgeCSS().purge({
          content,
          css: [{ raw: source }],
          safelist: {
            pattern: /^(wp-block-|alignleft|alignright|aligncenter|alignwide|alignfull|has-|is-style-|post-content)/,
            greedy: [/^wp-/],
          },
          keyframes: false,
          variables: false,
        });

        // @ts-ignore
        bundle[key] = { ...chunk, source: result.css };
      }
    },
  };
}

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
    plugins: [
      tailwindcss(),
      vitePurgeCss(),
    ],
    build: {
      cssCodeSplit: true,
    },
  },
  image: {
    domains: ['androidscroll.com', 'images.androidscroll.com'],
  },
  integrations: [
    mdx(),
  ]
});

