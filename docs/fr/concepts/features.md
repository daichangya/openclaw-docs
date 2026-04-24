---
read_when:
    - Vous souhaitez une liste complète de ce que prend en charge OpenClaw
summary: Capacités d’OpenClaw sur les différents canaux, le routage, les médias et l’expérience utilisateur.
title: Fonctionnalités
x-i18n:
    generated_at: "2026-04-24T07:06:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 15
---

## Points forts

<Columns>
  <Card title="Canaux" icon="message-square" href="/fr/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat et plus encore avec un seul Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/fr/tools/plugin">
    Les plugins intégrés ajoutent Matrix, Nextcloud Talk, Nostr, Twitch, Zalo et plus encore sans installation séparée dans les versions actuelles normales.
  </Card>
  <Card title="Routage" icon="route" href="/fr/concepts/multi-agent">
    Routage multi-agent avec sessions isolées.
  </Card>
  <Card title="Médias" icon="image" href="/fr/nodes/images">
    Images, audio, vidéo, documents, ainsi que génération d’images et de vidéos.
  </Card>
  <Card title="Applications et interface utilisateur" icon="monitor" href="/fr/web/control-ui">
    Interface utilisateur Web Control et application compagnon macOS.
  </Card>
  <Card title="Nœuds mobiles" icon="smartphone" href="/fr/nodes">
    Nœuds iOS et Android avec appairage, voix/chat et commandes avancées pour l’appareil.
  </Card>
</Columns>

## Liste complète

**Canaux :**

- Les canaux intégrés incluent Discord, Google Chat, iMessage (hérité), IRC, Signal, Slack, Telegram, WebChat et WhatsApp
- Les canaux de Plugin intégrés incluent BlueBubbles pour iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo et Zalo Personal
- Les plugins de canal facultatifs installés séparément incluent Voice Call et des packages tiers comme WeChat
- Des plugins de canal tiers peuvent étendre davantage le Gateway, comme WeChat
- Prise en charge des discussions de groupe avec activation par mention
- Sécurité des messages privés avec listes d’autorisation et appairage

**Agent :**

- Runtime d’agent intégré avec streaming des outils
- Routage multi-agent avec sessions isolées par espace de travail ou par expéditeur
- Sessions : les discussions directes sont regroupées dans `main` ; les groupes sont isolés
- Streaming et segmentation pour les longues réponses

**Authentification et fournisseurs :**

- Plus de 35 fournisseurs de modèles (Anthropic, OpenAI, Google, et plus)
- Authentification par abonnement via OAuth (par exemple OpenAI Codex)
- Prise en charge des fournisseurs personnalisés et auto-hébergés (vLLM, SGLang, Ollama, ainsi que tout endpoint compatible OpenAI ou compatible Anthropic)

**Médias :**

- Images, audio, vidéo et documents en entrée et en sortie
- Surfaces de capacité partagées pour la génération d’images et la génération de vidéos
- Transcription des notes vocales
- Synthèse vocale avec plusieurs fournisseurs

**Applications et interfaces :**

- WebChat et interface utilisateur browser Control UI
- Application compagnon macOS dans la barre de menus
- Nœud iOS avec appairage, Canvas, caméra, enregistrement d’écran, localisation et voix
- Nœud Android avec appairage, chat, voix, Canvas, caméra et commandes de l’appareil

**Outils et automatisation :**

- Automatisation de navigateur, exec, sandboxing
- Recherche web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Tâches Cron et planification Heartbeat
- Skills, plugins et pipelines de workflow (Lobster)

## Associé

- [Fonctionnalités expérimentales](/fr/concepts/experimental-features)
- [Runtime d’agent](/fr/concepts/agent)
