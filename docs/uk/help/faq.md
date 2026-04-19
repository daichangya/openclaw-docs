---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час виконання
    - Тріаж проблем, про які повідомляють користувачі, перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-19T06:50:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: f569fb0412797314a11c41a1bbfa14f5892d2d368544fa67800823a6457000e6
    source_path: help/faq.md
    workflow: 15
---

# Поширені запитання

Швидкі відповіді та глибше усунення несправностей для реальних конфігурацій (локальна розробка, VPS, multi-agent, OAuth/API keys, резервне перемикання моделей). Для діагностики під час виконання дивіться [Усунення несправностей](/uk/gateway/troubleshooting). Повний довідник із конфігурації дивіться в [Конфігурація](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламалося

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидкий локальний підсумок: ОС + оновлення, доступність gateway/service, agents/sessions, конфігурація provider + проблеми під час виконання (коли Gateway доступний).

2. **Звіт, який можна вставити та поділитися ним без змін (безпечно для поширення)**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з хвостом журналу (токени приховані).

3. **Стан daemon + port**

   ```bash
   openclaw gateway status
   ```

   Показує runtime supervisor у порівнянні з доступністю RPC, цільову URL-адресу probe та яку конфігурацію, імовірно, використовував сервіс.

4. **Глибокі probe-перевірки**

   ```bash
   openclaw status --deep
   ```

   Виконує живу probe-перевірку стану Gateway, зокрема probe-перевірки каналів, коли вони підтримуються
   (потрібен доступний Gateway). Див. [Стан](/uk/gateway/health).

5. **Перегляд останнього журналу в реальному часі**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використайте запасний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові журнали відокремлені від журналів сервісу; див. [Журналювання](/uk/logging) та [Усунення несправностей](/uk/gateway/troubleshooting).

6. **Запустіть doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує config/state + виконує перевірки стану. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок стану Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # показує цільову URL-адресу + шлях до config у разі помилок
   ```

   Запитує у запущеного Gateway повний знімок стану (лише WS). Див. [Стан](/uk/gateway/health).

## Швидкий старт і налаштування першого запуску

<AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб зрушити з місця">
    Використайте локального AI agent, який може **бачити вашу машину**. Це набагато ефективніше, ніж питати
    в Discord, тому що більшість випадків "я застряг" — це **локальні проблеми конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти журнали та допомагати виправляти
    налаштування на рівні машини (PATH, сервіси, дозволи, файли автентифікації). Надайте їм **повну копію вихідного коду**
    через придатне до змін встановлення (git install):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **із git checkout**, тому agent може читати код + документацію та
    аналізувати точну версію, яку ви використовуєте. Ви завжди можете повернутися до стабільної версії пізніше,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть agent **спланувати та супроводжувати** виправлення (крок за кроком), а потім виконати лише
    потрібні команди. Це зменшує обсяг змін і полегшує їх аудит.

    Якщо ви знайдете справжню помилку або виправлення, будь ласка, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (діліться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану gateway/agent + базова конфігурація.
    - `openclaw models status`: перевіряє автентифікацію provider + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє поширені проблеми config/state.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламалося](#перші-60-секунд-якщо-щось-зламалося).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску Heartbeat:

    - `quiet-hours`: поза налаштованим вікном active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожній каркас або лише заголовки
    - `no-tasks-due`: режим задач `HEARTBEAT.md` активний, але жоден з інтервалів задачі ще не настав
    - `alerts-disabled`: усю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі задач часові позначки настання строку оновлюються лише після завершення
    реального запуску heartbeat. Пропущені запуски не позначають задачі як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та задачі](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановити й налаштувати OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання онбордингу:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати ресурси UI. Після онбордингу зазвичай Gateway запускають на порту **18789**.

    Із вихідного коду (contributors/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Якщо у вас ще немає глобального встановлення, запускайте через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Як відкрити dashboard після онбордингу?">
    Майстер відкриває ваш браузер із чистою (без токена) URL-адресою dashboard одразу після онбордингу, а також друкує посилання в підсумку. Залиште цю вкладку відкритою; якщо вона не запустилася, скопіюйте й вставте надруковану URL-адресу на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost та віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується shared-secret auth, вставте налаштований token або password у налаштуваннях Control UI.
    - Джерело token: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело password: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо shared secret ще не налаштовано, згенеруйте token командою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште bind loopback, виконайте `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставлення shared secret, за умови довіреного вузла Gateway); HTTP API усе одно вимагають shared-secret auth, якщо ви навмисно не використовуєте private-ingress `none` або trusted-proxy HTTP auth.
      Невдалі одночасні спроби автентифікації Serve від того самого клієнта серіалізуються до того, як обмежувач невдалої автентифікації зафіксує їх, тому друга невдала повторна спроба вже може показувати `retry later`.
    - **Прив’язка tailnet**: виконайте `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте password auth), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний shared secret у налаштуваннях dashboard.
    - **Зворотний proxy з урахуванням ідентичності**: тримайте Gateway за trusted proxy не в loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL-адресу proxy.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`. Shared-secret auth усе одно застосовується через tunnel; якщо з’явиться запит, вставте налаштований token або password.

    Див. [Dashboard](/web/dashboard) і [Web surfaces](/web) щодо режимів bind та деталей автентифікації.

  </Accordion>

  <Accordion title="Чому існують дві конфігурації схвалення exec для схвалень у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на схвалення до місць призначення чату
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом схвалення для exec approvals

    Політика host exec усе ще є справжнім бар’єром схвалення. Конфігурація чату лише визначає, де з’являються
    запити на схвалення та як люди можуть на них відповідати.

    У більшості конфігурацій вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди та відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначити тих, хто схвалює, OpenClaw тепер автоматично вмикає нативні схвалення DM-first, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки схвалення, цей нативний UI є основним шляхом; agent має включати ручну команду `/approve`, лише якщо результат інструмента показує, що схвалення в чаті недоступні або єдиним шляхом є ручне схвалення.
    - Використовуйте `approvals.exec` лише тоді, коли запити також потрібно пересилати в інші чати або явні ops rooms.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише тоді, коли ви явно хочете, щоб запити на схвалення надсилалися назад у вихідну кімнату/тему.
    - Схвалення Plugin — це ще окрема категорія: за замовчуванням вони використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали зберігають нативну обробку схвалень Plugin поверх цього.

    Коротко: пересилання потрібне для маршрутизації, конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке runtime мені потрібне?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендується** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway є легким — у документації зазначено, що для особистого використання достатньо **512 МБ–1 ГБ RAM**, **1 ядра** та приблизно **500 МБ**
    диска, а також вказано, що **Raspberry Pi 4 може його запускати**.

    Якщо вам потрібен додатковий запас ресурсів (журнали, медіа, інші сервіси), **рекомендовано 2 ГБ**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може розмістити Gateway, а ви можете підключати **Node** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради щодо встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте певних шорсткостей.

    - Використовуйте **64-бітну** ОС і Node >= 22.
    - Надавайте перевагу **придатному до змін встановленню (git install)**, щоб ви могли бачити журнали та швидко оновлюватися.
    - Починайте без channels/Skills, а потім додавайте їх по одному.
    - Якщо виникають дивні проблеми з бінарними файлами, зазвичай це проблема **сумісності ARM**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Застрягає на wake up my friend / онбординг не завершується. Що робити?">
    Цей екран залежить від того, чи доступний Gateway і чи пройдена автентифікація. TUI також автоматично надсилає
    "Wake up, my friend!" під час першого hatch. Якщо ви бачите цей рядок **без відповіді**
    і значення токенів залишається 0, agent так і не запустився.

    1. Перезапустіть Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Перевірте статус + auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Якщо все ще зависає, виконайте:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що tunnel/Tailscale-з’єднання активне і що UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini), не проходячи онбординг заново?">
    Так. Скопіюйте **каталог state** і **workspace**, а потім один раз запустіть Doctor. Це
    збереже вашого бота **точно таким самим** (memory, history сеансів, auth і channel
    state), якщо ви скопіюєте **обидва** розташування:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте ваш workspace (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть сервіс Gateway.

    Це зберігає config, auth profiles, облікові дані WhatsApp, sessions і memory. Якщо ви в
    remote mode, пам’ятайте, що session store і workspace належать хосту gateway.

    **Важливо:** якщо ви лише commit/push свій workspace на GitHub, ви створюєте резервну
    копію **memory + bootstrap files**, але **не** history сеансів або auth. Вони зберігаються
    в `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Міграція](/uk/install/migrating), [Де що зберігається на диску](#де-що-зберігається-на-диску),
    [Workspace agent](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Remote mode](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перегляньте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи — угорі. Якщо верхній розділ позначено як **Unreleased**, наступний датований
    розділ — це остання випущена версія. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (а також розділами документації/іншими, коли потрібно).

  </Accordion>

  <Accordion title="Не вдається відкрити docs.openclaw.ai (помилка SSL)">
    Деякі з’єднання Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до allowlist, а потім спробуйте знову.
    Будь ласка, допоможіть нам розблокувати сайт, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркалюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable-реліз спочатку потрапляє в **beta**, а потім явний
    крок просування переміщує цю саму версію до `latest`. Maintainers також можуть
    публікувати відразу в `latest`, коли це потрібно. Саме тому beta і stable можуть
    вказувати на **одну й ту саму версію** після просування.

    Подивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди встановлення та різницю між beta і dev дивіться в accordion нижче.

  </Accordion>

  <Accordion title="Як встановити beta-версію і яка різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (може збігатися з `latest` після просування).
    **Dev** — це рухома вершина `main` (git); коли її публікують, вона використовує npm dist-tag `dev`.

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

    Це перемикає на гілку `main` і оновлює з вихідного коду.

    2. **Hackable install (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Так ви отримуєте локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому клонуванню вручну, використайте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай триває встановлення й онбординг?">
    Приблизний орієнтир:

    - **Встановлення:** 2–5 хвилин
    - **Онбординг:** 5–15 хвилин залежно від того, скільки channels/models ви налаштовуєте

    Якщо все зависає, скористайтеся [Інсталятор завис?](#швидкий-старт-і-налаштування-першого-запуску)
    і швидким циклом налагодження в [Я застряг](#швидкий-старт-і-налаштування-першого-запуску).

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

    Для hackable (git) install:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --verbose
    ```

    Еквівалент для Windows (PowerShell):

    ```powershell
    # install.ps1 поки що не має окремого прапорця -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

    Більше параметрів: [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Під час встановлення у Windows пише git not found або openclaw not recognized">
    Дві поширені проблеми у Windows:

    **1) npm error spawn git / git not found**

    - Встановіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, а потім повторно запустіть інсталятор.

    **2) після встановлення openclaw is not recognized**

    - Ваш глобальний каталог bin для npm відсутній у PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до вашого користувацького PATH (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо вам потрібне найплавніше налаштування у Windows, використовуйте **WSL2** замість нативного Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У Windows вивід exec показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність code page консолі в нативних оболонках Windows.

    Симптоми:

    - вивід `system.run`/`exec` відображає китайський текст як mojibake
    - та сама команда виглядає нормально в іншому профілі термінала

    Швидкий обхідний спосіб у PowerShell:

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

    Якщо ви все ще відтворюєте цю проблему в останній версії OpenClaw, відстежуйте/повідомляйте про неї тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використайте **hackable (git) install**, щоб мати повний вихідний код і документацію локально, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг читати репозиторій і відповідати точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтесь інструкції для Linux, а потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення сервісу: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення й оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Встановіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де знайти інструкції зі встановлення в хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Виберіть одного та дотримуйтесь інструкції:

    - [VPS hosting](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    з ноутбука/телефона через Control UI (або Tailscale/SSH). Ваші state + workspace
    зберігаються на сервері, тож вважайте хост джерелом істини та робіть його резервні копії.

    Ви можете підключати **Node** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримати доступ
    до локального екрана/камери/canvas або запускати команди на ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Node: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити самого себе?">
    Коротка відповідь: **можливо, але не рекомендовано**. Під час оновлення може перезапускатися
    Gateway (що розриває активний сеанс), може знадобитися чистий git checkout, а також
    може знадобитися підтвердження. Безпечніше: запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо автоматизація з agent усе ж потрібна:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить онбординг?">
    `openclaw onboard` — це рекомендований шлях налаштування. У **local mode** він проводить вас через:

    - **Налаштування моделей/auth** (OAuth провайдера, API keys, Anthropic setup-token, а також варіанти локальних моделей, як-от LM Studio)
    - Розташування **workspace** + **bootstrap files**
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані channel plugins, як-от QQ Bot)
    - **Встановлення daemon** (LaunchAgent на macOS; systemd user unit на Linux/WSL2)
    - **Перевірки стану** та вибір **Skills**

    Він також попереджає, якщо налаштована вами модель невідома або для неї відсутня auth.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw з **API keys** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації в цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **Anthropic API key**: звичайне виставлення рахунків за Anthropic API
    - **Claude CLI / auth через підписку Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway Anthropic API keys усе ще є
    більш передбачуваним варіантом налаштування. OAuth OpenAI Codex явно підтримується для зовнішніх
    інструментів, як-от OpenClaw.

    OpenClaw також підтримує інші розміщені варіанти у стилі підписки, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [GLM Models](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API key?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тож
    OpenClaw вважає auth через підписку Claude та використання `claude -p` санкціонованими
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо вам потрібне
    найпередбачуваніше серверне налаштування, використовуйте натомість Anthropic API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви auth через підписку Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тож OpenClaw вважає
    повторне використання Claude CLI та використання `claude -p` санкціонованими для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token і далі доступний як підтримуваний шлях token в OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI та `claude -p`, коли це доступно.
    Для production або multi-user навантажень auth через Anthropic API key усе ще є
    безпечнішим і передбачуванішим вибором. Якщо вам потрібні інші розміщені
    варіанти у стилі підписки в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
Це означає, що вашу **квоту/ліміт запитів Anthropic** вичерпано для поточного вікна. Якщо ви
використовуєте **Claude CLI**, дочекайтеся скидання вікна або оновіть свій план. Якщо ви
використовуєте **Anthropic API key**, перевірте Anthropic Console
щодо використання/білінгу та за потреби підвищте ліміти.

    Якщо повідомлення має саме такий вигляд:
    `Extra usage is required for long context requests`, запит намагається використати
    1M context beta від Anthropic (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані мають право на білінг long-context (білінг API key або
    шлях входу Claude в OpenClaw з увімкненим Extra Usage).

    Порада: налаштуйте **резервну модель**, щоб OpenClaw міг продовжувати відповідати, коли provider обмежений rate limit.
    Див. [Models](/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудований provider **Amazon Bedrock (Converse)**. За наявності маркерів AWS env OpenClaw може автоматично виявити каталог streaming/text Bedrock і об’єднати його як неявний provider `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис provider вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний proxy перед Bedrock також залишається коректним варіантом.
  </Accordion>

  <Accordion title="Як працює auth Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Під час онбордингу можна виконати потік OAuth, і за потреби буде встановлено модель за замовчуванням `openai-codex/gpt-5.4`. Див. [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому ChatGPT GPT-5.4 не відкриває доступ до openai/gpt-5.4 в OpenClaw?">
    OpenClaw розглядає ці два шляхи окремо:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = прямий API OpenAI Platform

    В OpenClaw вхід ChatGPT/Codex прив’язаний до маршруту `openai-codex/*`,
    а не до прямого маршруту `openai/*`. Якщо ви хочете використовувати прямий шлях API в
    OpenClaw, задайте `OPENAI_API_KEY` (або еквівалентну конфігурацію provider OpenAI).
    Якщо ви хочете використовувати вхід ChatGPT/Codex в OpenClaw, використовуйте `openai-codex/*`.

  </Accordion>

  <Accordion title="Чому ліміти OAuth Codex можуть відрізнятися від ChatGPT web?">
    `openai-codex/*` використовує маршрут OAuth Codex, а його доступні вікна квот
    керуються OpenAI та залежать від плану. На практиці ці ліміти можуть відрізнятися від
    досвіду використання сайту/застосунку ChatGPT, навіть коли обидва прив’язані до одного облікового запису.

    OpenClaw може показувати поточні видимі вікна використання/квоти provider у
    `openclaw models status`, але не вигадує і не нормалізує права доступу ChatGPT web
    до прямого API. Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви auth через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth підписки OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання OAuth підписки в зовнішніх інструментах/робочих процесах
    на кшталт OpenClaw. Під час онбордингу потік OAuth можна виконати за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **потік auth Plugin**, а не client id чи secret у `openclaw.json`.

    Кроки:

    1. Встановіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Модель за замовчуванням після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не працюють, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає OAuth tokens у профілях auth на хості gateway. Докладніше: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для звичайних чатів?">
    Зазвичай ні. OpenClaw потребує великого context + сильного захисту; малі карти обрізаються та дають витоки. Якщо все ж потрібно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як зберегти трафік до розміщених моделей у певному регіоні?">
    Вибирайте endpoints, прив’язані до регіону. OpenRouter надає варіанти з хостингом у США для MiniMax, Kimi та GLM; вибирайте варіант із хостингом у США, щоб дані залишалися в регіоні. Ви все одно можете вказувати Anthropic/OpenAI поруч із ними, використовуючи `models.mode: "merge"`, щоб резервні варіанти залишалися доступними, водночас дотримуючись вибраного вами provider із прив’язкою до регіону.
  </Accordion>

  <Accordion title="Чи обов’язково купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini — необов’язковий варіант:
    деякі люди купують його як постійно увімкнений хост, але також підійдуть невеликий VPS, домашній сервер або пристрій класу Raspberry Pi.

    Mac потрібен лише для **інструментів, доступних тільки на macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або підключайте Node macOS.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, на якому виконано вхід у Messages. Це **не обов’язково** має бути Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, тоді як Gateway може працювати на Linux або деінде.

    Поширені конфігурації:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, де виконано вхід у Messages.
    - Запускайте все на Mac, якщо хочете найпростішу конфігурацію на одній машині.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи можу я підключити його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **Node** (супутній пристрій). Node не запускають Gateway — вони надають додаткові
    можливості, як-от screen/camera/canvas і `system.run` на цьому пристрої.

    Типова схема:

    - Gateway на Mac mini (постійно увімкнений).
    - MacBook Pro запускає застосунок macOS або хост Node і підключається до Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендується**. Ми бачимо помилки під час виконання, особливо з WhatsApp і Telegram.
    Для стабільних Gateway використовуйте **Node**.

    Якщо ви все ж хочете експериментувати з Bun, робіть це на неproduction Gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID** відправника-людини (числовий). Це не ім’я користувача бота.

    Під час онбордингу приймається введення `@username` і воно перетворюється на числовий ID, але авторизація OpenClaw використовує лише числові ID.

    Безпечніший варіант (без стороннього бота):

    - Напишіть своєму боту в DM, потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть своєму боту в DM, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Напишіть у DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **маршрутизацію multi-agent**. Прив’яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, E.164 відправника, наприклад `+15551234567`) до іншого `agentId`, щоб кожна людина мала власні workspace і session store. Відповіді все одно надходитимуть з **того самого облікового запису WhatsApp**, а контроль доступу для DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Маршрутизація Multi-Agent](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити agent "швидкий чат" і agent "Opus для кодування"?'>
    Так. Використовуйте маршрутизацію multi-agent: задайте кожному agent свою модель за замовчуванням, а потім прив’яжіть вхідні маршрути (обліковий запис provider або конкретні peers) до кожного agent. Приклад конфігурації наведено в [Маршрутизація Multi-Agent](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, визначалися в non-login оболонках.
    Останні збірки також додають попереду поширені каталоги user bin у Linux systemd services (наприклад, `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо вони задані.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повний checkout вихідного коду, можна редагувати, найкраще для contributors.
      Ви локально запускаєте збірки й можете вносити зміни до коду/документації.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію "просто запустити".
      Оновлення надходять із npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між встановленням через npm і git?">
    Так. Установіть інший варіант, а потім запустіть Doctor, щоб сервіс gateway вказував на нову entrypoint.
    Це **не видаляє ваші дані** — змінюється лише спосіб встановлення коду OpenClaw. Ваші state
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

    Doctor виявляє невідповідність entrypoint сервісу gateway і пропонує переписати конфігурацію сервісу відповідно до поточного встановлення (використовуйте `--repair` в автоматизації).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#де-що-зберігається-на-диску).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібен
    найменший поріг входу і вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Плюси:** немає витрат на сервер, прямий доступ до локальних файлів, видиме вікно браузера.
    - **Мінуси:** сон/обриви мережі = відключення, оновлення ОС/перезавантаження переривають роботу, машина має залишатися активною.

    **VPS / хмара**

    - **Плюси:** завжди увімкнений, стабільна мережа, немає проблем зі сном ноутбука, легше підтримувати безперервну роботу.
    - **Мінуси:** часто працює без графічного інтерфейсу (використовуйте знімки екрана), віддалений доступ до файлів, для оновлень потрібен SSH.

    **Примітка щодо OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord усі добре працюють на VPS. Єдиний реальний компроміс — **браузер без графічного інтерфейсу** проти видимого вікна. Див. [Браузер](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо у вас раніше були відключення gateway. Локальний запуск чудово підходить, коли ви активно користуєтеся Mac і хочете локальний доступ до файлів або автоматизацію UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Не обов’язково, але **рекомендовано для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** завжди увімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, легше підтримувати безперервну роботу.
    - **Спільний ноутбук/настільний комп’ютер:** цілком підходить для тестування й активного використання, але очікуйте пауз, коли машина переходить у сон або оновлюється.

    Якщо ви хочете поєднати обидва підходи, тримайте Gateway на виділеному хості, а ноутбук підключайте як **Node** для локальних інструментів screen/camera/exec. Див. [Nodes](/uk/nodes).
    Рекомендації з безпеки дивіться в [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яку ОС рекомендовано?">
    OpenClaw є легким. Для базового Gateway + одного chat channel:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM, ~500 МБ диска.
    - **Рекомендовано:** 1–2 vCPU, 2 ГБ RAM або більше для запасу (журнали, медіа, кілька каналів). Інструменти Node та автоматизація браузера можуть бути ресурсомісткими.

    ОС: використовуйте **Ubuntu LTS** (або будь-яку сучасну Debian/Ubuntu). Шлях встановлення для Linux найкраще протестовано саме там.

    Документація: [Linux](/uk/platforms/linux), [VPS hosting](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди увімкнена, доступна та мати достатньо
    RAM для Gateway і всіх каналів, які ви вмикаєте.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM.
    - **Рекомендовано:** 2 ГБ RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера чи медіаінструменти.
    - **ОС:** Ubuntu LTS або інша сучасна Debian/Ubuntu.

    Якщо ви використовуєте Windows, **WSL2 — це найпростіший варіант налаштування у стилі VM** і він має найкращу
    сумісність з інструментами. Див. [Windows](/uk/platforms/windows), [VPS hosting](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw, в одному абзаці?">
    OpenClaw — це персональний AI assistant, який ви запускаєте на власних пристроях. Він відповідає в тих messaging surfaces, якими ви вже користуєтеся (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat і вбудовані channel plugins, як-от QQ Bot), а також може працювати з голосом + live Canvas на підтримуваних платформах. **Gateway** — це завжди увімкнена control plane; assistant — це сам продукт.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не "просто обгортка для Claude". Це **local-first control plane**, яка дозволяє запускати
    потужного assistant на **вашому власному обладнанні**, з доступом через chat apps, якими ви вже користуєтеся, зі
    session history, memory та інструментами — без передавання контролю над вашими робочими процесами розміщеному
    SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і зберігайте
      workspace + history сеансів локально.
    - **Реальні канали, а не вебпісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      а також мобільний голос і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо з маршрутизацією
      і резервним перемиканням на рівні agent.
    - **Варіант лише локально:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо хочете.
    - **Маршрутизація multi-agent:** окремі agents для кожного каналу, облікового запису чи задачі, кожен із власним
      workspace та типовими налаштуваннями.
    - **Відкритий код і придатність до змін:** перевіряйте, розширюйте й самостійно розміщуйте без vendor lock-in.

    Документація: [Gateway](/uk/gateway), [Channels](/uk/channels), [Multi-agent](/uk/concepts/multi-agent),
    [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував — що мені зробити спочатку?">
    Хороші перші проєкти:

    - Створити вебсайт (WordPress, Shopify або простий статичний сайт).
    - Прототипувати мобільний застосунок (структура, екрани, план API).
    - Організувати файли та папки (очищення, найменування, теги).
    - Підключити Gmail і автоматизувати зведення або подальші дії.

    Він може виконувати великі задачі, але найкраще працює, коли ви розбиваєте їх на етапи та
    використовуєте sub agents для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найпоширеніших повсякденних сценаріїв використання OpenClaw?">
    Повсякденна користь зазвичай виглядає так:

    - **Персональні зведення:** підсумки inbox, календаря та новин, які вас цікавлять.
    - **Дослідження та чернетки:** швидкі дослідження, підсумки та перші чернетки листів або документів.
    - **Нагадування та подальші дії:** підказки й контрольні списки на основі Cron або Heartbeat.
    - **Автоматизація браузера:** заповнення форм, збирання даних і повторювані вебзадачі.
    - **Координація між пристроями:** надішліть задачу з телефону, дозвольте Gateway виконати її на сервері й отримайте результат назад у чаті.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, рекламою та блогами для SaaS?">
    Так, для **дослідження, кваліфікації та підготовки чернеток**. Він може сканувати сайти, складати короткі списки,
    підсумовувати інформацію про потенційних клієнтів і писати чернетки outreach або рекламних текстів.

    Для **outreach або запуску реклами** залишайте людину в циклі. Уникайте спаму, дотримуйтеся місцевих законів і
    політик платформ та перевіряйте все перед надсиланням. Найбезпечніший шаблон — дозволити
    OpenClaw підготувати чернетку, а вам — схвалити її.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний assistant** і рівень координації, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу кодування в репозиторії. Використовуйте OpenClaw, коли вам
    потрібні довготривала пам’ять, доступ із різних пристроїв і оркестрація інструментів.

    Переваги:

    - **Постійна пам’ять + workspace** між сеансами
    - **Доступ із кількох платформ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (browser, files, scheduling, hooks)
    - **Завжди увімкнений Gateway** (запускайте на VPS, взаємодійте звідусіль)
    - **Nodes** для локальних browser/screen/camera/exec

    Вітрина: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills і автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати Skills, не тримаючи репозиторій у брудному стані?">
    Використовуйте керовані overrides замість редагування копії в репозиторії. Розміщуйте свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`, тож керовані overrides усе одно мають вищий пріоритет за вбудовані Skills без змін у git. Якщо вам потрібно, щоб skill було встановлено глобально, але видно лише деяким agents, зберігайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` та `agents.list[].skills`. Лише зміни, варті upstream, повинні жити в репозиторії та надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати Skills із власної папки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий порядок пріоритету: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`. `clawhub` типово встановлює в `./skills`, що OpenClaw трактує як `<workspace>/skills` у наступному сеансі. Якщо skill має бути видимий лише певним agents, поєднуйте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як використовувати різні моделі для різних задач?">
    Сьогодні підтримуються такі шаблони:

    - **Завдання Cron**: ізольовані завдання можуть задавати override `model` для кожного завдання.
    - **Sub-agents**: маршрутизуйте задачі до окремих agents з різними моделями за замовчуванням.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб у будь-який час змінити модель поточного сеансу.

    Див. [Завдання Cron](/uk/automation/cron-jobs), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent) та [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як це винести окремо?">
    Використовуйте **sub-agents** для довгих або паралельних задач. Sub-agents працюють у власному сеансі,
    повертають підсумок і зберігають чутливість вашого основного чату.

    Попросіть свого бота "spawn a sub-agent for this task" або використайте `/subagents`.
    Використовуйте `/status` у чаті, щоб бачити, що Gateway робить прямо зараз (і чи він зайнятий).

    Порада щодо токенів: і довгі задачі, і sub-agents споживають токени. Якщо вартість критична, задайте
    дешевшу модель для sub-agents через `agents.defaults.subagents.model`.

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові задачі](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють прив’язані до thread сеанси subagent у Discord?">
    Використовуйте прив’язки thread. Ви можете прив’язати thread Discord до subagent або цільового сеансу, щоб подальші повідомлення в цьому thread залишалися в межах прив’язаного сеансу.

    Базовий потік:

    - Виконайте spawn через `sessions_spawn` з `thread: true` (і, за потреби, `mode: "session"` для постійного подальшого продовження).
    - Або прив’яжіть вручну за допомогою `/focus <target>`.
    - Використовуйте `/agents`, щоб переглянути стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним зняттям фокуса.
    - Використовуйте `/unfocus`, щоб від’єднати thread.

    Потрібна конфігурація:

    - Глобальні типові налаштування: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Overrides для Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоматична прив’язка під час spawn: задайте `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agents](/uk/tools/subagents), [Discord](/uk/channels/discord), [Довідник із конфігурації](/uk/gateway/configuration-reference), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent завершив роботу, але повідомлення про завершення надійшло не туди або взагалі не було опубліковане. Що перевірити?">
    Спочатку перевірте визначений маршрут запитувача:

    - Доставка subagent у режимі completion надає перевагу будь-якому прив’язаному thread або маршруту conversation, якщо такий існує.
    - Якщо джерело completion містить лише channel, OpenClaw повертається до збереженого маршруту сеансу запитувача (`lastChannel` / `lastTo` / `lastAccountId`), щоб пряма доставка все одно могла спрацювати.
    - Якщо немає ані прив’язаного маршруту, ані придатного збереженого маршруту, пряма доставка може не спрацювати, і результат натомість повернеться до queued delivery сеансу, а не буде негайно опублікований у чаті.
    - Недійсні або застарілі цілі все ще можуть примусити перехід до queue fallback або остаточного збою доставки.
    - Якщо остання видима відповідь assistant дочірнього елемента — це точний silent token `NO_REPLY` / `no_reply` або рівно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує announce, замість того щоб публікувати застарілий попередній прогрес.
    - Якщо дочірній елемент перевищив час очікування після лише викликів інструментів, announce може згорнути це в короткий підсумок часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові задачі](/uk/automation/tasks), [Інструменти сеансів](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron виконується всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання не виконуватимуться.

    Контрольний список:

    - Підтвердьте, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не задано.
    - Перевірте, що Gateway працює 24/7 (без сну/перезапусків).
    - Перевірте налаштування timezone для завдання (`--tz` проти timezone хоста).

    Налагодження:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Документація: [Завдання Cron](/uk/automation/cron-jobs), [Автоматизація та задачі](/uk/automation).

  </Accordion>

  <Accordion title="Cron спрацював, але в channel нічого не було надіслано. Чому?">
    Спочатку перевірте режим доставки:

    - `--no-deliver` / `delivery.mode: "none"` означає, що жодне зовнішнє повідомлення не очікується.
    - Відсутня або недійсна announce target (`channel` / `to`) означає, що runner пропустив вихідну доставку.
    - Збої auth каналу (`unauthorized`, `Forbidden`) означають, що runner намагався виконати доставку, але облікові дані її заблокували.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` only) вважається навмисно непридатним для доставки, тому runner також пригнічує queued fallback delivery.

    Для ізольованих завдань cron runner керує фінальною доставкою. Очікується, що agent
    поверне простий текстовий підсумок, який runner надішле. `--no-deliver` залишає
    цей результат внутрішнім; він не дозволяє agent натомість надсилати його безпосередньо через
    message tool.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Завдання Cron](/uk/automation/cron-jobs), [Фонові задачі](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований запуск cron перемкнув моделі або один раз повторився?">
    Зазвичай це шлях live model-switch, а не дубльоване планування.

    Ізольований cron може зберегти runtime handoff моделі й виконати повторну спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає перемкнені
    provider/model, а якщо перемикання містило новий override auth profile, cron
    також зберігає його перед повторною спробою.

    Пов’язані правила вибору:

    - Override моделі Gmail hook має найвищий пріоритет, коли застосовний.
    - Далі — `model` для окремого завдання.
    - Потім — будь-який збережений override моделі сеансу cron.
    - Потім — звичайний вибір моделі agent/за замовчуванням.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 повторні спроби через перемикання
    cron припиняє роботу замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Завдання Cron](/uk/automation/cron-jobs), [CLI cron](/cli/cron).

  </Accordion>

  <Accordion title="Як установити Skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або розміщуйте Skills у своєму workspace. UI Skills для macOS недоступний на Linux.
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

    Нативна команда `openclaw skills install` записує у каталог `skills/`
    активного workspace. Установлюйте окремий CLI `clawhub`, лише якщо хочете публікувати або
    синхронізувати власні Skills. Для спільних установлень між agents розміщуйте skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете обмежити, які agents можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати задачі за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Завдання Cron** для запланованих або повторюваних задач (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок "основного сеансу".
    - **Ізольовані завдання** для автономних agents, які публікують підсумки або доставляють їх у чати.

    Документація: [Завдання Cron](/uk/automation/cron-jobs), [Автоматизація та задачі](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати Apple Skills лише для macOS із Linux?">
    Не безпосередньо. Skills для macOS обмежуються `metadata.openclaw.os` разом із потрібними бінарними файлами, і Skills з’являються в system prompt лише тоді, коли вони придатні на **хості Gateway**. На Linux Skills лише для `darwin` (як-от `apple-notes`, `apple-reminders`, `things-mac`) не завантажуються, якщо ви не перевизначите це обмеження.

    Є три підтримувані шаблони:

    **Варіант A — запускати Gateway на Mac (найпростіше).**
    Запускайте Gateway там, де є бінарні файли macOS, а потім підключайтеся з Linux у [remote mode](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажуються звичайним чином, тому що хост Gateway — це macOS.

    **Варіант B — використовувати Node macOS (без SSH).**
    Запускайте Gateway на Linux, підключіть Node macOS (menubar app) і встановіть **Node Run Commands** у "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати Skills лише для macOS придатними, коли потрібні бінарні файли є на Node. Agent запускає ці Skills через інструмент `nodes`. Якщо ви виберете "Always Ask", схвалення "Always Allow" у запиті додасть цю команду до allowlist.

    **Варіант C — проксувати бінарні файли macOS через SSH (просунутий варіант).**
    Залиште Gateway на Linux, але налаштуйте так, щоб потрібні CLI-бінарні файли визначалися як SSH-обгортки, що виконуються на Mac. Потім перевизначте skill, щоб дозволити Linux і він залишався придатним.

    1. Створіть SSH-обгортку для бінарного файла (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Додайте обгортку до `PATH` на хості Linux (наприклад, `~/bin/memo`).
    3. Перевизначте metadata skill (workspace або `~/.openclaw/skills`), щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Керування Apple Notes через CLI memo на macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Почніть новий сеанс, щоб знімок Skills оновився.

  </Accordion>

  <Accordion title="У вас є інтеграція з Notion або HeyGen?">
    Наразі вбудованої немає.

    Варіанти:

    - **Власний skill / Plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Автоматизація браузера:** працює без коду, але повільніше й менш надійно.

    Якщо ви хочете зберігати контекст для кожного клієнта окремо (робочі процеси агентства), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + налаштування + активна робота).
    - Попросіть agent отримувати цю сторінку на початку сеансу.

    Якщо вам потрібна нативна інтеграція, створіть feature request або побудуйте skill,
    націлений на ці API.

    Установлення Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активного workspace. Для спільних Skills між agents розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі agents, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі Skills очікують наявності бінарних файлів, установлених через Homebrew; на Linux це означає Linuxbrew (див. запис FAQ про Homebrew на Linux вище). Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати вже виконаний вхід у Chrome з OpenClaw?">
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

    Цей шлях є локальним для хоста. Якщо Gateway запущено деінде, або запускайте хост Node на машині з браузером, або використовуйте віддалений CDP.

    Поточні обмеження `existing-session` / `user`:

    - дії виконуються через ref, а не через CSS-selector
    - завантаження файлів потребує `ref` / `inputRef` і наразі підтримує лише один файл за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії все ще потребують керованого браузера або сирого профілю CDP

  </Accordion>
</AccordionGroup>

## Ізоляція та пам’ять

<AccordionGroup>
  <Accordion title="Чи є окрема документація з ізоляції?">
    Так. Див. [Ізоляція](/uk/gateway/sandboxing). Для специфічного налаштування Docker (повний Gateway у Docker або образи sandbox) див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повну функціональність?">
    Типовий образ орієнтований на безпеку й запускається від користувача `node`, тому він не
    містить системних пакетів, Homebrew або вбудованих браузерів. Для повнішого налаштування:

    - Зберігайте `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші не зникали.
    - Вбудовуйте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Установіть браузери Playwright через вбудований CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Задайте `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я залишити DM приватними, але зробити групи публічними/ізольованими з одним agent?">
    Так — якщо ваш приватний трафік — це **DM**, а публічний трафік — це **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб сеанси груп/channel (ключі не-main) запускалися в Docker, а основний сеанс DM залишався на хості. Потім обмежте, які інструменти доступні в ізольованих сеансах, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: особисті DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Довідник з ключової конфігурації: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати папку хоста до sandbox?">
    Задайте `agents.defaults.sandbox.docker.binds` як `["host:path:mode"]` (наприклад, `"/home/user/src:/src:ro"`). Глобальні прив’язки та прив’язки на рівні agent об’єднуються; прив’язки на рівні agent ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого й пам’ятайте, що прив’язки обходять файлові межі sandbox.

    OpenClaw перевіряє джерела bind за нормалізованим шляхом і за канонічним шляхом, визначеним через найглибший наявний батьківський елемент. Це означає, що виходи через symlink-батьківський шлях усе одно блокуються за принципом fail closed, навіть коли останній сегмент шляху ще не існує, а перевірки allowed-root усе одно застосовуються після розв’язання symlink.

    Див. [Ізоляція](/uk/gateway/sandboxing#custom-bind-mounts) і [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) для прикладів і приміток із безпеки.

  </Accordion>

  <Accordion title="Як працює пам’ять?">
    Пам’ять OpenClaw — це просто файли Markdown у workspace agent:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Кураторські довгострокові нотатки в `MEMORY.md` (лише для main/private sessions)

    OpenClaw також виконує **тихе попереднє скидання пам’яті перед Compaction**, щоб нагадати моделі
    записати стійкі нотатки перед автоматичним Compaction. Це працює лише тоді, коли workspace
    доступний для запису (sandbox у режимі лише читання пропускають це). Див. [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Пам’ять постійно щось забуває. Як зробити, щоб інформація зберігалася?">
    Попросіть бота **записати факт у пам’ять**. Довгострокові нотатки мають зберігатися в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще напрям, який ми вдосконалюємо. Корисно нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона й далі забуває, перевірте, що Gateway використовує той самий
    workspace під час кожного запуску.

    Документація: [Пам’ять](/uk/concepts/memory), [Workspace agent](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається пам’ять назавжди? Які є обмеження?">
    Файли пам’яті зберігаються на диску й існують, доки ви їх не видалите. Обмеженням є ваше
    сховище, а не модель. **Контекст сеансу** все одно обмежений
    вікном context моделі, тому довгі розмови можуть стискатися або обрізатися. Саме тому
    існує пошук у пам’яті — він повертає в контекст лише релевантні частини.

    Документація: [Пам’ять](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потрібен OpenAI API key для семантичного пошуку в пам’яті?">
    Лише якщо ви використовуєте **OpenAI embeddings**. OAuth Codex покриває chat/completions і
    **не** надає доступу до embeddings, тож **вхід через Codex (OAuth або
    вхід через Codex CLI)** не допомагає для семантичного пошуку в пам’яті. Для OpenAI embeddings
    усе одно потрібен справжній API key (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви явно не задаєте provider, OpenClaw автоматично вибирає provider, коли
    може визначити API key (auth profiles, `models.providers.*.apiKey` або env vars).
    Він надає перевагу OpenAI, якщо вдається визначити ключ OpenAI, інакше Gemini, якщо вдається визначити ключ Gemini,
    потім Voyage, потім Mistral. Якщо жоден віддалений ключ недоступний, пошук у пам’яті
    залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштовано й наявний шлях до локальної моделі, OpenClaw
    надає перевагу `local`. Ollama підтримується, якщо ви явно задаєте
    `memorySearch.provider = "ollama"`.

    Якщо ви хочете залишатися локально, задайте `memorySearch.provider = "local"` (і за потреби
    `memorySearch.fallback = "none"`). Якщо вам потрібні Gemini embeddings, задайте
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо embedding-моделі **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    див. [Пам’ять](/uk/concepts/memory) для деталей налаштування.

  </Accordion>
</AccordionGroup>

## Де що зберігається на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, що використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** sessions, файли пам’яті, config і workspace зберігаються на хості Gateway
      (`~/.openclaw` + каталог вашого workspace).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте провайдерам моделей (Anthropic/OpenAI тощо), надходять до
      їхніх API, а chat platforms (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на
      своїх серверах.
    - **Ви контролюєте масштаб:** використання локальних моделей залишає prompts на вашій машині, але трафік
      channel усе одно проходить через сервери відповідного каналу.

    Пов’язане: [Workspace agent](/uk/concepts/agent-workspace), [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе зберігається в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Path                                                            | Призначення                                                       |
    | --------------------------------------------------------------- | ----------------------------------------------------------------- |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основний config (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy OAuth import (копіюється в auth profiles під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, API keys і необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язкове файлове корисне навантаження secret для провайдерів `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Legacy compatibility file (статичні записи `api_key` очищаються) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан provider (наприклад, `whatsapp/<accountId>/creds.json`)     |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан для кожного agent (agentDir + sessions)                     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | History та стан розмов (для кожного agent)                       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані sessions (для кожного agent)                            |

    Шлях legacy single-agent: `~/.openclaw/agent/*` (мігрується командою `openclaw doctor`).

    Ваш **workspace** (`AGENTS.md`, файли пам’яті, Skills тощо) зберігається окремо та налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають зберігатися AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли зберігаються у **workspace agent**, а не в `~/.openclaw`.

    - **Workspace (для кожного agent):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (або legacy fallback `memory.md`, коли `MEMORY.md` відсутній),
      `memory/YYYY-MM-DD.md`, необов’язковий `HEARTBEAT.md`.
    - **Каталог state (`~/.openclaw`)**: config, стан channel/provider, auth profiles, sessions, журнали
      і спільні Skills (`~/.openclaw/skills`).

    Типовий workspace: `~/.openclaw/workspace`, налаштовується через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот "забуває" після перезапуску, переконайтеся, що Gateway використовує той самий
    workspace під час кожного запуску (і пам’ятайте: remote mode використовує **workspace хоста gateway**,
    а не вашого локального ноутбука).

    Порада: якщо ви хочете зберегти поведінку або вподобання надовго, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладайтеся на history чату.

    Див. [Workspace agent](/uk/concepts/agent-workspace) і [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Розмістіть свій **workspace agent** у **приватному** git-репозиторії та робіть його резервні копії в
    приватному місці (наприклад, GitHub private). Це охоплює memory + файли AGENTS/SOUL/USER
    і дозволяє пізніше відновити "розум" assistant.

    **Не** виконуйте commit для будь-чого з `~/.openclaw` (облікові дані, sessions, tokens або зашифровані payload secret).
    Якщо вам потрібне повне відновлення, окремо робіть резервні копії і workspace, і каталогу state
    (див. питання про міграцію вище).

    Документація: [Workspace agent](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окремий посібник: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть agents працювати поза workspace?">
    Так. Workspace — це **типовий cwd** і якір пам’яті, а не жорстка sandbox.
    Відносні шляхи розв’язуються в межах workspace, але абсолютні шляхи можуть отримувати доступ до інших
    розташувань хоста, якщо sandboxing не ввімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування sandbox для окремого agent. Якщо ви
    хочете, щоб репозиторій був типовим робочим каталогом, вкажіть `workspace`
    цього agent на корінь репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
    workspace окремо, якщо ви свідомо не хочете, щоб agent працював усередині нього.

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

  <Accordion title="Remote mode: де зберігаються sessions?">
    Стан sessions належить **хосту gateway**. Якщо ви використовуєте remote mode, потрібне вам сховище sessions розташоване на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Керування сеансами](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи config

<AccordionGroup>
  <Accordion title="Який формат має config? Де він розташований?">
    OpenClaw читає необов’язковий config **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються досить безпечні значення за замовчуванням (зокрема типовий workspace `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я задав gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Прив’язки не-loopback **потребують коректного шляху auth gateway**. На практиці це означає:

    - auth зі shared secret: token або password
    - `gateway.auth.mode: "trusted-proxy"` за правильно налаштованим identity-aware reverse proxy не в режимі loopback

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

    - `gateway.remote.token` / `.password` самі по собі **не** вмикають auth локального gateway.
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як fallback лише тоді, коли `gateway.auth.*` не задано.
    - Для auth через password задайте `gateway.auth.mode: "password"` разом із `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і його не вдається визначити, визначення завершується fail closed (без маскування через remote fallback).
    - Конфігурації Control UI зі shared secret проходять автентифікацію через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях app/UI). Режими з передаванням ідентичності, як-от Tailscale Serve або `trusted-proxy`, натомість використовують заголовки запиту. Уникайте розміщення shared secrets в URL.
    - З `gateway.auth.mode: "trusted-proxy"` reverse proxy loopback на тому ж хості все одно **не** задовольняють auth trusted-proxy. Trusted proxy має бути налаштованим джерелом не-loopback.

  </Accordion>

  <Accordion title="Чому тепер на localhost мені потрібен token?">
    OpenClaw типово примусово застосовує auth gateway, зокрема для loopback. У звичайному типовому сценарії це означає auth через token: якщо не налаштовано явний шлях auth, під час запуску gateway використовується режим token і token генерується автоматично зі збереженням у `gateway.auth.token`, тому **локальні WS-клієнти мають проходити автентифікацію**. Це блокує іншим локальним процесам можливість викликати Gateway.

    Якщо ви надаєте перевагу іншому шляху auth, можна явно вибрати режим password (або, для non-loopback identity-aware reverse proxy, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно задайте `gateway.auth.mode: "none"` у своєму config. Doctor може будь-коли згенерувати token для вас: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни config?">
    Gateway відстежує config і підтримує hot-reload:

    - `gateway.reload.mode: "hybrid"` (типово): безпечні зміни застосовуються гаряче, для критичних виконується перезапуск
    - також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні tagline у CLI?">
    Задайте `cli.banner.taglineMode` у config:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: приховує текст tagline, але залишає рядок назви/версії банера.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: ротація кумедних/сезонних tagline (типова поведінка).
    - Якщо ви взагалі не хочете банер, задайте env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути web search (і web fetch)?">
    `web_fetch` працює без API key. `web_search` залежить від вибраного
    provider:

    - Провайдери на основі API, такі як Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, вимагають звичайного налаштування API key.
    - Ollama Web Search не потребує key, але використовує налаштований вами хост Ollama і вимагає `ollama signin`.
    - DuckDuckGo не потребує key, але це неофіційна інтеграція на основі HTML.
    - SearXNG не потребує key / є self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Рекомендовано:** виконайте `openclaw configure --section web` і виберіть provider.
    Альтернативи через environment:

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

    Конфігурація web-search, специфічна для provider, тепер розміщується в `plugins.entries.<plugin>.config.webSearch.*`.
    Legacy-шляхи provider у `tools.web.search.*` усе ще тимчасово завантажуються для сумісності, але їх не слід використовувати в нових config.
    Конфігурація fallback для Firecrawl web-fetch розміщується в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlist, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнено за замовчуванням (якщо його не вимкнено явно).
    - Якщо `tools.web.fetch.provider` не вказано, OpenClaw автоматично визначає перший готовий fallback provider для fetch із доступних облікових даних. Наразі вбудованим provider є Firecrawl.
    - Daemon читають env vars з `~/.openclaw/.env` (або середовища сервісу).

    Документація: [Web tools](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мій config. Як відновитися й уникнути цього?">
    `config.apply` замінює **весь config**. Якщо ви надсилаєте частковий об’єкт, усе
    інше видаляється.

    Відновлення:

    - Відновіть із резервної копії (git або скопійований `~/.openclaw/openclaw.json`).
    - Якщо резервної копії немає, повторно виконайте `openclaw doctor` і заново налаштуйте channels/models.
    - Якщо це було неочікувано, створіть bug report і додайте останній відомий config або будь-яку резервну копію.
    - Локальний coding agent часто може відновити робочий config із журналів або history.

    Як уникнути:

    - Для невеликих змін використовуйте `openclaw config set`.
    - Для інтерактивного редагування використовуйте `openclaw configure`.
    - Спочатку використовуйте `config.schema.lookup`, якщо не впевнені щодо точного шляху або форми поля; він повертає вузол неглибокої schema плюс підсумки безпосередніх дочірніх елементів для подальшого заглиблення.
    - Для часткових редагувань через RPC використовуйте `config.patch`; залиште `config.apply` лише для повної заміни config.
    - Якщо ви використовуєте доступний лише owner інструмент `gateway` із запуску agent, він усе одно відхилятиме записи в `tools.exec.ask` / `tools.exec.security` (включно з legacy-псевдонімами `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими workers на різних пристроях?">
    Типовий шаблон — **один Gateway** (наприклад, Raspberry Pi) плюс **Nodes** і **agents**:

    - **Gateway (центральний):** володіє channels (Signal/WhatsApp), routing і sessions.
    - **Nodes (пристрої):** Mac/iOS/Android підключаються як периферійні пристрої й надають локальні інструменти (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** окремі мозки/workspaces для спеціальних ролей (наприклад, "Hetzner ops", "Personal data").
    - **Sub-agents:** запускають фонову роботу з main agent, коли вам потрібен паралелізм.
    - **TUI:** підключається до Gateway і перемикає agents/sessions.

    Документація: [Nodes](/uk/nodes), [Віддалений доступ](/uk/gateway/remote), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Чи може браузер OpenClaw працювати без графічного інтерфейсу?">
    Так. Це параметр config:

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

    Типове значення — `false` (із графічним інтерфейсом). Режим headless з більшою ймовірністю активує перевірки anti-bot на деяких сайтах. Див. [Браузер](/uk/tools/browser).

    У режимі headless використовується **той самий рушій Chromium** і він підходить для більшості сценаріїв автоматизації (форми, кліки, скрапінг, входи). Основні відмінності:

    - Немає видимого вікна браузера (використовуйте знімки екрана, якщо вам потрібна візуалізація).
    - Деякі сайти суворіше ставляться до автоматизації в режимі headless (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує сеанси headless.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Задайте `browser.executablePath` для вашого бінарного файла Brave (або будь-якого браузера на основі Chromium) і перезапустіть Gateway.
    Див. повні приклади config у [Браузер](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені Gateway і Nodes

<AccordionGroup>
  <Accordion title="Як команди поширюються між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає agent і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен інструмент node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідний трафік provider; вони отримують лише виклики RPC node.

  </Accordion>

  <Accordion title="Як мій agent може отримати доступ до мого комп’ютера, якщо Gateway розміщено віддалено?">
    Коротка відповідь: **підключіть ваш комп’ютер як Node**. Gateway працює в іншому місці, але може
    викликати інструменти `node.*` (screen, camera, system) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на завжди увімкненому хості (VPS/домашній сервер).
    2. Підключіть хост Gateway і ваш комп’ютер до однієї tailnet.
    3. Переконайтеся, що Gateway WS доступний (прив’язка tailnet або SSH tunnel).
    4. Локально відкрийте застосунок macOS і підключіться в режимі **Remote over SSH** (або безпосередньо через tailnet),
       щоб він міг зареєструватися як Node.
    5. Схваліть Node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP bridge не потрібен; Nodes підключаються через Gateway WebSocket.

    Нагадування щодо безпеки: підключення Node macOS дозволяє `system.run` на цій машині. Підключайте
    лише пристрої, яким ви довіряєте, і перегляньте [Безпека](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Протокол Gateway](/uk/gateway/protocol), [Віддалений режим macOS](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключений, але я не отримую відповідей. Що тепер?">
    Перевірте базові речі:

    - Gateway працює: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан channel: `openclaw channels status`

    Потім перевірте auth і routing:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` налаштовано правильно.
    - Якщо ви підключаєтеся через SSH tunnel, підтвердьте, що локальний tunnel активний і вказує на правильний port.
    - Переконайтеся, що ваші allowlist (DM або group) містять ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Channels](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два екземпляри OpenClaw спілкуватися між собою (локальний + VPS)?">
    Так. Вбудованого bridge "bot-to-bot" немає, але це можна налаштувати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний chat channel, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надсилає повідомлення Bot B, а потім Bot B відповідає як завжди.

    **CLI bridge (загальний):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючи його на чат, який слухає інший бот.
    Якщо один бот працює на віддаленому VPS, спрямуйте ваш CLI на той віддалений Gateway
    через SSH/Tailscale (див. [Віддалений доступ](/uk/gateway/remote)).

    Приклад шаблону (запускається з машини, яка може досягти цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте запобіжник, щоб два боти не зациклювалися нескінченно (відповідь лише на згадування, channel
    allowlist або правило "не відповідати на повідомлення ботів").

    Документація: [Віддалений доступ](/uk/gateway/remote), [CLI Agent](/cli/agent), [Надсилання Agent](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох agents?">
    Ні. Один Gateway може розміщувати кількох agents, кожен із власним workspace, типовими моделями
    і routing. Це типовий сценарій, і він значно дешевший і простіший, ніж запускати
    один VPS на agent.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні config, якими ви не хочете ділитися. В іншому разі тримайте один Gateway і
    використовуйте кількох agents або sub-agents.

  </Accordion>

  <Accordion title="Чи є перевага у використанні Node на моєму особистому ноутбуці замість SSH із VPS?">
    Так — Nodes є основним способом отримати доступ до вашого ноутбука з віддаленого Gateway, і вони
    надають більше, ніж просто доступ до shell. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (достатньо невеликого VPS або пристрою рівня Raspberry Pi; 4 ГБ RAM більш ніж досить), тому типовим
    варіантом є завжди увімкнений хост і ваш ноутбук як Node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують pairing пристроїв.
    - **Безпечніший контроль виконання.** `system.run` контролюється allowlist/schvalеннями Node на цьому ноутбуці.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна автоматизація браузера.** Тримайте Gateway на VPS, але запускайте Chrome локально через хост Node на ноутбуці або підключайтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для епізодичного доступу до shell, але Nodes простіші для постійних робочих процесів agent і
    автоматизації пристроїв.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають Nodes сервіс gateway?">
    Ні. На хості має працювати лише **один gateway**, якщо тільки ви навмисно не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)). Nodes — це периферійні компоненти, які підключаються
    до gateway (Nodes iOS/Android або режим macOS "node mode" у застосунку menubar). Для headless-хостів node
    і керування через CLI див. [CLI Node host](/cli/node).

    Повний перезапуск потрібен для змін `gateway`, `discovery` і `canvasHost`.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати config?">
    Так.

    - `config.schema.lookup`: перевірити одне піддерево config із його неглибоким вузлом schema, відповідною підказкою UI та зведеннями безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний snapshot + hash
    - `config.patch`: безпечне часткове оновлення (кращий варіант для більшості редагувань через RPC); виконує hot-reload, коли це можливо, і перезапускає, коли потрібно
    - `config.apply`: перевіряє й замінює весь config; виконує hot-reload, коли це можливо, і перезапускає, коли потрібно
    - Інструмент runtime `gateway`, доступний лише owner, як і раніше відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; legacy-аліаси `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

  </Accordion>

  <Accordion title="Мінімальний адекватний config для першого встановлення">
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

    1. **Встановіть і виконайте вхід на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Встановіть і виконайте вхід на Mac**
       - Використайте застосунок Tailscale і увійдіть у ту саму tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - У консолі адміністратора Tailscale увімкніть MagicDNS, щоб VPS мав стабільне ім’я.
    4. **Використовуйте ім’я хоста tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо вам потрібен Control UI без SSH, використовуйте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив’язаним до loopback і надає HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як підключити Node Mac до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Control UI + WS Gateway**. Nodes підключаються через той самий endpoint Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS і Mac перебувають в одній tailnet**.
    2. **Використовуйте застосунок macOS у remote mode** (SSH-ціллю може бути ім’я хоста tailnet).
       Застосунок тунелюватиме порт Gateway і підключиться як Node.
    3. **Схваліть Node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Протокол Gateway](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [Віддалений режим macOS](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи варто встановлювати на другий ноутбук чи просто додати Node?">
    Якщо вам потрібні лише **локальні інструменти** (screen/camera/exec) на другому ноутбуці, додайте його як
    **Node**. Це дозволяє зберегти один Gateway і уникнути дублювання config. Локальні інструменти node
    наразі доступні лише на macOS, але ми плануємо поширити їх і на інші ОС.

    Встановлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes), [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars і завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує environment variables?">
    OpenClaw читає env vars із батьківського процесу (shell, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного робочого каталогу
    - глобальний fallback `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден із файлів `.env` не перевизначає наявні env vars.

    Ви також можете визначати inline env vars у config (застосовуються, лише якщо їх немає в env процесу):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Див. [/environment](/uk/help/environment) для повного порядку пріоритетів і джерел.

  </Accordion>

  <Accordion title="Я запустив Gateway через сервіс, і мої env vars зникли. Що тепер?">
    Є два поширені способи виправлення:

    1. Помістіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися, навіть коли сервіс не успадковує env вашого shell.
    2. Увімкніть імпорт із shell (необов’язкова зручність):

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

  <Accordion title='Я задав COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` показує, чи увімкнено **імпорт env із shell**. "Shell env: off"
    **не** означає, що ваших env vars немає — це лише означає, що OpenClaw не буде
    автоматично завантажувати ваш login shell.

    Якщо Gateway працює як сервіс (launchd/systemd), він не успадковує env вашого shell.
    Виправити це можна одним зі способів:

    1. Помістіть token у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або увімкніть імпорт із shell (`env.shellEnv.enabled: true`).
    3. Або додайте його до блоку `env` у config (застосовується лише за відсутності).

    Потім перезапустіть gateway і знову перевірте:

    ```bash
    openclaw models status
    ```

    Tokens Copilot читаються з `COPILOT_GITHUB_TOKEN` (також `GH_TOKEN` / `GITHUB_TOKEN`).
    Див. [/concepts/model-providers](/uk/concepts/model-providers) і [/environment](/uk/help/environment).

  </Accordion>
</AccordionGroup>

## Sessions і кілька чатів

<AccordionGroup>
  <Accordion title="Як почати нову розмову?">
    Надішліть `/new` або `/reset` як окреме повідомлення. Див. [Керування сеансами](/uk/concepts/session).
  </Accordion>

  <Accordion title="Чи скидаються sessions автоматично, якщо я ніколи не надсилаю /new?">
    Sessions можуть завершуватися після `session.idleMinutes`, але це **вимкнено за замовчуванням** (типове значення **0**).
    Задайте додатне значення, щоб увімкнути завершення через неактивність. Коли це ввімкнено, **наступне**
    повідомлення після періоду неактивності починає новий session id для цього ключа чату.
    Це не видаляє transcripts — просто починається новий session.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб створити команду з екземплярів OpenClaw (один CEO і багато agents)?">
    Так, через **маршрутизацію multi-agent** і **sub-agents**. Ви можете створити одного координатора
    agent і кількох worker agents із власними workspace і моделями.

    Втім, це краще розглядати як **цікавий експеримент**. Це потребує багато токенів і часто
    менш ефективно, ніж використання одного бота з окремими sessions. Типова модель, яку
    ми бачимо, — це один бот, з яким ви спілкуєтеся, але з різними sessions для паралельної роботи. Цей
    бот також може запускати sub-agents за потреби.

    Документація: [Маршрутизація multi-agent](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [CLI Agents](/cli/agents).

  </Accordion>

  <Accordion title="Чому context було обрізано посеред задачі? Як цьому запобігти?">
    Context сеансу обмежений вікном моделі. Довгі чати, великі виводи інструментів або багато
    файлів можуть спричинити Compaction або обрізання.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими задачами, а `/new` — при зміні теми.
    - Тримайте важливий context у workspace і просіть бота перечитувати його.
    - Використовуйте sub-agents для довгої або паралельної роботи, щоб основний чат залишався меншим.
    - Виберіть модель із більшим вікном context, якщо це трапляється часто.

  </Accordion>

  <Accordion title="Як повністю скинути OpenClaw, але залишити його встановленим?">
    Використайте команду reset:

    ```bash
    openclaw reset
    ```

    Неінтерактивне повне скидання:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Потім повторно запустіть налаштування:

    ```bash
    openclaw onboard --install-daemon
    ```

    Примітки:

    - Онбординг також пропонує **Reset**, якщо бачить наявний config. Див. [Онбординг (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен каталог state (типові значення: `~/.openclaw-<profile>`).
    - Dev reset: `openclaw gateway --dev --reset` (лише для dev; очищає config dev + credentials + sessions + workspace).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або стиснути?'>
    Використайте один із варіантів:

    - **Compact** (зберігає розмову, але підсумовує старіші ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб спрямувати підсумок.

    - **Reset** (новий session ID для того самого ключа чату):

      ```
      /new
      /reset
      ```

    Якщо це трапляється й далі:

    - Увімкніть або налаштуйте **обрізання sessions** (`agents.defaults.contextPruning`), щоб скорочувати старий вивід інструментів.
    - Використовуйте модель із більшим вікном context.

    Документація: [Compaction](/uk/concepts/compaction), [Обрізання sessions](/uk/concepts/session-pruning), [Керування сеансами](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка перевірки provider: модель видала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що history сеансу застаріла або пошкоджена (часто після довгих threads
    або зміни інструмента/schema).

    Виправлення: почніть новий session за допомогою `/new` (окремим повідомленням).

  </Accordion>

  <Accordion title="Чому я отримую heartbeat-повідомлення кожні 30 хвилин?">
    Heartbeat запускається кожні **30 хв** за замовчуванням (**1 год** при використанні OAuth auth). Налаштуйте або вимкніть це:

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
    на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб зберегти API calls.
    Якщо файл відсутній, heartbeat усе одно запускається, і модель вирішує, що робити.

    Overrides для окремого agent використовують `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "обліковий запис бота" до групи WhatsApp?'>
    Ні. OpenClaw працює з **вашого власного облікового запису**, тож якщо ви перебуваєте в групі, OpenClaw може її бачити.
    За замовчуванням відповіді в групах блокуються, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

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
    Варіант 1 (найшвидший): дивіться хвіст журналів і надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Знайдіть `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано / внесено до allowlist): перелічіть групи з config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/cli/directory), [Журнали](/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Є дві поширені причини:

    - Увімкнено gating за згадуванням (типово). Ви маєте @згадати бота (або відповідати `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і групу не внесено до allowlist.

    Див. [Групи](/uk/channels/groups) і [Повідомлення груп](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи спільний context у груп/thread і DM?">
    Прямі чати типово зводяться до main session. Групи/channels мають власні ключі session, а теми Telegram / threads Discord — це окремі sessions. Див. [Групи](/uk/channels/groups) і [Повідомлення груп](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки workspaces і agents я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але звертайте увагу на:

    - **Зростання дискового простору:** sessions + transcripts зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартість токенів:** більше agents означає більше одночасного використання моделей.
    - **Операційні витрати:** auth profiles, workspaces і channel routing для кожного agent.

    Поради:

    - Тримайте один **активний** workspace на agent (`agents.defaults.workspace`).
    - Очищайте старі sessions (видаляйте записи JSONL або записи сховища), якщо диск розростається.
    - Використовуйте `openclaw doctor`, щоб виявляти зайві workspaces і невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я запускати кількох ботів або чатів одночасно (Slack), і як це краще налаштувати?">
    Так. Використовуйте **маршрутизацію Multi-Agent**, щоб запускати кілька ізольованих agents і маршрутизувати вхідні повідомлення за
    channel/account/peer. Slack підтримується як channel і може бути прив’язаний до конкретних agents.

    Доступ до браузера потужний, але це не "робити все, що може людина" — anti-bot, CAPTCHA і MFA
    все ще можуть блокувати автоматизацію. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на хості
    або CDP на машині, яка фактично запускає браузер.

    Рекомендована схема налаштування:

    - Завжди увімкнений хост Gateway (VPS/Mac mini).
    - Один agent на кожну роль (bindings).
    - Канали Slack, прив’язані до цих agents.
    - Локальний браузер через Chrome MCP або Node, коли потрібно.

    Документація: [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Браузер](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: значення за замовчуванням, вибір, псевдоніми, перемикання

<AccordionGroup>
  <Accordion title='Що таке "модель за замовчуванням"?'>
    Модель за замовчуванням в OpenClaw — це те, що ви задаєте як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються як `provider/model` (приклад: `openai/gpt-5.4`). Якщо ви пропускаєте provider, OpenClaw спочатку намагається знайти псевдонім, потім — унікальний збіг налаштованого provider для цього точного model id, і лише після цього використовує налаштований provider за замовчуванням як застарілий шлях сумісності. Якщо цей provider більше не надає налаштовану модель за замовчуванням, OpenClaw перемикається на перший налаштований provider/model замість того, щоб показувати застаріле типове значення від видаленого provider. Вам усе одно слід **явно** задавати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендоване значення за замовчуванням:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку provider.
    **Для agents з інструментами або недовіреним input:** надавайте перевагу силі моделі над вартістю.
    **Для звичайного/низькоризикового чату:** використовуйте дешевші резервні моделі та маршрутизуйте за роллю agent.

    Для MiniMax є окрема документація: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Правило великого пальця: використовуйте **найкращу модель, яку можете собі дозволити** для високоризикових задач, і дешевшу
    модель для звичайного чату або підсумків. Ви можете маршрутизувати моделі за agent і використовувати sub-agents для
    паралелізації довгих задач (кожен sub-agent споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Sub-agents](/uk/tools/subagents).

    Сильне попередження: слабші або надмірно квантизовані моделі більш вразливі до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Докладніше: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі без стирання config?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни config.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для окремого session)
    - `openclaw models set ...` (оновлює лише config моделі)
    - `openclaw configure --section model` (інтерактивно)
    - редагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` із частковим об’єктом, якщо не маєте наміру замінити весь config.
    Для редагувань через RPC спочатку перевіряйте через `config.schema.lookup` і надавайте перевагу `config.patch`. Payload lookup надає нормалізований шлях, документацію/обмеження неглибокої schema та зведення безпосередніх дочірніх елементів
    для часткових оновлень.
    Якщо ви все ж перезаписали config, відновіть його з резервної копії або повторно виконайте `openclaw doctor` для відновлення.

    Документація: [Моделі](/uk/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати self-hosted моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Встановіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо вам потрібні також хмарні моделі, виконайте `ollama signin`
    4. Виконайте `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` надає вам хмарні моделі плюс ваші локальні моделі Ollama
    - хмарні моделі, такі як `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі більш вразливі до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все ж хочете маленькі моделі, увімкніть sandboxing і суворі allowlist інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Ізоляція](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися й змінюватися з часом; фіксованої рекомендації щодо provider немає.
    - Перевіряйте поточне налаштування runtime на кожному gateway за допомогою `openclaw models status`.
    - Для чутливих до безпеки agents з інструментами використовуйте найсильнішу доступну модель останнього покоління.
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

    Ви можете переглянути доступні моделі за допомогою `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований вибір. Вибирайте за номером:

    ```
    /model 3
    ```

    Ви також можете примусово задати конкретний auth profile для provider (для session):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який agent активний, який файл `auth-profiles.json` використовується та який auth profile буде випробувано наступним.
    Також він показує налаштований endpoint provider (`baseUrl`) і режим API (`api`), коли це доступно.

    **Як зняти прив’язку profile, який я задав через @profile?**

    Повторно виконайте `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо ви хочете повернутися до значення за замовчуванням, виберіть його через `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який auth profile активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.2 для щоденних задач, а Codex 5.3 — для кодування?">
    Так. Задайте одну модель як типову, а потім перемикайтеся за потреби:

    - **Швидке перемикання (для session):** `/model gpt-5.4` для щоденних задач, `/model openai-codex/gpt-5.4` для кодування через Codex OAuth.
    - **Типова + перемикання:** задайте `agents.defaults.model.primary` як `openai/gpt-5.4`, а потім перемикайтеся на `openai-codex/gpt-5.4` для кодування (або навпаки).
    - **Sub-agents:** маршрутизуйте задачі кодування до sub-agents з іншою типовою моделлю.

    Див. [Моделі](/uk/concepts/models) і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.4?">
    Використовуйте або перемикач для session, або значення за замовчуванням у config:

    - **Для session:** надішліть `/fast on`, поки session використовує `openai/gpt-5.4` або `openai-codex/gpt-5.4`.
    - **Типово для моделі:** задайте `agents.defaults.models["openai/gpt-5.4"].params.fastMode` як `true`.
    - **Також для Codex OAuth:** якщо ви також використовуєте `openai-codex/gpt-5.4`, задайте той самий прапорець і там.

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

    Для OpenAI fast mode відповідає `service_tier = "priority"` у підтримуваних нативних запитах Responses. Перевизначення `/fast` для session мають вищий пріоритет за типові значення config.

    Див. [Thinking і fast mode](/uk/tools/thinking) та [OpenAI fast mode](/uk/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо задано `agents.defaults.models`, це стає **allowlist** для `/model` і будь-яких
    перевизначень session. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, приберіть allowlist або виберіть модель із `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **provider не налаштовано** (не знайдено config provider MiniMax або auth
    profile), тому модель неможливо визначити.

    Контрольний список для виправлення:

    1. Оновіться до актуального релізу OpenClaw (або запускайте з вихідного коду `main`), а потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (майстер або JSON) або що auth MiniMax
       існує в env/auth profiles, щоб можна було підставити відповідний provider
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений OAuth MiniMax
       для `minimax-portal`).
    3. Використовуйте точний model id (з урахуванням регістру) для вашого шляху auth:
       `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed` для налаштування
       через API key, або `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування через OAuth.
    4. Виконайте:

       ```bash
       openclaw models list
       ```

       і виберіть зі списку (або `/model list` у чаті).

    Див. [MiniMax](/uk/providers/minimax) і [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати MiniMax як типову модель, а OpenAI — для складних задач?">
    Так. Використовуйте **MiniMax як модель за замовчуванням** і перемикайте моделі **для session** за потреби.
    Резервні моделі призначені для **помилок**, а не для "складних задач", тому використовуйте `/model` або окремого agent.

    **Варіант A: перемикання для session**

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

    **Варіант B: окремі agents**

    - Agent A типово: MiniMax
    - Agent B типово: OpenAI
    - Маршрутизуйте за agent або використовуйте `/agent` для перемикання

    Документація: [Моделі](/uk/concepts/models), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома типовими скороченнями (застосовуються лише тоді, коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви задасте власний псевдонім із такою самою назвою, ваше значення матиме пріоритет.

  </Accordion>

  <Accordion title="Як визначити/перевизначити скорочення моделей (псевдоніми)?">
    Псевдоніми беруться з `agents.defaults.models.<modelId>.alias`. Приклад:

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

    Тоді `/model sonnet` (або `/<alias>`, коли підтримується) визначатиметься як цей model ID.

  </Accordion>

  <Accordion title="Як додати моделі від інших providers, як-от OpenRouter або Z.AI?">
    OpenRouter (оплата за токени; багато моделей):

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

    Якщо ви посилаєтеся на provider/model, але потрібний ключ provider відсутній, ви отримаєте помилку auth під час виконання (наприклад, `No API key found for provider "zai"`).

    **No API key found for provider після додавання нового agent**

    Зазвичай це означає, що **новий agent** має порожнє сховище auth. Auth є окремим для кожного agent і
    зберігається тут:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Виконайте `openclaw agents add <id>` і налаштуйте auth у майстрі.
    - Або скопіюйте `auth-profiles.json` з `agentDir` основного agent у `agentDir` нового agent.

    **Не** використовуйте спільний `agentDir` для кількох agents; це призводить до колізій auth/session.

  </Accordion>
</AccordionGroup>

## Резервне перемикання моделей і "All models failed"

<AccordionGroup>
  <Accordion title="Як працює резервне перемикання?">
    Резервне перемикання відбувається у два етапи:

    1. **Ротація auth profile** в межах того самого provider.
    2. **Резервне перемикання моделі** на наступну модель із `agents.defaults.model.fallbacks`.

    До профілів, що дають збій, застосовуються cooldown (експоненційний backoff), тож OpenClaw може й далі відповідати, навіть коли provider обмежений rate limit або тимчасово не працює.

    Кошик rate limit включає не лише звичайні відповіді `429`. OpenClaw
    також вважає вартими резервного перемикання rate limit такі повідомлення, як `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    обмеження вікон використання (`weekly/monthly limit reached`).

    Деякі відповіді, схожі на billing, не мають коду `402`, а деякі відповіді HTTP `402`
    також залишаються в цьому тимчасовому кошику. Якщо provider повертає
    явний текст billing у `401` або `403`, OpenClaw усе одно може залишити це в
    лінії billing, але зіставлення текстів, специфічних для provider, залишаються обмеженими
    provider, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Якщо повідомлення `402`
    натомість виглядає як таке, що можна повторити для вікна використання або
    ліміту витрат organization/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw трактує це як
    `rate_limit`, а не як тривале вимкнення через billing.

    Помилки переповнення context відрізняються: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху Compaction/повторної спроби замість переходу до
    резервного перемикання моделі.

    Загальний текст server error навмисно вужчий, ніж "усе, що містить
    unknown/error". OpenClaw дійсно трактує тимчасові форми, обмежені provider,
    такі як просте Anthropic `An unknown error occurred`, просте OpenRouter
    `Provider returned error`, помилки причини зупинки на кшталт `Unhandled stop reason:
    error`, JSON-payload `api_error` із тимчасовим текстом server error
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості provider, такі як `ModelNotReadyException`, як
    сигнали timeout/overloaded, варті резервного перемикання, коли контекст provider
    збігається.
    Загальний внутрішній fallback-текст на кшталт `LLM request failed with an unknown
    error.` залишається консервативним і сам по собі не запускає резервне перемикання моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система спробувала використати ID auth profile `anthropic:default`, але не змогла знайти для нього облікові дані в очікуваному сховищі auth.

    **Контрольний список для виправлення:**

    - **Підтвердьте, де зберігаються auth profiles** (нові та legacy-шляхи)
      - Поточний шлях: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Legacy: `~/.openclaw/agent/*` (мігрується командою `openclaw doctor`)
    - **Підтвердьте, що Gateway завантажує вашу env var**
      - Якщо ви задали `ANTHROPIC_API_KEY` у своєму shell, але запускаєте Gateway через systemd/launchd, він може її не успадкувати. Помістіть її в `~/.openclaw/.env` або ввімкніть `env.shellEnv`.
    - **Переконайтеся, що ви редагуєте правильного agent**
      - У конфігураціях multi-agent може бути кілька файлів `auth-profiles.json`.
    - **Перевірте стан model/auth**
      - Використовуйте `openclaw models status`, щоб побачити налаштовані моделі та чи автентифіковано providers.

    **Контрольний список для виправлення "No credentials found for profile anthropic"**

    Це означає, що виконання прив’язане до auth profile Anthropic, але Gateway
    не може знайти його у своєму сховищі auth.

    - **Використовуйте Claude CLI**
      - Виконайте `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо ви хочете натомість використовувати API key**
      - Помістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистьте будь-який закріплений порядок, який примусово вимагає відсутній profile:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Підтвердьте, що ви запускаєте команди на хості gateway**
      - У remote mode auth profiles зберігаються на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому він також спробував Google Gemini і завершився помилкою?">
    Якщо ваш config моделі містить Google Gemini як резервний варіант (або ви перемкнулися на скорочення Gemini), OpenClaw спробує його під час резервного перемикання моделі. Якщо ви не налаштували облікові дані Google, ви побачите `No API key found for provider "google"`.

    Виправлення: або надайте auth Google, або приберіть / не використовуйте моделі Google у `agents.defaults.model.fallbacks` / псевдонімах, щоб резервне перемикання не вело туди.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Причина: history сеансу містить **блоки thinking без сигнатур** (часто через
    перерваний/частковий потік). Google Antigravity вимагає сигнатури для блоків thinking.

    Виправлення: OpenClaw тепер прибирає непідписані блоки thinking для Google Antigravity Claude. Якщо це все ще з’являється, почніть **новий session** або задайте `/thinking off` для цього agent.

  </Accordion>
</AccordionGroup>

## Auth profiles: що це таке і як ними керувати

Пов’язане: [/concepts/oauth](/uk/concepts/oauth) (потоки OAuth, зберігання tokens, шаблони для кількох облікових записів)

<AccordionGroup>
  <Accordion title="Що таке auth profile?">
    Auth profile — це іменований запис облікових даних (OAuth або API key), прив’язаний до provider. Профілі зберігаються тут:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які типові ID profiles?">
    OpenClaw використовує ID з префіксом provider, наприклад:

    - `anthropic:default` (поширений варіант, коли немає email-ідентичності)
    - `anthropic:<email>` для OAuth-ідентичностей
    - власні ID, які ви вибираєте (наприклад, `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який auth profile спробується першим?">
    Так. Config підтримує необов’язкові metadata для profiles і порядок для кожного provider (`auth.order.<provider>`). Це **не** зберігає secrets; це зіставляє ID з provider/mode і задає порядок ротації.

    OpenClaw може тимчасово пропустити profile, якщо він перебуває у короткому **cooldown** (rate limits/timeouts/auth failures) або в довшому стані **disabled** (billing/insufficient credits). Щоб перевірити це, виконайте `openclaw models status --json` і перегляньте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Cooldown через rate limit можуть бути обмежені model. Profile, що перебуває в cooldown
    для однієї моделі, усе ще може бути придатним для спорідненої моделі на тому самому provider,
    тоді як вікна billing/disabled усе одно блокують увесь profile.

    Ви також можете задати **override порядку для окремого agent** (зберігається в `auth-state.json` цього agent) через CLI:

    ```bash
    # За замовчуванням використовується налаштований типовий agent (можна опустити --agent)
    openclaw models auth order get --provider anthropic

    # Зафіксувати ротацію на одному profile (пробувати лише цей)
    openclaw models auth order set --provider anthropic anthropic:default

    # Або задати явний порядок (резервне перемикання в межах provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Очистити override (повернення до config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Щоб націлитися на конкретного agent:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Щоб перевірити, що насправді буде спробовано, використовуйте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений profile опущено в явному порядку, probe показує
    `excluded_by_auth_order` для цього profile замість того, щоб непомітно пробувати його.

  </Accordion>

  <Accordion title="OAuth чи API key — у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де це застосовно).
    - **API keys** використовують оплату за токени.

    Майстер явно підтримує Anthropic Claude CLI, OpenAI Codex OAuth і API keys.

  </Accordion>
</AccordionGroup>

## Gateway: порти, "already running" і remote mode

<AccordionGroup>
  <Accordion title="Який port використовує Gateway?">
    `gateway.port` керує єдиним мультиплексованим port для WebSocket + HTTP (Control UI, hooks тощо).

    Пріоритет:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує "Runtime: running", але "RPC probe: failed"?'>
    Тому що "running" — це точка зору **supervisor** (launchd/systemd/schtasks). RPC probe — це фактичне підключення CLI до gateway WebSocket і виклик `status`.

    Використовуйте `openclaw gateway status` і довіряйте таким рядкам:

    - `Probe target:` (URL, який probe фактично використав)
    - `Listening:` (що насправді прив’язано до port)
    - `Last gateway error:` (поширена першопричина, коли процес живий, але port не слухає)

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує різні "Config (cli)" і "Config (service)"?'>
    Ви редагуєте один файл config, а сервіс запускає інший (часто через невідповідність `--profile` / `OPENCLAW_STATE_DIR`).

    Виправлення:

    ```bash
    openclaw gateway install --force
    ```

    Запустіть це з тим самим `--profile` / environment, який має використовувати сервіс.

  </Accordion>

  <Accordion title='Що означає "another gateway instance is already listening"?'>
    OpenClaw примусово застосовує runtime lock, негайно прив’язуючи прослуховувач WebSocket під час запуску (типово `ws://127.0.0.1:18789`). Якщо прив’язка завершується з `EADDRINUSE`, викидається `GatewayLockError`, що означає: вже слухає інший екземпляр.

    Виправлення: зупиніть інший екземпляр, звільніть port або запустіть через `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Як запустити OpenClaw у remote mode (клієнт підключається до Gateway в іншому місці)?">
    Задайте `gateway.mode: "remote"` і вкажіть віддалений URL WebSocket, за потреби з віддаленими обліковими даними shared secret:

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

    - `openclaw gateway` запускається лише тоді, коли `gateway.mode` має значення `local` (або якщо ви передаєте прапорець override).
    - Застосунок macOS стежить за файлом config і живо перемикає режими, коли ці значення змінюються.
    - `gateway.remote.token` / `.password` — це лише облікові дані remote на стороні клієнта; вони самі по собі не вмикають auth локального gateway.

  </Accordion>

  <Accordion title='Control UI показує "unauthorized" (або постійно перепідключається). Що тепер?'>
    Ваш шлях auth gateway і метод auth UI не збігаються.

    Факти (з коду):

    - Control UI зберігає token у `sessionStorage` для поточного сеансу вкладки браузера та вибраного URL gateway, тож оновлення тієї самої вкладки працюють без відновлення довготривалого збереження token у localStorage.
    - За `AUTH_TOKEN_MISMATCH` довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим token пристрою, коли gateway повертає підказки для повторної спроби (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ця повторна спроба з кешованим token тепер повторно використовує кешовані схвалені scopes, збережені разом із token пристрою. Виклики з явним `deviceToken` / явними `scopes` і надалі зберігають власний запитаний набір scope замість успадкування кешованих scopes.
    - Поза цим шляхом повторної спроби пріоритет auth для connect такий: спочатку явний shared token/password, потім явний `deviceToken`, потім збережений token пристрою, потім bootstrap token.
    - Перевірки scope bootstrap token мають префікси ролей. Вбудований allowlist bootstrap operator задовольняє лише запити operator; node або інші ролі, що не є operator, усе одно потребують scopes під власним префіксом ролі.

    Виправлення:

    - Найшвидше: `openclaw dashboard` (друкує + копіює URL dashboard, намагається відкрити; показує підказку SSH, якщо середовище headless).
    - Якщо у вас ще немає token: `openclaw doctor --generate-gateway-token`.
    - Якщо це remote, спочатку створіть tunnel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`.
    - Режим shared secret: задайте `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, а потім вставте відповідний secret у налаштуваннях Control UI.
    - Режим Tailscale Serve: переконайтеся, що `gateway.auth.allowTailscale` увімкнено і ви відкриваєте URL Serve, а не сирий loopback/tailnet URL, який обходить заголовки ідентичності Tailscale.
    - Режим trusted-proxy: переконайтеся, що ви проходите через налаштований identity-aware proxy не в loopback, а не через loopback-proxy на тому самому хості чи сирий URL gateway.
    - Якщо невідповідність зберігається після однієї повторної спроби, перевидайте/повторно схваліть token paired device:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Якщо ця команда rotate каже, що дію відхилено, перевірте дві речі:
      - paired-device sessions можуть перевидати лише **власний** пристрій, якщо тільки вони також не мають `operator.admin`
      - явні значення `--scope` не можуть перевищувати поточні operator scopes виклику
    - Усе ще не вдається? Виконайте `openclaw status --all` і дотримуйтесь [Усунення несправностей](/uk/gateway/troubleshooting). Деталі auth див. у [Dashboard](/web/dashboard).

  </Accordion>

  <Accordion title="Я задав gateway.bind tailnet, але прив’язка не працює і нічого не слухає">
    Прив’язка `tailnet` вибирає IP Tailscale з мережевих інтерфейсів вашої машини (100.64.0.0/10). Якщо машина не підключена до Tailscale (або інтерфейс неактивний), прив’язуватися нема до чого.

    Виправлення:

    - Запустіть Tailscale на цьому хості (щоб він мав адресу 100.x), або
    - Перемкніться на `gateway.bind: "loopback"` / `"lan"`.

    Примітка: `tailnet` є явним режимом. `auto` надає перевагу loopback; використовуйте `gateway.bind: "tailnet"`, коли вам потрібна прив’язка лише до tailnet.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька Gateway на одному хості?">
    Зазвичай ні — один Gateway може обслуговувати кілька messaging channels і agents. Використовуйте кілька Gateway лише тоді, коли вам потрібна надлишковість (наприклад, rescue bot) або жорстка ізоляція.

    Так, але потрібно ізолювати:

    - `OPENCLAW_CONFIG_PATH` (config для кожного екземпляра)
    - `OPENCLAW_STATE_DIR` (state для кожного екземпляра)
    - `agents.defaults.workspace` (ізоляція workspace)
    - `gateway.port` (унікальні ports)

    Швидке налаштування (рекомендовано):

    - Використовуйте `openclaw --profile <name> ...` для кожного екземпляра (автоматично створює `~/.openclaw-<name>`).
    - Задайте унікальний `gateway.port` у config кожного профілю (або передавайте `--port` для ручних запусків).
    - Встановіть сервіс для кожного профілю: `openclaw --profile <name> gateway install`.

    Профілі також додають суфікси до назв сервісів (`ai.openclaw.<profile>`; legacy `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Повний посібник: [Кілька Gateway](/uk/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Що означає "invalid handshake" / code 1008?'>
    Gateway — це **сервер WebSocket**, і він очікує, що найперше повідомлення
    буде фреймом `connect`. Якщо він отримує щось інше, то закриває з’єднання
    з **code 1008** (порушення політики).

    Поширені причини:

    - Ви відкрили URL **HTTP** у браузері (`http://...`) замість клієнта WS.
    - Ви використали неправильний port або path.
    - Proxy або tunnel видалив заголовки auth або надіслав запит не до Gateway.

    Швидкі виправлення:

    1. Використовуйте URL WS: `ws://<host>:18789` (або `wss://...`, якщо HTTPS).
    2. Не відкривайте port WS у звичайній вкладці браузера.
    3. Якщо auth увімкнено, включіть token/password у фрейм `connect`.

    Якщо ви використовуєте CLI або TUI, URL має виглядати так:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Деталі протоколу: [Протокол Gateway](/uk/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Журналювання та налагодження

<AccordionGroup>
  <Accordion title="Де знаходяться журнали?">
    Файлові журнали (структуровані):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Ви можете задати стабільний path через `logging.file`. Рівнем файлів журналу керує `logging.level`. Детальністю консолі керують `--verbose` і `logging.consoleLevel`.

    Найшвидший перегляд хвоста журналу:

    ```bash
    openclaw logs --follow
    ```

    Журнали сервісу/supervisor (коли gateway запущено через launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` і `gateway.err.log` (типово: `~/.openclaw/logs/...`; профілі використовують `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Див. [Усунення несправностей](/uk/gateway/troubleshooting) для додаткової інформації.

  </Accordion>

  <Accordion title="Як запустити/зупинити/перезапустити сервіс Gateway?">
    Використовуйте допоміжні команди gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви запускаєте gateway вручну, `openclaw gateway --force` може повторно захопити port. Див. [Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Я закрив термінал у Windows — як перезапустити OpenClaw?">
    Є **два режими встановлення для Windows**:

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

    Документація: [Windows (WSL2)](/uk/platforms/windows), [Операційний посібник із сервісу Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Gateway працює, але відповіді ніколи не надходять. Що перевірити?">
    Почніть із швидкої перевірки стану:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Поширені причини:

    - Auth моделі не завантажено на **хості gateway** (перевірте `models status`).
    - Pairing/allowlist channel блокує відповіді (перевірте config channel + журнали).
    - WebChat/Dashboard відкрито без правильного token.

    Якщо ви працюєте віддалено, переконайтеся, що tunnel/Tailscale-з’єднання активне і
    Gateway WebSocket доступний.

    Документація: [Channels](/uk/channels), [Усунення несправностей](/uk/gateway/troubleshooting), [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — що тепер?'>
    Зазвичай це означає, що UI втратив з’єднання WebSocket. Перевірте:

    1. Gateway працює? `openclaw gateway status`
    2. Gateway у нормальному стані? `openclaw status`
    3. UI має правильний token? `openclaw dashboard`
    4. Якщо це remote, чи активне з’єднання tunnel/Tailscale?

    Потім перегляньте хвіст журналів:

    ```bash
    openclaw logs --follow
    ```

    Документація: [Dashboard](/web/dashboard), [Віддалений доступ](/uk/gateway/remote), [Усунення несправностей](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Не вдається виконати Telegram setMyCommands. Що перевірити?">
    Почніть із журналів і статусу channel:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Далі зіставте помилку:

    - `BOT_COMMANDS_TOO_MUCH`: меню Telegram містить надто багато записів. OpenClaw уже обрізає список до ліміту Telegram і повторює спробу з меншою кількістю команд, але деякі пункти меню все одно потрібно прибрати. Скоротіть plugin/skill/custom commands або вимкніть `channels.telegram.commands.native`, якщо меню вам не потрібне.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` або подібні мережеві помилки: якщо ви на VPS або за proxy, переконайтеся, що вихідний HTTPS дозволений і DNS працює для `api.telegram.org`.

    Якщо Gateway віддалений, переконайтеся, що ви дивитеся журнали на хості Gateway.

    Документація: [Telegram](/uk/channels/telegram), [Усунення несправностей каналів](/uk/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI не показує вивід. Що перевірити?">
    Спочатку переконайтеся, що Gateway доступний і agent може працювати:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    У TUI використовуйте `/status`, щоб побачити поточний стан. Якщо ви очікуєте відповіді в chat
    channel, переконайтеся, що доставку ввімкнено (`/deliver on`).

    Документація: [TUI](/web/tui), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як повністю зупинити, а потім знову запустити Gateway?">
    Якщо ви встановили сервіс:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Це зупиняє/запускає **сервіс під керуванням supervisor** (launchd на macOS, systemd на Linux).
    Використовуйте це, коли Gateway працює у фоновому режимі як daemon.

    Якщо ви запускаєте у foreground, зупиніть через Ctrl-C, а потім:

    ```bash
    openclaw gateway run
    ```

    Документація: [Операційний посібник із сервісу Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Пояснення для початківця: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: перезапускає **фоновий сервіс** (launchd/systemd).
    - `openclaw gateway`: запускає gateway **у foreground** для цього сеансу термінала.

    Якщо ви встановили сервіс, використовуйте команди gateway. Використовуйте `openclaw gateway`, коли
    вам потрібен одноразовий запуск у foreground.

  </Accordion>

  <Accordion title="Найшвидший спосіб отримати більше подробиць, коли щось не працює">
    Запустіть Gateway з `--verbose`, щоб отримати більше деталей у консолі. Потім перевірте файл журналу на наявність помилок auth channel, routing моделі та RPC.
  </Accordion>
</AccordionGroup>

## Медіа та вкладення

<AccordionGroup>
  <Accordion title="Мій skill згенерував зображення/PDF, але нічого не було надіслано">
    Вихідні вкладення від agent мають містити рядок `MEDIA:<path-or-url>` (в окремому рядку). Див. [Налаштування assistant OpenClaw](/uk/start/openclaw) і [Надсилання Agent](/uk/tools/agent-send).

    Надсилання через CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Також перевірте:

    - Цільовий channel підтримує вихідні медіа й не блокується allowlist.
    - Файл не перевищує обмеження розміру provider (зображення змінюються до максимуму 2048px).
    - `tools.fs.workspaceOnly=true` обмежує надсилання локальних шляхів workspace, temp/media-store і файлами, перевіреними sandbox.
    - `tools.fs.workspaceOnly=false` дозволяє `MEDIA:` надсилати локальні файли хоста, які agent уже може читати, але лише для медіа та безпечних типів документів (зображення, аудіо, відео, PDF і документи Office). Звичайний текст і файли, схожі на secrets, усе одно блокуються.

    Див. [Зображення](/uk/nodes/images).

  </Accordion>
</AccordionGroup>

## Безпека та контроль доступу

<AccordionGroup>
  <Accordion title="Чи безпечно відкривати OpenClaw для вхідних DM?">
    Ставтеся до вхідних DM як до недовіреного input. Типові налаштування розроблено для зниження ризику:

    - Типова поведінка на channels із підтримкою DM — **pairing**:
      - Невідомі відправники отримують код pairing; бот не обробляє їхнє повідомлення.
      - Схвалення виконується так: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Кількість очікуваних запитів обмежена до **3 на channel**; перевіряйте `openclaw pairing list --channel <channel> [--account <id>]`, якщо код не надійшов.
    - Публічне відкриття DM вимагає явної згоди (`dmPolicy: "open"` і allowlist `"*"`).

    Запустіть `openclaw doctor`, щоб виявити ризиковані політики DM.

  </Accordion>

  <Accordion title="Чи є prompt injection проблемою лише для публічних ботів?">
    Ні. Prompt injection стосується **недовіреного контенту**, а не лише того, хто може написати боту в DM.
    Якщо ваш assistant читає зовнішній контент (web search/fetch, сторінки браузера, email,
    документи, вкладення, вставлені журнали), цей контент може містити інструкції, які намагаються
    перехопити керування моделлю. Це може трапитися, навіть якщо **єдиний відправник — ви**.

    Найбільший ризик виникає, коли ввімкнено інструменти: модель можна змусити
    ексфільтрувати context або викликати інструменти від вашого імені. Зменшуйте радіус ураження:

    - використовуйте agent "читач" лише для читання або без інструментів, щоб підсумовувати недовірений контент
    - тримайте `web_search` / `web_fetch` / `browser` вимкненими для agents з увімкненими інструментами
    - ставтеся до декодованого тексту файлів/документів також як до недовіреного: OpenResponses
      `input_file` і витягування тексту з медіавкладень обгортають витягнутий текст у
      явні маркери меж зовнішнього контенту замість передавання сирого тексту файла
    - використовуйте sandboxing і суворі allowlist інструментів

    Деталі: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи має бот мати власний email, обліковий запис GitHub або номер телефону?">
    Так, для більшості конфігурацій. Ізоляція бота за допомогою окремих облікових записів і номерів телефону
    зменшує радіус ураження, якщо щось піде не так. Також це полегшує перевипуск
    облікових даних або відкликання доступу без впливу на ваші особисті облікові записи.

    Починайте з малого. Надавайте доступ лише до тих інструментів і облікових записів, які вам справді потрібні, і розширюйте
    його пізніше за потреби.

    Документація: [Безпека](/uk/gateway/security), [Pairing](/uk/channels/pairing).

  </Accordion>

  <Accordion title="Чи можу я надати йому автономність над моїми текстовими повідомленнями і чи це безпечно?">
    Ми **не** рекомендуємо повну автономність над вашими особистими повідомленнями. Найбезпечніший шаблон:

    - Тримайте DM у **режимі pairing** або з жорстким allowlist.
    - Використовуйте **окремий номер або обліковий запис**, якщо хочете, щоб він надсилав повідомлення від вашого імені.
    - Дозвольте йому створювати чернетки, а потім **схвалюйте перед надсиланням**.

    Якщо хочете поекспериментувати, робіть це на окремому обліковому записі й тримайте його ізольованим. Див.
    [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи можу я використовувати дешевші моделі для завдань персонального assistant?">
    Так, **якщо** agent використовується лише для чату і input є довіреним. Менші рівні
    більш схильні до викрадення інструкціями, тому уникайте їх для agents з увімкненими інструментами
    або під час читання недовіреного контенту. Якщо все ж потрібно використовувати меншу модель, жорстко обмежте
    інструменти і запускайте всередині sandbox. Див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Я виконав /start у Telegram, але не отримав код pairing">
    Коди pairing надсилаються **лише** тоді, коли невідомий відправник пише боту і
    `dmPolicy: "pairing"` увімкнено. Сам по собі `/start` не генерує код.

    Перевірте очікувані запити:

    ```bash
    openclaw pairing list telegram
    ```

    Якщо вам потрібен негайний доступ, додайте свій sender id до allowlist або задайте `dmPolicy: "open"`
    для цього облікового запису.

  </Accordion>

  <Accordion title="WhatsApp: чи буде він писати моїм контактам? Як працює pairing?">
    Ні. Типова політика DM у WhatsApp — **pairing**. Невідомі відправники отримують лише код pairing, а їхнє повідомлення **не обробляється**. OpenClaw відповідає лише в чатах, які отримує, або на явні надсилання, які ви ініціюєте.

    Схваліть pairing так:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Перелічіть очікувані запити:

    ```bash
    openclaw pairing list whatsapp
    ```

    Запит майстра на номер телефону: він використовується для встановлення вашого **allowlist/owner**, щоб ваші власні DM були дозволені. Він не використовується для автоматичного надсилання. Якщо ви запускаєте на своєму особистому номері WhatsApp, використовуйте цей номер і ввімкніть `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Команди чату, переривання задач і "він не зупиняється"

<AccordionGroup>
  <Accordion title="Як зупинити показ внутрішніх системних повідомлень у чаті?">
    Більшість внутрішніх повідомлень або повідомлень інструментів з’являються лише тоді, коли для цього session увімкнено **verbose**, **trace** або **reasoning**.

    Виправлення в чаті, де ви це бачите:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Якщо все ще надто шумно, перевірте налаштування session у Control UI і встановіть verbose
    на **inherit**. Також переконайтеся, що ви не використовуєте profile бота з `verboseDefault`, встановленим
    у `on` у config.

    Документація: [Thinking і verbose](/uk/tools/thinking), [Безпека](/uk/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Як зупинити/скасувати запущену задачу?">
    Надішліть будь-який із цих варіантів **як окреме повідомлення** (без slash):

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

    Це тригери переривання, а не slash-команди.

    Для фонових процесів (з інструмента exec) ви можете попросити agent виконати:

    ```
    process action:kill sessionId:XXX
    ```

    Огляд slash-команд: див. [Slash commands](/uk/tools/slash-commands).

    Більшість команд мають надсилатися як **окреме** повідомлення, що починається з `/`, але кілька скорочень (як-от `/status`) також працюють inline для відправників з allowlist.

  </Accordion>

  <Accordion title='Як надіслати повідомлення Discord із Telegram? ("Cross-context messaging denied")'>
    OpenClaw типово блокує обмін повідомленнями **між різними providers**. Якщо виклик інструмента прив’язаний
    до Telegram, він не надсилатиме в Discord, якщо ви явно цього не дозволите.

    Увімкніть міжprovider-обмін повідомленнями для agent:

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

    Після редагування config перезапустіть gateway.

  </Accordion>

  <Accordion title='Чому здається, що бот "ігнорує" серію швидких повідомлень?'>
    Режим queue визначає, як нові повідомлення взаємодіють із поточним запущеним run. Використовуйте `/queue`, щоб змінити режими:

    - `steer` — нові повідомлення перенаправляють поточну задачу
    - `followup` — повідомлення виконуються по одному
    - `collect` — пакетування повідомлень і одна відповідь (типово)
    - `steer-backlog` — перенаправити зараз, а потім обробити backlog
    - `interrupt` — перервати поточний run і почати заново

    Ви можете додавати параметри на кшталт `debounce:2s cap:25 drop:summarize` для режимів followup.

  </Accordion>
</AccordionGroup>

## Різне

<AccordionGroup>
  <Accordion title='Яка модель є типовою для Anthropic з API key?'>
    В OpenClaw облікові дані та вибір моделі розділено. Встановлення `ANTHROPIC_API_KEY` (або збереження Anthropic API key в auth profiles) вмикає автентифікацію, але фактична типова модель — це те, що ви налаштували в `agents.defaults.model.primary` (наприклад, `anthropic/claude-sonnet-4-6` або `anthropic/claude-opus-4-6`). Якщо ви бачите `No credentials found for profile "anthropic:default"`, це означає, що Gateway не зміг знайти облікові дані Anthropic в очікуваному `auth-profiles.json` для agent, який зараз працює.
  </Accordion>
</AccordionGroup>

---

Усе ще застрягли? Запитайте в [Discord](https://discord.com/invite/clawd) або відкрийте [обговорення на GitHub](https://github.com/openclaw/openclaw/discussions).
