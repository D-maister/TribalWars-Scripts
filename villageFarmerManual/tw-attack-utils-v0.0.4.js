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
            return 'https://' + window.TWAttack.state.currentWorld + '.voynaplemyon.com/map/village.txt';
        },
        
        // Updated (supports both):
        getVillageTxtUrl: function() {
            var url = window.location.href;
            var domain = 'voynaplemyon.com'; // default
            
            if (url.includes('tribalwars.net')) {
                domain = 'tribalwars.net';
            } else if (url.includes('voynaplemyon.com')) {
                domain = 'voynaplemyon.com';
            }
            
            return 'https://' + window.TWAttack.state.currentWorld + '.' + domain + '/map/village.txt';
        },
        
        // Parse village text
        parseVillageText: function(text, maxDistance) {
            try {
                var villages = [];
                var lines = text.split('\n');
                var validLines = 0;
                var currentTargets = window.TWAttack.targets.getCurrent();
                
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
                                window.TWAttack.utils.calculateDistance(window.TWAttack.state.homeCoords, coords) : 0;
                            
                            if (!maxDistance || distance <= parseInt(maxDistance)) {
                                // Check ignore list (would need to load ignore list)
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
                });
                
                if (validLines === 0) {
                    this.showError('No valid villages found in the pasted text.');
                    return;
                }
                
                villages.sort(function(a, b) { return a.distance - b.distance; });
                
                var alreadyAdded = validLines - villages.length;
                var statusMessage = 'Found ' + villages.length + ' available villages';
                if (alreadyAdded > 0) statusMessage += ' (' + alreadyAdded + ' already in list)';
                statusMessage += ' out of ' + validLines + ' total villages';
                
                this.showStatus(statusMessage, 'success');
                
                // Show selection UI (this would need to be implemented)
                console.log('Parsed', villages.length, 'villages');
                
            } catch (error) {
                this.showError('Error parsing village.txt content: ' + error.message);
            }
        },
        
        // Cleanup old history
        cleanupOldHistory: function() {
            // This would need to be implemented with cooldown tracking
            console.log('Cleanup old history');
        },
        
        // Get cooldown info for a target and build
        getBuildCooldownInfo: function(target, buildKey) {
            // This would need to be implemented with cooldown tracking
            return {
                onCooldown: false,
                minutesLeft: 0,
                lastAttack: null,
                cooldown: window.TWAttack.state.troopBuilds[buildKey] ? 
                    window.TWAttack.state.troopBuilds[buildKey].cooldown : 
                    window.TWAttack.config.defaultCooldown
            };
        },
        
        // Record attack
        recordBuildAttack: function(target, buildKey) {
            // This would need to be implemented
            console.log('Record attack:', target, 'with build', buildKey);
        }
    };
    
    // Register utils with main module
    window.TWAttack.utils = Object.assign(window.TWAttack.utils || {}, Utils);
    
    console.log('TW Attack: Utilities loaded');
    
})();
