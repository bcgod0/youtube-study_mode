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
        #movie_player:not(.ytp-autohide) > *:not(.html5-video-container):not(.ytp-caption-window-container):not([class*="bezel"]):not(#yt-cm-hud):not(#yt-cm-quality-menu):not(#yt-cm-progress-bar-track):not(#yt-cm-action-group):not(.yt-cm-playlist-drawer) {
            opacity: var(--yt-cm-ctrl-opacity, 1) !important;
            transition: opacity 0.15s ease !important;
        }

        /* Hide Controls on Hover — highest priority override. Bezel and timestamp excluded. */
        #movie_player.yt-cm-hide > *:not(.html5-video-container):not(.ytp-caption-window-container):not([class*="bezel"]):not(#yt-cm-hud):not(#yt-cm-quality-menu):not(#yt-cm-progress-bar-track):not(#yt-cm-action-group):not(.yt-cm-playlist-drawer) {
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

        /* Feature 5: Progress Bar (only in WFS & Cinema mode) */
        #yt-cm-progress-bar-track {
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 3px !important;
            background: rgba(255, 255, 255, 0.15) !important;
            z-index: 3100 !important;
            pointer-events: none !important;
            display: none !important;
            opacity: 0 !important;
            overflow: visible !important;
            transition: opacity 0.25s ease !important;
        }
        html.yt-cm-wfs #yt-cm-progress-bar-track.yt-cm-pb-visible,
        html.yt-cm-cinema-active #yt-cm-progress-bar-track.yt-cm-pb-visible {
            display: block !important;
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


        /* ── Unified HUD Unit (Timestamp · Speed · Quality: only in WFS & Cinema mode) ── */
        #yt-cm-hud {
            position: absolute !important;
            top: 10px;
            left: 4px;
            z-index: 3000 !important;
            display: none !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 2px !important;
            background: rgba(0, 0, 0, 0.72) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            color: #fff !important;
            font-family: 'Roboto', 'YouTube Noto', Arial, sans-serif !important;
            font-size: 13px !important;
            font-weight: 500 !important;
            letter-spacing: 0.03em !important;
            padding: 4px 8px !important;
            border-radius: 6px !important;
            cursor: default !important;
            user-select: none !important;
            opacity: 0 !important;
            transition: opacity 0.2s ease !important;
            white-space: nowrap !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
        }
        html.yt-cm-wfs #yt-cm-hud.yt-cm-hud-visible,
        html.yt-cm-cinema-active #yt-cm-hud.yt-cm-hud-visible {
            display: inline-flex !important;
            opacity: var(--yt-cm-ctrl-opacity, 1) !important;
        }
        #yt-cm-hud.yt-cm-dragging {
            cursor: default !important;
            transition: none !important;
        }

        .yt-cm-hud-item {
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            padding: 1px 4px !important;
            border-radius: 4px !important;
            line-height: 1.35 !important;
            transition: background 0.15s ease, color 0.15s ease !important;
        }
        #yt-cm-hud-time {
            cursor: pointer !important;
        }
        #yt-cm-hud-time:hover {
            background: rgba(255, 255, 255, 0.15) !important;
        }
        #yt-cm-hud-speed {
            cursor: default !important;
        }
        #yt-cm-hud-quality {
            cursor: pointer !important;
        }
        #yt-cm-hud-quality:hover {
            background: rgba(255, 255, 255, 0.15) !important;
        }
        #yt-cm-hud-quality.yt-cm-quality-active {
            background: rgba(255, 68, 68, 0.25) !important;
            color: #ff4444 !important;
        }
        #yt-cm-hud .yt-cm-hd-badge {
            background: #cc0000;
            color: #fff;
            font-size: 9px;
            font-weight: 700;
            padding: 1px 3px;
            border-radius: 2px;
            letter-spacing: 0.02em;
            line-height: 1;
        }

        /* Quality Dropdown Menu in WFS */
        #yt-cm-quality-menu {
            position: absolute !important;
            z-index: 3200 !important;
            background: rgba(15, 15, 15, 0.95) !important;
            backdrop-filter: blur(24px) !important;
            -webkit-backdrop-filter: blur(24px) !important;
            border: 1px solid rgba(255, 255, 255, 0.14) !important;
            border-radius: 8px !important;
            box-shadow: 0 8px 28px rgba(0, 0, 0, 0.85) !important;
            color: #fff !important;
            font-family: 'Roboto', 'YouTube Noto', Arial, sans-serif !important;
            font-size: 13px !important;
            padding: 6px 0 !important;
            min-width: 140px !important;
            max-height: 280px !important;
            overflow-y: auto !important;
            user-select: none !important;
            animation: yt-cm-menu-fade-in 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
        }
        @keyframes yt-cm-menu-fade-in {
            from { opacity: 0; transform: translateY(-4px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .yt-cm-quality-header {
            padding: 6px 14px 6px 14px !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.06em !important;
            color: rgba(255, 255, 255, 0.5) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
            margin-bottom: 4px !important;
        }
        .yt-cm-quality-item {
            display: flex !important;
            align-items: center !important;
            padding: 7px 14px !important;
            cursor: pointer !important;
            transition: background 0.12s ease !important;
            color: rgba(255, 255, 255, 0.88) !important;
            font-size: 12.5px !important;
            white-space: nowrap !important;
        }
        .yt-cm-quality-item:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            color: #fff !important;
        }
        .yt-cm-quality-item.yt-cm-quality-item-active {
            color: #ff4444 !important;
            font-weight: 500 !important;
        }
        .yt-cm-quality-check {
            width: 16px !important;
            height: 16px !important;
            margin-right: 8px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
            color: #ff4444 !important;
        }
        .yt-cm-quality-item-label {
            flex: 1 !important;
        }

        /* Feature 6 & 9: Floating Actions Group (Playlist + WFS buttons) */
        #yt-cm-action-group {
            position: absolute !important;
            top: 10px;
            left: 12px;
            right: auto !important;
            bottom: auto !important;
            width: fit-content !important;
            max-width: fit-content !important;
            white-space: nowrap !important;
            z-index: 3100 !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 2px !important;
            background: rgba(0, 0, 0, 0.72) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            border-radius: 6px !important;
            padding: 2px !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
            cursor: default !important;
            user-select: none !important;
            opacity: 0 !important;
            transition: opacity 0.15s ease !important;
        }
        #yt-cm-action-group.yt-cm-actions-dragging {
            cursor: default !important;
            transition: none !important;
        }
        /* Hide action group when no mouse movement (autohide active), show on movement or when drawer is active */
        #movie_player.ytp-autohide #yt-cm-action-group:not(.yt-cm-playlist-active) {
            opacity: 0 !important;
            pointer-events: none !important;
            transition: opacity 0.3s ease !important;
        }
        #movie_player:not(.ytp-autohide) #yt-cm-action-group,
        #yt-cm-action-group.yt-cm-playlist-active {
            opacity: var(--yt-cm-ctrl-opacity, 1) !important;
            pointer-events: auto !important;
            transition: opacity 0.15s ease !important;
        }

        .yt-cm-action-btn {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 5px !important;
            background: transparent !important;
            border: none !important;
            border-radius: 4px !important;
            color: rgba(255, 255, 255, 0.9) !important;
            cursor: pointer !important;
            transition: color 0.18s, background 0.18s !important;
            user-select: none !important;
            outline: none !important;
        }
        .yt-cm-action-btn:hover {
            color: #fff !important;
            background: rgba(255, 255, 255, 0.12) !important;
        }
        .yt-cm-action-btn svg {
            flex-shrink: 0 !important;
            display: block !important;
            transition: transform 0.18s !important;
        }
        #yt-cm-wfs-btn.yt-cm-wfs-active {
            color: rgba(255, 255, 255, 0.65) !important;
        }
        #yt-cm-wfs-btn.yt-cm-wfs-active svg {
            transform: rotate(180deg) !important;
        }
        #yt-cm-playlist-btn {
            display: none !important;
        }
        html.yt-cm-wfs #yt-cm-playlist-btn.yt-cm-playlist-visible,
        html.yt-cm-cinema-active #yt-cm-playlist-btn.yt-cm-playlist-visible {
            display: inline-flex !important;
        }
        #yt-cm-playlist-btn.yt-cm-playlist-active {
            color: #ff4444 !important;
            background: rgba(255, 68, 68, 0.22) !important;
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

        /* Feature 8: Zoom in WFS & Cinema */
        html.yt-cm-wfs #movie_player .html5-video-container video,
        html.yt-cm-cinema-active #movie_player .html5-video-container video {
            transform: scale(var(--yt-cm-zoom, 1)) translate(var(--yt-cm-pan-x, 0px), var(--yt-cm-pan-y, 0px)) !important;
            transform-origin: center center !important;
            transition: transform 0.15s ease !important;
        }
        html.yt-cm-wfs #movie_player.yt-cm-zoomed-in:not(.ytp-autohide) .html5-video-container,
        html.yt-cm-cinema-active #movie_player.yt-cm-zoomed-in:not(.ytp-autohide) .html5-video-container {
            cursor: default !important;
        }
        html.yt-cm-wfs #movie_player.yt-cm-zoom-panning:not(.ytp-autohide) .html5-video-container,
        html.yt-cm-cinema-active #movie_player.yt-cm-zoom-panning:not(.ytp-autohide) .html5-video-container {
            cursor: default !important;
        }
        html.yt-cm-wfs #movie_player.ytp-autohide .html5-video-container,
        html.yt-cm-cinema-active #movie_player.ytp-autohide .html5-video-container {
            cursor: none !important;
        }
        html.yt-cm-wfs #movie_player.yt-cm-zoom-panning .html5-video-container video,
        html.yt-cm-cinema-active #movie_player.yt-cm-zoom-panning .html5-video-container video {
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
    updateHudVisibility();
    updateProgressBarVisibility();
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
}
function exitWFS() {
    if (!isWFS) return;
    if (isPlaylistDrawerOpen) closePlaylistDrawer();
    if (isQualityMenuOpen) closeQualityMenu();
    document.documentElement.classList.remove('yt-cm-wfs');
    isWFS = false;
    document.removeEventListener('keydown', onWFSKey, true);
    if (!isCinema) {
        detachZoomListeners();
        resetZoom();
    }
    updatePlaylistBtnVisibility();
    updateHudVisibility();
    updateProgressBarVisibility();
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
        if (isQualityMenuOpen) {
            closeQualityMenu();
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

// ── Features 6 & 9: Unified Floating Actions Group (Playlist + WFS buttons) ──
let actionGroupEl         = null;
let wfsBtnEl              = null;
let plBtnEl               = null;
let _actionsPosX          = 0.94;   // fraction of player width  (default: top-right)
let _actionsPosY          = 0.02;   // fraction of player height
let _actionsDragStartX    = 0, _actionsDragStartY = 0;
let _actionsDragOrigL     = 0, _actionsDragOrigT  = 0;
let _actionsDragging      = false;
let _actionsClickTarget   = null;
const ACTIONS_DRAG_THRESHOLD = 4;

let isPlaylistDrawerOpen  = false;
let _origPlParent         = null;
let _origPlNextSibling    = null;

function applyActionsPosition() {
    if (!actionGroupEl || !playerEl) return;
    const pr  = playerEl.getBoundingClientRect();
    const elW = actionGroupEl.offsetWidth  || 0;
    const elH = actionGroupEl.offsetHeight || 0;
    const left = Math.min(Math.max(0, _actionsPosX * pr.width),  pr.width  - elW);
    const top  = Math.min(Math.max(0, _actionsPosY * pr.height), pr.height - elH);
    actionGroupEl.style.left = left + 'px';
    actionGroupEl.style.top  = top  + 'px';
    actionGroupEl.style.right = 'auto';
}

function saveActionsPosition() {
    chrome.storage.local.set({
        actionsPosX: _actionsPosX,
        actionsPosY: _actionsPosY,
        wfsBtnPosX:  _actionsPosX,
        wfsBtnPosY:  _actionsPosY
    });
}

function onActionsDragMove(e) {
    const dx = e.clientX - _actionsDragStartX;
    const dy = e.clientY - _actionsDragStartY;
    if (!_actionsDragging && Math.hypot(dx, dy) < ACTIONS_DRAG_THRESHOLD) return;
    _actionsDragging = true;
    actionGroupEl.classList.add('yt-cm-actions-dragging');
    const pr  = playerEl.getBoundingClientRect();
    const elW = actionGroupEl.offsetWidth;
    const elH = actionGroupEl.offsetHeight;
    const newLeft = Math.min(Math.max(0, _actionsDragOrigL + dx), pr.width  - elW);
    const newTop  = Math.min(Math.max(0, _actionsDragOrigT + dy), pr.height - elH);
    actionGroupEl.style.left = newLeft + 'px';
    actionGroupEl.style.top  = newTop  + 'px';
    actionGroupEl.style.right = 'auto';
    _actionsPosX = newLeft / pr.width;
    _actionsPosY = newTop  / pr.height;
}

function onActionsDragEnd() {
    document.removeEventListener('mousemove', onActionsDragMove);
    document.removeEventListener('mouseup',   onActionsDragEnd);
    actionGroupEl?.classList.remove('yt-cm-actions-dragging');
    if (!_actionsDragging) {
        if (_actionsClickTarget && _actionsClickTarget.closest('#yt-cm-playlist-btn')) {
            if (isWFS || isCinema) togglePlaylistDrawer();
        } else if (_actionsClickTarget && _actionsClickTarget.closest('#yt-cm-wfs-btn')) {
            toggleWFS();
        }
    } else {
        saveActionsPosition();
    }
    _actionsDragging = false;
    _actionsClickTarget = null;
}

function onActionsDragStart(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    _actionsClickTarget = e.target;
    _actionsDragStartX  = e.clientX;
    _actionsDragStartY  = e.clientY;
    _actionsDragOrigL   = parseInt(actionGroupEl.style.left) || actionGroupEl.offsetLeft;
    _actionsDragOrigT   = parseInt(actionGroupEl.style.top)  || actionGroupEl.offsetTop;
    _actionsDragging    = false;
    document.addEventListener('mousemove', onActionsDragMove);
    document.addEventListener('mouseup',   onActionsDragEnd);
}

function updateWFSBtn() {
    if (!wfsBtnEl) return;
    wfsBtnEl.classList.toggle('yt-cm-wfs-active', isWFS);
    wfsBtnEl.title = isWFS ? 'Exit Windowed Fullscreen (` or Esc) · Drag to move' : 'Windowed Fullscreen (`) · Drag to move';
}

function onActionsResize() { applyActionsPosition(); }

function hasActivePlaylist() {
    if (!location.pathname.startsWith('/watch')) return false;
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.has('list')) return true;
    const pl = document.querySelector('ytd-playlist-panel-renderer');
    return !!(pl && !pl.hasAttribute('hidden') && pl.style.display !== 'none');
}

function updatePlaylistBtnVisibility() {
    if (!plBtnEl) return;
    const shouldShow = (isWFS || isCinema) && hasActivePlaylist();
    plBtnEl.classList.toggle('yt-cm-playlist-visible', shouldShow);
    if (!shouldShow) {
        plBtnEl.style.setProperty('display', 'none', 'important');
        if (isPlaylistDrawerOpen) {
            closePlaylistDrawer();
        }
    } else {
        plBtnEl.style.setProperty('display', 'inline-flex', 'important');
    }
    requestAnimationFrame(applyActionsPosition);
}

function ensureActionGroupEl() {
    if (!actionGroupEl || !document.contains(actionGroupEl)) {
        actionGroupEl = document.getElementById('yt-cm-action-group');
        if (!actionGroupEl && playerEl) {
            actionGroupEl = document.createElement('div');
            actionGroupEl.id = 'yt-cm-action-group';

            plBtnEl = document.createElement('button');
            plBtnEl.id = 'yt-cm-playlist-btn';
            plBtnEl.className = 'yt-cm-action-btn';
            plBtnEl.title = 'Current Playlist · Drag to move';
            plBtnEl.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="15" y2="12"></line>
                    <line x1="3" y1="18" x2="15" y2="18"></line>
                    <polygon points="17 12 21 15 17 18 17 12" fill="currentColor"></polygon>
                </svg>
            `;
            actionGroupEl.appendChild(plBtnEl);

            wfsBtnEl = document.createElement('button');
            wfsBtnEl.id = 'yt-cm-wfs-btn';
            wfsBtnEl.className = 'yt-cm-action-btn';
            wfsBtnEl.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <polyline points="9 21 3 21 3 15"></polyline>
                    <line x1="21" y1="3" x2="14" y2="10"></line>
                    <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
            `;
            actionGroupEl.appendChild(wfsBtnEl);

            actionGroupEl.addEventListener('mousedown', onActionsDragStart);
            playerEl.appendChild(actionGroupEl);
        } else if (actionGroupEl) {
            plBtnEl  = actionGroupEl.querySelector('#yt-cm-playlist-btn');
            wfsBtnEl = actionGroupEl.querySelector('#yt-cm-wfs-btn');
        }
    }
    return actionGroupEl;
}

function injectActionGroup() {
    if (!playerEl) return;
    if (!location.pathname.startsWith('/watch')) return;

    ensureActionGroupEl();
    updateWFSBtn();
    updatePlaylistBtnVisibility();
    requestAnimationFrame(applyActionsPosition);
    window.removeEventListener('resize', onActionsResize);
    window.addEventListener('resize', onActionsResize, { passive: true });
}

function onPlaylistOutsideClick(e) {
    if (!isPlaylistDrawerOpen) return;
    if (actionGroupEl && actionGroupEl.contains(e.target)) return;
    const drawer = document.querySelector('ytd-playlist-panel-renderer.yt-cm-playlist-drawer');
    if (drawer && drawer.contains(e.target)) return;
    closePlaylistDrawer();
}

function openPlaylistDrawer() {
    if (!isWFS && !isCinema) return;
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

    if (actionGroupEl) {
        actionGroupEl.classList.add('yt-cm-playlist-active');
    }
    if (plBtnEl) {
        plBtnEl.classList.add('yt-cm-playlist-active');
        plBtnEl.title = 'Close Playlist · Drag to move';
    }

    // Attach listener to YouTube's header close button
    const closeBtn = panel.querySelector('#header-contents yt-icon-button, button[aria-label*="Close"], #top-row-buttons yt-icon-button');
    if (closeBtn && !closeBtn._ytCmBound) {
        closeBtn._ytCmBound = true;
        closeBtn.addEventListener('click', (e) => {
            if ((isWFS || isCinema) && isPlaylistDrawerOpen) {
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
    if (actionGroupEl) {
        actionGroupEl.classList.remove('yt-cm-playlist-active');
    }
    if (plBtnEl) {
        plBtnEl.classList.remove('yt-cm-playlist-active');
        plBtnEl.title = 'Current Playlist · Drag to move';
    }
}

function togglePlaylistDrawer() {
    if (!isWFS && !isCinema) return;
    isPlaylistDrawerOpen ? closePlaylistDrawer() : openPlaylistDrawer();
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
    attachZoomListeners();
    updatePlaylistBtnVisibility();
    updateHudVisibility();
    updateProgressBarVisibility();
}
function exitCinema() {
    if (!isCinema) return;
    if (isPlaylistDrawerOpen) closePlaylistDrawer();
    if (isQualityMenuOpen) closeQualityMenu();
    isCinema = false;
    document.documentElement.classList.remove('yt-cm-cinema-active');
    destroyBars();
    if (!isWFS) {
        detachZoomListeners();
        resetZoom();
    }
    updatePlaylistBtnVisibility();
    updateHudVisibility();
    updateProgressBarVisibility();
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

function updateProgressBarVisibility() {
    const inFocus = isWFS || isCinema;
    if (inFocus && isProgressBarVisible) {
        showProgressBar();
    } else {
        hideProgressBar();
    }
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
    updateProgressBarVisibility();
    chrome.storage.local.set({ progressBar: isProgressBarVisible });
}

// ── Features 4, 7 & 10: Unified HUD Unit (Timestamp · Speed · Quality) ──────────
let isTimestampVisible  = true;
let isShowingRemaining  = false;   // false = current/total, true = remaining/total
let isSpeedVisible      = false;
let isQualityVisible    = true;

let hudEl        = null;
let hudTimeEl    = null;
let hudSpeedEl   = null;
let hudQualityEl = null;

let qualityMenuEl       = null;
let isQualityMenuOpen   = false;
let _currentQualityRaw  = null;
let _qualityLabel       = '';
let _availableQualities = [];

// Drag state for unified HUD unit
let _hudDragStartX  = 0, _hudDragStartY  = 0;
let _hudDragOrigL   = 0, _hudDragOrigT   = 0;
let _hudDragging    = false;
let _hudClickTarget = null;
const DRAG_THRESHOLD = 4;

// Position as fractions of player size (0.0–1.0)
let _hudPosX = 0.01;
let _hudPosY = 0.03;

function applyHudPosition() {
    if (!hudEl || !playerEl) return;
    const pr  = playerEl.getBoundingClientRect();
    const elW = hudEl.offsetWidth  || 0;
    const elH = hudEl.offsetHeight || 0;
    const left = Math.min(Math.max(0, _hudPosX * pr.width),  pr.width  - elW);
    const top  = Math.min(Math.max(0, _hudPosY * pr.height), pr.height - elH);
    hudEl.style.left = left + 'px';
    hudEl.style.top  = top  + 'px';
    if (isQualityMenuOpen) positionQualityMenu();
}

function saveHudPosition() {
    chrome.storage.local.set({ hudPosX: _hudPosX, hudPosY: _hudPosY });
}

function onHudResize() {
    applyHudPosition();
}

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

function onTimeUpdate() {
    if (!hudTimeEl) return;
    const v = getVideo();
    if (!v) { hudTimeEl.textContent = '--:-- / --:--'; return; }
    if (isShowingRemaining) {
        const remaining = v.duration - v.currentTime;
        hudTimeEl.textContent = isFinite(remaining)
            ? `-${formatTime(remaining)} / ${formatTime(v.duration)}`
            : '--:-- / --:--';
    } else {
        hudTimeEl.textContent = `${formatTime(v.currentTime)} / ${formatTime(v.duration)}`;
    }
}

function updateSpeedDisplay() {
    if (!hudSpeedEl) return;
    const v = getVideo();
    const rate = v ? v.playbackRate : 1;
    hudSpeedEl.textContent = rate === 1 ? '1×' : `${parseFloat(rate.toFixed(2))}×`;
}

function onSpeedChange() {
    updateSpeedDisplay();
}

function getResolutionFromVideo(v) {
    if (!v || !v.videoWidth || !v.videoHeight) return null;
    const w = v.videoWidth;
    const h = v.videoHeight;
    const isVertical = h > w;
    const effH = isVertical ? w : Math.max(h, Math.round(w * 9 / 16));
    if (effH >= 4320) return { label: '4320p 8K', isHd: true, height: 4320 };
    if (effH >= 2160) return { label: '2160p 4K', isHd: true, height: 2160 };
    if (effH >= 1440) return { label: '1440p',    isHd: true, height: 1440 };
    if (effH >= 1080) return { label: '1080p',    isHd: true, height: 1080 };
    if (effH >= 720)  return { label: '720p',     isHd: true, height: 720 };
    if (effH >= 480)  return { label: '480p',     isHd: false, height: 480 };
    if (effH >= 360)  return { label: '360p',     isHd: false, height: 360 };
    if (effH >= 240)  return { label: '240p',     isHd: false, height: 240 };
    if (effH >= 144)  return { label: '144p',     isHd: false, height: 144 };
    return { label: `${h}p`, isHd: h >= 720, height: h };
}

function updateQualityDisplay() {
    if (!hudQualityEl) return;
    const v = getVideo();
    let displayLabel = _qualityLabel;
    let isHd = false;

    if (!displayLabel) {
        const res = getResolutionFromVideo(v);
        if (res) {
            displayLabel = res.label;
            isHd = res.isHd;
        } else {
            displayLabel = '--';
        }
    } else {
        isHd = /1080|1440|2160|4k|8k|hd/i.test(displayLabel);
    }

    let badgeText = '';
    if (/8k/i.test(displayLabel)) {
        badgeText = '8K';
    } else if (/4k/i.test(displayLabel)) {
        badgeText = '4K';
    } else if (isHd) {
        badgeText = 'HD';
    }

    hudQualityEl.textContent = '';
    const textSpan = document.createElement('span');
    textSpan.textContent = displayLabel.replace(/\s*(4k|8k|hd)\s*/gi, '').trim() || displayLabel;
    hudQualityEl.appendChild(textSpan);

    if (badgeText) {
        const badge = document.createElement('span');
        badge.className = 'yt-cm-hd-badge';
        badge.textContent = badgeText;
        hudQualityEl.appendChild(badge);
    }

    applyHudPosition();
}

function onVideoQualityResize() {
    updateQualityDisplay();
}

function positionQualityMenu() {
    if (!qualityMenuEl || !hudEl || !playerEl) return;
    const pr = playerEl.getBoundingClientRect();
    const hr = hudEl.getBoundingClientRect();
    const mr = qualityMenuEl.getBoundingClientRect();

    let left = hr.left - pr.left;
    let top  = hr.bottom - pr.top + 6;

    if (left + mr.width > pr.width - 8) {
        left = pr.width - mr.width - 8;
    }
    if (left < 8) left = 8;
    if (top + mr.height > pr.height - 8) {
        top = (hr.top - pr.top) - mr.height - 6;
    }
    if (top < 8) top = 8;

    qualityMenuEl.style.left = left + 'px';
    qualityMenuEl.style.top  = top  + 'px';
}

function openQualityMenu() {
    if (!playerEl || !hudQualityEl) return;
    closeQualityMenu();

    qualityMenuEl = document.createElement('div');
    qualityMenuEl.id = 'yt-cm-quality-menu';

    const header = document.createElement('div');
    header.className = 'yt-cm-quality-header';
    header.textContent = 'Quality';
    qualityMenuEl.appendChild(header);

    let options = _availableQualities;
    if (!options || options.length === 0) {
        options = [
            { quality: 'auto',   qualityLabel: 'Auto' },
            { quality: 'hd2160', qualityLabel: '2160p (4K)', isHd: true },
            { quality: 'hd1440', qualityLabel: '1440p',      isHd: true },
            { quality: 'hd1080', qualityLabel: '1080p',      isHd: true },
            { quality: 'hd720',  qualityLabel: '720p',       isHd: true },
            { quality: 'large',   qualityLabel: '480p' },
            { quality: 'medium',  qualityLabel: '360p' },
            { quality: 'small',   qualityLabel: '240p' },
            { quality: 'tiny',    qualityLabel: '144p' }
        ];
    }

    const currentQ = (_currentQualityRaw || '').toLowerCase();
    const currentLabel = (hudQualityEl?.textContent || '').toLowerCase();

    options.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'yt-cm-quality-item';

        const isCurrent = (opt.quality && opt.quality.toLowerCase() === currentQ) ||
                          (opt.qualityLabel && currentLabel.includes(opt.qualityLabel.toLowerCase().replace(/[^0-9a-z]/g, '')));

        if (isCurrent) item.classList.add('yt-cm-quality-item-active');

        const checkIcon = document.createElement('span');
        checkIcon.className = 'yt-cm-quality-check';
        checkIcon.innerHTML = isCurrent
            ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`
            : '';
        item.appendChild(checkIcon);

        const label = document.createElement('span');
        label.className = 'yt-cm-quality-item-label';
        label.textContent = opt.qualityLabel || opt.quality;
        item.appendChild(label);

        item.addEventListener('click', (e) => {
            e.stopPropagation();
            changeQuality(opt.quality, opt.qualityLabel);
            closeQualityMenu();
        });

        qualityMenuEl.appendChild(item);
    });

    playerEl.appendChild(qualityMenuEl);
    isQualityMenuOpen = true;
    hudQualityEl?.classList.add('yt-cm-quality-active');
    requestAnimationFrame(() => positionQualityMenu());

    setTimeout(() => {
        document.addEventListener('click', onQualityOutsideClick);
    }, 0);
}

function closeQualityMenu() {
    if (qualityMenuEl) {
        qualityMenuEl.remove();
        qualityMenuEl = null;
    }
    isQualityMenuOpen = false;
    hudQualityEl?.classList.remove('yt-cm-quality-active');
    document.removeEventListener('click', onQualityOutsideClick);
}

function onQualityOutsideClick(e) {
    if (!qualityMenuEl) return;
    if (hudQualityEl && hudQualityEl.contains(e.target)) return;
    if (qualityMenuEl.contains(e.target)) return;
    closeQualityMenu();
}

function toggleQualityMenu() {
    isQualityMenuOpen ? closeQualityMenu() : openQualityMenu();
}

function changeQuality(qualityKey, qualityLabel) {
    if (qualityLabel) {
        _qualityLabel = qualityLabel;
        updateQualityDisplay();
    }
    _currentQualityRaw = qualityKey;

    window.postMessage({
        source: 'YT_CLEAN_MODE_CONTENT',
        action: 'SET_QUALITY',
        quality: qualityKey
    }, '*');
}

function onHudDragStart(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    _hudClickTarget = e.target;
    _hudDragStartX = e.clientX;
    _hudDragStartY = e.clientY;
    _hudDragOrigL  = parseInt(hudEl.style.left) || hudEl.offsetLeft;
    _hudDragOrigT  = parseInt(hudEl.style.top)  || hudEl.offsetTop;
    _hudDragging   = false;
    document.addEventListener('mousemove', onHudDragMove);
    document.addEventListener('mouseup',   onHudDragEnd);
}

function onHudDragMove(e) {
    const dx = e.clientX - _hudDragStartX;
    const dy = e.clientY - _hudDragStartY;
    if (!_hudDragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    _hudDragging = true;
    hudEl.classList.add('yt-cm-dragging');
    const pr  = playerEl.getBoundingClientRect();
    const elW = hudEl.offsetWidth;
    const elH = hudEl.offsetHeight;
    const newLeft = Math.min(Math.max(0, _hudDragOrigL + dx), pr.width  - elW);
    const newTop  = Math.min(Math.max(0, _hudDragOrigT + dy), pr.height - elH);
    hudEl.style.left = newLeft + 'px';
    hudEl.style.top  = newTop  + 'px';
    _hudPosX = newLeft / pr.width;
    _hudPosY = newTop  / pr.height;
    if (isQualityMenuOpen) positionQualityMenu();
}

function onHudDragEnd() {
    document.removeEventListener('mousemove', onHudDragMove);
    document.removeEventListener('mouseup',   onHudDragEnd);
    hudEl?.classList.remove('yt-cm-dragging');
    if (!_hudDragging) {
        if (_hudClickTarget && _hudClickTarget.closest('#yt-cm-hud-time')) {
            isShowingRemaining = !isShowingRemaining;
            onTimeUpdate();
        } else if (_hudClickTarget && _hudClickTarget.closest('#yt-cm-hud-quality')) {
            toggleQualityMenu();
        }
    } else {
        saveHudPosition();
    }
    _hudDragging = false;
    _hudClickTarget = null;
}

function ensureHudEl() {
    if (!hudEl || !document.contains(hudEl)) {
        hudEl = document.getElementById('yt-cm-hud');
        if (!hudEl && playerEl) {
            hudEl = document.createElement('div');
            hudEl.id = 'yt-cm-hud';

            hudTimeEl = document.createElement('div');
            hudTimeEl.id = 'yt-cm-hud-time';
            hudTimeEl.className = 'yt-cm-hud-item';
            hudTimeEl.title = 'Click to toggle remaining time';
            hudEl.appendChild(hudTimeEl);

            hudSpeedEl = document.createElement('div');
            hudSpeedEl.id = 'yt-cm-hud-speed';
            hudSpeedEl.className = 'yt-cm-hud-item';
            hudSpeedEl.title = 'Playback speed';
            hudEl.appendChild(hudSpeedEl);

            hudQualityEl = document.createElement('div');
            hudQualityEl.id = 'yt-cm-hud-quality';
            hudQualityEl.className = 'yt-cm-hud-item';
            hudQualityEl.title = 'Video quality (click to select)';
            hudEl.appendChild(hudQualityEl);

            hudEl.addEventListener('mousedown', onHudDragStart);
            playerEl.appendChild(hudEl);
        } else if (hudEl) {
            hudTimeEl    = hudEl.querySelector('#yt-cm-hud-time');
            hudSpeedEl   = hudEl.querySelector('#yt-cm-hud-speed');
            hudQualityEl = hudEl.querySelector('#yt-cm-hud-quality');
        }
    }
    return hudEl;
}

function updateHudVisibility() {
    const el = ensureHudEl();
    if (!el) return;

    const inFocus     = isWFS || isCinema;
    const showTime    = inFocus && isTimestampVisible;
    const showSpeed   = inFocus && isSpeedVisible;
    const showQuality = inFocus && isQualityVisible;

    if (hudTimeEl)    hudTimeEl.style.display    = showTime ? 'inline-flex' : 'none';
    if (hudSpeedEl)   hudSpeedEl.style.display   = showSpeed ? 'inline-flex' : 'none';
    if (hudQualityEl) hudQualityEl.style.display = showQuality ? 'inline-flex' : 'none';

    const anyVisible = inFocus && (showTime || showSpeed || showQuality);
    el.classList.toggle('yt-cm-hud-visible', anyVisible);

    if (anyVisible) {
        el.style.removeProperty('display');
        requestAnimationFrame(() => {
            applyHudPosition();
            onTimeUpdate();
            updateSpeedDisplay();
            updateQualityDisplay();
        });
        const v = getVideo();
        v?.removeEventListener('timeupdate', onTimeUpdate);
        v?.addEventListener('timeupdate', onTimeUpdate);
        v?.removeEventListener('ratechange', onSpeedChange);
        v?.addEventListener('ratechange', onSpeedChange);
        v?.removeEventListener('resize', onVideoQualityResize);
        v?.addEventListener('resize', onVideoQualityResize);
        v?.removeEventListener('loadedmetadata', onVideoQualityResize);
        v?.addEventListener('loadedmetadata', onVideoQualityResize);
        window.removeEventListener('resize', onHudResize);
        window.addEventListener('resize', onHudResize, { passive: true });
        window.postMessage({ source: 'YT_CLEAN_MODE_CONTENT', action: 'GET_QUALITY' }, '*');
    } else {
        el.style.setProperty('display', 'none', 'important');
        closeQualityMenu();
    }
}

function toggleTimestamp() {
    isTimestampVisible = !isTimestampVisible;
    chrome.storage.local.set({ timestamp: isTimestampVisible });
    updateHudVisibility();
}

function toggleSpeed() {
    isSpeedVisible = !isSpeedVisible;
    chrome.storage.local.set({ speedIndicator: isSpeedVisible });
    updateHudVisibility();
}

function toggleQuality() {
    isQualityVisible = !isQualityVisible;
    chrome.storage.local.set({ qualityIndicator: isQualityVisible });
    updateHudVisibility();
}

// Listen for messages from main-world.js
window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== 'YT_CLEAN_MODE_MAIN') return;
    if (event.data.action === 'QUALITY_UPDATE') {
        if (event.data.currentQuality) {
            _currentQualityRaw = event.data.currentQuality;
        }
        if (Array.isArray(event.data.qualityData) && event.data.qualityData.length > 0) {
            _availableQualities = event.data.qualityData;
            const matched = _availableQualities.find(q => q.quality === _currentQualityRaw);
            if (matched && matched.qualityLabel) {
                _qualityLabel = matched.qualityLabel;
            }
        } else if (Array.isArray(event.data.qualityLevels) && event.data.qualityLevels.length > 0) {
            _availableQualities = event.data.qualityLevels.map(lvl => ({
                quality: lvl,
                qualityLabel: lvl.replace(/^hd/, '') + (lvl.startsWith('hd') ? 'p HD' : 'p')
            }));
        }
        updateQualityDisplay();
    }
});

// Keyboard shortcuts (ignored when typing in an input)
document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    if (e.key === 'Escape') {
        if (isPlaylistDrawerOpen) { closePlaylistDrawer(); return; }
        if (isQualityMenuOpen) { closeQualityMenu(); return; }
        if (isCinema && !isWFS) { exitCinema(); return; }
    }

    if (!e.shiftKey) {
        if (e.code === 'Backquote') toggleWFS();          // `  → Windowed Fullscreen
        if (e.code === 'KeyZ')      toggleCinema();        // Z  → Cinema Mode
        if (e.code === 'KeyH')      toggleHideControls();  // H  → Hide Controls
        if (e.code === 'KeyY')      toggleTimestamp();     // Y  → Timestamp Overlay
        if (e.code === 'KeyX')      toggleSpeed();         // X  → Speed Indicator
        if (e.code === 'KeyV')      toggleQuality();       // V  → Video Quality (WFS / Cinema)
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
        // Zoom shortcuts (in WFS or Cinema mode)
        if (isWFS || isCinema) {
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
            qualityVisible:      isQualityVisible,
            qualityLabel:        _qualityLabel || getResolutionFromVideo(getVideo())?.label || 'Auto',
        });
    }
    else if (msg.action === 'toggleHideControls') { toggleHideControls(); }
    else if (msg.action === 'toggleWindowedFS')   { toggleWFS(); }
    else if (msg.action === 'toggleCinema')        { toggleCinema(); }
    else if (msg.action === 'toggleTimestamp')     { toggleTimestamp(); }
    else if (msg.action === 'toggleQuality')       { toggleQuality(); }
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
        hudEl           = null;
        progressTrackEl = null;
        progressFillEl  = null;
        actionGroupEl   = null;
        wfsBtnEl        = null;
        plBtnEl         = null;
        updateHudVisibility();
        updateProgressBarVisibility();
        injectActionGroup();
        return;
    }
    const obs = new MutationObserver(() => {
        const p2 = document.getElementById('movie_player');
        if (p2) {
            playerEl = p2;
            if (isCinema) playerEl.classList.add('yt-cm-cinema');
            hudEl           = null;
            progressTrackEl = null;
            progressFillEl  = null;
            actionGroupEl   = null;
            wfsBtnEl        = null;
            plBtnEl         = null;
            updateHudVisibility();
            updateProgressBarVisibility();
            injectActionGroup();
            obs.disconnect();
        }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
}

// ── Feature 8: Video Zoom (WFS & Cinema) ─────────────────────────────────────
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
    if ((!isWFS && !isCinema) || _zoomLevel <= 1 || !playerEl) return;
    // Only start pan with left button and NOT on controls
    if (e.button !== 0) return;
    // Don't intercept clicks on interactive elements
    if (e.target.closest('.ytp-chrome-bottom, .ytp-chrome-top, #yt-cm-action-group, .yt-cm-playlist-drawer, #yt-cm-hud, #yt-cm-quality-menu')) return;

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
    injectActionGroup();
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
        hudPosX: 0.01,
        hudPosY: 0.03,
        tsPosX: 0.01,
        tsPosY: 0.03,
        progressBar: false,
        actionsPosX: 0.94,
        actionsPosY: 0.02,
        wfsBtnPosX: 0.95,
        wfsBtnPosY: 0.02,
        plBtnPosX: 0.91,
        plBtnPosY: 0.02,
        timestamp: true,
        speedIndicator: false,
        qualityIndicator: true
    },
    (result) => {
        isHideControlsEnabled = result.hideControls;
        controlOpacity        = result.controlOpacity;
        isOpacityEnabled      = result.isOpacityEnabled;
        _hudPosX              = result.hudPosX !== undefined ? result.hudPosX : (result.tsPosX !== undefined ? result.tsPosX : 0.01);
        _hudPosY              = result.hudPosY !== undefined ? result.hudPosY : (result.tsPosY !== undefined ? result.tsPosY : 0.03);
        _actionsPosX          = result.actionsPosX !== undefined ? result.actionsPosX : (result.wfsBtnPosX !== undefined ? result.wfsBtnPosX : 0.94);
        _actionsPosY          = result.actionsPosY !== undefined ? result.actionsPosY : (result.wfsBtnPosY !== undefined ? result.wfsBtnPosY : 0.02);
        isProgressBarVisible  = result.progressBar;
        isTimestampVisible     = result.timestamp;
        isSpeedVisible         = result.speedIndicator;
        isQualityVisible       = result.qualityIndicator;
        applyOpacity();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }
);
