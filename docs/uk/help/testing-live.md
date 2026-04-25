---
read_when:
    - Запуск живих smoke-тестів матриці моделей / бекенду CLI / ACP / медіапровайдера
    - Налагодження визначення облікових даних для живих тестів
    - Додавання нового живого тесту для конкретного провайдера
sidebarTitle: Live tests
summary: 'Живі тести (із зверненням до мережі): матриця моделей, бекенди CLI, ACP, медіапровайдери, облікові дані'
title: 'Тестування: живі набори тестів'
x-i18n:
    generated_at: "2026-04-25T20:40:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72e98c2ad8a745254664e72b8ef99e617444e59f0b27785b3670bff2538970c4
    source_path: help/testing-live.md
    workflow: 15
---

Для швидкого старту, QA-ранерів, unit/integration наборів тестів і Docker-потоків див.
[Тестування](/uk/help/testing). Ця сторінка охоплює **живі** (із зверненням до мережі) набори тестів:
матрицю моделей, бекенди CLI, ACP і живі тести медіапровайдерів, а також
обробку облікових даних.

## Живі: локальні команди smoke-тестів профілю

Виконайте source для `~/.profile` перед ad hoc живими перевірками, щоб ключі провайдерів і шляхи локальних інструментів
відповідали вашій оболонці:

```bash
source ~/.profile
```

Безпечний медіа smoke-тест:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Безпечний smoke-тест готовності голосового дзвінка:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` — це пробний запуск, якщо також не вказано `--yes`. Використовуйте `--yes` лише тоді,
коли ви навмисно хочете здійснити справжній дзвінок-сповіщення. Для Twilio, Telnyx і
Plivo успішна перевірка готовності вимагає публічного URL Webhook; резервні варіанти лише для локального
loopback/приватного доступу навмисно відхиляються.

## Живі: огляд можливостей Android Node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, що зараз оголошена** підключеним Android Node, і перевірити поведінку контракту команд.
- Обсяг:
  - Попередньо підготовлене/ручне налаштування (набір тестів не встановлює/не запускає/не з’єднує застосунок).
  - Перевірка `node.invoke` шлюзу команда за командою для вибраного Android Node.
- Обов’язкове попереднє налаштування:
  - Android-застосунок уже підключений і з’єднаний із Gateway.
  - Застосунок утримується на передньому плані.
  - Надано дозволи/згоду на захоплення для можливостей, які ви очікуєте пройти.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні відомості про налаштування Android: [Android App](/uk/platforms/android)

## Живі: smoke-тест моделей (ключі профілю)

Живі тести поділено на два рівні, щоб ми могли ізолювати збої:

- «Direct model» показує, чи провайдер/модель взагалі можуть відповісти з наданим ключем.
- «Gateway smoke» показує, чи повністю працює конвеєр Gateway+агента для цієї моделі (сеанси, історія, інструменти, політика sandbox тощо).

### Рівень 1: пряме завершення моделі (без Gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel` для вибору моделей, для яких у вас є облікові дані
  - Виконати невелике завершення для кожної моделі (і цільові регресійні перевірки, де це потрібно)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Встановіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб справді запустити цей набір тестів; інакше він пропускається, щоб `pnpm test:live` залишався зосередженим на smoke-тестах Gateway
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для сучасного allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist через кому)
  - Для проходів modern/all за замовчуванням використовується підібране обмеження з високим сигналом; встановіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпного сучасного проходу або додатне число для меншого обмеження.
  - Для вичерпних проходів використовується `OPENCLAW_LIVE_TEST_TIMEOUT_MS` як тайм-аут усього тесту direct-model. За замовчуванням: 60 хвилин.
  - Проби direct-model за замовчуванням виконуються з паралелізмом 20; щоб перевизначити, встановіть `OPENCLAW_LIVE_MODEL_CONCURRENCY`.
- Як вибрати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і резервні варіанти з env
  - Встановіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламаний / ключ недійсний» від «конвеєр агента Gateway зламаний»
  - Містить невеликі, ізольовані регресії (приклад: OpenAI Responses/Codex Responses reasoning replay + потоки викликів інструментів)

### Рівень 2: smoke-тест Gateway + dev-агента (те, що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Підняти Gateway in-process
  - Створити/оновити сеанс `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Перебрати моделі з ключами й перевірити:
    - «змістовну» відповідь (без інструментів)
    - що працює реальний виклик інструмента (проба читання)
    - необов’язкові додаткові проби інструментів (проба exec+read)
    - що регресійні шляхи OpenAI (лише tool-call → наступний виклик) продовжують працювати
- Відомості про проби (щоб ви могли швидко пояснювати збої):
  - проба `read`: тест записує файл із nonce у робочий простір і просить агента `read` його та повернути nonce у відповіді.
  - проба `exec+read`: тест просить агента записати nonce у тимчасовий файл через `exec`, а потім прочитати його назад через `read`.
  - проба зображення: тест додає згенерований PNG (кіт + випадковий код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
- Як вибрати моделі:
  - За замовчуванням: сучасний allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для сучасного allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Для проходів modern/all Gateway за замовчуванням використовується підібране обмеження з високим сигналом; встановіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпного сучасного проходу або додатне число для меншого обмеження.
- Як вибрати провайдерів (уникати «все з OpenRouter»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist через кому)
- Проби інструментів і зображень у цьому живому тесті завжди увімкнені:
  - проба `read` + проба `exec+read` (навантажувальна перевірка інструментів)
  - проба зображення виконується, коли модель оголошує підтримку введення зображень
  - Потік (високорівнево):
    - Тест генерує крихітний PNG із «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення в `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований агент пересилає мультимодальне повідомлення користувача моделі
    - Перевірка: відповідь містить `cat` + код (допуск OCR: незначні помилки дозволені)

Порада: щоб побачити, що саме можна тестувати на вашій машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Живі: smoke-тест бекенду CLI (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + агента з використанням локального бекенду CLI, не торкаючись вашої стандартної конфігурації.
- Типові параметри smoke-тестів для конкретного бекенду зберігаються у визначенні `cli-backend.ts` у відповідному extension.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- За замовчуванням:
  - Провайдер/модель за замовчуванням: `claude-cli/claude-sonnet-4-6`
  - Поведінка команди/аргументів/зображень береться з метаданих plugin відповідного бекенду CLI.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати справжнє вкладення-зображення (шляхи впроваджуються в prompt). У рецептах Docker це типово вимкнено, якщо явно не запитано.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як аргументи CLI замість впровадження в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати тим, як передаються аргументи зображень, коли встановлено `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1`, щоб увімкнути пробу безперервності того самого сеансу Claude Sonnet -> Opus, коли вибрана модель підтримує ціль перемикання. У рецептах Docker це типово вимкнено для загальної надійності.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1`, щоб увімкнути loopback-пробу MCP/інструментів. У рецептах Docker це типово вимкнено, якщо явно не запитано.

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Недорогий smoke-тест конфігурації Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Це не просить Gemini згенерувати відповідь. Тест записує ті самі системні
налаштування, які OpenClaw надає Gemini, а потім запускає `gemini --debug mcp list`, щоб довести,
що збережений сервер `transport: "streamable-http"` нормалізується до HTTP-форми Gemini MCP
і може підключатися.

Рецепт Docker:

```bash
pnpm test:docker:live-cli-backend
```

Рецепти Docker для окремих провайдерів:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Примітки:

- Docker-ранер розташований у `scripts/test-live-cli-backend-docker.sh`.
- Він запускає живий smoke-тест CLI-бекенду всередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Він визначає метадані CLI smoke-тесту з відповідного extension, а потім установлює відповідний пакет Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований доступний для запису префікс у `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` вимагає переносимого OAuth підписки Claude Code через або `~/.claude/.credentials.json` із `claudeAiOauth.subscriptionType`, або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він підтверджує прямий `claude -p` у Docker, а потім запускає два ходи CLI-бекенду Gateway без збереження змінних середовища ключів Anthropic API. Ця доріжка підписки типово вимикає проби Claude MCP/інструментів і зображень, оскільки Claude зараз маршрутизує використання сторонніх застосунків через оплату додаткового використання, а не звичайні ліміти тарифного плану підписки.
- Живий smoke-тест CLI-бекенду тепер перевіряє той самий наскрізний потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображень, а потім виклик інструмента MCP `cron`, перевірений через шлюзовий CLI.
- Типовий smoke-тест Claude також оновлює сеанс із Sonnet до Opus і перевіряє, що відновлений сеанс усе ще пам’ятає попередню нотатку.

## Живі: smoke-тест ACP bind (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік ACP conversation-bind із живим ACP-агентом:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайне наступне повідомлення в тій самій розмові
  - перевірити, що наступне повідомлення потрапляє до транскрипту прив’язаного сеансу ACP
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- За замовчуванням:
  - ACP-агенти в Docker: `claude,codex,gemini`
  - ACP-агент для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови у стилі Slack DM
  - ACP-бекенд: `acpx`
- Перевизначення:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Примітки:
  - Ця доріжка використовує поверхню gateway `chat.send` з синтетичними полями originating-route лише для адміністратора, щоб тести могли додавати контекст каналу повідомлень без удавання зовнішньої доставки.
  - Коли `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не встановлено, тест використовує вбудований реєстр агентів plugin `acpx` для вибраного ACP harness-агента.

Приклад:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Рецепт Docker:

```bash
pnpm test:docker:live-acp-bind
```

Рецепти Docker для окремих агентів:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Примітки щодо Docker:

- Docker-ранер розташований у `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає ACP bind smoke-тест послідовно для сукупних живих CLI-агентів: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode`, щоб звузити матрицю.
- Він виконує source для `~/.profile`, переносить відповідні автентифікаційні дані CLI до контейнера, а потім установлює запитаний живий CLI (`@anthropic-ai/claude-code`, `@openai/codex`, `@google/gemini-cli` або `opencode-ai`), якщо його немає. Сам ACP-бекенд — це вбудований пакет середовища виконання `acpx/runtime` із plugin `acpx`.
- Варіант Docker для OpenCode — це сувора регресійна доріжка для одного агента. Після виконання source для `~/.profile` він записує тимчасову типову модель `OPENCODE_CONFIG_CONTENT` із `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (типово `opencode/kimi-k2.6`), а `pnpm test:docker:live-acp-bind:opencode` вимагає транскрипт прив’язаного помічника замість прийняття загального пропуску після bind.
- Прямі виклики CLI `acpx` — це лише ручний/обхідний шлях для порівняння поведінки поза Gateway. Docker ACP bind smoke-тест перевіряє вбудований бекенд середовища виконання `acpx` OpenClaw.

## Живі: smoke-тест Codex app-server harness

- Мета: перевірити harness Codex, яким володіє plugin, через звичайний
  метод gateway `agent`:
  - завантажити вбудований plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `openai/gpt-5.2` із примусовим Codex harness
  - надіслати другий хід у той самий сеанс OpenClaw і перевірити, що потік
    app-server може відновитися
  - виконати `/codex status` і `/codex models` через той самий шлях
    команд gateway
  - за потреби виконати дві ескальовані shell-проби, перевірені Guardian: одну нешкідливу
    команду, яку слід схвалити, і одне фальшиве вивантаження секрету, яке має бути
    відхилене, щоб агент перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.2`
- Необов’язкова проба зображення: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова проба MCP/інструментів: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова проба Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke-тест установлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний Codex
  harness не міг пройти, непомітно переключившись на Pi.
- Автентифікація: автентифікація Codex app-server із локального входу до підписки Codex. Docker
  smoke-тести також можуть надавати `OPENAI_API_KEY` для проб не-Codex, де це доречно,
  а також за потреби скопійовані `~/.codex/auth.json` і `~/.codex/config.toml`.

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

Рецепт Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Примітки щодо Docker:

- Docker-ранер розташований у `scripts/test-live-codex-harness-docker.sh`.
- Він виконує source для змонтованого `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації CLI Codex, якщо вони є, установлює `@openai/codex` у доступний для запису змонтований npm
  prefix, готує дерево вихідного коду, а потім запускає лише живий тест Codex-harness.
- Docker типово вмикає проби зображень, MCP/інструментів і Guardian. Установіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0`,
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли потрібен вужчий налагоджувальний
  запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, що відповідає конфігурації живого
  тесту, тому застарілі псевдоніми або резервний перехід на Pi не можуть приховати регресію
  Codex harness.

### Рекомендовані живі рецепти

Вузькі, явні allowlist — найшвидші та найменш нестабільні:

- Одна модель, напряму (без Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, Gateway smoke-тест:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклики інструментів для кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (ключ API Gemini + Antigravity):
  - Gemini (ключ API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke-тест adaptive thinking для Google:
  - Якщо локальні ключі зберігаються в профілі оболонки: `source ~/.profile`
  - Динамічний режим за замовчуванням для Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Динамічний бюджет для Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Примітки:

- `google/...` використовує Gemini API (ключ API).
- `google-antigravity/...` використовує міст Antigravity OAuth (кінцева точка агента у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості інструментів).
- Gemini API проти Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (ключ API / автентифікація профілю); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw викликає локальний двійковий файл `gemini`; він має власну автентифікацію та може поводитися інакше (streaming/підтримка інструментів/розбіжність версій).

## Живі: матриця моделей (що ми покриваємо)

Фіксованого «списку моделей CI» немає (живі тести запускаються за бажанням), але це **рекомендовані** моделі, які варто регулярно покривати на машині розробника з ключами.

### Сучасний набір smoke-тестів (виклики інструментів + зображення)

Це запуск «поширених моделей», який, як ми очікуємо, має й надалі працювати:

- OpenAI (не-Codex): `openai/gpt-5.2`
- OAuth OpenAI Codex: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` і `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запустити Gateway smoke-тест з інструментами + зображенням:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклики інструментів (Read + необов’язковий Exec)

Виберіть щонайменше одну модель на сімейство провайдерів:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (було б добре мати):

- xAI: `xai/grok-4` (або найновіша доступна версія)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою «tools», яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо маєте доступ)
- LM Studio: `lmstudio/`… (локально; виклики інструментів залежать від режиму API)

### Vision: надсилання зображення (вкладення → мультимодальне повідомлення)

Додайте щонайменше одну модель із підтримкою зображень до `OPENCLAW_LIVE_GATEWAY_MODELS` (варіанти Claude/Gemini/OpenAI із підтримкою vision тощо), щоб перевірити пробу зображення.

### Агрегатори / альтернативні Gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою інструментів і зображень)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Інші провайдери, яких можна додати до живої матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (власні кінцеві точки): `minimax` (хмара/API), а також будь-який проксі, сумісний з OpenAI/Anthropic (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко закодувати в документації «всі моделі». Авторитетний список — це те, що `discoverModels(...)` повертає на вашій машині, разом із ключами, які доступні.

## Облікові дані (ніколи не комітьте)

Живі тести виявляють облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, живі тести мають знаходити ті самі ключі.
- Якщо живий тест каже «немає облікових даних», налагоджуйте це так само, як ви налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для кожного агента: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це в живих тестах означає «ключі профілю»)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється до staging live home, якщо присутній, але не є основним сховищем ключів профілю)
- Локальні живі запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для кожного агента, застарілий `credentials/` і підтримувані зовнішні каталоги автентифікації CLI до тимчасового тестового home; staging live home пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` видаляються, щоб проби не працювали у вашому реальному робочому просторі хоста.

Якщо ви хочете покладатися на ключі env (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile` або використовуйте Docker-ранери нижче (вони можуть монтувати `~/.profile` у контейнер).

## Живі тести Deepgram (транскрибування аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Живий тест BytePlus coding plan

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Живі медіатести workflow ComfyUI

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy для зображень, відео та `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `plugins.entries.comfy.config.<capability>`
  - Корисно після змін у надсиланні workflow comfy, опитуванні, завантаженнях або реєстрації plugin

## Живі тести генерації зображень

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований plugin провайдера генерації зображень
  - Завантажує відсутні env-змінні провайдерів із вашої оболонки входу (`~/.profile`) перед пробами
  - За замовчуванням використовує живі/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає кожного налаштованого провайдера через спільне середовище виконання генерації зображень:
    - `<provider>:generate`
    - `<provider>:edit`, коли провайдер оголошує підтримку редагування
- Поточні вбудовані провайдери, що покриваються:
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
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише з env

Для шляху CLI, що постачається, додайте smoke-тест `infer` після того, як живий
тест провайдера/середовища виконання пройде:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Це покриває розбір аргументів CLI, визначення конфігурації/типового агента, активацію вбудованих
plugin, відновлення вбудованих залежностей середовища виконання на вимогу, спільне
середовище виконання генерації зображень і живий запит до провайдера.

## Живі тести генерації музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний вбудований шлях провайдера генерації музики
  - Наразі охоплює Google і MiniMax
  - Завантажує env-змінні провайдерів із вашої оболонки входу (`~/.profile`) перед пробами
  - За замовчуванням використовує живі/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає обидва оголошені режими середовища виконання, коли вони доступні:
    - `generate` з вхідними даними лише у вигляді prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільної доріжки:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий живий файл Comfy, а не цей спільний прохід
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише з env

## Живі тести генерації відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний вбудований шлях провайдера генерації відео
  - За замовчуванням використовує безпечний для релізу шлях smoke-тесту: провайдери не-FAL, один запит text-to-video на провайдера, односекундний prompt про омара та обмеження операції для кожного провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, оскільки затримка черги на стороні провайдера може домінувати в часі релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Завантажує env-змінні провайдерів із вашої оболонки входу (`~/.profile`) перед пробами
  - За замовчуванням використовує живі/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Встановіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими перетворення, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальне введення зображень із backing buffer у спільному проході
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальне введення відео із backing buffer у спільному проході
  - Поточні оголошені, але пропущені провайдери `imageToVideo` у спільному проході:
    - `vydra`, оскільки вбудований `veo3` підтримує лише text, а вбудований `kling` вимагає віддалений URL зображення
  - Покриття Vydra, специфічне для провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video, а також доріжку `kling`, яка за замовчуванням використовує fixture із віддаленим URL зображення
  - Поточне живе покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні оголошені, але пропущені провайдери `videoToVideo` у спільному проході:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи зараз вимагають віддалені URL-посилання `http(s)` / MP4
    - `google`, оскільки поточна спільна доріжка Gemini/Veo використовує локальне введення з backing buffer, а цей шлях не приймається у спільному проході
    - `openai`, оскільки поточна спільна доріжка не гарантує доступ до video inpaint/remix, специфічний для org
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера до типового проходу, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити ліміт операції кожного провайдера для агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише з env

## Harness для живих медіатестів

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні живі набори тестів для зображень, музики й відео через один нативний для репозиторію entrypoint
  - Автоматично завантажує відсутні env-змінні провайдерів із `~/.profile`
  - За замовчуванням автоматично звужує кожен набір тестів до провайдерів, які зараз мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і тихого режиму лишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язане

- [Тестування](/uk/help/testing) — набори unit, integration, QA і Docker
