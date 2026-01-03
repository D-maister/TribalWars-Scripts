class ExchangeTracker {
    constructor() {
        this.storageKey = 'tw_exchange_data_v10';
        this.settingsKey = 'tw_exchange_settings_v10';
        this.autoTradeKey = 'tw_auto_trade_settings_v2';
        this.updateInterval = 10000;
        this.collectionInterval = null;
        this.isStatVisible = false;
        this.showCharts = true;
        this.data = [];
        this.resourceTypes = ['wood', 'stone', 'iron'];
        this.resourceNames = {
            'wood': 'Wood',
            'stone': 'Clay',
            'iron': 'Iron'
        };
        this.chartColors = {
            'wood': '#874D26',
            'stone': '#E66E1E',
            'iron': '#95ADAD'
        };
        this.minMaxCache = {};
        this.recentMinMaxCache = {};
        this.exchangeRateInterval = null;
        
        this.autoTrade = {
            buyCondition: 'never',
            sellCondition: 'never',
            resourceAmount: 1000
        };
        
        this.init();
    }

    init() {
        console.log('[TW Exchange Tracker] Initializing...');
        this.addStyles();
        this.loadSettings();
        this.loadAutoTradeSettings();
        this.tryAddButton();
        this.loadData();
        this.startResourceMonitoring();
        this.setupMutationObserver();
        this.startExchangeRateMonitoring();
        console.log('[TW Exchange Tracker] Initialized');
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem(this.settingsKey) || '{}');
            this.showCharts = settings.showCharts !== undefined ? settings.showCharts : true;
        } catch (e) {
            this.showCharts = true;
        }
    }

    saveSettings() {
        const settings = {
            showCharts: this.showCharts,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    }

    loadAutoTradeSettings() {
        try {
            const saved = JSON.parse(localStorage.getItem(this.autoTradeKey) || '{}');
            this.autoTrade = {
                buyCondition: saved.buyCondition || 'never',
                sellCondition: saved.sellCondition || 'never',
                resourceAmount: saved.resourceAmount || 1000
            };
            // Load exchange rate data
            if (saved.exchangeRateData) {
                this.exchangeRateData = saved.exchangeRateData;
            }
        } catch (e) {
            // Keep default values
        }
    }

    saveAutoTradeSettings() {
        const data = {
            buyCondition: this.autoTrade.buyCondition,
            sellCondition: this.autoTrade.sellCondition,
            resourceAmount: this.autoTrade.resourceAmount,
            exchangeRateData: this.exchangeRateData
        };
        localStorage.setItem(this.autoTradeKey, JSON.stringify(data));
    }

    addStyles() {
        if (document.getElementById('tw-exchange-tracker-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'tw-exchange-tracker-styles';
        style.textContent = `
            .tw-exchange-stat-btn {
                display: inline-block;
                padding: 3px;
                margin: 0 2px;
                text-align: center;
                font-family: Verdana, Arial;
                font-size: 12px !important;
                font-weight: bold;
                line-height: normal;
                cursor: pointer;
                background: #6c4824;
                background: linear-gradient(to bottom, #947a62 0%, #7b5c3d 22%, #6c4824 30%, #6c4824 100%);
                border-radius: 5px;
                border: 1px solid #000;
                color: #fff;
                white-space: nowrap;
            }
            
            .tw-exchange-stat-btn:hover {
                background: linear-gradient(to bottom, #b69471 0%, #9f764d 22%, #8f6133 30%, #6c4d2d 100%);
                transform: translateY(-1px);
            }
            
            .tw-exchange-stats-container {
                padding: 15px;
                margin: 20px 0;
                background: rgba(244, 228, 188, 0.9);
                border: 1px solid #7d510f;
                border-radius: 4px;
            }
            
            .tw-exchange-stats-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #7d510f;
            }
            
            .tw-exchange-stats-title {
                color: #000;
                font-size: 12pt;
                font-weight: bold;
                margin: 0;
            }
            
            .tw-exchange-stats-close {
                background: #f44336;
                color: white;
                border: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                line-height: 1;
            }
            
            .tw-exchange-stats-close:hover {
                background: #d32f2f;
            }
            
            .tw-summary-table {
                width: 100%;
                margin-bottom: 20px;
                font-size: 11px;
                border-collapse: collapse;
            }
            
            .tw-summary-table th,
            .tw-summary-table td {
                padding: 4px 6px;
                text-align: center;
                border: 1px solid #7d510f;
                background: transparent;
            }
            
            .tw-summary-table th {
                background-color: #c1a264 !important;
                background-image: url(https://dsru.innogamescdn.com/asset/fc339a06/graphic/screen/tableheader_bg3.webp);
                background-repeat: repeat-x;
                color: #000;
                font-weight: bold;
            }
            
            .tw-summary-table .min-col {
                background-color: rgba(232, 245, 233, 0.7);
            }
            
            .tw-summary-table .max-col {
                background-color: rgba(255, 235, 238, 0.7);
            }
            
            .tw-summary-table .resource-name {
                background-color: rgba(245, 245, 245, 0.7);
                font-weight: bold;
                text-align: left;
                padding-left: 10px;
            }
            
            .tw-exchange-stat-table {
                width: 100%;
                font-size: 11px;
                border-collapse: collapse;
            }
            
            .tw-exchange-stat-table th,
            .tw-exchange-stat-table td {
                padding: 3px 5px;
                text-align: center;
                border: 1px solid #7d510f;
                background: transparent;
            }
            
            .tw-exchange-stat-table th {
                background-color: #c1a264 !important;
                background-image: url(https://dsru.innogamescdn.com/asset/fc339a06/graphic/screen/tableheader_bg3.webp);
                background-repeat: repeat-x;
                color: #000;
                font-weight: bold;
                position: sticky;
                top: 0;
            }
            
            .tw-exchange-stat-table tr:nth-child(even) {
                background-color: rgba(249, 249, 249, 0.5);
            }
            
            .tw-exchange-stat-table tr:hover {
                background-color: rgba(245, 245, 245, 0.7);
            }
            
            .tw-exchange-stat-header {
                background-color: rgba(46, 125, 50, 0.7) !important;
            }
            
            .tw-exchange-stat-resource-header {
                background-color: rgba(56, 142, 60, 0.7) !important;
            }
            
            .tw-exchange-stat-controls {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 15px;
                padding: 10px;
                border-radius: 4px;
                flex-wrap: wrap;
                background: rgba(255, 255, 255, 0.3);
                border: 1px solid #7d510f;
            }
            
            .tw-exchange-stat-controls button {
                background: linear-gradient(to bottom, #947a62 0%, #7b5c3d 22%, #6c4824 30%, #6c4824 100%);
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                white-space: nowrap;
            }
            
            .tw-exchange-stat-controls button:hover {
                background: linear-gradient(to bottom, #b69471 0%, #9f764d 22%, #8f6133 30%, #6c4d2d 100%);
            }
            
            .tw-exchange-stat-timestamp {
                white-space: nowrap;
                font-family: monospace;
                font-size: 10px;
            }
            
            .tw-exchange-stat-amount {
                color: #2196F3;
                font-weight: bold;
            }
            
            .tw-exchange-stat-capacity {
                color: #4CAF50;
                font-weight: bold;
            }
            
            .tw-exchange-stat-cost {
                color: #FF9800;
                font-weight: bold;
            }
            
            .tw-exchange-stat-diff {
                font-weight: bold;
                font-size: 10px;
            }
            
            .tw-exchange-stat-diff.positive {
                color: #4CAF50;
            }
            
            .tw-exchange-stat-diff.negative {
                color: #f44336;
            }
            
            .tw-exchange-stat-diff.neutral {
                color: #666;
            }
            
            .tw-exchange-stat-tag {
                font-size: 9px;
                padding: 1px 3px;
                border-radius: 2px;
                font-weight: bold;
            }
            
            .tw-exchange-stat-tag.min {
                background-color: #4CAF50;
                color: white;
            }
            
            .tw-exchange-stat-tag.min-30m {
                background-color: #8BC34A;
                color: white;
            }
            
            .tw-exchange-stat-tag.min-3h {
                background-color: #CDDC39;
                color: black;
            }
            
            .tw-exchange-stat-tag.min-12h {
                background-color: #FFEB3B;
                color: black;
            }
            
            .tw-exchange-stat-tag.min-1d {
                background-color: #FFC107;
                color: black;
            }
            
            .tw-exchange-stat-tag.max {
                background-color: #f44336;
                color: white;
            }
            
            .tw-exchange-stat-tag.max-30m {
                background-color: #FF9800;
                color: white;
            }
            
            .tw-exchange-stat-tag.max-3h {
                background-color: #FFC107;
                color: black;
            }
            
            .tw-exchange-stat-tag.max-12h {
                background-color: #FFEB3B;
                color: black;
            }
            
            .tw-exchange-stat-tag.max-1d {
                background-color: #CDDC39;
                color: black;
            }
            
            .tw-exchange-stat-wood {
                border-left: 2px solid #8B4513;
            }
            
            .tw-exchange-stat-stone {
                border-left: 2px solid #708090;
            }
            
            .tw-exchange-stat-iron {
                border-left: 2px solid #C0C0C0;
            }
            
            .tw-current-tag {
                font-weight: bold;
                border-radius: 3px;
                padding: 1px 4px;
                margin-left: 5px;
            }
            
            .tw-table-container {
                max-height: 400px;
                overflow-y: auto;
                border: 1px solid #7d510f;
                border-radius: 4px;
                margin-top: 10px;
                margin-bottom: 20px;
                height: 350px;
                background: rgba(255, 255, 255, 0.3);
            }
            
            .tw-hidden-rows-summary {
                background-color: rgba(240, 240, 240, 0.7);
                font-style: italic;
                text-align: center;
                color: #666;
                padding: 8px;
                border-top: 1px dashed #999;
            }
            
            .tw-charts-container {
                margin-top: 20px;
                border-top: 1px solid #7d510f;
                padding-top: 20px;
            }
            
            .tw-charts-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }
            
            .tw-charts-title {
                color: #2196F3;
                font-size: 16px;
                font-weight: bold;
                margin: 0;
            }
            
            .tw-charts-toggle {
                background: linear-gradient(to bottom, #2196F3, #1976D2);
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                font-size: 12px;
            }
            
            .tw-charts-toggle:hover {
                background: linear-gradient(to bottom, #1976D2, #1565C0);
            }
            
            .tw-charts-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(2, auto);
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .tw-chart-container {
                background: rgba(244, 228, 188, 0.9);
                border: 1px solid #7d510f;
                border-radius: 4px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                height: 280px;
                display: flex;
                flex-direction: column;
            }
            
            .tw-chart-title {
                font-size: 9pt;
                text-align: left;
                font-weight: 700;
                background-color: #c1a264 !important;
                background-image: url(https://dsru.innogamescdn.com/asset/fc339a06/graphic/screen/tableheader_bg3.webp);
                background-repeat: repeat-x;
                position: relative;
                padding: 3px;
            }
            
            .tw-chart-svg-container {
                flex: 1;
                width: 100%;
                position: relative;
            }
            
            .tw-chart-svg {
                width: 100%;
                height: 100%;
            }
            
            .tw-chart-minmax {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: #666;
                margin-top: 5px;
                padding: 0 5px;
            }
            
            .tw-chart-min {
                color: #4CAF50;
                font-weight: bold;
            }
            
            .tw-chart-max {
                color: #f44336;
                font-weight: bold;
            }
            
            .tw-chart-current {
                color: #2196F3;
                font-weight: bold;
            }
            
            .tw-chart-axis-label {
                font-size: 10px;
                fill: #666;
            }
            
            .tw-chart-grid-line {
                stroke: #eee;
                stroke-width: 1;
            }
            
            .tw-chart-data-line {
                fill: none;
                stroke-width: 2;
            }
            
            .tw-chart-min-line {
                stroke: #4CAF50;
                stroke-width: 1;
                stroke-dasharray: 5,5;
                opacity: 0.7;
            }
            
            .tw-chart-max-line {
                stroke: #f44336;
                stroke-width: 1;
                stroke-dasharray: 5,5;
                opacity: 0.7;
            }
            
            .tw-chart-point {
                r: 3;
                transition: r 0.2s;
            }
            
            .tw-chart-point:hover {
                r: 5;
            }
            
            .tw-chart-tooltip {
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 11px;
                pointer-events: none;
                z-index: 1000;
                display: none;
                white-space: pre-line;
                max-width: 200px;
            }
            
            .tw-bar-chart-container {
                grid-column: 1 / -1;
                height: 250px;
            }
            
            .tw-bar-chart-bar {
                transition: height 0.3s, y 0.3s;
            }
            
            .tw-bar-chart-bar:hover {
                opacity: 0.8;
            }
            
            .tw-bar-label {
                font-size: 10px;
                fill: #333;
                text-anchor: middle;
            }
            
            .tw-bar-value {
                font-size: 9px;
                fill: white;
                text-anchor: middle;
                font-weight: bold;
            }
            
            .tw-auto-trade-controls {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-bottom: 10px;
                padding: 10px;
                background: rgba(255, 255, 255, 0.3);
                border: 1px solid #7d510f;
                border-radius: 4px;
            }
            
            .tw-auto-trade-settings {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .tw-auto-trade-section {
                display: flex;
                align-items: center;
                gap: 5px;
                white-space: nowrap;
            }
            
            .tw-auto-trade-label {
                font-weight: bold;
                color: #000;
                font-size: 11px;
            }
            
            .tw-auto-trade-status {
                margin-top: 5px;
                padding: 5px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 4px;
                font-size: 11px;
                color: #666;
            }
            
            .tw-auto-trade-active {
                color: #4CAF50;
                font-weight: bold;
            }
            
            .tw-exchange-rate-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 11px;
            }
            
            .tw-exchange-rate-table th,
            .tw-exchange-rate-table td {
                padding: 4px 6px;
                text-align: center;
                border: 1px solid #7d510f;
                background: transparent;
            }
            
            .tw-exchange-rate-table th {
                background-color: #c1a264 !important;
                background-image: url(https://dsru.innogamescdn.com/asset/fc339a06/graphic/screen/tableheader_bg3.webp);
                background-repeat: repeat-x;
                color: #000;
                font-weight: bold;
            }
            
            .tw-exchange-rate-cell {
                min-width: 60px;
                font-weight: bold;
            }
            
            .tw-exchange-rate-buy {
                background-color: rgba(232, 245, 233, 0.7);
            }
            
            .tw-exchange-rate-sell {
                background-color: rgba(255, 235, 238, 0.7);
            }
            
            .tw-exchange-rate-header {
                font-weight: bold;
                text-align: center;
                margin-bottom: 5px;
                color: #000;
                font-size: 12px;
            }
        `;
        document.head.appendChild(style);
    }

    tryAddButton() {
        const selectors = [
            'input[type="submit"].btn-premium-exchange-buy',
            'input[type="submit"][value*="Найти наилучшее предложение"]',
            '#premium_exchange_form input[type="submit"]'
        ];
        
        let submitBtn = null;
        
        for (const selector of selectors) {
            submitBtn = document.querySelector(selector);
            if (submitBtn) break;
        }
        
        if (submitBtn && submitBtn.parentNode) {
            this.addButtonToElement(submitBtn);
        }
    }

    addButtonToElement(submitBtn) {
        if (document.querySelector('.tw-exchange-stat-btn')) return;
        
        const statBtn = document.createElement('button');
        statBtn.type = 'button';
        statBtn.className = 'tw-exchange-stat-btn';
        statBtn.textContent = 'STAT';
        statBtn.title = 'Show/hide exchange statistics';
        statBtn.onclick = (e) => {
            e.stopPropagation();
            this.toggleStats();
        };
        
        try {
            submitBtn.parentNode.insertBefore(statBtn, submitBtn);
        } catch (e) {
            statBtn.style.position = 'fixed';
            statBtn.style.top = '10px';
            statBtn.style.right = '10px';
            statBtn.style.zIndex = '9998';
            document.body.appendChild(statBtn);
        }
    }

    setupMutationObserver() {
        const observer = new MutationObserver(() => {
            if (!document.querySelector('.tw-exchange-stat-btn')) {
                setTimeout(() => this.tryAddButton(), 500);
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    startResourceMonitoring() {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
        }
        
        this.monitorRateElements();
        
        this.collectionInterval = setInterval(() => {
            this.saveData();
        }, this.updateInterval);
    }

    monitorRateElements() {
        const rateElements = [
            '#premium_exchange_rate_wood',
            '#premium_exchange_rate_stone',
            '#premium_exchange_rate_iron'
        ];
        
        rateElements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'characterData' || mutation.type === 'childList') {
                            // Only save data when price changes
                            // Exchange rates will be checked AFTER data is saved
                            this.saveData();
                        }
                    });
                });
                
                observer.observe(element, {
                    characterData: true,
                    childList: true,
                    subtree: true
                });
                
                if (!this.rateObservers) this.rateObservers = [];
                this.rateObservers.push({ element: element, observer: observer });
            }
        });
    }

    startExchangeRateMonitoring() {
        // Clear existing interval
        if (this.exchangeRateInterval) {
            clearInterval(this.exchangeRateInterval);
            this.exchangeRateInterval = null;
        }
        
        // Exchange rates will now only be checked when:
        // 1. Prices change (via MutationObserver)
        // 2. Resource amount input changes
        // 3. Stats are first opened
    }

    checkExchangeRates() {
        if (!this.isStatVisible) return;
        
        // Get resource amount from input#tw-resource-amount
        const amountInput = document.querySelector('#tw-resource-amount');
        if (!amountInput) return;
        
        const resourceAmount = parseInt(amountInput.value) || 1000;
        
        // Get current resource amounts
        const currentResources = {};
        this.resourceTypes.forEach(resource => {
            const elem = document.getElementById(resource);
            if (elem && elem.classList.contains('res')) {
                const text = elem.textContent || elem.innerText;
                currentResources[resource] = parseInt(text.replace(/\s+/g, '')) || 0;
            } else {
                currentResources[resource] = 0;
            }
        });
        
        // No delay needed here since we're already in a MutationObserver callback
        // which fires after the price change has started
        
        // Check buy rates for all resources
        this.resourceTypes.forEach(resource => {
            this.getExchangeRate('buy', resource, resourceAmount);
        });
        
        // Check sell rates for all resources
        this.resourceTypes.forEach(resource => {
            const sellAmount = Math.min(resourceAmount, currentResources[resource]);
            if (sellAmount > 0) {
                this.getExchangeRate('sell', resource, sellAmount);
            } else {
                this.updateExchangeRateDisplay('sell', resource, '—');
            }
        });
    }

    checkSingleResource(resource, currentAmount) {
        // Check buy rate
        if (this.exchangeRateData.buy[resource] > 0) {
            this.getExchangeRate('buy', resource, this.exchangeRateData.buy[resource]);
        }
        
        // Check sell rate
        if (this.exchangeRateData.sell[resource] > 0) {
            const sellAmount = Math.min(this.exchangeRateData.sell[resource], currentAmount);
            if (sellAmount > 0) {
                this.getExchangeRate('sell', resource, sellAmount);
            }
        }
    }

    getExchangeRate(type, resource, amount) {
        const inputSelector = `.premium-exchange-input[data-type="${type}"][data-resource="${resource}"]`;
        const input = document.querySelector(inputSelector);
        
        if (!input) {
            this.updateExchangeRateDisplay(type, resource, '—');
            return;
        }
        
        // Store current state
        const currentValue = input.value;
        const wasDisabled = input.disabled;
        
        // Make sure input is enabled
        input.disabled = false;
        
        // Set new value
        input.value = amount;
        
        // Trigger input event to update cost
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
        
        // Wait a bit for the cost to update
        setTimeout(() => {
            // Get the cost element
            const costElement = input.closest('td')?.querySelector('.cost');
            if (costElement) {
                const premiumCost = this.extractPremiumCost(costElement);
                if (premiumCost !== null) {
                    const rate = `${amount} <-> ${premiumCost}`;
                    this.updateExchangeRateDisplay(type, resource, rate);
                } else {
                    this.updateExchangeRateDisplay(type, resource, '—');
                }
            } else {
                this.updateExchangeRateDisplay(type, resource, '—');
            }
            
            // Clear the input field properly without disabling
            input.value = '';
            
            // Restore disabled state if it was originally disabled
            input.disabled = wasDisabled;
            
            // Trigger input event again to clear any visual feedback
            const clearEvent = new Event('input', { bubbles: true });
            input.dispatchEvent(clearEvent);
            
            // Also trigger change event for good measure
            const changeEvent = new Event('change', { bubbles: true });
            input.dispatchEvent(changeEvent);
        }, 100);
    }

    extractPremiumCost(costElement) {
        const costText = costElement.textContent || costElement.innerText;
        
        // Try different patterns to extract the premium cost
        // Pattern 1: "14" (just the number)
        const justNumber = costText.match(/^(\d+)$/);
        if (justNumber) {
            return parseInt(justNumber[1]);
        }
        
        // Pattern 2: "10000 for 14 premium" or similar
        const forPattern = costText.match(/for\s+(\d+)/i);
        if (forPattern) {
            return parseInt(forPattern[1]);
        }
        
        // Pattern 3: "14 premium" or "14 PP" or similar
        const premiumPattern = costText.match(/(\d+)\s+(?:premium|pp|gold)/i);
        if (premiumPattern) {
            return parseInt(premiumPattern[1]);
        }
        
        // Pattern 4: Any number (last resort)
        const anyNumber = costText.match(/\d+/);
        if (anyNumber) {
            return parseInt(anyNumber[0]);
        }
        
        return null;
    }

    updateExchangeRateDisplay(type, resource, rate) {
        const cellId = `tw-exchange-rate-${type}-${resource}`;
        const cell = document.getElementById(cellId);
        if (cell) {
            cell.textContent = rate;
        }
    }

    getExchangeData() {
        const now = new Date();
        const data = {
            timestamp: this.formatDateTime(now),
            date: now.toISOString(),
            resources: {}
        };

        this.resourceTypes.forEach(resource => {
            const amountElem = document.getElementById(`premium_exchange_stock_${resource}`);
            const capacityElem = document.getElementById(`premium_exchange_capacity_${resource}`);
            const rateElem = document.getElementById(`premium_exchange_rate_${resource}`);
            
            let amount = 0;
            let capacity = 0;
            let cost = 0;
            
            if (amountElem) {
                const amountText = amountElem.textContent || amountElem.innerText;
                amount = parseInt(amountText.replace(/\s+/g, '')) || 0;
            }
            
            if (capacityElem) {
                const capacityText = capacityElem.textContent || capacityElem.innerText;
                capacity = parseInt(capacityText.replace(/\s+/g, '')) || 0;
            }
            
            if (rateElem) {
                const firstSep = rateElem.querySelector('.premium-exchange-sep');
                if (firstSep) {
                    const costText = firstSep.textContent || firstSep.innerText;
                    const match = costText.match(/\d+/);
                    cost = match ? parseInt(match[0]) : 0;
                }
            }
            
            data.resources[resource] = {
                amount: amount,
                capacity: capacity,
                cost: cost,
                diff: 0,
                tag: ''
            };
        });
        
        return data;
    }

    checkAutoTrade() {
        if (!this.data.length) return;
        
        const currentData = this.data[0];
        const statusDiv = document.querySelector('#tw-auto-trade-status');
        
        this.resourceTypes.forEach(resource => {
            const currentCost = currentData.resources[resource].cost;
            const cache = this.minMaxCache[resource] || { min: 0, max: 0 };
            
            // Check sell condition
            if (this.autoTrade.sellCondition !== 'never') {
                let shouldSell = false;
                
                switch (this.autoTrade.sellCondition) {
                    case 'min':
                        shouldSell = currentCost === cache.min;
                        break;
                    case 'min-30m':
                        shouldSell = currentCost <= this.getTimeBasedMin(resource, 30);
                        break;
                    case 'min-3h':
                        shouldSell = currentCost <= this.getTimeBasedMin(resource, 180);
                        break;
                    case 'min-12h':
                        shouldSell = currentCost <= this.getTimeBasedMin(resource, 720);
                        break;
                    case 'min-1d':
                        shouldSell = currentCost <= this.getTimeBasedMin(resource, 1440);
                        break;
                }
                
                if (shouldSell && statusDiv) {
                    statusDiv.innerHTML = `<span class="tw-auto-trade-active">SELL ${this.resourceNames[resource]} at ${currentCost}</span>`;
                    this.performTrade('sell', resource);
                }
            }
            
            // Check buy condition
            if (this.autoTrade.buyCondition !== 'never') {
                let shouldBuy = false;
                
                switch (this.autoTrade.buyCondition) {
                    case 'max':
                        shouldBuy = currentCost === cache.max;
                        break;
                    case 'max-30m':
                        shouldBuy = currentCost >= this.getTimeBasedMax(resource, 30);
                        break;
                    case 'max-3h':
                        shouldBuy = currentCost >= this.getTimeBasedMax(resource, 180);
                        break;
                    case 'max-12h':
                        shouldBuy = currentCost >= this.getTimeBasedMax(resource, 720);
                        break;
                    case 'max-1d':
                        shouldBuy = currentCost >= this.getTimeBasedMax(resource, 1440);
                        break;
                }
                
                if (shouldBuy && statusDiv) {
                    statusDiv.innerHTML = `<span class="tw-auto-trade-active">BUY ${this.resourceNames[resource]} at ${currentCost}</span>`;
                    this.performTrade('buy', resource);
                }
            }
        });
    }

    getTimeBasedMin(resource, minutes) {
        const cutoffTime = new Date(Date.now() - minutes * 60000);
        const recentData = this.data.filter(record => {
            const recordTime = new Date(record.date);
            return recordTime >= cutoffTime && record.resources[resource].cost > 0;
        });
        
        if (recentData.length === 0) return Infinity;
        
        return Math.min(...recentData.map(record => record.resources[resource].cost));
    }

    getTimeBasedMax(resource, minutes) {
        const cutoffTime = new Date(Date.now() - minutes * 60000);
        const recentData = this.data.filter(record => {
            const recordTime = new Date(record.date);
            return recordTime >= cutoffTime && record.resources[resource].cost > 0;
        });
        
        if (recentData.length === 0) return -Infinity;
        
        return Math.max(...recentData.map(record => record.resources[resource].cost));
    }

    performTrade(action, resource) {
        console.log(`[TW Exchange Tracker] ${action.toUpperCase()} ${this.resourceNames[resource]} x${this.autoTrade.resourceAmount} triggered`);
    }

    formatDateTime(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
    }

    calculateMinMaxValues() {
        this.minMaxCache = {};
        this.recentMinMaxCache = {};
        
        this.resourceTypes.forEach(resource => {
            const costs = this.data
                .map(record => record.resources[resource].cost)
                .filter(cost => cost > 0);
            
            if (costs.length > 0) {
                this.minMaxCache[resource] = {
                    min: Math.min(...costs),
                    max: Math.max(...costs),
                    current: this.data.length > 0 ? this.data[0].resources[resource].cost : 0
                };
                
                // Calculate recent min/max based on time
                const now = new Date();
                const periods = {
                    last30m: 30,
                    last3h: 180,
                    last12h: 720,
                    last1d: 1440
                };
                
                const recentData = {};
                Object.keys(periods).forEach(period => {
                    const cutoffTime = new Date(now.getTime() - periods[period] * 60000);
                    const periodData = this.data.filter(record => {
                        const recordTime = new Date(record.date);
                        return recordTime >= cutoffTime && record.resources[resource].cost > 0;
                    });
                    
                    if (periodData.length > 0) {
                        recentData[period] = {
                            min: Math.min(...periodData.map(r => r.resources[resource].cost)),
                            max: Math.max(...periodData.map(r => r.resources[resource].cost))
                        };
                    } else {
                        recentData[period] = { min: 0, max: 0 };
                    }
                });
                
                this.recentMinMaxCache[resource] = {
                    allTime: {
                        min: this.minMaxCache[resource].min,
                        max: this.minMaxCache[resource].max
                    },
                    ...recentData
                };
            } else {
                this.minMaxCache[resource] = { min: 0, max: 0, current: 0 };
                this.recentMinMaxCache[resource] = {
                    allTime: { min: 0, max: 0 },
                    last30m: { min: 0, max: 0 },
                    last3h: { min: 0, max: 0 },
                    last12h: { min: 0, max: 0 },
                    last1d: { min: 0, max: 0 }
                };
            }
        });
    }

    calculateTag(currentCost, minCost, maxCost) {
        if (currentCost === 0) return '';
        
        if (currentCost === minCost) return 'min';
        if (currentCost === maxCost) return 'max';
        
        // Check time-based mins
        const timePeriods = [
            { threshold: 30, tag: 'min-30m' },
            { threshold: 180, tag: 'min-3h' },
            { threshold: 720, tag: 'min-12h' },
            { threshold: 1440, tag: 'min-1d' }
        ];
        
        for (const period of timePeriods) {
            const timeBasedMin = this.getTimeBasedMin(this.resourceTypes[0], period.threshold);
            if (currentCost <= timeBasedMin) {
                return period.tag;
            }
        }
        
        // Check time-based maxs
        const maxPeriods = [
            { threshold: 30, tag: 'max-30m' },
            { threshold: 180, tag: 'max-3h' },
            { threshold: 720, tag: 'max-12h' },
            { threshold: 1440, tag: 'max-1d' }
        ];
        
        for (const period of maxPeriods) {
            const timeBasedMax = this.getTimeBasedMax(this.resourceTypes[0], period.threshold);
            if (currentCost >= timeBasedMax) {
                return period.tag;
            }
        }
        
        return '';
    }

    updateAllTags() {
        this.data.forEach(record => {
            this.resourceTypes.forEach(resource => {
                const cache = this.minMaxCache[resource] || { min: 0, max: 0 };
                const currentCost = record.resources[resource].cost;
                record.resources[resource].tag = this.calculateTag(currentCost, cache.min, cache.max);
            });
        });
    }

    saveData() {
        const currentData = this.getExchangeData();
        
        // Skip if same as previous (no changes)
        if (this.data.length > 0) {
            const previousData = this.data[0];
            let isDifferent = false;
            
            this.resourceTypes.forEach(resource => {
                if (currentData.resources[resource].cost !== previousData.resources[resource].cost) {
                    isDifferent = true;
                }
            });
            
            if (!isDifferent) {
                return; // Skip duplicate
            }
            
            // Calculate diffs
            this.resourceTypes.forEach(resource => {
                const prevCost = previousData.resources[resource].cost;
                const currentCost = currentData.resources[resource].cost;
                currentData.resources[resource].diff = prevCost > 0 ? currentCost - prevCost : 0;
            });
        }
        
        this.data.unshift(currentData);
        
        // Keep only last 1000 records
        if (this.data.length > 1000) {
            this.data = this.data.slice(0, 1000);
        }
        
        this.calculateMinMaxValues();
        this.updateAllTags();
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            console.log('[TW Exchange Tracker] Data saved, records:', this.data.length);
            
            // Check exchange rates AFTER new data is saved
            if (this.isStatVisible) {
                this.checkExchangeRates();
            }
            
            if (this.isStatVisible) {
                this.updateStatsUI();
                if (this.showCharts) {
                    this.updateCharts();
                }
            }
        } catch (e) {
            console.error('[TW Exchange Tracker] Error saving:', e);
            if (e.name === 'QuotaExceededError') {
                this.data = this.data.slice(0, 500);
                localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            }
        }
    }

    loadData() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            this.data = saved ? JSON.parse(saved) : [];
            this.calculateMinMaxValues();
            this.updateAllTags();
            console.log('[TW Exchange Tracker] Data loaded, records:', this.data.length);
        } catch (e) {
            console.error('[TW Exchange Tracker] Error loading:', e);
            this.data = [];
        }
    }

    createSummaryTable() {
        const table = document.createElement('table');
        table.className = 'tw-summary-table';
        
        const thead = document.createElement('thead');
        
        // First header row
        const headerRow1 = document.createElement('tr');
        
        const resourceHeader = document.createElement('th');
        resourceHeader.textContent = 'Resource';
        resourceHeader.rowSpan = 2;
        resourceHeader.style.width = '80px';
        headerRow1.appendChild(resourceHeader);
        
        const minHeader = document.createElement('th');
        minHeader.textContent = 'MIN';
        minHeader.colSpan = 5;
        minHeader.className = 'min-col';
        headerRow1.appendChild(minHeader);
        
        const maxHeader = document.createElement('th');
        maxHeader.textContent = 'MAX';
        maxHeader.colSpan = 5;
        maxHeader.className = 'max-col';
        headerRow1.appendChild(maxHeader);
        
        thead.appendChild(headerRow1);
        
        // Second header row
        const headerRow2 = document.createElement('tr');
        
        // Min sub-headers
        const minSubHeaders = ['All Time', '30 min', '3 hours', '12 hours', '1 day'];
        minSubHeaders.forEach(subHeader => {
            const th = document.createElement('th');
            th.textContent = subHeader;
            th.className = 'min-col';
            th.style.fontSize = '10px';
            headerRow2.appendChild(th);
        });
        
        // Max sub-headers
        const maxSubHeaders = ['All Time', '30 min', '3 hours', '12 hours', '1 day'];
        maxSubHeaders.forEach(subHeader => {
            const th = document.createElement('th');
            th.textContent = subHeader;
            th.className = 'max-col';
            th.style.fontSize = '10px';
            headerRow2.appendChild(th);
        });
        
        thead.appendChild(headerRow2);
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        
        this.resourceTypes.forEach(resource => {
            const row = document.createElement('tr');
            
            const resourceCell = document.createElement('td');
            resourceCell.className = 'resource-name';
            resourceCell.textContent = this.resourceNames[resource];
            row.appendChild(resourceCell);
            
            const recentCache = this.recentMinMaxCache[resource] || {
                allTime: { min: 0, max: 0 },
                last30m: { min: 0, max: 0 },
                last3h: { min: 0, max: 0 },
                last12h: { min: 0, max: 0 },
                last1d: { min: 0, max: 0 }
            };
            
            // Min values cells
            const minPeriods = ['allTime', 'last30m', 'last3h', 'last12h', 'last1d'];
            minPeriods.forEach(period => {
                const cell = document.createElement('td');
                const value = recentCache[period]?.min || 0;
                cell.textContent = value > 0 ? value : '—';
                cell.className = 'min-col';
                
                if (value > 0) {
                    const currentCost = this.minMaxCache[resource]?.current || 0;
                    if (currentCost === value) {
                        cell.style.fontWeight = 'bold';
                        cell.style.color = '#4CAF50';
                    }
                    cell.title = `${this.resourceNames[resource]} min in ${period.replace('last', '').replace('Time', ' time')}: ${value}`;
                }
                
                row.appendChild(cell);
            });
            
            // Max values cells
            const maxPeriods = ['allTime', 'last30m', 'last3h', 'last12h', 'last1d'];
            maxPeriods.forEach(period => {
                const cell = document.createElement('td');
                const value = recentCache[period]?.max || 0;
                cell.textContent = value > 0 ? value : '—';
                cell.className = 'max-col';
                
                if (value > 0) {
                    const currentCost = this.minMaxCache[resource]?.current || 0;
                    if (currentCost === value) {
                        cell.style.fontWeight = 'bold';
                        cell.style.color = '#f44336';
                    }
                    cell.title = `${this.resourceNames[resource]} max in ${period.replace('last', '').replace('Time', ' time')}: ${value}`;
                }
                
                row.appendChild(cell);
            });
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        return table;
    }

    createExchangeRateTable() {
        const container = document.createElement('div');
        
        const header = document.createElement('div');
        header.className = 'tw-exchange-rate-header';
        header.textContent = 'Exchange Rate';
        container.appendChild(header);
        
        const infoText = document.createElement('div');
        infoText.style.fontSize = '10px';
        infoText.style.color = '#666';
        infoText.style.marginBottom = '5px';
        infoText.textContent = 'Using resource amount from "Resource amount" input below';
        container.appendChild(infoText);
        
        const table = document.createElement('table');
        table.className = 'tw-exchange-rate-table';
        
        // Header row
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const typeHeader = document.createElement('th');
        typeHeader.textContent = 'Type';
        headerRow.appendChild(typeHeader);
        
        this.resourceTypes.forEach(resource => {
            const resourceHeader = document.createElement('th');
            resourceHeader.textContent = this.resourceNames[resource];
            headerRow.appendChild(resourceHeader);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body rows
        const tbody = document.createElement('tbody');
        
        // Buy rate row
        const buyRow = document.createElement('tr');
        buyRow.className = 'tw-exchange-rate-buy';
        
        const buyTypeCell = document.createElement('td');
        buyTypeCell.textContent = 'Buy Rate';
        buyTypeCell.style.fontSize = '10px';
        buyTypeCell.style.fontWeight = 'bold';
        buyRow.appendChild(buyTypeCell);
        
        this.resourceTypes.forEach(resource => {
            const cell = document.createElement('td');
            cell.className = 'tw-exchange-rate-cell';
            cell.id = `tw-exchange-rate-buy-${resource}`;
            cell.textContent = '—';
            cell.style.fontSize = '10px';
            cell.style.fontWeight = 'bold';
            buyRow.appendChild(cell);
        });
        
        tbody.appendChild(buyRow);
        
        // Sell rate row
        const sellRow = document.createElement('tr');
        sellRow.className = 'tw-exchange-rate-sell';
        
        const sellTypeCell = document.createElement('td');
        sellTypeCell.textContent = 'Sell Rate';
        sellTypeCell.style.fontSize = '10px';
        sellTypeCell.style.fontWeight = 'bold';
        sellRow.appendChild(sellTypeCell);
        
        this.resourceTypes.forEach(resource => {
            const cell = document.createElement('td');
            cell.className = 'tw-exchange-rate-cell';
            cell.id = `tw-exchange-rate-sell-${resource}`;
            cell.textContent = '—';
            cell.style.fontSize = '10px';
            cell.style.fontWeight = 'bold';
            sellRow.appendChild(cell);
        });
        
        tbody.appendChild(sellRow);
        
        table.appendChild(tbody);
        container.appendChild(table);
        
        return container;
    }

    createAutoTradeControls() {
        const container = document.createElement('div');
        container.className = 'tw-auto-trade-controls';
        
        // Auto trade settings
        const settingsDiv = document.createElement('div');
        settingsDiv.className = 'tw-auto-trade-settings';
        
        // Buy condition
        const buySection = document.createElement('div');
        buySection.className = 'tw-auto-trade-section';
        
        const buyLabel = document.createElement('label');
        buyLabel.className = 'tw-auto-trade-label';
        buyLabel.textContent = 'Auto buy when:';
        buyLabel.htmlFor = 'tw-auto-buy';
        
        const buySelect = document.createElement('select');
        buySelect.id = 'tw-auto-buy';
        buySelect.style.fontSize = '11px';
        
        const buyOptions = [
            { value: 'never', text: 'never' },
            { value: 'max-1d', text: 'max-1d' },
            { value: 'max-12h', text: 'max-12h' },
            { value: 'max-3h', text: 'max-3h' },
            { value: 'max-30m', text: 'max-30m' },
            { value: 'max', text: 'max' }
        ];
        
        buyOptions.forEach(option => {
            const optionElem = document.createElement('option');
            optionElem.value = option.value;
            optionElem.textContent = option.text;
            if (option.value === this.autoTrade.buyCondition) {
                optionElem.selected = true;
            }
            buySelect.appendChild(optionElem);
        });
        
        buySelect.onchange = (e) => {
            this.autoTrade.buyCondition = e.target.value;
            this.saveAutoTradeSettings();
        };
        
        buySection.appendChild(buyLabel);
        buySection.appendChild(buySelect);
        settingsDiv.appendChild(buySection);
        
        // Sell condition
        const sellSection = document.createElement('div');
        sellSection.className = 'tw-auto-trade-section';
        
        const sellLabel = document.createElement('label');
        sellLabel.className = 'tw-auto-trade-label';
        sellLabel.textContent = 'Auto sale when:';
        sellLabel.htmlFor = 'tw-auto-sell';
        
        const sellSelect = document.createElement('select');
        sellSelect.id = 'tw-auto-sell';
        sellSelect.style.fontSize = '11px';
        
        const sellOptions = [
            { value: 'never', text: 'never' },
            { value: 'min-1d', text: 'min-1d' },
            { value: 'min-12h', text: 'min-12h' },
            { value: 'min-3h', text: 'min-3h' },
            { value: 'min-30m', text: 'min-30m' },
            { value: 'min', text: 'min' }
        ];
        
        sellOptions.forEach(option => {
            const optionElem = document.createElement('option');
            optionElem.value = option.value;
            optionElem.textContent = option.text;
            if (option.value === this.autoTrade.sellCondition) {
                optionElem.selected = true;
            }
            sellSelect.appendChild(optionElem);
        });
        
        sellSelect.onchange = (e) => {
            this.autoTrade.sellCondition = e.target.value;
            this.saveAutoTradeSettings();
        };
        
        sellSection.appendChild(sellLabel);
        sellSection.appendChild(sellSelect);
        settingsDiv.appendChild(sellSection);
        
        // Resource amount
        const amountSection = document.createElement('div');
        amountSection.className = 'tw-auto-trade-section';
        
        const amountLabel = document.createElement('label');
        amountLabel.className = 'tw-auto-trade-label';
        amountLabel.textContent = 'Resource amount:';
        amountLabel.htmlFor = 'tw-resource-amount';
        
        const amountInput = document.createElement('input');
        amountInput.id = 'tw-resource-amount';
        amountInput.type = 'number';
        amountInput.min = '1';
        amountInput.max = '1000000';
        amountInput.value = this.autoTrade.resourceAmount;
        amountInput.style.width = '60px';
        amountInput.style.fontSize = '11px';
        
        amountInput.onchange = (e) => {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= 1000000) {
                this.autoTrade.resourceAmount = value;
                this.saveAutoTradeSettings();
                
                // Trigger exchange rate check when amount changes
                if (this.isStatVisible) {
                    this.checkExchangeRates();
                }
            } else {
                e.target.value = this.autoTrade.resourceAmount;
            }
        };
        
        amountSection.appendChild(amountLabel);
        amountSection.appendChild(amountInput);
        settingsDiv.appendChild(amountSection);
        
        container.appendChild(settingsDiv);
        
        // Exchange rate table
        const exchangeRateDiv = this.createExchangeRateTable();
        container.appendChild(exchangeRateDiv);
        
        // Status display
        const statusDiv = document.createElement('div');
        statusDiv.id = 'tw-auto-trade-status';
        statusDiv.className = 'tw-auto-trade-status';
        statusDiv.textContent = 'Auto trade monitoring active';
        container.appendChild(statusDiv);
        
        return container;
    }

    createStatsContainer() {
        const container = document.createElement('div');
        container.className = 'tw-exchange-stats-container';
        container.style.display = 'none';
        
        const header = document.createElement('div');
        header.className = 'tw-exchange-stats-header';
        
        const title = document.createElement('h2');
        title.className = 'tw-exchange-stats-title';
        title.textContent = 'Premium Exchange Statistics';
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'tw-exchange-stats-close';
        closeBtn.textContent = '×';
        closeBtn.title = 'Close statistics';
        closeBtn.onclick = () => this.hideStats();
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        const autoTradeControls = this.createAutoTradeControls();
        
        const controls = document.createElement('div');
        controls.className = 'tw-exchange-stat-controls';
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear All Data';
        clearBtn.onclick = () => {
            if (confirm('Clear all saved data?')) {
                localStorage.removeItem(this.storageKey);
                this.data = [];
                this.calculateMinMaxValues();
                this.updateAllTags();
                this.updateStatsUI();
            }
        };
        
        controls.appendChild(clearBtn);
        
        const currentSummary = document.createElement('div');
        currentSummary.style.marginBottom = '15px';
        currentSummary.style.padding = '10px';
        currentSummary.style.backgroundColor = 'rgba(227, 242, 253, 0.7)';
        currentSummary.style.borderRadius = '4px';
        currentSummary.style.fontSize = '12px';
        currentSummary.id = 'tw-current-summary';
        
        const summaryTable = document.createElement('div');
        summaryTable.id = 'tw-summary-table';
        
        const tableContainer = document.createElement('div');
        tableContainer.className = 'tw-table-container';
        tableContainer.id = 'tw-data-table';
        
        const status = document.createElement('div');
        status.style.marginTop = '10px';
        status.style.fontSize = '11px';
        status.style.color = '#666';
        status.style.textAlign = 'center';
        status.id = 'tw-exchange-status';
        
        container.appendChild(header);
        container.appendChild(autoTradeControls);
        container.appendChild(controls);
        container.appendChild(currentSummary);
        container.appendChild(summaryTable);
        container.appendChild(tableContainer);
        container.appendChild(status);
        
        return container;
    }

    updateStatsUI() {
        if (!this.isStatVisible) return;
        
        const container = document.querySelector('.tw-exchange-stats-container');
        if (!container) return;
        
        const currentSummary = container.querySelector('#tw-current-summary');
        if (currentSummary && this.data.length > 0) {
            const current = this.data[0];
            let summaryText = '<strong>Current values:</strong> ';
            this.resourceTypes.forEach((resource, idx) => {
                const resData = current.resources[resource];
                const cache = this.minMaxCache[resource] || { min: 0, max: 0 };
                
                summaryText += `${this.resourceNames[resource]}: ${resData.cost} `;
                if (resData.tag) {
                    summaryText += `<span class="tw-current-tag tw-exchange-stat-tag ${resData.tag}">${resData.tag}</span>`;
                }
                if (idx < this.resourceTypes.length - 1) summaryText += ' | ';
            });
            currentSummary.innerHTML = summaryText;
        }
        
        const summaryTable = container.querySelector('#tw-summary-table');
        if (summaryTable) {
            summaryTable.innerHTML = '';
            summaryTable.appendChild(this.createSummaryTable());
        }
        
        const tableContainer = container.querySelector('#tw-data-table');
        if (tableContainer) {
            tableContainer.innerHTML = '';
            tableContainer.appendChild(this.createStatTable());
        }
        
        const status = container.querySelector('#tw-exchange-status');
        if (status) {
            const ranges = this.resourceTypes.map(resource => {
                const cache = this.minMaxCache[resource] || { min: 0, max: 0 };
                return `${this.resourceNames[resource]}: ${cache.min}-${cache.max}`;
            }).join(' | ');
            
            status.textContent = `Showing ${this.data.length} records (duplicates skipped) | Ranges: ${ranges} | Last update: ${new Date().toLocaleTimeString()}`;
        }
        
        let chartsContainer = container.querySelector('.tw-charts-container');
        if (!chartsContainer) {
            chartsContainer = this.createChartsContainer();
            container.appendChild(chartsContainer);
        }
        
        const toggleBtn = chartsContainer.querySelector('.tw-charts-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = this.showCharts ? 'Hide Charts' : 'Show Charts';
        }
        
        const chartsGrid = chartsContainer.querySelector('#tw-charts-grid');
        if (chartsGrid) {
            if (this.showCharts && this.data.length > 0) {
                chartsGrid.style.display = 'grid';
                this.updateCharts();
            } else {
                chartsGrid.style.display = 'none';
            }
        }
    }

    createStatTable() {
        const table = document.createElement('table');
        table.className = 'tw-exchange-stat-table';
        
        const thead = document.createElement('thead');
        
        const headerRow1 = document.createElement('tr');
        headerRow1.className = 'tw-exchange-stat-header';
        
        const timeHeader = document.createElement('th');
        timeHeader.textContent = 'Date & Time';
        timeHeader.rowSpan = 2;
        timeHeader.style.minWidth = '120px';
        headerRow1.appendChild(timeHeader);
        
        this.resourceTypes.forEach(resource => {
            const resourceHeader = document.createElement('th');
            resourceHeader.textContent = this.resourceNames[resource];
            resourceHeader.colSpan = 5;
            resourceHeader.className = `tw-exchange-stat-resource-header tw-exchange-stat-${resource}`;
            headerRow1.appendChild(resourceHeader);
        });
        
        thead.appendChild(headerRow1);
        
        const headerRow2 = document.createElement('tr');
        
        this.resourceTypes.forEach(resource => {
            const subHeaders = ['Amount', 'Capacity', 'Cost', 'Diff', 'Tag'];
            subHeaders.forEach(subHeader => {
                const subHeaderCell = document.createElement('th');
                subHeaderCell.textContent = subHeader;
                subHeaderCell.className = `tw-exchange-stat-${resource}`;
                headerRow2.appendChild(subHeaderCell);
            });
        });
        
        thead.appendChild(headerRow2);
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        this.updateTableBody(tbody);
        table.appendChild(tbody);
        
        return table;
    }

    updateTableBody(tbody) {
        tbody.innerHTML = '';
        
        if (this.data.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 16;
            emptyCell.textContent = 'No data collected yet. Data is saved when exchange rates change.';
            emptyCell.style.textAlign = 'center';
            emptyCell.style.padding = '20px';
            emptyCell.style.color = '#999';
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
            return;
        }
        
        this.data.forEach((record, index) => {
            const row = document.createElement('tr');
            if (index % 2 === 0) {
                row.style.backgroundColor = 'rgba(249, 249, 249, 0.5)';
            }
            
            const timeCell = document.createElement('td');
            timeCell.className = 'tw-exchange-stat-timestamp';
            timeCell.textContent = record.timestamp;
            timeCell.title = `Recorded at: ${record.timestamp}`;
            row.appendChild(timeCell);
            
            this.resourceTypes.forEach(resource => {
                const resData = record.resources[resource];
                
                const amountCell = document.createElement('td');
                amountCell.className = 'tw-exchange-stat-amount';
                amountCell.textContent = resData.amount.toLocaleString();
                row.appendChild(amountCell);
                
                const capacityCell = document.createElement('td');
                capacityCell.className = 'tw-exchange-stat-capacity';
                capacityCell.textContent = resData.capacity.toLocaleString();
                
                if (resData.capacity > 0) {
                    const percentage = Math.round((resData.amount / resData.capacity) * 100);
                    capacityCell.title = `${percentage}% full`;
                    
                    if (percentage >= 90) capacityCell.style.backgroundColor = 'rgba(255, 235, 238, 0.7)';
                    else if (percentage >= 75) capacityCell.style.backgroundColor = 'rgba(255, 243, 224, 0.7)';
                    else if (percentage >= 50) capacityCell.style.backgroundColor = 'rgba(232, 245, 233, 0.7)';
                }
                
                row.appendChild(capacityCell);
                
                const costCell = document.createElement('td');
                costCell.className = 'tw-exchange-stat-cost';
                costCell.textContent = resData.cost;
                row.appendChild(costCell);
                
                const diffCell = document.createElement('td');
                diffCell.className = `tw-exchange-stat-diff ${resData.diff > 0 ? 'positive' : resData.diff < 0 ? 'negative' : 'neutral'}`;
                
                if (index === 0) {
                    diffCell.textContent = resData.diff > 0 ? `+${resData.diff}` : resData.diff;
                    diffCell.title = `Change from previous record`;
                } else if (index < this.data.length - 1) {
                    const nextData = this.data[index + 1];
                    const nextCost = nextData.resources[resource].cost;
                    const historicalDiff = resData.cost - nextCost;
                    diffCell.textContent = historicalDiff > 0 ? `+${historicalDiff}` : historicalDiff;
                    diffCell.title = `Change from ${nextData.timestamp}`;
                } else {
                    diffCell.textContent = '—';
                    diffCell.className = 'tw-exchange-stat-diff neutral';
                }
                
                row.appendChild(diffCell);
                
                const tagCell = document.createElement('td');
                if (resData.tag) {
                    tagCell.textContent = resData.tag;
                    tagCell.className = `tw-exchange-stat-tag ${resData.tag}`;
                    
                    const cache = this.minMaxCache[resource] || { min: 0, max: 0 };
                    if (resData.tag.includes('min')) {
                        tagCell.title = `Minimum: ${cache.min}, Current: ${resData.cost}`;
                    } else if (resData.tag.includes('max')) {
                        tagCell.title = `Maximum: ${cache.max}, Current: ${resData.cost}`;
                    }
                }
                row.appendChild(tagCell);
            });
            
            tbody.appendChild(row);
        });
    }

    // ... (rest of the methods remain the same, including createLineChart, createBarChart, etc.)
    // Note: I've removed the getFilteredDataForCharts method since we no longer need to hide duplicates

    createLineChart(resource, container) {
        if (!this.data.length) return;
        
        const cache = this.minMaxCache[resource] || { min: 0, max: 0, current: 0 };
        const svgContainer = container.querySelector('.tw-chart-svg-container');
        svgContainer.innerHTML = '';
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'tw-chart-svg');
        svg.setAttribute('viewBox', '0 0 400 200');
        svg.setAttribute('preserveAspectRatio', 'none');
        
        // Get data points (limited for performance)
        const maxPoints = 100;
        const step = Math.max(1, Math.floor(this.data.length / maxPoints));
        const points = [];
        
        for (let i = 0; i < Math.min(this.data.length, maxPoints * step); i += step) {
            const record = this.data[i];
            if (record.resources[resource].cost > 0) {
                points.push({
                    time: record.timestamp.split(' - ')[1],
                    value: record.resources[resource].cost,
                    date: record.timestamp
                });
            }
        }
               
        if (points.length < 2) return;
        
        // Calculate scales
        const padding = { top: 20, right: 30, bottom: 40, left: 50 };
        const width = 400 - padding.left - padding.right;
        const height = 200 - padding.top - padding.bottom;
        
        const minVal = Math.min(...points.map(p => p.value));
        const maxVal = Math.max(...points.map(p => p.value));
        const range = maxVal - minVal || 1;
        
        // Create grid
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (height * i / 5);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', 'tw-chart-grid-line');
            line.setAttribute('x1', padding.left);
            line.setAttribute('x2', 400 - padding.right);
            line.setAttribute('y1', y);
            line.setAttribute('y2', y);
            svg.appendChild(line);
        }
        
        // Create Y-axis labels
        for (let i = 0; i <= 5; i++) {
            const value = minVal + (range * (5 - i) / 5);
            const y = padding.top + (height * i / 5);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'tw-chart-axis-label');
            text.setAttribute('x', padding.left - 5);
            text.setAttribute('y', y + 3);
            text.setAttribute('text-anchor', 'end');
            text.textContent = Math.round(value);
            svg.appendChild(text);
        }
        
        // Create min line
        const minY = padding.top + height * (1 - (cache.min - minVal) / range);
        const minLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        minLine.setAttribute('class', 'tw-chart-min-line');
        minLine.setAttribute('x1', padding.left);
        minLine.setAttribute('x2', 400 - padding.right);
        minLine.setAttribute('y1', minY);
        minLine.setAttribute('y2', minY);
        svg.appendChild(minLine);
        
        // Create max line
        const maxY = padding.top + height * (1 - (cache.max - minVal) / range);
        const maxLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        maxLine.setAttribute('class', 'tw-chart-max-line');
        maxLine.setAttribute('x1', padding.left);
        maxLine.setAttribute('x2', 400 - padding.right);
        maxLine.setAttribute('y1', maxY);
        maxLine.setAttribute('y2', maxY);
        svg.appendChild(maxLine);
        
        // Create data line
        const pathData = points.map((point, index) => {
            const x = padding.left + (width * index / (points.length - 1));
            const y = padding.top + height * (1 - (point.value - minVal) / range);
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'tw-chart-data-line');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', this.chartColors[resource]);
        svg.appendChild(path);
        
        // Create data points with tooltips
        points.forEach((point, index) => {
            const x = padding.left + (width * index / (points.length - 1));
            const y = padding.top + height * (1 - (point.value - minVal) / range);
            
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', 'tw-chart-point');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('fill', this.chartColors[resource]);
            
            circle.addEventListener('mouseenter', (e) => {
                const tooltip = svgContainer.querySelector('.tw-chart-tooltip');
                if (tooltip) {
                    tooltip.style.display = 'block';
                    tooltip.style.left = (e.clientX - svgContainer.getBoundingClientRect().left + 10) + 'px';
                    tooltip.style.top = (e.clientY - svgContainer.getBoundingClientRect().top - 30) + 'px';
                    tooltip.textContent = `${point.date}\nPrice: ${point.value}`;
                }
            });
            
            circle.addEventListener('mouseleave', () => {
                const tooltip = svgContainer.querySelector('.tw-chart-tooltip');
                if (tooltip) {
                    tooltip.style.display = 'none';
                }
            });
            
            svg.appendChild(circle);
        });
        
        // Create X-axis labels
        const labelIndices = [];
        if (points.length >= 5) {
            labelIndices.push(0);
            labelIndices.push(Math.floor(points.length / 4));
            labelIndices.push(Math.floor(points.length / 2));
            labelIndices.push(Math.floor(points.length * 3 / 4));
            labelIndices.push(points.length - 1);
        } else {
            for (let i = 0; i < points.length; i++) {
                labelIndices.push(i);
            }
        }
        
        labelIndices.forEach(index => {
            const point = points[index];
            const x = padding.left + (width * index / (points.length - 1));
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'tw-chart-axis-label');
            text.setAttribute('x', x);
            text.setAttribute('y', 200 - padding.bottom + 15);
            text.setAttribute('text-anchor', 'middle');
            text.textContent = point.time;
            svg.appendChild(text);
        });
        
        // Add tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'tw-chart-tooltip';
        svgContainer.appendChild(tooltip);
        svgContainer.appendChild(svg);
        
        // Update min/max display
        const minMaxDiv = container.querySelector('.tw-chart-minmax');
        if (minMaxDiv) {
            minMaxDiv.innerHTML = `
                <span class="tw-chart-min">Min: ${cache.min}</span>
                <span class="tw-chart-current">Current: ${cache.current}</span>
                <span class="tw-chart-max">Max: ${cache.max}</span>
            `;
        }
    }

    toggleCharts() {
        this.showCharts = !this.showCharts;
        this.saveSettings();
        
        const container = document.querySelector('.tw-exchange-stats-container');
        if (!container) return;
        
        const chartsContainer = container.querySelector('.tw-charts-container');
        if (!chartsContainer) return;
        
        const toggleBtn = chartsContainer.querySelector('.tw-charts-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = this.showCharts ? 'Hide Charts' : 'Show Charts';
        }
        
        const chartsGrid = chartsContainer.querySelector('#tw-charts-grid');
        if (chartsGrid) {
            if (this.showCharts && this.data.length > 0) {
                chartsGrid.style.display = 'grid';
                this.updateCharts();
            } else {
                chartsGrid.style.display = 'none';
            }
        }
    }

    insertStatsContainer() {
        const visBlock = document.querySelector('div.vis');
        if (!visBlock) {
            console.error('[TW Exchange Tracker] Could not find div.vis block');
            return;
        }
        
        let container = document.querySelector('.tw-exchange-stats-container');
        if (!container) {
            container = this.createStatsContainer();
            visBlock.parentNode.insertBefore(container, visBlock);
        }
        
        return container;
    }

    toggleStats() {
        if (this.isStatVisible) {
            this.hideStats();
        } else {
            this.showStats();
        }
    }

    showStats() {
        const container = this.insertStatsContainer();
        if (container) {
            container.style.display = 'block';
            this.isStatVisible = true;
            this.updateStatsUI();
            
            // Check exchange rates when stats are first opened
            setTimeout(() => this.checkExchangeRates(), 500);
            
            if (this.statRefreshInterval) {
                clearInterval(this.statRefreshInterval);
            }
            this.statRefreshInterval = setInterval(() => {
                this.updateStatsUI();
            }, 3000);
        }
    }

    hideStats() {
        const container = document.querySelector('.tw-exchange-stats-container');
        if (container) {
            container.style.display = 'none';
            this.isStatVisible = false;
            
            // Stop exchange rate monitoring when stats are hidden
            if (this.exchangeRateInterval) {
                clearInterval(this.exchangeRateInterval);
                this.exchangeRateInterval = null;
            }
            
            if (this.statRefreshInterval) {
                clearInterval(this.statRefreshInterval);
                this.statRefreshInterval = null;
            }
        }
    }
}

function initTracker() {
    if (!window.location.href.includes('mode=exchange')) return;
    
    if (window.twExchangeTracker) return;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                window.twExchangeTracker = new ExchangeTracker();
            }, 1000);
        });
    } else {
        setTimeout(() => {
            window.twExchangeTracker = new ExchangeTracker();
        }, 1000);
    }
}

initTracker();

setTimeout(() => {
    if (!window.twExchangeTracker) {
        console.log('[TW Exchange Tracker] Retrying initialization...');
        initTracker();
    }
}, 5000);
