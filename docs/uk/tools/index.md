---
read_when:
    - Ви хочете зрозуміти, які інструменти надає OpenClaw
    - Вам потрібно налаштувати, дозволити або заборонити інструменти
    - 'Ви вирішуєте, що обрати: вбудовані інструменти, Skills чи plugin-и'
summary: 'Огляд інструментів і plugin OpenClaw: що може робити агент і як його розширювати'
title: Інструменти та plugin-и
x-i18n:
    generated_at: "2026-04-23T06:48:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef0975c567b0bca0e991a0445d3db4a00fe2e2cf91b9e6bea5686825deac91a0
    source_path: tools/index.md
    workflow: 15
---

# Інструменти та plugin-и

Усе, що агент робить понад генерацію тексту, відбувається через **інструменти**.
Інструменти — це спосіб, яким агент читає файли, виконує команди, переглядає веб, надсилає
повідомлення та взаємодіє з пристроями.

## Інструменти, Skills і plugin-и

OpenClaw має три шари, які працюють разом:

<Steps>
  <Step title="Інструменти — це те, що викликає агент">
    Інструмент — це типізована функція, яку агент може викликати (наприклад, `exec`, `browser`,
    `web_search`, `message`). OpenClaw постачається з набором **вбудованих інструментів**, а
    plugin-и можуть реєструвати додаткові.

    Агент бачить інструменти як структуровані визначення функцій, надіслані до API моделі.

  </Step>

  <Step title="Skills навчають агента коли і як">
    Skill — це markdown-файл (`SKILL.md`), який вбудовується в системний prompt.
    Skills дають агенту контекст, обмеження та покрокові вказівки для
    ефективного використання інструментів. Skills знаходяться у вашому workspace, у спільних теках
    або постачаються всередині plugin-ів.

    [Довідник Skills](/uk/tools/skills) | [Створення Skills](/uk/tools/creating-skills)

  </Step>

  <Step title="Plugin-и об’єднують усе разом">
    Plugin — це пакет, який може реєструвати будь-яку комбінацію можливостей:
    канали, провайдерів моделей, інструменти, Skills, мовлення, транскрипцію в реальному часі,
    голос у реальному часі, розуміння медіа, генерацію зображень, генерацію відео,
    web fetch, web search тощо. Деякі plugin-и є **core** (постачаються з
    OpenClaw), інші — **external** (опубліковані в npm спільнотою).

    [Установлення та налаштування plugin-ів](/uk/tools/plugin) | [Створіть власний](/uk/plugins/building-plugins)

  </Step>
</Steps>

## Вбудовані інструменти

Ці інструменти постачаються з OpenClaw і доступні без встановлення будь-яких plugin-ів:

| Tool                                       | What it does                                                          | Page                                                         |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `exec` / `process`                         | Виконання shell-команд, керування фоновими процесами                  | [Exec](/uk/tools/exec), [Exec Approvals](/uk/tools/exec-approvals) |
| `code_execution`                           | Виконання ізольованого віддаленого Python-аналізу                     | [Code Execution](/uk/tools/code-execution)                      |
| `browser`                                  | Керування браузером Chromium (навігація, кліки, знімки екрана)        | [Browser](/uk/tools/browser)                                    |
| `web_search` / `x_search` / `web_fetch`    | Пошук у вебі, пошук дописів X, отримання вмісту сторінок              | [Web](/uk/tools/web), [Web Fetch](/uk/tools/web-fetch)             |
| `read` / `write` / `edit`                  | Ввід/вивід файлів у workspace                                         |                                                              |
| `apply_patch`                              | Латки файлів із кількома фрагментами                                  | [Apply Patch](/uk/tools/apply-patch)                            |
| `message`                                  | Надсилання повідомлень у всіх каналах                                 | [Agent Send](/uk/tools/agent-send)                              |
| `canvas`                                   | Керування node Canvas (present, eval, snapshot)                       |                                                              |
| `nodes`                                    | Виявлення та вибір підключених пристроїв                              |                                                              |
| `cron` / `gateway`                         | Керування запланованими завданнями; перевірка, виправлення, перезапуск або оновлення Gateway |                                                              |
| `image` / `image_generate`                 | Аналіз або генерація зображень                                        | [Image Generation](/uk/tools/image-generation)                  |
| `music_generate`                           | Генерація музичних треків                                             | [Music Generation](/uk/tools/music-generation)                  |
| `video_generate`                           | Генерація відео                                                       | [Video Generation](/uk/tools/video-generation)                  |
| `tts`                                      | Одноразове перетворення text-to-speech                                | [TTS](/uk/tools/tts)                                            |
| `sessions_*` / `subagents` / `agents_list` | Керування сесіями, статус і оркестрація субагентів                    | [Sub-agents](/uk/tools/subagents)                               |
| `session_status`                           | Полегшене зчитування у стилі `/status` і перевизначення моделі для сесії | [Session Tools](/uk/concepts/session-tool)                      |

Для роботи із зображеннями використовуйте `image` для аналізу і `image_generate` для генерації або редагування. Якщо ви націлюєтеся на `openai/*`, `google/*`, `fal/*` або іншого нетипового провайдера зображень, спочатку налаштуйте автентифікацію/API-ключ цього провайдера.

Для роботи з музикою використовуйте `music_generate`. Якщо ви націлюєтеся на `google/*`, `minimax/*` або іншого нетипового музичного провайдера, спочатку налаштуйте автентифікацію/API-ключ цього провайдера.

Для роботи з відео використовуйте `video_generate`. Якщо ви націлюєтеся на `qwen/*` або іншого нетипового відеопровайдера, спочатку налаштуйте автентифікацію/API-ключ цього провайдера.

Для генерації аудіо на основі workflow використовуйте `music_generate`, коли його
реєструє plugin на кшталт ComfyUI. Це окремо від `tts`, який є text-to-speech.

`session_status` — це полегшений інструмент статусу/зчитування в групі sessions.
Він відповідає на запитання у стилі `/status` про поточну сесію і може
необов’язково встановлювати перевизначення моделі для окремої сесії; `model=default` скидає це
перевизначення. Як і `/status`, він може дозаповнювати розріджені лічильники токенів/кешу та
мітку активної моделі середовища виконання з останнього запису usage у транскрипті.

`gateway` — це інструмент середовища виконання лише для власника для операцій Gateway:

- `config.schema.lookup` для одного піддерева конфігурації в межах шляху перед редагуванням
- `config.get` для поточного знімка конфігурації + hash
- `config.patch` для часткових оновлень конфігурації з перезапуском
- `config.apply` лише для повної заміни конфігурації
- `update.run` для явного самооновлення + перезапуску

Для часткових змін надавайте перевагу `config.schema.lookup`, а потім `config.patch`. Використовуйте
`config.apply` лише тоді, коли ви свідомо замінюєте всю конфігурацію.
Інструмент також відмовляється змінювати `tools.exec.ask` або `tools.exec.security`;
застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec.

### Інструменти, надані plugin-ами

Plugin-и можуть реєструвати додаткові інструменти. Деякі приклади:

- [Diffs](/uk/tools/diffs) — переглядач і рендерер diff
- [LLM Task](/uk/tools/llm-task) — крок LLM лише з JSON для структурованого виводу
- [Lobster](/uk/tools/lobster) — типізоване середовище виконання workflow з підтвердженнями, які можна відновити
- [Music Generation](/uk/tools/music-generation) — спільний інструмент `music_generate` з провайдерами на основі workflow
- [OpenProse](/uk/prose) — оркестрація workflow з орієнтацією на markdown
- [Tokenjuice](/uk/tools/tokenjuice) — стискає шумні результати інструментів `exec` і `bash`

## Налаштування інструментів

### Списки дозволу та заборони

Керуйте тим, які інструменти агент може викликати, через `tools.allow` / `tools.deny` у
конфігурації. Заборона завжди має пріоритет над дозволом.

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Профілі інструментів

`tools.profile` задає базовий allowlist до застосування `allow`/`deny`.
Перевизначення для окремого агента: `agents.list[].tools.profile`.

| Profile     | What it includes                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | Без обмежень (те саме, що не встановлено)                                                                                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | Лише `session_status`                                                                                                                             |

Профілі `coding` і `messaging` також дозволяють налаштовані bundle MCP tools
під ключем plugin `bundle-mcp`. Додайте `tools.deny: ["bundle-mcp"]`, коли ви
хочете, щоб профіль зберіг свої звичайні вбудовані можливості, але приховав усі налаштовані MCP tools.
Профіль `minimal` не включає bundle MCP tools.

### Групи інструментів

Використовуйте скорочення `group:*` у списках allow/deny:

| Group              | Tools                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution (`bash` приймається як псевдонім для `exec`)                               |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | Усі вбудовані інструменти OpenClaw (без інструментів plugin-ів)                                           |

`sessions_history` повертає обмежене, відфільтроване з погляду безпеки представлення для згадування. Воно видаляє
теги thinking, каркас `<relevant-memories>`, XML-payload-и викликів інструментів у звичайному тексті
(включно з `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` і обрізаними блоками викликів інструментів),
понижений каркас викликів інструментів, витоки ASCII/full-width токенів керування моделлю
і некоректний XML викликів інструментів MiniMax із тексту асистента, а потім застосовує
редагування/обрізання і, за потреби, заповнювачі для надто великих рядків замість того, щоб діяти
як необроблений дамп транскрипту.

### Обмеження для конкретних провайдерів

Використовуйте `tools.byProvider`, щоб обмежувати інструменти для конкретних провайдерів без
зміни глобальних типових значень:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```
