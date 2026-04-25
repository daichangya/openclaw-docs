---
read_when:
    - Пояснення того, як працюють streaming або chunking у каналах
    - Зміна поведінки потокового передавання блоків або chunking каналу
    - Налагодження дубльованих/передчасних відповідей блоками або потокового передавання попереднього перегляду каналу
summary: Поведінка Streaming + chunking (відповіді блоками, потокове передавання попереднього перегляду каналу, зіставлення режимів)
title: Streaming і chunking
x-i18n:
    generated_at: "2026-04-25T12:04:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba308b79b12886f3a1bc36bc277e3df0e2b9c6018aa260b432ccea89a235819f
    source_path: concepts/streaming.md
    workflow: 15
---

OpenClaw має два окремі рівні streaming:

- **Block streaming (канали):** надсилання завершених **блоків**, поки помічник пише. Це звичайні повідомлення каналу (не token deltas).
- **Preview streaming (Telegram/Discord/Slack):** оновлення тимчасового **повідомлення попереднього перегляду** під час генерації.

Справжнього streaming із token deltas до повідомлень каналу наразі **немає**. Preview streaming працює на рівні повідомлень (надсилання + редагування/додавання).

## Block streaming (повідомлення каналу)

Block streaming надсилає вихідні дані помічника грубими порціями в міру їх появи.

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

- `text_delta/events`: події потоку моделі (можуть бути розрідженими для моделей без streaming).
- `chunker`: `EmbeddedBlockChunker`, який застосовує мінімальні/максимальні межі + пріоритет розриву.
- `channel send`: фактичні вихідні повідомлення (відповіді блоками).

**Керування:**

- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (`"off"` за замовчуванням).
- Перевизначення для каналу: `*.blockStreaming` (і варіанти для окремих облікових записів), щоб примусово встановити `"on"`/`"off"` для кожного каналу.
- `agents.defaults.blockStreamingBreak`: `"text_end"` або `"message_end"`.
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`.
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (об’єднання потокових блоків перед надсиланням).
- Жорстке обмеження каналу: `*.textChunkLimit` (наприклад, `channels.whatsapp.textChunkLimit`).
- Режим розбиття каналу: `*.chunkMode` (`length` за замовчуванням, `newline` розбиває за порожніми рядками (межами абзаців) перед розбиттям за довжиною).
- М’яке обмеження Discord: `channels.discord.maxLinesPerMessage` (`17` за замовчуванням) розбиває високі відповіді, щоб уникнути обрізання в UI.

**Семантика меж:**

- `text_end`: передавати блоки, щойно chunker їх видає; скидати на кожному `text_end`.
- `message_end`: чекати, доки завершиться повідомлення помічника, а потім скидати буферизований вміст.

`message_end` усе одно використовує chunker, якщо буферизований текст перевищує `maxChars`, тому наприкінці він може видати кілька фрагментів.

### Доставка медіа з block streaming

Директиви `MEDIA:` — це звичайні метадані доставки. Коли block streaming
рано надсилає медіаблок, OpenClaw запам’ятовує цю доставку для поточного ходу. Якщо фінальне корисне навантаження помічника повторює ту саму URL-адресу медіа, фінальна доставка прибирає дублікат медіа замість повторного надсилання вкладення.

Точні дублікати фінального payload пригнічуються. Якщо фінальний payload додає
відмінний текст навколо медіа, яке вже було передано потоком, OpenClaw все одно надсилає новий текст, зберігаючи одноразову доставку медіа. Це запобігає дублюванню голосових повідомлень або файлів у таких каналах, як Telegram, коли агент надсилає `MEDIA:` під час streaming, а провайдер також включає його до завершеної відповіді.

## Алгоритм chunking (нижня/верхня межі)

Block chunking реалізовано в `EmbeddedBlockChunker`:

- **Нижня межа:** не видавати, доки буфер < `minChars` (якщо не примусово).
- **Верхня межа:** намагатися розбивати до `maxChars`; якщо примусово, розбивати на `maxChars`.
- **Пріоритет розриву:** `paragraph` → `newline` → `sentence` → `whitespace` → жорсткий розрив.
- **Code fences:** ніколи не розбивати всередині fences; коли примусово на `maxChars`, закривати й знову відкривати fence, щоб Markdown залишався коректним.

`maxChars` обмежується значенням канального `textChunkLimit`, тому перевищити ліміти для конкретного каналу не можна.

## Coalescing (об’єднання потокових блоків)

Коли block streaming увімкнено, OpenClaw може **об’єднувати послідовні block chunks**
перед їх надсиланням. Це зменшує “спам із одного рядка”, але при цьому зберігає
поступове виведення.

- Coalescing чекає на **паузи без активності** (`idleMs`) перед скиданням.
- Буфери обмежуються `maxChars` і будуть скинуті, якщо перевищать його.
- `minChars` не дає надсилати надто малі фрагменти, доки не накопичиться достатньо тексту
  (фінальне скидання завжди надсилає залишковий текст).
- Роздільник визначається з `blockStreamingChunk.breakPreference`
  (`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → пробіл).
- Перевизначення для каналу доступні через `*.blockStreamingCoalesce` (зокрема в конфігураціях окремих облікових записів).
- Значення coalesce `minChars` за замовчуванням підвищується до `1500` для Signal/Slack/Discord, якщо не перевизначено.

## Людиноподібна пауза між блоками

Коли block streaming увімкнено, можна додати **випадкову паузу** між
відповідями блоками (після першого блоку). Це робить відповіді з кількох бульбашок природнішими.

- Конфігурація: `agents.defaults.humanDelay` (можна перевизначити для агента через `agents.list[].humanDelay`).
- Режими: `off` (за замовчуванням), `natural` (800–2500ms), `custom` (`minMs`/`maxMs`).
- Застосовується лише до **відповідей блоками**, а не до фінальних відповідей чи підсумків інструментів.

## "Stream chunks or everything"

Це зіставляється так:

- **Stream chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (видавати в процесі). Для каналів, окрім Telegram, також потрібно `*.blockStreaming: true`.
- **Stream everything at end:** `blockStreamingBreak: "message_end"` (скинути один раз, можливо, кількома фрагментами, якщо відповідь дуже довга).
- **No block streaming:** `blockStreamingDefault: "off"` (лише фінальна відповідь).

**Примітка щодо каналів:** Block streaming **вимкнено, доки**
`*.blockStreaming` явно не встановлено в `true`. Канали можуть передавати живий preview
(`channels.<channel>.streaming`) без відповідей блоками.

Нагадування про розташування конфігурації: значення за замовчуванням `blockStreaming*` знаходяться в `agents.defaults`, а не в корені конфігурації.

## Режими preview streaming

Канонічний ключ: `channels.<channel>.streaming`

Режими:

- `off`: вимкнути preview streaming.
- `partial`: один preview, який замінюється найсвіжішим текстом.
- `block`: preview оновлюється chunked/appended-кроками.
- `progress`: preview прогресу/статусу під час генерації, фінальна відповідь після завершення.

### Зіставлення каналів

| Канал      | `off` | `partial` | `block` | `progress`        |
| ---------- | ----- | --------- | ------- | ----------------- |
| Telegram   | ✅    | ✅        | ✅      | зіставляється з `partial` |
| Discord    | ✅    | ✅        | ✅      | зіставляється з `partial` |
| Slack      | ✅    | ✅        | ✅      | ✅                |
| Mattermost | ✅    | ✅        | ✅      | ✅                |

Лише для Slack:

- `channels.slack.streaming.nativeTransport` перемикає виклики нативного Slack streaming API, коли `channels.slack.streaming.mode="partial"` (`true` за замовчуванням).
- Нативний Slack streaming і статус потоку помічника в Slack thread вимагають цільового потоку відповіді; DM верхнього рівня не показують такий preview у стилі thread.

Міграція застарілих ключів:

- Telegram: застарілі `streamMode` і скалярні/булеві значення `streaming` виявляються та мігруються шляхами doctor/config compatibility до `streaming.mode`.
- Discord: `streamMode` + булеве `streaming` автоматично мігрують до enum `streaming`.
- Slack: `streamMode` автоматично мігрує до `streaming.mode`; булеве `streaming` автоматично мігрує до `streaming.mode` плюс `streaming.nativeTransport`; застарілий `nativeStreaming` автоматично мігрує до `streaming.nativeTransport`.

### Поведінка під час виконання

Telegram:

- Використовує `sendMessage` + `editMessageText` для оновлень preview у DM, групах і темах.
- Preview streaming пропускається, якщо для Telegram явно увімкнено block streaming (щоб уникнути подвійного streaming).
- `/reasoning stream` може записувати reasoning у preview.

Discord:

- Використовує надсилання + редагування preview-повідомлень.
- Режим `block` використовує чернетковий chunking (`draftChunk`).
- Preview streaming пропускається, якщо для Discord явно увімкнено block streaming.
- Фінальні payload для медіа, помилок і explicit reply скасовують очікувані preview без скидання нової чернетки, а потім використовують звичайну доставку.

Slack:

- `partial` може використовувати нативний Slack streaming (`chat.startStream`/`append`/`stop`), якщо доступний.
- `block` використовує preview чернеток у стилі append.
- `progress` використовує текст preview статусу, а потім фінальну відповідь.
- Нативний і чернетковий preview streaming пригнічують block replies для цього ходу, тому відповідь Slack передається лише одним шляхом доставки.
- Фінальні payload для медіа/помилок і фінали progress не створюють тимчасових чернеткових повідомлень; лише текстові/блокові фінали, які можуть редагувати preview, скидають очікуваний текст чернетки.

Mattermost:

- Передає thinking, активність інструментів і частковий текст відповіді в один чернетковий preview post, який фіналізується на місці, коли фінальну відповідь уже безпечно надсилати.
- Повертається до надсилання нового фінального post, якщо preview post було видалено або він інакше недоступний на момент фіналізації.
- Фінальні payload для медіа/помилок скасовують очікувані оновлення preview перед звичайною доставкою замість скидання тимчасового preview post.

Matrix:

- Чернеткові preview фіналізуються на місці, коли фінальний текст може повторно використати подію preview.
- Фінали лише з медіа, з помилками та з невідповідністю цілі reply скасовують очікувані оновлення preview перед звичайною доставкою; уже видимий застарілий preview редагується.

### Оновлення preview із прогресом інструментів

Preview streaming також може включати оновлення **tool-progress** — короткі рядки статусу на кшталт "searching the web", "reading file" або "calling tool", — які з’являються в тому самому preview-повідомленні під час роботи інструментів, до фінальної відповіді. Це робить багатокрокові ходи з інструментами візуально активними, а не мовчазними між першим preview мислення і фінальною відповіддю.

Підтримувані поверхні:

- **Discord**, **Slack** і **Telegram** за замовчуванням передають tool-progress у live preview edit, коли preview streaming активний.
- Для Telegram оновлення preview з tool-progress постачаються увімкненими з `v2026.4.22`; збереження їх увімкненими підтримує вже випущену поведінку.
- **Mattermost** уже включає активність інструментів у свій один чернетковий preview post (див. вище).
- Редагування tool-progress наслідують активний режим preview streaming; вони пропускаються, коли preview streaming має значення `off` або коли block streaming уже взяв повідомлення під контроль.
- Щоб зберегти preview streaming, але приховати рядки tool-progress, установіть `streaming.preview.toolProgress` в `false` для цього каналу. Щоб повністю вимкнути редагування preview, установіть `streaming.mode` в `off`.

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

- [Повідомлення](/uk/concepts/messages) — життєвий цикл повідомлення й доставка
- [Повторні спроби](/uk/concepts/retry) — поведінка повторних спроб у разі збою доставки
- [Канали](/uk/channels) — підтримка streaming для кожного каналу
