// Tribal Wars Direct Attack - SIMPLIFIED WORKING VERSION
// Just sends the attack, assumes success if no errors

console.log('🎯 Tribal Wars Direct Attack loaded');

// Get current page info
const urlParams = new URLSearchParams(window.location.search);
const currentVillage = urlParams.get('village') || '25034';
const currentCSRF = urlParams.get('h') || document.querySelector('input[name="h"]')?.value || '683500cb';

// MAIN FUNCTION - Just sends the attack
async function attack(x, y, troops = { spear: 1, sword: 1 }) {
    console.log(`⚔️ Attacking ${x}|${y}...`);
    
    // Prepare all troop data
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
    
    // STEP 1: Get confirmation token
    console.log('Step 1: Getting token...');
    
    const confirmData = new URLSearchParams();
    confirmData.append('79d131589f81aaeb36d2d2', '7d85610179d131');
    confirmData.append('template_id', '');
    confirmData.append('source_village', currentVillage);
    
    for (const [unit, count] of Object.entries(allTroops)) {
        confirmData.append(unit, count.toString());
    }
    
    confirmData.append('x', x.toString());
    confirmData.append('y', y.toString());
    confirmData.append('input', '');
    confirmData.append('attack', 'l');
    confirmData.append('h', currentCSRF);
    
    try {
        const confirmResponse = await fetch(`https://en152.tribalwars.net/game.php?village=${currentVillage}&screen=place&ajax=confirm`, {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'ru,en;q=0.9',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'tribalwars-ajax': '1',
                'x-requested-with': 'XMLHttpRequest'
            },
            credentials: 'include',
            body: confirmData.toString()
        });
        
        const confirmResult = await confirmResponse.json();
        
        // Extract ch token
        if (!confirmResult.response?.dialog) {
            throw new Error('No confirmation dialog');
        }
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = confirmResult.response.dialog;
        const chInput = tempDiv.querySelector('input[name="ch"]');
        const chValue = chInput?.value;
        
        if (!chValue) {
            throw new Error('No ch token');
        }
        
        console.log('✓ Got token');
        
        // STEP 2: Send final attack
        console.log('Step 2: Sending attack...');
        
        const finalData = new URLSearchParams();
        finalData.append('attack', 'true');
        finalData.append('ch', chValue);
        finalData.append('cb', 'troop_confirm_submit');
        finalData.append('x', x.toString());
        finalData.append('y', y.toString());
        finalData.append('source_village', currentVillage);
        finalData.append('village', currentVillage);
        
        for (const [unit, count] of Object.entries(allTroops)) {
            finalData.append(unit, count.toString());
        }
        
        finalData.append('building', 'main');
        finalData.append('h', currentCSRF);
        finalData.append('h', currentCSRF);
        
        const finalResponse = await fetch(`https://en152.tribalwars.net/game.php?village=${currentVillage}&screen=place&ajaxaction=popup_command`, {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'ru,en;q=0.9',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'tribalwars-ajax': '1',
                'x-requested-with': 'XMLHttpRequest'
            },
            credentials: 'include',
            body: finalData.toString()
        });
        
        const finalResult = await finalResponse.json();
        
        // SIMPLE SUCCESS CHECK: If we get here with no errors, assume success
        console.log('✓ Attack sent!');
        console.log('Response:', finalResult);
        
        return {
            success: true,
            message: 'Attack sent successfully',
            target: `${x}|${y}`,
            response: finalResult
        };
        
    } catch (error) {
        console.error('✗ Attack failed:', error);
        return {
            success: false,
            error: error.message,
            target: `${x}|${y}`
        };
    }
}

// Batch attack multiple targets
async function attackMultiple(targets, delay = 1000) {
    console.log(`🎯 Attacking ${targets.length} targets...`);
    
    const results = [];
    
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        
        console.log(`\n[${i + 1}/${targets.length}] ${target.x}|${target.y}`);
        
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const result = await attack(target.x, target.y, target.troops || {});
        results.push(result);
        
        console.log(result.success ? '✓ Success' : '✗ Failed');
    }
    
    console.log('\n📊 Results:', results);
    return results;
}

// Quick test
async function test() {
    console.clear();
    console.log('🧪 Testing attack...');
    
    const result = await attack(541, 654, { spear: 1, sword: 1 });
    
    if (result.success) {
        alert(`✅ Attack sent to ${result.target}!`);
    } else {
        alert(`❌ Failed: ${result.error}`);
    }
    
    return result;
}

// Create minimal UI
function createUI() {
    const ui = document.createElement('div');
    ui.id = 'tw-attack-ui';
    ui.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #2c3e50;
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 9999;
        font-family: Arial, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        width: 200px;
    `;
    
    // Title
    const title = document.createElement('div');
    title.textContent = '⚔️ Attack';
    title.style.cssText = 'font-weight: bold; margin-bottom: 10px; color: #e74c3c;';
    ui.appendChild(title);
    
    // Quick buttons
    const buttons = [
        { text: 'Attack 541|654', x: 541, y: 654, troops: { spear: 1, sword: 1 } },
        { text: 'Attack 540|653', x: 540, y: 653, troops: { spear: 2 } },
        { text: 'Test Attack', action: test }
    ];
    
    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.textContent = btn.text;
        button.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 5px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        
        button.onclick = btn.action || (async () => {
            button.disabled = true;
            button.textContent = 'Sending...';
            
            const result = await attack(btn.x, btn.y, btn.troops);
            
            button.disabled = false;
            button.textContent = btn.text;
            
            alert(result.success ? `✅ Sent to ${btn.x}|${btn.y}` : `❌ Failed: ${result.error}`);
        });
        
        ui.appendChild(button);
    });
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    closeBtn.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: transparent;
        color: white;
        border: none;
        font-size: 16px;
        cursor: pointer;
    `;
    closeBtn.onclick = () => ui.remove();
    ui.appendChild(closeBtn);
    
    document.body.appendChild(ui);
}

// Auto-create UI
if (urlParams.get('screen') === 'place') {
    setTimeout(createUI, 1000);
}

// Export
window.attack = attack;
window.attackMultiple = attackMultiple;
window.test = test;

console.log('Commands:');
console.log('attack(x, y, troops) - Send single attack');
console.log('attackMultiple([{x, y, troops}], delay) - Send multiple');
console.log('test() - Test attack');
console.log('Example: attack(541, 654, {spear: 1, sword: 1})');
