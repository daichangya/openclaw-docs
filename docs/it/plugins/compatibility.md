---
read_when:
    - Gestisci un Plugin OpenClaw
    - Vedi un avviso di compatibilità del Plugin
    - Stai pianificando una migrazione dell'SDK Plugin o del manifest
summary: Contratti di compatibilità dei Plugin, metadati di deprecazione e aspettative di migrazione
title: Compatibilità dei Plugin
x-i18n:
    generated_at: "2026-04-25T13:51:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e0cdbc763eed5a38b303fc44202ddd36e58bce43dc29b6348db3f5fea66f26
    source_path: plugins/compatibility.md
    workflow: 15
---

OpenClaw mantiene collegati i contratti dei Plugin più vecchi tramite adapter di compatibilità nominati prima di rimuoverli. Questo protegge i Plugin esistenti bundled ed esterni mentre evolvono i contratti di SDK, manifest, setup, config e runtime dell'agente.

## Registro di compatibilità

I contratti di compatibilità dei Plugin sono tracciati nel registro core in
`src/plugins/compat/registry.ts`.

Ogni record ha:

- un codice di compatibilità stabile
- stato: `active`, `deprecated`, `removal-pending` oppure `removed`
- owner: SDK, config, setup, channel, provider, esecuzione del plugin, runtime dell'agente,
  oppure core
- date di introduzione e deprecazione quando applicabili
- indicazioni sul sostituto
- documentazione, diagnostica e test che coprono il comportamento vecchio e quello nuovo

Il registro è la fonte per la pianificazione dei maintainer e per i futuri controlli
del plugin inspector. Se un comportamento rivolto ai Plugin cambia, aggiungi o aggiorna il record di compatibilità nella stessa modifica che aggiunge l'adapter.

## Pacchetto plugin inspector

Il plugin inspector dovrebbe trovarsi fuori dal repository core di OpenClaw come
pacchetto/repository separato supportato dai contratti di compatibilità e manifest
versionati.

La CLI del day-one dovrebbe essere:

```sh
openclaw-plugin-inspector ./my-plugin
```

Dovrebbe emettere:

- validazione del manifest/schema
- la versione del contratto di compatibilità che viene controllata
- controlli dei metadati di installazione/sorgente
- controlli di import cold-path
- avvisi di deprecazione e compatibilità

Usa `--json` per un output stabile leggibile da macchina nelle annotazioni CI. Il core OpenClaw
dovrebbe esporre contratti e fixture che l'inspector può consumare, ma non dovrebbe
pubblicare il binario inspector dal pacchetto principale `openclaw`.

## Politica di deprecazione

OpenClaw non dovrebbe rimuovere un contratto Plugin documentato nella stessa release
in cui introduce il suo sostituto.

La sequenza di migrazione è:

1. Aggiungere il nuovo contratto.
2. Mantenere il vecchio comportamento collegato tramite un adapter di compatibilità nominato.
3. Emettere diagnostica o avvisi quando gli autori dei Plugin possono intervenire.
4. Documentare il sostituto e la timeline.
5. Testare sia il percorso vecchio sia quello nuovo.
6. Attendere per l'intervallo di migrazione annunciato.
7. Rimuovere solo con approvazione esplicita di una release breaking.

I record deprecati devono includere una data di inizio degli avvisi, il sostituto, un link alla documentazione e una data di rimozione prevista quando nota.

## Aree di compatibilità attuali

I record di compatibilità attuali includono:

- import SDK legacy ampi come `openclaw/plugin-sdk/compat`
- shape legacy dei Plugin solo hook e `before_agent_start`
- comportamento di allowlist e abilitazione dei Plugin bundled
- metadati legacy del manifest delle variabili env provider/channel
- activation hint che vengono sostituiti dalla proprietà dei contributi del manifest
- alias di naming `embeddedHarness` e `agent-harness` mentre il naming pubblico si sposta
  verso `agentRuntime`
- fallback dei metadati di configurazione dei canali bundled generati mentre arrivano
  i metadati `channelConfigs` registry-first

Il nuovo codice dei Plugin dovrebbe preferire il sostituto elencato nel registro e nella
guida di migrazione specifica. I Plugin esistenti possono continuare a usare un percorso di compatibilità
finché documentazione, diagnostica e note di rilascio non annunciano una finestra di rimozione.

## Note di rilascio

Le note di rilascio dovrebbero includere le prossime deprecazioni dei Plugin con date target e
link alla documentazione di migrazione. Questo avviso deve arrivare prima che un percorso di compatibilità passi a `removal-pending` o `removed`.
