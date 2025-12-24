// Calculate attack time with EXACT millisecond timing - FIXED VERSION
function calculateAttackTime(targetTime, maxCancelMinutes, attackDelay) {
    // Get current server time
    const current = getEstimatedServerTime();
    const latency = getLatency();
    
    console.log('=== CALCULATION START ===');
    console.log('Current time:', formatTime(current));
    console.log('Target time:', formatTime(targetTime));
    
    // Convert max cancel to ms
    const maxCancelMs = maxCancelMinutes * 60 * 1000;
    
    // Calculate time available
    const timeAvailable = targetTime.getTime() - current.getTime();
    console.log('Time available:', timeAvailable, 'ms');
    
    // We need to attack at: target - 2x cancel - attackDelay - latency
    const neededForFull = (maxCancelMs * 2) + attackDelay + latency;
    console.log('Needed for full cancel:', neededForFull, 'ms');
    
    let clickTime;
    let adjustedMaxCancelMs = maxCancelMs;
    
    if (timeAvailable >= neededForFull) {
        // We have enough time for full cancel
        clickTime = new Date(targetTime.getTime() - (maxCancelMs * 2) - attackDelay - latency);
        console.log('Using FULL cancel time');
    } else {
        // Not enough time, attack as soon as possible
        // Minimum: we need at least attackDelay + latency + small margin
        const minNeeded = attackDelay + latency + 100; // 100ms margin
        
        if (timeAvailable < minNeeded) {
            console.error('Not enough time even for immediate attack');
            return null;
        }
        
        // Attack immediately (with margin)
        clickTime = new Date(current.getTime() + 100); // 100ms from now
        adjustedMaxCancelMs = Math.floor((targetTime.getTime() - clickTime.getTime() - attackDelay - latency) / 2);
        
        // Ensure adjusted cancel is at least 1 second
        adjustedMaxCancelMs = Math.max(adjustedMaxCancelMs, 1000);
        
        console.log('Using REDUCED cancel time');
    }
    
    const remaining = clickTime.getTime() - current.getTime();
    
    console.log('Adjusted max cancel:', adjustedMaxCancelMs, 'ms');
    console.log('Click time:', formatTime(clickTime));
    console.log('Remaining until click:', remaining, 'ms');
    console.log('=== CALCULATION END ===');
    
    return {
        targetTime: targetTime,
        clickTime: clickTime,
        adjustedMaxCancel: adjustedMaxCancelMs / 60000,
        attackDelay: attackDelay,
        latency: latency,
        remaining: remaining,
        current: current
    };
}
