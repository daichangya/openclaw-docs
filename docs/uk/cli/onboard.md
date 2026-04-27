---
read_when:
    - Ви хочете покрокове налаштування Gateway, робочого простору, автентифікації, каналів і Skills
summary: Довідка CLI для `openclaw onboard` (інтерактивне налаштування)
title: Onboard
x-i18n:
    generated_at: "2026-04-27T04:33:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fd532143ae8d9ba5b7abd297858a13c22eeeb995891f2c33ef9b8708d3438ec
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Інтерактивне налаштування для локального або віддаленого налаштування Gateway.

## Пов’язані посібники

<CardGroup cols={2}>
  <Card title="Центр налаштування CLI" href="/uk/start/wizard" icon="rocket">
    Покроковий огляд інтерактивного потоку CLI.
  </Card>
  <Card title="Огляд налаштування" href="/uk/start/onboarding-overview" icon="map">
    Як поєднується налаштування OpenClaw.
  </Card>
  <Card title="Довідник з налаштування CLI" href="/uk/start/wizard-cli-reference" icon="book">
    Вивід, внутрішні механізми та поведінка на кожному кроці.
  </Card>
  <Card title="Автоматизація CLI" href="/uk/start/wizard-cli-automation" icon="terminal">
    Неінтерактивні прапорці та сценарні налаштування.
  </Card>
  <Card title="Налаштування застосунку macOS" href="/uk/start/onboarding" icon="apple">
    Потік налаштування для застосунку macOS у рядку меню.
  </Card>
</CardGroup>

## Приклади

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--modern` запускає попередню версію розмовного налаштування Crestodian. Без
`--modern` команда `openclaw onboard` зберігає класичний потік налаштування.

Для цілей plaintext private-network `ws://` (лише довірені мережі) задайте
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у середовищі процесу налаштування.
Для цього клієнтського аварійного обходу транспорту немає еквівалента
`openclaw.json`.

Неінтерактивний користувацький провайдер:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` необов’язковий у неінтерактивному режимі. Якщо його не вказано, налаштування перевіряє `CUSTOM_API_KEY`.

LM Studio також підтримує специфічний для провайдера прапорець ключа в неінтерактивному режимі:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Неінтерактивний Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` типово має значення `http://127.0.0.1:11434`. `--custom-model-id` необов’язковий; якщо його не вказано, налаштування використовує запропоновані Ollama типові значення. Ідентифікатори хмарних моделей, такі як `kimi-k2.5:cloud`, тут також працюють.

Зберігайте ключі провайдера як refs замість plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

З `--secret-input-mode ref` налаштування записує refs на основі змінних середовища замість plaintext-значень ключів.
Для провайдерів на основі auth-profile це записує записи `keyRef`; для користувацьких провайдерів це записує `models.providers.<id>.apiKey` як env ref (наприклад, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неінтерактивного режиму `ref`:

- Задайте env var провайдера в середовищі процесу налаштування (наприклад, `OPENAI_API_KEY`).
- Не передавайте вбудовані прапорці ключів (наприклад, `--openai-api-key`), якщо ця env var також не задана.
- Якщо вбудований прапорець ключа передано без потрібної env var, налаштування швидко завершується з підказками.

Параметри токена Gateway у неінтерактивному режимі:

- `--gateway-auth token --gateway-token <token>` зберігає plaintext-токен.
- `--gateway-auth token --gateway-token-ref-env <name>` зберігає `gateway.auth.token` як env SecretRef.
- `--gateway-token` і `--gateway-token-ref-env` взаємовиключні.
- `--gateway-token-ref-env` вимагає непорожню env var у середовищі процесу налаштування.
- З `--install-daemon`, коли автентифікація токеном вимагає токен, токени Gateway, керовані через SecretRef, перевіряються, але не зберігаються як розгорнутий plaintext у метаданих середовища служби supervisor.
- З `--install-daemon`, якщо режим токена вимагає токен і налаштований SecretRef токена не розв’язується, налаштування безумовно завершується з вказівками щодо виправлення.
- З `--install-daemon`, якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, налаштування блокує встановлення, доки режим не буде явно задано.
- Локальне налаштування записує `gateway.mode="local"` у конфігурацію. Якщо в пізнішому файлі конфігурації бракує `gateway.mode`, вважайте це пошкодженням конфігурації або неповним ручним редагуванням, а не коректним скороченням для локального режиму.
- `--allow-unconfigured` — це окремий аварійний обхід для середовища виконання Gateway. Це не означає, що налаштування може пропустити `gateway.mode`.

Приклад:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Стан неінтерактивного локального Gateway:

- Якщо ви не передасте `--skip-health`, налаштування очікує доступний локальний Gateway перед успішним завершенням.
- `--install-daemon` спочатку запускає шлях керованого встановлення Gateway. Без нього у вас уже має працювати локальний Gateway, наприклад `openclaw gateway run`.
- Якщо вам потрібні лише записи конфігурації/робочого простору/bootstrap в автоматизації, використовуйте `--skip-health`.
- Якщо ви самостійно керуєте файлами робочого простору, передайте `--skip-bootstrap`, щоб встановити `agents.defaults.skipBootstrap: true` і пропустити створення `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` і `BOOTSTRAP.md`.
- У нативному Windows `--install-daemon` спочатку намагається використати Scheduled Tasks, а якщо створення завдань заборонено — переходить до елемента входу для користувача в теці Startup.

Поведінка інтерактивного налаштування в режимі посилань:

- Коли з’явиться запит, виберіть **Використати посилання на секрет**.
- Потім виберіть одне з такого:
  - Змінна середовища
  - Налаштований провайдер секретів (`file` або `exec`)
- Перед збереженням ref налаштування виконує швидку попередню перевірку.
  - Якщо перевірка не проходить, налаштування показує помилку і дає змогу повторити спробу.

### Вибір endpoint Z.AI у неінтерактивному режимі

<Note>
`--auth-choice zai-api-key` автоматично визначає найкращий endpoint Z.AI для вашого ключа (надає перевагу загальному API з `zai/glm-5.1`). Якщо вам спеціально потрібні endpoint-и GLM Coding Plan, виберіть `zai-coding-global` або `zai-coding-cn`.
</Note>

```bash
# Вибір endpoint без запитів
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Інші варіанти endpoint Z.AI:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Неінтерактивний приклад Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Примітки щодо потоків

<AccordionGroup>
  <Accordion title="Типи потоків">
    - `quickstart`: мінімум запитів, автоматично генерує токен Gateway.
    - `manual`: повні запити щодо порту, прив’язки та автентифікації (псевдонім для `advanced`).
  </Accordion>
  <Accordion title="Попередня фільтрація провайдерів">
    Коли вибір автентифікації передбачає бажаного провайдера, налаштування попередньо фільтрує засоби вибору стандартної моделі та allowlist до цього провайдера. Для Volcengine і BytePlus це також охоплює варіанти coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Якщо фільтр бажаного провайдера поки не дає жодної завантаженої моделі, налаштування повертається до нефільтрованого каталогу замість того, щоб залишати засіб вибору порожнім.
  </Accordion>
  <Accordion title="Подальші запити для веб-пошуку">
    Деякі провайдери веб-пошуку викликають додаткові запити, специфічні для провайдера:

    - **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим `XAI_API_KEY` і вибором моделі `x_search`.
    - **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` чи `api.moonshot.cn`) і стандартну модель веб-пошуку Kimi.
  </Accordion>
  <Accordion title="Інша поведінка">
    - Поведінка області DM у локальному налаштуванні: [Довідник з налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals).
    - Найшвидший перший чат: `openclaw dashboard` (Control UI, без налаштування каналів).
    - Користувацький провайдер: під’єднайте будь-який endpoint, сумісний з OpenAI або Anthropic, зокрема хостованих провайдерів, яких немає в списку. Використайте Unknown для автоматичного визначення.
  </Accordion>
</AccordionGroup>

## Поширені подальші команди

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` не означає неінтерактивний режим. Для сценаріїв використовуйте `--non-interactive`.
</Note>
