---
read_when:
    - Ви хочете підтримку Zalo Personal (неофіційну) в OpenClaw
    - Ви налаштовуєте або розробляєте plugin zalouser
summary: 'Plugin Zalo Personal: вхід через QR + повідомлення через native `zca-js` (встановлення plugin + config каналу + інструмент)'
title: Plugin Zalo Personal
x-i18n:
    generated_at: "2026-04-05T18:13:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3218c3ee34f36466d952aec1b479d451a6235c7c46918beb28698234a7fd0968
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (plugin)

Підтримка Zalo Personal для OpenClaw через plugin, що використовує native `zca-js` для автоматизації звичайного особистого облікового запису Zalo.

> **Попередження:** Неофіційна автоматизація може призвести до призупинення або блокування облікового запису. Використовуйте на власний ризик.

## Назва

Ідентифікатор каналу — `zalouser`, щоб явно показати, що це автоматизація **особистого облікового запису користувача Zalo** (неофіційна). Ми залишаємо `zalo` зарезервованим для можливої майбутньої офіційної інтеграції Zalo API.

## Де це працює

Цей plugin працює **усередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, встановіть і налаштуйте його на **машині, де працює Gateway**, а потім перезапустіть Gateway.

Зовнішній CLI-бінар `zca`/`openzca` не потрібен.

## Встановлення

### Варіант A: встановлення з npm

```bash
openclaw plugins install @openclaw/zalouser
```

Після цього перезапустіть Gateway.

### Варіант B: встановлення з локальної папки (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Після цього перезапустіть Gateway.

## Config

Config каналу знаходиться в `channels.zalouser` (не в `plugins.entries.*`):

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## Інструмент агента

Назва інструмента: `zalouser`

Дії: `send`, `image`, `link`, `friends`, `groups`, `me`, `status`

Дії повідомлень каналу також підтримують `react` для реакцій на повідомлення.
