import { getContext, extension_settings } from '../../../extensions.js';
import { eventSource, event_types, saveChatDebounced, saveSettingsDebounced, setExtensionPrompt, extension_prompt_roles, characters } from '../../../../script.js';

const MODULE_NAME = 'dual_model_thoughts';
const DMT_PROMPT_KEY = 'dmt_thought_injection';

/* ============================================================
   LOCALIZATION (RU / EN)
   Every visible string + the default thought prompt (incl. its
   output language) switches with dmtSettings.language.
   ============================================================ */
const I18N = {
    en: {
        ui_header: "Dual-Model Thoughts",
        ui_enable: "Enable thought generation",
        ui_language: "Interface language",
        ui_api: "🔌 API Connection (OpenRouter / Custom)",
        ui_url: "URL API:",
        ui_key: "API Key:",
        ui_show_hide: "Show / hide",
        ui_model: "Model name:",
        ui_temp: "Temperature:",
        ui_prompt_h: "Thought prompt",
        ui_prompt_ph: "Enter the system prompt...",
        ui_reset_prompt: "Default",
        ui_prompt_tip: "Tip: use {{char}} — it is automatically replaced with the character's name.",
        ui_gen: "⚙️ Generation & Context",
        ui_inject: "Use thoughts in the main conversation (Inject)",
        ui_inject_title: "If enabled, thoughts are added to the system prompt before the bot replies.",
        ui_inject_count: "How many recent thoughts:",
        ui_context_msgs: "Messages to analyze:",
        loading: "Forming a thought",
        regen_title: "Regenerate the thought",
        err_prefix: "API error: {msg}",
        err_no_key: "API key is not set!",
        err_rate: "Rate limit (429). Please try again later.",
        err_empty: "The model returned an empty response.",
        ui_thoughts: "Thoughts",
        ui_mode: "Mode for characters without their own preset:",
        mode_normal: "Ordinary thoughts",
        mode_hidden: "Hidden side",
        mode_global: "By the settings",
        ui_prompt_normal: "Prompt — ordinary thoughts",
        ui_prompt_hidden: "Prompt — hidden side",
        ui_prompt_hidden_tip: "Used by the \"Hidden side\" mode. The character's own rules (below) are added after it.",
        ui_char: "Character",
        ui_char_none: "Open a chat with a character to set their thoughts.",
        ui_char_member: "Group member:",
        ui_char_mode: "Thoughts for this character:",
        ui_rules: "Inner rules",
        ui_rules_ph: "For example:\n- strict and correct in class; in his head — far from it\n- kind and gentle to everyone; inside, he can't stand most people",
        ui_rules_tip: "Saved for this character in every chat. Used by the \"Hidden side\" mode.",
        ui_scan: "Read the card",
        ui_scan_title: "The model reads the card once and writes the rules — you can edit them after",
        ui_scan_busy: "Reading the card…",
        ui_scan_done: "Rules written from the card.",
        ui_scan_fail: "Could not read the card: {msg}",
        ui_scan_nocard: "This character has no card text to read.",
        ui_clear: "Clear",
        ui_saved: "saved",
        ui_look: "Look",
        ui_style: "Bubble style:",
        style_classic: "Classic violet",
        style_paper: "Paper note",
        style_manga: "Manga",
        style_rose: "Rose",
        style_night: "Night",
        ui_preview: "I wonder if they noticed my hands shaking.",
        hidden_prompt: `You are the hidden inner voice of "{{char}}" — what {{char}} really thinks behind the face they show.
Task: write {{char}}'s inner thought right now, based on the conversation history.
Rules:
1. You ARE {{char}}. Write strictly in the FIRST PERSON ("I..."). Never describe {{char}} from the outside.
2. Show the gap between the outside and the inside: what {{char}} hides, wants, fears or secretly enjoys that their words and manner do not show. The hidden side grows out of who {{char}} is — it never turns them into someone else.
3. When the character's inner rules are given below, follow them.
4. DO NOT use action markers (asterisks *). DO NOT output spoken dialogue.
5. Keep it brief (1-3 sentences), vivid and tied to this exact moment.
6. Write in English.`,
        scan_prompt: `You read a roleplay character card and describe the character's inner life for a writer of their inner monologue — the side the character does not show.
Write 3-6 short lines, each one a rule the inner voice follows. For example: the contrast between how they act and what they really think; what they secretly want or fear; how their inner voice sounds (dry, tender, crude, anxious, petty, dreamy); little private habits of thought.
Base everything on the card. Where the card says nothing, infer what fits the character — never contradict the card.
If the card describes a whole world or several people rather than one person, write the rules for the person it centres on, or one short line for each important character, starting with their name.
No preamble, no headings: only the lines, each starting with "- ".
Write in English.`,
        default_prompt: `You are the internal consciousness of the character "{{char}}".
Task: Write {{char}}'s current internal monologue based on the conversation history.
Rules:
1. You ARE {{char}}. Write strictly in the FIRST PERSON ("I wonder if...", "I feel..."). Do NOT describe {{char}} from a third-person perspective.
2. DO NOT use action markers like asterisks (*).
3. DO NOT output spoken dialogue.
4. Keep it brief (1-3 sentences) and highly emotional/analytical.
5. Write in English.`
    },
    ru: {
        ui_header: "Dual-Model Thoughts (Мысли)",
        ui_enable: "Включить генерацию мыслей",
        ui_language: "Язык интерфейса",
        ui_api: "🔌 Подключение API (OpenRouter / свой)",
        ui_url: "URL API:",
        ui_key: "API-ключ:",
        ui_show_hide: "Показать / скрыть",
        ui_model: "Название модели:",
        ui_temp: "Температура:",
        ui_prompt_h: "Промпт для мыслей",
        ui_prompt_ph: "Введите системный промпт...",
        ui_reset_prompt: "По умолчанию",
        ui_prompt_tip: "Подсказка: используй {{char}} — автоматически заменяется на имя персонажа.",
        ui_gen: "⚙️ Генерация и контекст",
        ui_inject: "Использовать мысли в основном диалоге (инъекция)",
        ui_inject_title: "Если включено, мысли добавляются в системный промпт перед ответом бота.",
        ui_inject_count: "Сколько последних мыслей:",
        ui_context_msgs: "Сообщений для анализа:",
        loading: "Формирую мысль",
        regen_title: "Перегенерировать мысль",
        err_prefix: "Ошибка API: {msg}",
        err_no_key: "API-ключ не указан!",
        err_rate: "Лимит запросов (429). Попробуйте позже.",
        err_empty: "Модель вернула пустой ответ.",
        ui_thoughts: "Мысли",
        ui_mode: "Режим для персонажей без своего пресета:",
        mode_normal: "Обычные мысли",
        mode_hidden: "Скрытая сторона",
        mode_global: "По настройкам",
        ui_prompt_normal: "Промпт — обычные мысли",
        ui_prompt_hidden: "Промпт — скрытая сторона",
        ui_prompt_hidden_tip: "Для режима «Скрытая сторона». Правила персонажа (ниже) добавляются после него.",
        ui_char: "Персонаж",
        ui_char_none: "Открой чат с персонажем, чтобы настроить его мысли.",
        ui_char_member: "Участник группы:",
        ui_char_mode: "Мысли этого персонажа:",
        ui_rules: "Внутренние правила",
        ui_rules_ph: "Например:\n- на уроках строгий и правильный; в голове — совсем не то\n- со всеми добрый и мягкий; внутри терпеть не может почти никого",
        ui_rules_tip: "Хранятся для этого персонажа во всех чатах. Работают в режиме «Скрытая сторона».",
        ui_scan: "Прочитать карточку",
        ui_scan_title: "Модель один раз читает карточку и пишет правила — потом их можно поправить",
        ui_scan_busy: "Читаю карточку…",
        ui_scan_done: "Правила написаны по карточке.",
        ui_scan_fail: "Не получилось прочитать карточку: {msg}",
        ui_scan_nocard: "У этого персонажа нет текста карточки.",
        ui_clear: "Очистить",
        ui_saved: "сохранено",
        ui_look: "Вид",
        ui_style: "Стиль пузыря:",
        style_classic: "Классика (фиолетовый)",
        style_paper: "Бумажная записка",
        style_manga: "Манга",
        style_rose: "Розовый",
        style_night: "Ночной",
        ui_preview: "Интересно, заметили ли они, как дрожат мои руки.",
        hidden_prompt: `Ты — скрытый внутренний голос персонажа "{{char}}": то, что {{char}} думает на самом деле, за лицом, которое показывает.
Задача: напиши мысль {{char}} прямо сейчас, по истории диалога.
Правила:
1. Ты И ЕСТЬ {{char}}. Пиши строго ОТ ПЕРВОГО ЛИЦА ("Я..."). Никогда не описывай {{char}} со стороны.
2. Покажи разницу между внешним и внутренним: что {{char}} скрывает, хочет, боится или втайне любит — то, чего не видно по словам и манерам. Скрытая сторона вырастает из того, кто {{char}} есть, и не превращает его в другого человека.
3. Если ниже даны внутренние правила персонажа — следуй им.
4. НЕ используй маркеры действий (звёздочки *). НЕ выводи произносимую речь.
5. Кратко (1-3 предложения), живо и про этот самый момент.
6. Пиши на русском языке.`,
        scan_prompt: `Ты читаешь карточку ролевого персонажа и описываешь его внутреннюю жизнь для автора его внутреннего монолога — ту сторону, которую персонаж не показывает.
Напиши 3-6 коротких строк, каждая — правило, которому следует внутренний голос. Например: контраст между тем, как он себя ведёт, и тем, что думает на самом деле; что он втайне хочет или чего боится; как звучит его внутренний голос (сухо, нежно, грубо, тревожно, мелочно, мечтательно); маленькие привычки мыслей.
Опирайся на карточку. Где карточка молчит — додумай то, что подходит персонажу, но никогда не противоречь карточке.
Если карточка описывает целый мир или нескольких людей, а не одного человека, напиши правила для того, вокруг кого она построена, или по одной короткой строке на каждого важного персонажа, начиная с его имени.
Без вступлений и заголовков: только строки, каждая начинается с "- ".
Пиши на русском языке.`,
        default_prompt: `Ты — внутреннее сознание персонажа "{{char}}".
Задача: напиши текущий внутренний монолог {{char}} на основе истории диалога.
Правила:
1. Ты И ЕСТЬ {{char}}. Пиши строго ОТ ПЕРВОГО ЛИЦА ("Интересно...", "Я чувствую..."). НЕ описывай {{char}} со стороны.
2. НЕ используй маркеры действий (звёздочки *).
3. НЕ выводи произносимую речь.
4. Кратко (1-3 предложения), очень эмоционально/аналитично.
5. Пиши на русском языке.`
    }
};

let dmtSettings = {};
function langObj() { return I18N[dmtSettings.language] || I18N.en; }
function t(key, vars) {
    let str = langObj()[key];
    if (str === undefined) str = I18N.en[key];
    if (str === undefined) str = key;
    if (typeof str === 'string' && vars) {
        for (const k in vars) str = str.split(`{${k}}`).join(vars[k]);
    }
    return str;
}
function isDefaultPrompt(p) {
    return p === I18N.en.default_prompt || p === I18N.ru.default_prompt;
}
function isDefaultHidden(p) {
    return p === I18N.en.hidden_prompt || p === I18N.ru.hidden_prompt;
}
const STYLES = ['classic', 'paper', 'manga', 'rose', 'night'];

// The thought is a FULL model response and the char name comes from a downloaded card —
// neither may ever hit innerHTML raw (a steered model could emit <img onerror=...>).
function escapeHtml(x) {
    return String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const bubblesMap = new Map();
let dmtLayer = null;

function initDmtLayer() {
    if (!document.getElementById('dmt-bubbles-layer')) {
        dmtLayer = document.createElement('div');
        dmtLayer.id = 'dmt-bubbles-layer';
        document.body.appendChild(dmtLayer);
    } else {
        dmtLayer = document.getElementById('dmt-bubbles-layer');
    }
}

/* Called on every scroll tick, every resize and every DOM change inside #chat — which
   during streaming is every token. Three things made that expensive:

     · reading a rect and then writing a style, per bubble, in one loop: each write
       invalidates the layout the next read needs, so the browser recomputes it from
       scratch for every single bubble;
     · no coalescing: a burst of twenty mutations ran the whole pass twenty times;
     · an observer watching attributes across the whole subtree, so any hover or class
       toggle anywhere in the chat triggered a full reposition.

   Reads are now done first, writes second, and the whole thing runs at most once per
   frame. */
let syncQueued = false;
function syncBubbles() {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(() => { syncQueued = false; syncBubblesNow(); });
}

function syncBubblesNow() {
    if (!dmtSettings.enabled || !dmtLayer) return;
    if (!bubblesMap.size) return;

    // pass one: measure everything, touch nothing
    const plan = [];
    for (const [messageId, data] of bubblesMap.entries()) {
        const { bubble, messageElement } = data;
        if (!document.body.contains(messageElement)) {
            plan.push({ bubble, messageId, drop: true });
            continue;
        }
        plan.push({ bubble, messageId, rect: messageElement.getBoundingClientRect(), hidden: messageElement.offsetParent === null });
    }

    // pass two: write, never measuring again
    const vh = window.innerHeight;
    for (const item of plan) {
        const { bubble } = item;
        if (item.drop) {
            bubble.remove();
            bubblesMap.delete(item.messageId);
            continue;
        }
        const rect = item.rect;

        // A message that has been folded away — a collapsed Doors arc, or anything else
        // that sets display:none — has no box at all: every coordinate comes back zero.
        // The bubble was then placed at top:0 left:50 and flew to the corner of the
        // screen instead of disappearing with the message it belongs to.
        const anchorHidden = (rect.width === 0 && rect.height === 0) || item.hidden;
        if (anchorHidden) {
            bubble.style.opacity = '0';
            bubble.style.pointerEvents = 'none';
            bubble.style.visibility = 'hidden';   // must not sit invisibly over the chat
            continue;
        }
        bubble.style.visibility = '';

        bubble.style.top = rect.top + 'px';

        if (rect.left < 250) {
            bubble.classList.add('mobile-fallback');
            bubble.style.left = (rect.left + 50) + 'px';
        } else {
            bubble.classList.remove('mobile-fallback');
            bubble.style.left = rect.left + 'px';
        }

        if (rect.bottom < 0 || rect.top > vh) {
            bubble.style.opacity = '0';
            bubble.style.pointerEvents = 'none';
        } else {
            bubble.style.opacity = '1';
            bubble.style.pointerEvents = 'auto';
        }
    }
}

function buildSettingsHtml() {
    // open groups in frames, with an emoji each — as RPG Map, Character Lens and Living Scene have them
    const sub = (title, body, extra = '') => `
            <div class="dmt-sub"${extra}>
                <div class="dmt-subhead">${title}</div>${body}
            </div>`;
    const opt = (v, key) => `<option value="${v}">${t(key)}</option>`;
    return `
<div class="extension_settings dual-model-thoughts-settings">
    <div class="inline-drawer">
        <div class="dmt-drawer-toggle inline-drawer-header" style="cursor: pointer;">
            <b><i class="fa-solid fa-brain"></i> ${t('ui_header')}</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="dmt-drawer-content" style="display: none; padding-top: 6px;">
            <div class="dmt-top">
                <label class="checkbox_label"><input type="checkbox" id="dmt-enabled"> ${t('ui_enable')}</label>
                <select id="dmt-language" class="text_pole" title="${escapeHtml(t('ui_language'))}" aria-label="${escapeHtml(t('ui_language'))}">
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                </select>
            </div>
            ${sub(t('ui_api'), `
                <div class="dmt-row"><label for="dmt-base-url">${t('ui_url')}</label><input type="text" id="dmt-base-url" class="text_pole" placeholder="https://openrouter.ai/api/v1"></div>
                <div class="dmt-row"><label for="dmt-api-key">${t('ui_key')}</label><input type="password" id="dmt-api-key" class="text_pole" placeholder="sk-or-v1-..."><div class="menu_button dmt-icon" id="dmt-toggle-api-key" title="${t('ui_show_hide')}"><i class="fa-solid fa-eye"></i></div></div>
                <div class="dmt-row"><label for="dmt-model">${t('ui_model')}</label><input type="text" id="dmt-model" class="text_pole" placeholder="google/gemma-4-31b-it"></div>
                <div class="dmt-row"><label for="dmt-temperature">${t('ui_temp')}</label><input type="range" id="dmt-temperature" min="0" max="2" step="0.1"><span id="dmt-temp-val" class="dmt-val"></span></div>`)}
            ${sub(`💭 ${t('ui_thoughts')}`, `
                <div class="dmt-row dmt-stack"><label for="dmt-mode">${t('ui_mode')}</label><select id="dmt-mode" class="text_pole">${opt('normal', 'mode_normal')}${opt('hidden', 'mode_hidden')}</select></div>
                <div class="dmt-row"><label for="dmt-context-messages">${t('ui_context_msgs')}</label><input type="number" id="dmt-context-messages" class="text_pole dmt-num" min="2" max="30" value="10"></div>
                <details class="dmt-details">
                    <summary><i class="fa-solid fa-pen-nib"></i> ${t('ui_prompt_normal')}</summary>
                    <textarea id="dmt-system-prompt" class="text_pole" rows="6" placeholder="${t('ui_prompt_ph')}"></textarea>
                    <div class="dmt-line"><div class="menu_button" id="dmt-reset-prompt"><i class="fa-solid fa-rotate-left"></i> ${t('ui_reset_prompt')}</div><small>${t('ui_prompt_tip')}</small></div>
                </details>
                <details class="dmt-details">
                    <summary><i class="fa-solid fa-mask"></i> ${t('ui_prompt_hidden')}</summary>
                    <textarea id="dmt-hidden-prompt" class="text_pole" rows="8" placeholder="${t('ui_prompt_ph')}"></textarea>
                    <div class="dmt-line"><div class="menu_button" id="dmt-reset-hidden"><i class="fa-solid fa-rotate-left"></i> ${t('ui_reset_prompt')}</div><small>${t('ui_prompt_hidden_tip')}</small></div>
                </details>`)}
            ${sub(`🎭 ${t('ui_char')}`, `<div id="dmt-char-box"></div>`)}
            ${sub(`🎨 ${t('ui_look')}`, `
                <div class="dmt-row"><label for="dmt-style">${t('ui_style')}</label><select id="dmt-style" class="text_pole">${STYLES.map(k => opt(k, 'style_' + k)).join('')}</select></div>
                <div class="dmt-preview-wrap"><div class="dmt-preview" id="dmt-preview" data-style="classic"><div class="rpg-thought-header"><span><i class="fa-solid fa-brain"></i> ${escapeHtml(t('ui_char'))}</span></div><div class="rpg-thought-text">${escapeHtml(t('ui_preview'))}</div></div></div>`)}
            ${sub(t('ui_gen'), `
                <label class="checkbox_label" title="${t('ui_inject_title')}"><input type="checkbox" id="dmt-inject-context"> ${t('ui_inject')}</label>
                <div class="dmt-row dmt-in" id="dmt-inject-count-row" style="display: none;"><label for="dmt-inject-count">${t('ui_inject_count')}</label><input type="number" id="dmt-inject-count" class="text_pole dmt-num" min="1" max="10" value="2"></div>`)}
        </div>
    </div>
</div>
`;
}

// the character frame: whose thoughts are set here, their mode and their inner rules
let charPick = '';
function charChoices() {
    const ctx = getContext();
    const members = groupMembersAvatars().map(a => characters.find(c => c && c.avatar === a)).filter(Boolean);
    if (members.length) return members;
    const own = ctx.characterId !== undefined ? characters[ctx.characterId] : null;
    return own ? [own] : [];
}
function renderCharBox() {
    const box = document.getElementById('dmt-char-box');
    if (!box) return;
    const list = charChoices();
    if (!list.length) { box.innerHTML = `<small class="dmt-hint">${t('ui_char_none')}</small>`; return; }
    if (!list.some(c => c.avatar === charPick)) charPick = list[0].avatar;
    const ch = list.find(c => c.avatar === charPick);
    const p = profileOf(ch.avatar) || {};
    const opt = (v, key) => `<option value="${v}"${(p.mode || 'global') === v ? ' selected' : ''}>${t(key)}${v === 'global' ? ` (${t(dmtSettings.mode === 'hidden' ? 'mode_hidden' : 'mode_normal').toLowerCase()})` : ''}</option>`;
    box.innerHTML = `
        ${list.length > 1 ? `<div class="dmt-row dmt-stack"><label for="dmt-char-pick">${t('ui_char_member')}</label><select id="dmt-char-pick" class="text_pole">${list.map(c => `<option value="${escapeHtml(c.avatar)}"${c.avatar === ch.avatar ? ' selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}</select></div>` : ''}
        <div class="dmt-who"><img src="/thumbnail?type=avatar&file=${encodeURIComponent(ch.avatar)}" alt="" loading="lazy"><b>${escapeHtml(ch.name)}</b></div>
        <div class="dmt-row dmt-stack"><label for="dmt-char-mode">${t('ui_char_mode')}</label><select id="dmt-char-mode" class="text_pole">${opt('global', 'mode_global')}${opt('normal', 'mode_normal')}${opt('hidden', 'mode_hidden')}</select></div>
        <div class="dmt-rules-head"><span>${t('ui_rules')}</span><span class="dmt-saved" id="dmt-rules-saved">${t('ui_saved')}</span></div>
        <textarea id="dmt-rules" class="text_pole" rows="5" placeholder="${escapeHtml(t('ui_rules_ph'))}">${escapeHtml(p.rules || '')}</textarea>
        <div class="dmt-line">
            <div class="menu_button" id="dmt-scan" title="${escapeHtml(t('ui_scan_title'))}"><i class="fa-solid fa-wand-magic-sparkles"></i> ${t('ui_scan')}</div>
            <div class="menu_button" id="dmt-rules-clear"><i class="fa-solid fa-eraser"></i> ${t('ui_clear')}</div>
        </div>
        <small class="dmt-hint" id="dmt-scan-note">${t('ui_rules_tip')}</small>`;
    const av = ch.avatar;
    const put = (patch) => {
        const cur = Object.assign({}, profileOf(av) || {}, patch, { at: Date.now() });
        if ((!cur.mode || cur.mode === 'global') && !String(cur.rules || '').trim()) delete dmtSettings.profiles[av];
        else dmtSettings.profiles[av] = cur;
        saveSettings();
    };
    const savedFlash = () => { const el = document.getElementById('dmt-rules-saved'); if (!el) return; el.classList.add('on'); clearTimeout(savedFlash.t); savedFlash.t = setTimeout(() => el.classList.remove('on'), 1200); };
    $('#dmt-char-pick').on('change', function () { charPick = this.value; renderCharBox(); });
    $('#dmt-char-mode').on('change', function () { put({ mode: this.value }); savedFlash(); });
    $('#dmt-rules').on('input', function () { put({ rules: String(this.value).slice(0, 2000) }); savedFlash(); });
    $('#dmt-rules-clear').on('click', () => { put({ rules: '' }); $('#dmt-rules').val(''); savedFlash(); });
    $('#dmt-scan').on('click', async function () {
        if (scanBusy.has(av)) return;
        const note = $('#dmt-scan-note');
        scanBusy.add(av);
        $(this).addClass('disabled');
        note.text(t('ui_scan_busy'));
        try {
            const rules = await scanCard(av);
            put({ rules, mode: (profileOf(av) || {}).mode && (profileOf(av) || {}).mode !== 'global' ? profileOf(av).mode : 'hidden' });
            if (charPick === av) { renderCharBox(); $('#dmt-scan-note').text(t('ui_scan_done')); }
        } catch (e) {
            console.warn('[DMT] card scan', e);
            if (charPick === av) $('#dmt-scan-note').text(t('ui_scan_fail', { msg: e.message || String(e) }));
        } finally {
            scanBusy.delete(av);
            $('#dmt-scan').removeClass('disabled');
        }
    });
}
// the bubbles already on screen take the new look at once
function applyBubbleStyle() {
    const st = dmtSettings.bubbleStyle;
    document.querySelectorAll('.rpg-thought-bubble').forEach(b => { b.dataset.style = st; });
    const pv = document.getElementById('dmt-preview');
    if (pv) pv.dataset.style = st;
}

function loadSettings() {
    if (!extension_settings[MODULE_NAME]) extension_settings[MODULE_NAME] = {};
    const defaults = {
        enabled: false,
        language: 'en',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: '',
        model: 'google/gemma-4-31b-it',
        temperature: 0.8,
        systemPrompt: '',
        contextMessages: 10, injectContext: false, injectCount: 2,
        mode: 'normal',          // the mode of a character with no preset of their own: 'normal' | 'hidden'
        hiddenPrompt: '',        // the prompt of the "hidden side" mode (the ordinary one is systemPrompt, as before)
        bubbleStyle: 'classic',
        profiles: {}             // per character (by card file): { mode: 'global'|'normal'|'hidden', rules, at }
    };
    dmtSettings = Object.assign({}, defaults, extension_settings[MODULE_NAME]);
    if (!Number.isFinite(dmtSettings.contextMessages)) dmtSettings.contextMessages = defaults.contextMessages;
    if (!Number.isFinite(dmtSettings.injectCount)) dmtSettings.injectCount = defaults.injectCount;

    // Seed the default prompt (in the chosen language) only if none is saved.
    // NOTE: we do NOT auto-overwrite a user's custom prompt — the old
    // "FIRST PERSON" heuristic broke localization and clobbered edits.
    if (!dmtSettings.systemPrompt) dmtSettings.systemPrompt = t('default_prompt');
    if (!dmtSettings.hiddenPrompt) dmtSettings.hiddenPrompt = t('hidden_prompt');
    if (!['normal', 'hidden'].includes(dmtSettings.mode)) dmtSettings.mode = 'normal';
    if (!STYLES.includes(dmtSettings.bubbleStyle)) dmtSettings.bubbleStyle = 'classic';
    if (!dmtSettings.profiles || typeof dmtSettings.profiles !== 'object' || Array.isArray(dmtSettings.profiles)) dmtSettings.profiles = {};
}

function saveSettings() {
    extension_settings[MODULE_NAME] = dmtSettings;
    saveSettingsDebounced();
}

/* ------------------------------------------------------------
   ENDPOINT HANDLING — reaching the server only. Nothing about the thought
   prompt, the second model's behaviour or the rendering changes here.
   1. An empty key falls back to Tavern RPG Engine's. An address YOU typed always
      wins: borrowing takes only what is missing, never the URL. A local backend
      needs no key, so a placeholder is used rather than a borrowed one.
   2. OpenAI-style backends live under /v1; without it LM Studio and KoboldCpp
      reject the path outright.
   There is no response_format anywhere in this module, so nothing needs gating
   for local backends — that is why the usual third helper is absent.
   ------------------------------------------------------------ */
const KEY_SOURCES = ['tavern_rpg_engine'];
function normalizeBase(url) {
    let u = String(url || '').trim().replace(/\s+/g, '');
    if (!u) return u;
    u = u.replace(/\/+$/, '');
    u = u.replace(/\/(chat\/completions|completions|images|images\/generations|embeddings)$/i, '');
    if (!/\/v\d+($|\/)/i.test(u)) u += '/v1';
    return u;
}
function isLocalEndpoint(url) {
    const u = String(url || '').toLowerCase();
    if (!u) return false;
    return /(^|\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|host\.docker\.internal)([:/]|$)/.test(u)
        || /:(5001|5000|8080|8000|1234|11434|5002)(\/|$)/.test(u)
        || /192\.168\.|10\.\d+\.|172\.(1[6-9]|2\d|3[01])\./.test(u);
}
function borrowedRaw() {
    for (const src of KEY_SOURCES) {
        if (src === MODULE_NAME) continue;
        try {
            const x = extension_settings[src];
            if (x && x.apiKey && x.model) return { url: x.baseUrl, key: x.apiKey, model: x.model, from: src };
        } catch (e) { /* a neighbour with broken settings must not break us */ }
    }
    return { url: '', key: '', model: '', from: null };
}
function apiConf() {
    const own = String(dmtSettings.baseUrl || '').trim();
    const ownKey = String(dmtSettings.apiKey || '').trim();
    const ownModel = String(dmtSettings.model || '').trim();
    if (own) {
        const local = isLocalEndpoint(own);
        const b = (ownKey && ownModel) ? { key: '', model: '', from: null } : borrowedRaw();
        return {
            url: own,
            key: ownKey || (local ? 'local' : b.key),
            model: ownModel || (local ? '' : b.model),
            from: ownKey ? null : (local ? null : b.from)
        };
    }
    if (ownKey && ownModel) return { url: '', key: ownKey, model: ownModel, from: null };
    const b = borrowedRaw();
    return b.key ? b : { url: '', key: ownKey, model: ownModel, from: null };
}
function apiKey() { return apiConf().key || ''; }
function apiUrl() { return normalizeBase(apiConf().url) || 'https://openrouter.ai/api/v1'; }
function apiModel() { return apiConf().model || ''; }
function borrowedFrom() { return apiConf().from; }

/* ------------------------------------------------------------
   WHO IS THINKING — and their own preset
   A character's thoughts can have a preset of their own, kept by their card file in every chat
   (as RPG Map keeps a map for a card): which mode, and the inner rules of the "hidden side" —
   written by hand or read from the card once.
   ------------------------------------------------------------ */
function groupMembersAvatars() {
    const ctx = getContext();
    if (!ctx.groupId) return [];
    const g = (ctx.groups || []).find(x => x && x.id === ctx.groupId);
    return g && Array.isArray(g.members) ? g.members : [];
}
// the card file of the one who wrote this message (a group member first, then this chat's card, then any card of that name)
function avatarOf(msg) {
    if (!msg) return '';
    if (msg.original_avatar) return String(msg.original_avatar);
    const name = msg.name;
    const av = groupMembersAvatars().find(a => (characters.find(c => c && c.avatar === a) || {}).name === name);
    if (av) return av;
    const ctx = getContext();
    const own = ctx.characterId !== undefined ? characters[ctx.characterId] : null;
    if (own && own.name === name) return own.avatar;
    const any = characters.filter(c => c && c.name === name && c.avatar);
    return any.length === 1 ? any[0].avatar : '';
}
function profileOf(avatar) {
    const p = avatar && dmtSettings.profiles[avatar];
    return p && typeof p === 'object' ? p : null;
}
function modeFor(avatar) {
    const p = profileOf(avatar);
    return p && (p.mode === 'normal' || p.mode === 'hidden') ? p.mode : dmtSettings.mode;
}
// the system prompt for this character: the ordinary prompt as it always was, or the hidden side with their rules
function systemPromptFor(charName, avatar) {
    if (modeFor(avatar) !== 'hidden') return dmtSettings.systemPrompt.replace(/{{char}}/g, charName);
    const rules = String((profileOf(avatar) || {}).rules || '').trim();
    const base = (dmtSettings.hiddenPrompt || t('hidden_prompt')).replace(/{{char}}/g, charName);
    return rules ? `${base}\n\n${dmtSettings.language === 'ru' ? 'ВНУТРЕННИЕ ПРАВИЛА ПЕРСОНАЖА' : "THE CHARACTER'S INNER RULES"}:\n${rules.replace(/{{char}}/g, charName)}` : base;
}

// one request to the second model, with the same retries and headers the thoughts always used
async function callModel(systemPrompt, userText, maxTokens, temperature) {
    if (!apiKey() && dmtSettings.baseUrl.includes('openrouter')) {
        throw new Error(t('err_no_key'));
    }
    const endpointUrl = apiUrl() + '/chat/completions';
    const maxRetries = 2;
    for (let i = 0; i <= maxRetries; i++) {
        try {
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey().trim()}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'SillyTavern DMT'
                },
                body: JSON.stringify({
                    model: apiModel() || 'google/gemma-4-31b-it',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userText }
                    ],
                    temperature,
                    max_tokens: maxTokens
                })
            });
            if (response.status === 429) {
                if (i < maxRetries) { await new Promise(r => setTimeout(r, 2000 * (i + 1))); continue; }
                throw new Error(t('err_rate'));
            }
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            const content = String(data.choices?.[0]?.message?.content ?? '').trim();
            if (!content) throw new Error(t('err_empty'));
            return content;
        } catch (error) {
            if (i === maxRetries) throw error;
        }
    }
}

// the card, read once: the rules of the hidden side, written into the character's preset
const scanBusy = new Set();
async function scanCard(avatar) {
    const ch = characters.find(c => c && c.avatar === avatar);
    if (!ch) throw new Error(t('ui_scan_nocard'));
    const parts = [
        ch.description && `DESCRIPTION:\n${ch.description}`,
        ch.personality && `PERSONALITY:\n${ch.personality}`,
        ch.scenario && `SCENARIO:\n${ch.scenario}`,
        ch.data?.creator_notes && `CREATOR'S NOTES:\n${ch.data.creator_notes}`
    ].filter(Boolean);
    if (!parts.length) throw new Error(t('ui_scan_nocard'));
    // the whole card, never cut: it is read once, by hand
    const text = `CHARACTER: ${ch.name}\n\n${parts.join('\n\n')}`.replace(/{{char}}/gi, ch.name);
    const out = await callModel(t('scan_prompt'), text, 400, 0.5);
    // only the rule lines; a preamble or a closing remark from a chatty model is dropped
    const lines = out.split('\n').map(l => l.trim()).filter(l => /^[-•*–—]\s*\S/.test(l)).map(l => '- ' + l.replace(/^[-•*–—]\s*/, '').replace(/\*\*/g, '')).slice(0, 8);
    return lines.length ? lines.join('\n') : out.slice(0, 1200);
}

async function generateThoughtAPI(chatMessages, charName, avatar = '') {
    if (!apiKey() && dmtSettings.baseUrl.includes('openrouter')) {
        throw new Error(t('err_no_key'));
    }

    const finalSystemPrompt = systemPromptFor(charName, avatar);
    let history = chatMessages.map(msg => `${msg.name}: ${msg.mes}`).join('\n\n');
    let endpointUrl = apiUrl() + '/chat/completions';

    const maxRetries = 2;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey().trim()}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'SillyTavern DMT'
                },
                body: JSON.stringify({
                    model: apiModel() || 'google/gemma-4-31b-it',
                    messages: [
                        { role: 'system', content: finalSystemPrompt },
                        { role: 'user', content: `Conversation History:\n${history}\n\nWrite the inner thought for ${charName} right now:` }
                    ],
                    temperature: dmtSettings.temperature || 0.8,
                    max_tokens: 150
                })
            });

            if (response.status === 429) {
                if (i < maxRetries) {
                    await new Promise(r => setTimeout(r, 2000 * (i + 1)));
                    continue;
                }
                throw new Error(t('err_rate'));
            }

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            let content = data.choices?.[0]?.message?.content;
            if (content === null || content === undefined) content = "";
            content = content.trim();

            if (!content) throw new Error(t('err_empty'));

            return content;

        } catch (error) {
            if (i === maxRetries) throw error;
        }
    }
}

function saveThoughtToChat(messageId, charName, thought) {
    const context = getContext();
    const msg = context.chat[messageId];
    if (!msg) return;

    if (!msg.extra) msg.extra = {};
    if (!msg.extra.dmt_thoughts) msg.extra.dmt_thoughts = {};
    msg.extra.dmt_thoughts[charName] = thought;
    if (!msg.extra.dmt_swipe) msg.extra.dmt_swipe = {};
    msg.extra.dmt_swipe[charName] = msg.swipe_id ?? 0;   // remember WHICH swipe this thought belongs to
    saveChatDebounced();
}

function renderThought(messageId, charName, thought, isLoading = false, isError = false, startCollapsed = false) {
    const messageElement = document.querySelector(`.mes[mesid="${messageId}"]`);
    if (!messageElement) return;
    if (messageElement.getAttribute('is_user') === 'true') return;

    initDmtLayer();

    let bubbleId = `dmt-bubble-${messageId}-${charName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let bubble = document.getElementById(bubbleId);

    if (!bubble) {
        bubble = document.createElement('div');
        bubble.id = bubbleId;
        bubble.className = 'rpg-thought-bubble';
        bubble.dataset.style = dmtSettings.bubbleStyle;

        if (startCollapsed) {
            bubble.classList.add('rpg-collapsed');
        }

        dmtLayer.appendChild(bubble);

        bubble.addEventListener('click', (e) => {
            if (!e.target.closest('.dmt-regenerate-btn')) {
                bubble.classList.toggle('rpg-collapsed');
                syncBubbles();
            }
        });
    }

    // keyed by message AND character: in a group two characters can think on adjacent
    // messages, and the old messageId-only key silently dropped one bubble from tracking
    // (it then floated orphaned forever). Also refresh the element reference — ST rebuilds
    // .mes nodes on edits, and a stale reference made syncBubbles kill a live bubble.
    bubblesMap.set(`${messageId}::${charName}`, { bubble, messageElement });

    if (isLoading) {
        bubble.classList.remove('rpg-collapsed');
        bubble.innerHTML = `
            <div class="rpg-collapsed-icon">💭</div>
            <div class="rpg-expanded-content">
                <div class="rpg-thought-header">
                    <span><i class="fa-solid fa-brain"></i> ${escapeHtml(charName)}</span>
                </div>
                <div class="rpg-thought-text">
                    <span class="rpg-loading-dots">${t('loading')}</span>
                </div>
            </div>
        `;
        syncBubbles();
        return;
    }

    const contentHtml = isError ? `<span style="color:#ff6b6b">${escapeHtml(thought)}</span>` : escapeHtml(thought);

    bubble.innerHTML = `
        <div class="rpg-collapsed-icon">💭</div>
        <div class="rpg-expanded-content">
            <div class="rpg-thought-header">
                <span><i class="fa-solid fa-brain"></i> ${escapeHtml(charName)}</span>
                <button class="dmt-regenerate-btn" title="${t('regen_title')}"><i class="fa-solid fa-rotate"></i></button>
            </div>
            <div class="rpg-thought-text">${contentHtml}</div>
        </div>
    `;

    bubble.querySelector('.dmt-regenerate-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        processCharacterThought(messageId, charName, true);
    });

    syncBubbles();
}

async function processCharacterThought(messageId, charName, forceRegenerate = false) {
    const context = getContext();
    const chat = context.chat;
    const msg = chat[messageId];
    if (!msg) return;

    // the cache is only valid for the SAME swipe: after swiping, the old thought described
    // the variant the user just swiped AWAY from
    const sameSwipe = (msg.extra?.dmt_swipe?.[charName] ?? 0) === (msg.swipe_id ?? 0);
    if (!forceRegenerate && msg.extra?.dmt_thoughts?.[charName] && sameSwipe) {
        renderThought(messageId, charName, msg.extra.dmt_thoughts[charName], false, false, false);
        return;
    }

    renderThought(messageId, charName, '', true, false, false);
    const myChat = context.chatId;   // message ids overlap between chats: a thought arriving
                                     // after a switch used to be SAVED onto the new chat's
                                     // message with the same number and rendered onto it

    try {
        const startIdx = Math.max(0, messageId - dmtSettings.contextMessages);
        const history = chat.slice(startIdx, messageId + 1);

        const thought = await generateThoughtAPI(history, charName, avatarOf(msg));
        if (getContext().chatId !== myChat) return;   // chat changed while the model was thinking
        saveThoughtToChat(messageId, charName, thought);
        renderThought(messageId, charName, thought, false, false, false);
        updateContextInjection();
    } catch (error) {
        console.error("[DMT Error]", error);
        renderThought(messageId, charName, t('err_prefix', { msg: error.message }), false, true, false);
    }
}

async function handleMessage(messageId) {
    if (!dmtSettings.enabled) return;
    const context = getContext();
    const msg = context.chat[messageId];
    if (!msg || msg.is_user || msg.is_system) return;

    // Generate a thought only for the character whose message is on screen (msg.name).
    // Works for both solo and group chats, avoiding floating bubbles / model mix-ups.
    await processCharacterThought(messageId, msg.name);
}

function updateContextInjection() {
    if (!dmtSettings.enabled || !dmtSettings.injectContext) {
        setExtensionPrompt(DMT_PROMPT_KEY, '', 0, 0, false);
        return;
    }

    const context = getContext();
    let recentThoughts = [];

    for (let i = context.chat.length - 1; i >= 0 && recentThoughts.length < dmtSettings.injectCount; i--) {
        const extraThoughts = context.chat[i].extra?.dmt_thoughts;
        if (extraThoughts) {
            for (const [charName, thought] of Object.entries(extraThoughts)) {
                recentThoughts.unshift(`[${charName}'s internal thought: "${thought}"]`);
                if (recentThoughts.length >= dmtSettings.injectCount) break;
            }
        }
    }

    if (recentThoughts.length > 0) {
        const promptText = `\n--- RECENT INTERNAL THOUGHTS ---\n${recentThoughts.join('\n')}\n(Consider these internal thoughts when writing your next response, but do not state them out loud.)`;
        setExtensionPrompt(DMT_PROMPT_KEY, promptText, 0, 0, false, extension_prompt_roles.SYSTEM);
    } else {
        setExtensionPrompt(DMT_PROMPT_KEY, '', 0, 0, false);
    }
}

function mountSettings() {
    // rebuilt in place (a language switch): it stays where it was in the list, and open if it was open
    const old = $('.dual-model-thoughts-settings');
    const wasOpen = old.length && old.find('.dmt-drawer-content').css('display') !== 'none';
    if (old.length) { old.first().replaceWith(buildSettingsHtml()); old.slice(1).remove(); }
    else $('#extensions_settings').append(buildSettingsHtml());
    if (wasOpen) { $('.dual-model-thoughts-settings .dmt-drawer-content').show(); $('.dual-model-thoughts-settings .inline-drawer-icon').toggleClass('down up'); }

    $('.dual-model-thoughts-settings .dmt-drawer-toggle').on('click', function () {
        $(this).next('.dmt-drawer-content').slideToggle();
        $(this).find('.inline-drawer-icon').toggleClass('down up');
    });

    $('#dmt-enabled').prop('checked', dmtSettings.enabled).on('change', function () {
        dmtSettings.enabled = this.checked;
        saveSettings();
        updateContextInjection();
        if (!this.checked) {
            document.querySelectorAll('.rpg-thought-bubble').forEach(b => b.remove());
            bubblesMap.clear();
        } else {
            restoreThoughtsOnLoad();
        }
    });

    $('#dmt-language').val(dmtSettings.language).on('change', function () {
        const wasDefault = isDefaultPrompt(dmtSettings.systemPrompt);
        const wasDefaultHidden = isDefaultHidden(dmtSettings.hiddenPrompt);
        dmtSettings.language = $(this).val();
        // if the prompt was still a stock default, swap it to the new language's default
        if (wasDefault) dmtSettings.systemPrompt = t('default_prompt');
        if (wasDefaultHidden) dmtSettings.hiddenPrompt = t('hidden_prompt');
        saveSettings();
        mountSettings();
    });

    $('#dmt-base-url').val(dmtSettings.baseUrl).on('input', function () {
        dmtSettings.baseUrl = $(this).val().trim();
        saveSettings();
    });

    $('#dmt-api-key').val(dmtSettings.apiKey).on('input', function () {
        dmtSettings.apiKey = $(this).val().trim();
        saveSettings();
    });

    $('#dmt-toggle-api-key').on('click', () => {
        const input = $('#dmt-api-key')[0];
        input.type = input.type === 'password' ? 'text' : 'password';
        $('#dmt-toggle-api-key i').toggleClass('fa-eye fa-eye-slash');
    });

    $('#dmt-model').val(dmtSettings.model).on('input', function () {
        dmtSettings.model = $(this).val().trim();
        saveSettings();
    });

    $('#dmt-temperature').val(dmtSettings.temperature).on('input', function () {
        const val = parseFloat($(this).val());
        $('#dmt-temp-val').text(val);
        dmtSettings.temperature = val;
        saveSettings();
    });
    $('#dmt-temp-val').text(dmtSettings.temperature);

    $('#dmt-system-prompt').val(dmtSettings.systemPrompt).on('input', function () {
        dmtSettings.systemPrompt = $(this).val();
        saveSettings();
    });

    $('#dmt-reset-prompt').on('click', () => {
        dmtSettings.systemPrompt = t('default_prompt');
        $('#dmt-system-prompt').val(dmtSettings.systemPrompt);
        saveSettings();
    });

    $('#dmt-hidden-prompt').val(dmtSettings.hiddenPrompt).on('input', function () {
        dmtSettings.hiddenPrompt = $(this).val();
        saveSettings();
    });
    $('#dmt-reset-hidden').on('click', () => {
        dmtSettings.hiddenPrompt = t('hidden_prompt');
        $('#dmt-hidden-prompt').val(dmtSettings.hiddenPrompt);
        saveSettings();
    });
    $('#dmt-mode').val(dmtSettings.mode).on('change', function () {
        dmtSettings.mode = this.value === 'hidden' ? 'hidden' : 'normal';
        saveSettings();
        renderCharBox();   // "as in the settings" names the mode it means
    });
    $('#dmt-style').val(dmtSettings.bubbleStyle).on('change', function () {
        dmtSettings.bubbleStyle = STYLES.includes(this.value) ? this.value : 'classic';
        saveSettings();
        applyBubbleStyle();
    });
    applyBubbleStyle();
    renderCharBox();

    $('#dmt-inject-context').prop('checked', dmtSettings.injectContext).on('change', function () {
        dmtSettings.injectContext = this.checked;
        $('#dmt-inject-count-row').toggle(dmtSettings.injectContext);
        saveSettings();
        updateContextInjection();
    });
    $('#dmt-inject-count-row').toggle(dmtSettings.injectContext);

    $('#dmt-inject-count').val(dmtSettings.injectCount).on('change', function () {
        dmtSettings.injectCount = Math.max(1, parseInt($(this).val()) || 2);
        $(this).val(dmtSettings.injectCount);
        saveSettings();
        updateContextInjection();
    });

    $('#dmt-context-messages').val(dmtSettings.contextMessages).on('change', function () {
        dmtSettings.contextMessages = Math.max(2, parseInt($(this).val()) || 10);
        $(this).val(dmtSettings.contextMessages);
        saveSettings();
    });
}

function restoreThoughtsOnLoad() {
    if (!dmtSettings.enabled) return;
    const context = getContext();
    if (!context.chat) return;

    context.chat.forEach((msg, idx) => {
        if (msg.extra?.dmt_thoughts) {
            for (const [charName, thought] of Object.entries(msg.extra.dmt_thoughts)) {
                renderThought(idx, charName, thought, false, false, true);
            }
        }
    });
    updateContextInjection();
}

jQuery(() => {
    try {
        loadSettings();
        mountSettings();
        initDmtLayer();

        const chatElement = document.getElementById('chat');
        if (chatElement) {
            chatElement.addEventListener('scroll', syncBubbles, { passive: true });
        }
        window.addEventListener('resize', syncBubbles, { passive: true });

        // Attributes are not watched any more. With subtree:true, every hover class and
        // every inline style SillyTavern touches anywhere in the chat woke the whole
        // repositioning pass — and it touches them constantly while a reply streams.
        // Messages appearing and disappearing is what actually moves bubbles, and that
        // is childList.
        const observer = new MutationObserver(syncBubbles);
        if (chatElement) {
            observer.observe(chatElement, { childList: true, subtree: true });
        }

        eventSource.on(event_types.CHAT_CHANGED, () => {
            renderCharBox();
            document.querySelectorAll('.rpg-thought-bubble').forEach(b => b.remove());
            bubblesMap.clear();
            restoreThoughtsOnLoad();
        });

        eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (messageId) => {
            if (!dmtSettings.enabled) return;
            const msg = getContext().chat[messageId];
            if (msg && !msg.is_user && !msg.is_system && msg.extra?.dmt_thoughts?.[msg.name]) {
                renderThought(messageId, msg.name, msg.extra.dmt_thoughts[msg.name]);
            }
        });

        eventSource.on(event_types.MESSAGE_EDITED, (messageId) => {
            if (!dmtSettings.enabled) return;
            const msg = getContext().chat[messageId];
            if (msg && !msg.is_user && !msg.is_system && msg.extra?.dmt_thoughts?.[msg.name]) {
                renderThought(messageId, msg.name, msg.extra.dmt_thoughts[msg.name]);
            }
        });

        eventSource.on(event_types.MESSAGE_RECEIVED, async (messageId) => {
            const msg = getContext().chat[messageId];
            if (msg && !msg.is_user && !msg.is_system) {
                setTimeout(async () => await handleMessage(messageId), 50);
            }
        });

        eventSource.on(event_types.MESSAGE_SWIPED, async (messageId) => {
            const msg = getContext().chat[messageId];
            if (msg && !msg.is_user && !msg.is_system) {
                setTimeout(async () => await handleMessage(messageId), 50);
            }
        });

    } catch (e) {
        console.error("[DMT Thoughts] Fatal Initialization Error:", e);
    }
});
