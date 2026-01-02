(function() {
    console.log('=== Full AJAX Attack Flow Test ===');
    
    // Get current village ID from URL
    function getCurrentVillageId() {
        var url = window.location.href;
        var match = url.match(/[?&]village=(\d+)/);
        return match ? match[1] : null;
    }
    
    // Step 1: Get the attack form
    function getAttackForm(attackerId, targetId) {
        console.log('📋 Step 1: Getting attack form...');
        
        var ajaxUrl = window.location.origin + '/game.php?' + 
                      'village=' + attackerId + 
                      '&screen=place' + 
                      '&ajax=command' + 
                      '&target=' + targetId;
        
        console.log('📤 Request URL:', ajaxUrl);
        
        return fetch(ajaxUrl, {
            headers: {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "ru,en;q=0.9",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Chromium\";v=\"142\", \"YaBrowser\";v=\"25.12\", \"Not_A Brand\";v=\"99\", \"Yowser\";v=\"2.5\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "tribalwars-ajax": "1",
                "x-requested-with": "XMLHttpRequest"
            },
            referrer: window.location.href,
            body: null,
            method: "GET",
            mode: "cors",
            credentials: "include"
        })
        .then(response => response.text())
        .then(html => {
            console.log('✅ Step 1 complete: Got form HTML');
            
            // Parse the HTML to extract form data
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            
            // Extract form action and hidden inputs
            var form = doc.querySelector('#command-data-form');
            if (!form) {
                throw new Error('Form not found in response');
            }
            
            var formData = {
                action: form.action,
                method: form.method,
                inputs: {}
            };
            
            // Get all hidden inputs
            var hiddenInputs = form.querySelectorAll('input[type="hidden"]');
            hiddenInputs.forEach(input => {
                formData.inputs[input.name] = input.value;
            });
            
            // Get available troops
            var troops = {};
            ['spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult', 'knight', 'snob'].forEach(troop => {
                var element = doc.querySelector('#units_entry_all_' + troop);
                if (element) {
                    var match = element.textContent.match(/\((\d+)\)/);
                    troops[troop] = match ? parseInt(match[1]) : 0;
                } else {
                    troops[troop] = 0;
                }
            });
            
            console.log('📊 Available troops:', troops);
            console.log('📋 Form data:', formData);
            
            return {
                html: html,
                formData: formData,
                troops: troops,
                targetId: targetId,
                attackerId: attackerId
            };
        });
    }
    
    // Step 2: Submit the form with troops
    function submitAttack(formInfo, troopCounts) {
        console.log('🚀 Step 2: Submitting attack...');
        console.log('🎯 Target ID:', formInfo.targetId);
        console.log('⚔️ Troop counts:', troopCounts);
        
        // Build the form submission URL
        var submitUrl = formInfo.formData.action;
        
        // Create FormData object
        var formData = new FormData();
        
        // Add all hidden inputs
        Object.keys(formInfo.formData.inputs).forEach(name => {
            formData.append(name, formInfo.formData.inputs[name]);
        });
        
        // Add troop counts
        Object.keys(troopCounts).forEach(troop => {
            if (troopCounts[troop] > 0) {
                formData.append(troop, troopCounts[troop]);
            }
        });
        
        // Add x and y coordinates (empty for now)
        formData.append('x', '');
        formData.append('y', '');
        
        // Add attack type
        formData.append('attack', 'Атака'); // Russian for "Attack"
        
        console.log('📤 Submit URL:', submitUrl);
        console.log('📦 Form data:', Object.fromEntries(formData.entries()));
        
        // Submit the form
        return fetch(submitUrl, {
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "ru,en;q=0.9",
                "cache-control": "max-age=0",
                "content-type": "application/x-www-form-urlencoded",
                "priority": "u=0, i",
                "sec-ch-ua": "\"Chromium\";v=\"142\", \"YaBrowser\";v=\"25.12\", \"Not_A Brand\";v=\"99\", \"Yowser\";v=\"2.5\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"Windows\"",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "same-origin",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1"
            },
            referrer: window.location.origin + '/game.php?village=' + formInfo.attackerId + '&screen=place',
            body: new URLSearchParams(formData),
            method: "POST",
            mode: "cors",
            credentials: "include"
        })
        .then(response => response.text())
        .then(html => {
            console.log('✅ Step 2 complete: Form submitted');
            
            // Check if submission was successful
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            
            // Look for success indicators
            var success = false;
            var errorMessage = null;
            
            // Check for error messages
            var errorDiv = doc.querySelector('.error_box, .alert-error, .msg');
            if (errorDiv) {
                errorMessage = errorDiv.textContent.trim();
                console.error('❌ Submission error:', errorMessage);
            } else {
                // Check for success indicators
                var successDiv = doc.querySelector('.success_box, .alert-success');
                if (successDiv) {
                    success = true;
                    console.log('✅ Success message:', successDiv.textContent.trim());
                } else {
                    // Check if we're on confirmation page
                    var confirmButton = doc.querySelector('#troop_confirm_submit');
                    if (confirmButton) {
                        success = true;
                        console.log('✅ Reached confirmation page');
                    } else {
                        console.log('⚠️ Unknown response, checking page title...');
                        var title = doc.querySelector('title');
                        if (title && title.textContent.includes('подтвержден')) {
                            success = true;
                            console.log('✅ Found confirmation in title');
                        }
                    }
                }
            }
            
            return {
                success: success,
                error: errorMessage,
                html: html,
                url: submitUrl
            };
        });
    }
    
    // Full test flow
    function runFullTest() {
        var attackerId = getCurrentVillageId();
        var targetId = 146;
        
        if (!attackerId) {
            alert('❌ Could not find village ID in URL');
            return;
        }
        
        console.log('🎯 Starting full test...');
        console.log('Attacker:', attackerId);
        console.log('Target:', targetId);
        
        // Step 1: Get form
        getAttackForm(attackerId, targetId)
            .then(formInfo => {
                console.log('✅ Got form, available troops:', formInfo.troops);
                
                // Create test troop counts (1 spear as minimal test)
                var testTroops = {
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
                
                // Check if we have enough troops
                if (testTroops.spear > formInfo.troops.spear) {
                    console.warn('⚠️ Not enough spears. Using 0 instead.');
                    testTroops.spear = 0;
                }
                
                // Ask for confirmation
                var confirmMsg = 'Send test attack?\n\n' +
                                'From: ' + attackerId + '\n' +
                                'To: ' + targetId + '\n' +
                                'Troops: ' + testTroops.spear + ' spear\n\n' +
                                'Proceed?';
                
                if (confirm(confirmMsg)) {
                    // Step 2: Submit attack
                    return submitAttack(formInfo, testTroops);
                } else {
                    throw new Error('Test cancelled by user');
                }
            })
            .then(result => {
                console.log('🎉 Test completed!');
                console.log('Success:', result.success);
                console.log('Error:', result.error);
                
                if (result.success) {
                    alert('✅ Attack submitted successfully!\n\nCheck the page for confirmation.');
                } else if (result.error) {
                    alert('❌ Attack failed:\n' + result.error);
                } else {
                    alert('⚠️ Unknown result. Check console for details.');
                }
            })
            .catch(error => {
                console.error('❌ Test failed:', error);
                alert('❌ Test failed:\n' + error.message);
            });
    }
    
    // Simplified test for console
    function quickTest() {
        var attackerId = getCurrentVillageId();
        var targetId = 146;
        
        if (!attackerId) {
            console.error('No village ID found');
            return;
        }
        
        console.log('Quick test:', { attackerId, targetId });
        
        getAttackForm(attackerId, targetId)
            .then(formInfo => {
                console.log('Form received. Available troops:', formInfo.troops);
                console.log('Form action:', formInfo.formData.action);
                
                // Show available troops
                var msg = 'Available troops:\n';
                Object.keys(formInfo.troops).forEach(troop => {
                    if (formInfo.troops[troop] > 0) {
                        msg += troop + ': ' + formInfo.troops[troop] + '\n';
                    }
                });
                alert(msg);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error: ' + error.message);
            });
    }
    
    // Create test button
    function createTestButton() {
        var btn = document.createElement('button');
        btn.textContent = '⚔️ Test Attack Flow';
        btn.title = 'Test full attack flow to village 146';
        
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            background: linear-gradient(to right, #ff416c, #ff4b2b);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            font-family: Arial, sans-serif;
        `;
        
        btn.onmouseover = function() {
            this.style.background = 'linear-gradient(to right, #ff4b2b, #ff416c)';
        };
        
        btn.onmouseout = function() {
            this.style.background = 'linear-gradient(to right, #ff416c, #ff4b2b)';
        };
        
        btn.onclick = runFullTest;
        
        document.body.appendChild(btn);
    }
    
    // Make functions available
    window.runAttackTest = runFullTest;
    window.quickAttackTest = quickTest;
    window.getAttackFormTest = getAttackForm;
    
    // Initialize
    console.log('⚔️ Attack Flow Test Script Loaded');
    console.log('Current village:', getCurrentVillageId());
    console.log('Available functions:');
    console.log('- runAttackTest() - Full test with 1 spear');
    console.log('- quickAttackTest() - Just check available troops');
    console.log('- getAttackFormTest(attackerId, targetId)');
    
    // Create button
    setTimeout(createTestButton, 1000);
    
})();
