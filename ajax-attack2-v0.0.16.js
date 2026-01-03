// Enhanced Tribal Wars Attack Script with Command Tracking
// Captures attack IDs and provides tracking functions

class EnhancedTribalWarsAttack {
    constructor() {
        this.domain = null;
        this.villageId = null;
        this.csrfHash = null;
        this.world = null;
        this.initialized = false;
        this.lastAttackId = null;
        this.pendingAttacks = new Map(); // Track sent attacks
    }
    
    async init() {
        // [Previous initialization code remains the same...]
        this.domain = window.location.hostname;
        const urlParams = new URLSearchParams(window.location.search);
        this.villageId = urlParams.get('village') || this.extractVillageIdFromPage();
        this.csrfHash = this.extractCSRF();
        
        // Extract world
        const domainMatch = this.domain.match(/([a-z]{2}\d+)\./);
        this.world = domainMatch ? domainMatch[1] : this.extractWorldFromURL();
        
        console.log(`✅ Enhanced Attack initialized: ${this.domain}, Village: ${this.villageId}`);
        this.initialized = true;
        return true;
    }
    
    // Extract world, village ID, CSRF methods remain the same...
    // [Include all the extraction methods from previous version]
    
    // Enhanced attack function that tries to capture command ID
    async attack(x, y, troops = {}, attackType = 'l', commandName = '') {
        if (!this.initialized) await this.init();
        
        console.log(`⚔️ Attacking ${x}|${y}...`);
        
        // Generate a tracking ID for this attack
        const trackingId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const attackKey = `${x}|${y}_${trackingId}`;
        
        // Store pending attack
        this.pendingAttacks.set(attackKey, {
            id: trackingId,
            x, y, troops, attackType,
            name: commandName || `Attack_${x}_${y}`,
            sentTime: new Date(),
            status: 'sending'
        });
        
        try {
            // [Previous attack code: confirm and finalize steps...]
            // Include all the fetch logic from previous version
            
            // After successful attack, try to get command ID
            console.log('✓ Attack sent, attempting to capture command ID...');
            
            // Method 1: Try to extract from response
            const commandId = await this.extractCommandIdFromResponse(finalResult);
            if (commandId) {
                console.log(`📋 Command ID found in response: ${commandId}`);
                this.lastAttackId = commandId;
                
                // Update pending attack
                const attackInfo = this.pendingAttacks.get(attackKey);
                if (attackInfo) {
                    attackInfo.commandId = commandId;
                    attackInfo.status = 'sent';
                    attackInfo.confirmedTime = new Date();
                }
                
                return {
                    success: true,
                    message: `Attack sent to ${x}|${y}`,
                    commandId: commandId,
                    trackingId: trackingId,
                    attackKey: attackKey,
                    target: { x, y },
                    response: finalResult
                };
            }
            
            // Method 2: If no ID in response, fetch command list
            console.log('No ID in response, fetching command list...');
            const commands = await this.fetchCommandList();
            
            // Try to find our attack in the list
            const foundCommand = this.findCommandInList(commands, x, y, trackingId);
            
            if (foundCommand) {
                console.log(`📋 Command found in list: ${foundCommand.id}`);
                this.lastAttackId = foundCommand.id;
                
                // Update pending attack
                const attackInfo = this.pendingAttacks.get(attackKey);
                if (attackInfo) {
                    attackInfo.commandId = foundCommand.id;
                    attackInfo.status = 'confirmed';
                    attackInfo.confirmedTime = new Date();
                }
                
                return {
                    success: true,
                    message: `Attack sent to ${x}|${y}`,
                    commandId: foundCommand.id,
                    trackingId: trackingId,
                    attackKey: attackKey,
                    target: { x, y },
                    commandData: foundCommand
                };
            }
            
            // If we still don't have an ID, return success but note it
            console.log('⚠️ Command ID not found, attack was still sent');
            
            const attackInfo = this.pendingAttacks.get(attackKey);
            if (attackInfo) {
                attackInfo.status = 'sent_no_id';
            }
            
            return {
                success: true,
                message: `Attack sent to ${x}|${y} (ID not captured)`,
                trackingId: trackingId,
                attackKey: attackKey,
                target: { x, y },
                note: 'Command ID not captured, check place overview'
            };
            
        } catch (error) {
            console.error('✗ Attack failed:', error);
            
            // Update pending attack status
            const attackInfo = this.pendingAttacks.get(attackKey);
            if (attackInfo) {
                attackInfo.status = 'failed';
                attackInfo.error = error.message;
            }
            
            return {
                success: false,
                error: error.message,
                trackingId: trackingId,
                attackKey: attackKey,
                target: { x, y }
            };
        }
    }
    
    // Try to extract command ID from attack response
    extractCommandIdFromResponse(response) {
        // Tribal Wars might return command ID in different places:
        
        // 1. Check for command_id in response
        if (response.command_id) {
            return response.command_id;
        }
        
        // 2. Check response.data
        if (response.data?.command_id) {
            return response.data.command_id;
        }
        
        // 3. Check response.response
        if (response.response?.command_id) {
            return response.response.command_id;
        }
        
        // 4. Parse dialog for command ID
        if (response.response?.dialog) {
            const dialog = response.response.dialog;
            
            // Look for command ID in dialog HTML
            const idMatch = dialog.match(/command[_-]id["']?\s*[:=]\s*["']?(\d+)["']?/i);
            if (idMatch) return idMatch[1];
            
            // Look for data-command-id attribute
            const dataMatch = dialog.match(/data-command-id=["'](\d+)["']/i);
            if (dataMatch) return dataMatch[1];
        }
        
        // 5. Check for any numeric ID that looks like a command ID
        const jsonString = JSON.stringify(response);
        const idMatches = jsonString.match(/"id"\s*:\s*(\d+)/g);
        if (idMatches) {
            // Get the largest number (likely the command ID)
            const ids = idMatches.map(match => parseInt(match.match(/\d+/)[0]));
            return Math.max(...ids).toString();
        }
        
        return null;
    }
    
    // Fetch current command list
    async fetchCommandList() {
        console.log('Fetching command list...');
        
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
            
            if (!response.ok) {
                throw new Error(`Failed to fetch commands: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Parse commands from the response
            return this.parseCommandsFromResponse(data);
            
        } catch (error) {
            console.error('Failed to fetch command list:', error);
            return [];
        }
    }
    
    // Parse commands from AJAX response
    parseCommandsFromResponse(response) {
        const commands = [];
        
        // Tribal Wars typically returns commands in the response HTML
        if (response.response?.html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(response.response.html, 'text/html');
            
            // Look for command rows
            const commandRows = doc.querySelectorAll('.command-row, tr[data-command-id], [data-id]');
            
            commandRows.forEach(row => {
                const command = {
                    id: row.getAttribute('data-command-id') || row.getAttribute('data-id') || row.id,
                    type: row.getAttribute('data-type') || this.extractCommandType(row),
                    target: this.extractTargetFromRow(row),
                    arrival: this.extractArrivalTime(row),
                    troops: this.extractTroopsFromRow(row),
                    raw: row.outerHTML
                };
                
                if (command.id) {
                    commands.push(command);
                }
            });
        }
        
        console.log(`Parsed ${commands.length} commands from list`);
        return commands;
    }
    
    // Helper to extract command type from row
    extractCommandType(row) {
        const text = row.textContent.toLowerCase();
        if (text.includes('attack')) return 'attack';
        if (text.includes('raid')) return 'raid';
        if (text.includes('spy')) return 'spy';
        if (text.includes('support')) return 'support';
        return 'unknown';
    }
    
    // Helper to extract target coordinates
    extractTargetFromRow(row) {
        const text = row.textContent;
        const coordMatch = text.match(/(\d+)\|(\d+)/);
        if (coordMatch) {
            return {
                x: parseInt(coordMatch[1]),
                y: parseInt(coordMatch[2])
            };
        }
        return null;
    }
    
    // Helper to extract arrival time
    extractArrivalTime(row) {
        const timeMatch = row.textContent.match(/(\d{1,2}):(\d{2}):(\d{2})/);
        if (timeMatch) {
            return `${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3]}`;
        }
        return null;
    }
    
    // Helper to extract troop counts
    extractTroopsFromRow(row) {
        const troops = {};
        const troopTypes = ['spear', 'sword', 'axe', 'archer', 'spy', 'light', 'marcher', 'heavy', 'ram', 'catapult', 'knight', 'snob'];
        
        troopTypes.forEach(type => {
            const countMatch = row.textContent.match(new RegExp(`${type}\\s*[:=]\\s*(\\d+)`, 'i'));
            if (countMatch) {
                troops[type] = parseInt(countMatch[1]);
            }
        });
        
        return troops;
    }
    
    // Find our attack in the command list
    findCommandInList(commands, targetX, targetY, trackingId) {
        // First try to find by exact coordinates
        for (const command of commands) {
            if (command.target && 
                command.target.x === targetX && 
                command.target.y === targetY &&
                command.type === 'attack') {
                return command;
            }
        }
        
        // If not found by coordinates, try to find the most recent attack
        const attackCommands = commands.filter(cmd => cmd.type === 'attack');
        if (attackCommands.length > 0) {
            // Return the first one (likely most recent)
            return attackCommands[0];
        }
        
        return null;
    }
    
    // Rename a command (if the game supports it)
    async renameCommand(commandId, newName) {
        console.log(`Renaming command ${commandId} to "${newName}"...`);
        
        // Tribal Wars might have different endpoints for renaming
        // This is a common pattern
        const renameUrl = `https://${this.domain}/game.php?village=${this.villageId}&screen=place&ajaxaction=rename_command`;
        
        const formData = new URLSearchParams();
        formData.append('command_id', commandId);
        formData.append('name', newName);
        formData.append('h', this.csrfHash);
        
        try {
            const response = await fetch(renameUrl, {
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
                console.log(`✅ Command ${commandId} renamed to "${newName}"`);
                return { success: true, commandId, newName };
            } else {
                throw new Error(result.error_msg || 'Rename failed');
            }
            
        } catch (error) {
            console.error(`Failed to rename command ${commandId}:`, error);
            return { success: false, error: error.message, commandId };
        }
    }
    
    // Cancel a command
    async cancelCommand(commandId) {
        console.log(`Cancelling command ${commandId}...`);
        
        const cancelUrl = `https://${this.domain}/game.php?village=${this.villageId}&screen=place&ajaxaction=cancel_command`;
        
        const formData = new URLSearchParams();
        formData.append('command_id', commandId);
        formData.append('h', this.csrfHash);
        
        try {
            const response = await fetch(cancelUrl, {
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
                console.log(`✅ Command ${commandId} cancelled`);
                return { success: true, commandId };
            } else {
                throw new Error(result.error_msg || 'Cancel failed');
            }
            
        } catch (error) {
            console.error(`Failed to cancel command ${commandId}:`, error);
            return { success: false, error: error.message, commandId };
        }
    }
    
    // Get pending attacks
    getPendingAttacks() {
        return Array.from(this.pendingAttacks.values());
    }
    
    // Get attack by tracking ID
    getAttack(trackingId) {
        for (const [key, attack] of this.pendingAttacks) {
            if (attack.id === trackingId || key.includes(trackingId)) {
                return attack;
            }
        }
        return null;
    }
    
    // Clear old pending attacks
    clearOldAttacks(hours = 24) {
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
        let cleared = 0;
        
        for (const [key, attack] of this.pendingAttacks) {
            if (attack.sentTime.getTime() < cutoffTime) {
                this.pendingAttacks.delete(key);
                cleared++;
            }
        }
        
        console.log(`Cleared ${cleared} old attacks`);
        return cleared;
    }
    
    // Batch attack with naming
    async batchAttackWithNames(targets, nameTemplate = 'Attack_{index}_{x}_{y}') {
        const results = [];
        
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const attackName = nameTemplate
                .replace('{index}', i + 1)
                .replace('{x}', target.x)
                .replace('{y}', target.y)
                .replace('{type}', target.attackType || 'attack');
            
            console.log(`\n[${i + 1}/${targets.length}] ${attackName}`);
            
            const result = await this.attack(
                target.x,
                target.y,
                target.troops || {},
                target.attackType || 'l',
                attackName
            );
            
            results.push(result);
            
            // If we got a command ID, try to rename it
            if (result.success && result.commandId && attackName) {
                const renameResult = await this.renameCommand(result.commandId, attackName);
                result.renameResult = renameResult;
            }
            
            // Add delay between attacks
            if (i < targets.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        return results;
    }
}

// Create global instance
const enhancedAttack = new EnhancedTribalWarsAttack();

// Initialize
enhancedAttack.init().then(() => {
    console.log('🎯 Enhanced Tribal Wars Attack ready!');
}).catch(console.warn);

// Export functions
window.attack = async function(x, y, troops, attackType, name) {
    return await enhancedAttack.attack(x, y, troops, attackType, name);
};

window.raid = async function(x, y, troops, name) {
    return await enhancedAttack.attack(x, y, troops, 'r', name);
};

window.renameCommand = async function(commandId, newName) {
    return await enhancedAttack.renameCommand(commandId, newName);
};

window.cancelCommand = async function(commandId) {
    return await enhancedAttack.cancelCommand(commandId);
};

window.getCommands = async function() {
    return await enhancedAttack.fetchCommandList();
};

window.getPendingAttacks = function() {
    return enhancedAttack.getPendingAttacks();
};

window.getAttackInfo = function(trackingId) {
    return enhancedAttack.getAttack(trackingId);
};

window.batchNamed = async function(targets, nameTemplate) {
    return await enhancedAttack.batchAttackWithNames(targets, nameTemplate);
};

console.log('🎯 Enhanced Tribal Wars Attack loaded!');
console.log('New features:');
console.log('- Tracks attack IDs when possible');
console.log('- Can rename commands with renameCommand(id, name)');
console.log('- Can cancel commands with cancelCommand(id)');
console.log('- Tracks pending attacks with getPendingAttacks()');
console.log('- Batch attacks with naming: batchNamed(targets, template)');
console.log('');
console.log('Examples:');
console.log('// Send attack with name');
console.log('const result = await attack(541, 654, {spear:1}, "l", "Farm1");');
console.log('if (result.commandId) await renameCommand(result.commandId, "Farm_Attack");');
console.log('');
console.log('// Batch with names');
console.log('await batchNamed([');
console.log('  {x:541, y:654, troops:{spear:1}},');
console.log('  {x:540, y:653, troops:{spear:2}}');
console.log('], "Farm_{index}");');
console.log('');
console.log('// Get pending attacks');
console.log('getPendingAttacks();');
