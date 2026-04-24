---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час виконання
    - Сортування проблем, про які повідомили користувачі, перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-24T07:11:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ae635d7ade265e3e79d1f5489ae23034a341843bd784f68a985b18bee5bdf6f
    source_path: help/faq.md
    workflow: 15
---

Швидкі відповіді плюс глибше усунення несправностей для реальних сценаріїв налаштування (локальна розробка, VPS, multi-agent, OAuth/API keys, резервне перемикання моделей). Для діагностики під час виконання див. [Усунення несправностей](/uk/gateway/troubleshooting). Повний довідник з конфігурації див. у [Конфігурація](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламано

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидке локальне зведення: ОС + оновлення, доступність gateway/сервісу, агенти/сесії, конфігурація провайдера + проблеми під час виконання (коли Gateway доступний).

2. **Звіт, який можна вставити та надіслати (безпечний для поширення)**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з хвостом логу (токени замасковано).

3. **Стан демона + порту**

   ```bash
   openclaw gateway status
   ```

   Показує runtime supervisor-а порівняно з доступністю RPC, URL цілі для probe та яку конфігурацію сервіс, імовірно, використав.

4. **Глибокі probe-перевірки**

   ```bash
   openclaw status --deep
   ```

   Виконує live probe-перевірку здоров’я gateway, включно з channel probe-перевірками, коли це підтримується
   (потрібен доступний Gateway). Див. [Health](/uk/gateway/health).

5. **Перегляньте хвіст останнього логу**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використайте запасний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Логи файлів відокремлені від логів сервісу; див. [Логування](/uk/logging) і [Усунення несправностей](/uk/gateway/troubleshooting).

6. **Запустіть doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує конфігурацію/стан + запускає перевірки здоров’я. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок стану Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Запитує в запущеного gateway повний знімок стану (лише WS). Див. [Health](/uk/gateway/health).

## Швидкий старт і початкове налаштування

Запитання й відповіді для першого запуску — встановлення, онбординг, шляхи автентифікації, підписки, початкові збої —
розміщено в [FAQ для першого запуску](/uk/help/faq-first-run).

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw, в одному абзаці?">
    OpenClaw — це персональний AI-асистент, який ви запускаєте на власних пристроях. Він відповідає в тих поверхнях обміну повідомленнями, якими ви вже користуєтеся (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, а також bundled channel plugins, наприклад QQ Bot) і також може працювати з голосом + live Canvas на підтримуваних платформах. **Gateway** — це завжди увімкнена control plane; асистент — це продукт.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не «просто обгортка для Claude». Це **local-first control plane**, яка дає змогу запускати
    потужного асистента на **вашому власному обладнанні**, доступного з чат-застосунків, якими ви вже користуєтеся, зі
    сесіями зі станом, пам’яттю та інструментами — без передавання контролю над вашими робочими процесами
    хмарному SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і зберігайте
      робочий простір + історію сесій локально.
    - **Реальні канали, а не веб-пісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      а також мобільний голос і Canvas на підтримуваних платформах.
    - **Не прив’язано до моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо, з маршрутизацією
      та резервним перемиканням для кожного агента.
    - **Варіант лише локально:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо ви цього хочете.
    - **Маршрутизація multi-agent:** окремі агенти для кожного каналу, облікового запису чи завдання, кожен зі своїм
      робочим простором і типовими параметрами.
    - **Відкритий код і гнучкість для модифікацій:** перевіряйте, розширюйте та self-host без прив’язки до постачальника.

    Документація: [Gateway](/uk/gateway), [Канали](/uk/channels), [Multi-agent](/uk/concepts/multi-agent),
    [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував(-ла) — що мені зробити спочатку?">
    Хороші перші проєкти:

    - Створити вебсайт (WordPress, Shopify або простий статичний сайт).
    - Створити прототип мобільного застосунку (структура, екрани, план API).
    - Упорядкувати файли та папки (очищення, найменування, теги).
    - Підключити Gmail і автоматизувати зведення або подальші дії.

    Він може впоратися з великими завданнями, але працює найкраще, коли ви розбиваєте їх на етапи й
    використовуєте sub agents для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найпоширеніших повсякденних сценаріїв використання OpenClaw?">
    Найчастіші повсякденні переваги виглядають так:

    - **Персональні брифінги:** зведення вхідних листів, календаря та важливих для вас новин.
    - **Дослідження та підготовка чернеток:** швидке дослідження, підсумки та перші чернетки для листів або документів.
    - **Нагадування та подальші дії:** підказки й чеклісти, керовані cron або heartbeat.
    - **Автоматизація браузера:** заповнення форм, збирання даних і повторення вебзавдань.
    - **Координація між пристроями:** надішліть завдання з телефона, дайте Gateway виконати його на сервері й отримайте результат назад у чаті.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з лідогенерацією, аутрічем, рекламою та блогами для SaaS?">
    Так — для **дослідження, кваліфікації та підготовки чернеток**. Він може сканувати сайти, формувати короткі списки,
    підсумовувати інформацію про потенційних клієнтів і писати чернетки аутрічу або рекламних текстів.

    Для **аутрічу чи запуску реклами** залишайте людину в циклі ухвалення рішень. Уникайте спаму, дотримуйтеся місцевих законів і
    політик платформ, а також перевіряйте все перед надсиланням. Найбезпечніший шаблон — дозволити
    OpenClaw створити чернетку, а вам — затвердити її.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний асистент** і шар координації, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу кодування в репозиторії. Використовуйте OpenClaw, коли вам
    потрібні довготривала пам’ять, доступ із різних пристроїв і оркестрація інструментів.

    Переваги:

    - **Постійна пам’ять + робочий простір** між сесіями
    - **Доступ із різних платформ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (браузер, файли, планування, hooks)
    - **Постійно увімкнений Gateway** (запускайте на VPS, взаємодійте звідусіль)
    - **Nodes** для локального браузера/екрана/камери/виконання

    Вітрина: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills і автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати skills, не забруднюючи репозиторій?">
    Використовуйте керовані overrides замість редагування копії в репозиторії. Помістіть свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, тому керовані overrides все одно мають вищий пріоритет за bundled skills без змін у git. Якщо skill має бути встановлений глобально, але видимий лише деяким агентам, зберігайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` та `agents.list[].skills`. Лише зміни, варті внесення в основний проєкт, мають зберігатися в репозиторії та надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати skills із власної папки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий порядок пріоритету: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` типово встановлює в `./skills`, що OpenClaw розпізнає як `<workspace>/skills` у наступній сесії. Якщо skill має бути видимий лише певним агентам, поєднайте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як використовувати різні моделі для різних завдань?">
    Наразі підтримуються такі шаблони:

    - **Cron jobs**: ізольовані завдання можуть задавати override `model` для кожного завдання.
    - **Sub-agents**: маршрутизуйте завдання до окремих агентів із різними типовими моделями.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб у будь-який момент змінити модель поточної сесії.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent) і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як винести це окремо?">
    Використовуйте **sub-agents** для довгих або паралельних завдань. Sub-agents працюють у власній сесії,
    повертають підсумок і не дають вашому основному чату зависати.

    Попросіть свого бота «створити sub-agent для цього завдання» або використайте `/subagents`.
    Використовуйте `/status` у чаті, щоб побачити, що Gateway зараз робить (і чи зайнятий він).

    Порада щодо токенів: і довгі завдання, і sub-agents споживають токени. Якщо вартість має значення, задайте
    дешевшу модель для sub-agents через `agents.defaults.subagents.model`.

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють сесії subagent, прив’язані до тредів, у Discord?">
    Використовуйте прив’язки тредів. Ви можете прив’язати тред Discord до subagent або цілі сесії, щоб подальші повідомлення в цьому треді залишалися в межах прив’язаної сесії.

    Базовий процес:

    - Створіть через `sessions_spawn` з `thread: true` (і за потреби `mode: "session"` для постійших подальших повідомлень).
    - Або прив’яжіть вручну через `/focus <target>`.
    - Використовуйте `/agents`, щоб переглянути стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним зняттям фокуса.
    - Використовуйте `/unfocus`, щоб відв’язати тред.

    Потрібна конфігурація:

    - Глобальні типові параметри: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Overrides для Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоприв’язка під час створення: установіть `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agents](/uk/tools/subagents), [Discord](/uk/channels/discord), [Configuration Reference](/uk/gateway/configuration-reference), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent завершив роботу, але сповіщення про завершення пішло не туди або взагалі не з’явилося. Що перевірити?">
    Спочатку перевірте визначений маршрут запитувача:

    - Доставка subagent у режимі завершення надає перевагу будь-якому прив’язаному треду або маршруту розмови, якщо такий існує.
    - Якщо джерело завершення містить лише канал, OpenClaw повертається до збереженого маршруту сесії запитувача (`lastChannel` / `lastTo` / `lastAccountId`), щоб пряма доставка все одно могла спрацювати.
    - Якщо немає ані прив’язаного маршруту, ані придатного збереженого маршруту, пряма доставка може не вдатися, і тоді результат повернеться до queued session delivery замість негайної публікації в чаті.
    - Недійсні або застарілі цілі все ще можуть примусово перевести в queue fallback або спричинити остаточний збій доставки.
    - Якщо остання видима відповідь асистента від дочірнього процесу — це точний silent token `NO_REPLY` / `no_reply` або точно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує анонс замість публікації застарілого попереднього прогресу.
    - Якщо дочірній процес досяг тайм-ауту після одних лише викликів інструментів, анонс може згорнути це в короткий підсумок часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks), [Session Tools](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron виконується всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання не виконуватимуться.

    Контрольний список:

    - Підтвердьте, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не встановлено.
    - Переконайтеся, що Gateway працює 24/7 (без сну/перезапусків).
    - Перевірте налаштування часового поясу для завдання (`--tz` проти часового поясу хоста).

    Налагодження:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Cron спрацював, але в канал нічого не було надіслано. Чому?">
    Спочатку перевірте режим доставки:

    - `--no-deliver` / `delivery.mode: "none"` означає, що запасне надсилання через runner не очікується.
    - Відсутня або недійсна ціль анонсу (`channel` / `to`) означає, що runner пропустив вихідну доставку.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що runner спробував виконати доставку, але облікові дані це заблокували.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` і нічого більше) вважається навмисно недоставним, тому runner також пригнічує запасну доставку через чергу.

    Для ізольованих Cron jobs агент усе ще може надсилати повідомлення напряму через інструмент `message`,
    коли доступний маршрут чату. `--announce` керує лише запасним шляхом runner-а
    для фінального тексту, який агент ще не надіслав самостійно.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований запуск cron змінив модель або виконав одну повторну спробу?">
    Зазвичай це шлях live-перемикання моделі, а не дубльоване планування.

    Ізольований Cron може зберегти runtime-передавання моделі й виконати повторну спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає перемкнуті
    провайдер/модель, а якщо перемикання також містило новий override профілю автентифікації, cron
    теж зберігає його перед повторною спробою.

    Пов’язані правила вибору:

    - Override моделі Gmail hook має найвищий пріоритет, коли застосовний.
    - Далі — `model` для конкретного завдання.
    - Потім — будь-який збережений override моделі cron-session.
    - Потім — звичайний вибір моделі агента/типової моделі.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 повторних спроб через перемикання
    cron припиняє роботу замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [cron CLI](/uk/cli/cron).

  </Accordion>

  <Accordion title="Як установити Skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або помістіть Skills у свій workspace. UI Skills для macOS недоступний на Linux.
    Переглянути Skills можна на [https://clawhub.ai](https://clawhub.ai).

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

    Нативний `openclaw skills install` записує у каталог `skills/`
    активного workspace. Окремий CLI `clawhub` встановлюйте лише якщо хочете публікувати або
    синхронізувати власні Skills. Для спільних встановлень між агентами помістіть skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете обмежити, які агенти можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати завдання за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Cron jobs** для запланованих або повторюваних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок «основної сесії».
    - **Ізольовані завдання** для автономних агентів, які публікують підсумки або доставляють їх у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати Apple macOS-only Skills з Linux?">
    Не безпосередньо. Skills для macOS обмежуються через `metadata.openclaw.os` і необхідні бінарні файли, а Skills з’являються в системному prompt лише тоді, коли вони придатні на **хості Gateway**. У Linux Skills лише для `darwin` (наприклад, `apple-notes`, `apple-reminders`, `things-mac`) не завантажаться, якщо не перевизначити це обмеження.

    Є три підтримувані варіанти:

    **Варіант A — запустити Gateway на Mac (найпростіше).**
    Запустіть Gateway там, де існують бінарні файли macOS, а потім підключайтеся з Linux у [віддаленому режимі](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажаться нормально, тому що хост Gateway — macOS.

    **Варіант B — використати macOS node (без SSH).**
    Запустіть Gateway на Linux, спарте macOS node (застосунок рядка меню) і встановіть для **Node Run Commands** значення "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати macOS-only Skills придатними, коли потрібні бінарні файли існують на node. Агент запускає ці Skills через інструмент `nodes`. Якщо ви оберете "Always Ask", підтвердження "Always Allow" у prompt додасть цю команду до списку дозволених.

    **Варіант C — проксувати бінарні файли macOS через SSH (для досвідчених користувачів).**
    Залиште Gateway на Linux, але зробіть так, щоб потрібні CLI-бінарні файли резолвилися у SSH-обгортки, які запускаються на Mac. Потім перевизначте skill, щоб дозволити Linux і він залишався придатним.

    1. Створіть SSH-обгортку для бінарного файла (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Додайте обгортку до `PATH` на Linux-хості (наприклад, `~/bin/memo`).
    3. Перевизначте метадані skill-а (у workspace або `~/.openclaw/skills`), щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Почніть нову сесію, щоб знімок Skills оновився.

  </Accordion>

  <Accordion title="У вас є інтеграція з Notion або HeyGen?">
    Вбудованої інтеграції наразі немає.

    Варіанти:

    - **Власний skill / Plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Автоматизація браузера:** працює без коду, але повільніше й менш надійно.

    Якщо ви хочете зберігати контекст окремо для кожного клієнта (агентські робочі процеси), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + уподобання + активна робота).
    - Попросіть агента отримувати цю сторінку на початку сесії.

    Якщо вам потрібна нативна інтеграція, створіть запит на нову функцію або побудуйте skill,
    орієнтований на ці API.

    Установлення Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активного workspace. Для спільних Skills між агентами
    розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі агенти,
    налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі Skills очікують бінарні файли,
    встановлені через Homebrew; на Linux це означає Linuxbrew (див. відповідний запис FAQ про Homebrew для Linux вище). Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати вже авторизований Chrome з OpenClaw?">
    Використовуйте вбудований профіль браузера `user`, який підключається через Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Якщо хочете власну назву, створіть явний профіль MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Цей шлях може використовувати браузер локального хоста або підключений browser node. Якщо Gateway працює в іншому місці, або запустіть node host на машині з браузером, або натомість використовуйте віддалений CDP.

    Поточні обмеження `existing-session` / `user`:

    - дії виконуються на основі ref, а не CSS-селекторів
    - завантаження файлів потребує `ref` / `inputRef` і наразі підтримує лише один файл за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії все ще потребують керованого браузера або сирого профілю CDP

  </Accordion>
</AccordionGroup>

## Ізоляція та пам’ять

<AccordionGroup>
  <Accordion title="Чи є окрема документація про ізоляцію?">
    Так. Див. [Ізоляція](/uk/gateway/sandboxing). Для налаштування, специфічного для Docker (повний gateway у Docker або образи ізоляції), див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повну функціональність?">
    Типовий образ орієнтований насамперед на безпеку й запускається від користувача `node`, тому не
    містить системних пакетів, Homebrew або вбудованих браузерів. Для повнішого налаштування:

    - Збережіть `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші не втрачалися.
    - Вбудуйте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Установіть браузери Playwright через вбудований CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Установіть `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я зберегти особисті DM приватними, але зробити групи публічними/ізольованими з одним агентом?">
    Так — якщо ваш приватний трафік це **DM**, а публічний трафік — **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб групові/канальні сесії (ключі не `main`) запускалися у налаштованому backend ізоляції, тоді як основна DM-сесія залишатиметься на хості. Docker — типовий backend, якщо ви не виберете інший. Потім обмежте інструменти, доступні в ізольованих сесіях, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: особисті DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Довідник з основної конфігурації: [Конфігурація Gateway](/uk/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати папку хоста до ізоляції?">
    Установіть `agents.defaults.sandbox.docker.binds` у `["host:path:mode"]` (наприклад, `"/home/user/src:/src:ro"`). Глобальні прив’язки та прив’язки для конкретного агента об’єднуються; прив’язки для конкретного агента ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого й пам’ятайте, що прив’язки обходять файлові стіни ізоляції.

    OpenClaw перевіряє джерела прив’язки як за нормалізованим шляхом, так і за канонічним шляхом, визначеним через найглибший наявний предок. Це означає, що виходи через батьківські symlink усе одно надійно блокуються, навіть коли останній сегмент шляху ще не існує, а перевірки дозволених коренів усе одно застосовуються після резолюції symlink.

    Див. [Ізоляція](/uk/gateway/sandboxing#custom-bind-mounts) і [Ізоляція vs Політика інструментів vs Підвищені привілеї](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) для прикладів і приміток щодо безпеки.

  </Accordion>

  <Accordion title="Як працює пам’ять?">
    Пам’ять OpenClaw — це просто Markdown-файли в workspace агента:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Відібрані довгострокові нотатки в `MEMORY.md` (лише основні/приватні сесії)

    OpenClaw також запускає **тихий flush пам’яті перед Compaction**, щоб нагадати моделі
    записати довготривалі нотатки перед автоматичною Compaction. Це працює лише тоді, коли workspace
    доступний для запису (ізольовані середовища лише для читання пропускають це). Див. [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Пам’ять постійно забуває речі. Як зробити так, щоб вони зберігалися?">
    Попросіть бота **записати факт у пам’ять**. Довготривалі нотатки мають зберігатися в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще напрям, який ми вдосконалюємо. Корисно нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона продовжує забувати, перевірте, що Gateway використовує той самий
    workspace під час кожного запуску.

    Документація: [Пам’ять](/uk/concepts/memory), [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається пам’ять назавжди? Які є обмеження?">
    Файли пам’яті живуть на диску й зберігаються, доки ви їх не видалите. Обмеженням є
    ваше сховище, а не модель. **Контекст сесії** все одно обмежується вікном контексту
    моделі, тому довгі розмови можуть стискатися або обрізатися. Саме тому існує
    пошук пам’яті — він повертає в контекст лише релевантні частини.

    Документація: [Пам’ять](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потрібен ключ OpenAI API для семантичного пошуку в пам’яті?">
    Лише якщо ви використовуєте **OpenAI embeddings**. Codex OAuth покриває chat/completions і
    **не** надає доступу до embeddings, тому **вхід через Codex (OAuth або
    вхід через Codex CLI)** не допомагає для семантичного пошуку в пам’яті. OpenAI embeddings
    усе одно потребують справжнього API key (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви явно не задаєте провайдера, OpenClaw автоматично вибирає провайдера, коли
    може визначити API key (профілі автентифікації, `models.providers.*.apiKey` або env vars).
    Він надає перевагу OpenAI, якщо доступний ключ OpenAI, інакше Gemini, якщо доступний ключ Gemini,
    потім Voyage, потім Mistral. Якщо жоден віддалений ключ недоступний, пошук у пам’яті
    залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштовано й доступний
    шлях до локальної моделі, OpenClaw
    надає перевагу `local`. Ollama підтримується, якщо ви явно задаєте
    `memorySearch.provider = "ollama"`.

    Якщо ви хочете залишатися локально, установіть `memorySearch.provider = "local"` (і за потреби
    `memorySearch.fallback = "none"`). Якщо ви хочете embeddings Gemini, задайте
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо моделі embeddings **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    деталі налаштування див. у [Пам’ять](/uk/concepts/memory).

  </Accordion>
</AccordionGroup>

## Де що зберігається на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, що використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** сесії, файли пам’яті, конфігурація та workspace живуть на хості Gateway
      (`~/.openclaw` + каталог вашого workspace).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте провайдерам моделей (Anthropic/OpenAI/etc.), потрапляють до
      їхніх API, а чат-платформи (WhatsApp/Telegram/Slack/etc.) зберігають дані повідомлень на
      своїх серверах.
    - **Ви контролюєте обсяг:** використання локальних моделей залишає prompt-и на вашій машині, але трафік каналів
      усе одно проходить через сервери відповідного каналу.

    Пов’язано: [Workspace агента](/uk/concepts/agent-workspace), [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе зберігається в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Path                                                            | Призначення                                                        |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основна конфігурація (JSON5)                                       |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Імпорт застарілого OAuth (копіюється в профілі автентифікації під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Профілі автентифікації (OAuth, API keys і необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язкове файлове сховище секретів для провайдерів SecretRef типу `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Файл сумісності зі застарілими версіями (статичні записи `api_key` очищаються) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдера (наприклад, `whatsapp/<accountId>/creds.json`)     |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан для кожного агента (agentDir + сесії)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (для кожного агента)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані сесій (для кожного агента)                                |

    Застарілий шлях для одного агента: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`).

    Ваш **workspace** (`AGENTS.md`, файли пам’яті, Skills тощо) зберігається окремо й налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають зберігатися AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли зберігаються у **workspace агента**, а не в `~/.openclaw`.

    - **Workspace (для кожного агента)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, необов’язково `HEARTBEAT.md`.
      Кореневий `memory.md` у нижньому регістрі — лише вхід для відновлення сумісності зі старими версіями; `openclaw doctor --fix`
      може об’єднати його в `MEMORY.md`, коли існують обидва файли.
    - **Каталог стану (`~/.openclaw`)**: конфігурація, стан каналів/провайдерів, профілі автентифікації, сесії, логи
      і спільні Skills (`~/.openclaw/skills`).

    Типовий workspace — `~/.openclaw/workspace`, налаштовується через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот «забуває» після перезапуску, переконайтеся, що Gateway використовує той самий
    workspace під час кожного запуску (і пам’ятайте: віддалений режим використовує workspace **хоста gateway**,
    а не вашого локального ноутбука).

    Порада: якщо ви хочете зберегти тривалу поведінку або вподобання, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладайтеся на історію чату.

    Див. [Workspace агента](/uk/concepts/agent-workspace) і [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Зберігайте свій **workspace агента** у **приватному** git-репозиторії та робіть резервні копії в
    приватному місці (наприклад, GitHub private). Це збереже пам’ять + файли AGENTS/SOUL/USER
    і дасть змогу пізніше відновити «розум» асистента.

    **Не** комітьте нічого з `~/.openclaw` (облікові дані, сесії, токени або зашифровані корисні навантаження секретів).
    Якщо вам потрібне повне відновлення, окремо створюйте резервні копії і workspace, і каталогу стану
    (див. питання про міграцію вище).

    Документація: [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окремий посібник: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть агенти працювати поза workspace?">
    Так. Workspace — це **типовий cwd** і якір пам’яті, а не жорстка ізоляція.
    Відносні шляхи розв’язуються всередині workspace, але абсолютні шляхи можуть звертатися до інших
    розташувань хоста, якщо не ввімкнено ізоляцію. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування ізоляції для конкретного агента. Якщо ви
    хочете, щоб репозиторій був типовим робочим каталогом, укажіть
    `workspace` цього агента як корінь репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
    workspace окремо, якщо тільки ви навмисно не хочете, щоб агент працював усередині нього.

    Приклад (repo як типовий cwd):

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

  <Accordion title="Віддалений режим: де зберігаються сесії?">
    Станом сесій володіє **хост gateway**. Якщо ви працюєте у віддаленому режимі, сховище сесій, яке вам потрібне, розташоване на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="Який формат має конфігурація? Де вона знаходиться?">
    OpenClaw читає необов’язкову конфігурацію у форматі **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються достатньо безпечні типові значення (зокрема типовий workspace `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я встановив gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Bind-адреси не loopback **потребують дійсного шляху автентифікації gateway**. На практиці це означає:

    - автентифікація за спільним секретом: токен або пароль
    - `gateway.auth.mode: "trusted-proxy"` за правильно налаштованим reverse proxy з підтримкою ідентифікації, який не використовує loopback

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
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як запасний варіант, лише якщо `gateway.auth.*` не задано.
    - Для автентифікації за паролем установіть `gateway.auth.mode: "password"` разом із `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і його не вдається визначити, визначення завершується в закритому стані (без маскування через віддалений запасний варіант).
    - Налаштування Control UI зі спільним секретом автентифікуються через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях застосунку/UI). Режими з передаванням ідентичності, як-от Tailscale Serve або `trusted-proxy`, замість цього використовують заголовки запиту. Уникайте розміщення спільних секретів в URL.
    - За `gateway.auth.mode: "trusted-proxy"` reverse proxy з loopback на тому самому хості все одно **не** задовольняє вимоги автентифікації trusted-proxy. Trusted proxy має бути налаштованим джерелом не loopback.

  </Accordion>

  <Accordion title="Чому тепер мені потрібен токен на localhost?">
    OpenClaw за замовчуванням вимагає автентифікацію gateway, зокрема й для loopback. У звичайному типовому сценарії це означає автентифікацію токеном: якщо явний шлях автентифікації не налаштовано, під час запуску gateway вибирається режим токена й автоматично генерується токен, який зберігається в `gateway.auth.token`, тому **локальні WS-клієнти повинні автентифікуватися**. Це блокує іншим локальним процесам можливість викликати Gateway.

    Якщо ви віддаєте перевагу іншому шляху автентифікації, можете явно вибрати режим пароля (або, для reverse proxy з підтримкою ідентифікації без loopback, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно встановіть у конфігурації `gateway.auth.mode: "none"`. Doctor може згенерувати токен для вас у будь-який час: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни конфігурації?">
    Gateway відстежує конфігурацію й підтримує гаряче перезавантаження:

    - `gateway.reload.mode: "hybrid"` (типово): безпечно застосовує зміни на гарячу, для критичних — перезапускає
    - також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні слогани в CLI?">
    Установіть `cli.banner.taglineMode` у конфігурації:

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
    - `random`: змінні кумедні/сезонні слогани (типова поведінка).
    - Якщо ви хочете повністю прибрати банер, установіть env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути вебпошук (і web fetch)?">
    `web_fetch` працює без API key. `web_search` залежить від вибраного
    провайдера:

    - Провайдери з API, як-от Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, потребують звичайного налаштування API key.
    - Ollama Web Search не потребує ключа, але використовує налаштований у вас хост Ollama й вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна HTML-інтеграція.
    - SearXNG не потребує ключа / може бути self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Рекомендовано:** запустіть `openclaw configure --section web` і виберіть провайдера.
    Альтернативи через середовище:

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
              provider: "firecrawl", // необов’язково; пропустіть для авто-визначення
            },
          },
        },
    }
    ```

    Специфічна для провайдера конфігурація вебпошуку тепер розміщується в `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи провайдера `tools.web.search.*` ще тимчасово завантажуються для сумісності, але їх не слід використовувати в нових конфігураціях.
    Запасна конфігурація web-fetch для Firecrawl розміщується в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте списки дозволених, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнено за замовчуванням (якщо його явно не вимкнено).
    - Якщо `tools.web.fetch.provider` пропущено, OpenClaw автоматично визначає першого готового запасного провайдера fetch із доступних облікових даних. Наразі вбудованим провайдером є Firecrawl.
    - Демони читають env vars з `~/.openclaw/.env` (або з оточення сервісу).

    Документація: [Вебінструменти](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply очистив мою конфігурацію. Як відновитися та як цього уникнути?">
    `config.apply` замінює **всю конфігурацію**. Якщо ви надсилаєте частковий об’єкт, усе
    інше видаляється.

    Поточний OpenClaw захищає від багатьох випадкових затирань:

    - Записи конфігурації, якими керує OpenClaw, перевіряють повну конфігурацію після змін перед записом.
    - Недійсні або руйнівні записи конфігурації, якими керує OpenClaw, відхиляються й зберігаються як `openclaw.json.rejected.*`.
    - Якщо пряме редагування ламає запуск або гаряче перезавантаження, Gateway відновлює останню відому робочу конфігурацію й зберігає відхилений файл як `openclaw.json.clobbered.*`.
    - Після відновлення основний агент отримує попередження під час запуску, щоб не записати погану конфігурацію повторно всліпу.

    Відновлення:

    - Перевірте `openclaw logs --follow` на наявність `Config auto-restored from last-known-good`, `Config write rejected:` або `config reload restored last-known-good config`.
    - Перегляньте найновіший `openclaw.json.clobbered.*` або `openclaw.json.rejected.*` поруч з активною конфігурацією.
    - Якщо відновлена активна конфігурація працює, залиште її, а потім поверніть лише потрібні ключі через `openclaw config set` або `config.patch`.
    - Запустіть `openclaw config validate` і `openclaw doctor`.
    - Якщо у вас немає ані останньої відомої робочої конфігурації, ані відхиленого вмісту, відновіть із резервної копії або знову запустіть `openclaw doctor` і повторно налаштуйте канали/моделі.
    - Якщо це було неочікувано, створіть bug-report і додайте останню відому конфігурацію або будь-яку резервну копію.
    - Локальний агент для коду часто може відновити робочу конфігурацію з логів або історії.

    Як уникнути:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Спочатку використовуйте `config.schema.lookup`, якщо не впевнені щодо точного шляху чи форми поля; він повертає вузол неглибокої схеми плюс зведення безпосередніх дочірніх елементів для подальшого занурення.
    - Використовуйте `config.patch` для часткових RPC-редагувань; залишайте `config.apply` лише для повної заміни конфігурації.
    - Якщо ви використовуєте owner-only інструмент `gateway` під час запуску агента, він усе одно відхилятиме записи в `tools.exec.ask` / `tools.exec.security` (включно із застарілими псевдонімами `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Config](/uk/cli/config), [Configure](/uk/cli/configure), [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими worker-ами на різних пристроях?">
    Поширений шаблон — **один Gateway** (наприклад, Raspberry Pi) плюс **nodes** та **agents**:

    - **Gateway (центральний):** володіє каналами (Signal/WhatsApp), маршрутизацією та сесіями.
    - **Nodes (пристрої):** Macs/iOS/Android підключаються як периферія й надають локальні інструменти (`system.run`, `canvas`, `camera`).
    - **Agents (worker-и):** окремі мізки/workspace-и для спеціальних ролей (наприклад, «Hetzner ops», «Personal data»).
    - **Sub-agents:** запускають фонову роботу з основного агента, коли вам потрібен паралелізм.
    - **TUI:** підключається до Gateway і дає змогу перемикати агентів/сесії.

    Документація: [Nodes](/uk/nodes), [Віддалений доступ](/uk/gateway/remote), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [TUI](/uk/web/tui).

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

    Значення за замовчуванням — `false` (з інтерфейсом). Headless-режим частіше викликає перевірки anti-bot на деяких сайтах. Див. [Браузер](/uk/tools/browser).

    Headless використовує **той самий рушій Chromium** і працює для більшості сценаріїв автоматизації (форми, кліки, скрапінг, логіни). Основні відмінності:

    - Немає видимого вікна браузера (якщо потрібна візуалізація, використовуйте знімки екрана).
    - Деякі сайти суворіше ставляться до автоматизації в headless-режимі (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує headless-сесії.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Установіть `browser.executablePath` на ваш бінарний файл Brave (або будь-якого браузера на основі Chromium) і перезапустіть Gateway.
    Повні приклади конфігурації див. у [Браузер](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway та nodes

<AccordionGroup>
  <Accordion title="Як команди передаються між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає агента і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен інструмент node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідний трафік провайдера; вони отримують лише виклики node RPC.

  </Accordion>

  <Accordion title="Як мій агент може отримати доступ до мого комп’ютера, якщо Gateway розміщений віддалено?">
    Коротка відповідь: **спарте ваш комп’ютер як node**. Gateway працює деінде, але може
    викликати інструменти `node.*` (екран, камера, система) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на постійно увімкненому хості (VPS/домашній сервер).
    2. Розмістіть хост Gateway і ваш комп’ютер в одній tailnet.
    3. Переконайтеся, що Gateway WS доступний (bind через tailnet або SSH-тунель).
    4. Відкрийте застосунок macOS локально й підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як node.
    5. Підтвердьте node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP-міст не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування щодо безпеки: спарювання macOS node дозволяє `system.run` на цій машині. Підключайте
    лише ті пристрої, яким довіряєте, і перегляньте [Безпека](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Протокол Gateway](/uk/gateway/protocol), [Віддалений режим macOS](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключений, але я не отримую відповідей. Що тепер?">
    Перевірте основи:

    - Gateway запущений: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан каналів: `openclaw channels status`

    Потім перевірте автентифікацію та маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` налаштовано правильно.
    - Якщо ви підключаєтеся через SSH-тунель, переконайтеся, що локальний тунель активний і вказує на правильний порт.
    - Переконайтеся, що ваші списки дозволених (DM або групи) містять ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Канали](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть дві інсталяції OpenClaw взаємодіяти одна з одною (локальна + VPS)?">
    Так. Вбудованого мосту «бот-до-бота» немає, але це можна налаштувати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний чат-канал, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надсилає повідомлення Bot B, а Bot B відповідає як зазвичай.

    **CLI-міст (універсальний):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючи на чат, який слухає інший бот.
    Якщо один із ботів розміщений на віддаленому VPS, спрямуйте ваш CLI на той віддалений Gateway
    через SSH/Tailscale (див. [Віддалений доступ](/uk/gateway/remote)).

    Приклад шаблону (запускається з машини, яка може досягти цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте захисне правило, щоб два боти не зациклилися безкінечно (відповідати лише на згадки, списки дозволених каналів
    або правило «не відповідати на повідомлення ботів»).

    Документація: [Віддалений доступ](/uk/gateway/remote), [Agent CLI](/uk/cli/agent), [Надсилання агентом](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох агентів?">
    Ні. Один Gateway може хостити кількох агентів, кожен зі своїм workspace, типовими моделями
    і маршрутизацією. Це нормальне налаштування, і воно значно дешевше й простіше, ніж запускати
    один VPS на агента.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні конфігурації, які ви не хочете спільно використовувати. В інших випадках тримайте один Gateway і
    використовуйте кількох агентів або sub-agents.

  </Accordion>

  <Accordion title="Чи є перевага у використанні node на моєму особистому ноутбуці замість SSH із VPS?">
    Так — nodes є основним способом доступу до вашого ноутбука з віддаленого Gateway, і вони
    відкривають більше, ніж просто доступ до оболонки. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (достатньо невеликого VPS або пристрою класу Raspberry Pi; 4 ГБ RAM цілком вистачає), тому поширене
    налаштування — це постійно увімкнений хост плюс ваш ноутбук як node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують спарювання пристроїв.
    - **Безпечніший контроль виконання.** `system.run` обмежується списками дозволених/підтвердженнями node на цьому ноутбуці.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна автоматизація браузера.** Тримайте Gateway на VPS, але запускайте Chrome локально через node host на ноутбуці або під’єднуйтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для разового доступу до оболонки, але nodes простіші для постійних робочих процесів агентів і
    автоматизації пристроїв.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes сервіс gateway?">
    Ні. На кожному хості має працювати лише **один gateway**, якщо ви навмисно не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)). Nodes — це периферійні пристрої, які підключаються
    до gateway (nodes для iOS/Android або режим «node mode» у застосунку рядка меню macOS). Для headless node
    host-ів і керування через CLI див. [CLI Node host](/uk/cli/node).

    Повний перезапуск потрібен для змін `gateway`, `discovery` і `canvasHost`.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати конфігурацію?">
    Так.

    - `config.schema.lookup`: переглянути одне піддерево конфігурації з його вузлом неглибокої схеми, відповідною UI-підказкою та зведеннями безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний знімок + hash
    - `config.patch`: безпечне часткове оновлення (бажаний варіант для більшості RPC-редагувань); застосовує гаряче перезавантаження, коли можливо, і перезапускає, коли потрібно
    - `config.apply`: перевіряє й замінює повну конфігурацію; застосовує гаряче перезавантаження, коли можливо, і перезапускає, коли потрібно
    - Owner-only runtime tool `gateway` усе ще відмовляється перезаписувати `tools.exec.ask` / `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

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
       - Використайте застосунок Tailscale і увійдіть до тієї самої tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - В адмін-консолі Tailscale увімкніть MagicDNS, щоб VPS мав стабільне ім’я.
    4. **Використовуйте ім’я хоста tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо ви хочете Control UI без SSH, використайте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив’язаним до loopback і відкриває HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як підключити Mac node до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Gateway Control UI + WS**. Nodes підключаються через ту саму кінцеву точку Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS і Mac перебувають в одній tailnet**.
    2. **Використовуйте застосунок macOS у віддаленому режимі** (ціллю SSH може бути ім’я хоста tailnet).
       Застосунок протунелює порт Gateway і підключиться як node.
    3. **Підтвердьте node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Протокол Gateway](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [Віддалений режим macOS](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи слід установлювати на другий ноутбук, чи просто додати node?">
    Якщо вам потрібні лише **локальні інструменти** (екран/камера/exec) на другому ноутбуці, додайте його як
    **node**. Це зберігає єдиний Gateway і уникає дублювання конфігурації. Локальні інструменти node
    наразі доступні лише на macOS, але ми плануємо поширити їх на інші ОС.

    Установлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes), [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars і завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує змінні середовища?">
    OpenClaw читає env vars із батьківського процесу (shell, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного робочого каталогу
    - глобальний запасний `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден із файлів `.env` не перевизначає наявні env vars.

    Ви також можете визначати вбудовані env vars у конфігурації (застосовуються лише якщо вони відсутні в process env):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Повний порядок пріоритетів і джерела див. у [/environment](/uk/help/environment).

  </Accordion>

  <Accordion title="Я запустив Gateway через сервіс, і мої env vars зникли. Що тепер?">
    Є два поширені варіанти виправлення:

    1. Помістіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися, навіть коли сервіс не успадковує env вашого shell.
    2. Увімкніть імпорт shell (зручність за бажанням):

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

    Це запускає ваш login shell і імпортує лише відсутні очікувані ключі (ніколи не перевизначає). Відповідники env vars:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я встановив COPILOT_GITHUB_TOKEN, але статус моделей показує "Shell env: off." Чому?'>
    `openclaw models status` показує, чи ввімкнено **імпорт shell env**. "Shell env: off"
    **не** означає, що ваших env vars немає — це лише означає, що OpenClaw не завантажуватиме
    ваш login shell автоматично.

    Якщо Gateway працює як сервіс (launchd/systemd), він не успадковує середовище
    вашого shell. Виправити це можна одним із таких способів:

    1. Помістіть токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або увімкніть імпорт shell (`env.shellEnv.enabled: true`).
    3. Або додайте його до блоку `env` у конфігурації (застосовується лише якщо значення відсутнє).

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
    Надішліть `/new` або `/reset` як окреме повідомлення. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>

  <Accordion title="Чи скидаються сесії автоматично, якщо я ніколи не надсилаю /new?">
    Термін дії сесій може спливати після `session.idleMinutes`, але це **вимкнено за замовчуванням** (типове значення **0**).
    Установіть додатне значення, щоб увімкнути завершення після простою. Коли цю функцію ввімкнено, **наступне**
    повідомлення після періоду простою починає новий ідентифікатор сесії для цього ключа чату.
    Це не видаляє транскрипти — лише починає нову сесію.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб створити команду з інсталяцій OpenClaw (один CEO і багато агентів)?">
    Так, через **маршрутизацію multi-agent** і **sub-agents**. Ви можете створити одного координувального
    агента і кількох worker-агентів зі своїми workspace та моделями.

    Втім, це краще сприймати як **цікавий експеримент**. Це витрачає багато токенів і часто
    менш ефективно, ніж використання одного бота з окремими сесіями. Типова модель, яку ми
    бачимо, — це один бот, з яким ви спілкуєтеся, з різними сесіями для паралельної роботи. Цей
    бот також може запускати sub-agents за потреби.

    Документація: [Маршрутизація multi-agent](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [CLI Agents](/uk/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст обрізався посеред завдання? Як цьому запобігти?">
    Контекст сесії обмежений вікном моделі. Довгі чати, великі виводи інструментів або велика кількість
    файлів можуть спричинити compaction або обрізання.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими завданнями, а `/new` — під час зміни теми.
    - Зберігайте важливий контекст у workspace і попросіть бота перечитати його.
    - Використовуйте sub-agents для довгої або паралельної роботи, щоб основний чат залишався меншим.
    - Виберіть модель із більшим вікном контексту, якщо це трапляється часто.

  </Accordion>

  <Accordion title="Як повністю скинути OpenClaw, але залишити його встановленим?">
    Використайте команду скидання:

    ```bash
    openclaw reset
    ```

    Неінтерактивне повне скидання:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Потім знову запустіть налаштування:

    ```bash
    openclaw onboard --install-daemon
    ```

    Примітки:

    - Онбординг також пропонує **Reset**, якщо бачить наявну конфігурацію. Див. [Онбординг (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен каталог стану (типово це `~/.openclaw-<profile>`).
    - Скидання для розробки: `openclaw gateway --dev --reset` (лише для розробки; очищає конфігурацію розробки + облікові дані + сесії + workspace).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як виконати скидання або compaction?'>
    Використайте один із варіантів:

    - **Compaction** (зберігає розмову, але підсумовує старіші повідомлення):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб спрямувати підсумок.

    - **Скидання** (новий ідентифікатор сесії для того самого ключа чату):

      ```
      /new
      /reset
      ```

    Якщо це продовжує траплятися:

    - Увімкніть або налаштуйте **обрізання сесії** (`agents.defaults.contextPruning`) для скорочення старого виводу інструментів.
    - Використовуйте модель із більшим вікном контексту.

    Документація: [Compaction](/uk/concepts/compaction), [Обрізання сесії](/uk/concepts/session-pruning), [Керування сесіями](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка перевірки провайдера: модель видала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія сесії застаріла або пошкоджена (часто після довгих тредів
    або зміни інструмента/схеми).

    Виправлення: почніть нову сесію за допомогою `/new` (окремим повідомленням).

  </Accordion>

  <Accordion title="Чому я отримую heartbeat-повідомлення кожні 30 хвилин?">
    Heartbeat запускається кожні **30 хв** за замовчуванням (**1 год**, якщо використовується OAuth-автентифікація). Налаштуйте або вимкніть його:

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

    Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown-заголовки
    на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб заощадити виклики API.
    Якщо файл відсутній, heartbeat все одно запускається, і модель сама вирішує, що робити.

    Overrides для конкретного агента задаються через `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "обліковий запис бота" до групи WhatsApp?'>
    Ні. OpenClaw працює від **вашого власного облікового запису**, тому якщо ви є в групі, OpenClaw може її бачити.
    За замовчуванням відповіді в групах заблоковані, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

    Якщо ви хочете, щоб запускати відповіді в групі могли лише **ви**:

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

    Варіант 2 (якщо вже налаштовано/додано до allowlist): отримайте список груп із конфігурації:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/uk/cli/directory), [Логи](/uk/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Є дві поширені причини:

    - Увімкнено обмеження за згадкою (типово). Ви повинні @згадати бота (або відповідати `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і група не входить до allowlist.

    Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи спільний контекст у груп/тредів і DM?">
    Прямі чати за замовчуванням згортаються до основної сесії. Групи/канали мають власні ключі сесій, а теми Telegram / треди Discord є окремими сесіями. Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки workspace і агентів можна створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але звертайте увагу на:

    - **Зростання дискового простору:** сесії + транскрипти зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартість токенів:** більше агентів означає більше одночасного використання моделей.
    - **Операційне навантаження:** профілі автентифікації для кожного агента, workspace і маршрутизація каналів.

    Поради:

    - Тримайте один **активний** workspace на агента (`agents.defaults.workspace`).
    - Обрізайте старі сесії (видаляйте JSONL або записи сховища), якщо зростає використання диска.
    - Використовуйте `openclaw doctor`, щоб виявляти зайві workspace і невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я запускати кількох ботів або чатів одночасно (Slack), і як це краще налаштувати?">
    Так. Використовуйте **маршрутизацію Multi-Agent**, щоб запускати кількох ізольованих агентів і маршрутизувати вхідні повідомлення за
    каналом/обліковим записом/peer. Slack підтримується як канал і може бути прив’язаний до конкретних агентів.

    Доступ до браузера дуже потужний, але це не «зробити все, що може людина» — anti-bot, CAPTCHA і MFA
    усе ще можуть блокувати автоматизацію. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на хості
    або використовуйте CDP на машині, яка фактично запускає браузер.

    Налаштування за найкращими практиками:

    - Постійно увімкнений хост Gateway (VPS/Mac mini).
    - Один агент на роль (bindings).
    - Канал(и) Slack, прив’язані до цих агентів.
    - Локальний браузер через Chrome MCP або node за потреби.

    Документація: [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Браузер](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі, резервне перемикання та профілі автентифікації

Запитання й відповіді про моделі — типові значення, вибір, псевдоніми, перемикання, резервне перемикання, профілі автентифікації —
розміщено в [FAQ про моделі](/uk/help/faq-models).

## Gateway: порти, «already running» і віддалений режим

<AccordionGroup>
  <Accordion title="Який порт використовує Gateway?">
    `gateway.port` керує єдиним мультиплексованим портом для WebSocket + HTTP (Control UI, hooks тощо).

    Пріоритет:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > типово 18789
    ```

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує "Runtime: running", але "Connectivity probe: failed"?'>
    Тому що «running» — це погляд **supervisor-а** (launchd/systemd/schtasks). Connectivity probe — це фактичне підключення CLI до gateway WebSocket.

    Використовуйте `openclaw gateway status` і довіряйте цим рядкам:

    - `Probe target:` (URL, який probe фактично використав)
    - `Listening:` (що фактично прив’язано до порту)
    - `Last gateway error:` (поширена першопричина, коли процес живий, але порт не слухає)

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує різні "Config (cli)" і "Config (service)"?'>
    Ви редагуєте один файл конфігурації, а сервіс запускає інший (часто через невідповідність `--profile` / `OPENCLAW_STATE_DIR`).

    Виправлення:

    ```bash
    openclaw gateway install --force
    ```

    Запустіть це з тим самим `--profile` / середовищем, яке має використовувати сервіс.

  </Accordion>

  <Accordion title='Що означає "another gateway instance is already listening"?'>
    OpenClaw забезпечує блокування runtime, одразу прив’язуючи WebSocket listener під час запуску (типово `ws://127.0.0.1:18789`). Якщо прив’язка завершується з `EADDRINUSE`, викидається `GatewayLockError`, що означає, що інший екземпляр уже слухає.

    Виправлення: зупиніть інший екземпляр, звільніть порт або запускайте з `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Як запустити OpenClaw у віддаленому режимі (клієнт підключається до Gateway деінде)?">
    Установіть `gateway.mode: "remote"` і вкажіть віддалений WebSocket URL, за потреби з віддаленими обліковими даними зі спільним секретом:

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

    - `openclaw gateway` запускається лише коли `gateway.mode` має значення `local` (або якщо ви передасте прапорець перевизначення).
    - Застосунок macOS відстежує файл конфігурації й у реальному часі перемикає режими, коли ці значення змінюються.
    - `gateway.remote.token` / `.password` — це лише клієнтські віддалені облікові дані; самі по собі вони не вмикають локальну автентифікацію gateway.

  </Accordion>

  <Accordion title='Control UI показує "unauthorized" (або постійно перепідключається). Що робити?'>
    Шлях автентифікації вашого gateway і метод автентифікації UI не збігаються.

    Факти (з коду):

    - Control UI зберігає токен у `sessionStorage` для поточної сесії вкладки браузера та вибраного URL gateway, тому оновлення в тій самій вкладці продовжують працювати без відновлення довготривалого збереження токена в localStorage.
    - За `AUTH_TOKEN_MISMATCH` довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном пристрою, коли gateway повертає підказки для повтору (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ця повторна спроба з кешованим токеном тепер повторно використовує кешовані затверджені scopes, збережені разом із токеном пристрою. Явні виклики `deviceToken` / явні `scopes` усе одно зберігають свій запитаний набір scope замість успадкування кешованих scopes.
    - Поза цим шляхом повторної спроби пріоритет автентифікації підключення такий: спочатку явний спільний токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap token.
    - Перевірки scope для bootstrap token мають префікс ролі. Вбудований allowlist bootstrap operator задовольняє лише запити operator; для node або інших ролей, відмінних від operator, усе одно потрібні scopes із власним префіксом ролі.

    Виправлення:

    - Найшвидше: `openclaw dashboard` (виводить + копіює URL dashboard, намагається відкрити; у headless показує підказку SSH).
    - Якщо у вас ще немає токена: `openclaw doctor --generate-gateway-token`.
    - Якщо віддалено, спочатку створіть тунель: `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`.
    - Режим спільного секрету: задайте `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, а потім вставте відповідний секрет у налаштуваннях Control UI.
    - Режим Tailscale Serve: переконайтеся, що `gateway.auth.allowTailscale` увімкнено, і що ви відкриваєте URL Serve, а не сирий URL loopback/tailnet, який обходить заголовки ідентичності Tailscale.
    - Режим trusted-proxy: переконайтеся, що ви приходите через налаштований non-loopback reverse proxy з підтримкою ідентичності, а не через loopback proxy на тому самому хості або сирий URL gateway.
    - Якщо невідповідність зберігається після однієї повторної спроби, перевипустіть/перествердіть токен спареного пристрою:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Якщо ця команда rotate каже, що запит відхилено, перевірте дві речі:
      - сесії спарених пристроїв можуть перевипускати лише **власний** пристрій, якщо в них немає також `operator.admin`
      - явні значення `--scope` не можуть перевищувати поточні scopes operator викликача
    - Усе ще не виходить? Запустіть `openclaw status --all` і дотримуйтеся [Усунення несправностей](/uk/gateway/troubleshooting). Подробиці автентифікації див. у [Dashboard](/uk/web/dashboard).

  </Accordion>

  <Accordion title="Я встановив gateway.bind tailnet, але він не може прив’язатися, і нічого не слухає">
    Прив’язка `tailnet` вибирає IP-адресу Tailscale з мережевих інтерфейсів вашої машини (100.64.0.0/10). Якщо машина не підключена до Tailscale (або інтерфейс вимкнений), немає адреси, до якої можна прив’язатися.

    Виправлення:

    - Запустіть Tailscale на цьому хості (щоб він мав адресу 100.x), або
    - Перемкніться на `gateway.bind: "loopback"` / `"lan"`.

    Примітка: `tailnet` задається явно. `auto` надає перевагу loopback; використовуйте `gateway.bind: "tailnet"`, коли хочете прив’язку лише до tailnet.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька Gateway на одному хості?">
    Зазвичай ні — один Gateway може запускати кілька каналів обміну повідомленнями та агентів. Використовуйте кілька Gateway лише коли вам потрібна надлишковість (наприклад, rescue bot) або жорстка ізоляція.

    Так, але ви повинні ізолювати:

    - `OPENCLAW_CONFIG_PATH` (конфігурація для кожного екземпляра)
    - `OPENCLAW_STATE_DIR` (стан для кожного екземпляра)
    - `agents.defaults.workspace` (ізоляція workspace)
    - `gateway.port` (унікальні порти)

    Швидке налаштування (рекомендовано):

    - Використовуйте `openclaw --profile <name> ...` для кожного екземпляра (автоматично створює `~/.openclaw-<name>`).
    - Установіть унікальний `gateway.port` у конфігурації кожного профілю (або передайте `--port` для ручних запусків).
    - Установіть сервіс для кожного профілю: `openclaw --profile <name> gateway install`.

    Профілі також додають суфікси до назв сервісів (`ai.openclaw.<profile>`; застарілі `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Повний посібник: [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Що означає "invalid handshake" / code 1008?'>
    Gateway — це **WebSocket server**, і він очікує, що найперше повідомлення
    буде фреймом `connect`. Якщо він отримує щось інше, то закриває з’єднання
    з **code 1008** (порушення політики).

    Поширені причини:

    - Ви відкрили **HTTP** URL у браузері (`http://...`) замість WS-клієнта.
    - Ви використали неправильний порт або шлях.
    - Проксі або тунель прибрав заголовки автентифікації чи надіслав запит, що не належить Gateway.

    Швидкі виправлення:

    1. Використовуйте WS URL: `ws://<host>:18789` (або `wss://...`, якщо HTTPS).
    2. Не відкривайте WS-порт у звичайній вкладці браузера.
    3. Якщо автентифікацію ввімкнено, додайте токен/пароль у фрейм `connect`.

    Якщо ви використовуєте CLI або TUI, URL має виглядати так:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Подробиці протоколу: [Протокол Gateway](/uk/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Логування та налагодження

<AccordionGroup>
  <Accordion title="Де зберігаються логи?">
    Файлові логи (структуровані):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Ви можете задати стабільний шлях через `logging.file`. Рівень файлового логування контролюється `logging.level`. Детальність виводу в консоль контролюється через `--verbose` і `logging.consoleLevel`.

    Найшвидший перегляд хвоста логу:

    ```bash
    openclaw logs --follow
    ```

    Логи сервісу/supervisor-а (коли gateway запускається через launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` і `gateway.err.log` (типово: `~/.openclaw/logs/...`; профілі використовують `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Докладніше див. [Усунення несправностей](/uk/gateway/troubleshooting).

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
    Існує **два режими встановлення Windows**:

    **1) WSL2 (рекомендовано):** Gateway працює всередині Linux.

    Відкрийте PowerShell, увійдіть у WSL, потім перезапустіть:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви ніколи не встановлювали сервіс, запустіть його у передньому плані:

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

    Документація: [Windows (WSL2)](/uk/platforms/windows), [Посібник із сервісу Gateway](/uk/gateway).

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

    - Автентифікацію моделі не завантажено на **хості gateway** (перевірте `models status`).
    - Спарювання каналу/allowlist блокує відповіді (перевірте конфігурацію каналу + логи).
    - WebChat/Dashboard відкрито без правильного токена.

    Якщо ви працюєте віддалено, переконайтеся, що тунель/підключення Tailscale активне і що
    Gateway WebSocket доступний.

    Документація: [Канали](/uk/channels), [Усунення несправностей](/uk/gateway/troubleshooting), [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — що робити?'>
    Зазвичай це означає, що UI втратив з’єднання WebSocket. Перевірте:

    1. Gateway запущений? `openclaw gateway status`
    2. Gateway справний? `openclaw status`
    3. Чи має UI правильний токен? `openclaw dashboard`
    4. Якщо віддалено, чи активний тунель/канал Tailscale?

    Потім перегляньте логи в реальному часі:

    ```bash
    openclaw logs --follow
    ```

    Документація: [Dashboard](/uk/web/dashboard), [Віддалений доступ](/uk/gateway/remote), [Усунення несправностей](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Не вдається виконати Telegram setMyCommands. Що перевірити?">
    Почніть з логів і статусу каналу:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Потім зіставте помилку:

    - `BOT_COMMANDS_TOO_MUCH`: у меню Telegram забагато записів. OpenClaw уже обрізає список до ліміту Telegram і повторює спробу з меншою кількістю команд, але деякі записи меню все одно потрібно прибрати. Зменште кількість plugin/skill/custom команд або вимкніть `channels.telegram.commands.native`, якщо меню вам не потрібне.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` або подібні мережеві помилки: якщо ви на VPS або за проксі, переконайтеся, що вихідний HTTPS дозволений і DNS працює для `api.telegram.org`.

    Якщо Gateway віддалений, переконайтеся, що ви дивитеся логи на хості Gateway.

    Документація: [Telegram](/uk/channels/telegram), [Усунення несправностей каналів](/uk/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI не показує виводу. Що перевірити?">
    Спочатку переконайтеся, що Gateway доступний і агент може виконуватися:

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
    Використовуйте це, коли Gateway працює у фоновому режимі як демон.

    Якщо ви запускаєте його на передньому плані, зупиніть через Ctrl-C, а потім:

    ```bash
    openclaw gateway run
    ```

    Документація: [Посібник із сервісу Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Пояснення простими словами: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: перезапускає **фоновий сервіс** (launchd/systemd).
    - `openclaw gateway`: запускає gateway **на передньому плані** в цій сесії термінала.

    Якщо ви встановили сервіс, використовуйте команди gateway. Використовуйте `openclaw gateway`, коли
    вам потрібен разовий запуск на передньому плані.

  </Accordion>

  <Accordion title="Найшвидший спосіб отримати більше подробиць, коли щось не працює">
    Запустіть Gateway з `--verbose`, щоб отримати більше подробиць у консолі. Потім перегляньте файл логів для перевірки автентифікації каналу, маршрутизації моделі та помилок RPC.
  </Accordion>
</AccordionGroup>

## Медіа та вкладення

<AccordionGroup>
  <Accordion title="Мій skill згенерував зображення/PDF, але нічого не було надіслано">
    Вихідні вкладення від агента мають містити рядок `MEDIA:<path-or-url>` (в окремому рядку). Див. [Налаштування асистента OpenClaw](/uk/start/openclaw) і [Надсилання агентом](/uk/tools/agent-send).

    Надсилання через CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Також перевірте:

    - Цільовий канал підтримує вихідні медіа і не блокується allowlist-ами.
    - Файл не перевищує обмежень розміру провайдера (зображення змінюють розмір до максимуму 2048px).
    - `tools.fs.workspaceOnly=true` обмежує надсилання локальних шляхів workspace, temp/media-store і файлами, перевіреними sandbox.
    - `tools.fs.workspaceOnly=false` дозволяє `MEDIA:` надсилати локальні файли хоста, які агент уже може читати, але лише для медіа плюс безпечних типів документів (зображення, аудіо, відео, PDF і документи Office). Звичайний текст і файли, схожі на секрети, усе одно блокуються.

    Див. [Зображення](/uk/nodes/images).

  </Accordion>
</AccordionGroup>

## Безпека та контроль доступу

<AccordionGroup>
  <Accordion title="Чи безпечно відкривати OpenClaw для вхідних DM?">
    Сприймайте вхідні DM як недовірений ввід. Значення за замовчуванням розроблені для зменшення ризику:

    - Типова поведінка на каналах, що підтримують DM, — це **спарювання**:
      - Невідомі відправники отримують код спарювання; бот не обробляє їхнє повідомлення.
      - Підтвердити можна так: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Кількість очікуваних запитів обмежена **3 на канал**; перевірте `openclaw pairing list --channel <channel> [--account <id>]`, якщо код не надійшов.
    - Публічне відкриття DM потребує явної згоди (`dmPolicy: "open"` і allowlist `"*"`).

    Запустіть `openclaw doctor`, щоб виявити ризиковані політики DM.

  </Accordion>

  <Accordion title="Чи prompt injection становить загрозу лише для публічних ботів?">
    Ні. Prompt injection стосується **недовіреного контенту**, а не лише того, хто може написати боту в DM.
    Якщо ваш асистент читає зовнішній контент (web search/fetch, сторінки браузера, email,
    документи, вкладення, вставлені логи), цей контент може містити інструкції, які намагаються
    перехопити контроль над моделлю. Це може трапитися, навіть якщо **ви єдиний відправник**.

    Найбільший ризик виникає, коли ввімкнено інструменти: модель можна обманом змусити
    витягнути контекст або викликати інструменти від вашого імені. Зменшуйте радіус ураження так:

    - використовуйте агента-«читача» лише для читання або без інструментів, щоб підсумовувати недовірений контент
    - тримайте `web_search` / `web_fetch` / `browser` вимкненими для агентів з увімкненими інструментами
    - також вважайте декодований текст файлів/документів недовіреним: OpenResponses
      `input_file` і витягування з тексту медіавкладень обгортають витягнутий текст
      явними маркерами меж зовнішнього контенту замість передавання сирого тексту файла
    - використовуйте sandboxing і суворі allowlist-и інструментів

    Подробиці: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи повинен мій бот мати власну email-адресу, GitHub-акаунт або номер телефону?">
    Так, для більшості сценаріїв. Ізоляція бота окремими обліковими записами та номерами телефону
    зменшує радіус ураження, якщо щось піде не так. Це також спрощує ротацію
    облікових даних або відкликання доступу без впливу на ваші особисті облікові записи.

    Починайте з малого. Надавайте доступ лише до тих інструментів і облікових записів, які вам справді потрібні, і розширюйте
    доступ пізніше за потреби.

    Документація: [Безпека](/uk/gateway/security), [Спарювання](/uk/channels/pairing).

  </Accordion>

  <Accordion title="Чи можу я надати йому автономність над моїми текстовими повідомленнями, і чи це безпечно?">
    Ми **не** рекомендуємо повну автономність над вашими особистими повідомленнями. Найбезпечніший підхід такий:

    - Тримайте DM у **режимі спарювання** або в жорсткому allowlist.
    - Використовуйте **окремий номер або обліковий запис**, якщо хочете, щоб він надсилав повідомлення від вашого імені.
    - Нехай він створює чернетку, а ви **затверджуєте перед надсиланням**.

    Якщо хочете поекспериментувати, робіть це в окремому обліковому записі й тримайте все ізольованим. Див.
    [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи можу я використовувати дешевші моделі для завдань персонального асистента?">
    Так, **якщо** агент працює лише в чаті, а ввід є довіреним. Менші моделі
    більш вразливі до перехоплення інструкціями, тому уникайте їх для агентів з увімкненими інструментами
    або під час читання недовіреного контенту. Якщо все ж потрібно використовувати меншу модель, жорстко обмежте
    інструменти й запускайте все в sandbox. Див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Я виконав /start у Telegram, але не отримав код спарювання">
    Коди спарювання надсилаються **лише** тоді, коли невідомий відправник пише боту і
    ввімкнено `dmPolicy: "pairing"`. Сам по собі `/start` не генерує код.

    Перевірте очікувані запити:

    ```bash
    openclaw pairing list telegram
    ```

    Якщо ви хочете негайний доступ, додайте свій sender id до allowlist або встановіть `dmPolicy: "open"`
    для цього облікового запису.

  </Accordion>

  <Accordion title="WhatsApp: чи буде він писати моїм контактам? Як працює спарювання?">
    Ні. Типова політика для WhatsApp DM — **спарювання**. Невідомі відправники отримують лише код спарювання, а їхнє повідомлення **не обробляється**. OpenClaw відповідає лише на чати, які сам отримує, або на явні надсилання, які запускаєте ви.

    Підтвердити спарювання можна так:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Переглянути очікувані запити:

    ```bash
    openclaw pairing list whatsapp
    ```

    Запит номера телефону у wizard: він використовується для налаштування вашого **allowlist/owner**, щоб дозволити ваші власні DM. Він не використовується для автоматичного надсилання. Якщо ви запускаєте все на своєму особистому номері WhatsApp, використайте цей номер і ввімкніть `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Команди чату, переривання завдань і «воно не зупиняється»

<AccordionGroup>
  <Accordion title="Як зробити так, щоб внутрішні системні повідомлення не показувалися в чаті?">
    Більшість внутрішніх або інструментальних повідомлень з’являються лише тоді, коли для цієї сесії ввімкнено **verbose**, **trace** або **reasoning**.

    Виправлення в чаті, де ви це бачите:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Якщо все одно занадто шумно, перевірте налаштування сесії в Control UI і встановіть verbose
    у значення **inherit**. Також переконайтеся, що ви не використовуєте профіль бота з `verboseDefault`, встановленим
    у `on` в конфігурації.

    Документація: [Мислення та verbose](/uk/tools/thinking), [Безпека](/uk/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Як зупинити/скасувати виконуване завдання?">
    Надішліть будь-яке з наведеного **як окреме повідомлення** (без слеша):

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

    Це тригери переривання (не slash commands).

    Для фонових процесів (з інструмента exec) ви можете попросити агента виконати:

    ```
    process action:kill sessionId:XXX
    ```

    Огляд slash commands: див. [Slash commands](/uk/tools/slash-commands).

    Більшість команд треба надсилати як **окреме** повідомлення, що починається з `/`, але деякі скорочення (наприклад, `/status`) також працюють inline для відправників з allowlist.

  </Accordion>

  <Accordion title='Як надіслати повідомлення Discord із Telegram? ("Cross-context messaging denied")'>
    OpenClaw за замовчуванням блокує повідомлення **між різними провайдерами**. Якщо виклик інструмента прив’язаний
    до Telegram, він не надсилатиме в Discord, доки ви явно цього не дозволите.

    Увімкніть міжпровайдерний обмін повідомленнями для агента:

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

  <Accordion title='Чому здається, що бот "ігнорує" швидку серію повідомлень?'>
    Режим черги визначає, як нові повідомлення взаємодіють із поточним запуском. Використовуйте `/queue`, щоб змінити режими:

    - `steer` — нові повідомлення перенаправляють поточне завдання
    - `followup` — повідомлення виконуються по одному
    - `collect` — повідомлення збираються в пакет, і відповідь надсилається один раз (типово)
    - `steer-backlog` — спочатку перенаправити, потім обробити накопичені повідомлення
    - `interrupt` — перервати поточний запуск і почати заново

    Для режимів followup можна додати параметри на кшталт `debounce:2s cap:25 drop:summarize`.

  </Accordion>
</AccordionGroup>

## Інше

<AccordionGroup>
  <Accordion title='Яка модель Anthropic є типовою за наявності API key?'>
    В OpenClaw облікові дані та вибір моделі розділені. Установлення `ANTHROPIC_API_KEY` (або збереження API key Anthropic у профілях автентифікації) вмикає автентифікацію, але фактична типова модель — це те, що ви налаштували в `agents.defaults.model.primary` (наприклад, `anthropic/claude-sonnet-4-6` або `anthropic/claude-opus-4-6`). Якщо ви бачите `No credentials found for profile "anthropic:default"`, це означає, що Gateway не зміг знайти облікові дані Anthropic в очікуваному `auth-profiles.json` для агента, який зараз виконується.
  </Accordion>
</AccordionGroup>

---

Усе ще не виходить? Запитайте в [Discord](https://discord.com/invite/clawd) або відкрийте [обговорення GitHub](https://github.com/openclaw/openclaw/discussions).

## Пов’язане

- [FAQ для першого запуску](/uk/help/faq-first-run) — встановлення, онбординг, автентифікація, підписки, ранні збої
- [FAQ про моделі](/uk/help/faq-models) — вибір моделі, резервне перемикання, профілі автентифікації
- [Усунення несправностей](/uk/help/troubleshooting) — сортування за симптомами
