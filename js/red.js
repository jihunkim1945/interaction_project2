/* ============================================
   js/red.js — Red Pill: Spline background +
   floating input nodes + interactions
   ============================================ */

import { Application } from 'https://unpkg.com/@splinetool/runtime/build/runtime.js';

/* ── Helpers ── */
function randFloat(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max)   { return Math.floor(Math.random() * (max - min + 1)) + min; }
function debounce(fn, ms) {
  let t;
  return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}

/* ============================================
   SPLINE — load scene, hide Bunny
   ============================================ */
const canvas = document.getElementById('spline-canvas');
const app    = new Application(canvas);

app.load('https://prod.spline.design/5iDn8kJog7o5wvBI/scene.splinecode')
  .then(() => {
    /* Hide the Bunny object */
    app.scene.traverse(obj => {
      if (obj.name === 'Bunny') {
        obj.visible = false;
      }
    });
  })
  .catch(err => console.warn('Spline load error:', err));

/* ============================================
   NODE LAYOUT — random positions, no overlap
   ============================================ */
const nodeEls  = document.querySelectorAll('.red-node');
const nodeData = [];
const MIN_DIST = 220;
const PAD      = 120;
const NODE_W   = 200;
const NODE_H   = 120;

function placeNodes() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const placed = [];

  nodeEls.forEach(el => {
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
      el, x, y,
      baseX: x, baseY: y,
      phase: randFloat(0, Math.PI * 2),
      amp:   randFloat(4, 10),
      freq:  randFloat(0.0004, 0.001),
    };
    placed.push({ x, y });
    nodeData.push(nd);
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
  });
}

placeNodes();

/* ============================================
   NODE DRIFT ANIMATION
   ============================================ */
let tick = 0;
let collapseActive = false;

(function drift() {
  if (collapseActive) return;
  tick++;
  nodeData.forEach(nd => {
    const t = tick * nd.freq;
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
const zoomOverlay   = document.getElementById('zoom-overlay');
const zoomedContent = document.getElementById('zoomed-content');
const zoomClose     = document.getElementById('zoom-close');

function openZoom(nodeEl) {
  zoomedContent.innerHTML = nodeEl.querySelector('.node-shell').innerHTML;
  zoomOverlay.classList.add('active');
  bindInteractions(zoomedContent);
}

function closeZoom() { zoomOverlay.classList.remove('active'); }

zoomClose.addEventListener('click', closeZoom);
zoomOverlay.addEventListener('click', e => { if (e.target === zoomOverlay) closeZoom(); });

nodeEls.forEach(el => {
  el.addEventListener('click', e => {
    if (e.target.tagName === 'INPUT') return;
    openZoom(el);
  });
});

/* ============================================
   NODE INTERACTIONS
   ============================================ */

function bindInteractions(root) {

  /* 1. Name → ASCII encode */
  const rName = root.querySelector('#r-name');
  const rNameRes = root.querySelector('#r-name-res');
  if (rName) rName.addEventListener('change', () => {
    if (!rName.value.trim()) return;
    const coded = rName.value.split('').map(c => c.charCodeAt(0)).join('-');
    rNameRes.textContent = 'IDENTITY ENCODED: ' + coded;
    rNameRes.classList.add('show');
    rName.value = coded;
  });

  /* 2. Memory → expose */
  const rMem = root.querySelector('#r-memory');
  const rMemRes = root.querySelector('#r-memory-res');
  if (rMem) rMem.addEventListener('blur', () => {
    if (!rMem.value) return;
    rMem.type = 'text';
    rMemRes.textContent = 'MEMORY UNVERIFIED — DATA EXPOSED';
    rMemRes.classList.add('show');
  });

  /* 3. Identity → override */
  const rIdentityRadios = root.querySelectorAll('input[name="r-identity"]');
  const rIdentityRes = root.querySelector('#r-identity-res');
  if (rIdentityRadios.length) rIdentityRadios.forEach(r => {
    r.addEventListener('change', () => {
      setTimeout(() => {
        r.checked = false;
        rIdentityRes.textContent = 'IDENTITY CANNOT BE ASSIGNED — OVERRIDE ACTIVE';
        rIdentityRes.classList.add('show');
      }, 300);
    });
  });

  /* 4. Age → glitch */
  const rAge = root.querySelector('#r-age');
  const rAgeRes = root.querySelector('#r-age-res');
  if (rAge) rAge.addEventListener('change', () => {
    if (!rAge.value) return;
    const n = parseInt(rAge.value);
    const bin = n.toString(2);
    rAgeRes.textContent = n + ' → ' + bin + ' → ' + Array.from({length:4}, () => randInt(0,999)).join('-');
    rAgeRes.classList.add('show');
    rAge.value = '';
    rAge.placeholder = bin + '...';
  });

  /* 5. Freedom → deny */
  const rFree = root.querySelector('#r-free');
  const rFreeRes = root.querySelector('#r-free-res');
  if (rFree) rFree.addEventListener('change', () => {
    if (!rFree.checked) return;
    rFreeRes.textContent = 'STATEMENT INVALID — FREEDOM UNVERIFIABLE';
    rFreeRes.classList.add('show');
    rFree.checked = false;
  });

  /* 6. Search → fake headlines */
  const HEADLINES = [
    'GLOBAL SYSTEM FAILURE REPORTED',
    'SIMULATION COLLAPSE DETECTED',
    'REALITY INFRASTRUCTURE UNSTABLE',
    'HUMAN MEMORY ARCHIVES CORRUPTED',
    'IDENTITY DATABASE BREACH IMMINENT',
    'CONSENSUS REALITY DEGRADING',
  ];
  const rSearch = root.querySelector('#r-search');
  const rSearchRes = root.querySelector('#r-search-res');
  if (rSearch) rSearch.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !rSearch.value.trim()) return;
    const picks = HEADLINES.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    rSearchRes.innerHTML = picks.map(h => '▸ ' + h).join('<br/>');
    rSearchRes.classList.add('show', 'green');
  });

  /* 7. File → deny */
  const rFile = root.querySelector('#r-file');
  const rFileRes = root.querySelector('#r-file-res');
  if (rFile) rFile.addEventListener('change', () => {
    if (!rFile.files.length) return;
    setTimeout(() => {
      rFileRes.innerHTML = 'MEMORY FILE EMPTY<br/>YOU NEVER EXISTED';
      rFileRes.classList.add('show');
      rFile.value = '';
    }, 600);
  });

  /* 8. DOB → deny existence */
  const rDob = root.querySelector('#r-dob');
  const rDobRes = root.querySelector('#r-dob-res');
  if (rDob) rDob.addEventListener('change', () => {
    if (!rDob.value) return;
    rDobRes.textContent = 'YOU WERE NEVER BORN';
    rDobRes.classList.add('show');
  });

  /* 9. Range → shake */
  let shaking = false;
  const rRange = root.querySelector('#r-range');
  const rRangeRes = root.querySelector('#r-range-res');
  if (rRange) rRange.addEventListener('input', debounce(() => {
    if (shaking) return;
    shaking = true;
    document.getElementById('red-page').classList.add('screen-shake', 'glitch-flicker');
    rRangeRes.textContent = 'BASELINE UNSTABLE — REALITY DISTORTING';
    rRangeRes.classList.add('show');
    setTimeout(() => {
      document.getElementById('red-page').classList.remove('screen-shake', 'glitch-flicker');
      shaking = false;
    }, 600);
  }, 150));

  /* 10. Escape → evade cursor */
  let escapeAttempts = 0;
  const yesRow  = root.querySelector('#escape-yes-row');
  const yesInput = root.querySelector('#r-escape-yes');
  const escRes  = root.querySelector('#r-escape-res');
  if (yesRow) {
    function evade(e) {
      if (escapeAttempts >= 3) return;
      e.preventDefault(); e.stopPropagation();
      yesRow.style.transform = 'translate(' + randFloat(-90,90) + 'px,' + randFloat(-60,60) + 'px)';
      escapeAttempts++;
      escRes.textContent = 'ESCAPE ATTEMPT ' + escapeAttempts + '/3 — ACCESS DENIED';
      escRes.classList.add('show');
      if (escapeAttempts >= 3) {
        setTimeout(() => {
          yesRow.style.transform = '';
          if (yesInput) yesInput.checked = true;
          escRes.innerHTML = 'ESCAPE ATTEMPT DETECTED<br/>ACCESS GRANTED';
          setTimeout(triggerCollapse, 1300);
        }, 700);
      } else {
        setTimeout(() => { yesRow.style.transform = ''; }, 600);
      }
    }
    yesRow.addEventListener('click', evade);
    yesRow.addEventListener('mousedown', evade);
  }

  /* 11. Truth */
  const rTruth = root.querySelector('#r-truth');
  const rTruthRes = root.querySelector('#r-truth-res');
  if (rTruth) rTruth.addEventListener('change', () => {
    if (!rTruth.value.trim()) return;
    rTruthRes.textContent = 'STATEMENT LOGGED — SYSTEM ACKNOWLEDGES';
    rTruthRes.classList.add('show', 'green');
  });

  /* 12. Collapse button */
  const collapseBtn = root.querySelector('#r-collapse');
  const collapseRes = root.querySelector('#r-collapse-res');
  if (collapseBtn) collapseBtn.addEventListener('click', () => {
    if (collapseRes) {
      collapseRes.textContent = 'INITIATING COLLAPSE...';
      collapseRes.classList.add('show', 'green');
    }
    setTimeout(triggerCollapse, 800);
  });
}

/* Bind to page nodes on load */
bindInteractions(document);

/* ============================================
   COLLAPSE SEQUENCE
   ============================================ */
function triggerCollapse() {
  if (collapseActive) return;
  collapseActive = true;
  closeZoom();

  const page = document.getElementById('red-page');
  let flashCount = 0;
  const interval = setInterval(() => {
    page.style.filter = flashCount % 2 === 0
      ? 'brightness(3) invert(1) hue-rotate(90deg)'
      : '';
    flashCount++;
    if (flashCount > 10) {
      clearInterval(interval);
      page.style.filter = '';

      /* Scatter nodes */
      nodeData.forEach(nd => {
        nd.el.style.transition = 'all 0.6s ease';
        nd.el.style.opacity = '0';
        nd.el.style.transform = 'translate(' + randFloat(-200,200) + 'px,' + randFloat(-200,200) + 'px) scale(0)';
      });

      /* Fade Spline canvas */
      canvas.style.transition = 'opacity 0.8s';
      canvas.style.opacity = '0';

      /* Show white scene */
      setTimeout(() => {
        document.getElementById('white-scene').classList.add('active');
      }, 900);
    }
  }, 100);
}
