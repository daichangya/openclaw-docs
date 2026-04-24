---
read_when:
    - choisir un parcours d’intégration
    - configuration d’un nouvel environnement
sidebarTitle: Onboarding Overview
summary: vue d’ensemble des options et flux d’intégration OpenClaw
title: vue d’ensemble de l’intégration
x-i18n:
    generated_at: "2026-04-24T07:33:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 15
---

OpenClaw a deux parcours d’intégration. Les deux configurent l’authentification, la Gateway et
des canaux de chat facultatifs — ils diffèrent seulement par la manière dont vous interagissez avec la configuration.

## Quel parcours dois-je utiliser ?

|                | Intégration CLI                        | Intégration de l’app macOS |
| -------------- | -------------------------------------- | -------------------------- |
| **Plateformes** | macOS, Linux, Windows (natif ou WSL2) | macOS uniquement           |
| **Interface**  | Assistant terminal                     | Interface guidée dans l’app |
| **Idéal pour** | Serveurs, headless, contrôle complet   | Mac de bureau, configuration visuelle |
| **Automatisation** | `--non-interactive` pour les scripts | Manuel uniquement        |
| **Commande**   | `openclaw onboard`                     | Lancer l’app               |

La plupart des utilisateurs devraient commencer par l’**intégration CLI** — elle fonctionne partout et vous donne
le plus de contrôle.

## Ce que l’intégration configure

Quel que soit le parcours choisi, l’intégration configure :

1. **Fournisseur de modèle et authentification** — clé API, OAuth ou jeton de configuration pour le fournisseur choisi
2. **Espace de travail** — répertoire pour les fichiers d’agent, les modèles bootstrap et la mémoire
3. **Gateway** — port, adresse de liaison, mode d’authentification
4. **Canaux** (facultatif) — canaux de chat intégrés et regroupés tels que
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp, etc.
5. **Démon** (facultatif) — service d’arrière-plan afin que la Gateway démarre automatiquement

## Intégration CLI

Exécutez dans n’importe quel terminal :

```bash
openclaw onboard
```

Ajoutez `--install-daemon` pour aussi installer le service d’arrière-plan en une seule étape.

Référence complète : [Intégration (CLI)](/fr/start/wizard)
Documentation de la commande CLI : [`openclaw onboard`](/fr/cli/onboard)

## Intégration de l’app macOS

Ouvrez l’app OpenClaw. L’assistant de premier lancement vous guide à travers les mêmes étapes
avec une interface visuelle.

Référence complète : [Intégration (app macOS)](/fr/start/onboarding)

## Fournisseurs personnalisés ou non listés

Si votre fournisseur n’est pas listé dans l’intégration, choisissez **Custom Provider** et
saisissez :

- Mode de compatibilité API (compatible OpenAI, compatible Anthropic ou détection automatique)
- URL de base et clé API
- ID de modèle et alias facultatif

Plusieurs points de terminaison personnalisés peuvent coexister — chacun reçoit son propre ID de point de terminaison.

## Liens associés

- [Premiers pas](/fr/start/getting-started)
- [Référence de configuration CLI](/fr/start/wizard-cli-reference)
