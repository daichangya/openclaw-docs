---
read_when:
    - Stai creando un plugin OpenClaw
    - Devi distribuire uno schema di configurazione del plugin o eseguire il debug degli errori di validazione del plugin
summary: Requisiti del manifest del Plugin + schema JSON (validazione rigorosa della configurazione)
title: Manifest del Plugin
x-i18n:
    generated_at: "2026-04-22T08:20:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 085c1baccb96b8e6bd4033ad11bdd5f79bdb0daec470e977fce723c3ae38cc99
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest del Plugin (`openclaw.plugin.json`)

Questa pagina riguarda solo il **manifest nativo del plugin OpenClaw**.

Per i layout bundle compatibili, vedi [Bundle di plugin](/it/plugins/bundles).

I formati bundle compatibili usano file manifest diversi:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` o il layout predefinito del componente Claude
  senza un manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche questi layout bundle, ma non vengono validati
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw attualmente legge i metadati del bundle più le
radici delle Skills dichiarate, le radici dei comandi Claude, i valori predefiniti di `settings.json` del bundle Claude,
i valori predefiniti LSP del bundle Claude e i pacchetti hook supportati quando il layout corrisponde
alle aspettative del runtime OpenClaw.

Ogni plugin OpenClaw nativo **deve** distribuire un file `openclaw.plugin.json` nella
**radice del plugin**. OpenClaw usa questo manifest per validare la configurazione
**senza eseguire codice del plugin**. I manifest mancanti o non validi vengono trattati come
errori del plugin e bloccano la validazione della configurazione.

Vedi la guida completa al sistema di plugin: [Plugin](/it/tools/plugin).
Per il modello di capacità nativo e le indicazioni correnti sulla compatibilità esterna:
[Modello di capacità](/it/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` è il metadato che OpenClaw legge prima di caricare il codice
del tuo plugin.

Usalo per:

- identità del plugin
- validazione della configurazione
- metadati di autenticazione e onboarding che devono essere disponibili senza avviare il
  runtime del plugin
- suggerimenti di attivazione leggeri che le superfici di control plane possono ispezionare prima che il runtime
  venga caricato
- descrittori di configurazione leggeri che le superfici di setup/onboarding possono ispezionare prima che il
  runtime venga caricato
- metadati di alias e abilitazione automatica che devono essere risolti prima che il runtime del plugin venga caricato
- metadati abbreviati di appartenenza alla famiglia di modelli che devono auto-attivare il
  plugin prima che il runtime venga caricato
- snapshot statiche di appartenenza delle capacità usate per il wiring di compatibilità bundle e la
  copertura dei contratti
- metadati leggeri del runner QA che l'host condiviso `openclaw qa` può ispezionare
  prima che il runtime del plugin venga caricato
- metadati di configurazione specifici del canale che devono essere uniti nelle
  superfici di catalogo e validazione senza caricare il runtime
- suggerimenti UI per la configurazione

Non usarlo per:

- registrare il comportamento a runtime
- dichiarare entrypoint del codice
- metadati di installazione npm

Questi appartengono al codice del tuo plugin e a `package.json`.

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

| Campo                                | Obbligatorio | Tipo                             | Cosa significa                                                                                                                                                                                               |
| ------------------------------------ | ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                 | Sì           | `string`                         | ID canonico del plugin. È l'ID usato in `plugins.entries.<id>`.                                                                                                                                             |
| `configSchema`                       | Sì           | `object`                         | Schema JSON inline per la configurazione di questo plugin.                                                                                                                                                   |
| `enabledByDefault`                   | No           | `true`                           | Contrassegna un plugin bundle come abilitato per impostazione predefinita. Omettilo, oppure imposta qualsiasi valore diverso da `true`, per lasciare il plugin disabilitato per impostazione predefinita. |
| `legacyPluginIds`                    | No           | `string[]`                       | ID legacy che vengono normalizzati a questo ID canonico del plugin.                                                                                                                                          |
| `autoEnableWhenConfiguredProviders`  | No           | `string[]`                       | ID provider che dovrebbero abilitare automaticamente questo plugin quando auth, configurazione o riferimenti a modelli li menzionano.                                                                       |
| `kind`                               | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo esclusivo di plugin usato da `plugins.slots.*`.                                                                                                                                             |
| `channels`                           | No           | `string[]`                       | ID canale posseduti da questo plugin. Usati per rilevamento e validazione della configurazione.                                                                                                              |
| `providers`                          | No           | `string[]`                       | ID provider posseduti da questo plugin.                                                                                                                                                                      |
| `modelSupport`                       | No           | `object`                         | Metadati abbreviati di famiglia di modelli posseduti dal manifest usati per caricare automaticamente il plugin prima del runtime.                                                                           |
| `providerEndpoints`                  | No           | `object[]`                       | Metadati di host/baseUrl degli endpoint posseduti dal manifest per route provider che il core deve classificare prima che il runtime del provider venga caricato.                                           |
| `cliBackends`                        | No           | `string[]`                       | ID backend di inferenza CLI posseduti da questo plugin. Usati per l'auto-attivazione all'avvio da riferimenti espliciti nella configurazione.                                                              |
| `syntheticAuthRefs`                  | No           | `string[]`                       | Riferimenti a provider o backend CLI il cui hook di auth sintetica, posseduto dal plugin, dovrebbe essere sondato durante il rilevamento a freddo dei modelli prima che il runtime venga caricato.         |
| `nonSecretAuthMarkers`               | No           | `string[]`                       | Valori segnaposto di chiavi API posseduti da plugin bundle che rappresentano stato credenziali locale, OAuth o ambient non segreto.                                                                         |
| `commandAliases`                     | No           | `object[]`                       | Nomi di comando posseduti da questo plugin che dovrebbero produrre configurazione consapevole del plugin e diagnostica CLI prima che il runtime venga caricato.                                             |
| `providerAuthEnvVars`                | No           | `Record<string, string[]>`       | Metadati leggeri delle variabili d'ambiente di auth del provider che OpenClaw può ispezionare senza caricare il codice del plugin.                                                                          |
| `providerAuthAliases`                | No           | `Record<string, string>`         | ID provider che dovrebbero riutilizzare un altro ID provider per la ricerca auth, ad esempio un provider di coding che condivide la chiave API del provider di base e i profili auth.                       |
| `channelEnvVars`                     | No           | `Record<string, string[]>`       | Metadati leggeri delle variabili d'ambiente del canale che OpenClaw può ispezionare senza caricare il codice del plugin. Usali per superfici di setup o auth del canale guidate da env che helper generici di avvio/configurazione dovrebbero vedere. |
| `providerAuthChoices`                | No           | `object[]`                       | Metadati leggeri delle scelte auth per selettori di onboarding, risoluzione del provider preferito e semplice wiring di flag CLI.                                                                            |
| `activation`                         | No           | `object`                         | Suggerimenti di attivazione leggeri per caricamento attivato da provider, comando, canale, route e capacità. Solo metadati; il runtime del plugin continua a possedere il comportamento effettivo.         |
| `setup`                              | No           | `object`                         | Descrittori leggeri di setup/onboarding che le superfici di rilevamento e setup possono ispezionare senza caricare il runtime del plugin.                                                                   |
| `qaRunners`                          | No           | `object[]`                       | Descrittori leggeri del runner QA usati dall'host condiviso `openclaw qa` prima che il runtime del plugin venga caricato.                                                                                   |
| `contracts`                          | No           | `object`                         | Snapshot statico di capacità bundle per proprietà di speech, trascrizione realtime, voce realtime, comprensione dei media, generazione di immagini, generazione musicale, generazione video, recupero web, ricerca web e tool. |
| `mediaUnderstandingProviderMetadata` | No           | `Record<string, object>`         | Valori predefiniti leggeri di comprensione dei media per ID provider dichiarati in `contracts.mediaUnderstandingProviders`.                                                                                  |
| `channelConfigs`                     | No           | `Record<string, object>`         | Metadati di configurazione del canale posseduti dal manifest, uniti nelle superfici di rilevamento e validazione prima che il runtime venga caricato.                                                       |
| `skills`                             | No           | `string[]`                       | Directory Skills da caricare, relative alla radice del plugin.                                                                                                                                               |
| `name`                               | No           | `string`                         | Nome leggibile del plugin.                                                                                                                                                                                   |
| `description`                        | No           | `string`                         | Breve riepilogo mostrato nelle superfici del plugin.                                                                                                                                                         |
| `version`                            | No           | `string`                         | Versione informativa del plugin.                                                                                                                                                                             |
| `uiHints`                            | No           | `Record<string, object>`         | Etichette UI, segnaposto e suggerimenti di sensibilità per i campi di configurazione.                                                                                                                        |

## Riferimento `providerAuthChoices`

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o auth.
OpenClaw la legge prima che il runtime del provider venga caricato.

| Campo                 | Obbligatorio | Tipo                                            | Cosa significa                                                                                           |
| --------------------- | ------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                        | ID provider a cui appartiene questa scelta.                                                              |
| `method`              | Sì           | `string`                                        | ID del metodo auth a cui instradare.                                                                     |
| `choiceId`            | Sì           | `string`                                        | ID stabile della scelta auth usato dai flussi di onboarding e CLI.                                       |
| `choiceLabel`         | No           | `string`                                        | Etichetta visibile all'utente. Se omessa, OpenClaw usa `choiceId` come fallback.                         |
| `choiceHint`          | No           | `string`                                        | Breve testo di aiuto per il selettore.                                                                   |
| `assistantPriority`   | No           | `number`                                        | I valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.            |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell'assistente pur consentendo comunque la selezione manuale da CLI.  |
| `deprecatedChoiceIds` | No           | `string[]`                                      | ID legacy di scelta che dovrebbero reindirizzare gli utenti a questa scelta sostitutiva.                 |
| `groupId`             | No           | `string`                                        | ID di gruppo opzionale per raggruppare scelte correlate.                                                 |
| `groupLabel`          | No           | `string`                                        | Etichetta visibile all'utente per quel gruppo.                                                           |
| `groupHint`           | No           | `string`                                        | Breve testo di aiuto per il gruppo.                                                                      |
| `optionKey`           | No           | `string`                                        | Chiave opzione interna per flussi auth semplici a flag singolo.                                          |
| `cliFlag`             | No           | `string`                                        | Nome del flag CLI, ad esempio `--openrouter-api-key`.                                                    |
| `cliOption`           | No           | `string`                                        | Forma completa dell'opzione CLI, ad esempio `--openrouter-api-key <key>`.                                |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nell'help della CLI.                                                                   |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation">` | In quali superfici di onboarding dovrebbe apparire questa scelta. Se omesso, il valore predefinito è `["text-inference"]`. |

## Riferimento `commandAliases`

Usa `commandAliases` quando un plugin possiede un nome di comando runtime che gli utenti potrebbero
inserire per errore in `plugins.allow` o provare a eseguire come comando CLI root. OpenClaw
usa questi metadati per la diagnostica senza importare il codice runtime del plugin.

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

| Campo        | Obbligatorio | Tipo              | Cosa significa                                                          |
| ------------ | ------------ | ----------------- | ----------------------------------------------------------------------- |
| `name`       | Sì           | `string`          | Nome del comando che appartiene a questo plugin.                        |
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash di chat anziché come comando CLI root. |
| `cliCommand` | No           | `string`          | Comando CLI root correlato da suggerire per operazioni CLI, se esiste.  |

## Riferimento `activation`

Usa `activation` quando il plugin può dichiarare in modo leggero quali eventi del control plane
dovrebbero attivarlo in seguito.

## Riferimento `qaRunners`

Usa `qaRunners` quando un plugin contribuisce con uno o più runner di trasporto sotto la radice condivisa
`openclaw qa`. Mantieni questi metadati leggeri e statici; il runtime del plugin continua a possedere
la registrazione CLI effettiva tramite una superficie leggera
`runtime-api.ts` che esporta `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Esegui la corsia QA live Matrix supportata da Docker contro un homeserver usa e getta"
    }
  ]
}
```

| Campo         | Obbligatorio | Tipo     | Cosa significa                                                    |
| ------------- | ------------ | -------- | ----------------------------------------------------------------- |
| `commandName` | Sì           | `string` | Sottocomando montato sotto `openclaw qa`, ad esempio `matrix`.    |
| `description` | No           | `string` | Testo di help di fallback usato quando l'host condiviso richiede un comando stub. |

Questo blocco contiene solo metadati. Non registra comportamento runtime e non
sostituisce `register(...)`, `setupEntry` o altri entrypoint runtime/plugin.
I consumer attuali lo usano come suggerimento di restringimento prima di un caricamento plugin più ampio, quindi
la mancanza di metadati di attivazione di solito comporta solo un costo in termini di prestazioni; non dovrebbe
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

| Campo            | Obbligatorio | Tipo                                                 | Cosa significa                                                    |
| ---------------- | ------------ | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders`    | No           | `string[]`                                           | ID provider che dovrebbero attivare questo plugin quando richiesti. |
| `onCommands`     | No           | `string[]`                                           | ID comando che dovrebbero attivare questo plugin.                 |
| `onChannels`     | No           | `string[]`                                           | ID canale che dovrebbero attivare questo plugin.                  |
| `onRoutes`       | No           | `string[]`                                           | Tipi di route che dovrebbero attivare questo plugin.              |
| `onCapabilities` | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Suggerimenti ampi di capacità usati dalla pianificazione di attivazione del control plane. |

Consumer live attuali:

- la pianificazione CLI attivata dai comandi usa come fallback
  `commandAliases[].cliCommand` o `commandAliases[].name` legacy
- la pianificazione setup/canale attivata dai canali usa come fallback la proprietà
  `channels[]` legacy quando mancano metadati espliciti di attivazione del canale
- la pianificazione setup/runtime attivata dai provider usa come fallback la proprietà
  legacy `providers[]` e `cliBackends[]` di primo livello quando mancano metadati espliciti di attivazione
  del provider

## Riferimento `setup`

Usa `setup` quando le superfici di setup e onboarding hanno bisogno di metadati leggeri posseduti dal plugin
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

`cliBackends` di primo livello resta valido e continua a descrivere i backend
di inferenza CLI. `setup.cliBackends` è la superficie descrittiva specifica del setup per
i flussi di control plane/setup che devono restare solo metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie di lookup preferita,
basata prima sui descrittori, per il rilevamento del setup. Se il descrittore restringe solo
il plugin candidato e il setup ha ancora bisogno di hook runtime più ricchi in fase di setup,
imposta `requiresRuntime: true` e mantieni `setup-api` come
percorso di esecuzione di fallback.

Poiché il lookup del setup può eseguire codice `setup-api` posseduto dal plugin, i valori normalizzati
di `setup.providers[].id` e `setup.cliBackends[]` devono restare univoci tra
i plugin rilevati. Una proprietà ambigua fallisce in modo conservativo invece di scegliere un
vincitore in base all'ordine di rilevamento.

### Riferimento `setup.providers`

| Campo         | Obbligatorio | Tipo       | Cosa significa                                                                      |
| ------------- | ------------ | ---------- | ----------------------------------------------------------------------------------- |
| `id`          | Sì           | `string`   | ID provider esposto durante setup o onboarding. Mantieni gli ID normalizzati univoci a livello globale. |
| `authMethods` | No           | `string[]` | ID dei metodi di setup/auth che questo provider supporta senza caricare il runtime completo. |
| `envVars`     | No           | `string[]` | Variabili d'ambiente che le superfici generiche di setup/stato possono controllare prima che il runtime del plugin venga caricato. |

### Campi `setup`

| Campo              | Obbligatorio | Tipo       | Cosa significa                                                                                     |
| ------------------ | ------------ | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | No           | `object[]` | Descrittori di setup del provider esposti durante setup e onboarding.                              |
| `cliBackends`      | No           | `string[]` | ID backend in fase di setup usati per il lookup del setup descriptor-first. Mantieni gli ID normalizzati univoci a livello globale. |
| `configMigrations` | No           | `string[]` | ID di migrazione della configurazione posseduti dalla superficie di setup di questo plugin.        |
| `requiresRuntime`  | No           | `boolean`  | Se il setup richiede ancora l'esecuzione di `setup-api` dopo il lookup del descrittore.           |

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

| Campo         | Tipo       | Cosa significa                           |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Etichetta del campo visibile all'utente. |
| `help`        | `string`   | Breve testo di aiuto.                    |
| `tags`        | `string[]` | Tag UI opzionali.                        |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.     |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per gli input dei moduli. |

## Riferimento `contracts`

Usa `contracts` solo per metadati statici di proprietà delle capacità che OpenClaw può
leggere senza importare il runtime del plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
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

Ogni lista è facoltativa:

| Campo                            | Tipo       | Cosa significa                                                        |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID runtime incorporati per cui un plugin bundle può registrare factory. |
| `speechProviders`                | `string[]` | ID provider speech posseduti da questo plugin.                        |
| `realtimeTranscriptionProviders` | `string[]` | ID provider di trascrizione realtime posseduti da questo plugin.      |
| `realtimeVoiceProviders`         | `string[]` | ID provider voce realtime posseduti da questo plugin.                 |
| `mediaUnderstandingProviders`    | `string[]` | ID provider di comprensione dei media posseduti da questo plugin.     |
| `imageGenerationProviders`       | `string[]` | ID provider di generazione immagini posseduti da questo plugin.       |
| `videoGenerationProviders`       | `string[]` | ID provider di generazione video posseduti da questo plugin.          |
| `webFetchProviders`              | `string[]` | ID provider di recupero web posseduti da questo plugin.               |
| `webSearchProviders`             | `string[]` | ID provider di ricerca web posseduti da questo plugin.                |
| `tools`                          | `string[]` | Nomi dei tool agente posseduti da questo plugin per i controlli dei contratti bundle. |

## Riferimento `mediaUnderstandingProviderMetadata`

Usa `mediaUnderstandingProviderMetadata` quando un provider di comprensione dei media ha
modelli predefiniti, priorità di fallback auto-auth o supporto nativo ai documenti di cui
gli helper core generici hanno bisogno prima che il runtime venga caricato. Le chiavi devono anche essere dichiarate in
`contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Ogni voce provider può includere:

| Campo                  | Tipo                                | Cosa significa                                                              |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacità media esposte da questo provider.                                   |
| `defaultModels`        | `Record<string, string>`            | Valori predefiniti capacità-modello usati quando la configurazione non specifica un modello. |
| `autoPriority`         | `Record<string, number>`            | I numeri più bassi vengono ordinati prima per il fallback automatico del provider basato sulle credenziali. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input documento nativi supportati dal provider.                              |

## Riferimento `channelConfigs`

Usa `channelConfigs` quando un plugin canale ha bisogno di metadati di configurazione leggeri prima
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
          "label": "URL homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Connessione homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Ogni voce canale può includere:

| Campo         | Tipo                     | Cosa significa                                                                            |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schema JSON per `channels.<id>`. Obbligatorio per ogni voce dichiarata di configurazione del canale. |
| `uiHints`     | `Record<string, object>` | Etichette UI/segnaposto/suggerimenti di sensibilità facoltativi per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita nelle superfici di selezione e ispezione quando i metadati runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                    |
| `preferOver`  | `string[]`               | ID plugin legacy o a priorità inferiore che questo canale dovrebbe superare nelle superfici di selezione. |

## Riferimento `modelSupport`

Usa `modelSupport` quando OpenClaw dovrebbe dedurre il tuo plugin provider da
ID modello abbreviati come `gpt-5.4` o `claude-sonnet-4.6` prima che il runtime del plugin
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
- se corrispondono sia un plugin non bundle sia un plugin bundle, vince il plugin
  non bundle
- l'ambiguità rimanente viene ignorata finché l'utente o la configurazione non specificano un provider

Campi:

| Campo           | Tipo       | Cosa significa                                                                  |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli ID modello abbreviati.       |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate rispetto agli ID modello abbreviati dopo la rimozione del suffisso del profilo. |

Le chiavi legacy di capacità di primo livello sono deprecate. Usa `openclaw doctor --fix` per
spostare `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale
caricamento del manifest non tratta più quei campi di primo livello come
proprietà delle capacità.

## Manifest rispetto a package.json

I due file hanno ruoli diversi:

| File                   | Usalo per                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Rilevamento, validazione della configurazione, metadati delle scelte auth e suggerimenti UI che devono esistere prima dell'esecuzione del codice del plugin |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per entrypoint, gating dell'installazione, setup o metadati di catalogo |

Se non sei sicuro di dove debba andare un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del plugin, inseriscilo in `openclaw.plugin.json`
- se riguarda packaging, file di entry o comportamento di installazione npm, inseriscilo in `package.json`

### Campi `package.json` che influenzano il rilevamento

Alcuni metadati del plugin pre-runtime vivono intenzionalmente in `package.json` sotto il blocco
`openclaw` invece che in `openclaw.plugin.json`.

Esempi importanti:

| Campo                                                             | Cosa significa                                                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Dichiara entrypoint nativi del plugin. Devono restare all'interno della directory del pacchetto plugin.                                                                             |
| `openclaw.runtimeExtensions`                                      | Dichiara entrypoint runtime JavaScript compilati per i pacchetti installati. Devono restare all'interno della directory del pacchetto plugin.                                      |
| `openclaw.setupEntry`                                             | EntryPoint leggero solo setup usato durante onboarding, avvio differito del canale e rilevamento in sola lettura di stato del canale/SecretRef. Deve restare all'interno della directory del pacchetto plugin. |
| `openclaw.runtimeSetupEntry`                                      | Dichiara l'entrypoint setup JavaScript compilato per i pacchetti installati. Deve restare all'interno della directory del pacchetto plugin.                                        |
| `openclaw.channel`                                                | Metadati leggeri del catalogo canali come etichette, percorsi della documentazione, alias e testo di selezione.                                                                    |
| `openclaw.channel.configuredState`                                | Metadati leggeri del controllo dello stato configurato che possono rispondere a "esiste già una configurazione solo-env?" senza caricare il runtime completo del canale.           |
| `openclaw.channel.persistedAuthState`                             | Metadati leggeri del controllo dello stato auth persistito che possono rispondere a "qualcuno ha già effettuato l'accesso?" senza caricare il runtime completo del canale.         |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Suggerimenti di installazione/aggiornamento per plugin bundle e plugin pubblicati esternamente.                                                                                     |
| `openclaw.install.defaultChoice`                                  | Percorso di installazione preferito quando sono disponibili più sorgenti di installazione.                                                                                          |
| `openclaw.install.minHostVersion`                                 | Versione minima supportata dell'host OpenClaw, usando una soglia semver come `>=2026.3.22`.                                                                                        |
| `openclaw.install.allowInvalidConfigRecovery`                     | Consente un percorso ristretto di ripristino tramite reinstallazione del plugin bundle quando la configurazione non è valida.                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Consente alle superfici del canale solo setup di caricarsi prima del plugin canale completo durante l'avvio.                                                                       |

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il
caricamento del registro dei manifest. I valori non validi vengono rifiutati; i valori
più recenti ma validi saltano il plugin sugli host meno recenti.

I plugin canale dovrebbero fornire `openclaw.setupEntry` quando stato, elenco canali
o scansioni SecretRef devono identificare account configurati senza caricare il runtime completo.
L'entry setup dovrebbe esporre metadati del canale più adattatori di configurazione,
stato e segreti sicuri per il setup; mantieni client di rete, listener Gateway e runtime di trasporto
nell'entrypoint principale dell'estensione.

I campi dell'entrypoint runtime non ignorano i controlli dei confini del pacchetto per i campi
dell'entrypoint sorgente. Per esempio, `openclaw.runtimeExtensions` non può rendere
caricabile un percorso `openclaw.extensions` che esce dai confini consentiti.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente ristretto. Non
rende installabili configurazioni arbitrarie non valide. Oggi consente solo ai flussi di installazione
di recuperare da specifici errori obsoleti di aggiornamento dei plugin bundle, come un
percorso mancante di plugin bundle o una voce `channels.<id>` obsoleta per quello stesso
plugin bundle. Errori di configurazione non correlati continuano a bloccare l'installazione e indirizzano gli operatori
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` è un metadato di pacchetto per un piccolo modulo di controllo:

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

Usalo quando i flussi di setup, doctor o stato configurato hanno bisogno di una sonda auth
economica sì/no prima che il plugin canale completo venga caricato. L'export di destinazione dovrebbe essere una piccola
funzione che legge solo lo stato persistito; non instradarla attraverso il barrel runtime completo
del canale.

`openclaw.channel.configuredState` segue la stessa forma per controlli economici dello stato
configurato solo-env:

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

Usalo quando un canale può determinare lo stato configurato da env o altri input minimi
non runtime. Se il controllo richiede la risoluzione completa della configurazione o il vero
runtime del canale, mantieni invece quella logica nell'hook `config.hasConfiguredState`
del plugin.

## Precedenza di rilevamento (ID plugin duplicati)

OpenClaw rileva i plugin da diverse radici (bundle, installazione globale, workspace, percorsi espliciti selezionati dalla configurazione). Se due rilevamenti condividono lo stesso `id`, viene mantenuto solo il manifest con la **precedenza più alta**; i duplicati con precedenza inferiore vengono scartati invece di essere caricati accanto ad esso.

Precedenza, dalla più alta alla più bassa:

1. **Selezionato dalla configurazione** — un percorso fissato esplicitamente in `plugins.entries.<id>`
2. **Bundle** — plugin distribuiti con OpenClaw
3. **Installazione globale** — plugin installati nella radice globale dei plugin OpenClaw
4. **Workspace** — plugin rilevati relativamente al workspace corrente

Implicazioni:

- Una copia forkata o obsoleta di un plugin bundle presente nel workspace non oscurerà la build bundle.
- Per sovrascrivere davvero un plugin bundle con uno locale, fissalo tramite `plugins.entries.<id>` in modo che vinca per precedenza invece di affidarti al rilevamento del workspace.
- Gli scarti dei duplicati vengono registrati nei log in modo che Doctor e la diagnostica di avvio possano indicare la copia scartata.

## Requisiti dello schema JSON

- **Ogni plugin deve distribuire uno schema JSON**, anche se non accetta configurazione.
- È accettabile uno schema vuoto (per esempio, `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono validati al momento della lettura/scrittura della configurazione, non a runtime.

## Comportamento di validazione

- Le chiavi `channels.*` sconosciute sono **errori**, a meno che l'ID del canale non sia dichiarato da
  un manifest del plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono fare riferimento a ID plugin **rilevabili**. Gli ID sconosciuti sono **errori**.
- Se un plugin è installato ma ha un manifest o uno schema mancante o non valido,
  la validazione fallisce e Doctor segnala l'errore del plugin.
- Se la configurazione del plugin esiste ma il plugin è **disabilitato**, la configurazione viene mantenuta e
  viene mostrato un **avviso** in Doctor + nei log.

Vedi [Riferimento della configurazione](/it/gateway/configuration) per lo schema completo di `plugins.*`.

## Note

- Il manifest è **obbligatorio per i plugin OpenClaw nativi**, inclusi i caricamenti locali dal filesystem.
- Il runtime continua comunque a caricare separatamente il modulo del plugin; il manifest serve solo per
  rilevamento + validazione.
- I manifest nativi vengono analizzati con JSON5, quindi commenti, virgole finali e
  chiavi non tra virgolette sono accettati purché il valore finale resti comunque un oggetto.
- Solo i campi del manifest documentati vengono letti dal loader del manifest. Evita di aggiungere
  qui chiavi di primo livello personalizzate.
- `providerAuthEnvVars` è il percorso di metadati economico per sonde auth, validazione
  dei marker env e superfici simili di auth del provider che non dovrebbero avviare il runtime del plugin
  solo per ispezionare i nomi env.
- `providerAuthAliases` consente alle varianti di provider di riutilizzare le variabili d'ambiente auth
  di un altro provider, i profili auth, l'auth basata sulla configurazione e la scelta di onboarding
  della chiave API senza codificare rigidamente quella relazione nel core.
- `providerEndpoints` consente ai plugin provider di possedere semplici metadati di corrispondenza
  host/baseUrl degli endpoint. Usalo solo per classi di endpoint già supportate dal core;
  il plugin continua a possedere il comportamento runtime.
- `syntheticAuthRefs` è il percorso di metadati economico per hook di auth sintetica
  posseduti dal provider che devono essere visibili al rilevamento a freddo dei modelli prima che esista il registro
  runtime. Elenca solo riferimenti il cui provider runtime o backend CLI implementa realmente
  `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` è il percorso di metadati economico per chiavi API segnaposto
  possedute da plugin bundle, come marker di credenziali locali, OAuth o ambient.
  Il core le tratta come non segreti per la visualizzazione auth e gli audit dei segreti senza
  codificare rigidamente il provider proprietario.
- `channelEnvVars` è il percorso di metadati economico per fallback shell-env, prompt di setup
  e superfici di canale simili che non dovrebbero avviare il runtime del plugin
  solo per ispezionare i nomi env. I nomi env sono metadati, non attivazione di per sé:
  stato, audit, validazione della consegna Cron e altre superfici in sola lettura
  applicano comunque il criterio di fiducia del plugin e di attivazione effettiva prima di
  trattare una variabile env come un canale configurato.
- `providerAuthChoices` è il percorso di metadati economico per selettori di scelte auth,
  risoluzione di `--auth-choice`, mappatura del provider preferito e semplice registrazione
  dei flag CLI di onboarding prima che il runtime del provider venga caricato. Per i metadati del wizard runtime
  che richiedono codice del provider, vedi
  [Hook runtime del provider](/it/plugins/architecture#provider-runtime-hooks).
- I tipi esclusivi di plugin vengono selezionati tramite `plugins.slots.*`.
  - `kind: "memory"` viene selezionato da `plugins.slots.memory`.
  - `kind: "context-engine"` viene selezionato da `plugins.slots.contextEngine`
    (predefinito: `legacy` integrato).
- `channels`, `providers`, `cliBackends` e `skills` possono essere omessi quando un
  plugin non ne ha bisogno.
- Se il tuo plugin dipende da moduli nativi, documenta i passaggi di build e qualsiasi
  requisito di allowlist del gestore di pacchetti (per esempio, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins) — guida introduttiva ai plugin
- [Architettura dei Plugin](/it/plugins/architecture) — architettura interna
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — riferimento del Plugin SDK
