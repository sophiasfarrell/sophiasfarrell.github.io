(() => {
  'use strict';

  // Direction bits
  const N = 1, E = 2, S = 4, W = 8;
  const DIRS = [
    { bit: N, dx: 0, dy: -1, opp: S },
    { bit: E, dx: 1, dy: 0, opp: W },
    { bit: S, dx: 0, dy: 1, opp: N },
    { bit: W, dx: -1, dy: 0, opp: E },
  ];
  // Rotate a mask clockwise by r quarter turns (N->E->S->W->N)
  const rotMask = (m, r) => {
    r = ((r % 4) + 4) % 4;
    for (let i = 0; i < r; i++) m = ((m << 1) | (m >> 3)) & 15;
    return m;
  };

  // Fictional-scenario service pool
  const SERVICES = [
    { icon: '✉️', name: 'Email', headline: 'Email services go dark for millions of users worldwide' },
    { icon: '🏦', name: 'Banking', headline: 'Online banking down as customers locked out of accounts' },
    { icon: '✈️', name: 'Airlines', headline: 'Flights grounded nationwide after airline systems fail' },
    { icon: '💳', name: 'Card Payments', headline: 'Card readers fail at stores and gas stations across the Midwest' },
    { icon: '🏥', name: 'Hospital Records', headline: 'Hospitals switch to paper charts as records system crashes' },
    { icon: '🚨', name: '911 Dispatch', headline: '911 dispatch centers scramble after network failure' },
    { icon: '☁️', name: 'Cloud Storage', headline: 'Cloud storage outage leaves students and workers without files' },
    { icon: '📚', name: 'Canvas / Class', headline: 'Online classes stall as campus learning platform goes offline' },
    { icon: '🚦', name: 'Traffic Signals', headline: 'Traffic signals flash red across the city after control system fault' },
    { icon: '📺', name: 'Streaming', headline: 'Streaming services buffer to a halt on game day' },
    { icon: '🛒', name: 'Groceries', headline: 'Self-checkout and grocery apps stop working at busy stores' },
    { icon: '📱', name: 'Cell Service', headline: 'Cell service drops for large parts of the country' },
    { icon: '⚡', name: 'Power Grid', headline: 'Utility monitoring offline as the power company reports a network fault' },
    { icon: '🏫', name: 'Registrar', headline: 'Registration system crashes during add/drop week' },
  ];

  const $ = (id) => document.getElementById(id);
  const boardEl = $('board');
  const overlay = $('overlay');

  const params = new URLSearchParams(location.search);
  if (params.has('embed') || window.self !== window.top) document.body.classList.add('embed');

  // ---------- storage ----------
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  // ---------- utilities ----------
  const rnd = (n) => Math.floor(Math.random() * n);
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  // ---------- level config ----------
  function levelConfig(n) {
    const w = Math.min(4 + Math.floor((n - 1) / 2), 8);
    const h = Math.min(4 + Math.floor(n / 2), 7);
    const sources = n >= 5 ? 2 : 1;
    const targets = Math.min(2 + Math.floor((n - 1) / 2), h - 1, 6);
    const lockedRatio = n < 3 ? 0 : Math.min(0.06 * (n - 2), 0.3);
    const time = Math.round(25 + w * h * 2.2 - Math.min(n, 10) * 2);
    return { w, h, sources, targets, lockedRatio, time };
  }

  // ---------- puzzle generation ----------
  // Build a random spanning tree (randomized Prim) so every level is guaranteed solvable.
  function generate(cfg) {
    const { w, h } = cfg;
    const sol = Array.from({ length: h }, () => Array(w).fill(0));
    const seen = Array.from({ length: h }, () => Array(w).fill(false));
    const sx = rnd(w), sy = rnd(h);
    seen[sy][sx] = true;
    let frontier = [];
    const pushEdges = (x, y) => {
      DIRS.forEach((d) => {
        const nx = x + d.dx, ny = y + d.dy;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && !seen[ny][nx]) frontier.push({ x, y, nx, ny, d });
      });
    };
    pushEdges(sx, sy);
    while (frontier.length) {
      const i = rnd(frontier.length);
      const e = frontier.splice(i, 1)[0];
      if (seen[e.ny][e.nx]) continue;
      seen[e.ny][e.nx] = true;
      sol[e.y][e.x] |= e.d.bit;
      sol[e.ny][e.nx] |= e.d.opp;
      pushEdges(e.nx, e.ny);
    }

    // Terminals live on the left (servers) and right (services) edges.
    const rows = shuffle([...Array(h).keys()]);
    const sourceRows = rows.slice(0, cfg.sources).sort((a, b) => a - b);
    const targetRows = shuffle([...Array(h).keys()]).slice(0, cfg.targets).sort((a, b) => a - b);
    sourceRows.forEach((r) => { sol[r][0] |= W; });
    targetRows.forEach((r) => { sol[r][w - 1] |= E; });

    // Tiles: base shape + scramble. Some are locked (already correct).
    const tiles = [];
    for (let y = 0; y < h; y++) {
      tiles[y] = [];
      for (let x = 0; x < w; x++) {
        const base = sol[y][x];
        const symmetric = base === 15 || base === 0;
        const lockable = !symmetric;
        const locked = lockable && Math.random() < cfg.lockedRatio;
        tiles[y][x] = { base, turn: locked ? 0 : rnd(4), locked };
      }
    }
    return { tiles, sourceRows, targetRows };
  }

  // ---------- game state ----------
  const state = {
    level: 1, score: 0, best: Number(store.get('outage_best') || 0),
    cfg: null, puzzle: null, services: [], timeLeft: 0, running: false, raf: 0, last: 0, els: [], termEls: [],
  };
  $('best').textContent = state.best;

  const maskAt = (x, y) => { const t = state.puzzle.tiles[y][x]; return rotMask(t.base, t.turn); };

  function computePower() {
    const { w, h } = state.cfg;
    const on = Array.from({ length: h }, () => Array(w).fill(false));
    const queue = [];
    state.puzzle.sourceRows.forEach((r) => {
      if (maskAt(0, r) & W) { on[r][0] = true; queue.push([0, r]); }
    });
    while (queue.length) {
      const [x, y] = queue.pop();
      const m = maskAt(x, y);
      DIRS.forEach((d) => {
        if (!(m & d.bit)) return;
        const nx = x + d.dx, ny = y + d.dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || on[ny][nx]) return;
        if (maskAt(nx, ny) & d.opp) { on[ny][nx] = true; queue.push([nx, ny]); }
      });
    }
    return on;
  }

  function cableSVG(base) {
    const seg = { [N]: 'M50 50V0', [E]: 'M50 50H100', [S]: 'M50 50V100', [W]: 'M50 50H0' };
    let d = '';
    [N, E, S, W].forEach((b) => { if (base & b) d += seg[b]; });
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path class="shell" d="${d}"/><circle class="hubshell" cx="50" cy="50" r="13"/><path class="core" d="${d}"/><circle class="hub" cx="50" cy="50" r="8"/></svg>`;
  }

  function buildBoard() {
    const { w, h } = state.cfg;
    const { tiles, sourceRows, targetRows } = state.puzzle;
    boardEl.style.setProperty('--cols', w + 2);
    boardEl.innerHTML = '';
    state.els = [];
    state.termEls = [];
    const targetIndex = {};
    targetRows.forEach((r, i) => { targetIndex[r] = i; });

    for (let y = 0; y < h; y++) {
      state.els[y] = [];
      // left terminal
      const left = document.createElement('div');
      if (sourceRows.includes(y)) {
        left.className = 'term server';
        left.innerHTML = '<span class="ico">🖥️</span><span class="nm">Server</span>';
      } else left.className = 'empty';
      boardEl.appendChild(left);

      for (let x = 0; x < w; x++) {
        const t = tiles[y][x];
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tile' + (t.locked ? ' locked' : '');
        b.innerHTML = cableSVG(t.base);
        b.setAttribute('aria-label', `Cable row ${y + 1} column ${x + 1}${t.locked ? ' (locked)' : ''}`);
        b.addEventListener('click', () => rotate(x, y, 1));
        b.addEventListener('contextmenu', (e) => { e.preventDefault(); rotate(x, y, -1); });
        let pressTimer;
        b.addEventListener('touchstart', () => { pressTimer = setTimeout(() => { b._long = true; rotate(x, y, -1); }, 450); }, { passive: true });
        const clear = () => clearTimeout(pressTimer);
        b.addEventListener('touchend', (e) => { clear(); if (b._long) { e.preventDefault(); b._long = false; } });
        b.addEventListener('touchmove', clear, { passive: true });
        boardEl.appendChild(b);
        state.els[y][x] = b;
        b.firstChild.style.transform = `rotate(${t.turn * 90}deg)`;
      }

      // right terminal
      const right = document.createElement('div');
      if (y in targetIndex) {
        const svc = state.services[targetIndex[y]];
        right.className = 'term service';
        right.innerHTML = `<span class="ico">${svc.icon}</span><span class="nm">${svc.name}</span>`;
        state.termEls[targetIndex[y]] = right;
      } else right.className = 'empty';
      boardEl.appendChild(right);
    }
  }

  function buildStatus() {
    const ul = $('statusList');
    ul.innerHTML = '';
    state.services.forEach((s, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${s.icon} ${s.name}</span><span class="pill" id="pill${i}">Offline</span>`;
      ul.appendChild(li);
    });
  }

  function refresh() {
    const on = computePower();
    const { w, h } = state.cfg;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) state.els[y][x].classList.toggle('on', on[y][x]);
    let up = 0;
    state.puzzle.targetRows.forEach((r, i) => {
      const online = on[r][w - 1] && (maskAt(w - 1, r) & E);
      const el = state.termEls[i];
      const was = el.classList.contains('online');
      el.classList.toggle('online', !!online);
      if (online && !was) { el.classList.remove('online'); void el.offsetWidth; el.classList.add('online'); }
      const pill = $('pill' + i);
      pill.textContent = online ? 'Online' : 'Offline';
      pill.classList.toggle('up', !!online);
      if (online) up++;
    });
    return up === state.services.length;
  }

  function rotate(x, y, dir) {
    if (!state.running) return;
    const t = state.puzzle.tiles[y][x];
    const el = state.els[y][x];
    if (t.locked) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); return; }
    t.turn += dir;
    el.firstChild.style.transform = `rotate(${t.turn * 90}deg)`;
    if (refresh()) win();
  }

  // ---------- flow ----------
  function startLevel() {
    const cfg = levelConfig(state.level);
    state.cfg = cfg;
    state.services = shuffle(SERVICES).slice(0, cfg.targets);
    let puzzle;
    // make sure we never start already solved
    do {
      puzzle = generate(cfg);
      state.puzzle = puzzle;
    } while (computePower && allOnline(puzzle, cfg));
    state.timeLeft = cfg.time;
    buildStatus();
    buildBoard();
    refresh();
    $('level').textContent = state.level;
    $('score').textContent = state.score;
    updateTimer();
    $('breaking').hidden = false;
    $('breakingText').textContent = state.services[0].headline;

    const others = state.services.slice(1).map((s) => `<li>${s.icon} ${s.name}</li>`).join('');
    showCard({
      tag: 'Breaking news',
      title: state.services[0].headline,
      body: `Also affected:`,
      list: others,
      btn: 'Start restoring service',
      onClick: () => { hideCard(); run(); },
    });
  }

  function allOnline(puzzle, cfg) {
    const saved = state.puzzle;
    state.puzzle = puzzle; state.cfg = cfg;
    const on = computePower();
    const ok = puzzle.targetRows.every((r) => on[r][cfg.w - 1] && (maskAt(cfg.w - 1, r) & E));
    state.puzzle = saved;
    return ok;
  }

  function run() {
    state.running = true;
    state.last = performance.now();
    cancelAnimationFrame(state.raf);
    const tick = (now) => {
      if (!state.running) return;
      state.timeLeft -= (now - state.last) / 1000;
      state.last = now;
      if (state.timeLeft <= 0) { state.timeLeft = 0; updateTimer(); lose(); return; }
      updateTimer();
      state.raf = requestAnimationFrame(tick);
    };
    state.raf = requestAnimationFrame(tick);
  }

  function updateTimer() {
    $('time').textContent = fmt(Math.ceil(state.timeLeft));
    const frac = Math.max(0, state.timeLeft / state.cfg.time);
    const fill = $('fill');
    fill.style.transform = `scaleX(${frac})`;
    fill.classList.toggle('low', state.timeLeft <= 10);
  }

  function win() {
    state.running = false;
    cancelAnimationFrame(state.raf);
    const bonus = Math.round(state.timeLeft) * 10;
    const gained = 100 * state.level + bonus;
    state.score += gained;
    $('score').textContent = state.score;
    if (state.score > state.best) { state.best = state.score; store.set('outage_best', String(state.best)); $('best').textContent = state.best; }
    $('breakingText').textContent = 'All services restored.';
    const next = levelConfig(state.level + 1);
    showCard({
      tag: 'Restored', good: true,
      title: `Back online: ${state.services.map((s) => s.name).join(', ')}`,
      body: `Fixed with ${fmt(Math.ceil(state.timeLeft))} to spare. +${gained} points (${bonus} time bonus). Next up: a ${next.w}×${next.h} network with ${next.targets} services${next.sources > 1 ? ' and 2 servers' : ''}.`,
      list: '',
      btn: 'Next outage',
      onClick: () => { hideCard(); state.level++; startLevel(); },
    });
  }

  function lose() {
    state.running = false;
    showCard({
      tag: 'Still down',
      title: 'Time ran out. The outage continues.',
      body: `You reached level ${state.level} with ${state.score} points.`,
      list: '',
      btn: 'Try again from level 1',
      onClick: () => { hideCard(); state.level = 1; state.score = 0; startLevel(); },
    });
  }

  // ---------- overlay ----------
  function showCard({ tag, title, body, list, btn, good, onClick }) {
    const t = $('cardTag');
    t.textContent = tag;
    t.classList.toggle('good', !!good);
    $('cardTitle').textContent = title;
    $('cardBody').textContent = body;
    $('cardList').innerHTML = list;
    const b = $('cardBtn');
    b.textContent = btn;
    b.onclick = onClick;
    overlay.hidden = false;
    b.focus();
  }
  function hideCard() { overlay.hidden = true; }

  if (params.has('debug')) window.__outage = state;

  // ---------- intro ----------
  state.cfg = levelConfig(1);
  $('time').textContent = fmt(state.cfg.time);
  showCard({
    tag: 'How to play',
    title: 'Outage Connect',
    body: 'Servers are down and services are going dark. Click cables to rotate them and build a path from every server to every service before the clock runs out. Locked cables (marked with a square) cannot be moved. Each level is bigger and trickier.',
    list: '',
    btn: 'Begin',
    onClick: () => { hideCard(); startLevel(); },
  });
})();
