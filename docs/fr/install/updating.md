---
read_when:
    - Mettre à jour OpenClaw
    - Quelque chose casse après une mise à jour
summary: Mettre à jour OpenClaw en toute sécurité (installation globale ou source), plus une stratégie de rollback
title: Mise à jour
x-i18n:
    generated_at: "2026-04-05T12:47:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: b40429d38ca851be4fdf8063ed425faf4610a4b5772703e0481c5f1fb588ba58
    source_path: install/updating.md
    workflow: 15
---

# Mise à jour

Maintenez OpenClaw à jour.

## Recommandé : `openclaw update`

Le moyen le plus rapide de mettre à jour. Il détecte votre type d’installation (npm ou git), récupère la dernière version, exécute `openclaw doctor` et redémarre la Gateway.

```bash
openclaw update
```

Pour changer de canal ou cibler une version spécifique :

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`--channel beta` préfère beta, mais le runtime se rabat sur stable/latest lorsque
le tag beta est absent ou plus ancien que la dernière version stable. Utilisez `--tag beta`
si vous voulez le dist-tag npm beta brut pour une mise à jour ponctuelle du package.

Voir [Canaux de développement](/install/development-channels) pour la sémantique des canaux.

## Alternative : relancer l’installateur

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Ajoutez `--no-onboard` pour ignorer l’onboarding. Pour les installations source, passez `--install-method git --no-onboard`.

## Alternative : npm, pnpm ou bun manuels

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

## Mise à jour automatique

La mise à jour automatique est désactivée par défaut. Activez-la dans `~/.openclaw/openclaw.json` :

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Canal    | Comportement                                                                                                   |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| `stable` | Attend `stableDelayHours`, puis applique avec un jitter déterministe sur `stableJitterHours` (déploiement étalé). |
| `beta`   | Vérifie toutes les `betaCheckIntervalHours` (par défaut : chaque heure) et applique immédiatement.             |
| `dev`    | Pas d’application automatique. Utilisez `openclaw update` manuellement.                                        |

La Gateway journalise aussi un conseil de mise à jour au démarrage (désactivez avec `update.checkOnStart: false`).

## Après la mise à jour

<Steps>

### Exécuter doctor

```bash
openclaw doctor
```

Migre la configuration, audite les politiques de messages privés et vérifie l’état de santé de la Gateway. Détails : [Doctor](/gateway/doctor)

### Redémarrer la Gateway

```bash
openclaw gateway restart
```

### Vérifier

```bash
openclaw health
```

</Steps>

## Rollback

### Épingler une version (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Conseil : `npm view openclaw version` affiche la version actuellement publiée.

### Épingler un commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Pour revenir à la dernière version : `git checkout main && git pull`.

## Si vous êtes bloqué

- Exécutez de nouveau `openclaw doctor` et lisez attentivement la sortie.
- Vérifiez : [Résolution des problèmes](/gateway/troubleshooting)
- Demandez de l’aide sur Discord : [https://discord.gg/clawd](https://discord.gg/clawd)

## Lié

- [Vue d’ensemble de l’installation](/install) — toutes les méthodes d’installation
- [Doctor](/gateway/doctor) — vérifications d’état après les mises à jour
- [Migration](/install/migrating) — guides de migration de version majeure
