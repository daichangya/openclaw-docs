---
read_when:
    - Packaging d’OpenClaw.app
    - Débogage du service launchd de la passerelle sur macOS
    - Installation de la CLI de la passerelle pour macOS
summary: Runtime de la passerelle sur macOS (service launchd externe)
title: Passerelle sur macOS
x-i18n:
    generated_at: "2026-04-05T12:48:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e41528b35d69c13608cb9a34b39a7f02e1134204d1b496cbdd191798f39607
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

# Passerelle sur macOS (launchd externe)

OpenClaw.app n’intègre plus Node/Bun ni le runtime de la passerelle. L’application macOS
attend une installation **externe** de la CLI `openclaw`, ne lance pas la passerelle comme
processus enfant, et gère un service launchd par utilisateur pour maintenir la passerelle
en fonctionnement (ou se rattache à une passerelle locale existante si elle est déjà en cours d’exécution).

## Installer la CLI (obligatoire pour le mode local)

Node 24 est le runtime par défaut sur Mac. Node 22 LTS, actuellement `22.14+`, fonctionne toujours pour la compatibilité. Installez ensuite `openclaw` globalement :

```bash
npm install -g openclaw@<version>
```

Le bouton **Install CLI** de l’application macOS exécute le même flux d’installation globale que celui
utilisé en interne par l’application : il préfère d’abord npm, puis pnpm, puis bun si c’est le seul
gestionnaire de packages détecté. Node reste le runtime recommandé pour la passerelle.

## Launchd (passerelle en tant que LaunchAgent)

Libellé :

- `ai.openclaw.gateway` (ou `ai.openclaw.<profile>` ; l’ancien `com.openclaw.*` peut subsister)

Emplacement du plist (par utilisateur) :

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (ou `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestionnaire :

- L’application macOS gère l’installation/la mise à jour du LaunchAgent en mode local.
- La CLI peut aussi l’installer : `openclaw gateway install`.

Comportement :

- « OpenClaw Active » active/désactive le LaunchAgent.
- Quitter l’application n’arrête **pas** la passerelle (launchd la maintient active).
- Si une passerelle est déjà en cours d’exécution sur le port configuré, l’application s’y rattache
  au lieu d’en démarrer une nouvelle.

Journalisation :

- stdout/err launchd : `/tmp/openclaw/openclaw-gateway.log`

## Compatibilité des versions

L’application macOS vérifie la version de la passerelle par rapport à sa propre version. Si elles sont
incompatibles, mettez à jour la CLI globale pour qu’elle corresponde à la version de l’application.

## Vérification rapide

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Puis :

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
