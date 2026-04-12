---
read_when:
    - Creazione o debug di plugin nativi OpenClaw
    - Comprendere il modello di capability del plugin o i confini di ownership
    - Lavorare sulla pipeline di caricamento o sul registry dei plugin
    - Implementare hook di runtime del provider o plugin di canale
sidebarTitle: Internals
summary: 'Interni del Plugin: modello di capability, ownership, contratti, pipeline di caricamento e helper di runtime'
title: Interni del Plugin
x-i18n:
    generated_at: "2026-04-12T23:28:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37361c1e9d2da57c77358396f19dfc7f749708b66ff68f1bf737d051b5d7675d
    source_path: plugins/architecture.md
    workflow: 15
---

# Interni del Plugin

<Info>
  Questo è il **riferimento architetturale approfondito**. Per guide pratiche, vedi:
  - [Install and use plugins](/it/tools/plugin) — guida utente
  - [Getting Started](/it/plugins/building-plugins) — primo tutorial sui plugin
  - [Channel Plugins](/it/plugins/sdk-channel-plugins) — crea un canale di messaggistica
  - [Provider Plugins](/it/plugins/sdk-provider-plugins) — crea un provider di modelli
  - [SDK Overview](/it/plugins/sdk-overview) — mappa degli import e API di registrazione
</Info>

Questa pagina copre l'architettura interna del sistema Plugin di OpenClaw.

## Modello pubblico di capability

Le capability sono il modello pubblico dei **plugin nativi** all'interno di OpenClaw. Ogni
plugin nativo OpenClaw si registra rispetto a uno o più tipi di capability:

| Capability             | Metodo di registrazione                         | Plugin di esempio                    |
| ---------------------- | ----------------------------------------------- | ------------------------------------ |
| Inferenza testuale     | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                 | `openai`, `anthropic`                |
| Voce                   | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Trascrizione in tempo reale | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| Voce in tempo reale    | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Comprensione dei media | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Generazione di immagini | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Generazione musicale   | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Generazione video      | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Recupero web           | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Ricerca web            | `api.registerWebSearchProvider(...)`            | `google`                             |
| Canale / messaggistica | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |

Un plugin che registra zero capability ma fornisce hook, strumenti o
servizi è un plugin **legacy solo hook**. Questo pattern è ancora pienamente supportato.

### Posizione sulla compatibilità esterna

Il modello di capability è integrato nel core e oggi viene usato dai plugin
bundled/nativi, ma la compatibilità dei plugin esterni richiede ancora una soglia più rigorosa rispetto a "è
esportato, quindi è immutabile".

Indicazioni attuali:

- **plugin esterni esistenti:** mantenere funzionanti le integrazioni basate su hook; trattare
  questo come base di compatibilità
- **nuovi plugin bundled/nativi:** preferire la registrazione esplicita delle capability rispetto a
  accessi specifici del vendor o a nuovi design solo hook
- **plugin esterni che adottano la registrazione delle capability:** consentiti, ma trattare le
  superfici helper specifiche per capability come evolutive a meno che la documentazione non contrassegni esplicitamente
  un contratto come stabile

Regola pratica:

- le API di registrazione delle capability sono la direzione prevista
- gli hook legacy restano il percorso più sicuro per evitare rotture nei plugin esterni durante
  la transizione
- i sottopercorsi helper esportati non sono tutti equivalenti; preferire il
  contratto documentato e ristretto, non esportazioni helper incidentali

### Forme dei plugin

OpenClaw classifica ogni plugin caricato in una forma in base al suo effettivo
comportamento di registrazione (non solo ai metadati statici):

- **plain-capability** -- registra esattamente un tipo di capability (per esempio un
  plugin solo provider come `mistral`)
- **hybrid-capability** -- registra più tipi di capability (per esempio
  `openai` possiede inferenza testuale, voce, comprensione dei media e
  generazione di immagini)
- **hook-only** -- registra solo hook (tipizzati o personalizzati), nessuna capability,
  strumento, comando o servizio
- **non-capability** -- registra strumenti, comandi, servizi o route ma nessuna
  capability

Usa `openclaw plugins inspect <id>` per vedere la forma di un plugin e il dettaglio
delle capability. Vedi [CLI reference](/cli/plugins#inspect) per i dettagli.

### Hook legacy

L'hook `before_agent_start` resta supportato come percorso di compatibilità per
plugin solo hook. Plugin legacy reali dipendono ancora da esso.

Direzione:

- mantenerlo funzionante
- documentarlo come legacy
- preferire `before_model_resolve` per il lavoro di override di modello/provider
- preferire `before_prompt_build` per il lavoro di mutazione del prompt
- rimuoverlo solo dopo che l'uso reale sarà diminuito e la copertura dei fixture dimostrerà la sicurezza della migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` o `openclaw plugins inspect <id>`, potresti vedere
una di queste etichette:

| Segnale                   | Significato                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | La configurazione viene analizzata correttamente e i plugin vengono risolti |
| **compatibility advisory** | Il plugin usa un pattern supportato ma più vecchio (ad es. `hook-only`) |
| **legacy warning**        | Il plugin usa `before_agent_start`, che è deprecato          |
| **hard error**            | La configurazione non è valida o il plugin non è riuscito a caricarsi |

Né `hook-only` né `before_agent_start` romperanno oggi il tuo plugin --
`hook-only` è solo informativo, e `before_agent_start` genera soltanto un avviso. Questi
segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema Plugin di OpenClaw ha quattro livelli:

1. **Manifest + discovery**
   OpenClaw trova i plugin candidati dai percorsi configurati, dalle root del workspace,
   dalle root globali delle estensioni e dalle estensioni bundled. La discovery legge prima i
   manifest nativi `openclaw.plugin.json` e i manifest dei bundle supportati.
2. **Abilitazione + validazione**
   Il core decide se un plugin individuato è abilitato, disabilitato, bloccato o
   selezionato per uno slot esclusivo come la memoria.
3. **Caricamento runtime**
   I plugin nativi OpenClaw vengono caricati in-process tramite jiti e registrano
   capability in un registry centrale. I bundle compatibili vengono normalizzati in
   record del registry senza importare codice runtime.
4. **Consumo della superficie**
   Il resto di OpenClaw legge il registry per esporre strumenti, canali, configurazione dei provider,
   hook, route HTTP, comandi CLI e servizi.

Per la CLI dei plugin in particolare, la discovery dei comandi root è divisa in due fasi:

- i metadati in fase di parsing provengono da `registerCli(..., { descriptors: [...] })`
- il vero modulo CLI del plugin può restare lazy e registrarsi alla prima invocazione

Questo mantiene il codice CLI posseduto dal plugin all'interno del plugin, consentendo comunque a OpenClaw
di riservare i nomi dei comandi root prima del parsing.

Il confine di progettazione importante:

- discovery + validazione della configurazione dovrebbero funzionare dai **metadati di manifest/schema**
  senza eseguire codice del plugin
- il comportamento runtime nativo deriva dal percorso `register(api)` del modulo del plugin

Questa separazione permette a OpenClaw di validare la configurazione, spiegare plugin mancanti/disabilitati e
costruire suggerimenti per UI/schema prima che il runtime completo sia attivo.

### Plugin di canale e strumento di messaggio condiviso

I plugin di canale non devono registrare uno strumento separato di invio/modifica/reazione per
le normali azioni di chat. OpenClaw mantiene un unico strumento `message` condiviso nel core, e
i plugin di canale possiedono la discovery e l'esecuzione specifiche del canale che stanno dietro a esso.

Il confine attuale è:

- il core possiede l'host dello strumento `message` condiviso, il wiring del prompt, la
  gestione di sessione/thread e il dispatch dell'esecuzione
- i plugin di canale possiedono la discovery delle azioni con ambito definito, la discovery delle capability e qualsiasi
  frammento di schema specifico del canale
- i plugin di canale possiedono la grammatica della conversazione di sessione specifica del provider, ad esempio
  come gli id conversazione codificano gli id thread o ereditano dalle conversazioni padre
- i plugin di canale eseguono l'azione finale tramite il loro adapter di azione

Per i plugin di canale, la superficie SDK è
`ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata di discovery unificata
permette a un plugin di restituire insieme le sue azioni visibili, capability e contributi allo schema
così che questi elementi non divergano.

Il core passa lo scope runtime a questa fase di discovery. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` affidabile in ingresso

Questo è importante per i plugin sensibili al contesto. Un canale può nascondere o esporre
azioni di messaggio in base all'account attivo, alla stanza/thread/messaggio corrente o
all'identità affidabile del richiedente senza codificare branch specifici del canale
nello strumento `message` del core.

Ecco perché le modifiche al routing dell'embedded-runner restano lavoro del plugin: il runner è
responsabile di inoltrare l'identità corrente della chat/sessione al confine di discovery del plugin in modo che lo
strumento `message` condiviso esponga la giusta superficie posseduta dal canale per il turno corrente.

Per gli helper di esecuzione posseduti dal canale, i plugin bundled devono mantenere il runtime di esecuzione
all'interno dei propri moduli di estensione. Il core non possiede più i runtime delle azioni di messaggio di Discord,
Slack, Telegram o WhatsApp sotto `src/agents/tools`.
Non pubblichiamo sottopercorsi separati `plugin-sdk/*-action-runtime`, e i plugin bundled
devono importare direttamente il proprio codice runtime locale dai propri
moduli posseduti dall'estensione.

Lo stesso confine si applica in generale ai seam SDK con nome del provider: il core non dovrebbe
importare barrel di convenienza specifici del canale per estensioni Slack, Discord, Signal,
WhatsApp o simili. Se il core ha bisogno di un comportamento, deve o consumare il proprio barrel
`api.ts` / `runtime-api.ts` del plugin bundled oppure promuovere l'esigenza
a una capability generica e ristretta nell'SDK condiviso.

Per i sondaggi in particolare, ci sono due percorsi di esecuzione:

- `outbound.sendPoll` è la base condivisa per i canali che si adattano al modello comune
  di sondaggio
- `actions.handleAction("poll")` è il percorso preferito per semantiche di sondaggio specifiche del canale
  o parametri aggiuntivi del sondaggio

Il core ora rinvia il parsing condiviso dei sondaggi fino a dopo che il dispatch del sondaggio del plugin ha rifiutato
l'azione, così i gestori di sondaggi posseduti dal plugin possono accettare campi di sondaggio specifici del canale
senza essere bloccati prima dal parser generico dei sondaggi.

Vedi [Load pipeline](#load-pipeline) per la sequenza completa di avvio.

## Modello di ownership delle capability

OpenClaw tratta un plugin nativo come confine di ownership per una **azienda** o una
**funzionalità**, non come un insieme disordinato di integrazioni non correlate.

Questo significa:

- un plugin aziendale dovrebbe di solito possedere tutte le superfici di OpenClaw di quell'azienda
- un plugin di funzionalità dovrebbe di solito possedere l'intera superficie della funzionalità che introduce
- i canali dovrebbero consumare capability condivise del core invece di reimplementare in modo ad hoc il comportamento del provider

Esempi:

- il plugin bundled `openai` possiede il comportamento del provider di modelli OpenAI e il comportamento OpenAI
  per voce + voce in tempo reale + comprensione dei media + generazione di immagini
- il plugin bundled `elevenlabs` possiede il comportamento vocale ElevenLabs
- il plugin bundled `microsoft` possiede il comportamento vocale Microsoft
- il plugin bundled `google` possiede il comportamento del provider di modelli Google più il comportamento Google
  per comprensione dei media + generazione di immagini + ricerca web
- il plugin bundled `firecrawl` possiede il comportamento di recupero web Firecrawl
- i plugin bundled `minimax`, `mistral`, `moonshot` e `zai` possiedono i propri
  backend di comprensione dei media
- il plugin bundled `qwen` possiede il comportamento del provider testuale Qwen più
  il comportamento di comprensione dei media e generazione video
- il plugin `voice-call` è un plugin di funzionalità: possiede trasporto delle chiamate, strumenti,
  CLI, route e bridging dei media stream di Twilio, ma consuma capability condivise di voce
  più trascrizione in tempo reale e voce in tempo reale invece di importare direttamente i plugin del vendor

Lo stato finale previsto è:

- OpenAI vive in un unico plugin anche se copre modelli testuali, voce, immagini e
  futuro video
- un altro vendor può fare lo stesso per la propria area di superficie
- i canali non si preoccupano di quale plugin vendor possieda il provider; consumano il
  contratto di capability condiviso esposto dal core

Questa è la distinzione chiave:

- **plugin** = confine di ownership
- **capability** = contratto del core che più plugin possono implementare o consumare

Quindi, se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è
"quale provider dovrebbe hardcodare la gestione del video?" La prima domanda è "qual è
il contratto di capability video del core?" Una volta che quel contratto esiste, i plugin vendor
possono registrarsi rispetto a esso e i plugin di canale/funzionalità possono consumarlo.

Se la capability non esiste ancora, di solito la mossa giusta è:

1. definire la capability mancante nel core
2. esporla tramite l'API/runtime del plugin in modo tipizzato
3. collegare canali/funzionalità a quella capability
4. lasciare che i plugin vendor registrino le implementazioni

Questo mantiene esplicita l'ownership evitando al contempo un comportamento del core che dipenda da
un singolo vendor o da un percorso di codice specifico di un plugin una tantum.

### Stratificazione delle capability

Usa questo modello mentale quando decidi dove deve stare il codice:

- **livello di capability del core**: orchestrazione condivisa, policy, fallback, regole di merge
  della configurazione, semantica di delivery e contratti tipizzati
- **livello del plugin vendor**: API specifiche del vendor, auth, cataloghi di modelli, sintesi vocale,
  generazione di immagini, futuri backend video, endpoint di utilizzo
- **livello del plugin di canale/funzionalità**: integrazione Slack/Discord/voice-call/ecc.
  che consuma capability del core e le presenta su una superficie

Per esempio, il TTS segue questa forma:

- il core possiede la policy TTS al momento della risposta, l'ordine di fallback, le preferenze e il delivery sul canale
- `openai`, `elevenlabs` e `microsoft` possiedono le implementazioni di sintesi
- `voice-call` consuma l'helper di runtime TTS per la telefonia

Lo stesso pattern dovrebbe essere preferito per le capability future.

### Esempio di plugin aziendale multi-capability

Un plugin aziendale dovrebbe apparire coeso dall'esterno. Se OpenClaw ha contratti condivisi
per modelli, voce, trascrizione in tempo reale, voce in tempo reale, comprensione dei media,
generazione di immagini, generazione video, recupero web e ricerca web,
un vendor può possedere tutte le sue superfici in un unico posto:

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
      // hook di auth/catalogo modelli/runtime
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // configurazione voce del vendor — implementa direttamente l'interfaccia SpeechProviderPlugin
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
        // logica di credenziali + fetch
      }),
    );
  },
};

export default plugin;
```

Ciò che conta non sono i nomi esatti degli helper. Conta la forma:

- un plugin possiede la superficie del vendor
- il core possiede comunque i contratti di capability
- i canali e i plugin di funzionalità consumano helper `api.runtime.*`, non codice del vendor
- i test di contratto possono verificare che il plugin abbia registrato le capability che
  dichiara di possedere

### Esempio di capability: comprensione video

OpenClaw tratta già la comprensione di immagini/audio/video come una capability condivisa.
Lo stesso modello di ownership si applica anche qui:

1. il core definisce il contratto di media-understanding
2. i plugin vendor registrano `describeImage`, `transcribeAudio` e
   `describeVideo` a seconda dei casi
3. i canali e i plugin di funzionalità consumano il comportamento condiviso del core invece di
   collegarsi direttamente al codice del vendor

Questo evita di incorporare nel core le assunzioni video di un singolo provider. Il plugin possiede
la superficie del vendor; il core possiede il contratto di capability e il comportamento di fallback.

La generazione video usa già questa stessa sequenza: il core possiede il
contratto di capability tipizzato e l'helper di runtime, e i plugin vendor registrano
implementazioni `api.registerVideoGenerationProvider(...)` rispetto a esso.

Hai bisogno di una checklist concreta per il rollout? Vedi
[Capability Cookbook](/it/plugins/architecture).

## Contratti e applicazione

La superficie dell'API Plugin è intenzionalmente tipizzata e centralizzata in
`OpenClawPluginApi`. Questo contratto definisce i punti di registrazione supportati e
gli helper di runtime su cui un plugin può fare affidamento.

Perché questo è importante:

- gli autori di plugin ottengono uno standard interno stabile
- il core può rifiutare ownership duplicate, ad esempio due plugin che registrano lo stesso
  id provider
- l'avvio può mostrare diagnostiche utili per registrazioni malformate
- i test di contratto possono applicare l'ownership dei plugin bundled e prevenire derive silenziose

Ci sono due livelli di applicazione:

1. **applicazione della registrazione runtime**
   Il registry dei plugin valida le registrazioni mentre i plugin vengono caricati. Esempi:
   id provider duplicati, id provider vocali duplicati e registrazioni malformate
   producono diagnostiche del plugin invece di comportamento indefinito.
2. **test di contratto**
   I plugin bundled vengono acquisiti in registry di contratto durante i test così
   OpenClaw può verificare esplicitamente l'ownership. Oggi questo viene usato per i model
   provider, i provider vocali, i provider di ricerca web e l'ownership della registrazione bundled.

L'effetto pratico è che OpenClaw sa, fin dall'inizio, quale plugin possiede quale
superficie. Questo permette al core e ai canali di comporsi senza attriti perché l'ownership è
dichiarata, tipizzata e verificabile anziché implicita.

### Cosa appartiene a un contratto

I buoni contratti dei plugin sono:

- tipizzati
- piccoli
- specifici per capability
- posseduti dal core
- riutilizzabili da più plugin
- consumabili da canali/funzionalità senza conoscenza del vendor

I cattivi contratti dei plugin sono:

- policy specifiche del vendor nascoste nel core
- vie di fuga specifiche di un plugin una tantum che aggirano il registry
- codice del canale che accede direttamente a un'implementazione del vendor
- oggetti runtime ad hoc che non fanno parte di `OpenClawPluginApi` o
  `api.runtime`

In caso di dubbio, alza il livello di astrazione: definisci prima la capability, poi
lascia che i plugin si colleghino a essa.

## Modello di esecuzione

I plugin nativi OpenClaw vengono eseguiti **in-process** con il Gateway. Non sono
sandboxed. Un plugin nativo caricato ha lo stesso confine di fiducia a livello di processo del
codice core.

Implicazioni:

- un plugin nativo può registrare strumenti, handler di rete, hook e servizi
- un bug in un plugin nativo può mandare in crash o destabilizzare il gateway
- un plugin nativo malevolo equivale a esecuzione di codice arbitrario all'interno
  del processo OpenClaw

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw al momento li tratta
come pacchetti di metadati/contenuti. Nelle release attuali, questo significa soprattutto
Skills bundled.

Usa allowlist e percorsi espliciti di installazione/caricamento per plugin non bundled. Tratta
i plugin del workspace come codice per il tempo di sviluppo, non come impostazioni predefinite di produzione.

Per i nomi dei pacchetti bundled del workspace, mantieni l'id del plugin ancorato al nome npm:
`@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando
il pacchetto espone intenzionalmente un ruolo di plugin più ristretto.

Nota importante sulla fiducia:

- `plugins.allow` si fida degli **id dei plugin**, non della provenienza della sorgente.
- Un plugin del workspace con lo stesso id di un plugin bundled oscura intenzionalmente
  la copia bundled quando quel plugin del workspace è abilitato/in allowlist.
- Questo è normale e utile per sviluppo locale, test di patch e hotfix.

## Confine di esportazione

OpenClaw esporta capability, non convenienze di implementazione.

Mantieni pubblica la registrazione delle capability. Riduci le esportazioni helper non contrattuali:

- sottopercorsi helper specifici del plugin bundled
- sottopercorsi di plumbing runtime non destinati a essere API pubbliche
- helper di convenienza specifici del vendor
- helper di setup/onboarding che sono dettagli di implementazione

Alcuni sottopercorsi helper dei plugin bundled restano ancora nella mappa di esportazione SDK generata
per compatibilità e manutenzione dei plugin bundled. Esempi attuali includono
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e diversi seam `plugin-sdk/matrix*`. Trattali come
esportazioni riservate di dettaglio implementativo, non come pattern SDK raccomandato per
nuovi plugin di terze parti.

## Pipeline di caricamento

All'avvio, OpenClaw esegue approssimativamente questo:

1. individua le root candidate dei plugin
2. legge i manifest nativi o dei bundle compatibili e i metadati dei pacchetti
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ogni candidato
6. carica i moduli nativi abilitati tramite jiti
7. chiama gli hook nativi `register(api)` (o `activate(api)` — alias legacy) e raccoglie le registrazioni nel registry dei plugin
8. espone il registry alle superfici di comandi/runtime

<Note>
`activate` è un alias legacy di `register` — il loader risolve quale dei due è presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin bundled usano `register`; per i nuovi plugin preferisci `register`.
</Note>

I controlli di sicurezza avvengono **prima** dell'esecuzione runtime. I candidati vengono bloccati
quando l'entry esce dalla root del plugin, il percorso è scrivibile da tutti o la proprietà del percorso
sembra sospetta per i plugin non bundled.

### Comportamento manifest-first

Il manifest è la fonte di verità del control plane. OpenClaw lo usa per:

- identificare il plugin
- individuare canali/Skills/schema di configurazione dichiarati o capability del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette/segnaposto della Control UI
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e setup senza caricare il runtime del plugin

Per i plugin nativi, il modulo runtime è la parte data-plane. Registra
il comportamento effettivo come hook, strumenti, comandi o flussi del provider.

I blocchi opzionali `activation` e `setup` del manifest restano nel control plane.
Sono descrittori solo metadati per la pianificazione dell'attivazione e la discovery del setup;
non sostituiscono la registrazione runtime, `register(...)` o `setupEntry`.
I primi consumer di attivazione live ora usano suggerimenti del manifest su comandi, canali e provider
per restringere il caricamento dei plugin prima di una materializzazione più ampia del registry:

- il caricamento della CLI si restringe ai plugin che possiedono il comando primario richiesto
- la risoluzione di setup/plugin del canale si restringe ai plugin che possiedono l'id canale richiesto
- la risoluzione esplicita di setup/runtime del provider si restringe ai plugin che possiedono l'id provider richiesto

La discovery del setup ora preferisce id posseduti dai descrittori come `setup.providers` e
`setup.cliBackends` per restringere i plugin candidati prima di ricorrere a
`setup-api` per i plugin che hanno ancora bisogno di hook runtime al momento del setup. Se più di
un plugin individuato rivendica lo stesso id normalizzato di provider di setup o backend CLI, la ricerca del setup
rifiuta il proprietario ambiguo invece di affidarsi all'ordine di discovery.

### Cosa mette in cache il loader

OpenClaw mantiene brevi cache in-process per:

- risultati della discovery
- dati del registry dei manifest
- registry dei plugin caricati

Queste cache riducono l'overhead di avvio impulsivo e dei comandi ripetuti. È sicuro
pensarle come cache prestazionali di breve durata, non come persistenza.

Nota sulle prestazioni:

- Imposta `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` o
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` per disabilitare queste cache.
- Regola le finestre della cache con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modello del registry

I plugin caricati non mutano direttamente variabili globali casuali del core. Si registrano in un
registry centrale dei plugin.

Il registry tiene traccia di:

- record dei plugin (identità, sorgente, origine, stato, diagnostica)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- handler Gateway RPC
- route HTTP
- registrar CLI
- servizi in background
- comandi posseduti dal plugin

Le funzionalità del core leggono poi da quel registry invece di parlare direttamente
con i moduli plugin. Questo mantiene il caricamento unidirezionale:

- modulo plugin -> registrazione nel registry
- runtime del core -> consumo del registry

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici del core ha bisogno solo
di un punto di integrazione: "leggi il registry", non "gestisci casi speciali per ogni modulo plugin".

## Callback di binding della conversazione

I plugin che effettuano il binding di una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere un callback dopo che una richiesta di binding è stata approvata o negata:

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

Campi del payload del callback:

- `status`: `"approved"` o `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` o `"deny"`
- `binding`: il binding risolto per le richieste approvate
- `request`: il riepilogo della richiesta originale, hint di detach, id del mittente e
  metadati della conversazione

Questo callback è solo di notifica. Non cambia chi è autorizzato a effettuare il binding di una
conversazione e viene eseguito dopo che il core ha terminato la gestione dell'approvazione.

## Hook di runtime del provider

I plugin provider ora hanno due livelli:

- metadati del manifest: `providerAuthEnvVars` per un lookup economico dell'auth del provider tramite env
  prima del caricamento del runtime, `providerAuthAliases` per varianti di provider che condividono
  l'auth, `channelEnvVars` per un lookup economico dell'env/setup del canale prima del caricamento del runtime,
  più `providerAuthChoices` per etichette economiche di onboarding/scelta auth e
  metadati dei flag CLI prima del caricamento del runtime
- hook in fase di configurazione: `catalog` / legacy `discovery` più `applyConfigDefaults`
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

OpenClaw continua a possedere il loop generico dell'agente, il failover, la gestione del transcript e
la policy degli strumenti. Questi hook sono la superficie di estensione per il comportamento specifico del provider senza
dover richiedere un intero trasporto di inferenza personalizzato.

Usa il manifest `providerAuthEnvVars` quando il provider ha credenziali basate su env
che i percorsi generici di auth/status/selettore modelli dovrebbero vedere senza caricare il runtime del plugin.
Usa il manifest `providerAuthAliases` quando un id provider deve riutilizzare
le variabili env, i profili auth, l'auth basata su configurazione e la scelta di onboarding della chiave API
di un altro id provider. Usa il manifest `providerAuthChoices` quando le superfici CLI di onboarding/scelta auth
devono conoscere l'id di scelta del provider, le etichette di gruppo e il semplice
wiring auth a singolo flag senza caricare il runtime del provider. Mantieni `envVars` del runtime del provider
per suggerimenti rivolti all'operatore come etichette di onboarding o variabili di setup di
client-id/client-secret OAuth.

Usa il manifest `channelEnvVars` quando un canale ha auth o setup guidati da env che
il fallback generico su shell-env, i controlli di config/status o i prompt di setup dovrebbero vedere
senza caricare il runtime del canale.

### Ordine e utilizzo degli hook

Per i plugin model/provider, OpenClaw chiama gli hook in questo ordine approssimativo.
La colonna "Quando usarlo" è la guida rapida per decidere.

| #   | Hook                              | Cosa fa                                                                                                        | Quando usarlo                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`         | Il provider possiede un catalogo o valori predefiniti di base URL                                                                           |
| 2   | `applyConfigDefaults`             | Applica valori predefiniti globali di configurazione posseduti dal provider durante la materializzazione della configurazione | I valori predefiniti dipendono dalla modalità di auth, dall'env o dalla semantica della famiglia di modelli del provider                   |
| --  | _(built-in model lookup)_         | OpenClaw prova prima il normale percorso di registry/catalogo                                                  | _(non è un hook del plugin)_                                                                                                                |
| 3   | `normalizeModelId`                | Normalizza alias legacy o preview degli id modello prima del lookup                                           | Il provider possiede la pulizia degli alias prima della risoluzione canonica del modello                                                    |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia del provider prima dell'assemblaggio generico del modello         | Il provider possiede la pulizia del trasporto per id provider personalizzati nella stessa famiglia di trasporto                            |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/del provider                               | Il provider ha bisogno di una pulizia della configurazione che dovrebbe vivere con il plugin; gli helper bundled della famiglia Google fanno anche da supporto per le voci di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità dell'utilizzo dello streaming nativo ai provider di configurazione       | Il provider ha bisogno di correzioni dei metadati di utilizzo dello streaming nativo guidate dall'endpoint                                 |
| 7   | `resolveConfigApiKey`             | Risolve l'auth con marker env per i provider di configurazione prima del caricamento dell'auth runtime        | Il provider possiede la risoluzione della chiave API con marker env; `amazon-bedrock` qui ha anche un resolver integrato per marker env AWS |
| 8   | `resolveSyntheticAuth`            | Espone auth locale/self-hosted o basata su configurazione senza rendere persistente il testo in chiaro        | Il provider può operare con un marker di credenziali sintetico/locale                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili di auth esterni posseduti dal provider; il valore predefinito di `persistence` è `runtime-only` per credenziali possedute da CLI/app | Il provider riutilizza credenziali di auth esterne senza rendere persistenti refresh token copiati                                         |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la priorità dei placeholder di profili sintetici memorizzati rispetto ad auth basata su env/configurazione | Il provider memorizza profili placeholder sintetici che non dovrebbero avere la precedenza                                                 |
| 11  | `resolveDynamicModel`             | Fallback sincrono per id modello posseduti dal provider non ancora presenti nel registry locale               | Il provider accetta id modello upstream arbitrari                                                                                           |
| 12  | `prepareDynamicModel`             | Warm-up asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                           | Il provider ha bisogno di metadati di rete prima di risolvere id sconosciuti                                                               |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che l'embedded runner usi il modello risolto                                         | Il provider ha bisogno di riscritture del trasporto ma usa comunque un trasporto del core                                                  |
| 14  | `contributeResolvedModelCompat`   | Contribuisce flag di compatibilità per modelli vendor dietro un altro trasporto compatibile                   | Il provider riconosce i propri modelli su trasporti proxy senza assumere il controllo del provider                                         |
| 15  | `capabilities`                    | Metadati transcript/tooling posseduti dal provider usati dalla logica condivisa del core                      | Il provider ha bisogno di particolarità di transcript/famiglia del provider                                                                |
| 16  | `normalizeToolSchemas`            | Normalizza gli schema degli strumenti prima che l'embedded runner li veda                                     | Il provider ha bisogno di pulizia dello schema per la famiglia di trasporto                                                                |
| 17  | `inspectToolSchemas`              | Espone diagnostiche dello schema possedute dal provider dopo la normalizzazione                               | Il provider vuole avvisi sulle keyword senza insegnare al core regole specifiche del provider                                              |
| 18  | `resolveReasoningOutputMode`      | Seleziona il contratto di output del ragionamento nativo o con tag                                            | Il provider ha bisogno di output tagged di ragionamento/finale invece di campi nativi                                                      |
| 19  | `prepareExtraParams`              | Normalizzazione dei parametri della richiesta prima dei wrapper generici delle opzioni di stream              | Il provider ha bisogno di parametri di richiesta predefiniti o di pulizia dei parametri per provider                                       |
| 20  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un trasporto personalizzato                       | Il provider ha bisogno di un protocollo wire personalizzato, non solo di un wrapper                                                        |
| 21  | `wrapStreamFn`                    | Wrapper dello stream dopo l'applicazione dei wrapper generici                                                 | Il provider ha bisogno di wrapper di compatibilità per header/body/modello della richiesta senza un trasporto personalizzato               |
| 22  | `resolveTransportTurnState`       | Allega header o metadati nativi per turno del trasporto                                                       | Il provider vuole che i trasporti generici inviino l'identità del turno nativa del provider                                                |
| 23  | `resolveWebSocketSessionPolicy`   | Allega header WebSocket nativi o policy di raffreddamento della sessione                                      | Il provider vuole che i trasporti WS generici regolino header di sessione o policy di fallback                                             |
| 24  | `formatApiKey`                    | Formatter del profilo auth: il profilo memorizzato diventa la stringa `apiKey` del runtime                   | Il provider memorizza metadati auth aggiuntivi e ha bisogno di una forma personalizzata del token runtime                                  |
| 25  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o policy in caso di errore di refresh       | Il provider non si adatta ai refresher condivisi `pi-ai`                                                                                   |
| 26  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando il refresh OAuth fallisce                                         | Il provider ha bisogno di indicazioni di riparazione auth possedute dal provider dopo un errore di refresh                                 |
| 27  | `matchesContextOverflowError`     | Matcher posseduto dal provider per overflow della finestra di contesto                                        | Il provider ha errori raw di overflow che le euristiche generiche non rileverebbero                                                        |
| 28  | `classifyFailoverReason`          | Classificazione del motivo di failover posseduta dal provider                                                 | Il provider può mappare errori raw di API/trasporto a rate-limit/overload/ecc.                                                             |
| 29  | `isCacheTtlEligible`              | Policy della cache del prompt per provider proxy/backhaul                                                     | Il provider ha bisogno di gating TTL della cache specifico per proxy                                                                        |
| 30  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero in caso di auth mancante                                      | Il provider ha bisogno di un suggerimento di recupero auth mancante specifico del provider                                                 |
| 31  | `suppressBuiltInModel`            | Soppressione di modelli upstream obsoleti più suggerimento di errore opzionale visibile all'utente           | Il provider ha bisogno di nascondere righe upstream obsolete o sostituirle con un suggerimento del vendor                                  |
| 32  | `augmentModelCatalog`             | Righe di catalogo sintetiche/finali aggiunte dopo la discovery                                                | Il provider ha bisogno di righe sintetiche forward-compat in `models list` e nei selettori                                                 |
| 33  | `isBinaryThinking`                | Interruttore di ragionamento on/off per provider con thinking binario                                         | Il provider espone solo thinking binario acceso/spento                                                                                      |
| 34  | `supportsXHighThinking`           | Supporto al ragionamento `xhigh` per modelli selezionati                                                      | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                                |
| 35  | `resolveDefaultThinkingLevel`     | Livello `/think` predefinito per una specifica famiglia di modelli                                            | Il provider possiede la policy `/think` predefinita per una famiglia di modelli                                                            |
| 36  | `isModernModelRef`                | Matcher di modello moderno per filtri di profilo live e selezione smoke                                       | Il provider possiede il matching del modello preferito per live/smoke                                                                       |
| 37  | `prepareRuntimeAuth`              | Scambia una credenziale configurata con il token/chiave runtime effettivo subito prima dell'inferenza        | Il provider ha bisogno di uno scambio di token o di una credenziale di richiesta a breve durata                                            |
| 38  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e superfici di stato correlate                   | Il provider ha bisogno di parsing personalizzato del token di utilizzo/quota o di una credenziale di utilizzo diversa                      |
| 39  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot di utilizzo/quota specifici del provider dopo che l'auth è stata risolta      | Il provider ha bisogno di un endpoint di utilizzo specifico del provider o di un parser del payload                                        |
| 40  | `createEmbeddingProvider`         | Costruisce un adapter di embedding posseduto dal provider per memoria/ricerca                                 | Il comportamento degli embedding per la memoria appartiene al plugin del provider                                                           |
| 41  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione del transcript per il provider                     | Il provider ha bisogno di una policy transcript personalizzata (per esempio la rimozione dei blocchi di thinking)                          |
| 42  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica del transcript                                      | Il provider ha bisogno di riscritture del replay specifiche del provider oltre agli helper condivisi di Compaction                         |
| 43  | `validateReplayTurns`             | Validazione finale o rimodellazione dei turni di replay prima dell'embedded runner                            | Il trasporto del provider ha bisogno di una validazione più rigorosa dei turni dopo la sanitizzazione generica                             |
| 44  | `onModelSelected`                 | Esegue effetti collaterali post-selezione posseduti dal provider                                              | Il provider ha bisogno di telemetria o stato posseduto dal provider quando un modello diventa attivo                                       |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
plugin provider corrispondente, poi passano agli altri plugin provider con supporto hook
finché uno non modifica effettivamente l'id del modello o il trasporto/configurazione. Questo mantiene
funzionanti gli shim di alias/compatibilità del provider senza richiedere al chiamante di sapere quale
plugin bundled possiede la riscrittura. Se nessun hook provider riscrive una voce di configurazione supportata della
famiglia Google, il normalizzatore di configurazione Google bundled applica comunque quella pulizia di compatibilità.

Se il provider ha bisogno di un protocollo wire completamente personalizzato o di un esecutore di richieste personalizzato,
si tratta di una classe diversa di estensione. Questi hook sono per il comportamento del provider
che continua a essere eseguito nel normale loop di inferenza di OpenClaw.

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
  `resolveDefaultThinkingLevel`, `applyConfigDefaults`, `isModernModelRef`
  e `wrapStreamFn` perché possiede la forward-compat di Claude 4.6,
  suggerimenti della famiglia del provider, indicazioni per la riparazione dell'auth, integrazione
  dell'endpoint di utilizzo, idoneità della cache del prompt, valori predefiniti di configurazione consapevoli dell'auth, policy di thinking
  predefinita/adattiva di Claude e modellazione dello stream specifica di Anthropic per
  header beta, `/fast` / `serviceTier` e `context1m`.
- Gli helper di stream specifici di Claude per Anthropic restano per ora nel
  seam pubblico `api.ts` / `contract-api.ts` del plugin bundled. Questa superficie del pacchetto
  esporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i builder di wrapper Anthropic
  di livello inferiore invece di ampliare l'SDK generico attorno alle regole di header beta di un
  singolo provider.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities` oltre a `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `supportsXHighThinking` e `isModernModelRef`
  perché possiede la forward-compat di GPT-5.4, la normalizzazione diretta OpenAI
  `openai-completions` -> `openai-responses`, suggerimenti auth consapevoli di Codex,
  soppressione di Spark, righe sintetiche dell'elenco OpenAI e policy di thinking /
  modello live di GPT-5; la famiglia di stream `openai-responses-defaults` possiede i
  wrapper nativi condivisi OpenAI Responses per header di attribuzione,
  `/fast`/`serviceTier`, verbosità del testo, ricerca web Codex nativa,
  modellazione del payload di compatibilità del ragionamento e gestione del contesto di Responses.
- OpenRouter usa `catalog` più `resolveDynamicModel` e
  `prepareDynamicModel` perché il provider è pass-through e può esporre nuovi
  id modello prima che il catalogo statico di OpenClaw venga aggiornato; usa anche
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` per mantenere
  header di richiesta specifici del provider, metadati di routing, patch di ragionamento e
  policy della cache del prompt fuori dal core. La sua policy di replay proviene dalla
  famiglia `passthrough-gemini`, mentre la famiglia di stream `openrouter-thinking`
  possiede l'iniezione del ragionamento proxy e i salti dei modelli non supportati / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities` oltre a `prepareRuntimeAuth` e `fetchUsageSnapshot` perché
  ha bisogno di login del dispositivo posseduto dal provider, comportamento di fallback del modello, particolarità
  del transcript Claude, uno scambio token GitHub -> token Copilot e un endpoint di utilizzo posseduto dal provider.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog` oltre a
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot` perché
  continua a essere eseguito sui trasporti OpenAI del core ma possiede la propria normalizzazione di
  trasporto/base URL, policy di fallback del refresh OAuth, scelta di trasporto predefinita,
  righe sintetiche del catalogo Codex e integrazione dell'endpoint di utilizzo ChatGPT; condivide
  la stessa famiglia di stream `openai-responses-defaults` di OpenAI diretto.
- Google AI Studio e Gemini CLI OAuth usano `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` perché la
  famiglia di replay `google-gemini` possiede il fallback forward-compat di Gemini 3.1,
  la validazione del replay nativo Gemini, la sanitizzazione del replay bootstrap, la modalità di output del ragionamento
  con tag e il matching dei modelli moderni, mentre la
  famiglia di stream `google-thinking` possiede la normalizzazione del payload di thinking di Gemini;
  Gemini CLI OAuth usa anche `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` per formattazione del token, parsing del token e wiring
  dell'endpoint quota.
- Anthropic Vertex usa `buildReplayPolicy` tramite la
  famiglia di replay `anthropic-by-model` così la pulizia del replay specifica di Claude resta
  limitata agli id Claude invece che a ogni trasporto `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveDefaultThinkingLevel` perché possiede la classificazione
  specifica di Bedrock degli errori throttle/not-ready/context-overflow
  per il traffico Anthropic-on-Bedrock; la sua policy di replay condivide comunque la stessa
  protezione solo Claude `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode e Opencode Go usano `buildReplayPolicy`
  tramite la famiglia di replay `passthrough-gemini` perché instradano proxy dei modelli Gemini
  tramite trasporti compatibili con OpenAI e hanno bisogno della
  sanitizzazione della thought-signature di Gemini senza validazione nativa del replay Gemini né
  riscritture bootstrap.
- MiniMax usa `buildReplayPolicy` tramite la
  famiglia di replay `hybrid-anthropic-openai` perché un provider possiede sia semantiche
  Anthropic-message sia compatibili con OpenAI; mantiene la rimozione dei blocchi di thinking solo Claude
  sul lato Anthropic mentre reimposta la modalità di output del ragionamento a quella nativa, e la
  famiglia di stream `minimax-fast-mode` possiede le riscritture dei modelli fast-mode nel percorso di stream condiviso.
- Moonshot usa `catalog` più `wrapStreamFn` perché continua a usare il trasporto condiviso
  OpenAI ma ha bisogno della normalizzazione del payload di thinking posseduta dal provider; la
  famiglia di stream `moonshot-thinking` mappa configurazione più stato `/think` sul proprio
  payload nativo di thinking binario.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` perché ha bisogno di header di richiesta posseduti dal provider,
  normalizzazione del payload di ragionamento, suggerimenti transcript Gemini e gating
  TTL della cache Anthropic; la famiglia di stream `kilocode-thinking` mantiene l'iniezione del thinking di Kilo
  nel percorso di stream proxy condiviso saltando `kilo/auto` e
  altri id modello proxy che non supportano payload di ragionamento espliciti.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `isBinaryThinking`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot` perché possiede il fallback di GLM-5,
  i valori predefiniti di `tool_stream`, la UX di thinking binario, il matching dei modelli moderni e sia
  l'auth di utilizzo sia il recupero della quota; la famiglia di stream `tool-stream-default-on` mantiene
  il wrapper `tool_stream` attivo per impostazione predefinita fuori dal glue scritto a mano per ogni provider.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  perché possiede la normalizzazione del trasporto nativo xAI Responses, le riscritture
  degli alias fast-mode di Grok, il valore predefinito `tool_stream`, la pulizia rigorosa di tool / payload di ragionamento,
  il riutilizzo dell'auth di fallback per strumenti posseduti dal plugin, la risoluzione forward-compat dei modelli Grok
  e patch di compatibilità possedute dal provider come il profilo xAI per gli schema degli strumenti,
  keyword di schema non supportate, `web_search` nativo e decodifica delle entità HTML
  degli argomenti delle chiamate agli strumenti.
- Mistral, OpenCode Zen e OpenCode Go usano solo `capabilities` per mantenere
  le particolarità di transcript/tooling fuori dal core.
- I provider bundled solo catalogo come `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine` usano
  solo `catalog`.
- Qwen usa `catalog` per il proprio provider testuale più registrazioni condivise di media-understanding e
  video-generation per le sue superfici multimodali.
- MiniMax e Xiaomi usano `catalog` più hook di utilizzo perché il loro comportamento `/usage`
  è posseduto dal plugin anche se l'inferenza continua a essere eseguita tramite i trasporti condivisi.

## Helper di runtime

I plugin possono accedere a helper selezionati del core tramite `api.runtime`. Per il TTS:

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

- `textToSpeech` restituisce il normale payload di output TTS del core per superfici file/messaggio vocale.
- Usa la configurazione core `messages.tts` e la selezione del provider.
- Restituisce buffer audio PCM + sample rate. I plugin devono ricampionare/codificare per i provider.
- `listVoices` è opzionale per provider. Usalo per selettori vocali posseduti dal vendor o per flussi di setup.
- Gli elenchi delle voci possono includere metadati più ricchi come locale, genere e tag di personalità per selettori consapevoli del provider.
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

- Mantieni nel core la policy TTS, il fallback e il recapito delle risposte.
- Usa i provider vocali per il comportamento di sintesi posseduto dal vendor.
- L'input legacy Microsoft `edge` viene normalizzato nell'id provider `microsoft`.
- Il modello di ownership preferito è orientato all'azienda: un plugin vendor può possedere
  testo, voce, immagini e futuri provider media man mano che OpenClaw aggiunge quei
  contratti di capability.

Per la comprensione di immagini/audio/video, i plugin registrano un provider tipizzato
media-understanding invece di una generica bag chiave/valore:

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

- Mantieni orchestrazione, fallback, configurazione e wiring del canale nel core.
- Mantieni il comportamento del vendor nel plugin provider.
- L'espansione additiva dovrebbe restare tipizzata: nuovi metodi opzionali, nuovi campi
  risultato opzionali, nuove capability opzionali.
- La generazione video segue già lo stesso pattern:
  - il core possiede il contratto di capability e l'helper di runtime
  - i plugin vendor registrano `api.registerVideoGenerationProvider(...)`
  - i plugin di funzionalità/canale consumano `api.runtime.videoGeneration.*`

Per gli helper di runtime media-understanding, i plugin possono chiamare:

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

Per la trascrizione audio, i plugin possono usare il runtime media-understanding
o il vecchio alias STT:

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Opzionale quando il MIME non può essere dedotto in modo affidabile:
  mime: "audio/ogg",
});
```

Note:

- `api.runtime.mediaUnderstanding.*` è la superficie condivisa preferita per
  la comprensione di immagini/audio/video.
- Usa la configurazione audio media-understanding del core (`tools.media.audio`) e l'ordine di fallback del provider.
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

- `provider` e `model` sono override opzionali per esecuzione, non modifiche persistenti della sessione.
- OpenClaw rispetta questi campi di override solo per chiamanti affidabili.
- Per esecuzioni di fallback possedute dal plugin, gli operatori devono aderire esplicitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i plugin affidabili a specifici target canonici `provider/model`, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni di subagent dei plugin non affidabili continuano a funzionare, ma le richieste di override vengono rifiutate invece di ricadere silenziosamente su un fallback.

Per la ricerca web, i plugin possono consumare l'helper runtime condiviso invece di
accedere al wiring dello strumento dell'agente:

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
- `listProviders(...)`: elenca i provider di generazione immagini disponibili e le loro capability.

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
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale auth del gateway, oppure `"plugin"` per auth gestita dal plugin/verifica del Webhook.
- `match`: opzionale. `"exact"` (predefinito) o `"prefix"`.
- `replaceExisting`: opzionale. Permette allo stesso plugin di sostituire la propria registrazione di route esistente.
- `handler`: restituisce `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e provocherà un errore di caricamento del plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei plugin devono dichiarare esplicitamente `auth`.
- I conflitti esatti `path + match` vengono rifiutati a meno che `replaceExisting: true`, e un plugin non può sostituire la route di un altro plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni le catene di fallthrough `exact`/`prefix` solo allo stesso livello di auth.
- Le route `auth: "plugin"` **non** ricevono automaticamente gli scope runtime dell'operatore. Sono per webhook/verifica firma gestiti dal plugin, non per chiamate helper Gateway con privilegi.
- Le route `auth: "gateway"` vengono eseguite all'interno di uno scope runtime di richiesta Gateway, ma tale scope è intenzionalmente conservativo:
  - l'auth bearer con segreto condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli scope runtime delle route plugin fissati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP affidabili con identità esplicita (per esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente su quelle richieste di route plugin con identità esplicita, lo scope runtime ricade su `operator.write`
- Regola pratica: non presumere che una route plugin con auth gateway sia implicitamente una superficie admin. Se la tua route ha bisogno di comportamento solo admin, richiedi una modalità auth con identità esplicita e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di import del Plugin SDK

Usa i sottopercorsi dell'SDK invece dell'import monolitico `openclaw/plugin-sdk` quando
scrivi plugin:

- `openclaw/plugin-sdk/plugin-entry` per le primitive di registrazione dei plugin.
- `openclaw/plugin-sdk/core` per il contratto generico condiviso rivolto ai plugin.
- `openclaw/plugin-sdk/config-schema` per l'esportazione dello schema Zod root `openclaw.json`
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
  `openclaw/plugin-sdk/webhook-ingress` per il wiring condiviso di setup/auth/risposta/Webhook.
  `channel-inbound` è la casa condivisa per debounce, matching delle mention,
  helper della policy di mention in ingresso, formattazione degli envelope in ingresso e helper di contesto
  degli envelope in ingresso.
  `channel-setup` è il seam ristretto di setup con installazione opzionale.
  `setup-runtime` è la superficie di setup sicura per il runtime usata da `setupEntry` /
  avvio differito, inclusi gli adapter di patch di setup sicuri per l'import.
  `setup-adapter-runtime` è il seam dell'adapter di setup account consapevole dell'env.
  `setup-tools` è il piccolo seam helper CLI/archivio/documentazione (`formatCliCommand`,
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
  `telegram-command-config` è il seam pubblico ristretto per la normalizzazione/validazione dei comandi personalizzati Telegram e resta disponibile anche se la superficie contrattuale Telegram bundled è temporaneamente non disponibile.
  `text-runtime` è il seam condiviso di testo/markdown/logging, inclusi
  rimozione del testo visibile all'assistente, helper di rendering/chunking markdown, helper di redazione,
  helper per tag di direttiva e utility di testo sicuro.
- I seam di canale specifici per approvazione dovrebbero preferire un unico contratto `approvalCapability`
  sul plugin. Il core poi legge auth di approvazione, delivery, rendering,
  routing nativo e comportamento lazy dell'handler nativo tramite quell'unica capability
  invece di mescolare il comportamento di approvazione in campi del plugin non correlati.
- `openclaw/plugin-sdk/channel-runtime` è deprecato e resta solo come
  shim di compatibilità per plugin più vecchi. Il nuovo codice dovrebbe importare invece le primitive generiche più ristrette, e il codice del repo non dovrebbe aggiungere nuovi import dello
  shim.
- Gli interni delle estensioni bundled restano privati. I plugin esterni dovrebbero usare solo i sottopercorsi `openclaw/plugin-sdk/*`. Il codice core/test di OpenClaw può usare i punti di ingresso pubblici del repo sotto la root di un pacchetto plugin come `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e file a scope ristretto come
  `login-qr-api.js`. Non importare mai `src/*` di un pacchetto plugin dal core o da
  un'altra estensione.
- Suddivisione dei punti di ingresso del repo:
  `<plugin-package-root>/api.js` è il barrel di helper/tipi,
  `<plugin-package-root>/runtime-api.js` è il barrel solo runtime,
  `<plugin-package-root>/index.js` è l'entry del plugin bundled,
  e `<plugin-package-root>/setup-entry.js` è l'entry del plugin di setup.
- Esempi attuali di provider bundled:
  - Anthropic usa `api.js` / `contract-api.js` per helper di stream Claude come
    `wrapAnthropicProviderStream`, helper per header beta e parsing di `service_tier`.
  - OpenAI usa `api.js` per builder del provider, helper del modello predefinito e
    builder del provider realtime.
  - OpenRouter usa `api.js` per il proprio builder del provider più helper di onboarding/configurazione, mentre `register.runtime.js` può ancora riesportare helper generici
    `plugin-sdk/provider-stream` per uso locale nel repo.
- I punti di ingresso pubblici caricati tramite facade preferiscono lo snapshot della configurazione runtime attiva
  quando esiste, e altrimenti ricadono sul file di configurazione risolto su disco quando
  OpenClaw non sta ancora servendo uno snapshot runtime.
- Le primitive generiche condivise restano il contratto pubblico preferito dell'SDK. Esiste ancora un piccolo
  insieme di compatibilità riservato di seam helper con marchio dei canali bundled. Trattali come seam di manutenzione bundled/compatibilità, non come nuovi target di import per terze parti; i nuovi contratti cross-channel dovrebbero comunque approdare su sottopercorsi generici `plugin-sdk/*` o sui barrel locali del plugin `api.js` /
  `runtime-api.js`.

Nota sulla compatibilità:

- Evita il barrel root `openclaw/plugin-sdk` nel nuovo codice.
- Preferisci prima le primitive stabili e ristrette. I più recenti sottopercorsi di setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool sono il contratto previsto per il nuovo
  lavoro su plugin bundled ed esterni.
  Il parsing/matching del target appartiene a `openclaw/plugin-sdk/channel-targets`.
  I gate delle azioni di messaggio e gli helper message-id delle reazioni appartengono a
  `openclaw/plugin-sdk/channel-actions`.
- I barrel helper specifici delle estensioni bundled non sono stabili per impostazione predefinita. Se un
  helper serve solo a un'estensione bundled, tienilo dietro il seam locale
  `api.js` o `runtime-api.js` dell'estensione invece di promuoverlo in
  `openclaw/plugin-sdk/<extension>`.
- I nuovi seam helper condivisi dovrebbero essere generici, non con marchio di canale. Il parsing condiviso
  del target appartiene a `openclaw/plugin-sdk/channel-targets`; gli interni specifici del canale
  restano dietro il seam locale `api.js` o `runtime-api.js` del plugin proprietario.
- I sottopercorsi specifici per capability come `image-generation`,
  `media-understanding` e `speech` esistono perché i plugin bundled/nativi li usano
  oggi. La loro presenza non significa di per sé che ogni helper esportato sia un contratto esterno congelato a lungo termine.

## Schemi dello strumento message

I plugin dovrebbero possedere i contributi allo schema `describeMessageTool(...)` specifici del canale.
Mantieni i campi specifici del provider nel plugin, non nel core condiviso.

Per i frammenti di schema portabili condivisi, riutilizza gli helper generici esportati tramite
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` per payload in stile griglia di pulsanti
- `createMessageToolCardSchema()` per payload di card strutturate

Se una forma di schema ha senso solo per un provider, definiscila nel codice sorgente
di quel plugin invece di promuoverla nell'SDK condiviso.

## Risoluzione del target del canale

I plugin di canale dovrebbero possedere la semantica del target specifica del canale. Mantieni generico
l'host outbound condiviso e usa la superficie dell'adapter di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  debba essere trattato come `direct`, `group` o `channel` prima del lookup di directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input debba saltare direttamente alla risoluzione tipo id invece che alla ricerca in directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del plugin quando
  il core ha bisogno di una risoluzione finale posseduta dal provider dopo la normalizzazione o dopo un
  mancato riscontro in directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione
  specifica del provider una volta che un target è stato risolto.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima della
  ricerca di peer/gruppi.
- Usa `looksLikeId` per controlli del tipo "tratta questo come id target esplicito/nativo".
- Usa `resolveTarget` per fallback di normalizzazione specifico del provider, non per
  una ricerca ampia in directory.
- Mantieni id nativi del provider come chat id, thread id, JID, handle e room
  id all'interno dei valori `target` o dei parametri specifici del provider, non in campi generici dell'SDK.

## Directory basate su configurazione

I plugin che derivano voci di directory dalla configurazione dovrebbero mantenere questa logica nel
plugin e riutilizzare gli helper condivisi da
`openclaw/plugin-sdk/directory-runtime`.

Usa questo approccio quando un canale ha peer/gruppi basati su configurazione, come:

- peer DM guidati da allowlist
- mappe configurate di canali/gruppi
- fallback statici di directory con ambito account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtro delle query
- applicazione del limite
- helper di deduplicazione/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione dell'account e la normalizzazione degli id specifiche del canale dovrebbero restare
nell'implementazione del plugin.

## Cataloghi dei provider

I plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce singola di provider
- `{ providers }` per più voci di provider

Usa `catalog` quando il plugin possiede id modello specifici del provider, valori predefiniti di base URL
o metadati dei modelli vincolati all'auth.

`catalog.order` controlla quando il catalogo di un plugin viene unito rispetto ai provider
impliciti integrati di OpenClaw:

- `simple`: provider semplici guidati da chiave API o env
- `profile`: provider che appaiono quando esistono profili auth
- `paired`: provider che sintetizzano più voci correlate di provider
- `late`: ultimo passaggio, dopo gli altri provider impliciti

I provider successivi vincono in caso di collisione di chiavi, quindi i plugin possono
sovrascrivere intenzionalmente una voce provider integrata con lo stesso id provider.

Compatibilità:

- `discovery` continua a funzionare come alias legacy
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione del canale in sola lettura

Se il tuo plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso runtime. Può presumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando i secret richiesti mancano.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi di riparazione doctor/config
  non dovrebbero dover materializzare credenziali runtime solo per
  descrivere la configurazione.

Comportamento consigliato per `inspectAccount(...)`:

- Restituisci solo lo stato descrittivo dell'account.
- Preserva `enabled` e `configured`.
- Includi campi sorgente/stato delle credenziali quando rilevanti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire i valori raw dei token solo per riportare
  la disponibilità in sola lettura. Restituire `tokenStatus: "available"` (e il campo sorgente corrispondente) è sufficiente per i comandi in stile status.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso di comando corrente.

Questo consente ai comandi in sola lettura di riportare "configurato ma non disponibile in questo percorso di comando" invece di andare in crash o riportare erroneamente l'account come non configurato.

## Package pack

Una directory plugin può includere un `package.json` con `openclaw.extensions`:

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
`node_modules` è disponibile (`npm install` / `pnpm install`).

Guardrail di sicurezza: ogni voce `openclaw.extensions` deve restare all'interno della directory del plugin
dopo la risoluzione dei symlink. Le voci che escono dalla directory del pacchetto vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del plugin con
`npm install --omit=dev --ignore-scripts` (nessuno script lifecycle, nessuna dipendenza di sviluppo a runtime). Mantieni gli alberi delle dipendenze del plugin "puri JS/TS" ed evita pacchetti che richiedono build `postinstall`.

Opzionale: `openclaw.setupEntry` può puntare a un modulo leggero solo setup.
Quando OpenClaw ha bisogno di superfici di setup per un plugin di canale disabilitato, oppure
quando un plugin di canale è abilitato ma ancora non configurato, carica `setupEntry`
invece dell'entry completa del plugin. Questo mantiene avvio e setup più leggeri
quando la tua entry principale del plugin collega anche strumenti, hook o altro codice solo runtime.

Opzionale: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può far aderire un plugin di canale allo stesso percorso `setupEntry` durante la
fase di avvio pre-listen del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, questo significa che l'entry di setup
deve registrare ogni capability posseduta dal canale da cui l'avvio dipende, come:

- la registrazione del canale stesso
- qualsiasi route HTTP che debba essere disponibile prima che il gateway inizi ad ascoltare
- qualsiasi metodo Gateway, strumento o servizio che debba esistere durante quella stessa finestra

Se la tua entry completa possiede ancora una capability di avvio richiesta, non abilitare
questo flag. Mantieni il plugin sul comportamento predefinito e lascia che OpenClaw carichi l'entry completa durante l'avvio.

I canali bundled possono anche pubblicare helper di superficie contrattuale solo setup che il core
può consultare prima che il runtime completo del canale sia caricato. L'attuale superficie di promozione del setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando deve promuovere una configurazione legacy di canale a singolo account in
`channels.<id>.accounts.*` senza caricare l'entry completa del plugin.
Matrix è l'esempio bundled attuale: sposta solo le chiavi auth/bootstrap in un
account promosso con nome quando esistono già account con nome, e può preservare una
chiave di account predefinito configurata non canonica invece di creare sempre
`accounts.default`.

Questi adapter di patch del setup mantengono lazy la discovery della superficie contrattuale bundled. Il tempo di import resta leggero; la superficie di promozione viene caricata solo al primo utilizzo invece di rientrare nell'avvio del canale bundled all'import del modulo.

Quando quelle superfici di avvio includono metodi Gateway RPC, mantienili su un
prefisso specifico del plugin. I namespace admin del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e si risolvono sempre
in `operator.admin`, anche se un plugin richiede uno scope più ristretto.

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

I plugin di canale possono pubblicizzare metadati di setup/discovery tramite `openclaw.channel` e
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
      "blurb": "Chat self-hosted tramite bot webhook Nextcloud Talk.",
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

- `detailLabel`: etichetta secondaria per superfici di catalogo/status più ricche
- `docsLabel`: sovrascrive il testo del link per il collegamento alla documentazione
- `preferOver`: id di plugin/canale a priorità inferiore che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo della superficie di selezione
- `markdownCapable`: contrassegna il canale come compatibile con Markdown per decisioni di formattazione outbound
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai picker interattivi di setup/configurazione quando impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: fa aderire il canale al flusso standard `allowFrom` di quickstart
- `forceAccountBinding`: richiede un account binding esplicito anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce il lookup della sessione durante la risoluzione dei target announce

OpenClaw può anche unire **cataloghi di canali esterni** (per esempio, un'esportazione
del registry MPM). Inserisci un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o più file JSON (delimitati da virgola/punto e virgola/`PATH`). Ogni file dovrebbe
contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy per la chiave `"entries"`.

## Plugin del motore di contesto

I plugin del motore di contesto possiedono l'orchestrazione del contesto della sessione per acquisizione, assemblaggio
e Compaction. Registrali dal tuo plugin con
`api.registerContextEngine(id, factory)`, poi seleziona il motore attivo con
`plugins.slots.contextEngine`.

Usa questo approccio quando il tuo plugin deve sostituire o estendere la pipeline di contesto predefinita
invece di aggiungere solo ricerca nella memoria o hook.

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

## Aggiungere una nuova capability

Quando un plugin ha bisogno di un comportamento che non rientra nell'API attuale, non aggirare
il sistema Plugin con un accesso privato interno. Aggiungi la capability mancante.

Sequenza consigliata:

1. definire il contratto del core
   Decidi quale comportamento condiviso il core deve possedere: policy, fallback, merge della configurazione,
   ciclo di vita, semantica rivolta ai canali e forma dell'helper di runtime.
2. aggiungere superfici tipizzate di registrazione/runtime del plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la superficie di capability tipizzata
   più piccola ma utile.
3. collegare il core + i consumer di canale/funzionalità
   I canali e i plugin di funzionalità dovrebbero consumare la nuova capability tramite il core,
   non importando direttamente un'implementazione del vendor.
4. registrare le implementazioni del vendor
   I plugin vendor registrano poi i propri backend rispetto alla capability.
5. aggiungere copertura di contratto
   Aggiungi test così ownership e forma della registrazione restano esplicite nel tempo.

È così che OpenClaw resta con opinioni forti senza diventare hardcoded rispetto alla
visione del mondo di un singolo provider. Vedi [Capability Cookbook](/it/plugins/architecture)
per una checklist concreta dei file e un esempio completo.

### Checklist delle capability

Quando aggiungi una nuova capability, l'implementazione dovrebbe di solito toccare insieme queste
superfici:

- tipi del contratto core in `src/<capability>/types.ts`
- helper runtime/runner del core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API Plugin in `src/plugins/types.ts`
- wiring del registry dei plugin in `src/plugins/registry.ts`
- esposizione del runtime del plugin in `src/plugins/runtime/*` quando plugin di funzionalità/canale
  devono consumarlo
- helper di acquisizione/test in `src/test-utils/plugin-registration.ts`
- asserzioni di ownership/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/plugin in `docs/`

Se una di queste superfici manca, di solito è un segno che la capability non è
ancora completamente integrata.

### Template di capability

Pattern minimo:

```ts
// contratto del core
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API Plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper runtime condiviso per plugin di funzionalità/canale
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

- il core possiede il contratto di capability + l'orchestrazione
- i plugin vendor possiedono le implementazioni del vendor
- i plugin di funzionalità/canale consumano helper di runtime
- i test di contratto mantengono esplicita l'ownership
