import { cached } from './cache';
const API = "https://androidscroll.com/wp-json/wp/v2"
const WP_USER = import.meta.env.WP_USER
const WP_APP_PASS = import.meta.env.WP_APP_PASS

const authHeader = "Basic " + btoa(`${WP_USER}:${WP_APP_PASS}`)
const wpFetch = (url: string) =>
  fetch(url, { headers: { Authorization: authHeader } }).then(r => r.json())

export const getPosts = (n = 100) => cached(`posts-${n}`, () => wpFetch(`${API}/posts?per_page=${n}&_embed`))
export const getPost = (s: string) => wpFetch(`${API}/posts?slug=${s}&_embed`).then((a: any[]) => a[0])
export const getCategories = () => cached('category', () => wpFetch(`${API}/categories?per_page=100&hide_empty=true`))
export const getPostsByCategory = (id: number, n = 100) => wpFetch(`${API}/posts?categories=${id}&per_page=${n}&_embed`)
export const getCategoryBySlug = (slug: string) => wpFetch(`${API}/categories?slug=${slug}`).then((a: any[]) => a[0])

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

export const getPages = () => cached('pages', () => wpFetch(`${API}/pages?per_page=100`))

export const getPage = (slug: string) =>
  wpFetch(`${API}/pages?slug=${slug}`).then((a: any[]) => a[0])

export const getPostSeo = async (slug: string) => {
  // RankMath exposes SEO data via custom endpoint if REST API is enabled
  const res = await wpFetch(`${API}/posts?slug=${slug}&_fields=id,slug,yoast_head_json,rank_math_head`)
  return res[0] ?? null
}

export const getRankMathHead = (slug: string) =>
  fetch(`https://androidscroll.com/wp-json/rankmath/v1/getHead?url=https://androidscroll.com/${slug}/`)
    .then(r => r.json())
    .then(d => d.success ? d.head : null)
