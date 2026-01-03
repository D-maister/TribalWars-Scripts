// Main class to handle attack coordination
class TribalWarsAttack {
    constructor(villageId, targetId, coordinates) {
        this.villageId = villageId;
        this.targetId = targetId;
        this.coordinates = coordinates; // {x: 541, y: 654}
        this.csrfHash = null;
        this.troops = {}; // Store troop counts
        this.confirmData = {}; // Store confirmation data
    }

    // Utility function to extract CSRF hash from page
    extractCSRFHash() {
        // Try different methods to get CSRF hash
        const hashInput = document.querySelector('input[name="h"]');
        if (hashInput && hashInput.value) {
            return hashInput.value;
        }
        
        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const urlHash = urlParams.get('h');
        if (urlHash) return urlHash;
        
        // Check for hash in links
        const attackLinks = document.querySelectorAll('a[href*="target="]');
        if (attackLinks.length > 0) {
            const href = attackLinks[0].href;
            const match = href.match(/h=([a-f0-9]+)/);
            if (match) return match[1];
        }
        
        console.warn('Could not extract CSRF hash automatically');
        return null;
    }

    // Step 1: Get attack form data
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
            
            // Extract CSRF hash from response if available
            if (data.html) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = data.html;
                const hashInput = tempDiv.querySelector('input[name="h"]');
                if (hashInput) {
                    this.csrfHash = hashInput.value;
                }
            }
            
            return data;
            
        } catch (error) {
            console.error('Error in Step 1:', error);
            throw error;
        }
    }

    // Step 2: Confirm attack with troop selection
    async confirmAttack(troopSelection = {}) {
        // Default troop selection (modify as needed)
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
        
        // Add dynamic form field name (from step 1 response usually)
        // You might need to extract this from the previous response
        formData.append('79d131589f81aaeb36d2d2', '7d85610179d131');
        
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
        formData.append('attack', 'l'); // 'l' for attack, 'r' for raid, 's' for spy
        
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
            
            // Extract confirmation token/ch value for step 3
            if (data.html) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = data.html;
                const chInput = tempDiv.querySelector('input[name="ch"]');
                const cbInput = tempDiv.querySelector('input[name="cb"]');
                
                if (chInput && cbInput) {
                    this.confirmData = {
                        ch: chInput.value,
                        cb: cbInput.value
                    };
                }
            }
            
            return data;
            
        } catch (error) {
            console.error('Error in Step 2:', error);
            throw error;
        }
    }

    // Step 3: Finalize the attack
    async finalizeAttack() {
        if (!this.confirmData.ch || !this.confirmData.cb) {
            throw new Error('Missing confirmation data. Run step 2 first.');
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
        
        // Add CSRF hash (twice as in the example)
        if (this.csrfHash) {
            formData.append('h', this.csrfHash);
            formData.append('h', this.csrfHash);
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
            console.log('Step 1 complete:', step1);
            
            // Optional: Parse step1 response to get actual form field names
            // This would require analyzing the HTML response
            
            console.log('Step 2: Confirming attack with troops...');
            const step2 = await this.confirmAttack(troopSelection);
            console.log('Step 2 complete:', step2);
            
            console.log('Step 3: Finalizing attack...');
            const step3 = await this.finalizeAttack();
            console.log('Step 3 complete:', step3);
            
            return {
                success: true,
                step1: step1,
                step2: step2,
                step3: step3
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

// Alternative: Simplified function-based approach
async function sendAttack(villageId, targetId, coordinates, troopSelection = {}, csrfHash = null) {
    const attack = new TribalWarsAttack(villageId, targetId, coordinates);
    
    if (csrfHash) {
        attack.csrfHash = csrfHash;
    }
    
    return await attack.launchAttack(troopSelection);
}

// Helper function to extract dynamic form data from step 1 response
function parseAttackForm(htmlResponse) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlResponse, 'text/html');
    
    const form = doc.querySelector('form[action*="ajax=confirm"]');
    if (!form) return null;
    
    const formData = {};
    
    // Extract all form inputs
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        if (input.name && input.value) {
            formData[input.name] = input.value;
        }
    });
    
    return formData;
}

// Example usage
async function executeFullAttack() {
    const villageId = 25034;
    const targetId = 24577;
    const coordinates = { x: 541, y: 654 };
    
    // Try to get CSRF hash automatically first
    let csrfHash = null;
    
    // Method 1: Extract from page
    const hashInput = document.querySelector('input[name="h"]');
    if (hashInput) {
        csrfHash = hashInput.value;
    }
    
    // Method 2: You might have it from previous operations
    // csrfHash = '683500cb'; // Your known hash
    
    // Custom troop selection (optional)
    const troopSelection = {
        spear: 1,
        sword: 1,
        axe: 0,
        // ... other troops
    };
    
    try {
        console.log('Starting attack sequence...');
        
        // Using the class-based approach
        const attack = new TribalWarsAttack(villageId, targetId, coordinates);
        
        if (csrfHash) {
            attack.csrfHash = csrfHash;
        }
        
        const result = await attack.launchAttack(troopSelection);
        
        if (result.success) {
            console.log('Attack launched successfully!');
            // Check for success indicators
            if (result.step3 && result.step3.error === false) {
                console.log('Attack confirmed by server');
            }
        } else {
            console.error('Attack failed:', result.error);
        }
        
        return result;
        
    } catch (error) {
        console.error('Failed to execute attack:', error);
        throw error;
    }
}

// Batch attack multiple targets
async function batchAttack(targets) {
    const results = [];
    
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        
        console.log(`Attacking target ${i + 1}/${targets.length}: ${target.id}`);
        
        try {
            // Add delay to avoid rate limiting (adjust as needed)
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            const attack = new TribalWarsAttack(
                target.villageId || 25034, // Default to current village
                target.id,
                target.coordinates
            );
            
            const result = await attack.launchAttack(target.troops || {});
            results.push({
                target: target.id,
                success: result.success,
                data: result
            });
            
            console.log(`Target ${target.id}: ${result.success ? 'Success' : 'Failed'}`);
            
        } catch (error) {
            console.error(`Failed to attack ${target.id}:`, error);
            results.push({
                target: target.id,
                success: false,
                error: error.message
            });
        }
    }
    
    return results;
}

// Initialize when needed
document.addEventListener('DOMContentLoaded', function() {
    // Add UI button for testing (optional)
    const attackButton = document.createElement('button');
    attackButton.textContent = 'Execute Test Attack';
    attackButton.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;';
    attackButton.onclick = executeFullAttack;
    
    document.body.appendChild(attackButton);
    
    console.log('Tribal Wars Attack Script loaded');
    console.log('Call executeFullAttack() to start an attack');
});

// Export for use in other scripts (if using modules)
// export { TribalWarsAttack, sendAttack, executeFullAttack };
