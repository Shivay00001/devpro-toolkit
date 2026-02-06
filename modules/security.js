// DevPro Toolkit - Security Module
const Security = {
    async analyzeTab(tabId) {
        try {
            const tab = await chrome.tabs.get(tabId);
            const url = new URL(tab.url);

            return {
                url: tab.url,
                isSecure: url.protocol === 'https:',
                protocol: url.protocol.replace(':', ''),
                domain: url.hostname,
                score: this.calculateScore(tab.url)
            };
        } catch (error) {
            return {
                error: error.message,
                isSecure: false,
                score: 0
            };
        }
    },

    calculateScore(url) {
        let score = 50; // Base score

        try {
            const parsed = new URL(url);

            // HTTPS bonus
            if (parsed.protocol === 'https:') score += 30;

            // Known secure domains bonus
            const secureDomains = ['google.com', 'github.com', 'microsoft.com', 'amazon.com'];
            if (secureDomains.some(d => parsed.hostname.includes(d))) {
                score += 10;
            }

            // Suspicious patterns penalty
            if (parsed.hostname.includes('--') ||
                parsed.hostname.split('.').length > 4 ||
                /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(parsed.hostname)) {
                score -= 20;
            }

            // Long subdomain penalty
            if (parsed.hostname.split('.')[0].length > 20) {
                score -= 10;
            }

        } catch {
            score = 0;
        }

        return Math.max(0, Math.min(100, score));
    },

    getScoreLabel(score) {
        if (score >= 80) return { label: 'Secure', class: 'success' };
        if (score >= 60) return { label: 'Good', class: 'success' };
        if (score >= 40) return { label: 'Moderate', class: 'warning' };
        if (score >= 20) return { label: 'Caution', class: 'warning' };
        return { label: 'Unsafe', class: 'danger' };
    },

    formatProtocol(protocol) {
        return protocol.toUpperCase();
    },

    async getCookieCount(domain) {
        try {
            const cookies = await chrome.cookies.getAll({ domain });
            return cookies.length;
        } catch {
            return 0;
        }
    },

    getSecurityTips(analysis) {
        const tips = [];

        if (!analysis.isSecure) {
            tips.push({
                type: 'warning',
                message: 'This site is not using HTTPS. Your data may not be encrypted.'
            });
        }

        if (analysis.score < 50) {
            tips.push({
                type: 'caution',
                message: 'This site has a low security score. Be careful with sensitive data.'
            });
        }

        if (analysis.score >= 80) {
            tips.push({
                type: 'success',
                message: 'This site appears to be secure.'
            });
        }

        return tips;
    }
};
