// ==UserScript==
// @name         Tribal Wars Timer - DEBUG LOGIC
// @namespace    http://tampermonkey.net/
// @version      14.0
// @description  Debug version to find timer logic bug
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=== DEBUG LOGIC v14.0 ===');
    
    const CONFIG = {
        safetyOffset: 50
    };
    
    let debugState = {
        running: false,
        targetTime: null,
        startTime: null,
        timerId: null,
        step: 0
    };
    
    function init() {
        setTimeout(() => {
            const attackBtn = document.querySelector('#troop_confirm_submit');
            if (!attackBtn) return;
            
            if (document.getElementById('tw-debug-logic')) return;
            
            addDebugUI(attackBtn);
        }, 1000);
    }
    
    function addDebugUI(attackBtn) {
        const serverEl = document.querySelector('#serverTime');
        let defaultTime = '14:00:00:000';
        
        if (serverEl) {
            const text = serverEl.textContent || '00:00:00';
            const [h, m, s] = text.split(':').map(Number);
            const date = new Date();
            date.setHours(h, m, s, 0);
            
            // Set to +6 hours
            const sixHoursLater = new Date(date.getTime() + (6 * 60 * 60 * 1000));
            defaultTime = formatTime(sixHoursLater);
        }
        
        const div = document.createElement('div');
        div.id = 'tw-debug-logic';
        div.innerHTML = `
            <div style="background:#000;border:3px solid yellow;padding:20px;margin:20px 0;">
                <h3 style="color:yellow;margin:0 0 15px 0;">🐛 DEBUG LOGIC</h3>
                
                <div style="margin-bottom:15px;">
                    <div style="color:#aaa;margin-bottom:5px;">Target (+6 hours):</div>
                    <input type="text" id="tw-debug-target" value="${defaultTime}"
                           style="width:100%;padding:10px;background:#111;color:white;border:1px solid #333;">
                </div>
                
                <button id="tw-debug-start" style="
                    width:100%;padding:12px;background:yellow;color:black;border:none;margin-bottom:10px;font-weight:bold;">
                    🐛 START DEBUG TIMER
                </button>
                
                <button id="tw-debug-stop" style="
                    width:100%;padding:12px;background:orange;color:white;border:none;margin-bottom:10px;font-weight:bold;display:none;">
                    ⏹️ STOP DEBUG
                </button>
                
                <div id="tw-debug-log" style="
                    background:#111;
                    color:#0f0;
                    font-family:monospace;
                    font-size:11px;
                    padding:15px;
                    margin-top:15px;
                    height:200px;
                    overflow:auto;
                    white-space:pre-wrap;
                    line-height:1.4;
                ">=== DEBUG LOG ===
Time: ${new Date().toLocaleTimeString()}
Waiting for input...</div>
            </div>
        `;
        
        attackBtn.parentNode.insertBefore(div, attackBtn.nextSibling);
        
        document.getElementById('tw-debug-start').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            startDebugTimer();
            return false;
        });
        
        document.getElementById('tw-debug-stop').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            stopDebugTimer();
            return false;
        });
    }
    
    function logDebug(msg) {
        console.log('DEBUG:', msg);
        const logEl = document.getElementById('tw-debug-log');
        if (logEl) {
            const time = new Date().toLocaleTimeString() + '.' + new Date().getMilliseconds().toString().padStart(3, '0');
            logEl.textContent += `\n[${time}] ${msg}`;
            logEl.scrollTop = logEl.scrollHeight;
        }
    }
    
    function formatTime(date) {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        const s = date.getSeconds().toString().padStart(2, '0');
        const ms = date.getMilliseconds().toString().padStart(3, '0');
        return `${h}:${m}:${s}:${ms}`;
    }
    
    function getServerTime() {
        const el = document.querySelector('#serverTime');
        if (!el) return new Date();
        
        const text = el.textContent || '00:00:00';
        const [h, m, s] = text.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m, s, 0);
        
        // Add estimated milliseconds
        date.setMilliseconds(new Date().getMilliseconds());
        return date;
    }
    
    function getLatency() {
        const el = document.querySelector('#serverTime');
        if (!el) return 0;
        const title = el.getAttribute('data-title') || '';
        const match = title.match(/Latency:\s*([\d.]+)ms/i);
        return match ? parseFloat(match[1]) : 0;
    }
    
    function startDebugTimer() {
        logDebug('\n=== START DEBUG TIMER ===');
        debugState.step = 0;
        
        if (debugState.running) {
            logDebug('Already running!');
            return;
        }
        
        const targetInput = document.getElementById('tw-debug-target').value;
        logDebug(`Input: ${targetInput}`);
        
        const parts = targetInput.split(':');
        if (parts.length < 3) {
            logDebug('Invalid format!');
            return;
        }
        
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const s = parseInt(parts[2], 10) || 0;
        const ms = parts[3] ? parseInt(parts[3], 10) || 0 : 0;
        
        // Get current server time
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        
        logDebug(`Current server: ${formatTime(current)}`);
        logDebug(`Latency: ${latency}ms`);
        
        // Create target
        const target = new Date(current);
        target.setHours(h, m, s, ms);
        
        logDebug(`Target raw: ${formatTime(target)}`);
        
        // If target is in past, add 1 day
        if (target <= current) {
            logDebug('Target in past, adding 1 day');
            target.setDate(target.getDate() + 1);
        }
        
        logDebug(`Target final: ${formatTime(target)}`);
        
        // Calculate when to click
        const clickTime = new Date(target.getTime() - latency - CONFIG.safetyOffset);
        logDebug(`Click time: ${formatTime(clickTime)}`);
        
        const remaining = clickTime.getTime() - current.getTime();
        logDebug(`Remaining: ${remaining}ms (${Math.round(remaining/1000)}s)`);
        
        // CRITICAL: Log the actual times
        logDebug(`\nTIMESTAMP CHECK:`);
        logDebug(`Current timestamp: ${current.getTime()}`);
        logDebug(`Click timestamp: ${clickTime.getTime()}`);
        logDebug(`Difference: ${clickTime.getTime() - current.getTime()}ms`);
        
        if (remaining <= 100) {
            logDebug(`❌ BUG: Remaining is only ${remaining}ms! Should be ~6 hours!`);
            logDebug(`This explains immediate execution!`);
            return;
        }
        
        // Update state
        debugState.running = true;
        debugState.targetTime = target;
        debugState.startTime = clickTime;
        
        // Update UI
        document.getElementById('tw-debug-start').style.display = 'none';
        document.getElementById('tw-debug-stop').style.display = 'block';
        
        logDebug(`\n✅ Timer state set. Starting countdown...`);
        
        // Start debug countdown
        startDebugCountdown();
    }
    
    function startDebugCountdown() {
        logDebug(`Starting countdown with 100ms intervals`);
        
        if (debugState.timerId) {
            clearInterval(debugState.timerId);
        }
        
        let checkCount = 0;
        
        debugState.timerId = setInterval(() => {
            if (!debugState.running) return;
            
            checkCount++;
            debugState.step++;
            
            // Get current time
            const serverNow = getServerTime();
            const latency = getLatency();
            const current = new Date(serverNow.getTime() + latency);
            
            const remaining = debugState.startTime.getTime() - current.getTime();
            
            // Log first few checks in detail
            if (checkCount <= 5) {
                logDebug(`\nCheck #${checkCount}:`);
                logDebug(`  Current: ${formatTime(current)}`);
                logDebug(`  Click at: ${formatTime(debugState.startTime)}`);
                logDebug(`  Remaining: ${remaining}ms`);
                logDebug(`  Should execute? ${remaining <= CONFIG.safetyOffset ? 'YES!' : 'NO'}`);
            }
            
            // Check execution
            if (remaining <= CONFIG.safetyOffset) {
                logDebug(`\n🎯 EXECUTION CHECK #${checkCount}:`);
                logDebug(`  Remaining: ${remaining}ms`);
                logDebug(`  Threshold: ${CONFIG.safetyOffset}ms`);
                logDebug(`  Will ${remaining <= CONFIG.safetyOffset ? 'EXECUTE!' : 'wait'}`);
                
                if (remaining <= CONFIG.safetyOffset) {
                    logDebug(`\n🔴 BUG DETECTED: Executing immediately!`);
                    logDebug(`This should not happen for 6-hour timer!`);
                    logDebug(`Debug state: ${JSON.stringify({
                        step: debugState.step,
                        running: debugState.running,
                        remaining: remaining
                    })}`);
                    
                    // Don't actually execute, just log
                    debugExecute();
                    return;
                }
            }
            
            // Stop after 10 checks for testing
            if (checkCount >= 10) {
                logDebug(`\n⏹️ Stopping debug after 10 checks`);
                logDebug(`If attack happened, bug is in execution logic`);
                logDebug(`If no attack, timer logic is OK`);
                stopDebugTimer();
            }
        }, 100); // Check every 100ms
    }
    
    function debugExecute() {
        logDebug(`\n=== DEBUG EXECUTE ===`);
        logDebug(`Would click attack button now`);
        logDebug(`But for debug, just stopping timer`);
        
        stopDebugTimer();
    }
    
    function stopDebugTimer() {
        logDebug(`\n=== STOP DEBUG TIMER ===`);
        
        debugState.running = false;
        
        if (debugState.timerId) {
            clearInterval(debugState.timerId);
            debugState.timerId = null;
        }
        
        document.getElementById('tw-debug-start').style.display = 'block';
        document.getElementById('tw-debug-stop').style.display = 'none';
        
        logDebug(`Timer stopped at step ${debugState.step}`);
    }
    
    // Test function
    window.runDebugTest = function() {
        const serverNow = getServerTime();
        const sixHoursLater = new Date(serverNow.getTime() + (6 * 60 * 60 * 1000));
        document.getElementById('tw-debug-target').value = formatTime(sixHoursLater);
        
        setTimeout(() => {
            document.getElementById('tw-debug-start').click();
        }, 100);
    };
    
    console.log('Debug Logic v14.0 ready.');
    console.log('Use runDebugTest() to test +6 hours timer.');
    console.log('Watch the debug log for step-by-step analysis.');
    
    init();
    
})();
