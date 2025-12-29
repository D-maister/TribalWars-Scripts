(function() {
    console.log('🚀 TW Attack Script - Combined Version');

    // ===== STYLES =====
    const styles = `
        /* Main config styles */
        .tw-attack-config {
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
        }
        
        .tw-attack-close-btn {
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
        }
        
        .tw-attack-title {
            margin-top: 0;
            margin-bottom: 20px;
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 10px;
        }
        
        .tw-attack-toggle-btn {
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
        }
        
        .tw-attack-auto-container {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .tw-attack-auto-btn {
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
        }
        
        .tw-attack-auto-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 10px rgba(0,0,0,0.15);
        }
        
        .tw-attack-auto-btn-a {
            background: linear-gradient(to right, #ff416c, #ff4b2b);
        }
        
        .tw-attack-auto-btn-b {
            background: linear-gradient(to right, #2196F3, #1976D2);
        }
        
        .tw-attack-auto-btn-c {
            background: linear-gradient(to right, #9C27B0, #7B1FA2);
        }
        
        .tw-attack-world-info {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 6px;
            border: 1px solid #e9ecef;
        }
        
        .tw-attack-section {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #ffecb3;
        }
        
        .tw-attack-section-settings {
            background-color: #fff8e1;
            border-color: #ffecb3;
        }
        
        .tw-attack-section-builds {
            background-color: #fff8e1;
            border-color: #ffecb3;
        }
        
        .tw-attack-section-title {
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
        }
        
        .tw-attack-setting-row {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            padding: 10px;
            background: #fff;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
        }
        
        .tw-attack-setting-label {
            margin-right: 10px;
            font-weight: bold;
            min-width: 200px;
        }
        
        .tw-attack-input {
            padding: 6px 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .tw-attack-save-btn {
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
        }
        
        .tw-attack-build-container {
            margin-bottom: 15px;
            padding: 12px;
            background: #fff;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
        }
        
        .tw-attack-build-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #4CAF50;
        }
        
        .tw-attack-build-title {
            font-weight: bold;
            font-size: 16px;
            color: #4CAF50;
        }
        
        .tw-attack-build-title-b {
            color: #2196F3;
        }
        
        .tw-attack-build-title-c {
            color: #9C27B0;
        }
        
        .tw-attack-build-save-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
        }
        
        .tw-attack-build-save-btn-b {
            background: #2196F3;
        }
        
        .tw-attack-build-save-btn-c {
            background: #9C27B0;
        }
        
        .tw-attack-troops-grid {
            display: grid;
            grid-template-columns: repeat(9, 1fr);
            gap: 6px;
        }
        
        .tw-attack-troop-input {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .tw-attack-troop-label {
            font-size: 11px;
            font-weight: bold;
            color: #666;
            margin-bottom: 4px;
            text-align: center;
            width: 100%;
        }
        
        .tw-attack-troop-field {
            padding: 4px;
            border: 1px solid #ddd;
            border-radius: 3px;
            text-align: center;
            font-size: 12px;
            width: 45px;
            box-sizing: border-box;
        }
        
        .tw-attack-textarea {
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
        }
        
        .tw-attack-parse-btn {
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
        }
        
        .tw-attack-status {
            font-size: 13px;
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 6px;
            display: none;
        }
        
        .tw-attack-status-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .tw-attack-status-error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .tw-attack-targets-container {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
        }
        
        .tw-attack-clear-btn {
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
        }
        
        .tw-attack-target-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 10px;
            margin: 3px 0;
            background: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #e9ecef;
            transition: transform 0.2s, box-shadow 0.2s;
            font-size: 12px;
            line-height: 1.2;
        }
        
        .tw-attack-target-item:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .tw-attack-target-info {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .tw-attack-target-coords {
            font-family: monospace;
            font-weight: bold;
            font-size: 14px;
            color: #333;
            min-width: 70px;
        }
        
        .tw-attack-target-details {
            font-size: 11px;
            color: #666;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: nowrap;
        }
        
        .tw-attack-action-buttons {
            display: flex;
            gap: 5px;
            margin: 0 10px;
        }
        
        .tw-attack-action-btn {
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            font-weight: bold;
            min-width: 30px;
            height: 24px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .tw-attack-action-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 2px 3px rgba(0,0,0,0.15);
        }
        
        .tw-attack-action-btn-a {
            background: #4CAF50;
        }
        
        .tw-attack-action-btn-b {
            background: #2196F3;
        }
        
        .tw-attack-action-btn-c {
            background: #9C27B0;
        }
        
        .tw-attack-action-btn-disabled {
            background: #cccccc;
            cursor: not-allowed;
            opacity: 0.5;
        }
        
        .tw-attack-action-btn-checkbox {
            background: #e0e0e0;
            color: #666;
            border: 2px solid #999;
        }
        
        .tw-attack-action-btn-checkbox.checked {
            background: #4CAF50;
            color: white;
            border-color: #4CAF50;
        }
        
        .tw-attack-action-btn-checkbox.checked.b {
            background: #2196F3;
            border-color: #2196F3;
        }
        
        .tw-attack-action-btn-checkbox.checked.c {
            background: #9C27B0;
            border-color: #9C27B0;
        }
        
        .tw-attack-ignore-btn {
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
        }
        
        .tw-attack-remove-btn {
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
        }
        
        .tw-attack-attack-btn {
            background: #ff4444;
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
        }
        
        .tw-attack-bonus-star {
            color: #FFD700;
            font-size: 14px;
            margin-left: 5px;
            text-shadow: 0 0 2px rgba(0,0,0,0.5);
        }
        
        .tw-attack-player-circle {
            color: #ff4444;
            font-size: 14px;
            margin-left: 5px;
            text-shadow: 0 0 2px rgba(0,0,0,0.5);
        }
        
        .tw-attack-external-auto {
            position: fixed;
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
        }
        
        .tw-attack-overlay {
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
        }
        
        .tw-attack-selection-container {
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
        }
        
        /* Submit script styles */
        .tw-submit-loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            z-index: 99999;
            font-family: Arial, sans-serif;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            text-align: center;
            min-width: 300px;
            border: 2px solid #4CAF50;
        }
        
        .tw-submit-loading-title {
            font-size: 18px;
            margin-bottom: 15px;
            color: #4CAF50;
            font-weight: bold;
        }
        
        .tw-submit-loading-spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid #4CAF50;
            width: 40px;
            height: 40px;
            animation: twSubmitSpin 1s linear infinite;
            margin: 15px auto;
        }

        .tw-attack-villages-container {
            flex: 1;
            overflow-y: auto;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            background: #f8f9fa;
            min-height: 300px;
        }
        
        .tw-attack-village-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            margin: 8px 0;
            background: #fff;
            border-radius: 8px;
            border: 1px solid #e9ecef;
            cursor: pointer;
            transition: background-color 0.2s, transform 0.2s;
            min-height: 50px;
            box-sizing: border-box;
        }
        
        .tw-attack-village-item:hover {
            background-color: #e9ecef;
            transform: translateX(5px);
        }
        
        .tw-attack-village-item-alt {
            background: #f8f9fa;
        }
        
        .tw-attack-village-item.selected {
            background-color: #e8f5e9;
        }
        
        .tw-attack-village-info {
            display: flex;
            flex-direction: column;
            font-family: monospace;
            font-size: 13px;
            flex: 1;
            min-width: 0; /* Important for text overflow */
        }
        
        .tw-attack-village-details {
            font-size: 11px;
            color: #666;
            margin-top: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .tw-attack-village-checkbox {
            margin-left: 15px;
            transform: scale(1.2);
            flex-shrink: 0;
        }
        
        @keyframes twSubmitSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    // Add styles to the page
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    // ===== CONFIGURATION =====
    var cookieName = "akk";
    var historyCookie = "attackHistory";
    var targetsStorageKey = "twAttackTargets";
    var buildsStorageKey = "twAttackBuilds";
    var settingsStorageKey = "twAttackSettings";
    var ignoreStorageKey = "twAttackIgnoreList";
    var submitMarkerKey = "twAttackSubmitMarker";
    var targetBuildsKey = "twAttackTargetBuilds";
    
    var defaultCooldown = 30;
    var homeCoords = "";
    var targetList = "";
    var currentWorld = "";
    var configVisible = false;
    var updateInterval = null;
    
    var defaultBuilds = {
        "A": { spear: 0, sword: 0, axe: 0, spy: 0, light: 2, heavy: 0, ram: 0, catapult: 0, knight: 0 },
        "B": { spear: 0, sword: 0, axe: 0, spy: 0, light: 0, heavy: 0, ram: 0, catapult: 0, knight: 0 },
        "C": { spear: 0, sword: 0, axe: 0, spy: 0, light: 0, heavy: 0, ram: 0, catapult: 0, knight: 0 }
    };
    
    var troopBuilds = {};
    var targetBuilds = {}; // Stores which builds are enabled for each target
    
    var settings = {
        cooldown: defaultCooldown,
        autoAttack: true,
        includePlayers: false,
        maxPlayerPoints: 1000,
        autoAttackEnabled: false,
        autoAttackPosition: { x: 10, y: 100 },
        includeBonusVillages: true,
        autoAttackBuilds: { A: true, B: false, C: false }
    };

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
                    // Ensure all three builds exist
                    if (!troopBuilds["A"]) troopBuilds["A"] = JSON.parse(JSON.stringify(defaultBuilds["A"]));
                    if (!troopBuilds["B"]) troopBuilds["B"] = JSON.parse(JSON.stringify(defaultBuilds["B"]));
                    if (!troopBuilds["C"]) troopBuilds["C"] = JSON.parse(JSON.stringify(defaultBuilds["C"]));
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
    
    function loadTargetBuildsFromStorage() {
        try {
            var storedData = localStorage.getItem(targetBuildsKey);
            if (storedData) {
                var allTargetBuilds = JSON.parse(storedData);
                if (allTargetBuilds[currentWorld]) {
                    targetBuilds = allTargetBuilds[currentWorld];
                } else {
                    targetBuilds = {};
                }
            } else {
                targetBuilds = {};
            }
        } catch (e) {
            console.error("Error loading target builds:", e);
            targetBuilds = {};
        }
    }
    
    function saveTargetBuildsToStorage() {
        try {
            var storedData = localStorage.getItem(targetBuildsKey);
            var allTargetBuilds = storedData ? JSON.parse(storedData) : {};
            allTargetBuilds[currentWorld] = targetBuilds;
            localStorage.setItem(targetBuildsKey, JSON.stringify(allTargetBuilds));
        } catch (e) {
            console.error("Error saving target builds:", e);
        }
    }
    
    function getTargetBuilds(target) {
        if (!targetBuilds[target]) {
            // Default: all builds enabled
            targetBuilds[target] = { A: true, B: true, C: true };
        }
        return targetBuilds[target];
    }
    
    function setTargetBuild(target, buildKey, enabled) {
        if (!targetBuilds[target]) {
            targetBuilds[target] = { A: true, B: true, C: true };
        }
        targetBuilds[target][buildKey] = enabled;
        saveTargetBuildsToStorage();
    }
    
    function loadSettingsFromStorage() {
        try {
            var storedData = localStorage.getItem(settingsStorageKey);
            if (storedData) {
                var allSettings = JSON.parse(storedData);
                if (allSettings[currentWorld]) {
                    settings = allSettings[currentWorld];
                    settings.autoAttack = true;
                    
                    // Initialize missing properties
                    if (!settings.autoAttackBuilds) {
                        settings.autoAttackBuilds = { A: true, B: false, C: false };
                    }
                    if (settings.includePlayers === undefined) settings.includePlayers = false;
                    if (settings.maxPlayerPoints === undefined) settings.maxPlayerPoints = 1000;
                    if (settings.autoAttackEnabled === undefined) settings.autoAttackEnabled = false;
                    if (settings.autoAttackPosition === undefined) settings.autoAttackPosition = { x: 10, y: 100 };
                    if (settings.includeBonusVillages === undefined) settings.includeBonusVillages = true;
                } else {
                    settings = {
                        cooldown: defaultCooldown,
                        autoAttack: true,
                        includePlayers: false,
                        maxPlayerPoints: 1000,
                        autoAttackEnabled: false,
                        autoAttackPosition: { x: 10, y: 100 },
                        autoAttackBuilds: { A: true, B: false, C: false },
                        includeBonusVillages: true
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
                    autoAttackBuilds: { A: true, B: false, C: false },
                    includeBonusVillages: true
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
                autoAttackBuilds: { A: true, B: false, C: false },
                includeBonusVillages: true
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
            // Initialize target builds
            if (!targetBuilds[targetToAdd]) {
                targetBuilds[targetToAdd] = { A: true, B: true, C: true };
                saveTargetBuildsToStorage();
            }
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
        targetBuilds = {};
        saveTargetBuildsToStorage();
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

    // ===== ATTACK FUNCTIONS =====
    
    function checkForAntibot() {
        if (document.querySelector('td.bot-protection-row, div#botprotection_quest.quest')) {
            alert('Check for ANTIBOT CAPTCHA');
            return true;
        }
        return false;
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
            
            // Set session storage marker
            if (actualCount > 0) {
                var worldName = getWorldName();
                var key = submitMarkerKey + "_" + worldName;
                var timestamp = new Date().getTime();
                sessionStorage.setItem(key, timestamp.toString());
                console.log("Set session storage marker for submit button: " + key + " = " + timestamp);
            }
        }
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
    
    function clickAttackButton() {
        if (checkForAntibot()) return false;
        
        var doc = window.frames.length > 0 ? window.main.document : document;
        var submitButton = doc.querySelector('input[type="submit"], button[type="submit"], input[name="target_attack"]');
        if (submitButton) {
            console.log("Auto-attack: Clicking submit button");
            
            // Set session storage marker
            var worldName = getWorldName();
            var key = submitMarkerKey + "_" + worldName;
            var timestamp = new Date().getTime();
            sessionStorage.setItem(key, timestamp.toString());
            console.log("Set session storage marker for submit button: " + key + " = " + timestamp);
            
            submitButton.click();
            return true;
        } else if (doc.forms[0]) {
            // Set session storage marker
            var worldName = getWorldName();
            var key = submitMarkerKey + "_" + worldName;
            var timestamp = new Date().getTime();
            sessionStorage.setItem(key, timestamp.toString());
            console.log("Set session storage marker for form submit: " + key + " = " + timestamp);
            
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
                
                // Try other builds in order A -> B -> C
                var buildOrder = ['A', 'B', 'C'];
                var currentIndex = buildOrder.indexOf(buildKey);
                var nextBuild = null;
                
                for (var i = currentIndex + 1; i < buildOrder.length; i++) {
                    if (settings.autoAttackBuilds[buildOrder[i]]) {
                        nextBuild = buildOrder[i];
                        break;
                    }
                }
                
                if (nextBuild) {
                    console.log("Trying Build " + nextBuild + " as fallback...");
                    setTimeout(function() {
                        attackTarget(target, nextBuild);
                    }, 1000);
                } else {
                    // Schedule next check in 30 seconds
                    setTimeout(function() {
                        console.log('Re-checking troop availability...');
                        attackTarget(target, buildKey);
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
            
            // Auto-click submit button
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
    
    function getFirstAvailableBuildForTarget(target) {
        var targetBuildSettings = getTargetBuilds(target);
        var buildOrder = ['A', 'B', 'C'];
        
        for (var i = 0; i < buildOrder.length; i++) {
            var buildKey = buildOrder[i];
            if (targetBuildSettings[buildKey]) {
                return buildKey;
            }
        }
        return null;
    }
    
    function attackTargetWithAvailableBuild(target) {
        var buildKey = getFirstAvailableBuildForTarget(target);
        if (buildKey) {
            attackTarget(target, buildKey);
        } else {
            showStatus('No builds enabled for target ' + target, 'error');
        }
    }
    
    function autoAttackNext() {
        console.log("=== autoAttackNext called ===");
        
        if (checkForAntibot()) return;
        cleanupOldHistory();
        
        var targets = targetList.split(" ").filter(Boolean);
        if (targets.length === 0) {
            showStatus('No targets in list for auto-attack', 'error');
            
            // Retry after delay
            if (settings.autoAttackEnabled) {
                setTimeout(function() {
                    autoAttackNext();
                }, 60000);
            }
            return;
        }
        
        var targetIndex = 0;
        var savedIndex = getCookie(cookieName);
        if (null !== savedIndex) targetIndex = parseInt(savedIndex);
        
        var startIndex = targetIndex;
        var selectedTarget = null;
        var selectedBuild = null;
        var attempts = 0;
        
        do {
            var currentTarget = targets[targetIndex];
            var cooldownInfo = getCooldownInfo(currentTarget);
            
            if (!cooldownInfo.onCooldown) {
                // Check which builds are enabled for this target
                var targetBuildSettings = getTargetBuilds(currentTarget);
                var buildOrder = ['A', 'B', 'C'];
                
                for (var i = 0; i < buildOrder.length; i++) {
                    var buildKey = buildOrder[i];
                    if (targetBuildSettings[buildKey] && settings.autoAttackBuilds[buildKey]) {
                        selectedTarget = currentTarget;
                        selectedBuild = buildKey;
                        break;
                    }
                }
                
                if (selectedTarget) break;
            }
            targetIndex = (targetIndex + 1) % targets.length;
            attempts++;
        } while (attempts < targets.length && targetIndex != startIndex);
        
        if (selectedTarget && selectedBuild) {
            var nextIndex = (targetIndex + 1) % targets.length;
            setCookie(cookieName, nextIndex.toString(), 365);
            attackTarget(selectedTarget, selectedBuild);
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
                    autoAttackNext();
                }, checkDelay);
            } else {
                showStatus('All targets are on cooldown', 'error');
            }
        }
    }

    // ===== SUBMIT SCRIPT FUNCTIONS =====
    
    let submitScriptExecuted = false;
    let loadingOverlay = null;
    
    const SUBMIT_CONFIG = {
        urlPattern: '&screen=place&try=confirm',
        elementId: 'troop_confirm_submit',
        maxRetries: 5,
        retryDelay: 200,
        initialDelay: { min: 100, max: 300 },
        urlCheckInterval: 500
    };
    
    function checkSessionMarker() {
        const worldName = getWorldName();
        const markerKey = submitMarkerKey + "_" + worldName;
        const marker = sessionStorage.getItem(markerKey);
        
        if (marker) {
            console.log(`✅ Session storage marker found: ${markerKey} = ${marker}`);
            sessionStorage.removeItem(markerKey);
            console.log(`🗑️ Session storage marker removed: ${markerKey}`);
            return true;
        }
        
        console.log(`❌ No session storage marker found for world: ${worldName}`);
        return false;
    }
    
    function createSubmitLoadingOverlay() {
        if (loadingOverlay) return loadingOverlay;
        
        const overlay = document.createElement('div');
        overlay.className = 'tw-attack-overlay';
        
        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'tw-submit-loading';
        
        const title = document.createElement('div');
        title.className = 'tw-submit-loading-title';
        title.textContent = '⚔️ TW Attack - Auto Submit';
        
        const status = document.createElement('div');
        status.className = 'tw-attack-status';
        status.id = 'tw-submit-status';
        status.textContent = 'Checking page...';
        
        const spinner = document.createElement('div');
        spinner.className = 'tw-submit-loading-spinner';
        
        loadingContainer.appendChild(title);
        loadingContainer.appendChild(status);
        loadingContainer.appendChild(spinner);
        overlay.appendChild(loadingContainer);
        
        document.body.appendChild(overlay);
        loadingOverlay = overlay;
        
        return overlay;
    }
    
    function updateSubmitStatus(message, isError = false, isSuccess = false) {
        const statusElement = document.getElementById('tw-submit-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = 'tw-attack-status';
            if (isError) statusElement.classList.add('tw-attack-status-error');
            if (isSuccess) statusElement.classList.add('tw-attack-status-success');
        }
    }
    
    function removeSubmitLoadingOverlay() {
        if (loadingOverlay && loadingOverlay.parentNode) {
            loadingOverlay.parentNode.removeChild(loadingOverlay);
            loadingOverlay = null;
        }
    }
    
    function runSubmitScript() {
        // Skip if already executed
        if (submitScriptExecuted) {
            return;
        }
        
        // Check session storage marker
        if (!checkSessionMarker()) {
            console.log('⏹️ No session storage marker found - stopping submit script');
            submitScriptExecuted = true;
            return;
        }

        // Check if auto-attack is enabled
        if (!settings.autoAttackEnabled) {
            console.log('⏹️ Auto-attack is not enabled');
            submitScriptExecuted = true;
            return;
        }
        
        // Antibot check
        if (checkForAntibot()) {
            submitScriptExecuted = true;
            return;
        }
        
        // Check URL pattern
        if (!window.location.href.includes(SUBMIT_CONFIG.urlPattern)) {
            console.log('⏳ Not the submit page, waiting...');
            
            if (!loadingOverlay) {
                createSubmitLoadingOverlay();
                updateSubmitStatus('⏳ Waiting for submit page...');
            }
            
            return;
        }
        
        console.log('✅ Submit page detected!');
        submitScriptExecuted = true;
        
        createSubmitLoadingOverlay();
        updateSubmitStatus('✅ Submit page detected!');
        
        const initialDelay = Math.floor(
            Math.random() * (SUBMIT_CONFIG.initialDelay.max - SUBMIT_CONFIG.initialDelay.min + 1)
        ) + SUBMIT_CONFIG.initialDelay.min;
        
        console.log(`⏳ Initial delay: ${initialDelay}ms before finding element...`);
        updateSubmitStatus(`⏳ Waiting ${initialDelay}ms...`);
        
        setTimeout(() => {
            let attempts = 0;
            
            function attemptClick() {
                if (checkForAntibot()) {
                    updateSubmitStatus('❌ Antibot captcha detected!', true);
                    setTimeout(() => {
                        removeSubmitLoadingOverlay();
                    }, 3000);
                    return;
                }
                
                attempts++;
                console.log(`🔍 Attempt ${attempts}/${SUBMIT_CONFIG.maxRetries}: Looking for button...`);
                
                const button = document.getElementById(SUBMIT_CONFIG.elementId);
                
                if (button) {
                    console.log(`✅ Found on attempt ${attempts}! Clicking #${SUBMIT_CONFIG.elementId}...`);
                    updateSubmitStatus(`✅ Found button! Clicking...`, false, true);
                    
                    setTimeout(() => {
                        button.click();
                        console.log('🎉 Success! Button clicked.');
                        updateSubmitStatus('🎉 Success! Button clicked.', false, true);
                        
                        setTimeout(() => {
                            removeSubmitLoadingOverlay();
                        }, 1500);
                        
                    }, 100);
                    
                    return;
                }
                
                if (attempts < SUBMIT_CONFIG.maxRetries) {
                    console.log(`⚠️ Not found. Retrying in ${SUBMIT_CONFIG.retryDelay}ms...`);
                    updateSubmitStatus(`⚠️ Button not found. Retrying...`);
                    
                    setTimeout(attemptClick, SUBMIT_CONFIG.retryDelay);
                } else {
                    console.error(`❌ Failed after ${SUBMIT_CONFIG.maxRetries} attempts.`);
                    updateSubmitStatus(`❌ Failed after ${SUBMIT_CONFIG.maxRetries} attempts.`, true);
                    
                    setTimeout(() => {
                        removeSubmitLoadingOverlay();
                    }, 3000);
                }
            }
            
            attemptClick();
            
        }, initialDelay);
    }
    
    // ===== UI FUNCTIONS =====
    
    function createConfigUI() {
        if (checkForAntibot()) return;
        
        var existingUI = document.getElementById('tw-attack-config');
        if (existingUI) existingUI.remove();
        
        currentWorld = getWorldName();
        homeCoords = getCurrentVillageCoords();
        
        loadTargetsFromStorage();
        loadBuildsFromStorage();
        loadSettingsFromStorage();
        loadTargetBuildsFromStorage();
        
        var uiContainer = document.createElement('div');
        uiContainer.id = 'tw-attack-config';
        uiContainer.className = 'tw-attack-config';
        
        var closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.className = 'tw-attack-close-btn';
        closeBtn.onclick = function() {
            uiContainer.remove();
            stopAutoUpdate();
            var externalCheckbox = document.getElementById('external-auto-attack');
            if (externalCheckbox) externalCheckbox.remove();
        };
        
        var title = document.createElement('h3');
        title.textContent = '⚔️ TW Attack Config - ' + currentWorld;
        title.className = 'tw-attack-title';
        
        var toggleConfigBtn = document.createElement('button');
        toggleConfigBtn.textContent = configVisible ? '▲ Hide Config' : '▼ Show Config';
        toggleConfigBtn.className = 'tw-attack-toggle-btn';
        toggleConfigBtn.onclick = function() {
            configVisible = !configVisible;
            this.textContent = configVisible ? '▲ Hide Config' : '▼ Show Config';
            toggleConfigVisibility();
        };
        
        var autoAttackContainer = document.createElement('div');
        autoAttackContainer.className = 'tw-attack-auto-container';
        
        var autoAttackBtnA = document.createElement('button');
        autoAttackBtnA.textContent = '⚡ Auto-Attack (A)';
        autoAttackBtnA.className = 'tw-attack-auto-btn tw-attack-auto-btn-a';
        autoAttackBtnA.onclick = function() { autoAttackNext(); };
        
        var autoAttackBtnB = document.createElement('button');
        autoAttackBtnB.textContent = '⚡ Auto-Attack (B)';
        autoAttackBtnB.className = 'tw-attack-auto-btn tw-attack-auto-btn-b';
        autoAttackBtnB.onclick = function() { autoAttackNext(); };
        
        var autoAttackBtnC = document.createElement('button');
        autoAttackBtnC.textContent = '⚡ Auto-Attack (C)';
        autoAttackBtnC.className = 'tw-attack-auto-btn tw-attack-auto-btn-c';
        autoAttackBtnC.onclick = function() { autoAttackNext(); };
        
        autoAttackContainer.appendChild(autoAttackBtnA);
        autoAttackContainer.appendChild(autoAttackBtnB);
        autoAttackContainer.appendChild(autoAttackBtnC);
        
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
                saveTargetBuildsToStorage();
                currentWorld = this.value;
                title.textContent = '⚔️ TW Attack Config - ' + currentWorld;
                loadTargetsFromStorage();
                loadBuildsFromStorage();
                loadSettingsFromStorage();
                loadTargetBuildsFromStorage();
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
        infoSection.className = 'tw-attack-world-info';
        
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
        
        infoSection.appendChild(worldInfo);
        infoSection.appendChild(villageInfo);
        infoSection.appendChild(cooldownInfo);
        infoSection.appendChild(villageUrl);
        infoSection.appendChild(urlLink);
        infoSection.appendChild(urlHelp);
        
        var settingsSection = document.createElement('div');
        settingsSection.id = 'settings-section';
        settingsSection.className = 'tw-attack-section tw-attack-section-settings';
        
        var settingsTitle = document.createElement('h4');
        settingsTitle.textContent = '⚙️ Settings';
        settingsTitle.className = 'tw-attack-section-title';
        
        settingsSection.appendChild(settingsTitle);
        
        function updateSettingsUI() {
            var settingsContainer = settingsSection.querySelector('#settings-container');
            if (settingsContainer) settingsContainer.remove();
            
            settingsContainer = document.createElement('div');
            settingsContainer.id = 'settings-container';
            
            // Cooldown setting
            var cooldownSetting = document.createElement('div');
            cooldownSetting.className = 'tw-attack-setting-row';
            
            var cooldownLabel = document.createElement('label');
            cooldownLabel.textContent = 'Cooldown (minutes): ';
            cooldownLabel.className = 'tw-attack-setting-label';
            
            var cooldownInput = document.createElement('input');
            cooldownInput.type = 'number';
            cooldownInput.min = '1';
            cooldownInput.max = '1440';
            cooldownInput.value = settings.cooldown;
            cooldownInput.className = 'tw-attack-input';
            cooldownInput.style.width = '80px';
            cooldownInput.style.marginRight = '10px';
            
            cooldownSetting.appendChild(cooldownLabel);
            cooldownSetting.appendChild(cooldownInput);
            
            // Include players villages setting
            var includePlayersSetting = document.createElement('div');
            includePlayersSetting.className = 'tw-attack-setting-row';
            
            var includePlayersLabel = document.createElement('label');
            includePlayersLabel.textContent = 'Include players villages: ';
            includePlayersLabel.className = 'tw-attack-setting-label';
            
            var includePlayersCheckbox = document.createElement('input');
            includePlayersCheckbox.type = 'checkbox';
            includePlayersCheckbox.checked = settings.includePlayers;
            includePlayersCheckbox.style.cssText = `transform: scale(1.3); margin-right: 10px;`;
            
            includePlayersSetting.appendChild(includePlayersLabel);
            includePlayersSetting.appendChild(includePlayersCheckbox);
            
            // Max player points setting
            var maxPointsSetting = document.createElement('div');
            maxPointsSetting.className = 'tw-attack-setting-row';
            
            var maxPointsLabel = document.createElement('label');
            maxPointsLabel.textContent = 'Max player points: ';
            maxPointsLabel.className = 'tw-attack-setting-label';
            
            var maxPointsInput = document.createElement('input');
            maxPointsInput.type = 'number';
            maxPointsInput.min = '1';
            maxPointsInput.value = settings.maxPlayerPoints;
            maxPointsInput.className = 'tw-attack-input';
            maxPointsInput.style.width = '80px';
            
            maxPointsSetting.appendChild(maxPointsLabel);
            maxPointsSetting.appendChild(maxPointsInput);
            
            // Include bonus villages setting
            var includeBonusSetting = document.createElement('div');
            includeBonusSetting.className = 'tw-attack-setting-row';
            
            var includeBonusLabel = document.createElement('label');
            includeBonusLabel.textContent = 'Include bonus villages: ';
            includeBonusLabel.className = 'tw-attack-setting-label';
            
            var includeBonusCheckbox = document.createElement('input');
            includeBonusCheckbox.type = 'checkbox';
            includeBonusCheckbox.checked = settings.includeBonusVillages;
            includeBonusCheckbox.style.cssText = `transform: scale(1.3); margin-right: 10px;`;
            
            includeBonusSetting.appendChild(includeBonusLabel);
            includeBonusSetting.appendChild(includeBonusCheckbox);
            
            settingsContainer.appendChild(cooldownSetting);
            settingsContainer.appendChild(includePlayersSetting);
            settingsContainer.appendChild(maxPointsSetting);
            settingsContainer.appendChild(includeBonusSetting);
            
            var saveAllBtn = document.createElement('button');
            saveAllBtn.textContent = '💾 Save All Settings';
            saveAllBtn.className = 'tw-attack-save-btn';
            
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
                settings.includeBonusVillages = includeBonusCheckbox.checked;
                
                saveAllSettings();
                cooldownInfo.innerHTML = '<strong>⏰ Cooldown:</strong> ' + settings.cooldown + ' minutes';
            };
            
            settingsContainer.appendChild(saveAllBtn);
            settingsSection.appendChild(settingsContainer);
        }
        
        updateSettingsUI();
        
        var buildsSection = document.createElement('div');
        buildsSection.id = 'troop-builds';
        buildsSection.className = 'tw-attack-section tw-attack-section-builds';
        
        var buildsTitle = document.createElement('h4');
        buildsTitle.textContent = '👥 Troop Builds';
        buildsTitle.className = 'tw-attack-section-title';
        
        buildsSection.appendChild(buildsTitle);
        
        function updateBuildsUI() {
            var buildsContainer = buildsSection.querySelector('#builds-container');
            if (buildsContainer) buildsContainer.remove();
            
            buildsContainer = document.createElement('div');
            buildsContainer.id = 'builds-container';
            
            ['A', 'B', 'C'].forEach(function(buildKey) {
                var build = troopBuilds[buildKey] || defaultBuilds[buildKey];
                
                var buildContainer = document.createElement('div');
                buildContainer.className = 'tw-attack-build-container';
                
                var buildHeader = document.createElement('div');
                buildHeader.className = 'tw-attack-build-header';
                var borderColor = buildKey === 'A' ? '#4CAF50' : buildKey === 'B' ? '#2196F3' : '#9C27B0';
                buildHeader.style.borderBottomColor = borderColor;
                
                var buildTitle = document.createElement('div');
                buildTitle.className = 'tw-attack-build-title';
                if (buildKey === 'B') buildTitle.classList.add('tw-attack-build-title-b');
                if (buildKey === 'C') buildTitle.classList.add('tw-attack-build-title-c');
                buildTitle.textContent = 'Build ' + buildKey;
                
                var saveBtn = document.createElement('button');
                saveBtn.textContent = '💾 Save';
                saveBtn.className = 'tw-attack-build-save-btn';
                if (buildKey === 'B') saveBtn.classList.add('tw-attack-build-save-btn-b');
                if (buildKey === 'C') saveBtn.classList.add('tw-attack-build-save-btn-c');
                
                saveBtn.onclick = (function(key) {
                    return function() {
                        saveBuild(key);
                    };
                })(buildKey);
                
                buildHeader.appendChild(buildTitle);
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
        pasteTextarea.className = 'tw-attack-textarea';
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
        distanceInput.className = 'tw-attack-input';
        distanceInput.style.width = '80px';
        distanceInput.style.marginRight = '15px';
        
        distanceContainer.appendChild(distanceLabel);
        distanceContainer.appendChild(distanceInput);
        
        var parseBtn = document.createElement('button');
        parseBtn.textContent = '🔍 Parse villages.txt';
        parseBtn.className = 'tw-attack-parse-btn';
        
        var statusMsg = document.createElement('div');
        statusMsg.id = 'parse-status';
        statusMsg.className = 'tw-attack-status';
        
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
        targetsContainer.className = 'tw-attack-targets-container';
        
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
            var clearBtn = targetsList.querySelector('.tw-attack-clear-btn');
            
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
        statusMsg.className = 'tw-attack-status';
        
        switch(type) {
            case 'success':
                statusMsg.classList.add('tw-attack-status-success');
                break;
            case 'error':
                statusMsg.classList.add('tw-attack-status-error');
                break;
            default:
                statusMsg.classList.add('tw-attack-status-info');
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
        clearAllBtn.className = 'tw-attack-clear-btn';
        clearAllBtn.style.display = configVisible ? 'block' : 'none';
        clearAllBtn.onclick = function() {
            if (confirm('Clear all targets for ' + currentWorld + '?')) {
                clearAllTargets();
                updateTargetsListUI();
                showStatus('All targets cleared for ' + currentWorld, 'success');
            }
        };

        var manageIgnoresBtn = document.createElement('button');
        manageIgnoresBtn.textContent = '👁️ Manage Ignore List';
        manageIgnoresBtn.className = 'tw-attack-manage-btn';
        manageIgnoresBtn.onclick = function() {
            showIgnoreListManagement();
        };
        
        targetsList.appendChild(clearAllBtn);
        targetsList.appendChild(manageIgnoresBtn);
        
        targets.forEach(function(target, index) {
            var targetItem = document.createElement('div');
            targetItem.className = index % 2 === 0 ? 'tw-attack-target-item' : 'tw-attack-target-item tw-attack-target-item-alt';
            
            var targetInfo = document.createElement('div');
            targetInfo.className = 'tw-attack-target-info';
            
            var distance = homeCoords ? calculateDistance(homeCoords, target) : 0;
            var cooldownInfo = getCooldownInfo(target);
            var targetBuildSettings = getTargetBuilds(target);
            
            var targetCoords = document.createElement('div');
            targetCoords.className = 'tw-attack-target-coords';
            targetCoords.textContent = target;
            
            var targetDetails = document.createElement('div');
            targetDetails.className = 'tw-attack-target-details';
            
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
            
            var actionButtons = document.createElement('div');
            actionButtons.className = 'tw-attack-action-buttons';
            
            // Build selection checkboxes
            ['A', 'B', 'C'].forEach(function(buildKey) {
                var isEnabled = targetBuildSettings[buildKey];
                var btn = document.createElement('button');
                btn.textContent = buildKey;
                btn.className = 'tw-attack-action-btn tw-attack-action-btn-checkbox';
                if (isEnabled) btn.classList.add('checked');
                if (buildKey === 'B') btn.classList.add('b');
                if (buildKey === 'C') btn.classList.add('c');
                btn.title = 'Toggle Build ' + buildKey + ' for this target';
                
                btn.onclick = (function(buildKey, targetCoords) {
                    return function(e) {
                        e.stopPropagation();
                        var newState = !targetBuildSettings[buildKey];
                        setTargetBuild(targetCoords, buildKey, newState);
                        if (newState) {
                            this.classList.add('checked');
                        } else {
                            this.classList.remove('checked');
                        }
                    };
                })(buildKey, target);
                
                actionButtons.appendChild(btn);
            });
            
            var attackBtn = document.createElement('button');
            attackBtn.textContent = '⚔️';
            attackBtn.title = 'Attack with first available build';
            attackBtn.className = 'tw-attack-attack-btn';
            attackBtn.disabled = cooldownInfo.onCooldown;
            if (cooldownInfo.onCooldown) {
                attackBtn.style.opacity = '0.5';
                attackBtn.style.cursor = 'not-allowed';
            } else {
                attackBtn.onclick = (function(targetToAttack) {
                    return function() { attackTargetWithAvailableBuild(targetToAttack); };
                })(target);
            }

            var ignoreBtn = document.createElement('button');
            ignoreBtn.textContent = '👁️';
            ignoreBtn.title = 'Add to ignore list (hide from future selections)';
            ignoreBtn.className = 'tw-attack-ignore-btn';
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
            removeBtn.className = 'tw-attack-remove-btn';
            removeBtn.onclick = (function(targetToRemove) {
                return function() {
                    if (removeFromTargetList(targetToRemove)) {
                        updateTargetsListUI();
                        showStatus('Target removed: ' + targetToRemove, 'success');
                    }
                };
            })(target);
        
            targetItem.appendChild(targetInfo);
            targetItem.appendChild(actionButtons);
            targetItem.appendChild(attackBtn);
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
                    
                    // Check if it's a bonus village
                    if (isBonusVillage > 0 && settings.includeBonusVillages) {
                        shouldInclude = true;
                    } 
                    // Check if it's a barbarian village
                    else if (playerNumber === 0 && isBonusVillage === 0) {
                        shouldInclude = true;
                    } 
                    // Check if it's a player village and we include them
                    else if (settings.includePlayers && playerNumber > 0 && villagePoints <= settings.maxPlayerPoints) {
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
                                    points: villagePoints,
                                    isBonus: isBonusVillage > 0
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
        overlay.className = 'tw-attack-overlay';
        
        var selectionContainer = document.createElement('div');
        selectionContainer.id = 'villages-selection';
        selectionContainer.className = 'tw-attack-selection-container';
        
        var header = document.createElement('div');
        header.className = 'tw-attack-selection-header';
        
        var title = document.createElement('h3');
        title.textContent = '🎯 Select Villages for ' + currentWorld + ' (' + villages.length + ' available)';
        title.className = 'tw-attack-selection-title';
        
        var closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.className = 'tw-attack-selection-close-btn';
        closeBtn.onclick = function() { document.body.removeChild(overlay); };
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        var searchContainer = document.createElement('div');
        
        var searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '🔍 Search villages...';
        searchInput.className = 'tw-attack-search-input';
        
        searchContainer.appendChild(searchInput);
        
        var villagesContainer = document.createElement('div');
        villagesContainer.id = 'villages-container';
        villagesContainer.className = 'tw-attack-villages-container';
        
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
        
        // Select All container
        var selectAllContainer = document.createElement('div');
        selectAllContainer.className = 'tw-attack-select-all-container';
        
        var selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.id = 'select-all-checkbox';
        
        var selectAllLabel = document.createElement('label');
        selectAllLabel.htmlFor = 'select-all-checkbox';
        selectAllLabel.textContent = 'Select All';
        selectAllLabel.style.cursor = 'pointer';
        selectAllLabel.style.marginRight = '10px';
        
        var selectAllBtn = document.createElement('button');
        selectAllBtn.textContent = 'Select All';
        selectAllBtn.className = 'tw-attack-select-all-btn';
        
        var deselectAllBtn = document.createElement('button');
        deselectAllBtn.textContent = 'Deselect All';
        deselectAllBtn.className = 'tw-attack-select-all-btn';
        
        selectAllContainer.appendChild(selectAllCheckbox);
        selectAllContainer.appendChild(selectAllLabel);
        selectAllContainer.appendChild(selectAllBtn);
        selectAllContainer.appendChild(deselectAllBtn);
        
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
        selectionContainer.appendChild(selectAllContainer);
        selectionContainer.appendChild(villagesContainer);
        selectionContainer.appendChild(footer);
        overlay.appendChild(selectionContainer);
        document.body.appendChild(overlay);
        
        var selectedVillages = [];
        var allVillageCheckboxes = [];
        
        function updateVillagesList(filter) {
            villagesContainer.innerHTML = '';
            selectedVillages = [];
            allVillageCheckboxes = [];
            
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
                updateSelectAllCheckbox();
                return;
            }
            
            filtered.forEach(function(village, index) {
                var villageItem = document.createElement('div');
                villageItem.className = index % 2 === 0 ? 'tw-attack-village-item' : 'tw-attack-village-item tw-attack-village-item-alt';
                
                var villageInfo = document.createElement('div');
                villageInfo.className = 'tw-attack-village-info';
                
                var villageName = document.createElement('span');
                villageName.style.cssText = `
                    font-weight: bold;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-bottom: 2px;
                `;
                villageName.textContent = village.name + ' - ' + village.coords;
                
                // Add star for bonus villages or red circle for player villages
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
                villageDetails.className = 'tw-attack-village-details';
                
                var detailsText = 'Distance: ' + village.distance.toFixed(2);
                if (village.playerNumber > 0) {
                    detailsText += ' | Player village | Points: ' + village.points;
                } else if (village.isBonus) {
                    detailsText += ' | Bonus village';
                } else {
                    detailsText += ' | Barbarian village';
                }
                
                villageDetails.textContent = detailsText;
                
                villageInfo.appendChild(villageName);
                villageInfo.appendChild(villageDetails);
                
                var checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'tw-attack-village-checkbox';
                allVillageCheckboxes.push(checkbox);
                
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
                    updateSelectAllCheckbox();
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
            
            updateSelectedCount();
            updateSelectAllCheckbox();
        }
        
        function updateSelectedCount() {
            selectedCount.textContent = '📌 Selected: ' + selectedVillages.length;
        }
        
        function updateSelectAllCheckbox() {
            if (allVillageCheckboxes.length === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
                return;
            }
            
            var checkedCount = allVillageCheckboxes.filter(cb => cb.checked).length;
            if (checkedCount === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            } else if (checkedCount === allVillageCheckboxes.length) {
                selectAllCheckbox.checked = true;
                selectAllCheckbox.indeterminate = false;
            } else {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = true;
            }
        }
        
        selectAllCheckbox.onchange = function() {
            var shouldSelect = this.checked;
            allVillageCheckboxes.forEach(function(checkbox) {
                if (checkbox.checked !== shouldSelect) {
                    checkbox.checked = shouldSelect;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
        };
        
        selectAllBtn.onclick = function() {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.dispatchEvent(new Event('change'));
        };
        
        deselectAllBtn.onclick = function() {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.dispatchEvent(new Event('change'));
        };
        
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

    function showIgnoreListManagement() {
        var ignoreList = loadIgnoreFromStorage();
        
        var existingOverlay = document.getElementById('ignore-overlay');
        if (existingOverlay) existingOverlay.remove();
        
        var overlay = document.createElement('div');
        overlay.id = 'ignore-overlay';
        overlay.className = 'tw-attack-overlay';
        
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

    function createExternalAutoAttackCheckbox() {
        var existingCheckbox = document.getElementById('external-auto-attack');
        if (existingCheckbox) existingCheckbox.remove();
        
        var checkboxContainer = document.createElement('div');
        checkboxContainer.id = 'external-auto-attack';
        checkboxContainer.className = 'tw-attack-external-auto';
        checkboxContainer.style.top = settings.autoAttackPosition.y + 'px';
        checkboxContainer.style.left = settings.autoAttackPosition.x + 'px';
        
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
                setTimeout(function() {
                    autoAttackNext();
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
        
        // Initialize if not exists
        if (!settings.autoAttackBuilds) {
            settings.autoAttackBuilds = { A: true, B: false, C: false };
        }
        
        ['A', 'B', 'C'].forEach(function(buildKey) {
            var buildContainer = document.createElement('div');
            buildContainer.style.cssText = `display: flex; align-items: center; gap: 6px;`;
            
            var buildCheckbox = document.createElement('input');
            buildCheckbox.type = 'checkbox';
            buildCheckbox.id = 'external-build-' + buildKey.toLowerCase();
            buildCheckbox.checked = settings.autoAttackBuilds[buildKey];
            buildCheckbox.style.cssText = `transform: scale(1.1);`;
            
            var buildLabel = document.createElement('label');
            buildLabel.htmlFor = 'external-build-' + buildKey.toLowerCase();
            buildLabel.textContent = 'Build ' + buildKey;
            var color = buildKey === 'A' ? '#4CAF50' : buildKey === 'B' ? '#2196F3' : '#9C27B0';
            buildLabel.style.cssText = `font-size: 13px; color: ${color}; font-weight: bold; cursor: pointer;`;
            
            buildContainer.appendChild(buildCheckbox);
            buildContainer.appendChild(buildLabel);
            buildSelection.appendChild(buildContainer);
            
            buildCheckbox.onchange = function() {
                settings.autoAttackBuilds[buildKey] = this.checked;
                saveSettingsToStorage();
            };
        });
        
        var helpText = document.createElement('div');
        helpText.textContent = 'Drag to move';
        helpText.style.cssText = `font-size: 10px; color: #666; margin-top: 4px; text-align: center;`;
        
        checkboxContainer.appendChild(header);
        checkboxContainer.appendChild(buildSelection);
        checkboxContainer.appendChild(helpText);
        document.body.appendChild(checkboxContainer);
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

    // ===== MAIN EXECUTION =====
    
    currentWorld = getWorldName();
    console.log("Current world:", currentWorld);
    
    // Load all data
    loadSettingsFromStorage();
    loadTargetsFromStorage();
    loadBuildsFromStorage();
    loadTargetBuildsFromStorage();
    
    homeCoords = getCurrentVillageCoords();
    console.log("Home coords:", homeCoords);
    
    // Create main UI
    if (!checkForAntibot()) {
        createConfigUI();
        
        // Start auto-attack if enabled
        if (settings.autoAttackEnabled) {
            console.log("Auto-attack enabled on startup, starting in 2 seconds...");
            setTimeout(function() {
                autoAttackNext();
            }, 2000);
        }
    }
    
    // Run submit script check
    runSubmitScript();
    
    // Set up periodic check for submit script
    const submitCheckInterval = setInterval(runSubmitScript, 500);
    
    // Auto-stop submit check after 5 minutes
    setTimeout(() => {
        if (!submitScriptExecuted) {
            clearInterval(submitCheckInterval);
            console.log('⏰ Stopped submit script checking after timeout');
        }
    }, 5 * 60 * 1000);

})();
