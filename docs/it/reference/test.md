---
read_when:
    - Esecuzione o correzione dei test
summary: Come eseguire i test in locale (Vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-04-26T11:38:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24eb2d122c806237bd4b90dffbd293479763c11a42cfcd195e1aed59efc71a5b
    source_path: reference/test.md
    workflow: 15
---

- Kit di test completo (suite, live, Docker): [Testing](/it/help/testing)

- `pnpm test:force`: termina qualsiasi processo gateway residuo che mantiene occupata la porta di controllo predefinita, quindi esegue l'intera suite Vitest con una porta gateway isolata così i test del server non collidono con un'istanza in esecuzione. Usalo quando una precedente esecuzione del gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: esegue la suite unit con copertura V8 (tramite `vitest.unit.config.ts`). Si tratta di un gate di copertura unit sui file caricati, non di una copertura all-file dell'intero repo. Le soglie sono 70% per lines/functions/statements e 55% per branches. Poiché `coverage.all` è false, il gate misura i file caricati dalla suite di copertura unit invece di trattare ogni file sorgente delle split-lane come non coperto.
- `pnpm test:coverage:changed`: esegue la copertura unit solo per i file modificati rispetto a `origin/main`.
- `pnpm test:changed`: espande i percorsi git modificati in lane Vitest con ambito definito quando il diff tocca solo file sorgente/test instradabili. Le modifiche a config/setup fanno comunque fallback all'esecuzione nativa dei progetti root così le modifiche al wiring rieseguono in modo ampio quando necessario.
- `pnpm test:changed:focused`: esecuzione changed nel loop interno. Esegue solo target precisi derivati da modifiche dirette ai test, file sibling `*.test.ts`, mapping sorgente espliciti e grafo di import locale. Le modifiche ampie/a config/a package vengono saltate invece di espandersi al fallback completo dei test changed.
- `pnpm changed:lanes`: mostra le lane architetturali attivate dal diff rispetto a `origin/main`.
- `pnpm check:changed`: esegue lo smart changed gate per il diff rispetto a `origin/main`. Esegue il lavoro core con le lane di test core, il lavoro extension con le lane di test extension, il lavoro solo-test solo con typecheck/tests dei test, espande le modifiche al Plugin SDK pubblico o al contratto plugin a un passaggio di validazione extension, e mantiene i version bump solo di metadati release su controlli mirati di version/config/root-dependency.
- `pnpm test`: instrada target espliciti file/directory attraverso lane Vitest con ambito definito. Le esecuzioni non mirate usano gruppi di shard fissi ed espandono a configurazioni leaf per l'esecuzione parallela locale; il gruppo extension si espande sempre alle configurazioni shard per singola extension invece che a un unico gigantesco processo root-project.
- Le esecuzioni di shard full, extension e include-pattern aggiornano dati di timing locali in `.artifacts/vitest-shard-timings.json`; le successive esecuzioni whole-config usano questi timing per bilanciare shard lenti e veloci. Gli shard CI include-pattern aggiungono il nome dello shard alla chiave di timing, mantenendo visibili i timing degli shard filtrati senza sostituire i dati di timing whole-config. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l'artifact di timing locale.
- I file di test selezionati di `plugin-sdk` e `commands` ora vengono instradati attraverso lane leggere dedicate che mantengono solo `test/setup.ts`, lasciando i casi runtime-heavy sulle lane esistenti.
- I file sorgente con test sibling mappano a quel sibling prima di fare fallback a glob di directory più ampi. Le modifiche agli helper sotto `test/helpers/channels` e `test/helpers/plugins` usano un grafo di import locale per eseguire i test importatori invece di rieseguire ampiamente ogni shard quando il percorso di dipendenza è preciso.
- `auto-reply` ora è anche diviso in tre configurazioni dedicate (`core`, `top-level`, `reply`) così l'harness di reply non domina i test più leggeri di stato/token/helper di primo livello.
- La configurazione base di Vitest ora usa come predefiniti `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato nelle configurazioni del repo.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard extension/plugin. I plugin di canale pesanti, il plugin browser e OpenAI vengono eseguiti come shard dedicati; gli altri gruppi plugin restano raggruppati. Usa `pnpm test extensions/<id>` per una singola lane di plugin incluso.
- `pnpm test:perf:imports`: abilita la reportistica di Vitest su durata + dettaglio degli import, continuando a usare l'instradamento con lane definite per target espliciti file/directory.
- `pnpm test:perf:imports:changed`: stesso profiling degli import, ma solo per i file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` esegue il benchmark del percorso changed instradato rispetto all'esecuzione nativa root-project per lo stesso diff git committed.
- `pnpm test:perf:changed:bench -- --worktree` esegue il benchmark del set di modifiche della worktree corrente senza dover prima fare commit.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: esegue serialmente ogni configurazione leaf Vitest full-suite e scrive dati di durata raggruppati più artifact JSON/log per configurazione. Il Test Performance Agent usa questo come baseline prima di tentare correzioni per test lenti.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: confronta i report raggruppati dopo una modifica focalizzata sulle prestazioni.
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: esegue test smoke end-to-end del gateway (WS/HTTP multiistanza/node pairing). Usa come predefiniti `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log dettagliati.
- `pnpm test:live`: esegue test live dei provider (minimax/zai). Richiede chiavi API e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per non essere saltato.
- `pnpm test:docker:all`: costruisce una volta l'immagine condivisa per test live e l'immagine Docker E2E, quindi esegue le lane smoke Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` tramite uno scheduler pesato. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controlla gli slot di processo e usa come predefinito 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controlla il pool tail sensibile ai provider e usa come predefinito 10. I limiti delle lane pesanti usano come predefiniti `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` e `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; i limiti provider usano come predefinito una lane pesante per provider tramite `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` e `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` o `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` per host più grandi. Gli avvii delle lane sono scaglionati di 2 secondi per impostazione predefinita per evitare tempeste di creazione sul daemon Docker locale; fai override con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Il runner esegue come predefinito un preflight Docker, pulisce i container E2E OpenClaw obsoleti, emette lo stato delle lane attive ogni 30 secondi, condivide cache degli strumenti CLI dei provider tra lane compatibili, ritenta una volta per impostazione predefinita gli errori transitori dei provider live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) e memorizza i timing delle lane in `.artifacts/docker-tests/lane-timings.json` per l'ordinamento longest-first nelle esecuzioni successive. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` per stampare il manifest delle lane senza eseguire Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` per regolare l'output di stato, oppure `OPENCLAW_DOCKER_ALL_TIMINGS=0` per disabilitare il riuso dei timing. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo per lane deterministic/local oppure `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo per lane live-provider; gli alias package sono `pnpm test:docker:local:all` e `pnpm test:docker:live:all`. La modalità solo-live unisce lane live main e tail in un unico pool longest-first così i bucket provider possono impacchettare insieme lavoro Claude, Codex e Gemini. Il runner smette di pianificare nuove lane in pool dopo il primo errore a meno che `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` non sia impostato, e ogni lane ha un timeout di fallback di 120 minuti sovrascrivibile con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; alcune lane live/tail selezionate usano limiti più stretti per lane. I comandi di setup Docker del backend CLI hanno il proprio timeout tramite `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (predefinito 180). I log per singola lane vengono scritti sotto `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:browser-cdp-snapshot`: costruisce un container E2E sorgente basato su Chromium, avvia CDP grezzo più un Gateway isolato, esegue `browser doctor --deep` e verifica che gli snapshot del ruolo CDP includano URL dei link, clickabili promossi dal cursore, ref iframe e metadati dei frame.
- Le probe live Docker del backend CLI possono essere eseguite come lane focalizzate, per esempio `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude e Gemini hanno alias corrispondenti `:resume` e `:mcp`.
- `pnpm test:docker:openwebui`: avvia OpenClaw + Open WebUI Dockerizzati, esegue l'accesso tramite Open WebUI, controlla `/api/models`, quindi esegue una vera chat proxata tramite `/api/chat/completions`. Richiede una chiave live di modello utilizzabile (per esempio OpenAI in `~/.profile`), scarica un'immagine Open WebUI esterna e non è pensato per essere stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: avvia un container Gateway inizializzato e un secondo container client che genera `openclaw mcp serve`, quindi verifica discovery della conversazione instradata, letture delle trascrizioni, metadati degli allegati, comportamento della coda di eventi live, instradamento dell'invio in uscita e notifiche in stile Claude di canale + permessi sul vero bridge stdio. L'asserzione sulle notifiche Claude legge direttamente i frame MCP stdio grezzi così lo smoke riflette ciò che il bridge emette davvero.

## Gate PR locale

Per i controlli locali di land/gate della PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` ha flake su un host sotto carico, rieseguilo una volta prima di trattarlo come regressione, poi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark di latenza del modello (chiavi locali)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env facoltative: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predefinito: “Reply with a single word: ok. No punctuation or extra text.”

Ultima esecuzione (2025-12-31, 20 run):

- minimax mediana 1279ms (min 1114, max 2431)
- opus mediana 2454ms (min 1224, max 3170)

## Benchmark di avvio CLI

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

L'output include `sampleCount`, avg, p50, p95, min/max, distribuzione exit-code/signal e riepiloghi del max RSS per ogni comando. `--cpu-prof-dir` / `--heap-prof-dir` facoltativi scrivono profili V8 per run così timing e cattura del profilo usano lo stesso harness.

Convenzioni dell'output salvato:

- `pnpm test:startup:bench:smoke` scrive l'artifact smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artifact full-suite in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna la fixture baseline versionata in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionata:

- `test/fixtures/cli-startup-bench.json`
- Aggiornala con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con la fixture usando `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker è facoltativo; serve solo per i test smoke di onboarding containerizzati.

Flusso completo di cold-start in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script guida la procedura guidata interattiva tramite pseudo-tty, verifica file di configurazione/workspace/sessione, poi avvia il gateway ed esegue `openclaw health`.

## Smoke di importazione QR (Docker)

Garantisce che l'helper runtime QR mantenuto venga caricato nei runtime Node Docker supportati (Node 24 predefinito, compatibile con Node 22):

```bash
pnpm test:docker:qr
```

## Correlati

- [Testing](/it/help/testing)
- [Testing live](/it/help/testing-live)
