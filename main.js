const xInput = document.getElementById('x-value');
const yInput = document.getElementById('y-value');
const zInput = document.getElementById('z-value');
const guildBonusInput = document.getElementById('guild-bonus');
const festivalBonusCheck = document.getElementById('festival-bonus-check');
const totemBonusCheck = document.getElementById('totem-bonus-check');
const universalGemWizardCheck = document.getElementById('universal-gem-wizard-check');
const gemWizardCheck = document.getElementById('gem-wizard-check');
const objMaxCheck = document.getElementById('obj-max-check');
const objMinCheck = document.getElementById('obj-min-check');
const objCustomCheck = document.getElementById('obj-custom-check');
const objCustomInput = document.getElementById('obj-custom-input');
const objCustomContainer = document.getElementById('obj-custom-container');
const calculateBtn = document.getElementById('calculate-btn');
const inputErrorsDisplay = document.getElementById('input-errors');
const inputValuesDisplay = document.getElementById('input-values');
const bonusValuesDisplay = document.getElementById('bonus-values');
const tValueDisplay = document.getElementById('t-value');
const tExplanationDisplay = document.getElementById('t-explanation');
const totalValueDisplay = document.getElementById('total-value');
const totalExplanationDisplay = document.getElementById('total-explanation');
const totalBonusObtainedEl = document.getElementById('total-bonus-obtained');
const totalBonusExplanationEl = document.getElementById('total-bonus-explanation');
const totemImg = document.getElementById('totem-img');
// Gem icons next to inputs
const gemXImg = document.getElementById('gem-x-img');
const gemYImg = document.getElementById('gem-y-img');
const gemZImg = document.getElementById('gem-z-img');

const maxGemValue = 2999997;
const maxBaseValue = 999999;
let objective = maxGemValue;
const maxGuildBonus = 35;

const bonusesConfig = {
    guild: { el: guildBonusInput, percentFromValue: true, label: 'Guild' },
    festival: { el: festivalBonusCheck, percent: 0.25, label: 'Festival' },
    totem: { el: totemBonusCheck, percent: 0.20, label: 'Totem' },
    universal: { el: universalGemWizardCheck, percent: 0.20, label: 'Universal Gem Wizard' },
    gemWizard: { el: gemWizardCheck, percent: 0.20, label: 'Gem Wizard' }
};


function formatNumber(num) {
    // format number with thousands separators (dots)
    if (num === null || num === undefined) return "-";
    if (typeof num === 'string') return num;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseGemValue(value) {
    // parse gem value input, return null if invalid
    const parsed = parseInt(value);
    return isNaN(parsed)? null : Math.max(0, parsed);
}

// Determine image filename for a gem value
function getGemImageForValue(v) {
    if (v == null || v < 300) return 'img/gem-blue-1.png';
    if (v >= 300 && v < 1000) return 'img/gem-blue-2.png';
    if (v >= 1000 && v < 3000) return 'img/gem-blue-3.png';
    if (v >= 3000 && v < 10000) return 'img/gem-blue-4.png';
    if (v >= 10000 && v < 30000) return 'img/gem-blue-5.png';
    if (v >= 30000 && v < 100000) return 'img/gem-blue-6.png';
    if (v >= 100000 && v < 300000) return 'img/gem-blue-7.png';
    return 'img/gem-blue-8.png';
}

function updateGemImageForInput(inputEl, imgEl) {
    if (!imgEl || !inputEl) return;
    const val = parseGemValue(inputEl.value);
    imgEl.src = getGemImageForValue(val);
}

[xInput, yInput, zInput].forEach(input => {
    // allow only digits and clamp to max gem value
    input.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        if (this.value && parseInt(this.value) > maxBaseValue) {
            this.value = maxBaseValue.toString();
        }
        // update corresponding gem image
        if (this.id === 'x-value') updateGemImageForInput(this, gemXImg);
        if (this.id === 'y-value') updateGemImageForInput(this, gemYImg);
        if (this.id === 'z-value') updateGemImageForInput(this, gemZImg);
    });
});

guildBonusInput.addEventListener('input', function() {
    // allow only digits and clamp to max guild bonus
    this.value = this.value.replace(/\D/g, '');
    if (this.value && parseInt(this.value) > maxGuildBonus) {
        this.value = maxGuildBonus.toString();
    }
});

function calculateRitual(gem1, gem2, gem3, bonusPercent) {
    // Calculate ritual results given gem values and bonus
    const baseSum = gem1 + gem2 + gem3;
    const resultCap = baseSum <= maxBaseValue ? 
        maxBaseValue : maxGemValue;

    if (baseSum >= objective) {
        return {
            baseSum,
            bonusAmount: 0,
            cappedBonus: 0,
            finalTotal: baseSum,
            wasAdjusted: false
        };
    }

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

function calculateRequiredGem(providedGems, bonusPercent) {
    // Calculate required gem value 't' to reach objective
    const count = providedGems.filter(gem => gem !== null).length;
    const providedSum = providedGems.reduce((sum, gem) => sum + (gem !== null ? gem : 0), 0);
    const neededCount = 3 - count;

    if (providedSum >= objective) {
        const delta = -(providedSum - objective);
        return { t: delta, disableBonuses: true };
    }

    const targetBeforeBonus = Math.floor(objective / (1 + bonusPercent));
    let t = Math.floor((targetBeforeBonus - providedSum) / neededCount);
    
    const testSum1 = providedSum + t * neededCount;
    const test1Final = Math.floor(testSum1 * (1 + bonusPercent));
    const testSum2 = providedSum + (t + 1) * neededCount;
    const test2Final = Math.floor(testSum2 * (1 + bonusPercent));
    
    if (Math.abs(test2Final - objective) < Math.abs(test1Final - objective)) {
        t = t + 1;
    } return { t, disableBonuses: false };
}

function getBonusComponents() {
    // obtain active bonuses
    const components = {};
    const guild = (parseInt(bonusesConfig.guild.el.value) || 0)/100;
    components.guild = guild;

    let total = guild;
    Object.keys(bonusesConfig).forEach(key => {
        if (key === 'guild') return;
        const cfg = bonusesConfig[key];
        const el = cfg.el;
        const val = (el && el.checked) ? cfg.percent : 0;
        components[key] = val;
        total += val;
    });
    components.total = total;
    return components;
}

function updateDisplay(gems, bonusComponents) {
    // update display with gems and bonuses values
    const displays = gems.map(g => g === null ? "N/A" : formatNumber(g));
    inputValuesDisplay.textContent = displays.join(", ");

    const total = bonusComponents.total;
    if (total === 0) {
        bonusValuesDisplay.textContent = '0%';
    } else {
        const guildPercent = Math.round((bonusComponents.guild || 0) * 100);
        let bonusText = `${(total * 100).toFixed(0)}% (`;
        const parts = [];

        if (guildPercent > 0) parts.push(`Guild: ${guildPercent}%`);
        if (bonusComponents.festival) parts.push(`Festival: 25%`);
        if (bonusComponents.totem) parts.push(`Totem: 20%`);
        if (bonusComponents.universal) parts.push(`Universal Gem Wizard: 20%`);
        if (bonusComponents.gemWizard) parts.push(`Gem Wizard: 20%`);

        bonusText += parts.join(", ") + ')';
        bonusValuesDisplay.textContent = bonusText;
    }
}

calculateBtn.addEventListener('click', function() {
    // main calculation logic on button click
    const gems = [ 
        parseGemValue(xInput.value),
        parseGemValue(yInput.value),
        parseGemValue(zInput.value)
    ];

    // If custom objective selected, read its input and use it as objective (silent clamp)
    if (objCustomCheck && objCustomCheck.checked) {
        const raw = objCustomInput ? objCustomInput.value : '';
        let parsed = parseInt(raw);
        if (isNaN(parsed)) parsed = 300;
        if (parsed < 300) parsed = 300;
        if (parsed > maxGemValue) parsed = maxGemValue;
        // hide any previous input error display
        if (inputErrorsDisplay) inputErrorsDisplay.style.display = 'none';
        objective = parsed;
    }

    const bonusComponents = getBonusComponents();
    updateDisplay(gems, bonusComponents);    
    const totalBonus = bonusComponents.total;
    const providedCount = gems.filter(gem => gem !== null).length;

    if (providedCount === 3) {
        // all gems provided, calculate directly
        const ritual = calculateRitual(gems[0], gems[1], gems[2], totalBonus);
        tValueDisplay.textContent = "-";
        tExplanationDisplay.textContent = "All three gem values have been provided.";

        displayResults(ritual.baseSum, ritual.bonusAmount, ritual.cappedBonus,
            ritual.finalTotal, ritual.wasAdjusted, totalBonus);
    } else {
        // calculate required gem/s value 't'
        const result = calculateRequiredGem(gems, totalBonus);
        const disableBonuses = result.disableBonuses;
        const t = result.t;
        
        let effectiveBonus = totalBonus;
        if (disableBonuses) {
            effectiveBonus = 0;
        }

        if (t > maxGemValue) {
            tValueDisplay.textContent = "-";
            tExplanationDisplay.textContent = `Cannot reach objective (${formatNumber(objective)}) with gem values ≤ 999.999.`;
            totalValueDisplay.textContent = "-";
            totalExplanationDisplay.textContent = "";
            totalBonusObtainedEl.textContent = "-";
            totalBonusExplanationEl.textContent = "";
            return;
        }
        
        if (t < 0) {
            const perValueExcess = Math.floor(t);
            const totalExcess = Math.abs(perValueExcess * (3 - providedCount));
            const absValue = Math.abs(perValueExcess);
            
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
            const verb = 3 - providedCount === 1 ? "is" : "are";
            tExplanationDisplay.textContent = `${neededDesc} with value ${formatNumber(t)} ${verb} needed.`;
        }

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

function displayResults(baseSum, bonusAmount, cappedBonus, finalTotal, wasAdjusted, totalBonus) {
    // update results display with calculation results
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

// Update totem image depending on checkbox
function updateTotemImage() {
    if (!totemImg) return;
    if (totemBonusCheck && totemBonusCheck.checked) {
        totemImg.src = 'img/golden-totem.png';
    } else {
        totemImg.src = 'img/normal-totem.png';
    }
}

totemBonusCheck.addEventListener('change', updateTotemImage);
window.addEventListener('DOMContentLoaded', function() {
    // initial setup on page load
    updateTotemImage();
    // init gem images based on current input values
    updateGemImageForInput(xInput, gemXImg);
    updateGemImageForInput(yInput, gemYImg);
    updateGemImageForInput(zInput, gemZImg);
    // ensure custom input hidden initially
    if (objCustomInput) objCustomInput.style.display = 'none';
    calculateBtn.click();
});

// change target objective when checkboxes are clicked
objMaxCheck.addEventListener('click', () => {
    objMaxCheck.checked = true;
    objMinCheck.checked = false;
    if (objCustomCheck) objCustomCheck.checked = false;
    if (objCustomInput) objCustomInput.style.display = 'none';
    const note = document.getElementById('obj-custom-note');
    if (note) note.style.display = 'none';
    const label = document.getElementById('obj-custom-check-label');
    if (label) label.style.display = 'inline';
    objective = maxGemValue;
    calculateBtn.click();
});

objMinCheck.addEventListener('click', () => {
    objMinCheck.checked = true;
    objMaxCheck.checked = false;
    if (objCustomCheck) objCustomCheck.checked = false;
    if (objCustomInput) objCustomInput.style.display = 'none';
    const note = document.getElementById('obj-custom-note');
    if (note) note.style.display = 'none';
    const label = document.getElementById('obj-custom-check-label');
    if (label) label.style.display = 'inline';
    objective = maxBaseValue;
    calculateBtn.click();
});

if (objCustomCheck) {
    objCustomCheck.addEventListener('click', () => {
        objCustomCheck.checked = true;
        objMaxCheck.checked = false;
        objMinCheck.checked = false;
        if (objCustomInput) objCustomInput.style.display = 'inline-block';
        const note = document.getElementById('obj-custom-note');
        if (note) note.style.display = 'block';
        const label = document.getElementById('obj-custom-check-label');
        if (label) label.style.display = 'none';
        // do not set objective here; validate on calculation
        calculateBtn.click();
    });
}

if (objCustomInput) {
    objCustomInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        if (this.value) {
            const v = parseInt(this.value);
            if (v > maxGemValue) this.value = maxGemValue.toString();
        }
    });
    objCustomInput.addEventListener('blur', function() {
        if (!this.value) return;
        const v = parseInt(this.value);
        if (isNaN(v) || v < 300) {
            this.value = '300';
        }
    });
}