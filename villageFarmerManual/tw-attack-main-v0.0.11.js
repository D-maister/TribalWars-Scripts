// ===== TW Attack Script - Main Loader =====
// Loads and manages all other script modules

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        version: '2.0.0',
        baseUrl: 'https://cdn.jsdelivr.net/gh/D-maister/TribalWars-Scripts@main/villageFarmerManual/',
        scripts: {
            styles: 'tw-attack-styles-v0.0.1.js',
            attack: 'tw-attack-attack-v0.0.6.js',
            submit: 'tw-attack-submit-v0.0.1.js',
            village: 'tw-attack-village-v0.0.1.js',
            utils: 'tw-attack-utils-v0.0.8.js'
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
                var hostname = window.location.hostname;
                console.log('TW Attack: Hostname detected:', hostname);
                
                // Examples:
                // - en152.tribalwars.net → en152
                // - pl101.voynaplemyon.com → pl101
                // - www.voynaplemyon.com → unknown (but shouldn't happen for game pages)
                
                var parts = hostname.split('.');
                if (parts.length >= 2) {
                    // The first part should be the world name
                    var worldCode = parts[0];
                    
                    // Validate it looks like a world code (like en152, pl101, etc.)
                    // Pattern: 2 letters followed by numbers
                    if (worldCode.match(/^[a-z]{2}\d+$/i)) {
                        console.log('TW Attack: World code extracted:', worldCode);
                        return worldCode;
                    }
                    
                    // Also accept numeric-only codes (for some servers)
                    if (worldCode.match(/^\d+$/)) {
                        console.log('TW Attack: Numeric world code extracted:', worldCode);
                        return worldCode;
                    }
                }
                
                // Fallback: try to extract from URL
                var url = window.location.href;
                console.log('TW Attack: URL for fallback:', url);
                
                // Try different patterns
                var patterns = [
                    /https?:\/\/([^\/\.]+)\.tribalwars\.net/i,
                    /https?:\/\/([^\/\.]+)\.voynaplemyon\.com/i,
                    /[&?]world=([^&]+)/i,
                    /[&?]server=([^&]+)/i
                ];
                
                for (var i = 0; i < patterns.length; i++) {
                    var match = url.match(patterns[i]);
                    if (match && match[1]) {
                        console.log('TW Attack: World name from pattern', i, ':', match[1]);
                        return match[1];
                    }
                }
                
                console.log('TW Attack: Could not determine world name, using "unknown"');
                return "unknown";
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
                // Prepend baseUrl to the script source if it's a relative path
                var fullSrc = src;
                if (!src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/')) {
                    fullSrc = CONFIG.baseUrl + src;
                }
                
                console.log('TW Attack: Loading script:', fullSrc);
                return new Promise(function(resolve, reject) {
                    var script = document.createElement('script');
                    script.src = fullSrc;
                    script.onload = resolve;
                    script.onerror = function(err) {
                        console.error('TW Attack: Failed to load script:', fullSrc, err);
                        reject(err);
                    };
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
                console.log('TW Attack: Starting to load all modules');
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
            
            console.log('TW Attack: Initializing...');
            
            // Load state
            window.TWAttack.state.currentWorld = window.TWAttack.utils.getWorldName();
            window.TWAttack.state.homeCoords = window.TWAttack.utils.getCurrentVillageCoords();
            
            console.log('TW Attack: Current world:', window.TWAttack.state.currentWorld);
            console.log('TW Attack: Home coords:', window.TWAttack.state.homeCoords);
            console.log('TW Attack: Current URL:', window.location.href);
            
            // Load from storage
            this.loadState();
            
            // Initialize based on page type
            if (window.TWAttack.pages.isInfoVillage()) {
                console.log('TW Attack: Info village page detected');
                if (window.TWAttack.modules && window.TWAttack.modules.village) {
                    window.TWAttack.modules.village.initialize();
                }
            } else if (window.TWAttack.pages.isAttackPage()) {
                console.log('TW Attack: Attack page detected');
                if (window.TWAttack.modules && window.TWAttack.modules.attack) {
                    window.TWAttack.modules.attack.initialize();
                }
            } else if (window.TWAttack.pages.isSubmitPage()) {
                console.log('TW Attack: Submit page detected');
                if (window.TWAttack.modules && window.TWAttack.modules.submit) {
                    window.TWAttack.modules.submit.initialize();
                }
            } else {
                console.log('TW Attack: Other page, no config UI will be shown');
            }
            // No else block - don't show config on other pages
            
            window.TWAttack.state.isInitialized = true;
            console.log('TW Attack initialized for world:', window.TWAttack.state.currentWorld);
        },
        
        // Load state from storage
        loadState: function() {
            var world = window.TWAttack.state.currentWorld;
            console.log('TW Attack: Loading state for world:', world);
            
            // Load targets
            var allTargets = this.storage.get(CONFIG.storageKeys.targets);
            window.TWAttack.state.targetList = (allTargets && allTargets[world]) ? allTargets[world] : "";
            console.log('TW Attack: Loaded targets:', window.TWAttack.state.targetList);
            
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
            console.log('TW Attack: Saving state for world:', world);
            
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
                    console.log('TW Attack: Target added:', target);
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
                    console.log('TW Attack: Target removed:', target);
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
                console.log('TW Attack: All targets cleared for world:', world);
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
                console.log('TW Attack: Build', buildKey, 'for target', target, 'set to', enabled);
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
    console.log('TW Attack: Starting script loader');
    window.TWAttack.loader.loadAll();
    
})();
