---
read_when:
    - Пояснення того, як працює streaming або chunking у каналах
    - Зміна поведінки block streaming або channel chunking
    - Налагодження дубльованих/передчасних блокових відповідей або preview streaming у каналах
summary: Поведінка streaming + chunking (блокові відповіді, preview-streaming у каналах, зіставлення режимів)
title: Streaming і chunking
x-i18n:
    generated_at: "2026-04-05T18:02:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44b0d08c7eafcb32030ef7c8d5719c2ea2d34e4bac5fdad8cc8b3f4e9e9fad97
    source_path: concepts/streaming.md
    workflow: 15
---

# Streaming + chunking

OpenClaw має два окремі шари streaming:

- **Block streaming (канали):** надсилає завершені **блоки**, поки асистент пише. Це звичайні повідомлення каналу (не дельти токенів).
- **Preview streaming (Telegram/Discord/Slack):** оновлює тимчасове **preview message** під час генерації.

Справжнього streaming дельт токенів до повідомлень каналу сьогодні **немає**. Preview streaming працює на рівні повідомлень (надсилання + редагування/додавання).

## Block streaming (повідомлення каналу)

Block streaming надсилає вихід асистента грубими фрагментами в міру його появи.

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
- Перевизначення для каналів: `*.blockStreaming` (і варіанти для окремих облікових записів), щоб примусово задати `"on"`/`"off"` для кожного каналу.
- `agents.defaults.blockStreamingBreak`: `"text_end"` або `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (об’єднання блоків streaming перед надсиланням).
- Жорстке обмеження каналу: `*.textChunkLimit` (наприклад, `channels.whatsapp.textChunkLimit`).
- Режим chunking каналу: `*.chunkMode` (`length` типово, `newline` ділить за порожніми рядками (межами абзаців) перед chunking за довжиною).
- М’яке обмеження Discord: `channels.discord.maxLinesPerMessage` (типово 17) ділить високі відповіді, щоб уникнути обрізання в UI.

**Семантика меж:**

- `text_end`: передавати блоки в потоці, щойно їх видає chunker; flush на кожному `text_end`.
- `message_end`: чекати, доки повідомлення асистента завершиться, а потім flush буферизований вихід.

`message_end` усе одно використовує chunker, якщо буферизований текст перевищує `maxChars`, тому наприкінці він може видати кілька chunk.

## Алгоритм chunking (нижня/верхня межі)

Block chunking реалізовано через `EmbeddedBlockChunker`:

- **Нижня межа:** не видавати, доки буфер не досягне `minChars` (якщо не примусово).
- **Верхня межа:** намагатися розривати до `maxChars`; якщо примусово, розривати на `maxChars`.
- **Пріоритет розриву:** `paragraph` → `newline` → `sentence` → `whitespace` → жорсткий розрив.
- **Code fences:** ніколи не розривати всередині fence; якщо розрив на `maxChars` примусовий, fence закривається й знову відкривається, щоб Markdown залишався коректним.

`maxChars` обмежується значенням `textChunkLimit` каналу, тому перевищити ліміти каналу не можна.

## Coalescing (об’єднання блоків streaming)

Коли block streaming увімкнено, OpenClaw може **об’єднувати послідовні блокові chunk**
перед їх надсиланням. Це зменшує «спам з однорядкових повідомлень», водночас
зберігаючи поступовий вивід.

- Coalescing чекає **пауз без активності** (`idleMs`) перед flush.
- Буфери обмежені `maxChars` і будуть скинуті, якщо перевищать його.
- `minChars` не дає надсилати крихітні фрагменти, доки не накопичиться достатньо тексту
  (під час фінального flush залишковий текст надсилається завжди).
- Joiner виводиться з `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → пробіл).
- Для каналів доступні перевизначення через `*.blockStreamingCoalesce` (зокрема у конфігураціях для окремих облікових записів).
- Типове значення coalesce `minChars` підвищується до 1500 для Signal/Slack/Discord, якщо не перевизначено.

## Людиноподібний темп між блоками

Коли block streaming увімкнено, ви можете додати **випадкову паузу** між
блоковими відповідями (після першого блока). Це робить багатобульбашкові відповіді
природнішими.

- Конфігурація: `agents.defaults.humanDelay` (можна перевизначити для окремого агента через `agents.list[].humanDelay`).
- Режими: `off` (типово), `natural` (800–2500 мс), `custom` (`minMs`/`maxMs`).
- Застосовується лише до **блокових відповідей**, а не до фінальних відповідей чи підсумків інструментів.

## "Передавати chunk-и чи все одразу"

Це зіставляється так:

- **Передавати chunk-и:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (видавати під час генерації). Для каналів, окрім Telegram, також потрібно `*.blockStreaming: true`.
- **Передати все наприкінці:** `blockStreamingBreak: "message_end"` (одноразовий flush, можливо з кількома chunk, якщо текст дуже довгий).
- **Без block streaming:** `blockStreamingDefault: "off"` (лише фінальна відповідь).

**Примітка про канал:** Block streaming **вимкнено, якщо тільки**
`*.blockStreaming` явно не задано як `true`. Канали можуть вести live preview streaming
(`channels.<channel>.streaming`) без блокових відповідей.

Нагадування про місце конфігурації: типові значення `blockStreaming*` розміщуються в
`agents.defaults`, а не в корені конфігурації.

## Режими preview streaming

Канонічний ключ: `channels.<channel>.streaming`

Режими:

- `off`: вимкнути preview streaming.
- `partial`: одне preview, яке замінюється найновішим текстом.
- `block`: preview оновлюється chunk-ами/додаваннями.
- `progress`: preview прогресу/статусу під час генерації, фінальна відповідь після завершення.

### Зіставлення каналів

| Канал    | `off` | `partial` | `block` | `progress`        |
| -------- | ----- | --------- | ------- | ----------------- |
| Telegram | ✅    | ✅        | ✅      | зіставляється з `partial` |
| Discord  | ✅    | ✅        | ✅      | зіставляється з `partial` |
| Slack    | ✅    | ✅        | ✅      | ✅                |

Лише для Slack:

- `channels.slack.nativeStreaming` перемикає нативні виклики API streaming Slack, коли `streaming=partial` (типово: `true`).

Міграція застарілих ключів:

- Telegram: `streamMode` + булевий `streaming` автоматично мігрують до enum `streaming`.
- Discord: `streamMode` + булевий `streaming` автоматично мігрують до enum `streaming`.
- Slack: `streamMode` автоматично мігрує до enum `streaming`; булевий `streaming` автоматично мігрує до `nativeStreaming`.

### Поведінка runtime

Telegram:

- Використовує `sendMessage` + `editMessageText` для оновлення preview у DM і групах/темах.
- Preview streaming пропускається, якщо block streaming Telegram явно увімкнено (щоб уникнути подвійного streaming).
- `/reasoning stream` може записувати міркування в preview.

Discord:

- Використовує надсилання + редагування preview message.
- Режим `block` використовує chunking чернетки (`draftChunk`).
- Preview streaming пропускається, якщо block streaming Discord явно увімкнено.

Slack:

- `partial` може використовувати нативний streaming Slack (`chat.startStream`/`append`/`stop`), коли доступно.
- `block` використовує preview чернетки у стилі append.
- `progress` використовує preview тексту статусу, а потім фінальну відповідь.

## Пов’язане

- [Повідомлення](/concepts/messages) — життєвий цикл і доставка повідомлень
- [Повторні спроби](/concepts/retry) — поведінка повторних спроб у разі збою доставки
- [Канали](/channels) — підтримка streaming для окремих каналів
