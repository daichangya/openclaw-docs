---
read_when:
    - À la recherche de la prise en charge des OS ou des parcours d’installation
    - Décider où exécuter le Gateway
summary: Vue d’ensemble de la prise en charge des plateformes (Gateway + apps compagnons)
title: Plateformes
x-i18n:
    generated_at: "2026-04-24T07:19:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
    source_path: platforms/index.md
    workflow: 15
---

Le cœur d’OpenClaw est écrit en TypeScript. **Node est le runtime recommandé**.
Bun n’est pas recommandé pour le Gateway — problèmes connus avec les canaux WhatsApp et
Telegram ; voir [Bun (expérimental)](/fr/install/bun) pour les détails.

Des apps compagnons existent pour macOS (app de barre de menus) et pour les nodes mobiles (iOS/Android). Les apps compagnons Windows et
Linux sont prévues, mais le Gateway est entièrement pris en charge dès aujourd’hui.
Des apps compagnons natives pour Windows sont également prévues ; le Gateway est recommandé via WSL2.

## Choisissez votre OS

- macOS : [macOS](/fr/platforms/macos)
- iOS : [iOS](/fr/platforms/ios)
- Android : [Android](/fr/platforms/android)
- Windows : [Windows](/fr/platforms/windows)
- Linux : [Linux](/fr/platforms/linux)

## VPS et hébergement

- Hub VPS : [Hébergement VPS](/fr/vps)
- Fly.io : [Fly.io](/fr/install/fly)
- Hetzner (Docker) : [Hetzner](/fr/install/hetzner)
- GCP (Compute Engine) : [GCP](/fr/install/gcp)
- Azure (VM Linux) : [Azure](/fr/install/azure)
- exe.dev (VM + proxy HTTPS) : [exe.dev](/fr/install/exe-dev)

## Liens courants

- Guide d’installation : [Premiers pas](/fr/start/getting-started)
- Guide d’exploitation du Gateway : [Gateway](/fr/gateway)
- Configuration du Gateway : [Configuration](/fr/gateway/configuration)
- État du service : `openclaw gateway status`

## Installation du service Gateway (CLI)

Utilisez l’une de ces méthodes (toutes prises en charge) :

- Assistant (recommandé) : `openclaw onboard --install-daemon`
- Directement : `openclaw gateway install`
- Flux de configuration : `openclaw configure` → sélectionner **Gateway service**
- Réparer/migrer : `openclaw doctor` (propose d’installer ou de corriger le service)

La cible de service dépend de l’OS :

- macOS : LaunchAgent (`ai.openclaw.gateway` ou `ai.openclaw.<profile>` ; anciennement `com.openclaw.*`)
- Linux/WSL2 : service utilisateur systemd (`openclaw-gateway[-<profile>].service`)
- Windows natif : tâche planifiée (`OpenClaw Gateway` ou `OpenClaw Gateway (<profile>)`), avec repli sur un élément de connexion du dossier Startup par utilisateur si la création de tâche est refusée

## Articles connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [App macOS](/fr/platforms/macos)
- [App iOS](/fr/platforms/ios)
