---
read_when:
    - Інтеграція клієнтів, які використовують API OpenResponses
    - Вам потрібні входи на основі елементів, виклики інструментів клієнта або SSE-події
summary: Експортуйте сумісний з OpenResponses HTTP-ендпойнт `/v1/responses` з Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-25T00:26:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: b48685ab42d6f031849990b60a57af9501c216f058dc38abce184b963b05cedb
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

Gateway OpenClaw може надавати сумісний з OpenResponses ендпойнт `POST /v1/responses`.

Цей ендпойнт **вимкнено за замовчуванням**. Спочатку увімкніть його в конфігурації.

- `POST /v1/responses`
- Той самий порт, що й у Gateway (мультиплексування WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

Під капотом запити виконуються як звичайний запуск агента Gateway (той самий шлях коду, що й у
`openclaw agent`), тож маршрутизація/дозволи/конфігурація відповідають вашому Gateway.

## Автентифікація, безпека та маршрутизація

Операційна поведінка відповідає [OpenAI Chat Completions](/uk/gateway/openai-http-api):

- використовуйте відповідний шлях HTTP-автентифікації Gateway:
  - автентифікація зі спільним секретом (`gateway.auth.mode="token"` або `"password"`): `Authorization: Bearer <token-or-password>`
  - автентифікація через trusted-proxy (`gateway.auth.mode="trusted-proxy"`): заголовки identity-aware proxy із налаштованого trusted proxy джерела не з loopback
  - відкрита автентифікація для приватного ingress (`gateway.auth.mode="none"`): без заголовка автентифікації
- розглядайте ендпойнт як повний операторський доступ до екземпляра gateway
- для режимів автентифікації зі спільним секретом (`token` і `password`) ігноруйте вужчі значення `x-openclaw-scopes`, оголошені bearer-токеном, і відновлюйте звичайні повні операторські значення за замовчуванням
- для trusted режимів HTTP з ідентичністю (наприклад, автентифікація trusted proxy або `gateway.auth.mode="none"`) враховуйте `x-openclaw-scopes`, якщо заголовок присутній, інакше повертайтеся до звичайного набору operator scope за замовчуванням
- вибирайте агентів за допомогою `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` або `x-openclaw-agent-id`
- використовуйте `x-openclaw-model`, якщо хочете перевизначити backend model вибраного агента
- використовуйте `x-openclaw-session-key` для явної маршрутизації сесії
- використовуйте `x-openclaw-message-channel`, якщо потрібен не типовий контекст synthetic ingress channel

Матриця автентифікації:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - підтверджує володіння спільним операторським секретом gateway
  - ігнорує вужчі `x-openclaw-scopes`
  - відновлює повний набір operator scope за замовчуванням:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - розглядає chat turns на цьому ендпойнті як turns із відправником-власником
- trusted режими HTTP з ідентичністю (наприклад, автентифікація trusted proxy або `gateway.auth.mode="none"` у приватному ingress)
  - враховують `x-openclaw-scopes`, коли заголовок присутній
  - повертаються до звичайного набору operator scope за замовчуванням, коли заголовок відсутній
  - втрачають семантику власника лише тоді, коли виклик явно звужує scopes і пропускає `operator.admin`

Увімкнути або вимкнути цей ендпойнт можна через `gateway.http.endpoints.responses.enabled`.

Така сама поверхня сумісності також включає:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Канонічне пояснення того, як поєднуються моделі з прив’язкою до агента, `openclaw/default`, пряме передавання embeddings і перевизначення backend model, дивіться в [OpenAI Chat Completions](/uk/gateway/openai-http-api#agent-first-model-contract) і [Список моделей і маршрутизація агентів](/uk/gateway/openai-http-api#model-list-and-agent-routing).

## Поведінка сесії

За замовчуванням ендпойнт **не зберігає стан між запитами** (для кожного виклику генерується новий ключ сесії).

Якщо запит містить рядок OpenResponses `user`, Gateway виводить із нього стабільний ключ сесії,
щоб повторні виклики могли спільно використовувати сесію агента.

## Форма запиту (підтримується)

Запит відповідає API OpenResponses з item-based input. Поточна підтримка:

- `input`: рядок або масив об’єктів item.
- `instructions`: об’єднується із системним prompt.
- `tools`: визначення клієнтських інструментів (function tools).
- `tool_choice`: фільтрація або обов’язковий виклик клієнтських інструментів.
- `stream`: вмикає SSE-streaming.
- `max_output_tokens`: ліміт виходу best-effort (залежить від провайдера).
- `user`: стабільна маршрутизація сесії.

Приймаються, але **наразі ігноруються**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Підтримується:

- `previous_response_id`: OpenClaw повторно використовує сесію попередньої відповіді, коли запит залишається в межах того самого scope агента/користувача/запитаної сесії.

## Items (`input`)

### `message`

Ролі: `system`, `developer`, `user`, `assistant`.

- `system` і `developer` додаються до системного prompt.
- Найновіший item `user` або `function_call_output` стає «поточним повідомленням».
- Попередні повідомлення user/assistant включаються як історія для контексту.

### `function_call_output` (turn-based tools)

Надішліть результати інструмента назад моделі:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` і `item_reference`

Приймаються для сумісності зі схемою, але ігноруються під час побудови prompt.

## Tools (клієнтські function tools)

Надавайте інструменти через `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Якщо агент вирішить викликати інструмент, відповідь поверне output item `function_call`.
Потім ви надсилаєте наступний запит із `function_call_output`, щоб продовжити turn.

## Зображення (`input_image`)

Підтримуються джерела base64 або URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Дозволені MIME-типи (поточні): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Максимальний розмір (поточний): 10MB.

## Файли (`input_file`)

Підтримуються джерела base64 або URL:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

Дозволені MIME-типи (поточні): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

Максимальний розмір (поточний): 5MB.

Поточна поведінка:

- Вміст файлу декодується і додається до **системного prompt**, а не до повідомлення користувача,
  тому він залишається ефемерним (не зберігається в історії сесії).
- Декодований текст файлу обгортається як **ненадійний зовнішній вміст** перед додаванням,
  тож байти файлу розглядаються як дані, а не як довірені інструкції.
- Вставлений блок використовує явні маркери меж, наприклад
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, і містить
  рядок метаданих `Source: External`.
- Цей шлях file-input навмисно пропускає довгий банер `SECURITY NOTICE:`,
  щоб зберегти бюджет prompt; маркери меж і метадані при цьому залишаються.
- Для PDF спочатку виконується парсинг тексту. Якщо тексту знайдено мало, перші сторінки
  растеризуються у зображення й передаються моделі, а вставлений файловий блок використовує
  заповнювач `[PDF content rendered to images]`.

Парсинг PDF забезпечує вбудований Plugin `document-extract`, який використовує
Node-friendly legacy build `pdfjs-dist` (без worker). Сучасний build PDF.js
очікує browser workers/DOM globals, тому в Gateway він не використовується.

Типові значення для URL fetch:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (загальна кількість URL-based частин `input_file` + `input_image` на запит)
- Запити захищені (DNS resolution, блокування приватних IP, обмеження redirect, timeout).
- Для кожного типу input підтримуються необов’язкові allowlist імен хостів (`files.urlAllowlist`, `images.urlAllowlist`).
  - Точний хост: `"cdn.example.com"`
  - Піддомени за шаблоном: `"*.assets.example.com"` (не відповідає apex-домену)
  - Порожні або пропущені allowlist означають відсутність обмеження allowlist імен хостів.
- Щоб повністю вимкнути URL-based fetches, установіть `files.allowUrl: false` і/або `images.allowUrl: false`.

## Ліміти файлів і зображень (конфігурація)

Типові значення можна налаштувати в `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

Типові значення, якщо їх пропущено:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- Джерела `input_image` у форматах HEIC/HEIF приймаються та нормалізуються до JPEG перед передаванням провайдеру.

Примітка щодо безпеки:

- URL allowlist застосовуються перед fetch і на переходах redirect.
- Додавання hostname в allowlist не обходить блокування приватних/внутрішніх IP.
- Для gateway, доступних з інтернету, застосовуйте контроль вихідного мережевого трафіку на додачу до захисту на рівні застосунку.
  Див. [Безпека](/uk/gateway/security).

## Streaming (SSE)

Установіть `stream: true`, щоб отримувати Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Кожен рядок події має формат `event: <type>` і `data: <json>`
- Потік завершується рядком `data: [DONE]`

Типи подій, що наразі надсилаються:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (у разі помилки)

## Використання

`usage` заповнюється, коли базовий провайдер повідомляє кількість токенів.
OpenClaw нормалізує поширені псевдоніми в стилі OpenAI до того, як ці лічильники
потрапляють у downstream status/session surfaces, зокрема `input_tokens` / `output_tokens`
і `prompt_tokens` / `completion_tokens`.

## Помилки

Помилки використовують JSON-об’єкт такого вигляду:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Поширені випадки:

- `401` відсутня або недійсна автентифікація
- `400` некоректне тіло запиту
- `405` неправильний метод

## Приклади

Без streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

Зі streaming:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## Пов’язане

- [OpenAI chat completions](/uk/gateway/openai-http-api)
- [OpenAI](/uk/providers/openai)
