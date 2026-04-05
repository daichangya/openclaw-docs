---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час роботи
    - Тріаж проблем, про які повідомляють користувачі, перед глибшим налагодженням
summary: Часті запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-05T18:22:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: f1004466a417ae57373048f4353ab4040a5c567980542375fbf55ff93132de31
    source_path: help/faq.md
    workflow: 15
---

# Поширені запитання

Швидкі відповіді та глибше усунення несправностей для реальних сценаріїв налаштування (локальна розробка, VPS, multi-agent, OAuth/API-ключі, резервне перемикання моделей). Для діагностики під час роботи див. [Troubleshooting](/uk/gateway/troubleshooting). Повний довідник з конфігурації див. у [Configuration](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламано

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидке локальне зведення: ОС + оновлення, доступність gateway/service, agents/sessions, конфігурація провайдера + проблеми під час роботи (коли gateway доступний).

2. **Звіт, який можна вставити й безпечно поширити**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з хвостом логів (токени приховано).

3. **Стан демона та порту**

   ```bash
   openclaw gateway status
   ```

   Показує runtime супервізора порівняно з доступністю RPC, цільову URL-адресу probe і яку конфігурацію сервіс імовірно використовував.

4. **Глибокі probe-перевірки**

   ```bash
   openclaw status --deep
   ```

   Виконує live gateway health probe, включно з перевірками каналів, коли це підтримується
   (потрібен доступний gateway). Див. [Health](/uk/gateway/health).

5. **Перегляд найновішого журналу**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використовуйте:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові логи відокремлені від логів сервісу; див. [Logging](/uk/logging) і [Troubleshooting](/uk/gateway/troubleshooting).

6. **Запустити doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує config/state + запускає health checks. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # показує цільову URL-адресу + шлях до config у разі помилок
   ```

   Запитує у запущеного gateway повний знімок (лише WS). Див. [Health](/uk/gateway/health).

## Швидкий старт і початкове налаштування

<AccordionGroup>
  <Accordion title="Я застряг, найшвидший спосіб розблокуватися">
    Скористайтеся локальним AI-агентом, який може **бачити вашу машину**. Це набагато ефективніше, ніж питати
    у Discord, бо більшість випадків «я застряг» — це **проблеми локальної конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти логи та допомагати виправляти
    налаштування на рівні машини (PATH, сервіси, дозволи, auth-файли). Надайте їм **повну копію вихідного коду**
    через hackable (git) install:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **із git checkout**, тому агент може читати код і документацію та
    міркувати про точну версію, яку ви використовуєте. Пізніше ви завжди можете повернутися до stable,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й супроводжувати** виправлення (крок за кроком), а потім виконати лише
    потрібні команди. Це зберігає зміни невеликими й полегшує аудит.

    Якщо ви виявите реальний баг або виправлення, будь ласка, створіть GitHub issue або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (діліться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок здоров’я gateway/agent + базової конфігурації.
    - `openclaw models status`: перевіряє auth провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє поширені проблеми config/state.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламано](#перші-60-секунд-якщо-щось-зламано).
    Документація зі встановлення: [Install](/uk/install), [Installer flags](/uk/install/installer), [Updating](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску heartbeat:

    - `quiet-hours`: поза налаштованим вікном active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожній/заголовковий каркас
    - `no-tasks-due`: у `HEARTBEAT.md` активний режим задач, але жоден з інтервалів задач ще не настав
    - `alerts-disabled`: вся видимість heartbeat вимкнена (`showOk`, `showAlerts` і `useIndicator` вимкнені)

    У режимі задач часові мітки настання оновлюються лише після завершення реального heartbeat-запуску.
    Пропущені запуски не позначають задачі як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Automation & Tasks](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановлення та налаштування OpenClaw">
    У репозиторії рекомендується запуск із вихідного коду та використання onboarding:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати UI assets. Після onboarding ви зазвичай запускаєте Gateway на порту **18789**.

    Із вихідного коду (для учасників/розробників):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # автоматично встановлює UI deps під час першого запуску
    openclaw onboard
    ```

    Якщо у вас ще немає глобального встановлення, запускайте через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Як відкрити dashboard після onboarding?">
    Майстер відкриває браузер із чистою (без токена) URL-адресою dashboard одразу після onboarding і також друкує посилання в підсумку. Залиште цю вкладку відкритою; якщо її не було запущено, скопіюйте та вставте надруковану URL-адресу на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується shared-secret auth, вставте налаштований токен або пароль у налаштуваннях Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо shared secret ще не налаштовано, згенеруйте токен командою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште bind loopback, виконайте `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, identity headers задовольняють auth для Control UI/WebSocket (без вставляння shared secret, за умови довіри до gateway host); HTTP API усе одно потребують shared-secret auth, якщо ви навмисно не використовуєте private-ingress `none` або trusted-proxy HTTP auth.
      Невдалі одночасні спроби автентифікації Serve з одного клієнта серіалізуються до того, як лімітатор failed-auth зафіксує їх, тож уже друга невдала повторна спроба може показати `retry later`.
    - **Tailnet bind**: виконайте `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте auth паролем), відкрийте `http://<tailscale-ip>:18789/`, потім вставте відповідний shared secret у налаштуваннях dashboard.
    - **Identity-aware reverse proxy**: залиште Gateway за non-loopback trusted proxy, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL-адресу proxy.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`. Shared-secret auth усе ще застосовується через tunnel; якщо буде запит, вставте налаштований токен або пароль.

    Див. [Dashboard](/web/dashboard) і [Web surfaces](/web) щодо режимів bind і подробиць auth.

  </Accordion>

  <Accordion title="Чому для chat approvals існують дві конфігурації exec approval?">
    Вони керують різними шарами:

    - `approvals.exec`: пересилає approval prompts у chat destinations
    - `channels.<channel>.execApprovals`: робить цей channel нативним approval client для exec approvals

    Host exec policy усе ще є справжнім approval gate. Конфігурація чату лише визначає, де з’являються
    approval prompts і як люди можуть на них відповідати.

    У більшості сценаріїв вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди та відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний native channel може безпечно визначити approvers, OpenClaw тепер автоматично вмикає native approvals у DM-first режимі, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні native approval cards/buttons, цей native UI є основним шляхом; агент має включати ручну команду `/approve`, лише якщо результат інструмента каже, що chat approvals недоступні або ручне approval — єдиний шлях.
    - Використовуйте `approvals.exec` лише тоді, коли prompts також треба пересилати в інші чати або окремі ops rooms.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише якщо ви явно хочете, щоб approval prompts публікувалися назад у початкову room/topic.
    - Plugin approvals ще окремі: вони типово використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі native channels додатково підтримують plugin-approval-native handling.

    Коротко: forwarding — для маршрутизації, native client config — для багатшого channel-specific UX.
    Див. [Exec Approvals](/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке runtime мені потрібне?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендовано** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легкий — у документації вказано, що для особистого використання достатньо **512MB-1GB RAM**, **1 core** і приблизно **500MB**
    диска, а також зазначено, що **Raspberry Pi 4 може це запускати**.

    Якщо вам потрібен додатковий запас (логи, медіа, інші сервіси), **рекомендується 2GB**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може розміщувати Gateway, а ви можете під’єднати **nodes** на ноутбуці/телефоні для
    локального screen/camera/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Чи є поради щодо встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте шорсткостей.

    - Використовуйте **64-bit** ОС і Node >= 22.
    - Надавайте перевагу **hackable (git) install**, щоб бачити логи й швидко оновлюватися.
    - Починайте без channels/skills, а потім додавайте їх по одному.
    - Якщо натрапили на дивні проблеми з бінарниками, зазвичай це проблема **ARM compatibility**.

    Документація: [Linux](/uk/platforms/linux), [Install](/uk/install).

  </Accordion>

  <Accordion title="Зависло на wake up my friend / onboarding не завершується. Що робити?">
    Цей екран залежить від доступності та автентифікації Gateway. TUI також надсилає
    «Wake up, my friend!» автоматично під час першого hatch. Якщо ви бачите цей рядок і **не маєте відповіді**,
    а токени залишаються 0, агент так і не запустився.

    1. Перезапустіть Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Перевірте статус і auth:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Якщо все ще зависає, виконайте:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що tunnel/Tailscale connection активне і що UI
    спрямовано на правильний Gateway. Див. [Remote access](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini), не проходячи onboarding заново?">
    Так. Скопіюйте **state directory** і **workspace**, а потім один раз запустіть Doctor. Це
    збереже вашого бота «точно таким самим» (memory, session history, auth і channel
    state), якщо ви скопіюєте **обидва** розташування:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій workspace (типово: `~/.openclaw/workspace`).
    4. Виконайте `openclaw doctor` і перезапустіть сервіс Gateway.

    Це зберігає config, auth profiles, облікові дані WhatsApp, sessions і memory. Якщо ви у
    remote mode, пам’ятайте, що gateway host володіє session store і workspace.

    **Важливо:** якщо ви лише commit/push свій workspace у GitHub, ви робите резервну копію
    **memory + bootstrap files**, але **не** session history чи auth. Вони зберігаються
    в `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Migrating](/uk/install/migrating), [Де що зберігається на диску](#де-що-зберігається-на-диску),
    [Agent workspace](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Remote mode](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи — вгорі. Якщо верхній розділ позначено як **Unreleased**, наступний датований
    розділ — це остання випущена версія. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (а також за документацією/іншими розділами за потреби).

  </Accordion>

  <Accordion title="Не вдається відкрити docs.openclaw.ai (SSL-помилка)">
    Деякі з’єднання Comcast/Xfinity некоректно блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до allowlist, а потім спробуйте ще раз.
    Будь ласка, допоможіть нам розблокувати сайт, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркалюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable-реліз спочатку потрапляє в **beta**, а потім явний
    крок просування переміщує цю саму версію до `latest`. За потреби мейнтейнери також можуть
    публікувати одразу в `latest`. Саме тому після просування beta і stable можуть
    вказувати на **одну й ту саму версію**.

    Подивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди встановлення та різницю між beta і dev див. в accordion нижче.

  </Accordion>

  <Accordion title="Як встановити beta-версію і в чому різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (після просування може збігатися з `latest`).
    **Dev** — це рухома голова `main` (git); при публікації вона використовує npm dist-tag `dev`.

    Однорядкові команди (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Інсталятор для Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Докладніше: [Development channels](/uk/install/development-channels) і [Installer flags](/uk/install/installer).

  </Accordion>

  <Accordion title="Як спробувати найновіші зміни?">
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

    Якщо ви віддаєте перевагу чистому ручному clone, використовуйте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Update](/cli/update), [Development channels](/uk/install/development-channels),
    [Install](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай триває встановлення й onboarding?">
    Орієнтовно:

    - **Встановлення:** 2-5 хвилин
    - **Onboarding:** 5-15 хвилин залежно від кількості channels/models, які ви налаштовуєте

    Якщо зависає, скористайтеся [Installer stuck](#швидкий-старт-і-початкове-налаштування)
    і швидким циклом налагодження в [Я застряг](#швидкий-старт-і-початкове-налаштування).

  </Accordion>

  <Accordion title="Інсталятор завис? Як отримати більше зворотного зв’язку?">
    Повторно запустіть інсталятор із **детальним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Встановлення beta з детальним виводом:

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

    Більше варіантів: [Installer flags](/uk/install/installer).

  </Accordion>

  <Accordion title="Під час встановлення на Windows пише git not found або openclaw not recognized">
    Дві поширені проблеми Windows:

    **1) npm error spawn git / git not found**

    - Встановіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте та знову відкрийте PowerShell, потім повторно запустіть інсталятор.

    **2) openclaw is not recognized після встановлення**

    - Ваша глобальна папка npm bin відсутня в PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до вашого PATH користувача (суфікс `\bin` у Windows не потрібен; на більшості систем це `%AppData%\npm`).
    - Після оновлення PATH закрийте й знову відкрийте PowerShell.

    Якщо ви хочете найгладше налаштування Windows, використовуйте **WSL2** замість нативного Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У Windows вивід exec показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність code page консолі в нативних оболонках Windows.

    Симптоми:

    - вивід `system.run`/`exec` відображає китайський текст як mojibake
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

    Якщо ви все ще відтворюєте це на останній версії OpenClaw, відстежуйте/повідомте про це тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використовуйте **hackable (git) install**, щоб мати повний вихідний код і документацію локально, а потім поставте
    запитання своєму боту (або Claude/Codex) _з цієї папки_, щоб він міг читати репозиторій і точно відповідати.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Install](/uk/install) і [Installer flags](/uk/install/installer).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтесь посібника для Linux, а потім запустіть onboarding.

    - Швидкий шлях для Linux + встановлення сервісу: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Getting Started](/start/getting-started).
    - Інсталятор + оновлення: [Install & updates](/uk/install/updating).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Встановіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Gateway remote](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де посібники зі встановлення в хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Виберіть одного й дотримуйтесь посібника:

    - [VPS hosting](/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    зі свого ноутбука/телефона через Control UI (або Tailscale/SSH). Ваші state + workspace
    живуть на сервері, тож ставтеся до хоста як до джерела істини та робіть резервні копії.

    Ви можете під’єднати **nodes** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримати доступ до
    локального screen/camera/canvas або запускати команди на ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Platforms](/uk/platforms). Віддалений доступ: [Gateway remote](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновитися самостійно?">
    Коротка відповідь: **можливо, але не рекомендовано**. Потік оновлення може перезапустити
    Gateway (що розірве активну сесію), може потребувати чистого git checkout, а також
    може вимагати підтвердження. Безпечніше запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо вам потрібно автоматизувати це через агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Update](/cli/update), [Updating](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить onboarding?">
    `openclaw onboard` — рекомендований шлях налаштування. У **local mode** він проводить вас через:

    - **Налаштування model/auth** (OAuth провайдера, API-ключі, застарілий Anthropic setup-token, а також варіанти локальних моделей, такі як LM Studio)
    - Розташування **workspace** + bootstrap files
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також bundled channel plugins, як-от QQ Bot)
    - **Встановлення демона** (LaunchAgent на macOS; systemd user unit на Linux/WSL2)
    - **Health checks** і вибір **skills**

    Він також попереджає, якщо ваша налаштована модель невідома або для неї відсутня auth.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **Anthropic API key**: звичайна Anthropic API billing
    - **Claude subscription auth в OpenClaw**: Anthropic повідомив користувачам OpenClaw
      **4 квітня 2026 року о 12:00 PT / 20:00 BST**, що це потребує
      **Extra Usage**, яка оплачується окремо від підписки

    Наші локальні відтворення також показують, що `claude -p --append-system-prompt ...` може
    натрапляти на той самий захист Extra Usage, коли доданий prompt ідентифікує
    OpenClaw, тоді як той самий рядок prompt **не** відтворює це блокування на
    шляху Anthropic SDK + API-key. OpenAI Codex OAuth явно
    підтримується для зовнішніх інструментів, таких як OpenClaw.

    OpenClaw також підтримує інші hosted підпискові варіанти, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [GLM Models](/uk/providers/glm),
    [Local models](/uk/gateway/local-models), [Models](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API-ключа?">
    Так, але сприймайте це як **Claude subscription auth з Extra Usage**.

    Підписки Claude Pro/Max не включають API-ключ. У OpenClaw це
    означає, що застосовується Anthropic-специфічне повідомлення про billing для OpenClaw:
    трафік за підпискою потребує **Extra Usage**. Якщо ви хочете Anthropic-трафік без
    цього шляху Extra Usage, натомість використовуйте Anthropic API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви Claude subscription auth (Claude Pro або Max)?">
    Так, але підтримуване трактування тепер таке:

    - Anthropic в OpenClaw із підпискою означає **Extra Usage**
    - Anthropic в OpenClaw без цього шляху означає **API key**

    Anthropic setup-token усе ще доступний як застарілий/ручний шлях OpenClaw,
    і Anthropic-специфічне повідомлення про billing для OpenClaw все ще застосовується тут. Ми
    також локально відтворили той самий billing guard при прямому
    використанні `claude -p --append-system-prompt ...`, коли доданий prompt
    ідентифікує OpenClaw, тоді як той самий рядок prompt **не** відтворювався на
    шляху Anthropic SDK + API-key.

    Для production або multi-user workloads auth через Anthropic API key —
    безпечніший і рекомендований вибір. Якщо ви хочете інші hosted
    subscription-style варіанти в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і
    [GLM Models](/uk/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
Це означає, що вашу **квоту/ліміт швидкості Anthropic** вичерпано для поточного вікна. Якщо ви
використовуєте **Claude CLI**, дочекайтеся скидання вікна або оновіть план. Якщо ви
використовуєте **Anthropic API key**, перевірте Anthropic Console
щодо використання/billing і за потреби підвищте ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, запит намагається використати
    1M context beta від Anthropic (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані підходять для long-context billing (billing через API key або
    шлях OpenClaw Claude-login з увімкненим Extra Usage).

    Порада: задайте **fallback model**, щоб OpenClaw міг продовжувати відповідати, коли провайдер упирається в rate limit.
    Див. [Models](/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має bundled провайдер **Amazon Bedrock (Converse)**. Якщо присутні AWS env markers, OpenClaw може автоматично виявити Bedrock catalog для streaming/text і об’єднати його як неявний провайдер `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати ручний запис провайдера. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Model providers](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-compatible proxy перед Bedrock також є коректним варіантом.
  </Accordion>

  <Accordion title="Як працює auth Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Onboarding може запустити OAuth flow і встановить модель за замовчуванням на `openai-codex/gpt-5.4`, коли це доречно. Див. [Model providers](/uk/concepts/model-providers) і [Onboarding (CLI)](/start/wizard).
  </Accordion>

  <Accordion title="Чи підтримуєте ви OpenAI subscription auth (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OpenAI Code (Codex) subscription OAuth**.
    OpenAI явно дозволяє використання subscription OAuth у зовнішніх інструментах/workflows
    на кшталт OpenClaw. Onboarding може запустити OAuth flow за вас.

    Див. [OAuth](/uk/concepts/oauth), [Model providers](/uk/concepts/model-providers) і [Onboarding (CLI)](/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **plugin auth flow**, а не client id чи secret у `openclaw.json`.

    Натомість використовуйте провайдера Gemini API:

    1. Увімкніть plugin: `openclaw plugins enable google`
    2. Виконайте `openclaw onboard --auth-choice gemini-api-key`
    3. Встановіть модель Google, наприклад `google/gemini-3.1-pro-preview`

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; невеликі картки обрізають і протікають. Якщо мусите, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і дивіться [/gateway/local-models](/uk/gateway/local-models). Менші/квантовані моделі підвищують ризик prompt injection — див. [Security](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як зберегти трафік hosted model у певному регіоні?">
    Вибирайте endpoint-адреси, прив’язані до регіону. OpenRouter надає варіанти, розміщені у США, для MiniMax, Kimi та GLM; вибирайте варіант, розміщений у США, щоб зберігати дані в межах регіону. Ви все одно можете перелічити Anthropic/OpenAI поряд із ними, використовуючи `models.mode: "merge"`, щоб fallbacks залишалися доступними з урахуванням вибраного регіонального провайдера.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini — необов’язковий варіант:
    деякі купують його як постійно увімкнений хост, але невеликий VPS, домашній сервер або машина класу Raspberry Pi також підійде.

    Mac потрібен лише **для macOS-only tools**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) —
    сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші macOS-only tools, запускайте Gateway на Mac або під’єднайте macOS node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Mac remote mode](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, увійшовший у Messages. Це **не обов’язково** має бути Mac mini —
    підійде будь-який Mac. **Використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) для iMessage —
    сервер BlueBubbles працює на macOS, тоді як Gateway може працювати на Linux або будь-де ще.

    Поширені сценарії:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, увійшовшому в Messages.
    - Запускайте все на Mac, якщо хочете найпростішу одно-машинну конфігурацію.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Mac remote mode](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для OpenClaw, чи зможу підключити його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **node** (супутній пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, такі як screen/camera/canvas і `system.run` на цьому пристрої.

    Типовий шаблон:

    - Gateway на Mac mini (always-on).
    - MacBook Pro запускає застосунок macOS або host вузла й під’єднується до Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендовано**. Ми спостерігаємо баги під час роботи, особливо з WhatsApp і Telegram.
    Для стабільних gateway використовуйте **Node**.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на non-production gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Onboarding приймає введення `@username` і перетворює його на числовий ID, але авторизація OpenClaw використовує лише числові ID.

    Безпечніше (без стороннього бота):

    - Напишіть вашому боту в DM, а потім виконайте `openclaw logs --follow` і подивіться `from.id`.

    Офіційний Bot API:

    - Напишіть вашому боту в DM, а потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Напишіть `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними інстансами OpenClaw?">
    Так, через **multi-agent routing**. Прив’яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, sender E.164 на кшталт `+15551234567`) до окремого `agentId`, щоб кожна людина мала власний workspace і session store. Відповіді все одно надходитимуть з **того самого акаунта WhatsApp**, а контроль доступу для DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного акаунта WhatsApp. Див. [Multi-Agent Routing](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "fast chat" і агента "Opus for coding"?'>
    Так. Використовуйте multi-agent routing: задайте кожному агенту власну модель за замовчуванням, а потім прив’яжіть вхідні маршрути (акаунт провайдера або конкретні peers) до кожного агента. Приклад конфігурації є в [Multi-Agent Routing](/uk/concepts/multi-agent). Див. також [Models](/uk/concepts/models) і [Configuration](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу містить `/home/linuxbrew/.linuxbrew/bin` (або ваш brew prefix), щоб інструменти, встановлені через `brew`, знаходилися в non-login shells.
    Останні збірки також додають поширені user bin dirs у префікс для Linux systemd services (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` та `FNM_DIR`, якщо вони задані.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повна копія вихідного коду, можна редагувати, найкраще для учасників.
      Ви збираєте локально й можете патчити код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію «просто запустити».
      Оновлення приходять із npm dist-tags.

    Документація: [Getting started](/start/getting-started), [Updating](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm і git install?">
    Так. Встановіть інший варіант, а потім запустіть Doctor, щоб сервіс gateway вказував на нову entrypoint.
    Це **не видаляє ваші дані** — воно лише змінює інсталяцію коду OpenClaw. Ваш state
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

    Doctor виявляє невідповідність entrypoint сервісу gateway і пропонує переписати конфігурацію сервісу так, щоб вона відповідала поточному install (в automation використовуйте `--repair`).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#де-що-зберігається-на-диску).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо ви хочете
    мінімум тертя й вас влаштовують sleep/restarts, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Плюси:** немає витрат на сервер, прямий доступ до локальних файлів, видиме вікно браузера.
    - **Мінуси:** sleep/розриви мережі = відключення, оновлення ОС/перезавантаження переривають роботу, машина має не засинати.

    **VPS / хмара**

    - **Плюси:** always-on, стабільна мережа, немає проблем через sleep ноутбука, простіше підтримувати в роботі.
    - **Мінуси:** часто працює headless (використовуйте скриншоти), доступ до файлів лише віддалений, для оновлень треба SSH.

    **Примітка для OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord чудово працюють із VPS. Єдиний реальний компроміс — **headless browser** проти видимого вікна. Див. [Browser](/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо у вас уже були відключення gateway. Локально чудово працює, коли ви активно користуєтеся Mac і хочете доступ до локальних файлів або UI automation з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Це не обов’язково, але **рекомендується для надійності та ізоляції**.

    - **Окремий хост (VPS/Mac mini/Pi):** always-on, менше переривань через sleep/reboot, чистіші дозволи, простіше підтримувати роботу.
    - **Спільний ноутбук/десктоп:** цілком підходить для тестування й активного використання, але очікуйте пауз під час сну машини або оновлень.

    Якщо ви хочете найкраще з обох світів, тримайте Gateway на окремому хості й під’єднайте ноутбук як **node** для локальних screen/camera/exec tools. Див. [Nodes](/uk/nodes).
    Для рекомендацій із безпеки читайте [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яка ОС рекомендована?">
    OpenClaw легкий. Для базового Gateway + одного chat channel:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1-2 vCPU, 2GB RAM або більше для запасу (логи, медіа, кілька channels). Node tools і browser automation можуть бути ресурсомісткими.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Саме цей шлях встановлення на Linux найкраще протестований.

    Документація: [Linux](/uk/platforms/linux), [VPS hosting](/vps).

  </Accordion>

  <Accordion title="Чи можна запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути постійно увімкнена, доступна й мати достатньо
    RAM для Gateway та будь-яких увімкнених channels.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька channels, browser automation чи media tools.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви працюєте на Windows, **WSL2 — найпростіше VM-подібне налаштування** і має найкращу
    сумісність інструментів. Див. [Windows](/uk/platforms/windows), [VPS hosting](/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw, одним абзацом?">
    OpenClaw — це персональний AI-помічник, який ви запускаєте на власних пристроях. Він відповідає на вже знайомих вам платформах обміну повідомленнями (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat і bundled channel plugins, як-от QQ Bot), а також може працювати з голосом + live Canvas на підтримуваних платформах. **Gateway** — це always-on control plane; помічник і є самим продуктом.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не «просто обгортка над Claude». Це **local-first control plane**, яка дозволяє запускати
    потужного помічника на **вашому власному обладнанні**, доступного з уже використовуваних вами чат-застосунків, зі
    session state, memory і tools — без передавання контролю над вашими процесами hosted
    SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і зберігайте
      workspace + session history локально.
    - **Реальні канали, а не веб-пісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      а також mobile voice і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо з маршрутизацією
      та failover на рівні agent.
    - **Варіант лише локально:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо ви цього хочете.
    - **Multi-agent routing:** окремі агенти для channel, account або task, кожен зі своїм
      workspace і налаштуваннями за замовчуванням.
    - **Відкритий код і можливість змінювати:** перевіряйте, розширюйте й self-host без vendor lock-in.

    Документація: [Gateway](/uk/gateway), [Channels](/uk/channels), [Multi-agent](/uk/concepts/multi-agent),
    [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував — що робити спочатку?">
    Хороші перші проєкти:

    - Створити сайт (WordPress, Shopify або простий статичний сайт).
    - Прототипувати мобільний застосунок (структура, екрани, план API).
    - Упорядкувати файли й папки (очищення, найменування, теги).
    - Підключити Gmail і автоматизувати підсумки чи follow ups.

    Він може обробляти великі задачі, але найкраще працює, коли ви розбиваєте їх на фази й
    використовуєте sub agents для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найпоширеніших повсякденних сценаріїв використання OpenClaw?">
    Повсякденні переваги зазвичай виглядають так:

    - **Особисті брифінги:** підсумки inbox, календаря та новин, які вас цікавлять.
    - **Дослідження та підготовка чернеток:** швидкі дослідження, резюме й перші чернетки для листів або документів.
    - **Нагадування та follow ups:** nudges і чеклісти, керовані cron або heartbeat.
    - **Browser automation:** заповнення форм, збір даних і повторювані веб-задачі.
    - **Координація між пристроями:** надішліть задачу з телефону, дозвольте Gateway виконати її на сервері й отримайте результат назад у чат.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, ads і blogs для SaaS?">
    Так — для **дослідження, кваліфікації та підготовки чернеток**. Він може сканувати сайти, складати shortlists,
    підсумовувати інформацію про потенційних клієнтів і писати чернетки outreach або ad copy.

    Для **outreach або ad runs** залишайте людину в циклі. Уникайте спаму, дотримуйтеся місцевих законів і
    політик платформ, а також переглядайте все перед відправленням. Найбезпечніший шаблон — дозволити
    OpenClaw підготувати чернетку, а вам — затвердити її.

    Документація: [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний помічник** і координаційний шар, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу програмування всередині репозиторію. Використовуйте OpenClaw, коли вам
    потрібні довговічна пам’ять, міжпристроєвий доступ і оркестрація інструментів.

    Переваги:

    - **Постійна memory + workspace** між сесіями
    - **Багатоплатформний доступ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (browser, файли, планування, hooks)
    - **Always-on Gateway** (запускайте на VPS, взаємодійте звідусіль)
    - **Nodes** для локальних browser/screen/camera/exec

    Вітрина: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills та automation

<AccordionGroup>
  <Accordion title="Як налаштовувати skills, не забруднюючи репозиторій?">
    Використовуйте керовані overrides замість редагування копії в репозиторії. Розміщуйте свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, тож керовані overrides усе одно мають перевагу над bundled skills без змін у git. Якщо вам потрібно, щоб skill було встановлено глобально, але видимо лише для деяких agents, тримайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` і `agents.list[].skills`. Лише зміни, гідні upstream, мають жити в репозиторії та надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати skills із власної папки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий порядок пріоритету: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` за замовчуванням встановлює в `./skills`, яке OpenClaw сприймає як `<workspace>/skills` у наступній сесії. Якщо skill має бути видимим лише певним agents, поєднайте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як використовувати різні моделі для різних завдань?">
    Наразі підтримуються такі шаблони:

    - **Cron jobs**: ізольовані завдання можуть задавати override `model` для кожного job.
    - **Sub-agents**: маршрутизуйте задачі до окремих agents з різними моделями за замовчуванням.
    - **On-demand switch**: використовуйте `/model`, щоб у будь-який момент переключити модель поточної сесії.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Multi-Agent Routing](/uk/concepts/multi-agent) і [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як це винести окремо?">
    Використовуйте **sub-agents** для довгих або паралельних задач. Sub-agents працюють у власній сесії,
    повертають зведення й зберігають чутливість вашого основного чату.

    Попросіть бота «spawn a sub-agent for this task» або використайте `/subagents`.
    Використовуйте `/status` у чаті, щоб побачити, що зараз робить Gateway (і чи він зайнятий).

    Порада щодо токенів: і довгі задачі, і sub-agents споживають токени. Якщо вас хвилює вартість, задайте
    дешевшу модель для sub-agents через `agents.defaults.subagents.model`.

    Документація: [Sub-agents](/tools/subagents), [Background Tasks](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють прив’язані до threads subagent sessions у Discord?">
    Використовуйте прив’язки threads. Ви можете прив’язати Discord thread до subagent або session target, щоб подальші повідомлення в цьому thread залишалися на цій прив’язаній сесії.

    Базовий потік:

    - Запускайте через `sessions_spawn` із `thread: true` (і за бажанням `mode: "session"` для сталого follow-up).
    - Або вручну прив’яжіть через `/focus <target>`.
    - Використовуйте `/agents` для перегляду стану прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати auto-unfocus.
    - Використовуйте `/unfocus`, щоб від’єднати thread.

    Потрібна конфігурація:

    - Глобальні значення за замовчуванням: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоприв’язка під час spawn: задайте `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agents](/tools/subagents), [Discord](/uk/channels/discord), [Configuration Reference](/uk/gateway/configuration-reference), [Slash commands](/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent завершився, але повідомлення про завершення надійшло не туди або взагалі не було надіслано. Що перевірити?">
    Спочатку перевірте resolved requester route:

    - Доставка завершення для subagent у режимі completion віддає перевагу будь-якому прив’язаному thread або conversation route, якщо такий існує.
    - Якщо origin завершення містить лише channel, OpenClaw повертається до збереженого route сесії requester (`lastChannel` / `lastTo` / `lastAccountId`), щоб пряма доставка все ще могла спрацювати.
    - Якщо немає ні прив’язаного route, ні придатного збереженого route, пряма доставка може не вдатися, і результат повертається до queued session delivery замість негайної публікації в чат.
    - Недійсні або застарілі targets усе ще можуть примусити fallback на queue або остаточну помилку доставки.
    - Якщо остання видима відповідь assistant у дочірньому агенті — це точний silent token `NO_REPLY` / `no_reply` або рівно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує announce замість публікації застарілого попереднього прогресу.
    - Якщо дочірній агент завершився за таймаутом після одних лише tool calls, announce може згорнути це в коротке зведення часткового прогресу замість відтворення сирого tool output.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agents](/tools/subagents), [Background Tasks](/uk/automation/tasks), [Session Tools](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron працює всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані jobs не запускатимуться.

    Чекліст:

    - Переконайтеся, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не задано.
    - Перевірте, що Gateway працює 24/7 (без sleep/restarts).
    - Перевірте налаштування timezone для job (`--tz` проти timezone хоста).

    Налагодження:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Automation & Tasks](/uk/automation).

  </Accordion>

  <Accordion title="Cron спрацював, але нічого не надіслано в channel. Чому?">
    Спочатку перевірте delivery mode:

    - `--no-deliver` / `delivery.mode: "none"` означає, що зовнішнє повідомлення не очікується.
    - Відсутній або недійсний announce target (`channel` / `to`) означає, що runner пропустив outbound delivery.
    - Помилки auth каналу (`unauthorized`, `Forbidden`) означають, що runner намагався доставити, але облікові дані це заблокували.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` лише) вважається навмисно недоставлюваним, тож runner також пригнічує queued fallback delivery.

    Для ізольованих cron jobs остаточною доставкою керує runner. Від агента очікується
    повернення plain-text summary для надсилання runner-ом. `--no-deliver` зберігає
    цей результат внутрішнім; це не дозволяє агенту напряму надсилати його
    через message tool.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Background Tasks](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований запуск cron перемкнув моделі або повторив спробу один раз?">
    Зазвичай це шлях live model-switch, а не дубльоване планування.

    Ізольований cron може зберігати runtime handoff моделі й повторювати спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає переключений
    provider/model, і якщо перемикання містило новий override auth profile, cron
    також зберігає його перед повторною спробою.

    Пов’язані правила вибору:

    - Спочатку перемагає override моделі Gmail hook, коли це застосовується.
    - Потім per-job `model`.
    - Потім будь-який збережений override моделі cron-session.
    - Потім звичайний вибір моделі agent/default.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 повторні спроби через switch
    cron переривається замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Як встановити skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або поміщайте skills у свій workspace. UI Skills для macOS недоступний на Linux.
    Перегляд skills: [https://clawhub.ai](https://clawhub.ai).

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

    Нативна команда `openclaw skills install` записує в каталог `skills/`
    активного workspace. Встановлюйте окремий CLI `clawhub` лише якщо хочете публікувати або
    синхронізувати власні skills. Для спільного встановлення між agents покладіть skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете звузити, які агенти можуть її бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати задачі за розкладом або безперервно у фоні?">
    Так. Використовуйте планувальник Gateway:

    - **Cron jobs** для запланованих або повторюваних задач (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок «main session».
    - **Isolated jobs** для автономних агентів, які публікують підсумки або доставляють їх у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Automation & Tasks](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можна запускати Apple macOS-only skills з Linux?">
    Не напряму. Skills для macOS обмежуються `metadata.openclaw.os` плюс потрібними binaries, і skills з’являються в system prompt лише тоді, коли вони придатні на **Gateway host**. У Linux skills лише для `darwin` (наприклад `apple-notes`, `apple-reminders`, `things-mac`) не завантажуватимуться, якщо ви не перевизначите обмеження.

    Є три підтримувані шаблони:

    **Варіант A — запускати Gateway на Mac (найпростіше).**
    Запускайте Gateway там, де існують macOS binaries, а потім підключайтеся з Linux у [remote mode](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажуються нормально, бо Gateway host — це macOS.

    **Варіант B — використовуйте macOS node (без SSH).**
    Запускайте Gateway на Linux, під’єднайте macOS node (menubar app) і задайте **Node Run Commands** як "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати macOS-only skills придатними, коли потрібні binaries існують на node. Агент запускає ці skills через інструмент `nodes`. Якщо ви оберете "Always Ask", підтвердження "Always Allow" у підказці додасть цю команду до allowlist.

    **Варіант C — проксувати macOS binaries через SSH (просунуто).**
    Залиште Gateway на Linux, але зробіть так, щоб потрібні CLI binaries дозволялися до SSH wrappers, які запускаються на Mac. Потім перевизначте skill, щоб дозволити Linux і зберегти його придатним.

    1. Створіть SSH wrapper для binary (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Додайте wrapper у `PATH` на Linux host (наприклад `~/bin/memo`).
    3. Перевизначте metadata skill, щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Почніть нову сесію, щоб оновився snapshot skills.

  </Accordion>

  <Accordion title="Чи є у вас інтеграція з Notion або HeyGen?">
    Наразі вбудованої немає.

    Варіанти:

    - **Custom skill / plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Browser automation:** працює без коду, але повільніше і крихкіше.

    Якщо ви хочете зберігати контекст для кожного клієнта (сценарії agency), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + уподобання + активна робота).
    - Просіть агента отримувати цю сторінку на початку сесії.

    Якщо ви хочете нативну інтеграцію, відкрийте feature request або створіть skill,
    націлений на ці API.

    Встановлення skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активного workspace. Для спільних skills між agents розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі agents, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі skills очікують binaries, встановлені через Homebrew; у Linux це означає Linuxbrew (див. запис FAQ про Homebrew для Linux вище). Див. [Skills](/tools/skills), [Skills config](/tools/skills-config) і [ClawHub](/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати мій уже авторизований Chrome з OpenClaw?">
    Використовуйте вбудований browser profile `user`, який під’єднується через Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Якщо ви хочете власну назву, створіть явний MCP profile:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Цей шлях локальний для хоста. Якщо Gateway працює деінде, або запускайте node host на машині з браузером, або використовуйте remote CDP.

    Поточні обмеження `existing-session` / `user`:

    - дії керуються через ref, а не CSS-selector
    - uploads потребують `ref` / `inputRef` і наразі підтримують лише один файл за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і batch actions усе ще потребують managed browser або raw CDP profile

  </Accordion>
</AccordionGroup>

## Sandboxing і memory

<AccordionGroup>
  <Accordion title="Чи є окремий документ про sandboxing?">
    Так. Див. [Sandboxing](/uk/gateway/sandboxing). Для Docker-specific setup (повний gateway у Docker або sandbox images) див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повну функціональність?">
    Образ за замовчуванням орієнтований на безпеку й працює від імені користувача `node`, тому він не
    містить system packages, Homebrew або bundled browsers. Для повнішого налаштування:

    - Збережіть `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші переживали перезапуски.
    - Вбудуйте system deps у образ за допомогою `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Встановіть браузери Playwright через bundled CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Задайте `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я зберегти приватність у DM, але зробити групи публічними/ізольованими з одним агентом?">
    Так — якщо ваш приватний трафік це **DMs**, а публічний трафік — **groups**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб group/channel sessions (ключі не-main) працювали в Docker, а основна DM session залишалася на host. Потім обмежте, які інструменти доступні в ізольованих сесіях, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад config: [Groups: personal DMs + public groups](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Ключовий довідник конфігурації: [Gateway configuration](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати папку хоста до sandbox?">
    Задайте `agents.defaults.sandbox.docker.binds` як `["host:path:mode"]` (наприклад `"/home/user/src:/src:ro"`). Global + per-agent binds об’єднуються; per-agent binds ігноруються, коли `scope: "shared"`. Для всього чутливого використовуйте `:ro` і пам’ятайте, що binds обходять файлові стіни sandbox.

    OpenClaw перевіряє джерела bind як за нормалізованим шляхом, так і за канонічним шляхом, визначеним через найглибшого наявного предка. Це означає, що виходи через symlink-parent усе ще надійно блокуються, навіть якщо останній сегмент шляху ще не існує, а перевірки allowed-root усе ще застосовуються після розв’язання symlink.

    Приклади та примітки щодо безпеки див. у [Sandboxing](/uk/gateway/sandboxing#custom-bind-mounts) і [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Як працює memory?">
    Memory в OpenClaw — це просто Markdown files у workspace агента:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Кураторські довгострокові нотатки в `MEMORY.md` (лише main/private sessions)

    OpenClaw також виконує **тихий pre-compaction memory flush**, щоб нагадати моделі
    записати тривкі нотатки перед auto-compaction. Це запускається лише тоді, коли workspace
    доступний для запису (read-only sandboxes пропускають це). Див. [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Memory постійно забуває речі. Як зробити, щоб вони закріплювалися?">
    Попросіть бота **записати факт у memory**. Довгострокові нотатки мають бути в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це ще сфера, яку ми покращуємо. Корисно нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона все одно забуває, перевірте, що Gateway використовує той самий
    workspace під час кожного запуску.

    Документація: [Memory](/uk/concepts/memory), [Agent workspace](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається memory назавжди? Які обмеження?">
    Файли memory живуть на диску і зберігаються, доки ви їх не видалите. Обмеженням є ваше
    сховище, а не модель. **Контекст сесії** все одно обмежений вікном контексту моделі,
    тому довгі розмови можуть стискатися або обрізатися. Саме тому існує
    пошук по memory — він повертає в контекст лише потрібні частини.

    Документація: [Memory](/uk/concepts/memory), [Context](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи вимагає semantic memory search OpenAI API key?">
    Лише якщо ви використовуєте **OpenAI embeddings**. Codex OAuth покриває chat/completions і
    **не** надає доступ до embeddings, тож **вхід через Codex (OAuth або
    Codex CLI login)** не допомагає для semantic memory search. Для OpenAI embeddings
    усе ще потрібен справжній API key (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви явно не задаєте provider, OpenClaw автоматично вибирає provider, коли
    може знайти API key (auth profiles, `models.providers.*.apiKey` або env vars).
    Він надає перевагу OpenAI, якщо знаходиться ключ OpenAI, інакше Gemini, якщо є ключ Gemini,
    потім Voyage, потім Mistral. Якщо віддалений ключ недоступний, memory
    search залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштовано й доступний
    шлях до локальної моделі, OpenClaw
    надає перевагу `local`. Ollama підтримується, коли ви явно задаєте
    `memorySearch.provider = "ollama"`.

    Якщо ви хочете залишитися локально, задайте `memorySearch.provider = "local"` (і за бажанням
    `memorySearch.fallback = "none"`). Якщо вам потрібні Gemini embeddings, задайте
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо embedding-моделі **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    подробиці налаштування див. у [Memory](/uk/concepts/memory).

  </Accordion>
</AccordionGroup>

## Де що зберігається на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, які використовує OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** sessions, memory files, config і workspace живуть на Gateway host
      (`~/.openclaw` + каталог вашого workspace).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте model providers (Anthropic/OpenAI тощо), ідуть до
      їхніх API, а chat platforms (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на своїх
      серверах.
    - **Ви контролюєте обсяг:** використання локальних моделей залишає prompts на вашій машині, але channel
      traffic усе одно проходить через сервери цього channel.

    Пов’язане: [Agent workspace](/uk/concepts/agent-workspace), [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе зберігається в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Path                                                            | Призначення                                                       |
    | --------------------------------------------------------------- | ----------------------------------------------------------------- |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основний config (JSON5)                                           |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Застарілий імпорт OAuth (копіюється в auth profiles під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, API keys і необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язковий file-backed secret payload для `file` SecretRef providers |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Файл застарілої сумісності (статичні записи `api_key` очищаються) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдерів (наприклад `whatsapp/<accountId>/creds.json`)    |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан кожного агента окремо (agentDir + sessions)                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (для кожного агента)                        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані сесій (для кожного агента)                               |

    Застарілий шлях single-agent: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`).

    Ваш **workspace** (`AGENTS.md`, memory files, skills тощо) зберігається окремо й налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають зберігатися AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли живуть у **workspace агента**, а не в `~/.openclaw`.

    - **Workspace (для кожного агента):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (або застарілий fallback `memory.md`, коли `MEMORY.md` відсутній),
      `memory/YYYY-MM-DD.md`, необов’язковий `HEARTBEAT.md`.
    - **State dir (`~/.openclaw`)**: config, стан channels/providers, auth profiles, sessions, logs,
      і спільні skills (`~/.openclaw/skills`).

    Workspace за замовчуванням — `~/.openclaw/workspace`, налаштовується так:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот «забуває» після перезапуску, переконайтеся, що Gateway під час кожного запуску використовує той самий
    workspace (і пам’ятайте: у remote mode використовується **workspace gateway host**, а
    не вашого локального ноутбука).

    Порада: якщо ви хочете закріпити певну поведінку або вподобання, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладатися лише на історію чату.

    Див. [Agent workspace](/uk/concepts/agent-workspace) і [Memory](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Помістіть свій **agent workspace** у **приватний** git repo і робіть його резервні копії кудись
    приватно (наприклад у GitHub private). Це захоплює memory + файли AGENTS/SOUL/USER
    і дозволяє пізніше відновити «розум» помічника.

    **Не** комітьте нічого з `~/.openclaw` (credentials, sessions, tokens або encrypted secrets payloads).
    Якщо вам потрібне повне відновлення, окремо робіть резервні копії як workspace, так і state directory
    (див. питання про міграцію вище).

    Документація: [Agent workspace](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окремий посібник: [Uninstall](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть агенти працювати поза workspace?">
    Так. Workspace — це **cwd за замовчуванням** і опора для memory, а не жорстка sandbox.
    Відносні шляхи розв’язуються всередині workspace, але абсолютні шляхи можуть отримувати доступ до інших
    розташувань на host, якщо sandboxing не ввімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або per-agent налаштування sandbox. Якщо ви
    хочете, щоб репозиторій був working directory за замовчуванням, вкажіть у цього агента
    `workspace` як корінь репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
    workspace окремо, якщо тільки ви свідомо не хочете, щоб агент працював усередині нього.

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
    Станом сесій володіє **gateway host**. Якщо ви працюєте в remote mode, потрібний вам session store знаходиться на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Session management](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи config

<AccordionGroup>
  <Accordion title="Який формат має config? Де він знаходиться?">
    OpenClaw читає необов’язковий **JSON5** config з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються доволі безпечні значення за замовчуванням (включно з workspace за замовчуванням `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я встановив gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Non-loopback binds **вимагають коректного gateway auth path**. На практиці це означає:

    - shared-secret auth: токен або пароль
    - `gateway.auth.mode: "trusted-proxy"` за правильно налаштованим non-loopback identity-aware reverse proxy

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
    - Для auth паролем задайте `gateway.auth.mode: "password"` плюс `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не може бути розв’язано, розв’язання завершується в закритий спосіб (жоден remote fallback не маскує це).
    - Конфігурації Control UI зі shared-secret автентифікуються через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях app/UI). Режими з ідентичністю, такі як Tailscale Serve або `trusted-proxy`, натомість використовують request headers. Уникайте розміщення shared secrets в URL.
    - З `gateway.auth.mode: "trusted-proxy"` reverse proxies через loopback на тому ж host **не** задовольняють trusted-proxy auth. Trusted proxy має бути налаштованим non-loopback source.

  </Accordion>

  <Accordion title="Чому тепер мені потрібен токен на localhost?">
    OpenClaw за замовчуванням вимагає gateway auth, включно з loopback. У звичайному стандартному шляху це означає auth токеном: якщо явний auth path не налаштовано, запуск gateway переходить у режим токена й автоматично генерує його, зберігаючи в `gateway.auth.token`, тож **локальні WS clients мають автентифікуватися**. Це блокує інші локальні процеси від виклику Gateway.

    Якщо ви віддаєте перевагу іншому auth path, ви можете явно вибрати режим пароля (або, для non-loopback identity-aware reverse proxies, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно задайте `gateway.auth.mode: "none"` у config. Doctor може будь-коли згенерувати токен: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни config?">
    Gateway відстежує config і підтримує hot-reload:

    - `gateway.reload.mode: "hybrid"` (типово): hot-apply для безпечних змін, restart для критичних
    - Також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні tagline у CLI?">
    Установіть `cli.banner.taglineMode` в config:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: приховує текст tagline, але залишає рядок із заголовком/версією banner.
    - `default`: завжди використовує `All your chats, one OpenClaw.`.
    - `random`: ротація кумедних/сезонних tagline (поведінка за замовчуванням).
    - Якщо ви хочете повністю прибрати banner, задайте env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути web search (і web fetch)?">
    `web_fetch` працює без API key. `web_search` залежить від вибраного
    provider:

    - Провайдери з API, такі як Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, потребують звичайного налаштування API key.
    - Ollama Web Search не потребує ключа, але використовує налаштований Ollama host і вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна HTML-based інтеграція.
    - SearXNG не потребує ключа / може бути self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

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
              provider: "firecrawl", // необов’язково; пропустіть для auto-detect
            },
          },
        },
    }
    ```

    Конфігурація web-search для конкретного provider тепер живе в `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи provider у `tools.web.search.*` тимчасово все ще завантажуються для сумісності, але не повинні використовуватися в нових configs.
    Конфігурація fallback web-fetch для Firecrawl живе в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlists, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнено за замовчуванням (якщо його явно не вимкнути).
    - Якщо `tools.web.fetch.provider` пропущено, OpenClaw автоматично визначає першого готового fallback provider для fetch з доступних credentials. Наразі bundled provider — Firecrawl.
    - Демони читають env vars з `~/.openclaw/.env` (або з середовища сервісу).

    Документація: [Web tools](/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мій config. Як відновитися і як цього уникнути?">
    `config.apply` замінює **весь config**. Якщо ви надсилаєте частковий об’єкт, усе
    інше видаляється.

    Відновлення:

    - Відновіть із резервної копії (git або збережений `~/.openclaw/openclaw.json`).
    - Якщо резервної копії немає, повторно запустіть `openclaw doctor` і заново налаштуйте channels/models.
    - Якщо це стало несподіванкою, створіть bug report і додайте ваш останній відомий config або будь-яку резервну копію.
    - Локальний coding agent часто може відновити робочий config з логів або історії.

    Як уникнути:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Спочатку використовуйте `config.schema.lookup`, якщо ви не впевнені щодо точного шляху або форми поля; він повертає shallow schema node плюс підсумки безпосередніх дочірніх елементів для drill-down.
    - Використовуйте `config.patch` для часткових RPC-редагувань; залишайте `config.apply` лише для повної заміни config.
    - Якщо ви використовуєте owner-only інструмент `gateway` із запуску агента, він усе одно відхилятиме записи до `tools.exec.ask` / `tools.exec.security` (включно із застарілими aliases `tools.bash.*`, які нормалізуються до тих самих захищених exec paths).

    Документація: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими workers на різних пристроях?">
    Поширений шаблон — **один Gateway** (наприклад Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** володіє channels (Signal/WhatsApp), маршрутизацією та sessions.
    - **Nodes (пристрої):** Macs/iOS/Android підключаються як периферія й надають локальні tools (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** окремі brains/workspaces для спеціальних ролей (наприклад, «Hetzner ops», «Personal data»).
    - **Sub-agents:** запускайте фонову роботу з головного агента, коли потрібен паралелізм.
    - **TUI:** підключайтеся до Gateway і перемикайте agents/sessions.

    Документація: [Nodes](/uk/nodes), [Remote access](/uk/gateway/remote), [Multi-Agent Routing](/uk/concepts/multi-agent), [Sub-agents](/tools/subagents), [TUI](/web/tui).

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

    За замовчуванням — `false` (headful). Headless частіше викликає anti-bot перевірки на деяких сайтах. Див. [Browser](/tools/browser).

    Headless використовує **той самий Chromium engine** і працює для більшості сценаріїв automation (форми, кліки, скрейпінг, логіни). Основні відмінності:

    - Немає видимого вікна браузера (використовуйте скриншоти, якщо потрібна візуалізація).
    - Деякі сайти суворіше ставляться до automation у headless режимі (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує headless sessions.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Задайте `browser.executablePath` як шлях до вашого binary Brave (або будь-якого Chromium-based browser) і перезапустіть Gateway.
    Повні приклади config див. в [Browser](/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateways і nodes

<AccordionGroup>
  <Accordion title="Як команди проходять між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає агента і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен інструмент node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідний traffic провайдера; вони отримують лише node RPC calls.

  </Accordion>

  <Accordion title="Як мій агент може отримати доступ до мого комп’ютера, якщо Gateway розміщений віддалено?">
    Коротка відповідь: **під’єднайте свій комп’ютер як node**. Gateway працює деінде, але він може
    викликати інструменти `node.*` (screen, camera, system) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на always-on host (VPS/home server).
    2. Розмістіть gateway host і ваш комп’ютер в одній tailnet.
    3. Переконайтеся, що Gateway WS доступний (tailnet bind або SSH tunnel).
    4. Відкрийте застосунок macOS локально й підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як node.
    5. Підтвердьте node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP bridge не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування про безпеку: pairing macOS node дозволяє `system.run` на цій машині. Підключайте
    лише ті пристрої, яким довіряєте, і перегляньте [Security](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Gateway protocol](/uk/gateway/protocol), [macOS remote mode](/uk/platforms/mac/remote), [Security](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключений, але я не отримую відповідей. Що тепер?">
    Перевірте базові речі:

    - Gateway працює: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан channels: `openclaw channels status`

    Потім перевірте auth і маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` налаштовано правильно.
    - Якщо підключаєтеся через SSH tunnel, переконайтеся, що локальний tunnel піднято й він спрямований на правильний порт.
    - Переконайтеся, що ваші allowlists (DM або group) містять ваш account.

    Документація: [Tailscale](/uk/gateway/tailscale), [Remote access](/uk/gateway/remote), [Channels](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два інстанси OpenClaw спілкуватися між собою (локальний + VPS)?">
    Так. Вбудованого bridge «bot-to-bot» немає, але це можна організувати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний chat channel, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надсилає повідомлення Bot B, а потім Bot B відповідає як зазвичай.

    **CLI bridge (універсальний):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлившись на чат, де слухає інший бот.
    Якщо один бот працює на віддаленому VPS, націльте свій CLI на той віддалений Gateway
    через SSH/Tailscale (див. [Remote access](/uk/gateway/remote)).

    Приклад шаблону (запускається з машини, яка може дістатися до цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте захист, щоб два боти не зациклилися безкінечно (лише згадування, channel
    allowlists або правило «не відповідати на повідомлення ботів»).

    Документація: [Remote access](/uk/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох agents?">
    Ні. Один Gateway може розміщувати кількох agents, кожен зі своїм workspace, model defaults
    і маршрутизацією. Це нормальне налаштування, і воно набагато дешевше та простіше, ніж запускати
    один VPS на агента.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні configs, якими ви не хочете ділитися. В іншому разі зберігайте один Gateway і
    використовуйте кількох agents або sub-agents.

  </Accordion>

  <Accordion title="Чи є перевага у використанні node на моєму особистому ноутбуці замість SSH із VPS?">
    Так — nodes є first-class способом доступу до вашого ноутбука з віддаленого Gateway, і вони
    відкривають більше, ніж просто shell access. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (достатньо невеликого VPS або машини рівня Raspberry Pi; 4 GB RAM цілком вистачає), тож поширений
    сценарій — always-on host плюс ваш ноутбук як node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують device pairing.
    - **Безпечніший контроль виконання.** `system.run` на цьому ноутбуці захищений allowlists/approvals node.
    - **Більше device tools.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна browser automation.** Тримайте Gateway на VPS, але запускайте Chrome локально через node host на ноутбуці або під’єднуйтеся до локального Chrome на host через Chrome MCP.

    SSH підходить для разового shell access, але nodes простіші для постійних workflows агентів і
    automation пристроїв.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes), [Browser](/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes gateway service?">
    Ні. На одному host зазвичай має працювати лише **один gateway**, якщо ви навмисно не запускаєте ізольовані профілі (див. [Multiple gateways](/uk/gateway/multiple-gateways)). Nodes — це периферія, яка підключається
    до gateway (nodes iOS/Android або macOS у режимі "node mode" в menubar app). Для headless node
    hosts і керування через CLI див. [Node host CLI](/cli/node).

    Для змін `gateway`, `discovery` і `canvasHost` потрібен повний restart.

  </Accordion>

  <Accordion title="Чи є API / RPC спосіб застосувати config?">
    Так.

    - `config.schema.lookup`: перевірити одне config subtree з його shallow schema node, відповідною UI hint і підсумками безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний snapshot + hash
    - `config.patch`: безпечне часткове оновлення (рекомендовано для більшості RPC-редагувань)
    - `config.apply`: перевірити + замінити повний config, а потім перезапустити
    - Owner-only runtime tool `gateway` усе ще відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; застарілі aliases `tools.bash.*` нормалізуються до тих самих захищених exec paths

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

    1. **Встановіть + увійдіть на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Встановіть + увійдіть на Mac**
       - Скористайтеся застосунком Tailscale і увійдіть у ту саму tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - У Tailscale admin console увімкніть MagicDNS, щоб VPS мав стабільне ім’я.
    4. **Використовуйте hostname tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо ви хочете Control UI без SSH, використовуйте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив’язаним до loopback і відкриває HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як підключити Mac node до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Gateway Control UI + WS**. Nodes підключаються через ту саму endpoint Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS + Mac знаходяться в одній tailnet**.
    2. **Використовуйте застосунок macOS у Remote mode** (SSH target може бути hostname tailnet).
       Застосунок прокине port gateway і підключиться як node.
    3. **Підтвердьте node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Gateway protocol](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [macOS remote mode](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи варто встановлювати на другий ноутбук чи просто додати node?">
    Якщо вам потрібні лише **локальні tools** (screen/camera/exec) на другому ноутбуці, додайте його як
    **node**. Це зберігає один Gateway і уникає дублювання config. Локальні node tools
    наразі доступні лише на macOS, але ми плануємо розширити їх на інші ОС.

    Встановлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes), [Multiple gateways](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars і завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує environment variables?">
    OpenClaw читає env vars з батьківського процесу (shell, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного working directory
    - глобальний fallback `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден із `.env` files не перевизначає вже наявні env vars.

    Ви також можете визначати inline env vars у config (застосовуються лише якщо вони відсутні в process env):

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

  <Accordion title="Я запустив Gateway через сервіс, і мої env vars зникли. Що тепер?">
    Два поширені виправлення:

    1. Помістіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися, навіть коли сервіс не успадковує env вашої оболонки.
    2. Увімкніть import shell env (добровільна зручність):

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

    Це запускає вашу login shell і імпортує лише очікувані відсутні ключі (ніколи не перевизначає). Еквіваленти env vars:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я встановив COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` повідомляє, чи увімкнено **shell env import**. "Shell env: off"
    **не** означає, що ваших env vars немає — це лише означає, що OpenClaw не завантажуватиме
    вашу login shell автоматично.

    Якщо Gateway працює як сервіс (launchd/systemd), він не успадковує ваше shell
    environment. Виправте це одним із таких способів:

    1. Помістіть токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або увімкніть import shell (`env.shellEnv.enabled: true`).
    3. Або додайте його в блок `env` вашого config (застосовується лише якщо відсутній).

    Потім перезапустіть gateway і перевірте знову:

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
    Надішліть `/new` або `/reset` як окреме повідомлення. Див. [Session management](/uk/concepts/session).
  </Accordion>

  <Accordion title="Чи сесії скидаються автоматично, якщо я ніколи не надсилаю /new?">
    Сесії можуть завершуватися після `session.idleMinutes`, але це **вимкнено за замовчуванням** (типове значення **0**).
    Задайте додатне значення, щоб увімкнути завершення через бездіяльність. Коли це ввімкнено, **наступне**
    повідомлення після періоду бездіяльності починає новий session id для цього chat key.
    Це не видаляє transcript — просто починає нову session.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб створити команду інстансів OpenClaw (один CEO і багато агентів)?">
    Так, через **multi-agent routing** і **sub-agents**. Ви можете створити одного координатора
    й кількох worker-агентів зі своїми workspace і models.

    Втім, найкраще сприймати це як **цікавий експеримент**. Це витрачає багато токенів і часто
    менш ефективно, ніж використання одного бота з окремими сесіями. Типова модель, яку
    ми уявляємо, — один бот, із яким ви спілкуєтеся, і різні сесії для паралельної роботи. Цей
    бот також може запускати sub-agents за потреби.

    Документація: [Multi-agent routing](/uk/concepts/multi-agent), [Sub-agents](/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст урізався посеред задачі? Як цьому запобігти?">
    Контекст сесії обмежений вікном моделі. Довгі чати, великі tool outputs або багато
    файлів можуть запустити compaction або truncation.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими задачами й `/new` при зміні теми.
    - Тримайте важливий контекст у workspace й просіть бота зчитати його назад.
    - Використовуйте sub-agents для довгої або паралельної роботи, щоб основний чат залишався меншим.
    - Виберіть модель із більшим context window, якщо це трапляється часто.

  </Accordion>

  <Accordion title="Як повністю скинути OpenClaw, але залишити його встановленим?">
    Використовуйте команду reset:

    ```bash
    openclaw reset
    ```

    Неінтерактивний повний reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Потім заново запустіть налаштування:

    ```bash
    openclaw onboard --install-daemon
    ```

    Примітки:

    - Onboarding також пропонує **Reset**, якщо бачить наявний config. Див. [Onboarding (CLI)](/start/wizard).
    - Якщо ви використовували profiles (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен state dir (типово це `~/.openclaw-<profile>`).
    - Dev reset: `openclaw gateway --dev --reset` (лише для dev; стирає dev config + credentials + sessions + workspace).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або стиснути?'>
    Використовуйте один із цих варіантів:

    - **Compact** (зберігає розмову, але підсумовує старіші turns):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб спрямувати summary.

    - **Reset** (новий session ID для того самого chat key):

      ```
      /new
      /reset
      ```

    Якщо це трапляється постійно:

    - Увімкніть або налаштуйте **session pruning** (`agents.defaults.contextPruning`), щоб обрізати старий tool output.
    - Використовуйте модель із більшим context window.

    Документація: [Compaction](/uk/concepts/compaction), [Session pruning](/uk/concepts/session-pruning), [Session management](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка валідації провайдера: модель видала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що history сесії застаріла або пошкоджена (часто після довгих threads
    або змін tool/schema).

    Виправлення: почніть нову сесію через `/new` (окреме повідомлення).

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

    Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown
    headers на кшталт `# Heading`), OpenClaw пропускає heartbeat run, щоб зекономити API calls.
    Якщо файлу немає, heartbeat все одно запускається, а модель вирішує, що робити.

    Для per-agent overrides використовуйте `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "bot account" до групи WhatsApp?'>
    Ні. OpenClaw працює від **вашого власного account**, тож якщо ви є в групі, OpenClaw може її бачити.
    За замовчуванням групові відповіді блокуються, доки ви не дозволите senders (`groupPolicy: "allowlist"`).

    Якщо ви хочете, щоб у групі лише **ви** могли активувати відповіді:

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
    Варіант 1 (найшвидший): дивіться логи й надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Шукайте `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/додано до allowlist): виведіть групи з config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/cli/directory), [Logs](/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Є дві поширені причини:

    - Увімкнено gating за згадуванням (за замовчуванням). Ви маєте @mention бота (або збігтися з `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і групу не додано до allowlist.

    Див. [Groups](/uk/channels/groups) і [Group messages](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи ділять groups/threads контекст з DM?">
    Direct chats за замовчуванням згортаються в main session. Groups/channels мають власні session keys, а topics Telegram / threads Discord є окремими сесіями. Див. [Groups](/uk/channels/groups) і [Group messages](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки workspaces і agents я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але стежте за:

    - **Зростанням диска:** sessions + transcripts зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартістю токенів:** більше agents означає більше одночасного використання моделей.
    - **Операційними витратами:** auth profiles, workspaces і channel routing для кожного агента.

    Поради:

    - Тримайте один **активний** workspace на агента (`agents.defaults.workspace`).
    - Очищайте старі sessions (видаляйте JSONL або записи store), якщо диск росте.
    - Використовуйте `openclaw doctor`, щоб знаходити зайві workspaces і невідповідності profiles.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька ботів або чатів одночасно (Slack), і як це налаштувати?">
    Так. Використовуйте **Multi-Agent Routing**, щоб запускати кількох ізольованих agents і маршрутизувати вхідні повідомлення за
    channel/account/peer. Slack підтримується як channel і може бути прив’язаний до конкретних agents.

    Доступ до браузера потужний, але це не «робити все, що може людина» — anti-bot, CAPTCHA та MFA
    усе ще можуть блокувати automation. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на host
    або CDP на машині, яка фактично запускає браузер.

    Рекомендоване налаштування:

    - Always-on Gateway host (VPS/Mac mini).
    - Один агент на роль (bindings).
    - Канал(и) Slack, прив’язані до цих агентів.
    - Локальний браузер через Chrome MCP або node за потреби.

    Документація: [Multi-Agent Routing](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Browser](/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: значення за замовчуванням, вибір, aliases, перемикання

<AccordionGroup>
  <Accordion title='Що таке "default model"?'>
    Default model в OpenClaw — це те, що ви встановили як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються у форматі `provider/model` (приклад: `openai/gpt-5.4`). Якщо ви опускаєте provider, OpenClaw спочатку пробує alias, потім — унікальний configured-provider match для точного model id, і лише потім переходить до configured default provider як застарілого шляху сумісності. Якщо цей provider більше не надає configured default model, OpenClaw переходить до першого configured provider/model замість показу застарілого default від видаленого provider. Утім, вам усе одно слід **явно** задавати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендовано за замовчуванням:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку provider.
    **Для агентів із увімкненими tools або недовіреним входом:** ставте силу моделі вище за вартість.
    **Для рутинного/низькоризикового чату:** використовуйте дешевші fallback models і маршрутизуйте за ролями agent.

    MiniMax має власну документацію: [MiniMax](/uk/providers/minimax) і
    [Local models](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити** для задач із високими ставками, і дешевшу
    модель для рутинного чату або summary. Ви можете маршрутизувати моделі на рівні agent і використовувати sub-agents для
    паралелізації довгих задач (кожен sub-agent споживає токени). Див. [Models](/uk/concepts/models) і
    [Sub-agents](/tools/subagents).

    Важливе попередження: слабші/надмірно квантизовані моделі більш вразливі до prompt
    injection і небезпечної поведінки. Див. [Security](/uk/gateway/security).

    Більше контексту: [Models](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі, не стираючи config?">
    Використовуйте **команди моделі** або редагуйте лише поля **model**. Уникайте повної заміни config.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для окремої сесії)
    - `openclaw models set ...` (оновлює лише config моделі)
    - `openclaw configure --section model` (інтерактивно)
    - редагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` з частковим об’єктом, якщо ви не збираєтеся замінювати весь config.
    Для RPC-редагувань спочатку перевіряйте через `config.schema.lookup` і надавайте перевагу `config.patch`. Payload lookup дає нормалізований шлях, shallow schema docs/constraints і підсумки безпосередніх дочірніх елементів
    для часткових оновлень.
    Якщо ви все ж перезаписали config, відновіть його з резервної копії або повторно запустіть `openclaw doctor` для виправлення.

    Документація: [Models](/uk/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати self-hosted models (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Встановіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull glm-4.7-flash`
    3. Якщо ви хочете ще й cloud models, виконайте `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає вам cloud models плюс ваші локальні моделі Ollama
    - cloud models, такі як `kimi-k2.5:cloud`, не потребують локального pull
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі більш вразливі до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати tools.
    Якщо ви все ж хочете малі моделі, увімкніть sandboxing і суворі tool allowlists.

    Документація: [Ollama](/uk/providers/ollama), [Local models](/uk/gateway/local-models),
    [Model providers](/uk/concepts/model-providers), [Security](/uk/gateway/security),
    [Sandboxing](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися й змінюватися з часом; фіксованої рекомендації щодо provider немає.
    - Перевіряйте поточне налаштування runtime на кожному gateway за допомогою `openclaw models status`.
    - Для безпеково чутливих агентів із tools використовуйте найсильнішу доступну модель останнього покоління.
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

    Це вбудовані aliases. Власні aliases можна додати через `agents.defaults.models`.

    Ви можете переглянути доступні моделі через `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний пронумерований picker. Вибирайте за номером:

    ```
    /model 3
    ```

    Ви також можете примусово використати конкретний auth profile для provider (для окремої сесії):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який agent активний, який файл `auth-profiles.json` використовується і який auth profile буде спробувано наступним.
    Він також показує налаштований endpoint provider (`baseUrl`) і режим API (`api`), коли це доступно.

    **Як зняти закріплення profile, який я встановив через @profile?**

    Повторно запустіть `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо ви хочете повернутися до значення за замовчуванням, виберіть його через `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який auth profile активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.2 для повсяк