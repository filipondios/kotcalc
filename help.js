// language help system
let helpStrings = {};
let currentLang = 'en';

const HELP_TUPLES = [
    ['.input-section', 'gem_values'],
    ['.bonus-section', 'bonuses'],
    ['.objective-section', 'target_objective'],
    ['.results-section', 'results'],
    ['.result-input-values', 'result_input_values'],
    ['.result-applied-bonuses', 'result_applied_bonuses'],
    ['.result-required-values', 'result_required_values'],
    ['.result-bonus-amount', 'result_bonus_amount'],
    ['.result-total-with-bonuses', 'result_total_with_bonuses']];
const HELP_MAP = new Map(HELP_TUPLES.map(([selector, key]) => [key, selector]));


function loadHelpJSON() {
    return fetch('help.json')
        .then(r => r.ok ? r.json() : Promise.reject('no-help-json'))
        .then(data => {
            // Only set currentLang from JSON if it wasn't explicitly set in this script.
            if (data.default && (!currentLang || currentLang === 'auto')) currentLang = data.default;
            if (data.strings) helpStrings = data.strings;
        }) .catch(() => { helpStrings = {}; });
}

function getHelpText(trigger) {
    const key = trigger.getAttribute('data-help-key');
    return (key && helpStrings && helpStrings[key] && helpStrings[key][currentLang]) ?
        helpStrings[key][currentLang] : 
        trigger.getAttribute('data-help') || '';
}


document.addEventListener('DOMContentLoaded', function () {
    const triggers = document.querySelectorAll('.help-trigger');
    loadHelpJSON();

    // Expose a simple API to change language at runtime
    window.help = window.help || {};
    window.help.setLanguage = function (lang) { currentLang = lang; };
    window.help.getLanguage = function () { return currentLang; };

    triggers.forEach(trigger => {
        function createTooltip() {
            removeTooltip();
            const content = getHelpText(trigger);

            // Create overlay that blurs/dims the page
            const overlay = document.createElement('div');
            overlay.className = 'help-overlay';
            overlay.setAttribute('aria-hidden', 'true');
            document.body.appendChild(overlay);

            // Create tooltip
            const tip = document.createElement('div');
            tip.className = 'help-tooltip';
            tip.textContent = content;
            document.body.appendChild(tip);

            // Make sure the trigger remains interactive
            trigger._savedStyle = {
                position: trigger.style.position || '',
                zIndex: trigger.style.zIndex || ''
            };
            trigger.style.position = 'relative';
            trigger.style.zIndex = '10000';

            // Determine the section to exclude from blur
            const key = trigger.getAttribute('data-help-key');
            const mappedSelector = key ? HELP_MAP.get(key) : null;
            const section = document.querySelector(mappedSelector);
            
            if (section) {
                section.classList.add('help-focus');
                section._savedStyle = {
                    position: section.style.position || '',
                    zIndex: section.style.zIndex || ''
                };
            }

            trigger._helpSection = section || null;
            requestAnimationFrame(() => positionTooltip(trigger, tip));
            const id = 'help-tip-' + Math.random().toString(36).slice(2, 9);
            tip.id = id;
            trigger.setAttribute('aria-describedby', id);
            trigger._tip = tip;
            trigger._overlay = overlay;
        }

        function removeTooltip() {
            if (trigger._tip) {
                trigger.removeAttribute('aria-describedby');
                trigger._tip.remove();
                trigger._tip = null;
            }
      
            if (trigger._overlay) {
                trigger._overlay.remove();
                trigger._overlay = null;
            }
      
            // restore saved styles
            if (trigger._savedStyle) {
                trigger.style.position = trigger._savedStyle.position;
                trigger.style.zIndex = trigger._savedStyle.zIndex;
                trigger._savedStyle = null;
            }
            
            // remove blur classes and restore section styles
            const section = trigger._helpSection;
            if (section) {
                section.classList.remove('help-focus');
                if (section._savedStyle) {
                    section.style.position = section._savedStyle.position;
                    section.style.zIndex = section._savedStyle.zIndex;
                    section._savedStyle = null;
                }
                trigger._helpSection = null;
            }
        }

        function positionTooltip(trigger, tip) {
            const rect = trigger.getBoundingClientRect();
            const padding = 8;
            
            // Default position above the trigger
            let top = window.scrollY + rect.top - tip.offsetHeight - padding;
            let left = window.scrollX + rect.left + rect.width / 2 - tip.offsetWidth / 2;

            // If not enough space above, place below
            if (top < window.scrollY + 6) {
                top = window.scrollY + rect.bottom + padding;
            }

            // Keep inside viewport horizontally
            const maxLeft = window.scrollX + document.documentElement.clientWidth - tip.offsetWidth - 6;
            left = Math.max(window.scrollX + 6, Math.min(left, maxLeft));
            tip.style.top = top + 'px';
            tip.style.left = left + 'px';
        }

        // Events
        trigger.addEventListener('mouseenter', createTooltip);
        trigger.addEventListener('focus', createTooltip);
        trigger.addEventListener('mouseleave', removeTooltip);
        trigger.addEventListener('blur', removeTooltip);
    });

    // Remove tooltips and overlays on scroll/resize/click to avoid mispositioned tips
    ['scroll', 'resize', 'click'].forEach(ev => window.addEventListener(ev, () => {
        document.querySelectorAll('.help-tooltip').forEach(t => t.remove());
        document.querySelectorAll('.help-overlay').forEach(o => o.remove());
        document.querySelectorAll('.help-trigger').forEach(el => el.removeAttribute('aria-describedby'));
    }, true));
});