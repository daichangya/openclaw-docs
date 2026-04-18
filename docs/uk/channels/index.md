---
read_when:
    - Ви хочете вибрати чат-канал для OpenClaw
    - Вам потрібен короткий огляд підтримуваних платформ обміну повідомленнями
summary: Платформи обміну повідомленнями, до яких може підключатися OpenClaw
title: Чати-канали
x-i18n:
    generated_at: "2026-04-18T17:28:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: d41c3a37d91c07f15afd8e199a289297772331c70e38697346a373595eb2d993
    source_path: channels/index.md
    workflow: 15
---

# Чат-канали

OpenClaw може спілкуватися з вами в будь-якому чат-застосунку, яким ви вже користуєтеся. Кожен канал підключається через Gateway.
Текст підтримується всюди; підтримка медіа та реакцій залежить від каналу.

## Підтримувані канали

- [BlueBubbles](/uk/channels/bluebubbles) — **Рекомендовано для iMessage**; використовує REST API сервера BlueBubbles на macOS із повною підтримкою функцій (вбудований Plugin; редагування, скасування надсилання, ефекти, реакції, керування групами — редагування наразі не працює в macOS 26 Tahoe).
- [Discord](/uk/channels/discord) — Discord Bot API + Gateway; підтримує сервери, канали та приватні повідомлення.
- [Feishu](/uk/channels/feishu) — бот Feishu/Lark через WebSocket (вбудований Plugin).
- [Google Chat](/uk/channels/googlechat) — застосунок Google Chat API через HTTP Webhook.
- [iMessage (legacy)](/uk/channels/imessage) — застаріла інтеграція з macOS через CLI imsg (застаріло, для нових налаштувань використовуйте BlueBubbles).
- [IRC](/uk/channels/irc) — класичні IRC-сервери; канали та приватні повідомлення з елементами керування pairing/allowlist.
- [LINE](/uk/channels/line) — бот LINE Messaging API (вбудований Plugin).
- [Matrix](/uk/channels/matrix) — протокол Matrix (вбудований Plugin).
- [Mattermost](/uk/channels/mattermost) — Bot API + WebSocket; канали, групи, приватні повідомлення (вбудований Plugin).
- [Microsoft Teams](/uk/channels/msteams) — Bot Framework; підтримка для підприємств (вбудований Plugin).
- [Nextcloud Talk](/uk/channels/nextcloud-talk) — самостійно розміщений чат через Nextcloud Talk (вбудований Plugin).
- [Nostr](/uk/channels/nostr) — децентралізовані приватні повідомлення через NIP-04 (вбудований Plugin).
- [QQ Bot](/uk/channels/qqbot) — QQ Bot API; приватний чат, груповий чат і розширені медіа (вбудований Plugin).
- [Signal](/uk/channels/signal) — signal-cli; орієнтований на конфіденційність.
- [Slack](/uk/channels/slack) — Bolt SDK; застосунки робочих просторів.
- [Synology Chat](/uk/channels/synology-chat) — Synology NAS Chat через вихідні та вхідні Webhook (вбудований Plugin).
- [Telegram](/uk/channels/telegram) — Bot API через grammY; підтримує групи.
- [Tlon](/uk/channels/tlon) — месенджер на базі Urbit (вбудований Plugin).
- [Twitch](/uk/channels/twitch) — чат Twitch через підключення IRC (вбудований Plugin).
- [Voice Call](/uk/plugins/voice-call) — телефонія через Plivo або Twilio (Plugin, встановлюється окремо).
- [WebChat](/web/webchat) — інтерфейс Gateway WebChat через WebSocket.
- [WeChat](/uk/channels/wechat) — Plugin Tencent iLink Bot через вхід за QR-кодом; лише приватні чати (зовнішній Plugin).
- [WhatsApp](/uk/channels/whatsapp) — найпопулярніший; використовує Baileys і потребує pairing за QR-кодом.
- [Zalo](/uk/channels/zalo) — Zalo Bot API; популярний месенджер у В’єтнамі (вбудований Plugin).
- [Zalo Personal](/uk/channels/zalouser) — особистий обліковий запис Zalo через вхід за QR-кодом (вбудований Plugin).

## Примітки

- Канали можуть працювати одночасно; налаштуйте кілька, і OpenClaw виконуватиме маршрутизацію для кожного чату.
- Найшвидше зазвичай налаштувати **Telegram** (простий токен бота). WhatsApp потребує pairing за QR-кодом і
  зберігає більше стану на диску.
- Поведінка в групах залежить від каналу; див. [Групи](/uk/channels/groups).
- Pairing приватних повідомлень і allowlist примусово застосовуються з міркувань безпеки; див. [Безпека](/uk/gateway/security).
- Усунення несправностей: [Усунення несправностей каналів](/uk/channels/troubleshooting).
- Постачальники моделей документовані окремо; див. [Постачальники моделей](/uk/providers/models).
