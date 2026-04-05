---
read_when:
    - Інтегруєте інструменти, які очікують OpenAI Chat Completions
summary: Надання OpenAI-сумісного HTTP endpoint `/v1/chat/completions` через Gateway
title: OpenAI Chat Completions
x-i18n:
    generated_at: "2026-04-05T18:04:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: c374b2f32ce693a8c752e2b0a2532c5f0299ed280f9a0e97b1a9d73bcec37b95
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# OpenAI Chat Completions (HTTP)

Gateway OpenClaw може надавати невеликий OpenAI-сумісний endpoint Chat Completions.

Цей endpoint **типово вимкнений**. Спочатку увімкніть його в config.

- `POST /v1/chat/completions`
- Той самий порт, що й у Gateway (мультиплексування WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Коли OpenAI-сумісну HTTP-поверхню Gateway увімкнено, вона також надає:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Під капотом запити виконуються як звичайний запуск агента Gateway (той самий шлях коду, що й `openclaw agent`), тому маршрутизація/дозволи/config збігаються з вашим Gateway.

## Автентифікація

Використовує конфігурацію auth Gateway.

Поширені шляхи HTTP-auth:

- auth зі спільним секретом (`gateway.auth.mode="token"` або `"password"`):
  `Authorization: Bearer <token-or-password>`
- довірена HTTP-auth з передаванням ідентичності (`gateway.auth.mode="trusted-proxy"`):
  маршрутизуйте через налаштований proxy з підтримкою ідентичності й дозвольте йому вставляти
  потрібні заголовки ідентичності
- open auth для приватного ingress (`gateway.auth.mode="none"`):
  заголовок auth не потрібен

Примітки:

- Коли `gateway.auth.mode="token"`, використовуйте `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
- Коли `gateway.auth.mode="password"`, використовуйте `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
- Коли `gateway.auth.mode="trusted-proxy"`, HTTP-запит має надходити з
  налаштованого довіреного джерела proxy не на loopback; proxy на loopback на тому самому хості
  не задовольняють вимоги цього режиму.
- Якщо налаштовано `gateway.auth.rateLimit` і стається занадто багато помилок auth, endpoint повертає `429` з `Retry-After`.

## Межа безпеки (важливо)

Ставтеся до цього endpoint як до поверхні **повного операторського доступу** для екземпляра gateway.

- HTTP bearer auth тут не є вузькою моделлю області дії для окремого користувача.
- Дійсний токен/пароль Gateway для цього endpoint слід розглядати як облікові дані власника/оператора.
- Запити проходять через той самий control-plane шлях агента, що й довірені дії оператора.
- Для цього endpoint немає окремої межі інструментів для не-власника/окремого користувача; щойно виклик пройшов auth Gateway, OpenClaw розглядає його як довіреного оператора цього gateway.
- Для режимів auth зі спільним секретом (`token` і `password`) endpoint відновлює звичайні повні операторські типові значення, навіть якщо виклик надсилає вужчий заголовок `x-openclaw-scopes`.
- Довірені HTTP-режими з передаванням ідентичності (наприклад, auth через trusted proxy або `gateway.auth.mode="none"`) враховують `x-openclaw-scopes`, коли цей заголовок присутній, інакше повертаються до звичайного типового набору операторських областей.
- Якщо політика цільового агента дозволяє чутливі інструменти, цей endpoint може їх використовувати.
- Тримайте цей endpoint лише на loopback/tailnet/private ingress; не виставляйте його напряму в публічний інтернет.

Матриця auth:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - доводить володіння спільним операторським секретом gateway
  - ігнорує вужчі `x-openclaw-scopes`
  - відновлює повний типовий набір операторських областей:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - розглядає chat turns на цьому endpoint як turns від відправника-власника
- довірені HTTP-режими з передаванням ідентичності (наприклад, auth через trusted proxy або `gateway.auth.mode="none"` на приватному ingress)
  - автентифікують деяку зовнішню довірену ідентичність або межу розгортання
  - враховують `x-openclaw-scopes`, коли заголовок присутній
  - повертаються до звичайного типового набору операторських областей, коли заголовок відсутній
  - втрачають семантику власника лише тоді, коли виклик явно звужує області й пропускає `operator.admin`

Див. [Security](/gateway/security) і [Remote access](/gateway/remote).

## Контракт model з пріоритетом агента

OpenClaw трактує поле OpenAI `model` як **ціль агента**, а не як сирий id моделі провайдера.

- `model: "openclaw"` маршрутизується до налаштованого типового агента.
- `model: "openclaw/default"` також маршрутизується до налаштованого типового агента.
- `model: "openclaw/<agentId>"` маршрутизується до конкретного агента.

Необов’язкові заголовки запиту:

- `x-openclaw-model: <provider/model-or-bare-id>` перевизначає backend-модель для вибраного агента.
- `x-openclaw-agent-id: <agentId>` і далі підтримується як перевизначення для сумісності.
- `x-openclaw-session-key: <sessionKey>` повністю керує маршрутизацією сесії.
- `x-openclaw-message-channel: <channel>` задає синтетичний контекст вхідного каналу для prompt-ів і політик, залежних від каналу.

Псевдоніми сумісності, які досі приймаються:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Увімкнення endpoint

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

## Вимкнення endpoint

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

Типово endpoint є **безстановим для кожного запиту** (для кожного виклику генерується новий ключ сесії).

Якщо запит містить рядок OpenAI `user`, Gateway виводить з нього стабільний ключ сесії, тож повторні виклики можуть спільно використовувати сесію агента.

## Чому ця поверхня важлива

Це найцінніший набір сумісності для self-hosted frontend-ів та інструментів:

- Більшість конфігурацій Open WebUI, LobeChat і LibreChat очікують `/v1/models`.
- Багато систем RAG очікують `/v1/embeddings`.
- Наявні OpenAI chat clients зазвичай можуть почати з `/v1/chat/completions`.
- Більш agent-native клієнти дедалі частіше віддають перевагу `/v1/responses`.

## Список моделей і маршрутизація агентів

<AccordionGroup>
  <Accordion title="Що повертає `/v1/models`?">
    Список цілей агентів OpenClaw.

    Повернені id — це записи `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
    Використовуйте їх безпосередньо як значення OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` перелічує агентів чи субагентів?">
    Він перелічує цілі верхньорівневих агентів, а не backend-моделі провайдерів і не субагентів.

    Субагенти залишаються внутрішньою топологією виконання. Вони не з’являються як псевдомоделі.

  </Accordion>
  <Accordion title="Чому включено `openclaw/default`?">
    `openclaw/default` — це стабільний псевдонім для налаштованого типового агента.

    Це означає, що клієнти можуть і далі використовувати один передбачуваний id, навіть якщо фактичний id типового агента змінюється між середовищами.

  </Accordion>
  <Accordion title="Як перевизначити backend-модель?">
    Використовуйте `x-openclaw-model`.

    Приклади:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.4`

    Якщо ви його пропустите, вибраний агент працюватиме зі своїм звичайним налаштованим вибором моделі.

  </Accordion>
  <Accordion title="Як embeddings вписуються в цей контракт?">
    `/v1/embeddings` використовує ті самі id `model` для цілей агентів.

    Використовуйте `model: "openclaw/default"` або `model: "openclaw/<agentId>"`.
    Якщо вам потрібна конкретна embedding-модель, передайте її в `x-openclaw-model`.
    Без цього заголовка запит передається до звичайного налаштування embeddings вибраного агента.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Задайте `stream: true`, щоб отримувати Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Кожен рядок події має вигляд `data: <json>`
- Потік завершується рядком `data: [DONE]`

## Швидке налаштування Open WebUI

Для базового підключення Open WebUI:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL для Docker на macOS: `http://host.docker.internal:18789/v1`
- API key: ваш bearer token Gateway
- Model: `openclaw/default`

Очікувана поведінка:

- `GET /v1/models` має перелічувати `openclaw/default`
- Open WebUI має використовувати `openclaw/default` як id chat-моделі
- Якщо вам потрібна конкретна backend provider/model для цього агента, задайте звичайну типову модель агента або надішліть `x-openclaw-model`

Швидка перевірка:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Якщо це повертає `openclaw/default`, більшість конфігурацій Open WebUI зможуть підключитися з тим самим base URL і token.

## Приклади

Без streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming:

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

- `/v1/models` повертає цілі агентів OpenClaw, а не сирі каталоги провайдерів.
- `openclaw/default` присутній завжди, тому один стабільний id працює в різних середовищах.
- Перевизначення backend provider/model мають передаватися в `x-openclaw-model`, а не в полі OpenAI `model`.
- `/v1/embeddings` підтримує `input` як рядок або масив рядків.
