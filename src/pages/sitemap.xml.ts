import type { APIRoute } from 'astro';
import { getAllPosts, getCategories, getPages } from '../lib/wp';

const SITE = 'https://androidscroll.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildCategoryPath(cat: any, allCats: any[]): string {
  if (!cat.parent) return cat.slug;
  const parent = allCats.find((c: any) => c.id === cat.parent);
  if (!parent) return cat.slug;
  return `${buildCategoryPath(parent, allCats)}/${cat.slug}`;
}

function urlEntry(loc: string, lastmod?: string | null): string {
  return `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
}

// ─── Route ────────────────────────────────────────────────────────────────────
// FIX: getAllPosts() now comes from wp.ts so it shares the build-time cache with
// [slug].astro — previously this file had its own duplicate function that caused
// a second full paginated fetch on every build.
export const GET: APIRoute = async () => {
  const [posts, categories, pages] = await Promise.all([
    getAllPosts(),
    getCategories(),
    getPages(),
  ]);

  // Homepage — static, always first
  const staticEntries = [
    urlEntry(`${SITE}/`),
  ];

  // WP pages (start-here, privacy-policy, any future pages) — fully dynamic
  // Slugs matching robots.txt Disallow rules are excluded from the sitemap
  const DISALLOWED_SLUGS = new Set(['offer', 'search', 'subscribe']);
  const wpPageEntries = (pages as any[])
    .filter((p: any) => p.status === 'publish' && p.slug !== 'home' && !DISALLOWED_SLUGS.has(p.slug))
    .map((p: any) => urlEntry(`${SITE}/${p.slug}/`, p.modified?.split('T')[0]));

  // All posts — no cap, comes from shared cached getAllPosts()
  const postEntries = (posts as any[]).map((p: any) =>
    urlEntry(`${SITE}/${p.slug}/`, p.modified?.split('T')[0] ?? null),
  );

  // Category archive pages — non-empty only
  const categoryEntries = (categories as any[])
    .filter((c: any) => c.slug !== 'uncategorized' && c.count > 0)
    .map((c: any) =>
      urlEntry(`${SITE}/category/${buildCategoryPath(c, categories)}/`),
    );

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...staticEntries,
    ...wpPageEntries,
    ...postEntries,
    ...categoryEntries,
    `</urlset>`,
  ].join('\n');

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
