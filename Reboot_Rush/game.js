(() => {
  'use strict';

  // ================= constants =================
  const T = 16, VW = 320, VH = 240, MW = 28, MH = 19;
  const GAME_SECONDS = 180, LEVEL_BONUS = 25;
  const NEED_CABLES = 2, NEED_CHIPS = 1;
  const CABLE_COLORS = ['#ff9f1c', '#35e0ff', '#ff6bd6', '#ffe14a', '#a78bff'];
  const SYMBOLS = ['▲', '●', '■', '◆', '★'];

  const LEVELS = [
    {
      id: 'mail', name: 'OUTLOOK MAIL', col: '#ff6bd6',
      services: ['Outlook Inbox', 'Calendar Invites'],
      puzzle: 3, people: 2, speed: 22, zaps: 3,
      news: 'BREAKING: Outlook is down. Millions of workers forced to talk to each other in person.',
      lines: ['MY EMAIL!!', "WHERE'S MY INBOX?!", 'REPLY ALL!!!', 'I HAD 4,000 UNREADS!'],
    },
    {
      id: 'bank', name: 'BANKING WEBSITES', col: '#ffd23f',
      services: ['ATM Network', 'Mobile Banking', 'Card Payments'],
      puzzle: 4, people: 3, speed: 28, zaps: 4,
      news: 'BREAKING: Banking websites offline. Nation checks couch cushions for loose change.',
      lines: ['MY MONEY!!', "WHERE'S MY BALANCE?!", 'DECLINED AGAIN?!', 'I NEED A HOT DOG!'],
    },
    {
      id: 'faa', name: 'FAA NETWORK', col: '#35e0ff',
      services: ['Air Traffic Control', 'Flight Tracking', 'Runway Lights', 'Radar Uplink'],
      puzzle: 5, people: 4, speed: 34, zaps: 5,
      news: 'BREAKING: FAA network down. Planes politely asked to circle until further notice.',
      lines: ['MY FLIGHT!!', "WE'RE LATE!!", "WHERE'S MY LUGGAGE?!", 'I MISSED MY WEDDING!'],
    },
  ];
  const TOTAL_SERVICES = LEVELS.reduce((n, l) => n + l.services.length, 0);

  const RESTORE_NEWS = {
    'Outlook Inbox': 'INBOX RESTORED: 4,000 unread emails flood back. Nation weeps softly.',
    'Calendar Invites': 'CALENDAR BACK: Meeting that could have been an email resumes at 9 AM.',
    'ATM Network': "ATMS ONLINE: Nation's wallets resume being empty, but now digitally.",
    'Mobile Banking': 'BANKING APP BACK: Balance check reveals "treat yourself" was a mistake.',
    'Card Payments': 'CARD PAYMENTS BACK: Man at gas station finally allowed to buy a single hot dog.',
    'Air Traffic Control': 'AIR TRAFFIC RESTORED: Planes agree to stop circling Omaha like confused pigeons.',
    'Flight Tracking': 'FLIGHT TRACKER BACK: Man learns Gate B12 never existed. Gate B12 declines comment.',
    'Runway Lights': 'RUNWAY LIGHTS ON: Pilots relieved. Landing by vibes was not working.',
    'Radar Uplink': 'RADAR BACK: Mysterious blip identified as one very large goose.',
  };
  const ANGRY_NEWS = [
    'ANGRY CUSTOMER confronts IT worker: "I WAS ON HOLD FOR 3 HOURS." IT worker was not the hold music.',
    'FURIOUS CROWD demands answers. Technician offers "have you tried turning it off and on?"',
    'LOCAL MAN yells at server room. Server room unmoved.',
    'MOB OF ANGRY USERS grows. Experts say they only want their stuff back.',
  ];
  const ZAP_NEWS = [
    'TECH ZAPPED: "Felt like a very aggressive handshake," says witness.',
    "EXPERTS CONFIRM: Electricity is, in fact, still dangerous.",
    "OUCH: Technician's hair now achieves new heights. Stylists impressed.",
  ];
  const AMBIENT_NEWS = [
    'IT DEPT replies "have you tried turning it off and on again?" to literally everything.',
    'AREA MAN refreshes page 400 times, expects different result.',
    'OFFICIALS blame "the cloud." Cloud denies everything.',
    'LOCAL GOAT eats router cable. Not related. Goat is fine.',
    'NATION discovers it can still talk to neighbors. Awkward.',
    'WORLD without email reports 100% fewer "per my last message."',
  ];

  // ================= dom / utils =================
  const $ = (id) => document.getElementById(id);
  const cv = $('screen'), ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (isTouch) document.body.classList.add('touch');
  const params = new URLSearchParams(location.search);
  if (params.has('embed')) document.body.classList.add('embed');

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

  // ================= realistic item sprites (16x16) =================
  const spriteCache = {};
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => clamp(Math.round(v * f), 0, 255);
    return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
  }
  // Coiled Ethernet patch cable with an RJ45 connector.
  function cableSprite(color) {
    const k = 'cab' + color;
    if (spriteCache[k]) return spriteCache[k];
    const c = document.createElement('canvas'); c.width = c.height = 16;
    const g = c.getContext('2d');
    const cx = 6.5, cy = 8;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy);
      let col = null;
      if (d >= 6.0 && d < 6.9) col = '#0a0a14';
      else if (d >= 4.7 && d < 6.0) col = (dx + dy < -2.5) ? shade(color, 1.35) : (dx + dy > 3) ? shade(color, 0.7) : color;
      else if (d >= 4.1 && d < 4.7) col = shade(color, 0.45);
      else if (d >= 2.9 && d < 4.1) col = (dx + dy < -2) ? shade(color, 1.3) : (dx + dy > 2.5) ? shade(color, 0.65) : color;
      else if (d >= 2.0 && d < 2.9) col = '#0a0a14';
      if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
    }
    // RJ45 plug
    g.fillStyle = '#0a0a14'; g.fillRect(12, 5, 4, 7);
    g.fillStyle = '#dfe3ea'; g.fillRect(13, 6, 2, 4);
    g.fillStyle = '#9aa1ad'; g.fillRect(13, 9, 2, 1);
    g.fillStyle = '#f5c542'; g.fillRect(13, 10, 1, 1); g.fillRect(15, 10, 1, 1);
    g.fillStyle = color; g.fillRect(12, 6, 1, 4);
    return (spriteCache[k] = c);
  }
  // RAM memory module: green PCB, black chips, gold contacts.
  function chipSprite() {
    if (spriteCache.chip) return spriteCache.chip;
    const c = document.createElement('canvas'); c.width = c.height = 16;
    const g = c.getContext('2d');
    g.fillStyle = '#0a0a14'; g.fillRect(0, 3, 16, 11);
    g.fillStyle = '#13a044'; g.fillRect(1, 4, 14, 7);
    g.fillStyle = '#35d86e'; g.fillRect(1, 4, 14, 1);
    g.fillStyle = '#1b1b26';
    for (let i = 0; i < 3; i++) { g.fillRect(2 + i * 4, 5, 3, 4); g.fillStyle = '#585872'; g.fillRect(2 + i * 4, 5, 1, 1); g.fillStyle = '#1b1b26'; }
    g.fillStyle = '#dfe3ea'; g.fillRect(2, 10, 4, 1);
    g.fillStyle = '#f5c542';
    for (let x = 1; x < 15; x++) if (x !== 7 && x !== 8) g.fillRect(x, 11, 1, 2);
    g.fillStyle = '#0a0a14'; g.fillRect(7, 11, 2, 3);
    return (spriteCache.chip = c);
  }
  function iconURL(type, color) {
    const c = type === 'chip' ? chipSprite() : cableSprite(color);
    return c.toDataURL();
  }
  document.querySelectorAll('[data-icon]').forEach((el) => { el.src = iconURL(el.dataset.icon, el.dataset.color); });

  // ================= state / map =================
  let S = null, wall, solid, mapCanvas;

  const isSolid = (tx, ty) => (tx < 0 || ty < 0 || tx >= MW || ty >= MH) ? true : solid[ty][tx];
  function blockedBox(cx, cy, h) {
    return isSolid(Math.floor((cx - h) / T), Math.floor((cy - h) / T)) ||
           isSolid(Math.floor((cx + h) / T), Math.floor((cy - h) / T)) ||
           isSolid(Math.floor((cx - h) / T), Math.floor((cy + h) / T)) ||
           isSolid(Math.floor((cx + h) / T), Math.floor((cy + h) / T));
  }

  function renderStatic(deco, lv) {
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
        g.fillStyle = (x + y) % 2 ? '#0b1540' : '#0d1a4a';
        g.fillRect(px, py, T, T);
        g.fillStyle = '#08103a'; g.fillRect(px + 15, py, 1, T); g.fillRect(px, py + 15, T, 1);
        if (hash(x, y) % 7 === 0) { g.fillStyle = '#16307f'; g.fillRect(px + 5, py + 6, 2, 2); }
      }
    }
    g.globalAlpha = 0.07; g.fillStyle = lv.col; g.fillRect(T, T, (MW - 2) * T, (MH - 2) * T); g.globalAlpha = 1;
    g.font = '6px "Press Start 2P", monospace'; g.textBaseline = 'middle';
    g.fillStyle = '#000'; g.fillText(lv.name, 2 * T + 1, 9); g.fillStyle = lv.col; g.fillText(lv.name, 2 * T, 8);
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

  // ================= game / level setup =================
  const START_TILE = [14, 16];

  function newGame() {
    S = {
      mode: 'title', t: 0, time: GAME_SECONDS, hits: 0, total: 0, levelIdx: 0,
      player: { x: 0, y: 0, dir: 'up', step: 0, moving: false, inv: 0, stun: 0 },
      cam: { x: 0, y: 0 }, shake: 0, nextAmbient: 14, puzzle: null,
      cables: [], chips: 0, rep: 0, servers: [], pickups: [], zaps: [], people: [], deco: [],
    };
    if (params.has('debug')) window.__s = S;
    buildServiceList();
    loadLevel(0);
    $('timer').textContent = fmt(S.time); $('timer').classList.remove('low');
  }

  function loadLevel(idx) {
    const lv = LEVELS[idx];
    S.levelIdx = idx; S.rep = 0; S.cables = []; S.chips = 0; S.puzzle = null;

    wall = Array.from({ length: MH }, () => Array(MW).fill(false));
    for (let x = 0; x < MW; x++) { wall[0][x] = true; wall[MH - 1][x] = true; }
    for (let y = 0; y < MH; y++) { wall[y][0] = true; wall[y][MW - 1] = true; }
    solid = wall.map((r) => r.slice());

    const deco = [];
    // rows of server racks with two gaps each, so the room is a winding maze
    [5, 9, 13].forEach((y) => {
      const g1 = 2 + rnd(9), g2 = 15 + rnd(MW - 20);
      for (let x = 2; x <= MW - 3; x++) {
        if ((x >= g1 && x < g1 + 3) || (x >= g2 && x < g2 + 3)) continue;
        deco.push({ type: 'rack', x, y });
      }
    });
    deco.push({ type: 'desk', x: 2, y: 1 }, { type: 'desk', x: 3, y: 1 }, { type: 'desk', x: MW - 4, y: 1 }, { type: 'desk', x: MW - 3, y: 1 });
    const n = lv.services.length;
    const servers = lv.services.map((svc, i) => ({ x: Math.floor(MW * (i + 1) / (n + 1)), y: 1, svc, fixed: false }));
    deco.forEach((d) => { solid[d.y][d.x] = true; });
    servers.forEach((s) => { solid[s.y][s.x] = true; });
    renderStatic(deco, lv);

    const cells = [];
    for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
      if (solid[y][x]) continue;
      if (servers.some((s) => Math.abs(s.x - x) <= 1 && y <= 3)) continue;
      if (Math.abs(START_TILE[0] - x) <= 3 && Math.abs(START_TILE[1] - y) <= 2) continue;
      cells.push([x, y]);
    }
    const free = shuffle(cells);
    const take = () => free.pop();

    const pickups = [];
    for (let i = 0; i < n + 1; i++) { const [x, y] = take(); pickups.push({ type: 'chip', x, y }); }
    for (let i = 0; i < 2 * n + 2; i++) { const [x, y] = take(); pickups.push({ type: 'cable', x, y, color: pick(CABLE_COLORS) }); }
    const zaps = [];
    for (let i = 0; i < lv.zaps; i++) { const [x, y] = take(); zaps.push({ x, y, minRep: i === lv.zaps - 1 ? 1 : 0, phase: Math.random() * 3 }); }
    const people = [];
    const far = free.filter(([x, y]) => Math.hypot(x - START_TILE[0], y - START_TILE[1]) > 8);
    shuffle(far).slice(0, lv.people).forEach(([x, y]) => {
      const horiz = Math.random() < 0.5, s = Math.random() < 0.5 ? 1 : -1;
      people.push({ x: x * T + 8, y: y * T + 8, dx: horiz ? s : 0, dy: horiz ? 0 : s, step: Math.random() * 5, say: '', sayT: 0,
        hair: pick(['#3b2314', '#111', '#b0b0b8', '#c8641e', '#e8c34a']), shirt: pick(['#2d6cff', '#3aa655', '#8a4fd8', '#d8d8e8', '#e05a9a']) });
    });

    Object.assign(S, { servers, pickups, zaps, people, deco });
    const p = S.player;
    p.x = START_TILE[0] * T + 8; p.y = START_TILE[1] * T + 8; p.dir = 'up'; p.inv = 0; p.stun = 0; p.moving = false;
    updateInv(); updateProgress(); refreshServiceList();
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
    const cabs = S.cables.slice(0, 6).map((c) => `<img class="ico" alt="cable" src="${iconURL('cable', c)}">`).join('');
    $('invCables').innerHTML = 'CABLES ' + (S.cables.length ? `<span class="cab-stack">${cabs}</span>${S.cables.length > 6 ? '+' + (S.cables.length - 6) : ''}` : '0');
    $('invChips').innerHTML = `RAM <img class="ico" alt="memory chip" src="${iconURL('chip')}"> x${S.chips}`;
  }
  function updateProgress() {
    $('progText').textContent = `${S.total}/${TOTAL_SERVICES}`;
    $('progFill').style.width = (S.total / TOTAL_SERVICES * 100) + '%';
    $('lvlText').textContent = `LEVEL ${S.levelIdx + 1}/3: ${LEVELS[S.levelIdx].name}`;
  }
  function buildServiceList() {
    const ul = $('svcList'); ul.innerHTML = '';
    LEVELS.forEach((lv, li) => lv.services.forEach((svc) => {
      const el = document.createElement('li'); el.dataset.svc = svc; el.dataset.lv = li;
      el.innerHTML = `<span class="led"></span><span>${lv.name}<br>${svc}</span>`;
      el.style.borderColor = lv.col + '66';
      ul.appendChild(el);
    }));
  }
  function refreshServiceList() {
    document.querySelectorAll('#svcList li').forEach((li) => {
      const done = Number(li.dataset.lv) < S.levelIdx || (Number(li.dataset.lv) === S.levelIdx && S.servers.some((s) => s.svc === li.dataset.svc && s.fixed));
      li.classList.toggle('up', done);
      li.classList.toggle('cur', Number(li.dataset.lv) === S.levelIdx);
    });
  }

  // ================= overlay cards =================
  function showScreen(title, text, btn, cls, onClick) {
    const t = $('ovTitle'); t.textContent = title; t.className = cls || '';
    $('ovText').textContent = text; $('ovBtn').textContent = btn; $('ovBtn').onclick = onClick;
    $('overlay').hidden = false; $('ovBtn').focus();
  }
  function showIntro() {
    const lv = LEVELS[S.levelIdx];
    S.mode = 'card';
    setNews(lv.news);
    showScreen(`LEVEL ${S.levelIdx + 1}: ${lv.name}`,
      `${lv.news.replace('BREAKING: ', '')}\n\nFix all ${lv.services.length} servers to restore:\n${lv.services.join(', ')}.\nWatch out: ${lv.people} angry people in this room!`,
      'START LEVEL', '', () => { $('overlay').hidden = true; S.mode = 'play'; beep(660, 0.1); setTimeout(() => beep(880, 0.15), 100); });
  }
  function restart() {
    closePuzzle(true);
    $('howto').hidden = true; $('overlay').hidden = true;
    newGame();
    showIntro();
  }
  function lose() {
    S.mode = 'over'; closePuzzle(true);
    beep(160, 0.5, 'sawtooth');
    showScreen("TIME'S UP!", `The internet is STILL down.\nYou reached level ${S.levelIdx + 1} (${LEVELS[S.levelIdx].name}).\nServices restored: ${S.total}/${TOTAL_SERVICES}\nExperts blame "a squirrel."`, 'TRY AGAIN', 'bad', restart);
  }
  function levelClear() {
    const lv = LEVELS[S.levelIdx];
    if (S.levelIdx >= LEVELS.length - 1) { win(); return; }
    S.mode = 'card'; S.time += LEVEL_BONUS;
    [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 0.15), i * 110));
    const next = LEVELS[S.levelIdx + 1];
    showScreen(`LEVEL ${S.levelIdx + 1} CLEARED!`,
      `${lv.name} is back online!\n+${LEVEL_BONUS} seconds bonus.\n\nNext outage: ${next.name}`, 'NEXT LEVEL', 'good',
      () => { $('overlay').hidden = true; loadLevel(S.levelIdx + 1); showIntro(); });
  }
  function win() {
    S.mode = 'over'; closePuzzle(true);
    const left = Math.ceil(S.time);
    const score = Math.max(0, TOTAL_SERVICES * 500 + left * 10 - S.hits * 50);
    const rank = left >= 60 ? 'CHIEF REBOOT OFFICER' : left >= 30 ? 'SENIOR SYSADMIN' : left >= 10 ? 'HELP DESK HERO' : 'BARELY PLUGGED IN';
    let best = score;
    try { best = Math.max(score, Number(localStorage.getItem('rr_best') || 0)); localStorage.setItem('rr_best', String(best)); } catch (e) {}
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.2), i * 140));
    showScreen('INTERNET RESTORED!', `All 3 outages fixed. Mail, banks and planes are back!\nTime left: ${fmt(left)}   Hits: ${S.hits}\nSCORE: ${score}   BEST: ${best}\nRANK: ${rank}\n"Hero saves nation from one loose cable."`, 'PLAY AGAIN', 'good', restart);
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
  function nearServer() {
    const p = S.player; let best = null, bd = 24;
    S.servers.forEach((s) => {
      const d = Math.hypot(p.x - (s.x * T + 8), p.y - (s.y * T + 8));
      if (d < bd) { bd = d; best = s; }
    });
    return best;
  }
  const zapPeriod = () => Math.max(1.4, 3.0 - 0.18 * (S.levelIdx * 2 + S.rep));

  function hurt(fromX, fromY, person) {
    const p = S.player;
    if (p.inv > 0) return;
    S.time -= 5; S.hits++; p.inv = 1.8; p.stun = 0.35; S.shake = 0.3;
    let ax = p.x - fromX, ay = p.y - fromY; const m = Math.hypot(ax, ay) || 1; ax /= m; ay /= m;
    for (let i = 0; i < 12; i++) {
      if (!blockedBox(p.x + ax, p.y, 5)) p.x += ax;
      if (!blockedBox(p.x, p.y + ay, 5)) p.y += ay;
    }
    beep(90, 0.25, 'sawtooth', 0.06);
    toast(person ? 'ANGRY PERSON! -5 SECONDS' : 'ZAP! -5 SECONDS');
    if (person) { person.say = pick(LEVELS[S.levelIdx].lines); person.sayT = 1.8; setNews(pick(ANGRY_NEWS)); }
    else setNews(pick(ZAP_NEWS));
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

    const lv = LEVELS[S.levelIdx];
    const p = S.player;
    if (p.inv > 0) p.inv -= dt;
    if (p.stun > 0) p.stun -= dt;

    // angry people
    const sp = lv.speed + 3 * S.rep;
    S.people.forEach((b) => {
      b.step += dt * 8; if (b.sayT > 0) b.sayT -= dt;
      const dxp = p.x - b.x, dyp = p.y - b.y, dist = Math.hypot(dxp, dyp);
      if (S.levelIdx >= 1 && dist < 56 && S.mode === 'play' && p.inv <= 0) {
        if (Math.abs(dxp) > Math.abs(dyp)) { b.dx = Math.sign(dxp); b.dy = 0; } else { b.dx = 0; b.dy = Math.sign(dyp); }
      }
      const nx = b.x + b.dx * sp * dt, ny = b.y + b.dy * sp * dt;
      if (blockedBox(nx, ny, 4)) {
        const dirs = shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]).filter(([x, y]) => !(x === b.dx && y === b.dy));
        [b.dx, b.dy] = dirs[0];
      } else { b.x = nx; b.y = ny; }
    });

    const per = zapPeriod();
    S.zaps.forEach((z) => { z.on = S.rep >= z.minRep && ((S.t + z.phase) % per) < 0.9; });

    if (S.mode === 'play') {
      const [ix, iy] = inputVec();
      p.moving = (ix || iy) && p.stun <= 0;
      if (p.moving) {
        const m = Math.hypot(ix, iy), speed = 72;
        const vx = ix / m * speed * dt, vy = iy / m * speed * dt;
        if (!blockedBox(p.x + vx, p.y, 5)) p.x += vx;
        if (!blockedBox(p.x, p.y + vy, 5)) p.y += vy;
        p.dir = Math.abs(ix) > Math.abs(iy) ? (ix < 0 ? 'left' : 'right') : (iy < 0 ? 'up' : 'down');
        if (ix && !iy) p.dir = ix < 0 ? 'left' : 'right';
        p.step += dt * 9;
      }
      for (let i = S.pickups.length - 1; i >= 0; i--) {
        const k = S.pickups[i];
        if (Math.hypot(p.x - (k.x * T + 8), p.y - (k.y * T + 8)) < 10) {
          S.pickups.splice(i, 1);
          if (k.type === 'cable') { S.cables.push(k.color); toast('GOT A NETWORK CABLE'); beep(880, 0.06); }
          else { S.chips++; toast('GOT A RAM CHIP'); beep(1175, 0.08); }
          updateInv();
        }
      }
      const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
      S.zaps.forEach((z) => { if (z.on && z.x === tx && z.y === ty) hurt(z.x * T + 8, z.y * T + 8, null); });
      S.people.forEach((b) => { if (Math.hypot(p.x - b.x, p.y - b.y) < 9) hurt(b.x, b.y, b); });
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
      toast(`NEED ${NEED_CHIPS} RAM + ${NEED_CABLES} CABLES (HAVE ${S.chips}/${S.cables.length})`);
      beep(120, 0.15); return;
    }
    openPuzzle(s);
  }

  function openPuzzle(server) {
    const lv = LEVELS[S.levelIdx];
    const n = lv.puzzle;
    const ids = shuffle(CABLE_COLORS).slice(0, n).map((c) => ({ c, sym: SYMBOLS[CABLE_COLORS.indexOf(c)] }));
    S.puzzle = { server, n, done: 0, sel: null };
    S.mode = 'puzzle';
    $('pzTitle').textContent = `${lv.name}: ${server.svc.toUpperCase()}`;
    $('pzInfo').textContent = 'WRONG PORT = -2s';
    $('pzLines').innerHTML = '';
    const mk = (side, item) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pz-item ' + side; b.dataset.color = item.c; b.dataset.side = side;
      b.style.setProperty('--c', item.c);
      b.innerHTML = side === 'plug' ? `<span class="wire"></span><span class="head">${item.sym}</span>` : `<span class="jack">${item.sym}</span>`;
      b.setAttribute('aria-label', `${side} ${item.sym}`);
      b.addEventListener('click', () => pzClick(b));
      return b;
    };
    $('pzPlugs').innerHTML = ''; $('pzPorts').innerHTML = '';
    shuffle(ids).forEach((it) => $('pzPlugs').appendChild(mk('plug', it)));
    shuffle(ids).forEach((it) => $('pzPorts').appendChild(mk('port', it)));
    $('puzzle').hidden = false;
    beep(500, 0.08);
  }
  function closePuzzle() {
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
      if (pz.done === pz.n) setTimeout(finishPuzzle, 350);
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
    const mkLine = (stroke, w) => {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', a.right - board.left); l.setAttribute('y1', a.top + a.height / 2 - board.top);
      l.setAttribute('x2', b.left - board.left); l.setAttribute('y2', b.top + b.height / 2 - board.top);
      l.setAttribute('stroke', stroke); l.setAttribute('stroke-width', w); l.setAttribute('stroke-linecap', 'round');
      svg.appendChild(l);
    };
    mkLine('#000', 9); mkLine(color, 5);
  }
  function finishPuzzle() {
    if (!S.puzzle) return;
    const s = S.puzzle.server;
    S.cables.splice(0, NEED_CABLES); S.chips -= NEED_CHIPS;
    s.fixed = true; S.rep++; S.total++;
    updateInv(); updateProgress(); refreshServiceList();
    setNews(RESTORE_NEWS[s.svc]);
    toast('SERVER ONLINE!');
    [660, 880, 1100].forEach((f, i) => setTimeout(() => beep(f, 0.12), i * 90));
    closePuzzle();
    if (S.rep >= S.servers.length) levelClear();
  }

  // ================= rendering =================
  function spr(rows, x, y, pal) {
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < 8; i++) {
      const c = rows[j][i]; if (c === '.') continue;
      ctx.fillStyle = pal[c]; ctx.fillRect(x + i * 2, y + j * 2, 2, 2);
    }
  }
  const PLAYER_PAL = { h: '#ffd23f', s: '#f2b98a', b: '#2d6cff', o: '#ff7a1a', k: '#10143a' };
  function drawPlayer() {
    const p = S.player;
    if (p.inv > 0 && Math.floor(S.t * 14) % 2 === 0) return;
    const face = p.dir === 'up' ? '..ssss..' : p.dir === 'left' ? '..ksss..' : p.dir === 'right' ? '..sssk..' : '..sksk..';
    const legs = p.moving && Math.floor(p.step) % 2 ? '.k....k.' : '..k..k..';
    const rows = ['..hhhh..', '.hhhhhh.', '..ssss..', face, '.oobboo.', '.sobbos.', '..bbbb..', legs];
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(Math.round(p.x) - 6, Math.round(p.y) + 5, 12, 3);
    spr(rows, Math.round(p.x) - 8, Math.round(p.y) - 11 + (p.moving && Math.floor(p.step) % 2 ? -1 : 0), PLAYER_PAL);
  }
  function drawPerson(b) {
    const x = Math.round(b.x), y = Math.round(b.y);
    const walk = Math.floor(b.step) % 2;
    const jitter = (Math.floor(S.t * 18) % 2) ? 1 : 0;
    const legs = walk ? '.p....p.' : '..p..p..';
    const arms = walk ? 'fsssssf.' : '.fsssssf';
    const rows = ['..hhhh..', '.hhhhhh.', '.kkffkk.', '.fkffkf.', '..fmmf..', arms, '.sssss..', legs];
    const pal = { h: b.hair, f: '#ff6f4f', k: '#3a0d0d', m: '#6a0000', s: b.shirt, p: '#2a2a55' };
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x - 6, y + 5, 12, 3);
    spr(rows, x - 8 + jitter, y - 11 - (walk ? 1 : 0), pal);
    // anger marks
    if (Math.floor(S.t * 4 + b.step) % 2 === 0) {
      ctx.fillStyle = '#ff2d3d';
      ctx.fillRect(x + 6, y - 15, 1, 3); ctx.fillRect(x + 6, y - 11, 1, 1);
      ctx.fillRect(x - 8, y - 14, 2, 1); ctx.fillRect(x - 9, y - 13, 1, 1);
    }
    if (b.sayT > 0) {
      ctx.font = '5px "Press Start 2P", monospace'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(b.say).width + 6, bx = x - w / 2, by = y - 30;
      ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, w, 10);
      ctx.fillStyle = '#000'; ctx.fillRect(bx, by, w, 1); ctx.fillRect(bx, by + 9, w, 1); ctx.fillRect(bx, by, 1, 10); ctx.fillRect(bx + w - 1, by, 1, 10);
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, by + 10, 3, 2);
      ctx.fillStyle = '#c4001a'; ctx.fillText(b.say, bx + 3, by + 5);
    }
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
      ctx.fillRect(x + 6, y - 2 - (S.t * 12) % 10, 2, 2);
    } else {
      ctx.fillStyle = '#7dffa8'; ctx.fillRect(x + 4, y + 6 + (Math.floor(S.t * 4) % 3) * 3.5, 2, 1);
    }
  }
  function drawZap(z) {
    const x = z.x * T, y = z.y * T;
    if (S.rep < z.minRep) return;
    const per = zapPeriod(), ph = (S.t + z.phase) % per;
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
  function drawPickup(k) {
    const x = k.x * T, y = k.y * T + Math.round(Math.sin(S.t * 4 + k.x) * 1.2);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 3, k.y * T + 14, 10, 2);
    ctx.drawImage(k.type === 'cable' ? cableSprite(k.color) : chipSprite(), x, y);
    if (Math.floor(S.t * 3 + k.x) % 4 === 0) { ctx.fillStyle = '#fff'; ctx.fillRect(x + 13, y + 1, 2, 2); }
  }

  function render() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    let cx = Math.round(S.cam.x), cy = Math.round(S.cam.y);
    if (S.shake > 0) { cx += rnd(5) - 2; cy += rnd(5) - 2; }
    ctx.save(); ctx.translate(-cx, -cy);
    ctx.drawImage(mapCanvas, 0, 0);
    S.deco.forEach((d) => {
      if (d.type !== 'desk') return;
      ctx.globalAlpha = 0.1 + 0.05 * Math.sin(S.t * 3 + d.x);
      ctx.fillStyle = '#35e0ff'; ctx.fillRect(d.x * T - 1, d.y * T - 1, T + 2, T + 6); ctx.globalAlpha = 1;
    });
    S.zaps.forEach(drawZap);
    S.pickups.forEach(drawPickup);
    S.servers.forEach(drawServer);
    S.people.forEach(drawPerson);
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
    const rep = e.repeat; keys[k] = true;
    if (rep) return;
    if ((k === 'e' || k === ' ' || k === 'enter') && S.mode === 'play') tryInteract();
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
  cv.addEventListener('pointerdown', () => { if (S.mode === 'play' && nearServer()) tryInteract(); });

  // Instructions page: shown before the game starts, reopenable with the ? button (pauses the game).
  function openHowto(fromGame) {
    if (fromGame && ['play', 'puzzle', 'card'].includes(S.mode)) { S.pausedFrom = S.mode; S.mode = 'paused'; }
    $('hwBtn').textContent = S.mode === 'title' ? 'START GAME' : 'BACK TO GAME';
    $('howto').hidden = false; $('howto').scrollTop = 0; $('hwBtn').focus({ preventScroll: true });
  }
  function closeHowto() {
    $('howto').hidden = true;
    if (S.mode === 'title') showIntro();
    else if (S.mode === 'paused') S.mode = S.pausedFrom || 'play';
  }
  $('hwBtn').addEventListener('click', closeHowto);
  $('helpBtn').addEventListener('click', () => { if (S.mode !== 'over') openHowto(true); });

  // ================= boot =================
  newGame();
  if (document.fonts && document.fonts.load) document.fonts.load('6px "Press Start 2P"').then(() => { if (S) renderStatic(S.deco, LEVELS[S.levelIdx]); });
  openHowto(false);

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
