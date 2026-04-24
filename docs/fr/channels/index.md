---
read_when:
    - Vous souhaitez choisir un canal de chat pour OpenClaw
    - Vous avez besoin d’un aperçu rapide des plateformes de messagerie prises en charge
summary: Plateformes de messagerie auxquelles OpenClaw peut se connecter
title: Canaux de chat
x-i18n:
    generated_at: "2026-04-24T07:00:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: c016b78b16724e73b21946d6bed0009f4cbebd1f887620431b9b4bff70f2b1ff
    source_path: channels/index.md
    workflow: 15
---

OpenClaw peut vous parler sur n’importe quelle application de chat que vous utilisez déjà. Chaque canal se connecte via le Gateway.
Le texte est pris en charge partout ; les médias et les réactions varient selon le canal.

## Canaux pris en charge

- [BlueBubbles](/fr/channels/bluebubbles) — **Recommandé pour iMessage** ; utilise l’API REST du serveur macOS BlueBubbles avec prise en charge complète des fonctionnalités (Plugin intégré ; modification, annulation d’envoi, effets, réactions, gestion des groupes — la modification est actuellement cassée sur macOS 26 Tahoe).
- [Discord](/fr/channels/discord) — API Bot Discord + Gateway ; prend en charge les serveurs, les canaux et les DM.
- [Feishu](/fr/channels/feishu) — bot Feishu/Lark via WebSocket (Plugin intégré).
- [Google Chat](/fr/channels/googlechat) — application API Google Chat via Webhook HTTP.
- [iMessage (legacy)](/fr/channels/imessage) — intégration macOS héritée via CLI imsg (déconseillé, utilisez BlueBubbles pour les nouvelles configurations).
- [IRC](/fr/channels/irc) — serveurs IRC classiques ; canaux + DM avec contrôles de jumelage/liste d’autorisation.
- [LINE](/fr/channels/line) — bot API LINE Messaging (Plugin intégré).
- [Matrix](/fr/channels/matrix) — protocole Matrix (Plugin intégré).
- [Mattermost](/fr/channels/mattermost) — API Bot + WebSocket ; canaux, groupes, DM (Plugin intégré).
- [Microsoft Teams](/fr/channels/msteams) — Bot Framework ; prise en charge entreprise (Plugin intégré).
- [Nextcloud Talk](/fr/channels/nextcloud-talk) — chat auto-hébergé via Nextcloud Talk (Plugin intégré).
- [Nostr](/fr/channels/nostr) — DM décentralisés via NIP-04 (Plugin intégré).
- [QQ Bot](/fr/channels/qqbot) — API QQ Bot ; chat privé, chat de groupe et médias enrichis (Plugin intégré).
- [Signal](/fr/channels/signal) — signal-cli ; orienté confidentialité.
- [Slack](/fr/channels/slack) — SDK Bolt ; applications d’espace de travail.
- [Synology Chat](/fr/channels/synology-chat) — chat Synology NAS via Webhooks sortants + entrants (Plugin intégré).
- [Telegram](/fr/channels/telegram) — API Bot via grammY ; prend en charge les groupes.
- [Tlon](/fr/channels/tlon) — messagerie basée sur Urbit (Plugin intégré).
- [Twitch](/fr/channels/twitch) — chat Twitch via connexion IRC (Plugin intégré).
- [Voice Call](/fr/plugins/voice-call) — téléphonie via Plivo ou Twilio (Plugin, installé séparément).
- [WebChat](/fr/web/webchat) — interface Gateway WebChat via WebSocket.
- [WeChat](/fr/channels/wechat) — Plugin bot Tencent iLink via connexion par QR ; chats privés uniquement (Plugin externe).
- [WhatsApp](/fr/channels/whatsapp) — le plus populaire ; utilise Baileys et nécessite un jumelage par QR.
- [Zalo](/fr/channels/zalo) — API Zalo Bot ; messagerie populaire au Vietnam (Plugin intégré).
- [Zalo Personal](/fr/channels/zalouser) — compte personnel Zalo via connexion par QR (Plugin intégré).

## Notes

- Les canaux peuvent fonctionner simultanément ; configurez-en plusieurs et OpenClaw assurera le routage selon le chat.
- La configuration la plus rapide est généralement **Telegram** (jeton de bot simple). WhatsApp nécessite un jumelage par QR et
  stocke davantage d’état sur disque.
- Le comportement des groupes varie selon le canal ; consultez [Groups](/fr/channels/groups).
- Le jumelage des DM et les listes d’autorisation sont appliqués pour des raisons de sécurité ; consultez [Security](/fr/gateway/security).
- Dépannage : [Dépannage des canaux](/fr/channels/troubleshooting).
- Les fournisseurs de modèles sont documentés séparément ; consultez [Model Providers](/fr/providers/models).
