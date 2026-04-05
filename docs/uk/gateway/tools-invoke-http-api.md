---
read_when:
    - Викликаєте інструменти без запуску повного ходу агента
    - Створюєте автоматизації, яким потрібне примусове застосування політики інструментів
summary: Виклик одного інструмента напряму через HTTP endpoint Gateway
title: API виклику інструментів
x-i18n:
    generated_at: "2026-04-05T18:05:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: e924f257ba50b25dea0ec4c3f9eed4c8cac8a53ddef18215f87ac7de330a37fd
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Tools Invoke (HTTP)

Gateway OpenClaw надає простий HTTP endpoint для прямого виклику одного інструмента. Він завжди ввімкнений і використовує auth Gateway разом із політикою інструментів. Як і OpenAI-сумісна поверхня `/v1/*`, bearer auth зі спільним секретом розглядається як довірений операторський доступ до всього gateway.

- `POST /tools/invoke`
- Той самий порт, що й у Gateway (мультиплексування WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

Типовий максимальний розмір payload — 2 MB.

## Автентифікація

Використовує конфігурацію auth Gateway.

Поширені шляхи HTTP-auth:

- auth зі спільним секретом (`gateway.auth.mode="token"` або `"password"`):
  `Authorization: Bearer <token-or-password>`
- довірена HTTP-auth з передаванням ідентичності (`gateway.auth.mode="trusted-proxy"`):
  маршрутизуйте через налаштований proxy з підтримкою ідентичності й дозвольте йому вставляти
  потрібні заголовки ідентичності
- open auth для приватного ingress (`gateway.auth.mode="none"`):
  заголовок auth не потрібен

Примітки:

- Коли `gateway.auth.mode="token"`, використовуйте `gateway.auth.token` (або `OPENCLAW_GATEWAY_TOKEN`).
- Коли `gateway.auth.mode="password"`, використовуйте `gateway.auth.password` (або `OPENCLAW_GATEWAY_PASSWORD`).
- Коли `gateway.auth.mode="trusted-proxy"`, HTTP-запит має надходити з
  налаштованого довіреного джерела proxy не на loopback; proxy на loopback на тому самому хості
  не задовольняють вимоги цього режиму.
- Якщо налаштовано `gateway.auth.rateLimit` і стається занадто багато помилок auth, endpoint повертає `429` з `Retry-After`.

## Межа безпеки (важливо)

Ставтеся до цього endpoint як до поверхні **повного операторського доступу** для екземпляра gateway.

- HTTP bearer auth тут не є вузькою моделлю області дії для окремого користувача.
- Дійсний токен/пароль Gateway для цього endpoint слід розглядати як облікові дані власника/оператора.
- Для режимів auth зі спільним секретом (`token` і `password`) endpoint відновлює звичайні повні операторські типові значення, навіть якщо виклик надсилає вужчий заголовок `x-openclaw-scopes`.
- Auth зі спільним секретом також розглядає прямі виклики інструментів через цей endpoint як turns від відправника-власника.
- Довірені HTTP-режими з передаванням ідентичності (наприклад, auth через trusted proxy або `gateway.auth.mode="none"` на приватному ingress) враховують `x-openclaw-scopes`, коли цей заголовок присутній, інакше повертаються до звичайного типового набору операторських областей.
- Тримайте цей endpoint лише на loopback/tailnet/private ingress; не виставляйте його напряму в публічний інтернет.

Матриця auth:

- `gateway.auth.mode="token"` або `"password"` + `Authorization: Bearer ...`
  - доводить володіння спільним операторським секретом gateway
  - ігнорує вужчі `x-openclaw-scopes`
  - відновлює повний типовий набір операторських областей:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - розглядає прямі виклики інструментів через цей endpoint як turns від відправника-власника
- довірені HTTP-режими з передаванням ідентичності (наприклад, auth через trusted proxy або `gateway.auth.mode="none"` на приватному ingress)
  - автентифікують деяку зовнішню довірену ідентичність або межу розгортання
  - враховують `x-openclaw-scopes`, коли заголовок присутній
  - повертаються до звичайного типового набору операторських областей, коли заголовок відсутній
  - втрачають семантику власника лише тоді, коли виклик явно звужує області й пропускає `operator.admin`

## Тіло запиту

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Поля:

- `tool` (string, обов’язкове): назва інструмента для виклику.
- `action` (string, необов’язкове): відображається в args, якщо схема інструмента підтримує `action`, а payload args його не містить.
- `args` (object, необов’язкове): аргументи, специфічні для інструмента.
- `sessionKey` (string, необов’язкове): цільовий ключ сесії. Якщо його не вказано або він дорівнює `"main"`, Gateway використовує налаштований ключ основної сесії (з урахуванням `session.mainKey` і типового агента або `global` у глобальній області).
- `dryRun` (boolean, необов’язкове): зарезервовано для майбутнього використання; наразі ігнорується.

## Поведінка політики й маршрутизації

Доступність інструментів фільтрується через той самий ланцюжок політик, який використовують агенти Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- групові політики (якщо ключ сесії відображається на групу або канал)
- політика субагента (коли виклик здійснюється з ключем сесії субагента)

Якщо інструмент не дозволено політикою, endpoint повертає **404**.

Важливі примітки щодо меж:

- Exec approvals — це операторські запобіжники, а не окрема межа авторизації для цього HTTP endpoint. Якщо інструмент доступний тут через auth Gateway + політику інструментів, `/tools/invoke` не додає окремий prompt погодження для кожного виклику.
- Не діліться bearer credentials Gateway з недовіреними викликачами. Якщо вам потрібне розділення через межі довіри, запускайте окремі gateways (і бажано окремих користувачів ОС/хости).

HTTP Gateway також типово застосовує жорсткий deny list (навіть якщо політика сесії дозволяє інструмент):

- `exec` — пряме виконання команд (поверхня RCE)
- `spawn` — довільне створення дочірніх процесів (поверхня RCE)
- `shell` — виконання shell-команд (поверхня RCE)
- `fs_write` — довільна зміна файлів на хості
- `fs_delete` — довільне видалення файлів на хості
- `fs_move` — довільне переміщення/перейменування файлів на хості
- `apply_patch` — застосування патчів може переписувати довільні файли
- `sessions_spawn` — площина керування оркестрацією сесій; віддалений запуск агентів є RCE
- `sessions_send` — ін’єкція повідомлень між сесіями
- `cron` — площина керування постійною автоматизацією
- `gateway` — площина керування gateway; запобігає переналаштуванню через HTTP
- `nodes` — ретрансляція команд вузлів може досягати `system.run` на підключених хостах
- `whatsapp_login` — інтерактивне налаштування, яке потребує QR-сканування в терміналі; зависає в HTTP

Ви можете налаштувати цей deny list через `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

Щоб допомогти груповим політикам розв’язати контекст, ви можете необов’язково задати:

- `x-openclaw-message-channel: <channel>` (приклад: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (коли існує кілька облікових записів)

## Відповіді

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (неприпустимий запит або помилка вхідних даних інструмента)
- `401` → неавторизовано
- `429` → auth rate-limited (встановлено `Retry-After`)
- `404` → інструмент недоступний (не знайдено або не в allowlist)
- `405` → метод не дозволено
- `500` → `{ ok: false, error: { type, message } }` (неочікувана помилка виконання інструмента; очищене повідомлення)

## Приклад

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```
