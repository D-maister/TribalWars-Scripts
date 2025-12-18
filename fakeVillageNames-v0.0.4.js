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
        this.currentServer = this.getCurrentServer();
        this.renames = this.loadRenames();
        this.currentVillage = null;
        this.renameInProgress = false;
        this.init();
    }

    // Get current server from URL
    getCurrentServer() {
        const hostname = window.location.hostname;
        
        // Extract server name (e.g., "ru100" from "ru100.tribalwars.net" or "ru100.voynaplemyon.com")
        const serverMatch = hostname.match(/^([a-z]+\d+)\./);
        if (serverMatch) {
            return serverMatch[1];
        }
        
        // Fallback: use the subdomain
        const parts = hostname.split('.');
        if (parts.length > 2) {
            return parts[0];
        }
        
        // Default fallback
        return 'default';
    }

    loadRenames() {
        try {
            const allRenames = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
            // Return only renames for current server
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
        const coords = this.extractCoordinates();
        
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
        console.log(`Village Renamer initialized for server: ${this.currentServer}`);
        
        // Wait for page to load
        setTimeout(() => {
            this.currentVillage = this.getCurrentVillage();
            if (this.currentVillage) {
                this.addRenameButton();
            }
            
            // Always replace names on page, regardless of current village
            this.replaceAllNamesOnPage();
            
            // Set up mutation observer to handle dynamic content
            this.setupMutationObserver();
            
            // Handle page changes
            window.addEventListener('hashchange', () => {
                setTimeout(() => this.handlePageChange(), 100);
            });
            
            // Check for server changes
            this.checkForServerChange();
        }, 1000);
    }

    // Check if server changed (when switching worlds)
    checkForServerChange() {
        const currentServer = this.getCurrentServer();
        if (currentServer !== this.currentServer) {
            console.log(`Server changed from ${this.currentServer} to ${currentServer}`);
            this.currentServer = currentServer;
            this.renames = this.loadRenames();
            this.currentVillage = this.getCurrentVillage();
            
            if (this.currentVillage) {
                this.addRenameButton();
            }
            this.replaceAllNamesOnPage();
        }
    }

    // Handle page changes
    handlePageChange() {
        this.checkForServerChange();
        
        const newVillage = this.getCurrentVillage();
        if (newVillage && (!this.currentVillage || newVillage.coords !== this.currentVillage.coords)) {
            this.currentVillage = newVillage;
            this.addRenameButton();
        }
        // Always replace names on page change
        setTimeout(() => this.replaceAllNamesOnPage(), 200);
    }

    // Setup mutation observer for dynamic content
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            if (!this.renameInProgress) {
                this.checkForServerChange();
                
                // Check if village header changed
                const newVillage = this.getCurrentVillage();
                if (newVillage && (!this.currentVillage || newVillage.coords !== this.currentVillage.coords)) {
                    this.currentVillage = newVillage;
                    this.addRenameButton();
                }
                
                // Replace names for any new content
                this.replaceAllNamesOnPage();
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
                `Real name: ${realName}\nCoords: ${villageKey}\nServer: ${this.currentServer}`
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
        if (newName.trim() === '') {
            // Remove rename if set to real name or empty
            if (this.renames[villageKey]) {
                delete this.renames[villageKey];
                this.saveRenames();
                this.restoreRealName(villageLink, realName);
                this.replaceAllNamesOnPage();
            }
        } else {
            // Save new name
            this.renames[villageKey] = {
                name: newName.trim(),
                realName: realName,
                coords: villageKey,
                server: this.currentServer,
                timestamp: Date.now()
            };
            this.saveRenames();
            this.applyCustomName(villageLink, villageKey);
            this.replaceAllNamesOnPage();
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
            `Real name: ${realName}\nCustom name: ${customName}\nCoords: ${villageKey}\nServer: ${this.currentServer}`
        );
    }

    // Restore real name
    restoreRealName(element, realName) {
        if (element.textContent && realName) {
            element.textContent = element.textContent.replace(
                element.textContent,
                realName
            );
        }
        element.removeAttribute('data-original-title');
    }

    // Replace ALL village names on page (for all renamed villages)
    replaceAllNamesOnPage() {
        if (Object.keys(this.renames).length === 0) return;
        
        // Process all text nodes
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
            
            // Check against all renamed villages
            for (const [coords, renameInfo] of Object.entries(this.renames)) {
                const realName = renameInfo.realName;
                const customName = renameInfo.name;
                
                if (text.includes(realName) && realName !== customName) {
                    // Skip if this node already has the real name attribute (header)
                    let parent = node.parentNode;
                    let shouldReplace = true;
                    
                    while (parent && parent !== document.body) {
                        if (parent.hasAttribute && parent.hasAttribute(REAL_NAME_ATTRIBUTE)) {
                            shouldReplace = false;
                            break;
                        }
                        parent = parent.parentNode;
                    }
                    
                    if (shouldReplace) {
                        const newText = text.replace(new RegExp(this.escapeRegExp(realName), 'g'), customName);
                        if (newText !== text) {
                            const newNode = document.createTextNode(newText);
                            node.parentNode.replaceChild(newNode, node);
                            // Stop after first replacement for this node
                            return;
                        }
                    }
                }
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
            if (tagName === 'SCRIPT' || tagName === 'STYLE' || tagName === 'INPUT' || tagName === 'TEXTAREA') {
                return;
            }
            
            // Check for data attributes that might indicate this shouldn't be replaced
            if (node.hasAttribute && 
               (node.hasAttribute(REAL_NAME_ATTRIBUTE) || 
                node.hasAttribute('data-coords') ||
                node.className && node.className.includes('coords'))) {
                return;
            }
            
            // Process children
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
