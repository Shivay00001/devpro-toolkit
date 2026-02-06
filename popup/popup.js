// DevPro Toolkit - Popup Script
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initTabManager();
    initJSONViewer();
    initDarkMode();
    initFocusMode();
    initRESTClient();
    initSecurity();
    initSettings();
    initPremium();
});

// ==================== Premium/Monetization ====================
const WHATSAPP_LINK = 'https://wa.me/917479701271?text=Hi!%20I%20want%20to%20upgrade%20DevPro%20Toolkit%20to%20Premium%20🚀';

const DAILY_LIMITS = {
    tabSaves: 5,
    jsonFormats: 10,
    restRequests: 10,
    focusSessions: 3
};

async function initPremium() {
    await updateUsageBadge();

    // Upgrade modal handlers
    document.getElementById('usageBadge').addEventListener('click', showUpgradeModal);
    document.getElementById('closeUpgrade').addEventListener('click', hideUpgradeModal);
    document.getElementById('upgradeBtn').addEventListener('click', () => {
        window.open(WHATSAPP_LINK, '_blank');
    });
    document.getElementById('activateKeyBtn').addEventListener('click', activatePremiumKey);

    // Close modal on background click
    document.getElementById('upgradeModal').addEventListener('click', (e) => {
        if (e.target.id === 'upgradeModal') hideUpgradeModal();
    });
}

async function getUsage() {
    const today = new Date().toDateString();
    const usage = await Storage.get('dailyUsage', { date: today, counts: {} });
    if (usage.date !== today) {
        return { date: today, counts: {} };
    }
    return usage;
}

async function incrementUsage(feature) {
    const usage = await getUsage();
    usage.counts[feature] = (usage.counts[feature] || 0) + 1;
    await Storage.set('dailyUsage', usage);
    await updateUsageBadge();
    return usage.counts[feature];
}

async function checkLimit(feature) {
    const isPremium = await isPremiumUser();
    if (isPremium) return { exceeded: false, remaining: Infinity };

    const usage = await getUsage();
    const count = usage.counts[feature] || 0;
    const limit = DAILY_LIMITS[feature];
    return {
        used: count,
        limit: limit,
        remaining: Math.max(0, limit - count),
        exceeded: count >= limit
    };
}

async function canUseFeature(feature) {
    const status = await checkLimit(feature);
    if (status.exceeded) {
        showUpgradeModal();
        return false;
    }
    return true;
}

async function isPremiumUser() {
    const key = await Storage.get('premiumKey', null);
    return key && validatePremiumKey(key);
}

function validatePremiumKey(key) {
    if (!key) return false;
    const pattern = /^DEVPRO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return pattern.test(key);
}

async function activatePremiumKey() {
    const input = document.getElementById('premiumKeyInput');
    const key = input.value.trim().toUpperCase();

    if (validatePremiumKey(key)) {
        await Storage.set('premiumKey', key);
        await Storage.set('premiumActivatedAt', Date.now());
        hideUpgradeModal();
        await updateUsageBadge();
        showToast('🎉 Premium activated!');
    } else {
        showToast('Invalid key format', 'warning');
    }
}

async function updateUsageBadge() {
    const badge = document.getElementById('usageBadge');
    const text = document.getElementById('usageText');

    const isPremium = await isPremiumUser();
    if (isPremium) {
        badge.className = 'usage-badge premium';
        text.textContent = '⚡ Premium';
        return;
    }

    const usage = await getUsage();
    const totalUsed = Object.values(usage.counts).reduce((a, b) => a + b, 0);
    const totalLimit = Object.values(DAILY_LIMITS).reduce((a, b) => a + b, 0);

    if (totalUsed >= totalLimit * 0.8) {
        badge.className = 'usage-badge warning';
    } else {
        badge.className = 'usage-badge';
    }

    text.textContent = `Free: ${totalUsed}/${totalLimit}`;
}

function showUpgradeModal() {
    document.getElementById('upgradeModal').classList.add('show');
}

function hideUpgradeModal() {
    document.getElementById('upgradeModal').classList.remove('show');
}

// ==================== Tab Navigation ====================

function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab + '-panel';

            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// ==================== Tab Manager ====================
async function initTabManager() {
    await loadSessions();

    document.getElementById('saveSessionBtn').addEventListener('click', async () => {
        // Check daily limit
        if (!await canUseFeature('tabSaves')) return;

        const name = prompt('Session name (optional):');
        await chrome.runtime.sendMessage({ type: 'SAVE_SESSION', name });
        await incrementUsage('tabSaves');
        await loadSessions();
        showToast('Session saved!');
    });

    document.getElementById('collapseBtn').addEventListener('click', async () => {
        if (confirm('This will close all tabs except the current one and save them. Continue?')) {
            await chrome.runtime.sendMessage({ type: 'COLLAPSE_TABS' });
            await loadSessions();
            showToast('Tabs collapsed!');
        }
    });

    document.getElementById('sessionSearch').addEventListener('input', (e) => {
        filterSessions(e.target.value);
    });
}

async function loadSessions() {
    const sessions = await chrome.runtime.sendMessage({ type: 'GET_SESSIONS' });
    const container = document.getElementById('sessionsList');

    if (!sessions || sessions.length === 0) {
        container.innerHTML = '<div class="empty-state">No saved sessions yet</div>';
        return;
    }

    container.innerHTML = sessions.map(session => `
    <div class="session-item" data-id="${session.id}">
      <div class="session-header">
        <span class="session-name">${escapeHtml(session.name)}</span>
        <span class="session-date">${formatDate(session.date)}</span>
      </div>
      <div class="session-tabs">${session.tabs.length} tabs</div>
      <div class="session-actions">
        <button class="btn btn-primary restore-btn" data-id="${session.id}">↗ Restore</button>
        <button class="btn btn-secondary restore-close-btn" data-id="${session.id}">⟳ Replace</button>
        <button class="btn btn-danger delete-btn" data-id="${session.id}">🗑</button>
      </div>
    </div>
  `).join('');

    // Add event listeners
    container.querySelectorAll('.restore-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await chrome.runtime.sendMessage({ type: 'RESTORE_SESSION', sessionId: parseInt(btn.dataset.id), closeCurrent: false });
            showToast('Session restored!');
        });
    });

    container.querySelectorAll('.restore-close-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await chrome.runtime.sendMessage({ type: 'RESTORE_SESSION', sessionId: parseInt(btn.dataset.id), closeCurrent: true });
            showToast('Session replaced!');
        });
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await chrome.runtime.sendMessage({ type: 'DELETE_SESSION', sessionId: parseInt(btn.dataset.id) });
            await loadSessions();
            showToast('Session deleted');
        });
    });
}

function filterSessions(query) {
    const items = document.querySelectorAll('.session-item');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query.toLowerCase()) ? 'block' : 'none';
    });
}

// ==================== JSON Viewer ====================
function initJSONViewer() {
    const input = document.getElementById('jsonInput');
    const output = document.getElementById('jsonOutput');
    const stats = document.getElementById('jsonStats');

    document.getElementById('formatJsonBtn').addEventListener('click', async () => {
        // Check daily limit
        if (!await canUseFeature('jsonFormats')) return;

        const result = JSONViewer.format(input.value);
        if (result.success) {
            await incrementUsage('jsonFormats');
            output.innerHTML = JSONViewer.syntaxHighlight(result.formatted);
            const s = JSONViewer.getStats(result.parsed);
            stats.textContent = `Nodes: ${s.nodes} | Depth: ${s.depth} | Size: ${s.size} bytes`;
        } else {
            output.innerHTML = `<span style="color: var(--danger)">Error: ${result.error}</span>`;
            stats.textContent = '';
        }
    });

    document.getElementById('minifyJsonBtn').addEventListener('click', () => {
        const result = JSONViewer.minify(input.value);
        if (result.success) {
            input.value = result.minified;
            output.textContent = result.minified;
            showToast('JSON minified!');
        } else {
            output.innerHTML = `<span style="color: var(--danger)">Error: ${result.error}</span>`;
        }
    });

    document.getElementById('copyJsonBtn').addEventListener('click', () => {
        const text = output.textContent;
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!');
    });
}

// ==================== Dark Mode ====================
async function initDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    const brightnessSlider = document.getElementById('brightnessSlider');
    const contrastSlider = document.getElementById('contrastSlider');
    const brightnessValue = document.getElementById('brightnessValue');
    const contrastValue = document.getElementById('contrastValue');

    // Load current settings
    const settings = await chrome.runtime.sendMessage({ type: 'GET_DARK_MODE' });
    toggle.checked = settings.enabled;
    brightnessSlider.value = settings.brightness;
    contrastSlider.value = settings.contrast;
    brightnessValue.textContent = settings.brightness + '%';
    contrastValue.textContent = settings.contrast + '%';
    await loadWhitelist(settings.whitelist);

    toggle.addEventListener('change', async () => {
        await chrome.runtime.sendMessage({ type: 'TOGGLE_DARK_MODE', enabled: toggle.checked });
        showToast(toggle.checked ? 'Dark mode enabled' : 'Dark mode disabled');
    });

    brightnessSlider.addEventListener('input', async () => {
        brightnessValue.textContent = brightnessSlider.value + '%';
    });

    brightnessSlider.addEventListener('change', async () => {
        await Storage.saveDarkModeSettings({
            ...await Storage.getDarkModeSettings(),
            brightness: parseInt(brightnessSlider.value)
        });
    });

    contrastSlider.addEventListener('input', async () => {
        contrastValue.textContent = contrastSlider.value + '%';
    });

    contrastSlider.addEventListener('change', async () => {
        await Storage.saveDarkModeSettings({
            ...await Storage.getDarkModeSettings(),
            contrast: parseInt(contrastSlider.value)
        });
    });

    document.getElementById('addWhitelistBtn').addEventListener('click', async () => {
        const input = document.getElementById('whitelistInput');
        const domain = input.value.trim();
        if (domain) {
            const settings = await Storage.getDarkModeSettings();
            if (!settings.whitelist.includes(domain)) {
                settings.whitelist.push(domain);
                await Storage.saveDarkModeSettings(settings);
                await loadWhitelist(settings.whitelist);
                input.value = '';
            }
        }
    });
}

async function loadWhitelist(whitelist) {
    const list = document.getElementById('whitelistList');
    const count = document.getElementById('whitelistCount');
    count.textContent = whitelist.length;

    list.innerHTML = whitelist.map(domain => `
    <li>
      <span>${escapeHtml(domain)}</span>
      <button data-domain="${domain}">×</button>
    </li>
  `).join('');

    list.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', async () => {
            const settings = await Storage.getDarkModeSettings();
            settings.whitelist = settings.whitelist.filter(d => d !== btn.dataset.domain);
            await Storage.saveDarkModeSettings(settings);
            await loadWhitelist(settings.whitelist);
        });
    });
}

// ==================== Focus Mode ====================
let focusInterval = null;

async function initFocusMode() {
    await loadFocusSettings();

    document.getElementById('startFocusBtn').addEventListener('click', async () => {
        // Check daily limit
        if (!await canUseFeature('focusSessions')) return;

        await chrome.runtime.sendMessage({ type: 'START_FOCUS' });
        await incrementUsage('focusSessions');
        startTimer();
        showToast('Focus session started!');
    });

    document.getElementById('stopFocusBtn').addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ type: 'END_FOCUS', completed: false });
        stopTimer();
        showToast('Focus session ended');
    });

    document.getElementById('addBlockedBtn').addEventListener('click', async () => {
        const input = document.getElementById('blockedSiteInput');
        const site = input.value.trim();
        if (site) {
            const settings = await Storage.getFocusSettings();
            const domain = site.replace('www.', '').replace(/https?:\/\//, '');
            if (!settings.blockedSites.includes(domain)) {
                settings.blockedSites.push(domain);
                await Storage.saveFocusSettings(settings);
                await loadBlockedSites(settings.blockedSites);
                input.value = '';
            }
        }
    });

    // Check if focus is active
    const settings = await Storage.getFocusSettings();
    if (settings.isActive) {
        startTimer();
    }
}

async function loadFocusSettings() {
    const settings = await Storage.getFocusSettings();
    document.getElementById('sessionsCount').textContent = settings.stats.sessionsCompleted;
    document.getElementById('totalMinutes').textContent = settings.stats.totalMinutes;
    await loadBlockedSites(settings.blockedSites);
}

async function loadBlockedSites(sites) {
    const list = document.getElementById('blockedList');
    list.innerHTML = sites.map(site => `
    <li>
      <span>${escapeHtml(site)}</span>
      <button data-site="${site}">×</button>
    </li>
  `).join('');

    list.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', async () => {
            const settings = await Storage.getFocusSettings();
            settings.blockedSites = settings.blockedSites.filter(s => s !== btn.dataset.site);
            await Storage.saveFocusSettings(settings);
            await loadBlockedSites(settings.blockedSites);
        });
    });
}

function startTimer() {
    document.getElementById('startFocusBtn').classList.add('hidden');
    document.getElementById('stopFocusBtn').classList.remove('hidden');
    document.getElementById('timerStatus').textContent = 'Focus in progress...';

    updateTimer();
    focusInterval = setInterval(updateTimer, 1000);
}

async function updateTimer() {
    const remaining = await chrome.runtime.sendMessage({ type: 'GET_TIME_REMAINING' });
    if (remaining === null || remaining <= 0) {
        stopTimer();
        return;
    }
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    document.getElementById('timerDisplay').textContent =
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function stopTimer() {
    if (focusInterval) {
        clearInterval(focusInterval);
        focusInterval = null;
    }
    document.getElementById('startFocusBtn').classList.remove('hidden');
    document.getElementById('stopFocusBtn').classList.add('hidden');
    document.getElementById('timerDisplay').textContent = '25:00';
    document.getElementById('timerStatus').textContent = 'Ready to focus';
    loadFocusSettings();
}

// ==================== REST Client ====================
function initRESTClient() {
    document.getElementById('sendRequestBtn').addEventListener('click', sendRequest);
}

async function sendRequest() {
    const method = document.getElementById('restMethod').value;
    const url = document.getElementById('restUrl').value;
    const headersStr = document.getElementById('restHeaders').value;
    const body = document.getElementById('restBody').value;

    if (!url) {
        showToast('Please enter a URL', 'warning');
        return;
    }

    const responseBody = document.getElementById('responseBody');
    const responseMeta = document.getElementById('responseMeta');
    responseBody.textContent = 'Loading...';

    try {
        const headers = {};
        if (headersStr) {
            headersStr.split('\n').forEach(line => {
                const [key, ...value] = line.split(':');
                if (key && value.length) {
                    headers[key.trim()] = value.join(':').trim();
                }
            });
        }

        const options = { method, headers };
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
            options.body = body;
            if (!headers['Content-Type']) {
                headers['Content-Type'] = 'application/json';
            }
        }

        const startTime = performance.now();
        const response = await fetch(url, options);
        const endTime = performance.now();

        let data;
        const contentType = response.headers.get('Content-Type') || '';
        if (contentType.includes('application/json')) {
            data = await response.json();
            responseBody.innerHTML = JSONViewer.syntaxHighlight(JSON.stringify(data, null, 2));
        } else {
            data = await response.text();
            responseBody.textContent = data;
        }

        responseMeta.classList.remove('hidden');
        const statusBadge = document.getElementById('responseStatus');
        statusBadge.textContent = `${response.status} ${response.statusText}`;
        statusBadge.className = 'status-badge ' + (response.ok ? 'success' : response.status < 500 ? 'warning' : 'danger');
        document.getElementById('responseTime').textContent = `${Math.round(endTime - startTime)}ms`;
        document.getElementById('responseSize').textContent = `${JSON.stringify(data).length} bytes`;

    } catch (error) {
        responseMeta.classList.add('hidden');
        responseBody.innerHTML = `<span style="color: var(--danger)">Error: ${error.message}</span>`;
    }
}

// ==================== Security ====================
async function initSecurity() {
    await analyzeSecurity();
    document.getElementById('refreshSecurityBtn').addEventListener('click', analyzeSecurity);
}

async function analyzeSecurity() {
    try {
        const analysis = await chrome.runtime.sendMessage({ type: 'ANALYZE_SECURITY' });

        if (analysis.error) {
            document.getElementById('scoreValue').textContent = '--';
            document.getElementById('scoreLabel').textContent = 'Cannot analyze';
            return;
        }

        const score = analysis.score;
        const scoreCircle = document.querySelector('.score-circle');
        scoreCircle.style.setProperty('--score-percent', score + '%');

        document.getElementById('scoreValue').textContent = score;

        const label = document.getElementById('scoreLabel');
        if (score >= 70) {
            label.textContent = 'Secure';
            label.className = 'score-label success';
        } else if (score >= 40) {
            label.textContent = 'Moderate';
            label.className = 'score-label warning';
        } else {
            label.textContent = 'Caution';
            label.className = 'score-label danger';
        }

        document.getElementById('httpsIcon').textContent = analysis.isSecure ? '🔒' : '🔓';
        document.getElementById('httpsText').textContent = analysis.isSecure ?
            'Secure connection (HTTPS)' : 'Not secure (HTTP)';
        document.getElementById('domainText').textContent = analysis.domain || 'Unknown';

        const tips = document.getElementById('securityTips');
        if (!analysis.isSecure) {
            tips.className = 'security-tips warning';
            tips.textContent = '⚠️ This site is not using HTTPS. Be careful with sensitive data.';
        } else if (score >= 70) {
            tips.className = 'security-tips success';
            tips.textContent = '✓ This site appears to be secure.';
        } else {
            tips.className = 'security-tips caution';
            tips.textContent = '⚠️ Exercise caution on this site.';
        }

    } catch (error) {
        console.error('Security analysis error:', error);
    }
}

// ==================== Settings ====================
function initSettings() {
    document.getElementById('settingsBtn').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
}

// ==================== Utilities ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return date.toLocaleDateString();
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'success' ? 'var(--success)' : 'var(--warning)'};
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    z-index: 1000;
    animation: slideUp 0.3s ease;
  `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Add toast animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);
