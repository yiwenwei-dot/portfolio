(function () {
  'use strict';

  var CANVAS_W = 1903;
  var CANVAS_H = 928;
  var MOBILE_BREAKPOINT = 768;
  var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // Clamp tooltip position to stay within viewport
  function clampTooltip(tooltip, left, top) {
    // Force layout so offsetWidth/Height are available
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    var w = tooltip.offsetWidth;
    var h = tooltip.offsetHeight;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - h - 8));
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  // Show a tooltip near an element, mobile-aware positioning
  function positionTooltip(tooltip, targetRect, mode) {
    var left, top;
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      // Mobile: center below the element
      left = (window.innerWidth - tooltip.offsetWidth) / 2;
      top = targetRect.bottom + 5;
    } else if (mode === 'below') {
      left = targetRect.left;
      top = targetRect.bottom + 2;
    } else {
      // Default: right of element
      left = targetRect.right + 10;
      top = targetRect.top - 4;
    }
    clampTooltip(tooltip, left, top);
    tooltip.classList.add('visible');
  }

  // Add touch support for tooltip: tap to show, auto-dismiss
  function addTouchTooltip(targetEl, tooltip, pad) {
    if (!isTouchDevice) return;
    var dismissTimer = null;

    function showTooltip() {
      // Prefer the inner text container's rect so touch-target padding
      // (min-height: 44px on 01/02/03) doesn't push tooltips far below text.
      var innerText = targetEl.querySelector('.aF9o6Q');
      var rect = innerText ? innerText.getBoundingClientRect() : targetEl.getBoundingClientRect();
      positionTooltip(tooltip, rect);
      if (dismissTimer) clearTimeout(dismissTimer);
      dismissTimer = setTimeout(function () {
        tooltip.classList.remove('visible');
      }, 2000);
    }

    function hideTooltip() {
      tooltip.classList.remove('visible');
      if (dismissTimer) clearTimeout(dismissTimer);
    }

    targetEl.addEventListener('touchstart', function (e) {
      showTooltip();
    }, { passive: true });

    // Dismiss on tap elsewhere
    document.addEventListener('touchstart', function (e) {
      if (!targetEl.contains(e.target)) {
        hideTooltip();
      }
    }, { passive: true });
  }

  // --- Desktop: scale canvas to fill viewport ---
  function scaleDesktop() {
    if (window.innerWidth <= MOBILE_BREAKPOINT) return;

    // Ensure every container from html down to the canvas fills the viewport
    var canvas = document.querySelector('._8jGYJw');
    if (!canvas) return;
    var el = canvas.parentElement;
    while (el && el !== document.documentElement) {
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.overflow = 'hidden';
      el.style.margin = '0';
      el.style.padding = '0';
      el = el.parentElement;
    }
    document.documentElement.style.width = '100%';
    document.documentElement.style.height = '100%';
    document.documentElement.style.margin = '0';
    document.documentElement.style.overflow = 'hidden';

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

    // Use vw units so dimensions scale with zoom, matching CSS vw-based positions
    Object.keys(textElements).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var tc = el.querySelector('.aF9o6Q');
      if (!tc) return;
      var cfg = textElements[id];
      var s = cfg.scale;

      // Convert px dimensions to vw: (px / 390) * 100 vw
      var wVw = cfg.w / 390 * 100;
      var hVw = cfg.h / 390 * 100;

      // Set child to pre-scale (unscaled) dimensions so text wraps correctly
      tc.style.width = (wVw / s) + 'vw';
      tc.style.height = (hVw / s) + 'vw';
      tc.style.transform = 'scale(' + s + ', ' + s + ')';
      tc.style.transformOrigin = '0px 0px';

      // Set parent to post-scale (visual) dimensions
      el.style.width = wVw + 'vw';
      el.style.height = hVw + 'vw';
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
      '__id16',
      '__id_cal'
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
      'LBrtFtQf2kZDQLHR', '__id8', '__id12', '__id16', '__id_cal'
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

        // Mark 'CMU' with pointer cursor
        if (text === 'CMU') {
          span.style.cursor = 'pointer';
        }
      }

      // Remove underline from "@ " (@ and trailing space)
      if (text === 'Entrepreneurship' || text.indexOf('@') !== -1 || text === '@' || text === '@ ') {
        var foundAt = false;
        letters.forEach(function (l) {
          if (l.textContent === '@') {
            foundAt = true;
            l.style.textDecorationLine = 'none';
          } else if (foundAt && l.textContent === ' ') {
            l.style.textDecorationLine = 'none';
            foundAt = false;
          } else {
            foundAt = false;
          }
        });
      }
    });

    // Also check for loose @ and adjacent space spans with underline
    var allLetterSpans = document.querySelectorAll('.a_GcMg');
    allLetterSpans.forEach(function (l) {
      if (l.textContent === '@' && l.style.textDecorationLine === 'underline') {
        l.style.textDecorationLine = 'none';
        var next = l.nextElementSibling;
        if (next && next.textContent === ' ' && next.style.textDecorationLine === 'underline') {
          next.style.textDecorationLine = 'none';
        }
      }
    });

    // Add heartbeat class to the quote element
    var quote = document.getElementById('LBrtFtQf2kZDQLHR');
    if (quote) quote.classList.add('heartbeat-quote');

    // 'essence': hover to enlarge 20%, click to play 'Por una Cabeza'
    var essenceSpans = [];
    document.querySelectorAll('.a_GcMg').forEach(function (span) {
      if (span.textContent.trim() === 'essence') {
        span.classList.add('essence-interactive');
        essenceSpans.push(span);
      }
    });
    allWordSpans.forEach(function (span) {
      if (span.textContent.trim() === 'essence') {
        span.classList.add('essence-interactive');
        essenceSpans.push(span);
      }
    });

    // Use the first essence span for hit detection, enlarge all on hover
    var essenceHovered = false;
    if (essenceSpans.length) {
      document.addEventListener('mousemove', function (e) {
        var hit = false;
        for (var i = 0; i < essenceSpans.length; i++) {
          var rect = essenceSpans[i].getBoundingClientRect();
          if (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          ) {
            hit = true;
            break;
          }
        }
        if (hit && !essenceHovered) {
          essenceHovered = true;
          essenceSpans.forEach(function (s) {
            s.style.fontSize = '1.2em';
          });
        } else if (!hit && essenceHovered) {
          essenceHovered = false;
          essenceSpans.forEach(function (s) {
            s.style.fontSize = '1em';
          });
        }
      });
    }

    // Touch support for essence enlargement
    if (isTouchDevice && essenceSpans.length) {
      var essenceTouchTimer = null;
      essenceSpans.forEach(function (s) {
        s.addEventListener('touchstart', function () {
          essenceSpans.forEach(function (sp) {
            sp.style.fontSize = '1.2em';
            sp.classList.add('touch-active');
          });
          if (essenceTouchTimer) clearTimeout(essenceTouchTimer);
          essenceTouchTimer = setTimeout(function () {
            essenceSpans.forEach(function (sp) {
              sp.style.fontSize = '1em';
              sp.classList.remove('touch-active');
            });
          }, 2000);
        }, { passive: true });
      });
    }

    // Touch feedback for gradient-words
    if (isTouchDevice) {
      document.querySelectorAll('.gradient-word').forEach(function (span) {
        span.addEventListener('touchstart', function () {
          span.classList.add('touch-active');
          setTimeout(function () {
            span.classList.remove('touch-active');
          }, 600);
        }, { passive: true });
      });
    }

    // Build map of interactive word spans
    var interactiveWords = {};
    allWordSpans.forEach(function (span) {
      var text = span.textContent.trim();
      if (['CMU', 'technology', 'smile'].indexOf(text) !== -1) {
        interactiveWords[text] = span;
        span.style.cursor = 'pointer';
      }
    });

    // 'Who am I?' hover enlarge + tooltip + click to play video
    var elWho = document.getElementById('LBBsfTgmzmw24h5m');
    if (elWho) {
      elWho.style.cursor = 'pointer';
      elWho.style.transition = 'transform 0.3s ease';
      elWho.style.contain = 'none';
      elWho.style.overflow = 'visible';
      var whoLetters = elWho.querySelectorAll('.a_GcMg');
      whoLetters.forEach(function (s) { s.style.transition = 'font-size 0.3s ease'; });

      var tooltipWho = document.createElement('div');
      tooltipWho.className = 'glass-tooltip';
      tooltipWho.textContent = 'mein30seconds.com';
      document.body.appendChild(tooltipWho);

      var whoHovered = false;
      document.addEventListener('mousemove', function (e) {
        var rect = elWho.getBoundingClientRect();
        var pad = 12;
        var inRange = (
          e.clientX >= rect.left - pad &&
          e.clientX <= rect.right + pad &&
          e.clientY >= rect.top - pad &&
          e.clientY <= rect.bottom + pad
        );
        if (inRange && !whoHovered) {
          whoHovered = true;
          whoLetters.forEach(function (s) { s.style.fontSize = '1.2em'; });
          var r = elWho.getBoundingClientRect();
          clampTooltip(tooltipWho, r.left, r.bottom + 4);
          tooltipWho.classList.add('visible');
        } else if (!inRange && whoHovered) {
          whoHovered = false;
          whoLetters.forEach(function (s) { s.style.fontSize = ''; });
          tooltipWho.classList.remove('visible');
        }
      });
      addTouchTooltip(elWho, tooltipWho, 12);

      // Click: open video modal
      elWho.addEventListener('click', function (e) {
        e.stopPropagation();
        openVideoModal('_assets/media/Self-introduction.mp4');
      });
    }

    // Video modal helper
    function openVideoModal(videoSrc) {
      var existing = document.getElementById('video-modal-overlay');
      if (existing) existing.remove();

      var overlay = document.createElement('div');
      overlay.id = 'video-modal-overlay';
      overlay.className = 'video-modal-overlay';

      var container = document.createElement('div');
      container.className = 'video-modal-container';

      var closeBtn = document.createElement('button');
      closeBtn.className = 'video-modal-close';
      closeBtn.setAttribute('aria-label', 'Close video');
      closeBtn.innerHTML = '&times;';

      var video = document.createElement('video');
      video.src = videoSrc;
      video.controls = true;
      video.autoplay = true;
      video.className = 'video-modal-player';

      container.appendChild(closeBtn);
      container.appendChild(video);
      overlay.appendChild(container);
      document.body.appendChild(overlay);

      function closeModal() {
        video.pause();
        overlay.remove();
        document.removeEventListener('keydown', escHandler);
      }
      function escHandler(ev) { if (ev.key === 'Escape') closeModal(); }
      closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', function (ev) {
        if (ev.target === overlay) closeModal();
      });
      document.addEventListener('keydown', escHandler);
    }

    // '01' label: hover enlarge + shift + tooltip + click redirect
    var el01 = document.getElementById('LBNFnN3BBrtQ3sWG');
    if (el01) {
      el01.style.cursor = 'pointer';
      el01.style.transition = 'transform 0.3s ease';
      el01.style.contain = 'none';
      el01.style.overflow = 'visible';
      interactiveWords['01'] = el01;
      var el01Letters = el01.querySelectorAll('.a_GcMg');
      el01Letters.forEach(function (s) {
        s.style.transition = 'font-size 0.3s ease';
      });

      var tooltip = document.createElement('div');
      tooltip.className = 'glass-tooltip';
      tooltip.textContent = 'integratedthinkingtechnicalproject.com';
      document.body.appendChild(tooltip);

      var el01Hovered = false;
      document.addEventListener('mousemove', function (e) {
        var rect = el01.getBoundingClientRect();
        var pad = 12;
        var inRange = (
          e.clientX >= rect.left - pad &&
          e.clientX <= rect.right + pad &&
          e.clientY >= rect.top - pad &&
          e.clientY <= rect.bottom + pad
        );
        if (inRange && !el01Hovered) {
          el01Hovered = true;
          el01Letters.forEach(function (s) { s.style.fontSize = '2em'; });
          el01.style.transform = (el01.style.transform || '').replace(/ translate\([^)]*\)$/, '') + ' translate(4px, -3px)';
          var el01Inner = el01.querySelector('.aF9o6Q');
          var r = (el01Inner || el01).getBoundingClientRect();
          clampTooltip(tooltip, r.left, r.bottom + 4);
          tooltip.classList.add('visible');
        } else if (!inRange && el01Hovered) {
          el01Hovered = false;
          el01Letters.forEach(function (s) { s.style.fontSize = ''; });
          el01.style.transform = (el01.style.transform || '').replace(/ translate\([^)]*\)$/, '');
          tooltip.classList.remove('visible');
        }
      });
      addTouchTooltip(el01, tooltip, 12);
    }

    // '02' label: hover enlarge + shift + tooltip + click redirect
    var el02 = document.getElementById('LBnsrLPZQhnNL6q7');
    if (el02) {
      el02.style.cursor = 'pointer';
      el02.style.transition = 'transform 0.3s ease';
      el02.style.contain = 'none';
      el02.style.overflow = 'visible';
      var el02TextContainer = el02.querySelector('._2UyCZQ');
      if (el02TextContainer) el02TextContainer.classList.add('Mb8E_A');
      interactiveWords['02'] = el02;
      var el02Letters = el02.querySelectorAll('.a_GcMg');
      el02Letters.forEach(function (s) {
        s.style.transition = 'font-size 0.3s ease';
      });

      var tooltip02 = document.createElement('div');
      tooltip02.className = 'glass-tooltip';
      tooltip02.textContent = 'teachingistailoring.com';
      document.body.appendChild(tooltip02);

      var el02Hovered = false;
      document.addEventListener('mousemove', function (e) {
        var rect = el02.getBoundingClientRect();
        var pad = 12;
        var inRange = (
          e.clientX >= rect.left - pad &&
          e.clientX <= rect.right + pad &&
          e.clientY >= rect.top - pad &&
          e.clientY <= rect.bottom + pad
        );
        if (inRange && !el02Hovered) {
          el02Hovered = true;
          el02Letters.forEach(function (s) { s.style.fontSize = '2em'; });
          el02.style.transform = (el02.style.transform || '').replace(/ translate\([^)]*\)$/, '') + ' translate(4px, -3px)';
          var el02Inner = el02.querySelector('.aF9o6Q');
          var r = (el02Inner || el02).getBoundingClientRect();
          clampTooltip(tooltip02, r.left, r.bottom + 4);
          tooltip02.classList.add('visible');
        } else if (!inRange && el02Hovered) {
          el02Hovered = false;
          el02Letters.forEach(function (s) { s.style.fontSize = ''; });
          el02.style.transform = (el02.style.transform || '').replace(/ translate\([^)]*\)$/, '');
          tooltip02.classList.remove('visible');
        }
      });
      addTouchTooltip(el02, tooltip02, 12);
    }

    // '03' label: hover enlarge + shift + tooltip + click redirect
    var el03 = document.getElementById('LBpzCD4WwzL7XCmt');
    if (el03) {
      el03.style.cursor = 'pointer';
      el03.style.transition = 'transform 0.3s ease';
      el03.style.contain = 'none';
      el03.style.overflow = 'visible';
      var el03TextContainer = el03.querySelector('._2UyCZQ');
      if (el03TextContainer) el03TextContainer.classList.add('Mb8E_A');
      interactiveWords['03'] = el03;
      var el03Letters = el03.querySelectorAll('.a_GcMg');
      el03Letters.forEach(function (s) {
        s.style.transition = 'font-size 0.3s ease';
      });

      var tooltip03 = document.createElement('div');
      tooltip03.className = 'glass-tooltip';
      tooltip03.textContent = 'howaconfidentspeakeriscultivated.com';
      document.body.appendChild(tooltip03);

      var el03Hovered = false;
      document.addEventListener('mousemove', function (e) {
        var rect = el03.getBoundingClientRect();
        var pad = 12;
        var inRange = (
          e.clientX >= rect.left - pad &&
          e.clientX <= rect.right + pad &&
          e.clientY >= rect.top - pad &&
          e.clientY <= rect.bottom + pad
        );
        if (inRange && !el03Hovered) {
          el03Hovered = true;
          el03Letters.forEach(function (s) { s.style.fontSize = '2em'; });
          el03.style.transform = (el03.style.transform || '').replace(/ translate\([^)]*\)$/, '') + ' translate(4px, -3px)';
          var el03Inner = el03.querySelector('.aF9o6Q');
          var r = (el03Inner || el03).getBoundingClientRect();
          clampTooltip(tooltip03, r.left, r.bottom + 4);
          tooltip03.classList.add('visible');
        } else if (!inRange && el03Hovered) {
          el03Hovered = false;
          el03Letters.forEach(function (s) { s.style.fontSize = ''; });
          el03.style.transform = (el03.style.transform || '').replace(/ translate\([^)]*\)$/, '');
          tooltip03.classList.remove('visible');
        }
      });
      addTouchTooltip(el03, tooltip03, 12);
    }

    // 'I talk' text: hover enlarge + shift + tooltip + click redirect
    var elTalk = document.getElementById('LBVKchzfdp9MpRN0');
    if (elTalk) {
      elTalk.style.cursor = 'pointer';
      elTalk.style.transition = 'transform 0.3s ease';
      var talkLetters = elTalk.querySelectorAll('.a_GcMg');
      talkLetters.forEach(function (s) {
        s.style.transition = 'font-size 0.3s ease';
      });

      var tooltipTalk = document.createElement('div');
      tooltipTalk.className = 'glass-tooltip';
      tooltipTalk.textContent = 'talkandmakeproduct.com';
      document.body.appendChild(tooltipTalk);

      var talkHovered = false;
      document.addEventListener('mousemove', function (e) {
        var rect = elTalk.getBoundingClientRect();
        var pad = 12;
        var inRange = (
          e.clientX >= rect.left - pad &&
          e.clientX <= rect.right + pad &&
          e.clientY >= rect.top - pad &&
          e.clientY <= rect.bottom + pad
        );
        if (inRange && !talkHovered) {
          talkHovered = true;
          talkLetters.forEach(function (s) { s.style.fontSize = '1.2em'; });
          elTalk.style.transform = (elTalk.style.transform || '').replace(/ translate\([^)]*\)$/, '') + ' translate(4px, -3px)';
          // Position tooltip below, left-aligned
          var r = elTalk.getBoundingClientRect();
          var left = r.left;
          var top = r.bottom + 4;
          tooltipTalk.style.left = left + 'px';
          tooltipTalk.style.top = top + 'px';
          clampTooltip(tooltipTalk, left, top);
          tooltipTalk.classList.add('visible');
        } else if (!inRange && talkHovered) {
          talkHovered = false;
          talkLetters.forEach(function (s) { s.style.fontSize = ''; });
          elTalk.style.transform = (elTalk.style.transform || '').replace(/ translate\([^)]*\)$/, '');
          tooltipTalk.classList.remove('visible');
        }
      });

      addTouchTooltip(elTalk, tooltipTalk, 12);

      // Click: direct + coordinate fallback
      elTalk.addEventListener('click', function () {
        window.open('talk.html', '_self');
      });
      document.addEventListener('click', function (e) {
        var rect = elTalk.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
          window.open('talk.html', '_self');
        }
      });
    }

    // 'I teach' text: hover enlarge + shift + tooltip + click redirect
    var elTeach = document.getElementById('LB9Mk4jffcm2QdtQ');
    if (elTeach) {
      elTeach.style.cursor = 'pointer';
      elTeach.style.transition = 'transform 0.3s ease';
      var teachLetters = elTeach.querySelectorAll('.a_GcMg');
      teachLetters.forEach(function (s) {
        s.style.transition = 'font-size 0.3s ease';
      });

      var tooltipTeach = document.createElement('div');
      tooltipTeach.className = 'glass-tooltip';
      tooltipTeach.textContent = 'learningisfun.com';
      document.body.appendChild(tooltipTeach);

      var teachHovered = false;
      document.addEventListener('mousemove', function (e) {
        var rect = elTeach.getBoundingClientRect();
        var pad = 12;
        var inRange = (
          e.clientX >= rect.left - pad &&
          e.clientX <= rect.right + pad &&
          e.clientY >= rect.top - pad &&
          e.clientY <= rect.bottom + pad
        );
        if (inRange && !teachHovered) {
          teachHovered = true;
          teachLetters.forEach(function (s) { s.style.fontSize = '1.2em'; });
          elTeach.style.transform = (elTeach.style.transform || '').replace(/ translate\([^)]*\)$/, '') + ' translate(4px, -3px)';
          var r = elTeach.getBoundingClientRect();
          var left = r.left;
          var top = r.bottom + 4;
          tooltipTeach.style.left = left + 'px';
          tooltipTeach.style.top = top + 'px';
          clampTooltip(tooltipTeach, left, top);
          tooltipTeach.classList.add('visible');
        } else if (!inRange && teachHovered) {
          teachHovered = false;
          teachLetters.forEach(function (s) { s.style.fontSize = ''; });
          elTeach.style.transform = (elTeach.style.transform || '').replace(/ translate\([^)]*\)$/, '');
          tooltipTeach.classList.remove('visible');
        }
      });

      addTouchTooltip(elTeach, tooltipTeach, 12);

      elTeach.addEventListener('click', function () {
        window.open('teach.html', '_self');
      });
      document.addEventListener('click', function (e) {
        var rect = elTeach.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
          window.open('teach.html', '_self');
        }
      });
    }

    // 'I think' text: hover enlarge + shift + tooltip + click redirect
    var elThink = document.getElementById('LB4sSj5DxgVQFvYp');
    if (elThink) {
      elThink.style.cursor = 'pointer';
      elThink.style.transition = 'transform 0.3s ease';
      var thinkLetters = elThink.querySelectorAll('.a_GcMg');
      thinkLetters.forEach(function (s) {
        s.style.transition = 'font-size 0.3s ease';
      });

      var tooltipThink = document.createElement('div');
      tooltipThink.className = 'glass-tooltip';
      tooltipThink.textContent = 'readingandwritingaremypassion.com';
      document.body.appendChild(tooltipThink);

      var thinkHovered = false;
      document.addEventListener('mousemove', function (e) {
        var rect = elThink.getBoundingClientRect();
        var pad = 12;
        var inRange = (
          e.clientX >= rect.left - pad &&
          e.clientX <= rect.right + pad &&
          e.clientY >= rect.top - pad &&
          e.clientY <= rect.bottom + pad
        );
        if (inRange && !thinkHovered) {
          thinkHovered = true;
          thinkLetters.forEach(function (s) { s.style.fontSize = '1.2em'; });
          elThink.style.transform = (elThink.style.transform || '').replace(/ translate\([^)]*\)$/, '') + ' translate(4px, -3px)';
          var r = elThink.getBoundingClientRect();
          var left = r.left;
          var top = r.bottom + 4;
          tooltipThink.style.left = left + 'px';
          tooltipThink.style.top = top + 'px';
          clampTooltip(tooltipThink, left, top);
          tooltipThink.classList.add('visible');
        } else if (!inRange && thinkHovered) {
          thinkHovered = false;
          thinkLetters.forEach(function (s) { s.style.fontSize = ''; });
          elThink.style.transform = (elThink.style.transform || '').replace(/ translate\([^)]*\)$/, '');
          tooltipThink.classList.remove('visible');
        }
      });

      addTouchTooltip(elThink, tooltipThink, 12);

      elThink.addEventListener('click', function () {
        window.open('article.html', '_self');
      });
      document.addEventListener('click', function (e) {
        var rect = elThink.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
          window.open('article.html', '_self');
        }
      });
    }

    // Interactive word click actions
    var wordActions = {
      'CMU': 'https://www.cmu.edu/iii/people/students/mssm.html',
      'technology': 'http://app.turtletalk.io/demo',
      'smile': 'smile.html',
      '01': 'https://www.openinnolab.org.cn/pjlab/project?id=63d8da549bd420342591c7d1&sc=63797fc77300080be72c0525',
      '02': 'teachingalive.html',
      '03': 'product.html'
    };

    // Click handler: walk up from e.target to find an interactive word span or element
    document.addEventListener('click', function (e) {
      var el = e.target;
      while (el && el !== document.body) {
        // Check for 'essence' click (a_GcMg or xtSH_A)
        if (el.classList && el.classList.contains('essence-interactive')) {
          if (window.ayaMusicPlay) window.ayaMusicPlay(1); // Por una Cabeza is track index 1
          return;
        }
        // Check xtSH_A word spans
        if (el.classList && el.classList.contains('xtSH_A')) {
          var word = el.textContent.trim();
          if (wordActions[word]) {
            var target = wordActions[word].indexOf('http') === 0 ? '_blank' : '_self';
            window.open(wordActions[word], target);
            return;
          }
        }
        // Check '01' container by ID
        if (el.id === 'LBNFnN3BBrtQ3sWG') {
          window.open(wordActions['01'], '_blank');
          return;
        }
        // Check '02' container by ID
        if (el.id === 'LBnsrLPZQhnNL6q7') {
          window.open(wordActions['02'], '_self');
          return;
        }
        // Check '03' container by ID
        if (el.id === 'LBpzCD4WwzL7XCmt') {
          window.open(wordActions['03'], '_self');
          return;
        }
        el = el.parentElement;
      }

      // Fallback: coordinate-based check for when overlays block target detection
      Object.keys(wordActions).forEach(function (word) {
        var span = interactiveWords[word];
        if (!span) return;
        var rect = span.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          var t = wordActions[word].indexOf('http') === 0 ? '_blank' : '_self';
          window.open(wordActions[word], t);
        }
      });
    });
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
