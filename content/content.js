// DevPro Toolkit - Content Script
(async function () {
    // Listen for messages from background/popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'UPDATE_DARK_MODE') {
            applyDarkMode();
        }
    });

    // Apply dark mode on page load
    await applyDarkMode();

    async function applyDarkMode() {
        try {
            const settings = await chrome.storage.local.get('darkMode');
            const darkModeSettings = settings.darkMode || { enabled: false, whitelist: [], brightness: 100, contrast: 100 };

            // Check if current site is whitelisted
            const currentDomain = window.location.hostname;
            const isWhitelisted = darkModeSettings.whitelist.some(d => currentDomain.includes(d));

            // Remove existing dark mode styles
            const existingStyle = document.getElementById('devpro-dark-mode');
            if (existingStyle) {
                existingStyle.remove();
            }

            // Apply dark mode if enabled and not whitelisted
            if (darkModeSettings.enabled && !isWhitelisted) {
                const style = document.createElement('style');
                style.id = 'devpro-dark-mode';
                style.textContent = generateDarkModeCSS(darkModeSettings);

                // Insert at the beginning of head for lowest priority
                const head = document.head || document.documentElement;
                if (head.firstChild) {
                    head.insertBefore(style, head.firstChild);
                } else {
                    head.appendChild(style);
                }
            }
        } catch (error) {
            console.error('DevPro Toolkit: Error applying dark mode', error);
        }
    }

    function generateDarkModeCSS(settings) {
        const brightness = (settings.brightness || 100) / 100;
        const contrast = (settings.contrast || 100) / 100;

        return `
      /* DevPro Toolkit Dark Mode */
      html {
        filter: invert(1) hue-rotate(180deg) brightness(${brightness}) contrast(${contrast}) !important;
        background-color: #111 !important;
      }
      
      /* Preserve images and videos */
      img,
      video,
      picture,
      canvas,
      iframe,
      svg,
      [style*="background-image"],
      .emoji,
      [data-emoji] {
        filter: invert(1) hue-rotate(180deg) !important;
      }
      
      /* Preserve common media containers */
      figure img,
      picture img,
      .image img,
      .photo img,
      .thumbnail img,
      .avatar img {
        filter: invert(1) hue-rotate(180deg) !important;
      }
      
      /* Don't double-invert nested elements */
      img img,
      video video {
        filter: none !important;
      }
    `;
    }
})();
