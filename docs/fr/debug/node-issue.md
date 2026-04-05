---
read_when:
    - Débogage des scripts de développement Node uniquement ou des échecs du mode watch
    - Investigation des crashes du chargeur tsx/esbuild dans OpenClaw
summary: Notes sur le crash Node + tsx « __name is not a function » et solutions de contournement
title: Crash Node + tsx
x-i18n:
    generated_at: "2026-04-05T12:41:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5beab7cdfe7679680f65176234a617293ce495886cfffb151518adfa61dc8dc
    source_path: debug/node-issue.md
    workflow: 15
---

# Crash Node + tsx "\_\_name is not a function"

## Résumé

L’exécution d’OpenClaw via Node avec `tsx` échoue au démarrage avec :

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Cela a commencé après le passage des scripts de développement de Bun à `tsx` (commit `2871657e`, 2026-01-06). Le même chemin d’exécution fonctionnait avec Bun.

## Environnement

- Node : v25.x (observé sur v25.3.0)
- tsx : 4.21.0
- OS : macOS (la reproduction est aussi probable sur d’autres plateformes qui exécutent Node 25)

## Reproduction (Node uniquement)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Reproduction minimale dans le dépôt

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Vérification de la version Node

- Node 25.3.0 : échoue
- Node 22.22.0 (Homebrew `node@22`) : échoue
- Node 24 : pas encore installé ici ; à vérifier

## Notes / hypothèse

- `tsx` utilise esbuild pour transformer TS/ESM. `keepNames` d’esbuild émet un helper `__name` et encapsule les définitions de fonction avec `__name(...)`.
- Le crash indique que `__name` existe mais n’est pas une fonction à l’exécution, ce qui implique que le helper est manquant ou écrasé pour ce module dans le chemin du chargeur Node 25.
- Des problèmes similaires avec le helper `__name` ont été signalés dans d’autres consommateurs d’esbuild lorsque le helper est manquant ou réécrit.

## Historique de régression

- `2871657e` (2026-01-06) : les scripts sont passés de Bun à tsx pour rendre Bun facultatif.
- Avant cela (chemin Bun), `openclaw status` et `gateway:watch` fonctionnaient.

## Solutions de contournement

- Utiliser Bun pour les scripts de développement (retour temporaire actuel).
- Utiliser Node + watch TSC, puis exécuter la sortie compilée :

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```

- Confirmé localement : `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status` fonctionne sur Node 25.
- Désactiver `keepNames` d’esbuild dans le chargeur TS si possible (empêche l’insertion du helper `__name`) ; tsx n’expose actuellement pas cela.
- Tester Node LTS (22/24) avec `tsx` pour voir si le problème est spécifique à Node 25.

## Références

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Étapes suivantes

- Reproduire sur Node 22/24 pour confirmer une régression de Node 25.
- Tester `tsx` nightly ou l’épingler à une version antérieure si une régression connue existe.
- Si le problème se reproduit sur Node LTS, déposer en amont une reproduction minimale avec la trace de pile `__name`.
