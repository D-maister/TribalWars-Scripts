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
    
    // Функция для преобразования XML в объект (для building_info)
    function parseBuildingInfoXml(xml) {
        var result = {};
        
        // Находим все элементы building
        $(xml).find('building').each(function() {
            var $building = $(this);
            var buildingName = $building.attr('name') || $building.find('name').text();
            
            if (!buildingName) return;
            
            var buildingData = {};
            
            // Парсим все параметры здания
            $building.children().each(function() {
                var $child = $(this);
                var tagName = $child.prop("tagName");
                
                if (tagName !== 'name') {
                    buildingData[tagName] = $child.text();
                }
            });
            
            result[buildingName] = buildingData;
        });
        
        // Если не нашли здания в структуре building, ищем в корне
        if (Object.keys(result).length === 0) {
            $(xml).children().each(function() {
                var $el = $(this);
                var tagName = $el.prop("tagName");
                
                // Проверяем, похоже ли это на данные здания
                if ($el.children().length > 0) {
                    var buildingData = {};
                    $el.children().each(function() {
                        var $child = $(this);
                        buildingData[$child.prop("tagName")] = $child.text();
                    });
                    
                    if (Object.keys(buildingData).length > 0) {
                        result[tagName] = buildingData;
                    }
                }
            });
        }
        
        return result;
    }
    
    // Функция для преобразования XML в объект (для config)
    function parseConfigXml(xml) {
        var obj = {};
        
        $(xml).children().each(function() {
            var $el = $(this);
            var tagName = $el.prop("tagName");
            
            if ($el.children().length > 0 && $el.children()[0].nodeType === 1) {
                // Вложенная категория
                obj[tagName] = parseConfigXml($el);
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
                worldConfig = parseConfigXml(xml);
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
                buildingInfo = parseBuildingInfoXml(xml);
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
                        Здания
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
        contentDiv.innerHTML = createConfigTable(worldConfig, 'Конфигурация мира');
    }
    
    // Функция для создания таблицы конфигурации
    function createConfigTable(config, title) {
        var html = `
            <div style="margin-bottom:25px;background:white;border:1px solid #ddd;border-radius:5px;overflow:hidden;">
                <div style="background:#8B4513;color:white;padding:12px 15px;font-weight:bold;">
                    ${title}
                </div>
                <div style="padding:15px;">
        `;
        
        // Создаем вложенные категории
        Object.keys(config).forEach(function(category) {
            var data = config[category];
            
            if (typeof data === 'object' && data !== null) {
                html += `<div style="margin-bottom:20px;">
                    <div style="font-weight:bold;color:#8B4513;padding-bottom:5px;border-bottom:1px solid #eee;margin-bottom:10px;">
                        ${formatCategoryName(category)}
                    </div>
                    <div style="padding-left:10px;">
                `;
                
                Object.keys(data).forEach(function(key) {
                    var value = data[key];
                    
                    if (typeof value === 'object' && value !== null) {
                        // Еще один уровень вложенности
                        html += `<div style="margin-bottom:15px;padding-left:10px;">
                            <div style="font-weight:bold;color:#666;margin-bottom:5px;">${formatKeyName(key)}</div>
                        `;
                        
                        Object.keys(value).forEach(function(subKey) {
                            html += `<div style="margin-bottom:3px;display:flex;">
                                <div style="width:60%;font-weight:bold;padding-right:10px;">${formatKeyName(subKey)}</div>
                                <div style="width:40%;">${formatConfigValue(value[subKey], subKey)}</div>
                            </div>`;
                        });
                        
                        html += `</div>`;
                    } else {
                        html += `<div style="margin-bottom:8px;display:flex;">
                            <div style="width:60%;font-weight:bold;padding-right:10px;">${formatKeyName(key)}</div>
                            <div style="width:40%;">${formatConfigValue(value, key)}</div>
                        </div>`;
                    }
                });
                
                html += `</div></div>`;
            } else {
                // Простые настройки вверху
                html = `<div style="margin-bottom:15px;display:flex;">
                    <div style="width:60%;font-weight:bold;padding-right:10px;">${formatKeyName(category)}</div>
                    <div style="width:40%;">${formatConfigValue(data, category)}</div>
                </div>` + html;
            }
        });
        
        html += `</div></div>`;
        return html;
    }
    
    // Функция для отображения информации о зданиях в виде таблицы
    function displayBuildingInfoTable() {
        var contentDiv = document.getElementById('tabBuildingsContent');
        
        if (!buildingInfo || Object.keys(buildingInfo).length === 0) {
            contentDiv.innerHTML = 
                '<div style="text-align:center;padding:40px;color:#666;">Информация о зданиях не загружена</div>';
            return;
        }
        
        // Создаем таблицу: строки - параметры, столбцы - здания
        var buildings = Object.keys(buildingInfo);
        var allParams = new Set();
        
        // Собираем все уникальные параметры
        buildings.forEach(function(buildingName) {
            var buildingData = buildingInfo[buildingName];
            if (buildingData) {
                Object.keys(buildingData).forEach(function(param) {
                    allParams.add(param);
                });
            }
        });
        
        // Преобразуем в массив и сортируем
        var params = Array.from(allParams).sort();
        
        // Группируем параметры по типам для лучшей организации
        var paramGroups = {
            'Основные': ['max_level', 'min_level'],
            'Ресурсы (уровень 1)': ['wood', 'stone', 'iron', 'pop'],
            'Множители': params.filter(p => p.includes('_factor')),
            'Время': params.filter(p => p.includes('time')),
            'Прочие': params.filter(p => !['max_level', 'min_level', 'wood', 'stone', 'iron', 'pop'].includes(p) && 
                                         !p.includes('_factor') && !p.includes('time'))
        };
        
        var html = `
            <div style="margin-bottom:15px;color:#666;">
                Всего зданий: <strong>${buildings.length}</strong> | 
                Всего параметров: <strong>${params.length}</strong>
            </div>
            
            <div style="overflow-x:auto;margin-bottom:20px;">
                <table style="width:100%;border-collapse:collapse;background:white;border:1px solid #ddd;">
                    <thead>
                        <tr style="background:#5D8AA8;color:white;">
                            <th style="padding:12px;text-align:left;border-right:1px solid #4a7a9d;position:sticky;left:0;background:#5D8AA8;z-index:10;">
                                Параметр
                            </th>
        `;
        
        // Добавляем заголовки для зданий
        buildings.forEach(function(buildingName) {
            html += `<th style="padding:12px;text-align:center;border-right:1px solid #4a7a9d;min-width:100px;">
                <div style="font-weight:bold;">${formatBuildingName(buildingName)}</div>
                <div style="font-size:11px;opacity:0.9;">${buildingName}</div>
            </th>`;
        });
        
        html += `</tr></thead><tbody>`;
        
        // Добавляем строки для каждой группы параметров
        Object.keys(paramGroups).forEach(function(groupName) {
            var groupParams = paramGroups[groupName];
            
            if (groupParams.length === 0) return;
            
            // Заголовок группы
            html += `<tr style="background:#e8f4ff;">
                <td colspan="${buildings.length + 1}" style="padding:8px 12px;font-weight:bold;color:#5D8AA8;">
                    ${groupName}
                </td>
            </tr>`;
            
            // Параметры в группе
            groupParams.forEach(function(param, paramIndex) {
                var rowClass = paramIndex % 2 === 0 ? 'background:#f9f9f9;' : 'background:white;';
                
                html += `<tr style="${rowClass}">`;
                
                // Ячейка с названием параметра (закреплена)
                html += `<td style="padding:10px;border-right:1px solid #eee;border-bottom:1px solid #eee;
                    position:sticky;left:0;${rowClass.replace(';', ' !important;')}z-index:5;">
                    <div style="font-weight:bold;">${formatBuildingParam(param)}</div>
                    <div style="font-size:11px;color:#888;">${param}</div>
                </td>`;
                
                // Значения для каждого здания
                buildings.forEach(function(buildingName) {
                    var buildingData = buildingInfo[buildingName];
                    var value = buildingData ? buildingData[param] : '—';
                    var displayValue = formatBuildingValue(value, param);
                    
                    // Специальное оформление для некоторых значений
                    var cellStyle = '';
                    if (param.includes('_factor')) {
                        cellStyle = 'background:#f0f8ff;';
                    } else if (['wood', 'stone', 'iron', 'pop'].includes(param)) {
                        cellStyle = 'background:#fff8f0;';
                    } else if (param.includes('time')) {
                        cellStyle = 'background:#f0fff8;';
                    }
                    
                    html += `<td style="padding:10px;text-align:center;border-right:1px solid #eee;border-bottom:1px solid #eee;${cellStyle}">
                        ${displayValue}
                    </td>`;
                });
                
                html += `</tr>`;
            });
        });
        
        html += `</tbody></table></div>`;
        
        // Добавляем легенду
        html += createBuildingLegend();
        
        contentDiv.innerHTML = html;
    }
    
    // Функция для создания легенды
    function createBuildingLegend() {
        return `
            <div style="background:#f0f7ff;border:1px solid #5D8AA8;border-radius:5px;padding:15px;margin-top:20px;">
                <div style="font-weight:bold;color:#5D8AA8;margin-bottom:10px;">Обозначения:</div>
                <div style="display:flex;flex-wrap:wrap;gap:15px;font-size:12px;">
                    <div style="display:flex;align-items:center;">
                        <div style="width:20px;height:20px;background:#f0f8ff;border:1px solid #5D8AA8;margin-right:5px;"></div>
                        <span>Множители</span>
                    </div>
                    <div style="display:flex;align-items:center;">
                        <div style="width:20px;height:20px;background:#fff8f0;border:1px solid #8B4513;margin-right:5px;"></div>
                        <span>Ресурсы</span>
                    </div>
                    <div style="display:flex;align-items:center;">
                        <div style="width:20px;height:20px;background:#f0fff8;border:1px solid #2E8B57;margin-right:5px;"></div>
                        <span>Время</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Функция для форматирования названия параметра здания
    function formatBuildingParam(param) {
        var paramNames = {
            'max_level': 'Макс. уровень',
            'min_level': 'Мин. уровень',
            'wood': 'Дерево',
            'stone': 'Камень',
            'iron': 'Железо',
            'pop': 'Население',
            'wood_factor': 'Дерево ×',
            'stone_factor': 'Камень ×',
            'iron_factor': 'Железо ×',
            'pop_factor': 'Население ×',
            'build_time': 'Время стр-ва',
            'build_time_factor': 'Время ×',
            'attack': 'Атака',
            'defense': 'Защита',
            'defense_cavalry': 'Защ. от кав.',
            'defense_archer': 'Защ. от луч.',
            'capacity': 'Вместимость',
            'merchants': 'Купцы'
        };
        
        return paramNames[param] || param.replace(/_/g, ' ');
    }
    
    // Функция для форматирования значения здания
    function formatBuildingValue(value, param) {
        if (value === null || value === undefined || value === '') return '—';
        
        // Для множителей показываем с 2 знаками после запятой
        if (param.includes('_factor') && !isNaN(value)) {
            return parseFloat(value).toFixed(2);
        }
        
        // Для времени строительства
        if (param === 'build_time' && !isNaN(value)) {
            var seconds = parseInt(value);
            if (seconds >= 60) {
                var minutes = Math.floor(seconds / 60);
                var remainingSeconds = seconds % 60;
                return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
            }
            return `${seconds}s`;
        }
        
        // Для числовых значений
        if (!isNaN(value)) {
            var num = parseFloat(value);
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
            'main': 'Главное',
            'barracks': 'Казармы',
            'stable': 'Конюшня',
            'garage': 'Гараж',
            'smith': 'Кузница',
            'place': 'Площадь',
            'market': 'Рынок',
            'wood': 'Лесопилка',
            'stone': 'Каменоломня',
            'iron': 'Рудник',
            'farm': 'Ферма',
            'storage': 'Склад',
            'hide': 'Укрытие',
            'wall': 'Стена',
            'watchtower': 'Башня',
            'snob': 'Дворец',
            'church': 'Церковь',
            'statue': 'Статуя'
        };
        
        return buildingNames[name] || name.charAt(0).toUpperCase() + name.slice(1);
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
    
    // Функция для форматирования значения конфигурации
    function formatConfigValue(value, key) {
        if (value === null || value === undefined) return '—';
        
        // Проверяем булевы значения
        if (value === '0' || value === '1') {
            var booleanKeys = ['knight', 'archer', 'church', 'watchtower', 'stronghold', 
                              'scavenging', 'hauls', 'event', 'relics', 'tutorial', 'destroy',
                              'available', 'moral', 'allow', 'active', 'give_prizes'];
            
            if (booleanKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
                return value === '1' ? '✓ Да' : '✗ Нет';
            }
        }
        
        // Форматируем числовые значения
        if (!isNaN(value) && value !== '') {
            var num = parseFloat(value);
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
        
        var worldCount = worldConfig ? countConfigItems(worldConfig) : 0;
        var buildingCount = buildingInfo ? Object.keys(buildingInfo).length : 0;
        
        statsDiv.innerHTML = `
            Конфигурация: ${worldCount} параметров | 
            Здания: ${buildingCount} шт. |
            Обновлено: ${new Date().toLocaleTimeString()}
        `;
    }
    
    // Функция для подсчета элементов конфигурации
    function countConfigItems(obj) {
        var count = 0;
        
        function countRecursive(currentObj) {
            if (typeof currentObj !== 'object' || currentObj === null) return;
            
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
