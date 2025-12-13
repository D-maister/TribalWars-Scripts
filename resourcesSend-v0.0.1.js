<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tribal Wars Village Resources</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th {
            background-color: #4CAF50;
            color: white;
            padding: 12px;
            text-align: left;
        }
        
        td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        
        tr:hover {
            background-color: #f5f5f5;
        }
        
        .resource-cell {
            text-align: right;
            font-weight: bold;
        }
        
        .coordinates {
            font-family: monospace;
            background-color: #f0f0f0;
            padding: 3px 6px;
            border-radius: 3px;
        }
        
        .refresh-btn {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            margin-bottom: 20px;
        }
        
        .refresh-btn:hover {
            background-color: #45a049;
        }
        
        .resource-icon {
            display: inline-block;
            width: 16px;
            height: 16px;
            margin-right: 5px;
            vertical-align: middle;
        }
        
        .wood { background-color: #8B4513; }
        .stone { background-color: #808080; }
        .iron { background-color: #A9A9A9; }
        .warehouse { background-color: #D2691E; }
        
        .summary {
            background-color: #e8f5e8;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Tribal Wars - Village Resources Overview</h1>
        
        <button class="refresh-btn" id="refreshBtn">Refresh Resources Data</button>
        
        <div id="resourcesTableContainer">
            <table id="resourcesTable">
                <thead>
                    <tr>
                        <th>Village Name</th>
                        <th>Coordinates</th>
                        <th>Wood</th>
                        <th>Clay</th>
                        <th>Iron</th>
                        <th>Warehouse</th>
                    </tr>
                </thead>
                <tbody id="tableBody">
                    <!-- Data will be populated here -->
                </tbody>
            </table>
        </div>
        
        <div class="summary" id="summarySection">
            <h3>Summary</h3>
            <p>Total Villages: <span id="totalVillages">0</span></p>
            <p>Total Resources: Wood: <span id="totalWood">0</span> | Clay: <span id="totalClay">0</span> | Iron: <span id="totalIron">0</span></p>
            <p>Average Warehouse: <span id="avgWarehouse">0</span></p>
        </div>
    </div>

    <script>
        // Sample data structure matching the DOM elements provided
        const villageData = [
            {
                name: "001. Я узнал, что у меня",
                coordinates: "540|557",
                wood: "32.682",
                clay: "1.524",
                iron: "24.063",
                warehouse: "142.373"
            },
            {
                name: "002. Есть огромная семья!",
                coordinates: "527|556",
                wood: "23.691",
                clay: "11.608",
                iron: "18.483",
                warehouse: "142.373"
            },
            {
                name: "003. И тропинка, и лесок",
                coordinates: "541|562",
                wood: "6.629",
                clay: "3.755",
                iron: "13.419",
                warehouse: "94.184"
            },
            {
                name: "004. В поле - каждый колосок!",
                coordinates: "537|567",
                wood: "12.060",
                clay: "5.625",
                iron: "7.834",
                warehouse: "62.305"
            },
            {
                name: "005. Речка, небо голубое",
                coordinates: "535|565",
                wood: "5.184",
                clay: "3.069",
                iron: "654",
                warehouse: "76.604"
            },
            {
                name: "007. Это родина моя,",
                coordinates: "544|568",
                wood: "20.881",
                clay: "2.305",
                iron: "2.128",
                warehouse: "41.217"
            }
        ];

        // Function to format resource numbers (remove dots used as thousand separators)
        function formatResourceNumber(resourceStr) {
            // Remove dots used as thousand separators
            return resourceStr.replace(/\./g, '');
        }

        // Function to parse resource from the DOM structure
        function parseResourceFromDOM() {
            // This function would normally parse the actual DOM
            // For now, we'll use the sample data
            return villageData;
        }

        // Function to populate the table
        function populateTable(data) {
            const tableBody = document.getElementById('tableBody');
            tableBody.innerHTML = '';
            
            let totalWood = 0;
            let totalClay = 0;
            let totalIron = 0;
            let totalWarehouse = 0;
            
            data.forEach(village => {
                const row = document.createElement('tr');
                
                // Convert resource strings to numbers for calculations
                const woodNum = parseInt(formatResourceNumber(village.wood));
                const clayNum = parseInt(formatResourceNumber(village.clay));
                const ironNum = parseInt(formatResourceNumber(village.iron));
                const warehouseNum = parseInt(formatResourceNumber(village.warehouse));
                
                // Update totals
                totalWood += woodNum;
                totalClay += clayNum;
                totalIron += ironNum;
                totalWarehouse += warehouseNum;
                
                // Format numbers with thousand separators for display
                const formatNumber = (num) => {
                    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                };
                
                row.innerHTML = `
                    <td>${village.name}</td>
                    <td><span class="coordinates">${village.coordinates}</span></td>
                    <td class="resource-cell">${formatNumber(woodNum)}</td>
                    <td class="resource-cell">${formatNumber(clayNum)}</td>
                    <td class="resource-cell">${formatNumber(ironNum)}</td>
                    <td class="resource-cell">${formatNumber(warehouseNum)}</td>
                `;
                
                tableBody.appendChild(row);
            });
            
            // Update summary
            document.getElementById('totalVillages').textContent = data.length;
            document.getElementById('totalWood').textContent = formatNumber(totalWood);
            document.getElementById('totalClay').textContent = formatNumber(totalClay);
            document.getElementById('totalIron').textContent = formatNumber(totalIron);
            document.getElementById('avgWarehouse').textContent = formatNumber(Math.round(totalWarehouse / data.length));
        }

        // Function to simulate parsing from actual DOM (for when integrated into Tribal Wars)
        function parseActualDOM() {
            // This would be the actual parsing logic for Tribal Wars page
            const villages = [];
            
            // Find the village targets content
            const contentDiv = document.getElementById('village_targets_content');
            if (contentDiv) {
                // Find all village rows
                const rows = contentDiv.querySelectorAll('table.vis tr');
                
                rows.forEach(row => {
                    // Skip header rows and filter rows
                    const links = row.querySelectorAll('a[href^="javascript:selectTarget"]');
                    if (links.length >= 2) {
                        const village = {
                            name: links[0].textContent.trim(),
                            coordinates: links[1].textContent.trim()
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
                        
                        if (village.name && village.coordinates) {
                            villages.push(village);
                        }
                    }
                });
            }
            
            return villages.length > 0 ? villages : villageData; // Fallback to sample data
        }

        // Function to refresh the data
        function refreshData() {
            // Try to parse actual DOM first, then fallback to sample data
            const data = parseActualDOM();
            populateTable(data);
            
            // Show notification
            const btn = document.getElementById('refreshBtn');
            const originalText = btn.textContent;
            btn.textContent = 'Data Refreshed!';
            btn.style.backgroundColor = '#2196F3';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '#4CAF50';
            }, 2000);
        }

        // Initialize the page
        document.addEventListener('DOMContentLoaded', () => {
            // Initial population with sample data
            populateTable(villageData);
            
            // Add event listener to refresh button
            document.getElementById('refreshBtn').addEventListener('click', refreshData);
        });

        // Helper function to format numbers (defined here for global access)
        function formatNumber(num) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
    </script>
</body>
</html>
