---
read_when:
    - Інтеграція інструментів, які очікують OpenAI Chat Completions
summary: Надайте з Gateway HTTP-ендпоінт `/v1/chat/completions`, сумісний з OpenAI
title: Chat Completions OpenAI
x-i18n:
    generated_at: "2026-04-23T19:24:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36f09a82d96bbbc78ba325572dda1524857a534629398582a0bfc007f427b61c
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# Chat Completions OpenAI (HTTP)

Gateway OpenClaw може надавати невеликий ендпоінт Chat Completions, сумісний з OpenAI.

Цей ендпоінт **вимкнено за замовчуванням**. Спочатку увімкніть його в конфігурації.

- `POST /v1/chat/completions`
- Той самий порт, що й у Gateway (мультиплексування WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Коли в Gateway увімкнено сумісну з OpenAI HTTP-поверхню, він також надає:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Під капотом запити виконуються як звичайний запуск агента Gateway (той самий кодовий шлях, що й `openclaw agent`), тому маршрутизація/дозволи/конфігурація збігаються з вашим Gateway.

## Автентифікація

Використовує конфігурацію автентифікації Gateway.

Поширені шляхи HTTP-автентифікації:

- автентифікація за спільним секретом (`gateway.auth.mode="token"` або `"password"`):
  `Authorization: Bearer <token-or-password>`
- довірена HTTP-автентифікація з передаванням ідентичності (`gateway.auth.mode="trusted-proxy"`):
  спрямовуйте трафік через налаштований proxy з урахуванням ідентичності й дозвольте йому впроваджувати
  потрібні заголовки ідентичності
- відкрита автентифікація на приватному ingress (`gateway.auth.mode="none"`):
  заголовок автентифікації не потрібен

Примітки:

- Коли `gateway.auth.mode="token"`, використовуйте `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
- Коли `gateway.auth.mode="password"`, використовуйте `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
- Коли `gateway.auth.mode="trusted-proxy"`, HTTP-запит має надходити з
  налаштованого довіреного джерела proxy не в loopback; proxy loopback на тому самому хості
  не задовольняють цей режим.
- Якщо налаштовано `gateway.auth.rateLimit` і стається забагато збоїв автентифікації, ендпоінт повертає `429` з `Retry-After`.

## Межа безпеки (важливо)

Розглядайте цей ендпоінт як поверхню **повного операторського доступу** до екземпляра gateway.

- HTTP bearer auth тут не є вузькою моделлю області видимості на користувача.
- Дійсний токен/пароль Gateway для цього ендпоінта слід розглядати як облікові дані власника/оператора.
- Запити проходять через той самий шлях агента control plane, що й довірені дії оператора.
- На цьому ендпоінті немає окремої межі інструментів для не-власника/окремого користувача; щойно викликач проходить автентифікацію Gateway тут, OpenClaw розглядає цього викликача як довіреного оператора цього gateway.
- Для режимів автентифікації зі спільним секретом (`token` і `password`) ендпоінт відновлює звичайні повні операторські значення за замовчуванням, навіть якщо викликач надсилає вужчий заголовок `x-openclaw-scopes`.
- Довірені HTTP-режими з передаванням ідентичності (наприклад, автентифікація trusted proxy або `gateway.auth.mode="none"`) враховують `x-openclaw-scopes`, коли заголовок присутній, а в іншому разі повертаються до звичайного набору операторських областей видимості за замовчуванням.
- Якщо політика цільового агента дозволяє чутливі інструменти, цей ендпоінт може їх використовувати.
- Тримайте цей ендпоінт лише в loopback/tailnet/private ingress; не виставляйте його безпосередньо в публічний інтернет.

Матриця автентифікації:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - доводить володіння спільним секретом оператора gateway
  - ігнорує вужчі `x-openclaw-scopes`
  - відновлює повний набір операторських областей видимості за замовчуванням:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - розглядає ходи чату на цьому ендпоінті як ходи відправника-власника
- довірені HTTP-режими з передаванням ідентичності (наприклад, автентифікація trusted proxy або `gateway.auth.mode="none"` на private ingress)
  - автентифікують певну зовнішню довірену ідентичність або межу розгортання
  - враховують `x-openclaw-scopes`, коли заголовок присутній
  - повертаються до звичайного набору операторських областей видимості за замовчуванням, коли заголовок відсутній
  - втрачають семантику власника лише тоді, коли викликач явно звужує області видимості й не вказує `operator.admin`

Див. [Security](/uk/gateway/security) і [Remote access](/uk/gateway/remote).

## Контракт моделі з пріоритетом агента

OpenClaw розглядає поле `model` OpenAI як **ціль агента**, а не як необроблений ідентифікатор моделі провайдера.

- `model: "openclaw"` спрямовує до налаштованого агента за замовчуванням.
- `model: "openclaw/default"` також спрямовує до налаштованого агента за замовчуванням.
- `model: "openclaw/<agentId>"` спрямовує до конкретного агента.

Необов’язкові заголовки запиту:

- `x-openclaw-model: <provider/model-or-bare-id>` перевизначає модель бекенду для вибраного агента.
- `x-openclaw-agent-id: <agentId>` як і раніше підтримується як сумісне перевизначення.
- `x-openclaw-session-key: <sessionKey>` повністю керує маршрутизацією сесії.
- `x-openclaw-message-channel: <channel>` задає синтетичний контекст вхідного каналу для prompt і політик, що враховують канали.

Сумісні псевдоніми, які все ще приймаються:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Увімкнення ендпоінта

Задайте `gateway.http.endpoints.chatCompletions.enabled` як `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## Вимкнення ендпоінта

Задайте `gateway.http.endpoints.chatCompletions.enabled` як `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Поведінка сесії

За замовчуванням ендпоінт **не зберігає стан між запитами** (для кожного виклику генерується новий ключ сесії).

Якщо запит містить рядок OpenAI `user`, Gateway виводить із нього стабільний ключ сесії, тож повторні виклики можуть спільно використовувати сесію агента.

## Чому ця поверхня важлива

Це найцінніший набір сумісності для self-hosted фронтендів та інструментів:

- Більшість налаштувань Open WebUI, LobeChat і LibreChat очікують `/v1/models`.
- Багато систем RAG очікують `/v1/embeddings`.
- Наявні клієнти чату OpenAI зазвичай можуть почати з `/v1/chat/completions`.
- Клієнти, більш орієнтовані на агентів, дедалі частіше надають перевагу `/v1/responses`.

## Список моделей і маршрутизація агентів

<AccordionGroup>
  <Accordion title="Що повертає `/v1/models`?">
    Список цілей агентів OpenClaw.

    Повернені id — це записи `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
    Використовуйте їх безпосередньо як значення OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` перелічує агентів чи підагентів?">
    Він перелічує цілі агентів верхнього рівня, а не моделі бекенд-провайдерів і не підагентів.

    Підагенти залишаються внутрішньою топологією виконання. Вони не з’являються як псевдомоделі.

  </Accordion>
  <Accordion title="Чому включено `openclaw/default`?">
    `openclaw/default` — це стабільний псевдонім для налаштованого агента за замовчуванням.

    Це означає, що клієнти можуть і далі використовувати один передбачуваний id, навіть якщо реальний id агента за замовчуванням змінюється між середовищами.

  </Accordion>
  <Accordion title="Як перевизначити модель бекенду?">
    Використовуйте `x-openclaw-model`.

    Приклади:
    `x-openclaw-model: openai/gpt-5.5`
    `x-openclaw-model: gpt-5.5`

    Якщо ви його не вказуєте, вибраний агент запускається зі звичайним налаштованим вибором моделі.

  </Accordion>
  <Accordion title="Як embeddings вписуються в цей контракт?">
    `/v1/embeddings` використовує ті самі id `model` цілей агентів.

    Використовуйте `model: "openclaw/default"` або `model: "openclaw/<agentId>"`.
    Коли потрібна конкретна модель embeddings, надсилайте її в `x-openclaw-model`.
    Без цього заголовка запит проходить до звичайного налаштування embeddings вибраного агента.

  </Accordion>
</AccordionGroup>

## Стримінг (SSE)

Задайте `stream: true`, щоб отримувати Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Кожен рядок події має формат `data: <json>`
- Потік завершується рядком `data: [DONE]`

## Швидке налаштування Open WebUI

Для базового підключення Open WebUI:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL для Docker на macOS: `http://host.docker.internal:18789/v1`
- API key: ваш bearer token Gateway
- Model: `openclaw/default`

Очікувана поведінка:

- `GET /v1/models` має показувати `openclaw/default`
- Open WebUI має використовувати `openclaw/default` як id моделі чату
- Якщо вам потрібен конкретний бекенд-провайдер/модель для цього агента, задайте звичайну модель агента за замовчуванням або надішліть `x-openclaw-model`

Швидка перевірка:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Якщо це повертає `openclaw/default`, більшість конфігурацій Open WebUI зможуть підключитися з тим самим base URL і токеном.

## Приклади

Без стримінгу:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Зі стримінгом:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.5' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Список моделей:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Отримати одну модель:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Створити embeddings:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

Примітки:

- `/v1/models` повертає цілі агентів OpenClaw, а не необроблені каталоги провайдерів.
- `openclaw/default` присутній завжди, тож один стабільний id працює в різних середовищах.
- Перевизначення бекенд-провайдера/моделі слід задавати в `x-openclaw-model`, а не в полі OpenAI `model`.
- `/v1/embeddings` підтримує `input` як рядок або масив рядків.
