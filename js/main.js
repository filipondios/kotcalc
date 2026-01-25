import { initI18n } from './i18n.js';
import { initCalculator } from './calculator.js';

const initApp = async () => {
    await initI18n();
    initCalculator();
};

// start the app once DOM is loaded
window.addEventListener('DOMContentLoaded', initApp);
