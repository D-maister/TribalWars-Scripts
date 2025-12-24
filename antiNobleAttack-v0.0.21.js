// ==UserScript==
// @name         Tribal Wars Precision Attack Timer
// @namespace    http://tampermonkey.net/
// @version      10.0
// @description  Precision attack timer with automatic max cancel adjustment
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=== PRECISION ATTACK TIMER v10.0 ===');
    
    const CONFIG = {
        defaultUpdateInterval: 50,           // 50ms update by default
        defaultMaxCancelMinutes: 10,         // 10 minutes by default
        safetyOffset: 50,                    // 50ms safety margin
        minSafetyMargin: 5000,               // 5 seconds minimum safety
        maxCancelMultiplier: 2               // Multiply by 2 for latest attack
    };
    
    let state = {
        running: false,
        targetTime: null,           // When enemy attack arrives
        startTime: null,            // When we click (adjusted for ms)
        timerId: null,
        updateInterval: CONFIG.defaultUpdateInterval,
        maxCancelTime: CONFIG.defaultMaxCancelMinutes * 60 * 1000,
        originalMaxCancel: null,    // Store original user input
        adjustedMaxCancel: null,    // Store adjusted value
        latency: 0,
        lastDisplayUpdate: 0
    };
    
    function init() {
        setTimeout(() => {
            const attackBtn = document.querySelector('#troop_confirm_submit');
            if (!attackBtn) {
                setTimeout(init, 1000);
                return;
            }
            
            if (document.getElementById('tw-precision-final')) return;
            
            addPrecisionUI(attackBtn);
        }, 1000);
    }
    
    function addPrecisionUI(attackBtn) {
        const serverTime = getServerTime();
        const latency = getLatency();
        const current = new Date(serverTime.getTime() + latency);
        
        const div = document.createElement('div');
        div.id = 'tw-precision-final';
        div.innerHTML = `
            <div style="
                background: linear-gradient(145deg, #0a0a0a, #1a1a1a);
                border: 3px solid #00d4ff;
                border-radius: 12px;
                padding: 25px;
                margin: 25px 0;
                color: white;
                box-shadow: 0 6px 30px rgba(0, 212, 255, 0.25);
            ">
                <h3 style="
                    margin: 0 0 20px 0;
                    color: #00d4ff;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 20px;
                    border-bottom: 2px solid rgba(0, 212, 255, 0.3);
                    padding-bottom: 15px;
                ">
                    <span style="font-size: 28px;">🎯</span>
                    <span>Precision Attack Timer v10.0</span>
                </h3>
                
                <!-- TARGET TIME -->
                <div style="margin-bottom: 20px;">
                    <div style="
                        color: #8af;
                        margin-bottom: 8px;
                        font-size: 14px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span>🎯 Target Time (enemy arrival):</span>
                        <span style="color: #00d4ff; font-size: 12px; font-family: monospace;">HH:MM:SS:mmm</span>
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
                               transition: border 0.3s;
                           "
                           onfocus="this.style.borderColor='#00d4ff'"
                           onblur="this.style.borderColor='#444'">
                </div>
                
                <!-- UPDATE INTERVAL -->
                <div style="margin-bottom: 20px;">
                    <div style="color: #8af; margin-bottom: 8px; font-size: 14px;">
                        🔄 Update Interval (ms):
                    </div>
                    <input type="number" 
                           id="tw-update-interval" 
                           value="50"
                           min="10" 
                           max="1000"
                           step="10"
                           style="
                               width: 100%;
                               padding: 14px;
                               background: #222;
                               border: 2px solid #444;
                               color: #fff;
                               border-radius: 6px;
                               font-size: 16px;
                           ">
                </div>
                
                <!-- MAX CANCEL TIME -->
                <div style="margin-bottom: 25px;">
                    <div style="color: #8af; margin-bottom: 8px; font-size: 14px;">
                        ⏰ Max Cancel Time (minutes):
                    </div>
                    <input type="number" 
                           id="tw-max-cancel" 
                           value="10"
                           min="1" 
                           max="60"
                           step="1"
                           style="
                               width: 100%;
                               padding: 14px;
                               background: #222;
                               border: 2px solid #444;
                               color: #fff;
                               border-radius: 6px;
                               font-size: 16px;
                           ">
                </div>
                
                <!-- BUTTONS -->
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 25px;
                ">
                    <button id="tw-start-timer" style="
                        padding: 16px;
                        background: linear-gradient(145deg, #00d4ff, #0099cc);
                        border: 2px solid #0088bb;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 16px;
                        transition: all 0.3s;
                        box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
                    ">
                        🚀 Start Precision Timer
                    </button>
                    
                    <button id="tw-stop-timer" style="
                        padding: 16px;
                        background: linear-gradient(145deg, #ff6b6b, #ff4757);
                        border: 2px solid #ff3838;
                        color: white;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 16px;
                        transition: all 0.3s;
                        display: none;
                        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                    ">
                        ⏹️ Stop Timer
                    </button>
                </div>
                
                <!-- STATUS -->
                <div id="tw-status" style="
                    padding: 18px;
                    background: rgba(0, 212, 255, 0.1);
                    border-radius: 8px;
                    margin-bottom: 25px;
                    border-left: 4px solid #00d4ff;
                    color: #00d4ff;
                    font-size: 14px;
                    min-height: 24px;
                    transition: all 0.3s;
                ">
                    ✅ Ready - Set target time and click "Start Precision Timer"
                </div>
                
                <!-- CALCULATION INFO -->
                <div id="tw-calculation-info" style="
                    background: rgba(0, 0, 0, 0.5);
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid rgba(0, 212, 255, 0.2);
                    margin-bottom: 25px;
                    display: none;
                ">
                    <div style="
                        color: #00d4ff;
                        font-size: 15px;
                        margin-bottom: 15px;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    ">
                        <span>📊 Calculation Details</span>
                    </div>
                    <div style="color: #8af; font-size: 13px; line-height: 1.6;">
                        <div>🎯 Target: <span id="tw-info-target" style="color: #fff; font-family: monospace;">--:--:--:---</span></div>
                        <div>⏰ Max Cancel: <span id="tw-info-maxcancel" style="color: #fff; font-family: monospace;">-- min</span></div>
                        <div>📡 Latency: <span id="tw-info-latency" style="color: #fff; font-family: monospace;">-- ms</span></div>
                        <div>🚀 Click at: <span id="tw-info-click" style="color: #0f0; font-family: monospace;">--:--:--:---</span></div>
                        <div>⏱️ Remaining: <span id="tw-info-remaining" style="color: #ff8a00; font-family: monospace;">-- ms</span></div>
                    </div>
                </div>
                
                <!-- TIME DISPLAY -->
                <div style="
                    background: rgba(0, 0, 0, 0.7);
                    padding: 20px;
                    border-radius: 8px;
                    border: 2px solid rgba(0, 212, 255, 0.3);
                ">
                    <div id="tw-current-display" style="
                        color: #00d4ff;
                        font-family: 'Courier New', monospace;
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 15px;
                        padding: 10px;
                        background: rgba(0, 212, 255, 0.1);
                        border-radius: 6px;
                    ">
                        ⏰ Current: ${formatTime(current)}
                    </div>
                    
                    <div id="tw-target-display" style="
                        color: #ff8a00;
                        font-family: 'Courier New', monospace;
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 15px;
                        padding: 10px;
                        background: rgba(255, 138, 0, 0.1);
                        border-radius: 6px;
                        display: none;
                    ">
                        🎯 Target: <span id="tw-target-text">--:--:--:---</span>
                    </div>
                    
                    <div id="tw-remaining-display" style="
                        color: #4cae4c;
                        font-family: 'Courier New', monospace;
                        font-size: 18px;
                        font-weight: bold;
                        padding: 10px;
                        background: rgba(76, 174, 76, 0.1);
                        border-radius: 6px;
                        display: none;
                    ">
                        ⏳ Remaining: <span id="tw-remaining-text">0ms</span>
                    </div>
                </div>
            </div>
        `;
        
        attackBtn.parentNode.insertBefore(div, attackBtn.nextSibling);
        
        // Add event listeners
        document.getElementById('tw-start-timer').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            startPrecisionTimer();
            return false;
        });
        
        document.getElementById('tw-stop-timer').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            stopTimer();
            return false;
        });
        
        // Update current time display
        setInterval(updateCurrentDisplay, 1000);
        
        console.log('Precision Timer UI added');
    }
    
    function getServerTime() {
        const el = document.querySelector('#serverTime');
        if (!el) return new Date();
        
        const text = el.textContent || '00:00:00';
        const [h, m, s] = text.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m, s, 0);
        return date;
    }
    
    function getLatency() {
        const el = document.querySelector('#serverTime');
        if (!el) return 0;
        const title = el.getAttribute('data-title') || '';
        const match = title.match(/Latency:\s*([\d.]+)ms/i);
        return match ? parseFloat(match[1]) : 0;
    }
    
    function formatTime(date) {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        const s = date.getSeconds().toString().padStart(2, '0');
        const ms = date.getMilliseconds().toString().padStart(3, '0');
        return `${h}:${m}:${s}:${ms}`;
    }
    
    function updateCurrentDisplay() {
        if (state.running) return; // Don't update if timer running
        
        const serverTime = getServerTime();
        const latency = getLatency();
        const current = new Date(serverTime.getTime() + latency);
        document.getElementById('tw-current-display').textContent = `⏰ Current: ${formatTime(current)}`;
    }
    
    function calculateAttackTime(targetTime, maxCancelMinutes, latency) {
        console.log('=== CALCULATION START ===');
        
        // Get current time
        const serverNow = getServerTime();
        const current = new Date(serverNow.getTime() + latency);
        
        console.log('Current:', current.toLocaleTimeString(), current.getMilliseconds());
        console.log('Target:', targetTime.toLocaleTimeString(), targetTime.getMilliseconds());
        
        // Convert max cancel to milliseconds
        const maxCancelMs = maxCancelMinutes * 60 * 1000;
        const twoTimesCancel = maxCancelMs * CONFIG.maxCancelMultiplier;
        const safetyMargin = CONFIG.minSafetyMargin;
        
        console.log('Max Cancel:', maxCancelMinutes, 'min =', maxCancelMs, 'ms');
        console.log('2 × Max Cancel:', twoTimesCancel, 'ms');
        
        // Calculate time available
        const timeAvailable = targetTime.getTime() - current.getTime();
        console.log('Time available:', timeAvailable, 'ms');
        
        // Check if we need to adjust max cancel
        let adjustedMaxCancelMs = maxCancelMs;
        let adjustmentNeeded = false;
        
        if (timeAvailable < twoTimesCancel + safetyMargin) {
            adjustmentNeeded = true;
            // Adjust max cancel: (available time - safety margin) ÷ 2
            adjustedMaxCancelMs = Math.floor((timeAvailable - safetyMargin) / 2);
            console.log('Adjusting max cancel to:', adjustedMaxCancelMs, 'ms');
        }
        
        // Calculate latest possible attack time
        const adjustedTwoTimes = adjustedMaxCancelMs * CONFIG.maxCancelMultiplier;
        const latestAttackMs = targetTime.getTime() - adjustedTwoTimes;
        const latestAttack = new Date(latestAttackMs);
        
        console.log('Latest attack (before ms adjust):', latestAttack.toLocaleTimeString(), latestAttack.getMilliseconds());
        
        // Apply millisecond adjustment: target ms - latency - 50ms
        const targetMs = targetTime.getMilliseconds();
        const msAdjustment = targetMs - latency - CONFIG.safetyOffset;
        
        console.log('MS adjustment:', targetMs, '-', latency, '-', CONFIG.safetyOffset, '=', msAdjustment);
        
        // Create final click time with adjusted milliseconds
        const clickTime = new Date(latestAttackMs);
        clickTime.setMilliseconds(latestAttack.getMilliseconds() + msAdjustment);
        
        // Handle millisecond rollover/underflow
        if (clickTime.getTime() !== latestAttackMs + msAdjustment) {
            console.log('MS rollover detected, adjusting...');
            clickTime.setTime(latestAttackMs + msAdjustment);
        }
        
        console.log('Final click time:', clickTime.toLocaleTimeString(), clickTime.getMilliseconds());
        
        const remaining = clickTime.getTime() - current.getTime();
        console.log('Remaining until click:', remaining, 'ms');
        
        return {
            targetTime: targetTime,
            clickTime: clickTime,
            originalMaxCancel: maxCancelMinutes,
            adjustedMaxCancel: adjustedMaxCancelMs / 60000, // Convert back to minutes
            adjustmentNeeded: adjustmentNeeded,
            latency: latency,
            remaining: remaining,
            latestAttackWithoutMs: latestAttack
        };
    }
    
    function startPrecisionTimer() {
        console.log('=== START PRECISION TIMER ===');
        
        if (state.running) {
            updateStatus('⚠️ Timer already running!', 'warning');
            return;
        }
        
        // Get inputs
        const targetInput = document.getElementById('tw-target-input').value;
        const maxCancelInput = parseInt(document.getElementById('tw-max-cancel').value, 10) || 10;
        const updateIntervalInput = parseInt(document.getElementById('tw-update-interval').value, 10) || 50;
        
        // Parse target time
        const parts = targetInput.split(':');
        if (parts.length < 3) {
            updateStatus('❌ Invalid target time format! Use HH:MM:SS:mmm', 'error');
            return;
        }
        
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const s = parseInt(parts[2], 10) || 0;
        const ms = parts[3] ? parseInt(parts[3], 10) || 0 : 0;
        
        // Get current time
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        
        // Create target date
        const target = new Date(current);
        target.setHours(h, m, s, ms);
        
        // If target is in past, add 1 day
        if (target <= current) {
            target.setDate(target.getDate() + 1);
        }
        
        // Calculate attack time
        const calculation = calculateAttackTime(target, maxCancelInput, latency);
        
        console.log('Calculation result:', calculation);
        
        // Check if time is feasible
        if (calculation.remaining < 1000) {
            updateStatus('❌ Error: Not enough time! Increase target time or reduce max cancel.', 'error');
            return;
        }
        
        if (calculation.adjustmentNeeded) {
            updateStatus(`⚠️ Max cancel adjusted from ${calculation.originalMaxCancel}min to ${calculation.adjustedMaxCancel.toFixed(1)}min`, 'warning');
        }
        
        // Update state
        state.running = true;
        state.targetTime = calculation.targetTime;
        state.startTime = calculation.clickTime;
        state.originalMaxCancel = calculation.originalMaxCancel;
        state.adjustedMaxCancel = calculation.adjustedMaxCancel;
        state.latency = latency;
        state.updateInterval = Math.max(10, Math.min(1000, updateIntervalInput));
        
        // Update UI
        document.getElementById('tw-start-timer').style.display = 'none';
        document.getElementById('tw-stop-timer').style.display = 'block';
        document.getElementById('tw-target-display').style.display = 'block';
        document.getElementById('tw-remaining-display').style.display = 'block';
        document.getElementById('tw-calculation-info').style.display = 'block';
        
        document.getElementById('tw-target-text').textContent = formatTime(calculation.targetTime);
        document.getElementById('tw-info-target').textContent = formatTime(calculation.targetTime);
        document.getElementById('tw-info-maxcancel').textContent = `${calculation.adjustedMaxCancel.toFixed(1)} min${calculation.adjustmentNeeded ? ' (adjusted)' : ''}`;
        document.getElementById('tw-info-latency').textContent = `${latency.toFixed(1)} ms`;
        document.getElementById('tw-info-click').textContent = formatTime(calculation.clickTime);
        
        updateStatus(`✅ Timer started! Clicking in ${Math.round(calculation.remaining/1000)} seconds`, 'success');
        
        // Start the precision timer
        startPrecisionCountdown();
    }
    
    function startPrecisionCountdown() {
        console.log('Starting precision countdown with interval:', state.updateInterval, 'ms');
        
        // Clear any existing timer
        if (state.timerId) {
            clearInterval(state.timerId);
        }
        
        let lastDisplayUpdate = 0;
        
        state.timerId = setInterval(() => {
            if (!state.running) return;
            
            const now = Date.now();
            
            // Get current server time
            const serverNow = getServerTime();
            const current = new Date(serverNow.getTime() + state.latency);
            
            // Calculate remaining time
            const remaining = state.startTime.getTime() - current.getTime();
            
            // Update display at configured interval
            if (now - lastDisplayUpdate >= 100) { // Update display every 100ms max
                lastDisplayUpdate = now;
                
                // Update current display
                document.getElementById('tw-current-display').textContent = `⏰ Current: ${formatTime(current)}`;
                
                // Update remaining display
                const remainingText = `${remaining}ms (${Math.round(remaining/1000)}s)`;
                document.getElementById('tw-remaining-text').textContent = remainingText;
                document.getElementById('tw-info-remaining').textContent = remainingText;
                
                // Color coding
                const el = document.getElementById('tw-remaining-text');
                if (remaining > 10000) {
                    el.style.color = '#4cae4c';
                } else if (remaining > 2000) {
                    el.style.color = '#ff8a00';
                } else if (remaining > 500) {
                    el.style.color = '#ff4444';
                } else {
                    el.style.color = '#ff0000';
                    el.style.fontWeight = 'bold';
                }
            }
            
            // Check if time to execute
            if (remaining <= CONFIG.safetyOffset) {
                console.log('🎯 EXECUTION TIME! Remaining:', remaining, 'ms');
                executeAttack();
            }
        }, state.updateInterval);
    }
    
    function executeAttack() {
        console.log('=== EXECUTING ATTACK ===');
        
        // Stop timer first
        stopTimer();
        
        // Find attack button
        const attackBtn = document.querySelector('#troop_confirm_submit');
        if (!attackBtn) {
            console.error('No attack button found');
            updateStatus('❌ Error: Attack button not found!', 'error');
            return;
        }
        
        updateStatus('✅ Executing attack at precise time...', 'success');
        
        // Small delay to show status, then click
        setTimeout(() => {
            console.log('Clicking attack button at precise time');
            attackBtn.click();
        }, 100);
    }
    
    function stopTimer() {
        console.log('=== STOPPING TIMER ===');
        
        state.running = false;
        state.targetTime = null;
        state.startTime = null;
        
        if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
        
        // Reset UI
        document.getElementById('tw-start-timer').style.display = 'block';
        document.getElementById('tw-stop-timer').style.display = 'none';
        document.getElementById('tw-target-display').style.display = 'none';
        document.getElementById('tw-remaining-display').style.display = 'none';
        document.getElementById('tw-calculation-info').style.display = 'none';
        
        updateStatus('⏹️ Timer stopped', 'info');
    }
    
    function updateStatus(message, type = 'info') {
        const el = document.getElementById('tw-status');
        if (!el) return;
        
        el.textContent = message;
        
        // Reset styles
        el.style.borderLeftColor = '#00d4ff';
        el.style.color = '#00d4ff';
        el.style.background = 'rgba(0, 212, 255, 0.1)';
        
        // Apply type styles
        switch (type) {
            case 'error':
                el.style.borderLeftColor = '#ff6b6b';
                el.style.color = '#ff6b6b';
                el.style.background = 'rgba(255, 107, 107, 0.1)';
                break;
            case 'warning':
                el.style.borderLeftColor = '#ff8a00';
                el.style.color = '#ff8a00';
                el.style.background = 'rgba(255, 138, 0, 0.1)';
                break;
            case 'success':
                el.style.borderLeftColor = '#4cae4c';
                el.style.color = '#4cae4c';
                el.style.background = 'rgba(76, 174, 76, 0.1)';
                break;
        }
        
        console.log('Status:', message);
    }
    
    // Manual test function
    window.testPrecisionTimer = function(targetHours = 13, targetMinutes = 44, targetSeconds = 30, targetMs = 54) {
        const serverTime = getServerTime();
        const latency = getLatency();
        const current = new Date(serverTime.getTime() + latency);
        
        // Set target to specified time today
        const target = new Date(current);
        target.setHours(targetHours, targetMinutes, targetSeconds, targetMs);
        
        // If target is in past, add 1 day
        if (target <= current) {
            target.setDate(target.getDate() + 1);
        }
        
        document.getElementById('tw-target-input').value = formatTime(target);
        startPrecisionTimer();
    };
    
    console.log('Precision Attack Timer v10.0 ready.');
    console.log('Use testPrecisionTimer(13, 44, 30, 54) to test with target 13:44:30:054');
    
    init();
    
})();
