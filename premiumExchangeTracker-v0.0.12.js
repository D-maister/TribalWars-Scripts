class ExchangeTracker {
    constructor() {
        this.storageKey = 'tw_exchange_data_v5';
        this.settingsKey = 'tw_exchange_settings_v5';
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
            'wood': '#8B4513',
            'stone': '#708090',
            'iron': '#C0C0C0'
        };
        this.minMaxCache = {};
        this.charts = {};
        
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
                background: white;
                border: 2px solid #4CAF50;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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
                color: #2E7D32;
                font-size: 18px;
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
                background-color: #FFEBEE;
            }
            
            .tw-summary-table .resource-name {
                background-color: #f5f5f5;
                font-weight: bold;
                text-align: left;
                padding-left: 10px;
            }
            
            .tw-exchange-stat-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
            }
            
            .tw-exchange-stat-table th,
            .tw-exchange-stat-table td {
                border: 1px solid #ddd;
                padding: 3px 5px;
                text-align: center;
            }
            
            .tw-exchange-stat-table th {
                background-color: #4CAF50;
                color: white;
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
                background-color: #f5f5f5;
                border-radius: 4px;
                flex-wrap: wrap;
            }
            
            .tw-exchange-stat-controls label {
                font-weight: bold;
                color: #333;
                white-space: nowrap;
            }
            
            .tw-exchange-stat-controls input {
                width: 70px;
                padding: 4px 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            
            .tw-exchange-stat-controls button {
                background: linear-gradient(to bottom, #f44336, #d32f2f);
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
                white-space: nowrap;
            }
            
            .tw-exchange-stat-controls button:hover {
                background: linear-gradient(to bottom, #d32f2f, #b71c1c);
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
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .tw-chart-container {
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 10px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            
            .tw-chart-title {
                color: #333;
                font-size: 14px;
                font-weight: bold;
                margin: 0 0 10px 0;
                text-align: center;
            }
            
            .tw-chart-canvas {
                width: 100%;
                height: 200px;
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
        this.resourceTypes.forEach(resource => {
            const costs = this.data
                .map(record => record.resources[resource].cost)
                .filter(cost => cost > 0);
            
            if (costs.length > 0) {
                this.minMaxCache[resource] = {
                    min: Math.min(...costs),
                    max: Math.max(...costs)
                };
            } else {
                this.minMaxCache[resource] = { min: 0, max: 0 };
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
        const headerRow = document.createElement('tr');
        
        const resourceHeader = document.createElement('th');
        resourceHeader.textContent = 'Resource';
        headerRow.appendChild(resourceHeader);
        
        // Updated tag order as requested
        const tagTypes = ['min', 'min-10', 'min-50', 'min-100', 'max-100', 'max-50', 'max-10', 'max'];
        
        tagTypes.forEach(tagType => {
            const th = document.createElement('th');
            th.textContent = tagType;
            if (tagType.includes('min')) {
                th.className = 'min-col';
            } else {
                th.className = 'max-col';
            }
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        
        this.resourceTypes.forEach(resource => {
            const row = document.createElement('tr');
            
            const resourceCell = document.createElement('td');
            resourceCell.className = 'resource-name';
            resourceCell.textContent = this.resourceNames[resource];
            row.appendChild(resourceCell);
            
            const cache = this.minMaxCache[resource] || { min: 0, max: 0 };
            const minValue = cache.min;
            const maxValue = cache.max;
            
            // Updated tag order as requested
            const tagValues = {
                'min': minValue,
                'min-10': minValue > 0 ? minValue + 10 : 0,
                'min-50': minValue > 0 ? minValue + 50 : 0,
                'min-100': minValue > 0 ? minValue + 100 : 0,
                'max-100': maxValue > 0 ? maxValue - 100 : 0,
                'max-50': maxValue > 0 ? maxValue - 50 : 0,
                'max-10': maxValue > 0 ? maxValue - 10 : 0,
                'max': maxValue
            };
            
            tagTypes.forEach(tagType => {
                const cell = document.createElement('td');
                const value = tagValues[tagType];
                cell.textContent = value > 0 ? value : '—';
                
                if (value > 0) {
                    const hasRecordsNearThreshold = this.data.some(record => {
                        const recordCost = record.resources[resource].cost;
                        if (recordCost === 0) return false;
                        
                        if (tagType.includes('min')) {
                            const thresholdValue = tagValues[tagType];
                            if (tagType === 'min') {
                                return recordCost === thresholdValue;
                            } else {
                                return recordCost >= thresholdValue && recordCost < thresholdValue + 10;
                            }
                        } else {
                            const thresholdValue = tagValues[tagType];
                            if (tagType === 'max') {
                                return recordCost === thresholdValue;
                            } else {
                                return recordCost <= thresholdValue && recordCost > thresholdValue - 10;
                            }
                        }
                    });
                    
                    if (hasRecordsNearThreshold) {
                        cell.style.fontWeight = 'bold';
                        if (tagType.includes('min')) {
                            cell.style.backgroundColor = '#C8E6C9';
                        } else {
                            cell.style.backgroundColor = '#FFCDD2';
                        }
                    }
                }
                
                if (value > 0) {
                    let tooltip = '';
                    if (tagType === 'min') {
                        tooltip = `Minimum value: ${value}`;
                    } else if (tagType === 'max') {
                        tooltip = `Maximum value: ${value}`;
                    } else if (tagType.includes('min')) {
                        tooltip = `Value ${value} (min + ${parseInt(tagType.split('-')[1])})`;
                    } else if (tagType.includes('max')) {
                        tooltip = `Value ${value} (max - ${parseInt(tagType.split('-')[1])})`;
                    }
                    cell.title = tooltip;
                }
                
                row.appendChild(cell);
            });
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        return table;
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
            
            this.resourceTypes.forEach(resource => {
                const chartContainer = document.createElement('div');
                chartContainer.className = 'tw-chart-container';
                
                const chartTitle = document.createElement('h4');
                chartTitle.className = 'tw-chart-title';
                chartTitle.textContent = `${this.resourceNames[resource]} Price History`;
                chartContainer.appendChild(chartTitle);
                
                const canvas = document.createElement('canvas');
                canvas.id = `tw-chart-${resource}`;
                canvas.className = 'tw-chart-canvas';
                chartContainer.appendChild(canvas);
                
                const minMaxDiv = document.createElement('div');
                minMaxDiv.className = 'tw-chart-minmax';
                
                const cache = this.minMaxCache[resource] || { min: 0, max: 0 };
                const minSpan = document.createElement('span');
                minSpan.className = 'tw-chart-min';
                minSpan.textContent = `Min: ${cache.min}`;
                
                const maxSpan = document.createElement('span');
                maxSpan.className = 'tw-chart-max';
                maxSpan.textContent = `Max: ${cache.max}`;
                
                minMaxDiv.appendChild(minSpan);
                minMaxDiv.appendChild(maxSpan);
                chartContainer.appendChild(minMaxDiv);
                
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
        secLabel.style.color = '#666';
        
        const hideDupesBtn = document.createElement('button');
        hideDupesBtn.id = 'tw-hide-dupes-btn';
        hideDupesBtn.textContent = 'Hide Duplicates';
        hideDupesBtn.title = 'Hide rows with no changes from previous record';
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
                if (this.showCharts) {
                    this.updateCharts();
                }
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
        
        // Update charts if they exist
        if (this.showCharts) {
            const chartsContainer = document.querySelector('.tw-charts-container');
            if (chartsContainer) {
                this.updateCharts();
            } else {
                // Add charts container if it doesn't exist
                const statsContainer = document.querySelector('.tw-exchange-stats-container');
                if (statsContainer) {
                    statsContainer.appendChild(this.createChartsContainer());
                    this.initializeCharts();
                }
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

    initializeCharts() {
        if (!this.showCharts || this.data.length < 2) return;
        
        this.resourceTypes.forEach(resource => {
            const canvas = document.getElementById(`tw-chart-${resource}`);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const cache = this.minMaxCache[resource] || { min: 0, max: 0 };
            
            // Prepare data for chart
            const labels = [];
            const prices = [];
            const minValues = [];
            const maxValues = [];
            
            // Use limited data points for better performance
            const maxPoints = 50;
            const step = Math.max(1, Math.floor(this.data.length / maxPoints));
            
            for (let i = this.data.length - 1; i >= 0; i -= step) {
                const record = this.data[i];
                if (record.resources[resource].cost > 0) {
                    labels.push(record.timestamp.split(' - ')[1]); // Just the time part
                    prices.push(record.resources[resource].cost);
                    minValues.push(cache.min);
                    maxValues.push(cache.max);
                }
            }
            
            // Reverse to show chronological order
            labels.reverse();
            prices.reverse();
            minValues.reverse();
            maxValues.reverse();
            
            // Destroy existing chart if it exists
            if (this.charts[resource]) {
                this.charts[resource].destroy();
            }
            
            this.charts[resource] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Price',
                            data: prices,
                            borderColor: this.chartColors[resource],
                            backgroundColor: this.chartColors[resource] + '20',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.1
                        },
                        {
                            label: 'Min',
                            data: minValues,
                            borderColor: '#4CAF50',
                            backgroundColor: 'transparent',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            fill: false,
                            pointRadius: 0
                        },
                        {
                            label: 'Max',
                            data: maxValues,
                            borderColor: '#f44336',
                            backgroundColor: 'transparent',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            fill: false,
                            pointRadius: 0
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                boxWidth: 12,
                                font: {
                                    size: 10
                                }
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += context.parsed.y;
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Time',
                                font: {
                                    size: 10
                                }
                            },
                            ticks: {
                                maxTicksLimit: 10,
                                font: {
                                    size: 8
                                }
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Price',
                                font: {
                                    size: 10
                                }
                            },
                            ticks: {
                                font: {
                                    size: 8
                                }
                            },
                            suggestedMin: Math.max(0, cache.min - 10),
                            suggestedMax: cache.max + 10
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    elements: {
                        point: {
                            radius: 2,
                            hoverRadius: 4
                        }
                    }
                }
            });
        });
    }

    updateCharts() {
        if (!this.showCharts) return;
        
        this.resourceTypes.forEach(resource => {
            const chart = this.charts[resource];
            if (!chart) {
                this.initializeCharts();
                return;
            }
            
            const cache = this.minMaxCache[resource] || { min: 0, max: 0 };
            
            // Update data
            const labels = [];
            const prices = [];
            const minValues = [];
            const maxValues = [];
            
            const maxPoints = 50;
            const step = Math.max(1, Math.floor(this.data.length / maxPoints));
            
            for (let i = this.data.length - 1; i >= 0; i -= step) {
                const record = this.data[i];
                if (record.resources[resource].cost > 0) {
                    labels.push(record.timestamp.split(' - ')[1]);
                    prices.push(record.resources[resource].cost);
                    minValues.push(cache.min);
                    maxValues.push(cache.max);
                }
            }
            
            labels.reverse();
            prices.reverse();
            minValues.reverse();
            maxValues.reverse();
            
            chart.data.labels = labels;
            chart.data.datasets[0].data = prices;
            chart.data.datasets[1].data = minValues;
            chart.data.datasets[2].data = maxValues;
            
            // Update min/max display
            const minMaxDiv = document.querySelector(`#tw-chart-${resource}`).parentNode.querySelector('.tw-chart-minmax');
            if (minMaxDiv) {
                const minSpan = minMaxDiv.querySelector('.tw-chart-min');
                const maxSpan = minMaxDiv.querySelector('.tw-chart-max');
                if (minSpan) minSpan.textContent = `Min: ${cache.min}`;
                if (maxSpan) maxSpan.textContent = `Max: ${cache.max}`;
            }
            
            chart.update();
        });
    }

    toggleCharts() {
        this.showCharts = !this.showCharts;
        this.saveSettings();
        
        const toggleBtn = document.querySelector('.tw-charts-toggle');
        if (toggleBtn) {
            toggleBtn.textContent = this.showCharts ? 'Hide Charts' : 'Show Charts';
        }
        
        const chartsContainer = document.querySelector('.tw-charts-container');
        if (chartsContainer) {
            chartsContainer.remove();
        }
        
        if (this.showCharts && this.isStatVisible) {
            const statsContainer = document.querySelector('.tw-exchange-stats-container');
            if (statsContainer) {
                statsContainer.appendChild(this.createChartsContainer());
                this.initializeCharts();
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
            button.title = this.hideDuplicates ? 'Show all rows including duplicates' : 'Hide rows with no changes from previous record';
            
            if (this.hideDuplicates) {
                button.style.background = 'linear-gradient(to bottom, #2196F3, #1976D2)';
            } else {
                button.style.background = 'linear-gradient(to bottom, #f44336, #d32f2f)';
            }
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
            
            // Add charts if enabled
            if (this.showCharts) {
                const existingCharts = container.querySelector('.tw-charts-container');
                if (!existingCharts) {
                    container.appendChild(this.createChartsContainer());
                    this.initializeCharts();
                }
            }
            
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
            
            // Clean up charts
            Object.values(this.charts).forEach(chart => {
                if (chart) chart.destroy();
            });
            this.charts = {};
            
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
