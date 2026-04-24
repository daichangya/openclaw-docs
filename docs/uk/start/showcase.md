---
description: Real-world OpenClaw projects from the community
read_when:
    - Шукаєте реальні приклади використання OpenClaw
    - Оновлення добірки проєктів спільноти
summary: Створені спільнотою проєкти та інтеграції на базі OpenClaw
title: Вітрина
x-i18n:
    generated_at: "2026-04-24T04:19:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: db901336bb0814eae93453331a58aa267024afeb53f259f5e2a4d71df1039ad2
    source_path: start/showcase.md
    workflow: 15
---

Проєкти OpenClaw — це не іграшкові демо. Люди вже запускають цикли рев’ю PR, мобільні застосунки, домашню автоматизацію, голосові системи, devtools і робочі процеси з насиченою пам’яттю з тих каналів, якими вони вже користуються — chat-native збірки в Telegram, WhatsApp, Discord і терміналах; реальна автоматизація для бронювання, покупок і підтримки без очікування на API; а також інтеграції з фізичним світом для принтерів, пилососів, камер і домашніх систем.

<Info>
**Хочете потрапити до добірки?** Поділіться своїм проєктом у [#self-promotion на Discord](https://discord.gg/clawd) або [позначте @openclaw на X](https://x.com/openclaw).
</Info>

## Відео

Почніть тут, якщо хочете найкоротший шлях від «що це таке?» до «гаразд, я зрозумів».

<CardGroup cols={3}>

<Card title="Повний покроковий огляд налаштування" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark, 28 хвилин. Установлення, онбординг і повноцінний запуск першого робочого асистента від початку до кінця.
</Card>

<Card title="Шоуріл зі спільнотою" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  Швидший огляд реальних проєктів, поверхонь і робочих процесів, побудованих навколо OpenClaw.
</Card>

<Card title="Проєкти в реальному світі" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  Приклади від спільноти: від chat-native циклів кодування до обладнання та персональної автоматизації.
</Card>

</CardGroup>

## Свіже з Discord

Нещодавні яскраві приклади з кодування, devtools, мобільних рішень і chat-native створення продуктів.

<CardGroup cols={2}>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode завершує зміну, відкриває PR, OpenClaw переглядає diff і відповідає в Telegram із пропозиціями та чітким вердиктом щодо merge.

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Відгук OpenClaw про рев’ю PR, доставлений у Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Попросили "Robby" (@openclaw) створити локальний skill для винного льоху. Він запитує приклад експорту CSV і шлях збереження, а потім створює та тестує skill (у прикладі 962 пляшки).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw створює локальний skill для винного льоху з CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Щотижневий план харчування, постійні товари, бронювання слота доставки, підтвердження замовлення. Без API, лише керування браузером.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Автоматизація покупок Tesco через чат" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Гаряча клавіша для області екрана, Gemini vision, миттєвий Markdown у буфері обміну.

  <img src="/assets/showcase/snag.png" alt="Інструмент SNAG для перетворення знімка екрана в markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Настільний застосунок для керування skills і командами в Agents, Claude, Codex і OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Застосунок Agents UI" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Спільнота** • `voice` `tts` `telegram`

Обгортає TTS від papla.media і надсилає результат як голосові повідомлення Telegram (без надокучливого автозапуску).

  <img src="/assets/showcase/papla-tts.jpg" alt="Голосове повідомлення Telegram, згенероване з TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Помічник, установлюваний через Homebrew, для перегляду списку, перевірки та моніторингу локальних сесій OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor на ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Керування та налагодження принтерів BambuLab: стан, завдання, камера, AMS, калібрування тощо.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI на ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Відправлення в реальному часі, перебої, стан ліфтів і маршрути для громадського транспорту Відня.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien на ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Автоматизоване бронювання шкільних обідів у Великій Британії через ParentPay. Використовує координати миші для надійного натискання на клітинки таблиці.
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Вивантаження в Cloudflare R2/S3 і створення захищених presigned-посилань для завантаження. Корисно для віддалених інсталяцій OpenClaw.
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Повноцінний застосунок iOS з картами та записом голосу, розгорнутий у TestFlight повністю через чат Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="Застосунок iOS у TestFlight" />
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Персональний AI-асистент для здоров’я з інтеграцією даних Oura ring із календарем, зустрічами та розкладом спортзалу.

  <img src="/assets/showcase/oura-health.png" alt="Асистент здоров’я з Oura ring" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

14+ agents під одним gateway, де оркестратор Opus 4.5 делегує роботу працівникам Codex. Див. [технічний опис](https://github.com/adam91holt/orchestrated-ai-articles) і [Clawdspace](https://github.com/adam91holt/clawdspace) для ізоляції agent.
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

CLI для Linear, який інтегрується з agentic-робочими процесами (Claude Code, OpenClaw). Керування issue, проєктами та робочими процесами з термінала.
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Читання, надсилання та архівування повідомлень через Beeper Desktop. Використовує локальний API MCP Beeper, щоб agents могли керувати всіма вашими чатами (iMessage, WhatsApp тощо) в одному місці.
</Card>

</CardGroup>

## Автоматизація та робочі процеси

Планування, керування браузером, цикли підтримки й сторона продукту в стилі «просто виконай це завдання за мене».

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code виявив і підтвердив елементи керування очищувачем, після чого OpenClaw перебрав керування для підтримання якості повітря в кімнаті.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Керування очищувачем повітря Winix через OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

Запускається з камери на даху: попросіть OpenClaw зробити знімок неба, коли воно виглядає гарно. Він спроєктував skill і зробив фото.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Знімок неба з камери на даху, зроблений OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

Запланований prompt щоранку створює одне сюжетне зображення (погода, завдання, дата, улюблений допис або цитата) через persona OpenClaw.
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

CLI для перевірки доступності та бронювання через Playtomic. Більше ніколи не пропустіть вільний корт.

  <img src="/assets/showcase/padel-screenshot.jpg" alt="Знімок екрана padel-cli" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Спільнота** • `automation` `email` `pdf`

Збирає PDF з електронної пошти, готує документи для податкового консультанта. Щомісячний бухгалтерський облік на автопілоті.
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Повністю перебудований особистий сайт через Telegram під час перегляду Netflix — міграція з Notion до Astro, перенесено 18 дописів, DNS до Cloudflare. Ноутбук навіть не відкривався.
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Шукає вакансії, зіставляє їх із ключовими словами з CV і повертає релевантні можливості з посиланнями. Створено за 30 хвилин із використанням API JSearch.
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw підключився до Jira, а потім на льоту згенерував новий skill (ще до того, як він з’явився в ClawHub).
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Автоматизував завдання Todoist і попросив OpenClaw згенерувати skill безпосередньо в чаті Telegram.
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Входить у TradingView через автоматизацію браузера, робить знімки графіків і виконує технічний аналіз на вимогу. Без API — лише керування браузером.
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Слідкує за каналом компанії в Slack, корисно відповідає й пересилає сповіщення в Telegram. Автономно виправив продакшн-баг у розгорнутому застосунку без окремого запиту.
</Card>

</CardGroup>

## Знання та пам’ять

Системи, які індексують, шукають, запам’ятовують і міркують над персональними або командними знаннями.

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

Рушій вивчення китайської мови з відгуком щодо вимови та навчальними сценаріями через OpenClaw.

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Відгук про вимову в xuezh" />
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Спільнота** • `memory` `transcription` `indexing`

Імпортує повні експорти WhatsApp, транскрибує понад 1 тис. голосових нотаток, звіряє з git-логами, формує пов’язані звіти в markdown.
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Додає векторний пошук до закладок Karakeep за допомогою Qdrant і embeddings OpenAI або Ollama.
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Спільнота** • `memory` `beliefs` `self-model`

Окремий менеджер пам’яті, який перетворює файли сесій на спогади, потім на переконання, а далі — на еволюційну self model.
</Card>

</CardGroup>

## Голос і телефон

Точки входу з акцентом на мовлення, телефонні bridge і робочі процеси з інтенсивною транскрипцією.

<CardGroup cols={2}>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

HTTP bridge від голосового асистента Vapi до OpenClaw. Телефонні дзвінки з вашим agent майже в реальному часі.
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Багатомовна транскрипція аудіо через OpenRouter (Gemini тощо). Доступно на ClawHub.
</Card>

</CardGroup>

## Інфраструктура та розгортання

Пакування, розгортання та інтеграції, які спрощують запуск і розширення OpenClaw.

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Gateway OpenClaw, запущений на Home Assistant OS, із підтримкою SSH-тунелю та постійним станом.
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

Керуйте та автоматизуйте пристрої Home Assistant за допомогою природної мови.
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

OpenClaw-конфігурація у стилі Nix з усім необхідним для відтворюваних розгортань.
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

Skill календаря на основі khal і vdirsyncer. Інтеграція із self-host календарем.
</Card>

</CardGroup>

## Дім і обладнання

Фізичний бік OpenClaw: домівки, датчики, камери, пилососи та інші пристрої.

<CardGroup cols={2}>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Домашня автоматизація в стилі Nix з OpenClaw як інтерфейсом, а також інформаційні панелі Grafana.

  <img src="/assets/showcase/gohome-grafana.png" alt="Інформаційна панель GoHome Grafana" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

Керуйте своїм роботом-пилососом Roborock через природну розмову.

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Стан Roborock" />
</Card>

</CardGroup>

## Проєкти спільноти

Речі, які виросли за межі одного робочого процесу в ширші продукти або екосистеми.

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **Спільнота** • `marketplace` `astronomy` `webapp`

Повноцінний маркетплейс астрономічного обладнання. Створено з OpenClaw і навколо його екосистеми.
</Card>

</CardGroup>

## Надішліть свій проєкт

<Steps>
  <Step title="Поділіться ним">
    Опублікуйте в [#self-promotion на Discord](https://discord.gg/clawd) або [згадайте @openclaw у tweet](https://x.com/openclaw).
  </Step>
  <Step title="Додайте деталі">
    Розкажіть, що він робить, дайте посилання на репозиторій або демо та поділіться знімком екрана, якщо він у вас є.
  </Step>
  <Step title="Потрапте до добірки">
    Ми додамо найяскравіші проєкти на цю сторінку.
  </Step>
</Steps>

## Пов’язане

- [Початок роботи](/uk/start/getting-started)
- [OpenClaw](/uk/start/openclaw)
