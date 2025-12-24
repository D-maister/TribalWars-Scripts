// ==UserScript==
// @name         Tribal Wars Timer - MINIMAL TEST
// @namespace    http://tampermonkey.net/
// @version      13.0
// @description  Minimal test to find the immediate execution bug
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=== MINIMAL TEST v13.0 ===');
    
    let testState = {
        calibrated: false,
        offset: 0,
        running: false,
        startTime: null
    };
    
    function init() {
        setTimeout(() => {
            const attackBtn = document.querySelector('#troop_confirm_submit');
            if (!attackBtn) return;
            
            if (document.getElementById('tw-minimal-test')) return;
            
            addMinimalUI(attackBtn);
        }, 1000);
    }
    
    function addMinimalUI(attackBtn) {
        const div = document.createElement('div');
        div.id = 'tw-minimal-test';
        div.innerHTML = `
            <div style="background:#000;border:3px solid red;padding:20px;margin:20px 0;">
                <h3 style="color:red;margin:0 0 15px 0;">🔴 MINIMAL TEST</h3>
                
                <div style="margin-bottom:15px;">
                    <div style="color:#aaa;margin-bottom:5px;">Test target (+6 hours):</div>
                    <input type="text" id="tw-test-target" 
                           style="width:100%;padding:10px;background:#111;color:white;border:1px solid #333;">
                </div>
                
                <button id="tw-test-btn" style="
                    width:100%;padding:12px;background:red;color:white;border:none;margin-bottom:10px;">
                    🔴 TEST BUTTON (WILL NOT ATTACK)
                </button>
                
                <div id="tw-test-log" style="
                    background:#111;
                    color:#0f0;
                    font-family:monospace;
                    font-size:12px;
                    padding:15px;
                    margin-top:15px;
                    height:150px;
                    overflow:auto;
                    white-space:pre-wrap;
                ">=== TEST LOG ===\n</div>
            </div>
        `;
        
        attackBtn.parentNode.insertBefore(div, attackBtn.nextSibling);
        
        // Set default time to +6 hours
        const serverEl = document.querySelector('#serverTime');
        if (serverEl) {
            const text = serverEl.textContent || '00:00:00';
            const [h, m, s] = text.split(':').map(Number);
            const date = new Date();
            date.setHours(h, m, s, 0);
            
            // Add 6 hours
            const sixHoursLater = new Date(date.getTime() + (6 * 60 * 60 * 1000));
            document.getElementById('tw-test-target').value = formatTime(sixHoursLater);
        }
        
        document.getElementById('tw-test-btn').addEventListener('click', function(e) {
            console.log('TEST BUTTON CLICKED - checking if attack happens...');
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Just log, don't start timer
            log('Test button clicked - page should NOT reload');
            log('If page reloads, Tribal Wars is intercepting ALL clicks');
            
            return false;
        });
        
        log('UI loaded. Click test button to see if attack happens.');
    }
    
    function log(msg) {
        console.log('TEST:', msg);
        const logEl = document.getElementById('tw-test-log');
        if (logEl) {
            logEl.textContent += msg + '\n';
            logEl.scrollTop = logEl.scrollHeight;
        }
    }
    
    function formatTime(date) {
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        const s = date.getSeconds().toString().padStart(2, '0');
        return `${h}:${m}:${s}:000`;
    }
    
    // Create a separate window for timer control
    function createExternalControl() {
        log('\n=== Trying external control ===');
        
        // Create a popup with timer controls
        const popup = window.open('', 'TimerControl', 'width=400,height=500,left=100,top=100');
        if (!popup) {
            log('❌ Popup blocked! Enable popups for this site.');
            return;
        }
        
        popup.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>External Timer Control</title>
                <style>
                    body { 
                        background: #000; 
                        color: #0f0; 
                        font-family: monospace; 
                        padding: 20px;
                        margin: 0;
                    }
                    input, button { 
                        width: 100%; 
                        padding: 10px; 
                        margin: 10px 0; 
                        background: #222; 
                        color: #fff; 
                        border: 1px solid #0f0;
                    }
                    button { background: #0a0; cursor: pointer; }
                    #log { 
                        background: #111; 
                        padding: 10px; 
                        margin-top: 20px; 
                        height: 200px; 
                        overflow: auto;
                        border: 1px solid #0a0;
                    }
                </style>
            </head>
            <body>
                <h3>🕒 External Timer Control</h3>
                <input type="text" id="ext-target" placeholder="HH:MM:SS:000">
                <input type="number" id="ext-interval" value="50" placeholder="Update interval (ms)">
                <button onclick="startExternalTimer()">🚀 Start Timer</button>
                <button onclick="stopExternalTimer()" style="background:#a00">⏹️ Stop</button>
                <div id="ext-status">Ready</div>
                <div id="log"></div>
                
                <script>
                    let extTimerId = null;
                    let extRunning = false;
                    
                    function log(msg) {
                        console.log('EXT:', msg);
                        const el = document.getElementById('log');
                        el.innerHTML += msg + '<br>';
                        el.scrollTop = el.scrollHeight;
                    }
                    
                    function startExternalTimer() {
                        if (extRunning) return;
                        
                        const target = document.getElementById('ext-target').value;
                        const interval = parseInt(document.getElementById('ext-interval').value) || 50;
                        
                        log('Starting external timer...');
                        log('Target: ' + target);
                        log('Will NOT attack immediately');
                        
                        // Send message to main window
                        window.opener.postMessage({
                            type: 'START_TIMER',
                            target: target,
                            interval: interval
                        }, '*');
                        
                        extRunning = true;
                        document.getElementById('ext-status').textContent = 'Running...';
                    }
                    
                    function stopExternalTimer() {
                        if (extTimerId) clearInterval(extTimerId);
                        extRunning = false;
                        document.getElementById('ext-status').textContent = 'Stopped';
                        log('Timer stopped');
                    }
                    
                    // Listen for messages from main window
                    window.addEventListener('message', function(e) {
                        if (e.data && e.data.type === 'TIMER_UPDATE') {
                            log('Update: ' + e.data.message);
                        }
                    });
                </script>
            </body>
            </html>
        `);
        
        log('External control window opened.');
        
        // Listen for messages from popup
        window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'START_TIMER') {
                log('Message from popup: ' + JSON.stringify(e.data));
                log('This should NOT trigger attack!');
                
                // Send back a message
                e.source.postMessage({
                    type: 'TIMER_UPDATE',
                    message: 'Timer received in main window - no attack triggered'
                }, '*');
            }
        });
    }
    
    // Add a button to create external control
    setTimeout(() => {
        const extBtn = document.createElement('button');
        extBtn.textContent = '🪟 Open External Control';
        extBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;padding:10px;background:blue;color:white;border:none;';
        extBtn.onclick = createExternalControl;
        document.body.appendChild(extBtn);
        
        log('\nExternal control button added.');
        log('Try clicking it to use popup window for timer.');
    }, 2000);
    
    console.log('Minimal Test v13.0 ready.');
    init();
    
})();
