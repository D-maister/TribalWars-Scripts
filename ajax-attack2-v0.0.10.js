// Tribal Wars Direct Attack - WORKING VERSION
// Minimal, focused, and tested

// First, let's check what's actually on the page
console.log('🔍 Checking current page state...');
const urlParams = new URLSearchParams(window.location.search);
const currentVillage = urlParams.get('village') || '25034';
const currentCSRF = urlParams.get('h') || document.querySelector('input[name="h"]')?.value || '683500cb';
console.log('Current village:', currentVillage);
console.log('Current CSRF:', currentCSRF);

// Check for form on page
const pageForm = document.querySelector('form[action*="place"]');
if (pageForm) {
    console.log('📋 Found form on page:', pageForm.action);
    const inputs = pageForm.querySelectorAll('input[type="hidden"]');
    console.log('Hidden inputs:', inputs.length);
    inputs.forEach(input => {
        if (input.name && input.value) {
            console.log(`  ${input.name} = ${input.value}`);
        }
    });
}

// WORKING Direct Attack Function
async function sendAttack(x, y, troops = { spear: 1, sword: 1 }) {
    console.log(`🎯 Sending attack to ${x}|${y}...`);
    
    // Use current values from page
    const villageId = currentVillage;
    const csrfHash = currentCSRF;
    
    console.log('Using parameters:');
    console.log('- Village:', villageId);
    console.log('- CSRF:', csrfHash);
    console.log('- Coordinates:', `${x}|${y}`);
    console.log('- Troops:', troops);
    
    // Step 1: Get confirmation token
    console.log('🔍 Step 1: Getting confirmation...');
    
    // Build form data EXACTLY like your working example
    const confirmData = new URLSearchParams();
    confirmData.append('79d131589f81aaeb36d2d2', '7d85610179d131');
    confirmData.append('template_id', '');
    confirmData.append('source_village', villageId);
    
    // Add ALL troop fields (even if 0)
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
    
    for (const [unit, count] of Object.entries(allTroops)) {
        confirmData.append(unit, count.toString());
    }
    
    confirmData.append('x', x.toString());
    confirmData.append('y', y.toString());
    confirmData.append('input', '');
    confirmData.append('attack', 'l'); // l = attack
    confirmData.append('h', csrfHash);
    
    console.log('Confirm request data:', confirmData.toString());
    
    try {
        // Make the request
        const confirmResponse = await fetch(`https://en152.tribalwars.net/game.php?village=${villageId}&screen=place&ajax=confirm`, {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'ru,en;q=0.9',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'tribalwars-ajax': '1',
                'x-requested-with': 'XMLHttpRequest'
            },
            credentials: 'include',
            referrer: `https://en152.tribalwars.net/game.php?village=${villageId}&screen=place`,
            body: confirmData.toString()
        });
        
        console.log('Confirm response status:', confirmResponse.status);
        
        const confirmResult = await confirmResponse.json();
        console.log('Confirm response:', confirmResult);
        
        // Check for errors
        if (confirmResult.error) {
            throw new Error('Server error: ' + (confirmResult.error_msg || confirmResult.error));
        }
        
        // Extract ch token
        if (!confirmResult.response?.dialog) {
            throw new Error('No confirmation dialog received');
        }
        
        // Parse the dialog HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = confirmResult.response.dialog;
        const chInput = tempDiv.querySelector('input[name="ch"]');
        const chValue = chInput?.value;
        
        if (!chValue) {
            console.log('Dialog HTML (first 500 chars):', confirmResult.response.dialog.substring(0, 500));
            throw new Error('No ch token found in dialog');
        }
        
        console.log('✅ Got ch token:', chValue.substring(0, 20) + '...');
        
        // Step 2: Send final attack
        console.log('🚀 Step 2: Sending final attack...');
        
        const finalData = new URLSearchParams();
        finalData.append('attack', 'true');
        finalData.append('ch', chValue);
        finalData.append('cb', 'troop_confirm_submit');
        finalData.append('x', x.toString());
        finalData.append('y', y.toString());
        finalData.append('source_village', villageId);
        finalData.append('village', villageId);
        
        // Add all troops again
        for (const [unit, count] of Object.entries(allTroops)) {
            finalData.append(unit, count.toString());
        }
        
        finalData.append('building', 'main');
        finalData.append('h', csrfHash);
        finalData.append('h', csrfHash); // Duplicate as required
        
        console.log('Final request data:', finalData.toString());
        
        const finalResponse = await fetch(`https://en152.tribalwars.net/game.php?village=${villageId}&screen=place&ajaxaction=popup_command`, {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'ru,en;q=0.9',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'tribalwars-ajax': '1',
                'x-requested-with': 'XMLHttpRequest'
            },
            credentials: 'include',
            referrer: `https://en152.tribalwars.net/game.php?village=${villageId}&screen=place`,
            body: finalData.toString()
        });
        
        console.log('Final response status:', finalResponse.status);
        
        const finalResult = await finalResponse.json();
        console.log('Final response:', finalResult);
        
        if (finalResult.error === false) {
            console.log('✅ Attack sent successfully!');
            return { success: true, message: 'Attack sent!' };
        } else {
            throw new Error('Final step failed: ' + (finalResult.error_msg || 'Unknown error'));
        }
        
    } catch (error) {
        console.error('❌ Attack failed:', error);
        return { 
            success: false, 
            error: error.message,
            details: error.stack
        };
    }
}

// Quick test function
async function testAttack() {
    console.clear();
    console.log('🧪 Testing attack...');
    
    // Try different coordinates if default fails
    const testTargets = [
        { x: 541, y: 654, label: 'Original' },
        { x: 540, y: 653, label: 'Nearby' },
        { x: 542, y: 655, label: 'Another' }
    ];
    
    for (const target of testTargets) {
        console.log(`\n🎯 Testing ${target.label} (${target.x}|${target.y})...`);
        const result = await sendAttack(target.x, target.y, { spear: 1, sword: 1 });
        
        if (result.success) {
            console.log(`✅ ${target.label} attack successful!`);
            alert(`✅ Attack to ${target.x}|${target.y} sent!`);
            return result;
        } else {
            console.log(`❌ ${target.label} failed:`, result.error);
        }
    }
    
    console.log('❌ All tests failed');
    alert('All test attacks failed. Check console for details.');
    return { success: false, error: 'All tests failed' };
}

// Batch attack function
async function sendBatch(targets, delay = 2000) {
    console.log(`📦 Starting batch attack (${targets.length} targets)...`);
    
    const results = [];
    
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        
        console.log(`\n🎯 [${i + 1}/${targets.length}] ${target.x}|${target.y}`);
        
        // Add delay between attacks
        if (i > 0) {
            console.log(`⏳ Waiting ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const result = await sendAttack(target.x, target.y, target.troops || { spear: 1 });
        results.push({
            target: `${target.x}|${target.y}`,
            success: result.success,
            error: result.error
        });
        
        console.log(result.success ? '✅ Success' : '❌ Failed');
        
        // Stop if we get too many errors
        const errorCount = results.filter(r => !r.success).length;
        if (errorCount >= 3) {
            console.warn('⚠️ Too many errors, stopping batch');
            break;
        }
    }
    
    console.log('\n📊 Batch results:', results);
    return results;
}

// Simple UI
function createSimpleUI() {
    // Remove existing UI
    const existing = document.getElementById('tw-simple-ui');
    if (existing) existing.remove();
    
    const ui = document.createElement('div');
    ui.id = 'tw-simple-ui';
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
        min-width: 250px;
    `;
    
    // Title
    const title = document.createElement('div');
    title.textContent = '🎯 TW Direct Attack';
    title.style.cssText = 'font-weight: bold; margin-bottom: 10px; color: #3498db; font-size: 16px;';
    ui.appendChild(title);
    
    // Current info
    const info = document.createElement('div');
    info.style.cssText = 'font-size: 12px; margin-bottom: 10px; padding: 8px; background: #34495e; border-radius: 4px;';
    info.innerHTML = `
        <div>Village: ${currentVillage}</div>
        <div>CSRF: ${currentCSRF}</div>
        <div>Screen: ${urlParams.get('screen') || 'N/A'}</div>
    `;
    ui.appendChild(info);
    
    // Quick attack buttons
    const quickAttacks = [
        { x: 541, y: 654, label: 'Test Attack', troops: { spear: 1, sword: 1 } },
        { x: 540, y: 653, label: 'Quick Raid', troops: { spear: 2 } },
        { x: 542, y: 655, label: 'Minimal', troops: { spear: 1 } }
    ];
    
    quickAttacks.forEach(attack => {
        const btn = document.createElement('button');
        btn.textContent = `${attack.label} (${attack.x}|${attack.y})`;
        btn.style.cssText = `
            width: 100%;
            padding: 8px;
            margin-bottom: 5px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        btn.onclick = async () => {
            btn.disabled = true;
            btn.textContent = 'Sending...';
            
            const result = await sendAttack(attack.x, attack.y, attack.troops);
            
            btn.disabled = false;
            btn.textContent = `${attack.label} (${attack.x}|${attack.y})`;
            
            if (result.success) {
                alert(`✅ Attack sent to ${attack.x}|${attack.y}!`);
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
        <div style="margin-bottom: 5px; font-size: 12px;">Custom Attack:</div>
        <div style="display: flex; gap: 5px; margin-bottom: 5px;">
            <input type="number" id="tw-x" placeholder="X" style="width: 70px; padding: 5px;" value="541">
            <input type="number" id="tw-y" placeholder="Y" style="width: 70px; padding: 5px;" value="654">
        </div>
        <div style="display: flex; gap: 5px; margin-bottom: 5px;">
            <input type="number" id="tw-spear" placeholder="Spear" style="width: 70px; padding: 5px;" value="1">
            <input type="number" id="tw-sword" placeholder="Sword" style="width: 70px; padding: 5px;" value="1">
        </div>
    `;
    ui.appendChild(customDiv);
    
    const customBtn = document.createElement('button');
    customBtn.textContent = 'Send Custom Attack';
    customBtn.style.cssText = `
        width: 100%;
        padding: 8px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    `;
    customBtn.onclick = async () => {
        const x = parseInt(document.getElementById('tw-x').value);
        const y = parseInt(document.getElementById('tw-y').value);
        const spear = parseInt(document.getElementById('tw-spear').value) || 0;
        const sword = parseInt(document.getElementById('tw-sword').value) || 0;
        
        if (!isNaN(x) && !isNaN(y)) {
            customBtn.disabled = true;
            customBtn.textContent = 'Sending...';
            
            const result = await sendAttack(x, y, { spear, sword });
            
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
    
    // Test button
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Run Test';
    testBtn.style.cssText = `
        width: 100%;
        padding: 8px;
        margin-top: 5px;
        background: #9b59b6;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    `;
    testBtn.onclick = testAttack;
    ui.appendChild(testBtn);
    
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
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        line-height: 1;
    `;
    closeBtn.onclick = () => ui.remove();
    ui.appendChild(closeBtn);
    
    document.body.appendChild(ui);
    console.log('🎯 Simple UI created. Ready to attack!');
}

// Auto-create UI on place screen
if (urlParams.get('screen') === 'place') {
    setTimeout(createSimpleUI, 1000);
}

// Make functions available globally
window.sendAttack = sendAttack;
window.sendBatch = sendBatch;
window.testAttack = testAttack;
window.createSimpleUI = createSimpleUI;

console.log('🎯 Tribal Wars Direct Attack loaded!');
console.log('Use sendAttack(x, y, troops) to send an attack.');
console.log('Example: sendAttack(541, 654, {spear: 1, sword: 1})');
console.log('Use testAttack() to run a test with multiple coordinates.');
