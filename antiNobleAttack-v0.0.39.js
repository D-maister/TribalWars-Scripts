// ==UserScript==
// @name         Tribal Wars Precision Attack Timer
// @namespace    http://tampermonkey.net/
// @version      1.7
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
    
    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
        .tw-container {
            background: linear-gradient(145deg, #ffffff, #f5f5f5);
            border: 2px solid #4CAF50;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            color: #333;
            box-shadow: 0 6px 30px rgba(76, 175, 80, 0.15);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .tw-title {
            margin: 0 0 20px 0;
            color: #2E7D32;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 20px;
            border-bottom: 2px solid rgba(76, 175, 80, 0.2);
            padding-bottom: 15px;
        }
        
        .tw-title-icon {
            font-size: 28px;
        }
        
        .tw-status-box {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #4CAF50;
            color: #2E7D32;
            font-size: 14px;
            min-height: 24px;
            background: rgba(76, 175, 80, 0.08);
        }
        
        .tw-status-error {
            border-left-color: #F44336 !important;
            color: #D32F2F !important;
            background: rgba(244, 67, 54, 0.08) !important;
        }
        
        .tw-status-warning {
            border-left-color: #FF9800 !important;
            color: #EF6C00 !important;
            background: rgba(255, 152, 0, 0.08) !important;
        }
        
        .tw-status-success {
            border-left-color: #4CAF50 !important;
            color: #2E7D32 !important;
            background: rgba(76, 175, 80, 0.08) !important;
        }
        
        .tw-status-info {
            border-left-color: #2196F3 !important;
            color: #1565C0 !important;
            background: rgba(33, 150, 243, 0.08) !important;
        }
        
        .tw-calibration-status {
            padding: 15px;
            background: rgba(76, 175, 80, 0.08);
            border: 1px solid #4CAF50;
            border-radius: 6px;
            margin-bottom: 20px;
            color: #2E7D32;
            font-size: 14px;
            display: none;
        }
        
        .tw-duration-info {
            padding: 12px;
            background: rgba(33, 150, 243, 0.08);
            border: 1px solid #2196F3;
            border-radius: 6px;
            margin-bottom: 20px;
            color: #1565C0;
            font-size: 14px;
        }
        
        .tw-duration-stats {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .tw-times-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .tw-time-box {
            border-radius: 8px;
            padding: 15px;
        }
        
        .tw-arrive-box {
            background: rgba(76, 175, 80, 0.05);
            border: 1px solid rgba(76, 175, 80, 0.3);
        }
        
        .tw-return-box {
            background: rgba(255, 152, 0, 0.05);
            border: 1px solid rgba(255, 152, 0, 0.3);
        }
        
        .tw-time-label {
            margin-bottom: 8px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        }
        
        .tw-arrive-label {
            color: #2E7D32;
        }
        
        .tw-return-label {
            color: #EF6C00;
        }
        
        .tw-time-icon {
            font-size: 20px;
        }
        
        .tw-time-value {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
        }
        
        .tw-arrive-value {
            color: #2E7D32;
        }
        
        .tw-return-value {
            color: #EF6C00;
        }
        
        .tw-fixed-times-container {
            display: none;
            margin-bottom: 20px;
        }
        
        .tw-fixed-times-box {
            background: rgba(63, 81, 181, 0.05);
            border: 1px solid #3F51B5;
            border-radius: 8px;
            padding: 15px;
        }
        
        .tw-fixed-times-label {
            color: #3F51B5;
            margin-bottom: 12px;
            font-size: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
        }
        
        .tw-fixed-times-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .tw-fixed-time-box {
            border-radius: 6px;
            padding: 12px;
        }
        
        .tw-fixed-arrive-box {
            background: rgba(76, 175, 80, 0.08);
            border: 1px solid #4CAF50;
        }
        
        .tw-fixed-return-box {
            background: rgba(255, 152, 0, 0.08);
            border: 1px solid #FF9800;
        }
        
        .tw-fixed-time-label {
            margin-bottom: 6px;
            font-size: 13px;
            font-weight: 500;
        }
        
        .tw-fixed-arrive-label {
            color: #2E7D32;
        }
        
        .tw-fixed-return-label {
            color: #EF6C00;
        }
        
        .tw-fixed-time-value {
            font-family: 'Courier New', monospace;
            font-size: 15px;
            font-weight: bold;
        }
        
        .tw-fixed-arrive-value {
            color: #2E7D32;
        }
        
        .tw-fixed-return-value {
            color: #EF6C00;
        }
        
        .tw-target-input-container {
            margin-bottom: 20px;
        }
        
        .tw-input-label {
            color: #555;
            margin-bottom: 8px;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 500;
        }
        
        .tw-time-format {
            color: #4CAF50;
            font-size: 12px;
            font-family: monospace;
        }
        
        .tw-input {
            width: 100%;
            padding: 12px;
            background: #fff;
            border: 2px solid #ddd;
            color: #333;
            border-radius: 6px;
            font-family: monospace;
            font-size: 15px;
            transition: border-color 0.3s;
            box-sizing: border-box;
        }
        
        .tw-input:focus {
            border-color: #4CAF50;
            outline: none;
        }
        
        .tw-settings-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .tw-buttons-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .tw-button {
            padding: 14px;
            border: none;
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.3s;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        }
        
        .tw-button:hover {
            transform: translateY(-2px);
        }
        
        .tw-start-button {
            background: linear-gradient(145deg, #4CAF50, #388E3C);
            box-shadow: 0 3px 10px rgba(76, 175, 80, 0.2);
        }
        
        .tw-start-button:hover {
            box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
        }
        
        .tw-stop-button {
            background: linear-gradient(145deg, #F44336, #D32F2F);
            box-shadow: 0 3px 10px rgba(244, 67, 54, 0.2);
        }
        
        .tw-stop-button:hover {
            box-shadow: 0 5px 15px rgba(244, 67, 54, 0.3);
        }
        
        .tw-time-display {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        
        .tw-current-display {
            color: #4CAF50;
            font-family: 'Courier New', monospace;
            font-size: 17px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        
        .tw-target-display {
            color: #FF9800;
            font-family: 'Courier New', monospace;
            font-size: 17px;
            font-weight: bold;
            margin-bottom: 12px;
            display: none;
        }
        
        .tw-click-display {
            color: #2196F3;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 12px;
            display: none;
        }
        
        .tw-remaining-display {
            color: #4CAF50;
            font-family: 'Courier New', monospace;
            font-size: 17px;
            font-weight: bold;
            display: none;
        }
        
        .tw-remaining-low {
            color: #FF5722 !important;
        }
        
        .tw-remaining-critical {
            color: #F44336 !important;
            font-weight: bold !important;
        }
        
        .tw-monospace {
            font-family: 'Courier New', monospace;
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
            const durationElement = document.querySelector("#command-data-form table.vis tbody tr:nth-child(4) td:nth-child(2)");
            if (durationElement) {
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
    
    // Add main UI
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
            </div>
        `;
        
        attackBtn.parentNode.insertBefore(div, attackBtn.nextSibling);
        
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
        
        startDisplayUpdates();
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
    
    // Calculate attack time with EXACT millisecond timing - SIMPLE VERSION
    function calculateAttackTime(targetTime, maxCancelMinutes, attackDelay) {
        console.log('=== CALCULATION START ===');
        
        const current = getEstimatedServerTime();
        const latency = getLatency();
        
        console.log('Current time:', formatTime(current));
        console.log('Target time:', formatTime(targetTime));
        
        const maxCancelMs = maxCancelMinutes * 60 * 1000;
        const twoTimesCancel = maxCancelMs * 2;
        const timeAvailable = targetTime.getTime() - current.getTime();
        
        console.log('Time available:', timeAvailable, 'ms');
        console.log('2x cancel needed:', twoTimesCancel, 'ms');
        
        let adjustedMaxCancelMs = maxCancelMs;
        let clickTime;
        
        if (timeAvailable >= twoTimesCancel) {
            // We have enough time for full 2x cancel
            const latestAttackMs = targetTime.getTime() - twoTimesCancel;
            clickTime = new Date(latestAttackMs - attackDelay - latency);
            console.log('Using FULL cancel time');
        } else {
            // Not enough time for full 2x cancel
            // Attack as soon as possible while still matching milliseconds pattern
            
            // We need to attack at: target - X - delay - latency
            // Where X is as large as possible but <= timeAvailable - delay - latency
            
            const minClickOffset = attackDelay + latency + 100; // Minimum: delay + latency + 100ms margin
            
            if (timeAvailable < minClickOffset) {
                console.error('Not enough time even for immediate attack');
                return null;
            }
            
            // Calculate maximum time we can wait before clicking
            const maxClickOffset = timeAvailable - 100; // Leave 100ms margin
            
            // We want to attack at: target - (2 × cancel) - delay - latency
            // So: 2 × cancel = target - clickTime - delay - latency
            // We want cancel to be as large as possible
            
            // Let's find the largest cancel time that gives us a click time in the future
            // Start with maximum possible cancel (timeAvailable/2) and reduce if needed
            
            let attemptCancel = Math.floor(timeAvailable / 2);
            let attemptClickTime;
            let attempts = 0;
            
            do {
                const latestAttackMs = targetTime.getTime() - (attemptCancel * 2);
                attemptClickTime = new Date(latestAttackMs - attackDelay - latency);
                const attemptRemaining = attemptClickTime.getTime() - current.getTime();
                
                if (attemptRemaining >= 100) {
                    // This works!
                    clickTime = attemptClickTime;
                    adjustedMaxCancelMs = attemptCancel;
                    console.log(`Found working cancel after ${attempts} attempts:`, attemptCancel, 'ms');
                    break;
                }
                
                // Reduce cancel time and try again
                attemptCancel = Math.floor(attemptCancel * 0.9); // Reduce by 10%
                attempts++;
                
                if (attempts > 10 || attemptCancel < 1000) {
                    // Fallback: attack 100ms from now
                    clickTime = new Date(current.getTime() + 100);
                    adjustedMaxCancelMs = Math.floor((targetTime.getTime() - clickTime.getTime() - attackDelay - latency) / 2);
                    adjustedMaxCancelMs = Math.max(adjustedMaxCancelMs, 1000); // At least 1 second
                    console.log('Using fallback: attack 100ms from now');
                    break;
                }
            } while (true);
        }
        
        const remaining = clickTime.getTime() - current.getTime();
        
        console.log('Click time:', formatTime(clickTime));
        console.log('Remaining until click:', remaining, 'ms');
        console.log('Adjusted max cancel:', adjustedMaxCancelMs, 'ms =', (adjustedMaxCancelMs/60000).toFixed(2), 'min');
        console.log('=== CALCULATION END ===');
        
        if (remaining < 100) {
            console.error('Remaining time too small:', remaining, 'ms');
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
        console.log('=== START MAIN TIMER ===');
        
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
        
        console.log('Parsed target:', formatTime(target));
        console.log('Current time:', formatTime(current));
        console.log('Max cancel:', maxCancel, 'min');
        console.log('Attack delay:', attackDelay, 'ms');
        
        const calc = calculateAttackTime(target, maxCancel, attackDelay);
        
        if (!calc) {
            updateStatus('Cannot calculate attack time! Not enough time?', 'error');
            return;
        }
        
        console.log('Calculation result:', calc);
        console.log('Remaining time:', calc.remaining, 'ms');
        
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
                console.log('EXECUTE! Remaining:', remaining);
                clearInterval(state.timerId);
                state.timerId = null;
                executeAttack();
            }
        }, state.updateInterval);
    }
    
    // Execute attack
    function executeAttack() {
        console.log('=== EXECUTING PRECISION ATTACK ===');
        
        stopMainTimer();
        
        const attackBtn = document.querySelector('#troop_confirm_submit');
        if (!attackBtn) {
            updateStatus('❌ No attack button found!', 'error');
            return;
        }
        
        console.log('Attack button found, clicking...');
        
        updateStatus('✅ Executing attack...', 'success');
        
        try {
            const originalOnclick = attackBtn.onclick;
            attackBtn.onclick = null;
            attackBtn.click();
            
            if (originalOnclick) {
                attackBtn.onclick = originalOnclick;
            }
            
            console.log('Attack button clicked successfully!');
            console.log('Expected arrive:', formatTime(state.fixedArriveTime));
            console.log('Expected return:', formatTime(state.fixedReturnTime));
            
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
