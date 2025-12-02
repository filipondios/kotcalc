// DOM Elements
const xInput = document.getElementById('x-value');
const yInput = document.getElementById('y-value');
const zInput = document.getElementById('z-value');
const guildBonusInput = document.getElementById('guild-bonus');
const festivalBonusCheck = document.getElementById('festival-bonus-check');
const totemBonusCheck = document.getElementById('totem-bonus-check');
const objMaxBtn = document.getElementById('obj-max');
const objMinBtn = document.getElementById('obj-min');
const calculateBtn = document.getElementById('calculate-btn');

// Result Elements
const inputValuesDisplay = document.getElementById('input-values');
const bonusValuesDisplay = document.getElementById('bonus-values');
const tValueDisplay = document.getElementById('t-value');
const tExplanationDisplay = document.getElementById('t-explanation');
const totalValueDisplay = document.getElementById('total-value');
const totalExplanationDisplay = document.getElementById('total-explanation');

// State Variables
let objective = 2999997; // Default objective

// Validate guild bonus on change
guildBonusInput.addEventListener('change', function() {
    let value = parseInt(this.value);
    if (isNaN(value)) value = 0;
    if (value < 0) value = 0;
    if (value > 35) value = 35;
    this.value = value;
});

// Objective selection
objMaxBtn.addEventListener('click', function() {
    objective = 2999997;
    objMaxBtn.classList.add('active');
    objMinBtn.classList.remove('active');
});

objMinBtn.addEventListener('click', function() {
    objective = 999999;
    objMaxBtn.classList.remove('active');
    objMinBtn.classList.add('active');
});

// Main calculation function
calculateBtn.addEventListener('click', function() {
    // Get input values
    const x = parseInput(xInput.value);
    const y = parseInput(yInput.value);
    const z = parseInput(zInput.value);
    
    // Calculate bonuses
    const guildBonus = parseInt(guildBonusInput.value) / 100;
    const festivalBonus = festivalBonusCheck.checked ? 0.25 : 0;
    const totemBonus = totemBonusCheck.checked ? 0.20 : 0;
    const totalBonus = guildBonus + festivalBonus + totemBonus;
    
    // Update display
    updateDisplay(x, y, z, totalBonus);
    
    // Determine how many values are provided
    const providedValues = [x, y, z].filter(val => val !== null);
    const count = providedValues.length;
    
    // Calculate based on the number of provided values
    let result, tValue, explanation;
    
    if (count === 0) {
        // Case 1: No values provided
        result = calculateForZeroValues(totalBonus, objective);
        tValue = result.t;
        explanation = "Three identical values (t) are needed to reach the objective with applied bonuses.";
    } else if (count === 1) {
        // Case 2: One value provided
        const singleValue = providedValues[0];
        result = calculateForOneValue(singleValue, totalBonus, objective);
        tValue = result.t;
        explanation = `With the provided value (${singleValue}), two identical values (t) are needed to reach the objective with applied bonuses.`;
    } else if (count === 2) {
        // Case 3: Two values provided
        const [val1, val2] = providedValues;
        result = calculateForTwoValues(val1, val2, totalBonus, objective);
        tValue = result.t;
        explanation = `With the provided values (${val1}, ${val2}), one additional value (t) is needed to reach the objective with applied bonuses.`;
    } else {
        // Case 4: Three values provided
        result = calculateForThreeValues(x, y, z, totalBonus, objective);
        tValue = "N/A (all values provided)";
        explanation = `All three values have been provided. Calculating total result with applied bonuses.`;
    }
    
    // Display results
    tValueDisplay.textContent = formatNumber(tValue);
    tExplanationDisplay.textContent = explanation;
    
    // Calculate and display final total
    const finalSum = count === 3 ? x + y + z : 
                   count === 2 ? providedValues[0] + providedValues[1] + result.t :
                   count === 1 ? providedValues[0] + result.t + result.t :
                   result.t + result.t + result.t;
    
    const finalTotal = applyBonuses(finalSum, totalBonus);
    const cappedTotal = capResult(finalTotal, finalSum);
    
    totalValueDisplay.textContent = formatNumber(cappedTotal);
    totalExplanationDisplay.innerHTML = `Base sum: ${formatNumber(finalSum)} + ${(totalBonus*100).toFixed(0)}% = ${formatNumber(finalTotal)} <span class="highlight">→ Adjusted to: ${formatNumber(cappedTotal)}</span>`;
});

// Parse input values
function parseInput(value) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : Math.max(0, parsed);
}

// Apply bonuses to sum
function applyBonuses(sum, bonus) {
    return Math.floor(sum * (1 + bonus));
}

// Cap result according to game rules
function capResult(total, baseSum) {
    // If base sum is <= 999,999, result is capped at 999,999
    if (baseSum <= 999999) {
        return Math.min(total, 999999);
    }
    // Maximum allowed result is 2,999,997
    return Math.min(total, 2999997);
}

// Calculate for zero values
function calculateForZeroValues(bonus, objective) {
    // We need: 3t * (1 + bonus) = objective (or closest possible)
    // But with the limit that if 3t <= 999,999, result is capped at 999,999
    
    // First, calculate t to reach exact objective
    let t = Math.floor(objective / (3 * (1 + bonus)));
    
    // Check if with this t, base sum (3t) is <= 999,999
    const baseSum = 3 * t;
    const totalWithBonus = applyBonuses(baseSum, bonus);
    const cappedTotal = capResult(totalWithBonus, baseSum);
    
    // If we don't reach the objective, increment t to find best value
    if (cappedTotal < objective) {
        while (true) {
            const newT = t + 1;
            const newBaseSum = 3 * newT;
            const newTotalWithBonus = applyBonuses(newBaseSum, bonus);
            const newCappedTotal = capResult(newTotalWithBonus, newBaseSum);
            
            if (newCappedTotal > objective || newCappedTotal < cappedTotal) {
                break;
            }
            
            t = newT;
            if (newCappedTotal === objective) {
                break;
            }
        }
    }
    
    return { t };
}

// Calculate for one value
function calculateForOneValue(value, bonus, objective) {
    // We need: (value + 2t) * (1 + bonus) = objective (or closest possible)
    
    // Calculate t to reach exact objective
    let t = Math.floor((objective / (1 + bonus) - value) / 2);
    
    // Check result with this t
    const baseSum = value + 2 * t;
    const totalWithBonus = applyBonuses(baseSum, bonus);
    const cappedTotal = capResult(totalWithBonus, baseSum);
    
    // Adjust t if needed
    if (cappedTotal < objective) {
        // Try incrementing t to find best value
        while (true) {
            const newT = t + 1;
            const newBaseSum = value + 2 * newT;
            const newTotalWithBonus = applyBonuses(newBaseSum, bonus);
            const newCappedTotal = capResult(newTotalWithBonus, newBaseSum);
            
            if (newCappedTotal > objective || newCappedTotal < cappedTotal) {
                break;
            }
            
            t = newT;
            if (newCappedTotal === objective) {
                break;
            }
        }
    } else if (cappedTotal > objective) {
        // If we overshoot, reduce t
        while (true) {
            const newT = t - 1;
            if (newT < 0) break;
            
            const newBaseSum = value + 2 * newT;
            const newTotalWithBonus = applyBonuses(newBaseSum, bonus);
            const newCappedTotal = capResult(newTotalWithBonus, newBaseSum);
            
            // If we're closer to objective with new t, use it
            if (Math.abs(newCappedTotal - objective) < Math.abs(cappedTotal - objective) && newCappedTotal <= objective) {
                t = newT;
            } else {
                break;
            }
        }
    }
    
    return { t };
}

// Calculate for two values
function calculateForTwoValues(val1, val2, bonus, objective) {
    // We need: (val1 + val2 + t) * (1 + bonus) = objective (or closest possible)
    
    // Calculate t to reach exact objective
    let t = Math.floor(objective / (1 + bonus) - val1 - val2);
    
    // Check result with this t
    const baseSum = val1 + val2 + t;
    const totalWithBonus = applyBonuses(baseSum, bonus);
    const cappedTotal = capResult(totalWithBonus, baseSum);
    
    // Adjust t if needed
    if (cappedTotal < objective) {
        // Try incrementing t to find best value
        while (true) {
            const newT = t + 1;
            const newBaseSum = val1 + val2 + newT;
            const newTotalWithBonus = applyBonuses(newBaseSum, bonus);
            const newCappedTotal = capResult(newTotalWithBonus, newBaseSum);
            
            if (newCappedTotal > objective || newCappedTotal < cappedTotal) {
                break;
            }
            
            t = newT;
            if (newCappedTotal === objective) {
                break;
            }
        }
    } else if (cappedTotal > objective) {
        // If we overshoot, reduce t
        while (true) {
            const newT = t - 1;
            if (newT < 0) break;
            
            const newBaseSum = val1 + val2 + newT;
            const newTotalWithBonus = applyBonuses(newBaseSum, bonus);
            const newCappedTotal = capResult(newTotalWithBonus, newBaseSum);
            
            // If we're closer to objective with new t, use it
            if (Math.abs(newCappedTotal - objective) < Math.abs(cappedTotal - objective) && newCappedTotal <= objective) {
                t = newT;
            } else {
                break;
            }
        }
    }
    
    return { t };
}

// Calculate for three values
function calculateForThreeValues(x, y, z, bonus, objective) {
    const baseSum = x + y + z;
    const totalWithBonus = applyBonuses(baseSum, bonus);
    const cappedTotal = capResult(totalWithBonus, baseSum);
    
    return { t: null, total: cappedTotal };
}

// Update display
function updateDisplay(x, y, z, totalBonus) {
    // Display input values
    const xDisplay = x !== null ? formatNumber(x) : "-";
    const yDisplay = y !== null ? formatNumber(y) : "-";
    const zDisplay = z !== null ? formatNumber(z) : "-";
    inputValuesDisplay.textContent = `X: ${xDisplay}, Y: ${yDisplay}, Z: ${zDisplay}`;
    
    // Display bonuses
    const bonusPercent = (totalBonus * 100).toFixed(0);
    let bonusText = `${bonusPercent}% (`;
    
    const guildBonus = parseInt(guildBonusInput.value);
    if (guildBonus > 0) {
        bonusText += `Guild: ${guildBonus}%, `;
    }
    
    if (festivalBonusCheck.checked) {
        bonusText += `Festival: 25%, `;
    }
    
    if (totemBonusCheck.checked) {
        bonusText += `Totem: 20%, `;
    }
    
    // Remove trailing comma and space
    if (bonusText.endsWith(", ")) {
        bonusText = bonusText.slice(0, -2);
    }
    
    bonusText += ")";
    bonusValuesDisplay.textContent = bonusText;
}

// Format number with thousands separators
function formatNumber(num) {
    if (num === null || num === undefined) return "-";
    if (typeof num === 'string' && num === "N/A (all values provided)") return num;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Initialize page
window.addEventListener('DOMContentLoaded', function() {
    // Auto-calculate on page load
    calculateBtn.click();
    
    // Add input event listeners for real-time validation
    [xInput, yInput, zInput, guildBonusInput].forEach(input => {
        input.addEventListener('input', function() {
            this.style.backgroundColor = '#1a2234';
            setTimeout(() => {
                this.style.backgroundColor = '';
            }, 300);
        });
    });
});