(function() {
    console.log('=== Tribal Wars Attack Form Test (Fixed) ===');
    
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
            console.log('📄 Content-Type:', response.headers.get('content-type'));
            
            // First, try to get as text to see what we're dealing with
            return response.text().then(text => {
                console.log('📝 Raw response preview (first 500 chars):', text.substring(0, 500));
                
                // Try to parse as JSON
                try {
                    var jsonData = JSON.parse(text);
                    console.log('✅ Successfully parsed as JSON');
                    return { type: 'json', data: jsonData, raw: text };
                } catch (e) {
                    console.log('⚠️ Not JSON, treating as HTML');
                    return { type: 'html', data: text, raw: text };
                }
            });
        })
        .then(parsedResponse => {
            console.log('✅ Step 1 complete: Got response');
            
            if (parsedResponse.type === 'json') {
                // Handle JSON response
                var jsonData = parsedResponse.data;
                
                if (jsonData.response && jsonData.response.dialog) {
                    console.log('📄 Found dialog in JSON response');
                    return parseFormFromHtml(jsonData.response.dialog, attackerId, targetId);
                } else if (jsonData.dialog) {
                    console.log('📄 Found dialog at root level');
                    return parseFormFromHtml(jsonData.dialog, attackerId, targetId);
                } else {
                    console.error('❓ JSON response structure unexpected:', Object.keys(jsonData));
                    console.log('Full response:', jsonData);
                    throw new Error('No dialog found in JSON response');
                }
            } else {
                // Handle HTML response directly
                console.log('📄 Response is raw HTML');
                return parseFormFromHtml(parsedResponse.data, attackerId, targetId);
            }
        })
        .catch(error => {
            console.error('❌ Error getting attack form:', error);
            console.error('Error stack:', error.stack);
            throw error;
        });
    }
    
    // Parse form from HTML
    function parseFormFromHtml(html, attackerId, targetId) {
        console.log('🔍 Parsing form HTML...');
        console.log('📏 HTML length:', html.length);
        console.log('🔍 Looking for form elements...');
        
        // Create a temporary DOM to parse the HTML
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        // Try to find the form by different selectors
        var form = tempDiv.querySelector('#command-data-form') || 
                   tempDiv.querySelector('form[name="units"]') ||
                   tempDiv.querySelector('form[action*="screen=place"]');
        
        if (!form) {
            console.error('❌ Form not found!');
            console.log('Available form elements:', tempDiv.querySelectorAll('form').length);
            console.log('HTML structure preview:', tempDiv.innerHTML.substring(0, 1000));
            
            // Check if there's any form at all
            var allForms = tempDiv.querySelectorAll('form');
            if (allForms.length > 0) {
                console.log('Found forms:', allForms.length);
                allForms.forEach((f, i) => {
                    console.log(`Form ${i}:`, f.outerHTML.substring(0, 200));
                });
            }
            
            throw new Error('Form not found in response');
        }
        
        console.log('✅ Form found!');
        
        // Extract form action and hidden inputs
        var formData = {
            action: form.action || form.getAttribute('action'),
            method: form.method || 'post',
            inputs: {}
        };
        
        // Get all hidden inputs
        var hiddenInputs = form.querySelectorAll('input[type="hidden"]');
        console.log('📝 Found hidden inputs:', hiddenInputs.length);
        hiddenInputs.forEach(input => {
            formData.inputs[input.name] = input.value;
            console.log('  -', input.name, '=', input.value.substring(0, 50) + (input.value.length > 50 ? '...' : ''));
        });
        
        // Get available troops from data-all-count attributes
        var troops = {};
        var unitInputs = form.querySelectorAll('input.unitsInput, input[name*="unit"], input[id*="unit"]');
        console.log('🎯 Found unit inputs:', unitInputs.length);
        
        unitInputs.forEach(input => {
            if (input.name) {
                var unitName = input.name;
                var count = parseInt(input.getAttribute('data-all-count')) || 
                           parseInt(input.value) || 
                           0;
                troops[unitName] = count;
                console.log('  -', unitName, ':', count);
            }
        });
        
        // If no troops found via inputs, try to get from units-entry-all links
        if (Object.keys(troops).length === 0) {
            console.log('⚠️ No troops from inputs, trying backup method...');
            var unitTypes = ['spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult', 'knight', 'snob'];
            
            unitTypes.forEach(unit => {
                var element = tempDiv.querySelector('#units_entry_all_' + unit);
                if (element) {
                    var match = element.textContent.match(/\((\d+)\)/);
                    troops[unit] = match ? parseInt(match[1]) : 0;
                    console.log('  -', unit, ':', troops[unit], '(from link)');
                } else {
                    troops[unit] = 0;
                }
            });
        }
        
        // Also extract from game_data if available in script
        var scripts = tempDiv.querySelectorAll('script');
        scripts.forEach(script => {
            var content = script.textContent || script.innerText;
            if (content.includes('available_units') || content.includes('send_units')) {
                console.log('🔍 Found units in script');
                // Try to extract JSON-like data
                var unitMatch = content.match(/available_units["']?\s*:\s*({[^}]+})/);
                if (unitMatch) {
                    try {
                        // Clean up the JSON string
                        var jsonStr = unitMatch[1].replace(/'/g, '"');
                        var unitData = JSON.parse(jsonStr);
                        Object.assign(troops, unitData);
                        console.log('✅ Extracted units from script:', unitData);
                    } catch (e) {
                        console.log('⚠️ Could not parse units from script');
                    }
                }
            }
        });
        
        console.log('📊 Final troop counts:', troops);
        console.log('📋 Form action:', formData.action);
        
        return {
            html: html,
            formData: formData,
            troops: troops,
            targetId: targetId,
            attackerId: attackerId,
            parsedForm: form.outerHTML,
            fullResponse: tempDiv.innerHTML // For debugging
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
        console.log('Current screen:', new URLSearchParams(window.location.search).get('screen'));
        
        getAttackForm(attackerId, targetId)
            .then(formInfo => {
                console.log('✅ Successfully retrieved attack form!');
                console.log('=== FORM INFO SUMMARY ===');
                console.log('Target:', formInfo.targetId);
                console.log('Form action:', formInfo.formData.action);
                console.log('Available troops:', formInfo.troops);
                console.log('Hidden inputs:', Object.keys(formInfo.formData.inputs).length);
                console.log('=========================');
                
                // Display the form in a dialog
                displayFormDialog(formInfo);
                
                // Make form info available globally
                window.lastFormInfo = formInfo;
                
                return formInfo;
            })
            .catch(error => {
                console.error('❌ Failed to get attack form:', error);
                
                // Show more helpful error
                var errorMsg = 'Failed to get attack form:\n' + error.message;
                if (error.message.includes('Form not found')) {
                    errorMsg += '\n\nPossible reasons:\n';
                    errorMsg += '1. Target village does not exist\n';
                    errorMsg += '2. You don\'t have attack permissions\n';
                    errorMsg += '3. Server returned different structure\n';
                    errorMsg += '\nCheck console for raw response details.';
                }
                alert(errorMsg);
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
            max-width: 90%;
            max-height: 90vh;
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
        
        // Create troop summary
        var troopSummary = '';
        Object.entries(formInfo.troops).forEach(([unit, count]) => {
            if (count > 0) {
                troopSummary += `<div><strong>${unit}:</strong> ${count}</div>`;
            }
        });
        
        if (!troopSummary) {
            troopSummary = '<div style="color: #666;">No troops available</div>';
        }
        
        // Add content
        var content = document.createElement('div');
        content.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">⚔️ Attack Form for Village ${formInfo.targetId}</h3>
            
            <div style="margin-bottom: 15px; padding: 10px; background: #f0f8ff; border-radius: 4px;">
                <strong>📋 Form Action:</strong><br>
                <code style="font-size: 12px; word-break: break-all;">${formInfo.formData.action}</code>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <strong>🎯 Available Troops:</strong>
                    <div style="margin-top: 5px;">${troopSummary}</div>
                </div>
                <div>
                    <strong>🔒 Hidden Inputs (${Object.keys(formInfo.formData.inputs).length}):</strong>
                    <div style="font-size: 12px; margin-top: 5px;">
                        ${Object.entries(formInfo.formData.inputs).map(([key, value]) => 
                            `<div><code>${key}</code> = ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}</div>`
                        ).join('')}
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <details>
                    <summary style="cursor: pointer; color: #0066cc;">🔍 View Form HTML (${formInfo.parsedForm.length} chars)</summary>
                    <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 10px; max-height: 300px; overflow: auto; margin-top: 5px;">${escapeHtml(formInfo.parsedForm)}</pre>
                </details>
            </div>
            
            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd;">
                <button id="next-step-btn" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px; margin-right: 10px;">
                    ✅ Success! Next Step →
                </button>
                <button id="debug-btn" style="background: #ff9800; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                    🐛 Debug Raw Response
                </button>
            </div>
        `;
        
        dialog.appendChild(closeBtn);
        dialog.appendChild(content);
        document.body.appendChild(dialog);
        
        // Add button handlers
        document.getElementById('next-step-btn').onclick = function() {
            dialog.remove();
            alert('Form retrieved successfully!\n\nNow you can proceed to submit troops.\n\nAvailable in console:\n- window.lastFormInfo (contains all form data)\n- Use formInfo.formData.action for POST request');
        };
        
        document.getElementById('debug-btn').onclick = function() {
            console.log('=== DEBUG: Full Response ===');
            console.log('Full HTML:', formInfo.fullResponse);
            console.log('=== END DEBUG ===');
            alert('Full response logged to console. Check for form structure.');
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
            padding: 12px 18px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
            transition: all 0.3s;
        `;
        
        btn.onmouseover = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
        };
        
        btn.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
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
    console.log('Ready to test! Click the button in bottom-right corner.');
    
    // Create button
    setTimeout(createTestButton, 1000);
    
})();


// Step 2: Submit troops to get confirmation dialog
function submitTroops(formInfo, troopCounts) {
    console.log('🚀 Step 2: Submitting troops...');
    console.log('🎯 Target ID:', formInfo.targetId);
    console.log('⚔️ Troop counts to send:', troopCounts);
    
    // Build the form submission URL
    var submitUrl = formInfo.formData.action;
    console.log('📤 Submit URL:', submitUrl);
    
    // Create FormData object
    var formData = new FormData();
    
    // Add all hidden inputs from the form
    Object.keys(formInfo.formData.inputs).forEach(name => {
        if (formInfo.formData.inputs[name] !== undefined && formInfo.formData.inputs[name] !== null) {
            formData.append(name, formInfo.formData.inputs[name]);
        }
    });
    
    // Add troop counts (only if > 0)
    Object.keys(troopCounts).forEach(troop => {
        if (troopCounts[troop] > 0) {
            formData.append(troop, troopCounts[troop]);
        }
    });
    
    // Add empty x and y coordinates (as in the game)
    formData.append('x', '');
    formData.append('y', '');
    
    // Add attack type - use Russian text as in your example
    formData.append('attack', 'Атака');
    
    console.log('📦 Form data to send:');
    for (var pair of formData.entries()) {
        console.log('  -', pair[0], '=', pair[1]);
    }
    
    // Submit the form
    return fetch(submitUrl, {
        headers: {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "ru,en;q=0.9",
            "cache-control": "max-age=0",
            "content-type": "application/x-www-form-urlencoded",
            "priority": "u=0, i",
            "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
            "tribalwars-ajax": "1",
            "x-requested-with": "XMLHttpRequest"
        },
        referrer: window.location.origin + '/game.php?village=' + formInfo.attackerId + '&screen=place',
        body: new URLSearchParams(formData),
        method: "POST",
        mode: "cors",
        credentials: "include"
    })
    .then(response => {
        console.log('📥 Response status:', response.status);
        console.log('📄 Content-Type:', response.headers.get('content-type'));
        
        // Get response as text first
        return response.text().then(text => {
            console.log('📝 Response preview (first 500 chars):', text.substring(0, 500));
            
            // Try to parse as JSON
            try {
                var jsonData = JSON.parse(text);
                console.log('✅ Response is JSON');
                return { type: 'json', data: jsonData, raw: text };
            } catch (e) {
                console.log('⚠️ Response is not JSON, treating as HTML');
                return { type: 'html', data: text, raw: text };
            }
        });
    })
    .then(parsedResponse => {
        console.log('✅ Step 2 complete: Form submitted');
        
        if (parsedResponse.type === 'json') {
            // Handle JSON response
            var jsonData = parsedResponse.data;
            
            if (jsonData.response && jsonData.response.dialog) {
                console.log('📄 Found confirmation dialog in JSON response');
                return parseConfirmationDialog(jsonData.response.dialog, formInfo, troopCounts);
            } else if (jsonData.dialog) {
                console.log('📄 Found dialog at root level');
                return parseConfirmationDialog(jsonData.dialog, formInfo, troopCounts);
            } else {
                console.error('❓ Unexpected JSON structure:', Object.keys(jsonData));
                console.log('Full response:', jsonData);
                throw new Error('No confirmation dialog found');
            }
        } else {
            // Handle HTML response
            console.log('📄 Response is HTML');
            return parseConfirmationDialog(parsedResponse.data, formInfo, troopCounts);
        }
    })
    .catch(error => {
        console.error('❌ Error submitting troops:', error);
        throw error;
    });
}

// Parse confirmation dialog
function parseConfirmationDialog(html, formInfo, troopCounts) {
    console.log('🔍 Parsing confirmation dialog...');
    
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Find the confirmation form
    var confirmForm = tempDiv.querySelector('#command-data-form');
    if (!confirmForm) {
        console.error('❌ Confirmation form not found!');
        console.log('Available forms:', tempDiv.querySelectorAll('form').length);
        console.log('HTML preview:', tempDiv.innerHTML.substring(0, 1000));
        throw new Error('Confirmation form not found');
    }
    
    console.log('✅ Confirmation form found!');
    
    // Extract form data
    var formData = {
        action: confirmForm.action || confirmForm.getAttribute('action'),
        method: confirmForm.method || 'post',
        inputs: {}
    };
    
    // Get all hidden inputs
    var hiddenInputs = confirmForm.querySelectorAll('input[type="hidden"]');
    console.log('📝 Found hidden inputs in confirmation:', hiddenInputs.length);
    
    hiddenInputs.forEach(input => {
        if (input.name && input.value !== undefined) {
            formData.inputs[input.name] = input.value;
            console.log('  -', input.name, '=', input.value.substring(0, 50));
        }
    });
    
    // Look for success indicators
    var success = false;
    var errorMessage = null;
    
    // Check for error messages
    var errorDiv = tempDiv.querySelector('.error_box, .alert-error, .msg.error');
    if (errorDiv) {
        errorMessage = errorDiv.textContent.trim();
        console.error('❌ Submission error:', errorMessage);
    } else {
        // Check for success indicators
        var successDiv = tempDiv.querySelector('.success_box, .alert-success');
        if (successDiv) {
            success = true;
            console.log('✅ Success message:', successDiv.textContent.trim());
        } else {
            // Check if we're on confirmation page (has submit button)
            var confirmButton = tempDiv.querySelector('#troop_confirm_submit');
            if (confirmButton) {
                success = true;
                console.log('✅ Reached confirmation page - ready for final submit');
            } else {
                console.log('⚠️ No clear success/error indicators found');
            }
        }
    }
    
    return {
        success: success,
        error: errorMessage,
        html: html,
        formData: formData,
        originalFormInfo: formInfo,
        troopCounts: troopCounts
    };
}

// Full test flow
function runFullAttackTest(targetId, customTroops) {
    var attackerId = getCurrentVillageId();
    
    if (!attackerId) {
        alert('❌ Could not find village ID in URL');
        return;
    }
    
    console.log('🎯 Starting full attack test...');
    console.log('Attacker:', attackerId);
    console.log('Target:', targetId);
    
    // Step 1: Get form
    getAttackForm(attackerId, targetId)
        .then(formInfo => {
            console.log('✅ Step 1 complete: Got form');
            
            // Create troop counts (use custom or default test troops)
            var troopCounts = customTroops || {
                spear: 1,
                sword: 0,
                axe: 0,
                spy: 0,
                light: 0,
                heavy: 0,
                ram: 0,
                catapult: 0,
                knight: 0,
                snob: 0
            };
            
            // Validate we have enough troops
            Object.keys(troopCounts).forEach(unit => {
                if (troopCounts[unit] > formInfo.troops[unit]) {
                    console.warn(`⚠️ Not enough ${unit}. Requested: ${troopCounts[unit]}, Available: ${formInfo.troops[unit]}`);
                    troopCounts[unit] = formInfo.troops[unit]; // Adjust to available
                }
            });
            
            // Ask for confirmation
            var troopList = Object.entries(troopCounts)
                .filter(([unit, count]) => count > 0)
                .map(([unit, count]) => `${count} ${unit}`)
                .join(', ');
            
            var confirmMsg = `Send attack?\n\n` +
                            `From: ${attackerId}\n` +
                            `To: ${targetId}\n` +
                            `Troops: ${troopList || 'none'}\n\n` +
                            `Proceed?`;
            
            if (confirm(confirmMsg)) {
                console.log('✅ User confirmed, proceeding to Step 2...');
                // Step 2: Submit troops
                return submitTroops(formInfo, troopCounts);
            } else {
                throw new Error('Attack cancelled by user');
            }
        })
        .then(result => {
            console.log('✅ Step 2 complete: Got confirmation dialog');
            console.log('Success:', result.success);
            
            if (result.success) {
                console.log('🎉 Ready for final confirmation!');
                window.lastConfirmation = result;
                alert('✅ Ready for final confirmation!\n\nForm action: ' + result.formData.action);
            } else if (result.error) {
                console.error('❌ Error:', result.error);
                alert('❌ Error: ' + result.error);
            } else {
                console.log('⚠️ Unknown result');
                alert('⚠️ Check console for details');
            }
            
            return result;
        })
        .catch(error => {
            console.error('❌ Test failed:', error);
            alert('❌ Test failed: ' + error.message);
        });
}

// Add these functions to the global scope
window.submitTroops = submitTroops;
window.runFullAttackTest = runFullAttackTest;

// Update the dialog to include a test button
function addTestButtonToDialog(formInfo) {
    // Remove existing test button if any
    var existingTestBtn = document.querySelector('#test-attack-btn');
    if (existingTestBtn) existingTestBtn.remove();
    
    var testBtn = document.createElement('button');
    testBtn.id = 'test-attack-btn';
    testBtn.textContent = '⚔️ Test Attack with 1 Spear';
    testBtn.style.cssText = `
        background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-left: 10px;
        font-weight: bold;
    `;
    
    testBtn.onclick = function() {
        runFullAttackTest(formInfo.targetId, { spear: 1 });
    };
    
    // Add to the dialog if it exists
    var dialog = document.getElementById('attack-form-dialog');
    if (dialog) {
        var footer = dialog.querySelector('div[style*="margin-top: 20px"]');
        if (footer) {
            footer.appendChild(testBtn);
        }
    }
}
