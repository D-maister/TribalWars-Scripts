// ===== TW Attack Script - Attack Module =====

(function() {
    'use strict';
    
    if (!window.TWAttack) return;
    
    const AttackModule = {
        configVisible: false,
        updateInterval: null,
        configSections: {},
        
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
            
            // Create Settings Section
            var settingsSection = document.createElement('div');
            settingsSection.id = 'settings-section';
            settingsSection.className = 'tw-attack-section tw-attack-section-settings';
            
            var settingsTitle = document.createElement('h4');
            settingsTitle.textContent = '⚙️ Settings';
            settingsTitle.className = 'tw-attack-section-title';
            settingsSection.appendChild(settingsTitle);
            
            this.createSettingsContent(settingsSection);
            this.configSections.settings = settingsSection;
            
            // Create Builds Section
            var buildsSection = document.createElement('div');
            buildsSection.id = 'troop-builds';
            buildsSection.className = 'tw-attack-section tw-attack-section-builds';
            
            var buildsTitle = document.createElement('h4');
            buildsTitle.textContent = '👥 Troop Builds';
            buildsTitle.className = 'tw-attack-section-title';
            buildsSection.appendChild(buildsTitle);
            
            this.createBuildsContent(buildsSection);
            this.configSections.builds = buildsSection;
            
            // Create Paste Section
            var pasteSection = document.createElement('div');
            pasteSection.id = 'paste-section';
            pasteSection.style.marginBottom = '15px';
            
            this.createPasteContent(pasteSection);
            this.configSections.paste = pasteSection;
            
            // Create Targets Container
            var targetsContainer = document.createElement('div');
            targetsContainer.id = 'targets-container';
            targetsContainer.className = 'tw-attack-targets-container';
            
            this.createTargetsContent(targetsContainer);
            this.configSections.targets = targetsContainer;
            
            // Assemble UI
            uiContainer.appendChild(title);
            uiContainer.appendChild(toggleConfigBtn);
            uiContainer.appendChild(autoAttackContainer);
            uiContainer.appendChild(infoSection);
            uiContainer.appendChild(settingsSection);
            uiContainer.appendChild(buildsSection);
            uiContainer.appendChild(pasteSection);
            uiContainer.appendChild(targetsContainer);
            
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
            
            // Update targets list
            this.updateTargetsListUI();
            this.startAutoUpdate();
            
            // Initially hide config sections
            this.toggleConfigVisibility();
        },
        
        // Create Settings Content
        createSettingsContent: function(container) {
            var settings = window.TWAttack.state.settings;
            
            var settingsContainer = document.createElement('div');
            settingsContainer.id = 'settings-content';
            
            // Include Players Setting
            var includePlayersRow = document.createElement('div');
            includePlayersRow.className = 'tw-attack-setting-row';
            
            var includePlayersLabel = document.createElement('label');
            includePlayersLabel.textContent = 'Include players villages: ';
            includePlayersLabel.className = 'tw-attack-setting-label';
            
            var includePlayersCheckbox = document.createElement('input');
            includePlayersCheckbox.type = 'checkbox';
            includePlayersCheckbox.checked = settings.includePlayers;
            includePlayersCheckbox.style.cssText = `transform: scale(1.2); margin-right: 8px;`;
            
            includePlayersRow.appendChild(includePlayersLabel);
            includePlayersRow.appendChild(includePlayersCheckbox);
            
            // Max Points Setting
            var maxPointsRow = document.createElement('div');
            maxPointsRow.className = 'tw-attack-setting-row';
            
            var maxPointsLabel = document.createElement('label');
            maxPointsLabel.textContent = 'Max player points: ';
            maxPointsLabel.className = 'tw-attack-setting-label';
            
            var maxPointsInput = document.createElement('input');
            maxPointsInput.type = 'number';
            maxPointsInput.min = '1';
            maxPointsInput.value = settings.maxPlayerPoints;
            maxPointsInput.className = 'tw-attack-input';
            maxPointsInput.style.width = '70px';
            
            maxPointsRow.appendChild(maxPointsLabel);
            maxPointsRow.appendChild(maxPointsInput);
            
            // Include Bonus Setting
            var includeBonusRow = document.createElement('div');
            includeBonusRow.className = 'tw-attack-setting-row';
            
            var includeBonusLabel = document.createElement('label');
            includeBonusLabel.textContent = 'Include bonus villages: ';
            includeBonusLabel.className = 'tw-attack-setting-label';
            
            var includeBonusCheckbox = document.createElement('input');
            includeBonusCheckbox.type = 'checkbox';
            includeBonusCheckbox.checked = settings.includeBonusVillages;
            includeBonusCheckbox.style.cssText = `transform: scale(1.2); margin-right: 8px;`;
            
            includeBonusRow.appendChild(includeBonusLabel);
            includeBonusRow.appendChild(includeBonusCheckbox);
            
            // Auto-Attack Enabled Setting
            var autoAttackEnabledRow = document.createElement('div');
            autoAttackEnabledRow.className = 'tw-attack-setting-row';
            
            var autoAttackEnabledLabel = document.createElement('label');
            autoAttackEnabledLabel.textContent = 'Enable auto-attack: ';
            autoAttackEnabledLabel.className = 'tw-attack-setting-label';
            
            var autoAttackEnabledCheckbox = document.createElement('input');
            autoAttackEnabledCheckbox.type = 'checkbox';
            autoAttackEnabledCheckbox.checked = settings.autoAttackEnabled;
            autoAttackEnabledCheckbox.style.cssText = `transform: scale(1.2); margin-right: 8px;`;
            
            autoAttackEnabledRow.appendChild(autoAttackEnabledLabel);
            autoAttackEnabledRow.appendChild(autoAttackEnabledCheckbox);
            
            // Auto-Attack Builds
            var autoAttackBuildsRow = document.createElement('div');
            autoAttackBuildsRow.className = 'tw-attack-setting-row';
            
            var autoAttackBuildsLabel = document.createElement('label');
            autoAttackBuildsLabel.textContent = 'Auto-attack builds: ';
            autoAttackBuildsLabel.className = 'tw-attack-setting-label';
            
            var buildsContainer = document.createElement('div');
            buildsContainer.style.cssText = 'display: flex; gap: 8px;';
            
            ['A', 'B', 'C'].forEach(function(buildKey) {
                var buildCheckbox = document.createElement('input');
                buildCheckbox.type = 'checkbox';
                buildCheckbox.id = 'auto-attack-build-' + buildKey;
                buildCheckbox.checked = settings.autoAttackBuilds[buildKey] !== false;
                buildCheckbox.style.cssText = 'transform: scale(1.1);';
                
                var buildLabel = document.createElement('label');
                buildLabel.htmlFor = 'auto-attack-build-' + buildKey;
                buildLabel.textContent = buildKey;
                buildLabel.style.cssText = 'font-size: 11px; margin-right: 4px;';
                
                buildsContainer.appendChild(buildCheckbox);
                buildsContainer.appendChild(buildLabel);
            });
            
            autoAttackBuildsRow.appendChild(autoAttackBuildsLabel);
            autoAttackBuildsRow.appendChild(buildsContainer);
            
            // Save Button
            var saveBtn = document.createElement('button');
            saveBtn.textContent = '💾 Save Settings';
            saveBtn.className = 'tw-attack-save-btn';
            
            saveBtn.onclick = function() {
                settings.includePlayers = includePlayersCheckbox.checked;
                settings.maxPlayerPoints = parseInt(maxPointsInput.value) || 1000;
                settings.includeBonusVillages = includeBonusCheckbox.checked;
                settings.autoAttackEnabled = autoAttackEnabledCheckbox.checked;
                
                // Get auto-attack builds
                ['A', 'B', 'C'].forEach(function(buildKey) {
                    var checkbox = document.getElementById('auto-attack-build-' + buildKey);
                    if (checkbox) {
                        settings.autoAttackBuilds[buildKey] = checkbox.checked;
                    }
                });
                
                window.TWAttack.saveState();
                window.TWAttack.utils.showStatus('Settings saved for ' + window.TWAttack.state.currentWorld, 'success');
            };
            
            settingsContainer.appendChild(includePlayersRow);
            settingsContainer.appendChild(maxPointsRow);
            settingsContainer.appendChild(includeBonusRow);
            settingsContainer.appendChild(autoAttackEnabledRow);
            settingsContainer.appendChild(autoAttackBuildsRow);
            settingsContainer.appendChild(saveBtn);
            
            container.appendChild(settingsContainer);
        },
        
        // Create Builds Content
        createBuildsContent: function(container) {
            var buildsContainer = document.createElement('div');
            buildsContainer.id = 'builds-content';
            
            ['A', 'B', 'C'].forEach(function(buildKey) {
                var build = window.TWAttack.state.troopBuilds[buildKey] || 
                    { spear: 0, sword: 0, axe: 0, spy: 0, light: 2, heavy: 0, ram: 0, catapult: 0, knight: 0, cooldown: 30, enabled: buildKey === 'A' };
                
                var buildContainer = document.createElement('div');
                buildContainer.className = 'tw-attack-build-container';
                
                var buildHeader = document.createElement('div');
                buildHeader.className = 'tw-attack-build-header';
                var borderColor = buildKey === 'A' ? '#4CAF50' : buildKey === 'B' ? '#2196F3' : '#9C27B0';
                buildHeader.style.borderBottomColor = borderColor;
                
                var buildTitleContainer = document.createElement('div');
                buildTitleContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';
                
                var enabledCheckbox = document.createElement('input');
                enabledCheckbox.type = 'checkbox';
                enabledCheckbox.checked = build.enabled !== false;
                enabledCheckbox.style.transform = 'scale(1.1)';
                enabledCheckbox.dataset.build = buildKey;
                
                enabledCheckbox.onchange = function() {
                    if (!window.TWAttack.state.troopBuilds[buildKey]) {
                        window.TWAttack.state.troopBuilds[buildKey] = JSON.parse(JSON.stringify({
                            spear: 0, sword: 0, axe: 0, spy: 0, light: 2, heavy: 0, ram: 0, catapult: 0, knight: 0,
                            cooldown: 30, enabled: true
                        }));
                    }
                    window.TWAttack.state.troopBuilds[buildKey].enabled = this.checked;
                };
                
                var buildTitle = document.createElement('div');
                buildTitle.className = 'tw-attack-build-title';
                if (buildKey === 'B') buildTitle.classList.add('tw-attack-build-title-b');
                if (buildKey === 'C') buildTitle.classList.add('tw-attack-build-title-c');
                buildTitle.textContent = 'Build ' + buildKey;
                buildTitle.style.fontSize = '13px';
                
                var cooldownContainer = document.createElement('div');
                cooldownContainer.style.cssText = 'display: flex; align-items: center; gap: 4px; margin-left: 8px;';
                
                var cooldownLabel = document.createElement('span');
                cooldownLabel.textContent = 'CD:';
                cooldownLabel.style.fontSize = '10px';
                cooldownLabel.style.color = '#666';
                
                var cooldownInput = document.createElement('input');
                cooldownInput.type = 'number';
                cooldownInput.min = '1';
                cooldownInput.max = '1440';
                cooldownInput.value = build.cooldown || 30;
                cooldownInput.style.cssText = 'width: 45px; padding: 2px; font-size: 11px;';
                cooldownInput.dataset.build = buildKey;
                
                cooldownInput.onchange = function() {
                    if (!window.TWAttack.state.troopBuilds[buildKey]) {
                        window.TWAttack.state.troopBuilds[buildKey] = JSON.parse(JSON.stringify({
                            spear: 0, sword: 0, axe: 0, spy: 0, light: 2, heavy: 0, ram: 0, catapult: 0, knight: 0,
                            cooldown: 30, enabled: true
                        }));
                    }
                    window.TWAttack.state.troopBuilds[buildKey].cooldown = parseInt(this.value) || 30;
                };
                
                cooldownContainer.appendChild(cooldownLabel);
                cooldownContainer.appendChild(cooldownInput);
                
                buildTitleContainer.appendChild(enabledCheckbox);
                buildTitleContainer.appendChild(buildTitle);
                buildTitleContainer.appendChild(cooldownContainer);
                
                var saveBtn = document.createElement('button');
                saveBtn.textContent = '💾';
                saveBtn.className = 'tw-attack-build-save-btn';
                if (buildKey === 'B') saveBtn.classList.add('tw-attack-build-save-btn-b');
                if (buildKey === 'C') saveBtn.classList.add('tw-attack-build-save-btn-c');
                saveBtn.style.padding = '4px 6px';
                saveBtn.style.fontSize = '10px';
                
                saveBtn.onclick = function() {
                    AttackModule.saveBuild(buildKey);
                };
                
                buildHeader.appendChild(buildTitleContainer);
                buildHeader.appendChild(saveBtn);
                
                var troopsContainer = document.createElement('div');
                troopsContainer.className = 'tw-attack-troops-grid';
                
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
                    troopInput.className = 'tw-attack-troop-input';
                    
                    var label = document.createElement('label');
                    label.textContent = troop.abbr;
                    label.title = troop.name;
                    label.className = 'tw-attack-troop-label';
                    
                    var input = document.createElement('input');
                    input.type = 'number';
                    input.min = '0';
                    input.value = build[troop.key] || 0;
                    input.dataset.build = buildKey;
                    input.dataset.troop = troop.key;
                    input.className = 'tw-attack-troop-field';
                    
                    input.onchange = function() {
                        var value = parseInt(this.value) || 0;
                        if (!window.TWAttack.state.troopBuilds[buildKey]) {
                            window.TWAttack.state.troopBuilds[buildKey] = JSON.parse(JSON.stringify({
                                spear: 0, sword: 0, axe: 0, spy: 0, light: 2, heavy: 0, ram: 0, catapult: 0, knight: 0,
                                cooldown: 30, enabled: true
                            }));
                        }
                        window.TWAttack.state.troopBuilds[buildKey][troop.key] = value;
                    };
                    
                    troopInput.appendChild(label);
                    troopInput.appendChild(input);
                    troopsContainer.appendChild(troopInput);
                });
                
                buildContainer.appendChild(buildHeader);
                buildContainer.appendChild(troopsContainer);
                buildsContainer.appendChild(buildContainer);
            });
            
            container.appendChild(buildsContainer);
        },
        
        // Create Paste Content
        createPasteContent: function(container) {
            var pasteLabel = document.createElement('label');
            pasteLabel.textContent = '📋 Paste village.txt content:';
            pasteLabel.style.display = 'block';
            pasteLabel.style.marginBottom = '8px';
            pasteLabel.style.fontWeight = 'bold';
            pasteLabel.style.fontSize = '12px';
            
            var pasteTextarea = document.createElement('textarea');
            pasteTextarea.id = 'village-textarea';
            pasteTextarea.className = 'tw-attack-textarea';
            pasteTextarea.placeholder = 'Paste the content from village.txt here...';
            
            var distanceContainer = document.createElement('div');
            distanceContainer.style.cssText = `margin-bottom: 12px; display: flex; align-items: center;`;
            
            var distanceLabel = document.createElement('label');
            distanceLabel.textContent = 'Max Distance: ';
            distanceLabel.style.marginRight = '8px';
            distanceLabel.style.fontWeight = 'bold';
            distanceLabel.style.fontSize = '12px';
            
            var distanceInput = document.createElement('input');
            distanceInput.type = 'number';
            distanceInput.value = '50';
            distanceInput.min = '1';
            distanceInput.className = 'tw-attack-input';
            distanceInput.style.width = '70px';
            distanceInput.style.marginRight = '12px';
            
            distanceContainer.appendChild(distanceLabel);
            distanceContainer.appendChild(distanceInput);
            
            var parseBtn = document.createElement('button');
            parseBtn.textContent = '🔍 Parse villages.txt';
            parseBtn.className = 'tw-attack-parse-btn';
            
            parseBtn.onclick = function() {
                var text = pasteTextarea.value.trim();
                if (!text) {
                    window.TWAttack.utils.showStatus('Please paste village.txt content first', 'error');
                    return;
                }
                
                var maxDistance = distanceInput.value;
                window.TWAttack.utils.parseVillageText(text, maxDistance);
            };
            
            container.appendChild(pasteLabel);
            container.appendChild(pasteTextarea);
            container.appendChild(distanceContainer);
            container.appendChild(parseBtn);
        },
        
        // Create Targets Content
        createTargetsContent: function(container) {
            var targetsTitle = document.createElement('h4');
            targetsTitle.textContent = '🎯 Targets for ' + window.TWAttack.state.currentWorld + ':';
            targetsTitle.style.marginBottom = '12px';
            targetsTitle.style.color = '#333';
            targetsTitle.style.fontSize = '14px';
            
            var targetsList = document.createElement('div');
            targetsList.id = 'targets-list';
            
            var clearBtn = document.createElement('button');
            clearBtn.textContent = '🗑️ Clear All Targets for ' + window.TWAttack.state.currentWorld;
            clearBtn.className = 'tw-attack-clear-btn';
            clearBtn.onclick = function() {
                if (confirm('Clear all targets for ' + window.TWAttack.state.currentWorld + '?')) {
                    window.TWAttack.targets.clear();
                    AttackModule.updateTargetsListUI();
                    window.TWAttack.utils.showStatus('All targets cleared for ' + window.TWAttack.state.currentWorld, 'success');
                }
            };
            
            this.configSections.clearBtn = clearBtn;
            
            container.appendChild(targetsTitle);
            container.appendChild(targetsList);
            container.appendChild(clearBtn);
        },
        
        // Toggle config visibility
        toggleConfigVisibility: function() {
            // Toggle all sections with class .tw-attack-section
            var sections = document.querySelectorAll('.tw-attack-section');
            var isVisible = sections.length > 0 && sections[0].style.display !== 'none';
            
            for (var i = 0; i < sections.length; i++) {
                sections[i].style.display = isVisible ? 'none' : 'block';
            }
            
            // Toggle paste section
            var pasteSection = document.querySelector('#paste-section');
            if (pasteSection) {
                pasteSection.style.display = isVisible ? 'none' : 'block';
            }
            
            // Toggle clear button
            var clearBtn = document.querySelector('.tw-attack-clear-btn');
            if (clearBtn) {
                clearBtn.style.display = isVisible ? 'none' : 'block';
            }
            
            // Update button text
            var toggleBtn = document.querySelector('.tw-attack-toggle-btn');
            if (toggleBtn) {
                toggleBtn.textContent = isVisible ? '▼ Show Config' : '▲ Hide Config';
            }
            
            this.configVisible = !isVisible;
        },
        
        // Save build
        saveBuild: function(buildKey) {
            window.TWAttack.saveState();
            window.TWAttack.utils.showStatus('Build ' + buildKey + ' saved', 'success');
        },
        
        // Update targets list UI
        updateTargetsListUI: function() {
            var targetsList = document.getElementById('targets-list');
            if (!targetsList) return;
            
            targetsList.innerHTML = '';
            var targets = window.TWAttack.targets.getCurrent();
            
            if (targets.length === 0) {
                targetsList.innerHTML = '<div style="color: #999; font-style: italic; padding: 15px; text-align: center; background: #f8f9fa; border-radius: 6px; border: 1px dashed #ddd; font-size: 12px;">No targets in list for ' + window.TWAttack.state.currentWorld + '</div>';
                return;
            }
            
            targets.forEach(function(target, index) {
                var targetItem = document.createElement('div');
                targetItem.className = 'tw-attack-target-item';
                
                var targetInfo = document.createElement('div');
                targetInfo.className = 'tw-attack-target-info';
                
                var villageInfoContainer = document.createElement('div');
                villageInfoContainer.style.cssText = 'display: flex; flex-direction: column; min-width: 150px; flex: 1;';
                
                // First line: Coordinates, name, and tags
                var firstLine = document.createElement('div');
                firstLine.style.cssText = 'display: flex; align-items: center; gap: 6px; margin-bottom: 3px; flex-wrap: wrap;';
                
                var targetCoords = document.createElement('div');
                targetCoords.className = 'tw-attack-target-coords';
                targetCoords.textContent = target;
                targetCoords.style.minWidth = '60px';
                
                // Try to get village data from storage
                var villageData = { name: "Unknown Village", points: 0, playerNumber: 0, isBonus: false };
                var allVillageData = window.TWAttack.storage.get(window.TWAttack.config.storageKeys.villageData);
                if (allVillageData && allVillageData[window.TWAttack.state.currentWorld] && allVillageData[window.TWAttack.state.currentWorld][target]) {
                    villageData = allVillageData[window.TWAttack.state.currentWorld][target];
                }
                
                var villageName = document.createElement('span');
                villageName.style.cssText = 'font-size: 11px; font-weight: bold; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;';
                
                // Truncate long names
                var displayName = villageData.name;
                if (displayName.length > 15) {
                    displayName = displayName.substring(0, 15) + '...';
                }
                villageName.textContent = displayName;
                villageName.title = villageData.name; // Show full name on hover
                
                // Create village type tag
                var villageTag = document.createElement('span');
                villageTag.className = 'tw-attack-village-tag';
                
                if (villageData.isBonus) {
                    villageTag.classList.add('tw-attack-village-tag-bonus');
                    villageTag.textContent = 'Bonus';
                    villageTag.title = 'Bonus Village';
                } else if (villageData.playerNumber > 0) {
                    villageTag.classList.add('tw-attack-village-tag-player');
                    villageTag.textContent = 'Player';
                    villageTag.title = 'Player Village - ' + villageData.points + ' points';
                } else {
                    villageTag.classList.add('tw-attack-village-tag-barbarian');
                    villageTag.textContent = 'Barbarian';
                    villageTag.title = 'Barbarian Village';
                }
                
                // Points badge for player villages
                var pointsBadge = null;
                if (villageData.playerNumber > 0 && villageData.points > 0) {
                    pointsBadge = document.createElement('span');
                    pointsBadge.className = 'tw-attack-points-badge';
                    pointsBadge.textContent = villageData.points + ' pts';
                    pointsBadge.title = 'Village points: ' + villageData.points;
                }
                
                firstLine.appendChild(targetCoords);
                firstLine.appendChild(villageName);
                firstLine.appendChild(villageTag);
                if (pointsBadge) firstLine.appendChild(pointsBadge);
                
                // Second line: Distance, cooldown, and last attack
                var secondLine = document.createElement('div');
                secondLine.className = 'tw-attack-target-details';
                secondLine.style.cssText = 'display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 10px; color: #666;';
                
                var distance = window.TWAttack.utils.calculateDistance(window.TWAttack.state.homeCoords, target);
                var distanceSpan = document.createElement('span');
                distanceSpan.innerHTML = `<strong>Distance:</strong> ${distance.toFixed(2)}`;
                
                secondLine.appendChild(distanceSpan);
                
                // Get cooldown info for each build
                var hasCooldown = false;
                var allCooldownMinutes = [];
                
                ['A', 'B', 'C'].forEach(function(buildKey) {
                    if (window.TWAttack.builds.get(target, buildKey) && window.TWAttack.state.settings.autoAttackBuilds[buildKey]) {
                        var buildCooldown = window.TWAttack.utils.getBuildCooldownInfo(target, buildKey);
                        if (buildCooldown.onCooldown) {
                            hasCooldown = true;
                            allCooldownMinutes.push(buildKey + ':' + buildCooldown.minutesLeft + 'm');
                        }
                    }
                });
                
                if (hasCooldown) {
                    var cooldownSpan = document.createElement('span');
                    cooldownSpan.innerHTML = `<strong style="color: #ff6b6b;">⏳ ${allCooldownMinutes.join(', ')}</strong>`;
                    cooldownSpan.title = 'Build cooldowns: ' + allCooldownMinutes.join(', ');
                    secondLine.appendChild(cooldownSpan);
                } else {
                    var readySpan = document.createElement('span');
                    readySpan.innerHTML = `<strong style="color: #4CAF50;">✅</strong>`;
                    readySpan.title = 'All builds ready';
                    secondLine.appendChild(readySpan);
                }
                
                // Get last attack time
                var buildCooldowns = window.TWAttack.storage.get(window.TWAttack.config.storageKeys.buildCooldowns);
                var lastAttack = null;
                var lastBuild = null;
                
                if (buildCooldowns && buildCooldowns[window.TWAttack.state.currentWorld] && 
                    buildCooldowns[window.TWAttack.state.currentWorld][target]) {
                    var targetCooldowns = buildCooldowns[window.TWAttack.state.currentWorld][target];
                    for (var buildKey in targetCooldowns) {
                        var attackTime = targetCooldowns[buildKey];
                        if (!lastAttack || attackTime > lastAttack) {
                            lastAttack = attackTime;
                            lastBuild = buildKey;
                        }
                    }
                }
                
                if (lastAttack) {
                    var lastAttackSpan = document.createElement('span');
                    var timeSince = window.TWAttack.utils.formatTimeSince(new Date(lastAttack));
                    lastAttackSpan.textContent = 'Last: ' + timeSince;
                    if (lastBuild) lastAttackSpan.textContent += ' (' + lastBuild + ')';
                    lastAttackSpan.title = 'Last attack: ' + new Date(lastAttack).toLocaleString();
                    secondLine.appendChild(lastAttackSpan);
                }
                
                villageInfoContainer.appendChild(firstLine);
                villageInfoContainer.appendChild(secondLine);
                targetInfo.appendChild(villageInfoContainer);
                
                var actionButtons = document.createElement('div');
                actionButtons.className = 'tw-attack-action-buttons';
                
                ['A', 'B', 'C'].forEach(function(buildKey) {
                    var isEnabled = window.TWAttack.builds.get(target, buildKey);
                    var btn = document.createElement('button');
                    btn.textContent = buildKey;
                    btn.className = 'tw-attack-action-btn tw-attack-action-btn-checkbox';
                    if (isEnabled) btn.classList.add('checked');
                    if (buildKey === 'B') btn.classList.add('b');
                    if (buildKey === 'C') btn.classList.add('c');
                    
                    // Add cooldown indicator
                    var buildCooldown = window.TWAttack.utils.getBuildCooldownInfo(target, buildKey);
                    var cooldownIndicator = document.createElement('span');
                    cooldownIndicator.className = 'tw-attack-build-cooldown-indicator';
                    
                    if (buildCooldown.onCooldown) {
                        cooldownIndicator.classList.add('tw-attack-build-cooldown-cooldown');
                        cooldownIndicator.textContent = buildCooldown.minutesLeft + 'm';
                        btn.title = 'Build ' + buildKey + ' on cooldown: ' + buildCooldown.minutesLeft + ' minutes remaining (CD: ' + buildCooldown.cooldown + 'm)';
                    } else {
                        cooldownIndicator.classList.add('tw-attack-build-cooldown-ready');
                        cooldownIndicator.textContent = '✓';
                        btn.title = 'Build ' + buildKey + ' ready (CD: ' + buildCooldown.cooldown + 'm)';
                    }
                    
                    btn.appendChild(cooldownIndicator);
                    
                    btn.onclick = (function(buildKey, targetCoords) {
                        return function(e) {
                            e.stopPropagation();
                            var newState = !window.TWAttack.builds.get(targetCoords, buildKey);
                            window.TWAttack.builds.set(targetCoords, buildKey, newState);
                            AttackModule.updateTargetsListUI();
                        };
                    })(buildKey, target);
                    
                    actionButtons.appendChild(btn);
                });
                
                var attackBtn = document.createElement('button');
                attackBtn.textContent = '⚔️';
                attackBtn.title = 'Attack with first available build';
                attackBtn.className = 'tw-attack-attack-btn';
                
                // Check if any build is ready
                var anyBuildReady = false;
                ['A', 'B', 'C'].forEach(function(buildKey) {
                    if (window.TWAttack.builds.get(target, buildKey) && window.TWAttack.state.settings.autoAttackBuilds[buildKey]) {
                        var buildCooldown = window.TWAttack.utils.getBuildCooldownInfo(target, buildKey);
                        if (!buildCooldown.onCooldown) {
                            anyBuildReady = true;
                        }
                    }
                });
                
                if (!anyBuildReady) {
                    attackBtn.disabled = true;
                    attackBtn.style.opacity = '0.5';
                    attackBtn.style.cursor = 'not-allowed';
                    attackBtn.title = 'All builds for this target are on cooldown';
                } else {
                    attackBtn.onclick = (function(targetToAttack) {
                        return function() { AttackModule.attackTargetWithAvailableBuild(targetToAttack); };
                    })(target);
                }
                
                // Add IGNORE button
                var ignoreBtn = document.createElement('button');
                ignoreBtn.textContent = '👁️';
                ignoreBtn.title = 'Add to ignore list';
                ignoreBtn.className = 'tw-attack-ignore-btn';
                ignoreBtn.onclick = (function(targetCoords, villageData) {
                    return function() {
                        // Load ignore list
                        var ignoreList = window.TWAttack.storage.get(window.TWAttack.config.storageKeys.ignore) || {};
                        if (!ignoreList[window.TWAttack.state.currentWorld]) {
                            ignoreList[window.TWAttack.state.currentWorld] = [];
                        }
                        
                        // Add to ignore list
                        if (ignoreList[window.TWAttack.state.currentWorld].indexOf(targetCoords) === -1) {
                            ignoreList[window.TWAttack.state.currentWorld].push(targetCoords);
                            window.TWAttack.storage.set(window.TWAttack.config.storageKeys.ignore, ignoreList);
                            
                            // Remove from target list
                            window.TWAttack.targets.remove(targetCoords);
                            
                            // Show success message
                            var villageType = villageData.isBonus ? 'Bonus village' : 
                                            villageData.playerNumber > 0 ? 'Player village' : 'Barbarian village';
                            window.TWAttack.utils.showStatus(villageType + ' ' + targetCoords + ' added to ignore list', 'success');
                            
                            // Update UI
                            AttackModule.updateTargetsListUI();
                        }
                    };
                })(target, villageData);
                
                var removeBtn = document.createElement('button');
                removeBtn.textContent = '✕';
                removeBtn.title = 'Remove target';
                removeBtn.className = 'tw-attack-remove-btn';
                removeBtn.onclick = (function(targetToRemove, villageData) {
                    return function() {
                        if (window.TWAttack.targets.remove(targetToRemove)) {
                            var villageType = villageData.isBonus ? 'Bonus village' : 
                                            villageData.playerNumber > 0 ? 'Player village' : 'Barbarian village';
                            window.TWAttack.utils.showStatus(villageType + ' ' + targetToRemove + ' removed from target list', 'success');
                            AttackModule.updateTargetsListUI();
                        }
                    };
                })(target, villageData);
                
                targetItem.appendChild(targetInfo);
                targetItem.appendChild(actionButtons);
                targetItem.appendChild(attackBtn);
                targetItem.appendChild(ignoreBtn);
                targetItem.appendChild(removeBtn);
                targetsList.appendChild(targetItem);
            });
        },
        
        // Start auto-update
        startAutoUpdate: function() {
            if (this.updateInterval) clearInterval(this.updateInterval);
            this.updateInterval = setInterval(function() {
                AttackModule.updateTargetsListUI();
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
