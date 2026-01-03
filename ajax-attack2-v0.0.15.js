// Universal Tribal Wars Attack Script
// Works on ANY Tribal Wars server/domain

class UniversalTribalWarsAttack {
    constructor() {
        this.domain = null;
        this.villageId = null;
        this.csrfHash = null;
        this.world = null;
        this.initialized = false;
    }
    
    // Initialize with current page data
    async init() {
        // Get current domain
        this.domain = window.location.hostname;
        
        // Extract world from domain (e.g., en152 from en152.tribalwars.net)
        const domainMatch = this.domain.match(/([a-z]{2}\d+)\./);
        this.world = domainMatch ? domainMatch[1] : this.extractWorldFromURL();
        
        // Get village ID from URL or page
        const urlParams = new URLSearchParams(window.location.search);
        this.villageId = urlParams.get('village') || this.extractVillageIdFromPage();
        
        // Get CSRF hash
        this.csrfHash = this.extractCSRF();
        
        if (!this.villageId) {
            throw new Error('Village ID not found. Make sure you are on a Tribal Wars village page.');
        }
        
        if (!this.csrfHash) {
            throw new Error('CSRF hash not found. Make sure you are logged in.');
        }
        
        console.log(`✅ Initialized: ${this.domain} (World: ${this.world}), Village: ${this.villageId}`);
        this.initialized = true;
        return true;
    }
    
    // Extract world from various sources
    extractWorldFromURL() {
        // Check URL path for world indicator
        const path = window.location.pathname;
        const pathMatch = path.match(/\/([a-z]{2}\d+)\//);
        if (pathMatch) return pathMatch[1];
        
        // Check for world in game data
        if (window.GameData && window.GameData.world) {
            return window.GameData.world;
        }
        
        // Try to get from domain pattern
        const domainParts = this.domain.split('.');
        if (domainParts[0].match(/^[a-z]{2}\d+$/)) {
            return domainParts[0];
        }
        
        return 'unknown';
    }
    
    // Extract village ID from page elements
    extractVillageIdFromPage() {
        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const urlVillage = urlParams.get('village');
        if (urlVillage) return urlVillage;
        
        // Check for village ID in data attributes
        const villageElement = document.querySelector('[data-village-id], [data-id]');
        if (villageElement) {
            return villageElement.getAttribute('data-village-id') || 
                   villageElement.getAttribute('data-id');
        }
        
        // Check for village in game data
        if (window.GameData && window.GameData.village) {
            return window.GameData.village;
        }
        
        // Check form inputs
        const villageInput = document.querySelector('input[name="village"]');
        if (villageInput?.value) {
            return villageInput.value;
        }
        
        return null;
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
            const match = action.match(/[?&]h=([a-f0-9]{8,})/);
            if (match) return match[1];
        }
        
        // 4. Links on page
        const links = document.querySelectorAll('a[href*="h="]');
        for (const link of links) {
            const href = link.href;
            const match = href.match(/[?&]h=([a-f0-9]{8,})/);
            if (match) return match[1];
        }
        
        // 5. Meta tags
        const metaTags = document.querySelectorAll('meta[name="csrf-token"], meta[name="h"]');
        for (const meta of metaTags) {
            const content = meta.getAttribute('content');
            if (content) return content;
        }
        
        return null;
    }
    
    // Find dynamic form field name (the 32-char hex field)
    findDynamicField() {
        // Check page forms
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const inputs = form.querySelectorAll('input[type="hidden"]');
            for (const input of inputs) {
                if (input.name && input.name.length === 32 && /^[a-f0-9]{32}$/.test(input.name)) {
                    return {
                        name: input.name,
                        value: input.value || '7d85610179d131' // Default value
                    };
                }
            }
        }
        
        // Return default from your working example
        return {
            name: '79d131589f81aaeb36d2d2',
            value: '7d85610179d131'
        };
    }
    
    // Main attack function
    async attack(x, y, troops = { spear: 1, sword: 1 }, attackType = 'l') {
        // Auto-initialize if not done
        if (!this.initialized) {
            await this.init();
        }
        
        console.log(`⚔️ Attacking ${x}|${y} from ${this.domain} (village ${this.villageId})...`);
        
        // Prepare all troop data
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
            // Find dynamic field
            const dynamicField = this.findDynamicField();
            console.log(`Using dynamic field: ${dynamicField.name}=${dynamicField.value}`);
            
            // STEP 1: Get confirmation token
            console.log('Step 1: Getting confirmation token...');
            
            const confirmData = new URLSearchParams();
            confirmData.append(dynamicField.name, dynamicField.value);
            confirmData.append('template_id', '');
            confirmData.append('source_village', this.villageId);
            
            for (const [unit, count] of Object.entries(allTroops)) {
                confirmData.append(unit, count.toString());
            }
            
            confirmData.append('x', x.toString());
            confirmData.append('y', y.toString());
            confirmData.append('input', '');
            confirmData.append('attack', attackType); // l=attack, r=raid, s=spy
            confirmData.append('h', this.csrfHash);
            
            const confirmUrl = `https://${this.domain}/game.php?village=${this.villageId}&screen=place&ajax=confirm`;
            console.log('Confirm URL:', confirmUrl);
            
            const confirmResponse = await fetch(confirmUrl, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': navigator.language || 'en',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: confirmData.toString()
            });
            
            if (!confirmResponse.ok) {
                throw new Error(`Confirm request failed: ${confirmResponse.status}`);
            }
            
            const confirmResult = await confirmResponse.json();
            
            // Check for errors in confirm response
            if (confirmResult.error) {
                throw new Error(`Confirm failed: ${confirmResult.error_msg || confirmResult.error}`);
            }
            
            if (!confirmResult.response?.dialog) {
                console.log('Confirm response:', confirmResult);
                throw new Error('No confirmation dialog received');
            }
            
            // Extract ch token
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = confirmResult.response.dialog;
            const chInput = tempDiv.querySelector('input[name="ch"]');
            const chValue = chInput?.value;
            
            if (!chValue) {
                console.log('Dialog HTML (first 500 chars):', confirmResult.response.dialog.substring(0, 500));
                throw new Error('No ch token found in confirmation dialog');
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
            
            const finalUrl = `https://${this.domain}/game.php?village=${this.villageId}&screen=place&ajaxaction=popup_command`;
            console.log('Final URL:', finalUrl);
            
            const finalResponse = await fetch(finalUrl, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': navigator.language || 'en',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: finalData.toString()
            });
            
            if (!finalResponse.ok) {
                throw new Error(`Final request failed: ${finalResponse.status}`);
            }
            
            const finalResult = await finalResponse.json();
            
            console.log('✓ Attack sent!');
            console.log('Response:', finalResult);
            
            return {
                success: true,
                message: `Attack sent to ${x}|${y}`,
                domain: this.domain,
                world: this.world,
                village: this.villageId,
                target: { x, y },
                troops: allTroops,
                attackType: attackType,
                response: finalResult
            };
            
        } catch (error) {
            console.error('✗ Attack failed:', error);
            return {
                success: false,
                error: error.message,
                domain: this.domain,
                village: this.villageId,
                target: { x, y }
            };
        }
    }
    
    // Batch attack multiple targets
    async attackMultiple(targets, delay = 2000, attackType = 'l') {
        const results = [];
        
        console.log(`🎯 Starting batch attack (${targets.length} targets) on ${this.domain}...`);
        
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            
            console.log(`\n[${i + 1}/${targets.length}] ${target.x}|${target.y}`);
            
            // Add delay between attacks (except first)
            if (i > 0) {
                console.log(`⏳ Waiting ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            const result = await this.attack(
                target.x, 
                target.y, 
                target.troops || {}, 
                target.attackType || attackType
            );
            
            results.push(result);
            
            console.log(result.success ? '✓ Success' : '✗ Failed');
            
            // Stop if we get consecutive errors
            const recentErrors = results.slice(-3).filter(r => !r.success).length;
            if (recentErrors >= 3) {
                console.warn('⚠️ Too many consecutive errors, stopping batch');
                break;
            }
        }
        
        console.log('\n📊 Batch complete. Success:', results.filter(r => r.success).length, '/', results.length);
        return results;
    }
    
    // Send raid instead of attack
    async raid(x, y, troops = {}) {
        return await this.attack(x, y, troops, 'r'); // r = raid
    }
    
    // Send spy mission
    async spy(x, y, spyCount = 1) {
        return await this.attack(x, y, { spy: spyCount }, 's'); // s = spy
    }
    
    // Send support
    async support(x, y, troops = {}) {
        return await this.attack(x, y, troops, 'u'); // u = support
    }
    
    // Static method for quick attacks
    static async quickAttack(x, y, troops = {}) {
        const attacker = new UniversalTribalWarsAttack();
        await attacker.init();
        return await attacker.attack(x, y, troops);
    }
    
    // Static method for batch attacks
    static async quickBatch(targets, delay = 2000) {
        const attacker = new UniversalTribalWarsAttack();
        await attacker.init();
        return await attacker.attackMultiple(targets, delay);
    }
}

// Create global instance for easy console access
const universalAttack = new UniversalTribalWarsAttack();

// Auto-initialize when script loads
universalAttack.init().then(() => {
    console.log('🌍 Universal Tribal Wars Attack ready!');
}).catch(err => {
    console.warn('Note: Not on Tribal Wars page, will initialize on first attack');
});

// Export functions for easy console use
window.attack = async function(x, y, troops) {
    return await universalAttack.attack(x, y, troops);
};

window.raid = async function(x, y, troops) {
    return await universalAttack.raid(x, y, troops);
};

window.spy = async function(x, y, count) {
    return await universalAttack.spy(x, y, count);
};

window.support = async function(x, y, troops) {
    return await universalAttack.support(x, y, troops);
};

window.attackMultiple = async function(targets, delay) {
    return await universalAttack.attackMultiple(targets, delay);
};

window.quickAttack = UniversalTribalWarsAttack.quickAttack;
window.quickBatch = UniversalTribalWarsAttack.quickBatch;

// Helper to get current server info
window.getServerInfo = function() {
    return {
        domain: universalAttack.domain,
        world: universalAttack.world,
        village: universalAttack.villageId,
        csrf: universalAttack.csrfHash,
        initialized: universalAttack.initialized
    };
};

console.log('🌍 Universal Tribal Wars Attack Script loaded!');
console.log('Works on ANY Tribal Wars domain: *.tribalwars.net, *.plemiona.pl, *.travian.*, etc.');
console.log('');
console.log('Available commands:');
console.log('attack(x, y, troops) - Send attack');
console.log('raid(x, y, troops) - Send raid');
console.log('spy(x, y, count) - Send spy mission');
console.log('support(x, y, troops) - Send support');
console.log('attackMultiple([{x, y, troops}], delay) - Batch attacks');
console.log('quickAttack(x, y, troops) - Static quick attack');
console.log('quickBatch(targets, delay) - Static batch attack');
console.log('getServerInfo() - Get current server/village info');
console.log('');
console.log('Examples:');
console.log('await attack(541, 654, { spear: 1, sword: 1 })');
console.log('await raid(541, 654, { spear: 5 })');
console.log('await spy(541, 654, 2)');
console.log('await attackMultiple([{x:541,y:654},{x:540,y:653}])');
console.log('await quickAttack(541, 654)');
