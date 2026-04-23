---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час виконання
    - Первинне опрацювання повідомлених користувачами проблем перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: Часті запитання
x-i18n:
    generated_at: "2026-04-23T19:25:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e80ee4444c0bf72ecabe248fdacb9f1f8ee64db46189e37a898a9a1242185f75
    source_path: help/faq.md
    workflow: 15
---

# Часті запитання

Швидкі відповіді та глибше усунення несправностей для реальних середовищ (локальна розробка, VPS, multi-agent, OAuth/API keys, failover моделей). Для діагностики під час виконання див. [Усунення несправностей](/uk/gateway/troubleshooting). Для повного довідника з конфігурації див. [Конфігурація](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламалося

1. **Швидкий стан (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидкий локальний підсумок: ОС + оновлення, доступність gateway/service, agents/sessions, конфігурація provider + проблеми під час виконання (коли gateway доступний).

2. **Звіт, який можна вставити (безпечний для поширення)**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з хвостом журналу (токени приховано).

3. **Стан daemon + port**

   ```bash
   openclaw gateway status
   ```

   Показує runtime supervisor порівняно з доступністю RPC, цільовий URL probe і те, яку конфігурацію service, ймовірно, використовував.

4. **Глибокі probe**

   ```bash
   openclaw status --deep
   ```

   Виконує live-probe стану gateway, включно з probe каналів, коли це підтримується
   (потребує доступного gateway). Див. [Health](/uk/gateway/health).

5. **Перегляньте останній журнал у реальному часі**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використайте запасний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові журнали відокремлені від журналів service; див. [Журналювання](/uk/logging) і [Усунення несправностей](/uk/gateway/troubleshooting).

6. **Запустіть doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує конфігурацію/стан + виконує перевірки працездатності. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Запитує у запущеного gateway повний знімок (лише WS). Див. [Health](/uk/gateway/health).

## Швидкий старт і початкове налаштування

<AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб розблокуватися">
    Використовуйте локального AI-агента, який може **бачити вашу машину**. Це набагато ефективніше, ніж звертатися
    в Discord, тому що більшість випадків «я застряг» — це **локальні проблеми конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти журнали та допомагати виправляти
    налаштування на рівні машини (PATH, services, permissions, auth files). Надайте їм **повну копію вихідного коду**
    через встановлення hackable (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **із git checkout**, тож агент може читати код і документацію та
    аналізувати точну версію, яку ви використовуєте. Ви завжди можете повернутися до стабільної версії пізніше,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й контролювати** виправлення (крок за кроком), а потім виконати лише
    необхідні команди. Це робить зміни невеликими та полегшує їх аудит.

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

    - `openclaw status`: швидкий знімок стану gateway/agent + базової конфігурації.
    - `openclaw models status`: перевіряє автентифікацію provider і доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє типові проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламалося](#first-60-seconds-if-something-is-broken).
    Документація зі встановлення: [Install](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускає. Що означають причини пропуску?">
    Поширені причини пропуску heartbeat:

    - `quiet-hours`: поза межами налаштованого вікна активних годин
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожній/каркасний вміст із заголовками
    - `no-tasks-due`: активний режим завдань `HEARTBEAT.md`, але час жодного з інтервалів завдань ще не настав
    - `alerts-disabled`: всю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові позначки настання виконання зсуваються лише після завершення реального запуску heartbeat.
    Пропущені запуски не позначають завдання як виконані.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація й завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановлення та налаштування OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання онбордингу:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати ресурси UI. Після онбордингу Gateway зазвичай працює на порту **18789**.

    Із вихідного коду (для контриб’юторів/розробників):

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
    Майстер відкриває ваш браузер із чистим URL dashboard (без токена) одразу після онбордингу, а також виводить посилання в підсумку. Залиште цю вкладку відкритою; якщо вона не запустилася, скопіюйте/вставте виведений URL на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується автентифікація спільним секретом, вставте налаштований токен або пароль у параметрах Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо спільний секрет ще не налаштовано, згенеруйте токен за допомогою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште loopback bind, виконайте `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставлення спільного секрету, передбачається довірений хост gateway); API HTTP усе ще вимагають автентифікації спільним секретом, якщо ви свідомо не використовуєте private-ingress `none` або HTTP-автентифікацію trusted-proxy.
      Некоректні одночасні спроби автентифікації Serve від того самого клієнта серіалізуються до того, як обмежувач невдалих автентифікацій зафіксує їх, тож друга невдала повторна спроба вже може показувати `retry later`.
    - **Tailnet bind**: виконайте `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний спільний секрет у параметрах dashboard.
    - **Identity-aware reverse proxy**: тримайте Gateway за trusted proxy без loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL proxy.
    - **SSH tunnel**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`. Автентифікація спільним секретом усе ще застосовується через tunnel; за потреби вставте налаштований токен або пароль.

    Див. [Dashboard](/uk/web/dashboard) і [Web surfaces](/uk/web) для подробиць про режими bind та автентифікацію.

  </Accordion>

  <Accordion title="Чому існують дві конфігурації підтвердження exec для погоджень у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на погодження до чат-призначень
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом погодження для exec approvals

    Політика host exec усе ще є справжнім механізмом погодження. Конфігурація чату лише визначає, де з’являються
    запити на погодження та як люди можуть на них відповідати.

    У більшості середовищ вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди та відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначати тих, хто погоджує, OpenClaw тепер автоматично вмикає нативні погодження DM-first, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки погодження, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve` лише тоді, коли результат інструмента каже, що погодження через чат недоступні або ручне погодження є єдиним шляхом.
    - Використовуйте `approvals.exec` лише тоді, коли запити також потрібно пересилати в інші чати або явні кімнати ops.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише тоді, коли ви явно хочете, щоб запити на погодження публікувалися назад у вихідну кімнату/тему.
    - Погодження Plugin — окрема історія: вони типово використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали додатково підтримують нативну обробку plugin-approval.

    Коротко: пересилання — для маршрутизації, конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке runtime потрібне?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендовано** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легкий — у документації вказано, що для особистого використання достатньо **512MB-1GB RAM**, **1 core** і приблизно **500MB**
    дискового простору, а також зазначено, що **Raspberry Pi 4 може його запускати**.

    Якщо вам потрібен додатковий запас (журнали, медіа, інші services), **рекомендовано 2GB**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може розміщувати Gateway, а ви можете під’єднати **Node-и** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Node-и](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради щодо встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте певних шорсткостей.

    - Використовуйте **64-bit** ОС і Node >= 22.
    - Надавайте перевагу встановленню **hackable (git)**, щоб мати доступ до журналів і швидко оновлюватися.
    - Починайте без каналів/Skills, а потім додавайте їх по одному.
    - Якщо ви натрапляєте на дивні проблеми з бінарними файлами, зазвичай це проблема **сумісності ARM**.

    Документація: [Linux](/uk/platforms/linux), [Install](/uk/install).

  </Accordion>

  <Accordion title="Застрягає на wake up my friend / onboarding не запускається. Що робити?">
    Цей екран залежить від доступності та автентифікації Gateway. TUI також надсилає
    "Wake up, my friend!" автоматично під час першого запуску. Якщо ви бачите цей рядок **без відповіді**
    і токени залишаються на 0, агент так і не запустився.

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

    Якщо Gateway віддалений, переконайтеся, що з’єднання tunnel/Tailscale активне і що UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє середовище на нову машину (Mac mini), не проходячи онбординг заново?">
    Так. Скопіюйте **каталог стану** і **робочий простір**, а потім один раз запустіть Doctor. Це
    збереже вашого бота «точно таким самим» (пам’ять, історію сесій, автентифікацію та
    стан каналу), якщо ви скопіюєте **обидва** розташування:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій робочий простір (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть service Gateway.

    Це зберігає конфігурацію, профілі автентифікації, облікові дані WhatsApp, сесії та пам’ять. Якщо ви в
    віддаленому режимі, пам’ятайте, що хост gateway володіє сховищем сесій і робочим простором.

    **Важливо:** якщо ви лише commit/push свій робочий простір у GitHub, ви створюєте резервну
    копію **пам’яті + bootstrap-файлів**, але **не** історії сесій чи автентифікації. Вони містяться
    в `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Міграція](/uk/install/migrating), [Де що зберігається на диску](#where-things-live-on-disk),
    [Робочий простір агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи розташовані вгорі. Якщо верхній розділ позначено як **Unreleased**, наступний датований
    розділ — це остання випущена версія. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (а також за розділами документації/іншими за потреби).

  </Accordion>

  <Accordion title="Не вдається отримати доступ до docs.openclaw.ai (помилка SSL)">
    Деякі з’єднання Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до allowlist, а потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати сайт, повідомивши про це тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркалюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable-реліз спочатку потрапляє в **beta**, а потім окремий
    крок просування переміщує цю саму версію в `latest`. За потреби мейнтейнери також можуть
    публікувати одразу в `latest`. Саме тому beta і stable після просування можуть
    вказувати на **одну й ту саму версію**.

    Подивитися, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Для однорядкових команд встановлення та пояснення різниці між beta і dev див. accordion нижче.

  </Accordion>

  <Accordion title="Як установити beta-версію і в чому різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (після просування може збігатися з `latest`).
    **Dev** — це рухома вершина `main` (git); коли публікується, використовує npm dist-tag `dev`.

    Однорядкові команди (macOS/Linux):

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Інсталятор для Windows (PowerShell):
    [https://openclaw.ai/install.ps1](https://openclaw.ai/install.ps1)

    Детальніше: [Канали розробки](/uk/install/development-channels) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як спробувати найновіші збірки?">
    Є два варіанти:

    1. **Канал dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає на гілку `main` і оновлює з вихідного коду.

    2. **Hackable-встановлення (із сайту інсталятора):**

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

  <Accordion title="Скільки зазвичай тривають встановлення та онбординг?">
    Орієнтовно:

    - **Встановлення:** 2–5 хвилин
    - **Онбординг:** 5–15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо процес зависає, див. [Інсталятор завис?](#quick-start-and-first-run-setup)
    і швидкий цикл налагодження в [Я застряг](#quick-start-and-first-run-setup).

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

  <Accordion title="Під час встановлення у Windows пише git not found або openclaw not recognized">
    Дві поширені проблеми Windows:

    **1) помилка npm spawn git / git not found**

    - Установіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, а потім повторно запустіть інсталятор.

    **2) після встановлення `openclaw is not recognized`**

    - Глобальна папка bin npm відсутня у PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до свого PATH користувача (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Після оновлення PATH закрийте й знову відкрийте PowerShell.

    Якщо ви хочете найгладкіше середовище на Windows, використовуйте **WSL2** замість нативного Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У Windows вивід exec показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність кодової сторінки консолі в нативних оболонках Windows.

    Симптоми:

    - вивід `system.run`/`exec` показує китайський текст як mojibake
    - та сама команда має нормальний вигляд в іншому профілі термінала

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

    Якщо проблема все ще відтворюється в останній версії OpenClaw, відстежуйте/повідомте про неї тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використовуйте **hackable-встановлення (git)**, щоб мати повний вихідний код і документацію локально, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг прочитати репозиторій і відповісти точно.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Детальніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як встановити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтесь інструкції для Linux, а потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення service: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення й оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як установити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Установіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де знайти інструкції зі встановлення в хмарі/на VPS?">
    Ми підтримуємо **хаб хостингу** з найпоширенішими провайдерами. Виберіть потрібного й дотримуйтесь посібника:

    - [Хостинг VPS](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви звертаєтеся до нього
    з ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан і робочий простір
    живуть на сервері, тож вважайте хост джерелом істини й створюйте його резервні копії.

    Ви можете під’єднати **Node-и** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримати доступ до
    локального екрана/камери/canvas або виконувати команди на своєму ноутбуці, зберігаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Node-и: [Node-и](/uk/nodes), [CLI Node-ів](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити самого себе?">
    Коротка відповідь: **можливо, але не рекомендовано**. Процес оновлення може перезапустити
    Gateway (що обриває активну сесію), може потребувати чистого git checkout і
    може запросити підтвердження. Безпечніше запускати оновлення з оболонки як оператор.

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
    `openclaw onboard` — це рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth provider, API keys, Anthropic setup-token, а також варіанти локальних моделей, як-от LM Studio)
    - Розташування **робочого простору** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані channel plugins, як-от QQ Bot)
    - **Встановлення daemon** (LaunchAgent на macOS; systemd user unit на Linux/WSL2)
    - **Перевірки працездатності** та вибір **Skills**

    Він також попереджає, якщо ваша налаштована модель невідома або для неї відсутня автентифікація.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw з **API keys** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації в цих provider.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **Anthropic API key**: звичайна оплата Anthropic API
    - **Автентифікація Claude CLI / Claude subscription в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw вважає використання `claude -p`
      санкціонованим для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway Anthropic API keys усе ще є більш
    передбачуваним налаштуванням. OpenAI Codex OAuth явно підтримується для зовнішніх
    інструментів на кшталт OpenClaw.

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

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
    OpenClaw вважає автентифікацію через підписку Claude і використання `claude -p` санкціонованими
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо вам потрібне
    найпередбачуваніше серверне налаштування, використовуйте натомість Anthropic API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тому OpenClaw вважає
    повторне використання Claude CLI та використання `claude -p` санкціонованими для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Anthropic setup-token усе ще доступний як підтримуваний шлях токена в OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI та `claude -p`, коли це доступно.
    Для production або multi-user навантажень автентифікація через Anthropic API key усе ще є
    безпечнішим і більш передбачуваним вибором. Якщо вас цікавлять інші розміщені
    варіанти у стилі підписки в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) та [GLM
    Models](/uk/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
    Це означає, що вашу **квоту/ліміт швидкості Anthropic** вичерпано для поточного вікна. Якщо ви
    використовуєте **Claude CLI**, дочекайтеся скидання вікна або оновіть свій тариф. Якщо ви
    використовуєте **Anthropic API key**, перевірте Anthropic Console
    на предмет використання/білінгу та за потреби підвищте ліміти.

    Якщо повідомлення має такий конкретний вигляд:
    `Extra usage is required for long context requests`, запит намагається використовувати
    1M context beta від Anthropic (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані мають право на білінг довгого контексту (білінг API key або
    шлях входу Claude OpenClaw з увімкненим Extra Usage).

    Порада: налаштуйте **fallback model**, щоб OpenClaw міг і далі відповідати, поки provider обмежений за rate limit.
    Див. [Models](/uk/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудований provider **Amazon Bedrock (Converse)**. За наявності маркерів середовища AWS OpenClaw може автоматично виявити потоковий/текстовий каталог Bedrock і об’єднати його як неявний provider `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис manual provider. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Model providers](/uk/providers/models). Якщо ви віддаєте перевагу керованому шляху з ключем, OpenAI-сумісний proxy перед Bedrock також залишається коректним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Онбординг може виконати OAuth flow і встановить типову модель на `openai-codex/gpt-5.5`, коли це доречно. Див. [Model providers](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому ChatGPT GPT-5.5 не розблоковує openai/gpt-5.5 в OpenClaw?">
    OpenClaw розглядає ці два шляхи окремо:

    - `openai-codex/gpt-5.5` = OAuth ChatGPT/Codex
    - `openai/gpt-5.5` = прямий OpenAI Platform API

    В OpenClaw вхід через ChatGPT/Codex під’єднано до маршруту `openai-codex/*`,
    а не до прямого маршруту `openai/*`. Якщо вам потрібен прямий шлях API в
    OpenClaw, установіть `OPENAI_API_KEY` (або еквівалентну конфігурацію provider OpenAI).
    Якщо вам потрібен вхід через ChatGPT/Codex в OpenClaw, використовуйте `openai-codex/*`.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    `openai-codex/*` використовує маршрут Codex OAuth, а його доступні вікна квоти
    керуються OpenAI і залежать від тарифу. На практиці ці ліміти можуть відрізнятися від
    досвіду на сайті/в застосунку ChatGPT, навіть якщо обидва прив’язані до того самого облікового запису.

    OpenClaw може показувати поточні видимі вікна використання/квоти provider у
    `openclaw models status`, але не вигадує й не нормалізує права ChatGPT web
    у прямий доступ до API. Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API key.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth підписки OpenAI Code (Codex)**.
    OpenAI прямо дозволяє використання OAuth підписки у зовнішніх інструментах/робочих процесах
    на кшталт OpenClaw. Онбординг може виконати OAuth flow за вас.

    Див. [OAuth](/uk/concepts/oauth), [Model providers](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **Plugin auth flow**, а не client id чи secret у `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Типова модель після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не вдаються, установіть `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає OAuth tokens у профілях автентифікації на хості gateway. Докладніше: [Model providers](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; малі картки обрізають і допускають витоки. Якщо вам це все ж потрібно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як зберегти трафік до розміщеної моделі в конкретному регіоні?">
    Вибирайте endpoint-и, прив’язані до регіону. OpenRouter надає варіанти з розміщенням у США для MiniMax, Kimi і GLM; вибирайте варіант із розміщенням у США, щоб дані залишалися в регіоні. Ви все одно можете вказувати Anthropic/OpenAI поряд із ними, використовуючи `models.mode: "merge"`, щоб fallback лишалися доступними, водночас дотримуючись вибраного вами provider із потрібним регіоном.
  </Accordion>

  <Accordion title="Чи треба купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini — необов’язковий варіант: деякі люди
    купують його як хост, що завжди працює, але підійде і невеликий VPS, домашній сервер або пристрій класу Raspberry Pi.

    Mac потрібен лише для **інструментів, доступних тільки на macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти, доступні лише на macOS, запускайте Gateway на Mac або під’єднайте Node macOS.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Node-и](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, на якому виконано вхід у Messages. Це **не обов’язково** має бути Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, тоді як Gateway може працювати на Linux або деінде.

    Типові варіанти налаштування:

    - Запустіть Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, де виконано вхід у Messages.
    - Запустіть усе на Mac, якщо хочете найпростіше середовище з однією машиною.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Node-и](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи зможу я під’єднати його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може під’єднатися як
    **Node** (супутній пристрій). Node-и не запускають Gateway — вони надають додаткові
    можливості, як-от screen/camera/canvas і `system.run` на цьому пристрої.

    Типовий шаблон:

    - Gateway на Mac mini (постійно ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост Node і з’єднується з Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Node-и](/uk/nodes), [CLI Node-ів](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендовано**. Ми спостерігаємо runtime-помилки, особливо з WhatsApp і Telegram.
    Для стабільних Gateway використовуйте **Node**.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на gateway не для production
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Під час налаштування запитуються лише числові user ID. Якщо у вас у конфігурації вже є застарілі записи `@username`, `openclaw doctor --fix` може спробувати їх розв’язати.

    Безпечніше (без стороннього бота):

    - Надішліть DM своєму боту, потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Надішліть DM своєму боту, а потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонні варіанти (менше приватності):

    - Надішліть DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними інстансами OpenClaw?">
    Так, через **маршрутизацію multi-agent**. Прив’яжіть WhatsApp **DM** кожного відправника (peer `kind: "direct"`, E.164 відправника на кшталт `+15551234567`) до іншого `agentId`, щоб кожна людина мала власний робочий простір і сховище сесій. Відповіді все одно надходитимуть із **того самого облікового запису WhatsApp**, а контроль доступу для DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Маршрутизація Multi-Agent](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "fast chat" і агента "Opus for coding"?'>
    Так. Використовуйте маршрутизацію multi-agent: задайте кожному агенту власну типову модель, а потім прив’яжіть вхідні маршрути (обліковий запис provider або конкретні peer) до кожного агента. Приклад конфігурації наведено в [Маршрутизація Multi-Agent](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH service містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, установлені через `brew`, розв’язувалися в оболонках без входу.
    Останні збірки також додають на початок поширені каталоги user bin у Linux systemd services (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` та `FNM_DIR`, якщо вони задані.

  </Accordion>

  <Accordion title="Різниця між hackable git install і npm install">
    - **Hackable (git) install:** повний checkout вихідного коду, редагований, найкраще для контриб’юторів.
      Ви локально виконуєте збірки й можете вносити зміни в код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію «просто запустити».
      Оновлення надходять із npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між встановленнями npm і git?">
    Так. Установіть інший варіант, а потім запустіть Doctor, щоб service gateway вказував на новий entrypoint.
    Це **не видаляє ваші дані** — змінюється лише встановлення коду OpenClaw. Ваш стан
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

    Doctor виявляє невідповідність entrypoint service gateway і пропонує переписати конфігурацію service відповідно до поточного встановлення (в автоматизації використовуйте `--repair`).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібне
    найменше тертя і вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Переваги:** немає витрат на сервер, прямий доступ до локальних файлів, видиме вікно браузера.
    - **Недоліки:** сон/втрата мережі = розриви з’єднання, оновлення ОС/перезавантаження переривають роботу, машина має бути активною.

    **VPS / хмара**

    - **Переваги:** постійна робота, стабільна мережа, немає проблем зі сном ноутбука, простіше підтримувати безперервну роботу.
    - **Недоліки:** часто headless-режим (використовуйте знімки екрана), лише віддалений доступ до файлів, для оновлень потрібен SSH.

    **Примітка щодо OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord чудово працюють із VPS. Єдиний справжній компроміс — **headless browser** проти видимого вікна. Див. [Browser](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо у вас раніше були розриви gateway. Локальний запуск чудово підходить, коли ви активно користуєтеся Mac і хочете мати доступ до локальних файлів або автоматизацію UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Не обов’язково, але **рекомендовано для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** постійно ввімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, простіше підтримувати безперервну роботу.
    - **Спільний ноутбук/настільний ПК:** цілком підходить для тестування та активного використання, але очікуйте пауз, коли машина засинає або оновлюється.

    Якщо вам потрібне найкраще з обох світів, тримайте Gateway на виділеному хості, а ноутбук під’єднайте як **Node** для локальних інструментів screen/camera/exec. Див. [Node-и](/uk/nodes).
    Для рекомендацій щодо безпеки прочитайте [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яка ОС рекомендована?">
    OpenClaw є легким. Для базового Gateway + одного чат-каналу:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1-2 vCPU, 2GB RAM або більше із запасом (журнали, медіа, кілька каналів). Інструменти Node і автоматизація браузера можуть бути ресурсомісткими.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях встановлення для Linux найкраще протестовано саме там.

    Документація: [Linux](/uk/platforms/linux), [Хостинг VPS](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди ввімкненою, доступною та мати достатньо
    RAM для Gateway і будь-яких каналів, які ви вмикаєте.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви використовуєте кілька каналів, автоматизацію браузера або інструменти для медіа.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви на Windows, **WSL2 — це найпростіший варіант у стилі VM** і має найкращу
    сумісність з інструментами. Див. [Windows](/uk/platforms/windows), [Хостинг VPS](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw, в одному абзаці?">
    OpenClaw — це персональний AI-помічник, який ви запускаєте на власних пристроях. Він відповідає на поверхнях обміну повідомленнями, якими ви вже користуєтеся (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat і вбудовані channel plugins, такі як QQ Bot), а також може працювати з голосом + live Canvas на підтримуваних платформах. **Gateway** — це контрольна площина, що завжди працює; помічник — це продукт.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не «просто обгортка для Claude». Це **локальна контрольна площина** передусім, яка дає змогу запускати
    потужного помічника на **власному обладнанні**, доступного з чат-застосунків, якими ви вже користуєтеся, зі
    станом сесій, пам’яттю та інструментами — без передачі контролю над вашими робочими процесами
    розміщеному SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і зберігайте
      робочий простір + історію сесій локально.
    - **Реальні канали, а не веб-пісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      а також мобільний голос і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо, з маршрутизацією
      та failover для кожного агента.
    - **Лише локальний варіант:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо ви цього хочете.
    - **Маршрутизація multi-agent:** окремі агенти для кожного каналу, облікового запису або завдання, кожен зі своїм
      робочим простором і параметрами за замовчуванням.
    - **Відкритий код і можливість змінювати:** перевіряйте, розширюйте та самостійно хостіть без vendor lock-in.

    Документація: [Gateway](/uk/gateway), [Канали](/uk/channels), [Multi-agent](/uk/concepts/multi-agent),
    [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував — що мені зробити спочатку?">
    Хороші перші проєкти:

    - Створити сайт (WordPress, Shopify або простий статичний сайт).
    - Створити прототип мобільного застосунку (план, екрани, план API).
    - Організувати файли та папки (очищення, іменування, теги).
    - Підключити Gmail і автоматизувати підсумки або follow-up.

    Він може виконувати великі завдання, але працює найкраще, коли ви розбиваєте їх на фази і
    використовуєте subagent для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найпоширеніших повсякденних сценаріїв використання OpenClaw?">
    Повсякденна користь зазвичай виглядає так:

    - **Персональні брифінги:** підсумки вхідних листів, календаря та важливих для вас новин.
    - **Дослідження та чернетки:** швидке дослідження, підсумки та перші чернетки для листів або документів.
    - **Нагадування та follow-up:** nudges і чеклісти на основі cron або heartbeat.
    - **Автоматизація браузера:** заповнення форм, збирання даних і повторення веб-завдань.
    - **Координація між пристроями:** надішліть завдання з телефона, дайте Gateway виконати його на сервері та отримайте результат назад у чаті.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, ads і blogs для SaaS?">
    Так — для **дослідження, кваліфікації та підготовки чернеток**. Він може сканувати сайти, створювати короткі списки,
    підсумовувати інформацію про потенційних клієнтів і писати чернетки outreach або рекламних текстів.

    Для **outreach або запуску реклами** залишайте людину в циклі. Уникайте спаму, дотримуйтеся місцевих законів і
    політик платформ і перевіряйте все перед надсиланням. Найбезпечніший шаблон — дати
    OpenClaw підготувати чернетку, а вам — її погодити.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний помічник** і координаційний шар, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу програмування в репозиторії. Використовуйте OpenClaw, коли вам
    потрібні довговічна пам’ять, доступ з різних пристроїв і оркестрація інструментів.

    Переваги:

    - **Постійна пам’ять + робочий простір** між сесіями
    - **Доступ із різних платформ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (browser, files, scheduling, hooks)
    - **Gateway, що завжди працює** (запуск на VPS, взаємодія звідусіль)
    - **Node-и** для локальних browser/screen/camera/exec

    Вітрина: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills та автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати Skills, не забруднюючи репозиторій?">
    Використовуйте керовані перевизначення замість редагування копії в репозиторії. Розміщуйте свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`, тож керовані перевизначення все одно мають пріоритет над bundled Skills без змін у git. Якщо Skill має бути встановлений глобально, але видимий лише певним агентам, тримайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` та `agents.list[].skills`. Лише зміни, гідні включення в upstream, мають жити в репозиторії й надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати Skills із власної папки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Пріоритет за замовчуванням: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`. `clawhub` типово встановлює в `./skills`, і OpenClaw сприймає це як `<workspace>/skills` у наступній сесії. Якщо Skill має бути видимий лише певним агентам, поєднайте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як я можу використовувати різні моделі для різних завдань?">
    Сьогодні підтримуються такі шаблони:

    - **Cron-завдання**: ізольовані завдання можуть задавати перевизначення `model` для кожного завдання.
    - **Sub-agent**: маршрутизуйте завдання до окремих агентів із різними типовими моделями.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб у будь-який момент змінити модель поточної сесії.

    Див. [Cron-завдання](/uk/automation/cron-jobs), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent) і [Слеш-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як це винести окремо?">
    Використовуйте **subagent** для довгих або паралельних завдань. Subagent працюють у власній сесії,
    повертають підсумок і зберігають чутливість вашого основного чату.

    Попросіть бота «spawn a sub-agent for this task» або використайте `/subagents`.
    Використовуйте `/status` у чаті, щоб бачити, що Gateway робить прямо зараз (і чи він зайнятий).

    Порада щодо токенів: довгі завдання і subagent обидва споживають токени. Якщо важлива
    вартість, задайте дешевшу модель для subagent через `agents.defaults.subagents.model`.

    Документація: [Sub-agent](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють прив’язані до thread сесії subagent у Discord?">
    Використовуйте прив’язки thread. Ви можете прив’язати thread Discord до subagent або до цільової сесії, щоб подальші повідомлення в цьому thread залишалися в межах прив’язаної сесії.

    Базовий процес:

    - Запускайте через `sessions_spawn` з `thread: true` (і за бажанням `mode: "session"` для постійних follow-up).
    - Або вручну прив’яжіть через `/focus <target>`.
    - Використовуйте `/agents` для перевірки стану прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним зняттям фокусу.
    - Використовуйте `/unfocus`, щоб від’єднати thread.

    Потрібна конфігурація:

    - Глобальні параметри за замовчуванням: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Перевизначення для Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоприв’язка під час spawn: установіть `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agent](/uk/tools/subagents), [Discord](/uk/channels/discord), [Довідник із конфігурації](/uk/gateway/configuration-reference), [Слеш-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Subagent завершив роботу, але оновлення про завершення надійшло не туди або взагалі не було опубліковане. Що перевірити?">
    Спочатку перевірте визначений маршрут запитувача:

    - Доставка subagent у режимі завершення надає перевагу будь-якому прив’язаному thread або маршруту розмови, якщо такий існує.
    - Якщо джерело завершення містить лише канал, OpenClaw повертається до збереженого маршруту сесії запитувача (`lastChannel` / `lastTo` / `lastAccountId`), щоб пряма доставка все одно могла спрацювати.
    - Якщо немає ні прив’язаного маршруту, ні придатного збереженого маршруту, пряма доставка може не спрацювати, і результат повернеться до доставки через чергу сесії замість негайної публікації в чат.
    - Некоректні або застарілі цілі все одно можуть примусово спричинити fallback до черги або остаточну помилку доставки.
    - Якщо остання видима відповідь асистента дочірнього елемента — це точний тихий токен `NO_REPLY` / `no_reply` або рівно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує announce замість публікації застарілого попереднього прогресу.
    - Якщо дочірній елемент завершився через timeout після самих лише викликів інструментів, announce може згорнути це в короткий підсумок часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agent](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks), [Інструмент Session](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron працює всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання не виконуватимуться.

    Контрольний список:

    - Переконайтеся, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не задано.
    - Переконайтеся, що Gateway працює 24/7 (без сну/перезапусків).
    - Перевірте налаштування часового поясу для завдання (`--tz` проти часового поясу хоста).

    Налагодження:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Документація: [Cron-завдання](/uk/automation/cron-jobs), [Автоматизація й завдання](/uk/automation).

  </Accordion>

  <Accordion title="Cron спрацював, але в канал нічого не було надіслано. Чому?">
    Спочатку перевірте режим доставки:

    - `--no-deliver` / `delivery.mode: "none"` означає, що резервне надсилання з боку виконавця не очікується.
    - Відсутня або некоректна announce-ціль (`channel` / `to`) означає, що виконавець пропустив вихідну доставку.
    - Збої автентифікації каналу (`unauthorized`, `Forbidden`) означають, що виконавець спробував доставити, але облікові дані заблокували це.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` лише) вважається навмисно непридатним до доставки, тому виконавець також пригнічує доставку через чергу як fallback.

    Для ізольованих cron-завдань агент усе ще може надсилати напряму за допомогою інструмента `message`,
    коли доступний маршрут чату. `--announce` керує лише резервним шляхом виконавця
    для фінального тексту, який агент ще не надіслав сам.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron-завдання](/uk/automation/cron-jobs), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований запуск cron перемкнув моделі або один раз повторився?">
    Зазвичай це шлях live-перемикання моделі, а не дубльоване планування.

    Ізольований cron може зберегти передавання керування моделлю під час виконання та повторити спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає перемкнений
    provider/model, а якщо перемикання містило нове перевизначення профілю автентифікації, cron
    також зберігає його перед повторною спробою.

    Пов’язані правила вибору:

    - Спочатку має перевагу перевизначення моделі Gmail hook, якщо воно застосовне.
    - Потім `model` окремого завдання.
    - Потім будь-яке збережене перевизначення моделі cron-сесії.
    - Потім звичайний вибір моделі агента/типової моделі.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 повторних спроб через перемикання
    cron перериває виконання замість безкінечного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron-завдання](/uk/automation/cron-jobs), [CLI cron](/uk/cli/cron).

  </Accordion>

  <Accordion title="Як установити Skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або розміщуйте Skills у своєму робочому просторі. UI Skills для macOS недоступний на Linux.
    Переглядати Skills можна на [https://clawhub.ai](https://clawhub.ai).

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
    активного робочого простору. Установлюйте окремий CLI `clawhub`, лише якщо хочете публікувати або
    синхронізувати власні Skills. Для спільних встановлень між агентами розміщуйте Skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете звузити, які агенти можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати завдання за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Cron-завдання** для запланованих або періодичних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок «основної сесії».
    - **Ізольовані завдання** для автономних агентів, які публікують підсумки або доставляють їх у чати.

    Документація: [Cron-завдання](/uk/automation/cron-jobs), [Автоматизація й завдання](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати Skills, доступні лише на Apple macOS, з Linux?">
    Не напряму. Skills macOS обмежуються через `metadata.openclaw.os` і потрібні бінарні файли, а Skills з’являються в system prompt лише тоді, коли вони придатні на **хості Gateway**. На Linux Skills лише для `darwin` (як-от `apple-notes`, `apple-reminders`, `things-mac`) не завантажуються, якщо ви не перевизначите це обмеження.

    Є три підтримувані шаблони:

    **Варіант A — запускати Gateway на Mac (найпростіше).**
    Запускайте Gateway там, де існують бінарні файли macOS, а потім підключайтеся з Linux у [віддаленому режимі](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажуватимуться нормально, бо хост Gateway — macOS.

    **Варіант B — використовувати macOS Node (без SSH).**
    Запускайте Gateway на Linux, під’єднайте macOS Node (застосунок menubar) і встановіть **Node Run Commands** у значення "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати Skills, доступні лише для macOS, придатними, коли потрібні бінарні файли існують на Node. Агент запускає ці Skills через інструмент `nodes`. Якщо ви виберете "Always Ask", погодження "Always Allow" у prompt додасть цю команду до allowlist.

    **Варіант C — проксувати бінарні файли macOS через SSH (просунутий).**
    Тримайте Gateway на Linux, але зробіть так, щоб потрібні CLI-бінарні файли визначалися як SSH-обгортки, що виконуються на Mac. Потім перевизначте Skill, щоб дозволити Linux, і він лишався придатним.

    1. Створіть SSH-обгортку для бінарного файла (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Розмістіть обгортку в `PATH` на хості Linux (наприклад `~/bin/memo`).
    3. Перевизначте metadata Skill (робочий простір або `~/.openclaw/skills`), щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Почніть нову сесію, щоб знімок Skills оновився.

  </Accordion>

  <Accordion title="Чи є у вас інтеграція з Notion або HeyGen?">
    Сьогодні вбудованої немає.

    Варіанти:

    - **Власний Skill / Plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Автоматизація браузера:** працює без коду, але повільніша й крихкіша.

    Якщо ви хочете зберігати контекст окремо для кожного клієнта (сценарії агентств), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + уподобання + активна робота).
    - Попросіть агента отримувати цю сторінку на початку сесії.

    Якщо вам потрібна нативна інтеграція, створіть feature request або розробіть Skill,
    націлений на ці API.

    Установлення Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активного робочого простору. Для спільних Skills між агентами розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі агенти, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі Skills очікують, що бінарні файли буде встановлено через Homebrew; на Linux це означає Linuxbrew (див. запис FAQ про Homebrew на Linux вище). Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати вже відкритий Chrome з виконаним входом в OpenClaw?">
    Використовуйте вбудований профіль браузера `user`, який під’єднується через Chrome DevTools MCP:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    Якщо ви хочете власну назву, створіть явний профіль MCP:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    Цей шлях може використовувати локальний браузер хоста або під’єднаний browser node. Якщо Gateway працює деінде, або запустіть хост node на машині з браузером, або використовуйте віддалений CDP.

    Поточні обмеження `existing-session` / `user`:

    - дії прив’язані до `ref`, а не до CSS-selector
    - завантаження файлів вимагає `ref` / `inputRef` і наразі підтримує по одному файлу за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії все ще потребують керованого браузера або профілю raw CDP

  </Accordion>
</AccordionGroup>

## Ізоляція та пам’ять

<AccordionGroup>
  <Accordion title="Чи є окрема документація про ізоляцію?">
    Так. Див. [Ізоляція](/uk/gateway/sandboxing). Для налаштування, специфічного для Docker (повний gateway у Docker або образи пісочниці), див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повну функціональність?">
    Образ за замовчуванням орієнтований насамперед на безпеку і працює від імені користувача `node`, тому
    не містить системних пакетів, Homebrew або вбудованих браузерів. Для повнішого середовища:

    - Зберігайте `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші переживали перезапуски.
    - Запікайте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Установлюйте браузери Playwright через вбудований CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Установіть `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я зберегти DM особистими, а групи зробити публічними/ізольованими з одним агентом?">
    Так — якщо ваш приватний трафік це **DM**, а публічний трафік — **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб сесії груп/каналів (ключі не `main`) працювали у налаштованому backend пісочниці, а основна DM-сесія залишалася на хості. Docker — backend за замовчуванням, якщо ви не вибрали інший. Потім обмежте, які інструменти доступні в ізольованих сесіях, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: особисті DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Довідник із ключової конфігурації: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати папку хоста до пісочниці?">
    Установіть `agents.defaults.sandbox.docker.binds` у `["host:path:mode"]` (наприклад, `"/home/user/src:/src:ro"`). Глобальні прив’язки й прив’язки на рівні агента об’єднуються; прив’язки на рівні агента ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого й пам’ятайте, що прив’язки обходять файлові межі пісочниці.

    OpenClaw перевіряє джерела прив’язки як за нормалізованим шляхом, так і за канонічним шляхом, розв’язаним через найглибший наявний батьківський елемент. Це означає, що виходи за межі через symlink-батьківський шлях усе одно надійно блокуються, навіть коли останній сегмент шляху ще не існує, а перевірки дозволених коренів усе одно застосовуються після розв’язання symlink.

    Див. [Ізоляція](/uk/gateway/sandboxing#custom-bind-mounts) і [Пісочниця vs політика інструментів vs elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) для прикладів і приміток щодо безпеки.

  </Accordion>

  <Accordion title="Як працює пам’ять?">
    Пам’ять OpenClaw — це просто Markdown-файли в робочому просторі агента:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Відібрані довгострокові нотатки в `MEMORY.md` (лише основні/приватні сесії)

    OpenClaw також виконує **тихе попереднє скидання пам’яті перед Compaction**, щоб нагадати моделі
    записати довговічні нотатки перед автоматичним Compaction. Це виконується лише тоді, коли робочий простір
    доступний для запису (пісочниці тільки для читання це пропускають). Див. [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Пам’ять постійно все забуває. Як зробити, щоб це зберігалося?">
    Попросіть бота **записати факт у пам’ять**. Довгострокові нотатки мають зберігатися в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще напрям, який ми покращуємо. Корисно нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона все одно забуває, переконайтеся, що Gateway використовує той самий
    робочий простір при кожному запуску.

    Документація: [Пам’ять](/uk/concepts/memory), [Робочий простір агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається пам’ять назавжди? Які є обмеження?">
    Файли пам’яті живуть на диску та зберігаються, доки ви їх не видалите. Обмеженням є ваше
    сховище, а не модель. **Контекст сесії** усе ще обмежений вікном контексту
    моделі, тож довгі розмови можуть ущільнюватися або обрізатися. Саме тому
    існує семантичний пошук по пам’яті — він повертає в контекст лише релевантні частини.

    Документація: [Пам’ять](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потребує семантичний пошук у пам’яті OpenAI API key?">
    Лише якщо ви використовуєте **embeddings OpenAI**. Codex OAuth покриває chat/completions і
    **не** надає доступу до embeddings, тому **вхід через Codex (OAuth або
    вхід через Codex CLI)** не допомагає для семантичного пошуку в пам’яті. Для embeddings OpenAI
    усе ще потрібен справжній API key (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви явно не задаєте provider, OpenClaw автоматично вибирає provider, коли може
    розв’язати API key (профілі автентифікації, `models.providers.*.apiKey` або змінні середовища).
    Він надає перевагу OpenAI, якщо вдається розв’язати ключ OpenAI, інакше Gemini, якщо вдається розв’язати ключ Gemini,
    потім Voyage, потім Mistral. Якщо жоден віддалений ключ недоступний, пошук у пам’яті
    лишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштовано і наявний шлях до локальної моделі,
    OpenClaw
    надає перевагу `local`. Ollama підтримується, коли ви явно задаєте
    `memorySearch.provider = "ollama"`.

    Якщо ви волієте залишатися локально, задайте `memorySearch.provider = "local"` (і за бажанням
    `memorySearch.fallback = "none"`). Якщо ви хочете embeddings Gemini, задайте
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо embedding-моделі **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    див. [Пам’ять](/uk/concepts/memory) для деталей налаштування.

  </Accordion>
</AccordionGroup>

## Де що зберігається на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, які використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** сесії, файли пам’яті, конфігурація та робочий простір живуть на хості Gateway
      (`~/.openclaw` + каталог вашого робочого простору).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте provider моделей (Anthropic/OpenAI тощо), потрапляють до
      їхніх API, а платформи чатів (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на своїх
      серверах.
    - **Ви керуєте відбитком:** використання локальних моделей зберігає prompt на вашій машині, але трафік
      каналів усе одно проходить через сервери каналу.

    Пов’язане: [Робочий простір агента](/uk/concepts/agent-workspace), [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе живе в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Шлях                                                           | Призначення                                                       |
    | -------------------------------------------------------------- | ----------------------------------------------------------------- |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                            | Основна конфігурація (JSON5)                                      |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                   | Імпорт застарілого OAuth (копіюється в профілі автентифікації під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Профілі автентифікації (OAuth, API keys і необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                             | Необов’язковий payload секретів у файлі для provider SecretRef типу `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`         | Файл застарілої сумісності (статичні записи `api_key` очищуються) |
    | `$OPENCLAW_STATE_DIR/credentials/`                             | Стан provider (наприклад, `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                  | Стан для кожного агента (agentDir + sessions)                     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`               | Історія розмов і стан (для кожного агента)                        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`  | Метадані сесій (для кожного агента)                               |

    Застарілий шлях для одного агента: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`).

    Ваш **робочий простір** (`AGENTS.md`, файли пам’яті, Skills тощо) є окремим і налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають зберігатися AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли живуть у **робочому просторі агента**, а не в `~/.openclaw`.

    - **Робочий простір (для кожного агента)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, необов’язковий `HEARTBEAT.md`.
      `memory.md` у нижньому регістрі в корені використовується лише як вхід для виправлення застарілого формату; `openclaw doctor --fix`
      може об’єднати його в `MEMORY.md`, коли обидва файли існують.
    - **Каталог стану (`~/.openclaw`)**: конфігурація, стан каналу/provider, профілі автентифікації, сесії, журнали,
      і спільні Skills (`~/.openclaw/skills`).

    Робочий простір за замовчуванням — `~/.openclaw/workspace`, налаштовується через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот «забуває» після перезапуску, переконайтеся, що Gateway використовує той самий
    робочий простір під час кожного запуску (і пам’ятайте: віддалений режим використовує робочий простір **хоста gateway**,
    а не вашого локального ноутбука).

    Порада: якщо ви хочете зберегти поведінку або вподобання надовго, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладатися на історію чату.

    Див. [Робочий простір агента](/uk/concepts/agent-workspace) і [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Розмістіть свій **робочий простір агента** у **приватному** git-репозиторії та створюйте його резервні копії десь
    у приватному місці (наприклад, GitHub private). Це захоплює пам’ять + файли AGENTS/SOUL/USER
    і дає змогу пізніше відновити «свідомість» асистента.

    **Не** робіть commit нічого з `~/.openclaw` (облікові дані, сесії, токени або зашифровані payload секретів).
    Якщо вам потрібне повне відновлення, окремо створюйте резервні копії і робочого простору, і каталогу стану
    (див. питання про міграцію вище).

    Документація: [Робочий простір агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окремий посібник: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть агенти працювати поза межами робочого простору?">
    Так. Робочий простір — це **cwd за замовчуванням** і прив’язка пам’яті, а не жорстка пісочниця.
    Відносні шляхи розв’язуються в межах робочого простору, але абсолютні шляхи можуть отримувати доступ до інших
    місць на хості, якщо пісочниця не ввімкнена. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування пісочниці для окремого агента. Якщо ви
    хочете, щоб репозиторій був робочим каталогом за замовчуванням, вкажіть для цього агента
    `workspace` на корінь репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
    робочий простір окремо, якщо тільки ви свідомо не хочете, щоб агент працював усередині нього.

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

  <Accordion title="Віддалений режим: де зберігаються сесії?">
    Станом сесій володіє **хост gateway**. Якщо ви в віддаленому режимі, важливе для вас сховище сесій перебуває на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="Який формат має конфігурація? Де вона розташована?">
    OpenClaw читає необов’язкову конфігурацію **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються відносно безпечні типові значення (зокрема типовий робочий простір `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я встановив gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Прив’язки не до loopback **потребують коректного шляху автентифікації gateway**. На практиці це означає:

    - автентифікація спільним секретом: токен або пароль
    - `gateway.auth.mode: "trusted-proxy"` за правильно налаштованим reverse proxy з обізнаністю про ідентичність, не на loopback

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
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як fallback лише тоді, коли `gateway.auth.*` не задано.
    - Для автентифікації паролем установіть `gateway.auth.mode: "password"` разом із `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і його не вдається розв’язати, розв’язання закривається на відмову (без маскування віддаленим fallback).
    - Налаштування спільного секрету Control UI проходять автентифікацію через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях застосунку/UI). Режими з передаванням ідентичності, як-от Tailscale Serve або `trusted-proxy`, натомість використовують заголовки запиту. Уникайте розміщення спільних секретів в URL.
    - З `gateway.auth.mode: "trusted-proxy"` reverse proxy на loopback на тому самому хості все одно **не** задовольняють автентифікацію trusted-proxy. Trusted proxy має бути налаштованим джерелом не на loopback.

  </Accordion>

  <Accordion title="Чому тепер мені потрібен токен навіть на localhost?">
    OpenClaw типово примусово застосовує автентифікацію gateway, зокрема і на loopback. У звичайному типовому сценарії це означає автентифікацію токеном: якщо явний шлях автентифікації не налаштовано, під час запуску gateway вибирається режим токена й автоматично генерується токен, який зберігається в `gateway.auth.token`, тож **локальні WS-клієнти мають проходити автентифікацію**. Це блокує іншим локальним процесам можливість викликати Gateway.

    Якщо ви віддаєте перевагу іншому шляху автентифікації, можна явно вибрати режим пароля (або, для reverse proxy з awareness про ідентичність не на loopback, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно встановіть `gateway.auth.mode: "none"` у конфігурації. Doctor може згенерувати токен будь-коли: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи треба перезапускати після зміни конфігурації?">
    Gateway відстежує конфігурацію та підтримує гаряче перезавантаження:

    - `gateway.reload.mode: "hybrid"` (типово): безпечно застосовує hot-зміни, для критичних виконує перезапуск
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

    - `off`: приховує текст слогана, але зберігає рядок заголовка/версії банера.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: обертові кумедні/сезонні слогани (поведінка за замовчуванням).
    - Якщо ви хочете повністю прибрати банер, установіть змінну середовища `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути вебпошук (і web fetch)?">
    `web_fetch` працює без API key. `web_search` залежить від вибраного
    provider:

    - Provider-и на основі API, як-от Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, потребують звичайного налаштування API key.
    - Ollama Web Search не потребує ключа, але використовує налаштований хост Ollama і вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна інтеграція на основі HTML.
    - SearXNG не потребує ключа / є self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Рекомендовано:** виконайте `openclaw configure --section web` і виберіть provider.
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

    Конфігурація вебпошуку для конкретного provider тепер розташована в `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи provider у `tools.web.search.*` усе ще тимчасово завантажуються для сумісності, але їх не слід використовувати в нових конфігураціях.
    Конфігурація fallback для web fetch у Firecrawl міститься в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlist, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` типово увімкнений (якщо явно не вимкнено).
    - Якщо `tools.web.fetch.provider` пропущено, OpenClaw автоматично визначає перший готовий fallback provider для fetch за наявними обліковими даними. Наразі вбудований provider — Firecrawl.
    - Daemon-и читають змінні середовища з `~/.openclaw/.env` (або із середовища service).

    Документація: [Вебінструменти](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мою конфігурацію. Як відновитися і як цього уникнути?">
    `config.apply` замінює **всю конфігурацію**. Якщо ви надсилаєте частковий об’єкт, усе
    інше видаляється.

    Поточний OpenClaw захищає від багатьох випадкових затирань:

    - Записи конфігурації, якими керує OpenClaw, перевіряють повну конфігурацію після змін перед записом.
    - Невалідні або руйнівні записи, якими керує OpenClaw, відхиляються та зберігаються як `openclaw.json.rejected.*`.
    - Якщо пряме редагування ламає запуск або hot reload, Gateway відновлює останню відому коректну конфігурацію і зберігає відхилений файл як `openclaw.json.clobbered.*`.
    - Після відновлення основний агент отримує попередження під час завантаження, щоб не переписати погану конфігурацію знову навмання.

    Відновлення:

    - Перевірте `openclaw logs --follow` на наявність `Config auto-restored from last-known-good`, `Config write rejected:` або `config reload restored last-known-good config`.
    - Перегляньте найновіший `openclaw.json.clobbered.*` або `openclaw.json.rejected.*` поруч з активною конфігурацією.
    - Залиште активну відновлену конфігурацію, якщо вона працює, а потім поверніть лише потрібні ключі за допомогою `openclaw config set` або `config.patch`.
    - Виконайте `openclaw config validate` і `openclaw doctor`.
    - Якщо у вас немає last-known-good або відхиленого payload, відновіть із резервної копії або повторно виконайте `openclaw doctor` і заново налаштуйте канали/моделі.
    - Якщо це було неочікувано, створіть bug report і додайте останню відому конфігурацію або будь-яку резервну копію.
    - Локальний агент для програмування часто може відновити робочу конфігурацію з журналів або історії.

    Як уникнути:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Спочатку використовуйте `config.schema.lookup`, якщо ви не впевнені в точному шляху або формі поля; він повертає поверхневий вузол схеми плюс короткі описи безпосередніх дочірніх елементів для подальшого заглиблення.
    - Використовуйте `config.patch` для часткових редагувань через RPC; залишайте `config.apply` лише для повної заміни конфігурації.
    - Якщо ви використовуєте інструмент `gateway`, доступний лише owner, із запуску агента, він усе одно відхилятиме записи в `tools.exec.ask` / `tools.exec.security` (включно із застарілими псевдонімами `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Конфігурація](/uk/cli/config), [Налаштування](/uk/cli/configure), [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими worker на різних пристроях?">
    Типовий шаблон — **один Gateway** (наприклад, Raspberry Pi) плюс **Node-и** та **агенти**:

    - **Gateway (центральний):** володіє каналами (Signal/WhatsApp), маршрутизацією та сесіями.
    - **Node-и (пристрої):** Mac/iOS/Android підключаються як периферія та надають локальні інструменти (`system.run`, `canvas`, `camera`).
    - **Агенти (worker-и):** окремі «мозки»/робочі простори для спеціалізованих ролей (наприклад, "Hetzner ops", "Personal data").
    - **Sub-agent:** запускають фонову роботу з основного агента, коли вам потрібен паралелізм.
    - **TUI:** підключається до Gateway і дає змогу перемикати агентів/сесії.

    Документація: [Node-и](/uk/nodes), [Віддалений доступ](/uk/gateway/remote), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Sub-agent](/uk/tools/subagents), [TUI](/uk/web/tui).

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

    Типове значення — `false` (із видимим вікном). Headless-режим із більшою ймовірністю викликає перевірки anti-bot на деяких сайтах. Див. [Browser](/uk/tools/browser).

    Headless використовує **той самий рушій Chromium** і працює для більшості сценаріїв автоматизації (форми, кліки, збирання даних, входи). Основні відмінності:

    - Немає видимого вікна браузера (використовуйте знімки екрана, якщо вам потрібна візуалізація).
    - Деякі сайти суворіше ставляться до автоматизації в headless-режимі (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує headless-сесії.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Установіть `browser.executablePath` на ваш бінарний файл Brave (або будь-який браузер на базі Chromium) і перезапустіть Gateway.
    Повні приклади конфігурації див. у [Browser](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway і Node-и

<AccordionGroup>
  <Accordion title="Як команди проходять між Telegram, gateway і Node-ами?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає агента і
    лише потім викликає Node-и через **Gateway WebSocket**, коли потрібен інструмент node:

    Telegram → Gateway → Агент → `node.*` → Node → Gateway → Telegram

    Node-и не бачать вхідний трафік provider; вони лише отримують виклики node RPC.

  </Accordion>

  <Accordion title="Як мій агент може отримати доступ до мого комп’ютера, якщо Gateway розміщено віддалено?">
    Коротка відповідь: **під’єднайте свій комп’ютер як Node**. Gateway працює деінде, але він може
    викликати інструменти `node.*` (screen, camera, system) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на хості, що завжди працює (VPS/домашній сервер).
    2. Додайте хост Gateway і ваш комп’ютер до однієї tailnet.
    3. Переконайтеся, що Gateway WS доступний (tailnet bind або SSH tunnel).
    4. Відкрийте застосунок macOS локально і підключіться в режимі **Remote over SSH** (або напряму через tailnet)
       щоб він міг зареєструватися як Node.
    5. Погодьте Node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP-міст не потрібен; Node-и підключаються через Gateway WebSocket.

    Нагадування щодо безпеки: під’єднання macOS Node дозволяє `system.run` на цій машині. Під’єднуйте
    лише пристрої, яким довіряєте, і ознайомтеся з [Безпекою](/uk/gateway/security).

    Документація: [Node-и](/uk/nodes), [Протокол Gateway](/uk/gateway/protocol), [Віддалений режим macOS](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключено, але я не отримую відповідей. Що тепер?">
    Перевірте базові речі:

    - Gateway запущено: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан каналів: `openclaw channels status`

    Потім перевірте автентифікацію та маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` налаштовано правильно.
    - Якщо ви підключаєтеся через SSH tunnel, переконайтеся, що локальний tunnel активний і вказує на правильний порт.
    - Переконайтеся, що ваші allowlist (DM або група) містять ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Канали](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два інстанси OpenClaw спілкуватися один з одним (локальний + VPS)?">
    Так. Вбудованого мосту «бот-до-бота» немає, але це можна налаштувати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний чат-канал, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надішле повідомлення Bot B, а потім Bot B відповість як зазвичай.

    **CLI-міст (загальний):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючись на чат, де слухає інший бот.
    Якщо один бот працює на віддаленому VPS, направте свій CLI на цей віддалений Gateway
    через SSH/Tailscale (див. [Віддалений доступ](/uk/gateway/remote)).

    Приклад шаблону (запускати з машини, яка може дістатися до цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте запобіжник, щоб два боти не зациклилися безкінечно (лише згадки, channel
    allowlist або правило «не відповідати на повідомлення ботів»).

    Документація: [Віддалений доступ](/uk/gateway/remote), [CLI Agent](/uk/cli/agent), [Надсилання Agent](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох агентів?">
    Ні. Один Gateway може розміщувати кількох агентів, кожен зі своїм робочим простором, типовими моделями
    і маршрутизацією. Це звичайне налаштування, і воно набагато дешевше та простіше, ніж запускати
    окремий VPS для кожного агента.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні конфігурації, які ви не хочете спільно використовувати. В іншому разі тримайте один Gateway і
    використовуйте кількох агентів або sub-agent.

  </Accordion>

  <Accordion title="Чи є перевага у використанні Node на моєму особистому ноутбуці замість SSH з VPS?">
    Так — Node-и є пріоритетним способом доступу до вашого ноутбука з віддаленого Gateway, і вони
    дають більше, ніж просто доступ до оболонки. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (достатньо невеликого VPS або пристрою класу Raspberry Pi; 4 GB RAM більш ніж достатньо), тому поширеним
    варіантом є хост, що завжди працює, плюс ваш ноутбук як Node.

    - **Не потрібен вхідний SSH.** Node-и самі підключаються до Gateway WebSocket і використовують спарювання пристроїв.
    - **Безпечніший контроль виконання.** `system.run` обмежується allowlist/погодженнями Node на цьому ноутбуці.
    - **Більше інструментів пристрою.** Node-и надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна автоматизація браузера.** Тримайте Gateway на VPS, але запускайте Chrome локально через хост Node на ноутбуці або під’єднуйтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для разового доступу до оболонки, але Node-и простіші для постійних робочих процесів агента і
    автоматизації пристроїв.

    Документація: [Node-и](/uk/nodes), [CLI Node-ів](/uk/cli/nodes), [Browser](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають Node-и service gateway?">
    Ні. На хості має працювати лише **один gateway**, якщо тільки ви свідомо не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)). Node-и — це периферія, яка підключається
    до gateway (Node-и iOS/Android або режим macOS "node mode" у застосунку menubar). Для headless
    хостів Node та керування через CLI див. [CLI Node host](/uk/cli/node).

    Повний перезапуск потрібен для змін `gateway`, `discovery` і `canvasHost`.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати конфігурацію?">
    Так.

    - `config.schema.lookup`: перевіряє одне піддерево конфігурації разом із його поверхневим вузлом схеми, відповідною підказкою UI та короткими описами безпосередніх дочірніх елементів перед записом
    - `config.get`: отримує поточний знімок + hash
    - `config.patch`: безпечне часткове оновлення (рекомендовано для більшості RPC-редагувань); виконує hot-reload, коли можливо, і перезапуск, коли потрібно
    - `config.apply`: перевіряє + замінює всю конфігурацію; виконує hot-reload, коли можливо, і перезапуск, коли потрібно
    - Інструмент виконання `gateway`, доступний лише owner, як і раніше, відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

  </Accordion>

  <Accordion title="Мінімальна адекватна конфігурація для першого встановлення">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Це задає ваш робочий простір і обмежує коло тих, хто може активувати бота.

  </Accordion>

  <Accordion title="Як налаштувати Tailscale на VPS і підключитися з Mac?">
    Мінімальні кроки:

    1. **Установіть + увійдіть на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Установіть + увійдіть на Mac**
       - Використовуйте застосунок Tailscale і ввійдіть у ту саму tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - В адмінконсолі Tailscale увімкніть MagicDNS, щоб VPS мав стабільне ім’я.
    4. **Використовуйте hostname tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо ви хочете Control UI без SSH, використовуйте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив’язаним до loopback і відкриває HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як підключити Mac Node до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Gateway Control UI + WS**. Node-и підключаються через той самий endpoint Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS і Mac перебувають в одній tailnet**.
    2. **Використовуйте застосунок macOS у віддаленому режимі** (SSH-ціллю може бути hostname tailnet).
       Застосунок пробросить порт Gateway і підключиться як Node.
    3. **Погодьте Node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Протокол Gateway](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [Віддалений режим macOS](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи варто встановлювати на другий ноутбук, чи просто додати Node?">
    Якщо вам потрібні лише **локальні інструменти** (screen/camera/exec) на другому ноутбуці, додайте його як
    **Node**. Це зберігає один Gateway і дозволяє уникнути дублювання конфігурації. Локальні інструменти Node
    наразі доступні лише на macOS, але ми плануємо поширити їх і на інші ОС.

    Установлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Node-и](/uk/nodes), [CLI Node-ів](/uk/cli/nodes), [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Змінні середовища та завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує змінні середовища?">
    OpenClaw читає змінні середовища з батьківського процесу (оболонка, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного робочого каталогу
    - глобальний резервний `.env` із `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден із файлів `.env` не перевизначає вже наявні змінні середовища.

    Ви також можете визначати вбудовані змінні середовища в конфігурації (застосовуються лише за відсутності в середовищі процесу):

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

  <Accordion title="Я запустив Gateway через service, і мої змінні середовища зникли. Що робити?">
    Є два поширені виправлення:

    1. Помістіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися навіть тоді, коли service не успадковує середовище вашої оболонки.
    2. Увімкніть імпорт із оболонки (зручність за запитом):

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

    Це запускає вашу login shell і імпортує лише відсутні очікувані ключі (ніколи не перевизначає наявні). Еквіваленти змінних середовища:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я встановив COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` повідомляє, чи ввімкнено **імпорт змінних середовища з оболонки**. "Shell env: off"
    **не** означає, що ваші змінні середовища відсутні — це лише означає, що OpenClaw не завантажуватиме
    вашу login shell автоматично.

    Якщо Gateway працює як service (launchd/systemd), він не успадковує середовище вашої оболонки.
    Виправлення — зробіть одне з наведеного:

    1. Помістіть токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або увімкніть імпорт із оболонки (`env.shellEnv.enabled: true`).
    3. Або додайте його в блок `env` конфігурації (застосовується лише за відсутності).

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
    Надішліть `/new` або `/reset` окремим повідомленням. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>

  <Accordion title="Чи скидаються сесії автоматично, якщо я ніколи не надсилаю /new?">
    Термін дії сесій може спливати після `session.idleMinutes`, але це **типово вимкнено** (типове значення **0**).
    Встановіть додатне значення, щоб увімкнути завершення через бездіяльність. Коли це ввімкнено, **наступне**
    повідомлення після періоду бездіяльності починає новий ID сесії для цього ключа чату.
    Це не видаляє transcript — лише починає нову сесію.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб створити команду з інстансів OpenClaw (один CEO і багато агентів)?">
    Так, через **маршрутизацію multi-agent** і **sub-agent**. Ви можете створити одного агента-координатора
    і кількох агентів-worker-ів із власними робочими просторами та моделями.

    Утім, найкраще сприймати це як **цікавий експеримент**. Це витрачає багато токенів і часто
    менш ефективно, ніж використання одного бота з окремими сесіями. Типова модель, яку ми
    уявляємо, — це один бот, з яким ви спілкуєтеся, але з різними сесіями для паралельної роботи. Такий
    бот також може запускати sub-agent за потреби.

    Документація: [Маршрутизація multi-agent](/uk/concepts/multi-agent), [Sub-agent](/uk/tools/subagents), [CLI Agents](/uk/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст було обрізано посеред завдання? Як цьому запобігти?">
    Контекст сесії обмежений вікном моделі. Довгі чати, великий вивід інструментів або велика кількість
    файлів можуть спричинити Compaction або обрізання.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими завданнями, а `/new` — при зміні теми.
    - Тримайте важливий контекст у робочому просторі й просіть бота перечитати його.
    - Використовуйте sub-agent для довгої або паралельної роботи, щоб основний чат залишався меншим.
    - Виберіть модель із більшим вікном контексту, якщо це часто трапляється.

  </Accordion>

  <Accordion title="Як повністю скинути OpenClaw, але залишити його встановленим?">
    Використовуйте команду скидання:

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

    - Онбординг також пропонує **Reset**, якщо бачить наявну конфігурацію. Див. [Онбординг (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен каталог стану (типові значення — `~/.openclaw-<profile>`).
    - Скидання для розробки: `openclaw gateway --dev --reset` (лише для dev; стирає dev-конфігурацію + облікові дані + сесії + робочий простір).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або ущільнити?'>
    Використовуйте один із варіантів:

    - **Compaction** (зберігає розмову, але підсумовує старіші ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб спрямувати підсумок.

    - **Скидання** (новий ID сесії для того самого ключа чату):

      ```
      /new
      /reset
      ```

    Якщо це постійно повторюється:

    - Увімкніть або налаштуйте **очищення сесії** (`agents.defaults.contextPruning`), щоб обрізати старий вивід інструментів.
    - Використовуйте модель із більшим вікном контексту.

    Документація: [Compaction](/uk/concepts/compaction), [Очищення сесії](/uk/concepts/session-pruning), [Керування сесіями](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка перевірки provider: модель згенерувала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія сесії застаріла або пошкоджена (часто після довгих thread
    або зміни інструмента/схеми).

    Виправлення: почніть нову сесію за допомогою `/new` (окремим повідомленням).

  </Accordion>

  <Accordion title="Чому я отримую повідомлення heartbeat кожні 30 хвилин?">
    Heartbeat типово запускаються кожні **30m** (**1h** при використанні OAuth auth). Налаштуйте або вимкніть їх:

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

    Якщо `HEARTBEAT.md` існує, але фактично порожній (лише порожні рядки та markdown-заголовки
    на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб заощадити API calls.
    Якщо файл відсутній, heartbeat усе одно запускається, і модель сама вирішує, що робити.

    Перевизначення для окремих агентів використовують `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "обліковий запис бота" до групи WhatsApp?'>
    Ні. OpenClaw працює від **вашого власного облікового запису**, тож якщо ви є в групі, OpenClaw може її бачити.
    Типово відповіді в групах заблоковані, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

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
    Варіант 1 (найшвидший): переглядайте журнали в реальному часі та надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Знайдіть `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/додано до allowlist): виведіть групи з конфігурації:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/uk/cli/directory), [Журнали](/uk/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Дві поширені причини:

    - Увімкнено обмеження згадкою (типово). Ви маєте @згадати бота (або відповідати `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і групу не додано до allowlist.

    Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи ділять групи/thread контекст із DM?">
    Прямі чати типово зводяться до основної сесії. Групи/канали мають власні ключі сесій, а теми Telegram / thread Discord — це окремі сесії. Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки робочих просторів і агентів я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але стежте за таким:

    - **Зростання диска:** сесії + transcript зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартість токенів:** більше агентів означає більше одночасного використання моделей.
    - **Операційні витрати:** профілі автентифікації для кожного агента, робочі простори і маршрутизація каналів.

    Поради:

    - Тримайте один **активний** робочий простір для кожного агента (`agents.defaults.workspace`).
    - Очищуйте старі сесії (видаляйте записи JSONL або зі сховища), якщо диск розростається.
    - Використовуйте `openclaw doctor`, щоб знаходити сторонні робочі простори та невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька ботів або чатів одночасно (Slack), і як це краще налаштувати?">
    Так. Використовуйте **Маршрутизацію Multi-Agent**, щоб запускати кілька ізольованих агентів і маршрутизувати вхідні повідомлення за
    каналом/обліковим записом/peer. Slack підтримується як канал і може бути прив’язаний до конкретних агентів.

    Доступ до браузера потужний, але це не «робити все, що може людина» — anti-bot, CAPTCHA і MFA
    усе ще можуть блокувати автоматизацію. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на хості,
    або використовуйте CDP на машині, яка фактично запускає браузер.

    Рекомендоване налаштування:

    - Хост Gateway, що завжди працює (VPS/Mac mini).
    - Один агент на роль (bindings).
    - Канал(и) Slack, прив’язані до цих агентів.
    - Локальний браузер через Chrome MCP або Node за потреби.

    Документація: [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Browser](/uk/tools/browser), [Node-и](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: типові значення, вибір, псевдоніми, перемикання

<AccordionGroup>
  <Accordion title='Що таке "типова модель"?'>
    Типова модель OpenClaw — це те, що ви встановили як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються у форматі `provider/model` (приклад: `openai/gpt-5.5`). Якщо ви пропускаєте provider, OpenClaw спочатку пробує псевдонім, потім унікальний збіг налаштованого provider для цього точного ID моделі, і лише потім повертається до налаштованого типового provider як до застарілого шляху сумісності. Якщо цей provider більше не надає налаштовану типову модель, OpenClaw повертається до першого налаштованого provider/model замість того, щоб показувати застаріле типове значення видаленого provider. Вам усе одно слід **явно** вказувати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендоване типове значення:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку provider.
    **Для агентів з увімкненими інструментами або з недовіреним вхідним вмістом:** надавайте пріоритет силі моделі, а не вартості.
    **Для звичайного/низькоризикового чату:** використовуйте дешевші fallback-моделі та маршрутизуйте за роллю агента.

    Для MiniMax є окрема документація: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити** для важливих завдань, і дешевшу
    модель для звичайного чату або підсумків. Ви можете маршрутизувати моделі для кожного агента і використовувати sub-agent для
    паралелізації довгих завдань (кожен sub-agent споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Sub-agent](/uk/tools/subagents).

    Серйозне попередження: слабші або надмірно квантизовані моделі є більш вразливими до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Додатково: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі, не стираючи конфігурацію?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для поточної сесії)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - відредагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` з частковим об’єктом, якщо тільки ви не маєте наміру замінити всю конфігурацію.
    Для редагувань через RPC спочатку перевіряйте через `config.schema.lookup` і віддавайте перевагу `config.patch`. Payload lookup дає вам нормалізований шлях, поверхневу документацію/обмеження схеми та короткі описи безпосередніх дочірніх елементів.
    для часткових оновлень.
    Якщо ви все ж перезаписали конфігурацію, відновіть її з резервної копії або повторно виконайте `openclaw doctor` для виправлення.

    Документація: [Моделі](/uk/concepts/models), [Налаштування](/uk/cli/configure), [Конфігурація](/uk/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати self-hosted моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях до локальних моделей.

    Найшвидше налаштування:

    1. Установіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо ви хочете також хмарні моделі, виконайте `ollama signin`
    4. Виконайте `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає вам хмарні моделі плюс ваші локальні моделі Ollama
    - хмарні моделі, такі як `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі більш вразливі до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все ж хочете маленькі моделі, увімкніть ізоляцію та суворі allowlist інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Model providers](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Ізоляція](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися та змінюватися з часом; фіксованої рекомендації щодо provider немає.
    - Перевіряйте поточне налаштування під час виконання на кожному gateway за допомогою `openclaw models status`.
    - Для агентів, чутливих до безпеки / з увімкненими інструментами, використовуйте найсильнішу доступну модель останнього покоління.
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

    Це вбудовані псевдоніми. Власні псевдоніми можна додати через `agents.defaults.models`.

    Ви можете переглянути доступні моделі через `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований засіб вибору. Вибір за номером:

    ```
    /model 3
    ```

    Ви також можете примусово задати конкретний профіль автентифікації для provider (для поточної сесії):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується і який профіль автентифікації буде спробовано наступним.
    Він також показує налаштований endpoint provider (`baseUrl`) і режим API (`api`), коли це доступно.

    **Як відкріпити профіль, який я встановив через @profile?**

    Повторно виконайте `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо ви хочете повернутися до типового значення, виберіть його в `/model` (або надішліть `/model <provider/model за замовчуванням>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль автентифікації активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.5 для щоденних завдань, а Codex 5.5 — для програмування?">
    Так. Установіть одну як типову і перемикайтеся за потреби:

    - **Швидке перемикання (для сесії):** `/model gpt-5.5` для щоденних завдань, `/model openai-codex/gpt-5.5` для програмування з Codex OAuth.
    - **Типове значення + перемикання:** установіть `agents.defaults.model.primary` у `openai/gpt-5.5`, а потім перемикайтеся на `openai-codex/gpt-5.5` для програмування (або навпаки).
    - **Sub-agent:** маршрутизуйте завдання програмування до sub-agent із іншою типовою моделлю.

    Див. [Моделі](/uk/concepts/models) і [Слеш-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.5?">
    Використовуйте або перемикач для сесії, або типове значення в конфігурації:

    - **Для сесії:** надішліть `/fast on`, поки сесія використовує `openai/gpt-5.5` або `openai-codex/gpt-5.5`.
    - **Типове значення для моделі:** установіть `agents.defaults.models["openai/gpt-5.5"].params.fastMode` у `true`.
    - **Також для Codex OAuth:** якщо ви також використовуєте `openai-codex/gpt-5.5`, установіть той самий прапорець і там.

    Приклад:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
            "openai-codex/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Для OpenAI fast mode відповідає `service_tier = "priority"` у підтримуваних нативних запитах Responses. `/fast` для сесії має пріоритет над типовими значеннями конфігурації.

    Див. [Thinking і fast mode](/uk/tools/thinking) і [Fast mode OpenAI](/uk/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо встановлено `agents.defaults.models`, це стає **allowlist** для `/model` і будь-яких
    перевизначень сесії. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, приберіть allowlist або виберіть модель із `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **provider не налаштований** (не знайдено конфігурації provider MiniMax або профілю
    автентифікації), тому модель не вдається розв’язати.

    Контрольний список для виправлення:

    1. Оновіться до поточного релізу OpenClaw (або запускайте з вихідного коду `main`), а потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (через майстер або JSON), або що автентифікація MiniMax
       існує в env/профілях автентифікації, щоб можна було підставити відповідний provider
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений OAuth MiniMax
       для `minimax-portal`).
    3. Використовуйте точний ID моделі (з урахуванням регістру) для вашого шляху автентифікації:
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

  <Accordion title="Чи можу я використовувати MiniMax за замовчуванням, а OpenAI — для складних завдань?">
    Так. Використовуйте **MiniMax за замовчуванням** і перемикайте моделі **для окремої сесії** за потреби.
    Fallback призначені для **помилок**, а не для «складних завдань», тому використовуйте `/model` або окремого агента.

    **Варіант A: перемикання для окремої сесії**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
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

    - Типова модель агента A: MiniMax
    - Типова модель агента B: OpenAI
    - Маршрутизуйте за агентом або використовуйте `/agent` для перемикання

    Документація: [Моделі](/uk/concepts/models), [Маршрутизація Multi-Agent](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома скороченнями за замовчуванням (застосовуються лише тоді, коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви задаєте власний псевдонім із тією самою назвою, пріоритет матиме ваше значення.

  </Accordion>

  <Accordion title="Як визначати/перевизначати скорочення моделей (псевдоніми)?">
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

    Потім `/model sonnet` (або `/<alias>`, якщо це підтримується) розв’язується до цього ID моделі.

  </Accordion>

  <Accordion title="Як додати моделі від інших provider, наприклад OpenRouter або Z.AI?">
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

    Якщо ви посилаєтеся на provider/model, але потрібний ключ provider відсутній, ви отримаєте помилку автентифікації під час виконання (наприклад, `No API key found for provider "zai"`).

    **Після додавання нового агента з’являється повідомлення No API key found for provider**

    Зазвичай це означає, що **новий агент** має порожнє сховище автентифікації. Автентифікація є окремою для кожного агента і
    зберігається тут:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Виконайте `openclaw agents add <id>` і налаштуйте автентифікацію під час роботи майстра.
    - Або скопіюйте `auth-profiles.json` з `agentDir` основного агента в `agentDir` нового агента.

    **Не** використовуйте спільний `agentDir` для кількох агентів; це спричиняє конфлікти автентифікації/сесій.

  </Accordion>
</AccordionGroup>

## Fallback моделей і "All models failed"

<AccordionGroup>
  <Accordion title="Як працює fallback?">
    Fallback відбувається у два етапи:

    1. **Ротація профілів автентифікації** в межах того самого provider.
    2. **Fallback моделі** до наступної моделі в `agents.defaults.model.fallbacks`.

    До профілів, що збоять, застосовуються cooldown (експоненційний backoff), тому OpenClaw може й далі відповідати, навіть коли provider обмежений за rate limit або тимчасово не працює.

    Кошик rate limit включає не лише прості відповіді `429`. OpenClaw
    також вважає такими, що варті fallback, повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    ліміти вікон використання (`weekly/monthly limit reached`).

    Деякі відповіді, схожі на проблеми з білінгом, не є `402`, і деякі відповіді HTTP `402`
    також лишаються в цьому тимчасовому кошику. Якщо provider повертає
    явний текст про білінг у `401` або `403`, OpenClaw усе одно може залишити це в
    гілці білінгу, але текстові відповідники, специфічні для provider, лишаються в межах
    provider, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Якщо ж повідомлення `402`
    натомість схоже на повторюваний ліміт вікна використання або
    ліміт витрат organization/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw трактує це як
    `rate_limit`, а не як довготривале вимкнення через білінг.

    Помилки переповнення контексту відрізняються: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху Compaction/повторної спроби замість переходу до
    fallback моделі.

    Загальний текст server error навмисно вужчий, ніж «усе, що містить
    unknown/error». OpenClaw справді вважає такими, що варті fallback, перехідні форми, прив’язані до provider,
    як-от просте повідомлення Anthropic `An unknown error occurred`, просте повідомлення OpenRouter
    `Provider returned error`, помилки stop-reason, наприклад `Unhandled stop reason:
    error`, JSON-payload `api_error` з тимчасовим текстом серверної помилки
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості provider, як-от `ModelNotReadyException`, як сигнали
    timeout/overloaded, що варті fallback, коли збігається контекст provider.
    Загальний внутрішній fallback-текст на кшталт `LLM request failed with an unknown
    error.` лишається консервативним і сам по собі не запускає fallback моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система спробувала використати ID профілю автентифікації `anthropic:default`, але не змогла знайти для нього облікові дані в очікуваному сховищі автентифікації.

    **Контрольний список для виправлення:**

    - **Перевірте, де живуть профілі автентифікації** (нові та застарілі шляхи)
      - Поточний: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Переконайтеся, що Gateway завантажує вашу змінну середовища**
      - Якщо ви встановили `ANTHROPIC_API_KEY` у своїй оболонці, але запускаєте Gateway через systemd/launchd, він може її не успадкувати. Помістіть її в `~/.openclaw/.env` або ввімкніть `env.shellEnv`.
    - **Переконайтеся, що редагуєте правильного агента**
      - У multi-agent налаштуваннях може бути кілька файлів `auth-profiles.json`.
    - **Перевірте стан моделі/автентифікації**
      - Використовуйте `openclaw models status`, щоб побачити налаштовані моделі і чи провайдери автентифіковані.

    **Контрольний список для виправлення "No credentials found for profile anthropic"**

    Це означає, що запуск закріплено за профілем автентифікації Anthropic, але Gateway
    не може знайти його у своєму сховищі автентифікації.

    - **Використовуйте Claude CLI**
      - Виконайте `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо натомість ви хочете використовувати API key**
      - Помістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистіть будь-який закріплений порядок, який примусово вимагає відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Переконайтеся, що запускаєте команди на хості gateway**
      - У віддаленому режимі профілі автентифікації живуть на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому він також спробував Google Gemini і зазнав невдачі?">
    Якщо ваша конфігурація моделі включає Google Gemini як fallback (або ви перемкнулися на скорочення Gemini), OpenClaw спробує її під час fallback моделі. Якщо ви не налаштували облікові дані Google, побачите `No API key found for provider "google"`.

    Виправлення: або надайте автентифікацію Google, або приберіть/уникайте моделей Google в `agents.defaults.model.fallbacks` / aliases, щоб fallback не маршрутизував туди.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Причина: історія сесії містить **thinking-блоки без сигнатур** (часто після
    перерваного/часткового потоку). Google Antigravity вимагає сигнатури для thinking-блоків.

    Виправлення: тепер OpenClaw видаляє непідписані thinking-блоки для Google Antigravity Claude. Якщо проблема все ще з’являється, почніть **нову сесію** або встановіть `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Профілі автентифікації: що це і як ними керувати

Пов’язане: [/concepts/oauth](/uk/concepts/oauth) (OAuth flow, зберігання токенів, шаблони роботи з кількома обліковими записами)

<AccordionGroup>
  <Accordion title="Що таке профіль автентифікації?">
    Профіль автентифікації — це іменований запис облікових даних (OAuth або API key), прив’язаний до provider. Профілі зберігаються тут:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які типові ID профілів?">
    OpenClaw використовує ID з префіксом provider, наприклад:

    - `anthropic:default` (поширений варіант, коли немає email-ідентичності)
    - `anthropic:<email>` для OAuth-ідентичностей
    - власні ID, які ви вибираєте (наприклад, `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який профіль автентифікації буде спробовано першим?">
    Так. Конфігурація підтримує необов’язкові metadata для профілів і порядок для кожного provider (`auth.order.<provider>`). Це **не** зберігає секрети; воно зіставляє ID з provider/mode і задає порядок ротації.

    OpenClaw може тимчасово пропустити профіль, якщо він перебуває в короткому **cooldown** (rate limit/timeout/збій автентифікації) або в довшому стані **disabled** (білінг/недостатньо кредитів). Щоб перевірити це, виконайте `openclaw models status --json` і перегляньте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Cooldown для rate limit може бути прив’язаний до моделі. Профіль, який перебуває в cooldown
    для однієї моделі, усе ще може бути придатним для спорідненої моделі того самого provider,
    тоді як вікна billing/disabled усе одно блокують увесь профіль.

    Ви також можете встановити перевизначення порядку **для окремого агента** (зберігається в `auth-state.json` цього агента) через CLI:

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile (only try this one)
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Щоб націлитися на конкретного агента:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Щоб перевірити, що саме буде спробовано на практиці, використовуйте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено в явному порядку, probe повідомить
    `excluded_by_auth_order` для цього профілю замість того, щоб мовчки пробувати його.

  </Accordion>

  <Accordion title="OAuth чи API key — у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де це застосовно).
    - **API keys** використовують білінг за моделлю оплати за токени.

    Майстер явно підтримує Anthropic Claude CLI, OpenAI Codex OAuth і API keys.

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

  <Accordion title='Чому `openclaw gateway status` каже "Runtime: running", але "Connectivity probe: failed"?'>
    Тому що "running" — це погляд **supervisor** (launchd/systemd/schtasks). А probe підключення — це CLI, який реально намагається під’єднатися до gateway WebSocket.

    Використовуйте `openclaw gateway status` і довіряйте таким рядкам:

    - `Probe target:` (URL, який probe фактично використав)
    - `Listening:` (що реально прив’язано до порту)
    - `Last gateway error:` (типова першопричина, коли процес живий, але порт не слухає)

  </Accordion>

  <Accordion title='Чому `openclaw gateway status` показує різні "Config (cli)" і "Config (service)"?'>
    Ви редагуєте один файл конфігурації, а service працює з іншим (часто через невідповідність `--profile` / `OPENCLAW_STATE_DIR`).

    Виправлення:

    ```bash
    openclaw gateway install --force
    ```

    Запускайте це з того самого `--profile` / середовища, яке service має використовувати.

  </Accordion>

  <Accordion title='Що означає "another gateway instance is already listening"?'>
    OpenClaw примусово застосовує блокування runtime, негайно прив’язуючи слухач WebSocket під час запуску (типово `ws://127.0.0.1:18789`). Якщо прив’язка завершується помилкою `EADDRINUSE`, викидається `GatewayLockError`, що означає, що вже слухає інший інстанс.

    Виправлення: зупиніть інший інстанс, звільніть порт або запускайте з `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Як запустити OpenClaw у віддаленому режимі (клієнт підключається до Gateway десь в іншому місці)?">
    Установіть `gateway.mode: "remote"` і вкажіть віддалений URL WebSocket, за потреби з віддаленими обліковими даними спільного секрету:

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

    - `openclaw gateway` запускається лише коли `gateway.mode` має значення `local` (або якщо ви передасте прапорець перевизначення).
    - Застосунок macOS стежить за файлом конфігурації та динамічно перемикає режими, коли ці значення змінюються.
    - `gateway.remote.token` / `.password` — це лише клієнтські віддалені облікові дані; самі по собі вони не вмикають локальну автентифікацію gateway.

  </Accordion>

  <Accordion title='Control UI каже "unauthorized" (або постійно перепідключається). Що робити?'>
    Шлях автентифікації вашого gateway і метод автентифікації UI не збігаються.

    Факти (з коду):

    - Control UI зберігає токен у `sessionStorage` для поточної сесії вкладки браузера та вибраного URL gateway, тож оновлення в тій самій вкладці продовжують працювати без відновлення довготривалого збереження токена в localStorage.
    - Для `AUTH_TOKEN_MISMATCH` довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном пристрою, коли gateway повертає підказки для повтору (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Тепер ця повторна спроба з кешованим токеном повторно використовує кешовані схвалені scopes, збережені разом із токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` усе ще зберігають свій запитаний набір scopes замість успадкування кешованих scopes.
    - Поза цим шляхом повторної спроби пріоритет автентифікації підключення такий: явний спільний токен/пароль спочатку, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap-токен.
    - Перевірки scope bootstrap-токена мають префікс ролі. Вбудований allowlist bootstrap-оператора задовольняє лише запити оператора; node або інші ролі, що не є оператором, усе одно потребують scopes під власним префіксом ролі.

    Виправлення:

    - Найшвидше: `openclaw dashboard` (виводить + копіює URL dashboard, намагається відкрити; показує підказку SSH, якщо headless).
    - Якщо у вас ще немає токена: `openclaw doctor --generate-gateway-token`.
    - Якщо віддалено, спочатку зробіть tunnel: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`.
    - Режим спільного секрету: задайте `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, а потім вставте відповідний секрет у налаштуваннях Control UI.
    - Режим Tailscale Serve: переконайтеся, що `gateway.auth.allowTailscale` увімкнено і що ви відкриваєте URL Serve, а не сирий URL loopback/tailnet, який обходить заголовки ідентичності Tailscale.
    - Режим trusted-proxy: переконайтеся, що ви заходите через налаштований reverse proxy з awareness про ідентичність, не на loopback, а не через loopback-проксі на тому самому хості або сирий URL gateway.
    - Якщо невідповідність зберігається після однієї повторної спроби, замініть/повторно схваліть спарений токен пристрою:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Якщо ця команда rotate каже, що запит відхилено, перевірте дві речі:
      - сесії спарених пристроїв можуть замінювати лише **власний** пристрій, якщо тільки вони також не мають `operator.admin`
      - явні значення `--scope` не можуть перевищувати поточні operator scopes викликача
    - Усе ще не виходить? Виконайте `openclaw status --all` і дотримуйтесь [Усунення несправностей](/uk/gateway/troubleshooting). Деталі автентифікації див. в [Dashboard](/uk/web/dashboard).

  </Accordion>

  <Accordion title="Я встановив `gateway.bind tailnet`, але прив’язка не вдається й нічого не слухає">
    Прив’язка `tailnet` вибирає IP Tailscale з ваших мережевих інтерфейсів (100.64.0.0/10). Якщо машина не в Tailscale (або інтерфейс вимкнений), прив’язуватися нема до чого.

    Виправлення:

    - Запустіть Tailscale на цьому хості (щоб він мав адресу 100.x), або
    - перемкніться на `gateway.bind: "loopback"` / `"lan"`.

    Примітка: `tailnet` є явним режимом. `auto` надає перевагу loopback; використовуйте `gateway.bind: "tailnet"`, коли хочете прив’язку лише до tailnet.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька Gateway на одному хості?">
    Зазвичай ні — один Gateway може запускати кілька каналів обміну повідомленнями та агентів. Використовуйте кілька Gateway лише тоді, коли вам потрібна резервність (наприклад, rescue bot) або жорстка ізоляція.

    Так, але ви маєте ізолювати:

    - `OPENCLAW_CONFIG_PATH` (окрема конфігурація для кожного інстансу)
    - `OPENCLAW_STATE_DIR` (окремий стан для кожного інстансу)
    - `agents.defaults.workspace` (ізоляція робочого простору)
    - `gateway.port` (унікальні порти)

    Швидке налаштування (рекомендовано):

    - Використовуйте `openclaw --profile <name> ...` для кожного інстансу (автоматично створює `~/.openclaw-<name>`).
    - Установіть унікальний `gateway.port` у конфігурації кожного профілю (або передавайте `--port` для ручних запусків).
    - Установіть service для кожного профілю: `openclaw --profile <name> gateway install`.

    Профілі також додають суфікси до назв service (`ai.openclaw.<profile>`; застарілі `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Повний посібник: [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Що означає "invalid handshake" / code 1008?'>
    Gateway — це **WebSocket server**, і він очікує, що найпершим повідомленням
    буде frame `connect`. Якщо він отримує щось інше, то закриває з’єднання
    з **code 1008** (порушення політики).

    Поширені причини:

    - Ви відкрили **HTTP** URL у браузері (`http://...`) замість WS-клієнта.
    - Ви використали неправильний порт або шлях.
    - Проксі або tunnel видалив заголовки автентифікації чи надіслав не-Gateway-запит.

    Швидкі виправлення:

    1. Використовуйте WS URL: `ws://<host>:18789` (або `wss://...`, якщо HTTPS).
    2. Не відкривайте WS-порт у звичайній вкладці браузера.
    3. Якщо автентифікацію ввімкнено, включіть токен/пароль у frame `connect`.

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

    Ви можете задати стабільний шлях через `logging.file`. Рівень файлового журналу керується `logging.level`. Детальність консолі керується `--verbose` і `logging.consoleLevel`.

    Найшвидший перегляд хвоста журналу:

    ```bash
    openclaw logs --follow
    ```

    Журнали service/supervisor (коли gateway запускається через launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` і `gateway.err.log` (типово: `~/.openclaw/logs/...`; профілі використовують `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Докладніше див. в [Усуненні несправностей](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Як запустити/зупинити/перезапустити service Gateway?">
    Використовуйте допоміжні команди gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви запускаєте gateway вручну, `openclaw gateway --force` може повернути порт. Див. [Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Я закрив термінал у Windows — як перезапустити OpenClaw?">
    Є **два режими встановлення в Windows**:

    **1) WSL2 (рекомендовано):** Gateway працює всередині Linux.

    Відкрийте PowerShell, увійдіть у WSL, а потім перезапустіть:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви ніколи не встановлювали service, запустіть його у foreground:

    ```bash
    openclaw gateway run
    ```

    **2) Нативний Windows (не рекомендовано):** Gateway працює безпосередньо у Windows.

    Відкрийте PowerShell і виконайте:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви запускаєте його вручну (без service), використовуйте:

    ```powershell
    openclaw gateway run
    ```

    Документація: [Windows (WSL2)](/uk/platforms/windows), [Операційний посібник служби Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Gateway запущено, але відповіді так і не надходять. Що перевірити?">
    Почніть із швидкої перевірки працездатності:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Поширені причини:

    - Автентифікацію моделі не завантажено на **хості gateway** (перевірте `models status`).
    - Спарювання каналу/allowlist блокує відповіді (перевірте конфігурацію каналу + журнали).
    - WebChat/Dashboard відкрито без правильного токена.

    Якщо ви працюєте віддалено, переконайтеся, що з’єднання tunnel/Tailscale активне і що
    Gateway WebSocket доступний.

    Документація: [Канали](/uk/channels), [Усунення несправностей](/uk/gateway/troubleshooting), [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — що робити?'>
    Зазвичай це означає, що UI втратив з’єднання WebSocket. Перевірте:

    1. Чи працює Gateway? `openclaw gateway status`
    2. Чи справний Gateway? `openclaw status`
    3. Чи має UI правильний токен? `openclaw dashboard`
    4. Якщо віддалено, чи активне з’єднання tunnel/Tailscale?

    Потім перегляньте журнали:

    ```bash
    openclaw logs --follow
    ```

    Документація: [Dashboard](/uk/web/dashboard), [Віддалений доступ](/uk/gateway/remote), [Усунення несправностей](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="setMyCommands у Telegram завершується помилкою. Що перевірити?">
    Почніть із журналів і стану каналу:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Потім зіставте з помилкою:

    - `BOT_COMMANDS_TOO_MUCH`: у меню Telegram забагато записів. OpenClaw уже обрізає список до ліміту Telegram і повторює спробу з меншою кількістю команд, але деякі записи меню все одно потрібно прибрати. Зменште кількість команд Plugin/Skill/власних команд або вимкніть `channels.telegram.commands.native`, якщо меню вам не потрібне.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` або подібні мережеві помилки: якщо ви на VPS або за proxy, переконайтеся, що вихідний HTTPS дозволено і DNS працює для `api.telegram.org`.

    Якщо Gateway віддалений, переконайтеся, що ви дивитеся журнали на хості Gateway.

    Документація: [Telegram](/uk/channels/telegram), [Усунення несправностей каналів](/uk/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI не показує виводу. Що перевірити?">
    Спочатку переконайтеся, що Gateway доступний і агент може запускатися:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    У TUI використовуйте `/status`, щоб побачити поточний стан. Якщо ви очікуєте відповіді в чат-
    каналі, переконайтеся, що доставку ввімкнено (`/deliver on`).

    Документація: [TUI](/uk/web/tui), [Слеш-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як повністю зупинити, а потім запустити Gateway?">
    Якщо ви встановили service:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Це зупиняє/запускає **керовану service** (launchd на macOS, systemd на Linux).
    Використовуйте це, коли Gateway працює у фоновому режимі як daemon.

    Якщо ви запускаєте у foreground, зупиніть через Ctrl-C, а потім:

    ```bash
    openclaw gateway run
    ```

    Документація: [Операційний посібник служби Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="ELI5: `openclaw gateway restart` vs `openclaw gateway`">
    - `openclaw gateway restart`: перезапускає **фонову service** (launchd/systemd).
    - `openclaw gateway`: запускає gateway **у foreground** для цієї сесії термінала.

    Якщо ви встановили service, використовуйте команди gateway. Використовуйте `openclaw gateway`, коли
    вам потрібен одноразовий запуск у foreground.

  </Accordion>

  <Accordion title="Найшвидший спосіб отримати більше деталей, коли щось не працює">
    Запустіть Gateway з `--verbose`, щоб отримати більше деталей у консолі. Потім перевірте файл журналу на предмет автентифікації каналу, маршрутизації моделей і помилок RPC.
  </Accordion>
</AccordionGroup>

## Медіа та вкладення

<AccordionGroup>
  <Accordion title="Мій Skill згенерував зображення/PDF, але нічого не було надіслано">
    Вихідні вкладення від агента мають містити рядок `MEDIA:<path-or-url>` (в окремому рядку). Див. [Налаштування помічника OpenClaw](/uk/start/openclaw) і [Надсилання Agent](/uk/tools/agent-send).

    Надсилання через CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Також перевірте:

    - Цільовий канал підтримує вихідні медіа і не блокується allowlist.
    - Файл не перевищує ліміти розміру provider (зображення змінюють розмір до максимуму 2048px).
    - `tools.fs.workspaceOnly=true` обмежує надсилання локальних шляхів робочим простором, temp/media-store і файлами, перевіреними пісочницею.
    - `tools.fs.workspaceOnly=false` дозволяє `MEDIA:` надсилати локальні файли хоста, які агент уже може читати, але лише для медіа та безпечних типів документів (зображення, аудіо, відео, PDF і документи Office). Звичайні текстові та схожі на секрети файли все одно блокуються.

    Див. [Зображення](/uk/nodes/images).

  </Accordion>
</AccordionGroup>

## Безпека та контроль доступу

<AccordionGroup>
  <Accordion title="Чи безпечно відкривати OpenClaw для вхідних DM?">
    Розглядайте вхідні DM як недовірений вхідний вміст. Поведінка за замовчуванням спрямована на зменшення ризику:

    - Типова поведінка на каналах, що підтримують DM, — це **pairing**:
      - Невідомі відправники отримують код pairing; бот не обробляє їхнє повідомлення.
      - Погодження через: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Кількість pending-запитів обмежена **3 на канал**; перевірте `openclaw pairing list --channel <channel> [--account <id>]`, якщо код не надійшов.
    - Відкрити DM публічно можна лише через явне opt-in (`dmPolicy: "open"` і allowlist `"*"`).

    Запустіть `openclaw doctor`, щоб виявити ризиковані політики DM.

  </Accordion>

  <Accordion title="Чи стосується prompt injection лише публічних ботів?">
    Ні. Prompt injection стосується **недовіреного вмісту**, а не лише того, хто може написати боту в DM.
    Якщо ваш помічник читає зовнішній вміст (web search/fetch, сторінки в browser, email,
    документи, вкладення, вставлені журнали), цей вміст може містити інструкції, які намагаються
    перехопити керування моделлю. Це може статися, навіть якщо **ви єдиний відправник**.

    Найбільший ризик виникає, коли ввімкнено інструменти: модель можна змусити
    ексфільтрувати контекст або викликати інструменти від вашого імені. Зменшуйте радіус ураження так:

    - використовуйте агента-"читача" лише для читання або без інструментів, щоб підсумовувати недовірений вміст
    - тримайте `web_search` / `web_fetch` / `browser` вимкненими для агентів з увімкненими інструментами
    - також розглядайте декодований текст файлів/документів як недовірений: OpenResponses
      `input_file` і витягування з медіавкладень обгортають витягнутий текст у
      явні маркери меж зовнішнього вмісту замість передавання сирого тексту файла
    - використовуйте ізоляцію та суворі allowlist інструментів

    Подробиці: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи повинен мій бот мати окрему email, GitHub account або номер телефону?">
    Так, для більшості налаштувань. Ізоляція бота в окремих облікових записах і номерах телефону
    зменшує радіус ураження, якщо щось піде не так. Це також спрощує ротацію
    облікових даних або відкликання доступу без впливу на ваші особисті облікові записи.

    Починайте з малого. Надавайте доступ лише до тих інструментів і облікових записів, які вам справді потрібні, і розширюйте
    пізніше за потреби.

    Документація: [Безпека](/uk/gateway/security), [Pairing](/uk/channels/pairing).

  </Accordion>

  <Accordion title="Чи можу я надати йому автономність щодо моїх текстових повідомлень і чи це безпечно?">
    Ми **не** рекомендуємо повну автономність над вашими особистими повідомленнями. Найбезпечніший шаблон такий:

    - Тримайте DM у **режимі pairing** або зі строгим allowlist.
    - Використовуйте **окремий номер або обліковий запис**, якщо хочете, щоб він писав від вашого імені.
    - Дозвольте йому створити чернетку, а потім **погоджуйте перед надсиланням**.

    Якщо хочете поекспериментувати, робіть це на окремому обліковому записі та тримайте його ізольованим. Див.
    [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи можу я використовувати дешевші моделі для завдань персонального помічника?">
    Так, **якщо** агент працює лише в чаті, а вхідний вміст є довіреним. Менші моделі
    більш схильні до перехоплення інструкцій, тому уникайте їх для агентів з увімкненими інструментами
    або під час читання недовіреного вмісту. Якщо вам усе ж потрібна менша модель, обмежте
    інструменти й запускайте все в пісочниці. Див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Я виконав /start у Telegram, але не отримав код pairing">
    Коди pairing надсилаються **лише** коли невідомий відправник пише боту і
    ввімкнено `dmPolicy: "pairing"`. Сам по собі `/start` не генерує код.

    Перевірте pending-запити:

    ```bash
    openclaw pairing list telegram
    ```

    Якщо хочете негайний доступ, додайте свій sender id до allowlist або встановіть `dmPolicy: "open"`
    для цього облікового запису.

  </Accordion>

  <Accordion title="WhatsApp: чи буде він писати моїм контактам? Як працює pairing?">
    Ні. Типова політика WhatsApp DM — **pairing**. Невідомі відправники отримують лише код pairing, і їхнє повідомлення **не обробляється**. OpenClaw відповідає лише на чати, які він отримує, або на явні надсилання, які запускаєте ви.

    Погодження pairing через:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Перегляд pending-запитів:

    ```bash
    openclaw pairing list whatsapp
    ```

    Запит номера телефону в майстрі: він використовується для встановлення вашого **allowlist/owner**, щоб дозволити ваші власні DM. Він не використовується для автонadсилання. Якщо ви запускаєте на своєму особистому номері WhatsApp, використовуйте цей номер і ввімкніть `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Команди чату, скасування завдань і "він не зупиняється"

<AccordionGroup>
  <Accordion title="Як зробити, щоб внутрішні системні повідомлення не показувалися в чаті?">
    Більшість внутрішніх або службових повідомлень з’являються лише тоді, коли для цієї сесії ввімкнено
    **verbose**, **trace** або **reasoning**.

    Виправлення в тому чаті, де ви це бачите:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Якщо все ще надто шумно, перевірте налаштування сесії в Control UI і встановіть verbose
    у значення **inherit**. Також переконайтеся, що ви не використовуєте профіль бота з параметром `verboseDefault`,
    установленим у `on` у конфігурації.

    Документація: [Thinking і verbose](/uk/tools/thinking), [Безпека](/uk/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Як зупинити/скасувати запущене завдання?">
    Надішліть будь-що з цього **окремим повідомленням** (без слеша):

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

    Це тригери скасування (не слеш-команди).

    Для фонових процесів (з інструмента exec) ви можете попросити агента виконати:

    ```
    process action:kill sessionId:XXX
    ```

    Огляд слеш-команд: див. [Слеш-команди](/uk/tools/slash-commands).

    Більшість команд потрібно надсилати як **окреме** повідомлення, що починається з `/`, але кілька скорочень (наприклад, `/status`) також працюють inline для відправників в allowlist.

  </Accordion>

  <Accordion title='Як надіслати повідомлення Discord із Telegram? ("Cross-context messaging denied")'>
    OpenClaw типово блокує повідомлення **між різними provider**. Якщо виклик інструмента прив’язаний
    до Telegram, він не надсилатиме в Discord, якщо ви явно не дозволите це.

    Увімкніть крос-provider-повідомлення для агента:

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

    Після редагування конфігурації перезапустіть gateway.

  </Accordion>

  <Accordion title='Чому здається, що бот "ігнорує" швидку серію повідомлень?'>
    Режим черги визначає, як нові повідомлення взаємодіють із запуском, що вже виконується. Використовуйте `/queue`, щоб змінити режими:

    - `steer` — нові повідомлення перенаправляють поточне завдання
    - `followup` — повідомлення виконуються по одному
    - `collect` — пакетування повідомлень і одна відповідь (типово)
    - `steer-backlog` — спрямувати зараз, а потім обробити backlog
    - `interrupt` — скасувати поточний запуск і почати заново

    Можна додавати параметри на кшталт `debounce:2s cap:25 drop:summarize` для режимів followup.

  </Accordion>
</AccordionGroup>

## Інше

<AccordionGroup>
  <Accordion title='Яка типова модель для Anthropic з API key?'>
    В OpenClaw облікові дані та вибір моделі — це окремі речі. Установлення `ANTHROPIC_API_KEY` (або збереження API key Anthropic у профілях автентифікації) вмикає автентифікацію, але фактичною типовою моделлю є те, що ви налаштували в `agents.defaults.model.primary` (наприклад, `anthropic/claude-sonnet-4-6` або `anthropic/claude-opus-4-6`). Якщо ви бачите `No credentials found for profile "anthropic:default"`, це означає, що Gateway не зміг знайти облікові дані Anthropic в очікуваному `auth-profiles.json` для агента, який запущено.
  </Accordion>
</AccordionGroup>

---

Усе ще застрягли? Запитайте в [Discord](https://discord.com/invite/clawd) або відкрийте [обговорення GitHub](https://github.com/openclaw/openclaw/discussions).
