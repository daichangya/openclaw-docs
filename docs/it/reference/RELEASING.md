---
read_when:
    - Cerco le definizioni dei canali di rilascio pubblici
    - Cerco la denominazione delle versioni e la cadenza
summary: Canali di rilascio pubblici, denominazione delle versioni e cadenza
title: Politica di rilascio
x-i18n:
    generated_at: "2026-04-15T08:18:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88724307269ab783a9fbf8a0540fea198d8a3add68457f4e64d5707114fa518c
    source_path: reference/RELEASING.md
    workflow: 15
---

# Politica di rilascio

OpenClaw ha tre canali di rilascio pubblici:

- stable: release taggate che pubblicano su npm `beta` per impostazione predefinita, oppure su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease che pubblicano su npm `beta`
- dev: la head in movimento di `main`

## Denominazione delle versioni

- Versione di rilascio stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio stable correttiva: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali a mese o giorno
- `latest` indica l'attuale release npm stable promossa
- `beta` indica l'attuale destinazione di installazione beta
- Le release stable e le release stable correttive pubblicano su npm `beta` per impostazione predefinita; gli operatori di rilascio possono scegliere esplicitamente `latest` come destinazione, oppure promuovere in un secondo momento una build beta verificata
- Ogni release di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS

## Cadenza dei rilasci

- I rilasci passano prima da beta
- Stable segue solo dopo che l'ultima beta è stata convalidata
- La procedura di rilascio dettagliata, le approvazioni, le credenziali e le note di recupero sono
  riservate ai maintainer

## Verifiche preliminari al rilascio

- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check` in modo che gli artifact di rilascio `dist/*` attesi e il bundle della Control UI esistano per il passaggio di convalida del pack
- Esegui `pnpm release:check` prima di ogni rilascio taggato
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- La convalida runtime cross-OS di installazione e aggiornamento viene avviata dal workflow chiamante privato
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  che richiama il workflow pubblico riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantiene il percorso reale di rilascio npm breve,
  deterministico e focalizzato sugli artifact, mentre i controlli live più lenti restano
  nel loro canale dedicato così da non rallentare o bloccare la pubblicazione
- I controlli di rilascio devono essere avviati dal workflow ref di `main` in modo che la
  logica del workflow e i secret restino canonici
- Quel workflow accetta un tag di rilascio esistente oppure l'attuale SHA completo a 40 caratteri del commit `main`
- In modalità commit-SHA accetta solo l'attuale HEAD di `origin/main`; usa un
  tag di rilascio per commit di rilascio meno recenti
- Anche la verifica preliminare solo di convalida `OpenClaw NPM Release` accetta l'attuale SHA completo a 40 caratteri del commit `main` senza richiedere un tag già pubblicato
- Quel percorso SHA è solo di convalida e non può essere promosso a una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il
  controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un vero tag di rilascio
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione su runner GitHub-hosted,
  mentre il percorso di convalida non mutante può usare i runner Linux Blacksmith più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando i secret del workflow sia `OPENAI_API_KEY` sia `ANTHROPIC_API_KEY`
- La verifica preliminare del rilascio npm non attende più il canale separato dei controlli di rilascio
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (oppure il tag beta/correttivo corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (oppure la versione beta/correttiva corrispondente) per verificare il percorso di installazione dal registry pubblicato in un prefisso temporaneo nuovo
- L'automazione di rilascio dei maintainer ora usa il modello preflight-then-promote:
  - la pubblicazione npm reale deve superare con successo un `preflight_run_id` npm
  - i rilasci npm stable usano `beta` per impostazione predefinita
  - la pubblicazione npm stable può scegliere esplicitamente `latest` tramite input del workflow
  - la modifica basata su token dei dist-tag npm ora si trova in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per motivi di sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repo pubblico mantiene la pubblicazione solo OIDC
  - `macOS Release` pubblico è solo di convalida
  - la vera pubblicazione privata mac deve superare con successo i `preflight_run_id` e `validate_run_id`
    privati per mac
  - i percorsi di pubblicazione reali promuovono artifact preparati invece di ricostruirli
    di nuovo
- Per i rilasci stable correttivi come `YYYY.M.D-N`, il verificatore post-pubblicazione
  controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`,
  così i rilasci correttivi non possono lasciare silenziosamente installazioni globali più vecchie sul payload stable di base
- La verifica preliminare del rilascio npm fallisce in modo conservativo a meno che il tarball includa sia
  `dist/control-ui/index.html` sia un payload `dist/control-ui/assets/` non vuoto,
  così da non distribuire di nuovo una dashboard browser vuota
- `pnpm test:install:smoke` impone anche il budget `unpackedSize` del pack npm sul
  tarball di aggiornamento candidato, così l'e2e dell'installer intercetta aumenti accidentali della dimensione del pack
  prima del percorso di pubblicazione del rilascio
- Se il lavoro di rilascio ha toccato la pianificazione CI, i manifest di temporizzazione delle estensioni o
  le matrici di test delle estensioni, rigenera e rivedi gli output della matrice del workflow
  `checks-node-extensions` gestiti dal planner da `.github/workflows/ci.yml`
  prima dell'approvazione, così le note di rilascio non descrivono un layout CI obsoleto
- La prontezza del rilascio stable macOS include anche le superfici dell'updater:
  - la release GitHub deve finire con i file pacchettizzati `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stable dopo la pubblicazione
  - l'app pacchettizzata deve mantenere un bundle id non di debug, un URL del feed Sparkle non vuoto
    e un `CFBundleVersion` pari o superiore al floor di build Sparkle canonico
    per quella versione di rilascio

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio come `v2026.4.2`, `v2026.4.2-1`, oppure
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere l'attuale
  SHA completo a 40 caratteri del commit `main` per una verifica preliminare solo di convalida
- `preflight_only`: `true` per sola convalida/build/package, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: obbligatorio nel percorso di pubblicazione reale così il workflow riutilizza
  il tarball preparato dall'esecuzione preliminare riuscita
- `npm_dist_tag`: dist-tag npm di destinazione per il percorso di pubblicazione; il valore predefinito è `beta`

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: tag di rilascio esistente oppure l'attuale SHA completo a 40 caratteri del commit `main`
  da convalidare

Regole:

- I tag stable e correttivi possono pubblicare sia su `beta` sia su `latest`
- I tag di prerelease beta possono pubblicare solo su `beta`
- L'input SHA completo del commit è consentito solo quando `preflight_only=true`
- La modalità commit-SHA dei controlli di rilascio richiede anche l'attuale HEAD di `origin/main`
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante la verifica preliminare;
  il workflow verifica questi metadati prima che la pubblicazione prosegua

## Sequenza del rilascio npm stable

Quando si esegue un rilascio npm stable:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare l'attuale SHA completo di `main` per una
     prova a secco solo di convalida del workflow di verifica preliminare
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stable diretta
3. Esegui separatamente `OpenClaw Release Checks` con lo stesso tag oppure con il
   corrente SHA completo di `main` quando vuoi copertura live della prompt cache
   - Questo è separato di proposito così la copertura live resta disponibile senza
     riaccoppiare controlli lunghi o instabili al workflow di pubblicazione
4. Salva il `preflight_run_id` riuscito
5. Esegui di nuovo `OpenClaw NPM Release` con `preflight_only=false`, lo stesso
   `tag`, lo stesso `npm_dist_tag` e il `preflight_run_id` salvato
6. Se il rilascio è finito su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stable da `beta` a `latest`
7. Se il rilascio è stato intenzionalmente pubblicato direttamente su `latest` e `beta`
   deve seguire immediatamente la stessa build stable, usa quello stesso workflow privato
   per puntare entrambi i dist-tag alla versione stable, oppure lascia che la sua sincronizzazione automatica pianificata
   sposti `beta` in seguito

La modifica dei dist-tag si trova nel repo privato per motivi di sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repo pubblico mantiene la pubblicazione solo OIDC.

Questo mantiene sia il percorso di pubblicazione diretta sia il percorso di promozione beta-first
documentati e visibili agli operatori.

## Riferimenti pubblici

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

I maintainer usano la documentazione privata di rilascio in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
come runbook effettivo.
