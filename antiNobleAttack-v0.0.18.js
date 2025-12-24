// ==UserScript==
// @name         Tribal Wars Attack Timer - ISOLATED TEST
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Isolated test to find the bug
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=== ISOLATED TEST v4.0 ===');
    
    // SIMPLEST POSSIBLE VERSION
    let timerActive = false;
    let targetTime = null;
    
    function init() {
        setTimeout(() => {
            const attackBtn = document.querySelector('#troop_confirm_submit');
            if (!attackBtn) return;
            
            if (document.getElementById('tw-test-timer')) return;
            
            // Create test UI
            const div = document.createElement('div');
            div.id = 'tw-test-timer';
            div.innerHTML = `
                <div style="background:#000;border:3px solid blue;padding:20px;margin:20px 0;">
                    <h3 style="color:blue;margin:0 0 15px 0;">🔵 ISOLATED TEST</h3>
                    
                    <div style="margin-bottom:15px;">
                        <div style="color:#aaa;margin-bottom:5px;">Test target time:</div>
                        <input type="text" id="tw-test-input" value="14:00:00:000"
                               style="width:100%;padding:10px;background:#111;color:white;border:1px solid #333;">
                    </div>
                    
                    <div style="display:flex;gap:10px;margin-bottom:15px;">
                        <button id="tw-test-start" style="flex:1;padding:12px;background:green;color:white;border:none;">
                            🟢 TEST START
                        </button>
                        <button id="tw-test-stop" style="flex:1;padding:12px;background:red;color:white;border:none;display:none;">
                            🔴 TEST STOP
                        </button>
                    </div>
                    
                    <div id="tw-test-log" style="
                        background:#111;
                        padding:15px;
                        margin-top:15px;
                        color:#0f0;
                        font-family:monospace;
                        font-size:12px;
                        height:150px;
                        overflow:auto;
                        white-space:pre-wrap;
                    ">=== TEST LOG ===\n</div>
                </div>
            `;
            
            attackBtn.parentNode.insertBefore(div, attackBtn.nextSibling);
            
            document.getElementById('tw-test-start').addEventListener('click', testStart);
            document.getElementById('tw-test-stop').addEventListener('click', testStop);
            
            log('UI loaded');
        }, 1000);
    }
    
    function log(msg) {
        console.log('TEST:', msg);
        const logEl = document.getElementById('tw-test-log');
        if (logEl) {
            logEl.textContent += msg + '\n';
            logEl.scrollTop = logEl.scrollHeight;
        }
    }
    
    function getCurrentTime() {
        const serverEl = document.querySelector('#serverTime');
        if (!serverEl) return new Date();
        
        const text = serverEl.textContent || '00:00:00';
        const [h, m, s] = text.split(':').map(Number);
        
        const date = new Date();
        date.setHours(h, m, s, 0);
        
        const latencyText = serverEl.getAttribute('data-title') || '';
        const latencyMatch = latencyText.match(/Latency:\s*([\d.]+)ms/i);
        const latency = latencyMatch ? parseFloat(latencyMatch[1]) : 0;
        
        return new Date(date.getTime() + latency);
    }
    
    function testStart() {
        log('\n=== TEST START ===');
        
        if (timerActive) {
            log('Timer already active');
            return;
        }
        
        const input = document.getElementById('tw-test-input').value;
        log(`Input: ${input}`);
        
        const parts = input.split(':');
        if (parts.length < 3) {
            log('Invalid format');
            return;
        }
        
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const s = parseInt(parts[2], 10) || 0;
        const ms = parts[3] ? parseInt(parts[3], 10) || 0 : 0;
        
        // Get current time
        const current = getCurrentTime();
        log(`Current: ${current.toLocaleTimeString()}`);
        
        // Create target
        const target = new Date(current);
        target.setHours(h, m, s, ms);
        
        if (target <= current) {
            target.setDate(target.getDate() + 1);
        }
        
        const remaining = target.getTime() - current.getTime();
        log(`Target: ${target.toLocaleTimeString()}`);
        log(`Remaining: ${remaining}ms (${Math.round(remaining/1000)}s)`);
        
        // CRITICAL TEST: Log every step
        log(`\nWill wait ${Math.round(remaining/1000)} seconds before clicking`);
        
        if (remaining < 5000) {
            log('❌ ABORTING: Less than 5 seconds remaining');
            return;
        }
        
        // Start timer BUT DON'T CLICK IMMEDIATELY
        timerActive = true;
        targetTime = target;
        
        document.getElementById('tw-test-start').style.display = 'none';
        document.getElementById('tw-test-stop').style.display = 'block';
        
        log('Timer ACTIVE - waiting...');
        
        // TEST 1: Does the click happen immediately?
        log('Setting 5 second timeout to check...');
        
        setTimeout(() => {
            if (!timerActive) {
                log('❌ Timer was already stopped! Bug found!');
                return;
            }
            
            const now = getCurrentTime();
            const newRemaining = targetTime.getTime() - now.getTime();
            log(`After 5s: ${newRemaining}ms remaining`);
            
            if (newRemaining <= 0) {
                log('❌ BUG: Timer should still be running!');
            } else {
                log('✅ Timer still running correctly');
            }
        }, 5000);
        
        // Start main timer with LARGE interval
        const interval = 1000; // Check every second
        
        const timerId = setInterval(() => {
            if (!timerActive) {
                clearInterval(timerId);
                return;
            }
            
            const now = getCurrentTime();
            const remaining = targetTime.getTime() - now.getTime();
            
            log(`Tick: ${remaining}ms remaining`);
            
            if (remaining <= 100) { // 100ms before target
                log('🎯 TIME TO CLICK!');
                testExecute();
                clearInterval(timerId);
            }
        }, interval);
        
        // Store timer ID
        window.testTimerId = timerId;
    }
    
    function testExecute() {
        log('=== TEST EXECUTE ===');
        log('This is where the attack button would be clicked');
        log('But for testing, we just stop the timer');
        
        testStop();
        
        // Show what WOULD happen
        const attackBtn = document.querySelector('#troop_confirm_submit');
        if (attackBtn) {
            log(`Would click: ${attackBtn.outerHTML.substring(0, 100)}...`);
        }
    }
    
    function testStop() {
        log('=== TEST STOP ===');
        
        timerActive = false;
        targetTime = null;
        
        if (window.testTimerId) {
            clearInterval(window.testTimerId);
            window.testTimerId = null;
        }
        
        document.getElementById('tw-test-start').style.display = 'block';
        document.getElementById('tw-test-stop').style.display = 'none';
        
        log('Timer stopped');
    }
    
    // Manual test function
    window.runManualTest = function(hours = 6) {
        const now = new Date();
        const target = new Date(now.getTime() + (hours * 60 * 60 * 1000));
        const h = target.getHours().toString().padStart(2, '0');
        const m = target.getMinutes().toString().padStart(2, '0');
        const s = target.getSeconds().toString().padStart(2, '0');
        
        document.getElementById('tw-test-input').value = `${h}:${m}:${s}:000`;
        testStart();
    };
    
    console.log('Isolated test ready. Use runManualTest(6) to test +6 hours.');
    init();
    
})();
