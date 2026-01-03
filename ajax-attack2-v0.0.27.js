// Tribal Wars Attack & Support Script
// Supports: 'attack' and 'support' command types

class TribalWarsCommands {
    constructor() {
        this.domain = null;
        this.villageId = null;
        this.csrfHash = null;
        this.initialized = false;
        this.scheduledCommands = new Map();
    }
    
    // Initialize
    async init() {
        try {
            this.domain = window.location.hostname;
            const urlParams = new URLSearchParams(window.location.search);
            this.villageId = urlParams.get('village') || this._extractVillageId();
            this.csrfHash = this._extractCSRF();
            
            if (!this.villageId || !this.csrfHash) {
                throw new Error('Missing village ID or CSRF. Navigate to a Tribal Wars page.');
            }
            
            console.log(`✅ Initialized: ${this.domain}, Village: ${this.villageId}`);
            this.initialized = true;
            return true;
            
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            throw error;
        }
    }
    
    // Extract village ID
    _extractVillageId() {
        const urlParams = new URLSearchParams(window.location.search);
        const village = urlParams.get('village');
        if (village) return village;
        
        if (window.GameData?.village) return window.GameData.village;
        
        const villageInput = document.querySelector('input[name="village"]');
        if (villageInput?.value) return villageInput.value;
        
        return null;
    }
    
    // Extract CSRF
    _extractCSRF() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlHash = urlParams.get('h');
        if (urlHash) return urlHash;
        
        const inputHash = document.querySelector('input[name="h"]')?.value;
        if (inputHash) return inputHash;
        
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const action = form.getAttribute('action') || '';
            const match = action.match(/[?&]h=([a-f0-9]{8,})/);
            if (match) return match[1];
        }
        
        return null;
    }
    
    // Find dynamic field
    _findDynamicField() {
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const inputs = form.querySelectorAll('input[type="hidden"]');
            for (const input of inputs) {
                if (input.name && input.name.length === 32 && /^[a-f0-9]{32}$/.test(input.name)) {
                    return {
                        name: input.name,
                        value: input.value || '7d85610179d131'
                    };
                }
            }
        }
        
        return {
            name: '79d131589f81aaeb36d2d2',
            value: '7d85610179d131'
        };
    }
    
    // Map command type to Tribal Wars code
    _getCommandCode(type) {
        const types = {
            'attack': 'l',  // l = attack
            'support': 'u'   // u = support
        };
        
        const code = types[type.toLowerCase()];
        if (!code) {
            throw new Error(`Invalid command type: ${type}. Use 'attack' or 'support'.`);
        }
        
        return code;
    }
    
    // Core command execution
    async _executeCommand(x, y, troops = {}, type = 'attack') {
        if (!this.initialized) await this.init();
        
        const commandCode = this._getCommandCode(type);
        console.log(`⚔️ Sending ${type} to ${x}|${y}...`);
        
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
            confirmData.append(type === 'support' ? 'support' : 'attack', commandCode); // 'support' or 'attack' parameter
            confirmData.append('h', this.csrfHash);
            
            const confirmUrl = `https://${this.domain}/game.php?village=${this.villageId}&screen=place&ajax=confirm`;
            
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
                throw new Error(`${type} confirm failed: ${confirmResult.error_msg || confirmResult.error}`);
            }
            
            if (!confirmResult.response?.dialog) {
                throw new Error(`No ${type} confirmation dialog`);
            }
            
            // Extract ch token
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = confirmResult.response.dialog;
            const chInput = tempDiv.querySelector('input[name="ch"]');
            const chValue = chInput?.value;
            
            if (!chValue) {
                throw new Error('No ch token found');
            }
            
            console.log(`✓ Got ${type} confirmation token`);
            
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
                troops: allTroops,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`✗ ${type} to ${x}|${y} failed:`, error.message);
            return {
                success: false,
                type: type,
                error: error.message,
                target: { x, y },
                timestamp: new Date().toISOString()
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
        
        // Relative time: +100ms, +1.5s, +1m, +2h
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
        
        // Time only: HH:MM:SS or HH:MM:SS:SSS
        const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?::(\d{1,3}))?$/);
        if (timeMatch) {
            const now = new Date();
            const hour = parseInt(timeMatch[1]);
            const minute = parseInt(timeMatch[2]);
            const second = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
            const ms = timeMatch[4] ? parseInt(timeMatch[4]) : 0;
            
            const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, second, ms);
            
            if (target.getTime() <= now.getTime()) {
                target.setDate(target.getDate() + 1);
            }
            
            return target.getTime();
        }
        
        // Full date: YYYY-MM-DD HH:MM:SS
        const dateMatch = Date.parse(timeStr);
        return isNaN(dateMatch) ? null : dateMatch;
    }
    
    // IMMEDIATE ATTACK
    async attack(x, y, troops = {}) {
        return await this._executeCommand(x, y, troops, 'attack');
    }
    
    // IMMEDIATE SUPPORT
    async support(x, y, troops = {}) {
        return await this._executeCommand(x, y, troops, 'support');
    }
    
    // PRECISE TIMING COMMAND
    async commandPreciseTime(x, y, troops = {}, startTime, type = 'attack') {
        if (!this.initialized) await this.init();
        
        const targetTime = this._parseTime(startTime);
        
        if (!targetTime) {
            return {
                success: false,
                error: `Invalid time format: ${startTime}`,
                type: type,
                target: { x, y }
            };
        }
        
        const now = Date.now();
        const delay = targetTime - now;
        
        if (delay <= 0) {
            console.log(`⏰ Time has passed, sending ${type} immediately`);
            return await this._executeCommand(x, y, troops, type);
        }
        
        // Format delay text
        let delayText = '';
        if (delay < 1000) {
            delayText = `${delay}ms`;
        } else if (delay < 60000) {
            delayText = `${(delay/1000).toFixed(2)}s`;
        } else {
            delayText = `${(delay/60000).toFixed(1)}m`;
        }
        
        console.log(`⏱️ Scheduled ${type} to ${x}|${y} in ${delayText}`);
        
        const commandId = `${type}_${x}_${y}_${Date.now()}`;
        
        // Schedule the command
        const timeoutId = setTimeout(async () => {
            console.log(`🚀 Scheduled time reached for ${type} to ${x}|${y}`);
            const result = await this._executeCommand(x, y, troops, type);
            
            // Update tracking
            const cmd = this.scheduledCommands.get(commandId);
            if (cmd) {
                cmd.result = result;
                cmd.status = 'completed';
            }
            
        }, delay);
        
        // Store for tracking
        this.scheduledCommands.set(commandId, {
            id: commandId,
            type: type,
            target: { x, y },
            scheduledTime: new Date(targetTime).toISOString(),
            timeoutId: timeoutId,
            status: 'scheduled'
        });
        
        return {
            success: true,
            scheduled: true,
            commandId: commandId,
            type: type,
            message: `${type} scheduled to ${x}|${y}`,
            target: { x, y },
            scheduledTime: new Date(targetTime).toISOString(),
            delayMs: delay
        };
    }
    
    // PRECISE ATTACK
    async attackPreciseTime(x, y, troops = {}, startTime) {
        return await this.commandPreciseTime(x, y, troops, startTime, 'attack');
    }
    
    // PRECISE SUPPORT
    async supportPreciseTime(x, y, troops = {}, startTime) {
        return await this.commandPreciseTime(x, y, troops, startTime, 'support');
    }
    
    // BATCH COMMANDS
    async commandMultiple(commands, options = {}) {
        const {
            delay = 2000,
            parallel = true
        } = options;
        
        console.log(`📦 Scheduling ${commands.length} commands...`);
        
        if (!this.initialized) await this.init();
        
        const results = [];
        
        if (parallel) {
            // Parallel scheduling
            for (let i = 0; i < commands.length; i++) {
                const cmd = commands[i];
                
                console.log(`[${i + 1}/${commands.length}] ${cmd.type} to ${cmd.x}|${cmd.y}`);
                
                let result;
                if (cmd.startTime) {
                    result = await this.commandPreciseTime(cmd.x, cmd.y, cmd.troops || {}, cmd.startTime, cmd.type || 'attack');
                } else {
                    const staggeredTime = Date.now() + (i * delay);
                    result = await this.commandPreciseTime(cmd.x, cmd.y, cmd.troops || {}, staggeredTime, cmd.type || 'attack');
                }
                
                results.push(result);
                console.log(result.scheduled ? '✓ Scheduled' : result.success ? '✓ Sent' : '✗ Failed');
            }
            
            console.log(`✅ All ${commands.length} commands scheduled`);
            
        } else {
            // Sequential execution
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
                console.log(result.success ? '✓ Success' : '✗ Failed');
            }
        }
        
        return {
            total: commands.length,
            attacks: results.filter(r => r.type === 'attack').length,
            supports: results.filter(r => r.type === 'support').length,
            scheduled: results.filter(r => r.scheduled).length,
            immediate: results.filter(r => !r.scheduled && r.success).length,
            failed: results.filter(r => !r.success).length,
            results: results
        };
    }
    
    // Cancel scheduled command
    cancelScheduledCommand(commandId) {
        const cmd = this.scheduledCommands.get(commandId);
        if (cmd && cmd.timeoutId) {
            clearTimeout(cmd.timeoutId);
            cmd.status = 'cancelled';
            console.log(`❌ Cancelled ${cmd.type} ${commandId}`);
            return { success: true, commandId, type: cmd.type };
        }
        return { success: false, commandId, message: 'Command not found' };
    }
    
    // Get scheduled commands
    getScheduledCommands() {
        return Array.from(this.scheduledCommands.values());
    }
    
    // Get info
    getInfo() {
        return {
            domain: this.domain,
            village: this.villageId,
            csrf: this.csrfHash ? '***' + this.csrfHash.slice(-4) : null,
            initialized: this.initialized,
            scheduledCommands: this.scheduledCommands.size
        };
    }
    
    // Manual setup
    manualSet(villageId, csrfHash, domain = null) {
        this.villageId = villageId;
        this.csrfHash = csrfHash;
        if (domain) this.domain = domain;
        this.initialized = true;
        console.log(`✅ Manual setup: Village ${villageId}`);
    }
}

// Create instance
const twCommands = new TribalWarsCommands();

// Initialize
twCommands.init().then(() => {
    console.log('🎯 Tribal Wars Commands ready!');
}).catch(() => {
    console.warn('⚠️ Not initialized. Use manualSet() or navigate to Tribal Wars page.');
});

// Export functions
window.attack = async function(x, y, troops) {
    return await twCommands.attack(x, y, troops);
};

window.support = async function(x, y, troops) {
    return await twCommands.support(x, y, troops);
};

window.attackPreciseTime = async function(x, y, troops, startTime) {
    return await twCommands.attackPreciseTime(x, y, troops, startTime);
};

window.supportPreciseTime = async function(x, y, troops, startTime) {
    return await twCommands.supportPreciseTime(x, y, troops, startTime);
};

window.commandMultiple = async function(commands, options) {
    return await twCommands.commandMultiple(commands, options);
};

window.cancelScheduledCommand = function(commandId) {
    return twCommands.cancelScheduledCommand(commandId);
};

window.getScheduledCommands = function() {
    return twCommands.getScheduledCommands();
};

window.getInfo = function() {
    return twCommands.getInfo();
};

window.manualSet = function(villageId, csrfHash, domain) {
    return twCommands.manualSet(villageId, csrfHash, domain);
};

console.log('🎯 Tribal Wars Commands Script loaded!');
console.log('');
console.log('COMMAND TYPES:');
console.log('- attack: Normal attack (l)');
console.log('- support: Send support troops (u)');
console.log('');
console.log('MAIN FUNCTIONS:');
console.log('attack(x, y, troops) - Send attack');
console.log('support(x, y, troops) - Send support');
console.log('attackPreciseTime(x, y, troops, time) - Scheduled attack');
console.log('supportPreciseTime(x, y, troops, time) - Scheduled support');
console.log('commandMultiple(commands, options) - Batch commands');
console.log('manualSet(villageId, csrfHash, domain) - Manual setup');
console.log('');
console.log('TIME FORMATS:');
console.log('- "+100ms" - 100 milliseconds from now');
console.log('- "+1.5s" - 1.5 seconds from now');
console.log('- "14:30:00" - Today at 14:30');
console.log('- timestamp (ms)');
console.log('');
console.log('EXAMPLES:');
console.log('// Manual setup (if auto-init fails)');
console.log('manualSet("25034", "683500cb", "en152.tribalwars.net")');
console.log('');
console.log('// Send immediate attack');
console.log('await attack(541, 654, { spear: 10, sword: 5 })');
console.log('');
console.log('// Send immediate support');
console.log('await support(541, 654, { spear: 20, archer: 10 })');
console.log('');
console.log('// Scheduled attack with ms precision');
console.log('await attackPreciseTime(541, 654, { spear: 1 }, "+100ms")');
console.log('');
console.log('// Scheduled support');
console.log('await supportPreciseTime(541, 654, { spear: 10 }, "+1s")');
console.log('');
console.log('// Mixed batch: attacks and supports');
console.log('await commandMultiple([');
console.log('  { type: "attack", x: 541, y: 654, troops: { spear: 1 }, startTime: "+100ms" },');
console.log('  { type: "support", x: 541, y: 654, troops: { spear: 5 }, startTime: "+200ms" },');
console.log('  { type: "attack", x: 540, y: 653, troops: { spear: 2 }, startTime: "+300ms" }');
console.log('], { parallel: true })');
