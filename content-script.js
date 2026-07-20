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
        #movie_player:not(.ytp-autohide) > *:not(.html5-video-container):not(.ytp-caption-window-container):not([class*="bezel"]):not(#yt-cm-timestamp):not(#yt-cm-progress-bar-track):not(#yt-cm-wfs-btn) {
            opacity: var(--yt-cm-ctrl-opacity, 1) !important;
            transition: opacity 0.15s ease !important;
        }

        /* Hide Controls on Hover — highest priority override. Bezel and timestamp excluded. */
        #movie_player.yt-cm-hide > *:not(.html5-video-container):not(.ytp-caption-window-container):not([class*="bezel"]):not(#yt-cm-timestamp):not(#yt-cm-progress-bar-track):not(#yt-cm-wfs-btn) {
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

        /* Feature 5: Progress Bar */
        #yt-cm-progress-bar-track {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 3px !important;
            background: rgba(255, 255, 255, 0.15) !important;
            z-index: 3100 !important;
            pointer-events: none !important;
            opacity: 0 !important;
            overflow: visible !important;
            transition: opacity 0.25s ease !important;
        }
        #yt-cm-progress-bar-track.yt-cm-pb-visible {
            opacity: min(1, calc(var(--yt-cm-ctrl-opacity, 1) + 0.4)) !important;
        }
        /* Hide our bar while native controls are visible (cursor over player) */
        #movie_player:not(.ytp-autohide) #yt-cm-progress-bar-track.yt-cm-pb-visible {
            opacity: 0 !important;
            transition: opacity 0.15s ease !important;
        }
        #yt-cm-progress-bar-fill {
            position: relative !important;
            height: 100% !important;
            width: 0%;  /* no !important — JS inline setProperty('important') must win */
            /* comet tail: dim on the left, full colour at the tip */
            background: linear-gradient(to right, rgba(192, 57, 43, 0.05), #c0392b 100%) !important;
            overflow: visible !important;
            transition: width 0.25s linear !important;
            border-radius: 0 !important;
            box-shadow: 0 0 4px 0px rgba(255, 80, 60, 0.95) !important;
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

        /* Feature 7: Speed Indicator */
        #yt-cm-speed {
            position: absolute !important;
            top: 10px;
            left: 60px;
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
        #yt-cm-speed.yt-cm-sp-visible {
            opacity: var(--yt-cm-ctrl-opacity, 1) !important;
        }

        /* Feature 6: WFS Floating Button */
        #yt-cm-wfs-btn {
            position: absolute !important;
            z-index: 3100 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 6px !important;
            background: transparent !important;
            border: none !important;
            border-radius: 6px !important;
            color: rgba(255, 255, 255, 0.9) !important;
            cursor: default !important;
            transition: color 0.18s, background 0.18s !important;
            user-select: none !important;
            outline: none !important;
        }
        #yt-cm-wfs-btn:hover {
            color: rgba(255, 255, 255, 0.85) !important;
            background: rgba(255, 255, 255, 0.06) !important;
        }
        #yt-cm-wfs-btn.yt-cm-wfs-dragging {
            cursor: default !important;
            transition: none !important;
        }
        #yt-cm-wfs-btn.yt-cm-wfs-active {
            color: rgba(255, 255, 255, 0.65) !important;
        }
        #yt-cm-wfs-btn.yt-cm-wfs-active svg {
            transform: rotate(180deg) !important;
        }
        #yt-cm-wfs-btn svg {
            flex-shrink: 0 !important;
            transition: transform 0.18s !important;
        }
        /* Hide WFS button when no mouse movement (autohide active), show on movement */
        #movie_player.ytp-autohide #yt-cm-wfs-btn {
            opacity: 0 !important;
            pointer-events: none !important;
            transition: opacity 0.3s ease !important;
        }
        #movie_player:not(.ytp-autohide) #yt-cm-wfs-btn {
            opacity: var(--yt-cm-ctrl-opacity, 1) !important;
            pointer-events: auto !important;
            transition: opacity 0.15s ease !important;
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
function toggleWFS() { isWFS ? exitWFS() : enterWFS(); updateWFSBtn(); }

// ── Feature 6: WFS Floating Button ───────────────────────────────────────────
let wfsBtnEl       = null;
let _wfsPosX       = 0.95;   // fraction of player width  (default: top-right)
let _wfsPosY       = 0.02;   // fraction of player height
let _wfsDragStartX = 0, _wfsDragStartY = 0;
let _wfsDragOrigL  = 0, _wfsDragOrigT  = 0;
let _wfsDragging   = false;
const WFS_DRAG_THRESHOLD = 4;

function applyWFSBtnPosition() {
    if (!wfsBtnEl || !playerEl) return;
    const pr  = playerEl.getBoundingClientRect();
    const elW = wfsBtnEl.offsetWidth  || 28;
    const elH = wfsBtnEl.offsetHeight || 28;
    const left = Math.min(Math.max(0, _wfsPosX * pr.width),  pr.width  - elW);
    const top  = Math.min(Math.max(0, _wfsPosY * pr.height), pr.height - elH);
    wfsBtnEl.style.left = left + 'px';
    wfsBtnEl.style.top  = top  + 'px';
}

function saveWFSBtnPosition() {
    chrome.storage.local.set({ wfsBtnPosX: _wfsPosX, wfsBtnPosY: _wfsPosY });
}

function onWFSBtnDragMove(e) {
    const dx = e.clientX - _wfsDragStartX;
    const dy = e.clientY - _wfsDragStartY;
    if (!_wfsDragging && Math.hypot(dx, dy) < WFS_DRAG_THRESHOLD) return;
    _wfsDragging = true;
    wfsBtnEl.classList.add('yt-cm-wfs-dragging');
    const pr  = playerEl.getBoundingClientRect();
    const elW = wfsBtnEl.offsetWidth;
    const elH = wfsBtnEl.offsetHeight;
    const newLeft = Math.min(Math.max(0, _wfsDragOrigL + dx), pr.width  - elW);
    const newTop  = Math.min(Math.max(0, _wfsDragOrigT + dy), pr.height - elH);
    wfsBtnEl.style.left = newLeft + 'px';
    wfsBtnEl.style.top  = newTop  + 'px';
    _wfsPosX = newLeft / pr.width;
    _wfsPosY = newTop  / pr.height;
}

function onWFSBtnDragEnd(e) {
    document.removeEventListener('mousemove', onWFSBtnDragMove);
    document.removeEventListener('mouseup',   onWFSBtnDragEnd);
    wfsBtnEl.classList.remove('yt-cm-wfs-dragging');
    if (!_wfsDragging) {
        toggleWFS();   // short tap = toggle
    } else {
        saveWFSBtnPosition();
    }
    _wfsDragging = false;
}

function onWFSBtnDragStart(e) {
    e.preventDefault();
    e.stopPropagation();
    _wfsDragStartX = e.clientX;
    _wfsDragStartY = e.clientY;
    _wfsDragOrigL  = parseInt(wfsBtnEl.style.left) || wfsBtnEl.offsetLeft;
    _wfsDragOrigT  = parseInt(wfsBtnEl.style.top)  || wfsBtnEl.offsetTop;
    _wfsDragging   = false;
    document.addEventListener('mousemove', onWFSBtnDragMove);
    document.addEventListener('mouseup',   onWFSBtnDragEnd);
}

function updateWFSBtn() {
    if (!wfsBtnEl) return;
    wfsBtnEl.classList.toggle('yt-cm-wfs-active', isWFS);
    wfsBtnEl.title = isWFS ? 'Exit Windowed Fullscreen (` or Esc) · Drag to move' : 'Windowed Fullscreen (`) · Drag to move';
}

function onWFSBtnResize() { applyWFSBtnPosition(); }

function injectWFSBtn() {
    if (!playerEl) return;
    if (!location.pathname.startsWith('/watch')) return;

    // Re-use existing element if already inside player
    if (document.getElementById('yt-cm-wfs-btn')) {
        wfsBtnEl = document.getElementById('yt-cm-wfs-btn');
        updateWFSBtn();
        requestAnimationFrame(applyWFSBtnPosition);
        return;
    }

    wfsBtnEl = document.createElement('button');
    wfsBtnEl.id = 'yt-cm-wfs-btn';
    wfsBtnEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
        </svg>
    `;
    wfsBtnEl.addEventListener('mousedown', onWFSBtnDragStart);
    playerEl.appendChild(wfsBtnEl);
    updateWFSBtn();
    requestAnimationFrame(() => { applyWFSBtnPosition(); });
    window.addEventListener('resize', onWFSBtnResize, { passive: true });
}

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

// ── Feature 5: Progress Bar ──────────────────────────────────────────────────
let isProgressBarVisible = false;
let progressTrackEl      = null;
let progressFillEl       = null;
let _progressRafId       = null;  // rAF handle

function ensureProgressBarEl() {
    if (!progressTrackEl || !document.contains(progressTrackEl)) {
        progressTrackEl = document.getElementById('yt-cm-progress-bar-track');
        progressFillEl  = progressTrackEl
            ? progressTrackEl.querySelector('div')
            : null;
        if (!progressTrackEl && playerEl) {
            progressTrackEl = document.createElement('div');
            progressTrackEl.id = 'yt-cm-progress-bar-track';
            progressFillEl = document.createElement('div');
            progressFillEl.id = 'yt-cm-progress-bar-fill';
            progressTrackEl.appendChild(progressFillEl);
            playerEl.appendChild(progressTrackEl);
        }
    }
    return progressTrackEl;
}

function _progressRafLoop() {
    if (!isProgressBarVisible) return;   // stop if toggled off
    if (progressFillEl) {
        const v = getVideo();
        if (v && isFinite(v.duration) && v.duration > 0) {
            const pct = (v.currentTime / v.duration) * 100;
            progressFillEl.style.setProperty('width', pct.toFixed(3) + '%', 'important');
        }
    }
    _progressRafId = requestAnimationFrame(_progressRafLoop);
}

function showProgressBar() {
    const el = ensureProgressBarEl();
    if (!el) return;
    el.classList.add('yt-cm-pb-visible');
    if (_progressRafId) cancelAnimationFrame(_progressRafId);
    _progressRafLoop();
}

function hideProgressBar() {
    progressTrackEl?.classList.remove('yt-cm-pb-visible');
    if (_progressRafId) { cancelAnimationFrame(_progressRafId); _progressRafId = null; }
    if (progressFillEl) progressFillEl.style.width = '0%';
}

function toggleProgressBar() {
    isProgressBarVisible = !isProgressBarVisible;
    isProgressBarVisible ? showProgressBar() : hideProgressBar();
    chrome.storage.local.set({ progressBar: isProgressBarVisible });
}

// ── Feature 4: Timestamp Overlay ─────────────────────────────────────────────
let isTimestampVisible  = true;
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
    chrome.storage.local.set({ timestamp: isTimestampVisible });
}

// ── Feature 7: Speed Indicator ───────────────────────────────────────────────
let isSpeedVisible = false;
let speedEl        = null;

// Drag state
let _spDragStartX = 0, _spDragStartY = 0;
let _spDragOrigL  = 0, _spDragOrigT  = 0;
let _spDragging   = false;

// Position as fractions of player size
let _spPosX = 0.08;   // default: near left, below timestamp
let _spPosY = 0.03;

function applySpPosition() {
    if (!speedEl || !playerEl) return;
    const pr  = playerEl.getBoundingClientRect();
    const elW = speedEl.offsetWidth  || 0;
    const elH = speedEl.offsetHeight || 0;
    const left = Math.min(Math.max(0, _spPosX * pr.width),  pr.width  - elW);
    const top  = Math.min(Math.max(0, _spPosY * pr.height), pr.height - elH);
    speedEl.style.left = left + 'px';
    speedEl.style.top  = top  + 'px';
}

function saveSpPosition() {
    chrome.storage.local.set({ spPosX: _spPosX, spPosY: _spPosY });
}

function updateSpeedDisplay() {
    if (!speedEl) return;
    const v = getVideo();
    const rate = v ? v.playbackRate : 1;
    speedEl.textContent = rate === 1 ? '1×' : `${parseFloat(rate.toFixed(2))}×`;
}

function onSpeedChange() { updateSpeedDisplay(); }
function onSpResize()    { applySpPosition(); }

function ensureSpeedEl() {
    if (!speedEl || !document.contains(speedEl)) {
        speedEl = document.getElementById('yt-cm-speed');
        if (!speedEl && playerEl) {
            speedEl = document.createElement('div');
            speedEl.id = 'yt-cm-speed';
            playerEl.appendChild(speedEl);
        }
    }
    return speedEl;
}

function onSpDragMove(e) {
    const dx = e.clientX - _spDragStartX;
    const dy = e.clientY - _spDragStartY;
    if (!_spDragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    _spDragging = true;
    const pr  = playerEl.getBoundingClientRect();
    const elW = speedEl.offsetWidth;
    const elH = speedEl.offsetHeight;
    const newLeft = Math.min(Math.max(0, _spDragOrigL + dx), pr.width  - elW);
    const newTop  = Math.min(Math.max(0, _spDragOrigT + dy), pr.height - elH);
    speedEl.style.left = newLeft + 'px';
    speedEl.style.top  = newTop  + 'px';
    _spPosX = newLeft / pr.width;
    _spPosY = newTop  / pr.height;
}

function onSpDragEnd() {
    document.removeEventListener('mousemove', onSpDragMove);
    document.removeEventListener('mouseup',   onSpDragEnd);
    if (!_spDragging) {
        // tap = no action (speed display is read-only)
    } else {
        saveSpPosition();
    }
    _spDragging = false;
}

function onSpDragStart(e) {
    e.preventDefault();
    e.stopPropagation();
    _spDragStartX = e.clientX;
    _spDragStartY = e.clientY;
    _spDragOrigL  = parseInt(speedEl.style.left) || speedEl.offsetLeft;
    _spDragOrigT  = parseInt(speedEl.style.top)  || speedEl.offsetTop;
    _spDragging   = false;
    document.addEventListener('mousemove', onSpDragMove);
    document.addEventListener('mouseup',   onSpDragEnd);
}

function showSpeed() {
    const el = ensureSpeedEl();
    if (!el) return;
    el.classList.add('yt-cm-sp-visible');
    requestAnimationFrame(() => { applySpPosition(); updateSpeedDisplay(); });
    getVideo()?.addEventListener('ratechange', onSpeedChange);
    el.addEventListener('mousedown', onSpDragStart);
    window.addEventListener('resize', onSpResize, { passive: true });
}

function hideSpeed() {
    speedEl?.classList.remove('yt-cm-sp-visible');
    speedEl?.removeEventListener('mousedown', onSpDragStart);
    document.removeEventListener('mousemove', onSpDragMove);
    document.removeEventListener('mouseup',   onSpDragEnd);
    window.removeEventListener('resize', onSpResize);
    getVideo()?.removeEventListener('ratechange', onSpeedChange);
}

function toggleSpeed() {
    isSpeedVisible = !isSpeedVisible;
    isSpeedVisible ? showSpeed() : hideSpeed();
    chrome.storage.local.set({ speedIndicator: isSpeedVisible });
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
        if (e.code === 'KeyX')      toggleSpeed();         // X  → Speed Indicator
        if (e.code === 'KeyP')      toggleProgressBar();   // P  → Progress Bar
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
            hideControls:        isHideControlsEnabled,
            wfs:                 isWFS,
            cinema:              isCinema,
            isTimestampVisible:  isTimestampVisible,
            opacityEnabled:      isOpacityEnabled,
            controlOpacity,
            progressBar:         isProgressBarVisible,
        });
    }
    else if (msg.action === 'toggleHideControls') { toggleHideControls(); }
    else if (msg.action === 'toggleWindowedFS')   { toggleWFS(); }
    else if (msg.action === 'toggleCinema')        { toggleCinema(); }
    else if (msg.action === 'toggleTimestamp')     { toggleTimestamp(); }
    else if (msg.action === 'toggleProgressBar')   { toggleProgressBar(); }
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
        // Re-attach overlays to new player element if they were visible
        timestampEl     = null;
        progressTrackEl = null;
        progressFillEl  = null;
        speedEl         = null;
        if (isTimestampVisible)   showTimestamp();
        if (isProgressBarVisible) showProgressBar();
        if (isSpeedVisible)       showSpeed();
        return;
    }
    const obs = new MutationObserver(() => {
        const p2 = document.getElementById('movie_player');
        if (p2) {
            playerEl = p2;
            if (isCinema) playerEl.classList.add('yt-cm-cinema');
            timestampEl     = null;
            progressTrackEl = null;
            progressFillEl  = null;
            speedEl         = null;
            if (isTimestampVisible)   showTimestamp();
            if (isProgressBarVisible) showProgressBar();
            if (isSpeedVisible)       showSpeed();
            obs.disconnect();
        }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
}

function init() { injectStyles(); findPlayer(); injectWFSBtn(); }

document.addEventListener('yt-navigate-finish',   init);
document.addEventListener('yt-page-data-updated', init);

// ── 6. Boot: load persisted preferences then initialise ──────────────────────
injectStyles();
chrome.storage.local.get(
    { hideControls: true, controlOpacity: 1, isOpacityEnabled: true, tsPosX: 0.01, tsPosY: 0.03, progressBar: false, wfsBtnPosX: 0.95, wfsBtnPosY: 0.02, timestamp: true, speedIndicator: false, spPosX: 0.08, spPosY: 0.03 },
    (result) => {
        isHideControlsEnabled = result.hideControls;
        controlOpacity        = result.controlOpacity;
        isOpacityEnabled      = result.isOpacityEnabled;
        _tsPosX               = result.tsPosX;
        _tsPosY               = result.tsPosY;
        isProgressBarVisible  = result.progressBar;
        isTimestampVisible     = result.timestamp;
        isSpeedVisible         = result.speedIndicator;
        _spPosX                = result.spPosX;
        _spPosY                = result.spPosY;
        _wfsPosX               = result.wfsBtnPosX;
        _wfsPosY               = result.wfsBtnPosY;
        applyOpacity();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }
);
