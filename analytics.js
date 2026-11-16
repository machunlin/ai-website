/* Google Tag Manager + GA4 integration for V8 website.
 *
 * GTM container: GTM-NKKFPSCW
 * GA4 Measurement ID: G-VN5MT41YBP
 *
 * Configure the Google tag with the GA4 Measurement ID inside GTM.
 * Do not call gtag('config', ...) from this GTM-container installation.
 */
(function () {
  const containerId = 'GTM-NKKFPSCW';

  // Install GTM once and preserve any events queued before the container loads.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js'
  });

  const firstScript = document.getElementsByTagName('script')[0];
  const gtmScript = document.createElement('script');
  gtmScript.async = true;
  gtmScript.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(containerId);
  firstScript.parentNode.insertBefore(gtmScript, firstScript);

  // Send custom events to GTM. GA4 receives them after the matching event tag
  // has been configured and published in the GTM workspace.
  window.v8Track = function (eventName, params) {
    const normalizedName = String(eventName || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');

    if (!normalizedName) return;

    const options = params || {};
    window.dataLayer.push({
      event: 'v8_event',
      v8_event_name: normalizedName,
      event_label: String(options.label || '').trim().slice(0, 100)
    });
  };

  // Automatically track clicks on elements marked with data-track.
  document.addEventListener('click', function (event) {
    const target = event.target.closest('[data-track]');
    if (target) {
      window.v8Track(target.dataset.track, {
        label: target.textContent.trim()
      });
    }
  });
})();
