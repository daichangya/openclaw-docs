---
read_when:
    - Потрібна детальна поведінка для openclaw onboard
    - Ви налагоджуєте результати онбордингу або інтегруєте клієнти онбордингу
sidebarTitle: CLI reference
summary: Повний довідник щодо процесу налаштування CLI, налаштування auth/моделей, результатів і внутрішньої логіки
title: Довідник з налаштування CLI
x-i18n:
    generated_at: "2026-04-05T18:18:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92f379b34a2b48c68335dae4f759117c770f018ec51b275f4f40421c6b3abb23
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Довідник з налаштування CLI

Ця сторінка — повний довідник для `openclaw onboard`.
Короткий посібник див. у [Onboarding (CLI)](/start/wizard).

## Що робить майстер

Локальний режим (типово) проводить вас через:

- Налаштування моделі та auth (OAuth для підписки OpenAI Code, Anthropic Claude CLI або API key, а також варіанти для MiniMax, GLM, Ollama, Moonshot, StepFun і AI Gateway)
- Розташування робочого простору та bootstrap-файли
- Налаштування Gateway (порт, bind, auth, tailscale)
- Канали та провайдери (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles та інші вбудовані channel plugins)
- Встановлення демона (LaunchAgent, systemd user unit або нативне Windows Scheduled Task із запасним варіантом через Startup folder)
- Перевірка стану
- Налаштування Skills

Віддалений режим налаштовує цю машину для підключення до gateway в іншому місці.
Він не встановлює та не змінює нічого на віддаленому хості.

## Деталі локального процесу

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть Keep, Modify або Reset.
    - Повторний запуск майстра нічого не стирає, якщо ви явно не виберете Reset (або не передасте `--reset`).
    - CLI `--reset` типово використовує `config+creds+sessions`; використайте `--reset-scope full`, щоб також видалити робочий простір.
    - Якщо конфігурація недійсна або містить застарілі ключі, майстер зупиняється й просить запустити `openclaw doctor`, перш ніж продовжити.
    - Reset використовує `trash` і пропонує такі області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сесії
      - Повне скидання (також видаляє робочий простір)
  </Step>
  <Step title="Модель і auth">
    - Повна матриця варіантів наведена в [Варіанти auth і моделей](#auth-and-model-options).
  </Step>
  <Step title="Робочий простір">
    - Типово `~/.openclaw/workspace` (можна змінити).
    - Ініціалізує файли робочого простору, потрібні для bootstrap-ритуалу першого запуску.
    - Структура робочого простору: [Робочий простір агента](/uk/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Запитує порт, bind, режим auth і експонування через tailscale.
    - Рекомендовано: залишити token auth увімкненим навіть для loopback, щоб локальні WS-клієнти мусили проходити автентифікацію.
    - У режимі токена інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти plaintext token** (типово)
      - **Використати SecretRef** (за бажанням)
    - У режимі пароля інтерактивне налаштування також підтримує зберігання у plaintext або через SecretRef.
    - Неінтерактивний шлях для SecretRef токена: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої змінної середовища в середовищі процесу онбордингу.
      - Не може поєднуватися з `--gateway-token`.
    - Вимикайте auth лише якщо повністю довіряєте кожному локальному процесу.
    - Bind не на loopback однаково потребує auth.
  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий QR-логін
    - [Telegram](/uk/channels/telegram): токен бота
    - [Discord](/uk/channels/discord): токен бота
    - [Google Chat](/uk/channels/googlechat): JSON service account + webhook audience
    - [Mattermost](/uk/channels/mattermost): токен бота + базовий URL
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису
    - [BlueBubbles](/uk/channels/bluebubbles): рекомендовано для iMessage; URL сервера + пароль + webhook
    - [iMessage](/uk/channels/imessage): застарілий шлях до CLI `imsg` + доступ до БД
    - Безпека DM: типово використовується pairing. Перше DM надсилає код; схваліть через
      `openclaw pairing approve <channel> <code>` або використовуйте allowlist.
  </Step>
  <Step title="Встановлення демона">
    - macOS: LaunchAgent
      - Потребує сеансу користувача, який увійшов у систему; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux і Windows через WSL2: systemd user unit
      - Майстер намагається виконати `loginctl enable-linger <user>`, щоб gateway залишався запущеним після виходу з системи.
      - Може попросити sudo (записує в `/var/lib/systemd/linger`); спершу пробує без sudo.
    - Нативний Windows: спочатку Scheduled Task
      - Якщо створення завдання заборонено, OpenClaw переходить до per-user login item у Startup folder і негайно запускає gateway.
      - Scheduled Tasks залишаються пріоритетними, бо забезпечують кращий статус supervisor.
    - Вибір середовища виконання: Node (рекомендовано; обов’язково для WhatsApp і Telegram). Bun не рекомендується.
  </Step>
  <Step title="Перевірка стану">
    - Запускає gateway (за потреби) і виконує `openclaw health`.
    - `openclaw status --deep` додає до виводу статусу live-перевірку стану gateway, включно з перевірками каналів, коли вони підтримуються.
  </Step>
  <Step title="Skills">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дозволяє вибрати менеджер node: npm, pnpm або bun.
    - Встановлює необов’язкові залежності (деякі використовують Homebrew на macOS).
  </Step>
  <Step title="Завершення">
    - Підсумок і наступні кроки, включно з варіантами для iOS, Android і macOS app.
  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, майстер виводить інструкції з переадресації SSH-порту для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, майстер намагається їх зібрати; запасний варіант — `pnpm ui:build` (автоматично встановлює залежності UI).
</Note>

## Деталі віддаленого режиму

Віддалений режим налаштовує цю машину для підключення до gateway в іншому місці.

<Info>
Віддалений режим не встановлює та не змінює нічого на віддаленому хості.
</Info>

Що ви налаштовуєте:

- URL віддаленого gateway (`ws://...`)
- Token, якщо віддалений gateway потребує auth (рекомендовано)

<Note>
- Якщо gateway доступний лише через loopback, використовуйте SSH-тунелювання або tailnet.
- Підказки для виявлення:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Варіанти auth і моделей

<AccordionGroup>
  <Accordion title="API key Anthropic">
    Використовує `ANTHROPIC_API_KEY`, якщо він присутній, або запитує ключ, а потім зберігає його для використання демоном.
  </Accordion>
  <Accordion title="Підписка OpenAI Code (повторне використання Codex CLI)">
    Якщо `~/.codex/auth.json` існує, майстер може використати його повторно.
    Повторно використані облікові дані Codex CLI і далі керуються Codex CLI; після завершення строку дії OpenClaw
    спочатку повторно зчитує це джерело і, коли провайдер може їх оновити, записує
    оновлені облікові дані назад у сховище Codex замість того, щоб брати керування
    на себе.
  </Accordion>
  <Accordion title="Підписка OpenAI Code (OAuth)">
    Потік у браузері; вставте `code#state`.

    Установлює `agents.defaults.model` у `openai-codex/gpt-5.4`, коли модель не задана або має вигляд `openai/*`.

  </Accordion>
  <Accordion title="API key OpenAI">
    Використовує `OPENAI_API_KEY`, якщо він присутній, або запитує ключ, а потім зберігає облікові дані в профілях auth.

    Установлює `agents.defaults.model` у `openai/gpt-5.4`, коли модель не задана, має вигляд `openai/*` або `openai-codex/*`.

  </Accordion>
  <Accordion title="API key xAI (Grok)">
    Запитує `XAI_API_KEY` і налаштовує xAI як провайдера моделі.
  </Accordion>
  <Accordion title="OpenCode">
    Запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`) і дозволяє вибрати каталог Zen або Go.
    URL налаштування: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (загальний)">
    Зберігає ключ для вас.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Запитує `AI_GATEWAY_API_KEY`.
    Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Запитує ID облікового запису, ID gateway і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Конфігурація записується автоматично. Типова хостована модель — `MiniMax-M2.7`; налаштування через API key використовує
    `minimax/...`, а налаштування через OAuth — `minimax-portal/...`.
    Докладніше: [MiniMax](/uk/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Конфігурація записується автоматично для стандартного StepFun або Step Plan на китайських чи глобальних endpoints.
    Стандартний варіант наразі включає `step-3.5-flash`, а Step Plan також включає `step-3.5-flash-2603`.
    Докладніше: [StepFun](/uk/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (сумісний з Anthropic)">
    Запитує `SYNTHETIC_API_KEY`.
    Докладніше: [Synthetic](/uk/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud і локальні відкриті моделі)">
    Запитує базовий URL (типово `http://127.0.0.1:11434`), а потім пропонує режим Cloud + Local або Local.
    Виявляє доступні моделі та пропонує типові варіанти.
    Докладніше: [Ollama](/uk/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot і Kimi Coding">
    Конфігурації Moonshot (Kimi K2) і Kimi Coding записуються автоматично.
    Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot).
  </Accordion>
  <Accordion title="Користувацький провайдер">
    Працює з endpoints, сумісними з OpenAI та Anthropic.

    Інтерактивний онбординг підтримує такі самі варіанти зберігання API key, як і інші потоки API key провайдерів:
    - **Вставити API key зараз** (plaintext)
    - **Використати посилання на секрет** (env ref або налаштоване provider ref з попередньою перевіркою)

    Неінтерактивні прапорці:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (необов’язково; використовує `CUSTOM_API_KEY`, якщо прапорець не задано)
    - `--custom-provider-id` (необов’язково)
    - `--custom-compatibility <openai|anthropic>` (необов’язково; типово `openai`)

  </Accordion>
  <Accordion title="Пропустити">
    Залишає auth неналаштованим.
  </Accordion>
</AccordionGroup>

Поведінка моделі:

- Виберіть типову модель із виявлених варіантів або вручну введіть провайдера та модель.
- Коли онбординг починається з вибору auth провайдера, засіб вибору моделі автоматично надає
  перевагу цьому провайдеру. Для Volcengine і BytePlus така сама перевага
  також поширюється на їхні варіанти coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Якщо цей фільтр бажаного провайдера виявиться порожнім, засіб вибору повертається
  до повного каталогу, а не показує порожній список моделей.
- Майстер виконує перевірку моделі та попереджає, якщо налаштована модель невідома або для неї відсутній auth.

Шляхи до облікових даних і профілів:

- Профілі auth (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Імпорт застарілого OAuth: `~/.openclaw/credentials/oauth.json`

Режим зберігання облікових даних:

- Типова поведінка онбордингу зберігає API keys як plaintext-значення в профілях auth.
- `--secret-input-mode ref` вмикає режим посилань замість зберігання plaintext-ключів.
  В інтерактивному налаштуванні можна вибрати один із двох варіантів:
  - посилання на змінну середовища (наприклад, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - налаштоване provider ref (`file` або `exec`) з псевдонімом провайдера + id
- Інтерактивний режим посилань виконує швидку попередню перевірку перед збереженням.
  - Env refs: перевіряє назву змінної та непорожнє значення в поточному середовищі онбордингу.
  - Provider refs: перевіряє конфігурацію провайдера та резолює запитаний id.
  - Якщо попередня перевірка не проходить, онбординг показує помилку й дозволяє повторити спробу.
- У неінтерактивному режимі `--secret-input-mode ref` підтримує лише варіант із env.
  - Установіть змінну середовища провайдера в середовищі процесу онбордингу.
  - Вбудовані прапорці ключів (наприклад, `--openai-api-key`) вимагають, щоб цю env-змінну було встановлено; інакше онбординг завершується швидкою помилкою.
  - Для користувацьких провайдерів неінтерактивний режим `ref` зберігає `models.providers.<id>.apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - У випадку такого користувацького провайдера `--custom-api-key` вимагає, щоб `CUSTOM_API_KEY` було встановлено; інакше онбординг завершується швидкою помилкою.
- Облікові дані auth gateway підтримують вибір між plaintext і SecretRef в інтерактивному налаштуванні:
  - Режим токена: **Згенерувати/зберегти plaintext token** (типово) або **Використати SecretRef**.
  - Режим пароля: plaintext або SecretRef.
- Неінтерактивний шлях для SecretRef токена: `--gateway-token-ref-env <ENV_VAR>`.
- Наявні налаштування з plaintext і далі працюють без змін.

<Note>
Порада для headless і серверних середовищ: завершіть OAuth на машині з браузером, а потім скопіюйте
`auth-profiles.json` цього агента (наприклад,
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний
шлях `$OPENCLAW_STATE_DIR/...`) на хост gateway. `credentials/oauth.json`
є лише джерелом для імпорту застарілих даних.
</Note>

## Результати та внутрішня логіка

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальний онбординг типово встановлює `"coding"`, якщо значення не задано; наявні явні значення зберігаються)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (локальний онбординг типово встановлює `per-channel-peer`, якщо значення не задано; наявні явні значення зберігаються)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist каналів (Slack, Discord, Matrix, Microsoft Teams), якщо ви вмикаєте їх під час підказок (імена резолюються в ID, коли це можливо)
- `skills.install.nodeManager`
  - Прапорець `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - Ручна конфігурація все ще може пізніше встановити `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp зберігаються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Деякі канали постачаються як plugins. Якщо їх вибрано під час налаштування, майстер
запропонує встановити plugin (npm або локальний шлях) перед конфігурацією каналу.
</Note>

RPC майстра Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Клієнти (macOS app і Control UI) можуть відображати кроки без повторної реалізації логіки онбордингу.

Поведінка налаштування Signal:

- Завантажує відповідний release asset
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`
- Записує `channels.signal.cliPath` у конфігурацію
- Збірки JVM потребують Java 21
- За наявності використовуються нативні збірки
- Windows використовує WSL2 і дотримується Linux-процесу signal-cli всередині WSL

## Пов’язані документи

- Хаб онбордингу: [Onboarding (CLI)](/start/wizard)
- Автоматизація та скрипти: [Автоматизація CLI](/start/wizard-cli-automation)
- Довідник команд: [`openclaw onboard`](/cli/onboard)
