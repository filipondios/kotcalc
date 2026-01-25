const I18N_STORAGE_KEY = 'kotcalc_language';
let i18nStrings = {};
let currentLanguage = 'en';

const getStoredLanguage = () => {
    try { return localStorage.getItem(I18N_STORAGE_KEY); } 
    catch { return null; }
};

const setStoredLanguage = (lang) => {
    localStorage.setItem(I18N_STORAGE_KEY, lang);
};

export const t = (key, vars = {}) => {
    const table = i18nStrings[key] || {};
    let text = table[currentLanguage] || table.en || '';
    if (!text) return key;
    return text.replace(/\{(\w+)\}/g, (match, token) =>
        Object.prototype.hasOwnProperty.call(vars, token) ? vars[token] : match
    );
};

const applyI18n = () => {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const attr = el.getAttribute('data-i18n-attr');
        const value = t(key);
        if (!value || value === key) return;
        if (attr) {
            el.setAttribute(attr, value);
        } else {
            el.textContent = value;
        }
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        const value = t(key);
        if (!value || value === key) return;
        el.innerHTML = value;
    });

    const title = t('page_title');
    if (title && title !== 'page_title') document.title = title;
    document.documentElement.setAttribute('lang', currentLanguage);
};

const loadI18nJSON = () => {
    return fetch('data/i18n.json')
        .then(r => r.ok ? r.json() : Promise.reject('no-i18n-json'))
        .then(data => {
            if (data && data.strings) i18nStrings = data.strings;
            if (data && data.default) currentLanguage = data.default;
        }).catch(() => { i18nStrings = {}; });
};

export const setLanguage = (lang, persist = true) => {
    currentLanguage = lang || currentLanguage;
    applyI18n();

    if (persist) setStoredLanguage(currentLanguage);
    const select = document.getElementById('language-select');
    if (select) select.value = currentLanguage;
    if (window.help && typeof window.help.setLanguage === 'function') {
        window.help.setLanguage(currentLanguage);
    }

    document.dispatchEvent(new CustomEvent('i18n:changed', {
        detail: { lang: currentLanguage }
    }));
};

export const initI18n = async () => {
    await loadI18nJSON();
    const storedLang = getStoredLanguage();
    if (storedLang) currentLanguage = storedLang;
    setLanguage(currentLanguage, false);

    const select = document.getElementById('language-select');
    if (select) {
        select.value = currentLanguage;
        select.addEventListener('change', (e) => {
            setLanguage(e.target.value, true);
        });
    }
};
