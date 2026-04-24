---
read_when:
    - Ви хочете покрокове налаштування для Gateway, робочого простору, автентифікації, каналів і Skills
summary: Довідник CLI для `openclaw onboard` (інтерактивне онбординг)
title: Онбординг
x-i18n:
    generated_at: "2026-04-24T06:45:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1959ad7014b891230e497a2e0ab494ba316090c81629f25b8147614b694ead5
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Інтерактивний онбординг для налаштування локального або віддаленого Gateway.

## Пов’язані посібники

- Центр онбордингу CLI: [Онбординг (CLI)](/uk/start/wizard)
- Огляд онбордингу: [Огляд онбордингу](/uk/start/onboarding-overview)
- Довідник CLI онбордингу: [Довідник з налаштування CLI](/uk/start/wizard-cli-reference)
- Автоматизація CLI: [Автоматизація CLI](/uk/start/wizard-cli-automation)
- Онбординг macOS: [Онбординг (додаток macOS)](/uk/start/onboarding)

## Приклади

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Для цілей приватної мережі `ws://` у відкритому тексті (лише для довірених мереж) встановіть
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у середовищі процесу онбордингу.
Еквівалента `openclaw.json` для цього аварійного обходу
клієнтського транспорту не існує.

Некерований користувачем custom provider:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` є необов’язковим у неінтерактивному режимі. Якщо його не вказано, онбординг перевіряє `CUSTOM_API_KEY`.

LM Studio також підтримує прапорець ключа, специфічний для провайдера, у неінтерактивному режимі:

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

Для `--custom-base-url` типовим значенням є `http://127.0.0.1:11434`. `--custom-model-id` є необов’язковим; якщо його не вказано, онбординг використовує рекомендовані Ollama значення за замовчуванням. Хмарні ідентифікатори моделей, як-от `kimi-k2.5:cloud`, тут також працюють.

Зберігайте ключі провайдера як посилання, а не як відкритий текст:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

З `--secret-input-mode ref` онбординг записує посилання, що спираються на змінні середовища, замість значень ключів у відкритому тексті.
Для провайдерів, що спираються на auth-profile, це записує записи `keyRef`; для custom providers це записує `models.providers.<id>.apiKey` як env ref (наприклад, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неінтерактивного режиму `ref`:

- Встановіть env var провайдера в середовищі процесу онбордингу (наприклад, `OPENAI_API_KEY`).
- Не передавайте вбудовані прапорці ключів (наприклад, `--openai-api-key`), якщо цю env var також не встановлено.
- Якщо прапорець вбудованого ключа передано без обов’язкової env var, онбординг негайно завершується з підказками.

Параметри токена Gateway у неінтерактивному режимі:

- `--gateway-auth token --gateway-token <token>` зберігає токен у відкритому тексті.
- `--gateway-auth token --gateway-token-ref-env <name>` зберігає `gateway.auth.token` як env SecretRef.
- `--gateway-token` і `--gateway-token-ref-env` є взаємовиключними.
- `--gateway-token-ref-env` потребує непорожню env var у середовищі процесу онбордингу.
- З `--install-daemon`, коли автентифікація токеном потребує токена, токени Gateway, керовані через SecretRef, проходять перевірку, але не зберігаються як розгорнутий відкритий текст у метаданих середовища сервісу supervisor.
- З `--install-daemon`, якщо режим токена потребує токена, а налаштований SecretRef токена не розв’язано, онбординг завершується за принципом fail-closed із вказівками щодо виправлення.
- З `--install-daemon`, якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, онбординг блокує встановлення, доки режим не буде явно задано.
- Локальний онбординг записує `gateway.mode="local"` у конфігурацію. Якщо в подальшому у файлі конфігурації бракує `gateway.mode`, розглядайте це як пошкодження конфігурації або неповне ручне редагування, а не як коректне скорочення для локального режиму.
- `--allow-unconfigured` — це окремий аварійний обхід для середовища виконання Gateway. Це не означає, що онбординг може пропустити `gateway.mode`.

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

- Якщо ви не передасте `--skip-health`, онбординг чекає на досяжний локальний Gateway, перш ніж успішно завершитися.
- `--install-daemon` спочатку запускає керований шлях встановлення Gateway. Без нього у вас уже має працювати локальний Gateway, наприклад `openclaw gateway run`.
- Якщо вам в автоматизації потрібні лише записи конфігурації/робочого простору/bootstrap, використовуйте `--skip-health`.
- У native Windows `--install-daemon` спочатку намагається використати Scheduled Tasks, а якщо створення завдання заборонене — переходить до елемента входу користувача у теці Startup.

Поведінка інтерактивного онбордингу з режимом посилань:

- Коли буде запит, виберіть **Use secret reference**.
- Потім виберіть один із варіантів:
  - Змінна середовища
  - Налаштований провайдер секретів (`file` або `exec`)
- Перед збереженням посилання онбординг виконує швидку попередню перевірку.
  - Якщо перевірка не проходить, онбординг показує помилку й дає змогу повторити спробу.

Вибір endpoint для Z.AI у неінтерактивному режимі:

Примітка: `--auth-choice zai-api-key` тепер автоматично визначає найкращий endpoint Z.AI для вашого ключа (надає перевагу загальному API з `zai/glm-5.1`).
Якщо вам конкретно потрібні endpoint плану GLM Coding, виберіть `zai-coding-global` або `zai-coding-cn`.

```bash
# Вибір endpoint без запиту
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

Примітки щодо потоків:

- `quickstart`: мінімум запитів, автоматично генерує токен Gateway.
- `manual`: повні запити для порту/bind/auth (псевдонім `advanced`).
- Коли вибір автентифікації передбачає пріоритетного провайдера, онбординг попередньо фільтрує засоби вибору default-model і allowlist за цим провайдером. Для Volcengine і BytePlus це також охоплює варіанти coding-plan
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Якщо фільтр пріоритетного провайдера поки не дає жодної завантаженої моделі, онбординг повертається до нефільтрованого каталогу, а не залишає список вибору порожнім.
- На етапі web-search деякі провайдери можуть запускати додаткові запити, специфічні для провайдера:
  - **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим `XAI_API_KEY`
    і вибором моделі `x_search`.
  - **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` чи
    `api.moonshot.cn`) і типову модель web-search Kimi.
- Поведінка області DM у локальному онбордингу: [Довідник з налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals).
- Найшвидший перший чат: `openclaw dashboard` (Control UI, без налаштування каналів).
- Custom Provider: підключайте будь-який endpoint, сумісний з OpenAI або Anthropic,
  включно з розміщеними провайдерами, яких немає у списку. Використовуйте Unknown для автовизначення.

## Поширені подальші команди

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` не означає неінтерактивний режим. Для сценаріїв використовуйте `--non-interactive`.
</Note>
