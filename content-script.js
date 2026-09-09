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
        #movie_player:not(.ytp-autohide) > *:not(.html5-video-container):not(.ytp-caption-window-container):not([class*="bezel"]):not(#yt-cm-timestamp):not(#yt-cm-progress-bar-track):not(#yt-cm-wfs-btn):not(#yt-cm-playlist-btn):not(.yt-cm-playlist-drawer) {
            opacity: var(--yt-cm-ctrl-opacity, 1) !important;
            transition: opacity 0.15s ease !important;
        }

        /* Hide Controls on Hover — highest priority override. Bezel and timestamp excluded. */
        #movie_player.yt-cm-hide > *:not(.html5-video-container):not(.ytp-caption-window-container):not([class*="bezel"]):not(#yt-cm-timestamp):not(#yt-cm-progress-bar-track):not(#yt-cm-wfs-btn):not(#yt-cm-playlist-btn):not(.yt-cm-playlist-drawer) {
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

        /* Feature 9: WFS Floating Playlist Button & Drawer */
        #yt-cm-playlist-btn {
            position: absolute !important;
            z-index: 3100 !important;
            display: none;
            align-items: center !important;
            justify-content: center !important;
            padding: 6px !important;
            background: transparent !important;
            border: none !important;
            border-radius: 6px !important;
            color: rgba(255, 255, 255, 0.9) !important;
            cursor: default !important;
            transition: color 0.18s, background 0.18s, opacity 0.15s !important;
            user-select: none !important;
            outline: none !important;
        }
        #yt-cm-playlist-btn:hover {
            color: rgba(255, 255, 255, 0.95) !important;
            background: rgba(255, 255, 255, 0.08) !important;
        }
        #yt-cm-playlist-btn.yt-cm-playlist-dragging {
            cursor: default !important;
            transition: none !important;
        }
        #yt-cm-playlist-btn.yt-cm-playlist-active {
            color: #ff4444 !important;
            background: rgba(255, 68, 68, 0.18) !important;
        }
        #yt-cm-playlist-btn svg {
            flex-shrink: 0 !important;
        }
        #movie_player.ytp-autohide #yt-cm-playlist-btn:not(.yt-cm-playlist-active) {
            opacity: 0 !important;
            pointer-events: none !important;
            transition: opacity 0.3s ease !important;
        }
        #movie_player:not(.ytp-autohide) #yt-cm-playlist-btn,
        #yt-cm-playlist-btn.yt-cm-playlist-active {
            opacity: var(--yt-cm-ctrl-opacity, 1) !important;
            pointer-events: auto !important;
            transition: opacity 0.15s ease !important;
        }

        /* Playlist Drawer in WFS */
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer {
            position: absolute !important;
            right: 0px !important;
            top: 46px !important;
            width: 330px !important;
            max-width: calc(100vw - 40px) !important;
            max-height: min(600px, calc(100vh - 70px)) !important;
            z-index: 3150 !important;
            background: rgba(15, 15, 15, 0.94) !important;
            backdrop-filter: blur(24px) !important;
            -webkit-backdrop-filter: blur(24px) !important;
            border: 1px solid rgba(255, 255, 255, 0.14) !important;
            border-radius: 12px !important;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85) !important;
            color: #fff !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            animation: yt-cm-pl-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        }
        @keyframes yt-cm-pl-fade-in {
            from { opacity: 0; transform: translateY(-8px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer *,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer #container,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer #items,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer #content-container {
            background-color: transparent !important;
        }
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer #header,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer ytd-playlist-panel-title-renderer,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer .header {
            background: transparent !important;
            color: #fff !important;
        }
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer #video-title,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer #index,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer #byline,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer .title,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer yt-formatted-string,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer span,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer a,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer div,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer h3,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer yt-icon {
            color: #fff !important;
            fill: #fff !important;
        }
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer #byline,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer #index {
            color: rgba(255, 255, 255, 0.7) !important;
        }
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer ytd-playlist-panel-video-renderer[selected],
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer ytd-playlist-panel-video-renderer.selected,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer ytd-playlist-panel-video-renderer[selected="true"] {
            background: rgba(255, 255, 255, 0.12) !important;
            border-left: 3px solid #ff4444 !important;
        }
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer ytd-playlist-panel-video-renderer:hover {
            background: rgba(255, 255, 255, 0.06) !important;
        }
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer ::-webkit-scrollbar,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer #items::-webkit-scrollbar {
            width: 6px !important;
        }
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer ::-webkit-scrollbar-track,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer #items::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1) !important;
            border-radius: 4px !important;
        }
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer ::-webkit-scrollbar-thumb,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer #items::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.25) !important;
            border-radius: 4px !important;
        }
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer ::-webkit-scrollbar-thumb:hover,
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer #items::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.4) !important;
        }
        ytd-playlist-panel-renderer.yt-cm-playlist-drawer #items {
            max-height: 100% !important;
            overflow-y: auto !important;
        }

        /* Feature 8: Zoom in WFS */
        html.yt-cm-wfs #movie_player .html5-video-container video {
            transform: scale(var(--yt-cm-zoom, 1)) translate(var(--yt-cm-pan-x, 0px), var(--yt-cm-pan-y, 0px)) !important;
            transform-origin: center center !important;
            transition: transform 0.15s ease !important;
        }
        html.yt-cm-wfs #movie_player.yt-cm-zoomed-in:not(.ytp-autohide) .html5-video-container {
            cursor: default !important;
        }
        html.yt-cm-wfs #movie_player.yt-cm-zoom-panning:not(.ytp-autohide) .html5-video-container {
            cursor: default !important;
        }
        html.yt-cm-wfs #movie_player.ytp-autohide .html5-video-container {
            cursor: none !important;
        }
        html.yt-cm-wfs #movie_player.yt-cm-zoom-panning .html5-video-container video {
            transition: none !important;
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
    attachZoomListeners();
    updatePlaylistBtnVisibility();
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
}
function exitWFS() {
    if (!isWFS) return;
    if (isPlaylistDrawerOpen) closePlaylistDrawer();
    document.documentElement.classList.remove('yt-cm-wfs');
    isWFS = false;
    document.removeEventListener('keydown', onWFSKey, true);
    detachZoomListeners();
    resetZoom();  // always reset zoom when leaving WFS
    updatePlaylistBtnVisibility();
    window.scrollTo(0, 0);
    // Let the CSS revert in one frame, then tell YouTube's player to re-measure
    requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
        setTimeout(() => window.dispatchEvent(new Event('resize')), 150);
    });
}
function onWFSKey(e) {
    if (e.key === 'Escape') {
        if (isPlaylistDrawerOpen) {
            closePlaylistDrawer();
            return;
        }
        exitWFS();
        return;
    }

    // Intercept arrow-key seeks so YouTube never calls showControls() internally.
    // We preventDefault() to block YouTube's handler, then seek the video manually.
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Only act when focus is not inside an input / the search bar
        if (e.target.closest('input, textarea, [contenteditable]')) return;
        e.preventDefault();
        e.stopPropagation();
        const v = getVideo();
        if (v) {
            const step = e.key === 'ArrowRight' ? 5 : -5;
            v.currentTime = Math.min(v.duration || Infinity, Math.max(0, v.currentTime + step));
        }
    }
}
function toggleWFS() { isWFS ? exitWFS() : enterWFS(); updateWFSBtn(); updatePlaylistBtnVisibility(); }

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

// ── Feature 9: WFS Floating Playlist Button & Drawer ──────────────────────────
let plBtnEl               = null;
let _plPosX               = 0.91;   // default: near top-right, next to WFS button
let _plPosY               = 0.02;
let _plDragStartX         = 0, _plDragStartY = 0;
let _plDragOrigL          = 0, _plDragOrigT  = 0;
let _plDragging           = false;
let isPlaylistDrawerOpen  = false;
let _origPlParent         = null;
let _origPlNextSibling    = null;

function hasActivePlaylist() {
    if (!location.pathname.startsWith('/watch')) return false;
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.has('list')) return true;
    const pl = document.querySelector('ytd-playlist-panel-renderer');
    return !!(pl && !pl.hasAttribute('hidden') && pl.style.display !== 'none');
}

function applyPlBtnPosition() {
    if (!plBtnEl || !playerEl) return;
    const pr  = playerEl.getBoundingClientRect();
    const elW = plBtnEl.offsetWidth  || 28;
    const elH = plBtnEl.offsetHeight || 28;
    const left = Math.min(Math.max(0, _plPosX * pr.width),  pr.width  - elW);
    const top  = Math.min(Math.max(0, _plPosY * pr.height), pr.height - elH);
    plBtnEl.style.left = left + 'px';
    plBtnEl.style.top  = top  + 'px';
}

function savePlBtnPosition() {
    chrome.storage.local.set({ plBtnPosX: _plPosX, plBtnPosY: _plPosY });
}

function onPlBtnDragMove(e) {
    const dx = e.clientX - _plDragStartX;
    const dy = e.clientY - _plDragStartY;
    if (!_plDragging && Math.hypot(dx, dy) < WFS_DRAG_THRESHOLD) return;
    _plDragging = true;
    plBtnEl.classList.add('yt-cm-playlist-dragging');
    const pr  = playerEl.getBoundingClientRect();
    const elW = plBtnEl.offsetWidth;
    const elH = plBtnEl.offsetHeight;
    const newLeft = Math.min(Math.max(0, _plDragOrigL + dx), pr.width  - elW);
    const newTop  = Math.min(Math.max(0, _plDragOrigT + dy), pr.height - elH);
    plBtnEl.style.left = newLeft + 'px';
    plBtnEl.style.top  = newTop  + 'px';
    _plPosX = newLeft / pr.width;
    _plPosY = newTop  / pr.height;
}

function onPlBtnDragEnd(e) {
    document.removeEventListener('mousemove', onPlBtnDragMove);
    document.removeEventListener('mouseup',   onPlBtnDragEnd);
    plBtnEl.classList.remove('yt-cm-playlist-dragging');
    if (!_plDragging) {
        togglePlaylistDrawer();
    } else {
        savePlBtnPosition();
    }
    _plDragging = false;
}

function onPlBtnDragStart(e) {
    e.preventDefault();
    e.stopPropagation();
    _plDragStartX = e.clientX;
    _plDragStartY = e.clientY;
    _plDragOrigL  = parseInt(plBtnEl.style.left) || plBtnEl.offsetLeft;
    _plDragOrigT  = parseInt(plBtnEl.style.top)  || plBtnEl.offsetTop;
    _plDragging   = false;
    document.addEventListener('mousemove', onPlBtnDragMove);
    document.addEventListener('mouseup',   onPlBtnDragEnd);
}

function onPlBtnResize() { applyPlBtnPosition(); }

function onPlaylistOutsideClick(e) {
    if (!isPlaylistDrawerOpen) return;
    if (plBtnEl && plBtnEl.contains(e.target)) return;
    const drawer = document.querySelector('ytd-playlist-panel-renderer.yt-cm-playlist-drawer');
    if (drawer && drawer.contains(e.target)) return;
    closePlaylistDrawer();
}

function openPlaylistDrawer() {
    const panel = document.querySelector('ytd-playlist-panel-renderer');
    if (!panel || !playerEl) return;

    if (panel.parentElement !== playerEl) {
        _origPlParent = panel.parentElement;
        _origPlNextSibling = panel.nextSibling;
        playerEl.appendChild(panel);
    }

    panel.classList.add('yt-cm-playlist-drawer');
    panel.removeAttribute('hidden');
    isPlaylistDrawerOpen = true;

    if (plBtnEl) {
        plBtnEl.classList.add('yt-cm-playlist-active');
        plBtnEl.title = 'Close Playlist · Drag to move';
    }

    // Attach listener to YouTube's header close button
    const closeBtn = panel.querySelector('#header-contents yt-icon-button, button[aria-label*="Close"], #top-row-buttons yt-icon-button');
    if (closeBtn && !closeBtn._ytCmBound) {
        closeBtn._ytCmBound = true;
        closeBtn.addEventListener('click', (e) => {
            if (isWFS && isPlaylistDrawerOpen) {
                e.preventDefault();
                e.stopPropagation();
                closePlaylistDrawer();
            }
        });
    }

    // Scroll currently playing video into view
    setTimeout(() => {
        const activeItem = panel.querySelector('ytd-playlist-panel-video-renderer[selected], ytd-playlist-panel-video-renderer.selected, ytd-playlist-panel-video-renderer[selected="true"]');
        if (activeItem) {
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 60);

    // Listen for outside click to dismiss drawer
    setTimeout(() => {
        document.addEventListener('mousedown', onPlaylistOutsideClick, true);
    }, 10);
}

function closePlaylistDrawer() {
    if (!isPlaylistDrawerOpen) return;
    document.removeEventListener('mousedown', onPlaylistOutsideClick, true);

    const panel = document.querySelector('ytd-playlist-panel-renderer.yt-cm-playlist-drawer')
               || document.querySelector('ytd-playlist-panel-renderer');

    if (panel) {
        panel.classList.remove('yt-cm-playlist-drawer');
        if (_origPlParent && document.contains(_origPlParent)) {
            if (_origPlNextSibling && _origPlParent.contains(_origPlNextSibling)) {
                _origPlParent.insertBefore(panel, _origPlNextSibling);
            } else {
                _origPlParent.appendChild(panel);
            }
        }
    }

    isPlaylistDrawerOpen = false;
    if (plBtnEl) {
        plBtnEl.classList.remove('yt-cm-playlist-active');
        plBtnEl.title = 'Current Playlist · Drag to move';
    }
}

function togglePlaylistDrawer() {
    isPlaylistDrawerOpen ? closePlaylistDrawer() : openPlaylistDrawer();
}

function updatePlaylistBtnVisibility() {
    if (!plBtnEl) return;
    const shouldShow = isWFS && hasActivePlaylist();
    plBtnEl.style.display = shouldShow ? 'flex' : 'none';
    if (shouldShow) {
        applyPlBtnPosition();
    } else if (isPlaylistDrawerOpen) {
        closePlaylistDrawer();
    }
}

function injectPlaylistBtn() {
    if (!playerEl) return;
    if (!location.pathname.startsWith('/watch')) return;

    if (document.getElementById('yt-cm-playlist-btn')) {
        plBtnEl = document.getElementById('yt-cm-playlist-btn');
        updatePlaylistBtnVisibility();
        requestAnimationFrame(applyPlBtnPosition);
        return;
    }

    plBtnEl = document.createElement('button');
    plBtnEl.id = 'yt-cm-playlist-btn';
    plBtnEl.title = 'Current Playlist · Drag to move';
    plBtnEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="15" y2="12"></line>
            <line x1="3" y1="18" x2="15" y2="18"></line>
            <polygon points="17 12 21 15 17 18 17 12" fill="currentColor"></polygon>
        </svg>
    `;
    plBtnEl.addEventListener('mousedown', onPlBtnDragStart);
    playerEl.appendChild(plBtnEl);
    updatePlaylistBtnVisibility();
    requestAnimationFrame(() => { applyPlBtnPosition(); });
    window.addEventListener('resize', onPlBtnResize, { passive: true });
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
        // Zoom shortcuts (only in WFS mode)
        if (isWFS) {
            if (e.code === 'KeyW') {                                 // W → zoom in
                e.preventDefault();
                zoomBy(ZOOM_STEP);
            }
            if (e.code === 'KeyQ') {                                 // Q → zoom out
                e.preventDefault();
                zoomBy(-ZOOM_STEP);
            }
            if (e.code === 'Digit0' || e.code === 'Numpad0') {      // 0 → reset zoom
                e.preventDefault();
                resetZoom();
            }
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
            zoomLevel:           _zoomLevel,
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
    else if (msg.action === 'resetZoom') {
        resetZoom();
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
        plBtnEl         = null;
        if (isTimestampVisible)   showTimestamp();
        if (isProgressBarVisible) showProgressBar();
        if (isSpeedVisible)       showSpeed();
        injectPlaylistBtn();
        updatePlaylistBtnVisibility();
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
            plBtnEl         = null;
            if (isTimestampVisible)   showTimestamp();
            if (isProgressBarVisible) showProgressBar();
            if (isSpeedVisible)       showSpeed();
            injectPlaylistBtn();
            updatePlaylistBtnVisibility();
            obs.disconnect();
        }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
}

// ── Feature 8: Video Zoom (WFS only) ─────────────────────────────────────────
const ZOOM_MIN       = 1;
const ZOOM_MAX       = 5;
const ZOOM_STEP      = 0.05;   // per keypress (5% — smooth)
let _zoomLevel    = 1;
let _panX         = 0;      // px offsets
let _panY         = 0;

// Pan drag state
let _zoomPanning      = false;
let _zoomPanStartX    = 0;
let _zoomPanStartY    = 0;
let _zoomPanOrigX     = 0;
let _zoomPanOrigY     = 0;

function applyZoom() {
    if (!playerEl) return;
    playerEl.style.setProperty('--yt-cm-zoom', _zoomLevel);
    playerEl.style.setProperty('--yt-cm-pan-x', _panX + 'px');
    playerEl.style.setProperty('--yt-cm-pan-y', _panY + 'px');
    playerEl.classList.toggle('yt-cm-zoomed-in', _zoomLevel > 1);
}

function zoomBy(delta) {
    _zoomLevel = parseFloat(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, _zoomLevel + delta)).toFixed(2));
    // If zooming back to 1×, also reset pan
    if (_zoomLevel <= 1) { _panX = 0; _panY = 0; }
    // Clamp pan so video doesn't fly off screen
    clampPan();
    applyZoom();
}

function resetZoom() {
    _zoomLevel = 1;
    _panX = 0;
    _panY = 0;
    if (playerEl) {
        playerEl.classList.remove('yt-cm-zoomed-in', 'yt-cm-zoom-panning');
    }
    applyZoom();
}

function clampPan() {
    if (_zoomLevel <= 1) { _panX = 0; _panY = 0; return; }
    // Maximum pan is half the overflow in each axis
    // At 2× zoom on a 1920px wide player, the video is 3840px, overflow = 1920/2 = 960
    if (!playerEl) return;
    const r = playerEl.getBoundingClientRect();
    const maxPanX = (r.width  * (_zoomLevel - 1)) / (2 * _zoomLevel);
    const maxPanY = (r.height * (_zoomLevel - 1)) / (2 * _zoomLevel);
    _panX = Math.min(maxPanX, Math.max(-maxPanX, _panX));
    _panY = Math.min(maxPanY, Math.max(-maxPanY, _panY));
}

// Pan handlers (drag to pan when zoomed in)
function onZoomPanStart(e) {
    if (!isWFS || _zoomLevel <= 1 || !playerEl) return;
    // Only start pan with left button and NOT on controls
    if (e.button !== 0) return;
    // Don't intercept clicks on interactive elements
    if (e.target.closest('.ytp-chrome-bottom, .ytp-chrome-top, #yt-cm-wfs-btn, #yt-cm-playlist-btn, .yt-cm-playlist-drawer, #yt-cm-timestamp, #yt-cm-speed')) return;

    e.preventDefault();
    _zoomPanning   = true;
    _zoomPanStartX = e.clientX;
    _zoomPanStartY = e.clientY;
    _zoomPanOrigX  = _panX;
    _zoomPanOrigY  = _panY;
    playerEl.classList.add('yt-cm-zoom-panning');
    document.addEventListener('mousemove', onZoomPanMove);
    document.addEventListener('mouseup',   onZoomPanEnd);
}

function onZoomPanMove(e) {
    if (!_zoomPanning) return;
    const dx = (e.clientX - _zoomPanStartX) / _zoomLevel;
    const dy = (e.clientY - _zoomPanStartY) / _zoomLevel;
    _panX = _zoomPanOrigX + dx;
    _panY = _zoomPanOrigY + dy;
    clampPan();
    applyZoom();
}

function onZoomPanEnd() {
    _zoomPanning = false;
    playerEl?.classList.remove('yt-cm-zoom-panning');
    document.removeEventListener('mousemove', onZoomPanMove);
    document.removeEventListener('mouseup',   onZoomPanEnd);
}

function attachZoomListeners() {
    if (!playerEl) return;
    playerEl.addEventListener('mousedown', onZoomPanStart);
}

function detachZoomListeners() {
    if (!playerEl) return;
    playerEl.removeEventListener('mousedown', onZoomPanStart);
    document.removeEventListener('mousemove', onZoomPanMove);
    document.removeEventListener('mouseup',   onZoomPanEnd);
}

function init() {
    injectStyles();
    findPlayer();
    injectWFSBtn();
    injectPlaylistBtn();
    updatePlaylistBtnVisibility();
}

document.addEventListener('yt-navigate-finish',   init);
document.addEventListener('yt-page-data-updated', init);

// ── 6. Boot: load persisted preferences then initialise ──────────────────────
injectStyles();
chrome.storage.local.get(
    {
        hideControls: true,
        controlOpacity: 1,
        isOpacityEnabled: true,
        tsPosX: 0.01,
        tsPosY: 0.03,
        progressBar: false,
        wfsBtnPosX: 0.95,
        wfsBtnPosY: 0.02,
        plBtnPosX: 0.91,
        plBtnPosY: 0.02,
        timestamp: true,
        speedIndicator: false,
        spPosX: 0.08,
        spPosY: 0.03
    },
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
        _plPosX                = result.plBtnPosX;
        _plPosY                = result.plBtnPosY;
        applyOpacity();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }
);
