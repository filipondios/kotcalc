// DOM Elements - Input Gems
const xInput = document.getElementById('x-value');
const yInput = document.getElementById('y-value');
const zInput = document.getElementById('z-value');

// DOM Elements - Bonuses
const guildBonusInput = document.getElementById('guild-bonus');
const festivalBonusCheck = document.getElementById('festival-bonus-check');
const totemBonusCheck = document.getElementById('totem-bonus-check');

// DOM Elements - Objective & Calculate
const objMaxBtn = document.getElementById('obj-max');
const objMinBtn = document.getElementById('obj-min');
const calculateBtn = document.getElementById('calculate-btn');
const inputErrorsDisplay = document.getElementById('input-errors');

// DOM Elements - Results
const inputValuesDisplay = document.getElementById('input-values');
const bonusValuesDisplay = document.getElementById('bonus-values');
const tValueDisplay = document.getElementById('t-value');
const tExplanationDisplay = document.getElementById('t-explanation');
const totalValueDisplay = document.getElementById('total-value');
const totalExplanationDisplay = document.getElementById('total-explanation');
const totalBonusObtainedEl = document.getElementById('total-bonus-obtained');
const totalBonusExplanationEl = document.getElementById('total-bonus-explanation');

let objective = 2999997;

// Format number with thousands separators (dots)
function formatNumber(num) {
    if (num === null || num === undefined) return "-";
    if (typeof num === 'string') return num;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Parse gem value safely
function parseGemValue(value) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : Math.max(0, parsed);
}

// Guild bonus validation
guildBonusInput.addEventListener('change', function() {
    let value = parseInt(this.value);
    if (isNaN(value)) value = 0;
    this.value = Math.max(0, Math.min(35, value));
});

// Input sanitization: allow only digits and clamp to max
[xInput, yInput, zInput].forEach(input => {
    input.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        if (this.value && parseInt(this.value) > 999999) {
            this.value = '999999';
        }
    });
});

guildBonusInput.addEventListener('input', function() {
    this.value = this.value.replace(/\D/g, '');
    if (this.value && parseInt(this.value) > 35) {
        this.value = '35';
    }
});

// Validate gem values: must be null or between 100 and 999999
function validateInputs() {
    const errors = [];
    
    [xInput, yInput, zInput].forEach((input, idx) => {
        const value = parseGemValue(input.value);       
        if (value !== null && (value < 100 || value > 999999)) {
            errors.push(`Values must be >= 100 and <= 999.999`);
        }
    });

    if (errors.length > 0) {
        inputErrorsDisplay.innerHTML = errors.join('<br>');
        inputErrorsDisplay.style.display = 'block';
        return false;
    }
    
    inputErrorsDisplay.style.display = 'none';
    return true;
}

// Event listeners for objective selection
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

// Calculate ritual: sum gems and apply bonuses
function calculateRitual(gem1, gem2, gem3, bonusPercent) {
    const baseSum = gem1 + gem2 + gem3;
    const resultCap = baseSum <= 999999 ? 999999 : 2999997;
    
    // If base sum exceeds objective, no bonuses apply
    if (baseSum >= objective) {
        return {
            baseSum,
            bonusAmount: 0,
            cappedBonus: 0,
            finalTotal: baseSum,
            wasAdjusted: false
        };
    }
    
    // Apply bonuses
    const bonusAmount = Math.floor(baseSum * bonusPercent);
    const cappedBonus = Math.min(bonusAmount, resultCap - baseSum);
    const finalTotal = baseSum + cappedBonus;
    
    return {
        baseSum,
        bonusAmount,
        cappedBonus,
        finalTotal,
        wasAdjusted: cappedBonus !== bonusAmount
    };
}

// Calculate required gem value to reach objective
function calculateRequiredGem(providedGems, bonusPercent) {
    const count = providedGems.filter(g => g !== null).length;
    const providedSum = providedGems.reduce((sum, g) => sum + (g !== null ? g : 0), 0);
    const neededCount = 3 - count;
    
    if (providedSum >= objective) {
        // Calculate the negative delta (how much over the objective)
        const delta = -(providedSum - objective);
        return {
            t: delta,
            disableBonuses: true
        };
    }
    
    // Calculate target before bonus
    const targetBeforeBonus = Math.floor(objective / (1 + bonusPercent));
    let t = Math.floor((targetBeforeBonus - providedSum) / neededCount);
    
    // Adjust t to get closest to objective
    const testSum1 = providedSum + t * neededCount;
    const test1Final = Math.floor(testSum1 * (1 + bonusPercent));
    
    const testSum2 = providedSum + (t + 1) * neededCount;
    const test2Final = Math.floor(testSum2 * (1 + bonusPercent));
    
    if (Math.abs(test2Final - objective) < Math.abs(test1Final - objective)) {
        t = t + 1;
    }
    
    return { t, disableBonuses: false };
}

// Update display with gems and bonuses
function updateDisplay(gems, bonusPercent) {
    const displays = gems.map(g => g === null ? "N/A" : formatNumber(g));
    inputValuesDisplay.textContent = displays.join(", ");
    
    if (bonusPercent === 0) {
        bonusValuesDisplay.textContent = '0%';
    } else {
        const guildBonus = parseInt(guildBonusInput.value) || 0;
        let bonusText = `${(bonusPercent * 100).toFixed(0)}% (`;
        const parts = [];
        
        if (guildBonus > 0) parts.push(`Guild: ${guildBonus}%`);
        if (festivalBonusCheck.checked) parts.push(`Festival: 25%`);
        if (totemBonusCheck.checked) parts.push(`Totem: 20%`);
        
        bonusText += parts.join(", ") + ')';
        bonusValuesDisplay.textContent = bonusText;
    }
}

// Main calculate handler
calculateBtn.addEventListener('click', function() {
    // Parse gem values
    const gems = [
        parseGemValue(xInput.value),
        parseGemValue(yInput.value),
        parseGemValue(zInput.value)
    ];
    
    // Validate inputs
    if (!validateInputs()) return;
    
    // Calculate bonuses
    const guildBonus = (parseInt(guildBonusInput.value) || 0) / 100;
    const festivalBonus = festivalBonusCheck.checked ? 0.25 : 0;
    const totemBonus = totemBonusCheck.checked ? 0.20 : 0;
    const totalBonus = guildBonus + festivalBonus + totemBonus;
    
    // Update display
    updateDisplay(gems, totalBonus);
    
    // Determine how many gems are provided
    const providedCount = gems.filter(g => g !== null).length;
    
    if (providedCount === 3) {
        // All gems provided - simple calculation
        const ritual = calculateRitual(gems[0], gems[1], gems[2], totalBonus);
        tValueDisplay.textContent = "-";
        tExplanationDisplay.textContent = "All three gem values have been provided.";
        
        displayResults(ritual.baseSum, ritual.bonusAmount, ritual.cappedBonus, 
            ritual.finalTotal, ritual.wasAdjusted, totalBonus);
    } else {
        // Need to calculate missing gem value(s)
        const result = calculateRequiredGem(gems, totalBonus);
        const t = result.t;
        const disableBonuses = result.disableBonuses;
        
        // If provided gems already meet objective, disable bonuses
        let effectiveBonus = totalBonus;
        if (disableBonuses) {
            effectiveBonus = 0;
        }
        
        // Check if t is too large
        if (t > 999999) {
            tValueDisplay.textContent = "-";
            tExplanationDisplay.textContent = `Cannot reach objective (${formatNumber(objective)}) with gem values ≤ 999.999.`;
            totalValueDisplay.textContent = "-";
            totalExplanationDisplay.textContent = "";
            totalBonusObtainedEl.textContent = "-";
            totalBonusExplanationEl.textContent = "";
            return;
        }
        
        // Handle negative t (base exceeds objective)
        if (t < 0) {
            const perValueExcess = Math.floor(t);
            const totalExcess = Math.abs(perValueExcess * (3 - providedCount));
            const absValue = Math.abs(perValueExcess);
            
            // If disableBonuses is true, show as delta negative
            if (disableBonuses) {
                tValueDisplay.textContent = formatNumber(t);
                tExplanationDisplay.textContent = `Delta: ${formatNumber(t)} (provided gems exceed objective by ${formatNumber(absValue)}).`;
            } else {
                tValueDisplay.textContent = formatNumber(perValueExcess);
                tExplanationDisplay.textContent = `This represents an excess of ${formatNumber(absValue)} per gem (total ${formatNumber(totalExcess)} across ${3 - providedCount} gems).`;
            }
        } else {
            tValueDisplay.textContent = formatNumber(t);
            const neededDesc = 3 - providedCount === 1 ? "one gem" : `${3 - providedCount} gems`;
            tExplanationDisplay.textContent = `${neededDesc} with value ${formatNumber(t)} is needed.`;
        }

        // Build final gems with calculated value
        const finalGems = [...gems];
        for (let i = 0; i < 3; i++) {
            if (finalGems[i] === null) {
                finalGems[i] = t;
            }
        }
        
        const ritual = calculateRitual(finalGems[0], finalGems[1], finalGems[2], effectiveBonus);
        displayResults(ritual.baseSum, ritual.bonusAmount, ritual.cappedBonus, 
            ritual.finalTotal, ritual.wasAdjusted, effectiveBonus);
    }
});

// Display ritual results
function displayResults(baseSum, bonusAmount, cappedBonus, finalTotal, wasAdjusted, totalBonus) {
    totalBonusObtainedEl.textContent = formatNumber(cappedBonus);
    
    const bonusPercent = (totalBonus * 100).toFixed(0);
    if (wasAdjusted) {
        totalBonusExplanationEl.innerHTML = 
            `${bonusPercent}% of ${formatNumber(baseSum)} = ${formatNumber(bonusAmount)} ` +
            `<span class="highlight">→ Adjusted to: ${formatNumber(cappedBonus)}</span>`;
    } else {
        totalBonusExplanationEl.textContent = 
            `${bonusPercent}% of ${formatNumber(baseSum)} = ${formatNumber(bonusAmount)}`;
    }
    
    totalValueDisplay.textContent = formatNumber(finalTotal);
    totalExplanationDisplay.textContent = `${formatNumber(baseSum)} + ${bonusPercent}% = ${formatNumber(finalTotal)}`;
}

// Auto-calculate on page load and add visual feedback
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