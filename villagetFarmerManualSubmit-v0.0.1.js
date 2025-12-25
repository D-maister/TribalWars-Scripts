(function() {
    console.log('🚀 Bookmarklet started - checking session storage marker...');
    
    // ===== STYLES =====
    const styles = `
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
        
        .tw-submit-loading-status {
            font-size: 14px;
            margin-bottom: 10px;
            color: #fff;
        }
        
        .tw-submit-loading-attempt {
            font-size: 12px;
            color: #ccc;
            margin-bottom: 5px;
        }
        
        .tw-submit-loading-error {
            font-size: 14px;
            margin-bottom: 10px;
            color: #ff6b6b;
            font-weight: bold;
        }
        
        .tw-submit-loading-success {
            font-size: 14px;
            margin-bottom: 10px;
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
        
        .tw-submit-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 99998;
            display: flex;
            justify-content: center;
            align-items: center;
        }
    `;

    // Add styles to the page
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    // ===== CONFIGURATION =====
    const CONFIG = {
        urlPattern: '&screen=place&try=confirm',
        elementId: 'troop_confirm_submit',
        maxRetries: 5,
        retryDelay: 200,
        initialDelay: { min: 100, max: 300 },
        urlCheckInterval: 500,
        submitMarkerKey: 'twAttackSubmitMarker'
    };
    
    let scriptExecuted = false;
    let loadingOverlay = null;
    
    // ===== HELPER FUNCTIONS =====
    
    function getWorldName() {
        const url = window.location.href;
        const match = url.match(/https?:\/\/([^\/]+?)\.voynaplemyon\./);
        return match ? match[1] : "unknown";
    }
    
    function checkSessionMarker() {
        const worldName = getWorldName();
        const markerKey = CONFIG.submitMarkerKey + "_" + worldName;
        const marker = sessionStorage.getItem(markerKey);
        
        if (marker) {
            console.log(`✅ Session storage marker found: ${markerKey} = ${marker}`);
            
            // Remove the marker so this script doesn't run again
            sessionStorage.removeItem(markerKey);
            console.log(`🗑️ Session storage marker removed: ${markerKey}`);
            
            return true;
        }
        
        console.log(`❌ No session storage marker found for world: ${worldName}`);
        console.log(`Looking for key: ${markerKey}`);
        
        // Debug: list all session storage keys
        console.log('All session storage keys:', Object.keys(sessionStorage));
        
        return false;
    }
    
    function createLoadingOverlay() {
        if (loadingOverlay) return loadingOverlay;
        
        const overlay = document.createElement('div');
        overlay.className = 'tw-submit-overlay';
        
        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'tw-submit-loading';
        
        const title = document.createElement('div');
        title.className = 'tw-submit-loading-title';
        title.textContent = '⚔️ TW Attack - Auto Submit';
        
        const status = document.createElement('div');
        status.className = 'tw-submit-loading-status';
        status.id = 'tw-submit-status';
        status.textContent = 'Checking page...';
        
        const attempts = document.createElement('div');
        attempts.className = 'tw-submit-loading-attempt';
        attempts.id = 'tw-submit-attempts';
        
        const spinner = document.createElement('div');
        spinner.className = 'tw-submit-loading-spinner';
        
        loadingContainer.appendChild(title);
        loadingContainer.appendChild(status);
        loadingContainer.appendChild(attempts);
        loadingContainer.appendChild(spinner);
        overlay.appendChild(loadingContainer);
        
        document.body.appendChild(overlay);
        loadingOverlay = overlay;
        
        return overlay;
    }
    
    function updateStatus(message, isError = false, isSuccess = false) {
        const statusElement = document.getElementById('tw-submit-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = isError ? 'tw-submit-loading-error' : 
                                       isSuccess ? 'tw-submit-loading-success' : 
                                       'tw-submit-loading-status';
        }
    }
    
    function updateAttempts(message) {
        const attemptsElement = document.getElementById('tw-submit-attempts');
        if (attemptsElement) {
            attemptsElement.textContent = message;
        }
    }
    
    function removeLoadingOverlay() {
        if (loadingOverlay && loadingOverlay.parentNode) {
            loadingOverlay.parentNode.removeChild(loadingOverlay);
            loadingOverlay = null;
        }
    }
    
    // ===== MAIN EXECUTION =====
    
    function checkAndExecute() {
        // Skip if script already executed
        if (scriptExecuted) {
            return;
        }
        
        // Check session storage marker first
        if (!checkSessionMarker()) {
            console.log('⏹️ No session storage marker found - stopping script');
            scriptExecuted = true;
            
            // Show brief message then hide
            createLoadingOverlay();
            updateStatus('❌ Script not triggered by attack script', true);
            
            setTimeout(() => {
                removeLoadingOverlay();
            }, 3000);
            
            return;
        }
        
        // Antibot captcha detection
        const antibotCheck1 = document.querySelector('td.bot-protection-row');
        const antibotCheck2 = document.getElementById('botprotection_quest');
        
        if (antibotCheck1 || antibotCheck2) {
            alert('⚠️ Check for ANTIBOT CAPTCHA');
            scriptExecuted = true;
            console.error('❌ Antibot captcha detected! Stopping.');
            
            createLoadingOverlay();
            updateStatus('❌ Antibot captcha detected!', true);
            
            setTimeout(() => {
                removeLoadingOverlay();
            }, 3000);
            
            return;
        }
        
        // Check URL pattern
        if (!window.location.href.includes(CONFIG.urlPattern)) {
            console.log('⏳ Not the target page, waiting...');
            
            // Show loading overlay with status
            if (!loadingOverlay) {
                createLoadingOverlay();
                updateStatus('⏳ Waiting for submit page...');
                updateAttempts('Checking URL pattern...');
            }
            
            return; // Continue checking
        }
        
        console.log('✅ Target page detected!');
        scriptExecuted = true;
        
        // Update status
        createLoadingOverlay();
        updateStatus('✅ Target page detected!');
        
        // Initial delay before finding element
        const initialDelay = Math.floor(
            Math.random() * (CONFIG.initialDelay.max - CONFIG.initialDelay.min + 1)
        ) + CONFIG.initialDelay.min;
        
        console.log(`⏳ Initial delay: ${initialDelay}ms before finding element...`);
        updateStatus(`⏳ Waiting ${initialDelay}ms...`);
        
        setTimeout(() => {
            let attempts = 0;
            
            function attemptClick() {
                // Check antibot before each attempt
                if (document.querySelector('td.bot-protection-row') || 
                    document.getElementById('botprotection_quest')) {
                    alert('⚠️ Check for ANTIBOT CAPTCHA');
                    console.error('❌ Antibot captcha detected during execution!');
                    
                    updateStatus('❌ Antibot captcha detected!', true);
                    
                    setTimeout(() => {
                        removeLoadingOverlay();
                    }, 3000);
                    
                    return;
                }
                
                attempts++;
                console.log(`🔍 Attempt ${attempts}/${CONFIG.maxRetries}: Looking for button...`);
                updateAttempts(`Attempt ${attempts}/${CONFIG.maxRetries}: Looking for button...`);
                
                const button = document.getElementById(CONFIG.elementId);
                
                if (button) {
                    console.log(`✅ Found on attempt ${attempts}! Clicking #${CONFIG.elementId}...`);
                    updateStatus(`✅ Found button! Clicking...`, false, true);
                    updateAttempts(`Found on attempt ${attempts}!`);
                    
                    // Small delay before clicking
                    setTimeout(() => {
                        button.click();
                        console.log('🎉 Success! Button clicked.');
                        updateStatus('🎉 Success! Button clicked.', false, true);
                        
                        // Remove overlay after success
                        setTimeout(() => {
                            removeLoadingOverlay();
                        }, 1500);
                        
                    }, 100);
                    
                    return;
                }
                
                // If not found and we have more retries
                if (attempts < CONFIG.maxRetries) {
                    console.log(`⚠️ Not found. Retrying in ${CONFIG.retryDelay}ms...`);
                    updateStatus(`⚠️ Button not found. Retrying...`);
                    
                    setTimeout(attemptClick, CONFIG.retryDelay);
                } else {
                    console.error(`❌ Failed after ${CONFIG.maxRetries} attempts.`);
                    updateStatus(`❌ Failed after ${CONFIG.maxRetries} attempts.`, true);
                    updateAttempts('');
                    
                    alert(`Could not find #${CONFIG.elementId} after ${CONFIG.maxRetries} attempts.\n\nThe page may still be loading or the element ID has changed.`);
                    
                    // Remove overlay after error
                    setTimeout(() => {
                        removeLoadingOverlay();
                    }, 3000);
                }
            }
            
            // Start attempts to find and click
            attemptClick();
            
        }, initialDelay);
    }
    
    // ===== INITIALIZATION =====
    
    // Start checking URL pattern immediately and every 500ms
    const checkInterval = setInterval(checkAndExecute, CONFIG.urlCheckInterval);
    
    // Also check immediately on start
    checkAndExecute();
    
    // Auto-stop after some time (e.g., 5 minutes) to prevent infinite checking
    setTimeout(() => {
        if (!scriptExecuted) {
            clearInterval(checkInterval);
            console.log('⏰ Stopped checking after timeout (page not found)');
            
            if (loadingOverlay) {
                updateStatus('⏰ Stopped after timeout', true);
                
                setTimeout(() => {
                    removeLoadingOverlay();
                }, 2000);
            }
        }
    }, 5 * 60 * 1000); // 5 minutes timeout
    
})();
