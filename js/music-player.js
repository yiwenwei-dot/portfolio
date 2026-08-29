(function () {
  var tracks = [
    { title: 'I Am You', src: 'music_player/I Am You.mp3' },
    { title: 'Por una Cabeza', src: 'music_player/Por una Cabeza - Carlos Gardel.mp3?v=2' },
    { title: 'Waltz of the Flowers', src: 'music_player/The Nutcracker (Suite) , Op. 71a, TH. 35： III. Waltz of the Flowers.mp3' },
    { title: '模特 - 李荣浩', src: 'music_player/李荣浩 - 模特 (动态歌词).mp3' },
    { title: '世界的約定', src: 'music_player/霍爾的移動城堡 世界的約定.mp3' },
  ];

  var currentIndex = 0;
  var isPlaying = false;
  var isExpanded = false;
  var playerRevealed = false;
  var lastStep = 1;    // direction of the last prev/next press
  var failStreak = 0;  // consecutive tracks that failed to load
  var audio = new Audio();

  var container = document.createElement('div');
  container.id = 'aya-music-player';
  container.innerHTML =
    '<div class="mp-fab" title="Music Player">' +
      '<svg class="mp-icon-note" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>' +
      '</svg>' +
    '</div>' +
    '<div class="mp-panel">' +
      '<div class="mp-header"><span class="mp-title">Music</span><button class="mp-close">&times;</button></div>' +
      '<div class="mp-now">' +
        '<div class="mp-track-name"></div>' +
        '<div class="mp-progress-bar"><div class="mp-progress-fill"></div></div>' +
        '<div class="mp-time"><span class="mp-cur">0:00</span> / <span class="mp-dur">0:00</span></div>' +
      '</div>' +
      '<div class="mp-controls">' +
        '<button class="mp-btn mp-prev" title="Previous"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>' +
        '<button class="mp-btn mp-play" title="Play">' +
          '<svg class="mp-icon-play" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>' +
          '<svg class="mp-icon-pause" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' +
        '</button>' +
        '<button class="mp-btn mp-next" title="Next"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>' +
      '</div>' +
      '<ul class="mp-list"></ul>' +
    '</div>';
  document.body.appendChild(container);

  // The page navigates via document-level listeners that hit-test pointer
  // coordinates against word bounding boxes (see custom.js). The player is
  // position:fixed over a canvas that scrolls underneath it, so on small screens
  // its buttons regularly sit on top of 'I think' / 'I teach' / 'smile' — and a
  // tap on prev/next fired BOTH the player and the navigation. Keep the player's
  // pointer events inside the player so they never reach those listeners.
  ['click', 'pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(function (evt) {
    container.addEventListener(evt, function (e) { e.stopPropagation(); });
  });

  // Hide player until triggered by clicking 'humane'
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.transition = 'opacity 0.5s ease';

  var fab = container.querySelector('.mp-fab');
  var panel = container.querySelector('.mp-panel');
  var closeBtn = container.querySelector('.mp-close');
  var trackName = container.querySelector('.mp-track-name');
  var playBtn = container.querySelector('.mp-play');
  var prevBtn = container.querySelector('.mp-prev');
  var nextBtn = container.querySelector('.mp-next');
  var iconPlay = container.querySelector('.mp-icon-play');
  var iconPause = container.querySelector('.mp-icon-pause');
  var progressWrap = container.querySelector('.mp-progress-bar');
  var progressFill = container.querySelector('.mp-progress-fill');
  var curTime = container.querySelector('.mp-cur');
  var durTime = container.querySelector('.mp-dur');
  var list = container.querySelector('.mp-list');

  tracks.forEach(function (t, i) {
    var li = document.createElement('li');
    li.textContent = t.title;
    li.addEventListener('click', function () { select(i); });
    list.appendChild(li);
  });

  function loadTrack(i) {
    currentIndex = i;
    audio.src = tracks[i].src;
    trackName.textContent = tracks[i].title;
    updateActiveItem();
  }

  // Safari rejects the play() promise with AbortError whenever src changes while
  // a play is pending (which is exactly what fast prev/next tapping does).
  // Swallow it so it doesn't surface as an unhandled rejection.
  function play() {
    var p = audio.play();
    if (p && typeof p.catch === 'function') p.catch(function () {});
  }

  // Jump to a specific track (playlist click / external trigger)
  function select(i) {
    lastStep = 1;
    failStreak = 0;
    loadTrack(i);
    play();
  }

  // Move one track in a direction and remember which way we were heading
  function step(delta) {
    lastStep = delta;
    failStreak = 0;
    loadTrack((currentIndex + delta + tracks.length) % tracks.length);
    play();
  }

  function updateActiveItem() {
    var items = list.querySelectorAll('li');
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle('active', i === currentIndex);
    }
  }

  function updatePlayIcon() {
    iconPlay.style.display = isPlaying ? 'none' : '';
    iconPause.style.display = isPlaying ? '' : 'none';
    fab.classList.toggle('playing', isPlaying);
  }

  function fmt(s) {
    if (!s || !isFinite(s)) return '0:00';
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  // Attach the audio listeners. Re-used when the element is rebuilt after
  // bfcache restore; `live` drops events from a superseded element so a stale
  // one can't drive the UI or advance the playlist.
  function wireAudio(a) {
    function live(fn) {
      return function () { if (a === audio) fn(); };
    }
    a.addEventListener('play', live(function () { isPlaying = true; updatePlayIcon(); }));
    a.addEventListener('pause', live(function () { isPlaying = false; updatePlayIcon(); }));
    a.addEventListener('playing', live(function () { failStreak = 0; }));
    a.addEventListener('ended', live(function () { step(1); }));
    a.addEventListener('error', live(function () {
      // A track failed to load. Skip in the direction the listener was heading —
      // always skipping forward is what made 'previous' jump the wrong way — and
      // stop after one full lap so an all-missing playlist can't loop forever.
      if (++failStreak >= tracks.length) { failStreak = 0; return; }
      loadTrack((currentIndex + lastStep + tracks.length) % tracks.length);
      play();
    }));
    a.addEventListener('timeupdate', live(function () {
      if (a.duration) {
        progressFill.style.width = (a.currentTime / a.duration * 100) + '%';
        curTime.textContent = fmt(a.currentTime);
        durTime.textContent = fmt(a.duration);
      }
    }));
  }

  fab.addEventListener('click', function () {
    isExpanded = !isExpanded;
    panel.classList.toggle('open', isExpanded);
    fab.classList.toggle('hidden', isExpanded);
  });

  closeBtn.addEventListener('click', function () {
    isExpanded = false;
    panel.classList.remove('open');
    fab.classList.remove('hidden');
  });

  playBtn.addEventListener('click', function () {
    if (!audio.src) loadTrack(0);
    isPlaying ? audio.pause() : play();
  });

  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });

  wireAudio(audio);

  // Restore audio state when returning via browser back (bfcache)
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && playerRevealed) {
      // Re-create audio element to avoid stale bfcache state
      var wasPlaying = isPlaying;
      var savedTime = audio.currentTime;
      var savedIndex = currentIndex;
      audio = new Audio();
      wireAudio(audio);
      loadTrack(savedIndex);
      if (wasPlaying) {
        audio.currentTime = savedTime;
        play();
      }
    }
  });

  progressWrap.addEventListener('click', function (e) {
    if (audio.duration) {
      var rect = progressWrap.getBoundingClientRect();
      audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    }
  });

  loadTrack(0);

  // Expose a global function to play a track by index
  window.ayaMusicPlay = function (index) {
    if (!playerRevealed) {
      playerRevealed = true;
      container.style.opacity = '1';
      container.style.pointerEvents = '';
    }
    isExpanded = true;
    panel.classList.add('open');
    fab.classList.add('hidden');
    select(index);
  };

  // Find the 'humane' span and use coordinate-based click detection (works through Canva overlays)
  function attachHumaneTrigger() {
    var humaneSpan = null;
    var allWordSpans = document.querySelectorAll('.xtSH_A');
    allWordSpans.forEach(function (span) {
      if (span.textContent.trim() === 'humane') {
        humaneSpan = span;
        span.style.cursor = 'pointer';
      }
    });
    if (humaneSpan) {
      document.addEventListener('click', function (e) {
        // Ignore taps that landed on the player itself — 'humane' can sit
        // directly under the controls once the canvas is scrolled.
        if (e.target && e.target.closest && e.target.closest('#aya-music-player')) return;
        var rect = humaneSpan.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          if (window.ayaMusicPlay) window.ayaMusicPlay(0); // I Am You is track index 0
        }
      });
    }
  }

  // Attach after effects are applied (small delay to ensure gradient-word class is set)
  window.addEventListener('load', function () {
    setTimeout(attachHumaneTrigger, 300);
  });
})();
