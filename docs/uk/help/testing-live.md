---
read_when:
    - Запуск живих smoke-тестів для матриці моделей / бекенду CLI / ACP / медіа-провайдера
    - Налагодження визначення облікових даних для живих тестів
    - Додавання нового живого тесту для конкретного провайдера
sidebarTitle: Live tests
summary: 'Живі тести (із зверненням до мережі): матриця моделей, бекенди CLI, ACP, медіа-провайдери, облікові дані'
title: 'Тестування: живі набори тестів'
x-i18n:
    generated_at: "2026-04-24T04:55:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a2f29767c3f8595d76c7502b1319e329dc87232cbde8fe205a83476b297f8af
    source_path: help/testing-live.md
    workflow: 15
---

Для швидкого старту, раннерів QA, unit/integration наборів тестів і Docker-потоків див.
[Тестування](/uk/help/testing). Ця сторінка охоплює **живі** (із зверненням до мережі)
набори тестів: матрицю моделей, бекенди CLI, ACP і живі тести медіа-провайдерів, а також
обробку облікових даних.

## Живий: огляд можливостей Android node

- Тест: `src/gateway/android-node.capabilities.live.test.ts`
- Скрипт: `pnpm android:test:integration`
- Мета: викликати **кожну команду, яка наразі оголошена** підключеним Android node, і перевірити поведінку контракту команд.
- Обсяг:
  - Налаштування перед запуском/вручну (набір тестів не встановлює/не запускає/не виконує сполучення застосунку).
  - Перевірка `node.invoke` шлюзу для вибраного Android node команда за командою.
- Необхідне попереднє налаштування:
  - Android-застосунок уже підключений і сполучений зі шлюзом.
  - Застосунок утримується на передньому плані.
  - Дозволи/згода на захоплення надані для можливостей, які ви очікуєте успішно перевірити.
- Необов’язкові перевизначення цілі:
  - `OPENCLAW_ANDROID_NODE_ID` або `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Повні відомості про налаштування Android: [Android App](/uk/platforms/android)

## Живий: smoke-тест моделей (ключі профілів)

Живі тести поділено на два рівні, щоб ми могли ізолювати збої:

- «Пряма модель» показує, чи провайдер/модель взагалі може відповісти з указаним ключем.
- «Gateway smoke» показує, чи працює для цієї моделі повний конвеєр gateway+agent (сесії, історія, інструменти, політика sandbox тощо).

### Рівень 1: Пряме завершення моделі (без gateway)

- Тест: `src/agents/models.profiles.live.test.ts`
- Мета:
  - Перелічити виявлені моделі
  - Використати `getApiKeyForModel`, щоб вибрати моделі, для яких у вас є облікові дані
  - Виконати невелике завершення для кожної моделі (і цільові регресійні перевірки за потреби)
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо ви викликаєте Vitest напряму)
- Установіть `OPENCLAW_LIVE_MODELS=modern` (або `all`, псевдонім для modern), щоб дійсно запустити цей набір; інакше його буде пропущено, щоб `pnpm test:live` залишався зосередженим на smoke-тестах gateway
- Як вибрати моделі:
  - `OPENCLAW_LIVE_MODELS=modern`, щоб запустити modern allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` — це псевдонім для modern allowlist
  - або `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (список дозволених значень через кому)
  - Для оглядів modern/all за замовчуванням використовується підібране обмеження з високим сигналом; установіть `OPENCLAW_LIVE_MAX_MODELS=0` для вичерпного modern-огляду або додатне число для меншого обмеження.
  - Вичерпні огляди використовують `OPENCLAW_LIVE_TEST_TIMEOUT_MS` як тайм-аут для всього тесту прямої моделі. Значення за замовчуванням: 60 хвилин.
  - Установіть `OPENCLAW_LIVE_MODEL_CONCURRENCY=20`, щоб запускати прямі перевірки моделей паралельно. Значення за замовчуванням: 1.
- Як вибрати провайдерів:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (список дозволених значень через кому)
- Звідки беруться ключі:
  - За замовчуванням: сховище профілів і резервні значення з env
  - Установіть `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати **лише сховище профілів**
- Навіщо це існує:
  - Відокремлює «API провайдера зламане / ключ недійсний» від «конвеєр gateway agent зламаний»
  - Містить невеликі ізольовані регресії (приклад: відтворення reasoning replay для OpenAI Responses/Codex Responses + потоки виклику інструментів)

### Рівень 2: Gateway + smoke-тест dev agent (те, що насправді робить "@openclaw")

- Тест: `src/gateway/gateway-models.profiles.live.test.ts`
- Мета:
  - Запустити внутрішньопроцесний gateway
  - Створити/змінити сесію `agent:dev:*` (перевизначення моделі для кожного запуску)
  - Ітерувати моделі-з-ключами і перевіряти:
    - «змістовну» відповідь (без інструментів)
    - що працює реальний виклик інструмента (`read` probe)
    - необов’язкові додаткові перевірки інструментів (`exec+read` probe)
    - що регресійні шляхи OpenAI (лише виклик інструмента → наступний крок) продовжують працювати
- Відомості про probe-и (щоб ви могли швидко пояснити збої):
  - `read` probe: тест записує nonce-файл у робочу область і просить agent виконати `read` цього файла та повернути nonce.
  - `exec+read` probe: тест просить agent через `exec` записати nonce у тимчасовий файл, а потім зчитати його назад через `read`.
  - image probe: тест додає згенерований PNG (кіт + рандомізований код) і очікує, що модель поверне `cat <CODE>`.
  - Посилання на реалізацію: `src/gateway/gateway-models.profiles.live.test.ts` і `src/gateway/live-image-probe.ts`.
- Як увімкнути:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо ви викликаєте Vitest напряму)
- Як вибрати моделі:
  - За замовчуванням: modern allowlist (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` — це псевдонім для modern allowlist
  - Або встановіть `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (або список через кому), щоб звузити вибір
  - Для gateway-оглядів modern/all за замовчуванням використовується підібране обмеження з високим сигналом; установіть `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` для вичерпного modern-огляду або додатне число для меншого обмеження.
- Як вибрати провайдерів (щоб уникнути «OpenRouter everything»):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (список дозволених значень через кому)
- Перевірки інструментів і зображень у цьому живому тесті завжди ввімкнені:
  - `read` probe + `exec+read` probe (навантаження на інструменти)
  - image probe запускається, коли модель заявляє підтримку вхідних зображень
  - Потік (високорівнево):
    - Тест генерує крихітний PNG з «CAT» + випадковим кодом (`src/gateway/live-image-probe.ts`)
    - Надсилає його через `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway розбирає вкладення у `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Вбудований agent пересилає мультимодальне повідомлення користувача до моделі
    - Перевірка: відповідь містить `cat` + код (допускаються незначні помилки OCR)

Порада: щоб побачити, що саме ви можете тестувати на своїй машині (і точні ідентифікатори `provider/model`), виконайте:

```bash
openclaw models list
openclaw models list --json
```

## Живий: smoke-тест бекенду CLI (Claude, Codex, Gemini або інші локальні CLI)

- Тест: `src/gateway/gateway-cli-backend.live.test.ts`
- Мета: перевірити конвеєр Gateway + agent з використанням локального бекенду CLI, не торкаючись вашої типової конфігурації.
- Типові параметри smoke-тесту для конкретного бекенду зберігаються у визначенні `cli-backend.ts` відповідного extension.
- Увімкнення:
  - `pnpm test:live` (або `OPENCLAW_LIVE_TEST=1`, якщо ви викликаєте Vitest напряму)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Типові значення:
  - Типовий провайдер/модель: `claude-cli/claude-sonnet-4-6`
  - Поведінка команди/аргументів/зображень береться з метаданих Plugin бекенду CLI-власника.
- Перевизначення (необов’язково):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, щоб надіслати справжнє вкладення-зображення (шляхи вбудовуються у prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, щоб передавати шляхи до файлів зображень як аргументи CLI замість вбудовування в prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (або `"list"`), щоб керувати тим, як передаються аргументи зображень, коли задано `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, щоб надіслати другий хід і перевірити потік відновлення.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, щоб вимкнути типову перевірку безперервності тієї самої сесії Claude Sonnet -> Opus (установіть `1`, щоб примусово ввімкнути її, коли вибрана модель підтримує ціль перемикання).

Приклад:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

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

- Docker runner розташовано в `scripts/test-live-cli-backend-docker.sh`.
- Він запускає живий smoke-тест бекенду CLI всередині Docker-образу репозиторію від імені непривілейованого користувача `node`.
- Він визначає метадані smoke-тесту CLI з відповідного extension, а потім встановлює відповідний Linux-пакет CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`) у кешований записуваний префікс `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (за замовчуванням: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` вимагає переносимий OAuth підписки Claude Code через або `~/.claude/.credentials.json` з `claudeAiOauth.subscriptionType`, або `CLAUDE_CODE_OAUTH_TOKEN` з `claude setup-token`. Спочатку він доводить прямий `claude -p` у Docker, а потім виконує два ходи Gateway CLI-backend без збереження env-змінних Anthropic API-key. Цей шлях підписки за замовчуванням вимикає перевірки Claude MCP/tool і image, тому що Claude наразі маршрутизує використання сторонніх застосунків через тарифікацію додаткового використання замість звичайних лімітів плану підписки.
- Живий smoke-тест бекенду CLI тепер перевіряє той самий наскрізний потік для Claude, Codex і Gemini: текстовий хід, хід класифікації зображення, а потім виклик інструмента MCP `cron`, перевірений через gateway CLI.
- Типовий smoke-тест Claude також змінює сесію із Sonnet на Opus і перевіряє, що відновлена сесія все ще пам’ятає попередню нотатку.

## Живий: smoke-тест прив’язки ACP (`/acp spawn ... --bind here`)

- Тест: `src/gateway/gateway-acp-bind.live.test.ts`
- Мета: перевірити реальний потік conversation-bind ACP із живим ACP agent:
  - надіслати `/acp spawn <agent> --bind here`
  - прив’язати синтетичну розмову каналу повідомлень на місці
  - надіслати звичайний наступний запит у цій самій розмові
  - переконатися, що цей наступний запит потрапляє до transcript прив’язаної ACP-сесії
- Увімкнення:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Типові значення:
  - ACP agent у Docker: `claude,codex,gemini`
  - ACP agent для прямого `pnpm test:live ...`: `claude`
  - Синтетичний канал: контекст розмови в стилі Slack DM
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
  - Цей шлях використовує поверхню gateway `chat.send` з полями synthetic originating-route лише для адміністраторів, щоб тести могли прив’язати контекст каналу повідомлень без імітації зовнішньої доставки.
  - Якщо `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` не задано, тест використовує вбудований реєстр agent вбудованого Plugin `acpx` для вибраного ACP harness agent.

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

Рецепти Docker для окремих agent:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Примітки щодо Docker:

- Docker runner розташовано в `scripts/test-live-acp-bind-docker.sh`.
- За замовчуванням він запускає smoke-тест прив’язки ACP послідовно для всіх підтримуваних живих CLI agent: `claude`, `codex`, потім `gemini`.
- Використовуйте `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` або `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, щоб звузити матрицю.
- Він підвантажує `~/.profile`, передає відповідні автентифікаційні матеріали CLI у контейнер, встановлює `acpx` у записуваний npm-префікс, а потім установлює запитаний живий CLI (`@anthropic-ai/claude-code`, `@openai/codex` або `@google/gemini-cli`), якщо його немає.
- Усередині Docker runner установлює `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, щоб acpx зберігав env-змінні провайдера з підвантаженого профілю доступними для дочірнього harness CLI.

## Живий: smoke-тест harness app-server Codex

- Мета: перевірити Codex harness, яким володіє plugin, через звичайний метод gateway
  `agent`:
  - завантажити вбудований plugin `codex`
  - вибрати `OPENCLAW_AGENT_RUNTIME=codex`
  - надіслати перший хід gateway agent до `openai/gpt-5.2` із примусово вибраним Codex harness
  - надіслати другий хід до тієї самої сесії OpenClaw і перевірити, що потік
    app-server може відновитися
  - запустити `/codex status` і `/codex models` через той самий шлях
    команди gateway
  - за бажанням запустити дві ескальовані shell-перевірки, перевірені Guardian: одну нешкідливу
    команду, яку слід схвалити, і одне фальшиве вивантаження секрету, яке має бути
    відхилене, щоб agent перепитав
- Тест: `src/gateway/gateway-codex-harness.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Типова модель: `openai/gpt-5.2`
- Необов’язкова перевірка зображення: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Необов’язкова перевірка MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Необов’язкова перевірка Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Smoke-тест установлює `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, щоб зламаний Codex
  harness не міг пройти завдяки тихому поверненню до PI.
- Автентифікація: автентифікація Codex app-server з локального входу до підписки Codex. Docker
  smoke-тести також можуть надавати `OPENAI_API_KEY` для не-Codex перевірок, де це застосовно,
  а також необов’язково скопійовані `~/.codex/auth.json` і `~/.codex/config.toml`.

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

- Docker runner розташовано в `scripts/test-live-codex-harness-docker.sh`.
- Він підвантажує змонтований `~/.profile`, передає `OPENAI_API_KEY`, копіює файли
  автентифікації Codex CLI, якщо вони є, встановлює `@openai/codex` у записуваний змонтований npm
  префікс, готує дерево вихідного коду, а потім запускає лише живий тест Codex-harness.
- Docker за замовчуванням вмикає перевірки image, MCP/tool і Guardian. Установіть
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` або
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0`, коли вам потрібен вужчий
  налагоджувальний запуск.
- Docker також експортує `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, як і конфігурація живого
  тесту, щоб застарілі псевдоніми або повернення до PI не могли приховати регресію
  Codex harness.

### Рекомендовані живі рецепти

Вузькі, явні allowlist-и — найшвидші та найменш схильні до збоїв:

- Одна модель, напряму (без gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Одна модель, smoke-тест gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Виклик інструментів для кількох провайдерів:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Фокус на Google (API-ключ Gemini + Antigravity):
  - Gemini (API-ключ): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Примітки:

- `google/...` використовує Gemini API (API-ключ).
- `google-antigravity/...` використовує міст OAuth Antigravity (кінцева точка agent у стилі Cloud Code Assist).
- `google-gemini-cli/...` використовує локальний Gemini CLI на вашій машині (окрема автентифікація + особливості інструментарію).
- Gemini API порівняно з Gemini CLI:
  - API: OpenClaw викликає розміщений Google Gemini API через HTTP (автентифікація API-ключем / профілем); саме це більшість користувачів мають на увазі під «Gemini».
  - CLI: OpenClaw викликає локальний двійковий файл `gemini`; він має власну автентифікацію і може поводитися інакше (потокова передача/підтримка інструментів/розбіжності версій).

## Живий: матриця моделей (що ми охоплюємо)

Фіксованого «списку моделей CI» немає (живі тести вмикаються за бажанням), але це **рекомендовані** моделі для регулярного покриття на машині розробника з ключами.

### Сучасний набір smoke-тестів (виклик інструментів + зображення)

Це запуск «поширених моделей», який ми очікуємо підтримувати в робочому стані:

- OpenAI (не-Codex): `openai/gpt-5.2`
- OpenAI Codex OAuth: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` і `google/gemini-3-flash-preview` (уникайте старіших моделей Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` і `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Запустити smoke-тест gateway з інструментами + зображенням:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Базовий рівень: виклик інструментів (Read + необов’язковий Exec)

Виберіть принаймні одну модель з кожної родини провайдерів:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (або `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (або `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Необов’язкове додаткове покриття (було б добре мати):

- xAI: `xai/grok-4` (або найновіша доступна)
- Mistral: `mistral/`… (виберіть одну модель із підтримкою “tools”, яку у вас увімкнено)
- Cerebras: `cerebras/`… (якщо у вас є доступ)
- LM Studio: `lmstudio/`… (локально; виклик інструментів залежить від режиму API)

### Vision: надсилання зображення (вкладення → мультимодальне повідомлення)

Додайте принаймні одну модель із підтримкою зображень до `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/варіанти OpenAI із підтримкою vision тощо), щоб задіяти image probe.

### Агрегатори / альтернативні gateway

Якщо у вас увімкнені ключі, ми також підтримуємо тестування через:

- OpenRouter: `openrouter/...` (сотні моделей; використовуйте `openclaw models scan`, щоб знайти кандидатів із підтримкою tools+image)
- OpenCode: `opencode/...` для Zen і `opencode-go/...` для Go (автентифікація через `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Інші провайдери, які ви можете включити до живої матриці (якщо у вас є облікові дані/конфігурація):

- Вбудовані: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Через `models.providers` (власні кінцеві точки): `minimax` (хмара/API), а також будь-який сумісний із OpenAI/Anthropic проксі (LM Studio, vLLM, LiteLLM тощо)

Порада: не намагайтеся жорстко закодувати в документації «усі моделі». Авторитетний список — це те, що `discoverModels(...)` повертає на вашій машині, плюс доступні ключі.

## Облікові дані (ніколи не комітьте)

Живі тести виявляють облікові дані так само, як і CLI. Практичні наслідки:

- Якщо CLI працює, живі тести мають знайти ті самі ключі.
- Якщо живий тест каже «немає облікових даних», налагоджуйте це так само, як налагоджували б `openclaw models list` / вибір моделі.

- Профілі автентифікації для окремих agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (саме це в живих тестах означає «ключі профілів»)
- Конфігурація: `~/.openclaw/openclaw.json` (або `OPENCLAW_CONFIG_PATH`)
- Каталог застарілого стану: `~/.openclaw/credentials/` (копіюється до підготовленого живого домашнього каталогу, якщо наявний, але не є основним сховищем ключів профілів)
- Локальні живі запуски за замовчуванням копіюють активну конфігурацію, файли `auth-profiles.json` для окремих agent, застарілий каталог `credentials/` і підтримувані зовнішні каталоги автентифікації CLI до тимчасового домашнього каталогу тесту; підготовлені живі домашні каталоги пропускають `workspace/` і `sandboxes/`, а перевизначення шляхів `agents.*.workspace` / `agentDir` видаляються, щоб probe-и не торкалися вашої реальної робочої області на хості.

Якщо ви хочете покладатися на ключі env (наприклад, експортовані у вашому `~/.profile`), запускайте локальні тести після `source ~/.profile`, або використовуйте наведені нижче Docker runner-и (вони можуть монтувати `~/.profile` у контейнер).

## Живий Deepgram (транскрибування аудіо)

- Тест: `extensions/deepgram/audio.live.test.ts`
- Увімкнення: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Живий BytePlus coding plan

- Тест: `extensions/byteplus/live.test.ts`
- Увімкнення: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Необов’язкове перевизначення моделі: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Живий медіапотік ComfyUI workflow

- Тест: `extensions/comfy/comfy.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Обсяг:
  - Перевіряє вбудовані шляхи comfy для зображень, відео і `music_generate`
  - Пропускає кожну можливість, якщо не налаштовано `models.providers.comfy.<capability>`
  - Корисно після змін у надсиланні workflow comfy, опитуванні, завантаженнях або реєстрації plugin

## Жива генерація зображень

- Тест: `test/image-generation.runtime.live.test.ts`
- Команда: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Обсяг:
  - Перелічує кожен зареєстрований provider plugin генерації зображень
  - Підвантажує відсутні env-змінні провайдера з вашої оболонки входу (`~/.profile`) перед перевіркою
  - За замовчуванням використовує живі/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає стандартні варіанти генерації зображень через спільну runtime-можливість:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
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
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Жива генерація музики

- Тест: `extensions/music-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Обсяг:
  - Перевіряє спільний вбудований шлях провайдерів генерації музики
  - Наразі охоплює Google і MiniMax
  - Підвантажує env-змінні провайдера з вашої оболонки входу (`~/.profile`) перед перевіркою
  - За замовчуванням використовує живі/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - Запускає обидва оголошені runtime-режими, коли вони доступні:
    - `generate` з вхідними даними лише у вигляді prompt
    - `edit`, коли провайдер оголошує `capabilities.edit.enabled`
  - Поточне покриття спільного шляху:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: окремий живий файл Comfy, не цей спільний огляд
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Жива генерація відео

- Тест: `extensions/video-generation-providers.live.test.ts`
- Увімкнення: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Обсяг:
  - Перевіряє спільний вбудований шлях провайдерів генерації відео
  - За замовчуванням використовує безпечний для релізу шлях smoke-тесту: провайдери без FAL, один запит text-to-video на провайдера, prompt про односекундного лобстера та обмеження операції на провайдера з `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` за замовчуванням)
  - За замовчуванням пропускає FAL, оскільки затримка черги на боці провайдера може домінувати в часі релізу; передайте `--video-providers fal` або `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, щоб запустити його явно
  - Підвантажує env-змінні провайдера з вашої оболонки входу (`~/.profile`) перед перевіркою
  - За замовчуванням використовує живі/env API-ключі раніше за збережені профілі автентифікації, щоб застарілі тестові ключі в `auth-profiles.json` не маскували реальні облікові дані оболонки
  - Пропускає провайдерів без придатної автентифікації/профілю/моделі
  - За замовчуванням запускає лише `generate`
  - Установіть `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, щоб також запускати оголошені режими перетворення, коли вони доступні:
    - `imageToVideo`, коли провайдер оголошує `capabilities.imageToVideo.enabled` і вибраний провайдер/модель приймає локальні вхідні зображення на основі buffer у спільному огляді
    - `videoToVideo`, коли провайдер оголошує `capabilities.videoToVideo.enabled` і вибраний провайдер/модель приймає локальні вхідні відео на основі buffer у спільному огляді
  - Поточні оголошені, але пропущені провайдери `imageToVideo` у спільному огляді:
    - `vydra`, тому що вбудований `veo3` підтримує лише text, а вбудований `kling` вимагає віддалений URL зображення
  - Покриття Vydra для конкретного провайдера:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - цей файл запускає `veo3` text-to-video, а також шлях `kling`, який за замовчуванням використовує віддалений URL зображення з fixture
  - Поточне живе покриття `videoToVideo`:
    - лише `runway`, коли вибрана модель — `runway/gen4_aleph`
  - Поточні оголошені, але пропущені провайдери `videoToVideo` у спільному огляді:
    - `alibaba`, `qwen`, `xai`, оскільки ці шляхи наразі вимагають віддалені URL-посилання `http(s)` / MP4 reference
    - `google`, оскільки поточний спільний шлях Gemini/Veo використовує локальні вхідні дані на основі buffer, і цей шлях не приймається у спільному огляді
    - `openai`, оскільки поточний спільний шлях не гарантує доступ до org-specific inpaint/remix відео
- Необов’язкове звуження:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, щоб включити кожного провайдера до типового огляду, включно з FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, щоб зменшити обмеження операції для кожного провайдера під час агресивного smoke-запуску
- Необов’язкова поведінка автентифікації:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, щоб примусово використовувати автентифікацію зі сховища профілів і ігнорувати перевизначення лише через env

## Живий медіа-harness

- Команда: `pnpm test:live:media`
- Призначення:
  - Запускає спільні живі набори тестів для зображень, музики та відео через один нативний для репозиторію вхідний пункт
  - Автоматично підвантажує відсутні env-змінні провайдера з `~/.profile`
  - За замовчуванням автоматично звужує кожен набір до провайдерів, які наразі мають придатну автентифікацію
  - Повторно використовує `scripts/test-live.mjs`, тому поведінка Heartbeat і тихого режиму залишається узгодженою
- Приклади:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Пов’язане

- [Тестування](/uk/help/testing) — unit, integration, QA і Docker набори тестів
