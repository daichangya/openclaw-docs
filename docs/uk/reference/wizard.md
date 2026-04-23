---
read_when:
    - Пошук конкретного кроку або прапорця онбордингу
    - Автоматизація онбордингу в неінтерактивному режимі
    - Налагодження поведінки онбордингу
sidebarTitle: Onboarding Reference
summary: 'Повний довідник з онбордингу CLI: кожен крок, прапорець і поле конфігурації'
title: Довідник з онбордингу
x-i18n:
    generated_at: "2026-04-23T19:27:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 136fd90adfaaa9f0481168642e5efadb4f9ee67def0ac1bb40433d178f791474
    source_path: reference/wizard.md
    workflow: 15
---

# Довідник з онбордингу

Це повний довідник для `openclaw onboard`.
Огляд на високому рівні див. у [Onboarding (CLI)](/uk/start/wizard).

## Подробиці потоку (локальний режим)

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть **Залишити / Змінити / Скинути**.
    - Повторний запуск онбордингу **не** стирає нічого, якщо ви явно не виберете **Скинути**
      (або не передасте `--reset`).
    - CLI `--reset` типово використовує `config+creds+sessions`; використовуйте `--reset-scope full`,
      щоб також видалити workspace.
    - Якщо конфігурація невалідна або містить застарілі ключі, майстер зупиняється і просить
      вас перед продовженням виконати `openclaw doctor`.
    - Скидання використовує `trash` (ніколи не `rm`) і пропонує такі області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сесії
      - Повне скидання (також видаляє workspace)
  </Step>
  <Step title="Модель/Auth">
    - **Ключ API Anthropic**: використовує `ANTHROPIC_API_KEY`, якщо він є, або запитує ключ, а потім зберігає його для використання демоном.
    - **Ключ API Anthropic**: пріоритетний варіант Anthropic assistant в onboarding/configure.
    - **Anthropic setup-token**: усе ще доступний в onboarding/configure, хоча тепер OpenClaw надає перевагу повторному використанню Claude CLI, коли це можливо.
    - **Підписка OpenAI Code (Codex) (OAuth)**: потік через браузер; вставте `code#state`.
      - Встановлює `agents.defaults.model` у `openai-codex/gpt-5.5`, коли модель не задано або це `openai/*`.
    - **Підписка OpenAI Code (Codex) (device pairing)**: потік парування через браузер із короткоживучим кодом пристрою.
      - Встановлює `agents.defaults.model` у `openai-codex/gpt-5.5`, коли модель не задано або це `openai/*`.
    - **Ключ API OpenAI**: використовує `OPENAI_API_KEY`, якщо він є, або запитує ключ, а потім зберігає його в профілях auth.
      - Встановлює `agents.defaults.model` у `openai/gpt-5.5`, коли модель не задано, або це `openai/*`, або `openai-codex/*`.
    - **Ключ API xAI (Grok)**: запитує `XAI_API_KEY` і налаштовує xAI як провайдера моделі.
    - **OpenCode**: запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`, отримайте його на https://opencode.ai/auth) і дає змогу вибрати каталог Zen або Go.
    - **Ollama**: спочатку пропонує **Cloud + Local**, **Тільки Cloud** або **Тільки Local**. `Тільки Cloud` запитує `OLLAMA_API_KEY` і використовує `https://ollama.com`; режими з локальним хостом запитують базову URL-адресу Ollama, виявляють доступні моделі та автоматично завантажують вибрану локальну модель, коли це потрібно; `Cloud + Local` також перевіряє, чи виконано вхід на цьому хості Ollama для доступу до cloud.
    - Докладніше: [Ollama](/uk/providers/ollama)
    - **Ключ API**: зберігає ключ за вас.
    - **Vercel AI Gateway (багатомодельний проксі)**: запитує `AI_GATEWAY_API_KEY`.
    - Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: запитує Account ID, Gateway ID і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
    - **MiniMax**: конфігурація записується автоматично; типовий hosted-варіант — `MiniMax-M2.7`.
      Налаштування через API-ключ використовує `minimax/...`, а налаштування через OAuth використовує
      `minimax-portal/...`.
    - Докладніше: [MiniMax](/uk/providers/minimax)
    - **StepFun**: конфігурація записується автоматично для StepFun standard або Step Plan на китайських або глобальних endpoint-ах.
    - До standard наразі входить `step-3.5-flash`, а до Step Plan також входить `step-3.5-flash-2603`.
    - Докладніше: [StepFun](/uk/providers/stepfun)
    - **Synthetic (сумісний з Anthropic)**: запитує `SYNTHETIC_API_KEY`.
    - Докладніше: [Synthetic](/uk/providers/synthetic)
    - **Moonshot (Kimi K2)**: конфігурація записується автоматично.
    - **Kimi Coding**: конфігурація записується автоматично.
    - Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
    - **Пропустити**: auth поки не налаштовано.
    - Виберіть типову модель із виявлених варіантів (або введіть provider/model вручну). Для найкращої якості та нижчого ризику prompt injection обирайте найсильнішу доступну модель останнього покоління у вашому стеку provider-ів.
    - Під час онбордингу виконується перевірка моделі та виводиться попередження, якщо налаштована модель невідома або для неї бракує auth.
    - Режим зберігання API-ключів типово використовує текстові значення в auth-profile. Використовуйте `--secret-input-mode ref`, щоб натомість зберігати посилання на env (наприклад, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Профілі auth зберігаються в `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-ключі + OAuth). `~/.openclaw/credentials/oauth.json` — це застаріле джерело лише для імпорту.
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
    - Створює файли workspace, потрібні для bootstrap ritual агента.
    - Повне компонування workspace + посібник із резервного копіювання: [Agent workspace](/uk/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Порт, bind, режим auth, експонування через tailscale.
    - Рекомендація щодо auth: залишайте **Token** навіть для loopback, щоб локальні WS-клієнти мусили автентифікуватися.
    - У режимі token інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти plaintext token** (типово)
      - **Використовувати SecretRef** (опціонально)
      - Quickstart повторно використовує наявні SecretRef `gateway.auth.token` через провайдери `env`, `file` і `exec` для probe/dashboard bootstrap під час онбордингу.
      - Якщо цей SecretRef налаштовано, але його неможливо розв’язати, онбординг завершується помилкою на ранньому етапі з чітким повідомленням про виправлення замість мовчазної деградації auth runtime.
    - У режимі password інтерактивне налаштування також підтримує зберігання в plaintext або через SecretRef.
    - Шлях SecretRef для token у неінтерактивному режимі: `--gateway-token-ref-env <ENV_VAR>`.
      - Вимагає непорожню змінну середовища в середовищі процесу онбордингу.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте auth лише якщо повністю довіряєте кожному локальному процесу.
    - Прив’язки не до loopback усе одно потребують auth.
  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR.
    - [Telegram](/uk/channels/telegram): токен бота.
    - [Discord](/uk/channels/discord): токен бота.
    - [Google Chat](/uk/channels/googlechat): JSON service account + аудиторія webhook.
    - [Mattermost](/uk/channels/mattermost) (Plugin): токен бота + базова URL-адреса.
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису.
    - [BlueBubbles](/uk/channels/bluebubbles): **рекомендовано для iMessage**; URL-адреса сервера + пароль + webhook.
    - [iMessage](/uk/channels/imessage): застарілий шлях CLI `imsg` + доступ до БД.
    - Безпека DM: типово використовується pairing. Перше DM надсилає код; схваліть через `openclaw pairing approve <channel> <code>` або використовуйте allowlist-и.
  </Step>
  <Step title="Вебпошук">
    - Виберіть підтримуваного provider-а, наприклад Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG або Tavily (або пропустіть).
    - Provider-и з API можуть використовувати env vars або наявну config для швидкого налаштування; provider-и без ключів використовують свої специфічні передумови.
    - Пропустити можна через `--skip-search`.
    - Налаштувати пізніше: `openclaw configure --section web`.
  </Step>
  <Step title="Установлення демона">
    - macOS: LaunchAgent
      - Потребує активної сесії користувача; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux (і Windows через WSL2): unit systemd користувача
      - Онбординг намагається ввімкнути lingering через `loginctl enable-linger <user>`, щоб Gateway лишався запущеним після виходу користувача із системи.
      - Може запитати sudo (записує в `/var/lib/systemd/linger`); спочатку пробує без sudo.
    - **Вибір runtime:** Node (рекомендовано; обов’язково для WhatsApp/Telegram). Bun **не рекомендується**.
    - Якщо auth через token вимагає token і `gateway.auth.token` керується через SecretRef, установлення демона перевіряє його, але не зберігає розв’язані plaintext-значення token у метаданих середовища сервісу супервізора.
    - Якщо auth через token вимагає token, а налаштований token SecretRef не розв’язується, установлення демона блокується з практичними вказівками.
    - Якщо одночасно налаштовано `gateway.auth.token` і `gateway.auth.password`, а `gateway.auth.mode` не задано, установлення демона блокується, доки режим не буде явно вказано.
  </Step>
  <Step title="Перевірка стану">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - Порада: `openclaw status --deep` додає live-probe стану gateway до виводу status, включно з probe-ами каналів, де це підтримується (потребує доступного gateway).
  </Step>
  <Step title="Skills (рекомендовано)">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дає змогу вибрати менеджер Node: **npm / pnpm** (bun не рекомендується).
    - Установлює необов’язкові залежності (деякі використовують Homebrew на macOS).
  </Step>
  <Step title="Завершення">
    - Підсумок + наступні кроки, включно з iOS/Android/macOS застосунками для додаткових можливостей.
  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, онбординг виводить інструкції з SSH port-forward для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, онбординг намагається зібрати їх; запасний варіант — `pnpm ui:build` (автоматично встановлює залежності UI).
</Note>

## Неінтерактивний режим

Використовуйте `--non-interactive`, щоб автоматизувати або скриптувати онбординг:

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

Додайте `--json` для підсумку в машиночитному форматі.

SecretRef токена Gateway у неінтерактивному режимі:

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

Приклади команд для конкретних provider-ів наведено в [CLI Automation](/uk/start/wizard-cli-automation#provider-specific-examples).
Використовуйте цю довідкову сторінку для семантики прапорців і порядку кроків.

### Додати агента (неінтерактивно)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC майстра Gateway

Gateway надає потік онбордингу через RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Клієнти (застосунок macOS, Control UI) можуть відображати кроки без повторної реалізації логіки онбордингу.

## Налаштування Signal (`signal-cli`)

Онбординг може встановити `signal-cli` з GitHub releases:

- Завантажує відповідний asset release.
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`.
- Записує `channels.signal.cliPath` у вашу config.

Примітки:

- Збірки JVM потребують **Java 21**.
- Native-збірки використовуються, коли вони доступні.
- Windows використовує WSL2; встановлення `signal-cli` відбувається за Linux-потоком усередині WSL.

## Що записує майстер

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано MiniMax)
- `tools.profile` (локальний онбординг типово встановлює `"coding"`, якщо значення не задано; наявні явні значення зберігаються)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (подробиці поведінки: [CLI Setup Reference](/uk/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist-и каналів (Slack/Discord/Matrix/Microsoft Teams), коли ви погоджуєтеся на це під час запитів (імена, де можливо, перетворюються на ID).
- `skills.install.nodeManager`
  - `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - Ручна config усе ще може використовувати `yarn`, якщо напряму встановити `skills.install.nodeManager`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp зберігаються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

Деякі канали постачаються як Plugin-и. Коли ви вибираєте один із них під час налаштування, онбординг
запропонує встановити його (через npm або з локального шляху), перш ніж його можна буде налаштувати.

## Пов’язані документи

- Огляд онбордингу: [Onboarding (CLI)](/uk/start/wizard)
- Онбординг у застосунку macOS: [Onboarding](/uk/start/onboarding)
- Довідник з config: [Gateway configuration](/uk/gateway/configuration)
- Провайдери: [WhatsApp](/uk/channels/whatsapp), [Telegram](/uk/channels/telegram), [Discord](/uk/channels/discord), [Google Chat](/uk/channels/googlechat), [Signal](/uk/channels/signal), [BlueBubbles](/uk/channels/bluebubbles) (iMessage), [iMessage](/uk/channels/imessage) (legacy)
- Skills: [Skills](/uk/tools/skills), [Skills config](/uk/tools/skills-config)
