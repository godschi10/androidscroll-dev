import { cached } from './cache';

// ─── Startup guards ────────────────────────────────────────────────────────────
const WP_USER    = import.meta.env.WP_USER;
const WP_APP_PASS = import.meta.env.WP_APP_PASS;

if (!WP_USER || !WP_APP_PASS) {
  throw new Error(
    '[wp.ts] Missing required environment variables WP_USER and/or WP_APP_PASS. ' +
    'Add them to your .env file (dev) or Cloudflare Pages dashboard (production).'
  );
}

const API        = 'https://androidscroll.com/wp-json/wp/v2';
const authHeader = 'Basic ' + btoa(`${WP_USER}:${WP_APP_PASS}`);

// ─── Concurrency limiter ───────────────────────────────────────────────────────
// Processes `items` with `fn` in batches of `limit` at a time.
// Prevents hammering Hostinger with N simultaneous requests at build time.
export async function withConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  limit = 15
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    results.push(...await Promise.all(batch.map(fn)));
  }
  return results;
}

// ─── RankMath head validator ───────────────────────────────────────────────────
// Allowlist approach: only extracts the specific tag types we trust.
// Anything else (style, link[rel=stylesheet], arbitrary script, etc.) is silently dropped.
export function validateRankMathHead(head: string | null): string | null {
  if (!head || typeof head !== 'string') return null;

  const allowed: string[] = [];

  // <title> — plain text only
  const titleMatch = head.match(/<title>([^<]*)<\/title>/i);
  if (titleMatch) allowed.push(`<title>${titleMatch[1]}</title>`);

  // <meta> tags — inert by spec, but strip any that sneak in an event handler.
  // NOTE: must use \bon\w+ (word boundary) — without it, 'content=' falsely matches
  // as 'ontent=' satisfies on\w+=, which blocks every single meta tag.
  for (const m of head.matchAll(/<meta[^>]*\/?>/gi)) {
    if (!/\bon\w+\s*=/i.test(m[0])) allowed.push(m[0]);
  }

  // <link> — canonical and alternate only, no stylesheets or preloads
  for (const m of head.matchAll(/<link[^>]*\/?>/gi)) {
    if (/rel=["'](?:canonical|alternate)["']/i.test(m[0]) && !/\bon\w+\s*=/i.test(m[0])) {
      allowed.push(m[0]);
    }
  }

  // <script type="application/ld+json"> — validate JSON before allowing
  for (const m of head.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(m[1]);
      allowed.push(m[0]);
    } catch {
      console.warn('[wp.ts] Invalid JSON in RankMath JSON-LD block — skipped.');
    }
  }

  if (!allowed.length) {
    console.warn('[wp.ts] RankMath head contained no allowlisted tags — rejected.');
    return null;
  }

  return allowed.join('\n');
}

// ─── Core fetch ───────────────────────────────────────────────────────────────
const wpFetch = async (url: string): Promise<any> => {
  const res = await fetch(url, { headers: { Authorization: authHeader } });
  if (!res.ok) {
    throw new Error(`[wp.ts] WP API error ${res.status} for ${url}`);
  }
  return res.json();
};

// ─── API functions ────────────────────────────────────────────────────────────
export const getPosts = (n: number) => cached(`posts-${n}`, () => wpFetch(`${API}/posts?per_page=${n}&_embed`));

// Paginated — fetches every published post regardless of count.
// FIX: parallelises pages 2..N after learning X-WP-TotalPages from page 1,
// instead of the previous sequential while-loop (O(pages) round trips → 1 + parallel).
export const getAllPosts = () => cached('all-posts', async () => {
  const res1 = await fetch(
    `${API}/posts?per_page=100&page=1&_embed&status=publish`,
    { headers: { Authorization: authHeader } }
  );
  if (!res1.ok) return [];
  const first: any[] = await res1.json();
  const totalPages = Number(res1.headers.get('X-WP-TotalPages') ?? 1);
  if (totalPages <= 1) return first;

  // Fetch remaining pages in parallel — safe because WP pagination is stable during a build
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      fetch(
        `${API}/posts?per_page=100&page=${i + 2}&_embed&status=publish`,
        { headers: { Authorization: authHeader } }
      ).then(r => r.ok ? r.json() as Promise<any[]> : Promise.resolve([]))
    )
  );
  return [...first, ...rest.flat()];
});

export const getPost = (s: string) => wpFetch(`${API}/posts?slug=${encodeURIComponent(s)}&_embed`).then((a: any[]) => a[0]);

// FIX: parallelised pagination, same pattern as getAllPosts
export const getCategories = () => cached('category', async () => {
  const res1 = await fetch(
    `${API}/categories?per_page=100&page=1&hide_empty=true`,
    { headers: { Authorization: authHeader } }
  );
  if (!res1.ok) return [];
  const first: any[] = await res1.json();
  const totalPages = Number(res1.headers.get('X-WP-TotalPages') ?? 1);
  if (totalPages <= 1) return first;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      fetch(
        `${API}/categories?per_page=100&page=${i + 2}&hide_empty=true`,
        { headers: { Authorization: authHeader } }
      ).then(r => r.ok ? r.json() as Promise<any[]> : Promise.resolve([]))
    )
  );
  return [...first, ...rest.flat()];
});

// FIX: filters from the already-cached getAllPosts() result instead of making
// separate paginated API calls per category. Zero extra network requests after
// getAllPosts() has run once.
export const getPostsByCategory = (id: number) =>
  cached(`posts-by-cat-${id}`, async () => {
    const all = await getAllPosts();
    return all.filter((p: any) =>
      p._embedded?.['wp:term']?.[0]?.some((t: any) => t.id === id)
    );
  });

export const getCategoryBySlug = (slug: string) => wpFetch(`${API}/categories?slug=${encodeURIComponent(slug)}`).then((a: any[]) => a[0]);

// FIX: parallelised pagination, same pattern as getAllPosts
export const getPages = () => cached('pages', async () => {
  const res1 = await fetch(
    `${API}/pages?per_page=100&page=1`,
    { headers: { Authorization: authHeader } }
  );
  if (!res1.ok) return [];
  const first: any[] = await res1.json();
  const totalPages = Number(res1.headers.get('X-WP-TotalPages') ?? 1);
  if (totalPages <= 1) return first;

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      fetch(
        `${API}/pages?per_page=100&page=${i + 2}`,
        { headers: { Authorization: authHeader } }
      ).then(r => r.ok ? r.json() as Promise<any[]> : Promise.resolve([]))
    )
  );
  return [...first, ...rest.flat()];
});

export const getPage = (slug: string) => wpFetch(`${API}/pages?slug=${encodeURIComponent(slug)}`).then((a: any[]) => a[0]);

// Authenticated comments fetch — used in getStaticPaths batch via withConcurrency
export const getComments = (postId: number): Promise<any[]> =>
  fetch(`${API}/comments?post=${postId}&per_page=100&orderby=date&order=asc`, { headers: { Authorization: authHeader } })
    .then(r => r.ok ? r.json() : [])
    .catch(() => []);

export const getPostSeo = async (slug: string) => {
  const res = await wpFetch(`${API}/posts?slug=${encodeURIComponent(slug)}&_fields=id,slug,yoast_head_json,rank_math_head`);
  return res[0] ?? null;
};

// FIX: now wrapped in cached() — previously made a fresh network request on every
// call. With N posts in getStaticPaths each slug is unique so caching won't collapse
// duplicates, but it prevents any second call for the same slug (e.g. from [page].astro)
// from hitting the network again.
export const getRankMathHead = (slug: string): Promise<string | null> =>
  cached(`rankmath-${slug}`, () =>
    fetch(`https://androidscroll.com/wp-json/rankmath/v1/getHead?url=https://androidscroll.com/${encodeURIComponent(slug)}/`)
      .then(r => r.json())
      .then(d => validateRankMathHead(d.success ? d.head : null))
      .catch(() => null)
  );

// ─── HTML decode ──────────────────────────────────────────────────────────────
// Single-pass only — double-pass was an XSS amplifier
const _decode = (str: string): string =>
  str
    .replace(/&#(\d+);/g,          (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([\da-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8220;/g, '\u201C')
    .replace(/&#8221;/g, '\u201D')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&#038;/g,  '&');

export const decode = _decode;

export const excerpt = (html: string, words = 30): string =>
  decode(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .split(' ').slice(0, words).join(' ') + '…';
