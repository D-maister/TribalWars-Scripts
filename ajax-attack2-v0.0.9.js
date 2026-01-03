// Tribal Wars Direct Place Attack Script
// Simple and effective - works exactly like your original request

class DirectPlaceAttack {
    constructor(options = {}) {
        this.villageId = options.villageId || this.getCurrentVillageId();
        this.csrfHash = options.csrfHash || this.getCurrentCSRF();
        this.coordinates = options.coordinates || { x: 541, y: 654 };
        this.troops = options.troops || {
            spear: 1,
            sword: 1,
            axe: 0,
            archer: 0,
            spy: 0,
            light: 0,
            marcher: 0,
            heavy: 0,
            ram: 0,
            catapult: 0,
            knight: 0,
            snob: 0
        };
        this.attackType = options.attackType || 'l'; // l=attack, r=raid, s=spy
        this.dynamicField = options.dynamicField || '79d131589f81aaeb36d2d2';
        this.dynamicValue = options.dynamicValue || '7d85610179d131';
    }

    // Get current village ID from URL
    getCurrentVillageId() {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('village')) || 25034;
    }

    // Get CSRF hash from page
    getCurrentCSRF() {
        // Try URL first
        const params = new URLSearchParams(window.location.search);
        const urlHash = params.get('h');
        if (urlHash) return urlHash;
        
        // Try form input
        const hInput = document.querySelector('input[name="h"]');
        if (hInput?.value) return hInput.value;
        
        // Try form action
        const form = document.querySelector('form[action*="place"]');
        if (form) {
            const action = form.getAttribute('action') || '';
            const match = action.match(/h=([a-f0-9]{8})/);
            if (match) return match[1];
        }
        
        console.warn('Using default CSRF hash. Update if needed.');
        return '683500cb'; // Default from your working example
    }

    // Step 1: Confirm attack (get ch token)
    async confirmAttack() {
        const url = `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place&ajax=confirm`;
        
        // Build form data exactly like your working request
        const formData = new URLSearchParams();
        formData.append(this.dynamicField, this.dynamicValue);
        formData.append('template_id', '');
        formData.append('source_village', this.villageId.toString());
        
        // Add troop counts
        for (const [unit, count] of Object.entries(this.troops)) {
            formData.append(unit, count.toString());
        }
        
        // Add coordinates and attack type
        formData.append('x', this.coordinates.x.toString());
        formData.append('y', this.coordinates.y.toString());
        formData.append('input', '');
        formData.append('attack', this.attackType);
        formData.append('h', this.csrfHash);

        console.log('🔍 Step 1: Confirming attack...');
        console.log('URL:', url);
        console.log('CSRF:', this.csrfHash);
        console.log('Coordinates:', this.coordinates);
        console.log('Troops:', this.troops);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'ru,en;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include',
                referrer: `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place`,
                body: formData.toString()
            });

            if (!response.ok) {
                throw new Error(`Confirm failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Extract ch token from response
            let chToken = '';
            if (data.response?.dialog) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = data.response.dialog;
                const chInput = tempDiv.querySelector('input[name="ch"]');
                chToken = chInput?.value || '';
            }
            
            if (!chToken) {
                throw new Error('No confirmation token (ch) received');
            }
            
            console.log('✅ Step 1 complete. Got ch token.');
            return chToken;
            
        } catch (error) {
            console.error('❌ Step 1 failed:', error);
            throw error;
        }
    }

    // Step 2: Send final attack
    async sendFinalAttack(chToken) {
        const url = `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place&ajaxaction=popup_command`;

        // Build final request exactly like your working example
        const formData = new URLSearchParams();
        formData.append('attack', 'true');
        formData.append('ch', chToken);
        formData.append('cb', 'troop_confirm_submit');
        formData.append('x', this.coordinates.x.toString());
        formData.append('y', this.coordinates.y.toString());
        formData.append('source_village', this.villageId.toString());
        formData.append('village', this.villageId.toString());
        
        // Add troop counts
        for (const [unit, count] of Object.entries(this.troops)) {
            formData.append(unit, count.toString());
        }
        
        formData.append('building', 'main');
        formData.append('h', this.csrfHash);
        formData.append('h', this.csrfHash); // Duplicate as required

        console.log('🚀 Step 2: Sending final attack...');

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-language': 'ru,en;q=0.9',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'tribalwars-ajax': '1',
                    'x-requested-with': 'XMLHttpRequest'
                },
                credentials: 'include',
                referrer: `https://en152.tribalwars.net/game.php?village=${this.villageId}&screen=place`,
                body: formData.toString()
            });

            if (!response.ok) {
                throw new Error(`Final attack failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Step 2 complete. Attack sent!');
            return data;
            
        } catch (error) {
            console.error('❌ Step 2 failed:', error);
            throw error;
        }
    }

    // Complete attack sequence
    async execute() {
        try {
            console.log('🎯 Starting direct place attack...');
            
            // Step 1: Get confirmation token
            const chToken = await this.confirmAttack();
            
            // Step 2: Send final attack
            const result = await this.sendFinalAttack(chToken);
            
            console.log('🎉 Attack completed successfully!');
            return {
                success: true,
                chToken: chToken,
                result: result
            };
            
        } catch (error) {
            console.error('💥 Attack failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Quick attack with coordinates only
    static async quickAttack(x, y, troops = {}) {
        const attack = new DirectPlaceAttack({
            coordinates: { x, y },
            troops: troops
        });
        return await attack.execute();
    }
}

// Simple wrapper function
async function sendDirectAttack(x, y, troops = {}) {
    console.log(`🎯 Sending attack to ${x}|${y}...`);
    const result = await DirectPlaceAttack.quickAttack(x, y, troops);
    
    if (result.success) {
        console.log('✅ Attack sent successfully!');
    } else {
        console.error('❌ Attack failed:', result.error);
    }
    
    return result;
}

// Batch attack multiple targets
async function batchAttack(targets, delay = 2000) {
    const results = [];
    
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        
        console.log(`🎯 [${i + 1}/${targets.length}] Attacking ${target.x}|${target.y}...`);
        
        try {
            // Add delay between attacks (except first)
            if (i > 0) {
                console.log(`⏳ Waiting ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            const attack = new DirectPlaceAttack({
                coordinates: { x: target.x, y: target.y },
                troops: target.troops || {}
            });
            
            const result = await attack.execute();
            results.push({
                target: `${target.x}|${target.y}`,
                success: result.success,
                chToken: result.chToken,
                error: result.error
            });
            
            console.log(result.success ? '✅ Success' : '❌ Failed');
            
        } catch (error) {
            console.error(`💥 Error attacking ${target.x}|${target.y}:`, error);
            results.push({
                target: `${target.x}|${target.y}`,
                success: false,
                error: error.message
            });
        }
    }
    
    console.log('📊 Batch attack completed:', results);
    return results;
}

// Create minimal UI
function createAttackUI() {
    // Remove existing UI if any
    const existingUI = document.getElementById('tw-direct-attack-ui');
    if (existingUI) existingUI.remove();
    
    const ui = document.createElement('div');
    ui.id = 'tw-direct-attack-ui';
    ui.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #2c3e50;
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        font-size: 12px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.5);
        min-width: 200px;
    `;
    
    // Title
    const title = document.createElement('div');
    title.textContent = '🎯 Direct Attack';
    title.style.cssText = 'font-weight: bold; margin-bottom: 8px; color: #3498db;';
    ui.appendChild(title);
    
    // Quick coordinates
    const quickCoords = [
        { x: 541, y: 654, label: 'Barbarian Village' },
        { x: 540, y: 653, label: 'Nearby Village' },
        { x: 542, y: 655, label: 'Another Village' }
    ];
    
    quickCoords.forEach(coord => {
        const btn = document.createElement('button');
        btn.textContent = `${coord.label} (${coord.x}|${coord.y})`;
        btn.style.cssText = `
            width: 100%;
            padding: 5px;
            margin-bottom: 5px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 11px;
            text-align: left;
        `;
        btn.onclick = async () => {
            btn.disabled = true;
            btn.textContent = 'Sending...';
            
            const result = await sendDirectAttack(coord.x, coord.y);
            
            btn.disabled = false;
            btn.textContent = `${coord.label} (${coord.x}|${coord.y})`;
            
            if (result.success) {
                alert(`✅ Attack sent to ${coord.x}|${coord.y}!`);
            } else {
                alert(`❌ Failed: ${result.error}`);
            }
        };
        ui.appendChild(btn);
    });
    
    // Custom attack
    const customDiv = document.createElement('div');
    customDiv.style.marginTop = '10px';
    customDiv.innerHTML = `
        <div style="margin-bottom: 5px;">Custom Attack:</div>
        <div style="display: flex; gap: 5px; margin-bottom: 5px;">
            <input type="number" id="tw-attack-x" placeholder="X" style="width: 60px; padding: 3px;" value="541">
            <input type="number" id="tw-attack-y" placeholder="Y" style="width: 60px; padding: 3px;" value="654">
        </div>
    `;
    ui.appendChild(customDiv);
    
    const customBtn = document.createElement('button');
    customBtn.textContent = 'Send Custom Attack';
    customBtn.style.cssText = `
        width: 100%;
        padding: 5px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
    `;
    customBtn.onclick = async () => {
        const x = parseInt(document.getElementById('tw-attack-x').value);
        const y = parseInt(document.getElementById('tw-attack-y').value);
        
        if (!isNaN(x) && !isNaN(y)) {
            customBtn.disabled = true;
            customBtn.textContent = 'Sending...';
            
            const result = await sendDirectAttack(x, y);
            
            customBtn.disabled = false;
            customBtn.textContent = 'Send Custom Attack';
            
            if (result.success) {
                alert(`✅ Attack sent to ${x}|${y}!`);
            } else {
                alert(`❌ Failed: ${result.error}`);
            }
        } else {
            alert('Please enter valid coordinates');
        }
    };
    ui.appendChild(customBtn);
    
    // Batch attack example
    const batchBtn = document.createElement('button');
    batchBtn.textContent = 'Test Batch (3 villages)';
    batchBtn.style.cssText = `
        width: 100%;
        padding: 5px;
        margin-top: 5px;
        background: #9b59b6;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
    `;
    batchBtn.onclick = async () => {
        if (!confirm('Send 3 test attacks with 2 second delay?')) return;
        
        batchBtn.disabled = true;
        batchBtn.textContent = 'Sending batch...';
        
        const targets = [
            { x: 541, y: 654 },
            { x: 540, y: 653 },
            { x: 542, y: 655 }
        ];
        
        await batchAttack(targets, 2000);
        
        batchBtn.disabled = false;
        batchBtn.textContent = 'Test Batch (3 villages)';
        alert('Batch attack completed! Check console for results.');
    };
    ui.appendChild(batchBtn);
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    closeBtn.style.cssText = `
        position: absolute;
        top: 2px;
        right: 2px;
        background: transparent;
        color: white;
        border: none;
        font-size: 14px;
        cursor: pointer;
        padding: 0;
        width: 16px;
        height: 16px;
        line-height: 1;
    `;
    closeBtn.onclick = () => ui.remove();
    ui.appendChild(closeBtn);
    
    document.body.appendChild(ui);
    console.log('🎯 Direct Attack UI loaded. Ready to send attacks.');
}

// Auto-initialize on place screen
function init() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('screen') === 'place') {
        console.log('🎯 Place screen detected. Loading Direct Attack...');
        
        // Wait for page to load
        setTimeout(() => {
            createAttackUI();
            
            // Make functions available globally
            window.tw = {
                attack: sendDirectAttack,
                batch: batchAttack,
                DirectPlaceAttack: DirectPlaceAttack
            };
            
            console.log('🎯 Direct Attack ready!');
            console.log('Use: tw.attack(x, y, troops)');
            console.log('Or: tw.batch([{x,y,troops}], delay)');
        }, 1000);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for console use
window.sendDirectAttack = sendDirectAttack;
window.batchAttack = batchAttack;
window.DirectPlaceAttack = DirectPlaceAttack;

console.log('🎯 Tribal Wars Direct Attack Script loaded.');
console.log('Use: sendDirectAttack(541, 654, {spear: 1, sword: 1})');
console.log('Or create UI with: createAttackUI()');
