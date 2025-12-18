// ==UserScript==
// @name         Tribal Wars Village Renamer
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Rename villages by replacing coordinates with custom names
// @author       Your Name
// @match        *://*.tribalwars.*/*
// @match        *://*.voynaplemyon.com/*
// @grant        none
// ==/UserScript==

// Configuration
const STORAGE_KEY = 'tw_village_renames';

// Initialize storage if needed
if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
}

// Main class
class VillageRenamer {
    constructor() {
        this.currentServer = this.getCurrentServer();
        this.renames = this.loadRenames();
        this.currentVillage = null;
        this.renameInProgress = false;
        this.init();
    }

    // Get current server from URL
    getCurrentServer() {
        const hostname = window.location.hostname;
        
        // Extract server name
        const serverMatch = hostname.match(/^([a-z]+\d+)\./);
        if (serverMatch) {
            return serverMatch[1];
        }
        
        // Fallback: use the subdomain
        const parts = hostname.split('.');
        if (parts.length > 2) {
            return parts[0];
        }
        
        return 'default';
    }

    loadRenames() {
        try {
            const allRenames = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            return allRenames[this.currentServer] || {};
        } catch (e) {
            console.error('Error loading renames:', e);
            return {};
        }
    }

    saveRenames() {
        try {
            const allRenames = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            allRenames[this.currentServer] = this.renames;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allRenames));
        } catch (e) {
            console.error('Error saving renames:', e);
        }
    }

    // Get current village info
    getCurrentVillage() {
        const villageLink = document.querySelector('#menu_row2_village a');
        if (!villageLink) return null;

        const villageName = villageLink.textContent.trim();
        const coords = this.extractCoordinatesFromHeader();
        
        if (!coords) {
            console.warn('Could not extract coordinates for village');
            return null;
        }
        
        return {
            name: villageName,
            coords: coords,
            key: coords
        };
    }

    extractCoordinatesFromHeader() {
        // Look for coordinates in the menu_row2 element
        const menuRow2 = document.querySelector('#menu_row2');
        if (!menuRow2) return null;
        
        // Find the td containing coordinates - it's after menu_row2_village
        const villageCell = menuRow2.querySelector('#menu_row2_village');
        if (!villageCell) return null;
        
        // Get the next sibling that contains coordinates
        let nextSibling = villageCell.nextElementSibling;
        while (nextSibling) {
            const text = nextSibling.textContent || '';
            const coords = this.extractCoordsFromText(text);
            if (coords) {
                return coords;
            }
            nextSibling = nextSibling.nextElementSibling;
        }
        
        return null;
    }

    // Extract coordinates from text (supports both formats)
    extractCoordsFromText(text) {
        // Try format with parentheses: (xxx|yyy)
        let match = text.match(/\((\d+)\|(\d+)\)/);
        if (match) {
            return `${match[1]}|${match[2]}`;
        }
        
        // Try format without parentheses: xxx|yyy
        match = text.match(/(\d+)\|(\d+)/);
        if (match) {
            return `${match[1]}|${match[2]}`;
        }
        
        return null;
    }

    // Initialize the script
    init() {
        console.log(`Village Renamer initialized for server: ${this.currentServer}`);
        
        // Wait for page to load
        setTimeout(() => {
            this.currentVillage = this.getCurrentVillage();
            if (this.currentVillage) {
                this.addRenameButton();
            }
            
            // Replace coordinates with fake names
            this.replaceAllCoordinatesOnPage();
            
            // Set up mutation observer
            this.setupMutationObserver();
            
            // Handle page changes
            window.addEventListener('hashchange', () => {
                setTimeout(() => this.handlePageChange(), 100);
            });
        }, 1000);
    }

    // Handle page changes
    handlePageChange() {
        const currentServer = this.getCurrentServer();
        if (currentServer !== this.currentServer) {
            this.currentServer = currentServer;
            this.renames = this.loadRenames();
        }
        
        const newVillage = this.getCurrentVillage();
        if (newVillage && (!this.currentVillage || newVillage.coords !== this.currentVillage.coords)) {
            this.currentVillage = newVillage;
            this.addRenameButton();
        }
        
        setTimeout(() => this.replaceAllCoordinatesOnPage(), 200);
    }

    // Setup mutation observer for dynamic content
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            if (!this.renameInProgress) {
                // Check if village header changed
                const newVillage = this.getCurrentVillage();
                if (newVillage && (!this.currentVillage || newVillage.coords !== this.currentVillage.coords)) {
                    this.currentVillage = newVillage;
                    this.addRenameButton();
                }
                
                // Replace coordinates for any new content
                setTimeout(() => this.replaceAllCoordinatesOnPage(), 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: false
        });
    }

    // Add rename button to village header
    addRenameButton() {
        const villageCell = document.querySelector('#menu_row2_village');
        if (!villageCell) return;

        // Remove existing rename button if present
        const existingButton = villageCell.querySelector('.rename-village-btn');
        if (existingButton) {
            existingButton.remove();
        }

        const villageLink = villageCell.querySelector('a');
        if (!villageLink) return;

        const villageKey = this.currentVillage.coords;
        const hasCustomName = this.renames[villageKey];
        
        // Create rename button
        const renameBtn = document.createElement('button');
        renameBtn.className = 'rename-village-btn';
        renameBtn.innerHTML = '✏️';
        renameBtn.title = hasCustomName ? 'Edit village name' : 'Rename village';
        renameBtn.style.cssText = `
            background: none;
            border: 1px solid #666;
            border-radius: 3px;
            color: #666;
            cursor: pointer;
            font-size: 12px;
            margin-left: 5px;
            padding: 2px 5px;
            vertical-align: middle;
        `;
        
        renameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showRenameInterface(villageCell, villageKey);
        });

        villageLink.insertAdjacentElement('afterend', renameBtn);
    }

    // Show rename interface
    showRenameInterface(villageCell, villageKey) {
        // Remove existing rename interface
        const existingInterface = villageCell.querySelector('.rename-interface');
        if (existingInterface) {
            existingInterface.remove();
        }
        
        // Hide rename button
        const renameBtn = villageCell.querySelector('.rename-village-btn');
        renameBtn.style.display = 'none';
        
        this.renameInProgress = true;
        
        // Get current name
        const currentName = this.renames[villageKey] || '';
        
        // Create rename interface
        const interfaceDiv = document.createElement('div');
        interfaceDiv.className = 'rename-interface';
        interfaceDiv.style.cssText = `
            display: inline-block;
            margin-left: 5px;
            vertical-align: middle;
        `;
        
        // Create input field
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.placeholder = 'Enter custom name';
        input.style.cssText = `
            padding: 2px 5px;
            border: 1px solid #666;
            border-radius: 3px;
            font-size: 12px;
            width: 150px;
        `;
        
        // Create save button
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '💾';
        saveBtn.title = 'Save name';
        saveBtn.style.cssText = `
            background: #4CAF50;
            border: none;
            border-radius: 3px;
            color: white;
            cursor: pointer;
            font-size: 12px;
            margin-left: 2px;
            padding: 2px 5px;
        `;
        
        // Create reset button
        const resetBtn = document.createElement('button');
        resetBtn.textContent = '🗑️';
        resetBtn.title = 'Remove custom name';
        resetBtn.style.cssText = `
            background: #ff9800;
            border: none;
            border-radius: 3px;
            color: white;
            cursor: pointer;
            font-size: 12px;
            margin-left: 2px;
            padding: 2px 5px;
        `;
        
        // Create cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '❌';
        cancelBtn.title = 'Cancel';
        cancelBtn.style.cssText = `
            background: #f44336;
            border: none;
            border-radius: 3px;
            color: white;
            cursor: pointer;
            font-size: 12px;
            margin-left: 2px;
            padding: 2px 5px;
        `;
        
        // Add event listeners
        saveBtn.addEventListener('click', () => {
            this.saveRename(villageKey, input.value);
            interfaceDiv.remove();
            renameBtn.style.display = 'inline-block';
            this.renameInProgress = false;
        });
        
        resetBtn.addEventListener('click', () => {
            input.value = '';
        });
        
        cancelBtn.addEventListener('click', () => {
            interfaceDiv.remove();
            renameBtn.style.display = 'inline-block';
            this.renameInProgress = false;
        });
        
        // Add elements to interface
        interfaceDiv.appendChild(input);
        interfaceDiv.appendChild(saveBtn);
        interfaceDiv.appendChild(resetBtn);
        interfaceDiv.appendChild(cancelBtn);
        
        // Add interface to DOM
        const villageLink = villageCell.querySelector('a');
        villageLink.insertAdjacentElement('afterend', interfaceDiv);
        
        // Focus input
        input.focus();
        input.select();
    }

    // Save rename to storage
    saveRename(villageKey, newName) {
        if (newName.trim() === '') {
            // Remove rename if empty
            if (this.renames[villageKey]) {
                delete this.renames[villageKey];
                this.saveRenames();
                this.replaceAllCoordinatesOnPage();
            }
        } else {
            // Save new name
            this.renames[villageKey] = newName.trim();
            this.saveRenames();
            this.replaceAllCoordinatesOnPage();
        }
    }

    // Replace ALL coordinates on page with fake names
    replaceAllCoordinatesOnPage() {
        if (Object.keys(this.renames).length === 0) return;
        
        // Walk through all text nodes
        this.walkTextNodes(document.body, (node) => {
            const text = node.textContent;
            if (!text || text.trim().length === 0) return;
            
            // Skip if node is inside input, textarea, or script
            if (node.parentNode && (
                node.parentNode.tagName === 'INPUT' ||
                node.parentNode.tagName === 'TEXTAREA' ||
                node.parentNode.tagName === 'SCRIPT' ||
                node.parentNode.tagName === 'STYLE'
            )) {
                return;
            }
            
            let newText = text;
            let changed = false;
            
            // Replace coordinates in both formats
            for (const [coords, fakeName] of Object.entries(this.renames)) {
                // Format with parentheses: (xxx|yyy) -> (fakename)
                const regexWithParens = new RegExp(`\\(${coords}\\)`, 'g');
                if (regexWithParens.test(newText)) {
                    newText = newText.replace(regexWithParens, `(${fakeName})`);
                    changed = true;
                }
                
                // Format without parentheses: xxx|yyy -> fakename
                const regexWithoutParens = new RegExp(`\\b${coords}\\b`, 'g');
                if (regexWithoutParens.test(newText)) {
                    newText = newText.replace(regexWithoutParens, fakeName);
                    changed = true;
                }
                
                // Also handle the format where it's already in parentheses in the text
                const regexFullWithParens = new RegExp(`\\(${coords.replace('|', '\\|')}\\)`, 'g');
                if (regexFullWithParens.test(newText)) {
                    newText = newText.replace(regexFullWithParens, `(${fakeName})`);
                    changed = true;
                }
            }
            
            // Update node if changes were made
            if (changed && newText !== text) {
                const newNode = document.createTextNode(newText);
                node.parentNode.replaceChild(newNode, node);
            }
        });
    }

    // Helper to walk through text nodes
    walkTextNodes(node, callback) {
        if (node.nodeType === Node.TEXT_NODE) {
            callback(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Skip certain elements
            const tagName = node.tagName;
            if (tagName === 'SCRIPT' || tagName === 'STYLE' || 
                tagName === 'INPUT' || tagName === 'TEXTAREA' ||
                tagName === 'BUTTON') {
                return;
            }
            
            // Process children
            for (const child of node.childNodes) {
                this.walkTextNodes(child, callback);
            }
        }
    }
}

// Initialize the script
new VillageRenamer();
