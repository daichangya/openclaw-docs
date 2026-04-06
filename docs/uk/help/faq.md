---
read_when:
    - Відповідь на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час виконання
    - Тріаж проблем, про які повідомляють користувачі, перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-06T12:48:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 391262b77c6c9b35253fd46b7d6fab324816c3cc25830f322f840fad0c9f58cf
    source_path: help/faq.md
    workflow: 15
---

# Поширені запитання

Швидкі відповіді та глибше усунення несправностей для реальних сценаріїв налаштування (локальна розробка, VPS, мультиагентність, OAuth/API-ключі, відмовостійкість моделей). Для діагностики під час виконання див. [Усунення несправностей](/uk/gateway/troubleshooting). Повний довідник із конфігурації див. у [Конфігурація](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламалося

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидкий локальний зведений стан: ОС + оновлення, доступність gateway/служби, агенти/сеанси, конфігурація провайдера + проблеми під час виконання (коли gateway доступний).

2. **Звіт, який можна вставити й поширити (безпечний для спільного доступу)**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з хвостом журналу (токени приховано).

3. **Стан демона + порту**

   ```bash
   openclaw gateway status
   ```

   Показує стан supervisor під час виконання порівняно з доступністю RPC, цільовий URL probe і яку конфігурацію, імовірно, використовувала служба.

4. **Поглиблені probe-перевірки**

   ```bash
   openclaw status --deep
   ```

   Виконує живу probe-перевірку працездатності gateway, включно з перевірками каналів, де це підтримується
   (потрібен доступний gateway). Див. [Стан](/uk/gateway/health).

5. **Перегляд останнього журналу в реальному часі**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використайте запасний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові журнали відокремлені від службових журналів; див. [Журналювання](/uk/logging) і [Усунення несправностей](/uk/gateway/troubleshooting).

6. **Запустіть doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує конфігурацію та стан + запускає перевірки працездатності. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # показує цільовий URL + шлях до конфігурації у разі помилок
   ```

   Запитує в запущеного gateway повний знімок стану (лише WS). Див. [Стан](/uk/gateway/health).

## Швидкий старт і початкове налаштування

<AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб вибратися?">
    Використайте локального AI-агента, який може **бачити вашу машину**. Це набагато ефективніше, ніж запитувати
    у Discord, тому що більшість випадків "я застряг" — це **локальні проблеми конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти журнали та допомагати виправляти
    налаштування на рівні машини (PATH, служби, дозволи, файли автентифікації). Надайте їм **повну копію вихідного коду**
    через hackable (git) install:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з git checkout**, тому агент може читати код і документацію та
    міркувати про точну версію, яку ви запускаєте. Пізніше ви завжди можете повернутися до стабільної версії,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й проконтролювати** виправлення (крок за кроком), а потім виконати лише
    потрібні команди. Так зміни залишаться невеликими, і їх буде легше перевірити.

    Якщо ви виявили справжню помилку або виправлення, будь ласка, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (діліться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану gateway/агента + базової конфігурації.
    - `openclaw models status`: перевіряє автентифікацію провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє типові проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламалося](#перші-60-секунд-якщо-щось-зламалося).
    Документація з встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску heartbeat:

    - `quiet-hours`: поза налаштованим вікном active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожню/заголовкову заготовку
    - `no-tasks-due`: активний режим завдань `HEARTBEAT.md`, але жоден із інтервалів завдань ще не настав
    - `alerts-disabled`: всю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові позначки настання лише просуваються після завершення
    реального запуску heartbeat. Пропущені запуски не позначають завдання як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановлення й налаштування OpenClaw">
    У репозиторії рекомендується запускати з вихідного коду та використовувати онбординг:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати UI-ресурси. Після онбордингу зазвичай Gateway працює на порту **18789**.

    Із вихідного коду (для контриб'юторів/розробників):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # автоматично встановлює залежності UI під час першого запуску
    openclaw onboard
    ```

    Якщо у вас ще немає глобального встановлення, запускайте через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Як відкрити dashboard після онбордингу?">
    Майстер відкриває браузер із чистим (без токена в URL) URL dashboard одразу після онбордингу, а також друкує посилання у зведенні. Залиште цю вкладку відкритою; якщо вона не відкрилася, скопіюйте/вставте надрукований URL на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується автентифікація за shared secret, вставте налаштований токен або пароль у налаштуваннях Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо shared secret ще не налаштовано, згенеруйте токен командою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште loopback bind, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставляння shared secret, за умови довіреного gateway host); HTTP API все одно вимагають автентифікації shared secret, якщо ви навмисно не використовуєте private-ingress `none` або автентифікацію HTTP через trusted-proxy.
      Некоректні одночасні спроби автентифікації Serve від того самого клієнта серіалізуються ще до того, як failed-auth limiter зафіксує їх, тому вже друга невдала повторна спроба може показувати `retry later`.
    - **Tailnet bind**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, потім вставте відповідний shared secret у налаштування dashboard.
    - **Identity-aware reverse proxy**: залиште Gateway за trusted proxy не на loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, потім відкрийте URL проксі.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`. Автентифікація shared secret через tunnel усе одно застосовується; якщо буде запит, вставте налаштований токен або пароль.

    Див. [Dashboard](/web/dashboard) і [Web-поверхні](/web) для режимів bind і деталей автентифікації.

  </Accordion>

  <Accordion title="Чому існують дві конфігурації схвалення exec для схвалень у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на схвалення до чат-призначень
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом схвалення для exec approvals

    Політика exec на host усе одно залишається справжнім бар'єром схвалення. Конфігурація чату лише керує тим,
    де з'являються запити на схвалення і як люди можуть на них відповідати.

    У більшості сценаріїв вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди й відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно вивести схвалювачів, OpenClaw тепер автоматично вмикає native approvals із пріоритетом DM, коли `channels.<channel>.execApprovals.enabled` не задано або дорівнює `"auto"`.
    - Коли доступні нативні картки/кнопки схвалення, цей нативний UI є основним шляхом; агент повинен включати ручну команду `/approve` лише якщо результат інструмента каже, що чат-схвалення недоступні або ручне схвалення — єдиний шлях.
    - Використовуйте `approvals.exec` лише коли запити також потрібно пересилати до інших чатів або окремих операційних кімнат.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише якщо ви явно хочете, щоб запити на схвалення публікувалися назад у вихідну кімнату/тему.
    - Схвалення plugins — це окрема категорія: вони за замовчуванням використовують `/approve` у тому самому чаті, необов'язкове пересилання `approvals.plugin`, і лише деякі нативні канали додатково зберігають нативну обробку plugin-approval.

    Коротко: пересилання — для маршрутизації, конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке середовище виконання мені потрібне?">
    Потрібен Node **>= 22**. Рекомендується `pnpm`. Bun для Gateway **не рекомендується**.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легковаговий — у документації вказано, що для особистого використання достатньо **512MB-1GB RAM**, **1 ядра** і приблизно **500MB**
    диска, а також зазначено, що **Raspberry Pi 4 може його запускати**.

    Якщо вам потрібен додатковий запас (журнали, медіа, інші служби), **рекомендується 2GB**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може розміщувати Gateway, а ви можете підключати **nodes** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради щодо встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте шорстких кутів.

    - Використовуйте **64-бітну** ОС і Node >= 22.
    - Віддавайте перевагу **hackable (git) install**, щоб бачити журнали та швидко оновлюватися.
    - Починайте без channels/skills, а потім додавайте їх по одному.
    - Якщо натрапляєте на дивні проблеми з бінарниками, зазвичай це проблема **сумісності ARM**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Застрягає на wake up my friend / онбординг не вилуплюється. Що робити?">
    Цей екран залежить від доступності та автентифікації Gateway. TUI також надсилає
    "Wake up, my friend!" автоматично під час першого вилуплення. Якщо ви бачите цей рядок **без відповіді**
    і токени залишаються на 0, агент так і не запустився.

    1. Перезапустіть Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Перевірте статус + автентифікацію:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Якщо все ще зависає, виконайте:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що tunnel/Tailscale-з'єднання активне і що UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini), не проходячи онбординг заново?">
    Так. Скопіюйте **каталог стану** та **workspace**, а потім один раз запустіть Doctor. Це
    збереже вашого бота **точно таким самим** (пам'ять, історія сеансів, автентифікація та
    стан каналів), якщо ви скопіюєте **обидва** розташування:

    1. Установіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте ваш workspace (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть службу Gateway.

    Це збереже конфігурацію, профілі автентифікації, облікові дані WhatsApp, сеанси й пам'ять. Якщо ви в
    remote mode, пам'ятайте, що store сеансів і workspace належать gateway host.

    **Важливо:** якщо ви лише commit/push свій workspace у GitHub, ви створюєте резервну копію
    **пам'яті + bootstrap-файлів**, але **не** історії сеансів чи автентифікації. Вони живуть
    у `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов'язане: [Міграція](/uk/install/migrating), [Де що лежить на диску](#де-що-лежить-на-диску),
    [Workspace агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи — вгорі. Якщо верхній розділ позначено як **Unreleased**, то наступний датований
    розділ — це остання випущена версія. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (а також розділами документації/іншими, за потреби).

  </Accordion>

  <Accordion title="Не вдається відкрити docs.openclaw.ai (SSL-помилка)">
    Деякі підключення Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до allowlist, а потім спробуйте ще раз.
    Будь ласка, допоможіть нам розблокувати це, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркалюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable-реліз спочатку з'являється в **beta**, а потім окремий
    крок просування переміщує цю ж версію в `latest`. За потреби супроводжувачі також можуть
    публікувати одразу в `latest`. Саме тому beta і stable можуть
    вказувати на **ту саму версію** після просування.

    Дивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Для однорядкових команд встановлення та різниці між beta і dev дивіться accordion нижче.

  </Accordion>

  <Accordion title="Як установити beta-версію і в чому різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (після просування може збігатися з `latest`).
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

  <Accordion title="Як спробувати найсвіжіші збірки?">
    Є два варіанти:

    1. **Dev channel (git checkout):**

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

    Документація: [Оновлення](/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай тривають встановлення та онбординг?">
    Орієнтовно:

    - **Встановлення:** 2-5 хвилин
    - **Онбординг:** 5-15 хвилин залежно від кількості каналів/моделей, які ви налаштовуєте

    Якщо щось зависає, скористайтеся [Застряг інсталятор](#швидкий-старт-і-початкове-налаштування)
    і швидким циклом налагодження в [Я застряг](#швидкий-старт-і-початкове-налаштування).

  </Accordion>

  <Accordion title="Інсталятор завис? Як отримати більше зворотного зв'язку?">
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
    # install.ps1 ще не має окремого прапорця -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Більше параметрів: [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Під час встановлення на Windows пише git not found або openclaw not recognized">
    Дві поширені проблеми на Windows:

    **1) npm error spawn git / git not found**

    - Установіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, а потім повторно запустіть інсталятор.

    **2) openclaw is not recognized після встановлення**

    - Ваша глобальна папка bin npm не входить до PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до вашого user PATH (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Після оновлення PATH закрийте й знову відкрийте PowerShell.

    Якщо вам потрібне найгладше налаштування на Windows, використовуйте **WSL2**, а не нативний Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У Windows вивід exec показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність code page консолі в нативних оболонках Windows.

    Симптоми:

    - Вивід `system.run`/`exec` показує китайські символи як mojibake
    - Та сама команда виглядає нормально в іншому профілі термінала

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

    Якщо це все ще відтворюється в останній версії OpenClaw, відстежуйте/повідомляйте тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використайте **hackable (git) install**, щоб мати повний вихідний код і документацію локально, а потім запитайте
    вашого бота (або Claude/Codex) _з цієї папки_, щоб він міг читати репозиторій і відповідати точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як установити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтесь інструкції для Linux, а потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення служби: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення та оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як установити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Установіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де знайти інструкції з встановлення в хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Виберіть одного й дотримуйтесь інструкції:

    - [VPS hosting](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви звертаєтеся до нього
    з ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан + workspace
    живуть на сервері, тому сприймайте host як джерело істини й робіть його резервні копії.

    Ви можете підключати **nodes** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримати доступ до
    локального екрана/камери/canvas або запускати команди на своєму ноутбуці, зберігаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити себе сам?">
    Коротка відповідь: **можливо, але не рекомендується**. Процес оновлення може перезапустити
    Gateway (що скине активний сеанс), може вимагати чистого git checkout і
    може запитати підтвердження. Безпечніше запускати оновлення з оболонки від імені оператора.

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

    Документація: [Оновлення](/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що саме робить онбординг?">
    `openclaw onboard` — рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth провайдера, API-ключі, legacy setup-token Anthropic, а також локальні варіанти моделей, як-от LM Studio)
    - Розташування **workspace** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також bundled channel plugins, як-от QQ Bot)
    - **Встановлення демона** (LaunchAgent на macOS; user unit systemd на Linux/WSL2)
    - **Перевірки працездатності** і вибір **Skills**

    Він також попереджає, якщо налаштована модель невідома або для неї бракує автентифікації.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запустити?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов'язкові способи автентифікації в цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **API-ключ Anthropic**: звичайний білінг Anthropic API
    - **Автентифікація підпискою Claude в OpenClaw**: Anthropic повідомила користувачам OpenClaw
      **4 квітня 2026 року о 12:00 PT / 8:00 PM BST**, що для цього потрібне
      **Extra Usage**, яке оплачується окремо від підписки

    Наші локальні відтворення також показують, що `claude -p --append-system-prompt ...` може
    натрапляти на той самий захист Extra Usage, коли доданий prompt ідентифікує
    OpenClaw, тоді як той самий рядок prompt **не** відтворює це блокування на
    шляху Anthropic SDK + API key. OpenAI Codex OAuth явно
    підтримується для зовнішніх інструментів, таких як OpenClaw.

    OpenClaw також підтримує інші хостингові варіанти з підписною моделлю, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [GLM Models](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API-ключа?">
    Так, але сприймайте це як **автентифікацію підпискою Claude з Extra Usage**.

    Підписки Claude Pro/Max не включають API-ключ. У контексті OpenClaw це
    означає, що застосовується спеціальне повідомлення Anthropic про білінг для OpenClaw: трафік
    за підпискою вимагає **Extra Usage**. Якщо ви хочете трафік Anthropic без
    цього шляху Extra Usage, використовуйте замість цього API-ключ Anthropic.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію підпискою Claude (Claude Pro або Max)?">
    Так, але підтримуване трактування тепер таке:

    - Anthropic в OpenClaw із підпискою означає **Extra Usage**
    - Anthropic в OpenClaw без цього шляху означає **API key**

    Anthropic setup-token і далі доступний як legacy/manual шлях OpenClaw,
    і спеціальне повідомлення Anthropic про білінг для OpenClaw усе ще діє для нього. Ми
    також локально відтворили той самий білінговий захист при прямому використанні
    `claude -p --append-system-prompt ...`, коли доданий prompt
    ідентифікує OpenClaw, тоді як той самий рядок prompt **не** відтворювався на
    шляху Anthropic SDK + API key.

    Для production або багатокористувацьких навантажень автентифікація API key Anthropic —
    безпечніший і рекомендований вибір. Якщо ви хочете інші хостингові
    варіанти з підписною моделлю в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і
    [GLM Models](/uk/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
Це означає, що вашу **квоту/ліміт запитів Anthropic** вичерпано для поточного вікна. Якщо ви
використовуєте **Claude CLI**, зачекайте, поки вікно скинеться, або підвищте тариф. Якщо ви
використовуєте **API key Anthropic**, перевірте Anthropic Console
на предмет використання/білінгу і за потреби підвищте ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, то запит намагається використати
    бета-функцію Anthropic із контекстом 1M (`context1m: true`). Це працює лише тоді, коли ваш
    обліковий запис має право на білінг довгого контексту (білінг API key або
    шлях входу в Claude через OpenClaw з увімкненим Extra Usage).

    Порада: установіть **fallback model**, щоб OpenClaw міг продовжувати відповідати, поки провайдер обмежений за rate limit.
    Див. [Моделі](/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має bundled-провайдер **Amazon Bedrock (Converse)**. Якщо присутні AWS env markers, OpenClaw може автоматично виявляти каталог потокових/текстових моделей Bedrock і об'єднувати його як неявний провайдер `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати ручний запис провайдера. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо вам зручніше керований шлях із ключем, OpenAI-сумісний проксі перед Bedrock також лишається коректним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Під час онбордингу можна пройти OAuth-процес, і за потреби буде встановлено модель за замовчуванням `openai-codex/gpt-5.4`. Див. [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію підпискою OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth підписки OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання subscription OAuth у зовнішніх інструментах/процесах
    на кшталт OpenClaw. Онбординг може провести OAuth-процес за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **plugin auth flow**, а не client id чи secret у `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Модель за замовчуванням після входу: `google-gemini-cli/gemini-3.1-pro-preview`
    5. Якщо запити не проходять, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на gateway host

    Це зберігає OAuth-токени в auth profiles на gateway host. Деталі: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; невеликі карти обрізають контекст і допускають витоки. Якщо вже потрібно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і дивіться [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як змусити хостинговий трафік моделей залишатися в певному регіоні?">
    Вибирайте endpoint-и, прив'язані до регіону. OpenRouter пропонує US-hosted варіанти для MiniMax, Kimi і GLM; виберіть US-hosted варіант, щоб зберегти дані в межах регіону. Ви все одно можете перелічувати Anthropic/OpenAI поряд із ними, використовуючи `models.mode: "merge"`, щоб fallback-и залишалися доступними, водночас поважаючи вибраного регіонального провайдера.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini не обов'язковий — деякі люди
    купують його як завжди увімкнений host, але підійде й невеликий VPS, домашній сервер або коробка рівня Raspberry Pi.

    Mac потрібен лише **для інструментів лише для macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) —
    сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або підключайте node macOS.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, увійшовший у Messages. Це **не обов'язково** має бути Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, тоді як Gateway може працювати на Linux або деінде.

    Поширені сценарії:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, увійшовшому в Messages.
    - Запускайте все на Mac, якщо хочете найпростіше однокомп'ютерне налаштування.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи можу я підключити його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **node** (супутній пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, як-от screen/camera/canvas і `system.run` на цьому пристрої.

    Поширений шаблон:

    - Gateway на Mac mini (завжди увімкнений).
    - MacBook Pro запускає застосунок macOS або node host і підключається до Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендується**. Ми бачимо помилки під час виконання, особливо з WhatsApp і Telegram.
    Використовуйте **Node** для стабільних gateway.

    Якщо ви все ж хочете експериментувати з Bun, робіть це на непродукційному gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що ставити в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім'я користувача бота.

    Під час онбордингу можна ввести `@username`, і він буде перетворений на числовий ID, але авторизація OpenClaw використовує лише числові ID.

    Безпечніше (без стороннього бота):

    - Напишіть боту в DM, потім запустіть `openclaw logs --follow` і подивіться `from.id`.

    Офіційний Bot API:

    - Напишіть боту в DM, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Напишіть `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp із різними інстансами OpenClaw?">
    Так, через **маршрутизацію мультиагентів**. Прив'яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, E.164 відправника на кшталт `+15551234567`) до іншого `agentId`, щоб кожна людина мала власний workspace і store сеансів. Відповіді все одно надходитимуть від **того самого облікового запису WhatsApp**, а контроль доступу для DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Маршрутизація мультиагентів](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "швидкий чат" і агента "Opus для кодування"?'>
    Так. Використовуйте маршрутизацію мультиагентів: задайте кожному агенту власну модель за замовчуванням, а потім прив'яжіть вхідні маршрути (обліковий запис провайдера або конкретні peers) до кожного агента. Приклад конфігурації є в [Маршрутизація мультиагентів](/uk/concepts/multi-agent). Також див. [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH служби містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, знаходилися в non-login оболонках.
    Останні збірки також додають поширені user bin-каталоги в Linux systemd services (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо вони задані.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повний checkout вихідного коду, редагований, найкращий для контриб'юторів.
      Ви локально запускаєте збірки й можете виправляти код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію "просто запустити".
      Оновлення надходять із npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можна пізніше перемикатися між npm і git install?">
    Так. Установіть інший варіант, а потім запустіть Doctor, щоб служба gateway вказувала на нову entrypoint.
    Це **не видаляє ваші дані** — змінюється лише інсталяція коду OpenClaw. Ваш стан
    (`~/.openclaw`) і workspace (`~/.openclaw/workspace`) залишаються недоторканими.

    Із npm на git:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    openclaw doctor
    openclaw gateway restart
    ```

    Із git на npm:

    ```bash
    npm install -g openclaw@latest
    openclaw doctor
    openclaw gateway restart
    ```

    Doctor виявляє невідповідність entrypoint служби gateway і пропонує переписати конфігурацію служби відповідно до поточного встановлення (у автоматизації використовуйте `--repair`).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#де-що-лежить-на-диску).

  </Accordion>

  <Accordion title="Gateway краще запускати на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо ви хочете
    мінімум тертя й вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Плюси:** безкоштовний сервер, прямий доступ до локальних файлів, видиме вікно браузера.
    - **Мінуси:** сон/обриви мережі = розриви з'єднання, оновлення ОС/перезавантаження переривають роботу, машина має залишатися активною.

    **VPS / хмара**

    - **Плюси:** завжди увімкнено, стабільна мережа, немає проблем зі сном ноутбука, простіше підтримувати в роботі.
    - **Мінуси:** часто працює без голови (використовуйте знімки екрана), доступ до файлів лише віддалений, для оновлень потрібен SSH.

    **Примітка, специфічна для OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord чудово працюють із VPS. Єдиний реальний компроміс — **headless browser** проти видимого вікна. Див. [Браузер](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо у вас уже були розриви gateway. Локальний варіант чудовий, коли ви активно користуєтеся Mac і хочете доступ до локальних файлів або UI-автоматизацію з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Це не обов'язково, але **рекомендується для надійності та ізоляції**.

    - **Виділений host (VPS/Mac mini/Pi):** завжди увімкнений, менше перебоїв через сон/перезавантаження, чистіші дозволи, легше підтримувати в роботі.
    - **Спільний ноутбук/ПК:** цілком підходить для тестування й активного використання, але очікуйте пауз, коли машина засинає або оновлюється.

    Якщо ви хочете найкраще з обох світів, тримайте Gateway на виділеному host і підключайте ноутбук як **node** для локальних screen/camera/exec інструментів. Див. [Nodes](/uk/nodes).
    Для рекомендацій із безпеки прочитайте [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яку ОС рекомендуєте?">
    OpenClaw легковаговий. Для базового Gateway + одного чат-каналу:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1-2 vCPU, 2GB RAM або більше із запасом (журнали, медіа, кілька каналів). Інструменти node і автоматизація браузера можуть бути ресурсомісткими.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях установлення на Linux там протестовано найкраще.

    Документація: [Linux](/uk/platforms/linux), [VPS hosting](/uk/vps).

  </Accordion>

  <Accordion title="Чи можна запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди увімкненою, доступною й мати достатньо
    RAM для Gateway та будь-яких увімкнених каналів.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера чи медіаінструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви на Windows, **WSL2 — найпростіший варіант у стилі VM** і має найкращу
    сумісність інструментів. Див. [Windows](/uk/platforms/windows), [VPS hosting](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw, в одному абзаці?">
    OpenClaw — це персональний AI-помічник, який ви запускаєте на власних пристроях. Він відповідає на тих платформах обміну повідомленнями, якими ви вже користуєтеся (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, а також bundled channel plugins, такі як QQ Bot) і також може працювати з голосом + живим Canvas на підтримуваних платформах. **Gateway** — це завжди ввімкнена control plane; сам помічник і є продуктом.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не "просто обгортка для Claude". Це **локальна control plane**, яка дає змогу запускати
    потужного помічника на **вашому власному обладнанні**, доступного з чат-застосунків, якими ви вже користуєтеся, зі
    станними сеансами, пам'яттю та інструментами — без передавання контролю над вашими процесами хостинговому
    SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway там, де хочете (Mac, Linux, VPS), і зберігайте
      workspace + історію сеансів локально.
    - **Справжні канали, а не веб-пісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      плюс мобільний голос і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо з маршрутизацією
      і failover на рівні агента.
    - **Варіант лише локально:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо хочете.
    - **Маршрутизація мультиагентів:** окремі агенти для каналу, облікового запису або завдання, кожен зі своїм
      workspace та значеннями за замовчуванням.
    - **Відкритий код і можливість модифікації:** перевіряйте, розширюйте й самостійно розміщуйте без vendor lock-in.

    Документація: [Gateway](/uk/gateway), [Канали](/uk/channels), [Мультиагентність](/uk/concepts/multi-agent),
    [Пам'ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував — що мені зробити спочатку?">
    Хороші перші проєкти:

    - Створити вебсайт (WordPress, Shopify або простий статичний сайт).
    - Прототипувати мобільний застосунок (структура, екрани, план API).
    - Організувати файли та папки (очищення, іменування, теги).
    - Підключити Gmail і автоматизувати підсумки чи follow-ups.

    Він може працювати з великими завданнями, але найкраще працює, коли ви ділите їх на фази й
    використовуєте sub agents для паралельної роботи.

  </Accordion>

  <Accordion title="Які п'ять найпоширеніших повсякденних сценаріїв використання OpenClaw?">
    Повсякденні переваги зазвичай виглядають так:

    - **Персональні брифінги:** підсумки inbox, календаря та новин, які вас цікавлять.
    - **Дослідження та чернетки:** швидке дослідження, підсумки й перші чернетки для листів або документів.
    - **Нагадування та follow-ups:** підказки й чеклісти на основі cron або heartbeat.
    - **Автоматизація браузера:** заповнення форм, збирання даних і повторення веб-завдань.
    - **Координація між пристроями:** надішліть завдання з телефону, дозвольте Gateway виконати його на сервері й отримайте результат назад у чат.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, рекламою та блогами для SaaS?">
    Так — для **дослідження, кваліфікації й підготовки чернеток**. Він може сканувати сайти, складати короткі списки,
    підсумовувати потенційних клієнтів і писати чернетки outreach або рекламних текстів.

    Для **outreach або рекламних кампаній** залишайте людину в контурі. Уникайте спаму, дотримуйтеся місцевих законів і
    політик платформ та перевіряйте все перед відправленням. Найбезпечніший шаблон — дозволити
    OpenClaw підготувати чернетку, а вам — затвердити її.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний помічник** і координаційний шар, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу кодування в репозиторії. Використовуйте OpenClaw, коли
    вам потрібні довготривала пам'ять, доступ із різних пристроїв і оркестрація інструментів.

    Переваги:

    - **Постійна пам'ять + workspace** між сеансами
    - **Доступ із різних платформ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (браузер, файли, планування, hooks)
    - **Завжди ввімкнений Gateway** (працює на VPS, взаємодіяйте звідусіль)
    - **Nodes** для локального browser/screen/camera/exec

    Вітрина: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills і автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати skills, не забруднюючи репозиторій?">
    Використовуйте керовані overrides замість редагування копії в репозиторії. Помістіть ваші зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, тому керовані overrides все одно мають вищий пріоритет за bundled skills без дотику до git. Якщо skill має бути встановлений глобально, але видимий лише деяким агентам, тримайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` та `agents.list[].skills`. Лише зміни, гідні upstream, мають жити в репозиторії й надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати skills із власної папки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий пріоритет: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` за замовчуванням встановлює в `./skills`, що OpenClaw трактує як `<workspace>/skills` у наступному сеансі. Якщо skill має бути видимий лише певним агентам, поєднайте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як використовувати різні моделі для різних завдань?">
    Сьогодні підтримуються такі шаблони:

    - **Cron jobs**: ізольовані завдання можуть задавати override `model` для кожного завдання.
    - **Sub-agents**: маршрутизуйте завдання до окремих агентів із різними моделями за замовчуванням.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб у будь-який момент змінити модель поточного сеансу.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Маршрутизація мультиагентів](/uk/concepts/multi-agent) і [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як це винести?">
    Використовуйте **sub-agents** для довгих або паралельних завдань. Sub-agents працюють у власному сеансі,
    повертають підсумок і зберігають чутливість вашого основного чату.

    Попросіть бота "spawn a sub-agent for this task" або використайте `/subagents`.
    Використовуйте `/status` у чаті, щоб побачити, що зараз робить Gateway (і чи зайнятий він).

    Порада щодо токенів: довгі завдання й sub-agents обидва споживають токени. Якщо вас
    турбує вартість, задайте дешевшу модель для sub-agents через `agents.defaults.subagents.model`.

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють прив'язані до thread сеанси subagent на Discord?">
    Використовуйте прив'язки thread. Ви можете прив'язати Discord thread до subagent або session target, щоб подальші повідомлення в цьому thread залишалися на прив'язаному сеансі.

    Базовий процес:

    - Створіть через `sessions_spawn` із `thread: true` (і за бажанням `mode: "session"` для сталого follow-up).
    - Або вручну прив'яжіть через `/focus <target>`.
    - Використовуйте `/agents`, щоб перевірити стан прив'язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати авто-скасуванням фокусу.
    - Використовуйте `/unfocus`, щоб від'єднати thread.

    Потрібна конфігурація:

    - Глобальні значення за замовчуванням: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override-и Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоприв'язка під час spawn: установіть `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agents](/uk/tools/subagents), [Discord](/uk/channels/discord), [Довідник із конфігурації](/uk/gateway/configuration-reference), [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent завершився, але сповіщення про завершення прийшло не туди або взагалі не опублікувалося. Що перевірити?">
    Спочатку перевірте розв'язаний маршрут requester:

    - Доставка completion-mode subagent віддає перевагу будь-якому прив'язаному thread або маршруту розмови, якщо такий існує.
    - Якщо completion origin містить лише канал, OpenClaw повертається до збереженого маршруту сеансу requester (`lastChannel` / `lastTo` / `lastAccountId`), тож пряма доставка все одно може спрацювати.
    - Якщо немає ані прив'язаного маршруту, ані придатного збереженого маршруту, пряма доставка може не вдатися, і результат повертається до queued session delivery замість негайної публікації в чат.
    - Невалідні або застарілі цілі все одно можуть примусити fallback до черги або остаточну помилку доставки.
    - Якщо остання видима відповідь assistant дочірнього агента — точний тихий токен `NO_REPLY` / `no_reply` або рівно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує оголошення замість публікації застарілого попереднього прогресу.
    - Якщо дочірній агент перевищив тайм-аут після одних лише викликів інструментів, оголошення може згорнути це в короткий підсумок часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks), [Інструмент сеансів](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron працює всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання не запускатимуться.

    Контрольний список:

    - Переконайтеся, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не встановлено.
    - Переконайтеся, що Gateway працює 24/7 (без сну/перезапусків).
    - Перевірте налаштування часового поясу для завдання (`--tz` проти часового поясу host).

    Налагодження:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Cron спрацював, але нічого не було надіслано в канал. Чому?">
    Спочатку перевірте режим доставки:

    - `--no-deliver` / `delivery.mode: "none"` означає, що зовнішнє повідомлення не очікується.
    - Відсутня або невалідна announce-ціль (`channel` / `to`) означає, що runner пропустив вихідну доставку.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що runner спробував доставити, але облікові дані це заблокували.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` лише) вважається навмисно недоставлюваним, тому runner також пригнічує queued fallback delivery.

    Для ізольованих cron-завдань runner відповідає за фінальну доставку. Від агента
    очікується повернення текстового підсумку, який runner надішле. `--no-deliver` зберігає
    цей результат внутрішнім; це не дозволяє агенту напряму надсилати через
    message tool.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований cron-запуск переключив моделі або один раз повторився?">
    Зазвичай це шлях живого перемикання моделі, а не дублювання планування.

    Ізольований cron може зберігати runtime handoff моделі та повторювати спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повтор зберігає перемкнутого
    provider/model, і якщо перемикання містило новий override auth profile, cron
    також зберігає це перед повтором.

    Пов'язані правила вибору:

    - Override моделі Gmail hook має найвищий пріоритет, коли застосовно.
    - Потім — `model` для кожного завдання.
    - Потім — будь-який збережений override моделі cron-сеансу.
    - Потім — звичайний вибір моделі агента/за замовчуванням.

    Цикл повторів обмежений. Після початкової спроби плюс 2 повторів перемикання
    cron перериває виконання замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Як установити skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або просто помістіть skills у ваш workspace. Інтерфейс Skills для macOS недоступний на Linux.
    Переглядати skills можна на [https://clawhub.ai](https://clawhub.ai).

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
    активного workspace. Окремий CLI `clawhub` потрібен лише якщо ви хочете публікувати або
    синхронізувати власні skills. Для спільного встановлення між агентами помістіть skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете обмежити, які агенти можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати завдання за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Cron jobs** для запланованих або повторюваних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок "основного сеансу".
    - **Ізольовані завдання** для автономних агентів, які публікують підсумки або доставляють у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати Apple skills тільки для macOS із Linux?">
    Напряму — ні. Skills для macOS контролюються `metadata.openclaw.os` плюс потрібними бінарниками, а skills з'являються в system prompt лише коли вони придатні на **gateway host**. На Linux skills лише для `darwin` (як-от `apple-notes`, `apple-reminders`, `things-mac`) не завантажаться, якщо ви не override-нете перевірку.

    У вас є три підтримувані шаблони:

    **Варіант A — запустити Gateway на Mac (найпростіше).**
    Запустіть Gateway там, де існують бінарники macOS, а потім підключайтеся з Linux у [віддаленому режимі](#gateway-порти-вже-запущені-і-віддалений-режим) або через Tailscale. Skills завантажаться нормально, бо gateway host — це macOS.

    **Варіант B — використати node macOS (без SSH).**
    Запустіть Gateway на Linux, підключіть node macOS (menubar app) і встановіть **Node Run Commands** у "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати skills лише для macOS придатними, коли потрібні бінарники існують на node. Агент запускає ці skills через інструмент `nodes`. Якщо ви виберете "Always Ask", підтвердження "Always Allow" у prompt додасть цю команду до allowlist.

    **Варіант C — проксіювати бінарники macOS через SSH (розширений).**
    Тримайте Gateway на Linux, але зробіть так, щоб потрібні CLI-бінарники резолвилися в SSH-обгортки, які запускаються на Mac. Потім override-ніть skill, щоб дозволити Linux і зберегти його придатним.

    1. Створіть SSH-обгортку для бінарника (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Помістіть обгортку в `PATH` на Linux host (наприклад `~/bin/memo`).
    3. Override-ніть метадані skill (workspace або `~/.openclaw/skills`), щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Почніть новий сеанс, щоб знімок skills оновився.

  </Accordion>

  <Accordion title="У вас є інтеграція з Notion або HeyGen?">
    Вбудованої наразі немає.

    Варіанти:

    - **Користувацький skill / plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Автоматизація браузера:** працює без коду, але повільніша і крихкіша.

    Якщо ви хочете зберігати контекст окремо для кожного клієнта (агентські процеси), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + уподобання + активна робота).
    - Попросіть агента зчитувати цю сторінку на початку сеансу.

    Якщо вам потрібна нативна інтеграція, відкрийте feature request або створіть skill
    для цих API.

    Установлення skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активного workspace. Для спільних skills між агентами розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі агенти, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі skills очікують встановлення бінарників через Homebrew; на Linux це означає Linuxbrew (див. вище пункт FAQ про Homebrew на Linux). Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати свій наявний увійдений Chrome з OpenClaw?">
    Використовуйте вбудований браузерний профіль `user`, який підключається через Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Якщо вам потрібна власна назва, створіть явний MCP-профіль:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Цей шлях є локальним для host. Якщо Gateway працює деінде, або запустіть node host на машині з браузером, або використовуйте remote CDP.

    Поточні обмеження `existing-session` / `user`:

    - дії прив'язані до ref, а не до CSS-selector
    - завантаження файлів вимагає `ref` / `inputRef` і наразі підтримує по одному файлу за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії все ще потребують керованого браузера або сирого профілю CDP

  </Accordion>
</AccordionGroup>

## Пісочниця та пам'ять

<AccordionGroup>
  <Accordion title="Чи є окремий документ про пісочницю?">
    Так. Див. [Пісочниця](/uk/gateway/sandboxing). Для налаштування, специфічного для Docker (повний gateway у Docker або sandbox images), див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повну функціональність?">
    Типовий образ орієнтований на безпеку і працює від користувача `node`, тому не
    містить системних пакетів, Homebrew або bundled browsers. Для повнішого налаштування:

    - Зробіть `/home/node` постійним за допомогою `OPENCLAW_HOME_VOLUME`, щоб кеші зберігалися.
    - Додайте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Установіть Playwright browsers через bundled CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Установіть `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях є постійним.

    Документація: [Docker](/uk/install/docker), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я тримати DM особистими, а групи — публічними/у пісочниці з одним агентом?">
    Так — якщо ваш приватний трафік — це **DM**, а публічний трафік — це **групи**.

    Використайте `agents.defaults.sandbox.mode: "non-main"`, щоб сеанси груп/каналів (ключі не-main) запускалися в Docker, а головний DM-сеанс залишався на host. Потім обмежте набір інструментів, доступних у sandbox-сеансах, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: особисті DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Довідник із ключової конфігурації: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив'язати папку host до sandbox?">
    Установіть `agents.defaults.sandbox.docker.binds` у `["host:path:mode"]` (наприклад `"/home/user/src:/src:ro"`). Глобальні й поагентні прив'язки зливаються; поагентні прив'язки ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого й пам'ятайте, що прив'язки обходять файлові стіни sandbox.

    OpenClaw перевіряє джерела bind і за нормалізованим шляхом, і за канонічним шляхом, розв'язаним через найглибший наявний батьківський каталог. Це означає, що обходи через symlink-батьків усе одно блокуються навіть тоді, коли останній сегмент шляху ще не існує, а перевірки allowed-root усе одно застосовуються після розв'язання symlink.

    Див. [Пісочниця](/uk/gateway/sandboxing#custom-bind-mounts) і [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) для прикладів і зауваг щодо безпеки.

  </Accordion>

  <Accordion title="Як працює пам'ять?">
    Пам'ять OpenClaw — це просто Markdown-файли у workspace агента:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Кураторські довгострокові нотатки в `MEMORY.md` (лише основні/приватні сеанси)

    OpenClaw також виконує **тихе скидання пам'яті перед compaction**, щоб нагадати моделі
    записати стійкі нотатки перед auto-compaction. Це запускається лише коли workspace
    доступний для запису (read-only sandbox пропускає це). Див. [Пам'ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Пам'ять постійно щось забуває. Як зробити, щоб це закріплювалося?">
    Попросіть бота **записати факт у пам'ять**. Довгострокові нотатки мають бути в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще область, яку ми вдосконалюємо. Корисно нагадувати моделі зберігати спогади;
    вона зрозуміє, що робити. Якщо вона все одно забуває, перевірте, що Gateway використовує той самий
    workspace під час кожного запуску.

    Документація: [Пам'ять](/uk/concepts/memory), [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Пам'ять зберігається назавжди? Які є обмеження?">
    Файли пам'яті живуть на диску й зберігаються, доки ви їх не видалите. Обмеження — це
    сховище, а не модель. **Контекст сеансу** все одно обмежений вікном
    контексту моделі, тому довгі розмови можуть стискатися або обрізатися. Саме тому
    існує semantic memory search — він повертає в контекст лише релевантні частини.

    Документація: [Пам'ять](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потрібен OpenAI API key для semantic memory search?">
    Лише якщо ви використовуєте **embeddings OpenAI**. Codex OAuth покриває chat/completions і
    **не** надає доступу до embeddings, тож **вхід через Codex (OAuth або
    вхід у Codex CLI)** не допоможе для semantic memory search. Для embeddings OpenAI
    усе одно потрібен справжній API key (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви явно не задаєте провайдера, OpenClaw автоматично вибирає провайдера, коли
    може знайти API key (auth profiles, `models.providers.*.apiKey` або env vars).
    Він віддає перевагу OpenAI, якщо знаходить ключ OpenAI, інакше Gemini, якщо знаходить ключ Gemini,
    потім Voyage, потім Mistral. Якщо жодного віддаленого ключа немає, memory
    search залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштований і наявний
    локальний шлях до моделі, OpenClaw
    надає перевагу `local`. Ollama підтримується, коли ви явно встановлюєте
    `memorySearch.provider = "ollama"`.

    Якщо ви хочете залишатися локальними, установіть `memorySearch.provider = "local"` (і за бажанням
    `memorySearch.fallback = "none"`). Якщо ви хочете embeddings Gemini, установіть
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо embedding-моделі **OpenAI, Gemini, Voyage, Mistral, Ollama або local**
    — деталі налаштування див. у [Пам'ять](/uk/concepts/memory).

  </Accordion>
</AccordionGroup>

## Де що лежить на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, які використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні служби все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** сеанси, файли пам'яті, конфігурація та workspace живуть на gateway host
      (`~/.openclaw` + каталог вашого workspace).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте провайдерам моделей (Anthropic/OpenAI тощо), ідуть до
      їхніх API, а платформи чатів (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на
      своїх серверах.
    - **Ви контролюєте слід:** використання локальних моделей зберігає prompts на вашій машині, але трафік
      каналів усе одно проходить через сервери цих каналів.

    Пов'язане: [Workspace агента](/uk/concepts/agent-workspace), [Пам'ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе живе в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Path                                                            | Призначення                                                         |
    | --------------------------------------------------------------- | ------------------------------------------------------------------- |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основна конфігурація (JSON5)                                        |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy-імпорт OAuth (копіюється в auth profiles під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, API keys і необов'язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов'язкове файлове secret payload для провайдерів `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy-файл сумісності (статичні записи `api_key` очищуються)       |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдера (наприклад `whatsapp/<accountId>/creds.json`)       |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Поагентний стан (agentDir + sessions)                               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (по агенту)                                   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані сеансів (по агенту)                                        |

    Legacy-шлях single-agent: `~/.openclaw/agent/*` (мігрується командою `openclaw doctor`).

    Ваш **workspace** (AGENTS.md, файли пам'яті, skills тощо) є окремим і налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають лежати AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли живуть у **workspace агента**, а не в `~/.openclaw`.

    - **Workspace (на агента)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (або legacy fallback `memory.md`, коли `MEMORY.md` відсутній),
      `memory/YYYY-MM-DD.md`, необов'язковий `HEARTBEAT.md`.
    - **Каталог стану (`~/.openclaw`)**: конфігурація, стан каналів/провайдерів, auth profiles, sessions, logs,
      і спільні skills (`~/.openclaw/skills`).

    Workspace за замовчуванням — `~/.openclaw/workspace`, налаштовується через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот "забуває" після перезапуску, переконайтеся, що Gateway щоразу використовує той самий
    workspace (і пам'ятайте: remote mode використовує **workspace gateway host**,
    а не вашого локального ноутбука).

    Порада: якщо ви хочете зберегти сталу поведінку або вподобання, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладатися на історію чату.

    Див. [Workspace агента](/uk/concepts/agent-workspace) і [Пам'ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Зберігайте **workspace агента** у **приватному** git-репозиторії та робіть його резервні копії
    у приватному місці (наприклад, приватний GitHub). Це захоплює пам'ять + файли AGENTS/SOUL/USER
    і дає змогу пізніше відновити "розум" помічника.

    **Не** комітьте нічого з `~/.openclaw` (облікові дані, сеанси, токени або зашифровані secret payloads).
    Якщо вам потрібне повне відновлення, окремо робіть резервні копії і workspace, і каталогу стану
    (див. питання про міграцію вище).

    Документація: [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окремий посібник: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть агенти працювати поза workspace?">
    Так. Workspace — це **типовий cwd** і якір пам'яті, а не жорстка sandbox.
    Відносні шляхи резолвляться всередині workspace, але абсолютні шляхи можуть звертатися до інших
    розташувань host, якщо пісочниця не ввімкнена. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або поагентні налаштування sandbox. Якщо ви
    хочете, щоб репозиторій був типовим робочим каталогом, направте `workspace`
    цього агента в корінь репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
    workspace окремо, якщо тільки ви навмисно не хочете, щоб агент працював усередині нього.

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

  <Accordion title="Віддалений режим: де знаходиться store сеансів?">
    Стан сеансів належить **gateway host**. Якщо ви в remote mode, потрібний вам store сеансів знаходиться на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Керування сеансами](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="У якому форматі конфігурація? Де вона?">
    OpenClaw читає необов'язкову конфігурацію **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються відносно безпечні значення за замовчуванням (зокрема типовий workspace `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я встановив gateway.bind: "lan" (або "tailnet"), і тепер ніщо не слухає / UI каже unauthorized'>
    Bind-и не на loopback **вимагають валідного шляху автентифікації gateway**. На практиці це означає:

    - автентифікація shared secret: токен або пароль
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

    - `gateway.remote.token` / `.password` самі по собі **не** вмикають локальну автентифікацію gateway.
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як fallback лише коли `gateway.auth.*` не задано.
    - Для автентифікації паролем установіть `gateway.auth.mode: "password"` плюс `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і його не вдається розв'язати, розв'язання закривається з помилкою (без маскувального remote fallback).
    - Налаштування Control UI із shared secret автентифікуються через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях app/UI). Режими з ідентичністю, як-от Tailscale Serve або `trusted-proxy`, натомість використовують заголовки запиту. Уникайте розміщення shared secrets в URL.
    - Із `gateway.auth.mode: "trusted-proxy"` reverse proxy на loopback на тому ж host усе одно **не** задовольняє trusted-proxy auth. Trusted proxy має бути налаштованим джерелом не на loopback.

  </Accordion>

  <Accordion title="Чому тепер на localhost потрібен токен?">
    OpenClaw за замовчуванням примусово вимагає автентифікацію gateway, зокрема на loopback. У звичайному типовому шляху це означає token auth: якщо явний шлях автентифікації не налаштовано, запуск gateway переходить у режим token і автоматично генерує токен, зберігаючи його в `gateway.auth.token`, тож **локальні WS-клієнти мають автентифікуватися**. Це блокує іншим локальним процесам можливість викликати Gateway.

    Якщо ви віддаєте перевагу іншому шляху автентифікації, можете явно вибрати режим пароля (або, для identity-aware reverse proxy не на loopback, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно встановіть `gateway.auth.mode: "none"` у конфігурації. Doctor може згенерувати токен у будь-який момент: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни конфігурації?">
    Gateway стежить за конфігурацією й підтримує hot-reload:

    - `gateway.reload.mode: "hybrid"` (типово): hot-apply безпечних змін, перезапуск для критичних
    - також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні слогани CLI?">
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

    - `off`: приховує текст слогану, але залишає рядок із назвою/версією банера.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: циклічні кумедні/сезонні слогани (типова поведінка).
    - Якщо ви взагалі не хочете банер, установіть env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути вебпошук (і web fetch)?">
    `web_fetch` працює без API key. `web_search` залежить від обраного
    провайдера:

    - Провайдери з API, як-от Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, вимагають своїх звичайних налаштувань API key.
    - Ollama Web Search не потребує ключа, але використовує налаштований вами Ollama host і вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна HTML-інтеграція.
    - SearXNG не потребує ключа/самостійно розміщується; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

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
              provider: "firecrawl", // необов'язково; опустіть для auto-detect
            },
          },
        },
    }
    ```

    Конфігурація вебпошуку, специфічна для провайдера, тепер живе в `plugins.entries.<plugin>.config.webSearch.*`.
    Legacy-шляхи провайдера `tools.web.search.*` усе ще тимчасово завантажуються для сумісності, але не повинні використовуватися в нових конфігураціях.
    Конфігурація fallback web-fetch Firecrawl живе в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlist-и, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнено за замовчуванням (якщо його явно не вимкнено).
    - Якщо `tools.web.fetch.provider` опущено, OpenClaw автоматично виявляє першого готового fallback-провайдера fetch із доступних облікових даних. Наразі bundled-провайдер — Firecrawl.
    - Демони читають env vars із `~/.openclaw/.env` (або середовища служби).

    Документація: [Вебінструменти](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мою конфігурацію. Як відновити й уникнути цього надалі?">
    `config.apply` замінює **всю конфігурацію**. Якщо ви надсилаєте частковий об'єкт, усе
    інше буде видалено.

    Відновлення:

    - Відновіть із резервної копії (git або скопійований `~/.openclaw/openclaw.json`).
    - Якщо резервної копії немає, повторно запустіть `openclaw doctor` і переналаштуйте канали/моделі.
    - Якщо це було неочікувано, створіть bug report і додайте останню відому конфігурацію або будь-яку резервну копію.
    - Локальний coding agent часто може відновити робочу конфігурацію з журналів або історії.

    Як уникнути:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Спочатку використовуйте `config.schema.lookup`, коли ви не впевнені в точному шляху або формі поля; він повертає вузол shallow schema плюс підсумки безпосередніх дочірніх елементів для поступового уточнення.
    - Використовуйте `config.patch` для часткових RPC-редагувань; залиште `config.apply` лише для повної заміни конфігурації.
    - Якщо ви використовуєте інструмент `gateway`, доступний лише власнику, із запуску агента, він усе одно відхиляє записи в `tools.exec.ask` / `tools.exec.security` (включно з legacy-аліасами `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Конфігурація](/cli/config), [Налаштування](/cli/configure), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими працівниками на різних пристроях?">
    Поширений шаблон — **один Gateway** (наприклад, Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** володіє каналами (Signal/WhatsApp), маршрутизацією та сеансами.
    - **Nodes (пристрої):** Mac/iOS/Android підключаються як периферія та надають локальні інструменти (`system.run`, `canvas`, `camera`).
    - **Agents (працівники):** окремі "мізки"/workspace для спеціальних ролей (наприклад, "Hetzner ops", "Personal data").
    - **Sub-agents:** запускають фонову роботу з основного агента, коли потрібен паралелізм.
    - **TUI:** підключається до Gateway і перемикає агентів/сеанси.

    Документація: [Nodes](/uk/nodes), [Віддалений доступ](/uk/gateway/remote), [Маршрутизація мультиагентів](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Чи може браузер OpenClaw працювати в headless-режимі?">
    Так. Це опція конфігурації:

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

    Типове значення — `false` (із вікном). Headless частіше провокує антибот-перевірки на деяких сайтах. Див. [Браузер](/uk/tools/browser).

    Headless використовує **той самий Chromium engine** і працює для більшості автоматизацій (форми, кліки, скрапінг, входи). Основні відмінності:

    - Немає видимого вікна браузера (використовуйте знімки екрана, якщо потрібна візуальна інформація).
    - Деякі сайти суворіше ставляться до автоматизації в headless-режимі (CAPTCHA, антибот).
      Наприклад, X/Twitter часто блокує headless-сеанси.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Установіть `browser.executablePath` на ваш бінарник Brave (або будь-який браузер на основі Chromium) і перезапустіть Gateway.
    Повні приклади конфігурації див. у [Браузер](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway та nodes

<AccordionGroup>
  <Accordion title="Як команди поширюються між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає агента і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен node tool:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідний трафік провайдера; вони отримують лише виклики node RPC.

  </Accordion>

  <Accordion title="Як мій агент може отримати доступ до мого комп'ютера, якщо Gateway розміщено віддалено?">
    Коротка відповідь: **підключіть ваш комп'ютер як node**. Gateway працює деінде, але може
    викликати інструменти `node.*` (screen, camera, system) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на завжди ввімкненому host (VPS/домашній сервер).
    2. Додайте gateway host і ваш комп'ютер до одного tailnet.
    3. Переконайтеся, що Gateway WS доступний (tailnet bind або SSH tunnel).
    4. Локально відкрийте застосунок macOS і підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як node.
    5. Схваліть node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP bridge не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування про безпеку: підключення node macOS дозволяє `system.run` на цій машині. Підключайте
    лише ті пристрої, яким довіряєте, і перегляньте [Безпека](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Протокол Gateway](/uk/gateway/protocol), [Віддалений режим macOS](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключений, але я не отримую відповідей. Що тепер?">
    Перевірте основи:

    - Gateway працює: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан каналів: `openclaw channels status`

    Потім перевірте автентифікацію та маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` встановлено правильно.
    - Якщо ви підключаєтеся через SSH tunnel, підтвердьте, що локальний tunnel працює й указує на правильний порт.
    - Переконайтеся, що ваші allowlist-и (DM або група) включають ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Канали](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два інстанси OpenClaw спілкуватися між собою (локальний + VPS)?">
    Так. Вбудованого мосту "бот-до-бота" немає, але це можна реалізувати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний чат-канал, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай бот A надішле повідомлення боту B, а потім бот B відповість як звично.

    **CLI-міст (універсально):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючи на чат, де інший бот
    слухає. Якщо один із ботів працює на віддаленому VPS, направте ваш CLI на цей віддалений Gateway
    через SSH/Tailscale (див. [Віддалений доступ](/uk/gateway/remote)).

    Приклад шаблону (запускається з машини, яка може досягти цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте обмежувач, щоб два боти не зациклилися нескінченно (відповідати лише на згадки, channel
    allowlist-и або правило "не відповідати на повідомлення ботів").

    Документація: [Віддалений доступ](/uk/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох агентів?">
    Ні. Один Gateway може розміщувати кількох агентів, кожен зі своїм workspace, моделями за замовчуванням,
    і маршрутизацією. Це типовий сценарій, і він набагато дешевший і простіший, ніж запускати
    окремий VPS на кожного агента.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні конфігурації, якими ви не хочете ділитися. В інших випадках достатньо одного Gateway і
    кількох агентів або sub-agents.

  </Accordion>

  <Accordion title="Чи є перевага у використанні node на моєму особистому ноутбуці замість SSH із VPS?">
    Так — nodes є першокласним способом доступу до ноутбука з віддаленого Gateway, і вони
    дають більше, ніж просто доступ до оболонки. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легковаговим (невеликий VPS або коробка рівня Raspberry Pi цілком підходять; 4 GB RAM більш ніж достатньо), тож поширений
    сценарій — host, що завжди увімкнений, плюс ваш ноутбук як node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують pairing пристроїв.
    - **Безпечніший контроль виконання.** `system.run` контролюється allowlist-ами/схваленнями node на цьому ноутбуці.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна автоматизація браузера.** Тримайте Gateway на VPS, але запускайте Chrome локально через node host на ноутбуці або підключайтеся до локального Chrome на host через Chrome MCP.

    SSH підходить для епізодичного доступу до оболонки, але nodes простіші для постійних робочих процесів агентів і
    автоматизації пристроїв.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes службу gateway?">
    Ні. На одному host зазвичай має працювати лише **один gateway**, якщо тільки ви навмисно не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)). Nodes — це периферія, яка підключається
    до gateway (nodes iOS/Android або режим "node mode" у menubar app на macOS). Для headless node
    host-ів і керування через CLI див. [Node host CLI](/cli/node).

    Для змін `gateway`, `discovery` і `canvasHost` потрібен повний перезапуск.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати конфігурацію?">
    Так.

    - `config.schema.lookup`: перевірити одне піддерево конфігурації разом із shallow schema node, відповідною UI-підказкою та підсумками безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний знімок + hash
    - `config.patch`: безпечне часткове оновлення (переважний варіант для більшості RPC-редагувань)
    - `config.apply`: перевірити + повністю замінити конфігурацію, а потім перезапустити
    - Runtime tool `gateway`, доступний лише власнику, як і раніше відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; legacy-аліаси `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

  </Accordion>

  <Accordion title="Мінімальна осмислена конфігурація для першого встановлення">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Це задає ваш workspace і обмежує, хто може запускати бота.

  </Accordion>

  <Accordion title="Як налаштувати Tailscale на VPS і підключитися з Mac?">
    Мінімальні кроки:

    1. **Установіть і увійдіть на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Установіть і увійдіть на Mac**
       - Використовуйте застосунок Tailscale і ввійдіть у той самий tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - В admin console Tailscale увімкніть MagicDNS, щоб VPS мав стабільне ім'я.
    4. **Використовуйте hostname tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо ви хочете Control UI без SSH, використовуйте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив'язаним до loopback і відкриває HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як підключити node Mac до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Control UI + WS Gateway**. Nodes підключаються через той самий endpoint Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS і Mac в одному tailnet**.
    2. **Використовуйте застосунок macOS у Remote mode** (ціллю SSH може бути hostname tailnet).
       Застосунок пробросить порт Gateway і підключиться як node.
    3. **Схваліть node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Протокол Gateway](/uk/gateway/protocol), [Виявлення](/uk/gateway/discovery), [Віддалений режим macOS](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Краще встановлювати на другий ноутбук чи просто додати node?">
    Якщо вам потрібні лише **локальні інструменти** (screen/camera/exec) на другому ноутбуці, додайте його як
    **node**. Це дозволяє зберегти один Gateway і уникнути дублювання конфігурації. Локальні node tools
    наразі доступні лише на macOS, але ми плануємо поширити їх і на інші ОС.

    Установлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes), [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Змінні середовища та завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує змінні середовища?">
    OpenClaw читає env vars із батьківського процесу (shell, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` із поточного робочого каталогу
    - глобальний fallback `.env` із `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден із файлів `.env` не перевизначає наявні env vars.

    Ви також можете задати inline env vars у конфігурації (застосовуються лише якщо відсутні в env процесу):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Повний порядок пріоритету та джерела див. у [/environment](/uk/help/environment).

  </Accordion>

  <Accordion title="Я запустив Gateway через службу, і мої env vars зникли. Що тепер?">
    Два поширені виправлення:

    1. Помістіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися навіть тоді, коли служба не успадковує env вашої оболонки.
    2. Увімкніть імпорт оболонки (зручна опція за вибором):

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

    Це запускає вашу login shell і імпортує лише відсутні очікувані ключі (ніколи не перевизначає наявні). Еквіваленти env vars:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я встановив COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` повідомляє, чи ввімкнено **імпорт env з оболонки**. "Shell env: off"
    **не** означає, що ваших env vars немає — це лише означає, що OpenClaw не завантажуватиме
    вашу login shell автоматично.

    Якщо Gateway працює як служба (launchd/systemd), він не успадковує середовище
    вашої оболонки. Виправлення — зробити одне з цього:

    1. Помістити токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або ввімкнути імпорт оболонки (`env.shellEnv.enabled: true`).
    3. Або додати його в блок `env` конфігурації (застосовується лише якщо відсутній).

    Потім перезапустіть gateway і перевірте ще раз:

    ```bash
    openclaw models status
    ```

    Токени Copilot читаються з `COPILOT_GITHUB_TOKEN` (також `GH_TOKEN` / `GITHUB_TOKEN`).
    Див. [/concepts/model-providers](/uk/concepts/model-providers) і [/environment](/uk/help/environment).

  </Accordion>
</AccordionGroup>

## Сеанси та кілька чатів

<AccordionGroup>
  <Accordion title="Як почати нову розмову?">
    Надішліть `/new` або `/reset` окремим повідомленням. Див. [Керування сеансами](/uk/concepts/session).
  </Accordion>

  <Accordion title="Сеанси скидаються автоматично, якщо я ніколи не надсилаю /new?">
    Сеанси можуть завершуватися після `session.idleMinutes`, але це **вимкнено за замовчуванням** (типове значення **0**).
    Установіть додатне значення, щоб увімкнути завершення за бездіяльністю. Коли воно ввімкнене, **наступне**
    повідомлення після періоду бездіяльності починає новий session id для цього chat key.
    Це не видаляє транскрипти — просто починається новий сеанс.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб створити команду інстансів OpenClaw (один CEO і багато агентів)?">
    Так, через **маршрутизацію мультиагентів** і **sub-agents**. Ви можете створити одного координуючого
    агента і кількох робочих агентів із власними workspace та моделями.

    Водночас це краще сприймати як **цікавий експеримент**. Це дорого з погляду токенів і часто
    менш ефективно, ніж використовувати одного бота з окремими сеансами. Типова модель, яку ми
    уявляємо, — це один бот, з яким ви спілкуєтеся, з різними сеансами для паралельної роботи. Цей
    бот також може за потреби запускати sub-agents.

    Документація: [Маршрутизація мультиагентів](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст обрізався посеред завдання? Як цьому запобігти?">
    Контекст сеансу обмежений вікном моделі. Довгі чати, великі виводи інструментів або багато
    файлів можуть викликати compaction або truncation.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими завданнями та `/new` під час зміни тем.
    - Тримайте важливий контекст у workspace і просіть бота перечитувати його.
    - Використовуйте sub-agents для довгих або паралельних завдань, щоб основний чат залишався меншим.
    - Виберіть модель із більшим вікном контексту, якщо це трапляється часто.

  </Accordion>

  <Accordion title="Як повністю скинути OpenClaw, але зберегти встановлення?">
    Використовуйте команду reset:

    ```bash
    openclaw reset
    ```

    Неінтерактивне повне скидання:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Потім повторно виконайте налаштування:

    ```bash
    openclaw onboard --install-daemon
    ```

    Примітки:

    - Онбординг також пропонує **Reset**, якщо бачить наявну конфігурацію. Див. [Онбординг (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скидайте кожен каталог стану окремо (типово це `~/.openclaw-<profile>`).
    - Dev reset: `openclaw gateway --dev --reset` (лише для dev; стирає dev config + credentials + sessions + workspace).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або стиснути?'>
    Використовуйте один із цих варіантів:

    - **Compact** (зберігає розмову, але підсумовує старіші ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб спрямувати підсумок.

    - **Reset** (новий session ID для того самого chat key):

      ```
      /new
      /reset
      ```

    Якщо це повторюється:

    - Увімкніть або налаштуйте **обрізання сеансів** (`agents.defaults.contextPruning`), щоб прибирати старий вивід інструментів.
    - Використовуйте модель із більшим вікном контексту.

    Документація: [Compaction](/uk/concepts/compaction), [Обрізання сеансів](/uk/concepts/session-pruning), [Керування сеансами](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка валідації провайдера: модель видала блок `tool_use` без обов'язкового
    `input`. Зазвичай це означає, що історія сеансу застаріла або пошкоджена (часто після довгих thread
    або зміни tool/schema).

    Виправлення: почніть новий сеанс за допомогою `/new` (окреме повідомлення).

  </Accordion>

  <Accordion title="Чому я отримую heartbeat-повідомлення кожні 30 хвилин?">
    Heartbeats за замовчуванням запускаються кожні **30m** (**1h** при використанні OAuth auth). Налаштуйте або вимкніть їх:

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
    на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб заощадити API-виклики.
    Якщо файл відсутній, heartbeat усе одно запускається, і модель вирішує, що робити.

    Для override-ів на агента використовуйте `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "обліковий запис бота" до групи WhatsApp?'>
    Ні. OpenClaw працює на **вашому власному обліковому записі**, тож якщо ви є в групі, OpenClaw може її бачити.
    За замовчуванням відповіді в групах блокуються, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

    Якщо ви хочете, щоб лише **ви** могли запускати відповіді в групі:

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
    Варіант 1 (найшвидший): дивіться журнали в реальному часі й надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Шукайте `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/дозволено): перелічіть групи з конфігурації:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/cli/directory), [Журнали](/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Дві поширені причини:

    - Увімкнено перевірку згадок (типово). Ви маєте @згадати бота (або збігтися з `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і групи немає в allowlist.

    Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи ділять групи/thread-и контекст із DM?">
    Прямі чати за замовчуванням згортаються в основний сеанс. Групи/канали мають власні session keys, а теми Telegram / thread-и Discord — це окремі сеанси. Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки workspace і агентів я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — нормально, але слідкуйте за:

    - **Зростанням диска:** sessions + transcripts живуть у `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартістю токенів:** більше агентів означає більше одночасного використання моделей.
    - **Операційною складністю:** auth profiles, workspaces і channel routing на агента.

    Поради:

    - Тримайте один **активний** workspace на агента (`agents.defaults.workspace`).
    - Очищайте старі сеанси (видаляйте JSONL або записи сховища), якщо диск розростається.
    - Використовуйте `openclaw doctor`, щоб знаходити stray workspace і невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька ботів або чатів одночасно (Slack), і як це правильно налаштувати?">
    Так. Використовуйте **Маршрутизацію мультиагентів**, щоб запускати кілька ізольованих агентів і маршрутизувати вхідні повідомлення за
    каналом/обліковим записом/peer. Slack підтримується як канал і може бути прив'язаний до конкретних агентів.

    Доступ до браузера потужний, але це не рівнозначно "може робити все, що й людина" — антибот-захист, CAPTCHA і MFA
    усе ще можуть блокувати автоматизацію. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на host,
    або CDP на машині, де насправді запускається браузер.

    Найкращий шаблон налаштування:

    - Host Gateway, що завжди увімкнений (VPS/Mac mini).
    - Один агент на роль (bindings).
    - Канали Slack, прив'язані до цих агентів.
    - Локальний браузер через Chrome MCP або node за потреби.

    Документація: [Маршрутизація мультиагентів](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Браузер](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: значення за замовчуванням, вибір, аліаси, перемикання

<AccordionGroup>
  <Accordion title='Що таке