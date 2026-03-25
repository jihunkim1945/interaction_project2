(function () {
  var stages = [
    document.getElementById('stage-crash'),
    document.getElementById('stage-the-end'),
    document.getElementById('stage-ascii'),
    document.getElementById('stage-data'),
    document.getElementById('stage-pill'),
  ];
  var flash = document.getElementById('flash-overlay');
  var current = 0;
  var GIF_MS = [1900, 2800, 3200, 2600];

  function cutTo(next) {
    flash.style.opacity = '1';
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        stages[current].classList.remove('active');
        current = next;
        stages[current].classList.add('active');
        flash.style.opacity = '0';
        if (next === 4) {
          setTimeout(function () {
            document.getElementById('pill-inner').classList.add('visible');
            document.getElementById('pill-input').focus();
          }, 300);
        }
      });
    });
  }

  function runChain(i) {
    setTimeout(function () {
      cutTo(i + 1);
      if (i + 1 < 4) runChain(i + 1);
    }, GIF_MS[i]);
  }

  runChain(0);

  var input = document.getElementById('pill-input');
  var warning = document.getElementById('pill-warning');

  input.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var v = input.value.trim().toLowerCase();
    if (v === 'blue') {
      input.style.borderColor = '#3366ff';
      input.style.color = '#3366ff';
      setTimeout(function () { location.href = 'blue.html'; }, 420);
    } else if (v === 'red') {
      input.style.borderColor = '#ff3333';
      input.style.color = '#ff3333';
      setTimeout(function () { location.href = 'red.html'; }, 420);
    } else {
      warning.classList.add('show');
      input.value = '';
      setTimeout(function () { warning.classList.remove('show'); }, 2500);
    }
  });
})();