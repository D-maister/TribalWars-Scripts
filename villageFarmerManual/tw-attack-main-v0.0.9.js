// ===== TW Attack Script - Main Loader =====
// Loads and manages all other script modules

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        version: '2.0.0',
        scripts: {
            styles: 'tw-attack-styles-v0.0.1.js',
            attack: 'tw-attack-attack-v0.0.6.js',
            submit: 'tw-attack-submit-v0.0.1.js',
            village: 'tw-attack-village-v0.0.6.js',
            utils: 'tw-attack-utils-v0.0.1.js'
        },
        storageKeys: {
            targets: 'twAttackTargets',
            builds: 'twAttackBuilds',
            settings: 'twAttackSettings',
            ignore: 'twAttackIgnoreList',
            villageData: 'twAttackVillageData',
            targetBuilds: 'twAttackTargetBuilds',
            buildCooldowns: 'twAttackBuildCooldowns',
            submitMarker: 'twAttackSubmitMarker'
        },
        defaultCooldown: 30
    };
    
    // Global state
    window.TWAttack = {
        config: CONFIG,
        state: {
            currentWorld: '',
            homeCoords: '',
            targetList: '',
            settings: {},
            troopBuilds: {},
            targetBuilds: {},
            ignoreList: [],
            isInitialized: false,
            isAttacking: false,
            submitScriptExecuted: false
        },
        
        // Storage functions
        storage: {
            get: function(key) {
                try {
                    return JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    console.error('Storage get error:', e);
                    return null;
                }
            },
            
            set: function(key, value) {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (e) {
                    console.error('Storage set error:', e);
                    return false;
                }
            },
            
            remove: function(key) {
                localStorage.removeItem(key);
            }
        },
        
        // Cookie functions
        cookies: {
            get: function(name) {
                var match = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
                return match ? decodeURIComponent(match[2]) : null;
            },
            
            set: function(name, value, days) {
                var date = new Date();
                date.setTime(date.getTime() + (86400000 * days));
                document.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + date.toUTCString() + ";path=/";
            }
        },
        
        // Utility functions
        utils: {
            getWorldName: function() {
                var url = window.location.href;
                // Match both voynaplemyon.com and tribalwars.net
                var match = url.match(/https?:\/\/([^\/]+?)\.(?:voynaplemyon\.com|tribalwars\.net)/);
                return match ? match[1] : "unknown";
            },
            
            getCurrentVillageCoords: function() {
                if (window.TWAttack.state.homeCoords) {
                    return window.TWAttack.state.homeCoords;
                }
                
                var title = document.querySelector('head > title');
                if (title) {
                    var match = title.textContent.match(/\((\d+)\|(\d+)\)/);
                    if (match) {
                        window.TWAttack.state.homeCoords = match[1] + "|" + match[2];
                        return window.TWAttack.state.homeCoords;
                    }
                }
                return "";
            },
            
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
        },
        
        // Page detection
        pages: {
            isInfoVillage: function() {
                return window.location.href.includes('&screen=info_village');
            },
            
            isAttackPage: function() {
                var url = window.location.href;
                var isScreenPlace = url.endsWith('screen=place');
                var hasVillageId = url.includes('screen=place&village=');
                var hasModeCommand = url.includes('mode=command');
                var hasModeSim = url.includes('mode=sim');
                var hasModeOther = url.match(/mode=[^&]+/) && !hasModeCommand;
                var hasTryConfirm = url.includes('try=confirm');
                
                if (isScreenPlace || hasVillageId) {
                    if (hasModeCommand) {
                        return true;
                    } else if (!hasModeSim && !hasModeOther && !hasTryConfirm) {
                        return true;
                    }
                }
                return false;
            },
            
            isSubmitPage: function() {
                return window.location.href.includes('&screen=place&try=confirm');
            },
            
            shouldShowConfigUI: function() {
                return this.isInfoVillage() || this.isAttackPage() || this.isSubmitPage();
            }
        },
        
        // Module loader
        loader: {
            loadScript: function(src) {
                return new Promise(function(resolve, reject) {
                    var script = document.createElement('script');
                    script.src = src;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            },
            
            loadModule: function(moduleName) {
                var scriptSrc = CONFIG.scripts[moduleName];
                if (!scriptSrc) {
                    console.error('Unknown module:', moduleName);
                    return Promise.reject('Unknown module');
                }
                
                return this.loadScript(scriptSrc).catch(function(error) {
                    console.error('Failed to load module', moduleName, ':', error);
                });
            },
            
            loadAll: function() {
                var modules = ['styles', 'utils', 'attack', 'submit', 'village'];
                var promises = modules.map(function(module) {
                    return window.TWAttack.loader.loadModule(module);
                });
                
                return Promise.allSettled(promises).then(function() {
                    console.log('TW Attack: All modules loaded');
                    window.TWAttack.initialize();
                });
            }
        },
        
        // Initialization
        initialize: function() {
            if (window.TWAttack.state.isInitialized) return;
            
            // Load state
            window.TWAttack.state.currentWorld = window.TWAttack.utils.getWorldName();
            window.TWAttack.state.homeCoords = window.TWAttack.utils.getCurrentVillageCoords();
            
            // Load from storage
            this.loadState();
            
            // Initialize based on page type
            if (window.TWAttack.pages.isInfoVillage()) {
                if (window.TWAttack.modules && window.TWAttack.modules.village) {
                    window.TWAttack.modules.village.initialize();
                }
            } else if (window.TWAttack.pages.isAttackPage()) {
                if (window.TWAttack.modules && window.TWAttack.modules.attack) {
                    window.TWAttack.modules.attack.initialize();
                }
            } else if (window.TWAttack.pages.isSubmitPage()) {
                if (window.TWAttack.modules && window.TWAttack.modules.submit) {
                    window.TWAttack.modules.submit.initialize();
                }
            }
            // No else block - don't show config on other pages
            
            window.TWAttack.state.isInitialized = true;
            console.log('TW Attack initialized for world:', window.TWAttack.state.currentWorld);
        },
        
        // Load state from storage
        loadState: function() {
            var world = window.TWAttack.state.currentWorld;
            
            // Load targets
            var allTargets = this.storage.get(CONFIG.storageKeys.targets);
            window.TWAttack.state.targetList = (allTargets && allTargets[world]) ? allTargets[world] : "";
            
            // Load builds
            var allBuilds = this.storage.get(CONFIG.storageKeys.builds);
            if (allBuilds && allBuilds[world]) {
                window.TWAttack.state.troopBuilds = allBuilds[world];
            } else {
                // Default builds
                window.TWAttack.state.troopBuilds = {
                    "A": { spear: 0, sword: 0, axe: 0, spy: 0, light: 2, heavy: 0, ram: 0, catapult: 0, knight: 0, cooldown: CONFIG.defaultCooldown, enabled: true },
                    "B": { spear: 0, sword: 0, axe: 0, spy: 0, light: 0, heavy: 0, ram: 0, catapult: 0, knight: 0, cooldown: CONFIG.defaultCooldown, enabled: false },
                    "C": { spear: 0, sword: 0, axe: 0, spy: 0, light: 0, heavy: 0, ram: 0, catapult: 0, knight: 0, cooldown: CONFIG.defaultCooldown, enabled: false }
                };
            }
            
            // Load settings
            var allSettings = this.storage.get(CONFIG.storageKeys.settings);
            if (allSettings && allSettings[world]) {
                window.TWAttack.state.settings = allSettings[world];
            } else {
                window.TWAttack.state.settings = {
                    autoAttack: true,
                    includePlayers: false,
                    maxPlayerPoints: 1000,
                    autoAttackEnabled: false,
                    includeBonusVillages: true,
                    autoAttackBuilds: { A: true, B: false, C: false }
                };
            }
            
            // Load target builds
            var allTargetBuilds = this.storage.get(CONFIG.storageKeys.targetBuilds);
            window.TWAttack.state.targetBuilds = (allTargetBuilds && allTargetBuilds[world]) ? allTargetBuilds[world] : {};
            
            // Load ignore list
            var allIgnore = this.storage.get(CONFIG.storageKeys.ignore);
            window.TWAttack.state.ignoreList = (allIgnore && allIgnore[world]) ? allIgnore[world] : [];
            
            console.log('TW Attack: State loaded for', world);
        },
        
        // Save state to storage
        saveState: function() {
            var world = window.TWAttack.state.currentWorld;
            
            // Save targets
            var allTargets = this.storage.get(CONFIG.storageKeys.targets) || {};
            allTargets[world] = window.TWAttack.state.targetList;
            this.storage.set(CONFIG.storageKeys.targets, allTargets);
            
            // Save builds
            var allBuilds = this.storage.get(CONFIG.storageKeys.builds) || {};
            allBuilds[world] = window.TWAttack.state.troopBuilds;
            this.storage.set(CONFIG.storageKeys.builds, allBuilds);
            
            // Save settings
            var allSettings = this.storage.get(CONFIG.storageKeys.settings) || {};
            allSettings[world] = window.TWAttack.state.settings;
            this.storage.set(CONFIG.storageKeys.settings, allSettings);
            
            // Save target builds
            var allTargetBuilds = this.storage.get(CONFIG.storageKeys.targetBuilds) || {};
            allTargetBuilds[world] = window.TWAttack.state.targetBuilds;
            this.storage.set(CONFIG.storageKeys.targetBuilds, allTargetBuilds);
            
            // Save ignore list
            var allIgnore = this.storage.get(CONFIG.storageKeys.ignore) || {};
            allIgnore[world] = window.TWAttack.state.ignoreList;
            this.storage.set(CONFIG.storageKeys.ignore, allIgnore);
            
            console.log('TW Attack: State saved for', world);
        },
        
        // Target list management
        targets: {
            getCurrent: function() {
                if (!window.TWAttack.state.targetList) return [];
                return window.TWAttack.state.targetList.split(' ').filter(Boolean);
            },
            
            add: function(target, villageData) {
                var targets = this.getCurrent();
                if (targets.indexOf(target) === -1) {
                    targets.push(target);
                    window.TWAttack.state.targetList = targets.join(' ');
                    
                    // Initialize target builds if not exists
                    if (!window.TWAttack.state.targetBuilds[target]) {
                        window.TWAttack.state.targetBuilds[target] = { A: true, B: true, C: true };
                    }
                    
                    // Save village data if provided
                    if (villageData) {
                        var allVillageData = window.TWAttack.storage.get(CONFIG.storageKeys.villageData) || {};
                        var world = window.TWAttack.state.currentWorld;
                        if (!allVillageData[world]) {
                            allVillageData[world] = {};
                        }
                        allVillageData[world][target] = villageData;
                        window.TWAttack.storage.set(CONFIG.storageKeys.villageData, allVillageData);
                    }
                    
                    window.TWAttack.saveState();
                    return true;
                }
                return false;
            },
            
            remove: function(target) {
                var targets = this.getCurrent();
                var index = targets.indexOf(target);
                if (index !== -1) {
                    targets.splice(index, 1);
                    window.TWAttack.state.targetList = targets.join(' ');
                    
                    // Remove target builds
                    delete window.TWAttack.state.targetBuilds[target];
                    
                    // Remove village data
                    var allVillageData = window.TWAttack.storage.get(CONFIG.storageKeys.villageData) || {};
                    var world = window.TWAttack.state.currentWorld;
                    if (allVillageData[world] && allVillageData[world][target]) {
                        delete allVillageData[world][target];
                        window.TWAttack.storage.set(CONFIG.storageKeys.villageData, allVillageData);
                    }
                    
                    window.TWAttack.saveState();
                    return true;
                }
                return false;
            },
            
            clear: function() {
                window.TWAttack.state.targetList = "";
                window.TWAttack.state.targetBuilds = {};
                
                // Clear village data for this world
                var allVillageData = window.TWAttack.storage.get(CONFIG.storageKeys.villageData) || {};
                var world = window.TWAttack.state.currentWorld;
                if (allVillageData[world]) {
                    allVillageData[world] = {};
                    window.TWAttack.storage.set(CONFIG.storageKeys.villageData, allVillageData);
                }
                
                window.TWAttack.saveState();
            }
        },
        
        // Build management
        builds: {
            get: function(target, buildKey) {
                if (!window.TWAttack.state.targetBuilds[target]) {
                    // Default: all builds enabled
                    return { A: true, B: true, C: true }[buildKey] || false;
                }
                return window.TWAttack.state.targetBuilds[target][buildKey] || false;
            },
            
            set: function(target, buildKey, enabled) {
                if (!window.TWAttack.state.targetBuilds[target]) {
                    window.TWAttack.state.targetBuilds[target] = { A: true, B: true, C: true };
                }
                window.TWAttack.state.targetBuilds[target][buildKey] = enabled;
                window.TWAttack.saveState();
            }
        },
        
        // Module registration
        registerModule: function(name, module) {
            if (!window.TWAttack.modules) {
                window.TWAttack.modules = {};
            }
            window.TWAttack.modules[name] = module;
            console.log('TW Attack: Module registered:', name);
        }
    };
    
    // Start loading
    window.TWAttack.loader.loadAll();
    
})();
