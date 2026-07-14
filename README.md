# Dual-Model Thoughts

A SillyTavern extension that gives characters a visible **inner monologue**. A second (usually small, cheap) model reads the recent conversation and writes what the character is *actually thinking* — shown as a floating **thought bubble** next to their message. Optionally, those thoughts are injected back into the main prompt so the primary model plays the character with that hidden subtext in mind.

**Version 1.2.0**

---

## ✨ Features

- 💭 **Floating thought bubbles** anchored next to each character message; click to collapse to a small dot.
- 🧠 **Second-model monologue** — a dedicated model/prompt writes a short first-person inner thought.
- 🔌 **Any OpenAI-compatible endpoint** — OpenRouter or a custom/local URL, its own model and temperature.
- 🪄 **Inject into the main chat** — feed the last N thoughts into the system prompt so the main model stays aware of the subtext (without speaking it out loud).
- ✍️ **Editable prompt** with a `{{char}}` placeholder and a one-click **Default** reset.
- 🌍 **Bilingual UI (RU / EN)** — one-click switch; the default prompt (and the thought's output language) follows it.
- 👥 **Group chats** — a thought is generated for whichever character just spoke.
- 🔁 **Regenerate** any thought from its bubble.

## 📦 Install

Copy the `Dual-Model-Thoughts` folder into:

```
SillyTavern/data/<user>/extensions/
```

Reload SillyTavern and enable it in **Extensions → Dual-Model Thoughts**.

## ⚙️ Setup

1. Enable **thought generation**.
2. Pick **Interface language** (English / Русский).
3. Fill in **API Connection** — URL / API key / model. Default model: `google/gemma-4-31b-it`. A small, fast model is ideal here since it runs on every reply.
4. Tune the **thought prompt** if you like (use `{{char}}`), set **temperature**, and how many **messages to analyze**.
5. Optionally turn on **Inject** and choose how many recent thoughts to feed into the main conversation.

## 🧠 How it works

On each new character message the extension sends the last *N* messages to your secondary model with the thought prompt, and renders the reply as a bubble. Thoughts are saved per message in the chat, so they persist and reappear when you reload or scroll. Injection pulls the most recent thoughts into a `--- RECENT INTERNAL THOUGHTS ---` system note so the main model can act on the subtext without stating it.

The bubble sits to the left of the message on desktop and falls back to an inline position on narrow/mobile layouts.

## 👥 Group chats

Supported: a thought is generated for the character whose message was just rendered (`msg.name`), so each speaker gets their own bubble without mix-ups.

## 🧩 Notes

- Thoughts run on **every** character reply — pick a cheap/fast secondary model to keep it snappy and low-cost.
- Past thoughts keep the language they were generated in; new ones follow the current UI language / prompt.
- CSS is namespaced; only a fixed overlay layer (`#dmt-bubbles-layer`) is added to the page.

---
Credits. Inspired by the thought-bubble feature in [RPG Companion](https://github.com/SpicyMarinara/rpg-companion-sillytavern) by SpicyMarinara (AGPL-3.0). Portions of the implementation may derive from that project.
