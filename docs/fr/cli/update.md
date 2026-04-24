---
read_when:
    - Vous souhaitez mettre à jour une extraction source en toute sécurité
    - Vous devez comprendre le comportement abrégé de `--update`
summary: Référence CLI pour `openclaw update` (mise à jour de la source relativement sûre + redémarrage automatique de Gateway)
title: Mise à jour
x-i18n:
    generated_at: "2026-04-24T07:05:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab28ae6fe91c094826ccbd9fa11c5d7c41849cc95d570a634a0721b82f0e3a
    source_path: cli/update.md
    workflow: 15
---

# `openclaw update`

Mettre à jour OpenClaw en toute sécurité et basculer entre les canaux stable/beta/dev.

Si vous avez installé via **npm/pnpm/bun** (installation globale, sans métadonnées git),
les mises à jour passent par le flux du gestionnaire de paquets décrit dans [Mise à jour](/fr/install/updating).

## Utilisation

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Options

- `--no-restart` : ne pas redémarrer le service Gateway après une mise à jour réussie.
- `--channel <stable|beta|dev>` : définir le canal de mise à jour (git + npm ; conservé dans la configuration).
- `--tag <dist-tag|version|spec>` : remplace la cible du package pour cette mise à jour uniquement. Pour les installations par package, `main` correspond à `github:openclaw/openclaw#main`.
- `--dry-run` : prévisualiser les actions de mise à jour prévues (canal/tag/cible/flux de redémarrage) sans écrire dans la configuration, installer, synchroniser les Plugins ni redémarrer.
- `--json` : afficher le JSON `UpdateRunResult` lisible par machine, y compris
  `postUpdate.plugins.integrityDrifts` lorsqu’une dérive d’artefact de Plugin npm est
  détectée pendant la synchronisation des Plugins après mise à jour.
- `--timeout <seconds>` : délai maximal par étape (1200s par défaut).
- `--yes` : ignorer les invites de confirmation (par exemple confirmation de rétrogradation)

Remarque : les rétrogradations nécessitent une confirmation, car les anciennes versions peuvent casser la configuration.

## `update status`

Affiche le canal de mise à jour actif + le tag/la branche/le SHA git (pour les extractions source), ainsi que la disponibilité des mises à jour.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Options :

- `--json` : afficher le JSON d’état lisible par machine.
- `--timeout <seconds>` : délai maximal pour les vérifications (3s par défaut).

## `update wizard`

Flux interactif pour choisir un canal de mise à jour et confirmer s’il faut redémarrer le Gateway
après la mise à jour (le comportement par défaut est de redémarrer). Si vous sélectionnez `dev` sans extraction git, il
propose d’en créer une.

Options :

- `--timeout <seconds>` : délai maximal pour chaque étape de mise à jour (par défaut `1200`)

## Ce qu’il fait

Lorsque vous changez explicitement de canal (`--channel ...`), OpenClaw aligne aussi la
méthode d’installation :

- `dev` → garantit une extraction git (par défaut : `~/openclaw`, remplaçable avec `OPENCLAW_GIT_DIR`),
  la met à jour et installe la CLI globale depuis cette extraction.
- `stable` → installe depuis npm en utilisant `latest`.
- `beta` → préfère le dist-tag npm `beta`, mais revient à `latest` si beta est
  absent ou plus ancien que la version stable actuelle.

Le programme de mise à jour automatique du cœur Gateway (lorsqu’il est activé via la configuration) réutilise ce même chemin de mise à jour.

Pour les installations via gestionnaire de paquets, `openclaw update` résout la version
du package cible avant d’invoquer le gestionnaire de paquets. Si la version installée
correspond exactement à la cible et qu’aucun changement de canal de mise à jour n’a besoin d’être conservé, la
commande se termine avec un état ignoré avant l’installation du package, la synchronisation des Plugins, l’actualisation de fin
ou le redémarrage du Gateway.

## Flux d’extraction git

Canaux :

- `stable` : extrait le dernier tag non beta, puis exécute build + doctor.
- `beta` : préfère le dernier tag `-beta`, mais revient au dernier tag stable
  si beta est absent ou plus ancien.
- `dev` : extrait `main`, puis exécute fetch + rebase.

Vue d’ensemble :

1. Nécessite un arbre de travail propre (aucune modification non commitée).
2. Bascule vers le canal sélectionné (tag ou branche).
3. Récupère l’amont (dev uniquement).
4. Dev uniquement : exécute en prévol un lint + build TypeScript dans un arbre de travail temporaire ; si la pointe échoue, remonte jusqu’à 10 commits pour trouver le build propre le plus récent.
5. Rebase sur le commit sélectionné (dev uniquement).
6. Installe les dépendances avec le gestionnaire de paquets du dépôt. Pour les extractions pnpm, le programme de mise à jour initialise `pnpm` à la demande (via `corepack` d’abord, puis un repli temporaire `npm install pnpm@10`) au lieu d’exécuter `npm run build` dans un espace de travail pnpm.
7. Exécute la build + la build de l’interface Control.
8. Exécute `openclaw doctor` comme vérification finale de « mise à jour sûre ».
9. Synchronise les Plugins avec le canal actif (dev utilise des Plugins groupés ; stable/beta utilise npm) et met à jour les Plugins installés via npm.

Si une mise à jour exacte de Plugin npm épinglé se résout vers un artefact dont l’intégrité
diffère de l’enregistrement d’installation stocké, `openclaw update` abandonne cette mise à jour
d’artefact de Plugin au lieu de l’installer. Réinstallez ou mettez à jour explicitement le Plugin
uniquement après avoir vérifié que vous faites confiance au nouvel artefact.

Si l’initialisation pnpm échoue encore, le programme de mise à jour s’arrête désormais plus tôt avec une erreur spécifique au gestionnaire de paquets au lieu d’essayer `npm run build` dans l’extraction.

## Raccourci `--update`

`openclaw --update` est réécrit en `openclaw update` (utile pour les shells et les scripts de lancement).

## Voir aussi

- `openclaw doctor` (propose d’exécuter d’abord la mise à jour sur les extractions git)
- [Canaux de développement](/fr/install/development-channels)
- [Mise à jour](/fr/install/updating)
- [Référence CLI](/fr/cli)
