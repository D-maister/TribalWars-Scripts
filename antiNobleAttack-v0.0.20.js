// ==UserScript==
// @name         Tribal Wars Attack Timer - FINAL WORKING
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  Working attack timer with proper event handling
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=== FINAL WORKING TIMER v6.0 ===');
    
    const CONFIG = {
        minWaitTime: 5000,      // Minimum 5 seconds
        executeOffset: 10,      // Execute 10ms before target
        updateInterval: 100     // Update every 100ms
    };
    
    let state = {
        running: false,
        targetTime: null,
        timerId: null,
        safetyChecks: 0
    };
    
    function init() {
        setTimeout(() => {
            const attackBtn = document.querySelector('#troop_confirm_submit');
            if (!attackBtn) {
                setTimeout(init, 1000);
                return;
            }
            
            if (document.getElementById('tw-final-timer')) return;
            
            addFinalTimerUI(attackBtn);
        }, 1000);
    }
    
    function addFinalTimerUI(attackBtn) {
        const serverTime = getServerTime();
        const latency = getLatency();
        const current = new Date(serverTime.getTime() + latency);
        
        const div = document.createElement('div');
        div.id = 'tw-final-timer';
        div.innerHTML = `
            <div style="
                background: #111;
                border: 3px solid #4cae4c;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                color: white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            ">
                <h3 style="
                    margin: 0 0 15px 0;
                    color: #4cae4c;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <span style="font-size: 24px;">✅</span>
                    <span>Working Attack Timer v6.0</span>
                </h3>
                
                <div style="margin-bottom: 20px;">
                    <div style="color: #aaa; margin-bottom: 8px; font-size: 14px;">
                        Target Time (HH:MM:SS:mmm):
                    </div>
                    <input type="text" 
                           id="tw-final-input" 
                           value="${formatTime(current)}"
                           placeholder="19:30:00:000"
                           style="
                               width: 100%;
                               padding: 12px;
                               background: #222;
                               border: 2px solid #444;
                               color: #fff;
                               border-radius: 4px;
                               font-family: monospace;
                               font-size: 16px;
                           ">
                </div>
                
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 20px;
                ">
                    <button id="tw-final-start" style="
                        padding: 14px;
                        background: linear-gradient(to bottom, #4cae4c, #3d8b3d);
                        border: 2px solid #367c36;
                        color: white;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 16px;
                        transition: all 0.2s;
                    ">
                        🚀 Start Timer
                    </button>
                    
                    <button id="tw-final-auto" style="
                        padding: 14px;
                        background: linear-gradient(to bottom, #5bc0de, #46b8da);
                        border: 2px solid #31b0d5;
                        color: white;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 16px;
                        transition: all 0.2s;
                    ">
                        ⏰ Auto-Cancel (10m)
                    </button>
                </div>
                
                <button id="tw-final-stop" style="
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(to bottom, #f0ad4e, #ec971f);
                    border: 2px solid #e38d13;
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 16px;
                    display: none;
                    margin-bottom: 20px;
                    transition: all 0.2s;
                ">
                    ⏹️ Stop Timer
                </button>
                
                <div id="tw-final-status" style="
                    padding: 16px;
                    background: #222;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    border-left: 4px solid #5bc0de;
                    color: #5bc0de;
                    font-size: 14px;
                    min-height: 24px;
                ">
                    ✅ Ready - Set target time and click "Start Timer"
                </div>
                
                <div style="
                    background: #000;
                    padding: 20px;
                    border-radius: 6px;
                    border: 2px solid #333;
                ">
                    <div id="tw-final-current" style="
                        color: #5bc0de;
                        font-family: 'Courier New', monospace;
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 12px;
                    ">
                        ⏰ Current: ${formatTime(current)}
                    </div>
                    
                    <div id="tw-final-target" style="
                        color: #ff8a00;
                        font-family: 'Courier New', monospace;
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 12px;
                        display: none;
                    ">
                        🎯 Target: <span id="tw-final-target-text"></span>
                    </div>
                    
                    <div id="tw-final-remaining" style="
                        color: #4cae4c;
                        font-family: 'Courier New', monospace;
                        font-size: 18px;
                        font-weight: bold;
                        display: none;
                    ">
                        ⏳ Remaining: <span id="tw-final-remaining-text">0ms</span>
                    </div>
                </div>
            </div>
        `;
        
        attackBtn.parentNode.insertBefore(div, attackBtn.nextSibling);
        
        // Add event listeners with PROPER EVENT PREVENTION
        const startBtn = document.getElementById('tw-final-start');
        const autoBtn = document.getElementById('tw-final-auto');
        const stopBtn = document.getElementById('tw-final-stop');
        
        startBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            startWorkingTimer();
            return false;
        });
        
        autoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            startAutoCancel();
            return false;
        });
        
        stopBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            stopWorkingTimer();
            return false;
        });
        
        // Update current time display every second
        setInterval(() => {
            if (!state.running) {
                updateCurrentDisplay();
            }
        }, 1000);
        
        console.log('Working Timer UI added');
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
        document.getElementById('tw-final-current').textContent = `⏰ Current: ${formatTime(current)}`;
    }
    
    function startWorkingTimer() {
        console.log('=== START WORKING TIMER ===');
        
        if (state.running) {
            updateStatus('⚠️ Timer already running!', 'warning');
            return;
        }
        
        const input = document.getElementById('tw-final-input').value;
        console.log('Input:', input);
        
        const parts = input.split(':');
        if (parts.length < 3) {
            updateStatus('❌ Invalid format! Use HH:MM:SS:mmm', 'error');
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
        
        console.log('Current time:', current.toLocaleTimeString());
        
        // Create target
        const target = new Date(current);
        target.setHours(h, m, s, ms);
        
        // If target is in past, schedule for tomorrow
        if (target <= current) {
            console.log('Target in past, adding 1 day');
            target.setDate(target.getDate() + 1);
        }
        
        const remaining = target.getTime() - current.getTime();
        
        console.log('Target time:', target.toLocaleTimeString());
        console.log('Remaining ms:', remaining);
        console.log('Remaining seconds:', remaining / 1000);
        console.log('Remaining hours:', remaining / (1000 * 60 * 60));
        
        // Safety checks
        if (remaining < CONFIG.minWaitTime) {
            console.error('Safety fail: Time too short');
            updateStatus(`❌ Error: Must wait at least ${CONFIG.minWaitTime/1000} seconds!`, 'error');
            return;
        }
        
        if (remaining > 24 * 60 * 60 * 1000) {
            console.error('Safety fail: Time too long');
            updateStatus('❌ Error: Cannot wait more than 24 hours!', 'error');
            return;
        }
        
        // Update state
        state.running = true;
        state.targetTime = target;
        state.safetyChecks = 0;
        
        // Update UI
        document.getElementById('tw-final-start').style.display = 'none';
        document.getElementById('tw-final-auto').style.display = 'none';
        document.getElementById('tw-final-stop').style.display = 'block';
        document.getElementById('tw-final-target').style.display = 'block';
        document.getElementById('tw-final-remaining').style.display = 'block';
        
        document.getElementById('tw-final-target-text').textContent = formatTime(target);
        
        updateStatus(`✅ Timer started! Will execute in ${Math.round(remaining/1000)} seconds`, 'success');
        
        // Start the working timer
        startWorkingCountdown(target);
    }
    
    function startAutoCancel() {
        console.log('=== START AUTO CANCEL ===');
        
        // Calculate 10 minutes from now
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        const tenMinutesLater = new Date(current.getTime() + (10 * 60 * 1000));
        
        // Update input
        document.getElementById('tw-final-input').value = formatTime(tenMinutesLater);
        
        // Start timer
        startWorkingTimer();
        
        updateStatus('⏰ Auto-cancel set for 10 minutes', 'info');
    }
    
    function startWorkingCountdown(targetTime) {
        console.log('Starting working countdown...');
        
        // Clear any existing timer
        if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
        
        // Use requestAnimationFrame for smoother updates
        let lastUpdate = Date.now();
        
        function updateTimer() {
            if (!state.running || !state.targetTime) {
                return;
            }
            
            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdate;
            
            // Only update display every ~100ms for performance
            if (timeSinceLastUpdate >= CONFIG.updateInterval) {
                lastUpdate = now;
                
                // Get current server time
                const serverNow = getServerTime();
                const latency = getLatency();
                const current = new Date(serverNow.getTime() + latency);
                
                const remaining = targetTime.getTime() - current.getTime();
                
                // Update display
                document.getElementById('tw-final-remaining-text').textContent = `${remaining}ms`;
                
                // Color coding
                const el = document.getElementById('tw-final-remaining-text');
                if (remaining > 10000) {
                    el.style.color = '#4cae4c'; // Green
                } else if (remaining > 2000) {
                    el.style.color = '#ff8a00'; // Orange
                } else if (remaining > 500) {
                    el.style.color = '#ff4444'; // Red
                } else {
                    el.style.color = '#ff0000'; // Bright red
                    el.style.fontWeight = 'bold';
                }
                
                // Safety: Increment check counter
                state.safetyChecks++;
                
                // Only check execution after at least 3 safety checks (300ms)
                if (state.safetyChecks >= 3) {
                    if (remaining <= CONFIG.executeOffset && remaining > -1000) {
                        console.log('🎯 EXECUTION TIME! Remaining:', remaining, 'ms');
                        executeAttack();
                        return; // Stop further updates
                    }
                }
                
                // Continue updating
                state.timerId = requestAnimationFrame(updateTimer);
            } else {
                // Continue loop
                state.timerId = requestAnimationFrame(updateTimer);
            }
        }
        
        // Start the update loop
        state.timerId = requestAnimationFrame(updateTimer);
    }
    
    function executeAttack() {
        console.log('=== EXECUTING ATTACK ===');
        
        // Stop timer first
        stopWorkingTimer();
        
        // Find attack button
        const attackBtn = document.querySelector('#troop_confirm_submit');
        if (!attackBtn) {
            console.error('No attack button found');
            updateStatus('❌ Error: Attack button not found!', 'error');
            return;
        }
        
        updateStatus('✅ Executing attack...', 'success');
        
        // Small delay to show status, then click
        setTimeout(() => {
            console.log('Clicking attack button');
            attackBtn.click();
        }, 200);
    }
    
    function stopWorkingTimer() {
        console.log('=== STOP WORKING TIMER ===');
        
        state.running = false;
        state.targetTime = null;
        state.safetyChecks = 0;
        
        if (state.timerId) {
            cancelAnimationFrame(state.timerId);
            state.timerId = null;
        }
        
        // Reset UI
        document.getElementById('tw-final-start').style.display = 'block';
        document.getElementById('tw-final-auto').style.display = 'block';
        document.getElementById('tw-final-stop').style.display = 'none';
        document.getElementById('tw-final-target').style.display = 'none';
        document.getElementById('tw-final-remaining').style.display = 'none';
        
        updateStatus('⏹️ Timer stopped', 'info');
    }
    
    function updateStatus(message, type = 'info') {
        const el = document.getElementById('tw-final-status');
        if (!el) return;
        
        el.textContent = message;
        
        // Reset styles
        el.style.borderLeftColor = '#5bc0de';
        el.style.color = '#5bc0de';
        
        // Apply type styles
        switch (type) {
            case 'error':
                el.style.borderLeftColor = '#d9534f';
                el.style.color = '#d9534f';
                break;
            case 'warning':
                el.style.borderLeftColor = '#f0ad4e';
                el.style.color = '#f0ad4e';
                break;
            case 'success':
                el.style.borderLeftColor = '#5cb85c';
                el.style.color = '#5cb85c';
                break;
            case 'info':
                el.style.borderLeftColor = '#5bc0de';
                el.style.color = '#5bc0de';
                break;
        }
        
        console.log('Status:', message);
    }
    
    // Export for testing
    window.testFinalTimer = function(hours = 6) {
        const serverTime = getServerTime();
        const latency = getLatency();
        const current = new Date(serverTime.getTime() + latency);
        const target = new Date(current.getTime() + (hours * 60 * 60 * 1000));
        
        document.getElementById('tw-final-input').value = formatTime(target);
        startWorkingTimer();
    };
    
    console.log('Final Working Timer v6.0 ready. Use testFinalTimer(6) to test +6 hours.');
    
    init();
    
})();
