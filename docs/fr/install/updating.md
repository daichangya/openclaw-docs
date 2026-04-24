---
read_when:
    - Mise à jour d’OpenClaw
    - Quelque chose casse après une mise à jour
summary: Mettre à jour OpenClaw en toute sécurité (installation globale ou source), avec stratégie de retour arrière
title: Mise à jour
x-i18n:
    generated_at: "2026-04-24T07:18:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ed583916ce64c9f60639c8145a46ce5b27ebf5a6dfd09924312d7acfefe1ab
    source_path: install/updating.md
    workflow: 15
---

Maintenez OpenClaw à jour.

## Recommandé : `openclaw update`

La manière la plus rapide de mettre à jour. Cette commande détecte votre type d’installation (npm ou git), récupère la dernière version, exécute `openclaw doctor`, puis redémarre le gateway.

```bash
openclaw update
```

Pour changer de canal ou cibler une version spécifique :

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # prévisualiser sans appliquer
```

`--channel beta` privilégie la bêta, mais le runtime revient à stable/latest lorsque
le tag bêta est absent ou plus ancien que la dernière version stable. Utilisez `--tag beta`
si vous voulez le dist-tag npm bêta brut pour une mise à jour ponctuelle du paquet.

Voir [Development channels](/fr/install/development-channels) pour la sémantique des canaux.

## Alternative : relancer l’installateur

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Ajoutez `--no-onboard` pour ignorer l’onboarding. Pour les installations depuis la source, passez `--install-method git --no-onboard`.

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

### Installations npm globales possédées par root

Certaines configurations npm Linux installent les paquets globaux dans des répertoires appartenant à root tels que
`/usr/lib/node_modules/openclaw`. OpenClaw prend en charge cette disposition : le paquet installé
est traité comme en lecture seule au runtime, et les dépendances runtime des plugins intégrés
sont préparées dans un répertoire runtime accessible en écriture au lieu de modifier l’arborescence
du paquet.

Pour les unités systemd durcies, définissez un répertoire de préparation accessible en écriture inclus dans
`ReadWritePaths` :

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Si `OPENCLAW_PLUGIN_STAGE_DIR` n’est pas défini, OpenClaw utilise `$STATE_DIRECTORY` lorsque
systemd le fournit, puis revient à `~/.openclaw/plugin-runtime-deps`.

## Metteur à jour automatique

Le metteur à jour automatique est désactivé par défaut. Activez-le dans `~/.openclaw/openclaw.json` :

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
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | Attend `stableDelayHours`, puis applique avec un jitter déterministe sur `stableJitterHours` (déploiement étalé). |
| `beta`   | Vérifie toutes les `betaCheckIntervalHours` (par défaut : toutes les heures) et applique immédiatement.       |
| `dev`    | Pas d’application automatique. Utilisez `openclaw update` manuellement.                                       |

Le gateway journalise aussi une indication de mise à jour au démarrage (désactivez avec `update.checkOnStart: false`).

## Après la mise à jour

<Steps>

### Exécuter doctor

```bash
openclaw doctor
```

Migre la configuration, audite les politiques DM et vérifie la santé du gateway. Détails : [Doctor](/fr/gateway/doctor)

### Redémarrer le gateway

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

### Épingler un commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Pour revenir à la dernière version : `git checkout main && git pull`.

## Si vous êtes bloqué

- Exécutez à nouveau `openclaw doctor` et lisez attentivement la sortie.
- Pour `openclaw update --channel dev` sur des copies source, le metteur à jour initialise automatiquement `pnpm` si nécessaire. Si vous voyez une erreur d’initialisation pnpm/corepack, installez `pnpm` manuellement (ou réactivez `corepack`) puis relancez la mise à jour.
- Consultez : [Troubleshooting](/fr/gateway/troubleshooting)
- Demandez de l’aide sur Discord : [https://discord.gg/clawd](https://discord.gg/clawd)

## Associé

- [Vue d’ensemble de l’installation](/fr/install) — toutes les méthodes d’installation
- [Doctor](/fr/gateway/doctor) — vérifications de santé après les mises à jour
- [Migrating](/fr/install/migrating) — guides de migration de version majeure
