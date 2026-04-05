---
read_when:
    - Додавання або зміна міграцій doctor
    - Упровадження несумісних змін конфігурації
summary: 'Команда Doctor: перевірки стану, міграції конфігурації та кроки виправлення'
title: Doctor
x-i18n:
    generated_at: "2026-04-05T18:04:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c0a15c522994552a1eef39206bed71fc5bf45746776372f24f31c101bfbd411
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` — це інструмент відновлення й міграції для OpenClaw. Він виправляє застарілий
стан/конфігурацію, перевіряє працездатність і надає практичні кроки для виправлення.

## Швидкий старт

```bash
openclaw doctor
```

### Headless / автоматизація

```bash
openclaw doctor --yes
```

Прийняти типові варіанти без запитів (включно з кроками відновлення restart/service/sandbox, якщо застосовно).

```bash
openclaw doctor --repair
```

Застосувати рекомендовані виправлення без запитів (виправлення + перезапуски, де це безпечно).

```bash
openclaw doctor --repair --force
```

Застосувати також агресивні виправлення (перезаписує власні конфігурації supervisor).

```bash
openclaw doctor --non-interactive
```

Запуск без запитів із застосуванням лише безпечних міграцій (нормалізація конфігурації + переміщення стану на диску). Пропускає дії restart/service/sandbox, які потребують підтвердження людини.
Міграції застарілого стану запускаються автоматично, якщо їх виявлено.

```bash
openclaw doctor --deep
```

Просканувати системні служби на наявність додаткових інсталяцій gateway (launchd/systemd/schtasks).

Якщо ви хочете переглянути зміни перед записом, спочатку відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (коротко)

- Необов’язкове попереднє оновлення для git-інсталяцій (лише в інтерактивному режимі).
- Перевірка актуальності протоколу UI (перезбирає Control UI, якщо схема протоколу новіша).
- Перевірка стану + запит на перезапуск.
- Підсумок стану Skills (доступні/відсутні/заблоковані) і стан плагінів.
- Нормалізація конфігурації для застарілих значень.
- Міграція конфігурації Talk із застарілих плоских полів `talk.*` до `talk.provider` + `talk.providers.<provider>`.
- Перевірки міграції browser для застарілих конфігурацій розширення Chrome і готовності Chrome MCP.
- Попередження щодо перевизначень провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Перевірка передумов TLS для OAuth-профілів OpenAI Codex.
- Міграція застарілого стану на диску (sessions/agent dir/WhatsApp auth).
- Міграція застарілих ключів контракту manifest плагінів (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Міграція застарілого сховища cron (`jobId`, `schedule.cron`, поля delivery/payload верхнього рівня, `provider` у payload, прості резервні webhook-завдання з `notify: true`).
- Перевірка lock-файлів сесій і очищення застарілих lock.
- Перевірки цілісності стану та прав доступу (sessions, transcripts, каталог стану).
- Перевірки прав доступу до файлу конфігурації (chmod 600) під час локального запуску.
- Стан auth для моделей: перевіряє строк дії OAuth, може оновлювати токени, що скоро спливають, і повідомляє про cooldown/disabled стани auth-профілів.
- Виявлення додаткового каталогу workspace (`~/openclaw`).
- Відновлення образу sandbox, якщо sandboxing увімкнено.
- Міграція застарілих служб і виявлення додаткових gateway.
- Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
- Перевірки runtime gateway (службу встановлено, але вона не працює; кешований label launchd).
- Попередження щодо стану каналів (перевіряються із запущеного gateway).
- Аудит конфігурації supervisor (launchd/systemd/schtasks) з необов’язковим відновленням.
- Перевірки найкращих практик runtime gateway (Node проти Bun, шляхи version manager).
- Діагностика конфліктів порту gateway (типово `18789`).
- Попередження безпеки для відкритих політик DM.
- Перевірки auth gateway для локального режиму token (пропонує генерацію token, якщо джерела token немає; не перезаписує конфігурації token SecretRef).
- Перевірка `systemd linger` у Linux.
- Перевірка розміру bootstrap-файлів workspace (попередження про обрізання/наближення до межі для контекстних файлів).
- Перевірка стану shell completion і автоматичне встановлення/оновлення.
- Перевірка готовності провайдера embeddings для memory search (локальна модель, віддалений API key або бінарний файл QMD).
- Перевірки source install (невідповідність pnpm workspace, відсутні UI assets, відсутній бінарний файл tsx).
- Запис оновленої конфігурації + метаданих wizard.

## Докладна поведінка та обґрунтування

### 0) Необов’язкове оновлення (git-інсталяції)

Якщо це git checkout і doctor запущено в інтерактивному режимі, він пропонує
оновити (fetch/rebase/build) перед запуском doctor.

### 1) Нормалізація конфігурації

Якщо конфігурація містить застарілі форми значень (наприклад `messages.ackReaction`
без перевизначення для конкретного каналу), doctor нормалізує їх до поточної
схеми.

Це також включає застарілі плоскі поля Talk. Поточна публічна конфігурація Talk —
це `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` у мапу провайдерів.

### 2) Міграції застарілих ключів конфігурації

Коли конфігурація містить застарілі ключі, інші команди відмовляються виконуватися та просять
запустити `openclaw doctor`.

Doctor:

- Пояснить, які застарілі ключі було знайдено.
- Покажe міграцію, яку він застосував.
- Перезапише `~/.openclaw/openclaw.json` оновленою схемою.

Gateway також автоматично запускає міграції doctor під час старту, коли виявляє
застарілий формат конфігурації, тож застарілі конфігурації виправляються без ручного втручання.
Міграції сховища cron обробляються через `openclaw doctor --fix`.

Поточні міграції:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → верхньорівневий `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- застарілі `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Для каналів з іменованими `accounts`, але зі збереженими однокористувацькими значеннями каналу на верхньому рівні, перенести ці значення, прив’язані до облікового запису, у підвищений обліковий запис, вибраний для цього каналу (`accounts.default` для більшості каналів; Matrix може зберегти наявну відповідну іменовану/типову ціль)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- видалити `browser.relayBindHost` (застаріле налаштування relay для розширення)

Попередження doctor також містять рекомендації щодо account-default для каналів із кількома обліковими записами:

- Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що fallback-маршрутизація може вибрати неочікуваний обліковий запис.
- Якщо `channels.<channel>.defaultAccount` установлено на невідомий ID облікового запису, doctor попереджає та перелічує налаштовані ID облікових записів.

### 2b) Перевизначення провайдера OpenCode

Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`,
це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`.
Це може примусово спрямовувати моделі до неправильного API або обнулювати вартість. Doctor попереджає, щоб ви могли прибрати це перевизначення й відновити маршрутизацію API + вартість для кожної моделі.

### 2c) Міграція browser і готовність Chrome MCP

Якщо ваша конфігурація browser все ще вказує на вилучений шлях розширення Chrome, doctor
нормалізує її до поточної моделі локального під’єднання Chrome MCP на тому самому хості:

- `browser.profiles.*.driver: "extension"` стає `"existing-session"`
- `browser.relayBindHost` видаляється

Doctor також виконує аудит локального шляху Chrome MCP на тому ж хості, коли ви використовуєте `defaultProfile:
"user"` або налаштований профіль `existing-session`:

- перевіряє, чи встановлено Google Chrome на тому самому хості для типових
  профілів з auto-connect
- перевіряє виявлену версію Chrome і попереджає, якщо вона нижча за Chrome 144
- нагадує ввімкнути remote debugging на сторінці inspect браузера (наприклад `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  або `edge://inspect/#remote-debugging`)

Doctor не може ввімкнути це налаштування на боці Chrome за вас. Локальний Chrome MCP
і надалі вимагає:

- браузер на базі Chromium 144+ на хості gateway/node
- локально запущений браузер
- увімкнений remote debugging у цьому браузері
- схвалення першого запиту на attach у браузері

Готовність тут стосується лише передумов для локального attach. Existing-session зберігає
поточні обмеження маршрутів Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF,
перехоплення завантажень і пакетні дії, як і раніше потребують керованого
browser або сирого профілю CDP.

Ця перевірка **не** застосовується до Docker, sandbox, remote-browser чи інших
headless-сценаріїв. Вони, як і раніше, використовують сирий CDP.

### 2d) Передумови TLS для OAuth

Коли налаштовано OAuth-профіль OpenAI Codex, doctor перевіряє endpoint авторизації OpenAI,
щоб переконатися, що локальний стек TLS Node/OpenSSL може валідувати ланцюжок сертифікатів. Якщо
перевірка завершується помилкою сертифіката (наприклад `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або self-signed сертифікат),
doctor виводить платформо-специфічні інструкції з виправлення. У macOS з Node із Homebrew
виправленням зазвичай є `brew postinstall ca-certificates`. З `--deep` перевірка виконується,
навіть якщо gateway справний.

### 3) Міграції застарілого стану (структура на диску)

Doctor може мігрувати старіші структури на диску до поточної:

- Сховище сесій + transcripts:
  - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
- Agent dir:
  - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
- Стан auth WhatsApp (Baileys):
  - із застарілого `~/.openclaw/credentials/*.json` (крім `oauth.json`)
  - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий ID облікового запису: `default`)

Ці міграції виконуються за принципом best-effort та є ідемпотентними; doctor видає попередження, коли
залишає будь-які застарілі каталоги як резервні копії. Gateway/CLI також автоматично мігрують
застарілі sessions + agent dir під час старту, тож history/auth/models потрапляють у
шлях для конкретного агента без ручного запуску doctor. Auth WhatsApp навмисно
мігрується лише через `openclaw doctor`. Нормалізація provider/provider-map для Talk тепер
порівнює за структурною рівністю, тож відмінності лише в порядку ключів більше не спричиняють
повторних холостих змін `doctor --fix`.

### 3a) Міграції застарілих manifest плагінів

Doctor сканує всі встановлені manifest плагінів на наявність застарілих верхньорівневих
ключів можливостей (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Якщо їх знайдено, він пропонує перемістити їх до об’єкта `contracts`
і переписати файл manifest безпосередньо. Ця міграція є ідемпотентною;
якщо ключ `contracts` уже містить ті самі значення, застарілий ключ видаляється
без дублювання даних.

### 3b) Міграції застарілого сховища cron

Doctor також перевіряє сховище cron jobs (типово `~/.openclaw/cron/jobs.json`,
або `cron.store`, якщо перевизначено) на старі форми завдань, які планувальник усе ще
приймає для сумісності.

Поточні очищення cron включають:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- поля payload верхнього рівня (`message`, `model`, `thinking`, ...) → `payload`
- поля delivery верхнього рівня (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- псевдоніми delivery `provider` у payload → явний `delivery.channel`
- прості застарілі резервні webhook-завдання з `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

Doctor автоматично мігрує завдання `notify: true` лише тоді, коли може зробити це
без зміни поведінки. Якщо завдання поєднує застарілий резервний notify із наявним
режимом доставки, що не є webhook, doctor попереджає і залишає це завдання для ручної перевірки.

### 3c) Очищення session lock

Doctor сканує каталог сесій кожного агента на наявність застарілих файлів lock запису — файлів,
які залишилися після аварійного завершення сесії. Для кожного знайденого lock-файлу він повідомляє:
шлях, PID, чи PID ще активний, вік lock і чи
вважається він застарілим (мертвий PID або старіший за 30 хвилин). У режимі `--fix` / `--repair`
він автоматично видаляє застарілі lock-файли; інакше друкує примітку та
інструктує повторно запустити з `--fix`.

### 4) Перевірки цілісності стану (збереження сесій, маршрутизація та безпека)

Каталог стану — це операційний стовбур мозку. Якщо він зникне, ви втратите
сесії, облікові дані, журнали та конфігурацію (якщо у вас немає резервних копій деінде).

Doctor перевіряє:

- **Відсутній каталог стану**: попереджає про катастрофічну втрату стану, пропонує відтворити
  каталог і нагадує, що не може відновити відсутні дані.
- **Права доступу до каталогу стану**: перевіряє можливість запису; пропонує виправити права
  (і показує підказку `chown`, якщо виявлено невідповідність owner/group).
- **Каталог стану macOS із хмарною синхронізацією**: попереджає, коли стан розташовується в iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або
  `~/Library/CloudStorage/...`, оскільки шляхи із синхронізацією можуть спричиняти повільніший I/O
  і конфлікти lock/sync.
- **Каталог стану Linux на SD або eMMC**: попереджає, коли стан розташовується на джерелі монтування `mmcblk*`,
  оскільки випадковий I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час запису сесій і облікових даних.
- **Відсутні каталоги сесій**: `sessions/` і каталог сховища сесій
  потрібні для збереження history і запобігання збоям `ENOENT`.
- **Невідповідність transcript**: попереджає, коли у нещодавніх записах сесій відсутні
  файли transcript.
- **Основна сесія “1-line JSONL”**: позначає випадки, коли основний transcript має лише один
  рядок (history не накопичується).
- **Кілька каталогів стану**: попереджає, коли існує кілька каталогів `~/.openclaw` у різних
  home-каталогах або коли `OPENCLAW_STATE_DIR` вказує в інше місце (history може
  розділитися між інсталяціями).
- **Нагадування про remote mode**: якщо `gateway.mode=remote`, doctor нагадує запустити
  його на віддаленому хості (стан зберігається там).
- **Права доступу до файлу конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json`
  доступний для читання групою/усіма, і пропонує обмежити права до `600`.

### 5) Стан auth для моделей (строк дії OAuth)

Doctor перевіряє OAuth-профілі в сховищі auth, попереджає, коли токени
скоро спливають/вже спливли, і може оновити їх, коли це безпечно. Якщо OAuth/token-профіль
Anthropic застарів, він пропонує API-ключ Anthropic або застарілий
шлях setup-token Anthropic.
Запити на оновлення з’являються лише в інтерактивному режимі (TTY); `--non-interactive`
пропускає спроби оновлення.

Doctor також виявляє застарілий вилучений стан Anthropic Claude CLI. Якщо старі
байти облікових даних `anthropic:claude-cli` все ще існують у `auth-profiles.json`,
doctor перетворює їх назад на токен-/OAuth-профілі Anthropic і переписує
застарілі посилання на моделі `claude-cli/...`.
Якщо байтів уже немає, doctor видаляє застарілу конфігурацію та виводить
команди для відновлення.

Doctor також повідомляє про auth-профілі, які тимчасово непридатні через:

- короткі cooldown (rate limit/timeouts/auth failures)
- довші вимкнення (помилки billing/credit)

### 6) Валідація моделі hooks

Якщо встановлено `hooks.gmail.model`, doctor перевіряє посилання на модель щодо
каталогу й allowlist та попереджає, коли воно не буде визначене або заборонене.

### 7) Відновлення образу sandbox

Коли sandboxing увімкнено, doctor перевіряє образи Docker і пропонує зібрати їх або
перейти на застарілі імена, якщо поточний образ відсутній.

### 7b) Runtime-залежності вбудованих плагінів

Doctor перевіряє, чи присутні runtime-залежності вбудованих плагінів (наприклад
runtime-пакунки плагіна Discord) у корені інсталяції OpenClaw.
Якщо чогось бракує, doctor повідомляє про пакунки й установлює їх у режимі
`openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Міграції служб gateway і підказки з очищення

Doctor виявляє застарілі служби gateway (launchd/systemd/schtasks) і
пропонує видалити їх та встановити службу OpenClaw з використанням поточного порту gateway.
Він також може просканувати наявність додаткових gateway-подібних служб і показати підказки для очищення.
Іменовані служби gateway OpenClaw на основі профілів вважаються повноцінними й не позначаються як "extra".

### 8b) Стартова міграція Matrix

Коли обліковий запис каналу Matrix має очікувану або актуальну міграцію застарілого стану,
doctor (у режимі `--fix` / `--repair`) створює знімок стану до міграції, а потім
запускає кроки міграції за принципом best-effort: міграцію застарілого стану Matrix і підготовку
застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки журналюються, а
startup продовжується. У режимі лише для читання (`openclaw doctor` без `--fix`) ця перевірка
повністю пропускається.

### 9) Попередження безпеки

Doctor видає попередження, коли провайдер відкритий для DM без allowlist, або
коли політика налаштована небезпечним чином.

### 10) systemd linger (Linux)

Якщо запуск виконується як користувацька служба systemd, doctor перевіряє, що lingering увімкнено, щоб
gateway залишався активним після виходу з системи.

### 11) Стан workspace (skills, плагіни та застарілі каталоги)

Doctor друкує підсумок стану workspace для типового агента:

- **Стан Skills**: кількість доступних, із відсутніми вимогами та заблокованих allowlist навичок.
- **Застарілі каталоги workspace**: попереджає, коли `~/openclaw` або інші застарілі каталоги workspace
  існують поруч із поточним workspace.
- **Стан плагінів**: кількість завантажених/вимкнених/помилкових плагінів; перелічує ID плагінів для
  будь-яких помилок; повідомляє про можливості bundle plugin.
- **Попередження про сумісність плагінів**: позначає плагіни, які мають проблеми сумісності з
  поточним runtime.
- **Діагностика плагінів**: показує будь-які попередження або помилки під час завантаження, видані
  реєстром плагінів.

### 11b) Розмір bootstrap-файлів

Doctor перевіряє, чи bootstrap-файли workspace (наприклад `AGENTS.md`,
`CLAUDE.md` або інші інʼєктовані контекстні файли) наближаються до
налаштованого символьного бюджету або перевищують його. Він показує для кожного файла кількість сирих та інʼєктованих символів, відсоток обрізання,
причину обрізання (`max/file` або `max/total`) і загальну кількість інʼєктованих
символів як частку загального бюджету. Коли файли обрізаються або наближаються до межі,
doctor друкує поради щодо налаштування `agents.defaults.bootstrapMaxChars`
і `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell completion

Doctor перевіряє, чи встановлено tab completion для поточної оболонки
(zsh, bash, fish або PowerShell):

- Якщо профіль оболонки використовує повільний шаблон динамічного completion
  (`source <(openclaw completion ...)`), doctor оновлює його до швидшого
  варіанта з кешованим файлом.
- Якщо completion налаштовано в профілі, але файл кешу відсутній,
  doctor автоматично генерує кеш заново.
- Якщо completion взагалі не налаштовано, doctor пропонує встановити його
  (лише в інтерактивному режимі; пропускається з `--non-interactive`).

Виконайте `openclaw completion --write-state`, щоб вручну перегенерувати кеш.

### 12) Перевірки auth gateway (локальний token)

Doctor перевіряє готовність локальної auth gateway у режимі token.

- Якщо режим token потребує token і джерела token немає, doctor пропонує згенерувати його.
- Якщо `gateway.auth.token` керується через SecretRef, але недоступний, doctor попереджає й не перезаписує його відкритим текстом.
- `openclaw doctor --generate-gateway-token` примусово генерує token лише тоді, коли token SecretRef не налаштовано.

### 12b) Виправлення лише для читання з урахуванням SecretRef

Деякі сценарії відновлення потребують перевірки налаштованих облікових даних без послаблення fail-fast поведінки runtime.

- `openclaw doctor --fix` тепер використовує ту саму модель підсумку SecretRef лише для читання, що й команди сімейства status, для цільових виправлень конфігурації.
- Приклад: відновлення `@username` у `allowFrom` / `groupAllowFrom` Telegram намагається використовувати налаштовані облікові дані бота, коли вони доступні.
- Якщо token бота Telegram налаштований через SecretRef, але недоступний у поточному шляху команди, doctor повідомляє, що облікові дані налаштовані, але недоступні, і пропускає авторозв’язання замість збою або хибного повідомлення про відсутність token.

### 13) Перевірка стану gateway + перезапуск

Doctor запускає перевірку стану і пропонує перезапустити gateway, якщо той
виглядає несправним.

### 13b) Готовність memory search

Doctor перевіряє, чи готовий налаштований провайдер embeddings для memory search
для типового агента. Поведінка залежить від налаштованого backend і провайдера:

- **Backend QMD**: перевіряє, чи доступний і чи може запускатися бінарний файл `qmd`.
  Якщо ні, виводить інструкції з виправлення, включно з npm-пакунком і ручним варіантом шляху до бінарного файла.
- **Явний локальний провайдер**: перевіряє наявність локального файлу моделі або розпізнаваного
  віддаленого/завантажуваного URL моделі. Якщо він відсутній, пропонує перейти на віддалений провайдер.
- **Явний віддалений провайдер** (`openai`, `voyage` тощо): перевіряє, чи
  присутній API key у середовищі або сховищі auth. Якщо його немає, показує практичні підказки щодо виправлення.
- **Auto provider**: спочатку перевіряє доступність локальної моделі, а потім пробує кожен віддалений
  провайдер у порядку автовибору.

Коли доступний результат перевірки gateway (gateway був справний на момент
перевірки), doctor звіряє його з конфігурацією, видимою в CLI, і зазначає
будь-які розбіжності.

Використовуйте `openclaw memory status --deep`, щоб перевірити готовність embeddings у runtime.

### 14) Попередження щодо стану каналів

Якщо gateway справний, doctor виконує перевірку стану каналів і повідомляє
попередження разом із запропонованими виправленнями.

### 15) Аудит конфігурації supervisor + відновлення

Doctor перевіряє встановлену конфігурацію supervisor (launchd/systemd/schtasks) на
наявність відсутніх або застарілих типових значень (наприклад, залежності systemd від network-online та
затримки перезапуску). Коли він знаходить невідповідність, то рекомендує оновлення і може
переписати service file/task відповідно до поточних типових значень.

Примітки:

- `openclaw doctor` запитує підтвердження перед переписуванням конфігурації supervisor.
- `openclaw doctor --yes` приймає типові запити на відновлення.
- `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
- `openclaw doctor --repair --force` перезаписує власні конфігурації supervisor.
- Якщо token auth потребує token і `gateway.auth.token` керується через SecretRef, встановлення/відновлення служби doctor перевіряє SecretRef, але не зберігає розв’язані відкриті значення token у метаданих середовища служби supervisor.
- Якщо token auth потребує token і налаштований token SecretRef не може бути розв’язаний, doctor блокує шлях install/repair і надає практичні інструкції.
- Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує install/repair, доки режим не буде явно встановлено.
- Для Linux user-systemd units перевірки розбіжностей token у doctor тепер включають як джерела `Environment=`, так і `EnvironmentFile=` під час порівняння метаданих auth служби.
- Ви завжди можете примусово переписати все через `openclaw gateway install --force`.

### 16) Runtime gateway + діагностика портів

Doctor перевіряє runtime служби (PID, статус останнього завершення) і попереджає, коли
службу встановлено, але вона фактично не працює. Він також перевіряє конфлікти
на порту gateway (типово `18789`) і повідомляє ймовірні причини (gateway уже запущено, SSH tunnel).

### 17) Найкращі практики runtime gateway

Doctor попереджає, коли служба gateway працює на Bun або на шляху Node, керованому version manager
(`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram потребують Node,
а шляхи version manager можуть ламатися після оновлень, оскільки служба не
завантажує ініціалізацію вашої оболонки. Doctor пропонує перейти на системну інсталяцію Node, якщо
вона доступна (Homebrew/apt/choco).

### 18) Запис конфігурації + метадані wizard

Doctor зберігає будь-які зміни конфігурації та ставить позначки в метаданих wizard, щоб зафіксувати запуск doctor.

### 19) Поради щодо workspace (резервне копіювання + система пам’яті)

Doctor пропонує систему пам’яті для workspace, якщо її немає, і друкує пораду про резервне копіювання,
якщо workspace ще не перебуває під git.

Див. [/concepts/agent-workspace](/concepts/agent-workspace) для повного посібника зі
структури workspace та резервного копіювання через git (рекомендовано приватний GitHub або GitLab).
