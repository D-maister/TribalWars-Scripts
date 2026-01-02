(function() {
    console.log('=== Tribal Wars Attack Form Test ===');
    
    // Get current village ID from URL
    function getCurrentVillageId() {
        var url = window.location.href;
        var match = url.match(/[?&]village=(\d+)/);
        return match ? match[1] : null;
    }
    
    // Get CSRF token from game data
    function getCsrfToken() {
        // Try to get from window.TWGame
        if (window.TWGame && window.TWGame.csrf) {
            return window.TWGame.csrf;
        }
        
        // Try to get from script tags
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var content = scripts[i].textContent || scripts[i].innerText;
            var match = content.match(/csrf["']?\s*:\s*["']([^"']+)["']/);
            if (match) {
                return match[1];
            }
        }
        
        return null;
    }
    
    // Step 1: Get the attack form (first AJAX request)
    function getAttackForm(attackerId, targetId) {
        console.log('📋 Step 1: Getting attack form...');
        
        // Build the exact URL from your example
        var ajaxUrl = window.location.origin + '/game.php?' + 
                      'village=' + attackerId + 
                      '&screen=place' + 
                      '&ajax=command' + 
                      '&target=' + targetId;
        
        console.log('📤 Request URL:', ajaxUrl);
        console.log('🔑 CSRF Token:', getCsrfToken());
        
        // Prepare headers exactly like the game
        var headers = {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "tribalwars-ajax": "1",
            "x-requested-with": "XMLHttpRequest"
        };
        
        // Add CSRF token to headers if available
        var csrf = getCsrfToken();
        if (csrf) {
            headers["x-csrf-token"] = csrf;
        }
        
        return fetch(ajaxUrl, {
            headers: headers,
            referrer: window.location.href,
            referrerPolicy: "strict-origin-when-cross-origin",
            body: null,
            method: "GET",
            mode: "cors",
            credentials: "include"
        })
        .then(response => {
            console.log('📥 Response status:', response.status, response.statusText);
            
            // Check if response is JSON
            var contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                return response.text();
            }
        })
        .then(data => {
            console.log('✅ Step 1 complete: Got response');
            
            // Handle JSON response (contains dialog HTML)
            if (typeof data === 'object' && data.response && data.response.dialog) {
                console.log('📄 Response is JSON with dialog');
                return parseFormFromResponse(data.response.dialog, attackerId, targetId);
            } 
            // Handle plain HTML response
            else if (typeof data === 'string') {
                console.log('📄 Response is HTML string');
                return parseFormFromResponse(data, attackerId, targetId);
            } 
            else {
                console.error('❓ Unexpected response type:', typeof data);
                console.log('Raw response:', data);
                throw new Error('Unexpected response format');
            }
        })
        .catch(error => {
            console.error('❌ Error getting attack form:', error);
            throw error;
        });
    }
    
    // Parse form from HTML response
    function parseFormFromResponse(html, attackerId, targetId) {
        console.log('🔍 Parsing form HTML...');
        
        // Create a temporary DOM to parse the HTML
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Find the form
        var form = tempDiv.querySelector('#command-data-form');
        if (!form) {
            console.error('❌ Form not found in response');
            console.log('Available elements:', Array.from(tempDiv.children).map(el => el.tagName));
            throw new Error('Form not found in response');
        }
        
        // Extract form action and hidden inputs
        var formData = {
            action: form.action,
            method: form.method,
            inputs: {}
        };
        
        // Get all hidden inputs
        var hiddenInputs = form.querySelectorAll('input[type="hidden"]');
        hiddenInputs.forEach(input => {
            formData.inputs[input.name] = input.value;
            console.log('📝 Hidden input:', input.name, '=', input.value);
        });
        
        // Get available troops from data-all-count attributes
        var troops = {};
        var unitInputs = form.querySelectorAll('input.unitsInput');
        unitInputs.forEach(input => {
            var unitName = input.name;
            var count = parseInt(input.getAttribute('data-all-count')) || 0;
            troops[unitName] = count;
        });
        
        // Also try to get from units-entry-all links as backup
        if (Object.keys(troops).length === 0) {
            ['spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult', 'knight', 'snob'].forEach(unit => {
                var element = tempDiv.querySelector('#units_entry_all_' + unit);
                if (element) {
                    var match = element.textContent.match(/\((\d+)\)/);
                    troops[unit] = match ? parseInt(match[1]) : 0;
                } else {
                    troops[unit] = 0;
                }
            });
        }
        
        console.log('📊 Available troops:', troops);
        console.log('📋 Form action:', formData.action);
        
        return {
            html: html,
            formData: formData,
            troops: troops,
            targetId: targetId,
            attackerId: attackerId,
            parsedForm: form.outerHTML // For debugging
        };
    }
    
    // Test function
    function testAttackForm(targetId) {
        var attackerId = getCurrentVillageId();
        
        if (!attackerId) {
            alert('❌ Could not find village ID in URL. Make sure you are on a village page.');
            return;
        }
        
        if (!targetId || isNaN(targetId)) {
            targetId = prompt('Enter target village ID:', '146');
            if (!targetId || isNaN(targetId)) {
                alert('Please enter a valid village ID');
                return;
            }
        }
        
        console.log('🎯 Starting test...');
        console.log('Attacker village ID:', attackerId);
        console.log('Target village ID:', targetId);
        console.log('Current URL:', window.location.href);
        
        getAttackForm(attackerId, targetId)
            .then(formInfo => {
                console.log('✅ Successfully retrieved attack form!');
                console.log('Form info:', formInfo);
                
                // Display the form in a dialog
                displayFormDialog(formInfo);
                
                // Make form info available globally
                window.lastFormInfo = formInfo;
                
                return formInfo;
            })
            .catch(error => {
                console.error('❌ Failed to get attack form:', error);
                alert('Failed to get attack form: ' + error.message);
            });
    }
    
    // Display form in a dialog
    function displayFormDialog(formInfo) {
        // Remove existing dialog if any
        var existingDialog = document.getElementById('attack-form-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }
        
        // Create dialog
        var dialog = document.createElement('div');
        dialog.id = 'attack-form-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #333;
            padding: 20px;
            z-index: 10000;
            max-width: 80%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            border-radius: 8px;
        `;
        
        // Create close button
        var closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
        `;
        closeBtn.onclick = function() {
            dialog.remove();
        };
        
        // Add content
        var content = document.createElement('div');
        content.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">Attack Form for Village ${formInfo.targetId}</h3>
            <div style="margin-bottom: 15px;">
                <strong>Form Action:</strong> ${formInfo.formData.action}
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>Available Troops:</strong>
                <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px;">${JSON.stringify(formInfo.troops, null, 2)}</pre>
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>Hidden Inputs:</strong>
                <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px;">${JSON.stringify(formInfo.formData.inputs, null, 2)}</pre>
            </div>
            
            <details>
                <summary>View Form HTML</summary>
                <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 10px; max-height: 300px; overflow: auto;">${escapeHtml(formInfo.parsedForm)}</pre>
            </details>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
                <button id="next-step-btn" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    Next: Submit Troops →
                </button>
            </div>
        `;
        
        dialog.appendChild(closeBtn);
        dialog.appendChild(content);
        document.body.appendChild(dialog);
        
        // Add next step button handler
        document.getElementById('next-step-btn').onclick = function() {
            dialog.remove();
            // Store for next step
            window.lastFormInfo = formInfo;
            alert('Form retrieved successfully! Check console for details.\n\nAvailable functions:\n- window.testAttackForm(targetId)\n- window.lastFormInfo (contains form data)\n- window.getCurrentVillageId()');
        };
    }
    
    // Utility function to escape HTML
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Create test button
    function createTestButton() {
        var btn = document.createElement('button');
        btn.textContent = '⚔️ Get Attack Form';
        btn.title = 'Test attack form retrieval for a target village';
        
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-family: Arial, sans-serif;
            transition: transform 0.2s;
        `;
        
        btn.onmouseover = function() {
            this.style.transform = 'scale(1.05)';
        };
        
        btn.onmouseout = function() {
            this.style.transform = 'scale(1)';
        };
        
        btn.onclick = function() {
            var targetId = prompt('Enter target village ID:', '146');
            if (targetId && !isNaN(targetId)) {
                testAttackForm(parseInt(targetId));
            }
        };
        
        document.body.appendChild(btn);
    }
    
    // Make functions available globally
    window.testAttackForm = testAttackForm;
    window.getCurrentVillageId = getCurrentVillageId;
    window.getAttackForm = getAttackForm;
    
    // Initialize
    console.log('⚔️ Tribal Wars Attack Form Test Script Loaded');
    console.log('Current village ID:', getCurrentVillageId());
    console.log('Available functions:');
    console.log('- testAttackForm(targetId) - Get attack form for target village');
    console.log('- getAttackForm(attackerId, targetId) - Low-level function');
    console.log('- getCurrentVillageId() - Get current village ID');
    
    // Create button after a short delay
    setTimeout(createTestButton, 1000);
    
    // Auto-test if URL has target parameter
    var urlParams = new URLSearchParams(window.location.search);
    var targetParam = urlParams.get('test_target');
    if (targetParam && !isNaN(targetParam)) {
        setTimeout(function() {
            console.log('Auto-testing with target:', targetParam);
            testAttackForm(parseInt(targetParam));
        }, 2000);
    }
    
})();
