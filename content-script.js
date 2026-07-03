// ─── YouTube Clean Mode ───────────────────────────────────────────────────────
// Injected into every youtube.com page.
// ─────────────────────────────────────────────────────────────────────────────

// ── 0. Inject CSS directly via a <style> tag ─────────────────────────────────
// This is more reliable than the manifest CSS file because it is inserted
// INSIDE the page's document, giving it higher effective priority.

function injectStyles() {
    if (document.getElementById('yt-cm-styles')) return;
    const s = document.createElement('style');
    s.id = 'yt-cm-styles';
    s.textContent = `
        /* ── Feature 1: hide bottom controls while hovering video ── */
        #movie_player.yt-cm-hide .ytp-chrome-bottom,
        #movie_player.yt-cm-hide .ytp-gradient-bottom,
        #movie_player.yt-cm-hide .ytp-chrome-top,
        #movie_player.yt-cm-hide .ytp-gradient-top {
            opacity: 0 !important;
            pointer-events: none !important;
            transition: opacity 0.12s ease !important;
        }
        #movie_player.yt-cm-hide {
            cursor: none !important;
        }

        /* ── Feature 2: windowed-fullscreen wrapper ── */
        #yt-cm-wfs-wrapper {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100vw !important; height: 100vh !important;
            z-index: 2147483647 !important;
            background: #000 !important;
            display: block !important;
        }
        #yt-cm-wfs-wrapper #movie_player {
            width: 100vw !important;
            height: 100vh !important;
            position: relative !important;
            max-width: unset !important;
            max-height: unset !important;
        }
        #yt-cm-wfs-wrapper video {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
        }
    `;
    (document.head || document.documentElement).appendChild(s);
}

// ── 1. Feature 1 – Hide controls on hover ────────────────────────────────────

const CTRL_BAR_H = 60;          // px strip at bottom where controls live
const CLS_HIDE   = 'yt-cm-hide';
let playerEl     = null;

function updateControlVisibility(clientX, clientY) {
    if (!playerEl) return;
    const r = playerEl.getBoundingClientRect();

    // Is the cursor actually over the player?
    const overPlayer = clientX >= r.left && clientX <= r.right
                    && clientY >= r.top  && clientY <= r.bottom;

    if (!overPlayer) {
        // Cursor left the player — always show controls
        playerEl.classList.remove(CLS_HIDE);
        return;
    }

    // Inside player: hide unless cursor is in the bottom control-bar strip
    const inCtrlBar = (r.bottom - clientY) <= CTRL_BAR_H;
    if (inCtrlBar) {
        playerEl.classList.remove(CLS_HIDE);
    } else {
        playerEl.classList.add(CLS_HIDE);
    }
}

// Listen at the DOCUMENT level so we also capture movement
// inside YouTube's fullscreen (where the player IS the document).
function onDocMouseMove(e) {
    updateControlVisibility(e.clientX, e.clientY);
}
document.addEventListener('mousemove', onDocMouseMove, { passive: true });

// ── 2. Feature 2 – Windowed Fullscreen ───────────────────────────────────────
// We PHYSICALLY MOVE #movie_player into a fixed-position wrapper div that we
// append to <html>. This bypasses any ancestor CSS transform/will-change that
// would otherwise prevent position:fixed from covering the viewport.

let isWFS            = false;
let wfsWrapper       = null;
let wfsOrigParent    = null;
let wfsOrigNextSib   = null;

function enterWFS() {
    const player = document.getElementById('movie_player');
    if (!player || isWFS) return;

    // Remember where the player lives in the DOM
    wfsOrigParent  = player.parentElement;
    wfsOrigNextSib = player.nextSibling;

    // Build the overlay wrapper
    wfsWrapper = document.createElement('div');
    wfsWrapper.id = 'yt-cm-wfs-wrapper';
    document.documentElement.appendChild(wfsWrapper);

    // Move the player into it
    wfsWrapper.appendChild(player);

    isWFS = true;
    document.addEventListener('keydown', onWFSKey, true);
}

function exitWFS() {
    if (!isWFS || !wfsWrapper) return;

    const player = document.getElementById('movie_player');
    if (player && wfsOrigParent) {
        // Put the player back exactly where it was
        if (wfsOrigNextSib && wfsOrigNextSib.isConnected
                           && wfsOrigNextSib.parentElement === wfsOrigParent) {
            wfsOrigParent.insertBefore(player, wfsOrigNextSib);
        } else {
            wfsOrigParent.appendChild(player);
        }
    }

    wfsWrapper.remove();
    wfsWrapper       = null;
    wfsOrigParent    = null;
    wfsOrigNextSib   = null;
    isWFS            = false;

    document.removeEventListener('keydown', onWFSKey, true);
}

function onWFSKey(e) {
    if (e.key === 'Escape') exitWFS();
}

function toggleWFS() {
    if (isWFS) exitWFS(); else enterWFS();
}

// ── 3. Player element detection ───────────────────────────────────────────────

let playerObserver = null;

function findPlayer() {
    const p = document.getElementById('movie_player');
    if (p) {
        playerEl = p;
        if (playerObserver) { playerObserver.disconnect(); playerObserver = null; }
        return;
    }
    // Not in DOM yet — watch for it
    if (playerObserver) return;
    playerObserver = new MutationObserver(() => {
        const p2 = document.getElementById('movie_player');
        if (p2) {
            playerEl = p2;
            playerObserver.disconnect();
            playerObserver = null;
        }
    });
    playerObserver.observe(document.documentElement, { childList: true, subtree: true });
}

function init() {
    injectStyles();
    findPlayer();
}

// ── 4. SPA navigation wiring ─────────────────────────────────────────────────

document.addEventListener('yt-navigate-finish',    init);
document.addEventListener('yt-page-data-updated',  init);

// ── 5. Extension button click ─────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'toggleWindowedFS') toggleWFS();
});

// ── 6. Boot ───────────────────────────────────────────────────────────────────

injectStyles();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
