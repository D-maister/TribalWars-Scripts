// ===== TW Attack Script - Styles =====

(function() {
    'use strict';
    
    if (!window.TWAttack) return;
    
    const styles = `
        /* Main config styles */
        .tw-attack-config {
            background: white;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: Arial, sans-serif;
        }
        
        .tw-attack-title {
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 8px;
            font-size: 16px;
        }
        
        .tw-attack-toggle-btn {
            background: #666;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 10px;
            font-size: 12px;
            font-weight: bold;
            width: 100%;
            transition: background 0.2s;
        }
        
        .tw-attack-toggle-btn:hover {
            background: #555;
        }
        
        .tw-attack-auto-container {
            display: flex;
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .tw-attack-auto-btn {
            color: white;
            border: none;
            padding: 8px 0;
            border-radius: 6px;
            cursor: pointer;
            flex: 1;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .tw-attack-auto-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }
        
        .tw-attack-auto-btn-a {
            background: linear-gradient(to right, #ff416c, #ff4b2b);
        }
        
        .tw-attack-auto-btn-b {
            background: linear-gradient(to right, #2196F3, #1976D2);
        }
        
        .tw-attack-auto-btn-c {
            background: linear-gradient(to right, #9C27B0, #7B1FA2);
        }
        
        /* Info village panel styles */
        .tw-attack-info-panel {
            background: white;
            border: 2px solid #4CAF50;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            width: 100%;
            max-width: 400px;
            box-sizing: border-box;
        }
        
        .tw-attack-info-title {
            margin-top: 0;
            margin-bottom: 12px;
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 8px;
            font-size: 16px;
        }
        
        .tw-attack-info-coords {
            font-family: monospace;
            font-weight: bold;
            font-size: 18px;
            color: #333;
            margin-bottom: 12px;
            text-align: center;
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #e9ecef;
        }
        
        .tw-attack-info-build-buttons {
            display: flex;
            gap: 10px;
            margin-bottom: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .tw-attack-info-build-container {
            position: relative;
            display: inline-block;
        }
        
        .tw-attack-info-build-btn {
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
            min-width: 80px;
            position: relative;
        }
        
        .tw-attack-info-build-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }
        
        /* Build A - Red */
        .tw-attack-info-build-btn.a {
            background: linear-gradient(to right, #ff416c, #ff4b2b);
        }
        
        .tw-attack-info-build-btn.a.not-checked {
            background: linear-gradient(to right, #cccccc, #999999) !important;
            color: #666666 !important;
        }
        
        /* Build B - Blue */
        .tw-attack-info-build-btn.b {
            background: linear-gradient(to right, #2196F3, #1976D2);
        }
        
        .tw-attack-info-build-btn.b.not-checked {
            background: linear-gradient(to right, #cccccc, #999999) !important;
            color: #666666 !important;
        }
        
        /* Build C - Purple */
        .tw-attack-info-build-btn.c {
            background: linear-gradient(to right, #9C27B0, #7B1FA2);
        }
        
        .tw-attack-info-build-btn.c.not-checked {
            background: linear-gradient(to right, #cccccc, #999999) !important;
            color: #666666 !important;
        }
        
        /* Disabled state - completely grayed out (disabled in settings) */
        .tw-attack-info-build-btn.disabled {
            background: linear-gradient(to right, #cccccc, #999999) !important;
            color: #666666 !important;
            cursor: not-allowed !important;
            opacity: 0.5 !important;
        }
        
        .tw-attack-info-build-btn.disabled:hover {
            transform: none !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        
        /* Enabled and checked state */
        .tw-attack-info-build-btn.checked {
            box-shadow: 0 0 0 3px rgba(0,0,0,0.2);
            opacity: 1;
        }
        
        .tw-attack-info-cooldown-indicator {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #ff6b6b;
            color: white;
            font-size: 9px;
            padding: 1px 4px;
            border-radius: 8px;
            border: 1px solid white;
            font-weight: bold;
            z-index: 2;
        }
        
        .tw-attack-info-cooldown-indicator.ready {
            background: #4CAF50 !important;
        }
        
        .tw-attack-info-cooldown-indicator.disabled {
            background: #cccccc !important;
            color: #666666 !important;
        }
        
        .tw-attack-info-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .tw-attack-info-action-btn {
            padding: 8px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 12px;
            border: none;
            color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
            flex: 1;
            max-width: 150px;
        }
        
        .tw-attack-info-action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }
        
        /* Toggle button (Add/Remove) */
        .tw-attack-info-toggle-btn.add {
            background: linear-gradient(to right, #4CAF50, #45a049) !important;
        }
        
        .tw-attack-info-toggle-btn.remove {
            background: linear-gradient(to right, #ff4444, #ff3333) !important;
        }
        
        .tw-attack-info-ignore-btn {
            background: linear-gradient(to right, #ff9800, #f57c00);
        }
        
        .tw-attack-info-status {
            margin-top: 12px;
            padding: 6px;
            border-radius: 6px;
            display: none;
            font-size: 11px;
            text-align: center;
        }
        
        .tw-attack-info-status.tw-attack-status-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .tw-attack-info-status.tw-attack-status-error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        /* World info styles */
        .tw-attack-world-info {
            margin-bottom: 15px;
            padding: 12px;
            background-color: #f8f9fa;
            border-radius: 6px;
            border: 1px solid #e9ecef;
            font-size: 12px;
        }
        
        /* Section styles */
        .tw-attack-section {
            margin-bottom: 15px;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #ffecb3;
            display: none;
        }
        
        .tw-attack-section-settings {
            background-color: #fff8e1;
            border-color: #ffecb3;
        }
        
        .tw-attack-section-builds {
            background-color: #fff8e1;
            border-color: #ffecb3;
        }
        
        .tw-attack-section-title {
            margin-top: 0;
            margin-bottom: 12px;
            color: #333;
            font-size: 14px;
        }
        
        /* Setting row styles */
        .tw-attack-setting-row {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 8px;
            background: #fff;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
        }
        
        .tw-attack-setting-label {
            margin-right: 10px;
            font-weight: bold;
            min-width: 150px;
            font-size: 12px;
        }
        
        .tw-attack-input {
            padding: 4px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 12px;
        }
        
        /* Button styles */
        .tw-attack-save-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            width: 100%;
            margin-top: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: background 0.2s;
        }
        
        .tw-attack-save-btn:hover {
            background: #45a049;
        }
        
        /* Build container styles */
        .tw-attack-build-container {
            margin-bottom: 12px;
            padding: 10px;
            background: #fff;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
        }
        
        .tw-attack-build-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 2px solid #4CAF50;
        }
        
        .tw-attack-build-title {
            font-weight: bold;
            font-size: 14px;
            color: #4CAF50;
        }
        
        .tw-attack-build-title-b {
            color: #2196F3;
        }
        
        .tw-attack-build-title-c {
            color: #9C27B0;
        }
        
        .tw-attack-build-save-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            font-weight: bold;
        }
        
        .tw-attack-build-save-btn:hover {
            opacity: 0.9;
        }
        
        .tw-attack-build-save-btn-b {
            background: #2196F3;
        }
        
        .tw-attack-build-save-btn-c {
            background: #9C27B0;
        }
        
        /* Troops grid */
        .tw-attack-troops-grid {
            display: grid;
            grid-template-columns: repeat(9, 1fr);
            gap: 4px;
        }
        
        .tw-attack-troop-input {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .tw-attack-troop-label {
            font-size: 10px;
            font-weight: bold;
            color: #666;
            margin-bottom: 2px;
            text-align: center;
            width: 100%;
        }
        
        .tw-attack-troop-field {
            padding: 3px;
            border: 1px solid #ddd;
            border-radius: 3px;
            text-align: center;
            font-size: 11px;
            width: 40px;
            box-sizing: border-box;
        }
        
        /* Textarea */
        .tw-attack-textarea {
            width: 100%;
            height: 80px;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-family: monospace;
            font-size: 12px;
            resize: vertical;
            box-sizing: border-box;
            margin-bottom: 10px;
        }
        
        /* Parse button */
        .tw-attack-parse-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 6px;
            cursor: pointer;
            width: 100%;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: background 0.2s;
        }
        
        .tw-attack-parse-btn:hover {
            background: #45a049;
        }
        
        /* Status messages */
        .tw-attack-status {
            font-size: 12px;
            margin-bottom: 12px;
            padding: 8px;
            border-radius: 6px;
            display: none;
        }
        
        .tw-attack-status-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .tw-attack-status-error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        /* Targets container */
        .tw-attack-targets-container {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #ddd;
        }
        
        /* Clear button */
        .tw-attack-clear-btn {
            background: #ff4444;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 12px;
            width: 100%;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: background 0.2s;
        }
        
        .tw-attack-clear-btn:hover {
            background: #ff3333;
        }
        
        /* Target item styles */
        .tw-attack-target-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 8px;
            margin: 2px 0;
            background: #f8f9fa;
            border-radius: 4px;
            border: 1px solid #e9ecef;
            transition: transform 0.2s, box-shadow 0.2s;
            font-size: 11px;
            line-height: 1.2;
        }
        
        .tw-attack-target-item:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .tw-attack-target-info {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .tw-attack-target-coords {
            font-family: monospace;
            font-weight: bold;
            font-size: 12px;
            color: #333;
            min-width: 60px;
        }
        
        .tw-attack-target-details {
            font-size: 10px;
            color: #666;
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        /* Action buttons */
        .tw-attack-action-buttons {
            display: flex;
            gap: 4px;
            margin: 0 8px;
        }
        
        .tw-attack-action-btn {
            color: white;
            border: none;
            padding: 3px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-weight: bold;
            min-width: 24px;
            height: 20px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            transition: transform 0.2s, box-shadow 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .tw-attack-action-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 2px 3px rgba(0,0,0,0.15);
        }
        
        .tw-attack-action-btn-a {
            background: #4CAF50;
        }
        
        .tw-attack-action-btn-b {
            background: #2196F3;
        }
        
        .tw-attack-action-btn-c {
            background: #9C27B0;
        }
        
        .tw-attack-action-btn-checkbox {
            background: #e0e0e0;
            color: #666;
            border: 2px solid #999;
        }
        
        .tw-attack-action-btn-checkbox.checked {
            background: #4CAF50;
            color: white;
            border-color: #4CAF50;
        }
        
        .tw-attack-action-btn-checkbox.checked.b {
            background: #2196F3;
            border-color: #2196F3;
        }
        
        .tw-attack-action-btn-checkbox.checked.c {
            background: #9C27B0;
            border-color: #9C27B0;
        }
        
        /* Other buttons */
        .tw-attack-ignore-btn {
            background: #ff9800;
            color: white;
            border: none;
            padding: 3px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            width: 24px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            transition: transform 0.2s, background 0.2s;
        }
        
        .tw-attack-ignore-btn:hover {
            background: #f57c00;
        }
        
        .tw-attack-remove-btn {
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 3px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            font-weight: bold;
            width: 24px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            transition: transform 0.2s, background 0.2s;
        }
        
        .tw-attack-remove-btn:hover {
            background: #ff5555;
        }
        
        .tw-attack-attack-btn {
            background: #ff4444;
            color: white;
            border: none;
            padding: 3px 6px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 10px;
            width: 24px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            transition: transform 0.2s, background 0.2s;
        }
        
        .tw-attack-attack-btn:hover {
            background: #ff3333;
        }
        
        .tw-attack-attack-btn:disabled {
            background: #cccccc;
            cursor: not-allowed;
            opacity: 0.5;
        }
        
        /* Manage button */
        .tw-attack-manage-btn {
            background: #ff9800;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            margin-bottom: 10px;
            width: 100%;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: background 0.2s;
        }
        
        .tw-attack-manage-btn:hover {
            background: #f57c00;
        }
        
        /* Village tags */
        .tw-attack-village-tag {
            font-size: 10px;
            padding: 1px 4px;
            border-radius: 8px;
            font-weight: bold;
            white-space: nowrap;
            display: inline-block;
        }
        
        .tw-attack-village-tag-bonus {
            background-color: #FFF8DC;
            color: #B8860B;
            border: 1px solid #FFD700;
        }
        
        .tw-attack-village-tag-player {
            background-color: #FFE6E6;
            color: #B22222;
            border: 1px solid #ff4444;
        }
        
        .tw-attack-village-tag-barbarian {
            background-color: #f0f0f0;
            color: #666;
            border: 1px solid #ccc;
        }
        
        /* Points badge */
        .tw-attack-points-badge {
            font-size: 10px;
            background-color: #e3f2fd;
            color: #1976D2;
            padding: 1px 4px;
            border-radius: 8px;
            border: 1px solid #bbdefb;
            font-weight: bold;
            white-space: nowrap;
            display: inline-block;
        }
        
        /* Build cooldown indicators */
        .tw-attack-build-cooldown-indicator {
            font-size: 9px;
            padding: 1px 3px;
            border-radius: 3px;
            margin-left: 2px;
            font-weight: bold;
        }
        
        .tw-attack-build-cooldown-ready {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .tw-attack-build-cooldown-waiting {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        .tw-attack-build-cooldown-cooldown {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        /* Bonus star and player circle */
        .tw-attack-bonus-star {
            color: #FFD700;
            font-size: 12px;
            margin-left: 4px;
        }
        
        .tw-attack-player-circle {
            color: #ff4444;
            font-size: 12px;
            margin-left: 4px;
        }
        
        /* Submit loading overlay */
        .tw-submit-loading {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            z-index: 99999;
            font-family: Arial, sans-serif;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            text-align: center;
            min-width: 300px;
            border: 2px solid #4CAF50;
        }
        
        .tw-submit-loading-title {
            font-size: 18px;
            margin-bottom: 15px;
            color: #4CAF50;
            font-weight: bold;
        }
        
        .tw-submit-loading-spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid #4CAF50;
            width: 40px;
            height: 40px;
            animation: twSubmitSpin 1s linear infinite;
            margin: 15px auto;
        }
        
        @keyframes twSubmitSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Selection overlay styles */
        .tw-attack-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .tw-attack-selection-container {
            background: white;
            border-radius: 10px;
            padding: 20px;
            width: 600px;
            max-width: 90vw;
            max-height: 80vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .tw-attack-villages-container {
            flex: 1;
            overflow-y: auto;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 10px;
            background: #f8f9fa;
            min-height: 200px;
            margin: 10px 0;
        }
        
        .tw-attack-village-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 10px;
            margin: 4px 0;
            background: #fff;
            border-radius: 6px;
            border: 1px solid #e9ecef;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .tw-attack-village-item:hover {
            background-color: #e9ecef;
        }
        
        .tw-attack-village-item.selected {
            background-color: #e8f5e9;
        }
    `;
    
    // Add styles to the page
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
    
    console.log('TW Attack: Styles loaded');
    
})();
