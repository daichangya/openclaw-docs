---
read_when:
    - Stai creando un Plugin OpenClaw
    - Devi distribuire uno schema di configurazione del plugin o eseguire il debug degli errori di validazione del plugin
summary: Manifest del Plugin + requisiti dello schema JSON (validazione rigorosa della configurazione)
title: Manifest del Plugin
x-i18n:
    generated_at: "2026-04-26T11:34:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: b86920ad774c5ef4ace7b546ef44e5b087a8ca694dea622ddb440258ffff4237
    source_path: plugins/manifest.md
    workflow: 15
---

Questa pagina riguarda solo il **manifest nativo del Plugin OpenClaw**.

Per layout bundle compatibili, vedi [Bundle di Plugin](/it/plugins/bundles).

I formati bundle compatibili usano file manifest diversi:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` o il layout componente Claude
  predefinito senza manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche questi layout bundle, ma non vengono validati
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw attualmente legge i metadati del bundle più le
radici dichiarate delle skill, le radici dei comandi Claude, i valori predefiniti di `settings.json` del bundle Claude,
i valori predefiniti LSP del bundle Claude e i pacchetti hook supportati quando il layout corrisponde
alle aspettative runtime di OpenClaw.

Ogni Plugin nativo OpenClaw **deve** distribuire un file `openclaw.plugin.json` nella
**radice del plugin**. OpenClaw usa questo manifest per validare la configurazione
**senza eseguire il codice del plugin**. I manifest mancanti o non validi vengono trattati come
errori del plugin e bloccano la validazione della configurazione.

Vedi la guida completa al sistema plugin: [Plugin](/it/tools/plugin).
Per il modello di capacità nativo e le attuali indicazioni di compatibilità esterna:
[Modello di capacità](/it/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` sono i metadati che OpenClaw legge **prima di caricare il
codice del tuo plugin**. Tutto ciò che segue deve essere abbastanza economico da ispezionare senza avviare
il runtime del plugin.

**Usalo per:**

- identità del plugin, validazione della configurazione e suggerimenti UI per la configurazione
- metadati di auth, onboarding e configurazione (alias, auto-enable, variabili env del provider, scelte auth)
- suggerimenti di attivazione per le superfici di control-plane
- proprietà abbreviata delle famiglie di modelli
- snapshot statici di proprietà delle capacità (`contracts`)
- metadati del runner QA che l'host condiviso `openclaw qa` può ispezionare
- metadati di configurazione specifici del canale uniti nel catalogo e nelle superfici di validazione

**Non usarlo per:** registrare comportamento runtime, dichiarare entrypoint del codice
o metadati di installazione npm. Questi appartengono al codice del tuo plugin e a `package.json`.

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

| Campo                                | Obbligatorio | Tipo                             | Cosa significa                                                                                                                                                                                                                     |
| ------------------------------------ | ------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sì           | `string`                         | ID canonico del plugin. È l'ID usato in `plugins.entries.<id>`.                                                                                                                                                                   |
| `configSchema`                       | Sì           | `object`                         | JSON Schema inline per la configurazione di questo plugin.                                                                                                                                                                         |
| `enabledByDefault`                   | No           | `true`                           | Contrassegna un plugin incluso come abilitato per impostazione predefinita. Omettilo, oppure imposta qualsiasi valore diverso da `true`, per lasciare il plugin disabilitato per impostazione predefinita.                    |
| `legacyPluginIds`                    | No           | `string[]`                       | ID legacy che vengono normalizzati a questo ID plugin canonico.                                                                                                                                                                    |
| `autoEnableWhenConfiguredProviders`  | No           | `string[]`                       | ID provider che dovrebbero abilitare automaticamente questo plugin quando auth, config o riferimenti di modello li menzionano.                                                                                                   |
| `kind`                               | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo esclusivo di plugin usato da `plugins.slots.*`.                                                                                                                                                                   |
| `channels`                           | No           | `string[]`                       | ID canale posseduti da questo plugin. Usato per discovery e validazione della configurazione.                                                                                                                                      |
| `providers`                          | No           | `string[]`                       | ID provider posseduti da questo plugin.                                                                                                                                                                                             |
| `providerDiscoveryEntry`             | No           | `string`                         | Percorso del modulo leggero di provider-discovery, relativo alla radice del plugin, per metadati del catalogo provider con ambito manifest che possono essere caricati senza attivare il runtime completo del plugin.          |
| `modelSupport`                       | No           | `object`                         | Metadati abbreviati della famiglia di modelli posseduti dal manifest usati per caricare automaticamente il plugin prima del runtime.                                                                                              |
| `modelCatalog`                       | No           | `object`                         | Metadati dichiarativi del catalogo dei modelli per provider posseduti da questo plugin. Questo è il contratto di control-plane per future liste in sola lettura, onboarding, selettori di modelli, alias e soppressione senza caricare il runtime del plugin. |
| `providerEndpoints`                  | No           | `object[]`                       | Metadati posseduti dal manifest di host/baseUrl endpoint per percorsi provider che il core deve classificare prima che il runtime del provider venga caricato.                                                                    |
| `cliBackends`                        | No           | `string[]`                       | ID backend di inferenza CLI posseduti da questo plugin. Usati per l'auto-attivazione all'avvio da riferimenti espliciti di configurazione.                                                                                       |
| `syntheticAuthRefs`                  | No           | `string[]`                       | Riferimenti provider o backend CLI il cui hook di auth sintetica posseduto dal plugin dovrebbe essere sondato durante la cold model discovery prima che il runtime venga caricato.                                                |
| `nonSecretAuthMarkers`               | No           | `string[]`                       | Valori segnaposto di chiavi API posseduti dal plugin incluso che rappresentano stato di credenziali locali, OAuth o ambientali non segrete.                                                                                      |
| `commandAliases`                     | No           | `object[]`                       | Nomi di comando posseduti da questo plugin che dovrebbero produrre diagnostica CLI e di configurazione consapevole del plugin prima che il runtime venga caricato.                                                                |
| `providerAuthEnvVars`                | No           | `Record<string, string[]>`       | Metadati env di compatibilità deprecati per la ricerca auth/status del provider. Per nuovi plugin preferisci `setup.providers[].envVars`; OpenClaw continua comunque a leggerlo durante la finestra di deprecazione.            |
| `providerAuthAliases`                | No           | `Record<string, string>`         | ID provider che dovrebbero riutilizzare un altro ID provider per la ricerca auth, per esempio un provider di coding che condivide la chiave API del provider base e i profili auth.                                              |
| `channelEnvVars`                     | No           | `Record<string, string[]>`       | Metadati env leggeri dei canali che OpenClaw può ispezionare senza caricare il codice del plugin. Usalo per superfici di configurazione o auth di canale guidate da env che helper generici di avvio/config dovrebbero vedere. |
| `providerAuthChoices`                | No           | `object[]`                       | Metadati leggeri delle scelte auth per selettori di onboarding, risoluzione del provider preferito e semplice collegamento dei flag CLI.                                                                                         |
| `activation`                         | No           | `object`                         | Metadati leggeri del planner di attivazione per caricamento attivato da provider, comando, canale, route e capacità. Solo metadati; il runtime del plugin continua a possedere il comportamento effettivo.                    |
| `setup`                              | No           | `object`                         | Descrittori leggeri di setup/onboarding che superfici di discovery e setup possono ispezionare senza caricare il runtime del plugin.                                                                                             |
| `qaRunners`                          | No           | `object[]`                       | Descrittori leggeri dei runner QA usati dall'host condiviso `openclaw qa` prima che il runtime del plugin venga caricato.                                                                                                        |
| `contracts`                          | No           | `object`                         | Snapshot statico delle capacità incluse per hook di auth esterni, speech, trascrizione realtime, voce realtime, comprensione dei media, generazione di immagini, generazione musicale, generazione video, web-fetch, web search e proprietà degli strumenti. |
| `mediaUnderstandingProviderMetadata` | No           | `Record<string, object>`         | Valori predefiniti leggeri di comprensione dei media per gli ID provider dichiarati in `contracts.mediaUnderstandingProviders`.                                                                                                   |
| `channelConfigs`                     | No           | `Record<string, object>`         | Metadati di configurazione del canale posseduti dal manifest uniti alle superfici di discovery e validazione prima che il runtime venga caricato.                                                                                |
| `skills`                             | No           | `string[]`                       | Directory Skills da caricare, relative alla radice del plugin.                                                                                                                                                                     |
| `name`                               | No           | `string`                         | Nome leggibile del plugin.                                                                                                                                                                                                         |
| `description`                        | No           | `string`                         | Breve riepilogo mostrato nelle superfici del plugin.                                                                                                                                                                               |
| `version`                            | No           | `string`                         | Versione informativa del plugin.                                                                                                                                                                                                   |
| `uiHints`                            | No           | `Record<string, object>`         | Etichette UI, segnaposto e suggerimenti di sensibilità per i campi di configurazione.                                                                                                                                             |

## Riferimento `providerAuthChoices`

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o auth.
OpenClaw la legge prima che il runtime del provider venga caricato.
Le liste di setup del provider usano queste scelte del manifest, scelte di setup
derivate dal descrittore e metadati del catalogo di installazione senza caricare il runtime del provider.

| Campo                 | Obbligatorio | Tipo                                            | Cosa significa                                                                                         |
| --------------------- | ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `provider`            | Sì           | `string`                                        | ID provider a cui appartiene questa scelta.                                                            |
| `method`              | Sì           | `string`                                        | ID del metodo auth a cui inviare.                                                                      |
| `choiceId`            | Sì           | `string`                                        | ID stabile della scelta auth usato dai flussi di onboarding e CLI.                                     |
| `choiceLabel`         | No           | `string`                                        | Etichetta visibile all'utente. Se omessa, OpenClaw usa `choiceId` come fallback.                       |
| `choiceHint`          | No           | `string`                                        | Breve testo di aiuto per il selettore.                                                                 |
| `assistantPriority`   | No           | `number`                                        | I valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.          |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell'assistente pur consentendo comunque la selezione manuale via CLI. |
| `deprecatedChoiceIds` | No           | `string[]`                                      | ID di scelta legacy che dovrebbero reindirizzare gli utenti a questa scelta sostitutiva.               |
| `groupId`             | No           | `string`                                        | ID di gruppo facoltativo per raggruppare scelte correlate.                                             |
| `groupLabel`          | No           | `string`                                        | Etichetta visibile all'utente per quel gruppo.                                                         |
| `groupHint`           | No           | `string`                                        | Breve testo di aiuto per il gruppo.                                                                    |
| `optionKey`           | No           | `string`                                        | Chiave opzione interna per semplici flussi auth a singolo flag.                                        |
| `cliFlag`             | No           | `string`                                        | Nome del flag CLI, come `--openrouter-api-key`.                                                        |
| `cliOption`           | No           | `string`                                        | Forma completa dell'opzione CLI, come `--openrouter-api-key <key>`.                                    |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nell'help della CLI.                                                                 |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation">` | In quali superfici di onboarding dovrebbe comparire questa scelta. Se omesso, il valore predefinito è `["text-inference"]`. |

## Riferimento `commandAliases`

Usa `commandAliases` quando un plugin possiede un nome di comando runtime che gli utenti potrebbero
mettere erroneamente in `plugins.allow` o tentare di eseguire come comando CLI radice. OpenClaw
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

| Campo        | Obbligatorio | Tipo              | Cosa significa                                                              |
| ------------ | ------------ | ----------------- | --------------------------------------------------------------------------- |
| `name`       | Sì           | `string`          | Nome del comando che appartiene a questo plugin.                            |
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash della chat invece che comando CLI radice. |
| `cliCommand` | No           | `string`          | Comando CLI radice correlato da suggerire per operazioni CLI, se esiste.    |

## Riferimento `activation`

Usa `activation` quando il plugin può dichiarare in modo economico quali eventi di control-plane
dovrebbero includerlo in un piano di attivazione/caricamento.

Questo blocco è metadato del planner, non un'API di ciclo di vita. Non registra
comportamento runtime, non sostituisce `register(...)` e non promette che
il codice del plugin sia già stato eseguito. Il planner di attivazione usa questi campi per
restringere i plugin candidati prima di ripiegare sui metadati esistenti di proprietà del manifest
come `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hook.

Preferisci i metadati più stretti che descrivono già la proprietà. Usa
`providers`, `channels`, `commandAliases`, descrittori di setup o `contracts`
quando quei campi esprimono la relazione. Usa `activation` per suggerimenti extra al planner
che non possono essere rappresentati da quei campi di proprietà.
Usa `cliBackends` di primo livello per alias runtime CLI come `claude-cli`,
`codex-cli` o `google-gemini-cli`; `activation.onAgentHarnesses` è solo per
ID harness agente incorporati che non hanno già un campo di proprietà.

Questo blocco è solo metadati. Non registra comportamento runtime e non
sostituisce `register(...)`, `setupEntry` o altri entrypoint runtime/plugin.
I consumer attuali lo usano come suggerimento di restringimento prima di un caricamento plugin più ampio, quindi
metadati di attivazione mancanti di solito costano solo prestazioni; non dovrebbero
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

| Campo              | Obbligatorio | Tipo                                                 | Cosa significa                                                                                                                                |
| ------------------ | ------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `onProviders`      | No           | `string[]`                                           | ID provider che dovrebbero includere questo plugin nei piani di attivazione/caricamento.                                                     |
| `onAgentHarnesses` | No           | `string[]`                                           | ID runtime degli harness agente incorporati che dovrebbero includere questo plugin nei piani di attivazione/caricamento. Usa `cliBackends` di primo livello per alias di backend CLI. |
| `onCommands`       | No           | `string[]`                                           | ID comando che dovrebbero includere questo plugin nei piani di attivazione/caricamento.                                                      |
| `onChannels`       | No           | `string[]`                                           | ID canale che dovrebbero includere questo plugin nei piani di attivazione/caricamento.                                                       |
| `onRoutes`         | No           | `string[]`                                           | Tipi di route che dovrebbero includere questo plugin nei piani di attivazione/caricamento.                                                   |
| `onCapabilities`   | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Suggerimenti ampi di capacità usati dal planning di attivazione del control-plane. Preferisci campi più stretti quando possibile.            |

Consumer live attuali:

- il planning CLI attivato da comando ripiega sui legacy
  `commandAliases[].cliCommand` o `commandAliases[].name`
- il planning di avvio dell'agent-runtime usa `activation.onAgentHarnesses` per
  harness incorporati e `cliBackends[]` di primo livello per alias runtime CLI
- il planning di setup/canale attivato dal canale ripiega sulla proprietà legacy `channels[]`
  quando mancano metadati espliciti di attivazione del canale
- il planning di setup/runtime attivato dal provider ripiega sulla proprietà legacy
  `providers[]` e `cliBackends[]` di primo livello quando mancano metadati espliciti
  di attivazione del provider

La diagnostica del planner può distinguere tra suggerimenti espliciti di attivazione e
fallback di proprietà del manifest. Per esempio, `activation-command-hint` significa che
ha corrisposto `activation.onCommands`, mentre `manifest-command-alias` significa che il
planner ha usato invece la proprietà `commandAliases`. Queste etichette di motivo sono per
diagnostica e test dell'host; gli autori di plugin dovrebbero continuare a dichiarare i metadati
che descrivono meglio la proprietà.

## Riferimento `qaRunners`

Usa `qaRunners` quando un plugin contribuisce con uno o più transport runner sotto
la radice condivisa `openclaw qa`. Mantieni questi metadati economici e statici; il runtime del plugin
continua a possedere la registrazione CLI effettiva tramite una superficie
leggera `runtime-api.ts` che esporta `qaRunnerCliRegistrations`.

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

| Campo         | Obbligatorio | Tipo     | Cosa significa                                                         |
| ------------- | ------------ | -------- | ---------------------------------------------------------------------- |
| `commandName` | Sì           | `string` | Sottocomando montato sotto `openclaw qa`, per esempio `matrix`.        |
| `description` | No           | `string` | Testo di help di fallback usato quando l'host condiviso ha bisogno di un comando stub. |

## Riferimento `setup`

Usa `setup` quando superfici di setup e onboarding hanno bisogno di metadati economici posseduti dal plugin
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

`cliBackends` di primo livello resta valido e continua a descrivere backend
di inferenza CLI. `setup.cliBackends` è la superficie descrittiva specifica del setup per
flussi di setup/control-plane che dovrebbero rimanere solo metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie preferita
di lookup descriptor-first per la discovery del setup. Se il descrittore restringe solo
il plugin candidato e il setup ha comunque bisogno di hook runtime più ricchi in fase di setup, imposta `requiresRuntime: true` e mantieni `setup-api` come
percorso di esecuzione di fallback.

OpenClaw include anche `setup.providers[].envVars` nelle ricerche generiche
di auth provider e variabili env. `providerAuthEnvVars` resta supportato tramite un adattatore di compatibilità durante la finestra di deprecazione, ma i plugin non inclusi che ancora lo usano
ricevono una diagnostica del manifest. I nuovi plugin dovrebbero mettere i metadati env di setup/stato
in `setup.providers[].envVars`.

OpenClaw può anche derivare semplici scelte di setup da `setup.providers[].authMethods`
quando non è disponibile alcuna voce di setup, o quando `setup.requiresRuntime: false`
dichiara non necessario il runtime di setup. Le voci esplicite `providerAuthChoices` restano preferite
per etichette personalizzate, flag CLI, ambito onboarding e metadati dell'assistente.

Imposta `requiresRuntime: false` solo quando quei descrittori sono sufficienti per la
superficie di setup. OpenClaw tratta `false` esplicito come contratto solo-descrittore
e non eseguirà `setup-api` o `openclaw.setupEntry` per la ricerca del setup. Se
un plugin solo-descrittore distribuisce comunque una di queste entry runtime di setup,
OpenClaw segnala una diagnostica additiva e continua a ignorarla. Omettere
`requiresRuntime` mantiene il comportamento legacy di fallback così i plugin esistenti che hanno aggiunto
descrittori senza il flag non si rompono.

Poiché la ricerca del setup può eseguire codice `setup-api` posseduto dal plugin, i valori
normalizzati `setup.providers[].id` e `setup.cliBackends[]` devono restare univoci tra
i plugin rilevati. Una proprietà ambigua fallisce in chiusura invece di scegliere un
vincitore in base all'ordine di discovery.

Quando il runtime di setup viene eseguito, la diagnostica del registro setup segnala
deriva del descrittore se `setup-api` registra un provider o backend CLI che i
descrittori del manifest non dichiarano, oppure se un descrittore non ha una
registrazione runtime corrispondente. Queste diagnostiche sono additive e non rifiutano i plugin legacy.

### Riferimento `setup.providers`

| Campo         | Obbligatorio | Tipo       | Cosa significa                                                                       |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Sì           | `string`   | ID provider esposto durante setup o onboarding. Mantieni gli ID normalizzati globalmente univoci. |
| `authMethods` | No           | `string[]` | ID dei metodi di setup/auth supportati da questo provider senza caricare il runtime completo. |
| `envVars`     | No           | `string[]` | Variabili env che superfici generiche di setup/stato possono controllare prima che il runtime del plugin venga caricato. |

### Campi `setup`

| Campo              | Obbligatorio | Tipo       | Cosa significa                                                                                     |
| ------------------ | ------------ | ---------- | -------------------------------------------------------------------------------------------------- |
| `providers`        | No           | `object[]` | Descrittori di setup dei provider esposti durante setup e onboarding.                              |
| `cliBackends`      | No           | `string[]` | ID backend in fase di setup usati per la ricerca setup descriptor-first. Mantieni gli ID normalizzati globalmente univoci. |
| `configMigrations` | No           | `string[]` | ID di migrazione della configurazione posseduti dalla superficie di setup di questo plugin.        |
| `requiresRuntime`  | No           | `boolean`  | Se il setup richiede ancora l'esecuzione di `setup-api` dopo la ricerca del descrittore.          |

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

| Campo         | Tipo       | Cosa significa                            |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Etichetta del campo visibile all'utente.  |
| `help`        | `string`   | Breve testo di aiuto.                     |
| `tags`        | `string[]` | Tag UI facoltativi.                       |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.      |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per gli input del modulo. |

## Riferimento `contracts`

Usa `contracts` solo per metadati statici di proprietà delle capacità che OpenClaw può
leggere senza importare il runtime del plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
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

| Campo                            | Tipo       | Cosa significa                                                          |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | ID factory di estensione dell'app-server Codex, attualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | ID runtime per cui un plugin incluso può registrare middleware del risultato degli strumenti. |
| `externalAuthProviders`          | `string[]` | ID provider il cui hook di profilo auth esterno è posseduto da questo plugin. |
| `speechProviders`                | `string[]` | ID provider speech posseduti da questo plugin.                          |
| `realtimeTranscriptionProviders` | `string[]` | ID provider di trascrizione realtime posseduti da questo plugin.        |
| `realtimeVoiceProviders`         | `string[]` | ID provider di voce realtime posseduti da questo plugin.                |
| `memoryEmbeddingProviders`       | `string[]` | ID provider di embedding della memoria posseduti da questo plugin.      |
| `mediaUnderstandingProviders`    | `string[]` | ID provider di comprensione dei media posseduti da questo plugin.       |
| `imageGenerationProviders`       | `string[]` | ID provider di generazione immagini posseduti da questo plugin.         |
| `videoGenerationProviders`       | `string[]` | ID provider di generazione video posseduti da questo plugin.            |
| `webFetchProviders`              | `string[]` | ID provider di web-fetch posseduti da questo plugin.                    |
| `webSearchProviders`             | `string[]` | ID provider di web search posseduti da questo plugin.                   |
| `tools`                          | `string[]` | Nomi degli strumenti agente posseduti da questo plugin per i controlli di contratto del bundle. |

`contracts.embeddedExtensionFactories` è mantenuto per factory di estensione
solo app-server Codex incluse. Le trasformazioni incluse del risultato degli strumenti
dovrebbero dichiarare `contracts.agentToolResultMiddleware` e registrarsi con
`api.registerAgentToolResultMiddleware(...)` invece. I plugin esterni non possono
registrare middleware del risultato degli strumenti perché il seam può riscrivere output di strumenti ad alta fiducia prima che il modello li veda.

I plugin provider che implementano `resolveExternalAuthProfiles` dovrebbero dichiarare
`contracts.externalAuthProviders`. I plugin senza questa dichiarazione continuano a funzionare
tramite un fallback di compatibilità deprecato, ma quel fallback è più lento e
verrà rimosso dopo la finestra di migrazione.

I provider di embedding della memoria inclusi dovrebbero dichiarare
`contracts.memoryEmbeddingProviders` per ogni ID adattatore che espongono, inclusi
adattatori integrati come `local`. I percorsi CLI standalone usano questo contratto del manifest
per caricare solo il plugin proprietario prima che il runtime completo del Gateway abbia
registrato i provider.

## Riferimento `mediaUnderstandingProviderMetadata`

Usa `mediaUnderstandingProviderMetadata` quando un provider di comprensione dei media ha
modelli predefiniti, priorità di fallback auto-auth o supporto nativo dei documenti che
gli helper generici del core devono conoscere prima che il runtime venga caricato. Le chiavi devono anche essere dichiarate in
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

| Campo                  | Tipo                                | Cosa significa                                                               |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacità media esposte da questo provider.                                    |
| `defaultModels`        | `Record<string, string>`            | Valori predefiniti capability-to-model usati quando la configurazione non specifica un modello. |
| `autoPriority`         | `Record<string, number>`            | I numeri più bassi vengono ordinati prima per il fallback automatico del provider basato su credenziali. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input documento nativi supportati dal provider.                               |

## Riferimento `channelConfigs`

Usa `channelConfigs` quando un plugin di canale ha bisogno di metadati di configurazione economici prima
che il runtime venga caricato. La discovery di setup/stato del canale in sola lettura può usare questi metadati
direttamente per canali esterni configurati quando non è disponibile alcuna setup entry, oppure
quando `setup.requiresRuntime: false` dichiara non necessario il runtime di setup.

`channelConfigs` è metadato del manifest del plugin, non una nuova sezione
di configurazione utente di primo livello. Gli utenti continuano a configurare le istanze di canale sotto `channels.<channel-id>`.
OpenClaw legge i metadati del manifest per decidere quale plugin possiede quel
canale configurato prima che il codice runtime del plugin venga eseguito.

Per un plugin di canale, `configSchema` e `channelConfigs` descrivono percorsi diversi:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

I plugin non inclusi che dichiarano `channels[]` dovrebbero dichiarare anche voci
`channelConfigs` corrispondenti. Senza di esse, OpenClaw può comunque caricare il plugin, ma
lo schema di configurazione a freddo, il setup e le superfici della Control UI non possono conoscere la
forma delle opzioni possedute dal canale finché il runtime del plugin non viene eseguito.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` e
`nativeSkillsAutoEnabled` possono dichiarare valori predefiniti statici `auto` per controlli di configurazione dei comandi che vengono eseguiti prima che il runtime del canale venga caricato. I canali inclusi possono anche pubblicare
gli stessi valori predefiniti tramite `package.json#openclaw.channel.commands` insieme
agli altri metadati del catalogo di canale posseduti dal loro pacchetto.

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
          "label": "URL Homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Connessione homeserver Matrix",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Ogni voce canale può includere:

| Campo         | Tipo                     | Cosa significa                                                                                  |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema per `channels.<id>`. Obbligatorio per ogni voce di configurazione del canale dichiarata. |
| `uiHints`     | `Record<string, object>` | Etichette UI facoltative/segnaposto/suggerimenti di sensibilità per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita nelle superfici di selezione e ispezione quando i metadati runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per superfici di ispezione e catalogo.                              |
| `commands`    | `object`                 | Valori predefiniti statici di comandi nativi e skill native per controlli di configurazione pre-runtime. |
| `preferOver`  | `string[]`               | ID plugin legacy o a priorità inferiore che questo canale dovrebbe superare nelle superfici di selezione.

### Sostituire un altro plugin di canale

Usa `preferOver` quando il tuo plugin è il proprietario preferito per un ID canale che
può essere fornito anche da un altro plugin. I casi comuni sono un ID plugin rinominato, un
plugin standalone che sostituisce un plugin incluso, o un fork mantenuto che
mantiene lo stesso ID canale per compatibilità della configurazione.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

Quando `channels.chat` è configurato, OpenClaw considera sia l'ID canale sia
l'ID del plugin preferito. Se il plugin a priorità inferiore è stato selezionato solo perché
è incluso o abilitato per impostazione predefinita, OpenClaw lo disabilita nella
configurazione runtime effettiva così un solo plugin possiede il canale e i suoi strumenti. La selezione esplicita dell'utente continua comunque a prevalere: se l'utente abilita esplicitamente entrambi i plugin, OpenClaw
preserva quella scelta e segnala diagnostiche di canale/strumento duplicato invece di
modificare silenziosamente l'insieme di plugin richiesto.

Mantieni `preferOver` limitato agli ID plugin che possono davvero fornire lo stesso canale.
Non è un campo di priorità generale e non rinomina le chiavi di configurazione utente.

## Riferimento `modelSupport`

Usa `modelSupport` quando OpenClaw dovrebbe dedurre il tuo plugin provider da
ID di modello abbreviati come `gpt-5.5` o `claude-sonnet-4.6` prima che il runtime del plugin
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

- i riferimenti espliciti `provider/model` usano i metadati del manifest `providers` del proprietario
- `modelPatterns` hanno precedenza su `modelPrefixes`
- se corrispondono sia un plugin non incluso sia uno incluso, vince il plugin non incluso
- l'ambiguità residua viene ignorata finché l'utente o la configurazione non specificano un provider

Campi:

| Campo           | Tipo       | Cosa significa                                                                 |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli ID di modello abbreviati.  |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate con gli ID di modello abbreviati dopo la rimozione del suffisso del profilo. |

## Riferimento `modelCatalog`

Usa `modelCatalog` quando OpenClaw dovrebbe conoscere i metadati del modello provider prima
di caricare il runtime del plugin. Questa è la sorgente posseduta dal manifest per righe
di catalogo fisse, alias provider, regole di soppressione e modalità discovery. L'aggiornamento runtime
resta nel codice runtime del provider, ma il manifest dice al core quando il runtime
è richiesto.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "non disponibile su Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Campi di primo livello:

| Campo          | Tipo                                                     | Cosa significa                                                                                             |
| -------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Righe di catalogo per ID provider posseduti da questo plugin. Le chiavi dovrebbero comparire anche in `providers` di primo livello. |
| `aliases`      | `Record<string, object>`                                 | Alias provider che dovrebbero risolversi a un provider posseduto per il planning del catalogo o della soppressione. |
| `suppressions` | `object[]`                                               | Righe di modello da un'altra sorgente che questo plugin sopprime per un motivo specifico del provider.    |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Se il catalogo provider può essere letto dai metadati del manifest, aggiornato nella cache o richiede runtime. |

Campi provider:

| Campo     | Tipo                     | Cosa significa                                                    |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | Base URL predefinito facoltativo per i modelli in questo catalogo provider. |
| `api`     | `ModelApi`               | Adattatore API predefinito facoltativo per i modelli in questo catalogo provider. |
| `headers` | `Record<string, string>` | Intestazioni statiche facoltative applicabili a questo catalogo provider. |
| `models`  | `object[]`               | Righe modello obbligatorie. Le righe senza `id` vengono ignorate. |

Campi modello:

| Campo           | Tipo                                                           | Cosa significa                                                              |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | `string`                                                       | ID modello locale al provider, senza prefisso `provider/`.                  |
| `name`          | `string`                                                       | Nome visualizzato facoltativo.                                               |
| `api`           | `ModelApi`                                                     | Override API per modello facoltativo.                                        |
| `baseUrl`       | `string`                                                       | Override base URL per modello facoltativo.                                   |
| `headers`       | `Record<string, string>`                                       | Intestazioni statiche per modello facoltative.                               |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Modalità accettate dal modello.                                              |
| `reasoning`     | `boolean`                                                      | Se il modello espone comportamento di ragionamento.                          |
| `contextWindow` | `number`                                                       | Finestra di contesto nativa del provider.                                    |
| `contextTokens` | `number`                                                       | Tetto effettivo facoltativo del contesto runtime quando diverso da `contextWindow`. |
| `maxTokens`     | `number`                                                       | Massimo token di output quando noto.                                         |
| `cost`          | `object`                                                       | Prezzi USD facoltativi per milione di token, inclusi `tieredPricing` facoltativi. |
| `compat`        | `object`                                                       | Flag di compatibilità facoltativi che corrispondono alla compatibilità della configurazione modello di OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Stato della lista. Sopprimi solo quando la riga non deve comparire affatto.  |
| `statusReason`  | `string`                                                       | Motivo facoltativo mostrato con stato non disponibile.                       |
| `replaces`      | `string[]`                                                     | ID di modello provider-local più vecchi che questo modello sostituisce.      |
| `replacedBy`    | `string`                                                       | ID provider-local del modello sostitutivo per righe deprecate.               |
| `tags`          | `string[]`                                                     | Tag stabili usati da selettori e filtri.                                     |

Non inserire dati solo runtime in `modelCatalog`. Se un provider ha bisogno dello stato
dell'account, di una richiesta API o di una discovery di processo locale per conoscere l'insieme completo
dei modelli, dichiara quel provider come `refreshable` o `runtime` in `discovery`.

### OpenClaw Provider Index

OpenClaw Provider Index è metadato di anteprima posseduto da OpenClaw per provider
i cui plugin potrebbero non essere ancora installati. Non fa parte di un manifest del plugin.
I manifest dei plugin restano l'autorità per i plugin installati. Il Provider Index è
il contratto interno di fallback che future superfici di provider installabili e selettori di modelli pre-installazione
consumeranno quando un plugin provider non è installato.

Ordine di autorità del catalogo:

1. Configurazione utente.
2. Manifest `modelCatalog` del plugin installato.
3. Cache del catalogo modelli da refresh esplicito.
4. Righe di anteprima di OpenClaw Provider Index.

Il Provider Index non deve contenere secret, stato di abilitazione, hook runtime o
dati di modelli live specifici dell'account. I suoi cataloghi di anteprima usano la stessa
forma di riga provider `modelCatalog` dei manifest dei plugin, ma dovrebbero restare limitati
a metadati di visualizzazione stabili a meno che campi dell'adattatore runtime come `api`,
`baseUrl`, prezzi o flag di compatibilità non siano intenzionalmente mantenuti allineati con
il manifest del plugin installato. I provider con discovery live `/models` dovrebbero
scrivere righe aggiornate tramite il percorso esplicito della cache del catalogo modelli invece di
far chiamare le API del provider alla normale lista o all'onboarding.

Le voci Provider Index possono anche contenere metadati di plugin installabili per provider
il cui plugin è stato spostato fuori dal core o non è ancora installato. Questi
metadati rispecchiano il pattern del catalogo dei canali: nome pacchetto, spec di installazione npm,
integrità attesa ed etichette leggere delle scelte auth bastano per mostrare
un'opzione di setup installabile. Una volta installato il plugin, il suo manifest prevale e
la voce Provider Index viene ignorata per quel provider.

Le vecchie chiavi di capacità di primo livello sono deprecate. Usa `openclaw doctor --fix` per
spostare `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale
caricamento del manifest non tratta più quei campi di primo livello come
proprietà di capacità.

## Manifest rispetto a package.json

I due file svolgono compiti diversi:

| File                   | Usalo per                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Discovery, validazione della configurazione, metadati delle scelte auth e suggerimenti UI che devono esistere prima che il codice del plugin venga eseguito |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per entrypoint, gating di installazione, setup o metadati del catalogo |

Se non sei sicuro di dove debba stare un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del plugin, mettilo in `openclaw.plugin.json`
- se riguarda packaging, file di entry o comportamento di installazione npm, mettilo in `package.json`

### Campi package.json che influiscono sulla discovery

Alcuni metadati pre-runtime del plugin risiedono intenzionalmente in `package.json` sotto il
blocco `openclaw` invece che in `openclaw.plugin.json`.

Esempi importanti:

| Campo                                                             | Cosa significa                                                                                                                                                                       |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Dichiara gli entrypoint nativi del plugin. Devono restare dentro la directory del pacchetto plugin.                                                                                |
| `openclaw.runtimeExtensions`                                      | Dichiara gli entrypoint runtime JavaScript buildati per i pacchetti installati. Devono restare dentro la directory del pacchetto plugin.                                           |
| `openclaw.setupEntry`                                             | Entry point leggero solo-setup usato durante onboarding, avvio differito del canale e discovery in sola lettura di stato del canale/SecretRef. Deve restare dentro la directory del pacchetto plugin. |
| `openclaw.runtimeSetupEntry`                                      | Dichiara l'entrypoint setup JavaScript buildato per i pacchetti installati. Deve restare dentro la directory del pacchetto plugin.                                                 |
| `openclaw.channel`                                                | Metadati economici del catalogo dei canali come etichette, percorsi docs, alias e testo di selezione.                                                                              |
| `openclaw.channel.commands`                                       | Metadati statici di comandi nativi e skill native auto-default usati da configurazione, audit e superfici della lista comandi prima che il runtime del canale venga caricato.      |
| `openclaw.channel.configuredState`                                | Metadati leggeri del controllo dello stato configurato che possono rispondere a "esiste già una configurazione solo-env?" senza caricare il runtime completo del canale.            |
| `openclaw.channel.persistedAuthState`                             | Metadati leggeri del controllo auth persistita che possono rispondere a "c'è già qualcosa con accesso effettuato?" senza caricare il runtime completo del canale.                  |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Suggerimenti di installazione/aggiornamento per plugin inclusi e pubblicati esternamente.                                                                                           |
| `openclaw.install.defaultChoice`                                  | Percorso di installazione preferito quando sono disponibili più sorgenti di installazione.                                                                                          |
| `openclaw.install.minHostVersion`                                 | Versione minima supportata dell'host OpenClaw, usando una soglia semver come `>=2026.3.22`.                                                                                        |
| `openclaw.install.expectedIntegrity`                              | Stringa di integrità attesa del dist npm come `sha512-...`; i flussi di installazione e aggiornamento verificano l'artifact recuperato rispetto ad essa.                           |
| `openclaw.install.allowInvalidConfigRecovery`                     | Consente un percorso ristretto di recupero tramite reinstallazione di plugin inclusi quando la configurazione non è valida.                                                        |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Permette alle superfici del canale solo-setup di caricarsi prima del plugin di canale completo durante l'avvio.                                                                    |

I metadati del manifest decidono quali scelte di provider/canale/setup compaiono
nell'onboarding prima che il runtime venga caricato. `package.json#openclaw.install` dice
all'onboarding come recuperare o abilitare quel plugin quando l'utente seleziona una di quelle
scelte. Non spostare i suggerimenti di installazione in `openclaw.plugin.json`.

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il caricamento del
registro dei manifest. I valori non validi vengono rifiutati; valori più recenti ma validi saltano
il plugin sugli host più vecchi.

Il pinning esatto della versione npm vive già in `npmSpec`, per esempio
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Le voci ufficiali del catalogo esterno
dovrebbero associare spec esatte con `expectedIntegrity` così i flussi di aggiornamento falliscono
in chiusura se l'artifact npm recuperato non corrisponde più alla release fissata.
L'onboarding interattivo continua comunque a offrire spec npm di registry affidabile, inclusi nomi di
pacchetto semplici e dist-tag, per compatibilità. La diagnostica del catalogo può
distinguere sorgenti esatte, floating, con integrità fissata, con integrità mancante, con mismatch del nome pacchetto e con default-choice non valida. Avvisa anche quando
`expectedIntegrity` è presente ma non esiste alcuna sorgente npm valida che possa
fissare. Quando `expectedIntegrity` è presente,
i flussi di installazione/aggiornamento lo applicano; quando è omesso, la risoluzione del registry viene
registrata senza pin di integrità.

I plugin di canale dovrebbero fornire `openclaw.setupEntry` quando stato, lista canali,
o scansioni SecretRef devono identificare account configurati senza caricare il runtime completo.
La setup entry dovrebbe esporre metadati del canale più adattatori di configurazione, stato e secret sicuri per il setup; mantieni client di rete, listener del gateway e
runtime di trasporto nell'entrypoint principale dell'estensione.

I campi di entrypoint runtime non sovrascrivono i controlli del confine del pacchetto per i campi di entrypoint sorgente. Per esempio, `openclaw.runtimeExtensions` non può rendere caricabile
un percorso `openclaw.extensions` che esce dai confini.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente ristretto. Non
rende installabili configurazioni arbitrarie danneggiate. Oggi consente solo ai flussi di installazione di recuperare da specifici fallimenti obsoleti di upgrade di plugin inclusi, come un
percorso plugin incluso mancante o una voce obsoleta `channels.<id>` per quello stesso
plugin incluso. Errori di configurazione non correlati continuano a bloccare l'installazione e indirizzano gli operatori
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` è metadato del pacchetto per un piccolo modulo
checker:

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

Usalo quando setup, doctor o flussi configured-state hanno bisogno di una sonda auth
economica sì/no prima che il plugin completo del canale venga caricato. L'export di destinazione dovrebbe essere una piccola
funzione che legge solo lo stato persistito; non instradarla attraverso il barrel runtime completo
del canale.

`openclaw.channel.configuredState` segue la stessa forma per controlli economici
configured-state solo-env:

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

Usalo quando un canale può rispondere al configured-state da env o altri piccoli
input non runtime. Se il controllo richiede la risoluzione completa della configurazione o il vero
runtime del canale, mantieni quella logica nell'hook del plugin `config.hasConfiguredState`.

## Precedenza della discovery (ID plugin duplicati)

OpenClaw rileva i plugin da varie radici (inclusi, installazione globale, area di lavoro, percorsi espliciti selezionati dalla configurazione). Se due discovery condividono lo stesso `id`, viene mantenuto solo il manifest con **precedenza più alta**; i duplicati a precedenza inferiore vengono eliminati invece di essere caricati accanto.

Precedenza, dalla più alta alla più bassa:

1. **Selezionato dalla configurazione** — un percorso fissato esplicitamente in `plugins.entries.<id>`
2. **Incluso** — plugin distribuiti con OpenClaw
3. **Installazione globale** — plugin installati nella radice globale dei plugin OpenClaw
4. **Area di lavoro** — plugin rilevati rispetto all'area di lavoro corrente

Implicazioni:

- Una copia forkata o obsoleta di un plugin incluso presente nell'area di lavoro non farà shadow della build inclusa.
- Per sovrascrivere davvero un plugin incluso con uno locale, fissalo tramite `plugins.entries.<id>` così vince per precedenza invece di affidarti alla discovery dell'area di lavoro.
- Le esclusioni dei duplicati vengono registrate nei log così Doctor e la diagnostica di avvio possono indicare la copia scartata.

## Requisiti JSON Schema

- **Ogni plugin deve distribuire un JSON Schema**, anche se non accetta alcuna configurazione.
- Uno schema vuoto è accettabile (per esempio `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono validati in fase di lettura/scrittura della configurazione, non a runtime.

## Comportamento della validazione

- Chiavi sconosciute `channels.*` sono **errori**, a meno che l'ID canale non sia dichiarato da
  un manifest del plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono fare riferimento a ID plugin **rilevabili**. Gli ID sconosciuti sono **errori**.
- Se un plugin è installato ma ha un manifest o uno schema danneggiato o mancante,
  la validazione fallisce e Doctor segnala l'errore del plugin.
- Se esiste configurazione del plugin ma il plugin è **disabilitato**, la configurazione viene mantenuta e
  viene mostrato un **avviso** in Doctor + nei log.

Vedi [Riferimento della configurazione](/it/gateway/configuration) per lo schema completo `plugins.*`.

## Note

- Il manifest è **obbligatorio per i plugin nativi OpenClaw**, inclusi i caricamenti locali dal filesystem. Il runtime continua comunque a caricare separatamente il modulo del plugin; il manifest serve solo per discovery + validazione.
- I manifest nativi vengono analizzati con JSON5, quindi commenti, virgole finali e chiavi senza virgolette sono accettati purché il valore finale resti un oggetto.
- Solo i campi del manifest documentati vengono letti dal loader del manifest. Evita chiavi personalizzate di primo livello.
- `channels`, `providers`, `cliBackends` e `skills` possono essere omessi quando un plugin non ne ha bisogno.
- `providerDiscoveryEntry` deve restare leggero e non dovrebbe importare codice runtime ampio; usalo per metadati statici del catalogo provider o descrittori di discovery ristretti, non per esecuzione al momento della richiesta.
- I tipi esclusivi di plugin vengono selezionati tramite `plugins.slots.*`: `kind: "memory"` tramite `plugins.slots.memory`, `kind: "context-engine"` tramite `plugins.slots.contextEngine` (predefinito `legacy`).
- I metadati delle variabili env (`setup.providers[].envVars`, il deprecato `providerAuthEnvVars` e `channelEnvVars`) sono solo dichiarativi. Stato, audit, validazione della consegna Cron e altre superfici in sola lettura continuano ad applicare la fiducia nel plugin e il criterio di attivazione effettivo prima di trattare una variabile env come configurata.
- Per metadati runtime della procedura guidata che richiedono codice provider, vedi [Hook runtime del provider](/it/plugins/architecture-internals#provider-runtime-hooks).
- Se il tuo plugin dipende da moduli nativi, documenta i passaggi di build e qualsiasi requisito di allowlist del gestore di pacchetti (per esempio pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Correlati

<CardGroup cols={3}>
  <Card title="Creazione di Plugin" href="/it/plugins/building-plugins" icon="rocket">
    Come iniziare con i Plugin.
  </Card>
  <Card title="Architettura dei Plugin" href="/it/plugins/architecture" icon="diagram-project">
    Architettura interna e modello di capacità.
  </Card>
  <Card title="Panoramica SDK" href="/it/plugins/sdk-overview" icon="book">
    Riferimento SDK del plugin e import dei sottopercorsi.
  </Card>
</CardGroup>
