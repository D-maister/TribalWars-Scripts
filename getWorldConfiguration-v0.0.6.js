//javascript:
(function() {
    // Функция для получения имени сервера из URL
    function getServerNameFromUrl() {
        try {
            return window.location.hostname.split('.')[0];
        } catch (e) {
            return 'unknown';
        }
    }
    
    // Функция для преобразования XML в объект
    function xmlToObject(xml) {
        var obj = {};
        
        $(xml).children().each(function() {
            var $el = $(this);
            var tagName = $el.prop("tagName");
            
            if ($el.children().length > 0 && $el.children()[0].nodeType === 1) {
                // Вложенная категория
                obj[tagName] = xmlToObject($el);
            } else {
                // Простое значение
                obj[tagName] = $el.text();
            }
        });
        
        return obj;
    }
    
    // Функция для отображения конфигурации
    function displayConfig(configObj) {
        var serverName = getServerNameFromUrl();
        
        // Создаем всплывающее окно
        var html = `
            <div id="configPopup" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
                background:#f5f5e1;border:3px solid #8B4513;border-radius:8px;padding:20px;
                width:95%;max-width:1200px;height:90vh;overflow-y:auto;z-index:10000;
                box-shadow:0 0 30px rgba(0,0,0,0.7);font-family:Arial;">
                <div style="display:flex;justify-content:space-between;align-items:center;
                    margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #8B4513;">
                    <div>
                        <h2 style="margin:0 0 5px 0;color:#8B4513;">Конфигурация мира</h2>
                        <div style="color:#666;">Сервер: <strong>${serverName}</strong></div>
                    </div>
                    <div>
                        <button onclick="closeConfigPopup()" style="background:#8B4513;color:white;
                            border:none;padding:8px 15px;border-radius:4px;cursor:pointer;">Закрыть</button>
                    </div>
                </div>
                <div id="configContent"></div>
            </div>
            <div id="configOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;
                background:rgba(0,0,0,0.7);z-index:9999;" onclick="closeConfigPopup()"></div>
        `;
        
        // Удаляем старые элементы
        closeConfigPopup();
        
        // Добавляем новое окно
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Добавляем контент
        var contentDiv = document.getElementById('configContent');
        
        // Создаем таблицы для каждого раздела
        var htmlContent = '';
        var totalSettings = 0;
        
        // Обрабатываем каждый ключ в конфигурации
        Object.keys(configObj).forEach(function(key) {
            var value = configObj[key];
            
            if (typeof value === 'object' && value !== null) {
                // Это категория (вложенный объект)
                htmlContent += createCategoryTable(key, value);
                totalSettings += Object.keys(value).length;
            } else {
                // Это простая настройка - добавим позже в общую таблицу
            }
        });
        
        // Добавляем общую таблицу для простых настроек
        var simpleSettings = {};
        Object.keys(configObj).forEach(function(key) {
            var value = configObj[key];
            if (typeof value !== 'object' || value === null) {
                simpleSettings[key] = value;
            }
        });
        
        if (Object.keys(simpleSettings).length > 0) {
            htmlContent = createCategoryTable('Основные настройки', simpleSettings) + htmlContent;
            totalSettings += Object.keys(simpleSettings).length;
        }
        
        contentDiv.innerHTML = htmlContent;
        
        // Добавляем статистику
        contentDiv.insertAdjacentHTML('beforeend', 
            `<div style="margin-top:20px;padding-top:15px;border-top:1px solid #ddd;color:#666;">
                Всего настроек: ${totalSettings}<br>
                Обновлено: ${new Date().toLocaleTimeString()}
            </div>`);
    }
    
    // Функция для создания таблицы категории
    function createCategoryTable(categoryName, categoryData) {
        var keys = Object.keys(categoryData);
        
        if (keys.length === 0) return '';
        
        // Проверяем, есть ли в этой категории вложенные объекты
        var hasNestedObjects = keys.some(function(key) {
            var value = categoryData[key];
            return typeof value === 'object' && value !== null;
        });
        
        if (hasNestedObjects) {
            // Разделяем на подкатегории
            return createNestedCategoryTable(categoryName, categoryData);
        }
        
        var tableHtml = `
            <div style="margin-bottom:25px;background:white;border:1px solid #ddd;border-radius:5px;overflow:hidden;">
                <div style="background:#8B4513;color:white;padding:12px 15px;font-weight:bold;">
                    ${formatCategoryName(categoryName)} 
                    <span style="font-size:12px;opacity:0.8;">(${keys.length})</span>
                </div>
                <div style="padding:0;">
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f9f9f9;">
                                <th style="padding:10px;text-align:left;border-bottom:2px solid #ddd;width:60%;">Настройка</th>
                                <th style="padding:10px;text-align:left;border-bottom:2px solid #ddd;width:40%;">Значение</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        keys.forEach(function(key) {
            var value = categoryData[key];
            var displayValue = formatValue(value, key);
            
            tableHtml += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px;">
                        <div style="font-weight:bold;">${formatKeyName(key)}</div>
                        <div style="font-size:11px;color:#888;">${key}</div>
                    </td>
                    <td style="padding:10px;">
                        <div style="word-break:break-word;">${displayValue}</div>
                    </td>
                </tr>
            `;
        });
        
        tableHtml += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        return tableHtml;
    }
    
    // Функция для создания таблицы с вложенными категориями
    function createNestedCategoryTable(categoryName, categoryData) {
        var html = `
            <div style="margin-bottom:25px;background:white;border:1px solid #ddd;border-radius:5px;overflow:hidden;">
                <div style="background:#8B4513;color:white;padding:12px 15px;font-weight:bold;">
                    ${formatCategoryName(categoryName)}
                </div>
                <div style="padding:15px;">
        `;
        
        Object.keys(categoryData).forEach(function(key) {
            var value = categoryData[key];
            
            if (typeof value === 'object' && value !== null) {
                // Вложенная подкатегория
                html += `<div style="margin-bottom:15px;">
                    <div style="font-weight:bold;color:#8B4513;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #eee;">
                        ${formatKeyName(key)}
                    </div>
                    <div style="padding-left:15px;">
                `;
                
                Object.keys(value).forEach(function(subKey) {
                    var subValue = value[subKey];
                    html += `<div style="margin-bottom:5px;display:flex;">
                        <div style="width:60%;font-weight:bold;padding-right:10px;">${formatKeyName(subKey)}</div>
                        <div style="width:40%;">${formatValue(subValue, subKey)}</div>
                    </div>`;
                });
                
                html += `</div></div>`;
            } else {
                // Простая настройка
                html += `<div style="margin-bottom:8px;display:flex;">
                    <div style="width:60%;font-weight:bold;padding-right:10px;">${formatKeyName(key)}</div>
                    <div style="width:40%;">${formatValue(value, key)}</div>
                </div>`;
            }
        });
        
        html += `</div></div>`;
        return html;
    }
    
    // Функция для форматирования имени категории
    function formatCategoryName(name) {
        return name
            .replace(/_/g, ' ')
            .replace(/^./, function(str) { return str.toUpperCase(); });
    }
    
    // Функция для форматирования имени ключа
    function formatKeyName(key) {
        return key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, function(str) { return str.toUpperCase(); })
            .trim();
    }
    
    // Функция для форматирования значения
    function formatValue(value, key) {
        if (value === null || value === undefined) return '—';
        
        // Если это объект (не должно быть, но на всякий случай)
        if (typeof value === 'object') {
            return '[Категория с настройками]';
        }
        
        // Проверяем булевы значения
        if (value === '0' || value === '1') {
            // Список известных булевых ключей
            var booleanKeys = ['knight', 'archer', 'church', 'watchtower', 'stronghold', 
                              'scavenging', 'hauls', 'event', 'relics', 'tutorial', 'destroy',
                              'available', 'moral', 'allow', 'active', 'give_prizes', 'free_Premium',
                              'AccountManager', 'ItemNameColor', 'free_AccountManager', 'BuildTimeReduction',
                              'BuildInstant', 'BuildInstant_free', 'BuildCostReduction', 'FarmAssistent',
                              'MerchantBonus', 'ProductionBonus', 'NoblemanSlot', 'MerchantExchange',
                              'PremiumExchange', 'KnightBookImprove', 'KnightBookDowngrade', 'KnightBookReroll',
                              'KnightRespec', 'KnightRecruitTime', 'KnightRecruitInstant', 'KnightReviveTime',
                              'KnightReviveInstant', 'KnightTrainingCost', 'KnightTrainingTime', 'KnightTrainingInstant',
                              'DailyBonusUnlock', 'ScavengingSquadLoot', 'PremiumEventFeatures', 'PremiumRelicFeatures',
                              'VillageSkin', 'milestones_available', 'removeNewbieVillages', 'fake_limit',
                              'cheap_rebuild', 'no_barb_conquer', 'no_harm', 'fixed_allies', 'fixed_allies_randomized',
                              'auto_lock_tribes', 'levels', 'select_start', 'noble_restart', 'disable_morale',
                              'attack_block', 'block_noble', 'limit_inventory_transfer'];
            
            if (booleanKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
                return value === '1' ? '✓ Да' : '✗ Нет';
            }
        }
        
        // Форматируем числовые значения
        if (!isNaN(value) && value !== '') {
            var num = parseFloat(value);
            // Для больших чисел добавляем разделители
            if (num >= 1000) {
                return num.toLocaleString();
            }
        }
        
        return value;
    }
    
    // Глобальная функция для закрытия попапа
    window.closeConfigPopup = function() {
        document.getElementById('configPopup')?.remove();
        document.getElementById('configOverlay')?.remove();
    };
    
    // Основная функция
    function loadConfig() {
        if (typeof jQuery === 'undefined') {
            alert('Ошибка: jQuery не найден');
            return;
        }
        
        $.ajax({
            'async': false,
            'url': '/interface.php?func=get_config',
            'dataType': 'xml',
            'success': function(xml) {
                var configObj = xmlToObject(xml);
                displayConfig(configObj);
                console.log('Конфигурация загружена:', configObj);
            },
            'error': function() {
                alert('Ошибка загрузки конфигурации');
            }
        });
    }
    
    // Запускаем
    loadConfig();
})();
