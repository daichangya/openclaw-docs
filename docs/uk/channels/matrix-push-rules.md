---
read_when:
    - Налаштування тихої потокової передачі Matrix для самохостингового Synapse або Tuwunel
    - Користувачі хочуть отримувати сповіщення лише про завершені блоки, а не про кожне редагування попереднього перегляду
summary: Правила push-сповіщень Matrix для тихих фіналізованих редагувань попереднього перегляду
title: Правила push-сповіщень Matrix для тихих попередніх переглядів
x-i18n:
    generated_at: "2026-04-23T15:01:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: dbfdf2552ca352858d4e8d03a2a0f5f3b420d33b01063c111c0335c0229f0534
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

# Правила push-сповіщень Matrix для тихих попередніх переглядів

Коли `channels.matrix.streaming` має значення `"quiet"`, OpenClaw редагує одну подію попереднього перегляду на місці й позначає фіналізоване редагування спеціальним прапорцем у вмісті. Клієнти Matrix надсилають сповіщення лише про фінальне редагування, якщо правило push для конкретного користувача відповідає цьому прапорцю. Ця сторінка призначена для операторів, які самостійно хостять Matrix і хочуть встановити це правило для кожного облікового запису одержувача.

Якщо вам потрібна лише стандартна поведінка сповіщень Matrix, використовуйте `streaming: "partial"` або залиште потокову передачу вимкненою. Див. [Налаштування каналу Matrix](/uk/channels/matrix#streaming-previews).

## Передумови

- користувач-одержувач = людина, яка має отримувати сповіщення
- бот-користувач = обліковий запис OpenClaw Matrix, який надсилає відповідь
- для наведених нижче викликів API використовуйте токен доступу користувача-одержувача
- у правилі push значення `sender` має збігатися з повним MXID бот-користувача
- обліковий запис одержувача вже повинен мати справні pushers — правила тихого попереднього перегляду працюють лише тоді, коли звичайна доставка push у Matrix працює коректно

## Кроки

<Steps>
  <Step title="Налаштуйте тихі попередні перегляди">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="Отримайте токен доступу одержувача">
    Повторно використайте токен наявної сесії клієнта, якщо це можливо. Щоб випустити новий:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="Переконайтеся, що pushers існують">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Якщо pushers не повертаються, спочатку виправте звичайну доставку push у Matrix для цього облікового запису.

  </Step>

  <Step title="Встановіть override-правило push">
    OpenClaw позначає фіналізовані редагування текстового попереднього перегляду через `content["com.openclaw.finalized_preview"] = true`. Встановіть правило, яке відповідає цьому маркеру, а також MXID бота як відправнику:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    Перед запуском замініть:

    - `https://matrix.example.org`: базовий URL вашого homeserver
    - `$USER_ACCESS_TOKEN`: токен доступу користувача-одержувача
    - `openclaw-finalized-preview-botname`: ID правила, унікальний для кожного бота й одержувача (шаблон: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID вашого бота OpenClaw, а не одержувача

  </Step>

  <Step title="Перевірте">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Потім протестуйте потокову відповідь. У тихому режимі в кімнаті показується чернетка тихого попереднього перегляду, а сповіщення надходить один раз, коли блок або хід завершується.

  </Step>
</Steps>

Щоб пізніше видалити правило, виконайте `DELETE` для того самого URL правила з токеном одержувача.

## Примітки щодо кількох ботів

Ключем push-правил є `ruleId`: повторний запуск `PUT` для того самого ID оновлює одне правило. Якщо кілька ботів OpenClaw надсилають сповіщення одному одержувачу, створіть окреме правило для кожного бота з різним збігом `sender`.

Нові користувацькі правила `override` вставляються перед стандартними правилами приглушення, тому жоден додатковий параметр упорядкування не потрібен. Правило впливає лише на редагування текстового попереднього перегляду, які можна фіналізувати на місці; резервні варіанти для медіа та застарілого попереднього перегляду використовують звичайну доставку Matrix.

## Примітки щодо homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Спеціальні зміни в `homeserver.yaml` не потрібні. Якщо звичайні сповіщення Matrix уже доходять до цього користувача, головний крок налаштування — це токен одержувача та виклик `pushrules`, наведений вище.

    Якщо ви запускаєте Synapse за reverse proxy або workers, переконайтеся, що `/_matrix/client/.../pushrules/` коректно доходить до Synapse. Доставка push обробляється основним процесом або `synapse.app.pusher` / налаштованими pusher workers — переконайтеся, що вони працюють справно.

  </Accordion>

  <Accordion title="Tuwunel">
    Такий самий процес, як і для Synapse; жодна специфічна для Tuwunel конфігурація для маркера фіналізованого попереднього перегляду не потрібна.

    Якщо сповіщення зникають, поки користувач активний на іншому пристрої, перевірте, чи ввімкнено `suppress_push_when_active`. Tuwunel додав цю опцію у версії 1.4.2 (вересень 2025 року), і вона може навмисно приглушувати push на інших пристроях, поки один пристрій активний.

  </Accordion>
</AccordionGroup>

## Пов’язане

- [Налаштування каналу Matrix](/uk/channels/matrix)
- [Концепції потокової передачі](/uk/concepts/streaming)
