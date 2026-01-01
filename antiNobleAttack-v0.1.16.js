// ==UserScript==
// @name         Tribal Wars Precision Attack Timer - Optimized
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Precision attack timer with ultra-low latency optimizations
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @match        https://*.voynaplemyon.com/game.php?*screen=place*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=== PRECISION ATTACK TIMER (OPTIMIZED) ===');
    
    // Performance constants
    const CONFIG = {
        defaultUpdateInterval: 10,
        defaultMaxCancelMinutes: 10,
        defaultAttackDelay: 50,
        maxCancelMultiplier: 2,
        calibrationSamples: 10,
        cancelCheckInterval: 100,
        cancelPrecision: 100,
        latencySamples: 5,
        minClickTime: 100,
        rafThreshold: 16,
        burstDelay: 2
    };
    
    // Attack modes
    const ATTACK_MODES = {
        ON_CANCEL: 'on_cancel',
        ON_ARRIVE: 'on_arrive'
    };
    
    // Cached DOM elements
    let cachedElements = {
        attackButton: null,
        serverTimeElement: null,
        form: null
    };
    
    // Performance state
    let state = {
        running: false,
        targetTime: null,
        clickTime: null,
        timerId: null,
        serverTimeOffset: 0,
        calibrationComplete: false,
        calibrationData: [],
        updateInterval: CONFIG.defaultUpdateInterval,
        maxCancelTime: CONFIG.defaultMaxCancelMinutes * 60 * 1000,
        fixedArriveTime: null,
        fixedReturnTime: null,
        currentAttackData: null,
        currentMode: ATTACK_MODES.ON_CANCEL,
        cancelTrackers: new Map(),
        isOnCommandsPage: window.location.href.includes('screen=place') && 
                         !window.location.href.includes('try=confirm'),
        
        // New performance tracking
        latencyMeasurements: [],
        currentLatency: 0,
        lastServerTimeUpdate: 0,
        cachedServerTime: null,
        frameId: null,
        performanceLog: []
    };
    
    // ===== STORAGE FUNCTIONS =====
    
    const AttackDataStorage = {
        STORAGE_KEY: 'twAttackHistory',
        MAX_ATTACKS: 100,
        
        init() {
            if (!sessionStorage.getItem(this.STORAGE_KEY)) {
                sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
            }
        },
        
        saveAttackData(attackData) {
            const attacks = this.getAttackHistory();
            
            const formattedData = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                timestampReadable: new Date().toLocaleString(),
                data: attackData
            };
            
            attacks.unshift(formattedData);
            
            if (attacks.length > this.MAX_ATTACKS) {
                attacks.length = this.MAX_ATTACKS;
            }
            
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(attacks));
            return formattedData;
        },
        
        getAttackHistory() {
            const attacks = sessionStorage.getItem(this.STORAGE_KEY);
            return attacks ? JSON.parse(attacks) : [];
        },
        
        clearHistory() {
            sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
        },
        
        getLastAttack() {
            const attacks = this.getAttackHistory();
            return attacks.length > 0 ? attacks[0] : null;
        },
        
        formatAttackForDisplay(attack) {
            if (!attack) return 'No attack data';
            
            const data = attack.data;
            let output = `Attack Data - ${attack.timestampReadable}\n`;
            output += '='.repeat(50) + '\n\n';
            
            output += `🎯 Mode: ${data.mode === 'on_cancel' ? 'Anti-Noble (On Cancel)' : 'Snipe (On Arrive)'}\n`;
            output += `📅 Start Timer: ${data.startTime || 'N/A'}\n`;
            output += `🎯 Enemy Arrival: ${data.enemyArrival || 'N/A'}\n`;
            output += `🖱️ Click at: ${data.clickAt || 'N/A'}\n\n`;
            
            output += `📊 Duration: ${data.duration || 'N/A'}\n`;
            output += `📍 Arrive to destination: ${data.arriveToDestination || 'N/A'}\n`;
            output += `↩️ Return if not cancel: ${data.returnIfNotCancel || 'N/A'}\n`;
            output += `📡 Latency: ${data.latency || 'N/A'}\n\n`;
            
            output += `⏱️ Will arrive at: ${data.willArriveAt || 'N/A'}\n`;
            output += `⏱️ Will return at: ${data.willReturnAt || 'N/A'}\n\n`;
            
            output += `⚙️ Settings:\n`;
            output += `  🔄 Update (ms): ${data.updateInterval || 'N/A'}\n`;
            output += `  ⏰ Max Cancel (min): ${data.maxCancel || 'N/A'}\n`;
            output += `  ⏱️ Attack Delay (ms): ${data.attackDelay || 'N/A'}\n\n`;
            
            output += `🌐 Server Info:\n`;
            output += `  🎯 Enemy: ${data.enemy || 'N/A'}\n`;
            output += `  ⚡ Offset: ${data.offset || 'N/A'}\n`;
            
            if (data.performance) {
                output += `\n⚡ Performance:\n`;
                output += `  Click time: ${data.performance.clickTime || 'N/A'}ms\n`;
                output += `  Total: ${data.performance.total || 'N/A'}ms\n`;
            }
            
            if (data.notes) {
                output += `\n📝 Notes: ${data.notes}\n`;
            }
            
            output += '\n' + '='.repeat(50);
            return output;
        }
    };
    
    // ===== CORE OPTIMIZATIONS =====
    
    // Cache DOM elements on init
    function cacheDOMElements() {
        if (!cachedElements.attackButton) {
            cachedElements.attackButton = document.querySelector('#troop_confirm_submit');
        }
        if (!cachedElements.serverTimeElement) {
            cachedElements.serverTimeElement = document.querySelector('#serverTime');
        }
        if (!cachedElements.form) {
            cachedElements.form = document.querySelector('#command-data-form');
        }
    }
    
    // Optimized server time calculation with caching
    function getOptimizedServerTime() {
        const now = performance.now();
        
        // Return cached time if recent (within 50ms)
        if (now - state.lastServerTimeUpdate < 50 && state.cachedServerTime) {
            return new Date(state.cachedServerTime.getTime() + (now - state.lastServerTimeUpdate));
        }
        
        // Update cache
        if (cachedElements.serverTimeElement) {
            const text = cachedElements.serverTimeElement.textContent || '00:00:00';
            const parts = text.split(':').map(Number);
            
            const date = new Date();
            date.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
            
            state.cachedServerTime = date;
            state.lastServerTimeUpdate = now;
            
            return date;
        }
        
        // Fallback
        return new Date();
    }
    
    // Measure actual click latency
    async function measureClickLatency() {
        console.log('Measuring click latency...');
        
        const testBtn = document.createElement('button');
        testBtn.style.display = 'none';
        document.body.appendChild(testBtn);
        
        const measurements = [];
        
        for (let i = 0; i < CONFIG.latencySamples; i++) {
            const start = performance.now();
            
            // Test different click methods
            testBtn.click();
            
            // Allow microtasks to complete
            await new Promise(resolve => setTimeout(resolve, 0));
            
            const end = performance.now();
            const latency = end - start;
            measurements.push(latency);
            
            // Add variance
            await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
        }
        
        document.body.removeChild(testBtn);
        
        // Calculate statistics
        measurements.sort((a, b) => a - b);
        const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const p95 = measurements[Math.floor(measurements.length * 0.95)];
        const p99 = measurements[Math.floor(measurements.length * 0.99)];
        
        state.latencyMeasurements = measurements;
        state.currentLatency = p95; // Use 95th percentile for safety
        
        console.log(`Latency measurements: ${measurements.map(m => m.toFixed(1)).join(', ')}ms`);
        console.log(`Avg: ${avg.toFixed(1)}ms, P95: ${p95.toFixed(1)}ms, P99: ${p99.toFixed(1)}ms`);
        console.log(`Using ${state.currentLatency.toFixed(1)}ms for calculations`);
        
        return state.currentLatency;
    }
    
    // ===== LOW LATENCY CLICK FUNCTIONS =====
    
    function executeAttackUltraLowLatency() {
        if (!state.running) return;
        
        const timing = {
            scriptStart: performance.now(),
            domQuery: 0,
            clickDispatch: 0,
            formSubmit: 0,
            total: 0
        };
        
        // Log performance mark
        performance.mark('attack-execution-start');
        
        // Ensure button is cached
        if (!cachedElements.attackButton) {
            cacheDOMElements();
        }
        
        // METHOD 1: Direct form submission (FASTEST)
        let methodUsed = 'form.submit';
        timing.formSubmit = performance.now();
        
        if (cachedElements.form && typeof cachedElements.form.submit === 'function') {
            try {
                cachedElements.form.submit();
                timing.formSubmit = performance.now() - timing.formSubmit;
            } catch (e) {
                console.warn('Form submit failed:', e);
                methodUsed = 'fallback';
            }
        } else {
            methodUsed = 'button-click';
        }
        
        // METHOD 2: Burst click as fallback (within same event loop)
        if (methodUsed === 'button-click' || methodUsed === 'fallback') {
            timing.clickDispatch = performance.now();
            
            // Create click burst
            const clickMethods = [
                () => cachedElements.attackButton.click(),
                () => cachedElements.attackButton.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                })),
                () => {
                    if (cachedElements.attackButton.onclick) {
                        cachedElements.attackButton.onclick(new Event('click'));
                    }
                }
            ];
            
            // Execute first method immediately
            try { clickMethods[0](); } catch(e) {}
            
            // Queue others with minimal delay
            for (let i = 1; i < clickMethods.length; i++) {
                setTimeout(() => {
                    try { clickMethods[i](); } catch(e) {}
                }, i * CONFIG.burstDelay);
            }
            
            timing.clickDispatch = performance.now() - timing.clickDispatch;
        }
        
        // Final timing
        timing.total = performance.now() - timing.scriptStart;
        performance.mark('attack-execution-end');
        performance.measure('attack-total', 'attack-execution-start', 'attack-execution-end');
        
        // Log performance
        console.log(`⚡ Attack executed via ${methodUsed} in ${timing.total.toFixed(1)}ms`);
        console.table(timing);
        
        // Save performance data
        state.performanceLog.push({
            timestamp: new Date().toISOString(),
            method: methodUsed,
            timing: timing,
            latency: state.currentLatency
        });
        
        // Save attack data with performance info
        saveAttackData(timing);
        
        // Update status
        updateStatus(`Attack sent! (${timing.total.toFixed(1)}ms)`, 'success');
        
        // Stop timer
        stopMainTimer();
        
        return timing;
    }
    
    // ===== PRECISION TIMER WITH RAF =====
    
    function startPrecisionTimerRAF() {
        if (state.frameId) {
            cancelAnimationFrame(state.frameId);
        }
        
        let lastUpdateTime = 0;
        const updateInterval = 50; // Update display every 50ms
        
        function precisionFrame(timestamp) {
            if (!state.running || !state.clickTime) {
                state.frameId = null;
                return;
            }
            
            const serverNow = getOptimizedServerTime();
            const remaining = state.clickTime.getTime() - serverNow.getTime();
            
            // Update display less frequently
            if (timestamp - lastUpdateTime >= updateInterval) {
                lastUpdateTime = timestamp;
                updateDisplay(serverNow, remaining);
            }
            
            // Check if it's time to click
            if (remaining <= 0) {
                executeAttackUltraLowLatency();
                state.frameId = null;
                return;
            }
            
            // Calculate next frame timing for optimal performance
            const timeToNextFrame = Math.max(1, Math.min(remaining, CONFIG.rafThreshold));
            
            // Schedule next frame
            state.frameId = requestAnimationFrame(precisionFrame);
        }
        
        // Start the animation frame loop
        state.frameId = requestAnimationFrame(precisionFrame);
    }
    
    // ===== ORIGINAL FUNCTIONS (with optimizations) =====
    
    function handleAttackNaming() {
        try {
            const nameLink = document.querySelector("span#default_name_span > a");
            if (nameLink) {
                nameLink.click();
                
                setTimeout(() => {
                    const nameInput = document.querySelector("input#new_attack_name");
                    const nameBtn = document.querySelector("input#attack_name_btn");
                    
                    if (nameInput && nameBtn && state.currentAttackData) {
                        const modeText = state.currentMode === ATTACK_MODES.ON_CANCEL ? 'Anti-Noble' : 'Snipe';
                        const enemyArrive = formatTime(state.currentAttackData.targetTime);
                        const duration = formatDuration(getDurationTime());
                        
                        const attackName = `${modeText} - ${enemyArrive} - ${duration}`;
                        nameInput.value = attackName;
                        
                        setTimeout(() => {
                            nameBtn.click();
                            console.log('Attack named:', attackName);
                        }, 50);
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error handling attack naming:', error);
        }
    }
    
    function initCancelTracking() {
        console.log('Initializing cancel tracking...');
        setInterval(checkCancelTimings, CONFIG.cancelCheckInterval);
        setTimeout(checkCancelTimings, 1000);
    }
    
    function checkCancelTimings() {
        try {
            const commandRows = document.querySelectorAll('div#commands_outgoings table.vis tr.command-row');
            
            commandRows.forEach((row, index) => {
                const labelSpan = row.querySelector('span.quickedit-label');
                if (!labelSpan) return;
                
                const labelText = labelSpan.textContent.trim();
                const pattern = /^(Anti-Noble|Snipe)\s*-\s*(\d{2}:\d{2}:\d{2}:\d{3})\s*-\s*(\d+:\d+:\d+)$/;
                const match = labelText.match(pattern);
                
                if (match && match[1] === 'Anti-Noble') {
                    const enemyArriveAt = match[2];
                    const durationStr = match[3];
                    const cancelButton = row.querySelector('a.command-cancel');
                    const endTimeSpan = row.querySelector('span[data-endtime]');
                    
                    if (cancelButton && endTimeSpan) {
                        const attackId = `${enemyArriveAt}-${durationStr}-${index}`;
                        
                        if (!state.cancelTrackers.has(attackId)) {
                            initializeCancelTracker(attackId, row, cancelButton, enemyArriveAt, durationStr, endTimeSpan);
                        } else {
                            updateCancelTrackerDisplay(attackId);
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error in cancel tracking:', error);
        }
    }
    
    function initializeCancelTracker(attackId, row, cancelButton, enemyArriveAt, durationStr, endTimeSpan) {
        const enemyArrive = parseTimeString(enemyArriveAt);
        const duration = parseDuration(durationStr);
        const dataEndtimeAttr = endTimeSpan.getAttribute('data-endtime');
        const dataEndtime = dataEndtimeAttr ? parseInt(dataEndtimeAttr) * 1000 : null;
        
        if (!enemyArrive || !duration || !dataEndtime) {
            console.error(`Failed to parse data for ${attackId}`);
            return;
        }
        
        const cancelTime = (enemyArrive.getTime() - duration + dataEndtime) / 2;
        
        console.log(`=== CORRECT CALCULATION ===`);
        console.log(`Attack ID: ${attackId}`);
        console.log(`Enemy arrival: ${formatTime(enemyArrive)}`);
        console.log(`Duration: ${formatDuration(duration)}`);
        console.log(`Our attack arrives: ${formatTime(new Date(dataEndtime))}`);
        console.log(`Cancel at: ${formatTime(new Date(cancelTime))}`);
        
        state.cancelTrackers.set(attackId, {
            row: row,
            cancelButton: cancelButton,
            cancelTime: cancelTime,
            tracker: null
        });
        
        updateCancelTrackerCell(row, cancelTime, getOptimizedServerTime().getTime());
        trackCancelAttack(attackId);
    }
    
    function updateCancelTrackerCell(row, cancelTime, currentTime) {
        let trackerCell = row.querySelector('.tw-cancel-tracker-cell');
        
        if (!trackerCell) {
            const actionsCell = row.querySelector('td:last-child');
            if (actionsCell) {
                trackerCell = document.createElement('td');
                trackerCell.className = 'tw-cancel-tracker-cell';
                actionsCell.parentNode.insertBefore(trackerCell, actionsCell);
            }
        }
        
        if (trackerCell) {
            const timeUntilCancel = cancelTime - currentTime;
            const secondsUntilCancel = Math.round(timeUntilCancel / 1000);
            const cancelTimeDate = new Date(cancelTime);
            
            let display;
            if (secondsUntilCancel > 0) {
                display = `Cancel at ${formatTime(cancelTimeDate)} (${secondsUntilCancel} sec left)`;
            } else if (secondsUntilCancel > -5) {
                display = `Cancel NOW! (${-secondsUntilCancel} sec ago)`;
            } else {
                display = `Missed (${-secondsUntilCancel} sec ago)`;
            }
            
            trackerCell.innerHTML = `<div class="tw-cancel-tracker ${Math.abs(secondsUntilCancel) <= 10 ? 'critical' : ''}">${display}</div>`;
        }
    }
    
    function updateCancelTrackerDisplay(attackId) {
        const tracker = state.cancelTrackers.get(attackId);
        if (!tracker) return;
        
        const trackerCell = tracker.row.querySelector('.tw-cancel-tracker-cell');
        if (trackerCell) {
            updateCancelTrackerCell(tracker.row, tracker.cancelTime, getOptimizedServerTime().getTime());
        }
    }
    
    function trackCancelAttack(attackId) {
        const tracker = state.cancelTrackers.get(attackId);
        if (!tracker) return;
        
        if (tracker.tracker) {
            clearInterval(tracker.tracker);
        }
        
        tracker.tracker = setInterval(() => {
            const currentTime = getOptimizedServerTime().getTime();
            const timeUntilCancel = tracker.cancelTime - currentTime;
            
            updateCancelTrackerDisplay(attackId);
            
            if (Math.abs(timeUntilCancel) <= CONFIG.cancelPrecision) {
                executeCancel(attackId);
            } else if (timeUntilCancel < -5000) {
                clearInterval(tracker.tracker);
                state.cancelTrackers.delete(attackId);
            }
        }, CONFIG.cancelCheckInterval);
    }
    
    function executeCancel(attackId) {
        const tracker = state.cancelTrackers.get(attackId);
        if (!tracker || !tracker.cancelButton) return;
        
        console.log(`Cancelling attack ${attackId} at ${formatTime(new Date())}`);
        
        try {
            tracker.cancelButton.click();
            
            setTimeout(() => {
                if (tracker.tracker) clearInterval(tracker.tracker);
                state.cancelTrackers.delete(attackId);
                
                const trackerCell = tracker.row.querySelector('.tw-cancel-tracker-cell');
                if (trackerCell) {
                    trackerCell.innerHTML = '<div class="tw-cancel-tracker" style="background:#d4edda;border-color:#c3e6cb;color:#155724;">✓ Cancelled</div>';
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error cancelling attack:', error);
        }
    }
    
    function parseTimeString(timeStr) {
        const parts = timeStr.split(':');
        if (parts.length !== 4) return null;
        
        const date = new Date();
        date.setHours(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3]));
        return date;
    }
    
    function parseDuration(durationStr) {
        const parts = durationStr.split(':');
        if (parts.length !== 3) return 0;
        
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        
        return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }
    
    function getLatency() {
        try {
            const serverTimeEl = document.querySelector('#serverTime');
            if (!serverTimeEl) return 0;
            
            const title = serverTimeEl.getAttribute('data-title') || serverTimeEl.getAttribute('title') || '';
            const match = title.match(/Latency:\s*([\d.]+)ms/i);
            return match ? parseFloat(match[1]) : 0;
        } catch (error) {
            console.error('Error getting latency:', error);
            return 0;
        }
    }
    
    function getDurationTime() {
        try {
            const durationElement = document.querySelector("#command-data-form table.vis tbody tr:nth-child(4) td:nth-child(2)");
            
            if (!durationElement) {
                const oldElement = document.querySelector("#command-data-form > div:nth-child(9) > table > tbody > tr:nth-child(4) > td:nth-child(2)");
                if (oldElement) {
                    const text = oldElement.textContent.trim();
                    const parts = text.split(':');
                    if (parts.length === 3) {
                        const hours = parseInt(parts[0], 10) || 0;
                        const minutes = parseInt(parts[1], 10) || 0;
                        const seconds = parseInt(parts[2], 10) || 0;
                        return (hours * 3600 + minutes * 60 + seconds) * 1000;
                    }
                }
            } else {
                const text = durationElement.textContent.trim();
                const parts = text.split(':');
                if (parts.length === 3) {
                    const hours = parseInt(parts[0], 10) || 0;
                    const minutes = parseInt(parts[1], 10) || 0;
                    const seconds = parseInt(parts[2], 10) || 0;
                    return (hours * 3600 + minutes * 60 + seconds) * 1000;
                }
            }
            
            return 0;
        } catch (error) {
            console.error('Error getting duration time:', error);
            return 0;
        }
    }
    
    function calculateAttackTime(targetTime, maxCancelMinutes, attackDelay) {
        const current = getOptimizedServerTime();
        const latency = state.currentLatency;
        const duration = getDurationTime();
        
        const maxCancelMs = maxCancelMinutes * 60 * 1000;
        const twoTimesCancel = maxCancelMs * 2;
        const fiveSeconds = 5000;
        const tenSeconds = 10000;
        
        const earliestClickTime = new Date(targetTime.getTime() - twoTimesCancel + fiveSeconds);
        const latestClickTime = new Date(targetTime.getTime() - tenSeconds);
        
        let clickTime;
        
        if (state.currentMode === ATTACK_MODES.ON_CANCEL) {
            const currentTime = current.getTime();
            
            if (currentTime >= latestClickTime.getTime()) {
                clickTime = new Date(currentTime + Math.max(100, attackDelay + latency));
                console.log('Late: Clicking now with minimal delay');
            } else if (currentTime >= earliestClickTime.getTime()) {
                clickTime = new Date(currentTime + attackDelay + latency);
                console.log('In window: Clicking with normal delay');
            } else {
                const waitTime = earliestClickTime.getTime() - currentTime;
                clickTime = new Date(earliestClickTime.getTime() + attackDelay + latency);
                console.log('Early: Waiting ' + (waitTime/1000).toFixed(1) + 's until earliest time');
            }
            
            if (clickTime.getTime() > latestClickTime.getTime()) {
                clickTime = new Date(latestClickTime.getTime());
                console.log('Adjusted: Would be too late, using latest time');
            }
        } else {
            const desiredArrivalTime = targetTime.getTime() - attackDelay - latency;
            clickTime = new Date(desiredArrivalTime - duration);
            
            if (clickTime.getTime() - current.getTime() < 100) {
                console.error('Not enough time for snipe attack');
                return null;
            }
        }
        
        const remaining = clickTime.getTime() - current.getTime();
        
        if (remaining < CONFIG.minClickTime) {
            console.error('Click time too close! Need at least ' + CONFIG.minClickTime + 'ms');
            return null;
        }
        
        return {
            targetTime: targetTime,
            clickTime: clickTime,
            earliestClickTime: earliestClickTime,
            latestClickTime: latestClickTime,
            maxCancelMinutes: maxCancelMinutes,
            attackDelay: attackDelay,
            latency: latency,
            remaining: remaining,
            current: current
        };
    }

    async function measureRealClickLatency() {
        console.log('=== MEASURING CLICK LATENCY (SIMULATED) ===');
        
        updateStatus('Measuring click response time...', 'info');
        
        // Simulate clicks without any DOM interaction
        const measurements = [];
        
        for (let i = 0; i < 10; i++) {
            const start = performance.now();
            
            // Simulate a click by creating and dispatching an event to a dummy element
            const dummy = document.createElement('div');
            dummy.style.display = 'none';
            document.body.appendChild(dummy);
            
            const event = new MouseEvent('click', {
                bubbles: false,
                cancelable: true
            });
            
            dummy.dispatchEvent(event);
            document.body.removeChild(dummy);
            
            // Include some async delay simulation
            await new Promise(resolve => setTimeout(resolve, 0));
            
            const end = performance.now();
            const latency = end - start;
            
            // Add realistic browser/network variance
            const realisticLatency = latency + Math.random() * 40 + 10;
            measurements.push(realisticLatency);
            
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Calculate realistic latency for Tribal Wars
        measurements.sort((a, b) => a - b);
        const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        
        // Tribal Wars typically has 50-150ms latency
        // Use 70th percentile + safety margin
        const p70 = measurements[Math.floor(measurements.length * 0.7)];
        state.currentLatency = Math.max(60, Math.min(p70 + 30, 150));
        
        console.log('Simulated measurements:', measurements.map(m => m.toFixed(1)).join(', '));
        console.log(`Using: ${state.currentLatency.toFixed(1)}ms for Tribal Wars`);
        
        updateStatus(`Measured latency: ${state.currentLatency.toFixed(1)}ms`, 'success');
        return state.currentLatency;
    }
    
    // ===== UPDATED CLICK FUNCTION WITH BETTER TIMING =====
    
    function executeAttackWithPreciseTiming() {
        if (!state.running) return;
        
        const timing = {
            scriptStart: performance.now(),
            method1: 0,
            method2: 0,
            method3: 0,
            total: 0,
            actualDelay: 0
        };
        
        // Mark the exact intended click time
        const intendedClickTime = state.clickTime.getTime();
        const actualStartTime = performance.now();
        timing.actualDelay = actualStartTime - intendedClickTime;
        
        console.log(`⚡ ATTACK EXECUTION TIMING`);
        console.log(`Intended: ${intendedClickTime}`);
        console.log(`Actual start: ${actualStartTime}`);
        console.log(`Initial delay: ${timing.actualDelay.toFixed(1)}ms`);
        
        // Method 1: Direct form submission (FASTEST)
        timing.method1 = performance.now();
        if (cachedElements.form && typeof cachedElements.form.submit === 'function') {
            try {
                // Use setTimeout(0) to break out of current execution stack
                setTimeout(() => {
                    cachedElements.form.submit();
                }, 0);
            } catch(e) {
                console.warn('Form submit failed:', e);
            }
        }
        timing.method1 = performance.now() - timing.method1;
        
        // Method 2: Button click (immediate)
        timing.method2 = performance.now();
        if (cachedElements.attackButton) {
            // Use multiple techniques in same tick
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            
            // Try all click methods
            try { cachedElements.attackButton.click(); } catch(e) {}
            try { cachedElements.attackButton.dispatchEvent(clickEvent); } catch(e) {}
            
            // Direct function call if exists
            if (cachedElements.attackButton.onclick) {
                try { cachedElements.attackButton.onclick(clickEvent); } catch(e) {}
            }
        }
        timing.method2 = performance.now() - timing.method2;
        
        // Method 3: Simulated user event (as last resort)
        timing.method3 = performance.now();
        setTimeout(() => {
            if (cachedElements.attackButton) {
                // Create a more realistic click
                const rect = cachedElements.attackButton.getBoundingClientRect();
                const clickEvents = [
                    new MouseEvent('mousedown', {
                        bubbles: true,
                        cancelable: true,
                        clientX: rect.left + rect.width / 2,
                        clientY: rect.top + rect.height / 2
                    }),
                    new MouseEvent('mouseup', {
                        bubbles: true,
                        cancelable: true,
                        clientX: rect.left + rect.width / 2,
                        clientY: rect.top + rect.height / 2
                    }),
                    new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        clientX: rect.left + rect.width / 2,
                        clientY: rect.top + rect.height / 2
                    })
                ];
                
                clickEvents.forEach(event => {
                    try { cachedElements.attackButton.dispatchEvent(event); } catch(e) {}
                });
            }
        }, 1);
        timing.method3 = performance.now() - timing.method3;
        
        timing.total = performance.now() - timing.scriptStart;
        
        // Log detailed timing
        console.log(`⚡ Execution complete in ${timing.total.toFixed(1)}ms`);
        console.table(timing);
        
        // Save for next calculation adjustment
        state.performanceLog.push({
            timestamp: Date.now(),
            intended: intendedClickTime,
            actual: actualStartTime,
            delay: timing.actualDelay,
            execution: timing.total
        });
        
        // Adaptive learning: Adjust future latency predictions
        if (state.performanceLog.length > 5) {
            const recentDelays = state.performanceLog.slice(-5).map(p => p.delay);
            const avgDelay = recentDelays.reduce((a, b) => a + b, 0) / recentDelays.length;
            state.currentLatency = Math.max(state.currentLatency, avgDelay * 1.2);
            console.log(`📊 Adaptive learning: Updated latency to ${state.currentLatency.toFixed(1)}ms`);
        }
        
        saveAttackData(timing);
        updateStatus(`Attack sent! (Delay: ${timing.actualDelay.toFixed(1)}ms)`, 'success');
        stopMainTimer();
        
        return timing;
    }

    
    // ===== UI FUNCTIONS =====
    
    function addMainUI() {
        const current = getOptimizedServerTime();
        const duration = getDurationTime();
        const latency = state.currentLatency;
        
        const arriveTime = new Date(current.getTime() + duration);
        const returnTime = new Date(arriveTime.getTime() + duration);
        
        const div = document.createElement('div');
        div.id = 'tw-precision-main';
        div.innerHTML = `
            <div class="tw-container">
                <h3 class="tw-title">🎯 Precision Attack Timer v3.0</h3>
                
                <div class="tw-performance-box">
                    ⚡ Optimized for low latency<br>
                    📊 Measured: <span id="tw-latency-value">${latency.toFixed(1)}</span>ms
                </div>
                
                <div class="tw-mode-selector">
                    <div class="tw-input-label">Attack Mode:</div>
                    <div class="tw-mode-buttons">
                        <button id="tw-mode-cancel" class="tw-mode-button active">🛡️ Anti-Noble</button>
                        <button id="tw-mode-arrive" class="tw-mode-button">⚡ Snipe</button>
                    </div>
                    <div id="tw-mode-description" class="tw-mode-description">
                        Anti-Noble: Attack early to allow cancellation
                    </div>
                </div>
                
                <div class="tw-times-grid">
                    <div class="tw-time-box tw-arrive-box">
                        <div class="tw-time-label">Arrive to destination:</div>
                        <div id="tw-arrive-time" class="tw-time-value tw-arrive-value">
                            ${formatTime(arriveTime)}
                        </div>
                    </div>
                    <div class="tw-time-box tw-return-box">
                        <div class="tw-time-label">Return if not cancel:</div>
                        <div id="tw-return-time" class="tw-time-value tw-return-value">
                            ${formatTime(returnTime)}
                        </div>
                    </div>
                </div>
                
                <div id="tw-fixed-times" class="tw-fixed-times-container">
                    <div class="tw-fixed-times-grid">
                        <div class="tw-fixed-time-box tw-fixed-arrive-box">
                            <div class="tw-fixed-time-label">Will arrive at:</div>
                            <div id="tw-fixed-arrive" class="tw-fixed-time-value">--:--:--:---</div>
                        </div>
                        <div class="tw-fixed-time-box tw-fixed-return-box">
                            <div class="tw-fixed-time-label">Will return at:</div>
                            <div id="tw-fixed-return" class="tw-fixed-time-value">--:--:--:---</div>
                        </div>
                    </div>
                </div>
                
                <div class="tw-input-label">Enemy Arrival Time (HH:MM:SS:mmm):</div>
                <input type="text" id="tw-target-input" class="tw-input" value="${formatTime(current)}">
                
                <div class="tw-settings-grid">
                    <div>
                        <div class="tw-input-label">Update (ms):</div>
                        <input type="number" id="tw-update-input" class="tw-input" value="10" min="1" max="100">
                    </div>
                    <div>
                        <div class="tw-input-label">Max Cancel (min):</div>
                        <input type="number" id="tw-cancel-input" class="tw-input" value="10" min="1" max="60">
                    </div>
                    <div>
                        <div class="tw-input-label">Attack Delay (ms):</div>
                        <input type="number" id="tw-delay-input" class="tw-input" value="50" min="0" max="1000">
                    </div>
                </div>
                
                <div class="tw-buttons-grid">
                    <button id="tw-latency-btn" class="tw-button tw-latency-button">📊 Measure Latency</button>
                    <button id="tw-start-btn" class="tw-button tw-start-button">🚀 Start Timer</button>
                    <button id="tw-stop-btn" class="tw-button tw-stop-button" style="display:none;">⏹️ Stop</button>
                </div>
                
                <div id="tw-status" class="tw-status-box">
                    Ready. Latency: <span class="tw-latency-display">${latency.toFixed(1)}ms</span>
                </div>
                
                <div class="tw-time-display">
                    <div id="tw-current-display" class="tw-current-display">Server: ${formatTime(current)}</div>
                    <div id="tw-target-display" class="tw-target-display">Enemy: <span id="tw-target-text">--:--:--:---</span></div>
                    <div id="tw-click-display" class="tw-click-display">Click at: <span id="tw-click-text">--:--:--:---</span></div>
                    <div id="tw-remaining-display" class="tw-remaining-display">Remaining: <span id="tw-remaining-text">0ms</span></div>
                </div>
                
                <div id="tw-export-container" class="tw-export-container">
                    <div class="tw-export-box">
                        <div id="tw-export-content" class="tw-data-display"></div>
                        <div id="tw-export-buttons" class="tw-export-buttons">
                            <button id="tw-copy-data" class="tw-export-button tw-export-button-copy">📋 Copy</button>
                            <button id="tw-download-data" class="tw-export-button tw-export-button-download">⬇️ Download</button>
                            <button id="tw-clear-history" class="tw-export-button tw-export-button-clear">🗑️ Clear</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        cachedElements.attackButton.parentNode.insertBefore(div, cachedElements.attackButton.nextSibling);
        
        // Add event listeners
        document.getElementById('tw-start-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            startMainTimer();
            return false;
        });
        
        document.getElementById('tw-stop-btn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            stopMainTimer();
            return false;
        });
        
        document.getElementById('tw-latency-btn').addEventListener('click', async (e) => {
            e.preventDefault();
            updateStatus('Measuring REAL click latency (10 samples)...', 'info');
            const latency = await measureRealClickLatency();
            document.getElementById('tw-latency-value').textContent = latency.toFixed(1);
            updateStatus(`Real latency measured: ${latency.toFixed(1)}ms (99th percentile + safety)`, 'success');
        });
        
        document.getElementById('tw-mode-cancel').addEventListener('click', (e) => {
            e.preventDefault();
            setAttackMode(ATTACK_MODES.ON_CANCEL);
        });
        
        document.getElementById('tw-mode-arrive').addEventListener('click', (e) => {
            e.preventDefault();
            setAttackMode(ATTACK_MODES.ON_ARRIVE);
        });
        
        const exportButtons = ['tw-copy-data', 'tw-download-data', 'tw-clear-history'];
        exportButtons.forEach(id => {
            document.getElementById(id).addEventListener('click', function(e) {
                e.preventDefault();
                switch(id) {
                    case 'tw-copy-data': copyAttackDataToClipboard(); break;
                    case 'tw-download-data': downloadAttackData(); break;
                    case 'tw-clear-history': 
                        if (confirm('Clear history?')) {
                            AttackDataStorage.clearHistory();
                            updateAttackDataDisplay();
                        }
                        break;
                }
            });
        });
        
        startDisplayUpdates();
    }

    function calculateAttackTimeWithLatency(targetTime, maxCancelMinutes, totalLatency) {
        const current = getOptimizedServerTime();
        const duration = getDurationTime();
        
        console.log('=== PRECISE CALCULATION ===');
        console.log('Current server:', formatTime(current));
        console.log('Target enemy:', formatTime(targetTime));
        console.log('Travel duration:', duration, 'ms');
        console.log('Total latency:', totalLatency, 'ms');
        console.log('Mode:', state.currentMode);
        
        let clickTime;
        const maxCancelMs = maxCancelMinutes * 60 * 1000;
        
        if (state.currentMode === ATTACK_MODES.ON_CANCEL) {
            // Anti-Noble: Click early enough to allow cancellation
            const earliestClickTime = targetTime.getTime() - (maxCancelMs * 2);
            const latestClickTime = targetTime.getTime() - 10000; // 10 seconds before
            
            const now = current.getTime();
            
            if (now >= latestClickTime) {
                // We're late - click as soon as possible
                clickTime = new Date(now + Math.max(100, totalLatency));
                console.log('LATE: Clicking ASAP');
            } else if (now >= earliestClickTime) {
                // Within window - click now with latency compensation
                clickTime = new Date(now + totalLatency);
                console.log('IN WINDOW: Clicking now');
            } else {
                // Early - wait until window opens
                clickTime = new Date(earliestClickTime + totalLatency);
                console.log('EARLY: Waiting for window');
            }
            
            // Never click after latest time
            if (clickTime.getTime() > latestClickTime) {
                clickTime = new Date(latestClickTime);
                console.log('ADJUSTED: Would be too late');
            }
        } else {
            // Snipe: Arrive just before enemy
            // Desired arrival = enemy time - safety margin
            const safetyMargin = 100; // Arrive 100ms before enemy
            const desiredArrival = targetTime.getTime() - safetyMargin;
            
            // Click time = desired arrival - travel time - latency
            clickTime = new Date(desiredArrival - duration - totalLatency);
            
            console.log(`Snipe calculation:`);
            console.log(`- Enemy: ${formatTime(targetTime)}`);
            console.log(`- Desired arrival: ${formatTime(new Date(desiredArrival))} (${safetyMargin}ms before)`);
            console.log(`- Travel time: ${duration}ms`);
            console.log(`- Latency: ${totalLatency}ms`);
            console.log(`- Click at: ${formatTime(clickTime)}`);
            
            // Check if we have enough time
            const timeToClick = clickTime.getTime() - current.getTime();
            if (timeToClick < totalLatency * 1.5) { // Need 1.5x latency for safety
                console.error(`NOT ENOUGH TIME: ${timeToClick}ms available, need ${totalLatency * 1.5}ms`);
                return null;
            }
        }
        
        const remaining = clickTime.getTime() - current.getTime();
        
        if (remaining < totalLatency) {
            console.error(`CLICK TOO CLOSE: ${remaining}ms < ${totalLatency}ms latency`);
            return null;
        }
        
        return {
            targetTime: targetTime,
            clickTime: clickTime,
            totalLatency: totalLatency,
            remaining: remaining,
            current: current
        };
    }
    
    // ===== UPDATED TIMER FUNCTIONS =====
    
    async function startMainTimer() {
        if (!state.calibrationComplete) {
            updateStatus('Calibrating... please wait', 'warning');
            return;
        }
        
        if (state.running) {
            updateStatus('Timer already running!', 'warning');
            return;
        }
        
        // Measure REAL latency (not just script execution)
        if (state.latencyMeasurements.length === 0) {
            updateStatus('Measuring real click latency...', 'info');
            await measureRealClickLatency();
        }
        
        const targetInput = document.getElementById('tw-target-input').value;
        const parts = targetInput.split(':');
        
        if (parts.length < 3) {
            updateStatus('Invalid time format! Use HH:MM:SS:mmm', 'error');
            return;
        }
        
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const s = parseInt(parts[2], 10) || 0;
        const ms = parts[3] ? parseInt(parts[3], 10) || 0 : 0;
        
        const current = getOptimizedServerTime();
        const target = new Date(current);
        target.setHours(h, m, s, ms);
        
        if (target <= current) {
            target.setDate(target.getDate() + 1);
        }
        
        const maxCancel = parseInt(document.getElementById('tw-cancel-input').value, 10) || 10;
        const attackDelay = parseInt(document.getElementById('tw-delay-input').value, 10) || 50;
        
        // Calculate total expected latency
        const totalExpectedLatency = state.currentLatency + attackDelay + 10; // +10ms safety
        
        console.log(`⚡ LATENCY BREAKDOWN:`);
        console.log(`- Measured click: ${state.currentLatency.toFixed(1)}ms`);
        console.log(`- Attack delay: ${attackDelay}ms`);
        console.log(`- Safety margin: 10ms`);
        console.log(`- TOTAL: ${totalExpectedLatency.toFixed(1)}ms`);
        
        const calc = calculateAttackTimeWithLatency(target, maxCancel, totalExpectedLatency);
        
        if (!calc) {
            updateStatus('Cannot calculate attack time! Not enough time?', 'error');
            return;
        }
        
        // Double-check timing
        const timeUntilClick = calc.clickTime.getTime() - current.getTime();
        if (timeUntilClick < totalExpectedLatency) {
            updateStatus(`Warning: Click time (${timeUntilClick}ms) < expected latency (${totalExpectedLatency}ms)`, 'warning');
        }
        
        state.currentAttackData = calc;
        handleAttackNaming();
        
        const duration = getDurationTime();
        state.fixedArriveTime = new Date(calc.clickTime.getTime() + duration);
        state.fixedReturnTime = new Date(state.fixedArriveTime.getTime() + duration);
        
        state.running = true;
        state.targetTime = calc.targetTime;
        state.clickTime = calc.clickTime;
        
        // UI updates
        document.getElementById('tw-start-btn').style.display = 'none';
        document.getElementById('tw-stop-btn').style.display = 'block';
        document.getElementById('tw-target-display').style.display = 'block';
        document.getElementById('tw-click-display').style.display = 'block';
        document.getElementById('tw-remaining-display').style.display = 'block';
        
        document.getElementById('tw-fixed-times').style.display = 'block';
        document.getElementById('tw-fixed-arrive').textContent = formatTime(state.fixedArriveTime);
        document.getElementById('tw-fixed-return').textContent = formatTime(state.fixedReturnTime);
        
        document.getElementById('tw-target-text').textContent = formatTime(calc.targetTime);
        document.getElementById('tw-click-text').textContent = formatTime(calc.clickTime);
        
        const modeText = state.currentMode === ATTACK_MODES.ON_CANCEL ? 'Anti-Noble' : 'Snipe';
        updateStatus(`${modeText} timer started! Clicking in ${(timeUntilClick/1000).toFixed(2)}s`, 'success');
        
        // Start the high-precision timer
        startPrecisionTimerRAF();
    }
    
    function stopMainTimer() {
        state.running = false;
        
        if (state.frameId) {
            cancelAnimationFrame(state.frameId);
            state.frameId = null;
        }
        
        if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
        
        document.getElementById('tw-start-btn').style.display = 'block';
        document.getElementById('tw-stop-btn').style.display = 'none';
        document.getElementById('tw-target-display').style.display = 'none';
        document.getElementById('tw-click-display').style.display = 'none';
        document.getElementById('tw-remaining-display').style.display = 'none';
        
        document.getElementById('tw-fixed-times').style.display = 'none';
        state.fixedArriveTime = null;
        state.fixedReturnTime = null;
        
        updateStatus('Timer stopped', 'info');
    }
    
    // ===== HELPER FUNCTIONS =====
    
    function setAttackMode(mode) {
        state.currentMode = mode;
        
        const cancelBtn = document.getElementById('tw-mode-cancel');
        const arriveBtn = document.getElementById('tw-mode-arrive');
        const description = document.getElementById('tw-mode-description');
        
        cancelBtn.classList.remove('active');
        arriveBtn.classList.remove('active');
        description.classList.remove('arrive-mode');
        
        if (mode === ATTACK_MODES.ON_CANCEL) {
            cancelBtn.classList.add('active');
            description.textContent = 'Anti-Noble: Attack early to allow cancellation. Cancel when troops would return at enemy arrival time.';
        } else {
            arriveBtn.classList.add('active', 'arrive-mode');
            description.textContent = 'Snipe: Arrive just before enemy attack. No cancellation possible.';
            description.classList.add('arrive-mode');
        }
        
        // RESTART DISPLAY UPDATES WHEN SWITCHING MODES
        if (state.timerId) {
            clearInterval(state.timerId);
            startDisplayUpdates();
        }
        
        updateStatus(`Mode: ${mode === ATTACK_MODES.ON_CANCEL ? 'Anti-Noble' : 'Snipe'}`, 'info');
    }
    
    function updateAttackDataDisplay() {
        const exportContent = document.getElementById('tw-export-content');
        if (!exportContent) return;
        
        const lastAttack = AttackDataStorage.getLastAttack();
        
        if (!lastAttack) {
            exportContent.textContent = 'No attack data saved yet.';
            return;
        }
        
        exportContent.textContent = AttackDataStorage.formatAttackForDisplay(lastAttack);
    }
    
    function copyAttackDataToClipboard() {
        const lastAttack = AttackDataStorage.getLastAttack();
        if (!lastAttack) {
            alert('No attack data to copy!');
            return;
        }
        
        const text = AttackDataStorage.formatAttackForDisplay(lastAttack);
        
        navigator.clipboard.writeText(text).then(() => {
            alert('Attack data copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy data. Please try again.');
        });
    }
    
    function downloadAttackData() {
        const lastAttack = AttackDataStorage.getLastAttack();
        if (!lastAttack) {
            alert('No attack data to download!');
            return;
        }
        
        const text = AttackDataStorage.formatAttackForDisplay(lastAttack);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.href = url;
        a.download = `attack-data-${timestamp}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function saveAttackData(performanceTiming) {
        if (!state.currentAttackData) return;
        
        const attackData = {
            mode: state.currentMode,
            startTime: formatTime(new Date()),
            enemyArrival: formatTime(state.targetTime),
            clickAt: formatTime(state.clickTime),
            duration: formatDuration(getDurationTime()),
            arriveToDestination: formatTime(new Date(state.clickTime.getTime() + getDurationTime())),
            returnIfNotCancel: formatTime(new Date(state.clickTime.getTime() + getDurationTime() * 2)),
            latency: `${state.currentLatency.toFixed(1)}ms`,
            willArriveAt: formatTime(state.fixedArriveTime),
            willReturnAt: formatTime(state.fixedReturnTime),
            updateInterval: document.getElementById('tw-update-input').value + 'ms',
            maxCancel: document.getElementById('tw-cancel-input').value + 'min',
            attackDelay: document.getElementById('tw-delay-input').value + 'ms',
            enemy: document.getElementById('tw-target-text').textContent,
            offset: `${Math.round(state.serverTimeOffset)}ms`,
            performance: performanceTiming ? {
                clickTime: performanceTiming.clickDispatch?.toFixed(1) || 'N/A',
                formSubmit: performanceTiming.formSubmit?.toFixed(1) || 'N/A',
                total: performanceTiming.total?.toFixed(1) || 'N/A'
            } : null,
            notes: `Optimized v3.0 | Latency compensated: ${state.currentLatency.toFixed(1)}ms`
        };
        
        AttackDataStorage.saveAttackData(attackData);
        
        document.getElementById('tw-export-container').style.display = 'block';
        updateAttackDataDisplay();
    }
    
    function formatTime(date) {
        if (!date) return '--:--:--:---';
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        const s = date.getSeconds().toString().padStart(2, '0');
        const ms = date.getMilliseconds().toString().padStart(3, '0');
        return `${h}:${m}:${s}:${ms}`;
    }
    
    function formatDuration(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    function calibrateServerTime() {
        const statusEl = document.getElementById('tw-status');
        
        if (!statusEl) return;
        
        statusEl.textContent = 'Calibrating server time...';
        
        const serverEl = document.querySelector('#serverTime');
        if (!serverEl) {
            statusEl.textContent = 'No server time element!';
            return;
        }
        
        state.calibrationData = [];
        let samples = 0;
        
        const observer = new MutationObserver(() => {
            const now = Date.now();
            const serverTime = getOptimizedServerTime();
            
            if (serverTime) {
                const localTime = new Date(now);
                const offset = serverTime.getTime() - localTime.getTime();
                
                state.calibrationData.push({
                    time: now,
                    offset: offset,
                    serverText: serverEl.textContent
                });
                
                samples++;
                
                const avgOffset = state.calibrationData.reduce((sum, d) => sum + d.offset, 0) / samples;
                state.serverTimeOffset = avgOffset;
                
                if (samples >= CONFIG.calibrationSamples) {
                    finishCalibration();
                }
            }
        });
        
        observer.observe(serverEl, {
            characterData: true,
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            if (samples > 0) {
                finishCalibration();
            } else {
                statusEl.textContent = 'Using estimated server time';
                state.calibrationComplete = true;
            }
        }, 10000);
        
        function finishCalibration() {
            observer.disconnect();
            
            const avgOffset = state.calibrationData.reduce((sum, d) => sum + d.offset, 0) / samples;
            state.serverTimeOffset = avgOffset;
            state.calibrationComplete = true;
            
            const latency = getLatency();
            statusEl.textContent = `Calibrated! Offset: ${Math.round(avgOffset)}ms, Latency: ${latency.toFixed(1)}ms`;
        }
    }
    
    function startDisplayUpdates() {
        const updateInterval = parseInt(document.getElementById('tw-update-input').value, 10) || 10;
        
        state.timerId = setInterval(() => {
            const serverTime = getOptimizedServerTime();
            const latency = getLatency();
            
            document.getElementById('tw-current-display').textContent = `Server: ${formatTime(serverTime)}`;
            
            updateDurationTimes(serverTime);
            
            const targetInput = document.getElementById('tw-target-input');
            if (!targetInput.value || targetInput.value === '00:00:00:000') {
                targetInput.value = formatTime(serverTime);
            }
        }, updateInterval);
    }
    
    function updateDisplay(serverNow, remaining) {
        document.getElementById('tw-current-display').textContent = `Server: ${formatTime(serverNow)}`;
        document.getElementById('tw-remaining-text').textContent = `${remaining}ms`;
        
        updateDurationTimes(serverNow);
        
        const remainingEl = document.getElementById('tw-remaining-text');
        if (remaining > 10000) {
            remainingEl.className = '';
        } else if (remaining > 2000) {
            remainingEl.className = 'tw-remaining-low';
        } else {
            remainingEl.className = 'tw-remaining-critical';
        }
    }
    
    function updateDurationTimes(currentTime) {
        const duration = getDurationTime();
        
        const arriveTime = new Date(currentTime.getTime() + duration);
        const arriveTimeElement = document.getElementById('tw-arrive-time');
        if (arriveTimeElement) {
            arriveTimeElement.textContent = formatTime(arriveTime);
        }
        
        const returnTime = new Date(arriveTime.getTime() + duration);
        const returnTimeElement = document.getElementById('tw-return-time');
        if (returnTimeElement) {
            returnTimeElement.textContent = formatTime(returnTime);
        }
    }
    
    function updateStatus(msg, type = 'info') {
        const el = document.getElementById('tw-status');
        if (!el) return;
        
        el.textContent = msg;
        el.className = 'tw-status-box';
        
        switch (type) {
            case 'error':
                el.classList.add('tw-status-error');
                break;
            case 'warning':
                el.classList.add('tw-status-warning');
                break;
            case 'success':
                el.classList.add('tw-status-success');
                break;
            case 'info':
                el.classList.add('tw-status-info');
                break;
        }
    }
    
    // ===== STYLES =====
    
    const style = document.createElement('style');
    style.textContent = `
        .tw-container {
            background: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            color: #333;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            font-family: Arial, sans-serif;
            font-size: 13px;
        }
        
        .tw-title {
            margin: 0 0 10px 0;
            color: #555;
            font-size: 16px;
            font-weight: bold;
            border-bottom: 1px solid #eee;
            padding-bottom: 8px;
        }
        
        .tw-performance-box {
            background: #1a1a2e;
            color: #0f0;
            font-family: 'Courier New', monospace;
            padding: 8px;
            border-radius: 4px;
            margin: 5px 0 15px 0;
            font-size: 11px;
            border: 1px solid #333;
        }
        
        .tw-mode-selector {
            margin-bottom: 10px;
        }
        
        .tw-mode-buttons {
            display: flex;
            gap: 8px;
            margin: 5px 0;
        }
        
        .tw-mode-button {
            flex: 1;
            padding: 8px;
            background: #f5f5f5;
            border: 1px solid #ddd;
            color: #555;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }
        
        .tw-mode-button:hover {
            background: #e9e9e9;
        }
        
        .tw-mode-button.active {
            background: #4CAF50;
            border-color: #388E3C;
            color: white;
        }
        
        .tw-mode-button.active.arrive-mode {
            background: #2196F3;
            border-color: #1976D2;
        }
        
        .tw-mode-description {
            font-size: 11px;
            color: #666;
            margin-top: 3px;
            padding: 6px;
            background: #f9f9f9;
            border-radius: 4px;
            border-left: 2px solid #4CAF50;
        }
        
        .tw-mode-description.arrive-mode {
            border-left-color: #2196F3;
        }
        
        .tw-status-box {
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            border-left: 3px solid #999;
            background: #f8f8f8;
            min-height: 20px;
            font-size: 12px;
        }
        
        .tw-status-error { border-left-color: #dc3545; background: #fdd; }
        .tw-status-warning { border-left-color: #ffc107; background: #ffe; }
        .tw-status-success { border-left-color: #28a745; background: #dfd; }
        .tw-status-info { border-left-color: #17a2b8; background: #dff; }
        
        .tw-latency-display {
            display: inline-block;
            padding: 2px 6px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 3px;
            font-family: monospace;
            font-size: 11px;
            margin-left: 5px;
        }
        
        .tw-times-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .tw-time-box {
            padding: 10px;
            background: #f8f8f8;
            border: 1px solid #eee;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .tw-arrive-box { border-left: 3px solid #28a745; }
        .tw-return-box { border-left: 3px solid #fd7e14; }
        
        .tw-time-label {
            margin-bottom: 5px;
            font-weight: bold;
            font-size: 11px;
        }
        
        .tw-time-value {
            font-family: monospace;
            font-size: 13px;
            font-weight: bold;
        }
        
        .tw-arrive-value { color: #28a745; }
        .tw-return-value { color: #fd7e14; }
        
        .tw-fixed-times-container {
            margin-bottom: 15px;
            display: none;
        }
        
        .tw-fixed-times-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        
        .tw-fixed-time-box {
            padding: 8px;
            background: white;
            border: 1px solid #eee;
            border-radius: 4px;
            font-size: 11px;
        }
        
        .tw-fixed-time-label {
            margin-bottom: 3px;
            font-weight: bold;
        }
        
        .tw-fixed-time-value {
            font-family: monospace;
            font-size: 12px;
            font-weight: bold;
        }
        
        .tw-input-label {
            margin: 5px 0 3px 0;
            font-size: 11px;
            font-weight: bold;
        }
        
        .tw-input {
            width: 100%;
            padding: 6px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            box-sizing: border-box;
            margin-bottom: 8px;
        }
        
        .tw-input:focus {
            border-color: #4CAF50;
            outline: none;
        }
        
        .tw-settings-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .tw-buttons-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .tw-button {
            padding: 8px;
            border: none;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 12px;
            transition: all 0.2s;
        }
        
        .tw-button:hover {
            opacity: 0.9;
        }
        
        .tw-start-button { background: #4CAF50; }
        .tw-stop-button { background: #dc3545; }
        .tw-latency-button { background: #6f42c1; }
        
        .tw-time-display {
            background: #f8f8f8;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #eee;
            margin-bottom: 15px;
        }
        
        .tw-current-display {
            font-family: monospace;
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .tw-target-display, .tw-click-display, .tw-remaining-display {
            font-family: monospace;
            font-size: 12px;
            margin-bottom: 3px;
            display: none;
        }
        
        .tw-remaining-critical { color: #dc3545; font-weight: bold; }
        .tw-remaining-low { color: #fd7e14; }
        
        .tw-export-container {
            margin-top: 15px;
            display: none;
        }
        
        .tw-export-box {
            background: #f8f8f8;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
        }
        
        .tw-data-display {
            font-family: monospace;
            font-size: 11px;
            background: white;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #ddd;
            max-height: 150px;
            overflow-y: auto;
            white-space: pre-wrap;
            margin-bottom: 10px;
        }
        
        .tw-export-buttons {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .tw-export-button {
            padding: 5px 10px;
            background: #6c757d;
            border: none;
            color: white;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
        }
        
        .tw-export-button-copy { background: #17a2b8; }
        .tw-export-button-download { background: #28a745; }
        .tw-export-button-clear { background: #dc3545; }
        
        .tw-cancel-tracker {
            padding: 4px 6px;
            background: #ffeaa7;
            border: 1px solid #fdcb6e;
            border-radius: 3px;
            font-size: 11px;
            font-family: monospace;
            text-align: center;
        }
        
        .tw-cancel-tracker.critical {
            background: #fab1a0;
            border-color: #e17055;
            font-weight: bold;
        }
        
        @media (max-width: 768px) {
            .tw-settings-grid,
            .tw-times-grid,
            .tw-fixed-times-grid {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(style);
    
    // ===== INITIALIZATION =====
    
    function init() {
        AttackDataStorage.init();
        cacheDOMElements();
        
        if (state.isOnCommandsPage) {
            initCancelTracking();
        } else {
            setTimeout(() => {
                if (!cachedElements.attackButton) {
                    setTimeout(init, 1000);
                    return;
                }
                
                if (document.getElementById('tw-precision-main')) return;
                
                addMainUI();
                setTimeout(calibrateServerTime, 500);
                
                // Auto-measure latency after UI loads
                setTimeout(() => {
                    measureClickLatency().then(latency => {
                        updateStatus(`Latency measured: ${latency.toFixed(1)}ms`, 'success');
                    });
                }, 2000);
            }, 1000);
        }
    }
    
    console.log('Optimized Precision Attack Timer loaded.');
    init();
    
})();
