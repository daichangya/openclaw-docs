---
read_when:
    - Debug di script di sviluppo solo Node o di errori della modalità watch
    - Analisi degli arresti anomali del loader tsx/esbuild in OpenClaw
summary: Note sull'arresto anomalo di Node + tsx "__name is not a function" e soluzioni alternative
title: Arresto anomalo di Node + tsx
x-i18n:
    generated_at: "2026-04-19T01:11:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca45c795c356ada8f81e75b394ec82743d3d1bf1bbe83a24ec6699946b920f01
    source_path: debug/node-issue.md
    workflow: 15
---

# Arresto anomalo di Node + tsx "\_\_name is not a function"

## Riepilogo

L'esecuzione di OpenClaw tramite Node con `tsx` non riesce all'avvio con:

```bash
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Questo è iniziato dopo il passaggio degli script di sviluppo da Bun a `tsx` (commit `2871657e`, 2026-01-06). Lo stesso percorso di runtime funzionava con Bun.

## Ambiente

- Node: v25.x (osservato su v25.3.0)
- tsx: 4.21.0
- OS: macOS (la riproduzione è probabile anche su altre piattaforme che eseguono Node 25)

## Riproduzione (solo Node)

```bash
# nella root del repo
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Riproduzione minima nel repo

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Verifica della versione di Node

- Node 25.3.0: fallisce
- Node 22.22.0 (Homebrew `node@22`): fallisce
- Node 24: non ancora installato qui; necessita di verifica

## Note / ipotesi

- `tsx` usa esbuild per trasformare TS/ESM. `keepNames` di esbuild emette un helper `__name` e avvolge le definizioni di funzione con `__name(...)`.
- L'arresto anomalo indica che `__name` esiste ma non è una funzione in fase di runtime, il che implica che l'helper manca o viene sovrascritto per questo modulo nel percorso del loader di Node 25.
- Problemi simili con l'helper `__name` sono stati segnalati in altri consumer di esbuild quando l'helper manca o viene riscritto.

## Cronologia della regressione

- `2871657e` (2026-01-06): gli script sono passati da Bun a tsx per rendere Bun opzionale.
- Prima di allora (percorso Bun), `openclaw status` e `gateway:watch` funzionavano.

## Soluzioni alternative

- Usare Bun per gli script di sviluppo (attuale revert temporaneo).
- Usare `tsgo` per il type checking del repo, quindi eseguire l'output compilato:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Nota storica: qui è stato usato `tsc` durante il debug di questo problema Node/tsx, ma ora i lane di type checking del repo usano `tsgo`.
- Disabilitare `keepNames` di esbuild nel loader TS, se possibile (impedisce l'inserimento dell'helper `__name`); tsx al momento non espone questa opzione.
- Testare Node LTS (22/24) con `tsx` per capire se il problema è specifico di Node 25.

## Riferimenti

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Prossimi passi

- Riprodurre su Node 22/24 per confermare una regressione di Node 25.
- Testare `tsx` nightly o fissare una versione precedente se esiste una regressione nota.
- Se si riproduce su Node LTS, aprire un repro minimo upstream con lo stack trace di `__name`.
