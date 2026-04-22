---
read_when:
    - Stai creando un Plugin OpenClaw
    - Devi distribuire uno schema di configurazione del Plugin o eseguire il debug degli errori di validazione del Plugin
summary: Manifest del Plugin + requisiti dello schema JSON (validazione rigorosa della configurazione)
title: Manifest del Plugin
x-i18n:
    generated_at: "2026-04-22T04:24:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52a52f7e2c78bbef2cc51ade6eb12b6edc950237bdfc478f6e82248374c687bf
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest del Plugin (`openclaw.plugin.json`)

Questa pagina riguarda solo il **manifest nativo del Plugin OpenClaw**.

Per i layout bundle compatibili, vedi [Plugin bundles](/it/plugins/bundles).

I formati bundle compatibili usano file manifest diversi:

- bundle Codex: `.codex-plugin/plugin.json`
- bundle Claude: `.claude-plugin/plugin.json` o il layout predefinito del componente Claude
  senza manifest
- bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche questi layout bundle, ma non vengono validati
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw al momento legge i metadati del bundle più le root skill
dichiarate, le root dei comandi Claude, i valori predefiniti `settings.json` del bundle Claude,
i valori predefiniti LSP del bundle Claude e i pacchetti hook supportati quando il layout corrisponde
alle aspettative runtime di OpenClaw.

Ogni Plugin OpenClaw nativo **deve** distribuire un file `openclaw.plugin.json` nella
**root del Plugin**. OpenClaw usa questo manifest per validare la configurazione
**senza eseguire codice del Plugin**. I manifest mancanti o non validi vengono trattati come
errori del Plugin e bloccano la validazione della configurazione.

Vedi la guida completa al sistema Plugin: [Plugins](/it/tools/plugin).
Per il modello di capability nativo e le indicazioni attuali sulla compatibilità esterna:
[Capability model](/it/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` è il metadato che OpenClaw legge prima di caricare il codice
del tuo Plugin.

Usalo per:

- identità del Plugin
- validazione della configurazione
- metadati di autenticazione e onboarding che devono essere disponibili senza avviare il runtime del Plugin
- hint di attivazione economici che le superfici del control plane possono ispezionare prima che il runtime venga caricato
- descrittori di configurazione economici che le superfici di setup/onboarding possono ispezionare prima che il runtime venga caricato
- metadati di alias e auto-enable che devono essere risolti prima che il runtime del Plugin venga caricato
- metadati shorthand di proprietà della famiglia di modelli che devono auto-attivare il
  Plugin prima che il runtime venga caricato
- snapshot statici di proprietà delle capability usati per il wiring di compatibilità dei plugin inclusi e
  per la copertura dei contratti
- metadati economici del runner QA che l'host condiviso `openclaw qa` può ispezionare
  prima che il runtime del Plugin venga caricato
- metadati di configurazione specifici del canale che devono fondersi nelle superfici di catalogo e validazione
  senza caricare il runtime
- hint UI della configurazione

Non usarlo per:

- registrare il comportamento runtime
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

## Esempio avanzato

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
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
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
| `id`                                | Sì           | `string`                         | ID canonico del Plugin. È l'ID usato in `plugins.entries.<id>`.                                                                                                                                              |
| `configSchema`                      | Sì           | `object`                         | JSON Schema inline per la configurazione di questo Plugin.                                                                                                                                                    |
| `enabledByDefault`                  | No           | `true`                           | Contrassegna un Plugin incluso come abilitato per impostazione predefinita. Omettilo, oppure imposta qualsiasi valore diverso da `true`, per lasciare il Plugin disabilitato per impostazione predefinita. |
| `legacyPluginIds`                   | No           | `string[]`                       | ID legacy che vengono normalizzati a questo ID canonico del Plugin.                                                                                                                                          |
| `autoEnableWhenConfiguredProviders` | No           | `string[]`                       | ID provider che devono abilitare automaticamente questo Plugin quando autenticazione, configurazione o riferimenti ai modelli li menzionano.                                                                |
| `kind`                              | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo esclusivo di Plugin usato da `plugins.slots.*`.                                                                                                                                             |
| `channels`                          | No           | `string[]`                       | ID canale posseduti da questo Plugin. Usati per discovery e validazione della configurazione.                                                                                                                |
| `providers`                         | No           | `string[]`                       | ID provider posseduti da questo Plugin.                                                                                                                                                                      |
| `modelSupport`                      | No           | `object`                         | Metadati shorthand della famiglia di modelli posseduti dal manifest usati per auto-caricare il Plugin prima del runtime.                                                                                    |
| `providerEndpoints`                 | No           | `object[]`                       | Metadati di host/baseUrl degli endpoint posseduti dal manifest per route provider che il core deve classificare prima che il runtime del provider venga caricato.                                           |
| `cliBackends`                       | No           | `string[]`                       | ID backend CLI inference posseduti da questo Plugin. Usati per l'auto-attivazione all'avvio da riferimenti espliciti di configurazione.                                                                    |
| `syntheticAuthRefs`                 | No           | `string[]`                       | Riferimenti provider o backend CLI il cui hook di autenticazione sintetica posseduto dal Plugin deve essere sondata durante la discovery a freddo dei modelli prima che il runtime venga caricato.       |
| `nonSecretAuthMarkers`              | No           | `string[]`                       | Valori placeholder di chiave API posseduti dal Plugin incluso che rappresentano stato di credenziali locali, OAuth o ambient non segrete.                                                                  |
| `commandAliases`                    | No           | `object[]`                       | Nomi di comando posseduti da questo Plugin che devono produrre diagnostica consapevole del Plugin nella configurazione e nella CLI prima che il runtime venga caricato.                                    |
| `providerAuthEnvVars`               | No           | `Record<string, string[]>`       | Metadati env a basso costo per l'autenticazione del provider che OpenClaw può ispezionare senza caricare il codice del Plugin.                                                                              |
| `providerAuthAliases`               | No           | `Record<string, string>`         | ID provider che devono riutilizzare un altro ID provider per la ricerca dell'autenticazione, ad esempio un provider coding che condivide la chiave API del provider base e i profili di autenticazione.   |
| `channelEnvVars`                    | No           | `Record<string, string[]>`       | Metadati env a basso costo del canale che OpenClaw può ispezionare senza caricare il codice del Plugin. Usalo per superfici di setup o autenticazione del canale guidate da env che helper generici di avvio/config dovrebbero vedere. |
| `providerAuthChoices`               | No           | `object[]`                       | Metadati di scelta di autenticazione a basso costo per picker di onboarding, risoluzione del provider preferito e semplice wiring dei flag CLI.                                                            |
| `activation`                        | No           | `object`                         | Hint di attivazione a basso costo per caricamento attivato da provider, comando, canale, route e capability. Solo metadati; il runtime del Plugin resta proprietario del comportamento reale.            |
| `setup`                             | No           | `object`                         | Descrittori di setup/onboarding a basso costo che superfici di discovery e setup possono ispezionare senza caricare il runtime del Plugin.                                                                 |
| `qaRunners`                         | No           | `object[]`                       | Descrittori di runner QA a basso costo usati dall'host condiviso `openclaw qa` prima che il runtime del Plugin venga caricato.                                                                             |
| `contracts`                         | No           | `object`                         | Snapshot statico di capability del plugin incluso per speech, trascrizione realtime, voce realtime, comprensione dei contenuti multimediali, generazione di immagini, generazione musicale, generazione video, web-fetch, ricerca web e proprietà dei tool. |
| `channelConfigs`                    | No           | `Record<string, object>`         | Metadati di configurazione del canale posseduti dal manifest uniti alle superfici di discovery e validazione prima che il runtime venga caricato.                                                          |
| `skills`                            | No           | `string[]`                       | Directory Skills da caricare, relative alla root del Plugin.                                                                                                                                                |
| `name`                              | No           | `string`                         | Nome del Plugin leggibile dall'utente.                                                                                                                                                                      |
| `description`                       | No           | `string`                         | Breve riepilogo mostrato nelle superfici del Plugin.                                                                                                                                                        |
| `version`                           | No           | `string`                         | Versione informativa del Plugin.                                                                                                                                                                            |
| `uiHints`                           | No           | `Record<string, object>`         | Etichette UI, placeholder e hint di sensibilità per i campi di configurazione.                                                                                                                              |

## Riferimento `providerAuthChoices`

Ogni voce `providerAuthChoices` descrive una singola scelta di onboarding o autenticazione.
OpenClaw la legge prima che il runtime del provider venga caricato.

| Campo                 | Obbligatorio | Tipo                                            | Significato                                                                                              |
| --------------------- | ------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                        | ID del provider a cui appartiene questa scelta.                                                          |
| `method`              | Sì           | `string`                                        | ID del metodo di autenticazione a cui fare dispatch.                                                     |
| `choiceId`            | Sì           | `string`                                        | ID stabile della scelta di autenticazione usato dai flussi di onboarding e CLI.                         |
| `choiceLabel`         | No           | `string`                                        | Etichetta rivolta all'utente. Se omessa, OpenClaw usa `choiceId` come fallback.                         |
| `choiceHint`          | No           | `string`                                        | Breve testo di aiuto per il picker.                                                                      |
| `assistantPriority`   | No           | `number`                                        | I valori più bassi vengono ordinati prima nei picker interattivi guidati dall'assistant.                |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai picker dell'assistant pur consentendo ancora la selezione manuale da CLI.        |
| `deprecatedChoiceIds` | No           | `string[]`                                      | ID legacy della scelta che devono reindirizzare gli utenti a questa scelta sostitutiva.                 |
| `groupId`             | No           | `string`                                        | ID gruppo facoltativo per raggruppare scelte correlate.                                                  |
| `groupLabel`          | No           | `string`                                        | Etichetta rivolta all'utente per quel gruppo.                                                            |
| `groupHint`           | No           | `string`                                        | Breve testo di aiuto per il gruppo.                                                                      |
| `optionKey`           | No           | `string`                                        | Chiave opzione interna per semplici flussi di autenticazione con un solo flag.                          |
| `cliFlag`             | No           | `string`                                        | Nome del flag CLI, come `--openrouter-api-key`.                                                          |
| `cliOption`           | No           | `string`                                        | Forma completa dell'opzione CLI, come `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nell'help della CLI.                                                                   |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation">` | In quali superfici di onboarding deve comparire questa scelta. Se omesso, il valore predefinito è `["text-inference"]`. |

## Riferimento `commandAliases`

Usa `commandAliases` quando un Plugin possiede un nome di comando runtime che gli utenti potrebbero
inserire erroneamente in `plugins.allow` o provare a eseguire come comando CLI root. OpenClaw
usa questi metadati per la diagnostica senza importare il codice runtime del Plugin.

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

| Campo        | Obbligatorio | Tipo              | Significato                                                              |
| ------------ | ------------ | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Sì           | `string`          | Nome del comando che appartiene a questo Plugin.                         |
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash della chat invece che comando CLI root. |
| `cliCommand` | No           | `string`          | Comando CLI root correlato da suggerire per operazioni CLI, se esiste.   |

## Riferimento `activation`

Usa `activation` quando il Plugin può dichiarare in modo economico quali eventi del control plane
dovrebbero attivarlo in seguito.

## Riferimento `qaRunners`

Usa `qaRunners` quando un Plugin contribuisce con uno o più transport runner sotto
la root condivisa `openclaw qa`. Mantieni questi metadati economici e statici; il runtime del Plugin
resta proprietario dell'effettiva registrazione CLI tramite una superficie leggera
`runtime-api.ts` che esporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Esegue la lane QA live Matrix supportata da Docker contro un homeserver usa e getta"
    }
  ]
}
```

| Campo         | Obbligatorio | Tipo     | Significato                                                     |
| ------------- | ------------ | -------- | --------------------------------------------------------------- |
| `commandName` | Sì           | `string` | Sottocomando montato sotto `openclaw qa`, ad esempio `matrix`.  |
| `description` | No           | `string` | Testo di help di fallback usato quando l'host condiviso ha bisogno di un comando stub. |

Questo blocco contiene solo metadati. Non registra comportamento runtime e non
sostituisce `register(...)`, `setupEntry` o altri entrypoint runtime/Plugin.
Gli attuali consumer lo usano come hint di restringimento prima di un caricamento più ampio del Plugin, quindi
metadati di attivazione mancanti di solito comportano solo un costo in termini di prestazioni; non dovrebbero
cambiare la correttezza finché esistono ancora i fallback legacy di proprietà del manifest.

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

| Campo            | Obbligatorio | Tipo                                                 | Significato                                                    |
| ---------------- | ------------ | ---------------------------------------------------- | -------------------------------------------------------------- |
| `onProviders`    | No           | `string[]`                                           | ID provider che devono attivare questo Plugin quando richiesti. |
| `onCommands`     | No           | `string[]`                                           | ID comando che devono attivare questo Plugin.                  |
| `onChannels`     | No           | `string[]`                                           | ID canale che devono attivare questo Plugin.                   |
| `onRoutes`       | No           | `string[]`                                           | Tipi di route che devono attivare questo Plugin.               |
| `onCapabilities` | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Hint ampi di capability usati dalla pianificazione di attivazione del control plane. |

Consumer live attuali:

- la pianificazione CLI attivata da comando fa fallback ai legacy
  `commandAliases[].cliCommand` oppure `commandAliases[].name`
- la pianificazione di setup/canale attivata da canale fa fallback alla proprietà legacy `channels[]`
  quando mancano metadati espliciti di attivazione del canale
- la pianificazione di setup/runtime attivata da provider fa fallback alla proprietà legacy
  `providers[]` e a `cliBackends[]` di primo livello quando mancano metadati espliciti
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

`cliBackends` di primo livello resta valido e continua a descrivere i backend CLI inference.
`setup.cliBackends` è la superficie descrittiva specifica del setup per
i flussi di control plane/setup che devono restare solo metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie preferita
descriptor-first per la discovery del setup. Se il descrittore restringe solo il Plugin candidato e il setup ha ancora bisogno di hook runtime più ricchi al momento del setup,
imposta `requiresRuntime: true` e mantieni `setup-api` come
percorso di esecuzione di fallback.

Poiché la ricerca del setup può eseguire codice `setup-api` posseduto dal Plugin, i valori normalizzati
`setup.providers[].id` e `setup.cliBackends[]` devono restare univoci tra
i Plugin rilevati. La proprietà ambigua fallisce in modo fail-closed invece di scegliere un
vincitore in base all'ordine di discovery.

### Riferimento `setup.providers`

| Campo         | Obbligatorio | Tipo       | Significato                                                                       |
| ------------- | ------------ | ---------- | --------------------------------------------------------------------------------- |
| `id`          | Sì           | `string`   | ID provider esposto durante setup o onboarding. Mantieni gli ID normalizzati globalmente univoci. |
| `authMethods` | No           | `string[]` | ID dei metodi di setup/autenticazione che questo provider supporta senza caricare il runtime completo. |
| `envVars`     | No           | `string[]` | Variabili d'ambiente che le superfici generiche di setup/stato possono controllare prima che il runtime del Plugin venga caricato. |

### Campi `setup`

| Campo              | Obbligatorio | Tipo       | Significato                                                                                      |
| ------------------ | ------------ | ---------- | ------------------------------------------------------------------------------------------------ |
| `providers`        | No           | `object[]` | Descrittori di setup del provider esposti durante setup e onboarding.                            |
| `cliBackends`      | No           | `string[]` | ID backend al momento del setup usati per la ricerca descriptor-first del setup. Mantieni gli ID normalizzati globalmente univoci. |
| `configMigrations` | No           | `string[]` | ID di migrazione della configurazione posseduti dalla superficie setup di questo Plugin.         |
| `requiresRuntime`  | No           | `boolean`  | Se il setup ha ancora bisogno dell'esecuzione di `setup-api` dopo la ricerca del descrittore.   |

## Riferimento `uiHints`

`uiHints` è una mappa dai nomi dei campi di configurazione a piccoli hint di rendering.

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

Ogni hint di campo può includere:

| Campo         | Tipo       | Significato                              |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Etichetta del campo rivolta all'utente.  |
| `help`        | `string`   | Breve testo di aiuto.                    |
| `tags`        | `string[]` | Tag UI facoltativi.                      |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.     |
| `sensitive`   | `boolean`  | Contrassegna il campo come secret o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per gli input del modulo. |

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

| Campo                            | Tipo       | Significato                                                  |
| -------------------------------- | ---------- | ------------------------------------------------------------ |
| `speechProviders`                | `string[]` | ID provider speech posseduti da questo Plugin.               |
| `realtimeTranscriptionProviders` | `string[]` | ID provider di trascrizione realtime posseduti da questo Plugin. |
| `realtimeVoiceProviders`         | `string[]` | ID provider di voce realtime posseduti da questo Plugin.     |
| `mediaUnderstandingProviders`    | `string[]` | ID provider di comprensione dei contenuti multimediali posseduti da questo Plugin. |
| `imageGenerationProviders`       | `string[]` | ID provider di generazione immagini posseduti da questo Plugin. |
| `videoGenerationProviders`       | `string[]` | ID provider di generazione video posseduti da questo Plugin. |
| `webFetchProviders`              | `string[]` | ID provider web-fetch posseduti da questo Plugin.            |
| `webSearchProviders`             | `string[]` | ID provider di ricerca web posseduti da questo Plugin.       |
| `tools`                          | `string[]` | Nomi dei tool agent posseduti da questo Plugin per i controlli di contratto dei plugin inclusi. |

## Riferimento `channelConfigs`

Usa `channelConfigs` quando un plugin di canale ha bisogno di metadati di configurazione economici prima
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

Ogni voce canale può includere:

| Campo         | Tipo                     | Significato                                                                            |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema per `channels.<id>`. Obbligatorio per ogni voce di configurazione canale dichiarata. |
| `uiHints`     | `Record<string, object>` | Etichette UI/placeholder/hint di sensibilità facoltativi per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita alle superfici di picker e inspect quando i metadati runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici inspect e catalogo.                      |
| `preferOver`  | `string[]`               | ID Plugin legacy o di priorità inferiore che questo canale deve superare nelle superfici di selezione. |

## Riferimento `modelSupport`

Usa `modelSupport` quando OpenClaw deve dedurre il tuo Plugin provider da
ID di modello shorthand come `gpt-5.4` o `claude-sonnet-4.6` prima che il runtime del Plugin
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

- i riferimenti espliciti `provider/model` usano i metadati `providers` del manifest proprietario
- `modelPatterns` hanno precedenza su `modelPrefixes`
- se un Plugin non incluso e un Plugin incluso corrispondono entrambi, vince il Plugin
  non incluso
- l'ambiguità rimanente viene ignorata finché l'utente o la configurazione non specificano un provider

Campi:

| Campo           | Tipo       | Significato                                                                  |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` sugli ID di modello shorthand.         |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate sugli ID di modello shorthand dopo la rimozione del suffisso del profilo. |

Le chiavi legacy di capability di primo livello sono deprecate. Usa `openclaw doctor --fix` per
spostare `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale
caricamento del manifest non tratta più quei campi di primo livello come
proprietà di capability.

## Manifest rispetto a `package.json`

I due file svolgono compiti diversi:

| File                   | Usalo per                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validazione della configurazione, metadati della scelta di autenticazione e hint UI che devono esistere prima che il codice del Plugin venga eseguito |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per entrypoint, gating di installazione, setup o metadati di catalogo |

Se non sei sicuro di dove appartenga un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del Plugin, mettilo in `openclaw.plugin.json`
- se riguarda packaging, file di entry o comportamento di installazione npm, mettilo in `package.json`

### Campi `package.json` che influenzano la discovery

Alcuni metadati del Plugin pre-runtime vivono intenzionalmente in `package.json` sotto il blocco
`openclaw` invece che in `openclaw.plugin.json`.

Esempi importanti:

| Campo                                                             | Significato                                                                                                                                                                       |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Dichiara gli entrypoint nativi del Plugin. Deve restare dentro la directory del pacchetto del Plugin.                                                                            |
| `openclaw.runtimeExtensions`                                      | Dichiara gli entrypoint runtime JavaScript buildati per i pacchetti installati. Deve restare dentro la directory del pacchetto del Plugin.                                     |
| `openclaw.setupEntry`                                             | Entry point leggero solo-setup usato durante onboarding, avvio canale differito e discovery di stato canale/SecretRef in sola lettura. Deve restare dentro la directory del pacchetto del Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Dichiara l'entrypoint setup JavaScript buildato per i pacchetti installati. Deve restare dentro la directory del pacchetto del Plugin.                                         |
| `openclaw.channel`                                                | Metadati economici del catalogo canale come etichette, percorsi docs, alias e testo di selezione.                                                                               |
| `openclaw.channel.configuredState`                                | Metadati leggeri del controllo dello stato configurato che possono rispondere a "esiste già una configurazione solo-env?" senza caricare il runtime completo del canale.       |
| `openclaw.channel.persistedAuthState`                             | Metadati leggeri del controllo dello stato di autenticazione persistito che possono rispondere a "qualcosa è già autenticato?" senza caricare il runtime completo del canale.  |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Hint di installazione/aggiornamento per Plugin inclusi e pubblicati esternamente.                                                                                                |
| `openclaw.install.defaultChoice`                                  | Percorso di installazione preferito quando sono disponibili più sorgenti di installazione.                                                                                       |
| `openclaw.install.minHostVersion`                                 | Versione minima supportata dell'host OpenClaw, usando una soglia semver come `>=2026.3.22`.                                                                                      |
| `openclaw.install.allowInvalidConfigRecovery`                     | Consente un ristretto percorso di recupero di reinstallazione del Plugin incluso quando la configurazione non è valida.                                                          |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Consente alle superfici del canale solo-setup di caricarsi prima del plugin di canale completo durante l'avvio.                                                                 |

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il
caricamento del registro dei manifest. I valori non validi vengono rifiutati; i valori
validi ma più recenti saltano il Plugin su host più vecchi.

I plugin di canale dovrebbero fornire `openclaw.setupEntry` quando stato, elenco canali
o scansioni SecretRef devono identificare gli account configurati senza caricare il runtime completo.
L'entrypoint di setup dovrebbe esporre metadati del canale più adattatori sicuri per setup di configurazione,
stato e secret; mantieni client di rete, listener del gateway e runtime di trasporto
nell'entrypoint principale dell'extension.

I campi di entrypoint runtime non sovrascrivono i controlli dei confini del pacchetto per i campi
di entrypoint sorgente. Ad esempio, `openclaw.runtimeExtensions` non può rendere caricabile un
percorso `openclaw.extensions` che esce dai confini.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente ristretto. Non
rende installabili configurazioni arbitrarie non funzionanti. Oggi consente solo ai flussi di installazione di recuperare da specifici errori di aggiornamento stantii del Plugin incluso, come un
percorso del Plugin incluso mancante o una voce `channels.<id>` obsoleta per quello stesso
Plugin incluso. Errori di configurazione non correlati continuano a bloccare l'installazione e indirizzano gli operatori
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` è un metadato di pacchetto per un piccolo
modulo checker:

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

Usalo quando i flussi di setup, doctor o stato configurato hanno bisogno di un probe economico yes/no
sull'autenticazione prima che il plugin di canale completo venga caricato. L'export di destinazione dovrebbe essere una piccola
funzione che legge solo lo stato persistito; non instradarla attraverso il barrel runtime completo
del canale.

`openclaw.channel.configuredState` segue la stessa forma per controlli economici
dello stato configurato solo-env:

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

Usalo quando un canale può rispondere allo stato configurato da env o da altri piccoli
input non-runtime. Se il controllo richiede la risoluzione completa della configurazione o il reale
runtime del canale, mantieni quella logica nell'hook `config.hasConfiguredState` del Plugin.

## Precedenza della discovery (ID Plugin duplicati)

OpenClaw rileva i Plugin da diverse root (inclusi, installazione globale, workspace, percorsi espliciti selezionati dalla configurazione). Se due discovery condividono lo stesso `id`, viene mantenuto solo il manifest con **precedenza più alta**; i duplicati con precedenza inferiore vengono scartati invece di essere caricati accanto.

Precedenza, dalla più alta alla più bassa:

1. **Selezionato dalla configurazione** — un percorso fissato esplicitamente in `plugins.entries.<id>`
2. **Incluso** — Plugin distribuiti con OpenClaw
3. **Installazione globale** — Plugin installati nella root globale dei Plugin OpenClaw
4. **Workspace** — Plugin rilevati relativamente al workspace corrente

Implicazioni:

- Una copia forkata o obsoleta di un Plugin incluso presente nel workspace non sovrascriverà la build inclusa.
- Per sovrascrivere davvero un Plugin incluso con uno locale, fissalo tramite `plugins.entries.<id>` in modo che vinca per precedenza invece di affidarti alla discovery del workspace.
- Gli scarti dei duplicati vengono registrati nei log così Doctor e la diagnostica di avvio possono puntare alla copia scartata.

## Requisiti JSON Schema

- **Ogni Plugin deve distribuire un JSON Schema**, anche se non accetta alcuna configurazione.
- Uno schema vuoto è accettabile (ad esempio, `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono validati in fase di lettura/scrittura della configurazione, non a runtime.

## Comportamento della validazione

- Le chiavi `channels.*` sconosciute sono **errori**, a meno che l'ID canale non sia dichiarato da
  un manifest di Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono riferirsi a ID Plugin **rilevabili**. Gli ID sconosciuti sono **errori**.
- Se un Plugin è installato ma ha un manifest o uno schema mancante o non valido,
  la validazione fallisce e Doctor segnala l'errore del Plugin.
- Se esiste configurazione del Plugin ma il Plugin è **disabilitato**, la configurazione viene mantenuta e
  viene mostrato un **warning** in Doctor + nei log.

Vedi [Configuration reference](/it/gateway/configuration) per lo schema completo `plugins.*`.

## Note

- Il manifest è **obbligatorio per i Plugin OpenClaw nativi**, inclusi i caricamenti dal filesystem locale.
- Il runtime carica comunque separatamente il modulo del Plugin; il manifest serve solo per
  discovery + validazione.
- I manifest nativi vengono analizzati con JSON5, quindi commenti, virgole finali e
  chiavi senza virgolette sono accettati finché il valore finale resta comunque un oggetto.
- Solo i campi del manifest documentati vengono letti dal loader del manifest. Evita di aggiungere
  qui chiavi personalizzate di primo livello.
- `providerAuthEnvVars` è il percorso di metadati economico per probe di autenticazione, validazione
  di env-marker e superfici simili di autenticazione provider che non dovrebbero avviare il runtime del Plugin
  solo per ispezionare i nomi env.
- `providerAuthAliases` consente alle varianti di provider di riutilizzare le variabili d'ambiente
  di autenticazione di un altro provider, i profili di autenticazione, l'autenticazione basata su configurazione e la scelta di onboarding della chiave API
  senza codificare rigidamente questa relazione nel core.
- `providerEndpoints` consente ai Plugin provider di possedere semplici metadati di matching
  host/baseUrl dell'endpoint. Usalo solo per classi di endpoint che il core supporta già;
  il Plugin resta comunque proprietario del comportamento runtime.
- `syntheticAuthRefs` è il percorso di metadati economico per hook di autenticazione sintetica
  posseduti dal provider che devono essere visibili alla cold model discovery prima che esista il registro runtime. Elenca solo i riferimenti il cui provider runtime o backend CLI effettivamente
  implementa `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` è il percorso di metadati economico per valori placeholder
  di chiave API posseduti dai plugin inclusi, come marcatori di credenziali locali, OAuth o ambient.
  Il core li tratta come non-secret per la visualizzazione dell'autenticazione e gli audit dei secret senza
  codificare rigidamente il provider proprietario.
- `channelEnvVars` è il percorso di metadati economico per fallback env della shell, prompt di setup
  e superfici simili del canale che non dovrebbero avviare il runtime del Plugin
  solo per ispezionare i nomi env. I nomi env sono metadati, non attivazione di per sé:
  stato, audit, validazione della consegna Cron e altre superfici in sola lettura
  continuano ad applicare la policy di fiducia del Plugin e di attivazione effettiva prima di
  trattare una variabile d'ambiente come canale configurato.
- `providerAuthChoices` è il percorso di metadati economico per picker della scelta di autenticazione,
  risoluzione `--auth-choice`, mappatura del provider preferito e semplice registrazione
  dei flag CLI di onboarding prima che il runtime del provider venga caricato. Per i metadati della procedura guidata runtime
  che richiedono codice provider, vedi
  [Provider runtime hooks](/it/plugins/architecture#provider-runtime-hooks).
- I tipi esclusivi di Plugin vengono selezionati tramite `plugins.slots.*`.
  - `kind: "memory"` viene selezionato da `plugins.slots.memory`.
  - `kind: "context-engine"` viene selezionato da `plugins.slots.contextEngine`
    (predefinito: `legacy` integrato).
- `channels`, `providers`, `cliBackends` e `skills` possono essere omessi quando un
  Plugin non ne ha bisogno.
- Se il tuo Plugin dipende da moduli nativi, documenta i passaggi di build e ogni
  requisito di allowlist del package manager (ad esempio, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Correlati

- [Building Plugins](/it/plugins/building-plugins) — primi passi con i Plugin
- [Plugin Architecture](/it/plugins/architecture) — architettura interna
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento dell'SDK del Plugin
