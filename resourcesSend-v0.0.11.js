(function() {
    // Check if already injected
    if (document.getElementById('twResourcesMonitor')) {
        console.log('Resources monitor already injected');
        return;
    }
    
    // Create the monitor element
    const monitorHTML = `
    <div id="twResourcesMonitor" style="position: fixed; top: 10px; left: 10px; z-index: 9999; background: rgba(245, 245, 245, 0.95); border: 2px solid #4CAF50; border-radius: 5px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); min-width: 420px; max-width: 600px; font-family: Arial, sans-serif; overflow: hidden;">
        <!-- Header with close button -->
        <div id="twResourcesHeader" style="background: linear-gradient(to right, #4CAF50, #45a049); color: white; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none;">
            <div id="twResourcesTitle" style="font-weight: bold; font-size: 14px;">📊 Village Resources Monitor</div>
            <button id="twResourcesClose" style="background: #ff4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">×</button>
        </div>
        
        <!-- Settings panel -->
        <div id="twResourcesSettings" style="padding: 8px; background: #f0f8ff; border-bottom: 1px solid #ddd; font-size: 11px;">
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 6px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="white-space: nowrap;">Target Ratios:</span>
                    <input type="number" id="twTargetWood" style="width: 40px; padding: 2px; font-size: 11px; text-align: center;" placeholder="Wood %" min="0" max="100">
                    <span>/</span>
                    <input type="number" id="twTargetClay" style="width: 40px; padding: 2px; font-size: 11px; text-align: center;" placeholder="Clay %" min="0" max="100">
                    <span>/</span>
                    <input type="number" id="twTargetIron" style="width: 40px; padding: 2px; font-size: 11px; text-align: center;" placeholder="Iron %" min="0" max="100">
                    <button id="twSaveRatios" style="margin-left: 4px; padding: 2px 6px; font-size: 10px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">Save</button>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="white-space: nowrap;">Speed:</span>
                    <input type="number" id="twSpeedPerCell" style="width: 50px; padding: 2px; font-size: 11px; text-align: center;" placeholder="min/cell" min="1" max="60" step="0.1">
                    <span style="font-size: 10px;">min/cell</span>
                    <button id="twSaveSpeed" style="margin-left: 4px; padding: 2px 6px; font-size: 10px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">Save</button>
                </div>
            </div>
            <div style="font-size: 10px; color: #666;">
                <span>Current: <span id="twCurrentRatios">0/0/0</span>% | Speed: <span id="twCurrentSpeed">3</span> min/cell</span>
            </div>
        </div>
        
        <!-- Content area with table -->
        <div id="twResourcesContent" style="max-height: 400px; overflow-y: auto; padding: 0;">
            <table id="twResourcesTable" style="width: 100%; border-collapse: collapse; font-size: 9px;">
                <thead style="background-color: #e8f5e8; position: sticky; top: 0; z-index: 10;">
                    <tr>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">Village</th>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">Coords</th>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">Dist</th>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">Time</th>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">Wood</th>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">%</th>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">Clay</th>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">%</th>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">Iron</th>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">%</th>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">Storage</th>
                    </tr>
                </thead>
                <tbody id="twResourcesBody">
                    <!-- Data will be populated here -->
                </tbody>
            </table>
        </div>
        
        <!-- Summary section -->
        <div id="twResourcesSummary" style="padding: 6px 8px; background: #e8f5e8; border-top: 1px solid #ddd; font-size: 11px;">
            <span style="display: inline-block; margin-right: 10px;">Villages: <strong id="twTotalVillages">0</strong></span>
            <span style="display: inline-block; margin-right: 10px;">Wood: <strong id="twTotalWood">0</strong></span>
            <span style="display: inline-block; margin-right: 10px;">Clay: <strong id="twTotalClay">0</strong></span>
            <span style="display: inline-block; margin-right: 10px;">Iron: <strong id="twTotalIron">0</strong></span>
        </div>
        
        <!-- Controls -->
        <div id="twResourcesControls" style="padding: 8px; background: #f9f9f9; border-top: 1px solid #ddd; display: flex; gap: 8px; align-items: center;">
            <button id="twRefreshBtn" style="background: #4CAF50; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer; flex-grow: 1;">🔄 Load Resources</button>
            <label id="twAutoRefresh" style="font-size: 11px; display: flex; align-items: center; gap: 4px;">
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
    
    // Save warehouse cache to localStorage
    function saveWarehouseCache() {
        try {
            localStorage.setItem('twWarehouseCache', JSON.stringify(warehouseCache));
        } catch (error) {
            console.error('Error saving warehouse cache:', error);
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
    
    // Utility functions
    function formatNumber(numStr) {
        if (!numStr) return 0;
        // Handle both string numbers and already formatted numbers
        if (typeof numStr === 'number') return numStr;
        return parseInt(numStr.replace(/\./g, ''));
    }

    function displayNumber(num) {
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
            
            // Save current village warehouse capacity to cache
            if (currentCoords && currentVillage.warehouse !== '0') {
                const warehouseNum = formatNumber(currentVillage.warehouse);
                // Only update cache if we have a valid number
                if (warehouseNum > 0) {
                    warehouseCache[currentCoords] = warehouseNum;
                    saveWarehouseCache();
                }
            }
            
            return currentVillage;
        } catch (error) {
            console.error('Error getting current village:', error);
            return null;
        }
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
                                    // The warehouse is in a structure like:
                                    // <td class="nowrap"><span class="icon header ressources" data-title="Склад"> </span>142<span class="grey">.</span>373</td>
                                    const warehouseTd = row.querySelector('td.nowrap:nth-child(3)'); // 3rd td in row
                                    let warehouseText = extractWarehouseText(warehouseTd);
                                    
                                    if (warehouseText) {
                                        village.warehouse = warehouseText;
                                        // Save to cache
                                        const warehouseNum = formatNumber(warehouseText);
                                        if (warehouseNum > 0) {
                                            warehouseCache[village.coords] = warehouseNum;
                                            console.log(`Found warehouse for ${village.coords}: ${warehouseNum}`);
                                        }
                                    } else {
                                        // No warehouse found in parsed data, check cache
                                        if (warehouseCache[village.coords] && warehouseCache[village.coords] > 0) {
                                            village.warehouse = displayNumber(warehouseCache[village.coords]);
                                            console.log(`Using cached warehouse for ${village.coords}: ${warehouseCache[village.coords]}`);
                                        } else {
                                            village.warehouse = '?';
                                            console.log(`No warehouse data for ${village.coords}`);
                                        }
                                    }
                                    
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
                        
                        // Save updated cache
                        saveWarehouseCache();
                        console.log('Updated warehouse cache:', warehouseCache);
                        
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
            
            // Determine color for percentage cells based on comparison with target ratios
            const getPercentCellStyle = (villagePercent, targetPercent, resourceType) => {
                if (!isCurrent && targetTotal > 0) {
                    const diff = villagePercent - targetPercent;
                    if (diff > 15) return 'background-color: #c8e6c9; color: #2e7d32; font-weight: bold;'; // Green - much higher than target
                    if (diff > 5) return 'background-color: #e8f5e8; color: #388e3c;'; // Light green - higher than target
                    if (diff < -15) return 'background-color: #ffcdd2; color: #c62828; font-weight: bold;'; // Red - much lower than target
                    if (diff < -5) return 'background-color: #ffebee; color: #d32f2f;'; // Light red - lower than target
                    return 'background-color: #f5f5f5; color: #666;'; // Close to target
                }
                return '';
            };
            
            const woodPercentStyle = getPercentCellStyle(villageWoodPercent, targetWoodPercent, 'wood');
            const clayPercentStyle = getPercentCellStyle(villageClayPercent, targetClayPercent, 'clay');
            const ironPercentStyle = getPercentCellStyle(villageIronPercent, targetIronPercent, 'iron');
            
            const row = document.createElement('tr');
            row.style.cssText = isCurrent ? 'background-color: #e8f5e8; font-weight: bold;' : '';
            row.innerHTML = `
                <td style="padding: 3px 2px; border-bottom: 1px solid #ddd; vertical-align: middle; max-width: 80px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 8px;">${village.name}</td>
                <td style="padding: 3px 2px; border-bottom: 1px solid #ddd; vertical-align: middle; font-size: 8px;"><span style="font-family: monospace; background: ${isCurrent ? '#4CAF50' : '#f0f0f0'}; color: ${isCurrent ? 'white' : 'black'}; padding: 2px 4px; border-radius: 3px; font-size: 7px;">${village.coords}</span></td>
                <td style="padding: 3px 2px; border-bottom: 1px solid #ddd; vertical-align: middle; text-align: center; font-family: monospace; font-size: 8px;">${distance > 0 ? distance.toFixed(1) : isCurrent ? '-' : '?'}</td>
                <td style="padding: 3px 2px; border-bottom: 1px solid #ddd; vertical-align: middle; text-align: center; font-family: monospace; font-size: 8px; white-space: nowrap;">${sendTime > 0 ? formatTime(sendTime) : isCurrent ? '-' : '?'}</td>
                <td style="padding: 3px 2px; border-bottom: 1px solid #ddd; vertical-align: middle; text-align: right; font-family: monospace; font-size: 8px;">${displayNumber(woodNum)}</td>
                <td style="padding: 3px 2px; border-bottom: 1px solid #ddd; vertical-align: middle; text-align: center; font-size: 8px; ${woodPercentStyle}">${villageWoodPercent}%</td>
                <td style="padding: 3px 2px; border-bottom: 1px solid #ddd; vertical-align: middle; text-align: right; font-family: monospace; font-size: 8px;">${displayNumber(clayNum)}</td>
                <td style="padding: 3px 2px; border-bottom: 1px solid #ddd; vertical-align: middle; text-align: center; font-size: 8px; ${clayPercentStyle}">${villageClayPercent}%</td>
                <td style="padding: 3px 2px; border-bottom: 1px solid #ddd; vertical-align: middle; text-align: right; font-family: monospace; font-size: 8px;">${displayNumber(ironNum)}</td>
                <td style="padding: 3px 2px; border-bottom: 1px solid #ddd; vertical-align: middle; text-align: center; font-size: 8px; ${ironPercentStyle}">${villageIronPercent}%</td>
                <td style="padding: 3px 2px; border-bottom: 1px solid #ddd; vertical-align: middle; text-align: right; font-family: monospace; font-size: 8px;">${warehouseNum > 0 ? displayNumber(warehouseNum) : '?'}</td>
            `;
            tbody.appendChild(row);
        });
        
        // Add total resources row (last row)
        const totalRow = document.createElement('tr');
        totalRow.style.cssText = 'background-color: #d4edda; font-weight: bold; border-top: 2px solid #4CAF50;';
        totalRow.innerHTML = `
            <td style="padding: 4px 2px; vertical-align: middle; text-align: center; font-size: 8px; font-weight: bold;">TOTAL</td>
            <td style="padding: 4px 2px; vertical-align: middle; text-align: center; font-size: 8px; font-weight: bold;">-</td>
            <td style="padding: 4px 2px; vertical-align: middle; text-align: center; font-size: 8px; font-weight: bold;">-</td>
            <td style="padding: 4px 2px; vertical-align: middle; text-align: center; font-size: 8px; font-weight: bold;">-</td>
            <td style="padding: 4px 2px; vertical-align: middle; text-align: right; font-family: monospace; font-size: 8px; font-weight: bold;">${displayNumber(totalWood)}</td>
            <td style="padding: 4px 2px; vertical-align: middle; text-align: center; font-size: 8px; font-weight: bold; background-color: #e8f5e8;">${totalWoodPercent}%</td>
            <td style="padding: 4px 2px; vertical-align: middle; text-align: right; font-family: monospace; font-size: 8px; font-weight: bold;">${displayNumber(totalClay)}</td>
            <td style="padding: 4px 2px; vertical-align: middle; text-align: center; font-size: 8px; font-weight: bold; background-color: #e8f5e8;">${totalClayPercent}%</td>
            <td style="padding: 4px 2px; vertical-align: middle; text-align: right; font-family: monospace; font-size: 8px; font-weight: bold;">${displayNumber(totalIron)}</td>
            <td style="padding: 4px 2px; vertical-align: middle; text-align: center; font-size: 8px; font-weight: bold; background-color: #e8f5e8;">${totalIronPercent}%</td>
            <td style="padding: 4px 2px; vertical-align: middle; text-align: center; font-size: 8px; font-weight: bold;">-</td>
        `;
        tbody.appendChild(totalRow);
        
        // Update summary
        document.getElementById('twTotalVillages').textContent = villages.length;
        document.getElementById('twTotalWood').textContent = displayNumber(totalWood);
        document.getElementById('twTotalClay').textContent = displayNumber(totalClay);
        document.getElementById('twTotalIron').textContent = displayNumber(totalIron);
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
            if (cells.length >= 11) {
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
            if (cells.length >= 11) {
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

    // Add this function to clean up cache
    function cleanWarehouseCache() {
        const cleanedCache = {};
        for (const [coords, value] of Object.entries(warehouseCache)) {
            if (value !== null && value !== undefined && value > 0) {
                cleanedCache[coords] = value;
            }
        }
        warehouseCache = cleanedCache;
        saveWarehouseCache();
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

    // Initialize everything
    function init() {
        // Load warehouse cache
        loadWarehouseCache();
        
        // Clean up any null values in cache
        cleanWarehouseCache();
        
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
        
        console.log('Resources monitor initialized');
        
        // Auto-load resources on startup
        setTimeout(loadResources, 500);
    }

    // Start initialization immediately
    init();
})();
