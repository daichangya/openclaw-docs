---
read_when:
    - Cerchi le definizioni dei canali di release pubblici
    - Cerchi la denominazione delle versioni e la cadenza
summary: Canali di release pubblici, denominazione delle versioni e cadenza
title: Policy di release
x-i18n:
    generated_at: "2026-04-12T23:33:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: dffc1ee5fdbb20bd1bf4b3f817d497fc0d87f70ed6c669d324fea66dc01d0b0b
    source_path: reference/RELEASING.md
    workflow: 15
---

# Policy di release

OpenClaw ha tre canali di release pubblici:

- stable: release taggate che pubblicano su npm `beta` per impostazione predefinita, oppure su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease che pubblicano su npm `beta`
- dev: la testa mobile di `main`

## Denominazione delle versioni

- Versione di release stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di release stable correction: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali a mese o giorno
- `latest` indica l'attuale release npm stable promossa
- `beta` indica l'attuale target di installazione beta
- Le release stable e stable correction pubblicano su npm `beta` per impostazione predefinita; gli operatori di release possono indirizzare esplicitamente `latest` oppure promuovere in seguito una build beta verificata
- Ogni release di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS

## Cadenza delle release

- Le release passano prima da beta
- Stable segue solo dopo che l'ultima beta è stata validata
- Procedura dettagliata di release, approvazioni, credenziali e note di recupero sono
  riservate ai maintainer

## Preflight della release

- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check` in modo che gli
  artefatti di release attesi `dist/*` e il bundle della Control UI esistano per il
  passaggio di validazione del pack
- Esegui `pnpm release:check` prima di ogni release taggata
- I controlli di release ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- Questa separazione è intenzionale: mantiene il percorso reale di release npm breve,
  deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano
  nel proprio canale così da non rallentare o bloccare la pubblicazione
- I controlli di release devono essere avviati dal workflow ref `main` così la
  logica del workflow e i segreti restano canonici
- Quel workflow accetta un tag di release esistente oppure l'attuale SHA completo a 40 caratteri del commit `main`
- In modalità commit-SHA accetta solo l'attuale HEAD di `origin/main`; usa un
  tag di release per commit di release più vecchi
- Il preflight di sola validazione `OpenClaw NPM Release` accetta anch'esso l'attuale SHA completo a 40 caratteri di `main` senza richiedere un tag pubblicato
- Quel percorso SHA è solo di validazione e non può essere promosso a una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il
  controllo dei metadati del pacchetto; la pubblicazione reale richiede comunque un vero tag di release
- Entrambi i workflow mantengono il percorso reale di pubblicazione e promozione su runner GitHub-hosted, mentre il percorso di validazione non mutante può usare i
  runner Linux Blacksmith più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando entrambi i segreti di workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Il preflight della release npm non aspetta più il canale separato dei controlli di release
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correction corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correction corrispondente) per verificare il percorso di installazione
  pubblicato nel registry in un prefisso temporaneo pulito
- L'automazione di release dei maintainer ora usa preflight-then-promote:
  - la vera pubblicazione npm deve superare con successo un `preflight_run_id` npm riuscito
  - le release npm stable usano `beta` per impostazione predefinita
  - la pubblicazione npm stable può indirizzare esplicitamente `latest` tramite input del workflow
  - la promozione npm stable da `beta` a `latest` resta disponibile come modalità manuale esplicita nel workflow fidato `OpenClaw NPM Release`
  - quella modalità di promozione richiede comunque un `NPM_TOKEN` valido nell'ambiente `npm-release` perché la gestione di `dist-tag` npm è separata dal trusted publishing
  - `macOS Release` pubblico è solo di validazione
  - la vera pubblicazione privata mac deve superare con successo i `preflight_run_id` e `validate_run_id` privati mac
  - i percorsi di pubblicazione reali promuovono artefatti preparati invece di ricostruirli di nuovo
- Per release stable correction come `YYYY.M.D-N`, il verificatore post-publish
  controlla anche lo stesso percorso di upgrade in prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`
  così le release correction non possono lasciare silenziosamente installazioni globali più vecchie sul payload stable di base
- Il preflight della release npm fallisce in modo chiuso se il tarball non include sia
  `dist/control-ui/index.html` sia un payload non vuoto `dist/control-ui/assets/`
  così da non distribuire di nuovo una dashboard browser vuota
- Se il lavoro di release ha toccato la pianificazione CI, i manifest dei tempi delle estensioni o
  le matrici di test delle estensioni, rigenera e rivedi gli output della matrice del workflow
  `checks-node-extensions` generati da `.github/workflows/ci.yml`
  prima dell'approvazione, così le note di release non descrivono una disposizione CI obsoleta
- La preparazione della release macOS stable include anche le superfici dell'updater:
  - la release GitHub deve finire con i file pacchettizzati `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` su `main` deve puntare al nuovo zip stable dopo la pubblicazione
  - l'app pacchettizzata deve mantenere un bundle id non di debug, un feed URL Sparkle non vuoto
    e un `CFBundleVersion` pari o superiore alla soglia canonica di build Sparkle
    per quella versione di release

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di release richiesto come `v2026.4.2`, `v2026.4.2-1`, oppure
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere l'attuale
  SHA completo a 40 caratteri del commit `main` per un preflight di sola validazione
- `preflight_only`: `true` per sola validazione/build/package, `false` per il
  percorso di pubblicazione reale
- `preflight_run_id`: richiesto nel percorso di pubblicazione reale così il workflow riusa
  il tarball preparato dall'esecuzione di preflight riuscita
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; predefinito `beta`
- `promote_beta_to_latest`: `true` per saltare la pubblicazione e spostare su `latest`
  una build stable `beta` già pubblicata

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: tag di release esistente oppure l'attuale SHA completo a 40 caratteri del commit `main`
  da validare

Regole:

- I tag stable e correction possono pubblicare sia su `beta` sia su `latest`
- I tag di prerelease beta possono pubblicare solo su `beta`
- L'input SHA completo del commit è consentito solo quando `preflight_only=true`
- La modalità commit-SHA dei controlli di release richiede anche l'attuale HEAD di `origin/main`
- Il percorso di pubblicazione reale deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica quei metadati prima che la pubblicazione prosegua
- La modalità promozione deve usare un tag stable o correction, `preflight_only=false`,
  un `preflight_run_id` vuoto e `npm_dist_tag=beta`
- La modalità promozione richiede anche un `NPM_TOKEN` valido nell'ambiente `npm-release`
  perché `npm dist-tag add` richiede ancora la normale auth npm

## Sequenza di release npm stable

Quando esegui una release npm stable:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare l'attuale SHA completo di `main` per una
     dry run di sola validazione del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stable diretta
3. Esegui separatamente `OpenClaw Release Checks` con lo stesso tag o con lo
   SHA completo attuale di `main` quando vuoi copertura live della prompt cache
   - Questo è separato di proposito così la copertura live resta disponibile senza
     riaccoppiare controlli lunghi o instabili al workflow di pubblicazione
4. Salva il `preflight_run_id` riuscito
5. Esegui di nuovo `OpenClaw NPM Release` con `preflight_only=false`, lo stesso
   `tag`, lo stesso `npm_dist_tag` e il `preflight_run_id` salvato
6. Se la release è arrivata su `beta`, esegui più tardi `OpenClaw NPM Release` con lo
   stesso `tag` stable, `promote_beta_to_latest=true`, `preflight_only=false`,
   `preflight_run_id` vuoto e `npm_dist_tag=beta` quando vuoi spostare quella
   build pubblicata su `latest`

La modalità promozione richiede comunque l'approvazione dell'ambiente `npm-release` e un
`NPM_TOKEN` valido in quell'ambiente.

Questo mantiene sia il percorso di pubblicazione diretta sia il percorso di promozione beta-first
documentati e visibili agli operatori.

## Riferimenti pubblici

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

I maintainer usano la documentazione privata di release in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
come runbook effettivo.
