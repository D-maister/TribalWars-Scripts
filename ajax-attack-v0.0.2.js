(function() {
    console.log('=== AJAX Attack Test Script ===');
    
    // Get current village ID from URL
    function getCurrentVillageId() {
        var url = window.location.href;
        var match = url.match(/[?&]village=(\d+)/);
        return match ? match[1] : null;
    }
    
    // Simple AJAX test function
    function testAjaxAttack(attackerId, targetId) {
        console.log('🔍 Testing AJAX Attack:');
        console.log('Attacker Village ID:', attackerId);
        console.log('Target Village ID:', targetId);
        console.log('Current Domain:', window.location.origin);
        
        if (!attackerId || !targetId) {
            console.error('❌ Missing village IDs');
            alert('❌ Missing village IDs\nAttacker: ' + attackerId + '\nTarget: ' + targetId);
            return;
        }
        
        // Build the AJAX URL (NO troop parameters)
        var ajaxUrl = window.location.origin + '/game.php?' + 
                      'village=' + attackerId + 
                      '&screen=place' + 
                      '&ajax=command' + 
                      '&target=' + targetId;
        
        console.log('📤 AJAX URL:', ajaxUrl);
        
        // Send AJAX request
        fetch(ajaxUrl, {
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
        .then(response => {
            console.log('📥 Response Status:', response.status, response.statusText);
            console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ' ' + response.statusText);
            }
            return response.text(); // Get raw text first
        })
        .then(text => {
            console.log('📥 Raw Response:', text);
            
            try {
                // Try to parse as JSON
                var data = JSON.parse(text);
                console.log('✅ Parsed JSON Response:', data);
                
                // Show result
                var message = 'AJAX Test Result:\n\n';
                message += 'Attacker: ' + attackerId + '\n';
                message += 'Target: ' + targetId + '\n';
                message += 'Success: ' + (data.success ? '✅ YES' : '❌ NO') + '\n';
                
                if (data.error) {
                    message += 'Error: ' + data.error + '\n';
                }
                
                if (data.data && data.data.cooldown) {
                    message += 'Cooldown: ' + data.data.cooldown + ' minutes\n';
                }
                
                message += '\nFull response in console (F12)';
                
                alert(message);
                
            } catch (e) {
                console.error('❌ Failed to parse JSON:', e);
                console.log('Raw response text:', text);
                alert('❌ Response is not valid JSON:\n' + text.substring(0, 200) + '...');
            }
        })
        .catch(error => {
            console.error('❌ Fetch error:', error);
            alert('❌ AJAX Request Failed:\n' + error.message);
        });
    }
    
    // Run test with current village and target 146
    function runDefaultTest() {
        var attackerId = getCurrentVillageId();
        var targetId = 146;
        
        if (!attackerId) {
            alert('❌ Could not find village ID in URL:\n' + window.location.href);
            return;
        }
        
        var confirmMessage = 'Send AJAX test attack?\n\n' +
                            'Attacker: ' + attackerId + '\n' +
                            'Target: ' + targetId + '\n\n' +
                            'This will send an empty attack (no troops).';
        
        if (confirm(confirmMessage)) {
            testAjaxAttack(attackerId, targetId);
        }
    }
    
    // Create minimal test button
    function createTestButton() {
        // Remove any existing button first
        var existingBtn = document.getElementById('ajax-test-btn');
        if (existingBtn) existingBtn.remove();
        
        var btn = document.createElement('button');
        btn.id = 'ajax-test-btn';
        btn.textContent = '🧪 AJAX Test';
        btn.title = 'Test AJAX attack to village 146';
        
        // Minimal styling - no images, no external resources
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            background: #2196F3;
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
            this.style.background = '#1976D2';
            this.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)';
        };
        
        btn.onmouseout = function() {
            this.style.background = '#2196F3';
            this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        };
        
        btn.onclick = runDefaultTest;
        
        document.body.appendChild(btn);
    }
    
    // Console test functions
    function consoleTest(attackerId, targetId) {
        if (!attackerId || !targetId) {
            console.error('Usage: consoleTest(attackerId, targetId)');
            console.error('Example: consoleTest(145, 146)');
            return;
        }
        testAjaxAttack(attackerId, targetId);
    }
    
    // Make functions available in console
    window.ajaxTest = testAjaxAttack;
    window.consoleTest = consoleTest;
    window.runAjaxTest = runDefaultTest;
    
    // Initialize
    console.log('🎯 AJAX Test Script Loaded');
    console.log('📌 Current Village ID:', getCurrentVillageId());
    console.log('📌 Available functions:');
    console.log('  - ajaxTest(attackerId, targetId)');
    console.log('  - consoleTest(attackerId, targetId)');
    console.log('  - runAjaxTest() - tests with current village and target 146');
    console.log('  Example: consoleTest(145, 146)');
    
    // Create test button after a delay
    setTimeout(createTestButton, 1000);
    
})();
