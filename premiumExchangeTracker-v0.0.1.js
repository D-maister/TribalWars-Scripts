  class ExchangeTracker {
      constructor() {
          this.storageKey = 'tw_exchange_data';
          this.settingsKey = 'tw_exchange_settings';
          this.updateInterval = 10000; // 10 seconds default
          this.collectionInterval = null;
          this.isStatOpen = false;
          this.data = [];
          this.resourceTypes = ['wood', 'stone', 'iron'];
          this.resourceNames = {
              'wood': 'Дерево',
              'stone': 'Глина',
              'iron': 'Железо'
          };
          
          this.init();
      }

      init() {
          this.loadSettings();
          this.addStyles();
          this.addStatButton();
          this.startCollection();
          this.bindEvents();
      }

      loadSettings() {
          const settings = JSON.parse(localStorage.getItem(this.settingsKey) || '{}');
          this.updateInterval = settings.updateInterval || 10000;
      }

      saveSettings() {
          const settings = {
              updateInterval: this.updateInterval
          };
          localStorage.setItem(this.settingsKey, JSON.stringify(settings));
      }

      addStyles() {
          const style = document.createElement('style');
          style.textContent = `
              .tw-exchange-stat-btn {
                  background: linear-gradient(to bottom, #4CAF50, #45a049);
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  margin-right: 10px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-weight: bold;
                  transition: all 0.3s;
              }
              
              .tw-exchange-stat-btn:hover {
                  background: linear-gradient(to bottom, #45a049, #3d8b40);
                  transform: translateY(-1px);
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              
              .tw-exchange-stat-container {
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  background: white;
                  border: 2px solid #4CAF50;
                  border-radius: 8px;
                  padding: 20px;
                  z-index: 10000;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                  max-width: 90vw;
                  max-height: 80vh;
                  overflow: auto;
              }
              
              .tw-exchange-stat-overlay {
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  background: rgba(0,0,0,0.7);
                  z-index: 9999;
              }
              
              .tw-exchange-stat-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 15px;
                  font-size: 12px;
              }
              
              .tw-exchange-stat-table th,
              .tw-exchange-stat-table td {
                  border: 1px solid #ddd;
                  padding: 6px;
                  text-align: center;
              }
              
              .tw-exchange-stat-table th {
                  background-color: #4CAF50;
                  color: white;
                  font-weight: bold;
              }
              
              .tw-exchange-stat-table tr:nth-child(even) {
                  background-color: #f9f9f9;
              }
              
              .tw-exchange-stat-table tr:hover {
                  background-color: #f5f5f5;
              }
              
              .tw-exchange-stat-header {
                  background-color: #2E7D32;
                  color: white;
              }
              
              .tw-exchange-stat-resource-header {
                  background-color: #388E3C;
                  color: white;
              }
              
              .tw-exchange-stat-controls {
                  display: flex;
                  align-items: center;
                  gap: 15px;
                  margin-bottom: 15px;
                  padding: 10px;
                  background-color: #f5f5f5;
                  border-radius: 4px;
              }
              
              .tw-exchange-stat-controls label {
                  font-weight: bold;
                  color: #333;
              }
              
              .tw-exchange-stat-controls input {
                  width: 80px;
                  padding: 4px 8px;
                  border: 1px solid #ddd;
                  border-radius: 4px;
              }
              
              .tw-exchange-stat-controls button {
                  background: linear-gradient(to bottom, #f44336, #d32f2f);
                  color: white;
                  border: none;
                  padding: 6px 12px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-weight: bold;
              }
              
              .tw-exchange-stat-controls button:hover {
                  background: linear-gradient(to bottom, #d32f2f, #b71c1c);
              }
              
              .tw-exchange-stat-close {
                  position: absolute;
                  top: 10px;
                  right: 10px;
                  background: #f44336;
                  color: white;
                  border: none;
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  cursor: pointer;
                  font-weight: bold;
              }
              
              .tw-exchange-stat-close:hover {
                  background: #d32f2f;
              }
              
              .tw-exchange-stat-timestamp {
                  white-space: nowrap;
              }
              
              .tw-exchange-stat-amount {
                  color: #2196F3;
                  font-weight: bold;
              }
              
              .tw-exchange-stat-capacity {
                  color: #4CAF50;
                  font-weight: bold;
              }
              
              .tw-exchange-stat-cost {
                  color: #FF9800;
                  font-weight: bold;
              }
              
              .tw-exchange-stat-wood {
                  border-left: 3px solid #8B4513;
              }
              
              .tw-exchange-stat-stone {
                  border-left: 3px solid #708090;
              }
              
              .tw-exchange-stat-iron {
                  border-left: 3px solid #C0C0C0;
              }
          `;
          document.head.appendChild(style);
      }

      addStatButton() {
          const submitBtn = document.querySelector('input[type="submit"].btn-premium-exchange-buy');
          if (submitBtn && submitBtn.parentNode) {
              const statBtn = document.createElement('button');
              statBtn.type = 'button';
              statBtn.className = 'tw-exchange-stat-btn';
              statBtn.textContent = 'STAT';
              statBtn.addEventListener('click', () => this.toggleStatWindow());
              
              submitBtn.parentNode.insertBefore(statBtn, submitBtn);
          }
      }

      getExchangeData() {
          const data = {
              timestamp: new Date().toLocaleTimeString(),
              date: new Date().toISOString(),
              resources: {}
          };

          this.resourceTypes.forEach(resource => {
              const amountElem = document.getElementById(`premium_exchange_stock_${resource}`);
              const capacityElem = document.getElementById(`premium_exchange_capacity_${resource}`);
              const rateElem = document.getElementById(`premium_exchange_rate_${resource}`);
              
              let cost = 0;
              if (rateElem) {
                  const costText = rateElem.querySelector('.premium-exchange-sep:first-child');
                  if (costText) {
                      const match = costText.textContent.match(/\d+/);
                      cost = match ? parseInt(match[0]) : 0;
                  }
              }

              data.resources[resource] = {
                  amount: amountElem ? parseInt(amountElem.textContent.replace(/\s/g, '')) || 0 : 0,
                  capacity: capacityElem ? parseInt(capacityElem.textContent.replace(/\s/g, '')) || 0 : 0,
                  cost: cost
              };
          });

          return data;
      }

      saveData() {
          const currentData = this.getExchangeData();
          this.data.unshift(currentData); // Add to beginning for newest first
          
          // Keep only last 1000 records to prevent excessive storage
          if (this.data.length > 1000) {
              this.data = this.data.slice(0, 1000);
          }
          
          localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      }

      loadData() {
          const saved = localStorage.getItem(this.storageKey);
          this.data = saved ? JSON.parse(saved) : [];
      }

      startCollection() {
          this.loadData();
          
          if (this.collectionInterval) {
              clearInterval(this.collectionInterval);
          }
          
          this.collectionInterval = setInterval(() => {
              this.saveData();
          }, this.updateInterval);
          
          // Save initial data
          this.saveData();
      }

      updateCollectionInterval(newInterval) {
          this.updateInterval = newInterval * 1000; // Convert to milliseconds
          this.saveSettings();
          this.startCollection();
      }

      createStatWindow() {
          const overlay = document.createElement('div');
          overlay.className = 'tw-exchange-stat-overlay';
          overlay.addEventListener('click', () => this.closeStatWindow());
          
          const container = document.createElement('div');
          container.className = 'tw-exchange-stat-container';
          container.addEventListener('click', (e) => e.stopPropagation());
          
          // Close button
          const closeBtn = document.createElement('button');
          closeBtn.className = 'tw-exchange-stat-close';
          closeBtn.textContent = '×';
          closeBtn.addEventListener('click', () => this.closeStatWindow());
          
          // Title
          const title = document.createElement('h2');
          title.textContent = 'Premium Exchange Statistics';
          title.style.marginTop = '0';
          title.style.color = '#2E7D32';
          
          // Controls
          const controls = document.createElement('div');
          controls.className = 'tw-exchange-stat-controls';
          
          const updateLabel = document.createElement('label');
          updateLabel.textContent = 'Update interval (seconds):';
          
          const updateInput = document.createElement('input');
          updateInput.type = 'number';
          updateInput.min = '1';
          updateInput.value = this.updateInterval / 1000;
          updateInput.addEventListener('change', (e) => {
              const value = parseInt(e.target.value);
              if (value >= 1) {
                  this.updateCollectionInterval(value);
              }
          });
          
          const clearBtn = document.createElement('button');
          clearBtn.textContent = 'Clear Data';
          clearBtn.addEventListener('click', () => {
              if (confirm('Are you sure you want to clear all saved data?')) {
                  localStorage.removeItem(this.storageKey);
                  this.data = [];
                  this.updateStatTable();
              }
          });
          
          controls.appendChild(updateLabel);
          controls.appendChild(updateInput);
          controls.appendChild(clearBtn);
          
          // Table container
          const tableContainer = document.createElement('div');
          tableContainer.style.overflowX = 'auto';
          
          // Create table
          const table = this.createStatTable();
          tableContainer.appendChild(table);
          
          // Assemble container
          container.appendChild(closeBtn);
          container.appendChild(title);
          container.appendChild(controls);
          container.appendChild(tableContainer);
          
          // Assemble overlay
          overlay.appendChild(container);
          
          return overlay;
      }

      createStatTable() {
          const table = document.createElement('table');
          table.className = 'tw-exchange-stat-table';
          
          // Create two-level header
          const thead = document.createElement('thead');
          
          // First header row
          const headerRow1 = document.createElement('tr');
          headerRow1.className = 'tw-exchange-stat-header';
          
          const timeHeader = document.createElement('th');
          timeHeader.textContent = 'Time';
          timeHeader.rowSpan = 2;
          headerRow1.appendChild(timeHeader);
          
          this.resourceTypes.forEach(resource => {
              const resourceHeader = document.createElement('th');
              resourceHeader.textContent = this.resourceNames[resource];
              resourceHeader.colSpan = 3;
              resourceHeader.className = `tw-exchange-stat-resource-header tw-exchange-stat-${resource}`;
              headerRow1.appendChild(resourceHeader);
          });
          
          thead.appendChild(headerRow1);
          
          // Second header row
          const headerRow2 = document.createElement('tr');
          headerRow2.className = 'tw-exchange-stat-resource-header';
          
          this.resourceTypes.forEach(resource => {
              const subHeaders = ['Amount', 'Capacity', 'Cost'];
              subHeaders.forEach(subHeader => {
                  const subHeaderCell = document.createElement('th');
                  subHeaderCell.textContent = subHeader;
                  subHeaderCell.className = `tw-exchange-stat-${resource}`;
                  headerRow2.appendChild(subHeaderCell);
              });
          });
          
          thead.appendChild(headerRow2);
          table.appendChild(thead);
          
          // Table body
          const tbody = document.createElement('tbody');
          this.updateTableBody(tbody);
          table.appendChild(tbody);
          
          return table;
      }

      updateTableBody(tbody) {
          tbody.innerHTML = '';
          
          this.data.forEach(record => {
              const row = document.createElement('tr');
              
              // Time cell
              const timeCell = document.createElement('td');
              timeCell.className = 'tw-exchange-stat-timestamp';
              timeCell.textContent = record.timestamp;
              row.appendChild(timeCell);
              
              // Resource cells
              this.resourceTypes.forEach(resource => {
                  const resData = record.resources[resource];
                  
                  // Amount cell
                  const amountCell = document.createElement('td');
                  amountCell.className = 'tw-exchange-stat-amount';
                  amountCell.textContent = resData.amount.toLocaleString();
                  row.appendChild(amountCell);
                  
                  // Capacity cell
                  const capacityCell = document.createElement('td');
                  capacityCell.className = 'tw-exchange-stat-capacity';
                  capacityCell.textContent = resData.capacity.toLocaleString();
                  
                  // Add percentage indicator if capacity > 0
                  if (resData.capacity > 0) {
                      const percentage = Math.round((resData.amount / resData.capacity) * 100);
                      capacityCell.title = `${percentage}% full`;
                      
                      // Color coding based on fill percentage
                      if (percentage >= 90) capacityCell.style.backgroundColor = '#FFEBEE';
                      else if (percentage >= 75) capacityCell.style.backgroundColor = '#FFF3E0';
                  }
                  
                  row.appendChild(capacityCell);
                  
                  // Cost cell
                  const costCell = document.createElement('td');
                  costCell.className = 'tw-exchange-stat-cost';
                  costCell.textContent = resData.cost;
                  row.appendChild(costCell);
              });
              
              tbody.appendChild(row);
          });
          
          // Add empty state if no data
          if (this.data.length === 0) {
              const emptyRow = document.createElement('tr');
              const emptyCell = document.createElement('td');
              emptyCell.colSpan = 10;
              emptyCell.textContent = 'No data collected yet. Data is saved every ' + (this.updateInterval / 1000) + ' seconds.';
              emptyCell.style.textAlign = 'center';
              emptyCell.style.padding = '20px';
              emptyCell.style.color = '#999';
              emptyRow.appendChild(emptyCell);
              tbody.appendChild(emptyRow);
          }
      }

      updateStatTable() {
          const existingTable = document.querySelector('.tw-exchange-stat-table');
          if (existingTable) {
              const tbody = existingTable.querySelector('tbody');
              if (tbody) {
                  this.updateTableBody(tbody);
              }
          }
      }

      toggleStatWindow() {
          if (this.isStatOpen) {
              this.closeStatWindow();
          } else {
              this.openStatWindow();
          }
      }

      openStatWindow() {
          if (this.isStatOpen) return;
          
          this.loadData();
          const statWindow = this.createStatWindow();
          document.body.appendChild(statWindow);
          this.isStatOpen = true;
          
          // Auto-refresh table when window is open
          this.statRefreshInterval = setInterval(() => {
              this.updateStatTable();
          }, 2000);
      }

      closeStatWindow() {
          const overlay = document.querySelector('.tw-exchange-stat-overlay');
          if (overlay) {
              overlay.remove();
          }
          this.isStatOpen = false;
          
          if (this.statRefreshInterval) {
              clearInterval(this.statRefreshInterval);
              this.statRefreshInterval = null;
          }
      }

      bindEvents() {
          // Save data when page is about to be unloaded
          window.addEventListener('beforeunload', () => {
              this.saveData();
          });
          
          // Listen for manual form submissions to save data
          const form = document.getElementById('premium_exchange_form');
          if (form) {
              form.addEventListener('submit', () => {
                  setTimeout(() => {
                      this.saveData();
                      if (this.isStatOpen) {
                          this.updateStatTable();
                      }
                  }, 1000);
              });
          }
      }
  }

  // Initialize the tracker when the page loads
  window.addEventListener('load', () => {
      // Small delay to ensure DOM is fully loaded
      setTimeout(() => {
          new ExchangeTracker();
      }, 1000);
  });
