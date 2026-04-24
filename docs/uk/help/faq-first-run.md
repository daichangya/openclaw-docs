---
read_when:
    - Нове встановлення, зависання онбордингу або помилки під час першого запуску
    - Вибір автентифікації та підписок provider
    - Не вдається відкрити docs.openclaw.ai, не відкривається dashboard, встановлення зависло
summary: 'FAQ: швидкий старт і початкове налаштування — встановлення, онбординг, автентифікація, підписки, початкові збої'
title: FAQ — швидкий старт і початкове налаштування
x-i18n:
    generated_at: "2026-04-24T03:45:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ad92a18d304cde8a37459ed02140dec8c2ff0c0c052dadbae7d814af4fae4f4
    source_path: help/faq-first-run.md
    workflow: 15
---

  Швидкі запитання й відповіді для швидкого старту та першого запуску. Для щоденних операцій, моделей, автентифікації, сесій
  і діагностики див. основний [FAQ](/uk/help/faq).

  ## Швидкий старт і початкове налаштування

  <AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб розблокуватися">
    Використовуйте локального AI-агента, який може **бачити вашу машину**. Це набагато ефективніше, ніж питати
    у Discord, тому що більшість випадків «я застряг» — це **проблеми локальної конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти логи та допомагати виправляти
    налаштування на рівні машини (PATH, служби, дозволи, файли автентифікації). Надайте їм **повну checkout-версію вихідного коду**
    через hackable-встановлення (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з git checkout**, щоб агент міг читати код + документацію та
    аналізувати саме ту версію, яку ви запускаєте. Ви завжди можете пізніше повернутися до стабільної версії,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й контролювати** виправлення (крок за кроком), а потім виконати лише
    потрібні команди. Так зміни залишаються невеликими, і їх легше перевіряти.

    Якщо ви знайдете справжню помилку або виправлення, будь ласка, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (поділіться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану gateway/агента + базова конфігурація.
    - `openclaw models status`: перевіряє автентифікацію provider + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє поширені проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл діагностики: [Перші 60 секунд, якщо щось зламалося](#first-60-seconds-if-something-is-broken).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску Heartbeat:

    - `quiet-hours`: поза налаштованим вікном активних годин
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожню структуру або лише заголовки
    - `no-tasks-due`: увімкнено режим завдань `HEARTBEAT.md`, але ще не настав час для жодного з інтервалів завдань
    - `alerts-disabled`: усю видимість Heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові мітки настання строку оновлюються лише після завершення
    реального запуску Heartbeat. Пропущені запуски не позначають завдання як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація й завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановлення та налаштування OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання онбордингу:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати ресурси UI. Після онбордингу ви зазвичай запускаєте Gateway на порту **18789**.

    Із вихідного коду (для контриб’юторів/розробки):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Якщо у вас ще немає глобального встановлення, запустіть це через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Як відкрити dashboard після онбордингу?">
    Майстер відкриває ваш браузер із чистим URL dashboard (без токена) одразу після онбордингу, а також друкує посилання в підсумку. Тримайте цю вкладку відкритою; якщо вона не запустилася, скопіюйте й вставте надрукований URL на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо буде запит на автентифікацію зі спільним секретом, вставте налаштований токен або пароль у налаштуваннях Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо спільний секрет ще не налаштовано, згенеруйте токен командою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште прив’язку до loopback, виконайте `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставлення спільного секрету, за умови довіреного хоста gateway); HTTP API все одно вимагають автентифікації спільним секретом, якщо ви навмисно не використовуєте private-ingress `none` або HTTP-автентифікацію trusted-proxy.
      Невдалі одночасні спроби автентифікації Serve від того самого клієнта серіалізуються до того, як лімітер невдалих автентифікацій їх зафіксує, тому вже друга невдала повторна спроба може показувати `retry later`.
    - **Прив’язка tailnet**: виконайте `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний спільний секрет у налаштуваннях dashboard.
    - **Identity-aware reverse proxy**: залиште Gateway за trusted proxy без loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL proxy.
    - **SSH-тунель**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`. Автентифікація спільним секретом усе одно діє через тунель; вставте налаштований токен або пароль, якщо з’явиться запит.

    Див. [Dashboard](/uk/web/dashboard) і [Web surfaces](/uk/web) для режимів прив’язки та деталей автентифікації.

  </Accordion>

  <Accordion title="Чому існують дві конфігурації схвалення exec для схвалень у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на схвалення в призначення чату
    - `channels.<channel>.execApprovals`: робить цей канал рідним клієнтом схвалення для схвалень exec

    Політика host exec усе одно є справжнім механізмом контролю схвалення. Конфігурація чату лише визначає, де з’являються
    запити на схвалення і як люди можуть на них відповідати.

    У більшості налаштувань вам **не** потрібні обидва варіанти:

    - Якщо чат уже підтримує команди й відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний рідний канал може безпечно визначати тих, хто схвалює, OpenClaw тепер автоматично вмикає нативні схвалення з пріоритетом DM, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки схвалення, цей нативний UI є основним шляхом; агент повинен включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що схвалення через чат недоступні або ручне схвалення — єдиний варіант.
    - Використовуйте `approvals.exec` лише тоді, коли запити також потрібно пересилати в інші чати або явні кімнати ops.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише тоді, коли ви явно хочете, щоб запити на схвалення публікувалися назад у вихідну кімнату/тему.
    - Схвалення Plugin — це ще окремий механізм: вони типово використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали додатково підтримують нативну обробку схвалень Plugin.

    Коротко: пересилання — для маршрутизації, конфігурація нативного клієнта — для більш зручного UX, специфічного для каналу.
    Див. [Схвалення Exec](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке runtime мені потрібне?">
    Потрібен Node **>= 22**. Рекомендується `pnpm`. Bun **не рекомендується** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway є легким — у документації зазначено, що для особистого використання достатньо **512MB-1GB RAM**, **1 ядра** і приблизно **500MB**
    диска, а також що **Raspberry Pi 4 може це запускати**.

    Якщо вам потрібен додатковий запас (логи, медіа, інші сервіси), рекомендується **2GB**,
    але це не жорсткий мінімум.

    Порада: невеликий Pi/VPS може хостити Gateway, а ви можете під’єднати **nodes** на своєму ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради щодо встановлення на Raspberry Pi?">
    Коротко: працює, але очікуйте певних шероховатостей.

    - Використовуйте **64-bit** ОС і Node >= 22.
    - Віддавайте перевагу **hackable (git) install**, щоб бачити логи й швидко оновлюватися.
    - Починайте без каналів/Skills, а потім додавайте їх по одному.
    - Якщо з’являються дивні проблеми з бінарними файлами, зазвичай це проблема **сумісності з ARM**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Зависло на wake up my friend / онбординг не завершується. Що робити?">
    Цей екран залежить від того, чи доступний і автентифікований Gateway. TUI також надсилає
    "Wake up, my friend!" автоматично під час першого hatch. Якщо ви бачите цей рядок **без відповіді**
    і кількість токенів залишається 0, агент так і не запустився.

    1. Перезапустіть Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Перевірте стан і автентифікацію:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Якщо все ще зависає, виконайте:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що тунель/Tailscale-з’єднання активне та що UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini) без повторного онбордингу?">
    Так. Скопіюйте **каталог стану** і **робочий простір**, а потім один раз запустіть Doctor. Це
    збереже вашого бота «точно таким самим» (пам’ять, історію сесій, автентифікацію та стан
    каналів), якщо ви скопіюєте **обидва** розташування:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій робочий простір (типово: `~/.openclaw/workspace`).
    4. Виконайте `openclaw doctor` і перезапустіть службу Gateway.

    Це збереже конфігурацію, профілі автентифікації, облікові дані WhatsApp, сесії та пам’ять. Якщо ви працюєте
    у віддаленому режимі, пам’ятайте, що хост gateway володіє сховищем сесій і робочим простором.

    **Важливо:** якщо ви лише комітите/відправляєте свій робочий простір у GitHub, ви створюєте резервну
    копію **пам’яті + bootstrap-файлів**, але **не** історії сесій або автентифікації. Вони зберігаються
    в `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Міграція](/uk/install/migrating), [Де що зберігається на диску](#where-things-live-on-disk),
    [Робочий простір агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи розташовані вгорі. Якщо верхній розділ позначено як **Unreleased**, наступний розділ із датою
    є останньою випущеною версією. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (плюс розділи docs/other, коли це потрібно).

  </Accordion>

  <Accordion title="Не вдається відкрити docs.openclaw.ai (помилка SSL)">
    Деякі підключення Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть це або додайте `docs.openclaw.ai` до allowlist, а потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати сайт, повідомивши про проблему тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркалиться на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі лінії коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable-реліз спочатку потрапляє в **beta**, а потім явний
    крок просування переміщує ту саму версію в `latest`. За потреби мейнтейнери також можуть
    публікувати одразу в `latest`. Саме тому після просування beta і stable можуть
    вказувати на **одну й ту саму версію**.

    Подивитися, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди для встановлення й різницю між beta та dev дивіться в accordion нижче.

  </Accordion>

  <Accordion title="Як установити beta-версію і яка різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (після просування може збігатися з `latest`).
    **Dev** — це рухома вершина `main` (git); під час публікації використовується npm dist-tag `dev`.

    Однорядкові команди (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Інсталятор для Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Докладніше: [Канали розробки](/uk/install/development-channels) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як спробувати найновіші збірки?">
    Є два варіанти:

    1. **Канал dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає вас на гілку `main` і оновлює з вихідного коду.

    2. **Hackable install (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає вам локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому ручному clone, використовуйте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/uk/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай триває встановлення та онбординг?">
    Приблизно:

    - **Встановлення:** 2–5 хвилин
    - **Онбординг:** 5–15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо процес зависає, скористайтеся [Завис інсталятор](#quick-start-and-first-run-setup)
    і швидким циклом діагностики в [Я застряг](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Інсталятор завис? Як отримати більше інформації?">
    Повторно запустіть інсталятор із **докладним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Встановлення beta з докладним виводом:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Для hackable (git) install:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Еквівалент для Windows (PowerShell):

    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Більше варіантів: [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Під час встановлення на Windows пише git not found або openclaw not recognized">
    Дві поширені проблеми Windows:

    **1) npm error spawn git / git not found**

    - Установіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, а потім повторно запустіть інсталятор.

    **2) після встановлення openclaw is not recognized**

    - Глобальна папка bin для npm відсутня у PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до вашого користувацького PATH (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо ви хочете максимально безпроблемне налаштування на Windows, використовуйте **WSL2** замість нативного Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У виводі exec на Windows видно спотворений китайський текст — що робити?">
    Зазвичай це невідповідність кодової сторінки консолі в нативних оболонках Windows.

    Симптоми:

    - вивід `system.run`/`exec` показує китайський текст як mojibake
    - та сама команда виглядає нормально в іншому профілі термінала

    Швидкий обхідний шлях у PowerShell:

    ```powershell
    chcp 65001
    [Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    ```

    Потім перезапустіть Gateway і повторіть команду:

    ```powershell
    openclaw gateway restart
    ```

    Якщо проблема все ще відтворюється в останній версії OpenClaw, відстежуйте/повідомляйте про неї тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використовуйте **hackable (git) install**, щоб мати повний вихідний код і документацію локально, а потім поставте
    запитання своєму боту (або Claude/Codex) _з цієї папки_, щоб він міг читати репозиторій і точно відповідати.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як установити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтеся інструкції для Linux, а потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення служби: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення й оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як установити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Установіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Інструкції: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де інструкції зі встановлення в хмарі/VPS?">
    У нас є **хаб хостингу** з поширеними provider. Оберіть один і дотримуйтесь інструкції:

    - [VPS hosting](/uk/vps) (усі provider в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    зі свого ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан + робочий простір
    живуть на сервері, тому ставтеся до хоста як до джерела істини та робіть резервні копії.

    Ви можете під’єднати **nodes** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримати доступ до
    локального екрана/камери/canvas або запускати команди на своєму ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [Nodes CLI](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити самого себе?">
    Коротка відповідь: **можливо, але не рекомендується**. Процес оновлення може перезапустити
    Gateway (що розірве активну сесію), може вимагати чистий git checkout і
    може запитувати підтвердження. Безпечніше: запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо вам усе ж потрібно автоматизувати це через агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/uk/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить онбординг?">
    `openclaw onboard` — рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth provider, API keys, Anthropic setup-token, а також варіанти локальних моделей, наприклад LM Studio)
    - Розташування **робочого простору** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані channel Plugin, як-от QQ Bot)
    - **Установлення daemon** (LaunchAgent у macOS; user unit systemd у Linux/WSL2)
    - **Перевірки працездатності** та вибір **Skills**

    Він також попереджає, якщо ваша налаштована модель невідома або для неї відсутня автентифікація.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw за допомогою **API keys** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації в цих provider.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **Anthropic API key**: звичайна оплата через Anthropic API
    - **Claude CLI / автентифікація через підписку Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway Anthropic API keys усе ще є більш
    передбачуваним налаштуванням. OAuth OpenAI Codex явно підтримується для зовнішніх
    інструментів, таких як OpenClaw.

    OpenClaw також підтримує інші варіанти розміщених підписок, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [Моделі GLM](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API key?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
    OpenClaw розглядає автентифікацію через підписку Claude і використання `claude -p` як санкціоновані
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо ви хочете
    найпередбачуваніше серверне налаштування, замість цього використовуйте Anthropic API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тому OpenClaw розглядає
    повторне використання Claude CLI і використання `claude -p` як санкціоновані для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token усе ще доступний як підтримуваний шлях токена OpenClaw, але OpenClaw тепер віддає перевагу повторному використанню Claude CLI та `claude -p`, коли це можливо.
    Для production або багатокористувацьких навантажень автентифікація через Anthropic API key усе ще є
    безпечнішим і передбачуванішим вибором. Якщо вам потрібні інші hosted-варіанти
    підписок в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
    Це означає, що вашу **квоту/ліміт швидкості Anthropic** вичерпано для поточного вікна. Якщо ви
    використовуєте **Claude CLI**, дочекайтеся скидання вікна або оновіть свій план. Якщо ви
    використовуєте **Anthropic API key**, перевірте Anthropic Console
    щодо використання/оплати й за потреби підвищте ліміти.

    Якщо повідомлення має такий точний текст:
    `Extra usage is required for long context requests`, це означає, що запит намагається використати
    бета-функцію Anthropic з контекстом 1M (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані мають право на оплату long-context (оплата через API key або
    шлях входу через Claude в OpenClaw з увімкненим Extra Usage).

    Порада: задайте **резервну модель**, щоб OpenClaw міг і далі відповідати, поки provider обмежений rate limit.
    Див. [Моделі](/uk/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудований provider **Amazon Bedrock (Converse)**. Якщо присутні AWS env markers, OpenClaw може автоматично виявити каталог Bedrock для streaming/text і злити його як неявний provider `amazon-bedrock`; в іншому разі ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис provider вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Providers моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний proxy перед Bedrock теж є допустимим варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Використовуйте
    `openai-codex/gpt-5.5` для Codex OAuth через типовий runner PI. Використовуйте
    `openai/gpt-5.4` для поточного прямого доступу через OpenAI API key. Прямий доступ через API key до GPT-5.5
    підтримується, щойно OpenAI увімкне його в публічному API; наразі
    GPT-5.5 використовує підписку/OAuth через `openai-codex/gpt-5.5` або нативні запуски Codex
    app-server з `openai/gpt-5.5` і `embeddedHarness.runtime: "codex"`.
    Див. [Providers моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому OpenClaw усе ще згадує openai-codex?">
    `openai-codex` — це id provider і auth-profile для ChatGPT/Codex OAuth.
    Це також явний префікс моделі PI для Codex OAuth:

    - `openai/gpt-5.4` = поточний прямий маршрут OpenAI API key у PI
    - `openai/gpt-5.5` = майбутній прямий маршрут API key, щойно OpenAI увімкне GPT-5.5 в API
    - `openai-codex/gpt-5.5` = маршрут Codex OAuth у PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = нативний маршрут Codex app-server
    - `openai-codex:...` = id auth profile, а не посилання на модель

    Якщо ви хочете прямий шлях оплати/лімітів OpenAI Platform, задайте
    `OPENAI_API_KEY`. Якщо ви хочете автентифікацію через підписку ChatGPT/Codex, увійдіть через
    `openclaw models auth login --provider openai-codex` і використовуйте
    посилання на модель `openai-codex/*` для запусків PI.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    Codex OAuth використовує керовані OpenAI вікна квоти, що залежать від плану. На практиці
    ці ліміти можуть відрізнятися від досвіду на сайті/в застосунку ChatGPT, навіть коли
    обидва пов’язані з одним і тим самим обліковим записом.

    OpenClaw може показувати поточні видимі вікна використання/квот provider у
    `openclaw models status`, але не вигадує й не нормалізує права ChatGPT web
    до прямого доступу через API. Якщо вам потрібен прямий шлях оплати/лімітів OpenAI Platform,
    використовуйте `openai/*` з API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth підписки OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання OAuth підписки у зовнішніх інструментах/воркфлоу,
    таких як OpenClaw. Онбординг може виконати OAuth-потік за вас.

    Див. [OAuth](/uk/concepts/oauth), [Providers моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **Plugin-потік автентифікації**, а не client id чи secret у `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Типова модель після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не проходять, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає токени OAuth у профілях автентифікації на хості gateway. Подробиці: [Providers моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для звичайних чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; малі карти обрізають і допускають витоки. Якщо вже потрібно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і дивіться [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt-injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як зберегти трафік hosted-моделі в певному регіоні?">
    Вибирайте endpoint, прив’язані до регіону. OpenRouter надає варіанти з хостингом у США для MiniMax, Kimi і GLM; вибирайте варіант із хостингом у США, щоб зберігати дані в межах регіону. Ви все одно можете перелічувати Anthropic/OpenAI поруч із ними, використовуючи `models.mode: "merge"`, щоб резервні варіанти залишалися доступними, водночас дотримуючись вибраного provider з потрібним регіоном.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini є необов’язковим — дехто
    купує його як постійно ввімкнений хост, але також підійде невеликий VPS, домашній сервер або коробка рівня Raspberry Pi.

    Mac потрібен лише **для інструментів, доступних тільки на macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або під’єднайте macOS node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, на якому виконано вхід у Messages. Це **не обов’язково** має бути Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, а Gateway може працювати на Linux або деінде.

    Поширені схеми:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac із входом у Messages.
    - Запускайте все на Mac, якщо хочете найпростішу однокомп’ютерну конфігурацію.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи зможу я під’єднати його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може під’єднуватися як
    **node** (супутній пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, як-от екран/камера/canvas і `system.run` на цьому пристрої.

    Поширений сценарій:

    - Gateway на Mac mini (постійно ввімкнений).
    - MacBook Pro запускає застосунок macOS або node host і під’єднується до Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб його побачити.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можна використовувати Bun?">
    Bun **не рекомендується**. Ми спостерігаємо помилки runtime, особливо з WhatsApp і Telegram.
    Для стабільних gateway використовуйте **Node**.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на не-production gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Під час налаштування запитуються лише числові user ID. Якщо у вашій конфігурації вже є застарілі записи `@username`, `openclaw doctor --fix` може спробувати їх розв’язати.

    Безпечніший спосіб (без стороннього бота):

    - Надішліть DM своєму боту, потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Надішліть DM своєму боту, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Надішліть DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **маршрутизацію кількох агентів**. Прив’яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, E.164 відправника, наприклад `+15551234567`) до різного `agentId`, щоб кожна людина мала власний робочий простір і сховище сесій. Відповіді все одно надходитимуть з **того самого облікового запису WhatsApp**, а контроль доступу до DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Маршрутизація кількох агентів](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "швидкий чат" і агента "Opus для кодування"?'>
    Так. Використовуйте маршрутизацію кількох агентів: задайте кожному агенту власну типову модель, а потім прив’яжіть вхідні маршрути (обліковий запис provider або конкретні peer) до кожного агента. Приклад конфігурації наведено в [Маршрутизація кількох агентів](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH служби містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, установлені через `brew`, розв’язувалися в non-login shells.
    Останні збірки також додають типові каталоги bin користувача до Linux systemd services (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо їх задано.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повна checkout-версія вихідного коду, редагована, найкраще для контриб’юторів.
      Ви локально запускаєте збірки й можете патчити код/документацію.
    - **npm install:** глобальне встановлення CLI без репозиторію, найкраще для сценарію «просто запустити».
      Оновлення надходять з npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm і git install?">
    Так. Установіть інший варіант, а потім запустіть Doctor, щоб служба gateway вказувала на нову точку входу.
    Це **не видаляє ваші дані** — змінюється лише встановлення коду OpenClaw. Ваш стан
    (`~/.openclaw`) і робочий простір (`~/.openclaw/workspace`) залишаються недоторканими.

    З npm на git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    З git на npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor виявляє невідповідність точки входу служби gateway і пропонує переписати конфігурацію служби відповідно до поточного встановлення (використовуйте `--repair` в автоматизації).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи слід запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо ви хочете
    мінімального тертя й вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Плюси:** немає витрат на сервер, прямий доступ до локальних файлів, живе вікно браузера.
    - **Мінуси:** сон/обриви мережі = відключення, оновлення ОС/перезавантаження переривають роботу, пристрій має залишатися активним.

    **VPS / хмара**

    - **Плюси:** постійно ввімкнено, стабільна мережа, немає проблем зі сном ноутбука, легше підтримувати безперервну роботу.
    - **Мінуси:** часто headless-режим (використовуйте знімки екрана), лише віддалений доступ до файлів, для оновлень потрібен SSH.

    **Примітка, специфічна для OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord добре працюють на VPS. Єдиний реальний компроміс — **headless browser** проти видимого вікна. Див. [Browser](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо раніше у вас вже були відключення gateway. Локальний запуск чудово підходить, коли ви активно користуєтеся Mac і хочете мати доступ до локальних файлів або автоматизації UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Не обов’язково, але **рекомендується для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** постійно ввімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, легше підтримувати безперервну роботу.
    - **Спільний ноутбук/настільний комп’ютер:** цілком нормально для тестування й активного використання, але очікуйте пауз, коли машина переходить у сон або оновлюється.

    Якщо ви хочете поєднати переваги обох варіантів, тримайте Gateway на виділеному хості, а свій ноутбук під’єднайте як **node** для локальних інструментів екрану/камери/exec. Див. [Nodes](/uk/nodes).
    Для рекомендацій із безпеки прочитайте [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яку ОС рекомендовано?">
    OpenClaw є легким. Для базового Gateway + одного каналу чату:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1–2 vCPU, 2GB RAM або більше для запасу (логи, медіа, кілька каналів). Інструменти Node і автоматизація браузера можуть бути ресурсомісткими.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях встановлення для Linux найкраще протестовано саме там.

    Документація: [Linux](/uk/platforms/linux), [VPS hosting](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути постійно ввімкнена, доступна в мережі та мати достатньо
    RAM для Gateway і будь-яких увімкнених каналів.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера чи медіа-інструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви працюєте на Windows, **WSL2 — це найпростіший варіант у стилі VM** і він має найкращу
    сумісність із інструментами. Див. [Windows](/uk/platforms/windows), [VPS hosting](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [FAQ](/uk/help/faq) — основний FAQ (моделі, сесії, gateway, безпека тощо)
- [Огляд встановлення](/uk/install)
- [Початок роботи](/uk/start/getting-started)
- [Діагностика](/uk/help/troubleshooting)
