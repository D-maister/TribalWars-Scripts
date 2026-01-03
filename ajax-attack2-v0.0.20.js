// Tribal Wars Attack Script - Millisecond Precision Version
// Supports +100ms, +1.5s, +500ms, etc.

class MillisecondPrecisionAttack {
    constructor() {
        this.domain = null;
        this.villageId = null;
        this.csrfHash = null;
        this.initialized = false;
        this.scheduledAttacks = new Map();
    }
    
    // [Initialization and core methods remain the same...]
    async init() {
        try {
            this.domain = window.location.hostname;
            const urlParams = new URLSearchParams(window.location.search);
            this.villageId = urlParams.get('village') || this._extractVillageId();
            this.csrfHash = this._extractCSRF();
            
            if (!this.villageId || !this.csrfHash) {
                throw new Error('Missing village ID or CSRF');
            }
            
            console.log(`✅ Initialized: ${this.domain}, Village: ${this.villageId}`);
            this.initialized = true;
            return true;
            
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            throw error;
        }
    }
    
    // Helper methods remain the same...
    _extractVillageId() {
        const urlParams = new URLSearchParams(window.location.search);
        const village = urlParams.get('village');
        if (village) return village;
        if (window.GameData?.village) return window.GameData.village;
        const villageInput = document.querySelector('input[name="village"]');
        return villageInput?.value || null;
    }
    
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
    
    // Core attack function remains the same...
    async _executeAttack(x, y, troops = {}) {
        if (!this.initialized) await this.init();
        
        console.log(`⚔️ Executing attack to ${x}|${y}...`);
        
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
            // Step 1: Get confirmation
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
            
            const confirmResponse = await fetch(`https://${this.domain}/game.php?village=${this.villageId}&screen=place&ajax=confirm`, {
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
            
            // Step 2: Send final attack
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
            
            const finalResponse = await fetch(`https://${this.domain}/game.php?village=${this.villageId}&screen=place&ajaxaction=popup_command`, {
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
            
            console.log(`✅ Attack sent to ${x}|${y}`);
            
            return {
                success: true,
                message: `Attack sent to ${x}|${y}`,
                target: { x, y },
                troops: allTroops,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`✗ Attack to ${x}|${y} failed:`, error.message);
            return {
                success: false,
                error: error.message,
                target: { x, y },
                timestamp: new Date().toISOString()
            };
        }
    }
    
    // UPDATED: Parse time with millisecond support
    _parseTime(timeStr) {
        if (!timeStr) return null;
        
        // Timestamp (ms or seconds)
        if (/^\d+$/.test(timeStr)) {
            const ts = parseInt(timeStr);
            return ts < 10000000000 ? ts * 1000 : ts;
        }
        
        // NEW: Relative time with milliseconds support
        // Supports: +100ms, +1.5s, +500ms, +0.5s, +1m, +2h, etc.
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
                default: ms = value * 1000; // Default to seconds
            }
            
            return Date.now() + ms;
        }
        
        // HH:MM:SS or HH:MM:SS:SSS (with milliseconds)
        const timeOnlyMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?::(\d{1,3}))?$/);
        if (timeOnlyMatch) {
            const now = new Date();
            const hour = parseInt(timeOnlyMatch[1]);
            const minute = parseInt(timeOnlyMatch[2]);
            const second = timeOnlyMatch[3] ? parseInt(timeOnlyMatch[3]) : 0;
            const ms = timeOnlyMatch[4] ? parseInt(timeOnlyMatch[4]) : 0;
            
            const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, second, ms);
            
            // If time passed today, schedule for tomorrow
            if (target.getTime() <= now.getTime()) {
                target.setDate(target.getDate() + 1);
            }
            
            return target.getTime();
        }
        
        // YYYY-MM-DD HH:MM:SS or YYYY-MM-DD HH:MM:SS:SSS
        const fullMatch = timeStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?(?::(\d{1,3}))?$/);
        if (fullMatch) {
            const year = parseInt(fullMatch[1]);
            const month = parseInt(fullMatch[2]) - 1;
            const day = parseInt(fullMatch[3]);
            const hour = parseInt(fullMatch[4]);
            const minute = parseInt(fullMatch[5]);
            const second = fullMatch[6] ? parseInt(fullMatch[6]) : 0;
            const ms = fullMatch[7] ? parseInt(fullMatch[7]) : 0;
            
            return new Date(year, month, day, hour, minute, second, ms).getTime();
        }
        
        // Try Date.parse as last resort
        const parsed = Date.parse(timeStr);
        return isNaN(parsed) ? null : parsed;
    }
    
    // IMMEDIATE ATTACK
    async attack(x, y, troops = {}) {
        return await this._executeAttack(x, y, troops);
    }
    
    // PRECISE TIMING ATTACK WITH MILLISECOND SUPPORT
    async attackPreciseTime(x, y, troops = {}, startTime) {
        const targetTime = this._parseTime(startTime);
        
        if (!targetTime) {
            return {
                success: false,
                error: `Invalid time format: ${startTime}. Use: "+100ms", "+1.5s", "14:30:00:500", etc.`,
                target: { x, y }
            };
        }
        
        const now = Date.now();
        const delay = targetTime - now;
        
        if (delay <= 0) {
            console.log(`⏰ Time has passed, attacking ${x}|${y} immediately`);
            return await this._executeAttack(x, y, troops);
        }
        
        // Format delay for display
        let delayText = '';
        if (delay < 1000) {
            delayText = `${delay}ms`;
        } else if (delay < 60000) {
            delayText = `${(delay/1000).toFixed(2)}s`;
        } else if (delay < 3600000) {
            delayText = `${(delay/60000).toFixed(1)}m`;
        } else {
            delayText = `${(delay/3600000).toFixed(1)}h`;
        }
        
        console.log(`⏱️ Scheduled attack to ${x}|${y} in ${delayText} (${new Date(targetTime).toLocaleTimeString()}.${new Date(targetTime).getMilliseconds()})`);
        
        // Generate unique ID
        const attackId = `attack_${x}_${y}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Schedule with millisecond precision
        const timeoutId = setTimeout(async () => {
            console.log(`🚀 Scheduled time reached for ${x}|${y} (${new Date().toISOString()})`);
            const result = await this._executeAttack(x, y, troops);
            
            // Update stored attack
            const attack = this.scheduledAttacks.get(attackId);
            if (attack) {
                attack.result = result;
                attack.status = 'completed';
                attack.completedAt = new Date().toISOString();
            }
            
        }, delay);
        
        // Store attack info
        this.scheduledAttacks.set(attackId, {
            id: attackId,
            target: { x, y },
            troops: troops,
            scheduledTime: new Date(targetTime).toISOString(),
            scheduledTimeMs: targetTime,
            timeoutId: timeoutId,
            status: 'scheduled',
            createdAt: new Date().toISOString(),
            delayMs: delay
        });
        
        return {
            success: true,
            scheduled: true,
            attackId: attackId,
            message: `Attack scheduled to ${x}|${y} at ${new Date(targetTime).toLocaleTimeString()}.${new Date(targetTime).getMilliseconds()}`,
            target: { x, y },
            scheduledTime: new Date(targetTime).toISOString(),
            delayMs: delay,
            delayText: delayText
        };
    }
    
    // BATCH ATTACKS WITH MILLISECOND PRECISION
    async attackMultiple(targets, options = {}) {
        const {
            delay = 2000,
            parallel = true,
            stagger = true // Whether to stagger attacks when no startTime specified
        } = options;
        
        console.log(`📦 Scheduling ${targets.length} attacks...`);
        
        const results = [];
        const scheduledAttacks = [];
        
        if (parallel) {
            // PARALLEL: Schedule all independently
            for (let i = 0; i < targets.length; i++) {
                const target = targets[i];
                
                console.log(`[${i + 1}/${targets.length}] Scheduling ${target.x}|${target.y}`);
                
                let result;
                if (target.startTime) {
                    // Use specified start time
                    result = await this.attackPreciseTime(target.x, target.y, target.troops || {}, target.startTime);
                } else if (stagger) {
                    // Calculate staggered time
                    const staggeredTime = Date.now() + (i * delay);
                    result = await this.attackPreciseTime(target.x, target.y, target.troops || {}, staggeredTime);
                } else {
                    // All at same time (no stagger)
                    result = await this.attackPreciseTime(target.x, target.y, target.troops || {}, Date.now());
                }
                
                results.push(result);
                if (result.attackId) {
                    scheduledAttacks.push(result.attackId);
                }
                
                console.log(result.scheduled ? '✓ Scheduled' : result.success ? '✓ Sent' : '✗ Failed');
            }
            
            console.log(`✅ All ${targets.length} attacks scheduled in parallel`);
            
        } else {
            // SEQUENTIAL: Wait for each to complete
            for (let i = 0; i < targets.length; i++) {
                const target = targets[i];
                
                console.log(`\n[${i + 1}/${targets.length}] ${target.x}|${target.y}`);
                
                if (i > 0 && !target.startTime) {
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                
                let result;
                if (target.startTime) {
                    result = await this.attackPreciseTime(target.x, target.y, target.troops || {}, target.startTime);
                } else {
                    result = await this.attack(target.x, target.y, target.troops || {});
                }
                
                results.push(result);
                console.log(result.success ? '✓ Success' : '✗ Failed');
            }
        }
        
        return {
            batchId: `batch_${Date.now()}`,
            total: targets.length,
            scheduled: scheduledAttacks.length,
            immediate: results.filter(r => !r.scheduled && r.success).length,
            failed: results.filter(r => !r.success).length,
            results: results,
            scheduledAttackIds: scheduledAttacks
        };
    }
    
    // Cancel scheduled attack
    cancelScheduledAttack(attackId) {
        const attack = this.scheduledAttacks.get(attackId);
        if (attack && attack.timeoutId) {
            clearTimeout(attack.timeoutId);
            attack.status = 'cancelled';
            attack.cancelledAt = new Date().toISOString();
            console.log(`❌ Cancelled scheduled attack ${attackId}`);
            return { success: true, attackId, message: 'Attack cancelled' };
        }
        return { success: false, attackId, message: 'Attack not found' };
    }
    
    // Get scheduled attacks
    getScheduledAttacks() {
        return Array.from(this.scheduledAttacks.values()).map(attack => ({
            id: attack.id,
            target: attack.target,
            scheduledTime: attack.scheduledTime,
            status: attack.status,
            delayMs: attack.delayMs,
            createdAt: attack.createdAt
        }));
    }
    
    // Get info
    getInfo() {
        return {
            domain: this.domain,
            village: this.villageId,
            csrf: this.csrfHash ? '***' + this.csrfHash.slice(-4) : null,
            initialized: this.initialized,
            scheduledAttacks: this.scheduledAttacks.size
        };
    }
}

// Create instance
const msAttack = new MillisecondPrecisionAttack();

// Initialize
msAttack.init().then(() => {
    console.log('🎯 Tribal Wars Millisecond-Precision Attack ready!');
}).catch(err => {
    console.warn('Will initialize on first attack');
});

// Export functions
window.attack = async function(x, y, troops) {
    return await msAttack.attack(x, y, troops);
};

window.attackPreciseTime = async function(x, y, troops, startTime) {
    return await msAttack.attackPreciseTime(x, y, troops, startTime);
};

window.attackMultiple = async function(targets, options) {
    return await msAttack.attackMultiple(targets, options);
};

window.cancelScheduledAttack = function(attackId) {
    return msAttack.cancelScheduledAttack(attackId);
};

window.getScheduledAttacks = function() {
    return msAttack.getScheduledAttacks();
};

window.getAttackInfo = function() {
    return msAttack.getInfo();
};

console.log('🎯 Tribal Wars Millisecond-Precision Attack Script loaded!');
console.log('');
console.log('🌟 NEW FEATURES:');
console.log('- Millisecond precision: +100ms, +500ms, +1.5s');
console.log('- Decimal seconds: +0.5s, +1.25s, +2.75s');
console.log('- Millisecond display in logs');
console.log('- Parallel scheduling with exact timing');
console.log('');
console.log('COMMANDS:');
console.log('attack(x, y, troops) - Immediate attack');
console.log('attackPreciseTime(x, y, troops, time) - Schedule with ms precision');
console.log('attackMultiple(targets, options) - Batch attacks');
console.log('cancelScheduledAttack(id) - Cancel scheduled attack');
console.log('getScheduledAttacks() - View scheduled attacks');
console.log('getAttackInfo() - Get current info');
console.log('');
console.log('TIME FORMATS (NEW!):');
console.log('- "+100ms" - 100 milliseconds from now');
console.log('- "+500ms" - 500 milliseconds from now');
console.log('- "+1.5s" - 1.5 seconds from now');
console.log('- "+0.25s" - 0.25 seconds from now');
console.log('- "+2.75s" - 2.75 seconds from now');
console.log('- "+1m" - 1 minute from now');
console.log('- "+2h" - 2 hours from now');
console.log('- "14:30:00:500" - Today at 14:30:00.500');
console.log('- "2026-01-25 14:30:00:250" - Specific date with ms');
console.log('');
console.log('EXAMPLES:');
console.log('// Millisecond precision attacks');
console.log('await attackPreciseTime(541, 654, {spear:1}, "+100ms")');
console.log('await attackPreciseTime(540, 653, {spear:1}, "+500ms")');
console.log('await attackPreciseTime(542, 655, {spear:1}, "+1.5s")');
console.log('');
console.log('// Staggered attacks with ms precision');
console.log('await attackMultiple([');
console.log('  {x:541, y:654, troops:{spear:1}, startTime:"+100ms"},');
console.log('  {x:540, y:653, troops:{spear:1}, startTime:"+600ms"},');
console.log('  {x:542, y:655, troops:{spear:1}, startTime:"+1100ms"}');
console.log('], {parallel: true})');
console.log('');
console.log('// High-frequency attack wave');
console.log('const wave = [];');
console.log('for (let i = 0; i < 10; i++) {');
console.log('  wave.push({x:541, y:654, troops:{spear:1}, startTime:`+${i*100}ms`})');
console.log('}');
console.log('await attackMultiple(wave, {parallel: true})');
