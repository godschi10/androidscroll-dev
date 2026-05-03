// Progress bar
const pb = document.getElementById('as-progress-bar');
if (pb) {
  window.addEventListener('scroll', () => {
    const t = window.scrollY;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    pb.style.width = (h > 0 ? t / h * 100 : 0) + '%';
  });
}

// Back to top
const btt = document.getElementById('as-back-to-top');
if (btt) {
  window.addEventListener('scroll', () => btt.classList.toggle('show', window.scrollY > 600));
  btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// TOC toggle
const toc = document.getElementById('as-toc');
const th = document.getElementById('toc-header');
if (toc && th) {
  if (localStorage.getItem('toc-open') === 'true') toc.classList.remove('toc-collapsed');
  th.addEventListener('click', () => {
    toc.classList.toggle('toc-collapsed');
    localStorage.setItem('toc-open', !toc.classList.contains('toc-collapsed'));
  });
}

// Social share links — deferred to avoid forced reflow during initial paint
requestAnimationFrame(() => {
  const url = encodeURIComponent(location.href);
  const shareTitle = encodeURIComponent(document.title);
  const coverImg = encodeURIComponent(
    document.getElementById('featured-image')?.src ||
    document.querySelector('article img')?.src || ''
  );

  // Bottom share
  const fbEl = document.getElementById('share-fb');
  const xEl = document.getElementById('share-x');
  const pinEl = document.getElementById('share-pinterest');
  const waEl = document.getElementById('share-whatsapp');
  if (fbEl) fbEl.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  if (xEl) xEl.href = `https://x.com/intent/tweet?url=${url}&text=${shareTitle}`;
  if (pinEl) pinEl.href = `https://pinterest.com/pin/create/button/?url=${url}&media=${coverImg}&description=${shareTitle}`;
  if (waEl) waEl.href = `https://wa.me/?text=${shareTitle}%20${url}`;

  const thEl = document.getElementById('btn-threads-share');
  if (thEl) thEl.href = `https://www.threads.net/intent/post?text=${encodeURIComponent(document.title + ' ' + window.location.href)}`;

  const sb = document.getElementById('native-share-btn');
  if (sb && navigator.share) {
    sb.style.display = 'inline-flex';
    sb.addEventListener('click', () => navigator.share({ title: document.title, url: location.href }));
  }

  // Top share (icon-only)
  const tFb = document.getElementById('top-share-fb');
  if (tFb) tFb.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;

  const tX = document.getElementById('top-share-x');
  if (tX) tX.href = `https://x.com/intent/tweet?url=${url}&text=${shareTitle}`;

  const tWa = document.getElementById('top-share-wa');
  if (tWa) tWa.href = `https://wa.me/?text=${shareTitle}%20${url}`;

  const tPin = document.getElementById('top-share-pinterest');
  if (tPin) tPin.href = `https://pinterest.com/pin/create/button/?url=${url}&media=${coverImg}&description=${shareTitle}`;

  const tTh = document.getElementById('top-share-threads');
  if (tTh) tTh.href = `https://www.threads.net/intent/post?text=${encodeURIComponent(document.title + ' ' + window.location.href)}`;

  const tNs = document.getElementById('top-native-share-btn');
  if (tNs && navigator.share) {
    tNs.style.display = 'inline-flex';
    tNs.addEventListener('click', () => navigator.share({ title: document.title, url: location.href }));
  }
});
