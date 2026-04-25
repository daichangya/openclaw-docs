---
read_when:
    - Запуск smoke-тестів live-матриці моделей / бекенду CLI / ACP / медіапровайдерів
    - Налагодження визначення облікових даних для live-тестів
    - Додавання нового live-тесту для конкретного провайдера
sidebarTitle: Live tests
summary: 'Live (із зверненням до мережі) тести: матриця моделей, бекенди CLI, ACP, медіапровайдери, облікові дані'
title: 'Тестування: live-набори тестів'
x-i18n:
    generated_at: "2026-04-25T02:56:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e49df93f47dfe6a53e72d13d4bf01c372ed163f2d08c656640370ef511a00cd
    source_path: help/testing-live.md
    workflow: 15
---

Щоб швидко ознайомитися з початком роботи, раннерами QA, наборами unit/integration тестів і Docker-потоками, див.
[Тестування](/uk/help/testing). Ця сторінка охоплює **live** (із зверненням до мережі) набори тестів:
матрицю моделей, бекенди CLI, ACP і live-тести медіапровайдерів, а також
обробку облікових даних.

## Live: перевірка можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яка зараз оголошена** підключеним Android Node, і перевірити поведінку контракту команд.
- Область:
  - Попередньо підготовлене/ручне налаштування (набір тестів не встановлює/не запускає/не спаровує застосунок).
  - Перевірка `node.invoke` Gateway для вибраного Android Node, команда за командою.
- Обов’язкове попереднє налаштування:
  - Android-застосунок уже підключено та спарено з Gateway.
  - Застосунок утримується на передньому плані.
  - Надано дозволи/згоду на захоплення для можливостей, які ви очікуєте успішно пройти.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні відомості про налаштування Android: [Android App](/uk/platforms/android)

## Live: smoke-тест моделей (ключі профілів)

Live-тести розділено на два рівні, щоб можна було ізолювати збої:

- «Пряма модель» показує, чи взагалі провайдер/модель може відповідати з указаним ключем.
- «Smoke-тест Gateway» показує, чи працює для цієї моделі весь конвеєр gateway+agent (сеанси, історія, інструменти, політика sandbox тощо).

### Рівень 1: Пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Виконати невелике завершення для кожної моделі (і точкові регресійні перевірки, де потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб дійсно запустити цей набір тестів; інакше його буде пропущено, щоб `pnpm test:live` залишався зосередженим на smoke-тестах gateway
- Як вибирати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запускати сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для сучасного allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Для modern/all-перевірок за замовчуванням використовується підібране обмеження з високим сигналом; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого обмеження.
  - Для вичерпних перевірок як таймаут усього тесту прямої моделі використовується `OPENCLAW_LIVE_TEST_TIMEOUT_MS`. За замовчуванням: 60 хвилин.
  - Проби прямої моделі за замовчуванням виконуються з паралелізмом 20; для перевизначення встановіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`.
- Як вибирати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і резервні значення з env
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ недійсний» від «конвеєр gateway agent зламаний»
  - Містить невеликі ізольовані регресії (приклад: replay міркування OpenAI Responses/Codex Responses + потоки виклику інструментів)

### Рівень 2: Smoke-тест Gateway + dev agent (те, що фактично робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти внутрішньопроцесний Gateway
  - Створити/оновити сеанс `agent:dev:*` (із перевизначенням моделі для кожного запуску)
  - Перебрати моделі з ключами та перевірити:
    - «змістовну» відповідь (без інструментів)
    - що працює реальний виклик інструмента (`read` probe)
    - необов’язкові додаткові probe інструментів (`exec+read` probe)
    - що регресійні шляхи OpenAI (лише виклик інструмента → наступний крок) продовжують працювати
- Подробиці probe (щоб можна було швидко пояснювати збої):
  - probe `read`: тест записує файл із nonce у робочому просторі та просить agent виконати `read` і повернути nonce у відповіді.
  - probe `exec+read`: тест просить agent через `exec` записати nonce в тимчасовий файл, а потім через `read` зчитати його назад.
  - image probe: тест додає згенерований PNG (кіт + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибирати моделі:
  - За замовчуванням: сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для сучасного allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити набір
  - Для modern/all gateway-перевірок за замовчуванням використовується підібране обмеження з високим сигналом; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпної modern-перевірки або додатне число для меншого обмеження.
- Як вибирати провайдерів (уникнути сценарію «весь OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Probes інструментів і зображень у цьому live-тесті завжди ввімкнені:
  - probe `read` + probe `exec+read` (навантажувальна перевірка інструментів)
  - image probe запускається, коли модель оголошує підтримку введення зображень
  - Потік (на високому рівні):
    - Тест генерує крихітний PNG із «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований agent пересилає мультимодальне повідомлення користувача моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: незначні помилки дозволені)

Порада: щоб побачити, що саме можна тестувати на вашій машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke-тест бекенду CLI (Claude, Codex, Gemini або інших локальних CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent із локальним бекендом CLI, не торкаючись вашої типової конфігурації.
- Значення за замовчуванням для smoke-тестів конкретних бекендів зберігаються у визначенні `cli-backend.ts` розширення-власника.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Значення за замовчуванням:
  - Провайдер/модель за замовчуванням: `claude-cli/claude-sonnet-4-6`
  - Поведінка command/args/image визначається метаданими Plugin бекенду CLI-власника.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати реальне вкладення-зображення (шляхи впроваджуються в prompt). Для Docker-рецептів це за замовчуванням вимкнено, якщо не запитано явно.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як аргументи CLI замість впровадження в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати способом передавання аргументів зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб увімкнути перевірку безперервності того самого сеансу Claude Sonnet -> Opus, коли вибрана модель підтримує ціль перемикання. Для Docker-рецептів це за замовчуванням вимкнено для загальної надійності.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, щоб увімкнути MCP/local loopback probe інструментів. Для Docker-рецептів це за замовчуванням вимкнено, якщо не запитано явно.

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker-рецепт:

```bash
pnpm test:docker:live-cli-backend
```

Docker-рецепти для одного провайдера:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Примітки:

- Docker-runner розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає live smoke-тест бекенду CLI всередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Він визначає метадані smoke-тесту CLI з розширення-власника, а потім установлює відповідний пакет Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс у `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` потребує переносної OAuth-передплати Claude Code через `~/.claude/.credentials.json` із `claudeAiOauth.subscriptionType` або `CLAUDE_CODE_OAUTH_TOKEN` із `claude setup-token`. Спочатку перевіряється прямий `claude -p` у Docker, а потім виконуються два ходи Gateway CLI-backend без збереження змінних env Anthropic API-key. Цей маршрут передплати за замовчуванням вимикає probes Claude MCP/tool та image, оскільки зараз Claude маршрутизує використання сторонніх застосунків через оплату додаткового використання замість звичайних лімітів тарифного плану передплати.
- Smoke-тест live CLI-backend тепер перевіряє той самий наскрізний потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, потім виклик інструмента MCP `cron`, перевірений через gateway CLI.
- Smoke-тест Claude за замовчуванням також оновлює сеанс із Sonnet на Opus і перевіряє, що відновлений сеанс усе ще пам’ятає попередню нотатку.

## Live: smoke-тест прив’язування ACP (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік прив’язування розмов ACP із live ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайний наступний крок у тій самій розмові
  - перевірити, що наступний крок потрапляє до стенограми прив’язаного сеансу ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Значення за замовчуванням:
  - ACP-agents у Docker: `claude,codex,gemini`
  - ACP-agent для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови у стилі Slack DM
  - Бекенд ACP: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Примітки:
  - Цей маршрут використовує поверхню gateway `chat.send` з адміністративними синтетичними полями originating-route, щоб тести могли прикріплювати контекст каналу повідомлень без удавання зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр agents Plugin `acpx` для вибраного ACP harness agent.

Приклад:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker-рецепт:

```bash
pnpm test:docker:live-acp-bind
```

Docker-рецепти для одного agent:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Примітки щодо Docker:

- Docker-runner розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він послідовно запускає smoke-тест прив’язування ACP для всіх підтримуваних live CLI-agents: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він підключає `~/.profile`, готує відповідні автентифікаційні матеріали CLI у контейнері, встановлює `acpx` у записуваний npm-префікс, а потім встановлює запитаний live CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його немає.
- Усередині Docker runner встановлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб `acpx` зберігав змінні env провайдера з підключеного профілю доступними для дочірнього harness CLI.

## Live: smoke-тест harness app-server Codex

- Мета: перевірити harness Codex, яким володіє Plugin, через звичайний метод gateway
  `agent`:
  - завантажити вбудований Plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `openai/gpt-5.2` із примусово вибраним harness Codex
  - надіслати другий хід у той самий сеанс OpenClaw і перевірити, що потік
    app-server можна відновити
  - виконати `/codex status` і `/codex models` через той самий шлях
    команди gateway
  - за потреби виконати дві probes shell з підвищеними привілеями, перевірені Guardian: одну нешкідливу
    команду, яку має бути схвалено, і одне фіктивне вивантаження секрету, яке має бути
    відхилено, щоб agent перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Модель за замовчуванням: `openai/gpt-5.2`
- Необов’язкова image probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова MCP/tool probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова Guardian probe: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke-тест установлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний harness Codex
  не міг успішно пройти завдяки тихому fallback до PI.
- Auth: auth app-server Codex із локального входу в передплату Codex. Docker-
  smoke-тести також можуть надавати `OPENAI_API_KEY` для не-Codex probes, де це застосовно,
  а також необов’язкові скопійовані `~/.codex/auth.json` і `~/.codex/config.toml`.

Локальний рецепт:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker-рецепт:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Примітки щодо Docker:

- Docker-runner розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він підключає змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  auth CLI Codex, якщо вони є, встановлює `@openai/codex` у записуваний змонтований npm-
  префікс, готує дерево вихідного коду, а потім запускає лише live-тест Codex-harness.
- Docker за замовчуванням вмикає image, MCP/tool і Guardian probes. Установіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий
  налагоджувальний запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, відповідно до конфігурації live-
  тесту, щоб застарілі псевдоніми або fallback до PI не могли приховати регресію
  harness Codex.

### Рекомендовані live-рецепти

Вузькі, явні allowlist найшвидші та найменш схильні до збоїв:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, smoke-тест gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів для кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API-ключ Gemini + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke-тест адаптивного мислення Google:
  - Якщо локальні ключі зберігаються в профілі shell: `source ~/.profile`
  - Динамічне значення Gemini 3 за замовчуванням: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Динамічний бюджет Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує API Gemini (API-ключ).
- `google-antigravity/...` використовує міст OAuth Antigravity (кінцева точка agent у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема auth + особливості інструментів).
- API Gemini проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google API Gemini через HTTP (автентифікація через API-ключ / профіль); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw виконує локальний двійковий файл `gemini`; він має власну auth і може поводитися інакше (streaming/підтримка інструментів/розсинхронізація версій).

## Live: матриця моделей (що ми покриваємо)

Фіксованого «списку моделей CI» немає (live — за бажанням), але це **рекомендовані** моделі для регулярного покриття на машині розробника з ключами.

### Сучасний smoke-набір (виклик інструментів + image)

Це запуск «поширених моделей», який ми очікуємо зберігати працездатним:

- OpenAI (не Codex): `openai/gpt-5.2`
- OAuth OpenAI Codex: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` і `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запуск smoke-тесту gateway з інструментами + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (Read + необов’язковий Exec)

Виберіть щонайменше одну модель для кожної родини провайдерів:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (бажано мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою «tools», яку у вас ввімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання image (вкладення → мультимодальне повідомлення)

Додайте принаймні одну модель із підтримкою зображень у `OPENCLAW_LIVE_GATEWAY_MODELS` (варіанти Claude/Gemini/OpenAI з підтримкою vision тощо), щоб перевірити image probe.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнено ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (auth через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Більше провайдерів, які можна включити до live-матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (користувацькі кінцеві точки): `minimax` (cloud/API), а також будь-який OpenAI/Anthropic-сумісний проксі (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко прописати «всі моделі» в документації. Авторитетний список — це те, що повертає `discoverModels(...)` на вашій машині + які ключі доступні.

## Облікові дані (ніколи не комітьте)

Live-тести виявляють облікові дані так само, як це робить CLI. Практичні наслідки:

- Якщо CLI працює, live-тести повинні знаходити ті самі ключі.
- Якщо live-тест повідомляє «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі auth для кожного agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (це й означає «ключі профілів» у live-тестах)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється в staged live home, якщо присутній, але не є основним сховищем ключів профілів)
- Локальні live-запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для кожного agent, застарілий `credentials/` і підтримувані зовнішні каталоги auth CLI до тимчасового test home; staged live home пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` видаляються, щоб probes не торкалися вашого реального робочого простору хоста.

Якщо ви хочете покладатися на ключі env (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте наведені нижче Docker-runner-и (вони можуть монтувати `~/.profile` у контейнер).

## Live: Deepgram (транскрибування аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live: план кодування BytePlus

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live: медіа workflow ComfyUI

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Область:
  - Перевіряє вбудовані шляхи comfy для image, video і `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `plugins.entries.comfy.config.<capability>`
  - Корисно після змін у надсиланні workflow comfy, опитуванні, завантаженнях або реєстрації Plugin

## Live: генерація зображень

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Область:
  - Перелічує кожен зареєстрований Plugin провайдера генерації зображень
  - Завантажує відсутні змінні env провайдера з вашого shell входу (`~/.profile`) перед виконанням probes
  - За замовчуванням використовує live/env API-ключі раніше за збережені профілі auth, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної auth/профілю/моделі
  - Запускає кожного налаштованого провайдера через спільне runtime генерації зображень:
    - `<provider>:generate`
    - `<provider>:edit`, коли провайдер оголошує підтримку редагування
- Поточні вбудовані провайдери, які покриваються:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів та ігнорувати перевизначення лише через env

Для шляху shipped CLI додайте smoke-тест `infer` після того, як live-тест
провайдера/runtime пройде успішно:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Це покриває розбір аргументів CLI, визначення config/default-agent, активацію вбудованого
Plugin, repair залежностей runtime вбудованого пакета на вимогу, спільний
runtime генерації зображень і live-запит провайдера.

## Live: генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Область:
  - Перевіряє спільний шлях вбудованого провайдера генерації музики
  - Наразі покриває Google і MiniMax
  - Завантажує змінні env провайдера з вашого shell входу (`~/.profile`) перед виконанням probes
  - За замовчуванням використовує live/env API-ключі раніше за збережені профілі auth, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної auth/профілю/моделі
  - Запускає обидва оголошені режими runtime, коли вони доступні:
    - `generate` із введенням лише prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільного маршруту:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий live-файл Comfy, не ця спільна перевірка
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів та ігнорувати перевизначення лише через env

## Live: генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Область:
  - Перевіряє спільний шлях вбудованого провайдера генерації відео
  - За замовчуванням використовує безпечний для релізу шлях smoke-тесту: провайдери не-FAL, один запит text-to-video на провайдера, односекундний lobster-prompt і обмеження операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, оскільки затримка черги на боці провайдера може домінувати в часі релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує змінні env провайдера з вашого shell входу (`~/.profile`) перед виконанням probes
  - За замовчуванням використовує live/env API-ключі раніше за збережені профілі auth, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані shell
  - Пропускає провайдерів без придатної auth/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими трансформації, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальне введення зображення на основі буфера у спільній перевірці
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальне введення відео на основі буфера у спільній перевірці
  - Поточні провайдери `imageToVideo`, які оголошені, але пропускаються у спільній перевірці:
    - `vydra`, оскільки вбудований `veo3` підтримує лише текст, а вбудований `kling` вимагає віддалений URL зображення
  - Специфічне для провайдера покриття Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video плюс маршрут `kling`, який за замовчуванням використовує fixture віддаленого URL зображення
  - Поточне live-покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні провайдери `videoToVideo`, які оголошені, але пропускаються у спільній перевірці:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи наразі вимагають віддалені опорні URL `http(s)` / MP4
    - `google`, оскільки поточний спільний маршрут Gemini/Veo використовує локальне введення на основі буфера, і цей шлях не приймається у спільній перевірці
    - `openai`, оскільки поточний спільний маршрут не має гарантій доступу до video inpaint/remix, специфічних для org
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера до перевірки за замовчуванням, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити обмеження операції для кожного провайдера для агресивного smoke-запуску
- Необов’язкова поведінка auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати auth зі сховища профілів та ігнорувати перевизначення лише через env

## Live: медіа-harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні live-набори для image, music і video через єдину вбудовану точку входу репозиторію
  - Автоматично завантажує відсутні змінні env провайдера з `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до провайдерів, які наразі мають придатну auth
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і quiet-mode залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язане

- [Тестування](/uk/help/testing) — набори unit, integration, QA і Docker
