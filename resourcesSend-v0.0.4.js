(function() {
    // Check if already injected
    if (document.getElementById('twResourcesMonitor')) {
        console.log('Resources monitor already injected');
        return;
    }
    
    // Create the monitor element
    const monitorHTML = `
    <div id="twResourcesMonitor" style="position: fixed; top: 10px; left: 10px; z-index: 9999; background: rgba(245, 245, 245, 0.95); border: 2px solid #4CAF50; border-radius: 5px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); min-width: 300px; max-width: 400px; font-family: Arial, sans-serif; overflow: hidden;">
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
            <button id="twRefreshBtn" style="background: #4CAF50; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer; flex-grow: 1;">🔄 Refresh</button>
            <label id="twAutoRefresh" style="font-size: 11px; display: flex; align-items: center; gap: 4px;">
                <input type="checkbox" id="twAutoRefreshCheckbox"> Auto (30s)
            </label>
        </div>
    </div>
    `;
    
    // Append to body
    const container = document.createElement('div');
    container.innerHTML = monitorHTML;
    document.body.appendChild(container.firstElementChild);
    
    console.log('Resources monitor injected into page');
    
    // Sample data - in real use, this would come from parsing the page
    const sampleVillages = [
        { name: "001. Я узнал, что у меня", coords: "540|557", wood: "32.682", clay: "1.524", iron: "24.063", warehouse: "142.373" },
        { name: "002. Есть огромная семья!", coords: "527|556", wood: "23.691", clay: "11.608", iron: "18.483", warehouse: "142.373" },
        { name: "003. И тропинка, и лесок", coords: "541|562", wood: "6.629", clay: "3.755", iron: "13.419", warehouse: "94.184" },
        { name: "004. В поле - каждый колосок!", coords: "537|567", wood: "12.060", clay: "5.625", iron: "7.834", warehouse: "62.305" },
        { name: "005. Речка, небо голубое", coords: "535|565", wood: "5.184", clay: "3.069", iron: "654", warehouse: "76.604" },
        { name: "007. Это родина моя,", coords: "544|568", wood: "20.881", clay: "2.305", iron: "2.128", warehouse: "41.217" }
    ];

    // Utility functions
    function formatNumber(numStr) {
        return parseInt(numStr.replace(/\./g, ''));
    }

    function displayNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    // Parse resources from Tribal Wars page
    function parseResourcesFromPage() {
        try {
            const villages = [];
            
            // Look for the village targets popup
            const villageTargets = document.getElementById('village_targets_content');
            if (villageTargets) {
                const rows = villageTargets.querySelectorAll('table.vis tr');
                
                rows.forEach(row => {
                    const links = row.querySelectorAll('a[href^="javascript:selectTarget"]');
                    if (links.length >= 2) {
                        const village = {
                            name: links[0].textContent.trim(),
                            coords: links[1].textContent.trim()
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
                        
                        if (village.name && village.coords && village.wood) {
                            villages.push(village);
                        }
                    }
                });
            }
            
            return villages.length > 0 ? villages : sampleVillages;
        } catch (error) {
            console.error('Error parsing resources:', error);
            return sampleVillages;
        }
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
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding: 4px; border-bottom: 1px solid #ddd; vertical-align: middle; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${village.name}</td>
                <td style="padding: 4px; border-bottom: 1px solid #ddd; vertical-align: middle;"><span style="font-family: monospace; background: #f0f0f0; padding: 2px 4px; border-radius: 3px; font-size: 10px;">${village.coords}</span></td>
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

    // Refresh data function
    function refreshData() {
        const villages = parseResourcesFromPage();
        updateResourcesTable(villages);
        
        // Visual feedback
        const btn = document.getElementById('twRefreshBtn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Refreshed';
        btn.style.backgroundColor = '#2196F3';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '#4CAF50';
        }, 1500);
    }

    // Auto-refresh functionality
    let autoRefreshInterval = null;
    
    function toggleAutoRefresh() {
        const checkbox = document.getElementById('twAutoRefreshCheckbox');
        if (checkbox.checked) {
            autoRefreshInterval = setInterval(refreshData, 30000); // 30 seconds
        } else {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
            }
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
        
        document.getElementById('twRefreshBtn').addEventListener('click', refreshData);
        document.getElementById('twAutoRefreshCheckbox').addEventListener('change', toggleAutoRefresh);
        
        // Make the monitor draggable
        makeDraggable(document.getElementById('twResourcesMonitor'));
        
        // Initial data load
        refreshData();
    }

    // Start initialization
    setTimeout(init, 100);
})();
