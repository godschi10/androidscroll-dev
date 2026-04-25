import type { APIRoute } from 'astro';
import { getPosts, getCategories } from '../lib/wp';

function buildCategoryPath(cat: any, allCats: any[]): string {
  if (!cat.parent) return cat.slug;
  const parent = allCats.find((c: any) => c.id === cat.parent);
  if (!parent) return cat.slug;
  return `${buildCategoryPath(parent, allCats)}/${cat.slug}`;
}

export const GET: APIRoute = async () => {
  const [posts, categories] = await Promise.all([
    getPosts(100),
    getCategories(),
  ]);

  const staticPages = [
    'https://androidscroll.com/',
    'https://androidscroll.com/start-here/',
  ];

  const postUrls = posts.map((post: any) => ({
    url: `https://androidscroll.com/${post.slug}/`,
    lastmod: post.modified?.split('T')[0] ?? null,
  }));

  const categoryUrls = categories
    .filter((cat: any) => cat.slug !== 'uncategorized' && cat.count > 0)
    .map((cat: any) => ({
      url: `https://androidscroll.com/category/${buildCategoryPath(cat, categories)}/`,
    }));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(url => `  <url>\n    <loc>${url}</loc>\n  </url>`).join('\n')}
${postUrls.map(({ url, lastmod }) => `  <url>
    <loc>${url}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
${categoryUrls.map(({ url }) => `  <url>\n    <loc>${url}</loc>\n  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
