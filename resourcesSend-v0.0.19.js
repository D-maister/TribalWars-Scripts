(function() {
    // Check if already injected
    if (document.getElementById('twResourcesMonitor')) {
        console.log('Resources monitor already injected');
        return;
    }
    
    // Create the monitor element
    const monitorHTML = `
    <div id="twResourcesMonitor">
        <!-- Header with close button -->
        <div id="twResourcesHeader">
            <div id="twResourcesTitle">📊 Village Resources Monitor</div>
            <button id="twResourcesClose">×</button>
        </div>
        
        <!-- Settings panel -->
        <div id="twResourcesSettings">
            <div class="tw-settings-row">
                <div class="tw-settings-group">
                    <span class="tw-settings-label">Target Ratios:</span>
                    <input type="number" id="twTargetWood" class="tw-settings-input" placeholder="Wood %" min="0" max="100">
                    <span>/</span>
                    <input type="number" id="twTargetClay" class="tw-settings-input" placeholder="Clay %" min="0" max="100">
                    <span>/</span>
                    <input type="number" id="twTargetIron" class="tw-settings-input" placeholder="Iron %" min="0" max="100">
                    <button id="twSaveRatios" class="tw-settings-btn">Save</button>
                </div>
                <div class="tw-settings-group">
                    <span class="tw-settings-label">Speed:</span>
                    <input type="number" id="twSpeedPerCell" class="tw-settings-input tw-speed-input" placeholder="min/cell" min="1" max="60" step="0.1">
                    <span style="font-size: 10px;">min/cell</span>
                    <button id="twSaveSpeed" class="tw-settings-btn">Save</button>
                </div>
            </div>
            <div class="tw-settings-info">
                <span>Current: <span id="twCurrentRatios">0/0/0</span>% | Speed: <span id="twCurrentSpeed">3</span> min/cell</span>
            </div>
        </div>
        
        <!-- Content area with table -->
        <div id="twResourcesContent">
            <table id="twResourcesTable">
                <thead>
                    <tr>
                        <th>Village</th>
                        <th>Coords</th>
                        <th>Dist</th>
                        <th>Time</th>
                        <th>Wood</th>
                        <th>%</th>
                        <th>Clay</th>
                        <th>%</th>
                        <th>Iron</th>
                        <th>%</th>
                        <th>Storage</th>
                        <th>Merchants</th>
                        <th>Available</th>
                        <th>Max Transport</th>
                    </tr>
                </thead>
                <tbody id="twResourcesBody">
                    <!-- Data will be populated here -->
                </tbody>
            </table>
        </div>
        
        <!-- Controls -->
        <div id="twResourcesControls">
            <button id="twRefreshBtn">🔄 Load Resources</button>
            <label id="twAutoRefresh">
                <input type="checkbox" id="twAutoRefreshCheckbox"> Auto (60s)
            </label>
        </div>
    </div>
    `;
    
    // Append to body
    const container = document.createElement('div');
    container.innerHTML = monitorHTML;
    document.body.appendChild(container.firstElementChild);
    
    console.log('Resources monitor injected into page');
    
    // Settings from localStorage
    const defaultSettings = {
        targetWood: 33,
        targetClay: 34,
        targetIron: 33,
        speedPerCell: 3 // minutes per cell
    };
    
    // Warehouse capacities cache
    let warehouseCache = {};
    // Merchants cache
    let merchantsCache = {};
    
    // Load settings from localStorage
    function loadSettings() {
        const settings = { ...defaultSettings };
        
        try {
            const savedSettings = localStorage.getItem('twResourcesSettings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                Object.assign(settings, parsed);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
        
        return settings;
    }
    
    // Load warehouse cache from localStorage
    function loadWarehouseCache() {
        try {
            const cached = localStorage.getItem('twWarehouseCache');
            if (cached) {
                warehouseCache = JSON.parse(cached);
                console.log('Warehouse cache loaded:', warehouseCache);
            }
        } catch (error) {
            console.error('Error loading warehouse cache:', error);
        }
    }
    
    // Load merchants cache from localStorage
    function loadMerchantsCache() {
        try {
            const cached = localStorage.getItem('twMerchantsCache');
            if (cached) {
                merchantsCache = JSON.parse(cached);
                console.log('Merchants cache loaded:', merchantsCache);
            }
        } catch (error) {
            console.error('Error loading merchants cache:', error);
        }
    }
    
    // Save warehouse cache to localStorage
    function saveWarehouseCache() {
        try {
            localStorage.setItem('twWarehouseCache', JSON.stringify(warehouseCache));
        } catch (error) {
            console.error('Error saving warehouse cache:', error);
        }
    }
    
    // Save merchants cache to localStorage
    function saveMerchantsCache() {
        try {
            localStorage.setItem('twMerchantsCache', JSON.stringify(merchantsCache));
        } catch (error) {
            console.error('Error saving merchants cache:', error);
        }
    }
    
    // Save settings to localStorage
    function saveSettings(settings) {
        try {
            localStorage.setItem('twResourcesSettings', JSON.stringify(settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
    
    // Get merchants data from market status bar
    function getMerchantsData() {
        try {
            const marketBar = document.getElementById('market_status_bar');
            if (marketBar) {
                const availableSpan = document.getElementById('market_merchant_available_count');
                const totalSpan = document.getElementById('market_merchant_total_count');
                const maxTransportSpan = document.getElementById('market_merchant_max_transport');
                
                if (availableSpan && totalSpan && maxTransportSpan) {
                    const available = parseInt(availableSpan.textContent) || 0;
                    const total = parseInt(totalSpan.textContent) || 0;
                    const maxTransport = parseInt(maxTransportSpan.textContent) || 0;
                    
                    return {
                        available: available,
                        total: total,
                        maxTransport: maxTransport,
                        used: total - available
                    };
                }
            }
            return null;
        } catch (error) {
            console.error('Error getting merchants data:', error);
            return null;
        }
    }
    
    // Utility functions
    function formatNumber(numStr) {
        if (!numStr) return 0;
        // Handle both string numbers and already formatted numbers
        if (typeof numStr === 'number') return numStr;
        return parseInt(numStr.replace(/\./g, ''));
    }

    function displayNumber(num) {
        if (num === null || num === undefined || num === '?' || isNaN(num)) {
            return '?';
        }
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    
    function calculatePercentage(part, total) {
        if (total === 0) return 0;
        return Math.round((part / total) * 100);
    }
    
    // Calculate distance between two coordinates
    function calculateDistance(coord1, coord2) {
        const [x1, y1] = coord1.split('|').map(Number);
        const [x2, y2] = coord2.split('|').map(Number);
        
        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
            return 0;
        }
        
        const distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        return Math.round(distance * 100) / 100; // Round to 2 decimal places
    }
    
    // Format time as hours:minutes
    function formatTime(minutes) {
        if (minutes < 60) {
            return `${Math.round(minutes)}m`;
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = Math.round(minutes % 60);
            return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
        }
    }

    // Get current village coordinates from the menu row
    function getCurrentVillageCoords() {
        try {
            // Try to get coordinates from menu_row2
            const menuRow2 = document.getElementById('menu_row2');
            if (menuRow2) {
                const coordsElement = menuRow2.querySelector('b.nowrap');
                if (coordsElement) {
                    const text = coordsElement.textContent || '';
                    const match = text.match(/\((\d+)\|(\d+)\)/);
                    if (match) {
                        return `${match[1]}|${match[2]}`;
                    }
                }
            }
            
            // Fallback: try to get from village list dropdown
            const villageSelect = document.getElementById('village_list');
            if (villageSelect && villageSelect.options) {
                const selectedOption = Array.from(villageSelect.options).find(opt => opt.selected);
                if (selectedOption) {
                    const match = selectedOption.text.match(/(\d+)\s*\|\s*(\d+)/);
                    if (match) {
                        return `${match[1]}|${match[2]}`;
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error getting current village coordinates:', error);
            return null;
        }
    }

    // Get current village resources from the header
    function getCurrentVillageResources() {
        try {
            const currentCoords = getCurrentVillageCoords();
            let currentVillageName = 'Current Village';
            
            // Get village name from menu_row2
            const menuRow2 = document.getElementById('menu_row2');
            if (menuRow2) {
                const villageLink = menuRow2.querySelector('a[href*="screen=overview"]');
                if (villageLink) {
                    currentVillageName = villageLink.textContent.trim();
                }
            }
            
            const woodElement = document.getElementById('wood');
            const clayElement = document.getElementById('stone');
            const ironElement = document.getElementById('iron');
            const storageElement = document.getElementById('storage');
            
            const currentVillage = {
                name: currentVillageName,
                coords: currentCoords || 'Current',
                wood: woodElement?.textContent || '0',
                clay: clayElement?.textContent || '0',
                iron: ironElement?.textContent || '0',
                warehouse: storageElement?.textContent || '0'
            };
            
            // Save current village warehouse capacity to cache (only if we have actual data)
            if (currentCoords && currentVillage.warehouse !== '0') {
                const warehouseNum = formatNumber(currentVillage.warehouse);
                // Only update cache if we have a valid number
                if (warehouseNum > 0) {
                    warehouseCache[currentCoords] = warehouseNum;
                    saveWarehouseCache();
                }
            }
            
            // ALWAYS save current village merchants to cache
            let merchantsData = null;
            if (currentCoords) {
                merchantsData = getMerchantsData();
                if (merchantsData) {
                    merchantsCache[currentCoords] = {
                        available: merchantsData.available || 0,
                        total: merchantsData.total || 0,
                        maxTransport: merchantsData.maxTransport || 0,
                        used: merchantsData.used || 0
                    };
                    saveMerchantsCache();
                    console.log(`Saved/updated merchants for ${currentCoords}:`, merchantsCache[currentCoords]);
                    
                    // ALSO attach merchants data to the current village object
                    currentVillage.merchants = {
                        available: merchantsData.available || '?',
                        total: merchantsData.total || '?',
                        maxTransport: merchantsData.maxTransport || '?',
                        used: merchantsData.used || '?'
                    };
                } else if (merchantsCache[currentCoords]) {
                    // Use cached data if fresh data not available
                    currentVillage.merchants = {
                        available: merchantsCache[currentCoords].available || '?',
                        total: merchantsCache[currentCoords].total || '?',
                        maxTransport: merchantsCache[currentCoords].maxTransport || '?',
                        used: merchantsCache[currentCoords].used || '?'
                    };
                } else {
                    currentVillage.merchants = {
                        available: '?',
                        total: '?',
                        maxTransport: '?',
                        used: '?'
                    };
                }
            } else {
                currentVillage.merchants = {
                    available: '?',
                    total: '?',
                    maxTransport: '?',
                    used: '?'
                };
            }
            
            return currentVillage;
        } catch (error) {
            console.error('Error getting current village:', error);
            return null;
        }
    }

    // Helper function to extract warehouse text from table cell
    function extractWarehouseText(warehouseTd) {
        if (!warehouseTd) return '';
        
        // Try multiple approaches to get the warehouse value
        let warehouseText = '';
        
        // Approach 1: Direct text content (simplest)
        let fullText = warehouseTd.textContent || '';
        fullText = fullText.trim();
        
        // Remove common non-numeric characters but keep dots/numbers
        warehouseText = fullText.replace(/[^\d.]/g, '');
        
        // Approach 2: If first approach fails, try to get text after the icon
        if (!warehouseText || warehouseText.length < 2) {
            const warehouseSpan = warehouseTd.querySelector('.icon.header.ressources');
            if (warehouseSpan && warehouseSpan.nextSibling) {
                // Get all sibling text nodes
                let sibling = warehouseSpan.nextSibling;
                while (sibling) {
                    if (sibling.nodeType === Node.TEXT_NODE) {
                        warehouseText += sibling.textContent;
                    }
                    sibling = sibling.nextSibling;
                }
                warehouseText = warehouseText.replace(/[^\d.]/g, '');
            }
        }
        
        return warehouseText;
    }

    // Parse resources from Tribal Wars page by simulating clicks
    function parseResourcesFromPage() {
        return new Promise((resolve) => {
            try {
                const villages = [];
                
                // First get current village resources
                const currentVillage = getCurrentVillageResources();
                if (currentVillage) {
                    villages.push(currentVillage);
                }
                
                // Find and click the second 'a' element in div.target-select-links
                const targetSelectLinks = document.querySelector('div.target-select-links');
                if (!targetSelectLinks) {
                    console.log('Target select links not found, using only current village');
                    resolve(villages);
                    return;
                }
                
                const links = targetSelectLinks.querySelectorAll('a');
                if (links.length < 2) {
                    console.log('Not enough links found, using only current village');
                    resolve(villages);
                    return;
                }
                
                // Store original display style
                const villageTargetsDiv = document.getElementById('village_targets');
                let originalDisplay = '';
                if (villageTargetsDiv) {
                    originalDisplay = villageTargetsDiv.style.display || '';
                }
                
                // Hide the popup before clicking
                if (villageTargetsDiv) {
                    villageTargetsDiv.style.display = 'none';
                }
                
                // Click the second link to open village targets popup
                links[1].click();
                
                // Wait for popup to load and parse data
                setTimeout(() => {
                    try {
                        // Show the popup temporarily to get data
                        if (villageTargetsDiv) {
                            villageTargetsDiv.style.display = 'block';
                        }
                        
                        // Look for the village targets content
                        const villageTargets = document.getElementById('village_targets_content');
                        if (villageTargets) {
                            const rows = villageTargets.querySelectorAll('table.vis tr');
                            
                            rows.forEach(row => {
                                const targetLinks = row.querySelectorAll('a[href^="javascript:selectTarget"]');
                                if (targetLinks.length >= 2) {
                                    const village = {
                                        name: targetLinks[0].textContent.trim(),
                                        coords: targetLinks[1].textContent.trim()
                                    };
                                    
                                    // Parse resources
                                    const resourceSpans = row.querySelectorAll('.nowrap .res');
                                    if (resourceSpans.length >= 3) {
                                        village.wood = resourceSpans[0].textContent.trim();
                                        village.clay = resourceSpans[1].textContent.trim();
                                        village.iron = resourceSpans[2].textContent.trim();
                                    }
                                    
                                    // Try to parse warehouse from the row
                                    const warehouseTd = row.querySelector('td.nowrap:nth-child(3)');
                                    let warehouseText = extractWarehouseText(warehouseTd);
                                    
                                    if (warehouseText) {
                                        village.warehouse = warehouseText;
                                        // Save to cache
                                        const warehouseNum = formatNumber(warehouseText);
                                        if (warehouseNum > 0) {
                                            warehouseCache[village.coords] = warehouseNum;
                                        }
                                    } else {
                                        // No warehouse found in parsed data, check cache
                                        if (warehouseCache[village.coords] && warehouseCache[village.coords] > 0) {
                                            village.warehouse = displayNumber(warehouseCache[village.coords]);
                                        } else {
                                            village.warehouse = '?';
                                        }
                                    }
                                    
                                    // Get merchants data from cache
                                    let merchantsData = null;
                                    if (merchantsCache[village.coords]) {
                                        merchantsData = {
                                            available: merchantsCache[village.coords].available !== undefined ? merchantsCache[village.coords].available : '?',
                                            total: merchantsCache[village.coords].total !== undefined ? merchantsCache[village.coords].total : '?',
                                            maxTransport: merchantsCache[village.coords].maxTransport !== undefined ? merchantsCache[village.coords].maxTransport : '?',
                                            used: merchantsCache[village.coords].used !== undefined ? merchantsCache[village.coords].used : '?'
                                        };
                                    } else {
                                        merchantsData = {
                                            available: '?',
                                            total: '?',
                                            maxTransport: '?',
                                            used: '?'
                                        };
                                    }
                                    village.merchants = merchantsData;
                                    
                                    // Only add if we have all data and it's not a duplicate
                                    if (village.name && village.coords && village.wood && 
                                        !villages.some(v => v.coords === village.coords)) {
                                        villages.push(village);
                                    }
                                }
                            });
                        }
                        
                        // Hide the popup again
                        if (villageTargetsDiv) {
                            villageTargetsDiv.style.display = 'none';
                        }
                        
                        // Click the close link to properly close the popup
                        const closeLink = document.getElementById('closelink_village_targets');
                        if (closeLink) {
                            closeLink.click();
                        }
                        
                        // Restore original display style if needed
                        if (villageTargetsDiv && originalDisplay) {
                            setTimeout(() => {
                                villageTargetsDiv.style.display = originalDisplay;
                            }, 100);
                        }
                        
                        // Save updated caches
                        saveWarehouseCache();
                        saveMerchantsCache();
                        
                        resolve(villages);
                        
                    } catch (error) {
                        console.error('Error parsing village data:', error);
                        
                        // Try to close popup and restore display on error
                        const closeLink = document.getElementById('closelink_village_targets');
                        if (closeLink) {
                            closeLink.click();
                        }
                        
                        const villageTargetsDiv = document.getElementById('village_targets');
                        if (villageTargetsDiv && originalDisplay) {
                            villageTargetsDiv.style.display = originalDisplay;
                        }
                        
                        resolve(villages);
                    }
                }, 1000); // Wait for popup to load
                
            } catch (error) {
                console.error('Error in parseResourcesFromPage:', error);
                resolve([]);
            }
        });
    }

    // Update the table with village data and calculate percentages
    function updateResourcesTable(villages) {
        const tbody = document.getElementById('twResourcesBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        let totalWood = 0;
        let totalClay = 0;
        let totalIron = 0;
        
        // Load current settings
        const settings = loadSettings();
        
        // Update settings display
        document.getElementById('twCurrentRatios').textContent = 
            `${settings.targetWood}/${settings.targetClay}/${settings.targetIron}`;
        document.getElementById('twCurrentSpeed').textContent = settings.speedPerCell;
        
        // Update input fields
        document.getElementById('twTargetWood').value = settings.targetWood;
        document.getElementById('twTargetClay').value = settings.targetClay;
        document.getElementById('twTargetIron').value = settings.targetIron;
        document.getElementById('twSpeedPerCell').value = settings.speedPerCell;
        
        // Get current village coordinates
        let currentCoords = getCurrentVillageCoords();
        
        // Calculate total resources across all villages
        villages.forEach(village => {
            totalWood += formatNumber(village.wood);
            totalClay += formatNumber(village.clay);
            totalIron += formatNumber(village.iron);
        });
        
        const grandTotal = totalWood + totalClay + totalIron;
        const totalWoodPercent = grandTotal > 0 ? calculatePercentage(totalWood, grandTotal) : 0;
        const totalClayPercent = grandTotal > 0 ? calculatePercentage(totalClay, grandTotal) : 0;
        const totalIronPercent = grandTotal > 0 ? calculatePercentage(totalIron, grandTotal) : 0;
        
        // Calculate percentage for target ratios
        const targetTotal = settings.targetWood + settings.targetClay + settings.targetIron;
        const targetWoodPercent = settings.targetWood;
        const targetClayPercent = settings.targetClay;
        const targetIronPercent = settings.targetIron;
        
        // Create rows for each village
        villages.forEach(village => {
            const woodNum = formatNumber(village.wood);
            const clayNum = formatNumber(village.clay);
            const ironNum = formatNumber(village.iron);
            const warehouseNum = formatNumber(village.warehouse);
            const merchants = village.merchants || { available: '?', total: '?', maxTransport: '?', used: '?' };
            
            // Calculate percentages for this village
            const villageTotal = woodNum + clayNum + ironNum;
            const villageWoodPercent = villageTotal > 0 ? calculatePercentage(woodNum, villageTotal) : 0;
            const villageClayPercent = villageTotal > 0 ? calculatePercentage(clayNum, villageTotal) : 0;
            const villageIronPercent = villageTotal > 0 ? calculatePercentage(ironNum, villageTotal) : 0;
            
            // Calculate distance and send time
            let distance = 0;
            let sendTime = 0;
            let isCurrent = false;
            
            if (currentCoords && village.coords && village.coords !== 'Current') {
                if (village.coords === currentCoords) {
                    isCurrent = true;
                } else {
                    distance = calculateDistance(currentCoords, village.coords);
                    sendTime = distance * settings.speedPerCell; // minutes
                }
            } else if (village.coords === 'Current') {
                isCurrent = true;
            }
            
            // Determine color class for percentage cells based on comparison with target ratios
            const getPercentCellClass = (villagePercent, targetPercent) => {
                if (!isCurrent && targetTotal > 0) {
                    const diff = villagePercent - targetPercent;
                    if (diff > 15) return 'tw-percent-high';
                    if (diff > 5) return 'tw-percent-medium-high';
                    if (diff < -15) return 'tw-percent-low';
                    if (diff < -5) return 'tw-percent-medium-low';
                    return 'tw-percent-normal';
                }
                return '';
            };
            
            const woodPercentClass = getPercentCellClass(villageWoodPercent, targetWoodPercent);
            const clayPercentClass = getPercentCellClass(villageClayPercent, targetClayPercent);
            const ironPercentClass = getPercentCellClass(villageIronPercent, targetIronPercent);
            
            const row = document.createElement('tr');
            if (isCurrent) {
                row.style.cssText = 'background-color: #e8f5e8; font-weight: bold;';
            }
            
            row.innerHTML = `
                <td class="tw-village-name">${village.name}</td>
                <td><span class="tw-coords ${isCurrent ? 'tw-current-village' : ''}">${village.coords}</span></td>
                <td class="tw-distance-cell">${distance > 0 ? distance.toFixed(1) : isCurrent ? '-' : '?'}</td>
                <td class="tw-time-cell">${sendTime > 0 ? formatTime(sendTime) : isCurrent ? '-' : '?'}</td>
                <td class="tw-resource-cell">${displayNumber(woodNum)}</td>
                <td class="tw-percent-cell ${woodPercentClass}">${villageWoodPercent}%</td>
                <td class="tw-resource-cell">${displayNumber(clayNum)}</td>
                <td class="tw-percent-cell ${clayPercentClass}">${villageClayPercent}%</td>
                <td class="tw-resource-cell">${displayNumber(ironNum)}</td>
                <td class="tw-percent-cell ${ironPercentClass}">${villageIronPercent}%</td>
                <td class="tw-resource-cell">${warehouseNum > 0 ? displayNumber(warehouseNum) : '?'}</td>
                <td class="tw-merchants-cell">${displayNumber(merchants.total)}</td>
                <td class="tw-available-cell">${displayNumber(merchants.available)}</td>
                <td class="tw-transport-cell">${displayNumber(merchants.maxTransport)}</td>
            `;
            tbody.appendChild(row);
        });
        
        // Add total resources row (last row)
        const totalRow = document.createElement('tr');
        totalRow.className = 'tw-total-row';
        totalRow.innerHTML = `
            <td class="tw-total-cell">TOTAL</td>
            <td class="tw-total-cell">-</td>
            <td class="tw-total-cell">-</td>
            <td class="tw-total-cell">-</td>
            <td class="tw-total-resource">${displayNumber(totalWood)}</td>
            <td class="tw-total-percent">${totalWoodPercent}%</td>
            <td class="tw-total-resource">${displayNumber(totalClay)}</td>
            <td class="tw-total-percent">${totalClayPercent}%</td>
            <td class="tw-total-resource">${displayNumber(totalIron)}</td>
            <td class="tw-total-percent">${totalIronPercent}%</td>
            <td class="tw-total-cell">-</td>
            <td class="tw-total-cell">-</td>
            <td class="tw-total-cell">-</td>
            <td class="tw-total-cell">-</td>
        `;
        tbody.appendChild(totalRow);
    }

    // Load resources function with loading state
    async function loadResources() {
        const btn = document.getElementById('twRefreshBtn');
        const originalText = btn.textContent;
        const originalBg = btn.style.backgroundColor;
        
        // Set loading state
        btn.textContent = '⏳ Loading...';
        btn.style.backgroundColor = '#FF9800';
        btn.disabled = true;
        
        try {
            const villages = await parseResourcesFromPage();
            updateResourcesTable(villages);
            
            // Success state
            btn.textContent = '✓ Loaded';
            btn.style.backgroundColor = '#2196F3';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = originalBg;
                btn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error loading resources:', error);
            
            // Error state
            btn.textContent = '✗ Error';
            btn.style.backgroundColor = '#F44336';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = originalBg;
                btn.disabled = false;
            }, 2000);
        }
    }

    // Auto-refresh functionality
    let autoRefreshInterval = null;
    
    function toggleAutoRefresh() {
        const checkbox = document.getElementById('twAutoRefreshCheckbox');
        if (checkbox.checked) {
            autoRefreshInterval = setInterval(loadResources, 60000); // 60 seconds
            console.log('Auto-refresh enabled (60s interval)');
        } else {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
                console.log('Auto-refresh disabled');
            }
        }
    }

    // Periodically update merchants cache for current village
    function startMerchantsUpdate() {
        // Update merchants every 30 seconds
        setInterval(() => {
            const currentCoords = getCurrentVillageCoords();
            if (currentCoords) {
                const merchantsData = getMerchantsData();
                if (merchantsData) {
                    merchantsCache[currentCoords] = {
                        available: merchantsData.available || 0,
                        total: merchantsData.total || 0,
                        maxTransport: merchantsData.maxTransport || 0,
                        used: merchantsData.used || 0
                    };
                    saveMerchantsCache();
                    console.log(`Periodic update: Saved merchants for ${currentCoords}`);
                    
                    // Update the table if it's showing
                    const villages = Array.from(document.querySelectorAll('#twResourcesBody tr:not(:last-child)')).map(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells.length >= 14) {
                            return {
                                name: cells[0].textContent,
                                coords: cells[1].querySelector('span')?.textContent || cells[1].textContent,
                                wood: cells[4].textContent.replace(/\./g, ''),
                                clay: cells[6].textContent.replace(/\./g, ''),
                                iron: cells[8].textContent.replace(/\./g, ''),
                                warehouse: cells[10].textContent.replace(/\./g, '') || '0'
                            };
                        }
                        return null;
                    }).filter(v => v);
                    
                    if (villages.length > 0) {
                        updateResourcesTable(villages);
                    }
                }
            }
        }, 30000); // 30 seconds
    }

    // Save target ratios
    function saveTargetRatios() {
        const wood = parseInt(document.getElementById('twTargetWood').value) || 0;
        const clay = parseInt(document.getElementById('twTargetClay').value) || 0;
        const iron = parseInt(document.getElementById('twTargetIron').value) || 0;
        
        // Validate that total is close to 100%
        const total = wood + clay + iron;
        if (Math.abs(total - 100) > 5) {
            alert(`Ratios total is ${total}%, should be close to 100%`);
            return;
        }
        
        const settings = loadSettings();
        settings.targetWood = wood;
        settings.targetClay = clay;
        settings.targetIron = iron;
        saveSettings(settings);
        
        // Update display
        document.getElementById('twCurrentRatios').textContent = `${wood}/${clay}/${iron}`;
        
        // Refresh table to show new ratios
        const villages = Array.from(document.querySelectorAll('#twResourcesBody tr:not(:last-child)')).map(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 14) {
                return {
                    name: cells[0].textContent,
                    coords: cells[1].querySelector('span')?.textContent || cells[1].textContent,
                    wood: cells[4].textContent.replace(/\./g, ''),
                    clay: cells[6].textContent.replace(/\./g, ''),
                    iron: cells[8].textContent.replace(/\./g, ''),
                    warehouse: cells[10].textContent.replace(/\./g, '') || '0'
                };
            }
            return null;
        }).filter(v => v);
        
        if (villages.length > 0) {
            updateResourcesTable(villages);
        }
        
        // Visual feedback
        const btn = document.getElementById('twSaveRatios');
        const originalText = btn.textContent;
        btn.textContent = '✓ Saved';
        btn.style.backgroundColor = '#2196F3';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '#4CAF50';
        }, 1500);
    }
    
    // Save speed per cell
    function saveSpeedPerCell() {
        const speed = parseFloat(document.getElementById('twSpeedPerCell').value) || 3;
        
        if (speed < 0.1 || speed > 60) {
            alert('Speed should be between 0.1 and 60 minutes per cell');
            return;
        }
        
        const settings = loadSettings();
        settings.speedPerCell = speed;
        saveSettings(settings);
        
        // Update display
        document.getElementById('twCurrentSpeed').textContent = speed;
        
        // Refresh table to show new travel times
        const villages = Array.from(document.querySelectorAll('#twResourcesBody tr:not(:last-child)')).map(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 14) {
                return {
                    name: cells[0].textContent,
                    coords: cells[1].querySelector('span')?.textContent || cells[1].textContent,
                    wood: cells[4].textContent.replace(/\./g, ''),
                    clay: cells[6].textContent.replace(/\./g, ''),
                    iron: cells[8].textContent.replace(/\./g, ''),
                    warehouse: cells[10].textContent.replace(/\./g, '') || '0'
                };
            }
            return null;
        }).filter(v => v);
        
        if (villages.length > 0) {
            updateResourcesTable(villages);
        }
        
        // Visual feedback
        const btn = document.getElementById('twSaveSpeed');
        const originalText = btn.textContent;
        btn.textContent = '✓ Saved';
        btn.style.backgroundColor = '#2196F3';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '#4CAF50';
        }, 1500);
    }

    // Draggable functionality
    function makeDraggable(element) {
        const header = element.querySelector('#twResourcesHeader');
        let isDragging = false;
        let offsetX, offsetY;
        
        header.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        
        function startDrag(e) {
            if (e.target.id === 'twResourcesClose') return;
            
            isDragging = true;
            const rect = element.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            element.style.cursor = 'grabbing';
            element.style.opacity = '0.9';
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            // Keep within viewport
            const maxX = window.innerWidth - element.offsetWidth;
            const maxY = window.innerHeight - element.offsetHeight;
            
            element.style.left = Math.min(Math.max(0, x), maxX) + 'px';
            element.style.top = Math.min(Math.max(0, y), maxY) + 'px';
        }
        
        function stopDrag() {
            isDragging = false;
            element.style.cursor = '';
            element.style.opacity = '';
        }
    }

    // Initialize everything
    function init() {
        // Load caches
        loadWarehouseCache();
        loadMerchantsCache();
        
        // Set up event listeners
        document.getElementById('twResourcesClose').addEventListener('click', function() {
            document.getElementById('twResourcesMonitor').style.display = 'none';
        });
        
        document.getElementById('twRefreshBtn').addEventListener('click', loadResources);
        document.getElementById('twAutoRefreshCheckbox').addEventListener('change', toggleAutoRefresh);
        document.getElementById('twSaveRatios').addEventListener('click', saveTargetRatios);
        document.getElementById('twSaveSpeed').addEventListener('click', saveSpeedPerCell);
        
        // Make the monitor draggable
        makeDraggable(document.getElementById('twResourcesMonitor'));
        
        // Start periodic merchants update
        startMerchantsUpdate();
        
        console.log('Resources monitor initialized');
        
        // First, immediately get and display current village data
        const currentVillage = getCurrentVillageResources();
        if (currentVillage) {
            updateResourcesTable([currentVillage]);
        }
        
        // Then auto-load all resources after a delay
        setTimeout(loadResources, 500);
    }

    // Start initialization immediately
    init();
})();
