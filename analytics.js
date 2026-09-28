/* Optional analytics configuration for V8.
   Set one ID before publishing; placeholders intentionally send no requests. */
window.V8_ANALYTICS = {
  provider: '', // 'ga4' or 'baidu'
  measurementId: '' // GA4: G-XXXXXXXXXX; Baidu: hm.js site ID
};

(function () {
  const config = window.V8_ANALYTICS || {};
  const id = String(config.measurementId || '').trim();
  const provider = String(config.provider || '').toLowerCase();
  const valid = id && !/^(G-)?X{4,}$/i.test(id) && !/^YOUR_/i.test(id);

  window.v8Track = function (eventName, params) {
    if (provider === 'ga4' && valid && typeof window.gtag === 'function') {
      window.gtag('event', eventName, params || {});
    }
    if (provider === 'baidu' && valid && typeof window._hmt !== 'undefined') {
      window._hmt.push(['_trackEvent', 'v8', eventName, params && params.label ? params.label : '']);
    }
  };

  if (!valid || (provider !== 'ga4' && provider !== 'baidu')) return;

  if (provider === 'ga4') {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { send_page_view: true });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);
  } else {
    window._hmt = window._hmt || [];
    window._hmt.push(['_setAutoPageview', true]);
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://hm.baidu.com/hm.js?' + encodeURIComponent(id);
    document.head.appendChild(script);
  }
})();

(function () {
  document.addEventListener('click', function (event) {
    const target = event.target.closest('[data-track]');
    if (target && typeof window.v8Track === 'function') {
      window.v8Track(target.dataset.track, { label: target.textContent.trim() });
    }
  });
})();
