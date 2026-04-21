---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час виконання
    - Тріаж проблем, про які повідомляють користувачі, перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-21T06:32:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3bd1df258baa4b289bc95ba0f7757b61c1412e230d93ebb137cb7117fbc3a2f1
    source_path: help/faq.md
    workflow: 15
---

# Поширені запитання

Швидкі відповіді та глибше усунення несправностей для реальних конфігурацій (локальна розробка, VPS, кілька агентів, OAuth/API-ключі, резервне перемикання моделей). Для діагностики під час виконання див. [Усунення несправностей](/uk/gateway/troubleshooting). Для повного довідника з конфігурації див. [Конфігурація](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламалося

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидке локальне зведення: ОС + оновлення, доступність Gateway/сервісу, агенти/сеанси, конфігурація провайдера + проблеми під час виконання (коли Gateway доступний).

2. **Звіт, який можна вставити й поширити (безпечний для поширення)**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з кінцівкою журналу (токени приховано).

3. **Стан демона + порту**

   ```bash
   openclaw gateway status
   ```

   Показує стан виконання супервізора порівняно з доступністю RPC, цільову URL-адресу перевірки та те, яку конфігурацію сервіс, імовірно, використовував.

4. **Глибокі перевірки**

   ```bash
   openclaw status --deep
   ```

   Виконує живу перевірку стану Gateway, зокрема перевірки каналів, коли це підтримується
   (потрібен доступний Gateway). Див. [Стан](/uk/gateway/health).

5. **Відстеження найсвіжішого журналу**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використайте як запасний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові журнали відокремлені від журналів сервісу; див. [Журналювання](/uk/logging) і [Усунення несправностей](/uk/gateway/troubleshooting).

6. **Запустіть doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує конфігурацію та стан + виконує перевірки стану. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок стану Gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # показує цільову URL-адресу + шлях до конфігурації при помилках
   ```

   Запитує у запущеного Gateway повний знімок стану (лише WS). Див. [Стан](/uk/gateway/health).

## Швидкий старт і початкове налаштування

<AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб вийти з глухого кута">
    Використайте локального AI-агента, який може **бачити вашу машину**. Це значно ефективніше, ніж питати
    у Discord, тому що більшість випадків «я застряг» — це **локальні проблеми конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, виконувати команди, перевіряти журнали та допомагати виправити налаштування
    на рівні машини (PATH, сервіси, дозволи, файли автентифікації). Надайте їм **повну вихідну копію репозиторію** через
    інсталяцію з можливістю змін (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **із git-копії**, тож агент може читати код + документацію та
    міркувати про точну версію, яку ви запускаєте. Ви завжди можете повернутися до стабільної версії пізніше,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати та контролювати** виправлення (покроково), а потім виконати лише
    потрібні команди. Так зміни залишаються невеликими, і їх легше перевіряти.

    Якщо ви знайшли реальну помилку або виправлення, будь ласка, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (поділіться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану Gateway/агента + базова конфігурація.
    - `openclaw models status`: перевіряє автентифікацію провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє поширені проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламалося](#перші-60-секунд-якщо-щось-зламалося).
    Документація з встановлення: [Встановлення](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску Heartbeat:

    - `quiet-hours`: поза налаштованим вікном active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожню структуру або лише заголовки
    - `no-tasks-due`: активний режим завдань `HEARTBEAT.md`, але ще не настав час для жодного з інтервалів завдань
    - `alerts-disabled`: уся видимість Heartbeat вимкнена (`showOk`, `showAlerts` і `useIndicator` усі вимкнені)

    У режимі завдань часові мітки настання терміну оновлюються лише після завершення
    реального запуску Heartbeat. Пропущені запуски не позначають завдання як завершені.

    Документація: [Heartbeat](/uk/gateway/heartbeat), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Рекомендований спосіб встановити й налаштувати OpenClaw">
    Репозиторій рекомендує запуск із вихідного коду та використання онбордингу:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw onboard --install-daemon
    ```

    Майстер також може автоматично збирати UI-ресурси. Після онбордингу ви зазвичай запускаєте Gateway на порту **18789**.

    Із вихідного коду (для контриб'юторів/розробників):

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
    Майстер відкриває ваш браузер із чистою (без токенів) URL-адресою панелі керування одразу після онбордингу, а також друкує посилання у підсумку. Залиште цю вкладку відкритою; якщо вона не запустилася, скопіюйте та вставте надруковану URL-адресу на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати панель керування на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується автентифікація спільним секретом, вставте налаштований токен або пароль у налаштуваннях Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо спільний секрет ще не налаштований, згенеруйте токен за допомогою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште прив'язку до loopback, виконайте `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставлення спільного секрету, за умови довіреного хоста Gateway); HTTP API усе ще вимагають автентифікації спільним секретом, якщо ви навмисно не використовуєте private-ingress `none` або HTTP-автентифікацію trusted-proxy.
      Паралельні невдалі спроби автентифікації Serve від того самого клієнта серіалізуються до того, як обмежувач невдалої автентифікації зафіксує їх, тому вже друга невдала повторна спроба може показати `retry later`.
    - **Прив'язка до tailnet**: виконайте `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний спільний секрет у налаштуваннях панелі керування.
    - **Reverse proxy з урахуванням ідентичності**: залиште Gateway за trusted proxy не в loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL-адресу proxy.
    - **SSH-тунель**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, потім відкрийте `http://127.0.0.1:18789/`. Автентифікація спільним секретом усе ще застосовується через тунель; вставте налаштований токен або пароль, якщо з’явиться запит.

    Див. [Панель керування](/web/dashboard) і [Веб-поверхні](/web) для подробиць про режими прив'язки й автентифікацію.

  </Accordion>

  <Accordion title="Чому існують дві конфігурації затвердження exec для затверджень у чаті?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на затвердження до цільових чатів
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом затвердження для exec-затверджень

    Політика host exec усе ще є справжнім бар’єром затвердження. Конфігурація чату лише керує тим,
    де з’являються запити на затвердження та як люди можуть на них відповідати.

    У більшості конфігурацій вам **не** потрібні обидва варіанти:

    - Якщо чат уже підтримує команди та відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначати тих, хто затверджує, OpenClaw тепер автоматично вмикає нативні затвердження з пріоритетом DM, коли `channels.<channel>.execApprovals.enabled` не задано або має значення `"auto"`.
    - Коли доступні нативні картки/кнопки затвердження, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve`, лише якщо результат інструмента каже, що затвердження в чаті недоступні або ручне затвердження є єдиним шляхом.
    - Використовуйте `approvals.exec` лише тоді, коли запити також мають пересилатися до інших чатів або явних кімнат для операцій.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише тоді, коли ви явно хочете, щоб запити на затвердження публікувалися назад у вихідну кімнату/тему.
    - Затвердження Plugin — це ще окрема історія: вони за замовчуванням використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали додатково підтримують нативну обробку plugin-затверджень.

    Коротко: пересилання — для маршрутизації, конфігурація нативного клієнта — для більш зручного UX, специфічного для каналу.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке середовище виконання мені потрібне?">
    Потрібен Node **>= 22**. Рекомендовано `pnpm`. Bun **не рекомендовано** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легкий — у документації вказано, що для особистого використання достатньо **512MB-1GB RAM**, **1 ядра** і приблизно **500MB**
    дискового простору, а також зазначено, що **Raspberry Pi 4 може це запускати**.

    Якщо вам потрібен додатковий запас (журнали, медіа, інші сервіси), **рекомендовано 2GB**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може розміщувати Gateway, а ви можете підключати **nodes** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Чи є поради щодо встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте певних гострих кутів.

    - Використовуйте **64-bit** ОС і Node >= 22.
    - Надавайте перевагу **інсталяції з можливістю змін (git)**, щоб мати змогу бачити журнали й швидко оновлюватися.
    - Починайте без каналів/Skills, а потім додавайте їх по одному.
    - Якщо ви стикаєтеся з дивними проблемами бінарних файлів, це зазвичай проблема **сумісності ARM**.

    Документація: [Linux](/uk/platforms/linux), [Встановлення](/uk/install).

  </Accordion>

  <Accordion title="Застряє на wake up my friend / onboarding will not hatch. Що тепер?">
    Цей екран залежить від доступності Gateway та проходження автентифікації. TUI також надсилає
    «Wake up, my friend!» автоматично під час першого hatch. Якщо ви бачите цей рядок і **немає відповіді**,
    а кількість токенів залишається 0, агент так і не запустився.

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

    Якщо Gateway віддалений, переконайтеся, що тунель/з’єднання Tailscale активне і що UI
    спрямований на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini), не проходячи onboarding заново?">
    Так. Скопіюйте **каталог стану** та **робочий простір**, а потім один раз запустіть Doctor. Це
    збереже вашого бота «точно таким самим» (пам’ять, історію сеансів, автентифікацію та
    стан каналу), якщо ви скопіюєте **обидва** розташування:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте свій робочий простір (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть сервіс Gateway.

    Це зберігає конфігурацію, профілі автентифікації, облікові дані WhatsApp, сеанси та пам’ять. Якщо ви працюєте
    у віддаленому режимі, пам’ятайте, що хост Gateway володіє сховищем сеансів і робочим простором.

    **Важливо:** якщо ви лише комітите/надсилаєте свій робочий простір на GitHub, ви створюєте
    резервну копію **пам’яті + bootstrap-файлів**, але **не** історії сеансів або автентифікації. Вони зберігаються
    у `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язане: [Міграція](/uk/install/migrating), [Де що зберігається на диску](#where-things-live-on-disk),
    [Робочий простір агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перегляньте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи — угорі. Якщо верхній розділ позначено як **Unreleased**, то наступний датований
    розділ є останньою випущеною версією. Записи згруповано за **Highlights**, **Changes** і
    **Fixes** (а також за розділами документації/іншими розділами за потреби).

  </Accordion>

  <Accordion title="Не вдається відкрити docs.openclaw.ai (помилка SSL)">
    Деякі з’єднання Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до списку дозволених, а потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати сайт, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркалюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай стабільний реліз спочатку потрапляє в **beta**, а потім явний
    крок просування переводить ту саму версію в `latest`. Супроводжувачі також можуть
    за потреби публікувати одразу в `latest`. Ось чому beta і stable можуть
    вказувати на **ту саму версію** після просування.

    Подивіться, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди для встановлення та різницю між beta і dev дивіться в акордеоні нижче.

  </Accordion>

  <Accordion title="Як установити beta-версію і яка різниця між beta та dev?">
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

  <Accordion title="Як спробувати найновіші збірки?">
    Є два варіанти:

    1. **Dev-канал (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає вас на гілку `main` і оновлює з вихідного коду.

    2. **Інсталяція з можливістю змін (із сайту інсталятора):**

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це дає вам локальний репозиторій, який можна редагувати, а потім оновлювати через git.

    Якщо ви віддаєте перевагу чистому ручному клонуванню, використайте:

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
    Приблизна оцінка:

    - **Встановлення:** 2–5 хвилин
    - **Onboarding:** 5–15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо процес зависає, скористайтеся [Installer stuck](#quick-start-and-first-run-setup)
    і швидким циклом налагодження у [Я застряг](#quick-start-and-first-run-setup).

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

    Для інсталяції з можливістю змін (git):

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

  <Accordion title="У Windows під час встановлення пише git not found або openclaw not recognized">
    Дві поширені проблеми Windows:

    **1) помилка npm spawn git / git not found**

    - Установіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте та знову відкрийте PowerShell, а потім повторно запустіть інсталятор.

    **2) після встановлення openclaw is not recognized**

    - Ваша глобальна папка bin npm відсутня в PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до свого користувацького PATH (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Закрийте й знову відкрийте PowerShell після оновлення PATH.

    Якщо вам потрібне найзручніше налаштування у Windows, використовуйте **WSL2** замість нативного Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У Windows вивід exec показує спотворений китайський текст — що робити?">
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

    Якщо це все ще відтворюється в останній версії OpenClaw, відстежуйте/повідомляйте тут:

    - [Issue #30640](https://github.com/openclaw/openclaw/issues/30640)

  </Accordion>

  <Accordion title="Документація не відповіла на моє запитання — як отримати кращу відповідь?">
    Використайте **інсталяцію з можливістю змін (git)**, щоб повний вихідний код і документація були у вас локально, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг прочитати репозиторій і дати точну відповідь.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Встановлення](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як установити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтесь інструкції для Linux, а потім запустіть onboarding.

    - Швидкий шлях для Linux + встановлення сервісу: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення й оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як установити OpenClaw на VPS?">
    Підійде будь-який Linux VPS. Установіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Посібники: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де посібники зі встановлення в хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з популярними провайдерами. Оберіть одного та дотримуйтесь посібника:

    - [VPS-хостинг](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    з ноутбука/телефона через Control UI (або Tailscale/SSH). Ваш стан + робочий простір
    живуть на сервері, тому ставтеся до хоста як до джерела істини та створюйте його резервні копії.

    Ви можете підключати **nodes** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримувати доступ
    до локального екрана/камери/canvas або виконувати команди на ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновитися самостійно?">
    Коротка відповідь: **можливо, але не рекомендовано**. Процес оновлення може перезапустити
    Gateway (що обриває активний сеанс), може потребувати чистого git checkout і
    може запитувати підтвердження. Безпечніше запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо вам обов’язково потрібно автоматизувати це з агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить onboarding?">
    `openclaw onboard` — це рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth провайдера, API-ключі, токен налаштування Anthropic, а також варіанти локальних моделей, як-от LM Studio)
    - Розташування **робочого простору** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані channel Plugins, як-от QQ Bot)
    - **Установлення демона** (LaunchAgent у macOS; systemd user unit у Linux/WSL2)
    - **Перевірки стану** і вибір **Skills**

    Він також попереджає, якщо ваша налаштована модель невідома або для неї немає автентифікації.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це запускати?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації в цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **API-ключ Anthropic**: звичайне тарифікування Anthropic API
    - **Автентифікація Claude CLI / підпискою Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів Gateway API-ключі Anthropic усе ще є більш
    передбачуваним варіантом налаштування. OAuth OpenAI Codex явно підтримується для зовнішніх
    інструментів на кшталт OpenClaw.

    OpenClaw також підтримує інші розміщені варіанти у стилі підписки, зокрема
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

    Токен налаштування Anthropic і далі доступний як підтримуваний шлях токена OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI та `claude -p`, коли це можливо.
    Для production або багатокористувацьких навантажень автентифікація через API-ключ Anthropic все ще є
    безпечнішим і більш передбачуваним вибором. Якщо вас цікавлять інші розміщені
    варіанти у стилі підписки в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [Моделі
    GLM](/uk/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
Це означає, що вашу **квоту/ліміт швидкості Anthropic** вичерпано для поточного вікна. Якщо ви
використовуєте **Claude CLI**, дочекайтеся скидання вікна або оновіть свій план. Якщо ви
використовуєте **API-ключ Anthropic**, перевірте Anthropic Console
щодо використання/білінгу й за потреби підвищте ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, запит намагається використовувати
    бета-версію контексту Anthropic на 1M (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані мають право на білінг довгого контексту (білінг API-ключа або
    шлях входу в Claude OpenClaw з увімкненим Extra Usage).

    Порада: задайте **резервну модель**, щоб OpenClaw міг і далі відповідати, поки провайдер обмежений за rate limit.
    Див. [Моделі](/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудованого провайдера **Amazon Bedrock (Converse)**. Якщо присутні маркери середовища AWS, OpenClaw може автоматично виявити каталог потокового/текстового Bedrock і об’єднати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис ручного провайдера. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний proxy перед Bedrock також лишається дійсним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Onboarding може запустити потік OAuth і за потреби встановить модель за замовчуванням `openai-codex/gpt-5.4`. Див. [Провайдери моделей](/uk/concepts/model-providers) і [Onboarding (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому ChatGPT GPT-5.4 не відкриває openai/gpt-5.4 в OpenClaw?">
    OpenClaw розглядає ці два шляхи окремо:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = прямий API OpenAI Platform

    В OpenClaw вхід через ChatGPT/Codex прив’язаний до маршруту `openai-codex/*`,
    а не до прямого маршруту `openai/*`. Якщо вам потрібен прямий шлях API в
    OpenClaw, встановіть `OPENAI_API_KEY` (або еквівалентну конфігурацію провайдера OpenAI).
    Якщо вам потрібен вхід через ChatGPT/Codex в OpenClaw, використовуйте `openai-codex/*`.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    `openai-codex/*` використовує маршрут Codex OAuth, і доступні вікна квоти для нього
    керуються OpenAI та залежать від плану. На практиці ці ліміти можуть відрізнятися від
    досвіду використання сайту/застосунку ChatGPT, навіть якщо обидва прив’язані до одного акаунта.

    OpenClaw може показувати поточні видимі вікна використання/квоти провайдера в
    `openclaw models status`, але не вигадує і не нормалізує entitlement’и ChatGPT web
    у прямий доступ до API. Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API-ключем.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth підписки OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання OAuth підписки в зовнішніх інструментах/процесах
    на кшталт OpenClaw. Onboarding може запустити потік OAuth за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Onboarding (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **потік автентифікації Plugin**, а не client id або secret у `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть Plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Модель за замовчуванням після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не вдаються, задайте `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості Gateway

    Це зберігає OAuth-токени в профілях автентифікації на хості Gateway. Докладніше: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; малі карти обрізають і пропускають витоки. Якщо вже потрібно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі підвищують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як тримати трафік розміщених моделей у певному регіоні?">
    Вибирайте endpoints із фіксацією регіону. OpenRouter надає варіанти MiniMax, Kimi та GLM, розміщені в США; вибирайте варіант, розміщений у США, щоб зберігати дані в межах регіону. Ви все одно можете вказувати Anthropic/OpenAI поруч із ними, використовуючи `models.mode: "merge"`, щоб резервні варіанти залишалися доступними, водночас дотримуючись вибраного вами регіонального провайдера.
  </Accordion>

  <Accordion title="Чи обов’язково купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini — необов’язковий варіант: деякі люди
    купують його як постійно увімкнений хост, але також підійде невеликий VPS, домашній сервер або коробка рівня Raspberry Pi.

    Mac вам потрібен лише **для інструментів тільки для macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти тільки для macOS, запускайте Gateway на Mac або підключайте macOS Node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, увійшовший у Messages. Це **не обов’язково** має бути Mac mini —
    підійде будь-який Mac. **Використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) для iMessage — сервер BlueBubbles працює на macOS, а Gateway може працювати на Linux або деінде.

    Типові конфігурації:

    - Запускайте Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, увійшовшому в Messages.
    - Запускайте все на Mac, якщо хочете найпростішу конфігурацію на одній машині.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи зможу я під’єднати його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **Node** (супутній пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, як-от screen/camera/canvas і `system.run` на цьому пристрої.

    Типовий шаблон:

    - Gateway на Mac mini (завжди увімкнений).
    - MacBook Pro запускає застосунок macOS або хост Node і підключається до Gateway.
    - Щоб побачити його, використовуйте `openclaw nodes status` / `openclaw nodes list`.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можна використовувати Bun?">
    Bun **не рекомендований**. Ми спостерігаємо помилки під час виконання, особливо з WhatsApp і Telegram.
    Для стабільних Gateway використовуйте **Node**.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на не-production Gateway
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Під час налаштування запитуються лише числові user ID. Якщо у вашій конфігурації вже є застарілі записи `@username`, `openclaw doctor --fix` може спробувати їх розв’язати.

    Безпечніше (без стороннього бота):

    - Надішліть DM своєму боту, потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Надішліть DM своєму боту, потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонні сервіси (менш приватно):

    - Надішліть DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **маршрутизацію кількох агентів**. Прив’яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, sender E.164 на кшталт `+15551234567`) до іншого `agentId`, щоб кожна людина мала власний робочий простір і сховище сеансів. Відповіді все одно надходитимуть з **того самого акаунта WhatsApp**, а контроль доступу DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного акаунта WhatsApp. Див. [Маршрутизація кількох агентів](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента "швидкий чат" і агента "Opus для кодування"?'>
    Так. Використовуйте маршрутизацію кількох агентів: задайте кожному агенту власну модель за замовчуванням, а потім прив’яжіть вхідні маршрути (акаунт провайдера або конкретні peers) до кожного агента. Приклад конфігурації є в [Маршрутизація кількох агентів](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, знаходилися в non-login shells.
    Останні збірки також додають на початок типові користувацькі bin-каталоги в Linux systemd services (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо вони задані.

  </Accordion>

  <Accordion title="Різниця між інсталяцією hackable git і npm install">
    - **Інсталяція hackable (git):** повна копія вихідного коду, можна редагувати, найкраще для контриб’юторів.
      Ви локально запускаєте збірки й можете патчити код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для варіанту «просто запустити».
      Оновлення надходять із npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між інсталяціями npm і git?">
    Так. Установіть інший варіант, а потім запустіть Doctor, щоб сервіс Gateway вказував на нову точку входу.
    Це **не видаляє ваші дані** — воно лише змінює інсталяцію коду OpenClaw. Ваш стан
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

    Doctor виявляє невідповідність точки входу сервісу Gateway і пропонує переписати конфігурацію сервісу відповідно до поточної інсталяції (використовуйте `--repair` для автоматизації).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібен
    мінімальний поріг входу й ви не проти сну/перезапусків, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Плюси:** без витрат на сервер, прямий доступ до локальних файлів, живе вікно браузера.
    - **Мінуси:** сон/обриви мережі = роз’єднання, оновлення/перезавантаження ОС переривають роботу, комп’ютер має залишатися активним.

    **VPS / хмара**

    - **Плюси:** завжди увімкнений, стабільна мережа, немає проблем зі сном ноутбука, легше підтримувати безперервну роботу.
    - **Мінуси:** часто працює без графічного інтерфейсу (використовуйте скріншоти), лише віддалений доступ до файлів, для оновлень потрібен SSH.

    **Примітка, специфічна для OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord чудово працюють із VPS. Єдиний реальний компроміс — **браузер без графічного інтерфейсу** чи видиме вікно. Див. [Браузер](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо у вас уже траплялися роз’єднання Gateway. Локальний запуск чудово підходить, коли ви активно користуєтеся Mac і хочете локальний доступ до файлів або автоматизацію UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Не обов’язково, але **рекомендовано для надійності та ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** завжди увімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, легше підтримувати безперервну роботу.
    - **Спільний ноутбук/настільний комп’ютер:** цілком підходить для тестування й активного використання, але очікуйте пауз, коли машина переходить у сон або оновлюється.

    Якщо ви хочете поєднати переваги обох варіантів, тримайте Gateway на виділеному хості, а ноутбук підключіть як **Node** для локальних інструментів екрана/камери/exec. Див. [Nodes](/uk/nodes).
    Для рекомендацій із безпеки прочитайте [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яку ОС рекомендовано?">
    OpenClaw легкий. Для базового Gateway + одного каналу чату:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM, ~500MB диска.
    - **Рекомендовано:** 1–2 vCPU, 2GB RAM або більше із запасом (журнали, медіа, кілька каналів). Інструменти Node і автоматизація браузера можуть бути ресурсомісткими.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях інсталяції для Linux найкраще протестовано саме там.

    Документація: [Linux](/uk/platforms/linux), [VPS-хостинг](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди увімкненою, доступною та мати достатньо
    RAM для Gateway і будь-яких каналів, які ви ввімкнете.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1GB RAM.
    - **Рекомендовано:** 2GB RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера чи медіаінструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви працюєте у Windows, **WSL2 — це найпростіший варіант у стилі VM** і він має найкращу
    сумісність з інструментами. Див. [Windows](/uk/platforms/windows), [VPS-хостинг](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw, в одному абзаці?">
    OpenClaw — це персональний AI-помічник, якого ви запускаєте на власних пристроях. Він відповідає в тих середовищах обміну повідомленнями, якими ви вже користуєтеся (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, а також вбудовані channel Plugins, як-от QQ Bot) і також може працювати з голосом + живим Canvas на підтримуваних платформах. **Gateway** — це завжди увімкнена площина керування; помічник і є продуктом.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не «просто обгортка над Claude». Це **локальна насамперед площина керування**, яка дає змогу запускати
    потужного помічника на **вашому власному обладнанні**, доступного з тих чат-застосунків, якими ви вже користуєтеся, з
    сесійною історією, пам’яттю та інструментами — без передавання контролю над вашими процесами розміщеному
    SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway там, де хочете (Mac, Linux, VPS), і зберігайте
      робочий простір + історію сеансів локально.
    - **Реальні канали, а не веб-пісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      а також мобільний голос і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо з маршрутизацією
      та резервним перемиканням для кожного агента.
    - **Варіант лише локально:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо ви цього хочете.
    - **Маршрутизація кількох агентів:** окремі агенти для кожного каналу, акаунта або завдання, кожен із власним
      робочим простором і параметрами за замовчуванням.
    - **Відкритий код і можливість змін:** перевіряйте, розширюйте й self-host без vendor lock-in.

    Документація: [Gateway](/uk/gateway), [Канали](/uk/channels), [Кілька агентів](/uk/concepts/multi-agent),
    [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував — що мені зробити спочатку?">
    Хороші перші проєкти:

    - Створити вебсайт (WordPress, Shopify або простий статичний сайт).
    - Зробити прототип мобільного застосунку (структура, екрани, план API).
    - Упорядкувати файли та папки (очищення, іменування, теги).
    - Підключити Gmail та автоматизувати підсумки або подальші дії.

    Він може працювати з великими завданнями, але найкраще це вдається, коли ви ділите їх на фази й
    використовуєте субагентів для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найпоширеніших повсякденних сценаріїв використання OpenClaw?">
    Щоденна користь зазвичай виглядає так:

    - **Персональні брифінги:** підсумки пошти, календаря та новин, які вас цікавлять.
    - **Дослідження й чернетки:** швидкі дослідження, підсумки й перші чернетки для листів або документів.
    - **Нагадування та подальші дії:** підказки й чеклісти, керовані Cron або Heartbeat.
    - **Автоматизація браузера:** заповнення форм, збір даних і повторювані веб-завдання.
    - **Координація між пристроями:** надішліть завдання з телефона, дозвольте Gateway виконати його на сервері та отримайте результат назад у чаті.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, рекламою та блогами для SaaS?">
    Так — для **дослідження, кваліфікації та створення чернеток**. Він може сканувати сайти, складати короткі списки,
    узагальнювати інформацію про потенційних клієнтів і писати чернетки для outreach або рекламних текстів.

    Для **outreach або запуску реклами** залишайте людину в циклі. Уникайте спаму, дотримуйтесь місцевих законів і
    політик платформ та перевіряйте все перед надсиланням. Найбезпечніший шаблон — дозволити
    OpenClaw робити чернетку, а вам — затверджувати.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний помічник** і рівень координації, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу кодування всередині репозиторію. Використовуйте OpenClaw, коли вам
    потрібні довготривала пам’ять, доступ із різних пристроїв і оркестрація інструментів.

    Переваги:

    - **Постійна пам’ять + робочий простір** між сеансами
    - **Доступ із кількох платформ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (браузер, файли, планування, hooks)
    - **Завжди увімкнений Gateway** (запускайте на VPS, взаємодійте звідусіль)
    - **Nodes** для локального браузера/екрана/камери/exec

    Вітрина: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills і автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати skills, не залишаючи репозиторій у брудному стані?">
    Використовуйте керовані перевизначення замість редагування копії в репозиторії. Зберігайте свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`, тому керовані перевизначення все одно мають пріоритет над вбудованими skills без зміни git. Якщо вам потрібно, щоб skill був установлений глобально, але видимий лише для певних агентів, тримайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` і `agents.list[].skills`. Лише зміни, гідні апстриму, мають жити в репозиторії й надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати skills з власної папки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий пріоритет: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`. `clawhub` установлює у `./skills` за замовчуванням, і OpenClaw обробляє це як `<workspace>/skills` у наступному сеансі. Якщо skill має бути видимим лише для певних агентів, поєднуйте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як я можу використовувати різні моделі для різних завдань?">
    Сьогодні підтримуються такі шаблони:

    - **Завдання Cron**: ізольовані завдання можуть задавати перевизначення `model` для кожного завдання.
    - **Субагенти**: маршрутизуйте завдання до окремих агентів з різними моделями за замовчуванням.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб у будь-який момент змінити модель поточного сеансу.

    Див. [Завдання Cron](/uk/automation/cron-jobs), [Маршрутизація кількох агентів](/uk/concepts/multi-agent) і [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час виконання важкої роботи. Як винести це в окремий процес?">
    Використовуйте **субагентів** для довгих або паралельних завдань. Субагенти працюють у власному сеансі,
    повертають підсумок і зберігають чутливість вашого основного чату.

    Попросіть свого бота «spawn a sub-agent for this task» або використайте `/subagents`.
    Використовуйте `/status` у чаті, щоб бачити, що Gateway робить прямо зараз (і чи він зайнятий).

    Порада щодо токенів: і довгі завдання, і субагенти споживають токени. Якщо вас турбує вартість, задайте
    дешевшу модель для субагентів через `agents.defaults.subagents.model`.

    Документація: [Субагенти](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють прив’язані до тредів сеанси субагентів у Discord?">
    Використовуйте прив’язки до тредів. Ви можете прив’язати тред Discord до субагента або цілі сеансу, щоб наступні повідомлення в цьому треді залишалися в межах прив’язаного сеансу.

    Базовий процес:

    - Створіть через `sessions_spawn` з `thread: true` (і за бажанням `mode: "session"` для постійших подальших повідомлень).
    - Або прив’яжіть вручну через `/focus <target>`.
    - Використовуйте `/agents`, щоб переглядати стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним зняттям фокуса.
    - Використовуйте `/unfocus`, щоб від’єднати тред.

    Потрібна конфігурація:

    - Глобальні параметри за замовчуванням: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Перевизначення Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоприв’язка під час створення: задайте `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Субагенти](/uk/tools/subagents), [Discord](/uk/channels/discord), [Довідник із конфігурації](/uk/gateway/configuration-reference), [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Субагент завершився, але оновлення про завершення пішло не туди або взагалі не опублікувалося. Що перевірити?">
    Спочатку перевірте розв’язаний маршрут запитувача:

    - Доставка субагента в режимі завершення надає перевагу будь-якому прив’язаному треду або маршруту розмови, якщо такий існує.
    - Якщо джерело завершення містить лише канал, OpenClaw використовує як запасний варіант збережений маршрут сеансу запитувача (`lastChannel` / `lastTo` / `lastAccountId`), щоб пряма доставка все ще могла спрацювати.
    - Якщо немає ні прив’язаного маршруту, ні придатного збереженого маршруту, пряма доставка може не вдатися, і результат замість негайної публікації в чаті перейде до доставки через чергу сеансу.
    - Неприпустимі або застарілі цілі все одно можуть примусово перевести процес до запасного варіанта через чергу або до остаточного збою доставки.
    - Якщо остання видима відповідь помічника дочірнього агента — це точний silent token `NO_REPLY` / `no_reply`, або точно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує сповіщення замість публікації застарілого попереднього прогресу.
    - Якщо дочірній агент перевищив час очікування після одних лише викликів інструментів, сповіщення може згорнути це в короткий підсумок часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Субагенти](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks), [Інструмент сеансів](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron виконується всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання не запускатимуться.

    Контрольний список:

    - Переконайтеся, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не задано.
    - Переконайтеся, що Gateway працює 24/7 (без сну/перезапусків).
    - Перевірте налаштування часового поясу для завдання (`--tz` порівняно з часовим поясом хоста).

    Налагодження:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    Документація: [Завдання Cron](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation).

  </Accordion>

  <Accordion title="Cron спрацював, але в канал нічого не було надіслано. Чому?">
    Спочатку перевірте режим доставки:

    - `--no-deliver` / `delivery.mode: "none"` означає, що запасне надсилання з боку виконавця не очікується.
    - Відсутня або неприпустима ціль сповіщення (`channel` / `to`) означає, що виконавець пропустив вихідну доставку.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що виконавець намагався доставити повідомлення, але облікові дані це заблокували.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` тільки) вважається навмисно недоставлюваним, тому виконавець також пригнічує запасну доставку через чергу.

    Для ізольованих завдань cron агент усе ще може надсилати напряму за допомогою інструмента `message`,
    коли доступний маршрут чату. `--announce` керує лише запасним шляхом виконавця
    для фінального тексту, який агент ще не надіслав сам.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Завдання Cron](/uk/automation/cron-jobs), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований запуск cron переключив модель або один раз повторився?">
    Зазвичай це шлях живого перемикання моделі, а не дублювання планування.

    Ізольований cron може зберегти передачу моделі під час виконання й повторити спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає переключеного
    провайдера/модель, а якщо перемикання містило нове перевизначення профілю автентифікації, cron
    також зберігає його перед повторною спробою.

    Пов’язані правила вибору:

    - Спочатку має пріоритет перевизначення моделі hook Gmail, якщо воно застосовується.
    - Потім `model` для конкретного завдання.
    - Потім будь-яке збережене перевизначення моделі сеансу cron.
    - Потім звичайний вибір моделі агента/за замовчуванням.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 повторних спроб перемикання
    cron переривається, а не зациклюється назавжди.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Завдання Cron](/uk/automation/cron-jobs), [CLI cron](/cli/cron).

  </Accordion>

  <Accordion title="Як установити skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або просто поміщайте skills у свій робочий простір. UI Skills для macOS недоступний на Linux.
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
    активного робочого простору. Окремий CLI `clawhub` потрібен лише тоді, коли ви хочете публікувати або
    синхронізувати власні skills. Для спільних інсталяцій між агентами помістіть skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете звузити набір агентів, які можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати завдання за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Завдання Cron** для запланованих або повторюваних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок «основного сеансу».
    - **Ізольовані завдання** для автономних агентів, які публікують підсумки або доставляють повідомлення в чати.

    Документація: [Завдання Cron](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати skills тільки для Apple macOS з Linux?">
    Не напряму. Skills для macOS обмежуються через `metadata.openclaw.os` плюс необхідні бінарні файли, і skills з’являються в system prompt лише тоді, коли вони придатні на **хості Gateway**. На Linux skills лише для `darwin` (як-от `apple-notes`, `apple-reminders`, `things-mac`) не завантажуватимуться, якщо ви не перевизначите це обмеження.

    Є три підтримувані шаблони:

    **Варіант A — запускати Gateway на Mac (найпростіше).**
    Запустіть Gateway там, де існують бінарні файли macOS, а потім підключайтеся з Linux у [віддаленому режимі](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Skills завантажуються звичайно, тому що хост Gateway — це macOS.

    **Варіант B — використовувати macOS Node (без SSH).**
    Запустіть Gateway на Linux, підключіть macOS Node (застосунок менюбару) і встановіть **Node Run Commands** у значення "Always Ask" або "Always Allow" на Mac. OpenClaw може вважати skills лише для macOS придатними, коли потрібні бінарні файли існують на Node. Агент запускає ці skills через інструмент `nodes`. Якщо ви оберете "Always Ask", затвердження "Always Allow" у запиті додасть цю команду до allowlist.

    **Варіант C — проксувати бінарні файли macOS через SSH (розширений).**
    Залиште Gateway на Linux, але зробіть так, щоб потрібні бінарні CLI розв’язувалися в SSH-обгортки, які запускаються на Mac. Потім перевизначте skill, щоб дозволити Linux і зберегти його придатним.

    1. Створіть SSH-обгортку для бінарного файлу (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Додайте обгортку в `PATH` на хості Linux (наприклад, `~/bin/memo`).
    3. Перевизначте metadata skill (у робочому просторі або `~/.openclaw/skills`), щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Керування Apple Notes через CLI memo на macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Почніть новий сеанс, щоб знімок skills оновився.

  </Accordion>

  <Accordion title="Чи є у вас інтеграція з Notion або HeyGen?">
    Сьогодні вбудованої немає.

    Варіанти:

    - **Власний skill / Plugin:** найкращий варіант для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Автоматизація браузера:** працює без коду, але повільніше й крихкіше.

    Якщо ви хочете зберігати контекст окремо для кожного клієнта (робочі процеси агентства), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + уподобання + активна робота).
    - Попросіть агента отримувати цю сторінку на початку сеансу.

    Якщо вам потрібна нативна інтеграція, відкрийте запит на функцію або створіть skill,
    орієнтований на ці API.

    Установлення skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні інсталяції потрапляють у каталог `skills/` активного робочого простору. Для спільних skills між агентами розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільну інсталяцію мають бачити лише деякі агенти, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі skills очікують бінарні файли, установлені через Homebrew; у Linux це означає Linuxbrew (див. запис FAQ про Homebrew на Linux вище). Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати свій уже авторизований Chrome з OpenClaw?">
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

    Цей шлях може використовувати локальний браузер хоста або підключений browser Node. Якщо Gateway запускається деінде, або запускайте хост Node на машині з браузером, або використовуйте віддалений CDP.

    Поточні обмеження `existing-session` / `user`:

    - дії прив’язані до `ref`, а не до CSS-селекторів
    - завантаження файлів вимагає `ref` / `inputRef` і наразі підтримує лише один файл за раз
    - `responsebody`, експорт PDF, перехоплення завантажень і пакетні дії все ще потребують керованого браузера або сирого профілю CDP

  </Accordion>
</AccordionGroup>

## Ізоляція та пам’ять

<AccordionGroup>
  <Accordion title="Чи є окремий документ про ізоляцію?">
    Так. Див. [Ізоляція](/uk/gateway/sandboxing). Для налаштування, специфічного для Docker (повний Gateway у Docker або образи ізоляції), див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повні можливості?">
    Типовий образ орієнтований насамперед на безпеку й працює від імені користувача `node`, тому він не
    містить системних пакетів, Homebrew або вбудованих браузерів. Для повнішого налаштування:

    - Зробіть `/home/node` постійним за допомогою `OPENCLAW_HOME_VOLUME`, щоб кеші зберігалися.
    - Вмонтуйте системні залежності в образ через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Установіть браузери Playwright через вбудований CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Задайте `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається постійно.

    Документація: [Docker](/uk/install/docker), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я зберегти DM приватними, а групи зробити публічними/ізольованими з одним агентом?">
    Так — якщо ваш приватний трафік це **DM**, а публічний трафік — **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб сеанси груп/каналів (ключі не-main) працювали у налаштованому backend ізоляції, а основний сеанс DM залишався на хості. Docker — backend за замовчуванням, якщо ви не виберете інший. Потім обмежте, які інструменти доступні в ізольованих сеансах, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: приватні DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Довідник з ключової конфігурації: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати папку хоста до sandbox?">
    Задайте `agents.defaults.sandbox.docker.binds` як `["host:path:mode"]` (наприклад, `"/home/user/src:/src:ro"`). Глобальні прив’язки й прив’язки для конкретного агента об’єднуються; прив’язки для конкретного агента ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для всього чутливого й пам’ятайте, що прив’язки обходять файлові стіни sandbox.

    OpenClaw перевіряє джерела bind як за нормалізованим шляхом, так і за канонічним шляхом, розв’язаним через найглибшого наявного предка. Це означає, що виходи через symlink-батьківський каталог усе одно блокуються за принципом fail closed, навіть коли останній сегмент шляху ще не існує, а перевірки allowed-root усе одно застосовуються після розв’язання symlink.

    Див. [Ізоляція](/uk/gateway/sandboxing#custom-bind-mounts) і [Ізоляція vs Політика інструментів vs Підвищені права](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check) для прикладів і приміток щодо безпеки.

  </Accordion>

  <Accordion title="Як працює пам’ять?">
    Пам’ять OpenClaw — це просто Markdown-файли в робочому просторі агента:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Відібрані довгострокові нотатки в `MEMORY.md` (лише для main/приватних сеансів)

    OpenClaw також виконує **тихе скидання пам’яті перед Compaction**, щоб нагадати моделі
    записати стійкі нотатки перед автоматичним Compaction. Це працює лише тоді, коли робочий простір
    доступний для запису (sandbox у режимі лише читання це пропускають). Див. [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Пам’ять постійно все забуває. Як зробити, щоб це закріплювалося?">
    Попросіть бота **записати факт у пам’ять**. Довгострокові нотатки мають зберігатися в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще сфера, яку ми вдосконалюємо. Корисно нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона все одно забуває, перевірте, що Gateway використовує той самий
    робочий простір під час кожного запуску.

    Документація: [Пам’ять](/uk/concepts/memory), [Робочий простір агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається пам’ять назавжди? Які є обмеження?">
    Файли пам’яті живуть на диску й зберігаються, доки ви їх не видалите. Обмеженням є ваше
    сховище, а не модель. **Контекст сеансу** все одно обмежується вікном контексту
    моделі, тому довгі розмови можуть стискатися або обрізатися. Саме тому
    існує пошук у пам’яті — він повертає в контекст лише релевантні частини.

    Документація: [Пам’ять](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потребує семантичний пошук у пам’яті API-ключ OpenAI?">
    Лише якщо ви використовуєте **вбудовування OpenAI**. Codex OAuth покриває чат/completions і
    **не** надає доступу до вбудовувань, тож **вхід через Codex (OAuth або
    вхід через Codex CLI)** не допомагає для семантичного пошуку в пам’яті. Для вбудовувань OpenAI
    усе ще потрібен справжній API-ключ (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви явно не задаєте провайдера, OpenClaw автоматично вибирає провайдера, коли
    може знайти API-ключ (профілі автентифікації, `models.providers.*.apiKey` або змінні середовища).
    Він надає перевагу OpenAI, якщо знаходиться ключ OpenAI, інакше Gemini, якщо знаходиться ключ Gemini,
    потім Voyage, потім Mistral. Якщо жоден віддалений ключ недоступний, пошук у пам’яті
    залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштовано й доступний шлях
    до локальної моделі, OpenClaw
    надає перевагу `local`. Ollama підтримується, коли ви явно задаєте
    `memorySearch.provider = "ollama"`.

    Якщо ви хочете залишатися локально, задайте `memorySearch.provider = "local"` (і за бажанням
    `memorySearch.fallback = "none"`). Якщо вам потрібні вбудовування Gemini, задайте
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо моделі вбудовувань **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    деталі налаштування див. у [Пам’ять](/uk/concepts/memory).

  </Accordion>
</AccordionGroup>

## Де що зберігається на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, що використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** сеанси, файли пам’яті, конфігурація та робочий простір живуть на хості Gateway
      (`~/.openclaw` + каталог вашого робочого простору).
    - **Віддалено за потребою:** повідомлення, які ви надсилаєте провайдерам моделей (Anthropic/OpenAI тощо), ідуть до
      їхніх API, а чат-платформи (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на
      своїх серверах.
    - **Ви керуєте обсягом:** використання локальних моделей залишає prompt-и на вашій машині, але трафік
      каналів усе одно проходить через сервери цього каналу.

    Пов’язане: [Робочий простір агента](/uk/concepts/agent-workspace), [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе зберігається в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Шлях                                                            | Призначення                                                        |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основна конфігурація (JSON5)                                       |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Застарілий імпорт OAuth (копіюється в профілі автентифікації під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Профілі автентифікації (OAuth, API-ключі та необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язкове сховище секретів у файлі для провайдерів SecretRef типу `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Застарілий файл сумісності (статичні записи `api_key` очищено)     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдера (наприклад `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан для кожного агента окремо (agentDir + sessions)               |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (для кожного агента окремо)                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані сеансів (для кожного агента окремо)                       |

    Застарілий шлях для одного агента: `~/.openclaw/agent/*` (мігрується за допомогою `openclaw doctor`).

    Ваш **робочий простір** (`AGENTS.md`, файли пам’яті, skills тощо) відокремлений і налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають зберігатися AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли зберігаються в **робочому просторі агента**, а не в `~/.openclaw`.

    - **Робочий простір (для кожного агента):** `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (або застарілий запасний варіант `memory.md`, коли `MEMORY.md` відсутній),
      `memory/YYYY-MM-DD.md`, необов’язково `HEARTBEAT.md`.
    - **Каталог стану (`~/.openclaw`)**: конфігурація, стан каналу/провайдера, профілі автентифікації, сеанси, журнали,
      і спільні skills (`~/.openclaw/skills`).

    Типовий робочий простір — `~/.openclaw/workspace`, його можна налаштувати через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот «забуває» після перезапуску, переконайтеся, що Gateway використовує той самий
    робочий простір під час кожного запуску (і пам’ятайте: віддалений режим використовує **робочий простір хоста gateway**,
    а не вашого локального ноутбука).

    Порада: якщо вам потрібна стійка поведінка або вподобання, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладатися на історію чату.

    Див. [Робочий простір агента](/uk/concepts/agent-workspace) і [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Помістіть свій **робочий простір агента** в **приватний** git-репозиторій і створюйте його резервну копію
    у приватному місці (наприклад, у приватному GitHub). Це збереже пам’ять + файли AGENTS/SOUL/USER
    і дозволить пізніше відновити «свідомість» помічника.

    **Не** комітьте нічого з `~/.openclaw` (облікові дані, сеанси, токени або зашифровані секретні payload-и).
    Якщо вам потрібне повне відновлення, окремо створюйте резервні копії і робочого простору, і каталогу стану
    (див. питання про міграцію вище).

    Документація: [Робочий простір агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окремий посібник: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть агенти працювати поза робочим простором?">
    Так. Робочий простір — це **типовий cwd** і якір пам’яті, а не жорстка sandbox.
    Відносні шляхи розв’язуються всередині робочого простору, але абсолютні шляхи можуть отримувати доступ до інших
    розташувань хоста, якщо sandboxing не ввімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування sandbox для конкретного агента. Якщо ви
    хочете, щоб репозиторій був типовим робочим каталогом, вкажіть `workspace`
    цього агента на корінь репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
    робочий простір окремо, якщо тільки ви навмисно не хочете, щоб агент працював усередині нього.

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

  <Accordion title="Віддалений режим: де зберігаються сеанси?">
    Стан сеансів належить **хосту gateway**. Якщо ви працюєте у віддаленому режимі, потрібне вам сховище сеансів розташоване на віддаленій машині, а не на вашому локальному ноутбуці. Див. [Керування сеансами](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="Який формат конфігурації? Де вона розташована?">
    OpenClaw читає необов’язкову конфігурацію **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються відносно безпечні значення за замовчуванням (зокрема типовий робочий простір `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я задав gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Прив’язки не-loopback **вимагають дійсного шляху автентифікації gateway**. На практиці це означає:

    - автентифікацію спільним секретом: токен або пароль
    - `gateway.auth.mode: "trusted-proxy"` за правильно налаштованим non-loopback reverse proxy з урахуванням ідентичності

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
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як запасний варіант лише тоді, коли `gateway.auth.*` не задано.
    - Для автентифікації паролем натомість задайте `gateway.auth.mode: "password"` плюс `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef, але не розв’язано, розв’язання завершується fail closed (без маскування запасним варіантом remote).
    - Конфігурації Control UI зі спільним секретом проходять автентифікацію через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях застосунку/UI). Режими з передаванням ідентичності, як-от Tailscale Serve або `trusted-proxy`, замість цього використовують заголовки запитів. Не розміщуйте спільні секрети в URL.
    - З `gateway.auth.mode: "trusted-proxy"` reverse proxy loopback на тому самому хості все одно **не** задовольняють автентифікацію trusted-proxy. Trusted proxy має бути налаштованим non-loopback джерелом.

  </Accordion>

  <Accordion title="Чому мені тепер потрібен токен на localhost?">
    OpenClaw примусово вимагає автентифікацію gateway за замовчуванням, зокрема й для loopback. У звичайному типовому сценарії це означає автентифікацію токеном: якщо явний шлях автентифікації не налаштований, запуск gateway переходить у режим токена й автоматично генерує його, зберігаючи в `gateway.auth.token`, тож **локальні WS-клієнти повинні проходити автентифікацію**. Це блокує інші локальні процеси від виклику Gateway.

    Якщо ви віддаєте перевагу іншому шляху автентифікації, можете явно вибрати режим пароля (або, для non-loopback reverse proxy з урахуванням ідентичності, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно задайте `gateway.auth.mode: "none"` у своїй конфігурації. Doctor може згенерувати токен у будь-який час: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни конфігурації?">
    Gateway відстежує конфігурацію й підтримує гаряче перезавантаження:

    - `gateway.reload.mode: "hybrid"` (типово): безпечно застосовує зміни в гарячому режимі, а для критичних виконує перезапуск
    - також підтримуються `hot`, `restart`, `off`

  </Accordion>

  <Accordion title="Як вимкнути кумедні слогани CLI?">
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

    - `off`: приховує текст слогана, але залишає рядок заголовка/версії банера.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: ротація кумедних/сезонних слоганів (типова поведінка).
    - Якщо ви хочете прибрати банер повністю, задайте змінну середовища `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути web search (і web fetch)?">
    `web_fetch` працює без API-ключа. `web_search` залежить від вибраного
    провайдера:

    - Провайдери на основі API, як-от Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, вимагають звичайного налаштування їхніх API-ключів.
    - Ollama Web Search не потребує ключа, але використовує налаштований вами хост Ollama і вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна інтеграція на основі HTML.
    - SearXNG не потребує ключа / є self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

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
              provider: "firecrawl", // необов’язково; пропустіть для авто-виявлення
            },
          },
        },
    }
    ```

    Специфічна для провайдера конфігурація web-search тепер живе в `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи провайдерів `tools.web.search.*` усе ще тимчасово завантажуються для сумісності, але їх не слід використовувати для нових конфігурацій.
    Запасна конфігурація Firecrawl web-fetch живе в `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlist, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` увімкнено за замовчуванням (якщо його явно не вимкнено).
    - Якщо `tools.web.fetch.provider` пропущено, OpenClaw автоматично виявляє першого готового запасного провайдера fetch серед доступних облікових даних. Наразі вбудований провайдер — Firecrawl.
    - Демони читають змінні середовища з `~/.openclaw/.env` (або із середовища сервісу).

    Документація: [Веб-інструменти](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мою конфігурацію. Як відновитися й уникнути цього?">
    `config.apply` замінює **всю конфігурацію цілком**. Якщо ви надсилаєте частковий об’єкт, усе
    інше буде видалено.

    Поточний OpenClaw захищає від багатьох випадкових перезаписів:

    - Записи конфігурації, що належать OpenClaw, перевіряють повну конфігурацію після змін перед записом.
    - Неприпустимі або руйнівні записи, що належать OpenClaw, відхиляються й зберігаються як `openclaw.json.rejected.*`.
    - Якщо пряме редагування ламає запуск або гаряче перезавантаження, Gateway відновлює останню відому робочу конфігурацію й зберігає відхилений файл як `openclaw.json.clobbered.*`.
    - Після відновлення основний агент отримує попередження під час запуску, щоб не записати ту саму погану конфігурацію повторно навмання.

    Відновлення:

    - Перевірте `openclaw logs --follow` на наявність `Config auto-restored from last-known-good`, `Config write rejected:` або `config reload restored last-known-good config`.
    - Перегляньте найновіший `openclaw.json.clobbered.*` або `openclaw.json.rejected.*` поруч з активною конфігурацією.
    - Залиште активну відновлену конфігурацію, якщо вона працює, а потім поверніть назад лише потрібні ключі через `openclaw config set` або `config.patch`.
    - Запустіть `openclaw config validate` і `openclaw doctor`.
    - Якщо у вас немає ані останньої відомої робочої конфігурації, ані відхиленого payload, відновіть із резервної копії або повторно запустіть `openclaw doctor` і знову налаштуйте канали/моделі.
    - Якщо це сталося неочікувано, створіть bug report і додайте свою останню відому конфігурацію або будь-яку резервну копію.
    - Локальний coding agent часто може відновити робочу конфігурацію з журналів або історії.

    Як уникнути цього:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивних редагувань.
    - Спочатку використовуйте `config.schema.lookup`, якщо не впевнені щодо точного шляху або форми поля; він повертає неглибокий вузол схеми плюс короткі підсумки безпосередніх дочірніх елементів для подальшого заглиблення.
    - Використовуйте `config.patch` для часткових RPC-редагувань; залишайте `config.apply` лише для повної заміни конфігурації.
    - Якщо ви використовуєте інструмент `gateway` лише для власника з запуску агента, він усе одно відхиляє записи в `tools.exec.ask` / `tools.exec.security` (зокрема застарілі псевдоніми `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Конфігурація](/cli/config), [Налаштування](/cli/configure), [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими робочими вузлами на різних пристроях?">
    Типовий шаблон — **один Gateway** (наприклад, Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** володіє каналами (Signal/WhatsApp), маршрутизацією та сеансами.
    - **Nodes (пристрої):** Mac/iOS/Android підключаються як периферія й надають локальні інструменти (`system.run`, `canvas`, `camera`).
    - **Agents (робочі вузли):** окремі «мізки»/робочі простори для спеціальних ролей (наприклад, "Hetzner ops", "Personal data").
    - **Субагенти:** запускають фонову роботу з основного агента, коли вам потрібен паралелізм.
    - **TUI:** підключається до Gateway і перемикає агентів/сеанси.

    Документація: [Nodes](/uk/nodes), [Віддалений доступ](/uk/gateway/remote), [Маршрутизація кількох агентів](/uk/concepts/multi-agent), [Субагенти](/uk/tools/subagents), [TUI](/web/tui).

  </Accordion>

  <Accordion title="Чи може браузер OpenClaw працювати без графічного інтерфейсу?">
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

    Типове значення — `false` (із вікном). Режим headless з більшою ймовірністю викликає перевірки anti-bot на деяких сайтах. Див. [Браузер](/uk/tools/browser).

    Режим headless використовує **той самий рушій Chromium** і працює для більшості сценаріїв автоматизації (форми, кліки, збирання даних, входи). Основні відмінності:

    - Немає видимого вікна браузера (використовуйте скріншоти, якщо вам потрібна візуалізація).
    - Деякі сайти суворіше ставляться до автоматизації в режимі headless (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує сеанси headless.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Задайте `browser.executablePath` на ваш бінарний файл Brave (або будь-якого браузера на основі Chromium) і перезапустіть Gateway.
    Повні приклади конфігурації див. у [Браузер](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway і nodes

<AccordionGroup>
  <Accordion title="Як команди поширюються між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає агента і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен інструмент node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідного трафіку провайдера; вони отримують лише виклики node RPC.

  </Accordion>

  <Accordion title="Як мій агент може отримати доступ до мого комп’ютера, якщо Gateway розміщено віддалено?">
    Коротка відповідь: **підключіть свій комп’ютер як node**. Gateway працює деінде, але він може
    викликати інструменти `node.*` (екран, камера, система) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на хості, який завжди увімкнений (VPS/домашній сервер).
    2. Додайте хост Gateway і свій комп’ютер до одного tailnet.
    3. Переконайтеся, що Gateway WS доступний (bind tailnet або SSH-тунель).
    4. Локально відкрийте застосунок macOS і підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як node.
    5. Затвердьте node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP-міст не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування про безпеку: підключення macOS node дозволяє `system.run` на цій машині. Підключайте
    лише ті пристрої, яким довіряєте, і перегляньте [Безпека](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Протокол Gateway](/uk/gateway/protocol), [Віддалений режим macOS](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключений, але я не отримую відповідей. Що тепер?">
    Перевірте базові речі:

    - Gateway запущено: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан каналів: `openclaw channels status`

    Потім перевірте автентифікацію та маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` налаштовано правильно.
    - Якщо ви підключаєтеся через SSH-тунель, переконайтеся, що локальний тунель активний і вказує на правильний порт.
    - Переконайтеся, що ваші allowlist (DM або група) містять ваш акаунт.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Канали](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два екземпляри OpenClaw розмовляти один з одним (локальний + VPS)?">
    Так. Вбудованого мосту «бот-до-бота» немає, але це можна зібрати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний чат-канал, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надішле повідомлення Bot B, а потім Bot B відповість як зазвичай.

    **CLI-міст (загальний):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націлюючи його на чат, де слухає
    інший бот. Якщо один бот працює на віддаленому VPS, спрямуйте свій CLI на цей віддалений Gateway
    через SSH/Tailscale (див. [Віддалений доступ](/uk/gateway/remote)).

    Приклад шаблону (запускайте з машини, яка може дістатися до цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте запобіжник, щоб два боти не зациклювалися безкінечно (лише згадки, allowlist
    каналів або правило «не відповідати на повідомлення ботів»).

    Документація: [Віддалений доступ](/uk/gateway/remote), [CLI агента](/cli/agent), [Надсилання агентом](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох агентів?">
    Ні. Один Gateway може розміщувати кількох агентів, кожен із власним робочим простором, типовими моделями
    й маршрутизацією. Це нормальний варіант налаштування, і він значно дешевший і простіший, ніж запуск
    одного VPS на кожного агента.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні конфігурації, якими ви не хочете ділитися. В інших випадках тримайте один Gateway і
    використовуйте кількох агентів або субагентів.

  </Accordion>

  <Accordion title="Чи є перевага у використанні node на моєму особистому ноутбуці замість SSH з VPS?">
    Так — nodes є основним способом доступу до вашого ноутбука з віддаленого Gateway, і вони
    дають більше, ніж просто доступ до оболонки. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (невеликий VPS або пристрій рівня Raspberry Pi цілком підходить; 4 GB RAM більш ніж достатньо), тож поширене
    налаштування — це завжди ввімкнений хост плюс ваш ноутбук як node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують pairing пристроїв.
    - **Безпечніший контроль виконання.** `system.run` обмежується allowlist/затвердженнями node на цьому ноутбуці.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна автоматизація браузера.** Тримайте Gateway на VPS, але запускайте Chrome локально через хост node на ноутбуці або підключайтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для разового доступу до оболонки, але nodes простіші для постійних робочих процесів агента й
    автоматизації пристрою.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes сервіс gateway?">
    Ні. На хості має працювати лише **один gateway**, якщо тільки ви навмисно не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)). Nodes — це периферійні компоненти, які підключаються
    до gateway (nodes iOS/Android або режим macOS "node mode" у застосунку менюбару). Для безголових
    хостів node і керування через CLI див. [CLI хоста Node](/cli/node).

    Для змін `gateway`, `discovery` і `canvasHost` потрібен повний перезапуск.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати конфігурацію?">
    Так.

    - `config.schema.lookup`: перевірити одне піддерево конфігурації з його неглибоким вузлом схеми, відповідною підказкою UI та короткими зведеннями безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний знімок + хеш
    - `config.patch`: безпечне часткове оновлення (рекомендовано для більшості RPC-редагувань); виконує гаряче перезавантаження, коли це можливо, і перезапускає, коли потрібно
    - `config.apply`: перевіряє й замінює всю конфігурацію; виконує гаряче перезавантаження, коли це можливо, і перезапускає, коли потрібно
    - Інструмент виконання `gateway`, доступний лише власнику, усе ще відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

  </Accordion>

  <Accordion title="Мінімальна адекватна конфігурація для першого встановлення">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    Це задає ваш робочий простір і обмежує, хто може активувати бота.

  </Accordion>

  <Accordion title="Як налаштувати Tailscale на VPS і підключитися з Mac?">
    Мінімальні кроки:

    1. **Установіть і ввійдіть на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Установіть і ввійдіть на Mac**
       - Використайте застосунок Tailscale і ввійдіть у той самий tailnet.
    3. **Увімкніть MagicDNS (рекомендовано)**
       - У консолі адміністратора Tailscale увімкніть MagicDNS, щоб VPS мав стабільне ім’я.
    4. **Використовуйте ім’я хоста tailnet**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    Якщо ви хочете Control UI без SSH, використовуйте Tailscale Serve на VPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Це залишає gateway прив’язаним до loopback і відкриває HTTPS через Tailscale. Див. [Tailscale](/uk/gateway/tailscale).

  </Accordion>

  <Accordion title="Як підключити Mac node до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Control UI + WS Gateway**. Nodes підключаються через ту саму кінцеву точку Gateway WS.

    Рекомендоване налаштування:

    1. **Переконайтеся, що VPS і Mac знаходяться в одному tailnet**.
    2. **Використовуйте застосунок macOS у віддаленому режимі** (ціллю SSH може бути ім’я хоста tailnet).
       Застосунок протунелює порт Gateway і підключиться як node.
    3. **Затвердьте node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Протокол Gateway](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [Віддалений режим macOS](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи варто встановлювати на другий ноутбук чи просто додати node?">
    Якщо вам потрібні лише **локальні інструменти** (screen/camera/exec) на другому ноутбуці, додайте його як
    **node**. Це дозволяє зберегти єдиний Gateway і уникнути дублювання конфігурації. Локальні інструменти node
    наразі доступні лише на macOS, але ми плануємо поширити їх на інші ОС.

    Установлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes), [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Змінні середовища і завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує змінні середовища?">
    OpenClaw читає змінні середовища від батьківського процесу (оболонка, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного робочого каталогу
    - глобальний запасний `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден `.env` не перевизначає вже наявні змінні середовища.

    Ви також можете визначати вбудовані змінні середовища в конфігурації (застосовуються лише якщо вони відсутні в середовищі процесу):

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

  <Accordion title="Я запустив Gateway через сервіс, і мої змінні середовища зникли. Що тепер?">
    Два поширені варіанти виправлення:

    1. Додайте відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися, навіть коли сервіс не успадковує середовище вашої оболонки.
    2. Увімкніть імпорт із оболонки (додаткова зручність за бажанням):

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

    Це запускає вашу login shell і імпортує лише відсутні очікувані ключі (ніколи не перевизначає). Еквіваленти змінних середовища:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я задав COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` повідомляє, чи увімкнено **імпорт середовища оболонки**. "Shell env: off"
    **не** означає, що ваших змінних середовища немає — це лише означає, що OpenClaw не завантажуватиме
    вашу login shell автоматично.

    Якщо Gateway працює як сервіс (launchd/systemd), він не успадковує середовище
    вашої оболонки. Виправити це можна одним із таких способів:

    1. Помістіть токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або увімкніть імпорт із оболонки (`env.shellEnv.enabled: true`).
    3. Або додайте його до блоку `env` у конфігурації (застосовується лише якщо змінної немає).

    Потім перезапустіть gateway і перевірте знову:

    ```bash
    openclaw models status
    ```

    Токени Copilot читаються з `COPILOT_GITHUB_TOKEN` (також `GH_TOKEN` / `GITHUB_TOKEN`).
    Див. [/concepts/model-providers](/uk/concepts/model-providers) і [/environment](/uk/help/environment).

  </Accordion>
</AccordionGroup>

## Сеанси і кілька чатів

<AccordionGroup>
  <Accordion title="Як почати нову розмову?">
    Надішліть `/new` або `/reset` як окреме повідомлення. Див. [Керування сеансами](/uk/concepts/session).
  </Accordion>

  <Accordion title="Чи скидаються сеанси автоматично, якщо я ніколи не надсилаю /new?">
    Термін дії сеансів може завершуватися після `session.idleMinutes`, але це **вимкнено за замовчуванням** (типове значення **0**).
    Задайте додатне значення, щоб увімкнути завершення за неактивністю. Коли його увімкнено, **наступне**
    повідомлення після періоду неактивності починає новий ідентифікатор сеансу для цього ключа чату.
    Це не видаляє транскрипти — лише запускає новий сеанс.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб створити команду екземплярів OpenClaw (один CEO і багато агентів)?">
    Так, через **маршрутизацію кількох агентів** і **субагентів**. Ви можете створити одного агента-координатора
    та кількох агентів-робітників із власними робочими просторами й моделями.

    Втім, це найкраще сприймати як **цікавий експеримент**. Це витрачає багато токенів і часто
    менш ефективно, ніж використання одного бота з окремими сеансами. Типова модель, яку ми
    бачимо, — це один бот, з яким ви спілкуєтеся, але з різними сеансами для паралельної роботи. Такий
    бот також може запускати субагентів за потреби.

    Документація: [Маршрутизація кількох агентів](/uk/concepts/multi-agent), [Субагенти](/uk/tools/subagents), [CLI Agents](/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст обрізався посеред завдання? Як цьому запобігти?">
    Контекст сеансу обмежений вікном моделі. Довгі чати, великий вивід інструментів або багато
    файлів можуть запускати Compaction або обрізання.

    Що допомагає:

    - Попросіть бота узагальнити поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими завданнями й `/new` під час зміни теми.
    - Тримайте важливий контекст у робочому просторі й просіть бота перечитувати його.
    - Використовуйте субагентів для довгих або паралельних завдань, щоб основний чат залишався меншим.
    - Виберіть модель із більшим вікном контексту, якщо це трапляється часто.

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

    - Onboarding також пропонує **Reset**, якщо бачить наявну конфігурацію. Див. [Onboarding (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен каталог стану (типово це `~/.openclaw-<profile>`).
    - Скидання для розробки: `openclaw gateway --dev --reset` (лише для dev; очищає dev-конфігурацію + облікові дані + сеанси + робочий простір).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або стиснути?'>
    Використайте один із таких варіантів:

    - **Compact** (зберігає розмову, але підсумовує старіші ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб керувати підсумком.

    - **Скидання** (новий ідентифікатор сеансу для того самого ключа чату):

      ```
      /new
      /reset
      ```

    Якщо це повторюється постійно:

    - Увімкніть або налаштуйте **проріджування сеансів** (`agents.defaults.contextPruning`), щоб обрізати старий вивід інструментів.
    - Використовуйте модель із більшим вікном контексту.

    Документація: [Compaction](/uk/concepts/compaction), [Проріджування сеансів](/uk/concepts/session-pruning), [Керування сеансами](/uk/concepts/session).

  </Accordion>

  <Accordion title='Чому я бачу "LLM request rejected: messages.content.tool_use.input field required"?'>
    Це помилка валідації провайдера: модель видала блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія сеансу застаріла або пошкоджена (часто після довгих тредів
    або зміни інструмента/схеми).

    Виправлення: почніть новий сеанс за допомогою `/new` (окреме повідомлення).

  </Accordion>

  <Accordion title="Чому я отримую повідомлення Heartbeat кожні 30 хвилин?">
    Heartbeat запускаються кожні **30m** за замовчуванням (**1h** при використанні OAuth-автентифікації). Налаштуйте або вимкніть їх:

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
    Якщо файл відсутній, heartbeat все одно запускається, і модель вирішує, що робити.

    Для перевизначень на рівні агента використовуйте `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "акаунт бота" до групи WhatsApp?'>
    Ні. OpenClaw працює у **вашому власному акаунті**, тож якщо ви є в групі, OpenClaw може її бачити.
    За замовчуванням відповіді в групах заблоковані, доки ви не дозволите відправників (`groupPolicy: "allowlist"`).

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

    Шукайте `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/додано до allowlist): виведіть список груп із конфігурації:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/cli/directory), [Журнали](/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Дві поширені причини:

    - Увімкнено gating за згадкою (типово). Ви маєте @згадати бота (або відповідати `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і групу не додано до allowlist.

    Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи ділять групи/треди контекст із DM?">
    Прямі чати за замовчуванням згортаються до основного сеансу. Групи/канали мають власні ключі сеансів, а теми Telegram / треди Discord є окремими сеансами. Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки робочих просторів і агентів я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але стежте за таким:

    - **Зростання диска:** сеанси + транскрипти живуть у `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартість токенів:** більше агентів означає більше одночасного використання моделей.
    - **Операційні витрати:** профілі автентифікації, робочі простори й маршрутизація каналів для кожного агента.

    Поради:

    - Тримайте один **активний** робочий простір на агента (`agents.defaults.workspace`).
    - Очищайте старі сеанси (видаляйте JSONL або записи сховища), якщо диск розростається.
    - Використовуйте `openclaw doctor`, щоб виявляти зайві робочі простори й невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька ботів або чатів одночасно (Slack), і як це краще налаштувати?">
    Так. Використовуйте **маршрутизацію кількох агентів**, щоб запускати кількох ізольованих агентів і маршрутизувати вхідні повідомлення за
    каналом/акаунтом/peer. Slack підтримується як канал і може бути прив’язаний до конкретних агентів.

    Доступ до браузера дуже потужний, але це не «все, що може людина» — anti-bot, CAPTCHA і MFA
    усе ще можуть блокувати автоматизацію. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на хості
    або CDP на машині, яка фактично запускає браузер.

    Налаштування за найкращими практиками:

    - Хост Gateway, що завжди працює (VPS/Mac mini).
    - Один агент на роль (bindings).
    - Канал(и) Slack, прив’язані до цих агентів.
    - Локальний браузер через Chrome MCP або node, коли потрібно.

    Документація: [Маршрутизація кількох агентів](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Браузер](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: типові значення, вибір, псевдоніми, перемикання

<AccordionGroup>
  <Accordion title='Що таке "модель за замовчуванням"?'>
    Модель OpenClaw за замовчуванням — це те, що ви задаєте як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються як `provider/model` (приклад: `openai/gpt-5.4`). Якщо ви пропускаєте провайдера, OpenClaw спочатку намагається використати псевдонім, потім — унікальний збіг налаштованого провайдера для точного id цієї моделі, і лише після цього повертається до налаштованого провайдера за замовчуванням як до застарілого шляху сумісності. Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw переходить до першого налаштованого провайдера/моделі замість того, щоб показувати застаріле типове значення від видаленого провайдера. Вам усе одно слід **явно** задавати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендований варіант за замовчуванням:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для агентів з увімкненими інструментами або недовіреним входом:** ставте силу моделі вище за вартість.
    **Для звичайного/низькоризикового чату:** використовуйте дешевші резервні моделі й маршрутизуйте за роллю агента.

    Для MiniMax є окрема документація: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити** для важливих завдань, і дешевшу
    модель для повсякденного чату або підсумків. Ви можете маршрутизувати моделі для кожного агента й використовувати субагентів для
    паралелізації довгих завдань (кожен субагент споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Субагенти](/uk/tools/subagents).

    Сильне попередження: слабші/надмірно квантизовані моделі вразливіші до prompt injection
    і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі, не стираючи конфігурацію?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для поточного сеансу)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - редагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` з частковим об’єктом, якщо тільки ви не хочете замінити всю конфігурацію цілком.
    Для RPC-редагувань спочатку перегляньте через `config.schema.lookup` і надавайте перевагу `config.patch`. Payload lookup дає вам нормалізований шлях, неглибоку документацію/обмеження схеми та короткі зведення безпосередніх дочірніх елементів
    для часткових оновлень.
    Якщо ви все ж перезаписали конфігурацію, відновіть її з резервної копії або повторно запустіть `openclaw doctor` для виправлення.

    Документація: [Моделі](/uk/concepts/models), [Налаштування](/cli/configure), [Конфігурація](/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати self-hosted моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях до локальних моделей.

    Найшвидше налаштування:

    1. Установіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо ви хочете також хмарні моделі, виконайте `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає вам хмарні моделі плюс ваші локальні моделі Ollama
    - хмарні моделі, як-от `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі більш уразливі до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все ж хочете малі моделі, увімкніть ізоляцію та строгі allowlist інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Ізоляція](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися й змінюватися з часом; фіксованої рекомендації щодо провайдера немає.
    - Перевіряйте поточне налаштування під час виконання на кожному gateway за допомогою `openclaw models status`.
    - Для агентів, чутливих до безпеки/з інструментами, використовуйте найсильнішу доступну модель останнього покоління.
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

    Ви можете переглянути доступні моделі через `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований вибір. Вибір за номером:

    ```
    /model 3
    ```

    Ви також можете примусово вибрати конкретний профіль автентифікації для провайдера (для сеансу):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується і який профіль автентифікації буде спробовано наступним.
    Він також показує налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), коли вони доступні.

    **Як зняти прив’язку профілю, який я задав через @profile?**

    Повторно виконайте `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо ви хочете повернутися до типового значення, виберіть його з `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль автентифікації активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.2 для щоденних завдань, а Codex 5.3 для кодування?">
    Так. Задайте одну як типову й перемикайтеся за потреби:

    - **Швидке перемикання (для сеансу):** `/model gpt-5.4` для щоденних завдань, `/model openai-codex/gpt-5.4` для кодування через Codex OAuth.
    - **Типове значення + перемикання:** задайте `agents.defaults.model.primary` як `openai/gpt-5.4`, а потім перемикайтеся на `openai-codex/gpt-5.4` під час кодування (або навпаки).
    - **Субагенти:** маршрутизуйте завдання кодування до субагентів з іншою типовою моделлю.

    Див. [Моделі](/uk/concepts/models) і [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.4?">
    Використовуйте або перемикач для сеансу, або типове значення в конфігурації:

    - **Для сеансу:** надішліть `/fast on`, поки сеанс використовує `openai/gpt-5.4` або `openai-codex/gpt-5.4`.
    - **Типове значення для моделі:** задайте `agents.defaults.models["openai/gpt-5.4"].params.fastMode` як `true`.
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

    Для OpenAI fast mode відображається в `service_tier = "priority"` у підтримуваних нативних запитах Responses. Перевизначення `/fast` для сеансу мають вищий пріоритет за типові значення в конфігурації.

    Див. [Thinking і fast mode](/uk/tools/thinking) і [OpenAI fast mode](/uk/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо задано `agents.defaults.models`, це стає **allowlist** для `/model` і будь-яких
    перевизначень сеансу. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, приберіть allowlist або виберіть модель із `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **провайдер не налаштований** (не знайдено конфігурацію провайдера MiniMax або
    профіль автентифікації), тому модель не може бути розв’язана.

    Контрольний список для виправлення:

    1. Оновіться до актуального релізу OpenClaw (або запускайте з вихідного коду `main`), а потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (через майстер або JSON), або що автентифікація MiniMax
       існує в env/профілях автентифікації, щоб відповідний провайдер можна було інжектувати
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

  <Accordion title="Чи можу я використовувати MiniMax як типову модель, а OpenAI — для складних завдань?">
    Так. Використовуйте **MiniMax як типову модель** і перемикайте моделі **для кожного сеансу** за потреби.
    Запасні варіанти використовуються для **помилок**, а не для «складних завдань», тому використовуйте `/model` або окремого агента.

    **Варіант A: перемикання для кожного сеансу**

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

    - Типова модель агента A: MiniMax
    - Типова модель агента B: OpenAI
    - Маршрутизуйте за агентом або використовуйте `/agent` для перемикання

    Документація: [Моделі](/uk/concepts/models), [Маршрутизація кількох агентів](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома типовими скороченнями (застосовуються лише коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви задасте власний псевдонім з тим самим ім’ям, ваше значення матиме пріоритет.

  </Accordion>

  <Accordion title="Як визначити/перевизначити скорочення моделей (псевдоніми)?">
    Псевдоніми походять із `agents.defaults.models.<modelId>.alias`. Приклад:

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

    Після цього `/model sonnet` (або `/<alias>`, коли це підтримується) розв’язується в цей id моделі.

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

    Зазвичай це означає, що в **нового агента** порожнє сховище автентифікації. Автентифікація прив’язана до агента і
    зберігається тут:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Запустіть `openclaw agents add <id>` і налаштуйте автентифікацію під час майстра.
    - Або скопіюйте `auth-profiles.json` з `agentDir` основного агента в `agentDir` нового агента.

    **Не** використовуйте один `agentDir` повторно для кількох агентів; це спричиняє конфлікти автентифікації/сеансів.

  </Accordion>
</AccordionGroup>

## Резервне перемикання моделей і "All models failed"

<AccordionGroup>
  <Accordion title="Як працює резервне перемикання?">
    Резервне перемикання відбувається у два етапи:

    1. **Ротація профілів автентифікації** в межах одного провайдера.
    2. **Резервне перемикання моделі** на наступну модель у `agents.defaults.model.fallbacks`.

    До профілів, що дають збої, застосовуються періоди очікування (експоненційний backoff), тож OpenClaw може продовжувати відповідати, навіть коли провайдер упирається в rate limit або тимчасово дає збої.

    Кошик rate limit включає не лише звичайні відповіді `429`. OpenClaw
    також вважає придатними для резервного перемикання rate limit-ами
    повідомлення на кшталт `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` та періодичні
    обмеження вікна використання (`weekly/monthly limit reached`).

    Деякі відповіді, схожі на billing, не є `402`, а деякі HTTP-відповіді `402`
    теж залишаються в цьому тимчасовому кошику. Якщо провайдер повертає
    явний текст про billing на `401` або `403`, OpenClaw усе одно може залишити це
    в смузі billing, але специфічні для провайдера зіставлення тексту залишаються обмеженими
    провайдером, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Якщо повідомлення `402`
    натомість схоже на повторюване вікно використання або
    ліміт витрат організації/робочого простору (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw трактує це як
    `rate_limit`, а не як довге вимкнення через billing.

    Помилки переповнення контексту — інші: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху Compaction/повторної спроби замість переходу
    до резервної моделі.

    Узагальнений текст про серверні помилки навмисно вужчий, ніж «усе, що містить
    unknown/error». OpenClaw вважає придатними для резервного перемикання
    специфічні для провайдера тимчасові форми, як-от Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, помилки stop-reason на кшталт `Unhandled stop reason:
    error`, JSON-payload `api_error` із тимчасовим серверним текстом
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки перевантаження провайдера, як-от `ModelNotReadyException`,
    як сигнали timeout/перевантаження, варті резервного перемикання, коли контекст провайдера
    збігається.
    Загальний внутрішній fallback-текст на кшталт `LLM request failed with an unknown
    error.` залишається консервативним і сам по собі не запускає резервне перемикання моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система спробувала використати id профілю автентифікації `anthropic:default`, але не змогла знайти для нього облікові дані в очікуваному сховищі автентифікації.

    **Контрольний список виправлення:**

    - **Перевірте, де живуть профілі автентифікації** (нові та застарілі шляхи)
      - Поточний: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий: `~/.openclaw/agent/*` (мігрується за допомогою `openclaw doctor`)
    - **Переконайтеся, що Gateway завантажує вашу змінну середовища**
      - Якщо ви задали `ANTHROPIC_API_KEY` у своїй оболонці, але запускаєте Gateway через systemd/launchd, він може не успадковувати її. Додайте її в `~/.openclaw/.env` або увімкніть `env.shellEnv`.
    - **Переконайтеся, що редагуєте правильного агента**
      - У конфігураціях із кількома агентами може бути кілька файлів `auth-profiles.json`.
    - **Швидко перевірте стан моделі/автентифікації**
      - Використовуйте `openclaw models status`, щоб побачити налаштовані моделі та чи пройшли провайдери автентифікацію.

    **Контрольний список виправлення для "No credentials found for profile anthropic"**

    Це означає, що запуск прив’язаний до профілю автентифікації Anthropic, але Gateway
    не може знайти його у своєму сховищі автентифікації.

    - **Використовуйте Claude CLI**
      - Запустіть `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо ви хочете використовувати API-ключ**
      - Додайте `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистіть будь-який закріплений порядок, який примусово використовує відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Переконайтеся, що запускаєте команди на хості gateway**
      - У віддаленому режимі профілі автентифікації живуть на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому він також спробував Google Gemini і зазнав невдачі?">
    Якщо у вашій конфігурації моделі Google Gemini входить до резервного перемикання (або ви перемкнулися на скорочення Gemini), OpenClaw спробує її під час резервного перемикання моделі. Якщо ви не налаштували облікові дані Google, ви побачите `No API key found for provider "google"`.

    Виправлення: або надайте автентифікацію Google, або видаліть/уникайте моделей Google у `agents.defaults.model.fallbacks` / псевдонімах, щоб резервне перемикання не йшло туди.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Причина: історія сеансу містить **блоки thinking без сигнатур** (часто від
    перерваного/часткового потоку). Google Antigravity вимагає сигнатури для блоків thinking.

    Виправлення: OpenClaw тепер прибирає блоки thinking без сигнатур для Google Antigravity Claude. Якщо це все ще з’являється, почніть **новий сеанс** або задайте `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Профілі автентифікації: що це таке і як ними керувати

Пов’язане: [/concepts/oauth](/uk/concepts/oauth) (потоки OAuth, зберігання токенів, шаблони для кількох акаунтів)

<AccordionGroup>
  <Accordion title="Що таке профіль автентифікації?">
    Профіль автентифікації — це іменований запис облікових даних (OAuth або API-ключ), прив’язаний до провайдера. Профілі зберігаються тут:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які типові id профілів?">
    OpenClaw використовує id з префіксом провайдера, наприклад:

    - `anthropic:default` (поширений варіант, коли немає ідентичності email)
    - `anthropic:<email>` для OAuth-ідентичностей
    - власні id, які ви вибираєте (наприклад `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який профіль автентифікації пробується першим?">
    Так. Конфігурація підтримує необов’язкові метадані для профілів і порядок для кожного провайдера (`auth.order.<provider>`). Це **не** зберігає секрети; воно відображає id у provider/mode і задає порядок ротації.

    OpenClaw може тимчасово пропускати профіль, якщо він перебуває в короткому **cooldown** (rate limit/timeout/збої автентифікації) або в довшому стані **disabled** (billing/недостатньо кредитів). Щоб перевірити це, виконайте `openclaw models status --json` і перегляньте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Cooldown через rate limit може бути прив’язаний до моделі. Профіль, який охолоджується
    для однієї моделі, усе ще може бути придатним для сусідньої моделі того самого провайдера,
    тоді як вікна billing/disabled усе ще блокують увесь профіль.

    Ви також можете задати **порядок перевизначення для конкретного агента** (зберігається в `auth-state.json` цього агента) через CLI:

    ```bash
    # Типово використовується налаштований типовий агент (можна пропустити --agent)
    openclaw models auth order get --provider anthropic

    # Зафіксувати ротацію на одному профілі (пробувати лише цей)
    openclaw models auth order set --provider anthropic anthropic:default

    # Або задати явний порядок (резервне перемикання в межах провайдера)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Очистити перевизначення (повернутися до config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Щоб націлити на конкретного агента:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Щоб перевірити, що саме насправді буде спробовано, використовуйте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено з явного порядку, probe повідомить
    `excluded_by_auth_order` для цього профілю замість того, щоб тихо намагатися його використати.

  </Accordion>

  <Accordion title="OAuth чи API-ключ — у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де це застосовно).
    - **API-ключі** використовують білінг pay-per-token.

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
    Тому що "running" — це погляд **супервізора** (launchd/systemd/schtasks). А перевірка підключення — це CLI, який реально підключається до gateway WebSocket.

    Використовуйте `openclaw gateway status` і орієнтуйтеся на ці рядки:

    - `Probe target:` (URL, який перевірка реально використовувала)
    - `Listening:` (що реально прив’язано до порту)
    - `Last gateway error:` (типова першопричина, коли процес живий, але порт не слухає)

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує різні "Config (cli)" і "Config (service)"?'>
    Ви редагуєте один файл конфігурації, тоді як сервіс запускає інший (часто через невідповідність `--profile` / `OPENCLAW_STATE_DIR`).

    Виправлення:

    ```bash
    openclaw gateway install --force
    ```

    Запускайте це з тим самим `--profile` / середовищем, яке ви хочете, щоб використовував сервіс.

  </Accordion>

  <Accordion title='Що означає "another gateway instance is already listening"?'>
    OpenClaw примусово забезпечує runtime lock, одразу прив’язуючи WebSocket listener під час запуску (типово `ws://127.0.0.1:18789`). Якщо прив’язка завершується з `EADDRINUSE`, він викидає `GatewayLockError`, що означає: інший екземпляр уже слухає.

    Виправлення: зупиніть інший екземпляр, звільніть порт або запускайте з `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Як запустити OpenClaw у віддаленому режимі (клієнт підключається до Gateway деінде)?">
    Задайте `gateway.mode: "remote"` і вкажіть віддалену URL-адресу WebSocket, за бажанням із віддаленими обліковими даними спільного секрету:

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
    - Застосунок macOS відстежує файл конфігурації й перемикає режими в реальному часі, коли ці значення змінюються.
    - `gateway.remote.token` / `.password` — це лише клієнтські віддалені облікові дані; самі по собі вони не вмикають локальну автентифікацію gateway.

  </Accordion>

  <Accordion title='Control UI каже "unauthorized" (або постійно перепідключається). Що тепер?'>
    Шлях автентифікації вашого gateway і метод автентифікації UI не збігаються.

    Факти (з коду):

    - Control UI зберігає токен у `sessionStorage` для поточної сесії вкладки браузера й вибраної URL-адреси gateway, тож оновлення в тій самій вкладці продовжують працювати без відновлення довготривалого збереження токена в localStorage.
    - При `AUTH_TOKEN_MISMATCH` довірені клієнти можуть виконати одну обмежену повторну спробу з кешованим токеном пристрою, коли gateway повертає підказки для повтору (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Ця повторна спроба з кешованим токеном тепер повторно використовує кешовані затверджені scope, збережені разом із токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` все одно зберігають свій запитаний набір scope замість успадкування кешованих scope.
    - Поза цим шляхом повторної спроби пріоритет автентифікації підключення такий: спочатку явний shared token/password, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap token.
    - Перевірки scope bootstrap token мають префікси ролей. Вбудований allowlist bootstrap operator задовольняє лише запити оператора; node або інші ролі не-оператора все одно потребують scope під власним префіксом ролі.

    Виправлення:

    - Найшвидше: `openclaw dashboard` (друкує + копіює URL-адресу панелі керування, намагається відкрити; показує підказку SSH, якщо режим headless).
    - Якщо у вас ще немає токена: `openclaw doctor --generate-gateway-token`.
    - Якщо режим віддалений, спочатку підніміть тунель: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`.
    - Режим shared-secret: задайте `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, а потім вставте відповідний секрет у налаштуваннях Control UI.
    - Режим Tailscale Serve: переконайтеся, що `gateway.auth.allowTailscale` увімкнено і ви відкриваєте URL Serve, а не сиру URL loopback/tailnet, яка обходить заголовки ідентичності Tailscale.
    - Режим trusted-proxy: переконайтеся, що ви приходите через налаштований non-loopback proxy з урахуванням ідентичності, а не через loopback proxy на тому самому хості чи сиру URL gateway.
    - Якщо невідповідність зберігається після однієї повторної спроби, поверніть/перезатвердьте токен спареного пристрою:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Якщо цей виклик rotate каже, що його відхилено, перевірте дві речі:
      - сесії спареного пристрою можуть повертати лише **власний** пристрій, якщо тільки вони не мають також `operator.admin`
      - явні значення `--scope` не можуть перевищувати поточні operator scope викликача
    - Досі не вдається? Запустіть `openclaw status --all` і дотримуйтеся [Усунення несправностей](/uk/gateway/troubleshooting). Подробиці автентифікації див. у [Панель керування](/web/dashboard).

  </Accordion>

  <Accordion title="Я задав gateway.bind tailnet, але він не може прив’язатися і нічого не слухає">
    Прив’язка `tailnet` вибирає IP Tailscale з ваших мережевих інтерфейсів (100.64.0.0/10). Якщо машина не в Tailscale (або інтерфейс вимкнено), прив’язуватися нема до чого.

    Виправлення:

    - Запустіть Tailscale на цьому хості (щоб він мав адресу 100.x), або
    - Перемкніться на `gateway.bind: "loopback"` / `"lan"`.

    Примітка: `tailnet` є явним варіантом. `auto` надає перевагу loopback; використовуйте `gateway.bind: "tailnet"`, коли хочете прив’язку лише до tailnet.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька Gateway на одному хості?">
    Зазвичай ні — один Gateway може запускати кілька каналів повідомлень і агентів. Використовуйте кілька Gateway лише тоді, коли вам потрібна резервність (наприклад, rescue bot) або жорстка ізоляція.

    Так, але ви маєте ізолювати:

    - `OPENCLAW_CONFIG_PATH` (конфігурація для кожного екземпляра)
    - `OPENCLAW_STATE_DIR` (стан для кожного екземпляра)
    - `agents.defaults.workspace` (ізоляція робочого простору)
    - `gateway.port` (унікальні порти)

    Швидке налаштування (рекомендовано):

    - Використовуйте `openclaw --profile <name> ...` для кожного екземпляра (автоматично створює `~/.openclaw-<name>`).
    - Задайте унікальний `gateway.port` у конфігурації кожного профілю (або передайте `--port` для ручних запусків).
    - Установіть сервіс для кожного профілю: `openclaw --profile <name> gateway install`.

    Профілі також додають суфікси до назв сервісів (`ai.openclaw.<profile>`; застарілі `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Повний посібник: [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Що означає "invalid handshake" / code 1008?'>
    Gateway — це **сервер WebSocket**, і він очікує, що найперше повідомлення
    буде кадром `connect`. Якщо він отримує щось інше, то закриває з’єднання
    з **кодом 1008** (порушення політики).

    Поширені причини:

    - Ви відкрили URL **HTTP** у браузері (`http://...`) замість клієнта WS.
    - Ви використали неправильний порт або шлях.
    - Proxy або тунель обрізав заголовки автентифікації або надіслав запит не для Gateway.

    Швидкі виправлення:

    1. Використовуйте URL WS: `ws://<host>:18789` (або `wss://...`, якщо HTTPS).
    2. Не відкривайте порт WS у звичайній вкладці браузера.
    3. Якщо автентифікацію увімкнено, включіть токен/пароль у кадр `connect`.

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

    Ви можете задати стабільний шлях через `logging.file`. Рівень файлового журналу контролюється `logging.level`. Деталізація консолі контролюється `--verbose` і `logging.consoleLevel`.

    Найшвидше відстеження журналу:

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

  <Accordion title="Я закрив термінал у Windows — як перезапустити OpenClaw?">
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

    Документація: [Windows (WSL2)](/uk/platforms/windows), [Runbook сервісу Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Gateway працює, але відповіді не надходять. Що перевірити?">
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
    - WebChat/Панель керування відкрито без правильного токена.

    Якщо ви працюєте віддалено, переконайтеся, що тунель/з’єднання Tailscale активне й що
    Gateway WebSocket доступний.

    Документація: [Канали](/uk/channels), [Усунення несправностей](/uk/gateway/troubleshooting), [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — що тепер?'>
    Зазвичай це означає, що UI втратив з’єднання WebSocket. Перевірте:

    1. Чи запущено Gateway? `openclaw gateway status`
    2. Чи Gateway у здоровому стані? `openclaw status`
    3. Чи UI має правильний токен? `openclaw dashboard`
    4. Якщо режим віддалений, чи активне з’єднання тунелю/Tailscale?

    Потім відстежуйте журнали:

    ```bash
    openclaw logs --follow
    ```

    Документація: [Панель керування](/web/dashboard), [Віддалений доступ](/uk/gateway/remote), [Усунення несправностей](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Не вдається Telegram setMyCommands. Що перевірити?">
    Почніть із журналів і стану каналу:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Потім зіставте помилку:

    - `BOT_COMMANDS_TOO_MUCH`: у меню Telegram забагато записів. OpenClaw уже обрізає список до ліміту Telegram і повторює спробу з меншою кількістю команд, але деякі записи меню все одно потрібно прибрати. Зменште кількість команд plugin/skill/custom commands або вимкніть `channels.telegram.commands.native`, якщо меню вам не потрібне.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` або подібні мережеві помилки: якщо ви на VPS або за proxy, переконайтеся, що вихідний HTTPS дозволено і DNS працює для `api.telegram.org`.

    Якщо Gateway віддалений, переконайтеся, що дивитеся журнали на хості Gateway.

    Документація: [Telegram](/uk/channels/telegram), [Усунення несправностей каналів](/uk/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI не показує виводу. Що перевірити?">
    Спочатку переконайтеся, що Gateway доступний і агент може працювати:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    У TUI використовуйте `/status`, щоб побачити поточний стан. Якщо ви очікуєте відповіді в чаті
    каналу, переконайтеся, що доставку ввімкнено (`/deliver on`).

    Документація: [TUI](/web/tui), [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як повністю зупинити, а потім знову запустити Gateway?">
    Якщо ви встановили сервіс:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Це зупиняє/запускає **сервіс під наглядом** (launchd у macOS, systemd у Linux).
    Використовуйте це, коли Gateway працює у фоновому режимі як демон.

    Якщо ви запускаєте його на передньому плані, зупиніть через Ctrl-C, а потім:

    ```bash
    openclaw gateway run
    ```

    Документація: [Runbook сервісу Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="Поясніть просто: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: перезапускає **фоновий сервіс** (launchd/systemd).
    - `openclaw gateway`: запускає gateway **на передньому плані** для цієї сесії термінала.

    Якщо ви встановили сервіс, використовуйте команди gateway. Використовуйте `openclaw gateway`, коли
    вам потрібен одноразовий запуск на передньому плані.

  </Accordion>

  <Accordion title="Найшвидший спосіб отримати більше подробиць, коли щось ламається">
    Запустіть Gateway з `--verbose`, щоб отримати більше подробиць у консолі. Потім перевірте файл журналу на помилки автентифікації каналу, маршрутизації моделі та RPC.
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

    - Цільовий канал підтримує вихідні медіа й не заблокований allowlist.
    - Файл не перевищує лімітів розміру провайдера (зображення зменшуються максимум до 2048px).
    - `tools.fs.workspaceOnly=true` обмежує надсилання локальних шляхів робочим простором, temp/media-store і файлами, перевіреними sandbox.
    - `tools.fs.workspaceOnly=false` дозволяє `MEDIA:` надсилати локальні файли хоста, які агент уже може читати, але лише для медіа та безпечних типів документів (зображення, аудіо, відео, PDF і документи Office). Звичайний текст і файли, схожі на секрети, усе одно блокуються.

    Див. [Зображення](/uk/nodes/images).

  </Accordion>
</AccordionGroup>

## Безпека та контроль доступу

<AccordionGroup>
  <Accordion title="Чи безпечно відкривати OpenClaw для вхідних DM?">
    Ставтеся до вхідних DM як до недовіреного вводу. Типові налаштування спроєктовані так, щоб зменшити ризик:

    - Типова поведінка на каналах із підтримкою DM — **pairing**:
      - Невідомі відправники отримують код pairing; бот не обробляє їхнє повідомлення.
      - Підтвердити можна так: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Кількість очікуваних запитів обмежена **3 на канал**; перевіряйте `openclaw pairing list --channel <channel> [--account <id>]`, якщо код не надійшов.
    - Публічне відкриття DM вимагає явного opt-in (`dmPolicy: "open"` і allowlist `"*"`).

    Запустіть `openclaw doctor`, щоб виявити ризиковані політики DM.

  </Accordion>

  <Accordion title="Чи є prompt injection проблемою лише для публічних ботів?">
    Ні. Prompt injection стосується **недовіреного контенту**, а не лише того, хто може писати боту в DM.
    Якщо ваш помічник читає зовнішній контент (web search/fetch, сторінки браузера, листи,
    документи, вкладення, вставлені журнали), цей контент може містити інструкції, які намагаються
    перехопити керування моделлю. Це може статися, навіть якщо **єдиний відправник — ви**.

    Найбільший ризик виникає, коли ввімкнені інструменти: модель можна обманом змусити
    ексфільтрувати контекст або викликати інструменти від вашого імені. Зменшити радіус ураження можна так:

    - використовувати «читача» без інструментів або лише для читання для узагальнення недовіреного контенту
    - тримати `web_search` / `web_fetch` / `browser` вимкненими для агентів з увімкненими інструментами
    - також ставитися до декодованого тексту файлів/документів як до недовіреного: OpenResponses
      `input_file` і витяг тексту з медіавкладень обгортають витягнутий текст у
      явні маркери меж зовнішнього контенту замість передавання сирого тексту файлу
    - використовувати ізоляцію та суворі allowlist інструментів

    Подробиці: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи повинен бот мати власну електронну пошту, акаунт GitHub або номер телефону?">
    Так, для більшості конфігурацій. Ізоляція бота за допомогою окремих акаунтів і номерів телефону
    зменшує радіус ураження, якщо щось піде не так. Це також полегшує ротацію
    облікових даних або відкликання доступу без впливу на ваші особисті акаунти.

    Починайте з малого. Давайте доступ лише до тих інструментів і акаунтів, які вам справді потрібні, і розширюйте
    його пізніше, якщо знадобиться.

    Документація: [Безпека](/uk/gateway/security), [Pairing](/uk/channels/pairing).

  </Accordion>

  <Accordion title="Чи можу я дати йому автономію над моїми текстовими повідомленнями і чи це безпечно?">
    Ми **не** рекомендуємо повну автономію над вашими особистими повідомленнями. Найбезпечніший шаблон:

    - Тримайте DM у режимі **pairing** або в жорсткому allowlist.
    - Використовуйте **окремий номер або акаунт**, якщо хочете, щоб він надсилав повідомлення від вашого імені.
    - Дозвольте йому готувати чернетку, а потім **затверджуйте перед надсиланням**.

    Якщо ви хочете поекспериментувати, робіть це на окремому акаунті й тримайте його ізольованим. Див.
    [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи можу я використовувати дешевші моделі для завдань персонального помічника?">
    Так, **якщо** агент працює лише в чаті, а вхідні дані довірені. Менші рівні
    більш схильні до перехоплення інструкцій, тому уникайте їх для агентів з увімкненими інструментами
    або коли читаєте недовірений контент. Якщо вже мусите використовувати меншу модель, жорстко обмежте
    інструменти й запускайте всередині sandbox. Див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Я виконав /start у Telegram, але не отримав код pairing">
    Коди pairing надсилаються **лише** тоді, коли невідомий відправник пише боту і
    ввімкнено `dmPolicy: "pairing"`. Сам по собі `/start` не генерує код.

    Перевірте запити, що очікують:

    ```bash
    openclaw pairing list telegram
    ```

    Якщо вам потрібен негайний доступ, додайте свій id відправника до allowlist або задайте `dmPolicy: "open"`
    для цього акаунта.

  </Accordion>

  <Accordion title="WhatsApp: чи писатиме він моїм контактам? Як працює pairing?">
    Ні. Типова політика WhatsApp DM — **pairing**. Невідомі відправники лише отримують код pairing, а їхні повідомлення **не обробляються**. OpenClaw відповідає лише на чати, які він отримує, або на явні надсилання, які ви самі запускаєте.

    Підтвердити pairing можна так:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Переглянути запити, що очікують:

    ```bash
    openclaw pairing list whatsapp
    ```

    Запит номера телефону в майстрі: він використовується для налаштування вашого **allowlist/власника**, щоб ваші власні DM були дозволені. Він не використовується для автоматичного надсилання. Якщо ви запускаєте це на своєму особистому номері WhatsApp, використовуйте цей номер і ввімкніть `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Команди чату, переривання завдань і "воно не зупиняється"

<AccordionGroup>
  <Accordion title="Як зробити так, щоб внутрішні системні повідомлення не показувалися в чаті?">
    Більшість внутрішніх або інструментальних повідомлень з’являються лише тоді, коли для цього сеансу ввімкнено **verbose**, **trace** або **reasoning**.

    Виправлення в чаті, де ви це бачите:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Якщо все одно занадто шумно, перевірте налаштування сеансу в Control UI і виставте verbose
    в **inherit**. Також переконайтеся, що ви не використовуєте профіль бота, у якому `verboseDefault` задано
    як `on` у конфігурації.

    Документація: [Thinking і verbose](/uk/tools/thinking), [Безпека](/uk/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="Як зупинити/скасувати завдання, яке виконується?">
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

    Це тригери переривання, а не slash-команди.

    Для фонових процесів (з інструмента exec) ви можете попросити агента виконати:

    ```
    process action:kill sessionId:XXX
    ```

    Огляд slash-команд: див. [Slash-команди](/uk/tools/slash-commands).

    Більшість команд треба надсилати як **окреме** повідомлення, що починається з `/`, але кілька скорочень (як-от `/status`) також працюють inline для відправників з allowlist.

  </Accordion>

  <Accordion title='Як надіслати повідомлення в Discord з Telegram? ("Cross-context messaging denied")'>
    OpenClaw за замовчуванням блокує повідомлення **між різними провайдерами**. Якщо виклик інструмента прив’язаний
    до Telegram, він не надсилатиме в Discord, доки ви явно цього не дозволите.

    Увімкніть міжпровайдерський обмін повідомленнями для агента:

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

  <Accordion title='Чому здається, що бот "ігнорує" швидкий потік повідомлень?'>
    Режим черги керує тим, як нові повідомлення взаємодіють із поточним запуском. Використовуйте `/queue`, щоб змінити режими:

    - `steer` — нові повідомлення перенаправляють поточне завдання
    - `followup` — повідомлення виконуються по одному
    - `collect` — пакетування повідомлень і одна відповідь (типово)
    - `steer-backlog` — спочатку перенаправити, потім обробити беклог
    - `interrupt` — перервати поточний запуск і почати заново

    Ви можете додавати параметри на кшталт `debounce:2s cap:25 drop:summarize` для режимів followup.

  </Accordion>
</AccordionGroup>

## Різне

<AccordionGroup>
  <Accordion title='Яка модель є типовою для Anthropic з API-ключем?'>
    В OpenClaw облікові дані й вибір моделі — це окремі речі. Задання `ANTHROPIC_API_KEY` (або збереження API-ключа Anthropic у профілях автентифікації) вмикає автентифікацію, але фактична типова модель — це те, що ви налаштуєте в `agents.defaults.model.primary` (наприклад, `anthropic/claude-sonnet-4-6` або `anthropic/claude-opus-4-6`). Якщо ви бачите `No credentials found for profile "anthropic:default"`, це означає, що Gateway не зміг знайти облікові дані Anthropic в очікуваному `auth-profiles.json` для агента, який зараз працює.
  </Accordion>
</AccordionGroup>

---

Усе ще застрягли? Запитайте в [Discord](https://discord.com/invite/clawd) або відкрийте [обговорення GitHub](https://github.com/openclaw/openclaw/discussions).
