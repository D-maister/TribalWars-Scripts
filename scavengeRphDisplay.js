// Tribal Wars Scavenge Efficiency Calculator - Game Styled
function main() {
    var data = localStorage.getItem('scavengeData');
    if (!data) {
        alert('No scavenge data found. Please run the data collector first.');
        return;
    }
    
    var results = JSON.parse(data);
    
    // Remove existing window
    if (window.scavengeWindow) {
        try {
            document.body.removeChild(window.scavengeWindow);
        } catch(e) {}
    }
    
    // Create main container with game styling
    var container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:10%;left:5%;right:5%;bottom:5%;background:#e3d5b3;border:1px solid #7d510f;padding:10px;z-index:9999;overflow:auto;font-family:Verdana,Arial;box-shadow:1px 2px 3px 1px rgba(0,0,0,0.2);';
    window.scavengeWindow = container;
    
    // Create header
    var header = document.createElement('h3');
    header.textContent = 'Scavenge Results - Copy Ratios for Auto Farmer';
    header.style.textAlign = 'center';
    header.style.color = '#7d510f';
    header.style.margin = '10px 0';
    container.appendChild(header);
    
    // Create input controls
    var inputDiv = document.createElement('div');
    inputDiv.style.cssText = 'margin:10px 0;padding:10px;background:#f5f5f5;border:1px solid #ddd;border-radius:5px;';
    
    var percentLabel = document.createElement('label');
    percentLabel.textContent = 'Troops % limit: ';
    percentLabel.style.fontWeight = 'bold';
    percentLabel.style.marginRight = '10px';
    percentLabel.style.color = '#7d510f';
    
    var percentInput = document.createElement('input');
    percentInput.type = 'number';
    percentInput.min = '1';
    percentInput.max = '100';
    percentInput.value = '100';
    percentInput.style.cssText = 'padding:3px;width:60px;border:1px solid #7d510f;border-radius:3px;background:#fff;';
    
    var timeLabel = document.createElement('label');
    timeLabel.textContent = 'Time limit (HH:MM:SS): ';
    timeLabel.style.fontWeight = 'bold';
    timeLabel.style.marginLeft = '20px';
    timeLabel.style.marginRight = '10px';
    timeLabel.style.color = '#7d510f';
    
    var timeInput = document.createElement('input');
    timeInput.type = 'text';
    timeInput.value = '02:00:00';
    timeInput.placeholder = 'HH:MM:SS';
    timeInput.style.cssText = 'padding:3px;width:80px;border:1px solid #7d510f;border-radius:3px;background:#fff;';
    
    // Use game button style for Update button
    var updateBtn = document.createElement('button');
    updateBtn.textContent = 'Update';
    updateBtn.className = 'btn btn-default';
    updateBtn.style.cssText = 'margin-left:10px;';
    
    inputDiv.appendChild(percentLabel);
    inputDiv.appendChild(percentInput);
    inputDiv.appendChild(timeLabel);
    inputDiv.appendChild(timeInput);
    inputDiv.appendChild(updateBtn);
    container.appendChild(inputDiv);
    
    // Create table with game styling
    var table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:11px;background:#fff;border:1px solid #7d510f;';
    table.innerHTML = '<thead><tr style="background:linear-gradient(to bottom,#947a62 0%,#7b5c3d 22%,#6c4824 30%,#6c4824 100%);color:#fff;font-weight:bold;"><th style="padding:5px;border:1px solid #7d510f;">%</th><th style="padding:5px;border:1px solid #7d510f;">SP</th><th style="padding:5px;border:1px solid #7d510f;">L/h</th><th style="padding:5px;border:1px solid #7d510f;">LT</th><th style="padding:5px;border:1px solid #7d510f;">L Res</th><th style="padding:5px;border:1px solid #7d510f;">M/h</th><th style="padding:5px;border:1px solid #7d510f;">MT</th><th style="padding:5px;border:1px solid #7d510f;">M Res</th><th style="padding:5px;border:1px solid #7d510f;">S/h</th><th style="padding:5px;border:1px solid #7d510f;">ST</th><th style="padding:5px;border:1px solid #7d510f;">S Res</th><th style="padding:5px;border:1px solid #7d510f;">G/h</th><th style="padding:5px;border:1px solid #7d510f;">GT</th><th style="padding:5px;border:1px solid #7d510f;">G Res</th><th style="padding:5px;border:1px solid #7d510f;">Fixed Ratio</th></tr></thead>';
    var tbody = table.createTBody();
    container.appendChild(table);
    
    // Create bottom container for summary and close button
    var bottomContainer = document.createElement('div');
    bottomContainer.style.cssText = 'margin-top:20px;';
    container.appendChild(bottomContainer);
    
    // Use game button style for Close button
    var closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.className = 'btn btn-default';
    closeBtn.style.cssText = 'margin-right:10px;';
    closeBtn.onclick = function() {
        document.body.removeChild(container);
        window.scavengeWindow = null;
    };
    bottomContainer.appendChild(closeBtn);
    
    function parseTime(timeStr) {
        if (timeStr === '-' || !timeStr) return 0;
        var parts = timeStr.split(':').map(Number);
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    function calculateOptimalRatio(timeLimitSec, percentLimit) {
        var availableModes = [[],[],[],[]];
        
        // Collect all available options within time limit
        results.forEach(function(result) {
            var percentage = result.p || Math.round(result.s / results[results.length-1].s * 100);
            for (var mode = 0; mode < 4; mode++) {
                var duration = result.res[mode].d;
                if (duration !== '-') {
                    var durationSec = parseTime(duration);
                    if (durationSec <= timeLimitSec && durationSec > 0) {
                        var wood = result.res[mode].r.wood || 0;
                        var stone = result.res[mode].r.stone || 0;
                        var iron = result.res[mode].r.iron || 0;
                        var totalRes = wood + stone + iron;
                        var perHour = Math.round(totalRes / durationSec * 3600 * 100) / 100;
                        
                        availableModes[mode].push({
                            percentage: percentage,
                            perHour: perHour,
                            totalRes: totalRes,
                            duration: duration,
                            durationSec: durationSec
                        });
                    }
                }
            }
        });
        
        var bestCombination = [0,0,0,0];
        var bestTotalPerHour = 0;
        
        // Search for combinations with similar completion times
        for (var baseMode = 3; baseMode >= 0; baseMode--) {
            for (var baseIdx = 0; baseIdx < availableModes[baseMode].length; baseIdx++) {
                var baseOption = availableModes[baseMode][baseIdx];
                var currentRatios = [0,0,0,0];
                var currentTotalPercent = 0;
                var currentTotalPerHour = 0;
                
                // Start with base option
                currentRatios[baseMode] = baseOption.percentage;
                currentTotalPercent += baseOption.percentage;
                currentTotalPerHour += baseOption.perHour;
                
                // Find closest matches in other modes
                for (var targetMode = 3; targetMode >= 0; targetMode--) {
                    if (targetMode === baseMode) continue;
                    if (currentTotalPercent >= percentLimit) break;
                    
                    var bestMatch = null;
                    var bestTimeDiff = Infinity;
                    
                    for (var i = 0; i < availableModes[targetMode].length; i++) {
                        var option = availableModes[targetMode][i];
                        var timeDiff = Math.abs(option.durationSec - baseOption.durationSec);
                        var newTotalPercent = currentTotalPercent + option.percentage;
                        
                        // Check if this option fits within limits
                        if (newTotalPercent <= percentLimit && timeDiff < bestTimeDiff) {
                            bestMatch = option;
                            bestTimeDiff = timeDiff;
                        }
                    }
                    
                    if (bestMatch) {
                        currentRatios[targetMode] = bestMatch.percentage;
                        currentTotalPercent += bestMatch.percentage;
                        currentTotalPerHour += bestMatch.perHour;
                    }
                }
                
                // Distribute remaining percentage to most efficient modes
                var remainingPercent = percentLimit - currentTotalPercent;
                while (remainingPercent > 0) {
                    var bestMode = -1;
                    var bestEfficiency = 0;
                    
                    for (var mode = 0; mode < 4; mode++) {
                        if (availableModes[mode].length > 0) {
                            // Find max available percentage for this mode
                            var maxAvailable = 0;
                            for (var i = 0; i < availableModes[mode].length; i++) {
                                if (availableModes[mode][i].percentage > maxAvailable) {
                                    maxAvailable = availableModes[mode][i].percentage;
                                }
                            }
                            
                            // Find current efficiency for this mode
                            var currentEfficiency = 0;
                            for (var i = 0; i < availableModes[mode].length; i++) {
                                if (availableModes[mode][i].percentage === currentRatios[mode]) {
                                    currentEfficiency = availableModes[mode][i].perHour;
                                    break;
                                }
                            }
                            
                            // Check if we can add more to this mode
                            if (currentRatios[mode] < maxAvailable && currentEfficiency > bestEfficiency) {
                                bestEfficiency = currentEfficiency;
                                bestMode = mode;
                            }
                        }
                    }
                    
                    if (bestMode === -1) break;
                    
                    // Add what we can to the best mode
                    var maxAvailable = 0;
                    for (var i = 0; i < availableModes[bestMode].length; i++) {
                        if (availableModes[bestMode][i].percentage > maxAvailable) {
                            maxAvailable = availableModes[bestMode][i].percentage;
                        }
                    }
                    
                    var addAmount = Math.min(maxAvailable - currentRatios[bestMode], remainingPercent);
                    if (addAmount > 0) {
                        currentRatios[bestMode] += addAmount;
                        remainingPercent -= addAmount;
                        
                        // Update total per hour for the new ratio
                        for (var i = 0; i < availableModes[bestMode].length; i++) {
                            if (availableModes[bestMode][i].percentage === currentRatios[bestMode]) {
                                currentTotalPerHour += availableModes[bestMode][i].perHour;
                                break;
                            }
                        }
                    } else {
                        break;
                    }
                }
                
                // Update best combination if this one is better
                if (currentTotalPerHour > bestTotalPerHour && currentTotalPercent <= percentLimit) {
                    bestTotalPerHour = currentTotalPerHour;
                    bestCombination = currentRatios.slice();
                }
            }
        }
        
        return bestCombination[0] + '/' + bestCombination[1] + '/' + bestCombination[2] + '/' + bestCombination[3];
    }
    
    function calculateResults(percentLimit, timeLimitStr) {
        // Clear table
        tbody.innerHTML = '';
        
        // Clear previous summary and info
        var oldSummary = bottomContainer.querySelector('#summary');
        var oldInfo = bottomContainer.querySelector('#info');
        if (oldSummary) bottomContainer.removeChild(oldSummary);
        if (oldInfo) bottomContainer.removeChild(oldInfo);
        
        var timeLimitSec = parseTime(timeLimitStr);
        var optimalRatio = calculateOptimalRatio(timeLimitSec, percentLimit);
        
        // Display results
        results.forEach(function(result, index) {
            var percentage = result.p || Math.round(result.s / results[results.length-1].s * 100);
            var row = tbody.insertRow();
            
            // Style table rows
            row.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f9f9f9';
            
            if (percentage === 100) {
                row.style.borderBottom = '2px solid #7d510f';
                row.style.fontWeight = 'bold';
            } else if (percentage > 100) {
                row.style.background = '#fff9e6';
            }
            
            [percentage + '%', result.s].forEach(function(value) {
                var cell = row.insertCell();
                cell.textContent = value;
                cell.style.padding = '5px';
                cell.style.textAlign = 'center';
                cell.style.border = '1px solid #ddd';
            });
            
            var totalEff = 0;
            for (var mode = 0; mode < 4; mode++) {
                var resCell = row.insertCell(), timeCell = row.insertCell(), totalResCell = row.insertCell();
                var duration = result.res[mode].d, perHour = 0, totalResources = 0;
                
                if (duration !== '-') {
                    var wood = result.res[mode].r.wood || 0;
                    var stone = result.res[mode].r.stone || 0;
                    var iron = result.res[mode].r.iron || 0;
                    totalResources = wood + stone + iron;
                    var durationSec = parseTime(duration);
                    perHour = Math.round(totalResources / durationSec * 3600 * 100) / 100;
                }
                
                [resCell, timeCell, totalResCell].forEach(function(cell) {
                    cell.style.padding = '5px';
                    cell.style.textAlign = 'center';
                    cell.style.border = '1px solid #ddd';
                });
                
                resCell.textContent = perHour || 0;
                timeCell.textContent = duration;
                totalResCell.textContent = totalResources || 0;
                
                var durationSec = parseTime(duration);
                if (durationSec <= timeLimitSec && durationSec > 0 && perHour > 0) {
                    resCell.style.background = '#dfd';
                    timeCell.style.background = '#dfd';
                    totalResCell.style.background = '#dfd';
                } else if (perHour > 0) {
                    resCell.style.background = '#fdd';
                    timeCell.style.background = '#fdd';
                    totalResCell.style.background = '#fdd';
                }
                
                if (perHour > 0) totalEff += perHour;
            }
            
            var ratioCell = row.insertCell();
            ratioCell.textContent = optimalRatio;
            ratioCell.style.padding = '5px';
            ratioCell.style.textAlign = 'center';
            ratioCell.style.border = '1px solid #ddd';
            ratioCell.style.fontWeight = 'bold';
            
            if (index === 0) {
                ratioCell.style.background = '#e3f2fd';
                ratioCell.style.cursor = 'pointer';
                ratioCell.title = 'Click to copy ratio';
                ratioCell.onclick = function() {
                    navigator.clipboard.writeText(optimalRatio).then(function() {
                        alert('Copied: ' + optimalRatio);
                    }).catch(function() {
                        prompt('Copy this ratio:', optimalRatio);
                    });
                };
            }
        });
        
        // Add summary and info ABOVE close button
        var summary = document.createElement('div');
        summary.id = 'summary';
        summary.style.cssText = 'margin-bottom:10px;padding:10px;background:#f9f9f9;border-radius:5px;border:1px solid #7d510f;';
        summary.innerHTML = '<div style="color:#7d510f;font-weight:bold;font-size:14px;">Optimal Ratio: ' + optimalRatio + '</div><div style="color:#666;margin-top:5px;">Troops Limit: ' + percentLimit + '% | Time Limit: ' + timeLimitStr + '</div>';
        bottomContainer.insertBefore(summary, closeBtn);
        
        var info = document.createElement('div');
        info.id = 'info';
        info.style.cssText = 'margin-bottom:10px;padding:10px;background:#fff3cd;border:1px solid #ffeaa7;border-radius:5px;';
        info.innerHTML = '<strong style="color:#7d510f;">Max percentages per mode within time limit:</strong><br>Lazy: ' + 
            (results.reduce((max, r) => Math.max(max, r.res[0].d !== '-' && parseTime(r.res[0].d) <= timeLimitSec ? (r.p || Math.round(r.s/results[results.length-1].s*100)) : 0), 0)) + '% | ' +
            'Modest: ' + (results.reduce((max, r) => Math.max(max, r.res[1].d !== '-' && parseTime(r.res[1].d) <= timeLimitSec ? (r.p || Math.round(r.s/results[results.length-1].s*100)) : 0), 0)) + '% | ' +
            'Skilled: ' + (results.reduce((max, r) => Math.max(max, r.res[2].d !== '-' && parseTime(r.res[2].d) <= timeLimitSec ? (r.p || Math.round(r.s/results[results.length-1].s*100)) : 0), 0)) + '% | ' +
            'Great: ' + (results.reduce((max, r) => Math.max(max, r.res[3].d !== '-' && parseTime(r.res[3].d) <= timeLimitSec ? (r.p || Math.round(r.s/results[results.length-1].s*100)) : 0), 0)) + '%';
        bottomContainer.insertBefore(info, closeBtn);
    }
    
    updateBtn.onclick = function() {
        var percent = parseInt(percentInput.value);
        var timeLimit = timeInput.value;
        if (isNaN(percent) || percent < 1 || percent > 100) {
            alert('Please enter a valid percentage between 1 and 100');
        } else if (!/^\d{1,2}:\d{2}:\d{2}$/.test(timeLimit)) {
            alert('Please enter time in HH:MM:SS format');
        } else {
            calculateResults(percent, timeLimit);
        }
    };
    
    document.body.appendChild(container);
    calculateResults(100, '02:00:00');
}

main();
