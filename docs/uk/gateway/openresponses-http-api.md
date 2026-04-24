---
read_when:
    - Інтеграція клієнтів, які працюють з API OpenResponses
    - Вам потрібні inputs на основі елементів, клієнтські виклики інструментів або події SSE
summary: Надайте з Gateway HTTP endpoint `/v1/responses`, сумісний з OpenResponses
title: API OpenResponses
x-i18n:
    generated_at: "2026-04-24T04:13:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73f2e075b78e5153633af17c3f59cace4516e5aaa88952d643cfafb9d0df8022
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# API OpenResponses (HTTP)

Gateway OpenClaw може надавати сумісний з OpenResponses endpoint `POST /v1/responses`.

Цей endpoint **типово вимкнений**. Спочатку ввімкніть його в конфігурації.

- `POST /v1/responses`
- Той самий порт, що й у Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/responses`

Під капотом запити виконуються як звичайний запуск агента Gateway (той самий codepath, що й
`openclaw agent`), тож маршрутизація/дозволи/конфігурація збігаються з вашим Gateway.

## Автентифікація, безпека та маршрутизація

Операційна поведінка збігається з [OpenAI Chat Completions](/uk/gateway/openai-http-api):

- використовуйте відповідний шлях HTTP-автентифікації Gateway:
  - автентифікація спільним секретом (`gateway.auth.mode="token"` або `"password"`): `Authorization: Bearer <token-or-password>`
  - автентифікація trusted-proxy (`gateway.auth.mode="trusted-proxy"`): заголовки identity-aware proxy з налаштованого trusted proxy source не на loopback
  - відкрита автентифікація private-ingress (`gateway.auth.mode="none"`): без заголовка автентифікації
- розглядайте цей endpoint як повний операторський доступ до екземпляра gateway
- для режимів автентифікації зі спільним секретом (`token` і `password`) ігноруйте вужчі значення `x-openclaw-scopes`, оголошені bearer, і відновлюйте звичайні типові повні операторські значення
- для HTTP-режимів із trusted identity-bearing (наприклад, автентифікація trusted proxy або `gateway.auth.mode="none"`) враховуйте `x-openclaw-scopes`, якщо заголовок наявний, інакше використовуйте звичайний типовий набір operator scope
- вибирайте агентів через `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` або `x-openclaw-agent-id`
- використовуйте `x-openclaw-model`, коли хочете перевизначити backend-model вибраного агента
- використовуйте `x-openclaw-session-key` для явної маршрутизації сесії
- використовуйте `x-openclaw-message-channel`, коли потрібен нестандартний synthetic ingress channel context

Матриця автентифікації:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - підтверджує володіння спільним операторським секретом gateway
  - ігнорує вужчі `x-openclaw-scopes`
  - відновлює повний типовий набір operator scope:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - розглядає ходи чату на цьому endpoint як ходи відправника-власника
- HTTP-режими з trusted identity-bearing (наприклад, автентифікація trusted proxy або `gateway.auth.mode="none"` на private ingress)
  - враховують `x-openclaw-scopes`, коли заголовок наявний
  - використовують звичайний типовий набір operator scope, коли заголовок відсутній
  - втрачають семантику власника лише тоді, коли викликач явно звужує scopes і не включає `operator.admin`

Увімкніть або вимкніть цей endpoint через `gateway.http.endpoints.responses.enabled`.

Та сама поверхня сумісності також включає:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

Канонічне пояснення того, як поєднуються agent-target models, `openclaw/default`, pass-through для embeddings і перевизначення backend model, див. у [OpenAI Chat Completions](/uk/gateway/openai-http-api#agent-first-model-contract) і [Список моделей і маршрутизація агентів](/uk/gateway/openai-http-api#model-list-and-agent-routing).

## Поведінка сесії

Типово endpoint є **безстановим для кожного запиту** (для кожного виклику генерується новий ключ сесії).

Якщо запит містить рядок OpenResponses `user`, Gateway виводить із нього стабільний ключ сесії,
щоб повторні виклики могли спільно використовувати сесію агента.

## Форма запиту (підтримується)

Запит відповідає API OpenResponses з item-based input. Поточна підтримка:

- `input`: рядок або масив item objects.
- `instructions`: об’єднується із system prompt.
- `tools`: визначення клієнтських інструментів (function tools).
- `tool_choice`: відфільтрувати або вимагати клієнтські інструменти.
- `stream`: вмикає потокову передачу SSE.
- `max_output_tokens`: обмеження виводу за принципом best-effort (залежить від провайдера).
- `user`: стабільна маршрутизація сесії.

Приймаються, але **зараз ігноруються**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

Підтримується:

- `previous_response_id`: OpenClaw повторно використовує сесію попередньої відповіді, коли запит лишається в межах того самого scope агента/користувача/запитаної сесії.

## Items (input)

### `message`

Ролі: `system`, `developer`, `user`, `assistant`.

- `system` і `developer` додаються до system prompt.
- Найновіший item `user` або `function_call_output` стає «поточним повідомленням».
- Попередні повідомлення user/assistant включаються як історія для контексту.

### `function_call_output` (покрокові інструменти)

Надсилайте результати інструмента назад до моделі:

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

Якщо агент вирішує викликати інструмент, відповідь повертає output item `function_call`.
Потім ви надсилаєте наступний запит з `function_call_output`, щоб продовжити хід.

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

- Вміст файлу декодується й додається до **system prompt**, а не до повідомлення користувача,
  тож він лишається ефемерним (не зберігається в історії сесії).
- Декодований текст файлу обгортається як **ненадійний зовнішній вміст** перед додаванням,
  тому байти файлу розглядаються як дані, а не як довірені інструкції.
- Вставлений блок використовує явні маркери меж, такі як
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, і містить
  рядок метаданих `Source: External`.
- Цей шлях file-input навмисно пропускає довгий банер `SECURITY NOTICE:`,
  щоб зберегти бюджет prompt; маркери меж і метадані при цьому лишаються на місці.
- Для PDF спочатку виконується парсинг тексту. Якщо тексту знайдено мало, перші сторінки
  растеризуються в зображення й передаються моделі, а вставлений файловий блок використовує
  заповнювач `[PDF content rendered to images]`.

Парсинг PDF використовує legacy build `pdfjs-dist`, сумісний із Node (без worker). Сучасний
build PDF.js очікує browser workers/DOM globals, тому в Gateway не використовується.

Типові значення для URL fetch:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (загальна кількість URL-based частин `input_file` + `input_image` на запит)
- Запити захищені (DNS resolution, блокування приватних IP, обмеження redirect, тайм-аути).
- Для кожного типу input підтримуються необов’язкові allowlist імен хостів (`files.urlAllowlist`, `images.urlAllowlist`).
  - Точний хост: `"cdn.example.com"`
  - Піддомени за шаблоном: `"*.assets.example.com"` (не відповідає apex)
  - Порожні або відсутні allowlist означають відсутність обмеження allowlist імен хостів.
- Щоб повністю вимкнути URL-based fetch, установіть `files.allowUrl: false` і/або `images.allowUrl: false`.

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

Типові значення, якщо параметри не задані:

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
- Джерела `input_image` у форматах HEIC/HEIF приймаються й нормалізуються до JPEG перед передачею провайдеру.

Примітка щодо безпеки:

- Allowlist URL застосовуються перед fetch і на переходах redirect.
- Додавання імені хоста до allowlist не обходить блокування приватних/внутрішніх IP.
- Для gateway, доступних з інтернету, застосовуйте контроль вихідного мережевого трафіку на додачу до захистів на рівні застосунку.
  Див. [Безпека](/uk/gateway/security).

## Потокова передача (SSE)

Установіть `stream: true`, щоб отримувати Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Кожен рядок події має формат `event: <type>` і `data: <json>`
- Потік завершується рядком `data: [DONE]`

Типи подій, які зараз надсилаються:

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
OpenClaw нормалізує поширені псевдоніми у стилі OpenAI до того, як ці лічильники
потрапляють у downstream surfaces статусу/сесії, включно з `input_tokens` / `output_tokens`
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

Без потокової передачі:

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

Потокова передача:

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
