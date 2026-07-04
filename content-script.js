// ── YouTube Clean Mode ────────────────────────────────────────────────────────

// ── 0. Inject styles ──────────────────────────────────────────────────────────
function injectStyles() {
    if (document.getElementById('yt-cm-styles')) return;
    const s = document.createElement('style');
    s.id = 'yt-cm-styles';
    s.textContent = `
        /* Feature 1: hide control bar while hovering over video */
        #movie_player.yt-cm-hide .ytp-chrome-bottom,
        #movie_player.yt-cm-hide .ytp-gradient-bottom,
        #movie_player.yt-cm-hide .ytp-chrome-top,
        #movie_player.yt-cm-hide .ytp-gradient-top {
            opacity: 0 !important;
            pointer-events: none !important;
            transition: opacity 0.12s ease !important;
        }

        /* Feature 2: Windowed Fullscreen — cascade 100vh down to the player */
        html.yt-cm-wfs,
        html.yt-cm-wfs body { overflow: hidden !important; height: 100vh !important; }

        html.yt-cm-wfs #masthead-container { display: none !important; }

        html.yt-cm-wfs ytd-app {
            --ytd-masthead-height: 0px !important;
            height: 100vh !important;
        }
        html.yt-cm-wfs ytd-page-manager {
            margin-top: 0 !important;
            top: 0 !important;
            height: 100vh !important;
            overflow: hidden !important;
        }
        html.yt-cm-wfs ytd-watch-flexy {
            height: 100vh !important;
            overflow: hidden !important;
            padding-top: 0 !important;
            margin-top: 0 !important;
        }
        html.yt-cm-wfs #columns {
            height: 100vh !important;
            overflow: hidden !important;
        }
        html.yt-cm-wfs #secondary,
        html.yt-cm-wfs #secondary-inner { display: none !important; }

        html.yt-cm-wfs #primary {
            height: 100vh !important;
            width: 100% !important;
            max-width: none !important;
            min-width: 0 !important;
            flex: 1 1 100% !important;
            overflow: hidden !important;
            padding: 0 !important;
            margin: 0 !important;
        }
        html.yt-cm-wfs #primary-inner {
            height: 100vh !important;
            overflow: hidden !important;
            padding: 0 !important;
        }
        html.yt-cm-wfs ytd-player,
        html.yt-cm-wfs #container.ytd-player,
        html.yt-cm-wfs #movie_player {
            width: 100% !important;
            height: 100vh !important;
            max-width: none !important;
            max-height: none !important;
        }
        html.yt-cm-wfs #below,
        html.yt-cm-wfs ytd-watch-metadata,
        html.yt-cm-wfs ytd-comments,
        html.yt-cm-wfs ytd-live-chat-frame { display: none !important; }
    `;
    (document.head || document.documentElement).appendChild(s);
}

// ── 1. Feature 1: Hide control bar on hover ───────────────────────────────────
const CTRL_BAR_H = 60;
const CLS_HIDE   = 'yt-cm-hide';
let playerEl     = null;

document.addEventListener('mousemove', (e) => {
    if (!playerEl) return;
    const r = playerEl.getBoundingClientRect();
    const over = e.clientX >= r.left && e.clientX <= r.right
              && e.clientY >= r.top  && e.clientY <= r.bottom;
    if (!over) { playerEl.classList.remove(CLS_HIDE); return; }
    playerEl.classList.toggle(CLS_HIDE, (r.bottom - e.clientY) > CTRL_BAR_H);
}, { passive: true });

// ── 2. Feature 2: Windowed Fullscreen ────────────────────────────────────────
let isWFS = false;

function enterWFS() {
    if (isWFS) return;
    document.documentElement.classList.add('yt-cm-wfs');
    window.scrollTo(0, 0);
    isWFS = true;
    document.addEventListener('keydown', onWFSKey, true);
    // Give the browser one layout frame, then fire resize so YouTube's
    // player redraws the video into its new (full-viewport) dimensions.
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
}
function exitWFS() {
    if (!isWFS) return;
    document.documentElement.classList.remove('yt-cm-wfs');
    isWFS = false;
    document.removeEventListener('keydown', onWFSKey, true);
}
function onWFSKey(e) { if (e.key === 'Escape') exitWFS(); }
function toggleWFS() { isWFS ? exitWFS() : enterWFS(); }

// ── 3. Player detection ───────────────────────────────────────────────────────
function findPlayer() {
    const p = document.getElementById('movie_player');
    if (p) { playerEl = p; return; }
    const obs = new MutationObserver(() => {
        const p2 = document.getElementById('movie_player');
        if (p2) { playerEl = p2; obs.disconnect(); }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
}

function init() { injectStyles(); findPlayer(); }

document.addEventListener('yt-navigate-finish',   init);
document.addEventListener('yt-page-data-updated', init);

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'toggleWindowedFS') toggleWFS();
});

injectStyles();
document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
