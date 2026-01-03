// Complete Enhanced Tribal Wars Attack Script
// Works on any server, tracks attacks, console-only

class CompleteTribalWarsAttack {
    constructor() {
        this.domain = null;
        this.villageId = null;
        this.csrfHash = null;
        this.world = null;
        this.initialized = false;
        this.lastAttackId = null;
        this.pendingAttacks = new Map();
    }
    
    // Initialize with current page data
    async init() {
        this.domain = window.location.hostname;
        
        // Get village ID from URL or page
        const urlParams = new URLSearchParams(window.location.search);
        this.villageId = urlParams.get('village') || this._extractVillageIdFromPage();
        
        // Get CSRF hash
        this.csrfHash = this._extractCSRF();
        
        // Extract world
        const domainMatch = this.domain.match(/([a-z]{2}\d+)\./);
        this.world = domainMatch ? domainMatch[1] : this._extractWorldFromURL();
        
        if (!this.villageId) {
            throw new Error('Village ID not found. Make sure you are on a Tribal Wars village page.');
        }
        
        if (!this.csrfHash) {
            throw new Error('CSRF hash not found. Make sure you are logged in.');
        }
        
        console.log(`✅ Enhanced Attack initialized: ${this.domain}, Village: ${this.villageId}`);
        this.initialized = true;
        return true;
    }
    
    // PRIVATE HELPER METHODS
    
    _extractWorldFromURL() {
        const path = window.location.pathname;
        const pathMatch = path.match(/\/([a-z]{2}\d+)\//);
        if (pathMatch) return pathMatch[1];
        
        if (window.GameData && window.GameData.world) {
            return window.GameData.world;
        }
        
        const domainParts = this.domain.split('.');
        if (domainParts[0].match(/^[a-z]{2}\d+$/)) {
            return domainParts[0];
        }
        
        return 'unknown';
    }
    
    _extractVillageIdFromPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlVillage = urlParams.get('village');
        if (urlVillage) return urlVillage;
        
        const villageElement = document.querySelector('[data-village-id], [data-id]');
        if (villageElement) {
            return villageElement.getAttribute('data-village-id') || 
                   villageElement.getAttribute('data-id');
        }
        
        if (window.GameData && window.GameData.village) {
            return window.GameData.village;
        }
        
        const villageInput = document.querySelector('input[name="village"]');
        if (villageInput?.value) {
            return villageInput.value;
        }
        
        return null;
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
        
        // Links
        const links = document.querySelectorAll('a[href*="h="]');
        for (const link of links) {
            const href = link.href;
            const match = href.match(/[?&]h=([a-f0-9]{8,})/);
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
    async attack(x, y, troops = {}, attackType = 'l', commandName = '') {
        if (!this.initialized) await this.init();
        
        console.log(`⚔️ Attacking ${x}|${y}...`);
        
        const trackingId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const attackKey = `${x}|${y}_${trackingId}`;
        
        this.pendingAttacks.set(attackKey, {
            id: trackingId,
            x, y, troops, attackType,
            name: commandName || `Attack_${x}_${y}`,
            sentTime: new Date(),
            status: 'sending'
        });
        
        try {
            // Find dynamic field
            const dynamicField = this._findDynamicField();
            
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
            confirmData.append('attack', attackType);
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
            
            console.log('✓ Attack sent!');
            
            // Update pending attack
            const attackInfo = this.pendingAttacks.get(attackKey);
            if (attackInfo) {
                attackInfo.status = 'sent';
                attackInfo.confirmedTime = new Date();
            }
            
            // Try to extract command ID
            const commandId = this._extractCommandIdFromResponse(finalResult);
            if (commandId) {
                console.log(`📋 Command ID: ${commandId}`);
                this.lastAttackId = commandId;
                
                if (attackInfo) {
                    attackInfo.commandId = commandId;
                    attackInfo.status = 'confirmed';
                }
                
                return {
                    success: true,
                    commandId: commandId,
                    trackingId: trackingId,
                    message: `Attack sent to ${x}|${y}`,
                    target: { x, y }
                };
            }
            
            return {
                success: true,
                trackingId: trackingId,
                message: `Attack sent to ${x}|${y} (ID not captured)`,
                target: { x, y }
            };
            
        } catch (error) {
            console.error('✗ Attack failed:', error);
            
            const attackInfo = this.pendingAttacks.get(attackKey);
            if (attackInfo) {
                attackInfo.status = 'failed';
                attackInfo.error = error.message;
            }
            
            return {
                success: false,
                error: error.message,
                trackingId: trackingId,
                target: { x, y }
            };
        }
    }
    
    // Extract command ID from response
    _extractCommandIdFromResponse(response) {
        if (response.command_id) return response.command_id;
        if (response.data?.command_id) return response.data.command_id;
        if (response.response?.command_id) return response.response.command_id;
        
        if (response.response?.dialog) {
            const dialog = response.response.dialog;
            const idMatch = dialog.match(/command[_-]id["']?\s*[:=]\s*["']?(\d+)["']?/i);
            if (idMatch) return idMatch[1];
            
            const dataMatch = dialog.match(/data-command-id=["'](\d+)["']/i);
            if (dataMatch) return dataMatch[1];
        }
        
        return null;
    }
    
    // Fetch command list
    async fetchCommandList() {
        try {
            const url = `https://${this.domain}/game.php?village=${this.villageId}&screen=place_overview&mode=commands`;
            
            const response = await fetch(url, {
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include'
            });
            
            const data = await response.json();
            return this._parseCommandsFromResponse(data);
            
        } catch (error) {
            console.error('Failed to fetch commands:', error);
            return [];
        }
    }
    
    _parseCommandsFromResponse(response) {
        const commands = [];
        
        if (response.response?.html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(response.response.html, 'text/html');
            const rows = doc.querySelectorAll('[data-command-id], [data-id]');
            
            rows.forEach(row => {
                const commandId = row.getAttribute('data-command-id') || row.getAttribute('data-id');
                if (commandId) {
                    commands.push({
                        id: commandId,
                        element: row.outerHTML.substring(0, 200) + '...'
                    });
                }
            });
        }
        
        return commands;
    }
    
    // Rename command (if supported)
    async renameCommand(commandId, newName) {
        console.log(`Attempting to rename command ${commandId} to "${newName}"...`);
        
        // Try different rename endpoints
        const endpoints = [
            `game.php?village=${this.villageId}&screen=place&ajaxaction=rename_command`,
            `game.php?village=${this.villageId}&screen=place&action=rename_command`,
            `game.php?action=rename_command&village=${this.villageId}`
        ];
        
        for (const endpoint of endpoints) {
            try {
                const url = `https://${this.domain}/${endpoint}`;
                const formData = new URLSearchParams();
                formData.append('command_id', commandId);
                formData.append('name', newName);
                formData.append('h', this.csrfHash);
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json, text/javascript, */*; q=0.01',
                        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'tribalwars-ajax': '1',
                        'x-requested-with': 'XMLHttpRequest'
                    },
                    credentials: 'include',
                    body: formData.toString()
                });
                
                const result = await response.json();
                
                if (result.error === false || result.success) {
                    console.log(`✅ Command renamed to "${newName}"`);
                    return { success: true, commandId, newName };
                }
                
            } catch (error) {
                // Try next endpoint
            }
        }
        
        console.warn('⚠️ Rename not supported or failed');
        return { success: false, message: 'Rename not supported' };
    }
    
    // Get pending attacks
    getPendingAttacks() {
        return Array.from(this.pendingAttacks.values());
    }
    
    // Clear old attacks
    clearOldAttacks(hours = 24) {
        const cutoff = Date.now() - (hours * 3600000);
        let cleared = 0;
        
        for (const [key, attack] of this.pendingAttacks) {
            if (attack.sentTime.getTime() < cutoff) {
                this.pendingAttacks.delete(key);
                cleared++;
            }
        }
        
        console.log(`Cleared ${cleared} old attacks`);
        return cleared;
    }
    
    // Batch attacks
    async attackMultiple(targets, delay = 2000) {
        const results = [];
        
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            
            console.log(`\n[${i + 1}/${targets.length}] ${target.x}|${target.y}`);
            
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            const result = await this.attack(
                target.x,
                target.y,
                target.troops || {},
                target.attackType || 'l',
                target.name || ''
            );
            
            results.push(result);
            console.log(result.success ? '✓ Success' : '✗ Failed');
        }
        
        return results;
    }
}

// Create instance and export functions
const completeAttack = new CompleteTribalWarsAttack();

// Initialize
completeAttack.init().then(() => {
    console.log('🎯 Complete Tribal Wars Attack ready!');
}).catch(err => {
    console.warn('Will initialize on first attack');
});

// Export console functions
window.attack = async function(x, y, troops, attackType, name) {
    return await completeAttack.attack(x, y, troops, attackType, name);
};

window.raid = async function(x, y, troops, name) {
    return await completeAttack.attack(x, y, troops, 'r', name);
};

window.spy = async function(x, y, count, name) {
    return await completeAttack.attack(x, y, { spy: count || 1 }, 's', name);
};

window.support = async function(x, y, troops, name) {
    return await completeAttack.attack(x, y, troops, 'u', name);
};

window.attackMultiple = async function(targets, delay) {
    return await completeAttack.attackMultiple(targets, delay);
};

window.renameCommand = async function(commandId, newName) {
    return await completeAttack.renameCommand(commandId, newName);
};

window.getCommands = async function() {
    return await completeAttack.fetchCommandList();
};

window.getPendingAttacks = function() {
    return completeAttack.getPendingAttacks();
};

window.clearOldAttacks = function(hours) {
    return completeAttack.clearOldAttacks(hours);
};

window.getAttackInfo = function() {
    return {
        domain: completeAttack.domain,
        village: completeAttack.villageId,
        world: completeAttack.world,
        lastId: completeAttack.lastAttackId
    };
};

console.log('🎯 Complete Tribal Wars Attack Script loaded!');
console.log('');
console.log('Available commands:');
console.log('attack(x, y, troops, type, name) - Send attack (type: l=attack, r=raid, s=spy, u=support)');
console.log('raid(x, y, troops, name) - Send raid');
console.log('spy(x, y, count, name) - Send spy mission');
console.log('support(x, y, troops, name) - Send support');
console.log('attackMultiple([{x,y,troops,type,name}], delay) - Batch attacks');
console.log('renameCommand(id, name) - Try to rename command (if supported)');
console.log('getCommands() - Fetch current command list');
console.log('getPendingAttacks() - Get tracked attacks');
console.log('clearOldAttacks(hours) - Clear old attack history');
console.log('getAttackInfo() - Get current server/village info');
console.log('');
console.log('Examples:');
console.log('await attack(541, 654, {spear:1}, "l", "Farm1")');
console.log('await raid(541, 654, {spear:5}, "QuickRaid")');
console.log('await attackMultiple([{x:541,y:654},{x:540,y:653}], 1500)');
console.log('const commands = await getCommands()');
console.log('getPendingAttacks()');
