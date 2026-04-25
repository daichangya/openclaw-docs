---
read_when:
    - Пояснення того, як streaming або chunking працює в каналах
    - Зміна поведінки block streaming або channel chunking
    - Налагодження дубльованих/передчасних блокових відповідей або preview streaming каналу
summary: Поведінка streaming + chunking (блокові відповіді, preview streaming каналу, зіставлення режимів)
title: Streaming і chunking
x-i18n:
    generated_at: "2026-04-25T04:07:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29faf5c6f39f4a9ebf149b94f5945bd1454b4d4112f557f5cb20b4f1c7f72346
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + chunking

OpenClaw має два окремі рівні streaming:

- **Блоковий streaming (канали):** надсилає завершені **блоки**, поки асистент пише. Це звичайні повідомлення каналу (не token deltas).
- **Preview streaming (Telegram/Discord/Slack):** оновлює тимчасове **preview message** під час генерації.

Справжнього streaming у вигляді token deltas до повідомлень каналу сьогодні **немає**. Preview streaming базується на повідомленнях (надсилання + редагування/додавання).

## Блоковий streaming (повідомлення каналу)

Блоковий streaming надсилає вихід асистента великими частинами, щойно вони стають доступними.

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

Легенда:

- `text_delta/events`: події потоку моделі (можуть бути рідкісними для моделей без streaming).
- `chunker`: `EmbeddedBlockChunker`, який застосовує мінімальні/максимальні межі + пріоритет розриву.
- `channel send`: фактичні вихідні повідомлення (блокові відповіді).

**Керування:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (типово вимкнено).
- Перевизначення для каналів: `*.blockStreaming` (і варіанти для окремих акаунтів), щоб примусово встановити `"on"`/`"off"` для кожного каналу.
- `agents.defaults.blockStreamingBreak`: `"text_end"` або `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (об’єднання streamed-блоків перед надсиланням).
- Жорстке обмеження каналу: `*.textChunkLimit` (наприклад, `channels.whatsapp.textChunkLimit`).
- Режим chunking каналу: `*.chunkMode` (`length` — типово, `newline` — розбиває за порожніми рядками (межі абзаців) перед розбиттям за довжиною).
- М’яке обмеження Discord: `channels.discord.maxLinesPerMessage` (типово 17) розбиває довгі відповіді, щоб уникнути обрізання в UI.

**Семантика меж:**

- `text_end`: stream-блоки надсилаються, щойно їх видає chunker; flush виконується на кожному `text_end`.
- `message_end`: чекати завершення повідомлення асистента, а потім виконати flush буферизованого виводу.

`message_end` усе одно використовує chunker, якщо буферизований текст перевищує `maxChars`, тому наприкінці може бути надіслано кілька chunk.

## Алгоритм chunking (нижня/верхня межі)

Блоковий chunking реалізовано в `EmbeddedBlockChunker`:

- **Нижня межа:** не надсилати, доки буфер не досягне `minChars` (якщо не примусово).
- **Верхня межа:** намагатися розривати до `maxChars`; якщо примусово, розривати на `maxChars`.
- **Пріоритет розриву:** `paragraph` → `newline` → `sentence` → `whitespace` → жорсткий розрив.
- **Code fences:** ніколи не розривати всередині fence; якщо примусовий розрив на `maxChars`, fence закривається й відкривається знову, щоб Markdown залишався валідним.

`maxChars` обмежується значенням `textChunkLimit` каналу, тому перевищити ліміти конкретного каналу не можна.

## Coalescing (об’єднання streamed-блоків)

Коли блоковий streaming увімкнено, OpenClaw може **об’єднувати послідовні block chunks**
перед їх надсиланням. Це зменшує “спам з однорядкових повідомлень”, водночас
зберігаючи поступовий вивід.

- Coalescing очікує **періодів бездіяльності** (`idleMs`) перед flush.
- Буфери обмежуються `maxChars` і будуть відправлені, якщо перевищать його.
- `minChars` не дає надсилати дрібні фрагменти, доки не накопичиться достатньо тексту
  (остаточний flush завжди надсилає весь залишок тексту).
- Joiner визначається з `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → пробіл).
- Для каналів доступні перевизначення через `*.blockStreamingCoalesce` (включно з конфігураціями для окремих акаунтів).
- Типове значення coalesce `minChars` підвищується до 1500 для Signal/Slack/Discord, якщо не перевизначено.

## Людиноподібна затримка між блоками

Коли блоковий streaming увімкнено, можна додати **випадкову паузу** між
блоковими відповідями (після першого блоку). Це робить відповіді з кількох бульбашок
природнішими.

- Конфігурація: `agents.defaults.humanDelay` (перевизначення для окремого агента через `agents.list[].humanDelay`).
- Режими: `off` (типово), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Застосовується лише до **блокових відповідей**, не до фінальних відповідей або зведень інструментів.

## "Надсилати chunk-и чи все одразу"

Це відповідає такому:

- **Надсилати chunk-и:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (надсилати в процесі). Для каналів, окрім Telegram, також потрібен `*.blockStreaming: true`.
- **Надсилати все наприкінці:** `blockStreamingBreak: "message_end"` (один flush, можливо кількома chunk-ами, якщо відповідь дуже довга).
- **Без блокового streaming:** `blockStreamingDefault: "off"` (лише фінальна відповідь).

**Примітка про канали:** Блоковий streaming **вимкнено, доки**
`*.blockStreaming` явно не встановлено в `true`. Канали можуть мати live preview
(`channels.<channel>.streaming`) без блокових відповідей.

Нагадування про розташування конфігурації: значення за замовчуванням `blockStreaming*` розміщені в `agents.defaults`, а не в корені конфігурації.

## Режими preview streaming

Канонічний ключ: `channels.<channel>.streaming`

Режими:

- `off`: вимкнути preview streaming.
- `partial`: один preview, який замінюється актуальним текстом.
- `block`: preview оновлюється chunk-ами/додаванням частинами.
- `progress`: preview прогресу/статусу під час генерації, фінальна відповідь після завершення.

### Зіставлення для каналів

| Канал      | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | зіставляється з `partial` |
| Discord    | ✅    | ✅        | ✅      | зіставляється з `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Лише для Slack:

- `channels.slack.streaming.nativeTransport` перемикає виклики нативного Slack streaming API, коли `channels.slack.streaming.mode="partial"` (типово: `true`).
- Нативний Slack streaming і статуси Slack assistant thread потребують цільового reply thread; DM верхнього рівня не показують такий preview у стилі thread.

Міграція legacy ключів:

- Telegram: `streamMode` і булеве `streaming` автоматично мігрують у enum `streaming`.
- Discord: `streamMode` і булеве `streaming` автоматично мігрують у enum `streaming`.
- Slack: `streamMode` автоматично мігрує в `streaming.mode`; булеве `streaming` автоматично мігрує в `streaming.mode` плюс `streaming.nativeTransport`; legacy `nativeStreaming` автоматично мігрує в `streaming.nativeTransport`.

### Поведінка під час виконання

Telegram:

- Використовує оновлення preview через `sendMessage` + `editMessageText` у DM і групах/темах.
- Preview streaming пропускається, коли для Telegram явно увімкнено блоковий streaming (щоб уникнути подвійного streaming).
- `/reasoning stream` може виводити reasoning у preview.

Discord:

- Використовує preview-повідомлення через send + edit.
- Режим `block` використовує чернетковий chunking (`draftChunk`).
- Preview streaming пропускається, коли для Discord явно увімкнено блоковий streaming.
- Фінальні payload-и з медіа, помилками та явними відповідями скасовують очікувані preview без надсилання нового draft, а потім використовують звичайну доставку.

Slack:

- `partial` може використовувати нативний Slack streaming (`chat.startStream`/`append`/`stop`), коли він доступний.
- `block` використовує draft preview у стилі append.
- `progress` використовує preview тексту статусу, а потім фінальну відповідь.
- Нативний і draft preview streaming пригнічують блокові відповіді для цього ходу, тому відповідь Slack надсилається лише одним шляхом доставки.
- Фінальні payload-и з медіа/помилками та фінали progress не створюють тимчасових draft-повідомлень; лише текстові/блокові фінали, які можуть редагувати preview, виконують flush відкладеного draft text.

Mattermost:

- Stream-ить thinking, активність інструментів і частковий текст відповіді в єдиний draft preview post, який фіналізується на місці, коли фінальну відповідь безпечно надсилати.
- Повертається до надсилання нового фінального post, якщо preview post було видалено або він недоступний на момент фіналізації.
- Фінальні payload-и з медіа/помилками скасовують відкладені preview-оновлення перед звичайною доставкою, замість flush тимчасового preview post.

Matrix:

- Draft preview фіналізується на місці, коли фінальний текст може повторно використати подію preview.
- Фінали лише з медіа, з помилками та з невідповідністю цілі відповіді скасовують відкладені preview-оновлення перед звичайною доставкою; уже видимий застарілий preview редагується через redaction.

### Оновлення preview з прогресом інструментів

Preview streaming також може включати оновлення **tool-progress** — короткі рядки статусу на кшталт "searching the web", "reading file" або "calling tool", які з’являються в тому самому preview message під час роботи інструментів, ще до фінальної відповіді. Це візуально оживляє багатокрокові ходи з інструментами, щоб вони не виглядали беззвучними між першим preview thinking і фінальною відповіддю.

Підтримувані поверхні:

- **Discord**, **Slack** і **Telegram** типово stream-ять tool-progress у live preview edit, коли preview streaming активний.
- Telegram постачається з увімкненими оновленнями preview tool-progress починаючи з `v2026.4.22`; збереження цього стану підтримує вже випущену поведінку.
- **Mattermost** уже включає активність інструментів у свій єдиний draft preview post (див. вище).
- Редагування tool-progress дотримуються активного режиму preview streaming; вони пропускаються, коли preview streaming має значення `off` або коли керування повідомленням уже перейняв блоковий streaming.
- Щоб зберегти preview streaming, але приховати рядки tool-progress, установіть `streaming.preview.toolProgress` у `false` для цього каналу. Щоб повністю вимкнути preview edits, установіть `streaming.mode` у `off`.

Приклад:

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": false
        }
      }
    }
  }
}
```

## Пов’язане

- [Messages](/uk/concepts/messages) — життєвий цикл і доставка повідомлень
- [Retry](/uk/concepts/retry) — поведінка повторних спроб у разі збою доставки
- [Channels](/uk/channels) — підтримка streaming для окремих каналів
