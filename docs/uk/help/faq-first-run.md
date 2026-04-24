---
read_when:
    - Нове встановлення, зависання онбордингу або помилки під час першого запуску
    - Вибір автентифікації та підписок провайдера
    - Не вдається отримати доступ до docs.openclaw.ai, не вдається відкрити панель керування, встановлення зависло
sidebarTitle: First-run FAQ
summary: 'FAQ: швидкий старт і налаштування першого запуску — встановлення, онбординг, автентифікація, підписки, початкові збої'
title: 'FAQ: налаштування першого запуску'
x-i18n:
    generated_at: "2026-04-24T04:15:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68dd2d2c306735dc213a25c4d2a3e5c20e2a707ffca553f3e7503d75efd74f5c
    source_path: help/faq-first-run.md
    workflow: 15
---

  Короткі запитання й відповіді щодо швидкого старту та першого запуску. Про щоденну роботу, моделі, автентифікацію, сесії
  та усунення проблем дивіться в основному [FAQ](/uk/help/faq).

  ## Швидкий старт і налаштування першого запуску

  <AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб розблокуватися">
    Використайте локального AI-агента, який може **бачити вашу машину**. Це набагато ефективніше, ніж писати
    у Discord, тому що більшість випадків “я застряг” — це **проблеми локальної конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, виконувати команди, перевіряти журнали та допомагати виправляти
    налаштування на рівні машини (PATH, служби, дозволи, файли автентифікації). Надайте їм **повну копію вихідного коду**
    через install у режимі hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з копії git**, тож агент може читати код і документацію та
    міркувати про точну версію, яку ви запускаєте. Ви завжди можете повернутися до стабільної версії пізніше,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати та супроводжувати** виправлення (крок за кроком), а потім виконати лише
    потрібні команди. Так зміни залишаються невеликими, і їх простіше перевіряти.

    Якщо ви виявите справжню помилку або виправлення, будь ласка, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (поділіться виводом, коли просите допомоги):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану gateway/агента та базової конфігурації.
    - `openclaw models status`: перевіряє автентифікацію провайдера та доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє поширені проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламано](#first-60-seconds-if-something-is-broken).
    Документація з установлення: [Install](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску heartbeat:

    - `quiet-hours`: поза межами налаштованого вікна активних годин
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожню структуру або лише заголовки
    - `no-tasks-due`: режим завдань `HEARTBEAT.md` активний, але жоден із інтервалів завдань ще не настав
    - `alerts-disabled`: усю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові позначки настання оновлюються лише після завершення
    реального запуску heartbeat. Пропущені запуски не позначають завдання як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановити й налаштувати OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання онбордингу:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати активи UI. Після онбордингу ви зазвичай запускаєте Gateway на порту **18789**.

    Із вихідного коду (контриб’ютори/розробники):

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

  <Accordion title="Як відкрити панель керування після онбордингу?">
    Майстер відкриває ваш браузер із чистим URL панелі керування (без токена) одразу після онбордингу, а також друкує посилання в підсумку. Залиште цю вкладку відкритою; якщо вона не запустилася, скопіюйте й вставте надрукований URL на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати панель керування на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується автентифікація спільним секретом, вставте налаштований токен або пароль у налаштуваннях Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо спільний секрет ще не налаштовано, згенеруйте токен за допомогою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште loopback-прив’язку, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставлення спільного секрету, за умови довіреного хоста gateway); HTTP API усе одно вимагають автентифікації спільним секретом, якщо ви свідомо не використовуєте приватний вхід `none` або HTTP-автентифікацію trusted-proxy.
      Невдалі одночасні спроби автентифікації Serve від того самого клієнта серіалізуються до того, як обмежувач невдалих спроб зафіксує їх, тож друга невдала повторна спроба вже може показати `retry later`.
    - **Прив’язка tailnet**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний спільний секрет у налаштуваннях панелі керування.
    - **Reverse proxy з урахуванням ідентичності**: тримайте Gateway за trusted proxy без loopback-прив’язки, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL proxy.
    - **SSH-тунель**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`. Автентифікація спільним секретом усе одно застосовується через тунель; вставте налаштований токен або пароль, якщо буде запит.

    Див. [Панель керування](/uk/web/dashboard) і [Вебповерхні](/uk/web) щодо режимів прив’язки та деталей автентифікації.

  </Accordion>

  <Accordion title="Чому є дві конфігурації підтвердження exec для підтверджень у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на підтвердження до чатів-призначень
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом підтвердження для exec-підтверджень

    Політика host exec усе одно є справжнім бар’єром підтвердження. Конфігурація чату лише керує тим, де з’являються
    запити на підтвердження і як люди можуть відповідати на них.

    У більшості конфігурацій вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди та відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначити тих, хто підтверджує, OpenClaw тепер автоматично вмикає нативні підтвердження з пріоритетом DM, коли `channels.<channel>.execApprovals.enabled` не встановлено або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки підтвердження, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve` лише якщо результат інструмента каже, що підтвердження в чаті недоступні або єдиний шлях — ручне підтвердження.
    - Використовуйте `approvals.exec` лише тоді, коли запити також треба пересилати до інших чатів або явно визначених операційних кімнат.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише тоді, коли ви явно хочете, щоб запити на підтвердження публікувалися назад у вихідну кімнату/тему.
    - Підтвердження Plugin — це окрема історія: вони типово використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали зберігають додаткову нативну обробку підтвердження Plugin.

    Коротко: пересилання потрібне для маршрутизації, конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Див. [Підтвердження Exec](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке середовище виконання мені потрібне?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендується** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легкий — у документації вказано, що для особистого використання достатньо **512 МБ–1 ГБ RAM**, **1 ядра** та приблизно **500 МБ**
    диска, а також зазначено, що **Raspberry Pi 4 може його запускати**.

    Якщо ви хочете мати додатковий запас (журнали, медіа, інші служби), рекомендується **2 ГБ**,
    але це не жорсткий мінімум.

    Порада: невеликий Pi/VPS може розміщувати Gateway, а ви можете поєднати **nodes** на своєму ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради щодо встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте певних шорсткостей.

    - Використовуйте **64-бітну** ОС і Node >= 22.
    - Надавайте перевагу install у режимі **hackable (git)**, щоб бачити журнали та швидко оновлюватися.
    - Починайте без channels/Skills, а потім додавайте їх по одному.
    - Якщо ви натрапляєте на дивні проблеми з бінарними файлами, зазвичай це проблема **сумісності ARM**.

    Документація: [Linux](/uk/platforms/linux), [Install](/uk/install).

  </Accordion>

  <Accordion title="На екрані зависає wake up my friend / онбординг не завершується. Що тепер?">
    Цей екран залежить від того, чи досяжний Gateway і чи пройдена автентифікація. TUI також надсилає
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

    3. Якщо проблема не зникає, запустіть:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що тунель/з’єднання Tailscale активне і що UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini), не проходячи онбординг заново?">
    Так. Скопіюйте **каталог стану** і **робочий простір**, а потім один раз запустіть Doctor. Це
    збереже вашого бота “точно таким самим” (пам’ять, історію сесій, автентифікацію та
    стан каналів), якщо ви скопіюєте **обидва** розташування:

    1. Установіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій робочий простір (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть службу Gateway.

    Це зберігає конфігурацію, профілі автентифікації, облікові дані WhatsApp, сесії та пам’ять. Якщо ви працюєте у
    віддаленому режимі, пам’ятайте, що хост gateway володіє сховищем сесій і робочим простором.

    **Важливо:** якщо ви лише комітите/надсилаєте свій робочий простір у GitHub, ви створюєте резервну копію
    **пам’яті та bootstrap-файлів**, але **не** історії сесій або автентифікації. Вони зберігаються
    у `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Міграція](/uk/install/migrating), [Де на диску розміщуються файли](#where-things-live-on-disk),
    [Робочий простір агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перегляньте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи зверху. Якщо верхній розділ позначено як **Unreleased**, наступний датований
    розділ — це остання випущена версія. Записи згруповані за **Highlights**, **Changes** і
    **Fixes** (плюс документація/інші розділи за потреби).

  </Accordion>

  <Accordion title="Не вдається отримати доступ до docs.openclaw.ai (помилка SSL)">
    Деякі з’єднання Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до allowlist, а потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати це, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркалиться на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable-реліз спочатку потрапляє в **beta**, а потім окремий
    крок promotion переміщує ту саму версію в `latest`. За потреби мейнтейнери також можуть
    публікувати одразу в `latest`. Саме тому beta і stable можуть вказувати на **одну й ту саму версію** після promotion.

    Подивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Щодо однорядкових команд встановлення та різниці між beta і dev дивіться accordion нижче.

  </Accordion>

  <Accordion title="Як установити beta-версію і яка різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (може збігатися з `latest` після promotion).
    **Dev** — це рухома вершина `main` (git); під час публікації вона використовує npm dist-tag `dev`.

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

    1. **Dev-канал (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає на гілку `main` і оновлює з вихідного коду.

    2. **Hackable install (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає вам локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому ручному clone, використайте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Update](/uk/cli/update), [Канали розробки](/uk/install/development-channels),
    [Install](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай триває встановлення та онбординг?">
    Орієнтовно:

    - **Установлення:** 2–5 хвилин
    - **Онбординг:** 5–15 хвилин залежно від того, скільки channels/models ви налаштовуєте

    Якщо все зависає, використайте [Завис інсталятор](#quick-start-and-first-run-setup)
    і швидкий цикл налагодження в [Я застряг](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Інсталятор завис? Як отримати більше зворотного зв’язку?">
    Повторно запустіть інсталятор із **докладним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Установлення beta з verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Для install у режимі hackable (git):

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

  <Accordion title="Під час встановлення у Windows пише git not found або openclaw not recognized">
    Дві поширені проблеми у Windows:

    **1) npm error spawn git / git not found**

    - Установіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, а потім повторно запустіть інсталятор.

    **2) openclaw is not recognized після встановлення**

    - Ваш глобальний каталог bin для npm відсутній у PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до свого PATH користувача (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо ви хочете найплавніше налаштування у Windows, використовуйте **WSL2** замість нативного Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У Windows вивід exec показує пошкоджений китайський текст — що робити?">
    Зазвичай це невідповідність code page консолі в нативних оболонках Windows.

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

    Потім перезапустіть Gateway і повторіть свою команду:

    ```powershell
    openclaw gateway restart
    ```

    Якщо це все ще відтворюється в останній версії OpenClaw, відстежуйте/повідомляйте тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використайте **hackable (git) install**, щоб мати локально повний вихідний код і документацію, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг читати репозиторій і давати точну відповідь.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Install](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як установити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтеся посібника для Linux, а потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення служби: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор і оновлення: [Установлення й оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як установити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Установіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де посібники зі встановлення в хмарі/VPS?">
    У нас є **хаб хостингу** з поширеними провайдерами. Виберіть одного й дотримуйтеся посібника:

    - [VPS hosting](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    зі свого ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан і робочий простір
    розміщуються на сервері, тож ставтеся до хоста як до джерела істини та створюйте резервні копії.

    Ви можете поєднати **nodes** (Mac/iOS/Android/headless) із цим хмарним Gateway для доступу
    до локального екрана/камери/canvas або запуску команд на своєму ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Platforms](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [CLI для Nodes](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити себе самостійно?">
    Коротка відповідь: **можливо, але не рекомендовано**. Процес оновлення може перезапустити
    Gateway (що розірве активну сесію), може потребувати чистого git checkout і
    може запитувати підтвердження. Безпечніше: запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо вам усе ж потрібно автоматизувати це з агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Update](/uk/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить онбординг?">
    `openclaw onboard` — це рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування model/auth** (OAuth провайдера, API-ключі, Anthropic setup-token, а також варіанти локальних моделей, як-от LM Studio)
    - Розташування **робочого простору** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані channel Plugins, як-от QQ Bot)
    - **Установлення daemon** (LaunchAgent на macOS; unit користувача systemd на Linux/WSL2)
    - **Перевірки стану** і вибір **Skills**

    Він також попереджає, якщо ваша налаштована модель невідома або для неї бракує автентифікації.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації в цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **API-ключ Anthropic**: звичайна оплата Anthropic API
    - **Claude CLI / автентифікація через підписку Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw вважає використання `claude -p`
      санкціонованим для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway API-ключі Anthropic усе ще є більш
    передбачуваним налаштуванням. OAuth OpenAI Codex явно підтримується для зовнішніх
    інструментів на кшталт OpenClaw.

    OpenClaw також підтримує інші варіанти розміщених підписок, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [Моделі GLM](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API-ключа?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тож
    OpenClaw вважає автентифікацію через підписку Claude і використання `claude -p` санкціонованими
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо вам потрібне
    найбільш передбачуване серверне налаштування, натомість використовуйте API-ключ Anthropic.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тож OpenClaw вважає
    повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token усе ще доступний як підтримуваний шлях токена OpenClaw, але тепер OpenClaw віддає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.
    Для production або багатокористувацьких навантажень автентифікація через API-ключ Anthropic усе ще є
    безпечнішим і передбачуванішим вибором. Якщо вам потрібні інші варіанти розміщених підписок
    в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
    Це означає, що вашу **квоту/ліміт швидкості Anthropic** вичерпано для поточного вікна. Якщо ви
    використовуєте **Claude CLI**, зачекайте, поки вікно скинеться, або оновіть свій план. Якщо ви
    використовуєте **API-ключ Anthropic**, перевірте Anthropic Console
    щодо використання/оплати та за потреби підвищте ліміти.

    Якщо повідомлення має конкретно такий вигляд:
    `Extra usage is required for long context requests`, запит намагається використати
    1M-context beta від Anthropic (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані мають право на оплату довгого контексту (оплата через API-ключ або
    шлях входу Claude в OpenClaw з увімкненим Extra Usage).

    Порада: установіть **резервну модель**, щоб OpenClaw міг і далі відповідати, поки провайдер обмежений за rate limit.
    Див. [Models](/uk/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудованого провайдера **Amazon Bedrock (Converse)**. Якщо присутні маркери AWS env, OpenClaw може автоматично виявити каталог streaming/text Bedrock і додати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний proxy перед Bedrock теж залишається коректним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Використовуйте
    `openai-codex/gpt-5.5` для Codex OAuth через типовий PI runner. Використовуйте
    `openai/gpt-5.4` для поточного прямого доступу за API-ключем OpenAI. Прямий доступ
    за API-ключем до GPT-5.5 підтримується, щойно OpenAI ввімкне його в публічному API; зараз
    GPT-5.5 використовує підписку/OAuth через `openai-codex/gpt-5.5` або нативні запуски
    app-server Codex з `openai/gpt-5.5` і `embeddedHarness.runtime: "codex"`.
    Див. [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому OpenClaw досі згадує openai-codex?">
    `openai-codex` — це id провайдера та auth-profile для OAuth ChatGPT/Codex.
    Це також явний префікс моделі PI для Codex OAuth:

    - `openai/gpt-5.4` = поточний прямий шлях API-ключа OpenAI у PI
    - `openai/gpt-5.5` = майбутній прямий шлях API-ключа, щойно OpenAI ввімкне GPT-5.5 в API
    - `openai-codex/gpt-5.5` = шлях Codex OAuth у PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = нативний шлях app-server Codex
    - `openai-codex:...` = id auth profile, а не посилання на модель

    Якщо вам потрібен прямий шлях оплати/лімітів OpenAI Platform, установіть
    `OPENAI_API_KEY`. Якщо вам потрібна автентифікація через підписку ChatGPT/Codex, увійдіть через
    `openclaw models auth login --provider openai-codex` і використовуйте
    посилання на моделі `openai-codex/*` для запусків PI.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    Codex OAuth використовує вікна квот, залежні від плану та керовані OpenAI. На практиці
    ці ліміти можуть відрізнятися від досвіду на сайті/в застосунку ChatGPT, навіть коли
    обидва прив’язані до того самого облікового запису.

    OpenClaw може показувати видимі на цей момент вікна використання/квот провайдера в
    `openclaw models status`, але він не вигадує й не нормалізує права ChatGPT web
    до прямого доступу API. Якщо вам потрібен прямий шлях оплати/лімітів OpenAI Platform,
    використовуйте `openai/*` з API-ключем.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **підписковий OAuth OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання підпискового OAuth у зовнішніх інструментах/процесах
    на кшталт OpenClaw. Онбординг може виконати OAuth-процес за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **потік автентифікації Plugin**, а не client id або secret у `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Типова модель після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити завершуються помилкою, установіть `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає OAuth-токени в профілях автентифікації на хості gateway. Подробиці: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту та надійного захисту; малі картки обрізають контекст і дають витоки. Якщо мусите, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як утримувати трафік до hosted-моделей у конкретному регіоні?">
    Вибирайте endpoint-и, прив’язані до регіону. OpenRouter надає варіанти з розміщенням у США для MiniMax, Kimi і GLM; вибирайте варіант із розміщенням у США, щоб дані залишалися в межах регіону. Ви все одно можете вказувати Anthropic/OpenAI поряд із ними, використовуючи `models.mode: "merge"`, щоб резервні варіанти залишалися доступними, водночас дотримуючись вибраного регіонального провайдера.
  </Accordion>

  <Accordion title="Чи обов’язково купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini не є обов’язковим — дехто
    купує його як постійно ввімкнений хост, але також підійде невеликий VPS, домашній сервер або пристрій класу Raspberry Pi.

    Mac потрібен лише для **інструментів лише для macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або під’єднайте macOS Node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, на якому виконано вхід у Messages. Це **не обов’язково** має бути Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, а Gateway може працювати на Linux або деінде.

    Поширені сценарії:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac із входом у Messages.
    - Запускайте все на Mac, якщо хочете найпростішу конфігурацію з однією машиною.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи зможу я підключити його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **Node** (додатковий пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, як-от screen/camera/canvas і `system.run` на цьому пристрої.

    Поширена схема:

    - Gateway на Mac mini (завжди ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост Node і під’єднується до Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Nodes](/uk/nodes), [CLI для Nodes](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можна використовувати Bun?">
    Bun **не рекомендується**. Ми бачимо помилки середовища виконання, особливо з WhatsApp і Telegram.
    Для стабільних gateway використовуйте **Node**.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на неproduction gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Під час налаштування запитуються лише числові user ID. Якщо у вашій конфігурації вже є застарілі записи `@username`, `openclaw doctor --fix` може спробувати їх розв’язати.

    Безпечніший спосіб (без стороннього бота):

    - Напишіть своєму боту в DM, а потім запустіть `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть своєму боту в DM, а потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній сервіс (менш приватно):

    - Напишіть у DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними інстансами OpenClaw?">
    Так, через **маршрутизацію з кількома агентами**. Прив’яжіть WhatsApp **DM** кожного відправника (peer `kind: "direct"`, E.164 відправника, наприклад `+15551234567`) до різного `agentId`, щоб кожна людина мала власний робочий простір і сховище сесій. Відповіді все одно надходитимуть із **того самого облікового запису WhatsApp**, а керування доступом до DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Маршрутизація з кількома агентами](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента для "швидкого чату" і агента "Opus для кодування"?'>
    Так. Використовуйте маршрутизацію з кількома агентами: задайте кожному агенту власну типову модель, а потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретні peers) до кожного агента. Приклад конфігурації є в [Маршрутизації з кількома агентами](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Configuration](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH служби включає `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, розв’язувалися в оболонках без входу.
    Останні збірки також додають на початок PATH поширені користувацькі каталоги bin у службах Linux systemd (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо вони встановлені.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повна копія вихідного коду, можна редагувати, найкраще для контриб’юторів.
      Ви локально запускаєте збірки й можете вносити зміни до коду/документації.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію “просто запустити”.
      Оновлення надходять через npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm і git install?">
    Так. Установіть інший варіант, а потім запустіть Doctor, щоб служба gateway вказувала на нову точку входу.
    Це **не видаляє ваші дані** — змінюється лише спосіб встановлення коду OpenClaw. Ваш стан
    (`~/.openclaw`) і робочий простір (`~/.openclaw/workspace`) залишаються недоторканими.

    Від npm до git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Від git до npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor виявляє невідповідність точки входу служби gateway і пропонує переписати конфігурацію служби так, щоб вона відповідала поточному встановленню (в automation використовуйте `--repair`).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна цілодобова надійність, використовуйте VPS**. Якщо ви хочете
    мінімального тертя й вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Плюси:** без витрат на сервер, прямий доступ до локальних файлів, живе вікно браузера.
    - **Мінуси:** сон/мережеві збої = розриви з’єднання, оновлення ОС/перезавантаження переривають роботу, ноутбук має залишатися активним.

    **VPS / хмара**

    - **Плюси:** завжди ввімкнений, стабільна мережа, немає проблем зі сном ноутбука, простіше підтримувати роботу.
    - **Мінуси:** часто headless-режим (використовуйте знімки екрана), лише віддалений доступ до файлів, для оновлень потрібен SSH.

    **Примітка саме для OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord чудово працюють на VPS. Єдиний справжній компроміс — це **headless browser** проти видимого вікна. Див. [Browser](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо раніше у вас уже були розриви з’єднання gateway. Локальний запуск чудовий, коли ви активно користуєтеся Mac і хочете мати доступ до локальних файлів або автоматизацію UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Не обов’язково, але **рекомендується для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** завжди ввімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, простіше підтримувати безперервну роботу.
    - **Спільний ноутбук/настільний комп’ютер:** цілком підходить для тестування й активного використання, але очікуйте пауз, коли машина засинає або оновлюється.

    Якщо вам потрібне найкраще з обох світів, тримайте Gateway на виділеному хості та під’єднайте свій ноутбук як **Node** для локальних інструментів screen/camera/exec. Див. [Nodes](/uk/nodes).
    Щодо рекомендацій із безпеки читайте [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яка ОС рекомендована?">
    OpenClaw легкий. Для базового Gateway + одного чат-каналу:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM, ~500 МБ диска.
    - **Рекомендовано:** 1–2 vCPU, 2 ГБ RAM або більше із запасом (журнали, медіа, кілька каналів). Інструменти Node та автоматизація браузера можуть бути вимогливими до ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях установлення для Linux найкраще протестовано саме там.

    Документація: [Linux](/uk/platforms/linux), [VPS hosting](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди ввімкненою, доступною й мати достатньо
    RAM для Gateway та будь-яких channels, які ви ввімкнете.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM.
    - **Рекомендовано:** 2 ГБ RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера або медіа-інструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви на Windows, **WSL2 — це найпростіший варіант налаштування в стилі VM** і він має найкращу
    сумісність інструментів. Див. [Windows](/uk/platforms/windows), [VPS hosting](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Пов’язане

- [FAQ](/uk/help/faq) — основний FAQ (моделі, сесії, gateway, безпека тощо)
- [Огляд встановлення](/uk/install)
- [Початок роботи](/uk/start/getting-started)
- [Усунення проблем](/uk/help/troubleshooting)
