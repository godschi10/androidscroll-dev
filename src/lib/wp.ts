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

// ─── RankMath head validator ───────────────────────────────────────────────────
const SCRIPT_NON_JSON = /<script(?![^>]*type=["']application\/ld\+json["'])/i;

export function validateRankMathHead(head: string | null): string | null {
  if (!head || typeof head !== 'string') return null;

  // Reject any executable <script> that is NOT JSON-LD
  if (SCRIPT_NON_JSON.test(head)) {
    console.warn('[wp.ts] RankMath head contained non-JSON-LD <script> — rejected.');
    return null;
  }

  // Reject inline event handlers (onerror=, onclick=, etc.)
  if (/\bon\w+\s*=/i.test(head)) {
    console.warn('[wp.ts] RankMath head contained inline event handler — rejected.');
    return null;
  }

  // Reject iframes, objects, embeds
  if (/<(iframe|object|embed|form|base)\b/i.test(head)) {
    console.warn('[wp.ts] RankMath head contained forbidden element — rejected.');
    return null;
  }

  return head;
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
export const getPosts           = (n = 100) => cached(`posts-${n}`, () => wpFetch(`${API}/posts?per_page=${n}&_embed`));
export const getPost            = (s: string) => wpFetch(`${API}/posts?slug=${encodeURIComponent(s)}&_embed`).then((a: any[]) => a[0]);
export const getCategories      = () => cached('category', () => wpFetch(`${API}/categories?per_page=100&hide_empty=true`));
export const getPostsByCategory = (id: number, n = 100) => wpFetch(`${API}/posts?categories=${id}&per_page=${n}&_embed`);
export const getCategoryBySlug  = (slug: string) => wpFetch(`${API}/categories?slug=${encodeURIComponent(slug)}`).then((a: any[]) => a[0]);
export const getPages           = () => cached('pages', () => wpFetch(`${API}/pages?per_page=100`));
export const getPage            = (slug: string) => wpFetch(`${API}/pages?slug=${encodeURIComponent(slug)}`).then((a: any[]) => a[0]);

export const getPostSeo = async (slug: string) => {
  const res = await wpFetch(`${API}/posts?slug=${encodeURIComponent(slug)}&_fields=id,slug,yoast_head_json,rank_math_head`);
  return res[0] ?? null;
};

// FIX: slug URL-encoded; response validated before use
export const getRankMathHead = (slug: string): Promise<string | null> =>
  fetch(`https://androidscroll.com/wp-json/rankmath/v1/getHead?url=https://androidscroll.com/${encodeURIComponent(slug)}/`)
    .then(r => r.json())
    .then(d => validateRankMathHead(d.success ? d.head : null))
    .catch(() => null);

// ─── HTML decode ──────────────────────────────────────────────────────────────
// FIX: Single-pass only — double-pass was an XSS amplifier
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
