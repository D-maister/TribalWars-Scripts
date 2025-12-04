(function() {
    // ===== CONFIGURATION SECTION =====
    var cookieName = "akk";           // Cookie name for storing target index
    var historyCookie = "attackHistory"; // Cookie name for attack history
    var targetsStorageKey = "twAttackTargets"; // localStorage key for target list
    var cooldown = 30;                // Cooldown time in minutes
    var spear = 0;                    // Number of spears to send
    var sword = 0;                    // Number of swordsmen to send
    var axe = 0;                      // Number of axes to send
    var spy = 0;                      // Number of spies to send
    var light = 2;                    // Number of light cavalry to send
    var heavy = 0;                    // Number of heavy cavalry to send
    var ram = 0;                      // Number of rams to send
    var catapult = 0;                 // Number of catapults to send
    var knight = 0;                   // Number of paladins to send
    
    // Home village coordinates (format: "X|Y") - will be updated from page
    var homeCoords = "";
    
    // List of target coordinates separated by spaces (format: "X|Y X|Y")
    // Will be loaded from localStorage per world
    var targetList = "";
    
    // Current world name
    var currentWorld = "";
    
    // ===== UTILITY FUNCTIONS =====
    
    /**
     * Get current world/server name from URL
     * @return {string} World name (e.g., 'ru102')
     */
    function getWorldName() {
        var url = window.location.href;
        var match = url.match(/https?:\/\/([^\/]+)\./);
        return match ? match[1] : "unknown";
    }
    
    /**
     * Get a cookie value by name
     * @param {string} name - Cookie name
     * @return {string|null} Cookie value or null if not found
     */
    function getCookie(name) {
        var match = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
        return match ? decodeURIComponent(match[2]) : null;
    }
    
    /**
     * Set a cookie with expiration
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {number} days - Expiration in days
     */
    function setCookie(name, value, days) {
        var date = new Date();
        date.setTime(date.getTime() + (86400000 * days));
        document.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + date.toUTCString() + ";path=/";
    }
    
    /**
     * Calculate distance between two coordinates
     * @param {string} coord1 - First coordinate "X|Y"
     * @param {string} coord2 - Second coordinate "X|Y"
     * @return {number} Distance rounded to 2 decimal places
     */
    function calculateDistance(coord1, coord2) {
        var parts1 = coord1.split("|");
        var parts2 = coord2.split("|");
        var dx = parseInt(parts1[0]) - parseInt(parts2[0]);
        var dy = parseInt(parts1[1]) - parseInt(parts2[1]);
        return Math.round(100 * Math.sqrt(dx * dx + dy * dy)) / 100;
    }
    
    /**
     * Get attack history from cookie
     * @return {Object} Attack history object with timestamps
     */
    function getAttackHistory() {
        var history = getCookie(historyCookie);
        return history ? JSON.parse(history) : {};
    }
    
    /**
     * Save attack history to cookie
     * @param {Object} history - Attack history object
     */
    function saveAttackHistory(history) {
        setCookie(historyCookie, JSON.stringify(history), 7);
    }
    
    /**
     * Check if target is on cooldown
     * @param {string} target - Target coordinates "X|Y"
     * @param {number} minutes - Cooldown time in minutes
     * @return {boolean} True if target should be skipped
     */
    function isOnCooldown(target, minutes) {
        var history = getAttackHistory();
        var currentTime = (new Date()).getTime();
        
        if (history[target]) {
            var minutesSinceAttack = (currentTime - history[target]) / 60000;
            if (minutesSinceAttack < minutes) {
                console.log("Skip " + target + " - attacked " + minutesSinceAttack.toFixed(1) + " minutes ago");
                return true;
            }
        }
        return false;
    }
    
    /**
     * Record an attack in history
     * @param {string} target - Target coordinates "X|Y"
     */
    function recordAttack(target) {
        var history = getAttackHistory();
        history[target] = (new Date()).getTime();
        saveAttackHistory(history);
        var distance = calculateDistance(homeCoords, target);
        console.log("Attack " + target + " (distance: " + distance + ")");
    }
    
    /**
     * Clean up old attack history entries (older than 24 hours)
     */
    function cleanupOldHistory() {
        var history = getAttackHistory();
        var currentTime = (new Date()).getTime();
        var changed = false;
        
        for (var target in history) {
            if ((currentTime - history[target]) > 86400000) {
                delete history[target];
                changed = true;
            }
        }
        
        if (changed) {
            saveAttackHistory(history);
        }
    }
    
    /**
     * Set unit count in form field if field exists and value > 0
     * @param {HTMLElement} field - Form input element
     * @param {number} count - Number of units to send
     */
    function setUnitCount(field, count) {
        if (field && count > 0) {
            field.value = count;
        }
    }
    
    /**
     * Get current village coordinates from page title
     * @return {string} Village coordinates "X|Y" or empty string if not found
     */
    function getCurrentVillageCoords() {
        var title = document.querySelector('head > title');
        if (title) {
            var match = title.textContent.match(/\((\d+)\|(\d+)\)/);
            if (match) {
                return match[1] + "|" + match[2];
            }
        }
        return "";
    }
    
    /**
     * Get village.txt URL for current world
     * @return {string} Full URL to village.txt
     */
    function getVillageTxtUrl() {
        return 'https://' + currentWorld + '.voynaplemyon.com/map/village.txt';
    }
    
    /**
     * Load target list from localStorage for current world
     */
    function loadTargetsFromStorage() {
        try {
            var storedData = localStorage.getItem(targetsStorageKey);
            if (storedData) {
                var allTargets = JSON.parse(storedData);
                // Get targets for current world
                if (allTargets[currentWorld]) {
                    targetList = allTargets[currentWorld];
                } else {
                    targetList = ""; // No targets for this world yet
                }
            } else {
                targetList = ""; // No stored data at all
            }
        } catch (e) {
            console.error("Error loading targets from localStorage:", e);
            targetList = "";
        }
    }
    
    /**
     * Save target list to localStorage for current world
     */
    function saveTargetsToStorage() {
        try {
            var storedData = localStorage.getItem(targetsStorageKey);
            var allTargets = storedData ? JSON.parse(storedData) : {};
            
            // Update targets for current world
            allTargets[currentWorld] = targetList;
            
            // Save back to localStorage
            localStorage.setItem(targetsStorageKey, JSON.stringify(allTargets));
        } catch (e) {
            console.error("Error saving targets to localStorage:", e);
        }
    }
    
    /**
     * Get all worlds with stored targets
     * @return {Array} Array of world names
     */
    function getWorldsWithTargets() {
        try {
            var storedData = localStorage.getItem(targetsStorageKey);
            if (storedData) {
                var allTargets = JSON.parse(storedData);
                return Object.keys(allTargets).filter(function(world) {
                    return allTargets[world] && allTargets[world].trim().length > 0;
                });
            }
        } catch (e) {
            console.error("Error getting worlds with targets:", e);
        }
        return [];
    }
    
    /**
     * Update target list and save to storage
     * @param {string} newTargetList - New target list string
     */
    function updateTargetList(newTargetList) {
        targetList = newTargetList;
        saveTargetsToStorage();
    }
    
    /**
     * Add a target to the list
     * @param {string} targetToAdd - Target coordinates to add
     */
    function addToTargetList(targetToAdd) {
        var targets = targetList.split(' ').filter(Boolean);
        
        // Check if already in list
        if (targets.indexOf(targetToAdd) === -1) {
            targets.push(targetToAdd);
            updateTargetList(targets.join(' '));
            return true;
        }
        return false;
    }
    
    /**
     * Remove a target from the list
     * @param {string} targetToRemove - Target coordinates to remove
     */
    function removeFromTargetList(targetToRemove) {
        var targets = targetList.split(' ').filter(Boolean);
        var index = targets.indexOf(targetToRemove);
        
        if (index !== -1) {
            targets.splice(index, 1);
            updateTargetList(targets.join(' '));
            return true;
        }
        return false;
    }
    
    /**
     * Clear all targets for current world
     */
    function clearAllTargets() {
        updateTargetList('');
    }
    
    /**
     * Create and show the configuration UI
     */
    function createConfigUI() {
        // Remove existing UI if present
        var existingUI = document.getElementById('tw-attack-config');
        if (existingUI) {
            existingUI.remove();
        }
        
        // Get current world and coordinates
        currentWorld = getWorldName();
        homeCoords = getCurrentVillageCoords();
        
        // Load targets for current world
        loadTargetsFromStorage();
        
        // Create UI container
        var uiContainer = document.createElement('div');
        uiContainer.id = 'tw-attack-config';
        uiContainer.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            background: white;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 15px;
            z-index: 10000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            min-width: 350px;
            max-height: 80vh;
            overflow-y: auto;
            font-family: Arial, sans-serif;
        `;
        
        // Create close button
        var closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            cursor: pointer;
        `;
        closeBtn.onclick = function() {
            uiContainer.remove();
        };
        
        // Create title
        var title = document.createElement('h3');
        title.textContent = 'TW Attack Config - ' + currentWorld;
        title.style.marginTop = '0';
        title.style.marginBottom = '15px';
        title.style.color = '#333';
        
        // Create world selector
        var worlds = getWorldsWithTargets();
        if (worlds.length > 0) {
            var worldSelector = document.createElement('div');
            worldSelector.style.marginBottom = '15px';
            worldSelector.style.padding = '10px';
            worldSelector.style.backgroundColor = '#f0f8ff';
            worldSelector.style.borderRadius = '4px';
            worldSelector.style.border = '1px solid #ddd';
            
            var worldLabel = document.createElement('label');
            worldLabel.textContent = 'Switch World: ';
            worldLabel.style.marginRight = '10px';
            
            var worldSelect = document.createElement('select');
            worldSelect.style.padding = '4px';
            worldSelect.style.borderRadius = '4px';
            worldSelect.style.border = '1px solid #ddd';
            
            // Add current world if not in list
            if (worlds.indexOf(currentWorld) === -1) {
                worlds.unshift(currentWorld);
            }
            
            worlds.forEach(function(world) {
                var option = document.createElement('option');
                option.value = world;
                option.textContent = world;
                if (world === currentWorld) {
                    option.selected = true;
                }
                worldSelect.appendChild(option);
            });
            
            worldSelect.onchange = function() {
                // Save current targets before switching
                saveTargetsToStorage();
                
                // Switch to selected world
                var selectedWorld = this.value;
                currentWorld = selectedWorld;
                
                // Update title
                title.textContent = 'TW Attack Config - ' + selectedWorld;
                
                // Load targets for selected world
                loadTargetsFromStorage();
                
                // Update URL info
                var urlLink = worldInfo.querySelector('a');
                urlLink.href = 'https://' + selectedWorld + '.voynaplemyon.com/map/village.txt';
                urlLink.textContent = 'Download village.txt for ' + selectedWorld;
                
                // Update targets list display
                updateTargetsListUI();
            };
            
            worldSelector.appendChild(worldLabel);
            worldSelector.appendChild(worldSelect);
            uiContainer.appendChild(worldSelector);
        }
        
        // Create info section
        var infoSection = document.createElement('div');
        infoSection.id = 'world-info';
        infoSection.style.marginBottom = '15px';
        infoSection.style.padding = '10px';
        infoSection.style.backgroundColor = '#f0f8ff';
        infoSection.style.borderRadius = '4px';
        infoSection.style.border = '1px solid #ddd';
        
        var worldInfo = document.createElement('div');
        worldInfo.textContent = 'Current World: ' + currentWorld;
        worldInfo.style.marginBottom = '5px';
        
        var villageInfo = document.createElement('div');
        villageInfo.textContent = 'Current Village: ' + (homeCoords || 'Not found');
        villageInfo.style.marginBottom = '5px';
        
        var villageUrl = document.createElement('div');
        villageUrl.style.marginTop = '10px';
        
        var urlLink = document.createElement('a');
        urlLink.href = getVillageTxtUrl();
        urlLink.textContent = 'Download village.txt for ' + currentWorld;
        urlLink.target = '_blank';
        urlLink.style.color = '#2196F3';
        urlLink.style.textDecoration = 'none';
        
        urlLink.onclick = function(e) {
            e.preventDefault();
            window.open(this.href, '_blank');
        };
        
        var urlHelp = document.createElement('div');
        urlHelp.textContent = 'Open this link, copy all text, and paste below:';
        urlHelp.style.fontSize = '12px';
        urlHelp.style.color = '#666';
        urlHelp.style.marginTop = '5px';
        
        villageUrl.appendChild(urlLink);
        villageUrl.appendChild(urlHelp);
        
        infoSection.appendChild(worldInfo);
        infoSection.appendChild(villageInfo);
        infoSection.appendChild(villageUrl);
        
        // Create paste area section
        var pasteSection = document.createElement('div');
        pasteSection.style.marginBottom = '15px';
        
        var pasteLabel = document.createElement('label');
        pasteLabel.textContent = 'Paste village.txt content:';
        pasteLabel.style.display = 'block';
        pasteLabel.style.marginBottom = '8px';
        pasteLabel.style.fontWeight = 'bold';
        
        var pasteTextarea = document.createElement('textarea');
        pasteTextarea.id = 'village-textarea';
        pasteTextarea.style.cssText = `
            width: 100%;
            height: 100px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            resize: vertical;
            box-sizing: border-box;
        `;
        pasteTextarea.placeholder = 'Paste the content from village.txt here...';
        
        // Load saved village.txt content for current world if exists
        var savedTextKey = 'villageTxtContent_' + currentWorld;
        var savedText = localStorage.getItem(savedTextKey);
        if (savedText) {
            pasteTextarea.value = savedText;
        }
        
        // Create max distance input
        var distanceContainer = document.createElement('div');
        distanceContainer.style.marginTop = '10px';
        distanceContainer.style.marginBottom = '10px';
        
        var distanceLabel = document.createElement('label');
        distanceLabel.textContent = 'Max Distance: ';
        distanceLabel.style.marginRight = '10px';
        
        var distanceInput = document.createElement('input');
        distanceInput.type = 'number';
        distanceInput.value = '50';
        distanceInput.min = '1';
        distanceInput.style.width = '60px';
        distanceInput.style.padding = '4px';
        
        distanceContainer.appendChild(distanceLabel);
        distanceContainer.appendChild(distanceInput);
        
        // Create parse button
        var parseBtn = document.createElement('button');
        parseBtn.textContent = 'Parse villages.txt';
        parseBtn.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 15px;
            width: 100%;
            font-weight: bold;
        `;
        
        // Create status message
        var statusMsg = document.createElement('div');
        statusMsg.id = 'parse-status';
        statusMsg.style.fontSize = '12px';
        statusMsg.style.marginBottom = '15px';
        statusMsg.style.padding = '8px';
        statusMsg.style.borderRadius = '4px';
        statusMsg.style.display = 'none';
        
        parseBtn.onclick = function() {
            var text = pasteTextarea.value.trim();
            if (!text) {
                showStatus('Please paste village.txt content first', 'error');
                return;
            }
            
            // Save village.txt content for current world
            localStorage.setItem(savedTextKey, text);
            
            var maxDistance = distanceInput.value;
            parseVillageText(text, maxDistance);
        };
        
        pasteSection.appendChild(pasteLabel);
        pasteSection.appendChild(pasteTextarea);
        pasteSection.appendChild(distanceContainer);
        pasteSection.appendChild(parseBtn);
        pasteSection.appendChild(statusMsg);
        
        // Create current targets list
        var targetsContainer = document.createElement('div');
        targetsContainer.style.marginTop = '15px';
        targetsContainer.style.paddingTop = '15px';
        targetsContainer.style.borderTop = '1px solid #ddd';
        
        var targetsTitle = document.createElement('h4');
        targetsTitle.textContent = 'Targets for ' + currentWorld + ':';
        targetsTitle.style.marginBottom = '10px';
        targetsTitle.style.color = '#333';
        
        var targetsList = document.createElement('div');
        targetsList.id = 'targets-list';
        
        targetsContainer.appendChild(targetsTitle);
        targetsContainer.appendChild(targetsList);
        
        // Assemble UI
        uiContainer.appendChild(closeBtn);
        uiContainer.appendChild(title);
        uiContainer.appendChild(infoSection);
        uiContainer.appendChild(pasteSection);
        uiContainer.appendChild(targetsContainer);
        
        document.body.appendChild(uiContainer);
        
        // Populate current targets list
        updateTargetsListUI();
    }
    
    /**
     * Show status message
     * @param {string} message - Status message
     * @param {string} type - Message type: 'success', 'error', 'info'
     */
    function showStatus(message, type) {
        var statusMsg = document.getElementById('parse-status');
        if (!statusMsg) return;
        
        statusMsg.textContent = message;
        statusMsg.style.display = 'block';
        
        switch(type) {
            case 'success':
                statusMsg.style.backgroundColor = '#d4edda';
                statusMsg.style.color = '#155724';
                statusMsg.style.border = '1px solid #c3e6cb';
                break;
            case 'error':
                statusMsg.style.backgroundColor = '#f8d7da';
                statusMsg.style.color = '#721c24';
                statusMsg.style.border = '1px solid #f5c6cb';
                break;
            default:
                statusMsg.style.backgroundColor = '#d1ecf1';
                statusMsg.style.color = '#0c5460';
                statusMsg.style.border = '1px solid #bee5eb';
        }
    }
    
    /**
     * Update the targets list in UI
     */
    function updateTargetsListUI() {
        var targetsList = document.getElementById('targets-list');
        if (!targetsList) return;
        
        targetsList.innerHTML = '';
        
        var targets = targetList.split(' ').filter(Boolean);
        
        if (targets.length === 0) {
            targetsList.innerHTML = '<div style="color: #999; font-style: italic; padding: 10px; text-align: center;">No targets in list for ' + currentWorld + '</div>';
            return;
        }
        
        // Create clear all button
        var clearAllBtn = document.createElement('button');
        clearAllBtn.textContent = 'Clear All Targets for ' + currentWorld;
        clearAllBtn.style.cssText = `
            background: #ff4444;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 10px;
            width: 100%;
        `;
        clearAllBtn.onclick = function() {
            if (confirm('Clear all targets for ' + currentWorld + '?')) {
                clearAllTargets();
                updateTargetsListUI();
                showStatus('All targets cleared for ' + currentWorld, 'success');
            }
        };
        targetsList.appendChild(clearAllBtn);
        
        targets.forEach(function(target, index) {
            var targetItem = document.createElement('div');
            targetItem.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                margin: 4px 0;
                background: ${index % 2 === 0 ? '#f8f9fa' : '#fff'};
                border-radius: 4px;
                border: 1px solid #e9ecef;
            `;
            
            var targetText = document.createElement('span');
            var distance = homeCoords ? calculateDistance(homeCoords, target) : 0;
            targetText.textContent = target + (distance ? ' (dist: ' + distance.toFixed(2) + ')' : '');
            targetText.style.fontFamily = 'monospace';
            
            var removeBtn = document.createElement('button');
            removeBtn.textContent = '✕';
            removeBtn.title = 'Remove target';
            removeBtn.style.cssText = `
                background: #ff6b6b;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
                font-weight: bold;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            removeBtn.onclick = (function(targetToRemove) {
                return function() {
                    if (removeFromTargetList(targetToRemove)) {
                        updateTargetsListUI();
                        showStatus('Target removed: ' + targetToRemove, 'success');
                    }
                };
            })(target);
            
            targetItem.appendChild(targetText);
            targetItem.appendChild(removeBtn);
            targetsList.appendChild(targetItem);
        });
    }
    
    /**
     * Parse village.txt content and show selection UI
     * @param {string} text - village.txt content
     * @param {string} maxDistance - Maximum distance filter
     */
    function parseVillageText(text, maxDistance) {
        try {
            var villages = [];
            var lines = text.split('\n');
            var validLines = 0;
            
            lines.forEach(function(line) {
                if (!line.trim()) return;
                
                var parts = line.split(',');
                if (parts.length >= 7) {
                    var playerNumber = parseInt(parts[4]);
                    var isBonusVillage = parseInt(parts[6]);
                    
                    // Only villages with player number = 0 and not bonus villages
                    if (playerNumber === 0 && isBonusVillage === 0) {
                        var villageName = decodeURIComponent(parts[1]).replace(/\+/g, ' ');
                        var x = parts[2];
                        var y = parts[3];
                        var coords = x + '|' + y;
                        var distance = homeCoords ? calculateDistance(homeCoords, coords) : 0;
                        
                        // Apply distance filter
                        if (!maxDistance || distance <= parseInt(maxDistance)) {
                            villages.push({
                                name: villageName,
                                coords: coords,
                                distance: distance
                            });
                        }
                        validLines++;
                    }
                }
            });
            
            if (validLines === 0) {
                showStatus('No valid villages found in the pasted text. Make sure you copied the correct content.', 'error');
                return;
            }
            
            // Sort by distance
            villages.sort(function(a, b) {
                return a.distance - b.distance;
            });
            
            showStatus('Found ' + villages.length + ' available villages (out of ' + validLines + ' total villages)', 'success');
            
            // Show villages selection UI
            showVillagesSelection(villages);
            
        } catch (error) {
            console.error('Error parsing village text:', error);
            showStatus('Error parsing village.txt content: ' + error.message, 'error');
        }
    }
    
    /**
     * Show villages selection UI
     * @param {Array} villages - Array of village objects
     */
    function showVillagesSelection(villages) {
        // Remove existing selection UI if present
        var existingSelection = document.getElementById('villages-selection');
        if (existingSelection) {
            existingSelection.remove();
        }
        
        // Create overlay
        var overlay = document.createElement('div');
        overlay.id = 'villages-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 10001;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        // Create selection container
        var selectionContainer = document.createElement('div');
        selectionContainer.id = 'villages-selection';
        selectionContainer.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            width: 600px;
            max-width: 90vw;
            max-height: 80vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        `;
        
        // Create header
        var header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #4CAF50;
        `;
        
        var title = document.createElement('h3');
        title.textContent = 'Select Villages for ' + currentWorld + ' (' + villages.length + ' available)';
        title.style.margin = '0';
        title.style.color = '#333';
        
        var closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        closeBtn.onclick = function() {
            document.body.removeChild(overlay);
        };
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        // Create search input
        var searchContainer = document.createElement('div');
        searchContainer.style.marginBottom = '15px';
        
        var searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search villages...';
        searchInput.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        `;
        
        searchContainer.appendChild(searchInput);
        
        // Create villages list container
        var villagesContainer = document.createElement('div');
        villagesContainer.id = 'villages-container';
        villagesContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            background: #f8f9fa;
        `;
        
        // Create footer
        var footer = document.createElement('div');
        footer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
        `;
        
        var selectedCount = document.createElement('span');
        selectedCount.id = 'selected-count';
        selectedCount.textContent = 'Selected: 0';
        selectedCount.style.color = '#666';
        
        var addSelectedBtn = document.createElement('button');
        addSelectedBtn.textContent = 'Add Selected to List';
        addSelectedBtn.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        `;
        
        var closeFooterBtn = document.createElement('button');
        closeFooterBtn.textContent = 'Close';
        closeFooterBtn.style.cssText = `
            background: #666;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        `;
        
        footer.appendChild(selectedCount);
        footer.appendChild(closeFooterBtn);
        footer.appendChild(addSelectedBtn);
        
        // Assemble selection UI
        selectionContainer.appendChild(header);
        selectionContainer.appendChild(searchContainer);
        selectionContainer.appendChild(villagesContainer);
        selectionContainer.appendChild(footer);
        overlay.appendChild(selectionContainer);
        document.body.appendChild(overlay);
        
        // Store selected villages
        var selectedVillages = [];
        
        /**
         * Update villages list
         */
        function updateVillagesList(filter) {
            villagesContainer.innerHTML = '';
            selectedVillages = [];
            
            var filtered = villages;
            if (filter) {
                var searchTerm = filter.toLowerCase();
                filtered = villages.filter(function(village) {
                    return village.name.toLowerCase().includes(searchTerm) || 
                           village.coords.includes(searchTerm);
                });
            }
            
            if (filtered.length === 0) {
                villagesContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No villages match your search</div>';
                updateSelectedCount();
                return;
            }
            
            filtered.forEach(function(village, index) {
                var villageItem = document.createElement('div');
                villageItem.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px;
                    margin: 4px 0;
                    background: ${index % 2 === 0 ? '#fff' : '#f8f9fa'};
                    border-radius: 4px;
                    border: 1px solid #e9ecef;
                    cursor: pointer;
                    transition: background-color 0.2s;
                `;
                
                villageItem.onmouseover = function() {
                    this.style.backgroundColor = '#e9ecef';
                };
                villageItem.onmouseout = function() {
                    if (!this.classList.contains('selected')) {
                        this.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
                    }
                };
                
                var villageInfo = document.createElement('span');
                villageInfo.textContent = village.name + ' - ' + village.coords + 
                                         (village.distance ? ' (dist: ' + village.distance.toFixed(2) + ')' : '');
                villageInfo.style.fontFamily = 'monospace';
                villageInfo.style.fontSize = '12px';
                
                var checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.style.marginLeft = '10px';
                
                checkbox.onchange = function() {
                    if (this.checked) {
                        selectedVillages.push(village.coords);
                        villageItem.classList.add('selected');
                        villageItem.style.backgroundColor = '#e8f5e9';
                    } else {
                        var idx = selectedVillages.indexOf(village.coords);
                        if (idx > -1) {
                            selectedVillages.splice(idx, 1);
                        }
                        villageItem.classList.remove('selected');
                        villageItem.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
                    }
                    updateSelectedCount();
                };
                
                // Click anywhere on item to toggle checkbox
                villageItem.onclick = function(e) {
                    if (e.target !== checkbox) {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                };
                
                villageItem.appendChild(villageInfo);
                villageItem.appendChild(checkbox);
                villagesContainer.appendChild(villageItem);
            });
            
            updateSelectedCount();
        }
        
        /**
         * Update selected count display
         */
        function updateSelectedCount() {
            selectedCount.textContent = 'Selected: ' + selectedVillages.length;
        }
        
        // Search functionality
        searchInput.oninput = function() {
            updateVillagesList(this.value);
        };
        
        // Add selected functionality
        addSelectedBtn.onclick = function() {
            var addedCount = 0;
            selectedVillages.forEach(function(coords) {
                if (addToTargetList(coords)) {
                    addedCount++;
                }
            });
            
            updateTargetsListUI();
            var message = 'Added ' + addedCount + ' village(s) to target list for ' + currentWorld;
            showStatus(message, 'success');
            
            // Close the selection UI
            document.body.removeChild(overlay);
        };
        
        // Close button functionality
        closeFooterBtn.onclick = function() {
            document.body.removeChild(overlay);
        };
        
        // Initial villages list
        updateVillagesList();
        
        // Focus search input
        searchInput.focus();
    }
    
    // ===== MAIN EXECUTION =====
    
    // First show the configuration UI
    createConfigUI();
    
    // The original attack functionality is still available
    // but now works with the updated coordinates
    
    var currentUrl = location.href;
    var doc = document;
    
    // Check if we're on the rally point "place" screen without confirmation
    if (currentUrl.indexOf("screen=place") > -1 && 
        currentUrl.indexOf("try=confirm") < 0 && 
        doc.forms[0] && 
        "" == doc.forms[0].x.value && 
        "" == doc.forms[0].y.value) {
        
        // Handle iframe for Tribal Wars interface
        if (window.frames.length > 0) {
            doc = window.main.document;
        }
        
        // Double-check we're on the right screen
        if (currentUrl.indexOf("screen=place") < 0) {
            return; // UI already shown
        }
        
        // Get current coordinates if not already set
        if (!homeCoords) {
            homeCoords = getCurrentVillageCoords();
        }
        
        // Clean up old history entries
        cleanupOldHistory();
        
        // Parse target list
        var targets = targetList.split(" ").filter(Boolean);
        var targetIndex = 0;
        
        // Get saved target index from cookie
        var savedIndex = getCookie(cookieName);
        if (null !== savedIndex) {
            targetIndex = parseInt(savedIndex);
        }
        
        var startIndex = targetIndex;
        var selectedTarget = null;
        var attempts = 0;
        
        // Find next available target (not on cooldown)
        do {
            var currentTarget = targets[targetIndex];
            if (!isOnCooldown(currentTarget, cooldown)) {
                selectedTarget = currentTarget;
                break;
            }
            targetIndex = (targetIndex + 1) % targets.length;
            attempts++;
        } while (attempts < targets.length && targetIndex != startIndex);
        
        // If targets available, prepare attack
        if (selectedTarget) {
            // Parse coordinates
            var coords = selectedTarget.split("|");
            var nextIndex = (targetIndex + 1) % targets.length;
            
            // Save next target index for future use
            setCookie(cookieName, nextIndex.toString(), 365);
            
            // Fill coordinates in form
            doc.forms[0].x.value = coords[0];
            doc.forms[0].y.value = coords[1];
            
            // Fill unit counts
            setUnitCount(doc.forms[0].spear, spear);
            setUnitCount(doc.forms[0].sword, sword);
            setUnitCount(doc.forms[0].axe, axe);
            setUnitCount(doc.forms[0].spy, spy);
            setUnitCount(doc.forms[0].light, light);
            setUnitCount(doc.forms[0].heavy, heavy);
            setUnitCount(doc.forms[0].ram, ram);
            setUnitCount(doc.forms[0].catapult, catapult);
            setUnitCount(doc.forms[0].knight, knight);
            
            // Log target information
            var distance = calculateDistance(homeCoords, selectedTarget);
            console.log("Target: " + selectedTarget + " (Index: " + targetIndex + "), distance: " + distance);
            
            // Record this attack in history
            recordAttack(selectedTarget);
            
            // Note: Form submission is not automatic anymore
            // User needs to click the "Place" or "Attack" button manually
        }
        
    } else {
        // Show the config UI even if not on attack page
        // UI already shown at beginning
    }
})();
