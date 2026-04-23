---
read_when:
    - Ви хочете підтримку Zalo Personal (неофіційну) в OpenClaw
    - Ви налаштовуєте або розробляєте Plugin `zalouser`
summary: 'Plugin Zalo Personal: вхід через QR + обмін повідомленнями через власний `zca-js` (встановлення Plugin + config каналу + інструмент)'
title: Plugin Zalo Personal
x-i18n:
    generated_at: "2026-04-23T23:04:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: d678bd55fd405a9c689d1202870cc03bfb825a9314c433a0ab729d376e3b67a3
    source_path: plugins/zalouser.md
    workflow: 15
---

# Zalo Personal (Plugin)

Підтримка Zalo Personal для OpenClaw через Plugin із використанням власного `zca-js` для автоматизації звичайного облікового запису користувача Zalo.

> **Попередження:** Неофіційна автоматизація може призвести до призупинення/блокування облікового запису. Використовуйте на власний ризик.

## Назва

Id каналу — `zalouser`, щоб явно показати, що це автоматизація **особистого облікового запису користувача Zalo** (неофіційна). Назву `zalo` ми залишаємо зарезервованою для можливої майбутньої офіційної інтеграції через API Zalo.

## Де це працює

Цей Plugin працює **всередині процесу Gateway**.

Якщо ви використовуєте віддалений Gateway, установіть/налаштуйте його на **машині, де працює Gateway**, а потім перезапустіть Gateway.

Зовнішній бінарний файл CLI `zca`/`openzca` не потрібен.

## Встановлення

### Варіант A: установлення з npm

```bash
openclaw plugins install @openclaw/zalouser
```

Після цього перезапустіть Gateway.

### Варіант B: установлення з локальної папки (dev)

```bash
PLUGIN_SRC=./path/to/local/zalouser-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Після цього перезапустіть Gateway.

## Config

Config каналу розміщується в `channels.zalouser` (не в `plugins.entries.*`):

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

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Спільнотні Plugin](/uk/plugins/community)
