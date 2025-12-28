class ExchangeTracker {
    constructor() {
        this.storageKey = 'tw_exchange_data_v8';
        this.settingsKey = 'tw_exchange_settings_v8';
        this.updateInterval = 10000;
        this.collectionInterval = null;
        this.isStatVisible = false;
        this.hideDuplicates = false;
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
        
        this.init();
    }

    init() {
        console.log('[TW Exchange Tracker] Initializing...');
        this.addStyles();
        this.loadSettings();
        this.tryAddButton();
        this.loadData();
        this.startCollection();
        this.setupMutationObserver();
        console.log('[TW Exchange Tracker] Initialized');
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem(this.settingsKey) || '{}');
            this.updateInterval = settings.updateInterval || 10000;
            this.showCharts = settings.showCharts !== undefined ? settings.showCharts : true;
        } catch (e) {
            this.updateInterval = 10000;
            this.showCharts = true;
        }
    }

    saveSettings() {
        const settings = {
            updateInterval: this.updateInterval,
            showCharts: this.showCharts,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    }

    addStyles() {
        if (document.getElementById('tw-exchange-tracker-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'tw-exchange-tracker-styles';
        style.textContent = `
            .tw-exchange-stat-btn {
                background: linear-gradient(to bottom, #4CAF50, #45a049);
                color: white;
                border: none;
                padding: 8px 16px;
                margin-right: 10px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s;
                font-size: 14px;
            }
            
            .tw-exchange-stat-btn:hover {
                background: linear-gradient(to bottom, #45a049, #3d8b40);
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            .tw-exchange-stats-container {
                padding: 15px;
                margin: 20px 0;
            }
            
            .tw-exchange-stats-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid #ddd;
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
                border-collapse: collapse;
                margin-bottom: 20px;
                font-size: 11px;
            }
            
            .tw-summary-table th,
            .tw-summary-table td {
                border: 1px solid #ddd;
                padding: 4px 6px;
                text-align: center;
            }
            
            .tw-summary-table th {
                background-color: #2196F3;
                color: white;
                font-weight: bold;
            }
            
            .tw-summary-table td {
                font-weight: bold;
            }
            
            .tw-summary-table .min-col {
                background-color: #E8F5E9;
            }
            
            .tw-summary-table .max-col {
                background-color = '#FFEBEE';
            }
            
            .tw-summary-table .resource-name {
                background-color: #f5f5f5;
                font-weight: bold;
                text-align: left;
                padding-left: 10px;
            }
            
            .tw-exchange-stat-table {
                width: 100%;
                font-size: 11px;
            }
            
            .tw-exchange-stat-table th,
            .tw-exchange-stat-table td {
                border: 1px solid #ddd;
                padding: 3px 5px;
                text-align: center;
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
                background-color: #f9f9f9;
            }
            
            .tw-exchange-stat-table tr:hover {
                background-color: #f5f5f5;
            }
            
            .tw-exchange-stat-header {
                background-color: #2E7D32 !important;
            }
            
            .tw-exchange-stat-resource-header {
                background-color: #388E3C !important;
            }
            
            .tw-exchange-stat-controls {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 15px;
                padding: 10px;
                border-radius: 4px;
                flex-wrap: wrap;
            }
            
            .tw-exchange-stat-controls label {
                font-weight: bold;
                color: #000;
                white-space: nowrap;
            }
            
            .tw-exchange-stat-controls input {
                width: 70px;
                padding: 4px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            .tw-exchange-stat-controls button {
                background: linear-gradient(to bottom, #947a62 0%,#7b5c3d 22%,#6c4824 30%,#6c4824 100%)
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
            
            .tw-exchange-stat-tag.min-10 {
                background-color: #8BC34A;
                color: white;
            }
            
            .tw-exchange-stat-tag.min-50 {
                background-color: #CDDC39;
                color: black;
            }
            
            .tw-exchange-stat-tag.min-100 {
                background-color: #FFEB3B;
                color: black;
            }
            
            .tw-exchange-stat-tag.max {
                background-color: #f44336;
                color: white;
            }
            
            .tw-exchange-stat-tag.max-10 {
                background-color: #FF9800;
                color: white;
            }
            
            .tw-exchange-stat-tag.max-50 {
                background-color: #FFC107;
                color: black;
            }
            
            .tw-exchange-stat-tag.max-100 {
                background-color: #FFEB3B;
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
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-top: 10px;
                margin-bottom: 20px;
                height: 350px;
            }
            
            .tw-hidden-rows-summary {
                background-color: #f0f0f0;
                font-style: italic;
                text-align: center;
                color: #666;
                padding: 8px;
                border-top: 1px dashed #999;
            }
            
            .tw-charts-container {
                margin-top: 20px;
                border-top: 1px solid #ddd;
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
                background: #F4E4BC;
                border: 1px solid #7d510f;
                border-radius: 0px;
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
                
                // Calculate recent min/max (last 10, 50, 100 records)
                const recent10 = this.data.slice(0, Math.min(10, this.data.length));
                const recent50 = this.data.slice(0, Math.min(50, this.data.length));
                const recent100 = this.data.slice(0, Math.min(100, this.data.length));
                
                const recent10Costs = recent10.map(r => r.resources[resource].cost).filter(c => c > 0);
                const recent50Costs = recent50.map(r => r.resources[resource].cost).filter(c => c > 0);
                const recent100Costs = recent100.map(r => r.resources[resource].cost).filter(c => c > 0);
                
                this.recentMinMaxCache[resource] = {
                    allTime: {
                        min: this.minMaxCache[resource].min,
                        max: this.minMaxCache[resource].max
                    },
                    last10: {
                        min: recent10Costs.length > 0 ? Math.min(...recent10Costs) : 0,
                        max: recent10Costs.length > 0 ? Math.max(...recent10Costs) : 0
                    },
                    last50: {
                        min: recent50Costs.length > 0 ? Math.min(...recent50Costs) : 0,
                        max: recent50Costs.length > 0 ? Math.max(...recent50Costs) : 0
                    },
                    last100: {
                        min: recent100Costs.length > 0 ? Math.min(...recent100Costs) : 0,
                        max: recent100Costs.length > 0 ? Math.max(...recent100Costs) : 0
                    }
                };
            } else {
                this.minMaxCache[resource] = { min: 0, max: 0, current: 0 };
                this.recentMinMaxCache[resource] = {
                    allTime: { min: 0, max: 0 },
                    last10: { min: 0, max: 0 },
                    last50: { min: 0, max: 0 },
                    last100: { min: 0, max: 0 }
                };
            }
        });
    }

    calculateTag(currentCost, minCost, maxCost) {
        if (currentCost === 0) return '';
        
        if (currentCost === minCost) return 'min';
        if (currentCost === maxCost) return 'max';
        
        if (minCost > 0) {
            const diffFromMin = currentCost - minCost;
            if (diffFromMin <= 1) return 'min';
            if (diffFromMin <= 10) return 'min-10';
            if (diffFromMin <= 50) return 'min-50';
            if (diffFromMin <= 100) return 'min-100';
        }
        
        if (maxCost > 0) {
            const diffFromMax = maxCost - currentCost;
            if (diffFromMax <= 1) return 'max';
            if (diffFromMax <= 10) return 'max-10';
            if (diffFromMax <= 50) return 'max-50';
            if (diffFromMax <= 100) return 'max-100';
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
        
        if (this.data.length > 0) {
            const previousData = this.data[0];
            
            this.resourceTypes.forEach(resource => {
                const prevCost = previousData.resources[resource].cost;
                const currentCost = currentData.resources[resource].cost;
                
                currentData.resources[resource].diff = prevCost > 0 ? currentCost - prevCost : 0;
            });
        }
        
        this.data.unshift(currentData);
        
        if (this.data.length > 500) {
            this.data = this.data.slice(0, 500);
        }
        
        this.calculateMinMaxValues();
        this.updateAllTags();
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            console.log('[TW Exchange Tracker] Data saved, records:', this.data.length);
            
            if (this.isStatVisible) {
                this.updateStatsUI();
                if (this.showCharts) {
                    this.updateCharts();
                }
            }
        } catch (e) {
            console.error('[TW Exchange Tracker] Error saving:', e);
            if (e.name === 'QuotaExceededError') {
                this.data = this.data.slice(0, 100);
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

    startCollection() {
        this.loadData();
        
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
        }
        
        setTimeout(() => {
            this.saveData();
        }, 2000);
        
        this.collectionInterval = setInterval(() => {
            this.saveData();
        }, this.updateInterval);
    }

    updateCollectionInterval(newInterval) {
        this.updateInterval = newInterval * 1000;
        this.saveSettings();
        this.startCollection();
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
        minHeader.colSpan = 4;
        minHeader.className = 'min-col';
        headerRow1.appendChild(minHeader);
        
        const maxHeader = document.createElement('th');
        maxHeader.textContent = 'MAX';
        maxHeader.colSpan = 4;
        maxHeader.className = 'max-col';
        headerRow1.appendChild(maxHeader);
        
        thead.appendChild(headerRow1);
        
        // Second header row
        const headerRow2 = document.createElement('tr');
        
        // Min sub-headers
        const minSubHeaders = ['All Time', 'Last 10', 'Last 50', 'Last 100'];
        minSubHeaders.forEach(subHeader => {
            const th = document.createElement('th');
            th.textContent = subHeader;
            th.className = 'min-col';
            th.style.fontSize = '10px';
            headerRow2.appendChild(th);
        });
        
        // Max sub-headers
        const maxSubHeaders = ['All Time', 'Last 10', 'Last 50', 'Last 100'];
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
                last10: { min: 0, max: 0 },
                last50: { min: 0, max: 0 },
                last100: { min: 0, max: 0 }
            };
            
            // Min values cells
            const minPeriods = ['allTime', 'last10', 'last50', 'last100'];
            minPeriods.forEach(period => {
                const cell = document.createElement('td');
                const value = recentCache[period]?.min || 0;
                cell.textContent = value > 0 ? value : '—';
                cell.className = 'min-col';
                
                if (value > 0) {
                    // Check if current value is close to this min
                    const currentCost = this.minMaxCache[resource]?.current || 0;
                    const diff = currentCost - value;
                    if (diff <= 10 && diff >= 0) {
                        cell.style.fontWeight = 'bold';
                        cell.style.backgroundColor = '#C8E6C9';
                    }
                    
                    cell.title = `${this.resourceNames[resource]} min in ${period.replace('last', 'last ').replace('allTime', 'all time')}: ${value}`;
                }
                
                row.appendChild(cell);
            });
            
            // Max values cells
            const maxPeriods = ['allTime', 'last10', 'last50', 'last100'];
            maxPeriods.forEach(period => {
                const cell = document.createElement('td');
                const value = recentCache[period]?.max || 0;
                cell.textContent = value > 0 ? value : '—';
                cell.className = 'max-col';
                
                if (value > 0) {
                    // Check if current value is close to this max
                    const currentCost = this.minMaxCache[resource]?.current || 0;
                    const diff = value - currentCost;
                    if (diff <= 10 && diff >= 0) {
                        cell.style.fontWeight = 'bold';
                        cell.style.backgroundColor = '#FFCDD2';
                    }
                    
                    cell.title = `${this.resourceNames[resource]} max in ${period.replace('last', 'last ').replace('allTime', 'all time')}: ${value}`;
                }
                
                row.appendChild(cell);
            });
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        return table;
    }

    getFilteredDataForCharts() {
        if (!this.hideDuplicates) return this.data;
        
        const filteredData = [];
        let prevVisibleRecord = null;
        
        this.data.forEach((record, index) => {
            if (index === 0) {
                filteredData.push(record);
                prevVisibleRecord = record;
                return;
            }
            
            let allDiffsZero = true;
            this.resourceTypes.forEach(resource => {
                if (record.resources[resource].diff !== 0) {
                    allDiffsZero = false;
                }
            });
            
            if (!allDiffsZero) {
                filteredData.push(record);
                prevVisibleRecord = record;
            }
        });
        
        return filteredData;
    }

    createLineChart(resource, container) {
        const filteredData = this.getFilteredDataForCharts();
        if (!filteredData.length) return;
        
        const cache = this.minMaxCache[resource] || { min: 0, max: 0, current: 0 };
        const svgContainer = container.querySelector('.tw-chart-svg-container');
        svgContainer.innerHTML = '';
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'tw-chart-svg');
        svg.setAttribute('viewBox', '0 0 400 200');
        svg.setAttribute('preserveAspectRatio', 'none');
        
        // Get data points (limited for performance) - NEWEST DATA FIRST
        const maxPoints = 100;
        const step = Math.max(1, Math.floor(filteredData.length / maxPoints));
        const points = [];
        
        // Take the most recent points (newest first in filteredData array)
        for (let i = 0; i < Math.min(filteredData.length, maxPoints * step); i += step) {
            const record = filteredData[i];
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
        
        // Create data line (REVERSED X-AXIS)
        const pathData = points.map((point, index) => {
            // Reverse X coordinate: newest (index = points.length-1) goes to right
            const x = padding.left + (width * (points.length - 1 - index) / (points.length - 1));
            const y = padding.top + height * (1 - (point.value - minVal) / range);
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'tw-chart-data-line');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', this.chartColors[resource]);
        svg.appendChild(path);
        
        // Create data points with tooltips (REVERSED X-AXIS)
        points.forEach((point, index) => {
            // Reverse X coordinate
            const x = padding.left + (width * (points.length - 1 - index) / (points.length - 1));
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
        
        // Create X-axis labels (REVERSED X-AXIS) - show newest on right
        const labelIndices = [];
        if (points.length >= 5) {
            labelIndices.push(0); // Oldest (left side)
            labelIndices.push(Math.floor(points.length / 4));
            labelIndices.push(Math.floor(points.length / 2));
            labelIndices.push(Math.floor(points.length * 3 / 4));
            labelIndices.push(points.length - 1); // Newest (right side)
        } else {
            for (let i = 0; i < points.length; i++) {
                labelIndices.push(i);
            }
        }
        
        labelIndices.forEach(index => {
            const point = points[index];
            // Reverse X coordinate for labels too
            const x = padding.left + (width * (points.length - 1 - index) / (points.length - 1));
            
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

    createBarChart(container) {
        const filteredData = this.getFilteredDataForCharts();
        if (!filteredData.length) return;
        
        const svgContainer = container.querySelector('.tw-chart-svg-container');
        svgContainer.innerHTML = '';
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'tw-chart-svg');
        svg.setAttribute('viewBox', '0 0 400 200');
        svg.setAttribute('preserveAspectRatio', 'none');
        
        const padding = { top: 30, right: 30, bottom: 40, left: 60 };
        const width = 400 - padding.left - padding.right;
        const height = 200 - padding.top - padding.bottom;
        
        // Calculate max value for scaling
        const allValues = [];
        this.resourceTypes.forEach(resource => {
            const cache = this.minMaxCache[resource] || { min: 0, max: 0, current: 0 };
            allValues.push(cache.min, cache.current, cache.max);
        });
        const maxValue = Math.max(...allValues) || 1;
        
        // Create Y-axis grid and labels
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (height * i / 5);
            const value = Math.round(maxValue * (5 - i) / 5);
            
            // Grid line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', 'tw-chart-grid-line');
            line.setAttribute('x1', padding.left);
            line.setAttribute('x2', 400 - padding.right);
            line.setAttribute('y1', y);
            line.setAttribute('y2', y);
            svg.appendChild(line);
            
            // Y-axis label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'tw-chart-axis-label');
            text.setAttribute('x', padding.left - 5);
            text.setAttribute('y', y + 3);
            text.setAttribute('text-anchor', 'end');
            text.textContent = value;
            svg.appendChild(text);
        }
        
        // Create bars
        const barWidth = 25;
        const groupSpacing = 15;
        const barSpacing = 8;
        const totalGroupWidth = barWidth * 3 + barSpacing * 2;
        
        this.resourceTypes.forEach((resource, resourceIndex) => {
            const cache = this.minMaxCache[resource] || { min: 0, max: 0, current: 0 };
            const groupX = padding.left + resourceIndex * (totalGroupWidth + groupSpacing);
            
            // Min bar (green)
            const minHeight = (cache.min / maxValue) * height;
            const minY = padding.top + height - minHeight;
            const minBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            minBar.setAttribute('class', 'tw-bar-chart-bar');
            minBar.setAttribute('x', groupX);
            minBar.setAttribute('y', minY);
            minBar.setAttribute('width', barWidth);
            minBar.setAttribute('height', minHeight);
            minBar.setAttribute('fill', '#4CAF50');
            svg.appendChild(minBar);
            
            // Current bar (blue)
            const currentHeight = (cache.current / maxValue) * height;
            const currentY = padding.top + height - currentHeight;
            const currentBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            currentBar.setAttribute('class', 'tw-bar-chart-bar');
            currentBar.setAttribute('x', groupX + barWidth + barSpacing);
            currentBar.setAttribute('y', currentY);
            currentBar.setAttribute('width', barWidth);
            currentBar.setAttribute('height', currentHeight);
            currentBar.setAttribute('fill', '#2196F3');
            svg.appendChild(currentBar);
            
            // Max bar (red)
            const maxHeight = (cache.max / maxValue) * height;
            const maxY = padding.top + height - maxHeight;
            const maxBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            maxBar.setAttribute('class', 'tw-bar-chart-bar');
            maxBar.setAttribute('x', groupX + (barWidth + barSpacing) * 2);
            maxBar.setAttribute('y', maxY);
            maxBar.setAttribute('width', barWidth);
            maxBar.setAttribute('height', maxHeight);
            maxBar.setAttribute('fill', '#f44336');
            svg.appendChild(maxBar);
            
            // Add value labels on bars
            [minBar, currentBar, maxBar].forEach((bar, barIndex) => {
                const barX = parseFloat(bar.getAttribute('x'));
                const barY = parseFloat(bar.getAttribute('y'));
                const barHeight = parseFloat(bar.getAttribute('height'));
                
                if (barHeight > 15) {
                    const values = [cache.min, cache.current, cache.max];
                    const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    valueText.setAttribute('class', 'tw-bar-value');
                    valueText.setAttribute('x', barX + barWidth / 2);
                    valueText.setAttribute('y', barY + barHeight / 2 + 3);
                    valueText.textContent = values[barIndex];
                    svg.appendChild(valueText);
                }
            });
            
            // Add resource label
            const resourceLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            resourceLabel.setAttribute('class', 'tw-bar-label');
            resourceLabel.setAttribute('x', groupX + totalGroupWidth / 2);
            resourceLabel.setAttribute('y', 200 - padding.bottom + 15);
            resourceLabel.textContent = this.resourceNames[resource];
            svg.appendChild(resourceLabel);
        });
        
        // Add legend
        const legendData = [
            { label: 'Min', color: '#4CAF50', x: padding.left, y: padding.top - 10 },
            { label: 'Current', color: '#2196F3', x: padding.left + 80, y: padding.top - 10 },
            { label: 'Max', color: '#f44336', x: padding.left + 180, y: padding.top - 10 }
        ];
        
        legendData.forEach(item => {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', item.x);
            rect.setAttribute('y', item.y);
            rect.setAttribute('width', 12);
            rect.setAttribute('height', 12);
            rect.setAttribute('fill', item.color);
            svg.appendChild(rect);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'tw-chart-axis-label');
            text.setAttribute('x', item.x + 20);
            text.setAttribute('y', item.y + 10);
            text.textContent = item.label;
            svg.appendChild(text);
        });
        
        svgContainer.appendChild(svg);
    }

    createChartsContainer() {
        const container = document.createElement('div');
        container.className = 'tw-charts-container';
        
        const header = document.createElement('div');
        header.className = 'tw-charts-header';
        
        const title = document.createElement('h3');
        title.className = 'tw-charts-title';
        title.textContent = 'Price History Charts';
        
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'tw-charts-toggle';
        toggleBtn.textContent = this.showCharts ? 'Hide Charts' : 'Show Charts';
        toggleBtn.onclick = () => this.toggleCharts();
        
        header.appendChild(title);
        header.appendChild(toggleBtn);
        container.appendChild(header);
        
        if (this.showCharts) {
            const grid = document.createElement('div');
            grid.className = 'tw-charts-grid';
            grid.id = 'tw-charts-grid';
            
            // Create 2x2 grid: 3 line charts + 1 bar chart
            const chartOrder = ['wood', 'stone', 'iron', 'bar'];
            
            chartOrder.forEach((chartType, index) => {
                const chartContainer = document.createElement('div');
                chartContainer.className = 'tw-chart-container';
                
                if (chartType === 'bar') {
                    chartContainer.id = 'tw-bar-chart';
                    const chartTitle = document.createElement('h4');
                    chartTitle.className = 'tw-chart-title';
                    chartTitle.textContent = 'Min/Current/Max Comparison';
                    chartContainer.appendChild(chartTitle);
                    
                    const svgContainer = document.createElement('div');
                    svgContainer.className = 'tw-chart-svg-container';
                    chartContainer.appendChild(svgContainer);
                } else {
                    chartContainer.id = `tw-chart-${chartType}`;
                    const chartTitle = document.createElement('h4');
                    chartTitle.className = 'tw-chart-title';
                    chartTitle.textContent = `${this.resourceNames[chartType]} Price History`;
                    chartContainer.appendChild(chartTitle);
                    
                    const svgContainer = document.createElement('div');
                    svgContainer.className = 'tw-chart-svg-container';
                    chartContainer.appendChild(svgContainer);
                    
                    const minMaxDiv = document.createElement('div');
                    minMaxDiv.className = 'tw-chart-minmax';
                    chartContainer.appendChild(minMaxDiv);
                }
                
                grid.appendChild(chartContainer);
            });
            
            container.appendChild(grid);
        }
        
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
        
        const controls = document.createElement('div');
        controls.className = 'tw-exchange-stat-controls';
        
        const updateLabel = document.createElement('label');
        updateLabel.textContent = 'Update every:';
        updateLabel.htmlFor = 'tw-update-interval';
        
        const updateInput = document.createElement('input');
        updateInput.id = 'tw-update-interval';
        updateInput.type = 'number';
        updateInput.min = '1';
        updateInput.max = '3600';
        updateInput.value = this.updateInterval / 1000;
        updateInput.onchange = (e) => {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= 3600) {
                this.updateCollectionInterval(value);
                e.target.value = value;
            } else {
                e.target.value = this.updateInterval / 1000;
            }
        };
        
        const secLabel = document.createElement('label');
        secLabel.textContent = 'seconds';
        secLabel.style.color = '#000';
        
        const hideDupesBtn = document.createElement('button');
        hideDupesBtn.id = 'tw-hide-dupes-btn';
        hideDupesBtn.textContent = 'Hide Duplicates';
        hideDupesBtn.title = 'Hide rows with no changes from previous record (applies to table and charts)';
        hideDupesBtn.onclick = () => this.toggleHideDuplicates();
        
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
        
        controls.appendChild(updateLabel);
        controls.appendChild(updateInput);
        controls.appendChild(secLabel);
        controls.appendChild(hideDupesBtn);
        controls.appendChild(clearBtn);
        
        const currentSummary = document.createElement('div');
        currentSummary.style.marginBottom = '15px';
        currentSummary.style.padding = '10px';
        currentSummary.style.backgroundColor = '#E3F2FD';
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
            
            let visibleRows = 0;
            if (this.data.length > 0) {
                visibleRows = 1;
                let prevVisibleRecord = this.data[0];
                
                for (let i = 1; i < this.data.length; i++) {
                    const record = this.data[i];
                    
                    if (this.hideDuplicates) {
                        let allDiffsZero = true;
                        this.resourceTypes.forEach(resource => {
                            if (record.resources[resource].diff !== 0) {
                                allDiffsZero = false;
                            }
                        });
                        
                        if (!allDiffsZero) {
                            visibleRows++;
                            prevVisibleRecord = record;
                        }
                    } else {
                        visibleRows++;
                    }
                }
            }
            
            const rowCountText = this.hideDuplicates ? `${visibleRows}/${this.data.length} records` : `${this.data.length} records`;
            status.textContent = `Showing ${rowCountText} | Ranges: ${ranges} | Last update: ${new Date().toLocaleTimeString()}`;
        }
        
        // Always ensure charts container exists when stats are visible
        let chartsContainer = container.querySelector('.tw-charts-container');
        if (!chartsContainer) {
            chartsContainer = this.createChartsContainer();
            container.appendChild(chartsContainer);
        }
        
        // Update the toggle button text
        const toggleBtn = chartsContainer.querySelector('.tw-charts-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = this.showCharts ? 'Hide Charts' : 'Show Charts';
        }
        
        // Only show charts if enabled
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
            emptyCell.textContent = 'No data collected yet. Data is saved every ' + (this.updateInterval / 1000) + ' seconds.';
            emptyCell.style.textAlign = 'center';
            emptyCell.style.padding = '20px';
            emptyCell.style.color = '#999';
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
            return;
        }
        
        let visibleRows = 0;
        let prevVisibleRecord = null;
        let totalHidden = 0;
        
        this.data.forEach((record, index) => {
            let shouldHide = false;
            
            if (this.hideDuplicates && prevVisibleRecord !== null && index > 0) {
                let allDiffsZero = true;
                
                this.resourceTypes.forEach(resource => {
                    const currentDiff = record.resources[resource].diff;
                    if (currentDiff !== 0) {
                        allDiffsZero = false;
                    }
                });
                
                shouldHide = allDiffsZero;
            }
            
            if (index === 0) {
                shouldHide = false;
            }
            
            if (shouldHide) {
                totalHidden++;
                return;
            }
            
            const row = document.createElement('tr');
            if (visibleRows % 2 === 0) {
                row.style.backgroundColor = '#f9f9f9';
            }
            
            if (this.hideDuplicates && prevVisibleRecord !== null) {
                const currentIndex = this.data.indexOf(record);
                const prevIndex = this.data.indexOf(prevVisibleRecord);
                const skippedCount = prevIndex - currentIndex - 1;
                
                if (skippedCount > 0) {
                    row.style.borderTop = '2px dashed #999';
                }
            }
            
            const timeCell = document.createElement('td');
            timeCell.className = 'tw-exchange-stat-timestamp';
            timeCell.textContent = record.timestamp;
            
            if (this.hideDuplicates && prevVisibleRecord !== null) {
                const currentIndex = this.data.indexOf(record);
                const prevIndex = this.data.indexOf(prevVisibleRecord);
                const skippedCount = prevIndex - currentIndex - 1;
                
                if (skippedCount > 0) {
                    timeCell.style.color = '#666';
                    timeCell.title = `Recorded at: ${record.timestamp}\n(${skippedCount} duplicate records hidden)`;
                } else {
                    timeCell.title = `Recorded at: ${record.timestamp}`;
                }
            } else {
                timeCell.title = `Recorded at: ${record.timestamp}`;
            }
            
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
                    
                    if (percentage >= 90) capacityCell.style.backgroundColor = '#FFEBEE';
                    else if (percentage >= 75) capacityCell.style.backgroundColor = '#FFF3E0';
                    else if (percentage >= 50) capacityCell.style.backgroundColor = '#E8F5E9';
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
            visibleRows++;
            prevVisibleRecord = record;
        });
        
        if (this.hideDuplicates && totalHidden > 0) {
            const summaryRow = document.createElement('tr');
            const summaryCell = document.createElement('td');
            summaryCell.colSpan = 16;
            summaryCell.className = 'tw-hidden-rows-summary';
            summaryCell.textContent = `${totalHidden} duplicate record${totalHidden !== 1 ? 's' : ''} hidden (no price changes)`;
            summaryCell.title = 'Records with no price changes from previous record are hidden';
            
            summaryRow.appendChild(summaryCell);
            tbody.appendChild(summaryRow);
        }
    }

    updateCharts() {
        if (!this.showCharts || !this.data.length) return;
        
        // Update line charts
        this.resourceTypes.forEach(resource => {
            const chartContainer = document.querySelector(`#tw-chart-${resource}`);
            if (chartContainer) {
                this.createLineChart(resource, chartContainer);
            }
        });
        
        // Update bar chart
        const barChartContainer = document.querySelector('#tw-bar-chart');
        if (barChartContainer) {
            this.createBarChart(barChartContainer);
        }
    }

    toggleCharts() {
        this.showCharts = !this.showCharts;
        this.saveSettings();
        
        const container = document.querySelector('.tw-exchange-stats-container');
        if (!container) return;
        
        const chartsContainer = container.querySelector('.tw-charts-container');
        if (!chartsContainer) return;
        
        // Update toggle button
        const toggleBtn = chartsContainer.querySelector('.tw-charts-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = this.showCharts ? 'Hide Charts' : 'Show Charts';
        }
        
        // Show/hide charts grid
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

    toggleHideDuplicates() {
        this.hideDuplicates = !this.hideDuplicates;
        const button = document.querySelector('#tw-hide-dupes-btn');
        if (button) {
            button.textContent = this.hideDuplicates ? 'Show All' : 'Hide Duplicates';
            button.title = this.hideDuplicates ? 'Show all rows including duplicates' : 'Hide rows with no changes from previous record (applies to table and charts)';
        }
        
        this.updateStatsUI();
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
            
            // Start auto-refresh
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
