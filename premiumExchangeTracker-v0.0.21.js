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
            'wood': '#8B4513',
            'stone': '#708090',
            'iron': '#C0C0C0'
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
            
            /* CHANGED: Fixed height for table container showing 10 rows */
            .tw-table-container {
                height: 290px; /* Approximately 10 rows * 29px each */
                overflow-y: auto;
                border: 1px solid #ddd;
                border-radius: 4px;
                margin-top: 10px;
                margin-bottom: 20px;
            }
            
            /* CHANGED: Ensure rows have consistent height */
            .tw-exchange-stat-table tbody tr {
                height: 26px;
                max-height: 26px;
                overflow: hidden;
            }
            
            .tw-exchange-stat-table tbody td {
                line-height: 1.2;
                padding: 2px 5px;
                max-height: 24px;
                overflow: hidden;
                white-space: nowrap;
            }
            
            .tw-hidden-rows-summary {
                background-color: #f0f0f0;
                font-style: italic;
                text-align: center;
                color: #666;
                padding: 4px;
                border-top: 1px dashed #999;
                font-size: 10px;
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
            
            /* CHANGED: Single column layout for charts */
            .tw-charts-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .tw-chart-container {
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 15px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                height: 300px;
                display: flex;
                flex-direction: column;
            }
            
            /* CHANGED: Dynamic chart title colors */
            .tw-chart-title {
                font-size: 16px;
                font-weight: bold;
                margin: 0 0 15px 0;
                text-align: center;
                padding: 8px;
                border-radius: 4px;
                transition: all 0.3s;
            }
            
            .tw-chart-title.min-price {
                background-color: #E8F5E9;
                color: #2E7D32;
                border-left: 4px solid #4CAF50;
            }
            
            .tw-chart-title.max-price {
                background-color: #FFEBEE;
                color: #D32F2F;
                border-left: 4px solid #f44336;
            }
            
            .tw-chart-title.normal-price {
                background-color: #E3F2FD;
                color: #1976D2;
                border-left: 4px solid #2196F3;
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
                font-size: 12px;
                color: #666;
                margin-top: 10px;
                padding: 5px;
                background-color: #f9f9f9;
                border-radius: 3px;
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
                font-size: 13px;
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
                stroke-width: 3;
            }
            
            .tw-chart-min-line {
                stroke: #4CAF50;
                stroke-width: 1.5;
                stroke-dasharray: 5,5;
                opacity: 0.8;
            }
            
            .tw-chart-max-line {
                stroke: #f44336;
                stroke-width: 1.5;
                stroke-dasharray: 5,5;
                opacity: 0.8;
            }
            
            .tw-chart-point {
                r: 4;
                transition: r 0.2s;
            }
            
            .tw-chart-point:hover {
                r: 6;
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
                height: 300px;
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

    // ... (keep all other methods the same until createChartsContainer) ...

    createLineChart(resource, container) {
        const filteredData = this.getFilteredDataForCharts();
        if (!filteredData.length) return;
        
        const cache = this.minMaxCache[resource] || { min: 0, max: 0, current: 0 };
        const svgContainer = container.querySelector('.tw-chart-svg-container');
        svgContainer.innerHTML = '';
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'tw-chart-svg');
        svg.setAttribute('viewBox', '0 0 600 250'); // Wider for single column
        svg.setAttribute('preserveAspectRatio', 'none');
        
        // Get data points (limited for performance) - NEWEST DATA FIRST
        const maxPoints = 40; // More points for wider chart
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
        
        // Reverse so newest is on the RIGHT
        points.reverse();
        
        if (points.length < 2) return;
        
        // Calculate scales
        const padding = { top: 25, right: 40, bottom: 50, left: 60 }; // More padding for labels
        const width = 600 - padding.left - padding.right;
        const height = 250 - padding.top - padding.bottom;
        
        const minVal = Math.min(...points.map(p => p.value));
        const maxVal = Math.max(...points.map(p => p.value));
        const range = maxVal - minVal || 1;
        
        // Create grid
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (height * i / 5);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', 'tw-chart-grid-line');
            line.setAttribute('x1', padding.left);
            line.setAttribute('x2', 600 - padding.right);
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
            text.setAttribute('x', padding.left - 10);
            text.setAttribute('y', y + 4);
            text.setAttribute('text-anchor', 'end');
            text.textContent = Math.round(value);
            svg.appendChild(text);
        }
        
        // Create min line
        const minY = padding.top + height * (1 - (cache.min - minVal) / range);
        const minLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        minLine.setAttribute('class', 'tw-chart-min-line');
        minLine.setAttribute('x1', padding.left);
        minLine.setAttribute('x2', 600 - padding.right);
        minLine.setAttribute('y1', minY);
        minLine.setAttribute('y2', minY);
        svg.appendChild(minLine);
        
        // Create max line
        const maxY = padding.top + height * (1 - (cache.max - minVal) / range);
        const maxLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        maxLine.setAttribute('class', 'tw-chart-max-line');
        maxLine.setAttribute('x1', padding.left);
        maxLine.setAttribute('x2', 600 - padding.right);
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
        if (points.length >= 6) {
            labelIndices.push(0); // Oldest (left side)
            labelIndices.push(Math.floor(points.length / 5));
            labelIndices.push(Math.floor(points.length * 2 / 5));
            labelIndices.push(Math.floor(points.length / 2));
            labelIndices.push(Math.floor(points.length * 3 / 5));
            labelIndices.push(Math.floor(points.length * 4 / 5));
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
            text.setAttribute('y', 250 - padding.bottom + 20);
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
        
        // NEW: Update chart title color based on current price
        const chartTitle = container.querySelector('.tw-chart-title');
        if (chartTitle) {
            const currentCost = cache.current;
            const minCost = cache.min;
            const maxCost = cache.max;
            
            if (currentCost === minCost && currentCost > 0) {
                chartTitle.className = 'tw-chart-title min-price';
            } else if (currentCost === maxCost && currentCost > 0) {
                chartTitle.className = 'tw-chart-title max-price';
            } else {
                chartTitle.className = 'tw-chart-title normal-price';
            }
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
        svg.setAttribute('viewBox', '0 0 600 250'); // Wider for single column
        svg.setAttribute('preserveAspectRatio', 'none');
        
        const padding = { top: 35, right: 40, bottom: 50, left: 70 }; // More padding
        const width = 600 - padding.left - padding.right;
        const height = 250 - padding.top - padding.bottom;
        
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
            line.setAttribute('x2', 600 - padding.right);
            line.setAttribute('y1', y);
            line.setAttribute('y2', y);
            svg.appendChild(line);
            
            // Y-axis label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'tw-chart-axis-label');
            text.setAttribute('x', padding.left - 15);
            text.setAttribute('y', y + 4);
            text.setAttribute('text-anchor', 'end');
            text.textContent = value;
            svg.appendChild(text);
        }
        
        // Create bars
        const barWidth = 35; // Wider bars for single column
        const groupSpacing = 30; // More spacing
        const barSpacing = 12;
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
                    valueText.setAttribute('y', barY + barHeight / 2 + 4);
                    valueText.textContent = values[barIndex];
                    svg.appendChild(valueText);
                }
            });
            
            // Add resource label
            const resourceLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            resourceLabel.setAttribute('class', 'tw-bar-label');
            resourceLabel.setAttribute('x', groupX + totalGroupWidth / 2);
            resourceLabel.setAttribute('y', 250 - padding.bottom + 20);
            resourceLabel.textContent = this.resourceNames[resource];
            svg.appendChild(resourceLabel);
        });
        
        // Add legend
        const legendData = [
            { label: 'Min', color: '#4CAF50', x: padding.left, y: padding.top - 15 },
            { label: 'Current', color: '#2196F3', x: padding.left + 100, y: padding.top - 15 },
            { label: 'Max', color: '#f44336', x: padding.left + 220, y: padding.top - 15 }
        ];
        
        legendData.forEach(item => {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', item.x);
            rect.setAttribute('y', item.y);
            rect.setAttribute('width', 15);
            rect.setAttribute('height', 15);
            rect.setAttribute('fill', item.color);
            svg.appendChild(rect);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'tw-chart-axis-label');
            text.setAttribute('x', item.x + 25);
            text.setAttribute('y', item.y + 12);
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
            
            // CHANGED: Create single column layout - all charts in separate rows
            const chartOrder = ['wood', 'stone', 'iron', 'bar'];
            
            chartOrder.forEach((chartType, index) => {
                const chartContainer = document.createElement('div');
                chartContainer.className = 'tw-chart-container';
                
                if (chartType === 'bar') {
                    chartContainer.id = 'tw-bar-chart';
                    chartContainer.className += ' tw-bar-chart-container';
                    
                    const chartTitle = document.createElement('h4');
                    chartTitle.className = 'tw-chart-title normal-price'; // Default class
                    chartTitle.textContent = 'Min/Current/Max Comparison';
                    chartContainer.appendChild(chartTitle);
                    
                    const svgContainer = document.createElement('div');
                    svgContainer.className = 'tw-chart-svg-container';
                    chartContainer.appendChild(svgContainer);
                } else {
                    chartContainer.id = `tw-chart-${chartType}`;
                    
                    // NEW: Determine initial title color based on current price
                    const cache = this.minMaxCache[chartType] || { min: 0, max: 0, current: 0 };
                    const currentCost = cache.current;
                    const minCost = cache.min;
                    const maxCost = cache.max;
                    
                    let titleClass = 'tw-chart-title normal-price';
                    if (currentCost === minCost && currentCost > 0) {
                        titleClass = 'tw-chart-title min-price';
                    } else if (currentCost === maxCost && currentCost > 0) {
                        titleClass = 'tw-chart-title max-price';
                    }
                    
                    const chartTitle = document.createElement('h4');
                    chartTitle.className = titleClass;
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

    // ... (keep all other methods the same) ...

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
        
        // CHANGED: Limit to maximum 10 visible rows
        const maxVisibleRows = 10;
        
        this.data.forEach((record, index) => {
            // Stop if we already have 10 visible rows
            if (visibleRows >= maxVisibleRows) return;
            
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
            row.style.height = '26px'; // Fixed height
            
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
            timeCell.style.whiteSpace = 'nowrap';
            timeCell.style.overflow = 'hidden';
            timeCell.style.textOverflow = 'ellipsis';
            
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
                amountCell.style.whiteSpace = 'nowrap';
                amountCell.style.overflow = 'hidden';
                amountCell.style.textOverflow = 'ellipsis';
                row.appendChild(amountCell);
                
                const capacityCell = document.createElement('td');
                capacityCell.className = 'tw-exchange-stat-capacity';
                capacityCell.textContent = resData.capacity.toLocaleString();
                capacityCell.style.whiteSpace = 'nowrap';
                capacityCell.style.overflow = 'hidden';
                capacityCell.style.textOverflow = 'ellipsis';
                
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
                costCell.style.whiteSpace = 'nowrap';
                row.appendChild(costCell);
                
                const diffCell = document.createElement('td');
                diffCell.className = `tw-exchange-stat-diff ${resData.diff > 0 ? 'positive' : resData.diff < 0 ? 'negative' : 'neutral'}`;
                diffCell.style.whiteSpace = 'nowrap';
                
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
                tagCell.style.whiteSpace = 'nowrap';
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
        
        // Update line charts with dynamic title colors
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
