---
read_when:
    - Rechercher le statut de l'application compagnon Linux
    - Planifier la couverture de plateforme ou des contributions
summary: Prise en charge Linux + statut de l'application compagnon
title: Application Linux
x-i18n:
    generated_at: "2026-04-05T12:48:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5dbfc89eb65e04347479fc6c9a025edec902fb0c544fb8d5bd09c24558ea03b1
    source_path: platforms/linux.md
    workflow: 15
---

# Application Linux

La gateway est entièrement prise en charge sur Linux. **Node est le runtime recommandé**.
Bun n'est pas recommandé pour la gateway (bugs WhatsApp/Telegram).

Des applications compagnons Linux natives sont prévues. Les contributions sont bienvenues si vous souhaitez aider à en créer une.

## Parcours rapide pour débutants (VPS)

1. Installez Node 24 (recommandé ; Node 22 LTS, actuellement `22.14+`, fonctionne toujours pour des raisons de compatibilité)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. Depuis votre ordinateur portable : `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. Ouvrez `http://127.0.0.1:18789/` et authentifiez-vous avec le secret partagé configuré (jeton par défaut ; mot de passe si vous définissez `gateway.auth.mode: "password"`)

Guide complet du serveur Linux : [Serveur Linux](/vps). Exemple VPS étape par étape : [exe.dev](/install/exe-dev)

## Installation

- [Getting Started](/fr/start/getting-started)
- [Installation et mises à jour](/install/updating)
- Flux facultatifs : [Bun (expérimental)](/install/bun), [Nix](/install/nix), [Docker](/install/docker)

## Gateway

- [Runbook gateway](/gateway)
- [Configuration](/gateway/configuration)

## Installation du service gateway (CLI)

Utilisez l'une de ces méthodes :

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

Sélectionnez **Gateway service** lorsque l'invite s'affiche.

Réparer/migrer :

```
openclaw doctor
```

## Contrôle système (unité utilisateur systemd)

OpenClaw installe par défaut un service **utilisateur** systemd. Utilisez un service **système** pour les serveurs partagés ou toujours actifs. `openclaw gateway install` et
`openclaw onboard --install-daemon` génèrent déjà pour vous l'unité canonique actuelle ; n'en écrivez une à la main que si vous avez besoin d'une configuration système/gestionnaire de services personnalisée. Les instructions complètes sur les services se trouvent dans le [runbook gateway](/gateway).

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
