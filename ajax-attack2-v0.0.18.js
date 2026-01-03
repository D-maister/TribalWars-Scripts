// Tribal Wars Precise Attack Script
// Supports exact timing for attacks

class PreciseTribalWarsAttack {
    constructor() {
        this.domain = null;
        this.villageId = null;
        this.csrfHash = null;
        this.world = null;
        this.initialized = false;
    }
    
    // Initialize with current page data
    async init() {
        this.domain = window.location.hostname;
        
        // Get village ID
        const urlParams = new URLSearchParams(window.location.search);
        this.villageId = urlParams.get('village') || this._extractVillageId();
        
        // Get CSRF hash
        this.csrfHash = this._extractCSRF();
        
        // Get world
        const domainMatch = this.domain.match(/([a-z]{2}\d+)\./);
        this.world = domainMatch ? domainMatch[1] : 'unknown';
        
        if (!this.villageId || !this.csrfHash) {
            throw new Error('Could not initialize. Make sure you are on a Tribal Wars page.');
        }
        
        console.log(`✅ Initialized: ${this.domain}, Village: ${this.villageId}`);
        this.initialized = true;
        return true;
    }
    
    // Helper methods
    _extractVillageId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('village');
    }
    
    _extractCSRF() {
        // URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlHash = urlParams.get('h');
        if (urlHash) return urlHash;
        
        // Input field
        const inputHash = document.querySelector('input[name="h"]')?.value;
        if (inputHash) return inputHash;
        
        // Form action
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
    
    // MAIN ATTACK FUNCTION
    async attack(x, y, troops = {}) {
        if (!this.initialized) await this.init();
        
        console.log(`⚔️ Attacking ${x}|${y}...`);
        
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
            confirmData.append('attack', 'l'); // Always attack
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
                target: { x, y }
            };
        }
    }
    
    // PRECISE TIMING ATTACK
    async attackPreciseTime(x, y, troops = {}, startTime) {
        if (!this.initialized) await this.init();
        
        console.log(`🎯 Scheduling attack to ${x}|${y} at ${startTime}...`);
        
        // Parse start time
        let targetTime;
        try {
            targetTime = this._parseTimeString(startTime);
            if (!targetTime) {
                throw new Error('Invalid time format. Use: YYYY-MM-DD HH:MM:SS or timestamp');
            }
        } catch (error) {
            return {
                success: false,
                error: `Invalid time format: ${error.message}`,
                target: { x, y }
            };
        }
        
        const now = Date.now();
        const delay = targetTime - now;
        
        if (delay < 0) {
            console.warn(`⚠️ Target time is in the past (${-delay}ms ago). Sending immediately.`);
            return await this.attack(x, y, troops);
        }
        
        if (delay > 24 * 60 * 60 * 1000) { // More than 24 hours
            console.warn(`⚠️ Target time is more than 24 hours in the future (${Math.round(delay/3600000)}h).`);
        }
        
        console.log(`⏱️ Waiting ${Math.round(delay/1000)} seconds until ${new Date(targetTime).toLocaleTimeString()}`);
        
        // Create a promise that resolves at the exact time
        return new Promise((resolve) => {
            setTimeout(async () => {
                console.log(`🚀 Time reached! Sending attack to ${x}|${y}...`);
                const result = await this.attack(x, y, troops);
                resolve(result);
            }, delay);
        });
    }
    
    // Parse time string (supports multiple formats)
    _parseTimeString(timeStr) {
        if (!timeStr) return null;
        
        // If it's a timestamp (milliseconds or seconds)
        if (/^\d+$/.test(timeStr)) {
            const ts = parseInt(timeStr);
            // If it's in seconds (10 digits), convert to milliseconds
            return ts < 10000000000 ? ts * 1000 : ts;
        }
        
        // Try different date formats
        const formats = [
            // YYYY-MM-DD HH:MM:SS:SSS
            /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2}):(\d{3})$/,
            // YYYY-MM-DD HH:MM:SS
            /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
            // YYYY-MM-DD HH:MM
            /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/,
            // HH:MM:SS:SSS
            /^(\d{2}):(\d{2}):(\d{2}):(\d{3})$/,
            // HH:MM:SS
            /^(\d{2}):(\d{2}):(\d{2})$/,
            // HH:MM
            /^(\d{2}):(\d{2})$/
        ];
        
        for (const format of formats) {
            const match = timeStr.match(format);
            if (match) {
                let year, month, day, hour, minute, second, millisecond = 0;
                
                if (match.length >= 7) { // Has date
                    year = parseInt(match[1]);
                    month = parseInt(match[2]) - 1;
                    day = parseInt(match[3]);
                    hour = parseInt(match[4]);
                    minute = parseInt(match[5]);
                    second = parseInt(match[6]);
                    if (match[7]) millisecond = parseInt(match[7]);
                } else { // Time only, use today
                    const now = new Date();
                    year = now.getFullYear();
                    month = now.getMonth();
                    day = now.getDate();
                    hour = parseInt(match[1]);
                    minute = parseInt(match[2]);
                    second = match[3] ? parseInt(match[3]) : 0;
                    if (match[4]) millisecond = parseInt(match[4]);
                }
                
                const date = new Date(year, month, day, hour, minute, second, millisecond);
                return date.getTime();
            }
        }
        
        // Try Date.parse as last resort
        const parsed = Date.parse(timeStr);
        if (!isNaN(parsed)) {
            return parsed;
        }
        
        return null;
    }
    
    // BATCH ATTACKS
    async attackMultiple(targets, options = {}) {
        const {
            delay = 2000, // ms between attacks
            preciseTiming = false, // use precise timing for each?
            sequential = true // send sequentially (true) or schedule all at once (false)
        } = options;
        
        console.log(`📦 Starting batch attack (${targets.length} targets)...`);
        
        const results = [];
        
        if (sequential) {
            // Sequential execution (one after another)
            for (let i = 0; i < targets.length; i++) {
                const target = targets[i];
                
                console.log(`\n[${i + 1}/${targets.length}] ${target.x}|${target.y}`);
                
                // Add delay between attacks (except first)
                if (i > 0) {
                    console.log(`⏳ Waiting ${delay}ms...`);
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
                
                // Stop on multiple consecutive errors
                const recentErrors = results.slice(-3).filter(r => !r.success).length;
                if (recentErrors >= 3) {
                    console.warn('⚠️ Too many consecutive errors, stopping batch');
                    break;
                }
            }
        } else {
            // Parallel scheduling (for precise timing)
            const promises = [];
            
            for (let i = 0; i < targets.length; i++) {
                const target = targets[i];
                
                console.log(`[${i + 1}/${targets.length}] Scheduling ${target.x}|${target.y}`);
                
                let promise;
                if (target.startTime) {
                    promise = this.attackPreciseTime(target.x, target.y, target.troops || {}, target.startTime);
                } else {
                    // Calculate staggered start times
                    const staggeredDelay = i * delay;
                    promise = new Promise(resolve => {
                        setTimeout(async () => {
                            const result = await this.attack(target.x, target.y, target.troops || {});
                            resolve(result);
                        }, staggeredDelay);
                    });
                }
                
                promises.push(promise);
            }
            
            // Wait for all promises
            const batchResults = await Promise.all(promises);
            results.push(...batchResults);
        }
        
        console.log('\n📊 Batch complete:', {
            total: results.length,
            success: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        });
        
        return results;
    }
    
    // Get server info
    getInfo() {
        return {
            domain: this.domain,
            world: this.world,
            village: this.villageId,
            csrf: this.csrfHash ? '***' + this.csrfHash.slice(-4) : null,
            initialized: this.initialized
        };
    }
}

// Create global instance
const preciseAttack = new PreciseTribalWarsAttack();

// Initialize
preciseAttack.init().then(() => {
    console.log('🎯 Tribal Wars Precise Attack ready!');
}).catch(err => {
    console.warn('Will initialize on first attack');
});

// Export console functions
window.attack = async function(x, y, troops) {
    return await preciseAttack.attack(x, y, troops);
};

window.attackPreciseTime = async function(x, y, troops, startTime) {
    return await preciseAttack.attackPreciseTime(x, y, troops, startTime);
};

window.attackMultiple = async function(targets, options) {
    return await preciseAttack.attackMultiple(targets, options);
};

window.getAttackInfo = function() {
    return preciseAttack.getInfo();
};

window.scheduleAttack = async function(x, y, troops, startTime) {
    return await preciseAttack.attackPreciseTime(x, y, troops, startTime);
};

console.log('🎯 Tribal Wars Precise Attack Script loaded!');
console.log('');
console.log('Available commands:');
console.log('attack(x, y, troops) - Send attack immediately');
console.log('attackPreciseTime(x, y, troops, startTime) - Schedule attack for exact time');
console.log('attackMultiple(targets, options) - Batch attacks');
console.log('getAttackInfo() - Get current server/village info');
console.log('scheduleAttack(x, y, troops, startTime) - Alias for attackPreciseTime');
console.log('');
console.log('Time formats supported:');
console.log('- Timestamp (ms): 1745670310020');
console.log('- Date/time: "2026-01-25 14:25:10"');
console.log('- Date/time with ms: "2026-01-25 14:25:10:020"');
console.log('- Time only (today): "14:25:10" or "14:25"');
console.log('');
console.log('Examples:');
console.log('// Immediate attack');
console.log('await attack(541, 654, { spear: 1, sword: 1 })');
console.log('');
console.log('// Precise timing attack');
console.log('await attackPreciseTime(541, 654, { spear: 1 }, "2026-01-25 14:25:10:020")');
console.log('await attackPreciseTime(541, 654, { spear: 1 }, "14:30:00") // Today at 14:30');
console.log('await attackPreciseTime(541, 654, { spear: 1 }, Date.now() + 5000) // 5 seconds from now');
console.log('');
console.log('// Batch attacks');
console.log('await attackMultiple([');
console.log('  { x: 541, y: 654, troops: { spear: 1 } },');
console.log('  { x: 540, y: 653, troops: { spear: 2 } }');
console.log('], { delay: 1500 })');
console.log('');
console.log('// Batch with precise timing');
console.log('await attackMultiple([');
console.log('  { x: 541, y: 654, troops: { spear: 1 }, startTime: "14:25:00" },');
console.log('  { x: 540, y: 653, troops: { spear: 1 }, startTime: "14:25:02" }');
console.log('], { preciseTiming: true })');
