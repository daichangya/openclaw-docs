---
read_when:
    - Devi capire perché un job CI è stato eseguito oppure no
    - Stai eseguendo il debug di controlli GitHub Actions non riusciti
summary: Grafico dei job CI, gate di ambito e comandi locali equivalenti
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-22T08:20:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc7ec59123aee65634736320dbf1cf5cdfb08786a78cca82ce9596fedc68b3cc
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI viene eseguita a ogni push su `main` e per ogni pull request. Usa uno scoping intelligente per saltare i job costosi quando sono cambiate solo aree non correlate.

## Panoramica dei job

| Job                              | Scopo                                                                                        | Quando viene eseguito                |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Rilevare modifiche solo alla documentazione, ambiti modificati, estensioni modificate e costruire il manifest CI | Sempre su push e PR non draft        |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                          | Sempre su push e PR non draft        |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli avvisi npm                   | Sempre su push e PR non draft        |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                            | Sempre su push e PR non draft        |
| `build-artifacts`                | Costruire `dist/` e la Control UI una volta, caricare artifact riutilizzabili per i job downstream | Modifiche rilevanti per Node         |
| `checks-fast-core`               | Lane di correttezza Linux rapide come controlli bundled/plugin-contract/protocol             | Modifiche rilevanti per Node         |
| `checks-fast-contracts-channels` | Controlli shardati dei contratti dei canali con un risultato di controllo aggregato stabile  | Modifiche rilevanti per Node         |
| `checks-node-extensions`         | Shard completi dei test dei plugin bundled sull'intera suite delle estensioni                | Modifiche rilevanti per Node         |
| `checks-node-core-test`          | Shard dei test core Node, esclusi canali, bundled, contratti e lane delle estensioni        | Modifiche rilevanti per Node         |
| `extension-fast`                 | Test mirati solo per i plugin bundled modificati                                             | Quando vengono rilevate modifiche alle estensioni |
| `check`                          | Equivalente locale principale shardato: tipi prod, lint, guard, tipi di test e smoke rigoroso | Modifiche rilevanti per Node         |
| `check-additional`               | Guard di architettura, boundary, superficie delle estensioni, boundary dei package e shard gateway-watch | Modifiche rilevanti per Node         |
| `build-smoke`                    | Smoke test della CLI buildata e smoke sulla memoria all'avvio                                | Modifiche rilevanti per Node         |
| `checks`                         | Lane Linux Node rimanenti: test dei canali e compatibilità Node 22 solo su push             | Modifiche rilevanti per Node         |
| `check-docs`                     | Formattazione docs, lint e controlli dei link rotti                                          | Documentazione modificata            |
| `skills-python`                  | Ruff + pytest per le Skills supportate da Python                                             | Modifiche rilevanti per Skills Python |
| `checks-windows`                 | Lane di test specifiche per Windows                                                          | Modifiche rilevanti per Windows      |
| `macos-node`                     | Lane di test TypeScript su macOS che usa gli artifact buildati condivisi                     | Modifiche rilevanti per macOS        |
| `macos-swift`                    | Lint, build e test Swift per l'app macOS                                                     | Modifiche rilevanti per macOS        |
| `android`                        | Matrice di build e test Android                                                              | Modifiche rilevanti per Android      |

## Ordine fail-fast

I job sono ordinati in modo che i controlli economici falliscano prima che vengano eseguiti quelli costosi:

1. `preflight` decide quali lane esistono del tutto. La logica `docs-scope` e `changed-scope` sono step all'interno di questo job, non job separati.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza aspettare i job più pesanti della matrice artifact e piattaforme.
3. `build-artifacts` si sovrappone alle lane Linux rapide così i consumer downstream possono iniziare non appena la build condivisa è pronta.
4. Dopo si aprono a ventaglio le lane più pesanti di piattaforma e runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

La logica di ambito si trova in `scripts/ci-changed-scope.mjs` ed è coperta da unit test in `src/scripts/ci-changed-scope.test.ts`.
Il workflow separato `install-smoke` riusa lo stesso script di ambito tramite il proprio job `preflight`. Calcola `run_install_smoke` dal segnale changed-smoke più ristretto, quindi lo smoke Docker/install viene eseguito solo per modifiche rilevanti per installazione, packaging e container.

La logica locale delle lane modificate si trova in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Questo gate locale è più rigoroso sui boundary architetturali rispetto all'ampio ambito di piattaforma della CI: le modifiche di produzione core eseguono typecheck core prod più test core, le modifiche solo ai test core eseguono solo typecheck/test core, le modifiche di produzione delle estensioni eseguono typecheck prod delle estensioni più test delle estensioni, e le modifiche solo ai test delle estensioni eseguono solo typecheck/test delle estensioni. Le modifiche al Plugin SDK pubblico o al plugin-contract estendono la validazione alle estensioni perché le estensioni dipendono da questi contratti core. I version bump solo nei metadati di release eseguono controlli mirati su versione/config/dipendenze root. Modifiche sconosciute a root/config fanno fail-safe verso tutte le lane.

Sui push, la matrice `checks` aggiunge la lane `compat-node22` solo per push. Sulle pull request, quella lane viene saltata e la matrice resta focalizzata sulle normali lane di test/canali.

Le famiglie di test Node più lente sono suddivise in shard per file inclusi così ogni job resta piccolo: i contratti dei canali dividono la copertura registry e core in otto shard pesati ciascuno, i test del comando reply di auto-reply si dividono in quattro shard per pattern inclusi, e gli altri grandi gruppi di prefissi reply di auto-reply si dividono in due shard ciascuno. Anche `check-additional` separa il lavoro di compile/canary dei boundary dei package dal lavoro di topologia runtime gateway/architettura.

GitHub può contrassegnare i job sostituiti come `cancelled` quando arriva un push più recente sulla stessa PR o ref `main`. Consideralo rumore della CI a meno che anche l'esecuzione più recente per la stessa ref non stia fallendo. I controlli shard aggregati richiamano esplicitamente questo caso di cancellazione così è più facile distinguerlo da un fallimento di test.

## Runner

| Runner                           | Job                                                                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`; anche il preflight di install-smoke usa Ubuntu ospitato da GitHub così la matrice Blacksmith può mettersi in coda prima   |
| `blacksmith-16vcpu-ubuntu-2404`  | `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, controlli Linux, controlli docs, Skills Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` su `openclaw/openclaw`; i fork ripiegano su `macos-latest`                                                  |

## Equivalenti locali

```bash
pnpm changed:lanes   # ispeziona il classificatore locale delle lane modificate per origin/main...HEAD
pnpm check:changed   # gate locale intelligente: typecheck/lint/test modificati per lane di boundary
pnpm check          # gate locale rapido: tsgo di produzione + lint shardato + guard rapidi in parallelo
pnpm check:test-types
pnpm check:timed    # stesso gate con tempi per fase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # test vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato docs + lint + link rotti
pnpm build          # build di dist quando sono rilevanti le lane CI artifact/build-smoke
```
