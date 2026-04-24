---
read_when:
    - Вам потрібен детальний опис поведінки `openclaw onboard`
    - Ви налагоджуєте результати onboarding або інтегруєте клієнти onboarding
sidebarTitle: CLI reference
summary: Повний довідник щодо процесу налаштування CLI, налаштування автентифікації/моделей, виводів і внутрішньої реалізації
title: Довідник з налаштування CLI
x-i18n:
    generated_at: "2026-04-24T19:53:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 951b8f0b0b6b70faaa6faafad998e74183f79aa8c4c50f622b24df786f1feea7
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Ця сторінка — повний довідник для `openclaw onboard`.
Короткий посібник див. у [Onboarding (CLI)](/uk/start/wizard).

## Що робить майстер

Локальний режим (за замовчуванням) покроково проводить вас через:

- Налаштування моделі та автентифікації (OAuth підписки OpenAI Code, Anthropic Claude CLI або API-ключ, а також варіанти для MiniMax, GLM, Ollama, Moonshot, StepFun і AI Gateway)
- Розташування робочого простору та bootstrap-файли
- Налаштування Gateway (порт, bind, auth, tailscale)
- Канали та провайдери (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles та інші вбудовані Plugins каналів)
- Встановлення демона (LaunchAgent, systemd user unit або нативне Windows Scheduled Task із резервним варіантом через папку Startup)
- Перевірка стану
- Налаштування Skills

Віддалений режим налаштовує цю машину для підключення до Gateway, який працює в іншому місці.
Він не встановлює і не змінює нічого на віддаленому хості.

## Докладно про локальний процес

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо існує `~/.openclaw/openclaw.json`, виберіть Keep, Modify або Reset.
    - Повторний запуск майстра нічого не стирає, якщо ви явно не виберете Reset (або не передасте `--reset`).
    - CLI `--reset` за замовчуванням використовує `config+creds+sessions`; використовуйте `--reset-scope full`, щоб також видалити робочий простір.
    - Якщо конфігурація недійсна або містить застарілі ключі, майстер зупиняється і просить вас запустити `openclaw doctor`, перш ніж продовжити.
    - Reset використовує `trash` і пропонує такі варіанти:
      - Лише конфігурація
      - Конфігурація + облікові дані + сеанси
      - Повне скидання (також видаляє робочий простір)
  </Step>
  <Step title="Модель і автентифікація">
    - Повна матриця варіантів наведена в [Варіанти автентифікації та моделей](#auth-and-model-options).
  </Step>
  <Step title="Робочий простір">
    - За замовчуванням `~/.openclaw/workspace` (можна налаштувати).
    - Додає файли робочого простору, потрібні для bootstrap-ритуалу першого запуску.
    - Структура робочого простору: [Робочий простір агента](/uk/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Запитує порт, bind, режим auth і експонування через tailscale.
    - Рекомендовано: залишати auth за токеном увімкненим навіть для loopback, щоб локальні WS-клієнти мали автентифікуватися.
    - У режимі токена інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти plaintext-токен** (за замовчуванням)
      - **Використовувати SecretRef** (добровільно)
    - У режимі пароля інтерактивне налаштування також підтримує збереження як plaintext, так і через SecretRef.
    - Шлях SecretRef для токена в неінтерактивному режимі: `--gateway-token-ref-env <ENV_VAR>`.
      - Потрібна непорожня змінна середовища в середовищі процесу onboarding.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте auth лише якщо ви повністю довіряєте кожному локальному процесу.
    - Для bind не лише на loopback auth усе одно обов’язковий.
  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR
    - [Telegram](/uk/channels/telegram): токен бота
    - [Discord](/uk/channels/discord): токен бота
    - [Google Chat](/uk/channels/googlechat): JSON service account + webhook audience
    - [Mattermost](/uk/channels/mattermost): токен бота + базовий URL
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису
    - [BlueBubbles](/uk/channels/bluebubbles): рекомендовано для iMessage; URL сервера + пароль + Webhook
    - [iMessage](/uk/channels/imessage): застарілий шлях до CLI `imsg` + доступ до DB
    - Безпека DM: за замовчуванням використовується pairing. Перше DM надсилає код; підтвердьте через
      `openclaw pairing approve <channel> <code>` або використовуйте allowlist.
  </Step>
  <Step title="Встановлення демона">
    - macOS: LaunchAgent
      - Потрібен сеанс користувача з входом у систему; для безголового режиму використовуйте власний LaunchDaemon (не постачається).
    - Linux і Windows через WSL2: systemd user unit
      - Майстер намагається виконати `loginctl enable-linger <user>`, щоб Gateway залишався запущеним після виходу з системи.
      - Може попросити sudo (записує в `/var/lib/systemd/linger`); спочатку пробує без sudo.
    - Нативний Windows: спочатку Scheduled Task
      - Якщо створення задачі заборонено, OpenClaw переходить до резервного варіанта — login item у папці Startup для поточного користувача — і негайно запускає Gateway.
      - Scheduled Tasks залишаються бажаним варіантом, оскільки дають кращий статус супервізора.
    - Вибір runtime: Node (рекомендовано; обов’язково для WhatsApp і Telegram). Bun не рекомендовано.
  </Step>
  <Step title="Перевірка стану">
    - Запускає Gateway (якщо потрібно) і виконує `openclaw health`.
    - `openclaw status --deep` додає live-перевірку стану Gateway до виводу статусу, включно з перевірками каналів, якщо вони підтримуються.
  </Step>
  <Step title="Skills">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дозволяє вибрати менеджер Node: npm, pnpm або bun.
    - Встановлює необов’язкові залежності (деякі використовують Homebrew на macOS).
  </Step>
  <Step title="Завершення">
    - Підсумок і подальші кроки, включно з варіантами застосунків для iOS, Android і macOS.
  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, майстер виводить інструкції з SSH port-forward для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, майстер намагається їх зібрати; резервний варіант — `pnpm ui:build` (автоматично встановлює UI-залежності).
</Note>

## Докладно про віддалений режим

Віддалений режим налаштовує цю машину для підключення до Gateway, який працює в іншому місці.

<Info>
Віддалений режим не встановлює і не змінює нічого на віддаленому хості.
</Info>

Що ви налаштовуєте:

- URL віддаленого Gateway (`ws://...`)
- Токен, якщо для віддаленого Gateway потрібна auth (рекомендовано)

<Note>
- Якщо Gateway доступний лише через loopback, використовуйте SSH-тунелювання або tailnet.
- Підказки для виявлення:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Варіанти автентифікації та моделей

<AccordionGroup>
  <Accordion title="API-ключ Anthropic">
    Використовує `ANTHROPIC_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає його для використання демоном.
  </Accordion>
  <Accordion title="Підписка OpenAI Code (OAuth)">
    Потік через браузер; вставте `code#state`.

    Установлює `agents.defaults.model` на `openai-codex/gpt-5.5`, якщо модель не задана або вже належить до сімейства OpenAI.

  </Accordion>
  <Accordion title="Підписка OpenAI Code (pairing пристрою)">
    Потік pairing через браузер із короткоживучим кодом пристрою.

    Установлює `agents.defaults.model` на `openai-codex/gpt-5.5`, якщо модель не задана або вже належить до сімейства OpenAI.

  </Accordion>
  <Accordion title="API-ключ OpenAI">
    Використовує `OPENAI_API_KEY`, якщо він наявний, або запитує ключ, а потім зберігає облікові дані в auth-профілях.

    Установлює `agents.defaults.model` на `openai/gpt-5.4`, якщо модель не задана, має вигляд `openai/*` або `openai-codex/*`.

  </Accordion>
  <Accordion title="API-ключ xAI (Grok)">
    Запитує `XAI_API_KEY` і налаштовує xAI як провайдера моделей.
  </Accordion>
  <Accordion title="OpenCode">
    Запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`) і дозволяє вибрати каталог Zen або Go.
    URL налаштування: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API-ключ (загальний)">
    Зберігає ключ за вас.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Запитує `AI_GATEWAY_API_KEY`.
    Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Запитує account ID, gateway ID і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Конфігурація записується автоматично. Типове hosted-значення — `MiniMax-M2.7`; для налаштування через API-ключ використовується
    `minimax/...`, а для налаштування через OAuth — `minimax-portal/...`.
    Докладніше: [MiniMax](/uk/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Конфігурація записується автоматично для стандартного StepFun або Step Plan на китайських чи глобальних endpoint.
    Стандартний варіант наразі включає `step-3.5-flash`, а Step Plan також включає `step-3.5-flash-2603`.
    Докладніше: [StepFun](/uk/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (сумісний з Anthropic)">
    Запитує `SYNTHETIC_API_KEY`.
    Докладніше: [Synthetic](/uk/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud і локальні відкриті моделі)">
    Спочатку пропонує `Cloud + Local`, `Cloud only` або `Local only`.
    `Cloud only` використовує `OLLAMA_API_KEY` з `https://ollama.com`.
    У режимах із хостом запитується базовий URL (за замовчуванням `http://127.0.0.1:11434`), виявляються доступні моделі та пропонуються типові значення.
    `Cloud + Local` також перевіряє, чи цей хост Ollama увійшов у систему для доступу до cloud.
    Докладніше: [Ollama](/uk/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot і Kimi Coding">
    Конфігурації Moonshot (Kimi K2) і Kimi Coding записуються автоматично.
    Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot).
  </Accordion>
  <Accordion title="Кастомний провайдер">
    Працює з endpoint, сумісними з OpenAI і Anthropic.

    Інтерактивний onboarding підтримує ті самі варіанти збереження API-ключа, що й інші потоки API-ключів провайдерів:
    - **Вставити API-ключ зараз** (plaintext)
    - **Використовувати посилання на секрет** (env ref або налаштоване посилання провайдера з попередньою перевіркою)

    Прапорці неінтерактивного режиму:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (необов’язково; інакше використовується `CUSTOM_API_KEY`)
    - `--custom-provider-id` (необов’язково)
    - `--custom-compatibility <openai|anthropic>` (необов’язково; за замовчуванням `openai`)

  </Accordion>
  <Accordion title="Пропустити">
    Залишає auth неналаштованою.
  </Accordion>
</AccordionGroup>

Поведінка моделей:

- Виберіть модель за замовчуванням із виявлених варіантів або введіть провайдера і модель вручну.
- Коли onboarding починається з вибору автентифікації провайдера, засіб вибору моделі автоматично віддає
  перевагу цьому провайдеру. Для Volcengine і BytePlus така сама перевага
  також охоплює їхні варіанти coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Якщо такий фільтр бажаного провайдера дає порожній результат, засіб вибору повертається до
  повного каталогу замість того, щоб показувати відсутність моделей.
- Майстер виконує перевірку моделі та попереджає, якщо налаштована модель невідома або для неї немає auth.

Шляхи до облікових даних і профілів:

- Auth-профілі (API-ключі + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Застарілий імпорт OAuth: `~/.openclaw/credentials/oauth.json`

Режим зберігання облікових даних:

- Типова поведінка onboarding зберігає API-ключі як plaintext-значення в auth-профілях.
- `--secret-input-mode ref` вмикає режим посилань замість зберігання ключів як plaintext.
  В інтерактивному налаштуванні можна вибрати один із двох варіантів:
  - посилання на змінну середовища (наприклад, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - посилання на налаштованого провайдера (`file` або `exec`) з alias провайдера + id
- Інтерактивний режим посилань виконує швидку попередню перевірку перед збереженням.
  - Env ref: перевіряє ім’я змінної та непорожнє значення в поточному середовищі onboarding.
  - Посилання провайдера: перевіряє конфігурацію провайдера та визначає запитаний id.
  - Якщо попередня перевірка не проходить, onboarding показує помилку й дозволяє повторити спробу.
- У неінтерактивному режимі `--secret-input-mode ref` підтримує лише env.
  - Установіть змінну середовища провайдера в середовищі процесу onboarding.
  - Inline-прапорці ключів (наприклад, `--openai-api-key`) вимагають, щоб ця змінна середовища була встановлена; інакше onboarding одразу завершується з помилкою.
  - Для кастомних провайдерів неінтерактивний режим `ref` зберігає `models.providers.<id>.apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - У цьому випадку для кастомного провайдера `--custom-api-key` вимагає, щоб `CUSTOM_API_KEY` було встановлено; інакше onboarding одразу завершується з помилкою.
- Облікові дані auth Gateway в інтерактивному налаштуванні підтримують як plaintext, так і SecretRef:
  - Режим токена: **Згенерувати/зберегти plaintext-токен** (за замовчуванням) або **Використовувати SecretRef**.
  - Режим пароля: plaintext або SecretRef.
- Шлях SecretRef для токена в неінтерактивному режимі: `--gateway-token-ref-env <ENV_VAR>`.
- Наявні plaintext-налаштування і далі працюють без змін.

<Note>
Порада для headless- і серверного режиму: виконайте OAuth на машині з браузером, а потім скопіюйте
`auth-profiles.json` цього агента (наприклад,
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний
шлях `$OPENCLAW_STATE_DIR/...`) на хост Gateway. `credentials/oauth.json`
є лише застарілим джерелом імпорту.
</Note>

## Виводи та внутрішня реалізація

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, якщо передано `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальний onboarding за замовчуванням встановлює `"coding"`, якщо значення не задано; наявні явно встановлені значення зберігаються)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (локальний onboarding за замовчуванням встановлює `per-channel-peer`, якщо значення не задано; наявні явно встановлені значення зберігаються)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist каналів (Slack, Discord, Matrix, Microsoft Teams), якщо ви добровільно вмикаєте їх під час запитів (імена за можливості перетворюються на ID)
- `skills.install.nodeManager`
  - Прапорець `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - У ручній конфігурації пізніше все ще можна встановити `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp зберігаються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сеанси зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Деякі канали постачаються як Plugins. Якщо їх вибрано під час налаштування, майстер
пропонує встановити Plugin (npm або локальний шлях) перед налаштуванням каналу.
</Note>

RPC майстра Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Клієнти (застосунок macOS і Control UI) можуть відображати кроки, не перевпроваджуючи логіку onboarding.

Поведінка налаштування Signal:

- Завантажує відповідний release asset
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`
- Записує `channels.signal.cliPath` у конфігурацію
- Для збірок JVM потрібна Java 21
- Коли доступні нативні збірки, використовуються вони
- Windows використовує WSL2 і дотримується Linux-процесу signal-cli всередині WSL

## Пов’язані документи

- Центр onboarding: [Onboarding (CLI)](/uk/start/wizard)
- Автоматизація і скрипти: [Автоматизація CLI](/uk/start/wizard-cli-automation)
- Довідник команд: [`openclaw onboard`](/uk/cli/onboard)
