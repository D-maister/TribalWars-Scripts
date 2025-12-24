// ==UserScript==
// @name         Tribal Wars Precision Attack Timer
// @namespace    http://tampermonkey.net/
// @version      1.8
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
        fixedReturnTime: null
    };
    
    // Storage functions
    const AttackLogger = {
        STORAGE_KEY: 'twAttackLogs',
        MAX_LOGS: 50,
        
        init() {
            if (!sessionStorage.getItem(this.STORAGE_KEY)) {
                sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
            }
        },
        
        logAttack(data) {
            const logs = this.getLogs();
            logs.unshift({
                timestamp: Date.now(),
                data: data
            });
            
            // Keep only last MAX_LOGS entries
            if (logs.length > this.MAX_LOGS) {
                logs.length = this.MAX_LOGS;
            }
            
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
            
            // Also log to console for debugging
            console.log('Attack logged to sessionStorage:', data);
        },
        
        getLogs() {
            const logs = sessionStorage.getItem(this.STORAGE_KEY);
            return logs ? JSON.parse(logs) : [];
        },
        
        clearLogs() {
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        },
        
        formatLogForDisplay(log) {
            const date = new Date(log.timestamp);
            return `[${date.toLocaleTimeString()}.${date.getMilliseconds().toString().padStart(3, '0')}] ${log.data.type || 'Attack'}: ${log.data.message || ''}`;
        }
    };
    
    // Initialize attack logger
    AttackLogger.init();
    
    // Add CSS styles (same as before, just adding a logs section)
    const style = document.createElement('style');
    style.textContent = `
        /* ... all previous CSS styles ... */
        
        .tw-logs-container {
            margin-top: 20px;
            display: none;
        }
        
        .tw-logs-box {
            background: rgba(96, 125, 139, 0.08);
            border: 1px solid #607D8B;
            border-radius: 8px;
            padding: 15px;
        }
        
        .tw-logs-header {
            color: #455A64;
            margin-bottom: 12px;
            font-size: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            justify-content: space-between;
        }
        
        .tw-logs-content {
            max-height: 200px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #37474F;
            background: rgba(255, 255, 255, 0.7);
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #ddd;
        }
        
        .tw-log-entry {
            margin-bottom: 4px;
            padding-bottom: 4px;
            border-bottom: 1px dashed #eee;
        }
        
        .tw-log-timestamp {
            color: #607D8B;
            font-weight: bold;
        }
        
        .tw-log-message {
            color: #333;
        }
        
        .tw-log-error {
            color: #D32F2F;
        }
        
        .tw-log-success {
            color: #2E7D32;
        }
        
        .tw-log-warning {
            color: #EF6C00;
        }
        
        .tw-log-info {
            color: #1565C0;
        }
        
        .tw-logs-toggle {
            background: none;
            border: none;
            color: #455A64;
            cursor: pointer;
            font-size: 12px;
            text-decoration: underline;
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
            AttackLogger.logAttack({
                type: 'error',
                message: `Error getting latency: ${error.message}`
            });
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
            
            AttackLogger.logAttack({
                type: 'warning',
                message: 'Could not find duration time element'
            });
            return 0;
        } catch (error) {
            AttackLogger.logAttack({
                type: 'error',
                message: `Error getting duration time: ${error.message}`
            });
            return 0;
        }
    }
    
    // Add main UI with logs section
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
                
                <!-- Attack Logs Section -->
                <div id="tw-logs-container" class="tw-logs-container">
                    <div class="tw-logs-box">
                        <div class="tw-logs-header">
                            <span>
                                <span style="font-size: 20px;">📋</span>
                                <span>Attack Logs</span>
                            </span>
                            <button id="tw-logs-toggle" class="tw-logs-toggle">
                                Show/Hide
                            </button>
                        </div>
                        <div id="tw-logs-content" class="tw-logs-content" style="display: none;">
                            <!-- Logs will be inserted here -->
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
        
        // Logs toggle
        document.getElementById('tw-logs-toggle').addEventListener('click', function(e) {
            e.preventDefault();
            const logsContent = document.getElementById('tw-logs-content');
            if (logsContent.style.display === 'none') {
                logsContent.style.display = 'block';
                updateLogsDisplay();
            } else {
                logsContent.style.display = 'none';
            }
        });
        
        startDisplayUpdates();
    }
    
    // Update logs display
    function updateLogsDisplay() {
        const logsContent = document.getElementById('tw-logs-content');
        if (!logsContent) return;
        
        const logs = AttackLogger.getLogs();
        if (logs.length === 0) {
            logsContent.innerHTML = '<div class="tw-log-entry">No logs yet</div>';
            return;
        }
        
        let html = '';
        logs.forEach((log, index) => {
            const date = new Date(log.timestamp);
            const timeStr = `${date.toLocaleTimeString()}.${date.getMilliseconds().toString().padStart(3, '0')}`;
            
            let logClass = 'tw-log-entry';
            switch (log.data.type) {
                case 'error': logClass += ' tw-log-error'; break;
                case 'success': logClass += ' tw-log-success'; break;
                case 'warning': logClass += ' tw-log-warning'; break;
                case 'info': logClass += ' tw-log-info'; break;
            }
            
            html += `
                <div class="${logClass}">
                    <span class="tw-log-timestamp">[${timeStr}]</span>
                    <span class="tw-log-message">${log.data.message || ''}</span>
                </div>
            `;
        });
        
        logsContent.innerHTML = html;
        
        // Auto-scroll to bottom
        logsContent.scrollTop = logsContent.scrollHeight;
    }
    
    // Log to both sessionStorage and console
    function logAttack(type, message, data = {}) {
        const logEntry = {
            type: type,
            message: message,
            ...data
        };
        
        AttackLogger.logAttack(logEntry);
        console.log(`[${type.toUpperCase()}] ${message}`, data);
        
        // Update display if visible
        const logsContent = document.getElementById('tw-logs-content');
        if (logsContent && logsContent.style.display !== 'none') {
            updateLogsDisplay();
        }
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
            
            logAttack('info', `Server time calibrated: ${Math.round(avgOffset)}ms offset`);
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
    
    // Calculate attack time with EXACT millisecond timing - CORRECTED VERSION
    function calculateAttackTime(targetTime, maxCancelMinutes, attackDelay) {
        const current = getEstimatedServerTime();
        const latency = getLatency();
        
        const maxCancelMs = maxCancelMinutes * 60 * 1000;
        const twoTimesCancel = maxCancelMs * 2;
        const timeAvailable = targetTime.getTime() - current.getTime();
        
        logAttack('info', 'Starting attack time calculation', {
            currentTime: formatTime(current),
            targetTime: formatTime(targetTime),
            maxCancel: maxCancelMinutes,
            attackDelay: attackDelay,
            latency: latency,
            timeAvailable: timeAvailable,
            twoTimesCancelNeeded: twoTimesCancel
        });
        
        let adjustedMaxCancelMs = maxCancelMs;
        let clickTime;
        
        if (timeAvailable >= twoTimesCancel) {
            // We have enough time for full 2x cancel
            const latestAttackMs = targetTime.getTime() - twoTimesCancel;
            clickTime = new Date(latestAttackMs - attackDelay - latency);
            
            logAttack('info', 'Using full cancel time', {
                latestAttack: formatTime(new Date(latestAttackMs)),
                clickTime: formatTime(clickTime)
            });
        } else {
            // Not enough time for full 2x cancel
            // We need to ensure click time is at least 100ms in the future
            
            // Minimum needed: attack delay + latency + 100ms safety margin
            const minNeeded = attackDelay + latency + 100;
            
            if (timeAvailable < minNeeded) {
                logAttack('error', 'Not enough time even for immediate attack', {
                    timeAvailable: timeAvailable,
                    minNeeded: minNeeded
                });
                return null;
            }
            
            // Calculate how much time we can use for cancel (after accounting for margins)
            // We want: target - (2 × cancel) - delay - latency >= current + 100
            // So: 2 × cancel <= target - current - delay - latency - 100
            const maxCancelPossible = Math.floor((timeAvailable - attackDelay - latency - 100) / 2);
            
            if (maxCancelPossible < 1000) {
                // Less than 1 second cancel time, attack immediately
                clickTime = new Date(current.getTime() + 100);
                adjustedMaxCancelMs = 1000; // Minimum 1 second
                
                logAttack('warning', 'Very tight timing, attacking immediately', {
                    clickTime: formatTime(clickTime),
                    adjustedCancel: adjustedMaxCancelMs
                });
            } else {
                // Use the maximum possible cancel time
                adjustedMaxCancelMs = maxCancelPossible;
                const latestAttackMs = targetTime.getTime() - (adjustedMaxCancelMs * 2);
                clickTime = new Date(latestAttackMs - attackDelay - latency);
                
                logAttack('info', 'Using reduced cancel time', {
                    adjustedCancel: adjustedMaxCancelMs,
                    latestAttack: formatTime(new Date(latestAttackMs)),
                    clickTime: formatTime(clickTime)
                });
            }
        }
        
        const remaining = clickTime.getTime() - current.getTime();
        
        logAttack('info', 'Calculation complete', {
            clickTime: formatTime(clickTime),
            remaining: remaining,
            adjustedMaxCancel: adjustedMaxCancelMs / 60000
        });
        
        if (remaining < 100) {
            logAttack('error', 'Click time is too close or in the past', {
                clickTime: formatTime(clickTime),
                currentTime: formatTime(current),
                remaining: remaining
            });
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
        logAttack('info', 'Starting main timer');
        
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
        
        logAttack('success', 'Timer started successfully', {
            targetTime: formatTime(calc.targetTime),
            clickTime: formatTime(calc.clickTime),
            remaining: calc.remaining,
            adjustedCancel: calc.adjustedMaxCancel,
            fixedArrive: formatTime(state.fixedArriveTime),
            fixedReturn: formatTime(state.fixedReturnTime)
        });
        
        // Show logs container
        document.getElementById('tw-logs-container').style.display = 'block';
        
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
                logAttack('info', 'Execution condition met', { remaining: remaining });
                clearInterval(state.timerId);
                state.timerId = null;
                executeAttack();
            }
        }, state.updateInterval);
    }
    
    // Execute attack
    function executeAttack() {
        logAttack('info', 'Executing attack');
        
        stopMainTimer();
        
        const attackBtn = document.querySelector('#troop_confirm_submit');
        if (!attackBtn) {
            updateStatus('❌ No attack button found!', 'error');
            logAttack('error', 'No attack button found');
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
            
            logAttack('success', 'Attack button clicked successfully', {
                expectedArrive: formatTime(state.fixedArriveTime),
                expectedReturn: formatTime(state.fixedReturnTime)
            });
            
        } catch (error) {
            logAttack('error', `Error clicking attack button: ${error.message}`);
            updateStatus('❌ Click error: ' + error.message, 'error');
            
            try {
                const form = attackBtn.closest('form');
                if (form) {
                    form.submit();
                    logAttack('info', 'Form submitted as backup');
                }
            } catch (e) {
                logAttack('error', `Form submission failed: ${e.message}`);
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
