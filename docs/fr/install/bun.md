---
read_when:
    - Vous voulez la boucle de développement local la plus rapide (bun + watch)
    - Vous rencontrez des problèmes d’installation/patch/script de cycle de vie avec Bun
summary: 'Flux de travail Bun (expérimental) : installations et pièges par rapport à pnpm'
title: Bun (expérimental)
x-i18n:
    generated_at: "2026-04-05T12:44:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0845567834124bb9206db64df013dc29f3b61a04da4f7e7f0c2823a9ecd67a6
    source_path: install/bun.md
    workflow: 15
---

# Bun (expérimental)

<Warning>
Bun n’est **pas recommandé pour le runtime gateway** (problèmes connus avec WhatsApp et Telegram). Utilisez Node en production.
</Warning>

Bun est un runtime local facultatif pour exécuter directement TypeScript (`bun run ...`, `bun --watch ...`). Le gestionnaire de paquets par défaut reste `pnpm`, qui est entièrement pris en charge et utilisé par l’outillage de documentation. Bun ne peut pas utiliser `pnpm-lock.yaml` et l’ignorera.

## Installation

<Steps>
  <Step title="Installer les dépendances">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sont ignorés par git, il n’y a donc pas de bruit dans le dépôt. Pour ignorer complètement l’écriture du lockfile :

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Compiler et tester">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Scripts de cycle de vie

Bun bloque les scripts de cycle de vie des dépendances sauf s’ils sont explicitement approuvés. Pour ce dépôt, les scripts couramment bloqués ne sont pas requis :

- `@whiskeysockets/baileys` `preinstall` -- vérifie Node major >= 20 (OpenClaw utilise par défaut Node 24 et prend toujours en charge Node 22 LTS, actuellement `22.14+`)
- `protobufjs` `postinstall` -- émet des avertissements sur des schémas de version incompatibles (aucun artefact de build)

Si vous rencontrez un problème de runtime qui exige ces scripts, approuvez-les explicitement :

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Limitations

Certains scripts codent encore `pnpm` en dur (par exemple `docs:build`, `ui:*`, `protocol:check`). Exécutez-les via pnpm pour l’instant.
