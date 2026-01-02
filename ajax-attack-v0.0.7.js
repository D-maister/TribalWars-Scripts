(function() {
    console.log('=== Simple Tribal Wars Attack Form Viewer ===');
    
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
    
    // Fetch and display attack form
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
        
        console.log('Получение формы атаки для цели:', targetId);
        
        // Build URL
        var url = window.location.origin + '/game.php?' + 
                  'village=' + attackerId + 
                  '&screen=place' + 
                  '&ajax=command' + 
                  '&target=' + targetId;
        
        // Remove existing form if any
        var existingForm = document.getElementById('attack-form-overlay');
        if (existingForm) existingForm.remove();
        
        // Create overlay container
        var overlay = document.createElement('div');
        overlay.id = 'attack-form-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        // Create form container
        var formContainer = document.createElement('div');
        formContainer.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        `;
        
        // Create loading message
        formContainer.innerHTML = '<div style="padding: 20px; text-align: center;">⏳ Загрузка формы атаки...</div>';
        
        overlay.appendChild(formContainer);
        document.body.appendChild(overlay);
        
        // Fetch the form
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
                // Try to parse as JSON
                var jsonData = JSON.parse(text);
                if (jsonData.response && jsonData.response.dialog) {
                    // Extract just the form from the dialog
                    var tempDiv = document.createElement('div');
                    tempDiv.innerHTML = jsonData.response.dialog;
                    var form = tempDiv.querySelector('#command-data-form');
                    
                    if (form) {
                        // Create a clean container for the form
                        var formWrapper = document.createElement('div');
                        formWrapper.style.cssText = 'min-width: 500px;';
                        
                        // Add title
                        var title = document.createElement('h3');
                        title.textContent = `⚔️ Атака деревни #${targetId}`;
                        title.style.cssText = 'margin-top: 0; color: #333; text-align: center;';
                        formWrapper.appendChild(title);
                        
                        // Add the form itself
                        formWrapper.appendChild(form.cloneNode(true));
                        
                        // Add submit handler
                        var formElement = formWrapper.querySelector('form');
                        if (formElement) {
                            formElement.addEventListener('submit', function(e) {
                                e.preventDefault();
                                submitAttackForm(this, targetId);
                            });
                        }
                        
                        // Replace loading with form
                        formContainer.innerHTML = '';
                        formContainer.appendChild(formWrapper);
                    } else {
                        formContainer.innerHTML = '<div style="color: red;">❌ Форма не найдена в ответе</div>';
                    }
                } else {
                    formContainer.innerHTML = '<div style="color: red;">❌ Неожиданный формат ответа</div>';
                }
            } catch (e) {
                formContainer.innerHTML = '<div style="color: red;">❌ Ошибка парсинга: ' + e.message + '</div>';
            }
        })
        .catch(error => {
            formContainer.innerHTML = '<div style="color: red;">❌ Ошибка загрузки: ' + error.message + '</div>';
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
            z-index: 10000;
        `;
        closeBtn.onclick = function() {
            overlay.remove();
        };
        formContainer.appendChild(closeBtn);
    }
    
    // Handle form submission
    function submitAttackForm(formElement, targetId) {
        console.log('Отправка формы атаки...');
        
        // Collect form data
        var formData = new FormData(formElement);
        
        // Show loading
        var overlay = document.getElementById('attack-form-overlay');
        if (overlay) {
            overlay.querySelector('div').innerHTML = '<div style="padding: 20px; text-align: center;">⏳ Отправка атаки...</div>';
        }
        
        // Submit to form action
        fetch(formElement.action, {
            method: 'POST',
            headers: {
                "tribalwars-ajax": "1",
                "x-requested-with": "XMLHttpRequest"
            },
            body: new URLSearchParams(formData),
            credentials: "include"
        })
        .then(response => response.text())
        .then(text => {
            console.log('Ответ на отправку формы:', text.substring(0, 500));
            
            try {
                var jsonData = JSON.parse(text);
                if (jsonData.response && jsonData.response.dialog) {
                    // Show confirmation dialog
                    showConfirmationDialog(jsonData.response.dialog, targetId);
                } else {
                    alert('✅ Атака отправлена!');
                    document.getElementById('attack-form-overlay')?.remove();
                }
            } catch (e) {
                // If not JSON, might be direct HTML response
                var tempDiv = document.createElement('div');
                tempDiv.innerHTML = text;
                
                // Check for success indicators
                if (text.includes('success') || text.includes('успех') || text.includes('отправлен')) {
                    alert('✅ Атака отправлена успешно!');
                    document.getElementById('attack-form-overlay')?.remove();
                } else {
                    showConfirmationDialog(text, targetId);
                }
            }
        })
        .catch(error => {
            alert('❌ Ошибка отправки: ' + error.message);
        });
    }
    
    // Show confirmation dialog
    function showConfirmationDialog(html, targetId) {
        var overlay = document.getElementById('attack-form-overlay');
        if (!overlay) return;
        
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        var confirmationForm = tempDiv.querySelector('#command-data-form');
        
        if (confirmationForm) {
            var formWrapper = document.createElement('div');
            formWrapper.style.cssText = 'min-width: 600px;';
            
            var title = document.createElement('h3');
            title.textContent = `✅ Подтверждение атаки на деревню #${targetId}`;
            title.style.cssText = 'margin-top: 0; color: #333; text-align: center;';
            formWrapper.appendChild(title);
            
            formWrapper.appendChild(confirmationForm.cloneNode(true));
            
            // Update form container
            overlay.querySelector('div').innerHTML = '';
            overlay.querySelector('div').appendChild(formWrapper);
            
            // Add handler for final confirmation
            var confirmForm = formWrapper.querySelector('form');
            if (confirmForm) {
                confirmForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    submitFinalConfirmation(this, targetId);
                });
            }
        } else {
            overlay.querySelector('div').innerHTML = '<div style="padding: 20px;">' + html + '</div>';
        }
    }
    
    // Submit final confirmation
    function submitFinalConfirmation(formElement, targetId) {
        console.log('Отправка финального подтверждения...');
        
        var formData = new FormData(formElement);
        
        fetch(formElement.action, {
            method: 'POST',
            headers: {
                "tribalwars-ajax": "1",
                "x-requested-with": "XMLHttpRequest"
            },
            body: new URLSearchParams(formData),
            credentials: "include"
        })
        .then(response => response.text())
        .then(text => {
            try {
                var jsonData = JSON.parse(text);
                if (jsonData.response && jsonData.response.message) {
                    alert('✅ ' + jsonData.response.message);
                } else {
                    alert('✅ Атака успешно отправлена!');
                }
            } catch (e) {
                alert('✅ Атака отправлена!');
            }
            
            document.getElementById('attack-form-overlay')?.remove();
        })
        .catch(error => {
            alert('❌ Ошибка подтверждения: ' + error.message);
        });
    }
    
    // Create button
    function createButton() {
        var btn = document.createElement('button');
        btn.textContent = '⚔️ Атака';
        btn.title = 'Показать форму атаки';
        
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9998;
            background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
        `;
        
        btn.onclick = function() {
            showAttackForm();
        };
        
        document.body.appendChild(btn);
    }
    
    // Make function available globally
    window.showAttackForm = showAttackForm;
    
    // Initialize
    console.log('Форма атаки загружена. Используйте:');
    console.log('- showAttackForm(targetId) - показать форму атаки');
    console.log('- Или нажмите кнопку в правом нижнем углу');
    
    // Add button
    setTimeout(createButton, 1000);
    
})();
