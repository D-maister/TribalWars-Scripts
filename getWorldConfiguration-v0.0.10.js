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
    
    // Функция для парсинга XML информации о зданиях
    function parseBuildingInfoXml(xml) {
        console.log('Parsing building info XML...');
        
        // Пытаемся найти структуру зданий
        var buildings = {};
        var buildingElements = $(xml).find('building');
        
        if (buildingElements.length > 0) {
            // Структура с тегами <building>
            buildingElements.each(function() {
                var $building = $(this);
                var buildingName = $building.attr('name');
                
                if (!buildingName) {
                    // Пытаемся найти имя внутри тега
                    buildingName = $building.find('name').text();
                }
                
                if (buildingName) {
                    var buildingData = {};
                    
                    // Парсим все параметры здания
                    $building.children().each(function() {
                        if ($(this).prop("tagName") !== 'name') {
                            buildingData[$(this).prop("tagName")] = $(this).text();
                        }
                    });
                    
                    buildings[buildingName] = buildingData;
                }
            });
        } else {
            // Альтернативная структура - ищем все элементы на верхнем уровне
            $(xml).children().each(function() {
                var $el = $(this);
                var tagName = $el.prop("tagName");
                
                // Пропускаем очевидные не-здания
                if (tagName === 'config' || tagName === 'info' || tagName === 'data') {
                    return;
                }
                
                // Проверяем, похоже ли это на данные здания
                var children = $el.children();
                if (children.length > 3) { // Здание должно иметь несколько параметров
                    var hasBuildingParams = false;
                    var buildingData = {};
                    
                    children.each(function() {
                        var $child = $(this);
                        var childName = $child.prop("tagName");
                        buildingData[childName] = $child.text();
                        
                        // Проверяем наличие типичных параметров здания
                        if (['max_level', 'wood', 'stone', 'iron', 'build_time'].includes(childName)) {
                            hasBuildingParams = true;
                        }
                    });
                    
                    if (hasBuildingParams) {
                        buildings[tagName] = buildingData;
                    }
                }
            });
        }
        
        console.log('Found buildings:', Object.keys(buildings));
        return buildings;
    }
    
    // Альтернативный парсер для странной структуры
    function parseAlternativeBuildingStructure(xml) {
        var text = $(xml).text();
        console.log('Raw XML text:', text.substring(0, 500));
        
        // Пытаемся найти паттерны данных зданий
        var buildings = {};
        var lines = text.split('\n');
        
        var currentBuilding = null;
        var currentData = {};
        
        lines.forEach(function(line) {
            line = line.trim();
            
            // Ищем начало данных здания (например, "barracks:")
            if (line.match(/^[a-z_]+:$/)) {
                if (currentBuilding && Object.keys(currentData).length > 0) {
                    buildings[currentBuilding] = currentData;
                }
                currentBuilding = line.replace(':', '');
                currentData = {};
            }
            // Ищем параметры (например, "wood: 200")
            else if (line.match(/^[a-z_]+:\s*\d+/)) {
                var parts = line.split(':');
                if (parts.length === 2) {
                    var key = parts[0].trim();
                    var value = parts[1].trim();
                    currentData[key] = value;
                }
            }
        });
        
        // Добавляем последнее здание
        if (currentBuilding && Object.keys(currentData).length > 0) {
            buildings[currentBuilding] = currentData;
        }
        
        return buildings;
    }
    
    // Парсер для конфигурации
    function parseConfigXml(xml) {
        var obj = {};
        
        $(xml).children().each(function() {
            var $el = $(this);
            var tagName = $el.prop("tagName");
            
            if ($el.children().length > 0 && $el.children()[0].nodeType === 1) {
                obj[tagName] = parseConfigXml($el);
            } else {
                obj[tagName] = $el.text();
            }
        });
        
        return obj;
    }
    
    // Глобальные переменные
    var worldConfig = null;
    var buildingInfo = null;
    var serverName = null;
    
    // Основная функция
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
                console.log('World config loaded');
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
                console.log('Building info XML received');
                
                // Пробуем разные методы парсинга
                buildingInfo = parseBuildingInfoXml(xml);
                
                if (Object.keys(buildingInfo).length === 0) {
                    buildingInfo = parseAlternativeBuildingStructure(xml);
                }
                
                console.log('Building info parsed:', buildingInfo);
                displayAllData();
            },
            'error': function(xhr, status, error) {
                console.log('Failed to load building info:', error);
                buildingInfo = null;
                displayAllData();
            }
        });
    }
    
    // Функция отображения
    function displayAllData() {
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
                
                <div style="margin-bottom:20px;border-bottom:1px solid #ddd;">
                    <button id="tabWorld" onclick="showTab('world')" style="background:#8B4513;color:white;
                        border:none;padding:10px 20px;border-radius:4px 4px 0 0;cursor:pointer;margin-right:5px;">
                        Конфигурация
                    </button>
                    <button id="tabBuildings" onclick="showTab('buildings')" style="background:#e8e4d8;color:#8B4513;
                        border:1px solid #8B4513;border-bottom:none;padding:10px 20px;border-radius:4px 4px 0 0;
                        cursor:pointer;">
                        Здания
                    </button>
                </div>
                
                <div id="tabWorldContent" style="display:block;"></div>
                <div id="tabBuildingsContent" style="display:none;"></div>
                
                <div id="statsInfo" style="margin-top:20px;padding-top:15px;border-top:1px solid #ddd;color:#666;">
                    Обновлено: ${new Date().toLocaleTimeString()}
                </div>
            </div>
            <div id="dataOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;
                background:rgba(0,0,0,0.7);z-index:9999;" onclick="closeDataPopup()"></div>
        `;
        
        closeDataPopup();
        document.body.insertAdjacentHTML('beforeend', html);
        
        displayWorldConfig();
        displayBuildingInfo();
        updateStats();
    }
    
    // Отображение конфигурации мира
    function displayWorldConfig() {
        if (!worldConfig) {
            document.getElementById('tabWorldContent').innerHTML = 
                '<div style="text-align:center;padding:40px;color:#666;">Конфигурация не загружена</div>';
            return;
        }
        
        var html = `
            <div style="background:white;border:1px solid #ddd;border-radius:5px;overflow:hidden;margin-bottom:20px;">
                <div style="background:#8B4513;color:white;padding:12px 15px;font-weight:bold;">
                    Основные параметры
                </div>
                <div style="padding:15px;">
                    <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));gap:15px;">
        `;
        
        // Основные настройки
        var mainSettings = {
            'Скорость игры': worldConfig.speed || '—',
            'Скорость юнитов': worldConfig.unit_speed || '—',
            'Мировая скорость': worldConfig.speed && worldConfig.unit_speed ? 
                (parseFloat(worldConfig.speed) * parseFloat(worldConfig.unit_speed)).toFixed(2) : '—',
            'Мораль': worldConfig.moral === '1' ? 'Включена' : 'Выключена',
            'Луки': worldConfig.game?.archer === '1' ? '✓ Доступны' : '✗ Не доступны',
            'Рыцари': worldConfig.game?.knight === '1' ? '✓ Доступны' : '✗ Не доступны',
            'Церковь': worldConfig.game?.church === '1' ? '✓ Есть' : '✗ Нет'
        };
        
        Object.keys(mainSettings).forEach(function(key) {
            html += `
                <div style="padding:10px;background:#f9f9f9;border-radius:4px;">
                    <div style="font-weight:bold;color:#8B4513;margin-bottom:5px;">${key}</div>
                    <div style="font-size:18px;font-weight:bold;">${mainSettings[key]}</div>
                </div>
            `;
        });
        
        html += `</div></div></div>`;
        
        // Детальная конфигурация
        html += createConfigDetails(worldConfig);
        
        document.getElementById('tabWorldContent').innerHTML = html;
    }
    
    // Создание детальной конфигурации
    function createConfigDetails(config) {
        var html = '';
        var categories = ['game', 'buildings', 'snob', 'ally', 'coord', 'sitter', 'sleep', 'night'];
        
        categories.forEach(function(category) {
            if (config[category]) {
                html += `
                    <div style="background:white;border:1px solid #ddd;border-radius:5px;overflow:hidden;margin-bottom:15px;">
                        <div style="background:#e8e4d8;color:#8B4513;padding:10px 15px;font-weight:bold;">
                            ${formatCategoryName(category)}
                        </div>
                        <div style="padding:10px;">
                `;
                
                Object.keys(config[category]).forEach(function(key) {
                    var value = config[category][key];
                    html += `
                        <div style="display:flex;padding:5px 0;border-bottom:1px solid #f0f0f0;">
                            <div style="width:60%;font-weight:bold;">${formatKeyName(key)}</div>
                            <div style="width:40%;">${formatConfigValue(value, key)}</div>
                        </div>
                    `;
                });
                
                html += `</div></div>`;
            }
        });
        
        return html;
    }
    
    // Отображение информации о зданиях
    function displayBuildingInfo() {
        var contentDiv = document.getElementById('tabBuildingsContent');
        
        if (!buildingInfo || Object.keys(buildingInfo).length === 0) {
            contentDiv.innerHTML = `
                <div style="text-align:center;padding:40px;color:#666;">
                    <div style="margin-bottom:20px;">Информация о зданиях не загружена</div>
                    <button onclick="retryLoadBuildings()" style="background:#5D8AA8;color:white;
                        border:none;padding:10px 20px;border-radius:4px;cursor:pointer;">
                        Попробовать снова
                    </button>
                </div>
            `;
            return;
        }
        
        // Проверяем структуру данных
        console.log('Building info structure for display:', buildingInfo);
        
        // Если данные пришли в странном формате, покажем их как есть
        if (buildingInfo.config || buildingInfo.wood || buildingInfo.stone || buildingInfo.iron) {
            contentDiv.innerHTML = createSimpleBuildingDisplay(buildingInfo);
        } else {
            contentDiv.innerHTML = createBuildingTable(buildingInfo);
        }
    }
    
    // Создание таблицы зданий
    function createBuildingTable(buildings) {
        var buildingNames = Object.keys(buildings);
        var allParams = new Set();
        
        // Собираем все параметры
        buildingNames.forEach(function(name) {
            var data = buildings[name];
            if (data && typeof data === 'object') {
                Object.keys(data).forEach(function(param) {
                    allParams.add(param);
                });
            }
        });
        
        var params = Array.from(allParams).sort();
        
        var html = `
            <div style="margin-bottom:15px;color:#666;">
                Зданий: <strong>${buildingNames.length}</strong> | 
                Параметров: <strong>${params.length}</strong>
            </div>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;background:white;border:1px solid #ddd;">
                    <thead>
                        <tr style="background:#5D8AA8;color:white;">
                            <th style="padding:12px;text-align:left;border-right:1px solid #4a7a9d;position:sticky;left:0;background:#5D8AA8;z-index:10;">
                                Параметр
                            </th>
        `;
        
        // Заголовки зданий
        buildingNames.forEach(function(name) {
            html += `<th style="padding:12px;text-align:center;border-right:1px solid #4a7a9d;min-width:120px;">
                <div style="font-weight:bold;">${formatBuildingName(name)}</div>
                <div style="font-size:11px;opacity:0.9;">${name}</div>
            </th>`;
        });
        
        html += `</tr></thead><tbody>`;
        
        // Параметры
        params.forEach(function(param, index) {
            var rowClass = index % 2 === 0 ? 'background:#f9f9f9;' : 'background:white;';
            
            html += `<tr style="${rowClass}">`;
            html += `<td style="padding:10px;border-right:1px solid #eee;border-bottom:1px solid #eee;
                position:sticky;left:0;${rowClass.replace(';', ' !important;')}z-index:5;">
                <div style="font-weight:bold;">${formatBuildingParam(param)}</div>
                <div style="font-size:11px;color:#888;">${param}</div>
            </td>`;
            
            // Значения для каждого здания
            buildingNames.forEach(function(name) {
                var data = buildings[name];
                var value = data && data[param] ? data[param] : '—';
                
                // Очищаем значение от лишних пробелов и переносов строк
                value = value.toString().replace(/\s+/g, ' ').trim();
                
                html += `<td style="padding:10px;text-align:center;border-right:1px solid #eee;border-bottom:1px solid #eee;
                    ${isFactorParam(param) ? 'background:#f0f8ff;' : ''}">
                    ${formatBuildingValue(value, param)}
                </td>`;
            });
            
            html += `</tr>`;
        });
        
        html += `</tbody></table></div>`;
        
        return html;
    }
    
    // Простое отображение для странных данных
    function createSimpleBuildingDisplay(data) {
        var html = `
            <div style="color:#666;margin-bottom:20px;">
                Данные получены в нестандартном формате. Показываем как есть:
            </div>
            <div style="background:white;border:1px solid #ddd;border-radius:5px;padding:20px;font-family:monospace;font-size:12px;">
        `;
        
        Object.keys(data).forEach(function(key) {
            var value = data[key];
            html += `<div style="margin-bottom:10px;">
                <div style="font-weight:bold;color:#8B4513;">${key}:</div>
                <div>${JSON.stringify(value, null, 2)}</div>
            </div>`;
        });
        
        html += `</div>`;
        return html;
    }
    
    // Вспомогательные функции
    function formatCategoryName(name) {
        var names = {
            'game': 'Игровые настройки',
            'buildings': 'Здания',
            'snob': 'Дворяне',
            'ally': 'Племена',
            'coord': 'Карта',
            'sitter': 'Ситерство',
            'sleep': 'Сон',
            'night': 'Ночь'
        };
        return names[name] || name;
    }
    
    function formatKeyName(key) {
        return key.replace(/_/g, ' ').replace(/^./, function(s) { return s.toUpperCase(); });
    }
    
    function formatConfigValue(value, key) {
        if (value === '0' || value === '1') {
            return value === '1' ? '✓ Да' : '✗ Нет';
        }
        return value || '—';
    }
    
    function formatBuildingName(name) {
        var names = {
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
        return names[name] || name;
    }
    
    function formatBuildingParam(param) {
        var params = {
            'max_level': 'Макс. уровень',
            'min_level': 'Мин. уровень',
            'wood': 'Дерево',
            'stone': 'Камень',
            'iron': 'Железо',
            'pop': 'Население',
            'wood_factor': '× Дерево',
            'stone_factor': '× Камень',
            'iron_factor': '× Железо',
            'pop_factor': '× Население',
            'build_time': 'Время стр-ва',
            'build_time_factor': '× Время'
        };
        return params[param] || param;
    }
    
    function isFactorParam(param) {
        return param.includes('_factor');
    }
    
    function formatBuildingValue(value, param) {
        if (value === '—') return value;
        
        // Очищаем от лишних пробелов
        value = value.toString().trim();
        
        // Для множителей
        if (isFactorParam(param)) {
            var num = parseFloat(value);
            return !isNaN(num) ? num.toFixed(2) : value;
        }
        
        // Для времени
        if (param === 'build_time') {
            var seconds = parseInt(value);
            if (!isNaN(seconds) && seconds >= 60) {
                var minutes = Math.floor(seconds / 60);
                var remaining = seconds % 60;
                return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
            }
        }
        
        // Для чисел
        if (!isNaN(value)) {
            var num = parseFloat(value);
            if (num >= 1000) {
                return num.toLocaleString();
            }
            return num.toString();
        }
        
        return value;
    }
    
    function updateStats() {
        var statsDiv = document.getElementById('statsInfo');
        if (!statsDiv) return;
        
        var buildingCount = buildingInfo ? Object.keys(buildingInfo).length : 0;
        
        statsDiv.innerHTML = `
            Здания: ${buildingCount} шт. | 
            Обновлено: ${new Date().toLocaleTimeString()}
        `;
    }
    
    // Глобальные функции
    window.showTab = function(tabName) {
        var worldBtn = document.getElementById('tabWorld');
        var buildBtn = document.getElementById('tabBuildings');
        var worldContent = document.getElementById('tabWorldContent');
        var buildContent = document.getElementById('tabBuildingsContent');
        
        if (worldBtn && buildBtn && worldContent && buildContent) {
            worldBtn.style.background = (tabName === 'world') ? '#8B4513' : '#e8e4d8';
            worldBtn.style.color = (tabName === 'world') ? 'white' : '#8B4513';
            buildBtn.style.background = (tabName === 'buildings') ? '#8B4513' : '#e8e4d8';
            buildBtn.style.color = (tabName === 'buildings') ? 'white' : '#8B4513';
            
            worldContent.style.display = (tabName === 'world') ? 'block' : 'none';
            buildContent.style.display = (tabName === 'buildings') ? 'block' : 'none';
        }
    };
    
    window.closeDataPopup = function() {
        document.getElementById('dataPopup')?.remove();
        document.getElementById('dataOverlay')?.remove();
    };
    
    window.retryLoadBuildings = function() {
        document.getElementById('tabBuildingsContent').innerHTML = 
            '<div style="text-align:center;padding:20px;color:#666;">Загрузка...</div>';
        loadBuildingInfo();
    };
    
    // Запуск
    loadAllData();
})();
