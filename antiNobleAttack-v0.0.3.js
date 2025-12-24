// ==UserScript==
// @name         Tribal Wars Anti Noble Attack
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  Auto start and auto cancel attack execution for Tribal Wars
// @author       D-maister
// @match        *://*.tribalwars.*/*
// @match        *://*.tribalwars.com.*/*
// @match        *://*.die-staemme.de/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 1000);
    }
    
    // Configuration
    const CONFIG = {
        updateInterval: 50,
        maxCancelTime: 600000,
        checkInterval: 50
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
    
    // DOM Elements
    let controlPanel = null;
    
    // Initialize the script
    function init() {
        if (!isAttackPage()) {
            return;
        }
        
        // Check if already initialized
        if (document.getElementById('tw-attack-control-panel')) {
            return;
        }
        
        createControlPanel();
        bindEvents();
        
        console.log('TW Attack Timer initialized');
    }
    
    // Check if we're on an attack confirmation page
    function isAttackPage() {
        const attackButton = document.getElementById('troop_confirm_submit');
        return attackButton && attackButton.classList.contains('btn-attack');
    }
    
    // Create the control panel
    function createControlPanel() {
        const attackButton = document.getElementById('troop_confirm_submit');
        if (!attackButton) return;
        
        // Create container
        controlPanel = document.createElement('div');
        controlPanel.id = 'tw-attack-control-panel';
        controlPanel.className = 'tw-attack-controls';
        
        // Get current server time and latency
        const serverTime = getServerTime();
        const latency = getLatency();
        const currentTimeWithMs = addMilliseconds(serverTime, latency);
        
        controlPanel.innerHTML = `
            <h3>TW Attack Timer</h3>
            
            <div class="tw-control-group">
                <label>Target Time (HH:MM:SS:mmm):</label><br>
                <input type="text" id="tw-target-time" value="${formatTimeWithMs(currentTimeWithMs)}" placeholder="сегодня в 10:41:58:264">
                <div class="tw-ms-checkbox">
                    <input type="checkbox" id="tw-show-ms">
                    <label for="tw-show-ms">Show milliseconds in time field</label>
                </div>
            </div>
            
            <div class="tw-control-group">
                <label>Update Interval (ms):</label><br>
                <input type="number" id="tw-update-interval" value="50" min="1" max="1000" step="1">
            </div>
            
            <div class="tw-control-group">
                <label>Max Cancel Time (minutes):</label><br>
                <input type="number" id="tw-max-cancel" value="10" min="1" max="60" step="1">
            </div>
            
            <div class="tw-control-group">
                <button id="tw-start-attack" class="tw-btn tw-btn-attack">Anti Noble Attack</button>
                <button id="tw-start-cancel" class="tw-btn tw-btn-cancel">Auto Cancel</button>
                <button id="tw-stop" class="tw-btn tw-btn-stop" style="display:none;">Stop Timer</button>
            </div>
            
            <div id="tw-status" class="tw-status">
                Ready - Set target time and click "Anti Noble Attack"
            </div>
            
            <div class="tw-control-group">
                <div class="tw-time-display" id="tw-current-time">
                    Current: ${formatTimeWithMs(currentTimeWithMs)}
                </div>
                <div class="tw-time-display" id="tw-target-display" style="display:none;">
                    Target: <span id="tw-target-time-display"></span>
                </div>
                <div class="tw-time-display" id="tw-remaining" style="display:none;">
                    Remaining: <span id="tw-remaining-time">0ms</span>
                </div>
            </div>
        `;
        
        // Insert after attack button
        attackButton.parentNode.insertBefore(controlPanel, attackButton.nextSibling);
    }
    
    // Bind event listeners
    function bindEvents() {
        document.getElementById('tw-start-attack')?.addEventListener('click', startAttackTimer);
        document.getElementById('tw-start-cancel')?.addEventListener('click', startCancelTimer);
        document.getElementById('tw-stop')?.addEventListener('click', stopTimer);
        document.getElementById('tw-show-ms')?.addEventListener('change', toggleMillisecondsDisplay);
        document.getElementById('tw-update-interval')?.addEventListener('change', updateInterval);
    }
    
    // Get server time from the game
    function getServerTime() {
        const serverTimeEl = document.querySelector('#serverTime');
        if (!serverTimeEl) return new Date();
        
        const timeText = serverTimeEl.textContent || '00:00:00';
        const [hours, minutes, seconds] = timeText.split(':').map(Number);
        
        const now = new Date();
        now.setHours(hours, minutes, seconds, 0);
        return now;
    }
    
    // Get latency from the game
    function getLatency() {
        const serverTimeEl = document.querySelector('#serverTime');
        if (!serverTimeEl) return 0;
        
        const title = serverTimeEl.getAttribute('data-title') || '';
        const match = title.match(/Latency:\s*(\d+)ms/i);
        return match ? parseInt(match[1], 10) : 0;
    }
    
    // Add milliseconds to a date
    function addMilliseconds(date, ms) {
        return new Date(date.getTime() + ms);
    }
    
    // Format time with milliseconds
    function formatTimeWithMs(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
        
        return `${hours}:${minutes}:${seconds}:${milliseconds}`;
    }
    
    // Format time without milliseconds
    function formatTimeWithoutMs(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        
        return `${hours}:${minutes}:${seconds}`;
    }
    
    // Parse time input
    function parseTimeInput(input) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const parts = input.split(':');
        if (parts.length >= 3) {
            const hours = parseInt(parts[0], 10) || 0;
            const minutes = parseInt(parts[1], 10) || 0;
            const seconds = parseInt(parts[2], 10) || 0;
            const milliseconds = parts[3] ? parseInt(parts[3], 10) || 0 : 0;
            
            const targetDate = new Date(today);
            targetDate.setHours(hours, minutes, seconds, milliseconds);
            
            if (targetDate < now) {
                targetDate.setDate(targetDate.getDate() + 1);
            }
            
            return targetDate;
        }
        
        return null;
    }
    
    // Toggle milliseconds display
    function toggleMillisecondsDisplay() {
        const checkbox = document.getElementById('tw-show-ms');
        const timeInput = document.getElementById('tw-target-time');
        
        if (!checkbox || !timeInput) return;
        
        attackTimer.isMsEnabled = checkbox.checked;
        
        if (timeInput.value) {
            const parsedTime = parseTimeInput(timeInput.value);
            if (parsedTime) {
                timeInput.value = attackTimer.isMsEnabled ? 
                    formatTimeWithMs(parsedTime) : 
                    formatTimeWithoutMs(parsedTime);
            }
        }
    }
    
    // Update interval setting
    function updateInterval() {
        const intervalInput = document.getElementById('tw-update-interval');
        if (intervalInput) {
            attackTimer.updateInterval = parseInt(intervalInput.value, 10) || CONFIG.updateInterval;
        }
    }
    
    // Start attack timer
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
        
        attackTimer.targetTime = parseTimeInput(timeInput.value);
        if (!attackTimer.targetTime) {
            updateStatus('Invalid time format! Use HH:MM:SS:mmm', 'error');
            return;
        }
        
        const maxCancelInput = document.getElementById('tw-max-cancel');
        attackTimer.maxCancelTime = (parseInt(maxCancelInput.value, 10) || 10) * 60000;
        
        updateInterval();
        
        attackTimer.attackType = 'attack';
        attackTimer.startTime = new Date();
        attackTimer.running = true;
        
        document.getElementById('tw-start-attack').style.display = 'none';
        document.getElementById('tw-start-cancel').style.display = 'none';
        document.getElementById('tw-stop').style.display = 'inline-block';
        document.getElementById('tw-target-display').style.display = 'block';
        document.getElementById('tw-remaining').style.display = 'block';
        
        controlPanel.classList.add('tw-timer-running');
        
        startTimerLoop();
        
        updateStatus(`Attack timer started! Target: ${formatTimeWithMs(attackTimer.targetTime)}`);
    }
    
    // Start cancel timer
    function startCancelTimer() {
        if (attackTimer.running) {
            updateStatus('Timer already running!', 'error');
            return;
        }
        
        const maxCancelInput = document.getElementById('tw-max-cancel');
        const maxCancelMinutes = parseInt(maxCancelInput.value, 10) || 10;
        attackTimer.maxCancelTime = maxCancelMinutes * 60000;
        
        attackTimer.targetTime = new Date(Date.now() + attackTimer.maxCancelTime);
        
        const timeInput = document.getElementById('tw-target-time');
        const msCheckbox = document.getElementById('tw-show-ms');
        if (timeInput) {
            if (msCheckbox && msCheckbox.checked) {
                timeInput.value = formatTimeWithMs(attackTimer.targetTime);
            } else {
                timeInput.value = formatTimeWithoutMs(attackTimer.targetTime);
            }
        }
        
        updateInterval();
        
        attackTimer.attackType = 'cancel';
        attackTimer.startTime = new Date();
        attackTimer.running = true;
        
        document.getElementById('tw-start-attack').style.display = 'none';
        document.getElementById('tw-start-cancel').style.display = 'none';
        document.getElementById('tw-stop').style.display = 'inline-block';
        document.getElementById('tw-target-display').style.display = 'block';
        document.getElementById('tw-remaining').style.display = 'block';
        
        controlPanel.classList.add('tw-timer-running');
        
        startTimerLoop();
        
        updateStatus(`Auto-cancel timer started! Will cancel after ${maxCancelMinutes} minutes`);
    }
    
    // Start the timer loop
    function startTimerLoop() {
        if (attackTimer.intervalId) {
            clearInterval(attackTimer.intervalId);
        }
        
        attackTimer.intervalId = setInterval(timerTick, attackTimer.updateInterval);
        timerTick();
    }
    
    // Timer tick function
    function timerTick() {
        if (!attackTimer.running || !attackTimer.targetTime) return;
        
        const now = new Date();
        const remaining = attackTimer.targetTime.getTime() - now.getTime();
        
        updateTimeDisplays(now, remaining);
        
        if (remaining <= 10) {
            executeAction();
        } else if (remaining <= 0) {
            executeAction();
        }
    }
    
    // Update time displays
    function updateTimeDisplays(now, remaining) {
        const latency = getLatency();
        const currentTimeWithMs = addMilliseconds(now, latency);
        const currentTimeEl = document.getElementById('tw-current-time');
        if (currentTimeEl) {
            currentTimeEl.textContent = `Current: ${formatTimeWithMs(currentTimeWithMs)}`;
        }
        
        const targetDisplay = document.getElementById('tw-target-time-display');
        if (targetDisplay) {
            targetDisplay.textContent = formatTimeWithMs(attackTimer.targetTime);
        }
        
        const remainingEl = document.getElementById('tw-remaining-time');
        if (remainingEl) {
            if (remaining > 0) {
                remainingEl.textContent = `${remaining}ms`;
                remainingEl.style.color = remaining > 1000 ? '#4cae4c' : 
                                         remaining > 100 ? '#ff8a00' : '#d9534f';
            } else {
                remainingEl.textContent = 'NOW!';
                remainingEl.style.color = '#d9534f';
            }
        }
    }
    
    // Execute the attack or cancel action
    function executeAction() {
        const attackButton = document.getElementById('troop_confirm_submit');
        if (!attackButton) {
            updateStatus('Attack button not found!', 'error');
            stopTimer();
            return;
        }
        
        attackButton.click();
        
        if (attackTimer.attackType === 'attack') {
            updateStatus('Attack executed successfully!', 'running');
        } else {
            updateStatus('Attack cancelled (auto-cancel triggered)', 'running');
        }
        
        setTimeout(stopTimer, 1000);
    }
    
    // Stop the timer
    function stopTimer() {
        attackTimer.running = false;
        attackTimer.targetTime = null;
        attackTimer.startTime = null;
        
        if (attackTimer.intervalId) {
            clearInterval(attackTimer.intervalId);
            attackTimer.intervalId = null;
        }
        
        document.getElementById('tw-start-attack').style.display = 'inline-block';
        document.getElementById('tw-start-cancel').style.display = 'inline-block';
        document.getElementById('tw-stop').style.display = 'none';
        document.getElementById('tw-target-display').style.display = 'none';
        document.getElementById('tw-remaining').style.display = 'none';
        
        controlPanel.classList.remove('tw-timer-running');
        
        updateStatus('Timer stopped');
    }
    
    // Update status message
    function updateStatus(message, type = '') {
        const statusEl = document.getElementById('tw-status');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = 'tw-status';
            if (type) {
                statusEl.classList.add(type);
            }
        }
    }
    
    // Add CSS styles
    const styles = `
    .tw-attack-controls {
        background: linear-gradient(to bottom, #2d2d2d, #1a1a1a);
        border: 1px solid #444;
        border-radius: 4px;
        padding: 15px;
        margin: 15px 0;
        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
        color: #e0e0e0;
        font-family: Arial, sans-serif;
    }
    .tw-attack-controls h3 {
        margin: 0 0 15px 0;
        padding: 0 0 10px 0;
        border-bottom: 1px solid #555;
        color: #ff8a00;
        font-size: 16px;
        font-weight: bold;
    }
    .tw-control-group {
        margin-bottom: 12px;
    }
    .tw-control-group label {
        display: inline-block;
        width: 200px;
        font-size: 12px;
        color: #b0b0b0;
        margin-bottom: 5px;
    }
    .tw-control-group input[type="text"],
    .tw-control-group input[type="number"] {
        width: 250px;
        padding: 6px 10px;
        background: #333;
        border: 1px solid #555;
        border-radius: 3px;
        color: #fff;
        font-size: 12px;
    }
    .tw-control-group input[type="checkbox"] {
        margin-right: 8px;
        vertical-align: middle;
    }
    .tw-btn {
        padding: 8px 20px;
        background: linear-gradient(to bottom, #444, #333);
        border: 1px solid #555;
        border-radius: 3px;
        color: #fff;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
        text-shadow: 0 -1px 0 rgba(0,0,0,0.5);
        transition: all 0.2s;
        margin-right: 10px;
    }
    .tw-btn:hover {
        background: linear-gradient(to bottom, #555, #444);
        border-color: #666;
    }
    .tw-btn-attack {
        background: linear-gradient(to bottom, #d9534f, #c9302c);
        border-color: #ac2925;
    }
    .tw-btn-attack:hover {
        background: linear-gradient(to bottom, #ec7063, #d9534f);
        border-color: #d43f3a;
    }
    .tw-btn-cancel {
        background: linear-gradient(to bottom, #5bc0de, #46b8da);
        border-color: #269abc;
    }
    .tw-btn-cancel:hover {
        background: linear-gradient(to bottom, #7bd4ec, #5bc0de);
        border-color: #46b8da;
    }
    .tw-btn-stop {
        background: linear-gradient(to bottom, #f0ad4e, #eea236);
        border-color: #ec971f;
    }
    .tw-btn-stop:hover {
        background: linear-gradient(to bottom, #f7c477, #f0ad4e);
        border-color: #eea236;
    }
    .tw-status {
        margin-top: 15px;
        padding: 10px;
        background: rgba(0,0,0,0.3);
        border-radius: 3px;
        font-size: 12px;
        min-height: 20px;
    }
    .tw-status.running {
        background: rgba(76, 174, 76, 0.2);
        border-left: 3px solid #4cae4c;
    }
    .tw-status.error {
        background: rgba(217, 83, 79, 0.2);
        border-left: 3px solid #d9534f;
    }
    .tw-time-display {
        font-family: monospace;
        font-size: 14px;
        color: #ff8a00;
        font-weight: bold;
    }
    .tw-ms-checkbox {
        margin-top: 8px;
    }
    .tw-timer-running {
        animation: pulse 2s infinite;
    }
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }
    `;
    
    // Inject styles
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    
    // Handle AJAX navigation (common in Tribal Wars)
    let lastURL = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastURL) {
            lastURL = url;
            setTimeout(init, 500);
        }
    }).observe(document, {subtree: true, childList: true});
    
})();
