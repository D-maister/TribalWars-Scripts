//javascript:
(function() {
    // Функция для получения имени сервера из URL
    function getServerNameFromUrl() {
        try {
            // Получаем текущий URL
            var currentUrl = window.location.href;
            
            // Извлекаем домен
            var domain = currentUrl.split('/')[2]; // Получаем 'ruc1.voynaplemyon.com'
            
            // Извлекаем имя сервера (первую часть домена до первой точки)
            var serverName = domain.split('.')[0]; // Получаем 'ruc1'
            
            console.log('[ConfigParser] Текущий URL:', currentUrl);
            console.log('[ConfigParser] Извлеченное имя сервера:', serverName);
            
            return serverName;
        } catch (error) {
            console.error('[ConfigParser] Ошибка извлечения имени сервера:', error);
            return 'unknown';
        }
    }
    
    // Функция для парсинга и отображения конфигурации
    function parseAndDisplayConfig(configData) {
        console.log('[ConfigParser] Начало парсинга конфигурации...');
        
        // Получаем имя сервера из URL
        var serverName = getServerNameFromUrl();
        
        // Создаем структуру для группировки настроек по категориям
        var configCategories = {
            'Основные параметры': {
                'name': serverName,
                'speed': $(configData).find("config speed").text(),
                'unit_speed': $(configData).find("config unit_speed").text(),
                'moral': $(configData).find("config moral").text(),
                'world_speed': (parseFloat($(configData).find("config speed").text()) * 
                               parseFloat($(configData).find("config unit_speed").text())).toFixed(5)
            },
            
            'Премиум функции': {},
            
            'Награды (ачивки)': {},
            
            'Строительство': {},
            
            'Прочие настройки': {},
            
            'Команды (атаки)': {},
            
            'Новичковый режим': {},
            
            'Игровые настройки': {
                'buildtime_formula': $(configData).find("game buildtime_formula").text(),
                'knight': $(configData).find("game knight").text(),
                'knight_new_items': $(configData).find("game knight_new_items").text(),
                'knight_archer_bonus': $(configData).find("game knight_archer_bonus").text(),
                'archer': $(configData).find("game archer").text(),
                'tech': $(configData).find("game tech").text(),
                'farm_limit': $(configData).find("game farm_limit").text(),
                'church': $(configData).find("game church").text(),
                'watchtower': $(configData).find("game watchtower").text(),
                'stronghold': $(configData).find("game stronghold").text(),
                'fake_limit': $(configData).find("game fake_limit").text(),
                'barbarian_rise': $(configData).find("game barbarian_rise").text(),
                'barbarian_shrink': $(configData).find("game barbarian_shrink").text(),
                'barbarian_max_points': $(configData).find("game barbarian_max_points").text(),
                'scavenging': $(configData).find("game scavenging").text(),
                'hauls': $(configData).find("game hauls").text(),
                'hauls_base': $(configData).find("game hauls_base").text(),
                'hauls_max': $(configData).find("game hauls_max").text(),
                'base_production': $(configData).find("game base_production").text(),
                'event': $(configData).find("game event").text(),
                'relics': $(configData).find("game relics").text()
            },
            
            'Здания': {},
            
            'Дворяне': {},
            
            'Племена': {},
            
            'Карта и координаты': {},
            
            'Ситерство': {},
            
            'Режим сна': {},
            
            'Ночной режим': {},
            
            'Настроение (мораль)': {},
            
            'Условия победы': {
                'check': $(configData).find("win check").text(),
                'give_prizes': $(configData).find("win give_prizes").text()
            },
            
            'Победа по очкам/деревням': {},
            
            'Победа по доминированию': {},
            
            'Победа по рунам': {},
            
            'Победа по осаде': {},
            
            'Казуальный режим': {}
        };
        
        // Парсим все элементы из XML
        $(configData).find('config > *').each(function() {
            var element = $(this);
            var tagName = element.prop("tagName");
            var text = element.text();
            
            // Пропускаем вложенные категории
            if (['premium', 'awards', 'build', 'misc', 'commands', 'newbie', 'game', 
                 'buildings', 'snob', 'ally', 'coord', 'sitter', 'sleep', 'night', 
                 'mood', 'win', 'points_villages_win', 'dominance_win', 'runes_win', 
                 'siege_win', 'casual'].includes(tagName)) {
                return true; // continue
            }
            
            // Добавляем в соответствующую категорию
            switch(tagName) {
                case 'speed':
                case 'unit_speed':
                case 'moral':
                    // Уже добавлены в Основные параметры
                    break;
                    
                case 'kill_ranking':
                case 'tutorial':
                case 'trade_cancel_time':
                    configCategories['Прочие настройки'][tagName] = text;
                    break;
                    
                case 'millis_arrival':
                case 'attack_gap':
                case 'support_gap':
                case 'command_cancel_time':
                    configCategories['Команды (атаки)'][tagName] = text;
                    break;
                    
                case 'days':
                case 'ratio_days':
                case 'ratio':
                case 'removeNewbieVillages':
                    configCategories['Новичковый режим'][tagName] = text;
                    break;
                    
                case 'custom_main':
                case 'custom_farm':
                case 'custom_storage':
                case 'custom_place':
                case 'custom_barracks':
                case 'custom_church':
                case 'custom_smith':
                case 'custom_wood':
                case 'custom_stone':
                case 'custom_iron':
                case 'custom_market':
                case 'custom_stable':
                case 'custom_wall':
                case 'custom_garage':
                case 'custom_hide':
                case 'custom_snob':
                case 'custom_statue':
                case 'custom_watchtower':
                    configCategories['Здания'][tagName] = text;
                    break;
                    
                case 'gold':
                case 'cheap_rebuild':
                case 'rise':
                case 'max_dist':
                case 'factor':
                case 'coin_wood':
                case 'coin_stone':
                case 'coin_iron':
                case 'no_barb_conquer':
                    configCategories['Дворяне'][tagName] = text;
                    break;
                    
                case 'no_harm':
                case 'no_other_support':
                case 'no_other_support_type':
                case 'allytime_support':
                case 'allytime_support_type':
                case 'limit':
                case 'fixed_allies':
                case 'fixed_allies_randomized':
                case 'wars_member_requirement':
                case 'wars_points_requirement':
                case 'wars_autoaccept_days':
                case 'auto_lock_tribes':
                case 'auto_lock_dominance_percentage':
                case 'auto_lock_days':
                case 'levels':
                case 'xp_requirements':
                    configCategories['Племена'][tagName] = text;
                    break;
                    
                case 'map_size':
                case 'func':
                case 'empty_villages':
                case 'bonus_villages':
                case 'inner':
                case 'select_start':
                case 'village_move_wait':
                case 'noble_restart':
                case 'start_villages':
                    configCategories['Карта и координаты'][tagName] = text;
                    break;
                    
                case 'allow':
                case 'illegal_time':
                case 'max_sitting':
                    configCategories['Ситерство'][tagName] = text;
                    break;
                    
                case 'active':
                case 'delay':
                case 'min':
                case 'max':
                case 'min_awake':
                case 'max_awake':
                case 'warn_time':
                    configCategories['Режим сна'][tagName] = text;
                    break;
                    
                case 'start_hour':
                case 'end_hour':
                case 'def_factor':
                case 'duration':
                    configCategories['Ночной режим'][tagName] = text;
                    break;
                    
                case 'loss_max':
                case 'loss_min':
                case 'load':
                    configCategories['Настроение (мораль)'][tagName] = text;
                    break;
                    
                case 'points':
                case 'villages':
                case 'hours':
                    configCategories['Победа по очкам/деревням'][tagName] = text;
                    break;
                    
                case 'status':
                case 'domination_warning':
                case 'world_age_warning':
                case 'domination_endgame':
                case 'world_age_endgame':
                case 'holding_period_days':
                case 'domination_reached_at':
                case 'victory_reached_at':
                    configCategories['Победа по доминированию'][tagName] = text;
                    break;
                    
                case 'spawning_delay':
                case 'spawn_villages_per_continent':
                case 'win_percentage':
                case 'hold_time':
                case 'disable_morale':
                    configCategories['Победа по рунам'][tagName] = text;
                    break;
                    
                case 'villages':
                case 'required_points':
                case 'check_days':
                case 'minimum_world_age':
                case 'reduction_percentage':
                case 'reduction_max_percentage':
                case 'disable_morale':
                    configCategories['Победа по осаде'][tagName] = text;
                    break;
                    
                case 'attack_block':
                case 'attack_block_max':
                case 'block_noble':
                case 'disabled_restart_deadline':
                case 'automation_version':
                case 'automation_start_after':
                case 'automation_change_interval':
                case 'limit_inventory_transfer':
                    configCategories['Казуальный режим'][tagName] = text;
                    break;
                    
                default:
                    console.log('[ConfigParser] Неизвестный тег:', tagName, '=', text);
            }
        });
        
        // Парсим вложенные категории
        parseNestedCategory(configData, 'premium', configCategories['Премиум функции']);
        parseNestedCategory(configData, 'awards', configCategories['Награды (ачивки)']);
        parseNestedCategory(configData, 'build', configCategories['Строительство']);
        parseNestedCategory(configData, 'misc', configCategories['Прочие настройки']);
        parseNestedCategory(configData, 'commands', configCategories['Команды (атаки)']);
        parseNestedCategory(configData, 'newbie', configCategories['Новичковый режим']);
        parseNestedCategory(configData, 'game', configCategories['Игровые настройки']);
        parseNestedCategory(configData, 'buildings', configCategories['Здания']);
        parseNestedCategory(configData, 'snob', configCategories['Дворяне']);
        parseNestedCategory(configData, 'ally', configCategories['Племена']);
        parseNestedCategory(configData, 'coord', configCategories['Карта и координаты']);
        parseNestedCategory(configData, 'sitter', configCategories['Ситерство']);
        parseNestedCategory(configData, 'sleep', configCategories['Режим сна']);
        parseNestedCategory(configData, 'night', configCategories['Ночной режим']);
        parseNestedCategory(configData, 'mood', configCategories['Настроение (мораль)']);
        parseNestedCategory(configData, 'win', configCategories['Условия победы']);
        parseNestedCategory(configData, 'points_villages_win', configCategories['Победа по очкам/деревням']);
        parseNestedCategory(configData, 'dominance_win', configCategories['Победа по доминированию']);
        parseNestedCategory(configData, 'runes_win', configCategories['Победа по рунам']);
        parseNestedCategory(configData, 'siege_win', configCategories['Победа по осаде']);
        parseNestedCategory(configData, 'casual', configCategories['Казуальный режим']);
        
        // Отображаем конфигурацию
        displayConfigTables(configCategories, serverName);
    }
    
    // Функция для парсинга вложенной категории
    function parseNestedCategory(configData, categoryName, targetObject) {
        $(configData).find(categoryName + ' > *').each(function() {
            var element = $(this);
            var tagName = element.prop("tagName");
            var text = element.text();
            
            // Преобразуем имена тегов в читаемый формат
            var displayName = formatSettingName(tagName);
            targetObject[tagName] = text;
        });
    }
    
    // Функция для форматирования имен настроек
    function formatSettingName(settingName) {
        // Заменяем подчеркивания на пробелы и делаем первую букву заглавной
        return settingName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, function(l) { return l.toUpperCase(); });
    }
    
    // Функция для форматирования значений
    function formatSettingValue(settingName, value) {
        // Специальная обработка для некоторых значений
        switch(settingName) {
            case 'knight':
            case 'archer':
            case 'church':
            case 'watchtower':
            case 'stronghold':
            case 'scavenging':
            case 'hauls':
            case 'event':
            case 'relics':
            case 'free_Premium':
            case 'AccountManager':
            case 'ItemNameColor':
            case 'free_AccountManager':
            case 'BuildTimeReduction':
            case 'BuildInstant':
            case 'BuildInstant_free':
            case 'BuildCostReduction':
            case 'FarmAssistent':
            case 'MerchantBonus':
            case 'ProductionBonus':
            case 'NoblemanSlot':
            case 'MerchantExchange':
            case 'PremiumExchange':
            case 'KnightBookImprove':
            case 'KnightBookDowngrade':
            case 'KnightBookReroll':
            case 'KnightRespec':
            case 'KnightRecruitTime':
            case 'KnightRecruitInstant':
            case 'KnightReviveTime':
            case 'KnightReviveInstant':
            case 'KnightTrainingCost':
            case 'KnightTrainingTime':
            case 'KnightTrainingInstant':
            case 'DailyBonusUnlock':
            case 'ScavengingSquadLoot':
            case 'PremiumEventFeatures':
            case 'PremiumRelicFeatures':
            case 'VillageSkin':
            case 'available':
            case 'milestones_available':
            case 'destroy':
            case 'tutorial':
            case 'removeNewbieVillages':
            case 'fake_limit':
            case 'cheap_rebuild':
            case 'no_barb_conquer':
            case 'no_harm':
            case 'fixed_allies':
            case 'fixed_allies_randomized':
            case 'auto_lock_tribes':
            case 'levels':
            case 'select_start':
            case 'noble_restart':
            case 'allow':
            case 'active':
            case 'active_night':
            case 'give_prizes':
            case 'disable_morale':
            case 'attack_block':
            case 'block_noble':
            case 'limit_inventory_transfer':
                return value === '1' ? '✓ Включено' : (value === '0' ? '✗ Выключено' : value);
                
            case 'moral':
            case 'knight_new_items':
            case 'knight_archer_bonus':
            case 'tech':
            case 'farm_limit':
                return value === '0' ? 'Выключено' : 
                       value === '1' ? 'Включено' : 
                       value === '2' ? 'Расширенное' : value;
                       
            case 'buildtime_formula':
                return value === '1' ? 'Базовая' : 
                       value === '2' ? 'Средняя' : 
                       value === '3' ? 'Сложная' : value;
                       
            case 'no_other_support_type':
            case 'allytime_support_type':
                return value === '0' ? 'Запрещено' : 
                       value === '1' ? 'Только племенам' : 
                       value === '2' ? 'Разрешено' : value;
                       
            case 'xp_requirements':
                return value === 'v1' ? 'Версия 1' : 
                       value === 'v2' ? 'Версия 2' : value;
                       
            default:
                return value;
        }
    }
    
    // Функция для отображения таблиц с конфигурацией
    function displayConfigTables(configCategories, serverName) {
        console.log('[ConfigParser] Создание интерфейса для отображения конфигурации...');
        
        // Создаем всплывающее окно
        var popupHTML = `
            <div id="configParserPopup" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #f5f5e1;
                border: 3px solid #8B4513;
                border-radius: 8px;
                padding: 20px;
                width: 90%;
                max-width: 1200px;
                height: 90vh;
                overflow-y: auto;
                z-index: 10000;
                box-shadow: 0 0 30px rgba(0,0,0,0.7);
                font-family: Arial, sans-serif;
                color: #333;
            ">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #8B4513;
                ">
                    <div>
                        <h2 style="margin: 0 0 5px 0; color: #8B4513;">Конфигурация мира</h2>
                        <div style="color: #666; font-size: 14px;">Сервер: <strong>${serverName}</strong></div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button id="copyConfigBtn" style="
                            background: #5D8AA8;
                            color: white;
                            border: none;
                            padding: 8px 15px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 13px;
                        ">Копировать всё</button>
                        <button onclick="document.getElementById('configParserPopup').remove(); document.getElementById('configParserOverlay').remove();" style="
                            background: #8B4513;
                            color: white;
                            border: none;
                            padding: 8px 15px;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 13px;
                        ">Закрыть</button>
                    </div>
                </div>
                
                <div id="configTabs" style="
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #ddd;
                "></div>
                
                <div id="configContent" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px;">
                    <!-- Контент будет добавлен динамически -->
                </div>
                
                <div style="
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #ddd;
                    color: #666;
                    font-size: 12px;
                    text-align: center;
                ">
                    <div>Всего категорий: <span id="categoryCount">0</span>, всего настроек: <span id="settingCount">0</span></div>
                    <div style="margin-top: 5px;">Скрипт ConfigParser • Обновлено: ${new Date().toLocaleTimeString()}</div>
                </div>
            </div>
            
            <div id="configParserOverlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                z-index: 9999;
            " onclick="document.getElementById('configParserPopup').remove(); this.remove();"></div>
        `;
        
        // Удаляем старые элементы если есть
        document.getElementById('configParserPopup')?.remove();
        document.getElementById('configParserOverlay')?.remove();
        
        // Добавляем новый попап
        document.body.insertAdjacentHTML('beforeend', popupHTML);
        
        // Создаем вкладки и контент
        var tabsContainer = document.getElementById('configTabs');
        var contentContainer = document.getElementById('configContent');
        
        // Добавляем кнопку для всех категорий
        var allTab = document.createElement('button');
        allTab.textContent = 'Все категории';
        allTab.style.cssText = `
            background: #8B4513;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        `;
        allTab.onclick = function() {
            showAllCategories();
            setActiveTab(this);
        };
        tabsContainer.appendChild(allTab);
        
        var totalSettings = 0;
        
        // Создаем вкладки и таблицы для каждой категории
        Object.keys(configCategories).forEach(function(categoryName, index) {
            var settings = configCategories[categoryName];
            var settingCount = Object.keys(settings).length;
            
            if (settingCount === 0) return; // Пропускаем пустые категории
            
            totalSettings += settingCount;
            
            // Создаем вкладку
            var tab = document.createElement('button');
            tab.textContent = `${categoryName} (${settingCount})`;
            tab.dataset.category = categoryName;
            tab.style.cssText = `
                background: #e8e4d8;
                color: #8B4513;
                border: 1px solid #8B4513;
                padding: 8px 15px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.3s;
            `;
            tab.onmouseover = function() {
                this.style.background = '#d8d4c8';
            };
            tab.onmouseout = function() {
                if (!this.classList.contains('active')) {
                    this.style.background = '#e8e4d8';
                }
            };
            tab.onclick = function() {
                showCategory(categoryName);
                setActiveTab(this);
            };
            tabsContainer.appendChild(tab);
            
            // Создаем таблицу для категории
            var tableHTML = `
                <div id="category-${categoryName.replace(/\s+/g, '-')}" class="category-table" style="
                    display: none;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    overflow: hidden;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                ">
                    <div style="
                        background: #8B4513;
                        color: white;
                        padding: 12px 15px;
                        font-weight: bold;
                        font-size: 16px;
                    ">
                        ${categoryName} <span style="font-size: 12px; opacity: 0.8;">(${settingCount} настроек)</span>
                    </div>
                    <div style="padding: 0;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f9f9f9;">
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; width: 60%;">Настройка</th>
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd; width: 40%;">Значение</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            // Добавляем строки с настройками
            Object.keys(settings).forEach(function(settingName) {
                var value = settings[settingName];
                var displayName = formatSettingName(settingName);
                var displayValue = formatSettingValue(settingName, value);
                
                tableHTML += `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; vertical-align: top;">
                            <div style="font-weight: bold;">${displayName}</div>
                            <div style="font-size: 11px; color: #888; font-family: monospace;">${settingName}</div>
                        </td>
                        <td style="padding: 10px; vertical-align: top;">
                            <div style="font-family: ${typeof value === 'string' && value.includes(',') ? 'monospace' : 'inherit'}; 
                                 word-break: break-word;">
                                ${displayValue}
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            tableHTML += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            
            contentContainer.insertAdjacentHTML('beforeend', tableHTML);
        });
        
        // Обновляем счетчики
        document.getElementById('categoryCount').textContent = Object.keys(configCategories).filter(cat => Object.keys(configCategories[cat]).length > 0).length;
        document.getElementById('settingCount').textContent = totalSettings;
        
        // Показываем все категории по умолчанию
        showAllCategories();
        setActiveTab(allTab);
        
        // Добавляем функционал копирования
        document.getElementById('copyConfigBtn').onclick = function() {
            copyAllConfigToClipboard(configCategories, serverName);
        };
        
        console.log('[ConfigParser] Интерфейс создан. Категорий:', document.getElementById('categoryCount').textContent, 
                   'Настроек:', totalSettings);
    }
    
    // Функция для показа всех категорий
    function showAllCategories() {
        document.querySelectorAll('.category-table').forEach(function(table) {
            table.style.display = 'block';
        });
    }
    
    // Функция для показа конкретной категории
    function showCategory(categoryName) {
        document.querySelectorAll('.category-table').forEach(function(table) {
            table.style.display = 'none';
        });
        var table = document.getElementById('category-' + categoryName.replace(/\s+/g, '-'));
        if (table) {
            table.style.display = 'block';
            table.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    // Функция для установки активной вкладки
    function setActiveTab(activeTab) {
        document.querySelectorAll('#configTabs button').forEach(function(tab) {
            tab.style.background = '#e8e4d8';
            tab.style.color = '#8B4513';
            tab.classList.remove('active');
        });
        activeTab.style.background = '#8B4513';
        activeTab.style.color = 'white';
        activeTab.classList.add('active');
    }
    
    // Функция для копирования всей конфигурации в буфер обмена
    function copyAllConfigToClipboard(configCategories, serverName) {
        var configText = `Конфигурация мира Tribal Wars\n`;
        configText += `Сервер: ${serverName}\n`;
        configText += `Дата: ${new Date().toLocaleString()}\n`;
        configText += `========================================\n\n`;
        
        Object.keys(configCategories).forEach(function(categoryName) {
            var settings = configCategories[categoryName];
            if (Object.keys(settings).length === 0) return;
            
            configText += `${categoryName}:\n`;
            configText += `${'='.repeat(categoryName.length + 1)}\n`;
            
            Object.keys(settings).forEach(function(settingName) {
                var value = settings[settingName];
                var displayName = formatSettingName(settingName);
                var displayValue = formatSettingValue(settingName, value);
                
                configText += `  ${displayName}: ${displayValue}\n`;
            });
            
            configText += '\n';
        });
        
        // Копируем в буфер обмена
        navigator.clipboard.writeText(configText).then(function() {
            var btn = document.getElementById('copyConfigBtn');
            var originalText = btn.textContent;
            btn.textContent = 'Скопировано!';
            btn.style.background = '#4CAF50';
            
            setTimeout(function() {
                btn.textContent = originalText;
                btn.style.background = '#5D8AA8';
            }, 2000);
            
            console.log('[ConfigParser] Вся конфигурация скопирована в буфер обмена');
        }).catch(function(err) {
            console.error('[ConfigParser] Ошибка копирования в буфер обмена:', err);
            alert('Не удалось скопировать в буфер обмена. Проверьте консоль для деталей.');
        });
    }
    
    // Основная функция для запуска скрипта
    function loadAndDisplayConfig() {
        console.log('[ConfigParser] Запуск скрипта...');
        
        // Проверяем наличие jQuery
        if (typeof jQuery === 'undefined') {
            console.error('[ConfigParser] jQuery не загружен');
            alert('Ошибка: jQuery не найден. Скрипт требует jQuery для работы.');
            return;
        }
        
        // Загружаем конфигурацию с сервера
        $.ajax({
            'async': false,
            'url': '/interface.php?func=get_config',
            'dataType': 'xml',
            'success': function (data) {
                console.log('[ConfigParser] Конфигурация успешно загружена');
                parseAndDisplayConfig(data);
            },
            'error': function(jqXHR, textStatus, errorThrown) {
                console.error('[ConfigParser] Ошибка загрузки конфигурации:', textStatus, errorThrown);
                alert('Ошибка загрузки конфигурации мира. Проверьте консоль для деталей.');
            }
        });
    }
    
    // Запускаем скрипт
    loadAndDisplayConfig();
    
})();

// Букмарклет версия (однострочник):
// javascript:(function(){var d=document,s=d.createElement('script');s.src='https://your-domain.com/config-parser.js';d.head.appendChild(s);})();
