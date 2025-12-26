// ==UserScript==
// @name         Tribal Wars Precision Attack Timer
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Precision attack timer with anti-noble and snipe modes
// @author       D-maister
// @match        https://*.voynaplemyon.com/game.php?*screen=place*try=confirm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('=== PRECISION ATTACK TIMER ===');
    
    const CONFIG = {
        defaultUpdateInterval: 10,
        defaultMaxCancelMinutes: 10,
        defaultAttackDelay: 50,
        maxCancelMultiplier: 2,
        calibrationSamples: 10
    };
    
    const ATTACK_MODES = {
        ON_CANCEL: 'on_cancel',   // Anti-noble: attack early, can cancel
        ON_ARRIVE: 'on_arrive'    // Snipe: arrive just before enemy
    };
    
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
        currentMode: ATTACK_MODES.ON_CANCEL
    };
    
    // Storage functions for attack data
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
            
            if (data.notes) {
                output += `\n📝 Notes: ${data.notes}\n`;
            }
            
            output += '\n' + '='.repeat(50);
            return output;
        }
    };
    
    // Initialize attack data storage
    AttackDataStorage.init();
    
    // Add CSS styles with enhanced white theme
    const style = document.createElement('style');
    style.textContent = `
        .tw-container {
            background: linear-gradient(145deg, #ffffff, #f8f9fa);
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            color: #212529;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        .tw-title {
            margin: 0 0 20px 0;
            color: #495057;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 20px;
            border-bottom: 2px solid #dee2e6;
            padding-bottom: 15px;
        }
        
        .tw-title-icon {
            font-size: 28px;
        }
        
        .tw-mode-selector {
            margin-bottom: 20px;
        }
        
        .tw-mode-buttons {
            display: flex;
            gap: 10px;
            margin-top: 8px;
        }
        
        .tw-mode-button {
            flex: 1;
            padding: 12px;
            background: #e9ecef;
            border: 2px solid #dee2e6;
            color: #495057;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s;
            text-align: center;
        }
        
        .tw-mode-button:hover {
            background: #dee2e6;
            transform: translateY(-1px);
        }
        
        .tw-mode-button.active {
            background: linear-gradient(145deg, #4CAF50, #388E3C);
            border-color: #2E7D32;
            color: white;
            box-shadow: 0 3px 10px rgba(76, 175, 80, 0.2);
        }
        
        .tw-mode-button.active.arrive-mode {
            background: linear-gradient(145deg, #2196F3, #1976D2);
            border-color: #0D47A1;
            box-shadow: 0 3px 10px rgba(33, 150, 243, 0.2);
        }
        
        .tw-mode-description {
            font-size: 13px;
            color: #6c757d;
            margin-top: 4px;
            padding: 8px;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 3px solid #4CAF50;
        }
        
        .tw-mode-description.arrive-mode {
            border-left-color: #2196F3;
        }
        
        .tw-status-box {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
            border-left: 4px solid #6c757d;
            color: #495057;
            font-size: 14px;
            min-height: 24px;
            background: #f8f9fa;
        }
        
        .tw-status-error {
            border-left-color: #dc3545 !important;
            color: #721c24 !important;
            background: #f8d7da !important;
        }
        
        .tw-status-warning {
            border-left-color: #ffc107 !important;
            color: #856404 !important;
            background: #fff3cd !important;
        }
        
        .tw-status-success {
            border-left-color: #28a745 !important;
            color: #155724 !important;
            background: #d4edda !important;
        }
        
        .tw-status-info {
            border-left-color: #17a2b8 !important;
            color: #0c5460 !important;
            background: #d1ecf1 !important;
        }
        
        .tw-calibration-status {
            padding: 15px;
            background: #e7f3ff;
            border: 1px solid #b8daff;
            border-radius: 6px;
            margin-bottom: 20px;
            color: #004085;
            font-size: 14px;
            display: none;
        }
        
        .tw-duration-info {
            padding: 12px;
            background: #e7f3ff;
            border: 1px solid #b8daff;
            border-radius: 6px;
            margin-bottom: 20px;
            color: #004085;
            font-size: 14px;
        }
        
        .tw-duration-stats {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .tw-times-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .tw-time-box {
            border-radius: 8px;
            padding: 15px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            transition: all 0.3s;
        }
        
        .tw-time-box:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            transform: translateY(-2px);
        }
        
        .tw-arrive-box {
            border-left: 4px solid #28a745;
        }
        
        .tw-return-box {
            border-left: 4px solid #fd7e14;
        }
        
        .tw-time-label {
            margin-bottom: 8px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
            color: #495057;
        }
        
        .tw-arrive-label {
            color: #28a745;
        }
        
        .tw-return-label {
            color: #fd7e14;
        }
        
        .tw-time-icon {
            font-size: 20px;
        }
        
        .tw-time-value {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
            color: #212529;
        }
        
        .tw-arrive-value {
            color: #28a745;
        }
        
        .tw-return-value {
            color: #fd7e14;
        }
        
        .tw-fixed-times-container {
            display: none;
            margin-bottom: 20px;
        }
        
        .tw-fixed-times-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
        }
        
        .tw-fixed-times-label {
            color: #495057;
            margin-bottom: 12px;
            font-size: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
        }
        
        .tw-fixed-times-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .tw-fixed-time-box {
            border-radius: 6px;
            padding: 12px;
            background: white;
            border: 1px solid #e9ecef;
        }
        
        .tw-fixed-arrive-box {
            border-left: 3px solid #28a745;
        }
        
        .tw-fixed-return-box {
            border-left: 3px solid #fd7e14;
        }
        
        .tw-fixed-time-label {
            margin-bottom: 6px;
            font-size: 13px;
            font-weight: 500;
            color: #6c757d;
        }
        
        .tw-fixed-arrive-label {
            color: #28a745;
        }
        
        .tw-fixed-return-label {
            color: #fd7e14;
        }
        
        .tw-fixed-time-value {
            font-family: 'Courier New', monospace;
            font-size: 15px;
            font-weight: bold;
            color: #212529;
        }
        
        .tw-fixed-arrive-value {
            color: #28a745;
        }
        
        .tw-fixed-return-value {
            color: #fd7e14;
        }
        
        .tw-target-input-container {
            margin-bottom: 20px;
        }
        
        .tw-input-label {
            color: #495057;
            margin-bottom: 8px;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 500;
        }
        
        .tw-time-format {
            color: #6c757d;
            font-size: 12px;
            font-family: monospace;
        }
        
        .tw-input {
            width: 100%;
            padding: 12px;
            background: white;
            border: 2px solid #e9ecef;
            color: #212529;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 15px;
            transition: all 0.3s;
            box-sizing: border-box;
        }
        
        .tw-input:focus {
            border-color: #4CAF50;
            outline: none;
            box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
        }
        
        .tw-settings-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .tw-buttons-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .tw-button {
            padding: 14px;
            border: none;
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 15px;
            transition: all 0.3s;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        }
        
        .tw-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
        }
        
        .tw-start-button {
            background: linear-gradient(145deg, #4CAF50, #388E3C);
            box-shadow: 0 3px 10px rgba(76, 175, 80, 0.2);
        }
        
        .tw-start-button:hover {
            box-shadow: 0 5px 15px rgba(76, 175, 80, 0.3);
        }
        
        .tw-stop-button {
            background: linear-gradient(145deg, #dc3545, #c82333);
            box-shadow: 0 3px 10px rgba(220, 53, 69, 0.2);
        }
        
        .tw-stop-button:hover {
            box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);
        }
        
        .tw-time-display {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .tw-current-display {
            color: #495057;
            font-family: 'Courier New', monospace;
            font-size: 17px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        
        .tw-target-display {
            color: #fd7e14;
            font-family: 'Courier New', monospace;
            font-size: 17px;
            font-weight: bold;
            margin-bottom: 12px;
            display: none;
        }
        
        .tw-click-display {
            color: #2196F3;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 12px;
            display: none;
        }
        
        .tw-remaining-display {
            color: #495057;
            font-family: 'Courier New', monospace;
            font-size: 17px;
            font-weight: bold;
            display: none;
        }
        
        .tw-remaining-low {
            color: #fd7e14 !important;
        }
        
        .tw-remaining-critical {
            color: #dc3545 !important;
            font-weight: bold !important;
        }
        
        .tw-export-container {
            margin-top: 20px;
            display: none;
        }
        
        .tw-export-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
        }
        
        .tw-export-header {
            color: #495057;
            margin-bottom: 12px;
            font-size: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
            justify-content: space-between;
        }
        
        .tw-export-buttons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
            flex-wrap: wrap;
        }
        
        .tw-export-button {
            padding: 8px 16px;
            background: #6c757d;
            border: none;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 13px;
            transition: all 0.3s;
        }
        
        .tw-export-button:hover {
            transform: translateY(-1px);
            background: #5a6268;
        }
        
        .tw-export-button-copy {
            background: #17a2b8;
        }
        
        .tw-export-button-copy:hover {
            background: #138496;
        }
        
        .tw-export-button-download {
            background: #28a745;
        }
        
        .tw-export-button-download:hover {
            background: #218838;
        }
        
        .tw-export-button-clear {
            background: #dc3545;
        }
        
        .tw-export-button-clear:hover {
            background: #c82333;
        }
        
        .tw-data-display {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #212529;
            background: white;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            max-height: 200px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-all;
        }
        
        .tw-logs-toggle, .tw-export-toggle {
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
            font-size: 12px;
            text-decoration: underline;
        }
        
        .tw-logs-toggle:hover, .tw-export-toggle:hover {
            color: #495057;
        }
        
        @media (max-width: 768px) {
            .tw-settings-grid {
                grid-template-columns: 1fr;
            }
            
            .tw-times-grid {
                grid-template-columns: 1fr;
            }
            
            .tw-fixed-times-grid {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Initialize
    function init() {
        setTimeout(() => {
            const attackBtn = document.querySelector('#troop_confirm_submit');
            if (!attackBtn) {
                setTimeout(init, 1000);
                return;
            }
            
            if (document.getElementById('tw-precision-main')) return;
            
            addMainUI(attackBtn);
            
            setTimeout(calibrateServerTime, 500);
        }, 1000);
    }
    
    // Get latency from serverTime element
    function getLatency() {
        try {
            const serverTimeEl = document.querySelector('#serverTime');
            if (!serverTimeEl) return 0;
            
            const title = serverTimeEl.getAttribute('data-title') || '';
            const match = title.match(/Latency:\s*([\d.]+)ms/i);
            return match ? parseFloat(match[1]) : 0;
        } catch (error) {
            console.error('Error getting latency:', error);
            return 0;
        }
    }
    
    // Get duration time from the page
    function getDurationTime() {
        try {
            // Try the new selector
            const durationElement = document.querySelector("#command-data-form table.vis tbody tr:nth-child(4) td:nth-child(2)");
            
            // Fallback to old selector
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
            
            const alternativeSelectors = [
                'td[data-duration]',
                '.duration',
                'td:contains("Duration") + td',
                'tr:contains("Duration") td:nth-child(2)'
            ];
            
            for (const selector of alternativeSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    const text = element.textContent.trim();
                    const match = text.match(/(\d+):(\d+):(\d+)/);
                    if (match) {
                        const hours = parseInt(match[1], 10) || 0;
                        const minutes = parseInt(match[2], 10) || 0;
                        const seconds = parseInt(match[3], 10) || 0;
                        return (hours * 3600 + minutes * 60 + seconds) * 1000;
                    }
                }
            }
            
            console.warn('Could not find duration time element');
            return 0;
        } catch (error) {
            console.error('Error getting duration time:', error);
            return 0;
        }
    }
    
    // Add main UI with mode selector
    function addMainUI(attackBtn) {
        const current = getEstimatedServerTime();
        const duration = getDurationTime();
        const latency = getLatency();
        
        const arriveTime = new Date(current.getTime() + duration);
        const returnTime = new Date(arriveTime.getTime() + duration);
        
        const div = document.createElement('div');
        div.id = 'tw-precision-main';
        div.innerHTML = `
            <div class="tw-container">
                <h3 class="tw-title">
                    <span class="tw-title-icon">🎯</span>
                    <span>Precision Attack Timer</span>
                </h3>
                
                <div id="tw-calibration-status" class="tw-calibration-status">
                    🔄 Calibrating server time...
                </div>
                
                <!-- Mode Selector -->
                <div class="tw-mode-selector">
                    <div class="tw-input-label">
                        ⚡ Attack Mode:
                    </div>
                    <div class="tw-mode-buttons">
                        <button id="tw-mode-cancel" class="tw-mode-button active">
                            🛡️ Anti-Noble (On Cancel)
                        </button>
                        <button id="tw-mode-arrive" class="tw-mode-button">
                            ⚡ Snipe (On Arrive)
                        </button>
                    </div>
                    <div id="tw-mode-description" class="tw-mode-description">
                        <strong>Anti-Noble Mode:</strong> Attack early to allow cancellation. Arrives with max cancel time before enemy.
                    </div>
                </div>
                
                <div id="tw-duration-info" class="tw-duration-info">
                    <div class="tw-duration-stats">
                        <span>📊 Duration: ${formatDuration(duration)}</span>
                        <span>📡 Latency: ${latency.toFixed(1)}ms</span>
                    </div>
                </div>
                
                <div class="tw-times-grid">
                    <div class="tw-time-box tw-arrive-box">
                        <div class="tw-time-label tw-arrive-label">
                            <span class="tw-time-icon">📍</span>
                            <span>Arrive to destination:</span>
                        </div>
                        <div id="tw-arrive-time" class="tw-time-value tw-arrive-value">
                            ${formatTime(arriveTime)}
                        </div>
                    </div>
                    
                    <div class="tw-time-box tw-return-box">
                        <div class="tw-time-label tw-return-label">
                            <span class="tw-time-icon">↩️</span>
                            <span>Return if not cancel:</span>
                        </div>
                        <div id="tw-return-time" class="tw-time-value tw-return-value">
                            ${formatTime(returnTime)}
                        </div>
                    </div>
                </div>
                
                <div id="tw-fixed-times" class="tw-fixed-times-container">
                    <div class="tw-fixed-times-box">
                        <div class="tw-fixed-times-label">
                            <span style="font-size: 20px;">⏱️</span>
                            <span>Scheduled Attack Times</span>
                        </div>
                        <div class="tw-fixed-times-grid">
                            <div class="tw-fixed-time-box tw-fixed-arrive-box">
                                <div class="tw-fixed-time-label tw-fixed-arrive-label">
                                    Will arrive at:
                                </div>
                                <div id="tw-fixed-arrive" class="tw-fixed-time-value tw-fixed-arrive-value">
                                    --:--:--:---
                                </div>
                            </div>
                            
                            <div class="tw-fixed-time-box tw-fixed-return-box">
                                <div class="tw-fixed-time-label tw-fixed-return-label">
                                    Will return at:
                                </div>
                                <div id="tw-fixed-return" class="tw-fixed-time-value tw-fixed-return-value">
                                    --:--:--:---
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="tw-target-input-container">
                    <div class="tw-input-label">
                        <span>🎯 Enemy Arrival Time:</span>
                        <span class="tw-time-format">HH:MM:SS:mmm</span>
                    </div>
                    <input type="text" 
                           id="tw-target-input" 
                           class="tw-input"
                           value="${formatTime(current)}"
                           placeholder="13:44:30:054">
                </div>
                
                <div class="tw-settings-grid">
                    <div>
                        <div class="tw-input-label">
                            🔄 Update (ms):
                        </div>
                        <input type="number" 
                               id="tw-update-input" 
                               class="tw-input"
                               value="10"
                               min="1" 
                               max="100"
                               step="1">
                    </div>
                    
                    <div>
                        <div class="tw-input-label">
                            ⏰ Max Cancel (min):
                        </div>
                        <input type="number" 
                               id="tw-cancel-input" 
                               class="tw-input"
                               value="10"
                               min="1" 
                               max="60"
                               step="1">
                    </div>
                    
                    <div>
                        <div class="tw-input-label">
                            ⏱️ Attack Delay (ms):
                        </div>
                        <input type="number" 
                               id="tw-delay-input" 
                               class="tw-input"
                               value="50"
                               min="1" 
                               max="500"
                               step="1">
                    </div>
                </div>
                
                <div class="tw-buttons-grid">
                    <button id="tw-start-btn" class="tw-button tw-start-button">
                        🚀 Start Timer
                    </button>
                    
                    <button id="tw-stop-btn" class="tw-button tw-stop-button" style="display: none;">
                        ⏹️ Stop
                    </button>
                </div>
                
                <div id="tw-status" class="tw-status-box">
                    🔄 Calibrating server time...
                </div>
                
                <div class="tw-time-display">
                    <div id="tw-current-display" class="tw-current-display">
                        ⏰ Server: ${formatTime(current)}
                    </div>
                    
                    <div id="tw-target-display" class="tw-target-display">
                        🎯 Enemy: <span id="tw-target-text">--:--:--:---</span>
                    </div>
                    
                    <div id="tw-click-display" class="tw-click-display">
                        🖱️ Click at: <span id="tw-click-text">--:--:--:---</span>
                    </div>
                    
                    <div id="tw-remaining-display" class="tw-remaining-display">
                        ⏳ Remaining: <span id="tw-remaining-text">0ms</span>
                    </div>
                </div>
                
                <!-- Attack Data Export Section -->
                <div id="tw-export-container" class="tw-export-container">
                    <div class="tw-export-box">
                        <div class="tw-export-header">
                            <span>
                                <span style="font-size: 20px;">💾</span>
                                <span>Attack Data</span>
                            </span>
                            <button id="tw-export-toggle" class="tw-export-toggle">
                                Show/Hide
                            </button>
                        </div>
                        <div id="tw-export-content" class="tw-data-display" style="display: none;">
                            <!-- Data will be inserted here -->
                        </div>
                        <div id="tw-export-buttons" class="tw-export-buttons" style="display: none;">
                            <button id="tw-copy-data" class="tw-export-button tw-export-button-copy">
                                📋 Copy Data
                            </button>
                            <button id="tw-download-data" class="tw-export-button tw-export-button-download">
                                ⬇️ Download
                            </button>
                            <button id="tw-clear-history" class="tw-export-button tw-export-button-clear">
                                🗑️ Clear History
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        attackBtn.parentNode.insertBefore(div, attackBtn.nextSibling);
        
        // Event listeners
        document.getElementById('tw-start-btn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            startMainTimer();
            return false;
        });
        
        document.getElementById('tw-stop-btn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            stopMainTimer();
            return false;
        });
        
        // Mode selection
        document.getElementById('tw-mode-cancel').addEventListener('click', function(e) {
            e.preventDefault();
            setAttackMode(ATTACK_MODES.ON_CANCEL);
        });
        
        document.getElementById('tw-mode-arrive').addEventListener('click', function(e) {
            e.preventDefault();
            setAttackMode(ATTACK_MODES.ON_ARRIVE);
        });
        
        // Export toggle
        document.getElementById('tw-export-toggle').addEventListener('click', function(e) {
            e.preventDefault();
            const exportContent = document.getElementById('tw-export-content');
            const exportButtons = document.getElementById('tw-export-buttons');
            
            if (exportContent.style.display === 'none') {
                exportContent.style.display = 'block';
                exportButtons.style.display = 'flex';
                updateAttackDataDisplay();
            } else {
                exportContent.style.display = 'none';
                exportButtons.style.display = 'none';
            }
        });
        
        // Copy data button
        document.getElementById('tw-copy-data').addEventListener('click', function(e) {
            e.preventDefault();
            copyAttackDataToClipboard();
        });
        
        // Download data button
        document.getElementById('tw-download-data').addEventListener('click', function(e) {
            e.preventDefault();
            downloadAttackData();
        });
        
        // Clear history button
        document.getElementById('tw-clear-history').addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Clear all attack history?')) {
                AttackDataStorage.clearHistory();
                updateAttackDataDisplay();
            }
        });
        
        startDisplayUpdates();
    }
    
    // Set attack mode
    function setAttackMode(mode) {
        state.currentMode = mode;
        
        const cancelBtn = document.getElementById('tw-mode-cancel');
        const arriveBtn = document.getElementById('tw-mode-arrive');
        const description = document.getElementById('tw-mode-description');
        
        // Update button states
        cancelBtn.classList.remove('active');
        arriveBtn.classList.remove('active');
        description.classList.remove('arrive-mode');
        
        if (mode === ATTACK_MODES.ON_CANCEL) {
            cancelBtn.classList.add('active');
            description.textContent = '🛡️ Anti-Noble Mode: Attack early to allow cancellation. Arrives with max cancel time before enemy.';
            description.classList.remove('arrive-mode');
        } else {
            arriveBtn.classList.add('active', 'arrive-mode');
            description.textContent = '⚡ Snipe Mode: Arrive just before enemy attack. No cancellation possible after launch.';
            description.classList.add('arrive-mode');
        }
        
        // Update status to reflect mode change
        updateStatus(`Mode set to: ${mode === ATTACK_MODES.ON_CANCEL ? 'Anti-Noble (On Cancel)' : 'Snipe (On Arrive)'}`, 'info');
    }
    
    // Update attack data display
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
    
    // Copy attack data to clipboard
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
    
    // Download attack data
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
    
    // Save attack data to sessionStorage
    function saveAttackData() {
        if (!state.currentAttackData) {
            console.warn('No attack data to save');
            return;
        }
        
        const attackData = {
            // Mode
            mode: state.currentMode,
            
            // Timings
            startTime: formatTime(new Date()),
            enemyArrival: formatTime(state.targetTime),
            clickAt: formatTime(state.clickTime),
            
            // Travel info
            duration: formatDuration(getDurationTime()),
            arriveToDestination: formatTime(new Date(state.clickTime.getTime() + getDurationTime())),
            returnIfNotCancel: formatTime(new Date(state.clickTime.getTime() + getDurationTime() * 2)),
            latency: `${getLatency().toFixed(1)}ms`,
            
            // Scheduled times
            willArriveAt: formatTime(state.fixedArriveTime),
            willReturnAt: formatTime(state.fixedReturnTime),
            
            // Settings
            updateInterval: document.getElementById('tw-update-input').value + 'ms',
            maxCancel: document.getElementById('tw-cancel-input').value + 'min',
            attackDelay: document.getElementById('tw-delay-input').value + 'ms',
            
            // Server info
            enemy: document.getElementById('tw-target-text').textContent,
            offset: `${Math.round(state.serverTimeOffset)}ms`,
            
            // Additional info
            notes: state.currentAttackData.adjustedMaxCancel ? 
                   `Cancel time adjusted to ${state.currentAttackData.adjustedMaxCancel.toFixed(1)}min (requested: ${document.getElementById('tw-cancel-input').value}min)` :
                   'Using snipe timing (arrive just before enemy)'
        };
        
        const savedAttack = AttackDataStorage.saveAttackData(attackData);
        
        // Show export section
        document.getElementById('tw-export-container').style.display = 'block';
        
        return savedAttack;
    }
    
    // Get server time from element
    function getServerTimeFromElement() {
        const el = document.querySelector('#serverTime');
        if (!el) return null;
        
        const text = el.textContent || '00:00:00';
        const parts = text.split(':').map(Number);
        
        const date = new Date();
        date.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0, 0);
        return date;
    }
    
    // Get estimated server time with milliseconds
    function getEstimatedServerTime() {
        if (!state.calibrationComplete) {
            const serverTime = getServerTimeFromElement();
            if (!serverTime) return new Date();
            
            serverTime.setMilliseconds(new Date().getMilliseconds());
            return serverTime;
        }
        
        const now = new Date();
        return new Date(now.getTime() + state.serverTimeOffset);
    }
    
    // Format time
    function formatTime(date) {
        if (!date) return '--:--:--:---';
        const h = date.getHours().toString().padStart(2, '0');
        const m = date.getMinutes().toString().padStart(2, '0');
        const s = date.getSeconds().toString().padStart(2, '0');
        const ms = date.getMilliseconds().toString().padStart(3, '0');
        return `${h}:${m}:${s}:${ms}`;
    }
    
    // Format duration
    function formatDuration(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Calibrate server time
    function calibrateServerTime() {
        const statusEl = document.getElementById('tw-status');
        const calibrationStatus = document.getElementById('tw-calibration-status');
        
        if (!statusEl || !calibrationStatus) return;
        
        calibrationStatus.style.display = 'block';
        statusEl.textContent = '🔄 Calibrating server time...';
        
        const serverEl = document.querySelector('#serverTime');
        if (!serverEl) {
            statusEl.textContent = '❌ No server time element!';
            return;
        }
        
        state.calibrationData = [];
        let samples = 0;
        
        const observer = new MutationObserver(() => {
            const now = Date.now();
            const serverTime = getServerTimeFromElement();
            
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
                
                calibrationStatus.innerHTML = `🔄 Calibrating... ${samples}/${CONFIG.calibrationSamples}<br>Offset: ${Math.round(avgOffset)}ms`;
                
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
                statusEl.textContent = '⚠️ Using estimated server time';
                calibrationStatus.style.display = 'none';
                state.calibrationComplete = true;
            }
        }, 10000);
        
        function finishCalibration() {
            observer.disconnect();
            
            const avgOffset = state.calibrationData.reduce((sum, d) => sum + d.offset, 0) / samples;
            state.serverTimeOffset = avgOffset;
            state.calibrationComplete = true;
            
            calibrationStatus.style.display = 'none';
            statusEl.textContent = `✅ Calibrated! Offset: ${Math.round(avgOffset)}ms`;
        }
    }
    
    // Start display updates
    function startDisplayUpdates() {
        const updateInterval = parseInt(document.getElementById('tw-update-input').value, 10) || 10;
        
        setInterval(() => {
            const serverTime = getEstimatedServerTime();
            const latency = getLatency();
            
            document.getElementById('tw-current-display').textContent = `⏰ Server: ${formatTime(serverTime)}`;
            
            const durationInfo = document.getElementById('tw-duration-info');
            if (durationInfo) {
                const duration = getDurationTime();
                durationInfo.innerHTML = `<div class="tw-duration-stats">
                    <span>📊 Duration: ${formatDuration(duration)}</span>
                    <span>📡 Latency: ${latency.toFixed(1)}ms</span>
                </div>`;
            }
            
            updateDurationTimes(serverTime);
            
            const targetInput = document.getElementById('tw-target-input');
            if (!targetInput.value || targetInput.value === '00:00:00:000') {
                targetInput.value = formatTime(serverTime);
            }
        }, updateInterval);
    }
    
    // Update duration times
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
    
    // Calculate attack time based on selected mode
    function calculateAttackTime(targetTime, maxCancelMinutes, attackDelay) {
        const current = getEstimatedServerTime();
        const latency = getLatency();
        const duration = getDurationTime();
        
        const maxCancelMs = maxCancelMinutes * 60 * 1000;
        const twoTimesCancel = maxCancelMs * 2;
        const timeAvailable = targetTime.getTime() - current.getTime();
        
        console.log('=== CALCULATION START ===');
        console.log('Mode:', state.currentMode);
        console.log('Target (enemy):', formatTime(targetTime));
        console.log('Current:', formatTime(current));
        console.log('Duration:', formatDuration(duration));
        
        let adjustedMaxCancelMs = maxCancelMs;
        let clickTime;
        
        if (state.currentMode === ATTACK_MODES.ON_CANCEL) {
            // ANTI-NOBLE MODE: Attack early, can cancel
            if (timeAvailable >= twoTimesCancel) {
                // Enough time for full 2x cancel
                const latestAttackMs = targetTime.getTime() - twoTimesCancel;
                clickTime = new Date(latestAttackMs - attackDelay - latency);
                console.log('Anti-Noble: Using full cancel time');
            } else {
                // Not enough time for full cancel - adjust
                const minNeeded = attackDelay + latency + 100;
                
                if (timeAvailable < minNeeded) {
                    console.error('Not enough time even for immediate attack');
                    return null;
                }
                
                const maxCancelPossible = Math.floor((timeAvailable - attackDelay - latency - 100) / 2);
                
                if (maxCancelPossible < 1000) {
                    clickTime = new Date(current.getTime() + 100);
                    adjustedMaxCancelMs = 1000;
                } else {
                    adjustedMaxCancelMs = maxCancelPossible;
                    const latestAttackMs = targetTime.getTime() - (adjustedMaxCancelMs * 2);
                    clickTime = new Date(latestAttackMs - attackDelay - latency);
                }
                console.log('Anti-Noble: Using adjusted cancel time');
            }
        } else {
            // SNIPE MODE: Arrive just before enemy
            // Click time = Enemy Time - Duration - Attack Delay - Latency
            const desiredArrivalTime = targetTime.getTime() - attackDelay - latency;
            clickTime = new Date(desiredArrivalTime - duration);
            
            // Ensure we have at least 100ms margin
            if (clickTime.getTime() - current.getTime() < 100) {
                console.error('Not enough time for snipe attack');
                return null;
            }
            
            // For snipe mode, we don't use cancel time
            adjustedMaxCancelMs = 0;
            console.log('Snipe: Targeting arrival just before enemy');
        }
        
        const remaining = clickTime.getTime() - current.getTime();
        
        console.log('Click time:', formatTime(clickTime));
        console.log('Remaining until click:', remaining, 'ms');
        if (state.currentMode === ATTACK_MODES.ON_CANCEL) {
            console.log('Adjusted max cancel:', adjustedMaxCancelMs, 'ms =', (adjustedMaxCancelMs/60000).toFixed(2), 'min');
        }
        console.log('=== CALCULATION END ===');
        
        if (remaining < 100) {
            console.error('Click time too close! Need at least 100ms');
            return null;
        }
        
        return {
            targetTime: targetTime,
            clickTime: clickTime,
            adjustedMaxCancel: adjustedMaxCancelMs / 60000,
            attackDelay: attackDelay,
            latency: latency,
            remaining: remaining,
            current: current
        };
    }
    
    // Start main timer
    function startMainTimer() {
        if (!state.calibrationComplete) {
            updateStatus('Calibrating... please wait', 'warning');
            return;
        }
        
        if (state.running) {
            updateStatus('Timer already running!', 'warning');
            return;
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
        
        const current = getEstimatedServerTime();
        const target = new Date(current);
        target.setHours(h, m, s, ms);
        
        if (target <= current) {
            target.setDate(target.getDate() + 1);
        }
        
        const maxCancel = parseInt(document.getElementById('tw-cancel-input').value, 10) || 10;
        const updateInterval = parseInt(document.getElementById('tw-update-input').value, 10) || 10;
        const attackDelay = parseInt(document.getElementById('tw-delay-input').value, 10) || 50;
        
        const calc = calculateAttackTime(target, maxCancel, attackDelay);
        
        if (!calc) {
            updateStatus('Cannot calculate attack time! Not enough time?', 'error');
            return;
        }
        
        if (calc.remaining < 100) {
            updateStatus(`Time too close (${calc.remaining}ms)! Need at least 100ms`, 'error');
            return;
        }
        
        // Store current attack data for saving
        state.currentAttackData = calc;
        
        // Show warning if max cancel was adjusted (only for Anti-Noble mode)
        if (state.currentMode === ATTACK_MODES.ON_CANCEL && 
            calc.adjustedMaxCancel.toFixed(1) !== maxCancel.toFixed(1)) {
            updateStatus(`⚠️ Max cancel adjusted to ${calc.adjustedMaxCancel.toFixed(1)}min`, 'warning');
        } else if (state.currentMode === ATTACK_MODES.ON_CANCEL) {
            updateStatus(`✅ Using ${maxCancel}min cancel time`, 'success');
        } else {
            updateStatus(`✅ Snipe mode: Arriving just before enemy`, 'success');
        }
        
        const duration = getDurationTime();
        state.fixedArriveTime = new Date(calc.clickTime.getTime() + duration);
        state.fixedReturnTime = new Date(state.fixedArriveTime.getTime() + duration);
        
        state.running = true;
        state.targetTime = calc.targetTime;
        state.clickTime = calc.clickTime;
        state.updateInterval = Math.max(1, Math.min(100, updateInterval));
        
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
        updateStatus(`✅ ${modeText} timer started! Clicking in ${(calc.remaining/1000).toFixed(1)}s (${attackDelay}ms delay + ${calc.latency.toFixed(1)}ms latency)`, 'success');
        
        startPrecisionTimer();
    }
    
    // Start precision timer
    function startPrecisionTimer() {
        if (state.timerId) {
            clearInterval(state.timerId);
        }
        
        let lastDisplayUpdate = 0;
        
        state.timerId = setInterval(() => {
            if (!state.running) return;
            
            const now = Date.now();
            const current = getEstimatedServerTime();
            const remaining = state.clickTime.getTime() - current.getTime();
            
            if (now - lastDisplayUpdate >= 50) {
                lastDisplayUpdate = now;
                
                document.getElementById('tw-current-display').textContent = `⏰ Server: ${formatTime(current)}`;
                document.getElementById('tw-remaining-text').textContent = `${remaining}ms`;
                
                updateDurationTimes(current);
                
                const remainingEl = document.getElementById('tw-remaining-text');
                if (remaining > 10000) {
                    remainingEl.className = '';
                } else if (remaining > 2000) {
                    remainingEl.className = 'tw-remaining-low';
                } else {
                    remainingEl.className = 'tw-remaining-critical';
                }
            }
            
            if (remaining <= 0) {
                clearInterval(state.timerId);
                state.timerId = null;
                executeAttack();
            }
        }, state.updateInterval);
    }
    
    // Execute attack
    function executeAttack() {
        // Save attack data BEFORE clicking the button
        saveAttackData();
        
        stopMainTimer();
        
        const attackBtn = document.querySelector('#troop_confirm_submit');
        if (!attackBtn) {
            updateStatus('❌ No attack button found!', 'error');
            return;
        }
        
        updateStatus('✅ Executing attack...', 'success');
        
        try {
            const originalOnclick = attackBtn.onclick;
            attackBtn.onclick = null;
            attackBtn.click();
            
            if (originalOnclick) {
                attackBtn.onclick = originalOnclick;
            }
            
            console.log('Attack data saved and button clicked!');
            
        } catch (error) {
            console.error('Error clicking attack button:', error);
            updateStatus('❌ Click error: ' + error.message, 'error');
            
            try {
                const form = attackBtn.closest('form');
                if (form) {
                    form.submit();
                }
            } catch (e) {
                console.error('Form submission failed:', e);
            }
        }
    }
    
    // Stop main timer
    function stopMainTimer() {
        state.running = false;
        
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
    
    // Update status
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
    
    // Initialize
    console.log('Precision Attack Timer loaded.');
    init();
    
})();
