(function() {
    // ===== STYLES =====
    const styles = `
        /* Main config styles */
        .tw-attack-config {
            background: white;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: Arial, sans-serif;
        }
        
        .tw-attack-title {
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 8px;
            font-size: 16px;
        }
        
        .tw-attack-toggle-btn {
            background: #666;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 10px;
            font-size: 12px;
            font-weight: bold;
            width: 100%;
            transition: background 0.2s;
        }
        
        .tw-attack-toggle-btn:hover {
            background: #555;
        }
        
        .tw-attack-auto-container {
            display: flex;
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .tw-attack-auto-btn {
            color: white;
            border: none;
            padding: 8px 0;
            border-radius: 6px;
            cursor: pointer;
            flex: 1;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .tw-attack-auto-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
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
            margin-bottom: 15px;
            padding: 12px;
            background-color: #f8f9fa;
            border-radius: 6px;
            border: 1px solid #e9ecef;
            font-size: 12px;
        }
        
        .tw-attack-section {
            margin-bottom: 15px;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #ffecb3;
            display: none;
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
            margin-bottom: 12px;
            color: #333;
            font-size: 14px;
        }
        
        .tw-attack-setting-row {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 8px;
            background: #fff;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
        }
        
        .tw-attack-setting-label {
            margin-right: 10px;
            font-weight: bold;
            min-width: 150px;
            font-size: 12px;
        }
        
        .tw-attack-input {
            padding: 4px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .tw-attack-save-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            width: 100%;
            margin-top: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: background 0.2s;
        }
        
        .tw-attack-save-btn:hover {
            background: #45a049;
        }
        
        .tw-attack-build-container {
            margin-bottom: 12px;
            padding: 10px;
            background: #fff;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
        }
        
        .tw-attack-build-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 2px solid #4CAF50;
        }
        
        .tw-attack-build-title {
            font-weight: bold;
            font-size: 14px;
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
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-weight: bold;
        }
        
        .tw-attack-build-save-btn:hover {
            opacity: 0.9;
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
            gap: 4px;
        }
        
        .tw-attack-troop-input {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .tw-attack-troop-label {
            font-size: 10px;
            font-weight: bold;
            color: #666;
            margin-bottom: 2px;
            text-align: center;
            width: 100%;
        }
        
        .tw-attack-troop-field {
            padding: 3px;
            border: 1px solid #ddd;
            border-radius: 3px;
            text-align: center;
            font-size: 11px;
            width: 40px;
            box-sizing: border-box;
        }
        
        .tw-attack-textarea {
            width: 100%;
            height: 80px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-family: monospace;
            font-size: 12px;
            resize: vertical;
            box-sizing: border-box;
            margin-bottom: 10px;
        }
        
        .tw-attack-parse-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: background 0.2s;
        }
        
        .tw-attack-parse-btn:hover {
            background: #45a049;
        }
        
        .tw-attack-status {
            font-size: 12px;
            margin-bottom: 12px;
            padding: 8px;
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
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #ddd;
        }
        
        .tw-attack-clear-btn {
            background: #ff4444;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 12px;
            width: 100%;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: background 0.2s;
        }
        
        .tw-attack-clear-btn:hover {
            background: #ff3333;
        }
        
        .tw-attack-target-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 8px;
            margin: 2px 0;
            background: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #e9ecef;
            transition: transform 0.2s, box-shadow 0.2s;
            font-size: 11px;
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
            gap: 12px;
        }
        
        .tw-attack-target-coords {
            font-family: monospace;
            font-weight: bold;
            font-size: 12px;
            color: #333;
            min-width: 60px;
        }
        
        .tw-attack-target-details {
            font-size: 10px;
            color: #666;
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .tw-attack-action-buttons {
            display: flex;
            gap: 4px;
            margin: 0 8px;
        }
        
        .tw-attack-action-btn {
            color: white;
            border: none;
            padding: 3px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-weight: bold;
            min-width: 24px;
            height: 20px;
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
            padding: 3px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            width: 24px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            transition: transform 0.2s, background 0.2s;
        }
        
        .tw-attack-ignore-btn:hover {
            background: #f57c00;
        }
        
        .tw-attack-remove-btn {
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 3px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-weight: bold;
            width: 24px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            transition: transform 0.2s, background 0.2s;
        }
        
        .tw-attack-remove-btn:hover {
            background: #ff5555;
        }
        
        .tw-attack-attack-btn {
            background: #ff4444;
            color: white;
            border: none;
            padding: 3px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            width: 24px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            transition: transform 0.2s, background 0.2s;
        }
        
        .tw-attack-attack-btn:hover {
            background: #ff3333;
        }
        
        .tw-attack-attack-btn:disabled {
            background: #cccccc;
            cursor: not-allowed;
            opacity: 0.5;
        }
        
        .tw-attack-bonus-star {
            color: #FFD700;
            font-size: 12px;
            margin-left: 4px;
        }
        
        .tw-attack-player-circle {
            color: #ff4444;
            font-size: 12px;
            margin-left: 4px;
        }
        
        .tw-attack-village-tag {
            font-size: 10px;
            padding: 1px 4px;
            border-radius: 8px;
            font-weight: bold;
            white-space: nowrap;
            display: inline-block;
        }
        
        .tw-attack-village-tag-bonus {
            background-color: #FFF8DC;
            color: #B8860B;
            border: 1px solid #FFD700;
        }
        
        .tw-attack-village-tag-player {
            background-color: #FFE6E6;
            color: #B22222;
            border: 1px solid #ff4444;
        }
        
        .tw-attack-village-tag-barbarian {
            background-color: #f0f0f0;
            color: #666;
            border: 1px solid #ccc;
        }
        
        .tw-attack-points-badge {
            font-size: 10px;
            background-color: #e3f2fd;
            color: #1976D2;
            padding: 1px 4px;
            border-radius: 8px;
            border: 1px solid #bbdefb;
            font-weight: bold;
            white-space: nowrap;
            display: inline-block;
        }
        
        .tw-attack-build-cooldown-indicator {
            font-size: 9px;
            padding: 1px 3px;
            border-radius: 3px;
            margin-left: 2px;
            font-weight: bold;
        }
        
        .tw-attack-build-cooldown-ready {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .tw-attack-build-cooldown-waiting {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        .tw-attack-build-cooldown-cooldown {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        /* Info village panel styles */
        .tw-attack-info-panel {
            background: white;
            border: 2px solid #4CAF50;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            width: 100%;
            max-width: 400px;
            box-sizing: border-box;
        }
        
        .tw-attack-info-title {
            margin-top: 0;
            margin-bottom: 12px;
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 8px;
            font-size: 16px;
        }
        
        .tw-attack-info-coords {
            font-family: monospace;
            font-weight: bold;
            font-size: 18px;
            color: #333;
            margin-bottom: 12px;
            text-align: center;
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #e9ecef;
        }
        
        .tw-attack-info-build-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .tw-attack-info-build-container {
            position: relative;
            display: inline-block;
        }
        
        .tw-attack-info-build-btn {
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
            min-width: 80px;
            position: relative;
        }
        
        .tw-attack-info-build-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }
        
        .tw-attack-info-build-btn.a {
            background: linear-gradient(to right, #ff416c, #ff4b2b);
        }
        
        .tw-attack-info-build-btn.b {
            background: linear-gradient(to right, #2196F3, #1976D2);
        }
        
        .tw-attack-info-build-btn.c {
            background: linear-gradient(to right, #9C27B0, #7B1FA2);
        }
        
        /* Disabled state - completely grayed out */
        .tw-attack-info-build-btn.disabled {
            background: linear-gradient(to right, #cccccc, #999999) !important;
            color: #666666 !important;
            cursor: not-allowed !important;
            opacity: 0.5 !important;
        }
        
        .tw-attack-info-build-btn.disabled:hover {
            transform: none !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        
        /* Enabled state */
        .tw-attack-info-build-btn.checked {
            box-shadow: 0 0 0 3px rgba(0,0,0,0.2);
            opacity: 1;
        }
        
        /* Disabled (not checked) but available state */
        .tw-attack-info-build-btn:not(.checked):not(.disabled) {
            opacity: 0.6;
        }
        
        /* On cooldown state */
        .tw-attack-info-build-btn.on-cooldown {
            opacity: 0.7;
            cursor: pointer; /* Still clickable to disable */
        }
        
        .tw-attack-info-build-btn.on-cooldown:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }
        
        .tw-attack-info-cooldown-indicator {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #ff6b6b;
            color: white;
            font-size: 9px;
            padding: 1px 4px;
            border-radius: 8px;
            border: 1px solid white;
            font-weight: bold;
            z-index: 2;
        }
        
        .tw-attack-info-cooldown-indicator.ready {
            background: #4CAF50;
        }
        
        .tw-attack-info-cooldown-indicator.disabled {
            background: #cccccc;
            color: #666666;
        }
        
        .tw-attack-info-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .tw-attack-info-action-btn {
            padding: 8px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 12px;
            border: none;
            color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
            flex: 1;
            max-width: 120px;
        }
        
        .tw-attack-info-action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }
        
        .tw-attack-info-action-btn:disabled {
            background: linear-gradient(to right, #cccccc, #999999) !important;
            color: #666666 !important;
            cursor: not-allowed !important;
            opacity: 0.5 !important;
            transform: none !important;
        }
        
        .tw-attack-info-action-btn:disabled:hover {
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        
        .tw-attack-info-ignore-btn {
            background: linear-gradient(to right, #ff9800, #f57c00);
        }
        
        .tw-attack-info-remove-btn {
            background: linear-gradient(to right, #ff4444, #ff3333);
        }
        
        .tw-attack-info-status {
            margin-top: 12px;
            padding: 6px;
            border-radius: 6px;
            display: none;
            font-size: 11px;
            text-align: center;
        }
        
        .tw-attack-info-status.tw-attack-status-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .tw-attack-info-status.tw-attack-status-error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        /* Submit loading overlay */
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

        @keyframes twSubmitSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Selection overlay styles */
        .tw-attack-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .tw-attack-selection-container {
            background: white;
            border-radius: 10px;
            padding: 20px;
            width: 600px;
            max-width: 90vw;
            max-height: 80vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .tw-attack-villages-container {
            flex: 1;
            overflow-y: auto;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 10px;
            background: #f8f9fa;
            min-height: 200px;
            margin: 10px 0;
        }
        
        .tw-attack-village-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 10px;
            margin: 4px 0;
            background: #fff;
            border-radius: 6px;
            border: 1px solid #e9ecef;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .tw-attack-village-item:hover {
            background-color: #e9ecef;
        }
        
        .tw-attack-village-item.selected {
            background-color: #e8f5e9;
        }
        
        .tw-attack-manage-btn {
            background: #ff9800;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 10px;
            width: 100%;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: background 0.2s;
        }
        
        .tw-attack-manage-btn:hover {
            background: #f57c00;
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
    var buildCooldownsKey = "twAttackBuildCooldowns";
    
    var defaultCooldown = 30;
    var homeCoords = "";
    var targetList = "";
    var currentWorld = "";
    var configVisible = false;
    var updateInterval = null;
    
    // Default builds with individual cooldowns and enabled state
    var defaultBuilds = {
        "A": { 
            spear: 0, sword: 0, axe: 0, spy: 0, light: 2, heavy: 0, ram: 0, catapult: 0, knight: 0,
            cooldown: defaultCooldown,
            enabled: true
        },
        "B": { 
            spear: 0, sword: 0, axe: 0, spy: 0, light: 0, heavy: 0, ram: 0, catapult: 0, knight: 0,
            cooldown: defaultCooldown,
            enabled: false
        },
        "C": { 
            spear: 0, sword: 0, axe: 0, spy: 0, light: 0, heavy: 0, ram: 0, catapult: 0, knight: 0,
            cooldown: defaultCooldown,
            enabled: false
        }
    };
    
    var troopBuilds = {};
    var targetBuilds = {};
    
    var settings = {
        autoAttack: true,
        includePlayers: false,
        maxPlayerPoints: 1000,
        autoAttackEnabled: false,
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
    
    function loadBuildCooldownsFromStorage() {
        try {
            var storedData = localStorage.getItem(buildCooldownsKey);
            if (storedData) {
                var allCooldowns = JSON.parse(storedData);
                if (allCooldowns[currentWorld]) {
                    return allCooldowns[currentWorld];
                }
            }
        } catch (e) {
            showError("Error loading build cooldowns");
        }
        return {};
    }
    
    function saveBuildCooldownsToStorage(buildCooldowns) {
        try {
            var storedData = localStorage.getItem(buildCooldownsKey);
            var allCooldowns = storedData ? JSON.parse(storedData) : {};
            allCooldowns[currentWorld] = buildCooldowns;
            localStorage.setItem(buildCooldownsKey, JSON.stringify(allCooldowns));
        } catch (e) {
            showError("Error saving build cooldowns");
        }
    }
    
    function getBuildCooldownInfo(target, buildKey) {
        var buildCooldowns = loadBuildCooldownsFromStorage();
        var currentTime = (new Date()).getTime();
        
        if (buildCooldowns[target] && buildCooldowns[target][buildKey]) {
            var lastAttackTime = buildCooldowns[target][buildKey];
            var build = troopBuilds[buildKey] || defaultBuilds[buildKey];
            var buildCooldownMinutes = build.cooldown || defaultCooldown;
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
            cooldown: (troopBuilds[buildKey] ? troopBuilds[buildKey].cooldown : null) || defaultCooldown
        };
    }
    
    function recordBuildAttack(target, buildKey) {
        // Record general attack history
        var history = getAttackHistory();
        history[target] = (new Date()).getTime();
        saveAttackHistory(history);
        
        // Record build-specific attack
        var buildCooldowns = loadBuildCooldownsFromStorage();
        if (!buildCooldowns[target]) {
            buildCooldowns[target] = {};
        }
        buildCooldowns[target][buildKey] = (new Date()).getTime();
        saveBuildCooldownsToStorage(buildCooldowns);
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
        
        // Also cleanup build-specific cooldowns
        var buildCooldowns = loadBuildCooldownsFromStorage();
        var buildCooldownsChanged = false;
        
        for (var target in buildCooldowns) {
            for (var buildKey in buildCooldowns[target]) {
                if ((currentTime - buildCooldowns[target][buildKey]) > 86400000) {
                    delete buildCooldowns[target][buildKey];
                    buildCooldownsChanged = true;
                }
            }
            if (Object.keys(buildCooldowns[target]).length === 0) {
                delete buildCooldowns[target];
                buildCooldownsChanged = true;
            }
        }
        
        if (buildCooldownsChanged) {
            saveBuildCooldownsToStorage(buildCooldowns);
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
            showError("Error loading targets");
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
            showError("Error saving targets");
        }
    }
    
    function loadBuildsFromStorage() {
        try {
            var storedData = localStorage.getItem(buildsStorageKey);
            if (storedData) {
                var allBuilds = JSON.parse(storedData);
                if (allBuilds[currentWorld]) {
                    troopBuilds = allBuilds[currentWorld];
                    ['A', 'B', 'C'].forEach(function(buildKey) {
                        if (!troopBuilds[buildKey]) {
                            troopBuilds[buildKey] = JSON.parse(JSON.stringify(defaultBuilds[buildKey]));
                        } else {
                            if (troopBuilds[buildKey].cooldown === undefined) {
                                troopBuilds[buildKey].cooldown = defaultCooldown;
                            }
                            if (troopBuilds[buildKey].enabled === undefined) {
                                troopBuilds[buildKey].enabled = buildKey === 'A';
                            }
                        }
                    });
                } else {
                    troopBuilds = JSON.parse(JSON.stringify(defaultBuilds));
                }
            } else {
                troopBuilds = JSON.parse(JSON.stringify(defaultBuilds));
            }
        } catch (e) {
            showError("Error loading builds");
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
            showError("Error saving builds");
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
            showError("Error loading target builds");
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
            showError("Error saving target builds");
        }
    }
    
    function getTargetBuilds(target) {
        if (!targetBuilds[target]) {
            var enabledBuilds = {};
            ['A', 'B', 'C'].forEach(function(buildKey) {
                var build = troopBuilds[buildKey] || defaultBuilds[buildKey];
                enabledBuilds[buildKey] = build.enabled !== false;
            });
            targetBuilds[target] = enabledBuilds;
        }
        return targetBuilds[target];
    }
    
    function setTargetBuild(target, buildKey, enabled) {
        if (!targetBuilds[target]) {
            targetBuilds[target] = {};
            ['A', 'B', 'C'].forEach(function(bk) {
                var build = troopBuilds[bk] || defaultBuilds[bk];
                targetBuilds[target][bk] = build.enabled !== false;
            });
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
                    
                    if (!settings.autoAttackBuilds) {
                        settings.autoAttackBuilds = { A: true, B: false, C: false };
                    }
                    if (settings.includePlayers === undefined) settings.includePlayers = false;
                    if (settings.maxPlayerPoints === undefined) settings.maxPlayerPoints = 1000;
                    if (settings.autoAttackEnabled === undefined) settings.autoAttackEnabled = false;
                    if (settings.includeBonusVillages === undefined) settings.includeBonusVillages = true;
                } else {
                    settings = {
                        cooldown: defaultCooldown,
                        autoAttack: true,
                        includePlayers: false,
                        maxPlayerPoints: 1000,
                        autoAttackEnabled: false,
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
                    autoAttackBuilds: { A: true, B: false, C: false },
                    includeBonusVillages: true
                };
            }
        } catch (e) {
            showError("Error loading settings");
            settings = {
                cooldown: defaultCooldown,
                autoAttack: true,
                includePlayers: false,
                maxPlayerPoints: 1000,
                autoAttackEnabled: false,
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
            showError("Error saving settings");
        }
    }
    
    function saveAllSettings() {
        saveSettingsToStorage();
        showStatus('All settings saved for ' + currentWorld, 'success');
    }

    // ===== VILLAGE DATA STORAGE =====
    var villageDataStorageKey = "twAttackVillageData";
    
    function loadVillageDataFromStorage() {
        try {
            var storedData = localStorage.getItem(villageDataStorageKey);
            if (storedData) {
                var allVillageData = JSON.parse(storedData);
                if (allVillageData[currentWorld]) {
                    return allVillageData[currentWorld];
                }
            }
        } catch (e) {
            showError("Error loading village data");
        }
        return {};
    }
    
    function saveVillageDataToStorage(villageData) {
        try {
            var storedData = localStorage.getItem(villageDataStorageKey);
            var allVillageData = storedData ? JSON.parse(storedData) : {};
            allVillageData[currentWorld] = villageData;
            localStorage.setItem(villageDataStorageKey, JSON.stringify(allVillageData));
        } catch (e) {
            showError("Error saving village data");
        }
    }
    
    function getVillageData(target) {
        var villageData = loadVillageDataFromStorage();
        var data = villageData[target];
        
        if (!data) {
            return { 
                name: "Barbarian Village", 
                points: 0, 
                playerNumber: 0, 
                isBonus: false 
            };
        }
        
        return {
            name: data.name || "Barbarian Village",
            points: data.points || 0,
            playerNumber: data.playerNumber || 0,
            isBonus: data.isBonus || false
        };
    }
    
    function saveVillageData(target, data) {
        var villageData = loadVillageDataFromStorage();
        villageData[target] = data;
        saveVillageDataToStorage(villageData);
    }
    
    function updateVillageDataForExistingTargets() {
        var targets = getCurrentTargets();
        var updatedCount = 0;
        
        targets.forEach(function(target) {
            var villageData = getVillageData(target);
            if (villageData.name === "Unknown" || 
                villageData.name === "Unknown Village" ||
                villageData.name.startsWith("Village at ")) {
                
                var newName = "";
                
                if (villageData.isBonus) {
                    newName = "Bonus Village";
                } else if (villageData.playerNumber > 0) {
                    newName = "Player Village";
                } else {
                    newName = "Barbarian Village";
                }
                
                saveVillageData(target, {
                    name: newName,
                    points: villageData.points || 0,
                    playerNumber: villageData.playerNumber || 0,
                    isBonus: villageData.isBonus || false
                });
                updatedCount++;
            }
        });
        
        if (updatedCount > 0) {
            updateTargetsListUI();
        }
    }
    
    function addToTargetList(targetToAdd, villageData) {
        var targets = targetList.split(' ').filter(Boolean);
        if (targets.indexOf(targetToAdd) === -1) {
            targets.push(targetToAdd);
            updateTargetList(targets.join(' '));
            
            if (villageData) {
                saveVillageData(targetToAdd, villageData);
            } else {
                var existingData = getVillageData(targetToAdd);
                if (existingData.name === "Barbarian Village" || 
                    existingData.name === "Unknown" || 
                    existingData.name === "Unknown Village") {
                    
                    saveVillageData(targetToAdd, {
                        name: "Barbarian Village",
                        points: 0,
                        playerNumber: 0,
                        isBonus: false
                    });
                }
            }
            
            if (!targetBuilds[targetToAdd]) {
                targetBuilds[targetToAdd] = { A: true, B: true, C: true };
                saveTargetBuildsToStorage();
            }
            return true;
        }
        return false;
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
            showError("Error getting worlds");
        }
        return [];
    }
    
    function updateTargetList(newTargetList) {
        targetList = newTargetList;
        saveTargetsToStorage();
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
            showError("Error loading ignore list");
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
            showError("Error saving ignore list");
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
                showStatus("Only " + actualCount + " " + unitType + " available (requested " + count + ")", 'error');
            }
            
            // Set session storage marker
            if (actualCount > 0) {
                var worldName = getWorldName();
                var key = submitMarkerKey + "_" + worldName;
                var timestamp = new Date().getTime();
                sessionStorage.setItem(key, timestamp.toString());
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
        
        return availableTroops;
    }
    
    function clickAttackButton() {
        if (checkForAntibot()) return false;
        
        var doc = window.frames.length > 0 ? window.main.document : document;
        var submitButton = doc.querySelector('input[type="submit"], button[type="submit"], input[name="target_attack"]');
        if (submitButton) {
            // Set session storage marker
            var worldName = getWorldName();
            var key = submitMarkerKey + "_" + worldName;
            var timestamp = new Date().getTime();
            sessionStorage.setItem(key, timestamp.toString());
            
            submitButton.click();
            return true;
        } else if (doc.forms[0]) {
            // Set session storage marker
            var worldName = getWorldName();
            var key = submitMarkerKey + "_" + worldName;
            var timestamp = new Date().getTime();
            sessionStorage.setItem(key, timestamp.toString());
            
            doc.forms[0].submit();
            return true;
        }
        return false;
    }
    
    function attackTarget(target, buildKey) {
        if (checkForAntibot()) return;
        
        var currentUrl = location.href;
        var doc = window.frames.length > 0 ? window.main.document : document;
        
        // Check if we're on the place page WITHOUT try=confirm
        if (currentUrl.indexOf("screen=place") > -1 && 
            currentUrl.indexOf("try=confirm") < 0 && 
            doc.forms[0]) {
            
            var availableTroops = getAvailableTroops();
            var build = troopBuilds[buildKey] || defaultBuilds[buildKey] || defaultBuilds["A"];
            
            var hasEnoughTroops = true;
            var missingTroops = [];
            
            var troopTypesToCheck = ['spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult', 'knight'];
            
            for (var i = 0; i < troopTypesToCheck.length; i++) {
                var troopType = troopTypesToCheck[i];
                var troopCount = build[troopType] || 0;
                
                if (troopCount > 0) {
                    var available = availableTroops[troopType] || 0;
                    if (available < troopCount) {
                        hasEnoughTroops = false;
                        missingTroops.push({
                            type: troopType,
                            needed: troopCount,
                            available: available
                        });
                    }
                }
            }
            
            if (!hasEnoughTroops) {
                showStatus('Not enough troops for Build ' + buildKey + ' on ' + target + '. Skipping village.', 'error');
                
                recordBuildAttack(target, buildKey);
                
                if (settings.autoAttackEnabled) {
                    setTimeout(function() {
                        autoAttackNext();
                    }, 1000);
                }
                
                return;
            }
            
            var coords = target.split("|");
            doc.forms[0].x.value = coords[0];
            doc.forms[0].y.value = coords[1];
            
            setUnitCount(doc.forms[0].spear, build.spear || 0);
            setUnitCount(doc.forms[0].sword, build.sword || 0);
            setUnitCount(doc.forms[0].axe, build.axe || 0);
            setUnitCount(doc.forms[0].spy, build.spy || 0);
            setUnitCount(doc.forms[0].light, build.light || 0);
            setUnitCount(doc.forms[0].heavy, build.heavy || 0);
            setUnitCount(doc.forms[0].ram, build.ram || 0);
            setUnitCount(doc.forms[0].catapult, build.catapult || 0);
            setUnitCount(doc.forms[0].knight, build.knight || 0);
            
            recordBuildAttack(target, buildKey);
            showStatus('Target ' + target + ' prepared with Build ' + buildKey + '! Click "Place" button to send.', 'success');
            updateTargetsListUI();
            
            // Auto-click submit button
            setTimeout(function() {
                if (clickAttackButton()) {
                    showStatus('Auto-attack: Attack sent to ' + target + ' with Build ' + buildKey, 'success');
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
                var buildCooldownInfo = getBuildCooldownInfo(target, buildKey);
                if (!buildCooldownInfo.onCooldown) {
                    return buildKey;
                }
            }
        }
        return null;
    }
    
    function attackTargetWithAvailableBuild(target) {
        var buildKey = getFirstAvailableBuildForTarget(target);
        if (buildKey) {
            attackTarget(target, buildKey);
        } else {
            showStatus('All builds for target ' + target + ' are on cooldown', 'error');
        }
    }
    
    function autoAttackNext() {
        if (checkForAntibot()) return;
        cleanupOldHistory();
        
        var targets = targetList.split(" ").filter(Boolean);
        if (targets.length === 0) {
            showStatus('No targets in list for auto-attack', 'error');
            
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
        
        var availableTroops = {};
        try {
            availableTroops = getAvailableTroops();
        } catch (e) {
            showError("Could not get available troops");
        }
        
        do {
            var currentTarget = targets[targetIndex];
            
            var anyBuildOffCooldown = false;
            var targetBuildSettings = getTargetBuilds(currentTarget);
            for (var buildKey in targetBuildSettings) {
                if (targetBuildSettings[buildKey] && settings.autoAttackBuilds[buildKey]) {
                    var buildCooldownInfo = getBuildCooldownInfo(currentTarget, buildKey);
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
                    if (targetBuildSettings[buildKey] && settings.autoAttackBuilds[buildKey]) {
                        var buildCooldownInfo = getBuildCooldownInfo(currentTarget, buildKey);
                        
                        if (!buildCooldownInfo.onCooldown) {
                            var build = troopBuilds[buildKey] || defaultBuilds[buildKey];
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
            setCookie(cookieName, nextIndex.toString(), 365);
            attackTarget(selectedTarget, selectedBuild);
        } else {
            var anyVillageHasEnabledBuilds = false;
            var anyVillageOffCooldown = false;
            
            for (var i = 0; i < targets.length; i++) {
                var target = targets[i];
                var targetBuildSettings = getTargetBuilds(target);
                
                for (var buildKey in targetBuildSettings) {
                    if (targetBuildSettings[buildKey] && settings.autoAttackBuilds[buildKey]) {
                        var buildCooldownInfo = getBuildCooldownInfo(target, buildKey);
                        if (!buildCooldownInfo.onCooldown) {
                            anyVillageOffCooldown = true;
                            anyVillageHasEnabledBuilds = true;
                            break;
                        }
                    }
                }
                
                if (anyVillageHasEnabledBuilds) break;
            }
            
            if (anyVillageOffCooldown && anyVillageHasEnabledBuilds) {
                showStatus('All available villages skipped due to troop shortages. Waiting 30 seconds...', 'info');
                
                setTimeout(function() {
                    autoAttackNext();
                }, 30000);
            } else if (anyVillageOffCooldown && !anyVillageHasEnabledBuilds) {
                showStatus('Villages available but no builds enabled for them. Check build settings.', 'error');
                
                setTimeout(function() {
                    autoAttackNext();
                }, 60000);
            } else {
                var shortestCooldown = Infinity;
                var shortestCooldownTarget = null;
                var shortestCooldownMinutes = 0;
                
                targets.forEach(function(target) {
                    var targetBuildSettings = getTargetBuilds(target);
                    for (var buildKey in targetBuildSettings) {
                        if (targetBuildSettings[buildKey] && settings.autoAttackBuilds[buildKey]) {
                            var buildCooldownInfo = getBuildCooldownInfo(target, buildKey);
                            if (buildCooldownInfo.onCooldown && buildCooldownInfo.minutesLeft < shortestCooldown) {
                                shortestCooldown = buildCooldownInfo.minutesLeft;
                                shortestCooldownTarget = target;
                                shortestCooldownMinutes = buildCooldownInfo.minutesLeft;
                            }
                        }
                    }
                });
                
                if (shortestCooldownTarget) {
                    showStatus('All targets on cooldown. Waiting for ' + shortestCooldownTarget + ' (' + shortestCooldownMinutes + 'm left)', 'info');
                    
                    var checkDelay = Math.max(60000, shortestCooldownMinutes * 60000);
                    
                    setTimeout(function() {
                        autoAttackNext();
                    }, checkDelay);
                } else {
                    showStatus('No targets available for auto-attack', 'error');
                }
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
            sessionStorage.removeItem(markerKey);
            return true;
        }
        
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
        if (submitScriptExecuted) {
            return;
        }
        
        if (!checkSessionMarker()) {
            submitScriptExecuted = true;
            return;
        }

        if (!settings.autoAttackEnabled) {
            submitScriptExecuted = true;
            return;
        }
        
        if (checkForAntibot()) {
            submitScriptExecuted = true;
            return;
        }
        
        if (!window.location.href.includes(SUBMIT_CONFIG.urlPattern)) {
            return;
        }
        
        submitScriptExecuted = true;
        
        createSubmitLoadingOverlay();
        updateSubmitStatus('✅ Submit page detected!');
        
        const initialDelay = Math.floor(
            Math.random() * (SUBMIT_CONFIG.initialDelay.max - SUBMIT_CONFIG.initialDelay.min + 1)
        ) + SUBMIT_CONFIG.initialDelay.min;
        
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
                
                const button = document.getElementById(SUBMIT_CONFIG.elementId);
                
                if (button) {
                    updateSubmitStatus(`✅ Found button! Clicking...`, false, true);
                    
                    setTimeout(() => {
                        button.click();
                        updateSubmitStatus('🎉 Success! Button clicked.', false, true);
                        
                        setTimeout(() => {
                            removeSubmitLoadingOverlay();
                        }, 1500);
                        
                    }, 100);
                    
                    return;
                }
                
                if (attempts < SUBMIT_CONFIG.maxRetries) {
                    updateSubmitStatus(`⚠️ Button not found. Retrying...`);
                    
                    setTimeout(attemptClick, SUBMIT_CONFIG.retryDelay);
                } else {
                    updateSubmitStatus(`❌ Failed after ${SUBMIT_CONFIG.maxRetries} attempts.`, true);
                    
                    setTimeout(() => {
                        removeSubmitLoadingOverlay();
                    }, 3000);
                }
            }
            
            attemptClick();
            
        }, initialDelay);
    }
    
    // ===== INFO VILLAGE PAGE FUNCTIONS =====
    
    function createInfoVillagePanel() {
        // Find coordinates on the page
        var coords = findCoordinatesOnPage();
        if (!coords) {
            showError("Could not find village coordinates on info_village page");
            return;
        }
        
        // Check if panel already exists
        var existingPanel = document.getElementById('tw-attack-info-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        // Check if village is in target list
        var isInTargetList = getCurrentTargets().includes(coords);
        var targetBuildSettings = isInTargetList ? getTargetBuilds(coords) : { A: false, B: false, C: false };
        
        // Get build data from settings to check which builds are actually enabled
        var buildSettings = settings.autoAttackBuilds || { A: true, B: false, C: false };
        
        // Create panel
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
        
        // Create build buttons with cooldown indicators
        ['A', 'B', 'C'].forEach(function(buildKey) {
            var isBuildEnabledInSettings = buildSettings[buildKey] !== false;
            var isBuildEnabledForTarget = targetBuildSettings[buildKey];
            var cooldownInfo = getBuildCooldownInfo(coords, buildKey);
            var isOnCooldown = cooldownInfo.onCooldown;
            
            var btnContainer = document.createElement('div');
            btnContainer.className = 'tw-attack-info-build-container';
            btnContainer.style.cssText = 'position: relative; display: inline-block;';
            
            var btn = document.createElement('button');
            btn.className = 'tw-attack-info-build-btn ' + buildKey.toLowerCase();
            btn.textContent = 'Build ' + buildKey;
            btn.dataset.build = buildKey;
            
            // Check if build is enabled in settings
            if (!isBuildEnabledInSettings) {
                btn.classList.add('disabled');
                btn.disabled = true;
                btn.title = 'Build ' + buildKey + ' is disabled in settings';
            } else {
                // Check if build is enabled for this target
                if (isBuildEnabledForTarget) {
                    btn.classList.add('checked');
                    btn.title = 'Build ' + buildKey + ' enabled for this village';
                } else {
                    btn.title = 'Build ' + buildKey + ' disabled for this village';
                }
                
                // Add cooldown information to title
                if (isOnCooldown) {
                    btn.title += ' (On cooldown: ' + cooldownInfo.minutesLeft + 'm remaining)';
                } else {
                    btn.title += ' (Ready, cooldown: ' + cooldownInfo.cooldown + 'm)';
                }
            }
            
            // Add cooldown indicator
            var cooldownIndicator = document.createElement('span');
            cooldownIndicator.className = 'tw-attack-info-cooldown-indicator';
            
            if (!isBuildEnabledInSettings) {
                // Build disabled in settings - gray indicator
                cooldownIndicator.textContent = '✕';
                cooldownIndicator.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #cccccc;
                    color: #666;
                    font-size: 9px;
                    padding: 1px 3px;
                    border-radius: 8px;
                    border: 1px solid white;
                    font-weight: bold;
                    z-index: 2;
                `;
            } else if (isOnCooldown) {
                // Build on cooldown - red indicator
                cooldownIndicator.textContent = cooldownInfo.minutesLeft + 'm';
                cooldownIndicator.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #ff6b6b;
                    color: white;
                    font-size: 9px;
                    padding: 1px 3px;
                    border-radius: 8px;
                    border: 1px solid white;
                    font-weight: bold;
                    z-index: 2;
                `;
                if (isBuildEnabledForTarget) {
                    btn.style.opacity = '0.7';
                }
            } else {
                // Build ready - green indicator
                cooldownIndicator.textContent = '✓';
                cooldownIndicator.style.cssText = `
                    position: absolute;
                    top: -5px;
                    right: -5px;
                    background: #4CAF50;
                    color: white;
                    font-size: 9px;
                    padding: 1px 3px;
                    border-radius: 8px;
                    border: 1px solid white;
                    font-weight: bold;
                    z-index: 2;
                `;
            }
            
            btnContainer.appendChild(btn);
            btnContainer.appendChild(cooldownIndicator);
            
            btn.onclick = (function(buildKey, coords, isBuildEnabledInSettings, isBuildEnabledForTarget, isOnCooldown) {
                return function() {
                    // Don't do anything if build is disabled in settings
                    if (!isBuildEnabledInSettings) {
                        showStatus('Build ' + buildKey + ' is disabled in settings. Enable it in the attack config first.', 'error');
                        return;
                    }
                    
                    var isChecked = this.classList.contains('checked');
                    
                    if (!isInTargetList && !isChecked) {
                        // Add to target list with this build enabled
                        var villageData = {
                            name: "Village from Info Page",
                            points: 0,
                            playerNumber: 0,
                            isBonus: false
                        };
                        addToTargetList(coords, villageData);
                        setTargetBuild(coords, buildKey, true);
                        isInTargetList = true;
                        this.classList.add('checked');
                        showStatus('Village ' + coords + ' added to target list with Build ' + buildKey + ' enabled', 'success');
                        
                        // Refresh the panel to update cooldown indicator
                        setTimeout(createInfoVillagePanel, 100);
                    } else if (isInTargetList) {
                        // Toggle build for existing target
                        var newState = !isChecked;
                        setTargetBuild(coords, buildKey, newState);
                        
                        if (newState) {
                            this.classList.add('checked');
                            showStatus('Build ' + buildKey + ' enabled for ' + coords, 'success');
                        } else {
                            this.classList.remove('checked');
                            showStatus('Build ' + buildKey + ' disabled for ' + coords, 'success');
                        }
                        
                        // Refresh the panel to update visual state
                        setTimeout(createInfoVillagePanel, 100);
                    }
                };
            })(buildKey, coords, isBuildEnabledInSettings, isBuildEnabledForTarget, isOnCooldown);
            
            buildButtons.appendChild(btnContainer);
        });
        
        var actionButtons = document.createElement('div');
        actionButtons.className = 'tw-attack-info-actions';
        
        var ignoreBtn = document.createElement('button');
        ignoreBtn.className = 'tw-attack-info-action-btn tw-attack-info-ignore-btn';
        ignoreBtn.textContent = 'Ignore';
        ignoreBtn.onclick = function() {
            if (addToIgnoreList(coords)) {
                if (isInTargetList) {
                    removeFromTargetList(coords);
                }
                showStatus('Village ' + coords + ' added to ignore list', 'success');
                panel.remove();
            }
        };
        
        var removeBtn = document.createElement('button');
        removeBtn.className = 'tw-attack-info-action-btn tw-attack-info-remove-btn';
        removeBtn.textContent = isInTargetList ? 'Remove' : 'Not in List';
        if (!isInTargetList) {
            removeBtn.disabled = true;
            removeBtn.style.opacity = '0.5';
            removeBtn.style.cursor = 'not-allowed';
        }
        removeBtn.onclick = function() {
            if (isInTargetList) {
                if (removeFromTargetList(coords)) {
                    showStatus('Village ' + coords + ' removed from target list', 'success');
                    panel.remove();
                }
            }
        };
        
        var statusMsg = document.createElement('div');
        statusMsg.id = 'info-status';
        statusMsg.className = 'tw-attack-info-status';
        
        actionButtons.appendChild(ignoreBtn);
        actionButtons.appendChild(removeBtn);
        
        panel.appendChild(title);
        panel.appendChild(coordsDisplay);
        panel.appendChild(buildButtons);
        panel.appendChild(actionButtons);
        panel.appendChild(statusMsg);
        
        // Find the minimap div and insert panel right after it
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
        
        // Show status if village is already in target list
        if (isInTargetList) {
            // Check which builds are enabled for this target
            var enabledBuilds = [];
            ['A', 'B', 'C'].forEach(function(buildKey) {
                if (targetBuildSettings[buildKey] && buildSettings[buildKey]) {
                    enabledBuilds.push(buildKey);
                }
            });
            
            if (enabledBuilds.length > 0) {
                showStatus('Village in target list. Enabled builds: ' + enabledBuilds.join(', '), 'success');
            } else {
                showStatus('Village in target list but no builds enabled', 'error');
            }
        }
    }
    
    // Helper function to show status in info panel
    function showStatus(message, type) {
        // Try to show in info panel status first
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
                default:
                    statusMsg.classList.add('tw-attack-status-info');
            }
            
            setTimeout(function() {
                statusMsg.style.display = 'none';
            }, 5000);
        }
        
        // Also show in main status if available
        var mainStatus = document.getElementById('parse-status');
        if (mainStatus) {
            mainStatus.textContent = message;
            mainStatus.style.display = 'block';
            mainStatus.className = 'tw-attack-status';
            
            switch(type) {
                case 'success':
                    mainStatus.classList.add('tw-attack-status-success');
                    break;
                case 'error':
                    mainStatus.classList.add('tw-attack-status-error');
                    break;
                default:
                    mainStatus.classList.add('tw-attack-status-info');
            }
            
            setTimeout(function() {
                mainStatus.style.display = 'none';
            }, 5000);
        }
    }
   
    function findCoordinatesOnPage() {
        // Check if we're on an info_village page
        if (!window.location.href.includes('&screen=info_village')) {
            return null;
        }
              
        var contentValue = document.querySelector('td#content_value');
        if (contentValue) {
            // Get all text from content_value
            var allText = contentValue.textContent;
            
            // Look for coordinates pattern
            var matches = allText.match(/(\d+)\s*\|\s*(\d+)/g);
            if (matches) {
                // Take the first match that looks like valid coordinates
                for (var i = 0; i < matches.length; i++) {
                    var match = matches[i].match(/(\d+)\s*\|\s*(\d+)/);
                    if (match) {
                        var x = parseInt(match[1]);
                        var y = parseInt(match[2]);
                        
                        // Coordinates are usually within reasonable bounds
                        if (x >= 0 && x <= 1000 && y >= 0 && y <= 1000) {
                            // Check if it's isolated (not part of a larger number)
                            var beforeMatch = allText.substring(0, allText.indexOf(matches[i]));
                            var afterMatch = allText.substring(allText.indexOf(matches[i]) + matches[i].length);
                            
                            // If there's a digit before or after, it might not be coordinates
                            if (!beforeMatch.match(/\d$/) && !afterMatch.match(/^\d/)) {
                                return match[1].trim() + '|' + match[2].trim();
                            }
                        }
                    }
                }
            }
        }
        
        return null;
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
        
        var infoSection = document.createElement('div');
        infoSection.id = 'world-info';
        infoSection.className = 'tw-attack-world-info';
        
        var worldInfo = document.createElement('div');
        worldInfo.innerHTML = '<strong>🌍 World:</strong> ' + currentWorld;
        worldInfo.style.marginBottom = '6px';
        
        var villageInfo = document.createElement('div');
        villageInfo.innerHTML = '<strong>🏠 Current Village:</strong> ' + (homeCoords || 'Not found');
        villageInfo.style.marginBottom = '8px';
        villageInfo.style.color = '#666';
        
        var villageUrl = document.createElement('div');
        villageUrl.style.cssText = `margin-top: 10px; padding-top: 10px; border-top: 1px dashed #ddd;`;
        
        var urlLink = document.createElement('a');
        urlLink.href = getVillageTxtUrl();
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
            
            var includePlayersSetting = document.createElement('div');
            includePlayersSetting.className = 'tw-attack-setting-row';
            
            var includePlayersLabel = document.createElement('label');
            includePlayersLabel.textContent = 'Include players villages: ';
            includePlayersLabel.className = 'tw-attack-setting-label';
            
            var includePlayersCheckbox = document.createElement('input');
            includePlayersCheckbox.type = 'checkbox';
            includePlayersCheckbox.checked = settings.includePlayers;
            includePlayersCheckbox.style.cssText = `transform: scale(1.2); margin-right: 8px;`;
            
            includePlayersSetting.appendChild(includePlayersLabel);
            includePlayersSetting.appendChild(includePlayersCheckbox);
            
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
            maxPointsInput.style.width = '70px';
            
            maxPointsSetting.appendChild(maxPointsLabel);
            maxPointsSetting.appendChild(maxPointsInput);
            
            var includeBonusSetting = document.createElement('div');
            includeBonusSetting.className = 'tw-attack-setting-row';
            
            var includeBonusLabel = document.createElement('label');
            includeBonusLabel.textContent = 'Include bonus villages: ';
            includeBonusLabel.className = 'tw-attack-setting-label';
            
            var includeBonusCheckbox = document.createElement('input');
            includeBonusCheckbox.type = 'checkbox';
            includeBonusCheckbox.checked = settings.includeBonusVillages;
            includeBonusCheckbox.style.cssText = `transform: scale(1.2); margin-right: 8px;`;
            
            includeBonusSetting.appendChild(includeBonusLabel);
            includeBonusSetting.appendChild(includeBonusCheckbox);
            
            settingsContainer.appendChild(includePlayersSetting);
            settingsContainer.appendChild(maxPointsSetting);
            settingsContainer.appendChild(includeBonusSetting);
            
            var saveAllBtn = document.createElement('button');
            saveAllBtn.textContent = '💾 Save All Settings';
            saveAllBtn.className = 'tw-attack-save-btn';
            
            saveAllBtn.onclick = function() {
                settings.includePlayers = includePlayersCheckbox.checked;
                settings.maxPlayerPoints = parseInt(maxPointsInput.value) || 1000;
                settings.includeBonusVillages = includeBonusCheckbox.checked;
                
                saveAllSettings();
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
                
                var buildTitleContainer = document.createElement('div');
                buildTitleContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';
                
                var enabledCheckbox = document.createElement('input');
                enabledCheckbox.type = 'checkbox';
                enabledCheckbox.checked = build.enabled !== false;
                enabledCheckbox.style.transform = 'scale(1.1)';
                enabledCheckbox.dataset.build = buildKey;
                
                var buildTitle = document.createElement('div');
                buildTitle.className = 'tw-attack-build-title';
                if (buildKey === 'B') buildTitle.classList.add('tw-attack-build-title-b');
                if (buildKey === 'C') buildTitle.classList.add('tw-attack-build-title-c');
                buildTitle.textContent = 'Build ' + buildKey;
                buildTitle.style.fontSize = '13px';
                
                enabledCheckbox.onchange = function() {
                    if (!troopBuilds[buildKey]) {
                        troopBuilds[buildKey] = JSON.parse(JSON.stringify(defaultBuilds[buildKey]));
                    }
                    troopBuilds[buildKey].enabled = this.checked;
                };
                
                buildTitleContainer.appendChild(enabledCheckbox);
                buildTitleContainer.appendChild(buildTitle);
                
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
                cooldownInput.value = build.cooldown || defaultCooldown;
                cooldownInput.style.cssText = 'width: 45px; padding: 2px; font-size: 11px;';
                cooldownInput.dataset.build = buildKey;
                
                cooldownInput.onchange = function() {
                    if (!troopBuilds[buildKey]) {
                        troopBuilds[buildKey] = JSON.parse(JSON.stringify(defaultBuilds[buildKey]));
                    }
                    troopBuilds[buildKey].cooldown = parseInt(this.value) || defaultCooldown;
                };
                
                cooldownContainer.appendChild(cooldownLabel);
                cooldownContainer.appendChild(cooldownInput);
                
                buildTitleContainer.appendChild(cooldownContainer);
                
                var saveBtn = document.createElement('button');
                saveBtn.textContent = '💾';
                saveBtn.className = 'tw-attack-build-save-btn';
                if (buildKey === 'B') saveBtn.classList.add('tw-attack-build-save-btn-b');
                if (buildKey === 'C') saveBtn.classList.add('tw-attack-build-save-btn-c');
                saveBtn.style.padding = '4px 6px';
                saveBtn.style.fontSize = '10px';
                
                saveBtn.onclick = (function(key) {
                    return function() {
                        saveBuild(key);
                    };
                })(buildKey);
                
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
            showStatus('Build ' + buildKey + ' saved', 'success');
        }
        
        var pasteSection = document.createElement('div');
        pasteSection.style.marginBottom = '15px';
        
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
        
        var savedTextKey = 'villageTxtContent_' + currentWorld;
        var savedText = localStorage.getItem(savedTextKey);
        if (savedText) pasteTextarea.value = savedText;
            
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
        targetsTitle.style.marginBottom = '12px';
        targetsTitle.style.color = '#333';
        targetsTitle.style.fontSize = '14px';
        
        var targetsList = document.createElement('div');
        targetsList.id = 'targets-list';
        
        targetsContainer.appendChild(targetsTitle);
        targetsContainer.appendChild(targetsList);
        
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
            // Fallback to body
            document.body.appendChild(uiContainer);
        }
        
        updateTargetsListUI();
        startAutoUpdate();
        
        function toggleConfigVisibility() {
            var sectionsToHide = [settingsSection, buildsSection, pasteSection];
            var clearBtn = targetsList.querySelector('.tw-attack-clear-btn');
            
            sectionsToHide.forEach(function(section) {
                section.style.display = configVisible ? 'block' : 'none';
            });
            
            if (clearBtn) clearBtn.style.display = configVisible ? 'block' : 'none';
        }
        
        toggleConfigVisibility();
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
                    
                    if (isBonusVillage > 0 && settings.includeBonusVillages) {
                        shouldInclude = true;
                    } 
                    else if (playerNumber === 0 && isBonusVillage === 0) {
                        shouldInclude = true;
                    } 
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
            showStatus('Error parsing village.txt content: ' + error.message, 'error');
        }
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
        
        setTimeout(function() {
            statusMsg.style.display = 'none';
        }, 5000);
    }
    
    function showError(message) {
        showStatus(message, 'error');
    }
    
    function updateTargetsListUI() {
        var targetsList = document.getElementById('targets-list');
        if (!targetsList) return;
        
        targetsList.innerHTML = '';
        var targets = targetList.split(' ').filter(Boolean);
        
        if (targets.length === 0) {
            targetsList.innerHTML = '<div style="color: #999; font-style: italic; padding: 15px; text-align: center; background: #f8f9fa; border-radius: 6px; border: 1px dashed #ddd; font-size: 12px;">No targets in list for ' + currentWorld + '</div>';
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
            var villageData = getVillageData(target);
            var targetBuildSettings = getTargetBuilds(target);
            
            var villageInfoContainer = document.createElement('div');
            villageInfoContainer.style.cssText = `
                display: flex;
                flex-direction: column;
                min-width: 150px;
                flex: 1;
            `;
            
            var firstLine = document.createElement('div');
            firstLine.style.cssText = `
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 3px;
            `;
            
            var targetCoords = document.createElement('div');
            targetCoords.className = 'tw-attack-target-coords';
            targetCoords.textContent = target;
            targetCoords.style.minWidth = '60px';
            
            var villageName = document.createElement('span');
            villageName.style.cssText = `
                font-size: 11px;
                font-weight: bold;
                color: #333;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 120px;
            `;
            
            var displayName = villageData.name;
            if (displayName.length > 15) {
                displayName = displayName.substring(0, 15) + '...';
            }
            villageName.textContent = displayName;
            
            var villageTag = document.createElement('span');
            villageTag.className = 'tw-attack-village-tag';
            
            var villageType = '';
            
            if (villageData.isBonus) {
                villageType = 'Bonus';
                villageTag.classList.add('tw-attack-village-tag-bonus');
            } else if (villageData.playerNumber > 0) {
                villageType = 'Player';
                villageTag.classList.add('tw-attack-village-tag-player');
            } else {
                villageType = 'Barbarian';
                villageTag.classList.add('tw-attack-village-tag-barbarian');
            }
            
            villageTag.textContent = villageType;
            
            var pointsBadge = document.createElement('span');
            pointsBadge.className = 'tw-attack-points-badge';
            pointsBadge.textContent = villageData.points + ' pts';
            
            firstLine.appendChild(targetCoords);
            firstLine.appendChild(villageName);
            firstLine.appendChild(villageTag);
            firstLine.appendChild(pointsBadge);
            
            var secondLine = document.createElement('div');
            secondLine.className = 'tw-attack-target-details';
            secondLine.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
                font-size: 10px;
                color: #666;
            `;
            
            var distanceSpan = document.createElement('span');
            distanceSpan.innerHTML = `<strong>Distance:</strong> ${distance.toFixed(2)}`;
            
            var mostRecentAttack = null;
            var mostRecentBuild = null;
            var buildCooldowns = loadBuildCooldownsFromStorage();
            
            if (buildCooldowns[target]) {
                for (var buildKey in buildCooldowns[target]) {
                    var attackTime = buildCooldowns[target][buildKey];
                    if (!mostRecentAttack || attackTime > mostRecentAttack) {
                        mostRecentAttack = attackTime;
                        mostRecentBuild = buildKey;
                    }
                }
            }
            
            if (!mostRecentAttack) {
                var history = getAttackHistory();
                if (history[target]) {
                    mostRecentAttack = history[target];
                    mostRecentBuild = 'unknown';
                }
            }
            
            var lastAttackText = formatTimeSince(mostRecentAttack ? new Date(mostRecentAttack) : null);
            if (mostRecentBuild && mostRecentBuild !== 'unknown') {
                lastAttackText += ' (Build ' + mostRecentBuild + ')';
            }
            var lastAttackSpan = document.createElement('span');
            lastAttackSpan.innerHTML = `<strong>Last:</strong> ${lastAttackText}`;
            
            var cooldownSpan = document.createElement('span');
            var cooldownDetails = [];
            
            ['A', 'B', 'C'].forEach(function(buildKey) {
                if (targetBuildSettings[buildKey] && settings.autoAttackBuilds[buildKey]) {
                    var buildCooldownInfo = getBuildCooldownInfo(target, buildKey);
                    if (buildCooldownInfo.onCooldown) {
                        cooldownDetails.push(`${buildKey}: ${buildCooldownInfo.minutesLeft}m`);
                    }
                }
            });
            
            if (cooldownDetails.length > 0) {
                cooldownSpan.innerHTML = `<strong style="color: #ff6b6b;">⏳ ${cooldownDetails.join(', ')}</strong>`;
                cooldownSpan.title = 'Build cooldowns: ' + cooldownDetails.join(', ');
            } else {
                cooldownSpan.innerHTML = `<strong style="color: #4CAF50;">✅</strong>`;
            }
            
            secondLine.appendChild(distanceSpan);
            secondLine.appendChild(lastAttackSpan);
            secondLine.appendChild(cooldownSpan);
            
            villageInfoContainer.appendChild(firstLine);
            villageInfoContainer.appendChild(secondLine);
            
            targetInfo.appendChild(villageInfoContainer);
            
            var actionButtons = document.createElement('div');
            actionButtons.className = 'tw-attack-action-buttons';
            
            ['A', 'B', 'C'].forEach(function(buildKey) {
                var isEnabled = targetBuildSettings[buildKey];
                var btn = document.createElement('button');
                btn.textContent = buildKey;
                btn.className = 'tw-attack-action-btn tw-attack-action-btn-checkbox';
                if (isEnabled) btn.classList.add('checked');
                if (buildKey === 'B') btn.classList.add('b');
                if (buildKey === 'C') btn.classList.add('c');
                
                var buildCooldownInfo = getBuildCooldownInfo(target, buildKey);
                var cooldownIndicator = document.createElement('span');
                cooldownIndicator.className = 'tw-attack-build-cooldown-indicator';
                
                if (buildCooldownInfo.onCooldown) {
                    cooldownIndicator.classList.add('tw-attack-build-cooldown-cooldown');
                    cooldownIndicator.textContent = buildCooldownInfo.minutesLeft + 'm';
                    cooldownIndicator.title = 'Build ' + buildKey + ' on cooldown: ' + buildCooldownInfo.minutesLeft + ' minutes remaining';
                } else {
                    cooldownIndicator.classList.add('tw-attack-build-cooldown-ready');
                    cooldownIndicator.textContent = '✓';
                    cooldownIndicator.title = 'Build ' + buildKey + ' ready';
                }
                
                btn.appendChild(cooldownIndicator);
                btn.title = 'Toggle Build ' + buildKey + ' for this target. Cooldown: ' + buildCooldownInfo.cooldown + ' minutes';
                
                btn.onclick = (function(buildKey, targetCoords) {
                    return function(e) {
                        e.stopPropagation();
                        var newState = !targetBuildSettings[buildKey];
                        setTargetBuild(targetCoords, buildKey, newState);
                        updateTargetsListUI();
                    };
                })(buildKey, target);
                
                actionButtons.appendChild(btn);
            });
            
            var attackBtn = document.createElement('button');
            attackBtn.textContent = '⚔️';
            attackBtn.title = 'Attack with first available build';
            attackBtn.className = 'tw-attack-attack-btn';
            
            var anyBuildReady = false;
            ['A', 'B', 'C'].forEach(function(buildKey) {
                if (targetBuildSettings[buildKey] && settings.autoAttackBuilds[buildKey]) {
                    var buildCooldownInfo = getBuildCooldownInfo(target, buildKey);
                    if (!buildCooldownInfo.onCooldown) {
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
                    return function() { attackTargetWithAvailableBuild(targetToAttack); };
                })(target);
            }
    
            var ignoreBtn = document.createElement('button');
            ignoreBtn.textContent = '👁️';
            ignoreBtn.title = 'Add to ignore list';
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
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;';
        
        var title = document.createElement('h3');
        title.textContent = '🎯 Select Villages for ' + currentWorld + ' (' + villages.length + ' available)';
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
        addSelectedBtn.onclick = function() {
            var addedCount = 0;
            selectedVillages.forEach(function(coords) {
                var village = villages.find(v => v.coords === coords);
                if (village) {
                    if (addToTargetList(coords, village)) addedCount++;
                }
            });
            
            updateTargetsListUI();
            showStatus('Added ' + addedCount + ' village(s) to target list', 'success');
            document.body.removeChild(overlay);
        };
        
        footer.appendChild(selectedCount);
        footer.appendChild(addSelectedBtn);
        
        selectionContainer.appendChild(header);
        selectionContainer.appendChild(villagesContainer);
        selectionContainer.appendChild(footer);
        overlay.appendChild(selectionContainer);
        document.body.appendChild(overlay);
        
        var selectedVillages = [];
        
        function updateVillagesList() {
            villagesContainer.innerHTML = '';
            selectedVillages = [];
            
            villages.forEach(function(village, index) {
                var villageItem = document.createElement('div');
                villageItem.className = index % 2 === 0 ? 'tw-attack-village-item' : 'tw-attack-village-item tw-attack-village-item-alt';
                
                var villageInfo = document.createElement('div');
                villageInfo.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                `;
                
                var villageName = document.createElement('span');
                villageName.style.cssText = `
                    font-weight: bold;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-bottom: 2px;
                    font-size: 12px;
                `;
                villageName.textContent = village.name + ' - ' + village.coords;
                
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
                checkbox.style.cssText = 'margin-left: 10px; transform: scale(1.2);';
                
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
        }
        
        function updateSelectedCount() {
            selectedCount.textContent = '📌 Selected: ' + selectedVillages.length;
        }
        
        updateVillagesList();
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
            padding: 20px;
            width: 500px;
            max-width: 90vw;
            max-height: 70vh;
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
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 3px solid #ff9800;
        `;
        
        var title = document.createElement('h3');
        title.textContent = '👁️ Ignore List for ' + currentWorld + ' (' + ignoreList.length + ' villages)';
        title.style.margin = '0';
        title.style.fontSize = '14px';
        
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
        closeBtn.onclick = function() {
            document.body.removeChild(overlay);
        };
        
        header.appendChild(title);
        header.appendChild(closeBtn);
        
        var content = document.createElement('div');
        content.style.cssText = `
            flex: 1;
            overflow-y: auto;
            margin-bottom: 15px;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 8px;
            background: #f8f9fa;
        `;
        
        if (ignoreList.length === 0) {
            content.innerHTML = '<div style="text-align: center; padding: 20px; color: #666; font-style: italic; font-size: 12px;">No villages in ignore list</div>';
        } else {
            ignoreList.forEach(function(coords, index) {
                var item = document.createElement('div');
                item.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 6px 10px;
                    margin: 4px 0;
                    background: ${index % 2 === 0 ? '#fff' : '#f8f9fa'};
                    border-radius: 6px;
                    border: 1px solid #e9ecef;
                    font-size: 11px;
                `;
                
                var coordsSpan = document.createElement('span');
                coordsSpan.style.cssText = `
                    font-family: monospace;
                    font-weight: bold;
                    font-size: 12px;
                `;
                coordsSpan.textContent = coords;
                
                var distanceSpan = document.createElement('span');
                distanceSpan.style.cssText = `font-size: 10px; color: #666; margin-left: 8px;`;
                var distance = homeCoords ? calculateDistance(homeCoords, coords) : 0;
                distanceSpan.textContent = 'Distance: ' + distance.toFixed(2);
                
                var removeBtn = document.createElement('button');
                removeBtn.textContent = 'Remove';
                removeBtn.style.cssText = `
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 3px 6px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 10px;
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
            gap: 8px;
        `;
        
        var clearAllBtn = document.createElement('button');
        clearAllBtn.textContent = '🗑️ Clear All';
        clearAllBtn.style.cssText = `
            background: #ff4444;
            color: white;
            border: none;
            padding: 6px 10px;
            border-radius: 6px;
            cursor: pointer;
            flex: 1;
            font-size: 11px;
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
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
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
    homeCoords = getCurrentVillageCoords();
    
    loadSettingsFromStorage();
    loadTargetsFromStorage();
    loadBuildsFromStorage();
    loadTargetBuildsFromStorage();
    
    updateVillageDataForExistingTargets();
    
    // Check current page URL to determine what to do
    var currentUrl = window.location.href;
    
    if (currentUrl.includes('&screen=info_village')) {
        // Info village page - show control panel
        createInfoVillagePanel();
    } else if (currentUrl.includes('screen=place')) {
        if (currentUrl.includes('&try=confirm')) {
            // Submit page - run submit script
            runSubmitScript();
        } else {
            // Attack page - create main config UI
            if (!checkForAntibot()) {
                createConfigUI();
                
                if (settings.autoAttackEnabled) {
                    setTimeout(function() {
                        autoAttackNext();
                    }, 2000);
                }
            }
        }
    } else {
        // Other pages - create config UI if we can find the container
        var container = document.querySelector('#content_value > div.commands-container-outer');
        if (container) {
            createConfigUI();
        }
    }
    
    // Set up periodic check for submit script on submit pages
    if (currentUrl.includes('&screen=place&try=confirm')) {
        const submitCheckInterval = setInterval(runSubmitScript, 500);
        
        setTimeout(() => {
            if (!submitScriptExecuted) {
                clearInterval(submitCheckInterval);
            }
        }, 5 * 60 * 1000);
    }

})();
