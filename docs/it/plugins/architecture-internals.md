---
read_when:
    - Implementazione di hook runtime dei provider, ciclo di vita dei canali o pack dei pacchetti
    - Debug dei problemi di ordine di caricamento dei Plugin o dello stato del registry
    - Aggiunta di una nuova capability Plugin o di un Plugin del motore di contesto
summary: 'Architettura interna dei Plugin: pipeline di caricamento, registry, hook runtime, route HTTP e tabelle di riferimento'
title: Architettura interna dei Plugin
x-i18n:
    generated_at: "2026-04-25T13:51:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e505155ee2acc84f7f26fa81b62121f03a998b249886d74f798c0f258bd8da4
    source_path: plugins/architecture-internals.md
    workflow: 15
---

Per il modello pubblico delle capability, le forme dei Plugin e i contratti di
ownership/esecuzione, vedi [Architettura dei Plugin](/it/plugins/architecture). Questa pagina è il
riferimento per i meccanismi interni: pipeline di caricamento, registry, hook runtime,
route HTTP del Gateway, percorsi di importazione e tabelle di schema.

## Pipeline di caricamento

All'avvio, OpenClaw esegue approssimativamente questo:

1. rileva le root dei Plugin candidati
2. legge i manifest nativi o dei bundle compatibili e i metadati dei pacchetti
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei Plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ogni candidato
6. carica i moduli nativi abilitati: i moduli inclusi già buildati usano un loader nativo;
   i Plugin nativi non buildati usano jiti
7. chiama gli hook nativi `register(api)` e raccoglie le registrazioni nel registry dei Plugin
8. espone il registry alle superfici di comandi/runtime

<Note>
`activate` è un alias legacy di `register` — il loader risolve quello che è presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i Plugin inclusi usano `register`; per i nuovi Plugin preferisci `register`.
</Note>

I controlli di sicurezza avvengono **prima** dell'esecuzione runtime. I candidati vengono bloccati
quando l'entry esce dalla root del Plugin, il percorso è scrivibile da tutti oppure la
proprietà del percorso sembra sospetta per i Plugin non inclusi.

### Comportamento manifest-first

Il manifest è la fonte di verità del control plane. OpenClaw lo usa per:

- identificare il Plugin
- rilevare canali/Skills/schema di configurazione dichiarati o capability del bundle
- convalidare `plugins.entries.<id>.config`
- arricchire etichette/placeholder di Control UI
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e setup senza caricare il runtime del Plugin

Per i Plugin nativi, il modulo runtime è la parte di data plane. Registra il
comportamento effettivo come hook, strumenti, comandi o flussi provider.

I blocchi facoltativi del manifest `activation` e `setup` restano nel control plane.
Sono descrittori di soli metadati per la pianificazione dell'attivazione e la discovery del setup;
non sostituiscono la registrazione runtime, `register(...)` o `setupEntry`.
I primi consumer di attivazione live ora usano i suggerimenti del manifest su comandi, canali e provider
per restringere il caricamento dei Plugin prima della più ampia materializzazione del registry:

- il caricamento CLI si restringe ai Plugin che possiedono il comando primario richiesto
- la risoluzione di setup/plugin del canale si restringe ai Plugin che possiedono l'id
  del canale richiesto
- la risoluzione esplicita di setup/runtime del provider si restringe ai Plugin che possiedono l'id
  del provider richiesto

Il planner di attivazione espone sia un'API solo-id per i chiamanti esistenti sia una
plan API per la nuova diagnostica. Le voci del piano riportano perché un Plugin è stato selezionato,
separando i suggerimenti espliciti del planner `activation.*` dai fallback di ownership del manifest
come `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` e hook. Questa separazione dei motivi è il confine di compatibilità:
i metadati Plugin esistenti continuano a funzionare, mentre il nuovo codice può rilevare suggerimenti ampi
o comportamento di fallback senza cambiare la semantica del caricamento runtime.

La discovery del setup ora preferisce id di proprietà del descrittore come `setup.providers` e
`setup.cliBackends` per restringere i Plugin candidati prima di usare il fallback a
`setup-api` per i Plugin che necessitano ancora di hook runtime in fase di setup. Il flusso di setup
del provider usa prima `providerAuthChoices` del manifest, poi usa come fallback
scelte runtime del wizard e scelte del catalogo di installazione per compatibilità. `setup.requiresRuntime: false`
esplicito è un cutoff solo descrittore; `requiresRuntime` omesso mantiene il fallback legacy a setup-api per compatibilità. Se più di
un Plugin rilevato rivendica lo stesso id normalizzato di provider di setup o backend CLI,
il lookup del setup rifiuta il proprietario ambiguo invece di basarsi sull'ordine di
discovery. Quando il runtime di setup viene effettivamente eseguito, la diagnostica del registry segnala drift tra `setup.providers` / `setup.cliBackends` e i provider o backend CLI
registrati da setup-api senza bloccare i Plugin legacy.

### Cosa mette in cache il loader

OpenClaw mantiene brevi cache in-process per:

- risultati della discovery
- dati del registry dei manifest
- registry dei Plugin caricati

Queste cache riducono il carico di avvio impulsivo e l'overhead di comandi ripetuti. È sicuro
considerarle cache prestazionali di breve durata, non persistenza.

Nota sulle prestazioni:

- Imposta `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oppure
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` per disabilitare queste cache.
- Regola le finestre di cache con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modello di registry

I Plugin caricati non modificano direttamente globali casuali del core. Si registrano in un
registry centrale dei Plugin.

Il registry tiene traccia di:

- record dei Plugin (identità, sorgente, origine, stato, diagnostica)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- handler RPC del gateway
- route HTTP
- registrar CLI
- servizi in background
- comandi di proprietà del Plugin

Le funzionalità core leggono quindi da quel registry invece di parlare direttamente
ai moduli Plugin. Questo mantiene il caricamento unidirezionale:

- modulo Plugin -> registrazione nel registry
- runtime core -> consumo del registry

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici core
ha bisogno solo di un punto di integrazione: "leggere il registry", non "gestire con casi speciali ogni
modulo Plugin".

## Callback di binding della conversazione

I Plugin che fanno binding di una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere una callback dopo che una richiesta di bind
è stata approvata o negata:

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

      // La richiesta è stata negata; cancella qualsiasi stato locale in sospeso.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campi del payload della callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: il binding risolto per le richieste approvate
- `request`: il riepilogo della richiesta originale, suggerimento detach, id del mittente e
  metadati della conversazione

Questa callback è solo di notifica. Non cambia chi è autorizzato a fare bind di una
conversazione e viene eseguita dopo il completamento della gestione core dell'approvazione.

## Hook runtime del provider

I Plugin provider hanno tre livelli:

- **Metadati del manifest** per lookup economico pre-runtime:
  `setup.providers[].envVars`, compatibilità deprecata `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices` e `channelEnvVars`.
- **Hook in fase di configurazione**: `catalog` (legacy `discovery`) più
  `applyConfigDefaults`.
- **Hook runtime**: oltre 40 hook facoltativi che coprono auth, risoluzione del modello,
  wrapping dello stream, livelli di thinking, policy di replay ed endpoint di utilizzo. Vedi
  l'elenco completo sotto [Ordine e uso degli hook](#hook-order-and-usage).

OpenClaw continua comunque a possedere il loop generico dell'agente, il failover, la gestione del transcript e
la policy degli strumenti. Questi hook sono la superficie di estensione per il comportamento
specifico del provider senza richiedere un intero trasporto di inferenza personalizzato.

Usa `setup.providers[].envVars` del manifest quando il provider ha credenziali basate su env che i percorsi generici di auth/status/model-picker dovrebbero vedere senza caricare il runtime del Plugin. `providerAuthEnvVars` deprecato viene ancora letto dall'adattatore di compatibilità durante la finestra di deprecazione, e i Plugin non inclusi che lo usano ricevono una diagnostica del manifest. Usa `providerAuthAliases` del manifest quando un id provider deve riusare env vars, profili auth, auth basata su configurazione e scelta di onboarding della chiave API di un altro id provider. Usa `providerAuthChoices` del manifest quando le superfici CLI di onboarding/scelta auth devono conoscere l'id scelta del provider, le etichette di gruppo e il semplice wiring auth a singolo flag senza caricare il runtime del provider. Mantieni `envVars` del runtime del provider per suggerimenti rivolti all'operatore come etichette di onboarding o variabili di setup OAuth
  client-id/client-secret.

Usa `channelEnvVars` del manifest quando un canale ha auth o setup basati su env che il fallback generico shell-env, i controlli config/status o i prompt di setup dovrebbero vedere senza caricare il runtime del canale.

### Ordine e uso degli hook

Per i Plugin model/provider, OpenClaw chiama gli hook in questo ordine approssimativo.
La colonna "Quando usarlo" è la guida rapida alla decisione.

| #   | Hook                              | Cosa fa                                                                                                        | Quando usarlo                                                                                                                                 |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`         | Il provider possiede un catalogo o valori predefiniti di base URL                                                                             |
| 2   | `applyConfigDefaults`             | Applica valori predefiniti globali di configurazione di proprietà del provider durante la materializzazione della configurazione | I valori predefiniti dipendono da modalità auth, env o semantica della famiglia di modelli del provider                                      |
| --  | _(built-in model lookup)_         | OpenClaw prova prima il normale percorso registry/catalog                                                     | _(non è un hook Plugin)_                                                                                                                      |
| 3   | `normalizeModelId`                | Normalizza alias legacy o preview degli id modello prima del lookup                                           | Il provider possiede la pulizia degli alias prima della risoluzione del modello canonico                                                     |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia provider prima dell'assemblaggio generico del modello             | Il provider possiede la pulizia del trasporto per id provider personalizzati nella stessa famiglia di trasporto                              |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/provider                                   | Il provider richiede una pulizia della configurazione che dovrebbe vivere con il Plugin; gli helper della famiglia Google inclusi fanno anche da backstop per le voci di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità native streaming-usage ai provider di configurazione                     | Il provider richiede correzioni dei metadati di uso native streaming guidate dall'endpoint                                                   |
| 7   | `resolveConfigApiKey`             | Risolve auth con env-marker per i provider di configurazione prima del caricamento auth runtime               | Il provider ha una risoluzione della chiave API con env-marker di proprietà del provider; anche `amazon-bedrock` ha qui un resolver env-marker AWS integrato |
| 8   | `resolveSyntheticAuth`            | Espone auth locale/self-hosted o basata su configurazione senza mantenere persistente testo in chiaro        | Il provider può operare con un marcatore credenziale sintetico/locale                                                                        |
| 9   | `resolveExternalAuthProfiles`     | Applica overlay di profili auth esterni di proprietà del provider; `persistence` predefinito è `runtime-only` per credenziali di proprietà di CLI/app | Il provider riusa credenziali auth esterne senza mantenere persistenti refresh token copiati; dichiara `contracts.externalAuthProviders` nel manifest |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la priorità dei placeholder di profilo sintetico memorizzati rispetto all'auth basata su env/config  | Il provider memorizza profili placeholder sintetici che non dovrebbero avere la precedenza                                                  |
| 11  | `resolveDynamicModel`             | Fallback sincrono per id modello di proprietà del provider non ancora presenti nel registry locale            | Il provider accetta id modello upstream arbitrari                                                                                            |
| 12  | `prepareDynamicModel`             | Warm-up asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                          | Il provider ha bisogno di metadati di rete prima di risolvere id sconosciuti                                                                |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che il runner integrato usi il modello risolto                                       | Il provider richiede riscritture del trasporto ma usa comunque un trasporto core                                                            |
| 14  | `contributeResolvedModelCompat`   | Contribuisce flag di compatibilità per modelli vendor dietro un altro trasporto compatibile                   | Il provider riconosce i propri modelli su trasporti proxy senza assumere il controllo del provider                                          |
| 15  | `capabilities`                    | Metadati transcript/tooling di proprietà del provider usati dalla logica core condivisa                       | Il provider richiede particolarità transcript/famiglia provider                                                                             |
| 16  | `normalizeToolSchemas`            | Normalizza gli schema degli strumenti prima che il runner integrato li veda                                   | Il provider richiede pulizia degli schema della famiglia di trasporto                                                                       |
| 17  | `inspectToolSchemas`              | Espone diagnostica degli schema di proprietà del provider dopo la normalizzazione                             | Il provider vuole avvisi sulle keyword senza insegnare al core regole specifiche del provider                                               |
| 18  | `resolveReasoningOutputMode`      | Seleziona il contratto di output del reasoning nativo o con tag                                               | Il provider richiede output reasoning/finale con tag invece di campi nativi                                                                 |
| 19  | `prepareExtraParams`              | Normalizzazione dei parametri della richiesta prima dei wrapper generici delle opzioni di stream              | Il provider richiede parametri di richiesta predefiniti o pulizia dei parametri per provider                                                |
| 20  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un trasporto personalizzato                       | Il provider richiede un protocollo wire personalizzato, non solo un wrapper                                                                 |
| 21  | `wrapStreamFn`                    | Wrapper dello stream dopo l'applicazione dei wrapper generici                                                 | Il provider richiede wrapper di compatibilità per header/body/modello della richiesta senza un trasporto personalizzato                     |
| 22  | `resolveTransportTurnState`       | Collega header o metadati nativi per-turn del trasporto                                                       | Il provider vuole che i trasporti generici inviino identità turn native del provider                                                        |
| 23  | `resolveWebSocketSessionPolicy`   | Collega header WebSocket nativi o policy di cool-down della sessione                                          | Il provider vuole che i trasporti WS generici regolino header di sessione o policy di fallback                                              |
| 24  | `formatApiKey`                    | Formatter del profilo auth: il profilo memorizzato diventa la stringa `apiKey` del runtime                   | Il provider memorizza metadati auth aggiuntivi e richiede una forma di token runtime personalizzata                                         |
| 25  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o policy di errore di refresh               | Il provider non rientra nei refresher condivisi `pi-ai`                                                                                     |
| 26  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando il refresh OAuth fallisce                                         | Il provider richiede indicazioni di riparazione auth di proprietà del provider dopo il fallimento del refresh                               |
| 27  | `matchesContextOverflowError`     | Matcher di overflow della finestra di contesto di proprietà del provider                                      | Il provider ha errori raw di overflow che le euristiche generiche non rileverebbero                                                        |
| 28  | `classifyFailoverReason`          | Classificazione del motivo di failover di proprietà del provider                                              | Il provider può mappare errori raw API/trasporto a rate-limit/overload/ecc.                                                                 |
| 29  | `isCacheTtlEligible`              | Policy della cache del prompt per provider proxy/backhaul                                                     | Il provider richiede gating TTL della cache specifico per proxy                                                                             |
| 30  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero auth mancante                                                 | Il provider richiede un suggerimento di recupero auth mancante specifico del provider                                                       |
| 31  | `suppressBuiltInModel`            | Soppressione di modelli upstream obsoleti più suggerimento di errore facoltativo visibile all'utente         | Il provider deve nascondere righe upstream obsolete o sostituirle con un suggerimento del vendor                                            |
| 32  | `augmentModelCatalog`             | Righe di catalogo sintetiche/finali aggiunte dopo la discovery                                                | Il provider richiede righe sintetiche forward-compat in `models list` e nei selettori                                                      |
| 33  | `resolveThinkingProfile`          | Insieme dei livelli `/think`, etichette di visualizzazione e valore predefinito specifici del modello        | Il provider espone una scala thinking personalizzata o un'etichetta binaria per modelli selezionati                                        |
| 34  | `isBinaryThinking`                | Hook di compatibilità per toggle reasoning on/off                                                             | Il provider espone solo thinking binario on/off                                                                                              |
| 35  | `supportsXHighThinking`           | Hook di compatibilità per il supporto reasoning `xhigh`                                                       | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                                |
| 36  | `resolveDefaultThinkingLevel`     | Hook di compatibilità per il livello `/think` predefinito                                                     | Il provider possiede la policy `/think` predefinita per una famiglia di modelli                                                             |
| 37  | `isModernModelRef`                | Matcher modern-model per filtri di profilo live e selezione smoke                                              | Il provider possiede il matching del modello preferito per live/smoke                                                                         |
| 38  | `prepareRuntimeAuth`              | Scambia una credenziale configurata nel token/chiave runtime effettivo subito prima dell'inferenza            | Il provider richiede uno scambio di token o una credenziale di richiesta a breve durata                                                      |
| 39  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e superfici di stato correlate                   | Il provider richiede parsing personalizzato del token di utilizzo/quota o una diversa credenziale di utilizzo                                |
| 40  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot di utilizzo/quota specifiche del provider dopo che l'auth è stata risolta      | Il provider richiede un endpoint di utilizzo specifico del provider o un parser del payload                                                   |
| 41  | `createEmbeddingProvider`         | Costruisce un adapter di embedding di proprietà del provider per memoria/ricerca                               | Il comportamento di embedding della memoria appartiene al Plugin provider                                                                     |
| 42  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione del transcript per il provider                      | Il provider richiede una policy transcript personalizzata (ad esempio rimozione dei blocchi di thinking)                                     |
| 43  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica del transcript                                       | Il provider richiede riscritture di replay specifiche del provider oltre agli helper condivisi di Compaction                                 |
| 44  | `validateReplayTurns`             | Validazione finale o rimodellamento dei turni di replay prima del runner integrato                             | Il trasporto del provider richiede una validazione dei turni più rigorosa dopo la sanitizzazione generica                                    |
| 45  | `onModelSelected`                 | Esegue effetti collaterali post-selezione di proprietà del provider                                            | Il provider richiede telemetria o stato di proprietà del provider quando un modello diventa attivo                                           |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
Plugin provider corrispondente, poi passano agli altri Plugin provider con capability hook
finché uno non cambia effettivamente l'id del modello o il trasporto/configurazione. Questo mantiene
funzionanti gli shim provider alias/compat senza richiedere al chiamante di sapere quale
Plugin incluso possiede la riscrittura. Se nessun hook provider riscrive una voce di configurazione
supportata della famiglia Google, il normalizzatore di configurazione Google incluso applica comunque quella pulizia di compatibilità.

Se il provider richiede un protocollo wire completamente personalizzato o un esecutore di richieste personalizzato,
questa è una classe diversa di estensione. Questi hook servono per il comportamento del provider
che continua comunque a funzionare sul normale loop di inferenza di OpenClaw.

### Esempio provider

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

I Plugin provider inclusi combinano gli hook sopra per adattarsi al catalogo,
all'auth, al thinking, al replay e alle esigenze di utilizzo di ciascun vendor. L'insieme autorevole degli hook vive con
ogni Plugin sotto `extensions/`; questa pagina illustra le forme invece di
replicare l'elenco.

<AccordionGroup>
  <Accordion title="Provider catalogo pass-through">
    OpenRouter, Kilocode, Z.AI, xAI registrano `catalog` più
    `resolveDynamicModel` / `prepareDynamicModel` così possono esporre gli id modello upstream
    prima del catalogo statico di OpenClaw.
  </Accordion>
  <Accordion title="Provider con endpoint OAuth e utilizzo">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai associano
    `prepareRuntimeAuth` o `formatApiKey` con `resolveUsageAuth` +
    `fetchUsageSnapshot` per possedere lo scambio del token e l'integrazione `/usage`.
  </Accordion>
  <Accordion title="Famiglie di replay e pulizia del transcript">
    Le famiglie nominate condivise (`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`) permettono ai provider di aderire a
    una policy del transcript tramite `buildReplayPolicy` invece che far
    reimplementare la pulizia a ogni Plugin.
  </Accordion>
  <Accordion title="Provider solo catalogo">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway` e
    `volcengine` registrano solo `catalog` e sfruttano il loop di inferenza condiviso.
  </Accordion>
  <Accordion title="Helper di stream specifici Anthropic">
    Gli header beta, `/fast` / `serviceTier` e `context1m` vivono all'interno della
    seam pubblica `api.ts` / `contract-api.ts` del Plugin Anthropic
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) anziché nel
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

- `textToSpeech` restituisce il normale payload di output TTS core per superfici file/messaggio vocale.
- Usa la configurazione core `messages.tts` e la selezione del provider.
- Restituisce buffer audio PCM + sample rate. I Plugin devono ricampionare/codificare per i provider.
- `listVoices` è facoltativo per provider. Usalo per voice picker o flussi di setup di proprietà del vendor.
- Gli elenchi di voci possono includere metadati più ricchi come locale, genere e tag di personalità per picker consapevoli del provider.
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
- Usa i provider speech per il comportamento di sintesi di proprietà del vendor.
- L'input legacy Microsoft `edge` viene normalizzato all'id provider `microsoft`.
- Il modello di ownership preferito è orientato all'azienda: un singolo Plugin vendor può possedere
  provider di testo, voce, immagine e futuri media mentre OpenClaw aggiunge questi
  contratti di capability.

Per la comprensione di immagini/audio/video, i Plugin registrano un unico
provider tipizzato di comprensione dei media invece di una generica struttura chiave/valore:

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

- Mantieni orchestrazione, fallback, configurazione e collegamento al canale nel core.
- Mantieni il comportamento vendor nel Plugin provider.
- L'espansione additiva deve rimanere tipizzata: nuovi metodi facoltativi, nuovi
  campi facoltativi del risultato, nuove capability facoltative.
- La generazione video segue già lo stesso pattern:
  - il core possiede il contratto di capability e l'helper runtime
  - i Plugin vendor registrano `api.registerVideoGenerationProvider(...)`
  - i Plugin feature/canale consumano `api.runtime.videoGeneration.*`

Per gli helper runtime di comprensione dei media, i Plugin possono chiamare:

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

Per la trascrizione audio, i Plugin possono usare il runtime di comprensione dei media
o il vecchio alias STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Facoltativo quando il MIME non può essere dedotto in modo affidabile:
  mime: "audio/ogg",
});
```

Note:

- `api.runtime.mediaUnderstanding.*` è la superficie condivisa preferita per la
  comprensione di immagini/audio/video.
- Usa la configurazione audio core di comprensione dei media (`tools.media.audio`) e l'ordine di fallback dei provider.
- Restituisce `{ text: undefined }` quando non viene prodotto alcun output di trascrizione (ad esempio input saltato/non supportato).
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

- `provider` e `model` sono override facoltativi per singola esecuzione, non modifiche persistenti della sessione.
- OpenClaw rispetta quei campi di override solo per chiamanti affidabili.
- Per esecuzioni di fallback di proprietà del Plugin, gli operatori devono fare opt-in con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i Plugin affidabili a specifici target canonici `provider/model`, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni subagent dei Plugin non affidabili continuano a funzionare, ma le richieste di override vengono rifiutate invece di usare silenziosamente il fallback.

Per la ricerca web, i Plugin possono consumare l'helper runtime condiviso invece di
raggiungere il wiring degli strumenti dell'agente:

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

- Mantieni nel core la selezione del provider, la risoluzione delle credenziali e la semantica condivisa delle richieste.
- Usa i provider di ricerca web per trasporti di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per i Plugin feature/canale che necessitano di comportamento di ricerca senza dipendere dal wrapper degli strumenti dell'agente.

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

- `generate(...)`: genera un'immagine usando la catena di provider di generazione immagini configurata.
- `listProviders(...)`: elenca i provider di generazione immagini disponibili e le loro capability.

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
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale auth del gateway, oppure `"plugin"` per auth gestita dal Plugin/verifica del Webhook.
- `match`: facoltativo. `"exact"` (predefinito) o `"prefix"`.
- `replaceExisting`: facoltativo. Consente allo stesso Plugin di sostituire una propria registrazione di route esistente.
- `handler`: restituisce `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del Plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei Plugin devono dichiarare esplicitamente `auth`.
- I conflitti esatti `path + match` vengono rifiutati a meno che `replaceExisting: true`, e un Plugin non può sostituire la route di un altro Plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di fallthrough `exact`/`prefix` solo allo stesso livello auth.
- Le route `auth: "plugin"` **non** ricevono automaticamente gli scope runtime operator. Servono per Webhook/verifica firma gestiti dal Plugin, non per chiamate helper Gateway privilegiate.
- Le route `auth: "gateway"` vengono eseguite all'interno di uno scope runtime di richiesta Gateway, ma questo scope è intenzionalmente conservativo:
  - l'auth bearer con secret condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli scope runtime delle route plugin fissati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP affidabili che portano identità (ad esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente in quelle richieste di route plugin che portano identità, lo scope runtime usa come fallback `operator.write`
- Regola pratica: non presumere che una route plugin con auth gateway sia implicitamente una superficie admin. Se la tua route richiede comportamento solo-admin, richiedi una modalità auth che porti identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di importazione del Plugin SDK

Usa sottopercorsi SDK ristretti invece della barrel root monolitica `openclaw/plugin-sdk`
quando scrivi nuovi Plugin. Sottopercorsi core:

| Sottopercorso                        | Scopo                                              |
| ------------------------------------ | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`   | Primitive di registrazione del Plugin              |
| `openclaw/plugin-sdk/channel-core`   | Helper di entry/build del canale                   |
| `openclaw/plugin-sdk/core`           | Helper condivisi generici e contratto umbrella     |
| `openclaw/plugin-sdk/config-schema`  | Schema Zod root di `openclaw.json` (`OpenClawSchema`) |

I Plugin di canale scelgono da una famiglia di seam ristrette — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets` e `channel-actions`. Il comportamento di approvazione dovrebbe consolidarsi
su un unico contratto `approvalCapability` invece di mescolarsi tra campi
Plugin non correlati. Vedi [Plugin di canale](/it/plugins/sdk-channel-plugins).

Gli helper runtime e di configurazione vivono sotto sottopercorsi `*-runtime`
corrispondenti (`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, ecc.).

<Info>
`openclaw/plugin-sdk/channel-runtime` è deprecato — uno shim di compatibilità per
Plugin più vecchi. Il nuovo codice dovrebbe importare invece primitive generiche più ristrette.
</Info>

Entry point interni del repo (per root di ogni pacchetto Plugin incluso):

- `index.js` — entry del Plugin incluso
- `api.js` — barrel di helper/tipi
- `runtime-api.js` — barrel solo runtime
- `setup-entry.js` — entry del Plugin di setup

I Plugin esterni dovrebbero importare solo sottopercorsi `openclaw/plugin-sdk/*`. Non
importare mai `src/*` di un altro pacchetto Plugin dal core o da un altro Plugin.
Gli entry point caricati tramite facade preferiscono la snapshot attiva della configurazione runtime quando esiste, poi usano come fallback il file di configurazione risolto su disco.

Sottopercorsi specifici di capability come `image-generation`, `media-understanding`
e `speech` esistono perché i Plugin inclusi li usano oggi. Non sono
automaticamente contratti esterni congelati a lungo termine — controlla la relativa pagina
di riferimento dell'SDK quando fai affidamento su di essi.

## Schema degli strumenti message

I Plugin dovrebbero possedere i contributi allo schema `describeMessageTool(...)`
specifici del canale per primitive non-message come reactions, reads e polls.
La presentazione condivisa dell'invio dovrebbe usare il contratto generico `MessagePresentation`
invece di campi nativi del provider per pulsanti, componenti, blocchi o card.
Vedi [Message Presentation](/it/plugins/message-presentation) per il contratto,
le regole di fallback, la mappatura del provider e la checklist per gli autori di Plugin.

I Plugin con capability di invio dichiarano ciò che possono renderizzare tramite message capability:

- `presentation` per blocchi di presentazione semantica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` per richieste di consegna fissata

Il core decide se renderizzare nativamente la presentazione o degradarla a testo.
Non esporre escape hatch UI nativi del provider dallo strumento message generico.
Gli helper SDK deprecati per gli schema nativi legacy restano esportati per i
Plugin di terze parti esistenti, ma i nuovi Plugin non dovrebbero usarli.

## Risoluzione del target del canale

I Plugin di canale dovrebbero possedere la semantica del target specifica del canale. Mantieni generico l'
host condiviso in uscita e usa la superficie dell'adattatore di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  deve essere trattato come `direct`, `group` o `channel` prima del lookup di directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input deve saltare direttamente alla risoluzione tipo-id invece che alla ricerca in directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del Plugin quando il
  core ha bisogno di una risoluzione finale di proprietà del provider dopo la normalizzazione o dopo un
  miss della directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della
  session route specifica del provider una volta risolto un target.

Separazione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima della
  ricerca in peers/groups.
- Usa `looksLikeId` per controlli del tipo "tratta questo come un id target esplicito/nativo".
- Usa `resolveTarget` per il fallback di normalizzazione specifico del provider, non per una
  ricerca ampia in directory.
- Mantieni id nativi del provider come chat id, thread id, JID, handle e room
  id dentro i valori `target` o nei parametri specifici del provider, non nei campi SDK generici.

## Directory basate su configurazione

I Plugin che derivano voci di directory dalla configurazione dovrebbero mantenere quella logica nel
Plugin e riusare gli helper condivisi di
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale ha bisogno di peers/groups basati su configurazione come:

- peer DM guidati da allowlist
- mappe di canali/gruppi configurati
- fallback statici della directory limitati all'account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtraggio della query
- applicazione del limite
- helper di deduplica/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione dell'account specifica del canale e la normalizzazione degli id dovrebbero restare
nell'implementazione del Plugin.

## Cataloghi dei provider

I Plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce singola provider
- `{ providers }` per più voci provider

Usa `catalog` quando il Plugin possiede id modello specifici del provider, valori predefiniti di base URL o metadati del modello limitati dall'auth.

`catalog.order` controlla quando il catalogo di un Plugin viene unito rispetto ai
provider impliciti integrati di OpenClaw:

- `simple`: provider semplici guidati da chiave API o env
- `profile`: provider che appaiono quando esistono profili auth
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo gli altri provider impliciti

I provider successivi vincono in caso di collisione di chiavi, quindi i Plugin possono intenzionalmente sovrascrivere una voce provider integrata con lo stesso id provider.

Compatibilità:

- `discovery` continua a funzionare come alias legacy
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione di canale in sola lettura

Se il tuo Plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso runtime. Può assumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano i secret richiesti.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi di doctor/riparazione della configurazione
  non dovrebbero aver bisogno di materializzare credenziali runtime solo per
  descrivere la configurazione.

Comportamento consigliato per `inspectAccount(...)`:

- Restituisci solo stato descrittivo dell'account.
- Preserva `enabled` e `configured`.
- Includi campi di origine/stato delle credenziali quando rilevante, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire valori grezzi dei token solo per riportare la
  disponibilità in sola lettura. Restituire `tokenStatus: "available"` (e il corrispondente campo sorgente) è sufficiente per i comandi in stile status.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo consente ai comandi in sola lettura di riportare "configurato ma non disponibile in questo percorso di comando" invece di andare in crash o riportare erroneamente l'account come non configurato.

## Package pack

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

Ogni entry diventa un Plugin. Se il pack elenca più estensioni, l'id Plugin
diventa `name/<fileBase>`.

Se il tuo Plugin importa dipendenze npm, installale in quella directory così
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Guardrail di sicurezza: ogni entry `openclaw.extensions` deve restare dentro la directory del Plugin
dopo la risoluzione dei symlink. Le entry che escono dalla directory del pacchetto vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del Plugin con
`npm install --omit=dev --ignore-scripts` (nessun lifecycle script, nessuna dipendenza dev a runtime). Mantieni gli alberi di dipendenze del Plugin "puramente JS/TS" ed evita pacchetti che richiedono build `postinstall`.

Facoltativo: `openclaw.setupEntry` può puntare a un modulo leggero solo-setup.
Quando OpenClaw ha bisogno di superfici di setup per un Plugin di canale disabilitato, oppure
quando un Plugin di canale è abilitato ma ancora non configurato, carica `setupEntry`
invece della entry completa del Plugin. Questo mantiene avvio e setup più leggeri
quando la tua entry principale del Plugin collega anche strumenti, hook o altro codice
solo runtime.

Facoltativo: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può consentire a un Plugin di canale di aderire allo stesso percorso `setupEntry` durante la
fase di avvio pre-listen del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, significa che l'entry di setup
deve registrare ogni capability di proprietà del canale da cui l'avvio dipende, come:

- la registrazione del canale stessa
- qualsiasi route HTTP che debba essere disponibile prima che il gateway inizi ad ascoltare
- qualsiasi metodo, strumento o servizio del gateway che debba esistere durante quella stessa finestra

Se la tua entry completa possiede ancora una capability di avvio richiesta, non abilitare
questo flag. Mantieni il Plugin sul comportamento predefinito e lascia che OpenClaw carichi la
entry completa durante l'avvio.

I canali inclusi possono anche pubblicare helper di superficie contrattuale solo-setup che il core
può consultare prima che il runtime completo del canale venga caricato. L'attuale superficie
di promozione del setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando deve promuovere una configurazione legacy di canale
single-account in `channels.<id>.accounts.*` senza caricare la entry completa del Plugin.
Matrix è l'esempio incluso attuale: sposta solo le chiavi auth/bootstrap in un
account promosso nominato quando esistono già account nominati e può preservare una
chiave configurata di account predefinito non canonica invece di creare sempre
`accounts.default`.

Questi adapter di patch setup mantengono lazy la discovery della superficie contrattuale inclusa. Il tempo di
importazione resta leggero; la superficie di promozione viene caricata solo al primo uso invece di rientrare nell'avvio del canale incluso al momento dell'importazione del modulo.

Quando quelle superfici di avvio includono metodi RPC del gateway, mantienili su un
prefisso specifico del Plugin. I namespace admin core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e vengono sempre risolti
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

### Metadati del catalogo dei canali

I Plugin di canale possono pubblicizzare metadati di setup/discovery tramite `openclaw.channel` e
suggerimenti di installazione tramite `openclaw.install`. Questo mantiene il core privo di dati di catalogo.

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
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
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

- `detailLabel`: etichetta secondaria per superfici più ricche di catalogo/stato
- `docsLabel`: sovrascrive il testo del link per il collegamento alla documentazione
- `preferOver`: id di Plugin/canale a priorità inferiore che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo per la superficie di selezione
- `markdownCapable`: contrassegna il canale come capace di markdown per decisioni di formattazione in uscita
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato a `false`
- `exposure.setup`: nasconde il canale dai selettori interattivi di setup/configurazione quando impostato a `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: consente al canale di aderire al flusso standard di avvio rapido `allowFrom`
- `forceAccountBinding`: richiede un binding account esplicito anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce il lookup della sessione quando risolve i target di announce

OpenClaw può anche unire **cataloghi di canali esterni** (per esempio un export del
registry MPM). Inserisci un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o più file JSON (delimitati da virgole/punto e virgola/`PATH`). Ogni file dovrebbe
contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy per la chiave `"entries"`.

Le voci generate del catalogo dei canali e del catalogo di installazione dei provider espongono
fatti normalizzati della sorgente di installazione accanto al blocco grezzo `openclaw.install`. I
fatti normalizzati identificano se la specifica npm è una versione esatta o un selettore flottante,
se sono presenti metadati di integrità attesi e se è disponibile anche un percorso sorgente locale. Quando l'identità del catalogo/pacchetto è nota, i fatti normalizzati avvertono se il nome del pacchetto npm analizzato diverge da quell'identità.
Avvertono anche quando `defaultChoice` non è valido o punta a una sorgente non
disponibile e quando sono presenti metadati di integrità npm senza una sorgente
npm valida. I consumer dovrebbero trattare `installSource` come un campo facoltativo additivo così
le vecchie voci costruite a mano e gli shim di compatibilità non devono sintetizzarlo.
Questo consente a onboarding e diagnostica di spiegare lo stato del source plane senza
importare il runtime del Plugin.

Le voci npm esterne ufficiali dovrebbero preferire un `npmSpec` esatto più
`expectedIntegrity`. I soli nomi dei pacchetti e i dist-tag continuano a funzionare per
compatibilità, ma espongono avvisi sul source plane così il catalogo può muoversi
verso installazioni fissate e verificate per integrità senza rompere i Plugin esistenti.
Quando l'onboarding installa da un percorso di catalogo locale, registra una
voce `plugins.installs` con `source: "path"` e un `sourcePath`
relativo allo spazio di lavoro quando possibile. Il percorso operativo assoluto di caricamento resta in
`plugins.load.paths`; il record di installazione evita di duplicare percorsi di workstation locali
nella configurazione a lunga durata. Questo mantiene visibili le installazioni locali di sviluppo alla
diagnostica del source plane senza aggiungere una seconda superficie grezza di divulgazione dei percorsi del filesystem.

## Plugin del motore di contesto

I Plugin del motore di contesto possiedono l'orchestrazione del contesto di sessione per ingestione,
assemblaggio e Compaction. Registrali dal tuo Plugin con
`api.registerContextEngine(id, factory)`, quindi seleziona il motore attivo con
`plugins.slots.contextEngine`.

Usalo quando il tuo Plugin deve sostituire o estendere la pipeline di contesto predefinita invece di limitarsi ad aggiungere ricerca in memoria o hook.

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

Se il tuo motore **non** possiede l'algoritmo di Compaction, mantieni comunque implementato `compact()`
e delegalo esplicitamente:

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

## Aggiungere una nuova capability

Quando un Plugin ha bisogno di un comportamento che non rientra nell'API corrente, non aggirare
il sistema dei Plugin con un accesso privato interno. Aggiungi la capability mancante.

Sequenza consigliata:

1. definire il contratto core
   Decidi quale comportamento condiviso il core dovrebbe possedere: policy, fallback, merge della configurazione,
   ciclo di vita, semantica rivolta ai canali e forma dell'helper runtime.
2. aggiungere superfici tipizzate di registrazione/runtime del Plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la più piccola
   superficie di capability tipizzata utile.
3. collegare core + consumer di canale/funzionalità
   I canali e i Plugin di funzionalità dovrebbero consumare la nuova capability tramite il core,
   non importando direttamente un'implementazione vendor.
4. registrare implementazioni vendor
   I Plugin vendor registrano quindi i propri backend rispetto alla capability.
5. aggiungere copertura contrattuale
   Aggiungi test così ownership e forma della registrazione restano esplicite nel tempo.

È così che OpenClaw resta orientato senza diventare hardcoded verso la visione del mondo di un singolo
provider. Vedi il [Capability Cookbook](/it/plugins/architecture)
per una checklist concreta dei file e un esempio completo.

### Checklist della capability

Quando aggiungi una nuova capability, l'implementazione di solito dovrebbe toccare
insieme queste superfici:

- tipi del contratto core in `src/<capability>/types.ts`
- runner/helper runtime core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API del Plugin in `src/plugins/types.ts`
- collegamento del registry Plugin in `src/plugins/registry.ts`
- esposizione runtime del Plugin in `src/plugins/runtime/*` quando i Plugin di funzionalità/canale
  devono consumarla
- helper di cattura/test in `src/test-utils/plugin-registration.ts`
- asserzioni di ownership/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/Plugin in `docs/`

Se una di queste superfici manca, di solito è un segno che la capability non è
ancora completamente integrata.

### Template della capability

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
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Pattern di test del contratto:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Questo mantiene semplice la regola:

- il core possiede il contratto della capability + l'orchestrazione
- i Plugin vendor possiedono le implementazioni vendor
- i Plugin di funzionalità/canale consumano gli helper runtime
- i test di contratto mantengono esplicita l'ownership

## Correlati

- [Architettura dei Plugin](/it/plugins/architecture) — modello pubblico delle capability e forme
- [Sottopercorsi del Plugin SDK](/it/plugins/sdk-subpaths)
- [Setup del Plugin SDK](/it/plugins/sdk-setup)
- [Creazione di Plugin](/it/plugins/building-plugins)
