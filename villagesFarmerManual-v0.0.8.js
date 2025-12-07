(function() {
    // ===== CONFIGURATION SECTION =====
    var cookieName = "akk";           // Cookie name for storing target index
    var historyCookie = "attackHistory"; // Cookie name for attack history
    var targetsStorageKey = "twAttackTargets"; // localStorage key for target list
    var buildsStorageKey = "twAttackBuilds"; // localStorage key for troop builds
    var settingsStorageKey = "twAttackSettings"; // localStorage key for settings
    var defaultCooldown = 30;         // Default cooldown in minutes
    
    // Home village coordinates (format: "X|Y") - will be updated from page
    var homeCoords = "";
    
    // List of target coordinates separated by spaces (format: "X|Y X|Y")
    // Will be loaded from localStorage per world
    var targetList = "";
    
    // Current world name
    var currentWorld = "";
    
    // Default troop builds
    var defaultBuilds = {
        "A": { spear: 0, sword: 0, axe: 0, spy: 0, light: 2, heavy: 0, ram: 0, catapult: 0, knight: 0 },
        "B": { spear: 0, sword: 0, axe: 0, spy: 0, light: 0, heavy: 0, ram: 0, catapult: 0, knight: 0 }
    };
    
    // Current troop builds
    var troopBuilds = {};
    
    // Settings
    var settings = {
        cooldown: defaultCooldown,
        autoAttack: false,
        includePlayers: false,
        maxPlayerPoints: 1000,
        autoAttackEnabled: false,
        autoAttackPosition: { x: 10, y: 100 }
    };
    
    // UI state
    var configVisible = false; // Settings hidden on start
    var updateInterval = null; // For auto-updating cooldowns
    
    // ===== UTILITY FUNCTIONS =====
    
    /**
     * Get current world/server name from URL
     * @return {string} World name (e.g., 'ru102')
     */
    function getWorldName() {
        var url = window.location.href;
        var match = url.match(/https?:\/\/([^\/]+?)\.voynaplemyon\./);
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
     * Check if target is on cooldown and get remaining time
     * @param {string} target - Target coordinates "X|Y"
     * @return {Object} {onCooldown: boolean, minutesLeft: number, lastAttack: Date|null}
     */
    function getCooldownInfo(target) {
        var history = getAttackHistory();
        var currentTime = (new Date()).getTime();
        
        if (history[target]) {
            var minutesSinceAttack = (currentTime - history[target]) / 60000;
            var minutesLeft = settings.cooldown - minutesSinceAttack;
            
            return {
                onCooldown: minutesSinceAttack < settings.cooldown,
                minutesLeft: Math.max(0, Math.ceil(minutesLeft)),
                lastAttack: new Date(history[target])
            };
        }
        
        return {
            onCooldown: false,
            minutesLeft: 0,
            lastAttack: null
        };
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
     * Load troop builds from localStorage
     */
    function loadBuildsFromStorage() {
        try {
            var storedData = localStorage.getItem(buildsStorageKey);
            if (storedData) {
                var allBuilds = JSON.parse(storedData);
                // Get builds for current world
                if (allBuilds[currentWorld]) {
                    troopBuilds = allBuilds[currentWorld];
                } else {
                    // Use defaults for this world
                    troopBuilds = JSON.parse(JSON.stringify(defaultBuilds));
                }
            } else {
                // Use defaults
                troopBuilds = JSON.parse(JSON.stringify(defaultBuilds));
            }
        } catch (e) {
            console.error("Error loading builds from localStorage:", e);
            troopBuilds = JSON.parse(JSON.stringify(defaultBuilds));
        }
    }
    
    /**
     * Save troop builds to localStorage
     */
    function saveBuildsToStorage() {
        try {
            var storedData = localStorage.getItem(buildsStorageKey);
            var allBuilds = storedData ? JSON.parse(storedData) : {};
            
            // Update builds for current world
            allBuilds[currentWorld] = troopBuilds;
            
            // Save back to localStorage
            localStorage.setItem(buildsStorageKey, JSON.stringify(allBuilds));
        } catch (e) {
            console.error("Error saving builds to localStorage:", e);
        }
    }
    
    /**
     * Load settings from localStorage
     */
    function loadSettingsFromStorage() {
        try {
            var storedData = localStorage.getItem(settingsStorageKey);
            if (storedData) {
                var allSettings = JSON.parse(storedData);
                // Get settings for current world
                if (allSettings[currentWorld]) {
                    settings = allSettings[currentWorld];
                    // Ensure new settings have default values if missing
                    if (settings.includePlayers === undefined) settings.includePlayers = false;
                    if (settings.maxPlayerPoints === undefined) settings.maxPlayerPoints = 1000;
                    if (settings.autoAttackEnabled === undefined) settings.autoAttackEnabled = false;
                    if (settings.autoAttackPosition === undefined) settings.autoAttackPosition = { x: 10, y: 100 };
                } else {
                    // Use defaults for this world
                    settings = {
                        cooldown: defaultCooldown,
                        autoAttack: false,
                        includePlayers: false,
                        maxPlayerPoints: 1000,
                        autoAttackEnabled: false,
                        autoAttackPosition: { x: 10, y: 100 }
                    };
                }
            } else {
                // Use defaults
                settings = {
                    cooldown: defaultCooldown,
                    autoAttack: false,
                    includePlayers: false,
                    maxPlayerPoints: 1000,
                    autoAttackEnabled: false,
                    autoAttackPosition: { x: 10, y: 100 }
                };
            }
        } catch (e) {
            console.error("Error loading settings from localStorage:", e);
            settings = {
                cooldown: defaultCooldown,
                autoAttack: false,
                includePlayers: false,
                maxPlayerPoints: 1000,
                autoAttackEnabled: false,
                autoAttackPosition: { x: 10, y: 100 }
            };
        }
    }
    
    /**
     * Save settings to localStorage
     */
    function saveSettingsToStorage() {
        try {
            var storedData = localStorage.getItem(settingsStorageKey);
            var allSettings = storedData ? JSON.parse(storedData) : {};
            
            // Update settings for current world
            allSettings[currentWorld] = settings;
            
            // Save back to localStorage
            localStorage.setItem(settingsStorageKey, JSON.stringify(allSettings));
        } catch (e) {
            console.error("Error saving settings to localStorage:", e);
        }
    }
    
    /**
     * Save all settings at once
     */
    function saveAllSettings() {
        saveSettingsToStorage();
        showStatus('All settings saved for ' + currentWorld, 'success');
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
     * Get current targets as array
     * @return {Array} Array of target coordinates
     */
    function getCurrentTargets() {
        return targetList.split(' ').filter(Boolean);
    }
    
    /**
     * Format time since last attack
     * @param {Date} lastAttack - Last attack date
     * @return {string} Formatted time string
     */
    function formatTimeSince(lastAttack) {
        if (!lastAttack) return "Never";
        
        var now = new Date();
        var diffMs = now - lastAttack;
        var diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 60) {
            return diffMins + "m ago";
        } else if (diffMins < 1440) {
            var hours = Math.floor(diffMins / 60);
            return hours + "h ago";
        } else {
            var days = Math.floor(diffMins / 1440);
            return days + "d ago";
        }
    }
    
    /**
     * Start auto-updating cooldowns
     */
    function startAutoUpdate() {
        // Clear existing interval if any
        if (updateInterval) {
            clearInterval(updateInterval);
        }
        
        // Update every 30 seconds
        updateInterval = setInterval(function() {
            updateTargetsListUI();
        }, 30000); // 30 seconds
    }
    
    /**
     * Stop auto-updating cooldowns
     */
    function stopAutoUpdate() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }
    
    /**
     * Create external auto-attack checkbox
     */
    function createExternalAutoAttackCheckbox() {
        // Remove existing checkbox if any
        var existingCheckbox = document.getElementById('external-auto-attack');
        if (existingCheckbox) {
            existingCheckbox.remove();
        }
        
        // Create checkbox container
        var checkboxContainer = document.createElement('div');
        checkboxContainer.id = 'external-auto-attack';
        checkboxContainer.style.cssText = `
            position: fixed;
            top: ${settings.autoAttackPosition.y}px;
            left: ${settings.autoAttackPosition.x}px;
            z-index: 10002;
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid #4CAF50;
            border-radius: 20px;
            padding: 10px 15px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: move;
            user-select: none;
        `;
        
        // Make it draggable
        var isDragging = false;
        var offsetX, offsetY;
        
        checkboxContainer.onmousedown = function(e) {
            if (e.target.type === 'checkbox') return; // Don't drag when clicking checkbox
            
            isDragging = true;
            offsetX = e.clientX - checkboxContainer.offsetLeft;
            offsetY = e.clientY - checkboxContainer.offsetTop;
            e.preventDefault();
        };
        
        document.onmousemove = function(e) {
            if (!isDragging) return;
            
            var x = e.clientX - offsetX;
            var y = e.clientY - offsetY;
            
            // Keep within viewport
            x = Math.max(0, Math.min(x, window.innerWidth - checkboxContainer.offsetWidth));
            y = Math.max(0, Math.min(y, window.innerHeight - checkboxContainer.offsetHeight));
            
            checkboxContainer.style.left = x + 'px';
            checkboxContainer.style.top = y + 'px';
            
            // Update position in settings
            settings.autoAttackPosition.x = x;
            settings.autoAttackPosition.y = y;
        };
        
        document.onmouseup = function() {
            if (isDragging) {
                isDragging = false;
                saveSettingsToStorage(); // Save new position
            }
        };
        
        // Create label
        var label = document.createElement('span');
        label.textContent = 'Auto-Attack:';
        label.style.fontWeight = 'bold';
        label.style.fontSize = '14px';
        
        // Create slider container
        var sliderContainer = document.createElement('label');
        sliderContainer.style.cssText = `
            position: relative;
            display: inline-block;
            width: 50px;
            height: 26px;
        `;
        
        // Create checkbox (hidden)
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = settings.autoAttackEnabled;
        checkbox.style.cssText = `
            opacity: 0;
            width: 0;
            height: 0;
        `;
        
        // Create slider
        var slider = document.createElement('span');
        slider.style.cssText = `
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 34px;
        `;
        
        // Create slider knob
        var sliderKnob = document.createElement('span');
        sliderKnob.style.cssText = `
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        `;
        
        // Update slider appearance based on checkbox state
        function updateSlider() {
            if (checkbox.checked) {
                slider.style.backgroundColor = '#4CAF50';
                sliderKnob.style.transform = 'translateX(24px)';
            } else {
                slider.style.backgroundColor = '#ccc';
                sliderKnob.style.transform = 'translateX(0)';
            }
        }
        
        // Initial update
        updateSlider();
        
        // Handle checkbox change
        checkbox.onchange = function() {
            settings.autoAttackEnabled = this.checked;
            saveSettingsToStorage();
            updateSlider();
            
            if (settings.autoAttackEnabled) {
                showStatus('External auto-attack enabled', 'success');
            } else {
                showStatus('External auto-attack disabled', 'info');
            }
        };
        
        // Assemble slider
        slider.appendChild(sliderKnob);
        sliderContainer.appendChild(checkbox);
        sliderContainer.appendChild(slider);
        
        // Add help text on hover
        var helpText = document.createElement('div');
        helpText.textContent = 'Drag to move';
        helpText.style.cssText = `
            font-size: 10px;
            color: #666;
            margin-top: 4px;
            text-align: center;
        `;
        
        // Assemble container
        checkboxContainer.appendChild(label);
        checkboxContainer.appendChild(sliderContainer);
        
        var innerContainer = document.createElement('div');
        innerContainer.style.display = 'flex';
        innerContainer.style.flexDirection = 'column';
        innerContainer.style.alignItems = 'center';
        innerContainer.appendChild(sliderContainer);
        innerContainer.appendChild(helpText);
        
        checkboxContainer.appendChild(innerContainer);
        
        // Add to document
        document.body.appendChild(checkboxContainer);
    }
    
    /**
     * Find and click the attack submit button
     */
    function clickAttackButton() {
        var currentUrl = location.href;
        var doc = document;
        
        // Handle iframe for Tribal Wars interface
        if (window.frames.length > 0) {
            doc = window.main.document;
        }
        
        // Try different selectors for the attack button
        var submitButton = doc.querySelector('input[type="submit"], button[type="submit"], input[name="target_attack"]');
        if (submitButton) {
            console.log("Auto-attack: Clicking submit button");
            submitButton.click();
            return true;
        } else {
            console.log("Auto-attack: Submit button not found, trying form submit");
            if (doc.forms[0]) {
                doc.forms[0].submit();
                return true;
            }
        }
        return false;
    }
    
    /**
     * Attack a specific target with specific build
     * @param {string} target - Target coordinates
     * @param {string} buildKey - Build key ('A' or 'B')
     */
    function attackTarget(target, buildKey) {
        var currentUrl = location.href;
        var doc = document;
        
        // Check if we're on the rally point "place" screen
        if (currentUrl.indexOf("screen=place") > -1 && 
            currentUrl.indexOf("try=confirm") < 0 && 
            doc.forms[0]) {
            
            // Handle iframe for Tribal Wars interface
            if (window.frames.length > 0) {
                doc = window.main.document;
            }
            
            // Parse coordinates
            var coords = target.split("|");
            
            // Fill coordinates in form
            doc.forms[0].x.value = coords[0];
            doc.forms[0].y.value = coords[1];
            
            // Get build troops
            var build = troopBuilds[buildKey] || defaultBuilds[buildKey] || defaultBuilds["A"];
            
            // Fill unit counts
            setUnitCount(doc.forms[0].spear, build.spear);
            setUnitCount(doc.forms[0].sword, build.sword);
            setUnitCount(doc.forms[0].axe, build.axe);
            setUnitCount(doc.forms[0].spy, build.spy);
            setUnitCount(doc.forms[0].light, build.light);
            setUnitCount(doc.forms[0].heavy, build.heavy);
            setUnitCount(doc.forms[0].ram, build.ram);
            setUnitCount(doc.forms[0].catapult, build.catapult);
            setUnitCount(doc.forms[0].knight, build.knight);
            
            // Record this attack in history
            recordAttack(target);
            
            // Show success message
            showStatus('Target ' + target + ' prepared with Build ' + buildKey + '! Click "Place" button to send.', 'success');
            
            // Update the target list UI to show new cooldown
            updateTargetsListUI();
            
            // Auto-attack if enabled
            if (settings.autoAttack || settings.autoAttackEnabled) {
                setTimeout(function() {
                    if (clickAttackButton()) {
                        showStatus('Auto-attack: Attack sent to ' + target, 'success');
                    } else {
                        showStatus('Auto-attack: Could not find submit button', 'error');
                    }
                }, 500);
            } else {
                // Find and highlight the submit button
                var submitButton = doc.querySelector('input[type="submit"], button[type="submit"], input[name="target_attack"]');
                if (submitButton) {
                    submitButton.style.border = '2px solid #4CAF50';
                    submitButton.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
                    submitButton.style.animation = 'pulse 1s infinite';
                    
                    // Add CSS for pulse animation
                    if (!document.querySelector('#pulse-animation')) {
                        var style = document.createElement('style');
                        style.id = 'pulse-animation';
                        style.textContent = `
                            @keyframes pulse {
                                0% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.5); }
                                50% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.8); }
                                100% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.5); }
                            }
                        `;
                        document.head.appendChild(style);
                    }
                    
                    // Remove highlight after 5 seconds
                    setTimeout(function() {
                        submitButton.style.border = '';
                        submitButton.style.boxShadow = '';
                        submitButton.style.animation = '';
                    }, 5000);
                }
            }
            
        } else {
            showStatus('Please go to Rally Point > Place tab to attack', 'error');
        }
    }
    
    /**
     * Auto-attack next available target with specified build
     * @param {string} buildKey - Build key ('A' or 'B')
     */
    function autoAttackNext(buildKey) {
        cleanupOldHistory();
        
        var targets = targetList.split(" ").filter(Boolean);
        if (targets.length === 0) {
            showStatus('No targets in list for auto-attack', 'error');
            return;
        }
        
        var targetIndex = 0;
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
            var cooldownInfo = getCooldownInfo(currentTarget);
            
            if (!cooldownInfo.onCooldown) {
                selectedTarget = currentTarget;
                break;
            }
            targetIndex = (targetIndex + 1) % targets.length;
            attempts++;
        } while (attempts < targets.length && targetIndex != startIndex);
        
        if (selectedTarget) {
            var nextIndex = (targetIndex + 1) % targets.length;
            setCookie(cookieName, nextIndex.toString(), 365);
            attackTarget(selectedTarget, buildKey);
        } else {
            showStatus('All targets are on cooldown', 'error');
        }
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
        
        // Load data for current world
        loadTargetsFromStorage();
        loadBuildsFromStorage();
        loadSettingsFromStorage();
        
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
            padding: 20px;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            min-width: 600px;
            max-height: 85vh;
            overflow-y: auto;
            font-family: Arial, sans-serif;
        `;
        
        // Create close button
        var closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 16px;
        `;
        closeBtn.onclick = function() {
            uiContainer.remove();
            stopAutoUpdate();
            
            // Also remove external checkbox when closing main UI
            var externalCheckbox = document.getElementById('external-auto-attack');
            if (externalCheckbox) {
                externalCheckbox.remove();
            }
        };
        
        // Create title
        var title = document.createElement('h3');
        title.textContent = '⚔️ TW Attack Config - ' + currentWorld;
        title.style.marginTop = '0';
        title.style.marginBottom = '20px';
        title.style.color = '#333';
        title.style.borderBottom = '2px solid #4CAF50';
        title.style.paddingBottom = '10px';
        
        // Create toggle config button
        var toggleConfigBtn = document.createElement('button');
        toggleConfigBtn.textContent = configVisible ? '▲ Hide Config' : '▼ Show Config';
        toggleConfigBtn.style.cssText = `
            background: #666;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 15px;
            font-size: 13px;
            font-weight: bold;
            width: 100%;
            transition: background 0.2s;
        `;
        toggleConfigBtn.onmouseover = function() {
            this.style.background = '#555';
        };
        toggleConfigBtn.onmouseout = function() {
            this.style.background = '#666';
        };
        toggleConfigBtn.onclick = function() {
            configVisible = !configVisible;
            this.textContent = configVisible ? '▲ Hide Config' : '▼ Show Config';
            toggleConfigVisibility();
        };
        
        // Create auto-attack buttons container
        var autoAttackContainer = document.createElement('div');
        autoAttackContainer.style.cssText = `
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        `;
        
        // Create auto-attack button for Build A
        var autoAttackBtnA = document.createElement('button');
        autoAttackBtnA.textContent = '⚡ Auto-Attack (A)';
        autoAttackBtnA.style.cssText = `
            background: linear-gradient(to right, #ff416c, #ff4b2b);
            color: white;
            border: none;
            padding: 12px 0;
            border-radius: 6px;
            cursor: pointer;
            flex: 1;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 3px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        `;
        autoAttackBtnA.onmouseover = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 5px 10px rgba(0,0,0,0.15)';
        };
        autoAttackBtnA.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 3px 6px rgba(0,0,0,0.1)';
        };
        autoAttackBtnA.onclick = function() {
            autoAttackNext('A');
        };
        
        // Create auto-attack button for Build B
        var autoAttackBtnB = document.createElement('button');
        autoAttackBtnB.textContent = '⚡ Auto-Attack (B)';
        autoAttackBtnB.style.cssText = `
            background: linear-gradient(to right, #2196F3, #1976D2);
            color: white;
            border: none;
            padding: 12px 0;
            border-radius: 6px;
            cursor: pointer;
            flex: 1;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 3px 6px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        `;
        autoAttackBtnB.onmouseover = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 5px 10px rgba(0,0,0,0.15)';
        };
        autoAttackBtnB.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 3px 6px rgba(0,0,0,0.1)';
        };
        autoAttackBtnB.onclick = function() {
            autoAttackNext('B');
        };
        
        autoAttackContainer.appendChild(autoAttackBtnA);
        autoAttackContainer.appendChild(autoAttackBtnB);
        
        // Create world selector
        var worlds = getWorldsWithTargets();
        var worldSelector;
        if (worlds.length > 0) {
            worldSelector = document.createElement('div');
            worldSelector.style.marginBottom = '20px';
            worldSelector.style.padding = '12px';
            worldSelector.style.backgroundColor = '#f0f8ff';
            worldSelector.style.borderRadius = '6px';
            worldSelector.style.border = '1px solid #b8d4ff';
            worldSelector.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            
            var worldLabel = document.createElement('label');
            worldLabel.textContent = 'Switch World: ';
            worldLabel.style.marginRight = '10px';
            worldLabel.style.fontWeight = 'bold';
            
            var worldSelect = document.createElement('select');
            worldSelect.style.cssText = `
                padding: 6px 10px;
                border-radius: 4px;
                border: 1px solid #ddd;
                background: white;
                font-size: 14px;
                min-width: 150px;
            `;
            
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
                // Save current data before switching
                saveTargetsToStorage();
                saveBuildsToStorage();
                saveSettingsToStorage();
                
                // Switch to selected world
                var selectedWorld = this.value;
                currentWorld = selectedWorld;
                
                // Update title
                title.textContent = '⚔️ TW Attack Config - ' + selectedWorld;
                
                // Load data for selected world
                loadTargetsFromStorage();
                loadBuildsFromStorage();
                loadSettingsFromStorage();
                
                // Update URL info
                var urlLink = worldInfo.querySelector('a');
                urlLink.href = 'https://' + selectedWorld + '.voynaplemyon.com/map/village.txt';
                urlLink.textContent = 'Download village.txt for ' + selectedWorld;
                
                // Update all UI sections
                updateBuildsUI();
                updateSettingsUI();
                updateTargetsListUI();
                
                // Recreate external checkbox for new world
                createExternalAutoAttackCheckbox();
            };
            
            worldSelector.appendChild(worldLabel);
            worldSelector.appendChild(worldSelect);
        }
        
        // Create info section
        var infoSection = document.createElement('div');
        infoSection.id = 'world-info';
        infoSection.style.marginBottom = '20px';
        infoSection.style.padding = '15px';
        infoSection.style.backgroundColor = '#f8f9fa';
        infoSection.style.borderRadius = '6px';
        infoSection.style.border = '1px solid #e9ecef';
        
        var worldInfo = document.createElement('div');
        worldInfo.innerHTML = '<strong>🌍 World:</strong> ' + currentWorld;
        worldInfo.style.marginBottom = '8px';
        
        var villageInfo = document.createElement('div');
        villageInfo.innerHTML = '<strong>🏠 Current Village:</strong> ' + (homeCoords || 'Not found');
        villageInfo.style.marginBottom = '8px';
        
        var cooldownInfo = document.createElement('div');
        cooldownInfo.innerHTML = '<strong>⏰ Cooldown:</strong> ' + settings.cooldown + ' minutes';
        cooldownInfo.style.marginBottom = '12px';
        cooldownInfo.style.color = '#666';
        
        var villageUrl = document.createElement('div');
        villageUrl.style.marginTop = '12px';
        villageUrl.style.paddingTop = '12px';
        villageUrl.style.borderTop = '1px dashed #ddd';
        
        var urlLink = document.createElement('a');
        urlLink.href = getVillageTxtUrl();
        urlLink.textContent = '📥 Download village.txt for ' + currentWorld;
        urlLink.target = '_blank';
        urlLink.style.cssText = `
            color: #2196F3;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
            padding: 6px 12px;
            background: #e3f2fd;
            border-radius: 4px;
            border: 1px solid #bbdefb;
            transition: background 0.2s;
        `;
        urlLink.onmouseover = function() {
            this.style.background = '#bbdefb';
        };
        urlLink.onmouseout = function() {
            this.style.background = '#e3f2fd';
        };
        
        urlLink.onclick = function(e) {
            e.preventDefault();
            window.open(this.href, '_blank');
        };
        
        var urlHelp = document.createElement('div');
        urlHelp.textContent = 'Open this link, copy all text, and paste below:';
        urlHelp.style.fontSize = '12px';
        urlHelp.style.color = '#666';
        urlHelp.style.marginTop = '8px';
        
        villageUrl.appendChild(urlLink);
        villageUrl.appendChild(urlHelp);
        
        infoSection.appendChild(worldInfo);
        infoSection.appendChild(villageInfo);
        infoSection.appendChild(cooldownInfo);
        infoSection.appendChild(villageUrl);
        
        // Create settings section
        var settingsSection = document.createElement('div');
        settingsSection.id = 'settings-section';
        settingsSection.style.marginBottom = '20px';
        settingsSection.style.padding = '15px';
        settingsSection.style.backgroundColor = '#fff8e1';
        settingsSection.style.borderRadius = '6px';
        settingsSection.style.border = '1px solid #ffecb3';
        
        var settingsTitle = document.createElement('h4');
        settingsTitle.textContent = '⚙️ Settings';
        settingsTitle.style.marginTop = '0';
        settingsTitle.style.marginBottom = '15px';
        settingsTitle.style.color = '#333';
        
        settingsSection.appendChild(settingsTitle);
        
        // Function to update settings UI
        function updateSettingsUI() {
            var settingsContainer = settingsSection.querySelector('#settings-container');
            if (settingsContainer) {
                settingsContainer.remove();
            }
            
            settingsContainer = document.createElement('div');
            settingsContainer.id = 'settings-container';
            
            // Cooldown setting
            var cooldownSetting = document.createElement('div');
            cooldownSetting.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                padding: 10px;
                background: #fff;
                border-radius: 4px;
                border: 1px solid #e0e0e0;
            `;
            
            var cooldownLabel = document.createElement('label');
            cooldownLabel.textContent = 'Cooldown (minutes): ';
            cooldownLabel.style.marginRight = '10px';
            cooldownLabel.style.fontWeight = 'bold';
            cooldownLabel.style.minWidth = '200px';
            
            var cooldownInput = document.createElement('input');
            cooldownInput.type = 'number';
            cooldownInput.min = '1';
            cooldownInput.max = '1440';
            cooldownInput.value = settings.cooldown;
            cooldownInput.style.cssText = `
                padding: 6px 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                width: 80px;
                font-size: 14px;
                margin-right: 10px;
            `;
            
            cooldownSetting.appendChild(cooldownLabel);
            cooldownSetting.appendChild(cooldownInput);
            
            // Auto-attack setting
            var autoAttackSetting = document.createElement('div');
            autoAttackSetting.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                padding: 10px;
                background: #fff;
                border-radius: 4px;
                border: 1px solid #e0e0e0;
            `;
            
            var autoAttackLabel = document.createElement('label');
            autoAttackLabel.textContent = 'Auto-attack (after 500ms): ';
            autoAttackLabel.style.marginRight = '10px';
            autoAttackLabel.style.fontWeight = 'bold';
            autoAttackLabel.style.minWidth = '200px';
            
            var autoAttackCheckbox = document.createElement('input');
            autoAttackCheckbox.type = 'checkbox';
            autoAttackCheckbox.checked = settings.autoAttack;
            autoAttackCheckbox.style.cssText = `
                transform: scale(1.3);
                margin-right: 10px;
            `;
            
            autoAttackSetting.appendChild(autoAttackLabel);
            autoAttackSetting.appendChild(autoAttackCheckbox);
            
            // Include players villages setting
            var includePlayersSetting = document.createElement('div');
            includePlayersSetting.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                padding: 10px;
                background: #fff;
                border-radius: 4px;
                border: 1px solid #e0e0e0;
            `;
            
            var includePlayersLabel = document.createElement('label');
            includePlayersLabel.textContent = 'Include players villages: ';
            includePlayersLabel.style.marginRight = '10px';
            includePlayersLabel.style.fontWeight = 'bold';
            includePlayersLabel.style.minWidth = '200px';
            
            var includePlayersCheckbox = document.createElement('input');
            includePlayersCheckbox.type = 'checkbox';
            includePlayersCheckbox.checked = settings.includePlayers;
            includePlayersCheckbox.style.cssText = `
                transform: scale(1.3);
                margin-right: 10px;
            `;
            
            includePlayersSetting.appendChild(includePlayersLabel);
            includePlayersSetting.appendChild(includePlayersCheckbox);
            
            // Max player points setting
            var maxPointsSetting = document.createElement('div');
            maxPointsSetting.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                padding: 10px;
                background: #fff;
                border-radius: 4px;
                border: 1px solid #e0e0e0;
            `;
            
            var maxPointsLabel = document.createElement('label');
            maxPointsLabel.textContent = 'Max player points: ';
            maxPointsLabel.style.marginRight = '10px';
            maxPointsLabel.style.fontWeight = 'bold';
            maxPointsLabel.style.minWidth = '200px';
            
            var maxPointsInput = document.createElement('input');
            maxPointsInput.type = 'number';
            maxPointsInput.min = '1';
            maxPointsInput.value = settings.maxPlayerPoints;
            maxPointsInput.style.cssText = `
                padding: 6px 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                width: 100px;
                font-size: 14px;
                margin-right: 10px;
            `;
            
            maxPointsSetting.appendChild(maxPointsLabel);
            maxPointsSetting.appendChild(maxPointsInput);
            
            // External auto-attack position settings
            var positionSetting = document.createElement('div');
            positionSetting.style.cssText = `
                display: flex;
                flex-direction: column;
                margin-bottom: 12px;
                padding: 10px;
                background: #fff;
                border-radius: 4px;
                border: 1px solid #e0e0e0;
            `;
            
            var positionLabel = document.createElement('label');
            positionLabel.textContent = 'External auto-attack position:';
            positionLabel.style.marginBottom = '8px';
            positionLabel.style.fontWeight = 'bold';
            
            var positionControls = document.createElement('div');
            positionControls.style.cssText = `
                display: flex;
                gap: 10px;
                align-items: center;
            `;
            
            var xLabel = document.createElement('span');
            xLabel.textContent = 'X:';
            xLabel.style.marginRight = '5px';
            
            var xInput = document.createElement('input');
            xInput.type = 'number';
            xInput.min = '0';
            xInput.value = settings.autoAttackPosition.x;
            xInput.style.cssText = `
                padding: 6px 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                width: 70px;
                font-size: 14px;
                margin-right: 15px;
            `;
            
            var yLabel = document.createElement('span');
            yLabel.textContent = 'Y:';
            yLabel.style.marginRight = '5px';
            
            var yInput = document.createElement('input');
            yInput.type = 'number';
            yInput.min = '0';
            yInput.value = settings.autoAttackPosition.y;
            yInput.style.cssText = `
                padding: 6px 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                width: 70px;
                font-size: 14px;
            `;
            
            positionControls.appendChild(xLabel);
            positionControls.appendChild(xInput);
            positionControls.appendChild(yLabel);
            positionControls.appendChild(yInput);
            
            positionSetting.appendChild(positionLabel);
            positionSetting.appendChild(positionControls);
            
            settingsContainer.appendChild(cooldownSetting);
            settingsContainer.appendChild(autoAttackSetting);
            settingsContainer.appendChild(includePlayersSetting);
            settingsContainer.appendChild(maxPointsSetting);
            settingsContainer.appendChild(positionSetting);
            
            // Add single save button for all settings
            var saveAllBtn = document.createElement('button');
            saveAllBtn.textContent = '💾 Save All Settings';
            saveAllBtn.style.cssText = `
                background: #4CAF50;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                width: 100%;
                margin-top: 15px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: background 0.2s;
            `;
            saveAllBtn.onmouseover = function() {
                this.style.background = '#45a049';
            };
            saveAllBtn.onmouseout = function() {
                this.style.background = '#4CAF50';
            };
            
            saveAllBtn.onclick = function() {
                // Update settings from inputs
                var newCooldown = parseInt(cooldownInput.value);
                if (newCooldown >= 1 && newCooldown <= 1440) {
                    settings.cooldown = newCooldown;
                } else {
                    showStatus('Please enter a valid cooldown (1-1440 minutes)', 'error');
                    return;
                }
                
                settings.autoAttack = autoAttackCheckbox.checked;
                settings.includePlayers = includePlayersCheckbox.checked;
                settings.maxPlayerPoints = parseInt(maxPointsInput.value) || 1000;
                settings.autoAttackPosition.x = parseInt(xInput.value) || 10;
                settings.autoAttackPosition.y = parseInt(yInput.value) || 100;
                
                // Save to storage
                saveAllSettings();
                
                // Update cooldown info display
                cooldownInfo.innerHTML = '<strong>⏰ Cooldown:</strong> ' + settings.cooldown + ' minutes';
                
                // Recreate external checkbox with new position
                createExternalAutoAttackCheckbox();
            };
            
            settingsContainer.appendChild(saveAllBtn);
            settingsSection.appendChild(settingsContainer);
        }
        
        // Initialize settings UI
        updateSettingsUI();
        
        // Create troop builds section
        var buildsSection = document.createElement('div');
        buildsSection.id = 'troop-builds';
        buildsSection.style.marginBottom = '20px';
        buildsSection.style.padding = '15px';
        buildsSection.style.backgroundColor = '#fff8e1';
        buildsSection.style.borderRadius = '6px';
        buildsSection.style.border = '1px solid #ffecb3';
        
        var buildsTitle = document.createElement('h4');
        buildsTitle.textContent = '👥 Troop Builds';
        buildsTitle.style.marginTop = '0';
        buildsTitle.style.marginBottom = '15px';
        buildsTitle.style.color = '#333';
        
        buildsSection.appendChild(buildsTitle);
        
        // Function to update builds UI
        function updateBuildsUI() {
            var buildsContainer = buildsSection.querySelector('#builds-container');
            if (buildsContainer) {
                buildsContainer.remove();
            }
            
            buildsContainer = document.createElement('div');
            buildsContainer.id = 'builds-container';
            
            // Create builds A and B
            ['A', 'B'].forEach(function(buildKey) {
                var build = troopBuilds[buildKey] || defaultBuilds[buildKey];
                
                var buildContainer = document.createElement('div');
                buildContainer.style.marginBottom = '15px';
                buildContainer.style.padding = '12px';
                buildContainer.style.backgroundColor = '#fff';
                buildContainer.style.borderRadius = '4px';
                buildContainer.style.border = '1px solid #e0e0e0';
                
                var buildHeader = document.createElement('div');
                buildHeader.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                    padding-bottom: 8px;
                    border-bottom: 2px solid ${buildKey === 'A' ? '#4CAF50' : '#2196F3'};
                `;
                
                var buildTitle = document.createElement('div');
                buildTitle.style.cssText = `
                    font-weight: bold;
                    font-size: 16px;
                    color: ${buildKey === 'A' ? '#4CAF50' : '#2196F3'};
                `;
                buildTitle.textContent = 'Build ' + buildKey;
                
                var saveBtn = document.createElement('button');
                saveBtn.textContent = '💾 Save';
                saveBtn.style.cssText = `
                    background: ${buildKey === 'A' ? '#4CAF50' : '#2196F3'};
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: bold;
                `;
                
                saveBtn.onclick = (function(key) {
                    return function() {
                        saveBuild(key);
                    };
                })(buildKey);
                
                buildHeader.appendChild(buildTitle);
                buildHeader.appendChild(saveBtn);
                
                var troopsContainer = document.createElement('div');
                troopsContainer.style.cssText = `
                    display: grid;
                    grid-template-columns: repeat(9, 1fr);
                    gap: 6px;
                `;
                
                // Define troop types with abbreviations
                var troopTypes = [
                    { key: 'spear', abbr: 'sp', name: 'Spear' },
                    { key: 'sword', abbr: 'sw', name: 'Sword' },
                    { key: 'axe', abbr: 'ax', name: 'Axe' },
                    { key: 'spy', abbr: 'spy', name: 'Spy' },
                    { key: 'light', abbr: 'lc', name: 'Light Cav' },
                    { key: 'heavy', abbr: 'hc', name: 'Heavy Cav' },
                    { key: 'ram', abbr: 'ram', name: 'Ram' },
                    { key: 'catapult', abbr: 'cat', name: 'Catapult' },
                    { key: 'knight', abbr: 'kn', name: 'Knight' }
                ];
                
                troopTypes.forEach(function(troop) {
                    var troopInput = document.createElement('div');
                    troopInput.style.cssText = `
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    `;
                    
                    var label = document.createElement('label');
                    label.textContent = troop.abbr;
                    label.title = troop.name;
                    label.style.cssText = `
                        font-size: 11px;
                        font-weight: bold;
                        color: #666;
                        margin-bottom: 4px;
                        text-align: center;
                        width: 100%;
                    `;
                    
                    var input = document.createElement('input');
                    input.type = 'number';
                    input.min = '0';
                    input.value = build[troop.key] || 0;
                    input.dataset.build = buildKey;
                    input.dataset.troop = troop.key;
                    input.style.cssText = `
                        padding: 4px;
                        border: 1px solid #ddd;
                        border-radius: 3px;
                        text-align: center;
                        font-size: 12px;
                        width: 45px;
                        box-sizing: border-box;
                    `;
                    
                    input.onchange = function() {
                        var value = parseInt(this.value) || 0;
                        if (!troopBuilds[buildKey]) {
                            troopBuilds[buildKey] = JSON.parse(JSON.stringify(defaultBuilds[buildKey]));
                        }
                        troopBuilds[buildKey][troop.key] = value;
                    };
                    
                    troopInput.appendChild(label);
                    troopInput.appendChild(input);
                    troopsContainer.appendChild(troopInput);
                });
                
                buildContainer.appendChild(buildHeader);
                buildContainer.appendChild(troopsContainer);
                buildsContainer.appendChild(buildContainer);
            });
            
            buildsSection.appendChild(buildsContainer);
        }
        
        // Initialize builds UI
        updateBuildsUI();
        
        // Function to save build
        function saveBuild(buildKey) {
            saveBuildsToStorage();
            showStatus('Build ' + buildKey + ' saved for ' + currentWorld, 'success');
        }
        
        // Create paste area section
        var pasteSection = document.createElement('div');
        pasteSection.style.marginBottom = '20px';
        
        var pasteLabel = document.createElement('label');
        pasteLabel.textContent = '📋 Paste village.txt content:';
        pasteLabel.style.display = 'block';
        pasteLabel.style.marginBottom = '10px';
        pasteLabel.style.fontWeight = 'bold';
        pasteLabel.style.fontSize = '14px';
        
        var pasteTextarea = document.createElement('textarea');
        pasteTextarea.id = 'village-textarea';
        pasteTextarea.style.cssText = `
            width: 100%;
            height: 120px;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-family: monospace;
            font-size: 13px;
            resize: vertical;
            box-sizing: border-box;
            margin-bottom: 12px;
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
        distanceContainer.style.marginBottom = '15px';
        distanceContainer.style.display = 'flex';
        distanceContainer.style.alignItems = 'center';
        
        var distanceLabel = document.createElement('label');
        distanceLabel.textContent = 'Max Distance: ';
        distanceLabel.style.marginRight = '10px';
        distanceLabel.style.fontWeight = 'bold';
        
        var distanceInput = document.createElement('input');
        distanceInput.type = 'number';
        distanceInput.value = '50';
        distanceInput.min = '1';
        distanceInput.style.cssText = `
            width: 80px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            margin-right: 15px;
        `;
        
        distanceContainer.appendChild(distanceLabel);
        distanceContainer.appendChild(distanceInput);
        
        // Create parse button
        var parseBtn = document.createElement('button');
        parseBtn.textContent = '🔍 Parse villages.txt';
        parseBtn.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 3px 6px rgba(0,0,0,0.1);
            transition: background 0.2s;
        `;
        parseBtn.onmouseover = function() {
            this.style.background = '#45a049';
        };
        parseBtn.onmouseout = function() {
            this.style.background = '#4CAF50';
        };
        
        // Create status message
        var statusMsg = document.createElement('div');
        statusMsg.id = 'parse-status';
        statusMsg.style.fontSize = '13px';
        statusMsg.style.marginBottom = '15px';
        statusMsg.style.padding = '10px';
        statusMsg.style.borderRadius = '6px';
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
        targetsContainer.style.marginTop = '20px';
        targetsContainer.style.paddingTop = '20px';
        targetsContainer.style.borderTop = '2px solid #ddd';
        
        var targetsTitle = document.createElement('h4');
        targetsTitle.textContent = '🎯 Targets for ' + currentWorld + ':';
        targetsTitle.style.marginBottom = '15px';
        targetsTitle.style.color = '#333';
        
        var targetsList = document.createElement('div');
        targetsList.id = 'targets-list';
        
        targetsContainer.appendChild(targetsTitle);
        targetsContainer.appendChild(targetsList);
        
        // Assemble UI
        uiContainer.appendChild(closeBtn);
        uiContainer.appendChild(title);
        uiContainer.appendChild(toggleConfigBtn);
        uiContainer.appendChild(autoAttackContainer);
        
        if (worlds.length > 0) {
            uiContainer.appendChild(worldSelector);
        }
        
        uiContainer.appendChild(infoSection);
        uiContainer.appendChild(settingsSection);
        uiContainer.appendChild(buildsSection);
        uiContainer.appendChild(pasteSection);
        uiContainer.appendChild(targetsContainer);
        
        document.body.appendChild(uiContainer);
        
        // Populate current targets list
        updateTargetsListUI();
        
        // Start auto-updating cooldowns
        startAutoUpdate();
        
        // Create external auto-attack checkbox
        createExternalAutoAttackCheckbox();
        
        // Function to toggle config visibility
        function toggleConfigVisibility() {
            var sectionsToHide = [settingsSection, buildsSection, pasteSection];
            var clearBtn = targetsList.querySelector('button');
            
            sectionsToHide.forEach(function(section) {
                section.style.display = configVisible ? 'block' : 'none';
            });
            
            if (clearBtn) {
                clearBtn.style.display = configVisible ? 'block' : 'none';
            }
            
            // Adjust UI container height
            if (!configVisible) {
                uiContainer.style.maxHeight = '70vh';
            } else {
                uiContainer.style.maxHeight = '85vh';
            }
        }
        
        // Initial toggle state (settings hidden on start)
        toggleConfigVisibility();
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
            targetsList.innerHTML = '<div style="color: #999; font-style: italic; padding: 20px; text-align: center; background: #f8f9fa; border-radius: 6px; border: 1px dashed #ddd;">No targets in list for ' + currentWorld + '</div>';
            return;
        }
        
        // Create clear all button (only show when config is visible)
        var clearAllBtn = document.createElement('button');
        clearAllBtn.textContent = '🗑️ Clear All Targets for ' + currentWorld;
        clearAllBtn.style.cssText = `
            background: #ff4444;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            margin-bottom: 15px;
            width: 100%;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: background 0.2s;
            display: ${configVisible ? 'block' : 'none'};
        `;
        clearAllBtn.onmouseover = function() {
            this.style.background = '#ff2222';
        };
        clearAllBtn.onmouseout = function() {
            this.style.background = '#ff4444';
        };
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
                padding: 12px 15px;
                margin: 8px 0;
                background: ${index % 2 === 0 ? '#f8f9fa' : '#fff'};
                border-radius: 8px;
                border: 1px solid #e9ecef;
                transition: transform 0.2s, box-shadow 0.2s;
            `;
            targetItem.onmouseover = function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            };
            targetItem.onmouseout = function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            };
            
            // Left side: Target info
            var targetInfo = document.createElement('div');
            targetInfo.style.flex = '1';
            
            var distance = homeCoords ? calculateDistance(homeCoords, target) : 0;
            var cooldownInfo = getCooldownInfo(target);
            
            var targetCoords = document.createElement('div');
            targetCoords.style.cssText = `
                font-family: monospace;
                font-weight: bold;
                font-size: 16px;
                color: #333;
                margin-bottom: 4px;
            `;
            targetCoords.textContent = target;
            
            var targetDetails = document.createElement('div');
            targetDetails.style.cssText = `
                font-size: 12px;
                color: #666;
                display: flex;
                align-items: center;
                gap: 15px;
                flex-wrap: wrap;
            `;
            
            var distanceSpan = document.createElement('span');
            distanceSpan.innerHTML = `<strong>Distance:</strong> ${distance.toFixed(2)}`;
            
            var lastAttackSpan = document.createElement('span');
            lastAttackSpan.innerHTML = `<strong>Last:</strong> ${formatTimeSince(cooldownInfo.lastAttack)}`;
            
            var cooldownSpan = document.createElement('span');
            if (cooldownInfo.onCooldown) {
                cooldownSpan.innerHTML = `<strong style="color: #ff6b6b;">⏳ Cooldown:</strong> ${cooldownInfo.minutesLeft}m left`;
                cooldownSpan.title = 'Attacked ' + formatTimeSince(cooldownInfo.lastAttack);
            } else {
                cooldownSpan.innerHTML = `<strong style="color: #4CAF50;">✅ Ready</strong>`;
            }
            
            targetDetails.appendChild(distanceSpan);
            targetDetails.appendChild(lastAttackSpan);
            targetDetails.appendChild(cooldownSpan);
            
            targetInfo.appendChild(targetCoords);
            targetInfo.appendChild(targetDetails);
            
            // Middle: Attack buttons
            var attackButtons = document.createElement('div');
            attackButtons.style.cssText = `
                display: flex;
                gap: 8px;
                margin: 0 15px;
            `;
            
            // Build A button
            var attackBtnA = document.createElement('button');
            attackBtnA.textContent = 'A';
            attackBtnA.disabled = cooldownInfo.onCooldown;
            attackBtnA.title = 'Attack with Build A';
            attackBtnA.style.cssText = `
                background: ${cooldownInfo.onCooldown ? '#cccccc' : '#4CAF50'};
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: ${cooldownInfo.onCooldown ? 'not-allowed' : 'pointer'};
                font-size: 14px;
                font-weight: bold;
                min-width: 50px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: transform 0.2s, box-shadow 0.2s;
            `;
            
            if (!cooldownInfo.onCooldown) {
                attackBtnA.onmouseover = function() {
                    this.style.transform = 'scale(1.05)';
                    this.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15)';
                };
                attackBtnA.onmouseout = function() {
                    this.style.transform = 'scale(1)';
                    this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                };
                attackBtnA.onclick = (function(targetToAttack) {
                    return function() {
                        attackTarget(targetToAttack, 'A');
                    };
                })(target);
            }
            
            // Build B button
            var attackBtnB = document.createElement('button');
            attackBtnB.textContent = 'B';
            attackBtnB.disabled = cooldownInfo.onCooldown;
            attackBtnB.title = 'Attack with Build B';
            attackBtnB.style.cssText = `
                background: ${cooldownInfo.onCooldown ? '#cccccc' : '#2196F3'};
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: ${cooldownInfo.onCooldown ? 'not-allowed' : 'pointer'};
                font-size: 14px;
                font-weight: bold;
                min-width: 50px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: transform 0.2s, box-shadow 0.2s;
            `;
            
            if (!cooldownInfo.onCooldown) {
                attackBtnB.onmouseover = function() {
                    this.style.transform = 'scale(1.05)';
                    this.style.boxShadow = '0 3px 6px rgba(0,0,0,0.15)';
                };
                attackBtnB.onmouseout = function() {
                    this.style.transform = 'scale(1)';
                    this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                };
                attackBtnB.onclick = (function(targetToAttack) {
                    return function() {
                        attackTarget(targetToAttack, 'B');
                    };
                })(target);
            }
            
            attackButtons.appendChild(attackBtnA);
            attackButtons.appendChild(attackBtnB);
            
            // Right side: Remove button
            var removeBtn = document.createElement('button');
            removeBtn.textContent = '✕';
            removeBtn.title = 'Remove target';
            removeBtn.style.cssText = `
                background: #ff6b6b;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                transition: transform 0.2s, background 0.2s;
            `;
            removeBtn.onmouseover = function() {
                this.style.transform = 'scale(1.1)';
                this.style.background = '#ff4444';
            };
            removeBtn.onmouseout = function() {
                this.style.transform = 'scale(1)';
                this.style.background = '#ff6b6b';
            };
            removeBtn.onclick = (function(targetToRemove) {
                return function() {
                    if (removeFromTargetList(targetToRemove)) {
                        updateTargetsListUI();
                        showStatus('Target removed: ' + targetToRemove, 'success');
                    }
                };
            })(target);
            
            targetItem.appendChild(targetInfo);
            targetItem.appendChild(attackButtons);
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
            
            // Get current targets to filter out already added villages
            var currentTargets = getCurrentTargets();
            
            lines.forEach(function(line) {
                if (!line.trim()) return;
                
                var parts = line.split(',');
                if (parts.length >= 7) {
                    var playerNumber = parseInt(parts[4]);
                    var villagePoints = parseInt(parts[5]) || 0;
                    var isBonusVillage = parseInt(parts[6]);
                    
                    // Check if village should be included based on settings
                    var shouldInclude = false;
                    
                    if (playerNumber === 0 && isBonusVillage === 0) {
                        // Barbarian village
                        shouldInclude = true;
                    } else if (settings.includePlayers && playerNumber > 0 && villagePoints <= settings.maxPlayerPoints) {
                        // Player village within points limit
                        shouldInclude = true;
                    }
                    
                    if (shouldInclude) {
                        var villageName = decodeURIComponent(parts[1]).replace(/\+/g, ' ');
                        var x = parts[2];
                        var y = parts[3];
                        var coords = x + '|' + y;
                        var distance = homeCoords ? calculateDistance(homeCoords, coords) : 0;
                        
                        // Apply distance filter and check if not already in list
                        if (!maxDistance || distance <= parseInt(maxDistance)) {
                            // Check if village is already in target list
                            if (currentTargets.indexOf(coords) === -1) {
                                villages.push({
                                    name: villageName,
                                    coords: coords,
                                    distance: distance,
                                    playerNumber: playerNumber,
                                    points: villagePoints
                                });
                            }
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
            
            var alreadyAdded = validLines - villages.length;
            var statusMessage = 'Found ' + villages.length + ' available villages';
            if (alreadyAdded > 0) {
                statusMessage += ' (' + alreadyAdded + ' already in list)';
            }
            statusMessage += ' out of ' + validLines + ' total villages';
            
            showStatus(statusMessage, 'success');
            
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
            border-radius: 10px;
            padding: 25px;
            width: 700px;
            max-width: 90vw;
            max-height: 85vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        // Create header
        var header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 3px solid #4CAF50;
        `;
        
        var title = document.createElement('h3');
        title.textContent = '🎯 Select Villages for ' + currentWorld + ' (' + villages.length + ' available)';
        title.style.margin = '0';
        title.style.color = '#333';
        title.style.fontSize = '18px';
        
        var closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            cursor: pointer;
            font-size: 18px;
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
        searchContainer.style.marginBottom = '20px';
        
        var searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '🔍 Search villages...';
        searchInput.style.cssText = `
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #ddd;
            border-radius: 8px;
            box-sizing: border-box;
            font-size: 14px;
        `;
        
        searchContainer.appendChild(searchInput);
        
        // Create villages list container
        var villagesContainer = document.createElement('div');
        villagesContainer.id = 'villages-container';
        villagesContainer.style.cssText = `
            flex: 1;
            overflow-y: auto;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            background: #f8f9fa;
        `;
        
        // Create footer
        var footer = document.createElement('div');
        footer.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
        `;
        
        var selectedCount = document.createElement('span');
        selectedCount.id = 'selected-count';
        selectedCount.textContent = '📌 Selected: 0';
        selectedCount.style.color = '#666';
        selectedCount.style.fontSize = '14px';
        
        var addSelectedBtn = document.createElement('button');
        addSelectedBtn.textContent = '✅ Add Selected to List';
        addSelectedBtn.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 3px 6px rgba(0,0,0,0.1);
        `;
        
        var closeFooterBtn = document.createElement('button');
        closeFooterBtn.textContent = 'Close';
        closeFooterBtn.style.cssText = `
            background: #666;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
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
                villagesContainer.innerHTML = '<div style="text-align: center; padding: 30px; color: #666; font-size: 14px;">No villages match your search</div>';
                updateSelectedCount();
                return;
            }
            
            filtered.forEach(function(village, index) {
                var villageItem = document.createElement('div');
                villageItem.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 15px;
                    margin: 8px 0;
                    background: ${index % 2 === 0 ? '#fff' : '#f8f9fa'};
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                    cursor: pointer;
                    transition: background-color 0.2s, transform 0.2s;
                `;
                
                villageItem.onmouseover = function() {
                    this.style.backgroundColor = '#e9ecef';
                    this.style.transform = 'translateX(5px)';
                };
                villageItem.onmouseout = function() {
                    if (!this.classList.contains('selected')) {
                        this.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
                    }
                    this.style.transform = 'translateX(0)';
                };
                
                var villageInfo = document.createElement('div');
                villageInfo.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    font-family: monospace;
                    font-size: 13px;
                `;
                
                var villageName = document.createElement('span');
                villageName.textContent = village.name + ' - ' + village.coords;
                
                var villageDetails = document.createElement('span');
                villageDetails.style.cssText = `
                    font-size: 11px;
                    color: #666;
                    margin-top: 2px;
                `;
                
                var detailsText = 'Distance: ' + village.distance.toFixed(2);
                if (village.playerNumber > 0) {
                    detailsText += ' | Player village | Points: ' + village.points;
                } else {
                    detailsText += ' | Barbarian village';
                }
                
                villageDetails.textContent = detailsText;
                
                villageInfo.appendChild(villageName);
                villageInfo.appendChild(villageDetails);
                
                var checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.style.marginLeft = '15px';
                checkbox.style.transform = 'scale(1.2)';
                
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
            selectedCount.textContent = '📌 Selected: ' + selectedVillages.length;
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
})();
