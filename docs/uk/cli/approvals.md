---
read_when:
    - Ви хочете редагувати підтвердження виконання з CLI
    - Вам потрібно керувати списками дозволених на хостах Gateway або Node
summary: Довідник CLI для `openclaw approvals` і `openclaw exec-policy`
title: Підтвердження
x-i18n:
    generated_at: "2026-04-24T03:15:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7403f0e35616db5baf3d1564c8c405b3883fc3e5032da9c6a19a32dba8c5fb7d
    source_path: cli/approvals.md
    workflow: 15
---

# `openclaw approvals`

Керуйте підтвердженнями виконання для **локального хоста**, **хоста gateway** або **хоста node**.
За замовчуванням команди спрямовані на локальний файл підтверджень на диску. Використовуйте `--gateway`, щоб звертатися до gateway, або `--node`, щоб звертатися до конкретного node.

Псевдонім: `openclaw exec-approvals`

Пов’язано:

- Підтвердження виконання: [Підтвердження виконання](/uk/tools/exec-approvals)
- Nodes: [Nodes](/uk/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` — це локальна зручна команда для того, щоб за один крок підтримувати узгодженість між запитаною конфігурацією `tools.exec.*` і локальним файлом підтверджень хоста.

Використовуйте її, коли ви хочете:

- переглянути локальну запитану політику, файл підтверджень хоста та ефективне об’єднання
- застосувати локальний пресет, наприклад YOLO або deny-all
- синхронізувати локальні `tools.exec.*` і локальний `~/.openclaw/exec-approvals.json`

Приклади:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Режими виводу:

- без `--json`: виводить таблицю у зрозумілому для людини вигляді
- `--json`: виводить структурований формат, придатний для машинної обробки

Поточний обсяг дії:

- `exec-policy` є **лише локальною**
- вона оновлює локальний файл конфігурації та локальний файл підтверджень разом
- вона **не** надсилає політику на хост gateway або хост node
- `--host node` відхиляється в цій команді, оскільки підтвердження виконання node отримуються з node під час виконання і натомість мають керуватися через команди підтверджень, націлені на node
- `openclaw exec-policy show` позначає області `host=node` як керовані node під час виконання замість виведення ефективної політики з локального файла підтверджень

Якщо вам потрібно безпосередньо редагувати підтвердження віддаленого хоста, продовжуйте використовувати `openclaw approvals set --gateway`
або `openclaw approvals set --node <id|name|ip>`.

## Поширені команди

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` тепер показує ефективну політику виконання для локальних, gateway і node-цілей:

- запитана політика `tools.exec`
- політика файла підтверджень хоста
- ефективний результат після застосування правил пріоритету

Пріоритет навмисний:

- файл підтверджень хоста є джерелом істини, яке реально застосовується
- запитана політика `tools.exec` може звужувати або розширювати намір, але ефективний результат усе одно виводиться з правил хоста
- `--node` поєднує файл підтверджень хоста node з політикою `tools.exec` gateway, оскільки обидва все ще застосовуються під час виконання
- якщо конфігурація gateway недоступна, CLI повертається до знімка підтверджень node і зазначає, що остаточну політику під час виконання не вдалося обчислити

## Замінити підтвердження з файла

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` приймає JSON5, а не лише строгий JSON. Використовуйте або `--file`, або `--stdin`, не обидва одразу.

## Приклад «Ніколи не запитувати» / YOLO

Для хоста, який ніколи не повинен зупинятися на підтвердженнях виконання, встановіть для типових значень підтверджень хоста `full` + `off`:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Варіант для node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Це змінює лише **файл підтверджень хоста**. Щоб зберегти узгодженість із запитаною політикою OpenClaw, також установіть:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Чому `tools.exec.host=gateway` у цьому прикладі:

- `host=auto` усе ще означає «пісочниця, якщо доступна, інакше gateway».
- YOLO стосується підтверджень, а не маршрутизації.
- Якщо ви хочете виконання на хості навіть тоді, коли налаштовано пісочницю, явно вкажіть вибір хоста через `gateway` або `/exec host=gateway`.

Це відповідає поточній поведінці YOLO за замовчуванням для хоста. Посильте обмеження, якщо вам потрібні підтвердження.

Локальне скорочення:

```bash
openclaw exec-policy preset yolo
```

Це локальне скорочення оновлює і запитану локальну конфігурацію `tools.exec.*`, і
локальні типові значення підтверджень разом. За наміром воно еквівалентне наведеному вище ручному налаштуванню в два кроки, але лише для локальної машини.

## Допоміжні команди списку дозволених

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Поширені параметри

`get`, `set` і `allowlist add|remove` усі підтримують:

- `--node <id|name|ip>`
- `--gateway`
- спільні параметри node RPC: `--url`, `--token`, `--timeout`, `--json`

Примітки щодо націлювання:

- без прапорців цілі мається на увазі локальний файл підтверджень на диску
- `--gateway` націлюється на файл підтверджень хоста gateway
- `--node` націлюється на один хост node після визначення за id, name, IP або префіксом id

`allowlist add|remove` також підтримує:

- `--agent <id>` (типово `*`)

## Примітки

- `--node` використовує той самий механізм визначення, що й `openclaw nodes` (id, name, ip або префікс id).
- Типове значення `--agent` — `"*"`, що застосовується до всіх агентів.
- Хост node має оголошувати `system.execApprovals.get/set` (застосунок macOS або headless node host).
- Файли підтверджень зберігаються окремо для кожного хоста в `~/.openclaw/exec-approvals.json`.

## Пов’язано

- [Довідник CLI](/uk/cli)
- [Підтвердження виконання](/uk/tools/exec-approvals)
