(function() {
    // Get current world from URL
    function getCurrentWorld() {
        const hostname = window.location.hostname;
        
        // Handle voynaplemyon.com domains
        if (hostname.includes('voynaplemyon.com')) {
            // Extract server name (ruc1, ru100, etc.)
            const parts = hostname.split('.');
            if (parts.length > 0) {
                return parts[0]; // Returns 'ruc1', 'ru100', etc.
            }
        }
        
        // For other domains, use a more generic approach
        const parts = hostname.split('.');
        return parts.length > 0 ? parts[0] : 'unknown';
    }

    const currentWorld = getCurrentWorld();
    console.log('Current world detected:', currentWorld);
    
    // Check if we're on the reports page
    const isReportPage = window.location.search.includes('screen=report');
    
    // Initialize or get storage
    let storage;
    try {
        const storedData = localStorage.getItem('tribalwars-farm');
        storage = storedData ? JSON.parse(storedData) : {};
    } catch (e) {
        console.error('Error parsing storage:', e);
        storage = {};
    }
    
    // DEFENSIVE: Ensure storage has required structure
    if (typeof storage !== 'object' || storage === null) {
        storage = {};
    }
    
    if (!storage.worlds || typeof storage.worlds !== 'object') {
        storage.worlds = {};
    }
    
    if (!storage.troopSpeeds || typeof storage.troopSpeeds !== 'object') {
        storage.troopSpeeds = {
            sc: 18,   // Spear
            sw: 22,   // Sword
            ax: 18,   // Axe
            ar: 18,   // Archer
            lc: 10,   // Light cavalry
            hv: 11,   // Heavy cavalry
            hr: 10,   // Horse archer
            kn: 18    // Knight
        };
    }
    
    // DEFENSIVE: Ensure current world exists in storage
    if (!storage.worlds[currentWorld] || typeof storage.worlds[currentWorld] !== 'object') {
        storage.worlds[currentWorld] = {};
    }
    
    const worldStorage = storage.worlds[currentWorld];
    console.log('World storage initialized for:', currentWorld, worldStorage);
    
    // Save the updated structure back to localStorage
    try {
        localStorage.setItem('tribalwars-farm', JSON.stringify(storage));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
    
    // If not on report page, just show stats
    if (!isReportPage) {
        showStats();
        return;
    }
    
    // Function to filter farm reports - UPDATED WITH DEFENSIVE CHECK
    function filterFarmReports() {
        const allLinks = Array.from(document.querySelectorAll('a.report-link'));
        const farmReports = [];
        
        for (const link of allLinks) {
            const reportId = link.getAttribute('data-id');
            
            // DEFENSIVE: Check if worldStorage exists and has the reportId
            if (worldStorage && reportId && worldStorage[reportId]) {
                continue; // Skip already processed reports
            }
            
            const tableRow = link.closest('tr');
            if (!tableRow) continue;
            
            // Check for farm icon
            const farmIcon = tableRow.querySelector('img[data-title="Отряд для грабежа"]');
            if (farmIcon !== null) {
                farmReports.push(link);
                continue;
            }
            
            // Check for quick edit label
            const quickEditLabel = tableRow.querySelector('span.quickedit-label');
            if (quickEditLabel) {
                const labelText = quickEditLabel.textContent;
                if (labelText.includes('Деревня варваров') || labelText.includes('Бонусная деревня')) {
                    farmReports.push(link);
                }
            }
        }
        
        return farmReports;
    }
    
    // Function to process data for charts
    function prepareChartData(reports) {
        console.log('Preparing chart data from', reports.length, 'reports');
        
        const dailyData = {};
        
        // Group reports by day
        reports.forEach(report => {
            if (report.created) {
                try {
                    const date = new Date(report.created);
                    // Format as YYYY-MM-DD
                    const dayKey = date.getFullYear() + '-' + 
                                  String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                                  String(date.getDate()).padStart(2, '0');
                    
                    if (!dailyData[dayKey]) {
                        dailyData[dayKey] = {
                            date: dayKey,
                            timestamp: date.getTime(),
                            attacks: 0,
                            totalResources: 0,
                            villages: new Set()
                        };
                    }
                    
                    dailyData[dayKey].attacks++;
                    dailyData[dayKey].totalResources += report.totalResources;
                    
                    if (report.coordinates) {
                        dailyData[dayKey].villages.add(report.coordinates);
                    }
                } catch (e) {
                    console.error('Error processing report date:', report.created, e);
                }
            }
        });
        
        console.log('Found', Object.keys(dailyData).length, 'days with data');
        
        // Calculate derived metrics
        Object.values(dailyData).forEach(day => {
            if (day.attacks > 0) {
                day.resourcesPerAttack = Math.round(day.totalResources / day.attacks);
                // Resources per hour per day - based on 24 hours in a day
                day.resourcesPerHour = Math.round(day.totalResources / 24);
            }
            day.villageCount = day.villages.size;
        });
        
        // Convert to arrays and sort by date
        const sortedDays = Object.values(dailyData).sort((a, b) => a.timestamp - b.timestamp);
        
        // Format dates for display (short format)
        const formattedDates = sortedDays.map(day => {
            const date = new Date(day.date);
            return `${date.getDate()}/${date.getMonth() + 1}`;
        });
        
        return {
            labels: formattedDates,
            dates: sortedDays.map(day => day.date),
            attacksData: sortedDays.map(day => day.attacks),
            resourcesPerAttackData: sortedDays.map(day => day.resourcesPerAttack),
            resourcesPerHourData: sortedDays.map(day => day.resourcesPerHour),
            villagesData: sortedDays.map(day => day.villageCount)
        };
    }
    
    // Function to create simple HTML charts (no external dependencies)
    function createSimpleCharts(chartData, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!chartData.labels || chartData.labels.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:20px;color:#666;background:#f0f0f0;border-radius:5px;">
                    <div style="margin-bottom:10px;">📊</div>
                    <div>No chart data available</div>
                    <div style="font-size:11px;margin-top:5px;">Try collecting some farm reports first</div>
                </div>
            `;
            return;
        }
        
        // Create simple bar charts using HTML/CSS
        const chartTypes = [
            { 
                title: 'Attacks per Day', 
                data: chartData.attacksData, 
                tooltipPrefix: 'Attacks: '
            },
            { 
                title: 'Avg Resources per Attack', 
                data: chartData.resourcesPerAttackData, 
                tooltipPrefix: 'Resources: ',
                formatValue: (val) => val.toLocaleString()
            },
            { 
                title: 'Resources per Hour per Day', 
                data: chartData.resourcesPerHourData, 
                tooltipPrefix: 'Resources/hour: ',
                formatValue: (val) => val.toLocaleString()
            },
            { 
                title: 'Unique Villages', 
                data: chartData.villagesData, 
                tooltipPrefix: 'Villages: '
            }
        ];
        
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexWrap = 'wrap';
        wrapper.style.gap = '20px';
        wrapper.style.justifyContent = 'space-between';
        
        chartTypes.forEach((chartType, chartIndex) => {
            const chartContainer = document.createElement('div');
            chartContainer.style.flex = '1';
            chartContainer.style.minWidth = '280px';
            chartContainer.style.backgroundColor = 'white';
            chartContainer.style.borderRadius = '5px';
            chartContainer.style.padding = '15px';
            chartContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            
            const title = document.createElement('div');
            title.textContent = chartType.title;
            title.style.fontWeight = 'bold';
            title.style.marginBottom = '15px';
            title.style.color = '#333';
            title.style.fontSize = '14px';
            chartContainer.appendChild(title);
            
            const maxValue = Math.max(...chartType.data);
            const chartHeight = 150;
            
            const chartBars = document.createElement('div');
            chartBars.style.display = 'flex';
            chartBars.style.alignItems = 'flex-end';
            chartBars.style.height = chartHeight + 'px';
            chartBars.style.gap = '8px';
            chartBars.style.padding = '10px 0';
            chartBars.style.position = 'relative';
            
            // Create y-axis labels
            const yAxisLabels = document.createElement('div');
            yAxisLabels.style.position = 'absolute';
            yAxisLabels.style.left = '0';
            yAxisLabels.style.top = '0';
            yAxisLabels.style.bottom = '0';
            yAxisLabels.style.width = '35px';
            yAxisLabels.style.display = 'flex';
            yAxisLabels.style.flexDirection = 'column';
            yAxisLabels.style.justifyContent = 'space-between';
            yAxisLabels.style.padding = '5px 0';
            
            // Add y-axis grid lines and labels
            if (maxValue > 0) {
                // Create 5 evenly spaced values from 0 to max
                for (let i = 4; i >= 0; i--) {
                    const value = Math.round((maxValue * i) / 4);
                    const label = document.createElement('div');
                    label.textContent = chartType.formatValue ? chartType.formatValue(value) : value;
                    label.style.fontSize = '9px';
                    label.style.color = '#666';
                    label.style.textAlign = 'right';
                    label.style.paddingRight = '5px';
                    
                    // Add grid line
                    const gridLine = document.createElement('div');
                    gridLine.style.position = 'absolute';
                    gridLine.style.left = '35px';
                    gridLine.style.right = '0';
                    const position = (i / 4) * 100;
                    gridLine.style.top = position + '%';
                    gridLine.style.height = '1px';
                    gridLine.style.backgroundColor = '#eee';
                    gridLine.style.zIndex = '0';
                    chartBars.appendChild(gridLine);
                    
                    yAxisLabels.appendChild(label);
                }
            }
            
            chartBars.appendChild(yAxisLabels);
            
            const barsContainer = document.createElement('div');
            barsContainer.style.marginLeft = '40px';
            barsContainer.style.flex = '1';
            barsContainer.style.display = 'flex';
            barsContainer.style.gap = '8px';
            barsContainer.style.alignItems = 'flex-end';
            barsContainer.style.height = '100%';
            
            chartData.labels.forEach((label, index) => {
                const barContainer = document.createElement('div');
                barContainer.style.display = 'flex';
                barContainer.style.flexDirection = 'column';
                barContainer.style.alignItems = 'center';
                barContainer.style.flex = '1';
                barContainer.style.height = '100%';
                barContainer.style.position = 'relative';
                
                const value = chartType.data[index];
                const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
                
                const bar = document.createElement('div');
                bar.style.width = '80%';
                bar.style.height = barHeight + 'px';
                bar.style.backgroundColor = 'rgb(204, 189, 53)'; // Gold color for all charts
                bar.style.borderRadius = '3px 3px 0 0';
                bar.style.position = 'absolute';
                bar.style.bottom = '0';
                bar.style.left = '10%';
                bar.style.transition = 'all 0.3s ease';
                bar.style.cursor = 'pointer';
                bar.style.zIndex = '1';
                
                const valueText = chartType.formatValue ? chartType.formatValue(value) : value;
                bar.title = `${chartData.dates[index]}: ${chartType.tooltipPrefix}${valueText}`;
                
                // Add hover effect
                bar.onmouseover = function() {
                    this.style.opacity = '0.8';
                    this.style.transform = 'scale(1.05)';
                    
                    // Show tooltip
                    const tooltip = document.createElement('div');
                    tooltip.textContent = `${chartData.dates[index]}: ${chartType.tooltipPrefix}${valueText}`;
                    tooltip.style.position = 'absolute';
                    tooltip.style.top = '-35px';
                    tooltip.style.left = '50%';
                    tooltip.style.transform = 'translateX(-50%)';
                    tooltip.style.backgroundColor = 'rgba(0,0,0,0.8)';
                    tooltip.style.color = 'white';
                    tooltip.style.padding = '5px 10px';
                    tooltip.style.borderRadius = '4px';
                    tooltip.style.fontSize = '11px';
                    tooltip.style.whiteSpace = 'nowrap';
                    tooltip.style.zIndex = '1000';
                    tooltip.style.pointerEvents = 'none';
                    this.parentElement.appendChild(tooltip);
                };
                
                bar.onmouseout = function() {
                    this.style.opacity = '1';
                    this.style.transform = 'scale(1)';
                    
                    // Remove tooltip
                    const tooltip = this.parentElement.querySelector('div[style*="position: absolute"][style*="top: -35px"]');
                    if (tooltip) tooltip.remove();
                };
                
                const labelElement = document.createElement('div');
                labelElement.textContent = label;
                labelElement.style.fontSize = '10px';
                labelElement.style.marginTop = '5px';
                labelElement.style.color = '#666';
                labelElement.style.textAlign = 'center';
                labelElement.style.position = 'absolute';
                labelElement.style.bottom = '-25px';
                labelElement.style.left = '0';
                labelElement.style.right = '0';
                labelElement.style.transform = 'rotate(-45deg)';
                labelElement.style.transformOrigin = 'center';
                labelElement.style.whiteSpace = 'nowrap';
                labelElement.style.overflow = 'hidden';
                labelElement.style.textOverflow = 'ellipsis';
                
                barContainer.appendChild(bar);
                barContainer.appendChild(labelElement);
                barsContainer.appendChild(barContainer);
            });
            
            chartBars.appendChild(barsContainer);
            
            const xAxis = document.createElement('div');
            xAxis.style.height = '1px';
            xAxis.style.backgroundColor = '#ddd';
            xAxis.style.marginTop = '30px';
            xAxis.style.marginLeft = '40px';
            
            chartContainer.appendChild(chartBars);
            chartContainer.appendChild(xAxis);
            wrapper.appendChild(chartContainer);
        });
        
        container.appendChild(wrapper);
    }
    
    // Function to create troop speed input form
    function createTroopSpeedInputs() {
        const speeds = storage.troopSpeeds || {};
        
        let html = `
            <div style="background:#f8f8f8;padding:15px;border-radius:5px;border:1px solid #ddd;margin-bottom:20px;">
                <div style="font-weight:bold;margin-bottom:10px;color:#333;">Troop Speed Settings (minutes per field)</div>
                <table style="width:100%;border-collapse:collapse;font-size:11px;text-align:center;">
                    <thead>
                        <tr style="background:#e8e8e8;">`;
        
        const troopTypes = [
            { name: 'Spear', code: 'sc' },
            { name: 'Sword', code: 'sw' },
            { name: 'Axe', code: 'ax' },
            { name: 'Archer', code: 'ar' },
            { name: 'Light Cavalry', code: 'lc' },
            { name: 'Heavy Cavalry', code: 'hv' },
            { name: 'Horse Archer', code: 'hr' },
            { name: 'Knight', code: 'kn' }
        ];
        
        // Create header row with troop names
        troopTypes.forEach(troop => {
            html += `<th style="padding:5px;border:1px solid #ccc;">${troop.name}<br><small>(${troop.code.toUpperCase()})</small></th>`;
        });
        
        html += `
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background:white;">`;
        
        // Create input row with speed values
        troopTypes.forEach(troop => {
            const speedValue = speeds[troop.code] || 18;
            html += `
                <td style="padding:5px;border:1px solid #ccc;">
                    <input type="number" id="speed_${troop.code}" 
                           value="${speedValue}" 
                           style="width:60px;padding:5px;font-size:11px;text-align:center;"
                           min="1" max="100" step="1">
                </td>`;
        });
        
        html += `
                        </tr>
                    </tbody>
                </table>
                <div style="margin-top:15px;text-align:center;">
                    <button id="saveTroopSpeedsBtn" 
                            style="background:#4CAF50;color:white;border:none;padding:8px 15px;cursor:pointer;border-radius:3px;font-size:11px;margin-right:10px;">
                        💾 Save Speeds
                    </button>
                    <button id="resetTroopSpeedsBtn"
                            style="background:#ff9800;color:white;border:none;padding:8px 15px;cursor:pointer;border-radius:3px;font-size:11px;">
                        🔄 Reset to Default
                    </button>
                </div>
            </div>`;
        
        return html;
    }
    
    // Function to save troop speeds
    window.saveTroopSpeeds = function() {
        const troopTypes = ['sc', 'sw', 'ax', 'ar', 'lc', 'hv', 'hr', 'kn'];
        const newSpeeds = {};
        
        troopTypes.forEach(code => {
            const input = document.getElementById(`speed_${code}`);
            if (input) {
                newSpeeds[code] = parseInt(input.value) || 18;
            }
        });
        
        storage.troopSpeeds = newSpeeds;
        localStorage.setItem('tribalwars-farm', JSON.stringify(storage));
        
        // Show confirmation
        alert('Troop speeds saved successfully!');
    };
    
    // Function to reset troop speeds to default
    window.resetTroopSpeeds = function() {
        const defaultSpeeds = {
            sc: 18, sw: 22, ax: 18, ar: 18,
            lc: 10, hv: 11, hr: 10, kn: 18
        };
        
        storage.troopSpeeds = defaultSpeeds;
        localStorage.setItem('tribalwars-farm', JSON.stringify(storage));
        
        // Update input values
        Object.keys(defaultSpeeds).forEach(code => {
            const input = document.getElementById(`speed_${code}`);
            if (input) {
                input.value = defaultSpeeds[code];
            }
        });
        
        alert('Troop speeds reset to defaults!');
    };
    
    // Function to show world selector
    function createWorldSelector() {
        const worlds = Object.keys(storage.worlds);
        
        if (worlds.length <= 1) return '';
        
        let html = `
            <div style="background:#e8f4ff;padding:10px;border-radius:5px;border:1px solid #b3d9ff;margin-bottom:15px;">
                <div style="font-weight:bold;margin-bottom:5px;color:#0066cc;">Select World:</div>
                <select id="worldSelector" onchange="switchWorld(this.value)" 
                        style="width:200px;padding:5px;font-size:12px;">
                    <option value="">All Worlds</option>`;
        
        worlds.forEach(world => {
            const selected = world === currentWorld ? 'selected' : '';
            const reportCount = Object.keys(storage.worlds[world] || {}).length;
            html += `<option value="${world}" ${selected}>${world} (${reportCount} reports)</option>`;
        });
        
        html += `
                </select>
                <div style="font-size:11px;color:#666;margin-top:5px;">
                    Current: <strong>${currentWorld}</strong>
                </div>
            </div>`;
        
        return html;
    }
    
    // Function to switch between worlds
    window.switchWorld = function(worldName) {
        if (worldName) {
            // Show stats for selected world
            showStatsForWorld(worldName);
        } else {
            // Show combined stats for all worlds
            showStats();
        }
    };
    
    // Main showStats function (shows combined stats)
    function showStats(reportLimit = 100) {
        // Collect reports from all worlds
        const allReports = [];
        for (const world in storage.worlds) {
            const worldReports = Object.values(storage.worlds[world] || {});
            allReports.push(...worldReports);
        }
        
        // Sort by date (newest first)
        allReports.sort((a, b) => new Date(b.created) - new Date(a.created));
        
        const limitedReports = allReports.slice(0, reportLimit);
        
        // Calculate combined statistics
        const statsAll = { attacks: 0, resources: 0, hours: 0, capacity: 0 };
        
        allReports.forEach(report => {
            statsAll.attacks++;
            statsAll.resources += report.totalResources;
            statsAll.hours += report.duration / 60;
            statsAll.capacity += report.capacity;
        });
        
        const calculateMetrics = (stats) => {
            return {
                resourcesPerHour: stats.hours > 0 ? Math.round(stats.resources / stats.hours) : 0,
                fillRate: stats.capacity > 0 ? Math.round(stats.resources / stats.capacity * 100) : 0,
                resourcesPerAttack: stats.attacks > 0 ? Math.round(stats.resources / stats.attacks) : 0
            };
        };
        
        const metricsAll = calculateMetrics(statsAll);
        
        // Group reports by village coordinates
        const villageGroups = {};
        allReports.forEach(report => {
            if (report.coordinates) {
                const key = report.coordinates;
                if (!villageGroups[key]) {
                    villageGroups[key] = {
                        coordinates: key,
                        attacks: [],
                        totalResources: 0,
                        totalDuration: 0,
                        totalCapacity: 0,
                        distance: report.distance
                    };
                }
                villageGroups[key].attacks.push(report);
                villageGroups[key].totalResources += report.totalResources;
                villageGroups[key].totalDuration += report.duration;
                villageGroups[key].totalCapacity += report.capacity;
            }
        });
        
        const villageData = Object.values(villageGroups);
        
        // Calculate village statistics
        villageData.forEach(village => {
            village.attackCount = village.attacks.length;
            village.avgTime = Math.round(village.totalDuration / village.attackCount);
            village.resourcesPerAttack = Math.round(village.totalResources / village.attackCount);
            village.avgFillRate = village.totalCapacity > 0 ? 
                Math.round(village.totalResources / village.totalCapacity * 100) : 0;
            
            // Calculate average troops
            village.avgTroops = village.attacks.reduce((acc, attack) => {
                for (const troop in attack.troops) {
                    acc[troop] = (acc[troop] || 0) + attack.troops[troop];
                }
                return acc;
            }, {});
            
            for (const troop in village.avgTroops) {
                village.avgTroops[troop] = Math.round(village.avgTroops[troop] / village.attackCount);
            }
        });
        
        // Sort villages by distance
        villageData.sort((a, b) => a.distance - b.distance);
        
        // Prepare data for charts
        const chartData = prepareChartData(allReports);
        
        // Build HTML
        let html = `
        <div style="background:white;padding:10px;border:2px solid #000;max-height:80vh;overflow:auto;">
            <button id="closeStatsBtn" style="float:right;background:red;color:white;border:none;padding:5px 10px;cursor:pointer;">X</button>
            
            <div style="margin-bottom:10px">
                <label>Show last 
                    <input type="number" id="reportLimit" value="${reportLimit}" style="width:60px"> reports
                </label>
                <button id="applyLimitBtn" style="margin-left:10px;padding:2px 8px;font-size:11px;cursor:pointer;">Apply</button>
            </div>
            
            ${createWorldSelector()}
            
            <div style="background:#fff4e6;padding:10px;border-radius:5px;border:1px solid #ffb74d;margin-bottom:15px;">
                <div style="font-weight:bold;color:#e65100;">📊 Combined Statistics (All Worlds)</div>
            </div>
            
            ${createTroopSpeedInputs()}
            
            <div id="chartsContainer" style="margin-bottom:20px;background:#f9f9f9;padding:10px;border-radius:5px;border:1px solid #ddd;">
                <div style="text-align:center;margin-bottom:10px;font-weight:bold;color:#333;">Farming Statistics Charts</div>
                <div id="highchartsContainer"></div>
            </div>
            
            <div style="margin-bottom:20px;background:#f0f8ff;padding:10px;border-radius:5px;border:1px solid #ddd;">
                <div style="font-weight:bold;margin-bottom:10px;color:#333;">Summary Statistics (All Worlds)</div>
                <table border="1" style="background:white;color:black;font-size:11px;width:100%;border-collapse:collapse;">
                    <tr>
                        <th>Total Attacks</th>
                        <th>Total Resources</th>
                        <th>Resources/Hour</th>
                        <th>Avg Fill Rate</th>
                        <th>Resources/Attack</th>
                        <th>Total Hours</th>
                    </tr>
                    <tr>
                        <td>${statsAll.attacks}</td>
                        <td>${statsAll.resources.toLocaleString()}</td>
                        <td>${metricsAll.resourcesPerHour.toLocaleString()}</td>
                        <td>${metricsAll.fillRate}%</td>
                        <td>${metricsAll.resourcesPerAttack.toLocaleString()}</td>
                        <td>${Math.round(statsAll.hours * 10) / 10}</td>
                    </tr>
                </table>
            </div>`;
        
        // World summary table
        if (Object.keys(storage.worlds).length > 1) {
            html += `
                <div style="margin-bottom:20px;background:#f0fff0;padding:10px;border-radius:5px;border:1px solid #81c784;">
                    <div style="font-weight:bold;margin-bottom:10px;color:#2e7d32;">World Statistics</div>
                    <table border="1" style="background:white;color:black;font-size:11px;width:100%;border-collapse:collapse;">
                        <tr>
                            <th>World</th>
                            <th>Reports</th>
                            <th>Total Resources</th>
                            <th>Resources/Hour</th>
                            <th>Avg Fill Rate</th>
                        </tr>`;
            
            for (const world in storage.worlds) {
                const worldReports = Object.values(storage.worlds[world] || {});
                if (worldReports.length > 0) {
                    const worldStats = worldReports.reduce((acc, report) => {
                        acc.attacks++;
                        acc.resources += report.totalResources;
                        acc.hours += report.duration / 60;
                        acc.capacity += report.capacity;
                        return acc;
                    }, { attacks: 0, resources: 0, hours: 0, capacity: 0 });
                    
                    const worldMetrics = calculateMetrics(worldStats);
                    
                    html += `
                        <tr>
                            <td><a href="javascript:void(0)" class="world-link" data-world="${world}" 
                                   style="color:#0066cc;text-decoration:underline;cursor:pointer;">${world}</a></td>
                            <td>${worldReports.length}</td>
                            <td>${worldStats.resources.toLocaleString()}</td>
                            <td>${worldMetrics.resourcesPerHour.toLocaleString()}</td>
                            <td>${worldMetrics.fillRate}%</td>
                        </tr>`;
                }
            }
            
            html += `</table></div>`;
        }
        
        // Village statistics table
        if (villageData.length > 0) {
            html += `
                <table border="1" style="background:white;color:black;font-size:11px;width:100%;border-collapse:collapse;margin-bottom:20px;">
                    <tr>
                        <th>Coordinates</th>
                        <th>Distance</th>
                        <th>Avg Time (min)</th>
                        <th>Attacks</th>
                        <th>Total Resources</th>
                        <th>Resources/Attack</th>
                        <th>Avg Fill Rate</th>
                        <th>SC</th>
                        <th>SW</th>
                        <th>AX</th>
                        <th>AR</th>
                        <th>LC</th>
                        <th>HV</th>
                        <th>HR</th>
                        <th>KN</th>
                    </tr>`;
            
            villageData.forEach(village => {
                html += `
                    <tr>
                        <td>${village.coordinates}</td>
                        <td>${village.distance}</td>
                        <td>${village.avgTime} min</td>
                        <td>${village.attackCount}</td>
                        <td>${village.totalResources.toLocaleString()}</td>
                        <td>${village.resourcesPerAttack.toLocaleString()}</td>
                        <td>${village.avgFillRate}%</td>
                        <td>${village.avgTroops.sc || 0}</td>
                        <td>${village.avgTroops.sw || 0}</td>
                        <td>${village.avgTroops.ax || 0}</td>
                        <td>${village.avgTroops.ar || 0}</td>
                        <td>${village.avgTroops.lc || 0}</td>
                        <td>${village.avgTroops.hv || 0}</td>
                        <td>${village.avgTroops.hr || 0}</td>
                        <td>${village.avgTroops.kn || 0}</td>
                    </tr>`;
            });
            
            html += `</table>`;
        }
        
        // Detailed reports table
        html += `
            <table border="1" style="background:white;color:black;font-size:11px;width:100%;border-collapse:collapse;">
                <tr>
                    <th>ID</th>
                    <th>Created</th>
                    <th>Coordinates</th>
                    <th>Dist</th>
                    <th>Duration</th>
                    <th>Wood</th>
                    <th>Stone</th>
                    <th>Iron</th>
                    <th>Total</th>
                    <th>Capacity</th>
                    <th>Fill Rate</th>
                    <th>Per Hour</th>
                    <th>SC</th>
                    <th>SW</th>
                    <th>AX</th>
                    <th>AR</th>
                    <th>LC</th>
                    <th>HV</th>
                    <th>HR</th>
                    <th>KN</th>
                </tr>`;
        
        limitedReports.forEach(report => {
            const minutes = Math.floor(report.duration);
            const durationDisplay = minutes + ' min';
            
            let createdDate = report.created;
            if (createdDate) {
                const date = new Date(createdDate);
                date.setHours(date.getHours() + 3);
                createdDate = date.toISOString().replace('T', ' ').substring(0, 19);
            }
            
            html += `
                <tr>
                    <td>${report.id}</td>
                    <td>${createdDate}</td>
                    <td>${report.coordinates}</td>
                    <td>${report.distance}</td>
                    <td>${durationDisplay}</td>
                    <td>${report.resources.wood.toLocaleString()}</td>
                    <td>${report.resources.stone.toLocaleString()}</td>
                    <td>${report.resources.iron.toLocaleString()}</td>
                    <td>${report.totalResources.toLocaleString()}</td>
                    <td>${report.capacity.toLocaleString()}</td>
                    <td>${report.fillRate}%</td>
                    <td>${report.resourcesPerHour.toLocaleString()}</td>
                    <td>${report.troops.sc || 0}</td>
                    <td>${report.troops.sw || 0}</td>
                    <td>${report.troops.ax || 0}</td>
                    <td>${report.troops.ar || 0}</td>
                    <td>${report.troops.lc || 0}</td>
                    <td>${report.troops.hv || 0}</td>
                    <td>${report.troops.hr || 0}</td>
                    <td>${report.troops.kn || 0}</td>
                </tr>`;
        });
        
        html += `</table></div>`;
        
        // Remove existing popups
        const existingPopups = document.querySelectorAll('div[style*="position: fixed"][style*="z-index: 10000"][style*="background: white"], div[style*="position:fixed"][style*="z-index:10000"][style*="background:white"]');
        existingPopups.forEach(popup => popup.parentNode.removeChild(popup));
        
        // Create and show popup
        const popup = document.createElement('div');
        popup.innerHTML = html;
        popup.style.position = 'fixed';
        popup.style.top = '20px';
        popup.style.left = '20px';
        popup.style.zIndex = '10000';
        popup.style.background = 'white';
        popup.style.padding = '10px';
        popup.style.maxWidth = '95vw';
        popup.style.maxHeight = '95vh';
        popup.style.overflow = 'auto';
        popup.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        popup.id = 'tribalwars-stats-popup';
        
        document.body.appendChild(popup);
        
        // Create simple charts immediately
        setTimeout(() => {
            createSimpleCharts(chartData, 'highchartsContainer');
        }, 100);
        
        // SETUP EVENT DELEGATION
        setupEventDelegation();
    }
    
    // Function to show stats for a specific world
    function showStatsForWorld(worldName, reportLimit = 100) {
        const worldReports = storage.worlds[worldName] || {};
        
        // Convert to array
        const reports = Object.values(worldReports).sort((a, b) => 
            new Date(b.created) - new Date(a.created)
        );
        
        const limitedReports = reports.slice(0, reportLimit);
        
        // Calculate statistics for this world
        const stats = { attacks: 0, resources: 0, hours: 0, capacity: 0 };
        
        reports.forEach(report => {
            stats.attacks++;
            stats.resources += report.totalResources;
            stats.hours += report.duration / 60;
            stats.capacity += report.capacity;
        });
        
        const metrics = {
            resourcesPerHour: stats.hours > 0 ? Math.round(stats.resources / stats.hours) : 0,
            fillRate: stats.capacity > 0 ? Math.round(stats.resources / stats.capacity * 100) : 0,
            resourcesPerAttack: stats.attacks > 0 ? Math.round(stats.resources / stats.attacks) : 0
        };
        
        // Group by village
        const villageGroups = {};
        reports.forEach(report => {
            if (report.coordinates) {
                const key = report.coordinates;
                if (!villageGroups[key]) {
                    villageGroups[key] = {
                        coordinates: key,
                        attacks: [],
                        totalResources: 0,
                        totalDuration: 0,
                        totalCapacity: 0,
                        distance: report.distance
                    };
                }
                villageGroups[key].attacks.push(report);
                villageGroups[key].totalResources += report.totalResources;
                villageGroups[key].totalDuration += report.duration;
                villageGroups[key].totalCapacity += report.capacity;
            }
        });
        
        const villageData = Object.values(villageGroups);
        
        // Calculate village statistics
        villageData.forEach(village => {
            village.attackCount = village.attacks.length;
            village.avgTime = Math.round(village.totalDuration / village.attackCount);
            village.resourcesPerAttack = Math.round(village.totalResources / village.attackCount);
            village.avgFillRate = village.totalCapacity > 0 ? 
                Math.round(village.totalResources / village.totalCapacity * 100) : 0;
            
            // Calculate average troops
            village.avgTroops = village.attacks.reduce((acc, attack) => {
                for (const troop in attack.troops) {
                    acc[troop] = (acc[troop] || 0) + attack.troops[troop];
                }
                return acc;
            }, {});
            
            for (const troop in village.avgTroops) {
                village.avgTroops[troop] = Math.round(village.avgTroops[troop] / village.attackCount);
            }
        });
        
        // Sort villages by distance
        villageData.sort((a, b) => a.distance - b.distance);
        
        // Prepare chart data
        const chartData = prepareChartData(reports);
        
        // Build HTML
        let html = `
        <div style="background:white;padding:10px;border:2px solid #000;max-height:80vh;overflow:auto;">
            <button id="closeStatsBtn" style="float:right;background:red;color:white;border:none;padding:5px 10px;cursor:pointer;">X</button>
            
            <div style="margin-bottom:10px">
                <label>Show last 
                    <input type="number" id="reportLimit" value="${reportLimit}" style="width:60px"> reports
                </label>
                <button id="applyLimitBtn" style="margin-left:10px;padding:2px 8px;font-size:11px;cursor:pointer;">Apply</button>
            </div>
            
            ${createWorldSelector()}
            
            <div style="background:#e0f7e0;padding:10px;border-radius:5px;border:1px solid #4CAF50;margin-bottom:15px;">
                <div style="font-weight:bold;color:#2e7d32;">World: <span style="background:#4CAF50;color:white;padding:2px 8px;border-radius:3px;">${worldName}</span></div>
            </div>
            
            ${createTroopSpeedInputs()}
            
            <div id="chartsContainer" style="margin-bottom:20px;background:#f9f9f9;padding:10px;border-radius:5px;border:1px solid #ddd;">
                <div style="text-align:center;margin-bottom:10px;font-weight:bold;color:#333;">Farming Statistics Charts</div>
                <div id="highchartsContainer"></div>
            </div>
            
            <div style="margin-bottom:20px;background:#f0f8ff;padding:10px;border-radius:5px;border:1px solid #ddd;">
                <div style="font-weight:bold;margin-bottom:10px;color:#333;">Summary Statistics (${worldName})</div>
                <table border="1" style="background:white;color:black;font-size:11px;width:100%;border-collapse:collapse;">
                    <tr>
                        <th>Total Attacks</th>
                        <th>Total Resources</th>
                        <th>Resources/Hour</th>
                        <th>Avg Fill Rate</th>
                        <th>Resources/Attack</th>
                        <th>Total Hours</th>
                    </tr>
                    <tr>
                        <td>${stats.attacks}</td>
                        <td>${stats.resources.toLocaleString()}</td>
                        <td>${metrics.resourcesPerHour.toLocaleString()}</td>
                        <td>${metrics.fillRate}%</td>
                        <td>${metrics.resourcesPerAttack.toLocaleString()}</td>
                        <td>${Math.round(stats.hours * 10) / 10}</td>
                    </tr>
                </table>
            </div>`;
        
        // Village statistics table
        if (villageData.length > 0) {
            html += `
                <table border="1" style="background:white;color:black;font-size:11px;width:100%;border-collapse:collapse;margin-bottom:20px;">
                    <tr>
                        <th>Coordinates</th>
                        <th>Distance</th>
                        <th>Avg Time (min)</th>
                        <th>Attacks</th>
                        <th>Total Resources</th>
                        <th>Resources/Attack</th>
                        <th>Avg Fill Rate</th>
                        <th>SC</th>
                        <th>SW</th>
                        <th>AX</th>
                        <th>AR</th>
                        <th>LC</th>
                        <th>HV</th>
                        <th>HR</th>
                        <th>KN</th>
                    </tr>`;
            
            villageData.forEach(village => {
                html += `
                    <tr>
                        <td>${village.coordinates}</td>
                        <td>${village.distance}</td>
                        <td>${village.avgTime} min</td>
                        <td>${village.attackCount}</td>
                        <td>${village.totalResources.toLocaleString()}</td>
                        <td>${village.resourcesPerAttack.toLocaleString()}</td>
                        <td>${village.avgFillRate}%</td>
                        <td>${village.avgTroops.sc || 0}</td>
                        <td>${village.avgTroops.sw || 0}</td>
                        <td>${village.avgTroops.ax || 0}</td>
                        <td>${village.avgTroops.ar || 0}</td>
                        <td>${village.avgTroops.lc || 0}</td>
                        <td>${village.avgTroops.hv || 0}</td>
                        <td>${village.avgTroops.hr || 0}</td>
                        <td>${village.avgTroops.kn || 0}</td>
                    </tr>`;
            });
            
            html += `</table>`;
        }
        
        // Detailed reports table
        html += `
            <table border="1" style="background:white;color:black;font-size:11px;width:100%;border-collapse:collapse;">
                <tr>
                    <th>ID</th>
                    <th>Created</th>
                    <th>Coordinates</th>
                    <th>Dist</th>
                    <th>Duration</th>
                    <th>Wood</th>
                    <th>Stone</th>
                    <th>Iron</th>
                    <th>Total</th>
                    <th>Capacity</th>
                    <th>Fill Rate</th>
                    <th>Per Hour</th>
                    <th>SC</th>
                    <th>SW</th>
                    <th>AX</th>
                    <th>AR</th>
                    <th>LC</th>
                    <th>HV</th>
                    <th>HR</th>
                    <th>KN</th>
                </tr>`;
        
        limitedReports.forEach(report => {
            const minutes = Math.floor(report.duration);
            const durationDisplay = minutes + ' min';
            
            let createdDate = report.created;
            if (createdDate) {
                const date = new Date(createdDate);
                date.setHours(date.getHours() + 3);
                createdDate = date.toISOString().replace('T', ' ').substring(0, 19);
            }
            
            html += `
                <tr>
                    <td>${report.id}</td>
                    <td>${createdDate}</td>
                    <td>${report.coordinates}</td>
                    <td>${report.distance}</td>
                    <td>${durationDisplay}</td>
                    <td>${report.resources.wood.toLocaleString()}</td>
                    <td>${report.resources.stone.toLocaleString()}</td>
                    <td>${report.resources.iron.toLocaleString()}</td>
                    <td>${report.totalResources.toLocaleString()}</td>
                    <td>${report.capacity.toLocaleString()}</td>
                    <td>${report.fillRate}%</td>
                    <td>${report.resourcesPerHour.toLocaleString()}</td>
                    <td>${report.troops.sc || 0}</td>
                    <td>${report.troops.sw || 0}</td>
                    <td>${report.troops.ax || 0}</td>
                    <td>${report.troops.ar || 0}</td>
                    <td>${report.troops.lc || 0}</td>
                    <td>${report.troops.hv || 0}</td>
                    <td>${report.troops.hr || 0}</td>
                    <td>${report.troops.kn || 0}</td>
                </tr>`;
        });
        
        html += `</table></div>`;
        
        // Remove existing popups
        const existingPopups = document.querySelectorAll('div[style*="position: fixed"][style*="z-index: 10000"][style*="background: white"], div[style*="position:fixed"][style*="z-index:10000"][style*="background:white"]');
        existingPopups.forEach(popup => popup.parentNode.removeChild(popup));
        
        // Create and show popup
        const popup = document.createElement('div');
        popup.innerHTML = html;
        popup.style.position = 'fixed';
        popup.style.top = '20px';
        popup.style.left = '20px';
        popup.style.zIndex = '10000';
        popup.style.background = 'white';
        popup.style.padding = '10px';
        popup.style.maxWidth = '95vw';
        popup.style.maxHeight = '95vh';
        popup.style.overflow = 'auto';
        popup.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        popup.id = 'tribalwars-stats-popup';
        
        document.body.appendChild(popup);
        
        // Create simple charts immediately
        setTimeout(() => {
            createSimpleCharts(chartData, 'highchartsContainer');
        }, 100);
        
        // SETUP EVENT DELEGATION
        setupEventDelegation(worldName);
    }
    
    // Event delegation setup function
    function setupEventDelegation(currentWorld = null) {
        // Use event delegation for the popup
        const popup = document.getElementById('tribalwars-stats-popup');
        if (!popup) return;
        
        // Helper function to get the current world
        const getCurrentDisplayedWorld = () => {
            return currentWorld || getCurrentWorld();
        };
        
        // Event listener for the popup
        popup.addEventListener('click', function(event) {
            const target = event.target;
            
            // 1. Close button
            if (target.id === 'closeStatsBtn' || target.closest('#closeStatsBtn')) {
                this.remove();
                return;
            }
            
            // 2. Apply limit button
            if (target.id === 'applyLimitBtn' || target.closest('#applyLimitBtn')) {
                const limitInput = document.getElementById('reportLimit');
                const limit = parseInt(limitInput.value) || 100;
                
                if (currentWorld) {
                    showStatsForWorld(currentWorld, limit);
                } else {
                    showStats(limit);
                }
                return;
            }
            
            // 3. World selector dropdown
            if (target.id === 'worldSelector') {
                const world = target.value;
                if (world) {
                    showStatsForWorld(world);
                } else {
                    showStats();
                }
                return;
            }
            
            // 4. World links in the table
            if (target.classList.contains('world-link') || target.closest('.world-link')) {
                const worldLink = target.classList.contains('world-link') ? target : target.closest('.world-link');
                const world = worldLink.getAttribute('data-world');
                if (world) {
                    showStatsForWorld(world);
                }
                return;
            }
            
            // 5. Save troop speeds button
            if (target.id === 'saveTroopSpeedsBtn' || target.closest('#saveTroopSpeedsBtn')) {
                saveTroopSpeeds();
                return;
            }
            
            // 6. Reset troop speeds button
            if (target.id === 'resetTroopSpeedsBtn' || target.closest('#resetTroopSpeedsBtn')) {
                resetTroopSpeeds();
                return;
            }
        });
        
        // Also handle Enter key in report limit input
        const limitInput = document.getElementById('reportLimit');
        if (limitInput) {
            limitInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    const limit = parseInt(this.value) || 100;
                    if (currentWorld) {
                        showStatsForWorld(currentWorld, limit);
                    } else {
                        showStats(limit);
                    }
                }
            });
        }
        
        // Add some console logging for debugging
        console.log('Event delegation setup complete. Current world:', currentWorld);
    }
    
    // Also need to update the saveTroopSpeeds and resetTroopSpeeds functions
    // to work with event delegation (they should already work as they use getElementById)
    
    // Function to save troop speeds
    function saveTroopSpeeds() {
        try {
            console.log('saveTroopSpeeds called');
            
            const troopTypes = ['sc', 'sw', 'ax', 'ar', 'lc', 'hv', 'hr', 'kn'];
            const newSpeeds = {};
            
            troopTypes.forEach(code => {
                const input = document.getElementById(`speed_${code}`);
                if (input) {
                    const value = parseInt(input.value);
                    newSpeeds[code] = isNaN(value) ? 18 : Math.max(1, Math.min(100, value));
                }
            });
            
            console.log('New speeds to save:', newSpeeds);
            
            // Get current storage
            const currentStorage = JSON.parse(localStorage.getItem('tribalwars-farm') || '{}');
            if (!currentStorage.troopSpeeds) {
                currentStorage.troopSpeeds = {};
            }
            
            // Update speeds
            currentStorage.troopSpeeds = newSpeeds;
            
            // Save to localStorage
            localStorage.setItem('tribalwars-farm', JSON.stringify(currentStorage));
            console.log('Speeds saved successfully');
            
            // Update the global storage reference
            if (typeof storage !== 'undefined') {
                storage.troopSpeeds = newSpeeds;
            }
            
            // Show visual feedback
            const saveBtn = document.getElementById('saveTroopSpeedsBtn');
            if (saveBtn) {
                const originalText = saveBtn.textContent;
                saveBtn.textContent = '✅ Saved!';
                saveBtn.style.background = '#45a049';
                
                setTimeout(() => {
                    saveBtn.textContent = originalText;
                    saveBtn.style.background = '#4CAF50';
                }, 2000);
            }
            
        } catch (error) {
            console.error('Error in saveTroopSpeeds:', error);
            alert('Error saving troop speeds: ' + error.message);
        }
    }
    
    // Function to reset troop speeds to default
    function resetTroopSpeeds() {
        try {
            console.log('resetTroopSpeeds called');
            
            const defaultSpeeds = {
                sc: 18, sw: 22, ax: 18, ar: 18,
                lc: 10, hv: 11, hr: 10, kn: 18
            };
            
            // Get current storage
            const currentStorage = JSON.parse(localStorage.getItem('tribalwars-farm') || '{}');
            currentStorage.troopSpeeds = defaultSpeeds;
            
            // Save to localStorage
            localStorage.setItem('tribalwars-farm', JSON.stringify(currentStorage));
            console.log('Speeds reset successfully');
            
            // Update the global storage reference
            if (typeof storage !== 'undefined') {
                storage.troopSpeeds = defaultSpeeds;
            }
            
            // Update input values
            Object.keys(defaultSpeeds).forEach(code => {
                const input = document.getElementById(`speed_${code}`);
                if (input) {
                    input.value = defaultSpeeds[code];
                }
            });
            
            // Show visual feedback
            const resetBtn = document.getElementById('resetTroopSpeedsBtn');
            if (resetBtn) {
                const originalText = resetBtn.textContent;
                resetBtn.textContent = '✅ Reset!';
                resetBtn.style.background = '#e68900';
                
                setTimeout(() => {
                    resetBtn.textContent = originalText;
                    resetBtn.style.background = '#ff9800';
                }, 2000);
            }
            
        } catch (error) {
            console.error('Error in resetTroopSpeeds:', error);
            alert('Error resetting troop speeds: ' + error.message);
        }
    }
    
    // Function to process a single report
    async function processReport(link) {
        const reportId = link.getAttribute('data-id');
        const dateCell = link.closest('tr').querySelector('td:nth-child(3)');
        
        let createdDate = '';
        let coordinates = '';
        
        // Extract coordinates from link text
        const coordMatches = link.innerText.match(/\((\d+)\|(\d+)\)/g);
        if (coordMatches && coordMatches.length >= 2) {
            coordinates = coordMatches[1].replace(/[()]/g, '');
        }
        
        // Parse date
        if (dateCell) {
            const dateText = dateCell.textContent.trim();
            const currentYear = new Date().getFullYear();
            
            // Replace Russian month abbreviations
            const normalizedDate = dateText
                .replace(/нояб\./g, 'Nov')
                .replace(/дек\./g, 'Dec')
                .replace(/янв\./g, 'Jan')
                .replace(/фев\./g, 'Feb')
                .replace(/мар\./g, 'Mar')
                .replace(/апр\./g, 'Apr')
                .replace(/май/g, 'May')
                .replace(/июн/g, 'Jun')
                .replace(/июл/g, 'Jul')
                .replace(/авг/g, 'Aug')
                .replace(/сен/g, 'Sep')
                .replace(/окт/g, 'Oct');
            
            try {
                const date = new Date(normalizedDate + ' ' + currentYear);
                date.setHours(date.getHours() + 3);
                createdDate = date.toISOString().replace('T', ' ').substring(0, 19);
            } catch (error) {
                createdDate = '';
            }
        }
        
        // Hover over the link to load report data
        link.dispatchEvent(new MouseEvent('mouseover'));
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
        
        // Extract resources
        const resourcesContainer = document.querySelector('#attack_results');
        const troopsContainer = document.querySelector('#attack_info_att_units');
        
        if (!resourcesContainer || !troopsContainer) {
            link.dispatchEvent(new MouseEvent('mouseout'));
            console.log('No attack data found');
            return null;
        }
        
        // Parse resources
        const resources = { wood: 0, stone: 0, iron: 0 };
        const resourceElements = resourcesContainer.querySelectorAll('span.nowrap');
        
        resourceElements.forEach(element => {
            const text = element.textContent.trim();
            const value = parseInt(text.replace(/[^\d]/g, '')) || 0;
            
            if (element.querySelector('.wood')) {
                resources.wood = value;
            } else if (element.querySelector('.stone')) {
                resources.stone = value;
            } else if (element.querySelector('.iron')) {
                resources.iron = value;
            }
        });
        
        // Parse troops
        const troops = {};
        const troopElements = troopsContainer.querySelectorAll('td[class*="unit-item-"]');
        
        troopElements.forEach(element => {
            const count = parseInt(element.textContent) || 0;
            if (count > 0) {
                if (element.classList.contains('unit-item-spear')) {
                    troops.sc = count; // Spear
                } else if (element.classList.contains('unit-item-sword')) {
                    troops.sw = count; // Sword
                } else if (element.classList.contains('unit-item-axe')) {
                    troops.ax = count; // Axe
                } else if (element.classList.contains('unit-item-archer')) {
                    troops.ar = count; // Archer
                } else if (element.classList.contains('unit-item-light')) {
                    troops.lc = count; // Light cavalry
                } else if (element.classList.contains('unit-item-heavy')) {
                    troops.hv = count; // Heavy cavalry
                } else if (element.classList.contains('unit-item-marcher')) {
                    troops.hr = count; // Horse archer
                } else if (element.classList.contains('unit-item-knight')) {
                    troops.kn = count; // Knight
                }
            }
        });
        
        // Calculate distance and duration USING CUSTOM TROOP SPEEDS
        let distance = 0;
        let troopSpeed = '';
        
        if (coordMatches && coordMatches.length >= 2) {
            const myCoords = coordMatches[0].match(/\d+/g);
            const targetCoords = coordMatches[1].match(/\d+/g);
            
            distance = Math.sqrt(
                Math.pow(myCoords[0] - targetCoords[0], 2) + 
                Math.pow(myCoords[1] - targetCoords[1], 2)
            );
            
            // Use custom troop speeds from storage
            const speeds = storage.troopSpeeds;
            
            // Find the slowest troop type that has troops
            let slowestSpeed = Infinity;
            for (const troop in troops) {
                if (troops[troop] > 0 && speeds[troop]) {
                    if (speeds[troop] < slowestSpeed) {
                        slowestSpeed = speeds[troop];
                        troopSpeed = slowestSpeed;
                    }
                }
            }
        }
        
        const duration = troopSpeed ? distance * troopSpeed * 2 : distance * 18 * 2;
        const totalResources = resources.wood + resources.stone + resources.iron;
        const resourcesPerHour = duration > 0 ? Math.round(totalResources / (duration / 60)) : 0;
        
        // Calculate capacity
        const capacities = { 
            sc: 25,   // Spear
            sw: 15,   // Sword
            ax: 10,   // Axe
            ar: 11,   // Archer
            lc: 80,   // Light cavalry
            hv: 50,   // Heavy cavalry
            hr: 53,   // Horse archer
            kn: 200   // Knight
        };
        
        let capacity = 0;
        for (const troop in troops) {
            if (capacities[troop]) {
                capacity += troops[troop] * capacities[troop];
            }
        }
        
        const fillRate = capacity > 0 ? Math.round(totalResources / capacity * 100) : 0;
        
        // Remove hover
        link.dispatchEvent(new MouseEvent('mouseout'));
        
        // Create report object
        const report = {
            id: reportId,
            troops: troops,
            distance: Math.round(distance * 10) / 10,
            duration: duration,
            resources: resources,
            totalResources: totalResources,
            resourcesPerHour: Math.round(resourcesPerHour),
            created: createdDate,
            coordinates: coordinates,
            capacity: capacity,
            fillRate: fillRate
        };
        
        return report;
    }
    
    // Main execution
    const farmReports = filterFarmReports();
    
    if (farmReports.length === 0) {
        showStats();
        return;
    }
    
    // Create progress indicator
    const progressDiv = document.createElement('div');
    progressDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #333;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 10000;
        min-width: 200px;
        font-family: Arial;
    `;
    
    progressDiv.innerHTML = `
        <div style="margin-bottom:8px;font-size:12px;">
            Processing reports: <span id="progress">0/${farmReports.length}</span>
        </div>
        <div style="background:#555;height:10px;border-radius:5px;overflow:hidden;">
            <div id="progressBar" style="height:100%;background:#4CAF50;width:0%;transition:width 0.3s"></div>
        </div>
    `;
    
    document.body.appendChild(progressDiv);
    
    let processedCount = 0;
    
    // Process reports sequentially
    async function processAllReports() {
        for (const reportLink of farmReports) {
            try {
                const reportData = await processReport(reportLink);
                
                if (reportData) {
                    processedCount++;
                    
                    // Update progress
                    const progressEl = document.getElementById('progress');
                    const progressBar = document.getElementById('progressBar');
                    if (progressEl) progressEl.textContent = `${processedCount}/${farmReports.length}`;
                    if (progressBar) progressBar.style.width = `${(processedCount / farmReports.length) * 100}%`;
                    
                    // DEFENSIVE: Ensure storage structure is still valid before saving
                    if (!storage.worlds) storage.worlds = {};
                    if (!storage.worlds[currentWorld]) storage.worlds[currentWorld] = {};
                    
                    // Save to storage for current world
                    storage.worlds[currentWorld][reportData.id] = reportData;
                    
                    try {
                        localStorage.setItem('tribalwars-farm', JSON.stringify(storage));
                    } catch (e) {
                        console.error('Error saving report to localStorage:', e);
                    }
                }
            } catch (error) {
                console.error('Error processing report:', error);
            }
        }
        
        // Show completion message
        progressDiv.innerHTML = `
            <div style="color:white;font-size:12px;">
                Completed! ${processedCount} reports processed
            </div>
        `;
        
        setTimeout(() => {
            document.body.removeChild(progressDiv);
            showStats();
        }, 2000);
    }
    
    // Start processing
    processAllReports();
})();
