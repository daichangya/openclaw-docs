---
read_when:
    - Creazione o debug dei plugin OpenClaw nativi
    - Comprendere il modello di capacità del plugin o i confini di proprietà
    - Lavorare sulla pipeline di caricamento o sul registro del plugin
    - Implementazione degli hook di runtime del provider o dei plugin di canale
sidebarTitle: Internals
summary: 'Interni del Plugin: modello di capacità, proprietà, contratti, pipeline di caricamento e helper di runtime'
title: Interni del Plugin
x-i18n:
    generated_at: "2026-04-15T08:18:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86798b5d2b0ad82d2397a52a6c21ed37fe6eee1dd3d124a9e4150c4f630b841
    source_path: plugins/architecture.md
    workflow: 15
---

# Interni del Plugin

<Info>
  Questa è la **referenza architetturale approfondita**. Per guide pratiche, vedi:
  - [Installare e usare i plugin](/it/tools/plugin) — guida per l'utente
  - [Per iniziare](/it/plugins/building-plugins) — primo tutorial sui plugin
  - [Plugin di canale](/it/plugins/sdk-channel-plugins) — crea un canale di messaggistica
  - [Plugin provider](/it/plugins/sdk-provider-plugins) — crea un provider di modelli
  - [Panoramica dell'SDK](/it/plugins/sdk-overview) — mappa degli import e API di registrazione
</Info>

Questa pagina copre l'architettura interna del sistema di plugin di OpenClaw.

## Modello pubblico delle capacità

Le capacità sono il modello pubblico dei **plugin nativi** all'interno di OpenClaw. Ogni
plugin OpenClaw nativo si registra rispetto a uno o più tipi di capacità:

| Capacità              | Metodo di registrazione                         | Plugin di esempio                    |
| --------------------- | ----------------------------------------------- | ------------------------------------ |
| Inferenza testuale    | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                | `openai`, `anthropic`                |
| Voce                  | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Trascrizione in tempo reale | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| Voce in tempo reale   | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                   |
| Generazione di immagini | `api.registerImageGenerationProvider(...)`    | `openai`, `google`, `fal`, `minimax` |
| Generazione musicale  | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Generazione video     | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Recupero web          | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Ricerca web           | `api.registerWebSearchProvider(...)`            | `google`                             |
| Canale / messaggistica | `api.registerChannel(...)`                     | `msteams`, `matrix`                  |

Un plugin che registra zero capacità ma fornisce hook, strumenti o
servizi è un plugin **legacy solo hook**. Questo pattern è ancora pienamente supportato.

### Orientamento sulla compatibilità esterna

Il modello delle capacità è stato integrato nel core ed è usato oggi dai plugin
nativi/in bundle, ma la compatibilità dei plugin esterni richiede ancora un livello
di rigore più alto di "è esportato, quindi è congelato".

Indicazioni attuali:

- **plugin esterni esistenti:** mantenere funzionanti le integrazioni basate su hook; trattare
  questo come base di compatibilità
- **nuovi plugin nativi/in bundle:** preferire la registrazione esplicita delle capacità rispetto a
  accessi specifici del vendor o a nuovi design solo hook
- **plugin esterni che adottano la registrazione delle capacità:** consentito, ma trattare le
  superfici helper specifiche delle capacità come in evoluzione, a meno che la documentazione non contrassegni
  esplicitamente un contratto come stabile

Regola pratica:

- le API di registrazione delle capacità sono la direzione prevista
- gli hook legacy restano il percorso più sicuro per evitare rotture per i plugin esterni durante
  la transizione
- non tutti i sottopercorsi helper esportati sono equivalenti; preferire il contratto
  documentato e ristretto, non esportazioni helper incidentali

### Forme dei plugin

OpenClaw classifica ogni plugin caricato in una forma in base al suo effettivo
comportamento di registrazione (non solo ai metadati statici):

- **plain-capability** -- registra esattamente un tipo di capacità (per esempio un
  plugin solo provider come `mistral`)
- **hybrid-capability** -- registra più tipi di capacità (per esempio
  `openai` possiede inferenza testuale, voce, comprensione dei media e
  generazione di immagini)
- **hook-only** -- registra solo hook (tipizzati o personalizzati), senza capacità,
  strumenti, comandi o servizi
- **non-capability** -- registra strumenti, comandi, servizi o route ma nessuna
  capacità

Usa `openclaw plugins inspect <id>` per vedere la forma di un plugin e il dettaglio
delle capacità. Vedi [riferimento CLI](/cli/plugins#inspect) per i dettagli.

### Hook legacy

L'hook `before_agent_start` resta supportato come percorso di compatibilità per
i plugin solo hook. I plugin legacy reali dipendono ancora da esso.

Direzione:

- mantenerlo funzionante
- documentarlo come legacy
- preferire `before_model_resolve` per il lavoro di override di modello/provider
- preferire `before_prompt_build` per il lavoro di mutazione del prompt
- rimuoverlo solo dopo che l'uso reale sarà calato e la copertura delle fixture avrà dimostrato la sicurezza della migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` o `openclaw plugins inspect <id>`, potresti vedere
una di queste etichette:

| Segnale                   | Significato                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | La configurazione viene analizzata correttamente e i plugin vengono risolti |
| **compatibility advisory** | Il plugin usa un pattern supportato ma più vecchio (ad es. `hook-only`) |
| **legacy warning**        | Il plugin usa `before_agent_start`, che è deprecato          |
| **hard error**            | La configurazione non è valida o il plugin non è riuscito a caricarsi |

Né `hook-only` né `before_agent_start` romperanno il tuo plugin oggi --
`hook-only` è informativo e `before_agent_start` genera solo un avviso. Questi
segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema di plugin di OpenClaw ha quattro livelli:

1. **Manifest + rilevamento**
   OpenClaw trova i plugin candidati dai percorsi configurati, dalle radici del workspace,
   dalle radici globali delle estensioni e dalle estensioni incluse. Il rilevamento legge prima i
   manifest nativi `openclaw.plugin.json` insieme ai manifest dei bundle supportati.
2. **Abilitazione + validazione**
   Il core decide se un plugin rilevato è abilitato, disabilitato, bloccato o
   selezionato per uno slot esclusivo come la memoria.
3. **Caricamento a runtime**
   I plugin OpenClaw nativi vengono caricati in-process tramite jiti e registrano
   capacità in un registro centrale. I bundle compatibili vengono normalizzati in
   record del registro senza importare codice di runtime.
4. **Consumo della superficie**
   Il resto di OpenClaw legge il registro per esporre strumenti, canali, configurazione
   dei provider, hook, route HTTP, comandi CLI e servizi.

Per la CLI dei plugin in particolare, il rilevamento dei comandi root è diviso in due fasi:

- i metadati in fase di parsing provengono da `registerCli(..., { descriptors: [...] })`
- il vero modulo CLI del plugin può restare lazy e registrarsi alla prima invocazione

Questo mantiene il codice CLI posseduto dal plugin all'interno del plugin, permettendo comunque a OpenClaw
di riservare i nomi dei comandi root prima del parsing.

Il confine progettuale importante:

- il rilevamento e la validazione della configurazione dovrebbero funzionare da metadati di **manifest/schema**
  senza eseguire codice del plugin
- il comportamento nativo a runtime deriva dal percorso `register(api)` del modulo plugin

Questa separazione consente a OpenClaw di validare la configurazione, spiegare i plugin mancanti/disabilitati e
costruire suggerimenti per UI/schema prima che il runtime completo sia attivo.

### Plugin di canale e strumento di messaggio condiviso

I plugin di canale non devono registrare uno strumento separato per inviare/modificare/reagire per
le normali azioni di chat. OpenClaw mantiene nel core un unico strumento `message`, e
i plugin di canale gestiscono dietro di esso il rilevamento e l'esecuzione specifici del canale.

Il confine attuale è:

- il core possiede l'host condiviso dello strumento `message`, l'instradamento del prompt, la
  gestione di sessioni/thread e il dispatch di esecuzione
- i plugin di canale possiedono il rilevamento delle azioni con ambito, il rilevamento delle capacità e gli eventuali
  frammenti di schema specifici del canale
- i plugin di canale possiedono la grammatica della conversazione di sessione specifica del provider, come
  il modo in cui gli id conversazione codificano gli id thread o ereditano dalle conversazioni padre
- i plugin di canale eseguono l'azione finale tramite il loro adapter di azione

Per i plugin di canale, la superficie SDK è
`ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata di rilevamento unificata
consente a un plugin di restituire insieme azioni visibili, capacità e contributi
allo schema, così questi elementi non divergono.

Quando un parametro dello strumento di messaggio specifico del canale trasporta una sorgente media, come un
percorso locale o un URL di media remoto, il plugin dovrebbe anche restituire
`mediaSourceParams` da `describeMessageTool(...)`. Il core usa questo elenco esplicito
per applicare la normalizzazione dei percorsi del sandbox e i suggerimenti di accesso ai media in uscita
senza hardcodare nomi di parametri posseduti dal plugin.
Preferisci qui mappe con ambito per azione, non un unico elenco piatto per l'intero canale, così un
parametro media solo profilo non viene normalizzato su azioni non correlate come
`send`.

Il core passa l'ambito di runtime a questo passaggio di rilevamento. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` inbound affidabile

Questo è importante per i plugin sensibili al contesto. Un canale può nascondere o esporre
azioni di messaggio in base all'account attivo, alla stanza/thread/messaggio corrente o
all'identità affidabile del richiedente, senza hardcodare rami specifici del canale
nello strumento `message` del core.

Per questo motivo le modifiche di instradamento dell'embedded-runner restano lavoro del plugin: il runner è
responsabile dell'inoltro dell'identità corrente di chat/sessione al confine di rilevamento del plugin, così lo
strumento condiviso `message` espone la giusta superficie posseduta dal canale per il turno corrente.

Per gli helper di esecuzione posseduti dal canale, i plugin inclusi dovrebbero mantenere il runtime di esecuzione
all'interno dei propri moduli di estensione. Il core non possiede più i runtime delle azioni di messaggio di Discord,
Slack, Telegram o WhatsApp sotto `src/agents/tools`.
Non pubblichiamo sottopercorsi separati `plugin-sdk/*-action-runtime`, e i plugin inclusi
dovrebbero importare direttamente il proprio codice di runtime locale dai loro
moduli posseduti dall'estensione.

Lo stesso confine si applica in generale alle seam dell'SDK con nome del provider: il core non dovrebbe
importare barrel di convenienza specifici del canale per estensioni come Slack, Discord, Signal,
WhatsApp o simili. Se il core ha bisogno di un comportamento, deve o consumare il
barrel `api.ts` / `runtime-api.ts` del plugin incluso stesso oppure promuovere l'esigenza
in una capacità generica e ristretta nell'SDK condiviso.

Per i sondaggi in particolare, ci sono due percorsi di esecuzione:

- `outbound.sendPoll` è la base condivisa per i canali che rientrano nel modello comune di
  sondaggio
- `actions.handleAction("poll")` è il percorso preferito per la semantica dei sondaggi specifica del canale
  o per parametri aggiuntivi del sondaggio

Il core ora rimanda il parsing condiviso dei sondaggi fino a dopo che il dispatch del sondaggio del plugin ha rifiutato
l'azione, così i gestori di sondaggi posseduti dal plugin possono accettare campi di sondaggio specifici
del canale senza essere prima bloccati dal parser generico dei sondaggi.

Vedi [Pipeline di caricamento](#load-pipeline) per la sequenza completa di avvio.

## Modello di proprietà delle capacità

OpenClaw tratta un plugin nativo come il confine di proprietà per una **azienda** o una
**funzionalità**, non come un contenitore disordinato di integrazioni non correlate.

Questo significa:

- un plugin aziendale dovrebbe di solito possedere tutte le superfici OpenClaw rivolte a quell'azienda
- un plugin di funzionalità dovrebbe di solito possedere l'intera superficie della funzionalità che introduce
- i canali dovrebbero consumare capacità core condivise invece di reimplementare in modo ad hoc il comportamento
  del provider

Esempi:

- il plugin `openai` incluso possiede il comportamento del provider di modelli OpenAI e il comportamento OpenAI per
  voce + voce in tempo reale + comprensione dei media + generazione di immagini
- il plugin `elevenlabs` incluso possiede il comportamento vocale di ElevenLabs
- il plugin `microsoft` incluso possiede il comportamento vocale di Microsoft
- il plugin `google` incluso possiede il comportamento del provider di modelli Google più il comportamento Google per
  comprensione dei media + generazione di immagini + ricerca web
- il plugin `firecrawl` incluso possiede il comportamento di recupero web di Firecrawl
- i plugin `minimax`, `mistral`, `moonshot` e `zai` inclusi possiedono i loro
  backend di comprensione dei media
- il plugin `qwen` incluso possiede il comportamento del provider testuale Qwen più
  il comportamento di comprensione dei media e generazione video
- il plugin `voice-call` è un plugin di funzionalità: possiede il trasporto delle chiamate, gli strumenti,
  la CLI, le route e il bridging dei media-stream di Twilio, ma consuma capacità condivise di voce
  più trascrizione in tempo reale e voce in tempo reale invece di
  importare direttamente i plugin dei vendor

Lo stato finale previsto è:

- OpenAI vive in un unico plugin anche se copre modelli testuali, voce, immagini e
  video futuri
- un altro vendor può fare lo stesso per la propria area di superficie
- i canali non si preoccupano di quale plugin del vendor possieda il provider; consumano il
  contratto di capacità condiviso esposto dal core

Questa è la distinzione chiave:

- **plugin** = confine di proprietà
- **capability** = contratto core che più plugin possono implementare o consumare

Quindi, se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è
"quale provider dovrebbe hardcodare la gestione del video?" La prima domanda è "qual è
il contratto core della capacità video?" Una volta che questo contratto esiste, i plugin dei vendor
possono registrarsi su di esso e i plugin di canale/funzionalità possono consumarlo.

Se la capacità non esiste ancora, la mossa giusta di solito è:

1. definire la capacità mancante nel core
2. esporla tramite l'API/runtime dei plugin in modo tipizzato
3. collegare canali/funzionalità a quella capacità
4. lasciare che i plugin dei vendor registrino le implementazioni

Questo mantiene esplicita la proprietà evitando al tempo stesso comportamenti del core che dipendono da un
singolo vendor o da un percorso di codice specifico di un plugin isolato.

### Stratificazione delle capacità

Usa questo modello mentale quando decidi dove deve stare il codice:

- **livello delle capacità del core**: orchestrazione condivisa, policy, fallback, regole di
  merge della configurazione, semantica di consegna e contratti tipizzati
- **livello del plugin del vendor**: API specifiche del vendor, autenticazione, cataloghi di modelli, sintesi
  vocale, generazione di immagini, backend video futuri, endpoint di utilizzo
- **livello del plugin di canale/funzionalità**: integrazione Slack/Discord/voice-call/ecc.
  che consuma capacità core e le presenta su una superficie

Per esempio, il TTS segue questa forma:

- il core possiede la policy TTS al momento della risposta, l'ordine di fallback, le preferenze e la consegna al canale
- `openai`, `elevenlabs` e `microsoft` possiedono le implementazioni di sintesi
- `voice-call` consuma l'helper di runtime TTS della telefonia

Lo stesso pattern dovrebbe essere preferito per le capacità future.

### Esempio di plugin aziendale multi-capacità

Un plugin aziendale dovrebbe risultare coeso dall'esterno. Se OpenClaw ha contratti condivisi
per modelli, voce, trascrizione in tempo reale, voce in tempo reale, comprensione dei media,
generazione di immagini, generazione video, recupero web e ricerca web,
un vendor può possedere tutte le proprie superfici in un unico posto:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Ciò che conta non sono i nomi esatti degli helper. Conta la forma:

- un plugin possiede la superficie del vendor
- il core continua a possedere i contratti delle capacità
- i canali e i plugin di funzionalità consumano gli helper `api.runtime.*`, non il codice del vendor
- i test di contratto possono verificare che il plugin abbia registrato le capacità che
  dichiara di possedere

### Esempio di capacità: comprensione video

OpenClaw tratta già la comprensione di immagini/audio/video come un'unica
capacità condivisa. Lo stesso modello di proprietà si applica anche qui:

1. il core definisce il contratto di comprensione dei media
2. i plugin dei vendor registrano `describeImage`, `transcribeAudio` e
   `describeVideo` secondo i casi
3. i canali e i plugin di funzionalità consumano il comportamento condiviso del core invece di
   collegarsi direttamente al codice del vendor

Questo evita di incorporare nel core le assunzioni video di un singolo provider. Il plugin possiede
la superficie del vendor; il core possiede il contratto della capacità e il comportamento di fallback.

La generazione video usa già questa stessa sequenza: il core possiede il contratto tipizzato della
capacità e l'helper di runtime, e i plugin dei vendor registrano
implementazioni `api.registerVideoGenerationProvider(...)` su di esso.

Ti serve una checklist concreta di rollout? Vedi
[Capability Cookbook](/it/plugins/architecture).

## Contratti e applicazione

La superficie dell'API dei plugin è intenzionalmente tipizzata e centralizzata in
`OpenClawPluginApi`. Questo contratto definisce i punti di registrazione supportati e
gli helper di runtime su cui un plugin può fare affidamento.

Perché è importante:

- gli autori di plugin ottengono un unico standard interno stabile
- il core può rifiutare proprietà duplicate, come due plugin che registrano lo stesso
  id provider
- l'avvio può mostrare diagnostica utile per registrazioni malformate
- i test di contratto possono applicare la proprietà dei plugin inclusi e prevenire derive silenziose

Ci sono due livelli di applicazione:

1. **applicazione della registrazione a runtime**
   Il registro dei plugin convalida le registrazioni mentre i plugin vengono caricati. Esempi:
   id provider duplicati, id provider vocali duplicati e registrazioni
   malformate producono diagnostica dei plugin invece di comportamento indefinito.
2. **test di contratto**
   I plugin inclusi vengono acquisiti nei registri di contratto durante l'esecuzione dei test così
   OpenClaw può verificare esplicitamente la proprietà. Oggi questo è usato per provider
   di modelli, provider vocali, provider di ricerca web e proprietà di registrazione dei plugin inclusi.

L'effetto pratico è che OpenClaw sa, in anticipo, quale plugin possiede quale
superficie. Questo consente al core e ai canali di comporsi senza attriti perché la proprietà è
dichiarata, tipizzata e verificabile invece che implicita.

### Cosa appartiene a un contratto

I buoni contratti di plugin sono:

- tipizzati
- piccoli
- specifici della capacità
- posseduti dal core
- riutilizzabili da più plugin
- consumabili da canali/funzionalità senza conoscenza del vendor

I cattivi contratti di plugin sono:

- policy specifiche del vendor nascoste nel core
- vie di fuga specifiche di un plugin isolato che aggirano il registro
- codice del canale che accede direttamente a un'implementazione del vendor
- oggetti runtime ad hoc che non fanno parte di `OpenClawPluginApi` o
  `api.runtime`

In caso di dubbio, alza il livello di astrazione: definisci prima la capacità, poi
lascia che i plugin si colleghino ad essa.

## Modello di esecuzione

I plugin OpenClaw nativi vengono eseguiti **in-process** con il Gateway. Non sono
sandboxati. Un plugin nativo caricato ha lo stesso confine di fiducia a livello di processo del
codice core.

Implicazioni:

- un plugin nativo può registrare strumenti, gestori di rete, hook e servizi
- un bug in un plugin nativo può mandare in crash o destabilizzare il gateway
- un plugin nativo malevolo equivale a esecuzione di codice arbitrario all'interno
  del processo OpenClaw

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw attualmente li tratta
come pacchetti di metadati/contenuti. Nelle release attuali, questo significa per lo più
Skills inclusi.

Usa allowlist e percorsi espliciti di installazione/caricamento per i plugin non inclusi. Tratta
i plugin del workspace come codice di sviluppo, non come impostazioni predefinite di produzione.

Per i nomi dei pacchetti workspace inclusi, mantieni l'id del plugin ancorato nel nome
npm: `@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando
il pacchetto espone intenzionalmente un ruolo di plugin più ristretto.

Nota importante sulla fiducia:

- `plugins.allow` considera attendibili gli **id dei plugin**, non la provenienza della sorgente.
- Un plugin del workspace con lo stesso id di un plugin incluso intenzionalmente oscura
  la copia inclusa quando quel plugin del workspace è abilitato/in allowlist.
- Questo è normale e utile per lo sviluppo locale, i test di patch e le hotfix.

## Confine di esportazione

OpenClaw esporta capacità, non comodità di implementazione.

Mantieni pubblica la registrazione delle capacità. Riduci le esportazioni helper non contrattuali:

- sottopercorsi helper specifici dei plugin inclusi
- sottopercorsi di plumbing runtime non destinati a essere API pubbliche
- helper di convenienza specifici del vendor
- helper di setup/onboarding che sono dettagli di implementazione

Alcuni sottopercorsi helper dei plugin inclusi restano ancora nella mappa di esportazione generata dell'SDK
per compatibilità e manutenzione dei plugin inclusi. Esempi attuali includono
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e diverse seam `plugin-sdk/matrix*`. Trattali come
esportazioni riservate di dettaglio implementativo, non come pattern SDK consigliato per
nuovi plugin di terze parti.

## Pipeline di caricamento

All'avvio, OpenClaw fa approssimativamente questo:

1. rileva le radici candidate dei plugin
2. legge i manifest nativi o dei bundle compatibili e i metadati dei pacchetti
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ogni candidato
6. carica i moduli nativi abilitati tramite jiti
7. chiama gli hook nativi `register(api)` (o `activate(api)` — un alias legacy) e raccoglie le registrazioni nel registro dei plugin
8. espone il registro alle superfici dei comandi/runtime

<Note>
`activate` è un alias legacy di `register` — il loader risolve qualunque dei due sia presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin inclusi usano `register`; per i nuovi plugin preferisci `register`.
</Note>

I controlli di sicurezza avvengono **prima** dell'esecuzione a runtime. I candidati vengono bloccati
quando l'entry esce dalla root del plugin, il percorso è scrivibile da chiunque o la proprietà del percorso
sembra sospetta per i plugin non inclusi.

### Comportamento manifest-first

Il manifest è la fonte di verità del control plane. OpenClaw lo usa per:

- identificare il plugin
- rilevare canali/Skills/schema di configurazione dichiarati o capacità del bundle
- convalidare `plugins.entries.<id>.config`
- arricchire etichette/segnaposto della Control UI
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e setup senza caricare il runtime del plugin

Per i plugin nativi, il modulo runtime è la parte del data plane. Registra
il comportamento effettivo, come hook, strumenti, comandi o flussi dei provider.

I blocchi facoltativi `activation` e `setup` del manifest restano sul control plane.
Sono descrittori solo metadati per la pianificazione dell'attivazione e il rilevamento del setup;
non sostituiscono la registrazione a runtime, `register(...)` o `setupEntry`.
I primi consumer di attivazione live ora usano suggerimenti del manifest per comandi, canali e provider
per restringere il caricamento dei plugin prima di una più ampia materializzazione del registro:

- il caricamento CLI si restringe ai plugin che possiedono il comando primario richiesto
- la risoluzione del setup/plugin del canale si restringe ai plugin che possiedono l'id
  del canale richiesto
- la risoluzione esplicita di setup/runtime del provider si restringe ai plugin che possiedono l'
  id provider richiesto

Il rilevamento del setup ora preferisce id posseduti dai descrittori come `setup.providers` e
`setup.cliBackends` per restringere i plugin candidati prima di ripiegare su
`setup-api` per i plugin che hanno ancora bisogno di hook di runtime in fase di setup. Se più di
un plugin rilevato rivendica lo stesso id normalizzato di provider di setup o backend CLI,
la ricerca del setup rifiuta il proprietario ambiguo invece di affidarsi all'ordine di rilevamento.

### Cosa memorizza in cache il loader

OpenClaw mantiene brevi cache in-process per:

- risultati del rilevamento
- dati del registro dei manifest
- registri dei plugin caricati

Queste cache riducono gli avvii intensi e l'overhead dei comandi ripetuti. È sicuro
considerarle cache prestazionali di breve durata, non persistenza.

Nota sulle prestazioni:

- Imposta `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oppure
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` per disabilitare queste cache.
- Regola le finestre di cache con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modello del registro

I plugin caricati non mutano direttamente in modo casuale le variabili globali del core. Si registrano in un
registro centrale dei plugin.

Il registro tiene traccia di:

- record dei plugin (identità, sorgente, origine, stato, diagnostica)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- gestori RPC del Gateway
- route HTTP
- registrar CLI
- servizi in background
- comandi posseduti dal plugin

Le funzionalità core leggono poi da questo registro invece di parlare direttamente con i moduli plugin.
Questo mantiene il caricamento unidirezionale:

- modulo plugin -> registrazione nel registro
- runtime core -> consumo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici core
ha bisogno di un solo punto di integrazione: "leggi il registro", non "gestisci come caso speciale ogni modulo plugin".

## Callback di binding della conversazione

I plugin che associano una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere una callback dopo che una richiesta di binding è stata approvata o negata:

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

Campi del payload della callback:

- `status`: `"approved"` oppure `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` oppure `"deny"`
- `binding`: il binding risolto per le richieste approvate
- `request`: il riepilogo della richiesta originale, suggerimento di detach, id del mittente e
  metadati della conversazione

Questa callback è solo di notifica. Non modifica chi è autorizzato ad associare una
conversazione, e viene eseguita dopo che la gestione dell'approvazione da parte del core è terminata.

## Hook di runtime del provider

I plugin provider ora hanno due livelli:

- metadati del manifest: `providerAuthEnvVars` per una ricerca economica dell'autenticazione del provider tramite env
  prima del caricamento del runtime, `providerAuthAliases` per le varianti di provider che condividono
  l'autenticazione, `channelEnvVars` per una ricerca economica dell'env/setup del canale prima del caricamento del runtime,
  più `providerAuthChoices` per etichette economiche di onboarding/scelta di autenticazione e
  metadati dei flag CLI prima del caricamento del runtime
- hook in fase di configurazione: `catalog` / `discovery` legacy più `applyConfigDefaults`
- hook di runtime: `normalizeModelId`, `normalizeTransport`,
  `normalizeConfig`,
  `applyNativeStreamingUsageCompat`, `resolveConfigApiKey`,
  `resolveSyntheticAuth`, `resolveExternalAuthProfiles`,
  `shouldDeferSyntheticProfileAuth`,
  `resolveDynamicModel`, `prepareDynamicModel`, `normalizeResolvedModel`,
  `contributeResolvedModelCompat`, `capabilities`,
  `normalizeToolSchemas`, `inspectToolSchemas`,
  `resolveReasoningOutputMode`, `prepareExtraParams`, `createStreamFn`,
  `wrapStreamFn`, `resolveTransportTurnState`,
  `resolveWebSocketSessionPolicy`, `formatApiKey`, `refreshOAuth`,
  `buildAuthDoctorHint`, `matchesContextOverflowError`,
  `classifyFailoverReason`, `isCacheTtlEligible`,
  `buildMissingAuthMessage`, `suppressBuiltInModel`, `augmentModelCatalog`,
  `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw continua a possedere il loop generico dell'agente, il failover, la gestione della trascrizione e
la policy degli strumenti. Questi hook sono la superficie di estensione per il comportamento specifico del provider senza
richiedere un intero trasporto di inferenza personalizzato.

Usa il manifest `providerAuthEnvVars` quando il provider ha credenziali basate su env
che i percorsi generici di autenticazione/stato/selettore modello dovrebbero vedere senza caricare il runtime del plugin.
Usa il manifest `providerAuthAliases` quando un id provider deve riutilizzare
le variabili env, i profili di autenticazione, l'autenticazione supportata da config e la scelta di onboarding della chiave API
di un altro id provider. Usa il manifest `providerAuthChoices` quando le superfici CLI di onboarding/scelta di autenticazione
devono conoscere l'id di scelta del provider, le etichette di gruppo e il semplice
collegamento di autenticazione a un solo flag senza caricare il runtime del provider. Mantieni `envVars` del runtime del provider
per suggerimenti rivolti all'operatore, come etichette di onboarding o variabili di setup di
client-id/client-secret OAuth.

Usa il manifest `channelEnvVars` quando un canale ha autenticazione o setup guidati da env che
il fallback generico dell'env della shell, i controlli di config/stato o i prompt di setup dovrebbero vedere
senza caricare il runtime del canale.

### Ordine e utilizzo degli hook

Per i plugin di modello/provider, OpenClaw chiama gli hook approssimativamente in questo ordine.
La colonna "Quando usarlo" è la guida decisionale rapida.

| #   | Hook                              | Cosa fa                                                                                                        | Quando usarlo                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`         | Il provider possiede un catalogo o valori predefiniti di base URL                                                                           |
| 2   | `applyConfigDefaults`             | Applica valori predefiniti globali della configurazione posseduti dal provider durante la materializzazione della configurazione | I valori predefiniti dipendono dalla modalità di autenticazione, dall'env o dalla semantica della famiglia di modelli del provider         |
| --  | _(built-in model lookup)_         | OpenClaw prova prima il normale percorso di registro/catalogo                                                  | _(non è un hook del plugin)_                                                                                                                |
| 3   | `normalizeModelId`                | Normalizza alias legacy o di anteprima degli id modello prima della ricerca                                    | Il provider possiede la pulizia degli alias prima della risoluzione del modello canonico                                                    |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia del provider prima dell'assemblaggio generico del modello         | Il provider possiede la pulizia del trasporto per id provider personalizzati nella stessa famiglia di trasporto                            |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione di runtime/provider                                 | Il provider ha bisogno di pulizia della configurazione che dovrebbe vivere con il plugin; gli helper inclusi della famiglia Google fanno anche da backstop per le voci di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità dell'uso dello streaming nativo ai provider di configurazione            | Il provider ha bisogno di correzioni dei metadati di uso dello streaming nativo guidate dall'endpoint                                      |
| 7   | `resolveConfigApiKey`             | Risolve l'autenticazione con marker env per i provider di configurazione prima del caricamento dell'autenticazione di runtime | Il provider possiede la risoluzione della chiave API con marker env; anche `amazon-bedrock` ha qui un resolver integrato per marker env AWS |
| 8   | `resolveSyntheticAuth`            | Espone autenticazione locale/self-hosted o supportata da configurazione senza persistere testo in chiaro      | Il provider può operare con un marker di credenziale sintetica/locale                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili di autenticazione esterni posseduti dal provider; `persistence` predefinito è `runtime-only` per credenziali possedute da CLI/app | Il provider riutilizza credenziali di autenticazione esterne senza persistere token di refresh copiati                                     |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la priorità dei placeholder sintetici dei profili memorizzati rispetto all'autenticazione supportata da env/config | Il provider memorizza profili placeholder sintetici che non dovrebbero avere la precedenza                                                 |
| 11  | `resolveDynamicModel`             | Fallback sincrono per id modello posseduti dal provider non ancora presenti nel registro locale               | Il provider accetta id modello upstream arbitrari                                                                                           |
| 12  | `prepareDynamicModel`             | Warm-up asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                           | Il provider ha bisogno di metadati di rete prima di risolvere id sconosciuti                                                               |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che l'embedded runner usi il modello risolto                                          | Il provider ha bisogno di riscritture del trasporto ma usa comunque un trasporto core                                                      |
| 14  | `contributeResolvedModelCompat`   | Contribuisce con flag di compatibilità per modelli vendor dietro un altro trasporto compatibile               | Il provider riconosce i propri modelli su trasporti proxy senza assumere il controllo del provider                                         |
| 15  | `capabilities`                    | Metadati di trascrizione/tooling posseduti dal provider usati dalla logica core condivisa                     | Il provider ha bisogno di particolarità della trascrizione/famiglia del provider                                                            |
| 16  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che l'embedded runner li veda                                      | Il provider ha bisogno di pulizia degli schemi della famiglia di trasporto                                                                  |
| 17  | `inspectToolSchemas`              | Espone diagnostica degli schemi posseduta dal provider dopo la normalizzazione                                 | Il provider vuole avvisi sulle keyword senza insegnare al core regole specifiche del provider                                               |
| 18  | `resolveReasoningOutputMode`      | Seleziona il contratto di output del ragionamento nativo o con tag                                             | Il provider ha bisogno di output finale/ragionamento con tag invece dei campi nativi                                                       |
| 19  | `prepareExtraParams`              | Normalizzazione dei parametri della richiesta prima dei wrapper generici delle opzioni di stream              | Il provider ha bisogno di parametri di richiesta predefiniti o di pulizia dei parametri per provider                                       |
| 20  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un trasporto personalizzato                        | Il provider ha bisogno di un protocollo wire personalizzato, non solo di un wrapper                                                        |
| 21  | `wrapStreamFn`                    | Wrapper dello stream dopo che i wrapper generici sono stati applicati                                          | Il provider ha bisogno di wrapper di compatibilità per header/body/modello della richiesta senza un trasporto personalizzato               |
| 22  | `resolveTransportTurnState`       | Allega header o metadati nativi per turno al trasporto                                                         | Il provider vuole che i trasporti generici inviino l'identità del turno nativa del provider                                                |
| 23  | `resolveWebSocketSessionPolicy`   | Allega header WebSocket nativi o policy di cool-down della sessione                                            | Il provider vuole che i trasporti WS generici regolino gli header di sessione o la policy di fallback                                      |
| 24  | `formatApiKey`                    | Formatter del profilo di autenticazione: il profilo memorizzato diventa la stringa `apiKey` del runtime       | Il provider memorizza metadati di autenticazione aggiuntivi e ha bisogno di una forma personalizzata del token di runtime                 |
| 25  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o policy di errore nel refresh               | Il provider non rientra nei refresher condivisi `pi-ai`                                                                                     |
| 26  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando il refresh OAuth fallisce                                          | Il provider ha bisogno di una guida di riparazione dell'autenticazione posseduta dal provider dopo un errore di refresh                   |
| 27  | `matchesContextOverflowError`     | Matcher posseduto dal provider per overflow della finestra di contesto                                         | Il provider ha errori raw di overflow che le euristiche generiche non rileverebbero                                                        |
| 28  | `classifyFailoverReason`          | Classificazione della ragione di failover posseduta dal provider                                               | Il provider può mappare errori raw di API/trasporto a rate-limit/sovraccarico/ecc.                                                         |
| 29  | `isCacheTtlEligible`              | Policy della cache del prompt per provider proxy/backhaul                                                      | Il provider ha bisogno di gating TTL della cache specifico per proxy                                                                        |
| 30  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero per autenticazione mancante                                    | Il provider ha bisogno di un suggerimento di recupero per autenticazione mancante specifico del provider                                   |
| 31  | `suppressBuiltInModel`            | Soppressione di modelli upstream obsoleti più suggerimento opzionale di errore rivolto all'utente             | Il provider ha bisogno di nascondere righe upstream obsolete o sostituirle con un suggerimento del vendor                                  |
| 32  | `augmentModelCatalog`             | Righe di catalogo sintetiche/finali aggiunte dopo il rilevamento                                               | Il provider ha bisogno di righe sintetiche di forward-compat in `models list` e nei selettori                                              |
| 33  | `isBinaryThinking`                | Toggle di ragionamento acceso/spento per provider con thinking binario                                         | Il provider espone solo thinking binario acceso/spento                                                                                      |
| 34  | `supportsXHighThinking`           | Supporto al ragionamento `xhigh` per modelli selezionati                                                       | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                                |
| 35  | `resolveDefaultThinkingLevel`     | Livello `/think` predefinito per una specifica famiglia di modelli                                             | Il provider possiede la policy predefinita di `/think` per una famiglia di modelli                                                         |
| 36  | `isModernModelRef`                | Matcher di modelli moderni per filtri di profilo live e selezione smoke                                        | Il provider possiede il matching del modello preferito per live/smoke                                                                       |
| 37  | `prepareRuntimeAuth`              | Scambia una credenziale configurata con il token/chiave effettivo di runtime subito prima dell'inferenza      | Il provider ha bisogno di uno scambio di token o di una credenziale di richiesta a vita breve                                              |
| 38  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e le relative superfici di stato                 | Il provider ha bisogno di parsing personalizzato del token di utilizzo/quota o di una credenziale di utilizzo diversa                      |
| 39  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot di utilizzo/quota specifici del provider dopo che l'autenticazione è stata risolta | Il provider ha bisogno di un endpoint di utilizzo specifico del provider o di un parser del payload                                        |
| 40  | `createEmbeddingProvider`         | Costruisce un adapter di embedding posseduto dal provider per memoria/ricerca                                  | Il comportamento degli embedding per la memoria appartiene al plugin del provider                                                           |
| 41  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione della trascrizione per il provider                 | Il provider ha bisogno di una policy di trascrizione personalizzata (per esempio, rimozione dei blocchi di thinking)                       |
| 42  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica della trascrizione                                  | Il provider ha bisogno di riscritture del replay specifiche del provider oltre agli helper condivisi di Compaction                        |
| 43  | `validateReplayTurns`             | Validazione finale o rimodellazione dei turni di replay prima dell'embedded runner                            | Il trasporto del provider ha bisogno di una validazione dei turni più rigorosa dopo la sanitizzazione generica                             |
| 44  | `onModelSelected`                 | Esegue effetti collaterali post-selezione posseduti dal provider                                              | Il provider ha bisogno di telemetria o stato posseduti dal provider quando un modello diventa attivo                                       |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
plugin provider corrispondente, poi passano agli altri plugin provider con capacità di hook
finché uno non modifica effettivamente l'id modello o il trasporto/configurazione. Questo mantiene
funzionanti gli shim di alias/compatibilità dei provider senza richiedere al chiamante di sapere quale
plugin incluso possiede la riscrittura. Se nessun hook provider riscrive una voce di configurazione supportata
della famiglia Google, il normalizzatore di configurazione Google incluso applica comunque quella pulizia di compatibilità.

Se il provider ha bisogno di un protocollo wire completamente personalizzato o di un esecutore di richieste personalizzato,
si tratta di una classe diversa di estensione. Questi hook servono per il comportamento del provider
che continua a funzionare sul normale loop di inferenza di OpenClaw.

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

- Anthropic usa `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`,
  e `wrapStreamFn` perché possiede la forward-compat di Claude 4.6,
  i suggerimenti della famiglia di provider, la guida alla riparazione dell'autenticazione, l'integrazione
  dell'endpoint di utilizzo, l'idoneità della cache del prompt, i valori predefiniti di configurazione basati sull'autenticazione, la policy predefinita/adattiva di thinking di Claude
  e la modellazione specifica di Anthropic dello stream per
  header beta, `/fast` / `serviceTier` e `context1m`.
- Gli helper di stream specifici di Claude di Anthropic restano per ora nella seam pubblica
  `api.ts` / `contract-api.ts` del plugin incluso stesso. Quella superficie del pacchetto
  esporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i builder wrapper
  Anthropic di livello più basso invece di ampliare l'SDK generico attorno alle regole degli header beta di
  un singolo provider.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities` più `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  perché possiede la forward-compat di GPT-5.4, la normalizzazione diretta OpenAI
  `openai-completions` -> `openai-responses`, i suggerimenti di autenticazione consapevoli di Codex,
  la soppressione di Spark, le righe sintetiche della lista OpenAI e la policy di thinking /
  modello live di GPT-5; la famiglia di stream `openai-responses-defaults` possiede i
  wrapper nativi condivisi di OpenAI Responses per header di attribuzione,
  `/fast`/`serviceTier`, verbosità del testo, ricerca web nativa di Codex,
  modellazione del payload reasoning-compat e gestione del contesto di Responses.
- OpenRouter usa `catalog` più `resolveDynamicModel` e
  `prepareDynamicModel` perché il provider è pass-through e può esporre nuovi
  id modello prima degli aggiornamenti del catalogo statico di OpenClaw; usa anche
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` per mantenere
  fuori dal core header di richiesta specifici del provider, metadati di instradamento, patch di reasoning e
  policy di cache del prompt. La sua policy di replay proviene dalla famiglia
  `passthrough-gemini`, mentre la famiglia di stream `openrouter-thinking`
  possiede l'iniezione del reasoning del proxy e i salti dei modelli non supportati / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities` più `prepareRuntimeAuth` e `fetchUsageSnapshot` perché
  ha bisogno di login del dispositivo posseduto dal provider, comportamento di fallback del modello, particolarità della trascrizione di Claude,
  uno scambio di token GitHub -> token Copilot e un endpoint di utilizzo posseduto dal provider.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog` più
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot` perché
  continua a funzionare sui trasporti core OpenAI ma possiede la normalizzazione del suo trasporto/base URL,
  la policy di fallback del refresh OAuth, la scelta predefinita del trasporto,
  le righe sintetiche del catalogo Codex e l'integrazione dell'endpoint di utilizzo di ChatGPT; condivide
  la stessa famiglia di stream `openai-responses-defaults` di OpenAI diretto.
- Google AI Studio e Gemini CLI OAuth usano `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` perché la
  famiglia di replay `google-gemini` possiede il fallback forward-compat di Gemini 3.1,
  la validazione nativa del replay di Gemini, la sanitizzazione del replay di bootstrap, la modalità di
  output del reasoning con tag e il matching dei modelli moderni, mentre la
  famiglia di stream `google-thinking` possiede la normalizzazione del payload thinking di Gemini;
  Gemini CLI OAuth usa anche `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` per formattazione del token, parsing del token e collegamento
  dell'endpoint di quota.
- Anthropic Vertex usa `buildReplayPolicy` tramite la
  famiglia di replay `anthropic-by-model` così la pulizia del replay specifica di Claude resta
  limitata agli id Claude invece che a ogni trasporto `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveDefaultThinkingLevel` perché possiede
  la classificazione specifica di Bedrock degli errori di throttle/non pronto/overflow del contesto
  per il traffico Anthropic-on-Bedrock; la sua policy di replay condivide comunque la stessa
  protezione `anthropic-by-model` solo Claude.
- OpenRouter, Kilocode, Opencode e Opencode Go usano `buildReplayPolicy`
  tramite la famiglia di replay `passthrough-gemini` perché fanno da proxy ai modelli Gemini
  tramite trasporti compatibili con OpenAI e hanno bisogno della
  sanitizzazione thought-signature di Gemini senza validazione nativa del replay di Gemini né
  riscritture di bootstrap.
- MiniMax usa `buildReplayPolicy` tramite la
  famiglia di replay `hybrid-anthropic-openai` perché un provider possiede sia
  semantica di messaggi Anthropic sia semantica compatibile OpenAI; mantiene l'eliminazione
  dei blocchi di thinking solo Claude sul lato Anthropic mentre sovrascrive la modalità di
  output del reasoning tornando a quella nativa, e la famiglia di stream `minimax-fast-mode` possiede
  le riscritture dei modelli fast-mode sul percorso di stream condiviso.
- Moonshot usa `catalog` più `wrapStreamFn` perché continua a usare il trasporto
  OpenAI condiviso ma ha bisogno di una normalizzazione del payload thinking posseduta dal provider; la
  famiglia di stream `moonshot-thinking` mappa config più stato `/think` sul suo
  payload nativo di thinking binario.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` perché ha bisogno di header di richiesta posseduti dal provider,
  normalizzazione del payload di reasoning, suggerimenti di trascrizione Gemini e
  gating del cache-TTL di Anthropic; la famiglia di stream `kilocode-thinking` mantiene l'iniezione del thinking Kilo
  sul percorso di stream proxy condiviso saltando però `kilo/auto` e
  altri id di modello proxy che non supportano payload di reasoning espliciti.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot` perché possiede il fallback GLM-5,
  i valori predefiniti di `tool_stream`, UX di thinking binario, matching dei modelli moderni e sia
  l'autenticazione d'uso sia il recupero della quota; la famiglia di stream `tool-stream-default-on` mantiene
  il wrapper `tool_stream` predefinito attivo fuori dal codice manuale per-provider.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  perché possiede la normalizzazione del trasporto nativo xAI Responses, le riscritture
  degli alias fast-mode di Grok, il `tool_stream` predefinito, la pulizia di strict-tool / payload di reasoning,
  il riuso dell'autenticazione di fallback per strumenti posseduti dal plugin, la risoluzione forward-compat dei modelli Grok
  e patch di compatibilità possedute dal provider come il profilo degli schemi degli strumenti xAI,
  keyword di schema non supportate, `web_search` nativo e decodifica degli argomenti
  delle chiamate agli strumenti con entità HTML.
- Mistral, OpenCode Zen e OpenCode Go usano solo `capabilities` per tenere
  fuori dal core le particolarità di trascrizione/tooling.
- I provider inclusi solo catalogo come `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine` usano
  solo `catalog`.
- Qwen usa `catalog` per il proprio provider testuale più registrazioni condivise di comprensione dei media e
  generazione video per le proprie superfici multimodali.
- MiniMax e Xiaomi usano `catalog` più hook di utilizzo perché il loro comportamento `/usage`
  è posseduto dal plugin anche se l'inferenza continua a passare attraverso i trasporti condivisi.

## Helper di runtime

I plugin possono accedere a helper core selezionati tramite `api.runtime`. Per il TTS:

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

- `textToSpeech` restituisce il normale payload di output TTS del core per superfici file/nota vocale.
- Usa la configurazione core `messages.tts` e la selezione del provider.
- Restituisce buffer audio PCM + frequenza di campionamento. I plugin devono ricampionare/codificare per i provider.
- `listVoices` è facoltativo per provider. Usalo per selettori vocali posseduti dal vendor o flussi di setup.
- Gli elenchi di voci possono includere metadati più ricchi, come impostazioni locali, genere e tag di personalità per selettori consapevoli del provider.
- OpenAI ed ElevenLabs supportano oggi la telefonia. Microsoft no.

I plugin possono anche registrare provider vocali tramite `api.registerSpeechProvider(...)`.

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

- Mantieni nel core la policy TTS, il fallback e la consegna della risposta.
- Usa i provider vocali per il comportamento di sintesi posseduto dal vendor.
- L'input legacy Microsoft `edge` viene normalizzato all'id provider `microsoft`.
- Il modello di proprietà preferito è orientato all'azienda: un plugin vendor può possedere
  provider testuali, vocali, di immagini e futuri provider multimediali man mano che OpenClaw aggiunge questi
  contratti di capacità.

Per la comprensione di immagini/audio/video, i plugin registrano un provider tipizzato di
comprensione dei media invece di un generico contenitore chiave/valore:

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

- Mantieni orchestrazione, fallback, configurazione e collegamento dei canali nel core.
- Mantieni il comportamento del vendor nel plugin provider.
- L'espansione additiva deve restare tipizzata: nuovi metodi facoltativi, nuovi campi
  risultato facoltativi, nuove capacità facoltative.
- La generazione video segue già lo stesso pattern:
  - il core possiede il contratto della capacità e l'helper di runtime
  - i plugin dei vendor registrano `api.registerVideoGenerationProvider(...)`
  - i plugin di funzionalità/canale consumano `api.runtime.videoGeneration.*`

Per gli helper di runtime di comprensione dei media, i plugin possono chiamare:

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

Per la trascrizione audio, i plugin possono usare sia il runtime di comprensione dei media
sia il vecchio alias STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

Note:

- `api.runtime.mediaUnderstanding.*` è la superficie condivisa preferita per
  la comprensione di immagini/audio/video.
- Usa la configurazione audio core di comprensione dei media (`tools.media.audio`) e l'ordine di fallback del provider.
- Restituisce `{ text: undefined }` quando non viene prodotto alcun output di trascrizione (per esempio input saltato/non supportato).
- `api.runtime.stt.transcribeAudioFile(...)` resta come alias di compatibilità.

I plugin possono anche avviare esecuzioni di subagent in background tramite `api.runtime.subagent`:

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
- OpenClaw rispetta questi campi di override solo per i chiamanti attendibili.
- Per le esecuzioni di fallback possedute dal plugin, gli operatori devono acconsentire con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i plugin attendibili a target canonici specifici `provider/model`, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni di subagent di plugin non attendibili continuano a funzionare, ma le richieste di override vengono rifiutate invece di ripiegare silenziosamente su un fallback.

Per la ricerca web, i plugin possono consumare l'helper di runtime condiviso invece di
accedere al collegamento dello strumento dell'agente:

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

I plugin possono anche registrare provider di ricerca web tramite
`api.registerWebSearchProvider(...)`.

Note:

- Mantieni nel core la selezione del provider, la risoluzione delle credenziali e la semantica condivisa delle richieste.
- Usa i provider di ricerca web per trasporti di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per i plugin di funzionalità/canale che hanno bisogno di comportamento di ricerca senza dipendere dal wrapper dello strumento dell'agente.

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

- `generate(...)`: genera un'immagine usando la catena configurata del provider di generazione immagini.
- `listProviders(...)`: elenca i provider di generazione immagini disponibili e le loro capacità.

## Route HTTP del Gateway

I plugin possono esporre endpoint HTTP con `api.registerHttpRoute(...)`.

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
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale autenticazione del gateway, oppure `"plugin"` per autenticazione/verifica Webhook gestita dal plugin.
- `match`: facoltativo. `"exact"` (predefinito) oppure `"prefix"`.
- `replaceExisting`: facoltativo. Consente allo stesso plugin di sostituire la propria registrazione di route esistente.
- `handler`: restituisce `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei plugin devono dichiarare `auth` in modo esplicito.
- I conflitti esatti di `path + match` vengono rifiutati salvo `replaceExisting: true`, e un plugin non può sostituire la route di un altro plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di fallthrough `exact`/`prefix` solo allo stesso livello di autenticazione.
- Le route `auth: "plugin"` **non** ricevono automaticamente gli scope di runtime dell'operatore. Sono per webhook/verifica firma gestiti dal plugin, non per chiamate helper privilegiate del Gateway.
- Le route `auth: "gateway"` vengono eseguite all'interno di uno scope di runtime di richiesta del Gateway, ma tale scope è intenzionalmente conservativo:
  - l'autenticazione bearer con secret condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli scope di runtime della route del plugin fissati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP attendibili con identità esplicita (per esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente su quelle richieste di route del plugin con identità esplicita, lo scope di runtime torna a `operator.write`
- Regola pratica: non dare per scontato che una route di plugin con autenticazione gateway sia implicitamente una superficie amministrativa. Se la tua route ha bisogno di comportamento riservato agli admin, richiedi una modalità di autenticazione con identità esplicita e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di import dell'SDK del plugin

Usa i sottopercorsi dell'SDK invece dell'import monolitico `openclaw/plugin-sdk` durante
la creazione dei plugin:

- `openclaw/plugin-sdk/plugin-entry` per primitive di registrazione dei plugin.
- `openclaw/plugin-sdk/core` per il contratto generico condiviso rivolto ai plugin.
- `openclaw/plugin-sdk/config-schema` per l'esportazione dello schema Zod root di `openclaw.json`
  (`OpenClawSchema`).
- Primitive stabili di canale come `openclaw/plugin-sdk/channel-setup`,
  `openclaw/plugin-sdk/setup-runtime`,
  `openclaw/plugin-sdk/setup-adapter-runtime`,
  `openclaw/plugin-sdk/setup-tools`,
  `openclaw/plugin-sdk/channel-pairing`,
  `openclaw/plugin-sdk/channel-contract`,
  `openclaw/plugin-sdk/channel-feedback`,
  `openclaw/plugin-sdk/channel-inbound`,
  `openclaw/plugin-sdk/channel-lifecycle`,
  `openclaw/plugin-sdk/channel-reply-pipeline`,
  `openclaw/plugin-sdk/command-auth`,
  `openclaw/plugin-sdk/secret-input` e
  `openclaw/plugin-sdk/webhook-ingress` per il collegamento condiviso di setup/autenticazione/risposta/webhook.
  `channel-inbound` è la sede condivisa per debounce, matching delle mention,
  helper di policy delle mention in ingresso, formattazione degli envelope e helper di contesto
  degli envelope in ingresso.
  `channel-setup` è la seam ristretta di setup con installazione facoltativa.
  `setup-runtime` è la superficie di setup sicura per il runtime usata da `setupEntry` /
  avvio differito, inclusi gli adapter di patch di setup sicuri per l'import.
  `setup-adapter-runtime` è la seam dell'adapter di setup dell'account consapevole dell'env.
  `setup-tools` è la piccola seam di helper CLI/archivio/documentazione (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Sottopercorsi di dominio come `openclaw/plugin-sdk/channel-config-helpers`,
  `openclaw/plugin-sdk/allow-from`,
  `openclaw/plugin-sdk/channel-config-schema`,
  `openclaw/plugin-sdk/telegram-command-config`,
  `openclaw/plugin-sdk/channel-policy`,
  `openclaw/plugin-sdk/approval-gateway-runtime`,
  `openclaw/plugin-sdk/approval-handler-adapter-runtime`,
  `openclaw/plugin-sdk/approval-handler-runtime`,
  `openclaw/plugin-sdk/approval-runtime`,
  `openclaw/plugin-sdk/config-runtime`,
  `openclaw/plugin-sdk/infra-runtime`,
  `openclaw/plugin-sdk/agent-runtime`,
  `openclaw/plugin-sdk/lazy-runtime`,
  `openclaw/plugin-sdk/reply-history`,
  `openclaw/plugin-sdk/routing`,
  `openclaw/plugin-sdk/status-helpers`,
  `openclaw/plugin-sdk/text-runtime`,
  `openclaw/plugin-sdk/runtime-store` e
  `openclaw/plugin-sdk/directory-runtime` per helper condivisi di runtime/configurazione.
  `telegram-command-config` è la seam pubblica ristretta per normalizzazione/convalida dei comandi personalizzati di Telegram e resta disponibile anche se la
  superficie contrattuale del bundle Telegram è temporaneamente indisponibile.
  `text-runtime` è la seam condivisa di testo/markdown/logging, inclusi
  rimozione del testo visibile all'assistente, helper di render/chunking markdown, helper
  di redazione, helper per i tag di direttiva e utility di testo sicuro.
- Le seam di canale specifiche per l'approvazione dovrebbero preferire un unico contratto `approvalCapability`
  sul plugin. Il core legge quindi autenticazione, consegna, rendering,
  instradamento nativo e comportamento del gestore nativo lazy per l'approvazione tramite quella sola capacità
  invece di mescolare il comportamento di approvazione in campi non correlati del plugin.
- `openclaw/plugin-sdk/channel-runtime` è deprecato e resta solo come shim di
  compatibilità per i plugin più vecchi. Il nuovo codice dovrebbe importare invece le primitive
  generiche più ristrette, e il codice del repo non dovrebbe aggiungere nuovi import dello
  shim.
- Gli interni delle estensioni incluse restano privati. I plugin esterni dovrebbero usare solo
  i sottopercorsi `openclaw/plugin-sdk/*`. Il codice core/test di OpenClaw può usare i
  punti di ingresso pubblici del repo sotto la root del pacchetto di un plugin, come `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e file a ambito ristretto come
  `login-qr-api.js`. Non importare mai `src/*` di un pacchetto plugin dal core o da
  un'altra estensione.
- Suddivisione dei punti di ingresso del repo:
  `<plugin-package-root>/api.js` è il barrel di helper/tipi,
  `<plugin-package-root>/runtime-api.js` è il barrel solo runtime,
  `<plugin-package-root>/index.js` è il punto di ingresso del plugin incluso,
  e `<plugin-package-root>/setup-entry.js` è il punto di ingresso del plugin di setup.
- Esempi attuali di provider inclusi:
  - Anthropic usa `api.js` / `contract-api.js` per helper di stream Claude come
    `wrapAnthropicProviderStream`, helper per header beta e parsing di `service_tier`.
  - OpenAI usa `api.js` per builder di provider, helper del modello predefinito e
    builder di provider realtime.
  - OpenRouter usa `api.js` per il proprio builder di provider più helper di onboarding/configurazione,
    mentre `register.runtime.js` può ancora riesportare helper generici
    `plugin-sdk/provider-stream` per uso locale al repo.
- I punti di ingresso pubblici caricati tramite facade preferiscono lo snapshot attivo della configurazione di runtime
  quando esiste, e in caso contrario ripiegano sul file di configurazione risolto su disco quando
  OpenClaw non sta ancora servendo uno snapshot di runtime.
- Le primitive generiche condivise restano il contratto pubblico preferito dell'SDK. Esiste ancora un piccolo
  insieme riservato di seam helper con marchio di canale incluso per compatibilità.
  Trattale come seam di manutenzione/compatibilità dei bundle, non come nuovi target di import di terze parti; i nuovi contratti cross-channel dovrebbero comunque approdare su
  sottopercorsi generici `plugin-sdk/*` o sui barrel locali al plugin `api.js` /
  `runtime-api.js`.

Nota sulla compatibilità:

- Evita il barrel root `openclaw/plugin-sdk` nel nuovo codice.
- Preferisci prima le primitive stabili e ristrette. I più recenti sottopercorsi di setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool sono il contratto previsto per il nuovo
  lavoro su plugin inclusi ed esterni.
  Il parsing/matching dei target appartiene a `openclaw/plugin-sdk/channel-targets`.
  I gate delle azioni di messaggio e gli helper degli id messaggio per le reazioni appartengono a
  `openclaw/plugin-sdk/channel-actions`.
- I barrel helper specifici delle estensioni incluse non sono stabili per impostazione predefinita. Se un
  helper è necessario solo a un'estensione inclusa, tienilo dietro la seam locale
  `api.js` o `runtime-api.js` dell'estensione invece di promuoverlo in
  `openclaw/plugin-sdk/<extension>`.
- Le nuove seam helper condivise dovrebbero essere generiche, non con marchio di canale. Il parsing condiviso dei
  target appartiene a `openclaw/plugin-sdk/channel-targets`; gli interni specifici del canale
  restano dietro la seam locale `api.js` o `runtime-api.js` del plugin proprietario.
- Sottopercorsi specifici della capacità come `image-generation`,
  `media-understanding` e `speech` esistono perché i plugin nativi/inclusi li usano
  oggi. La loro presenza non significa di per sé che ogni helper esportato sia un contratto esterno congelato a lungo termine.

## Schemi dello strumento di messaggio

I plugin dovrebbero possedere i contributi allo schema di `describeMessageTool(...)` specifici del canale.
Mantieni i campi specifici del provider nel plugin, non nel core condiviso.

Per frammenti di schema condivisi e portabili, riusa gli helper generici esportati tramite
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` per payload in stile griglia di pulsanti
- `createMessageToolCardSchema()` per payload di card strutturate

Se una forma di schema ha senso solo per un provider, definiscila nel sorgente
del plugin stesso invece di promuoverla nell'SDK condiviso.

## Risoluzione dei target del canale

I plugin di canale dovrebbero possedere la semantica dei target specifica del canale. Mantieni generico l'host
di outbound condiviso e usa la superficie dell'adapter di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  debba essere trattato come `direct`, `group` o `channel` prima della ricerca nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input deve saltare direttamente alla risoluzione tipo id invece che alla ricerca nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del plugin quando
  il core ha bisogno di una risoluzione finale posseduta dal provider dopo la normalizzazione o dopo un
  mancato riscontro nella directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione
  specifica del provider una volta che un target è risolto.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima
  della ricerca di peer/gruppi.
- Usa `looksLikeId` per controlli del tipo "tratta questo come un id target esplicito/nativo".
- Usa `resolveTarget` per fallback di normalizzazione specifici del provider, non per
  ricerca generica nella directory.
- Mantieni gli id nativi del provider come chat id, thread id, JID, handle e room id
  dentro i valori `target` o nei parametri specifici del provider, non nei campi generici dell'SDK.

## Directory supportate da configurazione

I plugin che derivano voci di directory dalla configurazione dovrebbero mantenere quella logica nel
plugin e riutilizzare gli helper condivisi di
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale ha bisogno di peer/gruppi supportati da configurazione, come:

- peer DM guidati da allowlist
- mappe configurate di canali/gruppi
- fallback statici di directory con ambito account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtro delle query
- applicazione dei limiti
- helper di deduplicazione/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione dell'account e la normalizzazione degli id specifiche del canale dovrebbero restare nell'implementazione
del plugin.

## Cataloghi dei provider

I plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce singola di provider
- `{ providers }` per più voci di provider

Usa `catalog` quando il plugin possiede id modello specifici del provider, valori predefiniti di base URL
o metadati di modello protetti da autenticazione.

`catalog.order` controlla quando il catalogo di un plugin viene unito rispetto ai
provider impliciti integrati di OpenClaw:

- `simple`: provider semplici con chiave API o guidati da env
- `profile`: provider che appaiono quando esistono profili di autenticazione
- `paired`: provider che sintetizzano più voci di provider correlate
- `late`: ultimo passaggio, dopo gli altri provider impliciti

I provider successivi prevalgono in caso di collisione di chiave, quindi i plugin possono
volontariamente sovrascrivere una voce di provider integrato con lo stesso id provider.

Compatibilità:

- `discovery` continua a funzionare come alias legacy
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione in sola lettura del canale

Se il tuo plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso di runtime. Può presumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano i secret richiesti.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi di doctor/riparazione
  della configurazione non dovrebbero dover materializzare credenziali di runtime solo per
  descrivere la configurazione.

Comportamento consigliato per `inspectAccount(...)`:

- Restituisci solo lo stato descrittivo dell'account.
- Mantieni `enabled` e `configured`.
- Includi campi di sorgente/stato delle credenziali quando rilevanti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire i valori raw dei token solo per riportare la
  disponibilità in sola lettura. Restituire `tokenStatus: "available"` (e il relativo campo
  di sorgente) è sufficiente per comandi in stile status.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo permette ai comandi in sola lettura di riportare "configurato ma non disponibile in questo percorso di comando"
invece di andare in crash o riportare erroneamente l'account come non configurato.

## Package pack

Una directory di plugin può includere un `package.json` con `openclaw.extensions`:

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

Ogni voce diventa un plugin. Se il pack elenca più estensioni, l'id del plugin
diventa `name/<fileBase>`.

Se il tuo plugin importa dipendenze npm, installale in quella directory così
`node_modules` sarà disponibile (`npm install` / `pnpm install`).

Protezione di sicurezza: ogni voce `openclaw.extensions` deve restare all'interno della directory del plugin
dopo la risoluzione dei symlink. Le voci che escono dalla directory del pacchetto vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del plugin con
`npm install --omit=dev --ignore-scripts` (nessuno script lifecycle, nessuna dipendenza di sviluppo a runtime). Mantieni gli alberi delle dipendenze dei plugin "pure JS/TS" ed evita pacchetti che richiedono build in `postinstall`.

Facoltativo: `openclaw.setupEntry` può puntare a un modulo leggero dedicato solo al setup.
Quando OpenClaw ha bisogno di superfici di setup per un plugin di canale disabilitato, oppure
quando un plugin di canale è abilitato ma ancora non configurato, carica `setupEntry`
invece del punto di ingresso completo del plugin. Questo rende avvio e setup più leggeri
quando il punto di ingresso principale del plugin collega anche strumenti, hook o altro codice
solo runtime.

Facoltativo: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può attivare per un plugin di canale lo stesso percorso `setupEntry` durante la fase
di avvio pre-listen del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, questo significa che il punto di ingresso di setup
deve registrare ogni capacità posseduta dal canale da cui l'avvio dipende, come:

- la registrazione del canale stesso
- eventuali route HTTP che devono essere disponibili prima che il gateway inizi ad ascoltare
- eventuali metodi Gateway, strumenti o servizi che devono esistere durante quella stessa finestra

Se il punto di ingresso completo possiede ancora una qualsiasi capacità di avvio richiesta, non abilitare
questo flag. Mantieni il comportamento predefinito del plugin e lascia che OpenClaw carichi il
punto di ingresso completo durante l'avvio.

I canali inclusi possono anche pubblicare helper di superficie contrattuale solo setup che il core
può consultare prima che il runtime completo del canale sia caricato. L'attuale superficie
di promozione del setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando deve promuovere una configurazione legacy di canale a account singolo
in `channels.<id>.accounts.*` senza caricare il punto di ingresso completo del plugin.
Matrix è l'esempio incluso attuale: sposta solo le chiavi di autenticazione/bootstrap in un
account promosso con nome quando esistono già account con nome, e può preservare una
chiave di account predefinito non canonica configurata invece di creare sempre
`accounts.default`.

Questi adapter di patch del setup mantengono lazy il rilevamento della superficie contrattuale inclusa. Il tempo
di import resta leggero; la superficie di promozione viene caricata solo al primo utilizzo invece di
rientrare nell'avvio del canale incluso durante l'import del modulo.

Quando queste superfici di avvio includono metodi RPC del Gateway, mantienili su un
prefisso specifico del plugin. I namespace amministrativi del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre
a `operator.admin`, anche se un plugin richiede uno scope più ristretto.

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

I plugin di canale possono pubblicizzare metadati di setup/rilevamento tramite `openclaw.channel` e
suggerimenti di installazione tramite `openclaw.install`. Questo mantiene il catalogo del core privo di dati.

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

- `detailLabel`: etichetta secondaria per superfici di catalogo/stato più ricche
- `docsLabel`: sovrascrive il testo del link per il link alla documentazione
- `preferOver`: id di plugin/canali a priorità inferiore che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo per la superficie di selezione
- `markdownCapable`: contrassegna il canale come compatibile con Markdown per le decisioni di formattazione in uscita
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai selettori interattivi di setup/configurazione quando impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: abilita per il canale il flusso standard quickstart `allowFrom`
- `forceAccountBinding`: richiede binding esplicito dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la ricerca della sessione durante la risoluzione dei target di annuncio

OpenClaw può anche unire **cataloghi di canali esterni** (per esempio, un'esportazione del
registro MPM). Inserisci un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o più file JSON (delimitati da virgola/punto e virgola/`PATH`). Ogni file dovrebbe
contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy per la chiave `"entries"`.

## Plugin del motore di contesto

I plugin del motore di contesto possiedono l'orchestrazione del contesto di sessione per ingestione, assemblaggio
e Compaction. Registrali dal tuo plugin con
`api.registerContextEngine(id, factory)`, quindi seleziona il motore attivo con
`plugins.slots.contextEngine`.

Usa questo quando il tuo plugin deve sostituire o estendere la pipeline di contesto predefinita
invece di aggiungere solo ricerca in memoria o hook.

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

Quando un plugin ha bisogno di un comportamento che non rientra nell'API attuale, non aggirare
il sistema di plugin con un accesso privato. Aggiungi la capacità mancante.

Sequenza consigliata:

1. definire il contratto core
   Decidi quale comportamento condiviso il core dovrebbe possedere: policy, fallback, merge della configurazione,
   ciclo di vita, semantica rivolta ai canali e forma dell'helper di runtime.
2. aggiungere superfici tipizzate di registrazione/runtime del plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la più piccola superficie di capacità tipizzata
   utile.
3. collegare core + consumer di canali/funzionalità
   I canali e i plugin di funzionalità dovrebbero consumare la nuova capacità tramite il core,
   non importando direttamente un'implementazione vendor.
4. registrare implementazioni vendor
   I plugin dei vendor registrano quindi i loro backend rispetto alla capacità.
5. aggiungere copertura di contratto
   Aggiungi test così la forma di proprietà e registrazione resta esplicita nel tempo.

È così che OpenClaw rimane orientato senza diventare hardcodato alla visione del mondo di
un solo provider. Vedi il [Capability Cookbook](/it/plugins/architecture)
per una checklist concreta dei file e un esempio completo.

### Checklist della capacità

Quando aggiungi una nuova capacità, l'implementazione di solito dovrebbe toccare insieme
queste superfici:

- tipi del contratto core in `src/<capability>/types.ts`
- runner/helper di runtime core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API plugin in `src/plugins/types.ts`
- collegamento del registro dei plugin in `src/plugins/registry.ts`
- esposizione del runtime dei plugin in `src/plugins/runtime/*` quando i plugin di funzionalità/canale
  devono consumarla
- helper di acquisizione/test in `src/test-utils/plugin-registration.ts`
- asserzioni di proprietà/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/plugin in `docs/`

Se una di queste superfici manca, di solito è un segno che la capacità
non è ancora completamente integrata.

### Template della capacità

Pattern minimo:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Pattern del test di contratto:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Questo mantiene semplice la regola:

- il core possiede il contratto della capacità + l'orchestrazione
- i plugin dei vendor possiedono le implementazioni dei vendor
- i plugin di funzionalità/canale consumano helper di runtime
- i test di contratto mantengono esplicita la proprietà
