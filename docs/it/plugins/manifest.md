---
read_when:
    - Stai creando un Plugin OpenClaw
    - Devi distribuire uno schema di configurazione del Plugin o eseguire il debug degli errori di validazione del Plugin
summary: Manifest del Plugin + requisiti JSON Schema (validazione rigorosa della configurazione)
title: Manifest del Plugin
x-i18n:
    generated_at: "2026-04-25T13:52:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa96930c3c9b890194869eb793c65a0af9db43f8f8b1f78d3c3d6ef18b70be6e
    source_path: plugins/manifest.md
    workflow: 15
---

Questa pagina riguarda solo il **manifest nativo del Plugin OpenClaw**.

Per i layout di bundle compatibili, vedi [Plugin bundles](/it/plugins/bundles).

I formati bundle compatibili usano file manifest diversi:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` oppure il layout predefinito dei componenti Claude
  senza manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche questi layout bundle, ma non vengono validati
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw al momento legge i metadati del bundle più le
root delle Skills dichiarate, le root dei comandi Claude, i valori predefiniti `settings.json` del bundle Claude,
i valori predefiniti LSP del bundle Claude e gli hook pack supportati quando il layout corrisponde
alle aspettative del runtime OpenClaw.

Ogni Plugin OpenClaw nativo **deve** distribuire un file `openclaw.plugin.json` nella
**root del Plugin**. OpenClaw usa questo manifest per validare la configurazione
**senza eseguire il codice del Plugin**. I manifest mancanti o non validi sono trattati come
errori del Plugin e bloccano la validazione della configurazione.

Vedi la guida completa al sistema Plugin: [Plugins](/it/tools/plugin).
Per il modello nativo delle capacità e le attuali indicazioni di compatibilità esterna:
[Capability model](/it/plugins/architecture#public-capability-model).

## Cosa fa questo file

`openclaw.plugin.json` sono i metadati che OpenClaw legge **prima di caricare il
codice del tuo Plugin**. Tutto ciò che segue deve essere abbastanza economico da ispezionare senza avviare
il runtime del Plugin.

**Usalo per:**

- identità del Plugin, validazione della configurazione e suggerimenti UI per la configurazione
- metadati di autenticazione, onboarding e configurazione iniziale (alias, auto-enable, variabili env del provider, scelte di autenticazione)
- suggerimenti di attivazione per superfici del control plane
- proprietà abbreviata della famiglia di modelli
- snapshot statici di proprietà delle capacità (`contracts`)
- metadati del runner QA che l'host condiviso `openclaw qa` può ispezionare
- metadati di configurazione specifici del canale uniti nelle superfici di catalogo e validazione

**Non usarlo per:** registrare comportamento runtime, dichiarare entrypoint del codice
o metadati di installazione npm. Questi appartengono al codice del tuo Plugin e a `package.json`.

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

| Campo                                | Obbligatorio | Tipo                             | Significato                                                                                                                                                                                                                       |
| ------------------------------------ | ------------ | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Sì           | `string`                         | Id canonico del Plugin. È l'id usato in `plugins.entries.<id>`.                                                                                                                                                                  |
| `configSchema`                       | Sì           | `object`                         | JSON Schema inline per la configurazione di questo Plugin.                                                                                                                                                                        |
| `enabledByDefault`                   | No           | `true`                           | Contrassegna un Plugin incluso come abilitato per impostazione predefinita. Omettilo, oppure imposta qualsiasi valore diverso da `true`, per lasciare il Plugin disabilitato per impostazione predefinita.                    |
| `legacyPluginIds`                    | No           | `string[]`                       | Id legacy che vengono normalizzati a questo id canonico del Plugin.                                                                                                                                                              |
| `autoEnableWhenConfiguredProviders`  | No           | `string[]`                       | Id provider che dovrebbero abilitare automaticamente questo Plugin quando auth, configurazione o ref dei modelli li menzionano.                                                                                                 |
| `kind`                               | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo esclusivo di Plugin usato da `plugins.slots.*`.                                                                                                                                                                 |
| `channels`                           | No           | `string[]`                       | Id dei canali di proprietà di questo Plugin. Usato per discovery e validazione della configurazione.                                                                                                                             |
| `providers`                          | No           | `string[]`                       | Id provider di proprietà di questo Plugin.                                                                                                                                                                                        |
| `providerDiscoveryEntry`             | No           | `string`                         | Percorso del modulo leggero di provider-discovery, relativo alla root del Plugin, per metadati del catalogo provider con ambito manifest che possono essere caricati senza attivare l'intero runtime del Plugin.              |
| `modelSupport`                       | No           | `object`                         | Metadati abbreviati sulla famiglia di modelli posseduti dal manifest usati per caricare automaticamente il Plugin prima del runtime.                                                                                            |
| `modelCatalog`                       | No           | `object`                         | Metadati dichiarativi del catalogo modelli per i provider di proprietà di questo Plugin. Questo è il contratto del control plane per future funzioni di listing in sola lettura, onboarding, selettori di modelli, alias e soppressione senza caricare il runtime del Plugin. |
| `providerEndpoints`                  | No           | `object[]`                       | Metadati posseduti dal manifest su host/baseUrl degli endpoint per route provider che il core deve classificare prima che il runtime del provider venga caricato.                                                               |
| `cliBackends`                        | No           | `string[]`                       | Id dei backend CLI inference di proprietà di questo Plugin. Usati per auto-attivazione all'avvio da ref di configurazione espliciti.                                                                                            |
| `syntheticAuthRefs`                  | No           | `string[]`                       | Ref di provider o backend CLI il cui hook di autenticazione sintetica di proprietà del Plugin dovrebbe essere sondato durante la cold model discovery prima che il runtime venga caricato.                                       |
| `nonSecretAuthMarkers`               | No           | `string[]`                       | Valori segnaposto di chiavi API di proprietà di Plugin inclusi che rappresentano stato di credenziali locali, OAuth o ambientali non segrete.                                                                                   |
| `commandAliases`                     | No           | `object[]`                       | Nomi di comandi di proprietà di questo Plugin che dovrebbero produrre diagnostica CLI e di configurazione consapevole del Plugin prima che il runtime venga caricato.                                                           |
| `providerAuthEnvVars`                | No           | `Record<string, string[]>`       | Metadati env di compatibilità deprecati per lookup di auth/status del provider. Per i nuovi Plugin preferisci `setup.providers[].envVars`; OpenClaw continua comunque a leggere questo durante la finestra di deprecazione.   |
| `providerAuthAliases`                | No           | `Record<string, string>`         | Id provider che dovrebbero riusare un altro id provider per il lookup dell'autenticazione, per esempio un provider di coding che condivide la chiave API del provider base e i profili di autenticazione.                      |
| `channelEnvVars`                     | No           | `Record<string, string[]>`       | Metadati env leggeri dei canali che OpenClaw può ispezionare senza caricare il codice del Plugin. Usali per superfici di configurazione o autenticazione dei canali guidate da env che gli helper generici di startup/config dovrebbero vedere. |
| `providerAuthChoices`                | No           | `object[]`                       | Metadati leggeri delle scelte di autenticazione per selettori di onboarding, risoluzione del provider preferito e semplice wiring dei flag CLI.                                                                                 |
| `activation`                         | No           | `object`                         | Metadati leggeri del pianificatore di attivazione per caricamento attivato da provider, comando, canale, route e capacità. Solo metadati; il runtime del Plugin continua a possedere il comportamento effettivo.             |
| `setup`                              | No           | `object`                         | Descrittori leggeri di setup/onboarding che le superfici di discovery e setup possono ispezionare senza caricare il runtime del Plugin.                                                                                         |
| `qaRunners`                          | No           | `object[]`                       | Descrittori leggeri dei runner QA usati dall'host condiviso `openclaw qa` prima che il runtime del Plugin venga caricato.                                                                                                       |
| `contracts`                          | No           | `object`                         | Snapshot statico delle capacità incluse per hook di autenticazione esterni, speech, trascrizione realtime, voce realtime, comprensione dei media, generazione di immagini, generazione di musica, generazione di video, web-fetch, web search e proprietà degli strumenti. |
| `mediaUnderstandingProviderMetadata` | No           | `Record<string, object>`         | Valori predefiniti leggeri di comprensione dei media per gli id provider dichiarati in `contracts.mediaUnderstandingProviders`.                                                                                                  |
| `channelConfigs`                     | No           | `Record<string, object>`         | Metadati di configurazione dei canali posseduti dal manifest uniti nelle superfici di discovery e validazione prima che il runtime venga caricato.                                                                              |
| `skills`                             | No           | `string[]`                       | Directory Skills da caricare, relative alla root del Plugin.                                                                                                                                                                      |
| `name`                               | No           | `string`                         | Nome leggibile del Plugin.                                                                                                                                                                                                        |
| `description`                        | No           | `string`                         | Breve riepilogo mostrato nelle superfici del Plugin.                                                                                                                                                                              |
| `version`                            | No           | `string`                         | Versione informativa del Plugin.                                                                                                                                                                                                  |
| `uiHints`                            | No           | `Record<string, object>`         | Etichette UI, placeholder e suggerimenti di sensibilità per i campi di configurazione.                                                                                                                                           |

## Riferimento `providerAuthChoices`

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o autenticazione.
OpenClaw la legge prima che il runtime del provider venga caricato.
Il flusso di configurazione del provider preferisce queste scelte del manifest, poi usa come fallback
i metadati della procedura guidata a runtime e le scelte del catalogo di installazione per compatibilità.

| Campo                 | Obbligatorio | Tipo                                            | Significato                                                                                              |
| --------------------- | ------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                        | Id del provider a cui appartiene questa scelta.                                                          |
| `method`              | Sì           | `string`                                        | Id del metodo di autenticazione a cui inviare.                                                           |
| `choiceId`            | Sì           | `string`                                        | Id stabile della scelta di autenticazione usato dai flussi di onboarding e CLI.                         |
| `choiceLabel`         | No           | `string`                                        | Etichetta visibile all'utente. Se omessa, OpenClaw usa come fallback `choiceId`.                        |
| `choiceHint`          | No           | `string`                                        | Breve testo di aiuto per il selettore.                                                                   |
| `assistantPriority`   | No           | `number`                                        | I valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.            |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell'assistente consentendo comunque la selezione manuale via CLI.     |
| `deprecatedChoiceIds` | No           | `string[]`                                      | Id legacy delle scelte che dovrebbero reindirizzare gli utenti a questa scelta sostitutiva.             |
| `groupId`             | No           | `string`                                        | Id di gruppo facoltativo per raggruppare scelte correlate.                                               |
| `groupLabel`          | No           | `string`                                        | Etichetta visibile all'utente per quel gruppo.                                                           |
| `groupHint`           | No           | `string`                                        | Breve testo di aiuto per il gruppo.                                                                      |
| `optionKey`           | No           | `string`                                        | Chiave di opzione interna per semplici flussi di autenticazione a singolo flag.                         |
| `cliFlag`             | No           | `string`                                        | Nome del flag CLI, come `--openrouter-api-key`.                                                          |
| `cliOption`           | No           | `string`                                        | Forma completa dell'opzione CLI, come `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nell'help CLI.                                                                         |
| `onboardingScopes`    | No           | `Array<"text-inference" \| "image-generation">` | In quali superfici di onboarding deve comparire questa scelta. Se omesso, il predefinito è `["text-inference"]`. |

## Riferimento `commandAliases`

Usa `commandAliases` quando un Plugin possiede un nome di comando runtime che gli utenti possono
mettere per errore in `plugins.allow` o provare a eseguire come comando CLI di root. OpenClaw
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
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash in chat invece che comando CLI di root. |
| `cliCommand` | No           | `string`          | Comando CLI di root correlato da suggerire per operazioni CLI, se esiste. |

## Riferimento `activation`

Usa `activation` quando il Plugin può dichiarare in modo economico quali eventi del control plane
dovrebbero includerlo in un piano di attivazione/caricamento.

Questo blocco è metadato del planner, non un'API del ciclo di vita. Non registra
comportamento runtime, non sostituisce `register(...)` e non promette che il
codice del Plugin sia già stato eseguito. Il planner di attivazione usa questi campi per
restringere i Plugin candidati prima di ricorrere ai metadati esistenti di proprietà del manifest
come `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hook.

Preferisci i metadati più stretti che descrivono già la proprietà. Usa
`providers`, `channels`, `commandAliases`, descrittori di setup o `contracts`
quando questi campi esprimono la relazione. Usa `activation` per suggerimenti aggiuntivi del planner
che non possono essere rappresentati da quei campi di proprietà.

Questo blocco contiene solo metadati. Non registra comportamento runtime e non
sostituisce `register(...)`, `setupEntry` o altri entrypoint runtime/Plugin.
Gli utilizzatori attuali lo usano come suggerimento di restringimento prima di un caricamento più ampio dei Plugin, quindi
la mancanza di metadati di attivazione di solito comporta solo un costo prestazionale; non dovrebbe
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

| Campo            | Obbligatorio | Tipo                                                 | Significato                                                                                              |
| ---------------- | ------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `onProviders`    | No           | `string[]`                                           | Id provider che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.                |
| `onCommands`     | No           | `string[]`                                           | Id comando che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.                 |
| `onChannels`     | No           | `string[]`                                           | Id canale che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.                  |
| `onRoutes`       | No           | `string[]`                                           | Tipi di route che dovrebbero includere questo Plugin nei piani di attivazione/caricamento.              |
| `onCapabilities` | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Suggerimenti generali di capacità usati dalla pianificazione di attivazione del control plane. Quando possibile, preferisci campi più stretti. |

Utilizzatori live attuali:

- la pianificazione CLI attivata dai comandi usa come fallback i valori legacy
  `commandAliases[].cliCommand` o `commandAliases[].name`
- la pianificazione setup/canale attivata dal canale usa come fallback la proprietà legacy `channels[]`
  quando mancano metadati espliciti di attivazione del canale
- la pianificazione setup/runtime attivata dal provider usa come fallback la proprietà legacy
  `providers[]` e `cliBackends[]` di primo livello quando mancano metadati espliciti di attivazione del provider

La diagnostica del planner può distinguere i suggerimenti espliciti di attivazione dai fallback di proprietà
del manifest. Per esempio, `activation-command-hint` significa che
`activation.onCommands` ha trovato una corrispondenza, mentre `manifest-command-alias` significa che il
planner ha usato invece la proprietà `commandAliases`. Queste etichette di motivo servono alla
diagnostica host e ai test; gli autori di Plugin dovrebbero continuare a dichiarare i metadati
che descrivono meglio la proprietà.

## Riferimento `qaRunners`

Usa `qaRunners` quando un Plugin contribuisce con uno o più runner di trasporto sotto
la root condivisa `openclaw qa`. Mantieni questi metadati economici e statici; il
runtime del Plugin continua a possedere l'effettiva registrazione CLI tramite una superficie
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

| Campo         | Obbligatorio | Tipo     | Significato                                                         |
| ------------- | ------------ | -------- | ------------------------------------------------------------------- |
| `commandName` | Sì           | `string` | Sottocomando montato sotto `openclaw qa`, per esempio `matrix`.     |
| `description` | No           | `string` | Testo di help fallback usato quando l'host condiviso ha bisogno di un comando stub. |

## Riferimento `setup`

Usa `setup` quando le superfici di setup e onboarding hanno bisogno di metadati di proprietà del Plugin
economici prima che il runtime venga caricato.

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
CLI inference. `setup.cliBackends` è la superficie descrittiva specifica del setup per
i flussi di setup/control plane che devono restare solo metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie di
lookup preferita e orientata ai descrittori per la discovery del setup. Se il descrittore
restringe solo il Plugin candidato e il setup ha ancora bisogno di hook runtime più ricchi al tempo di setup,
imposta `requiresRuntime: true` e mantieni `setup-api` come
percorso di esecuzione fallback.

OpenClaw include anche `setup.providers[].envVars` nei lookup generici di autenticazione provider e variabili env. `providerAuthEnvVars` resta supportato tramite un adattatore
di compatibilità durante la finestra di deprecazione, ma i Plugin non inclusi che continuano a usarlo
ricevono una diagnostica del manifest. I nuovi Plugin dovrebbero mettere i metadati env di setup/status
in `setup.providers[].envVars`.

OpenClaw può anche derivare semplici scelte di setup da `setup.providers[].authMethods`
quando non è disponibile alcuna voce setup, oppure quando `setup.requiresRuntime: false`
dichiara non necessario il runtime di setup. Le voci esplicite `providerAuthChoices` restano
preferite per etichette personalizzate, flag CLI, ambito di onboarding e metadati per l'assistente.

Imposta `requiresRuntime: false` solo quando questi descrittori sono sufficienti per la
superficie di setup. OpenClaw tratta `false` esplicito come un contratto solo descrittori
e non eseguirà `setup-api` o `openclaw.setupEntry` per il lookup del setup. Se
un Plugin solo descrittori distribuisce comunque uno di questi entry runtime di setup,
OpenClaw segnala una diagnostica additiva e continua a ignorarlo. Omettere
`requiresRuntime` mantiene il comportamento fallback legacy così i Plugin esistenti che hanno aggiunto
descrittori senza il flag non si rompono.

Poiché il lookup del setup può eseguire codice `setup-api` di proprietà del Plugin,
i valori normalizzati `setup.providers[].id` e `setup.cliBackends[]` devono restare univoci tra i Plugin rilevati. La proprietà ambigua fallisce in modo chiuso invece di scegliere un
vincitore in base all'ordine di discovery.

Quando il runtime di setup viene effettivamente eseguito, la diagnostica del registro di setup segnala deriva dei descrittori se `setup-api` registra un provider o un backend CLI che i descrittori del manifest non dichiarano, oppure se un descrittore non ha alcuna registrazione runtime corrispondente. Queste diagnostiche sono additive e non rifiutano i Plugin legacy.

### Riferimento `setup.providers`

| Campo         | Obbligatorio | Tipo       | Significato                                                                        |
| ------------- | ------------ | ---------- | ---------------------------------------------------------------------------------- |
| `id`          | Sì           | `string`   | Id provider esposto durante setup o onboarding. Mantieni univoci globalmente gli id normalizzati. |
| `authMethods` | No           | `string[]` | Id dei metodi setup/auth che questo provider supporta senza caricare il runtime completo. |
| `envVars`     | No           | `string[]` | Variabili env che le superfici generiche di setup/status possono controllare prima che il runtime del Plugin venga caricato. |

### Campi `setup`

| Campo              | Obbligatorio | Tipo       | Significato                                                                                     |
| ------------------ | ------------ | ---------- | ----------------------------------------------------------------------------------------------- |
| `providers`        | No           | `object[]` | Descrittori di setup del provider esposti durante setup e onboarding.                           |
| `cliBackends`      | No           | `string[]` | Id backend a tempo di setup usati per il lookup setup descriptor-first. Mantieni univoci globalmente gli id normalizzati. |
| `configMigrations` | No           | `string[]` | Id di migrazione della configurazione di proprietà della superficie setup di questo Plugin.     |
| `requiresRuntime`  | No           | `boolean`  | Se il setup richiede ancora l'esecuzione di `setup-api` dopo il lookup del descrittore.        |

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

| Campo         | Tipo       | Significato                               |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Etichetta del campo visibile all'utente.  |
| `help`        | `string`   | Breve testo di aiuto.                     |
| `tags`        | `string[]` | Tag UI facoltativi.                       |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.      |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo placeholder per gli input del form. |

## Riferimento `contracts`

Usa `contracts` solo per metadati statici di proprietà delle capacità che OpenClaw può
leggere senza importare il runtime del Plugin.

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

| Campo                            | Tipo       | Significato                                                            |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Id delle factory di estensioni app-server Codex, attualmente `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Id runtime per cui un Plugin incluso può registrare middleware dei risultati degli strumenti. |
| `externalAuthProviders`          | `string[]` | Id provider il cui hook di profilo di autenticazione esterna appartiene a questo Plugin. |
| `speechProviders`                | `string[]` | Id dei provider speech di proprietà di questo Plugin.                  |
| `realtimeTranscriptionProviders` | `string[]` | Id dei provider di trascrizione realtime di proprietà di questo Plugin. |
| `realtimeVoiceProviders`         | `string[]` | Id dei provider di voce realtime di proprietà di questo Plugin.        |
| `memoryEmbeddingProviders`       | `string[]` | Id dei provider di embedding della memoria di proprietà di questo Plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Id dei provider di comprensione dei media di proprietà di questo Plugin. |
| `imageGenerationProviders`       | `string[]` | Id dei provider di generazione immagini di proprietà di questo Plugin. |
| `videoGenerationProviders`       | `string[]` | Id dei provider di generazione video di proprietà di questo Plugin.    |
| `webFetchProviders`              | `string[]` | Id dei provider web-fetch di proprietà di questo Plugin.               |
| `webSearchProviders`             | `string[]` | Id dei provider web search di proprietà di questo Plugin.              |
| `tools`                          | `string[]` | Nomi degli strumenti agente di proprietà di questo Plugin per i controlli di contratto inclusi. |

`contracts.embeddedExtensionFactories` viene mantenuto per factory di estensioni
solo app-server Codex incluse. Le trasformazioni incluse dei risultati degli strumenti
dovrebbero dichiarare `contracts.agentToolResultMiddleware` e registrarsi con
`api.registerAgentToolResultMiddleware(...)` invece. I Plugin esterni non possono
registrare middleware dei risultati degli strumenti perché questa seam può riscrivere output di strumenti ad alta fiducia prima che il modello li veda.

I Plugin provider che implementano `resolveExternalAuthProfiles` dovrebbero dichiarare
`contracts.externalAuthProviders`. I Plugin senza la dichiarazione continuano comunque a essere eseguiti tramite un fallback di compatibilità deprecato, ma quel fallback è più lento e
verrà rimosso dopo la finestra di migrazione.

I provider di embedding della memoria inclusi dovrebbero dichiarare
`contracts.memoryEmbeddingProviders` per ogni id adattatore che espongono, inclusi
gli adattatori integrati come `local`. I percorsi CLI standalone usano questo contratto del manifest per caricare solo il Plugin proprietario prima che il runtime completo del Gateway abbia
registrato i provider.

## Riferimento `mediaUnderstandingProviderMetadata`

Usa `mediaUnderstandingProviderMetadata` quando un provider di comprensione dei media ha
modelli predefiniti, priorità fallback di auto-auth o supporto nativo per documenti di cui
gli helper generici core hanno bisogno prima che il runtime venga caricato. Le chiavi devono anche essere dichiarate in
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

| Campo                  | Tipo                                | Significato                                                                   |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Capacità multimediali esposte da questo provider.                             |
| `defaultModels`        | `Record<string, string>`            | Predefiniti capacità-modello usati quando la configurazione non specifica un modello. |
| `autoPriority`         | `Record<string, number>`            | I numeri più bassi vengono ordinati prima per il fallback automatico del provider basato sulle credenziali. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Input documento nativi supportati dal provider.                               |

## Riferimento `channelConfigs`

Usa `channelConfigs` quando un canale Plugin ha bisogno di metadati di configurazione economici prima
che il runtime venga caricato. La discovery read-only di setup/status del canale può usare questi metadati
direttamente per canali esterni configurati quando non è disponibile alcuna voce setup, oppure
quando `setup.requiresRuntime: false` dichiara non necessario il runtime di setup.

Per un canale Plugin, `configSchema` e `channelConfigs` descrivono percorsi diversi:

- `configSchema` valida `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` valida `channels.<channel-id>`

I Plugin non inclusi che dichiarano `channels[]` dovrebbero anche dichiarare voci `channelConfigs`
corrispondenti. Senza di esse, OpenClaw può ancora caricare il Plugin, ma
le superfici di schema della configurazione cold-path, setup e Control UI non possono conoscere la forma delle opzioni possedute dal canale finché il runtime del Plugin non viene eseguito.

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

| Campo         | Tipo                     | Significato                                                                                     |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema per `channels.<id>`. Obbligatorio per ogni voce dichiarata di configurazione canale. |
| `uiHints`     | `Record<string, object>` | Etichette UI/placeholder/suggerimenti di sensibilità facoltativi per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita nelle superfici di selezione e ispezione quando i metadati runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per superfici di ispezione e catalogo.                             |
| `preferOver`  | `string[]`               | Id Plugin legacy o a priorità inferiore che questo canale dovrebbe superare nelle superfici di selezione. |

## Riferimento `modelSupport`

Usa `modelSupport` quando OpenClaw deve inferire il tuo Plugin provider da
id di modello abbreviati come `gpt-5.5` o `claude-sonnet-4.6` prima che il runtime del Plugin
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

- i ref espliciti `provider/model` usano i metadati `providers` del manifest proprietario
- `modelPatterns` prevale su `modelPrefixes`
- se corrispondono sia un Plugin non incluso sia uno incluso, vince il Plugin non incluso
- l'ambiguità residua viene ignorata finché l'utente o la configurazione non specificano un provider

Campi:

| Campo           | Tipo       | Significato                                                                    |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli id di modello abbreviati.  |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate con gli id di modello abbreviati dopo la rimozione del suffisso del profilo. |

## Riferimento `modelCatalog`

Usa `modelCatalog` quando OpenClaw deve conoscere i metadati del modello provider prima
di caricare il runtime del Plugin. Questa è la sorgente posseduta dal manifest per righe fisse
di catalogo, alias provider, regole di soppressione e modalità di discovery. L'aggiornamento a runtime
continua comunque ad appartenere al codice runtime del provider, ma il manifest dice al core quando il runtime
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

| Campo          | Tipo                                                     | Significato                                                                                                  |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `providers`    | `Record<string, object>`                                 | Righe di catalogo per gli id provider di proprietà di questo Plugin. Le chiavi dovrebbero comparire anche in `providers` di primo livello. |
| `aliases`      | `Record<string, object>`                                 | Alias provider che dovrebbero risolversi a un provider posseduto per la pianificazione di catalogo o soppressione. |
| `suppressions` | `object[]`                                               | Righe di modello da un'altra sorgente che questo Plugin sopprime per un motivo specifico del provider.      |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Se il catalogo provider può essere letto dai metadati del manifest, aggiornato in cache o richiede il runtime. |

Campi provider:

| Campo     | Tipo                     | Significato                                                           |
| --------- | ------------------------ | --------------------------------------------------------------------- |
| `baseUrl` | `string`                 | Base URL predefinito facoltativo per i modelli in questo catalogo provider. |
| `api`     | `ModelApi`               | Adattatore API predefinito facoltativo per i modelli in questo catalogo provider. |
| `headers` | `Record<string, string>` | Header statici facoltativi che si applicano a questo catalogo provider. |
| `models`  | `object[]`               | Righe modello obbligatorie. Le righe senza `id` vengono ignorate.     |

Campi modello:

| Campo           | Tipo                                                           | Significato                                                                |
| --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Id del modello locale al provider, senza il prefisso `provider/`.          |
| `name`          | `string`                                                       | Nome visualizzato facoltativo.                                             |
| `api`           | `ModelApi`                                                     | Override API per modello facoltativo.                                      |
| `baseUrl`       | `string`                                                       | Override `baseUrl` per modello facoltativo.                                |
| `headers`       | `Record<string, string>`                                       | Header statici per modello facoltativi.                                    |
| `input`         | `Array<"text" \| "image" \| "document">`                       | Modalità accettate dal modello.                                            |
| `reasoning`     | `boolean`                                                      | Se il modello espone comportamento di reasoning.                           |
| `contextWindow` | `number`                                                       | Finestra di contesto nativa del provider.                                  |
| `contextTokens` | `number`                                                       | Limite effettivo facoltativo del contesto a runtime quando differisce da `contextWindow`. |
| `maxTokens`     | `number`                                                       | Token massimi in output quando noti.                                       |
| `cost`          | `object`                                                       | Prezzi facoltativi in USD per milione di token, incluso `tieredPricing` facoltativo. |
| `compat`        | `object`                                                       | Flag di compatibilità facoltativi che corrispondono alla compatibilità della configurazione modello di OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Stato dell'elenco. Sopprimi solo quando la riga non deve comparire affatto. |
| `statusReason`  | `string`                                                       | Motivo facoltativo mostrato con stato non disponibile.                     |
| `replaces`      | `string[]`                                                     | Id di modelli locali al provider più vecchi che questo modello sostituisce. |
| `replacedBy`    | `string`                                                       | Id del modello locale al provider sostitutivo per righe deprecate.         |
| `tags`          | `string[]`                                                     | Tag stabili usati da selettori e filtri.                                   |

Non inserire dati solo runtime in `modelCatalog`. Se un provider ha bisogno di stato
dell'account, di una richiesta API o della discovery di un processo locale per conoscere l'insieme completo dei modelli, dichiara quel provider come `refreshable` o `runtime` in `discovery`.

Le chiavi legacy delle capacità di primo livello sono deprecate. Usa `openclaw doctor --fix` per
spostare `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale
caricamento del manifest non tratta più quei campi di primo livello come
proprietà delle capacità.

## Manifest rispetto a package.json

I due file svolgono compiti diversi:

| File                   | Usalo per                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, validazione della configurazione, metadati delle scelte di autenticazione e suggerimenti UI che devono esistere prima che il codice del Plugin venga eseguito |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per entrypoint, gating dell'installazione, setup o metadati di catalogo |

Se non sei sicuro di dove appartenga un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del Plugin, mettilo in `openclaw.plugin.json`
- se riguarda packaging, file di entry o comportamento di installazione npm, mettilo in `package.json`

### Campi `package.json` che influenzano la discovery

Alcuni metadati del Plugin pre-runtime vivono intenzionalmente in `package.json` sotto il
blocco `openclaw` invece che in `openclaw.plugin.json`.

Esempi importanti:

| Campo                                                             | Significato                                                                                                                                                                         |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Dichiara gli entrypoint nativi del Plugin. Devono restare all'interno della directory del pacchetto Plugin.                                                                        |
| `openclaw.runtimeExtensions`                                      | Dichiara gli entrypoint runtime JavaScript compilati per i pacchetti installati. Devono restare all'interno della directory del pacchetto Plugin.                                  |
| `openclaw.setupEntry`                                             | Entry point leggero solo setup usato durante onboarding, avvio differito del canale e discovery read-only di stato del canale/SecretRef. Deve restare all'interno della directory del pacchetto Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Dichiara l'entrypoint setup JavaScript compilato per i pacchetti installati. Deve restare all'interno della directory del pacchetto Plugin.                                         |
| `openclaw.channel`                                                | Metadati economici del catalogo canali come etichette, percorsi documentazione, alias e testo di selezione.                                                                       |
| `openclaw.channel.configuredState`                                | Metadati leggeri del controllo di stato configurato che possono rispondere a “esiste già una configurazione solo env?” senza caricare il runtime completo del canale.               |
| `openclaw.channel.persistedAuthState`                             | Metadati leggeri del controllo di autenticazione persistita che possono rispondere a “c'è già qualcosa con accesso effettuato?” senza caricare il runtime completo del canale.      |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Suggerimenti di installazione/aggiornamento per Plugin inclusi e pubblicati esternamente.                                                                                          |
| `openclaw.install.defaultChoice`                                  | Percorso di installazione preferito quando sono disponibili più sorgenti di installazione.                                                                                          |
| `openclaw.install.minHostVersion`                                 | Versione minima supportata dell'host OpenClaw, usando una soglia semver come `>=2026.3.22`.                                                                                        |
| `openclaw.install.expectedIntegrity`                              | Stringa di integrità dist npm attesa come `sha512-...`; i flussi di installazione e aggiornamento verificano l'artefatto scaricato rispetto a essa.                                |
| `openclaw.install.allowInvalidConfigRecovery`                     | Consente un percorso ristretto di recupero con reinstallazione di Plugin inclusi quando la configurazione non è valida.                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Consente alle superfici del canale solo setup di caricarsi prima del Plugin completo del canale durante l'avvio.                                                                   |

I metadati del manifest decidono quali scelte di provider/canale/setup compaiono
nell'onboarding prima che il runtime venga caricato. `package.json#openclaw.install` dice invece
all'onboarding come recuperare o abilitare quel Plugin quando l'utente sceglie una di quelle
opzioni. Non spostare i suggerimenti di installazione in `openclaw.plugin.json`.

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il caricamento del
registro dei manifest. I valori non validi vengono rifiutati; i valori validi ma più recenti saltano il
Plugin sugli host più vecchi.

Il pinning esatto della versione npm vive già in `npmSpec`, per esempio
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Le voci ufficiali del catalogo esterno
dovrebbero abbinare spec esatte a `expectedIntegrity` così i flussi di aggiornamento falliscono
in modo chiuso se l'artefatto npm recuperato non corrisponde più alla release fissata.
L'onboarding interattivo continua a offrire spec npm del registro trusted, inclusi nomi di
pacchetto semplici e dist-tag, per compatibilità. La diagnostica del catalogo può
distinguere sorgenti esatte, floating, con pin di integrità, senza integrità, con mismatch del nome del pacchetto e con default-choice non valida. Avvisa anche quando
`expectedIntegrity` è presente ma non esiste alcuna sorgente npm valida che possa fissarla.
Quando `expectedIntegrity` è presente,
i flussi di installazione/aggiornamento lo applicano; quando viene omesso, la risoluzione del registro viene
registrata senza pin di integrità.

I Plugin di canale dovrebbero fornire `openclaw.setupEntry` quando stato, elenco canali
o scansioni SecretRef hanno bisogno di identificare account configurati senza caricare il runtime completo.
La voce setup dovrebbe esporre metadati del canale più adattatori di configurazione, stato e segreti sicuri per il setup; mantieni client di rete, listener del gateway e runtime di trasporto nell'entrypoint principale dell'estensione.

I campi dell'entrypoint runtime non sovrascrivono i controlli del confine del pacchetto per i campi
dell'entrypoint sorgente. Per esempio, `openclaw.runtimeExtensions` non può rendere caricabile
un percorso `openclaw.extensions` che esce dai confini.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente ristretto. Non
rende installabili configurazioni arbitrarie rotte. Oggi consente solo ai flussi di installazione
di recuperare da specifici fallimenti obsoleti di upgrade di Plugin inclusi, come un
percorso mancante di Plugin incluso o una voce obsoleta `channels.<id>` per quello stesso
Plugin incluso. Gli errori di configurazione non correlati continuano a bloccare l'installazione e a inviare gli operatori a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` è metadato di pacchetto per un piccolo modulo
di controllo:

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

Usalo quando setup, doctor o flussi configured-state hanno bisogno di un probe yes/no
economico sull'autenticazione prima che il Plugin completo del canale venga caricato. L'export di destinazione dovrebbe essere una piccola
funzione che legge solo lo stato persistito; non instradarla attraverso il barrel runtime completo
del canale.

`openclaw.channel.configuredState` segue la stessa forma per controlli configured-state
economici solo env:

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

Usalo quando un canale può rispondere allo stato configurato da env o da altri input minimi
non runtime. Se il controllo richiede la risoluzione completa della configurazione o il vero
runtime del canale, mantieni quella logica nell'hook `config.hasConfiguredState`
del Plugin.

## Precedenza della discovery (id Plugin duplicati)

OpenClaw rileva i Plugin da diverse root (inclusi, installazione globale, workspace, percorsi selezionati esplicitamente dalla configurazione). Se due discovery condividono lo stesso `id`, viene mantenuto solo il manifest con **precedenza più alta**; i duplicati a precedenza inferiore vengono scartati invece di essere caricati accanto.

Precedenza, dalla più alta alla più bassa:

1. **Selezionato dalla configurazione** — un percorso fissato esplicitamente in `plugins.entries.<id>`
2. **Incluso** — Plugin distribuiti con OpenClaw
3. **Installazione globale** — Plugin installati nella root globale dei Plugin OpenClaw
4. **Workspace** — Plugin rilevati relativamente allo spazio di lavoro corrente

Implicazioni:

- Una copia forkata o obsoleta di un Plugin incluso presente nello spazio di lavoro non sostituirà la build inclusa.
- Per sovrascrivere davvero un Plugin incluso con uno locale, fissalo tramite `plugins.entries.<id>` così vinca per precedenza invece di affidarti alla discovery dello spazio di lavoro.
- Gli scarti per duplicato vengono registrati nei log così Doctor e la diagnostica di avvio possono indicare la copia scartata.

## Requisiti JSON Schema

- **Ogni Plugin deve distribuire un JSON Schema**, anche se non accetta configurazione.
- È accettabile uno schema vuoto (per esempio, `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono validati al momento della lettura/scrittura della configurazione, non a runtime.

## Comportamento di validazione

- Le chiavi sconosciute `channels.*` sono **errori**, a meno che l'id canale non sia dichiarato da
  un manifest del Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono fare riferimento a id Plugin **rilevabili**. Gli id sconosciuti sono **errori**.
- Se un Plugin è installato ma ha un manifest o uno schema rotto o mancante,
  la validazione fallisce e Doctor segnala l'errore del Plugin.
- Se la configurazione del Plugin esiste ma il Plugin è **disabilitato**, la configurazione viene mantenuta e
  un **avviso** viene mostrato in Doctor + log.

Vedi [Configuration reference](/it/gateway/configuration) per lo schema completo `plugins.*`.

## Note

- Il manifest è **obbligatorio per i Plugin OpenClaw nativi**, inclusi i caricamenti da filesystem locale. Il runtime continua comunque a caricare separatamente il modulo del Plugin; il manifest serve solo per discovery + validazione.
- I manifest nativi vengono analizzati con JSON5, quindi commenti, virgole finali e chiavi non quotate sono accettati purché il valore finale resti un oggetto.
- Solo i campi del manifest documentati vengono letti dal loader del manifest. Evita chiavi personalizzate di primo livello.
- `channels`, `providers`, `cliBackends` e `skills` possono tutti essere omessi quando un Plugin non ne ha bisogno.
- `providerDiscoveryEntry` deve restare leggero e non dovrebbe importare codice runtime ampio; usalo per metadati statici del catalogo provider o descrittori di discovery ristretti, non per esecuzione al momento della richiesta.
- I tipi esclusivi di Plugin vengono selezionati tramite `plugins.slots.*`: `kind: "memory"` tramite `plugins.slots.memory`, `kind: "context-engine"` tramite `plugins.slots.contextEngine` (predefinito `legacy`).
- I metadati delle variabili env (`setup.providers[].envVars`, il deprecato `providerAuthEnvVars` e `channelEnvVars`) sono solo dichiarativi. Stato, audit, validazione della consegna Cron e altre superfici di sola lettura continuano comunque ad applicare la policy di fiducia del Plugin e di attivazione effettiva prima di trattare una variabile env come configurata.
- Per i metadati runtime della procedura guidata che richiedono codice provider, vedi [Provider runtime hooks](/it/plugins/architecture-internals#provider-runtime-hooks).
- Se il tuo Plugin dipende da moduli nativi, documenta i passaggi di build e gli eventuali requisiti di allowlist del package manager (per esempio `allow-build-scripts` di pnpm + `pnpm rebuild <package>`).

## Correlati

<CardGroup cols={3}>
  <Card title="Creare Plugin" href="/it/plugins/building-plugins" icon="rocket">
    Per iniziare con i Plugin.
  </Card>
  <Card title="Architettura dei Plugin" href="/it/plugins/architecture" icon="diagram-project">
    Architettura interna e modello delle capacità.
  </Card>
  <Card title="Panoramica SDK" href="/it/plugins/sdk-overview" icon="book">
    Riferimento dell'SDK Plugin e import subpath.
  </Card>
</CardGroup>
