---
read_when:
    - Vous voulez choisir un canal de chat pour OpenClaw
    - Vous avez besoin d’une vue d’ensemble rapide des plateformes de messagerie prises en charge
summary: Plateformes de messagerie auxquelles OpenClaw peut se connecter
title: Canaux de chat
x-i18n:
    generated_at: "2026-04-05T12:35:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 246ee6f16aebe751241f00102bb435978ed21f6158385aff5d8e222e30567416
    source_path: channels/index.md
    workflow: 15
---

# Canaux de chat

OpenClaw peut vous parler sur n’importe quelle application de chat que vous utilisez déjà. Chaque canal se connecte via la Gateway.
Le texte est pris en charge partout ; la prise en charge des médias et des réactions varie selon le canal.

## Canaux pris en charge

- [BlueBubbles](/channels/bluebubbles) — **Recommandé pour iMessage** ; utilise l’API REST du serveur macOS BlueBubbles avec une prise en charge complète des fonctionnalités (plugin intégré ; modification, annulation d’envoi, effets, réactions, gestion de groupe — la modification est actuellement défaillante sur macOS 26 Tahoe).
- [Discord](/channels/discord) — API Bot Discord + Gateway ; prend en charge les serveurs, les canaux et les messages privés.
- [Feishu](/channels/feishu) — bot Feishu/Lark via WebSocket (plugin intégré).
- [Google Chat](/channels/googlechat) — application Google Chat API via webhook HTTP.
- [iMessage (legacy)](/channels/imessage) — intégration macOS historique via la CLI imsg (obsolète, utilisez BlueBubbles pour les nouvelles configurations).
- [IRC](/channels/irc) — serveurs IRC classiques ; canaux + messages privés avec contrôles d’appairage et de liste d’autorisation.
- [LINE](/channels/line) — bot LINE Messaging API (plugin intégré).
- [Matrix](/channels/matrix) — protocole Matrix (plugin intégré).
- [Mattermost](/channels/mattermost) — API Bot + WebSocket ; canaux, groupes, messages privés (plugin intégré).
- [Microsoft Teams](/channels/msteams) — Bot Framework ; prise en charge des entreprises (plugin intégré).
- [Nextcloud Talk](/channels/nextcloud-talk) — chat auto-hébergé via Nextcloud Talk (plugin intégré).
- [Nostr](/channels/nostr) — messages privés décentralisés via NIP-04 (plugin intégré).
- [QQ Bot](/channels/qqbot) — API QQ Bot ; chat privé, chat de groupe et médias enrichis (plugin intégré).
- [Signal](/channels/signal) — signal-cli ; axé sur la confidentialité.
- [Slack](/channels/slack) — SDK Bolt ; applications d’espace de travail.
- [Synology Chat](/channels/synology-chat) — chat Synology NAS via webhooks sortants + entrants (plugin intégré).
- [Telegram](/channels/telegram) — API Bot via grammY ; prend en charge les groupes.
- [Tlon](/channels/tlon) — messagerie basée sur Urbit (plugin intégré).
- [Twitch](/channels/twitch) — chat Twitch via connexion IRC (plugin intégré).
- [Voice Call](/plugins/voice-call) — téléphonie via Plivo ou Twilio (plugin, installé séparément).
- [WebChat](/web/webchat) — interface Gateway WebChat via WebSocket.
- [WeChat](https://www.npmjs.com/package/@tencent-weixin/openclaw-weixin) — plugin Tencent iLink Bot via connexion QR ; chats privés uniquement.
- [WhatsApp](/channels/whatsapp) — le plus populaire ; utilise Baileys et nécessite un appairage par QR.
- [Zalo](/channels/zalo) — API Zalo Bot ; messagerie populaire au Vietnam (plugin intégré).
- [Zalo Personal](/channels/zalouser) — compte personnel Zalo via connexion QR (plugin intégré).

## Remarques

- Les canaux peuvent fonctionner simultanément ; configurez-en plusieurs et OpenClaw effectuera le routage selon la discussion.
- La configuration la plus rapide est généralement **Telegram** (jeton de bot simple). WhatsApp nécessite un appairage par QR et
  stocke davantage d’état sur le disque.
- Le comportement des groupes varie selon le canal ; voir [Groupes](/channels/groups).
- L’appairage des messages privés et les listes d’autorisation sont appliqués pour des raisons de sécurité ; voir [Sécurité](/gateway/security).
- Résolution des problèmes : [Résolution des problèmes des canaux](/channels/troubleshooting).
- Les fournisseurs de modèles sont documentés séparément ; voir [Fournisseurs de modèles](/providers/models).
