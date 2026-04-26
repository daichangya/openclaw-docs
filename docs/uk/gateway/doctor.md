---
read_when:
    - Додавання або змінення міграцій doctor
    - Запровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда Doctor: перевірки стану, міграції конфігурації та кроки відновлення'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T07:48:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53248eb2777a16197480654302d6802b8b6d4f4b810b443d0aea44e5d40b1cd5
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` — це інструмент відновлення + міграції для OpenClaw. Він виправляє застарілу конфігурацію/стан, перевіряє стан системи та надає практичні кроки для відновлення.

## Швидкий старт

```bash
openclaw doctor
```

### Безголовий режим і режими автоматизації

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Приймати типові значення без запитів (зокрема кроки відновлення перезапуску/служби/sandbox, коли це застосовно).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Застосовувати рекомендовані виправлення без запитів (виправлення + перезапуски, де це безпечно).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Застосовувати також агресивні виправлення (перезаписує користувацькі конфігурації supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запускати без запитів і застосовувати лише безпечні міграції (нормалізація конфігурації + перенесення стану на диску). Пропускає дії перезапуску/служби/sandbox, які потребують підтвердження людиною. Міграції застарілого стану виконуються автоматично, коли їх виявлено.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Сканувати системні служби на наявність додаткових інсталяцій gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Якщо ви хочете переглянути зміни перед записом, спочатку відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що це робить (коротко)

<AccordionGroup>
  <Accordion title="Стан системи, UI та оновлення">
    - Необов’язкове попереднє оновлення для git-інсталяцій (лише в інтерактивному режимі).
    - Перевірка актуальності протоколу UI (перебудовує Control UI, коли схема протоколу новіша).
    - Перевірка стану + запит на перезапуск.
    - Зведення стану Skills (доступні/відсутні/заблоковані) і стан Plugin.
  </Accordion>
  <Accordion title="Конфігурація та міграції">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk із застарілих плоских полів `talk.*` у `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції browser для застарілих конфігурацій розширення Chrome і готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про затінення Codex OAuth (`models.providers.openai-codex`).
    - Перевірка TLS-передумов OAuth для профілів OpenAI Codex OAuth.
    - Міграція застарілого стану на диску (sessions/каталог agent/автентифікація WhatsApp).
    - Міграція застарілих ключів контрактів маніфесту Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція застарілого сховища Cron (`jobId`, `schedule.cron`, поля delivery/payload верхнього рівня, `provider` у payload, прості резервні завдання Webhook з `notify: true`).
    - Міграція застарілої policy runtime агента до `agents.defaults.agentRuntime` і `agents.list[].agentRuntime`.
  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка файлів блокування сесій і очищення застарілих блокувань.
    - Відновлення стенограм сесій для дубльованих гілок перезапису prompt, створених у збірках 2026.4.24, яких це стосується.
    - Перевірки цілісності стану та прав доступу (sessions, transcripts, каталог state).
    - Перевірки прав доступу до файлу конфігурації (`chmod 600`) при локальному запуску.
    - Стан автентифікації model: перевіряє строк дії OAuth, може оновлювати токени, строк дії яких спливає, і повідомляє про стани cooldown/disabled профілів auth.
    - Виявлення додаткового каталогу workspace (`~/openclaw`).
  </Accordion>
  <Accordion title="Gateway, служби та supervisor">
    - Відновлення образу sandbox, коли sandboxing увімкнено.
    - Міграція застарілих служб і виявлення додаткових gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Перевірки runtime gateway (службу встановлено, але вона не працює; кешована мітка launchd).
    - Попередження про стан channel (визначається із запущеного gateway).
    - Аудит конфігурації supervisor (launchd/systemd/schtasks) з необов’язковим відновленням.
    - Перевірки рекомендованих практик runtime gateway (Node проти Bun, шляхи менеджера версій).
    - Діагностика конфліктів портів gateway (типовий `18789`).
  </Accordion>
  <Accordion title="Auth, безпека та pairing">
    - Попередження безпеки для відкритих policy DM.
    - Перевірки auth gateway для локального режиму токена (пропонує згенерувати токен, коли немає джерела токена; не перезаписує конфігурації токенів SecretRef).
    - Виявлення проблем із pairing пристроїв (очікувані запити першого pairing, очікувані підвищення ролі/області дії, застаріле розходження локального кешу токенів пристрою та розходження auth у paired-записах).
  </Accordion>
  <Accordion title="Workspace і shell">
    - Перевірка `linger` systemd у Linux.
    - Перевірка розміру bootstrap-файлу workspace (попередження про обрізання/наближення до ліміту для контекстних файлів).
    - Перевірка стану завершення команд shell і автоінсталяція/оновлення.
    - Перевірка готовності провайдера embedding для пошуку в memory (локальна model, віддалений API-ключ або двійковий файл QMD).
    - Перевірки source-інсталяції (невідповідність workspace pnpm, відсутні assets UI, відсутній двійковий файл tsx).
    - Записує оновлену конфігурацію + метадані майстра.
  </Accordion>
</AccordionGroup>

## Заповнення назад і скидання Dreams UI

Сцена Dreams у Control UI містить дії **Backfill**, **Reset** і **Clear Grounded** для робочого процесу grounded dreaming. Ці дії використовують RPC-методи gateway у стилі doctor, але вони **не** є частиною відновлення/міграції CLI `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному workspace, запускає grounded REM diary pass і записує оборотні записи backfill у `DREAMS.md`.
- **Reset** видаляє з `DREAMS.md` лише ті записи щоденника backfill, які позначено.
- **Clear Grounded** видаляє лише staged grounded-only короткострокові записи, що походять з історичного відтворення й ще не накопичили live recall або щоденну підтримку.

Чого вони самі по собі **не** роблять:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не виконують автоматично staged grounded candidates у live short-term promotion store, якщо ви явно не запустите staged CLI-шлях спочатку

Якщо ви хочете, щоб grounded historical replay впливав на звичайний deep promotion lane, натомість використовуйте потік CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це поміщає grounded durable candidates у short-term dreaming store, залишаючи `DREAMS.md` як поверхню для перегляду.

## Детальна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (git-інсталяції)">
    Якщо це git checkout і doctor запущено в інтерактивному режимі, він пропонує оновитися (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без перевизначення для певного channel), doctor нормалізує їх до поточної схеми.

    Це також включає застарілі плоскі поля Talk. Поточна публічна конфігурація Talk — це `talk.provider` + `talk.providers.<provider>`. Doctor переписує застарілі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у карту provider.

  </Accordion>
  <Accordion title="2. Міграції застарілих ключів конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються виконуватися й просять запустити `openclaw doctor`.

    Doctor:

    - Пояснить, які застарілі ключі було знайдено.
    - Покажe міграцію, яку він застосував.
    - Перезапише `~/.openclaw/openclaw.json` відповідно до оновленої схеми.

    Gateway також автоматично запускає міграції doctor під час старту, коли виявляє застарілий формат конфігурації, тому застарілі конфігурації відновлюються без ручного втручання. Міграції сховища завдань Cron обробляються через `openclaw doctor --fix`.

    Поточні міграції:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → верхньорівневе `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - застарілі `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` і `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` і `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` і `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` і `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Для channel із іменованими `accounts`, але зі збереженими верхньорівневими значеннями channel для одного облікового запису, ці значення рівня account переносяться в підвищений account, вибраний для цього channel (`accounts.default` для більшості channel; Matrix може зберігати наявну відповідну іменовану/default-ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видалення `browser.relayBindHost` (застарілий параметр relay для розширення)

    Попередження doctor також містять рекомендації щодо типового account для багатoоблікових channel:

    - Якщо налаштовано два або більше записи `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що fallback routing може вибрати неочікуваний account.
    - Якщо `channels.<channel>.defaultAccount` встановлено на невідомий ID account, doctor попереджає та перелічує налаштовані ID account.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати models до неправильного API або обнулити вартість. Doctor попереджає про це, щоб ви могли видалити перевизначення й відновити маршрутизацію API та вартість для кожної model.
  </Accordion>
  <Accordion title="2c. Міграція browser і готовність Chrome MCP">
    Якщо ваша конфігурація browser усе ще вказує на вилучений шлях розширення Chrome, doctor нормалізує її до поточної host-local моделі підключення Chrome MCP:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє host-local шлях Chrome MCP, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи встановлено Google Chrome на тому самому хості для типових профілів auto-connect
    - перевіряє виявлену версію Chrome і попереджає, якщо вона нижча за Chrome 144
    - нагадує ввімкнути remote debugging на сторінці inspect браузера (наприклад, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

  Doctor не може ввімкнути налаштування на боці Chrome за вас. Host-local Chrome MCP, як і раніше, вимагає:

    - браузер на основі Chromium 144+ на хості gateway/node
    - локально запущений браузер
    - увімкнений remote debugging у цьому браузері
    - підтвердження першого запиту згоди на підключення в браузері

  Готовність тут стосується лише локальних передумов для підключення. Existing-session зберігає поточні обмеження маршрутів Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, усе ще потребують керованого browser або профілю raw CDP.

  Ця перевірка **не** стосується Docker, sandbox, remote-browser або інших безголових сценаріїв. Вони, як і раніше, використовують raw CDP.

  </Accordion>
  <Accordion title="2d. TLS-передумови OAuth">
    Коли налаштовано профіль OpenAI Codex OAuth, doctor опитує endpoint авторизації OpenAI, щоб перевірити, чи локальний стек TLS Node/OpenSSL може перевірити ланцюжок сертифікатів. Якщо опитування завершується помилкою сертифіката (наприклад, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або самопідписаний сертифікат), doctor виводить специфічні для платформи вказівки щодо виправлення. На macOS з Node, установленим через Homebrew, виправленням зазвичай є `brew postinstall ca-certificates`. Із `--deep` опитування виконується, навіть якщо gateway у здоровому стані.
  </Accordion>
  <Accordion title="2e. Перевизначення провайдера Codex OAuth">
    Якщо ви раніше додали застарілі налаштування транспорту OpenAI у `models.providers.openai-codex`, вони можуть затіняти вбудований шлях провайдера Codex OAuth, який новіші релізи використовують автоматично. Doctor попереджає, коли бачить ці старі налаштування транспорту поруч із Codex OAuth, щоб ви могли видалити або переписати застаріле перевизначення транспорту й повернути вбудовану поведінку маршрутизації/fallback. Користувацькі proxy та перевизначення лише заголовків, як і раніше, підтримуються й не викликають цього попередження.
  </Accordion>
  <Accordion title="2f. Попередження про маршрути Plugin Codex">
    Коли вбудований Plugin Codex увімкнено, doctor також перевіряє, чи первинні посилання на model `openai-codex/*` усе ще розв’язуються через типовий runner PI. Це поєднання є валідним, коли ви хочете використовувати автентифікацію Codex OAuth/підписки через PI, але його легко сплутати з native harness app-server Codex. Doctor попереджає про це й указує на явну форму app-server: `openai/*` плюс `agentRuntime.id: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor не виправляє це автоматично, оскільки обидва маршрути є валідними:

    - `openai-codex/*` + PI означає «використовувати автентифікацію Codex OAuth/підписки через звичайний runner OpenClaw».
    - `openai/*` + `runtime: "codex"` означає «виконувати вбудований turn через native app-server Codex».
    - `/codex ...` означає «керувати native conversation Codex з чату або прив’язати її».
    - `/acp ...` або `runtime: "acp"` означає «використовувати зовнішній адаптер ACP/acpx».

    Якщо з’являється це попередження, виберіть маршрут, який ви мали на увазі, і відредагуйте конфігурацію вручну. Залишайте попередження як є, якщо PI Codex OAuth є навмисним.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (розміщення на диску)">
    Doctor може мігрувати старіші розміщення на диску до поточної структури:

    - Сховище sessions + transcripts:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог agent:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан auth WhatsApp (Baileys):
      - із застарілих `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий ID account: `default`)

    Ці міграції виконуються в режимі best-effort та є ідемпотентними; doctor виведе попередження, якщо залишить будь-які застарілі каталоги як резервні копії. Gateway/CLI також автоматично мігрує застарілі sessions + каталог agent під час запуску, тож history/auth/models потрапляють у шлях для конкретного agent без ручного запуску doctor. Auth WhatsApp навмисно мігрується лише через `openclaw doctor`. Нормалізація provider/provider-map Talk тепер порівнюється за структурною рівністю, тому відмінності лише в порядку ключів більше не спричиняють повторних no-op змін у `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції застарілих маніфестів Plugin">
    Doctor сканує всі встановлені маніфести Plugin на наявність застарілих ключів можливостей верхнього рівня (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Якщо їх знайдено, він пропонує перемістити їх до об’єкта `contracts` і переписати файл маніфесту на місці. Ця міграція є ідемпотентною; якщо ключ `contracts` уже має ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції застарілого сховища Cron">
    Doctor також перевіряє сховище завдань Cron (`~/.openclaw/cron/jobs.json` типово або `cron.store`, якщо перевизначено) на наявність старих форм завдань, які scheduler усе ще приймає задля сумісності.

    Поточні очищення Cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - поля payload верхнього рівня (`message`, `model`, `thinking`, ...) → `payload`
    - поля delivery верхнього рівня (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми delivery `provider` у payload → явний `delivery.channel`
    - прості застарілі резервні завдання Webhook з `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує завдання `notify: true`, лише коли це можна зробити без зміни поведінки. Якщо завдання поєднує застарілий резервний notify із наявним режимом delivery, що не є webhook, doctor попереджає та залишає це завдання для ручної перевірки.

  </Accordion>
  <Accordion title="3c. Очищення блокувань сесій">
    Doctor сканує каталог sessions кожного agent на наявність застарілих файлів блокування запису — файлів, що залишилися після аварійного завершення session. Для кожного знайденого файла блокування він повідомляє: шлях, PID, чи PID усе ще активний, вік блокування та чи вважається воно застарілим (мертвий PID або вік понад 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше виводить примітку та пропонує повторно запустити з `--fix`.
  </Accordion>
  <Accordion title="3d. Відновлення гілок стенограм сесій">
    Doctor сканує JSONL-файли sessions agent на наявність дубльованої форми гілки, створеної помилкою переписування стенограми prompt у 2026.4.24: покинутий turn користувача з внутрішнім контекстом runtime OpenClaw плюс активний sibling із тим самим видимим prompt користувача. У режимі `--fix` / `--repair` doctor створює резервну копію кожного ураженого файла поруч з оригіналом і переписує стенограму на активну гілку, щоб history gateway та читачі memory більше не бачили дубльованих turn.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сесій, маршрутизація та безпека)">
    Каталог state — це операційний стовбур мозку. Якщо він зникне, ви втратите sessions, credentials, logs і config (якщо у вас немає резервних копій в іншому місці).

    Doctor перевіряє:

    - **Відсутній каталог state**: попереджає про катастрофічну втрату стану, пропонує відтворити каталог і нагадує, що не може відновити втрачені дані.
    - **Права доступу до каталогу state**: перевіряє можливість запису; пропонує виправити права доступу (і виводить підказку `chown`, якщо виявлено невідповідність власника/групи).
    - **Каталог state macOS, синхронізований із хмарою**: попереджає, коли state розв’язується в межах iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, оскільки шляхи, що підтримуються синхронізацією, можуть спричиняти повільніший I/O та гонки блокування/синхронізації.
    - **Каталог state Linux на SD або eMMC**: попереджає, коли state розв’язується до джерела монтування `mmcblk*`, оскільки випадковий I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час запису sessions і credentials.
    - **Відсутні каталоги sessions**: `sessions/` і каталог сховища sessions потрібні для збереження history та уникнення збоїв `ENOENT`.
    - **Невідповідність transcripts**: попереджає, коли нещодавні записи session мають відсутні файли transcript.
    - **Основна session «1-рядковий JSONL»**: позначає випадки, коли основний transcript має лише один рядок (history не накопичується).
    - **Кілька каталогів state**: попереджає, коли існує кілька тек `~/.openclaw` у різних домашніх каталогах або коли `OPENCLAW_STATE_DIR` вказує в інше місце (history може розділятися між інсталяціями).
    - **Нагадування про віддалений режим**: якщо `gateway.mode=remote`, doctor нагадує запускати його на віддаленому хості (state живе там).
    - **Права доступу до файлу конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групою/усіма, і пропонує обмежити до `600`.

  </Accordion>
  <Accordion title="5. Стан auth model (строк дії OAuth)">
    Doctor перевіряє профілі OAuth у сховищі auth, попереджає, коли строк дії токенів спливає/вже сплив, і може оновити їх, коли це безпечно. Якщо профіль Anthropic OAuth/token застарів, він пропонує API-ключ Anthropic або шлях setup-token Anthropic. Запити на оновлення з’являються лише в інтерактивному режимі (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно завершується помилкою (наприклад, `refresh_token_reused`, `invalid_grant` або коли provider повідомляє, що потрібно ввійти знову), doctor повідомляє, що потрібна повторна auth, і виводить точну команду `openclaw models auth login --provider ...`, яку слід виконати.

    Doctor також повідомляє про профілі auth, які тимчасово непридатні до використання через:

    - короткі cooldown (обмеження частоти/тайм-аути/збої auth)
    - довші відключення (збої білінгу/кредиту)

  </Accordion>
  <Accordion title="6. Перевірка model hooks">
    Якщо встановлено `hooks.gmail.model`, doctor перевіряє посилання на model за каталогом і allowlist та попереджає, якщо воно не розв’язується або не дозволене.
  </Accordion>
  <Accordion title="7. Відновлення образу sandbox">
    Коли sandboxing увімкнено, doctor перевіряє Docker-образи та пропонує зібрати їх або перейти на застарілі імена, якщо поточний образ відсутній.
  </Accordion>
  <Accordion title="7b. Runtime-залежності вбудованих Plugin">
    Doctor перевіряє runtime-залежності лише для вбудованих Plugin, які активні в поточній конфігурації або увімкнені типовим значенням у своєму вбудованому маніфесті, наприклад `plugins.entries.discord.enabled: true`, застаріле `channels.discord.enabled: true` або типово ввімкнений вбудований provider. Якщо чогось бракує, doctor повідомляє про пакети та встановлює їх у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Зовнішні Plugin, як і раніше, використовують `openclaw plugins install` / `openclaw plugins update`; doctor не встановлює залежності для довільних шляхів Plugin.

    Gateway і локальний CLI також можуть за потреби відновлювати runtime-залежності активних вбудованих Plugin перед імпортом вбудованого Plugin. Ці інсталяції обмежені коренем runtime-інсталяції Plugin, виконуються з вимкненими scripts, не записують package lock і захищені блокуванням install-root, щоб одночасні запуски CLI або Gateway не змінювали те саме дерево `node_modules` одночасно.

  </Accordion>
  <Accordion title="8. Міграції служб Gateway і підказки щодо очищення">
    Doctor виявляє застарілі служби gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити службу OpenClaw з поточним портом gateway. Він також може сканувати наявність додаткових служб, схожих на gateway, і виводити підказки щодо очищення. Служби gateway OpenClaw з іменами профілів вважаються повноцінними й не позначаються як «додаткові».
  </Accordion>
  <Accordion title="8b. Міграція Matrix під час запуску">
    Коли обліковий запис каналу Matrix має очікувану або придатну до виконання міграцію застарілого стану, doctor (у режимі `--fix` / `--repair`) створює знімок стану до міграції, а потім виконує кроки міграції в режимі best-effort: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки записуються в журнал, а запуск триває. У режимі лише читання (`openclaw doctor` без `--fix`) ця перевірка повністю пропускається.
  </Accordion>
  <Accordion title="8c. Pairing пристроїв і розходження auth">
    Doctor тепер перевіряє стан pairing пристроїв як частину звичайного проходу перевірки стану системи.

    Що він повідомляє:

    - очікувані запити на pairing уперше
    - очікувані підвищення ролі для вже спарених пристроїв
    - очікувані підвищення scope для вже спарених пристроїв
    - виправлення невідповідності public key, коли ID пристрою все ще збігається, але ідентичність пристрою більше не збігається зі схваленим записом
    - спарені записи без активного токена для схваленої ролі
    - спарені токени, чиї scope відхилилися від базового схваленого pairing
    - локальні кешовані записи токенів пристрою для поточної машини, які передують ротації токена на боці gateway або містять застарілі метадані scope

    Doctor не схвалює запити на pairing автоматично й не виконує автоматичну ротацію токенів пристрою. Натомість він виводить точні наступні кроки:

    - переглянути очікувані запити за допомогою `openclaw devices list`
    - схвалити конкретний запит за допомогою `openclaw devices approve <requestId>`
    - виконати ротацію нового токена за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видалити застарілий запис і повторно схвалити його за допомогою `openclaw devices remove <deviceId>`

    Це закриває поширену прогалину «вже спарено, але все ще вимагається pairing»: doctor тепер розрізняє pairing уперше, очікувані підвищення ролі/scope і застаріле розходження токена/ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor видає попередження, коли provider відкритий для DM без allowlist або коли policy налаштовано небезпечним чином.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запущено як користувацька служба systemd, doctor перевіряє, чи ввімкнено linger, щоб gateway залишався активним після виходу з системи.
  </Accordion>
  <Accordion title="11. Стан workspace (Skills, Plugin і застарілі каталоги)">
    Doctor виводить зведення стану workspace для типового agent:

    - **Стан Skills**: кількість доступних, тих, яким бракує вимог, і Skills, заблокованих allowlist.
    - **Застарілі каталоги workspace**: попереджає, коли `~/openclaw` або інші застарілі каталоги workspace існують поруч із поточним workspace.
    - **Стан Plugin**: рахує ввімкнені/вимкнені/помилкові Plugin; перелічує ID Plugin для будь-яких помилок; повідомляє про можливості bundle Plugin.
    - **Попередження про сумісність Plugin**: позначає Plugin, які мають проблеми сумісності з поточним runtime.
    - **Діагностика Plugin**: показує всі попередження або помилки під час завантаження, видані реєстром Plugin.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файлу">
    Doctor перевіряє, чи bootstrap-файли workspace (наприклад, `AGENTS.md`, `CLAUDE.md` або інші впроваджені контекстні файли) наближаються до налаштованого ліміту символів або перевищують його. Він повідомляє для кожного файла кількість необроблених і впроваджених символів, відсоток обрізання, причину обрізання (`max/file` або `max/total`) і загальну кількість впроваджених символів як частку від загального бюджету. Коли файли обрізано або вони близькі до ліміту, doctor виводить поради щодо налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Завершення команд shell">
    Doctor перевіряє, чи встановлено завершення команд табуляцією для поточного shell (zsh, bash, fish або PowerShell):

    - Якщо профіль shell використовує повільний шаблон динамічного завершення (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанта з кешованим файлом.
    - Якщо завершення налаштовано в профілі, але файл кешу відсутній, doctor автоматично відтворює кеш.
    - Якщо завершення взагалі не налаштовано, doctor пропонує встановити його (лише в інтерактивному режимі; пропускається з `--non-interactive`).

    Запустіть `openclaw completion --write-state`, щоб вручну відтворити кеш.

  </Accordion>
  <Accordion title="12. Перевірки auth Gateway (локальний токен)">
    Doctor перевіряє готовність auth локального gateway на основі токена.

    - Якщо для режиму токена потрібен токен і джерело токена відсутнє, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується через SecretRef, але недоступний, doctor попереджає та не перезаписує його звичайним текстом.
    - `openclaw doctor --generate-gateway-token` примусово генерує токен лише тоді, коли не налаштовано токен SecretRef.

  </Accordion>
  <Accordion title="12b. Відновлення в режимі лише читання з урахуванням SecretRef">
    Деякі потоки відновлення потребують перевірки налаштованих облікових даних без послаблення поведінки runtime fail-fast.

    - `openclaw doctor --fix` тепер використовує ту саму модель зведення SecretRef у режимі лише читання, що й команди сімейства status, для цільового відновлення конфігурації.
    - Приклад: відновлення `allowFrom` / `groupAllowFrom` Telegram для `@username` намагається використати налаштовані облікові дані бота, коли вони доступні.
    - Якщо токен бота Telegram налаштовано через SecretRef, але він недоступний у поточному шляху команди, doctor повідомляє, що облікові дані налаштовано, але вони недоступні, і пропускає автоматичне розв’язання замість аварійного завершення або хибного повідомлення про відсутність токена.

  </Accordion>
  <Accordion title="13. Перевірка стану Gateway + перезапуск">
    Doctor виконує перевірку стану системи й пропонує перезапустити gateway, якщо він виглядає нездоровим.
  </Accordion>
  <Accordion title="13b. Готовність пошуку в memory">
    Doctor перевіряє, чи готовий налаштований provider embedding для пошуку в memory для типового agent. Поведінка залежить від налаштованого backend і provider:

    - **QMD backend**: перевіряє, чи доступний і чи може запускатися двійковий файл `qmd`. Якщо ні, виводить вказівки щодо виправлення, зокрема npm-пакет і варіант ручного шляху до двійкового файла.
    - **Явний локальний provider**: перевіряє наявність локального файла model або розпізнаного URL віддаленої/завантажуваної model. Якщо його немає, пропонує перейти на віддалений provider.
    - **Явний віддалений provider** (`openai`, `voyage` тощо): перевіряє, чи є API-ключ у середовищі або сховищі auth. Якщо його немає, виводить практичні підказки щодо виправлення.
    - **Автоматичний provider**: спочатку перевіряє доступність локальної model, а потім пробує кожен віддалений provider у порядку автоматичного вибору.

    Коли доступний результат опитування gateway (gateway був у здоровому стані на момент перевірки), doctor зіставляє його результат із конфігурацією, видимою CLI, і зазначає будь-які розбіжності.

    Використовуйте `openclaw memory status --deep`, щоб перевірити готовність embedding під час runtime.

  </Accordion>
  <Accordion title="14. Попередження про стан channel">
    Якщо gateway у здоровому стані, doctor виконує перевірку стану channel і повідомляє про попередження з рекомендованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит конфігурації supervisor + відновлення">
    Doctor перевіряє встановлену конфігурацію supervisor (launchd/systemd/schtasks) на наявність відсутніх або застарілих типових значень (наприклад, залежностей systemd network-online і затримки перезапуску). Коли він знаходить невідповідність, то рекомендує оновлення й може переписати файл служби/завдання відповідно до поточних типових значень.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед переписуванням конфігурації supervisor.
    - `openclaw doctor --yes` приймає типові запити на відновлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує користувацькі конфігурації supervisor.
    - Якщо auth токена потребує токен, а `gateway.auth.token` керується через SecretRef, під час встановлення/відновлення служби doctor перевіряє SecretRef, але не зберігає розв’язане значення токена у відкритому вигляді в метаданих середовища служби supervisor.
    - Якщо auth токена потребує токен, а налаштований токен SecretRef не розв’язується, doctor блокує шлях встановлення/відновлення з практичними вказівками.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, але `gateway.auth.mode` не задано, doctor блокує встановлення/відновлення, доки режим не буде явно задано.
    - Для користувацьких systemd-модулів Linux перевірки розходження токенів doctor тепер охоплюють і джерела `Environment=`, і `EnvironmentFile=` під час порівняння метаданих auth служби.
    - Відновлення служб doctor відмовляється переписувати, зупиняти або перезапускати службу gateway зі старішого двійкового файла OpenClaw, якщо конфігурацію востаннє записано новішою версією. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повне переписування через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика runtime Gateway + порту">
    Doctor перевіряє runtime служби (PID, останній статус завершення) і попереджає, коли службу встановлено, але фактично вона не працює. Він також перевіряє конфлікти портів на порту gateway (типово `18789`) і повідомляє ймовірні причини (gateway уже запущено, SSH-тунель).
  </Accordion>
  <Accordion title="17. Рекомендовані практики runtime Gateway">
    Doctor попереджає, коли служба gateway працює на Bun або на шляху Node, керованому менеджером версій (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram потребують Node, а шляхи менеджера версій можуть ламатися після оновлень, оскільки служба не завантажує ініціалізацію вашого shell. Doctor пропонує мігрувати на системну інсталяцію Node, якщо вона доступна (Homebrew/apt/choco).
  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані майстра">
    Doctor зберігає всі зміни конфігурації та ставить метадані майстра, щоб зафіксувати запуск doctor.
  </Accordion>
  <Accordion title="19. Поради щодо workspace (резервне копіювання + система memory)">
    Doctor пропонує систему memory для workspace, якщо вона відсутня, і виводить пораду щодо резервного копіювання, якщо workspace ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace) для повного посібника зі структури workspace та резервного копіювання через git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Runbook Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
