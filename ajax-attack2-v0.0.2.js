// Main class to handle attack coordination - FIXED VERSION
class TribalWarsAttack {
    constructor(villageId, targetId, coordinates) {
        this.villageId = villageId;
        this.targetId = targetId;
        this.coordinates = coordinates; // {x: 541, y: 654}
        this.csrfHash = null;
        this.troops = {}; // Store troop counts
        this.confirmData = {}; // Store confirmation data
        this.dynamicFormField = null; // Store dynamic form field name
    }

    // Extract CSRF hash from response or page
    extractCSRFHash(html = null) {
        if (html) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const hashInput = tempDiv.querySelector('input[name="h"]');
            if (hashInput && hashInput.value) {
                return hashInput.value;
            }
            
            // Also check in forms
            const forms = tempDiv.querySelectorAll('form');
            for (const form of forms) {
                const action = form.getAttribute('action') || '';
                const match = action.match(/h=([a-f0-9]+)/);
                if (match) return match[1];
            }
        }
        
        // Fallback to page extraction
        const hashInput = document.querySelector('input[name="h"]');
        if (hashInput && hashInput.value) {
            return hashInput.value;
        }
        
        // Check URL
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('h');
    }

    // Parse form data from response
    parseFormData(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const formData = {};
        
        // Extract all hidden inputs
        const inputs = doc.querySelectorAll('input[type="hidden"]');
        inputs.forEach(input => {
            if (input.name && input.value !== undefined) {
                formData[input.name] = input.value;
            }
        });
        
        return formData;
    }

    // Step 1: Get attack form data - IMPROVED
    async getAttackForm() {
        const url = `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place&ajax=command&target=${this.targetId}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'ru,en;q=0.9',
                    'priority': 'u=1, i',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include',
                referrer: `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=am_farm&target=${this.targetId}`
            });

            if (!response.ok) {
                throw new Error(`Step 1 failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Extract CSRF hash
            if (data.response && data.response.dialog) {
                this.csrfHash = this.extractCSRFHash(data.response.dialog);
                
                // Parse form data to get any dynamic field names
                const formData = this.parseFormData(data.response.dialog);
                if (Object.keys(formData).length > 0) {
                    // Look for dynamic field names (not standard troop names)
                    const standardFields = ['h', 'x', 'y', 'attack', 'ch', 'cb', 'submit'];
                    for (const key in formData) {
                        if (!standardFields.includes(key) && 
                            !['spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult', 'knight', 'snob'].includes(key)) {
                            this.dynamicFormField = key;
                            break;
                        }
                    }
                }
            }
            
            return data;
            
        } catch (error) {
            console.error('Error in Step 1:', error);
            throw error;
        }
    }

    // Step 2: Confirm attack with troop selection - FIXED
    async confirmAttack(troopSelection = {}) {
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
        
        // Add dynamic form field if we have it (from original example: 79d131589f81aaeb36d2d2)
        if (this.dynamicFormField) {
            formData.append(this.dynamicFormField, '7d85610179d131');
        } else {
            // Fallback to the field from your example
            formData.append('79d131589f81aaeb36d2d2', '7d85610179d131');
        }
        
        // Add troop data
        formData.append('template_id', '');
        formData.append('source_village', this.villageId.toString());
        
        for (const [unit, count] of Object.entries(this.troops)) {
            formData.append(unit, count.toString());
        }
        
        // Add coordinates and attack type
        formData.append('x', this.coordinates.x.toString());
        formData.append('y', this.coordinates.y.toString());
        formData.append('input', '');
        formData.append('attack', 'l'); // 'l' for attack
        
        // Add CSRF hash
        if (!this.csrfHash) {
            this.csrfHash = this.extractCSRFHash();
        }
        formData.append('h', this.csrfHash);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'ru,en;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'priority': 'u=1, i',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include',
                referrer: `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=am_farm&target=${this.targetId}`,
                body: formData.toString()
            });

            if (!response.ok) {
                throw new Error(`Step 2 failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Extract confirmation data from response
            if (data.response && data.response.dialog) {
                const formData = this.parseFormData(data.response.dialog);
                
                // Get ch value
                if (formData.ch) {
                    this.confirmData.ch = formData.ch;
                }
                
                // Get cb value - in your original request it was 'troop_confirm_submit'
                // In the HTML it's empty, but we need to use the button name
                this.confirmData.cb = 'troop_confirm_submit';
                
                // Also update CSRF hash if present in response
                if (formData.h) {
                    this.csrfHash = formData.h;
                }
                
                // Update troop counts from response if different
                const troopFields = ['spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult', 'knight', 'snob'];
                troopFields.forEach(unit => {
                    if (formData[unit] !== undefined) {
                        this.troops[unit] = parseInt(formData[unit]) || 0;
                    }
                });
            }
            
            return data;
            
        } catch (error) {
            console.error('Error in Step 2:', error);
            throw error;
        }
    }

    // Step 3: Finalize the attack - FIXED
    async finalizeAttack() {
        if (!this.confirmData.ch) {
            throw new Error('Missing confirmation token (ch). Run step 2 first.');
        }

        const url = `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place&ajaxaction=popup_command`;

        // Prepare form data - matching exactly your successful request
        const formData = new URLSearchParams();
        formData.append('attack', 'true');
        formData.append('ch', this.confirmData.ch);
        formData.append('cb', this.confirmData.cb || 'troop_confirm_submit');
        formData.append('x', this.coordinates.x.toString());
        formData.append('y', this.coordinates.y.toString());
        formData.append('source_village', this.villageId.toString());
        formData.append('village', this.villageId.toString());
        
        // Add troop counts
        for (const [unit, count] of Object.entries(this.troops)) {
            formData.append(unit, count.toString());
        }
        
        formData.append('building', 'main');
        
        // Add CSRF hash - twice as in your example
        if (this.csrfHash) {
            formData.append('h', this.csrfHash);
            formData.append('h', this.csrfHash); // Duplicate as in original
        } else {
            // Get fresh hash
            this.csrfHash = this.extractCSRFHash();
            if (this.csrfHash) {
                formData.append('h', this.csrfHash);
                formData.append('h', this.csrfHash);
            }
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'ru,en;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'priority': 'u=1, i',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include',
                referrer: `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=am_farm&target=${this.targetId}`,
                body: formData.toString()
            });

            if (!response.ok) {
                throw new Error(`Step 3 failed: ${response.status}`);
            }

            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('Error in Step 3:', error);
            throw error;
        }
    }

    // Complete attack sequence
    async launchAttack(troopSelection = {}) {
        try {
            console.log('Step 1: Getting attack form...');
            const step1 = await this.getAttackForm();
            console.log('Step 1 complete, CSRF hash:', this.csrfHash);
            
            console.log('Step 2: Confirming attack with troops...');
            const step2 = await this.confirmAttack(troopSelection);
            console.log('Step 2 complete, confirmation data:', this.confirmData);
            
            console.log('Step 3: Finalizing attack...');
            const step3 = await this.finalizeAttack();
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
            console.error('Attack failed:', error);
            return {
                success: false,
                error: error.message,
                csrfHash: this.csrfHash,
                confirmData: this.confirmData
            };
        }
    }
}

// Alternative: Direct approach based on your exact requests
async function sendDirectAttack() {
    const villageId = 25034;
    const targetId = 24577;
    const csrfHash = '683500cb'; // You need to get this fresh
    
    try {
        console.log('Step 1: Getting command form...');
        const step1 = await fetch(`https://en152.tribalwars.net/game.php?village=${villageId}&screen=place&ajax=command&target=${targetId}`, {
            method: 'GET',
            headers: {
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'ru,en;q=0.9',
                'tribalwars-ajax': '1',
                'x-requested-with': 'XMLHttpRequest'
            },
            credentials: 'include',
            referrer: `https://en152.tribalwars.net/game.php?village=${villageId}&screen=am_farm&target=${targetId}`
        });
        
        const step1Data = await step1.json();
        console.log('Step 1 complete');
        
        console.log('Step 2: Confirming attack...');
        const step2 = await fetch(`https://en152.tribalwars.net/game.php?village=${villageId}&screen=place&ajax=confirm`, {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'ru,en;q=0.9',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'tribalwars-ajax': '1',
                'x-requested-with': 'XMLHttpRequest'
            },
            credentials: 'include',
            referrer: `https://en152.tribalwars.net/game.php?village=${villageId}&screen=am_farm&target=${targetId}`,
            body: `79d131589f81aaeb36d2d2=7d85610179d131&template_id=&source_village=${villageId}&spear=1&sword=1&axe=0&archer=0&spy=0&light=0&marcher=0&heavy=0&ram=0&catapult=0&knight=0&snob=0&x=541&y=654&input=&attack=l&h=${csrfHash}`
        });
        
        const step2Data = await step2.json();
        console.log('Step 2 complete');
        
        // Extract ch from response
        let chValue = '';
        if (step2Data.response && step2Data.response.dialog) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = step2Data.response.dialog;
            const chInput = tempDiv.querySelector('input[name="ch"]');
            if (chInput) {
                chValue = chInput.value;
            }
        }
        
        if (!chValue) {
            throw new Error('Could not extract ch value from response');
        }
        
        console.log('Step 3: Sending final attack...');
        const step3 = await fetch(`https://en152.tribalwars.net/game.php?village=${villageId}&screen=place&ajaxaction=popup_command`, {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'ru,en;q=0.9',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'tribalwars-ajax': '1',
                'x-requested-with': 'XMLHttpRequest'
            },
            credentials: 'include',
            referrer: `https://en152.tribalwars.net/game.php?village=${villageId}&screen=am_farm&target=${targetId}`,
            body: `attack=true&ch=${encodeURIComponent(chValue)}&cb=troop_confirm_submit&x=541&y=654&source_village=${villageId}&village=${villageId}&spear=1&sword=1&axe=0&archer=0&spy=0&light=0&marcher=0&heavy=0&ram=0&catapult=0&knight=0&snob=0&building=main&h=${csrfHash}&h=${csrfHash}`
        });
        
        const step3Data = await step3.json();
        console.log('Step 3 complete');
        
        return {
            success: true,
            step1: step1Data,
            step2: step2Data,
            step3: step3Data
        };
        
    } catch (error) {
        console.error('Direct attack failed:', error);
        throw error;
    }
}

// Get fresh CSRF hash from current page
function getCurrentCSRFHash() {
    // Method 1: From form inputs
    const hashInput = document.querySelector('input[name="h"]');
    if (hashInput && hashInput.value) {
        return hashInput.value;
    }
    
    // Method 2: From URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlHash = urlParams.get('h');
    if (urlHash) return urlHash;
    
    // Method 3: From farm links
    const farmLinks = document.querySelectorAll('a[href*="target="]');
    for (const link of farmLinks) {
        const href = link.href;
        const match = href.match(/h=([a-f0-9]+)/);
        if (match) return match[1];
    }
    
    console.warn('No CSRF hash found on page');
    return null;
}

// Simple wrapper function
async function executeAttack() {
    const villageId = 25034;
    const targetId = 24577;
    const coordinates = { x: 541, y: 654 };
    
    // Get fresh CSRF hash
    const csrfHash = getCurrentCSRFHash();
    if (!csrfHash) {
        alert('Please navigate to a Tribal Wars page first to get CSRF token');
        return;
    }
    
    console.log('Using CSRF hash:', csrfHash);
    
    // Create attack instance
    const attack = new TribalWarsAttack(villageId, targetId, coordinates);
    attack.csrfHash = csrfHash;
    
    // Set dynamic form field (you might need to extract this differently)
    attack.dynamicFormField = '79d131589f81aaeb36d2d2';
    
    try {
        const result = await attack.launchAttack();
        
        if (result.success) {
            console.log('✅ Attack launched successfully!');
            alert('Attack sent successfully!');
        } else {
            console.error('❌ Attack failed:', result.error);
            alert('Attack failed: ' + result.error);
        }
        
        return result;
        
    } catch (error) {
        console.error('Attack execution error:', error);
        alert('Error: ' + error.message);
        throw error;
    }
}

// Quick test function using direct approach
async function testDirectAttack() {
    const csrfHash = getCurrentCSRFHash();
    if (!csrfHash) {
        console.error('No CSRF hash found');
        return;
    }
    
    console.log('Testing with CSRF hash:', csrfHash);
    
    try {
        const result = await sendDirectAttack();
        console.log('Test successful:', result);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Add UI controls
function addAttackControls() {
    // Remove existing button if any
    const existingBtn = document.getElementById('tw-attack-btn');
    if (existingBtn) existingBtn.remove();
    
    // Create button
    const button = document.createElement('button');
    button.id = 'tw-attack-btn';
    button.textContent = '🚀 Send Attack';
    button.style.cssText = `
        position: fixed;
        top: 60px;
        right: 10px;
        z-index: 9999;
        padding: 10px 15px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
    `;
    
    button.onmouseover = () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 6px 8px rgba(0,0,0,0.15)';
    };
    
    button.onmouseout = () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    };
    
    button.onclick = executeAttack;
    
    document.body.appendChild(button);
    
    console.log('Attack controls added. Click the purple button to send attack.');
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addAttackControls);
} else {
    addAttackControls();
}

// Export for console use
window.TribalWarsAttack = TribalWarsAttack;
window.executeAttack = executeAttack;
window.testDirectAttack = testDirectAttack;
window.getCurrentCSRFHash = getCurrentCSRFHash;
