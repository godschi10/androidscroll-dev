(function () {
  var settings = {
    showIntro: true,
    divId: "matomo-opt-out",
    useSecureCookies: true,
    cookiePath: null,
    cookieDomain: null,
    cookieSameSite: "Lax",
    OptOutComplete: "Opt-out complete; your visits to this website will not be recorded by the Web Analytics tool.",
    OptOutCompleteBis: "Note that if you clear your cookies, delete the opt-out cookie, or if you change computers or Web browsers, you will need to perform the opt-out procedure again.",
    YouMayOptOut2: "You may choose to prevent this website from aggregating and analyzing the actions you take here.",
    YouMayOptOut3: "Doing so will protect your privacy, but will also prevent the owner from learning from your actions and creating a better experience for you and other users.",
    OptOutErrorNoCookies: "The tracking opt-out feature requires cookies to be enabled.",
    OptOutErrorNotHttps: "The tracking opt-out feature may not work because this site was not loaded over HTTPS.",
    YouAreNotOptedOut: "You are not opted out.",
    UncheckToOptOut: "Uncheck this box to opt-out.",
    YouAreOptedOut: "You are currently opted out.",
    CheckToOptIn: "Check this box to opt-in."
  };

  window.MatomoConsent = {
    CONSENT_COOKIE_NAME: 'mtm_consent',
    CONSENT_REMOVED_COOKIE_NAME: 'mtm_consent_removed',
    cookieIsSecure: false,
    init: function(useSecureCookies, cookiePath, cookieDomain, cookieSameSite) {
      this.useSecureCookies = useSecureCookies; this.cookiePath = cookiePath;
      this.cookieDomain = cookieDomain; this.cookieSameSite = cookieSameSite;
      this.cookieIsSecure = (useSecureCookies && location.protocol === 'https:');
    },
    hasConsent: function() {
      var consentCookie = this.getCookie(this.CONSENT_COOKIE_NAME);
      var removedCookie = this.getCookie(this.CONSENT_REMOVED_COOKIE_NAME);
      if (!consentCookie && !removedCookie) { return true; }
      if (removedCookie && consentCookie) { this.setCookie(this.CONSENT_COOKIE_NAME, '', -129600000); return false; }
      return (consentCookie || consentCookie !== 0);
    },
    consentGiven: function() {
      this.setCookie(this.CONSENT_REMOVED_COOKIE_NAME, '', -129600000);
      this.setCookie(this.CONSENT_COOKIE_NAME, new Date().getTime(), 946080000000);
    },
    consentRevoked: function() {
      this.setCookie(this.CONSENT_COOKIE_NAME, '', -129600000);
      this.setCookie(this.CONSENT_REMOVED_COOKIE_NAME, new Date().getTime(), 946080000000);
    },
    getCookie: function(cookieName) {
      var cookiePattern = new RegExp('(^|;)[ ]*' + cookieName + '=([^;]*)');
      var cookieMatch = cookiePattern.exec(document.cookie);
      return cookieMatch ? window.decodeURIComponent(cookieMatch[2]) : 0;
    },
    setCookie: function(cookieName, value, msToExpire) {
      var expiryDate = new Date();
      expiryDate.setTime((new Date().getTime()) + msToExpire);
      document.cookie = cookieName + '=' + window.encodeURIComponent(value) +
        (msToExpire ? ';expires=' + expiryDate.toGMTString() : '') +
        ';path=' + (this.cookiePath || '/') +
        (this.cookieDomain ? ';domain=' + this.cookieDomain : '') +
        (this.cookieIsSecure ? ';secure' : '') +
        ';SameSite=' + this.cookieSameSite;
    }
  };

  function showContent(consent) {
    var div = document.getElementById(settings.divId);
    if (!div) return;

    if (!navigator || !navigator.cookieEnabled) {
      div.innerHTML = '<p style="color:red;font-weight:bold;">' + settings.OptOutErrorNoCookies + '</p>';
      return;
    }

    var content = '';
    if (location.protocol !== 'https:') {
      content += '<p style="color:red;font-weight:bold;">' + settings.OptOutErrorNotHttps + '</p>';
    }

    if (consent) {
      if (settings.showIntro) {
        content += '<p style="margin-bottom:0.75rem;">' + settings.YouMayOptOut2 + ' ' + settings.YouMayOptOut3 + '</p>';
      }
      content += '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">';
      content += '<input id="trackVisits" type="checkbox" checked="checked" style="width:1rem;height:1rem;cursor:pointer;" />';
      content += '<strong>' + settings.YouAreNotOptedOut + ' ' + settings.UncheckToOptOut + '</strong>';
      content += '</label>';
    } else {
      if (settings.showIntro) {
        content += '<p style="margin-bottom:0.75rem;">' + settings.OptOutComplete + ' ' + settings.OptOutCompleteBis + '</p>';
      }
      content += '<label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">';
      content += '<input id="trackVisits" type="checkbox" style="width:1rem;height:1rem;cursor:pointer;" />';
      content += '<strong>' + settings.YouAreOptedOut + ' ' + settings.CheckToOptIn + '</strong>';
      content += '</label>';
    }

    div.innerHTML = content;

    document.getElementById('trackVisits').addEventListener('click', function() {
      if (consent) { window.MatomoConsent.consentRevoked(); showContent(false); }
      else         { window.MatomoConsent.consentGiven();   showContent(true);  }
    });
  }

  function init() {
    var div = document.getElementById(settings.divId);
    if (!div) return;
    window.MatomoConsent.init(
      settings.useSecureCookies,
      settings.cookiePath,
      settings.cookieDomain,
      settings.cookieSameSite
    );
    showContent(window.MatomoConsent.hasConsent());
  }

  document.addEventListener('astro:page-load', init);
  document.addEventListener('DOMContentLoaded', init);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  }
})();
