// DevPro Toolkit - Premium/Monetization Module
const Premium = {
    WHATSAPP_LINK: 'https://wa.me/917479701271?text=Hi!%20I%20want%20to%20upgrade%20DevPro%20Toolkit%20to%20Premium%20🚀',

    DAILY_LIMITS: {
        tabSaves: 5,         // Tab session saves per day
        jsonFormats: 10,     // JSON format operations
        restRequests: 10,    // REST API calls
        focusSessions: 3     // Focus mode sessions
    },

    async getUsage() {
        const today = new Date().toDateString();
        const usage = await Storage.get('dailyUsage', { date: today, counts: {} });

        // Reset if new day
        if (usage.date !== today) {
            return { date: today, counts: {} };
        }
        return usage;
    },

    async incrementUsage(feature) {
        const usage = await this.getUsage();
        usage.counts[feature] = (usage.counts[feature] || 0) + 1;
        await Storage.set('dailyUsage', usage);
        return usage.counts[feature];
    },

    async checkLimit(feature) {
        const usage = await this.getUsage();
        const count = usage.counts[feature] || 0;
        const limit = this.DAILY_LIMITS[feature];

        return {
            used: count,
            limit: limit,
            remaining: Math.max(0, limit - count),
            exceeded: count >= limit
        };
    },

    async canUse(feature) {
        const status = await this.checkLimit(feature);
        return !status.exceeded;
    },

    async isPremium() {
        const key = await Storage.get('premiumKey', null);
        return key && this.validateKey(key);
    },

    validateKey(key) {
        // Simple key validation - in production, use server validation
        // Keys format: DEVPRO-XXXX-XXXX-XXXX
        if (!key) return false;
        const pattern = /^DEVPRO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        return pattern.test(key);
    },

    async activatePremium(key) {
        if (this.validateKey(key)) {
            await Storage.set('premiumKey', key);
            await Storage.set('premiumActivatedAt', Date.now());
            return true;
        }
        return false;
    },

    async deactivatePremium() {
        await Storage.remove('premiumKey');
        await Storage.remove('premiumActivatedAt');
    },

    openWhatsApp() {
        window.open(this.WHATSAPP_LINK, '_blank');
    },

    getUpgradeHTML() {
        return `
      <div class="upgrade-modal" id="upgradeModal">
        <div class="upgrade-content">
          <button class="upgrade-close" id="closeUpgrade">×</button>
          <div class="upgrade-icon">🚀</div>
          <h2>Upgrade to Premium</h2>
          <p>You've hit your daily free limit!</p>
          
          <div class="upgrade-features">
            <div class="feature-item">✓ Unlimited tab saves</div>
            <div class="feature-item">✓ Unlimited JSON formatting</div>
            <div class="feature-item">✓ Unlimited REST requests</div>
            <div class="feature-item">✓ Unlimited focus sessions</div>
            <div class="feature-item">✓ Priority support</div>
          </div>
          
          <div class="upgrade-pricing">
            <span class="price">₹99</span>
            <span class="period">/month</span>
          </div>
          
          <button class="btn btn-whatsapp" id="upgradeBtn">
            <span class="wa-icon">💬</span>
            Contact on WhatsApp
          </button>
          
          <div class="key-section">
            <p class="key-label">Already have a key?</p>
            <div class="key-input-group">
              <input type="text" id="premiumKeyInput" placeholder="DEVPRO-XXXX-XXXX-XXXX">
              <button class="btn btn-primary" id="activateKeyBtn">Activate</button>
            </div>
          </div>
        </div>
      </div>
    `;
    },

    getUpgradeCSS() {
        return `
      .upgrade-modal {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        z-index: 1000;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.2s ease;
      }
      
      .upgrade-modal.show {
        display: flex;
      }
      
      .upgrade-content {
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 1px solid rgba(124, 58, 237, 0.3);
        border-radius: 20px;
        padding: 32px;
        max-width: 340px;
        text-align: center;
        position: relative;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      }
      
      .upgrade-close {
        position: absolute;
        top: 12px;
        right: 16px;
        background: transparent;
        border: none;
        color: #666;
        font-size: 24px;
        cursor: pointer;
      }
      
      .upgrade-close:hover {
        color: #fff;
      }
      
      .upgrade-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .upgrade-content h2 {
        font-size: 22px;
        margin-bottom: 8px;
        background: linear-gradient(135deg, #a78bfa, #7c3aed);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      
      .upgrade-content > p {
        color: #a0a0a0;
        margin-bottom: 20px;
      }
      
      .upgrade-features {
        text-align: left;
        background: rgba(124, 58, 237, 0.1);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 20px;
      }
      
      .feature-item {
        padding: 6px 0;
        color: #10b981;
        font-size: 13px;
      }
      
      .upgrade-pricing {
        margin-bottom: 20px;
      }
      
      .price {
        font-size: 36px;
        font-weight: 700;
        color: #fff;
      }
      
      .period {
        color: #666;
        font-size: 14px;
      }
      
      .btn-whatsapp {
        width: 100%;
        padding: 14px 24px;
        background: linear-gradient(135deg, #25d366, #128c7e);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: all 0.2s ease;
      }
      
      .btn-whatsapp:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(37, 211, 102, 0.3);
      }
      
      .wa-icon {
        font-size: 20px;
      }
      
      .key-section {
        margin-top: 24px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .key-label {
        font-size: 12px;
        color: #666;
        margin-bottom: 10px;
      }
      
      .key-input-group {
        display: flex;
        gap: 8px;
      }
      
      .key-input-group input {
        flex: 1;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #fff;
        font-size: 12px;
        font-family: monospace;
        text-transform: uppercase;
      }
      
      .key-input-group input::placeholder {
        text-transform: none;
        color: #444;
      }
      
      .key-input-group .btn {
        padding: 10px 16px;
        font-size: 12px;
      }
      
      /* Usage indicator in header */
      .usage-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: rgba(124, 58, 237, 0.2);
        border-radius: 20px;
        font-size: 11px;
        color: #a78bfa;
        cursor: pointer;
      }
      
      .usage-badge:hover {
        background: rgba(124, 58, 237, 0.3);
      }
      
      .usage-badge.warning {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
      }
      
      .usage-badge.premium {
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(236, 72, 153, 0.3));
        color: #fff;
      }
    `;
    }
};
