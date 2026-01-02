// ===== TW Attack Script - Attack Module =====

(function() {
    'use strict';
    
    if (!window.TWAttack) return;
    
    const AttackModule = {
        configVisible: false,
        updateInterval: null,
        
        // Initialize attack module
        initialize: function() {
            if (window.TWAttack.utils.checkForAntibot()) return;
            this.createConfigUI();
            
            if (window.TWAttack.state.settings.autoAttackEnabled) {
                setTimeout(function() {
                    AttackModule.autoAttackNext();
                }, 2000);
            }
        },
        
        // Create config UI
        createConfigUI: function() {
            var existingUI = document.getElementById('tw-attack-config');
            if (existingUI) existingUI.remove();
            
            var uiContainer = document.createElement('div');
            uiContainer.id = 'tw-attack-config';
            uiContainer.className = 'tw-attack-config';
            
            var title = document.createElement('h3');
            title.textContent = '⚔️ TW Attack Config - ' + window.TWAttack.state.currentWorld;
            title.className = 'tw-attack-title';
            
            var toggleConfigBtn = document.createElement('button');
            toggleConfigBtn.textContent = this.configVisible ? '▲ Hide Config' : '▼ Show Config';
            toggleConfigBtn.className = 'tw-attack-toggle-btn';
            toggleConfigBtn.onclick = function() {
                AttackModule.configVisible = !AttackModule.configVisible;
                this.textContent = AttackModule.configVisible ? '▲ Hide Config' : '▼ Show Config';
                AttackModule.toggleConfigVisibility();
            };
            
            var autoAttackContainer = document.createElement('div');
            autoAttackContainer.className = 'tw-attack-auto-container';
            
            var autoAttackBtnA = document.createElement('button');
            autoAttackBtnA.textContent = '⚡ Auto-Attack (A)';
            autoAttackBtnA.className = 'tw-attack-auto-btn tw-attack-auto-btn-a';
            autoAttackBtnA.onclick = function() { AttackModule.autoAttackNext(); };
            
            var autoAttackBtnB = document.createElement('button');
            autoAttackBtnB.textContent = '⚡ Auto-Attack (B)';
            autoAttackBtnB.className = 'tw-attack-auto-btn tw-attack-auto-btn-b';
            autoAttackBtnB.onclick = function() { AttackModule.autoAttackNext(); };
            
            var autoAttackBtnC = document.createElement('button');
            autoAttackBtnC.textContent = '⚡ Auto-Attack (C)';
            autoAttackBtnC.className = 'tw-attack-auto-btn tw-attack-auto-btn-c';
            autoAttackBtnC.onclick = function() { AttackModule.autoAttackNext(); };
            
            autoAttackContainer.appendChild(autoAttackBtnA);
            autoAttackContainer.appendChild(autoAttackBtnB);
            autoAttackContainer.appendChild(autoAttackBtnC);
            
            var infoSection = document.createElement('div');
            infoSection.id = 'world-info';
            infoSection.className = 'tw-attack-world-info';
            
            var worldInfo = document.createElement('div');
            worldInfo.innerHTML = '<strong>🌍 World:</strong> ' + window.TWAttack.state.currentWorld;
            worldInfo.style.marginBottom = '6px';
            
            var villageInfo = document.createElement('div');
            villageInfo.innerHTML = '<strong>🏠 Current Village:</strong> ' + (window.TWAttack.state.homeCoords || 'Not found');
            villageInfo.style.marginBottom = '8px';
            villageInfo.style.color = '#666';
            
            var villageUrl = document.createElement('div');
            villageUrl.style.cssText = `margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ddd;`;
            
            var urlLink = document.createElement('a');
            urlLink.href = window.TWAttack.utils.getVillageTxtUrl();
            urlLink.textContent = '📥 Download village.txt';
            urlLink.target = '_blank';
            urlLink.style.cssText = `
                color: #2196F3;
                text-decoration: none;
                font-weight: bold;
                display: inline-block;
                padding: 4px 8px;
                background: #e3f2fd;
                border-radius: 4px;
                border: 1px solid #bbdefb;
                transition: background 0.2s;
                font-size: 11px;
            `;
            urlLink.onmouseover = function() { this.style.background = '#bbdefb'; };
            urlLink.onmouseout = function() { this.style.background = '#e3f2fd'; };
            urlLink.onclick = function(e) {
                e.preventDefault();
                window.open(this.href, '_blank');
            };
            
            var urlHelp = document.createElement('div');
            urlHelp.textContent = 'Open, copy all text, paste below:';
            urlHelp.style.fontSize = '10px';
            urlHelp.style.color = '#666';
            urlHelp.style.marginTop = '4px';
            
            infoSection.appendChild(worldInfo);
            infoSection.appendChild(villageInfo);
            infoSection.appendChild(villageUrl);
            infoSection.appendChild(urlLink);
            infoSection.appendChild(urlHelp);
            
            // Insert into the main page
            var container = document.querySelector('#content_value > div.commands-container-outer');
            if (container) {
                var outgoing = container.querySelector('#commands_outgoings');
                if (outgoing) {
                    container.insertBefore(uiContainer, outgoing);
                } else {
                    container.appendChild(uiContainer);
                }
            } else {
                document.body.appendChild(uiContainer);
            }
            
            uiContainer.appendChild(title);
            uiContainer.appendChild(toggleConfigBtn);
            uiContainer.appendChild(autoAttackContainer);
            uiContainer.appendChild(infoSection);
            
            this.startAutoUpdate();
        },
        
        // Toggle config visibility
        toggleConfigVisibility: function() {
            // Implementation for showing/hiding config sections
        },
        
        // Start auto-update
        startAutoUpdate: function() {
            if (this.updateInterval) clearInterval(this.updateInterval);
            this.updateInterval = setInterval(function() {
                // Update targets list UI
            }, 30000);
        },
        
        // Stop auto-update
        stopAutoUpdate: function() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        },
        
        // Attack target
        attackTarget: function(target, buildKey) {
            if (window.TWAttack.utils.checkForAntibot()) return;
            
            var currentUrl = location.href;
            var doc = window.frames.length > 0 ? window.main.document : document;
            
            // Check if we're on the correct place page
            var isScreenPlace = currentUrl.endsWith('screen=place');
            var hasVillageId = currentUrl.includes('screen=place&village=');
            var hasModeCommand = currentUrl.includes('mode=command');
            var hasModeSim = currentUrl.includes('mode=sim');
            var hasModeOther = currentUrl.match(/mode=[^&]+/) && !hasModeCommand;
            var hasTryConfirm = currentUrl.includes('try=confirm');
            
            var isValidAttackPage = false;
            
            if (isScreenPlace || hasVillageId) {
                if (hasModeCommand) {
                    isValidAttackPage = true;
                } else if (!hasModeSim && !hasModeOther) {
                    isValidAttackPage = true;
                }
            }
            
            if (hasTryConfirm && !hasModeCommand) {
                isValidAttackPage = false;
            }
            
            if (isValidAttackPage && doc.forms[0]) {
                var availableTroops = window.TWAttack.utils.getAvailableTroops();
                var build = window.TWAttack.state.troopBuilds[buildKey] || 
                    { spear: 0, sword: 0, axe: 0, spy: 0, light: 2, heavy: 0, ram: 0, catapult: 0, knight: 0 };
                
                var hasEnoughTroops = true;
                var troopTypesToCheck = ['spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult', 'knight'];
                
                for (var i = 0; i < troopTypesToCheck.length; i++) {
                    var troopType = troopTypesToCheck[i];
                    var troopCount = build[troopType] || 0;
                    
                    if (troopCount > 0) {
                        var available = availableTroops[troopType] || 0;
                        if (available < troopCount) {
                            hasEnoughTroops = false;
                            break;
                        }
                    }
                }
                
                if (!hasEnoughTroops) {
                    window.TWAttack.utils.showError('Not enough troops for Build ' + buildKey + ' on ' + target + '. Skipping village.');
                    
                    window.TWAttack.utils.recordBuildAttack(target, buildKey);
                    
                    if (window.TWAttack.state.settings.autoAttackEnabled) {
                        setTimeout(function() {
                            AttackModule.autoAttackNext();
                        }, 1000);
                    }
                    
                    return;
                }
                
                var coords = target.split("|");
                doc.forms[0].x.value = coords[0];
                doc.forms[0].y.value = coords[1];
                
                window.TWAttack.utils.setUnitCount(doc.forms[0].spear, build.spear || 0);
                window.TWAttack.utils.setUnitCount(doc.forms[0].sword, build.sword || 0);
                window.TWAttack.utils.setUnitCount(doc.forms[0].axe, build.axe || 0);
                window.TWAttack.utils.setUnitCount(doc.forms[0].spy, build.spy || 0);
                window.TWAttack.utils.setUnitCount(doc.forms[0].light, build.light || 0);
                window.TWAttack.utils.setUnitCount(doc.forms[0].heavy, build.heavy || 0);
                window.TWAttack.utils.setUnitCount(doc.forms[0].ram, build.ram || 0);
                window.TWAttack.utils.setUnitCount(doc.forms[0].catapult, build.catapult || 0);
                window.TWAttack.utils.setUnitCount(doc.forms[0].knight, build.knight || 0);
                
                window.TWAttack.utils.recordBuildAttack(target, buildKey);
                window.TWAttack.utils.showStatus('Target ' + target + ' prepared with Build ' + buildKey + '! Click "Place" button to send.', 'success');
                
                // Auto-click submit button
                setTimeout(function() {
                    if (window.TWAttack.utils.clickAttackButton()) {
                        window.TWAttack.utils.showStatus('Auto-attack: Attack sent to ' + target + ' with Build ' + buildKey, 'success');
                    } else {
                        window.TWAttack.utils.showStatus('Auto-attack: Could not find submit button', 'error');
                    }
                }, 500);
            } else {
                window.TWAttack.utils.showStatus('Please go to Rally Point > Place tab to attack (not simulation mode)', 'error');
            }
        },
        
        // Auto attack next target
        autoAttackNext: function() {
            if (window.TWAttack.utils.checkForAntibot()) return;
            
            // Check if we're on a valid attack page
            var currentUrl = location.href;
            var isScreenPlace = currentUrl.endsWith('screen=place');
            var hasVillageId = currentUrl.includes('screen=place&village=');
            var hasModeCommand = currentUrl.includes('mode=command');
            var hasModeSim = currentUrl.includes('mode=sim');
            var hasModeOther = currentUrl.match(/mode=[^&]+/) && !hasModeCommand;
            var hasTryConfirm = currentUrl.includes('try=confirm');
            
            var isValidAttackPage = false;
            
            if (isScreenPlace || hasVillageId) {
                if (hasModeCommand) {
                    isValidAttackPage = true;
                } else if (!hasModeSim && !hasModeOther && !hasTryConfirm) {
                    isValidAttackPage = true;
                }
            }
            
            if (!isValidAttackPage) {
                window.TWAttack.utils.showStatus('Auto-attack only works on Rally Point > Place tab (not simulation mode)', 'error');
                
                if (window.TWAttack.state.settings.autoAttackEnabled) {
                    setTimeout(function() {
                        AttackModule.autoAttackNext();
                    }, 60000);
                }
                return;
            }
            
            window.TWAttack.utils.cleanupOldHistory();
            
            var targets = window.TWAttack.targets.getCurrent();
            if (targets.length === 0) {
                window.TWAttack.utils.showStatus('No targets in list for auto-attack', 'error');
                
                if (window.TWAttack.state.settings.autoAttackEnabled) {
                    setTimeout(function() {
                        AttackModule.autoAttackNext();
                    }, 60000);
                }
                return;
            }
            
            var targetIndex = 0;
            var savedIndex = window.TWAttack.cookies.get('akk');
            if (null !== savedIndex) targetIndex = parseInt(savedIndex);
            
            var startIndex = targetIndex;
            var selectedTarget = null;
            var selectedBuild = null;
            var attempts = 0;
            
            var availableTroops = {};
            try {
                availableTroops = window.TWAttack.utils.getAvailableTroops();
            } catch (e) {
                window.TWAttack.utils.showError("Could not get available troops");
            }
            
            do {
                var currentTarget = targets[targetIndex];
                var targetBuildSettings = window.TWAttack.state.targetBuilds[currentTarget] || { A: true, B: true, C: true };
                
                var anyBuildOffCooldown = false;
                for (var buildKey in targetBuildSettings) {
                    if (targetBuildSettings[buildKey] && window.TWAttack.state.settings.autoAttackBuilds[buildKey]) {
                        var buildCooldownInfo = window.TWAttack.utils.getBuildCooldownInfo(currentTarget, buildKey);
                        if (!buildCooldownInfo.onCooldown) {
                            anyBuildOffCooldown = true;
                            break;
                        }
                    }
                }
                
                if (anyBuildOffCooldown) {
                    var buildOrder = ['A', 'B', 'C'];
                    
                    for (var i = 0; i < buildOrder.length; i++) {
                        var buildKey = buildOrder[i];
                        if (targetBuildSettings[buildKey] && window.TWAttack.state.settings.autoAttackBuilds[buildKey]) {
                            var buildCooldownInfo = window.TWAttack.utils.getBuildCooldownInfo(currentTarget, buildKey);
                            
                            if (!buildCooldownInfo.onCooldown) {
                                var build = window.TWAttack.state.troopBuilds[buildKey] || 
                                    { spear: 0, sword: 0, axe: 0, spy: 0, light: 2, heavy: 0, ram: 0, catapult: 0, knight: 0 };
                                var hasEnoughTroops = true;
                                
                                if (Object.keys(availableTroops).length > 0) {
                                    var troopTypes = ['spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult', 'knight'];
                                    
                                    for (var j = 0; j < troopTypes.length; j++) {
                                        var troopType = troopTypes[j];
                                        var troopCount = build[troopType] || 0;
                                        
                                        if (troopCount > 0) {
                                            var available = availableTroops[troopType] || 0;
                                            if (available < troopCount) {
                                                hasEnoughTroops = false;
                                                break;
                                            }
                                        }
                                    }
                                } else {
                                    hasEnoughTroops = false;
                                }
                                
                                if (hasEnoughTroops) {
                                    selectedTarget = currentTarget;
                                    selectedBuild = buildKey;
                                    break;
                                }
                            }
                        }
                    }
                    
                    if (selectedTarget) break;
                }
                targetIndex = (targetIndex + 1) % targets.length;
                attempts++;
            } while (attempts < targets.length && targetIndex != startIndex);
            
            if (selectedTarget && selectedBuild) {
                var nextIndex = (targetIndex + 1) % targets.length;
                window.TWAttack.cookies.set('akk', nextIndex.toString(), 365);
                this.attackTarget(selectedTarget, selectedBuild);
            } else {
                window.TWAttack.utils.showStatus('No targets available for auto-attack', 'error');
                
                if (window.TWAttack.state.settings.autoAttackEnabled) {
                    setTimeout(function() {
                        AttackModule.autoAttackNext();
                    }, 60000);
                }
            }
        },
        
        // Attack target with available build
        attackTargetWithAvailableBuild: function(target) {
            var targetBuildSettings = window.TWAttack.state.targetBuilds[target] || { A: true, B: true, C: true };
            var buildOrder = ['A', 'B', 'C'];
            
            for (var i = 0; i < buildOrder.length; i++) {
                var buildKey = buildOrder[i];
                if (targetBuildSettings[buildKey] && window.TWAttack.state.settings.autoAttackBuilds[buildKey]) {
                    var buildCooldownInfo = window.TWAttack.utils.getBuildCooldownInfo(target, buildKey);
                    if (!buildCooldownInfo.onCooldown) {
                        this.attackTarget(target, buildKey);
                        return;
                    }
                }
            }
            
            window.TWAttack.utils.showStatus('All builds for target ' + target + ' are on cooldown', 'error');
        }
    };
    
    // Register module with main
    window.TWAttack.registerModule('attack', AttackModule);
    
    console.log('TW Attack: Attack module loaded');
    
})();
