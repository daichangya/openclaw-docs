---
description: Real-world OpenClaw projects from the community
read_when:
    - Пошук реальних прикладів використання OpenClaw
    - Оновлення добірки проєктів спільноти
summary: Проєкти та інтеграції, створені спільнотою на базі OpenClaw
title: Вітрина
x-i18n:
    generated_at: "2026-04-23T06:47:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bf4bd2548709a01ad18331537f804b32c3213139c2234915aa17f7a2638f19f
    source_path: start/showcase.md
    workflow: 15
---

# Вітрина

<div className="showcase-hero">
  <p className="showcase-kicker">Створено в чатах, терміналах, браузерах і вітальнях</p>
  <p className="showcase-lead">
    Проєкти OpenClaw — не іграшкові демо. Люди запускають цикли рев’ю PR, мобільні застосунки, домашню автоматизацію,
    голосові системи, devtools і робочі процеси з великим обсягом пам’яті з каналів, якими вони вже користуються.
  </p>
  <div className="showcase-actions">
    <a href="#videos">Дивитися демо</a>
    <a href="#fresh-from-discord">Переглянути проєкти</a>
    <a href="https://discord.gg/clawd">Поділитися своїм</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>Розробка, природна для чатів</strong>
      <span>Telegram, WhatsApp, Discord, Beeper, вебчат і робочі процеси з акцентом на термінал.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Справжня автоматизація</strong>
      <span>Бронювання, покупки, підтримка, звітність і керування браузером без очікування на API.</span>
    </div>
    <div className="showcase-highlight">
      <strong>Локальний + фізичний світ</strong>
      <span>Принтери, пилососи, камери, дані про здоров’я, домашні системи та особисті бази знань.</span>
    </div>
  </div>
</div>

<Info>
**Хочете потрапити у добірку?** Поділіться своїм проєктом у [#self-promotion на Discord](https://discord.gg/clawd) або [позначте @openclaw на X](https://x.com/openclaw).
</Info>

<div className="showcase-jump-links">
  <a href="#videos">Відео</a>
  <a href="#fresh-from-discord">Свіже з Discord</a>
  <a href="#automation-workflows">Автоматизація</a>
  <a href="#knowledge-memory">Пам’ять</a>
  <a href="#voice-phone">Голос і телефонія</a>
  <a href="#infrastructure-deployment">Інфраструктура</a>
  <a href="#home-hardware">Дім і обладнання</a>
  <a href="#community-projects">Спільнота</a>
  <a href="#submit-your-project">Надіслати проєкт</a>
</div>

## Відео

<p className="showcase-section-intro">
  Почніть тут, якщо хочете найкоротший шлях від «що це таке?» до «гаразд, я зрозумів».
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: The self-hosted AI that Siri should have been (Full setup)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Повний покроковий процес налаштування</h3>
    <p>VelvetShark, 28 хвилин. Встановлення, onboarding і перший робочий асистент від початку до кінця.</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">Дивитися на YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="OpenClaw showcase video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Добірка проєктів спільноти</h3>
    <p>Швидший огляд реальних проєктів, поверхонь і робочих процесів, побудованих навколо OpenClaw.</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">Дивитися на YouTube</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="OpenClaw community showcase"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>Проєкти з реального світу</h3>
    <p>Приклади від спільноти: від циклів програмування, природних для чатів, до обладнання та особистої автоматизації.</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">Дивитися на YouTube</a>
  </div>
</div>

## Свіже з Discord

<p className="showcase-section-intro">
  Нещодавні яскраві приклади в програмуванні, devtools, мобільних застосунках і розробці продуктів, природній для чатів.
</p>

<CardGroup cols={2}>

<Card title="Рев’ю PR → Відгук у Telegram" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode завершує зміну → відкриває PR → OpenClaw перевіряє diff і відповідає в Telegram «незначними зауваженнями» плюс чітким вердиктом щодо злиття (включно з критичними виправленнями, які треба застосувати спочатку).

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Відгук OpenClaw про PR, доставлений у Telegram" />
</Card>

<Card title="Skill для винного льоху за кілька хвилин" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

Попросили «Robby» (@openclaw) створити local skill для винного льоху. Він запитує зразок експорту CSV + де його зберігати, а потім швидко створює/тестує skill (у прикладі 962 пляшки).

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw створює local skill для винного льоху з CSV" />
</Card>

<Card title="Автопілот для покупок у Tesco" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

Тижневий план харчування → звичні товари → бронювання слота доставки → підтвердження замовлення. Жодних API, лише керування браузером.

  <img src="/assets/showcase/tesco-shop.jpg" alt="Автоматизація покупок у Tesco через чат" />
</Card>

<Card title="SNAG: зі скриншота в Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

Гаряча клавіша для області екрана → бачення Gemini → миттєвий Markdown у буфері обміну.

  <img src="/assets/showcase/snag.png" alt="Інструмент SNAG для перетворення скриншотів у Markdown" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Десктопний застосунок для керування Skills/командами в Agents, Claude, Codex і OpenClaw.

  <img src="/assets/showcase/agents-ui.jpg" alt="Застосунок Agents UI" />
</Card>

<Card title="Голосові повідомлення Telegram (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Спільнота** • `voice` `tts` `telegram`

Обгортає papla.media TTS і надсилає результати як голосові повідомлення Telegram (без надокучливого автовідтворення).

  <img src="/assets/showcase/papla-tts.jpg" alt="Вихід TTS як голосове повідомлення Telegram" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Допоміжний інструмент, що встановлюється через Homebrew, для перегляду/аналізу/моніторингу локальних сесій OpenAI Codex (CLI + VS Code).

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor на ClawHub" />
</Card>

<Card title="Керування 3D-принтером Bambu" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

Керування й усунення несправностей принтерів BambuLab: стан, завдання, камера, AMS, калібрування тощо.

  <img src="/assets/showcase/bambu-cli.png" alt="Skill Bambu CLI на ClawHub" />
</Card>

<Card title="Транспорт Відня (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

Відправлення в реальному часі, збої, стан ліфтів і маршрутизація для громадського транспорту Відня.

  <img src="/assets/showcase/wienerlinien.png" alt="Skill Wiener Linien на ClawHub" />
</Card>

<Card title="Шкільні обіди ParentPay" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

Автоматизоване бронювання шкільних обідів у Великій Британії через ParentPay. Використовує координати миші для надійного натискання клітинок таблиці.
</Card>

<Card title="R2 Upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Завантаження в Cloudflare R2/S3 і генерація захищених presigned-посилань для завантаження. Ідеально для віддалених інстансів OpenClaw.
</Card>

<Card title="iOS-застосунок через Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

Повністю створений iOS-застосунок із мапами й записом голосу, розгорнутий у TestFlight повністю через чат у Telegram.

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS-застосунок у TestFlight" />
</Card>

<Card title="Асистент здоров’я для Oura Ring" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Персональний AI-асистент здоров’я, що інтегрує дані Oura ring із календарем, зустрічами та розкладом спортзалу.

  <img src="/assets/showcase/oura-health.png" alt="Асистент здоров’я для Oura ring" />
</Card>
<Card title="Dream Team Кева (14+ агентів)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

14+ агентів під одним Gateway, де orchestrator на Opus 4.5 делегує завдання працівникам Codex. Детальний [технічний опис](https://github.com/adam91holt/orchestrated-ai-articles), що охоплює склад Dream Team, вибір моделей, sandboxing, Webhook, Heartbeat і потоки делегування. [Clawdspace](https://github.com/adam91holt/clawdspace) для sandboxing агентів. [Пост у блозі](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/).
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

CLI для Linear, що інтегрується з агентними робочими процесами (Claude Code, OpenClaw). Керуйте issues, проєктами й робочими процесами з термінала. Перший зовнішній PR уже злито!
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Читання, надсилання та архівування повідомлень через Beeper Desktop. Використовує local MCP API Beeper, щоб агенти могли керувати всіма вашими чатами (iMessage, WhatsApp тощо) в одному місці.
</Card>

</CardGroup>

<a id="automation-workflows"></a>

## Автоматизація й робочі процеси

<p className="showcase-section-intro">
  Планування, керування браузером, цикли підтримки та весь той бік продукту, де хочеться сказати: «просто зроби це за мене».
</p>

<CardGroup cols={2}>

<Card title="Керування очищувачем повітря Winix" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code виявив і підтвердив керування очищувачем, а потім OpenClaw перебирає керування якістю повітря в кімнаті.

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Керування очищувачем повітря Winix через OpenClaw" />
</Card>

<Card title="Гарні фото неба з камери" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

Тригер від дахуової камери: попросіть OpenClaw зробити фото неба, коли воно гарне — він спроєктував skill і зробив знімок.

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Знімок неба з даху, зроблений OpenClaw" />
</Card>

<Card title="Візуальна сцена ранкового брифінгу" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

Запланований prompt щоранку генерує одне зображення-«сцену» (погода, завдання, дата, улюблений пост/цитата) через persona OpenClaw.
</Card>

<Card title="Бронювання корту для паделу" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  CLI для перевірки доступності й бронювання в Playtomic. Більше ніколи не пропускайте вільний корт.
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="Скриншот padel-cli" />
</Card>

<Card title="Приймання бухгалтерських документів" icon="file-invoice-dollar">
  **Спільнота** • `automation` `email` `pdf`
  
  Збирає PDF із email, готує документи для податкового консультанта. Щомісячна бухгалтерія на автопілоті.
</Card>

<Card title="Режим розробки з дивана" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Відбудував увесь особистий сайт через Telegram під час перегляду Netflix — Notion → Astro, мігровано 18 дописів, DNS перенесено до Cloudflare. Жодного разу не відкривав ноутбук.
</Card>

<Card title="Агент для пошуку роботи" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

Шукає вакансії, зіставляє їх із ключовими словами з CV і повертає релевантні можливості з посиланнями. Створено за 30 хвилин з використанням API JSearch.
</Card>

<Card title="Конструктор Skill для Jira" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClaw підключився до Jira, а потім згенерував новий skill на льоту (ще до того, як він з’явився на ClawHub).
</Card>

<Card title="Skill Todoist через Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Автоматизував завдання Todoist і доручив OpenClaw згенерувати skill безпосередньо в чаті Telegram.
</Card>

<Card title="Аналіз TradingView" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

Входить у TradingView через автоматизацію браузера, робить скриншоти графіків і виконує технічний аналіз на вимогу. Жодного API — лише керування браузером.
</Card>

<Card title="Автопідтримка в Slack" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

Стежить за корпоративним каналом Slack, корисно відповідає й пересилає сповіщення в Telegram. Автономно виправив production-баг у розгорнутому застосунку без жодного запиту.
</Card>

</CardGroup>

<a id="knowledge-memory"></a>

## Знання й пам’ять

<p className="showcase-section-intro">
  Системи, які індексують, шукають, запам’ятовують і міркують над особистими або командними знаннями.
</p>

<CardGroup cols={2}>

<Card title="Вивчення китайської xuezh" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  Рушій для вивчення китайської мови з відгуком щодо вимови й навчальними процесами через OpenClaw.
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="Відгук щодо вимови xuezh" />
</Card>

<Card title="Сховище пам’яті WhatsApp" icon="vault">
  **Спільнота** • `memory` `transcription` `indexing`
  
  Імпортує повні експорти WhatsApp, транскрибує 1k+ голосових повідомлень, звіряє з журналами git, формує пов’язані звіти Markdown.
</Card>

<Card title="Семантичний пошук Karakeep" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Додає векторний пошук до закладок Karakeep за допомогою Qdrant + embeddings OpenAI/Ollama.
</Card>

<Card title="Пам’ять Inside-Out-2" icon="brain">
  **Спільнота** • `memory` `beliefs` `self-model`
  
  Окремий менеджер пам’яті, який перетворює файли сесій у спогади → переконання → еволюційну модель себе.
</Card>

</CardGroup>

<a id="voice-phone"></a>

## Голос і телефонія

<p className="showcase-section-intro">
  Точки входу, де головну роль відіграє мовлення, телефонні мости та робочі процеси з інтенсивною транскрипцією.
</p>

<CardGroup cols={2}>

<Card title="Телефонний міст Clawdia" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  HTTP-міст між голосовим асистентом Vapi й OpenClaw. Майже в реальному часі телефонні дзвінки з вашим агентом.
</Card>

<Card title="Транскрибування OpenRouter" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

Багатомовне транскрибування аудіо через OpenRouter (Gemini тощо). Доступно на ClawHub.
</Card>

</CardGroup>

<a id="infrastructure-deployment"></a>

## Інфраструктура й розгортання

<p className="showcase-section-intro">
  Пакування, розгортання та інтеграції, які спрощують запуск і розширення OpenClaw.
</p>

<CardGroup cols={2}>

<Card title="Додаток Home Assistant" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  Gateway OpenClaw, що працює на Home Assistant OS, із підтримкою SSH-тунелю та постійним станом.
</Card>

<Card title="Skill Home Assistant" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  Керування й автоматизація пристроїв Home Assistant природною мовою.
</Card>

<Card title="Пакування Nix" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  OpenClaw-конфігурація на базі nix з усім необхідним для відтворюваних розгортань.
</Card>

<Card title="Календар CalDAV" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  Skill календаря на базі khal/vdirsyncer. Самохостингова інтеграція календаря.
</Card>

</CardGroup>

<a id="home-hardware"></a>

## Дім і обладнання

<p className="showcase-section-intro">
  Фізичний бік OpenClaw: домівки, сенсори, камери, пилососи та інші пристрої.
</p>

<CardGroup cols={2}>

<Card title="Автоматизація GoHome" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  Домашня автоматизація, природна для Nix, з OpenClaw як інтерфейсом, плюс чудові dashboard Grafana.
  
  <img src="/assets/showcase/gohome-grafana.png" alt="Dashboard Grafana GoHome" />
</Card>

<Card title="Пилосос Roborock" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Керуйте роботом-пилососом Roborock через природну розмову.
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Стан Roborock" />
</Card>

</CardGroup>

## Проєкти спільноти

<p className="showcase-section-intro">
  Речі, які виросли за межі одного робочого процесу в ширші продукти або екосистеми.
</p>

<CardGroup cols={2}>

<Card title="Маркетплейс StarSwap" icon="star" href="https://star-swap.com/">
  **Спільнота** • `marketplace` `astronomy` `webapp`
  
  Повноцінний маркетплейс астрономічного обладнання. Створений за допомогою/навколо екосистеми OpenClaw.
</Card>

</CardGroup>

---

## Надішліть свій проєкт

<p className="showcase-section-intro">
  Якщо ви створюєте щось цікаве з OpenClaw, надішліть це нам. Якісні скриншоти й конкретні результати дуже допомагають.
</p>

Маєте чим поділитися? Ми будемо раді додати ваш проєкт!

<Steps>
  <Step title="Share It">
    Опублікуйте в [#self-promotion на Discord](https://discord.gg/clawd) або [згадайте @openclaw у дописі на X](https://x.com/openclaw)
  </Step>
  <Step title="Include Details">
    Розкажіть, що це робить, дайте посилання на репозиторій/демо, додайте скриншот, якщо він у вас є
  </Step>
  <Step title="Get Featured">
    Ми додамо найяскравіші проєкти на цю сторінку
  </Step>
</Steps>
