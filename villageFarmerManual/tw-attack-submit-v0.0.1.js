// ===== TW Attack Script - Submit Module =====

(function() {
    'use strict';
    
    if (!window.TWAttack) return;
    
    const SubmitModule = {
        loadingOverlay: null,
        executed: false,
        
        config: {
            urlPattern: '&screen=place&try=confirm',
            elementId: 'troop_confirm_submit',
            maxRetries: 5,
            retryDelay: 200,
            initialDelay: { min: 100, max: 300 }
        },
        
        // Initialize submit module
        initialize: function() {
            this.runSubmitScript();
        },
        
        // Check session marker
        checkSessionMarker: function() {
            const worldName = window.TWAttack.state.currentWorld;
            const markerKey = window.TWAttack.config.storageKeys.submitMarker + "_" + worldName;
            const marker = sessionStorage.getItem(markerKey);
            
            if (marker) {
                sessionStorage.removeItem(markerKey);
                return true;
            }
            
            return false;
        },
        
        // Create loading overlay
        createSubmitLoadingOverlay: function() {
            if (this.loadingOverlay) return this.loadingOverlay;
            
            const overlay = document.createElement('div');
            overlay.className = 'tw-attack-overlay';
            
            const loadingContainer = document.createElement('div');
            loadingContainer.className = 'tw-submit-loading';
            
            const title = document.createElement('div');
            title.className = 'tw-submit-loading-title';
            title.textContent = '⚔️ TW Attack - Auto Submit';
            
            const status = document.createElement('div');
            status.className = 'tw-attack-status';
            status.id = 'tw-submit-status';
            status.textContent = 'Checking page...';
            
            const spinner = document.createElement('div');
            spinner.className = 'tw-submit-loading-spinner';
            
            loadingContainer.appendChild(title);
            loadingContainer.appendChild(status);
            loadingContainer.appendChild(spinner);
            overlay.appendChild(loadingContainer);
            
            document.body.appendChild(overlay);
            this.loadingOverlay = overlay;
            
            return overlay;
        },
        
        // Update submit status
        updateSubmitStatus: function(message, isError = false, isSuccess = false) {
            const statusElement = document.getElementById('tw-submit-status');
            if (statusElement) {
                statusElement.textContent = message;
                statusElement.className = 'tw-attack-status';
                if (isError) statusElement.classList.add('tw-attack-status-error');
                if (isSuccess) statusElement.classList.add('tw-attack-status-success');
            }
        },
        
        // Remove loading overlay
        removeSubmitLoadingOverlay: function() {
            if (this.loadingOverlay && this.loadingOverlay.parentNode) {
                this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
                this.loadingOverlay = null;
            }
        },
        
        // Run submit script
        runSubmitScript: function() {
            if (this.executed) return;
            
            if (!this.checkSessionMarker()) {
                this.executed = true;
                return;
            }
            
            if (!window.TWAttack.state.settings.autoAttackEnabled) {
                this.executed = true;
                return;
            }
            
            if (window.TWAttack.utils.checkForAntibot()) {
                this.executed = true;
                return;
            }
            
            if (!window.location.href.includes(this.config.urlPattern)) {
                return;
            }
            
            this.executed = true;
            
            this.createSubmitLoadingOverlay();
            this.updateSubmitStatus('✅ Submit page detected!');
            
            const initialDelay = Math.floor(
                Math.random() * (this.config.initialDelay.max - this.config.initialDelay.min + 1)
            ) + this.config.initialDelay.min;
            
            this.updateSubmitStatus(`⏳ Waiting ${initialDelay}ms...`);
            
            setTimeout(() => {
                let attempts = 0;
                
                const attemptClick = () => {
                    if (window.TWAttack.utils.checkForAntibot()) {
                        this.updateSubmitStatus('❌ Antibot captcha detected!', true);
                        setTimeout(() => {
                            this.removeSubmitLoadingOverlay();
                        }, 3000);
                        return;
                    }
                    
                    attempts++;
                    
                    const button = document.getElementById(this.config.elementId);
                    
                    if (button) {
                        this.updateSubmitStatus(`✅ Found button! Clicking...`, false, true);
                        
                        setTimeout(() => {
                            button.click();
                            this.updateSubmitStatus('🎉 Success! Button clicked.', false, true);
                            
                            setTimeout(() => {
                                this.removeSubmitLoadingOverlay();
                            }, 1500);
                            
                        }, 100);
                        
                        return;
                    }
                    
                    if (attempts < this.config.maxRetries) {
                        this.updateSubmitStatus(`⚠️ Button not found. Retrying...`);
                        
                        setTimeout(attemptClick, this.config.retryDelay);
                    } else {
                        this.updateSubmitStatus(`❌ Failed after ${this.config.maxRetries} attempts.`, true);
                        
                        setTimeout(() => {
                            this.removeSubmitLoadingOverlay();
                        }, 3000);
                    }
                };
                
                attemptClick();
                
            }, initialDelay);
        }
    };
    
    // Register module with main
    window.TWAttack.registerModule('submit', SubmitModule);
    
    console.log('TW Attack: Submit module loaded');
    
})();
