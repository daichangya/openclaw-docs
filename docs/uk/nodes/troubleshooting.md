---
read_when:
    - Вузол підключено, але інструменти camera/canvas/screen/exec не працюють
    - Вам потрібна ментальна модель сполучення вузла у порівнянні з погодженнями
summary: Усунення несправностей сполучення вузлів, вимог переднього плану, дозволів і збоїв інструментів
title: Усунення несправностей вузлів
x-i18n:
    generated_at: "2026-04-23T23:01:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59c7367d02945e972094b47832164d95573a2aab1122e8ccf6feb80bcfcd95be
    source_path: nodes/troubleshooting.md
    workflow: 15
---

Використовуйте цю сторінку, коли вузол видно в статусі, але інструменти вузла не працюють.

## Послідовність команд

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Потім запустіть перевірки, специфічні для вузла:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Ознаки здорового стану:

- Вузол підключений і сполучений для ролі `node`.
- `nodes describe` містить можливість, яку ви викликаєте.
- Погодження exec показують очікуваний режим/allowlist.

## Вимоги переднього плану

`canvas.*`, `camera.*` і `screen.*` доступні лише в передньому плані на вузлах iOS/Android.

Швидка перевірка та виправлення:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Якщо ви бачите `NODE_BACKGROUND_UNAVAILABLE`, переведіть застосунок вузла в передній план і повторіть спробу.

## Матриця дозволів

| Capability                   | iOS                                     | Android                                      | Застосунок-вузол macOS       | Типовий код помилки            |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | ---------------------------- | ------------------------------ |
| `camera.snap`, `camera.clip` | Камера (+ мікрофон для аудіо кліпу)     | Камера (+ мікрофон для аудіо кліпу)          | Камера (+ мікрофон для аудіо кліпу) | `*_PERMISSION_REQUIRED`        |
| `screen.record`              | Запис екрана (+ мікрофон за бажанням)   | Запит на захоплення екрана (+ мікрофон за бажанням) | Запис екрана                 | `*_PERMISSION_REQUIRED`        |
| `location.get`               | Під час використання або Завжди (залежить від режиму) | Location на передньому/фоновому плані залежно від режиму | Дозвіл на location           | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                 | н/д (шлях хоста вузла)                  | н/д (шлях хоста вузла)                       | Потрібні погодження exec     | `SYSTEM_RUN_DENIED`            |

## Сполучення проти погоджень

Це різні запобіжники:

1. **Сполучення пристрою**: чи може цей вузол підключитися до gateway?
2. **Політика команд вузла Gateway**: чи дозволено RPC command ID через `gateway.nodes.allowCommands` / `denyCommands` і типові значення платформи?
3. **Погодження exec**: чи може цей вузол локально виконати конкретну shell-команду?

Швидкі перевірки:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Якщо сполучення відсутнє, спочатку схваліть пристрій вузла.
Якщо в `nodes describe` немає команди, перевірте політику команд вузла gateway і те, чи справді вузол оголосив цю команду під час підключення.
Якщо зі сполученням усе гаразд, але `system.run` не працює, виправте погодження exec/allowlist на цьому вузлі.

Сполучення вузла — це запобіжник ідентичності/довіри, а не поверхня погодження для кожної команди. Для `system.run` політика для кожного вузла зберігається у файлі погоджень exec цього вузла (`openclaw approvals get --node ...`), а не в записі сполучення gateway.

Для запусків `host=node`, що спираються на погодження, gateway також прив’язує виконання до
підготовленого канонічного `systemRunPlan`. Якщо пізніший виклик змінює команду/cwd або
метадані сесії до того, як погоджений запуск буде переспрямовано, gateway відхиляє
запуск як невідповідність погодженню, замість того щоб довіряти відредагованому payload.

## Поширені коди помилок вузла

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок у фоновому режимі; переведіть його в передній план.
- `CAMERA_DISABLED` → у налаштуваннях вузла вимкнено перемикач камери.
- `*_PERMISSION_REQUIRED` → відсутній/відхилений дозвіл ОС.
- `LOCATION_DISABLED` → режим location вимкнено.
- `LOCATION_PERMISSION_REQUIRED` → для запитаного режиму location дозвіл не надано.
- `LOCATION_BACKGROUND_UNAVAILABLE` → застосунок у фоновому режимі, але є лише дозвіл Під час використання.
- `SYSTEM_RUN_DENIED: approval required` → запит exec потребує явного погодження.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано режимом allowlist.
  На хостах вузлів Windows форми з shell-обгорткою, як-от `cmd.exe /c ...`, вважаються промахом allowlist у
  режимі allowlist, якщо не схвалені через ask flow.

## Швидкий цикл відновлення

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Якщо все ще не вдається:

- Повторно схваліть сполучення пристрою.
- Повторно відкрийте застосунок вузла (у передньому плані).
- Повторно надайте дозволи ОС.
- Пересоздайте/скоригуйте політику погоджень exec.

Пов’язане:

- [/nodes/index](/uk/nodes/index)
- [/nodes/camera](/uk/nodes/camera)
- [/nodes/location-command](/uk/nodes/location-command)
- [/tools/exec-approvals](/uk/tools/exec-approvals)
- [/gateway/pairing](/uk/gateway/pairing)

## Пов’язане

- [Огляд вузлів](/uk/nodes)
- [Усунення несправностей Gateway](/uk/gateway/troubleshooting)
- [Усунення несправностей каналів](/uk/channels/troubleshooting)
