// Tribal Wars Attack from Rally Point (place screen)
class RallyPointAttack {
    constructor(villageId, targetId, coordinates) {
        this.villageId = villageId;
        this.targetId = targetId;
        this.coordinates = coordinates; // {x: 541, y: 654}
        this.csrfHash = null;
        this.troops = {};
        this.confirmData = {};
        this.attackType = 'attack'; // attack, raid, support, spy
    }

    // Extract CSRF hash from current page (place screen)
    extractCSRFHash() {
        // Method 1: From place screen specific elements
        const hashInput = document.querySelector('input[name="h"]');
        if (hashInput && hashInput.value) {
            return hashInput.value;
        }
        
        // Method 2: From form actions
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const action = form.getAttribute('action') || '';
            const match = action.match(/h=([a-f0-9]+)/);
            if (match) return match[1];
        }
        
        // Method 3: From command buttons/links
        const commandLinks = document.querySelectorAll('a[href*="place"]');
        for (const link of commandLinks) {
            const href = link.href;
            const match = href.match(/h=([a-f0-9]+)/);
            if (match) return match[1];
        }
        
        console.warn('CSRF hash not found on place screen');
        return null;
    }

    // Get available units from place screen
    getAvailableUnits() {
        const units = {};
        const unitTypes = ['spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult', 'knight', 'snob'];
        
        unitTypes.forEach(unit => {
            const unitElement = document.querySelector(`.unit_${unit} .unit-count`);
            if (unitElement) {
                const count = parseInt(unitElement.textContent.trim()) || 0;
                units[unit] = count;
            }
        });
        
        return units;
    }

    // Step 1: Initialize attack from place screen
    async initPlaceAttack() {
        const url = `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place`;
        
        // Get CSRF hash from page
        this.csrfHash = this.extractCSRFHash();
        if (!this.csrfHash) {
            throw new Error('Could not get CSRF hash from place screen');
        }
        
        // Prepare form data for place screen (different from farm screen)
        const formData = new URLSearchParams();
        
        // These are the parameters for place screen
        formData.append('x', this.coordinates.x.toString());
        formData.append('y', this.coordinates.y.toString());
        formData.append('target_type', 'coord');
        formData.append('target', `${this.coordinates.x}|${this.coordinates.y}`);
        formData.append('attack', 'l'); // l=attack, r=raid, s=spy, u=support
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

            if (!response.ok) {
                throw new Error(`Place init failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Parse response to get dynamic form data
            if (data.response && data.response.dialog) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.response.dialog, 'text/html');
                
                // Extract hidden inputs
                const inputs = doc.querySelectorAll('input[type="hidden"]');
                const formData = {};
                inputs.forEach(input => {
                    if (input.name && input.value !== undefined) {
                        formData[input.name] = input.value;
                    }
                });
                
                // Update CSRF hash if new one provided
                if (formData.h) {
                    this.csrfHash = formData.h;
                }
                
                // Get the dynamic form field name (usually something like "79d131589f81aaeb36d2d2")
                const dynamicField = Object.keys(formData).find(key => 
                    key.length === 32 && /^[a-f0-9]+$/.test(key)
                );
                
                if (dynamicField) {
                    this.confirmData.dynamicField = {
                        name: dynamicField,
                        value: formData[dynamicField]
                    };
                }
                
                // Extract available units from response
                const unitScript = data.response.dialog.match(/available_units":\{[^}]+\}/);
                if (unitScript) {
                    try {
                        const jsonStr = unitScript[0].replace('available_units":', '"available_units":');
                        const fullJson = JSON.parse(`{${jsonStr}}`);
                        this.availableUnits = fullJson.available_units;
                    } catch (e) {
                        console.warn('Could not parse available units');
                    }
                }
            }
            
            return data;
            
        } catch (error) {
            console.error('Error initializing place attack:', error);
            throw error;
        }
    }

    // Step 2: Confirm attack with troop selection
    async confirmPlaceAttack(troopSelection = {}) {
        // Default troop selection
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
        
        // Merge with provided selection
        this.troops = { ...defaultTroops, ...troopSelection };
        
        const url = `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place&ajax=confirm`;
        
        // Prepare form data
        const formData = new URLSearchParams();
        
        // Add dynamic form field if available
        if (this.confirmData.dynamicField) {
            formData.append(this.confirmData.dynamicField.name, this.confirmData.dynamicField.value);
        } else {
            // Fallback to typical field name
            formData.append('79d131589f81aaeb36d2d2', '7d85610179d131');
        }
        
        // Add basic parameters
        formData.append('template_id', '');
        formData.append('source_village', this.villageId.toString());
        
        // Add troop counts
        for (const [unit, count] of Object.entries(this.troops)) {
            formData.append(unit, count.toString());
        }
        
        // Add coordinates and attack type
        formData.append('x', this.coordinates.x.toString());
        formData.append('y', this.coordinates.y.toString());
        formData.append('input', '');
        formData.append('attack', 'l'); // Attack type
        
        // Add CSRF hash
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

            if (!response.ok) {
                throw new Error(`Place confirm failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Extract confirmation data
            if (data.response && data.response.dialog) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.response.dialog, 'text/html');
                
                // Get ch value (confirmation token)
                const chInput = doc.querySelector('input[name="ch"]');
                if (chInput) {
                    this.confirmData.ch = chInput.value;
                }
                
                // cb value is typically 'troop_confirm_submit' for place screen
                this.confirmData.cb = 'troop_confirm_submit';
                
                // Update CSRF hash if present
                const hInput = doc.querySelector('input[name="h"]');
                if (hInput && hInput.value) {
                    this.csrfHash = hInput.value;
                }
            }
            
            return data;
            
        } catch (error) {
            console.error('Error confirming place attack:', error);
            throw error;
        }
    }

    // Step 3: Finalize the attack
    async finalizePlaceAttack() {
        if (!this.confirmData.ch) {
            throw new Error('Missing confirmation token (ch). Run step 2 first.');
        }

        const url = `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place&ajaxaction=popup_command`;

        // Prepare form data
        const formData = new URLSearchParams();
        formData.append('attack', 'true');
        formData.append('ch', this.confirmData.ch);
        formData.append('cb', this.confirmData.cb);
        formData.append('x', this.coordinates.x.toString());
        formData.append('y', this.coordinates.y.toString());
        formData.append('source_village', this.villageId.toString());
        formData.append('village', this.villageId.toString());
        
        // Add troop counts
        for (const [unit, count] of Object.entries(this.troops)) {
            formData.append(unit, count.toString());
        }
        
        formData.append('building', 'main');
        
        // Add CSRF hash (twice)
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

            if (!response.ok) {
                throw new Error(`Finalize failed: ${response.status}`);
            }

            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Error finalizing place attack:', error);
            throw error;
        }
    }

    // Complete attack sequence from place screen
    async launchFromPlace(troopSelection = {}) {
        try {
            console.log('Step 1: Initializing from place screen...');
            const step1 = await this.initPlaceAttack();
            console.log('Step 1 complete, CSRF:', this.csrfHash);
            
            console.log('Step 2: Confirming attack...');
            const step2 = await this.confirmPlaceAttack(troopSelection);
            console.log('Step 2 complete, confirmation token:', this.confirmData.ch ? 'Yes' : 'No');
            
            console.log('Step 3: Finalizing attack...');
            const step3 = await this.finalizePlaceAttack();
            console.log('Step 3 complete');
            
            return {
                success: true,
                csrfHash: this.csrfHash,
                confirmData: this.confirmData,
                troops: this.troops,
                step1: step1,
                step2: step2,
                step3: step3
            };
            
        } catch (error) {
            console.error('Place attack failed:', error);
            return {
                success: false,
                error: error.message,
                csrfHash: this.csrfHash,
                confirmData: this.confirmData
            };
        }
    }
}

// Alternative: Direct place attack using observed parameters
async function sendPlaceAttackDirect(targetCoords, troopCounts = {}) {
    const villageId = parseInt(new URLSearchParams(window.location.search).get('village')) || 25034;
    const csrfHash = document.querySelector('input[name="h"]')?.value;
    
    if (!csrfHash) {
        throw new Error('CSRF hash not found. Are you on the place screen?');
    }
    
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
    
    const troops = { ...defaultTroops, ...troopCounts };
    
    try {
        // Step 1: Initialize attack
        console.log('Initializing attack...');
        const initResponse = await fetch(`https://en152.tribalwars.net/game.php?village=${villageId}&screen=place`, {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'ru,en;q=0.9',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'tribalwars-ajax': '1',
                'x-requested-with': 'XMLHttpRequest'
            },
            credentials: 'include',
            body: `x=${targetCoords.x}&y=${targetCoords.y}&target_type=coord&target=${targetCoords.x}|${targetCoords.y}&attack=l&h=${csrfHash}`
        });
        
        const initData = await initResponse.json();
        console.log('Init complete');
        
        // Step 2: Confirm attack
        console.log('Confirming attack...');
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
            body: `79d131589f81aaeb36d2d2=7d85610179d131&template_id=&source_village=${villageId}&spear=${troops.spear}&sword=${troops.sword}&axe=${troops.axe}&archer=${troops.archer}&spy=${troops.spy}&light=${troops.light}&marcher=${troops.marcher}&heavy=${troops.heavy}&ram=${troops.ram}&catapult=${troops.catapult}&knight=${troops.knight}&snob=${troops.snob}&x=${targetCoords.x}&y=${targetCoords.y}&input=&attack=l&h=${csrfHash}`
        });
        
        const confirmData = await confirmResponse.json();
        
        // Extract ch value
        let chValue = '';
        if (confirmData.response?.dialog) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = confirmData.response.dialog;
            const chInput = tempDiv.querySelector('input[name="ch"]');
            chValue = chInput?.value || '';
        }
        
        if (!chValue) {
            throw new Error('Could not extract confirmation token');
        }
        
        console.log('Confirm complete, token extracted');
        
        // Step 3: Finalize
        console.log('Finalizing attack...');
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
            body: `attack=true&ch=${encodeURIComponent(chValue)}&cb=troop_confirm_submit&x=${targetCoords.x}&y=${targetCoords.y}&source_village=${villageId}&village=${villageId}&spear=${troops.spear}&sword=${troops.sword}&axe=${troops.axe}&archer=${troops.archer}&spy=${troops.spy}&light=${troops.light}&marcher=${troops.marcher}&heavy=${troops.heavy}&ram=${troops.ram}&catapult=${troops.catapult}&knight=${troops.knight}&snob=${troops.snob}&building=main&h=${csrfHash}&h=${csrfHash}`
        });
        
        const finalizeData = await finalizeResponse.json();
        console.log('Finalize complete');
        
        return {
            success: true,
            data: finalizeData
        };
        
    } catch (error) {
        console.error('Direct place attack failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// UI for place screen attacks
function addPlaceAttackUI() {
    // Remove existing UI if any
    const existingUI = document.getElementById('tw-place-attack-ui');
    if (existingUI) existingUI.remove();
    
    // Create UI container
    const ui = document.createElement('div');
    ui.id = 'tw-place-attack-ui';
    ui.style.cssText = `
        position: fixed;
        top: 100px;
        right: 10px;
        z-index: 9999;
        background: rgba(255, 255, 255, 0.95);
        border: 2px solid #4CAF50;
        border-radius: 10px;
        padding: 15px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        width: 300px;
        font-family: Arial, sans-serif;
    `;
    
    // Title
    const title = document.createElement('h3');
    title.textContent = '🚀 Rally Point Attack';
    title.style.cssText = 'margin-top: 0; color: #2c3e50; text-align: center;';
    ui.appendChild(title);
    
    // Coordinates input
    const coordDiv = document.createElement('div');
    coordDiv.style.marginBottom = '10px';
    
    const xLabel = document.createElement('label');
    xLabel.textContent = 'X:';
    xLabel.style.marginRight = '5px';
    
    const xInput = document.createElement('input');
    xInput.type = 'number';
    xInput.id = 'tw-attack-x';
    xInput.value = '541';
    xInput.style.width = '80px';
    xInput.style.marginRight = '15px';
    
    const yLabel = document.createElement('label');
    yLabel.textContent = 'Y:';
    yLabel.style.marginRight = '5px';
    
    const yInput = document.createElement('input');
    yInput.type = 'number';
    yInput.id = 'tw-attack-y';
    yInput.value = '654';
    yInput.style.width = '80px';
    
    coordDiv.appendChild(xLabel);
    coordDiv.appendChild(xInput);
    coordDiv.appendChild(yLabel);
    coordDiv.appendChild(yInput);
    ui.appendChild(coordDiv);
    
    // Troop selection (simplified)
    const troopDiv = document.createElement('div');
    troopDiv.style.marginBottom = '15px';
    
    const troops = [
        { id: 'spear', label: 'Spear', default: 1 },
        { id: 'sword', label: 'Sword', default: 1 },
        { id: 'axe', label: 'Axe', default: 0 },
        { id: 'archer', label: 'Archer', default: 0 }
    ];
    
    troops.forEach(troop => {
        const troopRow = document.createElement('div');
        troopRow.style.display = 'flex';
        troopRow.style.justifyContent = 'space-between';
        troopRow.style.marginBottom = '5px';
        
        const label = document.createElement('label');
        label.textContent = troop.label;
        label.style.flex = '1';
        
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `tw-${troop.id}`;
        input.value = troop.default;
        input.style.width = '60px';
        input.min = '0';
        
        troopRow.appendChild(label);
        troopRow.appendChild(input);
        troopDiv.appendChild(troopRow);
    });
    
    ui.appendChild(troopDiv);
    
    // Attack type selector
    const typeDiv = document.createElement('div');
    typeDiv.style.marginBottom = '15px';
    
    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Attack Type: ';
    typeLabel.style.marginRight = '10px';
    
    const typeSelect = document.createElement('select');
    typeSelect.id = 'tw-attack-type';
    typeSelect.innerHTML = `
        <option value="l">Normal Attack</option>
        <option value="r">Raid</option>
        <option value="s">Spy</option>
        <option value="u">Support</option>
    `;
    
    typeDiv.appendChild(typeLabel);
    typeDiv.appendChild(typeSelect);
    ui.appendChild(typeDiv);
    
    // Attack button
    const attackBtn = document.createElement('button');
    attackBtn.textContent = 'Send Attack';
    attackBtn.style.cssText = `
        width: 100%;
        padding: 10px;
        background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        transition: background 0.3s;
    `;
    
    attackBtn.onmouseover = () => {
        attackBtn.style.background = 'linear-gradient(135deg, #45a049 0%, #1b5e20 100%)';
    };
    
    attackBtn.onmouseout = () => {
        attackBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)';
    };
    
    attackBtn.onclick = async () => {
        const coordinates = {
            x: parseInt(xInput.value),
            y: parseInt(yInput.value)
        };
        
        const troopSelection = {
            spear: parseInt(document.getElementById('tw-spear').value) || 0,
            sword: parseInt(document.getElementById('tw-sword').value) || 0,
            axe: parseInt(document.getElementById('tw-axe').value) || 0,
            archer: parseInt(document.getElementById('tw-archer').value) || 0
        };
        
        const villageId = parseInt(new URLSearchParams(window.location.search).get('village')) || 25034;
        
        attackBtn.disabled = true;
        attackBtn.textContent = 'Sending...';
        
        try {
            const attack = new RallyPointAttack(villageId, null, coordinates);
            const result = await attack.launchFromPlace(troopSelection);
            
            if (result.success) {
                alert('✅ Attack sent successfully!');
                console.log('Attack result:', result);
            } else {
                alert('❌ Attack failed: ' + result.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            attackBtn.disabled = false;
            attackBtn.textContent = 'Send Attack';
        }
    };
    
    ui.appendChild(attackBtn);
    
    // Quick test button
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Test with Defaults';
    testBtn.style.cssText = `
        width: 100%;
        padding: 8px;
        margin-top: 10px;
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
    `;
    
    testBtn.onclick = async () => {
        const result = await sendPlaceAttackDirect({ x: 541, y: 654 });
        console.log('Test result:', result);
        alert(result.success ? 'Test successful!' : 'Test failed: ' + result.error);
    };
    
    ui.appendChild(testBtn);
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        cursor: pointer;
        font-size: 12px;
        line-height: 1;
    `;
    
    closeBtn.onclick = () => ui.remove();
    ui.appendChild(closeBtn);
    
    document.body.appendChild(ui);
    
    console.log('Rally Point Attack UI loaded');
}

// Auto-initialize on place screen
function initPlaceAttackScript() {
    const urlParams = new URLSearchParams(window.location.search);
    const screen = urlParams.get('screen');
    
    if (screen === 'place') {
        console.log('Place screen detected. Loading attack script...');
        addPlaceAttackUI();
    }
}

// Export functions for console use
window.RallyPointAttack = RallyPointAttack;
window.sendPlaceAttackDirect = sendPlaceAttackDirect;
window.addPlaceAttackUI = addPlaceAttackUI;

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlaceAttackScript);
} else {
    initPlaceAttackScript();
}

// Usage examples for console:
/*
// Example 1: Using the class
const attack = new RallyPointAttack(25034, null, {x: 541, y: 654});
const result = await attack.launchFromPlace({spear: 2, sword: 1});

// Example 2: Direct function
const result = await sendPlaceAttackDirect({x: 541, y: 654}, {spear: 1, sword: 1});

// Example 3: Show UI
addPlaceAttackUI();
*/
