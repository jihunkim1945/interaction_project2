/* ============================================
   js/intro.js — Sequential intro stage controller
   ============================================
   SEQUENCE:
   1. Car crash   — canvas, frame-by-frame, plays ONCE (19 frames × 100ms = 1900ms)
   2. The End VHS — GIF, 2800ms
   3. ASCII human — GIF, 3200ms
   4. Data glitch — GIF, 2600ms
   5. Pill image  — full-bleed, input shown, user navigates
   ============================================ */

(function () {
  'use strict';

  /* ── Stage elements ── */
  var stages = [
    document.getElementById('stage-crash'),
    document.getElementById('stage-the-end'),
    document.getElementById('stage-ascii'),
    document.getElementById('stage-data'),
    document.getElementById('stage-pill'),
  ];

  var flashOverlay = document.getElementById('flash-overlay');
  var currentStageIndex = 0;

  /* ── GIF stage durations (ms) — stages 1-3 ── */
  var GIF_DURATIONS = [2800, 3200, 2600];

  /* ============================================
     STAGE TRANSITION
     ============================================ */
  function goToStage(index) {
    stages[currentStageIndex].classList.remove('active');
    currentStageIndex = index;
    stages[currentStageIndex].classList.add('active');

    if (index === 4) {
      // Pill stage: fade in inner content, focus input
      setTimeout(function () {
        var inner = document.getElementById('pill-inner');
        if (inner) inner.classList.add('visible');
        var input = document.getElementById('pill-input');
        if (input) input.focus();
      }, 350);
    }
  }

  function flashAndGoTo(index) {
    flashOverlay.classList.add('flash');
    setTimeout(function () {
      goToStage(index);
      setTimeout(function () {
        flashOverlay.classList.remove('flash');
      }, 80);
    }, 100);
  }

  /* ============================================
     STAGE 1 — CANVAS CRASH (plays ONCE)
     Loads 19 PNG frames, draws them at 100ms each,
     then automatically advances to stage 2.
     ============================================ */
  function initCrashCanvas() {
    var canvas = document.getElementById('crash-canvas');
    if (!canvas) return;

    var ctx    = canvas.getContext('2d');
    var FRAMES = 19;
    var FRAME_DURATION = 100; // ms per frame
    var images = [];
    var loaded = 0;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Preload all frames
    for (var i = 0; i < FRAMES; i++) {
      (function (idx) {
        var img = new Image();
        img.onload = function () {
          loaded++;
          if (loaded === FRAMES) startPlayback();
        };
        img.onerror = function () {
          loaded++;
          if (loaded === FRAMES) startPlayback();
        };
        var padded = idx < 10 ? '0' + idx : '' + idx;
        img.src = 'crash-frames/frame_' + padded + '.png';
        images[idx] = img;
      })(i);
    }

    function drawFrame(index) {
      if (!images[index] || !images[index].complete) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cover-fit the frame
      var iw = images[index].naturalWidth  || 500;
      var ih = images[index].naturalHeight || 281;
      var cw = canvas.width;
      var ch = canvas.height;
      var scale = Math.max(cw / iw, ch / ih);
      var dw = iw * scale;
      var dh = ih * scale;
      var dx = (cw - dw) / 2;
      var dy = (ch - dh) / 2;

      ctx.drawImage(images[index], dx, dy, dw, dh);
    }

    function startPlayback() {
      var frame = 0;

      function tick() {
        drawFrame(frame);
        frame++;

        if (frame < FRAMES) {
          setTimeout(tick, FRAME_DURATION);
        } else {
          // Last frame drawn — hold for 200ms then advance
          setTimeout(function () {
            flashAndGoTo(1);
            scheduleGifStages();
          }, 200);
        }
      }

      tick();
    }
  }

  /* ============================================
     STAGES 2–4 — GIF stages, auto-advance
     ============================================ */
  function scheduleGifStages() {
    var gifIndex = 0; // 0 = stage 1 (the-end), etc.

    function next() {
      if (gifIndex >= GIF_DURATIONS.length) return; // stage 4 is user-driven
      var duration = GIF_DURATIONS[gifIndex];
      gifIndex++;

      setTimeout(function () {
        // stages 2, 3, 4 → index 2, 3, 4
        var nextStageIndex = 1 + gifIndex; // after stage-the-end(1), ascii(2), data(3) → pill(4)
        flashAndGoTo(nextStageIndex);
        if (nextStageIndex < 4) next();
      }, duration);
    }

    next();
  }

  /* ============================================
     PILL INPUT HANDLER
     ============================================ */
  var pillInput   = document.getElementById('pill-input');
  var pillWarning = document.getElementById('pill-warning');

  if (pillInput) {
    pillInput.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;

      var val = pillInput.value.trim().toLowerCase();

      if (val === 'blue') {
        pillInput.style.borderColor = '#3366ff';
        pillInput.style.color       = '#3366ff';
        setTimeout(function () { window.location.href = 'blue.html'; }, 420);

      } else if (val === 'red') {
        pillInput.style.borderColor = '#ff3333';
        pillInput.style.color       = '#ff3333';
        setTimeout(function () { window.location.href = 'red.html'; }, 420);

      } else {
        pillWarning.classList.add('show');
        pillInput.classList.add('screen-shake');

        setTimeout(function () {
          pillInput.classList.remove('screen-shake');
          pillInput.style.borderColor = '';
          pillInput.style.color       = '';
          pillInput.value             = '';
        }, 650);

        setTimeout(function () {
          pillWarning.classList.remove('show');
        }, 2600);
      }
    });
  }

  /* ── Boot ── */
  initCrashCanvas();

})();