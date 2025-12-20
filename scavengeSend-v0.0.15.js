// Scavenge Auto Farmer for Tribal Wars
// Configuration Section
var percentageToUse = 100; // Percentage of available troops to use (1-100)
var modeRatios = '15/6/3/2'; // Troop distribution ratios for each mode
var troopSettings = {
    'spear': true,    // Include spearmen
    'sword': true,    // Include swordsmen
    'axe': true,      // Include axemen
    'light': true,    // Include light cavalry
    'heavy': true,    // Include heavy cavalry
    'knight': false   // Include knights
};

// Store calculated data
var calculatedData = {
    modes: [],
    totalTroopsAvailable: 0,
    actualTotalRatio: 0
};

// Store durations and resources for each mode
var modeDurations = {};
var modeResources = {};

// Store which modes are enabled by user (by default all are enabled)
var enabledModes = [true, true, true, true];

// Store custom ratios (by default use the global modeRatios)
var customRatios = modeRatios.split('/').map(function(ratio) {
    return parseInt(ratio);
});

// Auto-repeat settings
var autoRepeatEnabled = false;
var nextAutoRunTime = null;
var isAutoRunning = false;

// UI Elements
var controlPanel = null;
var isPanelVisible = false;

// Add styles to the page
function addStyles() {
    // Remove existing styles if they exist
    var existingStyles = document.getElementById('tw-scavenge-mode-styles');
    if (existingStyles) {
        existingStyles.remove();
    }
    
    var styleElement = document.createElement('style');
    styleElement.id = 'tw-scavenge-mode-styles';
    styleElement.textContent = `
        #scavengeControlPanel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #6C4D2D;
            border-radius: 5px;
            padding: 15px;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
            max-width: 800px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            display: none;
        }
        
        #scavengeControlPanel.visible {
            display: block;
        }
        
        .scavenge-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
        }
        
        .scavenge-panel-title {
            margin: 0;
            color: #6C4D2D;
            font-size: 18px;
        }
        
        .scavenge-close-btn {
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0;
        }
        
        .scavenge-close-btn:hover {
            background: #ff6666;
        }
        
        .scavenge-slider-container {
            margin-bottom: 15px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 10px;
        }        
        
        .scavenge-slider-label {
            font-weight: bold;
            white-space: nowrap;
        }
        
        .scavenge-slider-value {
            font-weight: bold;
            color: #6C4D2D;
            min-width: 40px;
            text-align: right;
        }
        
        .scavenge-slider {
            flex: 1;
            margin: 0;
            cursor: pointer;            
            /* Webkit browsers (Chrome, Safari, Edge) */
            -webkit-appearance: none;
            appearance: none;
            height: 6px;
            border-radius: 3px;
            background: linear-gradient(to bottom, #b69471 0%,#9f764d 22%,#8f6133 30%,#6c4d2d 100%);
        }

        /* Thumb for Webkit */
        .scavenge-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #6C4D2D;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        /* Firefox */
        .scavenge-slider::-moz-range-track {
            background: linear-gradient(to bottom, #b69471 0%,#9f764d 22%,#8f6133 30%,#6c4d2d 100%);
            height: 6px;
            border-radius: 3px;
            border: none;
        }
        
        .scavenge-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #6C4D2D;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .scavenge-troop-checkboxes {
            margin-bottom: 15px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
        }
        
        .scavenge-troop-checkbox-group {
            margin-right: 15px;
            display: inline-flex;
            align-items: center;
        }
        
        .scavenge-troop-checkbox {
            margin-right: 5px;
            cursor: pointer;
        }

        .scavenge-troop-checkbox,
        .scavenge-mode-checkbox {
            accent-color: #6C4D2D;
        }
        
        .scavenge-troop-label {
            cursor: pointer;
            font-weight: bold;
        }
        
        .scavenge-mode-controls {
            margin-bottom: 15px;
            padding: 10px;
            background: #e8f5e8;
            border-radius: 4px;
            border: 1px solid #6C4D2D;
        }
        
        .scavenge-mode-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #000;
        }
        
        .scavenge-mode-controls-container {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .scavenge-mode-control {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 5px 10px;
            background: white;
            border-radius: 4px;
            border: 1px solid #ddd;
        }
        
        .scavenge-mode-checkbox {
            cursor: pointer;
        }
        
        .scavenge-mode-name {
            cursor: pointer;
            font-weight: bold;
            min-width: 60px;
        }
        
        .scavenge-ratio-input {
            width: 50px;
            padding: 3px 5px;
            border: 1px solid #ccc;
            border-radius: 3px;
            text-align: center;
        }
        
        .scavenge-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        
        .scavenge-table th {
            padding: 8px;
            text-align: center;
            border: 1px solid #ddd;
            background-color: #6C4D2D;
            color: white;
        }
        
        .scavenge-table td {
            padding: 8px;
            text-align: center;
            border: 1px solid #ddd;
        }
        
        .scavenge-buttons-container {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .scavenge-btn {
            flex: 1;
            font-weight: bold;
        }
        
        .scavenge-resources-total {
            font-weight: bold;
            color: #6C4D2D;
        }
        
        .scavenge-auto-repeat {
            margin-bottom: 15px;
            padding: 10px;
            background: #fff3e0;
            border-radius: 4px;
            border: 1px solid #FF9800;
        }
        
        .scavenge-auto-repeat-title {
            font-weight: bold;
            margin-bottom: 8px;
            color: #FF9800;
        }
        
        .scavenge-auto-repeat-info {
            margin-top: 5px;
            font-size: 12px;
            color: #666;
        }
        
        .unlocking-status {
            color: #FF9800 !important;
            font-weight: bold !important;
        }
        
        #scavengeToggleBtn {
            position: relative;
            top: 0;
            right: 0;
            margin-right: 10px;
            padding: 6px 12px;
            font-size: 12px;
            min-width: 60px;
        }
    `;
    
    document.head.appendChild(styleElement);
}

/**
 * Get the number of available troops for a specific unit type
 * @param {string} unitType - The type of unit (spear, sword, axe, etc.)
 * @returns {number} - Number of available troops
 */
function getAvailableTroops(unitType) {
    var unitElement = document.querySelector('.units-entry-all[data-unit="' + unitType + '"]');
    if (unitElement) {
        var troopMatch = unitElement.textContent.match(/\((\d+)\)/);
        return troopMatch ? parseInt(troopMatch[1]) : 0;
    }
    return 0;
}

/**
 * Fill the input field with the specified number of troops
 * @param {string} unitType - The type of unit
 * @param {number} troopCount - Number of troops to send
 */
function fillTroopInput(unitType, troopCount) {
    var inputElement = document.querySelector('input[name="' + unitType + '"]');
    if (inputElement) {
        inputElement.value = troopCount > 0 ? troopCount : '';
        // Trigger events to ensure the UI updates
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        inputElement.focus();
        inputElement.blur();
    }
}

/**
 * Clear all troop input fields
 */
function clearAllTroopInputs() {
    document.querySelectorAll('input.unitsInput').forEach(function(inputElement) {
        inputElement.value = '';
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
    });
}

/**
 * Check if a scavenge mode is locked (not researched)
 * @param {number} modeIndex - Index of the mode to check
 * @returns {boolean} - True if mode is locked
 */
function isModeLocked(modeIndex) {
    var modeElement = document.querySelectorAll('.scavenge-option')[modeIndex];
    if (modeElement) {
        var lockedView = modeElement.querySelector('.locked-view');
        var unlockingView = modeElement.querySelector('.unlocking-view');
        var unlockCountdown = modeElement.querySelector('.unlock-countdown');
        
        return !!lockedView || !!unlockingView || !!unlockCountdown;
    }
    return false;
}

/**
 * Check if a scavenge mode is unlocking (currently being unlocked)
 * @param {number} modeIndex - Index of the mode to check
 * @returns {boolean} - True if mode is unlocking
 */
function isModeUnlocking(modeIndex) {
    var modeElement = document.querySelectorAll('.scavenge-option')[modeIndex];
    if (modeElement) {
        var unlockingView = modeElement.querySelector('.unlocking-view');
        var unlockCountdown = modeElement.querySelector('.unlock-countdown');
        
        return !!unlockingView || !!unlockCountdown;
    }
    return false;
}

/**
 * Get unlocking countdown text if mode is unlocking
 * @param {number} modeIndex - Index of the mode to check
 * @returns {string} - Countdown text or empty string
 */
function getUnlockingCountdown(modeIndex) {
    var modeElement = document.querySelectorAll('.scavenge-option')[modeIndex];
    if (modeElement) {
        var countdownText = modeElement.querySelector('.unlock-countdown-text');
        if (countdownText) {
            return countdownText.textContent.trim();
        }
    }
    return '';
}

/**
 * Check if a scavenge mode is active
 * @param {number} modeIndex - Index of the mode to check
 * @returns {boolean} - True if mode is active
 */
function isModeActive(modeIndex) {
    var modeElement = document.querySelectorAll('.scavenge-option')[modeIndex];
    if (modeElement) {
        var activeView = modeElement.querySelector('.active-view');
        return !!activeView;
    }
    return false;
}

/**
 * Check if a scavenge mode is available (not locked, not unlocking, and not active)
 * @param {number} modeIndex - Index of the mode to check
 * @returns {boolean} - True if mode is available
 */
function isModeAvailable(modeIndex) {
    var modeElement = document.querySelectorAll('.scavenge-option')[modeIndex];
    if (modeElement) {
        var lockedView = modeElement.querySelector('.locked-view');
        var unlockingView = modeElement.querySelector('.unlocking-view');
        var activeView = modeElement.querySelector('.active-view');
        
        return !lockedView && !unlockingView && !activeView;
    }
    return false;
}

/**
 * Calculate troops for a specific mode
 * @param {number} modeIndex - Index of the mode
 * @param {number} modeRatio - Ratio for this mode
 * @param {number} totalRatio - Total available ratio
 * @returns {Object} - Object containing troop counts
 */
function calculateTroopsForMode(modeIndex, modeRatio, totalRatio) {
    var modePercentage = modeRatio / totalRatio;
    var troopsForMode = {};
    var troopTypes = ['spear', 'sword', 'axe', 'light', 'heavy', 'knight'];
    var totalTroops = 0;
    
    // Calculate troops for each enabled unit type
    troopTypes.forEach(function(unitType) {
        if (troopSettings[unitType]) {
            var availableCount = getAvailableTroops(unitType);
            var troopsToUse = Math.floor(availableCount * percentageToUse / 100);
            var troopsForThisMode = Math.floor(troopsToUse * modePercentage);
            
            if (troopsForThisMode > 0) {
                troopsForMode[unitType] = troopsForThisMode;
                totalTroops += troopsForThisMode;
            }
        }
    });
    
    // Get mode duration - will be filled later when mode is actually processed
    var durationText = '-';
    
    // Get resources if available
    var totalResources = modeResources[modeIndex] || 0;
    
    // Check if mode is unlocking
    var isUnlocking = isModeUnlocking(modeIndex);
    var unlockingCountdown = isUnlocking ? getUnlockingCountdown(modeIndex) : '';
    
    return {
        modeIndex: modeIndex,
        modeName: getModeName(modeIndex),
        ratio: modeRatio,
        troops: troopsForMode,
        totalTroops: totalTroops,
        durationText: durationText,
        totalResources: totalResources,
        isAvailable: isModeAvailable(modeIndex),
        isLocked: isModeLocked(modeIndex),
        isUnlocking: isUnlocking,
        unlockingCountdown: unlockingCountdown,
        isActive: isModeActive(modeIndex),
        isEnabledByUser: enabledModes[modeIndex]
    };
}

/**
 * Parse resource value from string (handles numbers with dots like "3.128")
 * @param {string} valueStr - String value like "3.128"
 * @returns {number} - Parsed integer value (3128)
 */
function parseResourceValue(valueStr) {
    if (!valueStr) return 0;
    
    // Remove any whitespace
    valueStr = valueStr.trim();
    
    // If it contains a dot, treat it as a formatted number
    if (valueStr.includes('.')) {
        // Remove dots and parse as integer
        return parseInt(valueStr.replace(/\./g, '')) || 0;
    }
    
    // Otherwise parse as regular number
    return parseInt(valueStr) || 0;
}

/**
 * Get actual duration and resources for a mode (by filling troops and checking time)
 * @param {number} modeIndex - Index of the mode
 * @returns {Object} - Object with duration and total resources
 */
function getActualDurationAndResourcesForMode(modeIndex) {
    var modeElement = document.querySelectorAll('.scavenge-option')[modeIndex];
    if (modeElement) {
        // Get duration
        var durationText = 'Unknown';
        var durationElement = modeElement.querySelector('.duration');
        
        if (!durationElement) {
            var durationSection = modeElement.querySelector('.duration-section');
            if (durationSection) {
                durationElement = durationSection.querySelector('.duration');
            }
        }
        
        if (!durationElement) {
            durationElement = modeElement.querySelector('span.duration');
        }
        
        if (durationElement) {
            durationText = durationElement.textContent.trim();
        }
        
        // Get resources
        var totalResources = 0;
        var previewElement = modeElement.querySelector('.preview');
        if (previewElement) {
            var woodValue = previewElement.querySelector('.wood-value');
            var stoneValue = previewElement.querySelector('.stone-value');
            var ironValue = previewElement.querySelector('.iron-value');
            
            var wood = woodValue ? parseResourceValue(woodValue.textContent) : 0;
            var stone = stoneValue ? parseResourceValue(stoneValue.textContent) : 0;
            var iron = ironValue ? parseResourceValue(ironValue.textContent) : 0;
            
            totalResources = wood + stone + iron;
        }
        
        return {
            duration: durationText,
            totalResources: totalResources
        };
    }
    return {
        duration: 'Unknown',
        totalResources: 0
    };
}

/**
 * Get the display name for a scavenge mode
 * @param {number} modeIndex - Index of the mode (0-3)
 * @returns {string} - Mode display name
 */
function getModeName(modeIndex) {
    var modeNames = [
        'Ленивые собиратели',   // Lazy Gatherers
        'Скромные собиратели',  // Modest Gatherers
        'Искусные собиратели',  // Skillful Gatherers
        'Великие собиратели'    // Great Gatherers
    ];
    return modeNames[modeIndex] || 'Unknown Mode';
}

/**
 * Send troops for a specific scavenge mode
 * @param {number} modeIndex - Index of the mode to send
 * @returns {boolean} - True if send was successful
 */
function sendTroops(modeIndex) {
    var modeElement = document.querySelectorAll('.scavenge-option')[modeIndex];
    if (modeElement) {
        var sendButton = modeElement.querySelector('.free_send_button');
        if (sendButton && !sendButton.disabled) {
            sendButton.click();
            return true;
        }
    }
    return false;
}

/**
 * Calculate all modes data
 */
function calculateAllModes() {
    // Use custom ratios if available
    var currentRatios = customRatios;
    
    // Get locked modes (including unlocking modes)
    var lockedModes = [];
    for (var i = 0; i < currentRatios.length; i++) {
        if (isModeLocked(i)) {
            lockedModes.push(i);
        }
    }
    
    // Get unlocking modes
    var unlockingModes = [];
    for (var i = 0; i < currentRatios.length; i++) {
        if (isModeUnlocking(i)) {
            unlockingModes.push(i);
        }
    }
    
    // Recalculate total ratio EXCLUDING locked modes (including unlocking) AND disabled modes
    var actualTotalRatio = 0;
    for (var i = 0; i < currentRatios.length; i++) {
        if (!lockedModes.includes(i) && enabledModes[i]) {
            actualTotalRatio += currentRatios[i];
        }
    }
    
    // Calculate total available troops
    var totalTroopsAvailable = 0;
    var troopTypes = ['spear', 'sword', 'axe', 'light', 'heavy', 'knight'];
    troopTypes.forEach(function(unitType) {
        if (troopSettings[unitType]) {
            var availableCount = getAvailableTroops(unitType);
            var troopsToUse = Math.floor(availableCount * percentageToUse / 100);
            totalTroopsAvailable += troopsToUse;
        }
    });
    
    // Calculate data for each mode
    var modesData = [];
    for (var i = 0; i < currentRatios.length; i++) {
        var modeData = calculateTroopsForMode(i, currentRatios[i], actualTotalRatio);
        
        // Preserve existing duration and resources if we have them
        if (modeDurations[i]) {
            modeData.durationText = modeDurations[i];
        }
        
        if (modeResources[i]) {
            modeData.totalResources = modeResources[i];
        }
        
        modesData.push(modeData);
    }
    
    calculatedData = {
        modes: modesData,
        totalTroopsAvailable: totalTroopsAvailable,
        actualTotalRatio: actualTotalRatio,
        lockedModes: lockedModes,
        unlockingModes: unlockingModes
    };
    
    return calculatedData;
}

/**
 * Create troop type checkboxes
 */
function createTroopCheckboxes() {
    var container = document.createElement('div');
    container.className = 'scavenge-troop-checkboxes';
    
    var label = document.createElement('label');
    label.textContent = 'Troop types to use: ';
    label.className = 'scavenge-slider-label';
    container.appendChild(label);
    
    var troopTypes = [
        { id: 'spear', name: 'Spear', color: '#2196F3' },
        { id: 'sword', name: 'Sword', color: '#6C4D2D' },
        { id: 'axe', name: 'Axe', color: '#FF9800' },
        { id: 'light', name: 'Light', color: '#9C27B0' },
        { id: 'heavy', name: 'Heavy', color: '#F44336' },
        { id: 'knight', name: 'Knight', color: '#795548' }
    ];
    
    troopTypes.forEach(function(troop) {
        var checkboxContainer = document.createElement('span');
        checkboxContainer.className = 'scavenge-troop-checkbox-group';
        checkboxContainer.style.color = troop.color;
        
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'troop_' + troop.id;
        checkbox.className = 'scavenge-troop-checkbox';
        checkbox.checked = troopSettings[troop.id];
        
        checkbox.onchange = function() {
            troopSettings[troop.id] = this.checked;
            updateControlPanel();
        };
        
        var checkboxLabel = document.createElement('label');
        checkboxLabel.htmlFor = 'troop_' + troop.id;
        checkboxLabel.textContent = troop.name;
        checkboxLabel.className = 'scavenge-troop-label';
        
        checkboxContainer.appendChild(checkbox);
        checkboxContainer.appendChild(checkboxLabel);
        container.appendChild(checkboxContainer);
    });
    
    return container;
}

/**
 * Create mode controls (checkboxes and ratio inputs)
 */
function createModeControls() {
    var container = document.createElement('div');
    container.className = 'scavenge-mode-controls';
    
    var title = document.createElement('div');
    title.textContent = 'Mode Configuration:';
    title.className = 'scavenge-mode-title';
    container.appendChild(title);
    
    var modeNames = ['Lazy', 'Modest', 'Skillful', 'Great'];
    var modeColors = ['#6C4D2D', '#2196F3', '#FF9800', '#9C27B0'];
    
    var controlsContainer = document.createElement('div');
    controlsContainer.className = 'scavenge-mode-controls-container';
    
    for (var i = 0; i < 4; i++) {
        var modeControl = document.createElement('div');
        modeControl.className = 'scavenge-mode-control';
        
        // Mode checkbox
        var modeCheckbox = document.createElement('input');
        modeCheckbox.type = 'checkbox';
        modeCheckbox.id = 'mode_' + i;
        modeCheckbox.className = 'scavenge-mode-checkbox';
        modeCheckbox.checked = enabledModes[i];
        
        modeCheckbox.onchange = function() {
            var modeIndex = parseInt(this.id.split('_')[1]);
            enabledModes[modeIndex] = this.checked;
            updateControlPanel();
        };
        
        // Mode label
        var modeLabel = document.createElement('label');
        modeLabel.htmlFor = 'mode_' + i;
        modeLabel.textContent = modeNames[i];
        modeLabel.className = 'scavenge-mode-name';
        modeLabel.style.color = modeColors[i];
        
        // Ratio input
        var ratioInput = document.createElement('input');
        ratioInput.type = 'number';
        ratioInput.min = '0';
        ratioInput.max = '100';
        ratioInput.value = customRatios[i];
        ratioInput.className = 'scavenge-ratio-input';
        
        ratioInput.onchange = function() {
            var modeIndex = parseInt(this.parentElement.querySelector('.scavenge-mode-checkbox').id.split('_')[1]);
            var value = parseInt(this.value) || 0;
            customRatios[modeIndex] = value;
            updateControlPanel();
        };
        
        modeControl.appendChild(modeCheckbox);
        modeControl.appendChild(modeLabel);
        modeControl.appendChild(ratioInput);
        
        controlsContainer.appendChild(modeControl);
    }
    
    container.appendChild(controlsContainer);
    
    return container;
}

/**
 * Create auto-repeat section
 */
function createAutoRepeatSection() {
    var container = document.createElement('div');
    container.className = 'scavenge-auto-repeat';
    
    var title = document.createElement('div');
    title.textContent = 'Auto Repeat Settings:';
    title.className = 'scavenge-auto-repeat-title';
    container.appendChild(title);
    
    var checkboxContainer = document.createElement('div');
    checkboxContainer.style.display = 'flex';
    checkboxContainer.style.alignItems = 'center';
    checkboxContainer.style.gap = '8px';
    
    var autoRepeatCheckbox = document.createElement('input');
    autoRepeatCheckbox.type = 'checkbox';
    autoRepeatCheckbox.id = 'autoRepeatCheckbox';
    autoRepeatCheckbox.checked = autoRepeatEnabled;
    autoRepeatCheckbox.style.cursor = 'pointer';
    
    autoRepeatCheckbox.onchange = function() {
        autoRepeatEnabled = this.checked;
        updateControlPanel();
    };
    
    var autoRepeatLabel = document.createElement('label');
    autoRepeatLabel.htmlFor = 'autoRepeatCheckbox';
    autoRepeatLabel.textContent = 'Enable Auto Repeat';
    autoRepeatLabel.style.cursor = 'pointer';
    autoRepeatLabel.style.fontWeight = 'bold';
    
    checkboxContainer.appendChild(autoRepeatCheckbox);
    checkboxContainer.appendChild(autoRepeatLabel);
    container.appendChild(checkboxContainer);
    
    // Info text
    var infoText = document.createElement('div');
    infoText.className = 'scavenge-auto-repeat-info';
    infoText.textContent = 'When enabled, script will automatically restart scavenging when all modes complete. Settings are saved.';
    container.appendChild(infoText);
    
    return container;
}

/**
 * Create control panel HTML
 */
function createControlPanel() {
    if (controlPanel) {
        controlPanel.remove();
    }
    
    controlPanel = document.createElement('div');
    controlPanel.id = 'scavengeControlPanel';
    
    // Calculate data first
    var data = calculateAllModes();
    
    // Create header
    var header = document.createElement('div');
    header.className = 'scavenge-panel-header';
    
    var title = document.createElement('h3');
    title.textContent = 'Scavenge Auto Farmer';
    title.className = 'scavenge-panel-title';
    
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'scavenge-close-btn';
    closeBtn.onclick = function() {
        hideControlPanel();
    };
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Create slider for percentage
    var sliderContainer = document.createElement('div');
    sliderContainer.className = 'scavenge-slider-container';
    
    var sliderLabel = document.createElement('label');
    sliderLabel.textContent = 'Troops to send: ';
    sliderLabel.className = 'scavenge-slider-label';
    
    var sliderValue = document.createElement('span');
    sliderValue.textContent = percentageToUse + '%';
    sliderValue.className = 'scavenge-slider-value';
    
    var slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = percentageToUse;
    slider.className = 'scavenge-slider';
    
    slider.oninput = function() {
        percentageToUse = parseInt(this.value);
        sliderValue.textContent = percentageToUse + '%';
        updateControlPanel();
    };
    
    sliderContainer.appendChild(sliderLabel);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(sliderValue);
    
    // Create troop checkboxes
    var troopCheckboxes = createTroopCheckboxes();
    
    // Create mode controls (checkboxes and ratio inputs)
    var modeControls = createModeControls();
    
    // Create auto-repeat section
    var autoRepeatSection = createAutoRepeatSection();
    
    // Create table
    var table = document.createElement('table');
    table.className = 'scavenge-table';
    
    // Table header
    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    
    var headers = ['Mode', 'Spear', 'Sword', 'Axe', 'Light', 'Heavy', 'Time', 'Total Resources'];
    headers.forEach(function(headerText) {
        var th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    
    // Table body
    var tbody = document.createElement('tbody');
    
    data.modes.forEach(function(mode) {
        var row = document.createElement('tr');
        
        // Determine row background color based on multiple conditions
        if (mode.isLocked && !mode.isUnlocking) {
            row.style.backgroundColor = '#ffebee'; // Red for locked
        } else if (mode.isUnlocking) {
            row.style.backgroundColor = '#fff3e0'; // Orange for unlocking
        } else if (mode.isActive) {
            row.style.backgroundColor = '#fff3e0'; // Orange for active
        } else if (!mode.isEnabledByUser) {
            row.style.backgroundColor = '#f5f5f5'; // Gray for disabled by user
            row.style.opacity = '0.6';
        } else if (mode.isAvailable) {
            row.style.backgroundColor = '#e8f5e8'; // Green for available
        } else {
            row.style.backgroundColor = '#f5f5f5'; // Gray for other
        }
        
        // Mode cell with checkbox
        var modeCell = document.createElement('td');
        modeCell.style.display = 'flex';
        modeCell.style.alignItems = 'center';
        modeCell.style.gap = '8px';
        
        // Add checkbox only if not locked, not unlocking, and not active
        if (!mode.isLocked && !mode.isActive && !mode.isUnlocking) {
            var modeCheckbox = document.createElement('input');
            modeCheckbox.type = 'checkbox';
            modeCheckbox.checked = mode.isEnabledByUser;
            modeCheckbox.style.cursor = 'pointer';
            modeCheckbox.onchange = function() {
                enabledModes[mode.modeIndex] = this.checked;
                updateControlPanel();
            };
            modeCell.appendChild(modeCheckbox);
        }
        
        var modeNameSpan = document.createElement('span');
        modeNameSpan.textContent = mode.modeName;
        modeNameSpan.style.fontWeight = 'bold';
        
        // Set color based on mode status
        if (mode.isLocked && !mode.isUnlocking) {
            modeNameSpan.style.color = '#f44336'; // Red for locked
        } else if (mode.isUnlocking) {
            modeNameSpan.style.color = '#FF9800'; // Orange for unlocking
        } else if (mode.isActive) {
            modeNameSpan.style.color = '#ff9800'; // Orange for active
        } else if (!mode.isEnabledByUser) {
            modeNameSpan.style.color = '#999'; // Gray for disabled
        } else {
            modeNameSpan.style.color = '#333'; // Normal
        }
        
        modeCell.appendChild(modeNameSpan);
        
        row.appendChild(modeCell);
        
        // Troop cells
        var troopTypes = ['spear', 'sword', 'axe', 'light', 'heavy'];
        troopTypes.forEach(function(troopType) {
            var troopCell = document.createElement('td');
            var troopCount = mode.troops[troopType] || 0;
            
            if (mode.isLocked || mode.isActive || mode.isUnlocking || !mode.isEnabledByUser) {
                troopCell.textContent = '-';
                troopCell.style.color = '#999';
            } else {
                troopCell.textContent = troopCount > 0 ? troopCount : '0';
                // Color based on whether troop type is enabled
                if (troopSettings[troopType]) {
                    troopCell.style.color = troopCount > 0 ? '#2196F3' : '#999';
                    troopCell.style.fontWeight = troopCount > 0 ? 'bold' : 'normal';
                } else {
                    troopCell.textContent = '✗';
                    troopCell.style.color = '#ff4444';
                    troopCell.style.fontWeight = 'bold';
                }
            }
            
            row.appendChild(troopCell);
        });
        
        // Time cell
        var timeCell = document.createElement('td');
        if (mode.isLocked && !mode.isUnlocking) {
            timeCell.textContent = 'Locked';
            timeCell.style.color = '#f44336';
        } else if (mode.isUnlocking) {
            timeCell.textContent = 'Unlocking: ' + mode.unlockingCountdown;
            timeCell.className = 'unlocking-status';
        } else if (mode.isActive) {
            timeCell.textContent = 'Active';
            timeCell.style.color = '#ff9800';
        } else if (!mode.isEnabledByUser) {
            timeCell.textContent = 'Disabled';
            timeCell.style.color = '#999';
        } else {
            // Check for stored duration first
            if (modeDurations[mode.modeIndex]) {
                timeCell.textContent = modeDurations[mode.modeIndex];
            } else {
                timeCell.textContent = mode.durationText;
            }
            timeCell.style.color = '#6C4D2D';
        }
        row.appendChild(timeCell);
        
        // Total Resources cell
        var resourcesCell = document.createElement('td');
        if (mode.isLocked || mode.isActive || mode.isUnlocking || !mode.isEnabledByUser) {
            resourcesCell.textContent = '-';
            resourcesCell.style.color = '#999';
        } else {
            var resources = mode.totalResources || 0;
            resourcesCell.textContent = resources.toLocaleString();
            resourcesCell.className = 'scavenge-resources-total';
        }
        row.appendChild(resourcesCell);
        
        tbody.appendChild(row);
    });
    
    // Summary row
    var summaryRow = document.createElement('tr');
    summaryRow.style.backgroundColor = '#e3f2fd';
    
    var summaryCell = document.createElement('td');
    summaryCell.colSpan = 8;
    
    var enabledCount = data.modes.filter(m => m.isEnabledByUser && !m.isLocked && !m.isActive && !m.isUnlocking).length;
    var availableCount = data.modes.filter(m => m.isAvailable && m.isEnabledByUser).length;
    var usedRatios = customRatios.filter((ratio, index) => enabledModes[index]).join('/');
    
    summaryCell.textContent = 'Total troops: ' + data.totalTroopsAvailable + 
                             ' | Available: ' + availableCount +
                             ' | Enabled: ' + enabledCount +
                             ' | Locked: ' + data.lockedModes.length +
                             ' | Unlocking: ' + data.unlockingModes.length +
                             ' | Ratios: ' + usedRatios;
    
    summaryCell.style.padding = '8px';
    summaryCell.style.textAlign = 'center';
    summaryCell.style.fontWeight = 'bold';
    
    summaryRow.appendChild(summaryCell);
    tbody.appendChild(summaryRow);
    
    table.appendChild(thead);
    table.appendChild(tbody);
    
    // Create buttons container
    var buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'scavenge-buttons-container';
    
    // Calculate button - sequential calculation
    var calculateBtn = document.createElement('button');
    calculateBtn.textContent = '📊 Calculate All Modes';
    calculateBtn.className = 'btn btn-default scavenge-btn';
    calculateBtn.onclick = function() {
        calculateAndFillSequentially();
    };
    
    // Send All button
    var sendAllBtn = document.createElement('button');
    sendAllBtn.textContent = '🚀 Send All Available';
    sendAllBtn.className = 'btn btn-default scavenge-btn';
    sendAllBtn.onclick = function() {
        sendAllAvailableModes();
    };
    
    buttonsContainer.appendChild(calculateBtn);
    buttonsContainer.appendChild(sendAllBtn);
    
    // Assemble the panel
    controlPanel.appendChild(header);
    controlPanel.appendChild(sliderContainer);
    controlPanel.appendChild(troopCheckboxes);
    controlPanel.appendChild(modeControls);
    controlPanel.appendChild(autoRepeatSection);
    controlPanel.appendChild(table);
    controlPanel.appendChild(buttonsContainer);
    
    document.body.appendChild(controlPanel);
}

/**
 * Show control panel
 */
function showControlPanel() {
    if (!controlPanel) {
        createControlPanel();
    }
    controlPanel.classList.add('visible');
    isPanelVisible = true;
}

/**
 * Hide control panel
 */
function hideControlPanel() {
    if (controlPanel) {
        controlPanel.classList.remove('visible');
        isPanelVisible = false;
    }
}

/**
 * Toggle control panel visibility
 */
function toggleControlPanel() {
    if (isPanelVisible) {
        hideControlPanel();
    } else {
        showControlPanel();
    }
}

/**
 * Update control panel with new calculations
 */
function updateControlPanel() {
    if (controlPanel && isPanelVisible) {
        controlPanel.remove();
        createControlPanel();
        controlPanel.classList.add('visible');
    }
}

/**
 * Update control panel with durations and resources (without recalculating everything)
 */
function updateControlPanelWithDurations() {
    if (!controlPanel || !isPanelVisible) return;
    
    // Update the table with stored durations and resources
    var rows = controlPanel.querySelectorAll('.scavenge-table tbody tr');
    
    for (var i = 0; i < rows.length - 1; i++) { // -1 to exclude summary row
        var row = rows[i];
        var timeCell = row.cells[6]; // 7th column (0-indexed)
        var resourcesCell = row.cells[7]; // 8th column (0-indexed)
        
        var modeIndex = i;
        
        if (calculatedData.modes[modeIndex]) {
            var mode = calculatedData.modes[modeIndex];
            
            // Update time cell
            if (mode.isLocked && !mode.isUnlocking) {
                timeCell.textContent = 'Locked';
                timeCell.style.color = '#f44336';
                timeCell.className = '';
            } else if (mode.isUnlocking) {
                timeCell.textContent = 'Unlocking: ' + (mode.unlockingCountdown || getUnlockingCountdown(modeIndex));
                timeCell.className = 'unlocking-status';
            } else if (mode.isActive) {
                timeCell.textContent = 'Active';
                timeCell.style.color = '#ff9800';
                timeCell.className = '';
            } else if (!mode.isEnabledByUser) {
                timeCell.textContent = 'Disabled';
                timeCell.style.color = '#999';
                timeCell.className = '';
            } else if (modeDurations[modeIndex]) {
                timeCell.textContent = modeDurations[modeIndex];
                timeCell.style.color = '#6C4D2D';
                timeCell.className = '';
            }
            
            // Update resources cell
            if (mode.isLocked || mode.isActive || mode.isUnlocking || !mode.isEnabledByUser) {
                resourcesCell.textContent = '-';
                resourcesCell.style.color = '#999';
                resourcesCell.className = '';
            } else if (modeResources[modeIndex]) {
                resourcesCell.textContent = modeResources[modeIndex].toLocaleString();
                resourcesCell.className = 'scavenge-resources-total';
            }
        }
    }
}

/**
 * Calculate and fill troops sequentially for all available modes
 */
function calculateAndFillSequentially() {
    var data = calculateAllModes();
    // Only calculate modes that are enabled by user and not locked/unlocking
    var availableModes = data.modes.filter(mode => mode.isAvailable && mode.isEnabledByUser);
    
    if (availableModes.length === 0) {
        alert('No available modes to calculate!');
        return;
    }
    
    // Disable the calculate button during processing
    var calculateBtn = controlPanel.querySelector('.scavenge-btn');
    if (calculateBtn) {
        calculateBtn.disabled = true;
        calculateBtn.textContent = '⏳ Calculating...';
        calculateBtn.style.backgroundColor = '#9e9e9e';
    }
    
    alert('Starting sequential calculation for ' + availableModes.length + ' mode(s).\n' +
          'Each mode will be calculated one by one with 1-second intervals.\n' +
          'Please wait for completion...');
    
    var currentIndex = 0;
    
    function processNextMode() {
        if (currentIndex >= availableModes.length) {
            // Re-enable the calculate button
            if (calculateBtn) {
                calculateBtn.disabled = false;
                calculateBtn.textContent = '📊 Calculate All Modes';
                calculateBtn.style.backgroundColor = '';
            }
            
            alert('Sequential calculation completed!');
            updateControlPanelWithDurations(); // Refresh panel with updated durations and resources
            return;
        }
        
        var mode = availableModes[currentIndex];
        console.log('Processing mode ' + (currentIndex + 1) + ' of ' + availableModes.length + ': ' + mode.modeName);
        
        // Clear previous inputs
        clearAllTroopInputs();
        
        // Wait a bit for UI to update
        setTimeout(function() {
            // Fill troops for this mode (only enabled troop types)
            Object.keys(mode.troops).forEach(function(unitType) {
                if (troopSettings[unitType]) {
                    fillTroopInput(unitType, mode.troops[unitType]);
                }
            });
            
            // Wait longer for UI to update with duration and resources (Tribal Wars needs time)
            setTimeout(function() {
                // Get the actual duration and resources (now that troops are filled)
                var result = getActualDurationAndResourcesForMode(mode.modeIndex);
                
                // Debug: Log what we found
                console.log('Found for mode ' + mode.modeIndex + ': Duration=' + result.duration + ', Resources=' + result.totalResources);
                
                // CRITICAL: Update the duration and resources in persistent storage
                modeDurations[mode.modeIndex] = result.duration;
                modeResources[mode.modeIndex] = result.totalResources;
                
                console.log('Stored for mode ' + mode.modeIndex + ': Duration=' + result.duration + ', Resources=' + result.totalResources);
                
                console.log('Mode ' + mode.modeName + ': ' + 
                          Object.keys(mode.troops)
                            .filter(t => troopSettings[t]) // Only show enabled troops
                            .map(t => t + ':' + mode.troops[t])
                            .join(', ') + 
                          ' | Time: ' + result.duration +
                          ' | Resources: ' + result.totalResources);
                
                // Clear inputs for next mode
                clearAllTroopInputs();
                
                // Move to next mode after 1 second
                currentIndex++;
                setTimeout(processNextMode, 1000);
                
            }, 1500); // Wait longer for Tribal Wars to update (1.5 seconds)
            
        }, 500); // Wait after clearing
    }
    
    // Start processing
    processNextMode();
}

/**
 * Send troops for all available modes with 1-second intervals
 */
function sendAllAvailableModes() {
    var data = calculateAllModes();
    // Only send modes that are enabled by user and not locked/unlocking
    var availableModes = data.modes.filter(mode => mode.isAvailable && mode.isEnabledByUser);
    
    if (availableModes.length === 0) {
        alert('No available modes to send!');
        return;
    }
    
    // Confirm before sending
    if (!confirm('Send troops for ' + availableModes.length + ' available mode(s)?')) {
        return;
    }
    
    var sentCount = 0;
    var failedCount = 0;
    var currentIndex = 0;
    
    function sendNextMode() {
        if (currentIndex >= availableModes.length) {
            var message = 'Completed! Sent: ' + sentCount + ', Failed: ' + failedCount;
            console.log(message);
            alert(message);
            updateControlPanel();
            return;
        }
        
        var mode = availableModes[currentIndex];
        console.log('Sending mode ' + (currentIndex + 1) + ' of ' + availableModes.length + ': ' + mode.modeName);
        
        // Clear previous inputs
        clearAllTroopInputs();
        
        // Wait a bit and fill troops for this mode (only enabled troop types)
        setTimeout(function() {
            Object.keys(mode.troops).forEach(function(unitType) {
                if (troopSettings[unitType]) {
                    fillTroopInput(unitType, mode.troops[unitType]);
                }
            });
            
            // Wait a bit more and send
            setTimeout(function() {
                if (sendTroops(mode.modeIndex)) {
                    console.log('✓ Sent: ' + mode.modeName);
                    sentCount++;
                } else {
                    console.log('✗ Failed: ' + mode.modeName);
                    failedCount++;
                }
                
                // Move to next mode after 1 second
                currentIndex++;
                setTimeout(sendNextMode, 1000);
            }, 500);
        }, 500);
    }
    
    // Start sending
    sendNextMode();
}

/**
 * Add toggle button to the page
 */
function addToggleButton() {
    // Remove existing button if any
    var existingBtn = document.getElementById('scavengeToggleBtn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    var toggleBtn = document.createElement('button');
    toggleBtn.id = 'scavengeToggleBtn';
    toggleBtn.textContent = 'AUTO';
    toggleBtn.className = 'btn btn-default';
    
    // Find the candidate squad container
    var squadContainer = document.querySelector('div.candidate-squad-container');
    if (squadContainer && squadContainer.parentNode) {
        // Insert the button before the squad container
        squadContainer.parentNode.insertBefore(toggleBtn, squadContainer);
    } else {
        // Fallback to original position if container not found
        toggleBtn.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 6px 12px;
            font-size: 12px;
            min-width: 60px;
            z-index: 9999;
        `;
        document.body.appendChild(toggleBtn);
    }
    
    toggleBtn.onclick = toggleControlPanel;
}

// Main execution function
function executeScavengeScript() {
    try {
        console.log('=== Scavenge Auto Farmer Started ===');
        
        // Check if we're on the scavenge page
        if (!document.querySelector('.scavenge-option')) {
            alert('Please navigate to the scavenge page first!');
            return;
        }
        
        // Add styles to the page
        addStyles();
        
        // Initialize storage
        modeDurations = {};
        modeResources = {};
        
        // Initialize enabled modes (all enabled by default)
        enabledModes = [true, true, true, true];
        
        // Initialize custom ratios
        customRatios = modeRatios.split('/').map(function(ratio) {
            return parseInt(ratio);
        });
        
        // Add toggle button
        addToggleButton();
        
        // Create control panel (but don't show it yet)
        createControlPanel();
        
        console.log('Control panel created. Click the AUTO button to toggle.');
        
    } catch (error) {
        console.error('Script error:', error);
        alert('Script error: ' + error.message);
    }
}

// Execute the script
executeScavengeScript();
