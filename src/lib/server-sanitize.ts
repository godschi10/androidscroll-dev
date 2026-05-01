/**
 * server-sanitize.ts — Build-time HTML sanitizer for WordPress post content.
 *
 * Runs in Node at build time (no DOM available). Defends against stored XSS
 * baked into static output if WordPress is ever compromised.
 *
 * WordPress already applies wp_kses_post server-side, so this is a second
 * layer — it strips the attack vectors that matter most for a static site:
 * executable tags, dangerous attributes, and protocol-based injection.
 */

// Tags stripped entirely, content included (unwrapped)
const STRIP_WITH_CONTENT = [
  /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,
  /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,
  /<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi,
  /<object\b[^>]*>[\s\S]*?<\/object\s*>/gi,
  /<embed\b[^>]*[\s/>]*>/gi,
  /<form\b[^>]*>[\s\S]*?<\/form\s*>/gi,
  /<base\b[^>]*>/gi,
  // Strip <link> tags — post content should never need to load stylesheets
  /<link\b[^>]*>/gi,
  // Strip HTML comments — used to hide payloads and IE conditional blocks
  /<!--[\s\S]*?-->/g,
];

// Dangerous attributes stripped from any remaining tag
const DANGEROUS_ATTR =
  /\s+(?:on\w+|srcdoc|formaction|action|xlink:href)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;

// href/src values that use dangerous protocols
const DANGEROUS_HREF =
  /(\s+href\s*=\s*["'])(?:\s*(?:javascript|vbscript|data)\s*:)[^"']*/gi;
const DANGEROUS_SRC =
  /(\s+src\s*=\s*["'])(?:\s*(?:javascript|vbscript|data)\s*:)[^"']*/gi;

export function serverSanitizeHtml(html: string): string {
  let out = html;

  for (const re of STRIP_WITH_CONTENT) {
    out = out.replace(re, '');
  }

  out = out
    .replace(DANGEROUS_ATTR, '')
    .replace(DANGEROUS_HREF, '$1#')
    .replace(DANGEROUS_SRC,  '$1');

  return out;
}
