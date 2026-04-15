---
read_when:
    - Stai creando un Plugin OpenClaw
    - Devi distribuire uno schema di configurazione del Plugin o eseguire il debug degli errori di validazione del Plugin
summary: Manifest del Plugin + requisiti dello schema JSON (validazione rigorosa della configurazione)
title: Manifest del Plugin
x-i18n:
    generated_at: "2026-04-15T08:18:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba2183bfa8802871e4ef33a0ebea290606e8351e9e83e25ee72456addb768730
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest del Plugin (`openclaw.plugin.json`)

Questa pagina riguarda solo il **manifest nativo del Plugin OpenClaw**.

Per i layout di bundle compatibili, vedi [Bundle di Plugin](/it/plugins/bundles).

I formati di bundle compatibili usano file manifest diversi:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` o il layout predefinito del componente Claude
  senza un manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche questi layout di bundle, ma non vengono validati
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw al momento legge i metadati del bundle più le root
delle Skills dichiarate, le root dei comandi Claude, i valori predefiniti di `settings.json` del bundle Claude,
i valori predefiniti LSP del bundle Claude e i pacchetti hook supportati quando il layout corrisponde
alle aspettative di runtime di OpenClaw.

Ogni Plugin OpenClaw nativo **deve** distribuire un file `openclaw.plugin.json` nella
**root del Plugin**. OpenClaw usa questo manifest per validare la configurazione
**senza eseguire il codice del Plugin**. I manifest mancanti o non validi sono trattati come
errori del Plugin e bloccano la validazione della configurazione.

Vedi la guida completa al sistema dei Plugin: [Plugin](/it/tools/plugin).
Per il modello di capability nativo e le attuali indicazioni sulla compatibilità esterna:
[Modello di capability](/it/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` è il metadato che OpenClaw legge prima di caricare il codice
del tuo Plugin.

Usalo per:

- identità del Plugin
- validazione della configurazione
- metadati di autenticazione e onboarding che devono essere disponibili senza avviare il
  runtime del Plugin
- hint di attivazione economici che le superfici del control plane possono ispezionare prima che il runtime
  venga caricato
- descrittori di setup economici che le superfici di setup/onboarding possono ispezionare prima che il
  runtime venga caricato
- metadati di alias e auto-abilitazione che devono essere risolti prima che il runtime del Plugin venga caricato
- metadati abbreviati di proprietà della famiglia di modelli che devono auto-attivare il
  Plugin prima che il runtime venga caricato
- istantanee statiche di proprietà delle capability usate per il wiring di compatibilità dei bundle e la
  copertura dei contratti
- metadati economici del runner QA che l'host condiviso `openclaw qa` può ispezionare
  prima che il runtime del Plugin venga caricato
- metadati di configurazione specifici del canale che devono essere uniti nelle superfici di catalogo e validazione
  senza caricare il runtime
- suggerimenti UI per la configurazione

Non usarlo per:

- registrare il comportamento di runtime
- dichiarare entrypoint del codice
- metadati di installazione npm

Questi appartengono al codice del tuo Plugin e a `package.json`.

## Esempio minimo

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Esempio completo

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "Plugin provider OpenRouter",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "Chiave API OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Chiave API OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Chiave API",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Riferimento dei campi di primo livello

| Campo                               | Obbligatorio | Tipo                             | Significato                                                                                                                                                                                                  |
| ----------------------------------- | ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Sì           | `string`                         | ID canonico del Plugin. È l'ID usato in `plugins.entries.<id>`.                                                                                                                                             |
| `configSchema`                      | Sì           | `object`                         | Schema JSON inline per la configurazione di questo Plugin.                                                                                                                                                   |
| `enabledByDefault`                  | No           | `true`                           | Contrassegna un Plugin bundle come abilitato per impostazione predefinita. Omettilo, oppure imposta qualsiasi valore diverso da `true`, per lasciare il Plugin disabilitato per impostazione predefinita. |
| `legacyPluginIds`                   | No           | `string[]`                       | ID legacy che vengono normalizzati a questo ID canonico del Plugin.                                                                                                                                         |
| `autoEnableWhenConfiguredProviders` | No           | `string[]`                       | ID provider che devono abilitare automaticamente questo Plugin quando auth, config o riferimenti a modelli li menzionano.                                                                                   |
| `kind`                              | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo esclusivo di Plugin usato da `plugins.slots.*`.                                                                                                                                            |
| `channels`                          | No           | `string[]`                       | ID dei canali posseduti da questo Plugin. Usati per discovery e validazione della configurazione.                                                                                                            |
| `providers`                         | No           | `string[]`                       | ID provider posseduti da questo Plugin.                                                                                                                                                                      |
| `modelSupport`                      | No           | `object`                         | Metadati abbreviati della famiglia di modelli posseduti dal manifest usati per auto-caricare il Plugin prima del runtime.                                                                                  |
| `cliBackends`                       | No           | `string[]`                       | ID dei backend di inferenza CLI posseduti da questo Plugin. Usati per l'auto-attivazione all'avvio da riferimenti espliciti nella configurazione.                                                          |
| `commandAliases`                    | No           | `object[]`                       | Nomi di comandi posseduti da questo Plugin che devono produrre diagnostica di configurazione e CLI consapevole del Plugin prima che il runtime venga caricato.                                             |
| `providerAuthEnvVars`               | No           | `Record<string, string[]>`       | Metadati economici delle variabili env di auth provider che OpenClaw può ispezionare senza caricare il codice del Plugin.                                                                                  |
| `providerAuthAliases`               | No           | `Record<string, string>`         | ID provider che devono riutilizzare un altro ID provider per la ricerca auth, ad esempio un provider di coding che condivide la chiave API del provider di base e i profili auth.                         |
| `channelEnvVars`                    | No           | `Record<string, string[]>`       | Metadati economici delle variabili env del canale che OpenClaw può ispezionare senza caricare il codice del Plugin. Usali per superfici di setup o auth del canale guidate da env che gli helper generici di avvio/configurazione devono vedere. |
| `providerAuthChoices`               | No           | `object[]`                       | Metadati economici delle scelte di autenticazione per selettori di onboarding, risoluzione del provider preferito e semplice wiring dei flag CLI.                                                           |
| `activation`                        | No           | `object`                         | Hint di attivazione economici per il caricamento attivato da provider, comando, canale, route e capability. Solo metadati; il runtime del Plugin continua a possedere il comportamento reale.             |
| `setup`                             | No           | `object`                         | Descrittori economici di setup/onboarding che le superfici di discovery e setup possono ispezionare senza caricare il runtime del Plugin.                                                                  |
| `qaRunners`                         | No           | `object[]`                       | Descrittori economici dei runner QA usati dall'host condiviso `openclaw qa` prima che il runtime del Plugin venga caricato.                                                                                |
| `contracts`                         | No           | `object`                         | Istantanea statica delle capability bundle per speech, trascrizione realtime, voce realtime, media-understanding, generazione di immagini, generazione musicale, generazione video, web-fetch, ricerca web e proprietà dei tool. |
| `channelConfigs`                    | No           | `Record<string, object>`         | Metadati di configurazione del canale posseduti dal manifest uniti nelle superfici di discovery e validazione prima che il runtime venga caricato.                                                          |
| `skills`                            | No           | `string[]`                       | Directory di Skills da caricare, relative alla root del Plugin.                                                                                                                                             |
| `name`                              | No           | `string`                         | Nome leggibile del Plugin.                                                                                                                                                                                   |
| `description`                       | No           | `string`                         | Breve riepilogo mostrato nelle superfici del Plugin.                                                                                                                                                         |
| `version`                           | No           | `string`                         | Versione informativa del Plugin.                                                                                                                                                                             |
| `uiHints`                           | No           | `Record<string, object>`         | Etichette UI, segnaposto e suggerimenti di sensibilità per i campi di configurazione.                                                                                                                        |

## Riferimento `providerAuthChoices`

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o autenticazione.
OpenClaw la legge prima che il runtime del provider venga caricato.

| Campo                 | Obbligatorio | Tipo                                            | Significato                                                                                               |
| --------------------- | ------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                        | ID del provider a cui appartiene questa scelta.                                                           |
| `method`              | Sì           | `string`                                        | ID del metodo di autenticazione a cui inoltrare.                                                          |
| `choiceId`            | Sì           | `string`                                        | ID stabile della scelta di autenticazione usato dai flussi di onboarding e CLI.                           |
| `choiceLabel`         | No           | `string`                                        | Etichetta visibile all'utente. Se omessa, OpenClaw usa `choiceId` come fallback.                          |
| `choiceHint`          | No           | `string`                                        | Breve testo di supporto per il selettore.                                                                 |
| `assistantPriority`   | No           | `number`                                        | I valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.             |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell'assistente pur consentendo comunque la selezione manuale via CLI.  |
| `deprecatedChoiceIds` | No           | `string[]`                                      | ID legacy delle scelte che devono reindirizzare gli utenti a questa scelta sostitutiva.                  |
| `groupId`             | No           | `string`                                        | ID opzionale del gruppo per raggruppare scelte correlate.                                                 |
| `groupLabel`          | No           | `string`                                        | Etichetta visibile all'utente per quel gruppo.                                                            |
| `groupHint`           | No           | `string`                                        | Breve testo di supporto per il gruppo.                                                                    |
| `optionKey`           | No           | `string`                                        | Chiave interna dell'opzione per semplici flussi di autenticazione con un solo flag.                       |
| `cliFlag`             | No           | `string`                                        | Nome del flag CLI, ad esempio `--openrouter-api-key`.                                                     |
| `cliOption`           | No           | `string`                                        | Forma completa dell'opzione CLI, ad esempio `--openrouter-api-key <key>`.                                 |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nella guida CLI.                                                                        |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation">` | In quali superfici di onboarding deve comparire questa scelta. Se omesso, il valore predefinito è `["text-inference"]`. |

## Riferimento `commandAliases`

Usa `commandAliases` quando un Plugin possiede un nome di comando di runtime che gli utenti possono
inserire per errore in `plugins.allow` o provare a eseguire come comando CLI di root. OpenClaw
usa questi metadati per la diagnostica senza importare il codice di runtime del Plugin.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Campo        | Obbligatorio | Tipo              | Significato                                                             |
| ------------ | ------------ | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Sì           | `string`          | Nome del comando che appartiene a questo Plugin.                        |
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash della chat anziché comando CLI di root. |
| `cliCommand` | No           | `string`          | Comando CLI di root correlato da suggerire per le operazioni CLI, se esiste. |

## Riferimento `activation`

Usa `activation` quando il Plugin può dichiarare in modo economico quali eventi del control plane
dovrebbero attivarlo in seguito.

## Riferimento `qaRunners`

Usa `qaRunners` quando un Plugin contribuisce con uno o più runner di trasporto sotto
la root condivisa `openclaw qa`. Mantieni questi metadati economici e statici; il runtime del Plugin
continua a possedere l'effettiva registrazione CLI tramite una superficie leggera
`runtime-api.ts` che esporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Esegui la corsia QA live Matrix supportata da Docker su un homeserver usa e getta"
    }
  ]
}
```

| Campo         | Obbligatorio | Tipo     | Significato                                                           |
| ------------- | ------------ | -------- | --------------------------------------------------------------------- |
| `commandName` | Sì           | `string` | Sottocomando montato sotto `openclaw qa`, ad esempio `matrix`.        |
| `description` | No           | `string` | Testo guida di fallback usato quando l'host condiviso ha bisogno di un comando stub. |

Questo blocco contiene solo metadati. Non registra il comportamento di runtime e non
sostituisce `register(...)`, `setupEntry` o altri entrypoint di runtime/Plugin.
I consumer attuali lo usano come suggerimento di restringimento prima di un caricamento più ampio del Plugin, quindi
l'assenza di metadati di attivazione di solito comporta solo un costo in termini di prestazioni; non dovrebbe
modificare la correttezza finché esistono ancora i fallback legacy di proprietà del manifest.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Campo            | Obbligatorio | Tipo                                                 | Significato                                                           |
| ---------------- | ------------ | ---------------------------------------------------- | --------------------------------------------------------------------- |
| `onProviders`    | No           | `string[]`                                           | ID dei provider che devono attivare questo Plugin quando richiesti.   |
| `onCommands`     | No           | `string[]`                                           | ID dei comandi che devono attivare questo Plugin.                     |
| `onChannels`     | No           | `string[]`                                           | ID dei canali che devono attivare questo Plugin.                      |
| `onRoutes`       | No           | `string[]`                                           | Tipi di route che devono attivare questo Plugin.                      |
| `onCapabilities` | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Suggerimenti generali di capability usati dalla pianificazione di attivazione del control plane. |

Consumer live attuali:

- la pianificazione CLI attivata da comandi usa come fallback
  `commandAliases[].cliCommand` o `commandAliases[].name` legacy
- la pianificazione setup/canale attivata da canali usa come fallback la proprietà
  legacy `channels[]` quando mancano metadati espliciti di attivazione del canale
- la pianificazione setup/runtime attivata da provider usa come fallback la proprietà
  legacy `providers[]` e `cliBackends[]` di primo livello quando mancano metadati espliciti
  di attivazione del provider

## Riferimento `setup`

Usa `setup` quando le superfici di setup e onboarding hanno bisogno di metadati economici posseduti dal Plugin
prima che il runtime venga caricato.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

`cliBackends` di primo livello rimane valido e continua a descrivere i
backend di inferenza CLI. `setup.cliBackends` è la superficie descrittiva specifica del setup per
i flussi di control plane/setup che devono restare solo metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie di ricerca preferita,
basata prima sui descrittori, per la discovery del setup. Se il descrittore restringe solo il Plugin candidato e il setup
ha comunque bisogno di hook di runtime più ricchi in fase di setup,
imposta `requiresRuntime: true` e mantieni `setup-api` come
percorso di esecuzione di fallback.

Poiché la ricerca del setup può eseguire codice `setup-api` posseduto dal Plugin,
i valori normalizzati di `setup.providers[].id` e `setup.cliBackends[]` devono restare univoci tra tutti i
Plugin rilevati. La proprietà ambigua fallisce in modo chiuso invece di scegliere un vincitore
in base all'ordine di discovery.

### Riferimento `setup.providers`

| Campo         | Obbligatorio | Tipo       | Significato                                                                                 |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------------- |
| `id`          | Sì           | `string`   | ID del provider esposto durante setup o onboarding. Mantieni gli ID normalizzati univoci globalmente. |
| `authMethods` | No           | `string[]` | ID dei metodi di setup/auth supportati da questo provider senza caricare il runtime completo. |
| `envVars`     | No           | `string[]` | Variabili env che le superfici generiche di setup/stato possono controllare prima che il runtime del Plugin venga caricato. |

### Campi `setup`

| Campo              | Obbligatorio | Tipo       | Significato                                                                                      |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | No           | `object[]` | Descrittori di setup del provider esposti durante setup e onboarding.                            |
| `cliBackends`      | No           | `string[]` | ID dei backend usati in fase di setup per la ricerca basata prima sui descrittori. Mantieni gli ID normalizzati univoci globalmente. |
| `configMigrations` | No           | `string[]` | ID delle migrazioni di configurazione possedute dalla superficie di setup di questo Plugin.      |
| `requiresRuntime`  | No           | `boolean`  | Se il setup richiede ancora l'esecuzione di `setup-api` dopo la ricerca del descrittore.         |

## Riferimento `uiHints`

`uiHints` è una mappa dai nomi dei campi di configurazione a piccoli suggerimenti di rendering.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Chiave API",
      "help": "Usata per le richieste OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Ogni suggerimento di campo può includere:

| Campo         | Tipo       | Significato                              |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Etichetta del campo visibile all'utente. |
| `help`        | `string`   | Breve testo di supporto.                 |
| `tags`        | `string[]` | Tag UI opzionali.                        |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.     |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per i campi del modulo. |

## Riferimento `contracts`

Usa `contracts` solo per metadati statici di proprietà delle capability che OpenClaw può
leggere senza importare il runtime del Plugin.

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Ogni elenco è facoltativo:

| Campo                            | Tipo       | Significato                                                       |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `speechProviders`                | `string[]` | ID dei provider speech posseduti da questo Plugin.                |
| `realtimeTranscriptionProviders` | `string[]` | ID dei provider di trascrizione realtime posseduti da questo Plugin. |
| `realtimeVoiceProviders`         | `string[]` | ID dei provider di voce realtime posseduti da questo Plugin.      |
| `mediaUnderstandingProviders`    | `string[]` | ID dei provider media-understanding posseduti da questo Plugin.   |
| `imageGenerationProviders`       | `string[]` | ID dei provider di generazione immagini posseduti da questo Plugin. |
| `videoGenerationProviders`       | `string[]` | ID dei provider di generazione video posseduti da questo Plugin.  |
| `webFetchProviders`              | `string[]` | ID dei provider web-fetch posseduti da questo Plugin.             |
| `webSearchProviders`             | `string[]` | ID dei provider di ricerca web posseduti da questo Plugin.        |
| `tools`                          | `string[]` | Nomi dei tool dell'agente posseduti da questo Plugin per i controlli dei contratti bundle. |

## Riferimento `channelConfigs`

Usa `channelConfigs` quando un Plugin di canale ha bisogno di metadati di configurazione economici prima
che il runtime venga caricato.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "URL dell'homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Connessione all'homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Ogni voce del canale può includere:

| Campo         | Tipo                     | Significato                                                                                 |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schema JSON per `channels.<id>`. Obbligatorio per ogni voce dichiarata di configurazione del canale. |
| `uiHints`     | `Record<string, object>` | Etichette UI/segnaposto/suggerimenti di sensibilità opzionali per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita nelle superfici di selezione e ispezione quando i metadati di runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                     |
| `preferOver`  | `string[]`               | ID di Plugin legacy o a priorità inferiore che questo canale deve superare nelle superfici di selezione. |

## Riferimento `modelSupport`

Usa `modelSupport` quando OpenClaw deve dedurre il tuo Plugin provider da
ID abbreviati di modello come `gpt-5.4` o `claude-sonnet-4.6` prima che il runtime del Plugin
venga caricato.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw applica questa precedenza:

- i riferimenti espliciti `provider/model` usano i metadati del manifest `providers` proprietario
- `modelPatterns` ha precedenza su `modelPrefixes`
- se corrispondono sia un Plugin non bundle sia un Plugin bundle, vince il Plugin
  non bundle
- l'ambiguità rimanente viene ignorata finché l'utente o la configurazione non specificano un provider

Campi:

| Campo           | Tipo       | Significato                                                                 |
| --------------- | ---------- | --------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli ID abbreviati dei modelli. |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate con gli ID abbreviati dei modelli dopo la rimozione del suffisso del profilo. |

Le chiavi legacy di capability di primo livello sono deprecate. Usa `openclaw doctor --fix` per
spostare `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale
caricamento del manifest non tratta più quei campi di primo livello come
proprietà di capability.

## Manifest rispetto a package.json

I due file svolgono compiti diversi:

| File                   | Usalo per                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validazione della configurazione, metadati delle scelte di autenticazione e suggerimenti UI che devono esistere prima dell'esecuzione del codice del Plugin |
| `package.json`         | Metadati npm, installazione delle dipendenze e il blocco `openclaw` usato per entrypoint, controllo dell'installazione, setup o metadati di catalogo |

Se non sei sicuro di dove appartenga un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del Plugin, inseriscilo in `openclaw.plugin.json`
- se riguarda packaging, file di entry o comportamento dell'installazione npm, inseriscilo in `package.json`

### Campi `package.json` che influiscono sulla discovery

Alcuni metadati del Plugin pre-runtime vivono intenzionalmente in `package.json` sotto il blocco
`openclaw` invece che in `openclaw.plugin.json`.

Esempi importanti:

| Campo                                                             | Significato                                                                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Dichiara gli entrypoint dei Plugin nativi.                                                                                                 |
| `openclaw.setupEntry`                                             | Entry point leggero solo per il setup usato durante onboarding e avvio differito del canale.                                              |
| `openclaw.channel`                                                | Metadati economici del catalogo dei canali come etichette, percorsi della documentazione, alias e testo di selezione.                    |
| `openclaw.channel.configuredState`                                | Metadati leggeri del controllore dello stato configurato che possono rispondere a "esiste già una configurazione solo env?" senza caricare il runtime completo del canale. |
| `openclaw.channel.persistedAuthState`                             | Metadati leggeri del controllore dello stato auth persistito che possono rispondere a "esiste già qualcosa con accesso effettuato?" senza caricare il runtime completo del canale. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Suggerimenti di installazione/aggiornamento per Plugin bundle e pubblicati esternamente.                                                  |
| `openclaw.install.defaultChoice`                                  | Percorso di installazione preferito quando sono disponibili più origini di installazione.                                                 |
| `openclaw.install.minHostVersion`                                 | Versione minima supportata dell'host OpenClaw, usando un floor semver come `>=2026.3.22`.                                                 |
| `openclaw.install.allowInvalidConfigRecovery`                     | Consente un percorso ristretto di recupero della reinstallazione di Plugin bundle quando la configurazione non è valida.                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Consente il caricamento delle superfici del canale solo setup prima del Plugin di canale completo durante l'avvio.                       |

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il
caricamento del registro dei manifest. I valori non validi vengono rifiutati; i valori
più recenti ma validi saltano il Plugin sugli host più vecchi.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente ristretto. Non
rende installabili configurazioni arbitrarie non funzionanti. Oggi consente solo ai flussi di installazione
di recuperare da specifici errori di upgrade obsoleti di Plugin bundle, come un
percorso mancante del Plugin bundle o una voce `channels.<id>` obsoleta per quello stesso
Plugin bundle. Errori di configurazione non correlati continuano a bloccare l'installazione e indirizzano gli operatori
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` è un metadato di package per un piccolo
modulo di controllo:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Usalo quando i flussi di setup, doctor o stato configurato hanno bisogno di una
verifica auth economica sì/no prima che il Plugin di canale completo venga caricato. L'export di destinazione deve essere una piccola
funzione che legge solo lo stato persistito; non instradarla attraverso il barrel di runtime
completo del canale.

`openclaw.channel.configuredState` segue la stessa forma per controlli economici
dello stato configurato solo env:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Usalo quando un canale può rispondere sullo stato configurato da env o da altri
piccoli input non di runtime. Se il controllo richiede la risoluzione completa della configurazione o il vero
runtime del canale, mantieni invece quella logica nell'hook `config.hasConfiguredState`
del Plugin.

## Requisiti dello schema JSON

- **Ogni Plugin deve distribuire uno schema JSON**, anche se non accetta alcuna configurazione.
- È accettabile uno schema vuoto, ad esempio `{ "type": "object", "additionalProperties": false }`.
- Gli schemi vengono validati in fase di lettura/scrittura della configurazione, non in fase di runtime.

## Comportamento della validazione

- Le chiavi `channels.*` sconosciute sono **errori**, a meno che l'ID del canale non sia dichiarato da
  un manifest del Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono fare riferimento a ID di Plugin **rilevabili**. Gli ID sconosciuti sono **errori**.
- Se un Plugin è installato ma ha un manifest o uno schema mancante o non valido,
  la validazione fallisce e Doctor segnala l'errore del Plugin.
- Se la configurazione del Plugin esiste ma il Plugin è **disabilitato**, la configurazione viene mantenuta e
  viene mostrato un **avviso** in Doctor + nei log.

Vedi [Riferimento della configurazione](/it/gateway/configuration) per lo schema completo `plugins.*`.

## Note

- Il manifest è **obbligatorio per i Plugin OpenClaw nativi**, inclusi i caricamenti locali dal filesystem.
- Il runtime carica comunque separatamente il modulo del Plugin; il manifest serve solo per
  discovery + validazione.
- I manifest nativi vengono analizzati con JSON5, quindi commenti, virgole finali e
  chiavi non tra virgolette sono accettati purché il valore finale sia comunque un oggetto.
- Solo i campi del manifest documentati vengono letti dal loader del manifest. Evita di aggiungere
  qui chiavi personalizzate di primo livello.
- `providerAuthEnvVars` è il percorso di metadati economico per probe auth, validazione
  dei marker env e superfici simili di autenticazione del provider che non devono avviare il runtime del Plugin
  solo per ispezionare i nomi env.
- `providerAuthAliases` consente alle varianti del provider di riutilizzare le variabili env di auth,
  i profili auth, l'autenticazione supportata dalla configurazione e la scelta di onboarding della chiave API
  di un altro provider senza codificare rigidamente questa relazione nel core.
- `channelEnvVars` è il percorso di metadati economico per fallback shell-env, prompt
  di setup e superfici simili del canale che non devono avviare il runtime del Plugin
  solo per ispezionare i nomi env.
- `providerAuthChoices` è il percorso di metadati economico per selettori di scelta auth,
  risoluzione di `--auth-choice`, mappatura del provider preferito e semplice registrazione
  dei flag CLI di onboarding prima che il runtime del provider venga caricato. Per i metadati della procedura guidata di runtime
  che richiedono codice del provider, vedi
  [Hook di runtime del provider](/it/plugins/architecture#provider-runtime-hooks).
- I tipi esclusivi di Plugin vengono selezionati tramite `plugins.slots.*`.
  - `kind: "memory"` viene selezionato da `plugins.slots.memory`.
  - `kind: "context-engine"` viene selezionato da `plugins.slots.contextEngine`
    (predefinito: `legacy` integrato).
- `channels`, `providers`, `cliBackends` e `skills` possono essere omessi quando un
  Plugin non ne ha bisogno.
- Se il tuo Plugin dipende da moduli nativi, documenta i passaggi di build e qualsiasi
  requisito di allowlist del package manager (ad esempio, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins) — introduzione ai Plugin
- [Architettura dei Plugin](/it/plugins/architecture) — architettura interna
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — riferimento dell'SDK del Plugin
