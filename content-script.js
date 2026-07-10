// ── YouTube Clean Mode ────────────────────────────────────────────────────────

// ── 0. Inject styles ──────────────────────────────────────────────────────────
function injectStyles() {
    if (document.getElementById('yt-cm-styles')) return;
    const s = document.createElement('style');
    s.id = 'yt-cm-styles';
    s.textContent = `
        /* Controls Opacity — only when YouTube is actively showing controls.
           Wildcard [class*="bezel"] covers all bezel variants so the toast is never dimmed.
           #yt-cm-timestamp is excluded so the toggle fully controls its visibility. */
        #movie_player:not(.ytp-autohide) > *:not(.html5-video-container):not(.ytp-caption-window-container):not([class*="bezel"]):not(#yt-cm-timestamp) {
            opacity: var(--yt-cm-ctrl-opacity, 1) !important;
            transition: opacity 0.15s ease !important;
        }

        /* Hide Controls on Hover — highest priority override. Bezel and timestamp excluded. */
        #movie_player.yt-cm-hide > *:not(.html5-video-container):not(.ytp-caption-window-container):not([class*="bezel"]):not(#yt-cm-timestamp) {
            opacity: 0 !important;
            pointer-events: none !important;
        }

        /* Explicit override: always force any bezel element to full opacity
           so the pause/resume/seek toast is visible at every opacity level. */
        #movie_player [class*="bezel"] {
            opacity: 1 !important;
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

        /* Feature 3: Cinema Mode — masthead fade; bars are injected by JS */
        html.yt-cm-cinema-active #masthead-container {
            opacity: 0.12 !important;
            transition: opacity 0.4s ease !important;
            pointer-events: none !important;
        }
        .yt-cm-bar {
            position: fixed !important;
            background: rgba(0, 0, 0, 0.86) !important;
            z-index: 2050 !important;
            pointer-events: none !important;
            transition: opacity 0.35s ease !important;
        }

        /* Feature 4: Timestamp Overlay */
        #yt-cm-timestamp {
            position: absolute !important;
            top: 10px;
            left: 4px;
            z-index: 3000 !important;
            background: rgba(0, 0, 0, 0.72) !important;
            color: #fff !important;
            font-family: 'Roboto', 'YouTube Noto', Arial, sans-serif !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            letter-spacing: 0.04em !important;
            padding: 3px 8px !important;
            border-radius: 4px !important;
            cursor: default !important;
            user-select: none !important;
            opacity: 0 !important;
            transition: opacity 0.2s ease !important;
            white-space: nowrap !important;
        }
        #yt-cm-timestamp.yt-cm-ts-visible {
            opacity: var(--yt-cm-ctrl-opacity, 1) !important;
        }
    `;
    (document.head || document.documentElement).appendChild(s);
}

// ── 1. Feature 1: Hide control bar on hover ───────────────────────────────────
const CTRL_BAR_H        = 60;
const CLS_HIDE          = 'yt-cm-hide';
let playerEl            = null;
let isHideControlsEnabled = true;  // default on; loaded from storage below

document.addEventListener('mousemove', (e) => {
    if (!playerEl || !isHideControlsEnabled) {
        if (playerEl) playerEl.classList.remove(CLS_HIDE);
        return;
    }
    const r = playerEl.getBoundingClientRect();
    const over = e.clientX >= r.left && e.clientX <= r.right
              && e.clientY >= r.top  && e.clientY <= r.bottom;
    if (!over) { playerEl.classList.remove(CLS_HIDE); return; }
    playerEl.classList.toggle(CLS_HIDE, (r.bottom - e.clientY) > CTRL_BAR_H);
}, { passive: true });

function toggleHideControls() {
    isHideControlsEnabled = !isHideControlsEnabled;
    if (!isHideControlsEnabled && playerEl) playerEl.classList.remove(CLS_HIDE);
    chrome.storage.local.set({ hideControls: isHideControlsEnabled });
}

// ── 2. Feature 2: Windowed Fullscreen ────────────────────────────────────────
let isWFS = false;

function enterWFS() {
    if (isWFS) return;
    document.documentElement.classList.add('yt-cm-wfs');
    window.scrollTo(0, 0);
    isWFS = true;
    document.addEventListener('keydown', onWFSKey, true);
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
}
function exitWFS() {
    if (!isWFS) return;
    document.documentElement.classList.remove('yt-cm-wfs');
    isWFS = false;
    document.removeEventListener('keydown', onWFSKey, true);
    window.scrollTo(0, 0);
    // Let the CSS revert in one frame, then tell YouTube's player to re-measure
    requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
        setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
    });
}
function onWFSKey(e) { if (e.key === 'Escape') exitWFS(); }
function toggleWFS() { isWFS ? exitWFS() : enterWFS(); }

// ── 3. Feature 3: Cinema Mode ─────────────────────────────────────────────────
// Four fixed <div> bars surround the player (top / bottom / left / right).
// They are appended directly to <body> with position:fixed so no parent
// overflow:hidden can clip them, and they never cover the player itself.

let isCinema  = false;
let cinemaBars = null;  // { top, bottom, left, right }

function placeBars() {
    if (!cinemaBars || !playerEl) return;
    const r = playerEl.getBoundingClientRect();
    const W = window.innerWidth, H = window.innerHeight;

    Object.assign(cinemaBars.top.style,    { top:'0',         left:'0',       width: W+'px',              height: Math.max(0,r.top)+'px' });
    Object.assign(cinemaBars.bottom.style, { top: r.bottom+'px', left:'0',    width: W+'px',              height: Math.max(0,H-r.bottom)+'px' });
    Object.assign(cinemaBars.left.style,   { top: r.top+'px', left:'0',       width: Math.max(0,r.left)+'px', height: r.height+'px' });
    Object.assign(cinemaBars.right.style,  { top: r.top+'px', left: r.right+'px', width: Math.max(0,W-r.right)+'px', height: r.height+'px' });
}

function buildBars() {
    if (cinemaBars) return;
    cinemaBars = {};
    ['top','bottom','left','right'].forEach(side => {
        const d = document.createElement('div');
        d.className = 'yt-cm-bar';
        d.style.opacity = '0';
        document.body.appendChild(d);
        cinemaBars[side] = d;
    });
    placeBars();
    requestAnimationFrame(() => Object.values(cinemaBars).forEach(d => d.style.opacity = '1'));
    window.addEventListener('resize', placeBars, { passive: true });
    window.addEventListener('scroll', placeBars, { passive: true });
}

function destroyBars() {
    if (!cinemaBars) return;
    const bars = cinemaBars;
    cinemaBars = null;
    Object.values(bars).forEach(d => {
        d.style.opacity = '0';
        setTimeout(() => d.remove(), 380);
    });
    window.removeEventListener('resize', placeBars);
    window.removeEventListener('scroll', placeBars);
}

function enterCinema() {
    if (isCinema) return;
    isCinema = true;
    document.documentElement.classList.add('yt-cm-cinema-active');
    buildBars();
}
function exitCinema() {
    if (!isCinema) return;
    isCinema = false;
    document.documentElement.classList.remove('yt-cm-cinema-active');
    destroyBars();
}
function toggleCinema() { isCinema ? exitCinema() : enterCinema(); }

// ── Controls Opacity state ───────────────────────────────────────────────────
let controlOpacity   = 1;    // 0.0 – 1.0, mirrors storage
let isOpacityEnabled = true; // toggle: off = force 1.0 (fully visible)

function applyOpacity() {
    const v = isOpacityEnabled ? controlOpacity : 1;
    document.documentElement.style.setProperty('--yt-cm-ctrl-opacity', v);
}

// ── Feature 4: Timestamp Overlay ─────────────────────────────────────────────
let isTimestampVisible  = false;
let isShowingRemaining  = false;   // false = current/total, true = remaining/total
let timestampEl         = null;

// ── Drag state ────────────────────────────────────────────────────────────────
let _dragStartX   = 0, _dragStartY   = 0;
let _dragOrigLeft = 0, _dragOrigTop  = 0;
let _dragging     = false;
const DRAG_THRESHOLD = 4;  // px — below this = treated as a click

// Position stored as fractions of player size (0.0–1.0) for resize-consistency
let _tsPosX = 0.01;   // default: near left
let _tsPosY = 0.03;   // default: near top

function applyTsPosition() {
    if (!timestampEl || !playerEl) return;
    const pr  = playerEl.getBoundingClientRect();
    const elW = timestampEl.offsetWidth  || 0;
    const elH = timestampEl.offsetHeight || 0;
    const left = Math.min(Math.max(0, _tsPosX * pr.width),  pr.width  - elW);
    const top  = Math.min(Math.max(0, _tsPosY * pr.height), pr.height - elH);
    timestampEl.style.left = left + 'px';
    timestampEl.style.top  = top  + 'px';
}

function saveTsPosition() {
    chrome.storage.local.set({ tsPosX: _tsPosX, tsPosY: _tsPosY });
}

function onTsResize() { applyTsPosition(); }

function formatTime(secs) {
    if (!isFinite(secs) || secs < 0) return '--:--';
    secs = Math.floor(secs);
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
        ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
        : `${m}:${String(s).padStart(2,'0')}`;
}

function getVideo() {
    return document.querySelector('#movie_player video');
}

function ensureTimestampEl() {
    if (!timestampEl || !document.contains(timestampEl)) {
        timestampEl = document.getElementById('yt-cm-timestamp');
        if (!timestampEl && playerEl) {
            timestampEl = document.createElement('div');
            timestampEl.id = 'yt-cm-timestamp';
            playerEl.appendChild(timestampEl);
        }
    }
    return timestampEl;
}

function onTimeUpdate() {
    const el = ensureTimestampEl();
    if (!el) return;
    const v = getVideo();
    if (!v) { el.textContent = '--:-- / --:--'; return; }
    if (isShowingRemaining) {
        const remaining = v.duration - v.currentTime;
        el.textContent = isFinite(remaining)
            ? `-${formatTime(remaining)} / ${formatTime(v.duration)}`
            : '--:-- / --:--';
    } else {
        el.textContent = `${formatTime(v.currentTime)} / ${formatTime(v.duration)}`;
    }
}

// ── Drag handlers ─────────────────────────────────────────────────────────────
function onTsDragMove(e) {
    const dx = e.clientX - _dragStartX;
    const dy = e.clientY - _dragStartY;
    if (!_dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    _dragging = true;
    timestampEl.classList.add('yt-cm-dragging');

    const pr = playerEl.getBoundingClientRect();
    const elW = timestampEl.offsetWidth;
    const elH = timestampEl.offsetHeight;

    const newLeft = Math.min(Math.max(0, _dragOrigLeft + dx), pr.width  - elW);
    const newTop  = Math.min(Math.max(0, _dragOrigTop  + dy), pr.height - elH);

    timestampEl.style.left = newLeft + 'px';
    timestampEl.style.top  = newTop  + 'px';

    // Keep fractions in sync during drag so resize listener is always accurate
    _tsPosX = newLeft / pr.width;
    _tsPosY = newTop  / pr.height;
}

function onTsDragEnd(e) {
    document.removeEventListener('mousemove', onTsDragMove);
    document.removeEventListener('mouseup',   onTsDragEnd);
    if (!_dragging) {
        // Short movement = click → toggle display mode
        isShowingRemaining = !isShowingRemaining;
        onTimeUpdate();
    } else {
        saveTsPosition();   // persist final resting position
    }
    _dragging = false;
}

function onTsDragStart(e) {
    e.preventDefault();
    e.stopPropagation();
    _dragStartX  = e.clientX;
    _dragStartY  = e.clientY;
    _dragOrigLeft = parseInt(timestampEl.style.left) || timestampEl.offsetLeft;
    _dragOrigTop  = parseInt(timestampEl.style.top)  || timestampEl.offsetTop;
    _dragging    = false;
    document.addEventListener('mousemove', onTsDragMove);
    document.addEventListener('mouseup',   onTsDragEnd);
}

function showTimestamp() {
    const el = ensureTimestampEl();
    if (!el) return;
    el.classList.add('yt-cm-ts-visible');
    // Apply position after element is visible so offsetWidth is accurate
    requestAnimationFrame(() => { applyTsPosition(); onTimeUpdate(); });
    getVideo()?.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('mousedown', onTsDragStart);
    window.addEventListener('resize', onTsResize, { passive: true });
}

function hideTimestamp() {
    timestampEl?.classList.remove('yt-cm-ts-visible');
    timestampEl?.removeEventListener('mousedown', onTsDragStart);
    document.removeEventListener('mousemove', onTsDragMove);
    document.removeEventListener('mouseup',   onTsDragEnd);
    window.removeEventListener('resize', onTsResize);
    getVideo()?.removeEventListener('timeupdate', onTimeUpdate);
}

function toggleTimestamp() {
    isTimestampVisible = !isTimestampVisible;
    isTimestampVisible ? showTimestamp() : hideTimestamp();
}

// Keyboard shortcuts (ignored when typing in an input)
document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (!e.shiftKey) {
        if (e.code === 'Backquote') toggleWFS();          // `  → Windowed Fullscreen
        if (e.code === 'KeyZ')      toggleCinema();        // Z  → Cinema Mode
        if (e.code === 'KeyH')      toggleHideControls();  // H  → Hide Controls
        if (e.code === 'KeyY')      toggleTimestamp();     // Y  → Timestamp Overlay
        if (e.code === 'KeyE') {                           // E  → opacity −5%
            controlOpacity = parseFloat(Math.max(0, controlOpacity - 0.05).toFixed(2));
            applyOpacity();
            chrome.storage.local.set({ controlOpacity });
        }
        if (e.code === 'KeyR') {                           // R  → opacity +5%
            controlOpacity = parseFloat(Math.min(1, controlOpacity + 0.05).toFixed(2));
            applyOpacity();
            chrome.storage.local.set({ controlOpacity });
        }
    }

    if (e.shiftKey) {
        // (reserved for future shift shortcuts)
    }
});

// ── 4. Message handler (from popup) ──────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action === 'getState') {
        sendResponse({
            hideControls:       isHideControlsEnabled,
            wfs:                isWFS,
            cinema:             isCinema,
            isTimestampVisible: isTimestampVisible,
            opacityEnabled:     isOpacityEnabled,
            controlOpacity,
        });
    }
    else if (msg.action === 'toggleHideControls') { toggleHideControls(); }
    else if (msg.action === 'toggleWindowedFS')   { toggleWFS(); }
    else if (msg.action === 'toggleCinema')        { toggleCinema(); }
    else if (msg.action === 'toggleTimestamp')     { toggleTimestamp(); }
    else if (msg.action === 'toggleOpacity') {
        isOpacityEnabled = !isOpacityEnabled;
        applyOpacity();
        chrome.storage.local.set({ isOpacityEnabled });
    }
    else if (msg.action === 'setControlOpacity') {
        controlOpacity = Math.min(1, Math.max(0, msg.value));
        applyOpacity();
        chrome.storage.local.set({ controlOpacity });
    }
    return true;
});

// ── 5. Player detection ───────────────────────────────────────────────────────
function findPlayer() {
    const p = document.getElementById('movie_player');
    if (p) {
        playerEl = p;
        if (isCinema) playerEl.classList.add('yt-cm-cinema');
        // Re-attach timestamp overlay to new player element if it was visible
        timestampEl = null;
        if (isTimestampVisible) showTimestamp();
        return;
    }
    const obs = new MutationObserver(() => {
        const p2 = document.getElementById('movie_player');
        if (p2) {
            playerEl = p2;
            if (isCinema) playerEl.classList.add('yt-cm-cinema');
            timestampEl = null;
            if (isTimestampVisible) showTimestamp();
            obs.disconnect();
        }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
}

function init() { injectStyles(); findPlayer(); }

document.addEventListener('yt-navigate-finish',   init);
document.addEventListener('yt-page-data-updated', init);

// ── 6. Boot: load persisted preferences then initialise ──────────────────────
injectStyles();
chrome.storage.local.get(
    { hideControls: true, controlOpacity: 1, isOpacityEnabled: true, tsPosX: 0.01, tsPosY: 0.03 },
    (result) => {
        isHideControlsEnabled = result.hideControls;
        controlOpacity        = result.controlOpacity;
        isOpacityEnabled      = result.isOpacityEnabled;
        _tsPosX               = result.tsPosX;
        _tsPosY               = result.tsPosY;
        applyOpacity();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }
);
