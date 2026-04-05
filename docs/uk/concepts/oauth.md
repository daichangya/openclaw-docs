---
read_when:
    - Ви хочете зрозуміти OAuth в OpenClaw наскрізь
    - Ви зіткнулися з проблемами анулювання токенів / виходу з системи
    - Вам потрібні потоки автентифікації Claude CLI або OAuth
    - Ви хочете мати кілька облікових записів або маршрутизацію за профілями
summary: 'OAuth в OpenClaw: обмін токенами, зберігання та шаблони для кількох облікових записів'
title: OAuth
x-i18n:
    generated_at: "2026-04-05T18:01:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 402e20dfeb6ae87a90cba5824a56a7ba3b964f3716508ea5cc48a47e5affdd73
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

OpenClaw підтримує «автентифікацію за підпискою» через OAuth для провайдерів, які це пропонують
(зокрема **OpenAI Codex (ChatGPT OAuth)**). Для Anthropic практичний поділ
тепер такий:

- **Anthropic API key**: звичайне тарифікування Anthropic API
- **Автентифікація за підпискою Anthropic всередині OpenClaw**: Anthropic повідомила користувачів OpenClaw
  **4 квітня 2026 року о 12:00 PT / 20:00 BST**, що тепер це
  вимагає **Extra Usage**

OAuth OpenAI Codex явно підтримується для використання в зовнішніх інструментах, як-от
OpenClaw. На цій сторінці пояснюється:

Для Anthropic у production безпечнішим рекомендованим шляхом є автентифікація за API-ключем.

- як працює OAuth **обмін токенами** (PKCE)
- де **зберігаються** токени (і чому)
- як працювати з **кількома обліковими записами** (профілі + перевизначення для окремої сесії)

OpenClaw також підтримує **плагіни провайдерів**, які постачають власні потоки
OAuth або API-key. Запускайте їх так:

```bash
openclaw models auth login --provider <id>
```

## Сховище токенів (навіщо воно існує)

OAuth-провайдери часто випускають **новий refresh token** під час потоків входу/оновлення. Деякі провайдери (або OAuth-клієнти) можуть анулювати старі refresh token, коли для того самого користувача/застосунку видається новий.

Практичний симптом:

- ви входите через OpenClaw _і_ через Claude Code / Codex CLI → один із них випадково «виходить із системи» пізніше

Щоб зменшити це, OpenClaw розглядає `auth-profiles.json` як **сховище токенів**:

- runtime зчитує облікові дані з **одного місця**
- ми можемо зберігати кілька профілів і детерміновано маршрутизувати їх
- коли облікові дані повторно використовуються із зовнішнього CLI, як-от Codex CLI, OpenClaw
  віддзеркалює їх із provenance і повторно зчитує це зовнішнє джерело замість того, щоб
  самостійно обертати refresh token

## Зберігання (де живуть токени)

Секрети зберігаються **для кожного агента окремо**:

- Профілі автентифікації (OAuth + API-ключі + необов’язкові посилання на значення): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Застарілий файл сумісності: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (статичні записи `api_key` очищаються, якщо виявляються)

Застарілий файл лише для імпорту (досі підтримується, але не є основним сховищем):

- `~/.openclaw/credentials/oauth.json` (імпортується до `auth-profiles.json` під час першого використання)

Усе перелічене вище також враховує `$OPENCLAW_STATE_DIR` (перевизначення каталогу стану). Повний довідник: [/gateway/configuration](/gateway/configuration-reference#auth-storage)

Для статичних SecretRef і поведінки активації snapshot у runtime див. [Керування секретами](/gateway/secrets).

## Сумісність зі застарілими токенами Anthropic

<Warning>
У публічній документації Claude Code від Anthropic сказано, що пряме використання Claude Code залишається
в межах лімітів підписки Claude. Окремо Anthropic повідомила користувачів OpenClaw
**4 квітня 2026 року о 12:00 PT / 20:00 BST**, що **OpenClaw вважається
сторонньою harness-системою**. Наявні профілі токенів Anthropic технічно
залишаються придатними до використання в OpenClaw, але Anthropic каже, що шлях через OpenClaw тепер вимагає **Extra
Usage** (окрема оплата pay-as-you-go, окремо від підписки) для цього трафіку.

Актуальну документацію Anthropic щодо прямого плану Claude Code див. у [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
та [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Якщо вам потрібні інші варіанти у стилі підписки в OpenClaw, див. [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding
Plan](/providers/qwen), [MiniMax Coding Plan](/providers/minimax),
та [Z.AI / GLM Coding Plan](/providers/glm).
</Warning>

OpenClaw тепер знову надає setup-token Anthropic як застарілий/ручний шлях.
До цього шляху й надалі застосовується повідомлення Anthropic про тарифікацію для OpenClaw, тож
використовуйте його з розумінням того, що Anthropic вимагає **Extra Usage** для
трафіку входу Claude, ініційованого OpenClaw.

## Міграція Anthropic Claude CLI

Anthropic більше не має підтримуваного локального шляху міграції Claude CLI в
OpenClaw. Використовуйте API-ключі Anthropic для трафіку Anthropic або залишайте застарілу
автентифікацію на основі токенів лише там, де вона вже налаштована, і з розумінням
того, що Anthropic розглядає цей шлях OpenClaw як **Extra Usage**.

## Обмін OAuth (як працює вхід)

Інтерактивні потоки входу OpenClaw реалізовані в `@mariozechner/pi-ai` і підключені до майстрів/команд.

### Anthropic setup-token

Форма потоку:

1. запустіть setup-token Anthropic або вставте токен з OpenClaw
2. OpenClaw зберігає отримані облікові дані Anthropic у профілі автентифікації
3. вибір моделі залишається на `anthropic/...`
4. наявні профілі автентифікації Anthropic залишаються доступними для відкату/керування порядком

### OpenAI Codex (ChatGPT OAuth)

OAuth OpenAI Codex явно підтримується для використання поза Codex CLI, зокрема у workflow OpenClaw.

Форма потоку (PKCE):

1. згенеруйте verifier/challenge PKCE + випадковий `state`
2. відкрийте `https://auth.openai.com/oauth/authorize?...`
3. спробуйте перехопити callback на `http://127.0.0.1:1455/auth/callback`
4. якщо callback не вдається прив’язати (або ви працюєте віддалено/безголово), вставте URL переспрямування/код
5. виконайте обмін на `https://auth.openai.com/oauth/token`
6. витягніть `accountId` з access token і збережіть `{ access, refresh, expires, accountId }`

Шлях у майстрі: `openclaw onboard` → вибір автентифікації `openai-codex`.

## Оновлення + завершення строку дії

Профілі зберігають часову позначку `expires`.

Під час runtime:

- якщо `expires` ще в майбутньому → використовується збережений access token
- якщо строк дії минув → виконується оновлення (під файловим блокуванням) і збережені облікові дані перезаписуються
- виняток: повторно використані облікові дані зовнішнього CLI залишаються під зовнішнім керуванням; OpenClaw
  повторно зчитує сховище автентифікації CLI і ніколи сам не витрачає скопійований refresh token

Потік оновлення автоматичний; зазвичай вам не потрібно керувати токенами вручну.

## Кілька облікових записів (профілі) + маршрутизація

Два шаблони:

### 1) Переважний: окремі агенти

Якщо ви хочете, щоб «особисте» і «робоче» ніколи не перетиналися, використовуйте ізольованих агентів (окремі сесії + облікові дані + робочий простір):

```bash
openclaw agents add work
openclaw agents add personal
```

Потім налаштуйте автентифікацію для кожного агента окремо (майстер) і маршрутизуйте чати до потрібного агента.

### 2) Розширений варіант: кілька профілів в одному агенті

`auth-profiles.json` підтримує кілька ID профілів для одного й того самого провайдера.

Виберіть, який профіль використовується:

- глобально через порядок у конфігурації (`auth.order`)
- для окремої сесії через `/model ...@<profileId>`

Приклад (перевизначення для сесії):

- `/model Opus@anthropic:work`

Як побачити, які ID профілів існують:

- `openclaw channels list --json` (показує `auth[]`)

Пов’язана документація:

- [/concepts/model-failover](/concepts/model-failover) (правила ротації + cooldown)
- [/tools/slash-commands](/tools/slash-commands) (поверхня команд)

## Пов’язане

- [Автентифікація](/gateway/authentication) — огляд автентифікації провайдерів моделей
- [Секрети](/gateway/secrets) — зберігання облікових даних і SecretRef
- [Довідник конфігурації](/gateway/configuration-reference#auth-storage) — ключі конфігурації автентифікації
