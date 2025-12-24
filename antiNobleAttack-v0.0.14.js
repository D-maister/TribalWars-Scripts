// ==UserScript==
// @name         TW Attack Timer - DEBUG VERSION
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Debug version to find the bug
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=== TW TIMER DEBUG VERSION LOADED ===');
    
    // Track all timer starts
    let timerStarts = [];
    
    function init() {
        setTimeout(() => {
            const attackButton = document.querySelector('#troop_confirm_submit');
            if (!attackButton) {
                console.log('No attack button found');
                return;
            }
            
            if (document.getElementById('tw-debug-timer')) return;
            
            // Create ultra-simple UI
            const div = document.createElement('div');
            div.id = 'tw-debug-timer';
            div.innerHTML = `
                <div style="background:#222;padding:15px;margin:15px 0;border:2px solid red;">
                    <h3 style="color:white;margin:0 0 10px 0;">🔴 DEBUG TIMER</h3>
                    <input type="text" id="tw-debug-time" value="14:00:00:000" style="width:100%;padding:8px;margin-bottom:10px;">
                    <button id="tw-debug-start" style="padding:10px;background:red;color:white;border:none;width:100%;">
                        TEST START (+6 hours from now)
                    </button>
                    <div id="tw-debug-log" style="margin-top:10px;padding:10px;background:#111;color:#0f0;font-family:monospace;font-size:12px;max-height:200px;overflow:auto;"></div>
                </div>
            `;
            
            attackButton.parentNode.insertBefore(div, attackButton.nextSibling);
            
            document.getElementById('tw-debug-start').addEventListener('click', debugStart);
            
            log('UI loaded. Current server time: ' + getServerTimeText());
        }, 1000);
    }
    
    function log(msg) {
        console.log('DEBUG:', msg);
        const logEl = document.getElementById('tw-debug-log');
        if (logEl) {
            logEl.innerHTML += msg + '<br>';
            logEl.scrollTop = logEl.scrollHeight;
        }
    }
    
    function getServerTimeText() {
        const el = document.querySelector('#serverTime');
        return el ? el.textContent : 'unknown';
    }
    
    function getServerTimeDate() {
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
    
    function parseTime(str) {
        const parts = str.split(':');
        return {
            h: parseInt(parts[0], 10) || 0,
            m: parseInt(parts[1], 10) || 0,
            s: parseInt(parts[2], 10) || 0,
            ms: parts[3] ? parseInt(parts[3], 10) || 0 : 0
        };
    }
    
    function debugStart() {
        log('=== STARTING DEBUG TEST ===');
        
        const input = document.getElementById('tw-debug-time').value;
        log('Input: ' + input);
        
        // Parse input time
        const targetTime = parseTime(input);
        log('Parsed: ' + JSON.stringify(targetTime));
        
        // Get current server time
        const serverNow = getServerTimeDate();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        
        log('Server time: ' + serverNow.toLocaleTimeString());
        log('Latency: ' + latency + 'ms');
        log('Current (server+latency): ' + current.toLocaleTimeString());
        log('Current timestamp: ' + current.getTime());
        
        // Create target date
        const target = new Date(current);
        target.setHours(targetTime.h, targetTime.m, targetTime.s, targetTime.ms);
        
        log('Target (same day): ' + target.toLocaleTimeString());
        log('Target timestamp: ' + target.getTime());
        
        // Check if target is in past
        if (target <= current) {
            log('⚠️ Target is in past! Adding 1 day');
            target.setDate(target.getDate() + 1);
            log('New target: ' + target.toLocaleTimeString());
            log('New target timestamp: ' + target.getTime());
        }
        
        // Calculate difference
        const diff = target.getTime() - current.getTime();
        log('Difference: ' + diff + 'ms');
        log('Difference in hours: ' + (diff / (1000 * 60 * 60)));
        
        // Record this start
        timerStarts.push({
            time: new Date(),
            input: input,
            current: current.getTime(),
            target: target.getTime(),
            diff: diff,
            executed: false
        });
        
        log('Stored in timerStarts[' + (timerStarts.length-1) + ']');
        
        // Simulate what the timer would do
        if (diff <= 10) {
            log('🔴 WOULD EXECUTE IMMEDIATELY (diff <= 10)');
            simulateExecution();
        } else {
            log('✅ Would wait ' + (diff/1000) + ' seconds');
            
            // Actually start a timer to see what happens
            startActualTimer(target, current);
        }
    }
    
    function startActualTimer(targetDate, currentDate) {
        log('--- Starting actual timer ---');
        
        const interval = 100; // Check every 100ms for debugging
        
        let checkCount = 0;
        const timerId = setInterval(() => {
            checkCount++;
            
            // Get fresh current time each check
            const serverNow = getServerTimeDate();
            const latency = getLatency();
            const currentNow = new Date(serverNow.getTime() + latency);
            
            const remaining = targetDate.getTime() - currentNow.getTime();
            
            log(`Check #${checkCount}:`);
            log(`  Current: ${currentNow.toLocaleTimeString()}.${currentNow.getMilliseconds()}`);
            log(`  Target: ${targetDate.toLocaleTimeString()}.${targetDate.getMilliseconds()}`);
            log(`  Remaining: ${remaining}ms`);
            
            if (remaining <= 10) {
                log('🔴 TIMER WOULD EXECUTE NOW!');
                clearInterval(timerId);
                simulateExecution();
            }
            
            // Stop after 5 checks to avoid spam
            if (checkCount >= 5) {
                log('Stopping checks after 5 iterations');
                clearInterval(timerId);
            }
        }, interval);
    }
    
    function simulateExecution() {
        log('💥 SIMULATED EXECUTION - Would click attack button');
        log('This would reload the page immediately');
        
        // Don't actually click, just show what would happen
        const btn = document.querySelector('#troop_confirm_submit');
        if (btn) {
            log('Found attack button: ' + btn.outerHTML.substring(0, 100));
        }
    }
    
    // Add a test button to check current logic
    function addTestButton() {
        const testBtn = document.createElement('button');
        testBtn.textContent = '🕐 Test Current Time';
        testBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;padding:10px;background:blue;color:white;border:none;';
        testBtn.onclick = function() {
            console.log('=== CURRENT TIME TEST ===');
            console.log('Server time text:', getServerTimeText());
            console.log('Server time date:', getServerTimeDate());
            console.log('Server time toString:', getServerTimeDate().toString());
            console.log('Server time UTC:', getServerTimeDate().toUTCString());
            console.log('Server time getTime:', getServerTimeDate().getTime());
            console.log('Local new Date():', new Date());
            console.log('Local getTime:', new Date().getTime());
            console.log('Latency:', getLatency());
        };
        document.body.appendChild(testBtn);
    }
    
    // Run initialization
    setTimeout(init, 500);
    setTimeout(addTestButton, 1000);
    
    // Expose for manual testing
    window.TWUltraDebug = {
        test: function(hours) {
            const now = new Date();
            const target = new Date(now.getTime() + (hours * 60 * 60 * 1000));
            const h = target.getHours().toString().padStart(2, '0');
            const m = target.getMinutes().toString().padStart(2, '0');
            const s = target.getSeconds().toString().padStart(2, '0');
            document.getElementById('tw-debug-time').value = `${h}:${m}:${s}:000`;
            debugStart();
        },
        getLogs: function() {
            return timerStarts;
        }
    };
    
    console.log('Debug version ready. Use TWUltraDebug.test(6) to test +6 hours');
    
})();
