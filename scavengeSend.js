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
    if (inputElement && troopCount > 0) {
        inputElement.value = troopCount;
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
 * Calculate how many troops to send for each type based on ratios
 * @param {number} modeRatio - Ratio for the current mode
 * @param {number} totalRatio - Total available ratio (excluding locked modes)
 * @returns {Object} - Object containing troop counts for each type
 */
function calculateTroopDistribution(modeRatio, totalRatio) {
    var troopsToSend = {};
    var troopTypes = ['spear', 'sword', 'axe', 'light', 'heavy', 'knight'];
    
    // Calculate the percentage for this mode
    var modePercentage = modeRatio / totalRatio;
    
    console.log('Mode percentage: ' + (modePercentage * 100).toFixed(2) + '%');
    
    // Calculate troops for each enabled unit type
    troopTypes.forEach(function(unitType) {
        if (troopSettings[unitType]) {
            // Get available troops for this type
            var availableCount = getAvailableTroops(unitType);
            
            // Calculate how many to use (based on percentageToUse)
            var troopsToUse = Math.floor(availableCount * percentageToUse / 100);
            
            // Apply mode percentage to this troop type
            var troopsForThisMode = Math.floor(troopsToUse * modePercentage);
            
            // Ensure we don't send more than available
            troopsForThisMode = Math.min(troopsForThisMode, availableCount);
            
            if (troopsForThisMode > 0) {
                troopsToSend[unitType] = troopsForThisMode;
            }
            
            console.log(unitType + ': ' + availableCount + ' available, ' + 
                       troopsToUse + ' to use, sending ' + (troopsToSend[unitType] || 0));
        }
    });
    
    return troopsToSend;
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
 * Get the duration text for a scavenge mode
 * @param {number} modeIndex - Index of the mode
 * @returns {string} - Duration as string (HH:MM:SS)
 */
function getModeDuration(modeIndex) {
    var modeElement = document.querySelectorAll('.scavenge-option')[modeIndex];
    if (modeElement) {
        var durationElement = modeElement.querySelector('.duration');
        return durationElement ? durationElement.textContent : 'Unknown';
    }
    return 'Unknown';
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
 * Check if a scavenge mode is available (not locked and not active)
 * @param {number} modeIndex - Index of the mode to check
 * @returns {boolean} - True if mode is available
 */
function isModeAvailable(modeIndex) {
    var modeElement = document.querySelectorAll('.scavenge-option')[modeIndex];
    if (modeElement) {
        var lockedView = modeElement.querySelector('.locked-view');
        var activeView = modeElement.querySelector('.active-view');
        return !lockedView && !activeView;
    }
    return false;
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
        return !!lockedView;
    }
    return false;
}

/**
 * Format troop counts into a readable string
 * @param {Object} troopCounts - Object containing troop counts
 * @returns {string} - Formatted troop string
 */
function formatTroopString(troopCounts) {
    var troopParts = [];
    if (troopCounts.spear > 0) troopParts.push('sp:' + troopCounts.spear);
    if (troopCounts.sword > 0) troopParts.push('sw:' + troopCounts.sword);
    if (troopCounts.axe > 0) troopParts.push('ax:' + troopCounts.axe);
    if (troopCounts.light > 0) troopParts.push('lc:' + troopCounts.light);
    if (troopCounts.heavy > 0) troopParts.push('hv:' + troopCounts.heavy);
    if (troopCounts.knight > 0) troopParts.push('kt:' + troopCounts.knight);
    return troopParts.join(',');
}

/**
 * Get resource values for a scavenge mode
 * @param {number} modeIndex - Index of the mode
 * @returns {Object} - Object containing wood, stone, and iron values
 */
function getModeResources(modeIndex) {
    var modeElement = document.querySelectorAll('.scavenge-option')[modeIndex];
    if (modeElement) {
        function parseResourceValue(element) {
            return element ? parseInt(element.textContent.trim().replace(/\./g, '')) || 0 : 0;
        }
        
        return {
            wood: parseResourceValue(modeElement.querySelector('.wood-value')),
            stone: parseResourceValue(modeElement.querySelector('.stone-value')),
            iron: parseResourceValue(modeElement.querySelector('.iron-value'))
        };
    }
    return { wood: 0, stone: 0, iron: 0 };
}

/**
 * Calculate duration in seconds from HH:MM:SS string
 * @param {number} modeIndex - Index of the mode
 * @returns {number} - Duration in seconds
 */
function getDurationInSeconds(modeIndex) {
    var durationText = getModeDuration(modeIndex);
    if (durationText === 'Unknown') return 0;
    
    var timeParts = durationText.split(':').map(Number);
    return (3600 * timeParts[0]) + (60 * timeParts[1]) + timeParts[2];
}

/**
 * Calculate resource efficiency
 * @param {Object} resources - Resource object
 * @param {number} modeIndex - Index of the mode
 * @returns {Object} - Efficiency data
 */
function calculateEfficiency(resources, modeIndex) {
    var durationSeconds = getDurationInSeconds(modeIndex);
    if (durationSeconds === 0) return { perHour: 0, total: 0 };
    
    var totalResources = resources.wood + resources.stone + resources.iron;
    return {
        perHour: Math.round(3600 * totalResources / durationSeconds * 100) / 100,
        total: totalResources
    };
}

/**
 * Get currently active scavenge modes
 * @returns {Object} - Object with mode indices as keys
 */
function getActiveModes() {
    var activeModes = {};
    var modeElements = document.querySelectorAll('.scavenge-option');
    
    for (var modeIndex = 0; modeIndex < modeElements.length; modeIndex++) {
        var activeView = modeElements[modeIndex].querySelector('.active-view');
        if (activeView && activeView.querySelector('.return-countdown')) {
            activeModes[modeIndex] = true;
        }
    }
    return activeModes;
}

/**
 * Get available (non-active, non-locked) scavenge modes
 * @returns {Array} - Array of available mode indices
 */
function getAvailableModes() {
    var availableModes = [];
    var modeElements = document.querySelectorAll('.scavenge-option');
    
    for (var modeIndex = 0; modeIndex < modeElements.length; modeIndex++) {
        if (isModeAvailable(modeIndex)) {
            availableModes.push(modeIndex);
        }
    }
    return availableModes;
}

/**
 * Get locked (not researched) scavenge modes
 * @returns {Array} - Array of locked mode indices
 */
function getLockedModes() {
    var lockedModes = [];
    var modeElements = document.querySelectorAll('.scavenge-option');
    
    for (var modeIndex = 0; modeIndex < modeElements.length; modeIndex++) {
        if (isModeLocked(modeIndex)) {
            lockedModes.push(modeIndex);
        }
    }
    return lockedModes;
}

/**
 * Log activity to localStorage for debugging and tracking
 * @param {string} message - The log message
 * @param {string} type - Message type (info, success, warning, error)
 * @param {string} mode - Scavenge mode name
 * @param {string} troops - Troop composition string
 * @param {Object} resources - Resource information
 */
function logActivity(message, type, mode, troops, resources) {
    var logEntry = {
        timestamp: new Date().toISOString(),
        message: message,
        type: type || 'info',
        mode: mode,
        troops: troops,
        resources: resources
    };
    
    var existingLogs = JSON.parse(localStorage.getItem('scavengeLogs') || '[]');
    existingLogs.push(logEntry);
    
    // Keep only the last 200 entries
    if (existingLogs.length > 200) {
        existingLogs = existingLogs.slice(-200);
    }
    
    localStorage.setItem('scavengeLogs', JSON.stringify(existingLogs));
}

// Main execution function
function executeScavengeScript() {
    try {
        console.log('=== Scavenge Auto Farmer Started ===');
        logActivity('Scavenge Auto Farmer Started', 'info');
        
        console.log('Settings: ' + percentageToUse + '% troops, ratios: ' + modeRatios);
        logActivity('Settings: ' + percentageToUse + '% troops, ratios: ' + modeRatios, 'info');

        // Parse mode ratios
        var parsedRatios = modeRatios.split('/').map(function(ratio) {
            return parseInt(ratio);
        });
        
        // Get locked modes and recalculate total ratio excluding locked modes
        var lockedModes = getLockedModes();
        var availableModes = getAvailableModes();
        var activeModes = getActiveModes();
        
        console.log('Locked modes: ' + lockedModes.length + 
                   ', Active modes: ' + Object.keys(activeModes).length + 
                   ', Available modes: ' + availableModes.length);
        
        // Recalculate total ratio EXCLUDING locked modes (this is the key fix)
        var actualTotalRatio = 0;
        for (var modeIndex = 0; modeIndex < parsedRatios.length; modeIndex++) {
            if (!lockedModes.includes(modeIndex)) {
                actualTotalRatio += parsedRatios[modeIndex];
            }
        }
        
        var originalTotalRatio = parsedRatios.reduce(function(a, b) { return a + b; }, 0);
        console.log('Original total ratio: ' + originalTotalRatio + 
                   ', Actual total ratio (excluding locked): ' + actualTotalRatio);

        // Check if any modes are available
        if (availableModes.length === 0) {
            console.log('No available modes found');
            logActivity('No available modes found', 'warning');
            return;
        }

        // Calculate used ratio EXCLUDING locked modes
        var usedRatio = 0;
        for (modeIndex = 0; modeIndex < parsedRatios.length; modeIndex++) {
            if (activeModes[modeIndex] && !lockedModes.includes(modeIndex)) {
                usedRatio += parsedRatios[modeIndex];
            }
        }
        
        // Free ratio is the actual total ratio minus used ratio
        var freeRatio = actualTotalRatio - usedRatio;
        
        console.log('Actual total ratio: ' + actualTotalRatio + 
                   ', Used ratio: ' + usedRatio + 
                   ', Free ratio: ' + freeRatio);
        logActivity('Ratio: Total ' + actualTotalRatio + ', Used ' + usedRatio + 
                   ', Free ' + freeRatio, 'info');

        // Check if there's free ratio available
        if (freeRatio <= 0) {
            console.log('No free ratio available');
            logActivity('No free ratio available', 'warning');
            return;
        }

        // Find the first available mode with non-zero ratio that's not locked
        var selectedMode = -1;
        for (modeIndex = 0; modeIndex < parsedRatios.length; modeIndex++) {
            if (parsedRatios[modeIndex] > 0 && 
                !activeModes[modeIndex] && 
                availableModes.includes(modeIndex) &&
                !lockedModes.includes(modeIndex)) {
                selectedMode = modeIndex;
                break;
            }
        }

        if (selectedMode === -1) {
            console.log('No available mode with non-zero ratio found');
            logActivity('No available mode with non-zero ratio found', 'warning');
            return;
        }

        var selectedModeRatio = parsedRatios[selectedMode];
        
        // Clear existing inputs and calculate new troop distribution using ACTUAL total ratio
        clearAllTroopInputs();
        var troopsToSend = calculateTroopDistribution(selectedModeRatio, actualTotalRatio);

        // Fill the troop inputs
        Object.keys(troopsToSend).forEach(function(unitType) {
            fillTroopInput(unitType, troopsToSend[unitType]);
        });

        // Log the operation details
        var modeDuration = getModeDuration(selectedMode);
        var troopString = formatTroopString(troopsToSend);
        var modeResources = getModeResources(selectedMode);
        var efficiency = calculateEfficiency(modeResources, selectedMode);
        var modeName = getModeName(selectedMode);
        
        console.log('🎯 Selected Mode: ' + modeName);
        console.log('⚔️ Troops: ' + troopString);
        console.log('⏱️ Duration: ' + modeDuration);
        console.log('📦 Resources: Wood:' + modeResources.wood + 
                   ' Clay:' + modeResources.stone + 
                   ' Iron:' + modeResources.iron + 
                   ' Total:' + efficiency.total);
        console.log('💰 Resources/hour: ' + efficiency.perHour);
        console.log('📊 Mode Ratio: ' + selectedModeRatio + '/' + actualTotalRatio + 
                   ' = ' + ((selectedModeRatio / actualTotalRatio) * 100).toFixed(1) + '% of troops');
        
        logActivity(
            modeName + ' - ' + troopString + ' - ' + modeDuration + 
            ' - Total: ' + efficiency.total + ' - Per hour: ' + efficiency.perHour,
            'success',
            modeName,
            troopString,
            {
                wood: modeResources.wood,
                stone: modeResources.stone,
                iron: modeResources.iron,
                total: efficiency.total,
                perHour: efficiency.perHour,
                duration: modeDuration
            }
        );

        // Send troops after a short delay
        console.log('Troops filled. Waiting 1 second before sending...');
        setTimeout(function() {
            if (sendTroops(selectedMode)) {
                console.log('✓ Successfully sent troops for ' + modeName);
                logActivity('Sent troops for ' + modeName, 'success', modeName, troopString, {
                    wood: modeResources.wood,
                    stone: modeResources.stone,
                    iron: modeResources.iron,
                    total: efficiency.total,
                    perHour: efficiency.perHour,
                    duration: modeDuration
                });
            } else {
                console.log('✗ Failed to send troops for ' + modeName);
                logActivity('Failed to send troops for ' + modeName, 'error');
            }
        }, 1000);

        logActivity('Scavenge Auto Farmer Finished', 'info');
        console.log('=== Scavenge Auto Farmer Finished ===');

    } catch (error) {
        console.error('Script error:', error);
        logActivity('Script error: ' + error.message, 'error');
    }
}

// Execute the script - this is the entry point
executeScavengeScript();
