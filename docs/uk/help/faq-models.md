---
read_when:
    - Вибір або перемикання моделей, налаштування псевдонімів
    - Налагодження failover моделі / «Усі моделі завершилися помилкою»
    - Розуміння профілів auth і способів керування ними
summary: 'FAQ: типові значення моделей, вибір, псевдоніми, перемикання, failover та профілі auth'
title: FAQ — моделі та профілі auth
x-i18n:
    generated_at: "2026-04-24T03:46:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dc7cc346046d17e6044e6a43a8c707b0a842eddd87abb0a9a2b8364ed1b0f23
    source_path: help/faq-models.md
    workflow: 15
---

  Запитання й відповіді про моделі та профілі auth. Про налаштування, сесії, gateway, канали та
  усунення неполадок див. основний [FAQ](/uk/help/faq).

  ## Моделі: типові значення, вибір, псевдоніми, перемикання

  <AccordionGroup>
  <Accordion title='Що таке "типова модель"?'>
    Типова модель OpenClaw — це те, що ви задаєте як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються у форматі `provider/model` (наприклад: `openai/gpt-5.4` або `openai-codex/gpt-5.5`). Якщо ви пропускаєте provider, OpenClaw спочатку пробує псевдонім, потім унікальний збіг налаштованого provider для точного id моделі, і лише після цього повертається до налаштованого типового provider як до застарілого шляху сумісності. Якщо цей provider більше не надає налаштовану типову модель, OpenClaw повертається до першого налаштованого provider/model замість того, щоб показувати застаріле типове значення видаленого provider. Вам усе одно слід **явно** задавати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендоване типове значення:** використовуйте найсильнішу доступну модель останнього покоління у вашому стеку provider.
    **Для агентів з увімкненими інструментами або недовіреним вводом:** надавайте перевагу силі моделі над вартістю.
    **Для звичайного/низькоризикового чату:** використовуйте дешевші резервні моделі й маршрутизуйте за роллю агента.

    Для MiniMax є окрема документація: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити** для високоризикових завдань, і дешевшу
    модель для звичайного чату або підсумків. Ви можете маршрутизувати моделі для кожного агента й використовувати підагентів для
    паралелізації довгих завдань (кожен підагент споживає токени). Див. [Моделі](/uk/concepts/models) і
    [Підагенти](/uk/tools/subagents).

    Сильне попередження: слабші/надмірно квантизовані моделі більш уразливі до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як переключити моделі без очищення конфігурації?">
    Використовуйте **команди моделі** або редагуйте лише поля **model**. Уникайте повної заміни config.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для поточної сесії)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - відредагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` із частковим об’єктом, якщо тільки ви справді не хочете замінити всю config.
    Для редагувань через RPC спочатку перегляньте через `config.schema.lookup` і надавайте перевагу `config.patch`. Payload lookup дає вам нормалізований шлях, документацію/обмеження поверхневої schema та підсумки безпосередніх дочірніх елементів.
    для часткових оновлень.
    Якщо ви все ж перезаписали config, відновіть її з резервної копії або повторно запустіть `openclaw doctor`, щоб виконати відновлення.

    Документація: [Моделі](/uk/concepts/models), [Configure](/uk/cli/configure), [Config](/uk/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можу я використовувати self-hosted моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях до локальних моделей.

    Найшвидше налаштування:

    1. Установіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо ви також хочете хмарні моделі, виконайте `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` дає вам хмарні моделі плюс ваші локальні моделі Ollama
    - хмарні моделі, як-от `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі більш уразливі до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все ж хочете малі моделі, увімкніть sandboxing і строгі allowlist інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Провайдери моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Sandboxing](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися й змінюватися з часом; фіксованої рекомендації щодо provider немає.
    - Перевіряйте поточне налаштування runtime на кожному gateway через `openclaw models status`.
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

    Це вбудовані псевдоніми. Користувацькі псевдоніми можна додати через `agents.defaults.models`.

    Ви можете переглянути доступні моделі за допомогою `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований вибір. Вибір за номером:

    ```
    /model 3
    ```

    Ви також можете примусово задати конкретний профіль auth для provider (для поточної сесії):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується та який профіль auth буде спробовано наступним.
    Він також показує налаштовану кінцеву точку provider (`baseUrl`) і режим API (`api`), якщо вони доступні.

    **Як скасувати закріплення профілю, який я задав через @profile?**

    Повторно виконайте `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо ви хочете повернутися до типового значення, виберіть його через `/model` (або надішліть `/model <default provider/model>`).
    Використовуйте `/model status`, щоб підтвердити, який профіль auth активний.

  </Accordion>

  <Accordion title="Чи можу я використовувати GPT 5.5 для щоденних завдань, а Codex 5.5 — для кодування?">
    Так. Задайте одну модель як типову й перемикайтеся за потреби:

    - **Швидке перемикання (для сесії):** `/model openai/gpt-5.4` для поточних завдань через прямий API key OpenAI або `/model openai-codex/gpt-5.5` для OAuth-завдань GPT-5.5 Codex.
    - **Типове значення:** задайте `agents.defaults.model.primary` як `openai/gpt-5.4` для використання API key або `openai-codex/gpt-5.5` для використання GPT-5.5 Codex OAuth.
    - **Підагенти:** маршрутизуйте завдання кодування до підагентів з іншою типовою моделлю.

    Прямий доступ через API key до `openai/gpt-5.5` підтримується, щойно OpenAI увімкне
    GPT-5.5 у публічному API. До того часу GPT-5.5 доступний лише через subscription/OAuth.

    Див. [Моделі](/uk/concepts/models) і [Слеш-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.5?">
    Використовуйте або перемикач на рівні сесії, або типове значення в config:

    - **Для сесії:** надішліть `/fast on`, поки сесія використовує `openai/gpt-5.4` або `openai-codex/gpt-5.5`.
    - **Типове значення для моделі:** задайте `agents.defaults.models["openai/gpt-5.4"].params.fastMode` або `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` як `true`.

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

    Для OpenAI fast mode мапиться на `service_tier = "priority"` у підтримуваних нативних запитах Responses. Сесійні перевизначення `/fast` мають вищий пріоритет за типові значення config.

    Див. [Thinking and fast mode](/uk/tools/thinking) і [OpenAI fast mode](/uk/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо задано `agents.defaults.models`, це стає **allowlist** для `/model` і будь-яких
    перевизначень на рівні сесії. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, приберіть allowlist або виберіть модель із `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **provider не налаштовано** (не знайдено конфігурації provider MiniMax або
    профілю auth), тому модель не може бути визначена.

    Контрольний список виправлення:

    1. Оновіться до актуального релізу OpenClaw (або запускайте з вихідного `main`), а потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштовано (через майстер або JSON), або що auth MiniMax
       існує в env/auth profiles, щоб можна було ін’єктувати відповідний provider
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний id моделі (з урахуванням регістру) для вашого шляху auth:
       `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed` для налаштування через API key,
       або `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування через OAuth.
    4. Виконайте:

       ```bash
       openclaw models list
       ```

       і виберіть модель зі списку (або `/model list` у чаті).

    Див. [MiniMax](/uk/providers/minimax) і [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можу я використовувати MiniMax як типову модель, а OpenAI — для складних завдань?">
    Так. Використовуйте **MiniMax як типову** і перемикайте моделі **для окремої сесії** за потреби.
    Fallback призначений для **помилок**, а не для «складних завдань», тому використовуйте `/model` або окремого агента.

    **Варіант A: перемикання для сесії**

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

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома типовими скороченнями (вони застосовуються лише коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4` для налаштувань через API key або `openai-codex/gpt-5.5`, якщо налаштовано Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви задасте власний псевдонім з такою самою назвою, пріоритет матиме ваше значення.

  </Accordion>

  <Accordion title="Як визначати/перевизначати скорочення моделей (псевдоніми)?">
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

    Тоді `/model sonnet` (або `/<alias>`, коли це підтримується) визначається як цей id моделі.

  </Accordion>

  <Accordion title="Як додати моделі від інших provider, як-от OpenRouter або Z.AI?">
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

    Якщо ви посилаєтеся на `provider/model`, але потрібний ключ provider відсутній, ви отримаєте помилку auth під час runtime (наприклад, `No API key found for provider "zai"`).

    **Не знайдено API key для provider після додавання нового агента**

    Зазвичай це означає, що **новий агент** має порожнє сховище auth. Auth є окремим для кожного агента і
    зберігається тут:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Виконайте `openclaw agents add <id>` і налаштуйте auth під час роботи майстра.
    - Або скопіюйте `auth-profiles.json` з `agentDir` головного агента в `agentDir` нового агента.

    Не використовуйте один і той самий `agentDir` для кількох агентів; це спричиняє колізії auth/сесій.

  </Accordion>
</AccordionGroup>

## Failover моделі та «Усі моделі завершилися помилкою»

<AccordionGroup>
  <Accordion title="Як працює failover?">
    Failover відбувається у два етапи:

    1. **Ротація профілів auth** у межах одного provider.
    2. **Fallback моделі** до наступної моделі в `agents.defaults.model.fallbacks`.

    До профілів, що завершуються помилками, застосовуються cooldown (експоненційний backoff), тому OpenClaw може продовжувати відповідати, навіть коли provider обмежений rate limit або тимчасово не працює.

    Кошик rate limit включає не лише звичайні відповіді `429`. OpenClaw
    також вважає такими, що заслуговують на failover, повідомлення на кшталт
    `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    ліміти вікна використання (`weekly/monthly limit reached`).

    Деякі відповіді, схожі на billing, не є `402`, а деякі відповіді HTTP `402`
    теж залишаються в цьому кошику тимчасових помилок. Якщо provider повертає
    явний текст про billing на `401` або `403`, OpenClaw усе одно може залишити це
    в категорії billing, але provider-specific text matcher залишаються обмеженими
    тим provider, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Якщо повідомлення `402`
    натомість схоже на повторюваний ліміт вікна використання або
    ліміт витрат organization/workspace (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw трактує це як
    `rate_limit`, а не як тривале вимкнення через billing.

    Помилки переповнення контексту відрізняються: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху compaction/retry замість переходу до
    fallback моделі.

    Загальний текст server-error навмисно вужчий, ніж «усе, де є
    unknown/error». OpenClaw справді вважає гідними failover transient-форми,
    прив’язані до provider, як-от Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, помилки reason stop на кшталт `Unhandled stop reason:
    error`, JSON `api_error` payload з transient server text
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості provider, як-от `ModelNotReadyException`, як
    сигнали timeout/overloaded, що заслуговують на failover, коли контекст provider збігається.
    Загальний внутрішній текст fallback на кшталт `LLM request failed with an unknown
    error.` залишається консервативним і сам по собі не запускає fallback моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система спробувала використати ID профілю auth `anthropic:default`, але не змогла знайти для нього облікові дані в очікуваному сховищі auth.

    **Контрольний список виправлення:**

    - **Підтвердьте, де зберігаються профілі auth** (нові та застарілі шляхи)
      - Поточний шлях: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий шлях: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Підтвердьте, що ваша змінна env завантажується Gateway**
      - Якщо ви задали `ANTHROPIC_API_KEY` у своїй оболонці, але запускаєте Gateway через systemd/launchd, він може її не успадкувати. Додайте її в `~/.openclaw/.env` або ввімкніть `env.shellEnv`.
    - **Переконайтеся, що редагуєте правильного агента**
      - У конфігураціях із кількома агентами може бути кілька файлів `auth-profiles.json`.
    - **Перевірте статус моделі/auth**
      - Використовуйте `openclaw models status`, щоб переглянути налаштовані моделі та те, чи пройшли provider автентифікацію.

    **Контрольний список виправлення для "No credentials found for profile anthropic"**

    Це означає, що виконання закріплене за профілем auth Anthropic, але Gateway
    не може знайти його у своєму сховищі auth.

    - **Використовуйте Claude CLI**
      - Виконайте `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо ви хочете використовувати API key**
      - Додайте `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистьте будь-який закріплений порядок, який примусово вимагає відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Підтвердьте, що ви запускаєте команди на хості gateway**
      - У віддаленому режимі профілі auth зберігаються на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому також була спроба Google Gemini, і вона завершилася помилкою?">
    Якщо конфігурація вашої моделі включає Google Gemini як fallback (або ви перемкнулися на скорочення Gemini), OpenClaw спробує її під час fallback моделі. Якщо ви не налаштували облікові дані Google, ви побачите `No API key found for provider "google"`.

    Виправлення: або надайте auth Google, або приберіть/не використовуйте моделі Google в `agents.defaults.model.fallbacks` / псевдонімах, щоб fallback не маршрутизувався туди.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Причина: історія сесії містить **thinking blocks без signature** (часто через
    перерваний/частковий потік). Google Antigravity вимагає signature для thinking blocks.

    Виправлення: OpenClaw тепер видаляє thinking blocks без signature для Google Antigravity Claude. Якщо це все ще трапляється, почніть **нову сесію** або задайте `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Профілі auth: що це таке і як ними керувати

Пов’язане: [/concepts/oauth](/uk/concepts/oauth) (потоки OAuth, зберігання token, шаблони для кількох облікових записів)

<AccordionGroup>
  <Accordion title="Що таке профіль auth?">
    Профіль auth — це іменований запис облікових даних (OAuth або API key), прив’язаний до provider. Профілі зберігаються тут:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які типові ID профілів?">
    OpenClaw використовує ID з префіксом provider, наприклад:

    - `anthropic:default` (типово, коли не існує ідентичності email)
    - `anthropic:<email>` для OAuth-ідентичностей
    - користувацькі ID, які ви обираєте (наприклад, `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який профіль auth буде спробовано першим?">
    Так. Config підтримує необов’язкові метадані для профілів і порядок для кожного provider (`auth.order.<provider>`). Це **не** зберігає secrets; це зіставляє ID з provider/mode і задає порядок ротації.

    OpenClaw може тимчасово пропускати профіль, якщо він перебуває в короткому **cooldown** (rate limit/timeout/auth failures) або в довшому стані **disabled** (billing/insufficient credits). Щоб це перевірити, виконайте `openclaw models status --json` і перегляньте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Cooldown для rate limit можуть бути прив’язані до моделі. Профіль, який перебуває в cooldown
    для однієї моделі, усе ще може бути придатним для спорідненої моделі того самого provider,
    тоді як billing/disabled вікна все одно блокують увесь профіль.

    Ви також можете задати **перевизначення порядку для окремого агента** (зберігається в `auth-state.json` цього агента) через CLI:

    ```bash
    # Типово використовує налаштованого типового агента (не вказуйте --agent)
    openclaw models auth order get --provider anthropic

    # Зафіксувати ротацію на одному профілі (пробувати лише його)
    openclaw models auth order set --provider anthropic anthropic:default

    # Або задати явний порядок (fallback у межах provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Очистити перевизначення (повернутися до config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Щоб націлитися на конкретного агента:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Щоб перевірити, що саме буде реально спробовано, використовуйте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено в явному порядку, probe повідомить
    `excluded_by_auth_order` для цього профілю замість того, щоб тихо його пробувати.

  </Accordion>

  <Accordion title="OAuth чи API key — у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де це застосовується).
    - **API key** використовують модель оплати за токени.

    Майстер явно підтримує Anthropic Claude CLI, OpenAI Codex OAuth і API key.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [FAQ](/uk/help/faq) — основний FAQ
- [FAQ — швидкий старт і початкове налаштування](/uk/help/faq-first-run)
- [Вибір моделі](/uk/concepts/model-providers)
- [Failover моделі](/uk/concepts/model-failover)
