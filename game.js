/* game.js — global state shared across tabs (localStorage) */
(function () {
  const KEY_SQUARES = "squares";
  const KEY_GAMEOVER = "gameOver";
  const KEY_MARINE_LAST = "marine_last_index";
  const KEY_STURGEON_DONE = "sturgeon_done";

  // Default + sanity limits (prevents the "1582 forever" situation if bad data gets stored)
  const DEFAULT_SQUARES = 10;           // change if you want
  const MAX_REASONABLE_SQUARES = 300;   // adjust if you expect bigger numbers

  function num(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function clampSquares(v) {
    const n = num(v, DEFAULT_SQUARES);
    if (!Number.isFinite(n)) return DEFAULT_SQUARES;
    if (n < 0) return 0;
    if (n > MAX_REASONABLE_SQUARES) return DEFAULT_SQUARES;
    return n;
  }

  function getSquares() {
    return clampSquares(localStorage.getItem(KEY_SQUARES));
  }

  function setSquares(v) {
    const next = clampSquares(v);
    localStorage.setItem(KEY_SQUARES, String(next));
    // Game Over if 0
    if (next <= 0) localStorage.setItem(KEY_GAMEOVER, "true");
  }

  function addSquares(delta) {
    const next = getSquares() + num(delta, 0);
    setSquares(next);
    renderSquares();
  }

  // Writes squares to common UI targets (optional convenience)
  function renderSquares() {
    const s = getSquares();
    const text = Number.isInteger(s) ? String(s) : s.toFixed(1);

    // 1) any element with data-game="squares"
    document.querySelectorAll('[data-game="squares"]').forEach((el) => {
      el.textContent = text;
    });

    // 2) common ids used in this project
    const idList = ["sqNow", "squaresValue", "squaresCount"];
    idList.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    });
  }

  function resetGame() {
    localStorage.setItem(KEY_GAMEOVER, "false");
    localStorage.setItem(KEY_SQUARES, String(DEFAULT_SQUARES));
    localStorage.removeItem(KEY_MARINE_LAST);
    localStorage.removeItem(KEY_STURGEON_DONE);
    renderSquares();
  }

  // Game Over overlay (all tabs)
  function mountGameOverOverlay() {
    const wrap = document.createElement("div");
    wrap.id = "gameOverOverlay";
    wrap.style.cssText = `
      position:fixed; inset:0; display:none; align-items:center; justify-content:center;
      background:#000; z-index:99999; padding:18px;
    `;

    wrap.innerHTML = `
      <div style="max-width:720px; width:min(92vw,720px); text-align:center; font-family:American Typewriter, serif;">
        <div style="color:#FF1600; font-weight:900; font-size:48px; margin-bottom:10px;">Game Over…</div>
        <div style="color:#FF1600; font-weight:900; font-size:22px; margin-bottom:14px;">Your boat has sunk.</div>
        <div style="color:#FF1600; font-weight:900; font-size:18px; margin-bottom:18px;">Do you wanna try again?</div>
        <button id="tryAgainBtn" style="
          font-family:inherit; font-weight:900; font-size:18px; cursor:pointer;
          padding:12px 18px; border-radius:14px; border:2px solid rgba(255,255,255,.25);
          background:#314e7d; color:#fff;
        ">Try Again</button>
      </div>
    `;

    document.body.appendChild(wrap);

    wrap.querySelector("#tryAgainBtn").addEventListener("click", () => {
      resetGame();
      window.location.href = "index.html";
    });

    function syncOverlay() {
      const over = localStorage.getItem(KEY_GAMEOVER) === "true";
      wrap.style.display = over ? "flex" : "none";
    }

    window.addEventListener("storage", (ev) => {
      if (ev.key === KEY_GAMEOVER || ev.key === KEY_SQUARES) {
        renderSquares();
        syncOverlay();
      }
    });

    syncOverlay();
  }

  // Public API (also includes helpers used by other pages)
  const GAME = {
    keys: {
      squares: KEY_SQUARES,
      gameOver: KEY_GAMEOVER,
      marineLast: KEY_MARINE_LAST,
      sturgeonDone: KEY_STURGEON_DONE,
    },
    defaults: {
      squares: DEFAULT_SQUARES,
    },

    getSquares,
    setSquares,
    addSquares,
    renderSquares,
    resetGame,

    // Backwards-compatible helpers (some pages referenced these)
    getNumber(key, fallback = 0) {
      return num(localStorage.getItem(key), fallback);
    },
    setNumber(key, value) {
      localStorage.setItem(key, String(num(value, 0)));
    },
  };

  window.GAME = GAME;

  document.addEventListener("DOMContentLoaded", () => {
    // init + sanity
    if (localStorage.getItem(KEY_SQUARES) == null) {
      localStorage.setItem(KEY_SQUARES, String(DEFAULT_SQUARES));
    } else {
      // fix broken/huge stored values
      localStorage.setItem(KEY_SQUARES, String(getSquares()));
    }
    if (localStorage.getItem(KEY_GAMEOVER) == null) {
      localStorage.setItem(KEY_GAMEOVER, "false");
    }

    renderSquares();
    mountGameOverOverlay();
  });
})();
