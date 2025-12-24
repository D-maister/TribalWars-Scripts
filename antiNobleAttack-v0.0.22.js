// ==UserScript==
// @name         Tribal Wars Precision Timer - FIXED
// @namespace    http://tampermonkey.net/
// @version      11.0
// @description  Fixed ms calculation and display updates
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=== PRECISION TIMER FIXED v11.0 ===');
    
    const CONFIG = {
        defaultUpdateInterval: 50,
        defaultMaxCancelMinutes: 10,
        safetyOffset: 50,
        minSafetyMargin: 5000,
        maxCancelMultiplier: 2
    };
    
    let state = {
        running: false,
        targetTime: null,
        startTime: null,
        timerId: null,
        updateInterval: CONFIG.defaultUpdateInterval,
        maxCancelTime: CONFIG.defaultMaxCancelMinutes * 60 * 1000,
        latency: 0,
        lastUpdateTime: 0
    };
    
    function init() {
        setTimeout(() => {
            const attackBtn = document.querySelector('#troop_confirm_submit');
            if (!attackBtn) {
                setTimeout(init, 1000);
                return;
            }
            
            if (document.getElementById('tw-fixed-timer')) return;
            
            addFixedUI(attackBtn);
        }, 1000);
    }
    
    function addFixedUI(attackBtn) {
        const serverTime = getServerTime();
        const latency = getLatency();
        const current = new Date(serverTime.getTime() + latency);
        
        const div = document.createElement('div');
        div.id = 'tw-fixed-timer';
        div.innerHTML = `
            <div style="background:#111;border:3px solid #0f0;padding:20px;margin:20px 0;color:#fff;">
                <h3 style="color:#0f0;margin:0 0 15px 0;">🎯 FIXED TIMER v11.0</h3>
                
                <div style="margin-bottom:15px;">
                    <div style="color:#8af;margin-bottom:5px;">Target Time:</div>
                    <input type="text" id="tw-target" value="${formatTime(current)}"
                           style="width:100%;padding:12px;background:#222;border:1px solid #444;color:#fff;font-family:monospace;">
                </div>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px;">
                    <div>
                        <div style="color:#8af;margin-bottom:5px;">Update (ms):</div>
                        <input type="number" id="tw-interval" value="50" min="10" max="1000"
                               style="width:100%;padding:12px;background:#222;border:1px solid #444;color:#fff;">
                    </div>
                    <div>
                        <div style="color:#8af;margin-bottom:5px;">Max Cancel (min):</div>
                        <input type="number" id="tw-cancel" value="10" min="1" max="60"
                               style="width:100%;padding:12px;background:#222;border:1px solid #444;color:#fff;">
                    </div>
                </div>
                
                <button id="tw-start" style="width:100%;padding:14px;background:#0f0;color:#000;border:none;font-weight:bold;margin-bottom:10px;">
                    🚀 START TIMER
                </button>
                
                <button id="tw-stop" style="width:100%;padding:14px;background:#f00;color:#fff;border:none;font-weight:bold;display:none;margin-bottom:10px;">
                    ⏹️ STOP
                </button>
                
                <div id="tw-status" style="padding:15px;background:#222;margin:15px 0;color:#0af;">
                    Ready
                </div>
                
                <div style="background:#000;padding:15px;">
                    <div id="tw-current" style="color:#0af;font-family:monospace;margin-bottom:10px;font-size:16px;">
                        Current: ${formatTime(current)}
                    </div>
                    <div id="tw-target-display" style="color:#f0a;font-family:monospace;margin-bottom:10px;font-size:16px;display:none;">
                        Target: <span id="tw-target-text">--:--:--:---</span>
                    </div>
                    <div id="tw-remaining" style="color:#af0;font-family:monospace;font-size:16px;display:none;">
                        Remaining: <span id="tw-remaining-text">0ms</span>
                    </div>
                </div>
            </div>
        `;
        
        attackBtn.parentNode.insertBefore(div, attackBtn.nextSibling);
        
        document.getElementById('tw-start').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            startFixedTimer();
            return false;
        });
        
        document.getElementById('tw-stop').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            stopFixedTimer();
            return false;
        });
        
        // Update current time when not running
        setInterval(() => {
            if (!state.running) {
                updateCurrentDisplay();
            }
        }, 1000);
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
        const serverTime = getServerTime();
        const latency = getLatency();
        const current = new Date(serverTime.getTime() + latency);
        document.getElementById('tw-current').textContent = `Current: ${formatTime(current)}`;
    }
    
    function calculateClickTime(targetTime, maxCancelMinutes) {
        console.log('=== CALCULATING CLICK TIME ===');
        
        const latency = getLatency();
        const serverNow = getServerTime();
        const current = new Date(serverNow.getTime() + latency);
        
        console.log('Current:', formatTime(current));
        console.log('Target:', formatTime(targetTime));
        console.log('Latency:', latency, 'ms');
        
        // Calculate latest possible attack time
        const maxCancelMs = maxCancelMinutes * 60 * 1000;
        const twoTimesCancel = maxCancelMs * 2;
        
        let adjustedMaxCancelMs = maxCancelMs;
        
        // Adjust if needed (Solution A)
        const timeAvailable = targetTime.getTime() - current.getTime();
        if (timeAvailable < twoTimesCancel + CONFIG.minSafetyMargin) {
            adjustedMaxCancelMs = Math.floor((timeAvailable - CONFIG.minSafetyMargin) / 2);
            console.log('Adjusted max cancel from', maxCancelMs, 'to', adjustedMaxCancelMs, 'ms');
        }
        
        // Calculate latest attack time (without ms adjustment)
        const latestAttackMs = targetTime.getTime() - (adjustedMaxCancelMs * 2);
        const latestAttack = new Date(latestAttackMs);
        
        console.log('Latest attack (before ms):', formatTime(latestAttack));
        
        // CRITICAL FIX: Milliseconds calculation
        const targetMs = targetTime.getMilliseconds();
        const msAdjustment = targetMs - latency - CONFIG.safetyOffset;
        
        console.log('MS calculation:', targetMs, '-', latency, '-', CONFIG.safetyOffset, '=', msAdjustment);
        
        // Create click time with EXACT milliseconds
        const clickTime = new Date(latestAttackMs + msAdjustment);
        
        console.log('Click time:', formatTime(clickTime));
        console.log('Click ms should be:', (targetMs - latency - CONFIG.safetyOffset + 1000) % 1000);
        
        return {
            targetTime: targetTime,
            clickTime: clickTime,
            adjustedMaxCancel: adjustedMaxCancelMs / 60000,
            latency: latency,
            remaining: clickTime.getTime() - current.getTime()
        };
    }
    
    function startFixedTimer() {
        console.log('=== START FIXED TIMER ===');
        
        if (state.running) {
            updateStatus('Timer already running!', 'warning');
            return;
        }
        
        const targetInput = document.getElementById('tw-target').value;
        const parts = targetInput.split(':');
        
        if (parts.length < 3) {
            updateStatus('Invalid time format!', 'error');
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
        
        // Create target
        const target = new Date(current);
        target.setHours(h, m, s, ms);
        
        if (target <= current) {
            target.setDate(target.getDate() + 1);
        }
        
        const maxCancel = parseInt(document.getElementById('tw-cancel').value, 10) || 10;
        const interval = parseInt(document.getElementById('tw-interval').value, 10) || 50;
        
        // Calculate
        const calc = calculateClickTime(target, maxCancel);
        
        if (calc.remaining < 1000) {
            updateStatus('Not enough time!', 'error');
            return;
        }
        
        // Update state
        state.running = true;
        state.targetTime = calc.targetTime;
        state.startTime = calc.clickTime;
        state.updateInterval = Math.max(10, Math.min(1000, interval));
        state.latency = calc.latency;
        state.lastUpdateTime = Date.now();
        
        // Update UI
        document.getElementById('tw-start').style.display = 'none';
        document.getElementById('tw-stop').style.display = 'block';
        document.getElementById('tw-target-display').style.display = 'block';
        document.getElementById('tw-remaining').style.display = 'block';
        
        document.getElementById('tw-target-text').textContent = formatTime(calc.targetTime);
        
        updateStatus(`Timer started! Clicking in ${Math.round(calc.remaining/1000)}s`, 'success');
        
        // Start timer with PROPER updates
        startFixedCountdown();
    }
    
    function startFixedCountdown() {
        console.log('Starting fixed countdown with', state.updateInterval, 'ms interval');
        
        if (state.timerId) {
            clearInterval(state.timerId);
        }
        
        // Store update interval for display
        const displayInterval = Math.max(50, Math.min(state.updateInterval, 200));
        
        // Update display immediately
        updateFixedDisplay();
        
        // Start interval for execution checks
        state.timerId = setInterval(() => {
            if (!state.running) return;
            
            // Update display at displayInterval rate
            const now = Date.now();
            if (now - state.lastUpdateTime >= displayInterval) {
                state.lastUpdateTime = now;
                updateFixedDisplay();
            }
            
            // Check execution
            const serverNow = getServerTime();
            const current = new Date(serverNow.getTime() + state.latency);
            const remaining = state.startTime.getTime() - current.getTime();
            
            if (remaining <= CONFIG.safetyOffset) {
                console.log('EXECUTING! Remaining:', remaining, 'ms');
                executeFixed();
            }
        }, Math.min(state.updateInterval, 100)); // Check at least every 100ms
    }
    
    function updateFixedDisplay() {
        if (!state.running) return;
        
        const serverNow = getServerTime();
        const current = new Date(serverNow.getTime() + state.latency);
        const remaining = state.startTime.getTime() - current.getTime();
        
        // Update ALL displays every time
        document.getElementById('tw-current').textContent = `Current: ${formatTime(current)}`;
        document.getElementById('tw-remaining-text').textContent = `${remaining}ms`;
        
        // Color code
        const el = document.getElementById('tw-remaining-text');
        if (remaining > 10000) {
            el.style.color = '#0f0';
        } else if (remaining > 2000) {
            el.style.color = '#ff0';
        } else if (remaining > 500) {
            el.style.color = '#f80';
        } else {
            el.style.color = '#f00';
            el.style.fontWeight = 'bold';
        }
        
        // Log for debugging
        if (remaining < 5000) {
            console.log('Display update:', formatTime(current), 'Remaining:', remaining, 'ms');
        }
    }
    
    function executeFixed() {
        console.log('=== EXECUTING FIXED ===');
        
        stopFixedTimer();
        
        const attackBtn = document.querySelector('#troop_confirm_submit');
        if (!attackBtn) {
            updateStatus('No attack button!', 'error');
            return;
        }
        
        // Log exact timing
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        console.log('Executing at:', formatTime(current));
        console.log('Target was:', formatTime(state.targetTime));
        console.log('Click should be at:', formatTime(state.startTime));
        
        updateStatus('Executing attack...', 'success');
        
        setTimeout(() => {
            attackBtn.click();
        }, 100);
    }
    
    function stopFixedTimer() {
        state.running = false;
        
        if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
        
        document.getElementById('tw-start').style.display = 'block';
        document.getElementById('tw-stop').style.display = 'none';
        document.getElementById('tw-target-display').style.display = 'none';
        document.getElementById('tw-remaining').style.display = 'none';
        
        updateStatus('Timer stopped', 'info');
    }
    
    function updateStatus(msg, type) {
        const el = document.getElementById('tw-status');
        if (!el) return;
        
        el.textContent = msg;
        el.style.color = 
            type === 'error' ? '#f00' :
            type === 'warning' ? '#ff0' :
            type === 'success' ? '#0f0' : '#0af';
        
        console.log('Status:', msg);
    }
    
    // Test function
    window.testFixed = function() {
        const serverTime = getServerTime();
        const latency = getLatency();
        const current = new Date(serverTime.getTime() + latency);
        const target = new Date(current.getTime() + (6 * 60 * 60 * 1000));
        
        document.getElementById('tw-target').value = formatTime(target);
        startFixedTimer();
    };
    
    console.log('Fixed Timer v11.0 ready. Use testFixed() to test.');
    init();
    
})();
