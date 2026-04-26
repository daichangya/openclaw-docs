---
read_when:
    - Devi capire perché un job CI è stato o non è stato eseguito
    - Stai eseguendo il debug di controlli GitHub Actions non riusciti
summary: Grafo dei job CI, gate di ambito ed equivalenti dei comandi locali
title: Pipeline CI
x-i18n:
    generated_at: "2026-04-26T11:24:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a6c14f785434585f2b3a72bcd2cff3a281e51fe12cc4c14aa7613d47cd8efc4
    source_path: ci.md
    workflow: 15
---

La CI viene eseguita a ogni push su `main` e a ogni pull request. Usa uno scope intelligente per saltare i job costosi quando sono cambiate solo aree non correlate.

QA Lab ha corsie CI dedicate al di fuori del workflow principale con scope intelligente. Il workflow `Parity gate` viene eseguito su modifiche PR corrispondenti e tramite avvio manuale; costruisce il runtime QA privato e confronta i pacchetti agentici mock GPT-5.5 e Opus 4.6. Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e tramite avvio manuale; distribuisce in parallelo il mock parity gate, la corsia live Matrix e la corsia live Telegram. I job live usano l'ambiente `qa-live-shared` e la corsia Telegram usa lease Convex. Anche `OpenClaw Release Checks` esegue le stesse corsie QA Lab prima dell'approvazione della release.

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer dedicato alla pulizia dei duplicati dopo il merge. Per impostazione predefinita usa il dry-run e chiude solo le PR elencate esplicitamente quando `apply=true`. Prima di modificare GitHub, verifica che la PR atterrata sia unita e che ogni duplicato abbia un issue referenziato condiviso oppure hunk modificati sovrapposti.

Il workflow `Docs Agent` è una corsia di manutenzione Codex guidata da eventi per mantenere la documentazione esistente allineata alle modifiche appena integrate. Non ha una pianificazione pura: un'esecuzione CI push riuscita, non bot, su `main` può attivarlo, e l'avvio manuale può eseguirlo direttamente. Le invocazioni workflow-run vengono saltate quando `main` è già avanzato oppure quando è stata creata un'altra esecuzione Docs Agent non saltata nell'ultima ora. Quando viene eseguito, esamina l'intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato fino all'attuale `main`, così una singola esecuzione oraria può coprire tutte le modifiche a main accumulate dall'ultimo passaggio sulla documentazione.

Il workflow `Test Performance Agent` è una corsia di manutenzione Codex guidata da eventi per i test lenti. Non ha una pianificazione pura: una CI push riuscita, non bot, su `main` può attivarlo, ma viene saltato se un'altra invocazione workflow-run è già stata eseguita o è in esecuzione in quel giorno UTC. L'avvio manuale aggira questo gate giornaliero di attività. La corsia costruisce un report completo delle prestazioni di Vitest raggruppato sull'intera suite, consente a Codex di apportare solo piccole correzioni prestazionali ai test che preservino la copertura invece di refactor estesi, quindi riesegue il report completo e rifiuta modifiche che riducano il numero di test di baseline superati. Se la baseline ha test non riusciti, Codex può correggere solo i problemi evidenti e il report completo dopo l'intervento dell'agente deve riuscire prima che venga eseguito qualsiasi commit. Quando `main` avanza prima che il push del bot venga integrato, la corsia ribasa la patch validata, riesegue `pnpm check:changed` e ritenta il push; le patch obsolete in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex può mantenere la stessa postura di sicurezza drop-sudo del docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Panoramica dei job

| Job                              | Scopo                                                                                        | Quando viene eseguito                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | Rileva modifiche solo docs, scope cambiati, estensioni cambiate e costruisce il manifesto CI | Sempre su push e PR non draft         |
| `security-scm-fast`              | Rilevamento di chiavi private e audit dei workflow tramite `zizmor`                          | Sempre su push e PR non draft         |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                 | Sempre su push e PR non draft         |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza rapidi                                            | Sempre su push e PR non draft         |
| `build-artifacts`                | Costruisce `dist/`, Control UI, controlli sugli artifact buildati e artifact riutilizzabili downstream | Modifiche rilevanti per Node          |
| `checks-fast-core`               | Corsie rapide Linux di correttezza, come controlli bundled/plugin-contract/protocol          | Modifiche rilevanti per Node          |
| `checks-fast-contracts-channels` | Controlli shard dei contratti dei canali con un risultato di check aggregato stabile         | Modifiche rilevanti per Node          |
| `checks-node-extensions`         | Shard completi di test dei plugin inclusi nell'intera suite delle estensioni                | Modifiche rilevanti per Node          |
| `checks-node-core-test`          | Shard di test core Node, escluse corsie canali, bundled, contratti ed estensioni            | Modifiche rilevanti per Node          |
| `extension-fast`                 | Test mirati solo per i plugin inclusi modificati                                             | Pull request con modifiche alle estensioni |
| `check`                          | Equivalente principale shard del gate locale: tipi prod, lint, guard, tipi test e strict smoke | Modifiche rilevanti per Node          |
| `check-additional`               | Shard per architettura, boundary, guard delle superfici estensioni, boundary dei pacchetti e gateway-watch | Modifiche rilevanti per Node          |
| `build-smoke`                    | Test smoke della CLI buildata e smoke sulla memoria all'avvio                                | Modifiche rilevanti per Node          |
| `checks`                         | Verificatore per test canale sugli artifact buildati più compatibilità Node 22 solo su push  | Modifiche rilevanti per Node          |
| `check-docs`                     | Controlli di formattazione docs, lint e link rotti                                           | Docs modificate                       |
| `skills-python`                  | Ruff + pytest per Skills basate su Python                                                    | Modifiche rilevanti per Skills Python |
| `checks-windows`                 | Corsie di test specifiche per Windows                                                        | Modifiche rilevanti per Windows       |
| `macos-node`                     | Corsia di test TypeScript su macOS usando gli artifact buildati condivisi                    | Modifiche rilevanti per macOS         |
| `macos-swift`                    | Lint, build e test Swift per l'app macOS                                                     | Modifiche rilevanti per macOS         |
| `android`                        | Test unitari Android per entrambe le varianti più una build APK debug                        | Modifiche rilevanti per Android       |
| `test-performance-agent`         | Ottimizzazione giornaliera Codex dei test lenti dopo attività attendibile                    | Successo della CI su main o avvio manuale |

## Ordine fail-fast

I job sono ordinati in modo che i controlli economici falliscano prima che vengano eseguiti quelli costosi:

1. `preflight` decide quali corsie esistono effettivamente. La logica `docs-scope` e `changed-scope` è costituita da step interni a questo job, non da job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti della matrice artifact e piattaforme.
3. `build-artifacts` si sovrappone alle corsie Linux rapide così i consumatori downstream possono iniziare non appena la build condivisa è pronta.
4. Successivamente si distribuiscono le corsie più pesanti di piattaforma e runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` solo PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

La logica di scope si trova in `scripts/ci-changed-scope.mjs` ed è coperta da unit test in `src/scripts/ci-changed-scope.test.ts`.
Le modifiche ai workflow CI validano il grafo CI Node più il lint dei workflow, ma da sole non forzano build native Windows, Android o macOS; quelle corsie di piattaforma restano limitate alle modifiche del codice sorgente della piattaforma.
Le modifiche solo di instradamento CI, alcune modifiche selezionate ed economiche ai fixture dei test core e modifiche ristrette agli helper/test-routing dei contratti Plugin usano un percorso manifesto rapido solo Node: preflight, sicurezza e un singolo task `checks-fast-core`. Quel percorso evita artifact di build, compatibilità Node 22, contratti dei canali, shard core completi, shard dei plugin inclusi e matrici di guard aggiuntive quando i file modificati sono limitati alle superfici di instradamento o helper esercitate direttamente dal task rapido.
I controlli Node Windows sono limitati a wrapper di processo/percorso specifici di Windows, helper runner npm/pnpm/UI, configurazione del package manager e superfici dei workflow CI che eseguono quella corsia; modifiche non correlate a sorgente, plugin, install-smoke e solo test restano nelle corsie Linux Node così non riservano un worker Windows da 16 vCPU per una copertura già esercitata dagli shard di test normali.
Il workflow separato `install-smoke` riusa lo stesso script di scope tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`. Le pull request eseguono il percorso rapido per superfici Docker/package, modifiche a package/manifest di plugin inclusi e superfici core plugin/canale/Gateway/Plugin SDK esercitate dai job Docker smoke. Modifiche solo sorgente ai plugin inclusi, modifiche solo test e modifiche solo docs non riservano worker Docker. Il percorso rapido costruisce una sola volta l'immagine del Dockerfile root, controlla la CLI, esegue lo smoke CLI agents delete shared-workspace, esegue l'e2e container gateway-network, verifica un build arg di estensione inclusa ed esegue il profilo Docker bounded bundled-plugin con un timeout aggregato del comando di 240 secondi e con il limite del Docker run di ogni scenario separato. Il percorso completo mantiene la copertura di installazione package QR e installer Docker/update per esecuzioni notturne pianificate, avvii manuali, controlli release workflow-call e pull request che toccano realmente superfici installer/package/Docker. I push su `main`, inclusi i merge commit, non forzano il percorso completo; quando la logica changed-scope richiederebbe copertura completa su un push, il workflow mantiene il Docker smoke rapido e lascia l'install smoke completo alla validazione notturna o di release. Il lento smoke del provider immagini con installazione globale Bun è regolato separatamente da `run_bun_global_install_smoke`; viene eseguito nella pianificazione notturna e dal workflow dei controlli release, e gli avvii manuali `install-smoke` possono abilitarlo, ma pull request e push su `main` non lo eseguono. I test Docker QR e installer mantengono i propri Dockerfile focalizzati sull'installazione. Localmente, `test:docker:all` precompila un'unica immagine condivisa live-test e un'unica immagine built-app condivisa `scripts/e2e/Dockerfile`, poi esegue le corsie smoke live/E2E con uno scheduler ponderato e `OPENCLAW_SKIP_DOCKER_BUILD=1`; regola il numero predefinito di slot del pool principale pari a 10 con `OPENCLAW_DOCKER_ALL_PARALLELISM` e il numero di slot del tail-pool sensibile al provider, anch'esso pari a 10, con `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. I limiti delle corsie pesanti sono per impostazione predefinita `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` così le corsie npm install e multi-servizio non sovraccaricano Docker mentre quelle più leggere continuano a riempire gli slot disponibili. L'avvio delle corsie è sfalsato di 2 secondi per impostazione predefinita per evitare tempeste di creazione del daemon Docker locale; fai override con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` o un altro valore in millisecondi. L'aggregato locale esegue il preflight di Docker, rimuove container OpenClaw E2E obsoleti, emette lo stato delle corsie attive, persiste le tempistiche delle corsie per l'ordinamento longest-first e supporta `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per l'ispezione dello scheduler. Per impostazione predefinita smette di pianificare nuove corsie pooled dopo il primo errore e ogni corsia ha un timeout fallback di 120 minuti che può essere sovrascritto con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; alcune corsie live/tail selezionate usano limiti per corsia più stretti. Il workflow riutilizzabile live/E2E replica il modello shared-image costruendo e pubblicando una sola immagine Docker E2E GHCR con tag SHA prima della matrice Docker, quindi eseguendo la matrice con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Il workflow pianificato live/E2E esegue quotidianamente la suite Docker completa del percorso release. La matrice di aggiornamento dei plugin inclusi è divisa per destinazione di aggiornamento così i passaggi ripetuti npm update e doctor repair possono essere shardizzati insieme agli altri controlli bundled.

La logica locale changed-lane si trova in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate locale è più rigoroso riguardo ai boundary architetturali rispetto all'ampio scope di piattaforma CI: le modifiche core di produzione eseguono typecheck core prod più test core, le modifiche solo test core eseguono solo typecheck/test core test, le modifiche di produzione delle estensioni eseguono typecheck extension prod più test delle estensioni e le modifiche solo test delle estensioni eseguono solo typecheck/test extension test. Le modifiche pubbliche al Plugin SDK o al contratto Plugin espandono la validazione alle estensioni perché le estensioni dipendono da quei contratti core. I bump di versione solo metadata di release eseguono controlli mirati di versione/configurazione/dipendenze root. Modifiche root/configurazione sconosciute passano in fail-safe a tutte le corsie.

Nei push, la matrice `checks` aggiunge la corsia `compat-node22` solo push. Nelle pull request, quella corsia viene saltata e la matrice resta focalizzata sulle normali corsie test/canale.

Le famiglie di test Node più lente sono suddivise o bilanciate così ogni job resta piccolo senza riservare runner in eccesso: i contratti dei canali vengono eseguiti come tre shard ponderati, i test dei plugin inclusi sono bilanciati su sei worker di estensione, le piccole corsie unit core vengono accoppiate, auto-reply viene eseguito su quattro worker bilanciati con il sottoalbero reply diviso in shard agent-runner, dispatch e commands/state-routing, e le configurazioni agentic Gateway/Plugin sono distribuite sui job Node agentic già esistenti solo sorgente invece di attendere artifact buildati. I test estesi browser, QA, media e plugin vari usano le loro configurazioni Vitest dedicate invece della catch-all condivisa per i plugin. I job shard delle estensioni eseguono fino a due gruppi di configurazione plugin alla volta con un worker Vitest per gruppo e un heap Node più grande così i batch di plugin pesanti in import non creano job CI aggiuntivi. L'ampia corsia agents usa lo scheduler condiviso Vitest file-parallel perché è dominata da import/scheduling piuttosto che da un singolo file di test lento. `runtime-config` viene eseguito con lo shard infra core-runtime per evitare che lo shard runtime condiviso possieda la coda finale. Gli shard include-pattern registrano voci temporali usando il nome shard CI, così `.artifacts/vitest-shard-timings.json` può distinguere un'intera configurazione da uno shard filtrato. `check-additional` tiene insieme il lavoro di compilazione/canary dei boundary di package e separa l'architettura della topologia runtime dalla copertura gateway watch; lo shard boundary guard esegue in concorrenza i suoi piccoli guard indipendenti all'interno di un unico job. Gateway watch, test dei canali e lo shard core support-boundary vengono eseguiti in concorrenza dentro `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati costruiti, mantenendo i vecchi nomi di check come job verificatori leggeri ed evitando due worker Blacksmith extra e una seconda coda di consumatori di artifact.
La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest`, quindi costruisce l'APK Play debug. La variante third-party non ha un source set o manifest separato; la sua corsia unit-test compila comunque quella variante con i flag BuildConfig SMS/call-log, evitando però un job duplicato di packaging APK debug a ogni push rilevante per Android.
`extension-fast` è solo PR perché le esecuzioni push eseguono già gli shard completi dei plugin inclusi. Questo mantiene il feedback sui plugin modificati per le review senza riservare un worker Blacksmith extra su `main` per una copertura già presente in `checks-node-extensions`.

GitHub può contrassegnare i job sostituiti come `cancelled` quando arriva un push più recente sulla stessa PR o ref `main`. Trattalo come rumore CI a meno che anche l'esecuzione più recente per la stessa ref non stia fallendo. I check shard aggregati usano `!cancelled() && always()` così continuano a riportare i normali errori degli shard ma non vengono messi in coda dopo che l'intero workflow è già stato sostituito.
La chiave di concorrenza CI è versionata (`CI-v7-*`) così uno zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le esecuzioni più recenti su main.

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, job e aggregati di sicurezza rapidi (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli rapidi di protocollo/contratti/bundled, controlli shard dei contratti dei canali, shard `check` eccetto lint, shard e aggregati `check-additional`, verificatori aggregati dei test Node, controlli docs, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight di install-smoke usa Ubuntu ospitato da GitHub così la matrice Blacksmith può entrare in coda prima |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard di test Linux Node, shard di test dei plugin inclusi, `android`                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, che resta sufficientemente sensibile alla CPU al punto che 8 vCPU costavano più di quanto facessero risparmiare; build Docker di install-smoke, dove il costo in tempo di coda di 32 vCPU superava il risparmio                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork ricadono su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork ricadono su `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## Equivalenti locali

```bash
pnpm changed:lanes   # ispeziona il classificatore locale delle corsie modificate per origin/main...HEAD
pnpm check:changed   # gate locale intelligente: typecheck/lint/test modificati per corsia di boundary
pnpm check          # gate locale rapido: tsgo di produzione + lint shardizzato + guard rapidi in parallelo
pnpm check:test-types
pnpm check:timed    # stesso gate con tempi per fase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # test Vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato docs + lint + link rotti
pnpm build          # costruisce dist quando contano le corsie CI artifact/build-smoke
pnpm ci:timings                               # riepiloga l'ultima esecuzione CI push di origin/main
pnpm ci:timings:recent                        # confronta le recenti esecuzioni CI main riuscite
node scripts/ci-run-timings.mjs <run-id>      # riepiloga wall time, tempo di coda e job più lenti
node scripts/ci-run-timings.mjs --latest-main # ignora il rumore di issue/commenti e sceglie la CI push di origin/main
node scripts/ci-run-timings.mjs --recent 10   # confronta le recenti esecuzioni main riuscite
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Correlati

- [Panoramica installazione](/it/install)
- [Canali di sviluppo](/it/install/development-channels)
