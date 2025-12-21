class ExchangeTracker {
    constructor() {
        this.storageKey = 'tw_exchange_data_v3';
        this.settingsKey = 'tw_exchange_settings_v3';
        this.updateInterval = 10000;
        this.collectionInterval = null;
        this.isStatOpen = false;
        this.data = [];
        this.resourceTypes = ['wood', 'stone', 'iron'];
        this.resourceNames = {
            'wood': 'Wood',
            'stone': 'Clay',
            'iron': 'Iron'
        };
        this.minMaxCache = {}; // Cache for min/max values per resource
        
        this.init();
    }

    init() {
        console.log('[TW Exchange Tracker] Initializing...');
        this.addStyles();
        this.loadSettings();
        this.tryAddButton();
        this.startCollection();
        this.setupMutationObserver();
        this.bindEvents();
        console.log('[TW Exchange Tracker] Initialized');
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem(this.settingsKey) || '{}');
            this.updateInterval = settings.updateInterval || 10000;
        } catch (e) {
            this.updateInterval = 10000;
        }
    }

    saveSettings() {
        const settings = {
            updateInterval: this.updateInterval,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    }

    addStyles() {
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
            
            .tw-exchange-stat-container {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border: 2px solid #4CAF50;
                border-radius: 8px;
                padding: 20px;
                z-index: 10000;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                min-width: 300px;
                max-width: 95vw;
                max-height: 80vh;
                overflow: auto;
            }
            
            .tw-exchange-stat-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 9999;
            }
            
            .tw-exchange-stat-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
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
            
            .tw-exchange-stat-close {
                position: absolute;
                top: 10px;
                right: 10px;
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
            
            .tw-exchange-stat-close:hover {
                background: #d32f2f;
            }
            
            .tw-exchange-stat-timestamp {
                white-space: nowrap;
                font-family: monospace;
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
            
            /* Styles for cost elements on main page */
            .tw-cost-indicator {
                display: inline-block;
                margin-left: 5px;
                font-size: 10px;
                font-weight: bold;
                padding: 1px 4px;
                border-radius: 3px;
            }
            
            .tw-cost-diff {
                display: inline-block;
                margin-left: 5px;
                font-size: 10px;
                font-weight: bold;
            }
            
            .tw-cost-diff.positive {
                color: #4CAF50;
            }
            
            .tw-cost-diff.negative {
                color: #f44336;
            }
            
            .tw-cost-diff.neutral {
                color: #666;
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
        statBtn.title = 'Show exchange statistics';
        statBtn.addEventListener('click', () => this.toggleStatWindow());
        
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
            // Update indicators on DOM changes
            this.updateCostIndicators();
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }

    getExchangeData() {
        const data = {
            timestamp: new Date().toLocaleTimeString(),
            date: new Date().toISOString(),
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
                diff: 0, // Will be calculated when saving
                tag: ''  // Will be calculated when saving
            };
        });
        
        return data;
    }

    calculateMinMaxValues() {
        // Calculate min and max costs for each resource
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

    calculateTag(currentCost, previousCost, minCost, maxCost) {
        if (currentCost === 0 || previousCost === 0) return '';
        
        const diff = currentCost - previousCost;
        
        // Check for min/max
        if (currentCost === minCost) return 'min';
        if (currentCost === maxCost) return 'max';
        
        // Check for proximity to min/max
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

    saveData() {
        const currentData = this.getExchangeData();
        
        // Calculate diff and tag for each resource
        if (this.data.length > 0) {
            const previousData = this.data[0]; // Get most recent record
            
            this.resourceTypes.forEach(resource => {
                const prevCost = previousData.resources[resource].cost;
                const currentCost = currentData.resources[resource].cost;
                
                // Calculate diff
                currentData.resources[resource].diff = prevCost > 0 ? currentCost - prevCost : 0;
            });
        }
        
        // Add to data array
        this.data.unshift(currentData);
        
        // Keep only last 500 records
        if (this.data.length > 500) {
            this.data = this.data.slice(0, 500);
        }
        
        // Recalculate min/max after adding new data
        this.calculateMinMaxValues();
        
        // Calculate tags based on updated min/max
        currentData.resources = Object.fromEntries(
            Object.entries(currentData.resources).map(([resource, values]) => {
                const cache = this.minMaxCache[resource] || { min: 0, max: 0 };
                const prevCost = this.data.length > 1 ? this.data[1].resources[resource].cost : values.cost;
                
                return [resource, {
                    ...values,
                    tag: this.calculateTag(values.cost, prevCost, cache.min, cache.max)
                }];
            })
        );
        
        // Update the first record with tags
        this.data[0] = currentData;
        
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            console.log('[TW Exchange Tracker] Data saved, records:', this.data.length);
            
            // Update indicators on main page
            this.updateCostIndicators();
        } catch (e) {
            console.error('[TW Exchange Tracker] Error saving:', e);
            if (e.name === 'QuotaExceededError') {
                this.data = this.data.slice(0, 100);
                localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            }
        }
    }

    updateCostIndicators() {
        if (this.data.length < 2) return;
        
        const currentData = this.data[0];
        const previousData = this.data[1];
        
        this.resourceTypes.forEach(resource => {
            const rateElem = document.getElementById(`premium_exchange_rate_${resource}`);
            if (!rateElem) return;
            
            const currentCost = currentData.resources[resource].cost;
            const prevCost = previousData.resources[resource].cost;
            const diff = currentCost - prevCost;
            const tag = currentData.resources[resource].tag;
            
            // Remove existing indicators
            const existingDiff = rateElem.querySelector('.tw-cost-diff');
            const existingTag = rateElem.querySelector('.tw-cost-indicator');
            if (existingDiff) existingDiff.remove();
            if (existingTag) existingTag.remove();
            
            // Add diff indicator
            if (diff !== 0 && prevCost > 0) {
                const diffElem = document.createElement('span');
                diffElem.className = `tw-cost-diff ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral'}`;
                diffElem.textContent = `${diff > 0 ? '+' : ''}${diff}`;
                diffElem.title = `Change from previous: ${prevCost} → ${currentCost}`;
                rateElem.appendChild(diffElem);
            }
            
            // Add tag indicator
            if (tag) {
                const tagElem = document.createElement('span');
                tagElem.className = `tw-cost-indicator tw-exchange-stat-tag ${tag}`;
                tagElem.textContent = tag;
                
                // Set tooltip based on tag type
                if (tag.includes('min')) {
                    tagElem.title = `Close to minimum value (${this.minMaxCache[resource]?.min || '?'})`;
                } else if (tag.includes('max')) {
                    tagElem.title = `Close to maximum value (${this.minMaxCache[resource]?.max || '?'})`;
                }
                
                rateElem.appendChild(tagElem);
            }
        });
    }

    loadData() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            this.data = saved ? JSON.parse(saved) : [];
            this.calculateMinMaxValues();
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
        
        // Initial save and indicator update
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

    createStatWindow() {
        const overlay = document.createElement('div');
        overlay.className = 'tw-exchange-stat-overlay';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeStatWindow();
        });
        
        const container = document.createElement('div');
        container.className = 'tw-exchange-stat-container';
        container.addEventListener('click', (e) => e.stopPropagation());
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'tw-exchange-stat-close';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => this.closeStatWindow());
        
        // Title
        const title = document.createElement('h2');
        title.textContent = 'Premium Exchange Statistics';
        title.style.margin = '0 0 15px 0';
        title.style.color = '#2E7D32';
        title.style.fontSize = '18px';
        
        // Controls
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
        updateInput.addEventListener('change', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= 3600) {
                this.updateCollectionInterval(value);
                e.target.value = value;
            } else {
                e.target.value = this.updateInterval / 1000;
            }
        });
        
        const secLabel = document.createElement('label');
        secLabel.textContent = 'seconds';
        secLabel.style.color = '#666';
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear All Data';
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear all saved data?')) {
                localStorage.removeItem(this.storageKey);
                this.data = [];
                this.calculateMinMaxValues();
                this.updateStatTable();
                this.updateCostIndicators();
            }
        });
        
        controls.appendChild(updateLabel);
        controls.appendChild(updateInput);
        controls.appendChild(secLabel);
        controls.appendChild(clearBtn);
        
        // Table container
        const tableContainer = document.createElement('div');
        tableContainer.style.overflowX = 'auto';
        tableContainer.style.maxHeight = '60vh';
        
        // Create table
        const table = this.createStatTable();
        tableContainer.appendChild(table);
        
        // Status with min/max info
        const status = document.createElement('div');
        status.style.marginTop = '10px';
        status.style.fontSize = '11px';
        status.style.color = '#666';
        status.style.textAlign = 'center';
        status.id = 'tw-exchange-status';
        
        // Assemble container
        container.appendChild(closeBtn);
        container.appendChild(title);
        container.appendChild(controls);
        container.appendChild(tableContainer);
        container.appendChild(status);
        
        // Assemble overlay
        overlay.appendChild(container);
        
        return overlay;
    }

    createStatTable() {
        const table = document.createElement('table');
        table.className = 'tw-exchange-stat-table';
        
        // Create two-level header
        const thead = document.createElement('thead');
        
        // First header row
        const headerRow1 = document.createElement('tr');
        headerRow1.className = 'tw-exchange-stat-header';
        
        const timeHeader = document.createElement('th');
        timeHeader.textContent = 'Time';
        timeHeader.rowSpan = 2;
        timeHeader.style.minWidth = '70px';
        headerRow1.appendChild(timeHeader);
        
        this.resourceTypes.forEach(resource => {
            const resourceHeader = document.createElement('th');
            resourceHeader.textContent = this.resourceNames[resource];
            resourceHeader.colSpan = 5; // Amount, Capacity, Cost, Diff, Tag
            resourceHeader.className = `tw-exchange-stat-resource-header tw-exchange-stat-${resource}`;
            headerRow1.appendChild(resourceHeader);
        });
        
        thead.appendChild(headerRow1);
        
        // Second header row
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
        
        // Table body
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
            emptyCell.colSpan = 16; // 1 time + (5 columns * 3 resources)
            emptyCell.textContent = 'No data collected yet. Data is saved every ' + (this.updateInterval / 1000) + ' seconds.';
            emptyCell.style.textAlign = 'center';
            emptyCell.style.padding = '20px';
            emptyCell.style.color = '#999';
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
            return;
        }
        
        this.data.forEach((record, index) => {
            const row = document.createElement('tr');
            
            // Time cell
            const timeCell = document.createElement('td');
            timeCell.className = 'tw-exchange-stat-timestamp';
            timeCell.textContent = record.timestamp;
            timeCell.title = new Date(record.date).toLocaleString();
            row.appendChild(timeCell);
            
            // Resource cells
            this.resourceTypes.forEach(resource => {
                const resData = record.resources[resource];
                
                // Amount cell
                const amountCell = document.createElement('td');
                amountCell.className = 'tw-exchange-stat-amount';
                amountCell.textContent = resData.amount.toLocaleString();
                row.appendChild(amountCell);
                
                // Capacity cell
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
                
                // Cost cell
                const costCell = document.createElement('td');
                costCell.className = 'tw-exchange-stat-cost';
                costCell.textContent = resData.cost;
                row.appendChild(costCell);
                
                // Diff cell
                const diffCell = document.createElement('td');
                diffCell.className = `tw-exchange-stat-diff ${resData.diff > 0 ? 'positive' : resData.diff < 0 ? 'negative' : 'neutral'}`;
                
                if (index === 0) {
                    // For current record, show diff with previous
                    diffCell.textContent = resData.diff > 0 ? `+${resData.diff}` : resData.diff;
                    diffCell.title = `Change from previous record`;
                } else if (index < this.data.length - 1) {
                    // For historical records, calculate diff with next record (chronological order)
                    const nextData = this.data[index + 1];
                    const nextCost = nextData.resources[resource].cost;
                    const historicalDiff = resData.cost - nextCost;
                    diffCell.textContent = historicalDiff > 0 ? `+${historicalDiff}` : historicalDiff;
                    diffCell.title = `Change from ${nextData.timestamp}`;
                } else {
                    // Oldest record
                    diffCell.textContent = '—';
                    diffCell.className = 'tw-exchange-stat-diff neutral';
                }
                
                row.appendChild(diffCell);
                
                // Tag cell
                const tagCell = document.createElement('td');
                if (resData.tag) {
                    tagCell.textContent = resData.tag;
                    tagCell.className = `tw-exchange-stat-tag ${resData.tag}`;
                    
                    // Add tooltip
                    const cache = this.minMaxCache[resource] || { min: 0, max: 0 };
                    if (resData.tag.includes('min')) {
                        tagCell.title = `Minimum: ${cache.min}`;
                    } else if (resData.tag.includes('max')) {
                        tagCell.title = `Maximum: ${cache.max}`;
                    }
                }
                row.appendChild(tagCell);
            });
            
            tbody.appendChild(row);
        });
        
        // Update status with min/max info
        const status = document.querySelector('#tw-exchange-status');
        if (status) {
            let statusText = `Showing ${this.data.length} records | `;
            this.resourceTypes.forEach((resource, idx) => {
                const cache = this.minMaxCache[resource] || { min: 0, max: 0 };
                statusText += `${this.resourceNames[resource]}: ${cache.min}-${cache.max}`;
                if (idx < this.resourceTypes.length - 1) statusText += ' | ';
            });
            status.textContent = statusText;
        }
    }

    toggleStatWindow() {
        if (this.isStatOpen) {
            this.closeStatWindow();
        } else {
            this.openStatWindow();
        }
    }

    openStatWindow() {
        if (this.isStatOpen) return;
        
        this.loadData();
        const statWindow = this.createStatWindow();
        document.body.appendChild(statWindow);
        this.isStatOpen = true;
        
        this.statRefreshInterval = setInterval(() => {
            this.updateStatTable();
        }, 3000);
    }

    closeStatWindow() {
        const overlay = document.querySelector('.tw-exchange-stat-overlay');
        if (overlay) overlay.remove();
        this.isStatOpen = false;
        
        if (this.statRefreshInterval) {
            clearInterval(this.statRefreshInterval);
            this.statRefreshInterval = null;
        }
    }

    updateStatTable() {
        const existingTable = document.querySelector('.tw-exchange-stat-table');
        if (existingTable && this.isStatOpen) {
            const tbody = existingTable.querySelector('tbody');
            if (tbody) this.updateTableBody(tbody);
        }
    }

    bindEvents() {
        window.addEventListener('beforeunload', () => this.saveData());
        
        const form = document.getElementById('premium_exchange_form');
        if (form) {
            form.addEventListener('submit', () => {
                setTimeout(() => {
                    this.saveData();
                    if (this.isStatOpen) this.updateStatTable();
                }, 1500);
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.toggleStatWindow();
            }
        });
    }
}

// Initialize
function initTracker() {
    if (!window.location.href.includes('mode=exchange')) return;
    
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

// Start
initTracker();
setTimeout(() => {
    if (!window.twExchangeTracker) initTracker();
}, 5000);
