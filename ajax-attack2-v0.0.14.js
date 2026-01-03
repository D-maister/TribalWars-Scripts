// Tribal Wars Direct Attack - Minimal Console Version
// Works from any Tribal Wars page

class TribalWarsAttack {
    constructor() {
        this.villageId = null;
        this.csrfHash = null;
        this.initialized = false;
    }
    
    // Initialize with current page data
    async init() {
        // Get village ID from URL or page
        const urlParams = new URLSearchParams(window.location.search);
        this.villageId = urlParams.get('village') || '25034';
        
        // Get CSRF hash from multiple sources
        this.csrfHash = this.extractCSRF();
        
        if (!this.csrfHash) {
            throw new Error('CSRF hash not found. Make sure you are on a Tribal Wars page.');
        }
        
        console.log(`✅ Initialized: Village ${this.villageId}, CSRF: ${this.csrfHash}`);
        this.initialized = true;
        return true;
    }
    
    // Extract CSRF hash from various places
    extractCSRF() {
        // 1. URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlHash = urlParams.get('h');
        if (urlHash) return urlHash;
        
        // 2. Input field
        const inputHash = document.querySelector('input[name="h"]')?.value;
        if (inputHash) return inputHash;
        
        // 3. Form action
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const action = form.getAttribute('action') || '';
            const match = action.match(/[?&]h=([a-f0-9]{8})/);
            if (match) return match[1];
        }
        
        // 4. Links on page
        const links = document.querySelectorAll('a[href*="h="]');
        for (const link of links) {
            const href = link.href;
            const match = href.match(/h=([a-f0-9]{8})/);
            if (match) return match[1];
        }
        
        return null;
    }
    
    // Main attack function
    async attack(x, y, troops = { spear: 1, sword: 1 }) {
        // Auto-initialize if not done
        if (!this.initialized) {
            await this.init();
        }
        
        console.log(`⚔️ Attacking ${x}|${y} from village ${this.villageId}...`);
        
        // Prepare all troop data (include all troop types even if 0)
        const allTroops = {
            spear: troops.spear || 0,
            sword: troops.sword || 0,
            axe: troops.axe || 0,
            archer: troops.archer || 0,
            spy: troops.spy || 0,
            light: troops.light || 0,
            marcher: troops.marcher || 0,
            heavy: troops.heavy || 0,
            ram: troops.ram || 0,
            catapult: troops.catapult || 0,
            knight: troops.knight || 0,
            snob: troops.snob || 0
        };
        
        try {
            // STEP 1: Get confirmation token
            console.log('Step 1: Getting confirmation token...');
            
            const confirmData = new URLSearchParams();
            confirmData.append('79d131589f81aaeb36d2d2', '7d85610179d131');
            confirmData.append('template_id', '');
            confirmData.append('source_village', this.villageId);
            
            for (const [unit, count] of Object.entries(allTroops)) {
                confirmData.append(unit, count.toString());
            }
            
            confirmData.append('x', x.toString());
            confirmData.append('y', y.toString());
            confirmData.append('input', '');
            confirmData.append('attack', 'l');
            confirmData.append('h', this.csrfHash);
            
            const confirmResponse = await fetch(`https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place&ajax=confirm`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'ru,en;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: confirmData.toString()
            });
            
            const confirmResult = await confirmResponse.json();
            
            // Check for errors in confirm response
            if (confirmResult.error) {
                throw new Error(`Confirm failed: ${confirmResult.error_msg || confirmResult.error}`);
            }
            
            if (!confirmResult.response?.dialog) {
                throw new Error('No confirmation dialog received');
            }
            
            // Extract ch token
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = confirmResult.response.dialog;
            const chInput = tempDiv.querySelector('input[name="ch"]');
            const chValue = chInput?.value;
            
            if (!chValue) {
                throw new Error('No ch token found');
            }
            
            console.log('✓ Got confirmation token');
            
            // STEP 2: Send final attack
            console.log('Step 2: Sending attack...');
            
            const finalData = new URLSearchParams();
            finalData.append('attack', 'true');
            finalData.append('ch', chValue);
            finalData.append('cb', 'troop_confirm_submit');
            finalData.append('x', x.toString());
            finalData.append('y', y.toString());
            finalData.append('source_village', this.villageId);
            finalData.append('village', this.villageId);
            
            for (const [unit, count] of Object.entries(allTroops)) {
                finalData.append(unit, count.toString());
            }
            
            finalData.append('building', 'main');
            finalData.append('h', this.csrfHash);
            finalData.append('h', this.csrfHash);
            
            const finalResponse = await fetch(`https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place&ajaxaction=popup_command`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'ru,en;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: finalData.toString()
            });
            
            const finalResult = await finalResponse.json();
            
            console.log('✓ Attack sent!');
            console.log('Response:', finalResult);
            
            return {
                success: true,
                message: `Attack sent to ${x}|${y}`,
                target: { x, y },
                troops: allTroops,
                response: finalResult
            };
            
        } catch (error) {
            console.error('✗ Attack failed:', error);
            return {
                success: false,
                error: error.message,
                target: { x, y }
            };
        }
    }
    
    // Batch attack multiple targets
    async attackMultiple(targets, delay = 2000) {
        const results = [];
        
        console.log(`🎯 Starting batch attack (${targets.length} targets)...`);
        
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            
            console.log(`\n[${i + 1}/${targets.length}] ${target.x}|${target.y}`);
            
            // Add delay between attacks (except first)
            if (i > 0) {
                console.log(`⏳ Waiting ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            const result = await this.attack(target.x, target.y, target.troops || {});
            results.push(result);
            
            console.log(result.success ? '✓ Success' : '✗ Failed');
        }
        
        console.log('\n📊 Batch complete:', results);
        return results;
    }
    
    // Quick utility: Send attack with just coordinates
    static async quickAttack(x, y, troops = {}) {
        const attacker = new TribalWarsAttack();
        await attacker.init();
        return await attacker.attack(x, y, troops);
    }
    
    // Quick utility: Send multiple attacks
    static async quickBatch(targets, delay = 2000) {
        const attacker = new TribalWarsAttack();
        await attacker.init();
        return await attacker.attackMultiple(targets, delay);
    }
}

// Create global instance for easy console access
const twAttack = new TribalWarsAttack();

// Auto-initialize when script loads
twAttack.init().catch(console.error);

// Export functions for easy console use
window.attack = async function(x, y, troops) {
    return await twAttack.attack(x, y, troops);
};

window.attackMultiple = async function(targets, delay) {
    return await twAttack.attackMultiple(targets, delay);
};

window.quickAttack = TribalWarsAttack.quickAttack;
window.quickBatch = TribalWarsAttack.quickBatch;

console.log('🎯 Tribal Wars Attack Script loaded!');
console.log('Available commands:');
console.log('attack(x, y, troops) - Send single attack');
console.log('attackMultiple([{x, y, troops}], delay) - Send multiple attacks');
console.log('quickAttack(x, y, troops) - Static method (auto-initializes)');
console.log('quickBatch(targets, delay) - Static method for batch');
console.log('');
console.log('Examples:');
console.log('await attack(541, 654, { spear: 1, sword: 1 })');
console.log('await attackMultiple([{x:541,y:654},{x:540,y:653}], 2000)');
console.log('await quickAttack(541, 654)');
