// ==UserScript==
// @name         Tribal Wars Timer - HYBRID TEST
// @namespace    http://tampermonkey.net/
// @version      15.0
// @description  Hybrid test with debug logging AND actual execution
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=== HYBRID TEST v15.0 ===');
    
    const CONFIG = {
        safetyOffset: 50,
        testMode: 'SAFE' // Change to 'REAL' for actual attack
    };
    
    let hybridState = {
        running: false,
        targetTime: null,
        clickTime: null,
        timerId: null,
        checkCount: 0
    };
    
    function init() {
        setTimeout(() => {
            const attackBtn = document.querySelector('#troop_confirm_submit');
            if (!attackBtn) return;
            
            if (document.getElementById('tw-hybrid-test')) return;
            
            addHybridUI(attackBtn);
        }, 1000);
    }
    
    function addHybridUI(attackBtn) {
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        
        // Set to +1 minute for quick test
        const oneMinuteLater = new Date(current.getTime() + (1 * 60 * 1000));
        
        const div = document.createElement('div');
        div.id = 'tw-hybrid-test';
        div.innerHTML = `
            <div style="background:#000;border:3px solid #ff00ff;padding:20px;margin:20px 0;">
                <h3 style="color:#ff00ff;margin:0 0 15px 0;">🟣 HYBRID TEST v15.0</h3>
                
                <div style="margin-bottom:15px;">
                    <div style="color:#aaa;margin-bottom:5px;">Target (+1 minute):</div>
                    <input type="text" id="tw-hybrid-target" value="${formatTime(oneMinuteLater)}"
                           style="width:100%;padding:10px;background:#111;color:white;border:1px solid #ff00ff;">
                </div>
                
                <div style="margin-bottom:15px;">
                    <label style="color:#aaa;display:block;margin-bottom:5px;">
                        <input type="radio" name="mode" value="SAFE" checked> SAFE MODE (log only)
                    </label>
                    <label style="color:#aaa;display:block;">
                        <input type="radio" name="mode" value="REAL"> REAL MODE (will attack!)
                    </label>
                </div>
                
                <button id="tw-hybrid-start" style="
                    width:100%;padding:12px;background:#ff00ff;color:white;border:none;margin-bottom:10px;font-weight:bold;">
                    🟣 START HYBRID TEST
                </button>
                
                <button id="tw-hybrid-stop" style="
                    width:100%;padding:12px;background:orange;color:white;border:none;margin-bottom:10px;font-weight:bold;display:none;">
                    ⏹️ STOP TEST
                </button>
                
                <div id="tw-hybrid-log" style="
                    background:#111;
                    color:#f0f;
                    font-family:monospace;
                    font-size:11px;
                    padding:15px;
                    margin-top:15px;
                    height:200px;
                    overflow:auto;
                    white-space:pre-wrap;
                    border:1px solid #ff00ff;
                ">=== HYBRID LOG ===
Mode: SAFE (will not attack)
Time: ${new Date().toLocaleTimeString()}
Ready for test...</div>
            </div>
        `;
        
        attackBtn.parentNode.insertBefore(div, attackBtn.nextSibling);
        
        document.getElementById('tw-hybrid-start').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Get mode
            const mode = document.querySelector('input[name="mode"]:checked').value;
            CONFIG.testMode = mode;
            
            startHybridTest();
            return false;
        });
        
        document.getElementById('tw-hybrid-stop').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            stopHybridTest();
            return false;
        });
    }
    
    function logHybrid(msg) {
        console.log('HYBRID:', msg);
        const logEl = document.getElementById('tw-hybrid-log');
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
    
    function startHybridTest() {
        logHybrid('\n=== START HYBRID TEST ===');
        logHybrid(`Mode: ${CONFIG.testMode}`);
        
        if (hybridState.running) {
            logHybrid('Already running!');
            return;
        }
        
        const targetInput = document.getElementById('tw-hybrid-target').value;
        const parts = targetInput.split(':');
        
        if (parts.length < 3) {
            logHybrid('Invalid format!');
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
        
        // Calculate click time
        const clickTime = new Date(target.getTime() - latency - CONFIG.safetyOffset);
        const remaining = clickTime.getTime() - current.getTime();
        
        logHybrid(`Current: ${formatTime(current)}`);
        logHybrid(`Target: ${formatTime(target)}`);
        logHybrid(`Click at: ${formatTime(clickTime)}`);
        logHybrid(`Remaining: ${remaining}ms (${Math.round(remaining/1000)}s)`);
        
        if (remaining < 1000) {
            logHybrid('Target too close!');
            return;
        }
        
        // Update state
        hybridState.running = true;
        hybridState.targetTime = target;
        hybridState.clickTime = clickTime;
        hybridState.checkCount = 0;
        
        // Update UI
        document.getElementById('tw-hybrid-start').style.display = 'none';
        document.getElementById('tw-hybrid-stop').style.display = 'block';
        
        logHybrid(`\n✅ Timer started. Mode: ${CONFIG.testMode}`);
        logHybrid(`Will ${CONFIG.testMode === 'REAL' ? 'ATTACK' : 'LOG'} when time comes`);
        
        // Start the hybrid timer
        startHybridTimer();
    }
    
    function startHybridTimer() {
        logHybrid('Starting hybrid timer (100ms intervals)...');
        
        if (hybridState.timerId) {
            clearInterval(hybridState.timerId);
        }
        
        hybridState.timerId = setInterval(() => {
            if (!hybridState.running) return;
            
            hybridState.checkCount++;
            
            // Get current time
            const serverNow = getServerTime();
            const latency = getLatency();
            const current = new Date(serverNow.getTime() + latency);
            
            const remaining = hybridState.clickTime.getTime() - current.getTime();
            
            // Log first 5 checks and last 5 checks
            if (hybridState.checkCount <= 5 || remaining < 5000) {
                logHybrid(`Check #${hybridState.checkCount}: ${remaining}ms remaining`);
            }
            
            // Check if time to execute
            if (remaining <= CONFIG.safetyOffset) {
                logHybrid(`\n🎯 TIME IS UP! Check #${hybridState.checkCount}`);
                logHybrid(`Remaining: ${remaining}ms`);
                logHybrid(`Mode: ${CONFIG.testMode}`);
                
                if (CONFIG.testMode === 'REAL') {
                    logHybrid('🔴 REAL MODE: Executing attack!');
                    executeHybridAttack();
                } else {
                    logHybrid('🟢 SAFE MODE: Would execute now (but not attacking)');
                    stopHybridTest();
                }
            }
            
            // Safety stop after too many checks
            if (hybridState.checkCount > 1000) {
                logHybrid('Safety stop: Too many checks');
                stopHybridTest();
            }
        }, 10);
    }
    
    function executeHybridAttack() {
        logHybrid('\n=== EXECUTING HYBRID ATTACK ===');
        
        // Stop timer first
        stopHybridTest();
        
        const attackBtn = document.querySelector('#troop_confirm_submit');
        if (!attackBtn) {
            logHybrid('No attack button!');
            return;
        }
        
        // Log exact timing
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        logHybrid(`Executing at: ${formatTime(current)}`);
        logHybrid(`Target was: ${formatTime(hybridState.targetTime)}`);
        
        // ACTUALLY CLICK THE BUTTON
        logHybrid('🔴 CLICKING ATTACK BUTTON NOW!');
        
        attackBtn.click();
    }
    
    function stopHybridTest() {
        logHybrid(`\n=== STOPPING TEST ===`);
        logHybrid(`Total checks: ${hybridState.checkCount}`);
        
        hybridState.running = false;
        
        if (hybridState.timerId) {
            clearInterval(hybridState.timerId);
            hybridState.timerId = null;
        }
        
        document.getElementById('tw-hybrid-start').style.display = 'block';
        document.getElementById('tw-hybrid-stop').style.display = 'none';
        
        logHybrid('Test stopped');
    }
    
    // Quick test functions
    window.testHybridSafe = function(minutes = 1) {
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        const target = new Date(current.getTime() + (minutes * 60 * 1000));
        
        document.getElementById('tw-hybrid-target').value = formatTime(target);
        document.querySelector('input[value="SAFE"]').checked = true;
        CONFIG.testMode = 'SAFE';
        
        setTimeout(() => {
            document.getElementById('tw-hybrid-start').click();
        }, 100);
    };
    
    window.testHybridReal = function(minutes = 1) {
        const serverNow = getServerTime();
        const latency = getLatency();
        const current = new Date(serverNow.getTime() + latency);
        const target = new Date(current.getTime() + (minutes * 60 * 1000));
        
        document.getElementById('tw-hybrid-target').value = formatTime(target);
        document.querySelector('input[value="REAL"]').checked = true;
        CONFIG.testMode = 'REAL';
        
        setTimeout(() => {
            document.getElementById('tw-hybrid-start').click();
        }, 100);
    };
    
    console.log('Hybrid Test v15.0 ready.');
    console.log('Use testHybridSafe(1) for 1-minute safe test');
    console.log('Use testHybridReal(1) for 1-minute REAL attack (careful!)');
    
    init();
    
})();
