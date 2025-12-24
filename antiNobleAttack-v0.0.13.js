// ==UserScript==
// @name         Tribal Wars Attack Timer - Fixed
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Simple and reliable attack timer for Tribal Wars
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('TW Attack Timer: Loading...');
    
    // Simple configuration
    const CONFIG = {
        updateInterval: 50,
        maxCancelMinutes: 10
    };
    
    // Simple state
    let state = {
        running: false,
        targetTime: null,
        intervalId: null,
        attackType: 'attack'
    };
    
    // Main function - runs when page loads
    function init() {
        // Wait a bit for page to fully load
        setTimeout(() => {
            console.log('TW Attack Timer: Looking for attack button...');
            const attackButton = findAttackButton();
            
            if (!attackButton) {
                console.log('TW Attack Timer: No attack button found');
                return;
            }
            
            // Don't add twice
            if (document.getElementById('tw-simple-timer')) {
                console.log('TW Attack Timer: Already added');
                return;
            }
            
            addTimerControls(attackButton);
        }, 1000);
    }
    
    // Find the attack button
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
        if (!serverEl) return new Date();
        
        const timeText = serverEl.textContent || '00:00:00';
        const parts = timeText.split(':').map(Number);
        
        // Create date with server time (keeps today's date)
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
    
    // Create target date
    function createTargetDate(timeObj, referenceDate) {
        // Create a copy of reference date
        const target = new Date(referenceDate.getTime());
        target.setHours(
            timeObj.hours,
            timeObj.minutes,
            timeObj.seconds,
            timeObj.milliseconds
        );
        
        // If target is in the past, add 1 day
        if (target <= referenceDate) {
            target.setDate(target.getDate() + 1);
        }
        
        return target;
    }
    
    // Format time for display
    function formatTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const ms = date.getMilliseconds().toString().padStart(3, '0');
        return `${hours}:${minutes}:${seconds}:${ms}`;
    }
    
    // Add timer controls to page
    function addTimerControls(attackButton) {
        console.log('TW Attack Timer: Adding controls...');
        
        const serverTime = getServerTime();
        const latency = getLatency();
        const currentTime = new Date(serverTime.getTime() + latency);
        
        const container = document.createElement('div');
        container.id = 'tw-simple-timer';
        container.innerHTML = `
            <div style="
                background: #2d2d2d;
                border: 1px solid #555;
                border-radius: 5px;
                padding: 15px;
                margin: 15px 0;
                color: #fff;
                font-family: Arial;
            ">
                <h3 style="margin-top: 0; color: #ff8a00; border-bottom: 1px solid #555; padding-bottom: 10px;">
                    ⏱️ Attack Timer
                </h3>
                
                <div style="margin-bottom: 15px;">
                    <div style="font-size: 12px; color: #bbb; margin-bottom: 5px;">Target Time (HH:MM:SS:mmm):</div>
                    <input type="text" id="tw-time-input" 
                           value="${formatTime(currentTime)}"
                           style="width: 100%; padding: 8px; background: #333; border: 1px solid #666; color: #fff; border-radius: 3px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <div style="font-size: 12px; color: #bbb; margin-bottom: 5px;">Update Interval (ms):</div>
                    <input type="number" id="tw-interval" value="50" min="10" max="1000"
                           style="width: 100%; padding: 8px; background: #333; border: 1px solid #666; color: #fff; border-radius: 3px;">
                </div>
                
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button id="tw-start" style="
                        flex: 1;
                        padding: 10px;
                        background: #d9534f;
                        border: 1px solid #ac2925;
                        color: white;
                        border-radius: 3px;
                        cursor: pointer;
                        font-weight: bold;
                    ">🚀 Anti Noble Attack</button>
                    
                    <button id="tw-cancel" style="
                        flex: 1;
                        padding: 10px;
                        background: #5bc0de;
                        border: 1px solid #269abc;
                        color: white;
                        border-radius: 3px;
                        cursor: pointer;
                        font-weight: bold;
                    ">⏰ Auto Cancel</button>
                </div>
                
                <button id="tw-stop" style="
                    width: 100%;
                    padding: 10px;
                    background: #f0ad4e;
                    border: 1px solid #ec971f;
                    color: white;
                    border-radius: 3px;
                    cursor: pointer;
                    font-weight: bold;
                    display: none;
                    margin-bottom: 15px;
                ">⏹️ Stop Timer</button>
                
                <div id="tw-status" style="
                    padding: 10px;
                    background: #333;
                    border-radius: 3px;
                    font-size: 12px;
                    margin-bottom: 15px;
                ">
                    Ready - Set time and click "Anti Noble Attack"
                </div>
                
                <div style="background: #222; padding: 10px; border-radius: 3px;">
                    <div id="tw-current" style="font-family: monospace; color: #ff8a00; margin-bottom: 5px;">
                        Current: ${formatTime(currentTime)}
                    </div>
                    <div id="tw-target-display" style="font-family: monospace; color: #4cae4c; display: none;">
                        Target: <span id="tw-target-text"></span>
                    </div>
                    <div id="tw-remaining-display" style="font-family: monospace; color: #5bc0de; display: none;">
                        Remaining: <span id="tw-remaining-text">0ms</span>
                    </div>
                </div>
            </div>
        `;
        
        // Insert after attack button
        attackButton.parentNode.insertBefore(container, attackButton.nextSibling);
        
        // Add event listeners
        document.getElementById('tw-start').addEventListener('click', startTimer);
        document.getElementById('tw-cancel').addEventListener('click', startCancelTimer);
        document.getElementById('tw-stop').addEventListener('click', stopTimer);
        
        console.log('TW Attack Timer: Controls added successfully');
    }
    
    // Start attack timer
    function startTimer() {
        if (state.running) {
            updateStatus('Timer already running!', 'error');
            return;
        }
        
        const timeInput = document.getElementById('tw-time-input');
        const timeStr = timeInput.value.trim();
        
        if (!timeStr) {
            updateStatus('Please enter a target time!', 'error');
            return;
        }
        
        // Parse time
        const timeObj = parseTimeInput(timeStr);
        if (!timeObj) {
            updateStatus('Invalid format! Use HH:MM:SS:mmm', 'error');
            return;
        }
        
        console.log('Starting timer with:', timeObj);
        
        // Get current server time
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        
        // Create target time
        const target = createTargetDate(timeObj, current);
        
        console.log('Current:', current);
        console.log('Target:', target);
        
        // Calculate remaining time
        const remaining = target.getTime() - current.getTime();
        
        console.log('Remaining ms:', remaining);
        
        // Safety check
        if (remaining <= 100) {
            updateStatus('Error: Target time is too close or in past!', 'error');
            return;
        }
        
        // Update state
        state.running = true;
        state.targetTime = target;
        state.attackType = 'attack';
        
        // Update UI
        document.getElementById('tw-start').style.display = 'none';
        document.getElementById('tw-cancel').style.display = 'none';
        document.getElementById('tw-stop').style.display = 'block';
        document.getElementById('tw-target-display').style.display = 'block';
        document.getElementById('tw-remaining-display').style.display = 'block';
        
        document.getElementById('tw-target-text').textContent = formatTime(target);
        
        // Get update interval
        const intervalInput = document.getElementById('tw-interval');
        const interval = parseInt(intervalInput.value, 10) || CONFIG.updateInterval;
        
        // Start timer loop
        state.intervalId = setInterval(() => timerTick(), interval);
        
        updateStatus(`Timer started! Target: ${formatTime(target)}`);
        console.log('Timer started, will wait', remaining/1000, 'seconds');
    }
    
    // Start cancel timer
    function startCancelTimer() {
        if (state.running) {
            updateStatus('Timer already running!', 'error');
            return;
        }
        
        console.log('Starting auto-cancel timer');
        
        // Get cancel time
        const cancelMinutes = CONFIG.maxCancelMinutes;
        
        // Calculate target time (now + cancel time)
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        const target = new Date(current.getTime() + (cancelMinutes * 60 * 1000));
        
        // Update time input
        document.getElementById('tw-time-input').value = formatTime(target);
        
        // Start as attack timer
        startTimer();
        state.attackType = 'cancel';
        
        updateStatus(`Auto-cancel set for ${cancelMinutes} minutes`);
    }
    
    // Timer tick function
    function timerTick() {
        if (!state.running || !state.targetTime) return;
        
        // Get current time
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        
        // Calculate remaining
        const remaining = state.targetTime.getTime() - current.getTime();
        
        // Update displays
        document.getElementById('tw-current').textContent = `Current: ${formatTime(current)}`;
        document.getElementById('tw-remaining-text').textContent = `${remaining}ms`;
        
        // Color code
        const remainingEl = document.getElementById('tw-remaining-text');
        if (remaining > 5000) {
            remainingEl.style.color = '#4cae4c';
        } else if (remaining > 1000) {
            remainingEl.style.color = '#ff8a00';
        } else {
            remainingEl.style.color = '#d9534f';
        }
        
        // Check if time to execute
        if (remaining <= 10) {
            console.log('Time to execute! Remaining:', remaining);
            executeAttack();
        }
    }
    
    // Execute the attack
    function executeAttack() {
        console.log('Executing attack...');
        
        // Find and click attack button
        const attackButton = findAttackButton();
        if (!attackButton) {
            updateStatus('Error: Attack button not found!', 'error');
            stopTimer();
            return;
        }
        
        // Click the button
        attackButton.click();
        
        if (state.attackType === 'attack') {
            updateStatus('✅ Attack executed!', 'success');
        } else {
            updateStatus('✅ Auto-cancel triggered!', 'success');
        }
        
        // Stop timer
        setTimeout(stopTimer, 1000);
    }
    
    // Stop timer
    function stopTimer() {
        console.log('Stopping timer...');
        
        if (state.intervalId) {
            clearInterval(state.intervalId);
            state.intervalId = null;
        }
        
        state.running = false;
        state.targetTime = null;
        
        // Reset UI
        document.getElementById('tw-start').style.display = 'block';
        document.getElementById('tw-cancel').style.display = 'block';
        document.getElementById('tw-stop').style.display = 'none';
        document.getElementById('tw-target-display').style.display = 'none';
        document.getElementById('tw-remaining-display').style.display = 'none';
        
        updateStatus('Timer stopped');
    }
    
    // Update status message
    function updateStatus(message, type = '') {
        const statusEl = document.getElementById('tw-status');
        if (!statusEl) return;
        
        statusEl.textContent = message;
        
        // Clear previous styles
        statusEl.style.background = '';
        statusEl.style.color = '';
        
        // Apply type styles
        if (type === 'error') {
            statusEl.style.background = 'rgba(217, 83, 79, 0.2)';
            statusEl.style.color = '#d9534f';
        } else if (type === 'success') {
            statusEl.style.background = 'rgba(92, 184, 92, 0.2)';
            statusEl.style.color = '#5cb85c';
        }
        
        console.log('Status:', message);
    }
    
    // Manual testing function
    function testTimeCalculation() {
        console.log('=== TEST TIME CALCULATION ===');
        
        const timeInput = document.getElementById('tw-time-input');
        if (!timeInput) return;
        
        const timeStr = timeInput.value;
        const timeObj = parseTimeInput(timeStr);
        
        if (!timeObj) {
            console.log('Invalid time');
            return;
        }
        
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        const target = createTargetDate(timeObj, current);
        
        const remaining = target.getTime() - current.getTime();
        
        console.log('Input:', timeStr);
        console.log('Parsed:', timeObj);
        console.log('Server now:', serverNow);
        console.log('Current (with latency):', current);
        console.log('Target:', target);
        console.log('Remaining ms:', remaining);
        console.log('Remaining seconds:', remaining / 1000);
        console.log('Will execute?', remaining <= 10 ? 'YES (immediately)' : 'NO (will wait)');
    }
    
    // Expose for debugging
    window.TWDebug = {
        testTime: testTimeCalculation,
        getState: () => state,
        forceStop: stopTimer
    };
    
    // Start initialization
    console.log('TW Attack Timer: Initializing...');
    init();
    
})();
