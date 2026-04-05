---
read_when:
    - Vous voulez une liste complète de ce que prend en charge OpenClaw
summary: Capacités d’OpenClaw sur les canaux, le routage, les médias et l’expérience utilisateur.
title: Fonctionnalités
x-i18n:
    generated_at: "2026-04-05T12:39:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43eae89d9af44ea786dd0221d8d602ebcea15da9d5064396ac9920c0345e2ad3
    source_path: concepts/features.md
    workflow: 15
---

# Fonctionnalités

## Points forts

<Columns>
  <Card title="Canaux" icon="message-square">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat et bien plus encore avec une seule Gateway.
  </Card>
  <Card title="Plugins" icon="plug">
    Les plugins intégrés ajoutent Matrix, Nextcloud Talk, Nostr, Twitch, Zalo et plus encore sans installation séparée dans les versions actuelles normales.
  </Card>
  <Card title="Routage" icon="route">
    Routage multi-agent avec sessions isolées.
  </Card>
  <Card title="Médias" icon="image">
    Images, audio, vidéo, documents, ainsi que génération d’images et de vidéos.
  </Card>
  <Card title="Applications et interface utilisateur" icon="monitor">
    Interface Control web et application compagnon macOS.
  </Card>
  <Card title="Nœuds mobiles" icon="smartphone">
    Nœuds iOS et Android avec appairage, voix/chat et commandes avancées pour l’appareil.
  </Card>
</Columns>

## Liste complète

**Canaux :**

- Les canaux intégrés incluent Discord, Google Chat, iMessage (hérité), IRC, Signal, Slack, Telegram, WebChat et WhatsApp
- Les canaux de plugin intégrés incluent BlueBubbles pour iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo et Zalo Personal
- Les plugins de canal facultatifs installés séparément incluent Voice Call et des paquets tiers comme WeChat
- Les plugins de canal tiers peuvent étendre davantage la Gateway, par exemple WeChat
- Prise en charge des discussions de groupe avec activation basée sur les mentions
- Sécurité des DM avec listes d’autorisation et appairage

**Agent :**

- Runtime d’agent embarqué avec streaming des outils
- Routage multi-agent avec sessions isolées par workspace ou par expéditeur
- Sessions : les conversations directes sont regroupées dans `main` ; les groupes sont isolés
- Streaming et découpage pour les réponses longues

**Authentification et fournisseurs :**

- Plus de 35 fournisseurs de modèles (Anthropic, OpenAI, Google, etc.)
- Authentification par abonnement via OAuth (par ex. OpenAI Codex)
- Prise en charge des fournisseurs personnalisés et auto-hébergés (vLLM, SGLang, Ollama et tout point de terminaison compatible OpenAI ou Anthropic)

**Médias :**

- Images, audio, vidéo et documents en entrée comme en sortie
- Surfaces de capacités partagées pour la génération d’images et de vidéos
- Transcription des messages vocaux
- Synthèse vocale avec plusieurs fournisseurs

**Applications et interfaces :**

- WebChat et interface Control dans le navigateur
- Application compagnon de barre de menus macOS
- Nœud iOS avec appairage, Canvas, appareil photo, enregistrement d’écran, localisation et voix
- Nœud Android avec appairage, chat, voix, Canvas, appareil photo et commandes de l’appareil

**Outils et automatisation :**

- Automatisation du navigateur, exec, sandboxing
- Recherche web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tâches cron et planification heartbeat
- Skills, plugins et pipelines de workflow (Lobster)
