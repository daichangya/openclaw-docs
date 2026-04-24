---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки runtime
    - Сортування проблем, про які повідомили користувачі, перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-24T03:46:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85dccdcbba0a3bfc8bd69396db7192a84e4b4f9aa4917623988fd47116269179
    source_path: help/faq.md
    workflow: 15
---

Швидкі відповіді плюс глибше усунення несправностей для реальних сценаріїв налаштування (локальна розробка, VPS, multi-agent, OAuth/API keys, failover моделей). Для діагностики runtime див. [Troubleshooting](/uk/gateway/troubleshooting). Повний довідник конфігурації див. у [Configuration](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламано

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидке локальне зведення: ОС + оновлення, доступність gateway/service, agents/sessions, конфігурація провайдера + проблеми runtime (коли gateway доступний).

2. **Звіт, який можна вставити й безпечно поширити**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з хвостом журналу (токени приховано).

3. **Стан демона + порту**

   ```bash
   openclaw gateway status
   ```

   Показує runtime supervisor порівняно з досяжністю RPC, цільову URL-адресу probe і те, яку конфігурацію сервіс, імовірно, використав.

4. **Глибокі probe**

   ```bash
   openclaw status --deep
   ```

   Запускає live probe стану gateway, включно з probe каналів, де це підтримується
   (потрібен доступний gateway). Див. [Health](/uk/gateway/health).

5. **Перегляд останнього журналу в реальному часі**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використайте запасний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові журнали відокремлені від журналів сервісу; див. [Logging](/uk/logging) і [Troubleshooting](/uk/gateway/troubleshooting).

6. **Запустіть doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виконує виправлення/міграцію конфігурації/стану + перевірки стану. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Запитує в запущеного gateway повний знімок (лише WS). Див. [Health](/uk/gateway/health).

## Швидкий старт і перше налаштування

Питання й відповіді щодо першого запуску — встановлення, онбординг, шляхи auth, підписки, початкові
збої — перенесено на окрему сторінку:
[FAQ — quick start and first-run setup](/uk/help/faq-first-run).

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="What is OpenClaw, in one paragraph?">
    OpenClaw — це персональний AI-асистент, який ви запускаєте на власних пристроях. Він відповідає на знайомих вам платформах обміну повідомленнями (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, а також у вбудованих Plugins каналів, таких як QQ Bot) і також може працювати з голосом + live Canvas на підтримуваних платформах. **Gateway** — це завжди увімкнена control plane; асистент — це сам продукт.
  </Accordion>

  <Accordion title="Value proposition">
    OpenClaw — це не «просто обгортка для Claude». Це **локальна control plane**, яка дає змогу запускати
    потужного асистента на **вашому власному обладнанні**, доступного через чат-застосунки, якими ви вже користуєтеся, зі
    станом сесій, пам’яттю та інструментами — без передачі контролю над вашими робочими процесами
    хостинговому SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway там, де хочете (Mac, Linux, VPS), і зберігайте
      робочу область + історію сесій локально.
    - **Реальні канали, а не вебпісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      а також мобільний voice і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо з маршрутизацією
      за агентами та failover.
    - **Лише локальний варіант:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо ви цього хочете.
    - **Маршрутизація Multi-agent:** окремі агенти для кожного каналу, облікового запису або задачі, кожен зі
      своєю робочою областю та типовими значеннями.
    - **Відкритий код і гнучкість:** переглядайте, розширюйте й self-host без прив’язки до постачальника.

    Документація: [Gateway](/uk/gateway), [Channels](/uk/channels), [Multi-agent](/uk/concepts/multi-agent),
    [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="I just set it up - what should I do first?">
    Хороші перші проєкти:

    - Створити вебсайт (WordPress, Shopify або простий статичний сайт).
    - Створити прототип мобільного застосунку (структура, екрани, план API).
    - Упорядкувати файли та папки (очищення, назви, теги).
    - Підключити Gmail і автоматизувати зведення або подальші дії.

    Він може виконувати великі завдання, але найкраще працює, коли ви розбиваєте їх на етапи та
    використовуєте sub agents для паралельної роботи.

  </Accordion>

  <Accordion title="What are the top five everyday use cases for OpenClaw?">
    Повсякденні виграші зазвичай виглядають так:

    - **Персональні зведення:** підсумки inbox, календаря та новин, які вас цікавлять.
    - **Дослідження й чернетки:** швидке дослідження, підсумки та перші чернетки листів або документів.
    - **Нагадування й подальші дії:** поштовхи та чеклісти на основі Cron або Heartbeat.
    - **Автоматизація браузера:** заповнення форм, збирання даних і повторення вебзавдань.
    - **Координація між пристроями:** надішліть завдання з телефона, дайте Gateway виконати його на сервері й отримайте результат назад у чаті.

  </Accordion>

  <Accordion title="Can OpenClaw help with lead gen, outreach, ads, and blogs for a SaaS?">
    Так — для **дослідження, кваліфікації та створення чернеток**. Він може сканувати сайти, створювати короткі списки,
    підсумовувати потенційних клієнтів і писати чернетки outreach або рекламних текстів.

    Для **outreach або рекламних кампаній** залишайте людину в циклі. Уникайте спаму, дотримуйтеся місцевих законів і
    політик платформ та перевіряйте все перед надсиланням. Найбезпечніший шаблон — дозволити
    OpenClaw створити чернетку, а вам — її затвердити.

    Документація: [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="What are the advantages vs Claude Code for web development?">
    OpenClaw — це **персональний асистент** і рівень координації, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу програмування в репозиторії. Використовуйте OpenClaw, коли вам
    потрібні довготривала пам’ять, доступ з різних пристроїв і оркестрація інструментів.

    Переваги:

    - **Постійна пам’ять + робоча область** між сесіями
    - **Багатоплатформений доступ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (браузер, файли, планування, hooks)
    - **Завжди активний Gateway** (працює на VPS, взаємодія звідусіль)
    - **Nodes** для локального браузера/екрана/камери/виконання

    Showcase: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills і автоматизація

<AccordionGroup>
  <Accordion title="How do I customize skills without keeping the repo dirty?">
    Використовуйте керовані перевизначення замість редагування копії в репозиторії. Помістіть свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`, тож керовані перевизначення все одно мають перевагу над вбудованими Skills без зміни git. Якщо вам потрібно, щоб Skill був установлений глобально, але видимий лише для деяких агентів, зберігайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` і `agents.list[].skills`. Лише зміни, варті внесення в upstream, мають жити в репозиторії та надсилатися як PR.
  </Accordion>

  <Accordion title="Can I load skills from a custom folder?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий пріоритет: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`. `clawhub` типово встановлює в `./skills`, які OpenClaw трактує як `<workspace>/skills` під час наступної сесії. Якщо Skill має бути видимим лише певним агентам, поєднайте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="How can I use different models for different tasks?">
    Наразі підтримуються такі шаблони:

    - **Cron jobs**: ізольовані завдання можуть задавати перевизначення `model` для кожного завдання.
    - **Sub-agents**: маршрутизуйте завдання до окремих агентів з різними типовими моделями.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб у будь-який момент змінити модель поточної сесії.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Multi-Agent Routing](/uk/concepts/multi-agent) і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="The bot freezes while doing heavy work. How do I offload that?">
    Використовуйте **sub-agents** для тривалих або паралельних завдань. Sub-agents працюють у власній сесії,
    повертають підсумок і не дають основному чату втрачати чутливість.

    Попросіть свого бота «spawn a sub-agent for this task» або використайте `/subagents`.
    Використовуйте `/status` у чаті, щоб побачити, що Gateway робить зараз (і чи він зайнятий).

    Порада щодо токенів: і довгі завдання, і sub-agents споживають токени. Якщо важлива
    вартість, задайте дешевшу модель для sub-agents через `agents.defaults.subagents.model`.

    Документація: [Sub-agents](/uk/tools/subagents), [Background Tasks](/uk/automation/tasks).

  </Accordion>

  <Accordion title="How do thread-bound subagent sessions work on Discord?">
    Використовуйте прив’язки до thread. Ви можете прив’язати thread Discord до subagent або цільової сесії, щоб наступні повідомлення в цьому thread залишалися в межах прив’язаної сесії.

    Базовий процес:

    - Створіть через `sessions_spawn` з `thread: true` (і, за потреби, `mode: "session"` для постійших наступних взаємодій).
    - Або прив’яжіть вручну через `/focus <target>`.
    - Використовуйте `/agents`, щоб перевірити стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати авто-зняттям фокуса.
    - Використовуйте `/unfocus`, щоб від’єднати thread.

    Потрібна конфігурація:

    - Глобальні типові значення: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Перевизначення Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Auto-bind під час spawn: задайте `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agents](/uk/tools/subagents), [Discord](/uk/channels/discord), [Configuration Reference](/uk/gateway/configuration-reference), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="A subagent finished, but the completion update went to the wrong place or never posted. What should I check?">
    Спочатку перевірте визначений маршрут запитувача:

    - Доставка subagent у режимі completion надає перевагу будь-якому прив’язаному thread або маршруту розмови, якщо такий існує.
    - Якщо походження completion містить лише канал, OpenClaw повертається до збереженого маршруту сесії запитувача (`lastChannel` / `lastTo` / `lastAccountId`), щоб пряма доставка все ще могла спрацювати.
    - Якщо немає ні прив’язаного маршруту, ні придатного збереженого маршруту, пряма доставка може не спрацювати, і результат повернеться до доставки через чергу сесії замість негайного надсилання в чат.
    - Некоректні або застарілі цілі все ще можуть змусити перейти до резервної доставки через чергу або до остаточного збою доставки.
    - Якщо остання видима відповідь асистента дочірньої сесії — це точний тихий токен `NO_REPLY` / `no_reply` або рівно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує оголошення замість публікації застарілого попереднього прогресу.
    - Якщо дочірня сесія завершилася за тайм-аутом після одних лише викликів інструментів, оголошення може згорнути це в короткий підсумок часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agents](/uk/tools/subagents), [Background Tasks](/uk/automation/tasks), [Session Tools](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron or reminders do not fire. What should I check?">
    Cron виконується всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання виконуватися не будуть.

    Контрольний список:

    - Підтвердьте, що Cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не задано.
    - Переконайтеся, що Gateway працює 24/7 (без сну/перезапусків).
    - Перевірте налаштування часового поясу для завдання (`--tz` проти часового поясу хоста).

    Налагодження:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Automation & Tasks](/uk/automation).

  </Accordion>

  <Accordion title="Cron fired, but nothing was sent to the channel. Why?">
    Спочатку перевірте режим доставки:

    - `--no-deliver` / `delivery.mode: "none"` означає, що резервне надсилання runner не очікується.
    - Відсутня або некоректна ціль оголошення (`channel` / `to`) означає, що runner пропустив вихідну доставку.
    - Помилки auth каналу (`unauthorized`, `Forbidden`) означають, що runner спробував виконати доставку, але облікові дані це заблокували.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` і нічого більше) вважається навмисно недоставлюваним, тому runner також пригнічує резервну доставку через чергу.

    Для ізольованих Cron jobs агент усе ще може надсилати напряму через інструмент `message`,
    коли маршрут чату доступний. `--announce` керує лише резервним шляхом runner
    для фінального тексту, який агент ще не надіслав самостійно.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Background Tasks](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Why did an isolated cron run switch models or retry once?">
    Зазвичай це шлях live-перемикання моделі, а не дубльоване планування.

    Ізольований Cron може зберегти передачу моделі runtime і повторити спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає переключений
    provider/model, а якщо перемикання містило нове перевизначення auth profile, Cron
    також зберігає його перед повторною спробою.

    Пов’язані правила вибору:

    - Спочатку має перевагу перевизначення моделі Gmail hook, якщо застосовується.
    - Потім `model` для конкретного завдання.
    - Потім будь-яке збережене перевизначення моделі cron-session.
    - Потім звичайний вибір моделі агента/типових значень.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 повторних спроб перемикання
    Cron переривається замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [cron CLI](/uk/cli/cron).

  </Accordion>

  <Accordion title="How do I install skills on Linux?">
    Використовуйте нативні команди `openclaw skills` або помістіть Skills у свою робочу область. UI Skills для macOS недоступний у Linux.
    Переглядати Skills можна на [https://clawhub.ai](https://clawhub.ai).

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

    Нативний `openclaw skills install` записує в каталог `skills/`
    активної робочої області. Окремий CLI `clawhub` встановлюйте лише якщо хочете публікувати або
    синхронізувати власні Skills. Для спільних установлень між агентами помістіть Skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете звузити коло агентів, які можуть його бачити.

  </Accordion>

  <Accordion title="Can OpenClaw run tasks on a schedule or continuously in the background?">
    Так. Використовуйте планувальник Gateway:

    - **Cron jobs** для запланованих або повторюваних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок «основної сесії».
    - **Ізольовані завдання** для автономних агентів, які публікують підсумки або доставляють їх у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Automation & Tasks](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Can I run Apple macOS-only skills from Linux?">
    Не напряму. Skills macOS обмежуються через `metadata.openclaw.os` і необхідні бінарні файли, а Skills з’являються в system prompt лише тоді, коли вони придатні на **хості Gateway**. У Linux Skills лише для `darwin` (наприклад `apple-notes`, `apple-reminders`, `things-mac`) не завантажуються, якщо ви не перевизначите це обмеження.

    Є три підтримувані шаблони:

    **Варіант A — запускати Gateway на Mac (найпростіше).**
    Запускайте Gateway там, де існують бінарні файли macOS, а потім підключайтеся з Linux у [віддаленому режимі](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажуються як звичайно, оскільки хост Gateway — це macOS.

    **Варіант B — використати macOS Node (без SSH).**
    Запускайте Gateway на Linux, спарте macOS Node (застосунок у menu bar) і встановіть **Node Run Commands** у значення "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати Skills лише для macOS придатними, коли потрібні бінарні файли існують на Node. Агент запускає ці Skills через інструмент `nodes`. Якщо ви виберете "Always Ask", підтвердження "Always Allow" у запиті додасть цю команду до allowlist.

    **Варіант C — проксувати бінарні файли macOS через SSH (просунутий варіант).**
    Залиште Gateway на Linux, але зробіть так, щоб потрібні CLI-бінарні файли резолвилися до SSH-обгорток, які запускаються на Mac. Потім перевизначте Skill, щоб дозволити Linux і зберегти його придатність.

    1. Створіть SSH-обгортку для бінарного файла (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Помістіть обгортку в `PATH` на хості Linux (наприклад `~/bin/memo`).
    3. Перевизначте метадані Skill (у робочій області або `~/.openclaw/skills`), щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Запустіть нову сесію, щоб оновився знімок Skills.

  </Accordion>

  <Accordion title="Do you have a Notion or HeyGen integration?">
    Наразі вбудованої немає.

    Варіанти:

    - **Custom Skill / Plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Автоматизація браузера:** працює без коду, але повільніше й менш надійно.

    Якщо ви хочете зберігати контекст для кожного клієнта окремо (робочі процеси агентства), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + вподобання + активна робота).
    - Попросіть агента отримати цю сторінку на початку сесії.

    Якщо вам потрібна нативна інтеграція, створіть запит на функцію або зберіть Skill,
    орієнтований на ці API.

    Установлення Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активної робочої області. Для спільних Skills між агентами розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі агенти, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі Skills очікують, що бінарні файли буде встановлено через Homebrew; у Linux це означає Linuxbrew (див. запис FAQ про Homebrew у Linux вище). Див. [Skills](/uk/tools/skills), [Skills config](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="How do I use my existing signed-in Chrome with OpenClaw?">
    Використовуйте вбудований профіль браузера `user`, який підключається через Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Якщо ви хочете власну назву, створіть явний MCP-профіль:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Цей шлях може використовувати локальний браузер хоста або підключений browser Node. Якщо Gateway працює деінде, або запускайте хост Node на машині з браузером, або використовуйте віддалений CDP.

    Поточні обмеження для `existing-session` / `user`:

    - дії ґрунтуються на ref, а не на CSS-selector
    - завантаження файлів потребують `ref` / `inputRef` і наразі підтримують лише один файл за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії все ще потребують керованого браузера або raw CDP-профілю

  </Accordion>
</AccordionGroup>

## Ізоляція та пам’ять

<AccordionGroup>
  <Accordion title="Is there a dedicated sandboxing doc?">
    Так. Див. [Sandboxing](/uk/gateway/sandboxing). Для специфічного налаштування Docker (повний gateway у Docker або образи sandbox) див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker feels limited - how do I enable full features?">
    Типовий образ насамперед орієнтований на безпеку й запускається від імені користувача `node`, тому не
    містить системних пакетів, Homebrew або вбудованих браузерів. Для повнішого налаштування:

    - Зберігайте `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші переживали перезапуски.
    - Додавайте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Встановлюйте браузери Playwright через вбудований CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Встановіть `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Can I keep DMs personal but make groups public/sandboxed with one agent?">
    Так — якщо ваш приватний трафік — це **DM**, а публічний трафік — це **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб групові/канальні сесії (ключі не `main`) запускалися в налаштованому backend sandbox, тоді як основна DM-сесія залишалася на хості. Docker є типовим backend, якщо ви не вибираєте інший. Потім обмежте набір інструментів, доступних у sandbox-сесіях, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Groups: personal DMs + public groups](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Довідник за ключовою конфігурацією: [Gateway configuration](/uk/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="How do I bind a host folder into the sandbox?">
    Задайте `agents.defaults.sandbox.docker.binds` як `["host:path:mode"]` (наприклад `"/home/user/src:/src:ro"`). Глобальні прив’язки й прив’язки для окремих агентів об’єднуються; прив’язки для окремих агентів ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого й пам’ятайте, що прив’язки обходять файлові межі sandbox.

    OpenClaw перевіряє джерела прив’язок і за нормалізованим шляхом, і за канонічним шляхом, розв’язаним через найглибшого наявного предка. Це означає, що виходи за межі через symlink-батьків усе одно закриваються fail-closed, навіть коли останній сегмент шляху ще не існує, а перевірки allowed-root усе одно застосовуються після розв’язання symlink.

    Див. [Sandboxing](/uk/gateway/sandboxing#custom-bind-mounts) і [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) для прикладів і приміток щодо безпеки.

  </Accordion>

  <Accordion title="How does memory work?">
    Пам’ять OpenClaw — це просто Markdown-файли в робочій області агента:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Кураторські довготривалі нотатки в `MEMORY.md` (лише для main/private sessions)

    OpenClaw також виконує **тихий попередній злив пам’яті перед Compaction**, щоб нагадати моделі
    записати стійкі нотатки перед auto-compaction. Це виконується лише тоді, коли робоча область
    доступна для запису (sandbox лише для читання це пропускають). Див. [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Memory keeps forgetting things. How do I make it stick?">
    Попросіть бота **записати факт у пам’ять**. Довготривалі нотатки мають бути в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще сфера, яку ми покращуємо. Корисно нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона продовжує забувати, перевірте, що Gateway використовує ту саму
    робочу область під час кожного запуску.

    Документація: [Memory](/uk/concepts/memory), [Agent workspace](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Does memory persist forever? What are the limits?">
    Файли пам’яті живуть на диску й зберігаються, доки ви їх не видалите. Обмеженням є ваше
    сховище, а не модель. **Контекст сесії** все одно обмежений вікном контексту моделі,
    тому довгі розмови можуть ущільнюватися або обрізатися. Саме тому
    існує пошук у пам’яті — він повертає в контекст лише релевантні частини.

    Документація: [Memory](/uk/concepts/memory), [Context](/uk/concepts/context).

  </Accordion>

  <Accordion title="Does semantic memory search require an OpenAI API key?">
    Лише якщо ви використовуєте **OpenAI embeddings**. Codex OAuth покриває chat/completions і
    **не** надає доступу до embeddings, тож **вхід через Codex (OAuth або
    через вхід у Codex CLI)** не допомагає для семантичного пошуку в пам’яті. OpenAI embeddings
    усе ще потребують справжнього API key (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви не задаєте провайдера явно, OpenClaw автоматично вибирає провайдера, коли він
    може визначити API key (auth profiles, `models.providers.*.apiKey` або env vars).
    Він надає перевагу OpenAI, якщо вдається визначити ключ OpenAI, інакше Gemini, якщо вдається визначити ключ Gemini,
    потім Voyage, потім Mistral. Якщо жодного віддаленого ключа немає, пошук у пам’яті
    залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштовано й доступний
    шлях локальної моделі, OpenClaw
    надає перевагу `local`. Ollama підтримується, коли ви явно задаєте
    `memorySearch.provider = "ollama"`.

    Якщо ви хочете залишитися повністю локально, задайте `memorySearch.provider = "local"` (і за бажанням
    `memorySearch.fallback = "none"`). Якщо вам потрібні embeddings Gemini, задайте
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо embedding-моделі **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    подробиці налаштування див. у [Memory](/uk/concepts/memory).

  </Accordion>
</AccordionGroup>

## Де що зберігається на диску

<AccordionGroup>
  <Accordion title="Is all data used with OpenClaw saved locally?">
    Ні — **стан OpenClaw є локальним**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** сесії, файли пам’яті, конфігурація та робоча область живуть на хості Gateway
      (`~/.openclaw` + каталог вашої робочої області).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте провайдерам моделей (Anthropic/OpenAI тощо), потрапляють
      до їхніх API, а чат-платформи (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на своїх
      серверах.
    - **Ви контролюєте слід:** використання локальних моделей зберігає prompt на вашій машині, але трафік
      каналів усе одно проходить через сервери відповідного каналу.

    Пов’язане: [Agent workspace](/uk/concepts/agent-workspace), [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Where does OpenClaw store its data?">
    Усе зберігається в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Шлях                                                            | Призначення                                                         |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основна конфігурація (JSON5)                                       |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Застарілий імпорт OAuth (копіюється в auth profiles під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, API keys і необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язкове файлове сховище секретів для провайдерів `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Застарілий файл сумісності (статичні записи `api_key` очищаються)   |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдерів (наприклад `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан для кожного агента (agentDir + sessions)                      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (для кожного агента)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані сесій (для кожного агента)                                |

    Застарілий шлях одного агента: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`).

    Ваша **робоча область** (`AGENTS.md`, файли пам’яті, Skills тощо) є окремою і налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Where should AGENTS.md / SOUL.md / USER.md / MEMORY.md live?">
    Ці файли мають зберігатися в **робочій області агента**, а не в `~/.openclaw`.

    - **Робоча область (для кожного агента)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, необов’язковий `HEARTBEAT.md`.
      Кореневий `memory.md` у нижньому регістрі — лише вхід для виправлення застарілих даних; `openclaw doctor --fix`
      може об’єднати його в `MEMORY.md`, коли обидва файли існують.
    - **Каталог стану (`~/.openclaw`)**: конфігурація, стан каналів/провайдерів, auth profiles, sessions, logs
      і спільні Skills (`~/.openclaw/skills`).

    Типова робоча область — `~/.openclaw/workspace`, налаштовується через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот «забуває» після перезапуску, переконайтеся, що Gateway використовує ту саму
    робочу область під час кожного запуску (і пам’ятайте: віддалений режим використовує **робочу область хоста gateway**,
    а не вашого локального ноутбука).

    Порада: якщо вам потрібна стійка поведінка або вподобання, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладатися на історію чату.

    Див. [Agent workspace](/uk/concepts/agent-workspace) і [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Recommended backup strategy">
    Помістіть свою **робочу область агента** в **приватний** git-репозиторій і створюйте резервні копії в
    приватному місці (наприклад, у приватному GitHub). Це зберігає пам’ять + файли AGENTS/SOUL/USER
    і дає змогу пізніше відновити «розум» асистента.

    **Не** комітьте нічого з `~/.openclaw` (облікові дані, сесії, токени або зашифровані дані секретів).
    Якщо вам потрібно повне відновлення, окремо створюйте резервні копії і робочої області, і каталогу стану
    (див. питання про міграцію вище).

    Документація: [Agent workspace](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="How do I completely uninstall OpenClaw?">
    Див. окрему інструкцію: [Uninstall](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Can agents work outside the workspace?">
    Так. Робоча область — це **типовий cwd** і якір пам’яті, а не жорсткий sandbox.
    Відносні шляхи розв’язуються всередині робочої області, але абсолютні шляхи можуть отримувати доступ до інших
    місць на хості, якщо sandboxing не увімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування sandbox для окремих агентів. Якщо ви
    хочете, щоб типовим робочим каталогом був репозиторій, вкажіть
    `workspace` цього агента на корінь репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
    робочу область окремо, якщо тільки ви свідомо не хочете, щоб агент працював усередині нього.

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

  <Accordion title="Remote mode: where is the session store?">
    Станом сесій володіє **хост gateway**. Якщо ви працюєте у віддаленому режимі, потрібне вам сховище сесій розташоване на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Session management](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="What format is the config? Where is it?">
    OpenClaw читає необов’язкову конфігурацію **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються досить безпечні типові значення (зокрема типова робоча область `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='I set gateway.bind: "lan" (or "tailnet") and now nothing listens / the UI says unauthorized'>
    Прив’язки не до loopback **потребують дійсного шляху auth для gateway**. На практиці це означає:

    - auth із спільним секретом: токен або пароль
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

    - `gateway.remote.token` / `.password` самі по собі **не** вмикають локальний auth для gateway.
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як резервний варіант лише коли `gateway.auth.*` не задано.
    - Для auth за паролем задайте `gateway.auth.mode: "password"` плюс `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язано, розв’язання завершується fail-closed (без маскування резервним remote fallback).
    - Налаштування Control UI зі спільним секретом автентифікуються через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях app/UI). Режими з ідентичністю, такі як Tailscale Serve або `trusted-proxy`, натомість використовують заголовки запитів. Не розміщуйте спільні секрети в URL.
    - З `gateway.auth.mode: "trusted-proxy"` reverse proxy того самого хоста через loopback усе одно **не** задовольняють auth trusted-proxy. Trusted proxy має бути налаштованим джерелом не на loopback.

  </Accordion>

  <Accordion title="Why do I need a token on localhost now?">
    OpenClaw типово вимагає auth для gateway, включно з loopback. У звичайному типовому сценарії це означає auth за токеном: якщо жоден явний шлях auth не налаштований, під час запуску gateway використовується режим токена й автоматично генерується токен, який зберігається в `gateway.auth.token`, тож **локальні WS-клієнти мають автентифікуватися**. Це блокує іншим локальним процесам можливість викликати Gateway.

    Якщо ви віддаєте перевагу іншому шляху auth, можна явно вибрати режим пароля (або, для identity-aware reverse proxy не на loopback, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно задайте `gateway.auth.mode: "none"` у своїй конфігурації. Doctor може будь-коли згенерувати для вас токен: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Do I have to restart after changing config?">
    Gateway стежить за конфігурацією і підтримує гаряче перезавантаження:

    - `gateway.reload.mode: "hybrid"` (типово): безпечно застосовує зміни на льоту, для критичних — перезапускає
    - також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="How do I disable funny CLI taglines?">
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

    - `off`: приховує текст tagline, але зберігає рядок заголовка/версії банера.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: ротація кумедних/сезонних tagline (типова поведінка).
    - Якщо вам узагалі не потрібен банер, задайте env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="How do I enable web search (and web fetch)?">
    `web_fetch` працює без API key. `web_search` залежить від вибраного вами
    провайдера:

    - Провайдери на основі API, як-от Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, потребують звичайного налаштування API key.
    - Ollama Web Search не потребує ключа, але використовує налаштований хост Ollama і потребує `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна інтеграція на основі HTML.
    - SearXNG не потребує ключа / є self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

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

    Специфічна для провайдера конфігурація web-search тепер знаходиться в `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи провайдера `tools.web.search.*` тимчасово продовжують завантажуватися для сумісності, але їх не слід використовувати в нових конфігураціях.
    Резервна конфігурація Firecrawl для web-fetch знаходиться в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlist, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` типово увімкнений (якщо його явно не вимкнено).
    - Якщо `tools.web.fetch.provider` пропущено, OpenClaw автоматично визначає першого готового резервного провайдера fetch за наявними обліковими даними. Наразі вбудованим провайдером є Firecrawl.
    - Демони читають env vars із `~/.openclaw/.env` (або із середовища сервісу).

    Документація: [Web tools](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply wiped my config. How do I recover and avoid this?">
    `config.apply` замінює **всю конфігурацію**. Якщо ви надсилаєте частковий об’єкт, усе
    інше видаляється.

    Поточний OpenClaw захищає від багатьох випадкових затирань:

    - Записи конфігурації, ініційовані OpenClaw, перевіряють усю конфігурацію після змін перед записом.
    - Недійсні або руйнівні записи, ініційовані OpenClaw, відхиляються і зберігаються як `openclaw.json.rejected.*`.
    - Якщо пряме редагування ламає запуск або гаряче перезавантаження, Gateway відновлює останню відому робочу конфігурацію і зберігає відхилений файл як `openclaw.json.clobbered.*`.
    - Після відновлення основний агент отримує попередження під час запуску, щоб він не записав погану конфігурацію знову всліпу.

    Відновлення:

    - Перевірте `openclaw logs --follow` на наявність `Config auto-restored from last-known-good`, `Config write rejected:` або `config reload restored last-known-good config`.
    - Перегляньте найновіший `openclaw.json.clobbered.*` або `openclaw.json.rejected.*` поруч з активною конфігурацією.
    - Залиште активну відновлену конфігурацію, якщо вона працює, а потім поверніть лише потрібні ключі через `openclaw config set` або `config.patch`.
    - Запустіть `openclaw config validate` і `openclaw doctor`.
    - Якщо у вас немає last-known-good або відхиленого payload, відновіть із резервної копії або повторно запустіть `openclaw doctor` і заново налаштуйте канали/моделі.
    - Якщо це сталося неочікувано, створіть bug report і додайте останню відому конфігурацію або будь-яку резервну копію.
    - Локальний coding agent часто може відновити працездатну конфігурацію з журналів або історії.

    Як уникнути цього:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Спочатку використовуйте `config.schema.lookup`, коли ви не впевнені щодо точного шляху або форми поля; він повертає поверхневий вузол схеми плюс зведення безпосередніх дочірніх елементів для подальшого заглиблення.
    - Використовуйте `config.patch` для часткових RPC-редагувань; залишайте `config.apply` лише для повної заміни конфігурації.
    - Якщо ви використовуєте інструмент `gateway`, доступний лише власнику, з запуску агента, він усе одно відхилятиме записи в `tools.exec.ask` / `tools.exec.security` (включно із застарілими псевдонімами `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Config](/uk/cli/config), [Configure](/uk/cli/configure), [Gateway troubleshooting](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="How do I run a central Gateway with specialized workers across devices?">
    Поширений шаблон — **один Gateway** (наприклад, Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** керує каналами (Signal/WhatsApp), маршрутизацією та сесіями.
    - **Nodes (пристрої):** Mac/iOS/Android підключаються як периферія й надають локальні інструменти (`system.run`, `canvas`, `camera`).
    - **Agents (працівники):** окремі «мозки»/робочі області для спеціалізованих ролей (наприклад, "Hetzner ops", "Personal data").
    - **Sub-agents:** запускають фонову роботу з основного агента, коли вам потрібен паралелізм.
    - **TUI:** підключається до Gateway і перемикає agents/sessions.

    Документація: [Nodes](/uk/nodes), [Remote access](/uk/gateway/remote), [Multi-Agent Routing](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [TUI](/uk/web/tui).

  </Accordion>

  <Accordion title="Can the OpenClaw browser run headless?">
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

    Типове значення — `false` (headful). Headless-режим частіше провокує перевірки anti-bot на деяких сайтах. Див. [Browser](/uk/tools/browser).

    Headless використовує **той самий рушій Chromium** і підходить для більшості сценаріїв автоматизації (форми, кліки, скрапінг, входи в систему). Основні відмінності:

    - Немає видимого вікна браузера (якщо потрібна візуалізація, використовуйте screenshots).
    - Деякі сайти суворіше ставляться до автоматизації в headless-режимі (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує headless-сесії.

  </Accordion>

  <Accordion title="How do I use Brave for browser control?">
    Задайте `browser.executablePath` на бінарний файл Brave (або будь-якого браузера на базі Chromium) і перезапустіть Gateway.
    Повні приклади конфігурації див. у [Browser](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway і nodes

<AccordionGroup>
  <Accordion title="How do commands propagate between Telegram, the gateway, and nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає агента і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен інструмент node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідний трафік провайдера; вони отримують лише виклики node RPC.

  </Accordion>

  <Accordion title="How can my agent access my computer if the Gateway is hosted remotely?">
    Коротка відповідь: **спарте свій комп’ютер як node**. Gateway працює деінде, але він може
    викликати інструменти `node.*` (екран, камера, система) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на хості, який завжди ввімкнений (VPS/домашній сервер).
    2. Додайте хост Gateway і свій комп’ютер до однієї tailnet.
    3. Переконайтеся, що Gateway WS доступний (прив’язка до tailnet або SSH-тунель).
    4. Відкрийте застосунок macOS локально й підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як node.
    5. Підтвердьте node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP-міст не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування щодо безпеки: pairing macOS node дозволяє `system.run` на цій машині. Спарюйте
    лише пристрої, яким довіряєте, і перегляньте [Security](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Gateway protocol](/uk/gateway/protocol), [macOS remote mode](/uk/platforms/mac/remote), [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale is connected but I get no replies. What now?">
    Перевірте базові речі:

    - Gateway запущено: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан каналу: `openclaw channels status`

    Потім перевірте auth і маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` задано правильно.
    - Якщо ви підключаєтеся через SSH-тунель, підтвердьте, що локальний тунель активний і вказує на правильний порт.
    - Переконайтеся, що ваші allowlist (DM або група) містять ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Remote access](/uk/gateway/remote), [Channels](/uk/channels).

  </Accordion>

  <Accordion title="Can two OpenClaw instances talk to each other (local + VPS)?">
    Так. Вбудованого моста «bot-to-bot» немає, але це можна налагодити кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний чат-канал, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надішле повідомлення Bot B, а тоді Bot B відповість як зазвичай.

    **CLI-міст (загальний):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючи на чат, де інший бот
    слухає. Якщо один бот працює на віддаленому VPS, спрямуйте свій CLI на цей віддалений Gateway
    через SSH/Tailscale (див. [Remote access](/uk/gateway/remote)).

    Приклад шаблону (запускається з машини, яка може дістатися до цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте запобіжник, щоб два боти не зациклилися нескінченно (відповіді лише за згадкою, channel
    allowlist або правило «не відповідати на повідомлення ботів»).

    Документація: [Remote access](/uk/gateway/remote), [Agent CLI](/uk/cli/agent), [Agent send](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Do I need separate VPSes for multiple agents?">
    Ні. Один Gateway може розміщувати кількох агентів, кожен зі своєю робочою областю, типовими значеннями моделі
    і маршрутизацією. Це нормальний сценарій, і він значно дешевший та простіший, ніж запускати
    один VPS на агента.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні конфігурації, які ви не хочете спільно використовувати. В іншому разі залишайте один Gateway і
    використовуйте кілька агентів або sub-agents.

  </Accordion>

  <Accordion title="Is there a benefit to using a node on my personal laptop instead of SSH from a VPS?">
    Так — nodes є основним способом дістатися до вашого ноутбука з віддаленого Gateway, і вони
    дають більше, ніж просто доступ до shell. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (невеликий VPS або пристрій класу Raspberry Pi цілком підходить; 4 GB RAM достатньо), тому поширений
    сценарій — це хост, який завжди ввімкнений, плюс ваш ноутбук як node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують pairing пристроїв.
    - **Безпечніший контроль виконання.** `system.run` обмежується allowlist/підтвердженнями node на цьому ноутбуці.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна автоматизація браузера.** Залишайте Gateway на VPS, але запускайте Chrome локально через host node на ноутбуці або підключайтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для епізодичного доступу до shell, але nodes простіші для постійних робочих процесів агентів і
    автоматизації пристроїв.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/uk/cli/nodes), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Do nodes run a gateway service?">
    Ні. На хості має працювати лише **один gateway**, якщо тільки ви свідомо не запускаєте ізольовані профілі (див. [Multiple gateways](/uk/gateway/multiple-gateways)). Nodes — це периферійні пристрої, які підключаються
    до gateway (nodes iOS/Android або «node mode» для macOS у застосунку menu bar). Для headless node
    host і керування через CLI див. [Node host CLI](/uk/cli/node).

    Повний перезапуск потрібен для змін `gateway`, `discovery` і `canvasHost`.

  </Accordion>

  <Accordion title="Is there an API / RPC way to apply config?">
    Так.

    - `config.schema.lookup`: перевірити одне піддерево конфігурації з його поверхневим вузлом схеми, відповідною UI-підказкою та зведеннями безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний знімок + hash
    - `config.patch`: безпечне часткове оновлення (бажано для більшості RPC-редагувань); за можливості гаряче перезавантажує, а за потреби перезапускає
    - `config.apply`: перевіряє й замінює всю конфігурацію; за можливості гаряче перезавантажує, а за потреби перезапускає
    - Інструмент runtime `gateway`, доступний лише власнику, і далі відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

  </Accordion>

  <Accordion title="Мінімальна розумна конфігурація для першого встановлення">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Це задає вашу робочу область і обмежує, хто може активувати бота.

  </Accordion>

  <Accordion title="How do I set up Tailscale on a VPS and connect from my Mac?">
    Мінімальні кроки:

    1. **Встановіть і увійдіть на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Встановіть і увійдіть на Mac**
       - Використайте застосунок Tailscale і увійдіть у ту саму tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - У консолі адміністратора Tailscale увімкніть MagicDNS, щоб VPS мав стабільне ім’я.
    4. **Використовуйте ім’я хоста tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо ви хочете Control UI без SSH, використайте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це зберігає прив’язку gateway до loopback і відкриває HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="How do I connect a Mac node to a remote Gateway (Tailscale Serve)?">
    Serve відкриває **Gateway Control UI + WS**. Nodes підключаються через той самий endpoint Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS і Mac перебувають в одній tailnet**.
    2. **Використовуйте застосунок macOS у режимі Remote** (ціллю SSH може бути ім’я хоста tailnet).
       Застосунок протунелює порт Gateway і підключиться як node.
    3. **Підтвердьте node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Gateway protocol](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [macOS remote mode](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Should I install on a second laptop or just add a node?">
    Якщо вам потрібні лише **локальні інструменти** (екран/камера/exec) на другому ноутбуці, додайте його як
    **node**. Це зберігає один Gateway і дозволяє уникнути дубльованої конфігурації. Локальні інструменти node
    наразі доступні лише на macOS, але ми плануємо поширити їх і на інші ОС.

    Встановлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/uk/cli/nodes), [Multiple gateways](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars і завантаження .env

<AccordionGroup>
  <Accordion title="How does OpenClaw load environment variables?">
    OpenClaw читає env vars із батьківського процесу (shell, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного робочого каталогу
    - глобальний резервний `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден із файлів `.env` не перевизначає наявні env vars.

    Ви також можете визначити inline env vars у конфігурації (застосовуються лише якщо їх немає в env процесу):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Повний порядок пріоритету і джерела див. у [/environment](/uk/help/environment).

  </Accordion>

  <Accordion title="I started the Gateway via the service and my env vars disappeared. What now?">
    Є два поширені виправлення:

    1. Додайте відсутні ключі в `~/.openclaw/.env`, щоб їх підхоплювало, навіть коли сервіс не успадковує env вашого shell.
    2. Увімкніть імпорт shell (зручно, але лише за явною згодою):

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

    Це запускає ваш login shell і імпортує лише відсутні очікувані ключі (ніколи не перевизначає наявні). Еквіваленти env vars:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='I set COPILOT_GITHUB_TOKEN, but models status shows "Shell env: off." Why?'>
    `openclaw models status` показує, чи увімкнено **імпорт env із shell**. "Shell env: off"
    **не** означає, що ваших env vars немає — це лише означає, що OpenClaw не завантажуватиме
    ваш login shell автоматично.

    Якщо Gateway працює як сервіс (launchd/systemd), він не успадковує середовище
    вашого shell. Виправте це одним із таких способів:

    1. Додайте токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або увімкніть імпорт shell (`env.shellEnv.enabled: true`).
    3. Або додайте його в блок `env` вашої конфігурації (застосовується лише якщо значення відсутнє).

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
  <Accordion title="How do I start a fresh conversation?">
    Надішліть `/new` або `/reset` окремим повідомленням. Див. [Session management](/uk/concepts/session).
  </Accordion>

  <Accordion title="Do sessions reset automatically if I never send /new?">
    Термін дії сесій може завершуватися після `session.idleMinutes`, але це **типово вимкнено** (типове значення **0**).
    Задайте додатне значення, щоб увімкнути завершення через неактивність. Коли це ввімкнено, **наступне**
    повідомлення після періоду неактивності запускає новий id сесії для цього ключа чату.
    Це не видаляє transcript — лише починає нову сесію.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Is there a way to make a team of OpenClaw instances (one CEO and many agents)?">
    Так, через **маршрутизацію multi-agent** і **sub-agents**. Ви можете створити одного координатора
    та кількох агентів-працівників із власними робочими областями й моделями.

    Утім, це краще розглядати як **цікавий експеримент**. Він потребує багато токенів і часто
    менш ефективний, ніж використання одного бота з окремими сесіями. Типова модель, яку ми
    уявляємо, — це один бот, з яким ви спілкуєтеся, але з різними сесіями для паралельної роботи. Цей
    бот також може породжувати sub-agents, коли це потрібно.

    Документація: [Multi-agent routing](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [Agents CLI](/uk/cli/agents).

  </Accordion>

  <Accordion title="Why did context get truncated mid-task? How do I prevent it?">
    Контекст сесії обмежений вікном моделі. Довгі чати, великі виводи інструментів або багато
    файлів можуть спричинити Compaction або обрізання.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими завданнями, а `/new` — при зміні теми.
    - Тримайте важливий контекст у робочій області й просіть бота прочитати його знову.
    - Використовуйте sub-agents для довгої або паралельної роботи, щоб основний чат залишався меншим.
    - Виберіть модель із більшим вікном контексту, якщо це трапляється часто.

  </Accordion>

  <Accordion title="How do I completely reset OpenClaw but keep it installed?">
    Використайте команду скидання:

    ```bash
    openclaw reset
    ```

    Неінтерактивне повне скидання:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Потім знову виконайте налаштування:

    ```bash
    openclaw onboard --install-daemon
    ```

    Примітки:

    - Онбординг також пропонує **Reset**, якщо бачить наявну конфігурацію. Див. [Onboarding (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен каталог стану (типово це `~/.openclaw-<profile>`).
    - Скидання для Dev: `openclaw gateway --dev --reset` (лише для dev; стирає dev-конфігурацію + облікові дані + сесії + робочу область).

  </Accordion>

  <Accordion title='I am getting "context too large" errors - how do I reset or compact?'>
    Використайте один із варіантів:

    - **Compact** (зберігає розмову, але підсумовує старіші ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб спрямувати підсумок.

    - **Reset** (новий id сесії для того самого ключа чату):

      ```
      /new
      /reset
      ```

    Якщо це постійно повторюється:

    - Увімкніть або налаштуйте **очищення сесії** (`agents.defaults.contextPruning`), щоб обрізати старий вивід інструментів.
    - Використовуйте модель з більшим вікном контексту.

    Документація: [Compaction](/uk/concepts/compaction), [Session pruning](/uk/concepts/session-pruning), [Session management](/uk/concepts/session).

  </Accordion>

  <Accordion title='Why am I seeing "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка перевірки провайдера: модель згенерувала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія сесії застаріла або пошкоджена (часто після довгих thread
    або після зміни інструмента/схеми).

    Виправлення: почніть нову сесію за допомогою `/new` (окремим повідомленням).

  </Accordion>

  <Accordion title="Why am I getting heartbeat messages every 30 minutes?">
    Heartbeat виконуються кожні **30m** типово (**1h** при використанні OAuth auth). Налаштуйте або вимкніть їх:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // або "0m" для вимкнення
          },
        },
      },
    }
    ```

    Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки й markdown-заголовки
    на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб зекономити виклики API.
    Якщо файл відсутній, heartbeat усе одно виконується, а модель вирішує, що робити.

    Перевизначення для окремих агентів використовують `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Do I need to add a "bot account" to a WhatsApp group?'>
    Ні. OpenClaw працює у **вашому власному обліковому записі**, тож якщо ви перебуваєте в групі, OpenClaw може її бачити.
    Типово відповіді в групах заблоковано, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

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

  <Accordion title="How do I get the JID of a WhatsApp group?">
    Варіант 1 (найшвидший): переглядайте журнали в реальному часі й надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Шукайте `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/додано до allowlist): перелічіть групи з конфігурації:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/uk/cli/directory), [Logs](/uk/cli/logs).

  </Accordion>

  <Accordion title="Why does OpenClaw not reply in a group?">
    Є дві поширені причини:

    - Обмеження за згадкою увімкнене (типово). Ви маєте @згадати бота (або відповідати `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і групу не додано до allowlist.

    Див. [Groups](/uk/channels/groups) і [Group messages](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Do groups/threads share context with DMs?">
    Прямі чати типово згортаються в основну сесію. Групи/канали мають власні ключі сесій, а теми Telegram / thread Discord — це окремі сесії. Див. [Groups](/uk/channels/groups) і [Group messages](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="How many workspaces and agents can I create?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але стежте за таким:

    - **Зростання диска:** сесії + transcript зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартість токенів:** більше агентів означає більше одночасного використання моделей.
    - **Операційні витрати:** auth profiles, робочі області та маршрутизація каналів для кожного агента.

    Поради:

    - Тримайте одну **активну** робочу область на агента (`agents.defaults.workspace`).
    - Очищуйте старі сесії (видаляйте JSONL або записи сховища), якщо диск росте.
    - Використовуйте `openclaw doctor`, щоб виявляти зайві робочі області та невідповідності профілів.

  </Accordion>

  <Accordion title="Can I run multiple bots or chats at the same time (Slack), and how should I set that up?">
    Так. Використовуйте **Multi-Agent Routing**, щоб запускати кількох ізольованих агентів і маршрутизувати вхідні повідомлення за
    каналом/обліковим записом/співрозмовником. Slack підтримується як канал і може бути прив’язаний до конкретних агентів.

    Доступ до браузера потужний, але це не «виконання всього, що може людина» — anti-bot, CAPTCHA та MFA
    усе ще можуть блокувати автоматизацію. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на хості
    або CDP на машині, яка фактично запускає браузер.

    Налаштування за найкращими практиками:

    - Хост Gateway, що завжди ввімкнений (VPS/Mac mini).
    - Один агент на роль (bindings).
    - Канал(и) Slack, прив’язані до цих агентів.
    - Локальний браузер через Chrome MCP або node, коли потрібно.

    Документація: [Multi-Agent Routing](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Browser](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі, failover і auth profiles

Питання й відповіді про моделі — типові значення, вибір, аліаси, перемикання, failover, auth profiles —
перенесено на окрему сторінку:
[FAQ — models and auth profiles](/uk/help/faq-models).

## Gateway: порти, «already running» і віддалений режим

<AccordionGroup>
  <Accordion title="What port does the Gateway use?">
    `gateway.port` керує єдиним мультиплексованим портом для WebSocket + HTTP (Control UI, hooks тощо).

    Пріоритет:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > типове значення 18789
    ```

  </Accordion>

  <Accordion title='Why does openclaw gateway status say "Runtime: running" but "Connectivity probe: failed"?'>
    Тому що "running" — це погляд **supervisor** (launchd/systemd/schtasks). А connectivity probe — це вже фактичне підключення CLI до gateway WebSocket.

    Використовуйте `openclaw gateway status` і довіряйте цим рядкам:

    - `Probe target:` (URL, який probe реально використав)
    - `Listening:` (що насправді прив’язано до порту)
    - `Last gateway error:` (типова першопричина, коли процес живий, але порт не слухає)

  </Accordion>

  <Accordion title='Why does openclaw gateway status show "Config (cli)" and "Config (service)" different?'>
    Ви редагуєте один файл конфігурації, а сервіс працює з іншим (часто це невідповідність `--profile` / `OPENCLAW_STATE_DIR`).

    Виправлення:

    ```bash
    openclaw gateway install --force
    ```

    Запускайте це з тим самим `--profile` / середовищем, яке має використовувати сервіс.

  </Accordion>

  <Accordion title='What does "another gateway instance is already listening" mean?'>
    OpenClaw забезпечує runtime-lock, одразу прив’язуючи слухач WebSocket під час запуску (типово `ws://127.0.0.1:18789`). Якщо прив’язка завершується помилкою `EADDRINUSE`, викидається `GatewayLockError`, що означає: інший екземпляр уже слухає.

    Виправлення: зупиніть інший екземпляр, звільніть порт або запускайте з `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="How do I run OpenClaw in remote mode (client connects to a Gateway elsewhere)?">
    Задайте `gateway.mode: "remote"` і вкажіть віддалену URL-адресу WebSocket, за бажанням із клієнтськими обліковими даними спільного секрету:

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

    - `openclaw gateway` запускається лише коли `gateway.mode` дорівнює `local` (або якщо ви передали прапорець перевизначення).
    - Застосунок macOS стежить за файлом конфігурації й перемикає режими на льоту, коли ці значення змінюються.
    - `gateway.remote.token` / `.password` — це лише клієнтські облікові дані для віддаленого підключення; самі по собі вони не вмикають локальний auth для gateway.

  </Accordion>

  <Accordion title='The Control UI says "unauthorized" (or keeps reconnecting). What now?'>
    Ваш шлях auth для gateway і метод auth у UI не збігаються.

    Факти (з коду):

    - Control UI зберігає токен у `sessionStorage` для поточної сесії вкладки браузера та вибраної URL-адреси gateway, тож оновлення в тій самій вкладці продовжують працювати без відновлення довготривалого зберігання токена в localStorage.
    - У разі `AUTH_TOKEN_MISMATCH` довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном пристрою, коли gateway повертає підказки для повтору (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Та повторна спроба з кешованим токеном тепер повторно використовує кешовані затверджені scopes, збережені разом із токеном пристрою. Виклики з явними `deviceToken` / явними `scopes` і далі зберігають запитаний набір scopes, а не успадковують кешовані.
    - Поза цим шляхом повторної спроби пріоритет auth для connect такий: явний спільний token/password спочатку, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap token.
    - Перевірки scopes для bootstrap token мають префікси ролей. Вбудований allowlist bootstrap operator задовольняє лише запити operator; node або інші ролі не operator усе ще потребують scopes під власним префіксом ролі.

    Виправлення:

    - Найшвидше: `openclaw dashboard` (виводить і копіює URL dashboard, намагається відкрити; у headless показує підказку SSH).
    - Якщо у вас ще немає токена: `openclaw doctor --generate-gateway-token`.
    - Якщо віддалено, спочатку створіть тунель: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`.
    - Режим спільного секрету: задайте `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, а потім вставте відповідний секрет у налаштуваннях Control UI.
    - Режим Tailscale Serve: переконайтеся, що `gateway.auth.allowTailscale` увімкнений і ви відкриваєте саме URL Serve, а не raw loopback/tailnet URL, що обходить заголовки ідентичності Tailscale.
    - Режим trusted-proxy: переконайтеся, що ви заходите через налаштований identity-aware proxy не на loopback, а не через loopback proxy того самого хоста чи raw URL gateway.
    - Якщо невідповідність зберігається після однієї повторної спроби, виконайте rotation/re-approve токена paired device:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Якщо цей виклик rotate повідомляє, що його відхилено, перевірте дві речі:
      - сесії paired-device можуть робити rotation лише для **власного** пристрою, якщо в них немає також `operator.admin`
      - явні значення `--scope` не можуть перевищувати поточні operator scopes викликача
    - Усе ще не виходить? Запустіть `openclaw status --all` і дотримуйтеся [Troubleshooting](/uk/gateway/troubleshooting). Подробиці auth див. у [Dashboard](/uk/web/dashboard).

  </Accordion>

  <Accordion title="I set gateway.bind tailnet but it cannot bind and nothing listens">
    Прив’язка `tailnet` вибирає Tailscale IP з мережевих інтерфейсів (100.64.0.0/10). Якщо машина не підключена до Tailscale (або інтерфейс вимкнений), прив’язуватися просто нема до чого.

    Виправлення:

    - Запустіть Tailscale на цьому хості (щоб він отримав адресу 100.x), або
    - Перемкніться на `gateway.bind: "loopback"` / `"lan"`.

    Примітка: `tailnet` є явним режимом. `auto` надає перевагу loopback; використовуйте `gateway.bind: "tailnet"`, коли хочете прив’язку лише до tailnet.

  </Accordion>

  <Accordion title="Can I run multiple Gateways on the same host?">
    Зазвичай ні — один Gateway може обслуговувати кілька каналів обміну повідомленнями та агентів. Кілька Gateway використовуйте лише тоді, коли потрібна надлишковість (наприклад, rescue bot) або жорстка ізоляція.

    Так, але потрібно ізолювати:

    - `OPENCLAW_CONFIG_PATH` (конфігурація для кожного екземпляра)
    - `OPENCLAW_STATE_DIR` (стан для кожного екземпляра)
    - `agents.defaults.workspace` (ізоляція робочої області)
    - `gateway.port` (унікальні порти)

    Швидке налаштування (рекомендовано):

    - Використовуйте `openclaw --profile <name> ...` для кожного екземпляра (автоматично створює `~/.openclaw-<name>`).
    - Задайте унікальний `gateway.port` у конфігурації кожного профілю (або передайте `--port` для ручних запусків).
    - Встановіть сервіс для кожного профілю: `openclaw --profile <name> gateway install`.

    Профілі також додають суфікси до назв сервісів (`ai.openclaw.<profile>`; застарілі `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Повна інструкція: [Multiple gateways](/uk/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='What does "invalid handshake" / code 1008 mean?'>
    Gateway — це **сервер WebSocket**, і він очікує, що першим повідомленням
    буде кадр `connect`. Якщо він отримує щось інше, то закриває з’єднання
    з **code 1008** (порушення політики).

    Типові причини:

    - Ви відкрили URL **HTTP** у браузері (`http://...`) замість клієнта WS.
    - Ви використали неправильний порт або шлях.
    - Proxy або тунель прибрав заголовки auth або надіслав запит не до Gateway.

    Швидкі виправлення:

    1. Використовуйте URL WS: `ws://<host>:18789` (або `wss://...`, якщо HTTPS).
    2. Не відкривайте порт WS у звичайній вкладці браузера.
    3. Якщо auth увімкнений, включіть token/password у кадр `connect`.

    Якщо ви використовуєте CLI або TUI, URL має виглядати так:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Подробиці протоколу: [Gateway protocol](/uk/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Журнали та налагодження

<AccordionGroup>
  <Accordion title="Where are logs?">
    Файлові журнали (структуровані):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Ви можете задати стабільний шлях через `logging.file`. Рівень файлових журналів контролюється `logging.level`. Деталізація консолі контролюється `--verbose` і `logging.consoleLevel`.

    Найшвидший перегляд журналу в реальному часі:

    ```bash
    openclaw logs --follow
    ```

    Журнали сервісу/supervisor (коли gateway працює через launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` і `gateway.err.log` (типово: `~/.openclaw/logs/...`; профілі використовують `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Додатково див. [Troubleshooting](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="How do I start/stop/restart the Gateway service?">
    Використовуйте допоміжні команди gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви запускаєте gateway вручну, `openclaw gateway --force` може повернути собі порт. Див. [Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="I closed my terminal on Windows - how do I restart OpenClaw?">
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

    **2) Native Windows (не рекомендовано):** Gateway працює безпосередньо у Windows.

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

  <Accordion title="The Gateway is up but replies never arrive. What should I check?">
    Почніть із швидкої перевірки стану:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Типові причини:

    - Auth моделі не завантажено на **хості gateway** (перевірте `models status`).
    - Pairing/allowlist каналу блокує відповіді (перевірте конфігурацію каналу + журнали).
    - WebChat/Dashboard відкрито без правильного токена.

    Якщо ви працюєте віддалено, переконайтеся, що тунель/Tailscale-підключення активне і що
    Gateway WebSocket доступний.

    Документація: [Channels](/uk/channels), [Troubleshooting](/uk/gateway/troubleshooting), [Remote access](/uk/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - what now?'>
    Зазвичай це означає, що UI втратив з’єднання WebSocket. Перевірте:

    1. Чи запущено Gateway? `openclaw gateway status`
    2. Чи Gateway у справному стані? `openclaw status`
    3. Чи UI має правильний токен? `openclaw dashboard`
    4. Якщо віддалено, чи активне з’єднання тунелю/Tailscale?

    Потім перегляньте журнали в реальному часі:

    ```bash
    openclaw logs --follow
    ```

    Документація: [Dashboard](/uk/web/dashboard), [Remote access](/uk/gateway/remote), [Troubleshooting](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands fails. What should I check?">
    Почніть із журналів і стану каналу:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Потім зіставте помилку:

    - `BOT_COMMANDS_TOO_MUCH`: у меню Telegram забагато записів. OpenClaw уже обрізає їх до ліміту Telegram і повторює спробу з меншою кількістю команд, але деякі записи меню все одно треба прибрати. Зменште кількість команд Plugin/Skill/custom або вимкніть `channels.telegram.commands.native`, якщо меню вам не потрібне.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` або подібні мережеві помилки: якщо ви працюєте на VPS або за proxy, переконайтеся, що вихідний HTTPS дозволено і DNS працює для `api.telegram.org`.

    Якщо Gateway віддалений, переконайтеся, що ви дивитеся журнали саме на хості Gateway.

    Документація: [Telegram](/uk/channels/telegram), [Channel troubleshooting](/uk/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI shows no output. What should I check?">
    Спочатку переконайтеся, що Gateway доступний і агент може працювати:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    У TUI використовуйте `/status`, щоб побачити поточний стан. Якщо ви очікуєте відповіді в чат-
    каналі, переконайтеся, що доставку увімкнено (`/deliver on`).

    Документація: [TUI](/uk/web/tui), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="How do I completely stop then start the Gateway?">
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

    Документація: [Gateway service runbook](/uk/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: перезапускає **фоновий сервіс** (launchd/systemd).
    - `openclaw gateway`: запускає gateway **на передньому плані** для цього сеансу термінала.

    Якщо ви встановили сервіс, використовуйте команди gateway. Використовуйте `openclaw gateway`, коли
    вам потрібен разовий запуск на передньому плані.

  </Accordion>

  <Accordion title="Fastest way to get more details when something fails">
    Запустіть Gateway з `--verbose`, щоб отримати більше деталей у консолі. Потім перевірте файл журналу на предмет auth каналу, маршрутизації моделі та помилок RPC.
  </Accordion>
</AccordionGroup>

## Медіа та вкладення

<AccordionGroup>
  <Accordion title="My skill generated an image/PDF, but nothing was sent">
    Вихідні вкладення від агента мають містити рядок `MEDIA:<path-or-url>` (в окремому рядку). Див. [OpenClaw assistant setup](/uk/start/openclaw) і [Agent send](/uk/tools/agent-send).

    Надсилання через CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Також перевірте:

    - Цільовий канал підтримує вихідні медіа і не заблокований allowlist.
    - Файл не перевищує обмеження розміру провайдера (зображення змінюються до максимуму 2048px).
    - `tools.fs.workspaceOnly=true` обмежує надсилання локальних шляхів робочою областю, temp/media-store і файлами, перевіреними sandbox.
    - `tools.fs.workspaceOnly=false` дозволяє `MEDIA:` надсилати локальні файли хоста, які агент уже може читати, але лише для медіа плюс безпечних типів документів (зображення, аудіо, відео, PDF і документи Office). Звичайні текстові та схожі на секрети файли все одно блокуються.

    Див. [Images](/uk/nodes/images).

  </Accordion>
</AccordionGroup>

## Безпека та керування доступом

<AccordionGroup>
  <Accordion title="Is it safe to expose OpenClaw to inbound DMs?">
    Ставтеся до вхідних DM як до ненадійного вводу. Типові налаштування покликані зменшити ризик:

    - Типова поведінка на каналах, що підтримують DM, — **pairing**:
      - Невідомі відправники отримують код pairing; бот не обробляє їхнє повідомлення.
      - Підтвердження: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Кількість очікуваних запитів обмежена **3 на канал**; перевірте `openclaw pairing list --channel <channel> [--account <id>]`, якщо код не надійшов.
    - Публічне відкриття DM потребує явної згоди (`dmPolicy: "open"` і allowlist `"*"`).

    Запустіть `openclaw doctor`, щоб виявити ризиковані політики DM.

  </Accordion>

  <Accordion title="Is prompt injection only a concern for public bots?">
    Ні. Prompt injection стосується **ненадійного вмісту**, а не лише того, хто може надсилати DM боту.
    Якщо ваш асистент читає зовнішній вміст (web search/fetch, сторінки браузера, листи,
    документи, вкладення, вставлені журнали), цей вміст може містити інструкції, що намагаються
    перехопити керування моделлю. Це може статися, навіть якщо **єдиний відправник — ви**.

    Найбільший ризик виникає, коли увімкнено інструменти: модель можна змусити
    витягувати контекст або викликати інструменти від вашого імені. Зменшуйте зону ураження так:

    - використовуйте агента-«читача» лише для читання або без інструментів, щоб підсумовувати ненадійний вміст
    - тримайте `web_search` / `web_fetch` / `browser` вимкненими для агентів з увімкненими інструментами
    - також ставтеся до декодованого тексту файлів/документів як до ненадійного: OpenResponses
      `input_file` і витягування з медіавкладень обидва обгортають витягнутий текст
      у явні маркери меж зовнішнього вмісту замість передавання сирого тексту файла
    - використовуйте sandboxing і суворі allowlist інструментів

    Подробиці: [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Should my bot have its own email, GitHub account, or phone number?">
    Так, у більшості сценаріїв. Ізоляція бота окремими обліковими записами та телефонними номерами
    зменшує зону ураження, якщо щось піде не так. Це також полегшує rotation
    облікових даних або відкликання доступу без впливу на ваші особисті облікові записи.

    Починайте з малого. Надавайте доступ лише до тих інструментів і облікових записів, які вам справді потрібні, і розширюйте
    пізніше, якщо буде потрібно.

    Документація: [Security](/uk/gateway/security), [Pairing](/uk/channels/pairing).

  </Accordion>

  <Accordion title="Can I give it autonomy over my text messages and is that safe?">
    Ми **не** рекомендуємо повну автономію над вашими особистими повідомленнями. Найбезпечніший шаблон:

    - Тримайте DM у режимі **pairing** або зі строгим allowlist.
    - Використовуйте **окремий номер або обліковий запис**, якщо хочете, щоб бот надсилав повідомлення від вашого імені.
    - Дозвольте йому створити чернетку, а потім **підтверджуйте перед надсиланням**.

    Якщо хочете поекспериментувати, робіть це на окремому обліковому записі й тримайте його ізольованим. Див.
    [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Can I use cheaper models for personal assistant tasks?">
    Так, **якщо** агент працює лише в чаті, а вхідні дані є довіреними. Молодші рівні
    більш вразливі до захоплення інструкціями, тому уникайте їх для агентів з увімкненими інструментами
    або при читанні ненадійного вмісту. Якщо вже мусите використовувати меншу модель, жорстко обмежте
    інструменти й запускайте всередині sandbox. Див. [Security](/uk/gateway/security).
  </Accordion>

  <Accordion title="I ran /start in Telegram but did not get a pairing code">
    Коди pairing надсилаються **лише** коли невідомий відправник пише боту і
    `dmPolicy: "pairing"` увімкнено. Сам по собі `/start` не генерує код.

    Перевірте очікувані запити:

    ```bash
    openclaw pairing list telegram
    ```

    Якщо вам потрібен негайний доступ, додайте свій id відправника в allowlist або задайте `dmPolicy: "open"`
    для цього облікового запису.

  </Accordion>

  <Accordion title="WhatsApp: will it message my contacts? How does pairing work?">
    Ні. Типова політика DM у WhatsApp — **pairing**. Невідомі відправники отримують лише код pairing, і їхнє повідомлення **не обробляється**. OpenClaw відповідає лише на чати, які він отримує, або на явні надсилання, які ви ініціюєте.

    Підтвердження pairing:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Перелік очікуваних запитів:

    ```bash
    openclaw pairing list whatsapp
    ```

    Запит номера телефону у wizard: він використовується, щоб задати ваш **allowlist/owner**, аби ваші власні DM були дозволені. Він не використовується для автоматичного надсилання. Якщо ви запускаєте OpenClaw на своєму особистому номері WhatsApp, використайте цей номер і ввімкніть `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Команди чату, переривання завдань і «він не зупиняється»

<AccordionGroup>
  <Accordion title="How do I stop internal system messages from showing in chat?">
    Більшість внутрішніх або службових повідомлень від інструментів з’являються лише тоді, коли для цієї сесії увімкнено **verbose**, **trace** або **reasoning**.

    Виправлення в тому чаті, де ви це бачите:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Якщо шум усе ще є, перевірте налаштування сесії в Control UI і встановіть verbose
    у значення **inherit**. Також переконайтеся, що ви не використовуєте профіль бота з `verboseDefault`, встановленим
    у `on` в конфігурації.

    Документація: [Thinking and verbose](/uk/tools/thinking), [Security](/uk/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="How do I stop/cancel a running task?">
    Надішліть будь-яку з цих фраз **як окреме повідомлення** (без скісної риски):

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

    Це тригери переривання (а не slash-команди).

    Для фонових процесів (з інструмента exec) ви можете попросити агента виконати:

    ```
    process action:kill sessionId:XXX
    ```

    Огляд slash-команд: див. [Slash commands](/uk/tools/slash-commands).

    Більшість команд треба надсилати як **окреме** повідомлення, що починається з `/`, але кілька скорочень (як-от `/status`) також працюють inline для відправників з allowlist.

  </Accordion>

  <Accordion title='How do I send a Discord message from Telegram? ("Cross-context messaging denied")'>
    OpenClaw типово блокує обмін повідомленнями **між різними провайдерами**. Якщо виклик інструмента прив’язаний
    до Telegram, він не надсилатиме в Discord, якщо ви явно цього не дозволите.

    Увімкніть міжпровайдерський обмін повідомленнями для агента:

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

  <Accordion title='Why does it feel like the bot "ignores" rapid-fire messages?'>
    Режим черги керує тим, як нові повідомлення взаємодіють із поточним активним запуском. Використовуйте `/queue`, щоб змінити режими:

    - `steer` — нові повідомлення перенаправляють поточне завдання
    - `followup` — повідомлення виконуються по одному
    - `collect` — повідомлення накопичуються в пакет, і бот відповідає один раз (типово)
    - `steer-backlog` — перенаправити зараз, а потім обробити чергу
    - `interrupt` — перервати поточний запуск і почати заново

    Можна додавати параметри на кшталт `debounce:2s cap:25 drop:summarize` для режимів followup.

  </Accordion>
</AccordionGroup>

## Різне

<AccordionGroup>
  <Accordion title='Яка типова модель для Anthropic з API key?'>
    В OpenClaw облікові дані та вибір моделі розділені. Задання `ANTHROPIC_API_KEY` (або збереження API key Anthropic в auth profiles) вмикає автентифікацію, але фактична типова модель — це та, яку ви налаштували в `agents.defaults.model.primary` (наприклад, `anthropic/claude-sonnet-4-6` або `anthropic/claude-opus-4-6`). Якщо ви бачите `No credentials found for profile "anthropic:default"`, це означає, що Gateway не зміг знайти облікові дані Anthropic в очікуваному `auth-profiles.json` для агента, який зараз працює.
  </Accordion>
</AccordionGroup>

---

Усе ще не виходить? Запитайте в [Discord](https://discord.com/invite/clawd) або відкрийте [GitHub discussion](https://github.com/openclaw/openclaw/discussions).
