// ─── nav.js ──────────────────────────────────────────────────────────────────
var desktopNav = document.querySelector('.desktop-nav');
var menuToggle = document.getElementById('menu-toggle');
var mobileMenu = document.getElementById('mobile-menu');

function applyLayout() {
  if (window.innerWidth >= 768) {
    desktopNav.style.display = 'flex';
    menuToggle.style.display = 'none';
    mobileMenu.style.display = 'none';
  } else {
    desktopNav.style.display = 'none';
    menuToggle.style.display = 'flex';
  }
}
applyLayout();
window.addEventListener('resize', applyLayout);

// Hamburger toggle
menuToggle.addEventListener('click', function() {
  mobileMenu.style.display = mobileMenu.style.display === 'flex' ? 'none' : 'flex';
});

// Dropdown
var button = document.getElementById('dd-button');
var menu = document.getElementById('dd-menu');

if (button && menu) {
  button.addEventListener('click', function(event) {
    event.stopPropagation();
    var isOpen = menu.style.display === 'grid';
    menu.style.display = isOpen ? 'none' : 'grid';
    button.setAttribute('aria-expanded', String(!isOpen));
  });

  document.addEventListener('click', function(event) {
    if (menu.style.display === 'grid' && !menu.contains(event.target) && !button.contains(event.target)) {
      menu.style.display = 'none';
      button.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && menu.style.display === 'grid') {
      menu.style.display = 'none';
      button.setAttribute('aria-expanded', 'false');
      button.focus();
    }
  });
}

// Mobile category accordion
document.querySelectorAll('.mobile-cat-toggle').forEach(function(toggle) {
  toggle.addEventListener('click', function(e) {
    if (e.target.tagName === 'A') return;
    var slug = toggle.dataset.cat;
    var children = document.getElementById('mob-' + slug);
    var arrow = toggle.querySelector('.cat-arrow');
    if (children) {
      children.classList.toggle('open');
      if (arrow) arrow.style.transform = children.classList.contains('open') ? 'rotate(180deg)' : '';
    }
  });
});

// ─── sticky-ad.js ─────────────────────────────────────────────────────────────
(function(){
  var el = document.getElementById('asStickyFooter');
  var cl = document.getElementById('asSfClose');
  if (!el || !cl) return;
  setTimeout(function(){ el.classList.add('as-sf--show'); }, 5000);
  cl.addEventListener('click', function(){
    el.classList.remove('as-sf--show');
    setTimeout(function(){ el.style.display='none'; }, 350);
  });
})();

// ─── matomo-engagement.js ─────────────────────────────────────────────────────
var _s35 = false, _s75 = false, _s100 = false;

function resetEngagementFlags() {
  _s35 = false; _s75 = false; _s100 = false;
}
document.addEventListener('astro:after-swap', resetEngagementFlags);

window.addEventListener('scroll', function() {
  var depth = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
  if (!_s35 && depth > 0.35) { _paq.push(['trackEvent', 'Engagement', 'Scroll 35%']); _s35 = true; }
  if (!_s75 && depth > 0.75) { _paq.push(['trackEvent', 'Engagement', 'Scroll 75%']); _s75 = true; }
  if (!_s100 && depth > 0.99) { _paq.push(['trackEvent', 'Engagement', 'Scroll 100%']); _s100 = true; }
});

document.addEventListener('click', function(e) {
  var link = e.target.closest('a');
  if (!link) return;
  var href = link.getAttribute('href') || '';
  if (href.indexOf('/offer/') === -1) return;
  var slug = href.replace(/.*\/offer\//, '').replace(/\/$/, '') || href;
  if (typeof _paq !== 'undefined') {
    _paq.push(['trackEvent', 'Affiliate', 'Click', slug]);
  }
});
