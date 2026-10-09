const PROJECT_CASE_CONFIG = {
    "project-ai-userbot": {
        titleKey: "project-ai-userbot-case-title",
        textKey: "project-ai-userbot-case-text",
        hideGenericSections: false
    },
    "project-visitor-ai": {
        titleKey: "project-visitor-ai-case-title",
        textKey: "project-visitor-ai-case-text",
        hideGenericSections: false
    },
    "project-dekrov-qr": {
        titleKey: "project-dekrov-qr-case-title",
        textKey: "project-dekrov-qr-case-text",
        hideGenericSections: false
    },
    "project-ai-tools": {
        titleKey: "project-ai-tools-case-title",
        textKey: "project-ai-tools-case-text",
        hideGenericSections: false
    },
    "project-firefox-ghost-ui": {
        titleKey: "project-firefox-ghost-ui-case-title",
        textKey: "project-firefox-ghost-ui-case-text",
        hideGenericSections: false
    }
};

const PROJECT_CASE_FALLBACKS = {
    "project-ai-userbot": {
        "python": {
            title: "Project Application: Dekrov AI Userbot",
            text: "In Dekrov AI Userbot, Python is the orchestration layer for command parsing, memory, reminders, action routing, chat-bot support, and owner workflows. The value here is not just language familiarity but the ability to keep one Telegram-native system modular while it coordinates AI, automation, and runtime state in one process."
        },
        "pyrogram": {
            title: "Project Application: Dekrov AI Userbot",
            text: "Pyrogram is what makes the userbot side possible. Dekrov AI Userbot works through the owner's real Telegram account, so dialog access, media handling, cross-chat actions, and account-level automation all depend on a client library that exposes Telegram beyond the regular Bot API."
        },
        "groq": {
            title: "Project Application: Dekrov AI Userbot",
            text: "Groq is the inference layer behind dialogue, .b tasks, transcription, vision, and model fallback inside the userbot ecosystem. In this project, speed matters because the assistant is part of a live Telegram workflow where answers, tools, and action planning need to stay responsive."
        },
        "asyncio": {
            title: "Project Application: Dekrov AI Userbot",
            text: "Asyncio is the architectural backbone of Dekrov AI Userbot: reminders, live requests, background jobs, auto-replies, and command execution all coexist in one persistent runtime. The project uses asynchrony as a system design choice, not as a small implementation detail."
        },
        "httpx": {
            title: "Project Application: Dekrov AI Userbot",
            text: "HTTPX is the network layer for live tools, retrieval, and grounded answers inside Dekrov AI Userbot. Search, rates, weather, article fetching, and other external lookups all depend on a client that behaves predictably inside an async assistant pipeline."
        },
        "json-persistence": {
            title: "Project Application: Dekrov AI Userbot",
            text: "JSON persistence is part of why Dekrov AI Userbot stays portable: runtime state, owner knowledge, reminders, memory layers, and control settings can survive restarts without a separate database server. That tradeoff matches the product well because it keeps inspection, backup, and deployment straightforward."
        }
    },
    "project-visitor-ai": {
        "python": {
            title: "Project Application: Visitor AI Assistant",
            text: "In Visitor AI Assistant, Python holds together the public consultation flow: session lifecycle, moderation counters, drift detection, request drafting, and owner handoff all live in the same runtime. It is the layer that keeps the assistant helpful and structured instead of turning into a loose generic chatbot."
        },
        "aiogram": {
            title: "Project Application: Visitor AI Assistant",
            text: "Aiogram is the transport layer of the visitor assistant: consultation start buttons, callbacks, moderation actions, and public chat routing are all built around bot-first interaction patterns. That makes it a strong fit for a visitor product that must feel responsive while still preserving clear boundaries."
        },
        "groq": {
            title: "Project Application: Visitor AI Assistant",
            text: "In the visitor layer, Groq powers consultation replies, request drafting, and quality review of public-facing answers. Here the goal is not just raw generation, but fast and stable guidance during the first contact with a visitor."
        },
        "asyncio": {
            title: "Project Application: Visitor AI Assistant",
            text: "Visitor AI Assistant relies on asyncio for concurrent message handling, session updates, cooldowns, and moderation checks. That lets the public assistant stay responsive while still maintaining state and background logic in parallel."
        },
        "json-persistence": {
            title: "Project Application: Visitor AI Assistant",
            text: "For the visitor assistant, JSON persistence stores lightweight session state, moderation state, and review signals without introducing a heavy backend. It keeps the public layer simple to deploy while still letting consultations feel stateful and controlled."
        }
    },
    "project-dekrov-qr": {
        "frontend": {
            title: "Project Application: Dekrov QR",
            text: "Dekrov QR uses semantic HTML, responsive CSS, and vanilla JavaScript as one compact browser product. The interface adapts its fields to each QR format, validates input, renders a live canvas preview, and exports PNG or SVG files without a backend."
        }
    },
    "project-firefox-ghost-ui": {
        "frontend": {
            title: "Project Application: Firefox Ghost UI",
            text: "In Firefox Ghost UI, CSS is the primary engine for layout, transitions, and native browser chrome customization. It shapes the floating toolbar, tab hover behavior, and download island without requiring heavy extensions."
        }
    }
};

const SUPPORTED_LANGUAGES = ['en', 'uk', 'ru', 'it', 'de', 'fr', 'zh'];
const LANGUAGE_LABELS = {
    en: 'Choose language', uk: 'Обрати мову', ru: 'Выбрать язык',
    it: 'Scegli lingua', de: 'Sprache auswählen', fr: 'Choisir la langue', zh: '选择语言'
};
const translationCache = new Map();
let languageRequest = 0;
const LANGUAGE_ERROR_TEXT = {
    en: 'The selected language could not be loaded. Please reload or choose another language.',
    uk: 'Не вдалося завантажити вибрану мову. Перезавантажте сторінку або виберіть іншу мову.',
    ru: 'Не удалось загрузить выбранный язык. Перезагрузите страницу или выберите другой язык.',
    it: 'Impossibile caricare la lingua selezionata. Ricarica la pagina o scegli un’altra lingua.',
    de: 'Die gewählte Sprache konnte nicht geladen werden. Lade die Seite neu oder wähle eine andere Sprache.',
    fr: 'Impossible de charger la langue choisie. Rechargez la page ou choisissez une autre langue.',
    zh: '无法加载所选语言。请刷新页面或选择其他语言。'
};

function showLanguageError(lang) {
    let notice = document.getElementById('language-status');
    if (!notice) {
        notice = document.createElement('p');
        notice.id = 'language-status';
        notice.className = 'language-status';
        notice.setAttribute('role', 'status');
        document.querySelector('main')?.prepend(notice);
    }
    notice.textContent = LANGUAGE_ERROR_TEXT[lang] || LANGUAGE_ERROR_TEXT.en;
}

function preferredLanguage() {
    try {
        const saved = localStorage.getItem('lang');
        if (SUPPORTED_LANGUAGES.includes(saved)) return saved;
    } catch (_) { /* Language selection also works without browser storage. */ }
    return 'en';
}

function syncLanguageControl(lang) {
    const button = document.getElementById('lang-btn');
    const current = document.getElementById('lang-current');
    const options = document.querySelectorAll('.lang-option');
    if (current) current.textContent = lang === 'zh' ? '中文' : lang.toUpperCase();
    options.forEach(option => option.classList.toggle('is-active', option.dataset.value === lang));
    const name = [...options].find(option => option.dataset.value === lang)?.textContent;
    const visibleLabel = current?.textContent || lang.toUpperCase();
    button?.setAttribute('aria-label', `${visibleLabel}: ${LANGUAGE_LABELS[lang]} (${name || lang})`);
    button?.setAttribute('title', LANGUAGE_LABELS[lang]);
}

async function setLanguage(lang, updateUrl = true, persistSelection = true) {
    const request = ++languageRequest;
    const languageButton = document.getElementById('lang-btn');
    languageButton?.setAttribute('aria-busy', 'true');
    try {
        if (!SUPPORTED_LANGUAGES.includes(lang)) lang = 'en';
        const path = window.location.pathname;
        const normalizedPath = path.endsWith('/') ? `${path}index.html` : path;
        const segments = normalizedPath.split('/').filter(Boolean);
        const fileDepth = Math.max(0, segments.length - 1);
        const pathPrefix = fileDepth === 0 ? './' : '../'.repeat(fileDepth);
        const sharedScript = Array.from(document.scripts).find((script) => {
            if (!script.src) return false;
            return new URL(script.src, window.location.href).pathname.endsWith('/scripts.js');
        });
        const localesBaseUrl = sharedScript
            ? new URL('locales/', sharedScript.src)
            : new URL(`${pathPrefix}locales/`, window.location.href);
        const urlParams = new URLSearchParams(window.location.search);
        const techId = urlParams.get('id');
        const fromSource = urlParams.get('from');

        const backLink = document.getElementById('dynamic-back-link');
        let backLinkKey = 'back-to-home';
        if (backLink) {
            if (fromSource === 'project-ai-userbot') {
                backLink.href = "../AI.Userbot/project-ai-userbot.html#ai-stack";
                backLinkKey = 'back-to-Dekrov-AI-Userbot';
            } else if (fromSource === 'project-visitor-ai') {
                backLink.href = "../Visitor/project-visitor-ai.html#vis-stack";
                backLinkKey = 'back-to-Visitor-AI-Assistant';
            } else if (fromSource === 'project-dekrov-qr') {
                backLink.href = "../QR/project-dekrov-qr.html#qr-stack";
                backLinkKey = 'back-to-Dekrov-QR';
            } else if (fromSource === 'project-ai-tools') {
                backLink.href = "../AI.Tools/project-ai-tools.html#ait-stack";
                backLinkKey = 'back-to-AI-Dekrov';
            } else if (fromSource === 'project-firefox-ghost-ui') {
                backLink.href = "../Firefox.Ghost.UI/project-firefox-ghost-ui.html#gui-stack";
                backLinkKey = 'back-to-Firefox-Ghost-UI';
            } else {
                backLink.href = "../../index.html";
            }
            backLink.setAttribute('data-i18n', backLinkKey);
        }

        let translations = translationCache.get(lang);
        if (!translations) {
            const response = await fetch(new URL(`${lang}.json?v=20261009-water25`, localesBaseUrl));
            if (!response.ok) throw new Error('Translation file not found');
            translations = await response.json();
            translationCache.set(lang, translations);
        }
        if (request !== languageRequest) return;
        const technology = techId && Object.prototype.hasOwnProperty.call(translations, techId)
            && translations[techId] && typeof translations[techId] === 'object'
            && typeof translations[techId]['tech-page-title'] === 'string'
            ? translations[techId] : null;
        document.getElementById('language-status')?.remove();
        document.documentElement.lang = lang;
        syncLanguageControl(lang);
        if (updateUrl) {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('lang', lang);
            window.history.replaceState({}, '', newUrl.pathname + newUrl.search + newUrl.hash);
        }
        window.portfolioTranslations = translations;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            let text = "";
            if (technology) {
                const techTranslations = technology;
                const projectCaseConfig = PROJECT_CASE_CONFIG[fromSource];
                const fallbackGenericProjectTitle = techTranslations["full-sec-project-case-title"] || "";
                const fallbackGenericProjectText = techTranslations["full-sec-project-case-text"] || "";
                const localizedProjectTitle = projectCaseConfig ? techTranslations[projectCaseConfig.titleKey] : "";
                const localizedProjectText = projectCaseConfig ? techTranslations[projectCaseConfig.textKey] : "";
                const fallbackProjectCase = PROJECT_CASE_FALLBACKS[fromSource]?.[techId];
                const resolvedProjectTitle = localizedProjectTitle || fallbackProjectCase?.title || fallbackGenericProjectTitle;
                const resolvedProjectText = localizedProjectText || fallbackProjectCase?.text || fallbackGenericProjectText;
                const knownProjectSources = Object.keys(PROJECT_CASE_CONFIG);
                const isKnownProjectSource = knownProjectSources.includes(fromSource);
                const hasProjectCase = Boolean(
                    isKnownProjectSource && resolvedProjectTitle && resolvedProjectText
                );

                if (projectCaseConfig && projectCaseConfig.hideGenericSections) {
                    if (key === "full-sec-project-case-text") {
                        text = resolvedProjectText;
                        if (el.closest('article')) el.closest('article').style.display = hasProjectCase ? 'block' : 'none';
                    } else if (key === "full-sec-project-case-title") {
                        text = resolvedProjectTitle;
                        if (el.closest('article')) el.closest('article').style.display = hasProjectCase ? 'block' : 'none';
                    } else if (key.startsWith("full-sec-1") || key.startsWith("full-sec-2")) {
                        if (el.closest('article')) el.closest('article').style.display = 'none';
                    } else {
                        text = techTranslations[key] || translations[key];
                    }
                } else {
                    if (key === "full-sec-project-case-title") {
                        text = resolvedProjectTitle;
                        if (el.closest('article')) el.closest('article').style.display = hasProjectCase ? 'block' : 'none';
                    } else if (key === "full-sec-project-case-text") {
                        text = resolvedProjectText;
                        if (el.closest('article')) el.closest('article').style.display = hasProjectCase ? 'block' : 'none';
                    } else {
                        text = techTranslations[key] || translations[key];
                        if (key.includes("project-case") && el.closest('article')) {
                            el.closest('article').style.display = hasProjectCase ? 'block' : 'none';
                        } else if (el.closest('article')) {
                            el.closest('article').style.display = 'block';
                        }
                    }
                }
            } else {
                text = translations[key];
            }

            if (text) el.innerHTML = text;
        });

        document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria-label');
            const text = translations[key];
            if (text) {
                el.setAttribute('aria-label', text);
            }
        });

        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const text = translations[key];
            if (text) {
                el.setAttribute('title', text);
            }
        });

        document.querySelectorAll('[data-i18n-content]').forEach(el => {
            const key = el.getAttribute('data-i18n-content');
            const text = translations[key];
            if (text) {
                el.setAttribute('content', text);
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const text = translations[key];
            if (text) {
                el.setAttribute('placeholder', text);
            }
        });
        if (backLink) {
            const hasTechnology = Boolean(technology);
            document.querySelectorAll('.tech-page .architecture-grid, .tech-page .full-content').forEach(el => {
                el.style.display = hasTechnology ? '' : 'none';
            });
            if (!hasTechnology) {
                document.querySelector('[data-i18n="tech-page-title"]').textContent = translations['ui-tech-unavailable-title'];
                document.querySelector('[data-i18n="tech-main-desc"]').textContent = translations['ui-tech-unavailable-text'];
            }
        }

        if (persistSelection) {
            try { localStorage.setItem('lang', lang); } catch (_) { /* Selection works without storage. */ }
        }
        document.dispatchEvent(new CustomEvent('portfolio:translations-updated', {
            detail: { lang, translations }
        }));
    } catch (error) {
        if (request !== languageRequest) return;
        // A failed initial locale must not leave dynamic technology cards empty.
        if (!window.portfolioTranslations && lang !== 'en') {
            const fallbackRequest = languageRequest + 1;
            await setLanguage('en', false, false);
            if (languageRequest !== fallbackRequest) return;
        }
        const activeLanguage = document.documentElement.lang || 'en';
        syncLanguageControl(activeLanguage);
        if (!window.portfolioTranslations && document.getElementById('dynamic-back-link')) {
            document.querySelectorAll('.tech-page .architecture-grid, .tech-page .full-content').forEach(el => {
                el.style.display = 'none';
            });
        }
        showLanguageError(activeLanguage);
    } finally {
        if (request === languageRequest) languageButton?.removeAttribute('aria-busy');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const langBtn = document.getElementById('lang-btn');
    const langOptions = document.getElementById('lang-options');
    const savedLang = preferredLanguage();
    syncLanguageControl(savedLang);
    setLanguage(savedLang, false);
    if (langBtn && langOptions) {
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = langOptions.classList.toggle('is-open');
            langBtn.setAttribute('aria-expanded', isOpen.toString());
        });
        langOptions.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = option.getAttribute('data-value');
                langOptions.classList.remove('is-open');
                langBtn.setAttribute('aria-expanded', 'false');
                setLanguage(value);
                langBtn.focus();
            });
        });
        document.addEventListener('click', (e) => {
            if (!langBtn.contains(e.target) && !langOptions.contains(e.target)) {
                langOptions.classList.remove('is-open');
                langBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    const menuBtn = document.getElementById('menu-btn');
    const overlay = document.getElementById('menu-overlay');
    const navLinks = document.querySelectorAll('.mobile-nav a');
    const syncMenu = () => {
        if (!overlay) return;
        const open = overlay.classList.contains('active');
        overlay.inert = !open;
        overlay.setAttribute('aria-hidden', String(!open));
    };

    if (menuBtn && overlay) {
        menuBtn.addEventListener('click', () => {
            overlay.classList.toggle('active');
            menuBtn.classList.toggle('is-active');
            menuBtn.setAttribute('aria-expanded', String(overlay.classList.contains('active')));
            syncMenu();
            if (!overlay.inert) navLinks[0]?.focus();
        });
        document.addEventListener('click', (e) => {
            if (!overlay.contains(e.target) && !menuBtn.contains(e.target)) {
                overlay.classList.remove('active');
                menuBtn.classList.remove('is-active');
                menuBtn.setAttribute('aria-expanded', 'false');
                syncMenu();
            }
        });
        navLinks.forEach(link => link.addEventListener('click', () => {
            overlay.classList.remove('active');
            menuBtn.classList.remove('is-active');
                menuBtn.setAttribute('aria-expanded', 'false');
                syncMenu();
        }));
    }

    const readMoreBtn = document.getElementById('read-more-btn');
    const hideDetailsBtn = document.getElementById('hide-details-btn');
    const projectDetails = document.getElementById('project-details');
    const scrollBehavior = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const expandProjectDetails = () => {
        if (!projectDetails) return;
        projectDetails.classList.add('expanded');
        projectDetails.inert = false;
        projectDetails.setAttribute('aria-hidden', 'false');
        readMoreBtn?.setAttribute('aria-expanded', 'true');
        if (readMoreBtn?.parentElement) readMoreBtn.parentElement.style.display = 'none';
    };
    const scrollToHashSection = () => {
        if (!projectDetails || !window.location.hash) return;
        let id;
        try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (_) { return; }
        const target = document.getElementById(id);
        if (!target || !projectDetails.contains(target)) return;
        expandProjectDetails();
        requestAnimationFrame(() => target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }));
    };
    readMoreBtn?.addEventListener('click', () => {
        if (!projectDetails) return;
        expandProjectDetails();
        projectDetails.focus({ preventScroll: true });
        requestAnimationFrame(() => projectDetails.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }));
    });
    hideDetailsBtn?.addEventListener('click', () => {
        if (!projectDetails) return;
        projectDetails.classList.remove('expanded');
        projectDetails.inert = true;
        projectDetails.setAttribute('aria-hidden', 'true');
        readMoreBtn?.setAttribute('aria-expanded', 'false');
        if (readMoreBtn?.parentElement) {
            readMoreBtn.parentElement.style.display = 'flex';
            readMoreBtn.focus({ preventScroll: true });
            readMoreBtn.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
        }
    });
    scrollToHashSection();
    window.addEventListener('hashchange', scrollToHashSection);

    const sections = document.querySelectorAll('.details-content section, .case-result[id]');
    const navLinksList = document.querySelectorAll('.toc a, .mobile-toc a');

    if (sections.length > 0 && navLinksList.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '-40% 0px -50% 0px',
            threshold: 0
        };

        const observerCallback = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');

                    navLinksList.forEach(link => {
                        link.classList.remove('active', 'is-next', 'is-prev');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                            if (link.classList.contains('toc-item')) {
                                link.parentElement.scrollTo({
                                    left: link.offsetLeft - (link.parentElement.offsetWidth / 2) + (link.offsetWidth / 2),
                                    behavior: scrollBehavior()
                                });
                            }
                        }
                    });
                    const sectionsArray = Array.from(sections);
                    const currentIndex = sectionsArray.findIndex(s => s.id === id);
                    if (currentIndex > 0) {
                        const prevSection = sectionsArray[currentIndex - 1];
                        const prevId = prevSection.id;
                        navLinksList.forEach(link => {
                            if (link.getAttribute('href') === `#${prevId}`) {
                                link.classList.add('is-prev');
                            }
                        });
                    }
                    if (currentIndex >= 0 && currentIndex < sectionsArray.length - 1) {
                        const nextSection = sectionsArray[currentIndex + 1];
                        const nextId = nextSection.id;
                        navLinksList.forEach(link => {
                            if (link.getAttribute('href') === `#${nextId}`) {
                                link.classList.add('is-next');
                            }
                        });
                    }
                }
            });
        };


        const observer = new IntersectionObserver(observerCallback, observerOptions);
        sections.forEach(section => observer.observe(section));
    }


});

function updateReadMoreButtonText(lang) {
    const readMoreBtn = document.getElementById('read-more-btn');
    if (readMoreBtn) {
        setLanguage(lang);
    }
}

// Accessible dismissal for the existing navigation and language menus.
document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const menu = document.getElementById('menu-overlay');
    const menuButton = document.getElementById('menu-btn');
    if (menu?.classList.contains('active')) {
        menu.classList.remove('active'); menu.inert = true; menu.setAttribute('aria-hidden', 'true'); menuButton?.classList.remove('is-active');
        menuButton?.setAttribute('aria-expanded', 'false'); menuButton?.focus();
    }
    const languages = document.getElementById('lang-options');
    const languageButton = document.getElementById('lang-btn');
    if (languages?.classList.contains('is-open')) {
        languages.classList.remove('is-open');
        languageButton?.setAttribute('aria-expanded', 'false');
        languageButton?.focus();
    }
});
