---
read_when:
    - Вибір або перемикання моделей, налаштування псевдонімів
    - Налагодження failover моделі / «Усі моделі зазнали невдачі»
    - Розуміння профілів автентифікації та способів керування ними
sidebarTitle: Models FAQ
summary: 'FAQ: типові параметри моделі, вибір, псевдоніми, перемикання, failover і профілі автентифікації'
title: 'FAQ: моделі та автентифікація'
x-i18n:
    generated_at: "2026-04-24T04:14:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8acc0bc1ea7096ba4743defb2a1766a62ccf6c44202df82ee9c1c04e5ab62222
    source_path: help/faq-models.md
    workflow: 15
---

  Запитання й відповіді щодо моделей і профілів автентифікації. Для налаштування, сесій, gateway, каналів і
  усунення несправностей див. основне [FAQ](/uk/help/faq).

  ## Моделі: типові параметри, вибір, псевдоніми, перемикання

  <AccordionGroup>
  <Accordion title='Що таке "типова модель"?'>
    Типова модель OpenClaw — це те, що ви встановили як:

    ```
    agents.defaults.model.primary
    ```

    На моделі посилаються у форматі `provider/model` (наприклад: `openai/gpt-5.4` або `openai-codex/gpt-5.5`). Якщо не вказати provider, OpenClaw спочатку намагається знайти псевдонім, потім — унікальний збіг серед налаштованих provider для цього точного id моделі, і лише після цього повертається до налаштованого типового provider як до застарілого шляху сумісності. Якщо цей provider більше не надає налаштовану типову модель, OpenClaw переходить до першого налаштованого provider/model замість того, щоб показувати застарілий типовий provider, який більше не існує. Вам усе одно слід **явно** вказувати `provider/model`.

  </Accordion>

  <Accordion title="Яку модель ви рекомендуєте?">
    **Рекомендована типова:** використовуйте найсильнішу модель останнього покоління, доступну у вашому стеку provider.
    **Для агентів з інструментами або недовіреним вхідним вмістом:** надавайте перевагу силі моделі над вартістю.
    **Для звичайного/низькоризикового чату:** використовуйте дешевші резервні моделі й маршрутизуйте за роллю агента.

    Для MiniMax є окрема документація: [MiniMax](/uk/providers/minimax) і
    [Локальні моделі](/uk/gateway/local-models).

    Практичне правило: використовуйте **найкращу модель, яку можете собі дозволити** для високоризикової роботи, і дешевшу
    модель для звичайного чату або підсумків. Ви можете маршрутизувати моделі для кожного агента та використовувати субагентів для
    паралелізації довгих завдань (кожен субагент витрачає токени). Див. [Моделі](/uk/concepts/models) і
    [Субагенти](/uk/tools/subagents).

    Важливе попередження: слабші/надмірно квантизовані моделі вразливіші до prompt
    injection і небезпечної поведінки. Див. [Безпека](/uk/gateway/security).

    Більше контексту: [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Як перемикати моделі без стирання конфігурації?">
    Використовуйте **команди моделі** або редагуйте лише поля **model**. Уникайте повної заміни конфігурації.

    Безпечні варіанти:

    - `/model` у чаті (швидко, для поточної сесії)
    - `openclaw models set ...` (оновлює лише конфігурацію моделі)
    - `openclaw configure --section model` (інтерактивно)
    - редагуйте `agents.defaults.model` у `~/.openclaw/openclaw.json`

    Уникайте `config.apply` з частковим об’єктом, якщо ви справді не хочете замінити всю конфігурацію.
    Для редагування через RPC спочатку перевірте через `config.schema.lookup` і надавайте перевагу `config.patch`.
    Payload lookup дає вам нормалізований шлях, стислі описи/обмеження схеми та підсумки безпосередніх дочірніх елементів.
    для часткових оновлень.
    Якщо ви все ж перезаписали конфігурацію, відновіть її з резервної копії або повторно запустіть `openclaw doctor` для виправлення.

    Документація: [Моделі](/uk/concepts/models), [Configure](/uk/cli/configure), [Config](/uk/cli/config), [Doctor](/uk/gateway/doctor).

  </Accordion>

  <Accordion title="Чи можна використовувати self-hosted моделі (llama.cpp, vLLM, Ollama)?">
    Так. Ollama — найпростіший шлях для локальних моделей.

    Найшвидше налаштування:

    1. Встановіть Ollama з `https://ollama.com/download`
    2. Завантажте локальну модель, наприклад `ollama pull gemma4`
    3. Якщо вам також потрібні хмарні моделі, виконайте `ollama signin`
    4. Запустіть `openclaw onboard` і виберіть `Ollama`
    5. Виберіть `Local` або `Cloud + Local`

    Примітки:

    - `Cloud + Local` надає вам хмарні моделі разом із локальними моделями Ollama
    - хмарні моделі, наприклад `kimi-k2.5:cloud`, не потребують локального завантаження
    - для ручного перемикання використовуйте `openclaw models list` і `openclaw models set ollama/<model>`

    Примітка щодо безпеки: менші або сильно квантизовані моделі вразливіші до prompt
    injection. Ми наполегливо рекомендуємо **великі моделі** для будь-якого бота, який може використовувати інструменти.
    Якщо ви все ж хочете маленькі моделі, увімкніть sandboxing і суворі allowlist для інструментів.

    Документація: [Ollama](/uk/providers/ollama), [Локальні моделі](/uk/gateway/local-models),
    [Providers моделей](/uk/concepts/model-providers), [Безпека](/uk/gateway/security),
    [Sandboxing](/uk/gateway/sandboxing).

  </Accordion>

  <Accordion title="Які моделі використовують OpenClaw, Flawd і Krill?">
    - Ці розгортання можуть відрізнятися й змінюватися з часом; фіксованої рекомендації щодо provider немає.
    - Перевіряйте поточне налаштування середовища виконання на кожному gateway за допомогою `openclaw models status`.
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

    Це вбудовані псевдоніми. Власні псевдоніми можна додати через `agents.defaults.models`.

    Ви можете переглянути доступні моделі за допомогою `/model`, `/model list` або `/model status`.

    `/model` (і `/model list`) показує компактний нумерований список вибору. Вибір за номером:

    ```
    /model 3
    ```

    Ви також можете примусово вибрати конкретний профіль автентифікації для provider (для сесії):

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Порада: `/model status` показує, який агент активний, який файл `auth-profiles.json` використовується та який профіль автентифікації буде спробовано наступним.
    Також він показує налаштований endpoint provider (`baseUrl`) і режим API (`api`), якщо вони доступні.

    **Як скасувати закріплення профілю, заданого через @profile?**

    Повторно запустіть `/model` **без** суфікса `@profile`:

    ```
    /model anthropic/claude-opus-4-6
    ```

    Якщо ви хочете повернутися до типового значення, виберіть його з `/model` (або надішліть `/model <default provider/model>`).
    Скористайтеся `/model status`, щоб підтвердити, який профіль автентифікації активний.

  </Accordion>

  <Accordion title="Чи можна використовувати GPT 5.5 для щоденних завдань, а Codex 5.5 — для кодування?">
    Так. Встановіть одну модель як типову й перемикайтеся за потреби:

    - **Швидке перемикання (для сесії):** `/model openai/gpt-5.4` для поточних завдань із прямим ключем API OpenAI або `/model openai-codex/gpt-5.5` для завдань GPT-5.5 Codex OAuth.
    - **Типове значення:** встановіть `agents.defaults.model.primary` у `openai/gpt-5.4` для використання з ключем API або `openai-codex/gpt-5.5` для використання GPT-5.5 Codex OAuth.
    - **Субагенти:** маршрутизуйте завдання кодування до субагентів з іншою типовою моделлю.

    Прямий доступ через ключ API для `openai/gpt-5.5` підтримується, щойно OpenAI увімкне
    GPT-5.5 у публічному API. До того часу GPT-5.5 доступний лише через підписку/OAuth.

    Див. [Моделі](/uk/concepts/models) і [Slash-команди](/uk/tools/slash-commands).

  </Accordion>

  <Accordion title="Як налаштувати fast mode для GPT 5.5?">
    Використовуйте або перемикач сесії, або типове значення в конфігурації:

    - **Для сесії:** надішліть `/fast on`, поки сесія використовує `openai/gpt-5.4` або `openai-codex/gpt-5.5`.
    - **Типове значення для моделі:** встановіть `agents.defaults.models["openai/gpt-5.4"].params.fastMode` або `agents.defaults.models["openai-codex/gpt-5.5"].params.fastMode` у `true`.

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

    Для OpenAI fast mode відповідає `service_tier = "priority"` у підтримуваних власних запитах Responses. Перевизначення сесії через `/fast` мають пріоритет над типовими значеннями конфігурації.

    Див. [Thinking and fast mode](/uk/tools/thinking) і [OpenAI fast mode](/uk/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Чому я бачу "Model ... is not allowed", а потім немає відповіді?'>
    Якщо встановлено `agents.defaults.models`, це стає **allowlist** для `/model` і будь-яких
    перевизначень сесії. Вибір моделі, якої немає в цьому списку, повертає:

    ```
    Model "provider/model" is not allowed. Use /model to list available models.
    ```

    Ця помилка повертається **замість** звичайної відповіді. Виправлення: додайте модель до
    `agents.defaults.models`, видаліть allowlist або виберіть модель із `/model list`.

  </Accordion>

  <Accordion title='Чому я бачу "Unknown model: minimax/MiniMax-M2.7"?'>
    Це означає, що **provider не налаштований** (не знайдено конфігурації provider MiniMax або профілю
    автентифікації), тому модель не може бути розв’язана.

    Список перевірки для виправлення:

    1. Оновіться до актуального релізу OpenClaw (або запускайте з вихідного коду `main`), а потім перезапустіть gateway.
    2. Переконайтеся, що MiniMax налаштований (майстер або JSON), або що автентифікація MiniMax
       є в env/auth profiles, щоб можна було інжектувати відповідний provider
       (`MINIMAX_API_KEY` для `minimax`, `MINIMAX_OAUTH_TOKEN` або збережений MiniMax
       OAuth для `minimax-portal`).
    3. Використовуйте точний id моделі (з урахуванням регістру) для вашого шляху автентифікації:
       `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed` для налаштування
       з ключем API, або `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` для налаштування OAuth.
    4. Виконайте:

       ```bash
       openclaw models list
       ```

       і виберіть модель зі списку (або `/model list` у чаті).

    Див. [MiniMax](/uk/providers/minimax) і [Моделі](/uk/concepts/models).

  </Accordion>

  <Accordion title="Чи можна використовувати MiniMax як типову модель, а OpenAI — для складних завдань?">
    Так. Використовуйте **MiniMax як типову** і перемикайте моделі **для кожної сесії** за потреби.
    Резервні моделі призначені для **помилок**, а не для «складних завдань», тому використовуйте `/model` або окремого агента.

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

    - Агент A типово: MiniMax
    - Агент B типово: OpenAI
    - Маршрутизуйте за агентом або використовуйте `/agent` для перемикання

    Документація: [Моделі](/uk/concepts/models), [Маршрутизація з кількома агентами](/uk/concepts/multi-agent), [MiniMax](/uk/providers/minimax), [OpenAI](/uk/providers/openai).

  </Accordion>

  <Accordion title="Чи є opus / sonnet / gpt вбудованими скороченнями?">
    Так. OpenClaw постачається з кількома типовими скороченнями (застосовуються лише тоді, коли модель існує в `agents.defaults.models`):

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.4` для налаштувань з ключем API або `openai-codex/gpt-5.5`, якщо налаштовано Codex OAuth
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Якщо ви задасте власний псевдонім з такою самою назвою, ваше значення матиме пріоритет.

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

    Тоді `/model sonnet` (або `/<alias>`, де це підтримується) буде розв’язуватися в цей id моделі.

  </Accordion>

  <Accordion title="Як додати моделі від інших provider, наприклад OpenRouter або Z.AI?">
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

    Якщо ви посилаєтеся на provider/model, але потрібний ключ provider відсутній, ви отримаєте помилку автентифікації під час виконання (наприклад, `No API key found for provider "zai"`).

    **Після додавання нового агента не знайдено API key для provider**

    Зазвичай це означає, що **новий агент** має порожнє сховище автентифікації. Автентифікація є окремою для кожного агента й
    зберігається в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Варіанти виправлення:

    - Запустіть `openclaw agents add <id>` і налаштуйте автентифікацію під час майстра.
    - Або скопіюйте `auth-profiles.json` з `agentDir` основного агента в `agentDir` нового агента.

    **Не** використовуйте спільний `agentDir` для кількох агентів; це спричиняє конфлікти автентифікації/сесій.

  </Accordion>
</AccordionGroup>

## Failover моделі та "Усі моделі зазнали невдачі"

<AccordionGroup>
  <Accordion title="Як працює failover?">
    Failover відбувається у два етапи:

    1. **Ротація профілів автентифікації** в межах того самого provider.
    2. **Резервне перемикання моделі** на наступну модель у `agents.defaults.model.fallbacks`.

    До профілів, що дають збій, застосовуються cooldown (експоненційний backoff), тому OpenClaw може продовжувати відповідати навіть тоді, коли provider обмежує швидкість або тимчасово не працює.

    Кошик rate-limit охоплює не лише звичайні відповіді `429`. OpenClaw
    також розглядає такі повідомлення, як `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted` і періодичні
    обмеження вікна використання (`weekly/monthly limit reached`), як
    rate limit, що заслуговують на failover.

    Деякі відповіді, схожі на billing, не є `402`, а деякі HTTP-відповіді `402`
    також залишаються в цьому тимчасовому кошику. Якщо provider повертає
    явний текст про billing у `401` або `403`, OpenClaw усе одно може залишити це
    в лінії billing, але provider-специфічні текстові зіставлення залишаються в межах
    provider, якому вони належать (наприклад, OpenRouter `Key limit exceeded`). Якщо ж повідомлення `402`
    виглядає як придатне до повторної спроби обмеження вікна використання або
    ліміт витрат організації/робочого простору (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw трактує це як
    `rate_limit`, а не як довге вимкнення через billing.

    Помилки переповнення контексту відрізняються: сигнатури на кшталт
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model` або `ollama error: context length
    exceeded` залишаються на шляху Compaction/повторної спроби замість переходу до
    резервної моделі.

    Загальний текст server-error навмисно вужчий, ніж «будь-що з
    unknown/error усередині». OpenClaw справді вважає provider-специфічні тимчасові форми,
    такі як Anthropic bare `An unknown error occurred`, OpenRouter bare
    `Provider returned error`, помилки stop-reason на кшталт `Unhandled stop reason:
    error`, JSON-payload `api_error` із тимчасовим текстом сервера
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`) і помилки зайнятості provider, такі як `ModelNotReadyException`,
    сигналами timeout/overloaded, що варті failover, коли контекст provider
    збігається.
    Загальний внутрішній резервний текст на кшталт `LLM request failed with an unknown
    error.` залишається консервативним і сам по собі не запускає резервне перемикання моделі.

  </Accordion>

  <Accordion title='Що означає "No credentials found for profile anthropic:default"?'>
    Це означає, що система намагалася використати id профілю автентифікації `anthropic:default`, але не змогла знайти облікові дані для нього в очікуваному сховищі автентифікації.

    **Список перевірки для виправлення:**

    - **Підтвердьте, де зберігаються auth profiles** (нові й застарілі шляхи)
      - Поточний: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Застарілий: `~/.openclaw/agent/*` (мігрується через `openclaw doctor`)
    - **Підтвердьте, що ваша env var завантажується Gateway**
      - Якщо ви задали `ANTHROPIC_API_KEY` у shell, але запускаєте Gateway через systemd/launchd, він може не успадкувати її. Додайте її в `~/.openclaw/.env` або увімкніть `env.shellEnv`.
    - **Переконайтеся, що редагуєте правильного агента**
      - У конфігураціях із кількома агентами може бути кілька файлів `auth-profiles.json`.
    - **Швидка перевірка стану model/auth**
      - Використовуйте `openclaw models status`, щоб переглянути налаштовані моделі й те, чи автентифіковано providers.

    **Список перевірки для виправлення "No credentials found for profile anthropic"**

    Це означає, що запуск прив’язаний до профілю автентифікації Anthropic, але Gateway
    не може знайти його у своєму сховищі автентифікації.

    - **Використовуйте Claude CLI**
      - Запустіть `openclaw models auth login --provider anthropic --method cli --set-default` на хості gateway.
    - **Якщо ви хочете використовувати натомість ключ API**
      - Додайте `ANTHROPIC_API_KEY` у `~/.openclaw/.env` на **хості gateway**.
      - Очистьте будь-який закріплений порядок, що примушує використовувати відсутній профіль:

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Підтвердьте, що ви запускаєте команди на хості gateway**
      - У віддаленому режимі auth profiles зберігаються на машині gateway, а не на вашому ноутбуці.

  </Accordion>

  <Accordion title="Чому він також спробував Google Gemini і зазнав невдачі?">
    Якщо конфігурація вашої моделі містить Google Gemini як резервну модель (або ви переключилися на скорочення Gemini), OpenClaw спробує її під час резервного перемикання моделі. Якщо ви не налаштували облікові дані Google, ви побачите `No API key found for provider "google"`.

    Виправлення: або надайте автентифікацію Google, або видаліть/не використовуйте моделі Google в `agents.defaults.model.fallbacks` / псевдонімах, щоб резервне перемикання не маршрутизувалося туди.

    **LLM request rejected: thinking signature required (Google Antigravity)**

    Причина: історія сесії містить **блоки thinking без signatures** (часто через
    перерваний/частковий потік). Google Antigravity вимагає signatures для блоків thinking.

    Виправлення: тепер OpenClaw видаляє блоки thinking без підпису для Google Antigravity Claude. Якщо це все ще трапляється, почніть **нову сесію** або встановіть `/thinking off` для цього агента.

  </Accordion>
</AccordionGroup>

## Auth profiles: що це таке й як ними керувати

Пов’язане: [/concepts/oauth](/uk/concepts/oauth) (потоки OAuth, зберігання токенів, шаблони для кількох облікових записів)

<AccordionGroup>
  <Accordion title="Що таке auth profile?">
    Auth profile — це іменований запис облікових даних (OAuth або ключ API), прив’язаний до provider. Профілі зберігаються в:

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

  </Accordion>

  <Accordion title="Які типові id профілів?">
    OpenClaw використовує id з префіксом provider, наприклад:

    - `anthropic:default` (поширений варіант, коли немає email-ідентичності)
    - `anthropic:<email>` для OAuth-ідентичностей
    - власні id, які ви обираєте (наприклад, `anthropic:work`)

  </Accordion>

  <Accordion title="Чи можу я керувати тим, який auth profile буде випробувано першим?">
    Так. Конфігурація підтримує необов’язкові метадані для профілів і порядок для кожного provider (`auth.order.<provider>`). Це **не** зберігає секрети; це зіставляє id із provider/mode і задає порядок ротації.

    OpenClaw може тимчасово пропустити профіль, якщо він перебуває в короткому **cooldown** (rate limit/timeouts/auth failures) або в довшому стані **disabled** (billing/insufficient credits). Щоб перевірити це, запустіть `openclaw models status --json` і перегляньте `auth.unusableProfiles`. Налаштування: `auth.cooldowns.billingBackoffHours*`.

    Cooldown rate limit можуть бути прив’язані до моделі. Профіль, який перебуває в cooldown
    для однієї моделі, усе ще може бути придатним для спорідненої моделі того самого provider,
    тоді як вікна billing/disabled, як і раніше, блокують увесь профіль.

    Ви також можете задати перевизначення порядку **для конкретного агента** (зберігається в `auth-state.json` цього агента) через CLI:

    ```bash
    # Типово використовується налаштований типовий агент (пропустіть --agent)
    openclaw models auth order get --provider anthropic

    # Зафіксувати ротацію на одному профілі (пробувати лише його)
    openclaw models auth order set --provider anthropic anthropic:default

    # Або задати явний порядок (резервне перемикання в межах provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Очистити перевизначення (повернутися до config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Щоб націлити на конкретного агента:

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Щоб перевірити, що саме буде спробовано, використовуйте:

    ```bash
    openclaw models status --probe
    ```

    Якщо збережений профіль пропущено в явному порядку, probe повідомить
    `excluded_by_auth_order` для цього профілю замість того, щоб мовчки його пробувати.

  </Accordion>

  <Accordion title="OAuth vs API key — у чому різниця?">
    OpenClaw підтримує обидва варіанти:

    - **OAuth** часто використовує доступ за підпискою (де це застосовно).
    - **API keys** використовують оплату за токени.

    Майстер явним чином підтримує Anthropic Claude CLI, OpenAI Codex OAuth і ключі API.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [FAQ](/uk/help/faq) — основне FAQ
- [FAQ — швидкий старт і початкове налаштування](/uk/help/faq-first-run)
- [Вибір моделі](/uk/concepts/model-providers)
- [Failover моделі](/uk/concepts/model-failover)
