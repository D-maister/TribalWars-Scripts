// ==UserScript==
// @name         TW Troops Extractor
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Extract troops data from Tribal Wars
// @author       You
// @match        https://*.tribalwars.*/game.php*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    // Проверяем, загрузилась ли игра
    if (typeof game_data === 'undefined') {
        console.log('Waiting for game to load...');
        setTimeout(initScript, 2000);
        return;
    }
    
    initScript();
    
    function initScript() {
        console.log('Initializing Troops Extractor...');
        
        // Создаем стили
        const style = document.createElement('style');
        style.textContent = `
            #troopsExtractorPanel {
                position: fixed;
                top: 100px;
                right: 10px;
                width: 400px;
                background: #f5f5e1;
                border: 2px solid #8B4513;
                border-radius: 5px;
                z-index: 99999;
                box-shadow: 2px 2px 10px rgba(0,0,0,0.3);
                font-family: Arial, sans-serif;
                font-size: 12px;
            }
            #troopsExtractorHeader {
                background: #8B4513;
                color: white;
                padding: 8px;
                font-weight: bold;
                cursor: move;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #troopsExtractorContent {
                padding: 10px;
                max-height: 600px;
                overflow-y: auto;
            }
            .troopsBtn {
                background: #8B4513;
                color: white;
                border: none;
                padding: 8px;
                margin: 3px 0;
                border-radius: 3px;
                cursor: pointer;
                width: 100%;
                font-size: 12px;
                text-align: left;
            }
            .troopsBtn:hover {
                background: #A0522D;
            }
            .troopsStatus {
                padding: 8px;
                margin: 5px 0;
                border-radius: 3px;
                font-size: 11px;
                display: none;
            }
            .status-info {
                background: #d9edf7;
                color: #31708f;
                border: 1px solid #bce8f1;
            }
            .status-success {
                background: #dff0d8;
                color: #3c763d;
                border: 1px solid #d6e9c6;
            }
            .status-error {
                background: #f2dede;
                color: #a94442;
                border: 1px solid #ebccd1;
            }
            .troopsTable {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
                font-size: 11px;
            }
            .troopsTable th {
                background: #e8e8d8;
                padding: 4px;
                border: 1px solid #ccc;
                text-align: center;
                position: sticky;
                top: 0;
            }
            .troopsTable td {
                padding: 4px;
                border: 1px solid #ccc;
                text-align: center;
            }
            .troopsTable tr:nth-child(even) {
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
                line-height: 1;
            }
            .section {
                margin: 10px 0;
                padding: 10px;
                background: #f0f0e0;
                border-radius: 3px;
            }
            .section-title {
                font-weight: bold;
                margin-bottom: 5px;
                color: #8B4513;
            }
        `;
        document.head.appendChild(style);
        
        // Создаем панель
        createPanel();
        
        // Сохраняем объект в window для доступа из консоли
        window.troopsExtractor = new TroopsExtractor();
    }
    
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'troopsExtractorPanel';
        panel.innerHTML = `
            <div id="troopsExtractorHeader">
                <span>TW Troops Extractor v3.0</span>
                <button class="closeBtn" onclick="this.closest('#troopsExtractorPanel').style.display='none'">×</button>
            </div>
            <div id="troopsExtractorContent">
                <div class="section">
                    <div class="section-title">Быстрые действия:</div>
                    <button class="troopsBtn" onclick="troopsExtractor.extractCurrentVillage()">
                        📍 Извлечь текущую деревню
                    </button>
                    <button class="troopsBtn" onclick="troopsExtractor.scanAllVillages()">
                        🏘️ Сканировать все деревни
                    </button>
                </div>
                
                <div class="section">
                    <div class="section-title">Данные:</div>
                    <button class="troopsBtn" onclick="troopsExtractor.showData()">
                        👁️ Показать данные (${localStorage.getItem('troopsDataCount') || 0})
                    </button>
                    <button class="troopsBtn" onclick="troopsExtractor.exportCSV()">
                        📁 Экспорт в CSV
                    </button>
                    <button class="troopsBtn" onclick="troopsExtractor.clearData()">
                        🗑️ Очистить данные
                    </button>
                </div>
                
                <div id="troopsStatus" class="troopsStatus"></div>
                <div id="troopsDataContainer" style="display:none;"></div>
            </div>
        `;
        
        document.body.appendChild(panel);
        makeDraggable(panel, panel.querySelector('#troopsExtractorHeader'));
        
        console.log('Troops Extractor panel created');
    }
    
    function makeDraggable(element, handle) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        
        handle.onmousedown = dragMouseDown;
        
        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
        
        function elementDrag(e) {
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
    
    class TroopsExtractor {
        constructor() {
            this.data = [];
            this.isProcessing = false;
            this.unitNames = {
                spear: 'Копейщик',
                sword: 'Мечник',
                axe: 'Топорник',
                archer: 'Лучник',
                spy: 'Разведка',
                light: 'Лёгкая кавалерия',
                marcher: 'Конный лучник',
                heavy: 'Тяжёлая кавалерия',
                ram: 'Таран',
                catapult: 'Катапульта',
                knight: 'Паладин',
                snob: 'Дворянин'
            };
        }
        
        showStatus(message, type = 'info') {
            const statusDiv = document.getElementById('troopsStatus');
            statusDiv.className = `troopsStatus status-${type}`;
            statusDiv.textContent = message;
            statusDiv.style.display = 'block';
            
            setTimeout(() => {
                if (statusDiv.className.includes(`status-${type}`)) {
                    statusDiv.style.display = 'none';
                }
            }, type === 'info' ? 3000 : 5000);
        }
        
        extractCurrentVillage() {
            try {
                this.showStatus('Извлечение данных...', 'info');
                
                const villageData = {
                    id: game_data.village.id,
                    name: game_data.village.name,
                    coordinates: `${game_data.village.x}|${game_data.village.y}`,
                    player: game_data.player.name,
                    screen: game_data.screen,
                    timestamp: new Date().toISOString(),
                    troops: this.getTroopsFromPage()
                };
                
                villageData.total = this.calculateTotal(villageData.troops);
                
                this.saveVillageData(villageData);
                this.showStatus(`✅ Данные сохранены: ${villageData.name}`, 'success');
                
                console.log('Extracted data:', villageData);
                
            } catch (error) {
                console.error('Extraction error:', error);
                this.showStatus(`❌ Ошибка: ${error.message}`, 'error');
            }
        }
        
        getTroopsFromPage() {
            const troops = {};
            const unitTypes = Object.keys(this.unitNames);
            
            // Метод 1: Ищем по иконкам юнитов
            document.querySelectorAll('img[src*="unit_"]').forEach(img => {
                const src = img.getAttribute('src');
                const match = src.match(/unit_(\w+)\./);
                if (match) {
                    const unitType = match[1];
                    if (unitTypes.includes(unitType)) {
                        // Ищем число рядом с иконкой
                        const parent = img.closest('td');
                        if (parent) {
                            const text = parent.textContent;
                            const numberMatch = text.match(/\d+/g);
                            if (numberMatch) {
                                troops[unitType] = parseInt(numberMatch[0]) || 0;
                            }
                        }
                    }
                }
            });
            
            // Метод 2: Ищем по таблице на странице info_village
            if (game_data.screen === 'info_village') {
                const rows = document.querySelectorAll('tr:has(td:first-child)');
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 2) {
                        const cellText = cells[0].textContent.trim().toLowerCase();
                        const countText = cells[1].textContent.trim();
                        const count = parseInt(countText.replace(/\D/g, '')) || 0;
                        
                        if (cellText.includes('копейщик') || cellText.includes('spear')) troops.spear = count;
                        else if (cellText.includes('мечник') || cellText.includes('sword')) troops.sword = count;
                        else if (cellText.includes('топорник') || cellText.includes('axe')) troops.axe = count;
                        else if (cellText.includes('лучник') || cellText.includes('archer')) troops.archer = count;
                        else if (cellText.includes('развед') || cellText.includes('spy')) troops.spy = count;
                        else if (cellText.includes('лёгк') || cellText.includes('light')) troops.light = count;
                        else if (cellText.includes('конный лучник') || cellText.includes('marcher')) troops.marcher = count;
                        else if (cellText.includes('тяжел') || cellText.includes('heavy')) troops.heavy = count;
                        else if (cellText.includes('таран') || cellText.includes('ram')) troops.ram = count;
                        else if (cellText.includes('катапульта') || cellText.includes('catapult')) troops.catapult = count;
                        else if (cellText.includes('паладин') || cellText.includes('knight')) troops.knight = count;
                        else if (cellText.includes('дворянин') || cellText.includes('snob')) troops.snob = count;
                    }
                });
            }
            
            // Метод 3: Для страницы overview_villages
            if (game_data.screen === 'overview_villages') {
                // Ищем строку с текущей деревней
                const currentVillageName = game_data.village.name;
                const rows = document.querySelectorAll('tr.row_a, tr.row_b');
                
                rows.forEach(row => {
                    const firstCell = row.querySelector('td:first-child');
                    if (firstCell && firstCell.textContent.includes(currentVillageName)) {
                        const cells = row.querySelectorAll('td');
                        unitTypes.forEach((type, index) => {
                            if (cells[index + 1]) {
                                const count = parseInt(cells[index + 1].textContent.replace(/\D/g, '')) || 0;
                                troops[type] = count;
                            }
                        });
                    }
                });
            }
            
            // Заполняем нулями отсутствующие типы
            unitTypes.forEach(type => {
                if (troops[type] === undefined) {
                    troops[type] = 0;
                }
            });
            
            return troops;
        }
        
        calculateTotal(troops) {
            return Object.values(troops).reduce((sum, count) => sum + count, 0);
        }
        
        saveVillageData(villageData) {
            const saved = JSON.parse(localStorage.getItem('twTroopsData') || '[]');
            
            // Проверяем, есть ли уже данные по этой деревне
            const existingIndex = saved.findIndex(v => v.id === villageData.id);
            
            if (existingIndex >= 0) {
                saved[existingIndex] = villageData;
            } else {
                saved.push(villageData);
            }
            
            localStorage.setItem('twTroopsData', JSON.stringify(saved));
            localStorage.setItem('troopsDataCount', saved.length);
            
            this.data = saved;
        }
        
        loadData() {
            this.data = JSON.parse(localStorage.getItem('twTroopsData') || '[]');
            return this.data;
        }
        
        showData() {
            const data = this.loadData();
            const container = document.getElementById('troopsDataContainer');
            
            if (data.length === 0) {
                container.innerHTML = '<p style="color: #666; text-align: center;">Нет сохраненных данных</p>';
                container.style.display = 'block';
                return;
            }
            
            let html = `
                <div class="section">
                    <div class="section-title">Сохраненные данные (${data.length} деревень):</div>
                    <table class="troopsTable">
                        <thead>
                            <tr>
                                <th>Деревня</th>
                                <th>Коорд.</th>
                                <th>Коп.</th>
                                <th>Меч.</th>
                                <th>Топ.</th>
                                <th>Всего</th>
                                <th>Время</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            data.forEach(village => {
                html += `
                    <tr>
                        <td title="${village.name}">${village.name.substring(0, 15)}${village.name.length > 15 ? '...' : ''}</td>
                        <td>${village.coordinates}</td>
                        <td>${village.troops.spear || 0}</td>
                        <td>${village.troops.sword || 0}</td>
                        <td>${village.troops.axe || 0}</td>
                        <td><strong>${village.total || this.calculateTotal(village.troops)}</strong></td>
                        <td>${new Date(village.timestamp).toLocaleTimeString()}</td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
                
                <div class="section">
                    <div class="section-title">Статистика:</div>
            `;
            
            // Рассчитываем статистику
            const totalTroops = data.reduce((sum, v) => sum + (v.total || this.calculateTotal(v.troops)), 0);
            const avgTroops = Math.round(totalTroops / data.length);
            
            const troopTotals = {};
            Object.keys(this.unitNames).forEach(type => {
                troopTotals[type] = data.reduce((sum, v) => sum + (v.troops[type] || 0), 0);
            });
            
            html += `
                <p><strong>Всего войск:</strong> ${totalTroops.toLocaleString()}</p>
                <p><strong>Среднее на деревню:</strong> ${avgTroops.toLocaleString()}</p>
                <p><strong>Распределение:</strong></p>
                <div style="font-size: 11px;">
            `;
            
            Object.keys(this.unitNames).forEach(type => {
                if (troopTotals[type] > 0) {
                    html += `<div>${this.unitNames[type]}: ${troopTotals[type].toLocaleString()}</div>`;
                }
            });
            
            html += `</div></div>`;
            
            container.innerHTML = html;
            container.style.display = 'block';
        }
        
        async scanAllVillages() {
            if (this.isProcessing) {
                this.showStatus('Уже идет сканирование...', 'error');
                return;
            }
            
            this.isProcessing = true;
            this.showStatus('Начинаю сканирование всех деревень...', 'info');
            
            try {
                // Получаем данные со страницы overview
                const url = `/game.php?village=${game_data.village.id}&screen=overview_villages&mode=units&type=own_home&group=0`;
                
                const response = await fetch(url);
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Ищем таблицу с деревнями
                let table = doc.getElementById('units_table');
                if (!table) {
                    table = doc.querySelector('table.vis:has(tr.row_a)');
                }
                
                if (!table) {
                    throw new Error('Не удалось найти таблицу с деревнями');
                }
                
                const rows = table.querySelectorAll('tr:has(td)');
                const villages = [];
                
                for (const row of rows) {
                    const cells = row.querySelectorAll('td');
                    if (cells.length < 3) continue;
                    
                    // Первая ячейка - информация о деревне
                    const villageCell = cells[0];
                    const text = villageCell.textContent.trim();
                    
                    // Извлекаем координаты
                    const coordsMatch = text.match(/(\d+)\|(\d+)/);
                    if (!coordsMatch) continue;
                    
                    // Извлекаем название
                    const name = text.split('(')[0].trim();
                    
                    // Извлекаем ID
                    let villageId = '';
                    const link = villageCell.querySelector('a');
                    if (link) {
                        const href = link.getAttribute('href');
                        const idMatch = href.match(/[?&](?:id|village)=(\d+)/);
                        villageId = idMatch ? idMatch[1] : `v${Date.now()}`;
                    }
                    
                    // Извлекаем войска
                    const troops = {};
                    const unitTypes = Object.keys(this.unitNames);
                    
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
                        total: this.calculateTotal(troops),
                        timestamp: new Date().toISOString(),
                        source: 'overview_scan'
                    });
                    
                    // Обновляем статус каждые 5 деревень
                    if (villages.length % 5 === 0) {
                        this.showStatus(`Обработано ${villages.length} деревень...`, 'info');
                    }
                }
                
                // Сохраняем все деревни
                const existingData = JSON.parse(localStorage.getItem('twTroopsData') || '[]');
                const mergedData = [...existingData];
                
                villages.forEach(newVillage => {
                    const existingIndex = mergedData.findIndex(v => v.id === newVillage.id);
                    if (existingIndex >= 0) {
                        mergedData[existingIndex] = newVillage;
                    } else {
                        mergedData.push(newVillage);
                    }
                });
                
                localStorage.setItem('twTroopsData', JSON.stringify(mergedData));
                localStorage.setItem('troopsDataCount', mergedData.length);
                this.data = mergedData;
                
                this.showStatus(`✅ Сканирование завершено! Обработано ${villages.length} деревень`, 'success');
                
            } catch (error) {
                console.error('Scan error:', error);
                this.showStatus(`❌ Ошибка сканирования: ${error.message}`, 'error');
            } finally {
                this.isProcessing = false;
            }
        }
        
        exportCSV() {
            const data = this.loadData();
            
            if (data.length === 0) {
                this.showStatus('Нет данных для экспорта', 'error');
                return;
            }
            
            // Создаем заголовки
            const headers = ['ID', 'Название', 'Координаты', 'Игрок', 'Время'];
            Object.values(this.unitNames).forEach(name => {
                headers.push(name);
            });
            headers.push('Всего войск');
            
            // Создаем строки CSV
            const csvRows = [headers.join(',')];
            
            data.forEach(village => {
                const row = [
                    village.id,
                    `"${village.name}"`,
                    village.coordinates,
                    `"${village.player}"`,
                    village.timestamp
                ];
                
                Object.keys(this.unitNames).forEach(type => {
                    row.push(village.troops[type] || 0);
                });
                
                row.push(village.total || this.calculateTotal(village.troops));
                csvRows.push(row.join(','));
            });
            
            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `troops_${new Date().toISOString().slice(0,10)}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showStatus(`✅ Экспортировано ${data.length} деревень`, 'success');
        }
        
        clearData() {
            if (confirm('Удалить все сохраненные данные о войсках?')) {
                localStorage.removeItem('twTroopsData');
                localStorage.removeItem('troopsDataCount');
                this.data = [];
                document.getElementById('troopsDataContainer').innerHTML = '';
                this.showStatus('Данные очищены', 'success');
            }
        }
    }
})();
