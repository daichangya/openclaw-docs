---
read_when:
    - Aggiunta di una nuova capacità core e superficie di registrazione del Plugin
    - Decidere se il codice appartiene al core, a un Plugin vendor o a un Plugin funzionalità
    - Collegare un nuovo helper runtime per canali o strumenti
sidebarTitle: Adding Capabilities
summary: Guida per i contributori all'aggiunta di una nuova capacità condivisa al sistema Plugin di OpenClaw
title: Aggiungere capacità (guida per i contributori)
x-i18n:
    generated_at: "2026-04-25T13:58:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2879b8a4a215dcc44086181e49c510edae93caff01e52c2f5e6b79e6cb02d7b
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Questa è una **guida per i contributori** per gli sviluppatori core di OpenClaw. Se stai
  creando un Plugin esterno, vedi invece [Creare Plugin](/it/plugins/building-plugins).
</Info>

Usa questa guida quando OpenClaw ha bisogno di un nuovo dominio come la generazione di immagini, la generazione di video
o qualche futura area di funzionalità supportata da vendor.

La regola:

- plugin = confine di ownership
- capacità = contratto core condiviso

Questo significa che non dovresti iniziare collegando direttamente un vendor a un canale o a uno
strumento. Inizia definendo la capacità.

## Quando creare una capacità

Crea una nuova capacità quando tutte queste condizioni sono vere:

1. più di un vendor potrebbe plausibilmente implementarla
2. canali, strumenti o Plugin funzionalità dovrebbero consumarla senza preoccuparsi
   del vendor
3. il core deve possedere il comportamento di fallback, criteri, configurazione o consegna

Se il lavoro riguarda solo un vendor e non esiste ancora un contratto condiviso, fermati e definisci prima il contratto.

## La sequenza standard

1. Definisci il contratto core tipizzato.
2. Aggiungi la registrazione del Plugin per quel contratto.
3. Aggiungi un helper runtime condiviso.
4. Collega un vero Plugin vendor come prova.
5. Sposta i consumer di funzionalità/canale sull'helper runtime.
6. Aggiungi test del contratto.
7. Documenta la configurazione visibile all'operatore e il modello di ownership.

## Cosa va dove

Core:

- tipi richiesta/risposta
- registry del provider + risoluzione
- comportamento di fallback
- schema di configurazione più metadati di documentazione `title` / `description` propagati su nodi oggetto annidati, wildcard, item array e composizione
- superficie helper runtime

Plugin vendor:

- chiamate API del vendor
- gestione auth del vendor
- normalizzazione specifica delle richieste del vendor
- registrazione dell'implementazione della capacità

Plugin funzionalità/canale:

- chiama `api.runtime.*` o l'helper corrispondente `plugin-sdk/*-runtime`
- non chiama mai direttamente un'implementazione vendor

## Seams provider e harness

Usa gli hook provider quando il comportamento appartiene al contratto del provider del modello
piuttosto che al loop agente generico. Esempi includono parametri di richiesta specifici del provider
dopo la selezione del trasporto, preferenza del profilo auth, overlay del prompt e
instradamento del fallback di follow-up dopo il failover di modello/profilo.

Usa gli hook dell'harness agente quando il comportamento appartiene al runtime che sta
eseguendo un turno. Gli harness possono classificare risultati di tentativi riusciti ma inutilizzabili
come risposte vuote, solo reasoning o solo pianificazione, così il criterio esterno di
fallback del modello può prendere la decisione di retry.

Mantieni entrambi i seam stretti:

- il core possiede il criterio di retry/fallback
- i Plugin provider possiedono hint specifici del provider per richiesta/auth/instradamento
- i Plugin harness possiedono la classificazione specifica del runtime dei tentativi
- i Plugin di terze parti restituiscono hint, non mutazioni dirette dello stato core

## Checklist dei file

Per una nuova capacità, aspettati di toccare queste aree:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- uno o più pacchetti Plugin inclusi
- config/docs/test

## Esempio: generazione di immagini

La generazione di immagini segue la forma standard:

1. il core definisce `ImageGenerationProvider`
2. il core espone `registerImageGenerationProvider(...)`
3. il core espone `runtime.imageGeneration.generate(...)`
4. i Plugin `openai`, `google`, `fal` e `minimax` registrano implementazioni supportate da vendor
5. i vendor futuri possono registrare lo stesso contratto senza cambiare canali/strumenti

La chiave di configurazione è separata dall'instradamento dell'analisi vision:

- `agents.defaults.imageModel` = analizza immagini
- `agents.defaults.imageGenerationModel` = genera immagini

Mantienili separati così fallback e criteri restano espliciti.

## Checklist di revisione

Prima di distribuire una nuova capacità, verifica:

- nessun canale/strumento importa direttamente codice vendor
- l'helper runtime è il percorso condiviso
- almeno un test del contratto verifica l'ownership inclusa nel bundle
- la documentazione della configurazione nomina il nuovo modello/la nuova chiave di configurazione
- la documentazione dei Plugin spiega il confine di ownership

Se una PR salta il layer della capacità e inserisce comportamento vendor hardcoded in un
canale/strumento, rimandala indietro e definisci prima il contratto.

## Correlati

- [Plugin](/it/tools/plugin)
- [Creare Skills](/it/tools/creating-skills)
- [Strumenti e Plugin](/it/tools)
