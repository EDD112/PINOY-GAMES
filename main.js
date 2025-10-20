// 🔄 Redirect to introduction.html only if NOT already from intro
if (
  !window.location.pathname.includes("introduction.html") &&
  !window.location.search.includes("from=intro")
) {
  window.location.href = "introduction.html";
}

document.addEventListener('DOMContentLoaded', () => {
  const mainMenu = document.getElementById('mainMenu');
  const instructionsBtn = document.getElementById('instructionsButton');
  const leaderboardBtn = document.getElementById('leaderboardButton');
  const instructionsModal = document.getElementById('instructionsModal');
  const leaderboardModal = document.getElementById('leaderboardModal');
  const instructionsContent = document.getElementById('instructionsContent');
  const leaderboardContent = document.getElementById('leaderboardContent');
  const closeInstructionsBtn = document.getElementById('closeInstructions');
  const closeLeaderboardBtn = document.getElementById('closeLeaderboard');
  const startBtn = document.getElementById('startButton');
  const usernameInput = document.getElementById('usernameInput');
  const gameWrapper = document.getElementById('gameWrapper');
  const pauseBtn = document.getElementById('pauseButton');
  const pauseModal = document.getElementById('pauseModal');
  const resumeBtn = document.getElementById('resumeButton');
  const backMenuBtn = document.getElementById('backMenuButton');
  const pauseInstructionsBtn = document.getElementById('pauseInstructionsButton');
  const bgAudio = document.getElementById('bgMusic');

  // Track player name for leaderboard
  let currentPlayerName = '';

// --- NEW: Attach score display to existing HUD in the HTML
let hud = document.getElementById('hud');
if (!hud) {
  // If HUD wasn't present in markup, create a fallback
  hud = document.createElement('div');
  hud.id = 'hud';
  document.body.appendChild(hud);
}
// ensure we don't duplicate a score element
if (!document.getElementById('scoreValue')) {
  const scoreWrap = document.createElement('span');
  scoreWrap.id = 'scoreWrap';
  scoreWrap.innerHTML = `Score: <span id="scoreValue">0</span>`;
  scoreWrap.style.marginRight = '10px';
  hud.insertBefore(scoreWrap, hud.firstChild);
}
const scoreWrap = document.getElementById('scoreWrap');
if (scoreWrap) {
  scoreWrap.style.fontSize = "24px";
  scoreWrap.style.position = "fixed";
  scoreWrap.style.top = "10px";
  scoreWrap.style.left = "10px";
  scoreWrap.style.color = "#ffd76a";
  scoreWrap.style.fontFamily = "'Press Start 2P', monospace";
}
hud.style.display = 'none';

// --- Initialize score ---
window._lastScore = 0;
// RAF id so we don't accidentally start multiple update loops
window._rafId = null;

// Create a small DOM hint for pressing B to go back to menu
const pressBHint = document.createElement('div');
pressBHint.id = 'pressBHint';

pressBHint.style.display = 'none';
pressBHint.style.position = 'fixed';
pressBHint.style.zIndex = '1005';
pressBHint.style.left = '50%';
pressBHint.style.transform = 'translateX(-50%)';
pressBHint.style.bottom = '24px';
pressBHint.style.padding = '8px 12px';

pressBHint.style.color = '#ffd76a';
pressBHint.style.fontFamily = "'Press Start 2P', monospace";
pressBHint.style.fontSize = '12px';
pressBHint.style.borderRadius = '8px';
document.body.appendChild(pressBHint);

window.goBackToMenu = function() {
  try {
    // stop RAF loop
    if (window._rafId) {
      cancelAnimationFrame(window._rafId);
      window._rafId = null;
    }

    // mark game as paused
    window._gamePaused = true;
    window.gameOver = false;
    window._lastScore = 0;

    // reset HUD / score
    try {
      const scoreEl = document.getElementById('score');
      if (scoreEl) scoreEl.textContent = "Score: 0";
    } catch (e) {}

    // hide game wrapper
    const gw = document.getElementById('gameWrapper');
    if (gw) {
      gw.classList.add('hidden');
      gw.style.display = 'none';
      gw.setAttribute('data-paused', 'true');
    }

    // clear canvas
    const c = document.getElementById('gameCanvas');
    if (c && c.getContext) {
      const _ctx = c.getContext('2d');
      _ctx.clearRect(0, 0, c.width, c.height);
    }

    // hide HUD if not hidden
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'none';

    // hide press B hint
    const pressB = document.getElementById('pressBHint');
    if (pressB) pressB.style.display = 'none';

    // reset any arrays/objects that store active sprites, bars, enemies, etc.
    if (window.activeSprites) window.activeSprites = [];
    if (window.activeBars) window.activeBars = [];

    // finally show menu
    if (typeof showMainMenu === "function") showMainMenu();

  } catch (err) {
    console.error("goBackToMenu failed:", err);
    try { if (typeof showMainMenu === "function") showMainMenu(); } catch (e) {}
  }
};

// --- HUD update loop ---
function updateHUD() {
  const el = document.getElementById('scoreValue');
  if (el) {
    el.textContent = String(window._lastScore ?? 0);
  }
  requestAnimationFrame(updateHUD);
}
updateHUD();

// --- HUD control helper ---
window.showHUD = () => { try { hud.style.display = 'flex'; } catch (e) {} };
window.hideHUD = () => { try { hud.style.display = 'none'; } catch (e) {} };



  function showMainMenu() {
  if (!mainMenu) return;
  mainMenu.style.display = 'flex';
  mainMenu.classList.remove('hidden');
  mainMenu.setAttribute('aria-hidden', 'false');
  try {
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'none';
  } catch (e) {}
  try {
    const pressB = document.getElementById('pressBHint');
    if (pressB) pressB.style.display = 'none';
  } catch (e) {}
}


  function hideMainMenu() {
    if (!mainMenu) return;
    mainMenu.style.display = 'none';
    mainMenu.classList.add('hidden');
    mainMenu.setAttribute('aria-hidden', 'true');
    try {
      const hud = document.getElementById('hud');
      if (hud) hud.style.display = 'flex';
    } catch (e) {}
  }

  function showModal(modal) {
    modal.classList.remove('hidden');
  }
  function hideModal(modal) {
    modal.classList.add('hidden');
  }

  async function loadFragmentInto(url, container, onInit) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
      let html = await res.text();
      html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
      container.innerHTML = html;
      if (onInit) onInit(container);
    } catch (err) {
      console.error('Failed to load fragment', url, err);
      if (url === 'instructions.html') {
        container.innerHTML = `
<h2>How to Play</h2>
<p>
  Luksong Baka: time your jump to clear the baka as it grows taller.
  Approach the baka to trigger the power bar, then lock in power to leap.
  Reach 20 successful jumps to win!
</p>
<h2>Controls</h2>
<p>
  Keyboard:
  <br>A / D — Move left / right (alternative to Arrow keys)
  <br>Arrow Up — Jump (normal jump)
  <br>Space — Lock jump power when the power bar is active (green zone = success)
  <br>Esc — Pause / Resume (also closes open modals)
  <br>R — Restart after Game Over
</p>
<p>
  Mobile / Touch:
  <br>Use on-screen buttons: ◀ ▶ to move, ▲ to jump, ● to lock power.

<h2>Objective & Scoring</h2>
<p>
  Each successful vault +1 score. The baka grows taller over time and
  animal sprites change every few points. Hit the green zone on the
  power bar to auto-vault over the baka. Missing the green zone ends
  the run.
</p>
<h2>Tips</h2>
<p>
  • Get close to the baka to activate the power bar.
  <br>• The green zone shrinks as your score increases — be precise!
  <br>• Watch your landing; regain footing before your next attempt.
</p>
<button id="backButton" class="btn-secondary">Back</button>
        `;
        if (onInit) onInit(container);
      } else if (url === 'leaderboard.html') {
        container.innerHTML = `
<h2>Leaderboard</h2>
<p id="topScorer">No scores yet</p>
<ol id="leaderboardList"></ol>
<button id="backButtonLB" class="btn-secondary">Back</button>
        `;
        if (onInit) onInit(container);
      } else {
        container.innerHTML = `<p>Error loading content.</p>`;
      }
    }
  }

  function initLeaderboard(container) {
    const topEl = container.querySelector('#topScorer');
    const list = container.querySelector('#leaderboardList');
    const back = container.querySelector('#backButtonLB') || container.querySelector('#backButton');
    const clearBtn = null; // no clear button

    async function loadScores() {
      if (!list) return;
      list.innerHTML = '';
        let scores = [];
        // Try server first. Server may return either an array or an object like { ok: true, scores: [...] }
        try {
          const res = await fetch('get_scores.php', { cache: 'no-store' });
          if (res.ok) {
            const js = await res.json().catch(() => null);
            if (Array.isArray(js)) scores = js;
            else if (js && Array.isArray(js.scores)) scores = js.scores;
          }
        } catch (e) { /* ignore, fallback below */ }
     
        // Fallback to localStorage if server returned nothing useful
        if (!scores || !scores.length) {
          try {
            const raw = localStorage.getItem('leaderboard');
            scores = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(scores)) scores = [];
          } catch (e) { scores = []; }
        }
      
        // Deduplicate by player name (case-insensitive). Keep the highest score per name.
        const dedupMap = Object.create(null);
        for (const s of (scores || [])) {
          if (!s || typeof s !== 'object') continue;
          const name = (s.name || 'Player').toString().trim();
          const key = name.toLowerCase();
          const sc = Number.isFinite(Number(s.score)) ? Number(s.score) : 0;
          if (!dedupMap[key] || sc > dedupMap[key].score) {
            dedupMap[key] = { name, score: sc, ts: s.ts || 0 };
          }
        }
        scores = Object.values(dedupMap);
      if (!scores.length) {
        if (topEl) topEl.textContent = 'No scores yet';
        const li = document.createElement('li');
        li.textContent = 'No scores yet';
        li.style.opacity = '0.8';
        list.appendChild(li);
        return;
      }
        scores.sort((a, b) => (b.score || 0) - (a.score || 0));
      if (topEl) {
        const top = scores[0];
        topEl.textContent = `Top Scorer: ${top.name ?? 'Player'} — ${top.score ?? 0}`;
      }
      scores.slice(0, 50).forEach((s, i) => {
        const li = document.createElement('li');
        li.textContent = `${s.name ?? 'Player'} — ${s.score ?? 0}`;
        if (i === 0) li.classList.add('top');
        list.appendChild(li);
      });
    }

    if (back) back.addEventListener('click', () => hideModal(leaderboardModal));
    // clear button removed
    loadScores();
  }

  function initInstructions(container) {
    const back = container.querySelector('#backButton') || container.querySelector('#backButtonLB');
    if (back) back.addEventListener('click', () => hideModal(instructionsModal));
  }

  instructionsBtn.addEventListener('click', () => {
    loadFragmentInto('instructions.html', instructionsContent, initInstructions)
      .then(() => showModal(instructionsModal));
  });
  leaderboardBtn.addEventListener('click', () => {
    loadFragmentInto('leaderboard.html', leaderboardContent, initLeaderboard)
      .then(() => showModal(leaderboardModal));
  });
  closeInstructionsBtn.addEventListener('click', () => hideModal(instructionsModal));
  closeLeaderboardBtn.addEventListener('click', () => hideModal(leaderboardModal));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // close instructions or leaderboard first
    if (!instructionsModal.classList.contains('hidden')) {
      hideModal(instructionsModal);
      return;
    } else if (!leaderboardModal.classList.contains('hidden')) {
      hideModal(leaderboardModal);
      return;
    }

    const gw = gameWrapper;
    if (!gw || gw.classList.contains('hidden')) return;

    const paused = gw.getAttribute('data-paused') === 'true';

    if (paused) {
      // If paused, resume the game
      if (typeof window.togglePause === 'function') window.togglePause();
      gw.setAttribute('data-paused', 'false');
      hideModal(pauseModal);
      pauseBtn.textContent = 'Pause'; 
      try { 
        const c = document.getElementById('gameCanvas'); 
        if (c) c.focus(); 
      } catch (e) {}
    } else {
      // If running, pause the game
      if (typeof window.togglePause === 'function') window.togglePause();
      gw.setAttribute('data-paused', 'true');
      const pauseScoreEl = document.getElementById('pauseScore');
      if (pauseScoreEl) pauseScoreEl.textContent = (window._lastScore ?? 0).toString();
      showModal(pauseModal);
      pauseBtn.textContent = 'Resume'; 
    }
  }
});




  // Ensure username is provided before starting the game
  startBtn.addEventListener('click', () => {
    try {
      const raw = (usernameInput && usernameInput.value || '').trim();
      // create or update inline helper message under username input
      let hint = document.getElementById('usernameHint');
      if (!hint) {
        hint = document.createElement('div');
        hint.id = 'usernameHint';
        hint.style.color = '#ff6666';
        hint.style.fontSize = '12px';
        hint.style.marginTop = '6px';
        hint.style.fontFamily = "'Press Start 2P', monospace";
        usernameInput.parentNode.appendChild(hint);
      }

      if (!raw) {
        // show alert and inline message, focus the input, and don't start
        try { alert('Please enter a username before starting the game.'); } catch (e) {}
        hint.textContent = 'Please enter a username.';
        try { usernameInput.focus(); } catch (e) {}
        return;
      } else {
        // clear any previous hint
        hint.textContent = '';
      }

      currentPlayerName = raw || 'Player';
      window._playerName = currentPlayerName;
    } catch (e) {
      currentPlayerName = 'Player';
      try { window._playerName = currentPlayerName; } catch (_) {}
    }
    hideMainMenu();
      if (gameWrapper) {
    gameWrapper.style.display = '';
    gameWrapper.classList.remove('hidden');
    gameWrapper.setAttribute('data-paused', 'false');
  }

  try { window._gamePaused = false; } catch (e) {}
  try { document.getElementById('gameCanvas').focus(); } catch (e) {}
  if (bgAudio && typeof bgAudio.play === 'function') bgAudio.play().catch(() => {});

  // ALWAYS use restartGame to reset the game fully
  if (typeof window.restartGame === 'function') {
    window.restartGame();
  }
});

  pauseBtn.addEventListener('click', () => {
    if (typeof window.togglePause === 'function') window.togglePause();
    else {
      const gw = document.getElementById('gameWrapper');
      if (!gw) return;
      const paused = gw.getAttribute('data-paused') === 'true';
      gw.setAttribute('data-paused', (!paused).toString());
      pauseBtn.textContent = paused ? 'Pause' : 'Resume';
    }
    const pauseScoreEl = document.getElementById('pauseScore');
    if (pauseScoreEl) pauseScoreEl.textContent = (window._lastScore ?? 0).toString();
    showModal(pauseModal);
  });

  resumeBtn.addEventListener('click', () => {
    if (typeof window.togglePause === 'function') window.togglePause();
    else {
      const gw = document.getElementById('gameWrapper');
      if (gw) gw.setAttribute('data-paused', 'false');
    }
    hideModal(pauseModal);
  });

  backMenuBtn.addEventListener('click', () => {
    try { window.goBackToMenu(); } catch (e) { console.error(e); }
  });
  
  // Instructions from Pause Menu

  pauseInstructionsBtn.addEventListener('click', () => {
    hideModal(pauseModal);
    loadFragmentInto('instructions.html', instructionsContent, initInstructions)
      .then(() => showModal(instructionsModal));
  });
  
  // Touch controls

  const touchControls = document.getElementById('touchControls');
  function emitKey(key, isDown) {
    try {
      const ev = new KeyboardEvent(isDown ? 'keydown' : 'keyup', { key });
      window.dispatchEvent(ev);
    } catch (e) {}
    try { window.keys = window.keys || {}; window.keys[key] = !!isDown; } catch (e) {}
  }
  function handleTouchDown(e) {
    e.preventDefault();
    const btn = e.target.closest && e.target.closest('.tc-btn');
    if (!btn) return;
    const key = btn.getAttribute('data-key');
    emitKey(key, true);
  }
  function handleTouchUp(e) {
    e.preventDefault();
    const btn = e.target.closest && e.target.closest('.tc-btn');
    if (!btn) return;
    const key = btn.getAttribute('data-key');
    emitKey(key, false);
  }
  if (touchControls) {
    touchControls.addEventListener('touchstart', handleTouchDown, { passive: false });
    touchControls.addEventListener('touchend', handleTouchUp);
    touchControls.addEventListener('mousedown', handleTouchDown);
    touchControls.addEventListener('mouseup', handleTouchUp);
  }

  showMainMenu();

  //
  // === Game Logic (exactly your original game.js) ===
  //
  (
    function(){
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    try {
      canvas.tabIndex = 0;
      canvas.style.outline = 'none';
    } catch (e) {}

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();
    function applyResponsiveScale() {
  const canvasWidth = 1280;  // your base design width
  const canvasHeight = 720;  // your base design height
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let scale = Math.min(windowWidth / canvasWidth, windowHeight / canvasHeight);

  if (windowWidth <= 1024) { // apply only for tablet or mobile
    canvas.style.transform = 'scale(' + scale + ')';
    canvas.style.transformOrigin = 'top left';

    // adjust gameWrapper size to match scaled canvas
    if (gameWrapper) {
      gameWrapper.style.width = canvasWidth + 'px';
      gameWrapper.style.height = canvasHeight + 'px';
    }

  } else {
    // PC: remove scaling
    canvas.style.transform = '';
    if (gameWrapper) {
      gameWrapper.style.width = '';
      gameWrapper.style.height = '';
    }
  }
}
applyResponsiveScale();
window.addEventListener('resize', () => {
  applyResponsiveScale();
  resizeCanvas();

    const background = new Image();
    background.src = "background.png";

    let ground = canvas.height - 100;
    let keys = {};
    let score = 0;
    let gameOver = false;
    let wonGame = false;
    let savedScore = false; // ensure we only save once per game end
    let jumpingOverBaka = false;
    let showPowerBar = false;

    const player = {
      x: 100,
      y: ground - 64,
      width: 64,
      height: 64,
      speed: 5,
      dy: 0,
      gravity: 0.6,
      jumpPower: -12,
      grounded: true,
      state: "idle",
      frameX: 0,
      frameTimer: 0,
      frameInterval: 8,
      facing: "right",
      autoMove: 0
    };

    const bakaSprites = [
      { src: "pig.png", frames: 4, cols: 4, rows: 1 },
      { src: "sheep.png", frames: 4, cols: 4, rows: 1 },
      { src: "ilama.png", frames: 4, cols: 4, rows: 1 },
      { src: "cow.png", frames: 4, cols: 4, rows: 1 }
    ].map(data => {
      const img = new Image();
      img.src = data.src;
      return { ...data, img, frameX: 0, frameTimer: 0, frameInterval: 12 };
    });

    let currentBakaIndex = 0;

    const baka = {
      x: canvas.width / 2,
      y: ground,
      baseWidth: 140,
      baseHeight: 180,
      width: 140,
      height: 180
    };

    const powerBar = {
      x: canvas.width / 2 - 100,
      y: 50,
      width: 200,
      height: 20,
      markerX: 0,
      speed: 4,
      direction: 1,
      active: false,
      greenZone: [40, 160]
    };

    function updateGreenZone() {
      const maxWidth = 120;
      const minWidth = 30;
      const shrinkPerScore = 10;
      let newWidth = Math.max(minWidth, maxWidth - score * shrinkPerScore);
      let start = (powerBar.width - newWidth) / 2;
      powerBar.greenZone = [start, start + newWidth];
    }

    const sprites = {
      idle: { img: new Image(), frames: 2, cols: 2, rows: 1 },
      run: { img: new Image(), frames: 6, cols: 3, rows: 2 },
      jump: { img: new Image(), frames: 2, cols: 2, rows: 1 }
    };
    sprites.idle.img.src = "idle.png";
    sprites.run.img.src = "run.png";
    sprites.jump.img.src = "jump.png";

    window.addEventListener("keydown", e => {
      if (gameOver) {
         // Press B to go back to menu when game is over
        if (e.key === 'b' || e.key === 'B') {
          window.goBackToMenu();
          return;
        }
        // Press R to restart (existing behavior)
        if (e.key === "r" || e.key === "R") {
          restartGame();
          return;
        }
        return;
      }
      keys[e.key] = true;

      if (e.key === "ArrowUp" && player.grounded && !showPowerBar && !jumpingOverBaka) {
        player.dy = player.jumpPower;
        player.grounded = false;
        player.state = "jump";
        player.frameX = 0;
      }

      if (e.key === " " && showPowerBar && powerBar.active) {
        if (powerBar.markerX >= powerBar.greenZone[0] && powerBar.markerX <= powerBar.greenZone[1]) {
          jumpingOverBaka = true;
          powerBar.active = false;
          showPowerBar = false;

          player.dy = player.jumpPower - 5;
          player.grounded = false;
          player.state = "jump";
          player.autoMove = (player.x < baka.x) ? 6 : -6;

          score++;
          updateGreenZone();

          if (score % 5 === 0 && score < 20) {
            currentBakaIndex = (currentBakaIndex + 1) % bakaSprites.length;
          }

          if (score < 20) {
            baka.width = baka.baseWidth + score * 10;
            baka.height = baka.baseHeight + score * 10;
          }

          if (score === 20) {
            gameOver = true;
            wonGame = true;
          }

        } else {
          gameOver = true;
          powerBar.active = false;
          showPowerBar = false;
        }
      }
    });

    window.addEventListener("keyup", e => (keys[e.key] = false));

    function activatePowerBar() {
      powerBar.active = true;
      powerBar.markerX = 0;
      powerBar.direction = 1;
    }

  function restartGame() {
  score = 0;
  gameOver = false;
  wonGame = false;
  savedScore = false;
  jumpingOverBaka = false;
  showPowerBar = false;
  powerBar.active = false;
  player.x = 100;
  player.y = ground - player.height;
  player.state = "idle";
  player.frameX = 0;
  player.frameTimer = 0;

  baka.width = baka.baseWidth;
  baka.height = baka.baseHeight;
  baka.y = ground;
  currentBakaIndex = 0;

  if (typeof window.showHUD === 'function') window.showHUD();

  updateGreenZone();

  // ensure RAF loop is fresh
  if (window._rafId) cancelAnimationFrame(window._rafId);
  window._rafId = requestAnimationFrame(update);
}


    function isPaused() {
      if (typeof window._gamePaused !== 'undefined') return !!window._gamePaused;
      const gw = document.getElementById('gameWrapper');
      return gw && gw.getAttribute('data-paused') === 'true';
    }

    window.togglePause = function(){
      window._gamePaused = !window._gamePaused;

      if (!window._gamePaused) {
        try { keys = {}; } catch (e) {}
        try { canvas.focus(); } catch (e) {}
      }
    };

    function update() {
      const paused = isPaused();
      draw();
      if (paused) { requestAnimationFrame(update); return; }
      if (gameOver) {
        // show a hint to press B to return to menu
        try { pressBHint.style.display = 'block'; } catch (e) {}
        // persist score once when the game ends
        if (!savedScore) {
          const name = (window._playerName || 'Player');
          const payload = { name, score };
          // Try server
          fetch('save_score.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).then(r => {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json().catch(() => ({}));
          }).catch(() => {
            // Fallback to localStorage if server unavailable
            try {
              let raw = localStorage.getItem('leaderboard');
              let arr = [];
              try { arr = raw ? JSON.parse(raw) : []; if (!Array.isArray(arr)) arr = []; } catch (_) { arr = []; }
              arr.push({ name, score });
              arr.sort((a,b) => (b.score || 0) - (a.score || 0));
              arr = arr.slice(0, 100);
              localStorage.setItem('leaderboard', JSON.stringify(arr));
            } catch (e) {}
          }).finally(() => { savedScore = true; });
        }
        draw();
        // schedule next frame using single RAF handle
        try { window._rafId = requestAnimationFrame(update); } catch (e) { requestAnimationFrame(update); }
        return;
      }

      if (!jumpingOverBaka && !powerBar.active) {
        let prevState = player.state;
        if (player.state !== "jump") {
          if (player.grounded && Math.abs(player.x - baka.x) < 150) {
            player.state = "idle";
          } else if (keys["ArrowRight"] || keys['d'] || keys['D']) {
            player.x += player.speed;
            player.state = "run";
            player.facing = "right";
          } else if (keys["ArrowLeft"] || keys['a'] || keys['A']) {
            player.x -= player.speed;
            player.state = "run";
            player.facing = "left";
          } else {
            player.state = "idle";
          }
        }
        if (player.state !== prevState) {
          player.frameX = 0;
          player.frameTimer = 0;
        }
      }

      if (jumpingOverBaka) {
        player.x += player.autoMove;
      }

      player.y += player.dy;
      if (!player.grounded) {
        player.dy += player.gravity;
        player.frameX = (player.dy < 0) ? 0 : 1;
      }

      if (player.y + player.height >= ground) {
        player.y = ground - player.height;
        player.dy = 0;
        player.grounded = true;
        if (player.state === "jump") player.state = "idle";
        if (jumpingOverBaka) {
          jumpingOverBaka = false;
          player.autoMove = 0;
        }
      }

      if (!jumpingOverBaka && player.grounded && Math.abs(player.x - baka.x) < 150) {
        if (!powerBar.active && !gameOver) {
          showPowerBar = true;
          activatePowerBar();
          updateGreenZone();
          player.state = "idle";
        }
      } else {
        if (!powerBar.active) showPowerBar = false;
      }

      if (powerBar.active) {
        powerBar.markerX += powerBar.speed * powerBar.direction;
        if (powerBar.markerX <= 0) {
          powerBar.markerX = 0;
          powerBar.direction = 1;
        } else if (powerBar.markerX >= powerBar.width) {
          powerBar.markerX = powerBar.width;
          powerBar.direction = -1;
        }
      }

      const scoreEl = document.getElementById('scoreValue');
      if (scoreEl) scoreEl.textContent = String(score);
      try { window._rafId = requestAnimationFrame(update); } catch (e) { requestAnimationFrame(update); }
    }
    function drawBaka() {
      const spriteData = bakaSprites[currentBakaIndex];
      const sprite = spriteData.img;
      if (!sprite.complete || sprite.width === 0) {
        ctx.fillStyle = "brown";
        ctx.fillRect(baka.x - baka.width / 2, baka.y - baka.height, baka.width, baka.height);
        return;
      }
      const cols = spriteData.cols;
      const rows = spriteData.rows;
      const frameWidth = sprite.width / cols;
      const frameHeight = sprite.height / rows;

      if (++spriteData.frameTimer >= spriteData.frameInterval) {
        spriteData.frameTimer = 0;
        spriteData.frameX = (spriteData.frameX + 1) % spriteData.frames;
      }

      const col = spriteData.frameX % cols;
      const row = Math.floor(spriteData.frameX / cols);

      let dynamicYOffset;
      if (score <= 10) {
        dynamicYOffset = baka.height * 0.4;
      } else {
        const maxShift = 30;
        const extraScore = score - 10;
        const cappedScore = Math.min(extraScore, 10);
        const shiftUp = (cappedScore / 10) * maxShift;
        dynamicYOffset = (baka.height * 0.4) - shiftUp;
      }

      ctx.drawImage(
        sprite,
        col * frameWidth, row * frameHeight, frameWidth, frameHeight,
        baka.x - baka.width / 2,
        baka.y - baka.height + dynamicYOffset,
        baka.width, baka.height
      );
    }
    function drawFeetBox() {
      const footHeight = 10;
      ctx.strokeStyle = "rgba(0, 0, 0, 0)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        baka.x - baka.width / 2,
        baka.y - footHeight,
        baka.width,
        footHeight
      );
    }
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      drawBaka();
      drawFeetBox();

      if (showPowerBar) {
        ctx.fillStyle = "#444";
        ctx.fillRect(powerBar.x, powerBar.y, powerBar.width, powerBar.height);

        ctx.fillStyle = "green";
        ctx.fillRect(
          powerBar.x + powerBar.greenZone[0],
          powerBar.y,
          powerBar.greenZone[1] - powerBar.greenZone[0],
          powerBar.height
        );

        ctx.fillStyle = "black";
        ctx.fillRect(
          powerBar.x + powerBar.markerX - 2,
          powerBar.y - 5,
          4,
          powerBar.height + 10
        );
      }

      const spriteData = sprites[player.state];
      const sprite = spriteData.img;
      const frameCount = spriteData.frames;

      if (!sprite.complete || sprite.width === 0 || sprite.height === 0) {
        ctx.fillStyle = "blue";
        ctx.fillRect(player.x, player.y, player.width, player.height);
      } else {
        const cols = spriteData.cols || frameCount;
        const rows = spriteData.rows || 1;
        const frameWidth = Math.floor(sprite.width / cols) || 1;
        const frameHeight = Math.floor(sprite.height / rows) || sprite.height;

        let col = player.frameX % cols;
        let row = Math.floor(player.frameX / cols);

        if (player.state === "idle" || player.state === "run") {
          if (++player.frameTimer >= player.frameInterval) {
            player.frameTimer = 0;
            player.frameX = (player.frameX + 1) % frameCount;
            col = player.frameX % cols;
            row = Math.floor(player.frameX / cols);
          }
        }
        ctx.save();
        if (player.facing === "left") {
          ctx.scale(-1, 1);
          ctx.drawImage(
            sprite,
            col * frameWidth, row * frameHeight, frameWidth, frameHeight,
            -player.x - player.width, player.y, player.width, player.height
          );
        } else {
          ctx.drawImage(
            sprite,
            col * frameWidth, row * frameHeight, frameWidth, frameHeight,
            player.x, player.y, player.width, player.height
          );
        }
        ctx.restore();
      }
      window._lastScore = score;
      if (gameOver) {
        ctx.fillStyle = wonGame ? "green" : "red";
        ctx.font = "60px Arial Black";
        ctx.fillText(wonGame ? "CONGRATS!" : "GAME OVER", canvas.width / 2 - 180, canvas.height / 2);
        ctx.font = "20px Arial";
        if (!wonGame) {
          ctx.fillText("Press 'R' to restart or Press 'B' to go back to menu", canvas.width / 2.25 - 80, canvas.height / 2 + 40);
        }
      }
    }
    window.startGame = function(){
  player.y = ground - player.height;
  baka.y = ground;
  updateGreenZone();
  gameOver = false;
  if (typeof window.showHUD === 'function') window.showHUD();  // <-- show score HUD
      // cancel any previous RAF to avoid stacking loops, then start a single RAF
      try { if (window._rafId) cancelAnimationFrame(window._rafId); window._rafId = null; } catch (e) {}
      try { window._rafId = requestAnimationFrame(update); } catch (e) { requestAnimationFrame(update); }
};
    window.restartGame = restartGame;

  })();  


});
