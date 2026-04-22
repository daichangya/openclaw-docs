---
read_when:
    - Hai bisogno di capire perché un job CI è stato o non è stato eseguito
    - Stai eseguendo il debug di controlli GitHub Actions non riusciti
summary: Grafo dei job CI, controlli di ambito ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-22T04:21:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae08bad6cbd0f2eced6c88a792a11bc1c2b1a2bfb003a56f70ff328a2739d3fc
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI viene eseguita a ogni push su `main` e a ogni pull request. Usa uno scoping intelligente per saltare i job costosi quando sono cambiate solo aree non correlate.

## Panoramica dei job

| Job                              | Scopo                                                                                        | Quando viene eseguito              |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Rilevare modifiche solo docs, ambiti cambiati, estensioni cambiate e costruire il manifest CI | Sempre su push e PR non draft      |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                         | Sempre su push e PR non draft      |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                | Sempre su push e PR non draft      |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                           | Sempre su push e PR non draft      |
| `build-artifacts`                | Costruire `dist/` e la Control UI una volta, caricare artifact riutilizzabili per i job downstream | Modifiche rilevanti per Node       |
| `checks-fast-core`               | Lane rapidi di correttezza Linux come controlli bundled/plugin-contract/protocol            | Modifiche rilevanti per Node       |
| `checks-fast-contracts-channels` | Controlli sharded dei contratti dei canali con un risultato di controllo aggregato stabile  | Modifiche rilevanti per Node       |
| `checks-node-extensions`         | Shard completi di test dei Plugin inclusi nell'intera suite delle estensioni                | Modifiche rilevanti per Node       |
| `checks-node-core-test`          | Shard dei test core Node, esclusi canali, bundle, contratti e lane delle estensioni        | Modifiche rilevanti per Node       |
| `extension-fast`                 | Test mirati solo per i Plugin inclusi modificati                                            | Quando vengono rilevate modifiche alle estensioni |
| `check`                          | Equivalente principale locale sharded: tipi prod, lint, guardie, tipi test e smoke rigoroso | Modifiche rilevanti per Node       |
| `check-additional`               | Shard di architettura, confini, guardie della superficie delle estensioni, confini di pacchetto e gateway-watch | Modifiche rilevanti per Node       |
| `build-smoke`                    | Smoke test della CLI buildata e smoke della memoria all'avvio                               | Modifiche rilevanti per Node       |
| `checks`                         | Restanti lane Linux Node: test dei canali e compatibilità Node 22 solo per push            | Modifiche rilevanti per Node       |
| `check-docs`                     | Formattazione docs, lint e controlli dei link rotti                                         | Docs modificate                    |
| `skills-python`                  | Ruff + pytest per Skills supportate da Python                                               | Modifiche rilevanti per Skills Python |
| `checks-windows`                 | Lane di test specifici per Windows                                                          | Modifiche rilevanti per Windows    |
| `macos-node`                     | Lane di test TypeScript su macOS usando gli artifact buildati condivisi                     | Modifiche rilevanti per macOS      |
| `macos-swift`                    | Lint, build e test Swift per l'app macOS                                                    | Modifiche rilevanti per macOS      |
| `android`                        | Matrice di build e test Android                                                             | Modifiche rilevanti per Android    |

## Ordine fail-fast

I job sono ordinati in modo che i controlli economici falliscano prima che partano quelli costosi:

1. `preflight` decide quali lane esistono davvero. La logica `docs-scope` e `changed-scope` è composta da step interni a questo job, non da job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti della matrice artifact e piattaforme.
3. `build-artifacts` si sovrappone ai lane Linux rapidi così i consumer downstream possono partire non appena la build condivisa è pronta.
4. Dopo si diramano i lane più pesanti di piattaforma e runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

La logica di ambito si trova in `scripts/ci-changed-scope.mjs` ed è coperta da unit test in `src/scripts/ci-changed-scope.test.ts`.
Il workflow separato `install-smoke` riusa lo stesso script di ambito tramite il proprio job `preflight`. Calcola `run_install_smoke` a partire dal segnale changed-smoke più ristretto, quindi lo smoke Docker/install viene eseguito solo per modifiche rilevanti per installazione, packaging e container.

La logica locale dei lane modificati si trova in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Questo gate locale è più rigoroso sui confini architetturali rispetto all'ampio ambito di piattaforma della CI: le modifiche di produzione al core eseguono typecheck prod del core più test del core, le modifiche solo ai test del core eseguono solo typecheck/test del core, le modifiche di produzione alle estensioni eseguono typecheck prod delle estensioni più test delle estensioni, e le modifiche solo ai test delle estensioni eseguono solo typecheck/test delle estensioni. Le modifiche al Plugin SDK pubblico o ai contratti dei Plugin estendono la validazione alle estensioni perché queste dipendono da quei contratti core. Gli incrementi di versione che toccano solo metadati di release eseguono controlli mirati su versione/configurazione/dipendenze root. Le modifiche sconosciute a root/configurazione vanno in fail-safe su tutti i lane.

Sui push, la matrice `checks` aggiunge il lane `compat-node22`, eseguito solo sui push. Sulle pull request, quel lane viene saltato e la matrice resta concentrata sui normali lane di test/canali.

Le famiglie di test Node più lente sono divise in shard per file inclusi così ogni job resta piccolo: i contratti dei canali dividono la copertura registry e core in otto shard pesati ciascuno, i test del comando di risposta auto-reply si dividono in quattro shard per pattern di inclusione, e gli altri grandi gruppi di prefissi di risposta auto-reply si dividono in due shard ciascuno. Anche `check-additional` separa il lavoro di compilazione/canary dei confini di pacchetto dal lavoro di topologia runtime su gateway/architettura.

GitHub può contrassegnare i job superati da esecuzioni più recenti come `cancelled` quando arriva un nuovo push sulla stessa PR o sullo stesso ref `main`. Trattalo come rumore CI a meno che anche l'esecuzione più recente per lo stesso ref non stia fallendo. I controlli aggregati degli shard evidenziano esplicitamente questo caso di cancellazione, così è più facile distinguerlo da un errore di test.

## Runner

| Runner                           | Job                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, controlli Linux, controlli docs, Skills Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` su `openclaw/openclaw`; i fork tornano a `macos-latest`                                                                  |

## Equivalenti locali

```bash
pnpm changed:lanes   # ispeziona il classificatore locale dei lane modificati per origin/main...HEAD
pnpm check:changed   # gate locale intelligente: typecheck/lint/test modificati per lane di confine
pnpm check          # gate locale rapido: tsgo di produzione + lint sharded + guardie rapide in parallelo
pnpm check:test-types
pnpm check:timed    # stesso gate con tempi per fase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # test vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato docs + lint + link rotti
pnpm build          # build di dist quando contano i lane CI artifact/build-smoke
```
