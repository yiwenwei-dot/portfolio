(function () {
  // Avoid double-firing if a page transitions client-side.
  if (window.__yiwen_tracked) return;
  window.__yiwen_tracked = true;
  try {
    var body = JSON.stringify({
      page: location.pathname + location.search,
      referrer: document.referrer || null,
    });
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
      keepalive: true,
    }).catch(function () {});
  } catch (e) {}
})();
