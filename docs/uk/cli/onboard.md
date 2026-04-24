---
read_when:
    - Ви хочете покрокове налаштування Gateway, робочого простору, автентифікації, каналів і Skills
summary: Довідник CLI для `openclaw onboard` (інтерактивне налаштування)
title: Налаштування
x-i18n:
    generated_at: "2026-04-24T19:50:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2b09191f95ff6012c340976dbae1045d24b736a9e9e06fc4e15e1f15785f20f5
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Інтерактивне налаштування для локального або віддаленого налаштування Gateway.

## Пов’язані посібники

- Центр налаштування CLI: [Налаштування (CLI)](/uk/start/wizard)
- Огляд налаштування: [Огляд налаштування](/uk/start/onboarding-overview)
- Довідник налаштування CLI: [Довідник налаштування CLI](/uk/start/wizard-cli-reference)
- Автоматизація CLI: [Автоматизація CLI](/uk/start/wizard-cli-automation)
- Налаштування macOS: [Налаштування (застосунок macOS)](/uk/start/onboarding)

## Приклади

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Для цілей приватної мережі з відкритим текстом `ws://` (лише для довірених мереж) встановіть
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у середовищі процесу налаштування.
Для цього клієнтського аварійного обходу транспортного рівня немає еквівалента
`openclaw.json`.

Некастомний провайдер у неінтерактивному режимі:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` необов’язковий у неінтерактивному режимі. Якщо його пропущено, налаштування перевіряє `CUSTOM_API_KEY`.

LM Studio також підтримує прапорець ключа, специфічний для провайдера, у неінтерактивному режимі:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Некастомний Ollama у неінтерактивному режимі:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` типово має значення `http://127.0.0.1:11434`. `--custom-model-id` необов’язковий; якщо його пропущено, налаштування використовує рекомендовані типові значення Ollama. Ідентифікатори хмарних моделей, такі як `kimi-k2.5:cloud`, також тут працюють.

Зберігайте ключі провайдера як посилання, а не як відкритий текст:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

З `--secret-input-mode ref` налаштування записує посилання на основі env замість значень ключів у відкритому тексті.
Для провайдерів на основі профілю автентифікації це записує записи `keyRef`; для кастомних провайдерів це записує `models.providers.<id>.apiKey` як env-посилання (наприклад, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неінтерактивного режиму `ref`:

- Встановіть змінну середовища провайдера в середовищі процесу налаштування (наприклад, `OPENAI_API_KEY`).
- Не передавайте вбудовані прапорці ключа (наприклад, `--openai-api-key`), якщо цю змінну середовища також не встановлено.
- Якщо вбудований прапорець ключа передано без потрібної змінної середовища, налаштування швидко завершується з повідомленням-підказкою.

Параметри токена Gateway у неінтерактивному режимі:

- `--gateway-auth token --gateway-token <token>` зберігає токен у відкритому тексті.
- `--gateway-auth token --gateway-token-ref-env <name>` зберігає `gateway.auth.token` як env SecretRef.
- `--gateway-token` і `--gateway-token-ref-env` взаємовиключні.
- `--gateway-token-ref-env` вимагає непорожньої змінної середовища в середовищі процесу налаштування.
- З `--install-daemon`, коли автентифікація токеном вимагає токен, токени Gateway під керуванням SecretRef перевіряються, але не зберігаються як розв’язаний відкритий текст у метаданих середовища служби supervisor.
- З `--install-daemon`, якщо режим токена вимагає токен і налаштований SecretRef токена не розв’язується, налаштування завершується в закритому режимі з підказками щодо усунення проблеми.
- З `--install-daemon`, якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не встановлено, налаштування блокує встановлення, доки режим не буде встановлено явно.
- Локальне налаштування записує `gateway.mode="local"` у конфігурацію. Якщо в пізнішому файлі конфігурації бракує `gateway.mode`, вважайте це пошкодженням конфігурації або неповним ручним редагуванням, а не дійсним скороченням для локального режиму.
- `--allow-unconfigured` — це окремий аварійний обхід часу виконання Gateway. Це не означає, що під час налаштування можна пропустити `gateway.mode`.

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

Стан локального Gateway у неінтерактивному режимі:

- Якщо не передано `--skip-health`, налаштування чекає на доступний локальний Gateway, перш ніж успішно завершитися.
- `--install-daemon` спочатку запускає шлях керованого встановлення Gateway. Без нього у вас уже має працювати локальний Gateway, наприклад `openclaw gateway run`.
- Якщо в автоматизації вам потрібні лише записи конфігурації/робочого простору/bootstrap, використовуйте `--skip-health`.
- Якщо ви самостійно керуєте файлами робочого простору, передайте `--skip-bootstrap`, щоб установити `agents.defaults.skipBootstrap: true` і пропустити створення `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` і `BOOTSTRAP.md`.
- У native Windows `--install-daemon` спочатку намагається використати Scheduled Tasks і переходить до елемента входу per-user у папці Startup, якщо створення завдання заборонено.

Поведінка інтерактивного налаштування в режимі посилань:

- Коли буде запит, виберіть **Використати посилання на секрет**.
- Потім виберіть одне з двох:
  - Змінна середовища
  - Налаштований провайдер секретів (`file` або `exec`)
- Перед збереженням посилання налаштування виконує швидку перевірку preflight.
  - Якщо перевірка не пройде, налаштування покаже помилку й дозволить повторити спробу.

Варіанти кінцевих точок Z.AI у неінтерактивному режимі:

Примітка: `--auth-choice zai-api-key` тепер автоматично визначає найкращу кінцеву точку Z.AI для вашого ключа (надає перевагу загальному API з `zai/glm-5.1`).
Якщо вам конкретно потрібні кінцеві точки GLM Coding Plan, виберіть `zai-coding-global` або `zai-coding-cn`.

```bash
# Вибір кінцевої точки без запитів
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Інші варіанти кінцевих точок Z.AI:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Приклад Mistral у неінтерактивному режимі:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Примітки щодо потоків:

- `quickstart`: мінімум запитів, автоматично генерує токен Gateway.
- `manual`: повні запити для порту/bind/auth (псевдонім `advanced`).
- Коли вибір автентифікації передбачає бажаного провайдера, налаштування попередньо фільтрує
  засоби вибору моделі за замовчуванням і allowlist до цього провайдера. Для Volcengine і
  BytePlus це також охоплює варіанти coding-plan
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Якщо фільтр бажаного провайдера ще не дає жодної завантаженої моделі,
  налаштування повертається до нефільтрованого каталогу замість того, щоб залишити засіб вибору порожнім.
- На кроці web-search деякі провайдери можуть запускати додаткові запити, специфічні для провайдера:
  - **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим `XAI_API_KEY`
    і вибором моделі `x_search`.
  - **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` чи
    `api.moonshot.cn`) і типову модель web-search Kimi.
- Поведінка області DM для локального налаштування: [Довідник налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals).
- Найшвидший перший чат: `openclaw dashboard` (Control UI, без налаштування каналів).
- Кастомний провайдер: підключіть будь-яку кінцеву точку, сумісну з OpenAI або Anthropic,
  зокрема хостингових провайдерів, яких немає в списку. Використовуйте Unknown для автовизначення.

## Поширені команди після налаштування

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` не означає неінтерактивний режим. Для скриптів використовуйте `--non-interactive`.
</Note>
