---
read_when:
    - Débogage des scripts de développement uniquement Node ou des échecs du mode watch
    - Enquête sur les plantages du chargeur tsx/esbuild dans OpenClaw
summary: Notes de plantage et solutions de contournement pour « __name is not a function » avec Node + tsx
title: Plantage Node + tsx
x-i18n:
    generated_at: "2026-04-19T01:11:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca45c795c356ada8f81e75b394ec82743d3d1bf1bbe83a24ec6699946b920f01
    source_path: debug/node-issue.md
    workflow: 15
---

# Plantage « \_\_name is not a function » avec Node + tsx

## Résumé

L’exécution d’OpenClaw via Node avec `tsx` échoue au démarrage avec :

```bash
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Cela a commencé après le passage des scripts de développement de Bun à `tsx` (commit `2871657e`, 2026-01-06). Le même chemin d’exécution fonctionnait avec Bun.

## Environnement

- Node : v25.x (observé sur v25.3.0)
- tsx : 4.21.0
- OS : macOS (la reproduction est aussi probable sur d’autres plateformes exécutant Node 25)

## Reproduction (Node uniquement)

```bash
# à la racine du dépôt
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Reproduction minimale dans le dépôt

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Vérification de la version de Node

- Node 25.3.0 : échec
- Node 22.22.0 (Homebrew `node@22`) : échec
- Node 24 : pas encore installé ici ; vérification nécessaire

## Notes / hypothèse

- `tsx` utilise esbuild pour transformer TS/ESM. L’option `keepNames` d’esbuild émet un helper `__name` et encapsule les définitions de fonctions avec `__name(...)`.
- Le plantage indique que `__name` existe mais n’est pas une fonction à l’exécution, ce qui implique que le helper est manquant ou écrasé pour ce module dans le chemin du chargeur Node 25.
- Des problèmes similaires liés au helper `__name` ont été signalés dans d’autres consommateurs d’esbuild lorsque le helper est manquant ou réécrit.

## Historique de la régression

- `2871657e` (2026-01-06) : les scripts sont passés de Bun à tsx pour rendre Bun optionnel.
- Avant cela (chemin Bun), `openclaw status` et `gateway:watch` fonctionnaient.

## Solutions de contournement

- Utiliser Bun pour les scripts de développement (retour temporaire actuel).
- Utiliser `tsgo` pour la vérification de types du dépôt, puis exécuter la sortie compilée :

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Note historique : `tsc` a été utilisé ici pendant le débogage de ce problème Node/tsx, mais les lanes de vérification de types du dépôt utilisent maintenant `tsgo`.
- Désactiver `keepNames` d’esbuild dans le chargeur TS si possible (cela évite l’insertion du helper `__name`) ; tsx n’expose pas actuellement cette option.
- Tester Node LTS (22/24) avec `tsx` pour voir si le problème est spécifique à Node 25.

## Références

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Étapes suivantes

- Reproduire sur Node 22/24 pour confirmer une régression de Node 25.
- Tester `tsx` nightly ou épingler une version antérieure si une régression connue existe.
- Si le problème se reproduit sur Node LTS, déposer une reproduction minimale en amont avec la trace de pile `__name`.
