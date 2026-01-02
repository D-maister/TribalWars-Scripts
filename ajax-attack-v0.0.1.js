(function() {
    // Test AJAX attack function
    function testAjaxAttack() {
        console.log('=== Testing AJAX Attack ===');
        
        // Get current village ID from URL
        var currentUrl = window.location.href;
        var villageIdMatch = currentUrl.match(/[?&]village=(\d+)/);
        
        if (!villageIdMatch) {
            alert('❌ Could not find village ID in URL.\nCurrent URL: ' + currentUrl);
            return;
        }
        
        var attackerVillageId = villageIdMatch[1];
        var targetVillageId = 146; // Test target
        
        console.log('Attacker Village ID:', attackerVillageId);
        console.log('Target Village ID:', targetVillageId);
        
        // Build the AJAX URL
        var ajaxUrl = window.location.origin + '/game.php?' + 
                      'village=' + attackerVillageId + 
                      '&screen=place' + 
                      '&ajax=command' + 
                      '&target=' + targetVillageId;
        
        // Add minimal troops for test (1 spear)
        ajaxUrl += '&spear=1';
        
        console.log('AJAX URL:', ajaxUrl);
        
        // Send AJAX request
        fetch(ajaxUrl, {
            headers: {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "ru,en;q=0.9",
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
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            
            if (data && data.success) {
                alert('✅ Test successful!\nAttack sent from village ' + attackerVillageId + ' to target ' + targetVillageId + '\nResponse: ' + JSON.stringify(data));
            } else if (data && data.error) {
                alert('❌ Test failed with error:\n' + data.error + '\n\nFull response: ' + JSON.stringify(data));
            } else {
                alert('⚠️ Unknown response:\n' + JSON.stringify(data));
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            alert('❌ Test failed with error:\n' + error.message + '\n\nCheck console for details.');
        });
    }
    
    // Create test button
    function createTestButton() {
        var testBtn = document.createElement('button');
        testBtn.textContent = '🧪 Test AJAX Attack';
        testBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            background: linear-gradient(to right, #ff416c, #ff4b2b);
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            transition: transform 0.2s;
        `;
        
        testBtn.onmouseover = function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
        };
        
        testBtn.onmouseout = function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        };
        
        testBtn.onclick = function() {
            if (confirm('Send test attack from current village to target ID 146?\n\nMake sure you have at least 1 spear available.')) {
                testAjaxAttack();
            }
        };
        
        document.body.appendChild(testBtn);
        
        // Also create a status display
        var statusDiv = document.createElement('div');
        statusDiv.id = 'test-status';
        statusDiv.style.cssText = `
            position: fixed;
            bottom: 70px;
            right: 20px;
            z-index: 9998;
            background: white;
            border: 2px solid #4CAF50;
            border-radius: 6px;
            padding: 10px;
            max-width: 300px;
            display: none;
            font-size: 12px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(statusDiv);
    }
    
    // Function to test with specific parameters
    function testWithParameters(attackerId, targetId, troops) {
        console.log('Testing with parameters:', { attackerId, targetId, troops });
        
        var ajaxUrl = window.location.origin + '/game.php?' + 
                      'village=' + attackerId + 
                      '&screen=place' + 
                      '&ajax=command' + 
                      '&target=' + targetId;
        
        // Add troops
        Object.keys(troops).forEach(function(troopType) {
            if (troops[troopType] > 0) {
                ajaxUrl += '&' + troopType + '=' + troops[troopType];
            }
        });
        
        console.log('Full AJAX URL:', ajaxUrl);
        
        return fetch(ajaxUrl, {
            headers: {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "ru,en;q=0.9",
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
        .then(response => response.json());
    }
    
    // Create a more advanced test panel
    function createAdvancedTestPanel() {
        var panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9997;
            background: white;
            border: 2px solid #2196F3;
            border-radius: 8px;
            padding: 15px;
            width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: Arial, sans-serif;
        `;
        
        panel.innerHTML = `
            <h3 style="margin-top: 0; color: #2196F3; border-bottom: 2px solid #2196F3; padding-bottom: 8px;">
                🧪 AJAX Attack Tester
            </h3>
            
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 4px; font-weight: bold; font-size: 12px;">
                    Attacker Village ID:
                </label>
                <input type="number" id="test-attacker-id" value="${getCurrentVillageId()}" 
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            
            <div style="margin-bottom: 10px;">
                <label style="display: block; margin-bottom: 4px; font-weight: bold; font-size: 12px;">
                    Target Village ID:
                </label>
                <input type="number" id="test-target-id" value="146" 
                       style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 6px; font-weight: bold; font-size: 12px;">
                    Troops:
                </label>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px;">
                    <div>
                        <label style="font-size: 11px;">Spear:</label>
                        <input type="number" id="test-spear" value="1" min="0" style="width: 100%; padding: 4px; font-size: 12px;">
                    </div>
                    <div>
                        <label style="font-size: 11px;">Sword:</label>
                        <input type="number" id="test-sword" value="0" min="0" style="width: 100%; padding: 4px; font-size: 12px;">
                    </div>
                    <div>
                        <label style="font-size: 11px;">Axe:</label>
                        <input type="number" id="test-axe" value="0" min="0" style="width: 100%; padding: 4px; font-size: 12px;">
                    </div>
                    <div>
                        <label style="font-size: 11px;">Spy:</label>
                        <input type="number" id="test-spy" value="0" min="0" style="width: 100%; padding: 4px; font-size: 12px;">
                    </div>
                    <div>
                        <label style="font-size: 11px;">Light:</label>
                        <input type="number" id="test-light" value="0" min="0" style="width: 100%; padding: 4px; font-size: 12px;">
                    </div>
                    <div>
                        <label style="font-size: 11px;">Heavy:</label>
                        <input type="number" id="test-heavy" value="0" min="0" style="width: 100%; padding: 4px; font-size: 12px;">
                    </div>
                </div>
            </div>
            
            <button id="test-run-btn" style="width: 100%; padding: 10px; background: linear-gradient(to right, #4CAF50, #45a049); 
                    color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 8px;">
                🚀 Run Test
            </button>
            
            <button id="test-close-btn" style="width: 100%; padding: 8px; background: #666; color: white; 
                    border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                Close Panel
            </button>
            
            <div id="test-result" style="margin-top: 15px; padding: 10px; border-radius: 4px; background: #f8f9fa; 
                    font-size: 11px; display: none; max-height: 200px; overflow-y: auto;"></div>
        `;
        
        document.body.appendChild(panel);
        
        // Add event listeners
        document.getElementById('test-run-btn').onclick = function() {
            var attackerId = document.getElementById('test-attacker-id').value;
            var targetId = document.getElementById('test-target-id').value;
            
            var troops = {
                spear: parseInt(document.getElementById('test-spear').value) || 0,
                sword: parseInt(document.getElementById('test-sword').value) || 0,
                axe: parseInt(document.getElementById('test-axe').value) || 0,
                spy: parseInt(document.getElementById('test-spy').value) || 0,
                light: parseInt(document.getElementById('test-light').value) || 0,
                heavy: parseInt(document.getElementById('test-heavy').value) || 0
            };
            
            if (!attackerId || !targetId) {
                alert('Please enter both village IDs');
                return;
            }
            
            if (Object.values(troops).every(v => v === 0)) {
                if (!confirm('No troops selected. Send empty attack?')) {
                    return;
                }
            }
            
            this.disabled = true;
            this.textContent = '⏳ Sending...';
            
            var resultDiv = document.getElementById('test-result');
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = '<div style="color: #666;">Sending test attack...</div>';
            
            testWithParameters(attackerId, targetId, troops)
                .then(data => {
                    this.disabled = false;
                    this.textContent = '🚀 Run Test';
                    
                    resultDiv.innerHTML = `
                        <div style="margin-bottom: 8px; font-weight: bold; color: ${data.success ? '#4CAF50' : '#f44336'}">
                            ${data.success ? '✅ SUCCESS' : '❌ FAILED'}
                        </div>
                        <div style="font-family: monospace; font-size: 10px; white-space: pre-wrap;">
                            ${JSON.stringify(data, null, 2)}
                        </div>
                    `;
                    
                    if (data.success) {
                        console.log('✅ Test successful!', data);
                    } else {
                        console.error('❌ Test failed:', data);
                    }
                })
                .catch(error => {
                    this.disabled = false;
                    this.textContent = '🚀 Run Test';
                    
                    resultDiv.innerHTML = `
                        <div style="margin-bottom: 8px; font-weight: bold; color: #f44336;">
                            ❌ ERROR
                        </div>
                        <div style="color: #f44336;">
                            ${error.message}
                        </div>
                    `;
                    
                    console.error('❌ Test error:', error);
                });
        };
        
        document.getElementById('test-close-btn').onclick = function() {
            panel.style.display = 'none';
        };
    }
    
    // Helper function to get current village ID
    function getCurrentVillageId() {
        var url = window.location.href;
        var match = url.match(/[?&]village=(\d+)/);
        return match ? match[1] : '';
    }
    
    // Initialize
    console.log('AJAX Attack Test Script Loaded');
    console.log('Current village ID:', getCurrentVillageId());
    console.log('Current URL:', window.location.href);
    
    // Create test button after page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(createTestButton, 1000);
            setTimeout(createAdvancedTestPanel, 1500);
        });
    } else {
        setTimeout(createTestButton, 1000);
        setTimeout(createAdvancedTestPanel, 1500);
    }
    
    // Expose test functions globally for console testing
    window.testAjaxAttack = testAjaxAttack;
    window.testWithParameters = testWithParameters;
    
    console.log('Test functions available:');
    console.log('- testAjaxAttack() - Simple test with village 146');
    console.log('- testWithParameters(attackerId, targetId, troops) - Advanced test');
    console.log('Example: testWithParameters(145, 146, {spear: 1})');
    
})();
