---
read_when:
    - Інтеграція інструментів, які очікують Chat Completions від OpenAI
summary: Надати через Gateway HTTP-кінцеву точку `/v1/chat/completions`, сумісну з OpenAI
title: Чат-комплішени OpenAI
x-i18n:
    generated_at: "2026-04-24T04:13:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55f581d56edbc23a8e8a6f8f1c5960db46042991abb3ee4436f477abafde2926
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# Chat Completions OpenAI (HTTP)

Gateway OpenClaw може надавати невелику кінцеву точку Chat Completions, сумісну з OpenAI.

Ця кінцева точка **типово вимкнена**. Спочатку ввімкніть її в конфігурації.

- `POST /v1/chat/completions`
- Той самий порт, що й у Gateway (мультиплексування WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

Коли в Gateway увімкнено HTTP-поверхню, сумісну з OpenAI, вона також надає:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

Під капотом запити виконуються як звичайний запуск агента Gateway (той самий шлях коду, що й у `openclaw agent`), тому маршрутизація/дозволи/конфігурація відповідають вашому Gateway.

## Автентифікація

Використовує конфігурацію автентифікації Gateway.

Поширені шляхи HTTP-автентифікації:

- автентифікація спільним секретом (`gateway.auth.mode="token"` або `"password"`):
  `Authorization: Bearer <token-or-password>`
- довірена HTTP-автентифікація з передаванням ідентичності (`gateway.auth.mode="trusted-proxy"`):
  маршрутизуйте через налаштований проксі з урахуванням ідентичності й дозвольте йому вставити
  потрібні заголовки ідентичності
- відкрита автентифікація через приватний вхідний доступ (`gateway.auth.mode="none"`):
  заголовок автентифікації не потрібен

Примітки:

- Коли `gateway.auth.mode="token"`, використовуйте `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
- Коли `gateway.auth.mode="password"`, використовуйте `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
- Коли `gateway.auth.mode="trusted-proxy"`, HTTP-запит має надходити від
  налаштованого довіреного джерела проксі не в loopback; проксі loopback на тому ж хості
  не задовольняють цей режим.
- Якщо налаштовано `gateway.auth.rateLimit` і відбувається надто багато збоїв автентифікації, кінцева точка повертає `429` з `Retry-After`.

## Межа безпеки (важливо)

Ставтеся до цієї кінцевої точки як до поверхні **повного операторського доступу** до екземпляра gateway.

- HTTP bearer-автентифікація тут не є вузькою моделлю області дії на користувача.
- Чинний токен/пароль Gateway для цієї кінцевої точки слід розглядати як облікові дані власника/оператора.
- Запити проходять тим самим шляхом агента контрольної площини, що й дії довіреного оператора.
- Для цієї кінцевої точки немає окремої межі інструментів для не-власника/окремого користувача; щойно викликач проходить автентифікацію Gateway тут, OpenClaw розглядає його як довіреного оператора цього gateway.
- Для режимів автентифікації зі спільним секретом (`token` і `password`) кінцева точка відновлює звичайні типові налаштування повного оператора, навіть якщо викликач надсилає вужчий заголовок `x-openclaw-scopes`.
- Довірені режими HTTP з передаванням ідентичності (наприклад, автентифікація через trusted proxy або `gateway.auth.mode="none"`) враховують `x-openclaw-scopes`, якщо він присутній, інакше повертаються до звичайного типового набору областей дії оператора.
- Якщо політика цільового агента дозволяє чутливі інструменти, ця кінцева точка може їх використовувати.
- Тримайте цю кінцеву точку лише в loopback/tailnet/приватному вхідному доступі; не відкривайте її безпосередньо в публічний інтернет.

Матриця автентифікації:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - доводить володіння спільним секретом оператора gateway
  - ігнорує вужчі `x-openclaw-scopes`
  - відновлює повний типовий набір областей дії оператора:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - розглядає ходи чату на цій кінцевій точці як ходи відправника-власника
- довірені режими HTTP з передаванням ідентичності (наприклад, автентифікація через trusted proxy або `gateway.auth.mode="none"` на приватному вхідному доступі)
  - автентифікують певну зовнішню довірену ідентичність або межу розгортання
  - враховують `x-openclaw-scopes`, коли заголовок присутній
  - повертаються до звичайного типового набору областей дії оператора, коли заголовок відсутній
  - втрачають семантику власника лише тоді, коли викликач явно звужує області дії та опускає `operator.admin`

Див. [Безпека](/uk/gateway/security) і [Віддалений доступ](/uk/gateway/remote).

## Контракт моделі agent-first

OpenClaw розглядає поле OpenAI `model` як **ціль агента**, а не як необроблений ідентифікатор моделі провайдера.

- `model: "openclaw"` маршрутизується до налаштованого типового агента.
- `model: "openclaw/default"` також маршрутизується до налаштованого типового агента.
- `model: "openclaw/<agentId>"` маршрутизується до конкретного агента.

Необов’язкові заголовки запиту:

- `x-openclaw-model: <provider/model-or-bare-id>` перевизначає бекенд-модель для вибраного агента.
- `x-openclaw-agent-id: <agentId>` і далі підтримується як перевизначення для сумісності.
- `x-openclaw-session-key: <sessionKey>` повністю керує маршрутизацією сесії.
- `x-openclaw-message-channel: <channel>` задає контекст синтетичного вхідного каналу для підказок і політик, що враховують канал.

Далі приймаються й псевдоніми сумісності:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Увімкнення кінцевої точки

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

## Вимкнення кінцевої точки

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

## Поведінка сесії

Типово ця кінцева точка **не зберігає стан між запитами** (для кожного виклику генерується новий ключ сесії).

Якщо запит містить рядок OpenAI `user`, Gateway виводить із нього стабільний ключ сесії, щоб повторні виклики могли ділити одну сесію агента.

## Чому ця поверхня важлива

Це найкорисніший набір сумісності для self-hosted фронтендів та інструментів:

- Більшість налаштувань Open WebUI, LobeChat і LibreChat очікують `/v1/models`.
- Багато систем RAG очікують `/v1/embeddings`.
- Наявні клієнти чату OpenAI зазвичай можуть почати з `/v1/chat/completions`.
- Більш agent-native клієнти дедалі частіше віддають перевагу `/v1/responses`.

## Список моделей і маршрутизація агентів

<AccordionGroup>
  <Accordion title="Що повертає `/v1/models`?">
    Список цілей агентів OpenClaw.

    Повернені ідентифікатори — це записи `openclaw`, `openclaw/default` і `openclaw/<agentId>`.
    Використовуйте їх безпосередньо як значення OpenAI `model`.

  </Accordion>
  <Accordion title="`/v1/models` перелічує агентів чи субагентів?">
    Він перелічує цілі агентів верхнього рівня, а не бекенд-моделі провайдерів і не субагентів.

    Субагенти залишаються внутрішньою топологією виконання. Вони не з’являються як псевдомоделі.

  </Accordion>
  <Accordion title="Чому включено `openclaw/default`?">
    `openclaw/default` — це стабільний псевдонім для налаштованого типового агента.

    Це означає, що клієнти можуть і далі використовувати один передбачуваний ідентифікатор, навіть якщо справжній ідентифікатор типового агента змінюється між середовищами.

  </Accordion>
  <Accordion title="Як перевизначити бекенд-модель?">
    Використовуйте `x-openclaw-model`.

    Приклади:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    Якщо його не вказати, вибраний агент працюватиме зі своїм звичайним налаштованим вибором моделі.

  </Accordion>
  <Accordion title="Як embeddings вписуються в цей контракт?">
    `/v1/embeddings` використовує ті самі ідентифікатори `model` цілей агентів.

    Використовуйте `model: "openclaw/default"` або `model: "openclaw/<agentId>"`.
    Коли потрібна конкретна модель embedding, передайте її в `x-openclaw-model`.
    Без цього заголовка запит переходить до звичайного налаштування embedding вибраного агента.

  </Accordion>
</AccordionGroup>

## Потокова передача (SSE)

Установіть `stream: true`, щоб отримувати Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- Кожен рядок події має вигляд `data: <json>`
- Потік завершується рядком `data: [DONE]`

## Швидке налаштування Open WebUI

Для базового підключення Open WebUI:

- Базовий URL: `http://127.0.0.1:18789/v1`
- Базовий URL для Docker на macOS: `http://host.docker.internal:18789/v1`
- API key: ваш bearer-токен Gateway
- Model: `openclaw/default`

Очікувана поведінка:

- `GET /v1/models` має перелічувати `openclaw/default`
- Open WebUI має використовувати `openclaw/default` як ідентифікатор моделі чату
- Якщо ви хочете конкретний бекенд-провайдер/модель для цього агента, установіть звичайну типову модель агента або надішліть `x-openclaw-model`

Швидка перевірка:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Якщо це повертає `openclaw/default`, більшість конфігурацій Open WebUI зможуть підключитися з тим самим базовим URL і токеном.

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
- `openclaw/default` присутній завжди, тому один стабільний ідентифікатор працює в різних середовищах.
- Перевизначення бекенд-провайдера/моделі слід передавати в `x-openclaw-model`, а не в полі OpenAI `model`.
- `/v1/embeddings` підтримує `input` як рядок або масив рядків.

## Пов’язане

- [Довідка з конфігурації](/uk/gateway/configuration-reference)
- [OpenAI](/uk/providers/openai)
