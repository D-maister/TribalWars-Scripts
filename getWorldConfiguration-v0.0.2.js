//javascript:
// Configuration World Extractor for Tribal Wars
(function() {
    // Функция для получения конфигурации мира
    function configurationWorld() {
        console.log('[WorldConfig] Загрузка конфигурации мира...');
        
        var configData = null;
        
        // Синхронный AJAX запрос для получения конфигурации
        $.ajax({
            'async': false,
            'url': '/interface.php?func=get_config',
            'dataType': 'xml',
            'success': function (data) {
                configData = data;
                console.log('[WorldConfig] Конфигурация мира успешно загружена');
                console.log(configData)
                
                // Извлекаем основные параметры
                var gameSpeed = Number($(data).find("config speed").text());
                var unitSpeed = Number($(data).find("config unit_speed").text());
                var archers = Number($(data).find("game archer").text());
                var knight = Number($(data).find("game knight").text());
                
                // Рассчитываем мировую скорость
                var worldSpeed = Number((gameSpeed * unitSpeed).toFixed(5));
                
                console.log('[WorldConfig] Основные параметры:');
                console.log('[WorldConfig] Скорость игры: ' + gameSpeed);
                console.log('[WorldConfig] Скорость юнитов: ' + unitSpeed);
                console.log('[WorldConfig] Мировая скорость: ' + worldSpeed);
                console.log('[WorldConfig] Луки доступны: ' + (archers ? 'Да' : 'Нет'));
                console.log('[WorldConfig] Рыцари доступны: ' + (knight ? 'Да' : 'Нет'));
                
                // Дополнительная информация
                var serverName = $(data).find("config name").text();
                var startTime = $(data).find("config start_time").text();
                var registrationActive = $(data).find("config registration").text();
                
                console.log('[WorldConfig] Имя сервера: ' + serverName);
                console.log('[WorldConfig] Время начала: ' + startTime);
                console.log('[WorldConfig] Регистрация активна: ' + registrationActive);
                
            },
            'error': function(jqXHR, textStatus, errorThrown) {
                console.error('[WorldConfig] Ошибка загрузки конфигурации мира:', textStatus, errorThrown);
                alert('Ошибка загрузки конфигурации мира. Проверьте консоль для деталей.');
            }
        });
        
        return configData;
    }
    
    // Функция для отображения конфигурации в удобном формате
    function displayWorldConfig() {
        var config = configurationWorld();
        
        if (!config) {
            console.error('[WorldConfig] Не удалось загрузить конфигурацию');
            return;
        }
        
        // Создаем всплывающее окно с информацией
        var popupHTML = `
            <div id="worldConfigPopup" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #f5f5e1;
                border: 2px solid #8B4513;
                border-radius: 5px;
                padding: 15px;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                z-index: 10000;
                box-shadow: 0 0 20px rgba(0,0,0,0.5);
                font-family: Arial, sans-serif;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    border-bottom: 1px solid #8B4513;
                    padding-bottom: 10px;
                ">
                    <h3 style="margin: 0; color: #8B4513;">Конфигурация мира</h3>
                    <button onclick="document.getElementById('worldConfigPopup').remove();" style="
                        background: #8B4513;
                        color: white;
                        border: none;
                        padding: 5px 10px;
                        border-radius: 3px;
                        cursor: pointer;
                    ">Закрыть</button>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>Основные параметры:</strong>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        <li>Имя сервера: <span id="configName"></span></li>
                        <li>Скорость игры: <span id="configSpeed"></span></li>
                        <li>Скорость юнитов: <span id="configUnitSpeed"></span></li>
                        <li>Мировая скорость: <span id="configWorldSpeed"></span></li>
                        <li>Луки: <span id="configArchers"></span></li>
                        <li>Рыцари: <span id="configKnights"></span></li>
                    </ul>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>Дополнительная информация:</strong>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        <li>Время начала: <span id="configStartTime"></span></li>
                        <li>Регистрация: <span id="configRegistration"></span></li>
                        <li>Тип сервера: <span id="configServerType"></span></li>
                        <li>Клан на весь мир: <span id="configTribeOnWorld"></span></li>
                    </ul>
                </div>
                
                <div style="
                    background: #e8e4d8;
                    padding: 10px;
                    border-radius: 3px;
                    font-size: 12px;
                    color: #666;
                ">
                    <strong>Сырые данные XML:</strong>
                    <pre style="
                        background: white;
                        padding: 10px;
                        border-radius: 3px;
                        font-size: 10px;
                        max-height: 200px;
                        overflow-y: auto;
                        margin: 10px 0 0 0;
                    " id="configXML"></pre>
                </div>
            </div>
        `;
        
        // Добавляем оверлей
        var overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 9999;
        `;
        overlay.onclick = function() {
            document.getElementById('worldConfigPopup')?.remove();
            overlay.remove();
        };
        
        document.body.appendChild(overlay);
        document.body.insertAdjacentHTML('beforeend', popupHTML);
        
        // Заполняем данные
        setTimeout(function() {
            var popup = document.getElementById('worldConfigPopup');
            if (popup) {
                // Основные параметры
                popup.querySelector('#configName').textContent = $(config).find("config name").text();
                popup.querySelector('#configSpeed').textContent = $(config).find("config speed").text();
                popup.querySelector('#configUnitSpeed').textContent = $(config).find("config unit_speed").text();
                
                var gameSpeed = Number($(config).find("config speed").text());
                var unitSpeed = Number($(config).find("config unit_speed").text());
                var worldSpeed = Number((gameSpeed * unitSpeed).toFixed(5));
                popup.querySelector('#configWorldSpeed').textContent = worldSpeed;
                
                var archers = Number($(config).find("game archer").text());
                var knight = Number($(config).find("game knight").text());
                popup.querySelector('#configArchers').textContent = archers ? '✓ Доступны' : '✗ Не доступны';
                popup.querySelector('#configKnights').textContent = knight ? '✓ Доступны' : '✗ Не доступны';
                
                // Дополнительная информация
                popup.querySelector('#configStartTime').textContent = $(config).find("config start_time").text();
                popup.querySelector('#configRegistration').textContent = $(config).find("config registration").text();
                popup.querySelector('#configServerType').textContent = $(config).find("config server_type").text();
                popup.querySelector('#configTribeOnWorld').textContent = $(config).find("config tribe_on_world").text();
                
                // Сырые XML данные (обрезанные для читаемости)
                var xmlText = new XMLSerializer().serializeToString(config);
                // Обрезаем до 2000 символов для читаемости
                if (xmlText.length > 2000) {
                    xmlText = xmlText.substring(0, 2000) + '\n\n... [данные обрезаны] ...';
                }
                popup.querySelector('#configXML').textContent = xmlText;
            }
        }, 100);
    }
    
    // Функция для копирования конфигурации в буфер обмена
    function copyConfigToClipboard() {
        var config = configurationWorld();
        if (!config) return;
        
        var configText = 'Конфигурация мира Tribal Wars\n\n';
        configText += 'Имя сервера: ' + $(config).find("config name").text() + '\n';
        configText += 'Скорость игры: ' + $(config).find("config speed").text() + '\n';
        configText += 'Скорость юнитов: ' + $(config).find("config unit_speed").text() + '\n';
        
        var gameSpeed = Number($(config).find("config speed").text());
        var unitSpeed = Number($(config).find("config unit_speed").text());
        var worldSpeed = Number((gameSpeed * unitSpeed).toFixed(5));
        configText += 'Мировая скорость: ' + worldSpeed + '\n';
        
        var archers = Number($(config).find("game archer").text());
        var knight = Number($(config).find("game knight").text());
        configText += 'Луки: ' + (archers ? 'Доступны' : 'Не доступны') + '\n';
        configText += 'Рыцари: ' + (knight ? 'Доступны' : 'Не доступны') + '\n';
        configText += 'Время начала: ' + $(config).find("config start_time").text() + '\n';
        configText += 'Регистрация: ' + $(config).find("config registration").text() + '\n';
        
        // Копируем в буфер обмена
        navigator.clipboard.writeText(configText).then(function() {
            console.log('[WorldConfig] Конфигурация скопирована в буфер обмена');
            alert('Конфигурация скопирована в буфер обмена!');
        }).catch(function(err) {
            console.error('[WorldConfig] Ошибка копирования в буфер обмена:', err);
            alert('Не удалось скопировать в буфер обмена. Проверьте консоль для деталей.');
        });
    }
    
    // Проверяем, загружена ли jQuery
    if (typeof jQuery === 'undefined') {
        console.error('[WorldConfig] jQuery не загружен. Скрипт требует jQuery для работы.');
        alert('Ошибка: jQuery не найден. Этот скрипт требует jQuery для работы.');
        return;
    }
    
    // Проверяем, что мы на Tribal Wars
    if (typeof game_data === 'undefined') {
        console.warn('[WorldConfig] game_data не определен. Возможно, вы не на странице Tribal Wars.');
        alert('Внимание: game_data не найден. Убедитесь, что вы на странице Tribal Wars.');
    }
    
    // Создаем кнопку для отображения конфигурации
    var buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        position: fixed;
        top: 100px;
        right: 10px;
        z-index: 9998;
        display: flex;
        flex-direction: column;
        gap: 5px;
    `;
    
    var showButton = document.createElement('button');
    showButton.textContent = 'Показать конфигурацию';
    showButton.style.cssText = `
        background: #8B4513;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-family: Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    `;
    showButton.onclick = displayWorldConfig;
    
    var copyButton = document.createElement('button');
    copyButton.textContent = 'Копировать конфигурацию';
    copyButton.style.cssText = `
        background: #5D8AA8;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-family: Arial, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    `;
    copyButton.onclick = copyConfigToClipboard;
    
    buttonContainer.appendChild(showButton);
    buttonContainer.appendChild(copyButton);
    document.body.appendChild(buttonContainer);
    
    // Также сразу логируем конфигурацию в консоль
    console.log('[WorldConfig] Скрипт загружен. Используйте кнопки в правом верхнем углу для просмотра конфигурации.');
    configurationWorld();
    
    // Экспортируем функцию для глобального использования
    window.getWorldConfig = configurationWorld;
    
})();

// Ссылка для добавления в букмарклет:
// javascript:(function(){var script=document.createElement('script');script.type='text/javascript';script.src='https://your-domain.com/world-config.js';document.getElementsByTagName('head')[0].appendChild(script);})();
