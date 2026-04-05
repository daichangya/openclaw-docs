---
read_when:
    - Rechercher la prise en charge du système d'exploitation ou les chemins d'installation
    - Décider où exécuter la gateway
summary: Vue d'ensemble de la prise en charge des plateformes (gateway + applications compagnons)
title: Plateformes
x-i18n:
    generated_at: "2026-04-05T12:48:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5be4743fd39eca426d65db940f04f3a8fc3ff2c5e10b0e82bc55fc35a7d1399
    source_path: platforms/index.md
    workflow: 15
---

# Plateformes

Le cœur d'OpenClaw est écrit en TypeScript. **Node est le runtime recommandé**.
Bun n'est pas recommandé pour la gateway (bugs WhatsApp/Telegram).

Des applications compagnons existent pour macOS (application de barre de menus) et les nœuds mobiles (iOS/Android). Des applications compagnons Windows et
Linux sont prévues, mais la gateway est déjà entièrement prise en charge aujourd'hui.
Des applications compagnons natives pour Windows sont également prévues ; la gateway est recommandée via WSL2.

## Choisissez votre OS

- macOS : [macOS](/platforms/macos)
- iOS : [iOS](/platforms/ios)
- Android : [Android](/platforms/android)
- Windows : [Windows](/platforms/windows)
- Linux : [Linux](/platforms/linux)

## VPS et hébergement

- Hub VPS : [Hébergement VPS](/vps)
- Fly.io : [Fly.io](/install/fly)
- Hetzner (Docker) : [Hetzner](/install/hetzner)
- GCP (Compute Engine) : [GCP](/install/gcp)
- Azure (Linux VM) : [Azure](/install/azure)
- exe.dev (VM + proxy HTTPS) : [exe.dev](/install/exe-dev)

## Liens courants

- Guide d'installation : [Getting Started](/fr/start/getting-started)
- Runbook gateway : [Gateway](/gateway)
- Configuration de la gateway : [Configuration](/gateway/configuration)
- État du service : `openclaw gateway status`

## Installation du service gateway (CLI)

Utilisez l'une de ces méthodes (toutes prises en charge) :

- Assistant (recommandé) : `openclaw onboard --install-daemon`
- Direct : `openclaw gateway install`
- Flux configure : `openclaw configure` → sélectionnez **Gateway service**
- Réparer/migrer : `openclaw doctor` (propose d'installer ou de corriger le service)

La cible du service dépend du système d'exploitation :

- macOS : LaunchAgent (`ai.openclaw.gateway` ou `ai.openclaw.<profile>` ; ancien `com.openclaw.*`)
- Linux/WSL2 : service utilisateur systemd (`openclaw-gateway[-<profile>].service`)
- Windows natif : tâche planifiée (`OpenClaw Gateway` ou `OpenClaw Gateway (<profile>)`), avec repli sur un élément de connexion du dossier Startup par utilisateur si la création de la tâche est refusée
