(function() {
    console.log('=== Tribal Wars Attack Form with Real Submission ===');
    
    // Get current village ID
    function getCurrentVillageId() {
        var match = window.location.href.match(/[?&]village=(\d+)/);
        return match ? match[1] : null;
    }
    
    // Get CSRF token
    function getCsrfToken() {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var content = scripts[i].textContent || scripts[i].innerText;
            var match = content.match(/csrf["']?\s*:\s*["']([^"']+)["']/);
            if (match) return match[1];
        }
        return null;
    }
    
    // Global variables
    var currentAttackData = null;
    
    // Show attack form
    function showAttackForm(targetId) {
        var attackerId = getCurrentVillageId();
        
        if (!attackerId) {
            alert('Не найден ID деревни в URL');
            return;
        }
        
        if (!targetId) {
            targetId = prompt('Введите ID целевой деревни:', '146');
            if (!targetId) return;
        }
        
        console.log('Получение формы атаки:', { attackerId, targetId });
        
        // Build URL
        var url = window.location.origin + '/game.php?' + 
                  'village=' + attackerId + 
                  '&screen=place' + 
                  '&ajax=command' + 
                  '&target=' + targetId;
        
        // Remove existing overlay
        removeOverlay();
        
        // Create overlay
        var overlay = createOverlay();
        
        // Fetch form
        fetch(url, {
            headers: {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "tribalwars-ajax": "1",
                "x-requested-with": "XMLHttpRequest",
                "x-csrf-token": getCsrfToken() || ''
            },
            credentials: "include"
        })
        .then(response => response.text())
        .then(text => {
            try {
                var jsonData = JSON.parse(text);
                if (jsonData.response && jsonData.response.dialog) {
                    showFormDialog(jsonData.response.dialog, targetId, attackerId);
                } else {
                    showError('Неожиданный формат ответа');
                }
            } catch (e) {
                showError('Ошибка парсинга: ' + e.message);
            }
        })
        .catch(error => {
            showError('Ошибка загрузки: ' + error.message);
        });
    }
    
    // Create overlay
    function createOverlay() {
        var overlay = document.createElement('div');
        overlay.id = 'tw-attack-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        document.body.appendChild(overlay);
        return overlay;
    }
    
    // Remove overlay
    function removeOverlay() {
        var overlay = document.getElementById('tw-attack-overlay');
        if (overlay) overlay.remove();
    }
    
    // Show error
    function showError(message) {
        var overlay = document.getElementById('tw-attack-overlay');
        if (!overlay) return;
        
        overlay.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 8px; max-width: 500px;">
                <h3 style="color: #d32f2f; margin-top: 0;">❌ Ошибка</h3>
                <p>${message}</p>
                <button onclick="removeOverlay()" style="
                    background: #2196f3;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 20px;
                ">Закрыть</button>
            </div>
        `;
    }
    
    // Show first form dialog
    function showFormDialog(html, targetId, attackerId) {
        var overlay = document.getElementById('tw-attack-overlay');
        if (!overlay) return;
        
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        var form = tempDiv.querySelector('#command-data-form');
        if (!form) {
            showError('Форма не найдена в ответе');
            return;
        }
        
        // Store attack data
        currentAttackData = { targetId, attackerId };
        
        // Create form container
        var container = document.createElement('div');
        container.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        `;
        
        // Add title
        var title = document.createElement('h3');
        title.textContent = `⚔️ Атака деревни #${targetId}`;
        title.style.cssText = 'margin-top: 0; color: #333; text-align: center; margin-bottom: 20px;';
        container.appendChild(title);
        
        // Clone and append form
        var formClone = form.cloneNode(true);
        container.appendChild(formClone);
        
        // Add custom submit handler
        var formElement = container.querySelector('form');
        formElement.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFirstForm(this, targetId);
        });
        
        // Add close button
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
            width: 30px;
            height: 30px;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
        `;
        closeBtn.onclick = removeOverlay;
        container.appendChild(closeBtn);
        
        overlay.innerHTML = '';
        overlay.appendChild(container);
    }
    
    // Submit first form
    function submitFirstForm(formElement, targetId) {
        console.log('Отправка первой формы...');
        
        // Collect form data
        var formData = new FormData(formElement);
        
        // Get troop counts
        var troopCounts = {};
        ['spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult', 'knight', 'snob'].forEach(unit => {
            var input = formElement.querySelector(`[name="${unit}"]`);
            if (input) troopCounts[unit] = input.value || 0;
        });
        
        console.log('Отправляемые войска:', troopCounts);
        
        // Show loading
        var overlay = document.getElementById('tw-attack-overlay');
        if (overlay) {
            overlay.innerHTML = '<div style="color: white; font-size: 18px;">⏳ Отправка войск...</div>';
        }
        
        // Submit form
        fetch(formElement.action, {
            method: 'POST',
            headers: {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "content-type": "application/x-www-form-urlencoded",
                "tribalwars-ajax": "1",
                "x-requested-with": "XMLHttpRequest"
            },
            body: new URLSearchParams(formData),
            credentials: "include"
        })
        .then(response => response.text())
        .then(text => {
            console.log('Ответ первой формы (первые 1000 символов):', text.substring(0, 1000));
            
            try {
                var jsonData = JSON.parse(text);
                if (jsonData.response && jsonData.response.dialog) {
                    // Show confirmation dialog
                    showConfirmationDialog(jsonData.response.dialog, targetId, troopCounts);
                } else {
                    showError('Не получен диалог подтверждения');
                }
            } catch (e) {
                // Try to parse as HTML
                showConfirmationDialog(text, targetId, troopCounts);
            }
        })
        .catch(error => {
            showError('Ошибка отправки: ' + error.message);
        });
    }
    
    // Show confirmation dialog
    function showConfirmationDialog(html, targetId, troopCounts) {
        var overlay = document.getElementById('tw-attack-overlay');
        if (!overlay) return;
        
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        var confirmForm = tempDiv.querySelector('#command-data-form');
        
        if (!confirmForm) {
            showError('Форма подтверждения не найдена');
            return;
        }
        
        // Create confirmation container
        var container = document.createElement('div');
        container.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        `;
        
        // Add title
        var title = document.createElement('h3');
        title.textContent = `✅ Подтверждение атаки #${targetId}`;
        title.style.cssText = 'margin-top: 0; color: #333; text-align: center; margin-bottom: 20px;';
        container.appendChild(title);
        
        // Clone and append form
        var formClone = confirmForm.cloneNode(true);
        container.appendChild(formClone);
        
        // Extract critical data from form
        var formElement = container.querySelector('form');
        var chInput = formElement.querySelector('input[name="ch"]');
        var actionUrl = formElement.getAttribute('action');
        
        console.log('Данные подтверждения:', {
            actionUrl: actionUrl,
            chToken: chInput ? chInput.value.substring(0, 50) + '...' : 'не найден',
            troopCounts: troopCounts
        });
        
        // Store confirmation data
        currentAttackData.confirmation = {
            action: actionUrl,
            ch: chInput ? chInput.value : null,
            troopCounts: troopCounts
        };
        
        // Add custom submit handler
        formElement.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFinalConfirmation(this, targetId);
        });
        
        // Add close button
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
            width: 30px;
            height: 30px;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
        `;
        closeBtn.onclick = removeOverlay;
        container.appendChild(closeBtn);
        
        // Add send button
        var sendBtn = document.createElement('button');
        sendBtn.textContent = '🚀 Отправить атаку';
        sendBtn.style.cssText = `
            display: block;
            width: 100%;
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            border: none;
            padding: 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            margin-top: 20px;
        `;
        sendBtn.onclick = function() {
            submitFinalConfirmation(formElement, targetId);
        };
        container.appendChild(sendBtn);
        
        overlay.innerHTML = '';
        overlay.appendChild(container);
    }
    
    // Submit final confirmation - THIS IS THE FIXED FUNCTION
    function submitFinalConfirmation(formElement, targetId) {
        console.log('Отправка финального подтверждения...');
        
        // Collect ALL form data
        var formData = new FormData(formElement);
        
        // Show loading
        var overlay = document.getElementById('tw-attack-overlay');
        if (overlay) {
            overlay.innerHTML = '<div style="color: white; font-size: 18px;">🚀 Отправка атаки...</div>';
        }
        
        // Extract action URL
        var actionUrl = formElement.getAttribute('action');
        
        // Log what we're sending
        console.log('Финальные данные:');
        for (var pair of formData.entries()) {
            console.log('  ', pair[0], '=', pair[1].substring(0, 100) + (pair[1].length > 100 ? '...' : ''));
        }
        
        // FIRST: Submit the confirmation form
        fetch(actionUrl, {
            method: 'POST',
            headers: {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "content-type": "application/x-www-form-urlencoded",
                "tribalwars-ajax": "1",
                "x-requested-with": "XMLHttpRequest"
            },
            body: new URLSearchParams(formData),
            credentials: "include"
        })
        .then(response => response.text())
        .then(text => {
            console.log('Ответ на подтверждение:', text.substring(0, 500));
            
            // SECOND: Send the final AJAX request to actually create the attack
            sendFinalAttackRequest(targetId);
        })
        .catch(error => {
            showError('Ошибка подтверждения: ' + error.message);
        });
    }
    
    // Send the final AJAX request that actually creates the attack
    function sendFinalAttackRequest(targetId) {
        console.log('Отправка финального AJAX запроса...');
        
        var attackerId = currentAttackData.attackerId;
        
        // This is the critical request that actually creates the attack
        var finalUrl = window.location.origin + '/game.php?' + 
                      'village=' + attackerId + 
                      '&screen=place' + 
                      '&ajaxaction=popup_command';
        
        console.log('Финальный URL:', finalUrl);
        
        fetch(finalUrl, {
            method: 'POST',
            headers: {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "content-type": "application/x-www-form-urlencoded",
                "tribalwars-ajax": "1",
                "x-requested-with": "XMLHttpRequest"
            },
            body: new URLSearchParams({
                'village': attackerId,
                'screen': 'place',
                'ajaxaction': 'popup_command'
            }),
            credentials: "include"
        })
        .then(response => response.text())
        .then(text => {
            console.log('Финальный ответ:', text);
            
            try {
                var jsonData = JSON.parse(text);
                if (jsonData.response && jsonData.response.message) {
                    showSuccess('✅ ' + jsonData.response.message);
                } else if (jsonData.response && jsonData.response.type === 'attack') {
                    showSuccess('✅ Атака успешно отправлена!');
                } else {
                    showSuccess('✅ Атака отправлена!');
                }
            } catch (e) {
                showSuccess('✅ Атака отправлена!');
            }
            
            // Update troops in village
            updateVillageTroops();
        })
        .catch(error => {
            showError('Ошибка финальной отправки: ' + error.message);
        });
    }
    
    // Show success message
    function showSuccess(message) {
        var overlay = document.getElementById('tw-attack-overlay');
        if (!overlay) return;
        
        overlay.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 8px; max-width: 500px; text-align: center;">
                <h3 style="color: #4CAF50; margin-top: 0;">✅ Успех!</h3>
                <p>${message}</p>
                <p><small>Закройте это окно и проверьте отправленные атаки</small></p>
                <button onclick="removeOverlay()" style="
                    background: #2196f3;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 20px;
                ">Закрыть</button>
            </div>
        `;
    }
    
    // Update village troops display (optional)
    function updateVillageTroops() {
        // This would update the troop counts on the page
        console.log('Обновление отображения войск...');
        // You could reload the page or update specific elements
    }
    
    // Create button
    function createButton() {
        var btn = document.createElement('button');
        btn.id = 'tw-attack-btn';
        btn.textContent = '⚔️ Атака';
        btn.title = 'Атаковать деревню';
        
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999998;
            background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
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
            showAttackForm();
        };
        
        document.body.appendChild(btn);
    }
    
    // Make functions available globally
    window.showAttackForm = showAttackForm;
    window.removeOverlay = removeOverlay;
    
    // Initialize
    console.log('⚔️ Tribal Wars Attack Script loaded!');
    console.log('Use showAttackForm(targetId) to attack a village');
    
    // Add button
    setTimeout(createButton, 1000);
    
})();
