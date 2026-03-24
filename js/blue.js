/* ============================================
   js/blue.js — Blue Pill page logic
   ============================================ */

(function () {
  'use strict';

  /* ── Live clock ── */
  const clockEl = document.getElementById('blue-clock');
  if (clockEl) {
    function updateClock() {
      const d  = new Date();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      clockEl.textContent = `${hh}:${mm}:${ss}`;
    }
    setInterval(updateClock, 1000);
    updateClock();
  }

  /* ── Helper: show a status element ── */
  function showStatus(id, delay) {
    delay = delay || 0;
    const el = document.getElementById(id);
    if (!el) return;
    clearTimeout(el._statusTimer);
    el._statusTimer = setTimeout(() => el.classList.add('show'), delay);
  }

  /* ── 1. Name confirmation ── */
  const blueName = document.getElementById('blue-name');
  if (blueName) {
    ['change', 'blur'].forEach(evt => {
      blueName.addEventListener(evt, () => {
        if (blueName.value.trim()) showStatus('blue-name-status');
      });
    });
  }

  /* ── 4. Productivity range ── */
  const blueRange    = document.getElementById('blue-range');
  const blueRangeVal = document.getElementById('blue-range-val');
  if (blueRange) {
    blueRange.addEventListener('input', () => {
      if (blueRangeVal) blueRangeVal.textContent = blueRange.value;
      showStatus('blue-range-status', 500);
    });
  }

  /* ── 6. Sky color picker ── */
  const blueColor  = document.getElementById('blue-color');
  const colorSwatch = document.getElementById('color-swatch');
  const colorValEl  = document.getElementById('color-val');
  if (blueColor) {
    blueColor.addEventListener('input', () => {
      const c = blueColor.value;
      if (colorSwatch) colorSwatch.style.background = c;
      if (colorValEl)  colorValEl.textContent        = c.toUpperCase();
      showStatus('blue-color-status', 280);
    });
    // Init swatch on load
    if (colorSwatch) colorSwatch.style.background = blueColor.value;
  }

  /* ── 7. Wake time ── */
  const blueTime = document.getElementById('blue-time');
  if (blueTime) {
    blueTime.addEventListener('change', () => showStatus('blue-time-status'));
  }

  /* ── 8. Email identity ── */
  const blueEmail = document.getElementById('blue-email');
  if (blueEmail) {
    blueEmail.addEventListener('blur', () => {
      if (blueEmail.value.includes('@')) showStatus('blue-email-status');
    });
  }

  /* ── 11. Help checkbox → glitch warning ── */
  const blueHelp       = document.getElementById('blue-help');
  const blueGlitchWarn = document.getElementById('blue-glitch-warn');
  if (blueHelp) {
    blueHelp.addEventListener('change', () => {
      if (blueHelp.checked) {
        showStatus('blue-help-status');
        if (blueGlitchWarn) {
          blueGlitchWarn.classList.add('show');
          setTimeout(() => blueGlitchWarn.classList.remove('show'), 2200);
        }
      } else {
        const s = document.getElementById('blue-help-status');
        if (s) s.classList.remove('show');
      }
    });
  }

  /* ── 12. Reset → return to intro ── */
  const blueResetBtn = document.getElementById('blue-reset-btn');
  if (blueResetBtn) {
    blueResetBtn.addEventListener('click', () => {
      blueResetBtn.textContent = 'RETURNING TO ORIGIN...';
      setTimeout(() => { window.location.href = 'index.html'; }, 650);
    });
  }

})();