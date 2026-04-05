---
read_when:
    - Потрібно знайти конкретний крок онбордингу або прапорець
    - Автоматизація онбордингу в неінтерактивному режимі
    - Налагодження поведінки онбордингу
sidebarTitle: Onboarding Reference
summary: 'Повний довідник з онбордингу CLI: кожен крок, прапорець і поле конфігурації'
title: Довідник з онбордингу
x-i18n:
    generated_at: "2026-04-05T18:17:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e02a4da4a39ba335199095723f5d3b423671eb12efc2d9e4f9e48c1e8ee18419
    source_path: reference/wizard.md
    workflow: 15
---

# Довідник з онбордингу

Це повний довідник для `openclaw onboard`.
Огляд вищого рівня див. у [Onboarding (CLI)](/start/wizard).

## Деталі процесу (локальний режим)

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо існує `~/.openclaw/openclaw.json`, виберіть **Keep / Modify / Reset**.
    - Повторний запуск онбордингу **не** стирає нічого, якщо ви явно не виберете **Reset**
      (або не передасте `--reset`).
    - Для CLI `--reset` типово використовує `config+creds+sessions`; використовуйте `--reset-scope full`,
      щоб також видалити workspace.
    - Якщо конфігурація недійсна або містить застарілі ключі, майстер зупиняється та просить
      вас виконати `openclaw doctor` перед продовженням.
    - Скидання використовує `trash` (ніколи не `rm`) і пропонує такі області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сесії
      - Повне скидання (також видаляє workspace)
  </Step>
  <Step title="Модель/автентифікація">
    - **Anthropic API key**: використовує `ANTHROPIC_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає його для використання демоном.
    - **Anthropic API key**: бажаний варіант помічника Anthropic в онбордингу/налаштуванні.
    - **Anthropic setup-token (legacy/manual)**: знову доступний в онбордингу/налаштуванні, але Anthropic повідомила користувачам OpenClaw, що шлях входу Claude в OpenClaw вважається використанням сторонньої harness і вимагає **Extra Usage** в обліковому записі Claude.
    - **OpenAI Code (Codex) subscription (Codex CLI)**: якщо існує `~/.codex/auth.json`, онбординг може повторно його використати. Повторно використані облікові дані Codex CLI і надалі керуються Codex CLI; після закінчення строку дії OpenClaw спочатку знову читає це джерело і, коли провайдер може їх оновити, записує оновлені облікові дані назад у сховище Codex замість того, щоб перебирати керування на себе.
    - **OpenAI Code (Codex) subscription (OAuth)**: потік через браузер; вставте `code#state`.
      - Установлює `agents.defaults.model` у `openai-codex/gpt-5.4`, якщо модель не задана або має вигляд `openai/*`.
    - **OpenAI API key**: використовує `OPENAI_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає його в профілях автентифікації.
      - Установлює `agents.defaults.model` у `openai/gpt-5.4`, якщо модель не задана, має вигляд `openai/*` або `openai-codex/*`.
    - **xAI (Grok) API key**: запитує `XAI_API_KEY` і налаштовує xAI як провайдера моделей.
    - **OpenCode**: запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`, отримати можна на https://opencode.ai/auth) і дає змогу вибрати каталог Zen або Go.
    - **Ollama**: запитує базову URL-адресу Ollama, пропонує режим **Cloud + Local** або **Local**, виявляє доступні моделі й автоматично завантажує вибрану локальну модель за потреби.
    - Докладніше: [Ollama](/uk/providers/ollama)
    - **API key**: зберігає ключ за вас.
    - **Vercel AI Gateway (багатомодельний проксі)**: запитує `AI_GATEWAY_API_KEY`.
    - Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: запитує Account ID, Gateway ID і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
    - **MiniMax**: конфігурація записується автоматично; типовим хостованим значенням є `MiniMax-M2.7`.
      Налаштування через API key використовує `minimax/...`, а налаштування через OAuth — 
      `minimax-portal/...`.
    - Докладніше: [MiniMax](/uk/providers/minimax)
    - **StepFun**: конфігурація автоматично записується для StepFun standard або Step Plan на китайських чи глобальних кінцевих точках.
    - Standard наразі містить `step-3.5-flash`, а Step Plan також містить `step-3.5-flash-2603`.
    - Докладніше: [StepFun](/uk/providers/stepfun)
    - **Synthetic (сумісний з Anthropic)**: запитує `SYNTHETIC_API_KEY`.
    - Докладніше: [Synthetic](/uk/providers/synthetic)
    - **Moonshot (Kimi K2)**: конфігурація записується автоматично.
    - **Kimi Coding**: конфігурація записується автоматично.
    - Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
    - **Skip**: автентифікацію поки не налаштовано.
    - Виберіть типову модель із виявлених варіантів (або введіть provider/model вручну). Для найкращої якості та нижчого ризику prompt injection вибирайте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    - Під час онбордингу виконується перевірка моделі й виводиться попередження, якщо налаштована модель невідома або відсутня автентифікація.
    - Режим зберігання API key типово використовує прості текстові значення профілю автентифікації. Використовуйте `--secret-input-mode ref`, щоб натомість зберігати посилання на змінні середовища (наприклад, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Профілі автентифікації зберігаються в `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API keys + OAuth). `~/.openclaw/credentials/oauth.json` — це застаріле джерело лише для імпорту.
    - Докладніше: [/concepts/oauth](/uk/concepts/oauth)
    <Note>
    Порада для headless/server: завершіть OAuth на машині з браузером, а потім скопіюйте
    `auth-profiles.json` цього агента (наприклад,
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний шлях
    `$OPENCLAW_STATE_DIR/...`) на хост gateway. `credentials/oauth.json`
    є лише застарілим джерелом імпорту.
    </Note>
  </Step>
  <Step title="Workspace">
    - Типово `~/.openclaw/workspace` (можна налаштувати).
    - Ініціалізує файли workspace, потрібні для bootstrap ritual агента.
    - Повна структура workspace + інструкція з резервного копіювання: [Agent workspace](/uk/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Порт, bind, режим автентифікації, доступ через tailscale.
    - Рекомендація щодо автентифікації: залишайте **Token** навіть для loopback, щоб локальні WS-клієнти мали проходити автентифікацію.
    - У режимі token інтерактивне налаштування пропонує:
      - **Generate/store plaintext token** (типово)
      - **Use SecretRef** (необов’язково)
      - Quickstart повторно використовує наявні SecretRef `gateway.auth.token` для провайдерів `env`, `file` і `exec` для probe/dashboard bootstrap під час онбордингу.
      - Якщо цей SecretRef налаштовано, але його неможливо розв’язати, онбординг завершується помилкою на ранньому етапі з чітким повідомленням про виправлення замість тихого погіршення автентифікації під час виконання.
    - У режимі password інтерактивне налаштування також підтримує зберігання у відкритому тексті або через SecretRef.
    - Шлях SecretRef для token у неінтерактивному режимі: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої змінної середовища в середовищі процесу онбордингу.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте автентифікацію, лише якщо повністю довіряєте кожному локальному процесу.
    - Для bind, відмінних від loopback, автентифікація все одно обов’язкова.
  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR.
    - [Telegram](/uk/channels/telegram): токен бота.
    - [Discord](/uk/channels/discord): токен бота.
    - [Google Chat](/uk/channels/googlechat): JSON сервісного облікового запису + webhook audience.
    - [Mattermost](/uk/channels/mattermost) (plugin): токен бота + базова URL-адреса.
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису.
    - [BlueBubbles](/uk/channels/bluebubbles): **рекомендовано для iMessage**; URL-адреса сервера + пароль + webhook.
    - [iMessage](/uk/channels/imessage): застарілий шлях CLI `imsg` + доступ до БД.
    - Безпека DM: типово використовується pairing. Під час першого DM надсилається код; схваліть його через `openclaw pairing approve <channel> <code>` або використовуйте списки дозволених.
  </Step>
  <Step title="Вебпошук">
    - Виберіть підтримуваного провайдера, наприклад Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG або Tavily (або пропустіть).
    - Провайдери з API можуть використовувати змінні середовища або наявну конфігурацію для швидкого налаштування; провайдери без ключів натомість використовують свої специфічні передумови.
    - Пропустити: `--skip-search`.
    - Налаштувати пізніше: `openclaw configure --section web`.
  </Step>
  <Step title="Встановлення демона">
    - macOS: LaunchAgent
      - Потребує активної сесії користувача; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux (і Windows через WSL2): користувацький модуль systemd
      - Під час онбордингу виконується спроба ввімкнути lingering через `loginctl enable-linger <user>`, щоб Gateway залишався запущеним після виходу з системи.
      - Може запитати sudo (записує в `/var/lib/systemd/linger`); спочатку намагається без sudo.
    - **Вибір середовища виконання:** Node (рекомендовано; обов’язково для WhatsApp/Telegram). Bun **не рекомендовано**.
    - Якщо для token auth потрібен token, а `gateway.auth.token` керується через SecretRef, встановлення демона перевіряє його, але не зберігає розв’язані значення токена у відкритому тексті в метаданих середовища сервісу supervisor.
    - Якщо для token auth потрібен token, а налаштований token SecretRef не розв’язується, встановлення демона блокується з практичними вказівками.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення демона блокується, доки режим не буде явно встановлено.
  </Step>
  <Step title="Перевірка працездатності">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - Порада: `openclaw status --deep` додає до виводу статусу live gateway health probe, включно з перевірками каналів, де це підтримується (потребує доступного gateway).
  </Step>
  <Step title="Skills (рекомендовано)">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дає змогу вибрати менеджер Node: **npm / pnpm** (bun не рекомендовано).
    - Установлює необов’язкові залежності (деякі використовують Homebrew у macOS).
  </Step>
  <Step title="Завершення">
    - Підсумок + наступні кроки, зокрема застосунки для iOS/Android/macOS для додаткових можливостей.
  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, онбординг виводить інструкції з пробросу порту SSH для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, онбординг намагається їх зібрати; резервний варіант — `pnpm ui:build` (автоматично встановлює залежності UI).
</Note>

## Неінтерактивний режим

Використовуйте `--non-interactive` для автоматизації або сценаріїв онбордингу:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Додайте `--json` для машинозчитуваного підсумку.

Gateway token SecretRef у неінтерактивному режимі:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` і `--gateway-token-ref-env` є взаємовиключними.

<Note>
`--json` **не** означає неінтерактивний режим. Для сценаріїв використовуйте `--non-interactive` (і `--workspace`).
</Note>

Приклади команд для конкретних провайдерів наведені в [CLI Automation](/start/wizard-cli-automation#provider-specific-examples).
Використовуйте цю довідкову сторінку для семантики прапорців і порядку кроків.

### Додати агента (неінтерактивно)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC майстра Gateway

Gateway надає процес онбордингу через RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Клієнти (застосунок macOS, Control UI) можуть відображати кроки без повторної реалізації логіки онбордингу.

## Налаштування Signal (signal-cli)

Під час онбордингу можна встановити `signal-cli` з GitHub releases:

- Завантажує відповідний ресурс release.
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`.
- Записує `channels.signal.cliPath` у вашу конфігурацію.

Примітки:

- Збірки JVM потребують **Java 21**.
- Native-збірки використовуються, коли вони доступні.
- У Windows використовується WSL2; встановлення signal-cli відбувається за сценарієм Linux усередині WSL.

## Що записує майстер

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (у локальному онбордингу типово встановлюється `"coding"`, якщо значення не задано; наявні явно встановлені значення зберігаються)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (деталі поведінки: [CLI Setup Reference](/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Списки дозволених каналів (Slack/Discord/Matrix/Microsoft Teams), якщо ви погоджуєтеся на це під час підказок (імена перетворюються на ID, коли це можливо).
- `skills.install.nodeManager`
  - `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - У ручній конфігурації все ще можна використовувати `yarn`, безпосередньо задавши `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp зберігаються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

Деякі канали постачаються як plugins. Коли ви вибираєте один із них під час налаштування, онбординг
запропонує встановити його (npm або локальний шлях), перш ніж його можна буде налаштувати.

## Пов’язані документи

- Огляд онбордингу: [Onboarding (CLI)](/start/wizard)
- Онбординг у застосунку macOS: [Onboarding](/start/onboarding)
- Довідник з конфігурації: [Gateway configuration](/uk/gateway/configuration)
- Провайдери: [WhatsApp](/uk/channels/whatsapp), [Telegram](/uk/channels/telegram), [Discord](/uk/channels/discord), [Google Chat](/uk/channels/googlechat), [Signal](/uk/channels/signal), [BlueBubbles](/uk/channels/bluebubbles) (iMessage), [iMessage](/uk/channels/imessage) (застарілий)
- Skills: [Skills](/tools/skills), [Skills config](/tools/skills-config)
