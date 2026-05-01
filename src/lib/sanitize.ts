/**
 * sanitize.ts — Client-side HTML sanitization utilities
 * Used wherever WordPress HTML content is rendered via innerHTML in the browser.
 */

export function sanitizeHtml(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;
  sanitizeNode(template.content);
  return template.innerHTML;
}

const ALLOWED_TAGS = new Set([
  'a', 'b', 'strong', 'i', 'em', 'u', 's', 'del', 'ins',
  'p', 'br', 'hr', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'img', 'figure', 'figcaption', 'picture', 'source',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'div', 'span', 'section', 'article', 'aside', 'nav',
  'details', 'summary', 'mark', 'small', 'sub', 'sup',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  'a':      new Set(['href', 'title', 'target', 'rel']),
  'img':    new Set(['src', 'srcset', 'alt', 'width', 'height', 'loading', 'decoding', 'fetchpriority']),
  'source': new Set(['srcset', 'media', 'type', 'sizes']),
  'td':     new Set(['colspan', 'rowspan']),
  'th':     new Set(['colspan', 'rowspan', 'scope']),
  '*':      new Set(['class']),
};

const BLOCKED_CSS = /expression\s*\(|javascript\s*:|behavior\s*:|moz-binding|url\s*\(|position\s*:\s*(fixed|absolute)|z-index\s*:\s*[1-9]\d{3,}|opacity\s*:\s*0/i;

function sanitizeNode(node: Node): void {
  const toRemove: Node[] = [];

  node.childNodes.forEach(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tag)) {
        const text = document.createTextNode(el.textContent || '');
        node.insertBefore(text, child);
        toRemove.push(child);
        return;
      }

      const attrsToRemove: string[] = [];
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const allowed = ALLOWED_ATTRS[tag] || new Set<string>();
        const allowedGlobal = ALLOWED_ATTRS['*'];

        if (!allowed.has(name) && !allowedGlobal.has(name)) {
          attrsToRemove.push(attr.name); continue;
        }
        if (/^on/i.test(name)) {
          attrsToRemove.push(attr.name); continue;
        }
        if ((name === 'href' || name === 'src' || name === 'srcset') &&
            /^\s*(javascript|data|vbscript):/i.test(attr.value)) {
          attrsToRemove.push(attr.name); continue;
        }
        if (name === 'style' && BLOCKED_CSS.test(attr.value)) {
          attrsToRemove.push(attr.name); continue;
        }
        if (name === 'href' && tag === 'a') {
          el.setAttribute('rel', 'noopener noreferrer');
          if (!attr.value.startsWith('/') && !attr.value.startsWith('#') &&
              !attr.value.startsWith('https://androidscroll.com')) {
            el.setAttribute('target', '_blank');
          }
        }
      }

      attrsToRemove.forEach(a => el.removeAttribute(a));
      sanitizeNode(el);
    } else if (child.nodeType === Node.COMMENT_NODE) {
      toRemove.push(child);
    }
  });

  toRemove.forEach(n => node.removeChild(n));
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function sanitizeUrl(url: string): string {
  if (!url) return '#';
  const trimmed = url.trim();
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return '#';
  return trimmed;
}
