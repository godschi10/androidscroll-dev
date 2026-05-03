function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeUrl(url) {
  if (!url) return '';
  if (/^\s*(javascript|data|vbscript):/i.test(url)) return '#';
  return url;
}

// Read search data injected as a JSON script element (avoids CSP-blocked inline scripts)
const dataEl = document.getElementById('as-search-data');
if (!dataEl) { console.error('as-search-data element not found'); }
const data = dataEl ? JSON.parse(dataEl.textContent) : [];

const overlay = document.getElementById('search-overlay');
const input = document.getElementById('search-overlay-input');
const clearBtn = document.getElementById('search-clear');
const hint = document.getElementById('search-hint');
const grid = document.getElementById('search-results-grid');
const empty = document.getElementById('search-empty');
const viewAll = document.getElementById('search-view-all');

function openSearch() {
  overlay.style.opacity = '1';
  overlay.style.pointerEvents = 'all';
  setTimeout(() => input.focus(), 50);
}

function closeSearch() {
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  input.value = '';
  clearBtn.style.display = 'none';
  showHint();
}

function showHint() {
  hint.style.display = 'block';
  grid.style.display = 'none';
  empty.style.display = 'none';
  viewAll.style.display = 'none';
}

function runSearch(q) {
  if (!q) { showHint(); return; }
  const query = q.toLowerCase();
  const found = data.filter(p =>
    p.title.toLowerCase().includes(query) ||
    p.description.toLowerCase().includes(query)
  );

  hint.style.display = 'none';

  if (found.length === 0) {
    grid.style.display = 'none';
    viewAll.style.display = 'none';
    empty.style.display = 'block';
    empty.textContent = `No results for "${q}"`;
    return;
  }

  empty.style.display = 'none';
  grid.style.display = 'grid';
  viewAll.style.display = 'block';
  viewAll.href = `/search?q=${encodeURIComponent(q)}`;

  grid.innerHTML = found.slice(0, 6).map(r => `
    <a href="${esc(safeUrl(r.url))}" style="display:flex; flex-direction:column; background:var(--bg-surface); border:1px solid var(--border-light); border-radius:var(--radius-main); overflow:hidden; text-decoration:none; transition:border-color 0.18s, transform 0.18s;">
      ${r.cover ? `
      <div style="width:100%; aspect-ratio:16/9; overflow:hidden; background:var(--bg-surface-2);">
        <img src="${esc(safeUrl(r.cover))}" alt="${esc(r.title)}" style="width:100%; height:100%; object-fit:cover; display:block;" loading="lazy">
      </div>` : ''}
      <div style="padding:9px 10px 10px; flex:1;">
        ${r.categories[0] ? `<span style="font-family:var(--font-heading); font-size:9px; font-weight:700; letter-spacing:0.09em; text-transform:uppercase; color:var(--brand-primary);">${esc(r.categories[0].replace(/-/g, ' '))}</span>` : ''}
        <p style="font-family:var(--font-heading); font-size:13px; font-weight:600; color:var(--text-dark); line-height:1.4; margin:4px 0 0;">${esc(r.title)}</p>
      </div>
    </a>
  `).join('');
}

document.getElementById('search-open').addEventListener('click', openSearch);
document.getElementById('search-close').addEventListener('click', closeSearch);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSearch();
});

input.addEventListener('input', () => {
  const q = input.value.trim();
  clearBtn.style.display = q ? 'flex' : 'none';
  runSearch(q);
});

clearBtn.addEventListener('click', () => {
  input.value = '';
  clearBtn.style.display = 'none';
  input.focus();
  showHint();
});

// Close on result click
grid.addEventListener('click', closeSearch);
