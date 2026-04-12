---
read_when:
    - Stai creando un Plugin OpenClaw
    - Devi distribuire uno schema di configurazione del Plugin o eseguire il debug degli errori di validazione del Plugin
summary: Manifest del Plugin + requisiti dello schema JSON (validazione rigorosa della configurazione)
title: Manifest del Plugin
x-i18n:
    generated_at: "2026-04-12T23:28:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93b57c7373e4ccd521b10945346db67991543bd2bed4cc8b6641e1f215b48579
    source_path: plugins/manifest.md
    workflow: 15
---

# Manifest del Plugin (`openclaw.plugin.json`)

Questa pagina riguarda solo il **manifest nativo dei Plugin OpenClaw**.

Per i layout di bundle compatibili, vedi [Bundle di Plugin](/it/plugins/bundles).

I formati di bundle compatibili usano file manifest diversi:

- Bundle Codex: `.codex-plugin/plugin.json`
- Bundle Claude: `.claude-plugin/plugin.json` oppure il layout predefinito dei componenti Claude
  senza manifest
- Bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw rileva automaticamente anche questi layout di bundle, ma non vengono validati
rispetto allo schema `openclaw.plugin.json` descritto qui.

Per i bundle compatibili, OpenClaw attualmente legge i metadati del bundle più le radici
Skills dichiarate, le radici dei comandi Claude, i valori predefiniti di `settings.json` dei bundle Claude,
i valori predefiniti LSP dei bundle Claude e i pacchetti hook supportati quando il layout corrisponde
alle aspettative di runtime di OpenClaw.

Ogni Plugin OpenClaw nativo **deve** includere un file `openclaw.plugin.json` nella
**radice del Plugin**. OpenClaw usa questo manifest per validare la configurazione
**senza eseguire il codice del Plugin**. I manifest mancanti o non validi vengono trattati come
errori del Plugin e bloccano la validazione della configurazione.

Consulta la guida completa al sistema dei Plugin: [Plugins](/it/tools/plugin).
Per il modello nativo di capability e le indicazioni correnti sulla compatibilità esterna:
[Modello di capability](/it/plugins/architecture#public-capability-model).

## A cosa serve questo file

`openclaw.plugin.json` è il metadato che OpenClaw legge prima di caricare il codice
del tuo Plugin.

Usalo per:

- identità del Plugin
- validazione della configurazione
- metadati di autenticazione e onboarding che devono essere disponibili senza avviare il runtime del Plugin
- hint di attivazione leggeri che le superfici del control plane possono ispezionare prima del caricamento del runtime
- descrittori di setup leggeri che le superfici di setup/onboarding possono ispezionare prima del caricamento del runtime
- metadati di alias e auto-abilitazione che devono essere risolti prima del caricamento del runtime del Plugin
- metadati abbreviati di ownership della famiglia di modelli che devono auto-attivare il Plugin prima del caricamento del runtime
- snapshot statiche di ownership delle capability usate per il wiring di compatibilità dei bundle e la copertura dei contratti
- metadati di configurazione specifici del canale che devono essere uniti alle superfici di catalogo e validazione senza caricare il runtime
- hint UI di configurazione

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
| `id`                                | Sì           | `string`                         | ID canonico del Plugin. È l'ID usato in `plugins.entries.<id>`.                                                                                                                                              |
| `configSchema`                      | Sì           | `object`                         | Schema JSON inline per la configurazione di questo Plugin.                                                                                                                                                    |
| `enabledByDefault`                  | No           | `true`                           | Contrassegna un Plugin bundle come abilitato per impostazione predefinita. Omettilo, oppure imposta qualsiasi valore diverso da `true`, per lasciare il Plugin disabilitato per impostazione predefinita. |
| `legacyPluginIds`                   | No           | `string[]`                       | ID legacy che vengono normalizzati a questo ID canonico del Plugin.                                                                                                                                           |
| `autoEnableWhenConfiguredProviders` | No           | `string[]`                       | ID provider che devono auto-abilitare questo Plugin quando auth, config o riferimenti ai modelli li menzionano.                                                                                              |
| `kind`                              | No           | `"memory"` \| `"context-engine"` | Dichiara un tipo esclusivo di Plugin usato da `plugins.slots.*`.                                                                                                                                              |
| `channels`                          | No           | `string[]`                       | ID canale posseduti da questo Plugin. Usati per il rilevamento e la validazione della configurazione.                                                                                                        |
| `providers`                         | No           | `string[]`                       | ID provider posseduti da questo Plugin.                                                                                                                                                                       |
| `modelSupport`                      | No           | `object`                         | Metadati abbreviati di famiglie di modelli posseduti dal manifest usati per auto-caricare il Plugin prima del runtime.                                                                                      |
| `cliBackends`                       | No           | `string[]`                       | ID backend CLI posseduti da questo Plugin. Usati per l'auto-attivazione all'avvio da riferimenti di configurazione espliciti.                                                                               |
| `commandAliases`                    | No           | `object[]`                       | Nomi di comandi posseduti da questo Plugin che devono produrre diagnostica CLI e di configurazione consapevole del Plugin prima del caricamento del runtime.                                                |
| `providerAuthEnvVars`               | No           | `Record<string, string[]>`       | Metadati env leggeri per l'autenticazione del provider che OpenClaw può ispezionare senza caricare il codice del Plugin.                                                                                    |
| `providerAuthAliases`               | No           | `Record<string, string>`         | ID provider che devono riutilizzare un altro ID provider per la ricerca auth, ad esempio un provider coding che condivide la chiave API del provider di base e i profili auth.                             |
| `channelEnvVars`                    | No           | `Record<string, string[]>`       | Metadati env leggeri di canale che OpenClaw può ispezionare senza caricare il codice del Plugin. Usali per superfici di setup o auth del canale basate su env che gli helper generici di avvio/config devono vedere. |
| `providerAuthChoices`               | No           | `object[]`                       | Metadati leggeri delle scelte auth per selettori di onboarding, risoluzione del provider preferito e semplice wiring dei flag CLI.                                                                          |
| `activation`                        | No           | `object`                         | Hint di attivazione leggeri per caricamento attivato da provider, comando, canale, route e capability. Solo metadati; il runtime del Plugin resta responsabile del comportamento effettivo.               |
| `setup`                             | No           | `object`                         | Descrittori leggeri di setup/onboarding che le superfici di rilevamento e setup possono ispezionare senza caricare il runtime del Plugin.                                                                  |
| `contracts`                         | No           | `object`                         | Snapshot statica delle capability bundle per trascrizione vocale, voce realtime, comprensione dei media, generazione di immagini, generazione musicale, generazione video, recupero web, ricerca web e ownership degli strumenti. |
| `channelConfigs`                    | No           | `Record<string, object>`         | Metadati di configurazione del canale posseduti dal manifest uniti alle superfici di rilevamento e validazione prima del caricamento del runtime.                                                           |
| `skills`                            | No           | `string[]`                       | Directory Skills da caricare, relative alla radice del Plugin.                                                                                                                                               |
| `name`                              | No           | `string`                         | Nome del Plugin leggibile dall'utente.                                                                                                                                                                        |
| `description`                       | No           | `string`                         | Breve riepilogo mostrato nelle superfici del Plugin.                                                                                                                                                          |
| `version`                           | No           | `string`                         | Versione informativa del Plugin.                                                                                                                                                                              |
| `uiHints`                           | No           | `Record<string, object>`         | Etichette UI, placeholder e hint di sensibilità per i campi di configurazione.                                                                                                                               |

## Riferimento `providerAuthChoices`

Ogni voce `providerAuthChoices` descrive una scelta di onboarding o autenticazione.
OpenClaw la legge prima che il runtime del provider venga caricato.

| Campo                 | Obbligatorio | Tipo                                            | Significato                                                                                              |
| --------------------- | ------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Sì           | `string`                                        | ID del provider a cui appartiene questa scelta.                                                          |
| `method`              | Sì           | `string`                                        | ID del metodo di autenticazione a cui inviare.                                                           |
| `choiceId`            | Sì           | `string`                                        | ID stabile della scelta di autenticazione usato dai flussi di onboarding e CLI.                         |
| `choiceLabel`         | No           | `string`                                        | Etichetta visibile all'utente. Se omessa, OpenClaw usa `choiceId` come fallback.                         |
| `choiceHint`          | No           | `string`                                        | Breve testo di supporto per il selettore.                                                                |
| `assistantPriority`   | No           | `number`                                        | I valori più bassi vengono ordinati prima nei selettori interattivi guidati dall'assistente.            |
| `assistantVisibility` | No           | `"visible"` \| `"manual-only"`                  | Nasconde la scelta dai selettori dell'assistente consentendo comunque la selezione manuale via CLI.     |
| `deprecatedChoiceIds` | No           | `string[]`                                      | ID legacy delle scelte che devono reindirizzare gli utenti a questa scelta sostitutiva.                 |
| `groupId`             | No           | `string`                                        | ID facoltativo del gruppo per raggruppare scelte correlate.                                              |
| `groupLabel`          | No           | `string`                                        | Etichetta visibile all'utente per quel gruppo.                                                           |
| `groupHint`           | No           | `string`                                        | Breve testo di supporto per il gruppo.                                                                   |
| `optionKey`           | No           | `string`                                        | Chiave di opzione interna per flussi di autenticazione semplici con un solo flag.                        |
| `cliFlag`             | No           | `string`                                        | Nome del flag CLI, come `--openrouter-api-key`.                                                          |
| `cliOption`           | No           | `string`                                        | Forma completa dell'opzione CLI, come `--openrouter-api-key <key>`.                                      |
| `cliDescription`      | No           | `string`                                        | Descrizione usata nell'help della CLI.                                                                   |
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

| Campo        | Obbligatorio | Tipo              | Significato                                                                     |
| ------------ | ------------ | ----------------- | ------------------------------------------------------------------------------- |
| `name`       | Sì           | `string`          | Nome del comando che appartiene a questo Plugin.                                |
| `kind`       | No           | `"runtime-slash"` | Contrassegna l'alias come comando slash della chat invece che come comando CLI di root. |
| `cliCommand` | No           | `string`          | Comando CLI di root correlato da suggerire per operazioni CLI, se esiste.      |

## Riferimento `activation`

Usa `activation` quando il Plugin può dichiarare in modo economico quali eventi del control plane
dovrebbero attivarlo in seguito.

Questo blocco è solo metadati. Non registra il comportamento di runtime e non
sostituisce `register(...)`, `setupEntry` o altri entrypoint di runtime/Plugin.
I consumer attuali lo usano come hint di restringimento prima di un caricamento più ampio del Plugin, quindi
la mancanza di metadati di attivazione in genere comporta solo un costo in termini di prestazioni; non dovrebbe
cambiare la correttezza finché esistono ancora i fallback legacy di ownership nel manifest.

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

| Campo            | Obbligatorio | Tipo                                                 | Significato                                                      |
| ---------------- | ------------ | ---------------------------------------------------- | ---------------------------------------------------------------- |
| `onProviders`    | No           | `string[]`                                           | ID provider che devono attivare questo Plugin quando richiesti.  |
| `onCommands`     | No           | `string[]`                                           | ID comando che devono attivare questo Plugin.                    |
| `onChannels`     | No           | `string[]`                                           | ID canale che devono attivare questo Plugin.                     |
| `onRoutes`       | No           | `string[]`                                           | Tipi di route che devono attivare questo Plugin.                 |
| `onCapabilities` | No           | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Hint di capability ampie usati dalla pianificazione di attivazione del control plane. |

Consumer live attuali:

- la pianificazione CLI attivata da comandi usa come fallback
  `commandAliases[].cliCommand` legacy oppure `commandAliases[].name`
- la pianificazione di setup/canale attivata dal canale usa come fallback l'ownership legacy `channels[]`
  quando mancano metadati espliciti di attivazione del canale
- la pianificazione di setup/runtime attivata dal provider usa come fallback l'ownership legacy
  `providers[]` e `cliBackends[]` di primo livello quando mancano metadati espliciti di attivazione
  del provider

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

`cliBackends` di primo livello rimane valido e continua a descrivere i backend di inferenza CLI.
`setup.cliBackends` è la superficie descrittiva specifica del setup per i flussi di
control plane/setup che devono restare solo metadati.

Quando presenti, `setup.providers` e `setup.cliBackends` sono la superficie di lookup preferita,
basata prima sui descrittori, per il rilevamento del setup. Se il descrittore restringe soltanto
il Plugin candidato e il setup ha ancora bisogno di hook di runtime più ricchi in fase di setup,
imposta `requiresRuntime: true` e mantieni `setup-api` come percorso di esecuzione di fallback.

Poiché il lookup del setup può eseguire codice `setup-api` posseduto dal Plugin, i valori normalizzati
di `setup.providers[].id` e `setup.cliBackends[]` devono restare univoci tra i Plugin rilevati.
Un'ownership ambigua fallisce in modo conservativo invece di scegliere un vincitore in base all'ordine di rilevamento.

### Riferimento `setup.providers`

| Campo         | Obbligatorio | Tipo       | Significato                                                                          |
| ------------- | ------------ | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Sì           | `string`   | ID provider esposto durante setup o onboarding. Mantieni gli ID normalizzati globalmente univoci. |
| `authMethods` | No           | `string[]` | ID dei metodi di setup/auth supportati da questo provider senza caricare il runtime completo. |
| `envVars`     | No           | `string[]` | Variabili env che le superfici generiche di setup/stato possono controllare prima del caricamento del runtime del Plugin. |

### Campi `setup`

| Campo              | Obbligatorio | Tipo       | Significato                                                                                         |
| ------------------ | ------------ | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | No           | `object[]` | Descrittori di setup del provider esposti durante setup e onboarding.                               |
| `cliBackends`      | No           | `string[]` | ID backend in fase di setup usati per il lookup del setup basato prima sui descrittori. Mantieni gli ID normalizzati globalmente univoci. |
| `configMigrations` | No           | `string[]` | ID di migrazione della configurazione posseduti dalla superficie di setup di questo Plugin.         |
| `requiresRuntime`  | No           | `boolean`  | Indica se il setup necessita ancora dell'esecuzione di `setup-api` dopo il lookup del descrittore. |

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

| Campo         | Tipo       | Significato                               |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Etichetta del campo visibile all'utente.  |
| `help`        | `string`   | Breve testo di supporto.                  |
| `tags`        | `string[]` | Tag UI facoltativi.                       |
| `advanced`    | `boolean`  | Contrassegna il campo come avanzato.      |
| `sensitive`   | `boolean`  | Contrassegna il campo come segreto o sensibile. |
| `placeholder` | `string`   | Testo segnaposto per gli input del modulo. |

## Riferimento `contracts`

Usa `contracts` solo per metadati statici di ownership delle capability che OpenClaw può
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
| `speechProviders`                | `string[]` | ID dei provider vocali posseduti da questo Plugin.           |
| `realtimeTranscriptionProviders` | `string[]` | ID dei provider di trascrizione realtime posseduti da questo Plugin. |
| `realtimeVoiceProviders`         | `string[]` | ID dei provider vocali realtime posseduti da questo Plugin.  |
| `mediaUnderstandingProviders`    | `string[]` | ID dei provider di comprensione dei media posseduti da questo Plugin. |
| `imageGenerationProviders`       | `string[]` | ID dei provider di generazione di immagini posseduti da questo Plugin. |
| `videoGenerationProviders`       | `string[]` | ID dei provider di generazione video posseduti da questo Plugin. |
| `webFetchProviders`              | `string[]` | ID dei provider di recupero web posseduti da questo Plugin.  |
| `webSearchProviders`             | `string[]` | ID dei provider di ricerca web posseduti da questo Plugin.   |
| `tools`                          | `string[]` | Nomi degli strumenti dell'agente posseduti da questo Plugin per i controlli dei contratti bundle. |

## Riferimento `channelConfigs`

Usa `channelConfigs` quando un Plugin di canale ha bisogno di metadati di configurazione economici prima
del caricamento del runtime.

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

Ogni voce di canale può includere:

| Campo         | Tipo                     | Significato                                                                                   |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | Schema JSON per `channels.<id>`. Obbligatorio per ogni voce dichiarata di configurazione del canale. |
| `uiHints`     | `Record<string, object>` | Etichette UI, placeholder e hint di sensibilità facoltativi per quella sezione di configurazione del canale. |
| `label`       | `string`                 | Etichetta del canale unita alle superfici di selezione e ispezione quando i metadati di runtime non sono pronti. |
| `description` | `string`                 | Breve descrizione del canale per le superfici di ispezione e catalogo.                       |
| `preferOver`  | `string[]`               | ID di Plugin legacy o a priorità inferiore che questo canale dovrebbe superare nelle superfici di selezione. |

## Riferimento `modelSupport`

Usa `modelSupport` quando OpenClaw deve dedurre il tuo Plugin provider da
ID di modelli abbreviati come `gpt-5.4` o `claude-sonnet-4.6` prima che il runtime del Plugin
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
- `modelPatterns` ha la precedenza su `modelPrefixes`
- se sia un Plugin non bundle sia un Plugin bundle corrispondono, vince il Plugin
  non bundle
- l'ambiguità rimanente viene ignorata finché l'utente o la configurazione non specificano un provider

Campi:

| Campo           | Tipo       | Significato                                                                     |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Prefissi confrontati con `startsWith` rispetto agli ID abbreviati dei modelli.  |
| `modelPatterns` | `string[]` | Sorgenti regex confrontate con gli ID abbreviati dei modelli dopo la rimozione del suffisso del profilo. |

Le chiavi legacy delle capability di primo livello sono deprecate. Usa `openclaw doctor --fix` per
spostare `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` e `webSearchProviders` sotto `contracts`; il normale
caricamento del manifest non tratta più quei campi di primo livello come
ownership delle capability.

## Manifest rispetto a package.json

I due file hanno scopi diversi:

| File                   | Usalo per                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Rilevamento, validazione della configurazione, metadati delle scelte auth e hint UI che devono esistere prima dell'esecuzione del codice del Plugin |
| `package.json`         | Metadati npm, installazione delle dipendenze e blocco `openclaw` usato per entrypoint, gating di installazione, setup o metadati di catalogo |

Se non sei sicuro di dove debba andare un metadato, usa questa regola:

- se OpenClaw deve conoscerlo prima di caricare il codice del Plugin, inseriscilo in `openclaw.plugin.json`
- se riguarda packaging, file di entrypoint o comportamento di installazione npm, inseriscilo in `package.json`

### Campi di package.json che influenzano il rilevamento

Alcuni metadati del Plugin pre-runtime vivono intenzionalmente in `package.json` sotto il blocco
`openclaw` invece che in `openclaw.plugin.json`.

Esempi importanti:

| Campo                                                             | Significato                                                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Dichiara gli entrypoint nativi del Plugin.                                                                                                  |
| `openclaw.setupEntry`                                             | Entry point leggero solo per il setup usato durante l'onboarding e l'avvio differito del canale.                                           |
| `openclaw.channel`                                                | Metadati economici del catalogo canali come etichette, percorsi della documentazione, alias e testo di selezione.                         |
| `openclaw.channel.configuredState`                                | Metadati leggeri del controllo dello stato configurato che possono rispondere a "esiste già una configurazione solo env?" senza caricare il runtime completo del canale. |
| `openclaw.channel.persistedAuthState`                             | Metadati leggeri del controllo dello stato auth persistito che possono rispondere a "c'è già qualcosa con accesso eseguito?" senza caricare il runtime completo del canale. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Hint di installazione/aggiornamento per Plugin bundle e pubblicati esternamente.                                                           |
| `openclaw.install.defaultChoice`                                  | Percorso di installazione preferito quando sono disponibili più origini di installazione.                                                  |
| `openclaw.install.minHostVersion`                                 | Versione minima supportata dell'host OpenClaw, usando una soglia semver come `>=2026.3.22`.                                                |
| `openclaw.install.allowInvalidConfigRecovery`                     | Consente un percorso ristretto di recupero tramite reinstallazione del Plugin bundle quando la configurazione non è valida.                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Consente alle superfici del canale solo-setup di caricarsi prima del Plugin canale completo durante l'avvio.                              |

`openclaw.install.minHostVersion` viene applicato durante l'installazione e il
caricamento del registro dei manifest. I valori non validi vengono rifiutati; i valori
più recenti ma validi saltano il Plugin sugli host più vecchi.

`openclaw.install.allowInvalidConfigRecovery` è intenzionalmente ristretto. Non
rende installabili configurazioni arbitrarie non funzionanti. Oggi consente solo ai flussi di installazione
di recuperare da specifici errori di upgrade obsoleti dei Plugin bundle, come un percorso
mancante di un Plugin bundle o una voce `channels.<id>` obsoleta per quello stesso
Plugin bundle. Errori di configurazione non correlati continuano a bloccare l'installazione e inviano gli operatori
a `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` è un metadato di package per un piccolo
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

Usalo quando i flussi di setup, doctor o stato configurato hanno bisogno di una sonda auth economica sì/no
prima che il Plugin canale completo venga caricato. L'export di destinazione deve essere una piccola
funzione che legge solo lo stato persistito; non instradarla attraverso il barrel completo
del runtime del canale.

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

Usalo quando un canale può rispondere allo stato configurato da env o da altri input minimi
non di runtime. Se il controllo richiede la risoluzione completa della configurazione o il vero
runtime del canale, mantieni invece quella logica nell'hook `config.hasConfiguredState` del Plugin.

## Requisiti dello schema JSON

- **Ogni Plugin deve includere uno schema JSON**, anche se non accetta configurazione.
- È accettabile uno schema vuoto (ad esempio, `{ "type": "object", "additionalProperties": false }`).
- Gli schemi vengono validati in fase di lettura/scrittura della configurazione, non in fase di runtime.

## Comportamento di validazione

- Chiavi `channels.*` sconosciute sono **errori**, a meno che l'ID del canale non sia dichiarato
  da un manifest di Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` e `plugins.slots.*`
  devono fare riferimento a ID di Plugin **rilevabili**. Gli ID sconosciuti sono **errori**.
- Se un Plugin è installato ma ha un manifest o uno schema non valido o mancante,
  la validazione fallisce e Doctor segnala l'errore del Plugin.
- Se esiste la configurazione del Plugin ma il Plugin è **disabilitato**, la configurazione viene mantenuta e
  viene mostrato un **avviso** in Doctor + nei log.

Consulta il [Riferimento della configurazione](/it/gateway/configuration) per lo schema completo `plugins.*`.

## Note

- Il manifest è **obbligatorio per i Plugin OpenClaw nativi**, inclusi i caricamenti dal filesystem locale.
- Il runtime continua a caricare separatamente il modulo del Plugin; il manifest serve solo per
  rilevamento + validazione.
- I manifest nativi vengono analizzati con JSON5, quindi commenti, virgole finali e
  chiavi non tra virgolette sono accettati purché il valore finale resti un oggetto.
- Il loader del manifest legge solo i campi del manifest documentati. Evita di aggiungere
  qui chiavi personalizzate di primo livello.
- `providerAuthEnvVars` è il percorso di metadati economico per sonde auth, validazione
  dei marker env e superfici simili di autenticazione del provider che non devono avviare il runtime
  del Plugin solo per ispezionare i nomi env.
- `providerAuthAliases` consente alle varianti di provider di riutilizzare le variabili env auth,
  i profili auth, l'autenticazione basata sulla configurazione e la scelta di onboarding della chiave API
  di un altro provider senza codificare rigidamente quella relazione nel core.
- `channelEnvVars` è il percorso di metadati economico per fallback delle variabili env della shell, prompt di setup
  e superfici simili del canale che non devono avviare il runtime del Plugin solo per ispezionare i nomi env.
- `providerAuthChoices` è il percorso di metadati economico per selettori di scelta auth,
  risoluzione di `--auth-choice`, mappatura del provider preferito e semplice registrazione
  dei flag CLI di onboarding prima che il runtime del provider venga caricato. Per i metadati del wizard di runtime
  che richiedono codice del provider, vedi
  [Hook di runtime del provider](/it/plugins/architecture#provider-runtime-hooks).
- I tipi di Plugin esclusivi vengono selezionati tramite `plugins.slots.*`.
  - `kind: "memory"` viene selezionato da `plugins.slots.memory`.
  - `kind: "context-engine"` viene selezionato da `plugins.slots.contextEngine`
    (predefinito: `legacy` integrato).
- `channels`, `providers`, `cliBackends` e `skills` possono essere omessi quando un
  Plugin non ne ha bisogno.
- Se il tuo Plugin dipende da moduli nativi, documenta i passaggi di build ed eventuali
  requisiti di allowlist del package manager (ad esempio, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Correlati

- [Creazione di Plugin](/it/plugins/building-plugins) — primi passi con i Plugin
- [Architettura dei Plugin](/it/plugins/architecture) — architettura interna
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — riferimento dell'SDK del Plugin
