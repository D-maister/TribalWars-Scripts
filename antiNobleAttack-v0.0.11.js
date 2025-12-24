// ==UserScript==
// @name         Tribal Wars Anti Noble Attack
// @namespace    http://tampermonkey.net/
// @version      0.0.6
// @description  Auto start and auto cancel attack execution for Tribal Wars
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('TW Attack Timer: Script loaded for attack confirmation page');
    
    // Configuration
    const CONFIG = {
        updateInterval: 50,
        maxCancelTime: 600000,
        checkDelay: 500,
        maxAttempts: 20
    };
    
    // Global state
    let attackTimer = {
        running: false,
        targetTime: null,
        startTime: null,
        maxCancelTime: null,
        updateInterval: CONFIG.updateInterval,
        intervalId: null,
        isMsEnabled: false,
        attackType: 'attack'
    };
    
    let attempts = 0;
    let controlPanel = null;
    
    // Main initialization function
    function init() {
        console.log('TW Attack Timer: Initializing...');
        
        // Look for the attack button
        const attackButton = findAttackButton();
        
        if (!attackButton) {
            console.log('TW Attack Timer: Attack button not found yet, retrying...');
            
            if (attempts < CONFIG.maxAttempts) {
                attempts++;
                setTimeout(init, CONFIG.checkDelay);
            } else {
                console.log('TW Attack Timer: Failed to find attack button after ' + CONFIG.maxAttempts + ' attempts');
            }
            return;
        }
        
        console.log('TW Attack Timer: Found attack button:', attackButton);
        
        // Check if we already added our controls
        if (document.getElementById('tw-attack-control-panel')) {
            console.log('TW Attack Timer: Control panel already exists');
            return;
        }
        
        // Add our controls
        addControls(attackButton);
    }
    
    // Find the attack button
    function findAttackButton() {
        // Try multiple selectors
        const selectors = [
            '#troop_confirm_submit',
            'input.btn-attack',
            'input[value="Атаковать"]',
            'input[value="Attack"]',
            'input[name="submit_confirm"]',
            'input[type="submit"][class*="attack"]',
            'input.troop_confirm_go'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }
        
        // Fallback: look for any submit button
        const submitButtons = document.querySelectorAll('input[type="submit"], button[type="submit"]');
        for (const button of submitButtons) {
            const value = (button.value || button.textContent || '').toLowerCase();
            if (value.includes('attack') || value.includes('атаковать')) {
                return button;
            }
        }
        
        return null;
    }
    
    // Add control panel
    function addControls(attackButton) {
        console.log('TW Attack Timer: Adding control panel...');
        
        // Get current time with latency
        const serverTime = getServerTime();
        const latency = getLatency();
        const currentTimeWithMs = addMilliseconds(serverTime, latency);
        
        // Create control panel HTML
        controlPanel = document.createElement('div');
        controlPanel.id = 'tw-attack-control-panel';
        controlPanel.innerHTML = `
            <div style="
                background: linear-gradient(to bottom, #2d2d2d, #1a1a1a);
                border: 1px solid #444;
                border-radius: 4px;
                padding: 15px;
                margin: 15px 0;
                box-shadow: 0 2px 10px rgba(0,0,0,0.5);
                color: #e0e0e0;
                font-family: Arial, sans-serif;
                z-index: 10000;
                position: relative;
            ">
                <h3 style="
                    margin: 0 0 15px 0;
                    padding: 0 0 10px 0;
                    border-bottom: 1px solid #555;
                    color: #ff8a00;
                    font-size: 16px;
                    font-weight: bold;
                ">
                    TW Attack Timer
                </h3>
                
                <div style="margin-bottom: 12px;">
                    <label style="display: block; font-size: 12px; color: #b0b0b0; margin-bottom: 5px;">
                        Target Time (HH:MM:SS:mmm):
                    </label>
                    <input type="text" id="tw-target-time" 
                           value="${formatTimeWithMs(currentTimeWithMs)}" 
                           placeholder="сегодня в 10:41:58:264"
                           style="width: 250px; padding: 6px 10px; background: #333; border: 1px solid #555; border-radius: 3px; color: #fff; font-size: 12px;">
                    <div style="margin-top: 8px;">
                        <input type="checkbox" id="tw-show-ms" checked>
                        <label for="tw-show-ms" style="font-size: 12px; color: #b0b0b0;">
                            Show milliseconds in time field
                        </label>
                    </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <label style="display: block; font-size: 12px; color: #b0b0b0; margin-bottom: 5px;">
                        Update Interval (ms):
                    </label>
                    <input type="number" id="tw-update-interval" value="50" min="1" max="1000" step="1"
                           style="width: 250px; padding: 6px 10px; background: #333; border: 1px solid #555; border-radius: 3px; color: #fff; font-size: 12px;">
                </div>
                
                <div style="margin-bottom: 12px;">
                    <label style="display: block; font-size: 12px; color: #b0b0b0; margin-bottom: 5px;">
                        Max Cancel Time (minutes):
                    </label>
                    <input type="number" id="tw-max-cancel" value="10" min="1" max="60" step="1"
                           style="width: 250px; padding: 6px 10px; background: #333; border: 1px solid #555; border-radius: 3px; color: #fff; font-size: 12px;">
                </div>
                
                <div style="margin-bottom: 12px;">
                    <button id="tw-start-attack" class="tw-btn-attack" style="
                        padding: 8px 20px;
                        background: linear-gradient(to bottom, #d9534f, #c9302c);
                        border: 1px solid #ac2925;
                        border-radius: 3px;
                        color: #fff;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: bold;
                        text-shadow: 0 -1px 0 rgba(0,0,0,0.5);
                        margin-right: 10px;
                    ">Anti Noble Attack</button>
                    
                    <button id="tw-start-cancel" class="tw-btn-cancel" style="
                        padding: 8px 20px;
                        background: linear-gradient(to bottom, #5bc0de, #46b8da);
                        border: 1px solid #269abc;
                        border-radius: 3px;
                        color: #fff;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: bold;
                        text-shadow: 0 -1px 0 rgba(0,0,0,0.5);
                        margin-right: 10px;
                    ">Auto Cancel</button>
                    
                    <button id="tw-stop" class="tw-btn-stop" style="
                        padding: 8px 20px;
                        background: linear-gradient(to bottom, #f0ad4e, #eea236);
                        border: 1px solid #ec971f;
                        border-radius: 3px;
                        color: #fff;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: bold;
                        text-shadow: 0 -1px 0 rgba(0,0,0,0.5);
                        display: none;
                    ">Stop Timer</button>
                </div>
                
                <div id="tw-status" style="
                    margin-top: 15px;
                    padding: 10px;
                    background: rgba(0,0,0,0.3);
                    border-radius: 3px;
                    font-size: 12px;
                    min-height: 20px;
                ">
                    Ready - Set target time and click "Anti Noble Attack"
                </div>
                
                <div style="margin-top: 15px;">
                    <div id="tw-current-time" style="
                        font-family: monospace;
                        font-size: 14px;
                        color: #ff8a00;
                        font-weight: bold;
                        margin-bottom: 5px;
                    ">
                        Current: ${formatTimeWithMs(currentTimeWithMs)}
                    </div>
                    <div id="tw-target-display" style="
                        font-family: monospace;
                        font-size: 14px;
                        color: #ff8a00;
                        font-weight: bold;
                        margin-bottom: 5px;
                        display: none;
                    ">
                        Target: <span id="tw-target-time-display"></span>
                    </div>
                    <div id="tw-remaining" style="
                        font-family: monospace;
                        font-size: 14px;
                        color: #ff8a00;
                        font-weight: bold;
                        display: none;
                    ">
                        Remaining: <span id="tw-remaining-time">0ms</span>
                    </div>
                </div>
            </div>
        `;
        
        // Insert the control panel
        try {
            // Try to insert after the attack button
            attackButton.parentNode.insertBefore(controlPanel, attackButton.nextSibling);
            console.log('TW Attack Timer: Control panel added successfully');
            
            // Add event listeners
            addEventListeners();
        } catch (error) {
            console.error('TW Attack Timer: Error adding control panel:', error);
            // Fallback: add to body
            document.body.appendChild(controlPanel);
        }
    }
    
    // Add event listeners
    function addEventListeners() {
        // Attack button
        document.getElementById('tw-start-attack').addEventListener('click', startAttackTimer);
        
        // Cancel button
        document.getElementById('tw-start-cancel').addEventListener('click', startCancelTimer);
        
        // Stop button
        document.getElementById('tw-stop').addEventListener('click', stopTimer);
        
        // Checkbox
        document.getElementById('tw-show-ms').addEventListener('change', toggleMillisecondsDisplay);
        
        // Interval input
        document.getElementById('tw-update-interval').addEventListener('change', updateInterval);
        
        console.log('TW Attack Timer: Event listeners added');
    }
    
    // Utility functions
    function getServerTime() {
        const serverTimeEl = document.querySelector('#serverTime');
        if (!serverTimeEl) {
            console.log('TW Attack Timer: No server time element found');
            return new Date();
        }
        
        const timeText = serverTimeEl.textContent || '00:00:00';
        const [hours, minutes, seconds] = timeText.split(':').map(Number);
        
        const now = new Date();
        now.setHours(hours, minutes, seconds, 0);
        return now;
    }
    
    function getLatency() {
        const serverTimeEl = document.querySelector('#serverTime');
        if (!serverTimeEl) return 0;
        
        const title = serverTimeEl.getAttribute('data-title') || '';
        const match = title.match(/Latency:\s*(\d+)ms/i);
        return match ? parseInt(match[1], 10) : 0;
    }
    
    function addMilliseconds(date, ms) {
        return new Date(date.getTime() + ms);
    }
    
    function formatTimeWithMs(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
        return `${hours}:${minutes}:${seconds}:${milliseconds}`;
    }
    
    function formatTimeWithoutMs(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
    
    // Timer functions
    function startAttackTimer() {
        if (attackTimer.running) {
            updateStatus('Timer already running!', 'error');
            return;
        }
        
        const timeInput = document.getElementById('tw-target-time');
        if (!timeInput || !timeInput.value) {
            updateStatus('Please enter a target time!', 'error');
            return;
        }
        
        // Parse time
        const timeStr = timeInput.value;
        const parts = timeStr.split(':');
        if (parts.length < 3) {
            updateStatus('Invalid time format! Use HH:MM:SS:mmm', 'error');
            return;
        }
        
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        const seconds = parseInt(parts[2], 10) || 0;
        const milliseconds = parts[3] ? parseInt(parts[3], 10) || 0 : 0;
        
        console.log('=== ATTACK TIMER DEBUG ===');
        console.log('Input (local interpretation):', timeStr);
        console.log('Parsed:', {hours, minutes, seconds, milliseconds});
        
        // GET SERVER TIME (which is UTC+0)
        const serverTime = getServerTime();
        const latency = getLatency();
        const now = addMilliseconds(serverTime, latency);
        
        console.log('Server time (UTC):', serverTime);
        console.log('Server time string:', serverTime.toUTCString());
        console.log('Latency:', latency, 'ms');
        console.log('Now (server + latency):', now);
        console.log('Now UTC string:', now.toUTCString());
        
        // CRITICAL: The input time is LOCAL TIME (Moscow UTC+3)
        // We need to convert it to UTC for comparison with server time
        
        // Method 1: Create date in local timezone, then convert to UTC
        const localNow = new Date();
        const todayLocal = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
        const targetLocal = new Date(todayLocal);
        targetLocal.setHours(hours, minutes, seconds, milliseconds);
        
        console.log('Target (local time):', targetLocal);
        console.log('Target local toString:', targetLocal.toString());
        console.log('Target UTC:', targetLocal.toUTCString());
        
        // Convert to UTC for comparison with server time
        const targetUTC = new Date(targetLocal.toUTCString());
        
        console.log('Target (UTC):', targetUTC);
        console.log('Now (UTC):', now);
        console.log('Target < Now?', targetUTC < now);
        console.log('Difference (ms):', targetUTC.getTime() - now.getTime());
        
        // If target is in the past, schedule for tomorrow
        if (targetUTC <= now) {
            console.log('Target is in past, adding 1 day');
            targetUTC.setDate(targetUTC.getDate() + 1);
        }
        
        console.log('Final target (UTC):', targetUTC);
        console.log('Final target local:', new Date(targetUTC.getTime() + (3 * 60 * 60 * 1000))); // +3 hours for Moscow
        console.log('Will wait (ms):', targetUTC.getTime() - now.getTime());
        console.log('Will wait (hours):', (targetUTC.getTime() - now.getTime()) / (1000 * 60 * 60));
        
        attackTimer.targetTime = targetUTC;
        
        // Get max cancel time
        const maxCancelInput = document.getElementById('tw-max-cancel');
        attackTimer.maxCancelTime = (parseInt(maxCancelInput.value, 10) || 10) * 60000;
        
        // Get update interval
        const intervalInput = document.getElementById('tw-update-interval');
        attackTimer.updateInterval = parseInt(intervalInput.value, 10) || CONFIG.updateInterval;
        
        // Set attack type
        attackTimer.attackType = 'attack';
        attackTimer.startTime = new Date();
        attackTimer.running = true;
        
        // Update UI
        document.getElementById('tw-start-attack').style.display = 'none';
        document.getElementById('tw-start-cancel').style.display = 'none';
        document.getElementById('tw-stop').style.display = 'inline-block';
        document.getElementById('tw-target-display').style.display = 'block';
        document.getElementById('tw-remaining').style.display = 'block';
        
        document.getElementById('tw-target-time-display').textContent = formatTimeWithMs(attackTimer.targetTime);
        
        // Start timer
        startTimerLoop();
        
        updateStatus(`Attack timer started! Target: ${formatTimeWithMs(attackTimer.targetTime)}`);
    }
    
    function startCancelTimer() {
        if (attackTimer.running) {
            updateStatus('Timer already running!', 'error');
            return;
        }
        
        // Get max cancel time
        const maxCancelInput = document.getElementById('tw-max-cancel');
        const maxCancelMinutes = parseInt(maxCancelInput.value, 10) || 10;
        attackTimer.maxCancelTime = maxCancelMinutes * 60000;
        
        // Set target time to now + max cancel time
        attackTimer.targetTime = new Date(Date.now() + attackTimer.maxCancelTime);
        
        // Update time input
        const timeInput = document.getElementById('tw-target-time');
        const msCheckbox = document.getElementById('tw-show-ms');
        if (msCheckbox && msCheckbox.checked) {
            timeInput.value = formatTimeWithMs(attackTimer.targetTime);
        } else {
            timeInput.value = formatTimeWithoutMs(attackTimer.targetTime);
        }
        
        // Get update interval
        const intervalInput = document.getElementById('tw-update-interval');
        attackTimer.updateInterval = parseInt(intervalInput.value, 10) || CONFIG.updateInterval;
        
        // Set attack type
        attackTimer.attackType = 'cancel';
        attackTimer.startTime = new Date();
        attackTimer.running = true;
        
        // Update UI
        document.getElementById('tw-start-attack').style.display = 'none';
        document.getElementById('tw-start-cancel').style.display = 'none';
        document.getElementById('tw-stop').style.display = 'inline-block';
        document.getElementById('tw-target-display').style.display = 'block';
        document.getElementById('tw-remaining').style.display = 'block';
        
        document.getElementById('tw-target-time-display').textContent = formatTimeWithMs(attackTimer.targetTime);
        
        // Start timer
        startTimerLoop();
        
        updateStatus(`Auto-cancel timer started! Will cancel after ${maxCancelMinutes} minutes`);
    }
    
    function startTimerLoop() {
        if (attackTimer.intervalId) {
            clearInterval(attackTimer.intervalId);
        }
        
        attackTimer.intervalId = setInterval(timerTick, attackTimer.updateInterval);
        timerTick();
    }
    
    function timerTick() {
        if (!attackTimer.running || !attackTimer.targetTime) return;
        
        // Use SERVER time, not local time!
        const serverTime = getServerTime();
        const latency = getLatency();
        const now = addMilliseconds(serverTime, latency);
        
        const remaining = attackTimer.targetTime.getTime() - now.getTime();
        
        console.log('Timer tick:'); // Add debugging
        console.log('Server time:', serverTime);
        console.log('Now (with latency):', now);
        console.log('Target:', attackTimer.targetTime);
        console.log('Remaining:', remaining, 'ms');
        
        // Update displays
        const currentTimeWithMs = addMilliseconds(now, latency);
        document.getElementById('tw-current-time').textContent = `Current: ${formatTimeWithMs(currentTimeWithMs)}`;
        
        const remainingEl = document.getElementById('tw-remaining-time');
        if (remaining > 0) {
            remainingEl.textContent = `${remaining}ms`;
            remainingEl.style.color = remaining > 1000 ? '#4cae4c' : 
                                     remaining > 100 ? '#ff8a00' : '#d9534f';
        } else {
            remainingEl.textContent = 'NOW!';
            remainingEl.style.color = '#d9534f';
        }
        
        // Check if it's time to click
        if (remaining <= 10) {
            console.log('Executing! Remaining:', remaining);
            executeAction();
        }
    }
    
    function executeAction() {
        const attackButton = findAttackButton();
        if (!attackButton) {
            updateStatus('Attack button not found!', 'error');
            stopTimer();
            return;
        }
        
        // Click the button
        attackButton.click();
        
        if (attackTimer.attackType === 'attack') {
            updateStatus('Attack executed successfully!', 'running');
        } else {
            updateStatus('Attack cancelled (auto-cancel triggered)', 'running');
        }
        
        setTimeout(stopTimer, 1000);
    }
    
    function stopTimer() {
        attackTimer.running = false;
        attackTimer.targetTime = null;
        attackTimer.startTime = null;
        
        if (attackTimer.intervalId) {
            clearInterval(attackTimer.intervalId);
            attackTimer.intervalId = null;
        }
        
        // Update UI
        document.getElementById('tw-start-attack').style.display = 'inline-block';
        document.getElementById('tw-start-cancel').style.display = 'inline-block';
        document.getElementById('tw-stop').style.display = 'none';
        document.getElementById('tw-target-display').style.display = 'none';
        document.getElementById('tw-remaining').style.display = 'none';
        
        updateStatus('Timer stopped');
    }
    
    function toggleMillisecondsDisplay() {
        const checkbox = document.getElementById('tw-show-ms');
        const timeInput = document.getElementById('tw-target-time');
        
        if (!checkbox || !timeInput) return;
        
        attackTimer.isMsEnabled = checkbox.checked;
        
        if (timeInput.value) {
            const timeStr = timeInput.value;
            const parts = timeStr.split(':');
            if (parts.length >= 3) {
                const hours = parseInt(parts[0], 10) || 0;
                const minutes = parseInt(parts[1], 10) || 0;
                const seconds = parseInt(parts[2], 10) || 0;
                const milliseconds = parts[3] ? parseInt(parts[3], 10) || 0 : 0;
                
                const date = new Date();
                date.setHours(hours, minutes, seconds, milliseconds);
                
                timeInput.value = attackTimer.isMsEnabled ? 
                    formatTimeWithMs(date) : 
                    formatTimeWithoutMs(date);
            }
        }
    }
    
    function updateInterval() {
        const intervalInput = document.getElementById('tw-update-interval');
        if (intervalInput) {
            attackTimer.updateInterval = parseInt(intervalInput.value, 10) || CONFIG.updateInterval;
        }
    }
    
    function updateStatus(message, type = '') {
        const statusEl = document.getElementById('tw-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.background = type === 'error' ? 
                'rgba(217, 83, 79, 0.2)' : 
                type === 'running' ? 
                'rgba(76, 174, 76, 0.2)' : 
                'rgba(0,0,0,0.3)';
            statusEl.style.borderLeft = type === 'error' ? 
                '3px solid #d9534f' : 
                type === 'running' ? 
                '3px solid #4cae4c' : 
                'none';
        }
        console.log('TW Attack Timer Status:', message);
    }
    
    // Start initialization
    console.log('TW Attack Timer: Starting initialization...');
    setTimeout(init, 1000);
    
    // Export for manual testing
    window.TWAttackTimer = {
        init: init,
        startAttack: startAttackTimer,
        startCancel: startCancelTimer,
        stop: stopTimer
    };
    
})();
