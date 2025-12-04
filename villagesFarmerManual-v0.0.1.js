(function() {
    // ===== CONFIGURATION SECTION =====
    var cookieName = "akk";           // Cookie name for storing target index
    var historyCookie = "attackHistory"; // Cookie name for attack history
    var updateHistoryCookie = "lastUpdate"; // Cookie name for last update time
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
    var targetList = '543|557 540|560 539|560 539|552 536|554 542|552 543|551 540|550 539|552 535|552 535|554 535|562 535|564 533|563 533|559 533|555 535|552 536|549';
    
    // ===== UTILITY FUNCTIONS =====
    
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
     * Get current world/server name from URL
     * @return {string} World name (e.g., 'ru102')
     */
    function getWorldName() {
        var url = window.location.href;
        var match = url.match(/https?:\/\/([^\/]+)\./);
        return match ? match[1] : "unknown";
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
     * Create and show the configuration UI
     */
    function createConfigUI() {
        // Remove existing UI if present
        var existingUI = document.getElementById('tw-attack-config');
        if (existingUI) {
            existingUI.remove();
        }
        
        // Get current coordinates
        homeCoords = getCurrentVillageCoords();
        
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
            min-width: 300px;
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
        title.textContent = 'TW Attack Config';
        title.style.marginTop = '0';
        title.style.marginBottom = '15px';
        
        // Create info section
        var infoSection = document.createElement('div');
        infoSection.style.marginBottom = '15px';
        infoSection.style.padding = '10px';
        infoSection.style.backgroundColor = '#f0f0f0';
        infoSection.style.borderRadius = '4px';
        
        var worldInfo = document.createElement('div');
        worldInfo.textContent = 'World: ' + getWorldName();
        
        var villageInfo = document.createElement('div');
        villageInfo.textContent = 'Current Village: ' + (homeCoords || 'Not found');
        
        infoSection.appendChild(worldInfo);
        infoSection.appendChild(villageInfo);
        
        // Create max distance input
        var distanceContainer = document.createElement('div');
        distanceContainer.style.marginBottom = '10px';
        
        var distanceLabel = document.createElement('label');
        distanceLabel.textContent = 'Max Distance: ';
        distanceLabel.style.marginRight = '10px';
        
        var distanceInput = document.createElement('input');
        distanceInput.type = 'number';
        distanceInput.value = '50';
        distanceInput.min = '1';
        distanceInput.style.width = '60px';
        
        distanceContainer.appendChild(distanceLabel);
        distanceContainer.appendChild(distanceInput);
        
        // Create update button
        var updateBtn = document.createElement('button');
        updateBtn.textContent = 'Update villages to attack';
        updateBtn.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 15px;
        `;
        
        // Create status message
        var statusMsg = document.createElement('div');
        statusMsg.style.fontSize = '12px';
        statusMsg.style.color = '#666';
        statusMsg.style.marginBottom = '15px';
        
        updateBtn.onclick = function() {
            // Check cooldown (15 minutes)
            var lastUpdate = getCookie(updateHistoryCookie);
            var currentTime = (new Date()).getTime();
            var fifteenMinutes = 15 * 60 * 1000;
            
            if (lastUpdate && (currentTime - parseInt(lastUpdate)) < fifteenMinutes) {
                var remaining = Math.ceil((fifteenMinutes - (currentTime - parseInt(lastUpdate))) / 60000);
                statusMsg.textContent = 'Please wait ' + remaining + ' minutes before updating again';
                statusMsg.style.color = '#ff4444';
                return;
            }
            
            updateBtn.disabled = true;
            updateBtn.textContent = 'Loading...';
            statusMsg.textContent = 'Fetching village data...';
            statusMsg.style.color = '#666';
            
            fetchVillages(distanceInput.value, statusMsg, updateBtn);
        };
        
        // Create current targets list
        var targetsContainer = document.createElement('div');
        targetsContainer.style.marginTop = '15px';
        
        var targetsTitle = document.createElement('h4');
        targetsTitle.textContent = 'Current Target List:';
        targetsTitle.style.marginBottom = '10px';
        
        var targetsList = document.createElement('div');
        targetsList.id = 'targets-list';
        
        targetsContainer.appendChild(targetsTitle);
        targetsContainer.appendChild(targetsList);
        
        // Assemble UI
        uiContainer.appendChild(closeBtn);
        uiContainer.appendChild(title);
        uiContainer.appendChild(infoSection);
        uiContainer.appendChild(distanceContainer);
        uiContainer.appendChild(updateBtn);
        uiContainer.appendChild(statusMsg);
        uiContainer.appendChild(targetsContainer);
        
        document.body.appendChild(uiContainer);
        
        // Populate current targets list
        updateTargetsListUI();
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
            targetsList.innerHTML = '<div style="color: #999; font-style: italic;">No targets in list</div>';
            return;
        }
        
        targets.forEach(function(target, index) {
            var targetItem = document.createElement('div');
            targetItem.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px;
                margin: 2px 0;
                background: ${index % 2 === 0 ? '#f9f9f9' : '#fff'};
                border-radius: 3px;
            `;
            
            var targetText = document.createElement('span');
            var distance = homeCoords ? calculateDistance(homeCoords, target) : 0;
            targetText.textContent = target + (distance ? ' (dist: ' + distance + ')' : '');
            
            var removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.style.cssText = `
                background: #ff4444;
                color: white;
                border: none;
                padding: 2px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
            `;
            
            removeBtn.onclick = (function(targetToRemove) {
                return function() {
                    removeFromTargetList(targetToRemove);
                };
            })(target);
            
            targetItem.appendChild(targetText);
            targetItem.appendChild(removeBtn);
            targetsList.appendChild(targetItem);
        });
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
            targetList = targets.join(' ');
            updateTargetsListUI();
        }
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
            targetList = targets.join(' ');
            updateTargetsListUI();
        }
    }
    
    /**
     * Fetch villages from server and show selection UI
     * @param {string} maxDistance - Maximum distance filter
     * @param {HTMLElement} statusMsg - Status message element
     * @param {HTMLElement} updateBtn - Update button element
     */
    function fetchVillages(maxDistance, statusMsg, updateBtn) {
        var world = getWorldName();
        var url = 'https://' + world + '.voynaplemyon.com/map/village.txt';
        
        fetch(url)
            .then(function(response) {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.text();
            })
            .then(function(text) {
                // Record update time
                setCookie(updateHistoryCookie, (new Date()).getTime().toString(), 1);
                
                // Parse villages
                var villages = [];
                var lines = text.split('\n');
                
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
                        }
                    }
                });
                
                // Sort by distance
                villages.sort(function(a, b) {
                    return a.distance - b.distance;
                });
                
                statusMsg.textContent = 'Found ' + villages.length + ' available villages';
                statusMsg.style.color = '#4CAF50';
                
                // Show villages selection UI
                showVillagesSelection(villages);
            })
            .catch(function(error) {
                console.error('Error fetching villages:', error);
                statusMsg.textContent = 'Error fetching villages: ' + error.message;
                statusMsg.style.color = '#ff4444';
            })
            .finally(function() {
                updateBtn.disabled = false;
                updateBtn.textContent = 'Update villages to attack';
            });
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
        
        // Create selection container
        var selectionContainer = document.createElement('div');
        selectionContainer.id = 'villages-selection';
        selectionContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 20px;
            z-index: 10001;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
            width: 500px;
            max-height: 70vh;
            overflow-y: auto;
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
            selectionContainer.remove();
        };
        
        // Create title
        var title = document.createElement('h3');
        title.textContent = 'Select Villages to Add (' + villages.length + ' available)';
        title.style.marginTop = '0';
        title.style.marginBottom = '15px';
        
        // Create villages list
        var villagesList = document.createElement('div');
        villagesList.style.marginBottom = '15px';
        
        villages.forEach(function(village, index) {
            var villageItem = document.createElement('div');
            villageItem.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                margin: 4px 0;
                background: ${index % 2 === 0 ? '#f9f9f9' : '#fff'};
                border-radius: 4px;
            `;
            
            var villageInfo = document.createElement('span');
            villageInfo.textContent = village.name + ' - ' + village.coords + 
                                     (village.distance ? ' (dist: ' + village.distance.toFixed(2) + ')' : '');
            
            var addBtn = document.createElement('button');
            addBtn.textContent = 'Add to List';
            addBtn.style.cssText = `
                background: #2196F3;
                color: white;
                border: none;
                padding: 4px 12px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 12px;
            `;
            
            addBtn.onclick = (function(villageCoords) {
                return function() {
                    addToTargetList(villageCoords);
                };
            })(village.coords);
            
            villageItem.appendChild(villageInfo);
            villageItem.appendChild(addBtn);
            villagesList.appendChild(villageItem);
        });
        
        // Create close selection button
        var closeSelectionBtn = document.createElement('button');
        closeSelectionBtn.textContent = 'Close';
        closeSelectionBtn.style.cssText = `
            background: #666;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
        `;
        closeSelectionBtn.onclick = function() {
            selectionContainer.remove();
        };
        
        // Assemble selection UI
        selectionContainer.appendChild(closeBtn);
        selectionContainer.appendChild(title);
        selectionContainer.appendChild(villagesList);
        selectionContainer.appendChild(closeSelectionBtn);
        
        document.body.appendChild(selectionContainer);
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
            // User needs to click the submit button manually
        }
        
    } else {
        // Show the config UI even if not on attack page
        // UI already shown at beginning
    }
})();
