---
read_when:
    - Відповідь на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час роботи
    - Тріаж проблем, про які повідомляють користувачі, перед глибшим налагодженням
summary: Часті запитання про налаштування, конфігурацію та використання OpenClaw
title: ЧаПи
x-i18n:
    generated_at: "2026-04-06T00:38:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d6d09621c6033d580cbcf1ff46f81587d69404d6f64c8d8fd8c3f09185bb920
    source_path: help/faq.md
    workflow: 15
---

# ЧаПи

Швидкі відповіді та глибше усунення проблем для реальних сценаріїв налаштування (локальна розробка, VPS, multi-agent, OAuth/API-ключі, резервне перемикання моделей). Для діагностики під час роботи див. [Усунення проблем](/uk/gateway/troubleshooting). Повний довідник конфігурації див. у [Конфігурація](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламалося

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидке локальне зведення: ОС + оновлення, доступність gateway/сервісу, agents/sessions, конфігурація провайдера + проблеми під час роботи (коли gateway доступний).

2. **Звіт, який можна вставити (безпечний для поширення)**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з хвостом логів (токени приховані).

3. **Стан демона + порту**

   ```bash
   openclaw gateway status
   ```

   Показує runtime супервізора порівняно з доступністю RPC, URL цілі probe та яку конфігурацію сервіс, імовірно, використав.

4. **Глибокі probe-перевірки**

   ```bash
   openclaw status --deep
   ```

   Запускає live probe перевірки health gateway, включно з probe перевірками каналів, коли це підтримується
   (потрібен доступний gateway). Див. [Стан](/uk/gateway/health).

5. **Переглянути останній лог у реальному часі**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використайте запасний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові логи відокремлені від логів сервісу; див. [Логування](/uk/logging) та [Усунення проблем](/uk/gateway/troubleshooting).

6. **Запустити doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує config/state + запускає перевірки health. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Запитує у запущеного gateway повний знімок (лише WS). Див. [Стан](/uk/gateway/health).

## Швидкий старт і перше налаштування

<AccordionGroup>
  <Accordion title="Я застряг(ла), який найшвидший спосіб розблокуватися">
    Використайте локального AI-агента, який може **бачити вашу машину**. Це значно ефективніше, ніж питати
    в Discord, тому що більшість випадків "я застряг(ла)" — це **локальні проблеми конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, виконувати команди, перевіряти логи й допомагати виправляти
    налаштування на рівні машини (PATH, сервіси, дозволи, auth-файли). Надайте їм **повний checkout вихідного коду** через
    hackable-встановлення (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **із git checkout**, тож агент може читати код + документацію і
    міркувати про точну версію, яку ви запускаєте. Ви завжди можете повернутися до stable пізніше,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й супроводжувати** виправлення (крок за кроком), а потім виконати лише
    потрібні команди. Це зменшує масштаб змін і спрощує аудит.

    Якщо ви знайдете реальний баг або виправлення, будь ласка, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (поділіться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок health gateway/agent + базової конфігурації.
    - `openclaw models status`: перевіряє auth провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє типові проблеми config/state.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламалося](#перші-60-секунд-якщо-щось-зламалося).
    Документація зі встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску heartbeat:

    - `quiet-hours`: поза налаштованим вікном active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожній/заголовковий шаблон
    - `no-tasks-due`: режим задач `HEARTBEAT.md` активний, але жоден із інтервалів задач ще не настав
    - `alerts-disabled`: уся видимість heartbeat вимкнена (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі задач часові мітки due оновлюються лише після завершення
    реального запуску heartbeat. Пропущені запуски не позначають задачі як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та задачі](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановлення й налаштування OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання онбордингу:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати UI-ресурси. Після онбордингу ви зазвичай запускаєте Gateway на порту **18789**.

    Із вихідного коду (contributors/dev):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build # auto-installs UI deps on first run
    openclaw onboard
    ```

    Якщо у вас ще немає глобального встановлення, запустіть через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Як відкрити dashboard після онбордингу?">
    Майстер відкриває у вашому браузері чисту (без токенізованого URL) адресу dashboard одразу після онбордингу, а також друкує посилання в підсумку. Тримайте цю вкладку відкритою; якщо вона не запустилася, скопіюйте й вставте надрукований URL на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитує auth через shared secret, вставте налаштований токен або пароль у налаштуваннях Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо shared secret ще не налаштовано, згенеруйте токен через `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште bind loopback, виконайте `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють auth для Control UI/WebSocket (без вставляння shared secret, за умови довіреного gateway host); HTTP API, як і раніше, вимагають auth через shared secret, якщо ви навмисно не використовуєте private-ingress `none` або auth HTTP через trusted-proxy.
      Некоректні одночасні спроби auth від того самого клієнта через Serve серіалізуються до того, як limiter невдалої auth їх зафіксує, тому вже друга помилкова повторна спроба може показати `retry later`.
    - **Bind tailnet**: виконайте `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте auth через пароль), відкрийте `http://<tailscale-ip>:18789/`, потім вставте відповідний shared secret у налаштування dashboard.
    - **Identity-aware reverse proxy**: залиште Gateway за trusted proxy без loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, потім відкрийте URL proxy.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host` потім відкрийте `http://127.0.0.1:18789/`. Auth через shared secret і далі застосовується через tunnel; вставте налаштований токен або пароль, якщо буде запит.

    Див. [Dashboard](/web/dashboard) і [Web surfaces](/web) для подробиць щодо режимів bind і auth.

  </Accordion>

  <Accordion title="Чому є дві конфігурації approval для exec-approval у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на approval до призначень чату
    - `channels.<channel>.execApprovals`: робить цей канал нативним approval-клієнтом для exec-approval

    Політика host exec усе ще є реальною перепоною approval. Конфігурація чату лише керує тим,
    де з’являються запити на approval і як люди можуть на них відповідати.

    У більшості налаштувань вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди й відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначити approver-ів, OpenClaw тепер автоматично вмикає DM-first native approvals, коли `channels.<channel>.execApprovals.enabled` не задано або дорівнює `"auto"`.
    - Коли доступні нативні картки/кнопки approval, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що approvals у чаті недоступні або ручний approval — єдиний шлях.
    - Використовуйте `approvals.exec` лише коли запити також потрібно пересилати в інші чати або явні ops-room.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише тоді, коли ви явно хочете, щоб запити на approval публікувалися назад у вихідну кімнату/тему.
    - approvals для plugins знову ж таки окремі: вони за замовчуванням використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали зберігають додаткову обробку plugin-approval-native.

    Коротко: пересилання — це про маршрутизацію, конфігурація нативного клієнта — про багатший UX, специфічний для каналу.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке середовище виконання потрібне?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендовано** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легкий — у документації вказано, що для особистого використання достатньо **512MB-1GB RAM**, **1 ядра** і близько **500MB**
    диска, і зазначено, що **Raspberry Pi 4 може це запускати**.

    Якщо вам потрібен додатковий запас (логи, медіа, інші сервіси), **рекомендовано 2GB**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може хостити Gateway, а ви можете підключати **nodes** на ноутбуці/телефоні для
    локального screen/camera/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради для встановлення на Raspberry Pi?">
    Коротко: працює, але очікуйте шерехів.

    - Використовуйте **64-bit** ОС і Node >= 22.
    - Надавайте перевагу **hackable (git) install**, щоб бачити логи й швидко оновлюватися.
    - Почніть без channels/Skills, потім додавайте їх по одному.
    - Якщо натрапите на дивні проблеми з бінарниками, це зазвичай проблема **ARM-сумісності**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Застрягає на wake up my friend / onboarding не проходить. Що робити?">
    Цей екран залежить від доступності й автентифікації Gateway. TUI також автоматично надсилає
    "Wake up, my friend!" під час першого hatch. Якщо ви бачите цей рядок **без відповіді**
    і токени лишаються 0, агент так і не запустився.

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
    спрямовано на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini), не проходячи onboarding заново?">
    Так. Скопіюйте **каталог state** і **workspace**, потім один раз запустіть Doctor. Це
    збереже вашого бота "точно таким самим" (memory, history сесій, auth і channel
    state), якщо ви скопіюєте **обидва** місця:

    1. Встановіть OpenClaw на нову машину.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте ваш workspace (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть сервіс Gateway.

    Це збереже config, auth-профілі, облікові дані WhatsApp, sessions і memory. Якщо ви в
    remote mode, пам’ятайте, що саме gateway host володіє сховищем сесій і workspace.

    **Важливо:** якщо ви лише commit/push ваш workspace на GitHub, ви резервуєте
    **memory + bootstrap-файли**, але **не** history сесій і не auth. Вони живуть
    у `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Міграція](/uk/install/migrating), [Де що лежить на диску](#де-що-лежить-на-диску),
    [Workspace агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи зверху. Якщо верхню секцію позначено як **Unreleased**, наступна датована
    секція — це остання випущена версія. Записи згруповано за **Highlights**, **Changes** та
    **Fixes** (а також docs/іншими секціями за потреби).

  </Accordion>

  <Accordion title="Не вдається відкрити docs.openclaw.ai (помилка SSL)">
    Деякі з’єднання Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до allowlist, а потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати це, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркалюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable-реліз спочатку потрапляє в **beta**, а потім явний
    крок просування переносить цю саму версію в `latest`. Maintainers також можуть
    за потреби публікувати відразу в `latest`. Саме тому beta і stable можуть
    вказувати на **ту саму версію** після просування.

    Подивитися, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди для встановлення і різницю між beta та dev дивіться в акордеоні нижче.

  </Accordion>

  <Accordion title="Як встановити beta-версію і в чому різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (може збігатися з `latest` після просування).
    **Dev** — це рухома голова `main` (git); коли її публікують, вона використовує npm dist-tag `dev`.

    Однорядкові команди (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Windows installer (PowerShell):
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

    Це дає вам локальний repo, який можна редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому clone вручну, використайте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/cli/update), [Канали розробки](/uk/install/development-channels),
    [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай тривають встановлення та onboarding?">
    Орієнтовно:

    - **Встановлення:** 2-5 хвилин
    - **Onboarding:** 5-15 хвилин залежно від кількості channels/models, які ви налаштовуєте

    Якщо все зависло, скористайтеся [Застряг інсталятор](#швидкий-старт-і-перше-налаштування)
    і швидким циклом налагодження в [Я застряг(ла)](#швидкий-старт-і-перше-налаштування).

  </Accordion>

  <Accordion title="Інсталятор застряг? Як отримати більше зворотного зв’язку?">
    Повторно запустіть інсталятор із **докладним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Beta-встановлення з verbose:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Для hackable-встановлення (git):

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
    Дві поширені проблеми у Windows:

    **1) npm error spawn git / git not found**

    - Встановіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, потім повторно запустіть інсталятор.

    **2) openclaw is not recognized after install**

    - Ваша глобальна тека bin npm не додана до PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до PATH користувача (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо ви хочете найгладше налаштування у Windows, використовуйте **WSL2**, а не нативну Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="На Windows вивід exec показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність кодової сторінки консолі в нативних оболонках Windows.

    Симптоми:

    - Вивід `system.run`/`exec` відображає китайський текст як mojibake
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

    Якщо на останній версії OpenClaw проблема все ще відтворюється, відстежуйте/повідомляйте тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використайте **hackable (git) install**, щоб мати повні локальні вихідні коди й документацію, а потім запитайте
    свого бота (або Claude/Codex) _з цієї теки_, щоб він міг читати repo і відповісти точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтеся інструкції для Linux, потім запустіть onboarding.

    - Швидкий шлях для Linux + встановлення сервісу: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення та оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Встановіть на сервері, потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де гайди зі встановлення в хмарі/VPS?">
    Ми підтримуємо **хаб хостингів** із поширеними провайдерами. Оберіть один і дотримуйтеся інструкції:

    - [VPS hosting](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте доступ до нього
    з ноутбука/телефона через Control UI (або Tailscale/SSH). Ваші state + workspace
    живуть на сервері, тож сприймайте host як джерело істини й робіть резервні копії.

    Ви можете підключати **nodes** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримати доступ до
    локальних screen/camera/canvas або виконувати команди на ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити самого себе?">
    Коротка відповідь: **можливо, але не рекомендовано**. Процес оновлення може перезапустити
    Gateway (що розірве активну сесію), може вимагати чистого git checkout і
    може запитати підтвердження. Безпечніше: запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо вже треба автоматизувати з агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить onboarding?">
    `openclaw onboard` — рекомендований шлях налаштування. У **local mode** він проводить вас через:

    - **Налаштування model/auth** (OAuth провайдера, API-ключі, legacy setup-token Anthropic, а також варіанти локальних моделей, такі як LM Studio)
    - Розташування **workspace** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Channels** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також bundled channel plugins, як-от QQ Bot)
    - **Встановлення daemon** (LaunchAgent на macOS; systemd user unit на Linux/WSL2)
    - **Перевірки health** і вибір **Skills**

    Він також попереджає, якщо налаштована модель невідома або для неї бракує auth.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані лишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації в цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **Anthropic API key**: звичайна тарифікація Anthropic API
    - **Claude subscription auth in OpenClaw**: Anthropic повідомила користувачам OpenClaw
      **4 квітня 2026 о 12:00 PT / 20:00 BST**, що для цього потрібне
      **Extra Usage**, яке виставляється окремо від підписки

    Наші локальні відтворення також показують, що `claude -p --append-system-prompt ...` може
    натрапляти на той самий захист Extra Usage, коли доданий prompt ідентифікує
    OpenClaw, тоді як той самий рядок prompt **не** відтворює це блокування на
    шляху Anthropic SDK + API-key. OpenAI Codex OAuth офіційно
    підтримується для зовнішніх інструментів, таких як OpenClaw.

    OpenClaw також підтримує інші hosted-варіанти з підписочною моделлю, включно з
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan**, і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [GLM Models](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API-ключа?">
    Так, але сприймайте це як **Claude subscription auth with Extra Usage**.

    Підписки Claude Pro/Max не включають API-ключ. В OpenClaw це
    означає, що застосовується специфічне для OpenClaw повідомлення Anthropic про тарифікацію:
    трафік за підпискою потребує **Extra Usage**. Якщо ви хочете трафік Anthropic без
    цього шляху Extra Usage, натомість використовуйте API-ключ Anthropic.

  </Accordion>

  <Accordion title="Чи підтримуєте ви Claude subscription auth (Claude Pro або Max)?">
    Так, але тепер підтримуване трактування таке:

    - Anthropic в OpenClaw із підпискою означає **Extra Usage**
    - Anthropic в OpenClaw без цього шляху означає **API key**

    Setup-token Anthropic усе ще доступний як legacy/manual-шлях OpenClaw,
    і специфічне для OpenClaw повідомлення Anthropic про тарифікацію тут також діє. Ми
    також локально відтворили той самий захист тарифікації за прямого використання
    `claude -p --append-system-prompt ...`, коли доданий prompt
    ідентифікує OpenClaw, тоді як той самий рядок prompt **не** відтворився на
    шляху Anthropic SDK + API-key.

    Для production або multi-user-навантажень auth через API-ключ Anthropic —
    безпечніший і рекомендований вибір. Якщо вам потрібні інші hosted-варіанти
    з підписочною моделлю в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і
    [GLM Models](/uk/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
Це означає, що вашу **квоту/ліміт швидкості Anthropic** вичерпано для поточного вікна. Якщо ви
використовуєте **Claude CLI**, дочекайтеся скидання вікна або підвищте свій тариф. Якщо ви
використовуєте **Anthropic API key**, перевірте Anthropic Console
на використання/тарифікацію та за потреби підвищте ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, запит намагається використовувати
    beta 1M context Anthropic (`context1m: true`). Це працює лише коли ваш
    credential має право на long-context billing (тарифікація через API-ключ або
    шлях OpenClaw Claude-login з увімкненим Extra Usage).

    Порада: налаштуйте **fallback model**, щоб OpenClaw міг продовжувати відповідати, коли провайдер упирається в rate limit.
    Див. [Моделі](/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має bundled-провайдера **Amazon Bedrock (Converse)**. Якщо присутні AWS env-маркери, OpenClaw може автоматично виявити streaming/text-каталог Bedrock і об’єднати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати ручний запис провайдера. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний proxy перед Bedrock також є коректним варіантом.
  </Accordion>

  <Accordion title="Як працює auth Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Onboarding може провести OAuth-flow і встановить модель за замовчуванням `openai-codex/gpt-5.4`, коли це доречно. Див. [Провайдери моделей](/uk/concepts/model-providers) і [Onboarding (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чи підтримуєте ви OpenAI subscription auth (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **subscription OAuth OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання subscription OAuth у зовнішніх інструментах/робочих процесах,
    як-от OpenClaw. Onboarding може провести OAuth-flow за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Onboarding (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **plugin auth flow**, а не client id або secret у `openclaw.json`.

    Натомість використовуйте провайдера Gemini API:

    1. Увімкніть plugin: `openclaw plugins enable google`
    2. Запустіть `openclaw onboard --auth-choice gemini-api-key`
    3. Встановіть модель Google, наприклад `google/gemini-3.1-pro-preview`

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого context + сильного безпекового профілю; малі картки обрізаються й протікають. Якщо вже дуже треба, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантовані моделі збільшують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як тримати трафік hosted-моделей у конкретному регіоні?">
    Обирайте endpoint-и з прив’язкою до регіону. OpenRouter надає розміщені в США варіанти для MiniMax, Kimi і GLM; оберіть варіант, розміщений у США, щоб зберегти дані в регіоні. Ви все одно можете перелічувати Anthropic/OpenAI поруч із ними, використовуючи `models.mode: "merge"`, щоб fallbacks лишалися доступними, водночас поважаючи обраного вами регіонального провайдера.
  </Accordion>

  <Accordion title="Чи обов’язково купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini — необов’язковий;
    дехто купує його як хост, що працює постійно, але підійде й невеликий VPS, домашній сервер або box рівня Raspberry Pi.

    Mac потрібен лише для **інструментів, доступних тільки на macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші macOS-only tools, запускайте Gateway на Mac або підключайте macOS node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, увійдений у Messages. Це **не обов’язково** Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, а Gateway може працювати на Linux або деінде.

    Типові варіанти:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, увійденому в Messages.
    - Запускайте все на Mac, якщо хочете найпростішу одно-машинну конфігурацію.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи зможу я підключити його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключитися як
    **node** (companion device). Nodes не запускають Gateway — вони надають додаткові
    можливості, як-от screen/camera/canvas і `system.run` на цьому пристрої.

    Типова схема:

    - Gateway на Mac mini (завжди увімкнений).
    - MacBook Pro запускає macOS-app або node host і з’єднується з Gateway.
    - Для перегляду використовуйте `openclaw nodes status` / `openclaw nodes list`.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можна використовувати Bun?">
    Bun **не рекомендовано**. Ми бачимо баги під час роботи, особливо з WhatsApp і Telegram.
    Для stable gateway використовуйте **Node**.

    Якщо ви все ж хочете експериментувати з Bun, робіть це на non-production gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не username бота.

    Onboarding приймає ввід `@username` і перетворює його на числовий ID, але авторизація OpenClaw використовує лише числові ID.

    Безпечніше (без стороннього бота):

    - Напишіть боту в DM, потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть боту в DM, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Напишіть у DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **multi-agent routing**. Прив’яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, E.164 відправника, як-от `+15551234567`) до іншого `agentId`, щоб кожна людина мала власний workspace і сховище сесій. Відповіді все одно надходитимуть із **того самого облікового запису WhatsApp**, а контроль доступу для DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для цього облікового запису WhatsApp. Див. [Multi-Agent Routing](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запускати агента "fast chat" і агента "Opus for coding"?'>
    Так. Використовуйте multi-agent routing: дайте кожному agent його власну модель за замовчуванням, а потім прив’яжіть вхідні routes (обліковий запис провайдера або конкретних peers) до кожного agent. Приклад конфігурації наведено в [Multi-Agent Routing](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу включає `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, визначалися в non-login оболонках.
    Останні збірки також додають попереду поширені user bin-каталоги в Linux systemd-сервісах (наприклад, `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо їх задано.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повний checkout вихідного коду, редагований, найкраще для contributors.
      Ви локально виконуєте збирання і можете патчити код/документацію.
    - **npm install:** глобальне встановлення CLI без repo, найкраще для сценарію "просто запустити".
      Оновлення приходять із npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше переключатися між npm і git-встановленням?">
    Так. Встановіть інший варіант, потім запустіть Doctor, щоб сервіс gateway вказував на новий entrypoint.
    Це **не видаляє ваші дані** — воно лише змінює встановлення коду OpenClaw. Ваш state
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

    Doctor виявляє невідповідність entrypoint сервісу gateway і пропонує переписати конфігурацію сервісу відповідно до поточного встановлення (в automation використовуйте `--repair`).

    Поради щодо резервних копій: див. [Стратегія резервного копіювання](#де-що-лежить-на-диску).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібне
    найменше тертя й вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Плюси:** без вартості сервера, прямий доступ до локальних файлів, видиме вікно браузера.
    - **Мінуси:** сон/обриви мережі = розриви з’єднання, оновлення/перезавантаження ОС переривають роботу, машину треба тримати активною.

    **VPS / хмара**

    - **Плюси:** завжди ввімкнено, стабільна мережа, немає проблем через сон ноутбука, легше підтримувати постійну роботу.
    - **Мінуси:** часто headless-режим (використовуйте скриншоти), доступ до файлів лише віддалено, для оновлень потрібен SSH.

    **Примітка, специфічна для OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord усі добре працюють із VPS. Єдиний реальний компроміс — **headless browser** проти видимого вікна. Див. [Браузер](/uk/tools/browser).

    **Рекомендовано за замовчуванням:** VPS, якщо у вас уже були розриви gateway. Локальний запуск чудово підходить, коли ви активно користуєтеся Mac і хочете доступ до локальних файлів або UI-автоматизацію з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Не обов’язково, але **рекомендовано для надійності та ізоляції**.

    - **Окремий host (VPS/Mac mini/Pi):** завжди ввімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, простіше підтримувати роботу.
    - **Спільний ноутбук/desktop:** цілком підходить для тестування та активного використання, але очікуйте пауз, коли машина засинає або оновлюється.

    Якщо ви хочете поєднати найкраще з обох світів, тримайте Gateway на окремому host і підключайте ноутбук як **node** для локальних інструментів screen/camera/exec. Див. [Nodes](/uk/nodes).
    Поради з безпеки див. у [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яку ОС рекомендуєте?">
    OpenClaw легкий. Для базового Gateway + одного chat-каналу:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1-2 vCPU, 2GB RAM або більше для запасу (логи, медіа, кілька каналів). Node tools і browser automation можуть потребувати багато ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-яку сучасну Debian/Ubuntu). Шлях встановлення для Linux там протестовано найкраще.

    Документація: [Linux](/uk/platforms/linux), [VPS hosting](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути постійно увімкнена, доступна і мати достатньо
    RAM для Gateway та будь-яких увімкнених каналів.

    Базові орієнтири:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька каналів, browser automation або media tools.
    - **ОС:** Ubuntu LTS або інша сучасна Debian/Ubuntu.

    Якщо ви на Windows, **WSL2 — найпростіший стиль налаштування VM** і має найкращу
    сумісність інструментів. Див. [Windows](/uk/platforms/windows), [VPS hosting](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw, в одному абзаці?">
    OpenClaw — це персональний AI-помічник, який ви запускаєте на власних пристроях. Він відповідає на поверхнях обміну повідомленнями, якими ви вже користуєтеся (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat і bundled channel plugins, такі як QQ Bot), а також може працювати з голосом + live Canvas на підтримуваних платформах. **Gateway** — це постійно увімкнена control plane; помічник і є продуктом.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не "просто обгортка для Claude". Це **local-first control plane**, яка дозволяє вам запускати
    потужного помічника на **власному обладнанні**, доступного з chat-застосунків, якими ви вже користуєтесь, зі
    stateful sessions, memory та tools — без передачі контролю над вашими workflow хостинговому
    SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і тримайте
      workspace + history сесій локально.
    - **Реальні канали, а не web-пісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      а також mobile voice і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо, з маршрутизацією
      та failover на рівні agent.
    - **Лише локальний варіант:** запускайте локальні моделі, щоб **усі дані могли лишатися на вашому пристрої**, якщо бажаєте.
    - **Multi-agent routing:** окремі agents за каналом, обліковим записом або задачею, кожен із власним
      workspace і параметрами за замовчуванням.
    - **Відкритий код і hackable:** перевіряйте, розширюйте й self-host без vendor lock-in.

    Документація: [Gateway](/uk/gateway), [Канали](/uk/channels), [Multi-agent](/uk/concepts/multi-agent),
    [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував(ла) — що робити спочатку?">
    Хороші перші проєкти:

    - Створити вебсайт (WordPress, Shopify або простий статичний сайт).
    - Прототипувати мобільний застосунок (структура, екрани, план API).
    - Упорядкувати файли й теки (очищення, найменування, теги).
    - Підключити Gmail і автоматизувати зведення чи follow-up.

    Він може впоратися з великими задачами, але найкраще працює, коли ви ділите їх на фази й
    використовуєте sub agents для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найкращих повсякденних сценаріїв використання OpenClaw?">
    Повсякденні виграші зазвичай виглядають так:

    - **Персональні зведення:** підсумки inbox, календаря й важливих для вас новин.
    - **Дослідження й чернетки:** швидкий ресерч, зведення та перші чернетки листів або документів.
    - **Нагадування і follow-up:** nudges і чеклісти на базі cron або heartbeat.
    - **Автоматизація браузера:** заповнення форм, збирання даних і повторення web-задач.
    - **Координація між пристроями:** надішліть задачу з телефону, дайте Gateway виконати її на сервері й отримайте результат назад у чаті.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, ads і блогами для SaaS?">
    Так — для **дослідження, кваліфікації та створення чернеток**. Він може сканувати сайти, будувати shortlists,
    підсумовувати prospects і писати чернетки outreach або рекламних текстів.

    Для **outreach або запуску реклами** тримайте людину в циклі. Уникайте спаму, дотримуйтеся місцевих законів і
    політик платформ, і перевіряйте все перед надсиланням. Найбезпечніший шаблон — нехай
    OpenClaw створює чернетку, а ви схвалюєте.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний помічник** і координаційний рівень, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу кодування всередині repo. Використовуйте OpenClaw, коли вам
    потрібні довготривала memory, доступ із різних пристроїв і orchestration tools.

    Переваги:

    - **Стійка memory + workspace** між сесіями
    - **Multi-platform access** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (browser, files, scheduling, hooks)
    - **Постійно увімкнений Gateway** (запуск на VPS, взаємодія звідусіль)
    - **Nodes** для локального browser/screen/camera/exec

    Вітрина: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills і автоматизація

<AccordionGroup>
  <Accordion title="Як кастомізувати Skills, не забруднюючи repo?">
    Використовуйте керовані override-и замість редагування копії в repo. Розміщуйте свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте теку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, тож керовані override-и все одно мають перевагу над bundled Skills без втручання в git. Якщо вам потрібно, щоб Skill був встановлений глобально, але видимий лише деяким agents, тримайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` та `agents.list[].skills`. Лише зміни, гідні upstream, мають жити в repo і виходити як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати Skills з власної теки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Стандартний пріоритет: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` типово встановлює у `./skills`, які OpenClaw розглядає як `<workspace>/skills` у наступній сесії. Якщо Skill має бути видимим лише певним agents, поєднайте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як використовувати різні моделі для різних задач?">
    Сьогодні підтримуються такі шаблони:

    - **Cron jobs**: ізольовані jobs можуть задавати override `model` для кожної job.
    - **Sub-agents**: маршрутизуйте задачі до окремих agents із різними моделями за замовчуванням.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб змінити модель поточної сесії в будь-який момент.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Multi-Agent Routing](/uk/concepts/multi-agent) і [Слеш-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як це винести?">
    Використовуйте **sub-agents** для довгих або паралельних задач. Sub-agents працюють у власній сесії,
    повертають підсумок і зберігають чутливість вашого основного чату.

    Попросіть бота "spawn a sub-agent for this task" або використайте `/subagents`.
    Використовуйте `/status` у чаті, щоб побачити, що Gateway робить просто зараз (і чи він зайнятий).

    Порада щодо токенів: як довгі задачі, так і sub-agents споживають токени. Якщо вартість критична, задайте
    дешевшу модель для sub-agents через `agents.defaults.subagents.model`.

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові задачі](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють прив’язані до thread сесії subagent у Discord?">
    Використовуйте thread bindings. Ви можете прив’язати Discord thread до subagent або цілі session, щоб наступні повідомлення в цьому thread лишалися в межах прив’язаної session.

    Базовий процес:

    - Створіть через `sessions_spawn` з `thread: true` (і за потреби `mode: "session"` для стійкого follow-up).
    - Або прив’яжіть вручну через `/focus <target>`.
    - Використовуйте `/agents`, щоб перевірити стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним unfocus.
    - Використовуйте `/unfocus`, щоб від’єднати thread.

    Потрібна конфігурація:

    - Глобальні значення за замовчуванням: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Override-и Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоприв’язка під час spawn: встановіть `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agents](/uk/tools/subagents), [Discord](/uk/channels/discord), [Довідник конфігурації](/uk/gateway/configuration-reference), [Слеш-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent завершився, але оновлення про завершення пішло не туди або взагалі не було опубліковане. Що перевірити?">
    Спочатку перевірте визначений requester route:

    - Доставка completion-mode subagent надає перевагу будь-якому прив’язаному thread або conversation route, якщо він існує.
    - Якщо походження completion містить лише канал, OpenClaw відступає до збереженого route requester session (`lastChannel` / `lastTo` / `lastAccountId`), тож пряма доставка все одно може спрацювати.
    - Якщо немає ні прив’язаного route, ні придатного збереженого route, пряма доставка може не вдатися, і результат переходить до queued session delivery замість негайної публікації в чат.
    - Невалідні або застарілі цілі все одно можуть змусити перейти до queue fallback або остаточної невдачі доставки.
    - Якщо остання видима відповідь assistant у child — це точний тихий токен `NO_REPLY` / `no_reply`, або точно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує announce замість публікації застарілого ранішого progress.
    - Якщо child перевищив timeout лише після викликів tools, announce може згорнути це в короткий підсумок часткового progress замість відтворення сирого виводу tools.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові задачі](/uk/automation/tasks), [Session Tools](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron виконується всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані jobs не запускатимуться.

    Контрольний список:

    - Підтвердьте, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не задано.
    - Переконайтеся, що Gateway працює 24/7 (без сну/перезапусків).
    - Перевірте налаштування часового поясу для job (`--tz` проти часового поясу host).

    Налагодження:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та задачі](/uk/automation).

  </Accordion>

  <Accordion title="Cron спрацював, але в канал нічого не було надіслано. Чому?">
    Спочатку перевірте режим доставки:

    - `--no-deliver` / `delivery.mode: "none"` означає, що зовнішнє повідомлення не очікується.
    - Відсутня або невалідна announce-ціль (`channel` / `to`) означає, що runner пропустив outbound delivery.
    - Збої auth каналу (`unauthorized`, `Forbidden`) означають, що runner спробував доставити, але credentials заблокували це.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` only) вважається навмисно недоставним, тож runner також пригнічує queued fallback delivery.

    Для ізольованих cron jobs фінальною доставкою володіє runner. Очікується,
    що agent поверне plain-text summary, який runner надішле. `--no-deliver` зберігає
    цей результат внутрішнім; це не дозволяє agent натомість напряму надсилати через
    message tool.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Фонові задачі](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований cron run перемкнув моделі або один раз повторився?">
    Зазвичай це шлях live model-switch, а не дублювання розкладу.

    Ізольований cron може зберігати runtime handoff моделі та повторювати спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає перемкненого
    provider/model, а якщо switch ніс новий override auth profile, cron
    також зберігає його перед повторною спробою.

    Пов’язані правила вибору:

    - Override моделі Gmail hook має найвищий пріоритет, коли застосовно.
    - Потім `model` для job.
    - Потім будь-який збережений override моделі cron-session.
    - Потім звичайний вибір моделі agent/default.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 switch-повторів
    cron завершується замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [cron CLI](/cli/cron).

  </Accordion>

  <Accordion title="Як встановити Skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або просто кладіть Skills у свій workspace. UI Skills для macOS недоступний на Linux.
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

    Нативний `openclaw skills install` записує в каталог `skills/`
    активного workspace. Встановлюйте окремий CLI `clawhub` лише якщо хочете публікувати або
    синхронізувати власні Skills. Для спільних встановлень між agents кладіть Skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете обмежити видимість певним agents.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати задачі за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Cron jobs** для запланованих або повторюваних задач (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок "головної session".
    - **Ізольовані jobs** для автономних agents, які публікують підсумки або доставляють їх у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та задачі](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати Apple macOS-only Skills з Linux?">
    Не напряму. Skills на macOS обмежуються через `metadata.openclaw.os` плюс потрібні бінарники, і Skills з’являються в system prompt лише тоді, коли вони доступні на **Gateway host**. На Linux Skills лише для `darwin` (як-от `apple-notes`, `apple-reminders`, `things-mac`) не завантажаться, якщо ви не перевизначите це обмеження.

    Є три підтримувані шаблони:

    **Варіант A — запускати Gateway на Mac (найпростіше).**
    Запускайте Gateway там, де існують бінарники macOS, а потім підключайтеся з Linux у [віддаленому режимі](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажуються як зазвичай, бо Gateway host — це macOS.

    **Варіант B — використовувати macOS node (без SSH).**
    Запускайте Gateway на Linux, під’єднайте macOS node (menubar app) і встановіть **Node Run Commands** у "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати macOS-only Skills доступними, коли потрібні бінарники існують на node. Агент запускає ці Skills через інструмент `nodes`. Якщо ви виберете "Always Ask", підтвердження "Always Allow" у prompt додає цю команду до allowlist.

    **Варіант C — проксувати бінарники macOS через SSH (просунуто).**
    Тримайте Gateway на Linux, але зробіть так, щоб потрібні CLI-бінарники визначалися як SSH-обгортки, які виконуються на Mac. Потім перевизначте Skill, щоб дозволити Linux і він лишався доступним.

    1. Створіть SSH-обгортку для бінарника (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Додайте обгортку в `PATH` на Linux host (наприклад, `~/bin/memo`).
    3. Перевизначте metadata Skill (workspace або `~/.openclaw/skills`) так, щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Почніть нову session, щоб snapshot Skills оновився.

  </Accordion>

  <Accordion title="Чи є інтеграція з Notion або HeyGen?">
    Вбудованої зараз немає.

    Варіанти:

    - **Custom skill / plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Автоматизація браузера:** працює без коду, але повільніше й крихкіше.

    Якщо ви хочете зберігати context для кожного клієнта (workflows агентства), простий шаблон такий:

    - Одна сторінка Notion на клієнта (context + preferences + активна робота).
    - Попросіть agent витягувати цю сторінку на початку session.

    Якщо хочете нативну інтеграцію, відкрийте feature request або створіть Skill,
    який працює з цими API.

    Встановлення Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активного workspace. Для спільних Skills між agents розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі agents, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі Skills очікують бінарники, встановлені через Homebrew; на Linux це означає Linuxbrew (див. запис ЧаП про Homebrew Linux вище). Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати вже авторизований Chrome з OpenClaw?">
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

    Цей шлях є локальним для host. Якщо Gateway працює деінде, або запускайте node host на машині з браузером, або використовуйте remote CDP.

    Поточні обмеження `existing-session` / `user`:

    - дії базуються на ref, а не на CSS-selector
    - завантаження файлів потребує `ref` / `inputRef` і зараз підтримує лише один файл за раз
    - `responsebody`, експорт PDF, interception завантажень і batch-дії все ще потребують керованого браузера або сирого CDP-профілю

  </Accordion>
</AccordionGroup>

## Пісочниця і пам’ять

<AccordionGroup>
  <Accordion title="Чи є окремий документ про пісочницю?">
    Так. Див. [Пісочниця](/uk/gateway/sandboxing). Для налаштування, специфічного для Docker (повний gateway у Docker або sandbox images), див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повні можливості?">
    Образ за замовчуванням орієнтований на безпеку і працює від користувача `node`, тому він не
    містить системних пакетів, Homebrew або bundled-браузерів. Для повнішого налаштування:

    - Збережіть `/home/node` у `OPENCLAW_HOME_VOLUME`, щоб кеші переживали перезапуски.
    - Запікайте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Встановіть браузери Playwright через bundled CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Встановіть `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я залишити DM приватними, а групи зробити публічними/ізольованими з одним agent?">
    Так — якщо ваш приватний трафік це **DM**, а публічний трафік — **groups**.

    Використайте `agents.defaults.sandbox.mode: "non-main"`, щоб group/channel sessions (ключі не main) запускалися в Docker, а головна DM-session лишалася на host. Потім обмежте, які tools доступні в sandboxed sessions, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: особисті DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Ключове посилання на конфігурацію: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як примонтувати host-теку в sandbox?">
    Встановіть `agents.defaults.sandbox.docker.binds` у `["host:path:mode"]` (наприклад, `"/home/user/src:/src:ro"`). Global + per-agent bind-и об’єднуються; bind-и per-agent ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого й пам’ятайте, що bind-и обходять файлові стіни sandbox.

    OpenClaw перевіряє джерела bind і за нормалізованим шляхом, і за канонічним шляхом, визначеним через найглибшого наявного предка. Це означає, що вихід через symlink-parent усе одно буде fail closed, навіть якщо останній сегмент шляху ще не існує, а перевірки allowed-root і далі застосовуються після розв’язання symlink.

    Див. [Пісочниця](/uk/gateway/sandboxing#custom-bind-mounts) і [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) для прикладів і зауваг із безпеки.

  </Accordion>

  <Accordion title="Як працює пам’ять?">
    Пам’ять OpenClaw — це просто Markdown-файли в workspace агента:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Кураторські довгострокові нотатки в `MEMORY.md` (лише main/private sessions)

    OpenClaw також запускає **тихий pre-compaction memory flush**, щоб нагадати моделі
    записати стійкі нотатки перед auto-compaction. Це виконується лише тоді, коли workspace
    доступний на запис (read-only sandbox пропускає це). Див. [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Пам’ять постійно все забуває. Як зробити, щоб це закріпилося?">
    Попросіть бота **записати факт у memory**. Довгострокові нотатки належать у `MEMORY.md`,
    короткостроковий context — у `memory/YYYY-MM-DD.md`.

    Це все ще напрям, який ми покращуємо. Допомагає нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо все одно забуває, перевірте, чи Gateway використовує той самий
    workspace щоразу під час запуску.

    Документація: [Пам’ять](/uk/concepts/memory), [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Пам’ять зберігається назавжди? Які обмеження?">
    Файли пам’яті живуть на диску і зберігаються, доки ви їх не видалите. Обмеження — це ваше
    сховище, а не модель. **Контекст сесії** все одно обмежений вікном контексту моделі,
    тому довгі розмови можуть стискатися або обрізатися. Саме тому існує memory search —
    він повертає в context лише релевантні частини.

    Документація: [Пам’ять](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потрібен для semantic memory search API-ключ OpenAI?">
    Лише якщо ви використовуєте **OpenAI embeddings**. Codex OAuth покриває chat/completions і
    **не** надає доступу до embeddings, тож **вхід через Codex (OAuth або
    вхід через Codex CLI)** не допомагає для semantic memory search. Для embeddings OpenAI
    усе ще потрібен справжній API-ключ (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви явно не задаєте провайдера, OpenClaw автоматично вибирає провайдера, коли
    може знайти API-ключ (auth profiles, `models.providers.*.apiKey` або env vars).
    Він надає перевагу OpenAI, якщо є ключ OpenAI, інакше Gemini, якщо є ключ Gemini,
    потім Voyage, потім Mistral. Якщо жодного віддаленого ключа немає, memory
    search лишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштований і наявний шлях до локальної моделі, OpenClaw
    надає перевагу `local`. Ollama підтримується, якщо ви явно задаєте
    `memorySearch.provider = "ollama"`.

    Якщо ви волієте залишитися локально, встановіть `memorySearch.provider = "local"` (і необов’язково
    `memorySearch.fallback = "none"`). Якщо вам потрібні embeddings Gemini, встановіть
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо embedding-моделі **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    див. [Пам’ять](/uk/concepts/memory) для деталей налаштування.

  </Accordion>
</AccordionGroup>

## Де що лежить на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, що використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** sessions, memory-файли, config і workspace живуть на Gateway host
      (`~/.openclaw` + ваш каталог workspace).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте модельним провайдерам (Anthropic/OpenAI тощо), ідуть
      до їхніх API, а chat-платформи (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на
      своїх серверах.
    - **Ви контролюєте слід:** використання локальних моделей залишає prompts на вашій машині, але трафік
      каналів усе одно проходить через сервери каналу.

    Пов’язане: [Workspace агента](/uk/concepts/agent-workspace), [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе живе під `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Path                                                            | Purpose                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основна конфігурація (JSON5)                                       |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Legacy OAuth import (копіюється в auth profiles при першому використанні) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles (OAuth, API keys та необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язковий file-backed payload secret для провайдерів `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Файл legacy compatibility (статичні записи `api_key` очищені)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдера (наприклад, `whatsapp/<accountId>/creds.json`)     |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан на рівні agent (agentDir + sessions)                          |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | History розмов і state (для кожного agent)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Metadata сесій (для кожного agent)                                 |

    Legacy single-agent path: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`).

    Ваш **workspace** (AGENTS.md, memory-файли, Skills тощо) є окремим і налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають лежати AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли живуть у **workspace агента**, а не в `~/.openclaw`.

    - **Workspace (для кожного agent):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (або legacy fallback `memory.md`, коли `MEMORY.md` відсутній),
      `memory/YYYY-MM-DD.md`, необов’язковий `HEARTBEAT.md`.
    - **Каталог state (`~/.openclaw`)**: config, state каналів/провайдерів, auth profiles, sessions, logs,
      та спільні Skills (`~/.openclaw/skills`).

    Workspace за замовчуванням — `~/.openclaw/workspace`, це можна налаштувати через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот "забуває" після перезапуску, підтвердьте, що Gateway використовує той самий
    workspace під час кожного запуску (і пам’ятайте: remote mode використовує **gateway host**
    workspace, а не ваш локальний ноутбук).

    Порада: якщо ви хочете стійку поведінку або вподобання, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладатися на history чату.

    Див. [Workspace агента](/uk/concepts/agent-workspace) і [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Помістіть ваш **workspace агента** в **приватний** git repo і робіть його резервну копію десь
    приватно (наприклад, у GitHub private). Це зберігає memory + файли AGENTS/SOUL/USER
    і дозволяє відновити "розум" помічника пізніше.

    **Не** commit-те нічого з `~/.openclaw` (credentials, sessions, tokens або encrypted payload secrets).
    Якщо вам потрібне повне відновлення, окремо робіть резервні копії і workspace, і каталогу state
    (див. питання про міграцію вище).

    Документація: [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окрему інструкцію: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть agents працювати поза workspace?">
    Так. Workspace — це **cwd за замовчуванням** і якір memory, а не жорстка sandbox.
    Відносні шляхи розв’язуються всередині workspace, але абсолютні шляхи можуть звертатися до інших
    місць на host, якщо sandboxing не увімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або sandbox-налаштування для окремих agents. Якщо ви
    хочете, щоб repo був робочим каталогом за замовчуванням, вкажіть для цього agent
    `workspace` як корінь repo. Repo OpenClaw — це лише вихідний код; тримайте
    workspace окремо, якщо тільки ви навмисно не хочете, щоб agent працював усередині нього.

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

  <Accordion title="Віддалений режим: де знаходиться сховище сесій?">
    Станом session володіє **gateway host**. Якщо ви працюєте у віддаленому режимі, потрібне вам сховище сесій знаходиться на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="Який формат конфігурації? Де вона знаходиться?">
    OpenClaw читає необов’язкову конфігурацію **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються доволі безпечні значення за замовчуванням (включно з workspace за замовчуванням `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я встановив(ла) gateway.bind: "lan" (або "tailnet"), і тепер ніщо не слухає / UI каже unauthorized'>
    Bind-и без loopback **вимагають валідного шляху auth для gateway**. На практиці це означає:

    - auth через shared secret: токен або пароль
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

    - `gateway.remote.token` / `.password` самі по собі **не** вмикають auth локального gateway.
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як fallback лише коли `gateway.auth.*` не задано.
    - Для auth через пароль замість цього встановіть `gateway.auth.mode: "password"` плюс `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і його неможливо визначити, визначення завершується fail closed (без маскування через remote fallback).
    - Налаштування shared-secret у Control UI автентифікуються через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях app/UI). Режими з ідентичністю, як-от Tailscale Serve або `trusted-proxy`, натомість використовують заголовки запиту. Уникайте розміщення shared secrets у URL.
    - З `gateway.auth.mode: "trusted-proxy"` same-host reverse proxy через loopback все одно **не** задовольняє auth trusted-proxy. Trusted proxy має бути налаштованим джерелом без loopback.

  </Accordion>

  <Accordion title="Чому тепер мені потрібен токен на localhost?">
    OpenClaw примусово вимагає auth для gateway за замовчуванням, включно з loopback. У звичайному сценарії за замовчуванням це означає auth через токен: якщо не налаштовано явний шлях auth, запуск gateway переходить у режим токена і автоматично генерує його, зберігаючи в `gateway.auth.token`, тому **локальні WS-клієнти мають автентифікуватися**. Це блокує інші локальні процеси від виклику Gateway.

    Якщо ви віддаєте перевагу іншому шляху auth, ви можете явно вибрати режим пароля (або, для identity-aware reverse proxy без loopback, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно встановіть `gateway.auth.mode: "none"` у своїй config. Doctor може згенерувати токен у будь-який момент: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи треба перезапускати після зміни конфігурації?">
    Gateway стежить за config і підтримує hot-reload:

    - `gateway.reload.mode: "hybrid"` (за замовчуванням): безпечні зміни застосовуються hot, критичні — через перезапуск
    - також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні слогани CLI?">
    Встановіть `cli.banner.taglineMode` у config:

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: приховує текст слогана, але зберігає рядок із назвою/версією banner.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: змінні кумедні/сезонні слогани (поведінка за замовчуванням).
    - Якщо ви не хочете banner взагалі, встановіть env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути web search (і web fetch)?">
    `web_fetch` працює без API-ключа. `web_search` залежить від вибраного
    провайдера:

    - Провайдери з API, такі як Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, потребують звичайного налаштування API-ключа.
    - Ollama Web Search не потребує ключа, але використовує налаштований host Ollama і вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна інтеграція на основі HTML.
    - SearXNG не потребує ключа / може бути self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Рекомендовано:** виконайте `openclaw configure --section web` і виберіть провайдера.
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

    Специфічна для провайдера конфігурація web-search тепер живе в `plugins.entries.<plugin>.config.webSearch.*`.
    Legacy-шляхи провайдера `tools.web.search.*` все ще тимчасово завантажуються для сумісності, але їх не слід використовувати в нових config.
    Конфігурація fallback для web-fetch Firecrawl живе в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlist, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнено за замовчуванням (якщо його явно не вимкнено).
    - Якщо `tools.web.fetch.provider` пропущено, OpenClaw автоматично визначає першого готового fallback-провайдера fetch на основі доступних credentials. Зараз bundled-провайдер — це Firecrawl.
    - Демони читають env vars із `~/.openclaw/.env` (або з environment сервісу).

    Документація: [Web tools](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мою конфігурацію. Як відновити і як цього уникнути?">
    `config.apply` замінює **всю конфігурацію повністю**. Якщо ви надсилаєте частковий об’єкт, усе
    інше видаляється.

    Відновлення:

    - Відновіть із резервної копії (git або скопійований `~/.openclaw/openclaw.json`).
    - Якщо резервної копії немає, знову запустіть `openclaw doctor` і переналаштуйте channels/models.
    - Якщо це сталося неочікувано, створіть bug-report і додайте вашу останню відому config або будь-яку резервну копію.
    - Локальний coding agent часто може відновити робочу config з логів або history.

    Як уникнути:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Використовуйте `config.schema.lookup` спочатку, коли не впевнені в точному path або формі поля; він повертає вузол shallow schema плюс короткі підсумки безпосередніх дочірніх елементів для подальшого заглиблення.
    - Використовуйте `config.patch` для часткових RPC-редагувань; залишайте `config.apply` лише для повної заміни config.
    - Якщо ви використовуєте owner-only інструмент `gateway` із запуску agent, він усе одно відхилятиме записи в `tools.exec.ask` / `tools.exec.security` (включно з legacy-аліасами `tools.bash.*`, які нормалізуються до тих самих захищених exec-шляхів).

    Документація: [Config](/cli/config), [Configure](/cli/configure), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими workers на різних пристроях?">
    Поширений шаблон — **один Gateway** (наприклад, Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** володіє channels (Signal/WhatsApp), routing і sessions.
    - **Nodes (пристрої):** Macs/iOS/Android підключаються як периферія й відкривають локальні tools (`system.run`, `canvas`, `camera`).
    - **Agents (workers):** окремі мозки/workspaces для спеціальних ролей (наприклад, "Hetzner ops", "Personal data").
    - **Sub-agents:** породжують фонову роботу з main agent, коли потрібен паралелізм.
    - **TUI:** підключається до Gateway і перемикає agents/sessions.

    Документація: [Nodes](/uk/nodes), [Віддалений доступ](/uk/gateway/remote), [Multi-Agent Routing](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Чи може браузер OpenClaw працювати headless?">
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

    За замовчуванням `false` (із вікном). Headless частіше викликає anti-bot перевірки на деяких сайтах. Див. [Браузер](/uk/tools/browser).

    Headless використовує **той самий Chromium engine** і працює для більшості automation-сценаріїв (форми, кліки, scraping, logins). Основні відмінності:

    - Немає видимого вікна браузера (використовуйте скриншоти, якщо вам потрібні візуальні підтвердження).
    - Деякі сайти суворіше ставляться до automation у headless-режимі (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує headless sessions.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Встановіть `browser.executablePath` на ваш бінарник Brave (або будь-який браузер на базі Chromium) і перезапустіть Gateway.
    Повні приклади конфігурації див. у [Браузер](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway і nodes

<AccordionGroup>
  <Accordion title="Як команди проходять між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає agent і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен node tool:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідний трафік провайдерів; вони отримують лише виклики node RPC.

  </Accordion>

  <Accordion title="Як мій agent може отримати доступ до мого комп’ютера, якщо Gateway хоститься віддалено?">
    Коротка відповідь: **підключіть свій комп’ютер як node**. Gateway працює деінде, але він може
    викликати інструменти `node.*` (screen, camera, system) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на host, який завжди увімкнений (VPS/home server).
    2. Додайте Gateway host і ваш комп’ютер в один tailnet.
    3. Переконайтеся, що Gateway WS доступний (bind tailnet або SSH tunnel).
    4. Відкрийте macOS-app локально і підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб вона могла зареєструватися як node.
    5. Підтвердьте node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP-bridge не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування щодо безпеки: підключення macOS node дозволяє `system.run` на цій машині. Підключайте
    лише пристрої, яким довіряєте, і перегляньте [Безпека](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Протокол Gateway](/uk/gateway/protocol), [віддалений режим macOS](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключено, але я не отримую відповідей. Що тепер?">
    Перевірте базові речі:

    - Gateway працює: `openclaw gateway status`
    - Health Gateway: `openclaw status`
    - Health каналів: `openclaw channels status`

    Потім перевірте auth і routing:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` налаштовано правильно.
    - Якщо підключаєтеся через SSH tunnel, підтвердьте, що локальний tunnel активний і вказує на правильний порт.
    - Підтвердьте, що ваші allowlist-и (DM або group) включають ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Канали](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два екземпляри OpenClaw спілкуватися між собою (локальний + VPS)?">
    Так. Вбудованого bridge "bot-to-bot" немає, але це можна з’єднати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний chat-канал, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надсилає повідомлення Bot B, а далі Bot B відповідає як зазвичай.

    **CLI bridge (універсально):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючись на чат, де інший бот
    слухає. Якщо один бот працює на віддаленому VPS, націльте ваш CLI на той віддалений Gateway
    через SSH/Tailscale (див. [Віддалений доступ](/uk/gateway/remote)).

    Приклад шаблону (запускайте на машині, яка може дістатися до цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте запобіжник, щоб два боти не зациклилися безкінечно (лише згадування, channel
    allowlists або правило "не відповідати на повідомлення ботів").

    Документація: [Віддалений доступ](/uk/gateway/remote), [Agent CLI](/cli/agent), [Agent send](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох agents?">
    Ні. Один Gateway може хостити кілька agents, кожен із власним workspace, моделями за замовчуванням
    і routing. Це стандартне налаштування, і воно значно дешевше та простіше, ніж запускати
    один VPS на agent.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні config, якими ви не хочете ділитися. Інакше тримайте один Gateway і
    використовуйте кілька agents або sub-agents.

  </Accordion>

  <Accordion title="Чи є сенс використовувати node на моєму особистому ноутбуці замість SSH із VPS?">
    Так — nodes є first-class способом доступу до вашого ноутбука з віддаленого Gateway, і вони
    дають більше, ніж просто доступ до shell. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (достатньо невеликого VPS або box рівня Raspberry Pi; 4 GB RAM більш ніж достатньо), тому поширене
    налаштування — це host, який завжди увімкнений, плюс ваш ноутбук як node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують pairing пристрою.
    - **Безпечніший контроль виконання.** `system.run` контролюється allowlist-ами/approval на node на цьому ноутбуці.
    - **Більше інструментів пристрою.** Nodes відкривають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна автоматизація браузера.** Тримайте Gateway на VPS, але запускайте Chrome локально через node host на ноутбуці або під’єднуйтеся до локального Chrome на host через Chrome MCP.

    SSH підходить для епізодичного доступу до shell, але nodes простіші для постійних workflow агентів і
    автоматизації пристроїв.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes сервіс gateway?">
    Ні. Лише **один gateway** має працювати на host, якщо тільки ви навмисно не запускаєте ізольовані profiles (див. [Кілька gateway](/uk/gateway/multiple-gateways)). Nodes — це периферія, яка підключається
    до gateway (nodes iOS/Android, або macOS "node mode" у menubar app). Для headless node
    hosts і керування через CLI див. [Node host CLI](/cli/node).

    Повний перезапуск потрібен для змін `gateway`, `discovery` і `canvasHost`.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати конфігурацію?">
    Так.

    - `config.schema.lookup`: перевірити одне піддерево config разом із його вузлом shallow schema, відповідною UI-підказкою та короткими підсумками безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний snapshot + hash
    - `config.patch`: безпечне часткове оновлення (рекомендовано для більшості RPC-редагувань)
    - `config.apply`: перевірити + повністю замінити config, потім перезапустити
    - Owner-only runtime tool `gateway` і далі відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; legacy-аліаси `tools.bash.*` нормалізуються до тих самих захищених exec-шляхів

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

    1. **Встановити + увійти на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Встановити + увійти на Mac**
       - Використайте застосунок Tailscale і ввійдіть у той самий tailnet.
    3. **Увімкнути MagicDNS (рекомендовано)**
       - У консолі адміністратора Tailscale увімкніть MagicDNS, щоб VPS мав стабільне ім’я.
    4. **Використовувати hostname tailnet**
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

    1. **Переконайтеся, що VPS + Mac перебувають в одному tailnet**.
    2. **Використовуйте macOS-app у Remote mode** (SSH target може бути hostname tailnet).
       App зробить tunnel порту Gateway і підключиться як node.
    3. **Підтвердьте node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Протокол Gateway](/uk/gateway/protocol), [Виявлення](/uk/gateway/discovery), [віддалений режим macOS](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи краще встановити на другий ноутбук, чи просто додати node?">
    Якщо вам потрібні лише **локальні tools** (screen/camera/exec) на другому ноутбуці, додайте його як
    **node**. Це дозволяє залишити один Gateway і уникнути дублювання config. Локальні node tools
    наразі доступні лише на macOS, але ми плануємо поширити їх і на інші ОС.

    Встановлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [Nodes CLI](/cli/nodes), [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars і завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує environment variables?">
    OpenClaw читає env vars із батьківського процесу (shell, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` із поточного робочого каталогу
    - глобальний fallback `.env` із `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден із `.env` файлів не перевизначає вже наявні env vars.

    Ви також можете визначити inline env vars у config (застосовуються лише якщо відсутні в process env):

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

  <Accordion title="Я запустив(ла) Gateway через сервіс, і мої env vars зникли. Що тепер?">
    Два поширені виправлення:

    1. Помістіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися, навіть коли сервіс не успадковує env вашої shell.
    2. Увімкніть імпорт shell env (зручно, але лише за бажанням):

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

    Це запускає вашу login shell і імпортує лише відсутні очікувані ключі (ніколи не перевизначає). Еквіваленти env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я встановив(ла) COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` повідомляє, чи увімкнено **імпорт shell env**. "Shell env: off"
    **не** означає, що env vars відсутні — це лише означає, що OpenClaw не завантажуватиме
    вашу login shell автоматично.

    Якщо Gateway працює як сервіс (launchd/systemd), він не успадковує ваше shell
    environment. Виправлення: зробіть одне з цього:

    1. Помістіть токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або увімкніть імпорт shell (`env.shellEnv.enabled: true`).
    3. Або додайте його до блоку `env` у config (застосовується лише якщо відсутній).

    Потім перезапустіть gateway і перевірте знову:

    ```bash
    openclaw models status
    ```

    Copilot-токени читаються з `COPILOT_GITHUB_TOKEN` (також `GH_TOKEN` / `GITHUB_TOKEN`).
    Див. [/concepts/model-providers](/uk/concepts/model-providers) і [/environment](/uk/help/environment).

  </Accordion>
</AccordionGroup>

## Сесії та кілька чатів

<AccordionGroup>
  <Accordion title="Як почати нову розмову?">
    Надішліть `/new` або `/reset` окремим повідомленням. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>

  <Accordion title="Чи сесії скидаються автоматично, якщо я ніколи не надсилаю /new?">
    Сесії можуть завершуватися після `session.idleMinutes`, але це **вимкнено за замовчуванням** (типово **0**).
    Встановіть додатне значення, щоб увімкнути завершення через простій. Коли це увімкнено, **наступне**
    повідомлення після періоду простою створює новий session id для цього ключа чату.
    Це не видаляє транскрипти — лише починає нову session.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб зробити команду з екземплярів OpenClaw (один CEO і багато агентів)?">
    Так, через **multi-agent routing** і **sub-agents**. Ви можете створити одного координатора
    agent і кількох робочих agents із власними workspaces і моделями.

    Водночас це краще сприймати як **цікавий експеримент**. Це витрачає багато токенів і часто
    менш ефективно, ніж використання одного бота з окремими сесіями. Типова модель, яку ми
    уявляємо, — один бот, з яким ви говорите, але з різними сесіями для паралельної роботи. Цей
    бот також може породжувати sub-agents за потреби.

    Документація: [Multi-agent routing](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [Agents CLI](/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст обрізався посеред задачі? Як цьому запобігти?">
    Контекст сесії обмежений вікном моделі. Довгі чати, великі виводи tools або багато
    файлів можуть викликати compaction або truncation.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими задачами і `/new` під час зміни тем.
    - Тримайте важливий context у workspace і просіть бота перечитати його.
    - Використовуйте sub-agents для довгих або паралельних робіт, щоб основний чат лишався меншим.
    - Обирайте модель із більшим вікном контексту, якщо це трапляється часто.

  </Accordion>

  <Accordion title="Як повністю скинути OpenClaw, але залишити його встановленим?">
    Використовуйте команду reset:

    ```bash
    openclaw reset
    ```

    Неінтерактивне повне скидання:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Потім заново запустіть налаштування:

    ```bash
    openclaw onboard --install-daemon
    ```

    Примітки:

    - Onboarding також пропонує **Reset**, якщо бачить наявну config. Див. [Onboarding (CLI)](/uk/start/wizard).
    - Якщо ви використовували profiles (`--profile` / `OPENCLAW_PROFILE`), скидайте кожен каталог state окремо (типово це `~/.openclaw-<profile>`).
    - Dev reset: `openclaw gateway --dev --reset` (лише для dev; стирає dev config + credentials + sessions + workspace).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або стиснути?'>
    Використайте один із варіантів:

    - **Стиснення** (зберігає розмову, але підсумовує старіші ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб спрямувати підсумок.

    - **Скидання** (новий session ID для того самого ключа чату):

      ```
      /new
      /reset
      ```

    Якщо це повторюється:

    - Увімкніть або налаштуйте **обрізання сесій** (`agents.defaults.contextPruning`) для підрізання старого виводу tools.
    - Використовуйте модель із більшим вікном контексту.

    Документація: [Compaction](/uk/concepts/compaction), [Обрізання сесій](/uk/concepts/session-pruning), [Керування сесіями](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка валідації провайдера: модель видала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що history сесії застаріла або пошкоджена (часто після довгих thread-ів
    або зміни tool/schema).

    Виправлення: почніть нову session через `/new` (окремим повідомленням).

  </Accordion>

  <Accordion title="Чому я отримую heartbeat-повідомлення кожні 30 хвилин?">
    За замовчуванням heartbeats запускаються кожні **30m** (**1h** у разі використання OAuth auth). Налаштуйте або вимкніть їх:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    Якщо `HEARTBEAT.md` існує, але фактично порожній (лише пусті рядки й markdown-заголовки
    на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб зекономити API-виклики.
    Якщо файл відсутній, heartbeat усе одно запускається, а модель сама вирішує, що робити.

    Override-и для окремих agents використовують `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "bot account" до групи WhatsApp?'>
    Ні. OpenClaw працює з **вашим власним обліковим записом**, тож якщо ви є в групі, OpenClaw може її бачити.
    За замовчуванням відповіді в групах заблоковані, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

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
    Варіант 1 (найшвидший): переглядайте логи й надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Шукайте `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/є в allowlist): перелічіть групи з config:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/cli/directory), [Логи](/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Дві типові причини:

    - Увімкнено gating за згадкою (за замовчуванням). Ви повинні @згадати бота (або відповідати `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і група не входить до allowlist.

    Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи ділять групи/thread-и контекст із DM?">
    Direct-чати за замовчуванням згортаються до main session. Groups/channels мають власні session keys, а теми Telegram / thread-и Discord — це окремі sessions. Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки workspaces і agents я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але слідкуйте за:

    - **Зростанням диска:** sessions + transcripts живуть у `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартістю токенів:** більше agents означає більше одночасного використання моделей.
    - **Операційними накладними витратами:** auth profiles, workspaces і channel routing на рівні agent.

    Поради:

    - Тримайте один **активний** workspace на agent (`agents.defaults.workspace`).
    - Очищайте старі sessions (видаляйте JSONL або записи зі сховища), якщо диск розростається.
    - Використовуйте `openclaw doctor`, щоб знаходити зайві workspaces і невідповідності profiles.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька ботів або чатів одночасно (Slack), і як це краще налаштувати?">
    Так. Використовуйте **Multi-Agent Routing**, щоб запускати кілька ізольованих agents і маршрутизувати вхідні повідомлення за
    channel/account/peer. Slack підтримується як канал і може бути прив’язаний до конкретних agents.

    Доступ до браузера потужний, але це не "може все, що може людина" — anti-bot, CAPTCHA та MFA все
    ще можуть блокувати automation. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на host,
    або CDP на машині, яка фактично запускає браузер.

    Найкраща практика налаштування:

    - Host Gateway, який завжди увімкнений (VPS/Mac mini).
    - Один agent на роль (bindings).
    - Канал(и) Slack, прив’язані до цих agents.
    - Локальний браузер через Chrome MCP або node за потреби.

    Документація: [Multi-Agent Routing](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Браузер](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: значення за замовчуванням, вибір, аліаси, перемикання

<AccordionGroup>
  <Accordion title='Що таке "default model"?'>
    Модель OpenClaw за замовчуванням — це те, що ви встановили в:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються як `provider/model` (приклад: `openai/gpt-5.4`). Якщо ви пропускаєте провайдера, OpenClaw спочатку пробує alias, потім — унікальний збіг налаштованого provider для цього точного model id, і лише після цього відступає до налаштованого провайдера за замовчуванням як до застарілого compatibility-path. Якщо цей provider більше не відкриває налаштовану default model, OpenClaw відступає до першого налаштованого provider/model замість того, щоб показувати застаріле default від видаленого provider. Однак вам усе одно слід **явно** встановлювати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендовано за замовчуванням:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для агентів із tools або недовіреним вводом:** віддавайте перевагу силі моделі над вартістю.
    **Для рутинного/низькоризикового чату:** використовуйте дешевші fallback-моделі й маршрутизуйте за роллю agent.

    Для MiniMax є окрема документація: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Загальне правило: використовуйте **найкращу модель, яку можете собі дозволити** для високоризикової роботи, а дешевшу
    модель — для рутинного чату або підсумків. Ви можете маршрутизувати моделі по agents і використовувати sub-agents для
    паралелізації довгих задач (кожен sub-agent споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Sub-agents](/uk/tools/subagents).

    Сильне попередження: слабші/надто квантовані моделі вразливіші до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі, не стираючи конфігурацію?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни config.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для однієї session)
    - `openclaw models set ...` (оновлює лише config моделі)
    - `openclaw configure --section model` (інтерактивно)
    - редагування `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` із частковим об’єктом, якщо ви не маєте наміру замінити всю config.
    Для RPC-редагувань спочатку перевіряйте через `config.schema.lookup` і віддавайте перевагу `config.patch`. Payload lookup дає нормалізований path, документи/обмеження shallow schema та короткі підсумки безпосередніх дочірніх елементів.
    для часткових оновлень.
    Якщо ви таки перезаписали config, відновіть її з резервної копії або повторно запустіть `openclaw doctor` для виправлення.

    Документація: [Моделі](/uk/concepts/models), [Configure](/cli/configure), [Config](/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати self-hosted моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях до локальних моделей.

    Найшвидше налаштування:

    1. Встановіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull glm-4.7-flash`
    3. Якщо вам потрібні також cloud-моделі, виконайте `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає вам cloud-моделі плюс ваші локальні моделі Ollama
    - cloud-моделі, як-от `kimi-k2.5:cloud`, не потребують локального pull
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка з безпеки: менші або сильно квантовані моделі вразливіші до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати tools.
    Якщо ви все ж хочете малі моделі, увімк