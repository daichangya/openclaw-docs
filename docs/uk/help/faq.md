---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час виконання
    - Сортування проблем, про які повідомляють користувачі, перед глибшим налагодженням
summary: Часті запитання про налаштування, конфігурацію та використання OpenClaw
title: Часті запитання
x-i18n:
    generated_at: "2026-04-23T23:00:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61aa2812b8c1c8b7f0f611bc3990e79c96b2fd3b4965258cf6eb975f62f427c8
    source_path: help/faq.md
    workflow: 15
---

Швидкі відповіді та глибше усунення несправностей для реальних середовищ (локальна розробка, VPS, мультиагентність, OAuth/API-ключі, резервне перемикання моделей). Для діагностики під час виконання див. [Усунення несправностей](/uk/gateway/troubleshooting). Для повного довідника з конфігурації див. [Конфігурація](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламано

1. **Швидкий стан (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидке локальне зведення: ОС + оновлення, доступність gateway/service, агенти/сесії, конфігурація провайдера + проблеми під час виконання (коли Gateway доступний).

2. **Звіт, який можна вставити (безпечний для поширення)**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з хвостом журналу (токени приховано).

3. **Стан демона + порту**

   ```bash
   openclaw gateway status
   ```

   Показує стан runtime супервізора проти доступності RPC, цільовий URL для probe і те, яку конфігурацію сервіс, імовірно, використав.

4. **Глибокі probe**

   ```bash
   openclaw status --deep
   ```

   Виконує живий probe стану Gateway, включно з probe каналів, якщо підтримується
   (потрібен доступний Gateway). Див. [Стан](/uk/gateway/health).

5. **Перегляньте останній журнал**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використовуйте резервний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові журнали відокремлені від журналів сервісу; див. [Журналювання](/uk/logging) і [Усунення несправностей](/uk/gateway/troubleshooting).

6. **Запустіть doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує конфігурацію/стан + виконує перевірки стану. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # показує цільовий URL + шлях до конфігурації у разі помилок
   ```

   Запитує в запущеного Gateway повний знімок (лише WS). Див. [Стан](/uk/gateway/health).

## Швидкий старт і початкове налаштування

<AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб зрушити з місця">
    Використовуйте локального AI-агента, який може **бачити вашу машину**. Це набагато ефективніше, ніж запитувати
    в Discord, тому що більшість випадків «я застряг» — це **локальні проблеми конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти журнали та допомагати виправляти
    налаштування на рівні машини (PATH, сервіси, дозволи, файли автентифікації). Надайте їм **повну вихідну копію**
    через придатне до змін установлення (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з git checkout**, тож агент може читати код + документацію та
    міркувати про точну версію, яку ви запускаєте. Ви завжди можете повернутися до стабільної версії пізніше,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати й контролювати** виправлення (крок за кроком), а потім виконати лише
    потрібні команди. Так зміни залишаються невеликими, і їх легше перевірити.

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

    - `openclaw status`: швидкий знімок стану gateway/agent + базова конфігурація.
    - `openclaw models status`: перевіряє автентифікацію провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє типові проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламано](#first-60-seconds-if-something-is-broken).
    Документація з установлення: [Установлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску Heartbeat:

    - `quiet-hours`: поза налаштованим вікном активних годин
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожню/шаблонну структуру із заголовками
    - `no-tasks-due`: активний режим завдань `HEARTBEAT.md`, але ще не настав час для жодного інтервалу завдань
    - `alerts-disabled`: усю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові мітки настання строку оновлюються лише після завершення реального запуску heartbeat.
    Пропущені запуски не позначають завдання як завершені.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановлення й налаштування OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання онбордингу:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично зібрати ресурси UI. Після онбордингу ви зазвичай запускаєте Gateway на порту **18789**.

    Із вихідного коду (для контриб’юторів/розробників):

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    pnpm ui:build
    openclaw onboard
    ```

    Якщо у вас ще немає глобального встановлення, запускайте це через `pnpm openclaw onboard`.

  </Accordion>

  <Accordion title="Як відкрити dashboard після онбордингу?">
    Майстер відкриває ваш браузер із чистим URL dashboard (без токенів) одразу після онбордингу та також виводить посилання в підсумку. Тримайте цю вкладку відкритою; якщо вона не запустилася, скопіюйте/вставте надрукований URL на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується автентифікація за shared secret, вставте налаштований токен або пароль у налаштуваннях Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо shared secret ще не налаштовано, згенеруйте токен за допомогою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште bind на loopback, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставлення shared secret, за умови довіреного хоста gateway); HTTP API усе ще вимагають автентифікації через shared secret, якщо ви навмисно не використовуєте private-ingress `none` або HTTP-автентифікацію trusted-proxy.
      Некоректні паралельні спроби автентифікації Serve від того самого клієнта серіалізуються до того, як обмежувач невдалої автентифікації зафіксує їх, тому друга невдала повторна спроба вже може показати `retry later`.
    - **Tailnet bind**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний shared secret у налаштуваннях dashboard.
    - **Reverse proxy з урахуванням ідентичності**: залиште Gateway за trusted proxy не на loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL proxy.
    - **SSH-тунель**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`. Автентифікація через shared secret усе ще застосовується через тунель; вставте налаштований токен або пароль, якщо буде запит.

    Див. [Dashboard](/uk/web/dashboard) і [Веб-поверхні](/uk/web) для подробиць про режими bind та автентифікацію.

  </Accordion>

  <Accordion title="Чому існують дві конфігурації підтвердження exec для підтверджень у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на підтвердження до призначень чату
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом підтвердження для підтверджень exec

    Політика exec на хості все одно є справжнім бар’єром підтвердження. Конфігурація чату лише визначає, де з’являються
    запити на підтвердження і як люди можуть на них відповідати.

    У більшості середовищ вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди й відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначати тих, хто підтверджує, OpenClaw тепер автоматично вмикає нативні підтвердження DM-first, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки підтвердження, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve`, лише якщо результат інструмента каже, що підтвердження в чаті недоступні або ручне підтвердження — єдиний шлях.
    - Використовуйте `approvals.exec` лише тоді, коли запити також потрібно пересилати в інші чати або явні операційні кімнати.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише тоді, коли ви явно хочете, щоб запити на підтвердження публікувалися назад у вихідну кімнату/тему.
    - Підтвердження Plugin знову ж таки окремі: вони за замовчуванням використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали зберігають додаткову нативну обробку підтверджень Plugin.

    Коротко: пересилання — для маршрутизації, конфігурація нативного клієнта — для багатшого UX, специфічного для каналу.
    Див. [Підтвердження Exec](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке runtime потрібне?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендовано** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легкий — у документації вказано, що для особистого використання достатньо **512 МБ–1 ГБ RAM**, **1 ядра** і приблизно **500 МБ**
    диска, а також зазначено, що **Raspberry Pi 4 може його запускати**.

    Якщо вам потрібен додатковий запас (журнали, медіа, інші сервіси), **2 ГБ рекомендовано**, але
    це не жорсткий мінімум.

    Порада: невеликий Pi/VPS може розміщувати Gateway, а ви можете під’єднати **nodes** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Є поради щодо встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте шорсткі місця.

    - Використовуйте **64-бітну** ОС і Node >= 22.
    - Віддавайте перевагу **придатному до змін установленню (git)**, щоб бачити журнали й швидко оновлюватися.
    - Починайте без каналів/Skills, а потім додавайте їх по одному.
    - Якщо натрапляєте на дивні проблеми з бінарними файлами, зазвичай це проблема **сумісності ARM**.

    Документація: [Linux](/uk/platforms/linux), [Установлення](/uk/install).

  </Accordion>

  <Accordion title="Зависло на wake up my friend / онбординг не вилуплюється. Що тепер?">
    Цей екран залежить від доступності й автентифікації Gateway. TUI також автоматично надсилає
    «Wake up, my friend!» під час першого вилуплення. Якщо ви бачите цей рядок **без відповіді**
    і кількість токенів залишається 0, агент так і не запустився.

    1. Перезапустіть Gateway:

    ```bash
    openclaw gateway restart
    ```

    2. Перевірте стан + автентифікацію:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    3. Якщо все ще зависає, виконайте:

    ```bash
    openclaw doctor
    ```

    Якщо Gateway віддалений, переконайтеся, що тунель/Tailscale-з’єднання активне і що UI
    спрямований на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє середовище на нову машину (Mac mini), не проходячи онбординг заново?">
    Так. Скопіюйте **каталог стану** і **робочий простір**, а потім один раз запустіть Doctor. Це
    збереже вашого бота «точно таким самим» (пам’ять, історія сесій, автентифікація та стан
    каналів), якщо ви скопіюєте **обидва** розташування:

    1. Установіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій робочий простір (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть сервіс Gateway.

    Це зберігає конфігурацію, профілі автентифікації, облікові дані WhatsApp, сесії та пам’ять. Якщо ви працюєте
    у віддаленому режимі, пам’ятайте, що саме хост gateway володіє сховищем сесій і робочим простором.

    **Важливо:** якщо ви лише комітите/надсилаєте свій робочий простір до GitHub, ви створюєте резервну копію
    **пам’яті + bootstrap-файлів**, але **не** історії сесій чи автентифікації. Вони зберігаються
    у `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Міграція](/uk/install/migrating), [Де що зберігається на диску](#where-things-live-on-disk),
    [Робочий простір агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перегляньте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи — зверху. Якщо верхній розділ позначений як **Unreleased**, то наступний датований
    розділ є останньою випущеною версією. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (а також за розділами документації/іншими, коли потрібно).

  </Accordion>

  <Accordion title="Не вдається відкрити docs.openclaw.ai (помилка SSL)">
    Деякі з’єднання Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до allowlist, а потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати сайт, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркально доступна на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable-реліз спочатку потрапляє в **beta**, а потім явний
    крок просування переміщує ту саму версію в `latest`. Супровідники також можуть
    за потреби публікувати одразу в `latest`. Саме тому beta і stable можуть
    вказувати на **одну й ту саму версію** після просування.

    Подивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди для встановлення та різницю між beta і dev див. у розкривному блоці нижче.

  </Accordion>

  <Accordion title="Як установити beta-версію і в чому різниця між beta та dev?">
    **Beta** — це npm dist-tag `beta` (може збігатися з `latest` після просування).
    **Dev** — це рухома голова `main` (git); під час публікації вона використовує npm dist-tag `dev`.

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

  <Accordion title="Як спробувати найновіші можливості?">
    Є два варіанти:

    1. **Канал dev (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає вас на гілку `main` і оновлює з вихідного коду.

    2. **Придатне до змін установлення (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це надає вам локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому ручному клонуванню, використовуйте:

    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    pnpm install
    pnpm build
    ```

    Документація: [Оновлення](/uk/cli/update), [Канали розробки](/uk/install/development-channels),
    [Установлення](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай триває встановлення та онбординг?">
    Приблизно:

    - **Установлення:** 2–5 хвилин
    - **Онбординг:** 5–15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо процес зависає, використовуйте [Застряг інсталятор](#quick-start-and-first-run-setup)
    і швидкий цикл налагодження в [Я застряг](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Інсталятор завис? Як отримати більше зворотного зв’язку?">
    Повторно запустіть інсталятор із **докладним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Установлення beta з докладним виводом:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Для придатного до змін установлення (git):

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

  <Accordion title="Під час встановлення на Windows з’являється повідомлення git not found або openclaw not recognized">
    Дві поширені проблеми Windows:

    **1) Помилка npm spawn git / git not found**

    - Установіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, а потім повторно запустіть інсталятор.

    **2) openclaw is not recognized після встановлення**

    - Глобальна папка bin для npm відсутня в PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до свого PATH користувача (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Після оновлення PATH закрийте й знову відкрийте PowerShell.

    Якщо ви хочете максимально зручне середовище на Windows, використовуйте **WSL2** замість нативного Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У Windows вивід exec показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність кодової сторінки консолі в нативних оболонках Windows.

    Симптоми:

    - Вивід `system.run`/`exec` показує китайський текст як mojibake
    - Та сама команда виглядає нормально в іншому профілі термінала

    Швидкий обхідний варіант у PowerShell:

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

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використовуйте **придатне до змін установлення (git)**, щоб локально мати повний вихідний код і документацію, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг читати репозиторій і точно відповідати.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Установлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як установити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтеся посібника для Linux, а потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення сервісу: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Установлення та оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як установити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Установіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де посібники зі встановлення в хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Виберіть одного та дотримуйтеся посібника:

    - [Хостинг VPS](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    з ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан + робочий простір
    зберігаються на сервері, тож сприймайте хост як джерело істини й робіть його резервні копії.

    Ви можете під’єднати **nodes** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримати доступ
    до локального екрана/камери/canvas або запускати команди на своєму ноутбуці, зберігаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes).

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

    Якщо все ж потрібно автоматизувати це через агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/uk/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить онбординг?">
    `openclaw onboard` — це рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth провайдера, API-ключі, setup-token Anthropic, а також варіанти локальних моделей, як-от LM Studio)
    - Розташування **робочого простору** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані channel plugins, як-от QQ Bot)
    - **Установлення демона** (LaunchAgent на macOS; користувацький модуль systemd на Linux/WSL2)
    - **Перевірки стану** та вибір **Skills**

    Він також попереджає, якщо налаштована вами модель невідома або для неї відсутня автентифікація.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб запустити це?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації в цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **API-ключ Anthropic**: звичайна оплата Anthropic API
    - **Автентифікація Claude CLI / підписки Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, доки Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway API-ключі Anthropic усе ще є більш
    передбачуваним варіантом. OAuth OpenAI Codex явно підтримується для зовнішніх
    інструментів, таких як OpenClaw.

    OpenClaw також підтримує інші розміщені варіанти на кшталт підписки, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [GLM Models](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API-ключа?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тож
    OpenClaw вважає автентифікацію через підписку Claude і використання `claude -p`
    санкціонованими для цієї інтеграції, якщо тільки Anthropic не опублікує нову політику. Якщо вам потрібен
    найбільш передбачуваний варіант налаштування на стороні сервера, натомість використовуйте API-ключ Anthropic.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тому OpenClaw вважає
    повторне використання Claude CLI і використання `claude -p` санкціонованими для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    Setup-token Anthropic усе ще доступний як підтримуваний шлях токена в OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI та `claude -p`, коли це доступно.
    Для production або багатокористувацьких навантажень автентифікація через API-ключ Anthropic усе ще є
    безпечнішим і більш передбачуваним вибором. Якщо вам потрібні інші розміщені варіанти на кшталт підписки
    в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/glm).

  </Accordion>

</AccordionGroup>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>

<AccordionGroup>
  <Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
    Це означає, що вашу **квоту/ліміт частоти Anthropic** вичерпано для поточного вікна. Якщо ви
    використовуєте **Claude CLI**, дочекайтеся скидання вікна або підвищте свій план. Якщо ви
    використовуєте **API-ключ Anthropic**, перевірте Anthropic Console
    щодо використання/білінгу та за потреби підвищте ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, запит намагається використати
    1M context beta Anthropic (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані мають право на білінг довгого контексту (білінг через API-ключ або
    шлях входу Claude OpenClaw з увімкненим Extra Usage).

    Порада: задайте **резервну модель**, щоб OpenClaw міг продовжувати відповідати, поки провайдер обмежений за rate limit.
    Див. [Моделі](/uk/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудований провайдер **Amazon Bedrock (Converse)**. Якщо наявні маркери середовища AWS, OpenClaw може автоматично виявити каталог потокових/текстових моделей Bedrock і додати його як неявний провайдер `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний proxy перед Bedrock також залишається коректним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Використовуйте
    `openai-codex/gpt-5.5` для OAuth Codex через стандартний runner PI. Використовуйте
    `openai/gpt-5.4` для поточного прямого доступу через API-ключ OpenAI. Прямий
    доступ до GPT-5.5 через API-ключ підтримується, щойно OpenAI ввімкне його в публічному API; наразі
    GPT-5.5 використовує підписку/OAuth через `openai-codex/gpt-5.5` або нативні запуски app-server Codex з `openai/gpt-5.5` і `embeddedHarness.runtime: "codex"`.
    Див. [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому OpenClaw усе ще згадує openai-codex?">
    `openai-codex` — це id провайдера і профілю автентифікації для OAuth ChatGPT/Codex.
    Це також явний префікс моделі PI для OAuth Codex:

    - `openai/gpt-5.4` = поточний прямий маршрут API-ключа OpenAI у PI
    - `openai/gpt-5.5` = майбутній прямий маршрут API-ключа, щойно OpenAI ввімкне GPT-5.5 в API
    - `openai-codex/gpt-5.5` = маршрут OAuth Codex у PI
    - `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` = нативний маршрут app-server Codex
    - `openai-codex:...` = id профілю автентифікації, а не посилання на модель

    Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform, задайте
    `OPENAI_API_KEY`. Якщо вам потрібна автентифікація за підпискою ChatGPT/Codex, увійдіть через
    `openclaw models auth login --provider openai-codex` і використовуйте
    посилання на моделі `openai-codex/*` для запусків PI.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT у вебі?">
    Codex OAuth використовує вікна квот, керовані OpenAI та залежні від плану. На практиці
    ці ліміти можуть відрізнятися від роботи вебсайту/застосунку ChatGPT, навіть якщо
    обидва прив’язані до одного облікового запису.

    OpenClaw може показувати поточні видимі вікна використання/квот провайдера у
    `openclaw models status`, але він не вигадує й не нормалізує права ChatGPT у вебі
    в прямий доступ API. Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API-ключем.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth підписки OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання OAuth підписки у зовнішніх інструментах/робочих процесах,
    таких як OpenClaw. Онбординг може виконати OAuth-потік за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **Plugin-потік автентифікації**, а не client id чи secret у `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Модель за замовчуванням після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити завершуються помилкою, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає OAuth-токени в профілях автентифікації на хості gateway. Докладніше: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; малі карти обрізають і спричиняють витоки. Якщо все ж потрібно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі збільшують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як утримати трафік розміщеної моделі в певному регіоні?">
    Вибирайте endpoint-и з прив’язкою до регіону. OpenRouter надає варіанти з хостингом у США для MiniMax, Kimi та GLM; виберіть варіант із хостингом у США, щоб зберігати дані в регіоні. Ви все одно можете вказувати Anthropic/OpenAI поруч із ними, використовуючи `models.mode: "merge"`, щоб резервні варіанти залишалися доступними, одночасно дотримуючись вибраного вами регіонального провайдера.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб установити це?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini не є обов’язковим — деякі люди
    купують його як постійно ввімкнений хост, але також підійде невеликий VPS, домашній сервер або пристрій класу Raspberry Pi.

    Mac вам потрібен лише для **інструментів, доступних тільки на macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти тільки для macOS, запускайте Gateway на Mac або під’єднайте macOS Node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, на якому виконано вхід у Messages. Це **не обов’язково** має бути Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, а Gateway може працювати на Linux або деінде.

    Поширені варіанти налаштування:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, на якому виконано вхід у Messages.
    - Запускайте все на Mac, якщо хочете найпростішу конфігурацію з однією машиною.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи зможу я під’єднати його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може під’єднуватися як
    **Node** (додатковий пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, як-от screen/camera/canvas і `system.run` на цьому пристрої.

    Поширений шаблон:

    - Gateway на Mac mini (завжди ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост Node і виконує pairing з Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендовано**. Ми бачимо помилки runtime, особливо з WhatsApp і Telegram.
    Для стабільних Gateway використовуйте **Node**.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на непродукційному Gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що має бути в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Налаштування запитує лише числові user ID. Якщо у вас уже є застарілі записи `@username` у конфігурації, `openclaw doctor --fix` може спробувати їх розв’язати.

    Безпечніший варіант (без стороннього бота):

    - Надішліть DM своєму боту, потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Надішліть DM своєму боту, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній сервіс (менше приватності):

    - Надішліть DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **маршрутизацію мультиагентності**. Прив’яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, E.164 відправника, наприклад `+15551234567`) до іншого `agentId`, щоб кожна людина мала власний робочий простір і сховище сесій. Відповіді все одно надходитимуть із **того самого облікового запису WhatsApp**, а контроль доступу до DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Маршрутизація мультиагентності](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "швидкий чат" і агента "Opus для програмування"?'>
    Так. Використовуйте маршрутизацію мультиагентності: задайте кожному агенту власну модель за замовчуванням, а потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретні peer) до кожного агента. Приклад конфігурації наведено в [Маршрутизація мультиагентності](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, установлені через `brew`, розв’язувалися в оболонках без входу в систему.
    Останні збірки також додають поширені каталоги користувацьких бінарних файлів на початок PATH у сервісах Linux systemd (наприклад, `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо їх задано.

  </Accordion>

  <Accordion title="Різниця між придатним до змін git-установленням і npm install">
    - **Придатне до змін установлення (git):** повний checkout вихідного коду, можна редагувати, найкраще для контриб’юторів.
      Ви локально запускаєте збірки й можете вносити зміни в код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію «просто запустити».
      Оновлення надходять через npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm і git-установленнями?">
    Так. Установіть інший варіант, а потім запустіть Doctor, щоб сервіс gateway вказував на нову точку входу.
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

    Doctor виявляє невідповідність точки входу сервісу gateway і пропонує переписати конфігурацію сервісу відповідно до поточного встановлення (в автоматизації використовуйте `--repair`).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібен
    найменший тертя і вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Переваги:** без вартості сервера, прямий доступ до локальних файлів, видиме вікно браузера.
    - **Недоліки:** сон/обриви мережі = розриви з’єднання, оновлення ОС/перезавантаження переривають роботу, машина має бути активною.

    **VPS / хмара**

    - **Переваги:** постійно ввімкнено, стабільна мережа, немає проблем зі сном ноутбука, легше підтримувати безперервну роботу.
    - **Недоліки:** часто працює без екрана (використовуйте знімки екрана), лише віддалений доступ до файлів, для оновлень потрібен SSH.

    **Примітка, специфічна для OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord усі добре працюють на VPS. Єдиний справжній компроміс — **браузер у headless-режимі** проти видимого вікна. Див. [Браузер](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо у вас раніше були розриви gateway. Локальний запуск чудово підходить, коли ви активно працюєте на Mac і хочете доступу до локальних файлів або автоматизації UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Не обов’язково, але **рекомендовано для надійності та ізоляції**.

    - **Окремий хост (VPS/Mac mini/Pi):** постійно ввімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, легше підтримувати роботу.
    - **Спільний ноутбук/настільний ПК:** цілком нормально для тестування й активного використання, але очікуйте пауз, коли машина засинає або оновлюється.

    Якщо ви хочете найкраще з обох світів, тримайте Gateway на окремому хості й під’єднайте свій ноутбук як **Node** для локальних інструментів screen/camera/exec. Див. [Nodes](/uk/nodes).
    Для рекомендацій щодо безпеки читайте [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яку ОС рекомендовано?">
    OpenClaw є легким. Для базового Gateway + одного чат-каналу:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM, ~500 МБ диска.
    - **Рекомендовано:** 1–2 vCPU, 2 ГБ RAM або більше для запасу (журнали, медіа, кілька каналів). Інструменти Node і автоматизація браузера можуть бути ресурсомісткими.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях установлення для Linux найкраще протестовано саме там.

    Документація: [Linux](/uk/platforms/linux), [VPS hosting](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути постійно ввімкненою, доступною та мати достатньо
    RAM для Gateway і будь-яких каналів, які ви вмикаєте.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM.
    - **Рекомендовано:** 2 ГБ RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера чи медіаінструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви працюєте на Windows, **WSL2 — це найпростіший варіант у стилі VM** і він має найкращу
    сумісність із інструментами. Див. [Windows](/uk/platforms/windows), [VPS hosting](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw, в одному абзаці?">
    OpenClaw — це персональний AI-помічник, який ви запускаєте на власних пристроях. Він відповідає у вже знайомих вам середовищах обміну повідомленнями (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, а також у вбудованих channel plugins, таких як QQ Bot) і також може працювати з голосом + live Canvas на підтримуваних платформах. **Gateway** — це завжди ввімкнена control plane; помічник — це продукт.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не «просто обгортка над Claude». Це **локальна control plane**, яка дозволяє вам запускати
    потужного помічника на **вашому власному обладнанні**, доступного з уже знайомих вам чат-застосунків, із
    сесіями зі станом, пам’яттю та інструментами — без передачі контролю над вашими робочими процесами
    розміщеному SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і зберігайте
      робочий простір + історію сесій локально.
    - **Справжні канали, а не вебпісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      а також мобільний голос і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо, з маршрутизацією
      та резервним перемиканням на рівні агента.
    - **Варіант лише локально:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо хочете.
    - **Маршрутизація мультиагентності:** окремі агенти для каналу, облікового запису або завдання, кожен зі своїм
      робочим простором і типовими налаштуваннями.
    - **Відкритий код і придатність до змін:** перевіряйте, розширюйте й самостійно хостіть без прив’язки до вендора.

    Документація: [Gateway](/uk/gateway), [Канали](/uk/channels), [Мультиагентність](/uk/concepts/multi-agent),
    [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував — що мені зробити спочатку?">
    Хороші перші проєкти:

    - Створити вебсайт (WordPress, Shopify або простий статичний сайт).
    - Прототипувати мобільний застосунок (структура, екрани, план API).
    - Упорядкувати файли й папки (очищення, назви, теги).
    - Під’єднати Gmail і автоматизувати зведення або подальші дії.

    Він може обробляти великі завдання, але найкраще працює, коли ви ділите їх на етапи
    і використовуєте субагентів для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найкращих повсякденних сценаріїв використання OpenClaw?">
    Повсякденна користь зазвичай виглядає так:

    - **Персональні зведення:** підсумки вхідних, календаря та новин, які вас цікавлять.
    - **Дослідження й підготовка чернеток:** швидке дослідження, зведення та перші чернетки для листів або документів.
    - **Нагадування та подальші дії:** підштовхування та чеклісти на основі Cron або Heartbeat.
    - **Автоматизація браузера:** заповнення форм, збирання даних і повторювані вебзавдання.
    - **Координація між пристроями:** надішліть завдання з телефона, дозвольте Gateway виконати його на сервері й отримайте результат назад у чаті.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, рекламою та блогами для SaaS?">
    Так — для **дослідження, кваліфікації та підготовки чернеток**. Він може сканувати сайти, будувати shortlists,
    узагальнювати потенційних клієнтів і писати чернетки outreach або рекламних текстів.

    Для **outreach або запуску реклами** залишайте людину в контурі. Уникайте спаму, дотримуйтеся місцевих законів і
    політик платформ, а також перевіряйте все перед надсиланням. Найбезпечніший шаблон — дозволити
    OpenClaw створити чернетку, а вам її затвердити.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний помічник** і рівень координації, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу програмування всередині репозиторію. Використовуйте OpenClaw, коли вам
    потрібні довготривала пам’ять, доступ із різних пристроїв і оркестрація інструментів.

    Переваги:

    - **Постійна пам’ять + робочий простір** між сесіями
    - **Багатоплатформний доступ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (браузер, файли, розклад, хуки)
    - **Завжди ввімкнений Gateway** (запуск на VPS, взаємодія звідусіль)
    - **Nodes** для локального browser/screen/camera/exec

    Вітрина: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills і автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати Skills, не забруднюючи репозиторій?">
    Використовуйте керовані перевизначення замість редагування копії в репозиторії. Помістіть свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`, тож керовані перевизначення все одно мають пріоритет над вбудованими Skills без змін у git. Якщо вам потрібно встановити Skill глобально, але зробити його видимим лише для деяких агентів, тримайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` і `agents.list[].skills`. Лише зміни, варті внесення в основний код, мають жити в репозиторії та надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати Skills із власної папки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий порядок пріоритету: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`. `clawhub` за замовчуванням встановлює в `./skills`, що OpenClaw розглядає як `<workspace>/skills` у наступній сесії. Якщо Skill має бути видимим лише певним агентам, поєднуйте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як я можу використовувати різні моделі для різних завдань?">
    Сьогодні підтримуються такі шаблони:

    - **Cron jobs**: ізольовані завдання можуть задавати перевизначення `model` для кожного завдання.
    - **Субагенти**: маршрутизуйте завдання до окремих агентів з різними моделями за замовчуванням.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб у будь-який момент змінити модель поточної сесії.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Маршрутизація мультиагентності](/uk/concepts/multi-agent) і [Команди зі скісною рискою](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як винести це навантаження окремо?">
    Використовуйте **субагентів** для довгих або паралельних завдань. Субагенти працюють у власній сесії,
    повертають зведення й залишають ваш основний чат чутливим до взаємодії.

    Попросіть бота «запустити субагента для цього завдання» або використовуйте `/subagents`.
    Використовуйте `/status` у чаті, щоб бачити, що Gateway робить просто зараз (і чи він зайнятий).

    Порада щодо токенів: і довгі завдання, і субагенти споживають токени. Якщо вартість важлива, задайте
    дешевшу модель для субагентів через `agents.defaults.subagents.model`.

    Документація: [Субагенти](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють прив’язані до тредів сесії субагентів у Discord?">
    Використовуйте прив’язки тредів. Ви можете прив’язати тред Discord до субагента або цілі сесії, щоб подальші повідомлення в цьому треді залишалися в межах прив’язаної сесії.

    Базовий процес:

    - Запустіть через `sessions_spawn` з `thread: true` (і, за бажанням, `mode: "session"` для постійших подальших дій).
    - Або вручну прив’яжіть через `/focus <target>`.
    - Використовуйте `/agents`, щоб перевірити стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним зняттям фокусу.
    - Використовуйте `/unfocus`, щоб від’єднати тред.

    Потрібна конфігурація:

    - Глобальні значення за замовчуванням: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Перевизначення Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоприв’язка під час spawn: установіть `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Субагенти](/uk/tools/subagents), [Discord](/uk/channels/discord), [Довідник із конфігурації](/uk/gateway/configuration-reference), [Команди зі скісною рискою](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Субагент завершив роботу, але повідомлення про завершення надійшло не туди або взагалі не було опубліковане. Що перевірити?">
    Спочатку перевірте визначений маршрут запитувача:

    - Доставка субагента в режимі завершення надає перевагу будь-якому прив’язаному треду або маршруту розмови, якщо такий існує.
    - Якщо походження завершення містить лише канал, OpenClaw повертається до збереженого маршруту сесії запитувача (`lastChannel` / `lastTo` / `lastAccountId`), щоб пряма доставка все одно могла спрацювати.
    - Якщо немає ані прив’язаного маршруту, ані придатного збереженого маршруту, пряма доставка може не вдатися, і результат замість негайної публікації в чаті переходить до черги доставки сесії.
    - Некоректні або застарілі цілі все ще можуть змусити перейти до черги або спричинити остаточну помилку доставки.
    - Якщо остання видима відповідь помічника в дочірній сесії — це точний тихий токен `NO_REPLY` / `no_reply` або рівно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує оголошення замість публікації застарілого попереднього прогресу.
    - Якщо дочірня сесія вичерпала час лише після викликів інструментів, оголошення може згорнути це до короткого зведення часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Субагенти](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks), [Інструменти сесії](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron виконується всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання не запускатимуться.

    Контрольний список:

    - Переконайтеся, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не задано.
    - Переконайтеся, що Gateway працює 24/7 (без сну/перезапусків).
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

    - `--no-deliver` / `delivery.mode: "none"` означає, що резервне надсилання runner не очікується.
    - Відсутня або некоректна ціль оголошення (`channel` / `to`) означає, що runner пропустив вихідну доставку.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що runner намагався доставити повідомлення, але облікові дані це заблокували.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` і нічого більше) вважається навмисно непридатним для доставки, тому runner також пригнічує резервну доставку з черги.

    Для ізольованих Cron jobs агент усе ще може надсилати напряму інструментом `message`,
    коли доступний маршрут чату. `--announce` керує лише резервним
    шляхом runner для фінального тексту, який агент ще не надіслав сам.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований запуск cron змінив модель або один раз повторився?">
    Зазвичай це шлях live-перемикання моделі, а не дубльоване планування.

    Ізольований cron може зберегти передавання runtime-моделі та повторити спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає перемкненого
    провайдера/модель, а якщо перемикання несло нове перевизначення профілю автентифікації, cron
    також зберігає його перед повторною спробою.

    Пов’язані правила вибору:

    - Перевизначення моделі Gmail hook має найвищий пріоритет, якщо застосовне.
    - Далі — `model` для кожного завдання.
    - Потім — будь-яке збережене перевизначення моделі cron-сесії.
    - Далі — звичайний вибір моделі агента/за замовчуванням.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 повторні спроби перемикання
    cron перериває роботу замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [CLI cron](/uk/cli/cron).

  </Accordion>

  <Accordion title="Як установити Skills на Linux?">
    Використовуйте рідні команди `openclaw skills` або розміщуйте Skills у своєму робочому просторі. UI Skills для macOS недоступний на Linux.
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

    Рідний `openclaw skills install` записує в каталог `skills/` активного робочого простору.
    Окремий CLI `clawhub` установлюйте лише тоді, коли хочете публікувати або
    синхронізувати власні Skills. Для спільних установлень між агентами розміщуйте Skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете обмежити, які агенти можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати завдання за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Cron jobs** для запланованих або повторюваних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок «основної сесії».
    - **Ізольовані завдання** для автономних агентів, які публікують зведення або доставляють повідомлення в чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати Apple Skills лише для macOS з Linux?">
    Не напряму. Skills для macOS обмежуються через `metadata.openclaw.os` плюс потрібні бінарні файли, і Skills з’являються в системному prompt лише тоді, коли вони придатні на **хості Gateway**. У Linux Skills лише для `darwin` (наприклад, `apple-notes`, `apple-reminders`, `things-mac`) не завантажуватимуться, якщо ви не перевизначите це обмеження.

    Є три підтримувані шаблони:

    **Варіант A — запускати Gateway на Mac (найпростіше).**
    Запускайте Gateway там, де існують бінарні файли macOS, а потім під’єднуйтеся з Linux у [віддаленому режимі](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажуються нормально, тому що хост Gateway — це macOS.

    **Варіант B — використовувати macOS Node (без SSH).**
    Запускайте Gateway на Linux, виконайте pairing з macOS Node (застосунок у рядку меню) і встановіть для **Node Run Commands** значення "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати Skills лише для macOS придатними, коли потрібні бінарні файли існують на Node. Агент запускає ці Skills через інструмент `nodes`. Якщо ви виберете "Always Ask", схвалення "Always Allow" у запиті додасть цю команду до allowlist.

    **Варіант C — проксувати бінарні файли macOS через SSH (просунутий).**
    Залиште Gateway на Linux, але зробіть так, щоб потрібні CLI-бінарні файли розв’язувалися в SSH-обгортки, які виконуються на Mac. Потім перевизначте Skill, щоб дозволити Linux, і він залишався придатним.

    1. Створіть SSH-обгортку для бінарного файлу (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Додайте обгортку до `PATH` на Linux-хості (наприклад, `~/bin/memo`).
    3. Перевизначте метадані Skill (робочий простір або `~/.openclaw/skills`), щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Запустіть нову сесію, щоб оновити знімок Skills.

  </Accordion>

  <Accordion title="У вас є інтеграція з Notion або HeyGen?">
    Вбудованої підтримки зараз немає.

    Варіанти:

    - **Власний Skill / Plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Автоматизація браузера:** працює без коду, але повільніше й менш надійно.

    Якщо ви хочете зберігати контекст окремо для кожного клієнта (робочі процеси агенції), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + уподобання + активна робота).
    - Попросіть агента отримувати цю сторінку на початку сесії.

    Якщо вам потрібна рідна інтеграція, створіть запит на функцію або побудуйте Skill,
    орієнтований на ці API.

    Установлення Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Рідні встановлення потрапляють у каталог `skills/` активного робочого простору. Для спільних Skills між агентами розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо лише деякі агенти мають бачити спільне встановлення, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі Skills очікують бінарні файли, встановлені через Homebrew; у Linux це означає Linuxbrew (див. запис у FAQ вище про Homebrew на Linux). Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати мій наявний Chrome, у якому вже виконано вхід, з OpenClaw?">
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

    Цей шлях може використовувати локальний браузер хоста або під’єднаний browser Node. Якщо Gateway запущено деінде, або запустіть хост Node на машині з браузером, або використовуйте віддалений CDP.

    Поточні обмеження для `existing-session` / `user`:

    - дії прив’язані до ref, а не до CSS-селекторів
    - завантаження потребують `ref` / `inputRef` і наразі підтримують лише один файл за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії все ще потребують керованого браузера або сирого профілю CDP

  </Accordion>
</AccordionGroup>

## Пісочниця та пам’ять

<AccordionGroup>
  <Accordion title="Чи є окрема документація про пісочницю?">
    Так. Див. [Пісочниця](/uk/gateway/sandboxing). Для налаштування, специфічного для Docker (повний Gateway у Docker або образи пісочниці), див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повний набір можливостей?">
    Типовий образ орієнтований насамперед на безпеку і запускається від користувача `node`, тому він не
    містить системних пакетів, Homebrew або вбудованих браузерів. Для повнішого налаштування:

    - Зберігайте `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші не зникали.
    - Вбудовуйте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Установлюйте браузери Playwright через вбудований CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Задайте `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я зберегти DM приватними, але зробити групи публічними/ізольованими в пісочниці з одним агентом?">
    Так — якщо ваш приватний трафік це **DM**, а публічний трафік — це **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб сесії груп/каналів (неосновні ключі) запускалися у налаштованому backend пісочниці, тоді як основна DM-сесія залишалася на хості. Docker — це backend за замовчуванням, якщо ви не виберете інший. Потім обмежте, які інструменти доступні в сесіях у пісочниці, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: особисті DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Довідник із ключової конфігурації: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати папку хоста до пісочниці?">
    Установіть `agents.defaults.sandbox.docker.binds` у `["host:path:mode"]` (наприклад, `"/home/user/src:/src:ro"`). Глобальні прив’язки й прив’язки для окремого агента об’єднуються; прив’язки для окремого агента ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого й пам’ятайте, що прив’язки обходять бар’єри файлової системи пісочниці.

    OpenClaw перевіряє джерела прив’язок як щодо нормалізованого шляху, так і щодо канонічного шляху, розв’язаного через найглибшого наявного предка. Це означає, що виходи через symlink-батьків усе одно блокуються у безпечному режимі, навіть коли останній сегмент шляху ще не існує, а перевірки дозволених коренів усе одно застосовуються після розв’язання symlink.

    Див. [Пісочниця](/uk/gateway/sandboxing#custom-bind-mounts) і [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) для прикладів і приміток щодо безпеки.

  </Accordion>

  <Accordion title="Як працює пам’ять?">
    Пам’ять OpenClaw — це просто Markdown-файли в робочому просторі агента:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Кураторські довгострокові нотатки в `MEMORY.md` (лише для main/приватних сесій)

    OpenClaw також виконує **тихий flush пам’яті перед Compaction**, щоб нагадати моделі
    записати довговічні нотатки перед автоматичним Compaction. Це працює лише тоді, коли робочий простір
    доступний для запису (пісочниці лише для читання це пропускають). Див. [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Пам’ять постійно забуває речі. Як зробити так, щоб вони зберігалися?">
    Попросіть бота **записати факт у пам’ять**. Довгострокові нотатки мають зберігатися в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це ще сфера, яку ми покращуємо. Корисно нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона все одно забуває, перевірте, що Gateway використовує той самий
    робочий простір під час кожного запуску.

    Документація: [Пам’ять](/uk/concepts/memory), [Робочий простір агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається пам’ять назавжди? Які є обмеження?">
    Файли пам’яті зберігаються на диску й існують, доки ви їх не видалите. Обмеженням є ваше
    сховище, а не модель. **Контекст сесії** усе ще обмежений вікном контексту
    моделі, тому довгі розмови можуть проходити Compaction або обрізання. Саме тому
    існує пошук у пам’яті — він повертає в контекст лише релевантні частини.

    Документація: [Пам’ять](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потрібен для семантичного пошуку в пам’яті API-ключ OpenAI?">
    Лише якщо ви використовуєте **embedding-моделі OpenAI**. OAuth Codex покриває чат/completions і
    **не** надає доступу до embeddings, тож **вхід через Codex (OAuth або
    вхід через Codex CLI)** не допоможе для семантичного пошуку в пам’яті. Embeddings OpenAI
    усе ще потребують справжнього API-ключа (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви явно не задаєте провайдера, OpenClaw автоматично вибирає провайдера, коли
    може визначити API-ключ (профілі автентифікації, `models.providers.*.apiKey` або env vars).
    Він надає перевагу OpenAI, якщо визначається ключ OpenAI, інакше Gemini, якщо визначається ключ Gemini,
    потім Voyage, потім Mistral. Якщо віддалений ключ недоступний, пошук у пам’яті
    залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштовано шлях до локальної моделі
    і він існує, OpenClaw
    надає перевагу `local`. Ollama підтримується, якщо ви явно задаєте
    `memorySearch.provider = "ollama"`.

    Якщо ви хочете залишатися локально, установіть `memorySearch.provider = "local"` (і необов’язково
    `memorySearch.fallback = "none"`). Якщо вам потрібні embeddings Gemini, установіть
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо embedding-моделі **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    див. [Пам’ять](/uk/concepts/memory) для деталей налаштування.

  </Accordion>
</AccordionGroup>

## Де що зберігається на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, що використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw є локальним**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** сесії, файли пам’яті, конфігурація й робочий простір зберігаються на хості Gateway
      (`~/.openclaw` + каталог вашого робочого простору).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте провайдерам моделей (Anthropic/OpenAI тощо), потрапляють до
      їхніх API, а чат-платформи (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на
      своїх серверах.
    - **Ви контролюєте відбиток:** використання локальних моделей залишає prompt на вашій машині, але трафік
      каналів усе одно проходить через сервери відповідного каналу.

    Пов’язане: [Робочий простір агента](/uk/concepts/agent-workspace), [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе зберігається в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Шлях                                                            | Призначення                                                        |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основна конфігурація (JSON5)                                       |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Застарілий імпорт OAuth (копіюється до профілів автентифікації під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Профілі автентифікації (OAuth, API-ключі та необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язковий payload секретів у файлі для провайдерів `file` SecretRef |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Застарілий файл сумісності (статичні записи `api_key` очищуються)  |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдерів (наприклад, `whatsapp/<accountId>/creds.json`)    |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан для кожного агента (agentDir + сесії)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (для кожного агента)                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані сесій (для кожного агента)                                |

    Застарілий шлях для одного агента: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`).

    Ваш **робочий простір** (AGENTS.md, файли пам’яті, Skills тощо) зберігається окремо й налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають зберігатися AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли зберігаються в **робочому просторі агента**, а не в `~/.openclaw`.

    - **Робочий простір (для кожного агента)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, необов’язково `HEARTBEAT.md`.
      Рядковий `memory.md` у корені — це лише вхід для виправлення застарілих даних; `openclaw doctor --fix`
      може об’єднати його з `MEMORY.md`, коли обидва файли існують.
    - **Каталог стану (`~/.openclaw`)**: конфігурація, стан каналів/провайдерів, профілі автентифікації, сесії, журнали,
      а також спільні Skills (`~/.openclaw/skills`).

    Типовий робочий простір — `~/.openclaw/workspace`, налаштовується через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот «забуває» після перезапуску, переконайтеся, що Gateway використовує той самий
    робочий простір під час кожного запуску (і пам’ятайте: у віддаленому режимі використовується робочий простір **хоста gateway**,
    а не вашого локального ноутбука).

    Порада: якщо ви хочете довговічну поведінку або вподобання, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладатися на історію чату.

    Див. [Робочий простір агента](/uk/concepts/agent-workspace) і [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Зберігайте свій **робочий простір агента** у **приватному** git-репозиторії та робіть резервні копії десь
    у приватному місці (наприклад, GitHub private). Це охоплює пам’ять + файли AGENTS/SOUL/USER
    і дозволяє пізніше відновити «розум» помічника.

    **Не** комітьте нічого з `~/.openclaw` (облікові дані, сесії, токени або зашифровані payload секретів).
    Якщо вам потрібне повне відновлення, окремо робіть резервні копії і робочого простору, і каталогу стану
    (див. питання про міграцію вище).

    Документація: [Робочий простір агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окремий посібник: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть агенти працювати поза межами робочого простору?">
    Так. Робочий простір — це **cwd за замовчуванням** і якір пам’яті, а не жорстка пісочниця.
    Відносні шляхи розв’язуються в межах робочого простору, але абсолютні шляхи можуть звертатися до інших
    розташувань хоста, якщо пісочницю не ввімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування пісочниці для окремого агента. Якщо ви
    хочете, щоб репозиторій був робочим каталогом за замовчуванням, укажіть
    `workspace` цього агента як корінь репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
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

  <Accordion title="Віддалений режим: де знаходиться сховище сесій?">
    Станом сесій володіє **хост gateway**. Якщо ви працюєте у віддаленому режимі, потрібне вам сховище сесій розташоване на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="Який формат має конфігурація? Де вона розташована?">
    OpenClaw читає необов’язкову конфігурацію **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються досить безпечні значення за замовчуванням (зокрема робочий простір за замовчуванням `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я встановив gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Прив’язки не до loopback **вимагають коректного шляху автентифікації gateway**. На практиці це означає:

    - автентифікація через shared secret: токен або пароль
    - `gateway.auth.mode: "trusted-proxy"` за правильно налаштованим не-loopback reverse proxy з урахуванням ідентичності

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

    - `gateway.remote.token` / `.password` **самі по собі** не вмикають локальну автентифікацію gateway.
    - Локальні шляхи викликів можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
    - Для автентифікації паролем установіть `gateway.auth.mode: "password"` разом із `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і його не вдається розв’язати, розв’язання завершується в безпечному закритому режимі (без маскувального резервного варіанта remote).
    - Налаштування Control UI через shared secret автентифікуються за допомогою `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях застосунку/UI). Режими з передаванням ідентичності, такі як Tailscale Serve або `trusted-proxy`, натомість використовують заголовки запитів. Уникайте розміщення shared secret в URL.
    - Із `gateway.auth.mode: "trusted-proxy"` reverse proxy на тому самому хості через loopback усе одно **не** задовольняють автентифікацію trusted-proxy. Trusted proxy має бути налаштованим джерелом не на loopback.

  </Accordion>

  <Accordion title="Чому тепер на localhost мені потрібен токен?">
    OpenClaw примусово вимагає автентифікацію gateway за замовчуванням, зокрема і для loopback. У звичайному типовому сценарії це означає автентифікацію токеном: якщо явний шлях автентифікації не налаштовано, під час запуску gateway визначається режим токена і токен генерується автоматично, зберігаючись у `gateway.auth.token`, тож **локальні WS-клієнти мають автентифікуватися**. Це блокує інші локальні процеси від виклику Gateway.

    Якщо ви віддаєте перевагу іншому шляху автентифікації, ви можете явно вибрати режим пароля (або, для не-loopback reverse proxy з урахуванням ідентичності, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно встановіть `gateway.auth.mode: "none"` у конфігурації. Doctor може згенерувати токен для вас у будь-який момент: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни конфігурації?">
    Gateway стежить за конфігурацією й підтримує hot-reload:

    - `gateway.reload.mode: "hybrid"` (типово): безпечно застосовує hot-зміни, перезапускається для критичних
    - Також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні слогани в CLI?">
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

    - `off`: приховує текст слогана, але залишає рядок із назвою/версією банера.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: змінні кумедні/сезонні слогани (типова поведінка).
    - Якщо ви взагалі не хочете банер, установіть env `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути вебпошук (і web fetch)?">
    `web_fetch` працює без API-ключа. `web_search` залежить від вибраного вами
    провайдера:

    - Провайдери на основі API, такі як Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, потребують звичайного налаштування API-ключів.
    - Ollama Web Search не потребує ключа, але використовує ваш налаштований хост Ollama і вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна інтеграція на основі HTML.
    - SearXNG не потребує ключа / self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

    **Рекомендовано:** виконайте `openclaw configure --section web` і виберіть провайдера.
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
              provider: "firecrawl", // необов’язково; пропустіть для auto-detect
            },
          },
        },
    }
    ```

    Специфічна для провайдера конфігурація вебпошуку тепер розміщується в `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи провайдерів `tools.web.search.*` тимчасово ще завантажуються для сумісності, але не мають використовуватися для нових конфігурацій.
    Конфігурація резервного варіанта web-fetch Firecrawl розміщується в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlist, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнено за замовчуванням (якщо його явно не вимкнено).
    - Якщо `tools.web.fetch.provider` пропущено, OpenClaw автоматично визначає першого готового провайдера резервного варіанта fetch із доступних облікових даних. Наразі вбудований провайдер — Firecrawl.
    - Демони читають env vars з `~/.openclaw/.env` (або із середовища сервісу).

    Документація: [Вебінструменти](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мою конфігурацію. Як відновитися і уникнути цього?">
    `config.apply` замінює **всю конфігурацію повністю**. Якщо ви надсилаєте частковий об’єкт, усе
    інше видаляється.

    Поточний OpenClaw захищає від багатьох випадкових затирань:

    - Записи конфігурації, керовані OpenClaw, перевіряють повну конфігурацію після змін перед записом.
    - Некоректні або руйнівні записи, керовані OpenClaw, відхиляються і зберігаються як `openclaw.json.rejected.*`.
    - Якщо пряме редагування ламає запуск або hot reload, Gateway відновлює останню відому коректну конфігурацію і зберігає відхилений файл як `openclaw.json.clobbered.*`.
    - Після відновлення основний агент отримує попередження під час завантаження, щоб він не записав ту саму погану конфігурацію знову наосліп.

    Відновлення:

    - Перевірте `openclaw logs --follow` на `Config auto-restored from last-known-good`, `Config write rejected:` або `config reload restored last-known-good config`.
    - Перегляньте найновіший `openclaw.json.clobbered.*` або `openclaw.json.rejected.*` поруч з активною конфігурацією.
    - Залиште активну відновлену конфігурацію, якщо вона працює, а потім поверніть лише потрібні ключі через `openclaw config set` або `config.patch`.
    - Виконайте `openclaw config validate` і `openclaw doctor`.
    - Якщо у вас немає останньої відомої коректної конфігурації або відхиленого payload, відновіть із резервної копії або повторно виконайте `openclaw doctor` і переналаштуйте канали/моделі.
    - Якщо це сталося неочікувано, створіть bug report і додайте свою останню відому конфігурацію або будь-яку резервну копію.
    - Локальний coding agent часто може відновити робочу конфігурацію з журналів або історії.

    Як уникнути цього:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Спочатку використовуйте `config.schema.lookup`, коли не впевнені щодо точного шляху або форми поля; він повертає неглибокий вузол схеми та короткі підсумки безпосередніх дочірніх елементів для подальшого заглиблення.
    - Використовуйте `config.patch` для часткових RPC-редагувань; залишайте `config.apply` лише для повної заміни конфігурації.
    - Якщо ви використовуєте інструмент `gateway`, доступний лише власнику, у запуску агента, він усе одно відхилятиме записи до `tools.exec.ask` / `tools.exec.security` (включно із застарілими псевдонімами `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Config](/uk/cli/config), [Configure](/uk/cli/configure), [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими працівниками на різних пристроях?">
    Типовий шаблон — **один Gateway** (наприклад, Raspberry Pi) плюс **Nodes** і **агенти**:

    - **Gateway (центральний):** володіє каналами (Signal/WhatsApp), маршрутизацією та сесіями.
    - **Nodes (пристрої):** Mac/iOS/Android під’єднуються як периферійні пристрої та надають локальні інструменти (`system.run`, `canvas`, `camera`).
    - **Агенти (працівники):** окремі інтелекти/робочі простори для спеціальних ролей (наприклад, "Hetzner ops", "Personal data").
    - **Субагенти:** запускають фонову роботу з основного агента, коли вам потрібен паралелізм.
    - **TUI:** під’єднується до Gateway і дозволяє перемикати агентів/сесії.

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

    За замовчуванням значення `false` (із вікном). Headless-режим частіше викликає антибот-перевірки на деяких сайтах. Див. [Браузер](/uk/tools/browser).

    Headless використовує **той самий рушій Chromium** і працює для більшості сценаріїв автоматизації (форми, кліки, збирання даних, входи). Основні відмінності:

    - Немає видимого вікна браузера (використовуйте знімки екрана, якщо потрібна візуалізація).
    - Деякі сайти суворіше ставляться до автоматизації в headless-режимі (CAPTCHA, антибот).
      Наприклад, X/Twitter часто блокує headless-сесії.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Установіть `browser.executablePath` на ваш бінарний файл Brave (або будь-якого браузера на базі Chromium) і перезапустіть Gateway.
    Повні приклади конфігурації див. в [Браузер](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway і Nodes

<AccordionGroup>
  <Accordion title="Як команди передаються між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає агента і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен інструмент node:

    Telegram → Gateway → Агент → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідний трафік провайдера; вони отримують лише виклики RPC node.

  </Accordion>

  <Accordion title="Як мій агент може отримати доступ до мого комп’ютера, якщо Gateway розміщено віддалено?">
    Коротка відповідь: **виконайте pairing свого комп’ютера як Node**. Gateway працює деінде, але він може
    викликати інструменти `node.*` (екран, камера, система) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на хості, який завжди увімкнено (VPS/домашній сервер).
    2. Помістіть хост Gateway і ваш комп’ютер в один tailnet.
    3. Переконайтеся, що Gateway WS доступний (tailnet bind або SSH-тунель).
    4. Локально відкрийте застосунок macOS і під’єднайтеся в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як Node.
    5. Схваліть Node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP-міст не потрібен; Nodes під’єднуються через Gateway WebSocket.

    Нагадування про безпеку: pairing macOS Node дозволяє `system.run` на цій машині. Під’єднуйте
    лише ті пристрої, яким довіряєте, і перегляньте [Безпека](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Протокол Gateway](/uk/gateway/protocol), [Віддалений режим macOS](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale під’єднано, але я не отримую відповідей. Що тепер?">
    Перевірте основне:

    - Gateway працює: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан каналів: `openclaw channels status`

    Потім перевірте автентифікацію й маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` налаштовано правильно.
    - Якщо ви під’єднуєтеся через SSH-тунель, переконайтеся, що локальний тунель активний і вказує на правильний порт.
    - Переконайтеся, що ваші allowlist (DM або група) містять ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Канали](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два екземпляри OpenClaw спілкуватися між собою (локальний + VPS)?">
    Так. Вбудованого моста «бот-до-бота» немає, але це можна реалізувати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний чат-канал, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надсилає повідомлення Bot B, а потім Bot B відповідає як завжди.

    **Міст через CLI (загальний):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючи його на чат, де інший бот
    слухає. Якщо один бот працює на віддаленому VPS, націльте свій CLI на цей віддалений Gateway
    через SSH/Tailscale (див. [Віддалений доступ](/uk/gateway/remote)).

    Приклад шаблону (запускається з машини, яка може досягти цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте запобіжник, щоб два боти не потрапили в нескінченний цикл (відповідь лише на згадку, allowlist каналу
    або правило «не відповідати на повідомлення ботів»).

    Документація: [Віддалений доступ](/uk/gateway/remote), [CLI агента](/uk/cli/agent), [Надсилання агентом](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох агентів?">
    Ні. Один Gateway може розміщувати кілька агентів, кожен із власним робочим простором, типовими налаштуваннями моделі
    та маршрутизацією. Це нормальний сценарій, і він значно дешевший і простіший, ніж запуск
    одного VPS на кожного агента.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні конфігурації, які ви не хочете спільно використовувати. В інших випадках залишайте один Gateway і
    використовуйте кількох агентів або субагентів.

  </Accordion>

  <Accordion title="Чи є перевага у використанні Node на моєму особистому ноутбуці замість SSH із VPS?">
    Так — Nodes є основним способом доступу до вашого ноутбука з віддаленого Gateway, і вони
    дають більше, ніж просто доступ до оболонки. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (невеликий VPS або пристрій класу Raspberry Pi цілком підходить; 4 ГБ RAM більш ніж достатньо), тому поширений
    варіант — це постійно ввімкнений хост плюс ваш ноутбук як Node.

    - **Не потрібен вхідний SSH.** Nodes самі під’єднуються до Gateway WebSocket і використовують pairing пристрою.
    - **Безпечніші засоби контролю виконання.** `system.run` обмежується allowlist/підтвердженнями Node на цьому ноутбуці.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна автоматизація браузера.** Тримайте Gateway на VPS, але запускайте Chrome локально через хост Node на ноутбуці або під’єднуйтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для разового доступу до оболонки, але Nodes простіші для постійних робочих процесів агентів і
    автоматизації пристроїв.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають Nodes сервіс gateway?">
    Ні. На одному хості має працювати лише **один gateway**, якщо тільки ви свідомо не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)). Nodes — це периферійні пристрої, які під’єднуються
    до gateway (Nodes для iOS/Android або «режим node» на macOS у застосунку рядка меню). Для headless-хостів node
    і керування через CLI див. [CLI хоста Node](/uk/cli/node).

    Для змін `gateway`, `discovery` і `canvasHost` потрібен повний перезапуск.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати конфігурацію?">
    Так.

    - `config.schema.lookup`: перевірити одне піддерево конфігурації з його неглибоким вузлом схеми, підібраною UI-підказкою та короткими підсумками безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний знімок + hash
    - `config.patch`: безпечне часткове оновлення (бажаний варіант для більшості RPC-редагувань); виконує hot-reload, коли можливо, і перезапуск, коли потрібно
    - `config.apply`: перевірити + замінити повну конфігурацію; виконує hot-reload, коли можливо, і перезапуск, коли потрібно
    - Інструмент runtime `gateway`, доступний лише власнику, усе одно відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

  </Accordion>

  <Accordion title="Мінімальна розумна конфігурація для першого встановлення">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Це задає ваш робочий простір і обмежує, хто може активувати бота.

  </Accordion>

  <Accordion title="Як налаштувати Tailscale на VPS і під’єднатися з Mac?">
    Мінімальні кроки:

    1. **Установіть + увійдіть на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Установіть + увійдіть на Mac**
       - Використайте застосунок Tailscale і ввійдіть у той самий tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - У консолі адміністрування Tailscale увімкніть MagicDNS, щоб VPS мав стабільне ім’я.
    4. **Використовуйте ім’я хоста tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо ви хочете Control UI без SSH, використовуйте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив’язаним до loopback і відкриває HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як під’єднати Mac Node до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Control UI + WS Gateway**. Nodes під’єднуються через той самий endpoint Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS і Mac знаходяться в одному tailnet**.
    2. **Використовуйте застосунок macOS у режимі Remote** (ціллю SSH може бути ім’я хоста tailnet).
       Застосунок пробросить порт Gateway і під’єднається як Node.
    3. **Схваліть Node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Протокол Gateway](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [Віддалений режим macOS](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи варто встановлювати на другий ноутбук чи просто додати Node?">
    Якщо вам потрібні лише **локальні інструменти** (screen/camera/exec) на другому ноутбуці, додайте його як
    **Node**. Це зберігає єдиний Gateway і дозволяє уникнути дублювання конфігурації. Локальні інструменти Node
    наразі доступні лише на macOS, але ми плануємо поширити їх і на інші ОС.

    Встановлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/uk/cli/nodes), [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars і завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує змінні середовища?">
    OpenClaw читає env vars із батьківського процесу (оболонка, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` із поточного робочого каталогу
    - глобальний резервний `.env` із `~/.openclaw/.env` (також `$OPENCLAW_STATE_DIR/.env`)

    Жоден із файлів `.env` не перевизначає вже наявні env vars.

    Ви також можете визначити вбудовані env vars у конфігурації (застосовуються лише за відсутності в env процесу):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Див. [/environment](/uk/help/environment) для повного порядку пріоритету й джерел.

  </Accordion>

  <Accordion title="Я запустив Gateway через сервіс, і мої env vars зникли. Що тепер?">
    Два поширені способи виправлення:

    1. Покладіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися, навіть коли сервіс не успадковує env вашої оболонки.
    2. Увімкніть імпорт оболонки (зручність за бажанням):

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

    Це запускає вашу login shell і імпортує лише відсутні очікувані ключі (ніколи не перевизначає). Еквіваленти env vars:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я встановив COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` повідомляє, чи увімкнено **імпорт env із оболонки**. "Shell env: off"
    **не** означає, що ваших env vars немає — це лише означає, що OpenClaw не завантажуватиме
    вашу login shell автоматично.

    Якщо Gateway працює як сервіс (launchd/systemd), він не успадковуватиме середовище вашої оболонки.
    Виправте це одним із таких способів:

    1. Помістіть токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або ввімкніть імпорт оболонки (`env.shellEnv.enabled: true`).
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
    Надішліть `/new` або `/reset` як окреме повідомлення. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>

  <Accordion title="Чи скидаються сесії автоматично, якщо я ніколи не надсилаю /new?">
    Термін дії сесій може завершуватися після `session.idleMinutes`, але це **вимкнено за замовчуванням** (типово **0**).
    Установіть додатне значення, щоб увімкнути завершення після бездіяльності. Коли це ввімкнено, **наступне**
    повідомлення після періоду бездіяльності запускає новий id сесії для цього ключа чату.
    Це не видаляє транскрипти — це лише запускає нову сесію.

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
    агента й кількох робочих агентів із власними робочими просторами та моделями.

    Втім, найкраще розглядати це як **цікавий експеримент**. Це витрачає багато токенів і часто
    менш ефективно, ніж використання одного бота з окремими сесіями. Типова модель, яку ми
    уявляємо, — це один бот, з яким ви спілкуєтеся, але з різними сесіями для паралельної роботи. Такий
    бот також може за потреби запускати субагентів.

    Документація: [Маршрутизація мультиагентності](/uk/concepts/multi-agent), [Субагенти](/uk/tools/subagents), [CLI агентів](/uk/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст було обрізано посеред завдання? Як цього уникнути?">
    Контекст сесії обмежений вікном моделі. Довгі чати, великий вивід інструментів або багато
    файлів можуть спричинити Compaction або обрізання.

    Що допомагає:

    - Попросіть бота узагальнити поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими завданнями, а `/new` — під час зміни теми.
    - Тримайте важливий контекст у робочому просторі й просіть бота перечитати його.
    - Використовуйте субагентів для довгої або паралельної роботи, щоб основний чат залишався меншим.
    - Виберіть модель із більшим вікном контексту, якщо це трапляється часто.

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
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен каталог стану (типові: `~/.openclaw-<profile>`).
    - Dev reset: `openclaw gateway --dev --reset` (лише для dev; стирає dev-конфігурацію + облікові дані + сесії + робочий простір).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або виконати compact?'>
    Використайте один із цих варіантів:

    - **Compact** (зберігає розмову, але узагальнює старіші ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб спрямувати зведення.

    - **Reset** (новий id сесії для того самого ключа чату):

      ```
      /new
      /reset
      ```

    Якщо це продовжує траплятися:

    - Увімкніть або налаштуйте **обрізання сесії** (`agents.defaults.contextPruning`), щоб скорочувати старий вивід інструментів.
    - Використовуйте модель із більшим вікном контексту.

    Документація: [Compaction](/uk/concepts/compaction), [Обрізання сесії](/uk/concepts/session-pruning), [Керування сесіями](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка перевірки провайдера: модель видала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія сесії застаріла або пошкоджена (часто після довгих тредів
    або зміни інструмента/схеми).

    Виправлення: почніть нову сесію за допомогою `/new` (окреме повідомлення).

  </Accordion>

  <Accordion title="Чому я отримую повідомлення heartbeat кожні 30 хвилин?">
    Heartbeat запускається кожні **30 хв** за замовчуванням (**1 год**, якщо використовується OAuth-автентифікація). Налаштуйте або вимкніть це:

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
    на кшталт `# Heading`), OpenClaw пропускає запуск heartbeat, щоб зберегти виклики API.
    Якщо файл відсутній, heartbeat усе одно виконується, і модель сама вирішує, що робити.

    Перевизначення для окремого агента використовують `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "обліковий запис бота" до групи WhatsApp?'>
    Ні. OpenClaw працює від **вашого власного облікового запису**, тож якщо ви є в групі, OpenClaw може її бачити.
    За замовчуванням відповіді в групах заблоковано, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

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
    Варіант 1 (найшвидший): переглядайте журнали й надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Шукайте `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/додано в allowlist): перелічіть групи з конфігурації:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/uk/cli/directory), [Журнали](/uk/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Є дві поширені причини:

    - Увімкнено gating за згадками (за замовчуванням). Ви маєте @згадати бота (або збігатися з `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і групу не додано в allowlist.

    Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи ділять групи/треди контекст із DM?">
    Прямі чати за замовчуванням згортаються до основної сесії. Групи/канали мають власні ключі сесій, а теми Telegram / треди Discord — це окремі сесії. Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки робочих просторів і агентів я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але стежте за таким:

    - **Зростання диска:** сесії + транскрипти зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартість токенів:** більше агентів означає більше одночасного використання моделей.
    - **Операційне навантаження:** профілі автентифікації, робочі простори та маршрутизація каналів для кожного агента.

    Поради:

    - Тримайте один **активний** робочий простір на агента (`agents.defaults.workspace`).
    - Видаляйте старі сесії (видаляйте записи JSONL або елементи сховища), якщо диск розростається.
    - Використовуйте `openclaw doctor`, щоб виявляти зайві робочі простори й невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька ботів або чатів одночасно (Slack), і як це краще налаштувати?">
    Так. Використовуйте **маршрутизацію мультиагентності**, щоб запускати кількох ізольованих агентів і маршрутизувати вхідні повідомлення за
    каналом/обліковим записом/peer. Slack підтримується як канал і може бути прив’язаний до конкретних агентів.

    Доступ до браузера потужний, але це не означає «зробити все, що може людина» — антибот-захист, CAPTCHA і MFA
    усе ще можуть блокувати автоматизацію. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на хості
    або CDP на машині, яка фактично запускає браузер.

    Налаштування за найкращою практикою:

    - Хост Gateway, що завжди ввімкнений (VPS/Mac mini).
    - Один агент на роль (bindings).
    - Канал(и) Slack, прив’язані до цих агентів.
    - Локальний браузер через Chrome MCP або Node, коли це потрібно.

    Документація: [Маршрутизація мультиагентності](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Браузер](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: типові значення, вибір, псевдоніми, перемикання

<AccordionGroup>
  <Accordion title='Що таке "модель за замовчуванням"?'>
    Модель за замовчуванням в OpenClaw — це те, що ви встановили як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються у форматі `provider/model` (наприклад: `openai/gpt-5.4` або `openai-codex/gpt-5.5`). Якщо провайдер не вказано, OpenClaw спочатку шукає псевдонім, потім унікальний збіг серед налаштованих провайдерів для точного id моделі, і лише після цього повертається до налаштованого провайдера за замовчуванням як до застарілого шляху сумісності. Якщо цей провайдер більше не надає налаштовану модель за замовчуванням, OpenClaw переходить до першого налаштованого провайдера/моделі замість того, щоб показувати застарілу типову модель вилученого провайдера. Вам усе одно слід **явно** задавати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендована модель за замовчуванням:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для агентів з інструментами або недовіреним вхідним вмістом:** ставте силу моделі вище за вартість.
    **Для рутинного/низькоризикового чату:** використовуйте дешевші резервні моделі й маршрутизуйте за роллю агента.

    У MiniMax є власна документація: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити** для завдань із високою ставкою, і дешевшу
    модель для звичайного чату або зведень. Ви можете маршрутизувати моделі для кожного агента й використовувати субагентів, щоб
    розпаралелювати довгі завдання (кожен субагент споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Субагенти](/uk/tools/subagents).

    Сильне попередження: слабші / надмірно квантизовані моделі більш вразливі до prompt injection
    і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі без стирання конфігурації?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для поточної сесії)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - відредагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` із частковим об’єктом, якщо тільки ви свідомо не хочете замінити всю конфігурацію.
    Для RPC-редагувань спочатку перевіряйте через `config.schema.lookup` і надавайте перевагу `config.patch`. Payload lookup надає вам нормалізований шлях, неглибоку документацію/обмеження схеми та короткі підсумки безпосередніх дочірніх елементів
    для часткових оновлень.
    Якщо ви все ж перезаписали конфігурацію, відновіть її з резервної копії або повторно запустіть `openclaw doctor` для виправлення.

    Документація: [Моделі](/uk/concepts/models), [Configure](/uk/cli/configure), [Config](/uk/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати self-hosted моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — це найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Установіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо вам потрібні також хмарні моделі, виконайте `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає вам хмарні моделі плюс ваші локальні моделі Ollama
    - хмарні моделі, такі як `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі більш вразливі до prompt injection.
    Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все ж хочете малі моделі, увімкніть пісочницю та суворі allowlist інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Пісочниця](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися й змінюватися з часом; фіксованої рекомендації щодо провайдера немає.
    - Перевіряйте поточне налаштування runtime на кожному gateway за допомогою `openclaw models status`.
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

    Ви можете переглянути доступні моделі за допомогою `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований picker. Вибір за номером:

    ```
    /model 3
    ```

    Ви також можете примусово вибрати конкретний профіль автентифікації для провайдера (для сесії):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується і який профіль автентифікації буде випробувано наступним.
    Він також показує налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), якщо вони доступні.

    **Як зняти закріплення профілю, який я встановив через @profile?**

    Повторно виконайте `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо ви хочете повернутися до значення за замовчуванням, виберіть його через `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль автентифікації активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.5 для щоденних завдань, а Codex 5.5 — для програмування?">
    Так. Установіть одну модель як типову й перемикайте за потреби:

    - **Швидке перемикання (для сесії):** `/model openai/gpt-5.4` для поточних завдань через прямий API-ключ OpenAI або `/model openai-codex/gpt-5.5` для завдань GPT-5.5 через Codex OAuth.
    - **Типове значення:** установіть `agents.defaults.model.primary` у `openai/gpt-5.4` для використання з API-ключем або `openai-codex/gpt-5.5` для використання GPT-5.5 через Codex OAuth.
    - **Субагенти:** маршрутизуйте завдання програмування до субагентів з іншою типовою моделлю.

    Прямий доступ через API-ключ до `openai/gpt-5.5` підтримується, щойно OpenAI ввімкне
    GPT-5.5 у публічному API. До того часу GPT-5.5 доступна лише через підписку/OAuth.

    Див. [Моделі](/uk/concepts/models) і [Команди зі скісною рискою](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.5?">
    Використовуйте або перемикач для сесії, або типове значення в конфігурації:

    - **Для сесії:** надішліть `/fast on`, поки сесія використовує `openai/gpt-5.4` або `openai-codex/gpt-5.5`.
    - **Типове значення для моделі:** установіть `agents.defaults.models["openai/gpt-5.4"].params.fastMode` або `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` у `true`.

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
          },
        },
      },
    }
    ```

    Для OpenAI fast mode відповідає `service_tier = "priority"` у підтримуваних нативних запитах Responses. `/fast` у сесії має вищий пріоритет за типові значення конфігурації.

    Див. [Thinking і fast mode](/uk/tools/thinking) та [Fast mode OpenAI](/uk/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо задано `agents.defaults.models`, воно стає **allowlist** для `/model` і будь-яких
    перевизначень сесії. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, приберіть allowlist або виберіть модель із `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **провайдер не налаштовано** (не знайдено конфігурації провайдера MiniMax або
    профілю автентифікації), тому модель неможливо визначити.

    Контрольний список для виправлення:

    1. Оновіться до поточного випуску OpenClaw (або запускайте з вихідного коду `main`), а потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (через майстер або JSON), або що автентифікація MiniMax
       існує в env/профілях автентифікації, щоб можна було вставити відповідного провайдера
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний id моделі (з урахуванням регістру) для вашого шляху автентифікації:
       `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed` для налаштування
       через API-ключ, або `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування через OAuth.
    4. Виконайте:

       ```bash
       openclaw models list
       ```

       і виберіть зі списку (або `/model list` у чаті).

    Див. [MiniMax](/uk/providers/minimax) і [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати MiniMax за замовчуванням, а OpenAI — для складних завдань?">
    Так. Використовуйте **MiniMax як значення за замовчуванням** і перемикайте моделі **для кожної сесії** за потреби.
    Резервні варіанти призначені для **помилок**, а не для «складних завдань», тому використовуйте `/model` або окремого агента.

    **Варіант A: перемикання для кожної сесії**

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

    - Агент A за замовчуванням: MiniMax
    - Агент B за замовчуванням: OpenAI
    - Маршрутизуйте за агентом або використовуйте `/agent` для перемикання

    Документація: [Моделі](/uk/concepts/models), [Маршрутизація мультиагентності](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома типовими скороченнями (застосовуються лише тоді, коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4` для налаштувань через API-ключ або `openai-codex/gpt-5.5`, якщо налаштовано Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви задасте власний псевдонім із такою самою назвою, перевагу матиме ваше значення.

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

    Тоді `/model sonnet` (або `/<alias>`, коли підтримується) буде розв’язуватися до цього id моделі.

  </Accordion>

  <Accordion title="Як додати моделі від інших провайдерів, наприклад OpenRouter або Z.AI?">
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

    Якщо ви посилаєтеся на `provider/model`, але потрібний ключ провайдера відсутній, ви отримаєте помилку автентифікації під час виконання (наприклад, `No API key found for provider "zai"`).

    **No API key found for provider після додавання нового агента**

    Зазвичай це означає, що в **нового агента** порожнє сховище автентифікації. Автентифікація є окремою для кожного агента і
    зберігається в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Виконайте `openclaw agents add <id>` і налаштуйте автентифікацію під час роботи майстра.
    - Або скопіюйте `auth-profiles.json` з `agentDir` основного агента до `agentDir` нового агента.

    **Не** використовуйте один і той самий `agentDir` для кількох агентів; це спричиняє конфлікти автентифікації/сесій.

  </Accordion>
</AccordionGroup>

## Резервне перемикання моделей і «All models failed»

<AccordionGroup>
  <Accordion title="Як працює резервне перемикання?">
    Резервне перемикання відбувається у два етапи:

    1. **Ротація профілів автентифікації** в межах одного провайдера.
    2. **Резервне перемикання моделі** на наступну модель у `agents.defaults.model.fallbacks`.

    Для профілів, що зазнають помилок, застосовуються періоди cooldown (експоненційний backoff), тож OpenClaw може продовжувати відповідати навіть тоді, коли провайдер обмежений через rate limit або тимчасово недоступний.

    Кошик rate limit включає не лише звичайні відповіді `429`. OpenClaw
    також вважає такими, що заслуговують на резервне перемикання, повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    ліміти вікна використання (`weekly/monthly limit reached`).

    Деякі відповіді, схожі на білінгові, не є `402`, а деякі відповіді HTTP `402`
    також залишаються в цьому транзитному кошику. Якщо провайдер повертає
    явний текст про білінг у `401` або `403`, OpenClaw усе одно може залишити це
    у білінговій гілці, але специфічні для провайдера співставлення тексту залишаються обмеженими
    провайдером, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Якщо повідомлення `402`
    натомість виглядає як повторюване вікно використання або
    ліміт витрат організації/робочого простору (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw трактує це як
    `rate_limit`, а не як тривале вимкнення через білінг.

    Помилки переповнення контексту відрізняються: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху Compaction/повторної спроби замість переходу до
    резервного перемикання моделі.

    Загальний текст про помилки сервера навмисно вужчий, ніж «будь-що з
    unknown/error у тексті». OpenClaw вважає такими, що заслуговують на резервне перемикання, специфічні для провайдера транзитні форми,
    як-от просте повідомлення Anthropic `An unknown error occurred`, просте повідомлення OpenRouter
    `Provider returned error`, помилки причини зупинки на кшталт `Unhandled stop reason:
    error`, JSON-payload `api_error` із транзитним текстом сервера
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості провайдера, такі як `ModelNotReadyException`, як
    сигнали timeout/перевантаження, що заслуговують на резервне перемикання, коли контекст провайдера
    збігається.
    Загальний внутрішній резервний текст на кшталт `LLM request failed with an unknown
    error.` залишається консервативним і сам по собі не запускає резервне перемикання моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система намагалася використати id профілю автентифікації `anthropic:default`, але не змогла знайти для нього облікові дані в очікуваному сховищі автентифікації.

    **Контрольний список для виправлення:**

    - **Підтвердьте, де зберігаються профілі автентифікації** (нові й застарілі шляхи)
      - Поточний шлях: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий шлях: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Підтвердьте, що env var завантажується Gateway**
      - Якщо ви встановили `ANTHROPIC_API_KEY` у своїй оболонці, але запускаєте Gateway через systemd/launchd, він може його не успадкувати. Помістіть його в `~/.openclaw/.env` або ввімкніть `env.shellEnv`.
    - **Переконайтеся, що редагуєте правильного агента**
      - У мультиагентних налаштуваннях може бути кілька файлів `auth-profiles.json`.
    - **Швидко перевірте стан моделі/автентифікації**
      - Використовуйте `openclaw models status`, щоб побачити налаштовані моделі та чи автентифіковані провайдери.

    **Контрольний список для виправлення "No credentials found for profile anthropic"**

    Це означає, що запуск закріплено за профілем автентифікації Anthropic, але Gateway
    не може знайти його у своєму сховищі автентифікації.

    - **Використовуйте Claude CLI**
      - Виконайте `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо ви хочете використовувати натомість API-ключ**
      - Помістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистьте будь-який закріплений порядок, який примусово використовує відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Підтвердьте, що ви запускаєте команди саме на хості gateway**
      - У віддаленому режимі профілі автентифікації зберігаються на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому система також спробувала Google Gemini і теж завершилася помилкою?">
    Якщо конфігурація вашої моделі включає Google Gemini як резервний варіант (або ви перемкнулися на скорочення Gemini), OpenClaw спробує її під час резервного перемикання моделі. Якщо ви не налаштували облікові дані Google, побачите `No API key found for provider "google"`.

    Виправлення: або надайте автентифікацію Google, або приберіть / не використовуйте моделі Google в `agents.defaults.model.fallbacks` / псевдонімах, щоб резервне перемикання не вело туди.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Причина: історія сесії містить **thinking-блоки без сигнатур** (часто через
    перерваний/частковий потік). Google Antigravity вимагає сигнатури для thinking-блоків.

    Виправлення: OpenClaw тепер прибирає thinking-блоки без сигнатур для Google Antigravity Claude. Якщо це все ще з’являється, почніть **нову сесію** або встановіть `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Профілі автентифікації: що це таке і як ними керувати

Пов’язане: [/concepts/oauth](/uk/concepts/oauth) (потоки OAuth, зберігання токенів, шаблони для кількох облікових записів)

<AccordionGroup>
  <Accordion title="Що таке профіль автентифікації?">
    Профіль автентифікації — це іменований запис облікових даних (OAuth або API-ключ), пов’язаний із провайдером. Профілі зберігаються в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які типові id профілів?">
    OpenClaw використовує id з префіксом провайдера, наприклад:

    - `anthropic:default` (поширено, коли немає email-ідентичності)
    - `anthropic:<email>` для OAuth-ідентичностей
    - власні id, які ви вибираєте (наприклад, `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який профіль автентифікації буде випробувано першим?">
    Так. Конфігурація підтримує необов’язкові метадані для профілів і порядок для кожного провайдера (`auth.order.<provider>`). Це **не** зберігає секрети; це лише зіставляє id з провайдером/режимом і задає порядок ротації.

    OpenClaw може тимчасово пропускати профіль, якщо він перебуває в короткому **cooldown** (rate limit/timeouts/помилки автентифікації) або в довшому стані **disabled** (білінг/недостатньо кредитів). Щоб це перевірити, виконайте `openclaw models status --json` і подивіться `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Cooldown для rate limit може бути прив’язаний до моделі. Профіль, який перебуває в cooldown
    для однієї моделі, усе ще може бути придатним для спорідненої моделі того самого провайдера,
    тоді як білінгові/вимкнені вікна все одно блокують увесь профіль.

    Ви також можете задати **перевизначення порядку для окремого агента** (зберігається в `auth-state.json` цього агента) через CLI:

    ```bash
    # За замовчуванням використовується налаштований агент за замовчуванням (пропустіть --agent)
    openclaw models auth order get --provider anthropic

    # Зафіксувати ротацію на одному профілі (пробувати лише його)
    openclaw models auth order set --provider anthropic anthropic:default

    # Або задати явний порядок (резервне перемикання в межах провайдера)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Очистити перевизначення (повернення до config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Щоб націлитися на конкретного агента:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Щоб перевірити, що саме буде випробувано насправді, використовуйте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено в явному порядку, probe показує
    `excluded_by_auth_order` для цього профілю замість того, щоб пробувати його мовчки.

  </Accordion>

  <Accordion title="OAuth чи API key — у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де це застосовно).
    - **API keys** використовують білінг за токени.

    Майстер явно підтримує Anthropic Claude CLI, OpenAI Codex OAuth та API-ключі.

  </Accordion>
</AccordionGroup>

## Gateway: порти, «already running» і віддалений режим

<AccordionGroup>
  <Accordion title="Який порт використовує Gateway?">
    `gateway.port` керує єдиним мультиплексованим портом для WebSocket + HTTP (Control UI, hooks тощо).

    Пріоритет:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує "Runtime: running", але "Connectivity probe: failed"?'>
    Тому що "running" — це точка зору **супервізора** (launchd/systemd/schtasks). А connectivity probe — це фактичне підключення CLI до WebSocket gateway.

    Використовуйте `openclaw gateway status` і довіряйте цим рядкам:

    - `Probe target:` (URL, який probe фактично використовував)
    - `Listening:` (що реально прив’язано до порту)
    - `Last gateway error:` (поширена першопричина, коли процес живий, але порт не слухає)

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує різні "Config (cli)" і "Config (service)"?'>
    Ви редагуєте один файл конфігурації, а сервіс працює з іншим (часто через невідповідність `--profile` / `OPENCLAW_STATE_DIR`).

    Виправлення:

    ```bash
    openclaw gateway install --force
    ```

    Запустіть це з тим самим `--profile` / середовищем, яке ви хочете, щоб використовував сервіс.

  </Accordion>

  <Accordion title='Що означає "another gateway instance is already listening"?'>
    OpenClaw примусово забезпечує runtime-lock, одразу прив’язуючи слухач WebSocket під час запуску (типово `ws://127.0.0.1:18789`). Якщо прив’язка завершується помилкою `EADDRINUSE`, викидається `GatewayLockError`, який означає, що інший екземпляр уже слухає.

    Виправлення: зупиніть інший екземпляр, звільніть порт або запускайте з `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Як запустити OpenClaw у віддаленому режимі (клієнт під’єднується до Gateway деінде)?">
    Установіть `gateway.mode: "remote"` і вкажіть віддалений WebSocket URL, за потреби з віддаленими обліковими даними shared secret:

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

    - `openclaw gateway` запускається лише тоді, коли `gateway.mode` має значення `local` (або ви передаєте прапорець перевизначення).
    - Застосунок macOS стежить за файлом конфігурації та в реальному часі перемикає режими, коли ці значення змінюються.
    - `gateway.remote.token` / `.password` — це лише віддалені облікові дані на стороні клієнта; вони самі по собі не вмикають локальну автентифікацію gateway.

  </Accordion>

  <Accordion title='Control UI показує "unauthorized" (або постійно перепідключається). Що робити?'>
    Ваш шлях автентифікації gateway і метод автентифікації UI не збігаються.

    Факти (з коду):

    - Control UI зберігає токен у `sessionStorage` для поточної сесії вкладки браузера та вибраного URL gateway, тож оновлення в тій самій вкладці продовжують працювати без відновлення довготривалого зберігання токена в localStorage.
    - За `AUTH_TOKEN_MISMATCH` довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном пристрою, коли gateway повертає підказки для повторної спроби (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ця повторна спроба з кешованим токеном тепер повторно використовує кешовані схвалені області, збережені разом із токеном пристрою. Явні виклики `deviceToken` / явні `scopes` усе ще зберігають власний запитаний набір областей замість успадкування кешованих.
    - Поза цим шляхом повторної спроби пріоритет автентифікації під час підключення такий: спочатку явний shared token/password, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap-токен.
    - Перевірки областей bootstrap-токена мають префікс ролі. Вбудований allowlist bootstrap-оператора задовольняє лише запити оператора; Node або інші ролі, не пов’язані з оператором, усе ще потребують областей із власним префіксом ролі.

    Виправлення:

    - Найшвидше: `openclaw dashboard` (виводить + копіює URL dashboard, намагається відкрити; показує підказку SSH, якщо немає екрана).
    - Якщо у вас ще немає токена: `openclaw doctor --generate-gateway-token`.
    - Якщо це віддалений режим, спочатку пробросьте тунель: `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`.
    - Режим shared secret: установіть `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, а потім вставте відповідний секрет у налаштуваннях Control UI.
    - Режим Tailscale Serve: переконайтеся, що `gateway.auth.allowTailscale` увімкнено і ви відкриваєте URL Serve, а не сирий URL loopback/tailnet, який обходить заголовки ідентичності Tailscale.
    - Режим trusted-proxy: переконайтеся, що ви заходите через налаштований не-loopback identity-aware proxy, а не через loopback-proxy на тому самому хості чи сирий URL gateway.
    - Якщо невідповідність зберігається після однієї повторної спроби, перевипустіть/повторно схваліть токен прив’язаного пристрою:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Якщо цей виклик rotate каже, що його відхилено, перевірте два моменти:
      - paired-device-сесії можуть перевипускати лише **власний** пристрій, якщо тільки в них також немає `operator.admin`
      - явні значення `--scope` не можуть перевищувати поточні області оператора викликача
    - Усе ще не працює? Виконайте `openclaw status --all` і дотримуйтеся [Усунення несправностей](/uk/gateway/troubleshooting). Подробиці автентифікації див. у [Dashboard](/uk/web/dashboard).

  </Accordion>

  <Accordion title="Я встановив gateway.bind tailnet, але він не може прив’язатися і нічого не слухає">
    Прив’язка `tailnet` вибирає IP Tailscale з мережевих інтерфейсів (100.64.0.0/10). Якщо машина не в Tailscale (або інтерфейс вимкнено), прив’язуватися просто нема до чого.

    Виправлення:

    - Запустіть Tailscale на цьому хості (щоб він мав адресу 100.x), або
    - Перемкніться на `gateway.bind: "loopback"` / `"lan"`.

    Примітка: `tailnet` — це явний вибір. `auto` надає перевагу loopback; використовуйте `gateway.bind: "tailnet"`, коли хочете прив’язку лише до tailnet.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька Gateway на одному хості?">
    Зазвичай ні — один Gateway може запускати кілька каналів обміну повідомленнями й агентів. Використовуйте кілька Gateway лише тоді, коли вам потрібна надлишковість (наприклад, rescue bot) або жорстка ізоляція.

    Так, але ви маєте ізолювати:

    - `OPENCLAW_CONFIG_PATH` (конфігурація для кожного екземпляра)
    - `OPENCLAW_STATE_DIR` (стан для кожного екземпляра)
    - `agents.defaults.workspace` (ізоляція робочого простору)
    - `gateway.port` (унікальні порти)

    Швидке налаштування (рекомендовано):

    - Використовуйте `openclaw --profile <name> ...` для кожного екземпляра (автоматично створює `~/.openclaw-<name>`).
    - Установіть унікальний `gateway.port` у конфігурації кожного профілю (або передайте `--port` для ручних запусків).
    - Установіть сервіс для кожного профілю: `openclaw --profile <name> gateway install`.

    Профілі також додають суфікси до назв сервісів (`ai.openclaw.<profile>`; застарілі `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Повний посібник: [Кілька Gateway](/uk/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Що означає "invalid handshake" / код 1008?'>
    Gateway — це **WebSocket-сервер**, і він очікує, що першим повідомленням
    буде кадр `connect`. Якщо він отримує щось інше, то закриває з’єднання
    з **кодом 1008** (порушення політики).

    Поширені причини:

    - Ви відкрили URL **HTTP** у браузері (`http://...`) замість WS-клієнта.
    - Ви використали неправильний порт або шлях.
    - Proxy або тунель прибрав заголовки автентифікації або надіслав не-Gateway-запит.

    Швидкі виправлення:

    1. Використовуйте WS URL: `ws://<host>:18789` (або `wss://...`, якщо HTTPS).
    2. Не відкривайте WS-порт у звичайній вкладці браузера.
    3. Якщо ввімкнено автентифікацію, включіть токен/пароль у кадр `connect`.

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

    Ви можете встановити стабільний шлях через `logging.file`. Рівень файлового журналу керується `logging.level`. Багатослівність консолі керується `--verbose` і `logging.consoleLevel`.

    Найшвидший перегляд хвоста журналу:

    ```bash
    openclaw logs --follow
    ```

    Журнали сервісу/супервізора (коли gateway працює через launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` і `gateway.err.log` (типово: `~/.openclaw/logs/...`; профілі використовують `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Докладніше див. в [Усунення несправностей](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Як запустити/зупинити/перезапустити сервіс Gateway?">
    Використовуйте допоміжні команди gateway:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Якщо ви запускаєте gateway вручну, `openclaw gateway --force` може повернути собі порт. Див. [Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Я закрив свій термінал у Windows — як перезапустити OpenClaw?">
    Є **два режими встановлення у Windows**:

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

    Документація: [Windows (WSL2)](/uk/platforms/windows), [Операційний посібник для сервісу Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Gateway запущено, але відповіді ніколи не надходять. Що перевірити?">
    Почніть із швидкої перевірки стану:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Поширені причини:

    - Автентифікацію моделі не завантажено на **хості gateway** (перевірте `models status`).
    - Pairing/allowlist каналу блокує відповіді (перевірте конфігурацію каналу + журнали).
    - WebChat/Dashboard відкрито без правильного токена.

    Якщо ви працюєте віддалено, підтвердьте, що тунель/Tailscale-з’єднання активне і що
    Gateway WebSocket доступний.

    Документація: [Канали](/uk/channels), [Усунення несправностей](/uk/gateway/troubleshooting), [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — що тепер?'>
    Зазвичай це означає, що UI втратив WebSocket-з’єднання. Перевірте:

    1. Чи працює Gateway? `openclaw gateway status`
    2. Чи здоровий Gateway? `openclaw status`
    3. Чи має UI правильний токен? `openclaw dashboard`
    4. Якщо це віддалений режим, чи активне з’єднання тунелю/Tailscale?

    Потім перегляньте хвіст журналів:

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

    - `BOT_COMMANDS_TOO_MUCH`: у меню Telegram надто багато записів. OpenClaw уже обрізає список до ліміту Telegram і повторює спробу з меншою кількістю команд, але деякі записи меню все одно треба прибрати. Зменште кількість команд Plugin/Skill/власних команд або вимкніть `channels.telegram.commands.native`, якщо меню вам не потрібне.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` або подібні мережеві помилки: якщо ви на VPS або за proxy, переконайтеся, що вихідний HTTPS дозволений і DNS працює для `api.telegram.org`.

    Якщо Gateway віддалений, переконайтеся, що дивитеся журнали саме на хості Gateway.

    Документація: [Telegram](/uk/channels/telegram), [Усунення несправностей каналу](/uk/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI не показує вивід. Що перевірити?">
    Спочатку переконайтеся, що Gateway доступний і агент може працювати:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    У TUI використовуйте `/status`, щоб побачити поточний стан. Якщо ви очікуєте відповіді в чат-каналі,
    переконайтеся, що доставку ввімкнено (`/deliver on`).

    Документація: [TUI](/uk/web/tui), [Команди зі скісною рискою](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як повністю зупинити, а потім знову запустити Gateway?">
    Якщо ви встановили сервіс:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Це зупиняє/запускає **сервіс під керуванням супервізора** (launchd на macOS, systemd на Linux).
    Використовуйте це, коли Gateway працює у фоновому режимі як демон.

    Якщо ви запускаєте його на передньому плані, зупиніть через Ctrl-C, а потім:

    ```bash
    openclaw gateway run
    ```

    Документація: [Операційний посібник для сервісу Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Поясни як п’ятирічному: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: перезапускає **фоновий сервіс** (launchd/systemd).
    - `openclaw gateway`: запускає gateway **на передньому плані** для цієї сесії термінала.

    Якщо ви встановили сервіс, використовуйте команди gateway. Використовуйте `openclaw gateway`, коли
    хочете одноразовий запуск на передньому плані.

  </Accordion>

  <Accordion title="Найшвидший спосіб отримати більше деталей, коли щось ламається">
    Запустіть Gateway з `--verbose`, щоб отримати більше деталей у консолі. Потім перевірте файл журналу на помилки автентифікації каналу, маршрутизації моделі та RPC.
  </Accordion>
</AccordionGroup>

## Медіа та вкладення

<AccordionGroup>
  <Accordion title="Мій Skill згенерував зображення/PDF, але нічого не було надіслано">
    Вихідні вкладення від агента мають містити рядок `MEDIA:<path-or-url>` (в окремому рядку). Див. [Налаштування помічника OpenClaw](/uk/start/openclaw) і [Надсилання агентом](/uk/tools/agent-send).

    Надсилання через CLI:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    Також перевірте:

    - Цільовий канал підтримує вихідні медіа й не заблокований allowlist.
    - Файл укладається в обмеження розміру провайдера (зображення змінюються до максимуму 2048 px).
    - `tools.fs.workspaceOnly=true` обмежує надсилання локальних шляхів робочим простором, temp/media-store і файлами, перевіреними пісочницею.
    - `tools.fs.workspaceOnly=false` дозволяє `MEDIA:` надсилати локальні файли хоста, які агент уже може читати, але лише для медіа та безпечних типів документів (зображення, аудіо, відео, PDF і Office-документи). Звичайний текст і файли, схожі на секрети, усе одно блокуються.

    Див. [Зображення](/uk/nodes/images).

  </Accordion>
</AccordionGroup>

## Безпека та контроль доступу

<AccordionGroup>
  <Accordion title="Чи безпечно відкривати OpenClaw для вхідних DM?">
    Ставтеся до вхідних DM як до недовіреного вхідного вмісту. Значення за замовчуванням побудовані так, щоб зменшити ризик:

    - Типова поведінка на каналах із підтримкою DM — **pairing**:
      - Невідомі відправники отримують код pairing; бот не обробляє їхнє повідомлення.
      - Схвалення: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Кількість очікуваних запитів обмежена **3 на канал**; перевірте `openclaw pairing list --channel <channel> [--account <id>]`, якщо код не надійшов.
    - Публічне відкриття DM вимагає явної згоди (`dmPolicy: "open"` і allowlist `"*"`).

    Запустіть `openclaw doctor`, щоб виявити ризиковані політики DM.

  </Accordion>

  <Accordion title="Чи prompt injection — це проблема лише для публічних ботів?">
    Ні. Prompt injection стосується **недовіреного контенту**, а не лише того, хто може написати боту в DM.
    Якщо ваш помічник читає зовнішній контент (web search/fetch, сторінки браузера, email,
    документи, вкладення, вставлені журнали), цей контент може містити інструкції, які намагаються
    перехопити контроль над моделлю. Це може статися, навіть якщо **ви — єдиний відправник**.

    Найбільший ризик виникає, коли ввімкнено інструменти: модель можна змусити
    ексфільтрувати контекст або викликати інструменти від вашого імені. Зменшуйте радіус ураження таким чином:

    - використовуйте агента-«читача» лише для читання або без інструментів, щоб узагальнювати недовірений контент
    - тримайте `web_search` / `web_fetch` / `browser` вимкненими для агентів із увімкненими інструментами
    - також ставтеся до декодованого тексту файлів/документів як до недовіреного: OpenResponses
      `input_file` і витягнення тексту з медіавкладень обгортають витягнутий текст
      явними маркерами меж зовнішнього контенту, а не передають сирий текст файлу
    - використовуйте пісочницю та суворі allowlist інструментів

    Подробиці: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи повинен мій бот мати власний email, обліковий запис GitHub або номер телефону?">
    Так, для більшості налаштувань. Ізоляція бота окремими обліковими записами й номерами телефону
    зменшує радіус ураження, якщо щось піде не так. Це також спрощує ротацію
    облікових даних або відкликання доступу без впливу на ваші особисті облікові записи.

    Починайте з малого. Надавайте доступ лише до тих інструментів і облікових записів, які вам справді потрібні, і розширюйте
    пізніше, якщо буде потрібно.

    Документація: [Безпека](/uk/gateway/security), [Pairing](/uk/channels/pairing).

  </Accordion>

  <Accordion title="Чи можу я дати йому автономію над моїми текстовими повідомленнями і чи це безпечно?">
    Ми **не** рекомендуємо повну автономію над вашими особистими повідомленнями. Найбезпечніший шаблон такий:

    - Тримайте DM у режимі **pairing** або в жорсткому allowlist.
    - Використовуйте **окремий номер або обліковий запис**, якщо хочете, щоб він надсилав повідомлення від вашого імені.
    - Нехай він створює чернетку, а ви **схвалюєте перед надсиланням**.

    Якщо хочете поекспериментувати, робіть це в окремому обліковому записі й тримайте його ізольованим. Див.
    [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи можу я використовувати дешевші моделі для завдань персонального помічника?">
    Так, **якщо** агент призначений лише для чату, а вхідний вміст є довіреним. Менші рівні
    більш схильні до перехоплення інструкцій, тому уникайте їх для агентів із увімкненими інструментами
    або при читанні недовіреного контенту. Якщо вам усе ж потрібна менша модель, жорстко обмежте
    інструменти й запускайте в пісочниці. Див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Я запустив /start у Telegram, але не отримав код pairing">
    Коди pairing надсилаються **лише** тоді, коли невідомий відправник пише боту і
    `dmPolicy: "pairing"` увімкнено. Сам по собі `/start` не генерує код.

    Перевірте очікувані запити:

    ```bash
    openclaw pairing list telegram
    ```

    Якщо вам потрібен негайний доступ, додайте свій id відправника в allowlist або встановіть `dmPolicy: "open"`
    для цього облікового запису.

  </Accordion>

  <Accordion title="WhatsApp: чи буде він писати моїм контактам? Як працює pairing?">
    Ні. Типова політика DM для WhatsApp — **pairing**. Невідомі відправники отримують лише код pairing, а їхнє повідомлення **не обробляється**. OpenClaw відповідає лише на чати, які отримує, або на явні надсилання, які ініціюєте ви.

    Схвалити pairing можна так:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Переглянути очікувані запити:

    ```bash
    openclaw pairing list whatsapp
    ```

    Запит номера телефону в майстрі: він використовується для налаштування вашого **allowlist/власника**, щоб ваші власні DM були дозволені. Він не використовується для автоматичного надсилання. Якщо ви запускаєте все на своєму особистому номері WhatsApp, використовуйте цей номер і ввімкніть `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Команди в чаті, переривання завдань і «він не зупиняється»

<AccordionGroup>
  <Accordion title="Як зупинити показ внутрішніх системних повідомлень у чаті?">
    Більшість внутрішніх або інструментальних повідомлень з’являються лише тоді, коли для цієї сесії ввімкнено **verbose**, **trace** або **reasoning**.

    Виправлення в тому чаті, де ви це бачите:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Якщо все ще надто шумно, перевірте налаштування сесії в Control UI і встановіть verbose
    у **inherit**. Також переконайтеся, що ви не використовуєте профіль бота з `verboseDefault`, встановленим
    у `on` в конфігурації.

    Документація: [Thinking і verbose](/uk/tools/thinking), [Безпека](/uk/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Як зупинити/скасувати запущене завдання?">
    Надішліть будь-який із цих варіантів **як окреме повідомлення** (без слеша):

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

    Це тригери переривання (а не команди зі слешем).

    Для фонових процесів (з інструмента exec) ви можете попросити агента виконати:

    ```
    process action:kill sessionId:XXX
    ```

    Огляд команд зі слешем: див. [Команди зі скісною рискою](/uk/tools/slash-commands).

    Більшість команд мають надсилатися як **окреме** повідомлення, що починається з `/`, але кілька скорочень (наприклад, `/status`) також працюють у рядку для відправників з allowlist.

  </Accordion>

  <Accordion title='Як надіслати повідомлення Discord із Telegram? ("Cross-context messaging denied")'>
    OpenClaw за замовчуванням блокує повідомлення **між різними провайдерами**. Якщо виклик інструмента
    прив’язаний до Telegram, він не надсилатиме в Discord, доки ви явно цього не дозволите.

    Увімкніть повідомлення між провайдерами для агента:

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

  <Accordion title='Чому здається, що бот "ігнорує" повідомлення, які швидко надходять одне за одним?'>
    Режим черги керує тим, як нові повідомлення взаємодіють із поточним запуском. Використовуйте `/queue`, щоб змінити режими:

    - `steer` — нові повідомлення перенаправляють поточне завдання
    - `followup` — повідомлення запускаються по одному
    - `collect` — повідомлення збираються в пакет, і надсилається одна відповідь (за замовчуванням)
    - `steer-backlog` — перенаправити зараз, а потім обробити чергу
    - `interrupt` — перервати поточний запуск і почати заново

    Ви можете додавати параметри на кшталт `debounce:2s cap:25 drop:summarize` для режимів followup.

  </Accordion>
</AccordionGroup>

## Різне

<AccordionGroup>
  <Accordion title='Яка модель за замовчуванням для Anthropic з API-ключем?'>
    В OpenClaw облікові дані та вибір моделі — це різні речі. Установлення `ANTHROPIC_API_KEY` (або збереження API-ключа Anthropic у профілях автентифікації) вмикає автентифікацію, але фактична модель за замовчуванням — це те, що ви налаштували в `agents.defaults.model.primary` (наприклад, `anthropic/claude-sonnet-4-6` або `anthropic/claude-opus-4-6`). Якщо ви бачите `No credentials found for profile "anthropic:default"`, це означає, що Gateway не зміг знайти облікові дані Anthropic в очікуваному `auth-profiles.json` для агента, який зараз виконується.
  </Accordion>
</AccordionGroup>

---

Усе ще застрягли? Запитайте в [Discord](https://discord.com/invite/clawd) або відкрийте [обговорення на GitHub](https://github.com/openclaw/openclaw/discussions).
