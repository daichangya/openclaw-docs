---
read_when:
    - Cerchi le definizioni dei canali di rilascio pubblici
    - Cerchi denominazione delle versioni e cadenza
summary: Canali di rilascio pubblici, denominazione delle versioni e cadenza
title: Policy di rilascio
x-i18n:
    generated_at: "2026-04-25T13:56:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc20f30345cbc6c0897e63c9f6a554f9c25be0b52df3efc7d2bbd8827891984a
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw ha tre lane di rilascio pubbliche:

- stable: release taggate che pubblicano su npm `beta` per impostazione predefinita, oppure su npm `latest` quando richiesto esplicitamente
- beta: tag prerelease che pubblicano su npm `beta`
- dev: la head mobile di `main`

## Denominazione delle versioni

- Versione di rilascio stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio stable correction: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non usare zero-padding per mese o giorno
- `latest` significa l'attuale release npm stable promossa
- `beta` significa l'attuale destinazione di installazione beta
- Le release stable e stable correction pubblicano su npm `beta` per impostazione predefinita; gli operatori di release possono puntare esplicitamente a `latest`, oppure promuovere in seguito una build beta verificata
- Ogni release stable di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS;
  le release beta normalmente convalidano e pubblicano prima il percorso npm/package, con
  build/sign/notarize dell'app mac riservati alla stable salvo richiesta esplicita

## Cadenza delle release

- Le release si muovono prima su beta
- La stable segue solo dopo che l'ultima beta è stata validata
- I maintainer normalmente tagliano le release da un branch `release/YYYY.M.D` creato
  dall'attuale `main`, in modo che la validazione e le correzioni della release non blocchino
  il nuovo sviluppo su `main`
- Se un tag beta è già stato pushato o pubblicato e ha bisogno di una correzione, i maintainer creano
  il successivo tag `-beta.N` invece di eliminare o ricreare il vecchio tag beta
- Procedura dettagliata di release, approvazioni, credenziali e note di recovery sono
  riservate ai maintainer

## Preflight di release

- Esegui `pnpm check:test-types` prima del preflight di release in modo che il TypeScript dei test resti
  coperto al di fuori del gate locale più veloce `pnpm check`
- Esegui `pnpm check:architecture` prima del preflight di release in modo che i controlli più ampi
  su import cycle e confini architetturali siano verdi al di fuori del gate locale più veloce
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check` in modo che gli
  artefatti di release attesi `dist/*` e il bundle della Control UI esistano per il passaggio di
  validazione pack
- Esegui `pnpm release:check` prima di ogni release taggata
- I controlli di release ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche il gate di parità mock QA Lab più le lane QA
  live Matrix e Telegram prima dell'approvazione della release. Le lane live usano l'ambiente
  `qa-live-shared`; Telegram usa anche lease di credenziali Convex CI.
- La validazione runtime cross-OS di installazione e aggiornamento viene dispatchata dal
  workflow caller privato
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  che invoca il workflow pubblico riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantenere il percorso reale di release npm breve,
  deterministico e focalizzato sugli artefatti, mentre i controlli live più lenti restano
  nella propria lane così da non rallentare o bloccare la pubblicazione
- I controlli di release devono essere dispatchati dal riferimento workflow `main` o da un
  riferimento workflow `release/YYYY.M.D` in modo che la logica del workflow e i secret restino
  controllati
- Quel workflow accetta un tag di release esistente oppure l'attuale SHA commit completo a 40 caratteri del branch del workflow
- In modalità commit-SHA accetta solo l'HEAD corrente del branch del workflow; usa un
  tag di release per commit di release più vecchi
- Il preflight solo-validazione di `OpenClaw NPM Release` accetta anch'esso l'attuale
  SHA commit completo a 40 caratteri del branch del workflow senza richiedere un tag pushato
- Quel percorso SHA è solo di validazione e non può essere promosso a una vera pubblicazione
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il controllo
  dei metadati del pacchetto; la vera pubblicazione richiede comunque un vero tag di release
- Entrambi i workflow mantengono il vero percorso di pubblicazione e promozione su runner GitHub-hosted, mentre il percorso di validazione non mutante può usare i
  runner Linux Blacksmith più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando entrambi i secret di workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- Il preflight di release npm non attende più la lane separata dei controlli di release
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correction corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correction corrispondente) per verificare il percorso di
  installazione del registro pubblicato in un nuovo prefisso temporaneo
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare onboarding del pacchetto installato, configurazione Telegram e vero E2E Telegram
  rispetto al pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease.
  Le esecuzioni locali una tantum dei maintainer possono omettere le variabili Convex e passare direttamente le tre credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- I maintainer possono eseguire lo stesso controllo post-publish da GitHub Actions tramite il
  workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e
  non viene eseguito su ogni merge.
- L'automazione di release dei maintainer ora usa preflight-then-promote:
  - la vera pubblicazione npm deve superare un `preflight_run_id` di npm riuscito
  - la vera pubblicazione npm deve essere dispatchata dallo stesso branch `main` o
    `release/YYYY.M.D` della preflight run riuscita
  - le release npm stable usano per impostazione predefinita `beta`
  - la pubblicazione npm stable può puntare esplicitamente a `latest` tramite input del workflow
  - la mutazione dei dist-tag npm basata su token ora si trova in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per ragioni di sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repository pubblico mantiene la pubblicazione solo tramite OIDC
  - la `macOS Release` pubblica è solo di validazione
  - la vera pubblicazione privata mac deve superare un `preflight_run_id` e un `validate_run_id`
    privati mac riusciti
  - i veri percorsi di publish promuovono artefatti preparati invece di ricostruirli
    di nuovo
- Per release stable correction come `YYYY.M.D-N`, il verificatore post-publish
  controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`
  in modo che le correzioni di release non possano lasciare silenziosamente installazioni globali più vecchie sul payload stable di base
- Il preflight di release npm fallisce in modalità fail-closed a meno che il tarball non includa sia
  `dist/control-ui/index.html` sia un payload non vuoto `dist/control-ui/assets/`
  così da non distribuire di nuovo una dashboard browser vuota
- La verifica post-publish controlla anche che l'installazione del registro pubblicato
  contenga dipendenze runtime non vuote dei Plugin bundled sotto il layout root `dist/*`.
  Una release distribuita con payload di dipendenze dei Plugin bundled mancanti o vuoti fallisce il verificatore postpublish e non può essere promossa
  a `latest`.
- `pnpm test:install:smoke` applica anche il budget `unpackedSize` di npm pack al
  tarball candidato all'aggiornamento, così l'e2e dell'installer intercetta l'aumento accidentale del pack
  prima del percorso di pubblicazione della release
- Se il lavoro di release ha toccato la pianificazione CI, i manifest di timing delle extension o
  le matrici di test delle extension, rigenera e rivedi gli output della matrice workflow
  `checks-node-extensions` posseduti dal planner da `.github/workflows/ci.yml`
  prima dell'approvazione in modo che le note di release non descrivano un layout CI obsoleto
- La prontezza della release macOS stable include anche le superfici dell'updater:
  - la release GitHub deve finire con `.zip`, `.dmg` e `.dSYM.zip` pacchettizzati
  - `appcast.xml` su `main` deve puntare al nuovo zip stable dopo la pubblicazione
  - l'app pacchettizzata deve mantenere un bundle id non-debug, un URL Sparkle feed
    non vuoto e un `CFBundleVersion` pari o superiore alla soglia canonica di build Sparkle
    per quella versione di release

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di release obbligatorio come `v2026.4.2`, `v2026.4.2-1` o
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere l'attuale
  SHA commit completo a 40 caratteri del branch del workflow per un preflight solo di validazione
- `preflight_only`: `true` per sola validazione/build/package, `false` per il
  vero percorso di pubblicazione
- `preflight_run_id`: obbligatorio nel vero percorso di pubblicazione così il workflow riusa
  il tarball preparato dalla preflight run riuscita
- `npm_dist_tag`: dist-tag di destinazione npm per il percorso di pubblicazione; il valore predefinito è `beta`

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: tag di release esistente o l'attuale SHA commit completo a 40 caratteri di `main`
  da convalidare quando viene dispatchato da `main`; da un branch di release, usa un
  tag di release esistente o l'attuale SHA commit completo a 40 caratteri del branch di release

Regole:

- I tag stable e correction possono pubblicare sia su `beta` sia su `latest`
- I tag prerelease beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l'input SHA commit completo è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` è sempre solo di validazione e accetta anch'esso lo
  SHA commit corrente del branch del workflow
- La modalità commit-SHA dei controlli di release richiede anche l'HEAD corrente del branch del workflow
- Il vero percorso di pubblicazione deve usare lo stesso `npm_dist_tag` usato durante il preflight;
  il workflow verifica quei metadati prima che la pubblicazione prosegua

## Sequenza di release npm stable

Quando si prepara una release npm stable:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare l'attuale SHA commit completo del branch del workflow
     per un dry run di sola validazione del workflow di preflight
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stable diretta
3. Esegui `OpenClaw Release Checks` separatamente con lo stesso tag o lo
   SHA completo corrente del branch del workflow quando vuoi copertura live su prompt cache,
   parità QA Lab, Matrix e Telegram
   - Questo è separato di proposito così la copertura live resta disponibile senza
     riaccoppiare controlli lunghi o instabili al workflow di pubblicazione
4. Salva il `preflight_run_id` riuscito
5. Esegui di nuovo `OpenClaw NPM Release` con `preflight_only=false`, lo stesso
   `tag`, lo stesso `npm_dist_tag` e il `preflight_run_id` salvato
6. Se la release è finita su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stable da `beta` a `latest`
7. Se la release ha pubblicato intenzionalmente direttamente su `latest` e `beta`
   deve seguire immediatamente la stessa build stable, usa quello stesso workflow privato
   per far puntare entrambi i dist-tag alla versione stable, oppure lascia che il suo sync
   programmato di self-healing sposti `beta` più tardi

La mutazione del dist-tag vive nel repository privato per motivi di sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repository pubblico mantiene la pubblicazione solo tramite OIDC.

Questo mantiene sia il percorso di pubblicazione diretta sia il percorso di promozione beta-first
documentati e visibili agli operatori.

Se un maintainer deve ripiegare sull'autenticazione npm locale, esegui qualsiasi comando
1Password CLI (`op`) solo all'interno di una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell principale dell'agente; mantenerlo dentro tmux rende prompt,
avvisi e gestione OTP osservabili e impedisce avvisi ripetuti sull'host.

## Riferimenti pubblici

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

I maintainer usano la documentazione privata di release in
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
per il runbook effettivo.

## Correlati

- [Canali di rilascio](/it/install/development-channels)
