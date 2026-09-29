// popup.js — runs inside popup.html

const dot        = document.getElementById('status-dot');
const statusTx   = document.getElementById('status-text');
const statusPill = document.getElementById('status-pill');
const rows = {
    lock:      document.getElementById('row-lock') || document.getElementById('row-hide'),
    wfs:       document.getElementById('row-wfs'),
    autowfs:   document.getElementById('row-autowfs'),
    zoom:      document.getElementById('row-zoom'),
    quality:   document.getElementById('row-quality'),
    cinema:    document.getElementById('row-cinema'),
    timestamp: document.getElementById('row-timestamp'),
    opacity:   document.getElementById('row-opacity'),
};
const chks = {
    lock:      document.getElementById('chk-lock') || document.getElementById('chk-hide'),
    wfs:       document.getElementById('chk-wfs'),
    autowfs:   document.getElementById('chk-autowfs'),
    quality:   document.getElementById('chk-quality'),
    cinema:    document.getElementById('chk-cinema'),
    timestamp: document.getElementById('chk-timestamp'),
    opacity:   document.getElementById('chk-opacity'),
};
const slider         = document.getElementById('slider-opacity');
const opacityDisplay = document.getElementById('opacity-display');
const zoomDisplay    = document.getElementById('zoom-display');
const qualityDisplay = document.getElementById('quality-display');
const btnZoomReset   = document.getElementById('btn-zoom-reset');

function updateSliderFill(pct) {
    if (slider) {
        slider.style.setProperty('--slider-pct', `${pct}%`);
    }
}

async function getTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

// Pre-load persistent settings like autoWFS from storage
chrome.storage.local.get({ autoWFS: true }, (res) => {
    if (chks.autowfs) {
        chks.autowfs.checked = res.autoWFS;
    }
});

async function init() {
    const tab = await getTab();
    if (!tab?.id) return;

    let state = null;
    try {
        state = await chrome.tabs.sendMessage(tab.id, { action: 'getState' });
    } catch (_) { /* content script not present */ }

    if (!state) {
        dot?.classList.remove('active');
        statusTx?.classList.remove('active');
        statusPill?.classList.remove('active');
        if (statusTx) statusTx.textContent = 'Not on a YouTube video';
        // Enable Auto-open toggle so it can be adjusted before opening a video
        rows.autowfs?.classList.remove('disabled');
        return;
    }

    // Active on a watch page
    dot?.classList.add('active');
    statusTx?.classList.add('active');
    statusPill?.classList.add('active');
    if (statusTx) statusTx.textContent = 'Active';

    // Enable all rows
    Object.values(rows).forEach(r => r?.classList.remove('disabled'));

    // Set toggle states
    if (chks.lock)      chks.lock.checked      = state.controlsLocked ?? state.hideControls ?? false;
    if (chks.wfs)       chks.wfs.checked       = state.wfs;
    if (chks.autowfs)   chks.autowfs.checked   = state.autoWFS ?? true;
    if (chks.quality)   chks.quality.checked   = state.qualityVisible ?? true;
    if (chks.cinema)    chks.cinema.checked    = state.cinema;
    if (chks.timestamp) chks.timestamp.checked = state.isTimestampVisible ?? false;
    if (chks.opacity)   chks.opacity.checked   = state.opacityEnabled ?? true;

    // Set quality display
    if (state.qualityLabel && qualityDisplay) {
        qualityDisplay.textContent = state.qualityLabel;
    }

    // Set slider from live state
    const pct = Math.round((state.controlOpacity ?? 1) * 100);
    if (slider) {
        slider.value = pct;
        updateSliderFill(pct);
    }
    if (opacityDisplay) {
        opacityDisplay.textContent = pct + '%';
    }

    // Set zoom display
    const zoomPct = Math.round((state.zoomLevel ?? 1) * 100);
    if (zoomDisplay) {
        zoomDisplay.textContent = zoomPct + '%';
        if (zoomPct > 100) {
            zoomDisplay.style.background = 'rgba(255, 31, 61, 0.18)';
            zoomDisplay.style.color = '#ff4d6a';
        } else {
            zoomDisplay.style.background = 'rgba(255, 255, 255, 0.06)';
            zoomDisplay.style.color = '#cbd5e1';
        }
    }

    // ── Wire toggles ──
    chks.lock?.addEventListener('change', async () => {
        const t = await getTab();
        if (t?.id) chrome.tabs.sendMessage(t.id, { action: 'toggleLockControls' }).catch(() => {});
    });
    chks.wfs?.addEventListener('change', async () => {
        const t = await getTab();
        if (t?.id) chrome.tabs.sendMessage(t.id, { action: 'toggleWindowedFS' }).catch(() => {});
    });
    chks.autowfs?.addEventListener('change', async () => {
        const enabled = chks.autowfs.checked;
        chrome.storage.local.set({ autoWFS: enabled });
        const t = await getTab();
        if (t?.id) chrome.tabs.sendMessage(t.id, { action: 'toggleAutoWFS', enabled }).catch(() => {});
    });
    chks.quality?.addEventListener('change', async () => {
        const t = await getTab();
        if (t?.id) chrome.tabs.sendMessage(t.id, { action: 'toggleQuality' }).catch(() => {});
    });
    chks.cinema?.addEventListener('change', async () => {
        const t = await getTab();
        if (t?.id) chrome.tabs.sendMessage(t.id, { action: 'toggleCinema' }).catch(() => {});
    });
    chks.opacity?.addEventListener('change', async () => {
        const t = await getTab();
        if (t?.id) chrome.tabs.sendMessage(t.id, { action: 'toggleOpacity' }).catch(() => {});
    });
    chks.timestamp?.addEventListener('change', async () => {
        const t = await getTab();
        if (t?.id) chrome.tabs.sendMessage(t.id, { action: 'toggleTimestamp' }).catch(() => {});
    });

    // ── Wire opacity slider ──
    slider?.addEventListener('input', async () => {
        const p = parseInt(slider.value, 10);
        if (opacityDisplay) opacityDisplay.textContent = p + '%';
        updateSliderFill(p);
        const val = p / 100; // 0.0 – 1.0
        const t = await getTab();
        if (t?.id) chrome.tabs.sendMessage(t.id, { action: 'setControlOpacity', value: val }).catch(() => {});
    });

    // ── Wire zoom reset button ──
    btnZoomReset?.addEventListener('click', async () => {
        const t = await getTab();
        if (t?.id) chrome.tabs.sendMessage(t.id, { action: 'resetZoom' }).catch(() => {});
        if (zoomDisplay) {
            zoomDisplay.textContent = '100%';
            zoomDisplay.style.background = 'rgba(255, 255, 255, 0.06)';
            zoomDisplay.style.color = '#cbd5e1';
        }
    });
}

init();
