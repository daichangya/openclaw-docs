---
read_when:
    - Ви хочете вибрати канал чату для OpenClaw
    - Вам потрібен короткий огляд підтримуваних платформ обміну повідомленнями
summary: Платформи обміну повідомленнями, до яких може підключатися OpenClaw
title: Канали чату
x-i18n:
    generated_at: "2026-04-05T17:57:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 246ee6f16aebe751241f00102bb435978ed21f6158385aff5d8e222e30567416
    source_path: channels/index.md
    workflow: 15
---

# Канали чату

OpenClaw може спілкуватися з вами в будь-якому чат-застосунку, яким ви вже користуєтеся. Кожен канал підключається через Gateway.
Текст підтримується всюди; підтримка медіа та реакцій залежить від каналу.

## Підтримувані канали

- [BlueBubbles](/channels/bluebubbles) — **Рекомендовано для iMessage**; використовує REST API сервера BlueBubbles для macOS із повною підтримкою функцій (вбудований плагін; редагування, скасування надсилання, ефекти, реакції, керування групами — редагування наразі не працює в macOS 26 Tahoe).
- [Discord](/channels/discord) — Discord Bot API + Gateway; підтримує сервери, канали та DM.
- [Feishu](/channels/feishu) — бот Feishu/Lark через WebSocket (вбудований плагін).
- [Google Chat](/channels/googlechat) — застосунок Google Chat API через HTTP-вебхук.
- [iMessage (legacy)](/channels/imessage) — застаріла інтеграція з macOS через CLI imsg (застаріло, для нових конфігурацій використовуйте BlueBubbles).
- [IRC](/channels/irc) — класичні IRC-сервери; канали + DM із контролем pairing/allowlist.
- [LINE](/channels/line) — бот LINE Messaging API (вбудований плагін).
- [Matrix](/channels/matrix) — протокол Matrix (вбудований плагін).
- [Mattermost](/channels/mattermost) — Bot API + WebSocket; канали, групи, DM (вбудований плагін).
- [Microsoft Teams](/channels/msteams) — Bot Framework; корпоративна підтримка (вбудований плагін).
- [Nextcloud Talk](/channels/nextcloud-talk) — self-hosted чат через Nextcloud Talk (вбудований плагін).
- [Nostr](/channels/nostr) — децентралізовані DM через NIP-04 (вбудований плагін).
- [QQ Bot](/channels/qqbot) — QQ Bot API; приватний чат, груповий чат і розширені медіа (вбудований плагін).
- [Signal](/channels/signal) — signal-cli; орієнтований на приватність.
- [Slack](/channels/slack) — Bolt SDK; застосунки для робочих просторів.
- [Synology Chat](/channels/synology-chat) — Synology NAS Chat через вихідні та вхідні вебхуки (вбудований плагін).
- [Telegram](/channels/telegram) — Bot API через grammY; підтримує групи.
- [Tlon](/channels/tlon) — месенджер на базі Urbit (вбудований плагін).
- [Twitch](/channels/twitch) — чат Twitch через IRC-з’єднання (вбудований плагін).
- [Voice Call](/plugins/voice-call) — телефонія через Plivo або Twilio (плагін, установлюється окремо).
- [WebChat](/web/webchat) — інтерфейс Gateway WebChat через WebSocket.
- [WeChat](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) — плагін Tencent iLink Bot через вхід за QR-кодом; лише приватні чати.
- [WhatsApp](/channels/whatsapp) — найпопулярніший; використовує Baileys і потребує pairing за QR-кодом.
- [Zalo](/channels/zalo) — Zalo Bot API; популярний месенджер у В’єтнамі (вбудований плагін).
- [Zalo Personal](/channels/zalouser) — особистий обліковий запис Zalo через вхід за QR-кодом (вбудований плагін).

## Примітки

- Канали можуть працювати одночасно; налаштуйте кілька, і OpenClaw виконуватиме маршрутизацію для кожного чату.
- Найшвидше зазвичай налаштовується **Telegram** (простий токен бота). WhatsApp потребує pairing за QR-кодом і
  зберігає більше стану на диску.
- Поведінка груп залежить від каналу; див. [Групи](/channels/groups).
- Для безпеки застосовуються pairing DM та allowlist; див. [Безпека](/gateway/security).
- Усунення проблем: [Усунення проблем каналів](/channels/troubleshooting).
- Провайдери моделей документовано окремо; див. [Провайдери моделей](/providers/models).
