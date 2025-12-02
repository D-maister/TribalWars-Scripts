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

// UI Elements
var controlPanel = null;
var isPanelVisible = false;

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
    
    return {
        modeIndex: modeIndex,
        modeName: getModeName(modeIndex),
        ratio: modeRatio,
        troops: troopsForMode,
        totalTroops: totalTroops,
        durationText: durationText,
        isAvailable: isModeAvailable(modeIndex),
        isLocked: isModeLocked(modeIndex),
        isActive: isModeActive(modeIndex)
    };
}

/**
 * Get actual duration for a mode (by filling troops and checking time)
 * @param {number} modeIndex - Index of the mode
 * @returns {string} - Duration text
 */
function getActualDurationForMode(modeIndex) {
    var modeElement = document.querySelectorAll('.scavenge-option')[modeIndex];
    if (modeElement) {
        // Try different selectors for the duration element
        var durationElement = modeElement.querySelector('.duration');
        
        // If not found with .duration, try other possible selectors
        if (!durationElement) {
            // Look in duration-section
            var durationSection = modeElement.querySelector('.duration-section');
            if (durationSection) {
                durationElement = durationSection.querySelector('.duration');
            }
        }
        
        // Also try looking for any span with class duration
        if (!durationElement) {
            durationElement = modeElement.querySelector('span.duration');
        }
        
        return durationElement ? durationElement.textContent.trim() : 'Unknown';
    }
    return 'Unknown';
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
 * Calculate all modes data
 */
function calculateAllModes() {
    // Parse mode ratios
    var parsedRatios = modeRatios.split('/').map(function(ratio) {
        return parseInt(ratio);
    });
    
    // Get locked modes
    var lockedModes = [];
    for (var i = 0; i < parsedRatios.length; i++) {
        if (isModeLocked(i)) {
            lockedModes.push(i);
        }
    }
    
    // Recalculate total ratio EXCLUDING locked modes
    var actualTotalRatio = 0;
    for (var i = 0; i < parsedRatios.length; i++) {
        if (!lockedModes.includes(i)) {
            actualTotalRatio += parsedRatios[i];
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
    
    // Calculate data for each mode (without durations initially)
    var modesData = [];
    for (var i = 0; i < parsedRatios.length; i++) {
        var modeData = calculateTroopsForMode(i, parsedRatios[i], actualTotalRatio);
        modesData.push(modeData);
    }
    
    calculatedData = {
        modes: modesData,
        totalTroopsAvailable: totalTroopsAvailable,
        actualTotalRatio: actualTotalRatio,
        lockedModes: lockedModes
    };
    
    return calculatedData;
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
    controlPanel.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: white;
        border: 2px solid #4CAF50;
        border-radius: 5px;
        padding: 15px;
        z-index: 10000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    // Calculate data first
    var data = calculateAllModes();
    
    // Create header
    var header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #ccc;
    `;
    
    var title = document.createElement('h3');
    title.textContent = 'Scavenge Auto Farmer';
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
        line-height: 1;
    `;
    closeBtn.onclick = function() {
        if (controlPanel) {
            controlPanel.remove();
            controlPanel = null;
        }
        isPanelVisible = false;
    };
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Create slider for percentage
    var sliderContainer = document.createElement('div');
    sliderContainer.style.cssText = `
        margin-bottom: 15px;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 4px;
    `;
    
    var sliderLabel = document.createElement('label');
    sliderLabel.textContent = 'Troops to send: ';
    sliderLabel.style.marginRight = '10px';
    
    var sliderValue = document.createElement('span');
    sliderValue.textContent = percentageToUse + '%';
    sliderValue.style.fontWeight = 'bold';
    sliderValue.style.color = '#4CAF50';
    
    var slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = percentageToUse;
    slider.style.cssText = `
        width: 200px;
        margin: 0 10px;
        vertical-align: middle;
    `;
    
    slider.oninput = function() {
        percentageToUse = parseInt(this.value);
        sliderValue.textContent = percentageToUse + '%';
        updateControlPanel();
    };
    
    sliderContainer.appendChild(sliderLabel);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(sliderValue);
    
    // Create table
    var table = document.createElement('table');
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15px;
    `;
    
    // Table header
    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    headerRow.style.backgroundColor = '#4CAF50';
    headerRow.style.color = 'white';
    
    var headers = ['Mode', 'Spear', 'Sword', 'Axe', 'Light', 'Heavy', 'Time'];
    headers.forEach(function(headerText) {
        var th = document.createElement('th');
        th.textContent = headerText;
        th.style.padding = '8px';
        th.style.textAlign = 'center';
        th.style.border = '1px solid #ddd';
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    
    // Table body
    var tbody = document.createElement('tbody');
    
    data.modes.forEach(function(mode) {
        var row = document.createElement('tr');
        row.style.backgroundColor = mode.isLocked ? '#ffebee' : 
                                   mode.isActive ? '#fff3e0' : 
                                   mode.isAvailable ? '#e8f5e8' : '#f5f5f5';
        
        // Mode cell
        var modeCell = document.createElement('td');
        modeCell.textContent = mode.modeName;
        modeCell.style.padding = '8px';
        modeCell.style.border = '1px solid #ddd';
        modeCell.style.fontWeight = mode.isLocked ? 'normal' : 'bold';
        modeCell.style.color = mode.isLocked ? '#999' : 
                              mode.isActive ? '#ff9800' : '#333';
        row.appendChild(modeCell);
        
        // Troop cells
        var troopTypes = ['spear', 'sword', 'axe', 'light', 'heavy'];
        troopTypes.forEach(function(troopType) {
            var troopCell = document.createElement('td');
            var troopCount = mode.troops[troopType] || 0;
            
            if (mode.isLocked || mode.isActive) {
                troopCell.textContent = '-';
                troopCell.style.color = '#999';
            } else {
                troopCell.textContent = troopCount > 0 ? troopCount : '0';
                troopCell.style.color = troopCount > 0 ? '#2196F3' : '#999';
                troopCell.style.fontWeight = troopCount > 0 ? 'bold' : 'normal';
            }
            
            troopCell.style.padding = '8px';
            troopCell.style.textAlign = 'center';
            troopCell.style.border = '1px solid #ddd';
            row.appendChild(troopCell);
        });
        
        // Time cell
        var timeCell = document.createElement('td');
        if (mode.isLocked) {
            timeCell.textContent = 'Locked';
            timeCell.style.color = '#f44336';
        } else if (mode.isActive) {
            timeCell.textContent = 'Active';
            timeCell.style.color = '#ff9800';
        } else {
            timeCell.textContent = mode.durationText;
            timeCell.style.color = '#4CAF50';
        }
        timeCell.style.padding = '8px';
        timeCell.style.textAlign = 'center';
        timeCell.style.border = '1px solid #ddd';
        row.appendChild(timeCell);
        
        tbody.appendChild(row);
    });
    
    // Summary row
    var summaryRow = document.createElement('tr');
    summaryRow.style.backgroundColor = '#e3f2fd';
    
    var summaryCell = document.createElement('td');
    summaryCell.colSpan = 7;
    summaryCell.textContent = 'Total troops to send: ' + data.totalTroopsAvailable + 
                             ' | Available modes: ' + data.modes.filter(m => m.isAvailable).length +
                             ' | Locked: ' + data.lockedModes.length;
    summaryCell.style.padding = '8px';
    summaryCell.style.textAlign = 'center';
    summaryCell.style.fontWeight = 'bold';
    summaryCell.style.border = '1px solid #ddd';
    
    summaryRow.appendChild(summaryCell);
    tbody.appendChild(summaryRow);
    
    table.appendChild(thead);
    table.appendChild(tbody);
    
    // Create buttons container
    var buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
        display: flex;
        gap: 10px;
        margin-top: 15px;
    `;
    
    // Calculate button - sequential calculation
    var calculateBtn = document.createElement('button');
    calculateBtn.textContent = '📊 Calculate All Modes';
    calculateBtn.style.cssText = `
        padding: 10px 15px;
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        flex: 1;
        font-weight: bold;
    `;
    calculateBtn.onclick = function() {
        calculateAndFillSequentially();
    };
    
    // Send All button
    var sendAllBtn = document.createElement('button');
    sendAllBtn.textContent = '🚀 Send All Available';
    sendAllBtn.style.cssText = `
        padding: 10px 15px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        flex: 1;
        font-weight: bold;
    `;
    sendAllBtn.onclick = function() {
        sendAllAvailableModes();
    };
    
    // Close button
    var closePanelBtn = document.createElement('button');
    closePanelBtn.textContent = 'Close Panel';
    closePanelBtn.style.cssText = `
        padding: 10px 15px;
        background: #9e9e9e;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        flex: 1;
    `;
    closePanelBtn.onclick = function() {
        if (controlPanel) {
            controlPanel.remove();
            controlPanel = null;
        }
        isPanelVisible = false;
    };
    
    buttonsContainer.appendChild(calculateBtn);
    buttonsContainer.appendChild(sendAllBtn);
    buttonsContainer.appendChild(closePanelBtn);
    
    // Assemble the panel
    controlPanel.appendChild(header);
    controlPanel.appendChild(sliderContainer);
    controlPanel.appendChild(table);
    controlPanel.appendChild(buttonsContainer);
    
    document.body.appendChild(controlPanel);
    isPanelVisible = true;
}

/**
 * Update control panel with new calculations
 */
function updateControlPanel() {
    if (controlPanel && isPanelVisible) {
        controlPanel.remove();
        createControlPanel();
    }
}

/**
 * Update control panel with durations (without recalculating everything)
 */
function updateControlPanelWithDurations() {
    if (!controlPanel || !isPanelVisible) return;
    
    // Update the time cells in the existing table
    var timeCells = controlPanel.querySelectorAll('tbody tr td:nth-child(7)');
    
    calculatedData.modes.forEach(function(mode, index) {
        if (index < timeCells.length) {
            var timeCell = timeCells[index];
            if (mode.isLocked) {
                timeCell.textContent = 'Locked';
                timeCell.style.color = '#f44336';
            } else if (mode.isActive) {
                timeCell.textContent = 'Active';
                timeCell.style.color = '#ff9800';
            } else {
                timeCell.textContent = mode.durationText;
                timeCell.style.color = '#4CAF50';
            }
        }
    });
    
    // Also update the table creation function to use updated durations
    // by triggering a panel refresh
    updateControlPanel();
}

/**
 * Calculate and fill troops sequentially for all available modes
 */
function calculateAndFillSequentially() {
    var data = calculateAllModes();
    var availableModes = data.modes.filter(mode => mode.isAvailable);
    
    if (availableModes.length === 0) {
        alert('No available modes to calculate!');
        return;
    }
    
    // Disable the calculate button during processing
    var calculateBtn = controlPanel.querySelector('button:nth-child(1)');
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
                calculateBtn.style.backgroundColor = '#2196F3';
            }
            
            alert('Sequential calculation completed!');
            updateControlPanelWithDurations(); // NEW: Refresh panel with updated durations
            return;
        }
        
        var mode = availableModes[currentIndex];
        console.log('Processing mode ' + (currentIndex + 1) + ' of ' + availableModes.length + ': ' + mode.modeName);
        
        // Clear previous inputs
        clearAllTroopInputs();
        
        // Wait a bit for UI to update
        setTimeout(function() {
            // Fill troops for this mode
            Object.keys(mode.troops).forEach(function(unitType) {
                fillTroopInput(unitType, mode.troops[unitType]);
            });
            
            // Wait longer for UI to update with duration (Tribal Wars needs time)
            setTimeout(function() {
                // Get the actual duration (now that troops are filled)
                var actualDuration = getActualDurationForMode(mode.modeIndex);
                
                // Debug: Log what we found
                console.log('Found duration for mode ' + mode.modeIndex + ': ' + actualDuration);
                
                // CRITICAL: Update the duration in the global calculatedData
                calculatedData.modes[mode.modeIndex].durationText = actualDuration;
                
                console.log('Mode ' + mode.modeName + ': ' + 
                          Object.keys(mode.troops).map(t => t + ':' + mode.troops[t]).join(', ') + 
                          ' | Time: ' + actualDuration);
                
                // Clear inputs for next mode
                clearAllTroopInputs();
                
                // Move to next mode after 1 second
                currentIndex++;
                setTimeout(processNextMode, 1000);
                
            }, 1500); // Wait longer for Tribal Wars to update duration (1.5 seconds)
            
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
    var availableModes = data.modes.filter(mode => mode.isAvailable);
    
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
        
        // Wait a bit and fill troops for this mode
        setTimeout(function() {
            Object.keys(mode.troops).forEach(function(unitType) {
                fillTroopInput(unitType, mode.troops[unitType]);
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
 * Toggle control panel visibility
 */
function toggleControlPanel() {
    if (isPanelVisible) {
        if (controlPanel) {
            controlPanel.remove();
            controlPanel = null;
        }
        isPanelVisible = false;
    } else {
        createControlPanel();
    }
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
    toggleBtn.textContent = '🎯 Scavenge Control';
    toggleBtn.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px 15px;
        background: linear-gradient(135deg, #4CAF50, #2E7D32);
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        z-index: 9999;
        font-weight: bold;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;
    
    toggleBtn.onmouseover = function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    };
    
    toggleBtn.onmouseout = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    };
    
    toggleBtn.onclick = toggleControlPanel;
    
    document.body.appendChild(toggleBtn);
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
        
        // Add toggle button
        addToggleButton();
        
        // Create and show control panel automatically
        createControlPanel();
        
        console.log('Control panel created. Click the button in top-right to toggle.');
        
    } catch (error) {
        console.error('Script error:', error);
        alert('Script error: ' + error.message);
    }
}

// Execute the script
executeScavengeScript();
