'use strict';

// Configuration
const STORAGE_KEY = 'tw_village_renames';
const REAL_NAME_ATTRIBUTE = 'data-real-village-name';

// Initialize storage if needed
if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
}

// Main class
class VillageRenamer {
    constructor() {
        this.renames = this.loadRenames();
        this.currentVillage = null;
        this.renameInProgress = false;
        this.init();
    }

    loadRenames() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch (e) {
            console.error('Error loading renames:', e);
            return {};
        }
    }

    saveRenames() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.renames));
    }

    // Get current village info
    getCurrentVillage() {
        const villageLink = document.querySelector('#menu_row2_village a');
        if (!villageLink) return null;

        const villageName = villageLink.textContent.trim();
        const villageUrl = villageLink.getAttribute('href');
        const coords = this.extractCoordinates();
        
        if (!coords) {
            console.warn('Could not extract coordinates for village');
            return null;
        }
        
        return {
            name: villageName,
            url: villageUrl,
            coords: coords,
            key: coords // Use coordinates as the unique key
        };
    }

    extractCoordinates() {
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
            const match = text.match(/\((\d+)\|(\d+)\)/);
            if (match) {
                return `${match[1]}|${match[2]}`;
            }
            nextSibling = nextSibling.nextElementSibling;
        }
        
        return null;
    }

    // Initialize the script
    init() {
        // Wait for page to load
        setTimeout(() => {
            this.currentVillage = this.getCurrentVillage();
            if (this.currentVillage) {
                this.addRenameButton();
                this.replaceNamesOnPage();
            }
            
            // Set up mutation observer to handle dynamic content
            this.setupMutationObserver();
            
            // Also run on hash change (for SPA navigation)
            window.addEventListener('hashchange', () => {
                setTimeout(() => this.handlePageChange(), 100);
            });
        }, 500);
    }

    // Handle page changes
    handlePageChange() {
        const newVillage = this.getCurrentVillage();
        if (newVillage && (!this.currentVillage || newVillage.coords !== this.currentVillage.coords)) {
            this.currentVillage = newVillage;
            this.addRenameButton();
            this.replaceNamesOnPage();
        }
    }

    // Setup mutation observer for dynamic content
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            if (!this.renameInProgress) {
                this.replaceNamesOnPage();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
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
        const realName = this.currentVillage.name;
        
        // Store real name as attribute
        if (!villageLink.hasAttribute(REAL_NAME_ATTRIBUTE)) {
            villageLink.setAttribute(REAL_NAME_ATTRIBUTE, realName);
        }
        
        // Add tooltip to real name
        if (!villageLink.hasAttribute('data-original-title')) {
            villageLink.setAttribute('data-original-title', 
                hasCustomName ? 
                `Real name: ${realName}\nCustom name: ${this.renames[villageKey].name}\nCoords: ${villageKey}` :
                `Real name: ${realName}\nCoords: ${villageKey}`
            );
        }

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
            this.showRenameInterface(villageCell, villageLink, villageKey);
        });

        villageLink.insertAdjacentElement('afterend', renameBtn);

        // Apply custom name if exists
        if (hasCustomName) {
            this.applyCustomName(villageLink, villageKey);
        }
    }

    // Show rename interface
    showRenameInterface(villageCell, villageLink, villageKey) {
        // Remove existing rename interface
        const existingInterface = villageCell.querySelector('.rename-interface');
        if (existingInterface) {
            existingInterface.remove();
        }
        
        // Hide rename button
        const renameBtn = villageCell.querySelector('.rename-village-btn');
        renameBtn.style.display = 'none';
        
        this.renameInProgress = true;
        
        // Get current names
        const realName = villageLink.getAttribute(REAL_NAME_ATTRIBUTE);
        const currentName = this.renames[villageKey] ? this.renames[villageKey].name : realName;
        
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
        resetBtn.textContent = '↩️';
        resetBtn.title = 'Reset to real name';
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
            this.saveRename(villageKey, input.value, realName, villageLink);
            interfaceDiv.remove();
            renameBtn.style.display = 'inline-block';
            this.renameInProgress = false;
        });
        
        resetBtn.addEventListener('click', () => {
            input.value = realName;
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
        villageLink.insertAdjacentElement('afterend', interfaceDiv);
        
        // Focus input
        input.focus();
        input.select();
    }

    // Save rename to storage
    saveRename(villageKey, newName, realName, villageLink) {
        if (newName.trim() === realName.trim() || newName.trim() === '') {
            // Remove rename if set to real name or empty
            if (this.renames[villageKey]) {
                delete this.renames[villageKey];
                this.saveRenames();
                this.restoreRealName(villageLink, realName);
                this.replaceNamesOnPage();
            }
        } else {
            // Save new name
            this.renames[villageKey] = {
                name: newName.trim(),
                realName: realName,
                coords: villageKey,
                timestamp: Date.now()
            };
            this.saveRenames();
            this.applyCustomName(villageLink, villageKey);
            this.replaceNamesOnPage();
        }
    }

    // Apply custom name to element
    applyCustomName(element, villageKey) {
        if (!this.renames[villageKey]) return;
        
        const customName = this.renames[villageKey].name;
        const realName = this.renames[villageKey].realName;
        
        // Store real name if not already stored
        if (!element.hasAttribute(REAL_NAME_ATTRIBUTE)) {
            element.setAttribute(REAL_NAME_ATTRIBUTE, realName);
        }
        
        // Update text content
        if (element.textContent.includes(realName)) {
            element.textContent = element.textContent.replace(realName, customName);
        }
        
        // Update tooltip
        element.setAttribute('data-original-title', 
            `Real name: ${realName}\nCustom name: ${customName}\nCoords: ${villageKey}`
        );
    }

    // Restore real name
    restoreRealName(element, realName) {
        element.textContent = element.textContent.replace(
            element.textContent.match(/[^>]+$/)?.[0] || '',
            realName
        );
        element.removeAttribute('data-original-title');
    }

    // Replace all occurrences of village name on page
    replaceNamesOnPage() {
        if (!this.currentVillage) return;
        
        const villageKey = this.currentVillage.coords;
        const renameInfo = this.renames[villageKey];
        
        if (!renameInfo) {
            // No custom name - restore all real names
            this.restoreAllNames(villageKey);
            return;
        }
        
        const realName = renameInfo.realName || this.currentVillage.name;
        const customName = renameInfo.name;
        
        // Don't replace if names are the same
        if (realName === customName) return;
        
        // Walk through all text nodes in the document
        this.walkTextNodes(document.body, (node) => {
            const text = node.textContent;
            if (text.includes(realName)) {
                // Check if this node is inside an element with real name attribute
                let parent = node.parentNode;
                let shouldReplace = true;
                
                while (parent && parent !== document.body) {
                    if (parent.hasAttribute && parent.hasAttribute(REAL_NAME_ATTRIBUTE)) {
                        shouldReplace = false;
                        break;
                    }
                    parent = parent.parentNode;
                }
                
                if (shouldReplace && !node.isReplaced) {
                    const newNode = node.cloneNode();
                    newNode.textContent = text.replace(new RegExp(this.escapeRegExp(realName), 'g'), customName);
                    newNode.isReplaced = true;
                    node.parentNode.replaceChild(newNode, node);
                }
            }
        });
    }

    // Restore all names to real names
    restoreAllNames(villageKey) {
        const renameInfo = this.renames[villageKey];
        if (!renameInfo) return;
        
        const realName = renameInfo.realName;
        const customName = renameInfo.name;
        
        this.walkTextNodes(document.body, (node) => {
            const text = node.textContent;
            if (text.includes(customName)) {
                const newNode = node.cloneNode();
                newNode.textContent = text.replace(new RegExp(this.escapeRegExp(customName), 'g'), realName);
                node.parentNode.replaceChild(newNode, node);
            }
        });
    }

    // Helper to walk through text nodes
    walkTextNodes(node, callback) {
        if (node.nodeType === Node.TEXT_NODE) {
            callback(node);
        } else {
            for (const child of node.childNodes) {
                this.walkTextNodes(child, callback);
            }
        }
    }

    // Escape special regex characters
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Initialize the script
new VillageRenamer();
