---
read_when:
    - Інтеграція інструментів, які очікують OpenAI Chat Completions
summary: Відкрити сумісний з OpenAI HTTP-endpoint `/v1/chat/completions` із Gateway
title: OpenAI chat completions
x-i18n:
    generated_at: "2026-04-23T22:59:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 23bd2005be766df10b962ddf44b2c53d8f86b09978c1ff5d48dcb8c0e7692ea6
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions (HTTP)

Gateway OpenClaw може надавати невеликий endpoint Chat Completions, сумісний з OpenAI.

Цей endpoint **типово вимкнений**. Спочатку ввімкніть його в конфігурації.

- `POST /v1/chat/completions`
- Той самий порт, що й у Gateway (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

Коли в Gateway увімкнено сумісну з OpenAI HTTP-поверхню, він також надає:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Під капотом запити виконуються як звичайний запуск агента Gateway (той самий шлях коду, що й у `openclaw agent`), тож маршрутизація/дозволи/конфігурація збігаються з вашим Gateway.

## Автентифікація

Використовує конфігурацію автентифікації Gateway.

Поширені шляхи HTTP-автентифікації:

- автентифікація зі спільним секретом (`gateway.auth.mode="token"` або `"password"`):
  `Authorization: Bearer <token-or-password>`
- HTTP-автентифікація з довіреною ідентичністю (`gateway.auth.mode="trusted-proxy"`):
  спрямовуйте трафік через налаштований proxy з урахуванням ідентичності й дозвольте йому вставляти
  потрібні заголовки ідентичності
- відкрита автентифікація для приватного ingress (`gateway.auth.mode="none"`):
  заголовок автентифікації не потрібен

Примітки:

- Коли `gateway.auth.mode="token"`, використовуйте `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
- Коли `gateway.auth.mode="password"`, використовуйте `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
- Коли `gateway.auth.mode="trusted-proxy"`, HTTP-запит має надходити від
  налаштованого довіреного джерела proxy не на loopback; proxy на loopback того самого хоста
  не задовольняють цей режим.
- Якщо налаштовано `gateway.auth.rateLimit` і відбувається надто багато збоїв автентифікації, endpoint повертає `429` з `Retry-After`.

## Межа безпеки (важливо)

Розглядайте цей endpoint як поверхню **повного операторського доступу** до екземпляра gateway.

- HTTP bearer auth тут — не вузька модель scope для окремого користувача.
- Дійсний токен/пароль Gateway для цього endpoint слід розглядати як облікові дані власника/оператора.
- Запити проходять тим самим шляхом агента control-plane, що й довірені дії оператора.
- Для цього endpoint немає окремої межі інструментів для не-власника/окремого користувача; щойно викликач проходить автентифікацію Gateway тут, OpenClaw розглядає його як довіреного оператора цього gateway.
- Для режимів автентифікації зі спільним секретом (`token` і `password`) endpoint відновлює звичайні повні типові operator scope, навіть якщо викликач надсилає вужчий заголовок `x-openclaw-scopes`.
- Довірені HTTP-режими з ідентичністю (наприклад, автентифікація через trusted proxy або `gateway.auth.mode="none"`) враховують `x-openclaw-scopes`, коли цей заголовок присутній, інакше повертаються до звичайного типового набору operator scope.
- Якщо політика цільового агента дозволяє чутливі інструменти, цей endpoint може їх використовувати.
- Тримайте цей endpoint лише на loopback/tailnet/private ingress; не відкривайте його напряму в публічний інтернет.

Матриця автентифікації:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - доводить володіння спільним секретом оператора gateway
  - ігнорує вужчі `x-openclaw-scopes`
  - відновлює повний типовий набір operator scope:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - розглядає цикли чату на цьому endpoint як цикли відправника-власника
- довірені HTTP-режими з ідентичністю (наприклад, автентифікація через trusted proxy або `gateway.auth.mode="none"` на private ingress)
  - автентифікують певну зовнішню довірену ідентичність або межу розгортання
  - враховують `x-openclaw-scopes`, коли заголовок присутній
  - повертаються до звичайного типового набору operator scope, коли заголовок відсутній
  - втрачають семантику власника лише тоді, коли викликач явно звужує scope і пропускає `operator.admin`

Див. [Безпека](/uk/gateway/security) і [Віддалений доступ](/uk/gateway/remote).

## Контракт model із пріоритетом агента

OpenClaw розглядає поле OpenAI `model` як **ціль агента**, а не сирий id моделі провайдера.

- `model: "openclaw"` маршрутизується до налаштованого типового агента.
- `model: "openclaw/default"` також маршрутизується до налаштованого типового агента.
- `model: "openclaw/<agentId>"` маршрутизується до конкретного агента.

Необов’язкові заголовки запиту:

- `x-openclaw-model: <provider/model-or-bare-id>` перевизначає бекенд-модель для вибраного агента.
- `x-openclaw-agent-id: <agentId>` усе ще підтримується як перевизначення для сумісності.
- `x-openclaw-session-key: <sessionKey>` повністю керує маршрутизацією сесії.
- `x-openclaw-message-channel: <channel>` задає контекст синтетичного вхідного каналу для prompt-ів і політик, чутливих до каналу.

Псевдоніми сумісності, які все ще приймаються:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Увімкнення endpoint

Установіть `gateway.http.endpoints.chatCompletions.enabled` у `true`:

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

## Вимкнення endpoint

Установіть `gateway.http.endpoints.chatCompletions.enabled` у `false`:

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

## Поведінка сесій

Типово endpoint є **безстанним для кожного запиту** (для кожного виклику генерується новий ключ сесії).

Якщо запит містить рядок OpenAI `user`, Gateway виводить з нього стабільний ключ сесії, тож повторні виклики можуть спільно використовувати сесію агента.

## Чому ця поверхня важлива

Це набір сумісності з найвищою віддачею для self-hosted фронтендів та інструментів:

- Більшість конфігурацій Open WebUI, LobeChat і LibreChat очікують `/v1/models`.
- Багато RAG-систем очікують `/v1/embeddings`.
- Наявні клієнти чату OpenAI зазвичай можуть почати з `/v1/chat/completions`.
- Клієнти, більш орієнтовані на агента, дедалі частіше віддають перевагу `/v1/responses`.

## Список моделей і маршрутизація агентів

<AccordionGroup>
  <Accordion title="Що повертає `/v1/models`?">
    Список цілей агентів OpenClaw.

    Повернуті id — це записи `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
    Використовуйте їх безпосередньо як значення OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` перелічує агентів чи субагентів?">
    Він перелічує цілі агентів верхнього рівня, а не бекенд-моделі провайдерів і не субагентів.

    Субагенти залишаються внутрішньою топологією виконання. Вони не з’являються як псевдомоделі.

  </Accordion>
  <Accordion title="Чому включено `openclaw/default`?">
    `openclaw/default` — це стабільний псевдонім для налаштованого типового агента.

    Це означає, що клієнти можуть і далі використовувати один передбачуваний id, навіть якщо реальний id типового агента змінюється між середовищами.

  </Accordion>
  <Accordion title="Як перевизначити бекенд-модель?">
    Використовуйте `x-openclaw-model`.

    Приклади:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Якщо ви його пропустите, вибраний агент працюватиме зі своїм звичайним налаштованим вибором моделі.

  </Accordion>
  <Accordion title="Як embeddings вписуються в цей контракт?">
    `/v1/embeddings` використовує ті самі id `model` для цілей агентів.

    Використовуйте `model: "openclaw/default"` або `model: "openclaw/<agentId>"`.
    Коли вам потрібна конкретна embedding-модель, передайте її в `x-openclaw-model`.
    Без цього заголовка запит передається до звичайної конфігурації embeddings вибраного агента.

  </Accordion>
</AccordionGroup>

## Потокова передача (SSE)

Установіть `stream: true`, щоб отримувати Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Кожен рядок події має вигляд `data: <json>`
- Потік завершується `data: [DONE]`

## Швидке налаштування Open WebUI

Для базового підключення Open WebUI:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL Docker на macOS: `http://host.docker.internal:18789/v1`
- API key: ваш bearer token Gateway
- Модель: `openclaw/default`

Очікувана поведінка:

- `GET /v1/models` має повертати `openclaw/default`
- Open WebUI має використовувати `openclaw/default` як id моделі чату
- Якщо ви хочете конкретний бекенд-провайдер/модель для цього агента, задайте звичайну типову модель агента або надішліть `x-openclaw-model`

Швидка перевірка:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Якщо це повертає `openclaw/default`, більшість конфігурацій Open WebUI зможуть підключитися з тим самим base URL і token.

## Приклади

Без потокової передачі:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Потокова передача:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Перелічити моделі:

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

- `/v1/models` повертає цілі агентів OpenClaw, а не сирі каталоги провайдерів.
- `openclaw/default` присутній завжди, тому один стабільний id працює в різних середовищах.
- Перевизначення бекенд-провайдера/моделі належать до `x-openclaw-model`, а не до поля OpenAI `model`.
- `/v1/embeddings` підтримує `input` як рядок або масив рядків.
