// ==UserScript==
// @name         Tribal Wars Precision Attack Timer
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Precision attack timer with server time synchronization
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=== PRECISION ATTACK TIMER ===');
    
    const CONFIG = {
        defaultUpdateInterval: 10,
        defaultMaxCancelMinutes: 10,
        defaultAttackDelay: 50,
        maxCancelMultiplier: 2,
        calibrationSamples: 10
    };
    
    let state = {
        running: false,
        targetTime: null,
        clickTime: null,
        timerId: null,
        serverTimeOffset: 0,
        calibrationComplete: false,
        calibrationData: [],
        updateInterval: CONFIG.defaultUpdateInterval,
        maxCancelTime: CONFIG.defaultMaxCancelMinutes * 60 * 1000,
        fixedArriveTime: null,
        fixedReturnTime: null,
        currentAttackData: null // Store current attack data for saving
    };
    
    // Storage functions for attack data
    const AttackDataStorage = {
        STORAGE_KEY: 'twAttackHistory',
        MAX_ATTACKS: 100,
        
        init() {
            if (!sessionStorage.getItem(this.STORAGE_KEY)) {
                sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
            }
        },
        
        saveAttackData(attackData) {
            const attacks = this.getAttackHistory();
            
            // Add timestamp and format data
            const formattedData = {
                id: Date.now(), // Unique ID based on timestamp
                timestamp: new Date().toISOString(),
                timestampReadable: new Date().toLocaleString(),
                data: attackData
            };
            
            attacks.unshift(formattedData);
            
            // Keep only last MAX_ATTACKS entries
            if (attacks.length > this.MAX_ATTACKS) {
                attacks.length = this.MAX_ATTACKS;
            }
            
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(attacks));
            
            console.log('Attack data saved to sessionStorage:', formattedData);
            return formattedData;
        },
        
        getAttackHistory() {
            const attacks = sessionStorage.getItem(this.STORAGE_KEY);
            return attacks ? JSON.parse(attacks) : [];
        },
        
        clearHistory() {
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        },
        
        getLastAttack() {
            const attacks = this.getAttackHistory();
            return attacks.length > 0 ? attacks[0] : null;
        },
        
        // Format attack data for display/download
        formatAttackForDisplay(attack) {
            if (!attack) return 'No attack data';
            
            const data = attack.data;
            let output = `Attack Data - ${attack.timestampReadable}\n`;
            output += '='.repeat(50) + '\n\n';
            
            // Basic info
            output += `📅 Timestamp: ${attack.timestampReadable}\n`;
            output += `⏰ Start Timer: ${data.startTime || 'N/A'}\n`;
            output += `🎯 Enemy Arrival: ${data.enemyArrival || 'N/A'}\n`;
            output += `🖱️ Click at: ${data.clickAt || 'N/A'}\n\n`;
            
            // Travel times
            output += `📊 Duration: ${data.duration || 'N/A'}\n`;
            output += `📍 Arrive to destination: ${data.arriveToDestination || 'N/A'}\n`;
            output += `↩️ Return if not cancel: ${data.returnIfNotCancel || 'N/A'}\n`;
            output += `📡 Latency: ${data.latency || 'N/A'}\n\n`;
            
            // Scheduled times
            output += `⏱️ Will arrive at: ${data.willArriveAt || 'N/A'}\n`;
            output += `⏱️ Will return at: ${data.willReturnAt || 'N/A'}\n\n`;
            
            // Settings
            output += `⚙️ Settings:\n`;
            output += `  🔄 Update (ms): ${data.updateInterval || 'N/A'}\n`;
            output += `  ⏰ Max Cancel (min): ${data.maxCancel || 'N/A'}\n`;
            output += `  ⏱️ Attack Delay (ms): ${data.attackDelay || 'N/A'}\n\n`;
            
            // Server info
            output += `🌐 Server Info:\n`;
            output += `  🎯 Enemy: ${data.enemy || 'N/A'}\n`;
            output += `  ⚡ Offset: ${data.offset || 'N/A'}\n`;
            
            if (data.notes) {
                output += `\n📝 Notes: ${data.notes}\n`;
            }
            
            output += '\n' + '='.repeat(50);
            return output;
        }
    };
    
    // Initialize attack data storage
    AttackDataStorage.init();
    
    // Add CSS styles (same as before, just adding export section)
    const style = document.createElement('style');
    style.textContent = `
        /* ... all previous CSS styles ... */
        
        .tw-export-container {
            margin-top: 20px;
            display: none;
        }
        
        .tw-export-box {
            background: rgba(96, 125, 139, 0.08);
            border: 1px solid #607D8B;
            border-radius: 8px;
            padding: 15px;
        }
        
        .tw-export-header {
            color: #455A64;
            margin-bottom: 12px;
            font-size: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            justify-content: space-between;
        }
        
        .tw-export-buttons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        
        .tw-export-button {
            padding: 8px 16px;
            background: linear-gradient(145deg, #607D8B, #455A64);
            border: none;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 13px;
            transition: all 0.3s;
            box-shadow: 0 2px 5px rgba(96, 125, 139, 0.2);
        }
        
        .tw-export-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 10px rgba(96, 125, 139, 0.3);
        }
        
        .tw-export-button-copy {
            background: linear-gradient(145deg, #2196F3, #1976D2);
        }
        
        .tw-export-button-download {
            background: linear-gradient(145deg, #4CAF50, #388E3C);
        }
        
        .tw-export-button-clear {
            background: linear-gradient(145deg, #F44336, #D32F2F);
        }
        
        .tw-data-display {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #37474F;
            background: rgba(255, 255, 255, 0.7);
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #ddd;
            max-height: 200px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-all;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize
    function init() {
        setTimeout(() => {
            const attackBtn = document.querySelector('#troop_confirm_submit');
            if (!attackBtn) {
                setTimeout(init, 1000);
                return;
            }
            
            if (document.getElementById('tw-precision-main')) return;
            
            addMainUI(attackBtn);
            
            setTimeout(calibrateServerTime, 500);
        }, 1000);
    }
    
    // Get latency from serverTime element
    function getLatency() {
        try {
            const serverTimeEl = document.querySelector('#serverTime');
            if (!serverTimeEl) return 0;
            
            const title = serverTimeEl.getAttribute('data-title') || '';
            const match = title.match(/Latency:\s*([\d.]+)ms/i);
            return match ? parseFloat(match[1]) : 0;
        } catch (error) {
            console.error('Error getting latency:', error);
            return 0;
        }
    }
    
    // Get duration time from the page
    function getDurationTime() {
        try {
            // Try the new selector
            const durationElement = document.querySelector("#command-data-form table.vis tbody tr:nth-child(4) td:nth-child(2)");
            
            // Fallback to old selector
            if (!durationElement) {
                const oldElement = document.querySelector("#command-data-form > div:nth-child(9) > table > tbody > tr:nth-child(4) > td:nth-child(2)");
                if (oldElement) {
                    const text = oldElement.textContent.trim();
                    const parts = text.split(':');
                    if (parts.length === 3) {
                        const hours = parseInt(parts[0], 10) || 0;
                        const minutes = parseInt(parts[1], 10) || 0;
                        const seconds = parseInt(parts[2], 10) || 0;
                        return (hours * 3600 + minutes * 60 + seconds) * 1000;
                    }
                }
            } else {
                const text = durationElement.textContent.trim();
                const parts = text.split(':');
                if (parts.length === 3) {
                    const hours = parseInt(parts[0], 10) || 0;
                    const minutes = parseInt(parts[1], 10) || 0;
                    const seconds = parseInt(parts[2], 10) || 0;
                    return (hours * 3600 + minutes * 60 + seconds) * 1000;
                }
            }
            
            const alternativeSelectors = [
                'td[data-duration]',
                '.duration',
                'td:contains("Duration") + td',
                'tr:contains("Duration") td:nth-child(2)'
            ];
            
            for (const selector of alternativeSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const text = element.textContent.trim();
                    const match = text.match(/(\d+):(\d+):(\d+)/);
                    if (match) {
                        const hours = parseInt(match[1], 10) || 0;
                        const minutes = parseInt(match[2], 10) || 0;
                        const seconds = parseInt(match[3], 10) || 0;
                        return (hours * 3600 + minutes * 60 + seconds) * 1000;
                    }
                }
            }
            
            console.warn('Could not find duration time element');
            return 0;
        } catch (error) {
            console.error('Error getting duration time:', error);
            return 0;
        }
    }
    
    // Add main UI with export section
    function addMainUI(attackBtn) {
        const current = getEstimatedServerTime();
        const duration = getDurationTime();
        const latency = getLatency();
        
        const arriveTime = new Date(current.getTime() + duration);
        const returnTime = new Date(arriveTime.getTime() + duration);
        
        const div = document.createElement('div');
        div.id = 'tw-precision-main';
        div.innerHTML = `
            <div class="tw-container">
                <h3 class="tw-title">
                    <span class="tw-title-icon">🎯</span>
                    <span>Precision Attack Timer</span>
                </h3>
                
                <div id="tw-calibration-status" class="tw-calibration-status">
                    🔄 Calibrating server time...
                </div>
                
                <div id="tw-duration-info" class="tw-duration-info">
                    <div class="tw-duration-stats">
                        <span>📊 Duration: ${formatDuration(duration)}</span>
                        <span>📡 Latency: ${latency.toFixed(1)}ms</span>
                    </div>
                </div>
                
                <div class="tw-times-grid">
                    <div class="tw-time-box tw-arrive-box">
                        <div class="tw-time-label tw-arrive-label">
                            <span class="tw-time-icon">📍</span>
                            <span>Arrive to destination:</span>
                        </div>
                        <div id="tw-arrive-time" class="tw-time-value tw-arrive-value">
                            ${formatTime(arriveTime)}
                        </div>
                    </div>
                    
                    <div class="tw-time-box tw-return-box">
                        <div class="tw-time-label tw-return-label">
                            <span class="tw-time-icon">↩️</span>
                            <span>Return if not cancel:</span>
                        </div>
                        <div id="tw-return-time" class="tw-time-value tw-return-value">
                            ${formatTime(returnTime)}
                        </div>
                    </div>
                </div>
                
                <div id="tw-fixed-times" class="tw-fixed-times-container">
                    <div class="tw-fixed-times-box">
                        <div class="tw-fixed-times-label">
                            <span style="font-size: 20px;">⏱️</span>
                            <span>Scheduled Attack Times</span>
                        </div>
                        <div class="tw-fixed-times-grid">
                            <div class="tw-fixed-time-box tw-fixed-arrive-box">
                                <div class="tw-fixed-time-label tw-fixed-arrive-label">
                                    Will arrive at:
                                </div>
                                <div id="tw-fixed-arrive" class="tw-fixed-time-value tw-fixed-arrive-value">
                                    --:--:--:---
                                </div>
                            </div>
                            
                            <div class="tw-fixed-time-box tw-fixed-return-box">
                                <div class="tw-fixed-time-label tw-fixed-return-label">
                                    Will return at:
                                </div>
                                <div id="tw-fixed-return" class="tw-fixed-time-value tw-fixed-return-value">
                                    --:--:--:---
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="tw-target-input-container">
                    <div class="tw-input-label">
                        <span>🎯 Enemy Arrival Time:</span>
                        <span class="tw-time-format">HH:MM:SS:mmm</span>
                    </div>
                    <input type="text" 
                           id="tw-target-input" 
                           class="tw-input"
                           value="${formatTime(current)}"
                           placeholder="13:44:30:054">
                </div>
                
                <div class="tw-settings-grid">
                    <div>
                        <div class="tw-input-label">
                            🔄 Update (ms):
                        </div>
                        <input type="number" 
                               id="tw-update-input" 
                               class="tw-input"
                               value="10"
                               min="1" 
                               max="100"
                               step="1">
                    </div>
                    
                    <div>
                        <div class="tw-input-label">
                            ⏰ Max Cancel (min):
                        </div>
                        <input type="number" 
                               id="tw-cancel-input" 
                               class="tw-input"
                               value="10"
                               min="1" 
                               max="60"
                               step="1">
                    </div>
                    
                    <div>
                        <div class="tw-input-label">
                            ⏱️ Attack Delay (ms):
                        </div>
                        <input type="number" 
                               id="tw-delay-input" 
                               class="tw-input"
                               value="50"
                               min="1" 
                               max="500"
                               step="1">
                    </div>
                </div>
                
                <div class="tw-buttons-grid">
                    <button id="tw-start-btn" class="tw-button tw-start-button">
                        🚀 Start Timer
                    </button>
                    
                    <button id="tw-stop-btn" class="tw-button tw-stop-button" style="display: none;">
                        ⏹️ Stop
                    </button>
                </div>
                
                <div id="tw-status" class="tw-status-box">
                    🔄 Calibrating server time...
                </div>
                
                <div class="tw-time-display">
                    <div id="tw-current-display" class="tw-current-display">
                        ⏰ Server: ${formatTime(current)}
                    </div>
                    
                    <div id="tw-target-display" class="tw-target-display">
                        🎯 Enemy: <span id="tw-target-text">--:--:--:---</span>
                    </div>
                    
                    <div id="tw-click-display" class="tw-click-display">
                        🖱️ Click at: <span id="tw-click-text">--:--:--:---</span>
                    </div>
                    
                    <div id="tw-remaining-display" class="tw-remaining-display">
                        ⏳ Remaining: <span id="tw-remaining-text">0ms</span>
                    </div>
                </div>
                
                <!-- Attack Data Export Section -->
                <div id="tw-export-container" class="tw-export-container">
                    <div class="tw-export-box">
                        <div class="tw-export-header">
                            <span>
                                <span style="font-size: 20px;">💾</span>
                                <span>Attack Data</span>
                            </span>
                            <button id="tw-export-toggle" class="tw-logs-toggle">
                                Show/Hide
                            </button>
                        </div>
                        <div id="tw-export-content" class="tw-data-display" style="display: none;">
                            <!-- Data will be inserted here -->
                        </div>
                        <div id="tw-export-buttons" class="tw-export-buttons" style="display: none;">
                            <button id="tw-copy-data" class="tw-export-button tw-export-button-copy">
                                📋 Copy Data
                            </button>
                            <button id="tw-download-data" class="tw-export-button tw-export-button-download">
                                ⬇️ Download
                            </button>
                            <button id="tw-clear-history" class="tw-export-button tw-export-button-clear">
                                🗑️ Clear History
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        attackBtn.parentNode.insertBefore(div, attackBtn.nextSibling);
        
        // Event listeners
        document.getElementById('tw-start-btn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            startMainTimer();
            return false;
        });
        
        document.getElementById('tw-stop-btn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            stopMainTimer();
            return false;
        });
        
        // Export toggle
        document.getElementById('tw-export-toggle').addEventListener('click', function(e) {
            e.preventDefault();
            const exportContent = document.getElementById('tw-export-content');
            const exportButtons = document.getElementById('tw-export-buttons');
            
            if (exportContent.style.display === 'none') {
                exportContent.style.display = 'block';
                exportButtons.style.display = 'flex';
                updateAttackDataDisplay();
            } else {
                exportContent.style.display = 'none';
                exportButtons.style.display = 'none';
            }
        });
        
        // Copy data button
        document.getElementById('tw-copy-data').addEventListener('click', function(e) {
            e.preventDefault();
            copyAttackDataToClipboard();
        });
        
        // Download data button
        document.getElementById('tw-download-data').addEventListener('click', function(e) {
            e.preventDefault();
            downloadAttackData();
        });
        
        // Clear history button
        document.getElementById('tw-clear-history').addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Clear all attack history?')) {
                AttackDataStorage.clearHistory();
                updateAttackDataDisplay();
            }
        });
        
        startDisplayUpdates();
    }
    
    // Update attack data display
    function updateAttackDataDisplay() {
        const exportContent = document.getElementById('tw-export-content');
        if (!exportContent) return;
        
        const lastAttack = AttackDataStorage.getLastAttack();
        
        if (!lastAttack) {
            exportContent.textContent = 'No attack data saved yet.';
            return;
        }
        
        exportContent.textContent = AttackDataStorage.formatAttackForDisplay(lastAttack);
    }
    
    // Copy attack data to clipboard
    function copyAttackDataToClipboard() {
        const lastAttack = AttackDataStorage.getLastAttack();
        if (!lastAttack) {
            alert('No attack data to copy!');
            return;
        }
        
        const text = AttackDataStorage.formatAttackForDisplay(lastAttack);
        
        navigator.clipboard.writeText(text).then(() => {
            alert('Attack data copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy data. Please try again.');
        });
    }
    
    // Download attack data
    function downloadAttackData() {
        const lastAttack = AttackDataStorage.getLastAttack();
        if (!lastAttack) {
            alert('No attack data to download!');
            return;
        }
        
        const text = AttackDataStorage.formatAttackForDisplay(lastAttack);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.href = url;
        a.download = `attack-data-${timestamp}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Save attack data to sessionStorage
    function saveAttackData() {
        if (!state.currentAttackData) {
            console.warn('No attack data to save');
            return;
        }
        
        const attackData = {
            // Timings
            startTime: formatTime(new Date()),
            enemyArrival: formatTime(state.targetTime),
            clickAt: formatTime(state.clickTime),
            
            // Travel info
            duration: formatDuration(getDurationTime()),
            arriveToDestination: formatTime(new Date(state.clickTime.getTime() + getDurationTime())),
            returnIfNotCancel: formatTime(new Date(state.clickTime.getTime() + getDurationTime() * 2)),
            latency: `${getLatency().toFixed(1)}ms`,
            
            // Scheduled times
            willArriveAt: formatTime(state.fixedArriveTime),
            willReturnAt: formatTime(state.fixedReturnTime),
            
            // Settings
            updateInterval: document.getElementById('tw-update-input').value + 'ms',
            maxCancel: document.getElementById('tw-cancel-input').value + 'min',
            attackDelay: document.getElementById('tw-delay-input').value + 'ms',
            
            // Server info
            enemy: document.getElementById('tw-target-text').textContent,
            offset: `${Math.round(state.serverTimeOffset)}ms`,
            
            // Additional info
            notes: `Cancel time adjusted to ${state.currentAttackData.adjustedMaxCancel.toFixed(1)}min (requested: ${document.getElementById('tw-cancel-input').value}min)`
        };
        
        const savedAttack = AttackDataStorage.saveAttackData(attackData);
        
        // Show export section
        document.getElementById('tw-export-container').style.display = 'block';
        
        return savedAttack;
    }
    
    // Get server time from element
    function getServerTimeFromElement() {
        const el = document.querySelector('#serverTime');
        if (!el) return null;
        
        const text = el.textContent || '00:00:00';
        const parts = text.split(':').map(Number);
        
        const date = new Date();
        date.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
        return date;
    }
    
    // Get estimated server time with milliseconds
    function getEstimatedServerTime() {
        if (!state.calibrationComplete) {
            const serverTime = getServerTimeFromElement();
            if (!serverTime) return new Date();
            
            serverTime.setMilliseconds(new Date().getMilliseconds());
            return serverTime;
        }
        
        const now = new Date();
        return new Date(now.getTime() + state.serverTimeOffset);
    }
    
    // Format time
    function formatTime(date) {
        if (!date) return '--:--:--:---';
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        const s = date.getSeconds().toString().padStart(2, '0');
        const ms = date.getMilliseconds().toString().padStart(3, '0');
        return `${h}:${m}:${s}:${ms}`;
    }
    
    // Format duration
    function formatDuration(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Calibrate server time
    function calibrateServerTime() {
        const statusEl = document.getElementById('tw-status');
        const calibrationStatus = document.getElementById('tw-calibration-status');
        
        if (!statusEl || !calibrationStatus) return;
        
        calibrationStatus.style.display = 'block';
        statusEl.textContent = '🔄 Calibrating server time...';
        
        const serverEl = document.querySelector('#serverTime');
        if (!serverEl) {
            statusEl.textContent = '❌ No server time element!';
            return;
        }
        
        state.calibrationData = [];
        let samples = 0;
        
        const observer = new MutationObserver(() => {
            const now = Date.now();
            const serverTime = getServerTimeFromElement();
            
            if (serverTime) {
                const localTime = new Date(now);
                const offset = serverTime.getTime() - localTime.getTime();
                
                state.calibrationData.push({
                    time: now,
                    offset: offset,
                    serverText: serverEl.textContent
                });
                
                samples++;
                
                const avgOffset = state.calibrationData.reduce((sum, d) => sum + d.offset, 0) / samples;
                state.serverTimeOffset = avgOffset;
                
                calibrationStatus.innerHTML = `🔄 Calibrating... ${samples}/${CONFIG.calibrationSamples}<br>Offset: ${Math.round(avgOffset)}ms`;
                
                if (samples >= CONFIG.calibrationSamples) {
                    finishCalibration();
                }
            }
        });
        
        observer.observe(serverEl, {
            characterData: true,
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            if (samples > 0) {
                finishCalibration();
            } else {
                statusEl.textContent = '⚠️ Using estimated server time';
                calibrationStatus.style.display = 'none';
                state.calibrationComplete = true;
            }
        }, 10000);
        
        function finishCalibration() {
            observer.disconnect();
            
            const avgOffset = state.calibrationData.reduce((sum, d) => sum + d.offset, 0) / samples;
            state.serverTimeOffset = avgOffset;
            state.calibrationComplete = true;
            
            calibrationStatus.style.display = 'none';
            statusEl.textContent = `✅ Calibrated! Offset: ${Math.round(avgOffset)}ms`;
        }
    }
    
    // Start display updates
    function startDisplayUpdates() {
        const updateInterval = parseInt(document.getElementById('tw-update-input').value, 10) || 10;
        
        setInterval(() => {
            const serverTime = getEstimatedServerTime();
            const latency = getLatency();
            
            document.getElementById('tw-current-display').textContent = `⏰ Server: ${formatTime(serverTime)}`;
            
            const durationInfo = document.getElementById('tw-duration-info');
            if (durationInfo) {
                const duration = getDurationTime();
                durationInfo.innerHTML = `<div class="tw-duration-stats">
                    <span>📊 Duration: ${formatDuration(duration)}</span>
                    <span>📡 Latency: ${latency.toFixed(1)}ms</span>
                </div>`;
            }
            
            updateDurationTimes(serverTime);
            
            const targetInput = document.getElementById('tw-target-input');
            if (!targetInput.value || targetInput.value === '00:00:00:000') {
                targetInput.value = formatTime(serverTime);
            }
        }, updateInterval);
    }
    
    // Update duration times
    function updateDurationTimes(currentTime) {
        const duration = getDurationTime();
        
        const arriveTime = new Date(currentTime.getTime() + duration);
        const arriveTimeElement = document.getElementById('tw-arrive-time');
        if (arriveTimeElement) {
            arriveTimeElement.textContent = formatTime(arriveTime);
        }
        
        const returnTime = new Date(arriveTime.getTime() + duration);
        const returnTimeElement = document.getElementById('tw-return-time');
        if (returnTimeElement) {
            returnTimeElement.textContent = formatTime(returnTime);
        }
    }
    
    // Calculate attack time with EXACT millisecond timing
    function calculateAttackTime(targetTime, maxCancelMinutes, attackDelay) {
        const current = getEstimatedServerTime();
        const latency = getLatency();
        
        const maxCancelMs = maxCancelMinutes * 60 * 1000;
        const twoTimesCancel = maxCancelMs * 2;
        const timeAvailable = targetTime.getTime() - current.getTime();
        
        console.log('=== CALCULATION START ===');
        console.log('Target (enemy):', formatTime(targetTime), 'ms=', targetTime.getMilliseconds());
        console.log('Current time:', formatTime(current));
        console.log('Attack delay:', attackDelay, 'ms');
        console.log('Latency:', latency, 'ms');
        console.log('Time available:', timeAvailable, 'ms');
        console.log('2x cancel needed:', twoTimesCancel, 'ms');
        
        let adjustedMaxCancelMs = maxCancelMs;
        let clickTime;
        
        if (timeAvailable >= twoTimesCancel) {
            // CASE 1: Enough time for full 2x cancel
            const latestAttackMs = targetTime.getTime() - twoTimesCancel;
            clickTime = new Date(latestAttackMs - attackDelay - latency);
            console.log('Using FULL cancel time');
            console.log('Latest attack:', formatTime(new Date(latestAttackMs)));
        } else {
            // CASE 2: Not enough time for full 2x cancel
            // BUT we still want to match the milliseconds pattern
            
            // Calculate the milliseconds pattern we want:
            // click_ms = target_ms - attackDelay - latency (mod 1000)
            const targetMs = targetTime.getMilliseconds();
            let desiredClickMs = targetMs - attackDelay - latency;
            
            // Handle negative milliseconds (wrap around)
            while (desiredClickMs < 0) {
                desiredClickMs += 1000;
            }
            desiredClickMs = desiredClickMs % 1000;
            
            console.log('Target milliseconds:', targetMs);
            console.log('Desired click milliseconds:', desiredClickMs, '(target - delay - latency)');
            
            // We need to click at least 100ms from now for safety
            const minClickTime = new Date(current.getTime() + 100);
            
            // Find the next time with the desired milliseconds that's at least 100ms from now
            let candidateTime = new Date(minClickTime);
            
            // Adjust candidate time to have the right milliseconds
            const currentCandidateMs = candidateTime.getMilliseconds();
            let msToAdd = desiredClickMs - currentCandidateMs;
            
            if (msToAdd < 0) {
                msToAdd += 1000; // Add a second if we need to wrap around
            }
            
            candidateTime = new Date(candidateTime.getTime() + msToAdd);
            
            // Double-check it's still in the future
            if (candidateTime.getTime() - current.getTime() < 100) {
                candidateTime = new Date(candidateTime.getTime() + 1000); // Add another second
            }
            
            clickTime = candidateTime;
            
            // Calculate what cancel time this gives us
            // Formula: click = target - 2x cancel - delay - latency
            // So: 2x cancel = target - click - delay - latency
            const timeFromClickToTarget = targetTime.getTime() - clickTime.getTime();
            const totalForCancel = timeFromClickToTarget - attackDelay - latency;
            
            if (totalForCancel < 2000) { // Less than 2 seconds total
                adjustedMaxCancelMs = 1000; // Minimum 1 second cancel
            } else {
                adjustedMaxCancelMs = Math.floor(totalForCancel / 2);
            }
            
            console.log('Using ADJUSTED timing with milliseconds match');
            console.log('Found click time:', formatTime(clickTime), 'ms=', clickTime.getMilliseconds());
            console.log('Time from click to target:', timeFromClickToTarget, 'ms');
            console.log('Adjusted cancel:', adjustedMaxCancelMs, 'ms');
        }
        
        const remaining = clickTime.getTime() - current.getTime();
        
        console.log('Final click time:', formatTime(clickTime));
        console.log('Remaining until click:', remaining, 'ms');
        console.log('Adjusted max cancel:', adjustedMaxCancelMs, 'ms =', (adjustedMaxCancelMs/60000).toFixed(2), 'min');
        console.log('=== CALCULATION END ===');
        
        if (remaining < 100) {
            console.error('Click time is too close! Need at least 100ms');
            return null;
        }
        
        return {
            targetTime: targetTime,
            clickTime: clickTime,
            adjustedMaxCancel: adjustedMaxCancelMs / 60000,
            attackDelay: attackDelay,
            latency: latency,
            remaining: remaining,
            current: current
        };
    }
    
    // Start main timer
    function startMainTimer() {
        if (!state.calibrationComplete) {
            updateStatus('Calibrating... please wait', 'warning');
            return;
        }
        
        if (state.running) {
            updateStatus('Timer already running!', 'warning');
            return;
        }
        
        const targetInput = document.getElementById('tw-target-input').value;
        const parts = targetInput.split(':');
        
        if (parts.length < 3) {
            updateStatus('Invalid time format! Use HH:MM:SS:mmm', 'error');
            return;
        }
        
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const s = parseInt(parts[2], 10) || 0;
        const ms = parts[3] ? parseInt(parts[3], 10) || 0 : 0;
        
        const current = getEstimatedServerTime();
        const target = new Date(current);
        target.setHours(h, m, s, ms);
        
        if (target <= current) {
            target.setDate(target.getDate() + 1);
        }
        
        const maxCancel = parseInt(document.getElementById('tw-cancel-input').value, 10) || 10;
        const updateInterval = parseInt(document.getElementById('tw-update-input').value, 10) || 10;
        const attackDelay = parseInt(document.getElementById('tw-delay-input').value, 10) || 50;
        
        const calc = calculateAttackTime(target, maxCancel, attackDelay);
        
        if (!calc) {
            updateStatus('Cannot calculate attack time! Not enough time?', 'error');
            return;
        }
        
        if (calc.remaining < 100) {
            updateStatus(`Time too close (${calc.remaining}ms)! Need at least 100ms`, 'error');
            return;
        }
        
        // Store current attack data for saving
        state.currentAttackData = calc;
        
        // Show warning if max cancel was adjusted
        if (calc.adjustedMaxCancel.toFixed(1) !== maxCancel.toFixed(1)) {
            updateStatus(`⚠️ Max cancel adjusted to ${calc.adjustedMaxCancel.toFixed(1)}min`, 'warning');
        } else {
            updateStatus(`✅ Using ${maxCancel}min cancel time`, 'success');
        }
        
        const duration = getDurationTime();
        state.fixedArriveTime = new Date(calc.clickTime.getTime() + duration);
        state.fixedReturnTime = new Date(state.fixedArriveTime.getTime() + duration);
        
        state.running = true;
        state.targetTime = calc.targetTime;
        state.clickTime = calc.clickTime;
        state.updateInterval = Math.max(1, Math.min(100, updateInterval));
        
        document.getElementById('tw-start-btn').style.display = 'none';
        document.getElementById('tw-stop-btn').style.display = 'block';
        document.getElementById('tw-target-display').style.display = 'block';
        document.getElementById('tw-click-display').style.display = 'block';
        document.getElementById('tw-remaining-display').style.display = 'block';
        
        document.getElementById('tw-fixed-times').style.display = 'block';
        document.getElementById('tw-fixed-arrive').textContent = formatTime(state.fixedArriveTime);
        document.getElementById('tw-fixed-return').textContent = formatTime(state.fixedReturnTime);
        
        document.getElementById('tw-target-text').textContent = formatTime(calc.targetTime);
        document.getElementById('tw-click-text').textContent = formatTime(calc.clickTime);
        
        updateStatus(`✅ Timer started! Clicking in ${(calc.remaining/1000).toFixed(1)}s (${attackDelay}ms delay + ${calc.latency.toFixed(1)}ms latency)`, 'success');
        
        startPrecisionTimer();
    }
    
    // Start precision timer
    function startPrecisionTimer() {
        if (state.timerId) {
            clearInterval(state.timerId);
        }
        
        let lastDisplayUpdate = 0;
        
        state.timerId = setInterval(() => {
            if (!state.running) return;
            
            const now = Date.now();
            const current = getEstimatedServerTime();
            const remaining = state.clickTime.getTime() - current.getTime();
            
            if (now - lastDisplayUpdate >= 50) {
                lastDisplayUpdate = now;
                
                document.getElementById('tw-current-display').textContent = `⏰ Server: ${formatTime(current)}`;
                document.getElementById('tw-remaining-text').textContent = `${remaining}ms`;
                
                updateDurationTimes(current);
                
                const remainingEl = document.getElementById('tw-remaining-text');
                if (remaining > 10000) {
                    remainingEl.className = '';
                } else if (remaining > 2000) {
                    remainingEl.className = 'tw-remaining-low';
                } else {
                    remainingEl.className = 'tw-remaining-critical';
                }
            }
            
            if (remaining <= 0) {
                clearInterval(state.timerId);
                state.timerId = null;
                executeAttack();
            }
        }, state.updateInterval);
    }
    
    // Execute attack
    function executeAttack() {
        // Save attack data BEFORE clicking the button
        saveAttackData();
        
        stopMainTimer();
        
        const attackBtn = document.querySelector('#troop_confirm_submit');
        if (!attackBtn) {
            updateStatus('❌ No attack button found!', 'error');
            return;
        }
        
        updateStatus('✅ Executing attack...', 'success');
        
        try {
            const originalOnclick = attackBtn.onclick;
            attackBtn.onclick = null;
            attackBtn.click();
            
            if (originalOnclick) {
                attackBtn.onclick = originalOnclick;
            }
            
            console.log('Attack data saved and button clicked!');
            
        } catch (error) {
            console.error('Error clicking attack button:', error);
            updateStatus('❌ Click error: ' + error.message, 'error');
            
            try {
                const form = attackBtn.closest('form');
                if (form) {
                    form.submit();
                }
            } catch (e) {
                console.error('Form submission failed:', e);
            }
        }
    }
    
    // Stop main timer
    function stopMainTimer() {
        state.running = false;
        
        if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
        
        document.getElementById('tw-start-btn').style.display = 'block';
        document.getElementById('tw-stop-btn').style.display = 'none';
        document.getElementById('tw-target-display').style.display = 'none';
        document.getElementById('tw-click-display').style.display = 'none';
        document.getElementById('tw-remaining-display').style.display = 'none';
        
        document.getElementById('tw-fixed-times').style.display = 'none';
        state.fixedArriveTime = null;
        state.fixedReturnTime = null;
        
        updateStatus('Timer stopped', 'info');
    }
    
    // Update status
    function updateStatus(msg, type = 'info') {
        const el = document.getElementById('tw-status');
        if (!el) return;
        
        el.textContent = msg;
        el.className = 'tw-status-box';
        
        switch (type) {
            case 'error':
                el.classList.add('tw-status-error');
                break;
            case 'warning':
                el.classList.add('tw-status-warning');
                break;
            case 'success':
                el.classList.add('tw-status-success');
                break;
            case 'info':
                el.classList.add('tw-status-info');
                break;
        }
    }
    
    // Initialize
    console.log('Precision Attack Timer loaded.');
    init();
    
})();
