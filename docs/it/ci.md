---
read_when:
    - Hai bisogno di capire perché un job CI è stato o non è stato eseguito
    - Stai eseguendo il debug di controlli GitHub Actions non riusciti
summary: Grafo dei job CI, gate di ambito ed equivalenti dei comandi locali
title: pipeline CI
x-i18n:
    generated_at: "2026-04-25T13:42:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc363efb98c9f82b585161a017ba1c599344a4e38c3fe683d81b0997d1d2fd4d
    source_path: ci.md
    workflow: 15
---

La CI viene eseguita a ogni push su `main` e a ogni pull request. Usa uno scoping intelligente per saltare i job costosi quando sono cambiate solo aree non correlate.

QA Lab ha corsie CI dedicate al di fuori del workflow principale con scoping intelligente. Il
workflow `Parity gate` viene eseguito su modifiche PR corrispondenti e su dispatch manuale; costruisce il runtime QA privato e confronta i pack agentici mock GPT-5.4 e Opus 4.6.
Il workflow `QA-Lab - All Lanes` viene eseguito ogni notte su `main` e su
dispatch manuale; distribuisce in parallelo il parity gate mock, la corsia live Matrix e la corsia live
Telegram. I job live usano l'ambiente `qa-live-shared`,
e la corsia Telegram usa lease Convex. `OpenClaw Release
Checks` esegue inoltre le stesse corsie QA Lab prima dell'approvazione del rilascio.

Il workflow `Duplicate PRs After Merge` è un workflow manuale per maintainer per
la pulizia dei duplicati dopo il merge. Per impostazione predefinita usa dry-run e chiude
solo le PR elencate esplicitamente quando `apply=true`. Prima di modificare GitHub,
verifica che la PR integrata sia merged e che ogni duplicato abbia o un issue referenziato condiviso
oppure hunk modificati sovrapposti.

Il workflow `Docs Agent` è una corsia di manutenzione Codex guidata dagli eventi per mantenere
allineata la documentazione esistente con le modifiche integrate di recente. Non ha una pianificazione pura:
un'esecuzione CI push riuscita su `main` non bot può attivarlo, e un dispatch manuale può
eseguirlo direttamente. Le invocazioni workflow-run vengono saltate quando `main` è avanzato
oppure quando un'altra esecuzione Docs Agent non saltata è stata creata nell'ultima ora. Quando viene eseguito,
esamina l'intervallo di commit dallo SHA sorgente del precedente Docs Agent non saltato a
`main` corrente, così un'esecuzione oraria può coprire tutte le modifiche su main
accumulate dall'ultimo passaggio docs.

Il workflow `Test Performance Agent` è una corsia di manutenzione Codex guidata dagli eventi
per i test lenti. Non ha una pianificazione pura: una riuscita esecuzione CI push non bot su
`main` può attivarlo, ma viene saltato se un'altra invocazione workflow-run è già stata
eseguita o è in esecuzione in quel giorno UTC. Il dispatch manuale aggira quel gate
di attività giornaliera. La corsia costruisce un report completo delle prestazioni di Vitest raggruppato,
consente a Codex di apportare solo piccole correzioni alle prestazioni dei test che preservino la copertura invece di ampi refactor,
poi riesegue il report completo e rifiuta modifiche che riducono il numero di test
passing della baseline. Se la baseline ha test non riusciti, Codex può correggere
solo errori evidenti e il report completo dopo l'agente deve passare prima che venga fatto qualsiasi commit.
Quando `main` avanza prima che il push del bot venga integrato, la corsia effettua il rebase
della patch validata, riesegue `pnpm check:changed` e ritenta il push;
le patch obsolete in conflitto vengono saltate. Usa Ubuntu ospitato da GitHub così l'azione Codex
può mantenere la stessa postura di sicurezza drop-sudo del docs agent.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Panoramica dei job

| Job                              | Scopo                                                                                        | Quando viene eseguito                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | Rileva modifiche solo docs, scope modificati, estensioni modificate e costruisce il manifest CI | Sempre su push e PR non draft         |
| `security-scm-fast`              | Rilevamento di chiavi private e audit workflow tramite `zizmor`                              | Sempre su push e PR non draft         |
| `security-dependency-audit`      | Audit del lockfile di produzione senza dipendenze rispetto agli advisory npm                 | Sempre su push e PR non draft         |
| `security-fast`                  | Aggregato richiesto per i job di sicurezza veloci                                            | Sempre su push e PR non draft         |
| `build-artifacts`                | Costruisce `dist/`, Control UI, controlli sugli artifact buildati e artifact riutilizzabili downstream | Modifiche rilevanti per Node          |
| `checks-fast-core`               | Corsie veloci di correttezza Linux come controlli bundled/plugin-contract/protocol           | Modifiche rilevanti per Node          |
| `checks-fast-contracts-channels` | Controlli dei contratti dei canali sharded con un risultato aggregato stabile                | Modifiche rilevanti per Node          |
| `checks-node-extensions`         | Shard completi di test dei plugin inclusi su tutta la suite di estensioni                    | Modifiche rilevanti per Node          |
| `checks-node-core-test`          | Shard dei test core Node, escluse le corsie canali, bundled, contratti ed estensioni        | Modifiche rilevanti per Node          |
| `extension-fast`                 | Test mirati solo per i plugin inclusi modificati                                             | Pull request con modifiche alle estensioni |
| `check`                          | Equivalente principale locale sharded: tipi prod, lint, guard, tipi test e strict smoke     | Modifiche rilevanti per Node          |
| `check-additional`               | Shard di architettura, boundary, guard sulle superfici delle estensioni, boundary dei package e gateway-watch | Modifiche rilevanti per Node          |
| `build-smoke`                    | Smoke test della CLI buildata e smoke della memoria all'avvio                                | Modifiche rilevanti per Node          |
| `checks`                         | Verificatore per test dei canali su artifact buildati più compatibilità Node 22 solo push    | Modifiche rilevanti per Node          |
| `check-docs`                     | Formattazione docs, lint e controlli sui link rotti                                          | Docs modificate                       |
| `skills-python`                  | Ruff + pytest per Skills basate su Python                                                    | Modifiche rilevanti per skill Python  |
| `checks-windows`                 | Corsie di test specifiche per Windows                                                        | Modifiche rilevanti per Windows       |
| `macos-node`                     | Corsia di test TypeScript macOS che usa gli artifact buildati condivisi                      | Modifiche rilevanti per macOS         |
| `macos-swift`                    | Lint, build e test Swift per l'app macOS                                                     | Modifiche rilevanti per macOS         |
| `android`                        | Test unitari Android per entrambe le flavor più una build APK debug                          | Modifiche rilevanti per Android       |
| `test-performance-agent`         | Ottimizzazione giornaliera dei test lenti tramite Codex dopo attività attendibile            | Successo della CI su main o dispatch manuale |

## Ordine fail-fast

I job sono ordinati in modo che i controlli economici falliscano prima che vengano eseguiti quelli costosi:

1. `preflight` decide quali corsie esistono del tutto. La logica `docs-scope` e `changed-scope` è costituita da step all'interno di questo job, non da job autonomi.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` e `skills-python` falliscono rapidamente senza attendere i job più pesanti della matrice artifact e piattaforme.
3. `build-artifacts` si sovrappone alle corsie Linux veloci così i consumer downstream possono iniziare non appena la build condivisa è pronta.
4. Le corsie più pesanti di piattaforma e runtime si distribuiscono dopo: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` solo PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` e `android`.

La logica di scope si trova in `scripts/ci-changed-scope.mjs` ed è coperta da unit test in `src/scripts/ci-changed-scope.test.ts`.
Le modifiche al workflow CI validano il grafo CI Node più il lint dei workflow, ma da sole non forzano build native Windows, Android o macOS; quelle corsie di piattaforma restano limitate alle modifiche del codice sorgente della piattaforma.
Le modifiche solo di instradamento CI, alcune modifiche selezionate a fixture economiche dei core test e modifiche ristrette agli helper/test-routing dei contratti Plugin usano un percorso manifest Node-only veloce: preflight, security e una singola attività `checks-fast-core`. Quel percorso evita artifact di build, compatibilità Node 22, contratti dei canali, shard completi del core, shard dei Plugin inclusi e matrici di guard aggiuntive quando i file modificati sono limitati alle superfici di instradamento o helper che l'attività veloce esercita direttamente.
I controlli Windows Node sono limitati a wrapper Windows-specific per processi/percorsi, helper runner npm/pnpm/UI, configurazione del package manager e superfici del workflow CI che eseguono quella corsia; modifiche non correlate al codice sorgente, ai Plugin, a install-smoke e solo ai test restano sulle corsie Linux Node così non riservano un worker Windows a 16 vCPU per una copertura già esercitata dagli shard di test normali.
Il workflow separato `install-smoke` riutilizza lo stesso script di scope tramite il proprio job `preflight`. Divide la copertura smoke in `run_fast_install_smoke` e `run_full_install_smoke`. Le pull request eseguono il percorso veloce per superfici Docker/package, modifiche a package/manifest dei Plugin inclusi e superfici core Plugin/canale/Gateway/Plugin SDK che i job Docker smoke esercitano. Le modifiche solo al codice sorgente dei Plugin inclusi, le modifiche solo ai test e le modifiche solo alla documentazione non riservano worker Docker. Il percorso veloce costruisce una volta l'immagine Dockerfile root, controlla la CLI, esegue lo smoke CLI degli agenti delete shared-workspace, esegue l'e2e container gateway-network, verifica un build arg di un'estensione inclusa ed esegue il profilo Docker del Plugin incluso limitato con un timeout aggregato dei comandi di 240 secondi, con il `docker run` di ogni scenario limitato separatamente. Il percorso completo mantiene la copertura dell'installazione del package QR e del Docker/update dell'installer per esecuzioni pianificate notturne, dispatch manuali, controlli di rilascio workflow-call e pull request che toccano davvero le superfici installer/package/Docker. I push su `main`, inclusi i merge commit, non forzano il percorso completo; quando la logica changed-scope richiederebbe la copertura completa su un push, il workflow mantiene il Docker smoke veloce e lascia l'install smoke completo alla validazione notturna o di rilascio. Il lento smoke image-provider dell'installazione globale Bun è regolato separatamente da `run_bun_global_install_smoke`; viene eseguito nella pianificazione notturna e dal workflow di controllo dei rilasci, e i dispatch manuali `install-smoke` possono includerlo, ma pull request e push su `main` non lo eseguono. I test QR e installer Docker mantengono i propri Dockerfile focalizzati sull'installazione. Il comando locale `test:docker:all` precompila un'immagine live-test condivisa e un'immagine built-app condivisa `scripts/e2e/Dockerfile`, poi esegue le corsie smoke live/E2E con uno scheduler ponderato e `OPENCLAW_SKIP_DOCKER_BUILD=1`; regola il numero predefinito di slot del pool principale pari a 10 con `OPENCLAW_DOCKER_ALL_PARALLELISM` e il numero di slot del tail-pool sensibile al provider, anch'esso pari a 10, con `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. I limiti delle corsie pesanti sono per impostazione predefinita `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` così le corsie npm install e multi-service non sovraccaricano Docker mentre le corsie più leggere riempiono comunque gli slot disponibili. L'avvio delle corsie è sfalsato di 2 secondi per impostazione predefinita per evitare tempeste di creazione del daemon Docker in locale; sovrascrivi con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` o un altro valore in millisecondi. L'aggregato locale esegue preflight su Docker, rimuove i container OpenClaw E2E obsoleti, emette lo stato delle corsie attive, persiste i tempi delle corsie per l'ordinamento dal più lungo al più corto e supporta `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per l'ispezione dello scheduler. Per impostazione predefinita smette di pianificare nuove corsie in pool dopo il primo errore e ogni corsia ha un timeout di fallback di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; alcune corsie live/tail selezionate usano limiti più stretti per corsia. Il workflow riutilizzabile live/E2E rispecchia il pattern dell'immagine condivisa costruendo e pubblicando un'unica immagine Docker E2E GHCR con tag SHA prima della matrice Docker, quindi esegue la matrice con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Il workflow pianificato live/E2E esegue ogni giorno la suite Docker completa del percorso di rilascio. La matrice di aggiornamento inclusa è divisa per destinazione di aggiornamento così i passaggi ripetuti npm update e doctor repair possono essere shardati con altri controlli inclusi.

La logica locale delle changed-lane si trova in `scripts/changed-lanes.mjs` ed è eseguita da `scripts/check-changed.mjs`. Quel gate locale è più rigoroso sui boundary architetturali rispetto all'ampio scope CI di piattaforma: le modifiche di produzione core eseguono typecheck di produzione core più test core, le modifiche solo ai test core eseguono solo typecheck/tests dei test core, le modifiche di produzione delle estensioni eseguono typecheck di produzione delle estensioni più test delle estensioni e le modifiche solo ai test delle estensioni eseguono solo typecheck/tests dei test delle estensioni. Le modifiche pubbliche al Plugin SDK o ai plugin-contract estendono la validazione alle estensioni perché le estensioni dipendono da quei contratti core. Gli incrementi di versione solo del metadata di rilascio eseguono controlli mirati su versione/config/dependency root. Le modifiche root/config sconosciute fanno fail-safe su tutte le corsie.

Sui push, la matrice `checks` aggiunge la corsia `compat-node22` solo push. Sulle pull request, quella corsia viene saltata e la matrice resta focalizzata sulle normali corsie test/canale.

Le famiglie di test Node più lente sono divise o bilanciate così ogni job resta piccolo senza riservare troppi runner: i contratti dei canali vengono eseguiti come tre shard ponderati, i test dei Plugin inclusi sono bilanciati su sei worker di estensione, le piccole corsie di unit test core vengono abbinate, auto-reply viene eseguito su tre worker bilanciati invece di sei worker minuscoli e le configurazioni agentic Gateway/Plugin sono distribuite sui job agentic Node esistenti solo sorgente invece di attendere gli artifact buildati. I test estesi browser, QA, media e vari Plugin usano le loro configurazioni Vitest dedicate invece del catch-all condiviso dei Plugin. I job shard delle estensioni eseguono fino a due gruppi di configurazione Plugin alla volta con un worker Vitest per gruppo e un heap Node più grande così i batch di Plugin con molti import non creano job CI aggiuntivi. L'ampia corsia agents usa lo scheduler condiviso Vitest a parallelismo per file perché è dominata da import/scheduling invece che da un singolo file di test lento. `runtime-config` viene eseguito con lo shard infra core-runtime per evitare che lo shard runtime condiviso possieda la coda finale. `check-additional` mantiene insieme il lavoro compile/canary dei boundary dei package e separa l'architettura della topologia runtime dalla copertura gateway watch; lo shard boundary guard esegue i suoi piccoli guard indipendenti in concorrenza all'interno di un unico job. Gateway watch, test dei canali e lo shard core support-boundary vengono eseguiti in concorrenza all'interno di `build-artifacts` dopo che `dist/` e `dist-runtime/` sono già stati costruiti, mantenendo i loro vecchi nomi di check come job verificatori leggeri evitando però due worker Blacksmith aggiuntivi e una seconda coda consumer di artifact.
La CI Android esegue sia `testPlayDebugUnitTest` sia `testThirdPartyDebugUnitTest`, poi costruisce l'APK debug Play. La flavor third-party non ha un source set o manifest separato; la sua corsia di unit test compila comunque quella flavor con i flag BuildConfig SMS/call-log, evitando però un job duplicato di packaging APK debug a ogni push rilevante per Android.
`extension-fast` è solo PR perché le esecuzioni push eseguono già gli shard completi dei Plugin inclusi. Questo mantiene il feedback sui Plugin modificati per le review senza riservare un worker Blacksmith aggiuntivo su `main` per una copertura già presente in `checks-node-extensions`.

GitHub può contrassegnare i job sostituiti come `cancelled` quando un push più recente arriva sulla stessa PR o ref `main`. Consideralo rumore CI a meno che anche l'esecuzione più recente per la stessa ref non stia fallendo. I check aggregati degli shard usano `!cancelled() && always()` così riportano comunque i normali errori degli shard ma non si accodano dopo che l'intero workflow è già stato sostituito.
La chiave di concorrenza CI è versionata (`CI-v7-*`) così un processo zombie lato GitHub in un vecchio gruppo di coda non può bloccare indefinitamente le esecuzioni più recenti su main.

## Runner

| Runner                           | Job                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, job di sicurezza veloci e aggregati (`security-scm-fast`, `security-dependency-audit`, `security-fast`), controlli veloci protocol/contract/bundled, controlli sharded dei contratti dei canali, shard `check` tranne lint, shard e aggregati `check-additional`, verificatori aggregati dei test Node, controlli docs, Skills Python, workflow-sanity, labeler, auto-response; anche il preflight di install-smoke usa Ubuntu ospitato da GitHub così la matrice Blacksmith può mettersi in coda prima |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shard dei test Linux Node, shard dei test dei Plugin inclusi, `android`                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, che resta abbastanza sensibile alla CPU da rendere più costosi 8 vCPU rispetto al risparmio ottenuto; build Docker di install-smoke, dove il tempo di coda a 32 vCPU costava più del risparmio ottenuto                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` su `openclaw/openclaw`; i fork usano come fallback `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` su `openclaw/openclaw`; i fork usano come fallback `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                          |

## Equivalenti locali

```bash
pnpm changed:lanes   # ispeziona il classificatore locale delle changed-lane per origin/main...HEAD
pnpm check:changed   # gate locale intelligente: typecheck/lint/test modificati per boundary lane
pnpm check          # gate locale veloce: tsgo di produzione + lint sharded + guard veloci in parallelo
pnpm check:test-types
pnpm check:timed    # stesso gate con timing per fase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # test vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato docs + lint + link rotti
pnpm build          # build di dist quando contano le corsie CI artifact/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # riepiloga wall time, queue time e job più lenti
node scripts/ci-run-timings.mjs --recent 10   # confronta le recenti esecuzioni CI riuscite su main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Canali di rilascio](/it/install/development-channels)
