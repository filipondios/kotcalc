import { t } from './i18n.js';

const CONFIG = {
    MAX_GEM_VALUE: 2999997,
    MAX_BASE_VALUE: 999999,
    MAX_GUILD_BONUS: 35,
    GEM_THRESHOLDS: [300, 1000, 3000, 10000, 30000, 100000, 300000, 1000000],
    BASE_IMAGE: 'img/gem-blue',
    EXTENSION: '.png',
    PERFECT_GEM: 'img/perfect-gem.png'
};

let objective = CONFIG.MAX_GEM_VALUE;

const DOM = {
    gemInputs: {
        x: document.getElementById('x-value'),
        y: document.getElementById('y-value'),
        z: document.getElementById('z-value')
    },
    gemImages: {
        x: document.getElementById('gem-x-img'),
        y: document.getElementById('gem-y-img'),
        z: document.getElementById('gem-z-img')
    },
    bonuses: {
        guild: document.getElementById('guild-bonus'),
        festival: document.getElementById('festival-bonus-check'),
        totem: document.getElementById('totem-bonus-check'),
        universal: document.getElementById('universal-gem-wizard-check'),
        gemWizard: document.getElementById('gem-wizard-check')
    },
    objective: {
        max: document.getElementById('obj-max-check'),
        min: document.getElementById('obj-min-check'),
        custom: document.getElementById('obj-custom-check'),
        customInput: document.getElementById('obj-custom-input'),
        customImg: document.getElementById('obj-custom-img')
    },
    results: {
        inputValues: document.getElementById('input-values'),
        bonusValues: document.getElementById('bonus-values'),
        tValue: document.getElementById('t-value'),
        tExplanation: document.getElementById('t-explanation'),
        totalValue: document.getElementById('total-value'),
        totalExplanation: document.getElementById('total-explanation'),
        totalBonusObtained: document.getElementById('total-bonus-obtained'),
        totalBonusExplanation: document.getElementById('total-bonus-explanation'),
        totemImg: document.getElementById('totem-img')
    },
    calculateBtn: document.getElementById('calculate-btn')
};

const formatNumber = (num) => {
    if (num === null || num === undefined || typeof num !== 'number') return "-";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const parseGemValue = (value) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : Math.max(0, parsed);
};

const getGemImageForValue = (v) => {
    // determine gem image filename based on value
    if (v == null || v < 300) return `${CONFIG.BASE_IMAGE}-1${CONFIG.EXTENSION}`;
    if (v >= CONFIG.MAX_GEM_VALUE) return CONFIG.PERFECT_GEM;
    const thresholds = CONFIG.GEM_THRESHOLDS;
    
    for (let i = thresholds.length - 1; i >= 0; i--) {
        if (v >= thresholds[i]) {
            return `${CONFIG.BASE_IMAGE}-${i + 2}${CONFIG.EXTENSION}`;
        }
    }
    return `${CONFIG.BASE_IMAGE}-2${CONFIG.EXTENSION}`;
};

const calculateRitual = (gem1, gem2, gem3, bonusPercent) => {
    // calculate ritual outcome based on gem values and bonus
    const baseSum = gem1 + gem2 + gem3;
    const resultCap = baseSum <= CONFIG.MAX_BASE_VALUE ? 
        CONFIG.MAX_BASE_VALUE : CONFIG.MAX_GEM_VALUE;

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
};

const calculateRequiredGem = (providedGems, bonusPercent) => {
    // calculate required gem value 't' to reach objective
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
    }
    return { t, disableBonuses: false };
};

const getTotalBonus = () => {
    // Calculate total bonus percentage from inputs
    const guildBonus = (parseInt(DOM.bonuses.guild.value) || 0) / 100;
    const additionalBonuses = [
        DOM.bonuses.festival.checked ? 0.25 : 0,
        DOM.bonuses.totem.checked ? 0.20 : 0,
        DOM.bonuses.universal.checked ? 0.20 : 0,
        DOM.bonuses.gemWizard.checked ? 0.20 : 0
    ];
    return guildBonus + additionalBonuses.reduce((sum, bonus) => sum + bonus, 0);
};

const getBonusesBreakdown = (totalBonus) => {
    // Generate breakdown string for bonuses
    const guildPercent = Math.round(((parseInt(DOM.bonuses.guild.value) || 0) / 100) * 100);
    const parts = [];
    
    if (guildPercent > 0) parts.push(`${t('bonus_guild_label')}: ${guildPercent}%`);
    if (DOM.bonuses.festival.checked) parts.push(`${t('bonus_festival_short')}: 25%`);
    if (DOM.bonuses.totem.checked) parts.push(`${t('bonus_totem_short')}: 20%`);
    if (DOM.bonuses.universal.checked) parts.push(`${t('bonus_universal_short')}: 20%`);
    if (DOM.bonuses.gemWizard.checked) parts.push(`${t('bonus_gem_wizard_short')}: 20%`);
    
    return {
        percentage: `${(totalBonus * 100).toFixed(0)}%`,
        breakdown: parts.length > 0 ? `(${parts.join(', ')})` : ''
    };
};

const updateGemImageForInput = (inputEl, imgEl) => {
    // Update gem image based on input value
    if (!imgEl || !inputEl) return;
    const val = parseGemValue(inputEl.value);
    imgEl.src = getGemImageForValue(val);
};

const updateTotemImage = () => {
    // Update totem image based on checkbox
    if (!DOM.results.totemImg) return;
    DOM.results.totemImg.src = DOM.bonuses.totem.checked ? 
        'img/golden-totem.png' : 'img/normal-totem.png';
};

const updateDisplay = (gems, totalBonus) => {
    // Update input gem values display
    const missingLabel = t('value_na');
    const displays = gems.map(g => g === null ? missingLabel : formatNumber(g));
    DOM.results.inputValues.textContent = displays.join(", ");
    
    const bonusInfo = getBonusesBreakdown(totalBonus);
    DOM.results.bonusValues.textContent = bonusInfo.percentage;
    if (bonusInfo.breakdown) {
        DOM.results.bonusValues.textContent += ` ${bonusInfo.breakdown}`;
    }
};

const updateResults = (baseSum, bonusAmount, cappedBonus, finalTotal, wasAdjusted, totalBonus) => {
    // Update total bonus obtained
    DOM.results.totalBonusObtained.textContent = formatNumber(cappedBonus);
    const bonusPercent = (totalBonus * 100).toFixed(0);

    DOM.results.totalBonusExplanation.innerHTML = wasAdjusted
        ? t('bonus_adjusted_html', {
            percent: bonusPercent,
            base: formatNumber(baseSum),
            bonus: formatNumber(bonusAmount),
            capped: formatNumber(cappedBonus)
        })
        : t('bonus_standard_html', {
            percent: bonusPercent,
            base: formatNumber(baseSum),
            bonus: formatNumber(bonusAmount)
        });
    
    DOM.results.totalValue.textContent = formatNumber(finalTotal);
    DOM.results.totalExplanation.textContent = 
        `${formatNumber(baseSum)} + ${bonusPercent}% = ${formatNumber(finalTotal)}`;
};

const setObjective = (value, updateCustomImg = false) => {
    objective = value;
    if (updateCustomImg && DOM.objective.customImg) {
        // only update image if custom objective is selected
        DOM.objective.customImg.src = getGemImageForValue(value);
    }
};

const handleCustomObjective = () => {
    // read and validate custom objective input
    const raw = DOM.objective.customInput.value;
    let parsed = parseInt(raw);
    
    if (isNaN(parsed)) parsed = 300;
    if (parsed < 300) parsed = 300;
    if (parsed > CONFIG.MAX_GEM_VALUE) parsed = CONFIG.MAX_GEM_VALUE;
    
    setObjective(parsed);
    DOM.objective.customInput.value = parsed;

    if (DOM.objective.customImg) {
        // only update image if custom objective is selected
        DOM.objective.customImg.src = getGemImageForValue(parsed);
    }
};

const showObjectiveCustomInput = (show) => {
    DOM.objective.customInput.style.display = show ? 'inline-block' : 'none';
    const note = document.getElementById('obj-custom-note');
    const label = document.getElementById('obj-custom-check-label');
    
    if (note) note.style.display = show ? 'block' : 'none';
    if (label) label.style.display = show ? 'none' : 'inline';
};

const setupInputValidation = () => {
    Object.values(DOM.gemInputs).forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '');
            if (this.value && parseInt(this.value) > CONFIG.MAX_BASE_VALUE) {
                this.value = CONFIG.MAX_BASE_VALUE.toString();
            }
            
            if (this.id === 'x-value') updateGemImageForInput(this, DOM.gemImages.x);
            if (this.id === 'y-value') updateGemImageForInput(this, DOM.gemImages.y);
            if (this.id === 'z-value') updateGemImageForInput(this, DOM.gemImages.z);
        });
    });
    
    // Guild bonus input
    DOM.bonuses.guild.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
        if (this.value && parseInt(this.value) > CONFIG.MAX_GUILD_BONUS) {
            this.value = CONFIG.MAX_GUILD_BONUS.toString();
        }
    });
};

const performCalculation = () => {
    // Main calculation logic
    const gems = [ 
        parseGemValue(DOM.gemInputs.x.value),
        parseGemValue(DOM.gemInputs.y.value),
        parseGemValue(DOM.gemInputs.z.value)
    ];

    if (DOM.objective.custom.checked) {
        handleCustomObjective();
    }

    const totalBonus = getTotalBonus();
    updateDisplay(gems, totalBonus);
    const providedCount = gems.filter(gem => gem !== null).length;

    if (providedCount === 3) {
        const ritual = calculateRitual(gems[0], gems[1], gems[2], totalBonus);
        DOM.results.tValue.textContent = "-";
        DOM.results.tExplanation.textContent = t('all_gems_provided');
        updateResults(ritual.baseSum, ritual.bonusAmount, ritual.cappedBonus,
            ritual.finalTotal, ritual.wasAdjusted, totalBonus);
        return;
    }

    const result = calculateRequiredGem(gems, totalBonus);
    const effectiveBonus = result.disableBonuses ? 0 : totalBonus;
    const tValue = result.t;

    if (tValue > CONFIG.MAX_GEM_VALUE) {
        DOM.results.tValue.textContent = "-";
        DOM.results.tExplanation.textContent = 
            t('cannot_reach_objective', { objective: formatNumber(objective) });
        DOM.results.totalValue.textContent = "-";
        DOM.results.totalExplanation.textContent = "";
        DOM.results.totalBonusObtained.textContent = "-";
        DOM.results.totalBonusExplanation.textContent = "";
        return;
    }

    updateRequiredGemDisplay(tValue, providedCount, result.disableBonuses);
    updateFinalResults(gems, tValue, effectiveBonus);
};

const updateRequiredGemDisplay = (tValue, providedCount, disableBonuses) => {
    // Update display for required gem value 't'
    if (tValue < 0) {
        const absValue = Math.abs(Math.floor(tValue));
        const totalExcess = Math.abs(tValue * (3 - providedCount));
        
        DOM.results.tValue.textContent = formatNumber(tValue);
        DOM.results.tExplanation.textContent = disableBonuses
            ? t('delta_exceeds_objective', {
                delta: formatNumber(tValue),
                excess: formatNumber(absValue)
            })
            : t('excess_per_gem', {
                excess: formatNumber(absValue),
                total: formatNumber(totalExcess),
                count: (3 - providedCount)
            });
    } else {
        DOM.results.tValue.textContent = formatNumber(tValue);
        const neededCount = 3 - providedCount;
        DOM.results.tExplanation.textContent = neededCount === 1
            ? t('needed_gems_one', { value: formatNumber(tValue) })
            : t('needed_gems_many', { count: neededCount, value: formatNumber(tValue) });
    }
};

const updateFinalResults = (gems, tValue, effectiveBonus) => {
    // Update final results after calculating required gem value
    const finalGems = gems.map(gem => gem !== null ? gem : tValue);
    const ritual = calculateRitual(finalGems[0], finalGems[1], finalGems[2], effectiveBonus);
    updateResults(ritual.baseSum, ritual.bonusAmount, ritual.cappedBonus,
        ritual.finalTotal, ritual.wasAdjusted, effectiveBonus);
};

const setupEventListeners = () => {
    // initialize event listeners for inputs and buttons
    DOM.calculateBtn.addEventListener('click', performCalculation);    
    DOM.bonuses.totem.addEventListener('change', updateTotemImage);
    
    // Objective selection
    DOM.objective.max.addEventListener('click', () => {
        DOM.objective.max.checked = true;
        DOM.objective.min.checked = false;
        DOM.objective.custom.checked = false;
        showObjectiveCustomInput(false);
        setObjective(CONFIG.MAX_GEM_VALUE);
        DOM.calculateBtn.click();
    });
    
    DOM.objective.min.addEventListener('click', () => {
        DOM.objective.min.checked = true;
        DOM.objective.max.checked = false;
        DOM.objective.custom.checked = false;
        showObjectiveCustomInput(false);
        setObjective(CONFIG.MAX_BASE_VALUE);
        DOM.calculateBtn.click();
    });
    
    DOM.objective.custom.addEventListener('click', () => {
        DOM.objective.custom.checked = true;
        DOM.objective.max.checked = false;
        DOM.objective.min.checked = false;
        showObjectiveCustomInput(true);
        DOM.calculateBtn.click();
    });
    
    // Custom objective input
    if (DOM.objective.customInput) {
        DOM.objective.customInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '');
            if (this.value) {
                const v = parseInt(this.value);
                if (v > CONFIG.MAX_GEM_VALUE) this.value = CONFIG.MAX_GEM_VALUE.toString();
                // only update image if custom objective is selected
                if (DOM.objective.custom.checked && DOM.objective.customImg) {
                    DOM.objective.customImg.src = getGemImageForValue(v);
                }
            }
        });

        DOM.objective.customInput.addEventListener('blur', function() {
            if (!this.value) return;
            const v = parseInt(this.value);
            if (isNaN(v) || v < 300) {
                this.value = '300';
                // only update image if custom objective is selected
                if (DOM.objective.custom.checked && DOM.objective.customImg) {
                    DOM.objective.customImg.src = getGemImageForValue(300);
                }
            }
        });
    }

    document.addEventListener('i18n:changed', () => {
        DOM.calculateBtn.click();
    });
};

export const initCalculator = () => {
    // Initialize the application
    setupInputValidation();
    setupEventListeners();
    updateTotemImage();
    
    // Initialize gem images
    updateGemImageForInput(DOM.gemInputs.x, DOM.gemImages.x);
    updateGemImageForInput(DOM.gemInputs.y, DOM.gemImages.y);
    updateGemImageForInput(DOM.gemInputs.z, DOM.gemImages.z);
    
    // Initialize custom objective image
     if (DOM.objective.customImg && DOM.objective.customInput) {
        const v = DOM.objective.customInput.value.trim() 
            ? parseInt(DOM.objective.customInput.value) : 300;
        DOM.objective.customImg.src = getGemImageForValue(v);
    }
    
    // Perform initial calculation
    DOM.calculateBtn.click();
};
