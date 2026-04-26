---
read_when:
    - Cerchi le definizioni dei canali di rilascio pubblici
    - Cerchi la denominazione delle versioni e la cadenza
summary: Canali di rilascio pubblici, denominazione delle versioni e cadenza
title: Criteri di rilascio
x-i18n:
    generated_at: "2026-04-26T11:37:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48ac0ca7d9c6a6ce011e8adda54e1e49beab30456c0dc2bffaec6acec41094df
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw ha tre canali di rilascio pubblici:

- stable: release con tag che vengono pubblicate su npm `beta` per impostazione predefinita, oppure su npm `latest` quando richiesto esplicitamente
- beta: tag di prerelease che vengono pubblicati su npm `beta`
- dev: la head mobile di `main`

## Denominazione delle versioni

- Versione di rilascio stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versione di rilascio stable correttiva: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versione di prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Non aggiungere zeri iniziali a mese o giorno
- `latest` indica l'attuale release stable npm promossa
- `beta` indica l'attuale destinazione di installazione beta
- Le release stable e le release stable correttive vengono pubblicate su npm `beta` per impostazione predefinita; gli operatori di rilascio possono scegliere esplicitamente `latest` come destinazione, oppure promuovere successivamente una build beta verificata
- Ogni release stable di OpenClaw distribuisce insieme il pacchetto npm e l'app macOS;
  le release beta in genere validano e pubblicano prima il percorso npm/package, con
  build/firma/notarizzazione dell'app mac riservate a stable salvo richiesta esplicita

## Cadenza di rilascio

- Le release seguono prima il flusso beta
- Stable segue solo dopo che l'ultima beta è stata validata
- In genere i maintainer creano le release da un branch `release/YYYY.M.D` creato
  dalla `main` corrente, così la validazione e le correzioni della release non bloccano il nuovo
  sviluppo su `main`
- Se un tag beta è già stato inviato o pubblicato e richiede una correzione, i maintainer creano
  il tag `-beta.N` successivo invece di eliminare o ricreare il vecchio tag beta
- La procedura dettagliata di rilascio, le approvazioni, le credenziali e le note di
  recupero sono riservate ai maintainer

## Verifiche preliminari al rilascio

- Esegui `pnpm check:test-types` prima delle verifiche preliminari al rilascio in modo che il TypeScript dei test resti
  coperto al di fuori del più rapido gate locale `pnpm check`
- Esegui `pnpm check:architecture` prima delle verifiche preliminari al rilascio in modo che i controlli più ampi su
  cicli di importazione e confini architetturali siano verdi al di fuori del gate locale più rapido
- Esegui `pnpm build && pnpm ui:build` prima di `pnpm release:check` in modo che gli attesi
  artifact di rilascio `dist/*` e il bundle della Control UI esistano per il passaggio di
  validazione pack
- Esegui `pnpm qa:otel:smoke` quando validi la telemetria di rilascio. Esercita
  QA-lab tramite un ricevitore locale OTLP/HTTP e verifica i nomi degli span di traccia
  esportati, gli attributi limitati e la redazione di contenuti/identificatori senza
  richiedere Opik, Langfuse o un altro collector esterno.
- Esegui `pnpm release:check` prima di ogni release con tag
- I controlli di rilascio ora vengono eseguiti in un workflow manuale separato:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` esegue anche il gate di parità mock di QA Lab più i lane QA live
  di Matrix e Telegram prima dell'approvazione del rilascio. I lane live usano l'ambiente
  `qa-live-shared`; Telegram usa anche lease di credenziali CI Convex.
- La validazione runtime cross-OS di installazione e aggiornamento viene avviata dal
  workflow chiamante privato
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  che invoca il workflow pubblico riutilizzabile
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Questa separazione è intenzionale: mantiene il percorso reale di rilascio npm breve,
  deterministico e focalizzato sugli artifact, mentre i controlli live più lenti restano in un
  lane dedicato così non rallentano né bloccano la pubblicazione
- I controlli di rilascio devono essere avviati dal ref del workflow `main` oppure da un
  ref del workflow `release/YYYY.M.D` così la logica del workflow e i secret restano
  controllati
- Quel workflow accetta o un tag di rilascio esistente o l'attuale SHA di commit a 40 caratteri completo del branch del workflow
- In modalità commit-SHA accetta solo l'attuale HEAD del branch del workflow; usa un
  tag di rilascio per commit di rilascio meno recenti
- Anche la verifica preliminare solo-validazione di `OpenClaw NPM Release` accetta l'attuale
  SHA di commit a 40 caratteri completo del branch del workflow senza richiedere un tag inviato
- Quel percorso SHA è solo di validazione e non può essere promosso in una pubblicazione reale
- In modalità SHA il workflow sintetizza `v<package.json version>` solo per il controllo dei metadati
  del pacchetto; la pubblicazione reale richiede comunque un vero tag di rilascio
- Entrambi i workflow mantengono il vero percorso di pubblicazione e promozione su runner
  GitHub-hosted, mentre il percorso di validazione non mutante può usare i runner Linux
  Blacksmith più grandi
- Quel workflow esegue
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando sia i secret di workflow `OPENAI_API_KEY` sia `ANTHROPIC_API_KEY`
- La verifica preliminare del rilascio npm non attende più il lane separato dei controlli di rilascio
- Esegui `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (o il tag beta/correttivo corrispondente) prima dell'approvazione
- Dopo la pubblicazione npm, esegui
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (o la versione beta/correttiva corrispondente) per verificare il percorso di installazione
  del registro pubblicato in un nuovo prefisso temporaneo
- Dopo una pubblicazione beta, esegui `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  per verificare onboarding del pacchetto installato, configurazione Telegram e vero E2E Telegram
  rispetto al pacchetto npm pubblicato usando il pool condiviso di credenziali Telegram in lease.
  Le esecuzioni locali una tantum dei maintainer possono omettere le variabili Convex e passare direttamente le tre
  credenziali env `OPENCLAW_QA_TELEGRAM_*`.
- I maintainer possono eseguire lo stesso controllo post-pubblicazione da GitHub Actions tramite il
  workflow manuale `NPM Telegram Beta E2E`. È intenzionalmente solo manuale e
  non viene eseguito a ogni merge.
- L'automazione di rilascio dei maintainer ora usa preflight-then-promote:
  - la vera pubblicazione npm deve superare un `preflight_run_id` npm riuscito
  - la vera pubblicazione npm deve essere avviata dallo stesso branch `main` o
    `release/YYYY.M.D` dell'esecuzione preliminare riuscita
  - le release stable npm usano `beta` per impostazione predefinita
  - la pubblicazione npm stable può scegliere esplicitamente `latest` come destinazione tramite input del workflow
  - la mutazione token-based del dist-tag npm ora si trova in
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    per motivi di sicurezza, perché `npm dist-tag add` richiede ancora `NPM_TOKEN` mentre il
    repo pubblico mantiene la pubblicazione solo OIDC
  - il `macOS Release` pubblico è solo di validazione
  - la vera pubblicazione mac privata deve superare con successo il mac privato
    `preflight_run_id` e `validate_run_id`
  - i veri percorsi di pubblicazione promuovono artifact preparati invece di ricostruirli
    di nuovo
- Per le release stable correttive come `YYYY.M.D-N`, il verificatore post-pubblicazione
  controlla anche lo stesso percorso di aggiornamento con prefisso temporaneo da `YYYY.M.D` a `YYYY.M.D-N`
  così le correzioni di rilascio non possono lasciare silenziosamente installazioni globali più vecchie sul
  payload stable di base
- La verifica preliminare del rilascio npm fallisce in modalità fail-closed a meno che il tarball includa sia
  `dist/control-ui/index.html` sia un payload `dist/control-ui/assets/` non vuoto
  così non distribuiamo di nuovo una dashboard browser vuota
- La verifica post-pubblicazione controlla anche che l'installazione dal registro pubblicato
  contenga dipendenze runtime bundled del Plugin non vuote sotto il layout radice `dist/*`.
  Una release distribuita con payload di dipendenze bundled del Plugin mancanti o vuoti
  fallisce il verificatore postpublish e non può essere promossa
  a `latest`.
- `pnpm test:install:smoke` applica anche il budget `unpackedSize` di npm pack al
  tarball candidato all'aggiornamento, così l'e2e dell'installer intercetta aumenti accidentali del pack
  prima del percorso di pubblicazione del rilascio
- Se il lavoro di rilascio ha modificato la pianificazione CI, i manifest dei tempi delle estensioni o
  le matrici di test delle estensioni, rigenera e rivedi gli output della matrice del workflow
  `checks-node-extensions` di proprietà del planner da `.github/workflows/ci.yml`
  prima dell'approvazione così le note di rilascio non descrivono un layout CI obsoleto
- La preparazione al rilascio stable macOS include anche le superfici dell'updater:
  - la release GitHub deve finire con il `.zip`, `.dmg` e `.dSYM.zip` pacchettizzati
  - `appcast.xml` su `main` deve puntare al nuovo zip stable dopo la pubblicazione
  - l'app pacchettizzata deve mantenere un bundle id non-debug, un URL del feed Sparkle non vuoto
    e un `CFBundleVersion` pari o superiore alla soglia canonica di build Sparkle
    per quella versione di rilascio

## Input del workflow NPM

`OpenClaw NPM Release` accetta questi input controllati dall'operatore:

- `tag`: tag di rilascio obbligatorio come `v2026.4.2`, `v2026.4.2-1` oppure
  `v2026.4.2-beta.1`; quando `preflight_only=true`, può anche essere l'attuale
  SHA di commit a 40 caratteri completo del branch del workflow per una verifica preliminare solo di validazione
- `preflight_only`: `true` per sola validazione/build/package, `false` per il
  vero percorso di pubblicazione
- `preflight_run_id`: obbligatorio nel vero percorso di pubblicazione così il workflow riutilizza
  il tarball preparato dall'esecuzione preliminare riuscita
- `npm_dist_tag`: tag npm di destinazione per il percorso di pubblicazione; predefinito `beta`

`OpenClaw Release Checks` accetta questi input controllati dall'operatore:

- `ref`: tag di rilascio esistente o l'attuale SHA di commit a 40 caratteri completo di `main`
  da validare quando viene avviato da `main`; da un branch di rilascio, usa un
  tag di rilascio esistente o l'attuale SHA di commit a 40 caratteri completo del branch di rilascio

Regole:

- I tag stable e correttivi possono pubblicare su `beta` oppure `latest`
- I tag di prerelease beta possono pubblicare solo su `beta`
- Per `OpenClaw NPM Release`, l'input SHA di commit completo è consentito solo quando
  `preflight_only=true`
- `OpenClaw Release Checks` è sempre solo di validazione e accetta anche lo
  SHA di commit corrente del branch del workflow
- La modalità commit-SHA dei controlli di rilascio richiede anche l'attuale HEAD del branch del workflow
- Il vero percorso di pubblicazione deve usare lo stesso `npm_dist_tag` usato durante la verifica preliminare;
  il workflow verifica quei metadati prima che la pubblicazione continui

## Sequenza di rilascio npm stable

Quando crei una release npm stable:

1. Esegui `OpenClaw NPM Release` con `preflight_only=true`
   - Prima che esista un tag, puoi usare l'attuale SHA di commit completo del branch del workflow
     per una prova a secco solo di validazione del workflow preliminare
2. Scegli `npm_dist_tag=beta` per il normale flusso beta-first, oppure `latest` solo
   quando vuoi intenzionalmente una pubblicazione stable diretta
3. Esegui `OpenClaw Release Checks` separatamente con lo stesso tag o lo
   SHA completo corrente del branch del workflow quando vuoi copertura live per prompt cache,
   QA Lab parity, Matrix e Telegram
   - È separato apposta così la copertura live resta disponibile senza
     riaccoppiare controlli lunghi o instabili al workflow di pubblicazione
4. Salva il `preflight_run_id` riuscito
5. Esegui di nuovo `OpenClaw NPM Release` con `preflight_only=false`, lo stesso
   `tag`, lo stesso `npm_dist_tag` e il `preflight_run_id` salvato
6. Se la release è arrivata su `beta`, usa il workflow privato
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   per promuovere quella versione stable da `beta` a `latest`
7. Se la release è stata intenzionalmente pubblicata direttamente su `latest` e `beta`
   deve seguire immediatamente la stessa build stable, usa lo stesso workflow privato
   per far puntare entrambi i dist-tag alla versione stable, oppure lascia che la sua sincronizzazione
   di autoripristino pianificata sposti `beta` in seguito

La mutazione del dist-tag si trova nel repo privato per motivi di sicurezza perché richiede ancora
`NPM_TOKEN`, mentre il repo pubblico mantiene la pubblicazione solo OIDC.

Questo mantiene sia il percorso di pubblicazione diretta sia il percorso di promozione beta-first
documentati e visibili agli operatori.

Se un maintainer deve ricorrere all'autenticazione npm locale, esegui qualsiasi comando della CLI
1Password (`op`) solo all'interno di una sessione tmux dedicata. Non chiamare `op`
direttamente dalla shell principale dell'agente; mantenerlo dentro tmux rende prompt,
avvisi e gestione OTP osservabili e previene avvisi ripetuti dell'host.

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

## Correlati

- [Canali di rilascio](/it/install/development-channels)
