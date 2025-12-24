// ==UserScript==
// @name         Tribal Wars Server Time Capture
// @namespace    http://tampermonkey.net/
// @version      12.0
// @description  Capture server time with milliseconds precision
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=== SERVER TIME CAPTURE v12.0 ===');
    
    const CONFIG = {
        defaultUpdateInterval: 50,
        calibrationSamples: 10,
        calibrationTime: 10000, // 10 seconds max
        safetyOffset: 50
    };
    
    let state = {
        running: false,
        targetTime: null,
        startTime: null,
        timerId: null,
        serverTimeOffset: 0,     // Server time - local time offset
        serverUpdateInterval: 1000, // How often server updates (1 second)
        lastServerUpdate: 0,
        calibrationComplete: false,
        calibrationData: [],
        displayUpdateId: null
    };
    
    function init() {
        setTimeout(() => {
            const attackBtn = document.querySelector('#troop_confirm_submit');
            if (!attackBtn) {
                setTimeout(init, 1000);
                return;
            }
            
            if (document.getElementById('tw-server-timer')) return;
            
            addServerTimerUI(attackBtn);
        }, 1000);
    }
    
    function addServerTimerUI(attackBtn) {
        const current = getEstimatedServerTime();
        
        const div = document.createElement('div');
        div.id = 'tw-server-timer';
        div.innerHTML = `
            <div style="background:#000;border:3px solid #00ffff;padding:20px;margin:20px 0;color:#fff;">
                <h3 style="color:#00ffff;margin:0 0 15px 0;">🕒 SERVER TIME CAPTURE v12.0</h3>
                
                <div id="tw-calibration-status" style="
                    padding:15px;
                    background:#002;
                    border:2px solid #00aaff;
                    margin-bottom:20px;
                    color:#00ffff;
                    display:none;
                ">
                    🔄 Calibrating server time...
                </div>
                
                <div style="margin-bottom:20px;">
                    <div style="color:#8af;margin-bottom:8px;">🎯 Target Server Time:</div>
                    <input type="text" id="tw-target-input" value="${formatTime(current)}"
                           style="width:100%;padding:12px;background:#222;border:2px solid #00aaff;color:#fff;font-family:monospace;font-size:16px;">
                    <div style="color:#666;font-size:12px;margin-top:5px;">
                        Format: HH:MM:SS:mmm (server time)
                    </div>
                </div>
                
                <div style="margin-bottom:20px;">
                    <div style="color:#8af;margin-bottom:8px;">🔄 Update Display (ms):</div>
                    <input type="number" id="tw-update-input" value="50" min="10" max="1000"
                           style="width:100%;padding:12px;background:#222;border:1px solid #444;color:#fff;">
                </div>
                
                <button id="tw-calibrate-btn" style="
                    width:100%;padding:14px;background:#00aaff;color:#000;border:none;font-weight:bold;margin-bottom:10px;">
                    🔄 Calibrate Server Time First
                </button>
                
                <button id="tw-start-btn" style="
                    width:100%;padding:14px;background:#00ff00;color:#000;border:none;font-weight:bold;margin-bottom:10px;display:none;">
                    🚀 Start Attack Timer
                </button>
                
                <button id="tw-stop-btn" style="
                    width:100%;padding:14px;background:#ff4444;color:#fff;border:none;font-weight:bold;margin-bottom:10px;display:none;">
                    ⏹️ Stop Timer
                </button>
                
                <div id="tw-status" style="padding:15px;background:#112;margin:15px 0;color:#0af;">
                    ⚠️ Need to calibrate server time first!
                </div>
                
                <div style="background:#001;padding:20px;border:2px solid #005;">
                    <div id="tw-server-display" style="color:#00ffff;font-family:monospace;font-size:20px;font-weight:bold;margin-bottom:15px;">
                        Server: ${formatTime(current)}
                    </div>
                    <div id="tw-target-display" style="color:#ffaa00;font-family:monospace;font-size:18px;margin-bottom:15px;display:none;">
                        Target: <span id="tw-target-text">--:--:--:---</span>
                    </div>
                    <div id="tw-remaining-display" style="color:#00ff00;font-family:monospace;font-size:18px;display:none;">
                        Remaining: <span id="tw-remaining-text">0ms</span>
                    </div>
                    <div id="tw-debug-info" style="color:#888;font-family:monospace;font-size:12px;margin-top:10px;">
                        Offset: <span id="tw-offset">0</span>ms | Last update: <span id="tw-last-update">0</span>ms ago
                    </div>
                </div>
            </div>
        `;
        
        attackBtn.parentNode.insertBefore(div, attackBtn.nextSibling);
        
        document.getElementById('tw-calibrate-btn').addEventListener('click', calibrateServerTime);
        document.getElementById('tw-start-btn').addEventListener('click', startServerTimer);
        document.getElementById('tw-stop-btn').addEventListener('click', stopServerTimer);
        
        // Start calibration automatically
        setTimeout(calibrateServerTime, 1000);
    }
    
    // Get server time from HTML element
    function getServerTimeFromElement() {
        const el = document.querySelector('#serverTime');
        if (!el) return null;
        
        const text = el.textContent || '00:00:00';
        const parts = text.split(':').map(Number);
        
        // Create date with current day
        const date = new Date();
        date.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
        
        return date;
    }
    
    // Get estimated server time with milliseconds
    function getEstimatedServerTime() {
        if (!state.calibrationComplete) {
            // Not calibrated yet, use rough estimate
            const serverTime = getServerTimeFromElement();
            if (!serverTime) return new Date();
            
            // Add estimated milliseconds based on local time
            const now = new Date();
            serverTime.setMilliseconds(now.getMilliseconds());
            return serverTime;
        }
        
        // Calibrated: server time = local time + offset
        const now = new Date();
        return new Date(now.getTime() + state.serverTimeOffset);
    }
    
    // Calibrate server time by watching for updates
    function calibrateServerTime() {
        console.log('=== CALIBRATING SERVER TIME ===');
        
        const calibrateBtn = document.getElementById('tw-calibrate-btn');
        const statusEl = document.getElementById('tw-status');
        const calibrationStatus = document.getElementById('tw-calibration-status');
        
        calibrateBtn.disabled = true;
        calibrateBtn.textContent = '🔄 Calibrating...';
        calibrationStatus.style.display = 'block';
        statusEl.textContent = '🔄 Calibrating server time...';
        
        state.calibrationData = [];
        let samplesCollected = 0;
        
        // Watch for server time updates
        const serverEl = document.querySelector('#serverTime');
        if (!serverEl) {
            statusEl.textContent = '❌ No server time element found!';
            return;
        }
        
        let lastServerText = serverEl.textContent;
        let lastUpdateTime = Date.now();
        
        // Create a MutationObserver to watch for text changes
        const observer = new MutationObserver((mutations) => {
            const now = Date.now();
            const serverTime = getServerTimeFromElement();
            
            if (serverTime) {
                // Calculate offset: server time - local time
                const localTime = new Date(now);
                const offset = serverTime.getTime() - localTime.getTime();
                
                state.calibrationData.push({
                    time: now,
                    offset: offset,
                    serverTime: serverTime.getTime()
                });
                
                samplesCollected++;
                
                // Update display
                calibrationStatus.innerHTML = `
                    🔄 Calibrating... ${samplesCollected}/${CONFIG.calibrationSamples} samples<br>
                    Offset: ${Math.round(offset)}ms
                `;
                
                // Calculate average offset so far
                const avgOffset = state.calibrationData.reduce((sum, d) => sum + d.offset, 0) / samplesCollected;
                state.serverTimeOffset = avgOffset;
                
                // Update display with estimated server time
                updateServerDisplay();
                
                if (samplesCollected >= CONFIG.calibrationSamples) {
                    finishCalibration();
                }
            }
        });
        
        // Start observing
        observer.observe(serverEl, {
            characterData: true,
            childList: true,
            subtree: true
        });
        
        // Also force update by checking every 100ms
        const interval = setInterval(() => {
            const currentText = serverEl.textContent;
            if (currentText !== lastServerText) {
                lastServerText = currentText;
                // MutationObserver will handle it
            }
            
            // Timeout after max time
            if (Date.now() - lastUpdateTime > CONFIG.calibrationTime) {
                clearInterval(interval);
                observer.disconnect();
                
                if (samplesCollected > 0) {
                    finishCalibration();
                } else {
                    statusEl.textContent = '❌ Calibration failed - no updates detected';
                    calibrateBtn.disabled = false;
                    calibrateBtn.textContent = '🔄 Retry Calibration';
                    calibrationStatus.style.display = 'none';
                }
            }
        }, 100);
        
        function finishCalibration() {
            clearInterval(interval);
            observer.disconnect();
            
            // Calculate final average
            const avgOffset = state.calibrationData.reduce((sum, d) => sum + d.offset, 0) / samplesCollected;
            state.serverTimeOffset = avgOffset;
            state.calibrationComplete = true;
            
            console.log('Calibration complete:', {
                samples: samplesCollected,
                avgOffset: avgOffset,
                data: state.calibrationData
            });
            
            // Update UI
            calibrateBtn.style.display = 'none';
            document.getElementById('tw-start-btn').style.display = 'block';
            calibrationStatus.style.display = 'none';
            statusEl.textContent = '✅ Calibration complete! Offset: ' + Math.round(avgOffset) + 'ms';
            
            // Start regular display updates
            startDisplayUpdates();
        }
    }
    
    function startDisplayUpdates() {
        const updateInterval = parseInt(document.getElementById('tw-update-input').value, 10) || 50;
        
        if (state.displayUpdateId) {
            clearInterval(state.displayUpdateId);
        }
        
        state.displayUpdateId = setInterval(updateServerDisplay, updateInterval);
    }
    
    function updateServerDisplay() {
        const serverTime = getEstimatedServerTime();
        document.getElementById('tw-server-display').textContent = `Server: ${formatTime(serverTime)}`;
        
        // Update debug info
        const now = new Date();
        const offset = state.serverTimeOffset;
        document.getElementById('tw-offset').textContent = Math.round(offset);
        document.getElementById('tw-last-update').textContent = Date.now() - state.lastServerUpdate;
        
        // Update target time input if empty
        const targetInput = document.getElementById('tw-target-input');
        if (!targetInput.value || targetInput.value === '00:00:00:000') {
            targetInput.value = formatTime(serverTime);
        }
        
        // If timer is running, update remaining time
        if (state.running && state.startTime) {
            const remaining = state.startTime.getTime() - serverTime.getTime();
            document.getElementById('tw-remaining-text').textContent = `${remaining}ms`;
            
            // Color code
            const el = document.getElementById('tw-remaining-text');
            if (remaining > 10000) el.style.color = '#00ff00';
            else if (remaining > 2000) el.style.color = '#ffff00';
            else if (remaining > 500) el.style.color = '#ff8800';
            else {
                el.style.color = '#ff0000';
                el.style.fontWeight = 'bold';
            }
            
            // Check for execution
            if (remaining <= CONFIG.safetyOffset) {
                executeServerAttack();
            }
        }
    }
    
    function startServerTimer() {
        if (!state.calibrationComplete) {
            updateStatus('Need calibration first!', 'error');
            return;
        }
        
        const targetInput = document.getElementById('tw-target-input').value;
        const parts = targetInput.split(':');
        
        if (parts.length < 3) {
            updateStatus('Invalid time format!', 'error');
            return;
        }
        
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const s = parseInt(parts[2], 10) || 0;
        const ms = parts[3] ? parseInt(parts[3], 10) || 0 : 0;
        
        // Get current server time
        const currentServerTime = getEstimatedServerTime();
        
        // Create target in server time
        const target = new Date(currentServerTime);
        target.setHours(h, m, s, ms);
        
        // If target is in past, add 1 day
        if (target <= currentServerTime) {
            target.setDate(target.getDate() + 1);
        }
        
        // Calculate start time: target - safety offset
        const latency = getLatency();
        const startTime = new Date(target.getTime() - latency - CONFIG.safetyOffset);
        
        const remaining = startTime.getTime() - currentServerTime.getTime();
        
        if (remaining < 1000) {
            updateStatus('Target time too close!', 'error');
            return;
        }
        
        // Update state
        state.running = true;
        state.targetTime = target;
        state.startTime = startTime;
        
        // Update UI
        document.getElementById('tw-start-btn').style.display = 'none';
        document.getElementById('tw-stop-btn').style.display = 'block';
        document.getElementById('tw-target-display').style.display = 'block';
        document.getElementById('tw-remaining-display').style.display = 'block';
        
        document.getElementById('tw-target-text').textContent = formatTime(target);
        
        updateStatus(`✅ Timer started! Clicking in ${Math.round(remaining/1000)}s`, 'success');
        
        console.log('Timer started:', {
            current: formatTime(currentServerTime),
            target: formatTime(target),
            start: formatTime(startTime),
            remaining: remaining
        });
    }
    
    function executeServerAttack() {
        console.log('=== EXECUTING SERVER ATTACK ===');
        
        stopServerTimer();
        
        const attackBtn = document.querySelector('#troop_confirm_submit');
        if (!attackBtn) {
            updateStatus('No attack button!', 'error');
            return;
        }
        
        // Log exact timing
        const serverTime = getEstimatedServerTime();
        console.log('Executing at server time:', formatTime(serverTime));
        console.log('Target was:', formatTime(state.targetTime));
        
        updateStatus('✅ Executing attack...', 'success');
        
        // Small delay to ensure timing
        setTimeout(() => {
            attackBtn.click();
        }, Math.max(0, CONFIG.safetyOffset - 10));
    }
    
    function stopServerTimer() {
        state.running = false;
        
        if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
        
        document.getElementById('tw-start-btn').style.display = 'block';
        document.getElementById('tw-stop-btn').style.display = 'none';
        document.getElementById('tw-target-display').style.display = 'none';
        document.getElementById('tw-remaining-display').style.display = 'none';
        
        updateStatus('Timer stopped', 'info');
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
    
    function updateStatus(msg, type) {
        const el = document.getElementById('tw-status');
        if (!el) return;
        
        el.textContent = msg;
        el.style.color = 
            type === 'error' ? '#ff4444' :
            type === 'warning' ? '#ffff00' :
            type === 'success' ? '#00ff00' : '#00aaff';
    }
    
    // Test function
    window.testServerTimer = function(minutes = 1) {
        const serverTime = getEstimatedServerTime();
        const target = new Date(serverTime.getTime() + (minutes * 60 * 1000));
        
        document.getElementById('tw-target-input').value = formatTime(target);
        
        if (state.calibrationComplete) {
            startServerTimer();
        } else {
            calibrateServerTime();
        }
    };
    
    console.log('Server Time Capture v12.0 ready.');
    console.log('Will auto-calibrate. Use testServerTimer(1) to test 1-minute timer.');
    
    init();
    
})();
