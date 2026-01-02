// ===== TW Attack Script - Village Info Module =====

(function() {
    'use strict';
    
    if (!window.TWAttack) return;
    
    const VillageModule = {
        // Initialize village module
        initialize: function() {
            console.log('TW Attack: Village module initializing');
            this.createInfoVillagePanel();
        },
        
        // Find coordinates on page - IMPROVED VERSION with URL support
        findCoordinatesOnPage: function() {
            if (!window.TWAttack.pages.isInfoVillage()) {
                console.log('TW Attack: Not on info_village page');
                return null;
            }
            
            console.log('TW Attack: Searching for coordinates on info_village page');
            
            // METHOD 1: Extract from URL hash (e.g., #480;475 or #480|475)
            var hash = window.location.hash;
            if (hash) {
                // Remove the # symbol
                var coordsStr = hash.substring(1);
                console.log('TW Attack: URL hash found:', coordsStr);
                
                // Check for format like "480;475" or "480|475"
                var hashMatch = coordsStr.match(/(\d+)[;|](\d+)/);
                if (hashMatch) {
                    var coords = hashMatch[1] + "|" + hashMatch[2];
                    console.log('TW Attack: Coordinates extracted from URL hash:', coords);
                    return coords;
                }
            }
            
            // METHOD 2: Extract from full URL (in case hash is not properly set)
            var url = window.location.href;
            console.log('TW Attack: Current URL:', url);
            
            // Look for patterns like #480;475 or #480|475 in the URL
            var urlMatch = url.match(/#(\d+)[;|](\d+)/);
            if (urlMatch) {
                var coords = urlMatch[1] + "|" + urlMatch[2];
                console.log('TW Attack: Coordinates extracted from full URL:', coords);
                return coords;
            }
            
            // METHOD 3: Look in the page title (fallback)
            var title = document.querySelector('head > title');
            if (title) {
                var match = title.textContent.match(/\((\d+)\|(\d+)\)/);
                if (match) {
                    console.log('TW Attack: Found coordinates in title:', match[1] + '|' + match[2]);
                    return match[1] + "|" + match[2];
                }
            }
            
            // METHOD 4: Look for village header with coordinates
            var villageHeaders = document.querySelectorAll('h1, h2, h3, .village-name, .title-inline');
            for (var i = 0; i < villageHeaders.length; i++) {
                var text = villageHeaders[i].textContent;
                var match = text.match(/\((\d+)\s*\|\s*(\d+)\)/);
                if (match) {
                    console.log('TW Attack: Found coordinates in header:', match[1] + '|' + match[2]);
                    return match[1].trim() + '|' + match[2].trim();
                }
            }
            
            // METHOD 5: Look in table cells with coordinate patterns
            var allCells = document.querySelectorAll('td');
            for (var i = 0; i < allCells.length; i++) {
                var cell = allCells[i];
                var text = cell.textContent.trim();
                
                // Look for patterns like "123|456" or "(123|456)"
                var match = text.match(/(\d+)\s*\|\s*(\d+)/);
                if (match) {
                    // Check if this looks like coordinates (reasonable numbers)
                    var x = parseInt(match[1]);
                    var y = parseInt(match[2]);
                    if (x >= 0 && x <= 1000 && y >= 0 && y <= 1000) {
                        console.log('TW Attack: Found coordinates in table cell:', x + '|' + y);
                        return x + '|' + y;
                    }
                }
            }
            
            // METHOD 6: Look for specific structures on info_village page
            // On TribalWars, coordinates are often in a specific table structure
            var contentValue = document.querySelector('td#content_value');
            if (contentValue) {
                // Look for all text nodes with coordinate patterns
                var walker = document.createTreeWalker(
                    contentValue,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                var node;
                while (node = walker.nextNode()) {
                    var text = node.textContent.trim();
                    var match = text.match(/\((\d+)\s*\|\s*(\d+)\)/);
                    if (match) {
                        console.log('TW Attack: Found coordinates in content_value:', match[1] + '|' + match[2]);
                        return match[1].trim() + '|' + match[2].trim();
                    }
                }
            }
            
            // METHOD 7: Check for village data in meta tags or data attributes
            var metaCoords = document.querySelector('meta[name="coordinates"], meta[property="coordinates"]');
            if (metaCoords && metaCoords.content) {
                var match = metaCoords.content.match(/(\d+)\|(\d+)/);
                if (match) {
                    console.log('TW Attack: Found coordinates in meta tag:', match[1] + '|' + match[2]);
                    return match[1] + '|' + match[2];
                }
            }
            
            // METHOD 8: Check for data attributes on the village container
            var villageContainer = document.querySelector('[data-village], [data-x], [data-y], .village[data-id]');
            if (villageContainer) {
                var x = villageContainer.getAttribute('data-x') || villageContainer.getAttribute('data-coord-x');
                var y = villageContainer.getAttribute('data-y') || villageContainer.getAttribute('data-coord-y');
                
                if (x && y) {
                    console.log('TW Attack: Found coordinates in data attributes:', x + '|' + y);
                    return x + '|' + y;
                }
            }
            
            console.log('TW Attack: Could not find coordinates on info_village page');
            
            // Final fallback: Try to use the TWAttack utils function
            if (window.TWAttack.utils && window.TWAttack.utils.getCurrentVillageCoords) {
                var utilsCoords = window.TWAttack.utils.getCurrentVillageCoords();
                if (utilsCoords) {
                    console.log('TW Attack: Using coordinates from TWAttack utils:', utilsCoords);
                    return utilsCoords;
                }
            }
            
            return null;
        },
        
        // Helper function to parse coordinates from any string
        parseCoordinatesFromString: function(str) {
            if (!str) return null;
            
            // Try different formats:
            // 1. #480;475 or #480|475 (URL hash format)
            // 2. 480;475 or 480|475 (coordinate string)
            // 3. (480|475) (title format)
            
            var patterns = [
                /#?(\d+)[;|](\d+)/,      // #480;475 or 480|475
                /\((\d+)\|(\d+)\)/,       // (480|475)
                /(\d+)\s*[;|]\s*(\d+)/    // 480 ; 475 with possible spaces
            ];
            
            for (var i = 0; i < patterns.length; i++) {
                var match = str.match(patterns[i]);
                if (match && match[1] && match[2]) {
                    return match[1] + "|" + match[2];
                }
            }
            
            return null;
        },
        
        // Create info village panel
        createInfoVillagePanel: function() {
            console.log('TW Attack: Creating info village panel');
            
            var coords = this.findCoordinatesOnPage();
            if (!coords) {
                // Try one more time with a more aggressive search
                console.log('TW Attack: Primary coordinate search failed, trying alternative methods');
                
                // Try to extract from current URL directly
                var url = window.location.href;
                coords = this.parseCoordinatesFromString(url);
                
                if (!coords) {
                    window.TWAttack.utils.showError("Could not find village coordinates on info_village page");
                    return;
                }
                
                console.log('TW Attack: Coordinates found via alternative method:', coords);
            }
            
            console.log('TW Attack: Coordinates found:', coords);
            
            // Check if panel already exists
            var existingPanel = document.getElementById('tw-attack-info-panel');
            if (existingPanel) {
                // Update existing panel
                console.log('TW Attack: Updating existing info panel');
                this.updateInfoVillagePanel(existingPanel, coords);
                return;
            }
            
            // Create new panel
            console.log('TW Attack: Creating new info panel');
            this.createNewInfoVillagePanel(coords);
        },
        
        // Create new info village panel
        createNewInfoVillagePanel: function(coords) {
            var isInTargetList = window.TWAttack.targets.getCurrent().includes(coords);
            var targetBuildSettings = isInTargetList ? 
                (window.TWAttack.state.targetBuilds[coords] || { A: true, B: true, C: true }) : 
                { A: false, B: false, C: false };
            
            var buildSettings = window.TWAttack.state.settings.autoAttackBuilds || { A: true, B: false, C: false };
            
            console.log('TW Attack: Creating panel for coords:', coords);
            console.log('TW Attack: Is in target list:', isInTargetList);
            console.log('TW Attack: Target build settings:', targetBuildSettings);
            
            var panel = document.createElement('div');
            panel.id = 'tw-attack-info-panel';
            panel.className = 'tw-attack-info-panel';
            
            var title = document.createElement('h3');
            title.className = 'tw-attack-info-title';
            title.textContent = '⚔️ TW Attack Control';
            
            // Show source of coordinates
            var coordsSource = document.createElement('div');
            coordsSource.className = 'tw-attack-info-source';
            
            // Determine where coordinates came from
            var sourceText = 'Coordinates from: ';
            if (window.location.hash && window.location.hash.includes(';')) {
                sourceText += 'URL hash';
            } else if (window.location.href.match(/#\d+[;|]\d+/)) {
                sourceText += 'URL';
            } else {
                sourceText += 'page content';
            }
            coordsSource.textContent = sourceText;
            coordsSource.style.fontSize = '11px';
            coordsSource.style.color = '#888';
            coordsSource.style.marginTop = '-5px';
            coordsSource.style.marginBottom = '5px';
            
            var coordsDisplay = document.createElement('div');
            coordsDisplay.className = 'tw-attack-info-coords';
            coordsDisplay.textContent = coords;
            coordsDisplay.title = 'Click to copy';
            coordsDisplay.style.cursor = 'pointer';
            
            // Add click to copy functionality
            coordsDisplay.onclick = function() {
                navigator.clipboard.writeText(coords).then(function() {
                    var originalText = coordsDisplay.textContent;
                    coordsDisplay.textContent = '✓ Copied!';
                    setTimeout(function() {
                        coordsDisplay.textContent = originalText;
                    }, 1000);
                });
            };
            
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
            panel.appendChild(coordsSource);
            panel.appendChild(coordsDisplay);
            panel.appendChild(buildButtons);
            panel.appendChild(actionButtons);
            panel.appendChild(statusMsg);
            
            // Try to insert after the minimap or in a logical place
            var insertionPoint = this.findInsertionPoint();
            if (insertionPoint) {
                insertionPoint.parentNode.insertBefore(panel, insertionPoint.nextSibling);
                console.log('TW Attack: Panel inserted after', insertionPoint.tagName, insertionPoint.className);
            } else {
                // Fallback: insert at the beginning of content_value
                var contentValue = document.querySelector('td#content_value');
                if (contentValue) {
                    contentValue.insertBefore(panel, contentValue.firstChild);
                    console.log('TW Attack: Panel inserted at beginning of content_value');
                } else {
                    document.body.insertBefore(panel, document.body.firstChild);
                    console.log('TW Attack: Panel inserted at beginning of body');
                }
            }
            
            // Show status if village is already in target list
            if (isInTargetList) {
                var enabledBuilds = [];
                ['A', 'B', 'C'].forEach(function(buildKey) {
                    if (targetBuildSettings[buildKey] && buildSettings[buildKey]) {
                        enabledBuilds.push(buildKey);
                    }
                });
                
                if (enabledBuilds.length > 0) {
                    this.showInfoStatus('Village in target list. Enabled builds: ' + enabledBuilds.join(', '), 'success');
                } else {
                    this.showInfoStatus('Village in target list but no builds enabled', 'error');
                }
            }
        },
        
        // Find the best place to insert the panel
        findInsertionPoint: function() {
            // Try to find the minimap
            var minimap = document.querySelector('div#minimap, .minimap-container, .map-container');
            if (minimap) {
                console.log('TW Attack: Found minimap for insertion');
                return minimap;
            }
            
            // Look for village info tables
            var villageInfoTable = document.querySelector('table.villages, table.vis, .village-details');
            if (villageInfoTable) {
                console.log('TW Attack: Found village info table for insertion');
                return villageInfoTable;
            }
            
            // Look for the first h2 or h3 after the village name
            var headers = document.querySelectorAll('h2, h3, h4');
            for (var i = 0; i < headers.length; i++) {
                if (headers[i].textContent.toLowerCase().includes('info') || 
                    headers[i].textContent.toLowerCase().includes('details')) {
                    console.log('TW Attack: Found info header for insertion:', headers[i].textContent);
                    return headers[i];
                }
            }
            
            console.log('TW Attack: No specific insertion point found');
            return null;
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
            // Load ignore list
            var ignoreList = window.TWAttack.storage.get(window.TWAttack.config.storageKeys.ignore) || {};
            if (!ignoreList[window.TWAttack.state.currentWorld]) {
                ignoreList[window.TWAttack.state.currentWorld] = [];
            }
            
            // Check if already in ignore list
            if (ignoreList[window.TWAttack.state.currentWorld].indexOf(coords) === -1) {
                // Add to ignore list
                ignoreList[window.TWAttack.state.currentWorld].push(coords);
                window.TWAttack.storage.set(window.TWAttack.config.storageKeys.ignore, ignoreList);
                
                // Update the global state ignore list
                window.TWAttack.state.ignoreList = ignoreList[window.TWAttack.state.currentWorld];
                
                if (isInTargetList) {
                    // Remove from target list
                    window.TWAttack.targets.remove(coords);
                    
                    // Force refresh the targets in the global state
                    window.TWAttack.state.targetList = window.TWAttack.targets.getCurrent().join(' ');
                    window.TWAttack.saveState();
                }
                
                this.showInfoStatus('Village ' + coords + ' added to ignore list', 'success');
                
                // Update the panel to show it's ignored
                var panel = document.getElementById('tw-attack-info-panel');
                if (panel) {
                    // Change the panel to show ignored state
                    panel.style.borderColor = '#ff9800';
                    panel.querySelector('.tw-attack-info-title').textContent = '⚔️ TW Attack Control (Ignored)';
                    
                    // Disable all buttons
                    var buttons = panel.querySelectorAll('button');
                    buttons.forEach(function(btn) {
                        btn.disabled = true;
                        btn.style.opacity = '0.5';
                        btn.style.cursor = 'not-allowed';
                    });
                    
                    // Update toggle button to show it's now removed
                    var toggleBtn = panel.querySelector('.tw-attack-info-toggle-btn');
                    if (toggleBtn) {
                        toggleBtn.textContent = 'Add to List';
                        toggleBtn.classList.remove('remove');
                        toggleBtn.classList.add('add');
                        toggleBtn.title = 'Add village to target list';
                        toggleBtn.disabled = true; // Disable since village is ignored
                    }
                    
                    // Update build buttons
                    var buildButtons = panel.querySelectorAll('.tw-attack-info-build-btn');
                    buildButtons.forEach(function(btn) {
                        btn.disabled = true;
                    });
                    
                    // Update status
                    this.showInfoStatus('Village ignored. To remove from ignore list, use the attack page config.', 'info');
                }
            } else {
                // Already in ignore list - remove it
                var index = ignoreList[window.TWAttack.state.currentWorld].indexOf(coords);
                if (index > -1) {
                    ignoreList[window.TWAttack.state.currentWorld].splice(index, 1);
                    window.TWAttack.storage.set(window.TWAttack.config.storageKeys.ignore, ignoreList);
                    
                    // Update the global state ignore list
                    window.TWAttack.state.ignoreList = ignoreList[window.TWAttack.state.currentWorld];
                    
                    this.showInfoStatus('Village ' + coords + ' removed from ignore list', 'success');
                    
                    // Re-enable the panel
                    var panel = document.getElementById('tw-attack-info-panel');
                    if (panel) {
                        panel.style.borderColor = '';
                        panel.querySelector('.tw-attack-info-title').textContent = '⚔️ TW Attack Control';
                        
                        // Re-enable all buttons
                        var buttons = panel.querySelectorAll('button');
                        buttons.forEach(function(btn) {
                            btn.disabled = false;
                            btn.style.opacity = '1';
                            btn.style.cursor = 'pointer';
                        });
                        
                        // Update the panel to reflect current state
                        setTimeout(() => {
                            this.updateInfoVillagePanel(panel, coords);
                        }, 100);
                    }
                }
            }
        },
        
        // Show info status
        showInfoStatus: function(message, type) {
            var statusMsg = document.getElementById('info-status');
            if (statusMsg) {
                statusMsg.textContent = message;
                statusMsg.style.display = 'block';
                statusMsg.className = 'tw-attack-info-status';
                
                switch(type) {
                    case 'success':
                        statusMsg.classList.add('tw-attack-status-success');
                        break;
                    case 'error':
                        statusMsg.classList.add('tw-attack-status-error');
                        break;
                    case 'info':
                        statusMsg.classList.add('tw-attack-status-info');
                        break;
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
