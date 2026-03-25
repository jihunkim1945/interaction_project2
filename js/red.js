(function () {
  'use strict';

  /* ── Helpers ── */
  function randFloat(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max)   { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function debounce(fn, ms) {
    var t;
    return function() {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function() { fn.apply(ctx, args); }, ms);
    };
  }

  /* ============================================
     MATRIX RAIN — canvas
     ============================================ */
  var canvas = document.getElementById('matrix-canvas');
  var ctx    = canvas.getContext('2d');

  var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト∑∆∂∫≠≈<>{}[]|\\';
  var FONT_SIZE = 14;
  var cols, drops;

  function initMatrix() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    cols  = Math.floor(canvas.width / FONT_SIZE);
    drops = [];
    for (var i = 0; i < cols; i++) {
      drops[i] = Math.random() * -canvas.height / FONT_SIZE;
    }
  }

  initMatrix();
  window.addEventListener('resize', initMatrix);

  function drawMatrix() {
    /* Semi-transparent black fade */
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = FONT_SIZE + 'px Courier New';

    for (var i = 0; i < drops.length; i++) {
      var ch = CHARS[randInt(0, CHARS.length - 1)];
      var y  = drops[i] * FONT_SIZE;

      /* Brightest character at the front */
      if (Math.random() > 0.95) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#00ff41';
      }

      ctx.fillText(ch, i * FONT_SIZE, y);

      /* Reset drop to top after reaching bottom */
      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += 0.5;
    }
  }

  /* Run matrix rain */
  setInterval(drawMatrix, 40);

  /* ============================================
     NODE LAYOUT
     ============================================ */
  var nodeEls  = document.querySelectorAll('.red-node');
  var nodeData = [];
  var MIN_DIST = 230;
  var PAD      = 120;
  var NODE_W   = 210;
  var NODE_H   = 120;

  function placeNodes() {
    var W = window.innerWidth;
    var H = window.innerHeight;
    var placed = [];

    nodeEls.forEach(function(el) {
      var x, y, ok, attempts = 0;
      do {
        x = randFloat(PAD + NODE_W / 2, W - PAD - NODE_W / 2);
        y = randFloat(PAD + NODE_H / 2, H - PAD - NODE_H / 2);
        ok = placed.every(function(p) {
          var dx = x - p.x, dy = y - p.y;
          return Math.sqrt(dx*dx + dy*dy) > MIN_DIST;
        });
        attempts++;
      } while (!ok && attempts < 500);

      var nd = {
        el: el, x: x, y: y,
        baseX: x, baseY: y,
        phase: randFloat(0, Math.PI * 2),
        amp:   randFloat(5, 12),
        freq:  randFloat(0.0003, 0.0009),
      };
      placed.push({ x: x, y: y });
      nodeData.push(nd);
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
    });
  }

  placeNodes();

  /* ============================================
     NODE DRIFT
     ============================================ */
  var tick = 0;
  var collapseActive = false;

  (function drift() {
    if (collapseActive) return;
    tick++;
    nodeData.forEach(function(nd) {
      var t = tick * nd.freq;
      nd.x = nd.baseX + Math.sin(t + nd.phase) * nd.amp;
      nd.y = nd.baseY + Math.cos(t * 0.7 + nd.phase) * nd.amp * 0.6;
      nd.el.style.left = nd.x + 'px';
      nd.el.style.top  = nd.y + 'px';
    });
    requestAnimationFrame(drift);
  })();

  /* ============================================
     ZOOM OVERLAY
     ============================================ */
  var zoomOverlay   = document.getElementById('zoom-overlay');
  var zoomedContent = document.getElementById('zoomed-content');
  var zoomClose     = document.getElementById('zoom-close');

  function openZoom(nodeEl) {
    zoomedContent.innerHTML = nodeEl.querySelector('.node-shell').innerHTML;
    zoomOverlay.classList.add('active');
    bindInteractions(zoomedContent);
  }

  function closeZoom() { zoomOverlay.classList.remove('active'); }

  zoomClose.addEventListener('click', closeZoom);
  zoomOverlay.addEventListener('click', function(e) {
    if (e.target === zoomOverlay) closeZoom();
  });

  nodeEls.forEach(function(el) {
    el.addEventListener('click', function(e) {
      if (e.target.tagName === 'INPUT') return;
      openZoom(el);
    });
  });

  /* ============================================
     INTERACTIONS
     ============================================ */
  function bindInteractions(root) {

    /* 1. Name → ASCII */
    var rName    = root.querySelector('#r-name');
    var rNameRes = root.querySelector('#r-name-res');
    if (rName) rName.addEventListener('change', function() {
      if (!rName.value.trim()) return;
      var coded = rName.value.split('').map(function(c) { return c.charCodeAt(0); }).join('-');
      rNameRes.textContent = 'IDENTITY ENCODED: ' + coded;
      rNameRes.classList.add('show');
      rName.value = coded;
    });

    /* 2. Memory → expose */
    var rMem    = root.querySelector('#r-memory');
    var rMemRes = root.querySelector('#r-memory-res');
    if (rMem) rMem.addEventListener('blur', function() {
      if (!rMem.value) return;
      rMem.type = 'text';
      rMemRes.textContent = 'MEMORY UNVERIFIED — DATA EXPOSED';
      rMemRes.classList.add('show');
    });

    /* 3. Identity → override */
    var radios      = root.querySelectorAll('input[name="r-identity"]');
    var rIdentityRes = root.querySelector('#r-identity-res');
    if (radios.length) radios.forEach(function(r) {
      r.addEventListener('change', function() {
        setTimeout(function() {
          r.checked = false;
          rIdentityRes.textContent = 'IDENTITY CANNOT BE ASSIGNED — OVERRIDE ACTIVE';
          rIdentityRes.classList.add('show');
        }, 300);
      });
    });

    /* 4. Age → glitch */
    var rAge    = root.querySelector('#r-age');
    var rAgeRes = root.querySelector('#r-age-res');
    if (rAge) rAge.addEventListener('change', function() {
      if (!rAge.value) return;
      var n   = parseInt(rAge.value);
      var bin = n.toString(2);
      var shards = [randInt(0,999), randInt(0,999), randInt(0,999), randInt(0,999)].join('-');
      rAgeRes.textContent = n + ' → ' + bin + ' → ' + shards;
      rAgeRes.classList.add('show');
      rAge.value = '';
      rAge.placeholder = bin + '...';
    });

    /* 5. Freedom → deny */
    var rFree    = root.querySelector('#r-free');
    var rFreeRes = root.querySelector('#r-free-res');
    if (rFree) rFree.addEventListener('change', function() {
      if (!rFree.checked) return;
      rFreeRes.textContent = 'STATEMENT INVALID — FREEDOM UNVERIFIABLE';
      rFreeRes.classList.add('show');
      rFree.checked = false;
    });

    /* 6. Search → headlines */
    var HEADLINES = [
      'GLOBAL SYSTEM FAILURE REPORTED',
      'SIMULATION COLLAPSE DETECTED',
      'REALITY INFRASTRUCTURE UNSTABLE',
      'HUMAN MEMORY ARCHIVES CORRUPTED',
      'IDENTITY DATABASE BREACH IMMINENT',
      'CONSENSUS REALITY DEGRADING',
    ];
    var rSearch    = root.querySelector('#r-search');
    var rSearchRes = root.querySelector('#r-search-res');
    if (rSearch) rSearch.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter' || !rSearch.value.trim()) return;
      var picks = HEADLINES.slice().sort(function() { return Math.random() - 0.5; }).slice(0, 3);
      rSearchRes.innerHTML = picks.map(function(h) { return '▸ ' + h; }).join('<br/>');
      rSearchRes.classList.add('show', 'green');
    });

    /* 7. File → deny */
    var rFile    = root.querySelector('#r-file');
    var rFileRes = root.querySelector('#r-file-res');
    if (rFile) rFile.addEventListener('change', function() {
      if (!rFile.files.length) return;
      setTimeout(function() {
        rFileRes.innerHTML = 'MEMORY FILE EMPTY<br/>YOU NEVER EXISTED';
        rFileRes.classList.add('show');
        rFile.value = '';
      }, 600);
    });

    /* 8. DOB → deny */
    var rDob    = root.querySelector('#r-dob');
    var rDobRes = root.querySelector('#r-dob-res');
    if (rDob) rDob.addEventListener('change', function() {
      if (!rDob.value) return;
      rDobRes.textContent = 'YOU WERE NEVER BORN';
      rDobRes.classList.add('show');
    });

    /* 9. Range → shake */
    var shaking  = false;
    var rRange   = root.querySelector('#r-range');
    var rRangeRes = root.querySelector('#r-range-res');
    if (rRange) rRange.addEventListener('input', debounce(function() {
      if (shaking) return;
      shaking = true;
      var page = document.getElementById('red-page');
      page.classList.add('screen-shake', 'glitch-flicker');
      rRangeRes.textContent = 'BASELINE UNSTABLE — REALITY DISTORTING';
      rRangeRes.classList.add('show');
      setTimeout(function() {
        page.classList.remove('screen-shake', 'glitch-flicker');
        shaking = false;
      }, 600);
    }, 150));

    /* 10. Escape → evade */
    var escapeAttempts = 0;
    var yesRow   = root.querySelector('#escape-yes-row');
    var yesInput = root.querySelector('#r-escape-yes');
    var escRes   = root.querySelector('#r-escape-res');
    if (yesRow) {
      function evade(e) {
        if (escapeAttempts >= 3) return;
        e.preventDefault(); e.stopPropagation();
        yesRow.style.transform = 'translate(' + randFloat(-90,90) + 'px,' + randFloat(-60,60) + 'px)';
        escapeAttempts++;
        escRes.textContent = 'ESCAPE ATTEMPT ' + escapeAttempts + '/3 — ACCESS DENIED';
        escRes.classList.add('show');
        if (escapeAttempts >= 3) {
          setTimeout(function() {
            yesRow.style.transform = '';
            if (yesInput) yesInput.checked = true;
            escRes.innerHTML = 'ESCAPE ATTEMPT DETECTED<br/>ACCESS GRANTED';
            setTimeout(triggerCollapse, 1300);
          }, 700);
        } else {
          setTimeout(function() { yesRow.style.transform = ''; }, 600);
        }
      }
      yesRow.addEventListener('click', evade);
      yesRow.addEventListener('mousedown', evade);
    }

    /* 11. Truth */
    var rTruth    = root.querySelector('#r-truth');
    var rTruthRes = root.querySelector('#r-truth-res');
    if (rTruth) rTruth.addEventListener('change', function() {
      if (!rTruth.value.trim()) return;
      rTruthRes.textContent = 'STATEMENT LOGGED — SYSTEM ACKNOWLEDGES';
      rTruthRes.classList.add('show', 'green');
    });

    /* 12. Collapse */
    var collapseBtn = root.querySelector('#r-collapse');
    var collapseRes = root.querySelector('#r-collapse-res');
    if (collapseBtn) collapseBtn.addEventListener('click', function() {
      if (collapseRes) {
        collapseRes.textContent = 'INITIATING COLLAPSE...';
        collapseRes.classList.add('show', 'green');
      }
      setTimeout(triggerCollapse, 800);
    });
  }

  bindInteractions(document);

  /* ============================================
     COLLAPSE SEQUENCE
     ============================================ */
  function triggerCollapse() {
    if (collapseActive) return;
    collapseActive = true;
    closeZoom();

    var page = document.getElementById('red-page');
    var flashCount = 0;
    var interval = setInterval(function() {
      page.style.filter = flashCount % 2 === 0
        ? 'brightness(3) invert(1) hue-rotate(90deg)'
        : '';
      flashCount++;
      if (flashCount > 10) {
        clearInterval(interval);
        page.style.filter = '';

        nodeData.forEach(function(nd) {
          nd.el.style.transition = 'all 0.6s ease';
          nd.el.style.opacity = '0';
          nd.el.style.transform = 'translate(' + randFloat(-200,200) + 'px,' + randFloat(-200,200) + 'px) scale(0)';
        });

        canvas.style.transition = 'opacity 0.8s';
        canvas.style.opacity = '0';

        setTimeout(function() {
          document.getElementById('white-scene').classList.add('active');
        }, 900);
      }
    }, 100);
  }

})();
