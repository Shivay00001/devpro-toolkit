// DevPro Toolkit - Options Page Script
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    initEventListeners();
});

async function loadSettings() {
    const data = await chrome.storage.local.get(null);

    // General settings
    document.getElementById('notificationsEnabled').checked = data.notificationsEnabled !== false;
    document.getElementById('autoSaveEnabled').checked = data.autoSaveEnabled !== false;

    // Focus settings
    const focus = data.focus || { pomodoroWork: 25, pomodoroBreak: 5 };
    document.getElementById('pomodoroWork').value = focus.pomodoroWork;
    document.getElementById('pomodoroBreak').value = focus.pomodoroBreak;

    // Dark mode settings
    const darkMode = data.darkMode || { enabled: false };
    document.getElementById('darkModeDefault').checked = darkMode.enabled;
}

function initEventListeners() {
    // General toggles
    document.getElementById('notificationsEnabled').addEventListener('change', async (e) => {
        await chrome.storage.local.set({ notificationsEnabled: e.target.checked });
        showToast('Settings saved');
    });

    document.getElementById('autoSaveEnabled').addEventListener('change', async (e) => {
        await chrome.storage.local.set({ autoSaveEnabled: e.target.checked });
        showToast('Settings saved');
    });

    // Focus settings
    document.getElementById('pomodoroWork').addEventListener('change', async (e) => {
        const focus = (await chrome.storage.local.get('focus')).focus || {};
        focus.pomodoroWork = parseInt(e.target.value) || 25;
        await chrome.storage.local.set({ focus });
        showToast('Work duration updated');
    });

    document.getElementById('pomodoroBreak').addEventListener('change', async (e) => {
        const focus = (await chrome.storage.local.get('focus')).focus || {};
        focus.pomodoroBreak = parseInt(e.target.value) || 5;
        await chrome.storage.local.set({ focus });
        showToast('Break duration updated');
    });

    // Dark mode default
    document.getElementById('darkModeDefault').addEventListener('change', async (e) => {
        const darkMode = (await chrome.storage.local.get('darkMode')).darkMode || {};
        darkMode.enabled = e.target.checked;
        await chrome.storage.local.set({ darkMode });
        showToast('Dark mode default updated');
    });

    // Export
    document.getElementById('exportBtn').addEventListener('click', async () => {
        const data = await chrome.storage.local.get(null);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `devpro-toolkit-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data exported successfully');
    });

    // Import
    const importFile = document.getElementById('importFile');
    document.getElementById('importBtn').addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                await chrome.storage.local.set(data);
                showToast('Data imported successfully');
                await loadSettings();
            } catch (error) {
                showToast('Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    });

    // Clear all data
    document.getElementById('clearBtn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete all data? This cannot be undone.')) {
            await chrome.storage.local.clear();
            showToast('All data cleared');
            await loadSettings();
        }
    });
}

function showToast(message, type = 'success') {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: ${type === 'success' ? '#10b981' : '#ef4444'};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease;
    z-index: 1000;
  `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideOut {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(20px); }
  }
`;
document.head.appendChild(style);
