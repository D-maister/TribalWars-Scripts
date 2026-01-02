// ===== TW Attack Script - Utilities =====

(function() {
    'use strict';
    
    if (!window.TWAttack) return;
    
    const Utils = {
        // Show status message
        showStatus: function(message, type) {
            var statusMsg = document.getElementById('parse-status');
            if (!statusMsg) {
                // Create status element if it doesn't exist
                statusMsg = document.createElement('div');
                statusMsg.id = 'parse-status';
                statusMsg.className = 'tw-attack-status';
                document.body.appendChild(statusMsg);
            }
            
            statusMsg.textContent = message;
            statusMsg.style.display = 'block';
            statusMsg.className = 'tw-attack-status';
            
            switch(type) {
                case 'success':
                    statusMsg.classList.add('tw-attack-status-success');
                    break;
                case 'error':
                    statusMsg.classList.add('tw-attack-status-error');
                    break;
                default:
                    // Default is info
            }
            
            setTimeout(function() {
                statusMsg.style.display = 'none';
            }, 5000);
        },
        
        // Show error
        showError: function(message) {
            this.showStatus(message, 'error');
        },
        
        // Check for antibot captcha
        checkForAntibot: function() {
            if (document.querySelector('td.bot-protection-row, div#botprotection_quest.quest')) {
                alert('Check for ANTIBOT CAPTCHA');
                return true;
            }
            return false;
        },
        
        // Get available troops
        getAvailableTroops: function() {
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
            
            return availableTroops;
        },
        
        // Set unit count in form
        setUnitCount: function(field, count) {
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
                    this.showError("Only " + actualCount + " " + unitType + " available (requested " + count + ")");
                }
                
                // Set session storage marker for submit script
                if (actualCount > 0) {
                    var worldName = window.TWAttack.state.currentWorld;
                    var key = window.TWAttack.config.storageKeys.submitMarker + "_" + worldName;
                    var timestamp = new Date().getTime();
                    sessionStorage.setItem(key, timestamp.toString());
                }
            }
        },
        
        // Click attack button
        clickAttackButton: function() {
            if (this.checkForAntibot()) return false;
            
            var doc = window.frames.length > 0 ? window.main.document : document;
            var submitButton = doc.querySelector('input[type="submit"], button[type="submit"], input[name="target_attack"]');
            if (submitButton) {
                // Set session storage marker
                var worldName = window.TWAttack.state.currentWorld;
                var key = window.TWAttack.config.storageKeys.submitMarker + "_" + worldName;
                var timestamp = new Date().getTime();
                sessionStorage.setItem(key, timestamp.toString());
                
                submitButton.click();
                return true;
            } else if (doc.forms[0]) {
                // Set session storage marker
                var worldName = window.TWAttack.state.currentWorld;
                var key = window.TWAttack.config.storageKeys.submitMarker + "_" + worldName;
                var timestamp = new Date().getTime();
                sessionStorage.setItem(key, timestamp.toString());
                
                doc.forms[0].submit();
                return true;
            }
            return false;
        },
        
        // Get village.txt URL
        getVillageTxtUrl: function() {
            var url = window.location.href;
            var worldName = window.TWAttack.state.currentWorld;
            var domain = '';
            
            // Check which domain we're on
            if (url.includes('tribalwars.net')) {
                domain = 'tribalwars.net';
            } else if (url.includes('voynaplemyon.com')) {
                domain = 'voynaplemyon.com';
            } else {
                // Try to extract domain from URL as fallback
                var match = url.match(/https?:\/\/([^\/]+)/);
                if (match) {
                    domain = match[1];
                } else {
                    domain = 'voynaplemyon.com'; // Default fallback
                }
            }
            
            // Construct the correct URL
            // Note: tribalwars.net uses format like https://en147.tribalwars.net/map/village.txt
            // voynaplemyon.com uses format like https://pl101.voynaplemyon.com/map/village.txt
            return 'https://' + worldName + '.' + domain + '/map/village.txt';
        },
        
        // Parse village text
        parseVillageText: function(text, maxDistance) {
            try {
                var villages = [];
                var lines = text.split('\n');
                var validLines = 0;
                
                // Get current targets
                var currentTargets = [];
                if (window.TWAttack && window.TWAttack.targets && typeof window.TWAttack.targets.getCurrent === 'function') {
                    currentTargets = window.TWAttack.targets.getCurrent();
                } else if (window.TWAttack.state && window.TWAttack.state.targetList) {
                    currentTargets = window.TWAttack.state.targetList.split(' ').filter(Boolean);
                }
                
                // Get ignore list
                var ignoreList = [];
                if (window.TWAttack.state && window.TWAttack.state.ignoreList) {
                    ignoreList = window.TWAttack.state.ignoreList;
                }
                
                lines.forEach(function(line) {
                    if (!line.trim()) return;
                    
                    var parts = line.split(',');
                    if (parts.length >= 7) {
                        var playerNumber = parseInt(parts[4]);
                        var villagePoints = parseInt(parts[5]) || 0;
                        var isBonusVillage = parseInt(parts[6]);
                        
                        var shouldInclude = false;
                        
                        if (isBonusVillage > 0 && window.TWAttack.state.settings.includeBonusVillages) {
                            shouldInclude = true;
                        } 
                        else if (playerNumber === 0 && isBonusVillage === 0) {
                            shouldInclude = true;
                        } 
                        else if (window.TWAttack.state.settings.includePlayers && playerNumber > 0 && villagePoints <= window.TWAttack.state.settings.maxPlayerPoints) {
                            shouldInclude = true;
                        }
                        
                        if (shouldInclude) {
                            var villageName = decodeURIComponent(parts[1]).replace(/\+/g, ' ');
                            var x = parts[2];
                            var y = parts[3];
                            var coords = x + '|' + y;
                            var distance = window.TWAttack.state.homeCoords ? 
                                this.calculateDistance(window.TWAttack.state.homeCoords, coords) : 0;
                            
                            if (!maxDistance || distance <= parseInt(maxDistance)) {
                                // Check if not already in targets or ignore list
                                if (currentTargets.indexOf(coords) === -1 && ignoreList.indexOf(coords) === -1) {
                                    villages.push({
                                        name: villageName,
                                        coords: coords,
                                        distance: distance,
                                        playerNumber: playerNumber,
                                        points: villagePoints,
                                        isBonus: isBonusVillage > 0
                                    });
                                }
                            }
                            validLines++;
                        }
                    }
                }.bind(this));
                
                if (validLines === 0) {
                    this.showError('No valid villages found in the pasted text.');
                    return;
                }
                
                villages.sort(function(a, b) { return a.distance - b.distance; });
                
                var alreadyAdded = validLines - villages.length;
                var statusMessage = 'Found ' + villages.length + ' available villages';
                if (alreadyAdded > 0) statusMessage += ' (' + alreadyAdded + ' already in list or ignored)';
                statusMessage += ' out of ' + validLines + ' total villages';
                
                this.showStatus(statusMessage, 'success');
                
                // Show selection UI
                if (villages.length > 0) {
                    this.showVillagesSelection(villages);
                }
                
            } catch (error) {
                this.showError('Error parsing village.txt content: ' + error.message);
            }
        },
        
        // Show villages selection UI
        showVillagesSelection: function(villages) {
            var existingOverlay = document.getElementById('villages-overlay');
            if (existingOverlay) existingOverlay.remove();
            
            var overlay = document.createElement('div');
            overlay.id = 'villages-overlay';
            overlay.className = 'tw-attack-overlay';
            
            var selectionContainer = document.createElement('div');
            selectionContainer.id = 'villages-selection';
            selectionContainer.className = 'tw-attack-selection-container';
            
            var header = document.createElement('div');
            header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;';
            
            var title = document.createElement('h3');
            title.textContent = '🎯 Select Villages for ' + window.TWAttack.state.currentWorld + ' (' + villages.length + ' available)';
            title.style.margin = '0';
            
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
            `;
            closeBtn.onclick = function() { document.body.removeChild(overlay); };
            
            header.appendChild(title);
            header.appendChild(closeBtn);
            
            var villagesContainer = document.createElement('div');
            villagesContainer.id = 'villages-container';
            villagesContainer.className = 'tw-attack-villages-container';
            
            var footer = document.createElement('div');
            footer.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 2px solid #ddd;
            `;
            
            var selectedCount = document.createElement('span');
            selectedCount.id = 'selected-count';
            selectedCount.textContent = '📌 Selected: 0';
            selectedCount.style.color = '#666';
            selectedCount.style.fontSize = '12px';
            
            var addSelectedBtn = document.createElement('button');
            addSelectedBtn.textContent = '✅ Add Selected';
            addSelectedBtn.style.cssText = `
                background: #4CAF50;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 12px;
            `;
            
            // Store villages for the click handler
            var villagesData = villages;
            
            addSelectedBtn.onclick = function() {
                var selectedVillages = [];
                var checkboxes = villagesContainer.querySelectorAll('input[type="checkbox"]:checked');
                checkboxes.forEach(function(checkbox) {
                    selectedVillages.push(checkbox.value);
                });
                
                var addedCount = 0;
                selectedVillages.forEach(function(coords) {
                    var village = villagesData.find(v => v.coords === coords);
                    if (village) {
                        // Use the targets.add function
                        if (window.TWAttack && window.TWAttack.targets && typeof window.TWAttack.targets.add === 'function') {
                            if (window.TWAttack.targets.add(coords, village)) {
                                addedCount++;
                            }
                        } else {
                            // Fallback
                            if (window.TWAttack.state && window.TWAttack.state.targetList) {
                                var targets = window.TWAttack.state.targetList.split(' ').filter(Boolean);
                                if (targets.indexOf(coords) === -1) {
                                    targets.push(coords);
                                    window.TWAttack.state.targetList = targets.join(' ');
                                    // Save village data
                                    var allVillageData = window.TWAttack.storage.get(window.TWAttack.config.storageKeys.villageData) || {};
                                    var world = window.TWAttack.state.currentWorld;
                                    if (!allVillageData[world]) allVillageData[world] = {};
                                    allVillageData[world][coords] = village;
                                    window.TWAttack.storage.set(window.TWAttack.config.storageKeys.villageData, allVillageData);
                                    window.TWAttack.saveState();
                                    addedCount++;
                                }
                            }
                        }
                    }
                });
                
                // Update targets list
                if (window.TWAttack.modules && window.TWAttack.modules.attack) {
                    window.TWAttack.modules.attack.updateTargetsListUI();
                }
                
                Utils.showStatus('Added ' + addedCount + ' village(s) to target list', 'success');
                document.body.removeChild(overlay);
            };
            
            footer.appendChild(selectedCount);
            footer.appendChild(addSelectedBtn);
            
            selectionContainer.appendChild(header);
            selectionContainer.appendChild(villagesContainer);
            selectionContainer.appendChild(footer);
            overlay.appendChild(selectionContainer);
            document.body.appendChild(overlay);
            
            // Populate villages
            villages.forEach(function(village, index) {
                var villageItem = document.createElement('div');
                villageItem.className = 'tw-attack-village-item';
                villageItem.style.cursor = 'pointer';
                
                var villageInfo = document.createElement('div');
                villageInfo.style.cssText = 'display: flex; flex-direction: column; flex: 1;';
                
                var villageName = document.createElement('span');
                villageName.style.cssText = 'font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; font-size: 12px;';
                villageName.textContent = village.name + ' - ' + village.coords;
                
                // Add village type indicators
                if (village.isBonus) {
                    var bonusStar = document.createElement('span');
                    bonusStar.className = 'tw-attack-bonus-star';
                    bonusStar.textContent = ' ★';
                    bonusStar.title = 'Bonus Village';
                    villageName.appendChild(bonusStar);
                } else if (village.playerNumber > 0) {
                    var playerCircle = document.createElement('span');
                    playerCircle.className = 'tw-attack-player-circle';
                    playerCircle.textContent = ' ●';
                    playerCircle.title = 'Player Village';
                    villageName.appendChild(playerCircle);
                }
                
                var villageDetails = document.createElement('span');
                villageDetails.style.cssText = 'font-size: 10px; color: #666;';
                
                var detailsText = 'Distance: ' + village.distance.toFixed(2);
                if (village.playerNumber > 0) {
                    detailsText += ' | Player | Points: ' + village.points;
                } else if (village.isBonus) {
                    detailsText += ' | Bonus';
                } else {
                    detailsText += ' | Barbarian';
                }
                
                villageDetails.textContent = detailsText;
                
                villageInfo.appendChild(villageName);
                villageInfo.appendChild(villageDetails);
                
                var checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = village.coords;
                checkbox.style.cssText = 'margin-left: 10px; transform: scale(1.2);';
                
                checkbox.onchange = function() {
                    if (this.checked) {
                        villageItem.classList.add('selected');
                        villageItem.style.backgroundColor = '#e8f5e9';
                    } else {
                        villageItem.classList.remove('selected');
                        villageItem.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa';
                    }
                    updateSelectedCount();
                };
                
                villageItem.onclick = function(e) {
                    if (e.target !== checkbox && !checkbox.contains(e.target)) {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                };
                
                villageItem.appendChild(villageInfo);
                villageItem.appendChild(checkbox);
                villagesContainer.appendChild(villageItem);
            });
            
            function updateSelectedCount() {
                var selected = villagesContainer.querySelectorAll('input[type="checkbox"]:checked').length;
                selectedCount.textContent = '📌 Selected: ' + selected;
            }
            
            updateSelectedCount();
        },
        
        // Cleanup old history
        cleanupOldHistory: function() {
            try {
                var buildCooldowns = window.TWAttack.storage.get(window.TWAttack.config.storageKeys.buildCooldowns);
                if (!buildCooldowns) return;
                
                var currentTime = (new Date()).getTime();
                var changed = false;
                var world = window.TWAttack.state.currentWorld;
                
                if (buildCooldowns[world]) {
                    for (var target in buildCooldowns[world]) {
                        for (var buildKey in buildCooldowns[world][target]) {
                            if ((currentTime - buildCooldowns[world][target][buildKey]) > 86400000) { // 24 hours
                                delete buildCooldowns[world][target][buildKey];
                                changed = true;
                            }
                        }
                        if (Object.keys(buildCooldowns[world][target]).length === 0) {
                            delete buildCooldowns[world][target];
                            changed = true;
                        }
                    }
                }
                
                if (changed) {
                    window.TWAttack.storage.set(window.TWAttack.config.storageKeys.buildCooldowns, buildCooldowns);
                }
            } catch (e) {
                console.error('Error cleaning up old history:', e);
            }
        },
        
        // Get cooldown info for a target and build
        getBuildCooldownInfo: function(target, buildKey) {
            try {
                var buildCooldowns = window.TWAttack.storage.get(window.TWAttack.config.storageKeys.buildCooldowns);
                var currentTime = (new Date()).getTime();
                
                if (buildCooldowns && 
                    buildCooldowns[window.TWAttack.state.currentWorld] && 
                    buildCooldowns[window.TWAttack.state.currentWorld][target] &&
                    buildCooldowns[window.TWAttack.state.currentWorld][target][buildKey]) {
                    
                    var lastAttackTime = buildCooldowns[window.TWAttack.state.currentWorld][target][buildKey];
                    var build = window.TWAttack.state.troopBuilds[buildKey] || 
                        { cooldown: window.TWAttack.config.defaultCooldown };
                    var buildCooldownMinutes = build.cooldown || window.TWAttack.config.defaultCooldown;
                    var minutesSinceAttack = (currentTime - lastAttackTime) / 60000;
                    var minutesLeft = buildCooldownMinutes - minutesSinceAttack;
                    
                    return {
                        onCooldown: minutesSinceAttack < buildCooldownMinutes,
                        minutesLeft: Math.max(0, Math.ceil(minutesLeft)),
                        lastAttack: new Date(lastAttackTime),
                        cooldown: buildCooldownMinutes
                    };
                }
                
                return {
                    onCooldown: false,
                    minutesLeft: 0,
                    lastAttack: null,
                    cooldown: (window.TWAttack.state.troopBuilds[buildKey] ? 
                              window.TWAttack.state.troopBuilds[buildKey].cooldown : 
                              window.TWAttack.config.defaultCooldown)
                };
            } catch (e) {
                console.error('Error getting build cooldown info:', e);
                return {
                    onCooldown: false,
                    minutesLeft: 0,
                    lastAttack: null,
                    cooldown: window.TWAttack.config.defaultCooldown
                };
            }
        },
        
        // Record attack
        recordBuildAttack: function(target, buildKey) {
            try {
                var buildCooldowns = window.TWAttack.storage.get(window.TWAttack.config.storageKeys.buildCooldowns) || {};
                var world = window.TWAttack.state.currentWorld;
                
                if (!buildCooldowns[world]) buildCooldowns[world] = {};
                if (!buildCooldowns[world][target]) buildCooldowns[world][target] = {};
                
                buildCooldowns[world][target][buildKey] = (new Date()).getTime();
                
                window.TWAttack.storage.set(window.TWAttack.config.storageKeys.buildCooldowns, buildCooldowns);
                console.log('Recorded attack:', target, 'with build', buildKey);
            } catch (e) {
                console.error('Error recording build attack:', e);
            }
        },
        
        // Calculate distance between coordinates
        calculateDistance: function(coord1, coord2) {
            if (!coord1 || !coord2) return 0;
            try {
                var parts1 = coord1.split("|");
                var parts2 = coord2.split("|");
                var dx = parseInt(parts1[0]) - parseInt(parts2[0]);
                var dy = parseInt(parts1[1]) - parseInt(parts2[1]);
                return Math.round(100 * Math.sqrt(dx * dx + dy * dy)) / 100;
            } catch (e) {
                console.error('Error calculating distance:', e);
                return 0;
            }
        },
        
        // Format time since
        formatTimeSince: function(lastAttack) {
            if (!lastAttack) return "Never";
            try {
                var now = new Date();
                var diffMs = now - lastAttack;
                var diffMins = Math.floor(diffMs / 60000);
                if (diffMins < 60) return diffMins + "m ago";
                else if (diffMins < 1440) return Math.floor(diffMins / 60) + "h ago";
                else return Math.floor(diffMins / 1440) + "d ago";
            } catch (e) {
                console.error('Error formatting time:', e);
                return "Unknown";
            }
        }
    };
    
    // Register utils with main module
    window.TWAttack.utils = Object.assign(window.TWAttack.utils || {}, Utils);
    
    console.log('TW Attack: Utilities loaded');
    
})();
