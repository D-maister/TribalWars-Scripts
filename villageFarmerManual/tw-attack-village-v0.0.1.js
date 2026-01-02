// ===== TW Attack Script - Village Info Module =====

(function() {
    'use strict';
    
    if (!window.TWAttack) return;
    
    const VillageModule = {
        // Initialize village module
        initialize: function() {
            this.createInfoVillagePanel();
        },
        
        // Find coordinates on page
        findCoordinatesOnPage: function() {
            if (!window.TWAttack.pages.isInfoVillage()) {
                return null;
            }
            
            // Look for coordinates in the village info page structure
            var title = document.querySelector('head > title');
            if (title) {
                var match = title.textContent.match(/\((\d+)\|(\d+)\)/);
                if (match) {
                    return match[1] + "|" + match[2];
                }
            }
            
            // Look in the village name header
            var villageNameElement = document.querySelector('td#content_value h1, td#content_value .village-name, td#content_value .title');
            if (villageNameElement) {
                var text = villageNameElement.textContent;
                var match = text.match(/\((\d+)\|(\d+)\)/);
                if (match) {
                    return match[1] + "|" + match[2];
                }
            }
            
            // Look for coordinates pattern in the content_value area
            var contentValue = document.querySelector('td#content_value');
            if (contentValue) {
                var textNodes = document.evaluate('.//text()[contains(., "|")]', contentValue, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                
                for (var i = 0; i < textNodes.snapshotLength; i++) {
                    var node = textNodes.snapshotItem(i);
                    var text = node.textContent.trim();
                    
                    var match = text.match(/(\d+)\s*\|\s*(\d+)/);
                    if (match) {
                        return match[1].trim() + '|' + match[2].trim();
                    }
                    
                    match = text.match(/\((\d+)\s*\|\s*(\d+)\)/);
                    if (match) {
                        return match[1].trim() + '|' + match[2].trim();
                    }
                }
            }
            
            return null;
        },
        
        // Create info village panel
        createInfoVillagePanel: function() {
            var coords = this.findCoordinatesOnPage();
            if (!coords) {
                window.TWAttack.utils.showError("Could not find village coordinates on info_village page");
                return;
            }
            
            // Check if panel already exists
            var existingPanel = document.getElementById('tw-attack-info-panel');
            if (existingPanel) {
                // Update existing panel
                this.updateInfoVillagePanel(existingPanel, coords);
                return;
            }
            
            // Create new panel
            this.createNewInfoVillagePanel(coords);
        },
        
        // Create new info village panel
        createNewInfoVillagePanel: function(coords) {
            var isInTargetList = window.TWAttack.targets.getCurrent().includes(coords);
            var targetBuildSettings = isInTargetList ? 
                (window.TWAttack.state.targetBuilds[coords] || { A: true, B: true, C: true }) : 
                { A: false, B: false, C: false };
            
            var buildSettings = window.TWAttack.state.settings.autoAttackBuilds || { A: true, B: false, C: false };
            
            var panel = document.createElement('div');
            panel.id = 'tw-attack-info-panel';
            panel.className = 'tw-attack-info-panel';
            
            var title = document.createElement('h3');
            title.className = 'tw-attack-info-title';
            title.textContent = '⚔️ TW Attack Control';
            
            var coordsDisplay = document.createElement('div');
            coordsDisplay.className = 'tw-attack-info-coords';
            coordsDisplay.textContent = coords;
            
            var buildButtons = document.createElement('div');
            buildButtons.className = 'tw-attack-info-build-buttons';
            
            // Create build buttons
            ['A', 'B', 'C'].forEach((buildKey) => {
                var isBuildEnabledInSettings = buildSettings[buildKey] !== false;
                var isBuildEnabledForTarget = targetBuildSettings[buildKey];
                
                var btnContainer = document.createElement('div');
                btnContainer.className = 'tw-attack-info-build-container';
                
                var btn = document.createElement('button');
                btn.className = 'tw-attack-info-build-btn ' + buildKey.toLowerCase();
                btn.textContent = 'Build ' + buildKey;
                btn.dataset.build = buildKey;
                btn.dataset.coords = coords;
                
                if (!isBuildEnabledInSettings) {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                    btn.title = 'Build ' + buildKey + ' is disabled in settings';
                } else {
                    if (isBuildEnabledForTarget) {
                        btn.classList.add('checked');
                        btn.title = 'Build ' + buildKey + ' enabled for this village';
                    } else {
                        btn.classList.add('not-checked');
                        btn.title = 'Build ' + buildKey + ' disabled for this village';
                    }
                }
                
                // Add cooldown indicator
                var cooldownIndicator = document.createElement('span');
                cooldownIndicator.className = 'tw-attack-info-cooldown-indicator';
                
                if (!isBuildEnabledInSettings) {
                    cooldownIndicator.textContent = '✕';
                    cooldownIndicator.classList.add('disabled');
                } else {
                    cooldownIndicator.textContent = '✓';
                    cooldownIndicator.classList.add('ready');
                }
                
                btnContainer.appendChild(btn);
                btnContainer.appendChild(cooldownIndicator);
                
                btn.onclick = () => {
                    this.handleBuildButtonClick(buildKey, coords, isBuildEnabledInSettings, isBuildEnabledForTarget);
                };
                
                buildButtons.appendChild(btnContainer);
            });
            
            var actionButtons = document.createElement('div');
            actionButtons.className = 'tw-attack-info-actions';
            
            // Toggle button
            var toggleListBtn = document.createElement('button');
            toggleListBtn.className = 'tw-attack-info-action-btn tw-attack-info-toggle-btn';
            toggleListBtn.dataset.coords = coords;
            
            if (isInTargetList) {
                toggleListBtn.textContent = 'Remove from List';
                toggleListBtn.classList.add('remove');
                toggleListBtn.title = 'Remove village from target list';
            } else {
                toggleListBtn.textContent = 'Add to List';
                toggleListBtn.classList.add('add');
                toggleListBtn.title = 'Add village to target list';
            }
            
            toggleListBtn.onclick = () => {
                this.handleToggleListButtonClick(coords, isInTargetList);
            };
            
            // Ignore button
            var ignoreBtn = document.createElement('button');
            ignoreBtn.className = 'tw-attack-info-action-btn tw-attack-info-ignore-btn';
            ignoreBtn.textContent = 'Ignore';
            ignoreBtn.dataset.coords = coords;
            ignoreBtn.onclick = () => {
                this.handleIgnoreButtonClick(coords, isInTargetList);
            };
            
            var statusMsg = document.createElement('div');
            statusMsg.id = 'info-status';
            statusMsg.className = 'tw-attack-info-status';
            
            actionButtons.appendChild(toggleListBtn);
            actionButtons.appendChild(ignoreBtn);
            
            panel.appendChild(title);
            panel.appendChild(coordsDisplay);
            panel.appendChild(buildButtons);
            panel.appendChild(actionButtons);
            panel.appendChild(statusMsg);
            
            // Insert after minimap
            var minimap = document.querySelector('div#minimap');
            if (minimap && minimap.parentNode) {
                minimap.parentNode.insertBefore(panel, minimap.nextSibling);
            } else {
                var container = document.querySelector('#content_value > div.commands-container-outer');
                if (container) {
                    container.insertBefore(panel, container.firstChild);
                } else {
                    document.body.insertBefore(panel, document.body.firstChild);
                }
            }
        },
        
        // Update info village panel
        updateInfoVillagePanel: function(panel, coords) {
            var isInTargetList = window.TWAttack.targets.getCurrent().includes(coords);
            var targetBuildSettings = isInTargetList ? 
                (window.TWAttack.state.targetBuilds[coords] || { A: true, B: true, C: true }) : 
                { A: false, B: false, C: false };
            
            var buildSettings = window.TWAttack.state.settings.autoAttackBuilds || { A: true, B: false, C: false };
            
            // Update build buttons
            ['A', 'B', 'C'].forEach((buildKey) => {
                var isBuildEnabledInSettings = buildSettings[buildKey] !== false;
                var isBuildEnabledForTarget = targetBuildSettings[buildKey];
                
                var btn = panel.querySelector('.tw-attack-info-build-btn.' + buildKey.toLowerCase());
                var cooldownIndicator = panel.querySelector('.tw-attack-info-cooldown-indicator');
                
                if (btn) {
                    if (!isBuildEnabledInSettings) {
                        btn.classList.add('disabled');
                        btn.classList.remove('checked', 'not-checked');
                        btn.disabled = true;
                        btn.title = 'Build ' + buildKey + ' is disabled in settings';
                        
                        if (cooldownIndicator) {
                            cooldownIndicator.textContent = '✕';
                            cooldownIndicator.className = 'tw-attack-info-cooldown-indicator disabled';
                        }
                    } else {
                        btn.classList.remove('disabled');
                        btn.disabled = false;
                        
                        if (isBuildEnabledForTarget) {
                            btn.classList.add('checked');
                            btn.classList.remove('not-checked');
                            btn.title = 'Build ' + buildKey + ' enabled for this village';
                        } else {
                            btn.classList.add('not-checked');
                            btn.classList.remove('checked');
                            btn.title = 'Build ' + buildKey + ' disabled for this village';
                        }
                        
                        if (cooldownIndicator) {
                            cooldownIndicator.textContent = '✓';
                            cooldownIndicator.className = 'tw-attack-info-cooldown-indicator ready';
                        }
                    }
                }
            });
            
            // Update toggle button
            var toggleBtn = panel.querySelector('.tw-attack-info-toggle-btn');
            if (toggleBtn) {
                if (isInTargetList) {
                    toggleBtn.textContent = 'Remove from List';
                    toggleBtn.classList.remove('add');
                    toggleBtn.classList.add('remove');
                    toggleBtn.title = 'Remove village from target list';
                } else {
                    toggleBtn.textContent = 'Add to List';
                    toggleBtn.classList.remove('remove');
                    toggleBtn.classList.add('add');
                    toggleBtn.title = 'Add village to target list';
                }
                
                toggleBtn.onclick = () => {
                    this.handleToggleListButtonClick(coords, isInTargetList);
                };
            }
            
            // Update ignore button
            var ignoreBtn = panel.querySelector('.tw-attack-info-ignore-btn');
            if (ignoreBtn) {
                ignoreBtn.onclick = () => {
                    this.handleIgnoreButtonClick(coords, isInTargetList);
                };
            }
        },
        
        // Handle build button click
        handleBuildButtonClick: function(buildKey, coords, isBuildEnabledInSettings, isBuildEnabledForTarget) {
            if (!isBuildEnabledInSettings) {
                this.showInfoStatus('Build ' + buildKey + ' is disabled in settings. Enable it in the attack config first.', 'error');
                return;
            }
            
            var isInTargetList = window.TWAttack.targets.getCurrent().includes(coords);
            
            if (!isInTargetList && !isBuildEnabledForTarget) {
                // Add to target list with this build enabled
                window.TWAttack.targets.add(coords, {
                    name: "Village from Info Page",
                    points: 0,
                    playerNumber: 0,
                    isBonus: false
                });
                window.TWAttack.builds.set(coords, buildKey, true);
                this.showInfoStatus('Village ' + coords + ' added to target list with Build ' + buildKey + ' enabled', 'success');
                
                // Update panel
                var panel = document.getElementById('tw-attack-info-panel');
                if (panel) {
                    setTimeout(() => {
                        this.updateInfoVillagePanel(panel, coords);
                    }, 100);
                }
            } else if (isInTargetList) {
                // Toggle build for existing target
                var newState = !isBuildEnabledForTarget;
                window.TWAttack.builds.set(coords, buildKey, newState);
                
                if (newState) {
                    this.showInfoStatus('Build ' + buildKey + ' enabled for ' + coords, 'success');
                } else {
                    this.showInfoStatus('Build ' + buildKey + ' disabled for ' + coords, 'success');
                }
                
                // Update panel
                var panel = document.getElementById('tw-attack-info-panel');
                if (panel) {
                    setTimeout(() => {
                        this.updateInfoVillagePanel(panel, coords);
                    }, 100);
                }
            }
        },
        
        // Handle toggle list button click
        handleToggleListButtonClick: function(coords, isInTargetList) {
            if (isInTargetList) {
                // Remove from list
                if (window.TWAttack.targets.remove(coords)) {
                    this.showInfoStatus('Village ' + coords + ' removed from target list', 'success');
                    
                    // Update panel
                    var panel = document.getElementById('tw-attack-info-panel');
                    if (panel) {
                        setTimeout(() => {
                            this.updateInfoVillagePanel(panel, coords);
                        }, 100);
                    }
                }
            } else {
                // Add to list
                if (window.TWAttack.targets.add(coords, {
                    name: "Village from Info Page",
                    points: 0,
                    playerNumber: 0,
                    isBonus: false
                })) {
                    // By default, disable all builds when adding new village
                    var buildSettings = window.TWAttack.state.settings.autoAttackBuilds || { A: true, B: false, C: false };
                    ['A', 'B', 'C'].forEach((buildKey) => {
                        if (buildSettings[buildKey]) {
                            window.TWAttack.builds.set(coords, buildKey, false);
                        }
                    });
                    this.showInfoStatus('Village ' + coords + ' added to target list', 'success');
                    
                    // Update panel
                    var panel = document.getElementById('tw-attack-info-panel');
                    if (panel) {
                        setTimeout(() => {
                            this.updateInfoVillagePanel(panel, coords);
                        }, 100);
                    }
                }
            }
        },
        
        // Handle ignore button click
        handleIgnoreButtonClick: function(coords, isInTargetList) {
            // This would need ignore list implementation
            this.showInfoStatus('Ignore list functionality not implemented yet', 'error');
            
            if (isInTargetList) {
                window.TWAttack.targets.remove(coords);
            }
        },
        
        // Show info status
        showInfoStatus: function(message, type) {
            var statusMsg = document.getElementById('info-status');
            if (statusMsg) {
                statusMsg.textContent = message;
                statusMsg.style.display = 'block';
                statusMsg.className = 'tw-attack-info-status';
                
                if (type === 'success') {
                    statusMsg.classList.add('tw-attack-status-success');
                } else if (type === 'error') {
                    statusMsg.classList.add('tw-attack-status-error');
                }
                
                setTimeout(() => {
                    statusMsg.style.display = 'none';
                }, 5000);
            }
        }
    };
    
    // Register module with main
    window.TWAttack.registerModule('village', VillageModule);
    
    console.log('TW Attack: Village module loaded');
    
})();
