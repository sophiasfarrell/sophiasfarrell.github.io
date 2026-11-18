(() => {
  'use strict';

  // ================= constants =================
  const T = 16, VW = 320, VH = 240, MW = 32, MH = 24;
  const GAME_SECONDS = 180;
  const NEED_CABLES = 2, NEED_CHIPS = 1;
  const CABLE_COLORS = ['#ff9f1c', '#35e0ff', '#ff6bd6', '#ffe14a', '#a78bff'];
  const SYMBOLS = ['▲', '●', '■', '◆', '★'];

  const ROOMS = [
    { id: 'faa',  name: 'FAA AIR TRAFFIC', col: '#35e0ff', x0: 1,  x1: 15, y0: 1,  y1: 11, label: 0,  services: ['Air Traffic Control', 'Flight Tracking'] },
    { id: 'bank', name: 'BANKING',         col: '#ffd23f', x0: 17, x1: 30, y0: 1,  y1: 11, label: 0,  services: ['ATM Network', 'Mobile Banking'] },
    { id: 'mail', name: 'OUTLOOK MAIL',    col: '#ff6bd6', x0: 1,  x1: 15, y0: 13, y1: 22, label: 12, services: ['Outlook Inbox', 'Calendar Invites'] },
    { id: 'net',  name: 'NETWORK',         col: '#7dff4f', x0: 17, x1: 30, y0: 13, y1: 22, label: 12, services: ['Campus Wi-Fi', 'Cat Videos'] },
  ];
  const DOORS = [[16, 5], [16, 6], [16, 17], [16, 18], [7, 12], [8, 12], [23, 12], [24, 12]];

  const RESTORE_NEWS = {
    'Air Traffic Control': 'AIR TRAFFIC RESTORED: Planes agree to stop circling Omaha like confused pigeons.',
    'Flight Tracking': 'FLIGHT TRACKER BACK: Man learns Gate B12 never existed. Gate B12 declines comment.',
    'ATM Network': 'ATMS ONLINE: Nation\'s wallets resume being empty, but now digitally.',
    'Mobile Banking': 'BANKING APP BACK: Balance check reveals "treat yourself" was a mistake.',
    'Outlook Inbox': 'INBOX RESTORED: 4,000 unread emails flood back. Nation weeps softly.',
    'Calendar Invites': 'CALENDAR BACK: Meeting that could have been an email resumes at 9 AM.',
    'Campus Wi-Fi': 'WI-FI RESTORED: Students emerge from library, blinking at sunlight.',
    'Cat Videos': 'CAT VIDEOS BACK: Productivity drops to 0% nationwide. Officials thrilled.',
  };
  const HIT_NEWS = [
    'TECH ZAPPED: "Felt like a very aggressive handshake," says witness.',
    'SPARK BOT STRIKES: IT worker loses 5 seconds and a bit of dignity.',
    'EXPERTS CONFIRM: Electricity is, in fact, still dangerous.',
    'OUCH: Technician\'s hair now achieves new heights. Stylists impressed.',
  ];
  const AMBIENT_NEWS = [
    'IT DEPT replies "have you tried turning it off and on again?" to literally everything.',
    'AREA MAN refreshes page 400 times, expects different result.',
    'PILOTS told to look out the window. Reports are mixed.',
    'BANKS assure customers their money is "probably still there."',
    'NATION discovers it can still talk to neighbors. Awkward.',
    'WORLD without email reports 100% fewer "per my last message."',
    'LOCAL GOAT eats router cable. Not related. Goat is fine.',
    'OFFICIALS blame "the cloud." Cloud denies everything.',
  ];

  // ================= dom =================
  const $ = (id) => document.getElementById(id);
  const cv = $('screen'), ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (isTouch) document.body.classList.add('touch');
  const params = new URLSearchParams(location.search);

  // ================= utils =================
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  let AC;
  function beep(f, d = 0.08, type = 'square', v = 0.035) {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.value = f; g.gain.value = v;
      o.connect(g); g.connect(AC.destination); o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + d);
      o.stop(AC.currentTime + d);
    } catch (e) {}
  }

  // ================= state =================
  let S = null; // game state
  let wall, solid, mapCanvas;

  function isSolid(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MW || ty >= MH) return true;
    return solid[ty][tx];
  }
  function blockedBox(cx, cy, h) {
    return isSolid(Math.floor((cx - h) / T), Math.floor((cy - h) / T)) ||
           isSolid(Math.floor((cx + h) / T), Math.floor((cy - h) / T)) ||
           isSolid(Math.floor((cx - h) / T), Math.floor((cy + h) / T)) ||
           isSolid(Math.floor((cx + h) / T), Math.floor((cy + h) / T));
  }

  // ================= map building =================
  function buildMap() {
    wall = Array.from({ length: MH }, () => Array(MW).fill(false));
    for (let x = 0; x < MW; x++) { wall[0][x] = true; wall[MH - 1][x] = true; wall[12][x] = true; }
    for (let y = 0; y < MH; y++) { wall[y][0] = true; wall[y][MW - 1] = true; wall[y][16] = true; }
    DOORS.forEach(([x, y]) => { wall[y][x] = false; });
    solid = wall.map((r) => r.slice());

    const deco = [];
    ROOMS.forEach((r) => {
      // desks with glowing monitors
      deco.push({ type: 'desk', x: r.x0 + 6, y: r.y0 + 1 }, { type: 'desk', x: r.x0 + 7, y: r.y0 + 1 });
      // rack rows
      for (let i = 2; i <= 4; i++) deco.push({ type: 'rack', x: r.x0 + i, y: r.y0 + 5 });
      for (let i = 10; i <= 12; i++) deco.push({ type: 'rack', x: r.x0 + i, y: r.y0 + 7 });
    });
    deco.forEach((d) => { solid[d.y][d.x] = true; });
    return deco;
  }

  function renderStatic(deco) {
    mapCanvas = document.createElement('canvas');
    mapCanvas.width = MW * T; mapCanvas.height = MH * T;
    const g = mapCanvas.getContext('2d');
    const hash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const px = x * T, py = y * T;
      if (wall[y][x]) {
        g.fillStyle = '#1b2a73'; g.fillRect(px, py, T, T);
        g.fillStyle = '#101c55';
        g.fillRect(px, py + 7, T, 1); g.fillRect(px, py + 15, T, 1);
        g.fillRect(px + ((y % 2) ? 4 : 10), py, 1, 7); g.fillRect(px + ((y % 2) ? 12 : 3), py + 8, 1, 7);
        g.fillStyle = '#3d58d6'; g.fillRect(px, py, T, 1);
      } else {
        const gap = (x === 16) || (y === 12);
        g.fillStyle = gap ? '#16286f' : ((x + y) % 2 ? '#0b1540' : '#0d1a4a');
        g.fillRect(px, py, T, T);
        g.fillStyle = '#08103a'; g.fillRect(px + 15, py, 1, T); g.fillRect(px, py + 15, T, 1);
        if (hash(x, y) % 7 === 0) { g.fillStyle = '#16307f'; g.fillRect(px + 5, py + 6, 2, 2); }
        if (gap) { g.fillStyle = '#ffd23f'; g.fillRect(px + 2, py + 7, 3, 2); g.fillRect(px + 11, py + 7, 3, 2); }
      }
    }
    // room tint
    ROOMS.forEach((r) => {
      g.globalAlpha = 0.07; g.fillStyle = r.col;
      g.fillRect(r.x0 * T, r.y0 * T, (r.x1 - r.x0 + 1) * T, (r.y1 - r.y0 + 1) * T);
      g.globalAlpha = 1;
      g.fillStyle = r.col; g.globalAlpha = 0.35;
      g.fillRect(r.x0 * T, r.y0 * T, (r.x1 - r.x0 + 1) * T, 1);
      g.globalAlpha = 1;
      g.font = '6px "Press Start 2P", monospace'; g.textBaseline = 'middle';
      g.fillStyle = '#000'; g.fillText(r.name, r.x0 * T + 5, r.label * T + 9);
      g.fillStyle = r.col; g.fillText(r.name, r.x0 * T + 4, r.label * T + 8);
    });
    // decor
    deco.forEach((d) => {
      const px = d.x * T, py = d.y * T;
      if (d.type === 'rack') {
        g.fillStyle = '#0e1646'; g.fillRect(px, py, T, T);
        g.fillStyle = '#2b45b8'; g.fillRect(px, py, T, 1); g.fillRect(px, py, 1, T); g.fillRect(px + 15, py, 1, T);
        g.fillStyle = '#050a26';
        for (let i = 0; i < 3; i++) g.fillRect(px + 2, py + 3 + i * 4, 12, 3);
        const lights = ['#ff2d3d', '#2dff6b', '#ffd23f'];
        for (let i = 0; i < 3; i++) { g.fillStyle = lights[hash(d.x + i, d.y) % 3]; g.fillRect(px + 11, py + 4 + i * 4, 2, 1); }
        g.fillStyle = '#16307f'; g.fillRect(px + 3, py + 4, 5, 1);
      } else {
        g.fillStyle = '#26306e'; g.fillRect(px, py + 4, T, 12);
        g.fillStyle = '#3b4aa0'; g.fillRect(px, py + 4, T, 1);
        g.fillStyle = '#0a0f2e'; g.fillRect(px + 2, py + 1, 12, 10);
        g.fillStyle = '#1a7a98'; g.fillRect(px + 3, py + 2, 10, 7);
        g.fillStyle = '#8ff'; g.fillRect(px + 4, py + 3, 6, 1); g.fillRect(px + 4, py + 5, 8, 1); g.fillRect(px + 4, py + 7, 4, 1);
        g.fillStyle = '#0a0f2e'; g.fillRect(px + 6, py + 11, 4, 2);
      }
    });
  }

  // ================= game setup =================
  function newGame() {
    const deco = buildMap();
    const servers = [];
    ROOMS.forEach((r, ri) => {
      [3, 10].forEach((dx, i) => {
        servers.push({ x: r.x0 + dx, y: r.y0 + 1, room: ri, svc: r.services[i], fixed: false });
      });
    });
    servers.forEach((s) => { solid[s.y][s.x] = true; });
    renderStatic(deco);
    const decoRef = deco;

    const startTile = [8, 8];
    const used = new Set();
    const key = (x, y) => x + ',' + y;
    function cellsFor(ri) {
      const r = ROOMS[ri], out = [];
      for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) {
        if (solid[y][x]) continue;
        if (DOORS.some(([dx, dy]) => Math.abs(dx - x) <= 2 && Math.abs(dy - y) <= 2)) continue;
        if (servers.some((s) => Math.abs(s.x - x) <= 1 && s.y - y >= -2 && s.y - y <= 1)) continue;
        if (Math.abs(startTile[0] - x) <= 3 && Math.abs(startTile[1] - y) <= 3) continue;
        out.push([x, y]);
      }
      return shuffle(out);
    }
    function take(cells) {
      while (cells.length) { const c = cells.pop(); if (!used.has(key(...c))) { used.add(key(...c)); return c; } }
      return [ROOMS[0].x0 + 1, ROOMS[0].y1 - 1];
    }

    const pickups = [], zaps = [], bots = [];
    const extraChipRoom = rnd(4);
    const roomCells = ROOMS.map((_, i) => cellsFor(i));
    ROOMS.forEach((r, ri) => {
      const cells = roomCells[ri];
      const nChips = 2 + (ri === extraChipRoom ? 1 : 0);
      for (let i = 0; i < nChips; i++) { const [x, y] = take(cells); pickups.push({ type: 'chip', x, y }); }
      for (let i = 0; i < 5; i++) { const [x, y] = take(cells); pickups.push({ type: 'cable', x, y, color: pick(CABLE_COLORS) }); }
      for (let i = 0; i < 3; i++) { const [x, y] = take(cells); zaps.push({ x, y, minLevel: i === 2 ? 3 : 0, phase: Math.random() * 3 }); }
      const [bx, by] = take(cells);
      bots.push(makeBot(bx, by));
    });
    function makeBot(tx, ty) {
      const horiz = Math.random() < 0.5, s = Math.random() < 0.5 ? 1 : -1;
      return { x: tx * T + 8, y: ty * T + 8, dx: horiz ? s : 0, dy: horiz ? 0 : s };
    }

    S = {
      deco: decoRef, mode: 'title', t: 0, time: GAME_SECONDS, repaired: 0, hits: 0,
      player: { x: startTile[0] * T + 8, y: startTile[1] * T + 8, dir: 'down', step: 0, moving: false, inv: 0, stun: 0 },
      servers, pickups, zaps, bots, cables: [], chips: 0, cam: { x: 0, y: 0 }, shake: 0,
      nextAmbient: 14, puzzle: null, extraBotRooms: roomCells, makeBot, take,
    };
    if (params.has('debug')) window.__s = S;
    updateInv(); updateProgress(); buildServiceList();
    $('timer').textContent = fmt(GAME_SECONDS); $('timer').classList.remove('low');
    setNews('BREAKING: The internet is reportedly "off." Experts advise turning it back on.');
    updateCam(true);
  }

  // ================= HUD =================
  function setNews(text) {
    $('newsText').textContent = text;
    const n = $('news'); n.classList.remove('flash'); void n.offsetWidth; n.classList.add('flash');
  }
  let toastTimer;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 1700);
  }
  function updateInv() {
    $('invCables').innerHTML = 'CABLES ' + (S.cables.length ? S.cables.map((c) => `<i class="cab" style="background:${c}"></i>`).join('') : '0');
    $('invChips').innerHTML = `CHIPS <i class="chip"></i> x${S.chips}`;
  }
  function updateProgress() {
    $('progText').textContent = `${S.repaired}/${S.servers.length}`;
    $('progFill').style.width = (S.repaired / S.servers.length * 100) + '%';
  }
  function buildServiceList() {
    const ul = $('svcList'); ul.innerHTML = '';
    S.servers.forEach((s, i) => {
      const li = document.createElement('li'); li.id = 'svc' + i;
      li.innerHTML = `<span class="led"></span><span>${ROOMS[s.room].name}<br>${s.svc}</span>`;
      li.style.borderColor = ROOMS[s.room].col + '66';
      ul.appendChild(li);
    });
  }

  // ================= overlay screens =================
  function showScreen(title, text, btn, cls) {
    const t = $('ovTitle'); t.textContent = title; t.className = cls || '';
    $('ovText').textContent = text; $('ovBtn').textContent = btn;
    $('overlay').hidden = false; $('ovBtn').focus();
  }
  function startPlaying() {
    $('overlay').hidden = true;
    S.mode = 'play';
    beep(660, 0.1); setTimeout(() => beep(880, 0.15), 100);
  }
  function restart() {
    closePuzzle(true);
    $('howto').hidden = true;
    newGame();
    startPlaying();
  }
  function lose() {
    S.mode = 'over'; closePuzzle(true);
    beep(160, 0.5, 'sawtooth');
    showScreen("TIME'S UP!", `The internet is STILL down.\nServices restored: ${S.repaired}/${S.servers.length}\nExperts blame "a squirrel."`, 'TRY AGAIN', 'bad');
  }
  function win() {
    S.mode = 'over'; closePuzzle(true);
    const left = Math.ceil(S.time);
    const score = Math.max(0, S.servers.length * 500 + left * 10 - S.hits * 50);
    const rank = left >= 60 ? 'CHIEF REBOOT OFFICER' : left >= 30 ? 'SENIOR SYSADMIN' : left >= 10 ? 'HELP DESK HERO' : 'BARELY PLUGGED IN';
    const best = Math.max(score, Number((() => { try { return localStorage.getItem('rr_best'); } catch (e) { return 0; } })() || 0));
    try { localStorage.setItem('rr_best', String(best)); } catch (e) {}
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.2), i * 140));
    showScreen('INTERNET RESTORED!', `All 8 services are back online.\nTime left: ${fmt(left)}   Zaps: ${S.hits}\nSCORE: ${score}   BEST: ${best}\nRANK: ${rank}\n"Hero saves nation from one loose cable."`, 'PLAY AGAIN', 'good');
  }

  // ================= player & world =================
  const keys = {};
  const pad = { up: false, down: false, left: false, right: false };
  function inputVec() {
    let x = 0, y = 0;
    if (keys.arrowleft || keys.a || pad.left) x -= 1;
    if (keys.arrowright || keys.d || pad.right) x += 1;
    if (keys.arrowup || keys.w || pad.up) y -= 1;
    if (keys.arrowdown || keys.s || pad.down) y += 1;
    return [x, y];
  }
  function levelNow() { return S.repaired; }

  function nearServer() {
    const p = S.player;
    let best = null, bd = 24;
    S.servers.forEach((s) => {
      const d = Math.hypot(p.x - (s.x * T + 8), p.y - (s.y * T + 8));
      if (d < bd) { bd = d; best = s; }
    });
    return best;
  }

  function hurt(fromX, fromY) {
    const p = S.player;
    if (p.inv > 0) return;
    S.time -= 5; S.hits++; p.inv = 1.8; p.stun = 0.35; S.shake = 0.3;
    // knockback
    let ax = p.x - fromX, ay = p.y - fromY; const m = Math.hypot(ax, ay) || 1; ax /= m; ay /= m;
    for (let i = 0; i < 12; i++) {
      if (!blockedBox(p.x + ax, p.y, 5)) p.x += ax;
      if (!blockedBox(p.x, p.y + ay, 5)) p.y += ay;
    }
    beep(90, 0.25, 'sawtooth', 0.06);
    toast('ZAP! -5 SECONDS');
    setNews(pick(HIT_NEWS));
  }

  function update(dt) {
    S.t += dt;
    if (S.shake > 0) S.shake -= dt;
    if (S.mode !== 'play' && S.mode !== 'puzzle') return;

    S.time -= dt;
    if (S.time <= 0) { S.time = 0; $('timer').textContent = '0:00'; lose(); return; }
    $('timer').textContent = fmt(S.time);
    $('timer').classList.toggle('low', S.time <= 30);

    S.nextAmbient -= dt;
    if (S.nextAmbient <= 0) { S.nextAmbient = 16 + Math.random() * 8; setNews(pick(AMBIENT_NEWS)); }

    const lvl = levelNow();
    const p = S.player;
    if (p.inv > 0) p.inv -= dt;
    if (p.stun > 0) p.stun -= dt;

    // bots (always animate)
    const botSpeed = 26 + lvl * 5;
    S.bots.forEach((b) => {
      let nx = b.x + b.dx * botSpeed * dt, ny = b.y + b.dy * botSpeed * dt;
      if (blockedBox(nx, ny, 4)) {
        const dirs = shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]).filter(([x, y]) => !(x === b.dx && y === b.dy));
        [b.dx, b.dy] = dirs[0];
      } else { b.x = nx; b.y = ny; }
    });

    if (S.mode === 'play') {
      // movement
      const [ix, iy] = inputVec();
      p.moving = (ix || iy) && p.stun <= 0;
      if (p.moving) {
        const m = Math.hypot(ix, iy), sp = 72;
        const vx = ix / m * sp * dt, vy = iy / m * sp * dt;
        if (!blockedBox(p.x + vx, p.y, 5)) p.x += vx;
        if (!blockedBox(p.x, p.y + vy, 5)) p.y += vy;
        p.dir = Math.abs(ix) > Math.abs(iy) ? (ix < 0 ? 'left' : 'right') : (iy < 0 ? 'up' : 'down');
        if (ix && !iy) p.dir = ix < 0 ? 'left' : 'right';
        p.step += dt * 9;
      }

      // pickups
      for (let i = S.pickups.length - 1; i >= 0; i--) {
        const k = S.pickups[i];
        if (Math.hypot(p.x - (k.x * T + 8), p.y - (k.y * T + 8)) < 10) {
          S.pickups.splice(i, 1);
          if (k.type === 'cable') { S.cables.push(k.color); toast('GOT A CABLE'); beep(880, 0.06); }
          else { S.chips++; toast('GOT A REPLACEMENT CHIP'); beep(1175, 0.08); }
          updateInv();
        }
      }

      // hazards
      const per = Math.max(1.6, 3.0 - lvl * 0.25);
      const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
      S.zaps.forEach((z) => {
        z.on = lvl >= z.minLevel && ((S.t + z.phase) % per) < 0.9;
        if (z.on && z.x === tx && z.y === ty) hurt(z.x * T + 8, z.y * T + 8);
      });
      S.bots.forEach((b) => { if (Math.hypot(p.x - b.x, p.y - b.y) < 9) hurt(b.x, b.y); });
    } else {
      const per = Math.max(1.6, 3.0 - levelNow() * 0.25);
      S.zaps.forEach((z) => { z.on = levelNow() >= z.minLevel && ((S.t + z.phase) % per) < 0.9; });
    }
    updateCam(false);
  }

  function updateCam(snap) {
    const p = S.player;
    const tx = clamp(p.x - VW / 2, 0, MW * T - VW), ty = clamp(p.y - VH / 2, 0, MH * T - VH);
    S.cam.x = snap ? tx : S.cam.x + (tx - S.cam.x) * 0.2;
    S.cam.y = snap ? ty : S.cam.y + (ty - S.cam.y) * 0.2;
  }

  // ================= interaction & puzzle =================
  function tryInteract() {
    if (S.mode !== 'play') return;
    const s = nearServer();
    if (!s) return;
    if (s.fixed) { toast('ALREADY ONLINE'); return; }
    if (S.cables.length < NEED_CABLES || S.chips < NEED_CHIPS) {
      toast(`NEED ${NEED_CHIPS} CHIP + ${NEED_CABLES} CABLES (HAVE ${S.chips}/${S.cables.length})`);
      beep(120, 0.15); return;
    }
    openPuzzle(s);
  }

  const PLUGS = () => $('pzPlugs'), PORTS = () => $('pzPorts');
  function openPuzzle(server) {
    const n = Math.min(5, 3 + Math.floor(levelNow() / 3));
    const colors = shuffle(CABLE_COLORS).slice(0, n);
    const ids = colors.map((c, i) => ({ c, sym: SYMBOLS[CABLE_COLORS.indexOf(c)] }));
    S.puzzle = { server, n, done: 0, sel: null };
    S.mode = 'puzzle';
    $('pzTitle').textContent = `${ROOMS[server.room].name}: ${server.svc.toUpperCase()}`;
    $('pzInfo').textContent = 'WRONG PORT = -2s';
    $('pzLines').innerHTML = '';
    const mk = (side, item) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pz-item ' + side; b.textContent = item.sym; b.dataset.color = item.c; b.dataset.side = side;
      if (side === 'plug') b.style.background = item.c; else b.style.borderColor = item.c;
      if (side === 'port') b.style.color = item.c;
      b.setAttribute('aria-label', `${side} ${item.sym}`);
      b.addEventListener('click', () => pzClick(b));
      return b;
    };
    PLUGS().innerHTML = ''; PORTS().innerHTML = '';
    shuffle(ids).forEach((it) => PLUGS().appendChild(mk('plug', it)));
    shuffle(ids).forEach((it) => PORTS().appendChild(mk('port', it)));
    $('puzzle').hidden = false;
    beep(500, 0.08);
  }
  function closePuzzle(silent) {
    $('puzzle').hidden = true;
    if (S && S.mode === 'puzzle') S.mode = 'play';
    if (S) S.puzzle = null;
  }
  function pzClick(el) {
    const pz = S.puzzle; if (!pz || el.classList.contains('done')) return;
    const side = el.dataset.side;
    if (!pz.sel || pz.sel.dataset.side === side) {
      if (pz.sel) pz.sel.classList.remove('sel');
      pz.sel = el; el.classList.add('sel'); beep(700, 0.04); return;
    }
    const a = pz.sel, b = el;
    a.classList.remove('sel'); pz.sel = null;
    if (a.dataset.color === b.dataset.color) {
      a.classList.add('done'); b.classList.add('done');
      drawLine(a.dataset.side === 'plug' ? a : b, a.dataset.side === 'plug' ? b : a, a.dataset.color);
      pz.done++; beep(990, 0.07);
      if (pz.done === pz.n) setTimeout(() => finishPuzzle(), 350);
    } else {
      [a, b].forEach((x) => { x.classList.remove('bad'); void x.offsetWidth; x.classList.add('bad'); });
      S.time -= 2; beep(110, 0.15, 'sawtooth');
      $('pzInfo').textContent = 'WRONG! -2s';
    }
  }
  function drawLine(plug, port, color) {
    const board = $('pzBoard').getBoundingClientRect();
    const a = plug.getBoundingClientRect(), b = port.getBoundingClientRect();
    const svg = $('pzLines');
    svg.setAttribute('viewBox', `0 0 ${board.width} ${board.height}`);
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', a.right - board.left); l.setAttribute('y1', a.top + a.height / 2 - board.top);
    l.setAttribute('x2', b.left - board.left); l.setAttribute('y2', b.top + b.height / 2 - board.top);
    l.setAttribute('stroke', color); l.setAttribute('stroke-width', '6'); l.setAttribute('stroke-linecap', 'square');
    svg.appendChild(l);
  }
  function finishPuzzle() {
    if (!S.puzzle) return;
    const s = S.puzzle.server;
    S.cables.splice(0, NEED_CABLES); S.chips -= NEED_CHIPS;
    s.fixed = true; S.repaired++;
    updateInv(); updateProgress();
    const li = $('svc' + S.servers.indexOf(s)); if (li) li.classList.add('up');
    setNews(RESTORE_NEWS[s.svc]);
    toast('SERVER ONLINE!');
    [660, 880, 1100].forEach((f, i) => setTimeout(() => beep(f, 0.12), i * 90));
    closePuzzle();
    if (S.repaired === 3 || S.repaired === 6) {
      const ri = rnd(4), c = S.extraBotRooms[ri];
      if (c && c.length) { const [x, y] = c.pop(); S.bots.push(S.makeBot(x, y)); setNews('WARNING: Another spark bot has joined the party. It brought no snacks.'); }
    }
    if (S.repaired >= S.servers.length) win();
  }

  // ================= rendering =================
  const PAL = { h: '#ffd23f', s: '#f2b98a', b: '#2d6cff', o: '#ff7a1a', k: '#10143a', w: '#fff' };
  function spr(rows, x, y) {
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < 8; i++) {
      const c = rows[j][i]; if (c === '.') continue;
      ctx.fillStyle = PAL[c]; ctx.fillRect(x + i * 2, y + j * 2, 2, 2);
    }
  }
  function drawPlayer() {
    const p = S.player;
    if (p.inv > 0 && Math.floor(S.t * 14) % 2 === 0) return;
    const face = p.dir === 'up' ? '..ssss..' : p.dir === 'left' ? '..ksss..' : p.dir === 'right' ? '..sssk..' : '..sksk..';
    const legs = p.moving && Math.floor(p.step) % 2 ? '.k....k.' : '..k..k..';
    const rows = ['..hhhh..', '.hhhhhh.', '..ssss..', face, '.oobboo.', '.sobbos.', '..bbbb..', legs];
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(Math.round(p.x) - 6, Math.round(p.y) + 5, 12, 3);
    spr(rows, Math.round(p.x) - 8, Math.round(p.y) - 11 + (p.moving && Math.floor(p.step) % 2 ? -1 : 0));
  }
  function drawServer(s) {
    const x = s.x * T, y = s.y * T;
    const blink = Math.floor(S.t * 3) % 2 === 0;
    const col = s.fixed ? '#2dff6b' : '#ff2d3d';
    ctx.globalAlpha = 0.14 + 0.06 * Math.sin(S.t * 4);
    ctx.fillStyle = col; ctx.fillRect(x - 3, y - 3, 22, 22); ctx.globalAlpha = 1;
    ctx.fillStyle = '#17236b'; ctx.fillRect(x + 1, y, 14, 16);
    ctx.fillStyle = '#4a63d8'; ctx.fillRect(x + 1, y, 14, 1); ctx.fillRect(x + 1, y, 1, 16); ctx.fillRect(x + 14, y, 1, 16);
    ctx.fillStyle = '#050a26';
    for (let i = 0; i < 3; i++) ctx.fillRect(x + 3, y + 5 + i * 3.5, 8, 2);
    ctx.fillStyle = s.fixed ? '#2dff6b' : (blink ? '#ff2d3d' : '#7a0f1a');
    ctx.fillRect(x + 11, y + 1, 3, 3);
    if (!s.fixed) {
      ctx.fillStyle = '#ffd23f';
      if (Math.floor(S.t * 8) % 3 === 0) ctx.fillRect(x + 2 + rnd(10), y + 4 + rnd(8), 2, 1);
      ctx.fillStyle = 'rgba(160,170,200,.5)';
      const sm = (S.t * 12) % 10; ctx.fillRect(x + 6, y - 2 - sm, 2, 2);
    } else {
      ctx.fillStyle = '#7dffa8'; ctx.fillRect(x + 4, y + 6 + (Math.floor(S.t * 4) % 3) * 3.5, 2, 1);
    }
  }
  function drawZap(z) {
    const x = z.x * T, y = z.y * T;
    const lvl = levelNow();
    if (lvl < z.minLevel) return;
    const per = Math.max(1.6, 3.0 - lvl * 0.25);
    const ph = (S.t + z.phase) % per;
    ctx.fillStyle = '#071033'; ctx.fillRect(x + 2, y + 2, 12, 12);
    ctx.strokeStyle = '#26398a'; ctx.lineWidth = 1; ctx.strokeRect(x + 2.5, y + 2.5, 11, 11);
    if (z.on) {
      ctx.globalAlpha = 0.35; ctx.fillStyle = '#7ff'; ctx.fillRect(x - 1, y - 1, 18, 18); ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 8, y + 1, 3, 4); ctx.fillRect(x + 5, y + 5, 5, 3); ctx.fillRect(x + 6, y + 8, 4, 3); ctx.fillRect(x + 4, y + 11, 3, 4);
      ctx.fillStyle = '#35e0ff'; ctx.fillRect(x + 7, y + 3, 1, 10);
    } else if (ph > per - 0.55 && Math.floor(S.t * 10) % 2 === 0) {
      ctx.strokeStyle = '#ffd23f'; ctx.strokeRect(x + 2.5, y + 2.5, 11, 11);
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(x + 7, y + 5, 2, 4); ctx.fillRect(x + 7, y + 10, 2, 2);
    }
  }
  function drawBot(b) {
    const x = Math.round(b.x), y = Math.round(b.y), j = Math.floor(S.t * 20) % 3;
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x - 5, y + 5, 10, 2);
    ctx.fillStyle = '#ffb000'; ctx.fillRect(x - 4, y - 5, 8, 10); ctx.fillRect(x - 5, y - 4, 10, 8);
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 2, y - 2, 4, 4);
    ctx.fillStyle = '#ff2d3d'; ctx.fillRect(x - 1, y - 1, 2, 2);
    ctx.fillStyle = '#7ff';
    ctx.fillRect(x - 7 + j * 2, y - 6 + j, 2, 1); ctx.fillRect(x + 5 - j, y + 4 - j, 2, 1); ctx.fillRect(x + 4, y - 7 + j, 1, 2);
  }
  function drawPickup(k) {
    const x = k.x * T, y = k.y * T + Math.round(Math.sin(S.t * 4 + k.x) * 1.2);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 3, y + 13, 10, 2);
    if (k.type === 'cable') {
      ctx.fillStyle = '#000'; ctx.fillRect(x + 2, y + 3, 12, 10);
      ctx.fillStyle = k.color; ctx.fillRect(x + 3, y + 4, 10, 8);
      ctx.fillStyle = '#000'; ctx.fillRect(x + 5, y + 6, 6, 4);
      ctx.fillStyle = k.color; ctx.fillRect(x + 6, y + 7, 4, 2);
    } else {
      ctx.fillStyle = '#0a5'; ctx.fillRect(x + 2, y + 4, 12, 9);
      ctx.fillStyle = '#2dff6b'; ctx.fillRect(x + 3, y + 5, 10, 7);
      ctx.fillStyle = '#000'; ctx.fillRect(x + 5, y + 7, 6, 3);
      ctx.fillStyle = '#ccc';
      for (let i = 0; i < 4; i++) { ctx.fillRect(x + 3 + i * 3, y + 3, 1, 2); ctx.fillRect(x + 3 + i * 3, y + 12, 1, 2); }
    }
    // sparkle
    if (Math.floor(S.t * 3 + k.x) % 4 === 0) { ctx.fillStyle = '#fff'; ctx.fillRect(x + 12, y + 2, 2, 2); }
  }

  function render() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    let cx = Math.round(S.cam.x), cy = Math.round(S.cam.y);
    if (S.shake > 0) { cx += rnd(5) - 2; cy += rnd(5) - 2; }
    ctx.save(); ctx.translate(-cx, -cy);
    ctx.drawImage(mapCanvas, 0, 0);
    // monitor glow
    ROOMS.forEach((r) => {
      ctx.globalAlpha = 0.1 + 0.05 * Math.sin(S.t * 3 + r.x0);
      ctx.fillStyle = '#35e0ff'; ctx.fillRect((r.x0 + 6) * T - 2, (r.y0 + 1) * T - 2, T * 2 + 4, T + 8); ctx.globalAlpha = 1;
    });
    S.zaps.forEach(drawZap);
    S.pickups.forEach(drawPickup);
    S.servers.forEach(drawServer);
    // y-sorted-ish: bots then player
    S.bots.forEach(drawBot);
    drawPlayer();
    if (S.mode === 'play') {
      const s = nearServer();
      if (s && !s.fixed) {
        const label = isTouch ? '[A] FIX' : '[E] FIX';
        ctx.font = '6px "Press Start 2P", monospace'; ctx.textBaseline = 'middle';
        const w = ctx.measureText(label).width + 6, bx = s.x * T + 8 - w / 2, by = s.y * T + 22;
        ctx.fillStyle = '#000c'; ctx.fillRect(bx, by, w, 11);
        ctx.fillStyle = '#ffd23f'; ctx.fillText(label, bx + 3, by + 6);
      }
    }
    ctx.restore();
  }

  // ================= input wiring =================
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (e.repeat) { keys[k] = true; return; }
    keys[k] = true;
    if (k === 'e' || k === ' ' || k === 'enter') {
      if (S.mode === 'play') tryInteract();
    }
    if (k === 'escape' && S.mode === 'puzzle') closePuzzle();
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { Object.keys(keys).forEach((k) => { keys[k] = false; }); Object.keys(pad).forEach((k) => { pad[k] = false; }); });

  document.querySelectorAll('.d').forEach((btn) => {
    const dir = btn.dataset.dir;
    const on = (e) => { e.preventDefault(); pad[dir] = true; btn.classList.add('on'); try { btn.setPointerCapture(e.pointerId); } catch (_) {} };
    const off = (e) => { e.preventDefault(); pad[dir] = false; btn.classList.remove('on'); };
    btn.addEventListener('pointerdown', on);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => btn.addEventListener(ev, off));
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });
  $('actBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); tryInteract(); });
  $('actBtn').addEventListener('contextmenu', (e) => e.preventDefault());
  $('pzCancel').addEventListener('click', () => closePuzzle());
  $('restartBtn').addEventListener('click', restart);
  $('ovBtn').addEventListener('click', restart);
  // desktop users can also click "A"-style by tapping the canvas near a server
  cv.addEventListener('pointerdown', () => { if (S.mode === 'play' && nearServer()) tryInteract(); });

  // ================= boot =================
  newGame();
  if (document.fonts && document.fonts.load) document.fonts.load('6px "Press Start 2P"').then(() => { if (S && S.deco) renderStatic(S.deco); });
  // Instructions page: shown before the game starts, and reopenable (pauses the game) with the ? button.
  function openHowto(fromGame) {
    if (fromGame && (S.mode === 'play' || S.mode === 'puzzle')) { S.pausedFrom = S.mode; S.mode = 'paused'; }
    $('hwBtn').textContent = S.mode === 'title' ? 'START GAME' : 'BACK TO GAME';
    $('howto').hidden = false; $('howto').scrollTop = 0; $('hwBtn').focus();
  }
  function closeHowto() {
    $('howto').hidden = true;
    if (S.mode === 'title') startPlaying();
    else if (S.mode === 'paused') { S.mode = S.pausedFrom || 'play'; }
  }
  $('hwBtn').addEventListener('click', closeHowto);
  $('helpBtn').addEventListener('click', () => { if (S.mode === 'over') return; openHowto(true); });
  openHowto(false);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
