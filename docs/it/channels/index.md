---
read_when:
    - Vuoi scegliere un canale di chat per OpenClaw
    - Hai bisogno di una rapida panoramica delle piattaforme di messaggistica supportate
summary: Piattaforme di messaggistica a cui OpenClaw può connettersi
title: Canali di chat
x-i18n:
    generated_at: "2026-04-25T13:41:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: e97818dce89ea06a60f2cccd0cc8a78cba48d66ea39e4769f2b583690a4f75d0
    source_path: channels/index.md
    workflow: 15
---

OpenClaw può parlarti su qualsiasi app di chat che usi già. Ogni canale si connette tramite il Gateway.
Il testo è supportato ovunque; media e reazioni variano in base al canale.

## Note di consegna

- Le risposte di Telegram che contengono sintassi markdown per immagini, come `![alt](url)`,
  vengono convertite in risposte multimediali nel percorso finale in uscita quando possibile.
- I DM Slack con più persone vengono instradati come chat di gruppo, quindi ai conversazioni MPIM si applicano i criteri di gruppo, il comportamento delle menzioni e le regole delle sessioni di gruppo.
- La configurazione di WhatsApp è install-on-demand: l'onboarding può mostrare il flusso di configurazione prima che le dipendenze runtime di Baileys siano predisposte, e il Gateway carica il runtime di WhatsApp solo quando il canale è effettivamente attivo.

## Canali supportati

- [BlueBubbles](/it/channels/bluebubbles) — **Consigliato per iMessage**; usa l'API REST del server macOS BlueBubbles con supporto completo delle funzionalità (Plugin incluso; modifica, annullamento dell'invio, effetti, reazioni, gestione dei gruppi — la modifica è attualmente non funzionante su macOS 26 Tahoe).
- [Discord](/it/channels/discord) — API Bot Discord + Gateway; supporta server, canali e DM.
- [Feishu](/it/channels/feishu) — bot Feishu/Lark tramite WebSocket (Plugin incluso).
- [Google Chat](/it/channels/googlechat) — app API Google Chat tramite HTTP Webhook.
- [iMessage (legacy)](/it/channels/imessage) — integrazione macOS legacy tramite CLI imsg (deprecato, usa BlueBubbles per le nuove configurazioni).
- [IRC](/it/channels/irc) — server IRC classici; canali + DM con controlli di pairing/allowlist.
- [LINE](/it/channels/line) — bot API LINE Messaging (Plugin incluso).
- [Matrix](/it/channels/matrix) — protocollo Matrix (Plugin incluso).
- [Mattermost](/it/channels/mattermost) — API Bot + WebSocket; canali, gruppi, DM (Plugin incluso).
- [Microsoft Teams](/it/channels/msteams) — Bot Framework; supporto enterprise (Plugin incluso).
- [Nextcloud Talk](/it/channels/nextcloud-talk) — chat self-hosted tramite Nextcloud Talk (Plugin incluso).
- [Nostr](/it/channels/nostr) — DM decentralizzati tramite NIP-04 (Plugin incluso).
- [QQ Bot](/it/channels/qqbot) — API QQ Bot; chat private, chat di gruppo e rich media (Plugin incluso).
- [Signal](/it/channels/signal) — signal-cli; orientato alla privacy.
- [Slack](/it/channels/slack) — SDK Bolt; app per workspace.
- [Synology Chat](/it/channels/synology-chat) — chat Synology NAS tramite Webhook in uscita+in ingresso (Plugin incluso).
- [Telegram](/it/channels/telegram) — API Bot tramite grammY; supporta i gruppi.
- [Tlon](/it/channels/tlon) — messenger basato su Urbit (Plugin incluso).
- [Twitch](/it/channels/twitch) — chat Twitch tramite connessione IRC (Plugin incluso).
- [Voice Call](/it/plugins/voice-call) — telefonia tramite Plivo o Twilio (Plugin, installato separatamente).
- [WebChat](/it/web/webchat) — interfaccia utente Gateway WebChat tramite WebSocket.
- [WeChat](/it/channels/wechat) — Plugin Tencent iLink Bot tramite accesso con QR; solo chat private (Plugin esterno).
- [WhatsApp](/it/channels/whatsapp) — il più popolare; usa Baileys e richiede l'associazione tramite QR.
- [Zalo](/it/channels/zalo) — API Zalo Bot; il popolare messenger del Vietnam (Plugin incluso).
- [Zalo Personal](/it/channels/zalouser) — account personale Zalo tramite accesso con QR (Plugin incluso).

## Note

- I canali possono essere eseguiti simultaneamente; configurane più di uno e OpenClaw instraderà per chat.
- La configurazione più rapida di solito è **Telegram** (semplice token bot). WhatsApp richiede l'associazione tramite QR e
  memorizza più stato su disco.
- Il comportamento dei gruppi varia in base al canale; vedi [Groups](/it/channels/groups).
- Il pairing dei DM e le allowlist vengono applicati per sicurezza; vedi [Security](/it/gateway/security).
- Risoluzione dei problemi: [Risoluzione dei problemi dei canali](/it/channels/troubleshooting).
- I provider di modelli sono documentati separatamente; vedi [Model Providers](/it/providers/models).
