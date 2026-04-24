---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або роботи під час виконання
    - Первинне опрацювання проблем, про які повідомили користувачі, перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-24T04:14:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd0e951ed4accd924b94d6aa2963547e06b6961c7c3c98563397a9b6d36e4979
    source_path: help/faq.md
    workflow: 15
---

Короткі відповіді плюс глибше усунення проблем для реальних сценаріїв налаштування (локальна розробка, VPS, multi-agent, OAuth/API keys, model failover). Для діагностики під час виконання див. [Troubleshooting](/uk/gateway/troubleshooting). Для повної довідки з конфігурації див. [Configuration](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламалося

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидке локальне зведення: ОС + оновлення, доступність gateway/service, agents/sessions, конфігурація провайдера + проблеми під час виконання (коли gateway доступний).

2. **Звіт, який можна вставити (безпечний для поширення)**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з хвостом логів (токени замасковано).

3. **Стан daemon + порту**

   ```bash
   openclaw gateway status
   ```

   Показує середовище виконання supervisor порівняно з доступністю RPC, цільовий URL перевірки та те, яку конфігурацію сервіс, імовірно, використовував.

4. **Глибокі перевірки**

   ```bash
   openclaw status --deep
   ```

   Запускає живу перевірку стану gateway, зокрема перевірки каналів, коли це підтримується
   (потрібен доступний gateway). Див. [Health](/uk/gateway/health).

5. **Перегляньте останній лог у реальному часі**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використовуйте натомість:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові логи відокремлені від логів сервісу; див. [Logging](/uk/logging) і [Troubleshooting](/uk/gateway/troubleshooting).

6. **Запустіть doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує конфігурацію/стан + запускає перевірки стану. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # показує цільовий URL + шлях до конфігурації у разі помилок
   ```

   Запитує в запущеного gateway повний знімок (лише WS). Див. [Health](/uk/gateway/health).

## Швидкий старт і початкове налаштування

Q&A для першого запуску — встановлення, онбординг, маршрути автентифікації, підписки, початкові
збої — перенесено на окрему сторінку:
[FAQ — швидкий старт і початкове налаштування](/uk/help/faq-first-run).

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw, в одному абзаці?">
    OpenClaw — це персональний AI-асистент, який ви запускаєте на власних пристроях. Він відповідає у вже знайомих вам середовищах обміну повідомленнями (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat і вбудовані channel Plugins, такі як QQ Bot), а також може працювати з voice + живим Canvas на підтримуваних платформах. **Gateway** — це завжди активна control plane; асистент і є продуктом.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не «просто обгортка над Claude». Це **local-first control plane**, яка дає змогу запускати
    потужного асистента на **вашому власному обладнанні**, доступного з уже звичних вам чат-застосунків, із
    сесійним станом, пам’яттю та інструментами — без передачі контролю над вашими робочими процесами
    хостинговому SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і зберігайте
      робочий простір + історію сесій локально.
    - **Реальні канали, а не веб-пісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      плюс мобільний voice і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо, з маршрутизацією
      і failover на рівні agent.
    - **Лише локальний варіант:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо ви цього хочете.
    - **Маршрутизація multi-agent:** окремі agents для кожного каналу, облікового запису або завдання, кожен зі своїм
      робочим простором і типовими значеннями.
    - **Відкритий код і гнучкість для змін:** перевіряйте, розширюйте та self-host без прив’язки до постачальника.

    Документація: [Gateway](/uk/gateway), [Channels](/uk/channels), [Multi-agent](/uk/concepts/multi-agent),
    [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував — що мені зробити спочатку?">
    Хороші перші проєкти:

    - Створити вебсайт (WordPress, Shopify або простий статичний сайт).
    - Прототипувати мобільний застосунок (план, екрани, план API).
    - Організувати файли та папки (очищення, найменування, теги).
    - Підключити Gmail і автоматизувати зведення або подальші дії.

    Він може виконувати великі завдання, але працює найкраще, коли ви ділите їх на фази та
    використовуєте sub-agents для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найпоширеніших повсякденних сценаріїв використання OpenClaw?">
    Повсякденна користь зазвичай виглядає так:

    - **Персональні зведення:** підсумки вхідних, календаря та новин, які для вас важливі.
    - **Дослідження та чернетки:** швидкі дослідження, підсумки та перші чернетки для листів або документів.
    - **Нагадування та подальші дії:** підказки та контрольні списки на основі cron або heartbeat.
    - **Автоматизація браузера:** заповнення форм, збирання даних і повторювані вебзавдання.
    - **Координація між пристроями:** надішліть завдання з телефона, дозвольте Gateway виконати його на сервері та отримайте результат назад у чаті.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, ads і блогами для SaaS?">
    Так — для **дослідження, кваліфікації та підготовки чернеток**. Він може сканувати сайти, створювати короткі списки,
    узагальнювати інформацію про потенційних клієнтів і писати чернетки outreach або рекламних текстів.

    Для **outreach або запуску реклами** залишайте людину в циклі. Уникайте спаму, дотримуйтеся місцевих законів і
    правил платформ та перевіряйте все перед надсиланням. Найбезпечніший підхід — дати
    OpenClaw підготувати чернетку, а вам — схвалити її.

    Документація: [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний асистент** і шар координації, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого безпосереднього циклу кодування в репозиторії. Використовуйте OpenClaw, коли вам
    потрібні стійка пам’ять, доступ між пристроями та оркестрація інструментів.

    Переваги:

    - **Постійна пам’ять + робочий простір** між сесіями
    - **Доступ із багатьох платформ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (браузер, файли, планування, hooks)
    - **Завжди активний Gateway** (запуск на VPS, взаємодія звідусіль)
    - **Nodes** для локального браузера/екрана/камери/exec

    Приклади: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills і автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати Skills, не забруднюючи репозиторій?">
    Використовуйте керовані override замість редагування копії в репозиторії. Розміщуйте свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`, тому керовані override однаково мають вищий пріоритет за вбудовані Skills без змін у git. Якщо вам потрібно встановити skill глобально, але зробити його видимим лише для певних agents, зберігайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` і `agents.list[].skills`. Лише зміни, варті внесення в апстрим, мають жити в репозиторії та надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можна завантажувати Skills із власної папки?">
    Так. Додавайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий порядок пріоритетів: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`. `clawhub` типово встановлює в `./skills`, що OpenClaw сприймає як `<workspace>/skills` у наступній сесії. Якщо skill має бути видимим лише для певних agents, поєднайте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як використовувати різні моделі для різних завдань?">
    Наразі підтримуються такі шаблони:

    - **Завдання Cron**: ізольовані завдання можуть задавати override `model` для кожного завдання.
    - **Sub-agents**: спрямовуйте завдання до окремих agents із різними типовими моделями.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб будь-коли змінити модель поточної сесії.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Multi-Agent Routing](/uk/concepts/multi-agent) і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час виконання важкої роботи. Як це винести окремо?">
    Використовуйте **sub-agents** для довгих або паралельних завдань. Sub-agents працюють у власній сесії,
    повертають підсумок і не дають вашому основному чату втратити чутливість.

    Попросіть бота «spawn a sub-agent for this task» або використайте `/subagents`.
    Використовуйте `/status` у чаті, щоб побачити, що Gateway робить просто зараз (і чи він зайнятий).

    Порада щодо токенів: і довгі завдання, і sub-agents споживають токени. Якщо вас турбує вартість, задайте
    дешевшу модель для sub-agents через `agents.defaults.subagents.model`.

    Документація: [Sub-agents](/uk/tools/subagents), [Background Tasks](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють сесії subagent, прив’язані до гілок, у Discord?">
    Використовуйте прив’язки до гілок. Ви можете прив’язати гілку Discord до subagent або цільової сесії, щоб подальші повідомлення в цій гілці залишалися в межах прив’язаної сесії.

    Базовий процес:

    - Створіть через `sessions_spawn`, використовуючи `thread: true` (і, за потреби, `mode: "session"` для постійших подальших дій).
    - Або прив’яжіть вручну за допомогою `/focus <target>`.
    - Використовуйте `/agents`, щоб переглянути стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним скасуванням фокуса.
    - Використовуйте `/unfocus`, щоб від’єднати гілку.

    Потрібна конфігурація:

    - Глобальні типові значення: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override для Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоматична прив’язка під час spawn: установіть `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agents](/uk/tools/subagents), [Discord](/uk/channels/discord), [Configuration Reference](/uk/gateway/configuration-reference), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent завершив роботу, але оновлення про завершення надійшло не туди або взагалі не було надіслано. Що перевірити?">
    Спочатку перевірте визначений маршрут запитувача:

    - Доставка subagent у режимі завершення віддає перевагу будь-якій прив’язаній гілці або маршруту розмови, якщо такий існує.
    - Якщо джерело завершення містить лише канал, OpenClaw повертається до збереженого маршруту сесії запитувача (`lastChannel` / `lastTo` / `lastAccountId`), тож пряма доставка все одно може спрацювати.
    - Якщо немає ні прив’язаного маршруту, ні придатного збереженого маршруту, пряма доставка може завершитися невдачею, і результат повернеться до доставки через чергу сесії замість негайної публікації в чат.
    - Невалідні або застарілі цілі все одно можуть змусити перейти до резервної доставки через чергу або до остаточного збою доставки.
    - Якщо остання видима відповідь assistant у дочірній сесії — це точний тихий токен `NO_REPLY` / `no_reply` або рівно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує оголошення замість публікації застарілого попереднього прогресу.
    - Якщо дочірня сесія завершилася за тайм-аутом після одних лише викликів інструментів, оголошення може згорнути це до короткого підсумку часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agents](/uk/tools/subagents), [Background Tasks](/uk/automation/tasks), [Session Tools](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron виконується всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання не виконуватимуться.

    Контрольний список:

    - Переконайтеся, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не встановлено.
    - Перевірте, що Gateway працює 24/7 (без сну/перезапусків).
    - Перевірте налаштування часового поясу для завдання (`--tz` порівняно з часовим поясом хоста).

    Налагодження:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Automation & Tasks](/uk/automation).

  </Accordion>

  <Accordion title="Cron спрацював, але в канал нічого не було надіслано. Чому?">
    Спочатку перевірте режим доставки:

    - `--no-deliver` / `delivery.mode: "none"` означає, що резервне надсилання через runner не очікується.
    - Відсутня або невалідна ціль оголошення (`channel` / `to`) означає, що runner пропустив вихідну доставку.
    - Збої автентифікації каналу (`unauthorized`, `Forbidden`) означають, що runner намагався доставити повідомлення, але облікові дані це заблокували.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` і нічого більше) вважається навмисно непридатним для доставки, тому runner також пригнічує резервну доставку через чергу.

    Для ізольованих завдань Cron agent усе одно може надсилати безпосередньо через інструмент `message`,
    коли маршрут чату доступний. `--announce` керує лише резервним шляхом runner
    для фінального тексту, який agent ще не надіслав самостійно.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Background Tasks](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований запуск cron переключив модель або один раз повторив спробу?">
    Зазвичай це шлях live-перемикання моделі, а не дубльоване планування.

    Ізольований cron може зберегти передачу моделі під час виконання та повторити спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає переключеного
    провайдера/модель, а якщо перемикання містило новий override профілю автентифікації, cron
    також зберігає його перед повторною спробою.

    Пов’язані правила вибору:

    - Override моделі Gmail hook має найвищий пріоритет, коли застосовний.
    - Потім іде `model` для окремого завдання.
    - Потім будь-який збережений override моделі cron-session.
    - Потім звичайний вибір моделі agent/default.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 повторних спроб через перемикання
    cron переривається замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [cron CLI](/uk/cli/cron).

  </Accordion>

  <Accordion title="Як установити Skills на Linux?">
    Використовуйте вбудовані команди `openclaw skills` або розміщуйте Skills у своєму workspace. UI Skills для macOS недоступний у Linux.
    Переглядайте Skills на [https://clawhub.ai](https://clawhub.ai).

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    Вбудоване `openclaw skills install` записує у каталог `skills/`
    активного workspace. Окремий CLI `clawhub` установлюйте лише тоді, якщо хочете публікувати або
    синхронізувати власні Skills. Для спільних установлень між agents розміщуйте skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете звузити список agents, які можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw виконувати завдання за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Cron jobs** для запланованих або повторюваних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок «основної сесії».
    - **Ізольовані завдання** для автономних agents, які публікують підсумки або доставляють їх у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Automation & Tasks](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати Skills лише для Apple macOS у Linux?">
    Не напряму. Skills для macOS контролюються через `metadata.openclaw.os` плюс потрібні бінарні файли, і Skills з’являються в системному prompt лише тоді, коли вони придатні на **хості Gateway**. У Linux Skills лише для `darwin` (наприклад, `apple-notes`, `apple-reminders`, `things-mac`) не завантажаться, якщо ви не перевизначите ці обмеження.

    Підтримуються три шаблони:

    **Варіант A — запускати Gateway на Mac (найпростіше).**
    Запустіть Gateway там, де існують бінарні файли macOS, а потім підключайтеся з Linux у [віддаленому режимі](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажуються нормально, тому що хост Gateway — це macOS.

    **Варіант B — використовувати node macOS (без SSH).**
    Запустіть Gateway на Linux, сполучіть node macOS (застосунок у рядку меню) і встановіть **Node Run Commands** у значення "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати Skills лише для macOS придатними, коли потрібні бінарні файли існують на node. Agent запускає ці Skills через інструмент `nodes`. Якщо ви виберете "Always Ask", схвалення "Always Allow" у prompt додасть цю команду до allowlist.

    **Варіант C — проксіювати бінарні файли macOS через SSH (просунутий).**
    Залиште Gateway на Linux, але зробіть так, щоб потрібні бінарні CLI визначалися як SSH-обгортки, що виконуються на Mac. Потім перевизначте skill, щоб дозволити Linux, і він залишався придатним.

    1. Створіть SSH-обгортку для бінарного файла (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Додайте обгортку до `PATH` на хості Linux (наприклад, `~/bin/memo`).
    3. Перевизначте метадані skill (workspace або `~/.openclaw/skills`), щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Керування Apple Notes через CLI memo на macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Запустіть нову сесію, щоб знімок Skills оновився.

  </Accordion>

  <Accordion title="Чи є у вас інтеграція з Notion або HeyGen?">
    Наразі вбудованої немає.

    Варіанти:

    - **Власний skill / Plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Автоматизація браузера:** працює без коду, але повільніше й менш надійно.

    Якщо ви хочете зберігати контекст окремо для кожного клієнта (робочі процеси агентства), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + налаштування + активна робота).
    - Попросіть agent отримувати цю сторінку на початку сесії.

    Якщо вам потрібна нативна інтеграція, створіть запит на функцію або побудуйте skill,
    орієнтований на ці API.

    Установлення Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Вбудовані встановлення потрапляють у каталог `skills/` активного workspace. Для спільних Skills між agents розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі agents, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі Skills очікують бінарні файли, установлені через Homebrew; у Linux це означає Linuxbrew (див. запис FAQ про Homebrew для Linux вище). Див. [Skills](/uk/tools/skills), [Skills config](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати вже залогінений Chrome з OpenClaw?">
    Використовуйте вбудований профіль браузера `user`, який підключається через Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Якщо вам потрібна власна назва, створіть явний профіль MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Цей шлях може використовувати локальний браузер хоста або підключену browser node. Якщо Gateway працює деінде, або запустіть хост node на машині з браузером, або замість цього використовуйте віддалений CDP.

    Поточні обмеження `existing-session` / `user`:

    - дії керуються через ref, а не через CSS-селектори
    - вивантаження файлів потребує `ref` / `inputRef` і наразі підтримує лише один файл за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії все ще потребують керованого браузера або необробленого профілю CDP

  </Accordion>
</AccordionGroup>

## Ізоляція та пам’ять

<AccordionGroup>
  <Accordion title="Чи є окремий документ про ізоляцію?">
    Так. Див. [Sandboxing](/uk/gateway/sandboxing). Для налаштування, специфічного для Docker (повний gateway у Docker або образи sandbox), див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повні можливості?">
    Типовий образ орієнтований на безпеку й запускається від користувача `node`, тому він не
    містить системних пакетів, Homebrew або вбудованих браузерів. Для повнішого налаштування:

    - Збережіть `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші переживали перезапуски.
    - Додайте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Установіть браузери Playwright через вбудований CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Установіть `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я зберегти приватність у DM, але зробити групи публічними/ізольованими з одним agent?">
    Так — якщо ваш приватний трафік — це **DM**, а публічний трафік — це **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб сесії груп/каналів (ключі не main) працювали у вибраному backend sandbox, а основна DM-сесія залишалася на хості. Docker є типовим backend, якщо ви не виберете інший. Потім обмежте набір інструментів, доступних в ізольованих сесіях, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: особисті DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Довідка щодо ключових параметрів конфігурації: [Конфігурація Gateway](/uk/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати папку хоста в sandbox?">
    Установіть `agents.defaults.sandbox.docker.binds` у значення `["host:path:mode"]` (наприклад, `"/home/user/src:/src:ro"`). Глобальні прив’язки та прив’язки для окремого agent об’єднуються; прив’язки для окремого agent ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого й пам’ятайте, що прив’язки обходять бар’єри файлової системи sandbox.

    OpenClaw перевіряє джерела прив’язок як щодо нормалізованого шляху, так і щодо канонічного шляху, визначеного через найглибший наявний батьківський елемент. Це означає, що вихід через батьківський symlink усе одно завершиться закритою відмовою, навіть якщо останній сегмент шляху ще не існує, і перевірки дозволених коренів усе одно застосовуються після визначення symlink.

    Див. [Sandboxing](/uk/gateway/sandboxing#custom-bind-mounts) і [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) для прикладів і приміток щодо безпеки.

  </Accordion>

  <Accordion title="Як працює пам’ять?">
    Пам’ять OpenClaw — це просто файли Markdown у workspace agent:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Керовані довгострокові нотатки в `MEMORY.md` (лише основні/приватні сесії)

    OpenClaw також запускає **тихе скидання пам’яті перед Compaction**, щоб нагадати моделі
    записати довговічні нотатки перед автоматичною Compaction. Це виконується лише тоді, коли workspace
    доступний для запису (sandbox лише для читання це пропускають). Див. [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Пам’ять постійно все забуває. Як зробити, щоб інформація зберігалася?">
    Попросіть бота **записати факт у пам’ять**. Довгострокові нотатки мають зберігатися в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще напрям, який ми вдосконалюємо. Корисно нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона й далі все забуває, перевірте, що Gateway використовує той самий
    workspace під час кожного запуску.

    Документація: [Memory](/uk/concepts/memory), [Agent workspace](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається пам’ять назавжди? Які є обмеження?">
    Файли пам’яті живуть на диску й зберігаються, доки ви їх не видалите. Обмеженням є
    ваше сховище, а не модель. **Контекст сесії** усе ще обмежений вікном контексту
    моделі, тому довгі розмови можуть проходити Compaction або обрізання. Саме тому
    існує пошук у пам’яті — він повертає в контекст лише релевантні частини.

    Документація: [Memory](/uk/concepts/memory), [Context](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потребує семантичний пошук у пам’яті ключ API OpenAI?">
    Лише якщо ви використовуєте **OpenAI embeddings**. Codex OAuth покриває chat/completions і
    **не** надає доступу до embeddings, тому **вхід через Codex (OAuth або
    вхід через Codex CLI)** не допомагає для семантичного пошуку в пам’яті. OpenAI embeddings
    усе одно потребують справжнього ключа API (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви явно не задаєте провайдера, OpenClaw автоматично вибирає провайдера, коли
    може визначити ключ API (профілі автентифікації, `models.providers.*.apiKey` або змінні середовища).
    Він віддає перевагу OpenAI, якщо визначається ключ OpenAI, інакше Gemini, якщо визначається ключ Gemini,
    потім Voyage, потім Mistral. Якщо жоден віддалений ключ недоступний, пошук у
    пам’яті залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштовано і доступний
    шлях до локальної моделі, OpenClaw
    віддає перевагу `local`. Ollama підтримується, коли ви явно задаєте
    `memorySearch.provider = "ollama"`.

    Якщо ви хочете залишатися локально, задайте `memorySearch.provider = "local"` (і за бажанням
    `memorySearch.fallback = "none"`). Якщо вам потрібні Gemini embeddings, задайте
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо embedding-моделі **OpenAI, Gemini, Voyage, Mistral, Ollama або local**
    — подробиці налаштування див. у [Memory](/uk/concepts/memory).

  </Accordion>
</AccordionGroup>

## Де все зберігається на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, що використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** сесії, файли пам’яті, конфігурація та workspace живуть на хості Gateway
      (`~/.openclaw` + ваш каталог workspace).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте провайдерам моделей (Anthropic/OpenAI тощо), потрапляють
      до їхніх API, а чат-платформи (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на
      своїх серверах.
    - **Ви контролюєте обсяг:** використання локальних моделей залишає prompts на вашій машині, але трафік
      каналів усе одно проходить через сервери відповідного каналу.

    Пов’язане: [Agent workspace](/uk/concepts/agent-workspace), [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе зберігається в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Path                                                            | Призначення                                                        |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основна конфігурація (JSON5)                                       |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Застарілий імпорт OAuth (копіюється в профілі автентифікації під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Профілі автентифікації (OAuth, API keys і необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язковий payload секрету на основі файла для провайдерів `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Застарілий файл сумісності (статичні записи `api_key` очищено)     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдера (наприклад, `whatsapp/<accountId>/creds.json`)     |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан для кожного agent (agentDir + sessions)                       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (для кожного agent)                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані сесій (для кожного agent)                                 |

    Застарілий шлях для single-agent: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`).

    Ваш **workspace** (`AGENTS.md`, файли пам’яті, Skills тощо) зберігається окремо та налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають зберігатися AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли живуть у **workspace agent**, а не в `~/.openclaw`.

    - **Workspace (для кожного agent):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, необов’язково `HEARTBEAT.md`.
      Кореневий `memory.md` у нижньому регістрі — лише застарілий вхід для виправлення; `openclaw doctor --fix`
      може об’єднати його в `MEMORY.md`, коли існують обидва файли.
    - **Каталог стану (`~/.openclaw`)**: конфігурація, стан каналу/провайдера, профілі автентифікації, сесії, логи,
      і спільні Skills (`~/.openclaw/skills`).

    Типовий workspace — `~/.openclaw/workspace`, налаштовується через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот «забуває» після перезапуску, переконайтеся, що Gateway використовує той самий
    workspace при кожному запуску (і пам’ятайте: віддалений режим використовує workspace **хоста gateway**,
    а не вашого локального ноутбука).

    Порада: якщо вам потрібна стійка поведінка або налаштування, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладайтеся на історію чату.

    Див. [Agent workspace](/uk/concepts/agent-workspace) і [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Зберігайте свій **workspace agent** у **приватному** git-репозиторії та робіть його резервну копію
    у приватному місці (наприклад, приватний GitHub). Це зберігає пам’ять + файли AGENTS/SOUL/USER
    і дає змогу пізніше відновити «розум» асистента.

    **Не** комітьте нічого з `~/.openclaw` (облікові дані, сесії, токени або зашифровані payload секретів).
    Якщо вам потрібне повне відновлення, окремо створюйте резервні копії і workspace, і каталогу стану
    (див. питання про міграцію вище).

    Документація: [Agent workspace](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окремий посібник: [Uninstall](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть agents працювати поза workspace?">
    Так. Workspace — це **типовий cwd** і точка прив’язки пам’яті, а не жорстка sandbox.
    Відносні шляхи визначаються всередині workspace, але абсолютні шляхи можуть звертатися до інших
    розташувань хоста, якщо ізоляцію не ввімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування sandbox для окремого agent. Якщо ви
    хочете, щоб репозиторій був типовим робочим каталогом, вкажіть `workspace`
    цього agent на корінь репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
    workspace окремо, якщо лише ви навмисно не хочете, щоб agent працював усередині нього.

    Приклад (репозиторій як типовий cwd):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Віддалений режим: де знаходиться сховище сесій?">
    Станом сесій керує **хост gateway**. Якщо ви в віддаленому режимі, потрібне вам сховище сесій розташоване на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Session management](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="Який формат конфігурації? Де вона знаходиться?">
    OpenClaw читає необов’язкову конфігурацію **JSON5** із `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються відносно безпечні типові значення (зокрема типовий workspace `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я встановив gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Прив’язки не до loopback **потребують валідного шляху автентифікації gateway**. На практиці це означає:

    - автентифікація спільним секретом: токен або пароль
    - `gateway.auth.mode: "trusted-proxy"` за правильно налаштованим identity-aware reverse proxy не на loopback

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    Примітки:

    - `gateway.remote.token` / `.password` **самі по собі** не вмикають локальну автентифікацію gateway.
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як fallback лише тоді, коли `gateway.auth.*` не задано.
    - Для автентифікації паролем задайте `gateway.auth.mode: "password"` плюс `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і його не вдається визначити, визначення завершується закритою відмовою (без маскування через віддалений fallback).
    - Налаштування Control UI зі спільним секретом проходять автентифікацію через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях app/UI). Режими з ідентичністю, такі як Tailscale Serve або `trusted-proxy`, натомість використовують заголовки запиту. Уникайте розміщення спільних секретів в URL.
    - З `gateway.auth.mode: "trusted-proxy"` reverse proxy на loopback на тому самому хості все одно **не** задовольняють автентифікацію trusted-proxy. Trusted proxy має бути налаштованим джерелом не на loopback.

  </Accordion>

  <Accordion title="Чому тепер мені потрібен токен на localhost?">
    OpenClaw примусово вимагає автентифікацію gateway за замовчуванням, зокрема і на loopback. У звичайному типовому шляху це означає автентифікацію токеном: якщо явний шлях автентифікації не налаштовано, під час запуску gateway вибирається режим токена й автоматично генерується токен, який зберігається в `gateway.auth.token`, тому **локальні WS-клієнти мають проходити автентифікацію**. Це блокує іншим локальним процесам виклик Gateway.

    Якщо вам більше підходить інший шлях автентифікації, ви можете явно вибрати режим пароля (або, для identity-aware reverse proxy не на loopback, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно задайте `gateway.auth.mode: "none"` у своїй конфігурації. Doctor може будь-коли згенерувати токен за вас: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни конфігурації?">
    Gateway відстежує конфігурацію та підтримує hot-reload:

    - `gateway.reload.mode: "hybrid"` (типово): безпечно застосовує зміни в гарячому режимі, для критичних — перезапускає
    - також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні слогани CLI?">
    Задайте `cli.banner.taglineMode` у конфігурації:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: приховує текст слогана, але зберігає рядок заголовка/версії банера.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: ротація кумедних/сезонних слоганів (типова поведінка).
    - Якщо ви взагалі не хочете банера, задайте змінну середовища `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути вебпошук (і веботримання)?">
    `web_fetch` працює без ключа API. `web_search` залежить від вибраного
    провайдера:

    - Провайдери на основі API, як-от Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, потребують звичайного налаштування ключів API.
    - Ollama Web Search не потребує ключа, але використовує налаштований хост Ollama і вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна інтеграція на основі HTML.
    - SearXNG не потребує ключа / підтримує self-host; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Рекомендовано:** запустіть `openclaw configure --section web` і виберіть провайдера.
    Альтернативи через змінні середовища:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` або `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` або `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` або `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // необов’язково; пропустіть для auto-detect
            },
          },
        },
    }
    ```

    Конфігурація вебпошуку, специфічна для провайдера, тепер зберігається в `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи провайдерів `tools.web.search.*` поки що все ще завантажуються для сумісності, але їх не слід використовувати в нових конфігураціях.
    Конфігурація fallback для Firecrawl web-fetch зберігається в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlist, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнено за замовчуванням (якщо його явно не вимкнено).
    - Якщо `tools.web.fetch.provider` не вказано, OpenClaw автоматично визначає першого готового fallback-провайдера для fetch із доступних облікових даних. Наразі вбудований провайдер — Firecrawl.
    - Daemons читають змінні середовища з `~/.openclaw/.env` (або із середовища сервісу).

    Документація: [Web tools](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мою конфігурацію. Як відновитися й уникнути цього надалі?">
    `config.apply` замінює **всю конфігурацію**. Якщо ви надсилаєте частковий об’єкт, усе
    інше буде видалено.

    Поточний OpenClaw захищає від багатьох випадкових пошкоджень:

    - Записи конфігурації, якими керує OpenClaw, перевіряють повну конфігурацію після змін перед записом.
    - Невалідні або руйнівні записи, якими керує OpenClaw, відхиляються й зберігаються як `openclaw.json.rejected.*`.
    - Якщо пряме редагування ламає запуск або hot reload, Gateway відновлює останню відому коректну конфігурацію й зберігає відхилений файл як `openclaw.json.clobbered.*`.
    - Після відновлення основний agent отримує попередження під час запуску, щоб не записати погану конфігурацію знову навмання.

    Відновлення:

    - Перевірте `openclaw logs --follow` на наявність `Config auto-restored from last-known-good`, `Config write rejected:` або `config reload restored last-known-good config`.
    - Перегляньте найновіший `openclaw.json.clobbered.*` або `openclaw.json.rejected.*` поруч з активною конфігурацією.
    - Залиште активну відновлену конфігурацію, якщо вона працює, а потім поверніть лише потрібні ключі через `openclaw config set` або `config.patch`.
    - Запустіть `openclaw config validate` і `openclaw doctor`.
    - Якщо у вас немає останньої відомої коректної конфігурації або відхиленого payload, відновіть із резервної копії або повторно запустіть `openclaw doctor` і заново налаштуйте channels/models.
    - Якщо це сталося неочікувано, створіть bug report і додайте свою останню відому конфігурацію або будь-яку резервну копію.
    - Локальний coding agent часто може відновити працездатну конфігурацію з логів або історії.

    Як уникнути цього:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Спочатку використовуйте `config.schema.lookup`, якщо не впевнені в точному шляху або формі поля; він повертає поверхневий вузол схеми плюс підсумки безпосередніх дочірніх елементів для подальшого заглиблення.
    - Використовуйте `config.patch` для часткових редагувань через RPC; залишайте `config.apply` лише для повної заміни конфігурації.
    - Якщо ви використовуєте owner-only інструмент `gateway` із запуску agent, він усе одно відхилятиме записи в `tools.exec.ask` / `tools.exec.security` (зокрема застарілі псевдоніми `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Config](/uk/cli/config), [Configure](/uk/cli/configure), [Gateway troubleshooting](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими працівниками на різних пристроях?">
    Поширений шаблон — **один Gateway** (наприклад, Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** керує channels (Signal/WhatsApp), маршрутизацією та sessions.
    - **Nodes (пристрої):** Mac/iOS/Android підключаються як периферія й надають локальні інструменти (`system.run`, `canvas`, `camera`).
    - **Agents (працівники):** окремі «мізки»/workspace для спеціальних ролей (наприклад, "Hetzner ops", "Personal data").
    - **Sub-agents:** запускають фонову роботу з основного agent, коли вам потрібен паралелізм.
    - **TUI:** підключається до Gateway і перемикає agents/sessions.

    Документація: [Nodes](/uk/nodes), [Remote access](/uk/gateway/remote), [Multi-Agent Routing](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [TUI](/uk/web/tui).

  </Accordion>

  <Accordion title="Чи може браузер OpenClaw працювати в headless-режимі?">
    Так. Це параметр конфігурації:

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    Типове значення — `false` (headful). Headless-режим частіше викликає anti-bot-перевірки на деяких сайтах. Див. [Browser](/uk/tools/browser).

    Headless використовує **той самий рушій Chromium** і працює для більшості сценаріїв автоматизації (форми, кліки, скрейпінг, входи). Основні відмінності:

    - Немає видимого вікна браузера (використовуйте screenshots, якщо потрібна візуалізація).
    - Деякі сайти суворіше ставляться до автоматизації в headless-режимі (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує headless-сесії.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Установіть `browser.executablePath` на ваш бінарний файл Brave (або будь-якого браузера на основі Chromium) і перезапустіть Gateway.
    Повні приклади конфігурації див. у [Browser](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway і nodes

<AccordionGroup>
  <Accordion title="Як команди проходять між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляє **gateway**. Gateway запускає agent і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен інструмент node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідний трафік провайдера; вони отримують лише виклики RPC node.

  </Accordion>

  <Accordion title="Як мій agent може отримати доступ до мого комп’ютера, якщо Gateway розміщено віддалено?">
    Коротка відповідь: **сполучіть свій комп’ютер як node**. Gateway працює деінде, але може
    викликати інструменти `node.*` (екран, камера, система) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на хості, який завжди ввімкнений (VPS/домашній сервер).
    2. Додайте хост Gateway і свій комп’ютер до однієї tailnet.
    3. Переконайтеся, що Gateway WS доступний (прив’язка tailnet або SSH-тунель).
    4. Відкрийте застосунок macOS локально й підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як node.
    5. Схваліть node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP bridge не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування про безпеку: сполучення node macOS дозволяє `system.run` на цій машині. Сполучайте
    лише пристрої, яким довіряєте, і перегляньте [Security](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Gateway protocol](/uk/gateway/protocol), [macOS remote mode](/uk/platforms/mac/remote), [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключено, але я не отримую відповідей. Що тепер?">
    Перевірте базові речі:

    - Gateway запущено: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан каналів: `openclaw channels status`

    Потім перевірте автентифікацію та маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` налаштовано правильно.
    - Якщо ви підключаєтеся через SSH-тунель, переконайтеся, що локальний тунель активний і вказує на правильний порт.
    - Переконайтеся, що ваші allowlist (DM або група) включають ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Remote access](/uk/gateway/remote), [Channels](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть дві інсталяції OpenClaw спілкуватися між собою (локальна + VPS)?">
    Так. Вбудованого bridge «бот-до-бота» немає, але це можна організувати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний чат-канал, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надішле повідомлення Bot B, а потім Bot B відповість як зазвичай.

    **CLI bridge (загальний):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючись на чат, де інший бот
    слухає. Якщо один бот працює на віддаленому VPS, спрямуйте свій CLI на цей віддалений Gateway
    через SSH/Tailscale (див. [Remote access](/uk/gateway/remote)).

    Приклад шаблону (запускати з машини, яка може дістатися до цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте захист, щоб два боти не зациклилися без кінця (лише відповіді на згадки, allowlist каналів
    або правило «не відповідати на повідомлення ботів»).

    Документація: [Remote access](/uk/gateway/remote), [Agent CLI](/uk/cli/agent), [Agent send](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох agents?">
    Ні. Один Gateway може розміщувати кількох agents, кожен зі своїм workspace, типовими моделями
    і маршрутизацією. Це нормальне налаштування, і воно значно дешевше та простіше, ніж запускати
    один VPS на кожного agent.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні конфігурації, якими ви не хочете ділитися. В іншому разі залишайте один Gateway і
    використовуйте кількох agents або sub-agents.

  </Accordion>

  <Accordion title="Чи є перевага у використанні node на моєму особистому ноутбуці замість SSH із VPS?">
    Так — nodes є основним способом доступу до вашого ноутбука з віддаленого Gateway, і вони
    дають більше, ніж просто доступ до shell. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (достатньо невеликого VPS або пристрою класу Raspberry Pi; 4 GB RAM цілком вистачає), тому поширене
    налаштування — це хост, який завжди ввімкнений, плюс ваш ноутбук як node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують сполучення пристроїв.
    - **Безпечніший контроль виконання.** `system.run` контролюється allowlist/схваленнями node на цьому ноутбуці.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна автоматизація браузера.** Тримайте Gateway на VPS, але запускайте Chrome локально через хост node на ноутбуці або підключайтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для разового доступу до shell, але nodes простіші для постійних робочих процесів agent і
    автоматизації пристроїв.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/uk/cli/nodes), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes сервіс gateway?">
    Ні. На хості має працювати лише **один gateway**, якщо тільки ви навмисно не запускаєте ізольовані профілі (див. [Multiple gateways](/uk/gateway/multiple-gateways)). Nodes — це периферійні компоненти, які підключаються
    до gateway (nodes iOS/Android або «node mode» на macOS у застосунку рядка меню). Для безголових
    хостів node і керування через CLI див. [Node host CLI](/uk/cli/node).

    Для змін `gateway`, `discovery` і `canvasHost` потрібен повний перезапуск.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати конфігурацію?">
    Так.

    - `config.schema.lookup`: перевірити одне піддерево конфігурації з його поверхневим вузлом схеми, відповідною підказкою UI і підсумками безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний знімок + hash
    - `config.patch`: безпечне часткове оновлення (переважний варіант для більшості редагувань через RPC); виконує hot-reload, коли можливо, і перезапуск, коли потрібно
    - `config.apply`: перевіряє й замінює всю конфігурацію; виконує hot-reload, коли можливо, і перезапуск, коли потрібно
    - Інструмент runtime `gateway`, доступний лише owner, як і раніше відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

  </Accordion>

  <Accordion title="Мінімальна розумна конфігурація для першого встановлення">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Це задає ваш workspace і обмежує, хто може активувати бота.

  </Accordion>

  <Accordion title="Як налаштувати Tailscale на VPS і підключитися з Mac?">
    Мінімальні кроки:

    1. **Установіть і виконайте вхід на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Установіть і виконайте вхід на Mac**
       - Використайте застосунок Tailscale і ввійдіть у ту саму tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - В адмін-консолі Tailscale увімкніть MagicDNS, щоб VPS мав стабільне ім’я.
    4. **Використовуйте ім’я хоста tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо ви хочете Control UI без SSH, використовуйте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив’язаним до loopback і відкриває HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як підключити node Mac до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Gateway Control UI + WS**. Nodes підключаються через той самий endpoint Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS і Mac знаходяться в одній tailnet**.
    2. **Використовуйте застосунок macOS у віддаленому режимі** (ціллю SSH може бути ім’я хоста tailnet).
       Застосунок тунелюватиме порт Gateway і підключиться як node.
    3. **Схваліть node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Gateway protocol](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [macOS remote mode](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи варто встановлювати на другий ноутбук, чи просто додати node?">
    Якщо вам потрібні лише **локальні інструменти** (екран/камера/exec) на другому ноутбуці, додайте його як
    **node**. Це дозволяє зберегти єдиний Gateway і уникнути дублювання конфігурації. Локальні інструменти node
    зараз доступні лише на macOS, але ми плануємо поширити їх і на інші ОС.

    Установлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/uk/cli/nodes), [Multiple gateways](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Змінні середовища і завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує змінні середовища?">
    OpenClaw читає змінні середовища з батьківського процесу (shell, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного робочого каталогу
    - глобальний fallback `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден файл `.env` не перевизначає вже наявні змінні середовища.

    Ви також можете визначити вбудовані змінні середовища в конфігурації (застосовуються лише якщо вони відсутні в середовищі процесу):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Повний порядок пріоритетів і джерела див. в [/environment](/uk/help/environment).

  </Accordion>

  <Accordion title="Я запустив Gateway через сервіс, і мої змінні середовища зникли. Що тепер?">
    Два поширені способи виправлення:

    1. Додайте відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися навіть тоді, коли сервіс не успадковує змінні середовища вашого shell.
    2. Увімкніть імпорт shell (зручність за явною згодою):

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    Це запускає ваш login shell і імпортує лише відсутні очікувані ключі (ніколи не перевизначає). Еквіваленти через змінні середовища:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я задав COPILOT_GITHUB_TOKEN, але статус models показує "Shell env: off." Чому?'>
    `openclaw models status` повідомляє, чи ввімкнено **імпорт змінних середовища shell**. "Shell env: off"
    **не** означає, що ваших змінних середовища немає — це лише означає, що OpenClaw не буде
    автоматично завантажувати ваш login shell.

    Якщо Gateway працює як сервіс (launchd/systemd), він не успадковує середовище
    вашого shell. Виправте це одним із таких способів:

    1. Додайте токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або увімкніть імпорт shell (`env.shellEnv.enabled: true`).
    3. Або додайте його до блоку `env` у своїй конфігурації (застосовується лише якщо змінна відсутня).

    Потім перезапустіть gateway і перевірте ще раз:

    ```bash
    openclaw models status
    ```

    Токени Copilot читаються з `COPILOT_GITHUB_TOKEN` (також `GH_TOKEN` / `GITHUB_TOKEN`).
    Див. [/concepts/model-providers](/uk/concepts/model-providers) і [/environment](/uk/help/environment).

  </Accordion>
</AccordionGroup>

## Сесії та кілька чатів

<AccordionGroup>
  <Accordion title="Як почати нову розмову?">
    Надішліть `/new` або `/reset` як окреме повідомлення. Див. [Session management](/uk/concepts/session).
  </Accordion>

  <Accordion title="Чи скидаються сесії автоматично, якщо я ніколи не надсилаю /new?">
    Термін дії сесій може завершуватися після `session.idleMinutes`, але це **вимкнено за замовчуванням** (типове значення **0**).
    Установіть додатне значення, щоб увімкнути завершення за неактивністю. Коли це ввімкнено, **наступне**
    повідомлення після періоду неактивності починає новий id сесії для цього ключа чату.
    Це не видаляє транскрипти — це лише запускає нову сесію.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб створити команду з інсталяцій OpenClaw (один CEO і багато agents)?">
    Так, через **маршрутизацію multi-agent** і **sub-agents**. Ви можете створити одного координатора
    agent і кількох agents-працівників із власними workspace і моделями.

    Водночас це краще сприймати як **цікавий експеримент**. Це важко за токенами й часто
    менш ефективно, ніж використання одного бота з окремими сесіями. Типова модель, яку ми
    уявляємо, — це один бот, з яким ви спілкуєтеся, але з різними сесіями для паралельної роботи. Цей
    бот також може за потреби запускати sub-agents.

    Документація: [Multi-agent routing](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [Agents CLI](/uk/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст було обрізано посеред завдання? Як цього уникнути?">
    Контекст сесії обмежений вікном моделі. Довгі чати, великі виводи інструментів або велика кількість
    файлів можуть спричинити compaction або обрізання.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими завданнями і `/new` під час зміни теми.
    - Зберігайте важливий контекст у workspace і просіть бота перечитати його.
    - Використовуйте sub-agents для довгої або паралельної роботи, щоб основний чат залишався меншим.
    - Виберіть модель із більшим вікном контексту, якщо це трапляється часто.

  </Accordion>

  <Accordion title="Як повністю скинути OpenClaw, але залишити його встановленим?">
    Використовуйте команду скидання:

    ```bash
    openclaw reset
    ```

    Повне неінтерактивне скидання:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Потім знову запустіть налаштування:

    ```bash
    openclaw onboard --install-daemon
    ```

    Примітки:

    - Онбординг також пропонує **Reset**, якщо бачить наявну конфігурацію. Див. [Onboarding (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен каталог стану (типові: `~/.openclaw-<profile>`).
    - Скидання для розробки: `openclaw gateway --dev --reset` (лише для розробки; очищує dev-конфігурацію + облікові дані + сесії + workspace).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або виконати compaction?'>
    Використайте один із цих варіантів:

    - **Compaction** (зберігає розмову, але підсумовує старіші ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб скерувати підсумовування.

    - **Скидання** (новий id сесії для того самого ключа чату):

      ```
      /new
      /reset
      ```

    Якщо це повторюється:

    - Увімкніть або налаштуйте **обрізання сесій** (`agents.defaults.contextPruning`), щоб скорочувати старий вивід інструментів.
    - Використовуйте модель із більшим вікном контексту.

    Документація: [Compaction](/uk/concepts/compaction), [Session pruning](/uk/concepts/session-pruning), [Session management](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка валідації провайдера: модель видала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія сесії застаріла або пошкоджена (часто після довгих гілок
    або зміни інструмента/схеми).

    Виправлення: почніть нову сесію за допомогою `/new` (окремим повідомленням).

  </Accordion>

  <Accordion title="Чому я отримую повідомлення heartbeat кожні 30 хвилин?">
    Heartbeat запускаються кожні **30m** за замовчуванням (**1h** при використанні автентифікації OAuth). Налаштуйте або вимкніть їх:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // або "0m", щоб вимкнути
          },
        },
      },
    }
    ```

    Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та заголовки
    Markdown на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб заощадити виклики API.
    Якщо файл відсутній, heartbeat усе одно запускається, і модель сама вирішує, що робити.

    Override для окремого agent використовують `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "обліковий запис бота" до групи WhatsApp?'>
    Ні. OpenClaw працює з **вашим власним обліковим записом**, тож якщо ви є в групі, OpenClaw може її бачити.
    За замовчуванням відповіді в групах заблоковані, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

    Якщо ви хочете, щоб відповіді в групі міг ініціювати лише **ви**:

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Як отримати JID групи WhatsApp?">
    Варіант 1 (найшвидший): переглядайте логи в реальному часі й надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Шукайте `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/додано в allowlist): перелічіть групи з конфігурації:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/uk/cli/directory), [Logs](/uk/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Дві поширені причини:

    - Увімкнено перевірку згадок (за замовчуванням). Ви маєте згадати бота через @ (або відповідати `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і групу не додано в allowlist.

    Див. [Groups](/uk/channels/groups) і [Group messages](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи спільний контекст у груп/гілок і DM?">
    Прямі чати за замовчуванням згортаються в основну сесію. Групи/канали мають власні ключі сесій, а теми Telegram / гілки Discord — це окремі сесії. Див. [Groups](/uk/channels/groups) і [Group messages](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки workspace і agents я можу створити?">
    Жорстких обмежень немає. Десятки (і навіть сотні) — це нормально, але звертайте увагу на:

    - **Зростання диска:** sessions + транскрипти зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартість токенів:** більше agents означає більше одночасного використання моделей.
    - **Операційні накладні витрати:** профілі автентифікації для окремих agents, workspace і маршрутизація каналів.

    Поради:

    - Зберігайте один **активний** workspace на кожного agent (`agents.defaults.workspace`).
    - Очищуйте старі sessions (видаляйте JSONL або записи сховища), якщо диск розростається.
    - Використовуйте `openclaw doctor`, щоб виявляти зайві workspace і невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька ботів або чатів одночасно (Slack), і як це краще налаштувати?">
    Так. Використовуйте **Multi-Agent Routing**, щоб запускати кілька ізольованих agents і маршрутизувати вхідні повідомлення за
    channel/account/peer. Slack підтримується як канал і може бути прив’язаний до конкретних agents.

    Доступ до браузера потужний, але це не означає «робити все, що може людина» — anti-bot, CAPTCHA та MFA
    усе ще можуть блокувати автоматизацію. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на хості
    або CDP на машині, яка фактично запускає браузер.

    Рекомендоване налаштування:

    - Хост Gateway, який завжди ввімкнений (VPS/Mac mini).
    - Один agent на роль (bindings).
    - Канал(и) Slack, прив’язані до цих agents.
    - Локальний браузер через Chrome MCP або node за потреби.

    Документація: [Multi-Agent Routing](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Browser](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі, failover і профілі автентифікації

Q&A про моделі — типові значення, вибір, псевдоніми, перемикання, failover, профілі автентифікації —
перенесено на окрему сторінку:
[FAQ — моделі та профілі автентифікації](/uk/help/faq-models).

## Gateway: порти, «вже запущено» і віддалений режим

<AccordionGroup>
  <Accordion title="Який порт використовує Gateway?">
    `gateway.port` керує єдиним мультиплексованим портом для WebSocket + HTTP (Control UI, hooks тощо).

    Пріоритет:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує "Runtime: running", але "Connectivity probe: failed"?'>
    Тому що "running" — це погляд **supervisor** (launchd/systemd/schtasks). А перевірка доступності — це коли CLI реально підключається до WebSocket gateway.

    Використовуйте `openclaw gateway status` і довіряйте таким рядкам:

    - `Probe target:` (URL, який перевірка фактично використала)
    - `Listening:` (що реально прив’язано до порту)
    - `Last gateway error:` (поширена першопричина, коли процес живий, але порт не слухає)

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує різні "Config (cli)" і "Config (service)"?'>
    Ви редагуєте один файл конфігурації, тоді як сервіс працює з іншим (часто через невідповідність `--profile` / `OPENCLAW_STATE_DIR`).

    Виправлення:

    ```bash
    openclaw gateway install --force
    ```

    Запустіть це з тим самим `--profile` / середовищем, яке ви хочете, щоб використовував сервіс.

  </Accordion>

  <Accordion title='Що означає "another gateway instance is already listening"?'>
    OpenClaw примусово забезпечує блокування під час виконання, одразу прив’язуючи listener WebSocket на старті (типово `ws://127.0.0.1:18789`). Якщо прив’язка завершується помилкою `EADDRINUSE`, виникає `GatewayLockError`, що означає: інша інсталяція вже слухає цей порт.

    Виправлення: зупиніть іншу інсталяцію, звільніть порт або запустіть з `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Як запустити OpenClaw у віддаленому режимі (клієнт підключається до Gateway деінде)?">
    Задайте `gateway.mode: "remote"` і вкажіть віддалений URL WebSocket, за потреби також віддалені облікові дані зі спільним секретом:

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    Примітки:

    - `openclaw gateway` запускається лише тоді, коли `gateway.mode` має значення `local` (або ви передаєте прапорець перевизначення).
    - Застосунок macOS стежить за файлом конфігурації й у реальному часі перемикає режими, коли ці значення змінюються.
    - `gateway.remote.token` / `.password` — це лише віддалені облікові дані на боці клієнта; самі по собі вони не вмикають локальну автентифікацію gateway.

  </Accordion>

  <Accordion title='Control UI показує "unauthorized" (або постійно перепідключається). Що тепер?'>
    Шлях автентифікації вашого gateway і метод автентифікації UI не збігаються.

    Факти (з коду):

    - Control UI зберігає токен у `sessionStorage` для поточної сесії вкладки браузера та вибраного URL gateway, тож оновлення в тій самій вкладці продовжують працювати без відновлення довготривалого збереження токена в localStorage.
    - При `AUTH_TOKEN_MISMATCH` довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном пристрою, коли gateway повертає підказки для повторної спроби (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ця повторна спроба з кешованим токеном тепер повторно використовує кешовані схвалені scopes, збережені разом із токеном пристрою. Викликачі з явними `deviceToken` / явними `scopes` і далі зберігають свій запитаний набір scope замість успадкування кешованих scopes.
    - Поза цим шляхом повторної спроби пріоритет автентифікації підключення такий: спочатку явний спільний токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap token.
    - Перевірки scope bootstrap token мають префікс ролі. Вбудований allowlist bootstrap operator задовольняє лише запити operator; для node або інших ролей, які не є operator, усе одно потрібні scopes із префіксом власної ролі.

    Виправлення:

    - Найшвидше: `openclaw dashboard` (виводить і копіює URL dashboard, намагається відкрити; якщо режим headless — показує підказку SSH).
    - Якщо у вас ще немає токена: `openclaw doctor --generate-gateway-token`.
    - Якщо віддалено — спочатку створіть тунель: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`.
    - Режим спільного секрету: задайте `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, а потім вставте відповідний секрет у налаштуваннях Control UI.
    - Режим Tailscale Serve: переконайтеся, що `gateway.auth.allowTailscale` увімкнено і ви відкриваєте URL Serve, а не сирий URL loopback/tailnet, який обходить заголовки ідентичності Tailscale.
    - Режим trusted-proxy: переконайтеся, що ви заходите через налаштований identity-aware proxy не на loopback, а не через proxy loopback на тому самому хості чи сирий URL gateway.
    - Якщо невідповідність зберігається після однієї повторної спроби, виконайте ротацію/повторне схвалення токена сполученого пристрою:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Якщо цей виклик rotate каже, що було відмовлено, перевірте дві речі:
      - сесії сполучених пристроїв можуть виконувати ротацію лише для **власного** пристрою, якщо тільки вони не мають `operator.admin`
      - явні значення `--scope` не можуть перевищувати поточні operator scopes викликача
    - Усе ще застрягли? Запустіть `openclaw status --all` і дотримуйтеся [Troubleshooting](/uk/gateway/troubleshooting). Подробиці автентифікації див. у [Dashboard](/uk/web/dashboard).

  </Accordion>

  <Accordion title="Я встановив gateway.bind tailnet, але прив’язка не працює і нічого не слухає">
    Прив’язка `tailnet` вибирає IP Tailscale з ваших мережевих інтерфейсів (100.64.0.0/10). Якщо машина не в Tailscale (або інтерфейс вимкнено), прив’язуватися просто нікуди.

    Виправлення:

    - Запустіть Tailscale на цьому хості (щоб він отримав адресу 100.x), або
    - Перемкніться на `gateway.bind: "loopback"` / `"lan"`.

    Примітка: `tailnet` — це явний вибір. `auto` віддає перевагу loopback; використовуйте `gateway.bind: "tailnet"`, коли хочете прив’язку лише до tailnet.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька Gateway на одному хості?">
    Зазвичай ні — один Gateway може обслуговувати кілька каналів обміну повідомленнями та agents. Використовуйте кілька Gateway лише тоді, коли вам потрібна надлишковість (наприклад, rescue bot) або жорстка ізоляція.

    Так, але вам треба ізолювати:

    - `OPENCLAW_CONFIG_PATH` (конфігурація для кожної інсталяції)
    - `OPENCLAW_STATE_DIR` (стан для кожної інсталяції)
    - `agents.defaults.workspace` (ізоляція workspace)
    - `gateway.port` (унікальні порти)

    Швидке налаштування (рекомендовано):

    - Використовуйте `openclaw --profile <name> ...` для кожної інсталяції (автоматично створює `~/.openclaw-<name>`).
    - Установіть унікальний `gateway.port` у конфігурації кожного профілю (або передавайте `--port` для ручних запусків).
    - Установіть сервіс для кожного профілю: `openclaw --profile <name> gateway install`.

    Профілі також додають суфікси до назв сервісів (`ai.openclaw.<profile>`; застарілі `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Повний посібник: [Multiple gateways](/uk/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Що означає "invalid handshake" / code 1008?'>
    Gateway — це **сервер WebSocket**, і він очікує, що найперше повідомлення
    буде фреймом `connect`. Якщо він отримує щось інше, то закриває з’єднання
    з **кодом 1008** (порушення політики).

    Поширені причини:

    - Ви відкрили URL **HTTP** у браузері (`http://...`) замість WS-клієнта.
    - Ви використали неправильний порт або шлях.
    - Proxy або тунель видалив заголовки автентифікації або надіслав не-Gateway-запит.

    Швидкі виправлення:

    1. Використовуйте URL WS: `ws://<host>:18789` (або `wss://...`, якщо HTTPS).
    2. Не відкривайте порт WS у звичайній вкладці браузера.
    3. Якщо автентифікацію ввімкнено, включіть токен/пароль у фрейм `connect`.

    Якщо ви використовуєте CLI або TUI, URL має виглядати так:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Подробиці протоколу: [Gateway protocol](/uk/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Логування та налагодження

<AccordionGroup>
  <Accordion title="Де знаходяться логи?">
    Файлові логи (структуровані):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Ви можете задати стабільний шлях через `logging.file`. Рівень файлового логування керується `logging.level`. Деталізація консолі керується `--verbose` і `logging.consoleLevel`.

    Найшвидший перегляд хвоста логів:

    ```bash
    openclaw logs --follow
    ```

    Логи сервісу/supervisor (коли gateway працює через launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` і `gateway.err.log` (типово: `~/.openclaw/logs/...`; профілі використовують `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Докладніше див. в [Troubleshooting](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Як запустити/зупинити/перезапустити сервіс Gateway?">
    Використовуйте допоміжні команди gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви запускаєте gateway вручну, `openclaw gateway --force` може повернути собі порт. Див. [Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Я закрив термінал у Windows — як перезапустити OpenClaw?">
    Є **два режими встановлення у Windows**:

    **1) WSL2 (рекомендовано):** Gateway працює всередині Linux.

    Відкрийте PowerShell, увійдіть у WSL, а потім перезапустіть:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви ніколи не встановлювали сервіс, запустіть його на передньому плані:

    ```bash
    openclaw gateway run
    ```

    **2) Нативний Windows (не рекомендовано):** Gateway працює безпосередньо у Windows.

    Відкрийте PowerShell і виконайте:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви запускаєте його вручну (без сервісу), використовуйте:

    ```powershell
    openclaw gateway run
    ```

    Документація: [Windows (WSL2)](/uk/platforms/windows), [Gateway service runbook](/uk/gateway).

  </Accordion>

  <Accordion title="Gateway працює, але відповіді так і не надходять. Що перевірити?">
    Почніть із швидкої перевірки стану:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Поширені причини:

    - Автентифікація моделі не завантажена на **хості gateway** (перевірте `models status`).
    - Сполучення каналу/allowlist блокує відповіді (перевірте конфігурацію каналу + логи).
    - WebChat/Dashboard відкрито без правильного токена.

    Якщо ви працюєте віддалено, переконайтеся, що тунель/підключення Tailscale активне і
    Gateway WebSocket доступний.

    Документація: [Channels](/uk/channels), [Troubleshooting](/uk/gateway/troubleshooting), [Remote access](/uk/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — що тепер?'>
    Зазвичай це означає, що UI втратив з’єднання WebSocket. Перевірте:

    1. Чи запущено Gateway? `openclaw gateway status`
    2. Чи Gateway справний? `openclaw status`
    3. Чи має UI правильний токен? `openclaw dashboard`
    4. Якщо віддалено, чи активне з’єднання тунелю/Tailscale?

    Потім перегляньте логи в реальному часі:

    ```bash
    openclaw logs --follow
    ```

    Документація: [Dashboard](/uk/web/dashboard), [Remote access](/uk/gateway/remote), [Troubleshooting](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Помилка Telegram setMyCommands. Що перевірити?">
    Почніть із логів і стану каналу:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Потім звірте помилку:

    - `BOT_COMMANDS_TOO_MUCH`: у меню Telegram забагато записів. OpenClaw вже обрізає список до ліміту Telegram і повторює спробу з меншою кількістю команд, але деякі записи меню все одно потрібно прибрати. Зменште кількість команд plugin/skill/custom або вимкніть `channels.telegram.commands.native`, якщо меню вам не потрібне.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` або подібні мережеві помилки: якщо ви на VPS або за proxy, переконайтеся, що вихідний HTTPS дозволено і DNS працює для `api.telegram.org`.

    Якщо Gateway віддалений, переконайтеся, що ви дивитеся логи на хості Gateway.

    Документація: [Telegram](/uk/channels/telegram), [Channel troubleshooting](/uk/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI не показує виводу. Що перевірити?">
    Спочатку переконайтеся, що Gateway доступний і agent може працювати:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    У TUI використовуйте `/status`, щоб побачити поточний стан. Якщо ви очікуєте відповіді в чаті
    каналу, переконайтеся, що доставку ввімкнено (`/deliver on`).

    Документація: [TUI](/uk/web/tui), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як повністю зупинити, а потім знову запустити Gateway?">
    Якщо ви встановили сервіс:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Це зупиняє/запускає **керований сервіс** (launchd на macOS, systemd на Linux).
    Використовуйте це, коли Gateway працює у фоновому режимі як daemon.

    Якщо ви запускаєте його на передньому плані, зупиніть через Ctrl-C, а потім:

    ```bash
    openclaw gateway run
    ```

    Документація: [Gateway service runbook](/uk/gateway).

  </Accordion>

  <Accordion title="Поясніть просто: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: перезапускає **фоновий сервіс** (launchd/systemd).
    - `openclaw gateway`: запускає gateway **на передньому плані** для цієї сесії термінала.

    Якщо ви встановили сервіс, використовуйте команди gateway. Використовуйте `openclaw gateway`, коли
    вам потрібен разовий запуск на передньому плані.

  </Accordion>

  <Accordion title="Найшвидший спосіб отримати більше деталей, коли щось ламається">
    Запустіть Gateway з `--verbose`, щоб отримати детальніший вивід у консолі. Потім перегляньте файл логів на предмет автентифікації каналу, маршрутизації моделі та помилок RPC.
  </Accordion>
</AccordionGroup>

## Медіа та вкладення

<AccordionGroup>
  <Accordion title="Мій skill згенерував зображення/PDF, але нічого не було надіслано">
    Вихідні вкладення від agent мають містити рядок `MEDIA:<path-or-url>` (в окремому рядку). Див. [OpenClaw assistant setup](/uk/start/openclaw) і [Agent send](/uk/tools/agent-send).

    Надсилання через CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Також перевірте:

    - Цільовий канал підтримує вихідні медіа й не заблокований allowlist.
    - Файл укладається в обмеження розміру провайдера (зображення змінюються до максимуму 2048px).
    - `tools.fs.workspaceOnly=true` обмежує надсилання локальних шляхів workspace, temp/media-store і файлами, перевіреними через sandbox.
    - `tools.fs.workspaceOnly=false` дозволяє `MEDIA:` надсилати локальні файли хоста, які agent уже може читати, але лише для медіа та безпечних типів документів (зображення, аудіо, відео, PDF і документи Office). Звичайний текст і файли, схожі на секрети, як і раніше блокуються.

    Див. [Images](/uk/nodes/images).

  </Accordion>
</AccordionGroup>

## Безпека та контроль доступу

<AccordionGroup>
  <Accordion title="Чи безпечно відкривати OpenClaw для вхідних DM?">
    Ставтеся до вхідних DM як до недовіреного вводу. Типові значення налаштовані так, щоб зменшити ризик:

    - Типова поведінка на каналах, що підтримують DM, — **сполучення**:
      - Невідомі відправники отримують код сполучення; бот не обробляє їхнє повідомлення.
      - Схвалення: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Кількість очікувальних запитів обмежена **3 на канал**; перевірте `openclaw pairing list --channel <channel> [--account <id>]`, якщо код не надійшов.
    - Відкриття DM публічно потребує явної згоди (`dmPolicy: "open"` і allowlist `"*"`).

    Запустіть `openclaw doctor`, щоб виявити ризиковані політики DM.

  </Accordion>

  <Accordion title="Чи стосується prompt injection лише публічних ботів?">
    Ні. Prompt injection стосується **недовіреного вмісту**, а не лише того, хто може писати боту в DM.
    Якщо ваш assistant читає зовнішній вміст (web search/fetch, сторінки браузера, листи,
    документи, вкладення, вставлені логи), цей вміст може містити інструкції, які намагаються
    перехопити модель. Це може статися навіть якщо **ви єдиний відправник**.

    Найбільший ризик виникає, коли ввімкнені інструменти: модель можна обдурити й змусити
    ексфільтрувати контекст або викликати інструменти від вашого імені. Зменшуйте зону ураження, якщо:

    - використовуєте agent «читача» лише для читання або без інструментів, щоб підсумовувати недовірений вміст
    - тримаєте `web_search` / `web_fetch` / `browser` вимкненими для agents з увімкненими інструментами
    - ставитеся до декодованого тексту файлів/документів також як до недовіреного: OpenResponses
      `input_file` і витягування тексту з медіавкладень обгортають витягнутий текст
      у явні маркери меж зовнішнього вмісту замість передачі сирого тексту файла
    - використовуєте sandbox і суворі allowlist інструментів

    Подробиці: [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи повинен мій бот мати власну електронну пошту, GitHub-акаунт або номер телефону?">
    Так, для більшості сценаріїв. Ізоляція бота окремими обліковими записами й номерами телефону
    зменшує зону ураження, якщо щось піде не так. Також це спрощує ротацію
    облікових даних або відкликання доступу без впливу на ваші особисті акаунти.

    Починайте з малого. Надавайте доступ лише до тих інструментів і акаунтів, які вам справді потрібні, а розширюйте
    пізніше, якщо буде потрібно.

    Документація: [Security](/uk/gateway/security), [Pairing](/uk/channels/pairing).

  </Accordion>

  <Accordion title="Чи можу я надати йому автономію над моїми текстовими повідомленнями і чи це безпечно?">
    Ми **не** рекомендуємо повну автономію над вашими особистими повідомленнями. Найбезпечніший шаблон:

    - Тримайте DM у режимі **сполучення** або під суворим allowlist.
    - Використовуйте **окремий номер або обліковий запис**, якщо хочете, щоб він писав від вашого імені.
    - Дозвольте йому створити чернетку, а потім **схваліть перед надсиланням**.

    Якщо хочете поекспериментувати, робіть це на окремому акаунті й тримайте його ізольованим. Див.
    [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи можу я використовувати дешевші моделі для завдань персонального асистента?">
    Так, **якщо** agent працює лише в чаті, а вхідні дані є довіреними. Менші моделі
    більш вразливі до перехоплення інструкцій, тому уникайте їх для agents з інструментами
    або під час читання недовіреного вмісту. Якщо вам все ж потрібна менша модель, жорстко обмежте
    інструменти й запускайте всередині sandbox. Див. [Security](/uk/gateway/security).
  </Accordion>

  <Accordion title="Я запустив /start у Telegram, але не отримав код сполучення">
    Коди сполучення надсилаються **лише** тоді, коли невідомий відправник пише боту і
    ввімкнено `dmPolicy: "pairing"`. Сам по собі `/start` не генерує код.

    Перевірте очікувальні запити:

    ```bash
    openclaw pairing list telegram
    ```

    Якщо вам потрібен негайний доступ, додайте свій sender id в allowlist або встановіть `dmPolicy: "open"`
    для цього облікового запису.

  </Accordion>

  <Accordion title="WhatsApp: чи буде він писати моїм контактам? Як працює сполучення?">
    Ні. Типова політика WhatsApp DM — **сполучення**. Невідомі відправники отримують лише код сполучення, а їхнє повідомлення **не обробляється**. OpenClaw відповідає лише на чати, які отримує, або на явні надсилання, які ініціюєте ви.

    Схвалення сполучення:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Список очікувальних запитів:

    ```bash
    openclaw pairing list whatsapp
    ```

    Запит номера телефону у wizard: він використовується для налаштування вашого **allowlist/owner**, щоб ваші власні DM були дозволені. Він не використовується для автоматичного надсилання. Якщо ви працюєте зі своїм особистим номером WhatsApp, використовуйте цей номер і ввімкніть `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Команди чату, переривання завдань і «воно не зупиняється»

<AccordionGroup>
  <Accordion title="Як прибрати внутрішні системні повідомлення з чату?">
    Більшість внутрішніх або службових повідомлень з’являються лише тоді, коли для цієї сесії ввімкнено **verbose**, **trace** або **reasoning**.

    Виправлення в чаті, де ви це бачите:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Якщо все ще надто шумно, перевірте налаштування сесії в Control UI і встановіть verbose
    у значення **inherit**. Також переконайтеся, що ви не використовуєте профіль бота, де `verboseDefault` у конфігурації встановлено
    в `on`.

    Документація: [Thinking and verbose](/uk/tools/thinking), [Security](/uk/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Як зупинити/скасувати запущене завдання?">
    Надішліть будь-що з цього **як окреме повідомлення** (без слеша):

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    Це тригери переривання (а не slash commands).

    Для фонових процесів (з інструмента exec) ви можете попросити agent виконати:

    ```
    process action:kill sessionId:XXX
    ```

    Огляд slash commands: див. [Slash commands](/uk/tools/slash-commands).

    Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`, але деякі скорочення (наприклад, `/status`) також працюють inline для відправників з allowlist.

  </Accordion>

  <Accordion title='Як надіслати повідомлення Discord із Telegram? ("Cross-context messaging denied")'>
    OpenClaw блокує повідомлення **між різними провайдерами** за замовчуванням. Якщо виклик інструмента прив’язаний
    до Telegram, він не надсилатиме в Discord, доки ви явно цього не дозволите.

    Увімкніть міжпровайдерний обмін повідомленнями для agent:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    Після редагування конфігурації перезапустіть gateway.

  </Accordion>

  <Accordion title='Чому здається, що бот "ігнорує" серію швидких повідомлень?'>
    Режим черги визначає, як нові повідомлення взаємодіють із уже запущеним виконанням. Використовуйте `/queue`, щоб змінити режими:

    - `steer` - нові повідомлення перенаправляють поточне завдання
    - `followup` - запускати повідомлення по одному
    - `collect` - накопичувати повідомлення й відповідати один раз (типово)
    - `steer-backlog` - перенаправити зараз, а потім обробити чергу
    - `interrupt` - перервати поточне виконання й почати заново

    Ви можете додавати параметри на кшталт `debounce:2s cap:25 drop:summarize` для режимів followup.

  </Accordion>
</AccordionGroup>

## Різне

<AccordionGroup>
  <Accordion title='Яка типова модель для Anthropic з ключем API?'>
    В OpenClaw облікові дані й вибір моделі розділені. Установлення `ANTHROPIC_API_KEY` (або збереження ключа API Anthropic у профілях автентифікації) вмикає автентифікацію, але фактична типова модель — це та, яку ви налаштували в `agents.defaults.model.primary` (наприклад, `anthropic/claude-sonnet-4-6` або `anthropic/claude-opus-4-6`). Якщо ви бачите `No credentials found for profile "anthropic:default"`, це означає, що Gateway не зміг знайти облікові дані Anthropic в очікуваному `auth-profiles.json` для agent, який зараз виконується.
  </Accordion>
</AccordionGroup>

---

Усе ще не виходить? Запитайте в [Discord](https://discord.com/invite/clawd) або відкрийте [обговорення GitHub](https://github.com/openclaw/openclaw/discussions).

## Пов’язане

- [FAQ — швидкий старт і початкове налаштування](/uk/help/faq-first-run)
- [FAQ — моделі та профілі автентифікації](/uk/help/faq-models)
- [Усунення проблем](/uk/help/troubleshooting)
