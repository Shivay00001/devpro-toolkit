// DevPro Toolkit - Background Service Worker
importScripts('../lib/storage.js');
importScripts('../modules/tab-manager.js');
importScripts('../modules/dark-mode.js');
importScripts('../modules/focus-mode.js');
importScripts('../modules/security.js');

// Listen for tab updates to check for blocked sites
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading' && tab.url) {
        const isBlocked = await FocusMode.isBlocked(tab.url);
        if (isBlocked) {
            // Redirect to blocked page
            chrome.tabs.update(tabId, {
                url: chrome.runtime.getURL('blocked/blocked.html')
            });
        }
    }
});

// Listen for alarm events (Pomodoro timer)
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'focusSessionEnd') {
        await FocusMode.endFocusSession(true);

        // Show notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: '../icons/icon128.png',
            title: 'Focus Session Complete!',
            message: 'Great work! Time for a short break.',
            priority: 2
        });
    }
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender).then(sendResponse);
    return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
    switch (message.type) {
        case 'GET_DARK_MODE':
            return await DarkMode.getSettings();

        case 'TOGGLE_DARK_MODE':
            return await DarkMode.toggle(message.enabled);

        case 'GET_FOCUS_SETTINGS':
            return await FocusMode.getSettings();

        case 'START_FOCUS':
            return await FocusMode.startFocusSession();

        case 'END_FOCUS':
            return await FocusMode.endFocusSession(message.completed);

        case 'GET_TIME_REMAINING':
            return await FocusMode.getTimeRemaining();

        case 'ANALYZE_SECURITY':
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab) {
                return await Security.analyzeTab(activeTab.id);
            }
            return { error: 'No active tab' };

        case 'SAVE_SESSION':
            return await TabManager.saveSession(message.name);

        case 'GET_SESSIONS':
            return await TabManager.getSessions();

        case 'RESTORE_SESSION':
            return await TabManager.restoreSession(message.sessionId, message.closeCurrent);

        case 'DELETE_SESSION':
            return await TabManager.deleteSession(message.sessionId);

        case 'COLLAPSE_TABS':
            return await TabManager.collapseToList();

        default:
            return { error: 'Unknown message type' };
    }
}

// Auto-save session on browser close (best effort)
chrome.runtime.onSuspend?.addListener(async () => {
    await TabManager.saveSession('Auto-saved before close');
});

console.log('DevPro Toolkit Service Worker initialized');
