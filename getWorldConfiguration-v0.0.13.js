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
    
    // Парсер XML в объект
    function parseXmlToObject(xml) {
        var result = {};
        
        function parseElement(element) {
            var obj = {};
            var children = element.children;
            
            if (children.length === 0) {
                return element.textContent.trim();
            }
            
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                obj[child.tagName] = parseElement(child);
            }
            
            return obj;
        }
        
        return parseElement(xml.documentElement);
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
                worldConfig = parseXmlToObject(xml);
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
                buildingInfo = parseXmlToObject(xml);
                console.log('Building info loaded:', buildingInfo);
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
                background:#f5f5e1;border:3px solid #8B4513;border-radius:5px;
                overflow:hidden;z-index:10000;box-shadow:0 0 30px rgba(0,0,0,0.7);display:flex;flex-direction:column;">
                
                <!-- Заголовок -->
                <div style="background:#8B4513;color:white;padding:12px 15px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <h3 style="margin:0;font-size:16px;">Tribal Wars Info - ${serverName}</h3>
                        <button onclick="closePopup()" style="background:#a0522d;color:white;border:none;
                            padding:5px 15px;border-radius:3px;cursor:pointer;font-size:14px;">
                            ✕ Закрыть
                        </button>
                    </div>
                </div>
                
                <!-- Вкладки -->
                <div style="background:#e8e4d8;padding:5px 15px;border-bottom:1px solid #8B4513;">
                    <button onclick="showTab('world')" id="tabWorld" style="background:#8B4513;color:white;
                        border:none;padding:8px 20px;border-radius:4px 4px 0 0;cursor:pointer;margin-right:5px;">
                        Конфигурация мира
                    </button>
                    <button onclick="showTab('buildings')" id="tabBuildings" style="background:#d8d4c8;color:#8B4513;
                        border:1px solid #8B4513;border-bottom:none;padding:8px 20px;border-radius:4px 4px 0 0;
                        cursor:pointer;">
                        Здания
                    </button>
                </div>
                
                <!-- Контент -->
                <div id="contentArea" style="flex:1;overflow:auto;padding:15px;">
                    <div id="worldContent"></div>
                    <div id="buildingsContent" style="display:none;"></div>
                </div>
                
                <!-- Статистика -->
                <div style="background:#f0f0f0;padding:8px 15px;border-top:1px solid #ddd;font-size:12px;color:#666;">
                    <span id="statsInfo">Загрузка...</span>
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
        updateStats();
        
        // Делаем активной первую вкладку
        showTab('world');
    }
    
    // Отображение конфигурации мира
    function displayWorldConfig() {
        var contentDiv = document.getElementById('worldContent');
        
        if (!worldConfig || !worldConfig.config) {
            contentDiv.innerHTML = '<div style="color:#666;padding:20px;text-align:center;">Конфигурация не загружена</div>';
            return;
        }
        
        var config = worldConfig.config;
        var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(350px, 1fr));gap:15px;">';
        
        // Основные параметры
        html += createConfigSection('Основные параметры', {
            'Скорость игры': config.speed,
            'Скорость юнитов': config.unit_speed,
            'Мировая скорость': (parseFloat(config.speed || 0) * parseFloat(config.unit_speed || 0)).toFixed(2),
            'Мораль': config.moral === '0' ? 'Выключена' : 'Включена'
        }, '#8B4513');
        
        // Игровые настройки
        if (config.game) {
            html += createConfigSection('Игровые настройки', {
                'Луки': config.game.archer === '1' ? '✓ Доступны' : '✗ Не доступны',
                'Рыцари': config.game.knight === '1' ? '✓ Доступны' : '✗ Не доступны',
                'Церковь': config.game.church === '1' ? '✓ Есть' : '✗ Нет',
                'Сторожевая башня': config.game.watchtower === '1' ? '✓ Есть' : '✗ Нет',
                'Разграбление': config.game.scavenging === '1' ? '✓ Включено' : '✗ Выключено',
                'Ресурсы за атаки': config.game.hauls === '1' ? '✓ Включены' : '✗ Выключены',
                'Базовое производство': config.game.base_production,
                'Формула времени стр-ва': config.game.buildtime_formula === '1' ? 'Базовая' : 
                                          config.game.buildtime_formula === '2' ? 'Средняя' : 'Сложная'
            }, '#5D8AA8');
        }
        
        // Карта
        if (config.coord) {
            html += createConfigSection('Карта', {
                'Размер карты': config.coord.map_size + '×' + config.coord.map_size,
                'Пустые деревни': config.coord.empty_villages + '%',
                'Бонусные деревни': config.coord.bonus_villages + '%',
                'Начальные деревни': config.coord.start_villages,
                'Внутренний радиус': config.coord.inner
            }, '#2E8B57');
        }
        
        // Дворяне
        if (config.snob) {
            html += createConfigSection('Дворяне', {
                'Золото': config.snob.gold === '1' ? '✓ Требуется' : '✗ Не требуется',
                'Макс. расстояние': config.snob.max_dist,
                'Стоимость (дерево)': formatNumber(config.snob.coin_wood),
                'Стоимость (камень)': formatNumber(config.snob.coin_stone),
                'Стоимость (железо)': formatNumber(config.snob.coin_iron)
            }, '#8B4513');
        }
        
        // Племена
        if (config.ally) {
            html += createConfigSection('Племена', {
                'Макс. участников': config.ally.limit,
                'Уровни племен': config.ally.levels === '1' ? '✓ Включены' : '✗ Выключены',
                'Требование для войн (участники)': config.ally.wars_member_requirement,
                'Требование для войн (очки)': formatNumber(config.ally.wars_points_requirement)
            }, '#5D8AA8');
        }
        
        // Премиум функции (если есть)
        if (config.premium) {
            var premiumCount = Object.keys(config.premium).filter(k => config.premium[k] === '1').length;
            html += createConfigSection('Премиум функции', {
                'Доступно функций': premiumCount + ' из ' + Object.keys(config.premium).length,
                'Бесплатный премиум': config.premium.free_Premium === '1' ? '✓ Да' : '✗ Нет',
                'Менеджер аккаунтов': config.premium.AccountManager === '1' ? '✓ Доступен' : '✗ Не доступен',
                'Помощник фарма': config.premium.FarmAssistent === '1' ? '✓ Доступен' : '✗ Не доступен'
            }, '#FF8C00');
        }
        
        html += '</div>';
        contentDiv.innerHTML = html;
    }
    
    // Создание секции конфигурации
    function createConfigSection(title, items, color) {
        var html = `
            <div style="background:white;border:1px solid ${color};border-radius:5px;overflow:hidden;">
                <div style="background:${color};color:white;padding:10px 15px;font-weight:bold;font-size:14px;">
                    ${title}
                </div>
                <div style="padding:10px;">
        `;
        
        Object.keys(items).forEach(function(key) {
            html += `
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;">
                    <div style="font-weight:bold;color:#333;">${key}:</div>
                    <div style="color:#666;">${items[key]}</div>
                </div>
            `;
        });
        
        html += '</div></div>';
        return html;
    }
    
    // Отображение информации о зданиях
    function displayBuildingInfo() {
        var contentDiv = document.getElementById('buildingsContent');
        
        if (!buildingInfo || !buildingInfo.config) {
            contentDiv.innerHTML = '<div style="color:#666;padding:20px;text-align:center;">Информация о зданиях не загружена</div>';
            return;
        }
        
        var buildings = buildingInfo.config;
        var buildingNames = Object.keys(buildings);
        
        if (buildingNames.length === 0) {
            contentDiv.innerHTML = '<div style="color:#666;padding:20px;text-align:center;">Нет данных о зданиях</div>';
            return;
        }
        
        // Получаем все параметры из первого здания
        var firstBuilding = buildings[buildingNames[0]];
        var params = Object.keys(firstBuilding).sort();
        
        var html = `
            <div style="margin-bottom:15px;">
                <div style="display:inline-block;background:#5D8AA8;color:white;padding:8px 15px;border-radius:4px;">
                    Всего зданий: <strong>${buildingNames.length}</strong>
                </div>
                <div style="display:inline-block;margin-left:10px;color:#666;">
                    Параметров: <strong>${params.length}</strong> на здание
                </div>
            </div>
            
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;background:white;border:1px solid #ddd;">
                    <thead>
                        <tr style="background:#5D8AA8;color:white;">
                            <th style="padding:12px;text-align:left;border-right:1px solid #4a7a9d;position:sticky;left:0;background:#5D8AA8;z-index:10;">
                                Здание
                            </th>
        `;
        
        // Заголовки параметров
        params.forEach(function(param) {
            var displayName = getParamDisplayName(param);
            html += `<th style="padding:12px;text-align:center;border-right:1px solid #4a7a9d;min-width:80px;" title="${param}">
                ${displayName}
            </th>`;
        });
        
        html += `</tr></thead><tbody>`;
        
        // Данные зданий
        buildingNames.forEach(function(buildingName, index) {
            var buildingData = buildings[buildingName];
            var bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';
            var displayName = getBuildingDisplayName(buildingName);
            
            html += `<tr style="background:${bgColor};">`;
            
            // Название здания (закрепленная ячейка)
            html += `<td style="padding:10px;border-right:1px solid #eee;border-bottom:1px solid #eee;
                position:sticky;left:0;background:${bgColor} !important;z-index:5;">
                <div style="font-weight:bold;">${displayName}</div>
                <div style="font-size:11px;color:#888;">${buildingName}</div>
            </td>`;
            
            // Параметры
            params.forEach(function(param) {
                var value = buildingData[param] || '—';
                var displayValue = formatBuildingValue(value, param);
                var cellStyle = getParamCellStyle(param);
                
                html += `<td style="padding:10px;text-align:center;border-right:1px solid #eee;border-bottom:1px solid #eee;${cellStyle}">
                    ${displayValue}
                </td>`;
            });
            
            html += `</tr>`;
        });
        
        html += `</tbody></table></div>`;
        
        // Легенда
        html += createBuildingLegend();
        
        contentDiv.innerHTML = html;
    }
    
    // Создание легенды для таблицы зданий
    function createBuildingLegend() {
        return `
            <div style="margin-top:20px;background:#f0f7ff;border:1px solid #5D8AA8;border-radius:5px;padding:15px;">
                <div style="font-weight:bold;color:#5D8AA8;margin-bottom:10px;">Обозначения:</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:10px;font-size:12px;">
                    <div style="display:flex;align-items:center;">
                        <div style="width:20px;height:20px;background:#fff0f0;border:1px solid #8B4513;margin-right:8px;"></div>
                        <span>Ресурсы (дерево, камень, железо)</span>
                    </div>
                    <div style="display:flex;align-items:center;">
                        <div style="width:20px;height:20px;background:#f0fff0;border:1px solid #2E8B57;margin-right:8px;"></div>
                        <span>Население</span>
                    </div>
                    <div style="display:flex;align-items:center;">
                        <div style="width:20px;height:20px;background:#f0f8ff;border:1px solid #5D8AA8;margin-right:8px;"></div>
                        <span>Множители</span>
                    </div>
                    <div style="display:flex;align-items:center;">
                        <div style="width:20px;height:20px;background:#fff8f0;border:1px solid #FF8C00;margin-right:8px;"></div>
                        <span>Время строительства</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Вспомогательные функции
    function getBuildingDisplayName(name) {
        var names = {
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
        return names[name] || name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    function getParamDisplayName(param) {
        var params = {
            'max_level': 'Макс',
            'min_level': 'Мин',
            'wood': 'Дер',
            'stone': 'Кам',
            'iron': 'Жел',
            'pop': 'Нар',
            'wood_factor': '×Дер',
            'stone_factor': '×Кам',
            'iron_factor': '×Жел',
            'pop_factor': '×Нар',
            'build_time': 'Время',
            'build_time_factor': '×Вр'
        };
        return params[param] || param.substring(0, 4);
    }
    
    function getParamCellStyle(param) {
        if (['wood', 'stone', 'iron'].includes(param)) {
            return 'background:#fff0f0;';
        } else if (param === 'pop') {
            return 'background:#f0fff0;';
        } else if (param.includes('_factor')) {
            return 'background:#f0f8ff;';
        } else if (param.includes('time')) {
            return 'background:#fff8f0;';
        }
        return '';
    }
    
    function formatBuildingValue(value, param) {
        if (value === '—') return value;
        
        // Множители
        if (param.includes('_factor')) {
            var num = parseFloat(value);
            return !isNaN(num) ? num.toFixed(2) : value;
        }
        
        // Время строительства
        if (param === 'build_time') {
            var seconds = parseInt(value);
            if (!isNaN(seconds)) {
                if (seconds >= 3600) {
                    var hours = Math.floor(seconds / 3600);
                    var minutes = Math.floor((seconds % 3600) / 60);
                    return minutes > 0 ? `${hours}ч ${minutes}м` : `${hours}ч`;
                } else if (seconds >= 60) {
                    var minutes = Math.floor(seconds / 60);
                    var remaining = seconds % 60;
                    return remaining > 0 ? `${minutes}м ${remaining}с` : `${minutes}м`;
                } else {
                    return `${seconds}с`;
                }
            }
        }
        
        // Числа
        if (!isNaN(value) && value !== '') {
            var num = parseFloat(value);
            if (num >= 1000) {
                return num.toLocaleString();
            }
            return num.toString();
        }
        
        return value;
    }
    
    function formatNumber(num) {
        if (!num) return '0';
        var n = parseFloat(num);
        return n.toLocaleString();
    }
    
    function updateStats() {
        var statsDiv = document.getElementById('statsInfo');
        if (!statsDiv) return;
        
        var worldCount = worldConfig && worldConfig.config ? countConfigItems(worldConfig.config) : 0;
        var buildingCount = buildingInfo && buildingInfo.config ? Object.keys(buildingInfo.config).length : 0;
        
        var date = new Date();
        var timeStr = date.getHours().toString().padStart(2, '0') + ':' + 
                     date.getMinutes().toString().padStart(2, '0') + ':' + 
                     date.getSeconds().toString().padStart(2, '0');
        
        statsDiv.innerHTML = `
            Конфигурация: ${worldCount} параметров | 
            Здания: ${buildingCount} шт. | 
            Время: ${timeStr}
        `;
    }
    
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
        var worldBtn = document.getElementById('tabWorld');
        var buildBtn = document.getElementById('tabBuildings');
        var worldContent = document.getElementById('worldContent');
        var buildContent = document.getElementById('buildingsContent');
        
        if (worldBtn && buildBtn && worldContent && buildContent) {
            // Обновляем кнопки
            worldBtn.style.background = (tabName === 'world') ? '#8B4513' : '#d8d4c8';
            worldBtn.style.color = (tabName === 'world') ? 'white' : '#8B4513';
            worldBtn.style.border = (tabName === 'world') ? 'none' : '1px solid #8B4513';
            
            buildBtn.style.background = (tabName === 'buildings') ? '#8B4513' : '#d8d4c8';
            buildBtn.style.color = (tabName === 'buildings') ? 'white' : '#8B4513';
            buildBtn.style.border = (tabName === 'buildings') ? 'none' : '1px solid #8B4513';
            
            // Показываем/скрываем контент
            worldContent.style.display = (tabName === 'world') ? 'block' : 'none';
            buildContent.style.display = (tabName === 'buildings') ? 'block' : 'none';
        }
    };
    
    window.closePopup = function() {
        document.getElementById('twInfoPopup')?.remove();
        document.getElementById('twInfoOverlay')?.remove();
    };
    
    // Проверяем jQuery
    if (typeof jQuery === 'undefined') {
        alert('Для работы скрипта требуется jQuery');
        return;
    }
    
    // Запускаем загрузку
    loadAllData();
})();
