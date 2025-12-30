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
                console.log('Информация о зданиях загружена:', buildingInfo);
                displayAllData();
            },
            'error': function(xhr, status, error) {
                console.log('Не удалось загрузить информацию о зданиях:', error);
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
        displayBuildingInfoTable();
        
        // Обновляем статистику
        updateStats();
    }
    
    // Функция для отображения конфигурации мира
    function displayWorldConfig() {
        if (!worldConfig) {
            document.getElementById('tabWorldContent').innerHTML = 
                '<div style="text-align:center;padding:40px;color:#666;">Конфигурация мира не загружена</div>';
            return;
        }
        
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
    
    // Функция для отображения информации о зданиях в виде таблицы
    function displayBuildingInfoTable() {
        var contentDiv = document.getElementById('tabBuildingsContent');
        
        if (!buildingInfo) {
            contentDiv.innerHTML = 
                '<div style="text-align:center;padding:40px;color:#666;">Информация о зданиях не загружена</div>';
            return;
        }
        
        // Пытаемся найти объект со зданиями
        var buildingsData = buildingInfo.buildings || buildingInfo;
        
        // Получаем список всех зданий
        var buildings = [];
        var allParams = new Set(); // Для сбора всех уникальных параметров
        
        // Собираем здания и параметры
        Object.keys(buildingsData).forEach(function(buildingKey) {
            var building = buildingsData[buildingKey];
            
            if (typeof building === 'object' && building !== null) {
                // Проверяем, что это похоже на здание (есть max_level или wood/stone/iron)
                if (building.max_level !== undefined || building.wood !== undefined || 
                    building.stone !== undefined || building.iron !== undefined) {
                    
                    buildings.push({
                        name: buildingKey,
                        data: building
                    });
                    
                    // Собираем все параметры этого здания
                    Object.keys(building).forEach(function(param) {
                        allParams.add(param);
                    });
                }
            }
        });
        
        if (buildings.length === 0) {
            // Если не нашли структурированных данных, покажем как обычную таблицу
            contentDiv.innerHTML = createCategoryTable('Информация о зданиях', buildingsData, 'buildings');
            return;
        }
        
        // Преобразуем Set в массив и сортируем параметры
        var params = Array.from(allParams).sort();
        
        // Создаем HTML для таблицы
        var html = `
            <div style="margin-bottom:15px;color:#666;">
                Всего зданий: <strong>${buildings.length}</strong> | 
                Всего параметров: <strong>${params.length}</strong> |
                <button onclick="toggleBuildingDetails()" style="background:#5D8AA8;color:white;
                    border:none;padding:5px 10px;border-radius:3px;cursor:pointer;font-size:12px;margin-left:10px;">
                    Показать детали
                </button>
            </div>
            
            <div style="overflow-x:auto;margin-bottom:20px;">
                <table style="width:100%;border-collapse:collapse;background:white;border:1px solid #ddd;">
                    <thead>
                        <tr style="background:#5D8AA8;color:white;">
                            <th style="padding:12px;text-align:left;border-right:1px solid #4a7a9d;position:sticky;left:0;background:#5D8AA8;z-index:10;">
                                Здание
                            </th>
        `;
        
        // Добавляем заголовки для параметров
        params.forEach(function(param) {
            html += `<th style="padding:12px;text-align:center;border-right:1px solid #4a7a9d;min-width:80px;">
                ${formatBuildingParam(param)}
            </th>`;
        });
        
        html += `</tr></thead><tbody>`;
        
        // Добавляем строки для каждого здания
        buildings.forEach(function(building, index) {
            var rowClass = index % 2 === 0 ? 'background:#f9f9f9;' : 'background:white;';
            var buildingName = formatBuildingName(building.name);
            
            html += `<tr style="${rowClass}">`;
            
            // Ячейка с названием здания (закреплена)
            html += `<td style="padding:10px;border-right:1px solid #eee;border-bottom:1px solid #eee;
                position:sticky;left:0;${rowClass.replace(';', ' !important;')}z-index:5;">
                <div style="font-weight:bold;">${buildingName}</div>
                <div style="font-size:11px;color:#888;">${building.name}</div>
            </td>`;
            
            // Ячейки с параметрами
            params.forEach(function(param) {
                var value = building.data[param] || '—';
                var displayValue = formatBuildingParamValue(value, param);
                
                html += `<td style="padding:10px;text-align:center;border-right:1px solid #eee;border-bottom:1px solid #eee;
                    ${param.includes('factor') ? 'background:#f0f8ff;' : ''}">
                    ${displayValue}
                </td>`;
            });
            
            html += `</tr>`;
        });
        
        html += `</tbody></table></div>`;
        
        // Добавляем легенду/пояснения
        html += createBuildingInfoLegend(params);
        
        contentDiv.innerHTML = html;
    }
    
    // Функция для создания легенды/пояснений
    function createBuildingInfoLegend(params) {
        var legend = `
            <div style="background:#f0f7ff;border:1px solid #5D8AA8;border-radius:5px;padding:15px;margin-top:20px;">
                <div style="font-weight:bold;color:#5D8AA8;margin-bottom:10px;">Пояснения к параметрам:</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:10px;">
        `;
        
        var paramDescriptions = {
            'max_level': 'Максимальный уровень',
            'min_level': 'Минимальный уровень',
            'wood': 'Стоимость дерева (уровень 1)',
            'stone': 'Стоимость камня (уровень 1)',
            'iron': 'Стоимость железа (уровень 1)',
            'pop': 'Требуемое население (уровень 1)',
            'wood_factor': 'Множитель стоимости дерева',
            'stone_factor': 'Множитель стоимости камня',
            'iron_factor': 'Множитель стоимости железа',
            'pop_factor': 'Множитель требуемого населения',
            'build_time': 'Время строительства (уровень 1, в секундах)',
            'build_time_factor': 'Множитель времени строительства'
        };
        
        params.forEach(function(param) {
            var description = paramDescriptions[param] || param;
            legend += `<div style="font-size:12px;">
                <span style="font-weight:bold;color:#5D8AA8;">${formatBuildingParam(param)}:</span> ${description}
            </div>`;
        });
        
        legend += `</div></div>`;
        return legend;
    }
    
    // Функция для форматирования названия параметра здания
    function formatBuildingParam(param) {
        var paramNames = {
            'max_level': 'Макс. ур.',
            'min_level': 'Мин. ур.',
            'wood': 'Дерево',
            'stone': 'Камень',
            'iron': 'Железо',
            'pop': 'Население',
            'wood_factor': 'Дерево ×',
            'stone_factor': 'Камень ×',
            'iron_factor': 'Железо ×',
            'pop_factor': 'Население ×',
            'build_time': 'Время стр.',
            'build_time_factor': 'Время ×'
        };
        
        return paramNames[param] || param.replace('_', ' ').substring(0, 10);
    }
    
    // Функция для форматирования значения параметра здания
    function formatBuildingParamValue(value, param) {
        if (value === '—' || value === null || value === undefined) return '—';
        
        // Для множителей показываем с 2 знаками после запятой
        if (param.includes('_factor') && !isNaN(value)) {
            return parseFloat(value).toFixed(2);
        }
        
        // Для ресурсов и времени - форматируем числа
        if (!isNaN(value) && value !== '') {
            var num = parseFloat(value);
            
            // Для времени строительства переводим в минуты если больше 60 секунд
            if (param === 'build_time' && num >= 60) {
                var minutes = Math.floor(num / 60);
                var seconds = num % 60;
                return seconds > 0 ? `${minutes}м ${seconds}с` : `${minutes}м`;
            }
            
            // Для больших чисел добавляем разделители
            if (num >= 1000) {
                return num.toLocaleString();
            }
            
            return num.toString();
        }
        
        return value;
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
            'statue': 'Статуя',
            'church_f': 'Церковь (чуж.)',
            'watchtower_f': 'Башня (чуж.)'
        };
        
        return buildingNames[name] || name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    // Функция для создания таблицы категории (для world config)
    function createCategoryTable(categoryName, categoryData, type) {
        var keys = Object.keys(categoryData);
        
        if (keys.length === 0) return '';
        
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
        var buildingCount = buildingInfo ? countBuildings(buildingInfo) : 0;
        
        statsDiv.innerHTML = `
            Конфигурация: ${worldSettings} настроек | 
            Здания: ${buildingCount} шт. |
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
    
    // Функция для подсчета зданий
    function countBuildings(buildingInfo) {
        if (!buildingInfo) return 0;
        
        var buildingsData = buildingInfo.buildings || buildingInfo;
        var count = 0;
        
        Object.keys(buildingsData).forEach(function(key) {
            var building = buildingsData[key];
            if (typeof building === 'object' && building !== null) {
                if (building.max_level !== undefined || building.wood !== undefined || 
                    building.stone !== undefined || building.iron !== undefined) {
                    count++;
                }
            }
        });
        
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
    
    window.toggleBuildingDetails = function() {
        // Функция для переключения детального просмотра
        var table = document.querySelector('#tabBuildingsContent table');
        if (table) {
            var isDetailed = table.classList.contains('detailed');
            table.classList.toggle('detailed');
            
            // Пример: можно добавить переключение между кратким и детальным видом
            var button = document.querySelector('#tabBuildingsContent button');
            if (button) {
                button.textContent = isDetailed ? 'Показать детали' : 'Скрыть детали';
            }
        }
    };
    
    window.closeDataPopup = function() {
        document.getElementById('dataPopup')?.remove();
        document.getElementById('dataOverlay')?.remove();
    };
    
    // Запускаем загрузку данных
    loadAllData();
})();
