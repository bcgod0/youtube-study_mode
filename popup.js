// popup.js — runs inside popup.html

const dot      = document.getElementById('status-dot');
const statusTx = document.getElementById('status-text');
const rows = {
    hide:      document.getElementById('row-hide'),
    wfs:       document.getElementById('row-wfs'),
    zoom:      document.getElementById('row-zoom'),
    cinema:    document.getElementById('row-cinema'),
    timestamp: document.getElementById('row-timestamp'),
    opacity:   document.getElementById('row-opacity'),
};
const chks = {
    hide:      document.getElementById('chk-hide'),
    wfs:       document.getElementById('chk-wfs'),
    cinema:    document.getElementById('chk-cinema'),
    timestamp: document.getElementById('chk-timestamp'),
    opacity:   document.getElementById('chk-opacity'),
};
const slider         = document.getElementById('slider-opacity');
const opacityDisplay = document.getElementById('opacity-display');
const zoomDisplay    = document.getElementById('zoom-display');
const btnZoomReset   = document.getElementById('btn-zoom-reset');

async function getTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

async function init() {
    const tab = await getTab();
    if (!tab?.id) return;

    let state = null;
    try {
        state = await chrome.tabs.sendMessage(tab.id, { action: 'getState' });
    } catch (_) { /* content script not present */ }

    if (!state) {
        dot.classList.remove('active');
        statusTx.classList.remove('active');
        statusTx.textContent = 'Open a YouTube video to use features';
        return;
    }

    // Active on a watch page
    dot.classList.add('active');
    statusTx.classList.add('active');
    statusTx.textContent = 'Active on this page';

    // Enable all rows
    Object.values(rows).forEach(r => r.classList.remove('disabled'));

    // Set toggle states
    chks.hide.checked      = state.hideControls;
    chks.wfs.checked       = state.wfs;
    chks.cinema.checked    = state.cinema;
    chks.timestamp.checked = state.isTimestampVisible ?? false;
    chks.opacity.checked   = state.opacityEnabled ?? true;

    // Set slider from live state
    const pct = Math.round((state.controlOpacity ?? 1) * 100);
    slider.value               = pct;
    opacityDisplay.textContent = pct + '%';

    // Set zoom display
    const zoomPct = Math.round((state.zoomLevel ?? 1) * 100);
    zoomDisplay.textContent = zoomPct + '%';
    if (zoomPct > 100) {
        zoomDisplay.style.color = '#ff4444';
    } else {
        zoomDisplay.style.color = '#666';
    }

    // ── Wire toggles ──
    chks.hide.addEventListener('change', async () => {
        const t = await getTab();
        chrome.tabs.sendMessage(t.id, { action: 'toggleHideControls' }).catch(() => {});
    });
    chks.wfs.addEventListener('change', async () => {
        const t = await getTab();
        chrome.tabs.sendMessage(t.id, { action: 'toggleWindowedFS' }).catch(() => {});
    });
    chks.cinema.addEventListener('change', async () => {
        const t = await getTab();
        chrome.tabs.sendMessage(t.id, { action: 'toggleCinema' }).catch(() => {});
    });
    chks.opacity.addEventListener('change', async () => {
        const t = await getTab();
        chrome.tabs.sendMessage(t.id, { action: 'toggleOpacity' }).catch(() => {});
    });
    chks.timestamp.addEventListener('change', async () => {
        const t = await getTab();
        chrome.tabs.sendMessage(t.id, { action: 'toggleTimestamp' }).catch(() => {});
    });

    // ── Wire opacity slider ──
    slider.addEventListener('input', async () => {
        const pct = parseInt(slider.value, 10);
        opacityDisplay.textContent = pct + '%';
        const val = pct / 100;          // 0.0 – 1.0
        const t = await getTab();
        chrome.tabs.sendMessage(t.id, { action: 'setControlOpacity', value: val }).catch(() => {});
    });

    // ── Wire zoom reset button ──
    btnZoomReset.addEventListener('click', async () => {
        const t = await getTab();
        chrome.tabs.sendMessage(t.id, { action: 'resetZoom' }).catch(() => {});
        zoomDisplay.textContent = '100%';
        zoomDisplay.style.color = '#666';
    });
}

init();
