// Tribal Wars Attack Script - Persistent Data Version
// Stores initialization data for scheduled attacks

class PersistentTribalWarsAttack {
    constructor() {
        this.domain = null;
        this.villageId = null;
        this.csrfHash = null;
        this.initialized = false;
        this.scheduledAttacks = new Map();
        this.attackData = new Map(); // Store attack-specific data
    }
    
    // Initialize and STORE data
    async init() {
        try {
            this.domain = window.location.hostname;
            const urlParams = new URLSearchParams(window.location.search);
            this.villageId = urlParams.get('village') || this._extractVillageId();
            this.csrfHash = this._extractCSRF();
            
            if (!this.villageId || !this.csrfHash) {
                throw new Error('Missing village ID or CSRF. Please navigate to a Tribal Wars page.');
            }
            
            console.log(`✅ Initialized: ${this.domain}, Village: ${this.villageId}`);
            this.initialized = true;
            
            // Store initialization data for later use
            this._storeInitializationData();
            
            return true;
            
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            
            // Try to load stored data as fallback
            this._loadStoredData();
            
            if (this.villageId && this.csrfHash) {
                console.log('📂 Using stored data from previous session');
                this.initialized = true;
                return true;
            }
            
            throw error;
        }
    }
    
    // Store initialization data in localStorage
    _storeInitializationData() {
        const storageKey = 'tw_attack_data';
        const data = {
            domain: this.domain,
            villageId: this.villageId,
            csrfHash: this.csrfHash,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem(storageKey, JSON.stringify(data));
            console.log('💾 Stored attack data for scheduled attacks');
        } catch (e) {
            console.warn('Could not store data in localStorage:', e.message);
        }
    }
    
    // Load stored data from localStorage
    _loadStoredData() {
        const storageKey = 'tw_attack_data';
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                
                // Only use if not too old (1 hour)
                if (Date.now() - data.timestamp < 3600000) {
                    this.domain = data.domain;
                    this.villageId = data.villageId;
                    this.csrfHash = data.csrfHash;
                    return true;
                }
            }
        } catch (e) {
            console.warn('Could not load stored data:', e.message);
        }
        return false;
    }
    
    // Store attack-specific data
    _storeAttackData(attackId, data) {
        this.attackData.set(attackId, {
            ...data,
            domain: this.domain,
            villageId: this.villageId,
            csrfHash: this.csrfHash,
            storedAt: Date.now()
        });
    }
    
    // Get attack data
    _getAttackData(attackId) {
        return this.attackData.get(attackId);
    }
    
    // Helper methods (same as before)
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
    
    // Core attack function - NOW WITH PERSISTENT DATA
    async _executeAttack(x, y, troops = {}, attackId = null) {
        // Try to get attack-specific data if provided
        let attackData = attackId ? this._getAttackData(attackId) : null;
        
        // Use attack-specific data if available, otherwise use current instance data
        const domain = attackData?.domain || this.domain;
        const villageId = attackData?.villageId || this.villageId;
        const csrfHash = attackData?.csrfHash || this.csrfHash;
        
        // If still not initialized, try to init
        if (!this.initialized && !attackData) {
            try {
                await this.init();
            } catch (error) {
                return {
                    success: false,
                    error: `Cannot execute attack: ${error.message}`,
                    target: { x, y }
                };
            }
        }
        
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
            confirmData.append('source_village', villageId);
            
            for (const [unit, count] of Object.entries(allTroops)) {
                confirmData.append(unit, count.toString());
            }
            
            confirmData.append('x', x.toString());
            confirmData.append('y', y.toString());
            confirmData.append('input', '');
            confirmData.append('attack', 'l');
            confirmData.append('h', csrfHash);
            
            const confirmUrl = `https://${domain}/game.php?village=${villageId}&screen=place&ajax=confirm`;
            
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
            
            // Step 2: Send final attack
            const finalData = new URLSearchParams();
            finalData.append('attack', 'true');
            finalData.append('ch', chValue);
            finalData.append('cb', 'troop_confirm_submit');
            finalData.append('x', x.toString());
            finalData.append('y', y.toString());
            finalData.append('source_village', villageId);
            finalData.append('village', villageId);
            
            for (const [unit, count] of Object.entries(allTroops)) {
                finalData.append(unit, count.toString());
            }
            
            finalData.append('building', 'main');
            finalData.append('h', csrfHash);
            finalData.append('h', csrfHash);
            
            const finalUrl = `https://${domain}/game.php?village=${villageId}&screen=place&ajaxaction=popup_command`;
            
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
            
            console.log(`✅ Attack sent to ${x}|${y}`);
            
            // Clean up stored attack data
            if (attackId) {
                this.attackData.delete(attackId);
            }
            
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
    
    // Parse time (same as before)
    _parseTime(timeStr) {
        if (!timeStr) return null;
        
        if (/^\d+$/.test(timeStr)) {
            const ts = parseInt(timeStr);
            return ts < 10000000000 ? ts * 1000 : ts;
        }
        
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
                default: ms = value * 1000;
            }
            
            return Date.now() + ms;
        }
        
        const timeOnlyMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?::(\d{1,3}))?$/);
        if (timeOnlyMatch) {
            const now = new Date();
            const hour = parseInt(timeOnlyMatch[1]);
            const minute = parseInt(timeOnlyMatch[2]);
            const second = timeOnlyMatch[3] ? parseInt(timeOnlyMatch[3]) : 0;
            const ms = timeOnlyMatch[4] ? parseInt(timeOnlyMatch[4]) : 0;
            
            const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, second, ms);
            
            if (target.getTime() <= now.getTime()) {
                target.setDate(target.getDate() + 1);
            }
            
            return target.getTime();
        }
        
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
        
        const parsed = Date.parse(timeStr);
        return isNaN(parsed) ? null : parsed;
    }
    
    // IMMEDIATE ATTACK
    async attack(x, y, troops = {}) {
        return await this._executeAttack(x, y, troops);
    }
    
    // SCHEDULED ATTACK WITH PERSISTENT DATA
    async attackPreciseTime(x, y, troops = {}, startTime) {
        // Ensure we're initialized before scheduling
        if (!this.initialized) {
            try {
                await this.init();
            } catch (error) {
                return {
                    success: false,
                    error: `Cannot schedule attack: ${error.message}`,
                    target: { x, y }
                };
            }
        }
        
        const targetTime = this._parseTime(startTime);
        
        if (!targetTime) {
            return {
                success: false,
                error: `Invalid time format: ${startTime}`,
                target: { x, y }
            };
        }
        
        const now = Date.now();
        const delay = targetTime - now;
        
        if (delay <= 0) {
            console.log(`⏰ Time has passed, attacking ${x}|${y} immediately`);
            return await this._executeAttack(x, y, troops);
        }
        
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
        
        // STORE attack data before scheduling
        this._storeAttackData(attackId, {
            x, y, troops,
            targetTime: targetTime
        });
        
        // Schedule the attack
        const timeoutId = setTimeout(async () => {
            console.log(`🚀 Scheduled time reached for ${x}|${y} (${new Date().toISOString()})`);
            
            // Execute with stored attack data
            const result = await this._executeAttack(x, y, troops, attackId);
            
            // Update scheduled attacks map
            const attack = this.scheduledAttacks.get(attackId);
            if (attack) {
                attack.result = result;
                attack.status = 'completed';
                attack.completedAt = new Date().toISOString();
            }
            
        }, delay);
        
        // Store in scheduled attacks map
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
    
    // BATCH ATTACKS
    async attackMultiple(targets, options = {}) {
        const {
            delay = 2000,
            parallel = true,
            stagger = true
        } = options;
        
        console.log(`📦 Scheduling ${targets.length} attacks...`);
        
        // Ensure initialization BEFORE scheduling batch
        if (!this.initialized) {
            try {
                await this.init();
            } catch (error) {
                return {
                    success: false,
                    error: `Cannot schedule batch: ${error.message}`,
                    batchId: `batch_failed_${Date.now()}`
                };
            }
        }
        
        const results = [];
        const scheduledAttacks = [];
        
        if (parallel) {
            // Schedule all in parallel
            for (let i = 0; i < targets.length; i++) {
                const target = targets[i];
                
                console.log(`[${i + 1}/${targets.length}] Scheduling ${target.x}|${target.y}`);
                
                let result;
                if (target.startTime) {
                    result = await this.attackPreciseTime(target.x, target.y, target.troops || {}, target.startTime);
                } else if (stagger) {
                    const staggeredTime = Date.now() + (i * delay);
                    result = await this.attackPreciseTime(target.x, target.y, target.troops || {}, staggeredTime);
                } else {
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
            // Sequential execution
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
            
            // Clean up stored data
            this.attackData.delete(attackId);
            
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
            scheduledAttacks: this.scheduledAttacks.size,
            storedAttackData: this.attackData.size
        };
    }
    
    // Manual set for testing
    manualSet(villageId, csrfHash, domain = null) {
        this.villageId = villageId;
        this.csrfHash = csrfHash;
        if (domain) this.domain = domain;
        this.initialized = true;
        this._storeInitializationData();
        console.log(`✅ Manually set: Village ${villageId}, CSRF: ***${csrfHash.slice(-4)}`);
    }
}

// Create instance
const persistentAttack = new PersistentTribalWarsAttack();

// Initialize
persistentAttack.init().then(() => {
    console.log('🎯 Tribal Wars Persistent Attack ready!');
}).catch(err => {
    console.warn('⚠️ Not initialized yet. Will initialize on first attack or use manualSet().');
});

// Export functions
window.attack = async function(x, y, troops) {
    return await persistentAttack.attack(x, y, troops);
};

window.attackPreciseTime = async function(x, y, troops, startTime) {
    return await persistentAttack.attackPreciseTime(x, y, troops, startTime);
};

window.attackMultiple = async function(targets, options) {
    return await persistentAttack.attackMultiple(targets, options);
};

window.cancelScheduledAttack = function(attackId) {
    return persistentAttack.cancelScheduledAttack(attackId);
};

window.getScheduledAttacks = function() {
    return persistentAttack.getScheduledAttacks();
};

window.getAttackInfo = function() {
    return persistentAttack.getInfo();
};

window.manualSet = function(villageId, csrfHash, domain) {
    return persistentAttack.manualSet(villageId, csrfHash, domain);
};

window.clearStoredData = function() {
    localStorage.removeItem('tw_attack_data');
    console.log('🧹 Cleared stored attack data');
};

console.log('🎯 Tribal Wars Persistent Attack Script loaded!');
console.log('');
console.log('🔄 KEY FIX: Data persistence for scheduled attacks');
console.log('- Stores village ID and CSRF hash for scheduled attacks');
console.log('- Works even if page context changes');
console.log('- Uses localStorage as backup');
console.log('');
console.log('COMMANDS:');
console.log('attack(x, y, troops) - Immediate attack');
console.log('attackPreciseTime(x, y, troops, time) - Schedule attack');
console.log('attackMultiple(targets, options) - Batch attacks');
console.log('manualSet(villageId, csrfHash, domain) - Manual setup');
console.log('getScheduledAttacks() - View scheduled attacks');
console.log('clearStoredData() - Clear stored data');
console.log('');
console.log('IF INITIALIZATION FAILS:');
console.log('// Manual setup (get these from your Tribal Wars URL)');
console.log('manualSet("25034", "683500cb", "en152.tribalwars.net")');
console.log('');
console.log('// Then schedule attacks');
console.log('await attackPreciseTime(541, 654, {spear:1}, "+100ms")');
console.log('');
console.log('EXAMPLES:');
console.log('// 1. First, ensure initialization');
console.log('// If auto-init fails, use manual setup:');
console.log('manualSet("25034", "683500cb")');
console.log('');
console.log('// 2. Schedule millisecond-precision attacks');
console.log('const batch = await attackMultiple([');
console.log('  {x:541, y:654, troops:{spear:1}, startTime:"+100ms"},');
console.log('  {x:540, y:653, troops:{spear:1}, startTime:"+200ms"},');
console.log('  {x:542, y:655, troops:{spear:1}, startTime:"+300ms"}');
console.log('], {parallel: true})');
console.log('');
console.log('// 3. Check scheduled attacks');
console.log('getScheduledAttacks()');
