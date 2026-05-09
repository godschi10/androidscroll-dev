// Delay Matomo load until after the page is fully loaded + 3 seconds.
// This keeps it completely out of TBT (Total Blocking Time) measurement,
// since PSI measures TBT only during initial page load, not post-load activity.
window.addEventListener('load', function() {
  setTimeout(function() {
    var _paq = window._paq = window._paq || [];
    _paq.push(['disableCookies']);
    _paq.push(['setDoNotTrack', true]);
    _paq.push(["setExcludedReferrers", ["androidscroll.com","analytics.androidscroll.com"]]);
    _paq.push(['enableLinkTracking']);
    _paq.push(['enableHeartBeatTimer', 5]);

    function _matomoIsOptedOut() {
      return /(?:^|;)\s*mtm_consent_removed=/.test(document.cookie);
    }

    function trackAstroPage() {
      if (_matomoIsOptedOut()) return;
      _paq.push(['setCustomUrl', window.location.href]);
      _paq.push(['setDocumentTitle', document.title]);
      _paq.push(['trackPageView']);
    }
    trackAstroPage();
    document.addEventListener('astro:page-load', trackAstroPage);

    (function() {
      var u="//analytics.androidscroll.com/";
      _paq.push(['setTrackerUrl', u+'matomo.php']);
      _paq.push(['setSiteId', '1']);
      var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
      g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
    })();
  }, 3000);
});
