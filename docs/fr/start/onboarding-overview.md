---
read_when:
    - Choix d’un parcours d’onboarding
    - Configuration d’un nouvel environnement
sidebarTitle: Onboarding Overview
summary: Vue d’ensemble des options et des flux d’onboarding OpenClaw
title: Vue d’ensemble de l’onboarding
x-i18n:
    generated_at: "2026-04-05T12:54:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 374697c1dbe0c3871c43164076fbed7119ef032f4a40d0f6e421051f914806e5
    source_path: start/onboarding-overview.md
    workflow: 15
---

# Vue d’ensemble de l’onboarding

OpenClaw propose deux parcours d’onboarding. Les deux configurent l’authentification, la passerelle et
des canaux de discussion facultatifs — ils diffèrent simplement par la manière dont vous interagissez avec la configuration.

## Quel parcours dois-je utiliser ?

|                | Onboarding CLI                         | Onboarding application macOS |
| -------------- | -------------------------------------- | ---------------------------- |
| **Plateformes** | macOS, Linux, Windows (natif ou WSL2) | macOS uniquement             |
| **Interface**  | Assistant dans le terminal             | Interface guidée dans l’application |
| **Idéal pour** | Serveurs, headless, contrôle total     | Mac de bureau, configuration visuelle |
| **Automatisation** | `--non-interactive` pour les scripts | Manuel uniquement         |
| **Commande**   | `openclaw onboard`                     | Lancer l’application         |

La plupart des utilisateurs devraient commencer par **l’onboarding CLI** — il fonctionne partout et vous donne
le plus de contrôle.

## Ce que l’onboarding configure

Quel que soit le parcours choisi, l’onboarding configure :

1. **Fournisseur de modèles et authentification** — clé API, OAuth ou jeton de configuration pour le fournisseur choisi
2. **Espace de travail** — répertoire pour les fichiers d’agent, modèles bootstrap et mémoire
3. **Passerelle** — port, adresse de liaison, mode d’authentification
4. **Canaux** (facultatif) — canaux de discussion intégrés et groupés tels que
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp, et plus encore
5. **Daemon** (facultatif) — service en arrière-plan pour que la passerelle démarre automatiquement

## Onboarding CLI

Exécutez dans n’importe quel terminal :

```bash
openclaw onboard
```

Ajoutez `--install-daemon` pour également installer le service en arrière-plan en une seule étape.

Référence complète : [Onboarding (CLI)](/fr/start/wizard)
Documentation de la commande CLI : [`openclaw onboard`](/cli/onboard)

## Onboarding de l’application macOS

Ouvrez l’application OpenClaw. L’assistant de premier lancement vous guide à travers les mêmes étapes
avec une interface visuelle.

Référence complète : [Onboarding (application macOS)](/start/onboarding)

## Fournisseurs personnalisés ou non listés

Si votre fournisseur n’est pas listé dans l’onboarding, choisissez **Custom Provider** puis
renseignez :

- le mode de compatibilité API (compatible OpenAI, compatible Anthropic ou auto-detect)
- la base URL et la clé API
- l’ID du modèle et un alias facultatif

Plusieurs points de terminaison personnalisés peuvent coexister — chacun obtient son propre ID de point de terminaison.
