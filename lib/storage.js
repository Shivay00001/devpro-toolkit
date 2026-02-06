// DevPro Toolkit - Storage Utility
const Storage = {
    async get(key, defaultValue = null) {
        const result = await chrome.storage.local.get(key);
        return result[key] ?? defaultValue;
    },

    async set(key, value) {
        await chrome.storage.local.set({ [key]: value });
    },

    async getAll() {
        return await chrome.storage.local.get(null);
    },

    async remove(key) {
        await chrome.storage.local.remove(key);
    },

    async clear() {
        await chrome.storage.local.clear();
    },

    // Specific getters for each module
    async getSessions() {
        return await this.get('sessions', []);
    },

    async saveSessions(sessions) {
        await this.set('sessions', sessions);
    },

    async getDarkModeSettings() {
        return await this.get('darkMode', {
            enabled: false,
            whitelist: [],
            brightness: 100,
            contrast: 100
        });
    },

    async saveDarkModeSettings(settings) {
        await this.set('darkMode', settings);
    },

    async getFocusSettings() {
        return await this.get('focus', {
            blockedSites: ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'reddit.com'],
            pomodoroWork: 25,
            pomodoroBreak: 5,
            isActive: false,
            stats: { sessionsCompleted: 0, totalMinutes: 0 }
        });
    },

    async saveFocusSettings(settings) {
        await this.set('focus', settings);
    },

    async getRestHistory() {
        return await this.get('restHistory', []);
    },

    async saveRestHistory(history) {
        await this.set('restHistory', history.slice(0, 50)); // Keep last 50
    }
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.Storage = Storage;
}
