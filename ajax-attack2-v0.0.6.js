// Tribal Wars Place Screen Attack - WORKING VERSION
// Based on the actual place screen form structure

class PlaceAttack {
    constructor(villageId, coordinates) {
        this.villageId = villageId;
        this.coordinates = coordinates;
        this.csrfHash = '683500cb'; // From your working example
        this.troops = {};
        this.confirmData = {};
    }

    // Get form data from the actual place screen form
    extractFormData() {
        const form = document.querySelector('form[action*="place"]');
        if (!form) {
            throw new Error('No place form found on page');
        }
        
        const data = {};
        const inputs = form.querySelectorAll('input[type="hidden"]');
        inputs.forEach(input => {
            if (input.name && input.value !== undefined) {
                data[input.name] = input.value;
            }
        });
        
        console.log('Extracted form data:', data);
        return data;
    }

    // Step 1: Submit the place form (like clicking "Attack" button)
    async submitPlaceForm(troopSelection = {}) {
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
        
        // Get base form data
        const formData = this.extractFormData();
        
        // Update with our coordinates and troops
        formData['x'] = this.coordinates.x.toString();
        formData['y'] = this.coordinates.y.toString();
        formData['target_type'] = 'coord';
        formData['target'] = `${this.coordinates.x}|${this.coordinates.y}`;
        
        // Add troop counts
        for (const [unit, count] of Object.entries(this.troops)) {
            formData[unit] = count.toString();
        }
        
        // Set attack type (button name/value)
        formData['attack'] = 'l'; // This is the button value for attack
        
        // Build URLSearchParams
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(formData)) {
            if (value !== undefined && value !== null) {
                params.append(key, value);
            }
        }
        
        // Add CSRF hash (h parameter)
        params.append('h', this.csrfHash);
        
        const url = `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place&try=confirm`;
        
        console.log('Submitting to:', url);
        console.log('Form data:', params.toString());
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'ru,en;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include',
                referrer: `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place`,
                body: params.toString()
            });

            const data = await response.json();
            console.log('Submit response:', data);
            return data;
            
        } catch (error) {
            console.error('Submit error:', error);
            throw error;
        }
    }

    // Step 2: Confirm the attack (after form submission)
    async confirmAttack() {
        // The confirmation is actually handled in the previous step's response
        // This step extracts the confirmation data from the dialog
        return true;
    }

    // Step 3: Finalize attack (send the actual attack)
    async finalizeAttack(confirmResponse) {
        if (!confirmResponse.response?.dialog) {
            throw new Error('No confirmation dialog in response');
        }
        
        // Parse the dialog to get ch value
        const parser = new DOMParser();
        const doc = parser.parseFromString(confirmResponse.response.dialog, 'text/html');
        const form = doc.querySelector('form');
        
        if (!form) {
            throw new Error('No confirmation form found in dialog');
        }
        
        // Extract all form data
        const formData = {};
        const inputs = form.querySelectorAll('input[type="hidden"]');
        inputs.forEach(input => {
            if (input.name && input.value !== undefined) {
                formData[input.name] = input.value;
            }
        });
        
        console.log('Confirmation form data:', formData);
        
        // The ch and cb values are critical
        if (!formData.ch) {
            throw new Error('Missing ch (confirmation hash)');
        }
        
        // Build final request
        const params = new URLSearchParams();
        
        // Add all required parameters (matching your original successful request)
        params.append('attack', 'true');
        params.append('ch', formData.ch);
        params.append('cb', 'troop_confirm_submit'); // This is always the same
        params.append('x', this.coordinates.x.toString());
        params.append('y', this.coordinates.y.toString());
        params.append('source_village', this.villageId.toString());
        params.append('village', this.villageId.toString());
        
        // Add troop counts
        for (const [unit, count] of Object.entries(this.troops)) {
            params.append(unit, count.toString());
        }
        
        params.append('building', 'main');
        params.append('h', this.csrfHash);
        params.append('h', this.csrfHash); // Duplicate as required
        
        const url = `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place&ajaxaction=popup_command`;
        
        console.log('Finalizing attack to:', url);
        console.log('Final params:', params.toString());
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'ru,en;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include',
                referrer: `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place`,
                body: params.toString()
            });

            const data = await response.json();
            console.log('Finalize response:', data);
            return data;
            
        } catch (error) {
            console.error('Finalize error:', error);
            throw error;
        }
    }

    // Complete attack flow
    async execute(troopSelection = {}) {
        try {
            console.log('Starting place screen attack...');
            
            // Step 1: Submit form and get confirmation dialog
            console.log('Step 1: Submitting attack form...');
            const confirmResponse = await this.submitPlaceForm(troopSelection);
            
            // Step 2: Extract confirmation data (embedded in Step 1 response)
            console.log('Step 2: Processing confirmation...');
            
            // Step 3: Send final attack
            console.log('Step 3: Sending final attack...');
            const finalResponse = await this.finalizeAttack(confirmResponse);
            
            return {
                success: true,
                confirmResponse,
                finalResponse
            };
            
        } catch (error) {
            console.error('Attack failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Simple wrapper function
async function attackFromPlace(x, y, troops = {}) {
    // Get current village ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const villageId = parseInt(urlParams.get('village')) || 25034;
    
    // Get CSRF hash from page
    const csrfHash = (() => {
        // Check URL
        const urlHash = urlParams.get('h');
        if (urlHash) return urlHash;
        
        // Check form inputs
        const hInput = document.querySelector('input[name="h"]');
        if (hInput?.value) return hInput.value;
        
        // Use default from your working example
        return '683500cb';
    })();
    
    console.log('Village ID:', villageId);
    console.log('CSRF Hash:', csrfHash);
    
    const attack = new PlaceAttack(villageId, { x, y });
    attack.csrfHash = csrfHash;
    
    return await attack.execute(troops);
}

// Direct method based on your original working requests
async function directPlaceAttack() {
    const villageId = 25034;
    const csrfHash = '683500cb'; // You need to update this!
    const coordinates = { x: 541, y: 654 };
    
    console.log('Using direct method...');
    
    try {
        // First, let's see what's on the page
        const form = document.querySelector('form[action*="place"]');
        if (form) {
            console.log('Found form:', form.action);
            
            // Extract dynamic field name
            const inputs = form.querySelectorAll('input[type="hidden"]');
            let dynamicField = null;
            inputs.forEach(input => {
                if (input.name.length === 32 && /^[a-f0-9]+$/.test(input.name)) {
                    dynamicField = input.name;
                }
            });
            
            console.log('Dynamic field:', dynamicField || '79d131589f81aaeb36d2d2');
        }
        
        // Step 2: Confirm attack (using the exact format from your working example)
        console.log('Step 1: Confirming attack...');
        const confirmResponse = await fetch(`https://en152.tribalwars.net/game.php?village=${villageId}&screen=place&ajax=confirm`, {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'ru,en;q=0.9',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'tribalwars-ajax': '1',
                'x-requested-with': 'XMLHttpRequest'
            },
            credentials: 'include',
            referrer: `https://en152.tribalwars.net/game.php?village=${villageId}&screen=place`,
            body: `79d131589f81aaeb36d2d2=7d85610179d131&template_id=&source_village=${villageId}&spear=1&sword=1&axe=0&archer=0&spy=0&light=0&marcher=0&heavy=0&ram=0&catapult=0&knight=0&snob=0&x=${coordinates.x}&y=${coordinates.y}&input=&attack=l&h=${csrfHash}`
        });
        
        const confirmData = await confirmResponse.json();
        console.log('Confirm response:', confirmData);
        
        // Extract ch from dialog
        let chValue = '';
        if (confirmData.response?.dialog) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = confirmData.response.dialog;
            const chInput = tempDiv.querySelector('input[name="ch"]');
            chValue = chInput?.value || '';
        }
        
        if (!chValue) {
            throw new Error('Could not extract ch value');
        }
        
        console.log('Extracted ch:', chValue);
        
        // Step 3: Finalize attack
        console.log('Step 2: Sending final attack...');
        const finalizeResponse = await fetch(`https://en152.tribalwars.net/game.php?village=${villageId}&screen=place&ajaxaction=popup_command`, {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'ru,en;q=0.9',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'tribalwars-ajax': '1',
                'x-requested-with': 'XMLHttpRequest'
            },
            credentials: 'include',
            referrer: `https://en152.tribalwars.net/game.php?village=${villageId}&screen=place`,
            body: `attack=true&ch=${encodeURIComponent(chValue)}&cb=troop_confirm_submit&x=${coordinates.x}&y=${coordinates.y}&source_village=${villageId}&village=${villageId}&spear=1&sword=1&axe=0&archer=0&spy=0&light=0&marcher=0&heavy=0&ram=0&catapult=0&knight=0&snob=0&building=main&h=${csrfHash}&h=${csrfHash}`
        });
        
        const finalizeData = await finalizeResponse.json();
        console.log('Finalize response:', finalizeData);
        
        return {
            success: true,
            confirmData,
            finalizeData
        };
        
    } catch (error) {
        console.error('Direct attack failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Helper: Get current CSRF from page
function getCurrentCSRF() {
    // Check URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlHash = urlParams.get('h');
    if (urlHash) {
        console.log('CSRF from URL:', urlHash);
        return urlHash;
    }
    
    // Check form
    const form = document.querySelector('form[action*="place"]');
    if (form) {
        const hInput = form.querySelector('input[name="h"]');
        if (hInput?.value) {
            console.log('CSRF from form:', hInput.value);
            return hInput.value;
        }
        
        // Extract from action
        const action = form.getAttribute('action') || '';
        const match = action.match(/h=([a-f0-9]{8})/);
        if (match) {
            console.log('CSRF from action:', match[1]);
            return match[1];
        }
    }
    
    console.warn('No CSRF found, using default');
    return '683500cb'; // Your working hash
}

// Create simple test UI
function createTestUI() {
    const ui = document.createElement('div');
    ui.id = 'tw-test-ui';
    ui.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #2c3e50;
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        min-width: 250px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    // Title
    const title = document.createElement('h3');
    title.textContent = 'TW Attack Test';
    title.style.margin = '0 0 10px 0';
    title.style.color = '#3498db';
    ui.appendChild(title);
    
    // Info
    const info = document.createElement('div');
    info.style.fontSize = '12px';
    info.style.marginBottom = '10px';
    info.style.padding = '5px';
    info.style.background = '#34495e';
    info.style.borderRadius = '3px';
    info.innerHTML = `
        <div>Village: ${PlaceAttack.getCurrentVillageId ? PlaceAttack.getCurrentVillageId() : 'N/A'}</div>
        <div>CSRF: ${getCurrentCSRF()}</div>
    `;
    ui.appendChild(info);
    
    // Method 1: Direct attack (from your working example)
    const directBtn = document.createElement('button');
    directBtn.textContent = 'Direct Attack';
    directBtn.style.cssText = `
        width: 100%;
        padding: 10px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        margin-bottom: 5px;
    `;
    directBtn.onclick = async () => {
        directBtn.disabled = true;
        directBtn.textContent = 'Sending...';
        
        try {
            const result = await directPlaceAttack();
            if (result.success) {
                alert('✅ Direct attack sent!');
            } else {
                alert('❌ Failed: ' + result.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            directBtn.disabled = false;
            directBtn.textContent = 'Direct Attack';
        }
    };
    ui.appendChild(directBtn);
    
    // Method 2: Form-based attack
    const formBtn = document.createElement('button');
    formBtn.textContent = 'Form Attack';
    formBtn.style.cssText = `
        width: 100%;
        padding: 10px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        margin-bottom: 5px;
    `;
    formBtn.onclick = async () => {
        const x = prompt('X coordinate:', '541');
        const y = prompt('Y coordinate:', '654');
        
        if (x && y) {
            formBtn.disabled = true;
            formBtn.textContent = 'Sending...';
            
            try {
                const result = await attackFromPlace(parseInt(x), parseInt(y), {
                    spear: parseInt(prompt('Spears:', '1') || '1'),
                    sword: parseInt(prompt('Swords:', '1') || '1')
                });
                
                if (result.success) {
                    alert('✅ Attack sent!');
                } else {
                    alert('❌ Failed: ' + result.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            } finally {
                formBtn.disabled = false;
                formBtn.textContent = 'Form Attack';
            }
        }
    };
    ui.appendChild(formBtn);
    
    // Debug button
    const debugBtn = document.createElement('button');
    debugBtn.textContent = 'Debug Page';
    debugBtn.style.cssText = `
        width: 100%;
        padding: 8px;
        background: #95a5a6;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    `;
    debugBtn.onclick = () => {
        console.log('=== Page Debug ===');
        console.log('URL:', window.location.href);
        
        const form = document.querySelector('form[action*="place"]');
        if (form) {
            console.log('Place form found:', form.action);
            
            const inputs = form.querySelectorAll('input[type="hidden"]');
            console.log('Form inputs:', inputs.length);
            inputs.forEach((input, i) => {
                console.log(`  [${i}] ${input.name} = ${input.value}`);
            });
        } else {
            console.log('No place form found');
        }
        
        alert('Check console for debug info');
    };
    ui.appendChild(debugBtn);
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    closeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: transparent;
        color: white;
        border: none;
        font-size: 16px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        line-height: 1;
    `;
    closeBtn.onclick = () => ui.remove();
    ui.appendChild(closeBtn);
    
    document.body.appendChild(ui);
    console.log('Test UI loaded. Try "Direct Attack" first.');
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.search.includes('screen=place')) {
            setTimeout(createTestUI, 1000);
        }
    });
} else {
    if (window.location.search.includes('screen=place')) {
        setTimeout(createTestUI, 1000);
    }
}

// Make functions available globally
window.attackFromPlace = attackFromPlace;
window.directPlaceAttack = directPlaceAttack;
window.getCurrentCSRF = getCurrentCSRF;

console.log('Place Attack Script loaded.');
console.log('Use directPlaceAttack() for quick test with default coordinates.');
console.log('Use attackFromPlace(x, y, troops) for custom attack.');
