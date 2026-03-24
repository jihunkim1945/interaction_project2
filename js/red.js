/* ============================================
   js/red.js — Red Pill page logic
   ============================================ */

(function () {
  'use strict';

  /* ── Helpers ── */
  function randFloat(min, max) { return Math.random() * (max - min) + min; }
  function randInt(min, max)   { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  /* ============================================
     MATRIX RAIN
     ============================================ */
  const rainContainer = document.getElementById('matrix-rain');
  const CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ∑∆∂∫≠≈<>{}[]|\\ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const cols      = [];
  const COL_COUNT = Math.floor(window.innerWidth / 18);

  for (let i = 0; i < COL_COUNT; i++) {
    const colEl  = document.createElement('div');
    colEl.className = 'rain-col';
    colEl.style.left    = (i * 18) + 'px';
    colEl.style.opacity = randFloat(0.18, 0.65).toString();
    rainContainer.appendChild(colEl);

    const charCount = Math.floor(window.innerHeight / 20) + 6;
    const charEls   = [];
    for (let j = 0; j < charCount; j++) {
      const span = document.createElement('span');
      span.textContent = CHARS[randInt(0, CHARS.length - 1)];
      colEl.appendChild(span);
      charEls.push(span);
    }
    cols.push({ el: colEl, chars: charEls });
  }

  let lastRainTime = 0;
  function animateRain(time) {
    if (time - lastRainTime > 90) {
      cols.forEach(col => {
        const n = randInt(1, 4);
        for (let k = 0; k < n; k++) {
          const idx = randInt(0, col.chars.length - 1);
          col.chars[idx].textContent = CHARS[randInt(0, CHARS.length - 1)];
          col.chars[idx].style.color = k === 0 ? '#ffffff' : '';
        }
      });
      lastRainTime = time;
    }
    requestAnimationFrame(animateRain);
  }
  requestAnimationFrame(animateRain);

  /* ============================================
     NODE LAYOUT
     ============================================ */
  const nodeEls   = document.querySelectorAll('.red-node');
  const nodeData  = [];
  const MIN_DIST  = 230;
  const PAD       = 130;
  const NODE_W    = 200;
  const NODE_H    = 120;

  function placeNodes() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const placed = [];

    nodeEls.forEach((nodeEl) => {
      let x, y, ok, attempts = 0;
      do {
        x = randFloat(PAD + NODE_W / 2, W - PAD - NODE_W / 2);
        y = randFloat(PAD + NODE_H / 2, H - PAD - NODE_H / 2);
        ok = placed.every(p => {
          const dx = x - p.x, dy = y - p.y;
          return Math.sqrt(dx * dx + dy * dy) > MIN_DIST;
        });
        attempts++;
      } while (!ok && attempts < 500);

      const nd = {
        el:    nodeEl,
        x, y,
        baseX: x,
        baseY: y,
        phase: randFloat(0, Math.PI * 2),
        amp:   randFloat(3, 9),
        freq:  randFloat(0.0004, 0.0012),
        locked: false,
      };
      placed.push({ x, y });
      nodeData.push(nd);

      nodeEl.style.left = x + 'px';
      nodeEl.style.top  = y + 'px';
    });
  }

  placeNodes();

  /* ============================================
     SVG CONNECTIONS
     ============================================ */
  const svg   = document.getElementById('network-svg');
  const svgLines = [];

  function buildConnections() {
    svg.innerHTML = `
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>`;

    const connected = new Set();
    nodeData.forEach((nd, i) => {
      const nearest = nodeData
        .map((other, j) => {
          if (i === j) return null;
          const dx = nd.x - other.x, dy = nd.y - other.y;
          return { j, dist: Math.sqrt(dx * dx + dy * dy) };
        })
        .filter(Boolean)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2);

      nearest.forEach(({ j }) => {
        const key = [Math.min(i, j), Math.max(i, j)].join('-');
        if (connected.has(key)) return;
        connected.add(key);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('stroke', '#00aa2a');
        line.setAttribute('stroke-width', '0.6');
        line.setAttribute('opacity', '0.4');
        line.setAttribute('filter', 'url(#glow)');
        svg.appendChild(line);
        svgLines.push({ line, i, j });
      });
    });
  }

  buildConnections();

  function updateLines() {
    svgLines.forEach(({ line, i, j }) => {
      const a = nodeData[i], b = nodeData[j];
      line.setAttribute('x1', a.x);
      line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x);
      line.setAttribute('y2', b.y);
    });
  }

  /* ============================================
     NODE DRIFT ANIMATION
     ============================================ */
  let animTick       = 0;
  let collapseActive = false;

  (function driftLoop() {
    if (collapseActive) return;
    animTick++;

    nodeData.forEach(nd => {
      if (nd.locked) return;
      const t = animTick * nd.freq;
      nd.x = nd.baseX + Math.sin(t + nd.phase)       * nd.amp;
      nd.y = nd.baseY + Math.cos(t * 0.7 + nd.phase) * nd.amp * 0.6;
      nd.el.style.left = nd.x + 'px';
      nd.el.style.top  = nd.y + 'px';
    });

    updateLines();
    requestAnimationFrame(driftLoop);
  })();

  /* ============================================
     HOVER — scatter nearby rain columns
     ============================================ */
  nodeEls.forEach((nodeEl, i) => {
    nodeEl.addEventListener('mouseenter', () => {
      const x = nodeData[i].x;
      cols.forEach(col => {
        const colX = parseInt(col.el.style.left, 10);
        if (Math.abs(colX - x) < 90) {
          col.el.style.opacity = '1';
          col.el.style.color   = '#ffffff';
          setTimeout(() => {
            col.el.style.opacity = randFloat(0.18, 0.65).toString();
            col.el.style.color   = '';
          }, 650);
        }
      });
    });
  });

  /* ============================================
     ZOOM OVERLAY
     ============================================ */
  const zoomOverlay  = document.getElementById('zoom-overlay');
  const zoomedNode   = document.getElementById('zoomed-node');
  const zoomedContent = document.getElementById('zoomed-content');
  const zoomClose    = document.getElementById('zoom-close');

  function openZoom(nodeEl) {
    zoomedContent.innerHTML = nodeEl.querySelector('.node-shell').innerHTML;
    zoomOverlay.classList.add('active');
    bindAllInteractions(zoomedContent);
  }

  function closeZoom() {
    zoomOverlay.classList.remove('active');
  }

  if (zoomClose) zoomClose.addEventListener('click', closeZoom);
  zoomOverlay.addEventListener('click', e => { if (e.target === zoomOverlay) closeZoom(); });

  nodeEls.forEach(nodeEl => {
    nodeEl.addEventListener('click', e => {
      if (e.target.tagName === 'INPUT') return;
      openZoom(nodeEl);
    });
  });

  /* ============================================
     NODE INTERACTIONS
     ============================================ */

  // 1. Name → ASCII encode
  function bindName(root) {
    const el  = root.querySelector('#r-name');
    const res = root.querySelector('#r-name-res');
    if (!el || !res) return;
    el.addEventListener('change', () => {
      if (!el.value.trim()) return;
      const coded = el.value.split('').map(c => c.charCodeAt(0)).join('-');
      res.textContent = `IDENTITY ENCODED: ${coded}`;
      res.classList.add('show');
      el.value = coded;
    });
  }

  // 2. Memory/password → expose
  function bindMemory(root) {
    const el  = root.querySelector('#r-memory');
    const res = root.querySelector('#r-memory-res');
    if (!el || !res) return;
    el.addEventListener('blur', () => {
      if (!el.value) return;
      const exposed = el.value;
      el.type  = 'text';
      el.value = exposed;
      res.textContent = 'MEMORY UNVERIFIED — DATA EXPOSED';
      res.classList.add('show');
    });
  }

  // 3. Identity radio → override
  function bindIdentity(root) {
    const radios = root.querySelectorAll('input[name="r-identity"]');
    const res    = root.querySelector('#r-identity-res');
    if (!radios.length || !res) return;
    radios.forEach(r => {
      r.addEventListener('change', () => {
        setTimeout(() => {
          r.checked = false;
          res.textContent = 'IDENTITY CANNOT BE ASSIGNED — OVERRIDE ACTIVE';
          res.classList.add('show');
        }, 300);
      });
    });
  }

  // 4. Age → glitch / binary distortion
  function bindAge(root) {
    const el  = root.querySelector('#r-age');
    const res = root.querySelector('#r-age-res');
    if (!el || !res) return;
    el.addEventListener('change', () => {
      if (!el.value) return;
      const n       = parseInt(el.value, 10);
      const binary  = n.toString(2);
      const shards  = Array.from({ length: 4 }, () => randInt(0, 999)).join('-');
      res.textContent = `${n} → ${binary} → ${n * 1000} → ${shards}`;
      res.classList.add('show');
      el.value       = '';
      el.placeholder = `${binary}...`;
    });
  }

  // 5. Freedom checkbox → deny
  function bindFreedom(root) {
    const el  = root.querySelector('#r-free');
    const res = root.querySelector('#r-free-res');
    if (!el || !res) return;
    el.addEventListener('change', () => {
      if (!el.checked) return;
      res.textContent = 'STATEMENT INVALID — FREEDOM UNVERIFIABLE';
      res.classList.add('show');
      el.checked = false;
    });
  }

  // 6. Search → fake headlines
  const HEADLINES = [
    'GLOBAL SYSTEM FAILURE REPORTED',
    'SIMULATION COLLAPSE DETECTED',
    'REALITY INFRASTRUCTURE UNSTABLE',
    'HUMAN MEMORY ARCHIVES CORRUPTED',
    'IDENTITY DATABASE BREACH IMMINENT',
    'CONSENSUS REALITY DEGRADING',
    'TEMPORAL ANCHOR LOST — RECALIBRATING',
  ];

  function bindSearch(root) {
    const el  = root.querySelector('#r-search');
    const res = root.querySelector('#r-search-res');
    if (!el || !res) return;
    el.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || !el.value.trim()) return;
      const picks = HEADLINES.slice().sort(() => Math.random() - 0.5).slice(0, 3);
      res.innerHTML = picks.map(h => `▸ ${h}`).join('<br/>');
      res.classList.add('show', 'green');
    });
  }

  // 7. File upload → deny existence
  function bindFile(root) {
    const el  = root.querySelector('#r-file');
    const res = root.querySelector('#r-file-res');
    if (!el || !res) return;
    el.addEventListener('change', () => {
      if (!el.files.length) return;
      setTimeout(() => {
        res.innerHTML = 'MEMORY FILE EMPTY<br/>YOU NEVER EXISTED';
        res.classList.add('show');
        el.value = '';
      }, 650);
    });
  }

  // 8. Date of birth → deny
  function bindDob(root) {
    const el  = root.querySelector('#r-dob');
    const res = root.querySelector('#r-dob-res');
    if (!el || !res) return;
    el.addEventListener('change', () => {
      if (!el.value) return;
      res.textContent = 'YOU WERE NEVER BORN';
      res.classList.add('show');
    });
  }

  // 9. Baseline range → shake
  let shaking = false;
  function bindRange(root) {
    const el  = root.querySelector('#r-range');
    const res = root.querySelector('#r-range-res');
    if (!el || !res) return;
    el.addEventListener('input', debounce(() => {
      if (shaking) return;
      shaking = true;
      const page = document.getElementById('red-page');
      page.classList.add('screen-shake', 'glitch-flicker');
      res.textContent = 'BASELINE UNSTABLE — REALITY DISTORTING';
      res.classList.add('show');
      setTimeout(() => {
        page.classList.remove('screen-shake', 'glitch-flicker');
        shaking = false;
      }, 650);
    }, 160));
  }

  // 10. Escape attempt (evasion mechanic)
  let escapeAttempts = 0;

  function bindEscape(root) {
    const yesRow   = root.querySelector('#escape-yes-row');
    const yesInput = root.querySelector('#r-escape-yes');
    const res      = root.querySelector('#r-escape-res');
    if (!yesRow || !res) return;

    function tryEvade(e) {
      if (escapeAttempts >= 3) return; // let it through

      e.preventDefault();
      e.stopPropagation();

      const offsetX = randFloat(-90, 90);
      const offsetY = randFloat(-60, 60);
      yesRow.style.transform  = `translate(${offsetX}px, ${offsetY}px)`;
      yesRow.style.transition = 'transform 0.14s ease';

      escapeAttempts++;
      res.textContent = `ESCAPE ATTEMPT ${escapeAttempts}/3 — ACCESS DENIED`;
      res.classList.add('show');

      if (escapeAttempts >= 3) {
        setTimeout(() => {
          yesRow.style.transform = '';
          if (yesInput) yesInput.checked = true;
          res.innerHTML = 'ESCAPE ATTEMPT DETECTED<br/>ACCESS GRANTED';
          setTimeout(triggerCollapse, 1300);
        }, 700);
      } else {
        setTimeout(() => { yesRow.style.transform = ''; }, 600);
      }
    }

    yesRow.addEventListener('click',    tryEvade);
    yesRow.addEventListener('mousedown', tryEvade);
    if (yesInput) yesInput.addEventListener('click', tryEvade);
  }

  // 11. Final truth text
  function bindTruth(root) {
    const el  = root.querySelector('#r-truth');
    const res = root.querySelector('#r-truth-res');
    if (!el || !res) return;
    el.addEventListener('change', () => {
      if (!el.value.trim()) return;
      res.textContent = 'STATEMENT LOGGED — SYSTEM ACKNOWLEDGES';
      res.classList.add('show', 'green');
    });
  }

  // 12. Collapse button
  function bindCollapse(root) {
    const btn = root.querySelector('#r-collapse');
    const res = root.querySelector('#r-collapse-res');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (res) {
        res.textContent = 'INITIATING COLLAPSE...';
        res.classList.add('show', 'green');
      }
      setTimeout(triggerCollapse, 850);
    });
  }

  // Wire all interactions for a given root element
  function bindAllInteractions(root) {
    bindName(root);
    bindMemory(root);
    bindIdentity(root);
    bindAge(root);
    bindFreedom(root);
    bindSearch(root);
    bindFile(root);
    bindDob(root);
    bindRange(root);
    bindEscape(root);
    bindTruth(root);
    bindCollapse(root);
  }

  // Bind to the live page nodes
  bindAllInteractions(document);

  /* ============================================
     COLLAPSE SEQUENCE
     ============================================ */
  function triggerCollapse() {
    if (collapseActive) return;
    collapseActive = true;

    closeZoom();

    const redPage = document.getElementById('red-page');
    let flashCount = 0;
    const flashInterval = setInterval(() => {
      redPage.style.filter = flashCount % 2 === 0
        ? 'brightness(3) invert(1) hue-rotate(90deg)'
        : '';
      flashCount++;

      if (flashCount > 10) {
        clearInterval(flashInterval);
        redPage.style.filter = '';

        // Scatter and fade nodes
        nodeData.forEach(nd => {
          nd.el.style.transition = 'all 0.65s ease';
          nd.el.style.opacity    = '0';
          nd.el.style.transform  = `translate(${randFloat(-220, 220)}px, ${randFloat(-220, 220)}px) scale(0)`;
        });

        // Fade SVG lines
        svg.style.transition = 'opacity 0.65s';
        svg.style.opacity    = '0';

        // Turn rain white
        cols.forEach(col => {
          col.el.style.transition = 'color 0.55s, opacity 0.55s';
          col.el.style.color      = '#ffffff';
          col.el.style.opacity    = '1';
        });

        // Reveal white scene
        setTimeout(() => {
          const whiteScene = document.getElementById('white-scene');
          if (whiteScene) whiteScene.classList.add('active');
        }, 950);
      }
    }, 100);
  }

})();