---
read_when:
    - Вам потрібен детальний опис поведінки `openclaw onboard`
    - Ви налагоджуєте результати онбордингу або інтегруєте клієнтів онбордингу
sidebarTitle: CLI reference
summary: Повний довідник потоку налаштування CLI, налаштування auth/моделі, виводів і внутрішньої реалізації
title: Довідник з налаштування CLI
x-i18n:
    generated_at: "2026-04-23T19:27:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 485f7d074b5f9cde9cb9342bd213a93a8221c3561a92184edeceb98c40267d1d
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Довідник з налаштування CLI

Ця сторінка — повний довідник для `openclaw onboard`.
Короткий посібник див. у [Онбординг (CLI)](/uk/start/wizard).

## Що робить майстер

Локальний режим (за замовчуванням) проводить вас через:

- Налаштування моделі й auth (OAuth підписки OpenAI Code, Anthropic Claude CLI або API key, а також варіанти MiniMax, GLM, Ollama, Moonshot, StepFun і AI Gateway)
- Розташування workspace і bootstrap-файли
- Налаштування Gateway (порт, bind, auth, Tailscale)
- Канали та провайдери (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles та інші вбудовані Plugin каналів)
- Встановлення daemon (LaunchAgent, user unit systemd або нативне Scheduled Task Windows із fallback через папку Startup)
- Перевірку стану
- Налаштування Skills

Віддалений режим налаштовує цю машину на підключення до Gateway в іншому місці.
Він не встановлює і не змінює нічого на віддаленому хості.

## Деталі локального потоку

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть Keep, Modify або Reset.
    - Повторний запуск майстра нічого не стирає, якщо ви явно не вибрали Reset (або не передали `--reset`).
    - CLI `--reset` за замовчуванням використовує `config+creds+sessions`; використовуйте `--reset-scope full`, щоб також видалити workspace.
    - Якщо конфігурація некоректна або містить застарілі ключі, майстер зупиняється і просить запустити `openclaw doctor` перед продовженням.
    - Reset використовує `trash` і пропонує такі області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сесії
      - Повний reset (також видаляє workspace)
  </Step>
  <Step title="Модель і auth">
    - Повна матриця варіантів наведена в [Варіанти auth і моделей](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - За замовчуванням `~/.openclaw/workspace` (можна налаштувати).
    - Створює файли workspace, потрібні для bootstrap-ритуалу першого запуску.
    - Структура workspace: [Workspace агента](/uk/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Пропонує ввести порт, bind, режим auth і доступ через Tailscale.
    - Рекомендація: залишайте auth через токен увімкненою навіть для loopback, щоб локальні WS-клієнти мусили автентифікуватися.
    - У режимі токена інтерактивне налаштування пропонує:
      - **Generate/store plaintext token** (за замовчуванням)
      - **Use SecretRef** (опційно)
    - У режимі пароля інтерактивне налаштування також підтримує зберігання у відкритому вигляді або через SecretRef.
    - Неінтерактивний шлях SecretRef для токена: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої env-змінної в середовищі процесу онбордингу.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте auth лише якщо повністю довіряєте кожному локальному процесу.
    - Bind, відмінні від loopback, однаково потребують auth.
  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR
    - [Telegram](/uk/channels/telegram): токен бота
    - [Discord](/uk/channels/discord): токен бота
    - [Google Chat](/uk/channels/googlechat): JSON service account + webhook audience
    - [Mattermost](/uk/channels/mattermost): токен бота + base URL
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація акаунта
    - [BlueBubbles](/uk/channels/bluebubbles): рекомендовано для iMessage; URL сервера + пароль + webhook
    - [iMessage](/uk/channels/imessage): застарілий шлях CLI `imsg` + доступ до DB
    - Безпека DM: за замовчуванням використовується pairing. Перше DM надсилає код; схваліть через
      `openclaw pairing approve <channel> <code>` або використовуйте allowlist.
  </Step>
  <Step title="Встановлення daemon">
    - macOS: LaunchAgent
      - Потребує сеансу користувача з входом; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux і Windows через WSL2: user unit systemd
      - Майстер намагається виконати `loginctl enable-linger <user>`, щоб gateway залишався запущеним після виходу.
      - Може запросити sudo (записує `/var/lib/systemd/linger`); спочатку пробує без sudo.
    - Нативний Windows: спочатку Scheduled Task
      - Якщо створення задачі заборонено, OpenClaw переходить до fallback через елемент входу в папці Startup для конкретного користувача і одразу запускає gateway.
      - Scheduled Task залишаються пріоритетними, оскільки дають кращий статус supervisor.
    - Вибір runtime: Node (рекомендовано; потрібен для WhatsApp і Telegram). Bun не рекомендовано.
  </Step>
  <Step title="Перевірка стану">
    - Запускає gateway (за потреби) і виконує `openclaw health`.
    - `openclaw status --deep` додає live-перевірку стану gateway до виводу status, зокрема перевірки каналів, де це підтримується.
  </Step>
  <Step title="Skills">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дає вибрати менеджер Node: npm, pnpm або bun.
    - Встановлює необов’язкові залежності (деякі використовують Homebrew на macOS).
  </Step>
  <Step title="Завершення">
    - Підсумок і наступні кроки, зокрема варіанти застосунків для iOS, Android і macOS.
  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, майстер виводить інструкції з переадресації портів SSH для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, майстер намагається їх зібрати; fallback — `pnpm ui:build` (автоматично встановлює UI-залежності).
</Note>

## Деталі віддаленого режиму

Віддалений режим налаштовує цю машину для підключення до Gateway в іншому місці.

<Info>
Віддалений режим не встановлює і не змінює нічого на віддаленому хості.
</Info>

Що ви задаєте:

- URL віддаленого Gateway (`ws://...`)
- Токен, якщо віддалений Gateway вимагає auth (рекомендовано)

<Note>
- Якщо Gateway доступний лише через loopback, використовуйте SSH-тунелювання або tailnet.
- Підказки для виявлення:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Варіанти auth і моделей

<AccordionGroup>
  <Accordion title="API key Anthropic">
    Використовує `ANTHROPIC_API_KEY`, якщо він присутній, або просить ввести ключ, а потім зберігає його для використання daemon.
  </Accordion>
  <Accordion title="Підписка OpenAI Code (OAuth)">
    Потік через браузер; вставте `code#state`.

    Встановлює `agents.defaults.model` у `openai-codex/gpt-5.5`, якщо модель не задано або це `openai/*`.

  </Accordion>
  <Accordion title="Підписка OpenAI Code (pairing пристрою)">
    Потік pairing через браузер із короткочасним кодом пристрою.

    Встановлює `agents.defaults.model` у `openai-codex/gpt-5.5`, якщо модель не задано або це `openai/*`.

  </Accordion>
  <Accordion title="API key OpenAI">
    Використовує `OPENAI_API_KEY`, якщо він присутній, або просить ввести ключ, а потім зберігає облікові дані в auth profiles.

    Встановлює `agents.defaults.model` у `openai/gpt-5.5`, якщо модель не задано, це `openai/*` або `openai-codex/*`.

  </Accordion>
  <Accordion title="API key xAI (Grok)">
    Просить `XAI_API_KEY` і налаштовує xAI як провайдера моделей.
  </Accordion>
  <Accordion title="OpenCode">
    Просить `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`) і дає вибрати каталог Zen або Go.
    URL налаштування: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (загальний)">
    Зберігає ключ для вас.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Просить `AI_GATEWAY_API_KEY`.
    Детальніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Просить id акаунта, id gateway і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Детальніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Конфігурація записується автоматично. Розміщене значення за замовчуванням — `MiniMax-M2.7`; налаштування через API key використовує
    `minimax/...`, а через OAuth — `minimax-portal/...`.
    Детальніше: [MiniMax](/uk/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Конфігурація автоматично записується для стандартного StepFun або Step Plan на китайських чи глобальних endpoint.
    Наразі стандартний варіант включає `step-3.5-flash`, а Step Plan також включає `step-3.5-flash-2603`.
    Детальніше: [StepFun](/uk/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (сумісний з Anthropic)">
    Просить `SYNTHETIC_API_KEY`.
    Детальніше: [Synthetic](/uk/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud і локальні відкриті моделі)">
    Спочатку пропонує `Cloud + Local`, `Cloud only` або `Local only`.
    `Cloud only` використовує `OLLAMA_API_KEY` з `https://ollama.com`.
    Режими, що використовують хост, просять base URL (за замовчуванням `http://127.0.0.1:11434`), виявляють доступні моделі та пропонують типові варіанти.
    `Cloud + Local` також перевіряє, чи цей хост Ollama увійшов у систему для доступу до cloud.
    Детальніше: [Ollama](/uk/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot і Kimi Coding">
    Конфігурації Moonshot (Kimi K2) і Kimi Coding записуються автоматично.
    Детальніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot).
  </Accordion>
  <Accordion title="Власний провайдер">
    Працює з endpoint, сумісними з OpenAI і Anthropic.

    Інтерактивний онбординг підтримує ті самі варіанти зберігання API key, що й інші потоки API key провайдерів:
    - **Paste API key now** (відкритий текст)
    - **Use secret reference** (env-посилання або налаштоване посилання провайдера, з preflight-перевіркою)

    Неінтерактивні прапорці:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (необов’язково; fallback до `CUSTOM_API_KEY`)
    - `--custom-provider-id` (необов’язково)
    - `--custom-compatibility <openai|anthropic>` (необов’язково; за замовчуванням `openai`)

  </Accordion>
  <Accordion title="Пропустити">
    Залишає auth неналаштованою.
  </Accordion>
</AccordionGroup>

Поведінка моделей:

- Виберіть модель за замовчуванням із виявлених варіантів або введіть провайдера й модель вручну.
- Коли онбординг починається з вибору auth провайдера, пікер моделі автоматично надає
  перевагу цьому провайдеру. Для Volcengine і BytePlus така сама перевага
  також поширюється на їхні варіанти coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Якщо такий фільтр бажаного провайдера був би порожнім, пікер повертається до
  повного каталогу замість показу відсутності моделей.
- Майстер запускає перевірку моделі й попереджає, якщо налаштована модель невідома або відсутня auth.

Шляхи до облікових даних і профілів:

- Auth profiles (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Імпорт застарілого OAuth: `~/.openclaw/credentials/oauth.json`

Режим зберігання облікових даних:

- Поведінка онбордингу за замовчуванням зберігає API key як відкриті значення в auth profiles.
- `--secret-input-mode ref` вмикає режим посилань замість зберігання ключів у відкритому вигляді.
  В інтерактивному налаштуванні можна вибрати одне з двох:
  - посилання на змінну середовища (наприклад `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - налаштоване посилання провайдера (`file` або `exec`) з псевдонімом провайдера + id
- Інтерактивний режим посилань виконує швидку preflight-перевірку перед збереженням.
  - Env-посилання: перевіряє назву змінної і непорожнє значення в поточному середовищі онбордингу.
  - Посилання провайдера: перевіряє конфігурацію провайдера і резолвить запитаний id.
  - Якщо preflight завершується помилкою, онбординг показує її і дає повторити спробу.
- У неінтерактивному режимі `--secret-input-mode ref` підтримує лише env.
  - Задайте env-змінну провайдера в середовищі процесу онбордингу.
  - Вбудовані прапорці ключів (наприклад `--openai-api-key`) вимагають, щоб ця env-змінна була задана; інакше онбординг одразу завершується помилкою.
  - Для власних провайдерів у неінтерактивному режимі `ref` `models.providers.<id>.apiKey` зберігається як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - У цьому випадку для власного провайдера `--custom-api-key` вимагає, щоб було задано `CUSTOM_API_KEY`; інакше онбординг одразу завершується помилкою.
- Облікові дані auth Gateway підтримують вибір між відкритим текстом і SecretRef в інтерактивному налаштуванні:
  - Режим токена: **Generate/store plaintext token** (за замовчуванням) або **Use SecretRef**.
  - Режим пароля: відкритий текст або SecretRef.
- Неінтерактивний шлях SecretRef для токена: `--gateway-token-ref-env <ENV_VAR>`.
- Наявні налаштування з відкритим текстом продовжують працювати без змін.

<Note>
Порада для headless і серверів: завершіть OAuth на машині з браузером, а потім скопіюйте
`auth-profiles.json` цього агента (наприклад
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний шлях
`$OPENCLAW_STATE_DIR/...`) на хост Gateway. `credentials/oauth.json`
використовується лише як застаріле джерело імпорту.
</Note>

## Виводи й внутрішня реалізація

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальний онбординг за замовчуванням встановлює `"coding"`, якщо значення не задано; наявні явні значення зберігаються)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (локальний онбординг за замовчуванням встановлює `per-channel-peer`, якщо значення не задано; наявні явні значення зберігаються)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist каналів (Slack, Discord, Matrix, Microsoft Teams), якщо ви погоджуєтеся під час prompt (імена по можливості резолвляться в id)
- `skills.install.nodeManager`
  - Прапорець `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - У ручній конфігурації пізніше все ще можна задати `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp розміщуються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Деякі канали постачаються як Plugin. Якщо їх вибрати під час налаштування, майстер
запропонує встановити Plugin (npm або локальний шлях) перед конфігурацією каналу.
</Note>

RPC майстра Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Клієнти (застосунок macOS і Control UI) можуть відображати кроки, не перевпроваджуючи логіку онбордингу.

Поведінка налаштування Signal:

- Завантажує відповідний release-артефакт
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`
- Записує `channels.signal.cliPath` у конфігурацію
- Для JVM-збірок потрібна Java 21
- Якщо доступні нативні збірки, використовуються саме вони
- Windows використовує WSL2 і дотримується Linux-потоку signal-cli всередині WSL

## Пов’язана документація

- Центр онбордингу: [Онбординг (CLI)](/uk/start/wizard)
- Автоматизація та сценарії: [Автоматизація CLI](/uk/start/wizard-cli-automation)
- Довідник команд: [`openclaw onboard`](/uk/cli/onboard)
