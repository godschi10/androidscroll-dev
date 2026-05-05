/**
 * server-sanitize.ts — Build-time HTML sanitizer for WordPress post content.
 *
 * Uses sanitize-html (htmlparser2-backed) instead of regex so malformed or
 * nested tags cannot bypass the rules. Runs in Node at build time.
 * WordPress already applies wp_kses_post server-side — this is the second layer.
 */
import sanitizeHtml from 'sanitize-html';

// Tags whose content is also dropped entirely
const DISCARD_TAGS = [
  'script', 'style', 'iframe', 'object', 'embed',
  'form', 'base', 'link', 'noscript', 'template',
];

// Tags stripped but content kept (unwrapped)
const STRIP_TAGS = [
  'html', 'body', 'head',
  'meta', 'title',
];

// Every tag WordPress Gutenberg legitimately outputs
const ALLOWED_TAGS = [
  'a', 'b', 'strong', 'i', 'em', 'u', 's', 'del', 'ins', 'mark',
  'small', 'sub', 'sup', 'abbr', 'cite', 'q', 'kbd', 'samp', 'var',
  'p', 'br', 'hr', 'wbr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'blockquote', 'pre', 'code',
  'div', 'span', 'section', 'article', 'aside', 'main', 'header', 'footer', 'nav',
  'figure', 'figcaption', 'picture', 'source', 'img',
  'video', 'audio', 'track',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'details', 'summary',
  'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'text', 'g', 'use', 'defs',
];

export function serverSanitizeHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,

    // Attributes allowed per tag — nothing on this list can execute code
    allowedAttributes: {
      '*':       ['class', 'id', 'style', 'data-*', 'aria-*', 'role', 'tabindex'],
      'a':       ['href', 'title', 'target', 'rel', 'name'],
      'img':     ['src', 'srcset', 'alt', 'width', 'height', 'loading', 'decoding', 'fetchpriority', 'sizes'],
      'source':  ['srcset', 'src', 'media', 'type', 'sizes'],
      'video':   ['src', 'controls', 'width', 'height', 'poster', 'preload', 'loop', 'muted', 'autoplay'],
      'audio':   ['src', 'controls', 'preload', 'loop', 'muted', 'autoplay'],
      'track':   ['kind', 'src', 'srclang', 'label', 'default'],
      'td':      ['colspan', 'rowspan', 'headers'],
      'th':      ['colspan', 'rowspan', 'scope', 'headers'],
      'col':     ['span'],
      'colgroup':['span'],
      'blockquote': ['cite'],
      'svg':     ['xmlns', 'viewBox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'aria-hidden', 'focusable'],
      'path':    ['d', 'fill', 'stroke', 'stroke-width', 'fill-rule', 'clip-rule'],
      'circle':  ['cx', 'cy', 'r', 'fill', 'stroke'],
      'rect':    ['x', 'y', 'width', 'height', 'rx', 'ry', 'fill', 'stroke'],
      'use':     ['href'],
    },

    // Restrict inline styles to only the CSS properties Gutenberg legitimately outputs.
    // Without this, sanitize-html passes ALL CSS through, enabling position:fixed overlays
    // and background-image:url() data exfiltration via img-src CSP bypass.
    allowedStyles: {
      '*': {
        'text-align':         [/^(left|center|right|justify)$/],
        'float':              [/^(left|right|none)$/],
        'width':              [/^\d+(%|px|em|rem)$/],
        'max-width':          [/^\d+(%|px|em|rem)$/],
        'color':              [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(\d+,\s*\d+,\s*\d+\)$/, /^[a-z]+$/i],
        'background-color':   [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(\d+,\s*\d+,\s*\d+\)$/, /^[a-z]+$/i],
        'font-size':          [/^\d+(px|em|rem|%)$/],
        'font-weight':        [/^(normal|bold|\d{3})$/],
        'margin':             [/^[\d\s]+(px|em|rem|%)?(\s[\d\s]+(px|em|rem|%)?)*$/],
        'padding':            [/^[\d\s]+(px|em|rem|%)?(\s[\d\s]+(px|em|rem|%)?)*$/],
      },
      // Note: position, z-index, background-image, opacity, top/left/right/bottom
      // are intentionally omitted — they enable overlay and exfiltration attacks.
    },

    // Only http/https/mailto/tel — blocks javascript:, data:, vbscript:
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img:    ['http', 'https', 'data'],  // data: allowed for inline images only
      source: ['http', 'https'],
    },

    // Force rel on all external links, no target injection
    transformTags: {
      'a': (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: 'noopener noreferrer',
          ...(attribs.href?.startsWith('http') && !attribs.href.startsWith('https://androidscroll.com')
            ? { target: '_blank' }
            : {}),
        },
      }),
    },

    // Completely discard dangerous tags and their content
    disallowedTagsMode: 'discard',
    exclusiveFilter: (frame) => DISCARD_TAGS.includes(frame.tag),
  });
}
