// Tribal Wars Place Screen Attack Script - FIXED CSRF ISSUE
class PlaceScreenAttack {
    constructor(villageId, coordinates) {
        this.villageId = villageId;
        this.coordinates = coordinates; // {x: 541, y: 654}
        this.csrfHash = null;
        this.troops = {};
        this.confirmData = {};
    }

    // Enhanced CSRF hash extraction for place screen
    extractCSRFHash() {
        // Try multiple methods to find CSRF hash
        const methods = [
            // Method 1: Direct input field
            () => {
                const input = document.querySelector('input[name="h"]');
                return input?.value;
            },
            
            // Method 2: From any form on the page
            () => {
                const forms = document.querySelectorAll('form');
                for (const form of forms) {
                    const action = form.getAttribute('action') || '';
                    const match = action.match(/[?&]h=([a-f0-9]+)/);
                    if (match) return match[1];
                    
                    // Check hidden inputs in form
                    const hInput = form.querySelector('input[name="h"]');
                    if (hInput?.value) return hInput.value;
                }
                return null;
            },
            
            // Method 3: From URL parameters
            () => {
                const urlParams = new URLSearchParams(window.location.search);
                return urlParams.get('h');
            },
            
            // Method 4: From data attributes in place screen
            () => {
                const placeElements = document.querySelectorAll('[data-h], [data-csrf]');
                for (const el of placeElements) {
                    const hash = el.getAttribute('data-h') || el.getAttribute('data-csrf');
                    if (hash && hash.match(/^[a-f0-9]+$/)) return hash;
                }
                return null;
            },
            
            // Method 5: From script tags (often contains CSRF in config)
            () => {
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                    const text = script.textContent;
                    const match = text.match(/['"]h['"]\s*:\s*['"]([a-f0-9]+)['"]/);
                    if (match) return match[1];
                }
                return null;
            },
            
            // Method 6: From attack/command links
            () => {
                const links = document.querySelectorAll('a[href*="place"], a[href*="command"]');
                for (const link of links) {
                    const href = link.href;
                    const match = href.match(/h=([a-f0-9]+)/);
                    if (match) return match[1];
                }
                return null;
            }
        ];
        
        for (const method of methods) {
            try {
                const hash = method();
                if (hash && hash.match(/^[a-f0-9]{8}$/)) {
                    console.log('Found CSRF hash via method:', method.name || 'unknown');
                    return hash;
                }
            } catch (e) {
                // Continue to next method
            }
        }
        
        console.warn('No CSRF hash found. Place screen might need manual hash.');
        return null;
    }

    // Alternative: Manually set CSRF hash
    setCSRFHash(hash) {
        if (hash && hash.match(/^[a-f0-9]{8}$/)) {
            this.csrfHash = hash;
            return true;
        }
        return false;
    }

    // Get current village ID from URL
    static getCurrentVillageId() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('village')) || 25034;
    }

    // Step 1: Initialize attack from place screen
    async initPlaceAttack() {
        // Get or set CSRF hash
        if (!this.csrfHash) {
            this.csrfHash = this.extractCSRFHash();
        }
        
        if (!this.csrfHash) {
            // Try to get from global storage or prompt
            const storedHash = localStorage.getItem('tw_csrf_hash');
            if (storedHash && storedHash.match(/^[a-f0-9]{8}$/)) {
                this.csrfHash = storedHash;
                console.log('Using stored CSRF hash:', this.csrfHash);
            } else {
                // Last resort: prompt user
                const userHash = prompt('Enter CSRF hash (h parameter) from page URL or form:');
                if (userHash && userHash.match(/^[a-f0-9]{8}$/)) {
                    this.csrfHash = userHash;
                    localStorage.setItem('tw_csrf_hash', userHash);
                } else {
                    throw new Error('CSRF hash is required. Check URL for h= parameter or form inputs.');
                }
            }
        }
        
        const url = `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place`;
        
        // Prepare form data for place screen initialization
        const formData = new URLSearchParams();
        formData.append('x', this.coordinates.x.toString());
        formData.append('y', this.coordinates.y.toString());
        formData.append('target_type', 'coord');
        formData.append('target', `${this.coordinates.x}|${this.coordinates.y}`);
        formData.append('attack', 'l'); // l = attack
        formData.append('h', this.csrfHash);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'ru,en;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest',
                    'referer': window.location.href
                },
                credentials: 'include',
                body: formData.toString()
            });

            if (!response.ok) {
                throw new Error(`Init failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Parse response to get form data
            if (data.response?.dialog) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.response.dialog, 'text/html');
                
                // Extract all hidden inputs
                const inputs = doc.querySelectorAll('input[type="hidden"]');
                const extractedData = {};
                inputs.forEach(input => {
                    if (input.name && input.value !== undefined) {
                        extractedData[input.name] = input.value;
                    }
                });
                
                // Update CSRF hash if new one provided
                if (extractedData.h) {
                    this.csrfHash = extractedData.h;
                    localStorage.setItem('tw_csrf_hash', this.csrfHash);
                }
                
                // Find dynamic field (typically a 32-char hex string)
                const dynamicField = Object.keys(extractedData).find(key => 
                    key.length === 32 && /^[a-f0-9]+$/.test(key)
                );
                
                if (dynamicField) {
                    this.confirmData.dynamicField = {
                        name: dynamicField,
                        value: extractedData[dynamicField]
                    };
                    console.log('Found dynamic field:', dynamicField);
                }
            }
            
            return data;
            
        } catch (error) {
            console.error('Init error:', error);
            throw error;
        }
    }

    // Step 2: Confirm attack
    async confirmAttack(troopSelection = {}) {
        // Default troops
        const defaultTroops = {
            spear: 1,
            sword: 1,
            axe: 0,
            archer: 0,
            spy: 0,
            light: 0,
            marcher: 0,
            heavy: 0,
            ram: 0,
            catapult: 0,
            knight: 0,
            snob: 0
        };
        
        this.troops = { ...defaultTroops, ...troopSelection };
        
        const url = `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place&ajax=confirm`;
        
        // Build form data
        const formData = new URLSearchParams();
        
        // Add dynamic field or fallback
        if (this.confirmData.dynamicField) {
            formData.append(this.confirmData.dynamicField.name, this.confirmData.dynamicField.value);
        } else {
            // Common dynamic field name pattern
            formData.append('79d131589f81aaeb36d2d2', '7d85610179d131');
        }
        
        // Basic params
        formData.append('template_id', '');
        formData.append('source_village', this.villageId.toString());
        
        // Troops
        for (const [unit, count] of Object.entries(this.troops)) {
            formData.append(unit, count.toString());
        }
        
        // Coordinates and type
        formData.append('x', this.coordinates.x.toString());
        formData.append('y', this.coordinates.y.toString());
        formData.append('input', '');
        formData.append('attack', 'l');
        formData.append('h', this.csrfHash);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'ru,en;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest',
                    'referer': `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place`
                },
                credentials: 'include',
                body: formData.toString()
            });

            if (!response.ok) {
                throw new Error(`Confirm failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Extract confirmation token
            if (data.response?.dialog) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.response.dialog, 'text/html');
                
                // Get ch value
                const chInput = doc.querySelector('input[name="ch"]');
                if (chInput?.value) {
                    this.confirmData.ch = chInput.value;
                    console.log('Extracted ch token');
                }
                
                // Set cb (always the same for place screen)
                this.confirmData.cb = 'troop_confirm_submit';
                
                // Update CSRF if changed
                const hInput = doc.querySelector('input[name="h"]');
                if (hInput?.value) {
                    this.csrfHash = hInput.value;
                    localStorage.setItem('tw_csrf_hash', this.csrfHash);
                }
            }
            
            return data;
            
        } catch (error) {
            console.error('Confirm error:', error);
            throw error;
        }
    }

    // Step 3: Finalize attack
    async finalizeAttack() {
        if (!this.confirmData.ch) {
            throw new Error('Missing confirmation token. Did step 2 complete?');
        }

        const url = `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place&ajaxaction=popup_command`;

        const formData = new URLSearchParams();
        formData.append('attack', 'true');
        formData.append('ch', this.confirmData.ch);
        formData.append('cb', this.confirmData.cb);
        formData.append('x', this.coordinates.x.toString());
        formData.append('y', this.coordinates.y.toString());
        formData.append('source_village', this.villageId.toString());
        formData.append('village', this.villageId.toString());
        
        // Add troops
        for (const [unit, count] of Object.entries(this.troops)) {
            formData.append(unit, count.toString());
        }
        
        formData.append('building', 'main');
        formData.append('h', this.csrfHash);
        formData.append('h', this.csrfHash); // Duplicate as required

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'ru,en;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest',
                    'referer': `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place`
                },
                credentials: 'include',
                body: formData.toString()
            });

            if (!response.ok) {
                throw new Error(`Finalize failed: ${response.status}`);
            }

            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Finalize error:', error);
            throw error;
        }
    }

    // Main execution
    async execute(troopSelection = {}) {
        try {
            console.log('🚀 Starting place screen attack...');
            
            console.log('Step 1: Initializing...');
            const step1 = await this.initPlaceAttack();
            console.log('✓ Step 1 complete');
            
            console.log('Step 2: Confirming...');
            const step2 = await this.confirmAttack(troopSelection);
            console.log('✓ Step 2 complete');
            
            console.log('Step 3: Finalizing...');
            const step3 = await this.finalizeAttack();
            console.log('✓ Step 3 complete');
            
            return {
                success: true,
                csrfHash: this.csrfHash,
                troops: this.troops,
                steps: { step1, step2, step3 }
            };
            
        } catch (error) {
            console.error('✗ Attack failed:', error);
            return {
                success: false,
                error: error.message,
                csrfHash: this.csrfHash
            };
        }
    }
}

// Helper: Find CSRF hash on current page
function findCSRFHashOnPage() {
    console.log('Searching for CSRF hash on page...');
    
    // Check URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlHash = urlParams.get('h');
    if (urlHash) {
        console.log('Found in URL:', urlHash);
        return urlHash;
    }
    
    // Check all inputs
    const inputs = document.querySelectorAll('input[name="h"], input[value*="h="]');
    for (const input of inputs) {
        if (input.value && input.value.match(/^[a-f0-9]{8}$/)) {
            console.log('Found in input:', input.value);
            return input.value;
        }
    }
    
    // Check forms
    const forms = document.querySelectorAll('form');
    for (const form of forms) {
        const action = form.getAttribute('action') || '';
        const match = action.match(/h=([a-f0-9]{8})/);
        if (match) {
            console.log('Found in form action:', match[1]);
            return match[1];
        }
    }
    
    // Check links
    const links = document.querySelectorAll('a[href*="h="]');
    for (const link of links) {
        const href = link.href;
        const match = href.match(/h=([a-f0-9]{8})/);
        if (match) {
            console.log('Found in link:', match[1]);
            return match[1];
        }
    }
    
    console.log('No CSRF hash found on page');
    return null;
}

// Simple direct attack function
async function quickAttack(x, y, troops = {}) {
    const villageId = PlaceScreenAttack.getCurrentVillageId();
    const csrfHash = findCSRFHashOnPage();
    
    if (!csrfHash) {
        const userHash = prompt('Enter CSRF hash (8 character hex from URL h= parameter):');
        if (!userHash || !userHash.match(/^[a-f0-9]{8}$/)) {
            alert('Invalid CSRF hash');
            return;
        }
        localStorage.setItem('tw_csrf_hash', userHash);
    }
    
    const attack = new PlaceScreenAttack(villageId, { x, y });
    if (csrfHash) {
        attack.setCSRFHash(csrfHash);
    }
    
    const result = await attack.execute(troops);
    
    if (result.success) {
        console.log('✅ Attack successful!');
        alert('Attack sent!');
    } else {
        console.error('❌ Attack failed:', result.error);
        alert('Failed: ' + result.error);
    }
    
    return result;
}

// Create debug panel
function createDebugPanel() {
    const panel = document.createElement('div');
    panel.id = 'tw-debug-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #2c3e50;
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        max-width: 300px;
    `;
    
    // Title
    const title = document.createElement('div');
    title.textContent = 'TW Attack Debug';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '5px';
    title.style.color = '#3498db';
    panel.appendChild(title);
    
    // CSRF status
    const csrfStatus = document.createElement('div');
    csrfStatus.id = 'tw-csrf-status';
    csrfStatus.textContent = 'CSRF: Searching...';
    csrfStatus.style.marginBottom = '5px';
    panel.appendChild(csrfStatus);
    
    // Village info
    const villageInfo = document.createElement('div');
    villageInfo.id = 'tw-village-info';
    villageInfo.textContent = 'Village: ' + PlaceScreenAttack.getCurrentVillageId();
    villageInfo.style.marginBottom = '5px';
    panel.appendChild(villageInfo);
    
    // Quick test button
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Test CSRF';
    testBtn.style.cssText = `
        background: #3498db;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
        margin-right: 5px;
    `;
    testBtn.onclick = () => {
        const hash = findCSRFHashOnPage();
        csrfStatus.textContent = `CSRF: ${hash || 'Not found'}`;
        if (hash) {
            csrfStatus.style.color = '#2ecc71';
        } else {
            csrfStatus.style.color = '#e74c3c';
        }
    };
    panel.appendChild(testBtn);
    
    // Quick attack button
    const attackBtn = document.createElement('button');
    attackBtn.textContent = 'Quick Attack';
    attackBtn.style.cssText = `
        background: #e74c3c;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
    `;
    attackBtn.onclick = () => {
        const x = prompt('Enter X coordinate:', '541');
        const y = prompt('Enter Y coordinate:', '654');
        if (x && y) {
            quickAttack(parseInt(x), parseInt(y));
        }
    };
    panel.appendChild(attackBtn);
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    closeBtn.style.cssText = `
        position: absolute;
        top: 2px;
        right: 2px;
        background: transparent;
        color: white;
        border: none;
        font-size: 14px;
        cursor: pointer;
        padding: 0;
        width: 16px;
        height: 16px;
        line-height: 1;
    `;
    closeBtn.onclick = () => panel.remove();
    panel.appendChild(closeBtn);
    
    document.body.appendChild(panel);
    
    // Update CSRF status immediately
    setTimeout(() => {
        const hash = findCSRFHashOnPage();
        csrfStatus.textContent = `CSRF: ${hash || 'Not found'}`;
        csrfStatus.style.color = hash ? '#2ecc71' : '#e74c3c';
    }, 500);
}

// Auto-initialize on place screen
function initOnPlaceScreen() {
    const urlParams = new URLSearchParams(window.location.search);
    const screen = urlParams.get('screen');
    
    if (screen === 'place') {
        console.log('Place screen detected. Initializing attack tools...');
        
        // Wait a bit for page to load
        setTimeout(() => {
            createDebugPanel();
            
            // Add main attack button
            const mainBtn = document.createElement('button');
            mainBtn.textContent = 'TW Attack';
            mainBtn.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: linear-gradient(135deg, #e74c3c, #c0392b);
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                z-index: 9999;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            `;
            mainBtn.onclick = () => {
                const x = prompt('X coordinate:', '541');
                const y = prompt('Y coordinate:', '654');
                if (x && y) {
                    quickAttack(parseInt(x), parseInt(y), {
                        spear: parseInt(prompt('Spears:', '1') || '1'),
                        sword: parseInt(prompt('Swords:', '1') || '1')
                    });
                }
            };
            document.body.appendChild(mainBtn);
            
            console.log('TW Attack tools ready. Click the red button or use quickAttack(x, y)');
        }, 1000);
    }
}

// Make functions globally available
window.PlaceScreenAttack = PlaceScreenAttack;
window.quickAttack = quickAttack;
window.findCSRFHashOnPage = findCSRFHashOnPage;

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnPlaceScreen);
} else {
    initOnPlaceScreen();
}

// Usage examples:
/*
// Option 1: Quick function
await quickAttack(541, 654, {spear: 2, sword: 1});

// Option 2: Manual class usage
const attack = new PlaceScreenAttack(25034, {x: 541, y: 654});
attack.setCSRFHash('683500cb'); // Set hash manually if needed
const result = await attack.execute({spear: 1, sword: 1});

// Option 3: Find hash first
const hash = findCSRFHashOnPage();
console.log('Current CSRF:', hash);
*/
