(function() {
    'use strict';

    // Debug function
    function debugLog(message) {
        console.log('[TW Exchange Tracker]', message);
    }

    // Main class
    class ExchangeTracker {
        constructor() {
            this.storageKey = 'tw_exchange_data_v2';
            this.settingsKey = 'tw_exchange_settings_v2';
            this.updateInterval = 10000; // 10 seconds default
            this.collectionInterval = null;
            this.isStatOpen = false;
            this.data = [];
            this.resourceTypes = ['wood', 'stone', 'iron'];
            this.resourceNames = {
                'wood': 'Wood',
                'stone': 'Clay',
                'iron': 'Iron'
            };
            
            this.init();
        }

        init() {
            debugLog('Initializing Exchange Tracker...');
            
            // Add styles first
            this.addStyles();
            
            // Load settings
            this.loadSettings();
            debugLog('Loaded settings, interval: ' + (this.updateInterval / 1000) + 's');
            
            // Try to add button immediately
            this.tryAddButton();
            
            // Start collection
            this.startCollection();
            
            // Listen for DOM changes
            this.setupMutationObserver();
            
            // Bind events
            this.bindEvents();
            
            debugLog('Exchange Tracker initialized');
        }

        loadSettings() {
            try {
                const settings = JSON.parse(localStorage.getItem(this.settingsKey) || '{}');
                this.updateInterval = settings.updateInterval || 10000;
                debugLog('Settings loaded: ' + JSON.stringify(settings));
            } catch (e) {
                debugLog('Error loading settings: ' + e.message);
                this.updateInterval = 10000;
            }
        }

        saveSettings() {
            const settings = {
                updateInterval: this.updateInterval,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(this.settingsKey, JSON.stringify(settings));
            debugLog('Settings saved');
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
                    font-size: 12px;
                }
                
                .tw-exchange-stat-table th,
                .tw-exchange-stat-table td {
                    border: 1px solid #ddd;
                    padding: 4px 6px;
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
                
                .tw-exchange-stat-wood {
                    border-left: 2px solid #8B4513;
                }
                
                .tw-exchange-stat-stone {
                    border-left: 2px solid #708090;
                }
                
                .tw-exchange-stat-iron {
                    border-left: 2px solid #C0C0C0;
                }
            `;
            document.head.appendChild(style);
            debugLog('Styles added');
        }

        tryAddButton() {
            // Look for the submit button in various possible locations
            const selectors = [
                'input[type="submit"].btn-premium-exchange-buy',
                'input[type="submit"][value*="Найти наилучшее предложение"]',
                'input[type="submit"][value*="наилучшее"]',
                '#premium_exchange_form input[type="submit"]',
                'form input[type="submit"].btn'
            ];
            
            let submitBtn = null;
            
            for (const selector of selectors) {
                submitBtn = document.querySelector(selector);
                if (submitBtn) {
                    debugLog('Found submit button with selector: ' + selector);
                    break;
                }
            }
            
            if (submitBtn && submitBtn.parentNode) {
                debugLog('Adding STAT button...');
                this.addButtonToElement(submitBtn);
                return true;
            } else {
                debugLog('Submit button not found yet');
                return false;
            }
        }

        addButtonToElement(submitBtn) {
            // Check if button already exists
            if (document.querySelector('.tw-exchange-stat-btn')) {
                debugLog('STAT button already exists');
                return;
            }
            
            const statBtn = document.createElement('button');
            statBtn.type = 'button';
            statBtn.className = 'tw-exchange-stat-btn';
            statBtn.textContent = 'STAT';
            statBtn.title = 'Show exchange statistics';
            statBtn.addEventListener('click', () => {
                debugLog('STAT button clicked');
                this.toggleStatWindow();
            });
            
            // Try to insert before the submit button
            try {
                submitBtn.parentNode.insertBefore(statBtn, submitBtn);
                debugLog('STAT button added successfully');
                
                // Add some styling to the parent to ensure proper display
                if (submitBtn.parentNode.style.display === 'inline-block') {
                    submitBtn.parentNode.style.display = 'flex';
                    submitBtn.parentNode.style.alignItems = 'center';
                }
            } catch (e) {
                debugLog('Error adding STAT button: ' + e.message);
                // Fallback: add to body
                statBtn.style.position = 'fixed';
                statBtn.style.top = '10px';
                statBtn.style.right = '10px';
                statBtn.style.zIndex = '9998';
                document.body.appendChild(statBtn);
                debugLog('STAT button added to body as fallback');
            }
        }

        setupMutationObserver() {
            // Watch for DOM changes to add button if form loads later
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length > 0) {
                        // Check if our button exists
                        if (!document.querySelector('.tw-exchange-stat-btn')) {
                            debugLog('DOM changed, trying to add button again...');
                            setTimeout(() => {
                                this.tryAddButton();
                            }, 500);
                        }
                    }
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            debugLog('Mutation observer started');
        }

        getExchangeData() {
            const data = {
                timestamp: new Date().toLocaleTimeString(),
                date: new Date().toISOString(),
                resources: {}
            };

            let foundData = false;
            
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
                
                if (amount > 0 || capacity > 0 || cost > 0) {
                    foundData = true;
                }
                
                data.resources[resource] = {
                    amount: amount,
                    capacity: capacity,
                    cost: cost
                };
            });
            
            if (foundData) {
                debugLog('Exchange data collected: ' + JSON.stringify(data.resources));
            } else {
                debugLog('No exchange data found in DOM');
            }
            
            return data;
        }

        saveData() {
            const currentData = this.getExchangeData();
            
            // Only save if we have valid data
            const hasValidData = Object.values(currentData.resources).some(res => 
                res.amount > 0 || res.capacity > 0 || res.cost > 0
            );
            
            if (hasValidData) {
                this.data.unshift(currentData);
                
                // Keep only last 500 records to prevent excessive storage
                if (this.data.length > 500) {
                    this.data = this.data.slice(0, 500);
                }
                
                try {
                    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
                    debugLog('Data saved to localStorage, total records: ' + this.data.length);
                } catch (e) {
                    debugLog('Error saving to localStorage: ' + e.message);
                    // Try to clear old data if storage is full
                    if (e.name === 'QuotaExceededError') {
                        this.data = this.data.slice(0, 100);
                        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
                        debugLog('Cleared old data, kept 100 records');
                    }
                }
            }
        }

        loadData() {
            try {
                const saved = localStorage.getItem(this.storageKey);
                this.data = saved ? JSON.parse(saved) : [];
                debugLog('Data loaded from localStorage, records: ' + this.data.length);
            } catch (e) {
                debugLog('Error loading data: ' + e.message);
                this.data = [];
            }
        }

        startCollection() {
            this.loadData();
            
            if (this.collectionInterval) {
                clearInterval(this.collectionInterval);
            }
            
            // Initial save
            setTimeout(() => {
                this.saveData();
            }, 2000);
            
            // Periodic save
            this.collectionInterval = setInterval(() => {
                this.saveData();
            }, this.updateInterval);
            
            debugLog('Data collection started, interval: ' + (this.updateInterval / 1000) + 's');
        }

        updateCollectionInterval(newInterval) {
            this.updateInterval = newInterval * 1000;
            this.saveSettings();
            this.startCollection();
            debugLog('Update interval changed to: ' + newInterval + 's');
        }

        createStatWindow() {
            const overlay = document.createElement('div');
            overlay.className = 'tw-exchange-stat-overlay';
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeStatWindow();
                }
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
                if (confirm('Are you sure you want to clear all saved data? This cannot be undone.')) {
                    localStorage.removeItem(this.storageKey);
                    this.data = [];
                    this.updateStatTable();
                    debugLog('All data cleared');
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
            
            // Status
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
                resourceHeader.colSpan = 3;
                resourceHeader.className = `tw-exchange-stat-resource-header tw-exchange-stat-${resource}`;
                headerRow1.appendChild(resourceHeader);
            });
            
            thead.appendChild(headerRow1);
            
            // Second header row
            const headerRow2 = document.createElement('tr');
            
            this.resourceTypes.forEach(resource => {
                const subHeaders = ['Amount', 'Capacity', 'Cost'];
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
                emptyCell.colSpan = 10;
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
                    
                    // Add percentage indicator if capacity > 0
                    if (resData.capacity > 0) {
                        const percentage = Math.round((resData.amount / resData.capacity) * 100);
                        capacityCell.title = `${percentage}% full`;
                        
                        // Color coding based on fill percentage
                        if (percentage >= 90) {
                            capacityCell.style.backgroundColor = '#FFEBEE';
                        } else if (percentage >= 75) {
                            capacityCell.style.backgroundColor = '#FFF3E0';
                        } else if (percentage >= 50) {
                            capacityCell.style.backgroundColor = '#E8F5E9';
                        }
                    }
                    
                    row.appendChild(capacityCell);
                    
                    // Cost cell
                    const costCell = document.createElement('td');
                    costCell.className = 'tw-exchange-stat-cost';
                    costCell.textContent = resData.cost;
                    row.appendChild(costCell);
                });
                
                tbody.appendChild(row);
            });
            
            // Update status
            const status = document.querySelector('#tw-exchange-status');
            if (status) {
                status.textContent = `Showing ${this.data.length} records | Last update: ${new Date().toLocaleTimeString()}`;
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
            
            debugLog('Opening statistics window');
            this.loadData();
            const statWindow = this.createStatWindow();
            document.body.appendChild(statWindow);
            this.isStatOpen = true;
            
            // Auto-refresh table when window is open
            this.statRefreshInterval = setInterval(() => {
                this.updateStatTable();
            }, 3000);
            
            debugLog('Statistics window opened');
        }

        closeStatWindow() {
            debugLog('Closing statistics window');
            const overlay = document.querySelector('.tw-exchange-stat-overlay');
            if (overlay) {
                overlay.remove();
            }
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
                if (tbody) {
                    this.updateTableBody(tbody);
                }
            }
        }

        bindEvents() {
            // Save data when page is about to be unloaded
            window.addEventListener('beforeunload', () => {
                this.saveData();
            });
            
            // Listen for manual form submissions
            const form = document.getElementById('premium_exchange_form');
            if (form) {
                form.addEventListener('submit', () => {
                    setTimeout(() => {
                        this.saveData();
                        if (this.isStatOpen) {
                            this.updateStatTable();
                        }
                    }, 1500);
                });
            }
            
            // Keyboard shortcut for stats window (Ctrl+Shift+S)
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                    e.preventDefault();
                    this.toggleStatWindow();
                }
            });
        }
    }

    // Initialize the tracker
    function initTracker() {
        debugLog('Page loaded, starting tracker initialization...');
        
        // Check if we're on the right page
        if (!window.location.href.includes('mode=exchange')) {
            debugLog('Not on exchange page, skipping initialization');
            return;
        }
        
        // Wait a bit for DOM to be ready
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

    // Start initialization
    initTracker();
    
    // Also try after a longer delay in case page loads slowly
    setTimeout(() => {
        if (!window.twExchangeTracker) {
            debugLog('Retrying initialization after delay...');
            initTracker();
        }
    }, 5000);

})();
