---
read_when:
    - Вам потрібна детальна поведінка для `openclaw onboard`
    - Ви налагоджуєте результати онбордингу або інтегруєте клієнти онбордингу
sidebarTitle: CLI reference
summary: Повний довідник щодо потоку налаштування CLI, налаштування автентифікації/моделі, виводів і внутрішніх механізмів
title: Довідник із налаштування CLI
x-i18n:
    generated_at: "2026-04-23T02:35:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60b47a3cd7eaa6e10b5e7108ba4eb331afddffa55a321eac98243611fd7e721b
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Довідник із налаштування CLI

Ця сторінка — повний довідник для `openclaw onboard`.
Короткий посібник дивіться в [Onboarding (CLI)](/uk/start/wizard).

## Що робить майстер

Локальний режим (типовий) проводить вас через:

- Налаштування моделі та автентифікації (OAuth підписки OpenAI Code, Anthropic Claude CLI або API-ключ, а також варіанти MiniMax, GLM, Ollama, Moonshot, StepFun і AI Gateway)
- Розташування робочого простору та початкові файли
- Налаштування Gateway (порт, bind, автентифікація, tailscale)
- Канали та провайдери (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles та інші вбудовані plugin каналів)
- Встановлення демона (LaunchAgent, користувацький systemd unit або нативне Windows Scheduled Task із резервним варіантом через папку Startup)
- Перевірка справності
- Налаштування Skills

Віддалений режим налаштовує цю машину для підключення до Gateway в іншому місці.
Він не встановлює й не змінює нічого на віддаленому хості.

## Деталі локального потоку

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо `~/.openclaw/openclaw.json` існує, виберіть Keep, Modify або Reset.
    - Повторний запуск майстра нічого не стирає, якщо ви явно не виберете Reset (або не передасте `--reset`).
    - Для CLI `--reset` типово використовує `config+creds+sessions`; використайте `--reset-scope full`, щоб також видалити робочий простір.
    - Якщо конфігурація невалідна або містить застарілі ключі, майстер зупиняється й просить запустити `openclaw doctor`, перш ніж продовжити.
    - Reset використовує `trash` і пропонує області:
      - Лише конфігурація
      - Конфігурація + облікові дані + сесії
      - Повне скидання (також видаляє робочий простір)
  </Step>
  <Step title="Модель і автентифікація">
    - Повна матриця варіантів наведена в [Варіанти автентифікації та моделі](#auth-and-model-options).
  </Step>
  <Step title="Робочий простір">
    - Типово `~/.openclaw/workspace` (можна налаштувати).
    - Створює у робочому просторі файли, потрібні для початкового bootstrap-ритуалу при першому запуску.
    - Структура робочого простору: [Робочий простір агента](/uk/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Запитує порт, bind, режим автентифікації та експонування tailscale.
    - Рекомендовано: залишати автентифікацію за токеном увімкненою навіть для loopback, щоб локальні WS-клієнти мали проходити автентифікацію.
    - У режимі токена інтерактивне налаштування пропонує:
      - **Згенерувати/зберегти відкритий токен** (типово)
      - **Використати SecretRef** (опційно)
    - У режимі пароля інтерактивне налаштування також підтримує зберігання у відкритому вигляді або через SecretRef.
    - Шлях SecretRef для токена в неінтерактивному режимі: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої змінної середовища в оточенні процесу онбордингу.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте автентифікацію лише якщо повністю довіряєте кожному локальному процесу.
    - Bind не лише на loopback усе одно потребує автентифікації.
  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR
    - [Telegram](/uk/channels/telegram): токен бота
    - [Discord](/uk/channels/discord): токен бота
    - [Google Chat](/uk/channels/googlechat): JSON сервісного акаунта + аудиторія Webhook
    - [Mattermost](/uk/channels/mattermost): токен бота + базовий URL
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація акаунта
    - [BlueBubbles](/uk/channels/bluebubbles): рекомендовано для iMessage; URL сервера + пароль + Webhook
    - [iMessage](/uk/channels/imessage): застарілий шлях до CLI `imsg` + доступ до БД
    - Безпека DM: типово використовується pairing. Перше DM надсилає код; схваліть через
      `openclaw pairing approve <channel> <code>` або використайте allowlist.
  </Step>
  <Step title="Встановлення демона">
    - macOS: LaunchAgent
      - Потребує сеансу користувача, який увійшов у систему; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux і Windows через WSL2: користувацький systemd unit
      - Майстер намагається виконати `loginctl enable-linger <user>`, щоб Gateway залишався запущеним після виходу з системи.
      - Може запросити sudo (записує в `/var/lib/systemd/linger`); спочатку пробує без sudo.
    - Нативний Windows: спочатку Scheduled Task
      - Якщо створення завдання заборонено, OpenClaw переходить на резервний варіант із елементом входу користувача в папці Startup і одразу запускає Gateway.
      - Scheduled Tasks залишаються пріоритетними, бо дають кращий статус супервізора.
    - Вибір runtime: Node (рекомендовано; потрібен для WhatsApp і Telegram). Bun не рекомендований.
  </Step>
  <Step title="Перевірка справності">
    - Запускає Gateway (за потреби) і виконує `openclaw health`.
    - `openclaw status --deep` додає до виводу статусу перевірку справності live Gateway, зокрема перевірки каналів, якщо вони підтримуються.
  </Step>
  <Step title="Skills">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дає змогу вибрати менеджер Node: npm, pnpm або bun.
    - Встановлює необов’язкові залежності (деякі використовують Homebrew на macOS).
  </Step>
  <Step title="Завершення">
    - Підсумок і наступні кроки, зокрема варіанти застосунків для iOS, Android і macOS.
  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, майстер виводить інструкції з переадресації портів SSH для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, майстер намагається їх зібрати; резервний варіант — `pnpm ui:build` (автоматично встановлює залежності UI).
</Note>

## Деталі віддаленого режиму

Віддалений режим налаштовує цю машину для підключення до Gateway в іншому місці.

<Info>
Віддалений режим не встановлює й не змінює нічого на віддаленому хості.
</Info>

Що ви налаштовуєте:

- URL віддаленого Gateway (`ws://...`)
- Токен, якщо для автентифікації віддаленого Gateway він потрібен (рекомендовано)

<Note>
- Якщо Gateway доступний лише через loopback, використовуйте SSH-тунелювання або tailnet.
- Підказки для виявлення:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Варіанти автентифікації та моделі

<AccordionGroup>
  <Accordion title="API-ключ Anthropic">
    Використовує `ANTHROPIC_API_KEY`, якщо він є, або запитує ключ, а потім зберігає його для використання демоном.
  </Accordion>
  <Accordion title="Підписка OpenAI Code (OAuth)">
    Потік через браузер; вставте `code#state`.

    Установлює `agents.defaults.model` у `openai-codex/gpt-5.4`, якщо модель не задана або має вигляд `openai/*`.

  </Accordion>
  <Accordion title="Підписка OpenAI Code (pairing пристрою)">
    Потік pairing через браузер із короткоживучим кодом пристрою.

    Установлює `agents.defaults.model` у `openai-codex/gpt-5.4`, якщо модель не задана або має вигляд `openai/*`.

  </Accordion>
  <Accordion title="API-ключ OpenAI">
    Використовує `OPENAI_API_KEY`, якщо він є, або запитує ключ, а потім зберігає облікові дані в профілях автентифікації.

    Установлює `agents.defaults.model` у `openai/gpt-5.4`, якщо модель не задана, має вигляд `openai/*` або `openai-codex/*`.

  </Accordion>
  <Accordion title="API-ключ xAI (Grok)">
    Запитує `XAI_API_KEY` і налаштовує xAI як провайдера моделі.
  </Accordion>
  <Accordion title="OpenCode">
    Запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`) і дає змогу вибрати каталог Zen або Go.
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
    Запитує ID акаунта, ID Gateway і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Конфігурація записується автоматично. Розміщений типово варіант — `MiniMax-M2.7`; налаштування з API-ключем використовує
    `minimax/...`, а налаштування через OAuth — `minimax-portal/...`.
    Докладніше: [MiniMax](/uk/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Конфігурація записується автоматично для стандартного StepFun або Step Plan на китайських чи глобальних endpoint.
    Стандарт наразі містить `step-3.5-flash`, а Step Plan також містить `step-3.5-flash-2603`.
    Докладніше: [StepFun](/uk/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (сумісний з Anthropic)">
    Запитує `SYNTHETIC_API_KEY`.
    Докладніше: [Synthetic](/uk/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud і локальні відкриті моделі)">
    Спочатку запитує `Cloud + Local`, `Cloud only` або `Local only`.
    `Cloud only` використовує `OLLAMA_API_KEY` з `https://ollama.com`.
    Режими з хостом запитують базовий URL (типово `http://127.0.0.1:11434`), виявляють доступні моделі та пропонують типові варіанти.
    `Cloud + Local` також перевіряє, чи на цьому хості Ollama виконано вхід для доступу до cloud.
    Докладніше: [Ollama](/uk/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot і Kimi Coding">
    Конфігурації Moonshot (Kimi K2) і Kimi Coding записуються автоматично.
    Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot).
  </Accordion>
  <Accordion title="Власний провайдер">
    Працює з endpoint, сумісними з OpenAI і Anthropic.

    Інтерактивний онбординг підтримує ті самі варіанти зберігання API-ключів, що й інші потоки API-ключів провайдерів:
    - **Вставити API-ключ зараз** (у відкритому вигляді)
    - **Використати посилання на секрет** (посилання на env або налаштоване посилання провайдера, із preflight-валідацією)

    Прапорці для неінтерактивного режиму:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (необов’язково; якщо не задано, використовується `CUSTOM_API_KEY`)
    - `--custom-provider-id` (необов’язково)
    - `--custom-compatibility <openai|anthropic>` (необов’язково; типово `openai`)

  </Accordion>
  <Accordion title="Пропустити">
    Залишає автентифікацію неналаштованою.
  </Accordion>
</AccordionGroup>

Поведінка моделі:

- Виберіть типову модель із виявлених варіантів або введіть провайдера й модель вручну.
- Коли онбординг починається з вибору автентифікації провайдера, засіб вибору моделі автоматично надає перевагу
  цьому провайдеру. Для Volcengine і BytePlus така сама перевага
  також застосовується до їхніх варіантів coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Якщо через такий фільтр пріоритетного провайдера список виявиться порожнім, засіб вибору повертається
  до повного каталогу замість того, щоб показувати відсутність моделей.
- Майстер виконує перевірку моделі й попереджає, якщо налаштована модель невідома або для неї бракує автентифікації.

Шляхи до облікових даних і профілів:

- Профілі автентифікації (API-ключі + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Імпорт застарілого OAuth: `~/.openclaw/credentials/oauth.json`

Режим зберігання облікових даних:

- Типова поведінка онбордингу зберігає API-ключі як відкриті значення в профілях автентифікації.
- `--secret-input-mode ref` вмикає режим посилань замість зберігання ключів у відкритому вигляді.
  В інтерактивному налаштуванні можна вибрати один із варіантів:
  - посилання на змінну середовища (наприклад, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - налаштоване посилання провайдера (`file` або `exec`) з псевдонімом провайдера та id
- Інтерактивний режим посилань виконує швидку preflight-валідацію перед збереженням.
  - Посилання env: перевіряє ім’я змінної й непорожнє значення в поточному оточенні онбордингу.
  - Посилання провайдера: перевіряє конфігурацію провайдера й розв’язує запитаний id.
  - Якщо preflight-перевірка не проходить, онбординг показує помилку й дозволяє повторити спробу.
- У неінтерактивному режимі `--secret-input-mode ref` підтримує лише env-посилання.
  - Задайте змінну середовища провайдера в оточенні процесу онбордингу.
  - Вбудовані прапорці ключів (наприклад, `--openai-api-key`) вимагають, щоб цю змінну середовища було задано; інакше онбординг одразу завершується з помилкою.
  - Для власних провайдерів неінтерактивний режим `ref` зберігає `models.providers.<id>.apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - У випадку власного провайдера `--custom-api-key` вимагає, щоб `CUSTOM_API_KEY` було задано; інакше онбординг одразу завершується з помилкою.
- Облікові дані автентифікації Gateway в інтерактивному налаштуванні підтримують вибір між відкритим значенням і SecretRef:
  - Режим токена: **Згенерувати/зберегти відкритий токен** (типово) або **Використати SecretRef**.
  - Режим пароля: відкрите значення або SecretRef.
- Шлях SecretRef для токена в неінтерактивному режимі: `--gateway-token-ref-env <ENV_VAR>`.
- Наявні налаштування з відкритим зберіганням продовжують працювати без змін.

<Note>
Порада для headless і серверів: завершіть OAuth на машині з браузером, а потім скопіюйте
`auth-profiles.json` цього агента (наприклад,
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний
шлях `$OPENCLAW_STATE_DIR/...`) на хост Gateway. `credentials/oauth.json`
— це лише застаріле джерело імпорту.
</Note>

## Виводи й внутрішні механізми

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальний онбординг типово встановлює `"coding"`, якщо значення не задано; наявні явно задані значення зберігаються)
- `gateway.*` (режим, bind, автентифікація, tailscale)
- `session.dmScope` (локальний онбординг типово встановлює це значення в `per-channel-peer`, якщо воно не задано; наявні явно задані значення зберігаються)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist каналів (Slack, Discord, Matrix, Microsoft Teams), якщо ви погоджуєтеся під час запитів (імена розв’язуються в ID, коли це можливо)
- `skills.install.nodeManager`
  - Прапорець `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - У ручній конфігурації пізніше все ще можна встановити `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp розміщуються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Деякі канали постачаються як plugins. Якщо їх вибрано під час налаштування, майстер
пропонує встановити plugin (npm або локальний шлях) перед конфігурацією каналу.
</Note>

RPC майстра Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Клієнти (застосунок macOS і Control UI) можуть відтворювати кроки без повторної реалізації логіки онбордингу.

Поведінка налаштування Signal:

- Завантажує відповідний ресурс релізу
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`
- Записує `channels.signal.cliPath` у конфігурацію
- Збірки JVM потребують Java 21
- Нативні збірки використовуються, коли вони доступні
- Windows використовує WSL2 і дотримується потоку Linux signal-cli всередині WSL

## Пов’язані документи

- Центр онбордингу: [Onboarding (CLI)](/uk/start/wizard)
- Автоматизація та скрипти: [Автоматизація CLI](/uk/start/wizard-cli-automation)
- Довідник команд: [`openclaw onboard`](/cli/onboard)
