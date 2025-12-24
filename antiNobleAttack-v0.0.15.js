// ==UserScript==
// @name         Tribal Wars Attack Timer - FINAL FIXED
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Fixed attack timer that actually waits for the target time
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('TW Attack Timer: Loading fixed version...');
    
    // Configuration
    const CONFIG = {
        updateInterval: 50,
        maxCancelMinutes: 10,
        executeOffset: 10 // Execute 10ms before target
    };
    
    // State with safety flags
    let state = {
        running: false,
        targetTime: null,
        intervalId: null,
        attackType: 'attack',
        firstTickDone: false,
        safetyCheckPassed: false
    };
    
    // Main initialization
    function init() {
        console.log('TW Attack Timer: Initializing...');
        
        // Wait a bit for page to load
        setTimeout(() => {
            const attackButton = findAttackButton();
            
            if (!attackButton) {
                console.log('No attack button found, retrying...');
                setTimeout(init, 1000);
                return;
            }
            
            // Don't add twice
            if (document.getElementById('tw-final-timer')) {
                console.log('Timer already added');
                return;
            }
            
            addTimerUI(attackButton);
        }, 1500);
    }
    
    // Find attack button
    function findAttackButton() {
        const selectors = [
            '#troop_confirm_submit',
            'input.btn-attack',
            'input[value="Атаковать"]',
            'input[name="submit_confirm"]',
            'input.troop_confirm_go'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) return element;
        }
        return null;
    }
    
    // Get current server time
    function getServerTime() {
        const serverEl = document.querySelector('#serverTime');
        if (!serverEl) {
            console.warn('No server time element');
            return new Date();
        }
        
        const timeText = serverEl.textContent || '00:00:00';
        const parts = timeText.split(':').map(Number);
        
        const date = new Date();
        date.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
        return date;
    }
    
    // Get latency
    function getLatency() {
        const serverEl = document.querySelector('#serverTime');
        if (!serverEl) return 0;
        
        const title = serverEl.getAttribute('data-title') || '';
        const match = title.match(/Latency:\s*([\d.]+)ms/i);
        return match ? parseFloat(match[1]) : 0;
    }
    
    // Parse time input
    function parseTimeInput(timeStr) {
        const parts = timeStr.split(':');
        if (parts.length < 3) return null;
        
        return {
            hours: parseInt(parts[0], 10) || 0,
            minutes: parseInt(parts[1], 10) || 0,
            seconds: parseInt(parts[2], 10) || 0,
            milliseconds: parts[3] ? parseInt(parts[3], 10) || 0 : 0
        };
    }
    
    // Format time for display
    function formatTime(date, withMs = true) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        
        if (!withMs) return `${hours}:${minutes}:${seconds}`;
        
        const ms = date.getMilliseconds().toString().padStart(3, '0');
        return `${hours}:${minutes}:${seconds}:${ms}`;
    }
    
    // Add timer UI
    function addTimerUI(attackButton) {
        console.log('Adding timer UI...');
        
        const serverTime = getServerTime();
        const latency = getLatency();
        const currentTime = new Date(serverTime.getTime() + latency);
        
        const container = document.createElement('div');
        container.id = 'tw-final-timer';
        container.innerHTML = `
            <div style="
                background: #1a1a1a;
                border: 2px solid #333;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                color: #fff;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            ">
                <h3 style="
                    margin: 0 0 15px 0;
                    color: #ff8a00;
                    border-bottom: 2px solid #333;
                    padding-bottom: 10px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <span style="font-size: 20px;">⏱️</span>
                    <span>Attack Timer v2.0</span>
                </h3>
                
                <div style="margin-bottom: 15px;">
                    <div style="
                        font-size: 12px;
                        color: #aaa;
                        margin-bottom: 8px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span>Target Time (HH:MM:SS:mmm):</span>
                        <label style="font-size: 11px;">
                            <input type="checkbox" id="tw-show-ms" checked>
                            Show milliseconds
                        </label>
                    </div>
                    <input type="text" 
                           id="tw-time-input" 
                           value="${formatTime(currentTime)}"
                           placeholder="19:30:00:000"
                           style="
                               width: 100%;
                               padding: 10px;
                               background: #2a2a2a;
                               border: 1px solid #444;
                               color: #fff;
                               border-radius: 4px;
                               font-family: monospace;
                               font-size: 14px;
                           ">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <div style="font-size: 12px; color: #aaa; margin-bottom: 8px;">
                        Update Interval (ms):
                    </div>
                    <input type="number" 
                           id="tw-interval" 
                           value="50" 
                           min="10" 
                           max="1000"
                           style="
                               width: 100%;
                               padding: 10px;
                               background: #2a2a2a;
                               border: 1px solid #444;
                               color: #fff;
                               border-radius: 4px;
                           ">
                </div>
                
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-bottom: 20px;
                ">
                    <button id="tw-start-attack" style="
                        padding: 12px;
                        background: linear-gradient(to bottom, #d9534f, #c12e2a);
                        border: 1px solid #a02824;
                        color: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 14px;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='linear-gradient(to bottom, #e96565, #d9534f)';"
                      onmouseout="this.style.background='linear-gradient(to bottom, #d9534f, #c12e2a)';">
                        🚀 Anti Noble Attack
                    </button>
                    
                    <button id="tw-auto-cancel" style="
                        padding: 12px;
                        background: linear-gradient(to bottom, #5bc0de, #31b0d5);
                        border: 1px solid #269abc;
                        color: white;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 14px;
                        transition: all 0.2s;
                    " onmouseover="this.style.background='linear-gradient(to bottom, #7bd4ec, #5bc0de)';"
                      onmouseout="this.style.background='linear-gradient(to bottom, #5bc0de, #31b0d5)';">
                        ⏰ Auto Cancel (10m)
                    </button>
                </div>
                
                <button id="tw-stop-timer" style="
                    width: 100%;
                    padding: 12px;
                    background: linear-gradient(to bottom, #f0ad4e, #ec971f);
                    border: 1px solid #d58512;
                    color: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 14px;
                    display: none;
                    margin-bottom: 20px;
                    transition: all 0.2s;
                " onmouseover="this.style.background='linear-gradient(to bottom, #f7c477, #f0ad4e)';"
                  onmouseout="this.style.background='linear-gradient(to bottom, #f0ad4e, #ec971f)';">
                    ⏹️ Stop Timer
                </button>
                
                <div id="tw-status" style="
                    padding: 15px;
                    background: #2a2a2a;
                    border-radius: 6px;
                    font-size: 13px;
                    margin-bottom: 20px;
                    border-left: 4px solid #5bc0de;
                    min-height: 20px;
                ">
                    ✅ Ready - Set target time and click "Anti Noble Attack"
                </div>
                
                <div style="
                    background: #222;
                    padding: 15px;
                    border-radius: 6px;
                    border: 1px solid #333;
                ">
                    <div id="tw-current-time" style="
                        font-family: 'Courier New', monospace;
                        color: #5bc0de;
                        margin-bottom: 10px;
                        font-size: 15px;
                        font-weight: bold;
                    ">
                        ⏰ Current: ${formatTime(currentTime)}
                    </div>
                    
                    <div id="tw-target-time-display" style="
                        font-family: 'Courier New', monospace;
                        color: #ff8a00;
                        margin-bottom: 10px;
                        font-size: 15px;
                        font-weight: bold;
                        display: none;
                    ">
                        🎯 Target: <span id="tw-target-text"></span>
                    </div>
                    
                    <div id="tw-remaining-time-display" style="
                        font-family: 'Courier New', monospace;
                        color: #4cae4c;
                        font-size: 15px;
                        font-weight: bold;
                        display: none;
                    ">
                        ⏳ Remaining: <span id="tw-remaining-text">0ms</span>
                    </div>
                </div>
            </div>
        `;
        
        // Insert after attack button
        attackButton.parentNode.insertBefore(container, attackButton.nextSibling);
        
        // Add event listeners
        document.getElementById('tw-start-attack').addEventListener('click', startAttack);
        document.getElementById('tw-auto-cancel').addEventListener('click', startAutoCancel);
        document.getElementById('tw-stop-timer').addEventListener('click', stopTimer);
        document.getElementById('tw-show-ms').addEventListener('change', toggleMilliseconds);
        
        console.log('Timer UI added successfully');
    }
    
    // Start attack timer
    function startAttack() {
        console.log('=== START ATTACK TIMER ===');
        
        if (state.running) {
            updateStatus('⚠️ Timer already running!', 'warning');
            return;
        }
        
        const timeInput = document.getElementById('tw-time-input');
        const timeStr = timeInput.value.trim();
        
        if (!timeStr) {
            updateStatus('❌ Please enter a target time!', 'error');
            return;
        }
        
        // Parse time
        const timeObj = parseTimeInput(timeStr);
        if (!timeObj) {
            updateStatus('❌ Invalid format! Use HH:MM:SS:mmm', 'error');
            return;
        }
        
        console.log('Time input:', timeStr);
        console.log('Parsed:', timeObj);
        
        // Get current server time with latency
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        
        console.log('Server now:', serverNow.toLocaleTimeString());
        console.log('Latency:', latency, 'ms');
        console.log('Current (with latency):', current.toLocaleTimeString());
        
        // Create target date
        const target = new Date(current);
        target.setHours(
            timeObj.hours,
            timeObj.minutes,
            timeObj.seconds,
            timeObj.milliseconds
        );
        
        console.log('Target (same date):', target.toLocaleTimeString());
        
        // If target is in the past, schedule for tomorrow
        if (target <= current) {
            console.log('Target is in past, adding 1 day');
            target.setDate(target.getDate() + 1);
            console.log('New target:', target.toLocaleTimeString());
        }
        
        // Calculate remaining time
        const remaining = target.getTime() - current.getTime();
        
        console.log('Remaining ms:', remaining);
        console.log('Remaining seconds:', remaining / 1000);
        console.log('Remaining hours:', remaining / (1000 * 60 * 60));
        
        // SAFETY CHECKS
        if (remaining <= 100) { // Less than 0.1 second
            console.error('SAFETY CHECK FAILED: Time difference too small');
            updateStatus('❌ Error: Target time is too close or in the past!', 'error');
            return;
        }
        
        if (remaining > 24 * 60 * 60 * 1000) { // More than 24 hours
            console.error('SAFETY CHECK FAILED: Time difference too large');
            updateStatus('❌ Error: Target time is more than 24 hours away!', 'error');
            return;
        }
        
        // Update state
        state.running = true;
        state.targetTime = target;
        state.attackType = 'attack';
        state.firstTickDone = false;
        state.safetyCheckPassed = true;
        
        // Update UI
        document.getElementById('tw-start-attack').style.display = 'none';
        document.getElementById('tw-auto-cancel').style.display = 'none';
        document.getElementById('tw-stop-timer').style.display = 'block';
        document.getElementById('tw-target-time-display').style.display = 'block';
        document.getElementById('tw-remaining-time-display').style.display = 'block';
        
        document.getElementById('tw-target-text').textContent = formatTime(target);
        document.getElementById('tw-remaining-text').textContent = `${remaining}ms`;
        document.getElementById('tw-remaining-text').style.color = '#4cae4c';
        
        // Get update interval
        const intervalInput = document.getElementById('tw-interval');
        const interval = parseInt(intervalInput.value, 10) || CONFIG.updateInterval;
        
        // Start timer - CRITICAL: DO NOT execute first tick immediately!
        startTimerLoop(interval);
        
        updateStatus(`✅ Timer started! Will attack at ${formatTime(target)}`, 'success');
        console.log('Timer started successfully. Will wait', Math.round(remaining/1000), 'seconds');
    }
    
    // Start auto-cancel timer
    function startAutoCancel() {
        console.log('=== START AUTO CANCEL ===');
        
        if (state.running) {
            updateStatus('⚠️ Timer already running!', 'warning');
            return;
        }
        
        // Calculate target time (10 minutes from now)
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        const target = new Date(current.getTime() + (CONFIG.maxCancelMinutes * 60 * 1000));
        
        // Update time input
        const showMs = document.getElementById('tw-show-ms').checked;
        document.getElementById('tw-time-input').value = formatTime(target, showMs);
        
        // Start as attack timer
        startAttack();
        state.attackType = 'cancel';
        
        updateStatus(`⏰ Auto-cancel set for ${CONFIG.maxCancelMinutes} minutes`, 'info');
    }
    
    // Start timer loop
    function startTimerLoop(interval) {
        console.log('Starting timer loop with interval:', interval, 'ms');
        
        // Clear any existing interval
        if (state.intervalId) {
            clearInterval(state.intervalId);
            state.intervalId = null;
        }
        
        // Set new interval - IMPORTANT: Don't execute first tick immediately!
        state.intervalId = setInterval(() => {
            timerTick();
        }, interval);
        
        console.log('Timer interval set. First tick in', interval, 'ms');
    }
    
    // Timer tick function
    function timerTick() {
        if (!state.running || !state.targetTime) {
            console.log('Timer tick called but not running');
            return;
        }
        
        // Skip first tick for safety
        if (!state.firstTickDone) {
            console.log('First timer tick - safety check');
            state.firstTickDone = true;
            
            // Just update display, don't check execution
            updateDisplay();
            return;
        }
        
        console.log('=== TIMER TICK ===');
        
        // Get current time
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        
        // Calculate remaining
        const remaining = state.targetTime.getTime() - current.getTime();
        
        console.log('Current:', current.toLocaleTimeString());
        console.log('Target:', state.targetTime.toLocaleTimeString());
        console.log('Remaining:', remaining, 'ms');
        
        // Update display
        updateDisplay();
        
        // Check if time to execute
        if (remaining <= CONFIG.executeOffset && remaining > -1000) {
            console.log('🎯 TIME TO EXECUTE! Remaining:', remaining, 'ms');
            executeAttack();
        } else if (remaining <= -1000) {
            console.warn('Timer missed execution window by', Math.abs(remaining), 'ms');
            updateStatus('⚠️ Missed execution window!', 'warning');
            stopTimer();
        }
    }
    
    // Update display
    function updateDisplay() {
        if (!state.running || !state.targetTime) return;
        
        // Get current time
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        
        // Calculate remaining
        const remaining = state.targetTime.getTime() - current.getTime();
        
        // Update current time display
        const showMs = document.getElementById('tw-show-ms').checked;
        document.getElementById('tw-current-time').textContent = 
            `⏰ Current: ${formatTime(current, showMs)}`;
        
        // Update remaining display
        const remainingEl = document.getElementById('tw-remaining-text');
        if (remaining > 0) {
            remainingEl.textContent = `${remaining}ms`;
            
            // Color code
            if (remaining > 5000) {
                remainingEl.style.color = '#4cae4c'; // Green
            } else if (remaining > 1000) {
                remainingEl.style.color = '#ff8a00'; // Orange
            } else {
                remainingEl.style.color = '#d9534f'; // Red
            }
        } else {
            remainingEl.textContent = 'NOW!';
            remainingEl.style.color = '#d9534f';
        }
    }
    
    // Execute attack
    function executeAttack() {
        console.log('=== EXECUTING ATTACK ===');
        
        // Stop timer first
        stopTimer();
        
        // Find and click attack button
        const attackButton = findAttackButton();
        if (!attackButton) {
            console.error('Attack button not found!');
            updateStatus('❌ Error: Attack button not found!', 'error');
            return;
        }
        
        console.log('Clicking attack button...');
        
        if (state.attackType === 'attack') {
            updateStatus('✅ Attack executed! Page will reload...', 'success');
        } else {
            updateStatus('✅ Auto-cancel triggered! Page will reload...', 'success');
        }
        
        // Small delay to show message, then click
        setTimeout(() => {
            attackButton.click();
        }, 500);
    }
    
    // Stop timer
    function stopTimer() {
        console.log('=== STOPPING TIMER ===');
        
        // Clear interval
        if (state.intervalId) {
            clearInterval(state.intervalId);
            state.intervalId = null;
        }
        
        // Reset state
        state.running = false;
        state.targetTime = null;
        state.firstTickDone = false;
        state.safetyCheckPassed = false;
        
        // Reset UI
        document.getElementById('tw-start-attack').style.display = 'block';
        document.getElementById('tw-auto-cancel').style.display = 'block';
        document.getElementById('tw-stop-timer').style.display = 'none';
        document.getElementById('tw-target-time-display').style.display = 'none';
        document.getElementById('tw-remaining-time-display').style.display = 'none';
        
        updateStatus('⏹️ Timer stopped', 'info');
    }
    
    // Toggle milliseconds display
    function toggleMilliseconds() {
        const showMs = document.getElementById('tw-show-ms').checked;
        const timeInput = document.getElementById('tw-time-input');
        
        if (!timeInput.value) return;
        
        const timeObj = parseTimeInput(timeInput.value);
        if (!timeObj) return;
        
        // Create date with current time
        const now = new Date();
        const date = new Date(now);
        date.setHours(timeObj.hours, timeObj.minutes, timeObj.seconds, timeObj.milliseconds);
        
        timeInput.value = formatTime(date, showMs);
        
        // Update current time display if timer is running
        if (state.running) {
            updateDisplay();
        }
    }
    
    // Update status message
    function updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('tw-status');
        if (!statusEl) return;
        
        statusEl.textContent = message;
        
        // Reset styles
        statusEl.style.borderLeft = '4px solid #5bc0de';
        statusEl.style.color = '#fff';
        
        // Apply type styles
        switch (type) {
            case 'error':
                statusEl.style.borderLeft = '4px solid #d9534f';
                statusEl.style.color = '#d9534f';
                break;
            case 'warning':
                statusEl.style.borderLeft = '4px solid #f0ad4e';
                statusEl.style.color = '#f0ad4e';
                break;
            case 'success':
                statusEl.style.borderLeft = '4px solid #5cb85c';
                statusEl.style.color = '#5cb85c';
                break;
            case 'info':
                statusEl.style.borderLeft = '4px solid #5bc0de';
                statusEl.style.color = '#5bc0de';
                break;
        }
        
        console.log('Status:', message);
    }
    
    // Debug function
    window.TWDebug = {
        getState: () => ({ ...state }),
        testTime: () => {
            const timeInput = document.getElementById('tw-time-input');
            if (!timeInput) return 'No time input';
            
            const timeObj = parseTimeInput(timeInput.value);
            if (!timeObj) return 'Invalid time';
            
            const serverNow = getServerTime();
            const latency = getLatency();
            const current = new Date(serverNow.getTime() + latency);
            
            const target = new Date(current);
            target.setHours(
                timeObj.hours,
                timeObj.minutes,
                timeObj.seconds,
                timeObj.milliseconds
            );
            
            if (target <= current) {
                target.setDate(target.getDate() + 1);
            }
            
            const remaining = target.getTime() - current.getTime();
            
            return {
                input: timeInput.value,
                current: current.toLocaleTimeString(),
                target: target.toLocaleTimeString(),
                remainingMs: remaining,
                remainingSec: remaining / 1000,
                remainingHours: remaining / (1000 * 60 * 60)
            };
        }
    };
    
    // Start initialization
    console.log('Starting initialization...');
    init();
    
})();
