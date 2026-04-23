---
read_when:
    - Пошук конкретного кроку онбордингу або прапорця
    - Автоматизація онбордингу за допомогою неінтерактивного режиму
    - Налагодження поведінки онбордингу
sidebarTitle: Onboarding Reference
summary: 'Повний довідник з онбордингу CLI: кожен крок, прапорець і поле конфігурації'
title: Довідник з онбордингу
x-i18n:
    generated_at: "2026-04-23T02:35:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51405f5d9ba3d9553662fd0a03254a709d5eb4b27339c5edfe1da1111629d0dd
    source_path: reference/wizard.md
    workflow: 15
---

# Довідник з онбордингу

Це повний довідник для `openclaw onboard`.
Для огляду високого рівня див. [Онбординг (CLI)](/uk/start/wizard).

## Деталі потоку (локальний режим)

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть **Зберегти / Змінити / Скинути**.
    - Повторний запуск онбордингу **не** стирає нічого, якщо ви явно не виберете **Скинути**
      (або не передасте `--reset`).
    - CLI `--reset` типово використовує `config+creds+sessions`; використовуйте `--reset-scope full`,
      щоб також видалити робочий простір.
    - Якщо конфігурація невалідна або містить застарілі ключі, майстер зупиняється й просить
      вас запустити `openclaw doctor` перед продовженням.
    - Скидання використовує `trash` (ніколи не `rm`) і пропонує такі області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сесії
      - Повне скидання (також видаляє робочий простір)
  </Step>
  <Step title="Модель/автентифікація">
    - **Ключ API Anthropic**: використовує `ANTHROPIC_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає його для використання демоном.
    - **Ключ API Anthropic**: бажаний варіант помічника Anthropic в онбордингу/налаштуванні.
    - **Anthropic setup-token**: досі доступний в онбордингу/налаштуванні, хоча OpenClaw тепер надає перевагу повторному використанню Claude CLI, коли це можливо.
    - **Підписка OpenAI Code (Codex) (OAuth)**: потік через браузер; вставте `code#state`.
      - Встановлює `agents.defaults.model` у `openai-codex/gpt-5.4`, коли модель не задана або має вигляд `openai/*`.
    - **Підписка OpenAI Code (Codex) (спарювання пристрою)**: потік спарювання в браузері з короткоживучим кодом пристрою.
      - Встановлює `agents.defaults.model` у `openai-codex/gpt-5.4`, коли модель не задана або має вигляд `openai/*`.
    - **Ключ API OpenAI**: використовує `OPENAI_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає його в профілях автентифікації.
      - Встановлює `agents.defaults.model` у `openai/gpt-5.4`, коли модель не задана, має вигляд `openai/*` або `openai-codex/*`.
    - **Ключ API xAI (Grok)**: запитує `XAI_API_KEY` і налаштовує xAI як постачальника моделей.
    - **OpenCode**: запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`, отримайте його на https://opencode.ai/auth) і дає змогу вибрати каталог Zen або Go.
    - **Ollama**: спочатку пропонує **Хмара + локально**, **Лише хмара** або **Лише локально**. `Cloud only` запитує `OLLAMA_API_KEY` і використовує `https://ollama.com`; режими з хостом запитують базовий URL Ollama, виявляють доступні моделі та автоматично завантажують вибрану локальну модель, якщо потрібно; `Cloud + Local` також перевіряє, чи виконано вхід у хмару для цього хоста Ollama.
    - Докладніше: [Ollama](/uk/providers/ollama)
    - **Ключ API**: зберігає ключ за вас.
    - **Vercel AI Gateway (багатомодельний проксі)**: запитує `AI_GATEWAY_API_KEY`.
    - Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: запитує ID облікового запису, ID Gateway і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway)
    - **MiniMax**: конфігурація записується автоматично; розміщене типове значення — `MiniMax-M2.7`.
      Налаштування через API-ключ використовує `minimax/...`, а налаштування через OAuth —
      `minimax-portal/...`.
    - Докладніше: [MiniMax](/uk/providers/minimax)
    - **StepFun**: конфігурація автоматично записується для стандартного StepFun або Step Plan на китайських чи глобальних кінцевих точках.
    - Стандарт наразі включає `step-3.5-flash`, а Step Plan також включає `step-3.5-flash-2603`.
    - Докладніше: [StepFun](/uk/providers/stepfun)
    - **Synthetic (сумісний з Anthropic)**: запитує `SYNTHETIC_API_KEY`.
    - Докладніше: [Synthetic](/uk/providers/synthetic)
    - **Moonshot (Kimi K2)**: конфігурація записується автоматично.
    - **Kimi Coding**: конфігурація записується автоматично.
    - Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot)
    - **Пропустити**: автентифікацію ще не налаштовано.
    - Виберіть типову модель із виявлених варіантів (або введіть provider/model вручну). Для найкращої якості та нижчого ризику prompt injection виберіть найсильнішу модель останнього покоління, доступну у вашому стеку постачальників.
    - Онбординг запускає перевірку моделі й попереджає, якщо налаштована модель невідома або для неї бракує автентифікації.
    - Режим зберігання API-ключів типово використовує відкриті значення профілю автентифікації. Використовуйте `--secret-input-mode ref`, щоб зберігати натомість посилання на змінні середовища (наприклад, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Профілі автентифікації розміщуються в `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (API-ключі + OAuth). `~/.openclaw/credentials/oauth.json` є застарілим і використовується лише для імпорту.
    - Докладніше: [/concepts/oauth](/uk/concepts/oauth)
    <Note>
    Порада для headless/server середовищ: завершіть OAuth на машині з браузером, а потім скопіюйте
    `auth-profiles.json` цього агента (наприклад,
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний шлях
    `$OPENCLAW_STATE_DIR/...`) на хост Gateway. `credentials/oauth.json`
    використовується лише як застаріле джерело імпорту.
    </Note>
  </Step>
  <Step title="Робочий простір">
    - Типово `~/.openclaw/workspace` (можна налаштувати).
    - Створює файли робочого простору, потрібні для ритуалу початкового завантаження агента.
    - Повна структура робочого простору й довідник з резервного копіювання: [Робочий простір агента](/uk/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Порт, bind, режим автентифікації, доступ через Tailscale.
    - Рекомендація щодо автентифікації: залишайте **Token** навіть для loopback, щоб локальні WS-клієнти мусили проходити автентифікацію.
    - У режимі токена інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти відкритий токен** (типово)
      - **Використати SecretRef** (за бажанням)
      - Quickstart повторно використовує наявні SecretRef `gateway.auth.token` у провайдерах `env`, `file` і `exec` для probe/dashboard bootstrap під час онбордингу.
      - Якщо цей SecretRef налаштований, але не може бути розв’язаний, онбординг завершується помилкою на ранньому етапі з чітким повідомленням про виправлення замість тихого погіршення автентифікації під час виконання.
    - У режимі пароля інтерактивне налаштування також підтримує зберігання у відкритому вигляді або через SecretRef.
    - Неінтерактивний шлях для токена через SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
      - Вимагає непорожню змінну середовища в середовищі процесу онбордингу.
      - Не може поєднуватися з `--gateway-token`.
    - Вимикайте автентифікацію лише якщо ви повністю довіряєте кожному локальному процесу.
    - Binds не на loopback однаково вимагають автентифікації.
  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR.
    - [Telegram](/uk/channels/telegram): токен бота.
    - [Discord](/uk/channels/discord): токен бота.
    - [Google Chat](/uk/channels/googlechat): JSON сервісного облікового запису + аудиторія webhook.
    - [Mattermost](/uk/channels/mattermost) (plugin): токен бота + базовий URL.
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + налаштування облікового запису.
    - [BlueBubbles](/uk/channels/bluebubbles): **рекомендовано для iMessage**; URL сервера + пароль + webhook.
    - [iMessage](/uk/channels/imessage): застарілий шлях до CLI `imsg` + доступ до БД.
    - Безпека DM: типово використовується спарювання. Перший DM надсилає код; схваліть через `openclaw pairing approve <channel> <code>` або використовуйте списки дозволених.
  </Step>
  <Step title="Вебпошук">
    - Виберіть підтримуваного постачальника, як-от Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG або Tavily (або пропустіть).
    - Постачальники з API можуть використовувати змінні середовища або наявну конфігурацію для швидкого налаштування; постачальники без ключів використовують свої специфічні передумови.
    - Пропустити за допомогою `--skip-search`.
    - Налаштувати пізніше: `openclaw configure --section web`.
  </Step>
  <Step title="Встановлення демона">
    - macOS: LaunchAgent
      - Потребує сеансу користувача з виконаним входом; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux (і Windows через WSL2): systemd user unit
      - Під час онбордингу виконується спроба ввімкнути lingering через `loginctl enable-linger <user>`, щоб Gateway залишався активним після виходу з системи.
      - Може запитати sudo (записує в `/var/lib/systemd/linger`); спочатку пробує без sudo.
    - **Вибір середовища виконання:** Node (рекомендовано; потрібен для WhatsApp/Telegram). Bun **не рекомендований**.
    - Якщо автентифікація токеном потребує токен, а `gateway.auth.token` керується через SecretRef, встановлення демона перевіряє його, але не зберігає розв’язані відкриті значення токенів у метаданих середовища служби супервізора.
    - Якщо автентифікація токеном потребує токен, а налаштований токен SecretRef не розв’язується, встановлення демона блокується з практичними підказками.
    - Якщо налаштовані і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, встановлення демона блокується, доки режим не буде явно вказано.
  </Step>
  <Step title="Перевірка стану">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - Порада: `openclaw status --deep` додає живу probe перевірки Gateway до виводу стану, включно з probe перевірками каналів, якщо вони підтримуються (потрібен доступний Gateway).
  </Step>
  <Step title="Skills (рекомендовано)">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дає змогу вибрати менеджер Node: **npm / pnpm** (bun не рекомендований).
    - Встановлює необов’язкові залежності (деякі використовують Homebrew на macOS).
  </Step>
  <Step title="Завершення">
    - Підсумок + наступні кроки, зокрема застосунки iOS/Android/macOS для додаткових можливостей.
  </Step>
</Steps>

<Note>
Якщо графічний інтерфейс не виявлено, онбординг виводить інструкції з перенаправлення SSH-порту для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, онбординг намагається їх зібрати; резервний варіант — `pnpm ui:build` (автоматично встановлює UI-залежності).
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
`--json` **не** означає неінтерактивний режим. Для скриптів використовуйте `--non-interactive` (і `--workspace`).
</Note>

Приклади команд для конкретних постачальників наведено в [Автоматизація CLI](/uk/start/wizard-cli-automation#provider-specific-examples).
Використовуйте цю довідкову сторінку для семантики прапорців і порядку кроків.

### Додавання агента (неінтерактивно)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC майстра Gateway

Gateway надає потік онбордингу через RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Клієнти (застосунок macOS, Control UI) можуть відображати кроки без повторної реалізації логіки онбордингу.

## Налаштування Signal (signal-cli)

Онбординг може встановити `signal-cli` з релізів GitHub:

- Завантажує відповідний ресурс релізу.
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`.
- Записує `channels.signal.cliPath` у вашу конфігурацію.

Примітки:

- Збірки JVM потребують **Java 21**.
- За наявності використовуються нативні збірки.
- Windows використовує WSL2; встановлення signal-cli відбувається за Linux-потоком усередині WSL.

## Що записує майстер

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальний онбординг типово використовує `"coding"`, якщо значення не задано; наявні явно вказані значення зберігаються)
- `gateway.*` (режим, bind, автентифікація, Tailscale)
- `session.dmScope` (деталі поведінки: [Довідник із налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Списки дозволених каналів (Slack/Discord/Matrix/Microsoft Teams), якщо ви погоджуєтеся під час підказок (імена перетворюються на ID, коли це можливо).
- `skills.install.nodeManager`
  - `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - Ручна конфігурація все ще може використовувати `yarn`, якщо напряму встановити `skills.install.nodeManager`.
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

- Огляд онбордингу: [Онбординг (CLI)](/uk/start/wizard)
- Онбординг застосунку macOS: [Онбординг](/uk/start/onboarding)
- Довідник з конфігурації: [Конфігурація Gateway](/uk/gateway/configuration)
- Постачальники: [WhatsApp](/uk/channels/whatsapp), [Telegram](/uk/channels/telegram), [Discord](/uk/channels/discord), [Google Chat](/uk/channels/googlechat), [Signal](/uk/channels/signal), [BlueBubbles](/uk/channels/bluebubbles) (iMessage), [iMessage](/uk/channels/imessage) (застаріле)
- Skills: [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config)
