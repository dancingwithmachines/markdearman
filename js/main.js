/* =========================================================
   Mark Dearman — site behaviour
   ========================================================= */
(function () {
  'use strict';

  /* ----- CONFIG ----------------------------------------------------------
     Reel hosted on Cloudflare R2 (public r2.dev bucket). Two encodes: full
     1080p for desktop, lighter 720p for mobile — chosen at first play by
     viewport (see loadVideoOnce + isMobile). Loads lazily, so visitors who
     never hit play never download it. To move to a custom domain later
     (e.g. https://media.markdearman.com/…), just swap these URLs. */
  var VIDEO_SRC_DESKTOP = 'https://pub-15d77619aed144c2ba186d0f6338c703.r2.dev/reel.mp4';        // 1920×1080
  var VIDEO_SRC_MOBILE  = 'https://pub-15d77619aed144c2ba186d0f6338c703.r2.dev/reel-mobile.mp4'; // 1280×720

  var GUTTER = 20;      // px gutter around expanded video
  var MAX_W  = 1920;    // expanded width cap
  var MAX_H  = 1080;    // expanded height cap
  var HERO_GAP = 100;   // px gap left above the player for the hero type

  /* ----- ELEMENTS -------------------------------------------------------- */
  var slot     = document.getElementById('videoSlot');
  var player   = document.getElementById('videoPlayer');
  var videoEl  = document.getElementById('videoEl');
  var heroType = document.getElementById('heroType');
  var heroName = document.querySelector('.hero-name');
  var headerEl = document.getElementById('header');
  var backdrop = document.getElementById('videoBackdrop');
  var ctlPlay  = document.getElementById('ctlPlay');
  var ctlMute  = document.getElementById('ctlMute');
  var ctlClose = document.getElementById('ctlClose');

  var isOpen = false;
  var videoLoaded = false;
  var expandTimer, collapseTimer;   // fallbacks if transitionend doesn't fire

  /* ----- LONDON CLOCK ----------------------------------------------------
     Ticks every second in Europe/London (the time auto-tracks GMT/BST). The
     label is kept literally as "GMT" to match the design, including in BST. */
  var clockFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit',
    second: '2-digit', hour12: false
  });
  var clockEls = document.querySelectorAll('.gmt-time');
  function tickClock() {
    var t = clockFmt.format(new Date());
    for (var i = 0; i < clockEls.length; i++) clockEls[i].textContent = 'GMT ' + t;
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ----- HELPERS --------------------------------------------------------- */
  function isMobile() { return window.matchMedia('(max-width: 768px)').matches; }

  function setBox(el, top, left, w, h) {
    el.style.top = top + 'px';
    el.style.left = left + 'px';
    el.style.width = w + 'px';
    el.style.height = h + 'px';
  }

  function loadVideoOnce() {
    if (videoLoaded) return;
    videoLoaded = true;
    // Pick the encode by viewport at first play: lighter 720p on mobile.
    videoEl.src = isMobile() ? VIDEO_SRC_MOBILE : VIDEO_SRC_DESKTOP;
  }

  // Target rect for the expanded player: 16:9, centred, capped, 20px gutters.
  function computeTarget() {
    var availW = window.innerWidth - GUTTER * 2;
    var availH = window.innerHeight - GUTTER * 2;
    var w = Math.min(availW, MAX_W);
    var h = w * 9 / 16;
    var capH = Math.min(availH, MAX_H);
    if (h > capH) { h = capH; w = h * 16 / 9; }
    if (w > availW) { w = availW; h = w * 9 / 16; }
    return {
      top: (window.innerHeight - h) / 2,
      left: (window.innerWidth - w) / 2,
      width: w, height: h
    };
  }

  /* ----- OPEN (desktop expand) ------------------------------------------ */
  function openVideo() {
    if (isOpen) return;
    isOpen = true;

    // 1. Pin the player to its current on-screen position as a fixed element.
    //    Disable the transition for the pin so it does NOT animate from its
    //    docked top/left (which would make it fly to the top-left first); the
    //    pin must be instant so the expand then scales FROM where it sits.
    var rect = player.getBoundingClientRect();
    player.style.transition = 'none';
    player.classList.add('is-floating');
    setBox(player, rect.top, rect.left, rect.width, rect.height);
    void player.offsetWidth;            // commit the pinned position instantly
    player.style.transition = '';       // restore the CSS transition for the expand

    // 2. Lock the page + reveal backdrop, then animate to the target box.
    document.body.classList.add('video-open');
    player.classList.add('is-expanded');     // poster fades out

    var target = computeTarget();
    var heroRect = heroType.getBoundingClientRect();
    // Move the whole title block (name + type) up together so they keep their
    // arrangement and clear the player, leaving HERO_GAP above its top edge.
    var ty = 'translateY(' + Math.min(0, (target.top - HERO_GAP) - heroRect.bottom) + 'px)';
    heroType.style.transform = ty;
    if (heroName) heroName.style.transform = ty;
    if (headerEl) headerEl.style.transform = ty;   // header moves up with the hero

    setBox(player, target.top, target.left, target.width, target.height);
    loadVideoOnce();

    player.addEventListener('transitionend', onExpandEnd);
    clearTimeout(expandTimer);
    expandTimer = setTimeout(finishExpand, 900);   // fallback if transitionend doesn't fire
  }

  function onExpandEnd(e) {
    if (e.target !== player) return;
    if (e.propertyName !== 'width' && e.propertyName !== 'height') return;
    finishExpand();
  }

  // Idempotent: runs once per open, whichever fires first (transitionend or timer).
  function finishExpand() {
    if (!isOpen) return;
    if (player.classList.contains('video-ready')) return;
    player.removeEventListener('transitionend', onExpandEnd);
    clearTimeout(expandTimer);

    // Container is full size: fade the video in and start playing.
    player.classList.add('video-ready');
    videoEl.muted = false;
    player.classList.toggle('is-muted', videoEl.muted);
    var p = videoEl.play();
    if (p && p.catch) {
      p.catch(function () {            // autoplay-with-sound blocked → mute & retry
        videoEl.muted = true;
        player.classList.add('is-muted');
        videoEl.play().catch(function () {});
      });
    }
    player.classList.add('is-playing');
  }

  /* ----- CLOSE (collapse back to docked) -------------------------------- */
  function closeVideo() {
    if (!isOpen) return;
    isOpen = false;

    videoEl.pause();
    player.classList.remove('is-playing', 'controls-visible', 'video-ready', 'is-expanded');
    heroType.style.transform = '';
    if (heroName) heroName.style.transform = '';
    if (headerEl) headerEl.style.transform = '';
    document.body.classList.remove('video-open');

    // Animate back to the docked slot box. Called synchronously (no rAF) so the
    // collapse always fires — getBoundingClientRect forces the post-unlock layout.
    var r = slot.getBoundingClientRect();
    setBox(player, r.top, r.left, r.width, r.height);
    player.addEventListener('transitionend', onCollapseEnd);
    clearTimeout(collapseTimer);
    collapseTimer = setTimeout(finishCollapse, 900);   // fallback if transitionend doesn't fire
  }

  function onCollapseEnd(e) {
    if (e.target !== player) return;
    if (e.propertyName !== 'width' && e.propertyName !== 'height') return;
    finishCollapse();
  }

  // Idempotent: runs once per close, whichever fires first (transitionend or timer).
  function finishCollapse() {
    if (!player.classList.contains('is-floating')) return;
    player.removeEventListener('transitionend', onCollapseEnd);
    clearTimeout(collapseTimer);
    // Snap back to the docked (absolute, inset:0) box WITHOUT animating the swap.
    // Clearing the inline fixed coords while the transition is live re-triggers a
    // scale animation (the "repeat scale-in" bug) — so disable it for the snap.
    player.style.transition = 'none';
    player.classList.remove('is-floating');
    player.style.top = '';
    player.style.left = '';
    player.style.width = '';
    player.style.height = '';
    void player.offsetWidth;        // commit the docked position instantly
    player.style.transition = '';   // restore the CSS transition
    try { videoEl.currentTime = 0; } catch (_) {}
  }

  /* ----- MOBILE: native fullscreen -------------------------------------- */
  function playFullscreenMobile() {
    loadVideoOnce();
    videoEl.loop = true;
    function enter() {
      if (videoEl.webkitEnterFullscreen) videoEl.webkitEnterFullscreen();
      else if (videoEl.requestFullscreen) videoEl.requestFullscreen();
    }
    if (videoEl.readyState >= 1) {
      videoEl.play().catch(function () {});
      enter();
    } else {
      videoEl.addEventListener('loadedmetadata', function () {
        videoEl.play().catch(function () {});
        enter();
      }, { once: true });
      videoEl.load();
    }
  }

  /* ----- PLAYBACK CONTROLS ----------------------------------------------- */
  function activate() { if (isMobile()) playFullscreenMobile(); else openVideo(); }

  function togglePlay() {
    if (videoEl.paused) { videoEl.play().catch(function () {}); player.classList.add('is-playing'); }
    else { videoEl.pause(); player.classList.remove('is-playing'); }
  }

  function toggleMute() {
    videoEl.muted = !videoEl.muted;
    player.classList.toggle('is-muted', videoEl.muted);
  }

  /* ----- EVENTS ---------------------------------------------------------- */
  // Whole docked box is clickable; once open, inside clicks don't close.
  player.addEventListener('click', function () { if (!isOpen) activate(); });

  ctlPlay.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!isOpen) activate(); else togglePlay();
  });
  ctlMute.addEventListener('click', function (e) { e.stopPropagation(); toggleMute(); });
  ctlClose.addEventListener('click', function (e) { e.stopPropagation(); closeVideo(); });

  backdrop.addEventListener('click', closeVideo);  // click outside → close
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) closeVideo();
  });

  // Controls fade in while the cursor is over the expanded player, out when it leaves.
  // Use mousemove, not mouseenter: when the reel opens the cursor is already inside the
  // player and it expands under a stationary cursor, so mouseenter never fires — any
  // movement then reveals the controls (standard video-player behaviour).
  player.addEventListener('mousemove', function () { if (isOpen) player.classList.add('controls-visible'); });
  player.addEventListener('mouseleave', function () { player.classList.remove('controls-visible'); });

  // Keep the expanded player centred on resize.
  window.addEventListener('resize', function () {
    if (!isOpen) return;
    var t = computeTarget();
    setBox(player, t.top, t.left, t.width, t.height);
  });

  // Loop on both platforms.
  videoEl.loop = true;
})();
