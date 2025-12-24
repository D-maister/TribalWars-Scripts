// ==UserScript==
// @name         Tribal Wars Attack Timer - NO CLICK VERSION
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  Timer that doesn't click until the very end
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=== NO-CLICK TIMER v5.0 ===');
    
    let state = {
        running: false,
        targetTime: null,
        timerId: null
    };
    
    function init() {
        setTimeout(() => {
            const attackBtn = document.querySelector('#troop_confirm_submit');
            if (!attackBtn) return;
            
            if (document.getElementById('tw-noclick-timer')) return;
            
            // Create UI with PREVENT DEFAULT on all buttons
            const div = document.createElement('div');
            div.id = 'tw-noclick-timer';
            div.innerHTML = `
                <div style="background:#000;border:3px solid purple;padding:20px;margin:20px 0;">
                    <h3 style="color:purple;margin:0 0 15px 0;">🟣 NO-CLICK TIMER</h3>
                    
                    <div style="margin-bottom:15px;">
                        <div style="color:#aaa;margin-bottom:5px;">Target time (+6 hours):</div>
                        <input type="text" id="tw-noclick-input" 
                               style="width:100%;padding:10px;background:#111;color:white;border:1px solid #333;">
                    </div>
                    
                    <button id="tw-noclick-start" style="
                        width:100%;
                        padding:12px;
                        background:purple;
                        color:white;
                        border:none;
                        margin-bottom:10px;
                        cursor:pointer;">
                        🟣 START COUNTDOWN (WON'T CLICK)
                    </button>
                    
                    <button id="tw-noclick-stop" style="
                        width:100%;
                        padding:12px;
                        background:orange;
                        color:white;
                        border:none;
                        display:none;
                        cursor:pointer;">
                        🟠 STOP TIMER
                    </button>
                    
                    <div id="tw-noclick-status" style="
                        padding:15px;
                        background:#111;
                        margin:15px 0;
                        color:#0af;
                        font-family:monospace;
                    ">Status: Ready</div>
                    
                    <div style="background:#111;padding:15px;">
                        <div id="tw-noclick-current" style="color:#0af;font-family:monospace;margin-bottom:5px;">
                            Current: Loading...
                        </div>
                        <div id="tw-noclick-target" style="color:#f0a;font-family:monospace;margin-bottom:5px;display:none;">
                            Target: --
                        </div>
                        <div id="tw-noclick-remaining" style="color:#af0;font-family:monospace;display:none;">
                            Remaining: --
                        </div>
                    </div>
                </div>
            `;
            
            attackBtn.parentNode.insertBefore(div, attackBtn.nextSibling);
            
            // Set default time to +6 hours
            const serverTime = getServerTime();
            const latency = getLatency();
            const current = new Date(serverTime.getTime() + latency);
            const sixHoursLater = new Date(current.getTime() + (6 * 60 * 60 * 1000));
            document.getElementById('tw-noclick-input').value = formatTime(sixHoursLater);
            
            // Add PREVENT DEFAULT to all our buttons
            const startBtn = document.getElementById('tw-noclick-start');
            const stopBtn = document.getElementById('tw-noclick-stop');
            
            startBtn.addEventListener('click', function(e) {
                console.log('Start button clicked - PREVENTING DEFAULT');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                startNoClickTimer();
                return false;
            });
            
            stopBtn.addEventListener('click', function(e) {
                console.log('Stop button clicked - PREVENTING DEFAULT');
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                stopNoClickTimer();
                return false;
            });
            
            updateCurrentTime();
            setInterval(updateCurrentTime, 1000);
            
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
    
    function updateCurrentTime() {
        const serverTime = getServerTime();
        const latency = getLatency();
        const current = new Date(serverTime.getTime() + latency);
        document.getElementById('tw-noclick-current').textContent = `Current: ${formatTime(current)}`;
    }
    
    function startNoClickTimer() {
        console.log('=== START NO-CLICK TIMER ===');
        
        if (state.running) {
            updateStatus('Timer already running!');
            return;
        }
        
        const input = document.getElementById('tw-noclick-input').value;
        console.log('Input:', input);
        
        const parts = input.split(':');
        if (parts.length < 3) {
            updateStatus('Invalid time format');
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
        
        console.log('Current:', current.toLocaleTimeString());
        
        // Create target
        const target = new Date(current);
        target.setHours(h, m, s, ms);
        
        if (target <= current) {
            target.setDate(target.getDate() + 1);
        }
        
        const remaining = target.getTime() - current.getTime();
        
        console.log('Target:', target.toLocaleTimeString());
        console.log('Remaining:', remaining, 'ms');
        
        if (remaining < 5000) {
            updateStatus('Error: Must wait at least 5 seconds');
            return;
        }
        
        // Update state
        state.running = true;
        state.targetTime = target;
        
        // Update UI
        document.getElementById('tw-noclick-start').style.display = 'none';
        document.getElementById('tw-noclick-stop').style.display = 'block';
        document.getElementById('tw-noclick-target').style.display = 'block';
        document.getElementById('tw-noclick-remaining').style.display = 'block';
        
        document.getElementById('tw-noclick-target').textContent = `Target: ${formatTime(target)}`;
        
        updateStatus(`Timer started! Will wait ${Math.round(remaining/1000)} seconds`);
        
        // Start countdown WITHOUT clicking
        startCountdown(target);
    }
    
    function startCountdown(targetTime) {
        console.log('Starting countdown...');
        
        // Clear any existing timer
        if (state.timerId) {
            clearInterval(state.timerId);
        }
        
        // Update every second
        state.timerId = setInterval(() => {
            if (!state.running) return;
            
            const serverNow = getServerTime();
            const latency = getLatency();
            const current = new Date(serverNow.getTime() + latency);
            
            const remaining = targetTime.getTime() - current.getTime();
            
            // Update display
            document.getElementById('tw-noclick-remaining').textContent = 
                `Remaining: ${remaining}ms (${Math.round(remaining/1000)}s)`;
            
            // Color code
            const el = document.getElementById('tw-noclick-remaining');
            if (remaining > 10000) el.style.color = '#0f0';
            else if (remaining > 1000) el.style.color = '#ff0';
            else el.style.color = '#f00';
            
            console.log('Countdown:', remaining, 'ms remaining');
            
            // When time is up, ASK USER to click manually
            if (remaining <= 100) {
                console.log('TIME IS UP!');
                clearInterval(state.timerId);
                state.timerId = null;
                
                updateStatus('⏰ TIME IS UP! Click the attack button NOW!');
                document.getElementById('tw-noclick-remaining').textContent = 'NOW! CLICK ATTACK!';
                document.getElementById('tw-noclick-remaining').style.color = '#f00';
                document.getElementById('tw-noclick-remaining').style.fontWeight = 'bold';
                
                // Flash the remaining display
                let flash = true;
                const flashInterval = setInterval(() => {
                    const el = document.getElementById('tw-noclick-remaining');
                    el.style.backgroundColor = flash ? '#f00' : '#111';
                    el.style.color = flash ? '#fff' : '#f00';
                    flash = !flash;
                }, 500);
                
                // Stop flashing after 10 seconds
                setTimeout(() => {
                    clearInterval(flashInterval);
                    document.getElementById('tw-noclick-remaining').style.backgroundColor = '';
                }, 10000);
            }
        }, 100); // Update every 100ms
    }
    
    function stopNoClickTimer() {
        console.log('=== STOP TIMER ===');
        
        state.running = false;
        state.targetTime = null;
        
        if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
        
        // Reset UI
        document.getElementById('tw-noclick-start').style.display = 'block';
        document.getElementById('tw-noclick-stop').style.display = 'none';
        document.getElementById('tw-noclick-target').style.display = 'none';
        document.getElementById('tw-noclick-remaining').display = 'none';
        
        updateStatus('Timer stopped');
    }
    
    function updateStatus(message) {
        document.getElementById('tw-noclick-status').textContent = `Status: ${message}`;
        console.log('Status:', message);
    }
    
    // Export for manual testing
    window.testNoClickTimer = function(hours = 6) {
        const serverTime = getServerTime();
        const latency = getLatency();
        const current = new Date(serverTime.getTime() + latency);
        const target = new Date(current.getTime() + (hours * 60 * 60 * 1000));
        
        document.getElementById('tw-noclick-input').value = formatTime(target);
        startNoClickTimer();
    };
    
    console.log('No-Click Timer v5.0 ready. Use testNoClickTimer(6) to test +6 hours.');
    
    init();
    
})();
