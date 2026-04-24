---
read_when:
    - Aggiunta di una nuova capacità del core e della superficie di registrazione dei Plugin
    - Decidere se il codice appartiene al core, a un Plugin del fornitore o a un Plugin di funzionalità
    - Collegamento di un nuovo helper di runtime per i canali o gli strumenti
sidebarTitle: Adding Capabilities
summary: Guida per i contributori all'aggiunta di una nuova capacità condivisa al sistema di Plugin OpenClaw
title: Aggiunta di capacità (guida per i contributori)
x-i18n:
    generated_at: "2026-04-24T09:54:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 864506dd3f61aa64e7c997c9d9e05ce0ad70c80a26a734d4f83b2e80331be4ab
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  Questa è una **guida per i contributori** destinata agli sviluppatori del core di OpenClaw. Se stai
  creando un plugin esterno, consulta invece [Building Plugins](/it/plugins/building-plugins).
</Info>

Usa questa guida quando OpenClaw ha bisogno di un nuovo dominio, come la generazione di immagini, la
generazione di video o qualche futura area di funzionalità supportata da vendor.

La regola:

- plugin = confine di responsabilità
- capacità = contratto condiviso del core

Questo significa che non dovresti iniziare collegando un vendor direttamente a un canale o a uno
strumento. Inizia definendo la capacità.

## Quando creare una capacità

Crea una nuova capacità quando tutte queste condizioni sono vere:

1. più di un vendor potrebbe plausibilmente implementarla
2. canali, strumenti o Plugin di funzionalità dovrebbero usarla senza doversi preoccupare del
   vendor
3. il core deve possedere il comportamento di fallback, policy, configurazione o distribuzione

Se il lavoro riguarda solo un vendor e non esiste ancora un contratto condiviso, fermati e definisci
prima il contratto.

## La sequenza standard

1. Definisci il contratto tipizzato del core.
2. Aggiungi la registrazione del Plugin per quel contratto.
3. Aggiungi un helper di runtime condiviso.
4. Collega un vero Plugin vendor come prova.
5. Sposta i consumer di funzionalità/canali sull'helper di runtime.
6. Aggiungi test del contratto.
7. Documenta la configurazione rivolta agli operatori e il modello di responsabilità.

## Cosa va dove

Core:

- tipi richiesta/risposta
- registro dei provider + risoluzione
- comportamento di fallback
- schema di configurazione più metadati di documentazione `title` / `description` propagati su nodi oggetto annidati, wildcard, elementi di array e composizione
- superficie dell'helper di runtime

Plugin vendor:

- chiamate API del vendor
- gestione dell'autenticazione del vendor
- normalizzazione delle richieste specifica del vendor
- registrazione dell'implementazione della capacità

Plugin di funzionalità/canale:

- chiama `api.runtime.*` o l'helper `plugin-sdk/*-runtime` corrispondente
- non chiama mai direttamente un'implementazione vendor

## Seams di provider e Harness

Usa gli hook del provider quando il comportamento appartiene al contratto del provider del modello
piuttosto che al loop generico dell'agente. Gli esempi includono parametri di richiesta specifici del provider
dopo la selezione del trasporto, preferenza del profilo di autenticazione, overlay del prompt e instradamento
di fallback successivo dopo il failover di modello/profilo.

Usa gli hook dell'harness dell'agente quando il comportamento appartiene al runtime che sta
eseguendo un turno. Gli harness possono classificare risultati di tentativi riusciti ma inutilizzabili,
come risposte vuote, solo ragionamento o solo pianificazione, in modo che la policy esterna di
fallback del modello possa prendere la decisione di retry.

Mantieni entrambi i seam stretti:

- il core possiede la policy di retry/fallback
- i Plugin provider possiedono gli indizi specifici del provider per richieste/autenticazione/instradamento
- i Plugin harness possiedono la classificazione dei tentativi specifica del runtime
- i Plugin di terze parti restituiscono indizi, non mutazioni dirette dello stato del core

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
- configurazione/documentazione/test

## Esempio: generazione di immagini

La generazione di immagini segue la forma standard:

1. il core definisce `ImageGenerationProvider`
2. il core espone `registerImageGenerationProvider(...)`
3. il core espone `runtime.imageGeneration.generate(...)`
4. i Plugin `openai`, `google`, `fal` e `minimax` registrano implementazioni supportate da vendor
5. i vendor futuri possono registrare lo stesso contratto senza modificare canali/strumenti

La chiave di configurazione è separata dall'instradamento dell'analisi visiva:

- `agents.defaults.imageModel` = analizzare immagini
- `agents.defaults.imageGenerationModel` = generare immagini

Mantienile separate in modo che fallback e policy restino espliciti.

## Checklist di revisione

Prima di distribuire una nuova capacità, verifica che:

- nessun canale/strumento importi direttamente codice vendor
- l'helper di runtime sia il percorso condiviso
- almeno un test del contratto verifichi la responsabilità dei componenti inclusi
- la documentazione della configurazione nomini la nuova chiave di modello/configurazione
- la documentazione dei Plugin spieghi il confine di responsabilità

Se una PR salta il layer della capacità e codifica rigidamente il comportamento vendor in un
canale/strumento, rimandala indietro e definisci prima il contratto.

## Correlati

- [Plugin](/it/tools/plugin)
- [Creating skills](/it/tools/creating-skills)
- [Tools and plugins](/it/tools)
