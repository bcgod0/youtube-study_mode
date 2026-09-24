// main-world.js — runs in the page context (MAIN world) to communicate with YouTube HTML5 player
(function() {
    let _justHandledScreenDblClick = false;

    // Intercept native Fullscreen API calls triggered by double-click on video screen
    try {
        const origRequestFullscreen = Element.prototype.requestFullscreen;
        if (typeof origRequestFullscreen === 'function') {
            Element.prototype.requestFullscreen = function(...args) {
                if (_justHandledScreenDblClick) {
                    return Promise.reject(new Error('Fullscreen intercepted'));
                }
                return origRequestFullscreen.apply(this, args);
            };
        }
        const origWebkitRequestFullscreen = Element.prototype.webkitRequestFullscreen;
        if (typeof origWebkitRequestFullscreen === 'function') {
            Element.prototype.webkitRequestFullscreen = function(...args) {
                if (_justHandledScreenDblClick) {
                    return;
                }
                return origWebkitRequestFullscreen.apply(this, args);
            };
        }
    } catch (_) {}

    function getPlayer() {
        return document.getElementById('movie_player');
    }

    const INTERACTIVE_SELECTOR = [
        '.ytp-chrome-bottom',
        '.ytp-chrome-top',
        '.ytp-settings-menu',
        '.ytp-panel',
        '.ytp-popup',
        '.ytp-contextmenu',
        '.ytp-menu',
        '.ytp-ce-element',
        '.ytp-cards-teaser',
        '.ytp-cards-button',
        '.ytp-paid-content-overlay',
        '#yt-cm-hud',
        '#yt-cm-quality-menu',
        '#yt-cm-progress-bar-track',
        '#yt-cm-action-group',
        '.yt-cm-playlist-drawer',
        'button',
        'a',
        'input',
        'textarea',
        'select',
        '[role="button"]',
        '[role="slider"]',
        '[role="menuitem"]',
        '[role="menu"]',
        '[role="tab"]',
        '[contenteditable]',
        '.ytp-button',
        '.ytp-progress-bar',
        '.ytp-volume-panel'
    ].join(', ');

    function isInteractiveTarget(target) {
        if (!target || typeof target.closest !== 'function') return false;
        return Boolean(target.closest(INTERACTIVE_SELECTOR));
    }

    let wasPlayingBeforeClick = false;
    let clickDetail1Time = 0;

    window.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        const player = getPlayer();
        if (!player || !player.contains(e.target) || isInteractiveTarget(e.target)) return;
        if (e.detail === 1) {
            clickDetail1Time = Date.now();
            const video = player.querySelector('video');
            wasPlayingBeforeClick = video ? !video.paused : false;
        }
    }, true);

    function onScreenDoubleClick(e) {
        if (e.button !== 0) return;
        const player = getPlayer();
        if (!player || !player.contains(e.target)) return;
        if (isInteractiveTarget(e.target)) return;

        // Block YouTube native fullscreen from firing
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        _justHandledScreenDblClick = true;
        setTimeout(() => {
            _justHandledScreenDblClick = false;
        }, 400);

        // Exit native fullscreen if active
        if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
            document.exitFullscreen().catch(() => {});
        } else if (document.webkitFullscreenElement && typeof document.webkitExitFullscreen === 'function') {
            document.webkitExitFullscreen();
        }

        // Restore playback state if single-click toggled it
        const video = player.querySelector('video');
        if (video && (Date.now() - clickDetail1Time < 600)) {
            const bezel = player.querySelector('.ytp-bezel');
            if (bezel) {
                bezel.style.display = 'none';
                setTimeout(() => { bezel.style.display = ''; }, 350);
            }

            const restorePlayback = () => {
                if (wasPlayingBeforeClick && video.paused) {
                    video.play().catch(() => {});
                } else if (!wasPlayingBeforeClick && !video.paused) {
                    video.pause();
                }
            };
            restorePlayback();
            setTimeout(restorePlayback, 40);
        }

        // Send message to content script to toggle Windowed Fullscreen
        window.postMessage({
            source: 'YT_CLEAN_MODE_MAIN',
            action: 'TOGGLE_WFS_FROM_DBLCLICK'
        }, '*');
    }

    window.addEventListener('dblclick', onScreenDoubleClick, true);
    document.addEventListener('dblclick', onScreenDoubleClick, true);

    function sendQualityInfo() {
        const player = getPlayer();
        if (!player) return;
        try {
            const currentQuality = typeof player.getPlaybackQuality === 'function' ? player.getPlaybackQuality() : null;
            const qualityData    = typeof player.getAvailableQualityData === 'function' ? player.getAvailableQualityData() : null;
            const qualityLevels  = typeof player.getAvailableQualityLevels === 'function' ? player.getAvailableQualityLevels() : null;

            window.postMessage({
                source: 'YT_CLEAN_MODE_MAIN',
                action: 'QUALITY_UPDATE',
                currentQuality,
                qualityData,
                qualityLevels
            }, '*');
        } catch (_) {}
    }

    function setQuality(quality) {
        const player = getPlayer();
        if (!player) return;
        try {
            if (typeof player.setPlaybackQualityRange === 'function') {
                player.setPlaybackQualityRange(quality, quality);
            }
            if (typeof player.setPlaybackQuality === 'function') {
                player.setPlaybackQuality(quality);
            }
            // Trigger quick updates
            setTimeout(sendQualityInfo, 100);
            setTimeout(sendQualityInfo, 400);
        } catch (_) {}
    }

    function hookPlayer(player) {
        if (!player || player._ytCmHooked) return;
        player._ytCmHooked = true;
        try {
            if (typeof player.toggleFullscreen === 'function') {
                const origToggleFullscreen = player.toggleFullscreen.bind(player);
                player.toggleFullscreen = function(...args) {
                    if (_justHandledScreenDblClick) {
                        return;
                    }
                    return origToggleFullscreen(...args);
                };
            }
        } catch (_) {}
    }

    function attachListeners() {
        const player = getPlayer();
        if (!player) return;
        hookPlayer(player);
        try {
            if (typeof player.addEventListener === 'function') {
                player.addEventListener('onPlaybackQualityChange', () => {
                    sendQualityInfo();
                });
                player.addEventListener('onStateChange', () => {
                    sendQualityInfo();
                });
            }
        } catch (_) {}
    }

    window.addEventListener('message', (event) => {
        if (event.source !== window || !event.data || event.data.source !== 'YT_CLEAN_MODE_CONTENT') return;
        if (event.data.action === 'GET_QUALITY') {
            sendQualityInfo();
        } else if (event.data.action === 'SET_QUALITY' && event.data.quality) {
            setQuality(event.data.quality);
        }
    });

    document.addEventListener('yt-navigate-finish', () => {
        attachListeners();
        setTimeout(sendQualityInfo, 250);
        setTimeout(sendQualityInfo, 800);
    });

    document.addEventListener('DOMContentLoaded', () => {
        attachListeners();
        setTimeout(sendQualityInfo, 250);
    });

    // Initial hook
    attachListeners();
    setTimeout(sendQualityInfo, 500);
    setTimeout(sendQualityInfo, 1500);
    setInterval(sendQualityInfo, 3000);
})();
