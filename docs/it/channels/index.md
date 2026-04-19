---
read_when:
    - Vuoi scegliere un canale di chat per OpenClaw
    - Ti serve una rapida panoramica delle piattaforme di messaggistica supportate
summary: Piattaforme di messaggistica a cui OpenClaw può connettersi
title: Canali di chat
x-i18n:
    generated_at: "2026-04-19T01:11:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: d41c3a37d91c07f15afd8e199a289297772331c70e38697346a373595eb2d993
    source_path: channels/index.md
    workflow: 15
---

# Canali di chat

OpenClaw può parlarti su qualsiasi app di chat che già usi. Ogni canale si connette tramite il Gateway.
Il testo è supportato ovunque; contenuti multimediali e reazioni variano in base al canale.

## Canali supportati

- [BlueBubbles](/it/channels/bluebubbles) — **Consigliato per iMessage**; usa la REST API del server macOS BlueBubbles con supporto completo delle funzionalità (Plugin incluso; modifica, annulla invio, effetti, reazioni, gestione dei gruppi — la modifica è attualmente non funzionante su macOS 26 Tahoe).
- [Discord](/it/channels/discord) — API Bot + Gateway di Discord; supporta server, canali e messaggi diretti.
- [Feishu](/it/channels/feishu) — bot Feishu/Lark tramite WebSocket (Plugin incluso).
- [Google Chat](/it/channels/googlechat) — app Google Chat API tramite Webhook HTTP.
- [iMessage (legacy)](/it/channels/imessage) — integrazione macOS legacy tramite CLI imsg (deprecata, usa BlueBubbles per le nuove configurazioni).
- [IRC](/it/channels/irc) — server IRC classici; canali + messaggi diretti con controlli di pairing/allowlist.
- [LINE](/it/channels/line) — bot LINE Messaging API (Plugin incluso).
- [Matrix](/it/channels/matrix) — protocollo Matrix (Plugin incluso).
- [Mattermost](/it/channels/mattermost) — API Bot + WebSocket; canali, gruppi, messaggi diretti (Plugin incluso).
- [Microsoft Teams](/it/channels/msteams) — Bot Framework; supporto enterprise (Plugin incluso).
- [Nextcloud Talk](/it/channels/nextcloud-talk) — chat self-hosted tramite Nextcloud Talk (Plugin incluso).
- [Nostr](/it/channels/nostr) — messaggi diretti decentralizzati tramite NIP-04 (Plugin incluso).
- [QQ Bot](/it/channels/qqbot) — API QQ Bot; chat private, chat di gruppo e contenuti multimediali avanzati (Plugin incluso).
- [Signal](/it/channels/signal) — signal-cli; orientato alla privacy.
- [Slack](/it/channels/slack) — SDK Bolt; app per workspace.
- [Synology Chat](/it/channels/synology-chat) — chat Synology NAS tramite Webhook in uscita + in entrata (Plugin incluso).
- [Telegram](/it/channels/telegram) — Bot API tramite grammY; supporta i gruppi.
- [Tlon](/it/channels/tlon) — messenger basato su Urbit (Plugin incluso).
- [Twitch](/it/channels/twitch) — chat Twitch tramite connessione IRC (Plugin incluso).
- [Voice Call](/it/plugins/voice-call) — telefonia tramite Plivo o Twilio (plugin, installato separatamente).
- [WebChat](/web/webchat) — interfaccia WebChat del Gateway tramite WebSocket.
- [WeChat](/it/channels/wechat) — plugin Tencent iLink Bot tramite accesso con QR; solo chat private (plugin esterno).
- [WhatsApp](/it/channels/whatsapp) — il più popolare; usa Baileys e richiede l'associazione tramite QR.
- [Zalo](/it/channels/zalo) — API Zalo Bot; il popolare messenger del Vietnam (Plugin incluso).
- [Zalo Personal](/it/channels/zalouser) — account personale Zalo tramite accesso con QR (Plugin incluso).

## Note

- I canali possono essere eseguiti contemporaneamente; configurane più di uno e OpenClaw instraderà per chat.
- La configurazione più rapida di solito è **Telegram** (semplice token del bot). WhatsApp richiede l'associazione tramite QR e
  memorizza più stato su disco.
- Il comportamento dei gruppi varia in base al canale; vedi [Groups](/it/channels/groups).
- Il pairing dei messaggi diretti e le allowlist vengono applicati per sicurezza; vedi [Security](/it/gateway/security).
- Risoluzione dei problemi: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).
- I provider di modelli sono documentati separatamente; vedi [Provider di modelli](/it/providers/models).
