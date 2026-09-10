// main-world.js — runs in the page context (MAIN world) to communicate with YouTube HTML5 player
(function() {
    function getPlayer() {
        return document.getElementById('movie_player');
    }

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

    function attachListeners() {
        const player = getPlayer();
        if (!player) return;
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

    // Initial hook
    attachListeners();
    setTimeout(sendQualityInfo, 500);
    setTimeout(sendQualityInfo, 1500);
    setInterval(sendQualityInfo, 3000);
})();
