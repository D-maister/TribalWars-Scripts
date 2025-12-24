// ==UserScript==
// @name         Tribal Wars Precision Attack Timer
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Precision attack timer with server time synchronization
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=== PRECISION ATTACK TIMER ===');
    
    const CONFIG = {
        defaultUpdateInterval: 10,      // 10ms update for precision
        defaultMaxCancelMinutes: 10,    // 10 minutes default
        defaultAttackDelay: 50,         // 50ms default delay before attack
        minSafetyMargin: 100,           // Minimal safety margin (100ms)
        maxCancelMultiplier: 2,         // Multiply by 2 for latest attack
        calibrationSamples: 10          // Server time calibration samples
    };
    
    let state = {
        running: false,
        targetTime: null,        // When enemy attack arrives
        clickTime: null,         // When we click (target - 2x cancel - attack delay - latency)
        timerId: null,
        serverTimeOffset: 0,     // Server time - local time offset
        calibrationComplete: false,
        calibrationData: [],
        updateInterval: CONFIG.defaultUpdateInterval,
        maxCancelTime: CONFIG.defaultMaxCancelMinutes * 60 * 1000,
        fixedArriveTime: null,   // Arrive time based on click time + duration (no latency)
        fixedReturnTime: null    // Return time based on arrive time + duration
    };
    
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
            
            // Auto-calibrate on load
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
            // Try the specific selector first
            const durationElement = document.querySelector("#command-data-form > div:nth-child(9) > table > tbody > tr:nth-child(4) > td:nth-child(2)");
            if (durationElement) {
                const text = durationElement.textContent.trim();
                
                // Parse duration like "0:05:23"
                const parts = text.split(':');
                if (parts.length === 3) {
                    const hours = parseInt(parts[0], 10) || 0;
                    const minutes = parseInt(parts[1], 10) || 0;
                    const seconds = parseInt(parts[2], 10) || 0;
                    
                    return (hours * 3600 + minutes * 60 + seconds) * 1000;
                }
            }
            
            // Alternative selectors
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
    
    // Add main UI with white theme
    function addMainUI(attackBtn) {
        const current = getEstimatedServerTime();
        const duration = getDurationTime();
        const latency = getLatency();
        
        // Calculate times based on duration
        const arriveTime = new Date(current.getTime() + duration);
        const returnTime = new Date(arriveTime.getTime() + duration);
        
        const div = document.createElement('div');
        div.id = 'tw-precision-main';
        div.innerHTML = `
            <div style="
                background: linear-gradient(145deg, #ffffff, #f5f5f5);
                border: 2px solid #4CAF50;
                border-radius: 12px;
                padding: 25px;
                margin: 25px 0;
                color: #333;
                box-shadow: 0 6px 30px rgba(76, 175, 80, 0.15);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <h3 style="
                    margin: 0 0 20px 0;
                    color: #2E7D32;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 20px;
                    border-bottom: 2px solid rgba(76, 175, 80, 0.2);
                    padding-bottom: 15px;
                ">
                    <span style="font-size: 28px;">🎯</span>
                    <span>Precision Attack Timer</span>
                </h3>
                
                <!-- CALIBRATION STATUS -->
                <div id="tw-calibration-status" style="
                    padding: 12px;
                    background: rgba(76, 175, 80, 0.08);
                    border: 1px solid #4CAF50;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    color: #2E7D32;
                    font-size: 14px;
                    display: none;
                ">
                    🔄 Calibrating server time...
                </div>
                
                <!-- DURATION INFO -->
                <div id="tw-duration-info" style="
                    padding: 12px;
                    background: rgba(33, 150, 243, 0.08);
                    border: 1px solid #2196F3;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    color: #1565C0;
                    font-size: 14px;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>📊 Duration: ${formatDuration(duration)}</span>
                        <span>📡 Latency: ${latency.toFixed(1)}ms</span>
                    </div>
                </div>
                
                <!-- CURRENT TRAVEL TIMES -->
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 20px;
                ">
                    <!-- ARRIVE TO DESTINATION -->
                    <div style="
                        background: rgba(76, 175, 80, 0.05);
                        border: 1px solid rgba(76, 175, 80, 0.3);
                        border-radius: 8px;
                        padding: 15px;
                    ">
                        <div style="
                            color: #2E7D32;
                            margin-bottom: 8px;
                            font-size: 14px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            font-weight: 500;
                        ">
                            <span style="font-size: 20px;">📍</span>
                            <span>Arrive to destination:</span>
                        </div>
                        <div id="tw-arrive-time" style="
                            color: #2E7D32;
                            font-family: 'Courier New', monospace;
                            font-size: 16px;
                            font-weight: bold;
                        ">
                            ${formatTime(arriveTime)}
                        </div>
                    </div>
                    
                    <!-- RETURN IF NOT CANCEL -->
                    <div style="
                        background: rgba(255, 152, 0, 0.05);
                        border: 1px solid rgba(255, 152, 0, 0.3);
                        border-radius: 8px;
                        padding: 15px;
                    ">
                        <div style="
                            color: #EF6C00;
                            margin-bottom: 8px;
                            font-size: 14px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            font-weight: 500;
                        ">
                            <span style="font-size: 20px;">↩️</span>
                            <span>Return if not cancel:</span>
                        </div>
                        <div id="tw-return-time" style="
                            color: #EF6C00;
                            font-family: 'Courier New', monospace;
                            font-size: 16px;
                            font-weight: bold;
                        ">
                            ${formatTime(returnTime)}
                        </div>
                    </div>
                </div>
                
                <!-- FIXED TIMES (When timer starts) -->
                <div id="tw-fixed-times" style="display: none; margin-bottom: 20px;">
                    <div style="
                        background: rgba(63, 81, 181, 0.05);
                        border: 1px solid #3F51B5;
                        border-radius: 8px;
                        padding: 15px;
                    ">
                        <div style="
                            color: #3F51B5;
                            margin-bottom: 12px;
                            font-size: 15px;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            font-weight: 600;
                        ">
                            <span style="font-size: 20px;">⏱️</span>
                            <span>Scheduled Attack Times</span>
                        </div>
                        <div style="
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 15px;
                        ">
                            <!-- FIXED ARRIVE TIME -->
                            <div style="
                                background: rgba(76, 175, 80, 0.08);
                                border: 1px solid #4CAF50;
                                border-radius: 6px;
                                padding: 12px;
                            ">
                                <div style="
                                    color: #2E7D32;
                                    margin-bottom: 6px;
                                    font-size: 13px;
                                    font-weight: 500;
                                ">
                                    Will arrive at:
                                </div>
                                <div id="tw-fixed-arrive" style="
                                    color: #2E7D32;
                                    font-family: 'Courier New', monospace;
                                    font-size: 15px;
                                    font-weight: bold;
                                ">
                                    --:--:--:---
                                </div>
                            </div>
                            
                            <!-- FIXED RETURN TIME -->
                            <div style="
                                background: rgba(255, 152, 0, 0.08);
                                border: 1px solid #FF9800;
                                border-radius: 6px;
                                padding: 12px;
                            ">
                                <div style="
                                    color: #EF6C00;
                                    margin-bottom: 6px;
                                    font-size: 13px;
                                    font-weight: 500;
                                ">
                                    Will return at:
                                </div>
                                <div id="tw-fixed-return" style="
                                    color: #EF6C00;
                                    font-family: 'Courier New', monospace;
                                    font-size: 15px;
                                    font-weight: bold;
                                ">
                                    --:--:--:---
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- TARGET TIME -->
                <div style="margin-bottom: 20px;">
                    <div style="
                        color: #555;
                        margin-bottom: 8px;
                        font-size: 14px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span style="font-weight: 500;">🎯 Enemy Arrival Time:</span>
                        <span style="color: #4CAF50; font-size: 12px; font-family: monospace;">HH:MM:SS:mmm</span>
                    </div>
                    <input type="text" 
                           id="tw-target-input" 
                           value="${formatTime(current)}"
                           placeholder="13:44:30:054"
                           style="
                               width: 100%;
                               padding: 12px;
                               background: #fff;
                               border: 2px solid #ddd;
                               color: #333;
                               border-radius: 6px;
                               font-family: monospace;
                               font-size: 15px;
                               transition: border-color 0.3s;
                           "
                           onfocus="this.style.borderColor='#4CAF50'"
                           onblur="this.style.borderColor='#ddd'">
                </div>
                
                <!-- SETTINGS ROW -->
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 20px;
                ">
                    <div>
                        <div style="color: #555; margin-bottom: 8px; font-size: 14px; font-weight: 500;">
                            🔄 Update (ms):
                        </div>
                        <input type="number" 
                               id="tw-update-input" 
                               value="10"
                               min="1" 
                               max="100"
                               step="1"
                               style="
                                   width: 100%;
                                   padding: 10px;
                                   background: #fff;
                                   border: 2px solid #ddd;
                                   color: #333;
                                   border-radius: 6px;
                               ">
                    </div>
                    
                    <div>
                        <div style="color: #555; margin-bottom: 8px; font-size: 14px; font-weight: 500;">
                            ⏰ Max Cancel (min):
                        </div>
                        <input type="number" 
                               id="tw-cancel-input" 
                               value="10"
                               min="1" 
                               max="60"
                               step="1"
                               style="
                                   width: 100%;
                                   padding: 10px;
                                   background: #fff;
                                   border: 2px solid #ddd;
                                   color: #333;
                                   border-radius: 6px;
                               ">
                    </div>
                    
                    <div>
                        <div style="color: #555; margin-bottom: 8px; font-size: 14px; font-weight: 500;">
                            ⏱️ Attack Delay (ms):
                        </div>
                        <input type="number" 
                               id="tw-delay-input" 
                               value="50"
                               min="1" 
                               max="500"
                               step="1"
                               style="
                                   width: 100%;
                                   padding: 10px;
                                   background: #fff;
                                   border: 2px solid #ddd;
                                   color: #333;
                                   border-radius: 6px;
                               ">
                    </div>
                </div>
                
                <!-- BUTTONS -->
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 25px;
                ">
                    <button id="tw-start-btn" style="
                        padding: 14px;
                        background: linear-gradient(145deg, #4CAF50, #388E3C);
                        border: none;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 15px;
                        transition: all 0.3s;
                        box-shadow: 0 3px 10px rgba(76, 175, 80, 0.2);
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(76, 175, 80, 0.3)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 10px rgba(76, 175, 80, 0.2)'">
                        🚀 Start Timer
                    </button>
                    
                    <button id="tw-stop-btn" style="
                        padding: 14px;
                        background: linear-gradient(145deg, #F44336, #D32F2F);
                        border: none;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        font-size: 15px;
                        transition: all 0.3s;
                        box-shadow: 0 3px 10px rgba(244, 67, 54, 0.2);
                        display: none;
                    "
                    onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(244, 67, 54, 0.3)'"
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 10px rgba(244, 67, 54, 0.2)'">
                        ⏹️ Stop
                    </button>
                </div>
                
                <!-- STATUS -->
                <div id="tw-status" style="
                    padding: 15px;
                    background: rgba(76, 175, 80, 0.08);
                    border-radius: 8px;
                    margin-bottom: 25px;
                    border-left: 4px solid #4CAF50;
                    color: #2E7D32;
                    font-size: 14px;
                    min-height: 24px;
                ">
                    🔄 Calibrating server time...
                </div>
                
                <!-- TIME DISPLAY -->
                <div style="
                    background: #f9f9f9;
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid #e0e0e0;
                ">
                    <div id="tw-current-display" style="
                        color: #4CAF50;
                        font-family: 'Courier New', monospace;
                        font-size: 17px;
                        font-weight: bold;
                        margin-bottom: 15px;
                    ">
                        ⏰ Server: ${formatTime(current)}
                    </div>
                    
                    <div id="tw-target-display" style="
                        color: #FF9800;
                        font-family: 'Courier New', monospace;
                        font-size: 17px;
                        font-weight: bold;
                        margin-bottom: 12px;
                        display: none;
                    ">
                        🎯 Enemy: <span id="tw-target-text">--:--:--:---</span>
                    </div>
                    
                    <div id="tw-click-display" style="
                        color: #2196F3;
                        font-family: 'Courier New', monospace;
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 12px;
                        display: none;
                    ">
                        🖱️ Click at: <span id="tw-click-text">--:--:--:---</span>
                    </div>
                    
                    <div id="tw-remaining-display" style="
                        color: #4CAF50;
                        font-family: 'Courier New', monospace;
                        font-size: 17px;
                        font-weight: bold;
                        display: none;
                    ">
                        ⏳ Remaining: <span id="tw-remaining-text">0ms</span>
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
        
        // Start display updates
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
                
                calibrationStatus.innerHTML = `
                    🔄 Calibrating... ${samples}/${CONFIG.calibrationSamples}<br>
                    Offset: ${Math.round(avgOffset)}ms
                `;
                
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
            
            console.log('Calibration complete:', {
                samples: samples,
                offset: avgOffset
            });
        }
    }
    
    // Start display updates
    function startDisplayUpdates() {
        const updateInterval = parseInt(document.getElementById('tw-update-input').value, 10) || 10;
        
        setInterval(() => {
            const serverTime = getEstimatedServerTime();
            const latency = getLatency();
            
            document.getElementById('tw-current-display').textContent = `⏰ Server: ${formatTime(serverTime)}`;
            
            // Update duration info with current latency
            const durationInfo = document.getElementById('tw-duration-info');
            if (durationInfo) {
                const duration = getDurationTime();
                durationInfo.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>📊 Duration: ${formatDuration(duration)}</span>
                    <span>📡 Latency: ${latency.toFixed(1)}ms</span>
                </div>`;
            }
            
            // Update duration times
            updateDurationTimes(serverTime);
            
            // Update target input if empty
            const targetInput = document.getElementById('tw-target-input');
            if (!targetInput.value || targetInput.value === '00:00:00:000') {
                targetInput.value = formatTime(serverTime);
            }
        }, updateInterval);
    }
    
    // Update duration times
    function updateDurationTimes(currentTime) {
        const duration = getDurationTime();
        
        // Calculate and update arrive time
        const arriveTime = new Date(currentTime.getTime() + duration);
        const arriveTimeElement = document.getElementById('tw-arrive-time');
        if (arriveTimeElement) {
            arriveTimeElement.textContent = formatTime(arriveTime);
        }
        
        // Calculate and update return time
        const returnTime = new Date(arriveTime.getTime() + duration);
        const returnTimeElement = document.getElementById('tw-return-time');
        if (returnTimeElement) {
            returnTimeElement.textContent = formatTime(returnTime);
        }
    }
    
    // Calculate attack time with EXACT millisecond timing
    function calculateAttackTime(targetTime, maxCancelMinutes, attackDelay) {
        // Get current server time
        const current = getEstimatedServerTime();
        const latency = getLatency();
        
        // Convert max cancel to ms
        const maxCancelMs = maxCancelMinutes * 60 * 1000;
        const twoTimesCancel = maxCancelMs * 2; // Always 2x for anti-noble
        
        // Calculate time available
        const timeAvailable = targetTime.getTime() - current.getTime();
        
        // Calculate adjusted cancel time
        let adjustedMaxCancelMs = maxCancelMs;
        if (timeAvailable < twoTimesCancel) {
            // Not enough time for full 2x cancel - use half of available time
            adjustedMaxCancelMs = Math.floor(timeAvailable / 2);
        }
        
        // Ensure we have at least 100ms margin
        if (adjustedMaxCancelMs * 2 > timeAvailable - CONFIG.minSafetyMargin) {
            adjustedMaxCancelMs = Math.floor((timeAvailable - CONFIG.minSafetyMargin) / 2);
        }
        
        // Calculate latest attack time: target - 2x adjusted cancel
        const latestAttackMs = targetTime.getTime() - (adjustedMaxCancelMs * 2);
        
        // Calculate click time: latest attack - attack delay - latency
        const clickTime = new Date(latestAttackMs - attackDelay - latency);
        
        console.log('=== CALCULATION DEBUG ===');
        console.log('Target time:', formatTime(targetTime));
        console.log('Current time:', formatTime(current));
        console.log('Time available:', timeAvailable, 'ms');
        console.log('Max cancel requested:', maxCancelMinutes, 'min =', maxCancelMs, 'ms');
        console.log('2x cancel needed:', twoTimesCancel, 'ms');
        console.log('Adjusted max cancel:', adjustedMaxCancelMs, 'ms =', (adjustedMaxCancelMs/60000).toFixed(1), 'min');
        console.log('Latest attack:', formatTime(new Date(latestAttackMs)));
        console.log('Attack delay:', attackDelay, 'ms');
        console.log('Latency:', latency, 'ms');
        console.log('Click time:', formatTime(clickTime));
        console.log('Remaining until click:', clickTime.getTime() - current.getTime(), 'ms');
        
        return {
            targetTime: targetTime,
            clickTime: clickTime,
            adjustedMaxCancel: adjustedMaxCancelMs / 60000,
            attackDelay: attackDelay,
            latency: latency,
            remaining: clickTime.getTime() - current.getTime(),
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
        
        // Get current server time
        const current = getEstimatedServerTime();
        
        // Create target
        const target = new Date(current);
        target.setHours(h, m, s, ms);
        
        // If target is in past, add 1 day
        if (target <= current) {
            target.setDate(target.getDate() + 1);
        }
        
        const maxCancel = parseInt(document.getElementById('tw-cancel-input').value, 10) || 10;
        const updateInterval = parseInt(document.getElementById('tw-update-input').value, 10) || 10;
        const attackDelay = parseInt(document.getElementById('tw-delay-input').value, 10) || 50;
        
        // Calculate attack time
        const calc = calculateAttackTime(target, maxCancel, attackDelay);
        
        if (calc.remaining < 100) {
            updateStatus('Target time too close! Need at least 100ms', 'error');
            return;
        }
        
        // Show warning if max cancel was adjusted
        if (calc.adjustedMaxCancel.toFixed(1) !== maxCancel.toFixed(1)) {
            updateStatus(`⚠️ Max cancel adjusted to ${calc.adjustedMaxCancel.toFixed(1)}min`, 'warning');
        } else {
            updateStatus(`✅ Using ${maxCancel}min cancel time`, 'success');
        }
        
        // Calculate fixed times based on click time (NO LATENCY added)
        const duration = getDurationTime();
        state.fixedArriveTime = new Date(calc.clickTime.getTime() + duration);
        state.fixedReturnTime = new Date(state.fixedArriveTime.getTime() + duration);
        
        // Update state
        state.running = true;
        state.targetTime = calc.targetTime;
        state.clickTime = calc.clickTime;
        state.updateInterval = Math.max(1, Math.min(100, updateInterval));
        
        // Update UI
        document.getElementById('tw-start-btn').style.display = 'none';
        document.getElementById('tw-stop-btn').style.display = 'block';
        document.getElementById('tw-target-display').style.display = 'block';
        document.getElementById('tw-click-display').style.display = 'block';
        document.getElementById('tw-remaining-display').style.display = 'block';
        
        // Show and update fixed times
        document.getElementById('tw-fixed-times').style.display = 'block';
        document.getElementById('tw-fixed-arrive').textContent = formatTime(state.fixedArriveTime);
        document.getElementById('tw-fixed-return').textContent = formatTime(state.fixedReturnTime);
        
        document.getElementById('tw-target-text').textContent = formatTime(calc.targetTime);
        document.getElementById('tw-click-text').textContent = formatTime(calc.clickTime);
        
        updateStatus(`✅ Timer started! Clicking in ${(calc.remaining/1000).toFixed(1)}s (${attackDelay}ms delay + ${calc.latency.toFixed(1)}ms latency)`, 'success');
        
        // Start precision timer
        startPrecisionTimer();
    }
    
    // Start precision timer
    function startPrecisionTimer() {
        if (state.timerId) {
            clearInterval(state.timerId);
        }
        
        let lastDisplayUpdate = 0;
        let executionCheckCount = 0;
        
        state.timerId = setInterval(() => {
            if (!state.running) return;
            
            const now = Date.now();
            
            // Get current server time
            const current = getEstimatedServerTime();
            
            // Calculate remaining
            const remaining = state.clickTime.getTime() - current.getTime();
            
            // Update display every ~50ms for performance
            if (now - lastDisplayUpdate >= 50) {
                lastDisplayUpdate = now;
                
                document.getElementById('tw-current-display').textContent = `⏰ Server: ${formatTime(current)}`;
                document.getElementById('tw-remaining-text').textContent = `${remaining}ms`;
                
                // Update duration times
                updateDurationTimes(current);
                
                // Color coding
                const el = document.getElementById('tw-remaining-text');
                if (remaining > 10000) {
                    el.style.color = '#4CAF50';
                } else if (remaining > 2000) {
                    el.style.color = '#FF9800';
                } else if (remaining > 500) {
                    el.style.color = '#FF5722';
                } else {
                    el.style.color = '#F44336';
                    el.style.fontWeight = 'bold';
                }
            }
            
            // Debug logging (every 100 checks)
            executionCheckCount++;
            if (executionCheckCount % 100 === 0) {
                console.log(`Timer check #${executionCheckCount}: Remaining = ${remaining}ms`);
            }
            
            // Check execution
            if (remaining <= 0) {
                console.log('EXECUTE CONDITION MET! Remaining:', remaining);
                clearInterval(state.timerId);
                state.timerId = null;
                executeAttack();
            }
        }, state.updateInterval);
    }
    
    // Execute attack
    function executeAttack() {
        console.log('=== EXECUTING PRECISION ATTACK ===');
        
        // Stop timer first
        stopMainTimer();
        
        const attackBtn = document.querySelector('#troop_confirm_submit');
        if (!attackBtn) {
            updateStatus('❌ No attack button found!', 'error');
            return;
        }
        
        console.log('Attack button found, clicking now...');
        
        updateStatus('✅ Executing attack...', 'success');
        
        // Simple direct click
        try {
            // Save original onclick
            const originalOnclick = attackBtn.onclick;
            
            // Remove any onclick handler that might interfere
            attackBtn.onclick = null;
            
            // Perform the click
            attackBtn.click();
            
            // Restore original onclick if it existed
            if (originalOnclick) {
                attackBtn.onclick = originalOnclick;
            }
            
            console.log('Attack button clicked successfully!');
            
            // Log expected times
            console.log('Expected arrive:', formatTime(state.fixedArriveTime));
            console.log('Expected return:', formatTime(state.fixedReturnTime));
            
        } catch (error) {
            console.error('Error clicking attack button:', error);
            updateStatus('❌ Click error: ' + error.message, 'error');
            
            // Try form submission as backup
            try {
                const form = attackBtn.closest('form');
                if (form) {
                    form.submit();
                }
            } catch (e) {
                console.error('Form submission also failed:', e);
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
        
        // Hide fixed times
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
        
        switch (type) {
            case 'error':
                el.style.borderLeftColor = '#F44336';
                el.style.color = '#D32F2F';
                el.style.background = 'rgba(244, 67, 54, 0.08)';
                break;
            case 'warning':
                el.style.borderLeftColor = '#FF9800';
                el.style.color = '#EF6C00';
                el.style.background = 'rgba(255, 152, 0, 0.08)';
                break;
            case 'success':
                el.style.borderLeftColor = '#4CAF50';
                el.style.color = '#2E7D32';
                el.style.background = 'rgba(76, 175, 80, 0.08)';
                break;
            default:
                el.style.borderLeftColor = '#2196F3';
                el.style.color = '#1565C0';
                el.style.background = 'rgba(33, 150, 243, 0.08)';
        }
    }
    
    // Initialize
    console.log('Precision Attack Timer loaded.');
    init();
    
})();
