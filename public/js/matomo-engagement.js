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
