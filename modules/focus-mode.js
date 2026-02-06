// DevPro Toolkit - Focus Mode Module
const FocusMode = {
    async getSettings() {
        return await Storage.getFocusSettings();
    },

    async updateSettings(newSettings) {
        const settings = await Storage.getFocusSettings();
        Object.assign(settings, newSettings);
        await Storage.saveFocusSettings(settings);
        return settings;
    },

    async addBlockedSite(site) {
        const settings = await Storage.getFocusSettings();
        const domain = this.extractDomain(site);
        if (!settings.blockedSites.includes(domain)) {
            settings.blockedSites.push(domain);
            await Storage.saveFocusSettings(settings);
        }
        return settings.blockedSites;
    },

    async removeBlockedSite(site) {
        const settings = await Storage.getFocusSettings();
        settings.blockedSites = settings.blockedSites.filter(s => s !== site);
        await Storage.saveFocusSettings(settings);
        return settings.blockedSites;
    },

    extractDomain(url) {
        try {
            if (!url.includes('://')) url = 'https://' + url;
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url.replace('www.', '');
        }
    },

    async isBlocked(url) {
        const settings = await Storage.getFocusSettings();
        if (!settings.isActive) return false;

        try {
            const domain = this.extractDomain(url);
            return settings.blockedSites.some(blocked => domain.includes(blocked));
        } catch {
            return false;
        }
    },

    async startFocusSession() {
        const settings = await Storage.getFocusSettings();
        settings.isActive = true;
        settings.sessionStartTime = Date.now();
        await Storage.saveFocusSettings(settings);

        // Set alarm for session end
        chrome.alarms.create('focusSessionEnd', {
            delayInMinutes: settings.pomodoroWork
        });

        return settings;
    },

    async endFocusSession(completed = true) {
        const settings = await Storage.getFocusSettings();

        if (completed && settings.sessionStartTime) {
            const minutes = Math.round((Date.now() - settings.sessionStartTime) / 60000);
            settings.stats.sessionsCompleted++;
            settings.stats.totalMinutes += minutes;
        }

        settings.isActive = false;
        settings.sessionStartTime = null;
        await Storage.saveFocusSettings(settings);

        chrome.alarms.clear('focusSessionEnd');

        return settings;
    },

    async getTimeRemaining() {
        const settings = await Storage.getFocusSettings();
        if (!settings.isActive || !settings.sessionStartTime) {
            return null;
        }

        const elapsed = (Date.now() - settings.sessionStartTime) / 60000;
        const remaining = settings.pomodoroWork - elapsed;
        return Math.max(0, Math.round(remaining * 60)); // Return seconds
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
};
