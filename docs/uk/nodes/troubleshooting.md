---
read_when:
    - Node підключено, але tools camera/canvas/screen/exec не працюють
    - Вам потрібна ментальна модель pairing node порівняно зі схваленнями
summary: Усунення несправностей pairing node, вимог foreground, дозволів і збоїв tools
title: Усунення несправностей Node
x-i18n:
    generated_at: "2026-04-05T18:09:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2e431e6a35c482a655e01460bef9fab5d5a5ae7dc46f8f992ee51100f5c937e
    source_path: nodes/troubleshooting.md
    workflow: 15
---

# Усунення несправностей Node

Використовуйте цю сторінку, коли node видно у status, але tools node не працюють.

## Ланцюжок команд

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Потім виконайте перевірки, специфічні для node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

Ознаки нормальної роботи:

- Node підключено і виконано pairing для ролі `node`.
- `nodes describe` містить можливість, яку ви викликаєте.
- Схвалення exec показують очікуваний режим/allowlist.

## Вимоги до foreground

`canvas.*`, `camera.*` і `screen.*` працюють лише у foreground на nodes iOS/Android.

Швидка перевірка й виправлення:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

Якщо ви бачите `NODE_BACKGROUND_UNAVAILABLE`, переведіть застосунок node у foreground і повторіть спробу.

## Матриця дозволів

| Можливість                  | iOS                                      | Android                                       | застосунок node для macOS      | Типовий код помилки           |
| --------------------------- | ---------------------------------------- | --------------------------------------------- | ------------------------------ | ----------------------------- |
| `camera.snap`, `camera.clip` | Камера (+ мікрофон для аудіо в clip)     | Камера (+ мікрофон для аудіо в clip)          | Камера (+ мікрофон для аудіо в clip) | `*_PERMISSION_REQUIRED`       |
| `screen.record`             | Запис екрана (+ мікрофон необов’язково)  | Запит на захоплення екрана (+ мікрофон необов’язково) | Запис екрана                   | `*_PERMISSION_REQUIRED`       |
| `location.get`              | While Using або Always (залежно від режиму) | Foreground/Background location залежно від режиму | Дозвіл на геолокацію          | `LOCATION_PERMISSION_REQUIRED` |
| `system.run`                | n/a (шлях через node host)               | n/a (шлях через node host)                    | Потрібні схвалення exec        | `SYSTEM_RUN_DENIED`           |

## Pairing проти схвалень

Це різні рівні контролю:

1. **Pairing пристрою**: чи може цей node підключитися до gateway?
2. **Політика команд node у Gateway**: чи дозволений ID команди RPC через `gateway.nodes.allowCommands` / `denyCommands` і типові значення платформи?
3. **Схвалення exec**: чи може цей node локально виконати конкретну shell-команду?

Швидкі перевірки:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

Якщо pairing відсутній, спочатку схваліть пристрій node.
Якщо в `nodes describe` бракує команди, перевірте політику команд node в gateway і те, чи node справді оголосив цю команду під час connect.
Якщо з pairing усе гаразд, але `system.run` не працює, виправте схвалення exec/allowlist на цьому node.

Pairing node — це перевірка ідентичності/довіри, а не поверхня схвалення для кожної команди. Для `system.run` політика для конкретного node міститься у файлі схвалень exec цього node (`openclaw approvals get --node ...`), а не в записі pairing gateway.

Для запусків `host=node`, що базуються на схваленні, gateway також прив’язує виконання до
підготовленого канонічного `systemRunPlan`. Якщо пізніший викликач змінює command/cwd або
метадані сесії до пересилання схваленого запуску, gateway відхиляє
виконання як невідповідність схваленню, а не довіряє зміненому payload.

## Поширені коди помилок node

- `NODE_BACKGROUND_UNAVAILABLE` → застосунок перебуває у background; переведіть його у foreground.
- `CAMERA_DISABLED` → перемикач камери вимкнено в налаштуваннях node.
- `*_PERMISSION_REQUIRED` → відсутній/відхилений дозвіл ОС.
- `LOCATION_DISABLED` → режим геолокації вимкнено.
- `LOCATION_PERMISSION_REQUIRED` → для запитаного режиму геолокації не надано дозвіл.
- `LOCATION_BACKGROUND_UNAVAILABLE` → застосунок у background, але є лише дозвіл While Using.
- `SYSTEM_RUN_DENIED: approval required` → запит exec потребує явного схвалення.
- `SYSTEM_RUN_DENIED: allowlist miss` → команду заблоковано в режимі allowlist.
  На Windows node hosts форми через обгортку shell, як-от `cmd.exe /c ...`, вважаються allowlist miss у
  режимі allowlist, якщо їх не схвалено через потік ask.

## Швидкий цикл відновлення

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

Якщо все ще не вдається:

- Повторно схваліть pairing пристрою.
- Повторно відкрийте застосунок node (foreground).
- Повторно надайте дозволи ОС.
- Створіть заново або скоригуйте політику схвалень exec.

Пов’язане:

- [/nodes/index](/nodes/index)
- [/nodes/camera](/nodes/camera)
- [/nodes/location-command](/nodes/location-command)
- [/tools/exec-approvals](/tools/exec-approvals)
- [/gateway/pairing](/gateway/pairing)
