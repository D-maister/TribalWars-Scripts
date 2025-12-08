(function() {
    // ===== CONFIGURATION SECTION =====
    var cookieName = "akk";
    var historyCookie = "attackHistory";
    var targetsStorageKey = "twAttackTargets";
    var buildsStorageKey = "twAttackBuilds";
    var settingsStorageKey = "twAttackSettings";
    var ignoreStorageKey = "twAttackIgnoreList";
    var defaultCooldown = 30;
    
    var homeCoords = "";
    var targetList = "";
    var currentWorld = "";
    var configVisible = false;
    var updateInterval = null;
    
    var defaultBuilds = {
        "A": { spear: 0, sword: 0, axe: 0, spy: 0, light: 2, heavy: 0, ram: 0, catapult: 0, knight: 0 },
        "B": { spear: 0, sword: 0, axe: 0, spy: 0, light: 0, heavy: 0, ram: 0, catapult: 0, knight: 0 }
    };
    
    var troopBuilds = {};
    
    var settings = {
        cooldown: defaultCooldown,
        autoAttack: true,
        includePlayers: false,
        maxPlayerPoints: 1000,
        autoAttackEnabled: false,
        autoAttackPosition: { x: 10, y: 100 }
    };

    // ===== ANTIBOT CHECK =====
    function checkForAntibot() {
        if (document.querySelector('td.bot-protection-row, div#botprotection_quest.quest')) {
            alert('Check for ANTIBOT CAPTCHA');
            return true;
        }
        return false;
    }

    // ===== UTILITY FUNCTIONS =====
    
    function getWorldName() {
        var url = window.location.href;
        var match = url.match(/https?:\/\/([^\/]+?)\.voynaplemyon\./);
        return match ? match[1] : "unknown";
    }
    
    function getCookie(name) {
        var match = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
        return match ? decodeURIComponent(match[2]) : null;
    }
    
    function setCookie(name, value, days) {
        var date = new Date();
        date.setTime(date.getTime() + (86400000 * days));
        document.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + date.toUTCString() + ";path=/";
    }
    
    function calculateDistance(coord1, coord2) {
        var parts1 = coord1.split("|");
        var parts2 = coord2.split("|");
        var dx = parseInt(parts1[0]) - parseInt(parts2[0]);
        var dy = parseInt(parts1[1]) - parseInt(parts2[1]);
        return Math.round(100 * Math.sqrt(dx * dx + dy * dy)) / 100;
    }
    
    function getAttackHistory() {
        var history = getCookie(historyCookie);
        return history ? JSON.parse(history) : {};
    }
    
    function saveAttackHistory(history) {
        setCookie(historyCookie, JSON.stringify(history), 7);
    }
    
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
    
    function recordAttack(target) {
        var history = getAttackHistory();
        history[target] = (new Date()).getTime();
        saveAttackHistory(history);
        var distance = calculateDistance(homeCoords, target);
        console.log("Attack " + target + " (distance: " + distance + ")");
    }
    
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
    
    function setUnitCount(field, count) {
        if (field && count > 0) {
            var unitType = field.name;
            var availableElement = field.parentNode.querySelector('.units-entry-all');
            var available = 0;
            
            if (availableElement) {
                var match = availableElement.textContent.match(/\((\d+)\)/);
                if (match) {
                    available = parseInt(match[1]);
                }
            }
            
            var actualCount = Math.min(count, available);
            field.value = actualCount;
            
            if (actualCount < count) {
                console.log("Warning: Only " + actualCount + " " + unitType + " available (requested " + count + ")");
            }
        }
    }
    
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
    
    function getVillageTxtUrl() {
        return 'https://' + currentWorld + '.voynaplemyon.com/map/village.txt';
    }
    
    function loadTargetsFromStorage() {
        try {
            var storedData = localStorage.getItem(targetsStorageKey);
            if (storedData) {
                var allTargets = JSON.parse(storedData);
                if (allTargets[currentWorld]) {
                    targetList = allTargets[currentWorld];
                } else {
                    targetList = "";
                }
            } else {
                targetList = "";
            }
        } catch (e) {
            console.error("Error loading targets:", e);
            targetList = "";
        }
    }
    
    function saveTargetsToStorage() {
        try {
            var storedData = localStorage.getItem(targetsStorageKey);
            var allTargets = storedData ? JSON.parse(storedData) : {};
            allTargets[currentWorld] = targetList;
            localStorage.setItem(targetsStorageKey, JSON.stringify(allTargets));
        } catch (e) {
            console.error("Error saving targets:", e);
        }
    }
    
    function loadBuildsFromStorage() {
        try {
            var storedData = localStorage.getItem(buildsStorageKey);
            if (storedData) {
                var allBuilds = JSON.parse(storedData);
                if (allBuilds[currentWorld]) {
                    troopBuilds = allBuilds[currentWorld];
                } else {
                    troopBuilds = JSON.parse(JSON.stringify(defaultBuilds));
                }
            } else {
                troopBuilds = JSON.parse(JSON.stringify(defaultBuilds));
            }
        } catch (e) {
            console.error("Error loading builds:", e);
            troopBuilds = JSON.parse(JSON.stringify(defaultBuilds));
        }
    }
    
    function saveBuildsToStorage() {
        try {
            var storedData = localStorage.getItem(buildsStorageKey);
            var allBuilds = storedData ? JSON.parse(storedData) : {};
            allBuilds[currentWorld] = troopBuilds;
            localStorage.setItem(buildsStorageKey, JSON.stringify(allBuilds));
        } catch (e) {
            console.error("Error saving builds:", e);
        }
    }
    
    function loadSettingsFromStorage() {
        try {
            var storedData = localStorage.getItem(settingsStorageKey);
            if (storedData) {
                var allSettings = JSON.parse(storedData);
                if (allSettings[currentWorld]) {
                    settings = allSettings[currentWorld];
                    settings.autoAttack = true;
                    
                    // Initialize autoAttackBuilds if not exists
                    if (!settings.autoAttackBuilds) {
                        settings.autoAttackBuilds = {
                            A: true,
                            B: false
                        };
                    }
                    
                    if (settings.includePlayers === undefined) settings.includePlayers = false;
                    if (settings.maxPlayerPoints === undefined) settings.maxPlayerPoints = 1000;
                    if (settings.autoAttackEnabled === undefined) settings.autoAttackEnabled = false;
                    if (settings.autoAttackPosition === undefined) settings.autoAttackPosition = { x: 10, y: 100 };
                } else {
                    settings = {
                        cooldown: defaultCooldown,
                        autoAttack: true,
                        includePlayers: false,
                        maxPlayerPoints: 1000,
                        autoAttackEnabled: false,
                        autoAttackPosition: { x: 10, y: 100 },
                        autoAttackBuilds: {
                            A: true,
                            B: false
                        }
                    };
                }
            } else {
                settings = {
                    cooldown: defaultCooldown,
                    autoAttack: true,
                    includePlayers: false,
                    maxPlayerPoints: 1000,
                    autoAttackEnabled: false,
                    autoAttackPosition: { x: 10, y: 100 },
                    autoAttackBuilds: {
                        A: true,
                        B: false
                    }
                };
            }
        } catch (e) {
            console.error("Error loading settings:", e);
            settings = {
                cooldown: defaultCooldown,
                autoAttack: true,
                includePlayers: false,
                maxPlayerPoints: 1000,
                autoAttackEnabled: false,
                autoAttackPosition: { x: 10, y: 100 },
                autoAttackBuilds: {
                    A: true,
                    B: false
                }
            };
        }
    }
    
    function saveSettingsToStorage() {
        try {
            var storedData = localStorage.getItem(settingsStorageKey);
            var allSettings = storedData ? JSON.parse(storedData) : {};
            allSettings[currentWorld] = settings;
            localStorage.setItem(settingsStorageKey, JSON.stringify(allSettings));
        } catch (e) {
            console.error("Error saving settings:", e);
        }
    }
    
    function saveAllSettings() {
        saveSettingsToStorage();
        showStatus('All settings saved for ' + currentWorld, 'success');
    }
    
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
            console.error("Error getting worlds:", e);
        }
        return [];
    }
    
    function updateTargetList(newTargetList) {
        targetList = newTargetList;
        saveTargetsToStorage();
    }
    
    function addToTargetList(targetToAdd) {
        var targets = targetList.split(' ').filter(Boolean);
        if (targets.indexOf(targetToAdd) === -1) {
            targets.push(targetToAdd);
            updateTargetList(targets.join(' '));
            return true;
        }
        return false;
    }
    
    function removeFromTargetList(targetToRemove) {
        var targets = targetList.split(' ').filter(Boolean);
        var index = targets.indexOf(targetToRemove);
        
        if (index !== -1) {
            targets.splice(index, 1);
            updateTargetList(targets.join(' '));
            setCookie(cookieName, "0", 365);
            return true;
        }
        return false;
    }
    
    function clearAllTargets() {
        updateTargetList('');
    }
    
    function getCurrentTargets() {
        return targetList.split(' ').filter(Boolean);
    }
    
    function formatTimeSince(lastAttack) {
        if (!lastAttack) return "Never";
        var now = new Date();
        var diffMs = now - lastAttack;
        var diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 60) return diffMins + "m ago";
        else if (diffMins < 1440) return Math.floor(diffMins / 60) + "h ago";
        else return Math.floor(diffMins / 1440) + "d ago";
    }
    
    function startAutoUpdate() {
        if (updateInterval) clearInterval(updateInterval);
        updateInterval = setInterval(function() {
            updateTargetsListUI();
        }, 30000);
    }
    
    function stopAutoUpdate() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }
    
    function createExternalAutoAttackCheckbox() {
        var existingCheckbox = document.getElementById('external-auto-attack');
        if (existingCheckbox) existingCheckbox.remove();
        
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
            padding: 12px 15px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            gap: 10px;
            cursor: move;
            user-select: none;
            min-width: 180px;
        `;
        
        var isDragging = false;
        var offsetX, offsetY;
        
        checkboxContainer.onmousedown = function(e) {
            if (e.target.type === 'checkbox' || e.target.tagName === 'LABEL') return;
            isDragging = true;
            offsetX = e.clientX - checkboxContainer.offsetLeft;
            offsetY = e.clientY - checkboxContainer.offsetTop;
            e.preventDefault();
        };
        
        document.onmousemove = function(e) {
            if (!isDragging) return;
            var x = e.clientX - offsetX;
            var y = e.clientY - offsetY;
            x = Math.max(0, Math.min(x, window.innerWidth - checkboxContainer.offsetWidth));
            y = Math.max(0, Math.min(y, window.innerHeight - checkboxContainer.offsetHeight));
            checkboxContainer.style.left = x + 'px';
            checkboxContainer.style.top = y + 'px';
            settings.autoAttackPosition.x = x;
            settings.autoAttackPosition.y = y;
        };
        
        document.onmouseup = function() {
            if (isDragging) {
                isDragging = false;
                saveSettingsToStorage();
            }
        };
        
        // Header
        var header = document.createElement('div');
        header.style.cssText = `display: flex; align-items: center; gap: 8px;`;
        
        var label = document.createElement('span');
        label.textContent = 'Auto-Attack:';
        label.style.fontWeight = 'bold';
        label.style.fontSize = '14px';
        
        var sliderContainer = document.createElement('label');
        sliderContainer.style.cssText = `
            position: relative;
            display: inline-block;
            width: 50px;
            height: 26px;
        `;
        
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = settings.autoAttackEnabled;
        checkbox.style.cssText = `opacity: 0; width: 0; height: 0;`;
        
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
        
        function updateSlider() {
            if (checkbox.checked) {
                slider.style.backgroundColor = '#4CAF50';
                sliderKnob.style.transform = 'translateX(24px)';
            } else {
                slider.style.backgroundColor = '#ccc';
                sliderKnob.style.transform = 'translateX(0)';
            }
        }
        
        updateSlider();
        
        checkbox.onchange = function() {
            settings.autoAttackEnabled = this.checked;
            saveSettingsToStorage();
            updateSlider();
            
            if (settings.autoAttackEnabled) {
                showStatus('External auto-attack enabled', 'success');
                // Start auto-attack with the appropriate build selection logic
                setTimeout(function() {
                    startExternalAutoAttack();
                }, 2000);
            } else {
                showStatus('External auto-attack disabled', 'info');
            }
        };
        
        slider.appendChild(sliderKnob);
        sliderContainer.appendChild(checkbox);
        sliderContainer.appendChild(slider);
        
        header.appendChild(label);
        header.appendChild(sliderContainer);
        
        // Build selection checkboxes
        var buildSelection = document.createElement('div');
        buildSelection.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-top: 5px;
        `;
        
        // Initialize settings.autoAttackBuilds if not exists
        if (!settings.autoAttackBuilds) {
            settings.autoAttackBuilds = {
                A: true,
                B: false
            };
        }
        
        var buildAContainer = document.createElement('div');
        buildAContainer.style.cssText = `display: flex; align-items: center; gap: 6px;`;
        
        var buildACheckbox = document.createElement('input');
        buildACheckbox.type = 'checkbox';
        buildACheckbox.id = 'external-build-a';
        buildACheckbox.checked = settings.autoAttackBuilds.A;
        buildACheckbox.style.cssText = `transform: scale(1.1);`;
        
        var buildALabel = document.createElement('label');
        buildALabel.htmlFor = 'external-build-a';
        buildALabel.textContent = 'Build A';
        buildALabel.style.cssText = `font-size: 13px; color: #4CAF50; font-weight: bold; cursor: pointer;`;
        
        buildAContainer.appendChild(buildACheckbox);
        buildAContainer.appendChild(buildALabel);
        
        var buildBContainer = document.createElement('div');
        buildBContainer.style.cssText = `display: flex; align-items: center; gap: 6px;`;
        
        var buildBCheckbox = document.createElement('input');
        buildBCheckbox.type = 'checkbox';
        buildBCheckbox.id = 'external-build-b';
        buildBCheckbox.checked = settings.autoAttackBuilds.B;
        buildBCheckbox.style.cssText = `transform: scale(1.1);`;
        
        var buildBLabel = document.createElement('label');
        buildBLabel.htmlFor = 'external-build-b';
        buildBLabel.textContent = 'Build B';
        buildBLabel.style.cssText = `font-size: 13px; color: #2196F3; font-weight: bold; cursor: pointer;`;
        
        buildBContainer.appendChild(buildBCheckbox);
        buildBContainer.appendChild(buildBLabel);
        
        buildSelection.appendChild(buildAContainer);
        buildSelection.appendChild(buildBContainer);
        
        // Save build selections when changed
        function saveBuildSelections() {
            settings.autoAttackBuilds = {
                A: buildACheckbox.checked,
                B: buildBCheckbox.checked
            };
            saveSettingsToStorage();
        }
        
        buildACheckbox.onchange = saveBuildSelections;
        buildBCheckbox.onchange = saveBuildSelections;
        
        var helpText = document.createElement('div');
        helpText.textContent = 'Drag to move';
        helpText.style.cssText = `font-size: 10px; color: #666; margin-top: 4px; text-align: center;`;
        
        checkboxContainer.appendChild(header);
        checkboxContainer.appendChild(buildSelection);
        checkboxContainer.appendChild(helpText);
        document.body.appendChild(checkboxContainer);
    }
    
    function clickAttackButton() {
        if (checkForAntibot()) return false;
        
        var doc = window.frames.length > 0 ? window.main.document : document;
        var submitButton = doc.querySelector('input[type="submit"], button[type="submit"], input[name="target_attack"]');
        if (submitButton) {
            console.log("Auto-attack: Clicking submit button");
            submitButton.click();
            return true;
        } else if (doc.forms[0]) {
            doc.forms[0].submit();
            return true;
        }
        return false;
    }
    
    function attackTarget(target, buildKey) {
        if (checkForAntibot()) return;
        
        var currentUrl = location.href;
        var doc = window.frames.length > 0 ? window.main.document : document;
        
        if (currentUrl.indexOf("screen=place") > -1 && 
            currentUrl.indexOf("try=confirm") < 0 && 
            doc.forms[0]) {
            
            var availableTroops = getAvailableTroops();
            var build = troopBuilds[buildKey] || defaultBuilds[buildKey] || defaultBuilds["A"];
            
            var hasEnoughTroops = true;
            var missingTroops = [];
            
            for (var troopType in build) {
                if (build[troopType] > 0) {
                    var available = availableTroops[troopType] || 0;
                    if (available < build[troopType]) {
                        hasEnoughTroops = false;
                        missingTroops.push({
                            type: troopType,
                            needed: build[troopType],
                            available: available
                        });
                    }
                }
            }
            
            if (!hasEnoughTroops) {
                console.log("Not enough troops for Build " + buildKey + ":", missingTroops);
                showStatus('Not enough troops for Build ' + buildKey + '. Trying fallback...', 'error');
                
                // Check if we should try Build B as fallback
                if (buildKey === 'A' && settings.autoAttackEnabled && settings.autoAttackBuilds && settings.autoAttackBuilds.B) {
                    console.log("Trying Build B as fallback...");
                    setTimeout(function() {
                        autoAttackNext('B');
                    }, 1000);
                } else {
                    // Schedule next check in 30 seconds
                    setTimeout(function() {
                        console.log('Re-checking troop availability...');
                        autoAttackNext(buildKey);
                    }, 30000);
                }
                
                return;
            }
            
            var coords = target.split("|");
            doc.forms[0].x.value = coords[0];
            doc.forms[0].y.value = coords[1];
            
            setUnitCount(doc.forms[0].spear, build.spear);
            setUnitCount(doc.forms[0].sword, build.sword);
            setUnitCount(doc.forms[0].axe, build.axe);
            setUnitCount(doc.forms[0].spy, build.spy);
            setUnitCount(doc.forms[0].light, build.light);
            setUnitCount(doc.forms[0].heavy, build.heavy);
            setUnitCount(doc.forms[0].ram, build.ram);
            setUnitCount(doc.forms[0].catapult, build.catapult);
            setUnitCount(doc.forms[0].knight, build.knight);
            
            recordAttack(target);
            showStatus('Target ' + target + ' prepared with Build ' + buildKey + '! Click "Place" button to send.', 'success');
            updateTargetsListUI();
            
            // Auto-attack is always enabled now (checkbox removed)
            setTimeout(function() {
                if (clickAttackButton()) {
                    showStatus('Auto-attack: Attack sent to ' + target, 'success');
                } else {
                    showStatus('Auto-attack: Could not find submit button', 'error');
                }
            }, 500);
        } else {
            showStatus('Please go to Rally Point > Place tab to attack', 'error');
        }
    }
    
    function autoAttackNext(buildKey) {
        console.log("=== autoAttackNext called ===");
        console.log("Requested build key:", buildKey);
        console.log("Target list:", targetList);
        console.log("Current targets array:", targetList.split(" ").filter(Boolean));
        
        if (checkForAntibot()) return;
        cleanupOldHistory();
        
        var targets = targetList.split(" ").filter(Boolean);
        if (targets.length === 0) {
            showStatus('No targets in list for auto-attack', 'error');
            
            // If external auto-attack is running, retry after delay
            if (settings.autoAttackEnabled) {
                setTimeout(function() {
                    startExternalAutoAttack();
                }, 60000); // Retry in 1 minute
            }
            return;
        }
        
        var targetIndex = 0;
        var savedIndex = getCookie(cookieName);
        if (null !== savedIndex) targetIndex = parseInt(savedIndex);
        
        var startIndex = targetIndex;
        var selectedTarget = null;
        var attempts = 0;
        
        do {
            var currentTarget = targets[targetIndex];
            var cooldownInfo = getCooldownInfo(currentTarget);
            
            console.log("Checking target:", currentTarget);
            console.log("Cooldown info:", cooldownInfo);
            
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
            var shortestCooldown = Infinity;
            var shortestCooldownTarget = null;
            var shortestCooldownMinutes = 0;
            
            targets.forEach(function(target) {
                var cooldownInfo = getCooldownInfo(target);
                if (cooldownInfo.onCooldown && cooldownInfo.minutesLeft < shortestCooldown) {
                    shortestCooldown = cooldownInfo.minutesLeft;
                    shortestCooldownTarget = target;
                    shortestCooldownMinutes = cooldownInfo.minutesLeft;
                }
            });
            
            if (shortestCooldownTarget) {
                showStatus('All targets on cooldown. Waiting for ' + shortestCooldownTarget + ' (' + shortestCooldownMinutes + 'm left)', 'info');
                
                var checkDelay = Math.max(60000, shortestCooldownMinutes * 60000);
                
                setTimeout(function() {
                    console.log('Re-checking for available targets after cooldown...');
                    autoAttackNext(buildKey);
                }, checkDelay);
            } else {
                showStatus('All targets are on cooldown', 'error');
            }
        }
    }
    
    // ===== UI CREATION =====
    
    function createConfigUI() {
        if (checkForAntibot()) return;
        
        var existingUI = document.getElementById('tw-attack-config');
        if (existingUI) existingUI.remove();
        
        currentWorld = getWorldName();
        homeCoords = getCurrentVillageCoords();
        
        loadTargetsFromStorage();
        loadBuildsFromStorage();
        loadSettingsFromStorage();
        
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
            var externalCheckbox = document.getElementById('external-auto-attack');
            if (externalCheckbox) externalCheckbox.remove();
        };
        
        var title = document.createElement('h3');
        title.textContent = '⚔️ TW Attack Config - ' + currentWorld;
        title.style.marginTop = '0';
        title.style.marginBottom = '20px';
        title.style.color = '#333';
        title.style.borderBottom = '2px solid #4CAF50';
        title.style.paddingBottom = '10px';
        
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
        toggleConfigBtn.onmouseover = function() { this.style.background = '#555'; };
        toggleConfigBtn.onmouseout = function() { this.style.background = '#666'; };
        toggleConfigBtn.onclick = function() {
            configVisible = !configVisible;
            this.textContent = configVisible ? '▲ Hide Config' : '▼ Show Config';
            toggleConfigVisibility();
        };
        
        var autoAttackContainer = document.createElement('div');
        autoAttackContainer.style.cssText = `display: flex; gap: 10px; margin-bottom: 20px;`;
        
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
        autoAttackBtnA.onclick = function() { autoAttackNext('A'); };
        
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
        autoAttackBtnB.onclick = function() { autoAttackNext('B'); };
        
        autoAttackContainer.appendChild(autoAttackBtnA);
        autoAttackContainer.appendChild(autoAttackBtnB);
        
        var worlds = getWorldsWithTargets();
        var worldSelector;
        if (worlds.length > 0) {
            worldSelector = document.createElement('div');
            worldSelector.style.cssText = `
                margin-bottom: 20px;
                padding: 12px;
                background-color: #f0f8ff;
                border-radius: 6px;
                border: 1px solid #b8d4ff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            `;
            
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
            
            if (worlds.indexOf(currentWorld) === -1) worlds.unshift(currentWorld);
            
            worlds.forEach(function(world) {
                var option = document.createElement('option');
                option.value = world;
                option.textContent = world;
                if (world === currentWorld) option.selected = true;
                worldSelect.appendChild(option);
            });
            
            worldSelect.onchange = function() {
                saveTargetsToStorage();
                saveBuildsToStorage();
                saveSettingsToStorage();
                currentWorld = this.value;
                title.textContent = '⚔️ TW Attack Config - ' + currentWorld;
                loadTargetsFromStorage();
                loadBuildsFromStorage();
                loadSettingsFromStorage();
                updateBuildsUI();
                updateSettingsUI();
                updateTargetsListUI();
                createExternalAutoAttackCheckbox();
            };
            
            worldSelector.appendChild(worldLabel);
            worldSelector.appendChild(worldSelect);
        }
        
        var infoSection = document.createElement('div');
        infoSection.id = 'world-info';
        infoSection.style.cssText = `
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 6px;
            border: 1px solid #e9ecef;
        `;
        
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
        villageUrl.style.cssText = `margin-top: 12px; padding-top: 12px; border-top: 1px dashed #ddd;`;
        
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
        urlLink.onmouseover = function() { this.style.background = '#bbdefb'; };
        urlLink.onmouseout = function() { this.style.background = '#e3f2fd'; };
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
        
        var settingsSection = document.createElement('div');
        settingsSection.id = 'settings-section';
        settingsSection.style.cssText = `
            margin-bottom: 20px;
            padding: 15px;
            background-color: #fff8e1;
            border-radius: 6px;
            border: 1px solid #ffecb3;
        `;
        
        var settingsTitle = document.createElement('h4');
        settingsTitle.textContent = '⚙️ Settings';
        settingsTitle.style.marginTop = '0';
        settingsTitle.style.marginBottom = '15px';
        settingsTitle.style.color = '#333';
        
        settingsSection.appendChild(settingsTitle);
        
        function updateSettingsUI() {
            var settingsContainer = settingsSection.querySelector('#settings-container');
            if (settingsContainer) settingsContainer.remove();
            
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
            
            // Include players villages setting
            var includePlayersSetting = document.createElement('div');
            includePlayersSetting.style.cssText = cooldownSetting.style.cssText;
            
            var includePlayersLabel = document.createElement('label');
            includePlayersLabel.textContent = 'Include players villages: ';
            includePlayersLabel.style.marginRight = '10px';
            includePlayersLabel.style.fontWeight = 'bold';
            includePlayersLabel.style.minWidth = '200px';
            
            var includePlayersCheckbox = document.createElement('input');
            includePlayersCheckbox.type = 'checkbox';
            includePlayersCheckbox.checked = settings.includePlayers;
            includePlayersCheckbox.style.cssText = `transform: scale(1.3); margin-right: 10px;`;
            
            includePlayersSetting.appendChild(includePlayersLabel);
            includePlayersSetting.appendChild(includePlayersCheckbox);
            
            // Max player points setting
            var maxPointsSetting = document.createElement('div');
            maxPointsSetting.style.cssText = cooldownSetting.style.cssText;
            
            var maxPointsLabel = document.createElement('label');
            maxPointsLabel.textContent = 'Max player points: ';
            maxPointsLabel.style.marginRight = '10px';
            maxPointsLabel.style.fontWeight = 'bold';
            maxPointsLabel.style.minWidth = '200px';
            
            var maxPointsInput = document.createElement('input');
            maxPointsInput.type = 'number';
            maxPointsInput.min = '1';
            maxPointsInput.value = settings.maxPlayerPoints;
            maxPointsInput.style.cssText = cooldownInput.style.cssText;
            
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
            positionControls.style.cssText = `display: flex; gap: 10px; align-items: center;`;
            
            var xLabel = document.createElement('span');
            xLabel.textContent = 'X:';
            xLabel.style.marginRight = '5px';
            
            var xInput = document.createElement('input');
            xInput.type = 'number';
            xInput.min = '0';
            xInput.value = settings.autoAttackPosition.x;
            xInput.style.cssText = `padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; width: 70px; font-size: 14px; margin-right: 15px;`;
            
            var yLabel = document.createElement('span');
            yLabel.textContent = 'Y:';
            yLabel.style.marginRight = '5px';
            
            var yInput = document.createElement('input');
            yInput.type = 'number';
            yInput.min = '0';
            yInput.value = settings.autoAttackPosition.y;
            yInput.style.cssText = xInput.style.cssText;
            
            positionControls.appendChild(xLabel);
            positionControls.appendChild(xInput);
            positionControls.appendChild(yLabel);
            positionControls.appendChild(yInput);
            
            positionSetting.appendChild(positionLabel);
            positionSetting.appendChild(positionControls);
            
            settingsContainer.appendChild(cooldownSetting);
            settingsContainer.appendChild(includePlayersSetting);
            settingsContainer.appendChild(maxPointsSetting);
            settingsContainer.appendChild(positionSetting);
            
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
            saveAllBtn.onmouseover = function() { this.style.background = '#45a049'; };
            saveAllBtn.onmouseout = function() { this.style.background = '#4CAF50'; };
            
            saveAllBtn.onclick = function() {
                var newCooldown = parseInt(cooldownInput.value);
                if (newCooldown >= 1 && newCooldown <= 1440) {
                    settings.cooldown = newCooldown;
                } else {
                    showStatus('Please enter a valid cooldown (1-1440 minutes)', 'error');
                    return;
                }
                
                settings.includePlayers = includePlayersCheckbox.checked;
                settings.maxPlayerPoints = parseInt(maxPointsInput.value) || 1000;
                settings.autoAttackPosition.x = parseInt(xInput.value) || 10;
                settings.autoAttackPosition.y = parseInt(yInput.value) || 100;
                
                saveAllSettings();
                cooldownInfo.innerHTML = '<strong>⏰ Cooldown:</strong> ' + settings.cooldown + ' minutes';
                createExternalAutoAttackCheckbox();
            };
            
            settingsContainer.appendChild(saveAllBtn);
            settingsSection.appendChild(settingsContainer);
        }
        
        updateSettingsUI();
        
        var buildsSection = document.createElement('div');
        buildsSection.id = 'troop-builds';
        buildsSection.style.cssText = settingsSection.style.cssText;
        
        var buildsTitle = document.createElement('h4');
        buildsTitle.textContent = '👥 Troop Builds';
        buildsTitle.style.marginTop = '0';
        buildsTitle.style.marginBottom = '15px';
        buildsTitle.style.color = '#333';
        
        buildsSection.appendChild(buildsTitle);
        
        function updateBuildsUI() {
            var buildsContainer = buildsSection.querySelector('#builds-container');
            if (buildsContainer) buildsContainer.remove();
            
            buildsContainer = document.createElement('div');
            buildsContainer.id = 'builds-container';
            
            ['A', 'B'].forEach(function(buildKey) {
                var build = troopBuilds[buildKey] || defaultBuilds[buildKey];
                
                var buildContainer = document.createElement('div');
                buildContainer.style.cssText = `
                    margin-bottom: 15px;
                    padding: 12px;
                    background: #fff;
                    border-radius: 4px;
                    border: 1px solid #e0e0e0;
                `;
                
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
                    troopInput.style.cssText = `display: flex; flex-direction: column; align-items: center;`;
                    
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
        
        updateBuildsUI();
        
        function saveBuild(buildKey) {
            saveBuildsToStorage();
            showStatus('Build ' + buildKey + ' saved for ' + currentWorld, 'success');
        }
        
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
        
        var savedTextKey = 'villageTxtContent_' + currentWorld;
        var savedText = localStorage.getItem(savedTextKey);
        if (savedText) pasteTextarea.value = savedText;
        
        var distanceContainer = document.createElement('div');
        distanceContainer.style.cssText = `margin-bottom: 15px; display: flex; align-items: center;`;
        
        var distanceLabel = document.createElement('label');
        distanceLabel.textContent = 'Max Distance: ';
        distanceLabel.style.marginRight = '10px';
        distanceLabel.style.fontWeight = 'bold';
        
        var distanceInput = document.createElement('input');
        distanceInput.type = 'number';
        distanceInput.value = '50';
        distanceInput.min = '1';
        distanceInput.style.cssText = `width: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; margin-right: 15px;`;
        
        distanceContainer.appendChild(distanceLabel);
        distanceContainer.appendChild(distanceInput);
        
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
        parseBtn.onmouseover = function() { this.style.background = '#45a049'; };
        parseBtn.onmouseout = function() { this.style.background = '#4CAF50'; };
        
        var statusMsg = document.createElement('div');
        statusMsg.id = 'parse-status';
        statusMsg.style.cssText = `
            font-size: 13px;
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 6px;
            display: none;
        `;
        
        parseBtn.onclick = function() {
            var text = pasteTextarea.value.trim();
            if (!text) {
                showStatus('Please paste village.txt content first', 'error');
                return;
            }
            
            localStorage.setItem(savedTextKey, text);
            var maxDistance = distanceInput.value;
            parseVillageText(text, maxDistance);
        };
        
        pasteSection.appendChild(pasteLabel);
        pasteSection.appendChild(pasteTextarea);
        pasteSection.appendChild(distanceContainer);
        pasteSection.appendChild(parseBtn);
        pasteSection.appendChild(statusMsg);
        
        var targetsContainer = document.createElement('div');
        targetsContainer.style.cssText = `margin-top: 20px; padding-top: 20px; border-top: 2px solid #ddd;`;
        
        var targetsTitle = document.createElement('h4');
        targetsTitle.textContent = '🎯 Targets for ' + currentWorld + ':';
        targetsTitle.style.marginBottom = '15px';
        targetsTitle.style.color = '#333';
        
        var targetsList = document.createElement('div');
        targetsList.id = 'targets-list';
        
        targetsContainer.appendChild(targetsTitle);
        targetsContainer.appendChild(targetsList);
        
        uiContainer.appendChild(closeBtn);
        uiContainer.appendChild(title);
        uiContainer.appendChild(toggleConfigBtn);
        uiContainer.appendChild(autoAttackContainer);
        
        if (worlds.length > 0) uiContainer.appendChild(worldSelector);
        
        uiContainer.appendChild(infoSection);
        uiContainer.appendChild(settingsSection);
        uiContainer.appendChild(buildsSection);
        uiContainer.appendChild(pasteSection);
        uiContainer.appendChild(targetsContainer);
        
        document.body.appendChild(uiContainer);
        updateTargetsListUI();
        startAutoUpdate();
        createExternalAutoAttackCheckbox();
        
        function toggleConfigVisibility() {
            var sectionsToHide = [settingsSection, buildsSection, pasteSection];
            var clearBtn = targetsList.querySelector('button');
            
            sectionsToHide.forEach(function(section) {
                section.style.display = configVisible ? 'block' : 'none';
            });
            
            if (clearBtn) clearBtn.style.display = configVisible ? 'block' : 'none';
            
            uiContainer.style.maxHeight = configVisible ? '85vh' : '70vh';
        }
        
        toggleConfigVisibility();
    }
    
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
    
    function updateTargetsListUI() {
        var targetsList = document.getElementById('targets-list');
        if (!targetsList) return;
        
        targetsList.innerHTML = '';
        var targets = targetList.split(' ').filter(Boolean);
        
        if (targets.length === 0) {
            targetsList.innerHTML = '<div style="color: #999; font-style: italic; padding: 20px; text-align: center; background: #f8f9fa; border-radius: 6px; border: 1px dashed #ddd;">No targets in list for ' + currentWorld + '</div>';
            return;
        }
        
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
        clearAllBtn.onmouseover = function() { this.style.background = '#ff2222'; };
        clearAllBtn.onmouseout = function() { this.style.background = '#ff4444'; };
        clearAllBtn.onclick = function() {
            if (confirm('Clear all targets for ' + currentWorld + '?')) {
                clearAllTargets();
                updateTargetsListUI();
                showStatus('All targets cleared for ' + currentWorld, 'success');
            }
        };

        var manageIgnoresBtn = document.createElement('button');
        manageIgnoresBtn.textContent = '👁️ Manage Ignore List';
        manageIgnoresBtn.style.cssText = `
            background: #ff9800;
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
        `;
        manageIgnoresBtn.onmouseover = function() {
            this.style.background = '#f57c00';
        };
        manageIgnoresBtn.onmouseout = function() {
            this.style.background = '#ff9800';
        };
        manageIgnoresBtn.onclick = function() {
            showIgnoreListManagement();
        };
        
        targetsList.appendChild(clearAllBtn);
        targetsList.appendChild(manageIgnoresBtn);
        
        targets.forEach(function(target, index) {
            var targetItem = document.createElement('div');
            targetItem.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 10px;
                margin: 3px 0;
                background: ${index % 2 === 0 ? '#f8f9fa' : '#fff'};
                border-radius: 4px;
                border: 1px solid #e9ecef;
                transition: transform 0.2s, box-shadow 0.2s;
                font-size: 12px;
                line-height: 1.2;
            `;
            targetItem.onmouseover = function() {
                this.style.transform = 'translateY(-1px)';
                this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            };
            targetItem.onmouseout = function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            };
            
            var targetInfo = document.createElement('div');
            targetInfo.style.flex = '1';
            targetInfo.style.display = 'flex';
            targetInfo.style.alignItems = 'center';
            targetInfo.style.gap = '15px';
            
            var distance = homeCoords ? calculateDistance(homeCoords, target) : 0;
            var cooldownInfo = getCooldownInfo(target);
            
            var targetCoords = document.createElement('div');
            targetCoords.style.cssText = `
                font-family: monospace;
                font-weight: bold;
                font-size: 14px;
                color: #333;
                min-width: 70px;
            `;
            targetCoords.textContent = target;
            
            var targetDetails = document.createElement('div');
            targetDetails.style.cssText = `
                font-size: 11px;
                color: #666;
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: nowrap;
            `;
            
            var distanceSpan = document.createElement('span');
            distanceSpan.innerHTML = `<strong>Distance:</strong> ${distance.toFixed(2)}`;
            
            var lastAttackSpan = document.createElement('span');
            lastAttackSpan.innerHTML = `<strong>Last:</strong> ${formatTimeSince(cooldownInfo.lastAttack)}`;
            
            var cooldownSpan = document.createElement('span');
            if (cooldownInfo.onCooldown) {
                cooldownSpan.innerHTML = `<strong style="color: #ff6b6b;">⏳ ${cooldownInfo.minutesLeft}m</strong>`;
                cooldownSpan.title = 'Attacked ' + formatTimeSince(cooldownInfo.lastAttack);
            } else {
                cooldownSpan.innerHTML = `<strong style="color: #4CAF50;">✅ Ready</strong>`;
            }
            
            targetDetails.appendChild(distanceSpan);
            targetDetails.appendChild(lastAttackSpan);
            targetDetails.appendChild(cooldownSpan);
            
            targetInfo.appendChild(targetCoords);
            targetInfo.appendChild(targetDetails);
            
            var attackButtons = document.createElement('div');
            attackButtons.style.cssText = `display: flex; gap: 5px; margin: 0 10px;`;
            
            var attackBtnA = document.createElement('button');
            attackBtnA.textContent = 'A';
            attackBtnA.disabled = cooldownInfo.onCooldown;
            attackBtnA.title = 'Attack with Build A';
            attackBtnA.style.cssText = `
                background: ${cooldownInfo.onCooldown ? '#cccccc' : '#4CAF50'};
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: ${cooldownInfo.onCooldown ? 'not-allowed' : 'pointer'};
                font-size: 11px;
                font-weight: bold;
                min-width: 30px;
                height: 24px;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                transition: transform 0.2s, box-shadow 0.2s;
            `;
            
            if (!cooldownInfo.onCooldown) {
                attackBtnA.onmouseover = function() {
                    this.style.transform = 'scale(1.05)';
                    this.style.boxShadow = '0 2px 3px rgba(0,0,0,0.15)';
                };
                attackBtnA.onmouseout = function() {
                    this.style.transform = 'scale(1)';
                    this.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                };
                attackBtnA.onclick = (function(targetToAttack) {
                    return function() { attackTarget(targetToAttack, 'A'); };
                })(target);
            }
            
            var attackBtnB = document.createElement('button');
            attackBtnB.textContent = 'B';
            attackBtnB.disabled = cooldownInfo.onCooldown;
            attackBtnB.title = 'Attack with Build B';
            attackBtnB.style.cssText = attackBtnA.style.cssText;
            attackBtnB.style.background = cooldownInfo.onCooldown ? '#cccccc' : '#2196F3';
            
            if (!cooldownInfo.onCooldown) {
                attackBtnB.onmouseover = attackBtnA.onmouseover;
                attackBtnB.onmouseout = attackBtnA.onmouseout;
                attackBtnB.onclick = (function(targetToAttack) {
                    return function() { attackTarget(targetToAttack, 'B'); };
                })(target);
            }
            
            attackButtons.appendChild(attackBtnA);
            attackButtons.appendChild(attackBtnB);

            var ignoreBtn = document.createElement('button');
            ignoreBtn.textContent = '👁️';
            ignoreBtn.title = 'Add to ignore list (hide from future selections)';
            ignoreBtn.style.cssText = `
                background: #ff9800;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
                width: 30px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                transition: transform 0.2s, background 0.2s;
            `;
            ignoreBtn.onmouseover = function() {
                this.style.transform = 'scale(1.05)';
                this.style.background = '#f57c00';
            };
            ignoreBtn.onmouseout = function() {
                this.style.transform = 'scale(1)';
                this.style.background = '#ff9800';
            };
            ignoreBtn.onclick = (function(targetCoords) {
                return function() {
                    if (addToIgnoreList(targetCoords)) {
                        removeFromTargetList(targetCoords);
                        updateTargetsListUI();
                        showStatus('Village ' + targetCoords + ' added to ignore list', 'success');
                    }
                };
            })(target);
            
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
                font-size: 11px;
                font-weight: bold;
                width: 30px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                transition: transform 0.2s, background 0.2s;
            `;
            removeBtn.onmouseover = function() {
                this.style.transform = 'scale(1.05)';
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
            targetItem.appendChild(ignoreBtn);
            targetItem.appendChild(removeBtn);
            targetsList.appendChild(targetItem);
        });
    }
    
    function parseVillageText(text, maxDistance) {
        try {
            var villages = [];
            var lines = text.split('\n');
            var validLines = 0;
            var currentTargets = getCurrentTargets();
            
            lines.forEach(function(line) {
                if (!line.trim()) return;
                
                var parts = line.split(',');
                if (parts.length >= 7) {
                    var playerNumber = parseInt(parts[4]);
                    var villagePoints = parseInt(parts[5]) || 0;
                    var isBonusVillage = parseInt(parts[6]);
                    
                    var shouldInclude = false;
                    
                    if (playerNumber === 0 && isBonusVillage === 0) {
                        shouldInclude = true;
                    } else if (settings.includePlayers && playerNumber > 0 && villagePoints <= settings.maxPlayerPoints) {
                        shouldInclude = true;
                    }
                    
                    if (shouldInclude) {
                        var villageName = decodeURIComponent(parts[1]).replace(/\+/g, ' ');
                        var x = parts[2];
                        var y = parts[3];
                        var coords = x + '|' + y;
                        var distance = homeCoords ? calculateDistance(homeCoords, coords) : 0;
                        
                        if (!maxDistance || distance <= parseInt(maxDistance)) {
                            if (currentTargets.indexOf(coords) === -1 && !isInIgnoreList(coords)) {
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
            
            villages.sort(function(a, b) { return a.distance - b.distance; });
            
            var alreadyAdded = validLines - villages.length;
            var statusMessage = 'Found ' + villages.length + ' available villages';
            if (alreadyAdded > 0) statusMessage += ' (' + alreadyAdded + ' already in list)';
            statusMessage += ' out of ' + validLines + ' total villages';
            
            showStatus(statusMessage, 'success');
            showVillagesSelection(villages);
            
        } catch (error) {
            console.error('Error parsing village text:', error);
            showStatus('Error parsing village.txt content: ' + error.message, 'error');
        }
    }
    
    function showVillagesSelection(villages) {
        var existingSelection = document.getElementById('villages-selection');
        if (existingSelection) existingSelection.remove();
        
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
        closeBtn.onclick = function() { document.body.removeChild(overlay); };
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
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
        
        selectionContainer.appendChild(header);
        selectionContainer.appendChild(searchContainer);
        selectionContainer.appendChild(villagesContainer);
        selectionContainer.appendChild(footer);
        overlay.appendChild(selectionContainer);
        document.body.appendChild(overlay);
        
        var selectedVillages = [];
        
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
                villageDetails.style.cssText = `font-size: 11px; color: #666; margin-top: 2px;`;
                
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
                        if (idx > -1) selectedVillages.splice(idx, 1);
                        villageItem.classList.remove('selected');
                        villageItem.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
                    }
                    updateSelectedCount();
                };
                
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
        
        function updateSelectedCount() {
            selectedCount.textContent = '📌 Selected: ' + selectedVillages.length;
        }
        
        searchInput.oninput = function() { updateVillagesList(this.value); };
        
        addSelectedBtn.onclick = function() {
            var addedCount = 0;
            selectedVillages.forEach(function(coords) {
                if (addToTargetList(coords)) addedCount++;
            });
            
            updateTargetsListUI();
            showStatus('Added ' + addedCount + ' village(s) to target list for ' + currentWorld, 'success');
            document.body.removeChild(overlay);
        };
        
        closeFooterBtn.onclick = function() { document.body.removeChild(overlay); };
        
        updateVillagesList();
        searchInput.focus();
    }

    function getAvailableTroops() {
        var doc = window.frames.length > 0 ? window.main.document : document;
        var availableTroops = {};
        
        var troopTypes = ['spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult', 'knight'];
        
        troopTypes.forEach(function(troopType) {
            var element = doc.querySelector('#units_entry_all_' + troopType);
            if (element) {
                var match = element.textContent.match(/\((\d+)\)/);
                if (match) {
                    availableTroops[troopType] = parseInt(match[1]);
                } else {
                    availableTroops[troopType] = 0;
                }
            } else {
                availableTroops[troopType] = 0;
            }
        });
        
        console.log("Available troops:", availableTroops);
        return availableTroops;
    }

    function loadIgnoreFromStorage() {
        try {
            var storedData = localStorage.getItem(ignoreStorageKey);
            if (storedData) {
                var allIgnores = JSON.parse(storedData);
                if (allIgnores[currentWorld]) {
                    return allIgnores[currentWorld];
                }
            }
        } catch (e) {
            console.error("Error loading ignore list:", e);
        }
        return [];
    }
    
    function saveIgnoreToStorage(ignoreList) {
        try {
            var storedData = localStorage.getItem(ignoreStorageKey);
            var allIgnores = storedData ? JSON.parse(storedData) : {};
            allIgnores[currentWorld] = ignoreList;
            localStorage.setItem(ignoreStorageKey, JSON.stringify(allIgnores));
        } catch (e) {
            console.error("Error saving ignore list:", e);
        }
    }
    
    function addToIgnoreList(coords) {
        var ignoreList = loadIgnoreFromStorage();
        if (ignoreList.indexOf(coords) === -1) {
            ignoreList.push(coords);
            saveIgnoreToStorage(ignoreList);
            return true;
        }
        return false;
    }
    
    function removeFromIgnoreList(coords) {
        var ignoreList = loadIgnoreFromStorage();
        var index = ignoreList.indexOf(coords);
        if (index !== -1) {
            ignoreList.splice(index, 1);
            saveIgnoreToStorage(ignoreList);
            return true;
        }
        return false;
    }
    
    function isInIgnoreList(coords) {
        var ignoreList = loadIgnoreFromStorage();
        return ignoreList.indexOf(coords) !== -1;
    }
    
    function clearAllIgnores() {
        saveIgnoreToStorage([]);
    }

    function showIgnoreListManagement() {
        var ignoreList = loadIgnoreFromStorage();
        
        var existingOverlay = document.getElementById('ignore-overlay');
        if (existingOverlay) existingOverlay.remove();
        
        var overlay = document.createElement('div');
        overlay.id = 'ignore-overlay';
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
        
        var container = document.createElement('div');
        container.style.cssText = `
            background: white;
            border-radius: 10px;
            padding: 25px;
            width: 600px;
            max-width: 90vw;
            max-height: 80vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        
        var header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 3px solid #ff9800;
        `;
        
        var title = document.createElement('h3');
        title.textContent = '👁️ Ignore List for ' + currentWorld + ' (' + ignoreList.length + ' villages)';
        title.style.margin = '0';
        title.style.color = '#333';
        
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
        `;
        closeBtn.onclick = function() {
            document.body.removeChild(overlay);
        };
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        var content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            overflow-y: auto;
            margin-bottom: 20px;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 8px;
            background: #f8f9fa;
        `;
        
        if (ignoreList.length === 0) {
            content.innerHTML = '<div style="text-align: center; padding: 30px; color: #666; font-style: italic;">No villages in ignore list</div>';
        } else {
            ignoreList.forEach(function(coords, index) {
                var item = document.createElement('div');
                item.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 12px;
                    margin: 5px 0;
                    background: ${index % 2 === 0 ? '#fff' : '#f8f9fa'};
                    border-radius: 6px;
                    border: 1px solid #e9ecef;
                    font-size: 12px;
                `;
                
                var coordsSpan = document.createElement('span');
                coordsSpan.style.cssText = `
                    font-family: monospace;
                    font-weight: bold;
                    font-size: 14px;
                `;
                coordsSpan.textContent = coords;
                
                var distanceSpan = document.createElement('span');
                distanceSpan.style.cssText = `font-size: 11px; color: #666; margin-left: 10px;`;
                var distance = homeCoords ? calculateDistance(homeCoords, coords) : 0;
                distanceSpan.textContent = 'Distance: ' + distance.toFixed(2);
                
                var removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remove';
                removeBtn.style.cssText = `
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 11px;
                `;
                removeBtn.onclick = (function(coordsToRemove) {
                    return function() {
                        if (removeFromIgnoreList(coordsToRemove)) {
                            showIgnoreListManagement();
                            showStatus('Village ' + coordsToRemove + ' removed from ignore list', 'success');
                        }
                    };
                })(coords);
                
                var leftContainer = document.createElement('div');
                leftContainer.appendChild(coordsSpan);
                leftContainer.appendChild(distanceSpan);
                
                item.appendChild(leftContainer);
                item.appendChild(removeBtn);
                content.appendChild(item);
            });
        }
        
        var footer = document.createElement('div');
        footer.style.cssText = `
            display: flex;
            justify-content: space-between;
            gap: 10px;
        `;
        
        var clearAllBtn = document.createElement('button');
        clearAllBtn.textContent = '🗑️ Clear All Ignores';
        clearAllBtn.style.cssText = `
            background: #ff4444;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            flex: 1;
            font-size: 12px;
        `;
        clearAllBtn.onclick = function() {
            if (confirm('Clear all ignored villages for ' + currentWorld + '?')) {
                clearAllIgnores();
                showIgnoreListManagement();
                showStatus('All ignored villages cleared', 'success');
            }
        };
        
        var closeFooterBtn = document.createElement('button');
        closeFooterBtn.textContent = 'Close';
        closeFooterBtn.style.cssText = `
            background: #666;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
        `;
        closeFooterBtn.onclick = function() {
            document.body.removeChild(overlay);
        };
        
        footer.appendChild(clearAllBtn);
        footer.appendChild(closeFooterBtn);
        
        container.appendChild(header);
        container.appendChild(content);
        container.appendChild(footer);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
    }

    function startExternalAutoAttack() {
        console.log("=== startExternalAutoAttack called ===");
        
        if (!settings.autoAttackEnabled) {
            console.log("External auto-attack is disabled");
            return;
        }
        
        // Check which builds are selected
        var useBuildA = settings.autoAttackBuilds && settings.autoAttackBuilds.A !== false; // Default to true
        var useBuildB = settings.autoAttackBuilds && settings.autoAttackBuilds.B;
        
        console.log("Build A selected:", useBuildA);
        console.log("Build B selected:", useBuildB);
        
        if (!useBuildA && !useBuildB) {
            console.log("No builds selected for auto-attack");
            showStatus('Please select at least one build for auto-attack', 'error');
            return;
        }
        
        if (useBuildA) {
            console.log("Starting with Build A...");
            autoAttackNext('A');
        } else if (useBuildB) {
            console.log("Starting with Build B...");
            autoAttackNext('B');
        }
    }
    
    // ===== MAIN EXECUTION =====
    
    currentWorld = getWorldName();
    console.log("Current world:", currentWorld);
    
    loadSettingsFromStorage();
    loadTargetsFromStorage();
    loadBuildsFromStorage();
    
    homeCoords = getCurrentVillageCoords();
    console.log("Home coords:", homeCoords);
    console.log("Auto-attack enabled:", settings.autoAttackEnabled);
    console.log("Target list length:", targetList.split(" ").filter(Boolean).length);
    
    if (!checkForAntibot()) {
        createConfigUI();
        
        if (settings.autoAttackEnabled) {
            console.log("Auto-attack enabled on startup, starting in 2 seconds...");
            console.log("Available targets:", getCurrentTargets());
            
            setTimeout(function() {
                console.log("Now starting auto-attack...");
                startExternalAutoAttack(); // Changed from autoAttackNext('A')
            }, 2000);
        }
    }
})();
