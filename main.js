// Elementos del DOM
const xInput = document.getElementById('x-value');
const yInput = document.getElementById('y-value');
const zInput = document.getElementById('z-value');
const guildBonusCheck = document.getElementById('guild-bonus-check');
const guildBonusSlider = document.getElementById('guild-bonus');
const guildBonusValue = document.getElementById('guild-value');
const festivalBonusCheck = document.getElementById('festival-bonus-check');
const totemBonusCheck = document.getElementById('totem-bonus-check');
const objMaxBtn = document.getElementById('obj-max');
const objMinBtn = document.getElementById('obj-min');
const calculateBtn = document.getElementById('calculate-btn');

// Elementos de resultados
const inputValuesDisplay = document.getElementById('input-values');
const bonusValuesDisplay = document.getElementById('bonus-values');
const tValueDisplay = document.getElementById('t-value');
const tExplanationDisplay = document.getElementById('t-explanation');
const totalValueDisplay = document.getElementById('total-value');
const totalExplanationDisplay = document.getElementById('total-explanation');

// Variables de estado
let objective = 2999997; // Objetivo por defecto

// Actualizar valor del slider del gremio
guildBonusSlider.addEventListener('input', function() {
    guildBonusValue.textContent = `${this.value}%`;
});

// Selección de objetivo
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

// Función principal de cálculo
calculateBtn.addEventListener('click', function() {
    // Obtener valores de entrada
    const x = parseInput(xInput.value);
    const y = parseInput(yInput.value);
    const z = parseInput(zInput.value);
    
    // Calcular bonificaciones
    const guildBonus = guildBonusCheck.checked ? parseInt(guildBonusSlider.value) / 100 : 0;
    const festivalBonus = festivalBonusCheck.checked ? 0.25 : 0;
    const totemBonus = totemBonusCheck.checked ? 0.20 : 0;
    const totalBonus = guildBonus + festivalBonus + totemBonus;
    
    // Mostrar valores de entrada y bonificaciones
    updateDisplay(x, y, z, totalBonus);
    
    // Determinar cuántos valores se han proporcionado
    const providedValues = [x, y, z].filter(val => val !== null);
    const count = providedValues.length;
    
    // Calcular según la cantidad de valores proporcionados
    let result, tValue, explanation;
    
    if (count === 0) {
        // Caso 1: No se proporcionan valores
        result = calculateForZeroValues(totalBonus, objective);
        tValue = result.t;
        explanation = "Se necesitan tres valores idénticos (t) para alcanzar el objetivo con las bonificaciones aplicadas.";
    } else if (count === 1) {
        // Caso 2: Se proporciona un valor
        const singleValue = providedValues[0];
        result = calculateForOneValue(singleValue, totalBonus, objective);
        tValue = result.t;
        explanation = `Con el valor proporcionado (${singleValue}), se necesitan dos valores idénticos (t) para alcanzar el objetivo con las bonificaciones aplicadas.`;
    } else if (count === 2) {
        // Caso 3: Se proporcionan dos valores
        const [val1, val2] = providedValues;
        result = calculateForTwoValues(val1, val2, totalBonus, objective);
        tValue = result.t;
        explanation = `Con los valores proporcionados (${val1}, ${val2}), se necesita un valor adicional (t) para alcanzar el objetivo con las bonificaciones aplicadas.`;
    } else {
        // Caso 4: Se proporcionan tres valores
        result = calculateForThreeValues(x, y, z, totalBonus, objective);
        tValue = "N/A (todos los valores proporcionados)";
        explanation = `Se han proporcionado los tres valores. Se calcula el resultado total con las bonificaciones aplicadas.`;
    }
    
    // Mostrar resultados
    tValueDisplay.textContent = tValue;
    tExplanationDisplay.textContent = explanation;
    
    // Calcular y mostrar total final
    const finalSum = count === 3 ? x + y + z : 
                    count === 2 ? providedValues[0] + providedValues[1] + result.t :
                    count === 1 ? providedValues[0] + result.t + result.t :
                    result.t + result.t + result.t;
    
    const finalTotal = applyBonuses(finalSum, totalBonus);
    const cappedTotal = capResult(finalTotal, finalSum);
    
    totalValueDisplay.textContent = formatNumber(cappedTotal);
    totalExplanationDisplay.innerHTML = `Suma base: ${formatNumber(finalSum)} + ${(totalBonus*100).toFixed(0)}% = ${formatNumber(finalTotal)} <span class="highlight">→ Ajustado a: ${formatNumber(cappedTotal)}</span>`;
});

// Función para parsear valores de entrada
function parseInput(value) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : Math.max(0, parsed);
}

// Función para aplicar bonificaciones
function applyBonuses(sum, bonus) {
    return Math.floor(sum * (1 + bonus));
}

// Función para limitar el resultado según las reglas del juego
function capResult(total, baseSum) {
    // Si la suma base es <= 999,999, el resultado se limita a 999,999
    if (baseSum <= 999999) {
        return Math.min(total, 999999);
    }
    // El resultado máximo permitido es 2,999,997
    return Math.min(total, 2999997);
}

// Función para calcular cuando no se proporcionan valores
function calculateForZeroValues(bonus, objective) {
    // Necesitamos: 3t * (1 + bonus) = objetivo (o el más cercano posible)
    // Pero con el límite de que si 3t <= 999,999, el resultado se limita a 999,999
    
    // Primero, calculamos t para alcanzar exactamente el objetivo
    let t = Math.floor(objective / (3 * (1 + bonus)));
    
    // Verificamos si con este t, la suma base (3t) es <= 999,999
    const baseSum = 3 * t;
    const totalWithBonus = applyBonuses(baseSum, bonus);
    const cappedTotal = capResult(totalWithBonus, baseSum);
    
    // Si no alcanzamos el objetivo, incrementamos t hasta encontrar el mejor valor
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

// Función para calcular cuando se proporciona un valor
function calculateForOneValue(value, bonus, objective) {
    // Necesitamos: (value + 2t) * (1 + bonus) = objetivo (o el más cercano posible)
    
    // Calculamos t para alcanzar exactamente el objetivo
    let t = Math.floor((objective / (1 + bonus) - value) / 2);
    
    // Verificamos el resultado con este t
    const baseSum = value + 2 * t;
    const totalWithBonus = applyBonuses(baseSum, bonus);
    const cappedTotal = capResult(totalWithBonus, baseSum);
    
    // Si no alcanzamos el objetivo, ajustamos t
    if (cappedTotal < objective) {
        // Probamos incrementando t hasta encontrar el mejor valor
        while (true) {
            const newT = t + 1;
            const newBaseSum = value + 2 * newT;
            const newTotalWithBonus = applyBonuses(newBaseSum, bonus);
            const newCappedTotal = capResult(newTotalWithBonus, newBaseSum);
            
            // Si nos pasamos del objetivo o el nuevo total es menor que el anterior, paramos
            if (newCappedTotal > objective || newCappedTotal < cappedTotal) {
                break;
            }
            
            t = newT;
            if (newCappedTotal === objective) {
                break;
            }
        }
    } else if (cappedTotal > objective) {
        // Si nos pasamos, reducimos t
        while (true) {
            const newT = t - 1;
            if (newT < 0) break;
            
            const newBaseSum = value + 2 * newT;
            const newTotalWithBonus = applyBonuses(newBaseSum, bonus);
            const newCappedTotal = capResult(newTotalWithBonus, newBaseSum);
            
            // Si estamos más cerca del objetivo con el nuevo t, lo usamos
            if (Math.abs(newCappedTotal - objective) < Math.abs(cappedTotal - objective) && newCappedTotal <= objective) {
                t = newT;
            } else {
                break;
            }
        }
    }
    
    return { t };
}

// Función para calcular cuando se proporcionan dos valores
function calculateForTwoValues(val1, val2, bonus, objective) {
    // Necesitamos: (val1 + val2 + t) * (1 + bonus) = objetivo (o el más cercano posible)
    
    // Calculamos t para alcanzar exactamente el objetivo
    let t = Math.floor(objective / (1 + bonus) - val1 - val2);
    
    // Verificamos el resultado con este t
    const baseSum = val1 + val2 + t;
    const totalWithBonus = applyBonuses(baseSum, bonus);
    const cappedTotal = capResult(totalWithBonus, baseSum);
    
    // Si no alcanzamos el objetivo, ajustamos t
    if (cappedTotal < objective) {
        // Probamos incrementando t hasta encontrar el mejor valor
        while (true) {
            const newT = t + 1;
            const newBaseSum = val1 + val2 + newT;
            const newTotalWithBonus = applyBonuses(newBaseSum, bonus);
            const newCappedTotal = capResult(newTotalWithBonus, newBaseSum);
            
            // Si nos pasamos del objetivo o el nuevo total es menor que el anterior, paramos
            if (newCappedTotal > objective || newCappedTotal < cappedTotal) {
                break;
            }
            
            t = newT;
            if (newCappedTotal === objective) {
                break;
            }
        }
    } else if (cappedTotal > objective) {
        // Si nos pasamos, reducimos t
        while (true) {
            const newT = t - 1;
            if (newT < 0) break;
            
            const newBaseSum = val1 + val2 + newT;
            const newTotalWithBonus = applyBonuses(newBaseSum, bonus);
            const newCappedTotal = capResult(newTotalWithBonus, newBaseSum);
            
            // Si estamos más cerca del objetivo con el nuevo t, lo usamos
            if (Math.abs(newCappedTotal - objective) < Math.abs(cappedTotal - objective) && newCappedTotal <= objective) {
                t = newT;
            } else {
                break;
            }
        }
    }
    
    return { t };
}

// Función para calcular cuando se proporcionan tres valores
function calculateForThreeValues(x, y, z, bonus, objective) {
    const baseSum = x + y + z;
    const totalWithBonus = applyBonuses(baseSum, bonus);
    const cappedTotal = capResult(totalWithBonus, baseSum);
    
    return { t: null, total: cappedTotal };
}

// Función para actualizar la visualización de valores de entrada y bonificaciones
function updateDisplay(x, y, z, totalBonus) {
    // Mostrar valores de entrada
    const xDisplay = x !== null ? x : "-";
    const yDisplay = y !== null ? y : "-";
    const zDisplay = z !== null ? z : "-";
    inputValuesDisplay.textContent = `X: ${xDisplay}, Y: ${yDisplay}, Z: ${zDisplay}`;
    
    // Mostrar bonificaciones
    const bonusPercent = (totalBonus * 100).toFixed(0);
    let bonusText = `${bonusPercent}% (`;
    
    if (guildBonusCheck.checked) {
        bonusText += `Gremio: ${guildBonusSlider.value}%, `;
    }
    
    if (festivalBonusCheck.checked) {
        bonusText += `Festival: 25%, `;
    }
    
    if (totemBonusCheck.checked) {
        bonusText += `Tótem: 20%, `;
    }
    
    // Eliminar la última coma y espacio
    if (bonusText.endsWith(", ")) {
        bonusText = bonusText.slice(0, -2);
    }
    
    bonusText += ")";
    bonusValuesDisplay.textContent = bonusText;
}

// Función para formatear números con separadores de miles
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Inicialización de la página
window.addEventListener('DOMContentLoaded', function() {
    // Calcular automáticamente al cargar la página
    calculateBtn.click();
});