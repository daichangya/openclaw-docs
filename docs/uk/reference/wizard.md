---
read_when:
    - Пошук конкретного кроку onboarding або прапорця
    - Автоматизація onboarding у неінтерактивному режимі
    - Налагодження поведінки onboarding
sidebarTitle: Onboarding Reference
summary: 'Повний довідник з onboarding у CLI: кожен крок, прапорець і поле config'
title: Довідник onboarding
x-i18n:
    generated_at: "2026-04-23T23:06:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f191b7d8a6d47638d9d0c9acf47a286225174c580aa0db89cf0c208d47ffee5
    source_path: reference/wizard.md
    workflow: 15
---

Це повний довідник для `openclaw onboard`.
Загальний огляд див. у [Onboarding (CLI)](/uk/start/wizard).

## Подробиці потоку (локальний режим)

<Steps>
  <Step title="Виявлення наявного config">
    - Якщо існує `~/.openclaw/openclaw.json`, виберіть **Keep / Modify / Reset**.
    - Повторний запуск onboarding **не** стирає нічого, доки ви явно не виберете **Reset**
      (або не передасте `--reset`).
    - CLI `--reset` типово використовує `config+creds+sessions`; використайте `--reset-scope full`,
      щоб також видалити workspace.
    - Якщо config невалідний або містить застарілі ключі, майстер зупиняється й просить
      вас запустити `openclaw doctor`, перш ніж продовжити.
    - Reset використовує `trash` (ніколи не `rm`) і пропонує області:
      - Лише config
      - Config + credentials + sessions
      - Повний reset (також видаляє workspace)
  </Step>
  <Step title="Модель/Auth">
    - **API key Anthropic**: використовує `ANTHROPIC_API_KEY`, якщо він заданий, або запитує ключ, а потім зберігає його для використання daemon.
    - **API key Anthropic**: бажаний варіант assistant Anthropic в onboarding/configure.
    - **Anthropic setup-token**: усе ще доступний в onboarding/configure, хоча тепер OpenClaw надає перевагу повторному використанню Claude CLI, якщо воно доступне.
    - **Підписка OpenAI Code (Codex) (OAuth)**: потік через браузер; вставте `code#state`.
      - Установлює `agents.defaults.model` у `openai-codex/gpt-5.5`, якщо модель не задана або вже належить до сімейства OpenAI.
    - **Підписка OpenAI Code (Codex) (pairing пристрою)**: потік pairing через браузер із короткоживучим кодом пристрою.
      - Установлює `agents.defaults.model` у `openai-codex/gpt-5.5`, якщо модель не задана або вже належить до сімейства OpenAI.
    - **API key OpenAI**: використовує `OPENAI_API_KEY`, якщо він заданий, або запитує ключ, а потім зберігає його в auth profiles.
      - Установлює `agents.defaults.model` у `openai/gpt-5.4`, якщо модель не задана, має формат `openai/*` або `openai-codex/*`.
    - **API key xAI (Grok)**: запитує `XAI_API_KEY` і налаштовує xAI як провайдера моделей.
    - **OpenCode**: запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`, отримати можна на https://opencode.ai/auth) і дозволяє вибрати catalog Zen або Go.
    - **Ollama**: спочатку пропонує **Cloud + Local**, **Cloud only** або **Local only**. `Cloud only` запитує `OLLAMA_API_KEY` і використовує `https://ollama.com`; режими на основі хоста запитують base URL Ollama, виявляють доступні моделі й автоматично завантажують вибрану локальну модель, якщо потрібно; `Cloud + Local` також перевіряє, чи виконано вхід у cloud для цього хоста Ollama.
    - Докладніше: [Ollama](/uk/providers/ollama)
    - **API key**: зберігає ключ за вас.
    - **Vercel AI Gateway (багатомодельний proxy)**: запитує `AI_GATEWAY_API_KEY`.
    - Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: запитує Account ID, Gateway ID і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
    - **MiniMax**: config записується автоматично; типовий hosted-вибір — `MiniMax-M2.7`.
      Налаштування через API key використовує `minimax/...`, а налаштування через OAuth —
      `minimax-portal/...`.
    - Докладніше: [MiniMax](/uk/providers/minimax)
    - **StepFun**: config автоматично записується для стандартного StepFun або Step Plan на endpoint Китаю чи глобальних endpoint.
    - До стандартного набору наразі входить `step-3.5-flash`, а Step Plan також включає `step-3.5-flash-2603`.
    - Докладніше: [StepFun](/uk/providers/stepfun)
    - **Synthetic (Anthropic-compatible)**: запитує `SYNTHETIC_API_KEY`.
    - Докладніше: [Synthetic](/uk/providers/synthetic)
    - **Moonshot (Kimi K2)**: config записується автоматично.
    - **Kimi Coding**: config записується автоматично.
    - Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
    - **Skip**: auth поки не налаштовано.
    - Виберіть типову модель із виявлених варіантів (або введіть provider/model вручну). Для найкращої якості й нижчого ризику prompt injection вибирайте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    - Onboarding виконує перевірку моделі й попереджає, якщо налаштована модель невідома або для неї бракує auth.
    - Режим зберігання API key типово використовує plaintext-значення auth profile. Використайте `--secret-input-mode ref`, щоб натомість зберігати посилання на env (наприклад `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Auth profiles розташовані в `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API keys + OAuth). `~/.openclaw/credentials/oauth.json` — це застаріле джерело лише для імпорту.
    - Докладніше: [/concepts/oauth](/uk/concepts/oauth)
    <Note>
    Порада для headless/server: завершіть OAuth на машині з браузером, а потім скопіюйте
    `auth-profiles.json` цього агента (наприклад
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний
    шлях `$OPENCLAW_STATE_DIR/...`) на хост gateway. `credentials/oauth.json`
    є лише застарілим джерелом імпорту.
    </Note>
  </Step>
  <Step title="Workspace">
    - Типово `~/.openclaw/workspace` (можна налаштувати).
    - Ініціалізує файли workspace, потрібні для bootstrap-ритуалу агента.
    - Повне компонування workspace + посібник із резервного копіювання: [Workspace агента](/uk/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Port, bind, режим auth, доступність через tailscale.
    - Рекомендація щодо auth: залишайте **Token** навіть для loopback, щоб локальні клієнти WS мусили проходити автентифікацію.
    - У режимі token інтерактивне налаштування пропонує:
      - **Generate/store plaintext token** (типово)
      - **Use SecretRef** (добровільно)
      - Quickstart повторно використовує наявні `gateway.auth.token` SecretRef через провайдери `env`, `file` і `exec` для onboarding probe/bootstrap dashboard.
      - Якщо цей SecretRef налаштовано, але його не вдається розв’язати, onboarding завершується рано з чітким повідомленням про виправлення замість тихого погіршення auth runtime.
    - У режимі password інтерактивне налаштування також підтримує зберігання у plaintext або через SecretRef.
    - Неінтерактивний шлях SecretRef для token: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої env var у середовищі процесу onboarding.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте auth лише якщо повністю довіряєте кожному локальному процесу.
    - Прив’язки не до loopback усе одно потребують auth.
  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR.
    - [Telegram](/uk/channels/telegram): токен бота.
    - [Discord](/uk/channels/discord): токен бота.
    - [Google Chat](/uk/channels/googlechat): JSON service account + audience webhook.
    - [Mattermost](/uk/channels/mattermost) (Plugin): токен бота + base URL.
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + config облікового запису.
    - [BlueBubbles](/uk/channels/bluebubbles): **рекомендовано для iMessage**; URL сервера + пароль + webhook.
    - [iMessage](/uk/channels/imessage): застарілий шлях CLI `imsg` + доступ до DB.
    - Безпека DM: типово використовується pairing. Перше DM надсилає код; підтвердьте через `openclaw pairing approve <channel> <code>` або використовуйте allowlist.
  </Step>
  <Step title="Вебпошук">
    - Виберіть підтримуваного провайдера, наприклад Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG або Tavily (або пропустіть).
    - Провайдери на основі API можуть використовувати env vars або наявний config для швидкого налаштування; провайдери без key використовують свої специфічні передумови.
    - Пропустити можна через `--skip-search`.
    - Налаштувати пізніше: `openclaw configure --section web`.
  </Step>
  <Step title="Установлення daemon">
    - macOS: LaunchAgent
      - Потребує сеансу користувача з входом у систему; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux (і Windows через WSL2): systemd user unit
      - Onboarding намагається ввімкнути lingering через `loginctl enable-linger <user>`, щоб Gateway залишався активним після виходу з системи.
      - Може запитати sudo (записує у `/var/lib/systemd/linger`); спочатку намагається без sudo.
    - **Вибір runtime:** Node (рекомендовано; обов’язково для WhatsApp/Telegram). Bun **не рекомендовано**.
    - Якщо auth token потребує token, а `gateway.auth.token` керується через SecretRef, установлення daemon перевіряє його, але не зберігає розв’язані plaintext-значення token у метаданих середовища служби supervisor.
    - Якщо auth token потребує token, а налаштований token SecretRef не розв’язується, установлення daemon блокується з практичними підказками.
    - Якщо налаштовані і `gateway.auth.token`, і `gateway.auth.password`, але `gateway.auth.mode` не задано, установлення daemon блокується, доки режим не буде явно встановлено.
  </Step>
  <Step title="Перевірка стану">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - Порада: `openclaw status --deep` додає до виводу status probe live-стану gateway, включно з probes каналів там, де це підтримується (потребує доступного gateway).
  </Step>
  <Step title="Skills (рекомендовано)">
    - Читає доступні Skills і перевіряє вимоги.
    - Дозволяє вибрати менеджер Node: **npm / pnpm** (bun не рекомендовано).
    - Установлює необов’язкові залежності (деякі з них використовують Homebrew на macOS).
  </Step>
  <Step title="Завершення">
    - Підсумок + наступні кроки, включно із застосунками iOS/Android/macOS для додаткових можливостей.
  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, onboarding друкує інструкції з SSH port-forward для Control UI замість відкриття браузера.
Якщо assets для Control UI відсутні, onboarding намагається їх зібрати; запасний варіант — `pnpm ui:build` (автоматично встановлює UI-залежності).
</Note>

## Неінтерактивний режим

Використовуйте `--non-interactive`, щоб автоматизувати або скриптувати onboarding:

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

SecretRef token Gateway у неінтерактивному режимі:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` і `--gateway-token-ref-env` взаємовиключні.

<Note>
`--json` **не** означає неінтерактивний режим. Для скриптів використовуйте `--non-interactive` (і `--workspace`).
</Note>

Приклади команд для конкретних провайдерів наведено в [Автоматизації CLI](/uk/start/wizard-cli-automation#provider-specific-examples).
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

Gateway відкриває потік onboarding через RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Клієнти (застосунок macOS, Control UI) можуть рендерити кроки без повторної реалізації логіки onboarding.

## Налаштування Signal (`signal-cli`)

Onboarding може встановити `signal-cli` з GitHub releases:

- Завантажує відповідний артефакт release.
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`.
- Записує `channels.signal.cliPath` у ваш config.

Примітки:

- Збірки JVM потребують **Java 21**.
- Власні збірки використовуються, коли вони доступні.
- Windows використовує WSL2; установлення `signal-cli` виконується за Linux-потоком усередині WSL.

## Що записує майстер

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано MiniMax)
- `tools.profile` (локальний onboarding типово використовує `"coding"`, якщо значення не задано; наявні явні значення зберігаються)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (подробиці поведінки: [Довідник CLI Setup](/uk/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist каналів (Slack/Discord/Matrix/Microsoft Teams), якщо ви погоджуєтеся на це під час запитів (імена за можливості перетворюються на ID).
- `skills.install.nodeManager`
  - `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - Ручний config усе ще може використовувати `yarn`, якщо напряму задати `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp зберігаються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

Деякі канали постачаються як Plugin. Коли ви вибираєте один із них під час setup, onboarding
запропонує встановити його (через npm або з локального шляху), перш ніж його можна буде налаштувати.

## Пов’язані документи

- Огляд onboarding: [Onboarding (CLI)](/uk/start/wizard)
- Onboarding у застосунку macOS: [Onboarding](/uk/start/onboarding)
- Довідник config: [Конфігурація Gateway](/uk/gateway/configuration)
- Провайдери: [WhatsApp](/uk/channels/whatsapp), [Telegram](/uk/channels/telegram), [Discord](/uk/channels/discord), [Google Chat](/uk/channels/googlechat), [Signal](/uk/channels/signal), [BlueBubbles](/uk/channels/bluebubbles) (iMessage), [iMessage](/uk/channels/imessage) (застаріле)
- Skills: [Skills](/uk/tools/skills), [Config Skills](/uk/tools/skills-config)
