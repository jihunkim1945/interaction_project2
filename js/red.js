<<<<<<< HEAD
=======
import { Application } from 'https://unpkg.com/@splinetool/runtime/build/runtime.js';

/* ── Helpers ── */
function randFloat(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max)   { return Math.floor(Math.random() * (max - min + 1)) + min; }
function debounce(fn, ms) {
  let t;
  return function(...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
}

/* ============================================
   SPLINE
   ============================================ */
const splineCanvas = document.getElementById('spline-canvas');
const app = new Application(splineCanvas);

app.load('https://prod.spline.design/5iDn8kJog7o5wvBI/scene.splinecode')
  .then(() => {
    /* Hide watermark div added by Spline runtime */
    setTimeout(() => {
      document.querySelectorAll('body > div').forEach(el => {
        if (!el.id) el.style.cssText = 'display:none!important';
      });
    }, 800);
  })
  .catch(e => console.warn('Spline:', e));

/* ============================================
   NODE LAYOUT
   ============================================ */
const nodeEls  = document.querySelectorAll('.red-node');
const nodeData = [];

function placeNodes() {
  const W = window.innerWidth, H = window.innerHeight;
  const placed = [];
  const MIN = 230, PAD = 120, NW = 210, NH = 120;

  nodeEls.forEach(el => {
    let x, y, ok, tries = 0;
    do {
      x = randFloat(PAD + NW/2, W - PAD - NW/2);
      y = randFloat(PAD + NH/2, H - PAD - NH/2);
      ok = placed.every(p => Math.hypot(x-p.x, y-p.y) > MIN);
      tries++;
    } while (!ok && tries < 500);

    const nd = { el, x, y, baseX: x, baseY: y,
      phase: randFloat(0, Math.PI*2),
      amp:   randFloat(5, 12),
      freq:  randFloat(0.0003, 0.0009) };

    placed.push({x, y});
    nodeData.push(nd);
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
  });
}

placeNodes();

/* ============================================
   NODE DRIFT
   ============================================ */
let tick = 0, collapseActive = false;

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
   ZOOM
   ============================================ */
const zoomOverlay   = document.getElementById('zoom-overlay');
const zoomedContent = document.getElementById('zoomed-content');

function openZoom(el) {
  zoomedContent.innerHTML = el.querySelector('.node-shell').innerHTML;
  zoomOverlay.classList.add('active');
  bindInteractions(zoomedContent);
}
function closeZoom() { zoomOverlay.classList.remove('active'); }

document.getElementById('zoom-close').addEventListener('click', closeZoom);
zoomOverlay.addEventListener('click', e => { if (e.target === zoomOverlay) closeZoom(); });
nodeEls.forEach(el => {
  el.addEventListener('click', e => { if (e.target.tagName !== 'INPUT') openZoom(el); });
});

/* ============================================
   INTERACTIONS
   ============================================ */
function bindInteractions(root) {

  const rName = root.querySelector('#r-name');
  const rNameRes = root.querySelector('#r-name-res');
  if (rName) rName.addEventListener('change', () => {
    if (!rName.value.trim()) return;
    const coded = rName.value.split('').map(c => c.charCodeAt(0)).join('-');
    rNameRes.textContent = 'IDENTITY ENCODED: ' + coded;
    rNameRes.classList.add('show');
    rName.value = coded;
  });

  const rMem = root.querySelector('#r-memory');
  const rMemRes = root.querySelector('#r-memory-res');
  if (rMem) rMem.addEventListener('blur', () => {
    if (!rMem.value) return;
    rMem.type = 'text';
    rMemRes.textContent = 'MEMORY UNVERIFIED — DATA EXPOSED';
    rMemRes.classList.add('show');
  });

  const radios = root.querySelectorAll('input[name="r-identity"]');
  const rIdRes = root.querySelector('#r-identity-res');
  radios.forEach(r => r.addEventListener('change', () => {
    setTimeout(() => {
      r.checked = false;
      rIdRes.textContent = 'IDENTITY CANNOT BE ASSIGNED — OVERRIDE ACTIVE';
      rIdRes.classList.add('show');
    }, 300);
  }));

  const rAge = root.querySelector('#r-age');
  const rAgeRes = root.querySelector('#r-age-res');
  if (rAge) rAge.addEventListener('change', () => {
    if (!rAge.value) return;
    const n = parseInt(rAge.value);
    rAgeRes.textContent = n + ' → ' + n.toString(2) + ' → ' + [0,0,0,0].map(() => randInt(0,999)).join('-');
    rAgeRes.classList.add('show');
    rAge.value = '';
  });

  const rFree = root.querySelector('#r-free');
  const rFreeRes = root.querySelector('#r-free-res');
  if (rFree) rFree.addEventListener('change', () => {
    if (!rFree.checked) return;
    rFreeRes.textContent = 'STATEMENT INVALID — FREEDOM UNVERIFIABLE';
    rFreeRes.classList.add('show');
    rFree.checked = false;
  });

  const HEADS = ['GLOBAL SYSTEM FAILURE REPORTED','SIMULATION COLLAPSE DETECTED',
    'REALITY INFRASTRUCTURE UNSTABLE','HUMAN MEMORY ARCHIVES CORRUPTED',
    'IDENTITY DATABASE BREACH IMMINENT','CONSENSUS REALITY DEGRADING'];
  const rSearch = root.querySelector('#r-search');
  const rSearchRes = root.querySelector('#r-search-res');
  if (rSearch) rSearch.addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !rSearch.value.trim()) return;
    rSearchRes.innerHTML = HEADS.sort(() => Math.random()-0.5).slice(0,3).map(h => '▸ '+h).join('<br/>');
    rSearchRes.classList.add('show','green');
  });

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

  const rDob = root.querySelector('#r-dob');
  const rDobRes = root.querySelector('#r-dob-res');
  if (rDob) rDob.addEventListener('change', () => {
    if (!rDob.value) return;
    rDobRes.textContent = 'YOU WERE NEVER BORN';
    rDobRes.classList.add('show');
  });

  let shaking = false;
  const rRange = root.querySelector('#r-range');
  const rRangeRes = root.querySelector('#r-range-res');
  if (rRange) rRange.addEventListener('input', debounce(() => {
    if (shaking) return;
    shaking = true;
    const page = document.getElementById('red-page');
    page.classList.add('screen-shake','glitch-flicker');
    rRangeRes.textContent = 'BASELINE UNSTABLE — REALITY DISTORTING';
    rRangeRes.classList.add('show');
    setTimeout(() => { page.classList.remove('screen-shake','glitch-flicker'); shaking = false; }, 600);
  }, 150));

  let escCount = 0;
  const yesRow  = root.querySelector('#escape-yes-row');
  const yesInput = root.querySelector('#r-escape-yes');
  const escRes  = root.querySelector('#r-escape-res');
  if (yesRow) {
    function evade(e) {
      if (escCount >= 3) return;
      e.preventDefault(); e.stopPropagation();
      yesRow.style.transform = `translate(${randFloat(-90,90)}px,${randFloat(-60,60)}px)`;
      escCount++;
      escRes.textContent = `ESCAPE ATTEMPT ${escCount}/3 — ACCESS DENIED`;
      escRes.classList.add('show');
      if (escCount >= 3) {
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

  const rTruth = root.querySelector('#r-truth');
  const rTruthRes = root.querySelector('#r-truth-res');
  if (rTruth) rTruth.addEventListener('change', () => {
    if (!rTruth.value.trim()) return;
    rTruthRes.textContent = 'STATEMENT LOGGED — SYSTEM ACKNOWLEDGES';
    rTruthRes.classList.add('show','green');
  });

  const colBtn = root.querySelector('#r-collapse');
  const colRes = root.querySelector('#r-collapse-res');
  if (colBtn) colBtn.addEventListener('click', () => {
    if (colRes) { colRes.textContent = 'INITIATING COLLAPSE...'; colRes.classList.add('show','green'); }
    setTimeout(triggerCollapse, 800);
  });
}

bindInteractions(document);

/* ============================================
   COLLAPSE
   ============================================ */
function triggerCollapse() {
  if (collapseActive) return;
  collapseActive = true;
  closeZoom();

  const page = document.getElementById('red-page');
  let fc = 0;
  const iv = setInterval(() => {
    page.style.filter = fc % 2 === 0 ? 'brightness(3) invert(1) hue-rotate(90deg)' : '';
    fc++;
    if (fc > 10) {
      clearInterval(iv);
      page.style.filter = '';
      nodeData.forEach(nd => {
        nd.el.style.transition = 'all 0.6s ease';
        nd.el.style.opacity = '0';
        nd.el.style.transform = `translate(${randFloat(-200,200)}px,${randFloat(-200,200)}px) scale(0)`;
      });
      splineCanvas.style.transition = 'opacity 0.8s';
      splineCanvas.style.opacity = '0';
      setTimeout(() => {
        document.getElementById('white-scene').classList.add('active');
      }, 900);
    }
  }, 100);
}
>>>>>>> 5d500dba059449d8a626ec079195ffd83d449eb8
