// DevPro Toolkit - Tab Manager Module
const TabManager = {
    async saveSession(name = null) {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const session = {
            id: Date.now(),
            name: name || `Session ${new Date().toLocaleString()}`,
            date: new Date().toISOString(),
            tabs: tabs.map(tab => ({
                url: tab.url,
                title: tab.title,
                favIconUrl: tab.favIconUrl
            }))
        };

        const sessions = await Storage.getSessions();
        sessions.unshift(session);
        await Storage.saveSessions(sessions.slice(0, 100)); // Keep last 100 sessions
        return session;
    },

    async getSessions() {
        return await Storage.getSessions();
    },

    async deleteSession(sessionId) {
        const sessions = await Storage.getSessions();
        const filtered = sessions.filter(s => s.id !== sessionId);
        await Storage.saveSessions(filtered);
    },

    async restoreSession(sessionId, closeCurrent = false) {
        const sessions = await Storage.getSessions();
        const session = sessions.find(s => s.id === sessionId);

        if (!session) return false;

        if (closeCurrent) {
            const currentTabs = await chrome.tabs.query({ currentWindow: true });
            const tabIds = currentTabs.map(t => t.id).filter(id => id);
            if (tabIds.length > 0) {
                await chrome.tabs.remove(tabIds);
            }
        }

        for (const tab of session.tabs) {
            if (tab.url && !tab.url.startsWith('chrome://')) {
                await chrome.tabs.create({ url: tab.url, active: false });
            }
        }
        return true;
    },

    async collapseToList() {
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const session = await this.saveSession('Collapsed Tabs');

        // Keep only the first tab or create a new tab
        const tabIds = tabs.slice(1).map(t => t.id).filter(id => id);
        if (tabIds.length > 0) {
            await chrome.tabs.remove(tabIds);
        }

        return session;
    },

    async restoreTab(url) {
        await chrome.tabs.create({ url });
    },

    searchSessions(sessions, query) {
        if (!query) return sessions;
        const lowerQuery = query.toLowerCase();
        return sessions.filter(session =>
            session.name.toLowerCase().includes(lowerQuery) ||
            session.tabs.some(tab =>
                tab.title?.toLowerCase().includes(lowerQuery) ||
                tab.url?.toLowerCase().includes(lowerQuery)
            )
        );
    }
};
