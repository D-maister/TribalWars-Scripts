// Tribal Wars Place Screen Attack - FIXED HTML RESPONSE ISSUE
class TribalWarsPlaceAttack {
    constructor(villageId, coordinates) {
        this.villageId = villageId;
        this.coordinates = coordinates;
        this.csrfHash = null;
        this.troops = {};
        this.confirmData = {};
        this.sessionCookies = document.cookie;
    }

    // Get CSRF hash from page
    getCSRFHash() {
        // Try multiple sources
        const sources = [
            // URL parameter
            () => new URLSearchParams(window.location.search).get('h'),
            
            // Hidden input
            () => document.querySelector('input[name="h"]')?.value,
            
            // Form action
            () => {
                const form = document.querySelector('form');
                if (form) {
                    const action = form.getAttribute('action') || '';
                    const match = action.match(/h=([a-f0-9]{8})/);
                    return match ? match[1] : null;
                }
                return null;
            },
            
            // Links
            () => {
                const links = document.querySelectorAll('a');
                for (const link of links) {
                    const href = link.href;
                    if (href.includes('h=')) {
                        const match = href.match(/h=([a-f0-9]{8})/);
                        if (match) return match[1];
                    }
                }
                return null;
            }
        ];
        
        for (const source of sources) {
            try {
                const hash = source();
                if (hash && /^[a-f0-9]{8}$/.test(hash)) {
                    return hash;
                }
            } catch (e) {
                // Continue
            }
        }
        
        return null;
    }

    // Step 1: Get the attack form from place screen
    async getPlaceForm() {
        this.csrfHash = this.getCSRFHash();
        
        if (!this.csrfHash) {
            throw new Error('CSRF hash not found. Please check page URL for h= parameter.');
        }
        
        // IMPORTANT: The place screen uses a different URL format
        const url = `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place&action=command&target=${this.coordinates.x}|${this.coordinates.y}`;
        
        console.log('Request URL:', url);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'ru,en;q=0.9',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include',
                referrer: `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place`
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // Try to get text first to see what's wrong
                const text = await response.text();
                console.error('Non-JSON response:', text.substring(0, 500));
                throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
            }

            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Error getting place form:', error);
            throw error;
        }
    }

    // Alternative Step 1: Direct form submission (like clicking attack button)
    async initAttackForm() {
        this.csrfHash = this.getCSRFHash();
        
        if (!this.csrfHash) {
            throw new Error('CSRF hash required');
        }
        
        // This mimics clicking the attack button on place screen
        const url = `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place`;
        
        const formData = new URLSearchParams();
        formData.append('x', this.coordinates.x.toString());
        formData.append('y', this.coordinates.y.toString());
        formData.append('target', `${this.coordinates.x}|${this.coordinates.y}`);
        formData.append('type', 'attack'); // attack, raid, spy, support
        formData.append('attack', 'l');
        formData.append('h', this.csrfHash);
        
        console.log('Form data:', formData.toString());
        
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
                body: formData.toString()
            });

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                const text = await response.text();
                console.warn('HTML response received:', text.substring(0, 1000));
                
                // Try to parse as JSON anyway (sometimes TW returns JSON with wrong content-type)
                try {
                    return JSON.parse(text);
                } catch (e) {
                    throw new Error('Server returned non-JSON response');
                }
            }
            
        } catch (error) {
            console.error('Error initializing attack form:', error);
            throw error;
        }
    }

    // Step 2: Confirm attack (same as before but with error handling)
    async confirmPlaceAttack(troopSelection = {}) {
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
        
        const formData = new URLSearchParams();
        
        // Try to get dynamic field from page or use default
        let dynamicField = '79d131589f81aaeb36d2d2';
        const dynamicInput = document.querySelector('input[name*="79d13"]');
        if (dynamicInput) {
            dynamicField = dynamicInput.name;
        }
        
        formData.append(dynamicField, '7d85610179d131');
        formData.append('template_id', '');
        formData.append('source_village', this.villageId.toString());
        
        for (const [unit, count] of Object.entries(this.troops)) {
            formData.append(unit, count.toString());
        }
        
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
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include',
                referrer: `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place`,
                body: formData.toString()
            });

            const data = await response.json();
            
            if (data.response?.dialog) {
                // Parse dialog to get confirmation token
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.response.dialog, 'text/html');
                const chInput = doc.querySelector('input[name="ch"]');
                
                if (chInput?.value) {
                    this.confirmData.ch = chInput.value;
                    this.confirmData.cb = 'troop_confirm_submit';
                }
            }
            
            return data;
            
        } catch (error) {
            console.error('Error confirming attack:', error);
            throw error;
        }
    }

    // Step 3: Finalize (same as before)
    async finalizePlaceAttack() {
        if (!this.confirmData.ch) {
            throw new Error('Missing confirmation token');
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
        
        for (const [unit, count] of Object.entries(this.troops)) {
            formData.append(unit, count.toString());
        }
        
        formData.append('building', 'main');
        formData.append('h', this.csrfHash);
        formData.append('h', this.csrfHash);

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
                body: formData.toString()
            });

            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Error finalizing attack:', error);
            throw error;
        }
    }

    // Try different approaches to initialize attack
    async initializeAttack() {
        console.log('Trying approach 1: Direct form...');
        try {
            return await this.initAttackForm();
        } catch (error1) {
            console.log('Approach 1 failed:', error1.message);
            
            console.log('Trying approach 2: GET request...');
            try {
                return await this.getPlaceForm();
            } catch (error2) {
                console.log('Approach 2 failed:', error2.message);
                
                console.log('Trying approach 3: Simulate button click...');
                return await this.simulateButtonClick();
            }
        }
    }

    // Simulate clicking the attack button on place screen
    async simulateButtonClick() {
        // Look for attack button and extract its onclick data
        const attackButtons = document.querySelectorAll('button, a, input[value*="ttack"]');
        for (const button of attackButtons) {
            const onclick = button.getAttribute('onclick') || '';
            if (onclick.includes('attack') || onclick.includes('Place.')) {
                console.log('Found attack button:', button);
                
                // Extract coordinates from button if available
                const dataX = button.getAttribute('data-x') || button.getAttribute('data-target-x');
                const dataY = button.getAttribute('data-y') || button.getAttribute('data-target-y');
                
                if (dataX && dataY) {
                    this.coordinates = { x: parseInt(dataX), y: parseInt(dataY) };
                }
                
                // Try to trigger the button's click handler
                button.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Now we should have a dialog open, try to proceed
                return { success: true, method: 'button-click' };
            }
        }
        
        throw new Error('No attack button found on page');
    }

    // Main execution
    async execute(troopSelection = {}) {
        try {
            console.log('Starting place screen attack...');
            console.log('CSRF Hash:', this.csrfHash);
            console.log('Coordinates:', this.coordinates);
            
            // Step 1: Initialize
            console.log('Step 1: Initializing attack form...');
            const step1 = await this.initializeAttack();
            console.log('Step 1 result:', step1);
            
            // Step 2: Confirm
            console.log('Step 2: Confirming attack...');
            const step2 = await this.confirmPlaceAttack(troopSelection);
            console.log('Step 2 result:', step2);
            
            if (!this.confirmData.ch) {
                throw new Error('Failed to get confirmation token');
            }
            
            // Step 3: Finalize
            console.log('Step 3: Finalizing attack...');
            const step3 = await this.finalizePlaceAttack();
            console.log('Step 3 result:', step3);
            
            return {
                success: true,
                steps: { step1, step2, step3 }
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

// Utility functions
function getCurrentVillageId() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('village')) || 25034;
}

function getCurrentCSRF() {
    // Quick method: check URL
    const params = new URLSearchParams(window.location.search);
    let hash = params.get('h');
    
    if (!hash) {
        // Check page content
        const hInput = document.querySelector('input[name="h"]');
        hash = hInput?.value;
    }
    
    return hash;
}

// Simple interface
async function sendPlaceAttack(x, y, troops = {}) {
    const villageId = getCurrentVillageId();
    const attack = new TribalWarsPlaceAttack(villageId, { x, y });
    
    // Set CSRF if found
    const csrf = getCurrentCSRF();
    if (csrf) {
        attack.csrfHash = csrf;
    }
    
    return await attack.execute(troops);
}

// Debug helper
function debugPlaceScreen() {
    console.log('=== Tribal Wars Place Screen Debug ===');
    console.log('URL:', window.location.href);
    console.log('Village ID:', getCurrentVillageId());
    console.log('CSRF Hash:', getCurrentCSRF());
    console.log('Cookies present:', document.cookie.length > 0);
    
    // Check for forms
    const forms = document.querySelectorAll('form');
    console.log('Forms found:', forms.length);
    forms.forEach((form, i) => {
        console.log(`Form ${i}:`, form.action);
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.name) {
                console.log(`  ${input.name}: ${input.value}`);
            }
        });
    });
    
    // Check for attack buttons
    const attackButtons = document.querySelectorAll('[onclick*="attack"], [onclick*="Place."], [data-action="attack"]');
    console.log('Attack buttons:', attackButtons.length);
    
    return {
        villageId: getCurrentVillageId(),
        csrf: getCurrentCSRF(),
        forms: forms.length,
        attackButtons: attackButtons.length
    };
}

// Create simple UI
function createPlaceAttackUI() {
    const ui = document.createElement('div');
    ui.id = 'tw-place-attack-ui';
    ui.style.cssText = `
        position: fixed;
        top: 50px;
        right: 10px;
        background: #34495e;
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
    title.textContent = 'TW Place Attack';
    title.style.margin = '0 0 10px 0';
    title.style.color = '#3498db';
    ui.appendChild(title);
    
    // Coordinates
    const coordDiv = document.createElement('div');
    coordDiv.style.marginBottom = '10px';
    
    const xLabel = document.createElement('span');
    xLabel.textContent = 'X: ';
    xLabel.style.marginRight = '5px';
    
    const xInput = document.createElement('input');
    xInput.type = 'number';
    xInput.value = '541';
    xInput.style.width = '60px';
    xInput.style.marginRight = '10px';
    
    const yLabel = document.createElement('span');
    yLabel.textContent = 'Y: ';
    yLabel.style.marginRight = '5px';
    
    const yInput = document.createElement('input');
    yInput.type = 'number';
    yInput.value = '654';
    yInput.style.width = '60px';
    
    coordDiv.appendChild(xLabel);
    coordDiv.appendChild(xInput);
    coordDiv.appendChild(yLabel);
    coordDiv.appendChild(yInput);
    ui.appendChild(coordDiv);
    
    // Troops
    const troopDiv = document.createElement('div');
    troopDiv.style.marginBottom = '15px';
    troopDiv.innerHTML = `
        <div style="font-size: 12px; margin-bottom: 5px;">Troops:</div>
        <div style="display: flex; justify-content: space-between;">
            <span>Spear: <input type="number" value="1" min="0" style="width: 40px;"></span>
            <span>Sword: <input type="number" value="1" min="0" style="width: 40px;"></span>
        </div>
    `;
    ui.appendChild(troopDiv);
    
    // Buttons
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '5px';
    
    // Attack button
    const attackBtn = document.createElement('button');
    attackBtn.textContent = 'Attack';
    attackBtn.style.cssText = `
        flex: 1;
        background: #e74c3c;
        color: white;
        border: none;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    `;
    attackBtn.onclick = async () => {
        attackBtn.disabled = true;
        attackBtn.textContent = 'Sending...';
        
        try {
            const result = await sendPlaceAttack(
                parseInt(xInput.value),
                parseInt(yInput.value),
                {
                    spear: 1,
                    sword: 1
                }
            );
            
            if (result.success) {
                alert('✅ Attack sent!');
            } else {
                alert('❌ Failed: ' + result.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            attackBtn.disabled = false;
            attackBtn.textContent = 'Attack';
        }
    };
    
    // Debug button
    const debugBtn = document.createElement('button');
    debugBtn.textContent = 'Debug';
    debugBtn.style.cssText = `
        background: #3498db;
        color: white;
        border: none;
        padding: 8px;
        border-radius: 4px;
        cursor: pointer;
    `;
    debugBtn.onclick = () => {
        console.log('=== Debug Info ===');
        debugPlaceScreen();
        alert('Check console for debug info');
    };
    
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
    
    btnContainer.appendChild(attackBtn);
    btnContainer.appendChild(debugBtn);
    ui.appendChild(btnContainer);
    ui.appendChild(closeBtn);
    
    document.body.appendChild(ui);
    
    console.log('Place Attack UI loaded. Use sendPlaceAttack(x, y) or click button.');
}

// Auto-initialize on place screen
function initPlaceAttack() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('screen') === 'place') {
        console.log('Place screen detected.');
        
        // Wait for page to load
        setTimeout(() => {
            createPlaceAttackUI();
            
            // Also add global helper
            window.twAttack = {
                send: sendPlaceAttack,
                debug: debugPlaceScreen,
                getCSRF: getCurrentCSRF
            };
            
            console.log('TW Attack tools ready. Use:');
            console.log('twAttack.send(541, 654, {spear: 1, sword: 1})');
            console.log('twAttack.debug() - for troubleshooting');
        }, 2000);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlaceAttack);
} else {
    initPlaceAttack();
}

// Export for console use
window.TribalWarsPlaceAttack = TribalWarsPlaceAttack;
window.sendPlaceAttack = sendPlaceAttack;
window.debugPlaceScreen = debugPlaceScreen;

// Quick test
console.log('Place Attack Script loaded. Use:');
console.log('sendPlaceAttack(541, 654)');
console.log('debugPlaceScreen() - to check current page state');
