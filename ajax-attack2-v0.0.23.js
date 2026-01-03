// Tribal Wars Attack & Support - WORKING VERSION
// Auto-detects from page, supports attack and support

console.log('🎯 Loading Tribal Wars Commands...');

// First, check what's on the page
const urlParams = new URLSearchParams(window.location.search);
const currentVillage = urlParams.get('village');
const currentCSRF = urlParams.get('h') || document.querySelector('input[name="h"]')?.value;

console.log('🔍 Page check:');
console.log('- Village ID from URL:', currentVillage);
console.log('- CSRF from URL/input:', currentCSRF ? '***' + currentCSRF.slice(-4) : 'none');
console.log('- Domain:', window.location.hostname);

class WorkingTribalWarsCommands {
    constructor() {
        this.domain = window.location.hostname;
        this.villageId = currentVillage;
        this.csrfHash = currentCSRF;
        this.initialized = false;
        
        // Try to auto-initialize
        if (this.villageId && this.csrfHash) {
            this.initialized = true;
            console.log('✅ Auto-initialized from page');
        } else {
            console.warn('⚠️ Could not auto-initialize. Use manual setup.');
        }
    }
    
    // Manual setup if auto-init fails
    setup(villageId, csrfHash, domain = null) {
        this.villageId = villageId;
        this.csrfHash = csrfHash;
        if (domain) this.domain = domain;
        this.initialized = true;
        
        console.log(`✅ Manual setup:`);
        console.log(`   Village: ${this.villageId}`);
        console.log(`   CSRF: ${this.csrfHash ? '***' + this.csrfHash.slice(-4) : 'none'}`);
        console.log(`   Domain: ${this.domain}`);
        
        return true;
    }
    
    // Core command function - SAME AS WORKING VERSION
    async _executeCommand(x, y, troops = {}, type = 'attack') {
        if (!this.initialized) {
            throw new Error('Not initialized. Get village ID and CSRF from page URL or use setup().');
        }
        
        console.log(`⚔️ Sending ${type} to ${x}|${y}...`);
        
        // Prepare troops (include all types even if 0)
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
            // STEP 1: Get confirmation
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
            confirmData.append(type === 'support' ? 'support' : 'attack', type === 'support' ? 'u' : 'l');
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
                throw new Error('No confirmation dialog');
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
            
            // STEP 2: Send final command
            const finalData = new URLSearchParams();
            finalData.append(type === 'support' ? 'support' : 'attack', 'true');
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
            
            console.log(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} sent to ${x}|${y}`);
            
            return {
                success: true,
                type: type,
                message: `${type.charAt(0).toUpperCase() + type.slice(1)} sent to ${x}|${y}`,
                target: { x, y },
                troops: allTroops
            };
            
        } catch (error) {
            console.error(`✗ ${type} to ${x}|${y} failed:`, error);
            return {
                success: false,
                type: type,
                error: error.message,
                target: { x, y }
            };
        }
    }
    
    // Parse time
    _parseTime(timeStr) {
        if (!timeStr) return null;
        
        // Timestamp
        if (/^\d+$/.test(timeStr)) {
            const ts = parseInt(timeStr);
            return ts < 10000000000 ? ts * 1000 : ts;
        }
        
        // Relative time
        const relativeMatch = timeStr.match(/^\+(\d*\.?\d+)(ms|s|m|h)$/);
        if (relativeMatch) {
            const value = parseFloat(relativeMatch[1]);
            const unit = relativeMatch[2];
            
            let ms = 0;
            switch (unit) {
                case 'ms': ms = value; break;
                case 's': ms = value * 1000; break;
                case 'm': ms = value * 60 * 1000; break;
                case 'h': ms = value * 60 * 60 * 1000; break;
            }
            
            return Date.now() + ms;
        }
        
        // Try Date.parse
        const parsed = Date.parse(timeStr);
        return isNaN(parsed) ? null : parsed;
    }
    
    // IMMEDIATE ATTACK
    async attack(x, y, troops = {}) {
        return await this._executeCommand(x, y, troops, 'attack');
    }
    
    // IMMEDIATE SUPPORT
    async support(x, y, troops = {}) {
        return await this._executeCommand(x, y, troops, 'support');
    }
    
    // SCHEDULED COMMAND
    async commandPreciseTime(x, y, troops = {}, startTime, type = 'attack') {
        const targetTime = this._parseTime(startTime);
        
        if (!targetTime) {
            return {
                success: false,
                error: `Invalid time: ${startTime}`,
                type: type,
                target: { x, y }
            };
        }
        
        const now = Date.now();
        const delay = targetTime - now;
        
        if (delay <= 0) {
            console.log(`⏰ Time passed, sending ${type} immediately`);
            return await this._executeCommand(x, y, troops, type);
        }
        
        console.log(`⏱️ Scheduling ${type} to ${x}|${y} in ${delay}ms`);
        
        return new Promise((resolve) => {
            setTimeout(async () => {
                console.log(`🚀 Time reached for ${type} to ${x}|${y}`);
                const result = await this._executeCommand(x, y, troops, type);
                resolve(result);
            }, delay);
        });
    }
    
    // SCHEDULED ATTACK
    async attackPreciseTime(x, y, troops = {}, startTime) {
        return await this.commandPreciseTime(x, y, troops, startTime, 'attack');
    }
    
    // SCHEDULED SUPPORT
    async supportPreciseTime(x, y, troops = {}, startTime) {
        return await this.commandPreciseTime(x, y, troops, startTime, 'support');
    }
    
    // BATCH COMMANDS
    async commandMultiple(commands, options = {}) {
        const { delay = 2000, parallel = true } = options;
        
        console.log(`📦 Processing ${commands.length} commands...`);
        
        const results = [];
        
        if (parallel) {
            // Schedule all in parallel
            const promises = [];
            
            for (let i = 0; i < commands.length; i++) {
                const cmd = commands[i];
                
                console.log(`[${i + 1}/${commands.length}] ${cmd.type} to ${cmd.x}|${cmd.y}`);
                
                let promise;
                if (cmd.startTime) {
                    promise = this.commandPreciseTime(cmd.x, cmd.y, cmd.troops || {}, cmd.startTime, cmd.type || 'attack');
                } else {
                    const staggeredTime = Date.now() + (i * delay);
                    promise = this.commandPreciseTime(cmd.x, cmd.y, cmd.troops || {}, staggeredTime, cmd.type || 'attack');
                }
                
                promises.push(promise);
            }
            
            const batchResults = await Promise.all(promises);
            results.push(...batchResults);
            
        } else {
            // Sequential
            for (let i = 0; i < commands.length; i++) {
                const cmd = commands[i];
                
                console.log(`\n[${i + 1}/${commands.length}] ${cmd.type} to ${cmd.x}|${cmd.y}`);
                
                if (i > 0 && !cmd.startTime) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
                let result;
                if (cmd.startTime) {
                    result = await this.commandPreciseTime(cmd.x, cmd.y, cmd.troops || {}, cmd.startTime, cmd.type || 'attack');
                } else {
                    result = await this._executeCommand(cmd.x, cmd.y, cmd.troops || {}, cmd.type || 'attack');
                }
                
                results.push(result);
            }
        }
        
        console.log(`📊 Complete: ${results.filter(r => r.success).length}/${results.length} successful`);
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
const workingCommands = new WorkingTribalWarsCommands();

// Export functions
window.attack = async function(x, y, troops) {
    return await workingCommands.attack(x, y, troops);
};

window.support = async function(x, y, troops) {
    return await workingCommands.support(x, y, troops);
};

window.attackPreciseTime = async function(x, y, troops, startTime) {
    return await workingCommands.attackPreciseTime(x, y, troops, startTime);
};

window.supportPreciseTime = async function(x, y, troops, startTime) {
    return await workingCommands.supportPreciseTime(x, y, troops, startTime);
};

window.commandMultiple = async function(commands, options) {
    return await workingCommands.commandMultiple(commands, options);
};

window.setup = function(villageId, csrfHash, domain) {
    return workingCommands.setup(villageId, csrfHash, domain);
};

window.getInfo = function() {
    return workingCommands.getInfo();
};

console.log('🎯 Tribal Wars Commands loaded!');
console.log('');
console.log('FIRST: Check if auto-initialized:');
console.log('getInfo()');
console.log('');
console.log('IF NOT INITIALIZED:');
console.log('// Get these from your Tribal Wars URL:');
console.log('// Example URL: https://en152.tribalwars.net/game.php?village=25034&screen=place&h=683500cb');
console.log('// village=25034, h=683500cb');
console.log('setup("25034", "683500cb", "en152.tribalwars.net")');
console.log('');
console.log('THEN USE:');
console.log('// Attack');
console.log('await attack(541, 654, { spear: 1 })');
console.log('');
console.log('// Support');
console.log('await support(541, 654, { spear: 10 })');
console.log('');
console.log('// Scheduled attack');
console.log('await attackPreciseTime(541, 654, { spear: 1 }, "+100ms")');
console.log('');
console.log('// Mixed batch');
console.log('await commandMultiple([');
console.log('  { type: "attack", x: 541, y: 654, troops: { spear: 1 }, startTime: "+100ms" },');
console.log('  { type: "support", x: 541, y: 654, troops: { spear: 5 }, startTime: "+200ms" }');
console.log('], { parallel: true })');
