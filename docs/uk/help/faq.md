---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час виконання
    - Попередній розбір проблем, про які повідомили користувачі, перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-23T18:24:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: ffa69fef2b88175cc1ed1d2d587f355eb189a38b592af95571240501c15df4a6
    source_path: help/faq.md
    workflow: 15
---

# Поширені запитання

Швидкі відповіді та глибше усунення несправностей для реальних сценаріїв налаштування (локальна розробка, VPS, мультиагентність, OAuth/API-ключі, резервне перемикання моделей). Для діагностики під час виконання див. [Усунення несправностей](/uk/gateway/troubleshooting). Повний довідник із конфігурації див. у [Конфігурація](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламалося

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидкий локальний зведений звіт: ОС + оновлення, доступність gateway/сервісу, агенти/сесії, конфігурація провайдера + проблеми під час виконання (коли gateway доступний).

2. **Звіт, який можна вставити й поділитися ним (безпечний для поширення)**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з хвостом журналу (токени відредаговано).

3. **Стан демона + порту**

   ```bash
   openclaw gateway status
   ```

   Показує стан supervisor під час виконання порівняно з доступністю RPC, цільову URL-адресу перевірки та те, яку конфігурацію сервіс, імовірно, використовував.

4. **Глибокі перевірки**

   ```bash
   openclaw status --deep
   ```

   Виконує живу перевірку стану gateway, зокрема перевірки каналів, коли це підтримується
   (потрібен доступний gateway). Див. [Стан](/uk/gateway/health).

5. **Перегляд хвоста останнього журналу**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використайте запасний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові журнали відокремлені від журналів сервісу; див. [Журналювання](/uk/logging) та [Усунення несправностей](/uk/gateway/troubleshooting).

6. **Запуск doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує конфігурацію/стан + виконує перевірки стану. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # показує цільову URL-адресу + шлях до конфігурації при помилках
   ```

   Запитує в запущеного gateway повний знімок (лише WS). Див. [Стан](/uk/gateway/health).

## Швидкий старт і початкове налаштування

<AccordionGroup>
  <Accordion title="Я застряг, найшвидший спосіб зрушити з місця">
    Використовуйте локального AI-агента, який може **бачити вашу машину**. Це набагато ефективніше, ніж запитувати
    в Discord, тому що більшість випадків на кшталт «я застряг» — це **локальні проблеми конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти журнали та допомагати виправляти
    налаштування на рівні вашої машини (PATH, сервіси, дозволи, файли автентифікації). Надайте їм **повну вихідну копію** через
    зламний (git) спосіб встановлення:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **із git checkout**, тож агент може читати код + документацію та
    аналізувати точну версію, яку ви використовуєте. Ви завжди можете повернутися до стабільної версії пізніше,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати та супроводжувати** виправлення (крок за кроком), а потім виконати лише
    необхідні команди. Це робить зміни невеликими та спрощує аудит.

    Якщо ви виявите справжню помилку або виправлення, будь ласка, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (діліться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану gateway/агента + базова конфігурація.
    - `openclaw models status`: перевіряє автентифікацію провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє поширені проблеми конфігурації/стану.

    Інші корисні перевірки в CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламалося](#перші-60-секунд-якщо-щось-зламалося).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску Heartbeat:

    - `quiet-hours`: поза межами налаштованого вікна active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожню структуру або лише заголовки
    - `no-tasks-due`: режим завдань `HEARTBEAT.md` активний, але жоден з інтервалів завдань ще не настав
    - `alerts-disabled`: усю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові позначки настання оновлюються лише після завершення
    реального запуску heartbeat. Пропущені запуски не позначають завдання як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановлення та налаштування OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання онбордингу:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати UI-ресурси. Після онбордингу ви зазвичай запускаєте Gateway на порту **18789**.

    Із вихідного коду (контриб'ютори/розробники):

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

  <Accordion title="Як відкрити панель після онбордингу?">
    Майстер відкриває ваш браузер із чистою (без токенів) URL-адресою панелі одразу після онбордингу, а також виводить посилання в підсумку. Залиште цю вкладку відкритою; якщо вона не запустилася, скопіюйте/вставте надруковану URL-адресу на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати панель на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо система запитує автентифікацію за спільним секретом, вставте налаштований токен або пароль у налаштуваннях Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо спільний секрет ще не налаштовано, згенеруйте токен за допомогою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште прив'язку до loopback, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентифікації задовольняють автентифікацію Control UI/WebSocket (без вставлення спільного секрету, за умови довіреного хоста gateway); HTTP API, як і раніше, вимагають автентифікації за спільним секретом, якщо ви навмисно не використовуєте `none` для private-ingress або HTTP-автентифікацію trusted-proxy.
      Невдалі одночасні спроби автентифікації Serve від того самого клієнта серіалізуються до того, як обмежувач невдалих автентифікацій зафіксує їх, тож другий невдалий повтор уже може показати `retry later`.
    - **Прив'язка tailnet**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний спільний секрет у налаштуваннях панелі.
    - **Зворотний проксі з урахуванням ідентифікації**: тримайте Gateway за trusted-proxy без loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL-адресу проксі.
    - **SSH-тунель**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`. Автентифікація за спільним секретом усе ще застосовується через тунель; за потреби вставте налаштований токен або пароль.

    Див. [Панель](/uk/web/dashboard) і [Веб-поверхні](/uk/web) для режимів прив'язки та деталей автентифікації.

  </Accordion>

  <Accordion title="Чому існують дві конфігурації exec approval для chat approval?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на підтвердження до chat-призначень
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом підтвердження для exec approval

    Політика host exec усе ще є справжнім механізмом підтвердження. Конфігурація чату лише визначає, де з'являються
    запити на підтвердження і як люди можуть на них відповідати.

    У більшості конфігурацій вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди та відповіді, `/approve` у тому ж чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначити тих, хто підтверджує, OpenClaw тепер автоматично вмикає нативні підтвердження DM-first, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки підтвердження, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve` лише якщо результат інструмента каже, що chat approval недоступні або ручне підтвердження є єдиним шляхом.
    - Використовуйте `approvals.exec` лише тоді, коли запити також потрібно пересилати до інших чатів або спеціальних кімнат для операцій.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише тоді, коли ви явно хочете, щоб запити на підтвердження публікувалися назад у вихідну кімнату/тему.
    - Підтвердження Plugin знову ж таки окремі: вони типово використовують `/approve` у тому ж чаті, опціональне пересилання `approvals.plugin`, і лише деякі нативні канали додатково залишають нативну обробку plugin approval.

    Коротко: пересилання — для маршрутизації, конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке середовище виконання мені потрібне?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендується** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легковажний — у документації зазначено, що для персонального використання достатньо **512MB-1GB RAM**, **1 ядра** і приблизно **500MB**
    дискового простору, а також зазначено, що **Raspberry Pi 4 може його запускати**.

    Якщо вам потрібен додатковий запас ресурсів (журнали, медіа, інші сервіси), **рекомендується 2GB**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може розміщувати Gateway, а ви можете під'єднати **nodes** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради щодо встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте певних шорсткостей.

    - Використовуйте **64-bit** ОС і тримайте Node >= 22.
    - Віддавайте перевагу **зламному (git) встановленню**, щоб можна було бачити журнали й швидко оновлюватися.
    - Починайте без каналів/Skills, а потім додавайте їх по одному.
    - Якщо ви натрапили на дивні проблеми з бінарними файлами, зазвичай це проблема **сумісності ARM**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Воно зависло на wake up my friend / onboarding не завершується. Що тепер?">
    Цей екран залежить від того, чи доступний Gateway і чи пройдена автентифікація. TUI також автоматично надсилає
    "Wake up, my friend!" під час першого hatch. Якщо ви бачите цей рядок **без відповіді**
    і кількість токенів залишається 0, агент так і не запустився.

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

    3. Якщо це все ще зависає, виконайте:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що тунель/Tailscale-підключення активне і що UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini) без повторного онбордингу?">
    Так. Скопіюйте **каталог стану** і **робочу область**, а потім один раз запустіть Doctor. Це
    збереже вашого бота «точно таким самим» (пам'ять, історія сесій, автентифікація та стан
    каналу), якщо ви скопіюєте **обидва** розташування:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте вашу робочу область (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть сервіс Gateway.

    Це зберігає конфігурацію, профілі автентифікації, облікові дані WhatsApp, сесії та пам’ять. Якщо ви працюєте
    у віддаленому режимі, пам’ятайте, що хост gateway володіє сховищем сесій і робочою областю.

    **Важливо:** якщо ви лише комітите/надсилаєте свою робочу область на GitHub, ви створюєте
    резервну копію **пам’яті + bootstrap-файлів**, але **не** історії сесій або автентифікації. Вони зберігаються
    у `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Міграція](/uk/install/migrating), [Де що зберігається на диску](#де-що-зберігається-на-диску),
    [Робоча область агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи — вгорі. Якщо верхній розділ позначено як **Unreleased**, наступний датований
    розділ — це остання випущена версія. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (а також за розділами документації/іншими розділами, коли потрібно).

  </Accordion>

  <Accordion title="Не вдається отримати доступ до docs.openclaw.ai (помилка SSL)">
    Деякі з’єднання Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до allowlist, а потім спробуйте ще раз.
    Будь ласка, допоможіть нам розблокувати сайт, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркалюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable-реліз спочатку потрапляє в **beta**, а потім окремий
    крок просування переміщує ту саму версію в `latest`. Супровідники також можуть
    за потреби публікувати одразу в `latest`. Саме тому beta і stable можуть
    вказувати на **одну й ту саму версію** після просування.

    Подивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди для встановлення та різницю між beta і dev див. в accordion нижче.

  </Accordion>

  <Accordion title="Як встановити beta-версію і в чому різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (може збігатися з `latest` після просування).
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

  <Accordion title="Як спробувати найсвіжіші зміни?">
    Є два варіанти:

    1. **Dev channel (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає вас на гілку `main` і оновлює з вихідного коду.

    2. **Зламне встановлення (з сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає вам локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому ручному клонуванню, використовуйте:

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
    Приблизний орієнтир:

    - **Встановлення:** 2–5 хвилин
    - **Онбординг:** 5–15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо процес зависає, скористайтеся [Інсталятор завис?](#швидкий-старт-і-початкове-налаштування)
    і швидким циклом налагодження в [Я застряг](#швидкий-старт-і-початкове-налаштування).

  </Accordion>

  <Accordion title="Інсталятор завис? Як отримати більше зворотного зв’язку?">
    Повторно запустіть інсталятор із **докладним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Встановлення beta з докладним виводом:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Для зламного (git) встановлення:

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

    Більше варіантів: [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Під час встановлення на Windows система каже git not found або openclaw not recognized">
    Дві поширені проблеми в Windows:

    **1) npm-помилка spawn git / git not found**

    - Встановіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, а потім повторно запустіть інсталятор.

    **2) openclaw is not recognized після встановлення**

    - Ваша глобальна папка bin npm відсутня в PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до користувацького PATH (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо вам потрібне максимально гладке налаштування у Windows, використовуйте **WSL2** замість нативної Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У Windows вивід exec показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність кодової сторінки консолі в нативних оболонках Windows.

    Симптоми:

    - вивід `system.run`/`exec` показує китайський текст у вигляді «кракозябр»
    - та сама команда виглядає нормально в іншому профілі термінала

    Швидке обхідне рішення в PowerShell:

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

    Якщо ви все ще відтворюєте це на останній версії OpenClaw, відстежуйте/повідомляйте про це тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використовуйте **зламне (git) встановлення**, щоб локально мати повний вихідний код і документацію, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг прочитати репозиторій і дати точну відповідь.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтесь посібника для Linux, а потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення сервісу: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення та оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Встановіть систему на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де посібники зі встановлення в хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Виберіть одного й дотримуйтеся посібника:

    - [VPS-хостинг](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    з ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан + робоча область
    зберігаються на сервері, тому вважайте хост джерелом істини й створюйте його резервні копії.

    Ви можете під’єднати **nodes** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримати доступ
    до локального екрана/камери/canvas або запускати команди на своєму ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити себе самостійно?">
    Коротка відповідь: **можливо, але не рекомендовано**. Процес оновлення може перезапустити
    Gateway (що перерве активну сесію), може вимагати чистого git checkout і
    може запросити підтвердження. Безпечніше: запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо вам обов’язково потрібно автоматизувати це через агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/uk/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить онбординг?">
    `openclaw onboard` — це рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth провайдера, API-ключі, setup-token Anthropic, а також варіанти локальних моделей, такі як LM Studio)
    - Розташування **робочої області** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані channel plugins, як-от QQ Bot)
    - **Встановлення демона** (LaunchAgent на macOS; користувацький модуль systemd на Linux/WSL2)
    - **Перевірки стану** і вибір **Skills**

    Він також попереджає, якщо ваша налаштована модель невідома або для неї відсутня автентифікація.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це лише необов’язкові способи автентифікації в цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **API-ключ Anthropic**: звичайна тарифікація Anthropic API
    - **Автентифікація Claude CLI / підпискою Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway API-ключі Anthropic усе ще є більш
    передбачуваним варіантом налаштування. OAuth OpenAI Codex явно підтримується для зовнішніх
    інструментів на кшталт OpenClaw.

    OpenClaw також підтримує інші варіанти з підпискою на розміщені сервіси, зокрема
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
    OpenClaw вважає автентифікацію через підписку Claude та використання `claude -p` санкціонованими
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо вам потрібне
    найбільш передбачуване серверне налаштування, натомість використовуйте API-ключ Anthropic.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тож OpenClaw вважає
    повторне використання Claude CLI та використання `claude -p` санкціонованими для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    setup-token Anthropic як і раніше доступний як підтримуваний шлях токена OpenClaw, але тепер OpenClaw віддає перевагу повторному використанню Claude CLI та `claude -p`, коли це можливо.
    Для продакшену або багатокористувацьких навантажень автентифікація через API-ключ Anthropic усе ще є
    безпечнішим і передбачуванішим вибором. Якщо вам потрібні інші розміщені варіанти
    з підпискою в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [Моделі
    GLM](/uk/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
    Це означає, що вашу **квоту/ліміт запитів Anthropic** вичерпано для поточного вікна. Якщо ви
    використовуєте **Claude CLI**, зачекайте, поки вікно скинеться, або перейдіть на вищий тариф. Якщо ви
    використовуєте **API-ключ Anthropic**, перевірте Anthropic Console
    щодо використання/білінгу та за потреби підвищте ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, це означає, що запит намагається використати
    бета-версію контексту Anthropic 1M (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані мають право на білінг довгого контексту (білінг API-ключа або
    шлях входу Claude OpenClaw з увімкненим Extra Usage).

    Порада: налаштуйте **резервну модель**, щоб OpenClaw міг і далі відповідати, поки провайдер обмежений за лімітом запитів.
    Див. [Моделі](/uk/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудований провайдер **Amazon Bedrock (Converse)**. Якщо присутні маркери середовища AWS, OpenClaw може автоматично виявити каталог Bedrock для потокового/текстового режимів і об'єднати його як неявний провайдер `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний проксі перед Bedrock також залишається коректним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Онбординг може запустити потік OAuth і встановить модель за замовчуванням `openai-codex/gpt-5.4`, коли це доречно. Див. [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому ChatGPT GPT-5.4 не відкриває openai/gpt-5.4 в OpenClaw?">
    OpenClaw розглядає ці два маршрути окремо:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = прямий API OpenAI Platform

    В OpenClaw вхід ChatGPT/Codex прив’язаний до маршруту `openai-codex/*`,
    а не до прямого маршруту `openai/*`. Якщо ви хочете прямий шлях API в
    OpenClaw, задайте `OPENAI_API_KEY` (або еквівалентну конфігурацію провайдера OpenAI).
    Якщо ви хочете вхід ChatGPT/Codex в OpenClaw, використовуйте `openai-codex/*`.

  </Accordion>

  <Accordion title="Чому ліміти OAuth Codex можуть відрізнятися від ChatGPT web?">
    `openai-codex/*` використовує маршрут OAuth Codex, а його доступні вікна квот
    керуються OpenAI і залежать від тарифу. На практиці ці ліміти можуть відрізнятися від
    роботи на сайті/у застосунку ChatGPT, навіть якщо обидва прив’язані до одного облікового запису.

    OpenClaw може показувати поточні видимі вікна використання/квоти провайдера в
    `openclaw models status`, але він не вигадує й не нормалізує права доступу ChatGPT web
    до прямого доступу API. Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API-ключем.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth підписки OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання OAuth підписки в зовнішніх інструментах/робочих процесах
    на кшталт OpenClaw. Онбординг може запустити потік OAuth за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **потік автентифікації Plugin**, а не client id чи secret у `openclaw.json`.

    Кроки:

    1. Локально встановіть Gemini CLI, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Модель за замовчуванням після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити завершуються помилкою, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає токени OAuth у профілях автентифікації на хості gateway. Подробиці: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для звичайних чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; малі картки обрізають контекст і пропускають небажаний вміст. Якщо іншого варіанту немає, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як зберегти трафік розміщеної моделі в конкретному регіоні?">
    Вибирайте endpoint-и, прив’язані до регіону. OpenRouter надає варіанти, розміщені у США, для MiniMax, Kimi і GLM; виберіть варіант, розміщений у США, щоб дані залишалися в межах регіону. Ви все одно можете вказати поруч Anthropic/OpenAI, використовуючи `models.mode: "merge"`, щоб резервні варіанти лишалися доступними, водночас дотримуючись вибраного вами регіонального провайдера.
  </Accordion>

  <Accordion title="Чи обов’язково купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini — необов’язковий: деякі люди
    купують його як постійно увімкнений хост, але також підійде невеликий VPS, домашній сервер або пристрій класу Raspberry Pi.

    Mac потрібен лише **для інструментів лише для macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або будь-де ще. Якщо вам потрібні інші інструменти лише для macOS, запустіть Gateway на Mac або під’єднайте macOS Node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, на якому виконано вхід у Messages. Це **не обов’язково** має бути Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, тоді як Gateway може працювати на Linux або будь-де ще.

    Поширені варіанти налаштування:

    - Запустіть Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac із входом у Messages.
    - Запустіть усе на Mac, якщо вам потрібне найпростіше налаштування на одній машині.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи можу я під’єднати його до MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може під’єднатися як
    **Node** (додатковий пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, такі як screen/camera/canvas і `system.run` на цьому пристрої.

    Поширений сценарій:

    - Gateway на Mac mini (завжди увімкнений).
    - MacBook Pro запускає застосунок macOS або хост Node і під’єднується до Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендується**. Ми спостерігаємо помилки під час виконання, особливо з WhatsApp і Telegram.
    Для стабільних gateway використовуйте **Node**.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на gateway не для продакшену
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що має бути в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Під час налаштування запитуються лише числові user ID. Якщо у вашій конфігурації вже є застарілі записи `@username`, `openclaw doctor --fix` може спробувати їх розв’язати.

    Безпечніший варіант (без стороннього бота):

    - Напишіть вашому боту в особисті повідомлення, потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть вашому боту в особисті повідомлення, а потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Напишіть у приват `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **маршрутизацію мультиагентності**. Прив’яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, E.164 відправника на кшталт `+15551234567`) до різного `agentId`, щоб кожна людина мала власну робочу область і сховище сесій. Відповіді все одно надходитимуть з **того самого облікового запису WhatsApp**, а керування доступом DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Маршрутизація мультиагентності](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента для "швидкого чату" і агента "Opus для кодування"?'>
    Так. Використовуйте маршрутизацію мультиагентності: задайте кожному агенту власну модель за замовчуванням, а потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретні peers) до кожного агента. Приклад конфігурації наведено в [Маршрутизація мультиагентності](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, коректно знаходилися в non-login оболонках.
    Останні збірки також додають на початок типові користувацькі каталоги bin у сервісах Linux systemd (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо вони задані.

  </Accordion>

  <Accordion title="Різниця між зламним git-встановленням і npm install">
    - **Зламне (git) встановлення:** повний checkout вихідного коду, можна редагувати, найкраще для контриб’юторів.
      Ви локально запускаєте збірки й можете вносити зміни в код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію «просто запустити».
      Оновлення надходять із npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше переключатися між npm- і git-встановленням?">
    Так. Встановіть інший варіант, а потім запустіть Doctor, щоб сервіс gateway вказував на нову точку входу.
    Це **не видаляє ваші дані** — змінюється лише встановлення коду OpenClaw. Ваш стан
    (`~/.openclaw`) і робоча область (`~/.openclaw/workspace`) залишаються недоторканими.

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

    Doctor виявляє невідповідність точки входу сервісу gateway і пропонує переписати конфігурацію сервісу відповідно до поточного встановлення (використовуйте `--repair` в автоматизації).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#де-що-зберігається-на-диску).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо ви хочете
    мінімального тертя і вас влаштовують sleep/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Плюси:** немає витрат на сервер, прямий доступ до локальних файлів, видиме вікно браузера в реальному часі.
    - **Мінуси:** sleep/обриви мережі = відключення, оновлення ОС/перезавантаження переривають роботу, машина має залишатися активною.

    **VPS / хмара**

    - **Плюси:** завжди увімкнено, стабільна мережа, немає проблем зі sleep ноутбука, легше підтримувати безперервну роботу.
    - **Мінуси:** часто працює в headless-режимі (використовуйте скриншоти), лише віддалений доступ до файлів, для оновлень потрібен SSH.

    **Примітка щодо OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord — усе це чудово працює з VPS. Єдиний справжній компроміс — **headless browser** проти видимого вікна. Див. [Браузер](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо раніше у вас вже були відключення gateway. Локальний варіант чудово підходить, коли ви активно користуєтеся Mac і хочете мати доступ до локальних файлів або автоматизації UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Не обов’язково, але **рекомендується для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** завжди увімкнений, менше переривань через sleep/перезавантаження, чистіші дозволи, простіше підтримувати роботу.
    - **Спільний ноутбук/настільний комп’ютер:** цілком підходить для тестування й активного використання, але очікуйте пауз, коли машина переходить у sleep або оновлюється.

    Якщо ви хочете найкраще з обох світів, тримайте Gateway на виділеному хості, а ноутбук під’єднайте як **Node** для локальних інструментів screen/camera/exec. Див. [Nodes](/uk/nodes).
    Рекомендації з безпеки див. у [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яка ОС рекомендована?">
    OpenClaw легковажний. Для базового Gateway + одного чату-каналу:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1–2 vCPU, 2GB RAM або більше із запасом (журнали, медіа, кілька каналів). Інструменти Node і автоматизація браузера можуть споживати багато ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-яку сучасну Debian/Ubuntu). Шлях встановлення для Linux там протестовано найкраще.

    Документація: [Linux](/uk/platforms/linux), [VPS-хостинг](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди увімкненою, доступною й мати достатньо
    RAM для Gateway та будь-яких каналів, які ви вмикаєте.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера або медіаінструменти.
    - **ОС:** Ubuntu LTS або інша сучасна Debian/Ubuntu.

    Якщо ви на Windows, **WSL2 — це найпростіший варіант налаштування у стилі VM** і він має найкращу
    сумісність інструментів. Див. [Windows](/uk/platforms/windows), [VPS-хостинг](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw одним абзацом?">
    OpenClaw — це персональний AI-помічник, який ви запускаєте на власних пристроях. Він відповідає на поверхнях обміну повідомленнями, якими ви вже користуєтеся (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat і вбудовані channel plugins, як-от QQ Bot) і також може працювати з голосом + live Canvas на підтримуваних платформах. **Gateway** — це завжди увімкнена control plane; помічник — це сам продукт.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не «просто обгортка над Claude». Це **local-first control plane**, яка дає змогу запускати
    потужного помічника на **вашому власному обладнанні**, доступного з чат-застосунків, якими ви вже користуєтеся, зі
    станом сесій, пам’яттю та інструментами — без передавання контролю над вашими робочими процесами
    розміщеному SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і зберігайте
      робочу область + історію сесій локально.
    - **Реальні канали, а не веб-пісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      а також мобільний голос і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо, з маршрутизацією
      та резервним перемиканням на рівні агента.
    - **Лише локальний варіант:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо ви цього хочете.
    - **Маршрутизація мультиагентності:** окремі агенти для каналу, облікового запису або завдання, кожен із власною
      робочою областю та параметрами за замовчуванням.
    - **Відкритий код і можливість змін:** перевіряйте, розширюйте й самостійно розгортайте без прив’язки до вендора.

    Документація: [Gateway](/uk/gateway), [Канали](/uk/channels), [Мультиагентність](/uk/concepts/multi-agent),
    [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував — що мені зробити спочатку?">
    Гарні перші проєкти:

    - Створити вебсайт (WordPress, Shopify або простий статичний сайт).
    - Прототипувати мобільний застосунок (структура, екрани, план API).
    - Упорядкувати файли й папки (очищення, найменування, тегування).
    - Під’єднати Gmail і автоматизувати зведення або подальші дії.

    Він може впоратися з великими завданнями, але працює найкраще, коли ви розбиваєте їх на етапи
    і використовуєте субагентів для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найпоширеніших повсякденних сценаріїв використання OpenClaw?">
    Повсякденна користь зазвичай виглядає так:

    - **Персональні зведення:** підсумки пошти, календаря та важливих для вас новин.
    - **Дослідження й чернетки:** швидкі дослідження, підсумки та перші чернетки для листів або документів.
    - **Нагадування й подальші дії:** підказки та чеклісти на основі Cron або Heartbeat.
    - **Автоматизація браузера:** заповнення форм, збір даних і повторювані вебзавдання.
    - **Координація між пристроями:** надішліть завдання з телефона, дозвольте Gateway виконати його на сервері й отримайте результат назад у чаті.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з генерацією лідів, аутрічем, рекламою та блогами для SaaS?">
    Так — для **досліджень, кваліфікації та підготовки чернеток**. Він може сканувати сайти, створювати shortlists,
    підсумовувати потенційних клієнтів і писати чернетки аутрічу або рекламних текстів.

    Для **аутрічу або запуску реклами** залишайте людину в циклі. Уникайте спаму, дотримуйтеся місцевих законів і
    правил платформи та перевіряйте все перед відправленням. Найбезпечніший шаблон — дозволити
    OpenClaw підготувати чернетку, а вам — затвердити її.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний помічник** і рівень координації, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу кодування в репозиторії. Використовуйте OpenClaw, коли вам
    потрібні довготривала пам’ять, міжпристроєвий доступ і оркестрація інструментів.

    Переваги:

    - **Постійна пам’ять + робоча область** між сесіями
    - **Мультиплатформений доступ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (браузер, файли, планування, hooks)
    - **Завжди увімкнений Gateway** (запуск на VPS, взаємодія звідусіль)
    - **Nodes** для локальних browser/screen/camera/exec

    Вітрина: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills і автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати Skills, не забруднюючи репозиторій?">
    Використовуйте керовані перевизначення замість редагування копії в репозиторії. Помістіть свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`, тож керовані перевизначення все одно мають вищий пріоритет за вбудовані Skills, не торкаючись git. Якщо вам потрібно, щоб skill було встановлено глобально, але видно лише певним агентам, тримайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` та `agents.list[].skills`. Лише зміни, гідні внесення в апстрим, мають жити в репозиторії й надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати Skills з власної папки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий пріоритет: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`. `clawhub` типово встановлює в `./skills`, що OpenClaw розглядає як `<workspace>/skills` під час наступної сесії. Якщо skill має бути видимий лише певним агентам, поєднайте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як використовувати різні моделі для різних завдань?">
    Наразі підтримуються такі шаблони:

    - **Cron jobs**: ізольовані завдання можуть задавати перевизначення `model` для кожного завдання.
    - **Субагенти**: маршрутизуйте завдання до окремих агентів із різними моделями за замовчуванням.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб у будь-який момент змінити модель поточної сесії.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Маршрутизація мультиагентності](/uk/concepts/multi-agent) і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як це винести окремо?">
    Використовуйте **субагентів** для довгих або паралельних завдань. Субагенти працюють у власній сесії,
    повертають підсумок і зберігають чутливість вашого основного чату.

    Попросіть бота «створити субагента для цього завдання» або використовуйте `/subagents`.
    Використовуйте `/status` у чаті, щоб бачити, що Gateway робить просто зараз (і чи він зайнятий).

    Порада щодо токенів: довгі завдання й субагенти обидва витрачають токени. Якщо вас хвилює вартість, задайте
    дешевшу модель для субагентів через `agents.defaults.subagents.model`.

    Документація: [Субагенти](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють thread-bound сесії субагентів у Discord?">
    Використовуйте прив’язки потоків. Ви можете прив’язати потік Discord до субагента або цілі сесії, щоб подальші повідомлення в цьому потоці залишалися в межах цієї прив’язаної сесії.

    Базовий процес:

    - Створіть через `sessions_spawn` з `thread: true` (і за бажанням `mode: "session"` для постійних подальших повідомлень).
    - Або вручну прив’яжіть через `/focus <target>`.
    - Використовуйте `/agents`, щоб перевірити стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним зняттям фокуса.
    - Використовуйте `/unfocus`, щоб від’єднати потік.

    Потрібна конфігурація:

    - Глобальні параметри за замовчуванням: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Перевизначення Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоприв’язка під час створення: задайте `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Субагенти](/uk/tools/subagents), [Discord](/uk/channels/discord), [Довідник із конфігурації](/uk/gateway/configuration-reference), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Субагент завершив роботу, але повідомлення про завершення пішло не туди або взагалі не було надіслане. Що перевірити?">
    Спочатку перевірте розв’язаний маршрут запитувача:

    - Доставка субагента в режимі completion віддає перевагу будь-якому прив’язаному потоку або маршруту розмови, якщо такий існує.
    - Якщо джерело completion містить лише канал, OpenClaw повертається до збереженого маршруту сесії запитувача (`lastChannel` / `lastTo` / `lastAccountId`), щоб пряма доставка все ще могла спрацювати.
    - Якщо немає ані прив’язаного маршруту, ані придатного збереженого маршруту, пряма доставка може завершитися невдачею, і тоді результат повернеться до доставки через чергу сесії замість негайної публікації в чаті.
    - Недійсні або застарілі цілі все одно можуть змусити систему перейти до запасного варіанта з чергою або спричинити остаточний збій доставки.
    - Якщо остання видима відповідь помічника дитини — це точний тихий токен `NO_REPLY` / `no_reply` або рівно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує оголошення замість публікації застарілого попереднього прогресу.
    - Якщо дочірній процес завершився за тайм-аутом лише після викликів інструментів, оголошення може згорнути це в короткий підсумок часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Субагенти](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks), [Інструмент сесій](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron виконується всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання не запускатимуться.

    Контрольний список:

    - Підтвердьте, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не задано.
    - Переконайтеся, що Gateway працює 24/7 (без sleep/перезапусків).
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

    - `--no-deliver` / `delivery.mode: "none"` означає, що запасне надсилання runner не очікується.
    - Відсутня або недійсна ціль оголошення (`channel` / `to`) означає, що runner пропустив вихідну доставку.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що runner спробував виконати доставку, але облікові дані її заблокували.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` і більше нічого) вважається навмисно недоставним, тому runner також пригнічує запасну доставку через чергу.

    Для ізольованих cron jobs агент усе ще може надсилати напряму за допомогою інструмента `message`,
    коли доступний маршрут чату. `--announce` керує лише запасним шляхом runner
    для фінального тексту, який агент ще не надіслав самостійно.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований запуск cron змінив модель або один раз повторився?">
    Зазвичай це шлях живого перемикання моделі, а не дублювання розкладу.

    Ізольований cron може зберегти передачу моделі під час виконання та повторити спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає перемкненого
    провайдера/модель, а якщо перемикання також містило нове перевизначення профілю автентифікації, cron
    зберігає і його перед повтором.

    Пов’язані правила вибору:

    - Перевизначення моделі Gmail hook має найвищий пріоритет, коли застосовне.
    - Далі йде `model` для конкретного завдання.
    - Потім будь-яке збережене перевизначення моделі cron-session.
    - Потім звичайний вибір моделі агента/за замовчуванням.

    Цикл повторів обмежений. Після початкової спроби плюс 2 повторів через перемикання
    cron припиняє роботу замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [CLI cron](/uk/cli/cron).

  </Accordion>

  <Accordion title="Як встановити Skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або просто помістіть Skills у свою робочу область. UI Skills для macOS недоступний на Linux.
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
    активної робочої області. Окремий CLI `clawhub` встановлюйте лише якщо хочете публікувати або
    синхронізувати власні Skills. Для спільних встановлень між агентами розміщуйте skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете звузити коло агентів, які можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати завдання за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Cron jobs** для запланованих або повторюваних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок «основної сесії».
    - **Ізольовані завдання** для автономних агентів, які публікують підсумки або доставляють їх у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати Apple Skills лише для macOS з Linux?">
    Не напряму. Skills для macOS обмежуються через `metadata.openclaw.os` плюс потрібні бінарні файли, і Skills з’являються в системному prompt лише тоді, коли вони придатні на **хості Gateway**. На Linux Skills лише для `darwin` (як-от `apple-notes`, `apple-reminders`, `things-mac`) не завантажаться, якщо ви не перевизначите це обмеження.

    У вас є три підтримувані шаблони:

    **Варіант A — запустити Gateway на Mac (найпростіше).**
    Запустіть Gateway там, де існують бінарні файли macOS, а потім підключайтеся з Linux у [віддаленому режимі](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажаться нормально, тому що хост Gateway — це macOS.

    **Варіант B — використовувати macOS Node (без SSH).**
    Запустіть Gateway на Linux, під’єднайте macOS Node (застосунок у рядку меню) і задайте **Node Run Commands** як «Always Ask» або «Always Allow» на Mac. OpenClaw може вважати Skills лише для macOS придатними, коли потрібні бінарні файли є на Node. Агент запускає ці Skills через інструмент `nodes`. Якщо ви виберете «Always Ask», затвердження «Always Allow» у запиті додає цю команду до allowlist.

    **Варіант C — проксіювання бінарних файлів macOS через SSH (просунуто).**
    Залиште Gateway на Linux, але зробіть так, щоб потрібні CLI-бінарні файли розв’язувалися в SSH-обгортки, які запускаються на Mac. Потім перевизначте skill, щоб дозволити Linux і зберегти його придатним.

    1. Створіть SSH-обгортку для бінарного файла (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Помістіть обгортку в `PATH` на хості Linux (наприклад, `~/bin/memo`).
    3. Перевизначте метадані skill (робоча область або `~/.openclaw/skills`), щоб дозволити Linux:

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
    Наразі вбудованої немає.

    Варіанти:

    - **Власний skill / Plugin:** найкращий варіант для надійного доступу через API (і в Notion, і в HeyGen є API).
    - **Автоматизація браузера:** працює без коду, але повільніше й більш крихко.

    Якщо ви хочете зберігати контекст окремо для кожного клієнта (агентські робочі процеси), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + налаштування + активна робота).
    - Попросіть агента отримувати цю сторінку на початку сесії.

    Якщо вам потрібна нативна інтеграція, відкрийте запит на нову можливість або створіть skill
    для цих API.

    Встановлення Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активної робочої області. Для спільних Skills між агентами розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі агенти, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі Skills очікують наявності бінарних файлів, встановлених через Homebrew; на Linux це означає Linuxbrew (див. запис FAQ про Homebrew на Linux вище). Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати вже авторизований Chrome з OpenClaw?">
    Використовуйте вбудований профіль браузера `user`, який під’єднується через Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Якщо вам потрібна власна назва, створіть явний MCP-профіль:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Цей шлях може використовувати локальний браузер хоста або під’єднаний browser Node. Якщо Gateway працює деінде, або запустіть хост Node на машині з браузером, або використовуйте віддалений CDP.

    Поточні обмеження `existing-session` / `user`:

    - дії прив’язані до `ref`, а не до CSS-селекторів
    - вивантаження файлів потребує `ref` / `inputRef` і наразі підтримує лише один файл за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії все ще потребують керованого браузера або сирого CDP-профілю

  </Accordion>
</AccordionGroup>

## Sandboxing і пам’ять

<AccordionGroup>
  <Accordion title="Чи є окремий документ про sandboxing?">
    Так. Див. [Sandboxing](/uk/gateway/sandboxing). Для налаштування, специфічного для Docker (повний gateway у Docker або sandbox-образи), див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повні можливості?">
    Образ за замовчуванням має пріоритет безпеки й запускається від користувача `node`, тому не
    містить системних пакетів, Homebrew або вбудованих браузерів. Для повнішого налаштування:

    - Зберігайте `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші не втрачалися.
    - Вбудовуйте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Встановлюйте браузери Playwright через вбудований CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Задайте `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я зберегти приватність DM, але зробити групи публічними/ізольованими з одним агентом?">
    Так — якщо ваш приватний трафік це **DM**, а публічний трафік це **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб групові/канальні сесії (ключі не-main) працювали у налаштованому sandbox-бекенді, тоді як головна DM-сесія залишалася на хості. Docker є бекендом за замовчуванням, якщо ви не виберете інший. Потім обмежте інструменти, доступні в ізольованих сесіях, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: приватні DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Довідка з ключової конфігурації: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати папку хоста до sandbox?">
    Задайте `agents.defaults.sandbox.docker.binds` як `["host:path:mode"]` (наприклад, `"/home/user/src:/src:ro"`). Глобальні прив’язки й прив’язки на рівні агента об’єднуються; прив’язки на рівні агента ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого й пам’ятайте, що прив’язки обходять файлові стіни sandbox.

    OpenClaw перевіряє джерела bind і за нормалізованим шляхом, і за канонічним шляхом, розв’язаним через найглибшого наявного предка. Це означає, що виходи через батьківський symlink усе одно блокуються за принципом fail closed, навіть коли останній сегмент шляху ще не існує, а перевірки allowed-root усе одно застосовуються після розв’язання symlink.

    Приклади та примітки щодо безпеки див. в [Sandboxing](/uk/gateway/sandboxing#custom-bind-mounts) і [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Як працює пам’ять?">
    Пам’ять OpenClaw — це просто Markdown-файли в робочій області агента:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Кураторські довгострокові нотатки в `MEMORY.md` (лише для main/private-сесій)

    OpenClaw також виконує **тихий попередній скид пам’яті перед Compaction**, щоб нагадати моделі
    записати стійкі нотатки перед автоматичним стисненням. Це виконується лише тоді, коли робоча область
    доступна для запису (sandbox-и лише для читання це пропускають). Див. [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Пам’ять постійно щось забуває. Як зробити так, щоб це зберігалося?">
    Попросіть бота **записати факт у пам’ять**. Довгострокові нотатки мають зберігатися в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще напрям, який ми покращуємо. Корисно нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона все одно забуває, перевірте, чи Gateway використовує ту саму
    робочу область під час кожного запуску.

    Документація: [Пам’ять](/uk/concepts/memory), [Робоча область агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається пам’ять назавжди? Які є обмеження?">
    Файли пам’яті зберігаються на диску й залишаються там, доки ви їх не видалите. Обмеженням є ваше
    сховище, а не модель. **Контекст сесії** все одно обмежений вікном контексту
    моделі, тому довгі розмови можуть стискатися або обрізатися. Саме тому
    існує пошук у пам’яті — він повертає в контекст лише релевантні частини.

    Документація: [Пам’ять](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потрібен для семантичного пошуку в пам’яті API-ключ OpenAI?">
    Лише якщо ви використовуєте **ембедінги OpenAI**. OAuth Codex покриває chat/completions і
    **не** надає доступу до ембедінгів, тому **вхід через Codex (OAuth або
    вхід через Codex CLI)** не допомагає для семантичного пошуку в пам’яті. Ембедінги OpenAI
    усе ще потребують справжнього API-ключа (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви явно не задаєте провайдера, OpenClaw автоматично вибирає провайдера, коли
    може знайти API-ключ (профілі автентифікації, `models.providers.*.apiKey` або змінні середовища).
    Він надає перевагу OpenAI, якщо знаходиться ключ OpenAI, інакше Gemini, якщо знаходиться ключ Gemini,
    потім Voyage, потім Mistral. Якщо віддалений ключ недоступний, пошук у пам’яті
    залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштовано й доступний шлях до локальної моделі, OpenClaw
    надає перевагу `local`. Ollama підтримується, якщо ви явно задасте
    `memorySearch.provider = "ollama"`.

    Якщо ви віддаєте перевагу локальному варіанту, задайте `memorySearch.provider = "local"` (і за бажанням
    `memorySearch.fallback = "none"`). Якщо вам потрібні ембедінги Gemini, задайте
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо моделі ембедінгів **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    подробиці налаштування див. в [Пам’ять](/uk/concepts/memory).

  </Accordion>
</AccordionGroup>

## Де що зберігається на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, які використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** сесії, файли пам’яті, конфігурація та робоча область зберігаються на хості Gateway
      (`~/.openclaw` + каталог вашої робочої області).
    - **Віддалено за потребою:** повідомлення, які ви надсилаєте провайдерам моделей (Anthropic/OpenAI тощо), потрапляють до
      їхніх API, а чат-платформи (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на
      своїх серверах.
    - **Ви контролюєте слід:** використання локальних моделей залишає prompt-и на вашій машині, але трафік
      каналів усе одно проходить через сервери відповідного каналу.

    Пов’язане: [Робоча область агента](/uk/concepts/agent-workspace), [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе зберігається в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Path                                                            | Призначення                                                        |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основна конфігурація (JSON5)                                       |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Застарілий імпорт OAuth (копіюється в профілі автентифікації під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Профілі автентифікації (OAuth, API-ключі та опціональні `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язкове файлове сховище секретів для провайдерів `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Файл застарілої сумісності (статичні записи `api_key` очищаються)  |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдерів (наприклад, `whatsapp/<accountId>/creds.json`)    |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан на рівні агента (agentDir + сесії)                            |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (для кожного агента)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані сесій (для кожного агента)                                |

    Застарілий шлях для одного агента: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`).

    Ваша **робоча область** (`AGENTS.md`, файли пам’яті, Skills тощо) зберігається окремо й налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають зберігатися AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли зберігаються в **робочій області агента**, а не в `~/.openclaw`.

    - **Робоча область (для кожного агента):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, опціонально `HEARTBEAT.md`.
      `memory.md` у нижньому регістрі в корені — це лише вхід для виправлення застарілих даних; `openclaw doctor --fix`
      може об’єднати його в `MEMORY.md`, коли існують обидва файли.
    - **Каталог стану (`~/.openclaw`)**: конфігурація, стан каналів/провайдерів, профілі автентифікації, сесії, журнали
      та спільні Skills (`~/.openclaw/skills`).

    Робоча область за замовчуванням — `~/.openclaw/workspace`, її можна налаштувати через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот «забуває» після перезапуску, переконайтеся, що Gateway використовує ту саму
    робочу область під час кожного запуску (і пам’ятайте: у віддаленому режимі використовується **робоча область хоста gateway**,
    а не вашого локального ноутбука).

    Порада: якщо вам потрібна стійка поведінка або вподобання, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладайтеся на історію чату.

    Див. [Робоча область агента](/uk/concepts/agent-workspace) і [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Помістіть свою **робочу область агента** у **приватний** git-репозиторій і створюйте її резервні копії десь
    у приватному місці (наприклад, у приватному GitHub). Це зберігає пам’ять + файли AGENTS/SOUL/USER
    і дає змогу пізніше відновити «свідомість» помічника.

    **Не** комітьте нічого з `~/.openclaw` (облікові дані, сесії, токени або зашифровані payload-и секретів).
    Якщо вам потрібне повне відновлення, окремо створюйте резервні копії і робочої області, і каталогу стану
    (див. запитання про міграцію вище).

    Документація: [Робоча область агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окремий посібник: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть агенти працювати поза робочою областю?">
    Так. Робоча область — це **cwd за замовчуванням** і якір пам’яті, а не жорсткий sandbox.
    Відносні шляхи розв’язуються всередині робочої області, але абсолютні шляхи можуть отримувати доступ до інших
    розташувань хоста, якщо sandboxing не ввімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування sandbox на рівні агента. Якщо ви
    хочете, щоб репозиторій був робочим каталогом за замовчуванням, вкажіть для цього агента
    `workspace` на корінь репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
    робочу область окремо, якщо тільки ви свідомо не хочете, щоб агент працював усередині нього.

    Приклад (репозиторій як cwd за замовчуванням):

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

  <Accordion title="Віддалений режим: де зберігається сховище сесій?">
    Станом сесій володіє **хост gateway**. Якщо ви працюєте у віддаленому режимі, потрібне вам сховище сесій знаходиться на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="Який формат конфігурації? Де вона знаходиться?">
    OpenClaw читає необов’язкову конфігурацію **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються відносно безпечні значення за замовчуванням (зокрема робоча область за замовчуванням `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я задав gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Прив’язки не-loopback **потребують дійсного шляху автентифікації gateway**. На практиці це означає:

    - автентифікація за спільним секретом: токен або пароль
    - `gateway.auth.mode: "trusted-proxy"` за правильно налаштованим identity-aware reverse proxy без loopback

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
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як запасний варіант лише коли `gateway.auth.*` не задано.
    - Для автентифікації за паролем задайте натомість `gateway.auth.mode: "password"` плюс `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef, але не розв’язано, розв’язання завершується за принципом fail closed (без маскування запасним варіантом remote).
    - Конфігурації Control UI зі спільним секретом проходять автентифікацію через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях застосунку/UI). Режими з ідентифікацією, такі як Tailscale Serve або `trusted-proxy`, натомість використовують заголовки запиту. Уникайте розміщення спільних секретів у URL.
    - З `gateway.auth.mode: "trusted-proxy"` reverse proxy з loopback на тому самому хості все одно **не** задовольняють trusted-proxy auth. Trusted proxy має бути налаштованим джерелом без loopback.

  </Accordion>

  <Accordion title="Чому тепер на localhost потрібен токен?">
    OpenClaw типово примусово вимагає автентифікацію gateway, включно з loopback. У звичайному типового сценарії це означає автентифікацію токеном: якщо явний шлях автентифікації не налаштовано, запуск gateway переходить у режим токена й автоматично генерує його, зберігаючи в `gateway.auth.token`, тож **локальні WS-клієнти мають проходити автентифікацію**. Це блокує іншим локальним процесам виклики Gateway.

    Якщо ви віддаєте перевагу іншому шляху автентифікації, можете явно вибрати режим пароля (або, для identity-aware reverse proxy без loopback, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно задайте `gateway.auth.mode: "none"` у своїй конфігурації. Doctor може згенерувати токен для вас у будь-який момент: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни конфігурації?">
    Gateway відстежує конфігурацію та підтримує гаряче перезавантаження:

    - `gateway.reload.mode: "hybrid"` (типово): безпечно застосовує зміни на льоту, перезапускається для критичних змін
    - також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні підзаголовки в CLI?">
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

    - `off`: приховує текст підзаголовка, але зберігає рядок назви/версії банера.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: обертові кумедні/сезонні підзаголовки (поведінка за замовчуванням).
    - Якщо ви не хочете банера взагалі, задайте змінну середовища `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути вебпошук (і web fetch)?">
    `web_fetch` працює без API-ключа. `web_search` залежить від вибраного
    провайдера:

    - Провайдери на основі API, такі як Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, потребують звичайного налаштування API-ключа.
    - Ollama Web Search не потребує ключа, але використовує налаштований хост Ollama й вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна інтеграція на основі HTML.
    - SearXNG не потребує ключа/є самостійно розгорнутим; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

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
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    Конфігурація вебпошуку для конкретного провайдера тепер зберігається в `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи провайдерів `tools.web.search.*` усе ще тимчасово завантажуються для сумісності, але їх не слід використовувати для нових конфігурацій.
    Конфігурація запасного варіанта web-fetch Firecrawl зберігається в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlist, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнено за замовчуванням (якщо його явно не вимкнено).
    - Якщо `tools.web.fetch.provider` пропущено, OpenClaw автоматично визначає першого готового провайдера запасного варіанта fetch на основі доступних облікових даних. Наразі вбудованим провайдером є Firecrawl.
    - Демони читають змінні середовища з `~/.openclaw/.env` (або із середовища сервісу).

    Документація: [Вебінструменти](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мою конфігурацію. Як відновитися і як цього уникнути?">
    `config.apply` замінює **всю конфігурацію цілком**. Якщо ви надсилаєте частковий об’єкт, усе
    інше буде видалено.

    Поточний OpenClaw захищає від багатьох випадкових перезаписів:

    - Записи конфігурації, керовані OpenClaw, перевіряють повну конфігурацію після змін перед записом.
    - Недійсні або руйнівні записи, керовані OpenClaw, відхиляються й зберігаються як `openclaw.json.rejected.*`.
    - Якщо пряме редагування ламає запуск або гаряче перезавантаження, Gateway відновлює останню відому справну конфігурацію й зберігає відхилений файл як `openclaw.json.clobbered.*`.
    - Після відновлення основний агент отримує попередження під час запуску, щоб він не перезаписав погану конфігурацію знову навмання.

    Відновлення:

    - Перевірте `openclaw logs --follow` на наявність `Config auto-restored from last-known-good`, `Config write rejected:` або `config reload restored last-known-good config`.
    - Перегляньте найновіший `openclaw.json.clobbered.*` або `openclaw.json.rejected.*` поруч з активною конфігурацією.
    - Якщо відновлена активна конфігурація працює, залиште її, а потім поверніть лише потрібні ключі через `openclaw config set` або `config.patch`.
    - Запустіть `openclaw config validate` і `openclaw doctor`.
    - Якщо у вас немає останньої відомої справної конфігурації або відхиленого payload, відновіть із резервної копії або повторно запустіть `openclaw doctor` і заново налаштуйте канали/моделі.
    - Якщо це було неочікувано, створіть bug report і додайте свою останню відому конфігурацію або будь-яку резервну копію.
    - Локальний агент для кодування часто може відновити робочу конфігурацію з журналів або історії.

    Як уникнути цього:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Спочатку використовуйте `config.schema.lookup`, якщо не впевнені щодо точного шляху або форми поля; він повертає вузол поверхневої схеми та зведення безпосередніх дочірніх елементів для подальшого заглиблення.
    - Використовуйте `config.patch` для часткових RPC-редагувань; залишайте `config.apply` лише для повної заміни конфігурації.
    - Якщо ви використовуєте owner-only інструмент `gateway` з запуску агента, він усе одно відхилятиме записи в `tools.exec.ask` / `tools.exec.security` (включно із застарілими псевдонімами `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Конфігурація](/uk/cli/config), [Налаштування](/uk/cli/configure), [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими worker-ами на різних пристроях?">
    Поширений шаблон — це **один Gateway** (наприклад, Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** володіє каналами (Signal/WhatsApp), маршрутизацією та сесіями.
    - **Nodes (пристрої):** Mac/iOS/Android під’єднуються як периферія й надають локальні інструменти (`system.run`, `canvas`, `camera`).
    - **Agents (worker-и):** окремі brain/workspace для спеціалізованих ролей (наприклад, «Hetzner ops», «Personal data»).
    - **Субагенти:** запускають фонову роботу з основного агента, коли потрібен паралелізм.
    - **TUI:** під’єднується до Gateway і перемикає агентів/сесії.

    Документація: [Nodes](/uk/nodes), [Віддалений доступ](/uk/gateway/remote), [Маршрутизація мультиагентності](/uk/concepts/multi-agent), [Субагенти](/uk/tools/subagents), [TUI](/uk/web/tui).

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

    Значення за замовчуванням — `false` (headful). Headless-режим частіше викликає anti-bot перевірки на деяких сайтах. Див. [Браузер](/uk/tools/browser).

    Headless використовує **той самий рушій Chromium** і працює для більшості сценаріїв автоматизації (форми, кліки, скрейпінг, входи). Основні відмінності:

    - Немає видимого вікна браузера (використовуйте скриншоти, якщо вам потрібне візуальне підтвердження).
    - Деякі сайти суворіше ставляться до автоматизації в headless-режимі (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує headless-сесії.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Задайте `browser.executablePath` на ваш бінарний файл Brave (або будь-який браузер на базі Chromium) і перезапустіть Gateway.
    Повні приклади конфігурації див. в [Браузер](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway і nodes

<AccordionGroup>
  <Accordion title="Як команди поширюються між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає агента і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен інструмент node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідний трафік провайдерів; вони отримують лише виклики node RPC.

  </Accordion>

  <Accordion title="Як мій агент може отримати доступ до мого комп’ютера, якщо Gateway розміщено віддалено?">
    Коротка відповідь: **під’єднайте свій комп’ютер як node**. Gateway працює деінде, але він може
    викликати інструменти `node.*` (screen, camera, system) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на хості, який завжди увімкнений (VPS/домашній сервер).
    2. Підключіть хост Gateway і ваш комп’ютер до однієї tailnet.
    3. Переконайтеся, що Gateway WS доступний (tailnet bind або SSH-тунель).
    4. Локально відкрийте застосунок macOS і підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як node.
    5. Підтвердьте node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP-міст не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування щодо безпеки: прив’язка macOS node дозволяє `system.run` на цій машині. Під’єднуйте
    лише пристрої, яким довіряєте, і перегляньте [Безпека](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Протокол Gateway](/uk/gateway/protocol), [Віддалений режим macOS](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключено, але я не отримую відповідей. Що тепер?">
    Перевірте базові речі:

    - Gateway працює: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан каналів: `openclaw channels status`

    Потім перевірте автентифікацію та маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` задано правильно.
    - Якщо ви підключаєтеся через SSH-тунель, переконайтеся, що локальний тунель активний і вказує на правильний порт.
    - Переконайтеся, що ваші allowlist-и (DM або група) містять ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Канали](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два екземпляри OpenClaw спілкуватися між собою (локальний + VPS)?">
    Так. Вбудованого мосту «bot-to-bot» немає, але це можна налаштувати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний чат-канал, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надішле повідомлення Bot B, а потім Bot B відповість як зазвичай.

    **Міст через CLI (загальний варіант):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючись на чат, який слухає інший бот.
    Якщо один бот працює на віддаленому VPS, налаштуйте ваш CLI на цей віддалений Gateway
    через SSH/Tailscale (див. [Віддалений доступ](/uk/gateway/remote)).

    Приклад шаблону (виконується на машині, яка може досягти цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте запобіжник, щоб два боти не зациклилися в нескінченному обміні відповідями (лише згадки, allowlist-и каналів або правило «не відповідати на повідомлення ботів»).

    Документація: [Віддалений доступ](/uk/gateway/remote), [CLI агента](/uk/cli/agent), [Надсилання агентом](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох агентів?">
    Ні. Один Gateway може розміщувати кількох агентів, кожен із власною робочою областю, моделями за замовчуванням
    та маршрутизацією. Це нормальне налаштування, і воно набагато дешевше та простіше, ніж запускати
    один VPS на агента.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні конфігурації, які ви не хочете спільно використовувати. В інших випадках тримайте один Gateway і
    використовуйте кількох агентів або субагентів.

  </Accordion>

  <Accordion title="Чи є користь від використання node на моєму особистому ноутбуці замість SSH з VPS?">
    Так — nodes є основним способом доступу до вашого ноутбука з віддаленого Gateway, і вони
    дають більше, ніж просто доступ до оболонки. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легковажним (невеликий VPS або пристрій класу Raspberry Pi цілком підходить; 4 GB RAM більш ніж достатньо), тож поширене
    налаштування — це завжди увімкнений хост плюс ваш ноутбук як node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують pairing пристроїв.
    - **Безпечніший контроль виконання.** `system.run` контролюється allowlist-ами/підтвердженнями node на цьому ноутбуці.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна автоматизація браузера.** Тримайте Gateway на VPS, але запускайте Chrome локально через хост node на ноутбуці або підключайтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для разового доступу до оболонки, але nodes простіші для постійних робочих процесів агента й
    автоматизації пристрою.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes сервіс gateway?">
    Ні. На одному хості має працювати лише **один gateway**, якщо тільки ви свідомо не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)). Nodes — це периферійні компоненти, які підключаються
    до gateway (nodes iOS/Android або macOS «режим node» у застосунку рядка меню). Для headless-хостів node
    і керування через CLI див. [CLI хоста Node](/uk/cli/node).

    Для змін `gateway`, `discovery` і `canvasHost` потрібен повний перезапуск.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати конфігурацію?">
    Так.

    - `config.schema.lookup`: перевіряє одне піддерево конфігурації з його вузлом поверхневої схеми, відповідною UI-підказкою та зведеннями безпосередніх дочірніх елементів перед записом
    - `config.get`: отримує поточний знімок + hash
    - `config.patch`: безпечне часткове оновлення (рекомендовано для більшості RPC-редагувань); гаряче перезавантажує, коли це можливо, і перезапускає, коли потрібно
    - `config.apply`: перевіряє й замінює всю конфігурацію; гаряче перезавантажує, коли це можливо, і перезапускає, коли потрібно
    - owner-only runtime-інструмент `gateway` усе ще відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

  </Accordion>

  <Accordion title="Мінімальна розумна конфігурація для першого встановлення">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Це задає вашу робочу область і обмежує, хто може запускати бота.

  </Accordion>

  <Accordion title="Як налаштувати Tailscale на VPS і підключитися з Mac?">
    Мінімальні кроки:

    1. **Встановіть + увійдіть на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Встановіть + увійдіть на своєму Mac**
       - Використайте застосунок Tailscale і увійдіть у ту саму tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - У консолі адміністратора Tailscale увімкніть MagicDNS, щоб VPS мав стабільне ім’я.
    4. **Використовуйте hostname tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо ви хочете Control UI без SSH, використовуйте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив’язаним до loopback і надає HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як під’єднати Mac node до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Gateway Control UI + WS**. Nodes підключаються через ту саму кінцеву точку Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS + Mac знаходяться в одній tailnet**.
    2. **Використовуйте застосунок macOS у віддаленому режимі** (ціллю SSH може бути hostname tailnet).
       Застосунок тунелюватиме порт Gateway і підключиться як node.
    3. **Підтвердьте node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Протокол Gateway](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [Віддалений режим macOS](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи варто встановлювати систему на другий ноутбук чи просто додати node?">
    Якщо вам потрібні лише **локальні інструменти** (screen/camera/exec) на другому ноутбуці, додайте його як
    **node**. Це дозволяє зберегти один Gateway і уникнути дублювання конфігурації. Локальні інструменти node
    зараз доступні лише на macOS, але ми плануємо поширити їх і на інші ОС.

    Встановлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes), [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars і завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує змінні середовища?">
    OpenClaw читає env vars з батьківського процесу (оболонка, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного робочого каталогу
    - глобальний запасний `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден `.env`-файл не перевизначає вже наявні env vars.

    Ви також можете визначити inline env vars у конфігурації (застосовуються лише якщо їх немає в env процесу):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Повний порядок пріоритету та джерела див. в [/environment](/uk/help/environment).

  </Accordion>

  <Accordion title="Я запустив Gateway через сервіс, і мої env vars зникли. Що тепер?">
    Є два поширені виправлення:

    1. Помістіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися, навіть коли сервіс не успадковує env вашої оболонки.
    2. Увімкніть імпорт оболонки (зручність за opt-in):

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

    Це запускає вашу login shell і імпортує лише відсутні очікувані ключі (ніколи не перевизначає). Еквіваленти через env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я задав COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` повідомляє, чи ввімкнено **імпорт shell env**. "Shell env: off"
    **не** означає, що ваших env vars немає — це лише означає, що OpenClaw не завантажуватиме
    вашу login shell автоматично.

    Якщо Gateway працює як сервіс (launchd/systemd), він не успадковує середовище
    вашої оболонки. Виправити це можна одним із таких способів:

    1. Помістіть токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або ввімкніть імпорт оболонки (`env.shellEnv.enabled: true`).
    3. Або додайте його в блок `env` вашої конфігурації (застосовується лише якщо відсутній).

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

  <Accordion title="Чи сесії скидаються автоматично, якщо я ніколи не надсилаю /new?">
    Сесії можуть завершуватися після `session.idleMinutes`, але за замовчуванням це **вимкнено** (типове значення **0**).
    Задайте додатне значення, щоб увімкнути завершення за простоєм. Коли це ввімкнено, **наступне**
    повідомлення після періоду простою починає новий session id для цього ключа чату.
    Це не видаляє транскрипти — лише починає нову сесію.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб створити команду екземплярів OpenClaw (один CEO і багато агентів)?">
    Так, через **маршрутизацію мультиагентності** та **субагентів**. Ви можете створити одного координуючого
    агента і кількох робочих агентів із власними робочими областями та моделями.

    Втім, це краще розглядати як **цікавий експеримент**. Це сильно витрачає токени й часто
    менш ефективно, ніж використання одного бота з окремими сесіями. Типова модель, яку ми
    уявляємо, — це один бот, з яким ви спілкуєтеся, але з різними сесіями для паралельної роботи. Цей
    бот також може за потреби запускати субагентів.

    Документація: [Маршрутизація мультиагентності](/uk/concepts/multi-agent), [Субагенти](/uk/tools/subagents), [CLI агентів](/uk/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст обрізався посеред завдання? Як цьому запобігти?">
    Контекст сесії обмежений вікном моделі. Довгі чати, великі виводи інструментів або багато
    файлів можуть викликати стиснення або обрізання.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими завданнями, а `/new` — коли перемикаєте тему.
    - Зберігайте важливий контекст у робочій області й просіть бота перечитувати його.
    - Використовуйте субагентів для довгої або паралельної роботи, щоб основний чат залишався меншим.
    - Виберіть модель із більшим вікном контексту, якщо це часто трапляється.

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

    - Онбординг також пропонує **Reset**, якщо бачить наявну конфігурацію. Див. [Онбординг (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен каталог стану (типово це `~/.openclaw-<profile>`).
    - Скидання для dev: `openclaw gateway --dev --reset` (лише для dev; стирає конфігурацію dev + облікові дані + сесії + робочу область).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або стиснути?'>
    Використовуйте один із цих варіантів:

    - **Стиснути** (зберігає розмову, але підсумовує старіші повідомлення):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб спрямувати підсумок.

    - **Скинути** (новий session ID для того самого ключа чату):

      ```
      /new
      /reset
      ```

    Якщо це повторюється:

    - Увімкніть або налаштуйте **обрізання сесії** (`agents.defaults.contextPruning`), щоб скорочувати старий вивід інструментів.
    - Використовуйте модель із більшим вікном контексту.

    Документація: [Compaction](/uk/concepts/compaction), [Обрізання сесії](/uk/concepts/session-pruning), [Керування сесіями](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка валідації провайдера: модель видала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія сесії застаріла або пошкоджена (часто після довгих потоків
    або зміни інструмента/схеми).

    Виправлення: почніть нову сесію командою `/new` (окремим повідомленням).

  </Accordion>

  <Accordion title="Чому я отримую повідомлення heartbeat кожні 30 хвилин?">
    Heartbeat типово запускається кожні **30m** (**1h** при використанні OAuth-автентифікації). Налаштуйте або вимкніть його:

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

    Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown-заголовки
    на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб заощадити виклики API.
    Якщо файл відсутній, heartbeat усе одно виконується, і модель вирішує, що робити.

    Перевизначення на рівні агента використовують `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "обліковий запис бота" до групи WhatsApp?'>
    Ні. OpenClaw працює з **вашого власного облікового запису**, тож якщо ви є в групі, OpenClaw може її бачити.
    За замовчуванням відповіді в групах заблоковано, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

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
    Варіант 1 (найшвидший): відстежуйте журнали й надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Знайдіть `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/додано в allowlist): перелічіть групи з конфігурації:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/uk/cli/directory), [Журнали](/uk/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Є дві поширені причини:

    - Увімкнено обмеження за згадуванням (типово). Ви маєте @згадати бота (або збігатися з `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і цю групу не додано в allowlist.

    Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи ділять групи/потоки контекст із DM?">
    Прямі чати типово згортаються в основну сесію. Групи/канали мають власні ключі сесій, а теми Telegram / потоки Discord — це окремі сесії. Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки робочих областей і агентів я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але стежте за таким:

    - **Зростання диска:** сесії + транскрипти зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартість токенів:** більше агентів означає більше одночасного використання моделей.
    - **Операційне навантаження:** профілі автентифікації, робочі області й маршрутизація каналів на рівні агента.

    Поради:

    - Тримайте одну **активну** робочу область на агента (`agents.defaults.workspace`).
    - Очищуйте старі сесії (видаляйте JSONL або записи сховища), якщо диск розростається.
    - Використовуйте `openclaw doctor`, щоб виявляти зайві робочі області й невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька ботів або чатів одночасно (Slack), і як це краще налаштувати?">
    Так. Використовуйте **Маршрутизацію мультиагентності**, щоб запускати кількох ізольованих агентів і маршрутизувати вхідні повідомлення за
    каналом/обліковим записом/peer. Slack підтримується як канал і може бути прив’язаний до конкретних агентів.

    Доступ до браузера дуже потужний, але це не «можна все, що може людина» — anti-bot, CAPTCHA та MFA
    усе ще можуть блокувати автоматизацію. Для максимально надійного керування браузером використовуйте локальний Chrome MCP на хості
    або використовуйте CDP на машині, яка фактично запускає браузер.

    Найкраща практика налаштування:

    - Хост Gateway, що завжди увімкнений (VPS/Mac mini).
    - Один агент на роль (bindings).
    - Канал(и) Slack, прив’язані до цих агентів.
    - Локальний браузер через Chrome MCP або node за потреби.

    Документація: [Маршрутизація мультиагентності](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Браузер](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: значення за замовчуванням, вибір, псевдоніми, перемикання

<AccordionGroup>
  <Accordion title='Що таке "модель за замовчуванням"?'>
    Модель OpenClaw за замовчуванням — це те, що ви задаєте як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються як `provider/model` (приклад: `openai/gpt-5.4`). Якщо ви не вказуєте провайдера, OpenClaw спочатку пробує псевдонім, потім унікальний збіг налаштованого провайдера для точного id моделі, і лише потім повертається до налаштованого провайдера за замовчуванням як до застарілого шляху сумісності. Якщо цей провайдер більше не відкриває налаштовану модель за замовчуванням, OpenClaw повертається до першого налаштованого провайдера/моделі замість показу застарілого типового значення з видаленим провайдером. Вам усе одно слід **явно** задавати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендований варіант за замовчуванням:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для агентів з увімкненими інструментами або ненадійним входом:** віддавайте перевагу силі моделі над вартістю.
    **Для звичайного/низькоризикового чату:** використовуйте дешевші резервні моделі й маршрутизуйте за роллю агента.

    Для MiniMax є окрема документація: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити** для високоризикової роботи, і дешевшу
    модель для звичайного чату або підсумків. Ви можете маршрутизувати моделі на рівні агента й використовувати субагентів для
    паралелізації довгих завдань (кожен субагент витрачає токени). Див. [Моделі](/uk/concepts/models) і
    [Субагенти](/uk/tools/subagents).

    Сильне попередження: слабші/надто квантизовані моделі більш вразливі до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі, не стираючи конфігурацію?">
    Використовуйте **команди моделі** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, на рівні сесії)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - редагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` з частковим об’єктом, якщо ви не маєте наміру замінити всю конфігурацію.
    Для RPC-редагувань спочатку перевіряйте через `config.schema.lookup` і віддавайте перевагу `config.patch`. Payload lookup дає вам нормалізований шлях, поверхневу документацію/обмеження схеми та зведення безпосередніх дочірніх елементів
    для часткових оновлень.
    Якщо ви все ж перезаписали конфігурацію, відновіть її з резервної копії або повторно запустіть `openclaw doctor` для виправлення.

    Документація: [Моделі](/uk/concepts/models), [Налаштування](/uk/cli/configure), [Конфігурація](/uk/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати самостійно розгорнуті моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях до локальних моделей.

    Найшвидше налаштування:

    1. Встановіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо ви також хочете хмарні моделі, виконайте `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає вам хмарні моделі плюс ваші локальні моделі Ollama
    - хмарні моделі, такі як `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі більш вразливі до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все одно хочете малі моделі, увімкніть sandboxing і суворі allowlist-и інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Sandboxing](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - У цих розгортаннях це може відрізнятися й змінюватися з часом; фіксованої рекомендації щодо провайдера немає.
    - Перевіряйте поточне налаштування під час виконання на кожному gateway через `openclaw models status`.
    - Для безпеково чутливих агентів / агентів з увімкненими інструментами використовуйте найсильнішу доступну модель останнього покоління.
  </Accordion>

  <Accordion title="Як перемикати моделі на льоту (без перезапуску)?">
    Використовуйте команду `/model` як окреме повідомлення:

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Це вбудовані псевдоніми. Власні псевдоніми можна додавати через `agents.defaults.models`.

    Список доступних моделей можна переглянути через `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований вибір. Виберіть за номером:

    ```
    /model 3
    ```

    Ви також можете примусово вибрати конкретний профіль автентифікації для провайдера (на рівні сесії):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується і який профіль автентифікації буде спробовано наступним.
    Він також показує налаштовану кінцеву точку провайдера (`baseUrl`) і режим API (`api`), коли вони доступні.

    **Як скасувати закріплення профілю, який я задав через @profile?**

    Повторно виконайте `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо ви хочете повернутися до значення за замовчуванням, виберіть його через `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль автентифікації активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.2 для щоденних завдань, а Codex 5.3 для програмування?">
    Так. Задайте одну як значення за замовчуванням і перемикайте за потреби:

    - **Швидке перемикання (на рівні сесії):** `/model gpt-5.4` для щоденних завдань, `/model openai-codex/gpt-5.4` для програмування з Codex OAuth.
    - **Типове значення + перемикання:** задайте `agents.defaults.model.primary` як `openai/gpt-5.4`, а потім перемикайтеся на `openai-codex/gpt-5.4` під час програмування (або навпаки).
    - **Субагенти:** маршрутизуйте завдання програмування до субагентів з іншою моделлю за замовчуванням.

    Див. [Моделі](/uk/concepts/models) і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.4?">
    Використовуйте або перемикач на рівні сесії, або типове значення в конфігурації:

    - **На рівні сесії:** надішліть `/fast on`, поки сесія використовує `openai/gpt-5.4` або `openai-codex/gpt-5.4`.
    - **Типове значення на рівні моделі:** задайте `agents.defaults.models["openai/gpt-5.4"].params.fastMode` як `true`.
    - **Також для Codex OAuth:** якщо ви також використовуєте `openai-codex/gpt-5.4`, задайте там той самий прапорець.

    Приклад:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.4": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Для OpenAI fast mode відповідає `service_tier = "priority"` у підтримуваних нативних запитах Responses. Сесійний `/fast` має вищий пріоритет за типові значення конфігурації.

    Див. [Thinking і fast mode](/uk/tools/thinking) і [OpenAI fast mode](/uk/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо задано `agents.defaults.models`, воно стає **allowlist** для `/model` і будь-яких
    перевизначень сесії. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, приберіть allowlist або виберіть модель зі списку `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **провайдер не налаштований** (не знайдено конфігурації провайдера MiniMax або профілю
    автентифікації), тому модель неможливо розв’язати.

    Контрольний список для виправлення:

    1. Оновіться до актуального релізу OpenClaw (або запускайте з вихідного коду `main`), а потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (майстром або через JSON), або що автентифікація MiniMax
       існує в env/профілях автентифікації, щоб відповідний провайдер можна було інжектувати
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний id моделі (з урахуванням регістру) для вашого шляху автентифікації:
       `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed` для
       налаштування з API-ключем, або `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування з OAuth.
    4. Виконайте:

       ```bash
       openclaw models list
       ```

       і виберіть зі списку (або `/model list` у чаті).

    Див. [MiniMax](/uk/providers/minimax) і [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати MiniMax як типове значення, а OpenAI — для складних завдань?">
    Так. Використовуйте **MiniMax як значення за замовчуванням** і перемикайте моделі **на рівні сесії** за потреби.
    Fallback-и призначені для **помилок**, а не для «складних завдань», тож використовуйте `/model` або окремого агента.

    **Варіант A: перемикання на рівні сесії**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.4": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Потім:

    ```
    /model gpt
    ```

    **Варіант B: окремі агенти**

    - Типове значення агента A: MiniMax
    - Типове значення агента B: OpenAI
    - Маршрутизуйте за агентом або використовуйте `/agent` для перемикання

    Документація: [Моделі](/uk/concepts/models), [Маршрутизація мультиагентності](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома скороченнями за замовчуванням (застосовуються лише коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви задасте власний псевдонім із тією самою назвою, ваше значення матиме пріоритет.

  </Accordion>

  <Accordion title="Як визначити/перевизначити скорочення моделей (псевдоніми)?">
    Псевдоніми задаються через `agents.defaults.models.<modelId>.alias`. Приклад:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Тоді `/model sonnet` (або `/<alias>`, коли це підтримується) розв’язується до цього ID моделі.

  </Accordion>

  <Accordion title="Як додати моделі від інших провайдерів, наприклад OpenRouter або Z.AI?">
    OpenRouter (оплата за токен; багато моделей):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (моделі GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Якщо ви посилаєтеся на `provider/model`, але потрібний ключ провайдера відсутній, ви отримаєте помилку автентифікації під час виконання (наприклад, `No API key found for provider "zai"`).

    **Після додавання нового агента з’являється "No API key found for provider"**

    Зазвичай це означає, що **новий агент** має порожнє сховище автентифікації. Автентифікація прив’язана до агента і
    зберігається в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Виконайте `openclaw agents add <id>` і налаштуйте автентифікацію під час роботи майстра.
    - Або скопіюйте `auth-profiles.json` з `agentDir` основного агента в `agentDir` нового агента.

    **Не** використовуйте спільний `agentDir` для кількох агентів; це спричиняє конфлікти автентифікації/сесій.

  </Accordion>
</AccordionGroup>

## Резервне перемикання моделей і "All models failed"

<AccordionGroup>
  <Accordion title="Як працює резервне перемикання?">
    Резервне перемикання відбувається у два етапи:

    1. **Ротація профілів автентифікації** в межах одного провайдера.
    2. **Fallback моделі** до наступної моделі в `agents.defaults.model.fallbacks`.

    До профілів, що зазнали збою, застосовуються cooldown-и (експоненційний backoff), тому OpenClaw може продовжувати відповідати, навіть коли провайдер обмежений за rate limit або тимчасово недоступний.

    Кошик rate limit включає не лише звичайні відповіді `429`. OpenClaw
    також вважає повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    ліміти вікна використання (`weekly/monthly limit reached`) гідними
    резервного перемикання rate limit-ами.

    Деякі відповіді, схожі на проблеми з білінгом, не є `402`, і деякі HTTP `402`
    також залишаються в цьому транзитному кошику. Якщо провайдер повертає
    явний текст про білінг із `401` або `403`, OpenClaw усе одно може залишити це
    в гілці білінгу, але текстові зіставлення, специфічні для провайдера, залишаються обмеженими
    провайдером, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Якщо ж повідомлення `402`
    більше схоже на повторюваний ліміт вікна використання або
    ліміт витрат організації/робочої області (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw трактує це як
    `rate_limit`, а не як довготривале відключення через білінг.

    Помилки переповнення контексту — інші: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху compaction/retry замість просування
    fallback моделі.

    Загальний текст server error навмисно вужчий за «будь-що зі словами
    unknown/error усередині». OpenClaw вважає гідними резервного перемикання
    транзитні форми в межах контексту провайдера, такі як голе Anthropic `An unknown error occurred`, голе OpenRouter
    `Provider returned error`, помилки причини зупинки на кшталт `Unhandled stop reason:
    error`, JSON payload-и `api_error` із транзитним текстом сервера
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки «провайдер зайнятий», такі як `ModelNotReadyException`,
    як сигнали тайм-ауту/перевантаження, коли контекст провайдера
    збігається.
    Загальний внутрішній fallback-текст на кшталт `LLM request failed with an unknown
    error.` лишається консервативним і сам по собі не запускає fallback моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система спробувала використати ID профілю автентифікації `anthropic:default`, але не змогла знайти для нього облікові дані в очікуваному сховищі автентифікації.

    **Контрольний список для виправлення:**

    - **Підтвердьте, де зберігаються профілі автентифікації** (нові й застарілі шляхи)
      - Поточний шлях: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий шлях: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Підтвердьте, що Gateway завантажує вашу env var**
      - Якщо ви задали `ANTHROPIC_API_KEY` у своїй оболонці, але запускаєте Gateway через systemd/launchd, він може її не успадкувати. Помістіть її в `~/.openclaw/.env` або ввімкніть `env.shellEnv`.
    - **Переконайтеся, що ви редагуєте правильного агента**
      - У мультиагентних налаштуваннях може бути кілька файлів `auth-profiles.json`.
    - **Швидко перевірте стан моделі/автентифікації**
      - Використовуйте `openclaw models status`, щоб побачити налаштовані моделі й чи проходять провайдери автентифікацію.

    **Контрольний список для виправлення "No credentials found for profile anthropic"**

    Це означає, що запуск закріплено за профілем автентифікації Anthropic, але Gateway
    не може знайти його у своєму сховищі автентифікації.

    - **Використовуйте Claude CLI**
      - Виконайте `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо ви хочете використовувати API-ключ**
      - Помістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистьте будь-який закріплений порядок, який примусово вимагає відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Підтвердьте, що ви запускаєте команди саме на хості gateway**
      - У віддаленому режимі профілі автентифікації живуть на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому система також спробувала Google Gemini і теж не змогла?">
    Якщо конфігурація вашої моделі включає Google Gemini як fallback (або ви перемкнулися на скорочення Gemini), OpenClaw спробує його під час fallback моделі. Якщо ви не налаштували облікові дані Google, ви побачите `No API key found for provider "google"`.

    Виправлення: або надайте автентифікацію Google, або приберіть/не використовуйте моделі Google в `agents.defaults.model.fallbacks` / псевдонімах, щоб fallback не маршрутизував туди.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Причина: історія сесії містить **блоки thinking без сигнатур** (часто через
    перерваний/частковий потік). Google Antigravity вимагає сигнатур для блоків thinking.

    Виправлення: тепер OpenClaw прибирає блоки thinking без сигнатур для Google Antigravity Claude. Якщо це все ще трапляється, почніть **нову сесію** або задайте `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Профілі автентифікації: що це таке і як ними керувати

Пов’язане: [/concepts/oauth](/uk/concepts/oauth) (потоки OAuth, зберігання токенів, шаблони для кількох облікових записів)

<AccordionGroup>
  <Accordion title="Що таке профіль автентифікації?">
    Профіль автентифікації — це іменований запис облікових даних (OAuth або API-ключ), прив’язаний до провайдера. Профілі зберігаються в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які типові ID профілів?">
    OpenClaw використовує ID з префіксом провайдера, наприклад:

    - `anthropic:default` (поширений варіант, коли немає email-ідентичності)
    - `anthropic:<email>` для OAuth-ідентичностей
    - власні ID на ваш вибір (наприклад, `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який профіль автентифікації пробується першим?">
    Так. Конфігурація підтримує необов’язкові метадані для профілів і порядок для кожного провайдера (`auth.order.<provider>`). Тут **не** зберігаються секрети; це лише зіставляє ID із провайдером/режимом і задає порядок ротації.

    OpenClaw може тимчасово пропустити профіль, якщо він перебуває в короткому **cooldown** (rate limit-и/тайм-аути/збої автентифікації) або в довшому стані **disabled** (білінг/недостатньо коштів). Щоб перевірити це, виконайте `openclaw models status --json` і перегляньте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Cooldown-и rate limit можуть бути прив’язані до моделі. Профіль, який перебуває в cooldown
    для однієї моделі, все ще може бути придатним для сусідньої моделі того самого провайдера,
    тоді як вікна billing/disabled усе ще блокують увесь профіль.

    Ви також можете задати **перевизначення порядку для конкретного агента** (зберігається в `auth-state.json` цього агента) через CLI:

    ```bash
    # Типово використовується налаштований агент за замовчуванням (omit --agent)
    openclaw models auth order get --provider anthropic

    # Зафіксувати ротацію на одному профілі (пробувати лише цей)
    openclaw models auth order set --provider anthropic anthropic:default

    # Або задати явний порядок (fallback у межах провайдера)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Очистити перевизначення (повернення до config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Щоб націлитися на конкретного агента:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Щоб перевірити, що саме реально буде спробовано, використовуйте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено в явному порядку, probe повідомить
    `excluded_by_auth_order` для цього профілю замість того, щоб тихо його спробувати.

  </Accordion>

  <Accordion title="OAuth чи API-ключ — у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де це застосовно).
    - **API-ключі** використовують тарифікацію pay-per-token.

    Майстер явно підтримує Anthropic Claude CLI, OpenAI Codex OAuth і API-ключі.

  </Accordion>
</AccordionGroup>

## Gateway: порти, "already running" і віддалений режим

<AccordionGroup>
  <Accordion title="Який порт використовує Gateway?">
    `gateway.port` керує єдиним мультиплексованим портом для WebSocket + HTTP (Control UI, hooks тощо).

    Пріоритет:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Чому openclaw gateway status каже "Runtime: running", але "Connectivity probe: failed"?'>
    Тому що "running" — це погляд **supervisor-а** (launchd/systemd/schtasks). Перевірка з’єднання — це фактичне підключення CLI до gateway WebSocket.

    Використовуйте `openclaw gateway status` і довіряйте таким рядкам:

    - `Probe target:` (URL, який перевірка фактично використала)
    - `Listening:` (що реально прив’язано до порту)
    - `Last gateway error:` (поширена першопричина, коли процес живий, але порт не слухає)

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує різні "Config (cli)" і "Config (service)"?'>
    Ви редагуєте один файл конфігурації, а сервіс запущено з іншим (часто через невідповідність `--profile` / `OPENCLAW_STATE_DIR`).

    Виправлення:

    ```bash
    openclaw gateway install --force
    ```

    Запустіть це з того самого `--profile` / середовища, яке ви хочете використовувати для сервісу.

  </Accordion>

  <Accordion title='Що означає "another gateway instance is already listening"?'>
    OpenClaw забезпечує runtime-lock, негайно прив’язуючи слухач WebSocket під час запуску (типово `ws://127.0.0.1:18789`). Якщо прив’язка завершується помилкою `EADDRINUSE`, викидається `GatewayLockError`, який означає, що інший екземпляр уже слухає.

    Виправлення: зупиніть інший екземпляр, звільніть порт або запустіть з `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Як запустити OpenClaw у віддаленому режимі (клієнт підключається до Gateway деінде)?">
    Задайте `gateway.mode: "remote"` і вкажіть віддалену URL-адресу WebSocket, за бажанням із віддаленими обліковими даними за спільним секретом:

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

    - `openclaw gateway` запускається лише коли `gateway.mode` має значення `local` (або ви передаєте прапорець перевизначення).
    - Застосунок macOS відстежує файл конфігурації та живо перемикає режими, коли ці значення змінюються.
    - `gateway.remote.token` / `.password` — це лише віддалені облікові дані на стороні клієнта; самі по собі вони не вмикають локальну автентифікацію gateway.

  </Accordion>

  <Accordion title='Control UI каже "unauthorized" (або постійно перепідключається). Що тепер?'>
    Шлях автентифікації вашого gateway і метод автентифікації UI не збігаються.

    Факти (з коду):

    - Control UI зберігає токен у `sessionStorage` для поточної сесії вкладки браузера й вибраної URL-адреси gateway, тому оновлення в тій самій вкладці продовжують працювати без відновлення довготривалого збереження токена в localStorage.
    - У разі `AUTH_TOKEN_MISMATCH` довірені клієнти можуть зробити одну обмежену повторну спробу з кешованим токеном пристрою, коли gateway повертає підказки для повтору (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Цей повтор із кешованим токеном тепер повторно використовує кешовані затверджені scopes, збережені разом із токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` як і раніше зберігають свій запитаний набір scopes замість успадкування кешованих.
    - Поза цим шляхом повторної спроби пріоритет автентифікації connect такий: спочатку явний спільний токен/пароль, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap token.
    - Перевірки scope для bootstrap token мають префікс ролі. Вбудований allowlist bootstrap operator задовольняє лише запити operator; node або інші ролі, відмінні від operator, усе ще потребують scopes під власним префіксом ролі.

    Виправлення:

    - Найшвидше: `openclaw dashboard` (виводить + копіює URL-адресу dashboard, намагається відкрити; показує SSH-підказку, якщо режим headless).
    - Якщо у вас ще немає токена: `openclaw doctor --generate-gateway-token`.
    - Якщо режим віддалений, спочатку створіть тунель: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`.
    - Режим спільного секрету: задайте `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, а потім вставте відповідний секрет у налаштуваннях Control UI.
    - Режим Tailscale Serve: переконайтеся, що `gateway.auth.allowTailscale` увімкнено і ви відкриваєте саме URL-адресу Serve, а не сиру loopback/tailnet URL, яка обходить заголовки ідентичності Tailscale.
    - Режим trusted-proxy: переконайтеся, що ви заходите через налаштований identity-aware proxy без loopback, а не через loopback-проксі на тому самому хості чи сиру URL-адресу gateway.
    - Якщо невідповідність зберігається після однієї повторної спроби, замініть/повторно затвердьте токен спареного пристрою:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Якщо виклик rotate каже, що йому відмовлено, перевірте дві речі:
      - сесії paired-device можуть замінювати лише **власний** пристрій, якщо тільки вони також не мають `operator.admin`
      - явні значення `--scope` не можуть перевищувати поточні operator scopes викликача
    - Усе ще застрягли? Виконайте `openclaw status --all` і дотримуйтеся [Усунення несправностей](/uk/gateway/troubleshooting). Подробиці автентифікації див. в [Dashboard](/uk/web/dashboard).

  </Accordion>

  <Accordion title="Я задав gateway.bind tailnet, але він не може прив’язатися і нічого не слухає">
    Прив’язка `tailnet` вибирає Tailscale IP з мережевих інтерфейсів (100.64.0.0/10). Якщо машина не в Tailscale (або інтерфейс неактивний), прив’язуватися нема до чого.

    Виправлення:

    - Запустіть Tailscale на цьому хості (щоб він мав адресу 100.x), або
    - Перемкніться на `gateway.bind: "loopback"` / `"lan"`.

    Примітка: `tailnet` є явним значенням. `auto` віддає перевагу loopback; використовуйте `gateway.bind: "tailnet"`, коли вам потрібна прив’язка лише до tailnet.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька Gateway на одному хості?">
    Зазвичай ні — один Gateway може обслуговувати кілька каналів обміну повідомленнями й агентів. Використовуйте кілька Gateway лише тоді, коли вам потрібна резервність (наприклад, аварійний бот) або жорстка ізоляція.

    Так, але вам потрібно ізолювати:

    - `OPENCLAW_CONFIG_PATH` (окрема конфігурація для кожного екземпляра)
    - `OPENCLAW_STATE_DIR` (окремий стан для кожного екземпляра)
    - `agents.defaults.workspace` (ізоляція робочої області)
    - `gateway.port` (унікальні порти)

    Швидке налаштування (рекомендовано):

    - Використовуйте `openclaw --profile <name> ...` для кожного екземпляра (автоматично створює `~/.openclaw-<name>`).
    - Задайте унікальний `gateway.port` у конфігурації кожного профілю (або передайте `--port` для ручних запусків).
    - Встановіть сервіс для кожного профілю: `openclaw --profile <name> gateway install`.

    Профілі також додають суфікси до назв сервісів (`ai.openclaw.<profile>`; застарілі `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Повний посібник: [Кілька Gateway](/uk/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Що означає "invalid handshake" / code 1008?'>
    Gateway — це **WebSocket-сервер**, і він очікує, що найперше повідомлення
    буде кадром `connect`. Якщо він отримує щось інше, то закриває з’єднання
    з **кодом 1008** (порушення політики).

    Поширені причини:

    - Ви відкрили **HTTP** URL у браузері (`http://...`) замість WS-клієнта.
    - Ви використали неправильний порт або шлях.
    - Проксі або тунель прибрали заголовки автентифікації або надіслали не-Gateway запит.

    Швидкі виправлення:

    1. Використовуйте WS URL: `ws://<host>:18789` (або `wss://...`, якщо HTTPS).
    2. Не відкривайте WS-порт у звичайній вкладці браузера.
    3. Якщо автентифікацію ввімкнено, додайте токен/пароль у кадр `connect`.

    Якщо ви використовуєте CLI або TUI, URL має виглядати так:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Подробиці протоколу: [Протокол Gateway](/uk/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Журналювання та налагодження

<AccordionGroup>
  <Accordion title="Де журнали?">
    Файлові журнали (структуровані):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Ви можете задати стабільний шлях через `logging.file`. Рівень файлового журналу задається `logging.level`. Деталізація консолі керується через `--verbose` і `logging.consoleLevel`.

    Найшвидший перегляд хвоста журналу:

    ```bash
    openclaw logs --follow
    ```

    Журнали сервісу/supervisor-а (коли gateway працює через launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` і `gateway.err.log` (типово: `~/.openclaw/logs/...`; профілі використовують `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Докладніше див. в [Усунення несправностей](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Як запустити/зупинити/перезапустити сервіс Gateway?">
    Використовуйте helper-и gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви запускаєте gateway вручну, `openclaw gateway --force` може повернути собі порт. Див. [Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Я закрив термінал у Windows — як перезапустити OpenClaw?">
    Є **два режими встановлення на Windows**:

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

    Документація: [Windows (WSL2)](/uk/platforms/windows), [Операційний посібник сервісу Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Gateway працює, але відповіді ніколи не приходять. Що перевірити?">
    Почніть зі швидкої перевірки стану:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Поширені причини:

    - Автентифікацію моделі не завантажено на **хості gateway** (перевірте `models status`).
    - Прив’язка каналу/allowlist блокує відповіді (перевірте конфігурацію каналу + журнали).
    - WebChat/Dashboard відкрито без правильного токена.

    Якщо ви в віддаленому режимі, переконайтеся, що тунель/Tailscale-підключення активне і
    Gateway WebSocket доступний.

    Документація: [Канали](/uk/channels), [Усунення несправностей](/uk/gateway/troubleshooting), [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — що тепер?'>
    Зазвичай це означає, що UI втратив з’єднання WebSocket. Перевірте:

    1. Чи працює Gateway? `openclaw gateway status`
    2. Чи справний Gateway? `openclaw status`
    3. Чи має UI правильний токен? `openclaw dashboard`
    4. Якщо режим віддалений, чи активне тунельне/Tailscale-підключення?

    Потім подивіться журнали:

    ```bash
    openclaw logs --follow
    ```

    Документація: [Dashboard](/uk/web/dashboard), [Віддалений доступ](/uk/gateway/remote), [Усунення несправностей](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Не вдається виконати Telegram setMyCommands. Що перевірити?">
    Почніть із журналів і стану каналу:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Потім зіставте помилку:

    - `BOT_COMMANDS_TOO_MUCH`: меню Telegram має забагато записів. OpenClaw уже обрізає його до ліміту Telegram і повторює спробу з меншою кількістю команд, але деякі записи меню все одно треба прибрати. Зменште кількість Plugin/Skill/власних команд або вимкніть `channels.telegram.commands.native`, якщо вам не потрібне меню.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` або схожі мережеві помилки: якщо ви працюєте на VPS або за проксі, переконайтеся, що вихідний HTTPS дозволено і DNS працює для `api.telegram.org`.

    Якщо Gateway віддалений, переконайтеся, що ви дивитеся журнали саме на хості Gateway.

    Документація: [Telegram](/uk/channels/telegram), [Усунення несправностей каналів](/uk/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI не показує вивід. Що перевірити?">
    Спочатку переконайтеся, що Gateway доступний і агент може працювати:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    У TUI використовуйте `/status`, щоб побачити поточний стан. Якщо ви очікуєте відповіді в чаті
    каналу, переконайтеся, що доставку ввімкнено (`/deliver on`).

    Документація: [TUI](/uk/web/tui), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як повністю зупинити, а потім запустити Gateway?">
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

    Документація: [Операційний посібник сервісу Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Поясніть просто: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: перезапускає **фоновий сервіс** (launchd/systemd).
    - `openclaw gateway`: запускає gateway **на передньому плані** для цієї сесії термінала.

    Якщо ви встановили сервіс, використовуйте команди gateway. Використовуйте `openclaw gateway`, коли
    вам потрібен одноразовий запуск на передньому плані.

  </Accordion>

  <Accordion title="Найшвидший спосіб отримати більше деталей, коли щось не працює">
    Запустіть Gateway з `--verbose`, щоб отримати детальніший вивід у консоль. Потім перегляньте файл журналу на предмет автентифікації каналу, маршрутизації моделі та RPC-помилок.
  </Accordion>
</AccordionGroup>

## Медіа та вкладення

<AccordionGroup>
  <Accordion title="Мій skill згенерував зображення/PDF, але нічого не було надіслано">
    Вихідні вкладення від агента мають містити рядок `MEDIA:<path-or-url>` (в окремому рядку). Див. [Налаштування помічника OpenClaw](/uk/start/openclaw) і [Надсилання агентом](/uk/tools/agent-send).

    Надсилання через CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Також перевірте:

    - Цільовий канал підтримує вихідні медіа й не заблокований allowlist-ами.
    - Файл не перевищує ліміти розміру провайдера (зображення масштабуються максимум до 2048px).
    - `tools.fs.workspaceOnly=true` обмежує надсилання локальних шляхів робочою областю, temp/media-store і файлами, перевіреними sandbox.
    - `tools.fs.workspaceOnly=false` дозволяє `MEDIA:` надсилати локальні файли хоста, які агент уже може читати, але лише для медіа плюс безпечних типів документів (зображення, аудіо, відео, PDF і документи Office). Звичайні текстові та схожі на секрети файли все одно блокуються.

    Див. [Зображення](/uk/nodes/images).

  </Accordion>
</AccordionGroup>

## Безпека та контроль доступу

<AccordionGroup>
  <Accordion title="Чи безпечно відкривати OpenClaw для вхідних DM?">
    Ставтеся до вхідних DM як до ненадійного вводу. Значення за замовчуванням розроблено для зниження ризику:

    - Типова поведінка на каналах із підтримкою DM — це **pairing**:
      - Невідомі відправники отримують код pairing; бот не обробляє їхнє повідомлення.
      - Підтвердження: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Кількість очікуваних запитів обмежена **3 на канал**; перевіряйте `openclaw pairing list --channel <channel> [--account <id>]`, якщо код не надійшов.
    - Публічне відкриття DM вимагає явного opt-in (`dmPolicy: "open"` і allowlist `"*"`).

    Запустіть `openclaw doctor`, щоб виявити ризиковані політики DM.

  </Accordion>

  <Accordion title="Чи стосується prompt injection лише публічних ботів?">
    Ні. Prompt injection — це про **ненадійний контент**, а не лише про те, хто може писати боту в DM.
    Якщо ваш помічник читає зовнішній контент (web search/fetch, сторінки браузера, листи,
    документи, вкладення, вставлені журнали), цей контент може містити інструкції, які намагаються
    перехопити контроль над моделлю. Це може статися, навіть якщо **ви єдиний відправник**.

    Найбільший ризик виникає, коли увімкнені інструменти: модель можна обдурити й змусити
    ексфільтрувати контекст або викликати інструменти від вашого імені. Зменшуйте радіус ураження так:

    - використовуйте "reader"-агента лише для читання або без інструментів, щоб підсумовувати ненадійний контент
    - тримайте `web_search` / `web_fetch` / `browser` вимкненими для агентів з увімкненими інструментами
    - також ставтеся до декодованого тексту файлів/документів як до ненадійного: OpenResponses
      `input_file` і витяг тексту з медіавкладень обгортають витягнутий текст у
      явні маркери меж зовнішнього контенту замість передавання сирого тексту файла
    - використовуйте sandboxing і суворі allowlist-и інструментів

    Подробиці: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи повинен мій бот мати власну електронну пошту, обліковий запис GitHub або номер телефону?">
    Так, для більшості конфігурацій. Ізоляція бота окремими обліковими записами й номерами телефону
    зменшує радіус ураження, якщо щось піде не так. Це також спрощує заміну
    облікових даних або відкликання доступу без впливу на ваші особисті облікові записи.

    Починайте з малого. Надавайте доступ лише до тих інструментів і облікових записів, які вам справді потрібні, і розширюйте
    пізніше за потреби.

    Документація: [Безпека](/uk/gateway/security), [Pairing](/uk/channels/pairing).

  </Accordion>

  <Accordion title="Чи можу я надати йому автономність над моїми текстовими повідомленнями і чи це безпечно?">
    Ми **не** рекомендуємо повну автономність над вашими особистими повідомленнями. Найбезпечніший шаблон:

    - Тримайте DM у **режимі pairing** або в суворому allowlist.
    - Використовуйте **окремий номер або обліковий запис**, якщо хочете, щоб він надсилав повідомлення від вашого імені.
    - Дозвольте йому створити чернетку, а потім **затверджуйте перед надсиланням**.

    Якщо хочете поекспериментувати, робіть це на окремому обліковому записі й тримайте його ізольованим. Див.
    [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи можу я використовувати дешевші моделі для завдань персонального помічника?">
    Так, **якщо** агент працює лише в чаті, а вхідні дані є довіреними. Молодші рівні
    більше схильні до перехоплення інструкціями, тому уникайте їх для агентів з увімкненими інструментами
    або під час читання ненадійного контенту. Якщо вам усе ж потрібно використовувати меншу модель, жорстко обмежте
    інструменти й запускайте все всередині sandbox. Див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Я запустив /start у Telegram, але не отримав коду pairing">
    Коди pairing надсилаються **лише** тоді, коли невідомий відправник пише боту і
    увімкнено `dmPolicy: "pairing"`. Сам по собі `/start` не генерує код.

    Перевірте запити, що очікують:

    ```bash
    openclaw pairing list telegram
    ```

    Якщо вам потрібен негайний доступ, додайте свій sender id в allowlist або задайте `dmPolicy: "open"`
    для цього облікового запису.

  </Accordion>

  <Accordion title="WhatsApp: чи буде він писати моїм контактам? Як працює pairing?">
    Ні. Типова політика WhatsApp DM — **pairing**. Невідомі відправники отримують лише код pairing, і їхнє повідомлення **не обробляється**. OpenClaw відповідає лише на чати, які отримує, або на явні надсилання, які ви запускаєте.

    Підтвердження pairing:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Перелік запитів, що очікують:

    ```bash
    openclaw pairing list whatsapp
    ```

    Запит номера телефону в майстрі: він використовується для налаштування вашого **allowlist/owner**, щоб дозволити ваші власні DM. Він не використовується для автоматичного надсилання. Якщо ви працюєте зі своїм особистим номером WhatsApp, використовуйте цей номер і ввімкніть `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Команди чату, переривання завдань і "воно не зупиняється"

<AccordionGroup>
  <Accordion title="Як зупинити показ внутрішніх системних повідомлень у чаті?">
    Більшість внутрішніх або інструментальних повідомлень з’являються лише тоді, коли для цієї сесії ввімкнено **verbose**, **trace** або **reasoning**.

    Виправлення в чаті, де ви це бачите:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Якщо шум усе ще є, перевірте налаштування сесії в Control UI і встановіть verbose
    на **inherit**. Також переконайтеся, що ви не використовуєте профіль бота з `verboseDefault`, заданим
    як `on` у конфігурації.

    Документація: [Thinking і verbose](/uk/tools/thinking), [Безпека](/uk/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Як зупинити/скасувати запущене завдання?">
    Надішліть будь-яке з цього **як окреме повідомлення** (без слеша):

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

    Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`, але деякі скорочення (наприклад `/status`) також працюють inline для відправників із allowlist.

  </Accordion>

  <Accordion title='Як надіслати повідомлення в Discord із Telegram? ("Cross-context messaging denied")'>
    OpenClaw типово блокує повідомлення **між різними провайдерами**. Якщо виклик інструмента прив’язаний
    до Telegram, він не надсилатиме в Discord, якщо ви явно цього не дозволите.

    Увімкніть міжпровайдерне надсилання повідомлень для агента:

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

    Перезапустіть gateway після редагування конфігурації.

  </Accordion>

  <Accordion title='Чому здається, що бот "ігнорує" швидку серію повідомлень?'>
    Режим черги визначає, як нові повідомлення взаємодіють із поточним запуском. Використовуйте `/queue`, щоб змінити режими:

    - `steer` - нові повідомлення перенаправляють поточне завдання
    - `followup` - запускати повідомлення по одному
    - `collect` - об’єднувати повідомлення в пакет і відповідати один раз (типово)
    - `steer-backlog` - спочатку перенаправити, потім обробити беклог
    - `interrupt` - перервати поточний запуск і почати заново

    Ви можете додавати параметри на кшталт `debounce:2s cap:25 drop:summarize` для режимів followup.

  </Accordion>
</AccordionGroup>

## Різне

<AccordionGroup>
  <Accordion title='Яка модель за замовчуванням для Anthropic з API-ключем?'>
    В OpenClaw облікові дані та вибір моделі — це окремі речі. Задання `ANTHROPIC_API_KEY` (або збереження API-ключа Anthropic у профілях автентифікації) вмикає автентифікацію, але фактична модель за замовчуванням — це те, що ви налаштовуєте в `agents.defaults.model.primary` (наприклад, `anthropic/claude-sonnet-4-6` або `anthropic/claude-opus-4-6`). Якщо ви бачите `No credentials found for profile "anthropic:default"`, це означає, що Gateway не зміг знайти облікові дані Anthropic в очікуваному `auth-profiles.json` для агента, який зараз працює.
  </Accordion>
</AccordionGroup>

---

Усе ще застрягли? Запитайте в [Discord](https://discord.com/invite/clawd) або відкрийте [обговорення на GitHub](https://github.com/openclaw/openclaw/discussions).
