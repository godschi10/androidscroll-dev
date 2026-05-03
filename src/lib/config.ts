// ─── AdSense config ───────────────────────────────────────────────────────────
// This is the ONE file to edit when activating AdSense.
// Flip ADSENSE_ENABLED to true, fill in your slot IDs, then deploy.
// Each key maps to a distinct ad unit you create in your AdSense dashboard.
// ─────────────────────────────────────────────────────────────────────────────

export const ADSENSE_ENABLED = false;                     // ← flip to true when ready
export const ADSENSE_CLIENT  = 'ca-pub-2120921560398982'; // ← your Publisher ID

export const ADSENSE_SLOTS = {
  inArticle:  'XXXXXXXXXX',  // In-article unit  — between paragraphs in post body
  sidebar:    'XXXXXXXXXX',  // Sidebar rectangle — desktop sidebar
  belowPost:  'XXXXXXXXXX',  // Below-post unit   — after post content / footer of Layout
  inFeed:     'XXXXXXXXXX',  // In-feed unit      — inside post listing / index pages
} as const;

export type AdSlotName = keyof typeof ADSENSE_SLOTS;
