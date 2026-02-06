// DevPro Toolkit - Dark Mode Module
const DarkMode = {
    async toggle(enabled = null) {
        const settings = await Storage.getDarkModeSettings();
        settings.enabled = enabled !== null ? enabled : !settings.enabled;
        await Storage.saveDarkModeSettings(settings);
        await this.applyToAllTabs();
        return settings.enabled;
    },

    async isEnabled() {
        const settings = await Storage.getDarkModeSettings();
        return settings.enabled;
    },

    async getSettings() {
        return await Storage.getDarkModeSettings();
    },

    async updateSettings(newSettings) {
        const settings = await Storage.getDarkModeSettings();
        Object.assign(settings, newSettings);
        await Storage.saveDarkModeSettings(settings);
        await this.applyToAllTabs();
        return settings;
    },

    async addToWhitelist(domain) {
        const settings = await Storage.getDarkModeSettings();
        if (!settings.whitelist.includes(domain)) {
            settings.whitelist.push(domain);
            await Storage.saveDarkModeSettings(settings);
        }
        return settings.whitelist;
    },

    async removeFromWhitelist(domain) {
        const settings = await Storage.getDarkModeSettings();
        settings.whitelist = settings.whitelist.filter(d => d !== domain);
        await Storage.saveDarkModeSettings(settings);
        return settings.whitelist;
    },

    async isWhitelisted(url) {
        const settings = await Storage.getDarkModeSettings();
        try {
            const domain = new URL(url).hostname;
            return settings.whitelist.some(w => domain.includes(w));
        } catch {
            return false;
        }
    },

    async applyToAllTabs() {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            if (tab.url && !tab.url.startsWith('chrome://')) {
                try {
                    await chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_DARK_MODE' });
                } catch {
                    // Tab might not have content script loaded
                }
            }
        }
    },

    generateCSS(settings) {
        const brightness = settings.brightness / 100;
        const contrast = settings.contrast / 100;

        return `
      html {
        filter: invert(1) hue-rotate(180deg) brightness(${brightness}) contrast(${contrast}) !important;
        background-color: #111 !important;
      }
      
      img, video, picture, canvas, iframe, svg,
      [style*="background-image"] {
        filter: invert(1) hue-rotate(180deg) !important;
      }
      
      /* Preserve colors in code blocks */
      pre, code {
        filter: none !important;
      }
    `;
    }
};
