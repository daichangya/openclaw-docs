---
read_when:
    - Vous voulez une carte complète de la documentation
summary: Hubs qui renvoient vers toute la documentation OpenClaw
title: Hubs de documentation
x-i18n:
    generated_at: "2026-04-05T12:54:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4998710e3dc8018a50abc41285caac83df4b3bf8aec2e4a7525a0563649eb06c
    source_path: start/hubs.md
    workflow: 15
---

# Hubs de documentation

<Note>
Si vous découvrez OpenClaw, commencez par [Bien démarrer](/fr/start/getting-started).
</Note>

Utilisez ces hubs pour découvrir chaque page, y compris les analyses approfondies et les documents de référence qui n’apparaissent pas dans la navigation de gauche.

## Commencez ici

- [Index](/fr)
- [Bien démarrer](/fr/start/getting-started)
- [Onboarding](/start/onboarding)
- [Onboarding (CLI)](/fr/start/wizard)
- [Configuration](/start/setup)
- [Dashboard (Gateway locale)](http://127.0.0.1:18789/)
- [Aide](/help)
- [Répertoire de documentation](/start/docs-directory)
- [Configuration](/gateway/configuration)
- [Exemples de configuration](/gateway/configuration-examples)
- [Assistant OpenClaw](/start/openclaw)
- [Vitrine](/start/showcase)
- [Lore](/start/lore)

## Installation + mises à jour

- [Docker](/install/docker)
- [Nix](/install/nix)
- [Mise à jour / rollback](/install/updating)
- [Flux de travail Bun (expérimental)](/install/bun)

## Concepts de base

- [Architecture](/concepts/architecture)
- [Fonctionnalités](/concepts/features)
- [Hub réseau](/network)
- [Runtime agent](/concepts/agent)
- [Espace de travail de l’agent](/concepts/agent-workspace)
- [Mémoire](/concepts/memory)
- [Boucle d’agent](/concepts/agent-loop)
- [Streaming + segmentation](/concepts/streaming)
- [Routage multi-agent](/concepts/multi-agent)
- [Compaction](/concepts/compaction)
- [Sessions](/concepts/session)
- [Élagage des sessions](/concepts/session-pruning)
- [Outils de session](/concepts/session-tool)
- [File](/concepts/queue)
- [Commandes slash](/tools/slash-commands)
- [Adaptateurs RPC](/reference/rpc)
- [Schémas TypeBox](/concepts/typebox)
- [Gestion du fuseau horaire](/concepts/timezone)
- [Présence](/concepts/presence)
- [Découverte + transports](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
- [Routage des canaux](/channels/channel-routing)
- [Groupes](/channels/groups)
- [Messages de groupe](/channels/group-messages)
- [Basculement de modèles](/concepts/model-failover)
- [OAuth](/concepts/oauth)

## Fournisseurs + entrée

- [Hub des canaux de chat](/channels)
- [Hub des fournisseurs de modèles](/providers/models)
- [WhatsApp](/channels/whatsapp)
- [Telegram](/channels/telegram)
- [Slack](/channels/slack)
- [Discord](/channels/discord)
- [Mattermost](/channels/mattermost)
- [Signal](/channels/signal)
- [BlueBubbles (iMessage)](/channels/bluebubbles)
- [QQ Bot](/channels/qqbot)
- [iMessage (hérité)](/channels/imessage)
- [Analyse de localisation](/channels/location)
- [WebChat](/web/webchat)
- [Webhooks](/automation/cron-jobs#webhooks)
- [Gmail Pub/Sub](/automation/cron-jobs#gmail-pubsub-integration)

## Gateway + opérations

- [Runbook Gateway](/gateway)
- [Modèle réseau](/gateway/network-model)
- [Appairage Gateway](/gateway/pairing)
- [Verrou Gateway](/gateway/gateway-lock)
- [Processus en arrière-plan](/gateway/background-process)
- [Santé](/gateway/health)
- [Heartbeat](/gateway/heartbeat)
- [Doctor](/gateway/doctor)
- [Journalisation](/gateway/logging)
- [Sandboxing](/gateway/sandboxing)
- [Dashboard](/web/dashboard)
- [UI de contrôle](/web/control-ui)
- [Accès distant](/gateway/remote)
- [README Gateway distante](/gateway/remote-gateway-readme)
- [Tailscale](/gateway/tailscale)
- [Sécurité](/gateway/security)
- [Dépannage](/gateway/troubleshooting)

## Outils + automatisation

- [Surface des outils](/tools)
- [OpenProse](/prose)
- [Référence CLI](/cli)
- [Outil Exec](/tools/exec)
- [Outil PDF](/tools/pdf)
- [Mode élevé](/tools/elevated)
- [Tâches cron](/automation/cron-jobs)
- [Automatisation & tâches](/automation)
- [Thinking + verbose](/tools/thinking)
- [Models](/concepts/models)
- [Sous-agents](/tools/subagents)
- [CLI d’envoi d’agent](/tools/agent-send)
- [UI terminal](/web/tui)
- [Contrôle du navigateur](/tools/browser)
- [Navigateur (dépannage Linux)](/tools/browser-linux-troubleshooting)
- [Polls](/cli/message)

## Nodes, médias, voix

- [Vue d’ensemble des nodes](/nodes)
- [Caméra](/nodes/camera)
- [Images](/nodes/images)
- [Audio](/nodes/audio)
- [Commande de localisation](/nodes/location-command)
- [Réveil vocal](/nodes/voicewake)
- [Mode talk](/nodes/talk)

## Plateformes

- [Vue d’ensemble des plateformes](/platforms)
- [macOS](/platforms/macos)
- [iOS](/platforms/ios)
- [Android](/platforms/android)
- [Windows (WSL2)](/platforms/windows)
- [Linux](/platforms/linux)
- [Surfaces web](/web)

## Application compagnon macOS (avancé)

- [Configuration dev macOS](/platforms/mac/dev-setup)
- [Barre de menu macOS](/platforms/mac/menu-bar)
- [Réveil vocal macOS](/platforms/mac/voicewake)
- [Superposition vocale macOS](/platforms/mac/voice-overlay)
- [WebChat macOS](/platforms/mac/webchat)
- [Canvas macOS](/platforms/mac/canvas)
- [Processus enfant macOS](/platforms/mac/child-process)
- [Santé macOS](/platforms/mac/health)
- [Icône macOS](/platforms/mac/icon)
- [Journalisation macOS](/platforms/mac/logging)
- [Autorisations macOS](/platforms/mac/permissions)
- [Accès distant macOS](/platforms/mac/remote)
- [Signature macOS](/platforms/mac/signing)
- [Gateway macOS (launchd)](/platforms/mac/bundled-gateway)
- [XPC macOS](/platforms/mac/xpc)
- [Skills macOS](/platforms/mac/skills)
- [Peekaboo macOS](/platforms/mac/peekaboo)

## Extensions + plugins

- [Vue d’ensemble des plugins](/tools/plugin)
- [Building Plugins](/plugins/building-plugins)
- [Manifeste de plugin](/plugins/manifest)
- [Outils d’agent](/plugins/building-plugins#registering-agent-tools)
- [Bundles de plugins](/plugins/bundles)
- [Plugins communautaires](/plugins/community)
- [Livre de recettes des capacités](/tools/capability-cookbook)
- [Plugin Voice Call](/plugins/voice-call)
- [Plugin utilisateur Zalo](/plugins/zalouser)

## Espace de travail + modèles

- [Skills](/tools/skills)
- [ClawHub](/tools/clawhub)
- [Configuration des Skills](/tools/skills-config)
- [AGENTS par défaut](/reference/AGENTS.default)
- [Modèles : AGENTS](/reference/templates/AGENTS)
- [Modèles : BOOTSTRAP](/reference/templates/BOOTSTRAP)
- [Modèles : HEARTBEAT](/reference/templates/HEARTBEAT)
- [Modèles : IDENTITY](/reference/templates/IDENTITY)
- [Modèles : SOUL](/reference/templates/SOUL)
- [Modèles : TOOLS](/reference/templates/TOOLS)
- [Modèles : USER](/reference/templates/USER)

## Projet

- [Crédits](/reference/credits)

## Tests + version

- [Tests](/reference/test)
- [Politique de version](/reference/RELEASING)
- [Modèles d’appareils](/reference/device-models)
