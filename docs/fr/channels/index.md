---
read_when:
    - Vous souhaitez choisir un canal de discussion pour OpenClaw
    - Vous avez besoin d’un aperçu rapide des plateformes de messagerie prises en charge
summary: Les plateformes de messagerie auxquelles OpenClaw peut se connecter
title: Canaux de discussion
x-i18n:
    generated_at: "2026-04-19T01:11:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: d41c3a37d91c07f15afd8e199a289297772331c70e38697346a373595eb2d993
    source_path: channels/index.md
    workflow: 15
---

# Canaux de discussion

OpenClaw peut vous parler sur n’importe quelle application de discussion que vous utilisez déjà. Chaque canal se connecte via le Gateway.
Le texte est pris en charge partout ; les médias et les réactions varient selon le canal.

## Canaux pris en charge

- [BlueBubbles](/fr/channels/bluebubbles) — **Recommandé pour iMessage** ; utilise l’API REST du serveur macOS BlueBubbles avec prise en charge complète des fonctionnalités (Plugin intégré ; modification, annulation d’envoi, effets, réactions, gestion des groupes — la modification est actuellement cassée sur macOS 26 Tahoe).
- [Discord](/fr/channels/discord) — API Bot Discord + Gateway ; prend en charge les serveurs, les canaux et les messages privés.
- [Feishu](/fr/channels/feishu) — Bot Feishu/Lark via WebSocket (Plugin intégré).
- [Google Chat](/fr/channels/googlechat) — application API Google Chat via Webhook HTTP.
- [iMessage (legacy)](/fr/channels/imessage) — intégration macOS héritée via l’outil CLI imsg (obsolète, utilisez BlueBubbles pour les nouvelles configurations).
- [IRC](/fr/channels/irc) — serveurs IRC classiques ; canaux + messages privés avec contrôles d’appairage/liste d’autorisation.
- [LINE](/fr/channels/line) — bot API LINE (Plugin intégré).
- [Matrix](/fr/channels/matrix) — protocole Matrix (Plugin intégré).
- [Mattermost](/fr/channels/mattermost) — API Bot + WebSocket ; canaux, groupes, messages privés (Plugin intégré).
- [Microsoft Teams](/fr/channels/msteams) — Bot Framework ; prise en charge entreprise (Plugin intégré).
- [Nextcloud Talk](/fr/channels/nextcloud-talk) — discussion auto-hébergée via Nextcloud Talk (Plugin intégré).
- [Nostr](/fr/channels/nostr) — messages privés décentralisés via NIP-04 (Plugin intégré).
- [QQ Bot](/fr/channels/qqbot) — API QQ Bot ; discussion privée, discussion de groupe et médias riches (Plugin intégré).
- [Signal](/fr/channels/signal) — signal-cli ; axé sur la confidentialité.
- [Slack](/fr/channels/slack) — SDK Bolt ; applications d’espace de travail.
- [Synology Chat](/fr/channels/synology-chat) — discussion Synology NAS via Webhooks sortants + entrants (Plugin intégré).
- [Telegram](/fr/channels/telegram) — API Bot via grammY ; prend en charge les groupes.
- [Tlon](/fr/channels/tlon) — messagerie basée sur Urbit (Plugin intégré).
- [Twitch](/fr/channels/twitch) — chat Twitch via connexion IRC (Plugin intégré).
- [Voice Call](/fr/plugins/voice-call) — téléphonie via Plivo ou Twilio (Plugin, installé séparément).
- [WebChat](/web/webchat) — interface Gateway WebChat via WebSocket.
- [WeChat](/fr/channels/wechat) — Plugin Tencent iLink Bot via connexion QR ; discussions privées uniquement (Plugin externe).
- [WhatsApp](/fr/channels/whatsapp) — le plus populaire ; utilise Baileys et nécessite un appairage par QR code.
- [Zalo](/fr/channels/zalo) — API Zalo Bot ; la messagerie populaire du Vietnam (Plugin intégré).
- [Zalo Personal](/fr/channels/zalouser) — compte personnel Zalo via connexion QR (Plugin intégré).

## Remarques

- Les canaux peuvent fonctionner simultanément ; configurez-en plusieurs et OpenClaw fera le routage par discussion.
- La configuration la plus rapide est généralement **Telegram** (jeton de bot simple). WhatsApp nécessite un appairage par QR code et
  stocke davantage d’état sur disque.
- Le comportement des groupes varie selon le canal ; voir [Groups](/fr/channels/groups).
- L’appairage des messages privés et les listes d’autorisation sont appliqués pour des raisons de sécurité ; voir [Security](/fr/gateway/security).
- Dépannage : [Dépannage des canaux](/fr/channels/troubleshooting).
- Les fournisseurs de modèles sont documentés séparément ; voir [Model Providers](/fr/providers/models).
