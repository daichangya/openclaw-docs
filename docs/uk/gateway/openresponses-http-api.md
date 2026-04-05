---
read_when:
    - Інтеграція клієнтів, які використовують OpenResponses API
    - Вам потрібні вхідні дані на основі item, виклики клієнтських інструментів або події SSE
summary: Відкриття OpenResponses-сумісного HTTP endpoint `/v1/responses` з Gateway
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-05T18:04:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3f2905fe45accf2699de8a561d15311720f249f9229d26550c16577428ea8a9
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# OpenResponses API (HTTP)

Gateway OpenClaw може надавати OpenResponses-сумісний endpoint `POST /v1/responses`.

Цей endpoint **типово вимкнений**. Спочатку увімкніть його в конфігурації.

- `POST /v1/responses`
- Той самий порт, що й у Gateway (WS + HTTP multiplexer): `http://<gateway-host>:<port>/v1/responses`

Під капотом запити виконуються як звичайний запуск агента Gateway (той самий кодовий шлях, що й
`openclaw agent`), тому маршрутизація/дозволи/конфігурація збігаються з вашим Gateway.

## Автентифікація, безпека та маршрутизація

Операційна поведінка збігається з [OpenAI Chat Completions](/gateway/openai-http-api):

- використовуйте відповідний шлях HTTP-автентифікації Gateway:
  - автентифікація через спільний секрет (`gateway.auth.mode="token"` або `"password"`): `Authorization: Bearer <token-or-password>`
  - автентифікація через trusted-proxy (`gateway.auth.mode="trusted-proxy"`): заголовки проксі з урахуванням ідентичності від налаштованого не-loopback trusted proxy source
  - відкрита автентифікація для приватного ingress (`gateway.auth.mode="none"`): без заголовка автентифікації
- розглядайте цей endpoint як повний операторський доступ до екземпляра gateway
- для режимів автентифікації через спільний секрет (`token` і `password`) ігноруйте вужчі значення `x-openclaw-scopes`, оголошені в bearer, і відновлюйте звичайні типові операторські значення
- для довірених HTTP-режимів з передаванням ідентичності (наприклад, trusted proxy auth або `gateway.auth.mode="none"`) враховуйте `x-openclaw-scopes`, якщо він присутній, і в іншому разі використовуйте звичайний типовий набір операторських scope
- вибирайте агентів через `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` або `x-openclaw-agent-id`
- використовуйте `x-openclaw-model`, якщо хочете перевизначити бекенд-модель вибраного агента
- використовуйте `x-openclaw-session-key` для явної маршрутизації сесії
- використовуйте `x-openclaw-message-channel`, якщо вам потрібен нетиповий синтетичний контекст каналу ingress

Матриця автентифікації:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - доводить володіння спільним операторським секретом gateway
  - ігнорує вужчі `x-openclaw-scopes`
  - відновлює повний типовий набір операторських scope:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - трактує чат-ходи на цьому endpoint як ходи від відправника-власника
- довірені HTTP-режими з передаванням ідентичності (наприклад trusted proxy auth або `gateway.auth.mode="none"` на приватному ingress)
  - враховують `x-openclaw-scopes`, коли цей заголовок присутній
  - використовують звичайний типовий набір операторських scope, коли заголовок відсутній
  - втрачають семантику власника лише тоді, коли виклик явно звужує scope і пропускає `operator.admin`

Увімкнути або вимкнути цей endpoint можна через `gateway.http.endpoints.responses.enabled`.

Та сама поверхня сумісності також включає:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Канонічне пояснення того, як поєднуються моделі, націлені на агентів, `openclaw/default`, passthrough embeddings і перевизначення бекенд-моделі, див. у [OpenAI Chat Completions](/gateway/openai-http-api#agent-first-model-contract) і [Список моделей і маршрутизація агентів](/gateway/openai-http-api#model-list-and-agent-routing).

## Поведінка сесій

Типово endpoint є **безстановим для кожного запиту** (для кожного виклику генерується новий ключ сесії).

Якщо запит містить рядок `user` OpenResponses, Gateway виводить з нього стабільний ключ сесії,
щоб повторні виклики могли спільно використовувати одну сесію агента.

## Форма запиту (що підтримується)

Запит відповідає OpenResponses API з item-орієнтованим input. Наразі підтримується:

- `input`: рядок або масив item-об’єктів.
- `instructions`: об’єднується із системним prompt.
- `tools`: означення клієнтських інструментів (function tools).
- `tool_choice`: фільтрувати або вимагати клієнтські інструменти.
- `stream`: вмикає потокове передавання SSE.
- `max_output_tokens`: best-effort обмеження виводу (залежить від провайдера).
- `user`: стабільна маршрутизація сесії.

Приймаються, але **наразі ігноруються**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Підтримується:

- `previous_response_id`: OpenClaw повторно використовує сесію попередньої відповіді, коли запит лишається в межах тієї самої області агента/користувача/запитаної сесії.

## Items (input)

### `message`

Ролі: `system`, `developer`, `user`, `assistant`.

- `system` і `developer` додаються до системного prompt.
- Найновіший item `user` або `function_call_output` стає “поточним повідомленням”.
- Попередні повідомлення user/assistant включаються як історія для контексту.

### `function_call_output` (інструменти по ходах)

Надішліть результати інструментів назад моделі:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` і `item_reference`

Приймаються для сумісності зі схемою, але ігноруються під час побудови prompt.

## Інструменти (клієнтські function tools)

Надавайте інструменти через `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

Якщо агент вирішить викликати інструмент, у відповіді повернеться item виводу `function_call`.
Потім ви надсилаєте наступний запит із `function_call_output`, щоб продовжити хід.

## Зображення (`input_image`)

Підтримує джерела base64 або URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Дозволені MIME-типи (поточні): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
Максимальний розмір (поточний): 10MB.

## Файли (`input_file`)

Підтримує джерела base64 або URL:

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
  щоб він залишався ефемерним (не зберігався в історії сесії).
- Декодований текст файлу загортається як **недовірений зовнішній вміст** перед додаванням,
  тому байти файлу трактуються як дані, а не як довірені інструкції.
- Вставлений блок файлу використовує явні маркери меж, такі як
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, і містить
  рядок метаданих `Source: External`.
- Цей шлях file-input навмисно пропускає довгий банер `SECURITY NOTICE:`,
  щоб зберегти бюджет prompt; маркери меж і метадані все одно залишаються.
- Для PDF спочатку виконується розбір тексту. Якщо тексту знайдено мало, перші сторінки
  растеризуються в зображення і передаються моделі, а вставлений блок файлу використовує
  заповнювач `[PDF content rendered to images]`.

Розбір PDF використовує дружню до Node legacy-збірку `pdfjs-dist` (без worker). Сучасна
збірка PDF.js очікує browser worker/DOM globals, тому в Gateway вона не використовується.

Типові параметри URL fetch:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (загальна кількість URL-базованих частин `input_file` + `input_image` на запит)
- Запити захищені (DNS resolution, блокування приватних IP, ліміти redirect, тайм-аути).
- Для кожного типу input підтримуються необов’язкові allowlist хостів (`files.urlAllowlist`, `images.urlAllowlist`).
  - Точний хост: `"cdn.example.com"`
  - Піддомени за шаблоном: `"*.assets.example.com"` (не збігається з apex)
  - Порожній або пропущений allowlist означає відсутність обмеження на список дозволених хостів.
- Щоб повністю вимкнути URL-базовані fetch, установіть `files.allowUrl: false` і/або `images.allowUrl: false`.

## Обмеження для файлів і зображень (конфігурація)

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
- Джерела `input_image` у HEIC/HEIF приймаються і нормалізуються до JPEG перед передаванням провайдеру.

Примітка щодо безпеки:

- Списки дозволених URL застосовуються до fetch і на кожному redirect.
- Дозвіл для hostname не обходить блокування приватних/внутрішніх IP.
- Для gateway, відкритих в інтернет, застосовуйте контроль мережевого egress на додачу до захисту на рівні застосунку.
  Див. [Security](/gateway/security).

## Потокове передавання (SSE)

Установіть `stream: true`, щоб отримувати події Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Кожен рядок події має вигляд `event: <type>` і `data: <json>`
- Потік завершується `data: [DONE]`

Наразі виводяться такі типи подій:

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

`usage` заповнюється, коли базовий провайдер повідомляє кількість token.
OpenClaw нормалізує поширені псевдоніми в стилі OpenAI до того, як ці лічильники потрапляють
у downstream-поверхні status/session, включно з `input_tokens` / `output_tokens`
і `prompt_tokens` / `completion_tokens`.

## Помилки

Помилки використовують JSON-об’єкт такого вигляду:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

Поширені випадки:

- `401` відсутня/некоректна автентифікація
- `400` некоректне тіло запиту
- `405` неправильний метод

## Приклади

Без потокового передавання:

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

Потокове передавання:

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
