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
    
    // Глобальные переменные для хранения данных
    var worldConfig = null;
    var buildingInfo = null;
    var serverName = null;
    
    // Основная функция загрузки данных
    function loadAllData() {
        if (typeof jQuery === 'undefined') {
            alert('Ошибка: jQuery не найден');
            return;
        }
        
        serverName = getServerNameFromUrl();
        
        // Загружаем конфигурацию мира
        $.ajax({
            'async': false,
            'url': '/interface.php?func=get_config',
            'dataType': 'xml',
            'success': function(xml) {
                worldConfig = xmlToObject(xml);
                console.log('Конфигурация мира загружена');
                loadBuildingInfo();
            },
            'error': function() {
                alert('Ошибка загрузки конфигурации мира');
            }
        });
    }
    
    // Функция загрузки информации о зданиях
    function loadBuildingInfo() {
        $.ajax({
            'async': false,
            'url': '/interface.php?func=get_building_info',
            'dataType': 'xml',
            'success': function(xml) {
                buildingInfo = xmlToObject(xml);
                console.log('Информация о зданиях загружена');
                displayAllData();
            },
            'error': function() {
                console.log('Не удалось загрузить информацию о зданиях, отображаем только конфигурацию');
                buildingInfo = null;
                displayAllData();
            }
        });
    }
    
    // Функция для отображения всех данных
    function displayAllData() {
        // Создаем основное окно с вкладками
        var html = `
            <div id="dataPopup" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
                background:#f5f5e1;border:3px solid #8B4513;border-radius:8px;padding:20px;
                width:95%;max-width:1200px;height:90vh;overflow-y:auto;z-index:10000;
                box-shadow:0 0 30px rgba(0,0,0,0.7);font-family:Arial;">
                <div style="display:flex;justify-content:space-between;align-items:center;
                    margin-bottom:20px;padding-bottom:15px;border-bottom:2px solid #8B4513;">
                    <div>
                        <h2 style="margin:0 0 5px 0;color:#8B4513;">Информация о мире</h2>
                        <div style="color:#666;">Сервер: <strong>${serverName}</strong></div>
                    </div>
                    <div>
                        <button onclick="closeDataPopup()" style="background:#8B4513;color:white;
                            border:none;padding:8px 15px;border-radius:4px;cursor:pointer;">Закрыть</button>
                    </div>
                </div>
                
                <!-- Вкладки -->
                <div style="margin-bottom:20px;border-bottom:1px solid #ddd;">
                    <button id="tabWorld" onclick="showTab('world')" style="background:#8B4513;color:white;
                        border:none;padding:10px 20px;border-radius:4px 4px 0 0;cursor:pointer;margin-right:5px;">
                        Конфигурация мира
                    </button>
                    <button id="tabBuildings" onclick="showTab('buildings')" style="background:#e8e4d8;color:#8B4513;
                        border:1px solid #8B4513;border-bottom:none;padding:10px 20px;border-radius:4px 4px 0 0;
                        cursor:pointer;">
                        Информация о зданиях
                    </button>
                </div>
                
                <!-- Контент вкладок -->
                <div id="tabWorldContent" style="display:block;"></div>
                <div id="tabBuildingsContent" style="display:none;"></div>
                
                <!-- Статистика -->
                <div id="statsInfo" style="margin-top:20px;padding-top:15px;border-top:1px solid #ddd;color:#666;">
                    Обновлено: ${new Date().toLocaleTimeString()}
                </div>
            </div>
            <div id="dataOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;
                background:rgba(0,0,0,0.7);z-index:9999;" onclick="closeDataPopup()"></div>
        `;
        
        // Удаляем старые элементы
        closeDataPopup();
        
        // Добавляем новое окно
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Заполняем контент
        displayWorldConfig();
        if (buildingInfo) {
            displayBuildingInfo();
        } else {
            document.getElementById('tabBuildingsContent').innerHTML = 
                '<div style="text-align:center;padding:40px;color:#666;">' +
                'Информация о зданиях не загружена</div>';
        }
        
        // Обновляем статистику
        updateStats();
    }
    
    // Функция для отображения конфигурации мира
    function displayWorldConfig() {
        if (!worldConfig) return;
        
        var contentDiv = document.getElementById('tabWorldContent');
        var htmlContent = '';
        var totalSettings = 0;
        
        // Обрабатываем каждый ключ в конфигурации
        Object.keys(worldConfig).forEach(function(key) {
            var value = worldConfig[key];
            
            if (typeof value === 'object' && value !== null) {
                // Это категория (вложенный объект)
                htmlContent += createCategoryTable(key, value, 'world');
                totalSettings += Object.keys(value).length;
            } else {
                // Это простая настройка - добавим позже в общую таблицу
            }
        });
        
        // Добавляем общую таблицу для простых настроек
        var simpleSettings = {};
        Object.keys(worldConfig).forEach(function(key) {
            var value = worldConfig[key];
            if (typeof value !== 'object' || value === null) {
                simpleSettings[key] = value;
            }
        });
        
        if (Object.keys(simpleSettings).length > 0) {
            htmlContent = createCategoryTable('Основные настройки', simpleSettings, 'world') + htmlContent;
            totalSettings += Object.keys(simpleSettings).length;
        }
        
        contentDiv.innerHTML = htmlContent;
        
        // Добавляем заголовок если нет данных
        if (htmlContent === '') {
            contentDiv.innerHTML = '<div style="text-align:center;padding:40px;color:#666;">Нет данных</div>';
        }
    }
    
    // Функция для отображения информации о зданиях
    function displayBuildingInfo() {
        if (!buildingInfo) return;
        
        var contentDiv = document.getElementById('tabBuildingsContent');
        var htmlContent = '';
        
        // Проверяем структуру данных
        console.log('Building info structure:', buildingInfo);
        
        // Получаем список зданий
        var buildings = buildingInfo.buildings || buildingInfo;
        
        if (typeof buildings === 'object' && buildings !== null) {
            // Отображаем каждое здание
            Object.keys(buildings).forEach(function(buildingName) {
                var buildingData = buildings[buildingName];
                
                if (typeof buildingData === 'object' && buildingData !== null) {
                    htmlContent += createBuildingTable(buildingName, buildingData);
                }
            });
        } else {
            // Пытаемся найти здания в другом месте
            Object.keys(buildingInfo).forEach(function(key) {
                var data = buildingInfo[key];
                if (typeof data === 'object' && data !== null) {
                    // Проверяем, похоже ли это на данные здания
                    if (data.max_level || data.wood || data.stone || data.iron) {
                        htmlContent += createBuildingTable(key, data);
                    }
                }
            });
        }
        
        if (htmlContent === '') {
            // Если не нашли структурированных данных, покажем все как есть
            htmlContent = createCategoryTable('Информация о зданиях', buildingInfo, 'buildings');
        }
        
        contentDiv.innerHTML = htmlContent;
    }
    
    // Функция для создания таблицы категории
    function createCategoryTable(categoryName, categoryData, type) {
        var keys = Object.keys(categoryData);
        
        if (keys.length === 0) return '';
        
        // Проверяем, есть ли в этой категории вложенные объекты
        var hasNestedObjects = keys.some(function(key) {
            var value = categoryData[key];
            return typeof value === 'object' && value !== null;
        });
        
        if (hasNestedObjects && type === 'world') {
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
            var displayValue = formatValue(value, key, type);
            
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
    
    // Функция для создания таблицы здания
    function createBuildingTable(buildingName, buildingData) {
        var keys = Object.keys(buildingData);
        
        if (keys.length === 0) return '';
        
        var tableHtml = `
            <div style="margin-bottom:25px;background:white;border:1px solid #ddd;border-radius:5px;overflow:hidden;">
                <div style="background:#5D8AA8;color:white;padding:12px 15px;font-weight:bold;">
                    ${formatBuildingName(buildingName)}
                </div>
                <div style="padding:0;">
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="background:#f0f7ff;">
                                <th style="padding:10px;text-align:left;border-bottom:2px solid #ddd;width:60%;">Параметр</th>
                                <th style="padding:10px;text-align:left;border-bottom:2px solid #ddd;width:40%;">Значение</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        keys.forEach(function(key) {
            var value = buildingData[key];
            
            // Специальная обработка для некоторых параметров зданий
            var displayValue = formatBuildingValue(value, key);
            var displayKey = formatBuildingKey(key);
            
            tableHtml += `
                <tr style="border-bottom:1px solid #eee;">
                    <td style="padding:10px;">
                        <div style="font-weight:bold;">${displayKey}</div>
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
                        <div style="width:40%;">${formatValue(subValue, subKey, 'world')}</div>
                    </div>`;
                });
                
                html += `</div></div>`;
            } else {
                // Простая настройка
                html += `<div style="margin-bottom:8px;display:flex;">
                    <div style="width:60%;font-weight:bold;padding-right:10px;">${formatKeyName(key)}</div>
                    <div style="width:40%;">${formatValue(value, key, 'world')}</div>
                </div>`;
            }
        });
        
        html += `</div></div>`;
        return html;
    }
    
    // Функция для форматирования имени здания
    function formatBuildingName(name) {
        var buildingNames = {
            'main': 'Главное здание',
            'barracks': 'Казармы',
            'stable': 'Конюшня',
            'garage': 'Гараж',
            'smith': 'Кузница',
            'place': 'Площадь',
            'market': 'Рынок',
            'wood': 'Лесопилка',
            'stone': 'Каменоломня',
            'iron': 'Железный рудник',
            'farm': 'Ферма',
            'storage': 'Склад',
            'hide': 'Укрытие',
            'wall': 'Стена',
            'watchtower': 'Сторожевая башня',
            'snob': 'Дворец дворянина',
            'church': 'Церковь',
            'statue': 'Статуя'
        };
        
        return buildingNames[name] || formatCategoryName(name);
    }
    
    // Функция для форматирования ключа здания
    function formatBuildingKey(key) {
        var keyNames = {
            'max_level': 'Макс. уровень',
            'min_level': 'Мин. уровень',
            'wood': 'Дерево',
            'stone': 'Камень',
            'iron': 'Железо',
            'pop': 'Население',
            'build_time': 'Время строительства',
            'build_time_formula': 'Формула времени',
            'attributes': 'Атрибуты',
            'requirements': 'Требования'
        };
        
        return keyNames[key] || formatKeyName(key);
    }
    
    // Функция для форматирования значения здания
    function formatBuildingValue(value, key) {
        if (value === null || value === undefined) return '—';
        
        // Если это объект
        if (typeof value === 'object') {
            if (Array.isArray(value)) {
                return value.join(', ');
            }
            // Пытаемся отобразить как JSON
            try {
                return JSON.stringify(value).substring(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '');
            } catch (e) {
                return '[Объект]';
            }
        }
        
        // Для ресурсов и времени
        if (['wood', 'stone', 'iron', 'build_time'].includes(key)) {
            if (!isNaN(value)) {
                var num = parseFloat(value);
                return num.toLocaleString();
            }
        }
        
        return value;
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
    function formatValue(value, key, type) {
        if (value === null || value === undefined) return '—';
        
        // Если это объект
        if (typeof value === 'object') {
            return '[Категория с настройками]';
        }
        
        // Проверяем булевы значения
        if (value === '0' || value === '1') {
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
    
    // Функция для обновления статистики
    function updateStats() {
        var statsDiv = document.getElementById('statsInfo');
        if (!statsDiv) return;
        
        var worldSettings = worldConfig ? countSettings(worldConfig) : 0;
        var buildingSettings = buildingInfo ? countSettings(buildingInfo) : 0;
        
        statsDiv.innerHTML = `
            Конфигурация: ${worldSettings} настроек | 
            Здания: ${buildingSettings} параметров |
            Обновлено: ${new Date().toLocaleTimeString()}
        `;
    }
    
    // Функция для подсчета настроек
    function countSettings(obj) {
        var count = 0;
        
        function countRecursive(currentObj) {
            if (typeof currentObj !== 'object' || currentObj === null) {
                return 1;
            }
            
            Object.keys(currentObj).forEach(function(key) {
                var value = currentObj[key];
                if (typeof value === 'object' && value !== null) {
                    countRecursive(value);
                } else {
                    count++;
                }
            });
        }
        
        countRecursive(obj);
        return count;
    }
    
    // Глобальные функции для управления интерфейсом
    window.showTab = function(tabName) {
        // Обновляем кнопки вкладок
        document.getElementById('tabWorld').style.background = (tabName === 'world') ? '#8B4513' : '#e8e4d8';
        document.getElementById('tabWorld').style.color = (tabName === 'world') ? 'white' : '#8B4513';
        document.getElementById('tabBuildings').style.background = (tabName === 'buildings') ? '#8B4513' : '#e8e4d8';
        document.getElementById('tabBuildings').style.color = (tabName === 'buildings') ? 'white' : '#8B4513';
        
        // Показываем/скрываем контент
        document.getElementById('tabWorldContent').style.display = (tabName === 'world') ? 'block' : 'none';
        document.getElementById('tabBuildingsContent').style.display = (tabName === 'buildings') ? 'block' : 'none';
    };
    
    window.closeDataPopup = function() {
        document.getElementById('dataPopup')?.remove();
        document.getElementById('dataOverlay')?.remove();
    };
    
    // Запускаем загрузку данных
    loadAllData();
})();
