---
read_when:
    - Esecuzione o correzione dei test
summary: Come eseguire i test localmente (vitest) e quando usare le modalità force/coverage
title: Test
x-i18n:
    generated_at: "2026-04-22T04:27:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed665840ef2c7728da8ec923eb3ea2878d9b20a841cb2fe4116a7f6334567b8e
    source_path: reference/test.md
    workflow: 15
---

# Test

- Kit di test completo (suite, live, Docker): [Testing](/it/help/testing)

- `pnpm test:force`: termina qualsiasi processo gateway residuo che occupa la porta di controllo predefinita, quindi esegue l'intera suite Vitest con una porta gateway isolata così i test del server non entrano in conflitto con un'istanza in esecuzione. Usalo quando una precedente esecuzione del gateway ha lasciato occupata la porta 18789.
- `pnpm test:coverage`: esegue la suite unit con coverage V8 (tramite `vitest.unit.config.ts`). Si tratta di un gate di coverage unit dei file caricati, non di coverage all-file dell'intero repository. Le soglie sono 70% per linee/funzioni/statement e 55% per i branch. Poiché `coverage.all` è false, il gate misura i file caricati dalla suite di coverage unit invece di trattare ogni file sorgente nelle lane suddivise come non coperto.
- `pnpm test:coverage:changed`: esegue la coverage unit solo per i file modificati rispetto a `origin/main`.
- `pnpm test:changed`: espande i percorsi git modificati in lane Vitest con ambito quando la diff tocca solo file sorgente/test instradabili. Le modifiche a config/setup usano comunque come fallback l'esecuzione nativa dei progetti root così le modifiche al wiring rieseguono in modo ampio quando necessario.
- `pnpm changed:lanes`: mostra le lane architetturali attivate dalla diff rispetto a `origin/main`.
- `pnpm check:changed`: esegue lo smart changed gate per la diff rispetto a `origin/main`. Esegue il lavoro core con lane di test core, il lavoro delle estensioni con lane di test delle estensioni, il lavoro solo test solo con typecheck/test dei test, espande le modifiche all'SDK Plugin pubblico o al contratto plugin verso la validazione delle estensioni e mantiene i version bump solo di metadati release su controlli mirati di versione/config/dipendenze root.
- `pnpm test`: instrada target espliciti file/directory attraverso lane Vitest con ambito. Le esecuzioni senza target usano gruppi di shard fissi e si espandono in config leaf per l'esecuzione parallela locale; il gruppo extension si espande sempre nelle config shard per-estensione invece che in un unico gigantesco processo root-project.
- Le esecuzioni complete e quelle shard delle estensioni aggiornano i dati locali di timing in `.artifacts/vitest-shard-timings.json`; le esecuzioni successive usano quei timing per bilanciare shard lenti e veloci. Imposta `OPENCLAW_TEST_PROJECTS_TIMINGS=0` per ignorare l'artifact di timing locale.
- Alcuni file di test `plugin-sdk` e `commands` selezionati ora vengono instradati tramite lane leggere dedicate che mantengono solo `test/setup.ts`, lasciando i casi pesanti a runtime sulle lane esistenti.
- Alcuni file sorgente helper `plugin-sdk` e `commands` selezionati mappano anche `pnpm test:changed` a test sibling espliciti in quelle lane leggere, così piccole modifiche agli helper evitano di rieseguire le suite pesanti supportate dal runtime.
- `auto-reply` ora si divide anch'esso in tre config dedicate (`core`, `top-level`, `reply`) così l'harness reply non domina i test più leggeri top-level di stato/token/helper.
- La config base Vitest ora usa per impostazione predefinita `pool: "threads"` e `isolate: false`, con il runner condiviso non isolato abilitato in tutte le config del repo.
- `pnpm test:channels` esegue `vitest.channels.config.ts`.
- `pnpm test:extensions` e `pnpm test extensions` eseguono tutti gli shard extension/plugin. Le estensioni di canale pesanti e OpenAI vengono eseguite come shard dedicati; gli altri gruppi di estensioni restano raggruppati. Usa `pnpm test extensions/<id>` per una singola lane di Plugin bundled.
- `pnpm test:perf:imports`: abilita la reportistica Vitest sulla durata degli import + breakdown degli import, continuando però a usare il routing lane con ambito per target espliciti file/directory.
- `pnpm test:perf:imports:changed`: stesso profiling degli import, ma solo per i file modificati rispetto a `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` misura il percorso changed-mode instradato rispetto all'esecuzione nativa root-project per la stessa diff git salvata.
- `pnpm test:perf:changed:bench -- --worktree` misura l'insieme di modifiche del worktree corrente senza prima fare commit.
- `pnpm test:perf:profile:main`: scrive un profilo CPU per il thread principale di Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: scrive profili CPU + heap per il runner unit (`.artifacts/vitest-runner-profile`).
- Integrazione Gateway: opt-in tramite `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oppure `pnpm test:gateway`.
- `pnpm test:e2e`: esegue test smoke end-to-end del gateway (pairing multiistanza WS/HTTP/node). Per impostazione predefinita usa `threads` + `isolate: false` con worker adattivi in `vitest.e2e.config.ts`; regola con `OPENCLAW_E2E_WORKERS=<n>` e imposta `OPENCLAW_E2E_VERBOSE=1` per log verbosi.
- `pnpm test:live`: esegue test live del provider (minimax/zai). Richiede API key e `LIVE=1` (o `*_LIVE_TEST=1` specifico del provider) per togliere lo skip.
- `pnpm test:docker:openwebui`: avvia OpenClaw + Open WebUI in Docker, effettua l'accesso tramite Open WebUI, controlla `/api/models`, quindi esegue una vera chat proxied tramite `/api/chat/completions`. Richiede una chiave di modello live utilizzabile (per esempio OpenAI in `~/.profile`), scarica un'immagine esterna Open WebUI e non è previsto che sia stabile in CI come le normali suite unit/e2e.
- `pnpm test:docker:mcp-channels`: avvia un container Gateway inizializzato e un secondo container client che avvia `openclaw mcp serve`, quindi verifica discovery della conversazione instradata, letture del transcript, metadati degli allegati, comportamento della coda eventi live, instradamento dell'invio outbound e notifiche stile Claude di canale + permessi sul vero bridge stdio. L'asserzione sulla notifica Claude legge direttamente i frame MCP stdio grezzi così lo smoke riflette ciò che il bridge emette realmente.

## Gate PR locale

Per controlli locali di land/gate della PR, esegui:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Se `pnpm test` flappa su un host carico, rieseguilo una volta prima di trattarlo come regressione, poi isola con `pnpm test <path/to/test>`. Per host con memoria limitata, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark della latenza del modello (chiavi locali)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Env facoltative: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predefinito: “Reply with a single word: ok. No punctuation or extra text.”

Ultima esecuzione (2025-12-31, 20 esecuzioni):

- median minimax 1279ms (min 1114, max 2431)
- median opus 2454ms (min 1224, max 3170)

## Benchmark dell'avvio CLI

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

L'output include `sampleCount`, avg, p50, p95, min/max, distribuzione di exit-code/signal e riepiloghi max RSS per ogni comando. `--cpu-prof-dir` / `--heap-prof-dir` facoltativi scrivono profili V8 per esecuzione così timing e acquisizione profili usano lo stesso harness.

Convenzioni per gli output salvati:

- `pnpm test:startup:bench:smoke` scrive l'artifact smoke mirato in `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` scrive l'artifact della suite completa in `.artifacts/cli-startup-bench-all.json` usando `runs=5` e `warmup=1`
- `pnpm test:startup:bench:update` aggiorna il fixture baseline versionato in `test/fixtures/cli-startup-bench.json` usando `runs=5` e `warmup=1`

Fixture versionato:

- `test/fixtures/cli-startup-bench.json`
- Aggiorna con `pnpm test:startup:bench:update`
- Confronta i risultati correnti con il fixture tramite `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker è facoltativo; serve solo per i test smoke di onboarding containerizzati.

Flusso completo cold-start in un container Linux pulito:

```bash
scripts/e2e/onboard-docker.sh
```

Questo script guida la procedura guidata interattiva tramite pseudo-tty, verifica i file di config/workspace/sessione, quindi avvia il gateway ed esegue `openclaw health`.

## Smoke di import QR (Docker)

Garantisce che `qrcode-terminal` venga caricato nei runtime Docker Node supportati (Node 24 predefinito, Node 22 compatibile):

```bash
pnpm test:docker:qr
```
