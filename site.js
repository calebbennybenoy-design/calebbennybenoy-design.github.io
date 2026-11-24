/* Caleb Benny Benoy portfolio: interactions for the static site (no framework). */
(function () {
  'use strict';
  var dataEl = document.getElementById('page-data');
  var D = dataEl ? JSON.parse(dataEl.textContent) : {};

  /* ---------- section menu + reading progress ---------- */
  var ids = D.ids || [];
  var tocLinks = [].slice.call(document.querySelectorAll('[data-toc]'));
  var track = document.querySelector('[data-track]');
  var prog = document.querySelector('[data-progress]');
  var raf = null;
  function measure() {
    raf = null;
    var vh = window.innerHeight || 800, line = vh * 0.32, active = 0, frac = 0;
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (!el) continue;
      var r = el.getBoundingClientRect();
      if (r.top <= line) {
        active = i;
        var next = i + 1 < ids.length ? document.getElementById(ids[i + 1]) : null;
        var end = next ? next.getBoundingClientRect().top : r.bottom;
        frac = Math.min(1, Math.max(0, (line - r.top) / Math.max(1, end - r.top)));
      }
    }
    tocLinks.forEach(function (a, i) {
      a.style.color = i === active ? '#0A0A0A' : (i < active ? '#4F586B' : '#646D82');
      a.style.fontWeight = i === active ? '600' : '400';
      if (i === active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    if (track && ids.length) track.style.height = (((active + frac) / ids.length) * 100).toFixed(1) + '%';
    if (prog) {
      var doc = document.scrollingElement || document.documentElement;
      var max = doc.scrollHeight - vh;
      prog.style.width = (max > 0 ? Math.min(1, Math.max(0, doc.scrollTop / max)) * 100 : 0) + '%';
    }
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(measure); }
  if (ids.length) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    measure();
  }

  /* ---------- tabs (screenshot viewers, live UI versions, hierarchy roles) ---------- */
  var SC = D.scopes || {};
  var ON = { opacity: '1', border: '1.5px solid #5B3FD6', boxShadow: '0 10px 30px rgba(91,63,214,0.18)', background: '#FFFFFF', filter: 'none' };
  var OFF = { opacity: '0.32', border: '1.5px dashed rgba(10,30,80,0.22)', boxShadow: 'none', background: 'rgba(255,255,255,0.5)', filter: 'grayscale(1)' };
  function setTab(tid, idx) {
    [].forEach.call(document.querySelectorAll('[data-tab="' + tid + '"]'), function (b) {
      var on = +b.getAttribute('data-i') === idx;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.style.background = on ? '#0A0A0A' : 'rgba(0,0,0,0)';
      b.style.color = on ? '#FFFFFF' : '#4F586B';
    });
    [].forEach.call(document.querySelectorAll('[data-pane^="' + tid + ':"]'), function (p) {
      p.style.opacity = +p.getAttribute('data-pane').split(':')[1] === idx ? '1' : '0';
    });
    [].forEach.call(document.querySelectorAll('[data-ifpane^="' + tid + ':"]'), function (p) {
      p.hidden = +p.getAttribute('data-ifpane').split(':')[1] !== idx;
    });
    if (SC[tid]) {
      [].forEach.call(document.querySelectorAll('[data-scope^="' + tid + ':"]'), function (n) {
        var key = n.getAttribute('data-scope').split(':')[1];
        var s = (SC[tid][key] || []).indexOf(idx) >= 0 ? ON : OFF;
        for (var k in s) n.style[k] = s[k];
      });
    }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-tab]');
    if (b) setTab(b.getAttribute('data-tab'), +b.getAttribute('data-i'));
  });

  /* ---------- before / after sliders ---------- */
  [].forEach.call(document.querySelectorAll('input[data-cmp]'), function (inp) {
    var id = inp.getAttribute('data-cmp');
    var clip = document.querySelector('[data-cmp-clip="' + id + '"]');
    var pos = document.querySelector('[data-cmp-pos="' + id + '"]');
    function upd() {
      var v = +inp.value;
      if (clip) clip.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
      if (pos) pos.style.left = v + '%';
    }
    inp.addEventListener('input', upd); upd();
  });

  /* ---------- audio summary ---------- */
  var audio = document.querySelector('audio[data-audio]');
  if (audio) {
    var btn = document.querySelector('[data-audio-toggle]');
    var timeEl = document.querySelector('[data-audio-time]');
    var seekEl = document.querySelector('[data-audio-seek]');
    var bars = [].slice.call(document.querySelectorAll('[data-bar]'));
    var icPlay = document.querySelector('[data-if="paused"]');
    var icPause = document.querySelector('[data-if="playing"]');
    var dur = D.dur || 60;
    var fmt = function (s) { if (!isFinite(s) || s < 0) s = 0; var m = Math.floor(s / 60), x = Math.floor(s % 60); return m + ':' + (x < 10 ? '0' : '') + x; };
    function paint() {
      var t = audio.currentTime || 0, d = isFinite(audio.duration) ? audio.duration : dur;
      if (timeEl) timeEl.textContent = (t ? fmt(t) + ' / ' : '') + fmt(d);
      var pr = d ? Math.min(1, t / d) : 0;
      bars.forEach(function (b, i) { b.style.backgroundColor = (i / bars.length) < pr ? '#0061FF' : 'rgba(10,30,80,0.22)'; });
      var playing = !audio.paused && !audio.ended;
      if (icPlay) icPlay.hidden = playing;
      if (icPause) icPause.hidden = !playing;
      if (btn) btn.setAttribute('aria-label', playing ? 'Pause audio summary' : 'Play audio summary');
    }
    btn && btn.addEventListener('click', function () {
      if (audio.paused) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); } else audio.pause();
    });
    ['timeupdate', 'loadedmetadata', 'play', 'pause', 'ended'].forEach(function (ev) { audio.addEventListener(ev, paint); });
    audio.addEventListener('ended', function () { audio.currentTime = 0; paint(); });
    seekEl && seekEl.addEventListener('click', function (e) {
      var d = isFinite(audio.duration) ? audio.duration : 0;
      if (!d) { audio.addEventListener('loadedmetadata', function once() { audio.removeEventListener('loadedmetadata', once); seekEl.click(); }); audio.load(); return; }
      var r = seekEl.getBoundingClientRect();
      audio.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * d; paint();
    });
    paint();
  }

  /* ---------- copy email ---------- */
  [].forEach.call(document.querySelectorAll('[data-copy-email]'), function (b) {
    var email = b.getAttribute('data-copy-email');
    var label = b.querySelector('[data-copy-label]');
    var timer;
    b.addEventListener('click', function () {
      try { if (navigator.clipboard) navigator.clipboard.writeText(email); } catch (e) {}
      if (label) { label.textContent = 'Email copied'; clearTimeout(timer); timer = setTimeout(function () { label.textContent = email; }, 2200); }
    });
  });
})();
