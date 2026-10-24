/* Reaktionstest mit der Leertaste: 5 Runden, Durchschnitt und Bestzeit. */
(function () {
  var pad = document.getElementById('rpad');
  if (!pad) return;
  var $ = function (id) { return document.getElementById(id); };
  var ROUNDS = 5;
  var state = 'idle'; // idle | wait | go | early | between | done
  var times = [], timer = 0, goAt = 0, held = false;

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('lk_react_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('lk_react_' + k, JSON.stringify(v)); } catch (e) {} }
  };
  function ms(n) { return Math.round(n) + ' ms'; }
  function rate(avg) {
    if (avg < 200) return ['Blitzschnell', 'Das ist ein Spitzenwert, typisch für trainierte Gamer.'];
    if (avg < 250) return ['Sehr gut', 'Deutlich schneller als der Durchschnitt.'];
    if (avg < 300) return ['Durchschnitt', 'So reagieren die meisten Menschen auf ein visuelles Signal.'];
    if (avg < 380) return ['Etwas langsam', 'Müdigkeit, Ablenkung oder ein träger Bildschirm können eine Rolle spielen.'];
    return ['Langsam', 'Mach eine kurze Pause und versuch es konzentriert noch einmal.'];
  }
  function show(cls, big, small) {
    pad.className = 'react-pad' + (cls ? ' ' + cls : '');
    pad.innerHTML = '<div><b>' + big + '</b>' + (small ? '<small>' + small + '</small>' : '') + '</div>';
  }
  function renderRounds() {
    var html = '';
    for (var i = 0; i < ROUNDS; i++) html += '<div><span>Runde ' + (i + 1) + '</span>' + (times[i] != null ? ms(times[i]) : '–') + '</div>';
    $('rounds').innerHTML = html;
  }
  function renderBest() {
    var b = store.get('best', null);
    $('rBest').textContent = b ? ms(b) : '–';
  }
  function idle() {
    clearTimeout(timer);
    state = 'idle'; times = [];
    show('', 'Leertaste drücken zum Start', 'Fünf Runden. Drück, sobald die Fläche grün wird.');
    $('result').hidden = true;
    renderRounds();
  }
  function arm() {
    state = 'wait';
    show('wait', 'Warte auf Grün …', 'Noch nicht drücken.');
    timer = setTimeout(function () {
      state = 'go';
      show('go', 'JETZT!', '');
      requestAnimationFrame(function () { goAt = performance.now(); });
    }, 1500 + Math.random() * 2500);
  }
  function finish() {
    state = 'done';
    var sum = times.reduce(function (a, c) { return a + c; }, 0), avg = sum / times.length;
    var best = Math.min.apply(null, times);
    var r = rate(avg);
    show('', ms(avg) + ' im Schnitt', 'Leertaste oder Enter für einen neuen Test.');
    $('rAvg').textContent = ms(avg);
    $('rFast').textContent = ms(best);
    $('rName').textContent = r[0];
    $('rNote').textContent = r[1];
    var prev = store.get('best', null);
    var pb = !prev || avg < prev;
    if (pb) store.set('best', Math.round(avg));
    $('pbBadge').hidden = !pb;
    $('result').hidden = false;
    renderBest();
  }
  function press() {
    if (state === 'idle' || state === 'done') { times = []; renderRounds(); $('result').hidden = true; arm(); return; }
    if (state === 'wait') {
      clearTimeout(timer);
      state = 'early';
      show('early', 'Zu früh!', 'Diese Runde zählt nicht. Leertaste drücken, um sie zu wiederholen.');
      return;
    }
    if (state === 'early' || state === 'between') { arm(); return; }
    if (state === 'go') {
      if (!goAt) goAt = performance.now();
      var t = performance.now() - goAt;
      goAt = 0;
      times.push(t);
      renderRounds();
      if (times.length >= ROUNDS) { finish(); return; }
      state = 'between';
      show('', ms(t), 'Runde ' + times.length + ' von ' + ROUNDS + '. Leertaste für die nächste Runde.');
    }
  }

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      if (e.repeat || held) return;
      held = true;
      press();
    } else if (e.key === 'Enter' && !(t && t.tagName === 'BUTTON' && t.id !== 'restartBtn')) {
      e.preventDefault();
      idle();
    }
  });
  document.addEventListener('keyup', function (e) { if (e.code === 'Space' || e.key === ' ') held = false; });
  window.addEventListener('blur', function () { held = false; });
  pad.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault(); press();
  });
  $('restartBtn').addEventListener('click', function (e) { idle(); e.currentTarget.blur(); });
  $('clearBtn').addEventListener('click', function (e) { store.set('best', null); renderBest(); e.currentTarget.blur(); });

  renderBest();
  idle();
})();
