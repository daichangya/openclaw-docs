---
read_when:
    - Devi capire perché un job CI è stato eseguito oppure no
    - Stai eseguendo il debug di controlli GitHub Actions non riusciti
summary: Grafo dei job CI, gate di ambito ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-23T14:55:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9a03440ae28a15167fc08d9c66bb1fd719ddfa1517aaecb119c80f2ad826c0d
    source_path: ci.md
    workflow: 15
---

# Pipeline CI

La CI viene eseguita a ogni push su `main` e a ogni pull request. Usa uno scoping intelligente per saltare i job costosi quando sono cambiate solo aree non correlate.

QA Lab ha corsie CI dedicate al di fuori del workflow principale con scoping intelligente. Il
workflow `Parity gate` viene eseguito sulle modifiche PR corrispondenti e tramite dispatch manuale; esso
compila il runtime QA privato e confronta i pack agentici mock GPT-5.4 e Opus 4.6.
Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e tramite
dispatch manuale; distribuisce in parallelo il mock parity gate, la corsia Matrix live e la corsia
Telegram live come job paralleli. I job live usano l'ambiente `qa-live-shared`,
e la corsia Telegram usa lease Convex. Anche `OpenClaw Release
Checks` esegue le stesse corsie QA Lab prima dell'approvazione della release.

## Panoramica dei job

| Job                              | Scopo                                                                                        | Quando viene eseguito                |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Rileva modifiche solo alla documentazione, scope cambiati, estensioni cambiate e compila il manifest CI | Sempre su push e PR non draft        |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                          | Sempre su push e PR non draft        |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                 | Sempre su push e PR non draft        |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                            | Sempre su push e PR non draft        |
| `build-artifacts`                | Compila `dist/`, Control UI, controlli degli artifact compilati e artifact riutilizzabili downstream | Modifiche rilevanti per Node         |
| `checks-fast-core`               | Corsie rapide di correttezza Linux, come controlli bundled/plugin-contract/protocol          | Modifiche rilevanti per Node         |
| `checks-fast-contracts-channels` | Controlli shardizzati dei contratti dei canali con un risultato di controllo aggregato stabile | Modifiche rilevanti per Node         |
| `checks-node-extensions`         | Shard completi dei test dei plugin bundled nell'intera suite delle estensioni                | Modifiche rilevanti per Node         |
| `checks-node-core-test`          | Shard dei test core Node, escluse le corsie per canali, bundled, contratti ed estensioni    | Modifiche rilevanti per Node         |
| `extension-fast`                 | Test mirati solo per i plugin bundled modificati                                             | Pull request con modifiche alle estensioni |
| `check`                          | Equivalente locale principale shardizzato: tipi prod, lint, guard, tipi di test e smoke rigoroso | Modifiche rilevanti per Node         |
| `check-additional`               | Guard di architettura, boundary, surface delle estensioni, boundary dei package e shard gateway-watch | Modifiche rilevanti per Node         |
| `build-smoke`                    | Test smoke della CLI compilata e smoke sulla memoria all'avvio                               | Modifiche rilevanti per Node         |
| `checks`                         | Verificatore per i test dei canali sugli artifact compilati più compatibilità Node 22 solo su push | Modifiche rilevanti per Node         |
| `check-docs`                     | Controlli di formattazione docs, lint e link interrotti                                      | Documentazione modificata            |
| `skills-python`                  | Ruff + pytest per Skills basate su Python                                                    | Modifiche rilevanti per skill Python |
| `checks-windows`                 | Corsie di test specifiche per Windows                                                        | Modifiche rilevanti per Windows      |
| `macos-node`                     | Corsia di test TypeScript su macOS usando gli artifact compilati condivisi                   | Modifiche rilevanti per macOS        |
| `macos-swift`                    | Lint, build e test Swift per l'app macOS                                                     | Modifiche rilevanti per macOS        |
| `android`                        | Test unitari Android per entrambe le varianti più una build APK debug                        | Modifiche rilevanti per Android      |

## Ordine fail-fast

I job sono ordinati in modo che i controlli economici falliscano prima che partano quelli costosi:

1. `preflight` decide quali corsie esistono del tutto. La logica `docs-scope` e `changed-scope` è composta da step all'interno di questo job, non da job separati.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza aspettare i job più pesanti della matrice artifact e piattaforme.
3. `build-artifacts` si sovrappone alle corsie Linux rapide così i consumer downstream possono iniziare non appena la build condivisa è pronta.
4. Successivamente si distribuiscono le corsie più pesanti di piattaforma e runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` solo PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

La logica di scope si trova in `scripts/ci-changed-scope.mjs` ed è coperta da unit test in `src/scripts/ci-changed-scope.test.ts`.
Le modifiche ai workflow CI validano il grafo CI Node più il lint dei workflow, ma non impongono da sole build native Windows, Android o macOS; quelle corsie di piattaforma restano limitate alle modifiche del codice sorgente della relativa piattaforma.
I controlli Node per Windows sono limitati a wrapper specifici di processo/path di Windows, helper runner npm/pnpm/UI, configurazione del package manager e surface dei workflow CI che eseguono quella corsia; modifiche non correlate a sorgente, plugin, install-smoke e solo test restano sulle corsie Linux Node, così non riservano un worker Windows da 16 vCPU per una copertura già esercitata dagli shard di test normali.
Il workflow separato `install-smoke` riusa lo stesso script di scope tramite il proprio job `preflight`. Calcola `run_install_smoke` dal segnale changed-smoke più ristretto, quindi Docker/install smoke viene eseguito per modifiche rilevanti per installazione, packaging, container, modifiche di produzione alle estensioni bundled e le surface core plugin/channel/gateway/Plugin SDK esercitate dai job Docker smoke. Le modifiche solo test e solo documentazione non riservano worker Docker. Il suo smoke del pacchetto QR forza il layer Docker `pnpm install` a essere rieseguito preservando però la cache BuildKit del pnpm store, quindi esercita comunque l'installazione senza riscaricare le dipendenze a ogni esecuzione. Il suo gateway-network e2e riusa l'immagine runtime compilata in precedenza nel job, quindi aggiunge copertura WebSocket reale container-to-container senza aggiungere un'altra build Docker. In locale, `test:docker:all` precompila un'unica immagine live-test condivisa e un'unica immagine built-app condivisa da `scripts/e2e/Dockerfile`, poi esegue in parallelo le corsie smoke live/E2E con `OPENCLAW_SKIP_DOCKER_BUILD=1`; regola il parallelismo predefinito di 4 con `OPENCLAW_DOCKER_ALL_PARALLELISM`. L'aggregato locale smette per impostazione predefinita di pianificare nuove corsie in pool dopo il primo errore, e ogni corsia ha un timeout di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Le corsie sensibili all'avvio o al provider vengono eseguite in esclusiva dopo il pool parallelo. Il workflow live/E2E riutilizzabile rispecchia il pattern dell'immagine condivisa compilando e pubblicando un'unica immagine Docker E2E GHCR con tag SHA prima della matrice Docker, quindi eseguendo la matrice con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Il workflow live/E2E schedulato esegue quotidianamente l'intera suite Docker del percorso di release. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione. Un job separato `docker-e2e-fast` esegue il profilo Docker bounded bundled-plugin con un timeout di 120 secondi per comando: riparazione delle dipendenze setup-entry più isolamento sintetico dei guasti del bundled-loader. La matrice completa bundled update/channel resta manuale/full-suite perché esegue passaggi ripetuti reali di npm update e doctor repair.

La logica locale delle corsie modificate si trova in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Questo gate locale è più rigoroso sui boundary architetturali rispetto all'ampio scope CI di piattaforma: le modifiche di produzione core eseguono typecheck prod core più test core, le modifiche solo ai test core eseguono solo typecheck/test core di test, le modifiche di produzione alle estensioni eseguono typecheck prod delle estensioni più test delle estensioni, e le modifiche solo ai test delle estensioni eseguono solo typecheck/test delle estensioni di test. Le modifiche al Plugin SDK pubblico o al plugin-contract estendono la validazione alle estensioni perché le estensioni dipendono da quei contratti core. Gli incrementi di versione limitati ai soli metadati di release eseguono controlli mirati di versione/config/dipendenze root. Le modifiche sconosciute a root/config falliscono in modo sicuro su tutte le corsie.

Sui push, la matrice `checks` aggiunge la corsia `compat-node22` solo push. Sulle pull request, quella corsia viene saltata e la matrice resta focalizzata sulle normali corsie di test/canali.

Le famiglie di test Node più lente sono suddivise o bilanciate in modo che ogni job resti piccolo senza riservare runner in eccesso: i contratti dei canali vengono eseguiti come tre shard pesati, i test dei plugin bundled vengono bilanciati su sei worker di estensione, le piccole corsie unitarie core sono abbinate, auto-reply viene eseguito su tre worker bilanciati invece di sei worker minuscoli, e le configurazioni agentiche gateway/plugin sono distribuite sui job Node agentici solo-sorgente esistenti invece di aspettare gli artifact compilati. I test estesi di browser, QA, media e plugin vari usano le loro configurazioni Vitest dedicate invece del catch-all condiviso dei plugin. L'ampia corsia agents usa lo scheduler shared Vitest file-parallel perché è dominata da import/scheduling piuttosto che da un singolo file di test lento. `runtime-config` viene eseguito con lo shard infra core-runtime per evitare che lo shard runtime condiviso possieda la coda finale. `check-additional` mantiene insieme il lavoro compile/canary dei package-boundary e separa l'architettura della topologia runtime dalla copertura gateway watch; lo shard boundary guard esegue in concorrenza i suoi piccoli guard indipendenti all'interno di un unico job. Gateway watch, test dei canali e lo shard core support-boundary vengono eseguiti in concorrenza all'interno di `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati compilati, mantenendo i loro vecchi nomi di check come job verificatori leggeri, evitando però due worker Blacksmith aggiuntivi e una seconda coda di consumer degli artifact.
La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest`, poi compila l'APK debug Play. La variante third-party non ha un source set o manifest separato; la sua corsia di test unitari compila comunque quella variante con i flag SMS/call-log di BuildConfig, evitando però un job duplicato di packaging dell'APK debug a ogni push rilevante per Android.
`extension-fast` è solo PR perché le esecuzioni su push eseguono già gli shard completi dei plugin bundled. Questo mantiene un feedback rapido sui plugin modificati per le review senza riservare un worker Blacksmith aggiuntivo su `main` per una copertura già presente in `checks-node-extensions`.

GitHub può contrassegnare i job sostituiti come `cancelled` quando arriva un push più recente sullo stesso ref PR o `main`. Consideralo rumore della CI a meno che anche l'esecuzione più recente per lo stesso ref non stia fallendo. I check shard aggregati usano `!cancelled() && always()` così riportano comunque i normali errori degli shard ma non si mettono in coda dopo che l'intero workflow è già stato sostituito.
La chiave di concorrenza CI è versionata (`CI-v7-*`) così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le nuove esecuzioni su main.

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job di sicurezza rapidi e aggregati (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi protocol/contract/bundled, controlli shardizzati dei contratti dei canali, shard `check` tranne lint, shard e aggregati `check-additional`, verificatori aggregati dei test Node, controlli della documentazione, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight di install-smoke usa Ubuntu ospitato da GitHub così la matrice Blacksmith può mettersi in coda prima |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard dei test Linux Node, shard dei test dei plugin bundled, `android`                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, che resta abbastanza sensibile alla CPU da far costare di più 8 vCPU rispetto a quanto facevano risparmiare; build Docker di install-smoke, dove il tempo di coda di 32 vCPU costava più di quanto faceva risparmiare                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork ricadono su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork ricadono su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |

## Equivalenti locali

```bash
pnpm changed:lanes   # ispeziona il classificatore locale delle corsie modificate per origin/main...HEAD
pnpm check:changed   # gate locale intelligente: typecheck/lint/test modificati per corsia di boundary
pnpm check          # gate locale rapido: tsgo di produzione + lint shardizzato + guard rapidi in parallelo
pnpm check:test-types
pnpm check:timed    # stesso gate con temporizzazioni per fase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # test vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato docs + lint + link interrotti
pnpm build          # compila dist quando contano le corsie CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # riepiloga wall time, tempo di coda e job più lenti
node scripts/ci-run-timings.mjs --recent 10   # confronta le recenti esecuzioni CI riuscite su main
```
