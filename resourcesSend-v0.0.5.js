(function() {
    // Check if already injected
    if (document.getElementById('twResourcesMonitor')) {
        console.log('Resources monitor already injected');
        return;
    }
    
    // Create the monitor element
    const monitorHTML = `
    <div id="twResourcesMonitor" style="position: fixed; top: 10px; left: 10px; z-index: 9999; background: rgba(245, 245, 245, 0.95); border: 2px solid #4CAF50; border-radius: 5px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); min-width: 320px; max-width: 450px; font-family: Arial, sans-serif; overflow: hidden;">
        <!-- Header with close button -->
        <div id="twResourcesHeader" style="background: linear-gradient(to right, #4CAF50, #45a049); color: white; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none;">
            <div id="twResourcesTitle" style="font-weight: bold; font-size: 14px;">📊 Village Resources Monitor</div>
            <button id="twResourcesClose" style="background: #ff4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;">×</button>
        </div>
        
        <!-- Content area with table -->
        <div id="twResourcesContent" style="max-height: 400px; overflow-y: auto; padding: 0;">
            <table id="twResourcesTable" style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead style="background-color: #e8f5e8; position: sticky; top: 0; z-index: 10;">
                    <tr>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">Village</th>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">Coords</th>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">Wood</th>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">Clay</th>
                        <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #4CAF50; font-weight: bold; white-space: nowrap;">Iron</th>
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
        </div>
    </div>
    `;
    
    // Append to body
    const container = document.createElement('div');
    container.innerHTML = monitorHTML;
    document.body.appendChild(container.firstElementChild);
    
    console.log('Resources monitor injected into page');
    
    // Utility functions
    function formatNumber(numStr) {
        if (!numStr) return 0;
        return parseInt(numStr.replace(/\./g, ''));
    }

    function displayNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Get current village resources from the header
    function getCurrentVillageResources() {
        try {
            const currentVillage = {
                name: document.querySelector('#village_list option[selected]')?.textContent || 'Current Village',
                coords: 'Current',
                wood: document.getElementById('wood')?.textContent || '0',
                clay: document.getElementById('stone')?.textContent || '0',
                iron: document.getElementById('iron')?.textContent || '0',
                warehouse: document.getElementById('storage')?.textContent || '0'
            };
            
            // Try to get village name from village list dropdown
            const villageSelect = document.getElementById('village_list');
            if (villageSelect && villageSelect.options) {
                const selectedOption = Array.from(villageSelect.options).find(opt => opt.selected);
                if (selectedOption) {
                    const match = selectedOption.text.match(/(\d+)\s*\|\s*(\d+)/);
                    if (match) {
                        currentVillage.coords = `${match[1]}|${match[2]}`;
                    }
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
                    console.log('Target select links not found');
                    resolve(villages);
                    return;
                }
                
                const links = targetSelectLinks.querySelectorAll('a');
                if (links.length < 2) {
                    console.log('Not enough links found');
                    resolve(villages);
                    return;
                }
                
                // Click the second link to open village targets popup
                links[1].click();
                
                // Wait for popup to load and parse data
                setTimeout(() => {
                    try {
                        // Look for the village targets popup
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
                                    
                                    // Parse warehouse
                                    const warehouseSpan = row.querySelector('.icon.header.ressources');
                                    if (warehouseSpan && warehouseSpan.nextElementSibling) {
                                        village.warehouse = warehouseSpan.nextElementSibling.textContent.trim();
                                    }
                                    
                                    // Only add if we have all data and it's not a duplicate
                                    if (village.name && village.coords && village.wood && 
                                        !villages.some(v => v.coords === village.coords)) {
                                        villages.push(village);
                                    }
                                }
                            });
                        }
                        
                        // Close the popup
                        const closeLink = document.getElementById('closelink_village_targets');
                        if (closeLink) {
                            closeLink.click();
                        }
                        
                        resolve(villages);
                        
                    } catch (error) {
                        console.error('Error parsing village data:', error);
                        
                        // Try to close popup on error
                        const closeLink = document.getElementById('closelink_village_targets');
                        if (closeLink) {
                            closeLink.click();
                        }
                        
                        resolve(villages);
                    }
                }, 500); // Wait for popup to load
                
            } catch (error) {
                console.error('Error in parseResourcesFromPage:', error);
                resolve([]);
            }
        });
    }

    // Update the table with village data
    function updateResourcesTable(villages) {
        const tbody = document.getElementById('twResourcesBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        let totalWood = 0;
        let totalClay = 0;
        let totalIron = 0;
        
        villages.forEach(village => {
            const woodNum = formatNumber(village.wood);
            const clayNum = formatNumber(village.clay);
            const ironNum = formatNumber(village.iron);
            const warehouseNum = formatNumber(village.warehouse);
            
            totalWood += woodNum;
            totalClay += clayNum;
            totalIron += ironNum;
            
            // Highlight current village
            const isCurrent = village.coords === 'Current';
            const rowStyle = isCurrent ? 'background-color: #e8f5e8; font-weight: bold;' : '';
            
            const row = document.createElement('tr');
            row.style.cssText = rowStyle;
            row.innerHTML = `
                <td style="padding: 4px; border-bottom: 1px solid #ddd; vertical-align: middle; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${village.name}</td>
                <td style="padding: 4px; border-bottom: 1px solid #ddd; vertical-align: middle;"><span style="font-family: monospace; background: ${isCurrent ? '#4CAF50' : '#f0f0f0'}; color: ${isCurrent ? 'white' : 'black'}; padding: 2px 4px; border-radius: 3px; font-size: 10px;">${village.coords}</span></td>
                <td style="padding: 4px; border-bottom: 1px solid #ddd; vertical-align: middle; text-align: right; font-family: monospace; font-size: 10px;">${displayNumber(woodNum)}</td>
                <td style="padding: 4px; border-bottom: 1px solid #ddd; vertical-align: middle; text-align: right; font-family: monospace; font-size: 10px;">${displayNumber(clayNum)}</td>
                <td style="padding: 4px; border-bottom: 1px solid #ddd; vertical-align: middle; text-align: right; font-family: monospace; font-size: 10px;">${displayNumber(ironNum)}</td>
                <td style="padding: 4px; border-bottom: 1px solid #ddd; vertical-align: middle; text-align: right; font-family: monospace; font-size: 10px;">${displayNumber(warehouseNum)}</td>
            `;
            tbody.appendChild(row);
        });
        
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
        // Set up event listeners
        document.getElementById('twResourcesClose').addEventListener('click', function() {
            document.getElementById('twResourcesMonitor').style.display = 'none';
        });
        
        document.getElementById('twRefreshBtn').addEventListener('click', loadResources);
        
        // Make the monitor draggable
        makeDraggable(document.getElementById('twResourcesMonitor'));
        
        console.log('Resources monitor initialized');
        
        // Initial load of current village only
        setTimeout(() => {
            const currentVillage = getCurrentVillageResources();
            if (currentVillage) {
                updateResourcesTable([currentVillage]);
            }
        }, 100);
    }

    // Start initialization
    setTimeout(init, 100);
})();
