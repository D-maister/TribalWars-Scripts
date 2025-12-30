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
            
            if ($el.children().length > 0) {
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
        
        // Создаем вкладки для основных категорий
        var mainCategories = Object.keys(configObj).filter(key => 
            typeof configObj[key] === 'object' && configObj[key] !== null);
        
        // Добавляем вкладки
        var tabsHtml = '<div style="margin-bottom:20px;display:flex;flex-wrap:wrap;gap:5px;">';
        tabsHtml += '<button onclick="showAllCategories()" style="background:#8B4513;color:white;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;">Все</button>';
        
        mainCategories.forEach(function(category) {
            tabsHtml += `<button onclick="showCategory('${category}')" style="background:#e8e4d8;color:#8B4513;border:1px solid #8B4513;padding:8px 15px;border-radius:4px;cursor:pointer;">${category}</button>`;
        });
        
        tabsHtml += '</div>';
        contentDiv.innerHTML = tabsHtml;
        
        // Создаем таблицы для каждой категории
        var tablesHtml = '';
        var totalSettings = 0;
        
        // Основные настройки (не вложенные)
        var mainSettings = Object.keys(configObj).filter(key => 
            typeof configObj[key] !== 'object' || configObj[key] === null);
        
        if (mainSettings.length > 0) {
            tablesHtml += createCategoryTable('Основные настройки', configObj, mainSettings);
            totalSettings += mainSettings.length;
        }
        
        // Категории
        mainCategories.forEach(function(category) {
            var settings = configObj[category];
            var flatSettings = flattenObject(settings, category);
            tablesHtml += createCategoryTable(category, settings);
            totalSettings += Object.keys(flatSettings).length;
        });
        
        contentDiv.insertAdjacentHTML('beforeend', tablesHtml);
        
        // Добавляем статистику
        contentDiv.insertAdjacentHTML('beforeend', 
            `<div style="margin-top:20px;padding-top:15px;border-top:1px solid #ddd;color:#666;">
                Всего категорий: ${mainCategories.length + (mainSettings.length > 0 ? 1 : 0)}<br>
                Всего настроек: ${totalSettings}<br>
                Обновлено: ${new Date().toLocaleTimeString()}
            </div>`);
        
        // Показываем все таблицы
        showAllCategories();
    }
    
    // Функция для создания таблицы категории
    function createCategoryTable(categoryName, categoryData, specificKeys = null) {
        var tableId = 'table-' + categoryName.replace(/\s+/g, '-');
        var keys = specificKeys || Object.keys(categoryData);
        
        if (keys.length === 0) return '';
        
        var tableHtml = `
            <div id="${tableId}" class="category-table" style="display:none;margin-bottom:25px;
                background:white;border:1px solid #ddd;border-radius:5px;overflow:hidden;">
                <div style="background:#8B4513;color:white;padding:12px 15px;font-weight:bold;">
                    ${categoryName} <span style="font-size:12px;opacity:0.8;">(${keys.length})</span>
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
    
    // Функция для "разворачивания" вложенных объектов
    function flattenObject(obj, prefix = '') {
        var result = {};
        
        Object.keys(obj).forEach(function(key) {
            var value = obj[key];
            var newKey = prefix ? prefix + '.' + key : key;
            
            if (typeof value === 'object' && value !== null) {
                // Рекурсивно разворачиваем вложенные объекты
                var nested = flattenObject(value, newKey);
                Object.assign(result, nested);
            } else {
                result[newKey] = value;
            }
        });
        
        return result;
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
        
        // Проверяем булевы значения
        if (value === '0' || value === '1') {
            // Проверяем известные булевы ключи
            var booleanKeys = ['knight', 'archer', 'church', 'watchtower', 'stronghold', 
                              'scavenging', 'hauls', 'event', 'relics', 'tutorial', 'destroy',
                              'available', 'moral', 'allow', 'active', 'give_prizes'];
            
            if (booleanKeys.some(k => key.toLowerCase().includes(k))) {
                return value === '1' ? '✓ Да' : '✗ Нет';
            }
        }
        
        // Проверяем числовые значения
        if (!isNaN(value) && value !== '') {
            var num = parseFloat(value);
            if (num > 1000000) {
                return num.toLocaleString(); // Форматируем большие числа
            }
        }
        
        return value;
    }
    
    // Глобальные функции для управления отображением
    window.showAllCategories = function() {
        document.querySelectorAll('.category-table').forEach(function(table) {
            table.style.display = 'block';
        });
    };
    
    window.showCategory = function(categoryName) {
        document.querySelectorAll('.category-table').forEach(function(table) {
            table.style.display = 'none';
        });
        var table = document.getElementById('table-' + categoryName.replace(/\s+/g, '-'));
        if (table) {
            table.style.display = 'block';
            table.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };
    
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
