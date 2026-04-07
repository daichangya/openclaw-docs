---
read_when:
    - Відповідь на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час виконання
    - Тріаж проблем, про які повідомляють користувачі, перед глибшим налагодженням
summary: Часті запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-07T09:43:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b2ad2fc35fb5b1d6c8fb75e7c0c409089dff033a9810c863c3f7ef64834a9b77
    source_path: help/faq.md
    workflow: 15
---

# Поширені запитання

Короткі відповіді та глибше усунення несправностей для реальних сценаріїв налаштування (local dev, VPS, multi-agent, OAuth/API keys, failover моделей). Для діагностики під час виконання див. [Усунення несправностей](/uk/gateway/troubleshooting). Повний довідник з конфігурації див. у [Конфігурація](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламалося

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидкий локальний підсумок: ОС + оновлення, доступність gateway/service, agents/sessions, конфігурація провайдера + проблеми під час виконання (коли gateway доступний).

2. **Звіт, який можна вставити (безпечний для поширення)**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з кінцівкою логів (токени відредаговано).

3. **Стан daemon + port**

   ```bash
   openclaw gateway status
   ```

   Показує supervisor runtime порівняно з доступністю RPC, цільову URL probe і яку конфігурацію сервіс, імовірно, використав.

4. **Глибокі probe-перевірки**

   ```bash
   openclaw status --deep
   ```

   Виконує живу probe-перевірку стану gateway, включно з channel probes, коли це підтримується
   (потрібен доступний gateway). Див. [Стан](/uk/gateway/health).

5. **Показати кінцівку останнього логу**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використайте запасний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові логи відокремлені від service logs; див. [Журналювання](/uk/logging) і [Усунення несправностей](/uk/gateway/troubleshooting).

6. **Запустити doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує config/state + запускає перевірки стану. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # показує цільову URL + шлях до конфігурації у разі помилок
   ```

   Запитує у запущеного gateway повний знімок (лише WS). Див. [Стан](/uk/gateway/health).

## Швидкий старт і початкове налаштування

<AccordionGroup>
  <Accordion title="Я застряг, найшвидший спосіб вибратися">
    Використайте локального AI-агента, який може **бачити вашу машину**. Це набагато ефективніше, ніж питати
    у Discord, тому що більшість випадків "я застряг" — це **проблеми локальної конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, виконувати команди, переглядати логи та допомагати виправити
    налаштування на рівні машини (PATH, сервіси, дозволи, auth-файли). Дайте їм **повний checkout вихідного коду** через
    hackable (git) install:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з git checkout**, тож агент може читати код + документацію та
    міркувати про точну версію, яку ви використовуєте. Пізніше ви завжди можете повернутися до stable,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й супроводжувати** виправлення (крок за кроком), а потім виконати лише
    необхідні команди. Так зміни будуть невеликими й їх буде легше перевірити.

    Якщо ви знайдете справжню помилку або виправлення, будь ласка, створіть GitHub issue або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (діліться виводом, коли просите допомоги):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану gateway/agent + базової конфігурації.
    - `openclaw models status`: перевіряє auth провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє поширені проблеми config/state.

    Інші корисні CLI-перевірки: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламалося](#перші-60-секунд-якщо-щось-зламалося).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску heartbeat:

    - `quiet-hours`: поза налаштованим вікном active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожній/заголовковий шаблон
    - `no-tasks-due`: режим завдань `HEARTBEAT.md` активний, але жоден з інтервалів завдань ще не настав
    - `alerts-disabled`: усю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові позначки виконання оновлюються лише після завершення
    реального запуску heartbeat. Пропущені запуски не позначають завдання як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановити й налаштувати OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання онбордингу:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати UI assets. Після онбордингу ви зазвичай запускаєте Gateway на порту **18789**.

    Із вихідного коду (contributors/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # автоматично встановлює UI dependencies під час першого запуску
    openclaw onboard
    ```

    Якщо у вас ще немає глобального встановлення, запустіть через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Як відкрити dashboard після онбордингу?">
    Майстер відкриває ваш браузер із чистою (без токена) URL dashboard одразу після онбордингу, а також виводить посилання в підсумку. Тримайте цю вкладку відкритою; якщо вона не запустилася, скопіюйте/вставте виведену URL на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується shared-secret auth, вставте налаштований token або password у параметри Control UI.
    - Джерело token: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело password: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо shared secret ще не налаштовано, згенеруйте token командою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште bind loopback, виконайте `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` дорівнює `true`, заголовки identity задовольняють auth для Control UI/WebSocket (без вставлення shared secret, за умови довіреного gateway host); HTTP APIs усе ще вимагають shared-secret auth, якщо ви навмисно не використовуєте private-ingress `none` або trusted-proxy HTTP auth.
      Невдалі одночасні спроби Serve auth від того самого клієнта серіалізуються до того, як лімітатор failed-auth їх зафіксує, тому другий невдалий повтор уже може показати `retry later`.
    - **Tailnet bind**: виконайте `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте password auth), відкрийте `http://<tailscale-ip>:18789/`, потім вставте відповідний shared secret у параметри dashboard.
    - **Identity-aware reverse proxy**: залиште Gateway за trusted proxy без loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, потім відкрийте URL proxy.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`. Shared-secret auth все одно застосовується через tunnel; вставте налаштований token або password, якщо буде запит.

    Див. [Dashboard](/web/dashboard) і [Web surfaces](/web) для подробиць про режими bind та auth.

  </Accordion>

  <Accordion title="Чому є дві конфігурації exec approval для approvals у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає approval prompts до chat destinations
    - `channels.<channel>.execApprovals`: робить цей channel нативним approval client для exec approvals

    Host exec policy усе ще є реальним approval gate. Конфігурація чату лише визначає, куди
    з’являються approval prompts і як люди можуть на них відповідати.

    У більшості налаштувань вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди та відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний native channel може безпечно визначити approvers, OpenClaw тепер автоматично вмикає native approvals із пріоритетом DM, коли `channels.<channel>.execApprovals.enabled` не задано або дорівнює `"auto"`.
    - Коли доступні native approval cards/buttons, саме цей native UI є основним шляхом; агент має включати ручну команду `/approve`, лише якщо результат інструмента каже, що approvals у чаті недоступні або ручне approval — єдиний шлях.
    - Використовуйте `approvals.exec` лише тоді, коли prompts також потрібно пересилати до інших чатів або явних ops rooms.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише тоді, коли ви явно хочете, щоб approval prompts публікувалися назад у початкову room/topic.
    - Plugin approvals знову окремі: за замовчуванням вони використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі native channels зберігають native handling plugin approvals поверх цього.

    Коротко: forwarding — це маршрутизація, а native client config — для багатшого UX, специфічного для channel.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке runtime мені потрібне?">
    Потрібен Node **>= 22**. Рекомендується `pnpm`. Bun **не рекомендується** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легкий — у документації зазначено, що для особистого використання достатньо **512MB-1GB RAM**, **1 core** та приблизно **500MB**
    диска, і також сказано, що **Raspberry Pi 4 може це запускати**.

    Якщо ви хочете більше запасу (логи, медіа, інші сервіси), **рекомендується 2GB**, але
    це не жорсткий мінімум.

    Порада: невеликий Pi/VPS може хостити Gateway, а ви можете підключати **nodes** на ноутбуці/телефоні для
    локального screen/camera/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради для встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте шорстких моментів.

    - Використовуйте **64-bit** ОС і Node >= 22.
    - Віддавайте перевагу **hackable (git) install**, щоб бачити логи й швидко оновлюватися.
    - Починайте без channels/skills, потім додавайте їх по одному.
    - Якщо натрапляєте на дивні проблеми з binary, зазвичай це **проблема сумісності ARM**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Застрягає на wake up my friend / onboarding не вилуплюється. Що робити?">
    Цей екран залежить від того, чи доступний Gateway і чи пройдено автентифікацію. TUI також надсилає
    "Wake up, my friend!" автоматично під час першого hatch. Якщо ви бачите цей рядок і **немає відповіді**,
    а кількість токенів залишається 0, агент так і не запустився.

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

    Якщо Gateway віддалений, переконайтеся, що tunnel/Tailscale connection активне і UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini) без повторного онбордингу?">
    Так. Скопіюйте **state directory** і **workspace**, потім один раз запустіть Doctor. Це
    збереже вашого бота **точно таким самим** (memory, session history, auth і channel
    state), якщо ви скопіюєте **обидва** місця:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій workspace (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть службу Gateway.

    Це збереже config, auth profiles, облікові дані WhatsApp, sessions і memory. Якщо ви працюєте в
    remote mode, пам’ятайте, що session store і workspace належать gateway host.

    **Важливо:** якщо ви лише комітите/надсилаєте свій workspace до GitHub, ви резервуєте
    **memory + bootstrap files**, але **не** session history або auth. Вони зберігаються
    у `~/.openclaw/` (наприклад `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Міграція](/uk/install/migrating), [Де що лежить на диску](#де-що-лежить-на-диску),
    [Agent workspace](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Remote mode](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перегляньте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи — зверху. Якщо верхній розділ позначено як **Unreleased**, то наступний датований
    розділ — це остання випущена версія. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (а також docs/інші розділи за потреби).

  </Accordion>

  <Accordion title="Не вдається відкрити docs.openclaw.ai (SSL error)">
    Деякі підключення Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть цю функцію або додайте `docs.openclaw.ai` до allowlist, а потім повторіть спробу.
    Допоможіть нам розблокувати його, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо сайт усе ще недоступний, документація дублюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable-реліз спочатку потрапляє в **beta**, а потім окремий
    крок просування переміщує ту саму версію в `latest`. За потреби maintainers також можуть
    публікувати одразу в `latest`. Саме тому beta і stable можуть
    вказувати на **одну й ту саму версію** після просування.

    Дивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Для однорядкових команд встановлення та різниці між beta і dev див. accordion нижче.

  </Accordion>

  <Accordion title="Як встановити beta-версію і в чому різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (може збігатися з `latest` після просування).
    **Dev** — це рухома голова `main` (git); коли її публікують, використовується npm dist-tag `dev`.

    Однорядкові команди (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Інсталятор для Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Більше деталей: [Канали розробки](/uk/install/development-channels) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як спробувати найсвіжіші зміни?">
    Є два варіанти:

    1. **Dev channel (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає вас на гілку `main` і оновлює з вихідного коду.

    2. **Hackable install (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Так ви отримаєте локальний repo, який можна редагувати, а потім оновлювати через git.

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
    - **Онбординг:** 5-15 хвилин залежно від того, скільки channels/models ви налаштовуєте

    Якщо все зависає, див. [Інсталятор завис](#швидкий-старт-і-початкове-налаштування)
    та швидкий цикл налагодження в [Я застряг](#швидкий-старт-і-початкове-налаштування).

  </Accordion>

  <Accordion title="Інсталятор завис? Як отримати більше зворотного зв’язку?">
    Повторно запустіть інсталятор з **детальним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Встановлення beta з деталізацією:

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

    Більше варіантів: [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Під час встановлення у Windows написано git not found або openclaw not recognized">
    Дві поширені проблеми Windows:

    **1) npm error spawn git / git not found**

    - Встановіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, потім повторно запустіть інсталятор.

    **2) openclaw is not recognized after install**

    - Ваш npm global bin folder не додано до PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до свого user PATH (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо ви хочете найгладше налаштування у Windows, використовуйте **WSL2** замість нативного Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У Windows exec output показує спотворений китайський текст - що робити?">
    Зазвичай це невідповідність code page консолі у нативних оболонках Windows.

    Симптоми:

    - вивід `system.run`/`exec` показує китайський текст як mojibake
    - та сама команда виглядає нормально в іншому terminal profile

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

    Якщо це все ще відтворюється в останній версії OpenClaw, відстежуйте/повідомляйте про це тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання - як отримати кращу відповідь?">
    Використайте **hackable (git) install**, щоб мати локально повний вихідний код і документацію, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг прочитати repo і дати точну відповідь.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Більше деталей: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтесь інструкції для Linux, потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення сервісу: [Linux](/uk/platforms/linux).
    - Повний покроковий гайд: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення та оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Встановіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Інструкції: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де інструкції зі встановлення в хмарі/VPS?">
    У нас є **hosting hub** з поширеними провайдерами. Оберіть одного й дотримуйтесь інструкції:

    - [VPS hosting](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює у хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    з ноутбука/телефона через Control UI (або Tailscale/SSH). Ваші state + workspace
    живуть на сервері, тож вважайте host джерелом істини й робіть резервні копії.

    Ви можете підключати **nodes** (Mac/iOS/Android/headless) до цього cloud Gateway для доступу
    до локальних screen/camera/canvas або запуску команд на ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити себе самостійно?">
    Коротка відповідь: **можливо, але не рекомендується**. Процес оновлення може перезапустити
    Gateway (що розірве активну session), може вимагати чистого git checkout і
    може просити підтвердження. Безпечніше: запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо вам усе ж потрібно автоматизувати з агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить онбординг?">
    `openclaw onboard` — рекомендований шлях налаштування. У **local mode** він проводить вас через:

    - **Налаштування model/auth** (OAuth провайдерів, API keys, Anthropic setup-token, а також локальні варіанти моделей, як-от LM Studio)
    - розташування **Workspace** + bootstrap files
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також bundled channel plugins, як-от QQ Bot)
    - **Встановлення daemon** (LaunchAgent на macOS; user unit systemd на Linux/WSL2)
    - **Перевірки стану** і вибір **Skills**

    Також він попереджає, якщо налаштована модель невідома або для неї бракує auth.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw з **API keys** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **Anthropic API key**: звичайна оплата Anthropic API
    - **Claude CLI / auth за підпискою Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довгоживучих gateway host Anthropic API keys усе ще є більш
    передбачуваним варіантом. OpenAI Codex OAuth явно підтримується для зовнішніх
    інструментів, таких як OpenClaw.

    OpenClaw також підтримує інші хостовані варіанти у стилі підписки, включно з
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [Моделі GLM](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API key?">
    Так.

    Співробітники Anthropic сказали нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тож
    OpenClaw розглядає auth за підпискою Claude і використання `claude -p` як санкціоновані
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо ви хочете
    найпередбачуваніше серверне налаштування, натомість використовуйте Anthropic API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви auth за підпискою Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тож OpenClaw розглядає
    повторне використання Claude CLI і використання `claude -p` як санкціоновані для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token усе ще доступний як підтримуваний шлях токенів OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI і `claude -p`, коли це можливо.
    Для production або багатокористувацьких навантажень auth через Anthropic API key усе ще
    є безпечнішим і передбачуванішим вибором. Якщо вам потрібні інші хостовані
    варіанти у стилі підписки в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [Моделі
    GLM](/uk/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
Це означає, що ваша **квота/ліміт швидкості Anthropic** вичерпана для поточного вікна. Якщо ви
використовуєте **Claude CLI**, дочекайтеся скидання вікна або оновіть свій план. Якщо ви
використовуєте **Anthropic API key**, перевірте Anthropic Console
щодо використання/оплати та за потреби збільште ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, запит намагається використовувати
    Anthropic 1M context beta (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані мають право на billing для long-context (billing через API key або
    шлях входу Claude в OpenClaw з увімкненим Extra Usage).

    Порада: задайте **fallback model**, щоб OpenClaw міг продовжувати відповідати, поки провайдер обмежений rate limit.
    Див. [Моделі](/cli/models), [OAuth](/uk/concepts/oauth), і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має bundled провайдера **Amazon Bedrock (Converse)**. За наявності AWS env markers OpenClaw може автоматично виявити streaming/text каталог Bedrock і об’єднати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати manual provider entry. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний proxy перед Bedrock також залишається коректним варіантом.
  </Accordion>

  <Accordion title="Як працює auth Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Під час онбордингу можна пройти OAuth flow, і коли доречно, буде встановлено модель за замовчуванням `openai-codex/gpt-5.4`. Див. [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому ChatGPT GPT-5.4 не відкриває openai/gpt-5.4 в OpenClaw?">
    OpenClaw розглядає ці два маршрути окремо:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = прямий API OpenAI Platform

    В OpenClaw вхід через ChatGPT/Codex прив’язано до маршруту `openai-codex/*`,
    а не до прямого маршруту `openai/*`. Якщо ви хочете прямий API-шлях в
    OpenClaw, задайте `OPENAI_API_KEY` (або еквівалентну конфігурацію провайдера OpenAI).
    Якщо ви хочете вхід через ChatGPT/Codex в OpenClaw, використовуйте `openai-codex/*`.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    `openai-codex/*` використовує маршрут Codex OAuth, і його доступні вікна квот
    керуються OpenAI та залежать від плану. На практиці ці ліміти можуть відрізнятися від
    досвіду на сайті/в застосунку ChatGPT, навіть якщо обидва пов’язані з тим самим акаунтом.

    OpenClaw може показувати поточні видимі вікна використання/квоти провайдера в
    `openclaw models status`, але він не вигадує і не нормалізує права ChatGPT-web
    у прямий API-доступ. Якщо вам потрібен прямий шлях billing/limit OpenAI Platform,
    використовуйте `openai/*` з API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви auth за підпискою OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth за підпискою OpenAI Code (Codex)**.
    OpenAI прямо дозволяє використання subscription OAuth у зовнішніх інструментах/робочих процесах,
    таких як OpenClaw. Онбординг може провести OAuth flow за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **plugin auth flow**, а не client id чи secret в `openclaw.json`.

    Кроки:

    1. Встановіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Модель за замовчуванням після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не працюють, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на gateway host

    Це зберігає OAuth tokens в auth profiles на gateway host. Подробиці: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; малі карти обрізають і пропускають зайве. Якщо вже потрібно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі збільшують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як зберегти трафік до хостованих моделей у конкретному регіоні?">
    Обирайте endpoints, прив’язані до регіону. OpenRouter надає варіанти з хостингом у США для MiniMax, Kimi та GLM; оберіть варіант із хостингом у США, щоб дані залишалися в регіоні. Ви все одно можете вказати Anthropic/OpenAI поруч із ними, використовуючи `models.mode: "merge"`, щоб fallback лишався доступним і водночас поважав регіонального провайдера, якого ви обрали.
  </Accordion>

  <Accordion title="Чи обов’язково купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini не обов’язковий —
    дехто купує його як постійно увімкнений host, але підійде також невеликий VPS, домашній сервер або Raspberry Pi-класу box.

    Mac потрібен лише для **інструментів лише для macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або підключайте macOS node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS** із входом у Messages. Це **не обов’язково** має бути Mac mini —
    підійде будь-який Mac. **Використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) для iMessage — сервер BlueBubbles працює на macOS, тоді як Gateway може працювати на Linux або деінде.

    Типові налаштування:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac із входом у Messages.
    - Запускайте все на Mac, якщо хочете найпростішу конфігурацію на одній машині.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для OpenClaw, чи можу я підключити його до MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **node** (додатковий пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, як-от screen/camera/canvas і `system.run` на цьому пристрої.

    Поширений шаблон:

    - Gateway на Mac mini (постійно увімкнений).
    - MacBook Pro запускає застосунок macOS або node host і підключається до Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб це побачити.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можна використовувати Bun?">
    Bun **не рекомендується**. Ми бачимо runtime bugs, особливо з WhatsApp і Telegram.
    Для стабільних gateway використовуйте **Node**.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на не-production gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що потрібно в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не username бота.

    Онбординг приймає введення `@username` і перетворює його на numeric ID, але авторизація OpenClaw використовує лише numeric IDs.

    Безпечніше (без стороннього бота):

    - Напишіть своєму боту в DM, потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть своєму боту в DM, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонні сервіси (менш приватно):

    - Напишіть у DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними інстансами OpenClaw?">
    Так, через **маршрутизацію multi-agent**. Прив’яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, sender E.164, наприклад `+15551234567`) до іншого `agentId`, щоб кожна людина мала власний workspace і session store. Відповіді все одно приходитимуть з **того самого акаунта WhatsApp**, а контроль доступу DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для цього акаунта WhatsApp. Див. [Маршрутизація Multi-Agent](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента для "швидкого чату" і агента "Opus для кодування"?'>
    Так. Використовуйте маршрутизацію multi-agent: дайте кожному agent власну модель за замовчуванням, а потім прив’яжіть вхідні маршрути (акаунт провайдера або конкретні peers) до кожного agent. Приклад конфігурації є в [Маршрутизація Multi-Agent](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу містить `/home/linuxbrew/.linuxbrew/bin` (або ваш brew prefix), щоб інструменти, встановлені через `brew`, були доступні в non-login shells.
    Останні збірки також додають поширені user bin directories перед іншими для Linux systemd services (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо вони задані.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повний checkout вихідного коду, можна редагувати, найкраще для contributors.
      Ви локально запускаєте збірки та можете вносити патчі в код/документацію.
    - **npm install:** глобальне встановлення CLI без repo, найкраще для сценарію "просто запустити".
      Оновлення надходять через npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можна пізніше перемикатися між встановленням через npm і git?">
    Так. Встановіть інший варіант, а потім запустіть Doctor, щоб служба gateway вказувала на новий entrypoint.
    Це **не видаляє ваші дані** — змінюється лише інсталяція коду OpenClaw. Ваш state
    (`~/.openclaw`) і workspace (`~/.openclaw/workspace`) залишаються недоторканими.

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

    Doctor виявляє невідповідність service entrypoint gateway і пропонує переписати service config відповідно до поточного встановлення (в automation використовуйте `--repair`).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#де-що-лежить-на-диску).

  </Accordion>

  <Accordion title="Де краще запускати Gateway — на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам
    потрібен мінімальний тертя і вас влаштовують sleep/restarts, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Переваги:** немає вартості сервера, прямий доступ до локальних файлів, видиме вікно браузера.
    - **Недоліки:** sleep/network drops = розриви, оновлення/перезавантаження ОС переривають роботу, машина має залишатися ввімкненою.

    **VPS / хмара**

    - **Переваги:** постійна робота, стабільна мережа, немає проблем через sleep ноутбука, простіше підтримувати роботу.
    - **Недоліки:** часто headless-режим (використовуйте знімки екрана), лише віддалений доступ до файлів, для оновлень потрібен SSH.

    **Примітка, специфічна для OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord чудово працюють із VPS. Єдиний реальний компроміс — це **headless browser** проти видимого вікна. Див. [Browser](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо у вас раніше були відключення gateway. Локальний запуск чудово підходить, коли ви активно користуєтеся Mac і хочете локальний доступ до файлів або UI automation з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Не обов’язково, але **рекомендується для надійності та ізоляції**.

    - **Окремий host (VPS/Mac mini/Pi):** завжди увімкнений, менше переривань через sleep/reboot, чистіші дозволи, простіше підтримувати в роботі.
    - **Спільний ноутбук/десктоп:** цілком підходить для тестування й активного використання, але очікуйте пауз під час sleep або оновлень машини.

    Якщо хочете найкраще з обох світів, тримайте Gateway на окремому host і підключайте ноутбук як **node** для локальних інструментів screen/camera/exec. Див. [Nodes](/uk/nodes).
    Для вказівок із безпеки прочитайте [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яку ОС рекомендуєте?">
    OpenClaw легкий. Для базового Gateway + одного chat channel:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1-2 vCPU, 2GB RAM або більше для запасу (логи, медіа, кілька channels). Node tools і browser automation можуть вимагати більше ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Саме цей шлях встановлення для Linux протестований найкраще.

    Документація: [Linux](/uk/platforms/linux), [VPS hosting](/uk/vps).

  </Accordion>

  <Accordion title="Чи можна запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути постійно увімкнена, доступна та мати достатньо
    RAM для Gateway і будь-яких увімкнених channels.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька channels, browser automation або media tools.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви на Windows, **WSL2 — це найпростіше налаштування у стилі VM** і воно має найкращу сумісність
    з інструментами. Див. [Windows](/uk/platforms/windows), [VPS hosting](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw, в одному абзаці?">
    OpenClaw — це персональний AI-помічник, який ви запускаєте на власних пристроях. Він відповідає на поверхнях обміну повідомленнями, якими ви вже користуєтеся (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, а також bundled channel plugins, як-от QQ Bot) і також може забезпечувати voice + live Canvas на підтримуваних платформах. **Gateway** — це завжди активна control plane; помічник і є продуктом.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не "просто обгортка для Claude". Це **local-first control plane**, яка дозволяє вам запускати
    потужного помічника на **власному обладнанні**, доступного з chat apps, якими ви вже користуєтеся, із
    session history, memory та tools — без передачі контролю над вашими робочими процесами хостованому
    SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і тримайте
      workspace + session history локально.
    - **Реальні channels, а не web sandbox:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage/etc,
      а також mobile voice і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо, з маршрутизацією
      та failover на рівні agent.
    - **Варіант лише з локальними ресурсами:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо хочете.
    - **Маршрутизація multi-agent:** окремі agents за channel, акаунтом або завданням, кожен із власним
      workspace та налаштуваннями за замовчуванням.
    - **Відкритий код і hackable:** перевіряйте, розширюйте та self-host без vendor lock-in.

    Документація: [Gateway](/uk/gateway), [Channels](/uk/channels), [Multi-agent](/uk/concepts/multi-agent),
    [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно налаштував - що робити спочатку?">
    Хороші перші проєкти:

    - Зібрати сайт (WordPress, Shopify або простий static site).
    - Прототипувати mobile app (структура, екрани, план API).
    - Організувати файли й папки (очищення, назви, теги).
    - Підключити Gmail і автоматизувати підсумки або подальші дії.

    Він може впоратися з великими завданнями, але найкраще працює, коли ви розбиваєте їх на етапи
    і використовуєте sub agents для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найкращих щоденних сценаріїв використання OpenClaw?">
    Щоденні вигоди зазвичай виглядають так:

    - **Особисті брифінги:** підсумки пошти, календаря та новин, які вас цікавлять.
    - **Дослідження та чернетки:** швидке дослідження, підсумки й перші чернетки листів або документів.
    - **Нагадування та подальші дії:** nudges і checklists на основі cron або heartbeat.
    - **Автоматизація браузера:** заповнення форм, збір даних і повторення web-завдань.
    - **Координація між пристроями:** надішліть завдання з телефону, нехай Gateway виконає його на сервері, а результат повернеться в чат.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, ads і blogs для SaaS?">
    Так, для **дослідження, кваліфікації та створення чернеток**. Він може сканувати сайти, будувати короткі списки,
    узагальнювати потенційних клієнтів і писати чернетки outreach або ad copy.

    Для **outreach або запусків ads** залишайте людину в циклі. Уникайте спаму, дотримуйтеся місцевих законів і
    політик платформ та перевіряйте все перед надсиланням. Найбезпечніший шаблон — дозволити
    OpenClaw створити чернетку, а ви її схвалите.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для web development?">
    OpenClaw — це **персональний помічник** і координаційний шар, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу кодування всередині repo. Використовуйте OpenClaw, коли
    вам потрібні довготривала memory, доступ із різних пристроїв і orchestration інструментів.

    Переваги:

    - **Постійна memory + workspace** між сесіями
    - **Доступ із багатьох платформ** (WhatsApp, Telegram, TUI, WebChat)
    - **Orchestration інструментів** (browser, files, scheduling, hooks)
    - **Завжди активний Gateway** (можна запускати на VPS, взаємодіяти звідусіль)
    - **Nodes** для локальних browser/screen/camera/exec

    Приклади: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills і автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати skills, не забруднюючи repo?">
    Використовуйте керовані overrides замість редагування копії в repo. Розміщуйте свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, тож керовані overrides все одно мають вищий пріоритет за bundled skills без втручання в git. Якщо skill має бути встановлений глобально, але видимий лише деяким agents, тримайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` та `agents.list[].skills`. Лише зміни, що варті включення в upstream, мають жити в repo і надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можна завантажувати skills із власної папки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий пріоритет: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` за замовчуванням встановлює в `./skills`, що OpenClaw розглядає як `<workspace>/skills` у наступній сесії. Якщо skill має бути видимий лише певним agents, поєднайте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як використовувати різні моделі для різних завдань?">
    На сьогодні підтримуються такі шаблони:

    - **Cron jobs**: ізольовані jobs можуть задавати override `model` для кожної job.
    - **Sub-agents**: маршрутизуйте завдання до окремих agents з різними моделями за замовчуванням.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб змінити модель поточної session у будь-який момент.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як це винести?">
    Використовуйте **sub-agents** для довгих або паралельних завдань. Sub-agents працюють у власній session,
    повертають підсумок і зберігають чуйність вашого основного чату.

    Попросіть бота "створити sub-agent для цього завдання" або використайте `/subagents`.
    Використовуйте `/status` у чаті, щоб бачити, що Gateway робить прямо зараз (і чи він зайнятий).

    Порада щодо токенів: і довгі завдання, і sub-agents споживають токени. Якщо важлива вартість, задайте
    дешевшу модель для sub-agents через `agents.defaults.subagents.model`.

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють thread-bound subagent sessions у Discord?">
    Використовуйте прив’язки thread. Ви можете прив’язати thread Discord до subagent або session target, щоб подальші повідомлення в цій thread залишалися в прив’язаній session.

    Базовий процес:

    - Створіть через `sessions_spawn` з `thread: true` (і за бажанням `mode: "session"` для постійних подальших дій).
    - Або вручну прив’яжіть через `/focus <target>`.
    - Використовуйте `/agents`, щоб переглянути стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним зняттям фокусу.
    - Використовуйте `/unfocus`, щоб від’єднати thread.

    Потрібна конфігурація:

    - Глобальні параметри за замовчуванням: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Overrides для Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоприв’язка під час створення: задайте `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agents](/uk/tools/subagents), [Discord](/uk/channels/discord), [Довідник з конфігурації](/uk/gateway/configuration-reference), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent завершився, але оновлення про завершення прийшло не туди або взагалі не опублікувалося. Що перевірити?">
    Спочатку перевірте визначений requester route:

    - Доставка completion-mode subagent надає перевагу будь-якій прив’язаній thread або маршруту conversation, якщо він існує.
    - Якщо origin завершення містить лише channel, OpenClaw використовує stored route requester session (`lastChannel` / `lastTo` / `lastAccountId`) як fallback, щоб пряма доставка все одно могла спрацювати.
    - Якщо немає ні прив’язаного route, ні придатного stored route, пряма доставка може завершитися невдачею, і результат перейде до queued session delivery замість негайної публікації в чат.
    - Невалідні або застарілі targets усе ще можуть змусити перейти до queue fallback або остаточної помилки доставки.
    - Якщо остання видима assistant reply дочірнього процесу — це точний тихий token `NO_REPLY` / `no_reply` або точно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує announce замість публікації застарілого попереднього прогресу.
    - Якщо дочірній процес завершився за timeout лише після tool calls, announce може згорнути це в короткий підсумок часткового прогресу, а не відтворювати сирий tool output.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks), [Інструмент Session](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron працює всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані jobs не виконуватимуться.

    Список перевірки:

    - Підтвердьте, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не задано.
    - Переконайтеся, що Gateway працює 24/7 (без sleep/restarts).
    - Перевірте налаштування timezone для job (`--tz` проти timezone host).

    Налагодження:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Cron спрацював, але в channel нічого не було надіслано. Чому?">
    Спочатку перевірте режим доставки:

    - `--no-deliver` / `delivery.mode: "none"` означає, що зовнішнє повідомлення не очікується.
    - Відсутній або невалідний target announce (`channel` / `to`) означає, що runner пропустив outbound delivery.
    - Помилки auth каналу (`unauthorized`, `Forbidden`) означають, що runner спробував доставити, але облікові дані це заблокували.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` лише) вважається навмисно недоставлюваним, тому runner також пригнічує queued fallback delivery.

    Для ізольованих cron jobs runner відповідає за остаточну доставку. Від агента очікується
    повернення текстового підсумку, який runner відправить. `--no-deliver` зберігає
    цей результат усередині; це не дозволяє агенту надсилати напряму через
    message tool.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований cron run перемкнув моделі або один раз повторив спробу?">
    Зазвичай це шлях live model-switch, а не дубльоване планування.

    Ізольований cron може зберігати runtime handoff моделі та повторювати спробу, коли активний
    run викидає `LiveSessionModelSwitchError`. Повтор зберігає перемкнені
    provider/model, а якщо перемикання містило новий override auth profile, cron
    також зберігає його перед повтором.

    Пов’язані правила вибору:

    - Спочатку застосовується override моделі Gmail hook, якщо доречно.
    - Потім `model` для job.
    - Потім будь-який stored override моделі cron-session.
    - Потім звичайний вибір моделі agent/default.

    Цикл повторів обмежений. Після початкової спроби плюс 2 повторів через переключення
    cron переривається, а не зациклюється назавжди.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Як встановити Skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або розміщуйте skills у своєму workspace. UI Skills для macOS недоступний на Linux.
    Переглянути skills можна на [https://clawhub.ai](https://clawhub.ai).

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
    активного workspace. Встановлюйте окремий CLI `clawhub` лише якщо хочете публікувати або
    синхронізувати власні skills. Для спільних установок між agents розмістіть skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете звузити, які agents можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати завдання за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте scheduler Gateway:

    - **Cron jobs** для запланованих або повторюваних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок "головної session".
    - **Ізольовані jobs** для автономних agents, які публікують підсумки або доставляють їх у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати Apple macOS-only skills з Linux?">
    Не напряму. Skills macOS обмежуються `metadata.openclaw.os` плюс необхідними binary, і skills з’являються в system prompt лише тоді, коли вони підходять на **gateway host**. У Linux `darwin`-only skills (як-от `apple-notes`, `apple-reminders`, `things-mac`) не завантажуватимуться, якщо ви не перевизначите це обмеження.

    Є три підтримувані шаблони:

    **Варіант A - запускати Gateway на Mac (найпростіше).**
    Запустіть Gateway там, де існують binary macOS, а потім підключайтеся з Linux у [remote mode](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажуються нормально, бо gateway host — macOS.

    **Варіант B - використати macOS node (без SSH).**
    Запустіть Gateway на Linux, підключіть macOS node (menubar app) і встановіть **Node Run Commands** у значення "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати macOS-only skills придатними, коли потрібні binary існують на node. Агент запускає такі skills через інструмент `nodes`. Якщо ви виберете "Always Ask", схвалення "Always Allow" у prompt додає цю команду до allowlist.

    **Варіант C - проксіювати binary macOS через SSH (для досвідчених).**
    Тримайте Gateway на Linux, але зробіть так, щоб потрібні CLI binary визначалися як SSH wrappers, що працюють на Mac. Потім перевизначте skill, щоб дозволити Linux, і він залишався придатним.

    1. Створіть SSH wrapper для binary (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Помістіть wrapper у `PATH` на Linux host (наприклад `~/bin/memo`).
    3. Перевизначте metadata skill, щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Керування Apple Notes через CLI memo на macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Почніть нову session, щоб знімок skills оновився.

  </Accordion>

  <Accordion title="Чи є інтеграція з Notion або HeyGen?">
    Вбудованої поки немає.

    Варіанти:

    - **Власний skill / plugin:** найкраще для надійного API-доступу (і Notion, і HeyGen мають API).
    - **Автоматизація браузера:** працює без коду, але повільніше і крихкіше.

    Якщо ви хочете зберігати контекст для кожного клієнта (agency workflows), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + уподобання + активна робота).
    - Попросіть агента отримувати цю сторінку на початку session.

    Якщо вам потрібна native integration, відкрийте feature request або створіть skill
    для цих APIs.

    Встановлення skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні інсталяції потрапляють у каталог `skills/` активного workspace. Для спільних skills між agents розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільна інсталяція має бути видима лише деяким agents, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі skills очікують наявності binary, встановлених через Homebrew; на Linux це означає Linuxbrew (див. запис FAQ про Homebrew на Linux вище). Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати свій уже залогінений Chrome з OpenClaw?">
    Використовуйте вбудований browser profile `user`, який підключається через Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Якщо ви хочете власну назву, створіть явний MCP profile:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Цей шлях є локальним для host. Якщо Gateway працює деінде, або запускайте node host на машині з браузером, або використовуйте remote CDP.

    Поточні обмеження `existing-session` / `user`:

    - дії прив’язані до ref, а не до CSS-selector
    - uploads вимагають `ref` / `inputRef` і наразі підтримують лише один файл за раз
    - `responsebody`, експорт у PDF, перехоплення завантажень і batch actions усе ще потребують керованого browser або raw CDP profile

  </Accordion>
</AccordionGroup>

## Ізоляція та memory

<AccordionGroup>
  <Accordion title="Чи є окремий документ про sandboxing?">
    Так. Див. [Sandboxing](/uk/gateway/sandboxing). Для налаштування, специфічного для Docker (повний gateway у Docker або sandbox images), див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим - як увімкнути повні можливості?">
    Образ за замовчуванням орієнтований на безпеку й працює від користувача `node`, тому він не
    містить system packages, Homebrew або bundled browsers. Для повнішого налаштування:

    - Зберігайте `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші не зникали.
    - Додавайте system deps в образ за допомогою `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Встановлюйте Playwright browsers через bundled CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Задайте `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я зберегти DM особистими, а групи зробити публічними/ізольованими з одним agent?">
    Так — якщо ваш приватний трафік — це **DMs**, а публічний — це **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб групові/channel sessions (не-main keys) працювали в Docker, тоді як основна DM session залишалася на host. Потім обмежте, які tools доступні в ізольованих sessions, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад config: [Групи: особисті DMs + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Основний довідник із config: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як працює memory?">
    Memory OpenClaw — це просто Markdown files у workspace agent:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Кураторські довгострокові нотатки в `MEMORY.md` (лише для main/private sessions)

    OpenClaw також запускає **тихий pre-compaction flush memory**, щоб нагадати моделі
    записати довготривалі нотатки перед auto-compaction. Це виконується лише тоді, коли workspace
    доступний для запису (read-only sandboxes це пропускають). Див. [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Memory постійно щось забуває. Як зробити, щоб це зберігалося?">
    Попросіть бота **записати факт у memory**. Довгострокові нотатки мають бути в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще напрям, який ми покращуємо. Корисно нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона все одно забуває, переконайтеся, що Gateway використовує той самий
    workspace під час кожного запуску.

    Документація: [Memory](/uk/concepts/memory), [Agent workspace](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається memory назавжди? Які є обмеження?">
    Файли memory живуть на диску й зберігаються, доки ви їх не видалите. Обмеженням є ваше
    сховище, а не модель. **Контекст session** усе ж обмежений вікном контексту моделі,
    тому довгі розмови можуть стискатися або обрізатися. Саме тому існує пошук memory —
    він повертає в контекст лише релевантні частини.

    Документація: [Memory](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потребує семантичний пошук memory OpenAI API key?">
    Лише якщо ви використовуєте **OpenAI embeddings**. Codex OAuth покриває chat/completions і
    **не** дає доступу до embeddings, тож **вхід через Codex (OAuth або через
    вхід у Codex CLI)** не допоможе для семантичного пошуку memory. Для OpenAI embeddings
    усе ще потрібен справжній API key (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви не задаєте provider явно, OpenClaw автоматично вибирає provider, коли
    може визначити API key (auth profiles, `models.providers.*.apiKey` або env vars).
    Він віддає перевагу OpenAI, якщо знаходиться ключ OpenAI, інакше Gemini, якщо знаходиться ключ Gemini,
    потім Voyage, потім Mistral. Якщо жодного remote key немає, пошук
    memory залишатиметься вимкненим, доки ви його не налаштуєте. Якщо у вас налаштовано й наявний шлях
    до локальної моделі, OpenClaw
    віддає перевагу `local`. Ollama підтримується, коли ви явно задаєте
    `memorySearch.provider = "ollama"`.

    Якщо ви хочете залишатися локально, задайте `memorySearch.provider = "local"` (і за бажанням
    `memorySearch.fallback = "none"`). Якщо вам потрібні embeddings Gemini, задайте
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо моделі embeddings **OpenAI, Gemini, Voyage, Mistral, Ollama або local**
    — подробиці налаштування див. у [Memory](/uk/concepts/memory).

  </Accordion>
</AccordionGroup>

## Де що лежить на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, що використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** sessions, файли memory, config і workspace живуть на gateway host
      (`~/.openclaw` + ваш каталог workspace).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте model providers (Anthropic/OpenAI/etc.), надходять до
      їхніх API, а chat platforms (WhatsApp/Telegram/Slack/etc.) зберігають дані повідомлень на своїх
      серверах.
    - **Ви контролюєте footprint:** використання локальних моделей залишає prompts на вашій машині, але трафік
      channels усе одно проходить через сервери цих channels.

    Пов’язане: [Agent workspace](/uk/concepts/agent-workspace), [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе живе в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Path                                                            | Призначення                                                        |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основний config (JSON5)                                            |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy OAuth import (копіюється в auth profiles під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, API keys та необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язкове file-backed secret payload для провайдерів `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Файл legacy compatibility (статичні записи `api_key` очищено)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдерів (наприклад `whatsapp/<accountId>/creds.json`)     |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан для кожного agent (agentDir + sessions)                       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і state (для кожного agent)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані sessions (для кожного agent)                              |

    Шлях legacy single-agent: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`).

    Ваш **workspace** (`AGENTS.md`, файли memory, skills тощо) зберігається окремо і налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають лежати AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці files живуть у **workspace agent**, а не в `~/.openclaw`.

    - **Workspace (для кожного agent)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (або legacy fallback `memory.md`, якщо `MEMORY.md` відсутній),
      `memory/YYYY-MM-DD.md`, необов’язковий `HEARTBEAT.md`.
    - **State dir (`~/.openclaw`)**: config, state channels/providers, auth profiles, sessions, logs,
      і спільні skills (`~/.openclaw/skills`).

    Типовий workspace — `~/.openclaw/workspace`, налаштовується через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот "забуває" після перезапуску, переконайтеся, що Gateway використовує той самий
    workspace під час кожного запуску (і пам’ятайте: remote mode використовує **workspace gateway host**,
    а не ваш локальний ноутбук).

    Порада: якщо ви хочете закріпити поведінку або вподобання, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладатися на історію чату.

    Див. [Agent workspace](/uk/concepts/agent-workspace) і [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Помістіть свій **workspace agent** у **приватний** git repo і робіть резервні копії
    у приватному місці (наприклад, приватному GitHub). Це захоплює memory + файли AGENTS/SOUL/USER
    і дозволяє пізніше відновити "розум" помічника.

    **Не** комітьте нічого з `~/.openclaw` (облікові дані, sessions, токени або encrypted secret payloads).
    Якщо вам потрібне повне відновлення, окремо робіть резервні копії і workspace, і state directory
    (див. питання про міграцію вище).

    Документація: [Agent workspace](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окрему інструкцію: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть agents працювати поза workspace?">
    Так. Workspace — це **cwd за замовчуванням** і точка прив’язки memory, а не жорсткий sandbox.
    Відносні шляхи визначаються всередині workspace, але абсолютні шляхи можуть отримувати доступ до інших
    розташувань host, якщо sandboxing не ввімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування sandbox для кожного agent. Якщо ви
    хочете, щоб repo був робочим каталогом за замовчуванням, вкажіть для цього agent
    `workspace` на корінь repo. Repo OpenClaw — це просто вихідний код; тримайте
    workspace окремо, якщо тільки не хочете навмисно, щоб agent працював усередині нього.

    Приклад (repo як cwd за замовчуванням):

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

  <Accordion title="Remote mode: де знаходиться session store?">
    Стан session належить **gateway host**. Якщо ви працюєте в remote mode, потрібний вам session store розташований на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Керування sessions](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи config

<AccordionGroup>
  <Accordion title="Який формат config? Де він знаходиться?">
    OpenClaw читає необов’язковий config **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються більш-менш безпечні значення за замовчуванням (зокрема workspace за замовчуванням `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я встановив gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Bind без loopback **вимагають валідного шляху auth gateway**. На практиці це означає:

    - shared-secret auth: token або password
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

    - `gateway.remote.token` / `.password` самі по собі **не** вмикають локальний auth gateway.
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як fallback лише тоді, коли `gateway.auth.*` не задано.
    - Для password auth задайте `gateway.auth.mode: "password"` плюс `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не вдається визначити значення, визначення завершується за принципом fail closed (без маскування remote fallback).
    - Налаштування Control UI із shared secret проходять автентифікацію через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в параметрах app/UI). Режими з identity, як-от Tailscale Serve або `trusted-proxy`, натомість використовують request headers. Уникайте розміщення shared secrets в URL.
    - З `gateway.auth.mode: "trusted-proxy"` reverse proxies на тому ж host через loopback усе одно **не** задовольняють trusted-proxy auth. Trusted proxy має бути налаштованим джерелом без loopback.

  </Accordion>

  <Accordion title="Чому тепер мені потрібен token на localhost?">
    OpenClaw за замовчуванням забезпечує auth gateway, включно з loopback. У звичайному шляху за замовчуванням це означає token auth: якщо явний шлях auth не налаштовано, під час запуску gateway використовується режим token і він автоматично генерується, зберігаючись у `gateway.auth.token`, тож **локальні WS clients повинні проходити автентифікацію**. Це блокує інші локальні процеси від виклику Gateway.

    Якщо ви віддаєте перевагу іншому шляху auth, можна явно вибрати режим password (або, для identity-aware reverse proxies без loopback, `trusted-proxy`). Якщо ви **дійсно** хочете відкритий loopback, явно задайте `gateway.auth.mode: "none"` у config. Doctor може згенерувати token у будь-який час: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни config?">
    Gateway відстежує config і підтримує hot-reload:

    - `gateway.reload.mode: "hybrid"` (типово): hot-apply безпечних змін, restart для критичних
    - також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні слогани CLI?">
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

    - `off`: приховує текст слогана, але залишає title/version line банера.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: ротація кумедних/сезонних слоганів (типова поведінка).
    - Якщо ви взагалі не хочете банер, задайте env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути web search (і web fetch)?">
    `web_fetch` працює без API key. `web_search` залежить від обраного
    provider:

    - Провайдери на основі API, як-от Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, потребують звичайного налаштування API key.
    - Ollama Web Search не потребує ключа, але використовує налаштований Ollama host і вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна інтеграція на основі HTML.
    - SearXNG не потребує ключа/self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Рекомендовано:** виконайте `openclaw configure --section web` і оберіть provider.
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

    Конфігурація web-search, специфічна для provider, тепер розміщується в `plugins.entries.<plugin>.config.webSearch.*`.
    Legacy-шляхи provider `tools.web.search.*` усе ще тимчасово завантажуються для сумісності, але їх не слід використовувати в нових config.
    Конфігурація fallback web-fetch Firecrawl розміщується в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlists, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнено за замовчуванням (якщо його явно не вимкнено).
    - Якщо `tools.web.fetch.provider` не вказано, OpenClaw автоматично визначає першого готового fetch fallback provider із доступних облікових даних. Наразі bundled provider — Firecrawl.
    - Daemons читають env vars з `~/.openclaw/.env` (або із service environment).

    Документація: [Web tools](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мій config. Як відновитися і як цього уникнути?">
    `config.apply` замінює **весь config**. Якщо ви надсилаєте частковий об’єкт, усе
    інше видаляється.

    Відновлення:

    - Відновіть із резервної копії (git або скопійований `~/.openclaw/openclaw.json`).
    - Якщо резервної копії немає, повторно запустіть `openclaw doctor` і налаштуйте channels/models заново.
    - Якщо це було неочікувано, створіть bug report і додайте свій останній відомий config або будь-яку резервну копію.
    - Локальний coding agent часто може відновити робочий config із логів або історії.

    Як уникнути:

    - Для невеликих змін використовуйте `openclaw config set`.
    - Для інтерактивних змін використовуйте `openclaw configure`.
    - Якщо ви не впевнені в точному шляху або формі поля, спочатку використайте `config.schema.lookup`; він повертає shallow schema node плюс короткі зведення дочірніх елементів для подальшого заглиблення.
    - Для часткових RPC-редагувань використовуйте `config.patch`; залишайте `config.apply` лише для повної заміни config.
    - Якщо ви використовуєте owner-only інструмент `gateway` із запуску agent, він усе одно відхилить запис у `tools.exec.ask` / `tools.exec.security` (включно з legacy aliases `tools.bash.*`, які нормалізуються до тих самих захищених exec paths).

    Документація: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими workers на різних пристроях?">
    Поширений шаблон — **один Gateway** (наприклад, Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** володіє channels (Signal/WhatsApp), маршрутизацією та sessions.
    - **Nodes (пристрої):** Mac/iOS/Android підключаються як периферія та надають локальні tools (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** окремі brains/workspaces для спеціальних ролей (наприклад, "Hetzner ops", "Personal data").
    - **Sub-agents:** запускайте фонову роботу від основного agent, коли потрібен паралелізм.
    - **TUI:** підключайтеся до Gateway і перемикайте agents/sessions.

    Документація: [Nodes](/uk/nodes), [Віддалений доступ](/uk/gateway/remote), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Чи може браузер OpenClaw працювати в headless режимі?">
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

    За замовчуванням — `false` (з вікном). Headless частіше викликає anti-bot перевірки на деяких сайтах. Див. [Browser](/uk/tools/browser).

    Headless використовує **той самий рушій Chromium** і підходить для більшості automation (форми, кліки, scraping, входи). Основні відмінності:

    - Немає видимого вікна браузера (якщо потрібна візуалізація, використовуйте знімки екрана).
    - Деякі сайти суворіше ставляться до automation у headless режимі (CAPTCHAs, anti-bot).
      Наприклад, X/Twitter часто блокує headless sessions.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Задайте `browser.executablePath` на ваш binary Brave (або будь-який Chromium-based browser) і перезапустіть Gateway.
    Повні приклади config див. у [Browser](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway і nodes

<AccordionGroup>
  <Accordion title="Як команди проходять між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає agent і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен node tool:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідний трафік провайдера; вони отримують лише node RPC calls.

  </Accordion>

  <Accordion title="Як agent може отримати доступ до мого комп’ютера, якщо Gateway розміщено віддалено?">
    Коротка відповідь: **підключіть свій комп’ютер як node**. Gateway працює деінде, але він може
    викликати інструменти `node.*` (screen, camera, system) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на постійно увімкненому host (VPS/home server).
    2. Додайте gateway host + ваш комп’ютер до одного tailnet.
    3. Переконайтеся, що Gateway WS доступний (bind tailnet або SSH tunnel).
    4. Відкрийте локально застосунок macOS і підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як node.
    5. Схваліть node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP bridge не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування про безпеку: pairing macOS node дозволяє `system.run` на цій машині. Підключайте
    лише пристрої, яким довіряєте, і перегляньте [Безпека](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Протокол Gateway](/uk/gateway/protocol), [віддалений режим macOS](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключений, але я не отримую відповідей. Що тепер?">
    Перевірте основне:

    - Gateway працює: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан channels: `openclaw channels status`

    Потім перевірте auth і маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` налаштовано правильно.
    - Якщо підключаєтеся через SSH tunnel, підтвердьте, що локальний tunnel активний і вказує на правильний port.
    - Переконайтеся, що ваші allowlists (DM або group) містять ваш акаунт.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Channels](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два інстанси OpenClaw спілкуватися між собою (локальний + VPS)?">
    Так. Вбудованого bridge "бот-до-бота" немає, але це можна з’єднати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний chat channel, до якого обидва боти мають доступ (Telegram/Slack/WhatsApp).
    Нехай Bot A надішле повідомлення Bot B, а потім Bot B відповість як звичайно.

    **CLI bridge (загальний):** запустіть script, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючи його на чат, де інший бот
    слухає. Якщо один бот працює на віддаленому VPS, спрямуйте свій CLI на цей remote Gateway
    через SSH/Tailscale (див. [Віддалений доступ](/uk/gateway/remote)).

    Приклад шаблону (запускайте з машини, яка може досягти цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте захист, щоб два боти не зациклилися у нескінченній відповіді (лише згадки, channel
    allowlists або правило "не відповідати на повідомлення ботів").

    Документація: [Віддалений доступ](/uk/gateway/remote), [CLI Agent](/cli/agent), [Надсилання Agent](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох agents?">
    Ні. Один Gateway може хостити кілька agents, кожен із власним workspace, моделями за замовчуванням
    і маршрутизацією. Це нормальне налаштування, і воно значно дешевше та простіше, ніж запускати
    один VPS на кожного agent.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні config, які ви не хочете спільно використовувати. Інакше тримайте один Gateway і
    використовуйте кілька agents або sub-agents.

  </Accordion>

  <Accordion title="Чи є перевага у використанні node на моєму особистому ноутбуці замість SSH із VPS?">
    Так — nodes є основним способом дістатися вашого ноутбука з віддаленого Gateway, і вони
    відкривають більше, ніж просто доступ до оболонки. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (достатньо невеликого VPS або box рівня Raspberry Pi; 4 GB RAM більш ніж достатньо), тому типовий
    сценарій — це постійно увімкнений host плюс ваш ноутбук як node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують pairing пристроїв.
    - **Безпечніші механізми виконання.** `system.run` контролюється allowlists/approvals node на цьому ноутбуці.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна automation браузера.** Тримайте Gateway на VPS, але запускайте Chrome локально через node host на ноутбуці або підключайтеся до локального Chrome на host через Chrome MCP.

    SSH підходить для епізодичного доступу до оболонки, але nodes простіші для постійних робочих процесів agent
    та automation пристрою.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes службу gateway?">
    Ні. На одному host має працювати лише **один gateway**, якщо тільки ви навмисно не запускаєте ізольовані profiles (див. [Кілька gateway](/uk/gateway/multiple-gateways)). Nodes — це периферія, яка підключається
    до gateway (nodes iOS/Android або режим "node mode" macOS у menubar app). Для headless node
    hosts і керування через CLI див. [CLI Node host](/cli/node).

    Повний restart потрібен для змін `gateway`, `discovery` і `canvasHost`.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати config?">
    Так.

    - `config.schema.lookup`: переглянути одне піддерево config із його shallow schema node, відповідною UI-підказкою та зведеннями безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний snapshot + hash
    - `config.patch`: безпечне часткове оновлення (переважно для більшості RPC-редагувань)
    - `config.apply`: перевірити + замінити весь config, потім restart
    - Owner-only runtime tool `gateway` усе ще відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; legacy aliases `tools.bash.*` нормалізуються до тих самих захищених exec paths

  </Accordion>

  <Accordion title="Мінімальний розумний config для першого встановлення">
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

    1. **Встановлення + вхід на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Встановлення + вхід на вашому Mac**
       - Використайте застосунок Tailscale і ввійдіть у той самий tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - У консолі адміністрування Tailscale увімкніть MagicDNS, щоб VPS мав стабільне ім’я.
    4. **Використовуйте ім’я host tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо ви хочете Control UI без SSH, використовуйте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив’язаним до loopback і відкриває HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як підключити Mac node до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Gateway Control UI + WS**. Nodes підключаються через той самий endpoint Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS + Mac знаходяться в одному tailnet**.
    2. **Використовуйте застосунок macOS у Remote mode** (SSH target може бути ім’ям host tailnet).
       Застосунок зробить tunnel порту Gateway і підключиться як node.
    3. **Схваліть node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Протокол Gateway](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [віддалений режим macOS](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи слід встановити на другому ноутбуці чи просто додати node?">
    Якщо вам потрібні лише **локальні інструменти** (screen/camera/exec) на другому ноутбуці, додайте його як
    **node**. Це зберігає єдиний Gateway і уникає дублювання config. Локальні node tools
    наразі доступні лише на macOS, але ми плануємо поширити їх на інші ОС.

    Встановлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes), [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars і завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує environment variables?">
    OpenClaw читає env vars із батьківського процесу (shell, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного working directory
    - глобальний fallback `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден із файлів `.env` не перевизначає наявні env vars.

    Ви також можете визначити inline env vars у config (застосовуються лише якщо вони відсутні в env процесу):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Див. [/environment](/uk/help/environment) щодо повного пріоритету та джерел.

  </Accordion>

  <Accordion title="Я запустив Gateway через service, і мої env vars зникли. Що тепер?">
    Два поширені виправлення:

    1. Помістіть відсутні keys у `~/.openclaw/.env`, щоб вони підхоплювалися навіть тоді, коли service не успадковує env вашої shell.
    2. Увімкніть import shell (опційна зручність):

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

    Це запускає вашу login shell і імпортує лише відсутні очікувані keys (ніколи не перевизначає наявні). Еквіваленти env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я встановив COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` повідомляє, чи ввімкнено **імпорт env зі shell**. "Shell env: off"
    **не** означає, що ваші env vars відсутні — це лише означає, що OpenClaw не завантажуватиме
    вашу login shell автоматично.

    Якщо Gateway працює як service (launchd/systemd), він не успадковує env вашої shell.
    Виправити можна одним із таких способів:

    1. Помістіть token у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або увімкніть import shell (`env.shellEnv.enabled: true`).
    3. Або додайте його в блок `env` config (застосовується лише якщо змінна відсутня).

    Потім перезапустіть gateway і повторно перевірте:

    ```bash
    openclaw models status
    ```

    Copilot tokens читаються з `COPILOT_GITHUB_TOKEN` (також `GH_TOKEN` / `GITHUB_TOKEN`).
    Див. [/concepts/model-providers](/uk/concepts/model-providers) і [/environment](/uk/help/environment).

  </Accordion>
</AccordionGroup>

## Sessions і кілька чатів

<AccordionGroup>
  <Accordion title="Як почати нову розмову?">
    Надішліть `/new` або `/reset` як окреме повідомлення. Див. [Керування sessions](/uk/concepts/session).
  </Accordion>

  <Accordion title="Чи скидаються sessions автоматично, якщо я ніколи не надсилаю /new?">
    Sessions можуть завершуватися після `session.idleMinutes`, але це **вимкнено за замовчуванням** (типово **0**).
    Задайте додатне значення, щоб увімкнути завершення через бездіяльність. Коли його ввімкнено, **наступне**
    повідомлення після періоду бездіяльності починає новий session id для цього chat key.
    Це не видаляє transcripts — лише починає нову session.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи можна створити команду з інстансів OpenClaw (один CEO і багато agents)?">
    Так, через **маршрутизацію multi-agent** і **sub-agents**. Ви можете створити одного координувального
    agent і кількох робочих agents з власними workspaces і моделями.

    Втім, це краще розглядати як **цікавий експеримент**. Це важко за токенами і часто
    менш ефективно, ніж використання одного бота з окремими sessions. Типова модель, яку ми
    уявляємо, — це один бот, з яким ви розмовляєте, з різними sessions для паралельної роботи. Цей
    бот також може створювати sub-agents, коли потрібно.

    Документація: [Маршрутизація Multi-agent](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [CLI Agents](/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст обрізався посеред завдання? Як цьому запобігти?">
    Контекст session обмежений вікном моделі. Довгі чати, великі tool outputs або багато
    files можуть запускати compaction або truncation.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у file.
    - Використовуйте `/compact` перед довгими завданнями і `/new` при зміні теми.
    - Тримайте важливий контекст у workspace і просіть бота перечитувати його.
    - Використовуйте sub-agents для довгих або паралельних завдань, щоб основний чат лишався меншим.
    - Оберіть модель з більшим вікном контексту, якщо це трапляється часто.

  </Accordion>

  <Accordion title="Як повністю скинути OpenClaw, але залишити встановленим?">
    Використовуйте команду reset:

    ```bash
    openclaw reset
    ```

    Неінтерактивний повний reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Потім повторно запустіть налаштування:

    ```bash
    openclaw onboard --install-daemon
    ```

    Примітки:

    - Онбординг також пропонує **Reset**, якщо бачить наявний config. Див. [Онбординг (CLI)](/uk/start/wizard).
    - Якщо ви використовували profiles (`--profile` / `OPENCLAW_PROFILE`), скидайте кожен state dir (типово це `~/.openclaw-<profile>`).
    - Dev reset: `openclaw gateway --dev --reset` (лише для dev; стирає dev config + credentials + sessions + workspace).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" - як скинути або стиснути?'>
    Використайте один із цих варіантів:

    - **Стиснення** (зберігає розмову, але підсумовує старіші turns):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб спрямувати підсумок.

    - **Скидання** (новий ID session для того самого chat key):

      ```
      /new
      /reset
      ```

    Якщо це повторюється:

    - Увімкніть або налаштуйте **session pruning** (`agents.defaults.contextPruning`), щоб обрізати старий tool output.
    - Використовуйте модель із більшим вікном контексту.

    Документація: [Compaction](/uk/concepts/compaction), [Session pruning](/uk/concepts/session-pruning), [Керування sessions](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка перевірки provider: модель видала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія session застаріла або пошкоджена (часто після довгих threads
    або зміни tool/schema).

    Виправлення: почніть нову session командою `/new` (окремим повідомленням).

  </Accordion>

  <Accordion title="Чому я отримую heartbeat-повідомлення кожні 30 хвилин?">
    Heartbeat запускаються кожні **30m** за замовчуванням (**1h** при використанні OAuth auth). Налаштуйте або вимкніть їх:

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

    Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown
    headers на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб заощадити API calls.
    Якщо файл відсутній, heartbeat усе одно запускається, а модель сама вирішує, що робити.

    Overrides для кожного agent використовують `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "bot account" до групи WhatsApp?'>
    Ні. OpenClaw працює на **вашому власному акаунті**, тож якщо ви перебуваєте в групі, OpenClaw може її бачити.
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
    Варіант 1 (найшвидший): показуйте логи в реальному часі й надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Шукайте `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/додано до allowlist): перелічіть groups із config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Дві поширені причини:

    - Увімкнено gating за згадкою (за замовчуванням). Ви повинні @mention бота (або відповідати `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і group не в allowlist.

    Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи ділять groups/threads контекст із DMs?">
    Direct chats за замовчуванням згортаються до main session. Групи/channels мають власні session keys, а topics Telegram / threads Discord є окремими sessions. Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки workspaces і agents я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але слідкуйте за:

    - **Зростанням диска:** sessions + transcripts живуть у `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартістю токенів:** більше agents означає більше одночасного використання моделей.
    - **Операційними витратами:** auth profiles, workspaces і channel routing для кожного agent.

    Поради:

    - Тримайте один **активний** workspace на agent (`agents.defaults.workspace`).
    - Обрізайте старі sessions (видаляйте JSONL або записи сховища), якщо диск розростається.
    - Використовуйте `openclaw doctor`, щоб виявити зайві workspaces і невідповідності profiles.

  </Accordion>

  <Accordion title="Чи можу я запускати кількох ботів або чатів одночасно (Slack), і як це правильно налаштувати?">
    Так. Використовуйте **Маршрутизацію Multi-Agent**, щоб запускати кілька ізольованих agents і маршрутизувати вхідні повідомлення за
    channel/account/peer. Slack підтримується як channel і може бути прив’язаний до конкретних agents.

    Доступ до браузера — потужна річ, але це не "зроби все, що може людина" — anti-bot, CAPTCHAs і MFA все
    одно можуть блокувати automation. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на host
    або CDP на машині, де браузер реально працює.

    Найкраща практика налаштування:

    - Завжди увімкнений Gateway host (VPS/Mac mini).
    - Один agent на роль (bindings).
    - Channels Slack, прив’язані до цих agents.
    - Локальний браузер через Chrome MCP або node за потреби.

    Документація: [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Browser](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: значення за замовчуванням, вибір, aliases, перемикання

<AccordionGroup>
  <Accordion title='Що таке "модель за замовчуванням"?'>
    Модель OpenClaw за замовчуванням — це те, що ви задаєте як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються як `provider/model` (наприклад: `openai/gpt-5.4`). Якщо ви опускаєте provider, OpenClaw спочатку намагається використати alias, потім унікальний match налаштованого provider для цього exact model id, і лише потім повертається до налаштованого provider за замовчуванням як deprecated compatibility path. Якщо цей provider більше не надає налаштовану модель за замовчуванням, OpenClaw повертається до першої налаштованої provider/model замість показу застарілого default від видаленого provider. Вам усе одно слід **явно** задавати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендована модель за замовчуванням:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для agents з інструментами або з недовіреним вводом:** ставте силу моделі вище за вартість.
    **Для рутинних/низькоризикових чатів:** використовуйте дешевші fallback models і маршрутизуйте за роллю agent.

    Для MiniMax є окрема документація: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Емпіричне правило: використовуйте **найкращу модель, яку можете собі дозволити**, для високоризикової роботи, а дешевшу
    модель — для рутинного чату або підсумків. Ви можете маршрутизувати моделі на рівні agent і використовувати sub-agents для
    паралелізації довгих завдань (кожен sub-agent споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Sub-agents](/uk/tools/subagents).

    Сильне попередження: слабші/надмірно квантизовані моделі більш вразливі до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі, не стираючи мій config?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни config.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для session)
    - `openclaw models set ...` (оновлює лише config моделі)
    - `openclaw configure --section model` (інтерактивно)
    - редагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` із частковим об’єктом, якщо тільки не маєте наміру замінити весь config.
    Для RPC-редагувань спершу переглядайте через `config.schema.lookup` і надавайте перевагу `config.patch`. Payload lookup надає нормалізований path, короткі docs/constraints schema та зведення безпосередніх дочірніх елементів
    для часткових оновлень.
    Якщо ви все ж перезаписали config, відновіть його з резервної копії або повторно запустіть `openclaw doctor` для виправлення.

    Документація: [Моделі](/uk/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати self-hosted моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Встановіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull glm-4.7-flash`
    3. Якщо ви також хочете cloud models, виконайте `ollama signin`
    4. Виконайте `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає вам cloud models плюс локальні моделі Ollama
    - cloud models, як-от `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка про безпеку: менші або сильно квантизовані моделі більш вразливі до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати tools.
    Якщо ви все ж хочете маленькі моделі, увімкніть sandboxing і суворі tool allowlists.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Sandboxing](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися і змінюватися з часом; фіксованої рекомендації щодо provider немає.
    - Перевіряйте поточне runtime-налаштування на кожному gateway через `openclaw models status`.
    - Для agents із чутливими до безпеки/inструментальними задачами використовуйте найсильнішу доступну модель останнього покоління.
  </Accordion>

  <