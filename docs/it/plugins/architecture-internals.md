---
read_when:
    - Implementazione di hook runtime del provider, ciclo di vita del canale o pacchetti pack
    - Debug di ordine di caricamento dei Plugin o stato del registro
    - Aggiunta di una nuova capacità Plugin o di un Plugin per il motore di contesto
summary: 'Architettura interna dei Plugin: pipeline di caricamento, registro, hook runtime, route HTTP e tabelle di riferimento'
title: Architettura interna dei Plugin
x-i18n:
    generated_at: "2026-04-26T11:33:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a435e118dc6acbacd44008f0b1c47b51da32dc3f17c24fe4c99f75c8cbd9311
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Per il modello pubblico delle capacità, le forme dei Plugin e i contratti di proprietà/esecuzione,
vedi [Architettura dei Plugin](/it/plugins/architecture). Questa pagina è il
riferimento per i meccanismi interni: pipeline di caricamento, registro, hook
runtime, route HTTP del Gateway, percorsi di import e tabelle di schema.

## Pipeline di caricamento

All'avvio, OpenClaw esegue grossomodo questo:

1. scopre le root candidate dei Plugin
2. legge manifest bundle nativi o compatibili e metadati di pacchetto
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ogni candidato
6. carica i moduli nativi abilitati: i moduli bundled già buildati usano un loader nativo;
   i Plugin nativi non buildati usano jiti
7. chiama gli hook nativi `register(api)` e raccoglie le registrazioni nel registro dei Plugin
8. espone il registro alle superfici di comandi/runtime

<Note>
`activate` è un alias legacy di `register` — il loader risolve quello presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i Plugin inclusi nel bundle usano `register`; per i nuovi Plugin preferisci `register`.
</Note>

I controlli di sicurezza avvengono **prima** dell'esecuzione runtime. I candidati vengono bloccati
quando l'entry esce dalla root del Plugin, il percorso è world-writable o la proprietà del percorso sembra sospetta per i Plugin non bundled.

### Comportamento manifest-first

Il manifest è la fonte di verità del control plane. OpenClaw lo usa per:

- identificare il Plugin
- scoprire canali/Skills/schema di configurazione dichiarati o capacità del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette/segnaposto della UI di controllo
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e setup senza caricare il runtime del Plugin

Per i Plugin nativi, il modulo runtime è la parte data-plane. Registra il
comportamento reale come hook, strumenti, comandi o flussi provider.

I blocchi manifest facoltativi `activation` e `setup` restano nel control plane.
Sono descrittori di soli metadati per la pianificazione dell'attivazione e la scoperta del setup;
non sostituiscono la registrazione runtime, `register(...)` o `setupEntry`.
I primi consumer di attivazione live ora usano hint di comandi, canali e provider del manifest
per restringere il caricamento dei Plugin prima di una materializzazione più ampia del registro:

- Il caricamento CLI si restringe ai Plugin che possiedono il comando primario richiesto
- Il setup del canale / la risoluzione del Plugin si restringono ai Plugin che possiedono l'id canale richiesto
- La risoluzione esplicita di setup/runtime del provider si restringe ai Plugin che possiedono l'id provider richiesto

Il planner di attivazione espone sia un'API solo ids per i chiamanti esistenti sia una
plan API per la nuova diagnostica. Le voci del piano riportano il motivo per cui un Plugin è stato selezionato,
separando gli hint espliciti del planner `activation.*` dal fallback di proprietà del manifest
come `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hook. Questa suddivisione dei motivi è il confine di compatibilità:
i metadati esistenti dei Plugin continuano a funzionare, mentre il nuovo codice può rilevare hint ampi
o comportamenti di fallback senza cambiare la semantica di caricamento runtime.

La scoperta del setup ora preferisce id posseduti dal descrittore come `setup.providers` e
`setup.cliBackends` per restringere i Plugin candidati prima di ricadere su
`setup-api` per i Plugin che necessitano ancora di hook runtime al momento del setup. Gli elenchi di setup dei provider
usano `providerAuthChoices` del manifest, scelte di setup derivate dal descrittore
e metadati del catalogo di installazione senza caricare il runtime del provider. Un
`setup.requiresRuntime: false` esplicito è un cutoff solo descrittore; l'omissione di
`requiresRuntime` mantiene il fallback legacy di setup-api per compatibilità. Se più
di un Plugin scoperto rivendica lo stesso id normalizzato di provider di setup o backend CLI,
la ricerca del setup rifiuta il proprietario ambiguo invece di affidarsi all'ordine di scoperta. Quando il runtime di setup viene effettivamente eseguito, la diagnostica del registro riporta drift tra `setup.providers` / `setup.cliBackends` e i provider o backend CLI registrati da setup-api senza bloccare i Plugin legacy.

### Cosa mette in cache il loader

OpenClaw mantiene brevi cache in-process per:

- risultati di scoperta
- dati del registro dei manifest
- registri dei Plugin caricati

Queste cache riducono startup a raffica e overhead di comandi ripetuti. È sicuro
considerarle cache di performance di breve durata, non persistenza.

Nota sulle performance:

- Imposta `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oppure
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` per disabilitare queste cache.
- Regola le finestre della cache con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modello del registro

I Plugin caricati non mutano direttamente variabili globali casuali del core. Si registrano in un
registro centrale dei Plugin.

Il registro tiene traccia di:

- record dei Plugin (identità, sorgente, origine, stato, diagnostica)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- handler RPC del Gateway
- route HTTP
- registrar CLI
- servizi in background
- comandi posseduti dal Plugin

Le funzionalità core leggono poi da quel registro invece di parlare direttamente con i moduli dei Plugin.
Questo mantiene il caricamento unidirezionale:

- modulo Plugin -> registrazione nel registro
- runtime core -> consumo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici core
ha bisogno di un solo punto di integrazione: "leggi il registro", non "fai un caso speciale per ogni modulo Plugin".

## Callback di binding della conversazione

I Plugin che associano una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere una callback dopo che una richiesta di binding
viene approvata o negata:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // Ora esiste un binding per questo plugin + conversazione.
        console.log(event.binding?.conversationId);
        return;
      }

      // La richiesta è stata negata; cancella lo stato locale in sospeso.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campi del payload della callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oppure `"deny"`
- `binding`: il binding risolto per le richieste approvate
- `request`: il riepilogo della richiesta originale, hint di detach, id mittente e
  metadati della conversazione

Questa callback è solo di notifica. Non cambia chi è autorizzato ad associare una conversazione,
ed è eseguita dopo che la gestione core dell'approvazione è terminata.

## Hook runtime del provider

I Plugin provider hanno tre livelli:

- **Metadati del manifest** per ricerche economiche pre-runtime:
  `setup.providers[].envVars`, compatibilità deprecata `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hook al momento della configurazione**: `catalog` (legacy `discovery`) più
  `applyConfigDefaults`.
- **Hook runtime**: oltre 40 hook facoltativi che coprono auth, risoluzione dei modelli,
  wrapping dello stream, livelli di thinking, policy di replay ed endpoint di usage. Vedi
  l'elenco completo in [Ordine e utilizzo degli hook](#hook-order-and-usage).

OpenClaw continua comunque a possedere il loop agente generico, il failover, la gestione del transcript e
la tool policy. Questi hook sono la superficie di estensione per il comportamento specifico del provider
senza richiedere un intero trasporto di inferenza personalizzato.

Usa il manifest `setup.providers[].envVars` quando il provider ha
credenziali basate su env che i percorsi generici auth/status/model-picker dovrebbero vedere senza
caricare il runtime del Plugin. Il deprecato `providerAuthEnvVars` viene ancora letto dall'adapter
di compatibilità durante la finestra di deprecazione, e i Plugin non bundled
che lo usano ricevono una diagnostica del manifest. Usa il manifest `providerAuthAliases`
quando un id provider deve riutilizzare env vars, profili auth,
auth basata su config e scelta di onboarding della chiave API di un altro id provider. Usa il manifest
`providerAuthChoices` quando le superfici CLI di onboarding/scelta auth devono conoscere
l'id di scelta del provider, le etichette di gruppo e il semplice wiring auth a singolo flag senza
caricare il runtime del provider. Mantieni `envVars` del runtime del provider
per hint rivolti agli operatori come etichette di onboarding o variabili di setup di
client-id/client-secret OAuth.

Usa il manifest `channelEnvVars` quando un canale ha auth o setup guidati da env che
fallback generici dell'env shell, controlli di config/status o prompt di setup devono vedere
senza caricare il runtime del canale.

### Ordine e utilizzo degli hook

Per i Plugin di modello/provider, OpenClaw chiama gli hook in questo ordine approssimativo.
La colonna "Quando usarlo" è la guida rapida per decidere.

| #   | Hook                              | Cosa fa                                                                                                        | Quando usarlo                                                                                                                                  |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`         | Il provider possiede un catalogo o valori predefiniti di base URL                                                                              |
| 2   | `applyConfigDefaults`             | Applica i valori predefiniti globali di configurazione posseduti dal provider durante la materializzazione della configurazione | I valori predefiniti dipendono dalla modalità auth, dall'env o dalla semantica della famiglia di modelli del provider                         |
| --  | _(built-in model lookup)_         | OpenClaw prova prima il normale percorso registro/catalogo                                                     | _(non è un hook del Plugin)_                                                                                                                   |
| 3   | `normalizeModelId`                | Normalizza alias legacy o preview degli id modello prima della lookup                                          | Il provider possiede la pulizia degli alias prima della risoluzione canonica del modello                                                       |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia del provider prima dell'assemblaggio generico del modello         | Il provider possiede la pulizia del trasporto per id provider personalizzati nella stessa famiglia di trasporto                               |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/provider                                    | Il provider ha bisogno di una pulizia della configurazione che dovrebbe vivere con il Plugin; gli helper bundled della famiglia Google fanno anche da backstop per le entry di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità native streaming-usage ai provider configurati                            | Il provider necessita di correzioni ai metadati native streaming usage guidate dall'endpoint                                                  |
| 7   | `resolveConfigApiKey`             | Risolve l'autenticazione con marker env per i provider configurati prima del caricamento dell'auth runtime    | Il provider ha una risoluzione proprietaria della chiave API con marker env; `amazon-bedrock` ha anche qui un resolver integrato per marker env AWS |
| 8   | `resolveSyntheticAuth`            | Espone auth locale/self-hosted o basata su config senza persistere testo semplice                              | Il provider può operare con un marker di credenziale sintetico/locale                                                                          |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili auth esterni posseduti dal provider; il `persistence` predefinito è `runtime-only` per credenziali possedute da CLI/app | Il provider riusa credenziali auth esterne senza persistere token di refresh copiati; dichiara `contracts.externalAuthProviders` nel manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la precedenza dei segnaposto sintetici memorizzati nei profili rispetto all'auth basata su env/config | Il provider memorizza profili segnaposto sintetici che non dovrebbero avere la precedenza                                                     |
| 11  | `resolveDynamicModel`             | Fallback sincrono per id modello posseduti dal provider non ancora presenti nel registro locale               | Il provider accetta id modello upstream arbitrari                                                                                              |
| 12  | `prepareDynamicModel`             | Warm-up asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                           | Il provider ha bisogno di metadati di rete prima di risolvere id sconosciuti                                                                  |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che il runner incorporato usi il modello risolto                                      | Il provider necessita di riscritture del trasporto ma usa comunque un trasporto core                                                          |
| 14  | `contributeResolvedModelCompat`   | Contribuisce flag di compatibilità per modelli vendor dietro un altro trasporto compatibile                   | Il provider riconosce i propri modelli su trasporti proxy senza prendere il controllo del provider                                            |
| 15  | `capabilities`                    | Metadati transcript/tooling posseduti dal provider usati dalla logica core condivisa                           | Il provider ha bisogno di particolarità del transcript/della famiglia del provider                                                             |
| 16  | `normalizeToolSchemas`            | Normalizza gli schema degli strumenti prima che il runner incorporato li veda                                  | Il provider necessita di pulizia degli schema della famiglia di trasporto                                                                      |
| 17  | `inspectToolSchemas`              | Espone diagnostica degli schema posseduta dal provider dopo la normalizzazione                                 | Il provider vuole avvisi sulle keyword senza insegnare al core regole specifiche del provider                                                 |
| 18  | `resolveReasoningOutputMode`      | Seleziona il contratto di output del reasoning nativo o con tag                                                | Il provider ha bisogno di reasoning con tag/output finale invece dei campi nativi                                                             |
| 19  | `prepareExtraParams`              | Normalizzazione dei parametri della richiesta prima dei wrapper generici delle opzioni di stream              | Il provider ha bisogno di parametri di richiesta predefiniti o di pulizia dei parametri per provider                                         |
| 20  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un trasporto personalizzato                        | Il provider ha bisogno di un protocollo wire personalizzato, non solo di un wrapper                                                           |
| 21  | `wrapStreamFn`                    | Wrapper dello stream dopo l'applicazione dei wrapper generici                                                  | Il provider necessita di wrapper di compatibilità per header/body/modello della richiesta senza un trasporto personalizzato                  |
| 22  | `resolveTransportTurnState`       | Collega header o metadati nativi per turno del trasporto                                                       | Il provider vuole che i trasporti generici inviino l'identità nativa del turno del provider                                                   |
| 23  | `resolveWebSocketSessionPolicy`   | Collega header WebSocket nativi o policy di cool-down della sessione                                           | Il provider vuole che i trasporti WS generici regolino header di sessione o policy di fallback                                               |
| 24  | `formatApiKey`                    | Formattatore dei profili auth: il profilo memorizzato diventa la stringa `apiKey` runtime                     | Il provider memorizza metadati auth extra e ha bisogno di una forma di token runtime personalizzata                                          |
| 25  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o policy di errore nel refresh              | Il provider non rientra nei refresher condivisi `pi-ai`                                                                                        |
| 26  | `buildAuthDoctorHint`             | Hint di riparazione aggiunto quando il refresh OAuth fallisce                                                  | Il provider necessita di indicazioni di riparazione auth possedute dal provider dopo un errore di refresh                                   |
| 27  | `matchesContextOverflowError`     | Matcher posseduto dal provider per l'overflow della finestra di contesto                                       | Il provider ha errori grezzi di overflow che le euristiche generiche non rileverebbero                                                       |
| 28  | `classifyFailoverReason`          | Classificazione posseduta dal provider del motivo di failover                                                  | Il provider può mappare errori grezzi API/trasporto in rate-limit/overload/ecc.                                                              |
| 29  | `isCacheTtlEligible`              | Policy di cache dei prompt per provider proxy/backhaul                                                         | Il provider ha bisogno di gating TTL della cache specifico per il proxy                                                                       |
| 30  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero auth mancante                                                  | Il provider necessita di un hint di recupero auth mancante specifico del provider                                                            |
| 31  | `suppressBuiltInModel`            | Soppressione di modelli upstream obsoleti più hint di errore facoltativo visibile all'utente                  | Il provider ha bisogno di nascondere righe upstream obsolete o sostituirle con un hint vendor                                                |
| 32  | `augmentModelCatalog`             | Righe di catalogo sintetiche/finali aggiunte dopo la scoperta                                                  | Il provider ha bisogno di righe sintetiche forward-compat in `models list` e nei selettori                                                   |
| 33  | `resolveThinkingProfile`          | Insieme di livelli `/think` specifico per modello, etichette di visualizzazione e valore predefinito         | Il provider espone una scala di thinking personalizzata o un'etichetta binaria per i modelli selezionati                                    |
| 34  | `isBinaryThinking`                | Hook di compatibilità per il toggle reasoning on/off                                                           | Il provider espone solo thinking binario acceso/spento                                                                                        |
| 35  | `supportsXHighThinking`           | Hook di compatibilità per il supporto al reasoning `xhigh`                                                     | Il provider vuole `xhigh` solo per un sottoinsieme di modelli                                                                                 |
| 36  | `resolveDefaultThinkingLevel`     | Hook di compatibilità per il livello `/think` predefinito                                                      | Il provider possiede la policy `/think` predefinita per una famiglia di modelli                                                              |
| 37  | `isModernModelRef`                | Matcher dei modelli moderni per filtri dei profili live e selezione degli smoke test                          | Il provider possiede la logica di corrispondenza dei modelli preferiti per live/smoke                                                       |
| 38  | `prepareRuntimeAuth`              | Scambia una credenziale configurata nel token/chiave runtime effettivo subito prima dell'inferenza           | Il provider necessita di uno scambio di token o di una credenziale di richiesta a breve durata                                              |
| 39  | `resolveUsageAuth`                | Risolve le credenziali di usage/billing per `/usage` e superfici di stato correlate                           | Il provider necessita di parsing personalizzato del token di usage/quota o di una credenziale di usage diversa                             |
| 40  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot specifici del provider per usage/quota dopo che l'auth è stata risolta        | Il provider necessita di un endpoint di usage specifico del provider o di un parser del payload                                             |
| 41  | `createEmbeddingProvider`         | Costruisce un adapter di embedding posseduto dal provider per memoria/ricerca                                 | Il comportamento degli embedding di memoria appartiene al Plugin provider                                                                    |
| 42  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione del transcript per il provider                     | Il provider necessita di una policy transcript personalizzata (ad esempio, rimozione di blocchi di thinking)                               |
| 43  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica del transcript                                      | Il provider necessita di riscritture di replay specifiche del provider oltre agli helper condivisi di Compaction                           |
| 44  | `validateReplayTurns`             | Validazione finale o rimodellamento dei turni di replay prima del runner incorporato                          | Il trasporto del provider richiede una validazione più rigorosa dei turni dopo la sanificazione generica                                   |
| 45  | `onModelSelected`                 | Esegue effetti collaterali post-selezione posseduti dal provider                                              | Il provider necessita di telemetria o stato posseduto dal provider quando un modello diventa attivo                                        |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
Plugin provider corrispondente, poi passano agli altri Plugin provider compatibili con hook
finché uno non modifica effettivamente l'id del modello o il trasporto/la configurazione. Questo mantiene
funzionanti gli shim alias/compat dei provider senza richiedere al chiamante di sapere quale
Plugin bundled possiede la riscrittura. Se nessun hook provider riscrive una entry di configurazione supportata della famiglia Google, il normalizzatore di configurazione Google incluso nel bundle applica comunque quella pulizia di compatibilità.

Se il provider ha bisogno di un protocollo wire completamente personalizzato o di un esecutore di richieste personalizzato,
quella è una classe di estensione diversa. Questi hook servono per il comportamento del provider
che continua a essere eseguito sul normale loop di inferenza di OpenClaw.

### Esempio di provider

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### Esempi integrati

I Plugin provider inclusi nel bundle combinano gli hook sopra per adattarsi alle esigenze di catalogo,
auth, thinking, replay e usage di ciascun vendor. L'insieme autorevole degli hook vive con
ogni Plugin sotto `extensions/`; questa pagina illustra le forme invece di
rispecchiare l'elenco.

<AccordionGroup>
  <Accordion title="Provider di catalogo pass-through">
    OpenRouter, Kilocode, Z.AI e xAI registrano `catalog` più
    `resolveDynamicModel` / `prepareDynamicModel` così da poter esporre id di modelli upstream
    prima del catalogo statico di OpenClaw.
  </Accordion>
  <Accordion title="Provider OAuth e con endpoint di usage">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi e z.ai combinano
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` per gestire lo scambio del token e l'integrazione `/usage`.
  </Accordion>
  <Accordion title="Famiglie di pulizia del replay e del transcript">
    Famiglie nominate condivise (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettono ai provider di scegliere una
    policy transcript tramite `buildReplayPolicy` invece di far riimplementare
    la pulizia a ogni Plugin.
  </Accordion>
  <Accordion title="Provider solo catalogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registrano solo `catalog` e usano il loop di inferenza condiviso.
  </Accordion>
  <Accordion title="Helper di stream specifici Anthropic">
    Gli header beta, `/fast` / `serviceTier` e `context1m` vivono dentro la
    seam pubblica `api.ts` / `contract-api.ts` del Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) invece che nel
    SDK generico.
  </Accordion>
</AccordionGroup>

## Helper runtime

I Plugin possono accedere a helper core selezionati tramite `api.runtime`. Per TTS:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Note:

- `textToSpeech` restituisce il normale payload di output TTS del core per superfici file/note vocali.
- Usa la configurazione core `messages.tts` e la selezione del provider.
- Restituisce buffer audio PCM + sample rate. I Plugin devono ricampionare/codificare per i provider.
- `listVoices` è facoltativo per provider. Usalo per voice picker posseduti dal vendor o flussi di setup.
- Gli elenchi delle voci possono includere metadati più ricchi come locale, genere e tag di personalità per picker consapevoli del provider.
- OpenAI ed ElevenLabs supportano oggi la telefonia. Microsoft no.

I Plugin possono anche registrare provider speech tramite `api.registerSpeechProvider(...)`.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

Note:

- Mantieni policy TTS, fallback e consegna delle risposte nel core.
- Usa i provider speech per il comportamento di sintesi posseduto dal vendor.
- L'input legacy Microsoft `edge` viene normalizzato all'id provider `microsoft`.
- Il modello di proprietà preferito è orientato all'azienda: un singolo Plugin vendor può possedere
  provider di testo, speech, immagini e futuri media man mano che OpenClaw aggiunge quei
  contratti di capacità.

Per la comprensione di immagini/audio/video, i Plugin registrano un singolo provider tipizzato
di media-understanding invece di una generica bag chiave/valore:

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

Note:

- Mantieni orchestrazione, fallback, configurazione e wiring dei canali nel core.
- Mantieni il comportamento del vendor nel Plugin provider.
- L'espansione additiva dovrebbe restare tipizzata: nuovi metodi facoltativi, nuovi campi di risultato facoltativi, nuove capacità facoltative.
- La generazione video segue già lo stesso schema:
  - il core possiede il contratto di capacità e l'helper runtime
  - i Plugin vendor registrano `api.registerVideoGenerationProvider(...)`
  - i Plugin di funzionalità/canale consumano `api.runtime.videoGeneration.*`

Per gli helper runtime di media-understanding, i Plugin possono chiamare:

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

Per la trascrizione audio, i Plugin possono usare sia il runtime media-understanding
sia il vecchio alias STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Facoltativo quando il MIME non può essere dedotto in modo affidabile:
  mime: "audio/ogg",
});
```

Note:

- `api.runtime.mediaUnderstanding.*` è la superficie condivisa preferita per
  la comprensione di immagini/audio/video.
- Usa la configurazione audio core di media-understanding (`tools.media.audio`) e l'ordine di fallback del provider.
- Restituisce `{ text: undefined }` quando non viene prodotta alcuna trascrizione (ad esempio input saltato/non supportato).
- `api.runtime.stt.transcribeAudioFile(...)` resta come alias di compatibilità.

I Plugin possono anche avviare esecuzioni subagent in background tramite `api.runtime.subagent`:

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

Note:

- `provider` e `model` sono override facoltativi per esecuzione, non modifiche persistenti della sessione.
- OpenClaw rispetta questi campi di override solo per chiamanti attendibili.
- Per esecuzioni di fallback possedute dal Plugin, gli operatori devono fare opt-in con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i Plugin attendibili a target canonici `provider/model` specifici, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni subagent dei Plugin non attendibili continuano a funzionare, ma le richieste di override vengono rifiutate invece di ricadere silenziosamente in fallback.

Per la ricerca web, i Plugin possono consumare l'helper runtime condiviso invece di
entrare nel wiring degli strumenti dell'agente:

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

I Plugin possono anche registrare provider di ricerca web tramite
`api.registerWebSearchProvider(...)`.

Note:

- Mantieni selezione del provider, risoluzione delle credenziali e semantica condivisa delle richieste nel core.
- Usa i provider di ricerca web per trasporti di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per i Plugin di funzionalità/canale che hanno bisogno di comportamento di ricerca senza dipendere dal wrapper dello strumento agente.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: genera un'immagine usando la catena configurata dei provider di generazione immagini.
- `listProviders(...)`: elenca i provider di generazione immagini disponibili e le loro capacità.

## Route HTTP del Gateway

I Plugin possono esporre endpoint HTTP con `api.registerHttpRoute(...)`.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Campi della route:

- `path`: percorso della route sotto il server HTTP del gateway.
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale auth del gateway, oppure `"plugin"` per auth/validazione Webhook gestite dal Plugin.
- `match`: facoltativo. `"exact"` (predefinito) oppure `"prefix"`.
- `replaceExisting`: facoltativo. Consente allo stesso Plugin di sostituire una propria registrazione di route esistente.
- `handler`: restituisci `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del Plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei Plugin devono dichiarare esplicitamente `auth`.
- I conflitti esatti `path + match` vengono rifiutati salvo `replaceExisting: true`, e un Plugin non può sostituire la route di un altro Plugin.
- Le route sovrapposte con diversi livelli di `auth` vengono rifiutate. Mantieni le catene di fallthrough `exact`/`prefix` solo allo stesso livello di auth.
- Le route `auth: "plugin"` **non** ricevono automaticamente gli scope runtime dell'operatore. Servono per Webhook/validazione firme gestiti dal Plugin, non per chiamate helper privilegiate del Gateway.
- Le route `auth: "gateway"` vengono eseguite dentro uno scope runtime di richiesta Gateway, ma tale scope è intenzionalmente conservativo:
  - l'auth bearer con segreto condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli scope runtime della route Plugin fissati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP attendibili con identità (ad esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente in quelle richieste di route Plugin con identità, lo scope runtime ricade su `operator.write`
- Regola pratica: non presumere che una route Plugin con auth gateway sia implicitamente una superficie admin. Se la tua route ha bisogno di comportamento riservato agli admin, richiedi una modalità auth con identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di import del Plugin SDK

Usa sottopercorsi SDK ristretti invece del barrel root monolitico `openclaw/plugin-sdk`
quando scrivi nuovi Plugin. Sottopercorsi core:

| Sottopercorso                        | Scopo                                              |
| ------------------------------------ | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`   | Primitive di registrazione del Plugin              |
| `openclaw/plugin-sdk/channel-core`   | Helper di entry/build del canale                   |
| `openclaw/plugin-sdk/core`           | Helper condivisi generici e contratto ombrello     |
| `openclaw/plugin-sdk/config-schema`  | Schema Zod root di `openclaw.json` (`OpenClawSchema`) |

I Plugin canale scelgono da una famiglia di seam ristrette — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. Il comportamento di approvazione dovrebbe consolidarsi
su un solo contratto `approvalCapability` invece di mescolarsi tra campi
Plugin non correlati. Vedi [Plugin canale](/it/plugins/sdk-channel-plugins).

Gli helper runtime e di configurazione vivono sotto sottopercorsi `*-runtime`
corrispondenti (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, ecc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` è deprecato — uno shim di compatibilità per
Plugin più vecchi. Il nuovo codice dovrebbe importare primitive generiche più ristrette.
</Info>

Punti di ingresso interni al repository (per root di pacchetto di ogni Plugin bundled):

- `index.js` — entry del Plugin bundled
- `api.js` — barrel di helper/tipi
- `runtime-api.js` — barrel solo runtime
- `setup-entry.js` — entry del Plugin di setup

I Plugin esterni dovrebbero importare solo sottopercorsi `openclaw/plugin-sdk/*`. Non
importare mai `src/*` di un altro pacchetto Plugin dal core o da un altro Plugin.
I punti di ingresso caricati tramite facade preferiscono lo snapshot attivo della configurazione runtime quando esiste, poi ricadono sul file di configurazione risolto su disco.

Sottopercorsi specifici per capacità come `image-generation`, `media-understanding`
e `speech` esistono perché i Plugin bundled li usano oggi. Non sono
automaticamente contratti esterni congelati a lungo termine — controlla la pagina di
riferimento SDK pertinente quando ti affidi a essi.

## Schema dello strumento messaggi

I Plugin dovrebbero possedere i contributi allo schema `describeMessageTool(...)` specifici del canale
per primitive non di messaggio come reazioni, letture e sondaggi.
La presentazione condivisa dell'invio dovrebbe usare il contratto generico `MessagePresentation`
invece di campi nativi del provider per pulsanti, componenti, blocchi o card.
Vedi [Message Presentation](/it/plugins/message-presentation) per il contratto,
le regole di fallback, la mappatura dei provider e la checklist per gli autori di Plugin.

I Plugin con capacità di invio dichiarano ciò che possono renderizzare tramite capacità dei messaggi:

- `presentation` per blocchi di presentazione semantica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` per richieste di consegna fissata

Il core decide se renderizzare la presentazione nativamente o degradarla a testo.
Non esporre vie di fuga UI native del provider dallo strumento messaggi generico.
Gli helper SDK deprecati per schemi nativi legacy restano esportati per i Plugin
di terze parti esistenti, ma i nuovi Plugin non dovrebbero usarli.

## Risoluzione dei target del canale

I Plugin canale dovrebbero possedere la semantica dei target specifica del canale. Mantieni
generico l'host outbound condiviso e usa la superficie adapter di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  debba essere trattato come `direct`, `group` o `channel` prima della lookup nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input debba saltare direttamente alla risoluzione tipo id invece della ricerca nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del Plugin quando il
  core ha bisogno di una risoluzione finale posseduta dal provider dopo la normalizzazione o dopo
  un miss nella directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route
  di sessione specifica del provider una volta che un target è stato risolto.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima
  della ricerca di peer/gruppi.
- Usa `looksLikeId` per controlli del tipo "tratta questo come un id target esplicito/nativo".
- Usa `resolveTarget` come fallback di normalizzazione specifico del provider, non per
  una ricerca ampia nella directory.
- Mantieni gli id nativi del provider come chat id, thread id, JID, handle e room
  id all'interno dei valori `target` o dei parametri specifici del provider, non nei campi SDK generici.

## Directory basate su configurazione

I Plugin che derivano voci di directory dalla configurazione dovrebbero mantenere quella logica nel
Plugin e riusare gli helper condivisi da
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale ha bisogno di peer/gruppi basati su configurazione come:

- peer DM guidati da allowlist
- mappe configurate di canali/gruppi
- fallback statici di directory con ambito account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtro delle query
- applicazione del limite
- helper di deduplica/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione degli account specifica del canale e la normalizzazione degli id dovrebbero restare
nell'implementazione del Plugin.

## Cataloghi dei provider

I Plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce singola di provider
- `{ providers }` per più voci di provider

Usa `catalog` quando il Plugin possiede id modello specifici del provider, valori
predefiniti di base URL o metadati dei modelli protetti da auth.

`catalog.order` controlla quando il catalogo di un Plugin viene unito rispetto ai
provider impliciti integrati di OpenClaw:

- `simple`: provider semplici guidati da chiave API o env
- `profile`: provider che compaiono quando esistono profili auth
- `paired`: provider che sintetizzano più voci di provider correlate
- `late`: ultimo passaggio, dopo gli altri provider impliciti

I provider successivi vincono in caso di collisione di chiave, quindi i Plugin possono
intenzionalmente sovrascrivere una voce provider integrata con lo stesso id provider.

Compatibilità:

- `discovery` continua a funzionare come alias legacy
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione del canale in sola lettura

Se il tuo Plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso runtime. Può assumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano
  i segreti richiesti.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi di riparazione doctor/config
  non dovrebbero avere bisogno di materializzare credenziali runtime solo per
  descrivere la configurazione.

Comportamento consigliato per `inspectAccount(...)`:

- Restituire solo lo stato descrittivo dell'account.
- Preservare `enabled` e `configured`.
- Includere campi di sorgente/stato delle credenziali quando rilevanti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire i valori grezzi dei token solo per riportare la
  disponibilità in sola lettura. Restituire `tokenStatus: "available"` (e il
  campo sorgente corrispondente) è sufficiente per comandi in stile status.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo consente ai comandi in sola lettura di riportare "configurato ma non disponibile in questo percorso di comando" invece di andare in crash o riportare in modo errato l'account come non configurato.

## Pacchetti pack

Una directory Plugin può includere un `package.json` con `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Ogni entry diventa un Plugin. Se il pack elenca più extension, l'id del Plugin
diventa `name/<fileBase>`.

Se il tuo Plugin importa dipendenze npm, installale in quella directory così che
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Guardrail di sicurezza: ogni entry `openclaw.extensions` deve restare all'interno della directory del Plugin
dopo la risoluzione dei symlink. Le entry che escono dalla directory del pacchetto vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del Plugin con un
`npm install --omit=dev --ignore-scripts` locale al progetto (nessuno script lifecycle,
nessuna dipendenza dev a runtime), ignorando le impostazioni globali ereditate di installazione npm.
Mantieni gli alberi di dipendenze dei Plugin "pure JS/TS" ed evita pacchetti che richiedono
build `postinstall`.

Facoltativo: `openclaw.setupEntry` può puntare a un modulo leggero di solo setup.
Quando OpenClaw ha bisogno di superfici di setup per un Plugin canale disabilitato, oppure
quando un Plugin canale è abilitato ma ancora non configurato, carica `setupEntry`
invece della entry completa del Plugin. Questo mantiene startup e setup più leggeri
quando la tua entry principale del Plugin collega anche strumenti, hook o altro codice solo runtime.

Facoltativo: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può far scegliere a un Plugin canale lo stesso percorso `setupEntry` durante la fase
di startup pre-listen del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di startup che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, significa che la entry di setup
deve registrare ogni capacità posseduta dal canale da cui dipende lo startup, come:

- la registrazione del canale stesso
- qualsiasi route HTTP che deve essere disponibile prima che il gateway inizi ad ascoltare
- qualsiasi metodo, strumento o servizio del gateway che deve esistere durante quella stessa finestra

Se la tua entry completa possiede ancora qualsiasi capacità di startup richiesta, non abilitare
questo flag. Mantieni il Plugin sul comportamento predefinito e lascia che OpenClaw carichi la
entry completa durante lo startup.

I canali bundled possono anche pubblicare helper setup-only della superficie contrattuale che il core
può consultare prima che il runtime completo del canale venga caricato. L'attuale superficie
di promotion del setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando deve promuovere una configurazione legacy di canale single-account in
`channels.<id>.accounts.*` senza caricare la entry completa del Plugin.
Matrix è l'esempio bundled attuale: sposta solo le chiavi auth/bootstrap in un
account promosso con nome quando esistono già account con nome, e può preservare una
chiave configurata di account predefinito non canonica invece di creare sempre
`accounts.default`.

Questi adapter di patch setup mantengono lazy la scoperta della superficie contrattuale bundled.
Il tempo di import resta leggero; la superficie di promotion viene caricata solo al primo utilizzo invece di rientrare nello startup del canale bundled all'import del modulo.

Quando queste superfici di startup includono metodi RPC del gateway, mantienili su un
prefisso specifico del Plugin. I namespace admin del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre
a `operator.admin`, anche se un Plugin richiede uno scope più ristretto.

Esempio:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Metadati del catalogo canali

I Plugin canale possono pubblicizzare metadati di setup/scoperta tramite `openclaw.channel` e
hint di installazione tramite `openclaw.install`. Questo mantiene il catalogo core privo di dati.

Esempio:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Chat self-hosted tramite bot Webhook di Nextcloud Talk.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

Campi utili di `openclaw.channel` oltre all'esempio minimo:

- `detailLabel`: etichetta secondaria per superfici più ricche di catalogo/status
- `docsLabel`: sovrascrive il testo del link per il link alla documentazione
- `preferOver`: id di Plugin/canale a priorità inferiore che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo per la superficie di selezione
- `markdownCapable`: contrassegna il canale come compatibile con Markdown per le decisioni di formattazione in uscita
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai picker interattivi di setup/configurazione quando impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: fa scegliere al canale il flusso standard quickstart `allowFrom`
- `forceAccountBinding`: richiede un binding esplicito dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la lookup di sessione nella risoluzione dei target announce

OpenClaw può anche unire **cataloghi canale esterni** (ad esempio un export del
registro MPM). Inserisci un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o più file JSON (delimitati da virgola/punto e virgola/`PATH`). Ogni file dovrebbe
contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy della chiave `"entries"`.

Le voci generate del catalogo canali e le voci del catalogo di installazione dei provider espongono
fatti normalizzati della sorgente di installazione accanto al blocco raw `openclaw.install`.
I fatti normalizzati identificano se la specifica npm è una versione esatta o un selettore mobile,
se sono presenti i metadati di integrità attesi e se è disponibile anche un percorso sorgente locale.
Quando l'identità del catalogo/pacchetto è nota, i fatti normalizzati avvisano se il nome del pacchetto npm analizzato deriva da quell'identità.
Avvisano anche quando `defaultChoice` non è valido o punta a una sorgente
non disponibile, e quando sono presenti metadati di integrità npm senza una sorgente npm valida.
I consumer dovrebbero trattare `installSource` come un campo facoltativo additivo così che voci costruite a mano e shim di catalogo non debbano sintetizzarlo.
Questo consente a onboarding e diagnostica di spiegare lo stato del source plane senza
importare il runtime del Plugin.

Le voci npm esterne ufficiali dovrebbero preferire un `npmSpec` esatto più
`expectedIntegrity`. I nomi di pacchetto semplici e i dist-tag continuano a funzionare per
compatibilità, ma espongono avvisi sul source plane così che il catalogo possa evolvere
verso installazioni con versione fissata e controllo d'integrità senza rompere i Plugin esistenti.
Quando l'onboarding installa da un percorso di catalogo locale, registra una voce di indice Plugin gestita con `source: "path"` e un
`sourcePath` relativo al workspace quando possibile. Il percorso operativo assoluto di caricamento resta in
`plugins.load.paths`; il record di installazione evita di duplicare percorsi locali della workstation nella configurazione persistente. Questo mantiene visibili alle diagnostiche del source plane le installazioni di sviluppo locale senza aggiungere una seconda superficie grezza di divulgazione dei percorsi filesystem.
L'indice Plugin persistito `plugins/installs.json` è la fonte di verità della sorgente di installazione e può essere aggiornato senza caricare i moduli runtime del Plugin.
La sua mappa `installRecords` è durevole anche quando il manifest di un Plugin è mancante o
non valido; il suo array `plugins` è una vista ricostruibile di manifest/cache.

## Plugin del motore di contesto

I Plugin del motore di contesto possiedono l'orchestrazione del contesto della sessione per ingest, assembly
e Compaction. Registrali dal tuo Plugin con
`api.registerContextEngine(id, factory)`, quindi seleziona il motore attivo con
`plugins.slots.contextEngine`.

Usalo quando il tuo Plugin deve sostituire o estendere la pipeline di contesto predefinita invece di limitarsi ad aggiungere ricerca nella memoria o hook.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Se il tuo motore **non** possiede l'algoritmo di Compaction, mantieni `compact()`
implementato e delegalo esplicitamente:

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## Aggiungere una nuova capacità

Quando un Plugin ha bisogno di un comportamento che non rientra nell'API attuale, non aggirare
il sistema dei Plugin con un accesso privato interno. Aggiungi la capacità mancante.

Sequenza consigliata:

1. definisci il contratto core
   Decidi quale comportamento condiviso dovrebbe possedere il core: policy, fallback, merge della config,
   ciclo di vita, semantica rivolta ai canali e forma dell'helper runtime.
2. aggiungi superfici tipizzate di registrazione/runtime per i Plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la superficie di capacità tipizzata più piccola utile.
3. collega core + consumer di canali/funzionalità
   I canali e i Plugin di funzionalità dovrebbero consumare la nuova capacità tramite il core,
   non importando direttamente un'implementazione vendor.
4. registra le implementazioni vendor
   I Plugin vendor registrano quindi i propri backend rispetto alla capacità.
5. aggiungi copertura del contratto
   Aggiungi test così che proprietà e forma di registrazione restino esplicite nel tempo.

È così che OpenClaw resta opinato senza diventare hardcoded verso la visione del mondo di
un solo provider. Vedi il [Capability Cookbook](/it/plugins/architecture)
per una checklist concreta dei file e un esempio completo.

### Checklist della capacità

Quando aggiungi una nuova capacità, l'implementazione dovrebbe di solito toccare insieme queste
superfici:

- tipi del contratto core in `src/<capability>/types.ts`
- runner/helper runtime del core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API Plugin in `src/plugins/types.ts`
- wiring del registro Plugin in `src/plugins/registry.ts`
- esposizione runtime del Plugin in `src/plugins/runtime/*` quando i Plugin di funzionalità/canale hanno bisogno di consumarla
- helper di acquisizione/test in `src/test-utils/plugin-registration.ts`
- asserzioni di proprietà/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/Plugin in `docs/`

Se una di queste superfici manca, di solito è un segno che la capacità
non è ancora completamente integrata.

### Template della capacità

Pattern minimo:

```ts
// contratto core
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API del Plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper runtime condiviso per Plugin di funzionalità/canale
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Mostra il robot che cammina nel laboratorio.",
  cfg,
});
```

Pattern del test di contratto:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Questo mantiene semplice la regola:

- il core possiede il contratto di capacità + l'orchestrazione
- i Plugin vendor possiedono le implementazioni vendor
- i Plugin di funzionalità/canale consumano gli helper runtime
- i test di contratto mantengono esplicita la proprietà

## Correlati

- [Architettura dei Plugin](/it/plugins/architecture) — modello pubblico delle capacità e forme
- [Sottopercorsi Plugin SDK](/it/plugins/sdk-subpaths)
- [Setup Plugin SDK](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
