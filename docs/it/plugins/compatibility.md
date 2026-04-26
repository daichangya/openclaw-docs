---
read_when:
    - Mantieni un Plugin OpenClaw
    - Vedi un avviso di compatibilità del Plugin
    - Stai pianificando una migrazione dell'SDK del Plugin o del manifest
summary: Contratti di compatibilità dei Plugin, metadati di deprecazione e aspettative di migrazione
title: Compatibilità dei Plugin
x-i18n:
    generated_at: "2026-04-26T11:34:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b4e11dc57c29eac72844b91bec75a9d48005bbd3c89a2a9d7a5634ab782e5fc
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw mantiene i contratti dei Plugin meno recenti collegati tramite adattatori di compatibilità nominati prima di rimuoverli. Questo protegge i Plugin esistenti inclusi ed esterni mentre i contratti di SDK, manifest, setup, configurazione e runtime dell'agente evolvono.

## Registro di compatibilità

I contratti di compatibilità dei Plugin sono tracciati nel registro core in
`src/plugins/compat/registry.ts`.

Ogni record ha:

- un codice di compatibilità stabile
- stato: `active`, `deprecated`, `removal-pending` o `removed`
- proprietario: SDK, configurazione, setup, canale, provider, esecuzione del Plugin, runtime dell'agente
  o core
- date di introduzione e deprecazione quando applicabili
- guida alla sostituzione
- documentazione, diagnostica e test che coprono il comportamento vecchio e nuovo

Il registro è la fonte per la pianificazione dei maintainer e per futuri controlli
del plugin inspector. Se un comportamento esposto ai Plugin cambia, aggiungi o aggiorna il record di compatibilità nella stessa modifica che aggiunge l'adattatore.

La compatibilità di migrazione e riparazione di Doctor è tracciata separatamente in
`src/commands/doctor/shared/deprecation-compat.ts`. Questi record coprono vecchie
forme di configurazione, layout del registro di installazione e shim di riparazione che potrebbero dover restare
disponibili dopo che il percorso di compatibilità runtime è stato rimosso.

Le verifiche di rilascio devono controllare entrambi i registri. Non eliminare una migrazione Doctor
solo perché il record di compatibilità runtime o configurazione corrispondente è scaduto; prima
verifica che non esista ancora un percorso di aggiornamento supportato che abbia bisogno della riparazione. Inoltre
riconvalida ogni annotazione di sostituzione durante la pianificazione del rilascio perché
la proprietà del Plugin e l'impronta della configurazione possono cambiare mentre provider e canali vengono spostati fuori dal
core.

## Pacchetto plugin inspector

Il plugin inspector deve vivere fuori dal repository core di OpenClaw come
pacchetto/repository separato supportato dai contratti versionati di compatibilità e manifest.

La CLI day-one deve essere:

```sh
openclaw-plugin-inspector ./my-plugin
```

Deve emettere:

- validazione manifest/schema
- la versione del contratto di compatibilità che viene controllata
- controlli dei metadati di installazione/sorgente
- controlli di import sul cold path
- avvisi di deprecazione e compatibilità

Usa `--json` per output stabile e leggibile dalle macchine nelle annotazioni CI. Il core OpenClaw
deve esporre contratti e fixture che l'inspector può consumare, ma non deve
pubblicare il binario inspector dal pacchetto principale `openclaw`.

## Policy di deprecazione

OpenClaw non deve rimuovere un contratto Plugin documentato nella stessa release
che introduce il suo sostituto.

La sequenza di migrazione è:

1. Aggiungere il nuovo contratto.
2. Mantenere il vecchio comportamento collegato tramite un adattatore di compatibilità nominato.
3. Emettere diagnostica o avvisi quando gli autori del Plugin possono intervenire.
4. Documentare la sostituzione e la timeline.
5. Testare sia il vecchio sia il nuovo percorso.
6. Attendere per tutta la finestra di migrazione annunciata.
7. Rimuovere solo con approvazione esplicita di release breaking.

I record deprecati devono includere una data di inizio dell'avviso, una sostituzione, un link alla documentazione
e una data finale di rimozione non oltre tre mesi dopo l'inizio dell'avviso. Non
aggiungere un percorso di compatibilità deprecato con una finestra di rimozione aperta senza limite a meno che
i maintainer non decidano esplicitamente che si tratta di compatibilità permanente e lo contrassegnino
invece come `active`.

## Aree di compatibilità attuali

I record di compatibilità attuali includono:

- import SDK legacy ampi come `openclaw/plugin-sdk/compat`
- forme di Plugin legacy basate solo su hook e `before_agent_start`
- entrypoint legacy del Plugin `activate(api)` mentre i Plugin migrano a
  `register(api)`
- alias SDK legacy come `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, builder di stato `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/test-utils` e gli alias di tipo `ClawdbotConfig` /
  `OpenClawSchemaType`
- comportamento di allowlist e abilitazione dei Plugin inclusi
- metadati legacy del manifest delle variabili d'ambiente di provider/canale
- hook e alias di tipo legacy dei Plugin provider mentre i provider passano a
  hook espliciti di catalogo, autenticazione, thinking, replay e trasporto
- alias runtime legacy come `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession` e `api.runtime.stt`
- registrazione legacy della suddivisione memory-plugin mentre i Plugin memoria passano a
  `registerMemoryCapability`
- helper legacy dell'SDK del canale per schemi nativi dei messaggi, gating delle menzioni,
  formattazione dell'envelope in ingresso e nesting delle capacità di approvazione
- hint di attivazione che vengono sostituiti dalla proprietà del contributo del manifest
- fallback runtime `setup-api` mentre i descrittori di setup passano a metadati cold
  `setup.requiresRuntime: false`
- hook `discovery` del provider mentre gli hook del catalogo provider passano a
  `catalog.run(...)`
- metadati del canale `showConfigured` / `showInSetup` mentre i pacchetti canale passano
  a `openclaw.channel.exposure`
- chiavi di configurazione legacy della policy runtime mentre Doctor migra gli operator a
  `agentRuntime`
- fallback dei metadati di configurazione dei canali inclusi generati mentre arrivano
  i metadati `channelConfigs` registry-first
- flag env di disabilitazione del registro Plugin persistito e di migrazione delle installazioni mentre
  i flussi di riparazione migrano gli operator a `openclaw plugins registry --refresh` e
  `openclaw doctor --fix`
- percorsi di configurazione legacy di ricerca web, recupero web e x_search di proprietà del Plugin mentre
  Doctor li migra a `plugins.entries.<plugin>.config`
- configurazione legacy authored `plugins.installs` e alias del percorso di caricamento dei Plugin inclusi mentre i metadati di installazione passano nel registro dei Plugin gestito dallo stato

Il nuovo codice Plugin deve preferire il sostituto elencato nel registro e nella
guida di migrazione specifica. I Plugin esistenti possono continuare a usare un percorso di compatibilità
finché documentazione, diagnostica e note di rilascio non annunciano una finestra di rimozione.

## Note di rilascio

Le note di rilascio devono includere le prossime deprecazioni dei Plugin con date obiettivo e
link alla documentazione di migrazione. Questo avviso deve avvenire prima che un percorso di compatibilità passi a `removal-pending` o `removed`.
