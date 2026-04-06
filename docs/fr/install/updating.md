---
read_when:
    - Mettre à jour OpenClaw
    - Quelque chose ne fonctionne plus après une mise à jour
summary: Mettre à jour OpenClaw en toute sécurité (installation globale ou depuis les sources), avec stratégie de retour arrière
title: Mise à jour
x-i18n:
    generated_at: "2026-04-06T03:08:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca9fff0776b9f5977988b649e58a5d169e5fa3539261cb02779d724d4ca92877
    source_path: install/updating.md
    workflow: 15
---

# Mise à jour

Gardez OpenClaw à jour.

## Recommandé : `openclaw update`

La méthode la plus rapide pour effectuer la mise à jour. Elle détecte votre type d’installation (npm ou git), récupère la dernière version, exécute `openclaw doctor` et redémarre la passerelle.

```bash
openclaw update
```

Pour changer de canal ou cibler une version spécifique :

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # aperçu sans appliquer
```

`--channel beta` privilégie la bêta, mais le runtime revient à stable/latest lorsque
le tag bêta est manquant ou plus ancien que la dernière version stable. Utilisez `--tag beta`
si vous voulez le dist-tag npm bêta brut pour une mise à jour ponctuelle du package.

Voir [Canaux de développement](/fr/install/development-channels) pour la sémantique des canaux.

## Alternative : relancer l’installateur

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Ajoutez `--no-onboard` pour ignorer l’onboarding. Pour les installations depuis les sources, passez `--install-method git --no-onboard`.

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

## Programme de mise à jour automatique

Le programme de mise à jour automatique est désactivé par défaut. Activez-le dans `~/.openclaw/openclaw.json` :

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

| Canal    | Comportement                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Attend `stableDelayHours`, puis applique avec une gigue déterministe sur `stableJitterHours` (déploiement étalé). |
| `beta`   | Vérifie toutes les `betaCheckIntervalHours` (par défaut : toutes les heures) et applique immédiatement.      |
| `dev`    | Pas d’application automatique. Utilisez `openclaw update` manuellement.                                      |

La passerelle consigne également un conseil de mise à jour au démarrage (désactivez avec `update.checkOnStart: false`).

## Après la mise à jour

<Steps>

### Exécuter doctor

```bash
openclaw doctor
```

Migre la config, audite les politiques de DM et vérifie l’état de la passerelle. Détails : [Doctor](/fr/gateway/doctor)

### Redémarrer la passerelle

```bash
openclaw gateway restart
```

### Vérifier

```bash
openclaw health
```

</Steps>

## Retour arrière

### Épingler une version (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Astuce : `npm view openclaw version` affiche la version actuellement publiée.

### Épingler un commit (sources)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Pour revenir à la dernière version : `git checkout main && git pull`.

## Si vous êtes bloqué

- Exécutez à nouveau `openclaw doctor` et lisez attentivement la sortie.
- Pour `openclaw update --channel dev` sur des checkouts source, le programme de mise à jour amorce automatiquement `pnpm` si nécessaire. Si vous voyez une erreur d’amorçage pnpm/corepack, installez `pnpm` manuellement (ou réactivez `corepack`) puis relancez la mise à jour.
- Vérifiez : [Dépannage](/fr/gateway/troubleshooting)
- Demandez dans Discord : [https://discord.gg/clawd](https://discord.gg/clawd)

## Connexe

- [Vue d’ensemble de l’installation](/fr/install) — toutes les méthodes d’installation
- [Doctor](/fr/gateway/doctor) — vérifications d’état après les mises à jour
- [Migration](/fr/install/migrating) — guides de migration des versions majeures
