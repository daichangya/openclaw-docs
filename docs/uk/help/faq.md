---
read_when:
    - Відповіді на поширені запитання щодо налаштування, встановлення, онбордингу або підтримки під час роботи
    - Тріаж проблем, про які повідомляють користувачі, перед глибшим налагодженням
summary: Поширені запитання про налаштування, конфігурацію та використання OpenClaw
title: Поширені запитання
x-i18n:
    generated_at: "2026-04-20T18:29:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8bde531507540bc91bc131c3e27d72a8be76cc53ef46a5e01aaeaf02a71cc8a2
    source_path: help/faq.md
    workflow: 15
---

# Поширені запитання

Швидкі відповіді плюс глибше усунення несправностей для реальних конфігурацій (локальна розробка, VPS, кілька агентів, OAuth/API-ключі, резервування моделей). Для діагностики під час роботи див. [Усунення несправностей](/uk/gateway/troubleshooting). Повний довідник з конфігурації див. у [Конфігурація](/uk/gateway/configuration).

## Перші 60 секунд, якщо щось зламалося

1. **Швидкий статус (перша перевірка)**

   ```bash
   openclaw status
   ```

   Швидкий локальний підсумок: ОС + оновлення, доступність gateway/сервісу, агенти/сесії, конфігурація провайдера + проблеми під час роботи (коли gateway доступний).

2. **Звіт, який можна вставити (безпечно ділитися)**

   ```bash
   openclaw status --all
   ```

   Діагностика лише для читання з хвостом логів (токени замасковані).

3. **Стан демона + порту**

   ```bash
   openclaw gateway status
   ```

   Показує стан supervisor під час роботи проти доступності RPC, цільовий URL перевірки та яку конфігурацію сервіс імовірно використовував.

4. **Глибокі перевірки**

   ```bash
   openclaw status --deep
   ```

   Виконує живу перевірку стану gateway, включно з перевірками каналів, коли це підтримується
   (потрібен доступний gateway). Див. [Health](/uk/gateway/health).

5. **Показати останній лог у реальному часі**

   ```bash
   openclaw logs --follow
   ```

   Якщо RPC недоступний, використайте резервний варіант:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   Файлові логи відокремлені від сервісних логів; див. [Логування](/uk/logging) і [Усунення несправностей](/uk/gateway/troubleshooting).

6. **Запустіть doctor (виправлення)**

   ```bash
   openclaw doctor
   ```

   Виправляє/мігрує конфігурацію/стан + виконує перевірки здоров’я. Див. [Doctor](/uk/gateway/doctor).

7. **Знімок стану gateway**

   ```bash
   openclaw health --json
   openclaw health --verbose   # shows the target URL + config path on errors
   ```

   Запитує у запущеного gateway повний знімок стану (лише WS). Див. [Health](/uk/gateway/health).

## Швидкий старт і перше налаштування

<AccordionGroup>
  <Accordion title="Я застряг, який найшвидший спосіб розблокуватися?">
    Використовуйте локального AI-агента, який може **бачити вашу машину**. Це набагато ефективніше, ніж звертатися
    у Discord, тому що більшість випадків «я застряг» — це **проблеми локальної конфігурації або середовища**,
    які віддалені помічники не можуть перевірити.

    - **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
    - **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

    Ці інструменти можуть читати репозиторій, запускати команди, перевіряти логи та допомагати виправляти
    налаштування на рівні машини (PATH, сервіси, дозволи, файли автентифікації). Надайте їм **повну копію вихідного коду**
    через інсталяцію для редагування (git):

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Це встановлює OpenClaw **з git checkout**, тому агент може читати код + документацію та
    аналізувати точну версію, яку ви використовуєте. Ви завжди можете повернутися до стабільної версії пізніше,
    повторно запустивши інсталятор без `--install-method git`.

    Порада: попросіть агента **спланувати та проконтролювати** виправлення (крок за кроком), а потім виконати лише
    необхідні команди. Це робить зміни меншими й простішими для аудиту.

    Якщо ви знайдете реальну помилку або виправлення, будь ласка, створіть issue на GitHub або надішліть PR:
    [https://github.com/openclaw/openclaw/issues](https://github.com/openclaw/openclaw/issues)
    [https://github.com/openclaw/openclaw/pulls](https://github.com/openclaw/openclaw/pulls)

    Почніть із цих команд (поділіться виводом, коли просите про допомогу):

    ```bash
    openclaw status
    openclaw models status
    openclaw doctor
    ```

    Що вони роблять:

    - `openclaw status`: швидкий знімок стану gateway/агента + базова конфігурація.
    - `openclaw models status`: перевіряє автентифікацію провайдера + доступність моделей.
    - `openclaw doctor`: перевіряє та виправляє поширені проблеми конфігурації/стану.

    Інші корисні перевірки CLI: `openclaw status --all`, `openclaw logs --follow`,
    `openclaw gateway status`, `openclaw health --verbose`.

    Швидкий цикл налагодження: [Перші 60 секунд, якщо щось зламалося](#перші-60-секунд-якщо-щось-зламалося).
    Документація з інсталяції: [Інсталяція](/uk/install), [Прапорці інсталятора](/uk/install/installer), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Heartbeat постійно пропускається. Що означають причини пропуску?">
    Поширені причини пропуску Heartbeat:

    - `quiet-hours`: поза межами налаштованого вікна active-hours
    - `empty-heartbeat-file`: `HEARTBEAT.md` існує, але містить лише порожню/заголовкову заготовку
    - `no-tasks-due`: активний режим завдань `HEARTBEAT.md`, але жоден із інтервалів завдань ще не настав
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

    Майстер також може автоматично зібрати UI-ресурси. Після онбордингу ви зазвичай запускаєте Gateway на порту **18789**.

    Із вихідного коду (контриб’ютори/розробники):

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
    Майстер відкриває браузер із чистим (без токенів) URL dashboard одразу після онбордингу, а також виводить посилання в підсумку. Тримайте цю вкладку відкритою; якщо вона не запустилася, скопіюйте й вставте надрукований URL на тій самій машині.
  </Accordion>

  <Accordion title="Як автентифікувати dashboard на localhost і віддалено?">
    **Localhost (та сама машина):**

    - Відкрийте `http://127.0.0.1:18789/`.
    - Якщо запитується автентифікація за спільним секретом, вставте налаштований токен або пароль у налаштуваннях Control UI.
    - Джерело токена: `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
    - Джерело пароля: `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо спільний секрет ще не налаштовано, згенеруйте токен за допомогою `openclaw doctor --generate-gateway-token`.

    **Не на localhost:**

    - **Tailscale Serve** (рекомендовано): залиште loopback bind, запустіть `openclaw gateway --tailscale serve`, відкрийте `https://<magicdns>/`. Якщо `gateway.auth.allowTailscale` має значення `true`, заголовки ідентичності задовольняють автентифікацію Control UI/WebSocket (без вставлення спільного секрету, за умови довіреного хоста gateway); API HTTP усе одно вимагають автентифікації за спільним секретом, якщо ви свідомо не використовуєте `none` для private-ingress або HTTP-автентифікацію trusted-proxy.
      Некоректні одночасні спроби автентифікації Serve від того самого клієнта серіалізуються до того, як обмежувач невдалих спроб зафіксує їх, тому друга невдала спроба вже може показувати `retry later`.
    - **Bind до tailnet**: запустіть `openclaw gateway --bind tailnet --token "<token>"` (або налаштуйте автентифікацію за паролем), відкрийте `http://<tailscale-ip>:18789/`, а потім вставте відповідний спільний секрет у налаштуваннях dashboard.
    - **Reverse proxy з урахуванням ідентичності**: залиште Gateway за trusted proxy без loopback, налаштуйте `gateway.auth.mode: "trusted-proxy"`, а потім відкрийте URL proxy.
    - **SSH-тунель**: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`. Автентифікація за спільним секретом усе одно застосовується через тунель; вставте налаштований токен або пароль, якщо буде запит.

    Див. [Dashboard](/web/dashboard) і [Веб-поверхні](/web), щоб дізнатися про режими bind і деталі автентифікації.

  </Accordion>

  <Accordion title="Чому є дві конфігурації підтвердження exec для chat approvals?">
    Вони керують різними рівнями:

    - `approvals.exec`: пересилає запити на підтвердження до призначень чату
    - `channels.<channel>.execApprovals`: робить цей канал нативним клієнтом підтвердження для exec approvals

    Політика host exec усе ще є реальним бар’єром підтвердження. Конфігурація чату лише керує тим,
    де з’являються запити на підтвердження і як люди можуть на них відповідати.

    У більшості конфігурацій вам **не** потрібні обидві:

    - Якщо чат уже підтримує команди й відповіді, `/approve` у тому самому чаті працює через спільний шлях.
    - Якщо підтримуваний нативний канал може безпечно визначити апруверів, OpenClaw тепер автоматично вмикає нативні підтвердження спочатку через DM, коли `channels.<channel>.execApprovals.enabled` не задано або дорівнює `"auto"`.
    - Коли доступні нативні картки/кнопки підтвердження, цей нативний UI є основним шляхом; агент має включати ручну команду `/approve` лише якщо результат інструмента каже, що chat approvals недоступні або ручне підтвердження — єдиний шлях.
    - Використовуйте `approvals.exec` лише тоді, коли запити також потрібно пересилати в інші чати або в окремі кімнати для ops.
    - Використовуйте `channels.<channel>.execApprovals.target: "channel"` або `"both"` лише якщо ви явно хочете, щоб запити на підтвердження публікувалися назад у початкову кімнату/тему.
    - Підтвердження Plugin — це ще окрема категорія: вони типово використовують `/approve` у тому самому чаті, необов’язкове пересилання `approvals.plugin`, і лише деякі нативні канали додатково зберігають нативну обробку plugin-підтверджень.

    Коротко: пересилання — це маршрутизація, конфігурація нативного клієнта — це багатший UX, специфічний для каналу.
    Див. [Exec Approvals](/uk/tools/exec-approvals).

  </Accordion>

  <Accordion title="Яке середовище виконання мені потрібне?">
    Потрібен Node **>= 22**. Рекомендується `pnpm`. Bun **не рекомендується** для Gateway.
  </Accordion>

  <Accordion title="Чи працює це на Raspberry Pi?">
    Так. Gateway легкий — у документації вказано, що для особистого використання достатньо **512 МБ–1 ГБ RAM**, **1 ядра** і приблизно **500 МБ**
    диска, а також зазначено, що **Raspberry Pi 4 може його запускати**.

    Якщо вам потрібен додатковий запас (логи, медіа, інші сервіси), **рекомендується 2 ГБ**, але це
    не жорсткий мінімум.

    Порада: невеликий Pi/VPS може хостити Gateway, а ви можете під’єднати **nodes** на ноутбуці/телефоні для
    локального екрана/камери/canvas або виконання команд. Див. [Nodes](/uk/nodes).

  </Accordion>

  <Accordion title="Чи є поради для встановлення на Raspberry Pi?">
    Коротко: це працює, але очікуйте шорстких країв.

    - Використовуйте **64-бітну** ОС і Node >= 22.
    - Надавайте перевагу **інсталяції для редагування (git)**, щоб можна було бачити логи й швидко оновлюватися.
    - Починайте без каналів/Skills, а потім додавайте їх по одному.
    - Якщо стикаєтеся з дивними проблемами з бінарниками, це зазвичай проблема **сумісності ARM**.

    Документація: [Linux](/uk/platforms/linux), [Інсталяція](/uk/install).

  </Accordion>

  <Accordion title="Воно зависло на wake up my friend / онбординг не хоче hatch. Що тепер?">
    Цей екран залежить від того, чи gateway доступний і автентифікований. TUI також надсилає
    «Wake up, my friend!» автоматично під час першого hatch. Якщо ви бачите цей рядок **без відповіді**
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

    Якщо Gateway віддалений, переконайтеся, що тунель/Tailscale-з’єднання активне і що UI
    вказує на правильний Gateway. Див. [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Чи можу я перенести своє налаштування на нову машину (Mac mini), не проходячи онбординг заново?">
    Так. Скопіюйте **каталог стану** і **workspace**, а потім один раз запустіть Doctor. Це
    збереже вашого бота «точно таким самим» (пам’ять, історію сесій, автентифікацію та стан
    каналів), якщо ви скопіюєте **обидва** місця:

    1. Встановіть OpenClaw на новій машині.
    2. Скопіюйте `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`) зі старої машини.
    3. Скопіюйте ваш workspace (типово: `~/.openclaw/workspace`).
    4. Запустіть `openclaw doctor` і перезапустіть сервіс Gateway.

    Це зберігає конфігурацію, профілі автентифікації, облікові дані WhatsApp, сесії та пам’ять. Якщо ви працюєте
    у віддаленому режимі, пам’ятайте, що session store і workspace належать хосту gateway.

    **Важливо:** якщо ви лише комітите/пушите свій workspace на GitHub, ви робите резервну
    копію **пам’яті + bootstrap-файлів**, але **не** історії сесій чи автентифікації. Вони зберігаються
    у `~/.openclaw/` (наприклад, `~/.openclaw/agents/<agentId>/sessions/`).

    Пов’язано: [Міграція](/uk/install/migrating), [Де що зберігається на диску](#where-things-live-on-disk),
    [Workspace агента](/uk/concepts/agent-workspace), [Doctor](/uk/gateway/doctor),
    [Віддалений режим](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де подивитися, що нового в останній версії?">
    Перевірте changelog на GitHub:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Найновіші записи розташовані вгорі. Якщо верхній розділ позначено як **Unreleased**, наступний датований
    розділ — це остання випущена версія. Записи згруповані за **Highlights**, **Changes** і
    **Fixes** (а також за розділами docs/other, коли це потрібно).

  </Accordion>

  <Accordion title="Не вдається відкрити docs.openclaw.ai (помилка SSL)">
    Деякі з’єднання Comcast/Xfinity помилково блокують `docs.openclaw.ai` через Xfinity
    Advanced Security. Вимкніть її або додайте `docs.openclaw.ai` до allowlist, а потім повторіть спробу.
    Будь ласка, допоможіть нам розблокувати сайт, повідомивши тут: [https://spa.xfinity.com/check_url_status](https://spa.xfinity.com/check_url_status).

    Якщо ви все ще не можете відкрити сайт, документація дзеркалюється на GitHub:
    [https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

  </Accordion>

  <Accordion title="Різниця між stable і beta">
    **Stable** і **beta** — це **npm dist-tags**, а не окремі гілки коду:

    - `latest` = stable
    - `beta` = рання збірка для тестування

    Зазвичай stable-реліз спочатку потрапляє в **beta**, а потім явний
    крок просування переміщує цю саму версію в `latest`. За потреби мейнтейнери також можуть
    публікувати одразу в `latest`. Саме тому після просування beta і stable можуть
    вказувати на **одну й ту саму версію**.

    Подивитися, що змінилося:
    [https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

    Однорядкові команди встановлення та різницю між beta і dev див. в accordion нижче.

  </Accordion>

  <Accordion title="Як установити beta-версію і в чому різниця між beta та dev?">
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

    1. **Dev channel (git checkout):**

    ```bash
    openclaw update --channel dev
    ```

    Це перемикає вас на гілку `main` і оновлює з вихідного коду.

    2. **Інсталяція для редагування (із сайту інсталятора):**

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

    Документація: [Оновлення](/cli/update), [Канали розробки](/uk/install/development-channels),
    [Інсталяція](/uk/install).

  </Accordion>

  <Accordion title="Скільки зазвичай тривають встановлення та онбординг?">
    Орієнтовно:

    - **Встановлення:** 2–5 хвилин
    - **Онбординг:** 5–15 хвилин залежно від того, скільки каналів/моделей ви налаштовуєте

    Якщо все зависає, скористайтеся [Інсталятор завис?](#quick-start-and-first-run-setup)
    і швидким циклом налагодження в [Я застряг](#quick-start-and-first-run-setup).

  </Accordion>

  <Accordion title="Інсталятор завис? Як отримати більше зворотного зв’язку?">
    Повторно запустіть інсталятор з **докладним виводом**:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
    ```

    Встановлення beta з докладним виводом:

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
    ```

    Для інсталяції для редагування (git):

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

  <Accordion title="Під час встановлення у Windows з’являється повідомлення git not found або openclaw not recognized">
    Дві поширені проблеми у Windows:

    **1) помилка npm spawn git / git not found**

    - Установіть **Git for Windows** і переконайтеся, що `git` є у вашому PATH.
    - Закрийте й знову відкрийте PowerShell, потім повторно запустіть інсталятор.

    **2) після встановлення openclaw is not recognized**

    - Ваша глобальна папка bin npm не додана в PATH.
    - Перевірте шлях:

      ```powershell
      npm config get prefix
      ```

    - Додайте цей каталог до свого користувацького PATH (суфікс `\bin` у Windows не потрібен; у більшості систем це `%AppData%\npm`).
    - Після оновлення PATH закрийте й знову відкрийте PowerShell.

    Якщо ви хочете найгладше налаштування у Windows, використовуйте **WSL2** замість нативного Windows.
    Документація: [Windows](/uk/platforms/windows).

  </Accordion>

  <Accordion title="У Windows вивід exec показує спотворений китайський текст — що робити?">
    Зазвичай це невідповідність кодової сторінки консолі в нативних оболонках Windows.

    Симптоми:

    - Вивід `system.run`/`exec` відображає китайський текст як mojibake
    - Та сама команда нормально виглядає в іншому профілі термінала

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
    Використовуйте **інсталяцію для редагування (git)**, щоб повний вихідний код і документація були локально, а потім запитайте
    свого бота (або Claude/Codex) _з цієї папки_, щоб він міг читати репозиторій і дати точну відповідь.

    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```

    Докладніше: [Інсталяція](/uk/install) і [Прапорці інсталятора](/uk/install/installer).

  </Accordion>

  <Accordion title="Як установити OpenClaw на Linux?">
    Коротка відповідь: дотримуйтеся інструкції для Linux, а потім запустіть онбординг.

    - Швидкий шлях для Linux + встановлення сервісу: [Linux](/uk/platforms/linux).
    - Повний покроковий посібник: [Початок роботи](/uk/start/getting-started).
    - Інсталятор + оновлення: [Встановлення й оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Як установити OpenClaw на VPS?">
    Підійде будь-який VPS на Linux. Установіть на сервері, а потім використовуйте SSH/Tailscale для доступу до Gateway.

    Інструкції: [exe.dev](/uk/install/exe-dev), [Hetzner](/uk/install/hetzner), [Fly.io](/uk/install/fly).
    Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).

  </Accordion>

  <Accordion title="Де інструкції зі встановлення в хмарі/VPS?">
    Ми підтримуємо **хаб хостингу** з поширеними провайдерами. Виберіть одного та дотримуйтеся інструкції:

    - [VPS-хостинг](/uk/vps) (усі провайдери в одному місці)
    - [Fly.io](/uk/install/fly)
    - [Hetzner](/uk/install/hetzner)
    - [exe.dev](/uk/install/exe-dev)

    Як це працює в хмарі: **Gateway працює на сервері**, а ви отримуєте до нього доступ
    з ноутбука/телефона через Control UI (або Tailscale/SSH). Ваші стан + workspace
    зберігаються на сервері, тому ставтеся до хоста як до джерела істини та робіть його резервні копії.

    Ви можете під’єднати **nodes** (Mac/iOS/Android/headless) до цього хмарного Gateway, щоб отримувати доступ
    до локального екрана/камери/canvas або виконувати команди на своєму ноутбуці, залишаючи
    Gateway у хмарі.

    Хаб: [Платформи](/uk/platforms). Віддалений доступ: [Віддалений Gateway](/uk/gateway/remote).
    Nodes: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я попросити OpenClaw оновити самого себе?">
    Коротка відповідь: **можливо, але не рекомендується**. Процес оновлення може перезапустити
    Gateway (що розірве активну сесію), може потребувати чистого git checkout і
    може запитати підтвердження. Безпечніше запускати оновлення з оболонки як оператор.

    Використовуйте CLI:

    ```bash
    openclaw update
    openclaw update status
    openclaw update --channel stable|beta|dev
    openclaw update --tag <dist-tag|version>
    openclaw update --no-restart
    ```

    Якщо вам обов’язково потрібно автоматизувати це від імені агента:

    ```bash
    openclaw update --yes --no-restart
    openclaw gateway restart
    ```

    Документація: [Оновлення](/cli/update), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Що насправді робить онбординг?">
    `openclaw onboard` — це рекомендований шлях налаштування. У **локальному режимі** він проводить вас через:

    - **Налаштування моделі/автентифікації** (OAuth провайдера, API-ключі, setup-token Anthropic, а також локальні варіанти моделей, як-от LM Studio)
    - Розташування **workspace** + bootstrap-файли
    - **Налаштування Gateway** (bind/port/auth/tailscale)
    - **Канали** (WhatsApp, Telegram, Discord, Mattermost, Signal, iMessage, а також вбудовані channel plugin, як-от QQ Bot)
    - **Установлення демона** (LaunchAgent у macOS; systemd user unit у Linux/WSL2)
    - **Перевірки здоров’я** і вибір **Skills**

    Він також попереджає, якщо ваша налаштована модель невідома або для неї бракує автентифікації.

  </Accordion>

  <Accordion title="Чи потрібна мені підписка Claude або OpenAI, щоб це працювало?">
    Ні. Ви можете запускати OpenClaw з **API-ключами** (Anthropic/OpenAI/інші) або з
    **лише локальними моделями**, щоб ваші дані залишалися на вашому пристрої. Підписки (Claude
    Pro/Max або OpenAI Codex) — це необов’язкові способи автентифікації в цих провайдерів.

    Для Anthropic в OpenClaw практичний поділ такий:

    - **API-ключ Anthropic**: звичайна тарифікація API Anthropic
    - **Claude CLI / автентифікація через підписку Claude в OpenClaw**: співробітники Anthropic
      повідомили нам, що таке використання знову дозволене, і OpenClaw розглядає використання `claude -p`
      як санкціоноване для цієї інтеграції, якщо Anthropic не опублікує нову
      політику

    Для довготривалих хостів gateway API-ключі Anthropic усе ще є більш
    передбачуваним налаштуванням. OAuth OpenAI Codex явно підтримується для зовнішніх
    інструментів на кшталт OpenClaw.

    OpenClaw також підтримує інші розміщені варіанти у стилі підписки, зокрема
    **Qwen Cloud Coding Plan**, **MiniMax Coding Plan** і
    **Z.AI / GLM Coding Plan**.

    Документація: [Anthropic](/uk/providers/anthropic), [OpenAI](/uk/providers/openai),
    [Qwen Cloud](/uk/providers/qwen),
    [MiniMax](/uk/providers/minimax), [GLM Models](/uk/providers/glm),
    [Локальні моделі](/uk/gateway/local-models), [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати підписку Claude Max без API-ключа?">
    Так.

    Співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому
    OpenClaw розглядає автентифікацію через підписку Claude і використання `claude -p` як санкціоновані
    для цієї інтеграції, якщо Anthropic не опублікує нову політику. Якщо вам потрібне
    найбільш передбачуване серверне налаштування, натомість використовуйте API-ключ Anthropic.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку Claude (Claude Pro або Max)?">
    Так.

    Співробітники Anthropic повідомили нам, що таке використання знову дозволене, тому OpenClaw розглядає
    повторне використання Claude CLI і використання `claude -p` як санкціоновані для цієї інтеграції,
    якщо Anthropic не опублікує нову політику.

    setup-token Anthropic усе ще доступний як підтримуваний шлях токена OpenClaw, але тепер OpenClaw віддає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.
    Для production або багатокористувацьких навантажень автентифікація через API-ключ Anthropic усе ще є
    безпечнішим і більш передбачуваним вибором. Якщо вам потрібні інші розміщені
    варіанти у стилі підписки в OpenClaw, див. [OpenAI](/uk/providers/openai), [Qwen / Model
    Cloud](/uk/providers/qwen), [MiniMax](/uk/providers/minimax) і [GLM
    Models](/uk/providers/glm).

  </Accordion>

<a id="why-am-i-seeing-http-429-ratelimiterror-from-anthropic"></a>
<Accordion title="Чому я бачу HTTP 429 rate_limit_error від Anthropic?">
Це означає, що вашу **квоту/ліміт запитів Anthropic** вичерпано для поточного вікна. Якщо ви
використовуєте **Claude CLI**, зачекайте, поки вікно скинеться, або оновіть свій план. Якщо ви
використовуєте **API-ключ Anthropic**, перевірте Anthropic Console
щодо використання/білінгу та за потреби підвищте ліміти.

    Якщо повідомлення конкретно таке:
    `Extra usage is required for long context requests`, запит намагається використати
    бета-функцію контексту 1M від Anthropic (`context1m: true`). Це працює лише тоді, коли ваші
    облікові дані мають право на білінг довгого контексту (білінг за API-ключем або
    шлях входу Claude в OpenClaw з увімкненим Extra Usage).

    Порада: установіть **резервну модель**, щоб OpenClaw міг продовжувати відповідати, поки провайдер обмежений за лімітом запитів.
    Див. [Models](/cli/models), [OAuth](/uk/concepts/oauth) і
    [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

  </Accordion>

  <Accordion title="Чи підтримується AWS Bedrock?">
    Так. OpenClaw має вбудований провайдер **Amazon Bedrock (Converse)**. За наявності маркерів середовища AWS OpenClaw може автоматично виявити каталог потокових/текстових моделей Bedrock і об’єднати його як неявного провайдера `amazon-bedrock`; інакше ви можете явно ввімкнути `plugins.entries.amazon-bedrock.config.discovery.enabled` або додати запис провайдера вручну. Див. [Amazon Bedrock](/uk/providers/bedrock) і [Провайдери моделей](/uk/providers/models). Якщо ви віддаєте перевагу керованому потоку ключів, OpenAI-сумісний proxy перед Bedrock теж залишається коректним варіантом.
  </Accordion>

  <Accordion title="Як працює автентифікація Codex?">
    OpenClaw підтримує **OpenAI Code (Codex)** через OAuth (вхід через ChatGPT). Під час онбордингу можна пройти OAuth-потік, і за потреби він встановить модель за замовчуванням `openai-codex/gpt-5.4`. Див. [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).
  </Accordion>

  <Accordion title="Чому ChatGPT GPT-5.4 не відкриває openai/gpt-5.4 в OpenClaw?">
    OpenClaw розглядає ці два шляхи окремо:

    - `openai-codex/gpt-5.4` = OAuth ChatGPT/Codex
    - `openai/gpt-5.4` = прямий API OpenAI Platform

    В OpenClaw вхід через ChatGPT/Codex прив’язаний до маршруту `openai-codex/*`,
    а не до прямого маршруту `openai/*`. Якщо вам потрібен прямий API-шлях в
    OpenClaw, установіть `OPENAI_API_KEY` (або еквівалентну конфігурацію провайдера OpenAI).
    Якщо вам потрібен вхід через ChatGPT/Codex в OpenClaw, використовуйте `openai-codex/*`.

  </Accordion>

  <Accordion title="Чому ліміти Codex OAuth можуть відрізнятися від ChatGPT web?">
    `openai-codex/*` використовує маршрут Codex OAuth, а його доступні вікна квот
    керуються OpenAI і залежать від плану. На практиці ці ліміти можуть відрізнятися від
    досвіду на сайті/в застосунку ChatGPT, навіть якщо обидва прив’язані до одного облікового запису.

    OpenClaw може показувати поточні видимі вікна використання/квоти провайдера в
    `openclaw models status`, але не вигадує і не нормалізує entitlements ChatGPT web
    у прямий доступ до API. Якщо вам потрібен прямий шлях білінгу/лімітів OpenAI Platform,
    використовуйте `openai/*` з API-ключем.

  </Accordion>

  <Accordion title="Чи підтримуєте ви автентифікацію через підписку OpenAI (Codex OAuth)?">
    Так. OpenClaw повністю підтримує **OAuth через підписку OpenAI Code (Codex)**.
    OpenAI явно дозволяє використання OAuth підписки у зовнішніх інструментах/робочих процесах
    на кшталт OpenClaw. Під час онбордингу можна пройти OAuth-потік за вас.

    Див. [OAuth](/uk/concepts/oauth), [Провайдери моделей](/uk/concepts/model-providers) і [Онбординг (CLI)](/uk/start/wizard).

  </Accordion>

  <Accordion title="Як налаштувати Gemini CLI OAuth?">
    Gemini CLI використовує **потік автентифікації Plugin**, а не client id чи secret у `openclaw.json`.

    Кроки:

    1. Установіть Gemini CLI локально, щоб `gemini` був у `PATH`
       - Homebrew: `brew install gemini-cli`
       - npm: `npm install -g @google/gemini-cli`
    2. Увімкніть plugin: `openclaw plugins enable google`
    3. Увійдіть: `openclaw models auth login --provider google-gemini-cli --set-default`
    4. Модель за замовчуванням після входу: `google-gemini-cli/gemini-3-flash-preview`
    5. Якщо запити не працюють, установіть `GOOGLE_CLOUD_PROJECT` або `GOOGLE_CLOUD_PROJECT_ID` на хості gateway

    Це зберігає OAuth-токени в профілях автентифікації на хості gateway. Подробиці: [Провайдери моделей](/uk/concepts/model-providers).

  </Accordion>

  <Accordion title="Чи підходить локальна модель для невимушених чатів?">
    Зазвичай ні. OpenClaw потребує великого контексту + сильної безпеки; малі картки обрізають і протікають. Якщо все ж потрібно, запускайте **найбільшу** збірку моделі, яку можете локально (LM Studio), і див. [/gateway/local-models](/uk/gateway/local-models). Менші/квантизовані моделі збільшують ризик prompt injection — див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Як зберегти трафік до розміщених моделей у певному регіоні?">
    Вибирайте endpoints, прив’язані до регіону. OpenRouter надає варіанти, розміщені у США, для MiniMax, Kimi і GLM; виберіть варіант, розміщений у США, щоб зберігати дані в межах регіону. Ви все одно можете перелічувати Anthropic/OpenAI поруч із ними, використовуючи `models.mode: "merge"`, щоб резервні варіанти залишалися доступними, одночасно дотримуючись вибраного регіонального провайдера.
  </Accordion>

  <Accordion title="Чи потрібно купувати Mac Mini, щоб це встановити?">
    Ні. OpenClaw працює на macOS або Linux (Windows через WSL2). Mac mini — необов’язковий варіант: дехто
    купує його як постійно ввімкнений хост, але також підійде невеликий VPS, домашній сервер або пристрій класу Raspberry Pi.

    Mac потрібен лише **для інструментів лише для macOS**. Для iMessage використовуйте [BlueBubbles](/uk/channels/bluebubbles) (рекомендовано) — сервер BlueBubbles працює на будь-якому Mac, а Gateway може працювати на Linux або деінде. Якщо вам потрібні інші інструменти лише для macOS, запускайте Gateway на Mac або під’єднайте macOS Node.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes), [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи потрібен мені Mac mini для підтримки iMessage?">
    Вам потрібен **якийсь пристрій macOS**, увійшовший у Messages. Це **не обов’язково** має бути Mac mini —
    підійде будь-який Mac. Для iMessage **використовуйте [BlueBubbles](/uk/channels/bluebubbles)** (рекомендовано) — сервер BlueBubbles працює на macOS, тоді як Gateway може працювати на Linux або деінде.

    Поширені конфігурації:

    - Запустіть Gateway на Linux/VPS, а сервер BlueBubbles — на будь-якому Mac, увійшовшому в Messages.
    - Запустіть усе на Mac, якщо хочете найпростішу конфігурацію з однією машиною.

    Документація: [BlueBubbles](/uk/channels/bluebubbles), [Nodes](/uk/nodes),
    [Віддалений режим Mac](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Якщо я куплю Mac mini для запуску OpenClaw, чи зможу я підключити його до свого MacBook Pro?">
    Так. **Mac mini може запускати Gateway**, а ваш MacBook Pro може підключатися як
    **Node** (додатковий пристрій). Nodes не запускають Gateway — вони надають додаткові
    можливості, як-от екран/камера/canvas і `system.run` на цьому пристрої.

    Поширений шаблон:

    - Gateway на Mac mini (постійно ввімкнений).
    - MacBook Pro запускає застосунок macOS або хост Node і під’єднується до Gateway.
    - Використовуйте `openclaw nodes status` / `openclaw nodes list`, щоб побачити його.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes).

  </Accordion>

  <Accordion title="Чи можу я використовувати Bun?">
    Bun **не рекомендується**. Ми спостерігаємо помилки під час виконання, особливо з WhatsApp і Telegram.
    Для стабільних gateway використовуйте **Node**.

    Якщо ви все ж хочете поекспериментувати з Bun, робіть це на gateway не для production
    без WhatsApp/Telegram.

  </Accordion>

  <Accordion title="Telegram: що вказувати в allowFrom?">
    `channels.telegram.allowFrom` — це **Telegram user ID людини-відправника** (числовий). Це не ім’я користувача бота.

    Під час налаштування запитуються лише числові user ID. Якщо у вашій конфігурації вже є застарілі записи `@username`, `openclaw doctor --fix` може спробувати їх розв’язати.

    Безпечніше (без стороннього бота):

    - Напишіть своєму боту в DM, а потім виконайте `openclaw logs --follow` і прочитайте `from.id`.

    Офіційний Bot API:

    - Напишіть своєму боту в DM, а потім викличте `https://api.telegram.org/bot<bot_token>/getUpdates` і прочитайте `message.from.id`.

    Сторонній варіант (менш приватний):

    - Напишіть у DM `@userinfobot` або `@getidsbot`.

    Див. [/channels/telegram](/uk/channels/telegram#access-control-and-activation).

  </Accordion>

  <Accordion title="Чи можуть кілька людей використовувати один номер WhatsApp з різними екземплярами OpenClaw?">
    Так, через **маршрутизацію кількох агентів**. Прив’яжіть **DM** WhatsApp кожного відправника (peer `kind: "direct"`, E.164 відправника на кшталт `+15551234567`) до іншого `agentId`, щоб кожна людина мала власний workspace і session store. Відповіді все одно надходитимуть з **того самого облікового запису WhatsApp**, а контроль доступу DM (`channels.whatsapp.dmPolicy` / `channels.whatsapp.allowFrom`) є глобальним для кожного облікового запису WhatsApp. Див. [Маршрутизація кількох агентів](/uk/concepts/multi-agent) і [WhatsApp](/uk/channels/whatsapp).
  </Accordion>

  <Accordion title='Чи можу я запустити агента для "швидкого чату" і агента "Opus для кодування"?'>
    Так. Використовуйте маршрутизацію кількох агентів: надайте кожному агенту власну модель за замовчуванням, а потім прив’яжіть вхідні маршрути (обліковий запис провайдера або конкретних peers) до кожного агента. Приклад конфігурації наведено в [Маршрутизація кількох агентів](/uk/concepts/multi-agent). Див. також [Моделі](/uk/concepts/models) і [Конфігурація](/uk/gateway/configuration).
  </Accordion>

  <Accordion title="Чи працює Homebrew на Linux?">
    Так. Homebrew підтримує Linux (Linuxbrew). Швидке налаштування:

    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
    brew install <formula>
    ```

    Якщо ви запускаєте OpenClaw через systemd, переконайтеся, що PATH сервісу містить `/home/linuxbrew/.linuxbrew/bin` (або ваш префікс brew), щоб інструменти, встановлені через `brew`, розв’язувалися в non-login оболонках.
    Останні збірки також додають на початок поширені користувацькі каталоги bin у Linux systemd services (наприклад `~/.local/bin`, `~/.npm-global/bin`, `~/.local/share/pnpm`, `~/.bun/bin`) і враховують `PNPM_HOME`, `NPM_CONFIG_PREFIX`, `BUN_INSTALL`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `NVM_DIR` і `FNM_DIR`, якщо вони задані.

  </Accordion>

  <Accordion title="Різниця між інсталяцією git для редагування і npm install">
    - **Інсталяція git для редагування:** повний checkout вихідного коду, можна редагувати, найкраще для контриб’юторів.
      Ви локально запускаєте збірки й можете вносити зміни в код/документацію.
    - **npm install:** глобальне встановлення CLI, без репозиторію, найкраще для сценарію «просто запустити».
      Оновлення надходять через npm dist-tags.

    Документація: [Початок роботи](/uk/start/getting-started), [Оновлення](/uk/install/updating).

  </Accordion>

  <Accordion title="Чи можу я пізніше перемикатися між npm і git-встановленнями?">
    Так. Установіть інший варіант, а потім запустіть Doctor, щоб сервіс gateway вказував на нову точку входу.
    Це **не видаляє ваші дані** — змінюється лише інсталяція коду OpenClaw. Ваш стан
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

    Doctor виявляє невідповідність точки входу сервісу gateway і пропонує переписати конфігурацію сервісу відповідно до поточного встановлення (у сценаріях автоматизації використовуйте `--repair`).

    Поради щодо резервного копіювання: див. [Стратегія резервного копіювання](#where-things-live-on-disk).

  </Accordion>

  <Accordion title="Чи варто запускати Gateway на ноутбуці чи на VPS?">
    Коротка відповідь: **якщо вам потрібна надійність 24/7, використовуйте VPS**. Якщо вам потрібне
    мінімальне тертя і вас влаштовують сон/перезапуски, запускайте локально.

    **Ноутбук (локальний Gateway)**

    - **Переваги:** немає витрат на сервер, прямий доступ до локальних файлів, видиме вікно браузера.
    - **Недоліки:** сон/обриви мережі = відключення, оновлення/перезавантаження ОС переривають роботу, машина має залишатися активною.

    **VPS / хмара**

    - **Переваги:** завжди ввімкнено, стабільна мережа, немає проблем через сон ноутбука, простіше підтримувати роботу.
    - **Недоліки:** часто headless-режим (використовуйте знімки екрана), лише віддалений доступ до файлів, для оновлень потрібно SSH.

    **Примітка для OpenClaw:** WhatsApp/Telegram/Slack/Mattermost/Discord чудово працюють з VPS. Єдиний реальний компроміс — **headless browser** проти видимого вікна. Див. [Браузер](/uk/tools/browser).

    **Рекомендований варіант за замовчуванням:** VPS, якщо у вас раніше були відключення gateway. Локальний запуск чудовий, коли ви активно користуєтеся Mac і хочете доступ до локальних файлів або автоматизацію UI з видимим браузером.

  </Accordion>

  <Accordion title="Наскільки важливо запускати OpenClaw на окремій машині?">
    Не обов’язково, але **рекомендується для надійності й ізоляції**.

    - **Виділений хост (VPS/Mac mini/Pi):** завжди ввімкнений, менше переривань через сон/перезавантаження, чистіші дозволи, простіше підтримувати роботу.
    - **Спільний ноутбук/десктоп:** цілком підходить для тестування й активного використання, але очікуйте пауз, коли машина засинає або оновлюється.

    Якщо хочете найкраще з обох світів, тримайте Gateway на виділеному хості, а ноутбук під’єднайте як **Node** для локальних інструментів screen/camera/exec. Див. [Nodes](/uk/nodes).
    Рекомендації з безпеки див. в [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які мінімальні вимоги до VPS і яка ОС рекомендована?">
    OpenClaw легкий. Для базового Gateway + одного каналу чату:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM, ~500 МБ диска.
    - **Рекомендовано:** 1–2 vCPU, 2 ГБ RAM або більше із запасом (логи, медіа, кілька каналів). Інструменти Node і автоматизація браузера можуть бути вимогливими до ресурсів.

    ОС: використовуйте **Ubuntu LTS** (або будь-який сучасний Debian/Ubuntu). Шлях встановлення для Linux там протестовано найкраще.

    Документація: [Linux](/uk/platforms/linux), [VPS-хостинг](/uk/vps).

  </Accordion>

  <Accordion title="Чи можу я запускати OpenClaw у VM і які вимоги?">
    Так. Ставтеся до VM так само, як до VPS: вона має бути завжди ввімкненою, доступною і мати достатньо
    RAM для Gateway та всіх каналів, які ви вмикаєте.

    Базові рекомендації:

    - **Абсолютний мінімум:** 1 vCPU, 1 ГБ RAM.
    - **Рекомендовано:** 2 ГБ RAM або більше, якщо ви запускаєте кілька каналів, автоматизацію браузера чи медіаінструменти.
    - **ОС:** Ubuntu LTS або інший сучасний Debian/Ubuntu.

    Якщо ви працюєте у Windows, **WSL2 — найпростіше налаштування у стилі VM** і має найкращу
    сумісність інструментів. Див. [Windows](/uk/platforms/windows), [VPS-хостинг](/uk/vps).
    Якщо ви запускаєте macOS у VM, див. [macOS VM](/uk/install/macos-vm).

  </Accordion>
</AccordionGroup>

## Що таке OpenClaw?

<AccordionGroup>
  <Accordion title="Що таке OpenClaw, в одному абзаці?">
    OpenClaw — це персональний AI-помічник, який ви запускаєте на власних пристроях. Він відповідає в тих поверхнях обміну повідомленнями, якими ви вже користуєтеся (WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat і вбудовані channel plugin, як-от QQ Bot), а також може працювати з голосом + живим Canvas на підтримуваних платформах. **Gateway** — це постійно ввімкнена контрольна площина; помічник — це сам продукт.
  </Accordion>

  <Accordion title="Ціннісна пропозиція">
    OpenClaw — це не «просто обгортка для Claude». Це **локальна контрольна площина з пріоритетом локальності**, яка дає змогу запускати
    потужного помічника на **вашому власному обладнанні**, доступного з чат-застосунків, якими ви вже користуєтеся, з
    сесійним станом, пам’яттю та інструментами — без передачі контролю над вашими робочими процесами розміщеному
    SaaS.

    Основні переваги:

    - **Ваші пристрої, ваші дані:** запускайте Gateway де завгодно (Mac, Linux, VPS) і зберігайте
      workspace + історію сесій локально.
    - **Справжні канали, а не веб-пісочниця:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage тощо,
      а також мобільний голос і Canvas на підтримуваних платформах.
    - **Незалежність від моделі:** використовуйте Anthropic, OpenAI, MiniMax, OpenRouter тощо, з маршрутизацією
      і резервуванням на рівні агента.
    - **Варіант лише локально:** запускайте локальні моделі, щоб **усі дані могли залишатися на вашому пристрої**, якщо ви цього хочете.
    - **Маршрутизація кількох агентів:** окремі агенти для кожного каналу, облікового запису або завдання, кожен зі своїм
      workspace і параметрами за замовчуванням.
    - **Відкритий код і можливість змінювати:** перевіряйте, розширюйте й самостійно хостіть без vendor lock-in.

    Документація: [Gateway](/uk/gateway), [Канали](/uk/channels), [Кілька агентів](/uk/concepts/multi-agent),
    [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Я щойно все налаштував — що мені зробити спочатку?">
    Гарні перші проєкти:

    - Створити вебсайт (WordPress, Shopify або простий статичний сайт).
    - Прототипувати мобільний застосунок (структура, екрани, план API).
    - Організувати файли та папки (очищення, іменування, теги).
    - Підключити Gmail і автоматизувати зведення або подальші дії.

    Він може обробляти великі завдання, але найкраще працює, коли ви розбиваєте їх на етапи й
    використовуєте субагентів для паралельної роботи.

  </Accordion>

  <Accordion title="Які п’ять найпоширеніших щоденних сценаріїв використання OpenClaw?">
    Щоденні виграші зазвичай виглядають так:

    - **Персональні зведення:** підсумки вхідних повідомлень, календаря та новин, які вас цікавлять.
    - **Дослідження та чернетки:** швидкі дослідження, підсумки й перші чернетки листів або документів.
    - **Нагадування та подальші дії:** поштовхи й чеклісти на основі cron або Heartbeat.
    - **Автоматизація браузера:** заповнення форм, збирання даних і повторення вебзавдань.
    - **Координація між пристроями:** надішліть завдання з телефона, дозвольте Gateway виконати його на сервері та отримайте результат назад у чаті.

  </Accordion>

  <Accordion title="Чи може OpenClaw допомогти з lead gen, outreach, ads і blogs для SaaS?">
    Так — для **дослідження, кваліфікації та створення чернеток**. Він може сканувати сайти, складати короткі списки,
    підсумовувати потенційних клієнтів і писати чернетки outreach або рекламних текстів.

    Для **outreach або запуску реклами** тримайте людину в циклі. Уникайте спаму, дотримуйтесь місцевих законів і
    політик платформ та перевіряйте все перед надсиланням. Найбезпечніший шаблон — дозволити
    OpenClaw створити чернетку, а вам — затвердити її.

    Документація: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Які переваги порівняно з Claude Code для веброзробки?">
    OpenClaw — це **персональний помічник** і рівень координації, а не заміна IDE. Використовуйте
    Claude Code або Codex для найшвидшого прямого циклу кодування в репозиторії. Використовуйте OpenClaw, коли вам
    потрібні стійка пам’ять, доступ між пристроями та оркестрація інструментів.

    Переваги:

    - **Постійна пам’ять + workspace** між сесіями
    - **Доступ із кількох платформ** (WhatsApp, Telegram, TUI, WebChat)
    - **Оркестрація інструментів** (браузер, файли, планування, hooks)
    - **Постійно ввімкнений Gateway** (запуск на VPS, взаємодія звідусіль)
    - **Nodes** для локального браузера/екрана/камери/exec

    Вітрина: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills і автоматизація

<AccordionGroup>
  <Accordion title="Як налаштовувати Skills, не тримаючи репозиторій брудним?">
    Використовуйте керовані overrides замість редагування копії в репозиторії. Помістіть свої зміни в `~/.openclaw/skills/<name>/SKILL.md` (або додайте папку через `skills.load.extraDirs` у `~/.openclaw/openclaw.json`). Пріоритет такий: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`, тому керовані overrides все одно мають вищий пріоритет за вбудовані Skills без зміни git. Якщо вам потрібно встановити Skill глобально, але зробити його видимим лише для деяких агентів, тримайте спільну копію в `~/.openclaw/skills` і керуйте видимістю через `agents.defaults.skills` і `agents.list[].skills`. Лише зміни, варті включення в основний репозиторій, повинні жити в репозиторії й надсилатися як PR.
  </Accordion>

  <Accordion title="Чи можу я завантажувати Skills із власної папки?">
    Так. Додайте додаткові каталоги через `skills.load.extraDirs` у `~/.openclaw/openclaw.json` (найнижчий пріоритет). Типовий пріоритет: `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → вбудовані → `skills.load.extraDirs`. `clawhub` типово встановлює в `./skills`, що OpenClaw розглядає як `<workspace>/skills` у наступній сесії. Якщо Skill має бути видимим лише певним агентам, поєднуйте це з `agents.defaults.skills` або `agents.list[].skills`.
  </Accordion>

  <Accordion title="Як використовувати різні моделі для різних завдань?">
    Сьогодні підтримуються такі шаблони:

    - **Cron jobs**: ізольовані завдання можуть задавати override `model` для кожного завдання.
    - **Субагенти**: маршрутизуйте завдання до окремих агентів з різними моделями за замовчуванням.
    - **Перемикання на вимогу**: використовуйте `/model`, щоб у будь-який момент змінити модель поточної сесії.

    Див. [Cron jobs](/uk/automation/cron-jobs), [Маршрутизація кількох агентів](/uk/concepts/multi-agent) і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Бот зависає під час важкої роботи. Як винести це окремо?">
    Використовуйте **субагентів** для довгих або паралельних завдань. Субагенти працюють у власній сесії,
    повертають підсумок і зберігають основний чат чутливим до відповіді.

    Попросіть свого бота «spawn a sub-agent for this task» або використайте `/subagents`.
    Використовуйте `/status` у чаті, щоб бачити, що Gateway робить зараз (і чи він зайнятий).

    Порада щодо токенів: і довгі завдання, і субагенти витрачають токени. Якщо важлива вартість, задайте
    дешевшу модель для субагентів через `agents.defaults.subagents.model`.

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Як працюють сесії субагентів, прив’язані до гілки, у Discord?">
    Використовуйте прив’язки до гілок. Ви можете прив’язати гілку Discord до субагента або цілі сесії, щоб подальші повідомлення в цій гілці залишалися на цій прив’язаній сесії.

    Базовий процес:

    - Створіть через `sessions_spawn` з `thread: true` (і за потреби `mode: "session"` для постійших подальших повідомлень).
    - Або прив’яжіть вручну за допомогою `/focus <target>`.
    - Використовуйте `/agents`, щоб перевірити стан прив’язки.
    - Використовуйте `/session idle <duration|off>` і `/session max-age <duration|off>`, щоб керувати автоматичним зняттям фокусу.
    - Використовуйте `/unfocus`, щоб від’єднати гілку.

    Потрібна конфігурація:

    - Глобальні параметри за замовчуванням: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Overrides Discord: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - Автоприв’язка під час створення: установіть `channels.discord.threadBindings.spawnSubagentSessions: true`.

    Документація: [Sub-agents](/uk/tools/subagents), [Discord](/uk/channels/discord), [Configuration Reference](/uk/gateway/configuration-reference), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Субагент завершив роботу, але оновлення про завершення пішло не туди або взагалі не було опубліковане. Що перевірити?">
    Спочатку перевірте розв’язаний маршрут запитувача:

    - Доставка субагента в режимі завершення віддає перевагу будь-якій прив’язаній гілці або маршруту розмови, якщо такий існує.
    - Якщо джерело завершення містить лише канал, OpenClaw повертається до збереженого маршруту сесії запитувача (`lastChannel` / `lastTo` / `lastAccountId`), щоб пряма доставка все ще могла спрацювати.
    - Якщо немає ні прив’язаного маршруту, ні придатного збереженого маршруту, пряма доставка може завершитися невдачею, і результат замість негайної публікації в чаті переходить до доставки через чергу сесії.
    - Некоректні або застарілі цілі все одно можуть примусово спричинити перехід до черги або остаточну помилку доставки.
    - Якщо остання видима відповідь помічника дитини — це точний тихий токен `NO_REPLY` / `no_reply` або точно `ANNOUNCE_SKIP`, OpenClaw навмисно пригнічує анонс замість публікації застарілого попереднього прогресу.
    - Якщо дитина завершилася за тайм-аутом після самих лише викликів інструментів, анонс може згорнути це в короткий підсумок часткового прогресу замість відтворення сирого виводу інструментів.

    Налагодження:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Sub-agents](/uk/tools/subagents), [Фонові завдання](/uk/automation/tasks), [Інструменти сесії](/uk/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron або нагадування не спрацьовують. Що перевірити?">
    Cron виконується всередині процесу Gateway. Якщо Gateway не працює безперервно,
    заплановані завдання не виконуватимуться.

    Контрольний список:

    - Підтвердьте, що cron увімкнено (`cron.enabled`) і `OPENCLAW_SKIP_CRON` не встановлено.
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

    - `--no-deliver` / `delivery.mode: "none"` означає, що жодного зовнішнього повідомлення не очікується.
    - Відсутня або некоректна ціль анонсу (`channel` / `to`) означає, що runner пропустив вихідну доставку.
    - Помилки автентифікації каналу (`unauthorized`, `Forbidden`) означають, що runner намагався доставити, але облікові дані заблокували це.
    - Тихий ізольований результат (`NO_REPLY` / `no_reply` only) вважається навмисно недоставним, тому runner також пригнічує резервну доставку через чергу.

    Для ізольованих Cron jobs runner керує остаточною доставкою. Очікується, що агент
    поверне звичайний текстовий підсумок, який runner зможе надіслати. `--no-deliver` зберігає
    цей результат внутрішнім; він не дозволяє агенту натомість напряму надсилати через
    message tool.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Фонові завдання](/uk/automation/tasks).

  </Accordion>

  <Accordion title="Чому ізольований запуск cron перемкнув моделі або один раз повторився?">
    Зазвичай це шлях live-перемикання моделі, а не дубльоване планування.

    Ізольований cron може зберегти передачу моделі під час виконання і повторити спробу, коли активний
    запуск викидає `LiveSessionModelSwitchError`. Повторна спроба зберігає перемкненого
    провайдера/модель, а якщо перемикання несло новий override профілю автентифікації, cron
    також зберігає це перед повторною спробою.

    Пов’язані правила вибору:

    - Override моделі Gmail hook має найвищий пріоритет, коли застосовується.
    - Далі — `model` для кожного завдання.
    - Потім будь-який збережений override моделі сесії cron.
    - Потім звичайний вибір моделі агента/за замовчуванням.

    Цикл повторних спроб обмежений. Після початкової спроби плюс 2 повторних спроб перемикання
    cron припиняє роботу замість нескінченного циклу.

    Налагодження:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    Документація: [Cron jobs](/uk/automation/cron-jobs), [CLI cron](/cli/cron).

  </Accordion>

  <Accordion title="Як установити Skills на Linux?">
    Використовуйте нативні команди `openclaw skills` або поміщайте Skills у свій workspace. UI Skills для macOS недоступний на Linux.
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

    Нативний `openclaw skills install` записує в каталог `skills/`
    активного workspace. Окремий CLI `clawhub` встановлюйте лише якщо хочете публікувати або
    синхронізувати власні Skills. Для спільних встановлень між агентами помістіть Skill у
    `~/.openclaw/skills` і використовуйте `agents.defaults.skills` або
    `agents.list[].skills`, якщо хочете звузити перелік агентів, які можуть його бачити.

  </Accordion>

  <Accordion title="Чи може OpenClaw запускати завдання за розкладом або безперервно у фоновому режимі?">
    Так. Використовуйте планувальник Gateway:

    - **Cron jobs** для запланованих або повторюваних завдань (зберігаються після перезапусків).
    - **Heartbeat** для періодичних перевірок «основної сесії».
    - **Ізольовані завдання** для автономних агентів, які публікують підсумки або доставляють їх у чати.

    Документація: [Cron jobs](/uk/automation/cron-jobs), [Автоматизація та завдання](/uk/automation),
    [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Чи можу я запускати навички Apple лише для macOS з Linux?">
    Не напряму. Навички macOS фільтруються через `metadata.openclaw.os` плюс обов’язкові бінарники, і навички з’являються в системному prompt лише тоді, коли вони придатні на **хості Gateway**. На Linux навички лише для `darwin` (як-от `apple-notes`, `apple-reminders`, `things-mac`) не завантажаться, якщо ви не перевизначите це обмеження.

    Є три підтримувані шаблони:

    **Варіант A — запускати Gateway на Mac (найпростіше).**
    Запускайте Gateway там, де існують бінарники macOS, а потім підключайтеся з Linux у [віддаленому режимі](#gateway-ports-already-running-and-remote-mode) або через Tailscale. Навички завантажаться нормально, тому що хост Gateway — це macOS.

    **Варіант B — використовувати macOS Node (без SSH).**
    Запустіть Gateway на Linux, під’єднайте macOS Node (menubar app) і встановіть **Node Run Commands** на «Always Ask» або «Always Allow» на Mac. OpenClaw може вважати навички лише для macOS придатними, коли потрібні бінарники існують на Node. Агент запускає ці навички через інструмент `nodes`. Якщо ви виберете «Always Ask», підтвердження «Always Allow» у запиті додає цю команду до allowlist.

    **Варіант C — проксувати бінарники macOS через SSH (просунутий).**
    Залиште Gateway на Linux, але зробіть так, щоб потрібні CLI-бінарники розв’язувалися у wrapper-и SSH, які запускаються на Mac. Потім перевизначте навичку так, щоб дозволити Linux і вона залишалася придатною.

    1. Створіть wrapper SSH для бінарника (приклад: `memo` для Apple Notes):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Додайте wrapper у `PATH` на хості Linux (наприклад `~/bin/memo`).
    3. Перевизначте метадані навички (workspace або `~/.openclaw/skills`), щоб дозволити Linux:

       ```markdown
       ---
       name: apple-notes
       description: Керування Apple Notes через CLI memo на macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Почніть нову сесію, щоб знімок Skills оновився.

  </Accordion>

  <Accordion title="Чи маєте ви інтеграцію з Notion або HeyGen?">
    Сьогодні вбудованої немає.

    Варіанти:

    - **Користувацький Skill / Plugin:** найкраще для надійного доступу до API (і Notion, і HeyGen мають API).
    - **Автоматизація браузера:** працює без коду, але повільніше й крихкіше.

    Якщо ви хочете зберігати контекст для кожного клієнта (агентські робочі процеси), простий шаблон такий:

    - Одна сторінка Notion на клієнта (контекст + налаштування + активна робота).
    - Попросіть агента отримувати цю сторінку на початку сесії.

    Якщо вам потрібна нативна інтеграція, створіть feature request або реалізуйте Skill,
    орієнтований на ці API.

    Установлення Skills:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні встановлення потрапляють у каталог `skills/` активного workspace. Для спільних Skills між агентами розміщуйте їх у `~/.openclaw/skills/<name>/SKILL.md`. Якщо спільне встановлення мають бачити лише деякі агенти, налаштуйте `agents.defaults.skills` або `agents.list[].skills`. Деякі Skills очікують бінарники, встановлені через Homebrew; на Linux це означає Linuxbrew (див. запис FAQ про Homebrew на Linux вище). Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і [ClawHub](/uk/tools/clawhub).

  </Accordion>

  <Accordion title="Як використовувати свій уже залогінений Chrome з OpenClaw?">
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

    Цей шлях може використовувати браузер локального хоста або підключений browser Node. Якщо Gateway працює деінде, або запускайте хост Node на машині з браузером, або використовуйте віддалений CDP.

    Поточні обмеження для `existing-session` / `user`:

    - дії базуються на ref, а не на CSS-селекторах
    - завантаження файлів вимагає `ref` / `inputRef` і зараз підтримує лише один файл за раз
    - `responsebody`, експорт у PDF, перехоплення завантажень і пакетні дії все ще потребують керованого браузера або сирого профілю CDP

  </Accordion>
</AccordionGroup>

## Ізоляція та пам’ять

<AccordionGroup>
  <Accordion title="Чи є окремий документ про ізоляцію?">
    Так. Див. [Ізоляція](/uk/gateway/sandboxing). Для налаштування, специфічного для Docker (повний gateway у Docker або образи ізоляції), див. [Docker](/uk/install/docker).
  </Accordion>

  <Accordion title="Docker здається обмеженим — як увімкнути повні можливості?">
    Типовий образ орієнтований насамперед на безпеку й працює від імені користувача `node`, тому він не
    містить системних пакетів, Homebrew або вбудованих браузерів. Для повнішого налаштування:

    - Зберігайте `/home/node` через `OPENCLAW_HOME_VOLUME`, щоб кеші переживали перезапуски.
    - Додавайте системні залежності до образу через `OPENCLAW_DOCKER_APT_PACKAGES`.
    - Установлюйте браузери Playwright через вбудований CLI:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - Установіть `PLAYWRIGHT_BROWSERS_PATH` і переконайтеся, що цей шлях зберігається.

    Документація: [Docker](/uk/install/docker), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи можу я зберегти приватність DM, але зробити групи публічними/ізольованими з одним агентом?">
    Так — якщо ваш приватний трафік — це **DM**, а публічний трафік — це **групи**.

    Використовуйте `agents.defaults.sandbox.mode: "non-main"`, щоб сесії груп/каналів (ключі не-main) працювали у налаштованому backend ізоляції, тоді як основна DM-сесія залишалася на хості. Якщо ви не вибрали backend, Docker буде типовим. Потім обмежте інструменти, доступні в ізольованих сесіях, через `tools.sandbox.tools`.

    Покрокове налаштування + приклад конфігурації: [Групи: приватні DM + публічні групи](/uk/channels/groups#pattern-personal-dms-public-groups-single-agent)

    Довідка з ключової конфігурації: [Конфігурація Gateway](/uk/gateway/configuration-reference#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="Як прив’язати папку хоста до ізоляції?">
    Установіть `agents.defaults.sandbox.docker.binds` у `["host:path:mode"]` (наприклад, `"/home/user/src:/src:ro"`). Глобальні прив’язки та прив’язки для конкретного агента об’єднуються; прив’язки для конкретного агента ігноруються, коли `scope: "shared"`. Використовуйте `:ro` для будь-чого чутливого та пам’ятайте, що прив’язки обходять файлові стіни ізоляції.

    OpenClaw перевіряє джерела bind і за нормалізованим шляхом, і за канонічним шляхом, розв’язаним через найглибшого наявного предка. Це означає, що виходи через батьківські symlink все одно блокуються за принципом fail closed, навіть коли останній сегмент шляху ще не існує, а перевірки дозволених коренів і далі застосовуються після розв’язання symlink.

    Приклади та примітки з безпеки див. у [Ізоляція](/uk/gateway/sandboxing#custom-bind-mounts) і [Ізоляція vs політика інструментів vs elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check).

  </Accordion>

  <Accordion title="Як працює пам’ять?">
    Пам’ять OpenClaw — це просто Markdown-файли в workspace агента:

    - Щоденні нотатки в `memory/YYYY-MM-DD.md`
    - Відібрані довгострокові нотатки в `MEMORY.md` (лише для main/private sessions)

    OpenClaw також виконує **тихий злив пам’яті перед Compaction**, щоб нагадати моделі
    записати довговічні нотатки перед автоматичною Compaction. Це виконується лише тоді, коли workspace
    доступний для запису (sandbox-и лише для читання пропускають це). Див. [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Пам’ять постійно забуває речі. Як зробити, щоб це закріпилося?">
    Попросіть бота **записати факт у пам’ять**. Довгострокові нотатки мають зберігатися в `MEMORY.md`,
    короткостроковий контекст — у `memory/YYYY-MM-DD.md`.

    Це все ще область, яку ми покращуємо. Корисно нагадувати моделі зберігати спогади;
    вона знатиме, що робити. Якщо вона продовжує забувати, перевірте, що Gateway використовує той самий
    workspace під час кожного запуску.

    Документація: [Пам’ять](/uk/concepts/memory), [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Чи зберігається пам’ять назавжди? Які є обмеження?">
    Файли пам’яті зберігаються на диску й існують, доки ви їх не видалите. Обмеженням є ваш
    обсяг сховища, а не модель. **Контекст сесії** все ще обмежений вікном контексту
    моделі, тому довгі розмови можуть стискатися або обрізатися. Саме тому
    існує semantic memory search — він повертає в контекст лише релевантні частини.

    Документація: [Пам’ять](/uk/concepts/memory), [Контекст](/uk/concepts/context).

  </Accordion>

  <Accordion title="Чи потрібен OpenAI API key для semantic memory search?">
    Лише якщо ви використовуєте **OpenAI embeddings**. Codex OAuth покриває chat/completions і
    **не** надає доступу до embeddings, тож **вхід через Codex (OAuth або
    логін Codex CLI)** не допомагає для semantic memory search. Для OpenAI embeddings
    як і раніше потрібен справжній API key (`OPENAI_API_KEY` або `models.providers.openai.apiKey`).

    Якщо ви явно не задаєте провайдера, OpenClaw автоматично вибирає провайдера, коли
    може розв’язати API key (профілі автентифікації, `models.providers.*.apiKey` або змінні середовища).
    Він віддає перевагу OpenAI, якщо розв’язується ключ OpenAI, інакше Gemini, якщо розв’язується ключ Gemini,
    потім Voyage, потім Mistral. Якщо жоден віддалений ключ недоступний, memory
    search залишається вимкненим, доки ви його не налаштуєте. Якщо у вас налаштований і наявний шлях
    до локальної моделі, OpenClaw
    віддає перевагу `local`. Ollama підтримується, коли ви явно встановлюєте
    `memorySearch.provider = "ollama"`.

    Якщо ви волієте залишатися локальними, установіть `memorySearch.provider = "local"` (і за потреби
    `memorySearch.fallback = "none"`). Якщо вам потрібні embeddings Gemini, установіть
    `memorySearch.provider = "gemini"` і надайте `GEMINI_API_KEY` (або
    `memorySearch.remote.apiKey`). Ми підтримуємо моделі embeddings **OpenAI, Gemini, Voyage, Mistral, Ollama або local** —
    докладні інструкції з налаштування див. у [Пам’ять](/uk/concepts/memory).

  </Accordion>
</AccordionGroup>

## Де що зберігається на диску

<AccordionGroup>
  <Accordion title="Чи всі дані, що використовуються з OpenClaw, зберігаються локально?">
    Ні — **стан OpenClaw локальний**, але **зовнішні сервіси все одно бачать те, що ви їм надсилаєте**.

    - **Локально за замовчуванням:** сесії, файли пам’яті, конфігурація та workspace живуть на хості Gateway
      (`~/.openclaw` + каталог вашого workspace).
    - **Віддалено за необхідністю:** повідомлення, які ви надсилаєте провайдерам моделей (Anthropic/OpenAI тощо), ідуть до
      їхніх API, а чат-платформи (WhatsApp/Telegram/Slack тощо) зберігають дані повідомлень на
      своїх серверах.
    - **Ви контролюєте поверхню:** використання локальних моделей зберігає prompt-и на вашій машині, але трафік
      каналів усе одно проходить через сервери відповідного каналу.

    Пов’язано: [Workspace агента](/uk/concepts/agent-workspace), [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Де OpenClaw зберігає свої дані?">
    Усе зберігається в `$OPENCLAW_STATE_DIR` (типово: `~/.openclaw`):

    | Path                                                            | Призначення                                                         |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | Основна конфігурація (JSON5)                                       |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | Застарілий імпорт OAuth (копіюється в профілі автентифікації під час першого використання) |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Профілі автентифікації (OAuth, API keys та необов’язкові `keyRef`/`tokenRef`) |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | Необов’язкове файлове секретне навантаження для провайдерів SecretRef типу `file` |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | Файл застарілої сумісності (статичні записи `api_key` очищаються) |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Стан провайдера (наприклад, `whatsapp/<accountId>/creds.json`)    |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | Стан для кожного агента (agentDir + sessions)                     |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | Історія розмов і стан (для кожного агента)                        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | Метадані сесій (для кожного агента)                               |

    Застарілий шлях для одного агента: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`).

    Ваш **workspace** (`AGENTS.md`, файли пам’яті, Skills тощо) відокремлений і налаштовується через `agents.defaults.workspace` (типово: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="Де мають зберігатися AGENTS.md / SOUL.md / USER.md / MEMORY.md?">
    Ці файли мають зберігатися у **workspace агента**, а не в `~/.openclaw`.

    - **Workspace (для кожного агента)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md` (або застарілий резервний варіант `memory.md`, коли `MEMORY.md` відсутній),
      `memory/YYYY-MM-DD.md`, необов’язковий `HEARTBEAT.md`.
    - **State dir (`~/.openclaw`)**: конфігурація, стан каналу/провайдера, профілі автентифікації, сесії, логи
      і спільні Skills (`~/.openclaw/skills`).

    Типовий workspace — `~/.openclaw/workspace`, налаштовується через:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    Якщо бот «забуває» після перезапуску, переконайтеся, що Gateway використовує той самий
    workspace під час кожного запуску (і пам’ятайте: віддалений режим використовує **workspace хоста gateway**,
    а не вашого локального ноутбука).

    Порада: якщо ви хочете зберегти поведінку чи вподобання надовго, попросіть бота **записати це в
    AGENTS.md або MEMORY.md**, а не покладатися на історію чату.

    Див. [Workspace агента](/uk/concepts/agent-workspace) і [Пам’ять](/uk/concepts/memory).

  </Accordion>

  <Accordion title="Рекомендована стратегія резервного копіювання">
    Помістіть свій **workspace агента** у **приватний** git-репозиторій і робіть його резервну копію десь
    приватно (наприклад, у приватному GitHub). Це збереже пам’ять + файли AGENTS/SOUL/USER
    і дасть змогу пізніше відновити «розум» помічника.

    **Не** комітьте нічого з `~/.openclaw` (облікові дані, сесії, токени або зашифровані секретні payload-и).
    Якщо вам потрібно повне відновлення, робіть резервні копії і workspace, і state directory
    окремо (див. питання про міграцію вище).

    Документація: [Workspace агента](/uk/concepts/agent-workspace).

  </Accordion>

  <Accordion title="Як повністю видалити OpenClaw?">
    Див. окрему інструкцію: [Видалення](/uk/install/uninstall).
  </Accordion>

  <Accordion title="Чи можуть агенти працювати поза workspace?">
    Так. Workspace — це **cwd за замовчуванням** і якір пам’яті, а не жорсткий sandbox.
    Відносні шляхи розв’язуються всередині workspace, але абсолютні шляхи можуть звертатися до інших
    місць хоста, якщо ізоляцію не ввімкнено. Якщо вам потрібна ізоляція, використовуйте
    [`agents.defaults.sandbox`](/uk/gateway/sandboxing) або налаштування sandbox для конкретного агента. Якщо ви
    хочете, щоб репозиторій був робочим каталогом за замовчуванням, вкажіть для цього агента
    `workspace` на корінь репозиторію. Репозиторій OpenClaw — це лише вихідний код; тримайте
    workspace окремо, якщо тільки ви навмисно не хочете, щоб агент працював усередині нього.

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

  <Accordion title="Віддалений режим: де зберігається session store?">
    Стан сесій належить **хосту gateway**. Якщо ви у віддаленому режимі, потрібний вам session store розташований на віддаленій машині, а не на локальному ноутбуці. Див. [Керування сесіями](/uk/concepts/session).
  </Accordion>
</AccordionGroup>

## Основи конфігурації

<AccordionGroup>
  <Accordion title="Який формат у конфігурації? Де вона зберігається?">
    OpenClaw читає необов’язкову конфігурацію **JSON5** з `$OPENCLAW_CONFIG_PATH` (типово: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    Якщо файл відсутній, використовуються відносно безпечні значення за замовчуванням (зокрема workspace за замовчуванням `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title='Я встановив gateway.bind: "lan" (або "tailnet"), і тепер нічого не слухає / UI каже unauthorized'>
    Bind-и не на loopback **вимагають коректного шляху автентифікації gateway**. На практиці це означає:

    - автентифікація спільним секретом: токен або пароль
    - `gateway.auth.mode: "trusted-proxy"` за правильно налаштованим reverse proxy з урахуванням ідентичності без loopback

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
    - Локальні шляхи виклику можуть використовувати `gateway.remote.*` як резервний варіант лише тоді, коли `gateway.auth.*` не задано.
    - Для автентифікації за паролем натомість установіть `gateway.auth.mode: "password"` разом із `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
    - Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через SecretRef і не розв’язується, розв’язання завершується fail closed (без маскування резервним remote-варіантом).
    - Конфігурації Control UI зі спільним секретом автентифікуються через `connect.params.auth.token` або `connect.params.auth.password` (зберігаються в налаштуваннях app/UI). Режими з ідентичністю, як-от Tailscale Serve або `trusted-proxy`, натомість використовують заголовки запитів. Уникайте розміщення спільних секретів в URL.
    - З `gateway.auth.mode: "trusted-proxy"` reverse proxy loopback на тому самому хості все одно **не** задовольняють автентифікацію trusted-proxy. Trusted proxy має бути налаштованим джерелом без loopback.

  </Accordion>

  <Accordion title="Чому тепер на localhost мені потрібен токен?">
    OpenClaw типово примусово вимагає автентифікацію gateway, зокрема й для loopback. У звичайному типовому сценарії це означає автентифікацію токеном: якщо явний шлях автентифікації не налаштовано, під час запуску gateway визначається режим токена і токен генерується автоматично, зберігаючись у `gateway.auth.token`, тож **локальні WS-клієнти мають проходити автентифікацію**. Це блокує іншим локальним процесам виклики до Gateway.

    Якщо ви віддаєте перевагу іншому шляху автентифікації, можете явно вибрати режим пароля (або, для reverse proxy без loopback з урахуванням ідентичності, `trusted-proxy`). Якщо ви **справді** хочете відкритий loopback, явно встановіть у конфігурації `gateway.auth.mode: "none"`. Doctor може згенерувати токен у будь-який час: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="Чи потрібно перезапускати після зміни конфігурації?">
    Gateway стежить за конфігурацією і підтримує hot reload:

    - `gateway.reload.mode: "hybrid"` (типово): безпечно застосовує зміни на гарячу, для критичних робить перезапуск
    - також підтримуються `hot`, `restart`, `off`

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

    - `off`: приховує текст слогана, але залишає рядок заголовка/версії банера.
    - `default`: щоразу використовує `All your chats, one OpenClaw.`.
    - `random`: ротаційні кумедні/сезонні слогани (поведінка за замовчуванням).
    - Якщо ви взагалі не хочете банер, установіть змінну середовища `OPENCLAW_HIDE_BANNER=1`.

  </Accordion>

  <Accordion title="Як увімкнути web search (і web fetch)?">
    `web_fetch` працює без API key. `web_search` залежить від вибраного
    провайдера:

    - Провайдери на основі API, як-от Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity і Tavily, потребують звичайного налаштування API key.
    - Ollama Web Search не потребує ключа, але використовує налаштований хост Ollama і вимагає `ollama signin`.
    - DuckDuckGo не потребує ключа, але це неофіційна інтеграція на основі HTML.
    - SearXNG не потребує ключа/може бути self-hosted; налаштуйте `SEARXNG_BASE_URL` або `plugins.entries.searxng.config.webSearch.baseUrl`.

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

    Специфічна для провайдера конфігурація web search тепер живе під `plugins.entries.<plugin>.config.webSearch.*`.
    Застарілі шляхи провайдера `tools.web.search.*` ще тимчасово завантажуються для сумісності, але не повинні використовуватися в нових конфігураціях.
    Конфігурація резервного web fetch для Firecrawl живе під `plugins.entries.firecrawl.config.webFetch.*`.

    Примітки:

    - Якщо ви використовуєте allowlist-и, додайте `web_search`/`web_fetch`/`x_search` або `group:web`.
    - `web_fetch` типово увімкнено (якщо його явно не вимкнено).
    - Якщо `tools.web.fetch.provider` не вказано, OpenClaw автоматично визначає першого готового резервного fetch-провайдера серед доступних облікових даних. Наразі вбудований провайдер — Firecrawl.
    - Демони читають змінні середовища з `~/.openclaw/.env` (або із середовища сервісу).

    Документація: [Веб-інструменти](/uk/tools/web).

  </Accordion>

  <Accordion title="config.apply стер мою конфігурацію. Як відновитися і як цього уникнути?">
    `config.apply` замінює **всю конфігурацію**. Якщо ви надсилаєте частковий об’єкт, усе
    інше буде видалено.

    Поточний OpenClaw захищає від багатьох випадкових затирань:

    - Записи конфігурації, якими керує OpenClaw, перевіряють повну конфігурацію після зміни перед записом.
    - Некоректні або руйнівні записи, якими керує OpenClaw, відхиляються і зберігаються як `openclaw.json.rejected.*`.
    - Якщо пряме редагування ламає запуск або hot reload, Gateway відновлює останню відому робочу конфігурацію і зберігає відхилений файл як `openclaw.json.clobbered.*`.
    - Після відновлення головний агент отримує попередження під час запуску, щоб не записати погану конфігурацію знову навмання.

    Відновлення:

    - Перевірте `openclaw logs --follow` на наявність `Config auto-restored from last-known-good`, `Config write rejected:` або `config reload restored last-known-good config`.
    - Перегляньте найновіший `openclaw.json.clobbered.*` або `openclaw.json.rejected.*` поруч з активною конфігурацією.
    - Якщо відновлена активна конфігурація працює, залиште її, а потім поверніть лише потрібні ключі через `openclaw config set` або `config.patch`.
    - Запустіть `openclaw config validate` і `openclaw doctor`.
    - Якщо у вас немає ані останньої відомої робочої конфігурації, ані відхиленого payload, відновіть із резервної копії або знову запустіть `openclaw doctor` і повторно налаштуйте канали/моделі.
    - Якщо це було неочікувано, створіть bug report і додайте свою останню відому конфігурацію або будь-яку резервну копію.
    - Локальний coding agent часто може відновити працездатну конфігурацію з логів або історії.

    Як уникнути:

    - Використовуйте `openclaw config set` для невеликих змін.
    - Використовуйте `openclaw configure` для інтерактивного редагування.
    - Спочатку використовуйте `config.schema.lookup`, коли ви не впевнені в точному шляху чи формі поля; він повертає поверхневий вузол схеми плюс зведення безпосередніх дочірніх елементів для подальшого заглиблення.
    - Використовуйте `config.patch` для часткових RPC-редагувань; залишайте `config.apply` лише для повної заміни конфігурації.
    - Якщо ви використовуєте доступний лише власнику інструмент `gateway` із запуску агента, він усе одно відхилятиме записи до `tools.exec.ask` / `tools.exec.security` (включно із застарілими псевдонімами `tools.bash.*`, які нормалізуються до тих самих захищених шляхів exec).

    Документація: [Конфігурація](/cli/config), [Налаштування](/cli/configure), [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Як запустити центральний Gateway зі спеціалізованими воркерами на різних пристроях?">
    Поширений шаблон — **один Gateway** (наприклад, Raspberry Pi) плюс **nodes** і **agents**:

    - **Gateway (центральний):** володіє каналами (Signal/WhatsApp), маршрутизацією та сесіями.
    - **Nodes (пристрої):** Mac/iOS/Android підключаються як периферія і надають локальні інструменти (`system.run`, `canvas`, `camera`).
    - **Agents (воркери):** окремі «мізки»/workspace для спеціальних ролей (наприклад, «Hetzner ops», «Personal data»).
    - **Субагенти:** запускають фонову роботу з головного агента, коли вам потрібен паралелізм.
    - **TUI:** підключайтеся до Gateway і перемикайте агентів/сесії.

    Документація: [Nodes](/uk/nodes), [Віддалений доступ](/uk/gateway/remote), [Маршрутизація кількох агентів](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [TUI](/web/tui).

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

    Типове значення — `false` (headful). Headless з більшою ймовірністю запускає anti-bot перевірки на деяких сайтах. Див. [Браузер](/uk/tools/browser).

    Headless використовує **той самий рушій Chromium** і працює для більшості сценаріїв автоматизації (форми, кліки, скрейпінг, логіни). Основні відмінності:

    - Немає видимого вікна браузера (використовуйте знімки екрана, якщо вам потрібна візуалізація).
    - Деякі сайти суворіше ставляться до автоматизації в headless-режимі (CAPTCHA, anti-bot).
      Наприклад, X/Twitter часто блокує headless-сесії.

  </Accordion>

  <Accordion title="Як використовувати Brave для керування браузером?">
    Установіть `browser.executablePath` на свій бінарник Brave (або будь-який інший браузер на основі Chromium) і перезапустіть Gateway.
    Повні приклади конфігурації див. у [Браузер](/uk/tools/browser#use-brave-or-another-chromium-based-browser).
  </Accordion>
</AccordionGroup>

## Віддалені gateway і nodes

<AccordionGroup>
  <Accordion title="Як команди передаються між Telegram, gateway і nodes?">
    Повідомлення Telegram обробляються **gateway**. Gateway запускає агента і
    лише потім викликає nodes через **Gateway WebSocket**, коли потрібен інструмент node:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes не бачать вхідний трафік провайдера; вони отримують лише RPC-виклики node.

  </Accordion>

  <Accordion title="Як мій агент може отримати доступ до мого комп’ютера, якщо Gateway розміщено віддалено?">
    Коротка відповідь: **під’єднайте свій комп’ютер як Node**. Gateway працює деінде, але він може
    викликати інструменти `node.*` (екран, камера, система) на вашій локальній машині через Gateway WebSocket.

    Типове налаштування:

    1. Запустіть Gateway на хості, що завжди ввімкнений (VPS/домашній сервер).
    2. Додайте хост Gateway + свій комп’ютер до однієї tailnet.
    3. Переконайтеся, що Gateway WS доступний (bind до tailnet або SSH-тунель).
    4. Відкрийте застосунок macOS локально і підключіться в режимі **Remote over SSH** (або напряму через tailnet),
       щоб він міг зареєструватися як Node.
    5. Схваліть Node на Gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Окремий TCP-міст не потрібен; nodes підключаються через Gateway WebSocket.

    Нагадування про безпеку: спарювання macOS Node дозволяє `system.run` на цій машині. Під’єднуйте
    лише пристрої, яким довіряєте, і перечитайте [Безпека](/uk/gateway/security).

    Документація: [Nodes](/uk/nodes), [Протокол Gateway](/uk/gateway/protocol), [Віддалений режим macOS](/uk/platforms/mac/remote), [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Tailscale підключено, але я не отримую відповідей. Що тепер?">
    Перевірте основи:

    - Gateway працює: `openclaw gateway status`
    - Стан Gateway: `openclaw status`
    - Стан каналів: `openclaw channels status`

    Потім перевірте автентифікацію та маршрутизацію:

    - Якщо ви використовуєте Tailscale Serve, переконайтеся, що `gateway.auth.allowTailscale` налаштовано правильно.
    - Якщо ви підключаєтеся через SSH-тунель, переконайтеся, що локальний тунель активний і вказує на правильний порт.
    - Переконайтеся, що ваші allowlist-и (DM або група) містять ваш обліковий запис.

    Документація: [Tailscale](/uk/gateway/tailscale), [Віддалений доступ](/uk/gateway/remote), [Канали](/uk/channels).

  </Accordion>

  <Accordion title="Чи можуть два екземпляри OpenClaw взаємодіяти один з одним (локальний + VPS)?">
    Так. Вбудованого мосту «бот-до-бота» немає, але це можна організувати кількома
    надійними способами:

    **Найпростіше:** використовуйте звичайний канал чату, до якого мають доступ обидва боти (Telegram/Slack/WhatsApp).
    Нехай Bot A надсилає повідомлення Bot B, а потім Bot B відповідає як зазвичай.

    **Міст через CLI (загальний):** запустіть скрипт, який викликає інший Gateway через
    `openclaw agent --message ... --deliver`, націливши на чат, де слухає інший бот.
    Якщо один бот працює на віддаленому VPS, спрямуйте свій CLI на цей віддалений Gateway
    через SSH/Tailscale (див. [Віддалений доступ](/uk/gateway/remote)).

    Приклад шаблону (запускається з машини, яка може дістатися цільового Gateway):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    Порада: додайте захисне правило, щоб два боти не зациклитися безкінечно (лише згадки, channel
    allowlist-и або правило «не відповідати на повідомлення ботів»).

    Документація: [Віддалений доступ](/uk/gateway/remote), [CLI Agent](/cli/agent), [Надсилання Agent](/uk/tools/agent-send).

  </Accordion>

  <Accordion title="Чи потрібні окремі VPS для кількох агентів?">
    Ні. Один Gateway може хостити кількох агентів, кожен зі своїм workspace, типовими моделями
    і маршрутизацією. Це звичайне налаштування, і воно набагато дешевше й простіше, ніж запускати
    один VPS на агента.

    Використовуйте окремі VPS лише тоді, коли вам потрібна жорстка ізоляція (межі безпеки) або дуже
    різні конфігурації, які ви не хочете спільно використовувати. В іншому разі залишайте один Gateway і
    використовуйте кількох агентів або субагентів.

  </Accordion>

  <Accordion title="Чи є перевага у використанні Node на моєму особистому ноутбуці замість SSH із VPS?">
    Так — nodes є першокласним способом доступу до вашого ноутбука з віддаленого Gateway, і вони
    дають більше, ніж просто доступ до оболонки. Gateway працює на macOS/Linux (Windows через WSL2) і є
    легким (достатньо невеликого VPS або пристрою класу Raspberry Pi; 4 ГБ RAM більш ніж достатньо), тож поширена
    конфігурація — це постійно ввімкнений хост плюс ваш ноутбук як Node.

    - **Не потрібен вхідний SSH.** Nodes самі підключаються до Gateway WebSocket і використовують спарювання пристроїв.
    - **Безпечніший контроль виконання.** `system.run` на цьому ноутбуці обмежується allowlist-ами/підтвердженнями Node.
    - **Більше інструментів пристрою.** Nodes надають `canvas`, `camera` і `screen` на додачу до `system.run`.
    - **Локальна автоматизація браузера.** Тримайте Gateway на VPS, але запускайте Chrome локально через хост Node на ноутбуці або підключайтеся до локального Chrome на хості через Chrome MCP.

    SSH підходить для епізодичного доступу до оболонки, але nodes простіші для постійних агентських робочих процесів і
    автоматизації пристрою.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes), [Браузер](/uk/tools/browser).

  </Accordion>

  <Accordion title="Чи запускають nodes сервіс gateway?">
    Ні. На одному хості має працювати лише **один gateway**, якщо тільки ви навмисно не запускаєте ізольовані профілі (див. [Кілька gateway](/uk/gateway/multiple-gateways)). Nodes — це периферійні пристрої, які підключаються
    до gateway (nodes iOS/Android або «режим node» macOS у menubar app). Для headless-хостів node
    і керування через CLI див. [CLI хоста Node](/cli/node).

    Повний перезапуск потрібен для змін `gateway`, `discovery` і `canvasHost`.

  </Accordion>

  <Accordion title="Чи є API / RPC-спосіб застосувати конфігурацію?">
    Так.

    - `config.schema.lookup`: переглянути одне піддерево конфігурації з його поверхневим вузлом схеми, підібраною UI-підказкою та зведеннями безпосередніх дочірніх елементів перед записом
    - `config.get`: отримати поточний знімок + хеш
    - `config.patch`: безпечне часткове оновлення (рекомендовано для більшості RPC-редагувань); виконує hot reload, коли це можливо, і перезапускає, коли потрібно
    - `config.apply`: перевірити й замінити повну конфігурацію; виконує hot reload, коли це можливо, і перезапускає, коли потрібно
    - Доступний лише власнику runtime-інструмент `gateway` усе ще відмовляється переписувати `tools.exec.ask` / `tools.exec.security`; застарілі псевдоніми `tools.bash.*` нормалізуються до тих самих захищених шляхів exec

  </Accordion>

  <Accordion title="Мінімальна розумна конфігурація для першого встановлення">
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

    1. **Установіть + увійдіть на VPS**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Установіть + увійдіть на Mac**
       - Використайте застосунок Tailscale і ввійдіть у ту саму tailnet.
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

  <Accordion title="Як підключити Mac Node до віддаленого Gateway (Tailscale Serve)?">
    Serve відкриває **Gateway Control UI + WS**. Nodes підключаються через той самий endpoint Gateway WS.

    Рекомендована конфігурація:

    1. **Переконайтеся, що VPS і Mac знаходяться в одній tailnet**.
    2. **Використовуйте застосунок macOS у віддаленому режимі** (ціллю SSH може бути ім’я хоста tailnet).
       Застосунок протунелює порт Gateway і підключиться як Node.
    3. **Схваліть Node** на gateway:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    Документація: [Протокол Gateway](/uk/gateway/protocol), [Discovery](/uk/gateway/discovery), [Віддалений режим macOS](/uk/platforms/mac/remote).

  </Accordion>

  <Accordion title="Чи варто встановлювати на другий ноутбук чи просто додати Node?">
    Якщо вам потрібні лише **локальні інструменти** (`screen`/`camera`/`exec`) на другому ноутбуці, додайте його як
    **Node**. Це зберігає єдиний Gateway і дозволяє уникнути дублювання конфігурації. Локальні інструменти Node
    наразі доступні лише на macOS, але ми плануємо поширити їх і на інші ОС.

    Установлюйте другий Gateway лише тоді, коли вам потрібна **жорстка ізоляція** або два повністю окремі боти.

    Документація: [Nodes](/uk/nodes), [CLI Nodes](/cli/nodes), [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Змінні середовища та завантаження .env

<AccordionGroup>
  <Accordion title="Як OpenClaw завантажує змінні середовища?">
    OpenClaw читає змінні середовища з батьківського процесу (shell, launchd/systemd, CI тощо) і додатково завантажує:

    - `.env` з поточного робочого каталогу
    - глобальний резервний `.env` з `~/.openclaw/.env` (тобто `$OPENCLAW_STATE_DIR/.env`)

    Жоден із `.env`-файлів не перевизначає вже наявні змінні середовища.

    Ви також можете визначати вбудовані змінні середовища в конфігурації (застосовуються лише якщо вони відсутні в process env):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    Повний пріоритет і джерела див. у [/environment](/uk/help/environment).

  </Accordion>

  <Accordion title="Я запустив Gateway через сервіс, і мої змінні середовища зникли. Що тепер?">
    Є два поширені виправлення:

    1. Помістіть відсутні ключі в `~/.openclaw/.env`, щоб вони підхоплювалися, навіть коли сервіс не успадковує env вашого shell.
    2. Увімкніть імпорт shell (опціональна зручність):

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

    Це запускає ваш login shell та імпортує лише відсутні очікувані ключі (ніколи не перевизначає). Еквіваленти змінних середовища:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='Я встановив COPILOT_GITHUB_TOKEN, але models status показує "Shell env: off." Чому?'>
    `openclaw models status` повідомляє, чи увімкнено **імпорт shell env**. «Shell env: off»
    **не** означає, що ваших змінних середовища немає — це лише означає, що OpenClaw не завантажуватиме
    ваш login shell автоматично.

    Якщо Gateway працює як сервіс (launchd/systemd), він не успадковує середовище
    вашого shell. Виправити це можна одним зі способів:

    1. Помістіть токен у `~/.openclaw/.env`:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. Або увімкніть імпорт shell (`env.shellEnv.enabled: true`).
    3. Або додайте його в блок `env` конфігурації (застосовується лише якщо відсутній).

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

  <Accordion title="Чи сесії скидаються автоматично, якщо я ніколи не надсилаю /new?">
    Термін дії сесій може завершуватися після `session.idleMinutes`, але це **типово вимкнено** (типове значення **0**).
    Установіть додатне значення, щоб увімкнути завершення після простою. Коли це ввімкнено, **наступне**
    повідомлення після періоду простою починає новий ID сесії для цього ключа чату.
    Це не видаляє транскрипти — це лише починає нову сесію.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="Чи є спосіб зробити команду з екземплярів OpenClaw (один CEO і багато агентів)?">
    Так, через **маршрутизацію кількох агентів** і **субагентів**. Ви можете створити одного координувального
    агента і кількох робочих агентів із власними workspace та моделями.

    Втім, на це краще дивитися як на **цікавий експеримент**. Це витрачає багато токенів і часто
    менш ефективно, ніж використання одного бота з окремими сесіями. Типова модель, яку ми
    уявляємо, — один бот, з яким ви спілкуєтеся, з різними сесіями для паралельної роботи. Цей
    бот також може запускати субагентів, коли це потрібно.

    Документація: [Маршрутизація кількох агентів](/uk/concepts/multi-agent), [Sub-agents](/uk/tools/subagents), [CLI Agents](/cli/agents).

  </Accordion>

  <Accordion title="Чому контекст було обрізано посеред завдання? Як цьому запобігти?">
    Контекст сесії обмежений вікном моделі. Довгі чати, великі виводи інструментів або багато
    файлів можуть викликати compaction або обрізання.

    Що допомагає:

    - Попросіть бота підсумувати поточний стан і записати його у файл.
    - Використовуйте `/compact` перед довгими завданнями, а `/new` — під час зміни тем.
    - Тримайте важливий контекст у workspace і просіть бота перечитати його.
    - Використовуйте субагентів для довгих або паралельних завдань, щоб основний чат залишався меншим.
    - Виберіть модель із більшим вікном контексту, якщо це трапляється часто.

  </Accordion>

  <Accordion title="Як повністю скинути OpenClaw, але залишити встановленим?">
    Використовуйте команду скидання:

    ```bash
    openclaw reset
    ```

    Неінтерактивне повне скидання:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    Потім знову запустіть налаштування:

    ```bash
    openclaw onboard --install-daemon
    ```

    Примітки:

    - Онбординг також пропонує **Reset**, якщо бачить наявну конфігурацію. Див. [Онбординг (CLI)](/uk/start/wizard).
    - Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), скиньте кожен state dir (типово це `~/.openclaw-<profile>`).
    - Скидання dev: `openclaw gateway --dev --reset` (лише для dev; очищає dev-конфігурацію + облікові дані + сесії + workspace).

  </Accordion>

  <Accordion title='Я отримую помилки "context too large" — як скинути або стиснути?'>
    Використайте один із варіантів:

    - **Стиснення** (зберігає розмову, але підсумовує старіші ходи):

      ```
      /compact
      ```

      або `/compact <instructions>`, щоб скерувати підсумок.

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
    Це помилка валідації провайдера: модель вивела блок `tool_use` без обов’язкового
    `input`. Зазвичай це означає, що історія сесії застаріла або пошкоджена (часто після довгих гілок
    або зміни інструмента/схеми).

    Виправлення: почніть нову сесію за допомогою `/new` (окреме повідомлення).

  </Accordion>

  <Accordion title="Чому я отримую повідомлення Heartbeat кожні 30 хвилин?">
    Heartbeat типово запускається кожні **30 хв** (**1 год** при використанні OAuth-автентифікації). Налаштуйте або вимкніть його:

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
    на кшталт `# Heading`), OpenClaw пропускає запуск Heartbeat, щоб заощадити API-виклики.
    Якщо файл відсутній, Heartbeat усе одно запускається, і модель вирішує, що робити.

    Overrides для конкретного агента використовують `agents.list[].heartbeat`. Документація: [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title='Чи потрібно додавати "обліковий запис бота" до групи WhatsApp?'>
    Ні. OpenClaw працює від **вашого власного облікового запису**, тому якщо ви є в групі, OpenClaw може її бачити.
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
    Варіант 1 (найшвидший): дивіться логи в реальному часі та надішліть тестове повідомлення в групу:

    ```bash
    openclaw logs --follow --json
    ```

    Шукайте `chatId` (або `from`), що закінчується на `@g.us`, наприклад:
    `1234567890-1234567890@g.us`.

    Варіант 2 (якщо вже налаштовано/додано в allowlist): перегляньте групи з конфігурації:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    Документація: [WhatsApp](/uk/channels/whatsapp), [Directory](/cli/directory), [Логи](/cli/logs).

  </Accordion>

  <Accordion title="Чому OpenClaw не відповідає в групі?">
    Є дві поширені причини:

    - Увімкнено обмеження за згадкою (типово). Ви маєте @згадати бота (або відповідати `mentionPatterns`).
    - Ви налаштували `channels.whatsapp.groups` без `"*"`, і цю групу не додано в allowlist.

    Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).

  </Accordion>

  <Accordion title="Чи групи/гілки ділять контекст із DM?">
    Прямі чати типово згортаються до основної сесії. Групи/канали мають власні ключі сесій, а теми Telegram / гілки Discord є окремими сесіями. Див. [Групи](/uk/channels/groups) і [Групові повідомлення](/uk/channels/group-messages).
  </Accordion>

  <Accordion title="Скільки workspace і агентів я можу створити?">
    Жорстких обмежень немає. Десятки (навіть сотні) — це нормально, але стежте за:

    - **Зростанням диска:** сесії + транскрипти зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.
    - **Вартістю токенів:** більше агентів означає більше одночасного використання моделей.
    - **Операційними витратами:** профілі автентифікації, workspace і маршрутизація каналів для кожного агента.

    Поради:

    - Тримайте один **активний** workspace на агента (`agents.defaults.workspace`).
    - Очищайте старі сесії (видаляйте JSONL або записи сховища), якщо диск розростається.
    - Використовуйте `openclaw doctor`, щоб знаходити зайві workspace і невідповідності профілів.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька ботів або чатів одночасно (Slack), і як це налаштувати?">
    Так. Використовуйте **Маршрутизацію кількох агентів**, щоб запускати кількох ізольованих агентів і маршрутизувати вхідні повідомлення за
    каналом/обліковим записом/peer. Slack підтримується як канал і може бути прив’язаний до конкретних агентів.

    Доступ до браузера потужний, але це не «робити все, що може людина» — anti-bot, CAPTCHA і MFA
    все ще можуть блокувати автоматизацію. Для найнадійнішого керування браузером використовуйте локальний Chrome MCP на хості,
    або використовуйте CDP на машині, яка фактично запускає браузер.

    Найкраща практика налаштування:

    - Хост Gateway, що завжди ввімкнений (VPS/Mac mini).
    - Один агент на роль (bindings).
    - Канал(и) Slack, прив’язані до цих агентів.
    - Локальний браузер через Chrome MCP або Node, коли це потрібно.

    Документація: [Маршрутизація кількох агентів](/uk/concepts/multi-agent), [Slack](/uk/channels/slack),
    [Браузер](/uk/tools/browser), [Nodes](/uk/nodes).

  </Accordion>
</AccordionGroup>

## Моделі: типові значення, вибір, aliases, перемикання

<AccordionGroup>
  <Accordion title='Що таке "модель за замовчуванням"?'>
    Типова модель OpenClaw — це те, що ви встановили як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються у форматі `provider/model` (приклад: `openai/gpt-5.4`). Якщо ви пропускаєте провайдера, OpenClaw спочатку намагається знайти alias, потім унікальний збіг точно цього model id серед налаштованих провайдерів, і лише потім повертається до налаштованого провайдера за замовчуванням як застарілого шляху сумісності. Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw повертається до першого налаштованого провайдера/моделі замість показу застарілого типового значення від видаленого провайдера. Але вам усе одно слід **явно** вказувати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендована типова:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку провайдерів.
    **Для агентів з інструментами або недовіреним вхідним потоком:** ставте силу моделі вище за вартість.
    **Для рутинного/низькоризикового чату:** використовуйте дешевші резервні моделі та маршрутизуйте за роллю агента.

    MiniMax має власну документацію: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити** для важливих завдань, і дешевшу
    модель для рутинного чату або підсумків. Ви можете маршрутизувати моделі за агентами і використовувати субагентів для
    паралелізації довгих завдань (кожен субагент витрачає токени). Див. [Моделі](/uk/concepts/models) і
    [Sub-agents](/uk/tools/subagents).

    Сильне попередження: слабші/надмірно квантизовані моделі більш вразливі до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі, не стираючи конфігурацію?">
    Використовуйте **команди моделей** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для однієї сесії)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - редагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` з частковим об’єктом, якщо тільки ви не хочете замінити всю конфігурацію.
    Для RPC-редагувань спочатку перегляньте через `config.schema.lookup` і віддавайте перевагу `config.patch`. payload lookup дає вам нормалізований шлях, поверхневу документацію/обмеження схеми та зведення безпосередніх дочірніх елементів
    для часткових оновлень.
    Якщо ви все ж перезаписали конфігурацію, відновіть її з резервної копії або повторно запустіть `openclaw doctor` для виправлення.

    Документація: [Моделі](/uk/concepts/models), [Налаштування](/cli/configure), [Конфігурація](/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати self-hosted моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Установіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо вам потрібні також хмарні моделі, виконайте `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає вам хмарні моделі плюс ваші локальні моделі Ollama
    - хмарні моделі на кшталт `kimi-k2.5:cloud` не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка з безпеки: менші або сильно квантизовані моделі більш вразливі до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все ж хочете маленькі моделі, увімкніть ізоляцію та суворі allowlist-и інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Ізоляція](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - У цих розгортаннях можуть бути різні налаштування, і вони можуть змінюватися з часом; фіксованої рекомендації щодо провайдера немає.
    - Перевіряйте поточне налаштування під час роботи на кожному gateway через `openclaw models status`.
    - Для чутливих до безпеки/увімкнених для інструментів агентів використовуйте найсильнішу доступну модель останнього покоління.
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

    Це вбудовані aliases. Користувацькі aliases можна додати через `agents.defaults.models`.

    Ви можете переглянути доступні моделі через `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований picker. Вибір за номером:

    ```
    /model 3
    ```

    Ви також можете примусово вказати конкретний профіль автентифікації для провайдера (на сесію):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується і який профіль автентифікації буде випробувано наступним.
    Він також показує налаштований endpoint провайдера (`baseUrl`) і режим API (`api`), коли це доступно.

    **Як зняти закріплення профілю, який я встановив через @profile?**

    Повторно виконайте `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо ви хочете повернутися до типового значення, виберіть його з `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль автентифікації активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.2 для щоденних завдань і Codex 5.3 для кодування?">
    Так. Установіть одну як типову і перемикайтеся за потреби:

    - **Швидке перемикання (на сесію):** `/model gpt-5.4` для щоденних завдань, `/model openai-codex/gpt-5.4` для кодування через Codex OAuth.
    - **Типове значення + перемикання:** установіть `agents.defaults.model.primary` у `openai/gpt-5.4`, а потім перемикайтеся на `openai-codex/gpt-5.4` під час кодування (або навпаки).
    - **Субагенти:** маршрутизуйте завдання кодування до субагентів з іншою типовою моделлю.

    Див. [Моделі](/uk/concepts/models) і [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.4?">
    Використовуйте або перемикач сесії, або типове значення в конфігурації:

    - **На сесію:** надішліть `/fast on`, поки сесія використовує `openai/gpt-5.4` або `openai-codex/gpt-5.4`.
    - **Типове значення для моделі:** установіть `agents.defaults.models["openai/gpt-5.4"].params.fastMode` у `true`.
    - **Також для Codex OAuth:** якщо ви ще використовуєте `openai-codex/gpt-5.4`, установіть той самий прапорець і там.

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

    Для OpenAI fast mode відображається у `service_tier = "priority"` у підтримуваних нативних запитах Responses. Перевизначення сесії через `/fast` мають вищий пріоритет за типові значення конфігурації.

    Див. [Thinking і fast mode](/uk/tools/thinking) і [OpenAI fast mode](/uk/providers/openai#openai-fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо встановлено `agents.defaults.models`, воно стає **allowlist-ом** для `/model` і будь-яких
    перевизначень сесії. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, приберіть allowlist або виберіть модель із `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **провайдер не налаштований** (не знайдено ні конфігурації провайдера MiniMax, ні
    профілю автентифікації), тому модель не може бути розв’язана.

    Контрольний список для виправлення:

    1. Оновіться до поточного релізу OpenClaw (або запускайте з вихідного коду `main`), а потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштований (майстер або JSON), або що автентифікація MiniMax
       існує в env/профілях автентифікації, щоб відповідний провайдер міг бути інжектований
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний model id (з урахуванням регістру) для вашого шляху автентифікації:
       `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed` для налаштування
       з API key, або `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування з OAuth.
    4. Виконайте:

       ```bash
       openclaw models list
       ```

       і виберіть зі списку (або `/model list` у чаті).

    Див. [MiniMax](/uk/providers/minimax) і [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати MiniMax як типове значення, а OpenAI — для складних завдань?">
    Так. Використовуйте **MiniMax за замовчуванням** і перемикайте моделі **на сесію** за потреби.
    Резервні варіанти — це для **помилок**, а не для «складних завдань», тому використовуйте `/model` або окремого агента.

    **Варіант A: перемикання на сесію**

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

    Документація: [Моделі](/uk/concepts/models), [Маршрутизація кількох агентів](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими shortcut-ами?">
    Так. OpenClaw постачається з кількома типовими shorthand-ами (застосовуються лише тоді, коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви задасте власний alias з такою самою назвою, ваше значення матиме пріоритет.

  </Accordion>

  <Accordion title="Як визначити/перевизначити shortcut-и моделей (aliases)?">
    Aliases беруться з `agents.defaults.models.<modelId>.alias`. Приклад:

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

    Тоді `/model sonnet` (або `/<alias>`, де це підтримується) розв’язується в цей model ID.

  </Accordion>

  <Accordion title="Як додати моделі від інших провайдерів, таких як OpenRouter або Z.AI?">
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

    **Після додавання нового агента не знайдено API key для provider**

    Зазвичай це означає, що **новий агент** має порожнє сховище автентифікації. Автентифікація прив’язана до агента і
    зберігається в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Виконайте `openclaw agents add <id>` і налаштуйте автентифікацію в майстрі.
    - Або скопіюйте `auth-profiles.json` з `agentDir` головного агента до `agentDir` нового агента.

    **Не** використовуйте спільний `agentDir` для кількох агентів; це спричиняє колізії автентифікації/сесій.

  </Accordion>
</AccordionGroup>

## Резервування моделей і "All models failed"

<AccordionGroup>
  <Accordion title="Як працює резервування?">
    Резервування відбувається у два етапи:

    1. **Ротація профілів автентифікації** в межах одного провайдера.
    2. **Резервна модель** до наступної моделі в `agents.defaults.model.fallbacks`.

    До профілів, що завершуються помилкою, застосовуються cooldown-и (експоненційний backoff), тож OpenClaw може продовжувати відповідати, навіть коли провайдер обмежений за rate limit або тимчасово недоступний.

    Кошик rate limit включає більше, ніж просто відповіді `429`. OpenClaw
    також трактує такі повідомлення, як `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    обмеження вікон використання (`weekly/monthly limit reached`) як підставу
    для резервування через rate limit.

    Деякі відповіді, схожі на проблеми білінгу, не є `402`, а деякі HTTP `402`
    також залишаються в цьому транзитному кошику. Якщо провайдер повертає
    явний текст про білінг у `401` або `403`, OpenClaw все одно може залишити це
    у білінговому кошику, але текстові зіставлення, специфічні для провайдера, залишаються обмеженими
    провайдером, якому вони належать (наприклад OpenRouter `Key limit exceeded`). Якщо ж повідомлення `402`
    натомість схоже на повторюване вікно використання або
    ліміт витрат organization/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw трактує це як
    `rate_limit`, а не як довготривале вимкнення через білінг.

    Помилки переповнення контексту відрізняються: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху Compaction/повторної спроби, а не запускають
    резервну модель.

    Узагальнений текст server error навмисно вужчий, ніж «усе, що містить
    unknown/error». OpenClaw справді трактує форми транзитних помилок, специфічні для провайдера,
    такі як голе повідомлення Anthropic `An unknown error occurred`, голе повідомлення OpenRouter
    `Provider returned error`, помилки stop-reason на кшталт `Unhandled stop reason:
    error`, JSON payload-и `api_error` із транзитним текстом server error
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки перевантаження провайдера на кшталт `ModelNotReadyException`, як підставу
    для резервування через timeout/перевантаження, коли контекст провайдера
    збігається.
    Загальний внутрішній резервний текст на кшталт `LLM request failed with an unknown
    error.` залишається консервативним і сам по собі не запускає резервну модель.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система спробувала використати ID профілю автентифікації `anthropic:default`, але не змогла знайти облікові дані для нього в очікуваному сховищі автентифікації.

    **Контрольний список для виправлення:**

    - **Перевірте, де зберігаються профілі автентифікації** (нові чи застарілі шляхи)
      - Поточний: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Переконайтеся, що ваша змінна середовища завантажується Gateway**
      - Якщо ви встановили `ANTHROPIC_API_KEY` у своєму shell, але запускаєте Gateway через systemd/launchd, він може не успадковувати її. Помістіть її в `~/.openclaw/.env` або увімкніть `env.shellEnv`.
    - **Переконайтеся, що ви редагуєте правильного агента**
      - Налаштування з кількома агентами означають, що може бути кілька файлів `auth-profiles.json`.
    - **Перевірте стан моделі/автентифікації**
      - Використовуйте `openclaw models status`, щоб побачити налаштовані моделі та чи провайдери автентифіковані.

    **Контрольний список для виправлення "No credentials found for profile anthropic"**

    Це означає, що запуск прив’язаний до профілю автентифікації Anthropic, але Gateway
    не може знайти його у своєму сховищі автентифікації.

    - **Використовуйте Claude CLI**
      - Виконайте `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо ви хочете натомість використовувати API key**
      - Помістіть `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистіть будь-який закріплений порядок, який примусово вимагає відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Переконайтеся, що ви виконуєте команди на хості gateway**
      - У віддаленому режимі профілі автентифікації живуть на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому він також спробував Google Gemini і зазнав невдачі?">
    Якщо конфігурація вашої моделі включає Google Gemini як резервний варіант (або ви перемкнулися на shorthand Gemini), OpenClaw спробує його під час резервування моделі. Якщо ви не налаштували облікові дані Google, побачите `No API key found for provider "google"`.

    Виправлення: або надайте автентифікацію Google, або приберіть/уникайте моделей Google у `agents.defaults.model.fallbacks` / aliases, щоб резервування не маршрутизувалося туди.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Причина: історія сесії містить **thinking-блоки без сигнатур** (часто після
    перерваного/часткового потоку). Google Antigravity вимагає сигнатури для thinking-блоків.

    Виправлення: тепер OpenClaw прибирає thinking-блоки без сигнатур для Google Antigravity Claude. Якщо це все ще з’являється, почніть **нову сесію** або встановіть `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Профілі автентифікації: що це таке і як ними керувати

Пов’язано: [/concepts/oauth](/uk/concepts/oauth) (OAuth-потоки, зберігання токенів, шаблони з кількома обліковими записами)

<AccordionGroup>
  <Accordion title="Що таке профіль автентифікації?">
    Профіль автентифікації — це іменований запис облікових даних (OAuth або API key), прив’язаний до провайдера. Профілі зберігаються в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які бувають типові ID профілів?">
    OpenClaw використовує ID з префіксом провайдера, наприклад:

    - `anthropic:default` (типово, коли немає identity на основі email)
    - `anthropic:<email>` для OAuth identity
    - користувацькі ID, які ви вибираєте (наприклад `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який профіль автентифікації пробується першим?">
    Так. Конфігурація підтримує необов’язкові метадані для профілів і порядок для кожного провайдера (`auth.order.<provider>`). Це **не** зберігає секрети; воно зіставляє ID з провайдером/режимом і задає порядок ротації.

    OpenClaw може тимчасово пропускати профіль, якщо він перебуває в короткому **cooldown** (rate limits/timeouts/auth failures) або в довшому стані **disabled** (billing/insufficient credits). Щоб перевірити це, виконайте `openclaw models status --json` і перегляньте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Cooldown-и через rate limit можуть бути прив’язані до моделі. Профіль, який перебуває в cooldown
    для однієї моделі, усе ще може бути придатним для спорідненої моделі того самого провайдера,
    тоді як вікна billing/disabled усе ще блокують увесь профіль.

    Ви також можете задати **порядок для конкретного агента** (зберігається в `auth-state.json` цього агента) через CLI:

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

    Щоб перевірити, що насправді буде випробувано, використовуйте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено в явному порядку, probe повідомляє
    `excluded_by_auth_order` для цього профілю замість того, щоб мовчки його пробувати.

  </Accordion>

  <Accordion title="OAuth vs API key — у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де це застосовно).
    - **API keys** використовують білінг pay-per-token.

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

  <Accordion title='Чому openclaw gateway status показує "Runtime: running", але "Connectivity probe: failed"?'>
    Тому що "running" — це погляд **supervisor-а** (launchd/systemd/schtasks). А connectivity probe — це фактичне підключення CLI до gateway WebSocket.

    Використовуйте `openclaw gateway status` і довіряйте таким рядкам:

    - `Probe target:` (URL, який probe фактично використав)
    - `Listening:` (що реально прив’язано до порту)
    - `Last gateway error:` (поширена першопричина, коли процес живий, але порт не слухає)

  </Accordion>

  <Accordion title='Чому openclaw gateway status показує різні "Config (cli)" і "Config (service)"?'>
    Ви редагуєте один файл конфігурації, а сервіс працює з іншим (часто через невідповідність `--profile` / `OPENCLAW_STATE_DIR`).

    Виправлення:

    ```bash
    openclaw gateway install --force
    ```

    Запускайте це з того самого `--profile` / середовища, яке сервіс має використовувати.

  </Accordion>

  <Accordion title='Що означає "another gateway instance is already listening"?'>
    OpenClaw примусово використовує runtime-lock, одразу прив’язуючи слухач WebSocket під час запуску (типово `ws://127.0.0.1:18789`). Якщо bind завершується помилкою `EADDRINUSE`, викидається `GatewayLockError`, що означає: інший екземпляр уже слухає.

    Виправлення: зупиніть інший екземпляр, звільніть порт або запускайте з `openclaw gateway --port <port>`.

  </Accordion>

  <Accordion title="Як запустити OpenClaw у віддаленому режимі (клієнт підключається до Gateway деінде)?">
    Установіть `gateway.mode: "remote"` і вкажіть віддалений URL WebSocket, за потреби з віддаленими обліковими даними на основі спільного секрету:

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
    - Застосунок macOS стежить за файлом конфігурації та переключає режими в реальному часі, коли ці значення змінюються.
    - `gateway.remote.token` / `.password` — це лише клієнтські віддалені облікові дані; самі по собі вони не вмикають локальну автентифікацію gateway.

  </Accordion>

  <Accordion title='Control UI показує "unauthorized" (або постійно перепідключається). Що тепер?'>
    Шлях автентифікації вашого gateway і метод автентифікації UI не збігаються.

    Факти (з коду):

    - Control UI зберігає токен у `sessionStorage` для поточної сесії вкладки браузера та вибраного URL gateway, тому оновлення в тій самій вкладці продовжують працювати без відновлення довготривалого збереження токена в localStorage.
    - При `AUTH_TOKEN_MISMATCH` довірені клієнти можуть зробити одну обмежену повторну спробу з кешованим токеном пристрою, коли gateway повертає підказки для повтору (`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`).
    - Тепер ця повторна спроба з кешованим токеном повторно використовує кешовані дозволені scopes, збережені разом із токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` усе ще зберігають свій запитаний набір scopes замість успадкування кешованих scopes.
    - Поза цим шляхом повторної спроби пріоритет автентифікації connect такий: спочатку явний shared token/password, потім явний `deviceToken`, потім збережений токен пристрою, потім bootstrap token.
    - Перевірки scopes для bootstrap token мають префікси ролей. Вбудований allowlist bootstrap operator задовольняє лише запити operator; для node або інших ролей, відмінних від operator, усе ще потрібні scopes під власним префіксом ролі.

    Виправлення:

    - Найшвидше: `openclaw dashboard` (виводить + копіює URL dashboard, намагається відкрити; у headless показує підказку для SSH).
    - Якщо у вас ще немає токена: `openclaw doctor --generate-gateway-token`.
    - Якщо це віддалений режим, спочатку підніміть тунель: `ssh -N -L 18789:127.0.0.1:18789 user@host`, а потім відкрийте `http://127.0.0.1:18789/`.
    - Режим shared-secret: установіть `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` або `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, а потім вставте відповідний секрет у налаштуваннях Control UI.
    - Режим Tailscale Serve: переконайтеся, що `gateway.auth.allowTailscale` увімкнено і ви відкриваєте URL Serve, а не сирий URL loopback/tailnet, який обходить заголовки ідентичності Tailscale.
    - Режим trusted-proxy: переконайтеся, що ви заходите через налаштований non-loopback identity-aware proxy, а не через loopback proxy на тому самому хості чи сирий URL gateway.
    - Якщо невідповідність зберігається після однієї повторної спроби, перевипустіть/повторно схваліть токен спареного пристрою:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - Якщо цей виклик rotate каже, що його відхилено, перевірте дві речі:
      - сесії спарених пристроїв можуть перевипускати лише **власний** пристрій, якщо тільки вони також не мають `operator.admin`
      - явні значення `--scope` не можуть перевищувати поточні scopes operator у виклику
    - Усе ще застрягли? Виконайте `openclaw status --all` і дотримуйтеся [Усунення несправностей](/uk/gateway/troubleshooting). Подробиці автентифікації див. в [Dashboard](/web/dashboard).

  </Accordion>

  <Accordion title="Я встановив gateway.bind tailnet, але він не може прив’язатися і нічого не слухає">
    Bind `tailnet` вибирає Tailscale IP з ваших мережевих інтерфейсів (100.64.0.0/10). Якщо машина не в Tailscale (або інтерфейс неактивний), прив’язуватися просто нема до чого.

    Виправлення:

    - Запустіть Tailscale на цьому хості (щоб він мав адресу 100.x), або
    - Перемкніться на `gateway.bind: "loopback"` / `"lan"`.

    Примітка: `tailnet` є явним. `auto` віддає перевагу loopback; використовуйте `gateway.bind: "tailnet"`, коли вам потрібен bind лише до tailnet.

  </Accordion>

  <Accordion title="Чи можу я запускати кілька Gateway на одному хості?">
    Зазвичай ні — один Gateway може обслуговувати кілька каналів обміну повідомленнями та агентів. Використовуйте кілька Gateway лише тоді, коли вам потрібна надлишковість (наприклад, rescue bot) або жорстка ізоляція.

    Так, але потрібно ізолювати:

    - `OPENCLAW_CONFIG_PATH` (конфігурація для кожного екземпляра)
    - `OPENCLAW_STATE_DIR` (стан для кожного екземпляра)
    - `agents.defaults.workspace` (ізоляція workspace)
    - `gateway.port` (унікальні порти)

    Швидке налаштування (рекомендовано):

    - Використовуйте `openclaw --profile <name> ...` для кожного екземпляра (автоматично створює `~/.openclaw-<name>`).
    - Установіть унікальний `gateway.port` у конфігурації кожного профілю (або передавайте `--port` для ручних запусків).
    - Установіть сервіс для кожного профілю: `openclaw --profile <name> gateway install`.

    Профілі також додають суфікси до назв сервісів (`ai.openclaw.<profile>`; застарілі `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    Повна інструкція: [Кілька gateway](/uk/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='Що означає "invalid handshake" / код 1008?'>
    Gateway — це **WebSocket-сервер**, і він очікує, що найперше повідомлення буде
    фреймом `connect`. Якщо він отримує щось інше, то закриває з’єднання
    з **кодом 1008** (порушення політики).

    Поширені причини:

    - Ви відкрили URL **HTTP** у браузері (`http://...`) замість клієнта WS.
    - Ви використали неправильний порт або шлях.
    - Proxy або тунель обрізав заголовки автентифікації чи надіслав запит не для Gateway.

    Швидкі виправлення:

    1. Використовуйте URL WS: `ws://<host>:18789` (або `wss://...`, якщо HTTPS).
    2. Не відкривайте порт WS у звичайній вкладці браузера.
    3. Якщо автентифікацію ввімкнено, додайте токен/пароль у фрейм `connect`.

    Якщо ви використовуєте CLI або TUI, URL має виглядати так:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    Подробиці протоколу: [Протокол Gateway](/uk/gateway/protocol).

  </Accordion>
</AccordionGroup>

## Логування та налагодження

<AccordionGroup>
  <Accordion title="Де знаходяться логи?">
    Файлові логи (структуровані):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    Ви можете задати стабільний шлях через `logging.file`. Рівень файлового логування контролюється через `logging.level`. Докладність консолі контролюється через `--verbose` і `logging.consoleLevel`.

    Найшвидший перегляд логів у реальному часі:

    ```bash
    openclaw logs --follow
    ```

    Логи сервісу/supervisor-а (коли gateway працює через launchd/systemd):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` і `gateway.err.log` (типово: `~/.openclaw/logs/...`; профілі використовують `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    Більше див. в [Усунення несправностей](/uk/gateway/troubleshooting).

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

    Якщо ви ніколи не встановлювали сервіс, запустіть його у foreground:

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

  <Accordion title="Gateway працює, але відповіді ніколи не надходять. Що перевірити?">
    Почніть із швидкої перевірки стану:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    Поширені причини:

    - Автентифікацію моделі не завантажено на **хості gateway** (перевірте `models status`).
    - Спарювання каналу/allowlist блокує відповіді (перевірте конфігурацію каналу + логи).
    - WebChat/Dashboard відкрито без правильного токена.

    Якщо ви у віддаленому режимі, переконайтеся, що тунель/Tailscale-з’єднання активне і
    Gateway WebSocket доступний.

    Документація: [Канали](/uk/channels), [Усунення несправностей](/uk/gateway/troubleshooting), [Віддалений доступ](/uk/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" — що тепер?'>
    Зазвичай це означає, що UI втратив з’єднання WebSocket. Перевірте:

    1. Чи працює Gateway? `openclaw gateway status`
    2. Чи справний Gateway? `openclaw status`
    3. Чи має UI правильний токен? `openclaw dashboard`
    4. Якщо це віддалений режим, чи активне тунель/Tailscale-з’єднання?

    Потім перегляньте логи в реальному часі:

    ```bash
    openclaw logs --follow
    ```

    Документація: [Dashboard](/web/dashboard), [Віддалений доступ](/uk/gateway/remote), [Усунення несправностей](/uk/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands завершується помилкою. Що перевірити?">
    Почніть із логів і статусу каналу:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    Потім зіставте помилку:

    - `BOT_COMMANDS_TOO_MUCH`: у меню Telegram забагато записів. OpenClaw уже обрізає список до ліміту Telegram і повторює спробу з меншою кількістю команд, але деякі записи меню все одно потрібно прибрати. Зменште кількість команд plugin/skill/custom або вимкніть `channels.telegram.commands.native`, якщо меню вам не потрібне.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` або схожі мережеві помилки: якщо ви на VPS або за proxy, переконайтеся, що вихідний HTTPS дозволено і DNS працює для `api.telegram.org`.

    Якщо Gateway віддалений, переконайтеся, що ви дивитеся логи на хості Gateway.

    Документація: [Telegram](/uk/channels/telegram), [Усунення несправностей каналів](/uk/channels/troubleshooting).

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

    Документація: [TUI](/web/tui), [Slash commands](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як повністю зупинити, а потім запустити Gateway?">
    Якщо ви встановили сервіс:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    Це зупиняє/запускає **керований сервіс** (launchd на macOS, systemd на Linux).
    Використовуйте це, коли Gateway працює у фоновому режимі як демон.

    Якщо ви запускаєте його у foreground, зупиніть через Ctrl-C, а потім:

    ```bash
    openclaw gateway run
    ```

    Документація: [Runbook сервісу Gateway](/uk/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart vs openclaw gateway">
    - `openclaw gateway restart`: перезапускає **фоновий сервіс** (launchd/systemd).
    - `openclaw gateway`: запускає gateway **у foreground** для цієї сесії термінала.

    Якщо ви встановили сервіс, використовуйте команди gateway. Використовуйте `openclaw gateway`, коли
    хочете одноразовий запуск у foreground.

  </Accordion>

  <Accordion title="Найшвидший спосіб отримати більше деталей, коли щось завершується помилкою">
    Запустіть Gateway з `--verbose`, щоб отримати більше деталей у консолі. Потім перегляньте файл логів для автентифікації каналів, маршрутизації моделей і помилок RPC.
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

    - Цільовий канал підтримує вихідні медіа і не заблокований allowlist-ами.
    - Файл не перевищує ліміти розміру провайдера (зображення змінюють розмір до максимуму 2048px).
    - `tools.fs.workspaceOnly=true` обмежує надсилання локальних шляхів workspace, temp/media-store і файлами, перевіреними sandbox.
    - `tools.fs.workspaceOnly=false` дозволяє `MEDIA:` надсилати локальні файли хоста, які агент уже може читати, але лише для медіа та безпечних типів документів (зображення, аудіо, відео, PDF і Office-документи). Звичайний текст і файли, схожі на секрети, усе одно блокуються.

    Див. [Зображення](/uk/nodes/images).

  </Accordion>
</AccordionGroup>

## Безпека та контроль доступу

<AccordionGroup>
  <Accordion title="Чи безпечно відкривати OpenClaw для вхідних DM?">
    Ставтеся до вхідних DM як до недовіреного вмісту. Типові значення налаштовані так, щоб зменшувати ризик:

    - Типова поведінка на каналах, що підтримують DM, — це **спарювання**:
      - Невідомі відправники отримують код спарювання; бот не обробляє їхнє повідомлення.
      - Схвалити можна так: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - Кількість запитів у черзі обмежена до **3 на канал**; перевірте `openclaw pairing list --channel <channel> [--account <id>]`, якщо код не надійшов.
    - Публічне відкриття DM потребує явного opt-in (`dmPolicy: "open"` і allowlist `"*"`).

    Запустіть `openclaw doctor`, щоб виявити ризиковані політики DM.

  </Accordion>

  <Accordion title="Чи prompt injection — це проблема лише для публічних ботів?">
    Ні. Prompt injection стосується **недовіреного вмісту**, а не лише того, хто може надсилати DM боту.
    Якщо ваш помічник читає зовнішній вміст (web search/fetch, сторінки браузера, email,
    документи, вкладення, вставлені логи), цей вміст може містити інструкції, які намагаються
    перехопити контроль над моделлю. Це може статися навіть якщо **ви — єдиний відправник**.

    Найбільший ризик виникає, коли увімкнено інструменти: модель можна обманом змусити
    ексфільтрувати контекст або викликати інструменти від вашого імені. Зменшуйте радіус ураження так:

    - використовуйте агента-"читача" лише для читання або без інструментів, щоб підсумовувати недовірений вміст
    - тримайте `web_search` / `web_fetch` / `browser` вимкненими для агентів з увімкненими інструментами
    - ставтеся до декодованого тексту файлів/документів також як до недовіреного: OpenResponses
      `input_file` і витяг тексту з медіавкладень обгортають витягнутий текст у
      явні маркери меж зовнішнього вмісту замість передачі сирого тексту файлу
    - використовуйте ізоляцію та суворі allowlist-и інструментів

    Подробиці: [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи повинен мій бот мати власний email, обліковий запис GitHub або номер телефону?">
    Так, для більшості конфігурацій. Ізоляція бота окремими обліковими записами й номерами телефонів
    зменшує радіус ураження, якщо щось піде не так. Це також полегшує ротацію
    облікових даних або відкликання доступу без впливу на ваші особисті облікові записи.

    Починайте з малого. Надавайте доступ лише до тих інструментів і облікових записів, які вам справді потрібні, і розширюйте
    пізніше, якщо буде потрібно.

    Документація: [Безпека](/uk/gateway/security), [Спарювання](/uk/channels/pairing).

  </Accordion>

  <Accordion title="Чи можу я дати йому автономність над моїми текстовими повідомленнями і чи це безпечно?">
    Ми **не** рекомендуємо повну автономність над вашими особистими повідомленнями. Найбезпечніший шаблон:

    - Тримайте DM у **режимі спарювання** або в жорсткому allowlist.
    - Використовуйте **окремий номер або обліковий запис**, якщо хочете, щоб він писав від вашого імені.
    - Нехай він створює чернетку, а ви **підтверджуєте перед надсиланням**.

    Якщо хочете поекспериментувати, робіть це на окремому обліковому записі й тримайте все ізольованим. Див.
    [Безпека](/uk/gateway/security).

  </Accordion>

  <Accordion title="Чи можу я використовувати дешевші моделі для завдань персонального помічника?">
    Так, **якщо** агент лише для чату, а вхідні дані довірені. Менші рівні
    більш схильні до перехоплення інструкцій, тому уникайте їх для агентів з увімкненими інструментами
    або коли читаєте недовірений вміст. Якщо вам усе ж потрібно використовувати меншу модель, жорстко обмежте
    інструменти й запускайте всередині sandbox. Див. [Безпека](/uk/gateway/security).
  </Accordion>

  <Accordion title="Я виконав /start у Telegram, але не отримав код спарювання">
    Коди спарювання надсилаються **лише** тоді, коли невідомий відправник пише боту і
    `dmPolicy: "pairing"` увімкнено. Сам по собі `/start` не генерує код.

    Перевірте запити в черзі:

    ```bash
    openclaw pairing list telegram
    ```

    Якщо вам потрібен негайний доступ, додайте свій sender id в allowlist або встановіть `dmPolicy: "open"`
    для цього облікового запису.

  </Accordion>

  <Accordion title="WhatsApp: чи буде він писати моїм контактам? Як працює спарювання?">
    Ні. Типова політика WhatsApp DM — **спарювання**. Невідомі відправники отримують лише код спарювання, а їхнє повідомлення **не обробляється**. OpenClaw відповідає лише на чати, які він отримує, або на явні надсилання, які ви самі запускаєте.

    Схвалити спарювання можна так:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    Переглянути запити в черзі:

    ```bash
    openclaw pairing list whatsapp
    ```

    Запит номера телефону в майстрі: він використовується для налаштування вашого **allowlist/owner**, щоб ваші власні DM були дозволені. Він не використовується для автоматичного надсилання. Якщо ви запускаєте на своєму особистому номері WhatsApp, використовуйте цей номер і ввімкніть `channels.whatsapp.selfChatMode`.

  </Accordion>
</AccordionGroup>

## Команди чату, скасування завдань і "він не зупиняється"

<AccordionGroup>
  <Accordion title="Як зупинити показ внутрішніх системних повідомлень у чаті?">
    Більшість внутрішніх або службових повідомлень з’являються лише тоді, коли для цієї сесії ввімкнено **verbose**, **trace** або **reasoning**.

    Виправлення в чаті, де ви це бачите:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    Якщо все ще занадто шумно, перевірте налаштування сесії в Control UI і встановіть verbose
    на **inherit**. Також переконайтеся, що ви не використовуєте профіль бота, де `verboseDefault` у конфігурації встановлено
    в `on`.

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

    Це тригери переривання (не slash-команди).

    Для фонових процесів (з інструмента exec) ви можете попросити агента виконати:

    ```
    process action:kill sessionId:XXX
    ```

    Огляд slash-команд: див. [Slash commands](/uk/tools/slash-commands).

    Більшість команд треба надсилати як **окреме** повідомлення, яке починається з `/`, але кілька shortcut-ів (як-от `/status`) також працюють inline для відправників з allowlist.

  </Accordion>

  <Accordion title='Як надіслати повідомлення Discord з Telegram? ("Cross-context messaging denied")'>
    OpenClaw типово блокує повідомлення **між різними провайдерами**. Якщо виклик інструмента прив’язано
    до Telegram, він не надсилатиме до Discord, доки ви явно цього не дозволите.

    Увімкніть міжпровайдерські повідомлення для агента:

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
    Queue mode визначає, як нові повідомлення взаємодіють із уже виконуваним запуском. Використовуйте `/queue`, щоб змінити режими:

    - `steer` - нові повідомлення перенаправляють поточне завдання
    - `followup` - повідомлення виконуються по одному
    - `collect` - повідомлення збираються в пакет і надсилається одна відповідь (типово)
    - `steer-backlog` - перенаправити зараз, а потім обробити чергу
    - `interrupt` - перервати поточний запуск і почати заново

    Ви можете додавати параметри на кшталт `debounce:2s cap:25 drop:summarize` для режимів followup.

  </Accordion>
</AccordionGroup>

## Різне

<AccordionGroup>
  <Accordion title='Яка типова модель для Anthropic з API key?'>
    У OpenClaw облікові дані та вибір моделі розділені. Установлення `ANTHROPIC_API_KEY` (або збереження API key Anthropic у профілях автентифікації) вмикає автентифікацію, але фактична типова модель — це те, що ви налаштували в `agents.defaults.model.primary` (наприклад, `anthropic/claude-sonnet-4-6` або `anthropic/claude-opus-4-6`). Якщо ви бачите `No credentials found for profile "anthropic:default"`, це означає, що Gateway не зміг знайти облікові дані Anthropic в очікуваному `auth-profiles.json` для агента, який зараз працює.
  </Accordion>
</AccordionGroup>

---

Усе ще застрягли? Запитайте в [Discord](https://discord.com/invite/clawd) або відкрийте [обговорення GitHub](https://github.com/openclaw/openclaw/discussions).
