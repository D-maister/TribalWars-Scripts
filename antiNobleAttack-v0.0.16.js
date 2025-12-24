// ==UserScript==
// @name         Tribal Wars Attack Timer - ULTIMATE FIX
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Ultimate fix for immediate execution bug
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('TW Attack Timer v3.0: Loading...');
    
    const CONFIG = {
        minUpdateInterval: 100,    // Minimum 100ms for safety
        maxUpdateInterval: 1000,
        executeOffset: 10,
        maxCancelMinutes: 10,
        minWaitTime: 5000          // Minimum 5 seconds wait
    };
    
    let state = {
        running: false,
        targetTime: null,
        intervalId: null,
        attackType: 'attack',
        startTime: null,
        safetyDelayPassed: false
    };
    
    function init() {
        setTimeout(() => {
            const attackButton = findAttackButton();
            if (!attackButton) {
                setTimeout(init, 1000);
                return;
            }
            
            if (document.getElementById('tw-ultimate-timer')) return;
            addTimerUI(attackButton);
        }, 1000);
    }
    
    function findAttackButton() {
        return document.querySelector('#troop_confirm_submit') ||
               document.querySelector('input.btn-attack');
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
    
    function addTimerUI(attackButton) {
        const serverTime = getServerTime();
        const latency = getLatency();
        const current = new Date(serverTime.getTime() + latency);
        
        const div = document.createElement('div');
        div.id = 'tw-ultimate-timer';
        div.innerHTML = `
            <div style="background:#111;border:2px solid #d9534f;padding:20px;margin:20px 0;color:#fff;">
                <h3 style="color:#d9534f;margin:0 0 15px 0;">🚨 ULTIMATE FIX v3.0</h3>
                
                <div style="margin-bottom:15px;">
                    <div style="color:#aaa;font-size:12px;margin-bottom:5px;">Target Time:</div>
                    <input type="text" id="tw-time" value="${formatTime(current)}" 
                           style="width:100%;padding:10px;background:#222;border:1px solid #444;color:#fff;">
                </div>
                
                <div style="margin-bottom:15px;">
                    <div style="color:#aaa;font-size:12px;margin-bottom:5px;">Update Interval (100-1000ms):</div>
                    <input type="number" id="tw-interval" value="200" min="100" max="1000"
                           style="width:100%;padding:10px;background:#222;border:1px solid #444;color:#fff;">
                </div>
                
                <button id="tw-start" style="
                    width:100%;padding:12px;background:#d9534f;color:white;border:none;
                    margin-bottom:10px;font-weight:bold;cursor:pointer;">
                    🚀 START TIMER
                </button>
                
                <button id="tw-stop" style="
                    width:100%;padding:12px;background:#f0ad4e;color:white;border:none;
                    display:none;font-weight:bold;cursor:pointer;">
                    ⏹️ STOP TIMER
                </button>
                
                <div id="tw-status" style="
                    padding:15px;background:#222;margin:15px 0;color:#5bc0de;">
                    READY - Set time and click START
                </div>
                
                <div style="background:#000;padding:15px;">
                    <div id="tw-current" style="color:#5bc0de;font-family:monospace;margin-bottom:5px;">
                        Current: ${formatTime(current)}
                    </div>
                    <div id="tw-target" style="color:#ff8a00;font-family:monospace;margin-bottom:5px;display:none;">
                        Target: <span id="tw-target-text"></span>
                    </div>
                    <div id="tw-remaining" style="color:#4cae4c;font-family:monospace;display:none;">
                        Remaining: <span id="tw-remaining-text">0ms</span>
                    </div>
                </div>
            </div>
        `;
        
        attackButton.parentNode.insertBefore(div, attackButton.nextSibling);
        
        document.getElementById('tw-start').addEventListener('click', startTimer);
        document.getElementById('tw-stop').addEventListener('click', stopTimer);
    }
    
    // THE FIXED VERSION - with safety delay
    function startTimer() {
        console.log('=== START TIMER ===');
        
        if (state.running) {
            updateStatus('Timer already running!', 'error');
            return;
        }
        
        const timeInput = document.getElementById('tw-time').value;
        const parts = timeInput.split(':');
        if (parts.length < 3) {
            updateStatus('Invalid time format!', 'error');
            return;
        }
        
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        const seconds = parseInt(parts[2], 10) || 0;
        const ms = parts[3] ? parseInt(parts[3], 10) || 0 : 0;
        
        console.log('Input:', {hours, minutes, seconds, ms});
        
        // Get current time
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        
        console.log('Current:', current.toLocaleTimeString());
        
        // Create target
        const target = new Date(current);
        target.setHours(hours, minutes, seconds, ms);
        
        console.log('Target (before adjustment):', target.toLocaleTimeString());
        
        if (target <= current) {
            console.log('Adding 1 day');
            target.setDate(target.getDate() + 1);
        }
        
        console.log('Final target:', target.toLocaleTimeString());
        
        const remaining = target.getTime() - current.getTime();
        console.log('Remaining ms:', remaining);
        console.log('Remaining seconds:', remaining / 1000);
        
        // CRITICAL SAFETY CHECK
        if (remaining < CONFIG.minWaitTime) {
            console.error('SAFETY FAIL: Time too short');
            updateStatus(`❌ Error: Must wait at least ${CONFIG.minWaitTime/1000} seconds!`, 'error');
            return;
        }
        
        // Update state
        state.running = true;
        state.targetTime = target;
        state.startTime = new Date();
        state.safetyDelayPassed = false;
        
        // Update UI
        document.getElementById('tw-start').style.display = 'none';
        document.getElementById('tw-stop').style.display = 'block';
        document.getElementById('tw-target').style.display = 'block';
        document.getElementById('tw-remaining').style.display = 'block';
        
        document.getElementById('tw-target-text').textContent = formatTime(target);
        
        // Get interval (enforce limits)
        const intervalInput = document.getElementById('tw-interval');
        let interval = parseInt(intervalInput.value, 10) || 200;
        interval = Math.max(CONFIG.minUpdateInterval, Math.min(CONFIG.maxUpdateInterval, interval));
        
        console.log('Using interval:', interval, 'ms');
        
        // THE ULTIMATE FIX: Use setTimeout for first check, then setInterval
        state.intervalId = setTimeout(() => {
            console.log('First timer check after safety delay');
            state.safetyDelayPassed = true;
            timerTick(); // First check
            
            // Now start regular interval
            state.intervalId = setInterval(timerTick, interval);
        }, 1000); // Wait 1 SECOND before first check!
        
        updateStatus(`✅ Timer started! Will execute in ${Math.round(remaining/1000)} seconds`, 'success');
    }
    
    // Timer tick with ultimate safety
    function timerTick() {
        if (!state.running || !state.targetTime) {
            console.log('Tick: Not running');
            return;
        }
        
        console.log('=== TIMER TICK ===');
        
        // Get current time
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        
        const remaining = state.targetTime.getTime() - current.getTime();
        
        console.log('Current:', current.toLocaleTimeString());
        console.log('Target:', state.targetTime.toLocaleTimeString());
        console.log('Remaining:', remaining, 'ms');
        
        // Update display
        document.getElementById('tw-current').textContent = `Current: ${formatTime(current)}`;
        document.getElementById('tw-remaining-text').textContent = `${remaining}ms`;
        
        // Color code
        const el = document.getElementById('tw-remaining-text');
        if (remaining > 10000) {
            el.style.color = '#4cae4c';
        } else if (remaining > 1000) {
            el.style.color = '#ff8a00';
        } else {
            el.style.color = '#d9534f';
        }
        
        // ULTIMATE SAFETY: Don't check execution for first 2 seconds
        const timeRunning = new Date() - state.startTime;
        if (timeRunning < 2000) {
            console.log('Safety: Skipping execution check (running for', timeRunning, 'ms)');
            return;
        }
        
        // Check execution
        if (remaining <= CONFIG.executeOffset && remaining > -1000) {
            console.log('🎯 EXECUTE! Remaining:', remaining, 'ms');
            execute();
        } else if (remaining <= -1000) {
            console.log('Missed execution window');
            updateStatus('⚠️ Missed execution window', 'warning');
            stopTimer();
        }
    }
    
    function execute() {
        console.log('=== EXECUTING ===');
        
        const attackButton = findAttackButton();
        if (!attackButton) {
            console.error('No attack button');
            updateStatus('❌ No attack button!', 'error');
            stopTimer();
            return;
        }
        
        updateStatus('✅ Executing attack!', 'success');
        
        // Stop timer first
        stopTimer();
        
        // Small delay then click
        setTimeout(() => {
            console.log('Clicking attack button');
            attackButton.click();
        }, 200);
    }
    
    function stopTimer() {
        console.log('=== STOP TIMER ===');
        
        if (state.intervalId) {
            clearTimeout(state.intervalId);
            clearInterval(state.intervalId);
            state.intervalId = null;
        }
        
        state.running = false;
        state.targetTime = null;
        state.startTime = null;
        state.safetyDelayPassed = false;
        
        document.getElementById('tw-start').style.display = 'block';
        document.getElementById('tw-stop').style.display = 'none';
        document.getElementById('tw-target').style.display = 'none';
        document.getElementById('tw-remaining').style.display = 'none';
        
        updateStatus('⏹️ Timer stopped', 'info');
    }
    
    function updateStatus(msg, type) {
        const el = document.getElementById('tw-status');
        if (!el) return;
        
        el.textContent = msg;
        el.style.color = 
            type === 'error' ? '#d9534f' :
            type === 'warning' ? '#f0ad4e' :
            type === 'success' ? '#5cb85c' : '#5bc0de';
        
        console.log('Status:', msg);
    }
    
    // Debug
    window.TWUltimateDebug = {
        test: function() {
            const now = new Date();
            const target = new Date(now.getTime() + (6 * 60 * 60 * 1000));
            document.getElementById('tw-time').value = formatTime(target);
            startTimer();
        },
        getState: () => state
    };
    
    console.log('Ultimate Fix v3.0 ready. Use TWUltimateDebug.test() to test +6 hours.');
    
    init();
    
})();
