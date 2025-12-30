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
    
    // Простой парсер XML в объект
    function parseXmlSimple(xml) {
        var result = {};
        
        function parseNode(node, parentObj) {
            var children = node.children;
            
            if (children.length === 0) {
                // Текстовый узел
                parentObj[node.tagName] = node.textContent.trim();
            } else {
                // Элемент с детьми
                var childObj = {};
                for (var i = 0; i < children.length; i++) {
                    parseNode(children[i], childObj);
                }
                parentObj[node.tagName] = childObj;
            }
        }
        
        parseNode(xml.documentElement, result);
        return result;
    }
    
    // Основные переменные
    var worldConfig = null;
    var buildingInfo = null;
    var serverName = getServerNameFromUrl();
    
    // Загружаем все данные
    function loadAllData() {
        // Загружаем конфигурацию мира
        $.ajax({
            async: false,
            url: '/interface.php?func=get_config',
            dataType: 'xml',
            success: function(xml) {
                worldConfig = parseXmlSimple(xml);
                console.log('World config loaded');
            },
            error: function() {
                console.log('Failed to load world config');
            }
        });
        
        // Загружаем информацию о зданиях
        $.ajax({
            async: false,
            url: '/interface.php?func=get_building_info',
            dataType: 'xml',
            success: function(xml) {
                buildingInfo = parseXmlSimple(xml);
                console.log('Building info loaded');
            },
            error: function() {
                console.log('Failed to load building info');
            }
        });
        
        // Показываем интерфейс
        showInterface();
    }
    
    // Показываем интерфейс
    function showInterface() {
        var html = `
            <div id="twInfoPopup" style="position:fixed;top:20px;left:20px;right:20px;bottom:20px;
                background:#f5f5e1;border:3px solid #8B4513;border-radius:5px;padding:15px;
                overflow:hidden;z-index:10000;box-shadow:0 0 30px rgba(0,0,0,0.7);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h3 style="margin:0;color:#8B4513;">Tribal Wars Info - ${serverName}</h3>
                    <button onclick="document.getElementById('twInfoPopup').remove();
                                     document.getElementById('twInfoOverlay').remove();"
                            style="background:#8B4513;color:white;border:none;padding:5px 10px;border-radius:3px;cursor:pointer;">
                        Закрыть
                    </button>
                </div>
                
                <div style="display:flex;height:calc(100% - 60px);">
                    <!-- Левая панель - конфигурация мира -->
                    <div style="width:50%;overflow-y:auto;padding-right:10px;border-right:1px solid #ddd;">
                        <h4 style="color:#8B4513;margin-top:0;">Конфигурация мира</h4>
                        <div id="worldConfigContent" style="font-size:12px;"></div>
                    </div>
                    
                    <!-- Правая панель - информация о зданиях -->
                    <div style="width:50%;overflow-y:auto;padding-left:10px;">
                        <h4 style="color:#5D8AA8;margin-top:0;">Информация о зданиях</h4>
                        <div id="buildingInfoContent" style="font-size:12px;"></div>
                    </div>
                </div>
            </div>
            <div id="twInfoOverlay" style="position:fixed;top:0;left:0;right:0;bottom:0;
                background:rgba(0,0,0,0.5);z-index:9999;"></div>
        `;
        
        // Удаляем старые элементы
        document.getElementById('twInfoPopup')?.remove();
        document.getElementById('twInfoOverlay')?.remove();
        
        // Добавляем новые
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Заполняем контент
        displayWorldConfig();
        displayBuildingInfo();
    }
    
    // Отображаем конфигурацию мира
    function displayWorldConfig() {
        var contentDiv = document.getElementById('worldConfigContent');
        
        if (!worldConfig || !worldConfig.config) {
            contentDiv.innerHTML = '<div style="color:#666;padding:20px;text-align:center;">Не загружено</div>';
            return;
        }
        
        var html = '<div style="font-family:monospace;">';
        html += formatObject(worldConfig.config, 0);
        html += '</div>';
        
        contentDiv.innerHTML = html;
    }
    
    // Отображаем информацию о зданиях
    function displayBuildingInfo() {
        var contentDiv = document.getElementById('buildingInfoContent');
        
        if (!buildingInfo) {
            contentDiv.innerHTML = '<div style="color:#666;padding:20px;text-align:center;">Не загружено</div>';
            return;
        }
        
        // Пробуем найти данные о зданиях
        var buildingsData = null;
        
        // Ищем в разных возможных местах
        if (buildingInfo.buildings) {
            buildingsData = buildingInfo.buildings;
        } else if (buildingInfo.config && buildingInfo.config.buildings) {
            buildingsData = buildingInfo.config.buildings;
        } else {
            // Пытаемся найти любые данные, похожие на здания
            for (var key in buildingInfo) {
                if (buildingInfo[key] && typeof buildingInfo[key] === 'object') {
                    // Проверяем, есть ли параметры здания
                    var sample = buildingInfo[key];
                    if (sample.max_level !== undefined || sample.wood !== undefined || 
                        sample.stone !== undefined || sample.iron !== undefined) {
                        buildingsData = buildingInfo;
                        break;
                    }
                }
            }
        }
        
        if (!buildingsData) {
            // Показываем все как есть
            contentDiv.innerHTML = '<div style="font-family:monospace;">' + 
                                  formatObject(buildingInfo, 0) + '</div>';
            return;
        }
        
        // Создаем таблицу зданий
        var html = createBuildingsTable(buildingsData);
        contentDiv.innerHTML = html;
    }
    
    // Создаем таблицу зданий
    function createBuildingsTable(buildingsData) {
        var buildings = [];
        var allParams = new Set();
        
        // Собираем все здания и параметры
        for (var buildingName in buildingsData) {
            var data = buildingsData[buildingName];
            
            if (data && typeof data === 'object') {
                // Проверяем, что это похоже на здание
                if (data.max_level !== undefined || data.wood !== undefined || 
                    data.stone !== undefined || data.iron !== undefined) {
                    
                    buildings.push({
                        name: buildingName,
                        data: data
                    });
                    
                    // Собираем параметры
                    for (var param in data) {
                        allParams.add(param);
                    }
                }
            }
        }
        
        if (buildings.length === 0) {
            return '<div style="color:#666;padding:20px;text-align:center;">Нет данных о зданиях</div>';
        }
        
        // Создаем таблицу
        var params = Array.from(allParams).sort();
        var html = `
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:11px;">
                    <thead>
                        <tr style="background:#5D8AA8;color:white;">
                            <th style="padding:8px;text-align:left;border:1px solid #4a7a9d;">Здание</th>
        `;
        
        // Заголовки параметров
        params.forEach(function(param) {
            var displayName = param;
            if (param === 'max_level') displayName = 'Макс';
            if (param === 'min_level') displayName = 'Мин';
            if (param === 'wood') displayName = 'Дер';
            if (param === 'stone') displayName = 'Кам';
            if (param === 'iron') displayName = 'Жел';
            if (param === 'pop') displayName = 'Нар';
            if (param === 'build_time') displayName = 'Время';
            
            html += `<th style="padding:8px;text-align:center;border:1px solid #4a7a9d;" title="${param}">${displayName}</th>`;
        });
        
        html += '</tr></thead><tbody>';
        
        // Данные зданий
        buildings.forEach(function(building, index) {
            var bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';
            var buildingDisplayName = building.name;
            
            // Перевод названий
            var nameMap = {
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
                'snob': 'Дворец',
                'statue': 'Статуя'
            };
            
            if (nameMap[building.name]) {
                buildingDisplayName = nameMap[building.name];
            }
            
            html += `<tr style="background:${bgColor};">`;
            html += `<td style="padding:8px;border:1px solid #ddd;">
                <div style="font-weight:bold;">${buildingDisplayName}</div>
                <div style="font-size:9px;color:#888;">${building.name}</div>
            </td>`;
            
            // Параметры
            params.forEach(function(param) {
                var value = building.data[param] || '—';
                var displayValue = value;
                
                // Форматирование значений
                if (value !== '—') {
                    // Множители
                    if (param.includes('_factor')) {
                        var num = parseFloat(value);
                        if (!isNaN(num)) {
                            displayValue = num.toFixed(2);
                        }
                    }
                    // Время
                    else if (param === 'build_time') {
                        var seconds = parseInt(value);
                        if (!isNaN(seconds)) {
                            if (seconds >= 60) {
                                var minutes = Math.floor(seconds / 60);
                                var remaining = seconds % 60;
                                displayValue = remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
                            } else {
                                displayValue = `${seconds}s`;
                            }
                        }
                    }
                    // Числа
                    else if (!isNaN(value)) {
                        var num = parseFloat(value);
                        if (num >= 1000) {
                            displayValue = Math.round(num).toLocaleString();
                        }
                    }
                }
                
                html += `<td style="padding:8px;text-align:center;border:1px solid #ddd;">${displayValue}</td>`;
            });
            
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        
        // Информация о таблице
        html += `<div style="margin-top:10px;font-size:10px;color:#666;">
            Всего зданий: ${buildings.length}, параметров: ${params.length}
        </div>`;
        
        return html;
    }
    
    // Форматируем объект в текстовое представление
    function formatObject(obj, depth) {
        var html = '';
        var indent = '  '.repeat(depth);
        
        for (var key in obj) {
            var value = obj[key];
            
            if (typeof value === 'object' && value !== null) {
                html += `<div style="margin-left:${depth * 10}px;margin-top:2px;">
                    <span style="color:#8B4513;font-weight:bold;">${key}:</span>
                    ${formatObject(value, depth + 1)}
                </div>`;
            } else {
                var displayValue = value;
                if (value === '0' || value === '1') {
                    displayValue = value === '1' ? '<span style="color:green;">✓</span>' : 
                                                '<span style="color:red;">✗</span>';
                } else if (!isNaN(value) && value !== '') {
                    displayValue = parseFloat(value).toLocaleString();
                }
                
                html += `<div style="margin-left:${depth * 10}px;margin-top:2px;">
                    <span style="color:#8B4513;font-weight:bold;">${key}:</span>
                    <span style="color:#333;margin-left:5px;">${displayValue}</span>
                </div>`;
            }
        }
        
        return html;
    }
    
    // Проверяем jQuery
    if (typeof jQuery === 'undefined') {
        alert('Для работы скрипта требуется jQuery');
        return;
    }
    
    // Запускаем загрузку
    loadAllData();
})();
