import { cached } from './cache';
const API = "https://androidscroll.com/wp-json/wp/v2"
const WP_USER = import.meta.env.WP_USER
const WP_APP_PASS = import.meta.env.WP_APP_PASS

const authHeader = "Basic " + btoa(`${WP_USER}:${WP_APP_PASS}`)

const wpFetch = async (url: string) => {
  const res = await fetch(url, { headers: { Authorization: authHeader } });
  if (!res.ok) {
    console.error(`WP API error: ${res.status} ${url}`);
    return null;
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error(`WP API non-JSON from ${url}:`, text.slice(0, 200));
    return null;
  }
};

export const getPosts = (n = 100) => cached(`posts-${n}`, async () => {
  const data = await wpFetch(`${API}/posts?per_page=${n}&_embed`);
  return data ?? [];
})
export const getPost = (s: string) => wpFetch(`${API}/posts?slug=${s}&_embed`).then((a: any[]) => a?.[0])
export const getCategories = () => cached('category', async () => {
  const data = await wpFetch(`${API}/categories?per_page=100&hide_empty=true`);
  return data ?? [];
})
export const getPostsByCategory = (id: number, n = 100) => wpFetch(`${API}/posts?categories=${id}&per_page=${n}&_embed`)
export const getCategoryBySlug = (slug: string) => wpFetch(`${API}/categories?slug=${slug}`).then((a: any[]) => a?.[0])

const _decode = (str: string) =>
  str.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
     .replace(/&#x([\da-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
     .replace(/&amp;/g,'&')
     .replace(/&lt;/g,'<')
     .replace(/&gt;/g,'>')
     .replace(/&quot;/g,'"')
     .replace(/&#8216;/g,'\u2018')
     .replace(/&#8217;/g,'\u2019')
     .replace(/&#8220;/g,'\u201C')
     .replace(/&#8221;/g,'\u201D')
     .replace(/&#8211;/g,'\u2013')
     .replace(/&#8212;/g,'\u2014')
     .replace(/&#038;/g,'&')

export const excerpt = (html: string, words = 30) =>
  decode(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .split(' ').slice(0, words).join(' ') + '…'

export const decode = (str: string) => _decode(_decode(str))

export const getPages = () => cached('pages', async () => {
  const data = await wpFetch(`${API}/pages?per_page=100`);
  return data ?? [];
})

export const getPage = (slug: string) =>
  wpFetch(`${API}/pages?slug=${slug}`).then((a: any[]) => a?.[0])

export const getPostSeo = async (slug: string) => {
  const res = await wpFetch(`${API}/posts?slug=${slug}&_fields=id,slug,yoast_head_json,rank_math_head`)
  return res?.[0] ?? null
}

export const getRankMathHead = async (slug: string) => {
  try {
    const res = await fetch(`https://androidscroll.com/wp-json/rankmath/v1/getHead?url=https://androidscroll.com/${slug}/`);
    if (!res.ok) return null;
    const text = await res.text();
    const d = JSON.parse(text);
    return d.success ? d.head : null;
  } catch {
    return null;
  }
}