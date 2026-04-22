---
read_when:
    - Creazione o debug di Plugin OpenClaw nativi
    - Comprendere il modello di capacità dei Plugin o i confini di ownership
    - Lavorare sulla pipeline di caricamento o sul registro dei Plugin
    - Implementare hook runtime dei provider o Plugin canale
sidebarTitle: Internals
summary: 'Dettagli interni dei Plugin: modello di capacità, ownership, contratti, pipeline di caricamento e helper runtime'
title: Dettagli interni dei Plugin
x-i18n:
    generated_at: "2026-04-22T04:24:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69080a1d0e496b321a6fd5a3e925108c3a03c41710073f8f23af13933a091e28
    source_path: plugins/architecture.md
    workflow: 15
---

# Dettagli interni dei Plugin

<Info>
  Questo è il **riferimento di architettura approfondito**. Per guide pratiche, vedi:
  - [Installare e usare i plugin](/it/tools/plugin) — guida per l'utente
  - [Guida introduttiva](/it/plugins/building-plugins) — primo tutorial sui plugin
  - [Plugin canale](/it/plugins/sdk-channel-plugins) — crea un canale di messaggistica
  - [Plugin provider](/it/plugins/sdk-provider-plugins) — crea un provider di modelli
  - [Panoramica SDK](/it/plugins/sdk-overview) — import map e API di registrazione
</Info>

Questa pagina copre l'architettura interna del sistema di plugin di OpenClaw.

## Modello di capacità pubblico

Le capacità sono il modello pubblico dei **plugin nativi** all'interno di OpenClaw. Ogni
plugin OpenClaw nativo si registra rispetto a uno o più tipi di capacità:

| Capacità              | Metodo di registrazione                          | Esempi di plugin                    |
| --------------------- | ------------------------------------------------ | ----------------------------------- |
| Inferenza testuale    | `api.registerProvider(...)`                      | `openai`, `anthropic`               |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                 | `openai`, `anthropic`               |
| Voce                  | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`           |
| Trascrizione realtime | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| Voce realtime         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                            |
| Comprensione multimediale | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google`                |
| Generazione immagini  | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Generazione musicale  | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                 |
| Generazione video     | `api.registerVideoGenerationProvider(...)`       | `qwen`                              |
| Recupero web          | `api.registerWebFetchProvider(...)`              | `firecrawl`                         |
| Ricerca web           | `api.registerWebSearchProvider(...)`             | `google`                            |
| Canale / messaggistica | `api.registerChannel(...)`                      | `msteams`, `matrix`                 |

Un plugin che registra zero capacità ma fornisce hook, strumenti o
servizi è un plugin **legacy solo-hook**. Questo schema è ancora pienamente supportato.

### Posizione sulla compatibilità esterna

Il modello di capacità è presente nel core ed è usato oggi dai plugin
inclusi/nativi, ma la compatibilità dei plugin esterni richiede ancora un criterio più rigoroso di "è esportato, quindi è congelato".

Linee guida attuali:

- **plugin esterni esistenti:** mantieni funzionanti le integrazioni basate su hook; trattale
  come baseline di compatibilità
- **nuovi plugin inclusi/nativi:** preferisci una registrazione esplicita delle capacità invece di reach-in specifici del vendor o nuovi design solo-hook
- **plugin esterni che adottano la registrazione delle capacità:** consentiti, ma tratta le superfici helper specifiche delle capacità come in evoluzione, salvo che la documentazione contrassegni esplicitamente un contratto come stabile

Regola pratica:

- le API di registrazione delle capacità sono la direzione prevista
- gli hook legacy restano il percorso più sicuro per non introdurre rotture nei plugin esterni durante la transizione
- i sotto-percorsi helper esportati non sono tutti equivalenti; preferisci il contratto documentato e ristretto, non esportazioni helper incidentali

### Forme dei plugin

OpenClaw classifica ogni plugin caricato in una forma in base al suo effettivo
comportamento di registrazione (non solo ai metadati statici):

- **plain-capability** -- registra esattamente un tipo di capacità (per esempio un
  plugin solo provider come `mistral`)
- **hybrid-capability** -- registra più tipi di capacità (per esempio
  `openai` gestisce inferenza testuale, voce, comprensione multimediale e generazione immagini)
- **hook-only** -- registra solo hook (tipizzati o personalizzati), senza capacità,
  strumenti, comandi o servizi
- **non-capability** -- registra strumenti, comandi, servizi o route ma nessuna
  capacità

Usa `openclaw plugins inspect <id>` per vedere la forma di un plugin e la suddivisione
delle capacità. Vedi [Riferimento CLI](/cli/plugins#inspect) per i dettagli.

### Hook legacy

L'hook `before_agent_start` resta supportato come percorso di compatibilità per
i plugin solo-hook. Plugin legacy reali dipendono ancora da esso.

Direzione:

- mantenerlo funzionante
- documentarlo come legacy
- preferire `before_model_resolve` per il lavoro di override di modello/provider
- preferire `before_prompt_build` per il lavoro di mutazione del prompt
- rimuoverlo solo dopo che l'uso reale diminuisce e la copertura dei fixture dimostra la sicurezza della migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` o `openclaw plugins inspect <id>`, potresti vedere
una di queste etichette:

| Segnale                   | Significato                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | La configurazione viene parse correttamente e i plugin vengono risolti |
| **compatibility advisory** | Il plugin usa uno schema supportato ma più vecchio (es. `hook-only`) |
| **legacy warning**        | Il plugin usa `before_agent_start`, che è deprecato          |
| **hard error**            | La configurazione non è valida o il plugin non è stato caricato |

Né `hook-only` né `before_agent_start` romperanno il tuo plugin oggi --
`hook-only` è un avviso, e `before_agent_start` genera solo un warning. Questi
segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema di plugin di OpenClaw ha quattro livelli:

1. **Manifest + rilevamento**
   OpenClaw trova i plugin candidati dai percorsi configurati, dalle root dei workspace,
   dalle root globali delle estensioni e dalle estensioni incluse. Il rilevamento legge prima i
   manifest nativi `openclaw.plugin.json` più i manifest bundle supportati.
2. **Abilitazione + validazione**
   Il core decide se un plugin rilevato è abilitato, disabilitato, bloccato o
   selezionato per uno slot esclusivo come la memoria.
3. **Caricamento runtime**
   I plugin OpenClaw nativi vengono caricati in-process tramite jiti e registrano
   capacità in un registro centrale. I bundle compatibili vengono normalizzati in
   record di registro senza importare codice runtime.
4. **Consumo della superficie**
   Il resto di OpenClaw legge il registro per esporre strumenti, canali, configurazione
   dei provider, hook, route HTTP, comandi CLI e servizi.

Per la CLI dei plugin in particolare, il rilevamento dei comandi root è suddiviso in due fasi:

- i metadati in fase di parsing provengono da `registerCli(..., { descriptors: [...] })`
- il vero modulo CLI del plugin può restare lazy e registrarsi al primo invoco

Questo mantiene il codice CLI gestito dal plugin dentro il plugin consentendo comunque a OpenClaw
di riservare i nomi dei comandi root prima del parsing.

Il confine progettuale importante:

- rilevamento + validazione della configurazione dovrebbero funzionare da metadati di **manifest/schema**
  senza eseguire il codice del plugin
- il comportamento runtime nativo proviene dal percorso `register(api)` del modulo plugin

Questa separazione consente a OpenClaw di validare la configurazione, spiegare plugin mancanti/disabilitati e
costruire hint di UI/schema prima che il runtime completo sia attivo.

### Plugin canale e lo strumento condiviso `message`

I plugin canale non devono registrare uno strumento separato di invio/modifica/reazione per
le normali azioni chat. OpenClaw mantiene un unico strumento `message` condiviso nel core, e
i plugin canale gestiscono il rilevamento e l'esecuzione specifici del canale dietro di esso.

Il confine attuale è:

- il core gestisce l'host dello strumento condiviso `message`, il wiring del prompt, il bookkeeping di sessione/thread
  e il dispatch di esecuzione
- i plugin canale gestiscono il rilevamento delle azioni con scope, il rilevamento delle capacità e qualsiasi frammento di schema specifico del canale
- i plugin canale gestiscono la grammatica di conversazione della sessione specifica del provider, ad esempio
  come gli ID di conversazione codificano gli ID thread o ereditano dalle conversazioni parent
- i plugin canale eseguono l'azione finale tramite il loro adattatore di azione

Per i plugin canale, la superficie SDK è
`ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata di rilevamento unificata consente a un plugin di restituire insieme azioni visibili, capacità e contributi allo schema
così che questi elementi non divergano tra loro.

Quando un parametro dello strumento message specifico del canale contiene una sorgente multimediale come un
percorso locale o un URL media remoto, il plugin dovrebbe anche restituire
`mediaSourceParams` da `describeMessageTool(...)`. Il core usa questo elenco esplicito per applicare la normalizzazione dei percorsi sandbox e gli hint di accesso media in uscita
senza codificare rigidamente nomi di parametri gestiti dal plugin.
Preferisci mappe con scope per azione lì, non un unico elenco piatto per tutto il canale, così un
parametro multimediale solo-profile non viene normalizzato su azioni non correlate come
`send`.

Il core passa l'ambito runtime in quel passaggio di rilevamento. Campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` trusted in ingresso

Questo è importante per i plugin sensibili al contesto. Un canale può nascondere o esporre
azioni message in base all'account attivo, alla stanza/thread/message corrente o
all'identità trusted del richiedente senza codificare rami specifici del canale nello
strumento `message` del core.

Questo è il motivo per cui le modifiche di instradamento dell'embedded-runner restano lavoro del plugin: il runner è
responsabile di inoltrare l'identità della chat/sessione corrente al confine di rilevamento del plugin così che lo strumento condiviso `message` esponga la superficie gestita dal canale corretta per il turno corrente.

Per gli helper di esecuzione gestiti dal canale, i plugin inclusi dovrebbero mantenere il runtime di esecuzione
dentro i propri moduli di estensione. Il core non gestisce più i runtime di azione message di Discord,
Slack, Telegram o WhatsApp sotto `src/agents/tools`.
Non pubblichiamo sotto-percorsi separati `plugin-sdk/*-action-runtime`, e i plugin inclusi
dovrebbero importare direttamente il proprio codice runtime locale dai propri moduli gestiti dall'estensione.

Lo stesso confine si applica in generale alle seam SDK denominate per provider: il core non
dovrebbe importare barrel di convenienza specifici del canale per estensioni come Slack, Discord, Signal,
WhatsApp o simili. Se il core ha bisogno di un comportamento, deve o consumare il barrel
`api.ts` / `runtime-api.ts` del plugin incluso stesso oppure promuovere l'esigenza in una capacità generica ristretta nell'SDK condiviso.

Per i sondaggi in particolare, ci sono due percorsi di esecuzione:

- `outbound.sendPoll` è la baseline condivisa per i canali che rientrano nel modello comune di
  sondaggio
- `actions.handleAction("poll")` è il percorso preferito per semantiche di sondaggio specifiche del canale o parametri di sondaggio extra

Il core ora rimanda il parsing condiviso dei sondaggi fino a dopo che il dispatch del sondaggio del plugin rifiuta
l'azione, così gli handler di sondaggio gestiti dal plugin possono accettare campi di sondaggio specifici del canale senza essere bloccati prima dal parser generico del sondaggio.

Vedi [Pipeline di caricamento](#load-pipeline) per la sequenza completa di avvio.

## Modello di ownership delle capacità

OpenClaw tratta un plugin nativo come confine di ownership per un'**azienda** o una
**funzionalità**, non come un contenitore eterogeneo di integrazioni non correlate.

Questo significa:

- un plugin aziendale dovrebbe normalmente gestire tutte le superfici OpenClaw-facing
  di quell'azienda
- un plugin funzionalità dovrebbe normalmente gestire l'intera superficie della funzionalità che introduce
- i canali dovrebbero consumare capacità condivise del core invece di reimplementare in modo ad hoc il comportamento del provider

Esempi:

- il plugin `openai` incluso gestisce il comportamento del provider OpenAI e il comportamento OpenAI di voce + realtime-voice + comprensione multimediale + generazione immagini
- il plugin `elevenlabs` incluso gestisce il comportamento di voce ElevenLabs
- il plugin `microsoft` incluso gestisce il comportamento di voce Microsoft
- il plugin `google` incluso gestisce il comportamento del provider di modelli Google più il comportamento Google di comprensione multimediale + generazione immagini + ricerca web
- il plugin `firecrawl` incluso gestisce il comportamento di recupero web Firecrawl
- i plugin `minimax`, `mistral`, `moonshot` e `zai` inclusi gestiscono i loro
  backend di comprensione multimediale
- il plugin `qwen` incluso gestisce il comportamento del provider testuale Qwen più
  il comportamento di comprensione multimediale e generazione video
- il plugin `voice-call` è un plugin funzionalità: gestisce transport di chiamata, strumenti,
  CLI, route e bridging Twilio media-stream, ma consuma capacità condivise di voce
  più trascrizione realtime e realtime-voice invece di importare direttamente i plugin vendor

Lo stato finale previsto è:

- OpenAI vive in un unico plugin anche se copre modelli testuali, voce, immagini e
  futuri video
- un altro vendor può fare lo stesso per la propria area di superficie
- i canali non si preoccupano di quale plugin vendor gestisce il provider; consumano il
  contratto di capacità condiviso esposto dal core

Questa è la distinzione chiave:

- **plugin** = confine di ownership
- **capability** = contratto del core che più plugin possono implementare o consumare

Quindi, se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è
"quale provider dovrebbe codificare rigidamente la gestione del video?" La prima domanda è "qual è
il contratto di capacità video del core?" Una volta che quel contratto esiste, i plugin vendor
possono registrarsi rispetto a esso e i plugin canale/funzionalità possono consumarlo.

Se la capacità non esiste ancora, la mossa giusta di solito è:

1. definire la capacità mancante nel core
2. esporla tramite l'API/runtime del plugin in modo tipizzato
3. collegare canali/funzionalità a quella capacità
4. lasciare che i plugin vendor registrino le implementazioni

Questo mantiene esplicita l'ownership evitando al contempo comportamento del core che dipenda da un
singolo vendor o da un percorso di codice specifico di un plugin una tantum.

### Stratificazione delle capacità

Usa questo modello mentale quando decidi dove deve stare il codice:

- **livello capacità del core**: orchestrazione condivisa, policy, fallback, regole di merge della configurazione, semantica di consegna e contratti tipizzati
- **livello plugin vendor**: API specifiche del vendor, auth, cataloghi modelli, sintesi vocale,
  generazione immagini, futuri backend video, endpoint di utilizzo
- **livello plugin canale/funzionalità**: integrazione Slack/Discord/voice-call/ecc.
  che consuma capacità del core e le presenta su una superficie

Per esempio, il TTS segue questa forma:

- il core gestisce policy TTS al momento della risposta, ordine di fallback, preferenze e consegna sul canale
- `openai`, `elevenlabs` e `microsoft` gestiscono le implementazioni di sintesi
- `voice-call` consuma l'helper runtime TTS per la telefonia

Lo stesso schema dovrebbe essere preferito per le capacità future.

### Esempio di plugin aziendale multi-capacità

Un plugin aziendale dovrebbe risultare coeso dall'esterno. Se OpenClaw ha contratti condivisi
per modelli, voce, trascrizione realtime, realtime voice, comprensione multimediale,
generazione immagini, generazione video, recupero web e ricerca web,
un vendor può gestire tutte le proprie superfici in un unico posto:

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
        // logica credenziali + fetch
      }),
    );
  },
};

export default plugin;
```

Ciò che conta non sono i nomi esatti degli helper. Conta la forma:

- un plugin gestisce la superficie del vendor
- il core continua a gestire i contratti di capacità
- i canali e i plugin funzionalità consumano helper `api.runtime.*`, non codice vendor
- i test di contratto possono verificare che il plugin abbia registrato le capacità che
  dichiara di gestire

### Esempio di capacità: comprensione video

OpenClaw tratta già la comprensione di immagini/audio/video come un'unica
capacità condivisa. Lo stesso modello di ownership si applica anche qui:

1. il core definisce il contratto di comprensione multimediale
2. i plugin vendor registrano `describeImage`, `transcribeAudio` e
   `describeVideo` secondo i casi
3. i canali e i plugin funzionalità consumano il comportamento condiviso del core invece di
   collegarsi direttamente al codice vendor

Questo evita di incorporare nel core le assunzioni video di un singolo provider. Il plugin gestisce
la superficie vendor; il core gestisce il contratto di capacità e il comportamento di fallback.

La generazione video usa già la stessa sequenza: il core gestisce il contratto di
capacità tipizzato e l'helper runtime, e i plugin vendor registrano
implementazioni `api.registerVideoGenerationProvider(...)` rispetto a esso.

Ti serve una checklist concreta di rollout? Vedi
[Capability Cookbook](/it/plugins/architecture).

## Contratti e applicazione

La superficie API dei plugin è intenzionalmente tipizzata e centralizzata in
`OpenClawPluginApi`. Questo contratto definisce i punti di registrazione supportati e
gli helper runtime su cui un plugin può fare affidamento.

Perché è importante:

- gli autori di plugin ottengono un unico standard interno stabile
- il core può rifiutare ownership duplicate, ad esempio due plugin che registrano lo stesso
  ID provider
- l'avvio può mostrare diagnostiche utili per registrazioni non valide
- i test di contratto possono applicare l'ownership dei plugin inclusi e prevenire derive silenziose

Ci sono due livelli di applicazione:

1. **applicazione della registrazione runtime**
   Il registro dei plugin valida le registrazioni mentre i plugin vengono caricati. Esempi:
   ID provider duplicati, ID provider voce duplicati e registrazioni
   non valide producono diagnostiche dei plugin invece di comportamento indefinito.
2. **test di contratto**
   I plugin inclusi vengono acquisiti nei registri di contratto durante le esecuzioni di test così
   OpenClaw può verificare esplicitamente l'ownership. Oggi questo è usato per
   provider di modelli, provider voce, provider di ricerca web e ownership di registrazione inclusa.

L'effetto pratico è che OpenClaw sa in anticipo quale plugin gestisce quale
superficie. Questo permette al core e ai canali di comporsi senza attrito perché l'ownership è
dichiarata, tipizzata e testabile invece che implicita.

### Cosa appartiene a un contratto

I buoni contratti dei plugin sono:

- tipizzati
- piccoli
- specifici per capacità
- gestiti dal core
- riutilizzabili da più plugin
- consumabili da canali/funzionalità senza conoscenza del vendor

I cattivi contratti dei plugin sono:

- policy specifiche del vendor nascoste nel core
- escape hatch una tantum per plugin che aggirano il registro
- codice di canale che accede direttamente a un'implementazione vendor
- oggetti runtime ad hoc che non fanno parte di `OpenClawPluginApi` o
  `api.runtime`

In caso di dubbio, alza il livello di astrazione: definisci prima la capacità, poi
lascia che i plugin vi si colleghino.

## Modello di esecuzione

I plugin OpenClaw nativi vengono eseguiti **in-process** con il Gateway. Non sono
sandboxati. Un plugin nativo caricato ha lo stesso confine di fiducia a livello di processo del codice core.

Implicazioni:

- un plugin nativo può registrare strumenti, handler di rete, hook e servizi
- un bug in un plugin nativo può mandare in crash o destabilizzare il gateway
- un plugin nativo malevolo equivale a esecuzione arbitraria di codice dentro il processo OpenClaw

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw attualmente li tratta
come pacchetti di metadati/contenuto. Nelle versioni attuali, questo significa soprattutto
Skills inclusi.

Usa allowlist e percorsi espliciti di installazione/caricamento per i plugin non inclusi. Tratta
i plugin workspace come codice di sviluppo, non come predefiniti di produzione.

Per i nomi dei pacchetti workspace inclusi, mantieni l'ID plugin ancorato al nome npm:
`@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando
il pacchetto espone intenzionalmente un ruolo di plugin più ristretto.

Nota importante sulla fiducia:

- `plugins.allow` si fida degli **ID plugin**, non della provenienza della sorgente.
- Un plugin workspace con lo stesso ID di un plugin incluso ombreggia intenzionalmente
  la copia inclusa quando quel plugin workspace è abilitato/in allowlist.
- Questo è normale e utile per sviluppo locale, test di patch e hotfix.

## Confine di esportazione

OpenClaw esporta capacità, non comodità di implementazione.

Mantieni pubblica la registrazione delle capacità. Riduci le esportazioni helper non contrattuali:

- sotto-percorsi specifici dei plugin inclusi
- sotto-percorsi di plumbing runtime non destinati come API pubblica
- helper di convenienza specifici del vendor
- helper di configurazione/onboarding che sono dettagli di implementazione

Alcuni sotto-percorsi helper dei plugin inclusi restano ancora nella mappa di esportazione SDK generata per compatibilità e manutenzione dei plugin inclusi. Esempi attuali includono
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e diverse seam `plugin-sdk/matrix*`. Trattali come
esportazioni riservate di dettaglio implementativo, non come schema SDK consigliato per
nuovi plugin di terze parti.

## Pipeline di caricamento

All'avvio, OpenClaw fa approssimativamente questo:

1. rileva le root dei plugin candidati
2. legge i manifest nativi o dei bundle compatibili e i metadati dei pacchetti
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ogni candidato
6. carica i moduli nativi abilitati tramite jiti
7. chiama gli hook nativi `register(api)` (o `activate(api)` — alias legacy) e raccoglie le registrazioni nel registro dei plugin
8. espone il registro alle superfici di comando/runtime

<Note>
`activate` è un alias legacy di `register` — il loader risolve quale dei due è presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin inclusi usano `register`; per i nuovi plugin preferisci `register`.
</Note>

I gate di sicurezza avvengono **prima** dell'esecuzione runtime. I candidati vengono bloccati
quando l'entry esce dalla root del plugin, il percorso è scrivibile da chiunque, oppure la
proprietà del percorso appare sospetta per plugin non inclusi.

### Comportamento manifest-first

Il manifest è la fonte di verità del control plane. OpenClaw lo usa per:

- identificare il plugin
- rilevare canali/Skills/schema di configurazione dichiarati o capacità del bundle
- validare `plugins.entries.<id>.config`
- arricchire etichette/segnaposto della UI di controllo
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e configurazione senza caricare il runtime del plugin

Per i plugin nativi, il modulo runtime è la parte data-plane. Registra
il comportamento effettivo come hook, strumenti, comandi o flussi provider.

I blocchi opzionali `activation` e `setup` del manifest restano sul control plane.
Sono descrittori solo metadati per la pianificazione dell'attivazione e il rilevamento della configurazione;
non sostituiscono la registrazione runtime, `register(...)` o `setupEntry`.
I primi consumer di attivazione live ora usano hint di comando, canale e provider del manifest
per restringere il caricamento dei plugin prima di una materializzazione più ampia del registro:

- il caricamento CLI si restringe ai plugin che gestiscono il comando primario richiesto
- la configurazione del canale / la risoluzione del plugin si restringono ai plugin che gestiscono l'ID canale richiesto
- la configurazione esplicita del provider / la risoluzione runtime si restringono ai plugin che gestiscono l'ID provider richiesto

Il rilevamento della configurazione ora preferisce ID gestiti dal descrittore come `setup.providers` e
`setup.cliBackends` per restringere i plugin candidati prima di usare come fallback
`setup-api` per i plugin che hanno ancora bisogno di hook runtime in fase di configurazione. Se più
plugin rilevati dichiarano lo stesso ID normalizzato di provider o backend CLI per la configurazione,
la ricerca della configurazione rifiuta il proprietario ambiguo invece di fare affidamento sull'ordine di rilevamento.

### Cosa memorizza in cache il loader

OpenClaw mantiene brevi cache in-process per:

- risultati del rilevamento
- dati del registro dei manifest
- registri dei plugin caricati

Queste cache riducono avvii bursty e overhead dei comandi ripetuti. È corretto
considerarle come cache prestazionali di breve durata, non come persistenza.

Nota sulle prestazioni:

- Imposta `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oppure
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` per disabilitare queste cache.
- Regola le finestre di cache con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modello del registro

I plugin caricati non mutano direttamente globali casuali del core. Si registrano in un
registro centrale dei plugin.

Il registro traccia:

- record dei plugin (identità, origine, provenienza, stato, diagnostiche)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- handler RPC del Gateway
- route HTTP
- registrar CLI
- servizi in background
- comandi gestiti dal plugin

Le funzionalità del core poi leggono da quel registro invece di parlare direttamente con i moduli plugin.
Questo mantiene il caricamento unidirezionale:

- modulo plugin -> registrazione nel registro
- runtime del core -> consumo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici del core ha bisogno di un solo punto di integrazione: "leggere il registro", non "gestire con casi speciali ogni modulo plugin".

## Callback di binding della conversazione

I plugin che associano una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere una callback dopo che una richiesta di binding è stata approvata o negata:

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
- `request`: il riepilogo della richiesta originale, hint di detach, sender id e
  metadati della conversazione

Questa callback è solo di notifica. Non cambia chi è autorizzato ad associare una
conversazione, e viene eseguita dopo il completamento della gestione dell'approvazione da parte del core.

## Hook runtime del provider

I Plugin provider ora hanno due livelli:

- metadati del manifest: `providerAuthEnvVars` per lookup economico dell'auth provider via env
  prima del caricamento runtime, `providerAuthAliases` per varianti provider che condividono
  auth, `channelEnvVars` per lookup economico di env/setup del canale prima del caricamento runtime,
  più `providerAuthChoices` per etichette economiche di onboarding/scelta auth e
  metadati dei flag CLI prima del caricamento runtime
- hook in fase di configurazione: `catalog` / legacy `discovery` più `applyConfigDefaults`
- hook runtime: `normalizeModelId`, `normalizeTransport`,
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw continua a gestire il loop generico dell'agente, il failover, la gestione del transcript e
la policy degli strumenti. Questi hook sono la superficie di estensione per il comportamento specifico del provider senza
richiedere un intero transport di inferenza personalizzato.

Usa il manifest `providerAuthEnvVars` quando il provider ha credenziali basate su env
che i percorsi generici auth/status/model-picker devono vedere senza caricare il runtime del plugin.
Usa il manifest `providerAuthAliases` quando un ID provider deve riutilizzare
le variabili env, i profili auth, l'auth basata su configurazione e la scelta di onboarding con chiave API di un altro ID provider. Usa il manifest `providerAuthChoices` quando le
superfici CLI di onboarding/scelta auth devono conoscere choice id del provider, etichette di gruppo e semplice wiring auth a flag singolo senza caricare il runtime del provider. Mantieni le `envVars` del runtime del provider per hint rivolti all'operatore come etichette di onboarding o variabili di configurazione OAuth
client-id/client-secret.

Usa il manifest `channelEnvVars` quando un canale ha auth o setup guidati da env che
il fallback generico shell-env, i controlli config/status o i prompt di setup devono vedere
senza caricare il runtime del canale.

### Ordine e utilizzo degli hook

Per i plugin modello/provider, OpenClaw chiama gli hook approssimativamente in questo ordine.
La colonna "Quando usarlo" è la guida rapida alla decisione.

| #   | Hook                              | Cosa fa                                                                                                        | Quando usarlo                                                                                                                              |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`         | Il provider gestisce un catalogo o valori predefiniti dell'URL di base                                                                   |
| 2   | `applyConfigDefaults`             | Applica valori predefiniti globali gestiti dal provider durante la materializzazione della configurazione      | I valori predefiniti dipendono da modalità auth, env o semantica della famiglia di modelli del provider                                 |
| --  | _(built-in model lookup)_         | OpenClaw prova prima il normale percorso di registro/catalogo                                                  | _(non è un hook del plugin)_                                                                                                             |
| 3   | `normalizeModelId`                | Normalizza alias legacy o preview dell'ID modello prima della ricerca                                          | Il provider gestisce la pulizia degli alias prima della risoluzione canonica del modello                                                |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia provider prima dell'assemblaggio generico del modello             | Il provider gestisce la pulizia del transport per ID provider personalizzati nella stessa famiglia di transport                         |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione runtime/provider                                    | Il provider ha bisogno di una pulizia della configurazione che dovrebbe stare nel plugin; gli helper Google-family inclusi fanno anche da backstop per le voci di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità dell'uso dello streaming nativo ai provider di configurazione            | Il provider ha bisogno di correzioni dei metadati di utilizzo dello streaming nativo guidate dall'endpoint                             |
| 7   | `resolveConfigApiKey`             | Risolve l'auth con marker env per i provider di configurazione prima del caricamento dell'auth runtime        | Il provider ha una risoluzione della chiave API con marker env gestita dal provider; `amazon-bedrock` ha anche qui un resolver integrato per marker env AWS |
| 8   | `resolveSyntheticAuth`            | Espone auth locale/self-hosted o basata su configurazione senza persistere testo in chiaro                    | Il provider può operare con un marker di credenziale sintetica/locale                                                                    |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili auth esterni gestiti dal provider; `persistence` predefinito è `runtime-only` per credenziali gestite da CLI/app | Il provider riusa credenziali auth esterne senza persistere token di refresh copiati                                                   |
| 10  | `shouldDeferSyntheticProfileAuth` | Porta i placeholder dei profili sintetici memorizzati dietro l'auth basata su env/config                      | Il provider memorizza profili placeholder sintetici che non dovrebbero avere precedenza                                                 |
| 11  | `resolveDynamicModel`             | Fallback sincrono per ID modello gestiti dal provider non ancora presenti nel registro locale                 | Il provider accetta ID modello upstream arbitrari                                                                                        |
| 12  | `prepareDynamicModel`             | Warm-up asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                           | Il provider ha bisogno di metadati di rete prima di risolvere ID sconosciuti                                                            |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che il runner integrato usi il modello risolto                                        | Il provider ha bisogno di riscritture del transport ma usa comunque un transport del core                                               |
| 14  | `contributeResolvedModelCompat`   | Contribuisce flag di compatibilità per modelli vendor dietro un altro transport compatibile                   | Il provider riconosce i propri modelli su transport proxy senza assumere il controllo del provider                                      |
| 15  | `capabilities`                    | Metadati di transcript/tooling gestiti dal provider usati dalla logica condivisa del core                     | Il provider ha bisogno di particolarità di transcript/famiglia provider                                                                  |
| 16  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che il runner integrato li veda                                    | Il provider ha bisogno di una pulizia degli schemi della famiglia di transport                                                           |
| 17  | `inspectToolSchemas`              | Espone diagnostiche degli schemi gestite dal provider dopo la normalizzazione                                  | Il provider vuole avvisi sulle keyword senza insegnare al core regole specifiche del provider                                           |
| 18  | `resolveReasoningOutputMode`      | Seleziona contratto di output del reasoning nativo vs con tag                                                  | Il provider ha bisogno di output reasoning/finale con tag invece che di campi nativi                                                    |
| 19  | `prepareExtraParams`              | Normalizzazione dei parametri di richiesta prima dei wrapper generici delle opzioni di stream                  | Il provider ha bisogno di parametri di richiesta predefiniti o di pulizia dei parametri per provider                                    |
| 20  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un transport personalizzato                        | Il provider ha bisogno di un protocollo wire personalizzato, non solo di un wrapper                                                     |
| 21  | `wrapStreamFn`                    | Wrapper dello stream dopo l'applicazione dei wrapper generici                                                  | Il provider ha bisogno di wrapper di compatibilità per header/body/modello della richiesta senza un transport personalizzato            |
| 22  | `resolveTransportTurnState`       | Allega header o metadati nativi del transport per turno                                                        | Il provider vuole che i transport generici inviino identità di turno native del provider                                                |
| 23  | `resolveWebSocketSessionPolicy`   | Allega header WebSocket nativi o una policy di cool-down della sessione                                        | Il provider vuole che i transport WS generici regolino header di sessione o policy di fallback                                          |
| 24  | `formatApiKey`                    | Formatter del profilo auth: il profilo memorizzato diventa la stringa runtime `apiKey`                        | Il provider memorizza metadati auth extra e ha bisogno di una forma personalizzata del token runtime                                    |
| 25  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o policy di errore del refresh              | Il provider non rientra nei refresher condivisi `pi-ai`                                                                                  |
| 26  | `buildAuthDoctorHint`             | Suggerimento di riparazione aggiunto quando il refresh OAuth fallisce                                          | Il provider ha bisogno di indicazioni di riparazione auth gestite dal provider dopo il fallimento del refresh                           |
| 27  | `matchesContextOverflowError`     | Matcher di overflow della finestra di contesto gestito dal provider                                            | Il provider ha errori raw di overflow che le euristiche generiche non rileverebbero                                                     |
| 28  | `classifyFailoverReason`          | Classificazione del motivo di failover gestita dal provider                                                    | Il provider può mappare errori raw API/transport a rate limit/overload/ecc.                                                             |
| 29  | `isCacheTtlEligible`              | Policy della prompt-cache per provider proxy/backhaul                                                          | Il provider ha bisogno di gating TTL della cache specifico per proxy                                                                     |
| 30  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero auth mancante                                                  | Il provider ha bisogno di un suggerimento di recupero auth mancante specifico del provider                                              |
| 31  | `suppressBuiltInModel`            | Soppressione dei modelli upstream obsoleti più eventuale suggerimento d'errore visibile all'utente            | Il provider ha bisogno di nascondere righe upstream obsolete o sostituirle con un suggerimento del vendor                              |
| 32  | `augmentModelCatalog`             | Righe di catalogo sintetiche/finali aggiunte dopo il rilevamento                                               | Il provider ha bisogno di righe sintetiche forward-compat in `models list` e nei selettori                                              |
| 33  | `resolveThinkingProfile`          | Insieme dei livelli `/think` specifici del modello, etichette di visualizzazione e valore predefinito         | Il provider espone una scala thinking personalizzata o un'etichetta binaria per modelli selezionati                                     |
| 34  | `isBinaryThinking`                | Hook di compatibilità per il toggle reasoning on/off                                                           | Il provider espone solo thinking binario on/off                                                                                          |
| 35  | `supportsXHighThinking`           | Hook di compatibilità per il supporto reasoning `xhigh`                                                        | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                             |
| 36  | `resolveDefaultThinkingLevel`     | Hook di compatibilità per il livello `/think` predefinito                                                      | Il provider gestisce la policy predefinita `/think` per una famiglia di modelli                                                         |
| 37  | `isModernModelRef`                | Matcher modern-model per filtri di profilo live e selezione smoke                                              | Il provider gestisce la corrispondenza del modello preferito live/smoke                                                                  |
| 38  | `prepareRuntimeAuth`              | Scambia una credenziale configurata con il token/chiave runtime effettivo subito prima dell'inferenza         | Il provider ha bisogno di uno scambio di token o di una credenziale di richiesta a breve durata                                           |
| 39  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e superfici di stato correlate                    | Il provider ha bisogno di parsing personalizzato del token di utilizzo/quota o di una credenziale di utilizzo diversa                    |
| 40  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot di utilizzo/quota specifici del provider dopo che l'auth è stata risolta       | Il provider ha bisogno di un endpoint di utilizzo specifico del provider o di un parser del payload                                       |
| 41  | `createEmbeddingProvider`         | Costruisce un adattatore di embedding gestito dal provider per memoria/ricerca                                 | Il comportamento degli embedding di memoria appartiene al plugin provider                                                                  |
| 42  | `buildReplayPolicy`               | Restituisce una replay policy che controlla la gestione del transcript per il provider                         | Il provider ha bisogno di una policy del transcript personalizzata (ad esempio, rimozione dei blocchi thinking)                          |
| 43  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica del transcript                                       | Il provider ha bisogno di riscritture di replay specifiche del provider oltre agli helper condivisi di Compaction                        |
| 44  | `validateReplayTurns`             | Validazione o rimodellazione finale dei turni di replay prima del runner integrato                             | Il transport del provider ha bisogno di una validazione più rigorosa dei turni dopo la sanitizzazione generica                           |
| 45  | `onModelSelected`                 | Esegue effetti collaterali post-selezione gestiti dal provider                                                 | Il provider ha bisogno di telemetria o di stato gestito dal provider quando un modello diventa attivo                                    |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
plugin provider corrispondente, poi passano agli altri Plugin provider capaci di usare hook
finché uno non cambia davvero l'ID modello o il transport/config. Questo mantiene
funzionanti gli shim alias/compat del provider senza richiedere al chiamante di sapere quale
plugin incluso gestisce la riscrittura. Se nessun hook provider riscrive una voce di configurazione
Google-family supportata, il normalizzatore di configurazione Google incluso applica comunque
quella pulizia di compatibilità.

Se il provider ha bisogno di un protocollo wire completamente personalizzato o di un esecutore di richieste personalizzato,
si tratta di una classe diversa di estensione. Questi hook sono per comportamento del provider
che continua comunque a girare sul normale ciclo di inferenza di OpenClaw.

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

### Esempi inclusi

- Anthropic usa `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`,
  e `wrapStreamFn` perché gestisce la forward-compat di Claude 4.6,
  hint della famiglia provider, indicazioni di riparazione auth, integrazione
  dell'endpoint di utilizzo, idoneità della prompt-cache, valori predefiniti di configurazione consapevoli dell'auth, policy di thinking predefinita/adattiva di Claude e modellazione specifica di Anthropic per lo stream relativa a
  header beta, `/fast` / `serviceTier` e `context1m`.
- Gli helper di stream Claude-specifici di Anthropic restano per ora nella seam
  pubblica `api.ts` / `contract-api.ts` del plugin incluso stesso. Questa superficie del pacchetto
  esporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i builder wrapper Anthropic di livello inferiore invece di allargare l'SDK generico attorno alle regole di beta-header di un singolo provider.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities` più `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` e `isModernModelRef`
  perché gestisce la forward-compat GPT-5.4, la normalizzazione diretta OpenAI
  `openai-completions` -> `openai-responses`, hint auth mancanti consapevoli di Codex,
  soppressione di Spark, righe sintetiche della lista OpenAI e policy di thinking /
  live-model di GPT-5; la famiglia stream `openai-responses-defaults` gestisce i
  wrapper condivisi nativi di OpenAI Responses per header di attribuzione,
  `/fast`/`serviceTier`, verbosità del testo, ricerca web Codex nativa,
  modellazione del payload di compatibilità reasoning e gestione del contesto di Responses.
- OpenRouter usa `catalog` più `resolveDynamicModel` e
  `prepareDynamicModel` perché il provider è pass-through e può esporre nuovi
  ID modello prima dell'aggiornamento del catalogo statico di OpenClaw; usa anche
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` per tenere
  fuori dal core header di richiesta specifici del provider, metadati di routing, patch di reasoning e
  policy della prompt-cache. La sua replay policy proviene dalla
  famiglia `passthrough-gemini`, mentre la famiglia stream `openrouter-thinking`
  gestisce l'iniezione del reasoning proxy e gli skip di modello non supportato / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities` più `prepareRuntimeAuth` e `fetchUsageSnapshot` perché ha
  bisogno di login del dispositivo gestito dal provider, comportamento di fallback del modello, particolarità del transcript Claude,
  scambio token GitHub -> token Copilot e un endpoint di utilizzo gestito dal provider.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog` più
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot` perché
  gira ancora sui transport OpenAI del core ma gestisce la propria normalizzazione del transport/base URL,
  la policy di fallback del refresh OAuth, la scelta predefinita del transport,
  righe sintetiche del catalogo Codex e l'integrazione con l'endpoint di utilizzo ChatGPT; condivide la stessa famiglia stream `openai-responses-defaults` di OpenAI diretto.
- Google AI Studio e Gemini CLI OAuth usano `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` perché la
  famiglia replay `google-gemini` gestisce fallback forward-compat Gemini 3.1,
  validazione replay Gemini nativa, sanitizzazione replay di bootstrap, modalità
  di output del reasoning con tag e corrispondenza modern-model, mentre la
  famiglia stream `google-thinking` gestisce la normalizzazione del payload di thinking Gemini;
  inoltre Gemini CLI OAuth usa `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` per formattazione del token, parsing del token e wiring
  dell'endpoint quota.
- Anthropic Vertex usa `buildReplayPolicy` tramite la
  famiglia replay `anthropic-by-model` così la pulizia replay Claude-specifica resta
  limitata agli ID Claude invece che a ogni transport `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveThinkingProfile` perché gestisce
  classificazione degli errori di throttling/not-ready/context-overflow specifici di Bedrock
  per il traffico Anthropic-on-Bedrock; la sua replay policy condivide comunque lo stesso
  guard solo-Claude `anthropic-by-model`.
- OpenRouter, Kilocode, Opencode e Opencode Go usano `buildReplayPolicy`
  tramite la famiglia replay `passthrough-gemini` perché fanno da proxy ai modelli Gemini
  attraverso transport compatibili OpenAI e hanno bisogno di
  sanitizzazione della thought-signature Gemini senza validazione replay Gemini nativa o
  riscritture bootstrap.
- MiniMax usa `buildReplayPolicy` tramite la
  famiglia replay `hybrid-anthropic-openai` perché un provider gestisce sia
  semantiche Anthropic-message sia semantiche OpenAI-compatible; mantiene
  la rimozione dei blocchi thinking solo-Claude sul lato Anthropic mentre riporta la modalità
  di output del reasoning a quella nativa, e la famiglia stream `minimax-fast-mode` gestisce
  le riscritture del modello fast-mode sul percorso stream condiviso.
- Moonshot usa `catalog`, `resolveThinkingProfile` e `wrapStreamFn` perché usa ancora il
  transport OpenAI condiviso ma ha bisogno di normalizzazione del payload di thinking gestita dal provider; la
  famiglia stream `moonshot-thinking` mappa configurazione più stato `/think` sul suo
  payload thinking binario nativo.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` perché ha bisogno di header di richiesta gestiti dal provider,
  normalizzazione del payload reasoning, hint del transcript Gemini e gating
  cache-TTL Anthropic; la famiglia stream `kilocode-thinking` mantiene l'iniezione del thinking di Kilo
  sul percorso stream proxy condiviso saltando `kilo/auto` e altri
  ID modello proxy che non supportano payload reasoning espliciti.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot` perché gestisce fallback GLM-5,
  valori predefiniti `tool_stream`, UX thinking binaria, corrispondenza modern-model e sia
  auth di utilizzo sia recupero quota; la famiglia stream `tool-stream-default-on` mantiene
  il wrapper `tool_stream` attivo per impostazione predefinita fuori dalla colla scritta a mano per singolo provider.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  perché gestisce la normalizzazione del transport nativo xAI Responses, riscritture alias della modalità fast di Grok,
  `tool_stream` predefinito, pulizia rigorosa di schema strumenti / payload reasoning,
  riuso di fallback auth per strumenti gestiti dal plugin, risoluzione forward-compat dei modelli Grok
  e patch di compatibilità gestite dal provider come profilo di schema strumenti xAI,
  keyword di schema non supportate, `web_search` nativo e decodifica degli argomenti delle tool-call con entità HTML.
- Mistral, OpenCode Zen e OpenCode Go usano solo `capabilities` per tenere
  le particolarità di transcript/tooling fuori dal core.
- I provider inclusi solo-catalogo come `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine` usano
  solo `catalog`.
- Qwen usa `catalog` per il proprio provider testuale più registrazioni condivise di comprensione multimediale e
  generazione video per le sue superfici multimodali.
- MiniMax e Xiaomi usano `catalog` più hook di utilizzo perché il loro comportamento `/usage`
  è gestito dal plugin anche se l'inferenza continua a passare dai transport condivisi.

## Helper runtime

I plugin possono accedere a helper selezionati del core tramite `api.runtime`. Per TTS:

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
- Usa la configurazione e la selezione del provider `messages.tts` del core.
- Restituisce buffer audio PCM + sample rate. I plugin devono ricampionare/codificare per i provider.
- `listVoices` è facoltativo per provider. Usalo per selettori vocali o flussi di configurazione gestiti dal vendor.
- Gli elenchi di voci possono includere metadati più ricchi come lingua, genere e tag di personalità per selettori consapevoli del provider.
- Oggi OpenAI ed ElevenLabs supportano la telefonia. Microsoft no.

I plugin possono anche registrare provider voce tramite `api.registerSpeechProvider(...)`.

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

- Mantieni policy TTS, fallback e consegna della risposta nel core.
- Usa i provider voce per il comportamento di sintesi gestito dal vendor.
- L'input legacy Microsoft `edge` viene normalizzato nell'ID provider `microsoft`.
- Il modello di ownership preferito è orientato all'azienda: un plugin vendor può gestire
  provider testuali, vocali, immagini e futuri provider media man mano che OpenClaw aggiunge quei
  contratti di capacità.

Per la comprensione di immagini/audio/video, i plugin registrano un unico provider tipizzato di
comprensione multimediale invece di un generico contenitore chiave/valore:

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
- Mantieni il comportamento vendor nel plugin provider.
- L'espansione additiva dovrebbe restare tipizzata: nuovi metodi facoltativi, nuovi campi risultato facoltativi, nuove capacità facoltative.
- La generazione video segue già lo stesso schema:
  - il core gestisce il contratto di capacità e l'helper runtime
  - i plugin vendor registrano `api.registerVideoGenerationProvider(...)`
  - i plugin funzionalità/canale consumano `api.runtime.videoGeneration.*`

Per gli helper runtime di comprensione multimediale, i plugin possono chiamare:

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

Per la trascrizione audio, i plugin possono usare sia il runtime di comprensione multimediale
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
- Usa la configurazione audio di comprensione multimediale del core (`tools.media.audio`) e l'ordine di fallback del provider.
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
- OpenClaw rispetta questi campi di override solo per chiamanti trusted.
- Per esecuzioni di fallback gestite dal plugin, gli operatori devono abilitarle esplicitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i plugin trusted a target canonici specifici `provider/model`, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni subagent di plugin non trusted continuano a funzionare, ma le richieste di override vengono rifiutate invece di fare fallback silenzioso.

Per la ricerca web, i plugin possono consumare l'helper runtime condiviso invece di
entrare direttamente nel wiring dello strumento dell'agente:

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

- Mantieni nel core la selezione del provider, la risoluzione delle credenziali e la semantica condivisa della richiesta.
- Usa i provider di ricerca web per i transport di ricerca specifici del vendor.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per i plugin funzionalità/canale che hanno bisogno di comportamento di ricerca senza dipendere dal wrapper dello strumento dell'agente.

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

- `path`: percorso della route sotto il server HTTP del Gateway.
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale auth del Gateway, oppure `"plugin"` per auth/verifica webhook gestite dal plugin.
- `match`: facoltativo. `"exact"` (predefinito) o `"prefix"`.
- `replaceExisting`: facoltativo. Consente allo stesso plugin di sostituire una propria registrazione di route esistente.
- `handler`: restituisce `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei plugin devono dichiarare esplicitamente `auth`.
- I conflitti esatti `path + match` vengono rifiutati salvo `replaceExisting: true`, e un plugin non può sostituire la route di un altro plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni catene di fallthrough `exact`/`prefix` solo allo stesso livello auth.
- Le route `auth: "plugin"` **non** ricevono automaticamente gli scope runtime dell'operatore. Servono per webhook/verifica firma gestiti dal plugin, non per chiamate helper privilegiate del Gateway.
- Le route `auth: "gateway"` vengono eseguite dentro uno scope runtime di richiesta Gateway, ma questo scope è intenzionalmente conservativo:
  - l'auth bearer con secret condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli scope runtime delle route plugin bloccati a `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP trusted che portano identità (per esempio `trusted-proxy` o `gateway.auth.mode = "none"` su un ingress privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente in quelle richieste di route plugin con identità, lo scope runtime usa come fallback `operator.write`
- Regola pratica: non presumere che una route plugin autenticata dal gateway sia una superficie admin implicita. Se la tua route richiede comportamento solo admin, richiedi una modalità auth che porti identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di import del Plugin SDK

Usa i sotto-percorsi dell'SDK invece dell'import monolitico `openclaw/plugin-sdk` quando
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
  `openclaw/plugin-sdk/webhook-ingress` per wiring condiviso di setup/auth/reply/webhook.
  `channel-inbound` è la sede condivisa per debounce, matching delle menzioni,
  helper di mention-policy in ingresso, formattazione dell'envelope e helper del contesto dell'envelope in ingresso.
  `channel-setup` è la seam ristretta di configurazione per installazione facoltativa.
  `setup-runtime` è la superficie runtime-safe di configurazione usata da `setupEntry` /
  avvio differito, inclusi gli adattatori di patch di configurazione import-safe.
  `setup-adapter-runtime` è la seam dell'adattatore di configurazione dell'account consapevole dell'env.
  `setup-tools` è la piccola seam helper per CLI/archivio/documentazione (`formatCliCommand`,
  `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`,
  `CONFIG_DIR`).
- Sotto-percorsi di dominio come `openclaw/plugin-sdk/channel-config-helpers`,
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
  `openclaw/plugin-sdk/directory-runtime` per helper runtime/config condivisi.
  `telegram-command-config` è la seam pubblica ristretta per normalizzazione/validazione dei comandi personalizzati di Telegram e resta disponibile anche se la superficie contrattuale Telegram inclusa è temporaneamente non disponibile.
  `text-runtime` è la seam condivisa per testo/markdown/logging, inclusi
  stripping del testo visibile all'assistente, helper di render/chunking markdown, helper di redazione,
  helper di directive-tag e utility per testo sicuro.
- Le seam di canale specifiche dell'approvazione dovrebbero preferire un unico contratto `approvalCapability` sul plugin. Il core poi legge auth di approvazione, consegna, render,
  native-routing e comportamento lazy native-handler attraverso quell'unica capacità
  invece di mescolare il comportamento di approvazione in campi del plugin non correlati.
- `openclaw/plugin-sdk/channel-runtime` è deprecato e resta solo come shim di
  compatibilità per plugin più vecchi. Il nuovo codice dovrebbe importare invece le primitive generiche più ristrette, e il codice del repository non dovrebbe aggiungere nuovi import dello shim.
- Gli interni delle estensioni incluse restano privati. I plugin esterni dovrebbero usare solo i sotto-percorsi `openclaw/plugin-sdk/*`. Il codice core/test di OpenClaw può usare gli entry point pubblici del repository sotto la root del pacchetto plugin come `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e file a scope ristretto come
  `login-qr-api.js`. Non importare mai `src/*` di un pacchetto plugin dal core o da
  un'altra estensione.
- Suddivisione dei punti di ingresso del repository:
  `<plugin-package-root>/api.js` è il barrel helper/tipi,
  `<plugin-package-root>/runtime-api.js` è il barrel solo runtime,
  `<plugin-package-root>/index.js` è il punto di ingresso del plugin incluso
  e `<plugin-package-root>/setup-entry.js` è il punto di ingresso del plugin di configurazione.
- Esempi attuali di provider inclusi:
  - Anthropic usa `api.js` / `contract-api.js` per helper di stream Claude come
    `wrapAnthropicProviderStream`, helper beta-header e parsing di `service_tier`.
  - OpenAI usa `api.js` per builder provider, helper del modello predefinito e
    builder provider realtime.
  - OpenRouter usa `api.js` per il proprio builder provider più helper di onboarding/configurazione, mentre `register.runtime.js` può ancora riesportare helper generici `plugin-sdk/provider-stream` per uso locale del repository.
- I punti di ingresso pubblici caricati tramite facade preferiscono lo snapshot di configurazione runtime attivo
  quando esiste, poi usano come fallback il file di configurazione risolto su disco quando
  OpenClaw non sta ancora servendo uno snapshot runtime.
- Le primitive generiche condivise restano il contratto pubblico preferito dell'SDK. Esiste ancora un piccolo insieme riservato di seam helper con branding di canale incluse per compatibilità. Trattale come seam di manutenzione/compatibilità dei bundle, non come nuovi target di import per terze parti; i nuovi contratti cross-channel dovrebbero comunque arrivare sui sotto-percorsi generici `plugin-sdk/*` o sui barrel locali del plugin `api.js` /
  `runtime-api.js`.

Nota di compatibilità:

- Evita il barrel root `openclaw/plugin-sdk` nel nuovo codice.
- Preferisci prima le primitive stabili più ristrette. I sotto-percorsi più recenti di setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool sono il contratto previsto per nuovo lavoro
  su plugin inclusi ed esterni.
  Il parsing/matching del target appartiene a `openclaw/plugin-sdk/channel-targets`.
  I gate delle azioni message e gli helper degli ID messaggio per le reazioni appartengono a
  `openclaw/plugin-sdk/channel-actions`.
- I barrel helper specifici delle estensioni incluse non sono stabili per impostazione predefinita. Se un
  helper serve solo a un'estensione inclusa, mantienilo dietro la seam locale
  `api.js` o `runtime-api.js` dell'estensione invece di promuoverlo in
  `openclaw/plugin-sdk/<extension>`.
- Le nuove seam helper condivise dovrebbero essere generiche, non con branding di canale. Il parsing
  condiviso dei target appartiene a `openclaw/plugin-sdk/channel-targets`; gli interni specifici del canale
  restano dietro la seam locale `api.js` o `runtime-api.js` del plugin proprietario.
- I sotto-percorsi specifici della capacità come `image-generation`,
  `media-understanding` e `speech` esistono perché i plugin inclusi/nativi li usano
  oggi. La loro presenza non significa di per sé che ogni helper esportato sia un
  contratto esterno congelato a lungo termine.

## Schemi dello strumento message

I plugin dovrebbero gestire i contributi allo schema `describeMessageTool(...)` specifici del canale
per primitive non-message come reazioni, letture e sondaggi.
L'invio condiviso delle presentazioni dovrebbe usare il contratto generico `MessagePresentation`
invece di campi nativi del provider come button, component, block o card.
Vedi [Message Presentation](/it/plugins/message-presentation) per il contratto,
le regole di fallback, la mappatura dei provider e la checklist per autori di plugin.

I plugin in grado di inviare dichiarano cosa possono renderizzare tramite le capacità message:

- `presentation` per blocchi di presentazione semantica (`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin` per richieste di consegna pinnata

Il core decide se renderizzare la presentazione in modo nativo o degradarla a testo.
Non esporre escape hatch UI native del provider dallo strumento message generico.
Gli helper SDK deprecati per schemi nativi legacy restano esportati per i
plugin di terze parti esistenti, ma i nuovi plugin non dovrebbero usarli.

## Risoluzione dei target del canale

I plugin canale dovrebbero gestire la semantica dei target specifica del canale. Mantieni generico
l'host condiviso in uscita e usa la superficie dell'adattatore di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  deve essere trattato come `direct`, `group` o `channel` prima della ricerca nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input deve saltare direttamente alla risoluzione in stile ID invece della ricerca nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del plugin quando
  il core ha bisogno di una risoluzione finale gestita dal provider dopo la normalizzazione o dopo un
  mancato risultato nella directory.
- `messaging.resolveOutboundSessionRoute(...)` gestisce la costruzione della route
  di sessione specifica del provider una volta risolto un target.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima
  di cercare peer/gruppi.
- Usa `looksLikeId` per controlli del tipo "tratta questo come ID target esplicito/nativo".
- Usa `resolveTarget` per fallback di normalizzazione specifico del provider, non per
  una ricerca ampia nella directory.
- Mantieni ID nativi del provider come chat id, thread id, JID, handle e room
  id dentro i valori `target` o parametri specifici del provider, non in campi SDK generici.

## Directory basate su configurazione

I plugin che derivano voci di directory dalla configurazione dovrebbero mantenere quella logica nel
plugin e riutilizzare gli helper condivisi di
`openclaw/plugin-sdk/directory-runtime`.

Usalo quando un canale ha bisogno di peer/gruppi basati su configurazione come:

- peer DM guidati da allowlist
- mappe configurate di canali/gruppi
- fallback statici della directory con scope account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtro delle query
- applicazione dei limiti
- helper di deduplica/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione dell'account specifica del canale e la normalizzazione dell'ID dovrebbero restare nell'implementazione del
plugin.

## Cataloghi provider

I Plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce provider
- `{ providers }` per più voci provider

Usa `catalog` quando il plugin gestisce ID modello specifici del provider, valori predefiniti dell'URL di base o metadati del modello protetti da auth.

`catalog.order` controlla quando il catalogo di un plugin viene unito rispetto ai provider impliciti integrati di OpenClaw:

- `simple`: provider semplici guidati da chiave API o env
- `profile`: provider che compaiono quando esistono profili auth
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo gli altri provider impliciti

I provider successivi vincono in caso di collisione della chiave, quindi i plugin possono
sovrascrivere intenzionalmente una voce provider integrata con lo stesso ID provider.

Compatibilità:

- `discovery` continua a funzionare come alias legacy
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione di canale in sola lettura

Se il tuo plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso runtime. Può assumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano i secret richiesti.
- I percorsi di comando in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi di doctor/riparazione
  della configurazione non dovrebbero avere bisogno di materializzare le credenziali runtime solo per
  descrivere la configurazione.

Comportamento consigliato di `inspectAccount(...)`:

- Restituisci solo stato descrittivo dell'account.
- Preserva `enabled` e `configured`.
- Includi campi di origine/stato delle credenziali quando rilevanti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire valori raw dei token solo per riportare la
  disponibilità in sola lettura. Restituire `tokenStatus: "available"` (e il campo di origine corrispondente) è sufficiente per i comandi in stile status.
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

Ogni voce diventa un plugin. Se il pack elenca più estensioni, l'ID plugin
diventa `name/<fileBase>`.

Se il tuo plugin importa dipendenze npm, installale in quella directory così
`node_modules` sarà disponibile (`npm install` / `pnpm install`).

Guardrail di sicurezza: ogni voce `openclaw.extensions` deve restare dentro la directory del plugin
dopo la risoluzione dei symlink. Le voci che escono dalla directory del pacchetto vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del plugin con
`npm install --omit=dev --ignore-scripts` (nessuno script lifecycle, nessuna dipendenza dev a runtime). Mantieni gli alberi delle dipendenze dei plugin "pure JS/TS" ed evita pacchetti che richiedono build `postinstall`.

Facoltativo: `openclaw.setupEntry` può puntare a un modulo leggero solo-setup.
Quando OpenClaw ha bisogno di superfici di configurazione per un plugin canale disabilitato, oppure
quando un plugin canale è abilitato ma ancora non configurato, carica `setupEntry`
invece del punto di ingresso completo del plugin. Questo rende avvio e configurazione più leggeri
quando il punto di ingresso principale del plugin collega anche strumenti, hook o altro codice solo runtime.

Facoltativo: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può far aderire un plugin canale allo stesso percorso `setupEntry` durante la fase
di avvio pre-listen del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere
prima che il gateway inizi ad ascoltare. In pratica, questo significa che il punto di ingresso di setup
deve registrare ogni capacità gestita dal canale da cui dipende l'avvio, come:

- la registrazione del canale stesso
- eventuali route HTTP che devono essere disponibili prima che il gateway inizi ad ascoltare
- eventuali metodi gateway, strumenti o servizi che devono esistere durante quella stessa finestra

Se il tuo punto di ingresso completo gestisce ancora una qualsiasi capacità di avvio richiesta, non abilitare
questo flag. Mantieni il plugin sul comportamento predefinito e lascia che OpenClaw carichi
il punto di ingresso completo durante l'avvio.

I canali inclusi possono anche pubblicare helper di superficie contrattuale solo-setup che il core
può consultare prima che il runtime completo del canale venga caricato. L'attuale superficie di promozione del setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando deve promuovere una configurazione legacy di canale single-account
in `channels.<id>.accounts.*` senza caricare il punto di ingresso completo del plugin.
Matrix è l'esempio incluso attuale: sposta solo chiavi auth/bootstrap in un
account promosso con nome quando esistono già account con nome, e può preservare una
chiave di account predefinita non canonica configurata invece di creare sempre
`accounts.default`.

Quegli adattatori di patch del setup mantengono lazy il rilevamento della superficie contrattuale inclusa. Il tempo di import resta leggero; la superficie di promozione viene caricata solo al primo uso invece di rientrare nell'avvio del canale incluso durante l'import del modulo.

Quando quelle superfici di avvio includono metodi RPC del Gateway, mantienili su un
prefisso specifico del plugin. Gli spazi dei nomi admin del core (`config.*`,
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

### Metadati del catalogo canali

I plugin canale possono pubblicizzare metadati di setup/rilevamento tramite `openclaw.channel` e
suggerimenti di installazione tramite `openclaw.install`. Questo mantiene i dati del catalogo liberi nel core.

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
- `preferOver`: ID di plugin/canale a priorità inferiore che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo per la superficie di selezione
- `markdownCapable`: contrassegna il canale come compatibile con Markdown per le decisioni di formattazione in uscita
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai selettori interattivi di setup/configurazione quando impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferisci `exposure`
- `quickstartAllowFrom`: abilita per il canale il flusso standard quickstart `allowFrom`
- `forceAccountBinding`: richiede il binding esplicito dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la ricerca della sessione quando risolve i target di announce

OpenClaw può anche unire **cataloghi canale esterni** (per esempio, un export
del registro MPM). Inserisci un file JSON in uno di questi percorsi:

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

Oppure punta `OPENCLAW_PLUGIN_CATALOG_PATHS` (o `OPENCLAW_MPM_CATALOG_PATHS`) a
uno o più file JSON (delimitati da virgola/punto e virgola/`PATH`). Ogni file dovrebbe
contenere `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`. Il parser accetta anche `"packages"` o `"plugins"` come alias legacy per la chiave `"entries"`.

## Plugin del motore di contesto

I plugin del motore di contesto gestiscono l'orchestrazione del contesto di sessione per ingestione, assemblaggio
e Compaction. Registrali dal tuo plugin con
`api.registerContextEngine(id, factory)`, poi seleziona il motore attivo con
`plugins.slots.contextEngine`.

Usalo quando il tuo plugin deve sostituire o estendere la pipeline di contesto predefinita invece di limitarsi ad aggiungere ricerca in memoria o hook.

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

Se il tuo motore **non** gestisce l'algoritmo di Compaction, mantieni `compact()`
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
il sistema di plugin con un reach-in privato. Aggiungi la capacità mancante.

Sequenza consigliata:

1. definire il contratto del core
   Decidi quale comportamento condiviso dovrebbe gestire il core: policy, fallback, merge della configurazione,
   lifecycle, semantica rivolta ai canali e forma dell'helper runtime.
2. aggiungere superfici tipizzate di registrazione/runtime per i plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la più piccola
   superficie tipizzata di capacità utile.
3. collegare core + consumer canale/funzionalità
   I canali e i plugin funzionalità dovrebbero consumare la nuova capacità tramite il core,
   non importando direttamente un'implementazione vendor.
4. registrare implementazioni vendor
   I plugin vendor poi registrano i propri backend rispetto alla capacità.
5. aggiungere copertura di contratto
   Aggiungi test così ownership e forma di registrazione restano esplicite nel tempo.

È così che OpenClaw resta opinionato senza diventare codificato rigidamente sulla visione del mondo
di un singolo provider. Vedi il [Capability Cookbook](/it/plugins/architecture)
per una checklist concreta dei file e un esempio completo.

### Checklist della capacità

Quando aggiungi una nuova capacità, l'implementazione dovrebbe di solito toccare insieme queste
superfici:

- tipi di contratto del core in `src/<capability>/types.ts`
- runner/core helper runtime in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API plugin in `src/plugins/types.ts`
- wiring del registro dei plugin in `src/plugins/registry.ts`
- esposizione runtime del plugin in `src/plugins/runtime/*` quando i plugin funzionalità/canale
  devono consumarla
- helper di capture/test in `src/test-utils/plugin-registration.ts`
- asserzioni di ownership/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/plugin in `docs/`

Se una di queste superfici manca, di solito è segno che la capacità
non è ancora completamente integrata.

### Template della capacità

Schema minimo:

```ts
// contratto del core
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// API del plugin
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// helper runtime condiviso per plugin funzionalità/canale
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Schema di test del contratto:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Questo mantiene semplice la regola:

- il core gestisce il contratto di capacità + l'orchestrazione
- i plugin vendor gestiscono le implementazioni vendor
- i plugin funzionalità/canale consumano helper runtime
- i test di contratto mantengono esplicita l'ownership
