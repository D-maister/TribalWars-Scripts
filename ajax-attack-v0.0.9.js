// Tribal Wars AJAX Helper Class
class TribalWarsAPI {
    constructor(baseUrl = 'https://en152.tribalwars.net') {
        this.baseUrl = baseUrl;
        this.villageId = '25034'; // Current village ID
        this.csrfToken = '683500cb'; // h parameter from HAR
        
        // Headers based on HAR analysis
        this.headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'tribalwars-ajax': '1',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        };
    }
    
    /**
     * Build URL with parameters
     */
    buildUrl(screen, params = {}) {
        const baseParams = {
            village: this.villageId,
            screen: screen
        };
        
        const allParams = {...baseParams, ...params};
        const queryString = new URLSearchParams(allParams).toString();
        return `${this.baseUrl}/game.php?${queryString}`;
    }
    
    /**
     * Get command popup for target village
     * This is the first request when clicking attack from farm list
     */
    async getCommandPopup(targetVillageId) {
        const url = this.buildUrl('place', {
            ajax: 'command',
            target: targetVillageId
        });
        
        console.log('Fetching command popup for village:', targetVillageId);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers,
                credentials: 'include' // Include cookies
            });
            
            const html = await response.text();
            console.log('Command popup response received');
            
            // The response contains HTML for the command popup
            // You would need to parse this to get challenge tokens, etc.
            return html;
            
        } catch (error) {
            console.error('Error getting command popup:', error);
            throw error;
        }
    }
    
    /**
     * Send troops to target village
     * This is the second request after command popup loads
     */
    async sendTroops(targetVillageId, troops = {}, targetX = '541', targetY = '654') {
        const url = this.buildUrl('place', {
            ajax: 'confirm'
        });
        
        // Default troops data from HAR example
        const defaultTroops = {
            '79d131589f81aaeb36d2d2': '7d85610179d131', // Some session/token
            template_id: '',
            source_village: this.villageId,
            spear: '',
            sword: '',
            axe: '',
            archer: '',
            spy: '',
            light: '',
            marcher: '',
            heavy: '',
            ram: '',
            catapult: '',
            knight: '1', // From HAR: knight=1
            snob: '',
            x: targetX,
            y: targetY,
            input: '',
            attack: 'l', // Attack command (l = attack)
            h: this.csrfToken
        };
        
        // Merge with custom troops
        const formData = {...defaultTroops, ...troops};
        
        // Convert to URL-encoded string
        const body = new URLSearchParams(formData).toString();
        
        console.log('Sending troops to:', targetVillageId, 'at', targetX, targetY);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.headers,
                credentials: 'include',
                body: body
            });
            
            const html = await response.text();
            console.log('Send troops response received');
            
            // Parse response to get challenge hash for confirmation
            return this.parseChallengeHash(html);
            
        } catch (error) {
            console.error('Error sending troops:', error);
            throw error;
        }
    }
    
    /**
     * Parse challenge hash from response HTML
     * This would extract the challenge hash needed for final confirmation
     */
    parseChallengeHash(html) {
        // This is a simplified example - you'd need to parse the actual HTML response
        // The challenge hash is typically in a hidden input or JavaScript variable
        
        // Example regex pattern (adjust based on actual response)
        const challengeMatch = html.match(/challenge_hash['"]?\s*:\s*['"]([^'"]+)['"]/);
        if (challengeMatch) {
            return challengeMatch[1];
        }
        
        // Alternative: Look for ch parameter in forms
        const chMatch = html.match(/name=['"]ch['"]\s+value=['"]([^'"]+)['"]/);
        if (chMatch) {
            return chMatch[1];
        }
        
        console.warn('Could not find challenge hash in response');
        return null;
    }
    
    /**
     * Final confirmation of attack
     * This is the third and final request
     */
    async confirmAttack(challengeHash, targetX, targetY, troops = {}) {
        const url = this.buildUrl('place', {
            ajaxaction: 'popup_command'
        });
        
        // Data from HAR example for confirmation
        const formData = {
            attack: 'true',
            ch: challengeHash, // Challenge hash from previous response
            cb: 'troop_confirm_submit',
            x: targetX,
            y: targetY,
            source_village: this.villageId,
            village: this.villageId,
            spear: '0',
            sword: '0',
            axe: '0',
            archer: '0',
            spy: '0',
            light: '0',
            marcher: '0',
            heavy: '0',
            ram: '0',
            catapult: '0',
            knight: '1',
            snob: '0',
            building: 'main',
            h: this.csrfToken
        };
        
        // Merge with custom troops
        Object.assign(formData, troops);
        
        const body = new URLSearchParams(formData).toString();
        
        console.log('Confirming attack with challenge:', challengeHash);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.headers,
                credentials: 'include',
                body: body
            });
            
            const result = await response.text();
            console.log('Attack confirmation response received');
            
            return result;
            
        } catch (error) {
            console.error('Error confirming attack:', error);
            throw error;
        }
    }
    
    /**
     * Complete attack flow (all 3 steps)
     */
    async sendAttack(targetVillageId, targetX = '541', targetY = '654', troops = {}) {
        try {
            // Step 1: Get command popup
            const popupHtml = await this.getCommandPopup(targetVillageId);
            
            // Step 2: Send troops (this would initiate the attack)
            const challengeHash = await this.sendTroops(targetVillageId, troops, targetX, targetY);
            
            if (!challengeHash) {
                throw new Error('Failed to get challenge hash');
            }
            
            // Step 3: Confirm attack
            const result = await this.confirmAttack(challengeHash, targetX, targetY, troops);
            
            console.log('Attack completed successfully');
            return result;
            
        } catch (error) {
            console.error('Attack failed:', error);
            throw error;
        }
    }
    
    /**
     * Alternative: jQuery-style AJAX (matching the game's approach)
     */
    sendAttackJQuery(targetVillageId, targetX = '541', targetY = '654', troops = {}) {
        // This mimics the game's jQuery AJAX calls
        const url = this.buildUrl('place', {
            ajax: 'confirm'
        });
        
        const formData = {
            '79d131589f81aaeb36d2d2': '7d85610179d131',
            template_id: '',
            source_village: this.villageId,
            spear: troops.spear || '',
            sword: troops.sword || '',
            axe: troops.axe || '',
            archer: troops.archer || '',
            spy: troops.spy || '',
            light: troops.light || '',
            marcher: troops.marcher || '',
            heavy: troops.heavy || '',
            ram: troops.ram || '',
            catapult: troops.catapult || '',
            knight: troops.knight || '1',
            snob: troops.snob || '',
            x: targetX,
            y: targetY,
            input: '',
            attack: 'l',
            h: this.csrfToken
        };
        
        // Using jQuery if available (as the game does)
        if (typeof $ !== 'undefined') {
            return $.ajax({
                url: url,
                type: 'POST',
                data: formData,
                headers: this.headers,
                xhrFields: {
                    withCredentials: true
                },
                success: function(response) {
                    console.log('Attack sent successfully');
                    return response;
                },
                error: function(xhr, status, error) {
                    console.error('Attack failed:', error);
                    throw error;
                }
            });
        } else {
            // Fallback to fetch
            return this.sendTroops(targetVillageId, troops, targetX, targetY);
        }
    }
    
    /**
     * Get farm list from Loot Assistant
     */
    async getFarmList() {
        const url = this.buildUrl('am_farm');
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: this.headers,
                credentials: 'include'
            });
            
            const html = await response.text();
            return this.parseFarmList(html);
            
        } catch (error) {
            console.error('Error getting farm list:', error);
            throw error;
        }
    }
    
    /**
     * Parse farm list HTML to extract villages
     */
    parseFarmList(html) {
        // This would parse the HTML to extract farmable villages
        // The farm list is in a table with id "plunder_list"
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const villages = [];
        const rows = doc.querySelectorAll('#plunder_list tr[id^="village_"]');
        
        rows.forEach(row => {
            const villageId = row.id.replace('village_', '');
            const villageLink = row.querySelector('td:nth-child(4) a');
            
            if (villageLink) {
                const text = villageLink.textContent.trim();
                const coordsMatch = text.match(/\((\d+)\|(\d+)\)/);
                
                if (coordsMatch) {
                    villages.push({
                        id: villageId,
                        x: coordsMatch[1],
                        y: coordsMatch[2],
                        name: text,
                        hasAttack: text.includes('attack en route')
                    });
                }
            }
        });
        
        return villages;
    }
}

// Usage Example
async function testAttack() {
    const api = new TribalWarsAPI();
    
    // Test attacking a specific village (from farm list)
    const targetVillageId = '24577'; // From HAR: village_24577
    
    try {
        // Get farm list first
        const farmList = await api.getFarmList();
        console.log('Farm list:', farmList);
        
        // Find the target village in farm list
        const targetVillage = farmList.find(v => v.id === targetVillageId);
        
        if (targetVillage) {
            console.log('Attacking village:', targetVillage);
            
            // Send attack
            const result = await api.sendAttack(
                targetVillageId,
                targetVillage.x,
                targetVillage.y,
                {
                    knight: '1' // Send 1 knight (as in HAR example)
                }
            );
            
            console.log('Attack result:', result);
        } else {
            console.log('Target village not found in farm list');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Alternative: Simpler attack with known coordinates
async function simpleAttack() {
    const api = new TribalWarsAPI();
    
    // Attack village at (541|654) with 1 knight
    await api.sendAttackJQuery('24577', '541', '654', {
        knight: '1'
    });
}

// Initialize and run test when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Tribal Wars API test script loaded');
        // Uncomment to run test
        // testAttack();
    });
} else {
    console.log('Tribal Wars API test script loaded (DOM already ready)');
}
