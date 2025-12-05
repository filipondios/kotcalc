// input gem values
const xInput = document.getElementById('x-value');
const yInput = document.getElementById('y-value');
const zInput = document.getElementById('z-value');

// input bonus values
const guildBonusInput = document.getElementById('guild-bonus');
const festivalBonusCheck = document.getElementById('festival-bonus-check');
const totemBonusCheck = document.getElementById('totem-bonus-check');

// objective buttons
const objMaxBtn = document.getElementById('obj-max');
const objMinBtn = document.getElementById('obj-min');

const calculateBtn = document.getElementById('calculate-btn');
const inputErrorsDisplay = document.getElementById('input-errors');

// Result Elements
const inputValuesDisplay = document.getElementById('input-values');
const bonusValuesDisplay = document.getElementById('bonus-values');
const tValueDisplay = document.getElementById('t-value');
const tExplanationDisplay = document.getElementById('t-explanation');
const totalValueDisplay = document.getElementById('total-value');
const totalExplanationDisplay = document.getElementById('total-explanation');
let objective = 2999997;

guildBonusInput.addEventListener('change', function() {
    let value = parseInt(this.value);
    if (isNaN(value)) value = 0;
    if (value < 0) value = 0;
    if (value > 35) value = 35;
    this.value = value;
});

[xInput, yInput, zInput].forEach(inp => {
    inp.addEventListener('input', function() {
        // remove any non-digit characters
        const cleaned = this.value.replace(/\D/g, '');
        this.value = cleaned;
        // clamp to max while typing
        if (this.value !== '') {
            const num = parseInt(this.value, 10);
            if (num > 999999) this.value = '999999';
        }
    });
});

guildBonusInput.addEventListener('input', function() {
    // Sanitize guild bonus input to digits only and clamp on input
    const cleaned = this.value.replace(/\D/g, '');
    this.value = cleaned;
    if (this.value !== '') {
        const num = parseInt(this.value, 10);
        if (num > 35) this.value = '35';
        if (num < 0) this.value = '0';
    }
});

function validateInputs() {
    const errors = [];
    // validate (x,y,z) if provided (optional)
    [ {el: xInput, name: 'X'}, {el: yInput, name: 'Y'}, {el: zInput, name: 'Z'} ].forEach(item => {
        const v = item.el.value.trim();
        if (v !== '') {
            const n = parseInt(v, 10);
            if (n < 100 || n > 999999) {
                errors.push(`Check your inputs. Gem values must be at least 100 and 999.999 at most`);
            }
        }
    });

    if (errors.length > 0) {
        if (inputErrorsDisplay) {
            inputErrorsDisplay.innerHTML = errors.map(e => `${e}`).join('<br>');
            inputErrorsDisplay.style.display = 'block';
        }
        return false;
    }
    if (inputErrorsDisplay) {
        inputErrorsDisplay.style.display = 'none';
        inputErrorsDisplay.innerHTML = '';
    }
    return true;
}

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

    // Validate inputs first
    if (!validateInputs()) return;
    updateDisplay(x, y, z, totalBonus);

    // Determine how many values are provided
    const providedValues = [x, y, z].filter(val => val !== null);
    const count = providedValues.length;
    let result, explanation;

    if (count === 0) {
        result = calculateForZeroValues(totalBonus, objective);
        explanation = "Three identical gems are needed to reach the objective with applied bonuses.";
    } else if (count === 1) {
        const singleValue = providedValues[0];
        result = calculateForOneValue(singleValue, totalBonus, objective);
        explanation = `With the provided gem (${singleValue}), two identical gems are needed.`;
    } else if (count === 2) {
        const [val1, val2] = providedValues;
        result = calculateForTwoValues(val1, val2, totalBonus, objective);
        explanation = `With the provided gems (${val1}, ${val2}), one additional gem is needed.`;
    } else {
        result = calculateForThreeValues(x, y, z, totalBonus, objective);
        explanation = `All three gem values have been provided`;
    }

    // Display preliminary t result (may be adjusted below)
    const tRaw = result.t;
    tValueDisplay.textContent = formatNumber(tRaw);
    tExplanationDisplay.textContent = explanation;

    // Calculate base sum
    const finalSum = count === 3 ? x + y + z : 
        count === 2 ? providedValues[0] + providedValues[1] + result.t :
        count === 1 ? providedValues[0] + result.t + result.t :
        result.t + result.t + result.t;

    // Compute uncapped totals
    const uncappedFinalTotal = applyBonuses(finalSum, totalBonus);
    const uncappedBonusOnly = Math.floor(finalSum * totalBonus);

    // Cap applied bonus so base + bonus doesn't exceed objective
    const maxAllowedBonus = Math.max(0, objective - finalSum);
    let appliedBonusOnly = Math.min(uncappedBonusOnly, maxAllowedBonus);
    let finalTotal = finalSum + appliedBonusOnly;

    // Keep legacy cap result for compatibility
    const cappedTotal = capResult(finalTotal, finalSum);

    // If t is a number and exceeds the individual cap (999,999) we report it's impossible
    const tNumeric = (typeof result.t === 'number') ? result.t : null;
    if (tNumeric !== null && tNumeric > 999999) {
        const msg = `Cannot reach objective (${formatNumber(objective)})`;
        tValueDisplay.textContent = msg;
        tExplanationDisplay.textContent = `Required value (${formatNumber(tNumeric)}) exceeds 999,999.`;
        totalValueDisplay.textContent = "-";
        totalExplanationDisplay.textContent = `Cannot reach ${formatNumber(objective)} with t ≤ 999,999.`;
        const totalBonusObtainedEl = document.getElementById('total-bonus-obtained');
        const totalBonusExplanationEl = document.getElementById('total-bonus-explanation');
        if (totalBonusObtainedEl) totalBonusObtainedEl.textContent = "-";
        if (totalBonusExplanationEl) totalBonusExplanationEl.textContent = "";
        return;
    }

    totalValueDisplay.textContent = formatNumber(finalTotal);
    totalExplanationDisplay.innerHTML = `${formatNumber(finalSum)} + ${(totalBonus*100).toFixed(0)}% = ${formatNumber(uncappedFinalTotal)} <span class="highlight">→ Adjusted to: ${formatNumber(finalTotal)}</span>`;

    const totalBonusObtainedEl = document.getElementById('total-bonus-obtained');
    const totalBonusExplanationEl = document.getElementById('total-bonus-explanation');
    if (totalBonusObtainedEl) {
        totalBonusObtainedEl.textContent = formatNumber(appliedBonusOnly);
    }
    if (totalBonusExplanationEl) {
        const percentText = `${(totalBonus*100).toFixed(0)}%`;
        const baseText = `${percentText} of ${formatNumber(finalSum)} = ${formatNumber(uncappedBonusOnly)}`;
        if (appliedBonusOnly < uncappedBonusOnly) {
            totalBonusExplanationEl.innerHTML = `${baseText} <span class="highlight">→ Adjusted to: ${formatNumber(appliedBonusOnly)}</span>`;
        } else {
            totalBonusExplanationEl.textContent = `${baseText}`;
        }
    }
});

function parseInput(value) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : Math.max(0, parsed);
}

function applyBonuses(sum, bonus) {
    return Math.floor(sum * (1 + bonus));
}

function capResult(total, baseSum) {
    // If base sum is <= 999,999, result is capped at 999,999
    if (baseSum <= 999999) {
        return Math.min(total, 999999);
    }
    // Maximum allowed result is 2,999,997
    return Math.min(total, 2999997);
}

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

function calculateForThreeValues(x, y, z, bonus, objective) {
    // Calculate for three values
    const baseSum = x + y + z;
    const totalWithBonus = applyBonuses(baseSum, bonus);
    const cappedTotal = capResult(totalWithBonus, baseSum);
    return { t: null, total: cappedTotal };
}

function updateDisplay(x, y, z, totalBonus) {
    // Display input values
    const xDisplay = x !== null ? formatNumber(x) : "-";
    const yDisplay = y !== null ? formatNumber(y) : "-";
    const zDisplay = z !== null ? formatNumber(z) : "-";
    inputValuesDisplay.textContent = `${xDisplay}, ${yDisplay}, ${zDisplay}`;
    
    // Display bonuses
    const bonusPercent = (totalBonus * 100).toFixed(0);
    const guildBonus = parseInt(guildBonusInput.value);
    let bonusText = '';

    if (totalBonus === 0) {
        bonusText = '0%';
    } else {
        bonusText = `${bonusPercent}% (`;
        if (guildBonus > 0) { bonusText += `Guild: ${guildBonus}%, `; }
        if (festivalBonusCheck.checked) { bonusText += `Color Festival: 25%, `; }
        if (totemBonusCheck.checked) { bonusText += `Golden Totem: 20%, `; }

        // Remove trailing comma and space
        if (bonusText.endsWith(', ')) {
            bonusText = bonusText.slice(0, -2);
        }

        bonusText += ')';
    }

    bonusValuesDisplay.textContent = bonusText;
}

function formatNumber(num) {
    // Format number with thousands separators
    if (num === null || num === undefined) return "-";
    if (typeof num === 'string') return num;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

window.addEventListener('DOMContentLoaded', function() {
    calculateBtn.click();
    [xInput, yInput, zInput, guildBonusInput].forEach(input => {
        input.addEventListener('input', function() {
            this.style.backgroundColor = '#1a2234';
            setTimeout(() => {
                this.style.backgroundColor = '';
            }, 300);
        });
    });
});