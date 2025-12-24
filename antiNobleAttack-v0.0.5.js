// ==UserScript==
// @name         Tribal Wars Anti Noble Attack
// @namespace    http://tampermonkey.net/
// @version      0.0.4
// @description  Auto start and auto cancel attack execution for Tribal Wars
// @author       D-maister
// @match        *://*.tribalwars.*/*
// @match        *://*.tribalwars.com.*/*
// @match        *://*.die-staemme.de/*
// @grant        GM_addStyle
// @grant        GM_log
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        updateInterval: 50,
        maxCancelTime: 600000,
        debug: true,
        checkInterval: 1000,
        maxWaitTime: 30000 // 30 seconds max wait
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
    let initialized = false;
    
    // Debug logging
    function log(message, data = null) {
        if (CONFIG.debug) {
            console.log('[TW Attack Timer] ' + message, data || '');
        }
    }
    
    // Check if we're on an attack confirmation page
    function isAttackPage() {
        // Check for specific Tribal Wars attack page indicators
        const indicators = [
            // URL patterns
            () => window.location.href.includes('screen=place') && window.location.href.includes('mode=attack'),
            () => window.location.href.includes('screen=place') && document.title.includes('attack'),
            
            // Page content indicators
            () => document.querySelector('#troop_confirm_submit'),
            () => document.querySelector('input.btn-attack'),
            () => document.querySelector('input[value*="ttack"]'),
            () => document.querySelector('input[value*="атаковать"]'),
            () => document.querySelector('input[name*="attack"]'),
            () => document.querySelector('#attack_info'),
            () => document.querySelector('.att_dur'),
            () => document.querySelector('.movement-list'),
            
            // Text content indicators (case insensitive)
            () => {
                const bodyText = document.body.textContent.toLowerCase();
                return bodyText.includes('attack') || 
                       bodyText.includes('атаковать') ||
                       bodyText.includes('подтвердить атаку') ||
                       bodyText.includes('attack duration');
            }
        ];
        
        for (const indicator of indicators) {
            try {
                if (indicator()) {
                    log('Attack page detected with indicator');
                    return true;
                }
            } catch (e) {
                // Ignore errors
            }
        }
        
        return false;
    }
    
    // Find the actual attack button
    function findAttackButton() {
        const selectors = [
            '#troop_confirm_submit',
            'input.btn-attack',
            'input[value="Атаковать"]',
            'input[value="Attack"]',
            'input[name*="attack"]',
            'input[type="submit"][class*="attack"]',
            'button:contains("Атаковать")',
            'button:contains("Attack")'
        ];
        
        for (const selector of selectors) {
            try {
                const element = document.querySelector(selector);
                if (element) {
                    log('Found attack button with selector: ' + selector);
                    return element;
                }
            } catch (e) {
                // Ignore invalid selector errors
            }
        }
        
        // Fallback: look for any submit button that might be the attack button
        const submitButtons = document.querySelectorAll('input[type="submit"], button[type="submit"]');
        for (const button of submitButtons) {
            const value = (button.value || button.textContent || '').toLowerCase();
            if (value.includes('attack') || value.includes('атаковать')) {
                log('Found attack button by text content');
                return button;
            }
        }
        
        return null;
    }
    
    // Wait for element to appear
    function waitForElement(selector, timeout = CONFIG.maxWaitTime) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            // Initial check
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            // Set up mutation observer
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
                
                // Timeout check
                if (Date.now() - startTime > timeout) {
                    observer.disconnect();
                    reject(new Error(`Timeout waiting for ${selector}`));
                }
            });
            
            // Start observing
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            // Also check periodically as backup
            const interval = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(interval);
                    observer.disconnect();
                    resolve(element);
                }
                
                if (Date.now() - startTime > timeout) {
                    clearInterval(interval);
                    observer.disconnect();
                    reject(new Error(`Timeout waiting for ${selector}`));
                }
            }, 500);
        });
    }
    
    // Get server time from the game
    function getServerTime() {
        // Try multiple ways to get server time
        const selectors = [
            '#serverTime',
            '.serverTime',
            '[id*="time"]',
            '.clock'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent) {
                const timeText = element.textContent.trim();
                const timeMatch = timeText.match(/(\d{1,2}):(\d{2}):(\d{2})/);
                if (timeMatch) {
                    const hours = parseInt(timeMatch[1], 10);
                    const minutes = parseInt(timeMatch[2], 10);
                    const seconds = parseInt(timeMatch[3], 10);
                    
                    const now = new Date();
                    now.setHours(hours, minutes, seconds, 0);
                    return now;
                }
            }
        }
        
        // Fallback to current time
        log('Using local time as fallback');
        return new Date();
    }
    
    // Get latency from the game
    function getLatency() {
        const serverTimeEl = document.querySelector('#serverTime');
        if (!serverTimeEl) return 0;
        
        const title = serverTimeEl.getAttribute('data-title') || 
                     serverTimeEl.getAttribute('title') || 
                     serverTimeEl.getAttribute('alt') || '';
        
        const match = title.match(/Latency:\s*(\d+)ms/i) || 
                     title.match(/Ping:\s*(\d+)ms/i) ||
                     title.match(/Delay:\s*(\d+)ms/i);
        
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
        if (!input || input.trim() === '') return null;
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Handle format "HH:MM:SS:mmm"
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
    
    // Create the control panel
    function createControlPanel() {
        const attackButton = findAttackButton();
        if (!attackButton) {
            log('Cannot create control panel: no attack button found');
            return false;
        }
        
        log('Creating control panel near button');
        
        // Remove existing panel if any
        const existingPanel = document.getElementById('tw-attack-control-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
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
                    <input type="checkbox" id="tw-show-ms" checked>
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
        
        // Try to find a good place to insert the panel
        try {
            // Look for common containers in Tribal Wars
            const containers = [
                attackButton.closest('form'),
                attackButton.closest('.content'),
                attackButton.closest('.content-border'),
                attackButton.closest('.inline-box'),
                attackButton.parentNode
            ];
            
            let container = null;
            for (const c of containers) {
                if (c) {
                    container = c;
                    break;
                }
            }
            
            if (container) {
                // Insert after the attack button or at the end of container
                if (attackButton.parentNode === container) {
                    container.insertBefore(controlPanel, attackButton.nextSibling);
                } else {
                    container.appendChild(controlPanel);
                }
                log('Control panel inserted successfully');
                return true;
            }
        } catch (e) {
            log('Error inserting control panel:', e);
        }
        
        // Fallback: insert near the attack button
        try {
            attackButton.parentNode.insertBefore(controlPanel, attackButton.nextSibling);
            log('Control panel inserted (fallback)');
            return true;
        } catch (e) {
            log('Fallback insertion failed:', e);
            return false;
        }
    }
    
    // Bind event listeners
    function bindEvents() {
        // Remove existing listeners first
        document.removeEventListener('click', handleClick);
        document.removeEventListener('change', handleChange);
        
        // Add new listeners
        document.addEventListener('click', handleClick);
        document.addEventListener('change', handleChange);
        
        log('Event listeners bound');
    }
    
    function handleClick(e) {
        if (!e.target) return;
        
        if (e.target.id === 'tw-start-attack') {
            startAttackTimer();
        } else if (e.target.id === 'tw-start-cancel') {
            startCancelTimer();
        } else if (e.target.id === 'tw-stop') {
            stopTimer();
        }
    }
    
    function handleChange(e) {
        if (!e.target) return;
        
        if (e.target.id === 'tw-show-ms') {
            toggleMillisecondsDisplay();
        } else if (e.target.id === 'tw-update-interval') {
            updateInterval();
        }
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
        log('Starting attack timer');
        
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
        
        if (controlPanel) {
            controlPanel.classList.add('tw-timer-running');
        }
        
        startTimerLoop();
        
        updateStatus(`Attack timer started! Target: ${formatTimeWithMs(attackTimer.targetTime)}`);
    }
    
    // Start cancel timer
    function startCancelTimer() {
        log('Starting cancel timer');
        
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
        
        if (controlPanel) {
            controlPanel.classList.add('tw-timer-running');
        }
        
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
        log('Executing action: ' + attackTimer.attackType);
        
        const attackButton = findAttackButton();
        if (!attackButton) {
            updateStatus('Attack button not found!', 'error');
            stopTimer();
            return;
        }
        
        // Simulate a real click
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
        log('Stopping timer');
        
        attackTimer.running = false;
        attackTimer.targetTime = null;
        attackTimer.startTime = null;
        
        if (attackTimer.intervalId) {
            clearInterval(attackTimer.intervalId);
            attackTimer.intervalId = null;
        }
        
        const startAttackBtn = document.getElementById('tw-start-attack');
        const startCancelBtn = document.getElementById('tw-start-cancel');
        const stopBtn = document.getElementById('tw-stop');
        
        if (startAttackBtn) startAttackBtn.style.display = 'inline-block';
        if (startCancelBtn) startCancelBtn.style.display = 'inline-block';
        if (stopBtn) stopBtn.style.display = 'none';
        
        const targetDisplay = document.getElementById('tw-target-display');
        const remaining = document.getElementById('tw-remaining');
        
        if (targetDisplay) targetDisplay.style.display = 'none';
        if (remaining) remaining.style.display = 'none';
        
        if (controlPanel) {
            controlPanel.classList.remove('tw-timer-running');
        }
        
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
        log('Status: ' + message);
    }
    
    // Main initialization function
    function initialize() {
        if (initialized) return;
        
        log('Attempting to initialize...');
        
        // Check if we're on an attack page
        if (!isAttackPage()) {
            log('Not an attack page, waiting...');
            return false;
        }
        
        log('Attack page detected, waiting for elements...');
        
        // Wait for attack button to appear
        try {
            // Try to find button immediately first
            if (!findAttackButton()) {
                log('Attack button not found yet, will retry...');
                return false;
            }
            
            // Create control panel
            if (!createControlPanel()) {
                log('Failed to create control panel');
                return false;
            }
            
            // Bind events
            bindEvents();
            
            // Add CSS styles
            addStyles();
            
            initialized = true;
            log('Initialization complete!');
            updateStatus('Ready - Set target time and click "Anti Noble Attack"');
            
            return true;
        } catch (error) {
            log('Initialization error:', error);
            return false;
        }
    }
    
    // Add CSS styles
    function addStyles() {
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
            z-index: 10000;
            position: relative;
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
            display: block;
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
        
        if (typeof GM_addStyle !== 'undefined') {
            GM_addStyle(styles);
        } else {
            const styleSheet = document.createElement("style");
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
    }
    
    // Start the script
    log('TW Attack Timer script loaded');
    
    // Initial attempt
    setTimeout(() => {
        if (initialize()) {
            log('Initialized on first attempt');
        } else {
            log('Will retry initialization periodically');
            
            // Set up periodic checks
            const checkInterval = setInterval(() => {
                if (!initialized && initialize()) {
                    clearInterval(checkInterval);
                    log('Initialized via periodic check');
                }
            }, CONFIG.checkInterval);
            
            // Stop checking after max time
            setTimeout(() => {
                clearInterval(checkInterval);
                if (!initialized) {
                    log('Failed to initialize after ' + (CONFIG.maxWaitTime / 1000) + ' seconds');
                }
            }, CONFIG.maxWaitTime);
        }
    }, 1000);
    
    // Monitor for AJAX navigation
    let lastURL = window.location.href;
    const observer = new MutationObserver(() => {
        const currentURL = window.location.href;
        if (currentURL !== lastURL) {
            lastURL = currentURL;
            log('URL changed, resetting initialization');
            initialized = false;
            controlPanel = null;
            
            // Wait a bit then try to initialize
            setTimeout(() => {
                if (!initialized) {
                    initialize();
                }
            }, 1000);
        }
    });
    
    observer.observe(document, {
        childList: true,
        subtree: true
    });
    
    // Also check for specific Tribal Wars AJAX events
    document.addEventListener('ajaxComplete', () => {
        log('AJAX complete, checking for attack page');
        setTimeout(() => {
            if (!initialized) {
                initialize();
            }
        }, 500);
    });
    
})();
