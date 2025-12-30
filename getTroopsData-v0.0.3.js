// ==UserScript==
// @name         TW Troops Extractor Simple
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Extract troops data from Tribal Wars
// @author       Your Name
// @match        https://*.tribalwars.*/game.php*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Добавляем стили для панели
    GM_addStyle(`
        #troopsPanel {
            position: fixed;
            top: 100px;
            right: 10px;
            width: 350px;
            background: #f5f5e1;
            border: 2px solid #8B4513;
            border-radius: 5px;
            z-index: 10000;
            box-shadow: 2px 2px 10px rgba(0,0,0,0.3);
            font-family: Arial, sans-serif;
            font-size: 12px;
        }
        #troopsPanelHeader {
            background: #8B4513;
            color: white;
            padding: 8px;
            font-weight: bold;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #troopsPanelContent {
            padding: 10px;
            max-height: 500px;
            overflow-y: auto;
        }
        .troopsBtn {
            background: #8B4513;
            color: white;
            border: none;
            padding: 8px 12px;
            margin: 5px 0;
            border-radius: 3px;
            cursor: pointer;
            width: 100%;
            font-size: 12px;
        }
        .troopsBtn:hover {
            background: #A0522D;
        }
        .troopsStatus {
            padding: 5px;
            margin: 5px 0;
            border-radius: 3px;
            text-align: center;
            font-size: 11px;
        }
        .troopsStatus.info {
            background: #d9edf7;
            color: #31708f;
        }
        .troopsStatus.success {
            background: #dff0d8;
            color: #3c763d;
        }
        .troopsStatus.error {
            background: #f2dede;
            color: #a94442;
        }
        .troopsDataTable {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 11px;
        }
        .troopsDataTable th {
            background: #e8e8d8;
            padding: 4px;
            border: 1px solid #ccc;
            text-align: center;
        }
        .troopsDataTable td {
            padding: 4px;
            border: 1px solid #ccc;
            text-align: center;
        }
        .troopsDataTable tr:nth-child(even) {
            background: #f9f9f9;
        }
        .closeBtn {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            margin: 0;
        }
    `);

    class TroopsExtractor {
        constructor() {
            this.data = [];
            this.isProcessing = false;
            this.init();
        }

        init() {
            console.log('Troops Extractor initializing...');
            this.createPanel();
            this.checkCurrentPage();
        }

        createPanel() {
            const panelHTML = `
                <div id="troopsPanel">
                    <div id="troopsPanelHeader">
                        <span>TW Troops Extractor</span>
                        <button class="closeBtn" onclick="document.getElementById('troopsPanel').style.display='none'">×</button>
                    </div>
                    <div id="troopsPanelContent">
                        <button class="troopsBtn" onclick="window.troopsExtractor.extractCurrentPage()">📋 Извлечь с текущей страницы</button>
                        <button class="troopsBtn" onclick="window.troopsExtractor.extractAllVillages()">🏘️ Извлечь все деревни</button>
                        <button class="troopsBtn" onclick="window.troopsExtractor.exportData()">💾 Экспорт данных</button>
                        <button class="troopsBtn" onclick="window.troopsExtractor.showData()">👁️ Показать данные</button>
                        <button class="troopsBtn" onclick="window.troopsExtractor.clearData()">🗑️ Очистить данные</button>
                        
                        <div id="troopsStatus" class="troopsStatus"></div>
                        <div id="troopsDataDisplay" style="display:none;"></div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', panelHTML);
            
            // Делаем панель перетаскиваемой
            this.makeDraggable('troopsPanel', 'troopsPanelHeader');
            
            // Сохраняем ссылку на экземпляр
            window.troopsExtractor = this;
            
            console.log('Troops Extractor panel created');
        }

        makeDraggable(elementId, handleId) {
            const element = document.getElementById(elementId);
            const handle = document.getElementById(handleId);
            
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
            
            handle.onmousedown = dragMouseDown;
            
            function dragMouseDown(e) {
                e = e || window.event;
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
            }
            
            function elementDrag(e) {
                e = e || window.event;
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                element.style.top = (element.offsetTop - pos2) + "px";
                element.style.left = (element.offsetLeft - pos1) + "px";
            }
            
            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
            }
        }

        showStatus(message, type = 'info') {
            const statusDiv = document.getElementById('troopsStatus');
            statusDiv.className = `troopsStatus ${type}`;
            statusDiv.innerHTML = message;
            statusDiv.style.display = 'block';
            
            if (type !== 'info') {
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 5000);
            }
        }

        checkCurrentPage() {
            console.log('Current screen:', game_data?.screen);
            console.log('Current village:', game_data?.village);
        }

        // Основной метод: извлечение данных с текущей страницы
        extractCurrentPage() {
            try {
                this.showStatus('Извлечение данных...', 'info');
                
                let troopsData = {};
                let villageInfo = {};
                
                // Определяем текущую страницу
                const screen = game_data?.screen;
                
                if (screen === 'info_village') {
                    // Страница информации о деревне
                    troopsData = this.extractFromInfoVillage();
                    villageInfo = {
                        id: game_data.village.id,
                        name: $('#village_name').text().trim() || 'Unknown',
                        coordinates: `${game_data.village.x}|${game_data.village.y}`,
                        player: game_data.player.name
                    };
                } 
                else if (screen === 'overview_villages') {
                    // Страница обзора всех деревень
                    troopsData = this.extractFromOverview();
                    villageInfo = {
                        id: game_data.village.id,
                        name: game_data.village.name,
                        coordinates: `${game_data.village.x}|${game_data.village.y}`,
                        player: game_data.player.name
                    };
                }
                else if (screen === 'place') {
                    // Площадка
                    troopsData = this.extractFromPlace();
                    villageInfo = {
                        id: game_data.village.id,
                        name: game_data.village.name,
                        coordinates: `${game_data.village.x}|${game_data.village.y}`,
                        player: game_data.player.name
                    };
                }
                else {
                    // Для других страниц пробуем найти таблицу
                    troopsData = this.extractFromAnyPage();
                    villageInfo = {
                        id: game_data?.village?.id || 'unknown',
                        name: game_data?.village?.name || 'Unknown',
                        coordinates: game_data?.village ? `${game_data.village.x}|${game_data.village.y}` : 'unknown',
                        player: game_data?.player?.name || 'unknown'
                    };
                }
                
                // Сохраняем данные
                if (Object.keys(troopsData).length > 0) {
                    const villageData = {
                        ...villageInfo,
                        troops: troopsData,
                        totalTroops: this.calculateTotal(troopsData),
                        timestamp: new Date().toLocaleString(),
                        source: screen
                    };
                    
                    // Добавляем или обновляем данные
                    const existingIndex = this.data.findIndex(d => d.id === villageInfo.id);
                    if (existingIndex >= 0) {
                        this.data[existingIndex] = villageData;
                    } else {
                        this.data.push(villageData);
                    }
                    
                    this.saveToStorage();
                    this.showStatus(`✅ Данные сохранены: ${villageInfo.name} (${villageInfo.coordinates})`, 'success');
                    console.log('Extracted data:', villageData);
                } else {
                    this.showStatus('❌ Не удалось найти данные о войсках', 'error');
                }
                
            } catch (error) {
                console.error('Extraction error:', error);
                this.showStatus(`❌ Ошибка: ${error.message}`, 'error');
            }
        }

        // Метод для страницы info_village
        extractFromInfoVillage() {
            const troops = {};
            
            // Ищем таблицу с войсками
            $('td:contains("Копейщик"), td:contains("Spearman")').each(function() {
                const troopRow = $(this).closest('tr');
                const troopName = $(this).text().trim();
                const troopCount = parseInt(troopRow.find('td').eq(1).text().replace(/\D/g, '')) || 0;
                
                if (troopName.includes('Копейщик') || troopName.includes('Spearman')) troops.spear = troopCount;
                else if (troopName.includes('Мечник') || troopName.includes('Sword')) troops.sword = troopCount;
                else if (troopName.includes('Топорник') || troopName.includes('Axe')) troops.axe = troopCount;
                else if (troopName.includes('Лучник') || troopName.includes('Archer')) troops.archer = troopCount;
                else if (troopName.includes('Развед') || troopName.includes('Spy')) troops.spy = troopCount;
                else if (troopName.includes('Лёгк') || troopName.includes('Light')) troops.light = troopCount;
                else if (troopName.includes('Конный лучник') || troopName.includes('Mounted archer')) troops.marcher = troopCount;
                else if (troopName.includes('Тяжел') || troopName.includes('Heavy')) troops.heavy = troopCount;
                else if (troopName.includes('Таран') || troopName.includes('Ram')) troops.ram = troopCount;
                else if (troopName.includes('Катапульта') || troopName.includes('Catapult')) troops.catapult = troopCount;
                else if (troopName.includes('Паладин') || troopName.includes('Paladin')) troops.knight = troopCount;
                else if (troopName.includes('Дворянин') || troopName.includes('Noble')) troops.snob = troopCount;
            });
            
            // Если не нашли через текст, пробуем через иконки
            if (Object.keys(troops).length === 0) {
                $('img[src*="unit_"]').each(function() {
                    const src = $(this).attr('src');
                    const unitType = src.match(/unit_(\w+)\./);
                    if (unitType) {
                        const count = parseInt($(this).closest('td').next().text().replace(/\D/g, '')) || 0;
                        troops[unitType[1]] = count;
                    }
                });
            }
            
            return troops;
        }

        // Метод для страницы overview_villages
        extractFromOverview() {
            const troops = {};
            
            // Ищем текущую деревню в таблице
            $('tr.row_a, tr.row_b').each(function() {
                const villageCell = $(this).find('td').first();
                if (villageCell.text().includes(game_data.village.name)) {
                    // Извлекаем войска из ячеек
                    $(this).find('td').slice(1, 13).each(function(index) {
                        const count = parseInt($(this).text().replace(/\D/g, '')) || 0;
                        const unitTypes = ['spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult', 'knight', 'snob'];
                        if (unitTypes[index]) {
                            troops[unitTypes[index]] = count;
                        }
                    });
                    return false; // Выход из цикла
                }
            });
            
            return troops;
        }

        // Метод для площадки
        extractFromPlace() {
            const troops = {};
            
            // Ищем войска на панели отправки
            $('#units_home td.unit-icon').each(function(index) {
                const count = parseInt($(this).text().replace(/\D/g, '')) || 0;
                const unitTypes = ['spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult', 'knight', 'snob'];
                if (unitTypes[index]) {
                    troops[unitTypes[index]] = count;
                }
            });
            
            return troops;
        }

        // Универсальный метод поиска
        extractFromAnyPage() {
            const troops = {};
            
            // Пробуем найти таблицу с юнитами
            $('table.vis').each(function() {
                const table = $(this);
                const hasUnits = table.find('img[src*="unit_"]').length > 0;
                
                if (hasUnits) {
                    table.find('img[src*="unit_"]').each(function() {
                        const src = $(this).attr('src');
                        const unitType = src.match(/unit_(\w+)\./);
                        if (unitType) {
                            // Ищем число рядом с иконкой
                            let count = 0;
                            const parent = $(this).closest('td');
                            const text = parent.text();
                            const match = text.match(/\d+/);
                            if (match) count = parseInt(match[0]);
                            
                            troops[unitType[1]] = count;
                        }
                    });
                }
            });
            
            return troops;
        }

        // Извлечение данных со всех деревень
        async extractAllVillages() {
            if (this.isProcessing) {
                this.showStatus('Уже идет обработка...', 'error');
                return;
            }
            
            this.isProcessing = true;
            this.showStatus('Начинаю сбор данных со всех деревень...', 'info');
            
            try {
                // Получаем ссылку на страницу со всеми деревнями
                const currentVillageId = game_data.village.id;
                const url = `/game.php?&village=${currentVillageId}&type=own_home&mode=units&group=0&page=-1&screen=overview_villages`;
                
                const response = await fetch(url);
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Ищем таблицу с деревнями
                const table = doc.querySelector('#units_table') || 
                              doc.querySelector('table.vis:has(tr.row_a)') ||
                              doc.querySelector('table:has(tr:has(td:first-child a))');
                
                if (!table) {
                    throw new Error('Не удалось найти таблицу с деревнями');
                }
                
                const rows = table.querySelectorAll('tr:has(td)');
                const villages = [];
                
                // Парсим данные из таблицы
                rows.forEach((row, index) => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length < 3) return;
                    
                    // Первая ячейка содержит информацию о деревне
                    const villageCell = cells[0];
                    const link = villageCell.querySelector('a');
                    const text = villageCell.textContent.trim();
                    
                    // Извлекаем координаты
                    const coordsMatch = text.match(/(\d+)\|(\d+)/);
                    if (!coordsMatch) return;
                    
                    // Извлекаем название (всё до скобки с координатами)
                    const name = text.split('(')[0].trim();
                    
                    // Извлекаем ID из ссылки
                    let villageId = '';
                    if (link) {
                        const href = link.getAttribute('href');
                        const idMatch = href.match(/id=(\d+)/) || href.match(/village=(\d+)/);
                        villageId = idMatch ? idMatch[1] : `village_${index}`;
                    }
                    
                    // Извлекаем войска
                    const troops = {};
                    const unitTypes = ['spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult', 'knight', 'snob'];
                    
                    for (let i = 0; i < Math.min(unitTypes.length, cells.length - 1); i++) {
                        const count = parseInt(cells[i + 1].textContent.replace(/\D/g, '')) || 0;
                        troops[unitTypes[i]] = count;
                    }
                    
                    villages.push({
                        id: villageId,
                        name: name,
                        coordinates: `${coordsMatch[1]}|${coordsMatch[2]}`,
                        player: game_data.player.name,
                        troops: troops,
                        totalTroops: this.calculateTotal(troops),
                        timestamp: new Date().toLocaleString(),
                        source: 'overview_villages'
                    });
                });
                
                // Сохраняем все данные
                this.data = villages;
                this.saveToStorage();
                this.showStatus(`✅ Собраны данные ${villages.length} деревень`, 'success');
                console.log('Collected villages:', villages);
                
            } catch (error) {
                console.error('Error extracting all villages:', error);
                this.showStatus(`❌ Ошибка: ${error.message}`, 'error');
            } finally {
                this.isProcessing = false;
            }
        }

        calculateTotal(troops) {
            return Object.values(troops).reduce((sum, count) => sum + count, 0);
        }

        saveToStorage() {
            try {
                GM_setValue('troopsData', JSON.stringify(this.data));
                console.log('Data saved to storage');
            } catch (error) {
                console.error('Error saving to storage:', error);
            }
        }

        loadFromStorage() {
            try {
                const saved = GM_getValue('troopsData', '[]');
                this.data = JSON.parse(saved);
                console.log('Data loaded from storage:', this.data.length, 'villages');
            } catch (error) {
                console.error('Error loading from storage:', error);
                this.data = [];
            }
        }

        showData() {
            this.loadFromStorage();
            
            if (this.data.length === 0) {
                this.showStatus('Нет сохраненных данных', 'info');
                return;
            }
            
            const display = document.getElementById('troopsDataDisplay');
            display.style.display = 'block';
            
            let html = '<h4>Сохраненные данные:</h4>';
            html += `<p>Всего деревень: <strong>${this.data.length}</strong></p>`;
            
            // Создаем таблицу
            html += '<table class="troopsDataTable">';
            html += '<thead><tr><th>Деревня</th><th>Коорд.</th><th>Коп.</th><th>Меч.</th><th>Топ.</th><th>Лук.</th><th>Всего</th></tr></thead><tbody>';
            
            this.data.forEach(village => {
                html += `
                    <tr>
                        <td>${village.name}</td>
                        <td>${village.coordinates}</td>
                        <td>${village.troops.spear || 0}</td>
                        <td>${village.troops.sword || 0}</td>
                        <td>${village.troops.axe || 0}</td>
                        <td>${village.troops.archer || 0}</td>
                        <td><strong>${village.totalTroops}</strong></td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            
            // Общая статистика
            const totalTroops = this.data.reduce((sum, v) => sum + v.totalTroops, 0);
            const avgTroops = Math.round(totalTroops / this.data.length);
            
            html += `<p><strong>Общая статистика:</strong></p>`;
            html += `<p>Всего войск: ${totalTroops.toLocaleString()}</p>`;
            html += `<p>Среднее на деревню: ${avgTroops.toLocaleString()}</p>`;
            
            display.innerHTML = html;
        }

        exportData() {
            this.loadFromStorage();
            
            if (this.data.length === 0) {
                this.showStatus('Нет данных для экспорта', 'error');
                return;
            }
            
            // Создаем CSV
            const headers = ['ID', 'Название', 'Координаты', 'Копейщики', 'Мечники', 'Топорники', 'Лучники', 
                           'Разведка', 'ЛК', 'Кон.луки', 'ТК', 'Таран', 'Катапульта', 'Паладин', 'Дворянин', 'Всего', 'Время'];
            
            const csvRows = [
                headers.join(','),
                ...this.data.map(village => [
                    village.id,
                    `"${village.name}"`,
                    village.coordinates,
                    village.troops.spear || 0,
                    village.troops.sword || 0,
                    village.troops.axe || 0,
                    village.troops.archer || 0,
                    village.troops.spy || 0,
                    village.troops.light || 0,
                    village.troops.marcher || 0,
                    village.troops.heavy || 0,
                    village.troops.ram || 0,
                    village.troops.catapult || 0,
                    village.troops.knight || 0,
                    village.troops.snob || 0,
                    village.totalTroops,
                    village.timestamp
                ].join(','))
            ];
            
            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `troops_data_${new Date().toISOString().slice(0,10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showStatus(`✅ Данные экспортированы (${this.data.length} деревень)`, 'success');
        }

        clearData() {
            if (confirm('Удалить все сохраненные данные?')) {
                this.data = [];
                GM_setValue('troopsData', '[]');
                this.showStatus('Данные очищены', 'success');
                document.getElementById('troopsDataDisplay').innerHTML = '';
            }
        }
    }

    // Запускаем скрипт после полной загрузки страницы
    window.addEventListener('load', function() {
        // Ждем немного чтобы игра загрузилась
        setTimeout(function() {
            if (typeof game_data !== 'undefined') {
                console.log('TW Troops Extractor loading...');
                new TroopsExtractor();
            } else {
                console.error('game_data не найден. Возможно, страница не загружена или не является игрой Tribal Wars.');
                
                // Пробуем создать панель даже без game_data
                try {
                    new TroopsExtractor();
                } catch (e) {
                    console.error('Не удалось инициализировать скрипт:', e);
                }
            }
        }, 3000); // Увеличиваем задержку до 3 секунд
    });

})();
