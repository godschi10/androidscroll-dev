import type { APIRoute } from 'astro';
import { getCategories, getPages } from '../lib/wp';

const SITE      = 'https://androidscroll.com';
const WP_API    = 'https://androidscroll.com/wp-json/wp/v2';
const AUTH      = 'Basic ' + btoa(`${import.meta.env.WP_USER}:${import.meta.env.WP_APP_PASS}`);

// ─── Paginated post fetch — no hardcoded cap ───────────────────────────────────
// Calls WP REST API in batches of 100 until all published posts are collected.
// X-WP-TotalPages tells us how many pages exist so we stop exactly on time.
async function getAllPosts(): Promise<{ slug: string; modified: string }[]> {
  const all: { slug: string; modified: string }[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${WP_API}/posts?per_page=100&page=${page}&_fields=slug,modified&status=publish`,
      { headers: { Authorization: AUTH } },
    );

    if (!res.ok) break;

    const batch: { slug: string; modified: string }[] = await res.json();
    if (!batch.length) break;

    all.push(...batch);

    const totalPages = Number(res.headers.get('X-WP-TotalPages') ?? 1);
    if (page >= totalPages) break;
    page++;
  }

  return all;
}

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
  const wpPageEntries = (pages as any[])
    .filter((p: any) => p.status === 'publish' && p.slug !== 'home')
    .map((p: any) => urlEntry(`${SITE}/${p.slug}/`, p.modified?.split('T')[0]));

  // All posts — no cap, paginated above
  const postEntries = posts.map((p) =>
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
