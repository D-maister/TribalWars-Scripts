// Function to send farm attack/raid request
async function sendFarmRequest(villageId, targetVillageId, hash, templateId = null) {
    const url = `https://en152.tribalwars.net/game.php?village=${villageId}&screen=am_farm&mode=farm&ajaxaction=farm&json=1`;
    
    // Prepare request body
    const bodyParams = new URLSearchParams({
        target: targetVillageId.toString(),
        source: villageId.toString(),
        h: hash // CSRF token/security hash
    });
    
    // Add template_id if provided
    if (templateId) {
        bodyParams.append('template_id', templateId.toString());
    }
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'accept': 'application/json, text/javascript, */*; q=0.01',
                'accept-language': 'ru,en;q=0.9',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'priority': 'u=1, i',
                'sec-ch-ua': '"Chromium";v="142", "YaBrowser";v="25.12", "Not A Brand";v="99", "Yowser";v="2.5"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'tribalwars-ajax': '1',
                'x-requested-with': 'XMLHttpRequest'
            },
            credentials: 'include', // Important for sending cookies/session
            referrer: `https://en152.tribalwars.net/game.php?village=${villageId}&screen=am_farm`,
            body: bodyParams.toString()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Error sending farm request:', error);
        throw error;
    }
}

// Example usage
async function farmVillage() {
    const villageId = 25034; // Your village ID
    const targetVillageId = 24577; // Target village ID
    const hash = '683500cb'; // CSRF token - this changes per request/session
    const templateId = 13085; // Optional: preset template ID
    
    try {
        const result = await sendFarmRequest(villageId, targetVillageId, hash, templateId);
        console.log('Farm request successful:', result);
        
        // Handle response
        if (result.error) {
            console.error('Farm error:', result.error);
        } else if (result.success) {
            console.log('Farm launched successfully!');
            // Process response data
        }
        
    } catch (error) {
        console.error('Failed to farm village:', error);
    }
}

// Alternative: XMLHttpRequest version
function sendFarmRequestXHR(villageId, targetVillageId, hash, templateId = null) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = `https://en152.tribalwars.net/game.php?village=${villageId}&screen=am_farm&mode=farm&ajaxaction=farm&json=1`;
        
        xhr.open('POST', url, true);
        
        // Set headers
        xhr.setRequestHeader('accept', 'application/json, text/javascript, */*; q=0.01');
        xhr.setRequestHeader('accept-language', 'ru,en;q=0.9');
        xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded; charset=UTF-8');
        xhr.setRequestHeader('tribalwars-ajax', '1');
        xhr.setRequestHeader('x-requested-with', 'XMLHttpRequest');
        
        xhr.withCredentials = true; // Important for cookies
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (e) {
                    reject(new Error('Invalid JSON response'));
                }
            } else {
                reject(new Error(`Request failed with status: ${xhr.status}`));
            }
        };
        
        xhr.onerror = function() {
            reject(new Error('Network error'));
        };
        
        // Prepare body
        const bodyParams = new URLSearchParams({
            target: targetVillageId.toString(),
            source: villageId.toString(),
            h: hash
        });
        
        if (templateId) {
            bodyParams.append('template_id', templateId.toString());
        }
        
        xhr.send(bodyParams.toString());
    });
}

// Utility function to get CSRF hash from page (run in browser console)
function extractHashFromPage() {
    // Method 1: Check form inputs
    const form = document.querySelector('form[action*="ajaxaction=farm"]');
    if (form) {
        const hashInput = form.querySelector('input[name="h"]');
        if (hashInput) return hashInput.value;
    }
    
    // Method 2: Check for hash in farm list
    const farmLinks = document.querySelectorAll('a[href*="target="]');
    if (farmLinks.length > 0) {
        const href = farmLinks[0].href;
        const match = href.match(/h=([a-f0-9]+)/);
        if (match) return match[1];
    }
    
    return null;
}

// Batch farm multiple villages
async function batchFarm(villageId, targets, hash) {
    const results = [];
    
    for (const target of targets) {
        try {
            // Add delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const result = await sendFarmRequest(villageId, target.id, hash, target.templateId);
            results.push({
                target: target.id,
                success: !result.error,
                response: result
            });
            
            console.log(`Farm sent to ${target.id}:`, result.error ? 'Failed' : 'Success');
            
        } catch (error) {
            console.error(`Failed to farm ${target.id}:`, error);
            results.push({
                target: target.id,
                success: false,
                error: error.message
            });
        }
    }
    
    return results;
}

// Execute when ready
document.addEventListener('DOMContentLoaded', function() {
    // Uncomment to execute when needed
    // farmVillage();
});
