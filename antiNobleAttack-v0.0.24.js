// ==UserScript==
// @name         Tribal Wars Precision Attack Timer
// @namespace    http://tampermonkey.net/
// @version      1.0
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
        safetyOffset: 50,               // 50ms safety margin
        minSafetyMargin: 5000,          // 5 seconds minimum
        maxCancelMultiplier: 2,         // Multiply by 2 for latest attack
        calibrationSamples: 10          // Server time calibration samples
    };
    
    let state = {
        running: false,
        targetTime: null,        // When enemy attack arrives
        clickTime: null,         // When we click (target - latency - 50ms)
        timerId: null,
        serverTimeOffset: 0,     // Server time - local time offset
        calibrationComplete: false,
        calibrationData: [],
        updateInterval: CONFIG.defaultUpdateInterval,
        maxCancelTime: CONFIG.defaultMaxCancelMinutes * 60 * 1000
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
    
    // Add main UI
    function addMainUI(attackBtn) {
        const current = getEstimatedServerTime();
        
        const div = document.createElement('div');
        div.id = 'tw-precision-main';
        div.innerHTML = `
            <div style="
                background: linear-gradient(145deg, #0a0a0a, #1a1a1a);
                border: 3px solid #00ff88;
                border-radius: 12px;
                padding: 25px;
                margin: 25px 0;
                color: white;
                box-shadow: 0 6px 30px rgba(0, 255, 136, 0.2);
            ">
                <h3 style="
                    margin: 0 0 20px 0;
                    color: #00ff88;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 20px;
                    border-bottom: 2px solid rgba(0, 255, 136, 0.3);
                    padding-bottom: 15px;
                ">
                    <span style="font-size: 28px;">🎯</span>
                    <span>Precision Attack Timer</span>
                </h3>
                
                <!-- CALIBRATION STATUS -->
                <div id="tw-calibration-status" style="
                    padding: 15px;
                    background: rgba(0, 255, 136, 0.1);
                    border: 2px solid #00ff88;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    color: #00ff88;
                    display: none;
                ">
                    🔄 Calibrating server time...
                </div>
                
                <!-- TARGET TIME -->
                <div style="margin-bottom: 20px;">
                    <div style="
                        color: #8ff;
                        margin-bottom: 8px;
                        font-size: 14px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span>🎯 Target Time (enemy arrival):</span>
                        <span style="color: #00ff88; font-size: 12px; font-family: monospace;">HH:MM:SS:mmm</span>
                    </div>
                    <input type="text" 
                           id="tw-target-input" 
                           value="${formatTime(current)}"
                           placeholder="13:44:30:054"
                           style="
                               width: 100%;
                               padding: 14px;
                               background: #222;
                               border: 2px solid #444;
                               color: #fff;
                               border-radius: 6px;
                               font-family: monospace;
                               font-size: 16px;
                           ">
                </div>
                
                <!-- SETTINGS ROW -->
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 20px;
                ">
                    <div>
                        <div style="color: #8ff; margin-bottom: 8px; font-size: 14px;">
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
                                   padding: 12px;
                                   background: #222;
                                   border: 2px solid #444;
                                   color: #fff;
                                   border-radius: 6px;
                               ">
                    </div>
                    
                    <div>
                        <div style="color: #8ff; margin-bottom: 8px; font-size: 14px;">
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
                                   padding: 12px;
                                   background: #222;
                                   border: 2px solid #444;
                                   color: #fff;
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
                        padding: 16px;
                        background: linear-gradient(145deg, #00ff88, #00cc66);
                        border: 2px solid #00aa55;
                        color: #002211;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 16px;
                        transition: all 0.3s;
                    ">
                        🚀 Start Timer
                    </button>
                    
                    <button id="tw-stop-btn" style="
                        padding: 16px;
                        background: linear-gradient(145deg, #ff4444, #cc0000);
                        border: 2px solid #aa0000;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 16px;
                        transition: all 0.3s;
                        display: none;
                    ">
                        ⏹️ Stop
                    </button>
                </div>
                
                <!-- STATUS -->
                <div id="tw-status" style="
                    padding: 18px;
                    background: rgba(0, 255, 136, 0.1);
                    border-radius: 8px;
                    margin-bottom: 25px;
                    border-left: 4px solid #00ff88;
                    color: #00ff88;
                    font-size: 14px;
                    min-height: 24px;
                ">
                    🔄 Calibrating server time...
                </div>
                
                <!-- TIME DISPLAY -->
                <div style="
                    background: rgba(0, 0, 0, 0.7);
                    padding: 20px;
                    border-radius: 8px;
                    border: 2px solid rgba(0, 255, 136, 0.3);
                ">
                    <div id="tw-current-display" style="
                        color: #00ff88;
                        font-family: 'Courier New', monospace;
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 15px;
                    ">
                        ⏰ Server: ${formatTime(current)}
                    </div>
                    
                    <div id="tw-target-display" style="
                        color: #ffaa00;
                        font-family: 'Courier New', monospace;
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 15px;
                        display: none;
                    ">
                        🎯 Target: <span id="tw-target-text">--:--:--:---</span>
                    </div>
                    
                    <div id="tw-remaining-display" style="
                        color: #00ff88;
                        font-family: 'Courier New', monospace;
                        font-size: 18px;
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
        
        // Server time = local time + offset
        const now = new Date();
        return new Date(now.getTime() + state.serverTimeOffset);
    }
    
    // Get latency
    function getLatency() {
        const el = document.querySelector('#serverTime');
        if (!el) return 0;
        const title = el.getAttribute('data-title') || '';
        const match = title.match(/Latency:\s*([\d.]+)ms/i);
        return match ? parseFloat(match[1]) : 0;
    }
    
    // Format time
    function formatTime(date) {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        const s = date.getSeconds().toString().padStart(2, '0');
        const ms = date.getMilliseconds().toString().padStart(3, '0');
        return `${h}:${m}:${s}:${ms}`;
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
        let lastText = serverEl.textContent;
        
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
                
                // Update average offset
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
        
        // Timeout after 10 seconds
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
            document.getElementById('tw-current-display').textContent = `⏰ Server: ${formatTime(serverTime)}`;
            
            // Update target input if empty
            const targetInput = document.getElementById('tw-target-input');
            if (!targetInput.value || targetInput.value === '00:00:00:000') {
                targetInput.value = formatTime(serverTime);
            }
        }, updateInterval);
    }
    
    // Calculate attack time with automatic max cancel adjustment
    function calculateAttackTime(targetTime, maxCancelMinutes) {
        const latency = getLatency();
        
        // Get current server time (WITH latency SUBTRACTION as per your update)
        const serverNow = getServerTimeFromElement();
        if (!serverNow) return null;
        
        // CRITICAL: Subtract latency as you specified
        const current = new Date(serverNow.getTime() - latency);
        
        // Convert max cancel to ms
        const maxCancelMs = maxCancelMinutes * 60 * 1000;
        const twoTimesCancel = maxCancelMs * CONFIG.maxCancelMultiplier;
        
        // Calculate time available
        const timeAvailable = targetTime.getTime() - current.getTime();
        
        // Adjust max cancel if needed (Solution A)
        let adjustedMaxCancelMs = maxCancelMs;
        if (timeAvailable < twoTimesCancel + CONFIG.minSafetyMargin) {
            adjustedMaxCancelMs = Math.floor((timeAvailable - CONFIG.minSafetyMargin) / 2);
        }
        
        // Calculate latest attack time
        const adjustedTwoTimes = adjustedMaxCancelMs * CONFIG.maxCancelMultiplier;
        const latestAttackMs = targetTime.getTime() - adjustedTwoTimes;
        
        // Calculate click time: latest attack with milliseconds adjustment
        // target ms - latency - 50ms (but we already subtracted latency from current)
        const targetMs = targetTime.getMilliseconds();
        const msAdjustment = targetMs - CONFIG.safetyOffset; // latency already subtracted
        
        const clickTime = new Date(latestAttackMs + msAdjustment);
        
        return {
            targetTime: targetTime,
            clickTime: clickTime,
            adjustedMaxCancel: adjustedMaxCancelMs / 60000,
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
            updateStatus('Invalid time format!', 'error');
            return;
        }
        
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const s = parseInt(parts[2], 10) || 0;
        const ms = parts[3] ? parseInt(parts[3], 10) || 0 : 0;
        
        // Get current server time
        const serverNow = getServerTimeFromElement();
        if (!serverNow) {
            updateStatus('Cannot get server time!', 'error');
            return;
        }
        
        // Create target
        const target = new Date(serverNow);
        target.setHours(h, m, s, ms);
        
        // If target is in past, add 1 day
        if (target <= serverNow) {
            target.setDate(target.getDate() + 1);
        }
        
        const maxCancel = parseInt(document.getElementById('tw-cancel-input').value, 10) || 10;
        const updateInterval = parseInt(document.getElementById('tw-update-input').value, 10) || 10;
        
        // Calculate attack time
        const calc = calculateAttackTime(target, maxCancel);
        if (!calc) {
            updateStatus('Calculation failed!', 'error');
            return;
        }
        
        if (calc.remaining < 1000) {
            updateStatus('Target time too close!', 'error');
            return;
        }
        
        if (calc.adjustedMaxCancel.toFixed(1) !== maxCancel.toFixed(1)) {
            updateStatus(`Max cancel adjusted to ${calc.adjustedMaxCancel.toFixed(1)}min`, 'warning');
        }
        
        // Update state
        state.running = true;
        state.targetTime = calc.targetTime;
        state.clickTime = calc.clickTime;
        state.updateInterval = Math.max(1, Math.min(100, updateInterval));
        
        // Update UI
        document.getElementById('tw-start-btn').style.display = 'none';
        document.getElementById('tw-stop-btn').style.display = 'block';
        document.getElementById('tw-target-display').style.display = 'block';
        document.getElementById('tw-remaining-display').style.display = 'block';
        
        document.getElementById('tw-target-text').textContent = formatTime(calc.targetTime);
        
        updateStatus(`✅ Timer started! Clicking in ${Math.round(calc.remaining/1000)}s`, 'success');
        
        // Start precision timer
        startPrecisionTimer();
    }
    
    // Start precision timer with 10ms updates
    function startPrecisionTimer() {
        if (state.timerId) {
            clearInterval(state.timerId);
        }
        
        let lastDisplayUpdate = 0;
        
        state.timerId = setInterval(() => {
            if (!state.running) return;
            
            const now = Date.now();
            
            // Get current server time (with latency subtraction)
            const serverNow = getServerTimeFromElement();
            if (!serverNow) return;
            
            const latency = getLatency();
            const current = new Date(serverNow.getTime() - latency);
            
            // Calculate remaining
            const remaining = state.clickTime.getTime() - current.getTime();
            
            // Update display every ~50ms for performance
            if (now - lastDisplayUpdate >= 50) {
                lastDisplayUpdate = now;
                
                document.getElementById('tw-current-display').textContent = `⏰ Server: ${formatTime(current)}`;
                document.getElementById('tw-remaining-text').textContent = `${remaining}ms`;
                
                // Color coding
                const el = document.getElementById('tw-remaining-text');
                if (remaining > 10000) {
                    el.style.color = '#00ff88';
                } else if (remaining > 2000) {
                    el.style.color = '#ffaa00';
                } else if (remaining > 500) {
                    el.style.color = '#ff8800';
                } else {
                    el.style.color = '#ff4444';
                    el.style.fontWeight = 'bold';
                }
            }
            
            // Check execution
            if (remaining <= CONFIG.safetyOffset) {
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
            updateStatus('No attack button!', 'error');
            return;
        }
        
        // Log timing
        const serverNow = getServerTimeFromElement();
        if (serverNow) {
            const latency = getLatency();
            const current = new Date(serverNow.getTime() - latency);
            console.log('Executing at:', formatTime(current));
            console.log('Target was:', formatTime(state.targetTime));
        }
        
        updateStatus('✅ Executing attack...', 'success');
        
        // Click with minimal delay
        setTimeout(() => {
            attackBtn.click();
        }, Math.max(0, CONFIG.safetyOffset - 10));
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
        document.getElementById('tw-remaining-display').style.display = 'none';
        
        updateStatus('Timer stopped', 'info');
    }
    
    // Update status
    function updateStatus(msg, type = 'info') {
        const el = document.getElementById('tw-status');
        if (!el) return;
        
        el.textContent = msg;
        
        switch (type) {
            case 'error':
                el.style.borderLeftColor = '#ff4444';
                el.style.color = '#ff4444';
                el.style.background = 'rgba(255, 68, 68, 0.1)';
                break;
            case 'warning':
                el.style.borderLeftColor = '#ffaa00';
                el.style.color = '#ffaa00';
                el.style.background = 'rgba(255, 170, 0, 0.1)';
                break;
            case 'success':
                el.style.borderLeftColor = '#00ff88';
                el.style.color = '#00ff88';
                el.style.background = 'rgba(0, 255, 136, 0.1)';
                break;
            default:
                el.style.borderLeftColor = '#00ff88';
                el.style.color = '#00ff88';
                el.style.background = 'rgba(0, 255, 136, 0.1)';
        }
    }
    
    // Initialize
    console.log('Precision Attack Timer loaded.');
    init();
    
})();
