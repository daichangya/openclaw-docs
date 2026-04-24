---
read_when:
    - Vous recherchez le statut de l’application compagnon Linux
    - Planification de la couverture plateforme ou des contributions
    - Débogage des OOM kills Linux ou des sorties 137 sur un VPS ou dans un conteneur
summary: Prise en charge Linux + statut de l’application compagnon
title: Application Linux
x-i18n:
    generated_at: "2026-04-24T07:20:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 376721d4b4376c3093c50def9130e3405adc409484c17c19d8d312c4a9a86fc5
    source_path: platforms/linux.md
    workflow: 15
---

Le Gateway est entièrement pris en charge sur Linux. **Node est le runtime recommandé**.
Bun n’est pas recommandé pour le Gateway (bogues WhatsApp/Telegram).

Des applications compagnons Linux natives sont prévues. Les contributions sont les bienvenues si vous voulez aider à en construire une.

## Chemin rapide pour débutants (VPS)

1. Installez Node 24 (recommandé ; Node 22 LTS, actuellement `22.14+`, fonctionne encore pour la compatibilité)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Depuis votre laptop : `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Ouvrez `http://127.0.0.1:18789/` et authentifiez-vous avec le secret partagé configuré (jeton par défaut ; mot de passe si vous avez défini `gateway.auth.mode: "password"`)

Guide complet de serveur Linux : [Serveur Linux](/fr/vps). Exemple VPS pas à pas : [exe.dev](/fr/install/exe-dev)

## Installation

- [Premiers pas](/fr/start/getting-started)
- [Installation et mises à jour](/fr/install/updating)
- Flux facultatifs : [Bun (expérimental)](/fr/install/bun), [Nix](/fr/install/nix), [Docker](/fr/install/docker)

## Gateway

- [Runbook Gateway](/fr/gateway)
- [Configuration](/fr/gateway/configuration)

## Installation du service Gateway (CLI)

Utilisez l’une de ces commandes :

```
openclaw onboard --install-daemon
```

Ou :

```
openclaw gateway install
```

Ou :

```
openclaw configure
```

Sélectionnez **Gateway service** lorsque cela vous est demandé.

Réparer/migrer :

```
openclaw doctor
```

## Contrôle système (unité utilisateur systemd)

OpenClaw installe par défaut un service utilisateur systemd. Utilisez un service **système**
pour les serveurs partagés ou toujours actifs. `openclaw gateway install` et
`openclaw onboard --install-daemon` génèrent déjà pour vous l’unité canonique
actuelle ; n’en écrivez une à la main que si vous avez besoin d’une configuration personnalisée du système/gestionnaire de services.
Les instructions complètes sur les services se trouvent dans le [Runbook Gateway](/fr/gateway).

Configuration minimale :

Créez `~/.config/systemd/user/openclaw-gateway[-<profile>].service` :

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

Activez-le :

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## Pression mémoire et OOM kills

Sous Linux, le noyau choisit une victime OOM lorsqu’un hôte, une VM ou un cgroup de conteneur
manque de mémoire. Le Gateway peut être une mauvaise victime parce qu’il possède des
sessions longues et des connexions de canal. OpenClaw incline donc les processus enfants transitoires à être tués avant le Gateway lorsque c’est possible.

Pour les lancements d’enfants Linux éligibles, OpenClaw démarre l’enfant via un court wrapper
`/bin/sh` qui augmente `oom_score_adj` de l’enfant à `1000`, puis
`exec` la commande réelle. Il s’agit d’une opération non privilégiée parce que l’enfant
ne fait qu’augmenter sa propre probabilité d’être tué en OOM.

Les surfaces de processus enfants couvertes incluent :

- les enfants de commande gérés par superviseur,
- les enfants shell PTY,
- les enfants de serveur MCP stdio,
- les processus browser/Chrome lancés par OpenClaw.

Le wrapper est limité à Linux et ignoré lorsque `/bin/sh` n’est pas disponible. Il est
également ignoré si l’environnement de l’enfant définit `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no`, ou `off`.

Pour vérifier un processus enfant :

```bash
cat /proc/<child-pid>/oom_score_adj
```

La valeur attendue pour les enfants couverts est `1000`. Le processus Gateway doit conserver
son score normal, généralement `0`.

Cela ne remplace pas le réglage mémoire normal. Si un VPS ou un conteneur tue
répétitivement des processus enfants, augmentez la limite mémoire, réduisez la concurrence, ou ajoutez des contrôles de ressources plus stricts comme `MemoryMax=` de systemd ou des limites mémoire au niveau du conteneur.

## Lié

- [Vue d’ensemble de l’installation](/fr/install)
- [Serveur Linux](/fr/vps)
- [Raspberry Pi](/fr/install/raspberry-pi)
