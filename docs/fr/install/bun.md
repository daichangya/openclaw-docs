---
read_when:
    - Vous voulez la boucle de développement locale la plus rapide (bun + watch)
    - Vous rencontrez des problèmes Bun liés à l’installation, aux patches ou aux scripts de cycle de vie
summary: 'Flux de travail Bun (expérimental) : installations et points d’attention par rapport à pnpm'
title: Bun (expérimental)
x-i18n:
    generated_at: "2026-04-24T07:15:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5637f64fe272faf74915e8de115f21fdf9c9dd0406e5c471932323b2c1d4c0bd
    source_path: install/bun.md
    workflow: 15
---

<Warning>
Bun n’est **pas recommandé pour le runtime du Gateway** (problèmes connus avec WhatsApp et Telegram). Utilisez Node en production.
</Warning>

Bun est un runtime local optionnel pour exécuter directement du TypeScript (`bun run ...`, `bun --watch ...`). Le gestionnaire de paquets par défaut reste `pnpm`, qui est entièrement pris en charge et utilisé par l’outillage de documentation. Bun ne peut pas utiliser `pnpm-lock.yaml` et l’ignorera.

## Installation

<Steps>
  <Step title="Installer les dépendances">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sont ignorés par git, donc il n’y a pas de bruit dans le dépôt. Pour ignorer complètement les écritures de lockfile :

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Construire et tester">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Scripts de cycle de vie

Bun bloque les scripts de cycle de vie des dépendances sauf s’ils sont explicitement approuvés. Pour ce dépôt, les scripts couramment bloqués ne sont pas requis :

- `@whiskeysockets/baileys` `preinstall` -- vérifie que la version majeure de Node est >= 20 (OpenClaw utilise par défaut Node 24 et prend toujours en charge Node 22 LTS, actuellement `22.14+`)
- `protobufjs` `postinstall` -- émet des avertissements sur des schémas de version incompatibles (aucun artefact de build)

Si vous rencontrez un problème runtime nécessitant ces scripts, approuvez-les explicitement :

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Points d’attention

Certains scripts codent encore `pnpm` en dur (par exemple `docs:build`, `ui:*`, `protocol:check`). Exécutez-les via pnpm pour l’instant.

## Associé

- [Vue d’ensemble de l’installation](/fr/install)
- [Node.js](/fr/install/node)
- [Updating](/fr/install/updating)
