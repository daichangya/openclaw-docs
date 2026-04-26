---
read_when:
    - Додавання або змінення міграцій doctor
    - Упровадження несумісних змін конфігурації
sidebarTitle: Doctor
summary: 'Команда doctor: перевірки стану, міграції конфігурації та кроки відновлення'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T07:00:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4224459d9b052abc82ed32547e146686b777652fe304f850243cd3fcceae263b
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` — це інструмент відновлення + міграції для OpenClaw. Він виправляє застарілий конфіг/стан, перевіряє працездатність і надає практичні кроки відновлення.

## Швидкий старт

```bash
openclaw doctor
```

### Режими headless і автоматизації

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Приймає типові значення без запитів (зокрема кроки відновлення restart/service/sandbox, якщо застосовно).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Застосовує рекомендовані відновлення без запитів (відновлення + restart, де це безпечно).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Також застосовує агресивні відновлення (перезаписує користувацькі конфігурації supervisor).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Запускається без запитів і застосовує лише безпечні міграції (нормалізація конфігурації + переміщення стану на диску). Пропускає дії restart/service/sandbox, які потребують підтвердження людини. Міграції застарілого стану виконуються автоматично, коли їх виявлено.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Сканує системні service на наявність додаткових встановлень Gateway (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Якщо ви хочете переглянути зміни перед записом, спочатку відкрийте файл конфігурації:

```bash
cat ~/.openclaw/openclaw.json
```

## Що він робить (коротко)

<AccordionGroup>
  <Accordion title="Стан, UI та оновлення">
    - Необов’язкове попереднє оновлення для git-встановлень (лише в інтерактивному режимі).
    - Перевірка актуальності протоколу UI (перезбирає Control UI, коли схема протоколу новіша).
    - Перевірка стану + запит на restart.
    - Підсумок стану Skills (доступні/відсутні/заблоковані) і стан plugin.
  </Accordion>
  <Accordion title="Конфігурація та міграції">
    - Нормалізація конфігурації для застарілих значень.
    - Міграція конфігурації Talk із застарілих плоских полів `talk.*` до `talk.provider` + `talk.providers.<provider>`.
    - Перевірки міграції browser для застарілих конфігурацій розширення Chrome та готовності Chrome MCP.
    - Попередження про перевизначення провайдера OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Попередження про затінення OAuth Codex (`models.providers.openai-codex`).
    - Перевірка передумов TLS для профілів OAuth OpenAI Codex.
    - Міграція застарілого стану на диску (sessions/каталог агента/автентифікація WhatsApp).
    - Міграція ключів контракту маніфесту застарілого plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Міграція сховища застарілого Cron (`jobId`, `schedule.cron`, поля delivery/payload верхнього рівня, payload `provider`, прості резервні jobs Webhook із `notify: true`).
  </Accordion>
  <Accordion title="Стан і цілісність">
    - Перевірка файлів блокування сесій і очищення застарілих блокувань.
    - Відновлення транскриптів сесій для дубльованих гілок переписування prompt, створених у вразливих збірках 2026.4.24.
    - Перевірки цілісності стану та прав доступу (sessions, transcripts, каталог state).
    - Перевірки прав доступу до файла конфігурації (`chmod 600`) під час локального запуску.
    - Стан автентифікації моделі: перевіряє термін дії OAuth, може оновлювати токени, термін дії яких спливає, і повідомляє про стани cooldown/disabled профілю автентифікації.
    - Виявлення додаткового каталогу робочого простору (`~/openclaw`).
  </Accordion>
  <Accordion title="Gateway, service та supervisor">
    - Відновлення образу sandbox, коли sandboxing увімкнено.
    - Міграція застарілих service і виявлення додаткових Gateway.
    - Міграція застарілого стану каналу Matrix (у режимі `--fix` / `--repair`).
    - Перевірки runtime Gateway (service встановлено, але не запущено; кешований label launchd).
    - Попередження про стан каналу (визначаються через запущений Gateway).
    - Аудит конфігурації supervisor (launchd/systemd/schtasks) з необов’язковим відновленням.
    - Перевірки найкращих практик runtime Gateway (Node проти Bun, шляхи менеджера версій).
    - Діагностика конфліктів порту Gateway (типово `18789`).
  </Accordion>
  <Accordion title="Автентифікація, безпека та pairing">
    - Попередження безпеки для відкритих політик DM.
    - Перевірки автентифікації Gateway для режиму локального токена (пропонує генерацію токена, коли немає джерела токена; не перезаписує конфігурації token SecretRef).
    - Виявлення проблем із pairing пристроїв (очікувані перші запити pairing, очікувані оновлення role/scope, застарілий дрейф локального кешу токенів пристрою та дрейф автентифікації paired-record).
  </Accordion>
  <Accordion title="Робочий простір і shell">
    - Перевірка systemd linger у Linux.
    - Перевірка розміру bootstrap-файла робочого простору (попередження про обрізання/наближення до ліміту для файлів контексту).
    - Перевірка стану shell completion та автоматичне встановлення/оновлення.
    - Перевірка готовності провайдера embedding для пошуку в пам’яті (локальна модель, віддалений API key або двійковий файл QMD).
    - Перевірки source-встановлення (невідповідність робочого простору pnpm, відсутні assets UI, відсутній двійковий файл tsx).
    - Записує оновлену конфігурацію + метадані wizard.
  </Accordion>
</AccordionGroup>

## Backfill і скидання в UI Dreams

Сцена Dreams у Control UI містить дії **Backfill**, **Reset** і **Clear Grounded** для workflow grounded dreaming. Ці дії використовують RPC-методи в стилі doctor Gateway, але вони **не** є частиною відновлення/міграції CLI `openclaw doctor`.

Що вони роблять:

- **Backfill** сканує історичні файли `memory/YYYY-MM-DD.md` в активному робочому просторі, запускає прохід grounded REM diary і записує оборотні записи backfill у `DREAMS.md`.
- **Reset** видаляє з `DREAMS.md` лише ті записи щоденника backfill, які позначені відповідним чином.
- **Clear Grounded** видаляє лише staged короткострокові записи, що є тільки grounded, які надійшли з історичного відтворення і ще не накопичили живого recall або щоденної підтримки.

Чого вони самі по собі **не** роблять:

- вони не редагують `MEMORY.md`
- вони не запускають повні міграції doctor
- вони не переводять автоматично grounded кандидатів до live short-term promotion store, якщо ви явно не запустите спочатку staged CLI path

Якщо ви хочете, щоб grounded історичне відтворення впливало на звичайний lane глибокого просування, натомість використовуйте flow CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Це переводить grounded durable кандидатів до short-term dreaming store, зберігаючи `DREAMS.md` як поверхню перегляду.

## Докладна поведінка та обґрунтування

<AccordionGroup>
  <Accordion title="0. Необов’язкове оновлення (git-встановлення)">
    Якщо це git checkout і doctor запущено в інтерактивному режимі, він пропонує оновити (fetch/rebase/build) перед запуском doctor.
  </Accordion>
  <Accordion title="1. Нормалізація конфігурації">
    Якщо конфігурація містить застарілі форми значень (наприклад, `messages.ackReaction` без перевизначення для конкретного каналу), doctor нормалізує їх до поточної схеми.

    Це також включає застарілі плоскі поля Talk. Поточна публічна конфігурація Talk — це `talk.provider` + `talk.providers.<provider>`. Doctor переписує старі форми `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` у мапу провайдерів.

  </Accordion>
  <Accordion title="2. Міграції ключів застарілої конфігурації">
    Коли конфігурація містить застарілі ключі, інші команди відмовляються запускатися і просять виконати `openclaw doctor`.

    Doctor виконає такі дії:

    - Пояснить, які застарілі ключі знайдено.
    - Покаже застосовану міграцію.
    - Перезапише `~/.openclaw/openclaw.json` оновленою схемою.

    Gateway також автоматично запускає міграції doctor під час старту, коли виявляє застарілий формат конфігурації, тож застарілі конфігурації виправляються без ручного втручання. Міграції сховища jobs Cron обробляються через `openclaw doctor --fix`.

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
    - Для каналів з іменованими `accounts`, але зі старими значеннями каналу верхнього рівня для одного account, перенести ці значення на рівень account до вибраного promoted account для цього каналу (`accounts.default` для більшості каналів; Matrix може зберігати наявну відповідну іменовану/default ціль)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - видалення `browser.relayBindHost` (застаріле налаштування relay розширення)

    Попередження doctor також містять вказівки щодо типового account для каналів із кількома account:

    - Якщо налаштовано два або більше записів `channels.<channel>.accounts` без `channels.<channel>.defaultAccount` або `accounts.default`, doctor попереджає, що fallback routing може вибрати неочікуваний account.
    - Якщо `channels.<channel>.defaultAccount` установлено на невідомий ID account, doctor попереджає про це і перелічує налаштовані ID account.

  </Accordion>
  <Accordion title="2b. Перевизначення провайдера OpenCode">
    Якщо ви вручну додали `models.providers.opencode`, `opencode-zen` або `opencode-go`, це перевизначає вбудований каталог OpenCode з `@mariozechner/pi-ai`. Це може примусово спрямувати моделі на неправильний API або обнулити вартість. Doctor попереджає про це, щоб ви могли видалити перевизначення і відновити маршрутизацію API та вартість для кожної моделі.
  </Accordion>
  <Accordion title="2c. Міграція browser і готовність Chrome MCP">
    Якщо ваша конфігурація browser іще вказує на вилучений шлях розширення Chrome, doctor нормалізує її до поточної моделі підключення host-local Chrome MCP:

    - `browser.profiles.*.driver: "extension"` стає `"existing-session"`
    - `browser.relayBindHost` видаляється

    Doctor також перевіряє шлях host-local Chrome MCP, коли ви використовуєте `defaultProfile: "user"` або налаштований профіль `existing-session`:

    - перевіряє, чи встановлено Google Chrome на тому самому хості для типових профілів автоматичного підключення
    - перевіряє виявлену версію Chrome і попереджає, якщо вона нижча за Chrome 144
    - нагадує ввімкнути remote debugging на сторінці inspect браузера (наприклад, `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` або `edge://inspect/#remote-debugging`)

    Doctor не може ввімкнути цей параметр на боці Chrome за вас. Host-local Chrome MCP, як і раніше, потребує:

    - браузер на основі Chromium 144+ на хості gateway/node
    - браузер, запущений локально
    - увімкнений remote debugging у цьому браузері
    - підтвердження першого запиту згоди на attach у браузері

    Готовність тут стосується лише локальних передумов attach. Existing-session зберігає поточні обмеження маршруту Chrome MCP; розширені маршрути, як-от `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії, як і раніше, потребують керованого browser або сирого профілю CDP.

    Ця перевірка **не** застосовується до Docker, sandbox, remote-browser або інших headless flow. Вони й надалі використовують сирий CDP.

  </Accordion>
  <Accordion title="2d. Передумови OAuth TLS">
    Коли налаштовано профіль OAuth OpenAI Codex, doctor перевіряє endpoint авторизації OpenAI, щоб упевнитися, що локальний стек TLS Node/OpenSSL може валідувати ланцюжок сертифікатів. Якщо перевірка завершується помилкою сертифіката (наприклад, `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, прострочений сертифікат або самопідписаний сертифікат), doctor виводить вказівки щодо виправлення для конкретної платформи. На macOS з Homebrew Node виправлення зазвичай таке: `brew postinstall ca-certificates`. Із `--deep` перевірка виконується, навіть якщо Gateway працездатний.
  </Accordion>
  <Accordion title="2e. Перевизначення провайдера OAuth Codex">
    Якщо ви раніше додали застарілі налаштування транспорту OpenAI в `models.providers.openai-codex`, вони можуть затіняти вбудований шлях провайдера OAuth Codex, який новіші випуски використовують автоматично. Doctor попереджає, коли бачить ці старі налаштування транспорту поряд з OAuth Codex, щоб ви могли видалити або переписати застаріле перевизначення транспорту й повернути вбудовану поведінку маршрутизації/fallback. Користувацькі proxy та перевизначення лише заголовків, як і раніше, підтримуються та не викликають цього попередження.
  </Accordion>
  <Accordion title="2f. Попередження про маршрути plugin Codex">
    Коли увімкнено вбудований plugin Codex, doctor також перевіряє, чи первинні посилання на модель `openai-codex/*` усе ще визначаються через типовий runner PI. Це поєднання є коректним, якщо ви хочете автентифікацію Codex OAuth/підписки через PI, але його легко сплутати з нативною app-server обв’язкою Codex. Doctor попереджає про це й указує на явну форму app-server: `openai/*` плюс `embeddedHarness.runtime: "codex"` або `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor не виправляє це автоматично, оскільки обидва маршрути є коректними:

    - `openai-codex/*` + PI означає «використовувати автентифікацію Codex OAuth/підписки через звичайний runner OpenClaw».
    - `openai/*` + `runtime: "codex"` означає «запускати вбудований хід через нативний app-server Codex».
    - `/codex ...` означає «керувати нативною розмовою Codex з чату або прив’язати її».
    - `/acp ...` або `runtime: "acp"` означає «використовувати зовнішній адаптер ACP/acpx».

    Якщо з’являється це попередження, виберіть маршрут, який ви мали на увазі, і відредагуйте конфігурацію вручну. Залишайте попередження без змін, якщо PI Codex OAuth є навмисним.

  </Accordion>
  <Accordion title="3. Міграції застарілого стану (структура на диску)">
    Doctor може переносити старіші структури на диску до поточної структури:

    - Сховище sessions + transcripts:
      - з `~/.openclaw/sessions/` до `~/.openclaw/agents/<agentId>/sessions/`
    - Каталог агента:
      - з `~/.openclaw/agent/` до `~/.openclaw/agents/<agentId>/agent/`
    - Стан автентифікації WhatsApp (Baileys):
      - зі застарілого `~/.openclaw/credentials/*.json` (крім `oauth.json`)
      - до `~/.openclaw/credentials/whatsapp/<accountId>/...` (типовий ID account: `default`)

    Ці міграції виконуються за принципом best-effort та є ідемпотентними; doctor виводить попередження, якщо залишає будь-які застарілі каталоги як резервні копії. Gateway/CLI також автоматично мігрує застарілі sessions + каталог агента під час старту, щоб history/auth/models потрапляли до шляху для конкретного агента без ручного запуску doctor. Автентифікація WhatsApp навмисно мігрується лише через `openclaw doctor`. Нормалізація provider/provider-map для Talk тепер порівнює за структурною рівністю, тому відмінності лише в порядку ключів більше не спричиняють повторних no-op змін `doctor --fix`.

  </Accordion>
  <Accordion title="3a. Міграції маніфестів застарілих plugin">
    Doctor сканує всі встановлені маніфести plugin на наявність застарілих ключів можливостей верхнього рівня (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Якщо їх знайдено, він пропонує перемістити їх до об’єкта `contracts` і переписати файл маніфесту на місці. Ця міграція ідемпотентна; якщо ключ `contracts` уже містить ті самі значення, застарілий ключ видаляється без дублювання даних.
  </Accordion>
  <Accordion title="3b. Міграції застарілого сховища Cron">
    Doctor також перевіряє сховище jobs Cron (`~/.openclaw/cron/jobs.json` типово або `cron.store`, якщо його перевизначено) на наявність старих форм jobs, які планувальник усе ще приймає для сумісності.

    Поточні очищення Cron включають:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - поля payload верхнього рівня (`message`, `model`, `thinking`, ...) → `payload`
    - поля delivery верхнього рівня (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - псевдоніми delivery `provider` у payload → явний `delivery.channel`
    - прості застарілі резервні jobs Webhook з `notify: true` → явний `delivery.mode="webhook"` з `delivery.to=cron.webhook`

    Doctor автоматично мігрує jobs `notify: true` лише тоді, коли це можна зробити без зміни поведінки. Якщо job поєднує застарілий резервний notify з наявним режимом delivery, відмінним від webhook, doctor попереджає й залишає такий job для ручної перевірки.

  </Accordion>
  <Accordion title="3c. Очищення блокувань сесій">
    Doctor сканує каталог кожної сесії агента на наявність застарілих файлів блокування запису — файлів, що залишилися після аварійного завершення сесії. Для кожного знайденого файла блокування він повідомляє: шлях, PID, чи PID іще активний, вік блокування та чи вважається воно застарілим (PID неактивний або старший за 30 хвилин). У режимі `--fix` / `--repair` він автоматично видаляє застарілі файли блокування; інакше виводить примітку та пропонує повторити запуск із `--fix`.
  </Accordion>
  <Accordion title="3d. Відновлення гілок транскриптів сесій">
    Doctor сканує файли JSONL сесій агентів на дубльовану форму гілок, створену помилкою переписування транскрипту prompt у версії 2026.4.24: покинутий user turn із внутрішнім runtime-контекстом OpenClaw плюс активний sibling з тим самим видимим prompt користувача. У режимі `--fix` / `--repair` doctor створює резервну копію кожного ураженого файла поруч з оригіналом і переписує транскрипт на активну гілку, щоб history Gateway та читачі пам’яті більше не бачили дубльованих ходів.
  </Accordion>
  <Accordion title="4. Перевірки цілісності стану (збереження сесій, маршрутизація та безпека)">
    Каталог стану — це операційний стовбур мозку. Якщо він зникне, ви втратите sessions, credentials, logs і config (якщо не маєте резервних копій деінде).

    Doctor перевіряє:

    - **Каталог state відсутній**: попереджає про катастрофічну втрату стану, пропонує повторно створити каталог і нагадує, що не може відновити відсутні дані.
    - **Права доступу до каталогу state**: перевіряє можливість запису; пропонує виправити права доступу (і виводить підказку `chown`, якщо виявлено невідповідність власника/групи).
    - **Каталог state у macOS, що синхронізується з хмарою**: попереджає, коли state визначається в iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) або `~/Library/CloudStorage/...`, оскільки шляхи з підтримкою синхронізації можуть спричиняти повільніший I/O і гонки блокування/синхронізації.
    - **Каталог state у Linux на SD або eMMC**: попереджає, коли state визначається до джерела монтування `mmcblk*`, оскільки випадковий I/O на SD або eMMC може бути повільнішим і швидше зношувати носій під час запису сесій і credentials.
    - **Каталоги sessions відсутні**: `sessions/` і каталог сховища сесій потрібні для збереження history та уникнення збоїв `ENOENT`.
    - **Невідповідність transcript**: попереджає, коли нещодавні записи сесій мають відсутні файли transcript.
    - **Основна сесія "1-line JSONL"**: позначає ситуацію, коли основний transcript має лише один рядок (history не накопичується).
    - **Кілька каталогів state**: попереджає, коли існує кілька каталогів `~/.openclaw` у різних домашніх каталогах або коли `OPENCLAW_STATE_DIR` указує в інше місце (history може розділятися між встановленнями).
    - **Нагадування про remote mode**: якщо `gateway.mode=remote`, doctor нагадує запускати його на віддаленому хості (саме там живе state).
    - **Права доступу до файла конфігурації**: попереджає, якщо `~/.openclaw/openclaw.json` доступний для читання групою/усіма, і пропонує обмежити права до `600`.

  </Accordion>
  <Accordion title="5. Стан автентифікації моделі (строк дії OAuth)">
    Doctor перевіряє профілі OAuth у сховищі автентифікації, попереджає, коли токени ось-ось спливуть або вже спливли, і може оновити їх, коли це безпечно. Якщо профіль OAuth/token Anthropic застарів, він пропонує API key Anthropic або шлях setup-token Anthropic. Запити на оновлення з’являються лише в інтерактивному режимі (TTY); `--non-interactive` пропускає спроби оновлення.

    Коли оновлення OAuth остаточно не вдається (наприклад, `refresh_token_reused`, `invalid_grant` або провайдер повідомляє, що потрібно знову ввійти), doctor повідомляє, що потрібна повторна автентифікація, і виводить точну команду `openclaw models auth login --provider ...`, яку треба виконати.

    Doctor також повідомляє про профілі автентифікації, які тимчасово непридатні до використання через:

    - короткі cooldown (обмеження швидкості/таймаути/помилки автентифікації)
    - довші вимкнення (помилки billing/credit)

  </Accordion>
  <Accordion title="6. Валідація моделі hooks">
    Якщо встановлено `hooks.gmail.model`, doctor перевіряє посилання на модель за каталогом і allowlist та попереджає, коли її не вдається визначити або вона заборонена.
  </Accordion>
  <Accordion title="7. Відновлення образу sandbox">
    Коли sandboxing увімкнено, doctor перевіряє образи Docker і пропонує зібрати їх або переключитися на застарілі назви, якщо поточний образ відсутній.
  </Accordion>
  <Accordion title="7b. Runtime-залежності вбудованих plugin">
    Doctor перевіряє runtime-залежності лише для тих вбудованих plugin, які активні в поточній конфігурації або увімкнені типовим значенням у своєму вбудованому маніфесті, наприклад `plugins.entries.discord.enabled: true`, застаріле `channels.discord.enabled: true` або типово увімкнений вбудований provider. Якщо чогось бракує, doctor повідомляє про пакунки й встановлює їх у режимі `openclaw doctor --fix` / `openclaw doctor --repair`. Зовнішні plugins, як і раніше, використовують `openclaw plugins install` / `openclaw plugins update`; doctor не встановлює залежності для довільних шляхів plugin.

    Gateway і локальний CLI також можуть за потреби відновлювати runtime-залежності активних вбудованих plugin перед імпортом такого plugin. Ці встановлення обмежуються коренем встановлення runtime plugin, виконуються з вимкненими scripts, не записують package lock і захищені блокуванням кореня встановлення, щоб одночасні запуски CLI або Gateway не змінювали те саме дерево `node_modules` одночасно.

  </Accordion>
  <Accordion title="8. Міграції service Gateway і підказки з очищення">
    Doctor виявляє застарілі service Gateway (launchd/systemd/schtasks) і пропонує видалити їх та встановити service OpenClaw з використанням поточного порту Gateway. Він також може сканувати додаткові service, схожі на gateway, і виводити підказки з очищення. Іменовані за профілем service Gateway OpenClaw вважаються повноцінними й не позначаються як «додаткові».
  </Accordion>
  <Accordion title="8b. Стартова міграція Matrix">
    Коли account каналу Matrix має очікувану або доступну для виконання міграцію застарілого стану, doctor (у режимі `--fix` / `--repair`) створює знімок стану до міграції, а потім виконує кроки міграції за принципом best-effort: міграцію застарілого стану Matrix і підготовку застарілого зашифрованого стану. Обидва кроки не є фатальними; помилки записуються в журнал, а запуск триває. У режимі лише читання (`openclaw doctor` без `--fix`) ця перевірка повністю пропускається.
  </Accordion>
  <Accordion title="8c. Pairing пристроїв і дрейф автентифікації">
    Тепер doctor перевіряє стан pairing пристроїв як частину звичайної перевірки працездатності.

    Про що він повідомляє:

    - очікувані запити на перший pairing
    - очікувані оновлення ролей для вже paired пристроїв
    - очікувані оновлення scope для вже paired пристроїв
    - відновлення невідповідності public key, коли ID пристрою все ще збігається, але ідентичність пристрою більше не збігається зі схваленим записом
    - paired записи без активного токена для схваленої ролі
    - paired токени, чиї scope відхилилися від базового схваленого pairing
    - локальні кешовані записи токенів пристрою для поточної машини, які передують ротації токена на боці gateway або містять застарілі метадані scope

    Doctor не схвалює запити на pairing автоматично й не виконує автоматичну ротацію токенів пристрою. Натомість він виводить точні наступні кроки:

    - переглянути очікувані запити за допомогою `openclaw devices list`
    - схвалити точний запит за допомогою `openclaw devices approve <requestId>`
    - виконати ротацію нового токена за допомогою `openclaw devices rotate --device <deviceId> --role <role>`
    - видалити та повторно схвалити застарілий запис за допомогою `openclaw devices remove <deviceId>`

    Це закриває поширену прогалину «вже paired, але все ще з’являється pairing required»: тепер doctor розрізняє перший pairing, очікувані оновлення role/scope та дрейф застарілого токена/ідентичності пристрою.

  </Accordion>
  <Accordion title="9. Попередження безпеки">
    Doctor виводить попередження, коли provider відкритий для DM без allowlist або коли політику налаштовано небезпечним чином.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Якщо запуск відбувається як user service systemd, doctor переконується, що linger увімкнено, щоб gateway залишався активним після виходу з системи.
  </Accordion>
  <Accordion title="11. Стан робочого простору (skills, plugins і застарілі каталоги)">
    Doctor виводить підсумок стану робочого простору для типового агента:

    - **Стан Skills**: кількість доступних, таких, що мають відсутні вимоги, і заблокованих allowlist Skills.
    - **Застарілі каталоги робочого простору**: попереджає, коли `~/openclaw` або інші застарілі каталоги робочого простору існують поряд із поточним робочим простором.
    - **Стан plugin**: підраховує увімкнені/вимкнені/plugins з помилками; перелічує ID plugin для всіх помилок; повідомляє про можливості bundle plugin.
    - **Попередження сумісності plugin**: позначає plugins, які мають проблеми сумісності з поточним runtime.
    - **Діагностика plugin**: показує всі попередження або помилки під час завантаження, які видав реєстр plugin.

  </Accordion>
  <Accordion title="11b. Розмір bootstrap-файла">
    Doctor перевіряє, чи наближаються bootstrap-файли робочого простору (наприклад, `AGENTS.md`, `CLAUDE.md` або інші інжектовані файли контексту) до налаштованого бюджету символів або перевищують його. Він повідомляє для кожного файла кількість сирих та інжектованих символів, відсоток обрізання, причину обрізання (`max/file` або `max/total`) і загальну кількість інжектованих символів як частку від загального бюджету. Коли файли обрізаються або наближаються до ліміту, doctor виводить поради щодо налаштування `agents.defaults.bootstrapMaxChars` і `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor перевіряє, чи встановлено tab completion для поточного shell (zsh, bash, fish або PowerShell):

    - Якщо профіль shell використовує повільний динамічний шаблон completion (`source <(openclaw completion ...)`), doctor оновлює його до швидшого варіанта з кешованим файлом.
    - Якщо completion налаштовано в профілі, але кешований файл відсутній, doctor автоматично повторно генерує кеш.
    - Якщо completion взагалі не налаштовано, doctor пропонує встановити його (лише в інтерактивному режимі; пропускається з `--non-interactive`).

    Виконайте `openclaw completion --write-state`, щоб повторно згенерувати кеш вручну.

  </Accordion>
  <Accordion title="12. Перевірки автентифікації Gateway (локальний токен)">
    Doctor перевіряє готовність локальної автентифікації токеном Gateway.

    - Якщо режим токена потребує токен, а джерело токена відсутнє, doctor пропонує згенерувати його.
    - Якщо `gateway.auth.token` керується через SecretRef, але недоступний, doctor попереджає і не перезаписує його відкритим текстом.
    - `openclaw doctor --generate-gateway-token` примусово генерує токен лише тоді, коли не налаштовано token SecretRef.

  </Accordion>
  <Accordion title="12b. Відновлення з урахуванням SecretRef у режимі лише читання">
    Деякі сценарії відновлення мають перевіряти налаштовані credentials, не послаблюючи поведінку runtime fail-fast.

    - `openclaw doctor --fix` тепер використовує ту саму модель зведення SecretRef лише для читання, що й команди сімейства status, для цільового відновлення конфігурації.
    - Приклад: відновлення `allowFrom` / `groupAllowFrom` `@username` у Telegram намагається використовувати налаштовані credentials бота, коли вони доступні.
    - Якщо токен бота Telegram налаштовано через SecretRef, але він недоступний у поточному шляху команди, doctor повідомляє, що credential налаштовано, але він недоступний, і пропускає автоматичне визначення замість аварійного завершення або хибного повідомлення про відсутність токена.

  </Accordion>
  <Accordion title="13. Перевірка працездатності Gateway + restart">
    Doctor виконує перевірку працездатності та пропонує restart gateway, якщо той виглядає непрацездатним.
  </Accordion>
  <Accordion title="13b. Готовність пошуку в пам’яті">
    Doctor перевіряє, чи готовий налаштований provider embedding для пошуку в пам’яті для типового агента. Поведінка залежить від налаштованого backend і provider:

    - **QMD backend**: перевіряє, чи доступний двійковий файл `qmd` і чи його можна запустити. Якщо ні, виводить вказівки щодо виправлення, зокрема npm-пакунок і варіант ручного шляху до двійкового файла.
    - **Явний локальний provider**: перевіряє наявність локального файла моделі або розпізнаної URL локальної/віддаленої моделі, яку можна завантажити. Якщо модель відсутня, пропонує переключитися на віддалений provider.
    - **Явний віддалений provider** (`openai`, `voyage` тощо): перевіряє, чи наявний API key у середовищі або сховищі автентифікації. Якщо його немає, виводить практичні підказки щодо виправлення.
    - **Автоматичний provider**: спочатку перевіряє доступність локальної моделі, а потім пробує кожен віддалений provider у порядку автоматичного вибору.

    Коли доступний результат перевірки через gateway probe (gateway був працездатним на момент перевірки), doctor звіряє цей результат із конфігурацією, видимою CLI, і зазначає будь-яку невідповідність.

    Використовуйте `openclaw memory status --deep`, щоб перевірити готовність embedding під час runtime.

  </Accordion>
  <Accordion title="14. Попередження про стан каналу">
    Якщо gateway працездатний, doctor виконує перевірку стану каналу й повідомляє попередження разом із пропонованими виправленнями.
  </Accordion>
  <Accordion title="15. Аудит конфігурації supervisor + відновлення">
    Doctor перевіряє встановлену конфігурацію supervisor (launchd/systemd/schtasks) на відсутні або застарілі типові значення (наприклад, залежності systemd від network-online і затримку restart). Коли він виявляє невідповідність, то рекомендує оновлення й може переписати service file/task на поточні типові значення.

    Примітки:

    - `openclaw doctor` запитує підтвердження перед переписуванням конфігурації supervisor.
    - `openclaw doctor --yes` приймає типові запити на відновлення.
    - `openclaw doctor --repair` застосовує рекомендовані виправлення без запитів.
    - `openclaw doctor --repair --force` перезаписує користувацькі конфігурації supervisor.
    - Якщо автентифікація токеном потребує токен і `gateway.auth.token` керується через SecretRef, doctor під час встановлення/відновлення service перевіряє SecretRef, але не зберігає визначені значення токена у відкритому тексті в метаданих середовища service supervisor.
    - Якщо автентифікація токеном потребує токен, а налаштований token SecretRef не визначено, doctor блокує шлях встановлення/відновлення service і виводить практичні вказівки.
    - Якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, doctor блокує встановлення/відновлення, доки режим явно не буде встановлено.
    - Для unit user-systemd у Linux перевірки дрейфу токена в doctor тепер включають джерела і `Environment=`, і `EnvironmentFile=` під час порівняння метаданих автентифікації service.
    - Відновлення service у doctor відмовляється переписувати, зупиняти або перезапускати service gateway зі старішого двійкового файла OpenClaw, якщо конфігурацію востаннє записано новішою версією. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Ви завжди можете примусово виконати повне переписування через `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Діагностика runtime Gateway + порту">
    Doctor перевіряє runtime service (PID, останній статус виходу) і попереджає, коли service встановлено, але фактично не запущено. Він також перевіряє конфлікти портів на порту gateway (типово `18789`) і повідомляє ймовірні причини (gateway уже запущено, тунель SSH).
  </Accordion>
  <Accordion title="17. Найкращі практики runtime Gateway">
    Doctor попереджає, коли service gateway працює на Bun або через шлях Node, керований менеджером версій (`nvm`, `fnm`, `volta`, `asdf` тощо). Канали WhatsApp + Telegram потребують Node, а шляхи менеджера версій можуть ламатися після оновлень, оскільки service не завантажує ініціалізацію вашого shell. Doctor пропонує перейти на системне встановлення Node, якщо воно доступне (Homebrew/apt/choco).
  </Accordion>
  <Accordion title="18. Запис конфігурації + метадані wizard">
    Doctor зберігає всі зміни конфігурації та проставляє метадані wizard для фіксації запуску doctor.
  </Accordion>
  <Accordion title="19. Поради щодо робочого простору (резервне копіювання + система пам’яті)">
    Doctor пропонує систему пам’яті робочого простору, якщо вона відсутня, і виводить пораду щодо резервного копіювання, якщо робочий простір ще не перебуває під git.

    Див. [/concepts/agent-workspace](/uk/concepts/agent-workspace), щоб ознайомитися з повним посібником зі структури робочого простору та резервного копіювання через git (рекомендовано приватний GitHub або GitLab).

  </Accordion>
</AccordionGroup>

## Пов’язані

- [Інструкція з експлуатації Gateway](/uk/gateway)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
