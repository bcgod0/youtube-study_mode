// background.js — service worker
// Forwards the extension-button click to the active tab's content script.

chrome.action.onClicked.addListener((tab) => {
    if (!tab.id) return;
    chrome.tabs.sendMessage(tab.id, { action: 'toggleWindowedFS' })
        .catch(() => {
            // Content script not present on this tab (non-watch page or not yet injected) — ignore.
        });
});
