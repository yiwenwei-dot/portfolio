(function () {
  'use strict';

  var CANVAS_W = 1903;
  var CANVAS_H = 928;
  var MOBILE_BREAKPOINT = 768;

  // --- Desktop: scale canvas to fill viewport ---
  function scaleDesktop() {
    if (window.innerWidth <= MOBILE_BREAKPOINT) return;

    var canvas = document.querySelector('._8jGYJw');
    if (!canvas) return;

    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var scaleX = vw / CANVAS_W;
    var scaleY = vh / CANVAS_H;
    var scale = Math.max(scaleX, scaleY);

    canvas.style.transform = 'scale(' + scale + ')';
    canvas.style.transformOrigin = 'top left';

    var scaledW = CANVAS_W * scale;
    var scaledH = CANVAS_H * scale;
    canvas.style.position = 'absolute';
    canvas.style.left = ((vw - scaledW) / 2) + 'px';
    canvas.style.top = ((vh - scaledH) / 2) + 'px';
  }

  // --- Mobile: reset desktop scaling and apply text scale transforms ---
  function setupMobile() {
    if (window.innerWidth > MOBILE_BREAKPOINT) return;

    var canvas = document.querySelector('._8jGYJw');
    if (!canvas) return;

    // Remove any desktop scaling
    canvas.style.transform = '';
    canvas.style.left = '';
    canvas.style.top = '';
    canvas.style.position = '';

    // Apply text container scale transforms to match Canva mobile rendering
    // Original Canva mobile: child (.aF9o6Q) is wider than parent, scaled down to fit.
    // Parent = visual (post-scale) dimensions; child = visual / scale (pre-scale)
    // Heights and visual widths from original Canva mobile at 390px viewport
    var textElements = {
      'LBzm9W79wkmqfjVS': { scale: 0.846911, w: 331, h: 64 },   // "Yiwen Wei"
      'LBBsfTgmzmw24h5m': { scale: 0.799836, w: 279, h: 54 },   // "Who am I?"
      'LBWkLWRYQkZjxbTL': { scale: 0.799836, w: 364, h: 55 },   // body text
      'LB4sSj5DxgVQFvYp': { scale: 0.799836, w: 221, h: 54 },   // "I think"
      'LBNFnN3BBrtQ3sWG': { scale: 0.799836, w: 18, h: 13 },    // "01"
      'LB9Mk4jffcm2QdtQ': { scale: 0.799836, w: 221, h: 54 },   // "I teach"
      'LBnsrLPZQhnNL6q7': { scale: 0.799836, w: 18, h: 13 },    // "02"
      'LBVKchzfdp9MpRN0': { scale: 0.799836, w: 221, h: 54 },   // "I talk"
      'LBpzCD4WwzL7XCmt': { scale: 0.799836, w: 18, h: 13 },    // "03"
      'LBrtFtQf2kZDQLHR': { scale: 0.799836, w: 391, h: 61 }    // quote
    };

    // Scale factor for viewport: original was 390px wide
    var vwScale = window.innerWidth / 390;

    Object.keys(textElements).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var tc = el.querySelector('.aF9o6Q');
      if (!tc) return;
      var cfg = textElements[id];
      var s = cfg.scale;

      // Set child to pre-scale (unscaled) dimensions so text wraps correctly
      // After scale transform, it will visually match the original widths
      tc.style.width = (cfg.w / s * vwScale) + 'px';
      tc.style.height = (cfg.h / s * vwScale) + 'px';
      tc.style.transform = 'scale(' + s + ', ' + s + ')';
      tc.style.transformOrigin = '0px 0px';

      // Set parent to post-scale (visual) dimensions
      el.style.width = (cfg.w * vwScale) + 'px';
      el.style.height = (cfg.h * vwScale) + 'px';
      el.style.overflow = 'visible';
    });
  }

  // --- Fade-in animations ---
  function animateElements() {
    var elementIds = [
      'LBDCd1JmbqkJhPRP',
      'LBzm9W79wkmqfjVS',
      'LBBsfTgmzmw24h5m',
      'LBWkLWRYQkZjxbTL',
      'LBgT3dm0HZMHySR0',
      'LB4sSj5DxgVQFvYp',
      'LBNFnN3BBrtQ3sWG',
      'LB9Mk4jffcm2QdtQ',
      'LBnsrLPZQhnNL6q7',
      'LBVKchzfdp9MpRN0',
      'LBpzCD4WwzL7XCmt',
      'LBjX0YtvYQlp1MyD',
      'LBrtFtQf2kZDQLHR',
      '__id8',
      '__id12',
      '__id16'
    ];

    var stagger = 0.705;
    var duration = 0.795;
    var n = elementIds.length;

    elementIds.forEach(function (id, index) {
      var el = document.getElementById(id);
      if (!el) return;

      var delay = n > 1 ? (stagger / (n - 1)) * index : 0;
      el.style.opacity = '0';
      el.style.animationFillMode = 'forwards';
      el.style.animationName = '_5Wn9Ig';
      el.style.animationDelay = delay + 's';
      el.style.animationDuration = duration + 's';
    });
  }

  // --- Handle layout ---
  function layout() {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      setupMobile();
    } else {
      scaleDesktop();
    }
  }

  // --- Init ---
  function init() {
    layout();
    // Delay animations until page is visually ready (images loaded, paint complete)
    // First hide all elements, then trigger fade-in after load
    hideElements();
  }

  function hideElements() {
    var elementIds = [
      'LBDCd1JmbqkJhPRP', 'LBzm9W79wkmqfjVS', 'LBBsfTgmzmw24h5m',
      'LBWkLWRYQkZjxbTL', 'LBgT3dm0HZMHySR0', 'LB4sSj5DxgVQFvYp',
      'LBNFnN3BBrtQ3sWG', 'LB9Mk4jffcm2QdtQ', 'LBnsrLPZQhnNL6q7',
      'LBVKchzfdp9MpRN0', 'LBpzCD4WwzL7XCmt', 'LBjX0YtvYQlp1MyD',
      'LBrtFtQf2kZDQLHR', '__id8', '__id12', '__id16'
    ];
    elementIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.opacity = '0';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // --- Apply gradient styling to underlined words and heartbeat to quote ---
  function applyEffects() {
    // Find all xtSH_A spans that contain underlined letters
    var allWordSpans = document.querySelectorAll('.xtSH_A');
    var gradientWords = ['CMU', 'smile', 'technology', 'humane'];

    allWordSpans.forEach(function (span) {
      var text = span.textContent.trim();
      var hasUnderline = false;
      var letters = span.querySelectorAll('.a_GcMg');
      letters.forEach(function (l) {
        if (l.style.textDecorationLine === 'underline') hasUnderline = true;
      });

      if (hasUnderline && gradientWords.indexOf(text) !== -1) {
        // Mark as gradient word
        span.classList.add('gradient-word');
        // Remove inline underline, let CSS handle hover
        letters.forEach(function (l) {
          l.style.textDecorationLine = 'none';
        });
      }

      // Remove underline from @ symbol (before CMU)
      if (text === 'Entrepreneurship' || text.indexOf('@') !== -1) {
        letters.forEach(function (l) {
          if (l.textContent === '@' && l.style.textDecorationLine === 'underline') {
            l.style.textDecorationLine = 'none';
          }
        });
      }
    });

    // Also check for loose @ spans with underline (not inside xtSH_A)
    var allLetterSpans = document.querySelectorAll('.a_GcMg');
    allLetterSpans.forEach(function (l) {
      if (l.textContent === '@' && l.style.textDecorationLine === 'underline') {
        l.style.textDecorationLine = 'none';
      }
    });

    // Add heartbeat class to the quote element
    var quote = document.getElementById('LBrtFtQf2kZDQLHR');
    if (quote) quote.classList.add('heartbeat-quote');
  }

  // Trigger animations after everything is loaded and painted
  window.addEventListener('load', function () {
    setTimeout(function () {
      applyEffects();
      animateElements();
      // Start heartbeat after fade-in completes (stagger + duration)
      var fadeTotal = 0.705 + 0.795; // stagger + duration in seconds
      setTimeout(function () {
        var quote = document.querySelector('.heartbeat-quote');
        if (quote) quote.classList.add('heartbeat-active');
      }, fadeTotal * 1000 + 200);
    }, 100);
  });

  window.addEventListener('resize', layout);
})();
