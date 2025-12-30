// ==UserScript==
// @name         Tribal Wars Troops Data Extractor
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Извлекает данные о количестве войск в каждой деревне
// @author       Your Name
// @match        https://*.tribalwars.*/game.php*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Конфигурация
    const DEBUG = true;
    const logger = {
        debug: function(...args) {
            if (DEBUG) console.log('[TroopsExtractor]', ...args);
        },
        info: function(...args) {
            console.log('[TroopsExtractor]', ...args);
        },
        error: function(...args) {
            console.error('[TroopsExtractor]', ...args);
        }
    };

    // Имена юнитов на русском
    const TROOP_NAMES = [
        "Копейщик", "Мечник", "Топорник", "Лучник", 
        "Разведка", "Лёгкая кавалерия", "Конный лучник", "Тяжёлая кавалерия", 
        "Таран", "Катапульта", "Паладин", "Дворянин"
    ];

    // Типы юнитов для ссылок
    const UNIT_TYPES = [
        "spear", "sword", "axe", "archer", "spy", "light", 
        "marcher", "heavy", "ram", "catapult", "knight", "snob"
    ];

    class TroopsExtractor {
        constructor() {
            this.data = [];
            this.isProcessing = false;
            this.currentVillageId = game_data?.village?.id || '';
            this.init();
        }

        init() {
            logger.info('Инициализация TroopsExtractor...');
            this.addControlPanel();
            this.loadConfig();
        }

        // Добавляем панель управления на страницу
        addControlPanel() {
            const panelHTML = `
                <div id="troopsExtractorPanel" style="
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #f5f5e1;
                    border: 2px solid #8B4513;
                    border-radius: 5px;
                    padding: 10px;
                    z-index: 9999;
                    box-shadow: 0 0 10px rgba(0,0,0,0.3);
                    min-width: 300px;
                    max-height: 80vh;
                    overflow-y: auto;
                ">
                    <div style="
                        background: #8B4513;
                        color: white;
                        padding: 5px;
                        margin: -10px -10px 10px -10px;
                        border-radius: 3px 3px 0 0;
                        text-align: center;
                        font-weight: bold;
                    ">
                        Troops Extractor v1.0
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <button id="extractBtn" class="btn" style="width: 100%; margin-bottom: 5px;">
                            📊 Извлечь данные
                        </button>
                        <button id="exportCSVBtn" class="btn" style="width: 100%; margin-bottom: 5px;">
                            📁 Экспорт в CSV
                        </button>
                        <button id="exportJSONBtn" class="btn" style="width: 100%; margin-bottom: 5px;">
                            📋 Экспорт в JSON
                        </button>
                        <button id="showStatsBtn" class="btn" style="width: 100%;">
                            📈 Показать статистику
                        </button>
                    </div>
                    
                    <div id="extractorStatus" style="
                        padding: 5px;
                        background: #e8e8d8;
                        border-radius: 3px;
                        font-size: 12px;
                        text-align: center;
                        margin-bottom: 10px;
                        display: none;
                    "></div>
                    
                    <div id="troopsDataDisplay" style="
                        max-height: 300px;
                        overflow-y: auto;
                        border: 1px solid #ccc;
                        padding: 5px;
                        background: white;
                        display: none;
                    "></div>
                    
                    <div id="statsDisplay" style="
                        display: none;
                        padding: 5px;
                        background: #f0f0e0;
                        border-radius: 3px;
                        margin-top: 10px;
                    "></div>
                    
                    <button id="closePanelBtn" style="
                        position: absolute;
                        top: 5px;
                        right: 5px;
                        background: none;
                        border: none;
                        color: white;
                        cursor: pointer;
                        font-size: 16px;
                    ">×</button>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', panelHTML);
            this.attachEvents();
        }

        attachEvents() {
            document.getElementById('extractBtn').addEventListener('click', () => this.extractData());
            document.getElementById('exportCSVBtn').addEventListener('click', () => this.exportToCSV());
            document.getElementById('exportJSONBtn').addEventListener('click', () => this.exportToJSON());
            document.getElementById('showStatsBtn').addEventListener('click', () => this.showStatistics());
            document.getElementById('closePanelBtn').addEventListener('click', () => {
                document.getElementById('troopsExtractorPanel').style.display = 'none';
            });
        }

        // Основная функция извлечения данных
        async extractData() {
            if (this.isProcessing) {
                this.showStatus('Уже идет обработка...', 'warning');
                return;
            }

            this.isProcessing = true;
            this.showStatus('Начинаю извлечение данных...', 'info');

            try {
                // Получаем список всех деревень
                const villages = await this.getAllVillages();
                logger.info(`Найдено ${villages.length} деревень`);

                // Обрабатываем каждую деревню
                this.data = [];
                let processedCount = 0;

                for (const village of villages) {
                    try {
                        this.showStatus(`Обработка деревни ${processedCount + 1}/${villages.length}: ${village.name}`, 'info');
                        
                        const troops = await this.getVillageTroops(village.id);
                        const villageData = {
                            id: village.id,
                            name: village.name,
                            coordinates: village.coordinates,
                            player: village.player,
                            troops: troops,
                            totalTroops: this.calculateTotal(troops),
                            timestamp: new Date().toLocaleString()
                        };

                        this.data.push(villageData);
                        processedCount++;
                        
                        // Небольшая задержка чтобы не перегружать сервер
                        await this.delay(100);
                        
                    } catch (error) {
                        logger.error(`Ошибка при обработке деревни ${village.name}:`, error);
                    }
                }

                this.showStatus(`✅ Успешно обработано ${processedCount}/${villages.length} деревень`, 'success');
                this.displayData();
                this.saveConfig();

            } catch (error) {
                logger.error('Ошибка при извлечении данных:', error);
                this.showStatus('❌ Ошибка при извлечении данных', 'error');
            } finally {
                this.isProcessing = false;
            }
        }

        // Получаем список всех деревень игрока
        async getAllVillages() {
            return new Promise((resolve, reject) => {
                const url = `/game.php?&village=${this.currentVillageId}&type=own_home&mode=units&group=0&page=-1&screen=overview_villages`;
                
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                
                xhr.onload = () => {
                    if (xhr.status === 200) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(xhr.responseText, 'text/html');
                        const villages = this.parseVillagesFromTable(doc);
                        resolve(villages);
                    } else {
                        reject(new Error(`HTTP ошибка: ${xhr.status}`));
                    }
                };
                
                xhr.onerror = () => reject(new Error('Ошибка сети'));
                xhr.send();
            });
        }

        // Парсим таблицу с деревнями
        parseVillagesFromTable(doc) {
            const villages = [];
            let table;
            
            // Ищем таблицу с войсками
            table = doc.getElementById('units_table');
            if (!table) {
                // Пробуем найти любую таблицу с данными
                const tables = doc.querySelectorAll('table.vis');
                table = Array.from(tables).find(t => t.querySelector('tr.row_a') || t.querySelector('tr.row_b'));
            }

            if (!table) {
                throw new Error('Не удалось найти таблицу с данными');
            }

            const rows = table.querySelectorAll('tr:not(:first-child)');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 3) return;

                // Первая ячейка содержит информацию о деревне
                const villageCell = cells[0];
                const link = villageCell.querySelector('a');
                const text = villageCell.textContent.trim();
                
                // Извлекаем координаты
                const coordsMatch = text.match(/(\d+)\|(\d+)/);
                if (!coordsMatch) return;

                // Извлекаем ID деревни
                let villageId = '';
                if (link) {
                    const href = link.getAttribute('href');
                    const idMatch = href.match(/id=(\d+)/) || href.match(/village=(\d+)/);
                    villageId = idMatch ? idMatch[1] : '';
                }

                // Извлекаем название
                const name = text.split('(')[0].trim();

                villages.push({
                    id: villageId,
                    name: name,
                    coordinates: `${coordsMatch[1]}|${coordsMatch[2]}`,
                    player: 'own', // Своя деревня
                    x: parseInt(coordsMatch[1]),
                    y: parseInt(coordsMatch[2])
                });
            });

            return villages;
        }

        // Получаем данные о войсках для конкретной деревни
        async getVillageTroops(villageId) {
            return new Promise((resolve, reject) => {
                // Для текущей деревни используем данные со страницы
                if (villageId === this.currentVillageId || !villageId) {
                    const troops = this.getTroopsFromCurrentPage();
                    resolve(troops);
                    return;
                }

                // Для других деревень загружаем страницу
                const url = `/game.php?&village=${this.currentVillageId}&screen=info_village&id=${villageId}`;
                
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                
                xhr.onload = () => {
                    if (xhr.status === 200) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(xhr.responseText, 'text/html');
                        const troops = this.parseTroopsFromPage(doc);
                        resolve(troops);
                    } else {
                        reject(new Error(`HTTP ошибка: ${xhr.status}`));
                    }
                };
                
                xhr.onerror = () => reject(new Error('Ошибка сети'));
                xhr.send();
            });
        }

        // Парсим войска со страницы
        parseTroopsFromPage(doc) {
            const troops = {};
            
            // Ищем таблицу с войсками
            const tables = doc.querySelectorAll('table.vis');
            let troopsTable = null;

            for (const table of tables) {
                const headers = table.querySelectorAll('th');
                for (const header of headers) {
                    if (header.textContent.includes('Копейщик') || header.textContent.includes('spear')) {
                        troopsTable = table;
                        break;
                    }
                }
                if (troopsTable) break;
            }

            if (!troopsTable) {
                logger.warn('Не найдена таблица с войсками');
                return this.createEmptyTroops();
            }

            // Парсим данные из таблицы
            const rows = troopsTable.querySelectorAll('tr');
            for (let i = 1; i < Math.min(rows.length, TROOP_NAMES.length + 1); i++) {
                const cells = rows[i].querySelectorAll('td');
                if (cells.length >= 2) {
                    const troopName = cells[0].textContent.trim();
                    const troopCount = parseInt(cells[1].textContent.replace(/[^\d]/g, '')) || 0;
                    
                    // Находим индекс юнита по имени
                    const index = TROOP_NAMES.findIndex(name => 
                        troopName.includes(name) || name.includes(troopName)
                    );
                    
                    if (index !== -1) {
                        troops[UNIT_TYPES[index]] = troopCount;
                    }
                }
            }

            // Заполняем отсутствующие юниты нулями
            return this.fillMissingTroops(troops);
        }

        // Получаем войска с текущей страницы
        getTroopsFromCurrentPage() {
            const troops = {};
            
            // Проверяем текущую страницу
            if (game_data.screen === 'info_village') {
                // На странице информации о деревне
                $('td:contains("Копейщик"), td:contains("Мечник"), td:contains("Топорник")').each(function() {
                    const troopName = $(this).text().trim();
                    const troopCount = parseInt($(this).next().text().replace(/[^\d]/g, '')) || 0;
                    
                    const index = TROOP_NAMES.findIndex(name => 
                        troopName.includes(name) || name.includes(troopName)
                    );
                    
                    if (index !== -1) {
                        troops[UNIT_TYPES[index]] = troopCount;
                    }
                });
            } else if (game_data.screen === 'overview_villages' || game_data.screen === 'place') {
                // На странице обзора или площадки
                $('td.unit-icon').each(function(index) {
                    if (index < UNIT_TYPES.length) {
                        const count = parseInt($(this).text().replace(/[^\d]/g, '')) || 0;
                        troops[UNIT_TYPES[index]] = count;
                    }
                });
            }

            return this.fillMissingTroops(troops);
        }

        // Создаем пустой объект войск
        createEmptyTroops() {
            const troops = {};
            UNIT_TYPES.forEach(type => {
                troops[type] = 0;
            });
            return troops;
        }

        // Заполняем отсутствующие типы войск
        fillMissingTroops(troops) {
            const result = this.createEmptyTroops();
            Object.assign(result, troops);
            return result;
        }

        // Рассчитываем общее количество войск
        calculateTotal(troops) {
            return Object.values(troops).reduce((sum, count) => sum + count, 0);
        }

        // Отображаем данные
        displayData() {
            const display = document.getElementById('troopsDataDisplay');
            display.style.display = 'block';
            
            let html = '<h4 style="margin: 0 0 10px 0;">Извлеченные данные:</h4>';
            
            this.data.forEach((village, index) => {
                html += `
                    <div style="
                        border: 1px solid #ddd;
                        margin-bottom: 5px;
                        padding: 5px;
                        background: ${index % 2 === 0 ? '#f9f9f9' : 'white'};
                    ">
                        <strong>${village.name}</strong> (${village.coordinates})<br>
                        Всего войск: <strong>${village.totalTroops}</strong><br>
                        <small style="color: #666;">
                            Коп: ${village.troops.spear || 0} | 
                            Меч: ${village.troops.sword || 0} | 
                            Топ: ${village.troops.axe || 0} | 
                            Лук: ${village.troops.archer || 0}
                        </small>
                    </div>
                `;
            });
            
            display.innerHTML = html;
        }

        // Показываем статистику
        showStatistics() {
            const statsDiv = document.getElementById('statsDisplay');
            statsDiv.style.display = 'block';
            
            if (this.data.length === 0) {
                statsDiv.innerHTML = '<p style="color: #666;">Нет данных для статистики</p>';
                return;
            }

            // Рассчитываем статистику
            const totalTroops = this.data.reduce((sum, village) => sum + village.totalTroops, 0);
            const avgTroops = Math.round(totalTroops / this.data.length);
            
            const troopTypes = {};
            UNIT_TYPES.forEach(type => {
                troopTypes[type] = this.data.reduce((sum, village) => sum + (village.troops[type] || 0), 0);
            });

            const strongestVillage = this.data.reduce((max, village) => 
                village.totalTroops > max.totalTroops ? village : max
            );

            const weakestVillage = this.data.reduce((min, village) => 
                village.totalTroops < min.totalTroops ? village : min
            );

            let statsHTML = `
                <h4 style="margin: 0 0 10px 0;">📊 Статистика:</h4>
                <div style="font-size: 12px;">
                    <p><strong>Всего деревень:</strong> ${this.data.length}</p>
                    <p><strong>Всего войск:</strong> ${totalTroops.toLocaleString()}</p>
                    <p><strong>Среднее на деревню:</strong> ${avgTroops.toLocaleString()}</p>
                    
                    <p><strong>Сильнейшая деревня:</strong><br>
                    ${strongestVillage.name} (${strongestVillage.coordinates})<br>
                    Всего войск: ${strongestVillage.totalTroops.toLocaleString()}</p>
                    
                    <p><strong>Слабейшая деревня:</strong><br>
                    ${weakestVillage.name} (${weakestVillage.coordinates})<br>
                    Всего войск: ${weakestVillage.totalTroops.toLocaleString()}</p>
                    
                    <p><strong>По типам войск:</strong></p>
                    <div style="max-height: 150px; overflow-y: auto;">
            `;

            UNIT_TYPES.forEach((type, index) => {
                if (index < TROOP_NAMES.length) {
                    statsHTML += `
                        <div style="display: flex; justify-content: space-between; padding: 2px 0;">
                            <span>${TROOP_NAMES[index]}:</span>
                            <span><strong>${troopTypes[type].toLocaleString()}</strong></span>
                        </div>
                    `;
                }
            });

            statsHTML += '</div></div>';
            statsDiv.innerHTML = statsHTML;
        }

        // Экспорт в CSV
        exportToCSV() {
            if (this.data.length === 0) {
                this.showStatus('Нет данных для экспорта', 'warning');
                return;
            }

            const headers = ['ID', 'Название', 'Координаты', ...TROOP_NAMES, 'Всего войск', 'Время сбора'];
            
            const csvRows = [
                headers.join(';'),
                ...this.data.map(village => {
                    const row = [
                        village.id,
                        `"${village.name}"`,
                        village.coordinates,
                        ...UNIT_TYPES.map(type => village.troops[type] || 0),
                        village.totalTroops,
                        village.timestamp
                    ];
                    return row.join(';');
                })
            ];

            const csvContent = csvRows.join('\n');
            this.downloadFile(csvContent, 'troops_data.csv', 'text/csv');
            this.showStatus('✅ Данные экспортированы в CSV', 'success');
        }

        // Экспорт в JSON
        exportToJSON() {
            if (this.data.length === 0) {
                this.showStatus('Нет данных для экспорта', 'warning');
                return;
            }

            const jsonData = {
                timestamp: new Date().toISOString(),
                player: game_data.player.name,
                world: window.location.hostname,
                totalVillages: this.data.length,
                totalTroops: this.data.reduce((sum, village) => sum + village.totalTroops, 0),
                villages: this.data
            };

            const jsonString = JSON.stringify(jsonData, null, 2);
            this.downloadFile(jsonString, 'troops_data.json', 'application/json');
            this.showStatus('✅ Данные экспортированы в JSON', 'success');
        }

        // Скачивание файла
        downloadFile(content, filename, contentType) {
            const blob = new Blob([content], { type: contentType });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        // Показ статуса
        showStatus(message, type = 'info') {
            const statusDiv = document.getElementById('extractorStatus');
            statusDiv.style.display = 'block';
            
            const colors = {
                info: '#3498db',
                success: '#2ecc71',
                warning: '#f39c12',
                error: '#e74c3c'
            };
            
            statusDiv.innerHTML = message;
            statusDiv.style.color = colors[type] || colors.info;
            statusDiv.style.border = `1px solid ${colors[type] || colors.info}`;
            
            // Автоскрытие через 5 секунд
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }

        // Задержка
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // Сохранение конфигурации
        saveConfig() {
            try {
                localStorage.setItem('troopsExtractor_data', JSON.stringify({
                    lastUpdate: new Date().toISOString(),
                    dataCount: this.data.length
                }));
            } catch (error) {
                logger.error('Ошибка сохранения конфигурации:', error);
            }
        }

        // Загрузка конфигурации
        loadConfig() {
            try {
                const saved = localStorage.getItem('troopsExtractor_data');
                if (saved) {
                    const config = JSON.parse(saved);
                    logger.info(`Последнее обновление: ${new Date(config.lastUpdate).toLocaleString()}`);
                }
            } catch (error) {
                logger.error('Ошибка загрузки конфигурации:', error);
            }
        }
    }

    // Инициализация скрипта
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (typeof game_data !== 'undefined') {
                window.troopsExtractor = new TroopsExtractor();
                logger.info('Troops Extractor загружен и готов к работе!');
            } else {
                logger.error('game_data не определена. Возможно, вы не в игре.');
            }
        }, 2000);
    });

})();
