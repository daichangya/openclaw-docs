---
read_when:
    - Esecuzione o correzione dei test
summary: Come eseguire i test in locale (vitest) e quando usare le modalità force/copertura
title: Test
x-i18n:
    generated_at: "2026-04-25T13:56:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc138f5e3543b45598ab27b9f7bc9ce43979510b4508580a0cf95c43f97bac53
    source_path: reference/test.md
    workflow: 15
---

- Kit completo per i test (suite, live, Docker): [Testing](/it/help/testing)

- `pnpm test:force`: termina qualsiasi processo Gateway residuo che mantiene occupata la porta di controllo predefinita, quindi esegue l'intera suite Vitest con una porta Gateway isolata in modo che i test del server non vadano in conflitto con un'istanza in esecuzione. Usalo quando un'esecuzione precedente del Gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: esegue la suite unit con copertura V8 (tramite `vitest.unit.config.ts`). Questo è un gate di copertura unit dei file caricati, non una copertura di tutti i file dell'intero repository. Le soglie sono 70% per linee/funzioni/istruzioni e 55% per i branch. Poiché `coverage.all` è false, il gate misura i file caricati dalla suite di copertura unit invece di trattare ogni file sorgente delle lane suddivise come non coperto.
- `pnpm test:coverage:changed`: esegue la copertura unit solo per i file modificati rispetto a `origin/main`.
- `pnpm test:changed`: espande i percorsi git modificati in lane Vitest con ambito limitato quando il diff tocca solo file sorgente/test instradabili. Le modifiche di configurazione/setup ripiegano comunque sull'esecuzione nativa dei progetti root, così le modifiche al wiring riattivano un'esecuzione più ampia quando necessario.
- `pnpm changed:lanes`: mostra le lane architetturali attivate dal diff rispetto a `origin/main`.
- `pnpm check:changed`: esegue il gate intelligente per le modifiche del diff rispetto a `origin/main`. Esegue il lavoro core con le lane di test core, il lavoro delle estensioni con le lane di test delle estensioni, il lavoro solo test con solo typecheck/test dei test, amplia le modifiche pubbliche al Plugin SDK o ai contratti plugin a un passaggio di validazione delle estensioni e mantiene gli incrementi di versione che toccano solo metadati di release su controlli mirati di versione/configurazione/dipendenze root.
- `pnpm test`: instrada file/directory di destinazione espliciti tramite lane Vitest con ambito limitato. Le esecuzioni senza target usano gruppi shard fissi e si espandono in configurazioni leaf per l'esecuzione parallela locale; il gruppo estensioni si espande sempre nelle configurazioni shard per singola estensione invece che in un unico enorme processo root-project.
- Le esecuzioni complete e quelle shard delle estensioni aggiornano i dati temporali locali in `.artifacts/vitest-shard-timings.json`; le esecuzioni successive usano quei tempi per bilanciare shard lenti e veloci. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l'artefatto temporale locale.
- Alcuni file di test `plugin-sdk` e `commands` ora vengono instradati tramite lane leggere dedicate che mantengono solo `test/setup.ts`, lasciando i casi più pesanti a runtime nelle lane esistenti.
- Alcuni file sorgente helper di `plugin-sdk` e `commands` mappano anche `pnpm test:changed` a test sibling espliciti in quelle lane leggere, così piccole modifiche agli helper evitano di rieseguire le suite pesanti supportate dal runtime.
- `auto-reply` ora è inoltre suddiviso in tre configurazioni dedicate (`core`, `top-level`, `reply`) così l'harness di reply non domina i test più leggeri top-level di stato/token/helper.
- La configurazione Vitest di base ora usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato in tutte le configurazioni del repository.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard di estensioni/plugin. I plugin di canale pesanti, il plugin browser e OpenAI vengono eseguiti come shard dedicati; gli altri gruppi di plugin restano raggruppati. Usa `pnpm test extensions/<id>` per una singola lane di plugin inclusa.
- `pnpm test:perf:imports`: abilita la reportistica sulla durata degli import e sul dettaglio degli import in Vitest, continuando a usare l'instradamento per lane con ambito limitato per file/directory espliciti.
- `pnpm test:perf:imports:changed`: stessa profilazione degli import, ma solo per i file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` misura il percorso instradato in modalità changed rispetto all'esecuzione nativa dei root-project per lo stesso diff git commitato.
- `pnpm test:perf:changed:bench -- --worktree` misura l'insieme di modifiche del worktree corrente senza prima fare commit.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: esegue in serie ogni configurazione leaf Vitest dell'intera suite e scrive dati di durata raggruppati più artefatti JSON/log per configurazione. Il Test Performance Agent usa questo come baseline prima di tentare correzioni ai test lenti.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: confronta i report raggruppati dopo una modifica focalizzata sulle prestazioni.
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: esegue i test smoke end-to-end del Gateway (accoppiamento multi-istanza WS/HTTP/node). Per impostazione predefinita usa `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regolalo con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log verbosi.
- `pnpm test:live`: esegue i test live dei provider (minimax/zai). Richiede chiavi API e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per non saltarli.
- `pnpm test:docker:all`: costruisce una sola volta l'immagine condivisa per i test live e l'immagine Docker E2E, quindi esegue le lane smoke Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` tramite uno scheduler pesato. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controlla gli slot di processo e per impostazione predefinita è 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controlla il pool tail sensibile al provider e per impostazione predefinita è 10. I limiti delle lane pesanti sono per impostazione predefinita `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; i limiti per provider sono per impostazione predefinita una lane pesante per provider tramite `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` per host più grandi. L'avvio delle lane è sfalsato di 2 secondi per impostazione predefinita per evitare tempeste di creazione nel daemon Docker locale; sovrascrivilo con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Il runner esegue per impostazione predefinita un controllo preliminare di Docker, ripulisce i container OpenClaw E2E obsoleti, emette lo stato delle lane attive ogni 30 secondi, condivide le cache degli strumenti CLI dei provider tra lane compatibili, ritenta una volta per impostazione predefinita i fallimenti transitori dei provider live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e memorizza i tempi delle lane in `.artifacts/docker-tests/lane-timings.json` per l'ordinamento longest-first nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest delle lane senza eseguire Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` per regolare l'output di stato, o `OPENCLAW_DOCKER_ALL_TIMINGS=0` per disabilitare il riuso dei tempi. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` per solo lane deterministiche/locali o `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` per solo lane di provider live; gli alias di pacchetto sono `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. La modalità solo live unisce le lane live main e tail in un unico pool longest-first così i bucket dei provider possono raggruppare insieme lavoro Claude, Codex e Gemini. Il runner smette di pianificare nuove lane nel pool dopo il primo fallimento a meno che non sia impostato `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, e ogni lane ha un timeout di fallback di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; alcune lane live/tail selezionate usano limiti per lane più restrittivi. I comandi di setup Docker del backend CLI hanno un proprio timeout tramite `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (predefinito 180). I log per lane vengono scritti in `.artifacts/docker-tests/<run-id>/`.
- I probe live Docker del backend CLI possono essere eseguiti come lane mirate, ad esempio `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude e Gemini hanno alias `:resume` e `:mcp` corrispondenti.
- `pnpm test:docker:openwebui`: avvia OpenClaw + Open WebUI in Docker, accede tramite Open WebUI, controlla `/api/models`, quindi esegue una chat reale proxata tramite `/api/chat/completions`. Richiede una chiave di modello live utilizzabile (ad esempio OpenAI in `~/.profile`), scarica un'immagine esterna di Open WebUI e non è previsto che sia stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: avvia un container Gateway inizializzato e un secondo container client che esegue `openclaw mcp serve`, quindi verifica discovery delle conversazioni instradate, letture delle trascrizioni, metadati degli allegati, comportamento della coda di eventi live, instradamento dell'invio in uscita e notifiche di canale + permessi in stile Claude sul bridge stdio reale. L'asserzione delle notifiche Claude legge direttamente i frame MCP stdio grezzi così lo smoke riflette ciò che il bridge emette realmente.

## Gate PR locale

Per i controlli locali di gate/land di una PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` ha comportamenti intermittenti su un host carico, rieseguilo una volta prima di trattarlo come regressione, poi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark della latenza del modello (chiavi locali)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env facoltative: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predefinito: “Rispondi con una sola parola: ok. Nessuna punteggiatura o testo aggiuntivo.”

Ultima esecuzione (2025-12-31, 20 esecuzioni):

- minimax mediana 1279ms (min 1114, max 2431)
- opus mediana 2454ms (min 1224, max 3170)

## Benchmark di avvio della CLI

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Uso:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: entrambi i preset

L'output include `sampleCount`, media, p50, p95, min/max, distribuzione di exit-code/signal e riepiloghi RSS massimi per ogni comando. `--cpu-prof-dir` / `--heap-prof-dir` facoltativi scrivono profili V8 per ogni esecuzione così la raccolta dei tempi e quella dei profili usano lo stesso harness.

Convenzioni per l'output salvato:

- `pnpm test:startup:bench:smoke` scrive l'artefatto smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artefatto della suite completa in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna il fixture baseline incluso nel repository in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture incluso nel repository:

- `test/fixtures/cli-startup-bench.json`
- Aggiornalo con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con il fixture usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker è facoltativo; questo serve solo per test smoke di onboarding containerizzati.

Flusso completo a freddo in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script pilota la procedura guidata interattiva tramite una pseudo-tty, verifica i file di configurazione/workspace/sessione, quindi avvia il Gateway ed esegue `openclaw health`.

## Smoke test di importazione QR (Docker)

Verifica che l'helper runtime QR mantenuto si carichi nei runtime Node Docker supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```

## Correlati

- [Testing](/it/help/testing)
- [Testing live](/it/help/testing-live)
