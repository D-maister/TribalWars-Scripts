(function() {
    // Check if we're on the reports page
    const isReportPage = window.location.search.includes('screen=report');
    
    // Initialize storage if not exists
    if (!localStorage.getItem('tribalwars-farm')) {
        localStorage.setItem('tribalwars-farm', '{}');
    }
    
    const storage = JSON.parse(localStorage.getItem('tribalwars-farm'));
    
    // If not on report page, just show stats
    if (!isReportPage) {
        showStats();
        return;
    }
    
    // Function to filter farm reports
    function filterFarmReports() {
        const allLinks = Array.from(document.querySelectorAll('a.report-link'));
        const farmReports = [];
        
        for (const link of allLinks) {
            const reportId = link.getAttribute('data-id');
            
            // Skip already processed reports
            if (storage[reportId]) {
                continue;
            }
            
            const tableRow = link.closest('tr');
            
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
                            villages: new Set(),
                            resourcesPerAttack: 0
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
                color: '#4CAF50',
                tooltipPrefix: 'Attacks: '
            },
            { 
                title: 'Avg Resources per Attack', 
                data: chartData.resourcesPerAttackData, 
                color: '#2196F3',
                tooltipPrefix: 'Resources: ',
                formatValue: (val) => val.toLocaleString()
            },
            { 
                title: 'Unique Villages', 
                data: chartData.villagesData, 
                color: '#FF9800',
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
            chartContainer.style.minWidth = '300px';
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
            yAxisLabels.style.width = '30px';
            yAxisLabels.style.display = 'flex';
            yAxisLabels.style.flexDirection = 'column';
            yAxisLabels.style.justifyContent = 'space-between';
            yAxisLabels.style.padding = '5px 0';
            
            // Add y-axis grid lines and labels
            if (maxValue > 0) {
                for (let i = 0; i <= 4; i++) {
                    const value = Math.round((maxValue * i) / 4);
                    const label = document.createElement('div');
                    label.textContent = chartType.formatValue ? chartType.formatValue(value) : value;
                    label.style.fontSize = '9px';
                    label.style.color = '#666';
                    label.style.textAlign = 'right';
                    label.style.paddingRight = '5px';
                    yAxisLabels.appendChild(label);
                }
            }
            
            chartBars.appendChild(yAxisLabels);
            
            const barsContainer = document.createElement('div');
            barsContainer.style.marginLeft = '35px';
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
                bar.style.width = '100%';
                bar.style.height = barHeight + 'px';
                bar.style.backgroundColor = chartType.color;
                bar.style.borderRadius = '3px 3px 0 0';
                bar.style.position = 'absolute';
                bar.style.bottom = '0';
                bar.style.transition = 'all 0.3s ease';
                bar.style.cursor = 'pointer';
                
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
                
                barContainer.appendChild(bar);
                barContainer.appendChild(labelElement);
                barsContainer.appendChild(barContainer);
            });
            
            chartBars.appendChild(barsContainer);
            
            const xAxis = document.createElement('div');
            xAxis.style.height = '1px';
            xAxis.style.backgroundColor = '#ddd';
            xAxis.style.marginTop = '30px';
            xAxis.style.marginLeft = '35px';
            
            chartContainer.appendChild(chartBars);
            chartContainer.appendChild(xAxis);
            wrapper.appendChild(chartContainer);
        });
        
        container.appendChild(wrapper);
    }
    
    // Function to show statistics
    function showStats(reportLimit = 100) {
        const storedData = JSON.parse(localStorage.getItem('tribalwars-farm'));
        
        const now = new Date();
        
        // Define time periods
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last3days = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // Initialize counters for each period
        let stats24h = { attacks: 0, resources: 0, hours: 0, capacity: 0 };
        let stats3days = { attacks: 0, resources: 0, hours: 0, capacity: 0 };
        let stats7days = { attacks: 0, resources: 0, hours: 0, capacity: 0 };
        let stats30days = { attacks: 0, resources: 0, hours: 0, capacity: 0 };
        let statsAll = { attacks: 0, resources: 0, hours: 0, capacity: 0 };
        
        // Collect all reports
        const reports = [];
        for (const id in storedData) {
            reports.push(storedData[id]);
            statsAll.attacks++;
            statsAll.resources += storedData[id].totalResources;
            statsAll.hours += storedData[id].duration / 60;
            statsAll.capacity += storedData[id].capacity;
        }
        
        // Sort by date (newest first)
        reports.sort((a, b) => new Date(b.created) - new Date(a.created));
        
        // Limit reports for display
        const limitedReports = reports.slice(0, reportLimit);
        
        // Calculate statistics for each period
        for (const report of reports) {
            if (report.created) {
                const reportDate = new Date(report.created);
                
                if (reportDate >= last24h) {
                    stats24h.attacks++;
                    stats24h.resources += report.totalResources;
                    stats24h.hours += report.duration / 60;
                    stats24h.capacity += report.capacity;
                }
                
                if (reportDate >= last3days) {
                    stats3days.attacks++;
                    stats3days.resources += report.totalResources;
                    stats3days.hours += report.duration / 60;
                    stats3days.capacity += report.capacity;
                }
                
                if (reportDate >= last7days) {
                    stats7days.attacks++;
                    stats7days.resources += report.totalResources;
                    stats7days.hours += report.duration / 60;
                    stats7days.capacity += report.capacity;
                }
                
                if (reportDate >= last30days) {
                    stats30days.attacks++;
                    stats30days.resources += report.totalResources;
                    stats30days.hours += report.duration / 60;
                    stats30days.capacity += report.capacity;
                }
            }
        }
        
        // Calculate derived metrics
        const calculateMetrics = (stats) => {
            return {
                resourcesPerHour: stats.hours > 0 ? Math.round(stats.resources / stats.hours) : 0,
                fillRate: stats.capacity > 0 ? Math.round(stats.resources / stats.capacity * 100) : 0,
                resourcesPerAttack: stats.attacks > 0 ? Math.round(stats.resources / stats.attacks) : 0
            };
        };
        
        const metrics24h = calculateMetrics(stats24h);
        const metrics3days = calculateMetrics(stats3days);
        const metrics7days = calculateMetrics(stats7days);
        const metrics30days = calculateMetrics(stats30days);
        const metricsAll = calculateMetrics(statsAll);
        
        // Group reports by village coordinates
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
        
        // Prepare data for charts
        const chartData = prepareChartData(reports);
        
        // Build HTML
        let html = `
        <div style="background:white;padding:10px;border:2px solid #000;max-height:80vh;overflow:auto;">
            <button onclick="this.parentElement.remove()" style="float:right;background:red;color:white;border:none;padding:5px 10px;cursor:pointer;">X</button>
            
            <div style="margin-bottom:10px">
                <label>Show last 
                    <input type="number" id="reportLimit" value="${reportLimit}" style="width:60px" 
                           onchange="updateReportLimit(this.value)"> reports
                </label>
            </div>
            
            <div id="chartsContainer" style="margin-bottom:20px;background:#f9f9f9;padding:10px;border-radius:5px;border:1px solid #ddd;">
                <div style="text-align:center;margin-bottom:10px;font-weight:bold;color:#333;">Farming Statistics Charts</div>
                <div id="highchartsContainer"></div>
            </div>
            
            <table border="1" style="background:white;color:black;font-size:11px;width:100%;border-collapse:collapse;margin-bottom:20px;">
                <tr>
                    <th>Period</th>
                    <th>Attacks</th>
                    <th>Resources/Hour</th>
                    <th>Fill Rate</th>
                    <th>Resources/Attack</th>
                    <th>Total Resources</th>
                    <th>Total Hours</th>
                </tr>
                <tr>
                    <td>Last 24h</td>
                    <td>${stats24h.attacks}</td>
                    <td>${metrics24h.resourcesPerHour}</td>
                    <td>${metrics24h.fillRate}%</td>
                    <td>${metrics24h.resourcesPerAttack}</td>
                    <td>${stats24h.resources}</td>
                    <td>${Math.round(stats24h.hours * 10) / 10}</td>
                </tr>
                <tr>
                    <td>Last 3 days</td>
                    <td>${stats3days.attacks}</td>
                    <td>${metrics3days.resourcesPerHour}</td>
                    <td>${metrics3days.fillRate}%</td>
                    <td>${metrics3days.resourcesPerAttack}</td>
                    <td>${stats3days.resources}</td>
                    <td>${Math.round(stats3days.hours * 10) / 10}</td>
                </tr>
                <tr>
                    <td>Last 7 days</td>
                    <td>${stats7days.attacks}</td>
                    <td>${metrics7days.resourcesPerHour}</td>
                    <td>${metrics7days.fillRate}%</td>
                    <td>${metrics7days.resourcesPerAttack}</td>
                    <td>${stats7days.resources}</td>
                    <td>${Math.round(stats7days.hours * 10) / 10}</td>
                </tr>
                <tr>
                    <td>Last 30 days</td>
                    <td>${stats30days.attacks}</td>
                    <td>${metrics30days.resourcesPerHour}</td>
                    <td>${metrics30days.fillRate}%</td>
                    <td>${metrics30days.resourcesPerAttack}</td>
                    <td>${stats30days.resources}</td>
                    <td>${Math.round(stats30days.hours * 10) / 10}</td>
                </tr>
                <tr>
                    <td><b>All Time</b></td>
                    <td>${statsAll.attacks}</td>
                    <td>${metricsAll.resourcesPerHour}</td>
                    <td>${metricsAll.fillRate}%</td>
                    <td>${metricsAll.resourcesPerAttack}</td>
                    <td>${statsAll.resources}</td>
                    <td>${Math.round(statsAll.hours * 10) / 10}</td>
                </tr>
            </table>`;
        
        // Village statistics table
        html += `
            <table border="1" style="background:white;color:black;font-size:11px;width:100%;border-collapse:collapse;margin-bottom:20px;">
                <tr>
                    <th>Coordinates</th>
                    <th>Distance</th>
                    <th>Avg Time (min)</th>
                    <th>Attacks</th>
                    <th>Total</th>
                    <th>Resources/Attack</th>
                    <th>Avg Fill Rate</th>
                    <th>SC</th>
                    <th>SW</th>
                    <th>AX</th>
                    <th>LC</th>
                    <th>HV</th>
                    <th>KN</th>
                </tr>`;
        
        villageData.forEach(village => {
            html += `
                <tr>
                    <td>${village.coordinates}</td>
                    <td>${village.distance}</td>
                    <td>${village.avgTime} min</td>
                    <td>${village.attackCount}</td>
                    <td>${village.totalResources}</td>
                    <td>${village.resourcesPerAttack}</td>
                    <td>${village.avgFillRate}%</td>
                    <td>${village.avgTroops.sc || 0}</td>
                    <td>${village.avgTroops.sw || 0}</td>
                    <td>${village.avgTroops.ax || 0}</td>
                    <td>${village.avgTroops.lc || 0}</td>
                    <td>${village.avgTroops.hv || 0}</td>
                    <td>${village.avgTroops.kn || 0}</td>
                </tr>`;
        });
        
        html += `</table>`;
        
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
                    <th>LC</th>
                    <th>HV</th>
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
                    <td>${report.resources.wood}</td>
                    <td>${report.resources.stone}</td>
                    <td>${report.resources.iron}</td>
                    <td>${report.totalResources}</td>
                    <td>${report.capacity}</td>
                    <td>${report.fillRate}%</td>
                    <td>${report.resourcesPerHour}</td>
                    <td>${report.troops.sc || 0}</td>
                    <td>${report.troops.sw || 0}</td>
                    <td>${report.troops.ax || 0}</td>
                    <td>${report.troops.lc || 0}</td>
                    <td>${report.troops.hv || 0}</td>
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
        
        document.body.appendChild(popup);
        
        // Create simple charts immediately (no external dependencies)
        setTimeout(() => {
            createSimpleCharts(chartData, 'highchartsContainer');
        }, 100);
        
        // Global function to update report limit
        window.updateReportLimit = function(limit) {
            showStats(parseInt(limit));
        };
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
                    troops.sc = count;
                } else if (element.classList.contains('unit-item-sword')) {
                    troops.sw = count;
                } else if (element.classList.contains('unit-item-axe')) {
                    troops.ax = count;
                } else if (element.classList.contains('unit-item-light')) {
                    troops.lc = count;
                } else if (element.classList.contains('unit-item-heavy')) {
                    troops.hv = count;
                } else if (element.classList.contains('unit-item-knight')) {
                    troops.kn = count;
                }
            }
        });
        
        // Calculate distance and duration
        let distance = 0;
        let troopSpeed = '';
        
        if (coordMatches && coordMatches.length >= 2) {
            const myCoords = coordMatches[0].match(/\d+/g);
            const targetCoords = coordMatches[1].match(/\d+/g);
            
            distance = Math.sqrt(
                Math.pow(myCoords[0] - targetCoords[0], 2) + 
                Math.pow(myCoords[1] - targetCoords[1], 2)
            );
            
            // Troop speeds
            const speeds = { sc: 18, sw: 22, ax: 18, lc: 10, hv: 11, kn: 18 };
            
            for (const troop in troops) {
                if (troops[troop] > 0) {
                    troopSpeed = speeds[troop];
                    break;
                }
            }
        }
        
        const duration = troopSpeed ? distance * troopSpeed * 2 : distance * 18 * 2;
        const totalResources = resources.wood + resources.stone + resources.iron;
        const resourcesPerHour = duration > 0 ? Math.round(totalResources / (duration / 60)) : 0;
        
        // Calculate capacity
        const capacities = { sc: 25, sw: 15, ax: 10, lc: 80, hv: 50, kn: 200 };
        let capacity = 0;
        
        for (const troop in troops) {
            capacity += troops[troop] * capacities[troop];
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
                    document.getElementById('progress').textContent = 
                        `${processedCount}/${farmReports.length}`;
                    document.getElementById('progressBar').style.width = 
                        `${(processedCount / farmReports.length) * 100}%`;
                    
                    // Save to storage
                    storage[reportData.id] = reportData;
                    localStorage.setItem('tribalwars-farm', JSON.stringify(storage));
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
