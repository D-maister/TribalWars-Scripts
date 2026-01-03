// Tribal Wars Attack Script - Robust Version
// Works even on non-standard pages, better error handling

class RobustTribalWarsAttack {
    constructor() {
        this.domain = null;
        this.villageId = null;
        this.csrfHash = null;
        this.initialized = false;
        this.forceInit = false;
    }
    
    // Initialize - with fallbacks
    async init(force = false) {
        this.forceInit = force;
        
        try {
            // Get domain
            this.domain = window.location.hostname;
            
            // Try multiple methods to get village ID
            this.villageId = this._getVillageId();
            
            // Try multiple methods to get CSRF
            this.csrfHash = this._getCSRF();
            
            // If we're missing critical info, try to extract from page
            if (!this.villageId || !this.csrfHash) {
                console.log('⚠️ Missing info, attempting page scan...');
                this._scanPageForInfo();
            }
            
            // If still missing, use defaults or prompt
            if (!this.villageId && force) {
                this.villageId = prompt('Enter village ID:', '25034');
            }
            
            if (!this.csrfHash && force) {
                this.csrfHash = prompt('Enter CSRF hash (h= parameter):', '');
            }
            
            // Validate
            if (!this.domain || !this.domain.includes('tribalwars')) {
                console.warn('⚠️ Not on Tribal Wars domain, but continuing...');
            }
            
            if (!this.villageId) {
                throw new Error('Village ID not found. Please navigate to a Tribal Wars village page.');
            }
            
            if (!this.csrfHash) {
                throw new Error('CSRF hash not found. Please check URL for h= parameter or reload page.');
            }
            
            console.log(`✅ Initialized: ${this.domain}, Village: ${this.villageId}, CSRF: ${this.csrfHash ? '***' + this.csrfHash.slice(-4) : 'none'}`);
            this.initialized = true;
            return true;
            
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            this.initialized = false;
            throw error;
        }
    }
    
    // Get village ID from multiple sources
    _getVillageId() {
        // 1. URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlVillage = urlParams.get('village');
        if (urlVillage) {
            console.log('Found village in URL:', urlVillage);
            return urlVillage;
        }
        
        // 2. GameData global
        if (window.GameData?.village) {
            console.log('Found village in GameData:', window.GameData.village);
            return window.GameData.village;
        }
        
        // 3. Page elements
        const villageElements = [
            document.querySelector('input[name="village"]'),
            document.querySelector('[data-village-id]'),
            document.querySelector('.village-list .active [data-id]')
        ];
        
        for (const el of villageElements) {
            if (el?.value) {
                console.log('Found village in element value:', el.value);
                return el.value;
            }
            if (el?.getAttribute('data-id')) {
                console.log('Found village in data-id:', el.getAttribute('data-id'));
                return el.getAttribute('data-id');
            }
            if (el?.getAttribute('data-village-id')) {
                console.log('Found village in data-village-id:', el.getAttribute('data-village-id'));
                return el.getAttribute('data-village-id');
            }
        }
        
        // 4. Check page text
        const pageText = document.body.textContent;
        const villageMatch = pageText.match(/village[=\s:]+(\d+)/i);
        if (villageMatch) {
            console.log('Found village in page text:', villageMatch[1]);
            return villageMatch[1];
        }
        
        return null;
    }
    
    // Get CSRF hash from multiple sources
    _getCSRF() {
        // 1. URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlHash = urlParams.get('h');
        if (urlHash) {
            console.log('Found CSRF in URL:', urlHash);
            return urlHash;
        }
        
        // 2. Input field
        const hInput = document.querySelector('input[name="h"]');
        if (hInput?.value) {
            console.log('Found CSRF in input:', hInput.value);
            return hInput.value;
        }
        
        // 3. Form actions
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const action = form.getAttribute('action') || '';
            const match = action.match(/[?&]h=([a-f0-9]{8,})/);
            if (match) {
                console.log('Found CSRF in form action:', match[1]);
                return match[1];
            }
        }
        
        // 4. Links
        const links = document.querySelectorAll('a[href*="h="]');
        for (const link of links) {
            const href = link.href;
            const match = href.match(/[?&]h=([a-f0-9]{8,})/);
            if (match) {
                console.log('Found CSRF in link:', match[1]);
                return match[1];
            }
        }
        
        // 5. Check for recent attacks (if we're on a page with attack data)
        const recentAttacks = document.querySelectorAll('[data-h], [data-csrf]');
        for (const el of recentAttacks) {
            const hash = el.getAttribute('data-h') || el.getAttribute('data-csrf');
            if (hash && hash.match(/^[a-f0-9]{8,}$/)) {
                console.log('Found CSRF in data attribute:', hash);
                return hash;
            }
        }
        
        return null;
    }
    
    // Scan page for additional info
    _scanPageForInfo() {
        console.log('Scanning page for Tribal Wars data...');
        
        // Check for common Tribal Wars patterns
        const patterns = [
            /game\.php\?village=(\d+)/g,
            /village=(\d+)/g,
            /h=([a-f0-9]{8,})/g,
            /"village_id"\s*:\s*(\d+)/g,
            /"h"\s*:\s*"([a-f0-9]+)"/g
        ];
        
        const pageHTML = document.documentElement.outerHTML;
        
        for (const pattern of patterns) {
            const matches = pageHTML.match(pattern);
            if (matches) {
                for (const match of matches) {
                    const value = match.replace(/[^=\d:a-f]/g, '').split(/[=:]/)[1];
                    if (value) {
                        if (/^\d+$/.test(value) && !this.villageId) {
                            this.villageId = value;
                            console.log('Found village in HTML scan:', value);
                        }
                        if (/^[a-f0-9]{8,}$/.test(value) && !this.csrfHash) {
                            this.csrfHash = value;
                            console.log('Found CSRF in HTML scan:', value);
                        }
                    }
                }
            }
        }
    }
    
    // Find dynamic form field
    _findDynamicField() {
        // Look for the 32-char hex field
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const inputs = form.querySelectorAll('input[type="hidden"]');
            for (const input of inputs) {
                if (input.name && input.name.length === 32 && /^[a-f0-9]{32}$/.test(input.name)) {
                    console.log('Found dynamic field:', input.name);
                    return {
                        name: input.name,
                        value: input.value || '7d85610179d131'
                    };
                }
            }
        }
        
        // Default fallback
        console.log('Using default dynamic field');
        return {
            name: '79d131589f81aaeb36d2d2',
            value: '7d85610179d131'
        };
    }
    
    // MAIN ATTACK FUNCTION
    async attack(x, y, troops = {}) {
        // Auto-initialize if needed
        if (!this.initialized) {
            try {
                await this.init(this.forceInit);
            } catch (error) {
                return {
                    success: false,
                    error: `Initialization failed: ${error.message}`,
                    target: { x, y }
                };
            }
        }
        
        console.log(`⚔️ Attacking ${x}|${y} from village ${this.villageId}...`);
        
        // Prepare troops
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
        
        // Find dynamic field
        const dynamicField = this._findDynamicField();
        
        try {
            // STEP 1: Get confirmation
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
            confirmData.append('attack', 'l');
            confirmData.append('h', this.csrfHash);
            
            const confirmUrl = `https://${this.domain}/game.php?village=${this.villageId}&screen=place&ajax=confirm`;
            console.log('Confirm URL:', confirmUrl);
            
            const confirmResponse = await fetch(confirmUrl, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: confirmData.toString()
            });
            
            const confirmResult = await confirmResponse.json();
            
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
                throw new Error('No ch token found in confirmation dialog');
            }
            
            console.log('✓ Got confirmation token');
            
            // STEP 2: Send final attack
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
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: finalData.toString()
            });
            
            const finalResult = await finalResponse.json();
            
            console.log('✓ Attack sent successfully!');
            
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
                target: { x, y },
                troops: allTroops
            };
        }
    }
    
    // PRECISE TIMING ATTACK
    async attackPreciseTime(x, y, troops = {}, startTime) {
        // Parse time
        const targetTime = this._parseTime(startTime);
        if (!targetTime) {
            return {
                success: false,
                error: `Invalid time format: ${startTime}. Use: "HH:MM:SS" or "YYYY-MM-DD HH:MM:SS"`,
                target: { x, y }
            };
        }
        
        const now = Date.now();
        const delay = targetTime - now;
        
        if (delay < 0) {
            console.warn(`⚠️ Target time is in the past. Sending immediately.`);
            return await this.attack(x, y, troops);
        }
        
        console.log(`⏱️ Scheduled attack to ${x}|${y} at ${new Date(targetTime).toLocaleTimeString()} (in ${Math.round(delay/1000)}s)`);
        
        return new Promise((resolve) => {
            setTimeout(async () => {
                console.log(`🚀 Time reached! Sending attack...`);
                const result = await this.attack(x, y, troops);
                resolve(result);
            }, delay);
        });
    }
    
    // Parse time string
    _parseTime(timeStr) {
        if (!timeStr) return null;
        
        // Timestamp
        if (/^\d+$/.test(timeStr)) {
            const ts = parseInt(timeStr);
            return ts < 10000000000 ? ts * 1000 : ts;
        }
        
        // HH:MM:SS or HH:MM
        const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?::(\d{3}))?$/);
        if (timeMatch) {
            const now = new Date();
            const hour = parseInt(timeMatch[1]);
            const minute = parseInt(timeMatch[2]);
            const second = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
            const ms = timeMatch[4] ? parseInt(timeMatch[4]) : 0;
            
            const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, second, ms);
            
            // If time has already passed today, schedule for tomorrow
            if (target.getTime() <= now.getTime()) {
                target.setDate(target.getDate() + 1);
            }
            
            return target.getTime();
        }
        
        // YYYY-MM-DD HH:MM:SS
        const dateMatch = timeStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?::(\d{3}))?$/);
        if (dateMatch) {
            const year = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]) - 1;
            const day = parseInt(dateMatch[3]);
            const hour = parseInt(dateMatch[4]);
            const minute = parseInt(dateMatch[5]);
            const second = dateMatch[6] ? parseInt(dateMatch[6]) : 0;
            const ms = dateMatch[7] ? parseInt(dateMatch[7]) : 0;
            
            return new Date(year, month, day, hour, minute, second, ms).getTime();
        }
        
        // Try Date.parse
        const parsed = Date.parse(timeStr);
        return isNaN(parsed) ? null : parsed;
    }
    
    // BATCH ATTACKS
    async attackMultiple(targets, options = {}) {
        const {
            delay = 2000,
            preciseTiming = false
        } = options;
        
        console.log(`📦 Starting batch: ${targets.length} targets`);
        
        const results = [];
        
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            
            console.log(`\n[${i + 1}/${targets.length}] ${target.x}|${target.y}`);
            
            if (i > 0 && !preciseTiming) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            let result;
            if (preciseTiming && target.startTime) {
                result = await this.attackPreciseTime(target.x, target.y, target.troops || {}, target.startTime);
            } else {
                result = await this.attack(target.x, target.y, target.troops || {});
            }
            
            results.push(result);
            console.log(result.success ? '✓ Success' : '✗ Failed');
        }
        
        console.log(`\n📊 Batch complete: ${results.filter(r => r.success).length}/${results.length} successful`);
        return results;
    }
    
    // Get current info
    getInfo() {
        return {
            domain: this.domain,
            village: this.villageId,
            csrf: this.csrfHash ? '***' + this.csrfHash.slice(-4) : 'none',
            initialized: this.initialized
        };
    }
}

// Create instance
const robustAttack = new RobustTribalWarsAttack();

// Initialize with error handling
robustAttack.init().then(() => {
    console.log('🎯 Tribal Wars Attack ready!');
}).catch(() => {
    console.warn('⚠️ Partial initialization. Some features may require manual input.');
});

// Export functions with auto-initialization
window.attack = async function(x, y, troops) {
    return await robustAttack.attack(x, y, troops);
};

window.attackPreciseTime = async function(x, y, troops, startTime) {
    return await robustAttack.attackPreciseTime(x, y, troops, startTime);
};

window.attackMultiple = async function(targets, options) {
    return await robustAttack.attackMultiple(targets, options);
};

window.getAttackInfo = function() {
    return robustAttack.getInfo();
};

window.forceInit = async function() {
    return await robustAttack.init(true);
};

console.log('🎯 Tribal Wars Attack Script loaded!');
console.log('');
console.log('Commands:');
console.log('attack(x, y, troops) - Send attack');
console.log('attackPreciseTime(x, y, troops, time) - Scheduled attack');
console.log('attackMultiple(targets, options) - Batch attacks');
console.log('getAttackInfo() - Get current info');
console.log('forceInit() - Force re-initialization (prompts for missing info)');
console.log('');
console.log('Time formats:');
console.log('- "14:30:00" (today or tomorrow)');
console.log('- "14:30:00:500" (with milliseconds)');
console.log('- "2026-01-25 14:30:00" (specific date)');
console.log('- timestamp (ms since epoch)');
console.log('');
console.log('Examples:');
console.log('await attack(541, 654, { spear: 1 })');
console.log('await attackPreciseTime(541, 654, { spear: 1 }, "14:30:00")');
console.log('await attackMultiple([{x:541,y:654},{x:540,y:653}])');
