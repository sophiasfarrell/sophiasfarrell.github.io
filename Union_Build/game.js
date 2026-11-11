(() => {
  'use strict';

  // ---------- Data ----------
  const COLS = 10, ROWS = 20, CELL = 30;
  const LINES_PER_SECTION = 2;
  const SECTIONS_PER_RESTAURANT = 5;
  const LINES_PER_RESTAURANT = LINES_PER_SECTION * SECTIONS_PER_RESTAURANT;
  const CLEAR_MS = 650;

  const SECTION_NAMES = ['Permits & Plans', 'Foundation', 'Framing', 'Kitchen Install', 'Grand Opening'];

  const RESTAURANTS = [
    { id: 'imperial', name: 'Imperial Palace', tag: 'Refreshed. Back in its original spot with wok-fired favorites.' },
    { id: 'husker', name: 'Husker Heroes', tag: 'Expanded. A flagship sandwich shop in the old Subway space, now with paninis.' },
    { id: 'valentinos', name: "Valentino's", tag: 'Returning. The campus pizza favorite moves in next to Husker Heroes.' },
    { id: 'choolaah', name: 'Choolaah', tag: 'New. Indian-inspired barbecue, debuting at the Union.' },
    { id: 'sossy', name: 'Sossy', tag: 'New. University-branded, slow-cooked barbecue inspired by roadside joints.' }
  ];
  RESTAURANTS.forEach(r => {
    r.logo = `assets/logos/${r.id}.png`;
    r.store = `assets/storefronts/${r.id}.jpg`;
    r.img = new Image();
    r.img.src = r.store;
  });

  // Tetromino shapes, each one a construction material.
  const PIECES = {
    I: { name: 'Steel Beam', m: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]] },
    O: { name: 'Concrete Block', m: [[1,1],[1,1]] },
    T: { name: 'Plywood Sheet', m: [[0,1,0],[1,1,1],[0,0,0]] },
    S: { name: 'Brick Course', m: [[0,1,1],[1,1,0],[0,0,0]] },
    Z: { name: 'Caution Barrier', m: [[1,1,0],[0,1,1],[0,0,0]] },
    L: { name: 'Lumber', m: [[0,0,1],[1,1,1],[0,0,0]] },
    J: { name: 'Safety Fence', m: [[1,0,0],[1,1,1],[0,0,0]] }
  };
  const KEYS = Object.keys(PIECES);

  // look: skin, hair colour, hair style, extras, mood, shirt, backdrop
  const COMPLAINTS = [
    ['Sophomore, Business', "I've walked past this plywood wall since freshman year. I graduate in May.", { skin: '#f3cfa6', hair: '#5a3825', style: 'short', hat: '#c9262f', mood: 'tired', shirt: '#c9262f', bg: '#ffd9a0' }],
    ['Professor', "In my day we built the whole Union in less time than it takes to microwave a burrito.", { skin: '#efc7a0', hair: '#c9c9c9', style: 'bald', glasses: true, mood: 'angry', shirt: '#4a5a78', tie: '#8f1515', bg: '#d7e3f4' }],
    ['Junior, Engineering', "I did the math. At this rate the food court opens when my grandkids enroll.", { skin: '#8d5a3b', hair: '#1c1410', style: 'curly', glasses: true, mood: 'worried', shirt: '#2f6f6a', bg: '#e1f1d6' }],
    ['Grad student', "I have been eating granola bars out of my backpack for a full semester.", { skin: '#e0ac82', hair: '#222', style: 'bun', glasses: true, mood: 'tired', shirt: '#6b4c8a', bg: '#f1dcf4' }],
    ['Freshman', "Wait, there was a pizza place here? I've only ever known the tarp.", { skin: '#f7d9b8', hair: '#d39b3c', style: 'long', mood: 'shocked', shirt: '#2b6cb0', bg: '#d6ecf7' }],
    ['Faculty', "Hammering during my 8 a.m. lecture again. Respect the commitment, though.", { skin: '#c68d62', hair: '#2a1d14', style: 'short', beard: true, mood: 'angry', shirt: '#7a3b2e', tie: '#e8b94a', bg: '#f7e2c5' }],
    ['Senior, Journalism', "I'll be an alum by the time the barbecue is ready. Please save me a rib.", { skin: '#f0c8a2', hair: '#8b2f1f', style: 'long', glasses: true, mood: 'sad', shirt: '#222', bg: '#f9d9d4' }],
    ['Sophomore', "Is it too late to transfer to a school with a finished food court?", { skin: '#6f4529', hair: '#111', style: 'afro', mood: 'worried', shirt: '#c9262f', bg: '#ffe7a8' }],
    ['Staff member', "I just want a slice of pizza. One slice. Is that too much to ask?", { skin: '#e8b98f', hair: '#3b2a20', style: 'bun', mood: 'sad', shirt: '#2f855a', bg: '#d4efe0' }],
    ['Junior', "Imperial Palace better come back with wok-fired everything.", { skin: '#f1d3a8', hair: '#111', style: 'short', hat: '#222', mood: 'angry', shirt: '#b7791f', bg: '#f6d9a8' }],
    ['RA', "My whole floor is now 90 percent granola bars.", { skin: '#b57a50', hair: '#2d1a10', style: 'curly', mood: 'tired', shirt: '#2c5282', bg: '#d9e6f6' }],
    ['Lecturer', "Could we at least get a progress bar on the wall? Oh. You are the progress bar.", { skin: '#f0c9a4', hair: '#8a8a8a', style: 'short', glasses: true, beard: true, mood: 'flat', shirt: '#5a6b4a', tie: '#222', bg: '#e6ecd6' }],
    ['Senior', "Same plywood, new semester. At least it's consistent.", { skin: '#d9a073', hair: '#3a2a1e', style: 'long', mood: 'flat', shirt: '#718096', bg: '#e5e5ef' }],
    ['Student', "Faster. FASTER. My lunch break is in nine minutes.", { skin: '#f6d6b0', hair: '#b8512a', style: 'short', hat: '#c9262f', mood: 'angry', shirt: '#111', bg: '#ffd3c4' }]
  ];

  // Cartoon face generator (inline SVG, no image files needed)
  function faceSVG(o) {
    const ink = '#2a1f1a';
    let s = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">`;
    s += `<rect width="100" height="100" fill="${o.bg}"/>`;
    // hair behind head
    if (o.style === 'long') s += `<path d="M20 50 Q18 14 50 12 Q82 14 80 50 L82 88 L18 88Z" fill="${o.hair}"/>`;
    if (o.style === 'afro') s += `<circle cx="50" cy="36" r="34" fill="${o.hair}"/>`;
    if (o.style === 'bun') s += `<circle cx="50" cy="11" r="9" fill="${o.hair}"/>`;
    // shoulders, neck
    s += `<path d="M6 100 Q8 76 34 72 L66 72 Q92 76 94 100Z" fill="${o.shirt}"/>`;
    s += `<rect x="42" y="62" width="16" height="14" fill="${o.skin}"/><path d="M42 70 Q50 78 58 70" fill="rgba(0,0,0,.12)"/>`;
    if (o.tie) s += `<path d="M50 74 L45 82 L50 100 L55 82Z" fill="${o.tie}"/>`;
    // head + ears
    s += `<ellipse cx="22" cy="50" rx="5" ry="7" fill="${o.skin}"/><ellipse cx="78" cy="50" rx="5" ry="7" fill="${o.skin}"/>`;
    s += `<ellipse cx="50" cy="46" rx="27" ry="30" fill="${o.skin}"/>`;
    // hair front
    const cap = `M23 44 Q22 14 50 14 Q78 14 77 44 Q70 28 50 28 Q30 28 23 44Z`;
    if (o.style === 'short' || o.style === 'long' || o.style === 'bun') s += `<path d="${cap}" fill="${o.hair}"/>`;
    if (o.style === 'curly') for (let i = 0; i < 7; i++) s += `<circle cx="${25 + i * 8.3}" cy="${i % 2 ? 20 : 24}" r="8" fill="${o.hair}"/>`;
    if (o.style === 'afro') s += `<path d="M23 44 Q24 18 50 18 Q76 18 77 44 Q68 30 50 30 Q32 30 23 44Z" fill="${o.hair}"/>`;
    if (o.style === 'bald') s += `<path d="M23 48 Q22 36 28 32 L29 50Z M77 48 Q78 36 72 32 L71 50Z" fill="${o.hair}"/>`;
    if (o.hat) s += `<path d="M22 29 Q50 -6 78 29Z" fill="${o.hat}"/><path d="M20 29 L80 29 Q92 29 95 34 L24 34Z" fill="${o.hat}"/><path d="M20 29 L80 29" stroke="rgba(0,0,0,.25)" stroke-width="2"/>`;
    // beard
    if (o.beard) s += `<path d="M24 52 Q26 84 50 84 Q74 84 76 52 Q70 66 50 66 Q30 66 24 52Z" fill="${o.hair}"/>`;
    // eyes
    const droop = o.mood === 'tired';
    s += `<ellipse cx="38" cy="46" rx="5.5" ry="${o.mood === 'shocked' ? 7 : 5.5}" fill="#fff"/><ellipse cx="62" cy="46" rx="5.5" ry="${o.mood === 'shocked' ? 7 : 5.5}" fill="#fff"/>`;
    s += `<circle cx="${o.mood === 'flat' ? 40 : 38}" cy="47" r="2.6" fill="${ink}"/><circle cx="${o.mood === 'flat' ? 64 : 62}" cy="47" r="2.6" fill="${ink}"/>`;
    if (droop) s += `<path d="M31 41 H45 V46 H31Z M55 41 H69 V46 H55Z" fill="${o.skin}"/><path d="M32 46 H44 M56 46 H68" stroke="${ink}" stroke-width="1.6"/>`;
    // brows
    const brow = { angry: ['M31 36 L45 41', 'M69 36 L55 41'], worried: ['M31 40 L45 35', 'M69 40 L55 35'], sad: ['M31 40 L45 36', 'M69 40 L55 36'], tired: ['M31 38 H45', 'M55 38 H69'], flat: ['M31 37 H45', 'M55 37 H69'], shocked: ['M32 32 Q38 29 45 33', 'M68 32 Q62 29 55 33'] }[o.mood];
    s += `<path d="${brow[0]} ${brow[1].replace('M', 'M')}" stroke="${o.style === 'bald' && o.hair ? o.hair : ink}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
    // nose + cheeks
    s += `<path d="M50 50 Q46 58 51 58" stroke="rgba(0,0,0,.35)" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    if (o.mood === 'angry') s += `<circle cx="30" cy="58" r="4" fill="rgba(220,60,60,.3)"/><circle cx="70" cy="58" r="4" fill="rgba(220,60,60,.3)"/>`;
    // glasses
    if (o.glasses) s += `<circle cx="38" cy="46" r="9" fill="rgba(255,255,255,.18)" stroke="${ink}" stroke-width="2"/><circle cx="62" cy="46" r="9" fill="rgba(255,255,255,.18)" stroke="${ink}" stroke-width="2"/><path d="M47 46 H53 M29 45 L23 43 M71 45 L77 43" stroke="${ink}" stroke-width="2"/>`;
    // mouth
    const mouth = {
      angry: `<path d="M39 70 Q50 62 61 70" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      worried: `<path d="M41 69 Q45 65 50 69 Q55 73 59 69" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
      sad: `<path d="M41 71 Q50 63 59 71" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      tired: `<path d="M42 69 H58" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
      flat: `<path d="M42 69 H58" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
      shocked: `<ellipse cx="50" cy="70" rx="5" ry="6.5" fill="#6b1f1f"/>`
    }[o.mood];
    s += mouth + '</svg>';
    return s;
  }

  // ---------- Construction-material tiles ----------
  function seeded(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

  function bevel(g) {
    g.fillStyle = 'rgba(255,255,255,.30)'; g.fillRect(0, 0, CELL, 2); g.fillRect(0, 0, 2, CELL);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, CELL - 2, CELL, 2); g.fillRect(CELL - 2, 0, 2, CELL);
    g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1; g.strokeRect(.5, .5, CELL - 1, CELL - 1);
  }
  function rivet(g, x, y) {
    g.fillStyle = '#2f3a44'; g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(x - .7, y - .7, .9, 0, 7); g.fill();
  }

  const DRAW = {
    // Steel I-beam: flanges and web with rivets
    I(g) {
      g.fillStyle = '#7d92a3'; g.fillRect(0, 0, CELL, CELL);
      g.fillStyle = '#b4c3cf'; g.fillRect(0, 0, CELL, 7);
      g.fillStyle = '#566a7a'; g.fillRect(0, CELL - 7, CELL, 7);
      g.fillStyle = '#93a7b7'; g.fillRect(0, 7, CELL, 16);
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, 7, CELL, 2);
      rivet(g, 7, 15); rivet(g, 23, 15);
    },
    // Concrete / cinder block with two hollow cores
    O(g) {
      const r = seeded(11);
      g.fillStyle = '#a9a8a3'; g.fillRect(0, 0, CELL, CELL);
      for (let i = 0; i < 70; i++) {
        g.fillStyle = r() > .5 ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.16)';
        g.fillRect(r() * CELL, r() * CELL, 1.4, 1.4);
      }
      g.fillStyle = '#6a6964'; g.fillRect(5, 8, 8, 13); g.fillRect(17, 8, 8, 13);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(5, 8, 8, 3); g.fillRect(17, 8, 8, 3);
    },
    // Plywood: pale laminate with grain
    T(g) {
      const r = seeded(5);
      g.fillStyle = '#e2c38e'; g.fillRect(0, 0, CELL, CELL);
      g.strokeStyle = 'rgba(133,92,40,.38)'; g.lineWidth = 1;
      for (let y = 3; y < CELL; y += 4 + Math.floor(r() * 3)) {
        g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(10, y + (r() * 4 - 2), 20, y + (r() * 4 - 2), CELL, y + (r() * 3 - 1.5)); g.stroke();
      }
      g.fillStyle = 'rgba(133,92,40,.45)'; g.beginPath(); g.ellipse(19, 12, 3, 2, .3, 0, 7); g.fill();
      g.fillStyle = 'rgba(133,92,40,.22)'; g.fillRect(0, CELL - 5, CELL, 3);
    },
    // Brick courses, offset joints that line up across cells
    S(g) {
      g.fillStyle = '#d5c9b4'; g.fillRect(0, 0, CELL, CELL);
      const r = seeded(21);
      const brick = (x, y, w, h) => {
        const sh = 150 + Math.floor(r() * 25);
        g.fillStyle = `rgb(${sh + 25},${Math.floor(sh / 2.6)},${Math.floor(sh / 3.6)})`;
        g.fillRect(x, y, w, h);
        g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x, y, w, 2);
        g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, y + h - 2, w, 2);
      };
      for (let row = 0; row < 2; row++) {
        const y = row * 15 + 1, h = 13;
        const off = row ? 7.5 : 0;
        for (let x = -15 + off; x < CELL; x += 15) {
          const x0 = Math.max(0, x + 1), x1 = Math.min(CELL, x + 14);
          if (x1 > x0) brick(x0, y, x1 - x0, h);
        }
      }
    },
    // Caution barrier: yellow and black hazard stripes
    Z(g) {
      g.fillStyle = '#f5c518'; g.fillRect(0, 0, CELL, CELL);
      g.fillStyle = '#1a1a1a';
      for (let k = -30; k < 60; k += 15) {
        g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 7.5, 0); g.lineTo(k + 7.5 - 30, 30); g.lineTo(k - 30, 30); g.fill();
      }
    },
    // Lumber (2x4): warm wood with long grain and nails
    L(g) {
      const r = seeded(33);
      g.fillStyle = '#bd8244'; g.fillRect(0, 0, CELL, CELL);
      g.strokeStyle = 'rgba(80,45,15,.45)'; g.lineWidth = 1;
      for (let y = 4; y < CELL; y += 5) { g.beginPath(); g.moveTo(0, y + r() * 2); g.lineTo(CELL, y + r() * 2); g.stroke(); }
      g.fillStyle = 'rgba(255,225,170,.22)'; g.fillRect(0, 2, CELL, 3);
      g.fillStyle = '#575757'; g.beginPath(); g.arc(6, 8, 1.8, 0, 7); g.arc(24, 22, 1.8, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(5.2, 7.2, 1, 1); g.fillRect(23.2, 21.2, 1, 1);
    },
    // Safety fence: orange mesh
    J(g) {
      g.fillStyle = '#ff6a13'; g.fillRect(0, 0, CELL, CELL);
      g.strokeStyle = 'rgba(255,214,150,.75)'; g.lineWidth = 2;
      for (let k = -30; k < 60; k += 10) {
        g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 30, 30); g.stroke();
        g.beginPath(); g.moveTo(k + 30, 0); g.lineTo(k, 30); g.stroke();
      }
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, CELL - 5, CELL, 3);
    }
  };

  const TILES = {};
  KEYS.forEach(k => {
    const c = document.createElement('canvas'); c.width = c.height = CELL;
    const g = c.getContext('2d');
    DRAW[k](g); bevel(g);
    TILES[k] = c;
  });

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const canvas = $('board'), ctx = canvas.getContext('2d');
  const nextCanvas = $('next'), nctx = nextCanvas.getContext('2d');
  const overlay = $('overlay'), overlayCard = $('overlay-card');
  const hoarding = $('hoarding'), storeImg = $('store-img');

  // ---------- State ----------
  let board, cur, queue, bag;
  let score, lines, restIndex, restLines, complaintCount;
  let state = 'ready';
  let dropTimer, complaintTimer, lastTime;
  let complaintDeck = [];
  let clearRows = [], clearT = 0, clearBase = 0;

  const COMPLAINT_EVERY = 22000; // ms of play between complaints
  const FIRST_COMPLAINT_AT = 12000;

  // ---------- Strip & HUD ----------
  function buildStrip() {
    const strip = $('strip');
    strip.innerHTML = '';
    RESTAURANTS.forEach((r, i) => {
      const li = document.createElement('li');
      li.id = 'strip-' + i;
      li.innerHTML = `<img src="${r.logo}" alt="${r.name} logo"><span class="badge">Open</span>`;
      strip.appendChild(li);
    });
  }

  // Storefront reveal: hoarding covers the top, lifts upward as sections finish.
  function setStore(idx, progress, instant) {
    const r = RESTAURANTS[Math.min(idx, RESTAURANTS.length - 1)];
    if (!storeImg.src.endsWith(r.store)) storeImg.src = r.store;
    storeImg.alt = `Rendering of the finished ${r.name} storefront`;
    $('hoard-text').textContent = r.name;
    if (instant) hoarding.style.transition = 'none';
    hoarding.style.height = ((1 - Math.max(0, Math.min(1, progress))) * 100) + '%';
    if (instant) { void hoarding.offsetHeight; hoarding.style.transition = ''; }
    $('store-card').classList.toggle('complete', progress >= 1);
  }

  function updateHud() {
    $('score').textContent = score;
    $('lines').textContent = lines;
    $('speed').textContent = (800 / gravity()).toFixed(1) + 'x';
    const r = RESTAURANTS[Math.min(restIndex, RESTAURANTS.length - 1)];
    $('cur-name').textContent = r.name;
    $('cur-tag').textContent = r.tag;

    const sectionsDone = Math.floor(restLines / LINES_PER_SECTION);
    const half = restLines % LINES_PER_SECTION > 0;
    const pips = $('pips');
    pips.innerHTML = '';
    for (let i = 0; i < SECTIONS_PER_RESTAURANT; i++) {
      const p = document.createElement('div');
      p.className = 'pip' + (i < sectionsDone ? ' on' : (i === sectionsDone && half ? ' partial' : ''));
      pips.appendChild(p);
    }
    const idx = Math.min(sectionsDone, SECTIONS_PER_RESTAURANT - 1);
    $('cur-section').textContent = `Section ${idx + 1} of ${SECTIONS_PER_RESTAURANT}: ${SECTION_NAMES[idx]}`;

    RESTAURANTS.forEach((_, i) => {
      const li = $('strip-' + i);
      li.classList.toggle('done', i < restIndex);
      li.classList.toggle('active', i === restIndex);
    });

    $('complaint-count').textContent = complaintCount + (complaintCount === 1 ? ' complaint filed' : ' complaints filed');
    $('patience').style.width = Math.max(4, 100 - complaintCount * 7) + '%';
  }

  // ---------- Game logic ----------
  function gravity() {
    return Math.max(70, 800 * Math.pow(0.82, complaintCount) * Math.pow(0.93, restIndex));
  }

  function refillBag() {
    bag = KEYS.slice();
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  function nextKey() {
    if (!bag || !bag.length) refillBag();
    return bag.pop();
  }

  function spawn() {
    const key = queue.shift();
    queue.push(nextKey());
    const p = PIECES[key];
    cur = { key, m: p.m.map(r => r.slice()), x: Math.floor((COLS - p.m[0].length) / 2), y: key === 'I' ? -1 : 0 };
    drawNext();
    if (collides(cur.m, cur.x, cur.y)) gameOver();
  }

  function collides(m, px, py) {
    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m[y].length; x++) {
        if (!m[y][x]) continue;
        const bx = px + x, by = py + y;
        if (bx < 0 || bx >= COLS || by >= ROWS) return true;
        if (by >= 0 && board[by][bx]) return true;
      }
    }
    return false;
  }

  function rotateM(m) {
    const n = m.length;
    const r = m.map(row => row.slice());
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) r[x][n - 1 - y] = m[y][x];
    return r;
  }

  function tryMove(dx, dy) {
    if (state !== 'playing') return false;
    if (!collides(cur.m, cur.x + dx, cur.y + dy)) { cur.x += dx; cur.y += dy; return true; }
    return false;
  }

  function rotate() {
    if (state !== 'playing' || cur.key === 'O') return;
    const r = rotateM(cur.m);
    for (const k of [0, -1, 1, -2, 2]) {
      if (!collides(r, cur.x + k, cur.y)) { cur.m = r; cur.x += k; return; }
    }
  }

  function softDrop() {
    if (tryMove(0, 1)) { score += 1; dropTimer = 0; updateHud(); }
    else lockPiece();
  }

  function hardDrop() {
    if (state !== 'playing') return;
    let d = 0;
    while (!collides(cur.m, cur.x, cur.y + 1)) { cur.y++; d++; }
    score += d * 2;
    lockPiece();
  }

  function lockPiece() {
    cur.m.forEach((row, y) => row.forEach((v, x) => {
      if (!v) return;
      const by = cur.y + y;
      if (by < 0) return;
      board[by][cur.x + x] = cur.key;
    }));
    cur = null;
    const rows = [];
    for (let y = ROWS - 1; y >= 0; y--) if (board[y].every(c => c)) rows.push(y);
    if (rows.length) {
      // Full rows turn into the finished storefront before they come off the board.
      state = 'clearing';
      clearRows = rows; clearT = 0; clearBase = restLines;
    } else {
      spawn(); dropTimer = 0;
    }
    updateHud();
  }

  function finishClear() {
    const n = clearRows.length;
    clearRows.slice().sort((a, b) => a - b).reverse().forEach(y => {
      board.splice(y, 1);
      board.unshift(new Array(COLS).fill(null));
    });
    clearRows = [];
    score += [0, 100, 300, 500, 800][n] * (restIndex + 1);
    lines += n;
    restLines += n;
    setStore(restIndex, restLines / LINES_PER_RESTAURANT);
    if (restLines >= LINES_PER_RESTAURANT) { openRestaurant(); return; }
    state = 'playing';
    spawn(); dropTimer = 0;
    updateHud();
  }

  function openRestaurant() {
    const r = RESTAURANTS[restIndex];
    restLines -= LINES_PER_RESTAURANT;
    score += 1000;
    restIndex++;
    updateHud();
    if (restIndex >= RESTAURANTS.length) { win(); return; }
    state = 'popup';
    const next = RESTAURANTS[restIndex];
    // Short pause so the finished storefront is visible before the popup.
    setTimeout(() => {
      showOverlay(`
        <p class="label">Ribbon cutting</p>
        <h3>${r.name} is open!</h3>
        <img class="render" src="${r.store}" alt="Finished ${r.name} storefront">
        <img class="logo-tile" src="${r.logo}" alt="${r.name} logo">
        <p>The site is cleared for the next build: <b>${next.name}</b>. The students noticed. They also say it took too long.</p>
        <button class="btn" id="go">Keep building</button>`);
      $('go').onclick = () => {
        board = newBoard();
        hideOverlay();
        setStore(restIndex, restLines / LINES_PER_RESTAURANT, true);
        state = 'playing';
        spawn(); dropTimer = 0;
        updateHud();
      };
      $('go').focus();
    }, 900);
  }

  function win() {
    state = 'won';
    setTimeout(() => {
      showOverlay(`
        <p class="label">Union food court complete</p>
        <h3>Everything is open!</h3>
        <p>Final score: <b>${score}</b>. ${complaintCount} complaints filed along the way.</p>
        <div class="logo-grid">${RESTAURANTS.map(r => `<img src="${r.logo}" alt="${r.name} logo">`).join('')}</div>
        <img class="render" src="assets/rendering-choolaah.webp" alt="Rendering of Choolaah and Imperial Palace">
        <img class="render" src="assets/rendering-valentinos.webp" alt="Rendering of Sossy, Husker Heroes and Valentino's">
        <p>Renderings are artist concepts of the renovated Union.</p>
        <button class="btn" id="again">Build it again</button>`);
      $('again').onclick = startGame;
    }, 900);
  }

  function gameOver() {
    state = 'over';
    showOverlay(`
      <p class="label">Construction halted</p>
      <h3>Over budget</h3>
      <p>The site filled up. You opened <b>${Math.min(restIndex, RESTAURANTS.length)}</b> of 5 restaurants and scored <b>${score}</b>.</p>
      <p>${complaintCount} students filed complaints. Honestly, fair.</p>
      <button class="btn" id="again">Try again</button>`);
    $('again').onclick = startGame;
    $('again').focus();
  }

  function newBoard() { return Array.from({ length: ROWS }, () => new Array(COLS).fill(null)); }

  // ---------- Complaints ----------
  function nextComplaint() {
    if (!complaintDeck.length) {
      complaintDeck = COMPLAINTS.map((_, i) => i).sort(() => Math.random() - 0.5);
    }
    return COMPLAINTS[complaintDeck.pop()];
  }
  function showComplaint() {
    const [who, text, look] = nextComplaint();
    $('c-face').innerHTML = faceSVG(look);
    $('c-who').textContent = who;
    $('c-text').textContent = '“' + text + '”';
    $('c-faster').hidden = false;
    const card = $('complaint-card');
    card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
    complaintCount++;
    updateHud(); // blocks now fall faster
  }
  function resetComplaint() {
    $('c-face').innerHTML = faceSVG({ skin: '#f3cfa6', hair: '#6b4a2f', style: 'short', mood: 'flat', shirt: '#718096', bg: '#e6e6e6' });
    $('c-who').textContent = 'Nobody yet';
    $('c-text').textContent = 'Everyone is waiting patiently. For now.';
    $('c-faster').hidden = true;
  }

  // ---------- Overlay ----------
  function showOverlay(html) { overlayCard.innerHTML = html; overlay.classList.remove('off'); }
  function hideOverlay() { overlay.classList.add('off'); }

  // ---------- Rendering ----------
  function drawCell(c, x, y, key, alpha = 1) {
    c.globalAlpha = alpha;
    c.drawImage(TILES[key], x * CELL, y * CELL);
    c.globalAlpha = 1;
  }

  function drawFinishedRows() {
    const t = Math.min(1, clearT / CLEAR_MS);
    const r = RESTAURANTS[Math.min(restIndex, RESTAURANTS.length - 1)];
    const img = r.img;
    const alpha = t < 0.2 ? t / 0.2 : (t > 0.8 ? (1 - t) / 0.2 : 1);
    const sorted = clearRows.slice().sort((a, b) => b - a); // bottom first
    sorted.forEach((y, i) => {
      const band = Math.min(LINES_PER_RESTAURANT - 1, clearBase + i);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (img.complete && img.naturalWidth) {
        const bh = img.naturalHeight / LINES_PER_RESTAURANT;
        const sy = img.naturalHeight - (band + 1) * bh;
        ctx.drawImage(img, 0, sy, img.naturalWidth, bh, 0, y * CELL, COLS * CELL, CELL);
      } else {
        ctx.fillStyle = '#fbf8f2'; ctx.fillRect(0, y * CELL, COLS * CELL, CELL);
      }
      // shop-window shine sweeping left to right
      const sx = (t * 1.5 - 0.25) * COLS * CELL;
      const grad = ctx.createLinearGradient(sx - 50, 0, sx + 50, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(.5, 'rgba(255,255,255,.7)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad; ctx.fillRect(0, y * CELL, COLS * CELL, CELL);
      ctx.strokeStyle = '#fec564'; ctx.lineWidth = 2;
      ctx.strokeRect(1, y * CELL + 1, COLS * CELL - 2, CELL - 2);
      ctx.restore();
    });
  }

  function draw() {
    ctx.fillStyle = '#1b1b1b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,.05)';
    ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL + .5, 0); ctx.lineTo(x * CELL + .5, canvas.height); ctx.stroke(); }
    for (let y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL + .5); ctx.lineTo(canvas.width, y * CELL + .5); ctx.stroke(); }

    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (board[y][x]) drawCell(ctx, x, y, board[y][x]);

    if (state === 'clearing') drawFinishedRows();

    if (cur && (state === 'playing' || state === 'paused')) {
      let gy = cur.y;
      while (!collides(cur.m, cur.x, gy + 1)) gy++;
      cur.m.forEach((row, y) => row.forEach((v, x) => { if (v && gy + y >= 0) drawCell(ctx, cur.x + x, gy + y, cur.key, .22); }));
      cur.m.forEach((row, y) => row.forEach((v, x) => { if (v && cur.y + y >= 0) drawCell(ctx, cur.x + x, cur.y + y, cur.key); }));
    }
  }

  function drawNext() {
    nctx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const key = queue[0], p = PIECES[key];
    $('next-name').textContent = p.name;
    const s = 24, w = p.m[0].length * s, h = p.m.length * s;
    const ox = Math.round((nextCanvas.width - w) / 2), oy = Math.round((nextCanvas.height - h) / 2);
    p.m.forEach((row, y) => row.forEach((v, x) => {
      if (v) nctx.drawImage(TILES[key], ox + x * s, oy + y * s, s, s);
    }));
  }

  // ---------- Loop ----------
  function frame(t) {
    const dt = Math.min(100, t - (lastTime || t));
    lastTime = t;
    if (state === 'playing') {
      dropTimer += dt;
      if (dropTimer >= gravity()) {
        dropTimer = 0;
        if (!tryMove(0, 1)) lockPiece();
      }
      if (state === 'playing') {
        complaintTimer += dt;
        if (complaintTimer >= COMPLAINT_EVERY) { complaintTimer = 0; showComplaint(); }
      }
    } else if (state === 'clearing') {
      clearT += dt;
      if (clearT >= CLEAR_MS) finishClear();
    }
    draw();
    requestAnimationFrame(frame);
  }

  // ---------- Control ----------
  function startGame() {
    board = newBoard();
    score = 0; lines = 0; restIndex = 0; restLines = 0; complaintCount = 0;
    bag = null; queue = [nextKey(), nextKey()];
    dropTimer = 0; complaintTimer = COMPLAINT_EVERY - FIRST_COMPLAINT_AT; clearRows = [];
    resetComplaint();
    hideOverlay();
    setStore(0, 0, true);
    state = 'playing';
    spawn();
    updateHud();
  }

  function togglePause() {
    if (state === 'playing') {
      state = 'paused';
      showOverlay('<h3>Work stoppage</h3><p>Construction is paused. The students are still complaining, but quietly.</p><button class="btn" id="resume">Resume</button>');
      $('resume').onclick = togglePause;
    } else if (state === 'paused') {
      state = 'playing';
      hideOverlay();
    }
  }

  document.addEventListener('keydown', (e) => {
    const k = e.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(k) && state !== 'ready') {
      if (document.activeElement && document.activeElement.tagName === 'BUTTON' && k === ' ') return; // let focused buttons use space
      e.preventDefault();
    }
    if (k === 'p' || k === 'P') return togglePause();
    if (state !== 'playing') return;
    if (k === 'ArrowLeft') tryMove(-1, 0);
    else if (k === 'ArrowRight') tryMove(1, 0);
    else if (k === 'ArrowDown') softDrop();
    else if (k === 'ArrowUp' || k === 'x' || k === 'X') rotate();
    else if (k === ' ') hardDrop();
  });

  // Touch buttons, with repeat for movement
  document.querySelectorAll('#touch button').forEach((b) => {
    const act = b.dataset.act;
    const run = () => {
      if (state !== 'playing') return;
      if (act === 'left') tryMove(-1, 0);
      else if (act === 'right') tryMove(1, 0);
      else if (act === 'down') softDrop();
      else if (act === 'rotate') rotate();
      else if (act === 'drop') hardDrop();
    };
    let rep, delay;
    const stop = () => { clearTimeout(delay); clearInterval(rep); };
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); run();
      if (['left', 'right', 'down'].includes(act)) delay = setTimeout(() => { rep = setInterval(run, 90); }, 250);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stop));
  });

  // ---------- Boot ----------
  board = newBoard(); queue = [nextKey(), nextKey()];
  score = 0; lines = 0; restIndex = 0; restLines = 0; complaintCount = 0;
  cur = null;
  buildStrip(); updateHud(); drawNext(); setStore(0, 0, true); resetComplaint();
  showOverlay(`
    <p class="label">Nebraska Union, food court</p>
    <h3>Union Build</h3>
    <p>Stack steel, brick, lumber and concrete into full rows. Each cleared row turns into the finished storefront. Five sections finish a restaurant and unlock its logo.</p>
    <p><b>Warning:</b> students will complain. Every complaint makes the materials fall faster.</p>
    <button class="btn" id="start">Start building</button>`);
  $('start').onclick = startGame;
  requestAnimationFrame(frame);
})();
