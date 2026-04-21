---
read_when:
    - Creazione o debug di plugin nativi di OpenClaw
    - Comprendere il modello di capacità del plugin o i confini di proprietà
    - Lavorare sulla pipeline di caricamento del plugin o sul registro
    - Implementare hook di runtime del provider o plugin di canale
sidebarTitle: Internals
summary: 'Interni del Plugin: modello di capacità, proprietà, contratti, pipeline di caricamento e helper di runtime'
title: Interni del Plugin
x-i18n:
    generated_at: "2026-04-21T13:35:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b1fb42e659d4419033b317e88563a59b3ddbfad0523f32225c868c8e828fd16
    source_path: plugins/architecture.md
    workflow: 15
---

# Interni del Plugin

<Info>
  Questo è il **riferimento di architettura approfondito**. Per guide pratiche, vedi:
  - [Installare e usare i plugin](/it/tools/plugin) — guida per l'utente
  - [Per iniziare](/it/plugins/building-plugins) — primo tutorial sui plugin
  - [Plugin di canale](/it/plugins/sdk-channel-plugins) — crea un canale di messaggistica
  - [Plugin provider](/it/plugins/sdk-provider-plugins) — crea un provider di modelli
  - [Panoramica dell'SDK](/it/plugins/sdk-overview) — mappa di importazione e API di registrazione
</Info>

Questa pagina copre l'architettura interna del sistema di plugin di OpenClaw.

## Modello pubblico delle capacità

Le capacità sono il modello pubblico dei **plugin nativi** all'interno di OpenClaw. Ogni
plugin nativo di OpenClaw si registra rispetto a uno o più tipi di capacità:

| Capacità              | Metodo di registrazione                           | Esempi di plugin                    |
| --------------------- | ------------------------------------------------- | ----------------------------------- |
| Inferenza di testo    | `api.registerProvider(...)`                       | `openai`, `anthropic`               |
| Backend di inferenza CLI | `api.registerCliBackend(...)`                  | `openai`, `anthropic`               |
| Voce                  | `api.registerSpeechProvider(...)`                 | `elevenlabs`, `microsoft`           |
| Trascrizione in tempo reale | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                     |
| Voce in tempo reale   | `api.registerRealtimeVoiceProvider(...)`          | `openai`                            |
| Comprensione dei contenuti multimediali | `api.registerMediaUnderstandingProvider(...)` | `openai`, `google` |
| Generazione di immagini | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Generazione di musica | `api.registerMusicGenerationProvider(...)`        | `google`, `minimax`                 |
| Generazione di video  | `api.registerVideoGenerationProvider(...)`        | `qwen`                              |
| Recupero web          | `api.registerWebFetchProvider(...)`               | `firecrawl`                         |
| Ricerca web           | `api.registerWebSearchProvider(...)`              | `google`                            |
| Canale / messaggistica | `api.registerChannel(...)`                       | `msteams`, `matrix`                 |

Un plugin che registra zero capacità ma fornisce hook, strumenti o
servizi è un plugin **legacy solo hook**. Questo modello è ancora pienamente supportato.

### Posizione sulla compatibilità esterna

Il modello delle capacità è stato integrato nel core ed è usato oggi dai plugin
bundled/nativi, ma la compatibilità con i plugin esterni richiede ancora un criterio più rigoroso rispetto a "è
esportato, quindi è congelato".

Indicazioni attuali:

- **plugin esterni esistenti:** mantenere funzionanti le integrazioni basate su hook; trattare
  questo come riferimento di base per la compatibilità
- **nuovi plugin bundled/nativi:** preferire la registrazione esplicita delle capacità invece di
  accessi specifici del fornitore o di nuovi design solo hook
- **plugin esterni che adottano la registrazione delle capacità:** consentiti, ma trattare le
  superfici helper specifiche per capacità come in evoluzione a meno che la documentazione non indichi esplicitamente
  un contratto come stabile

Regola pratica:

- le API di registrazione delle capacità sono la direzione prevista
- gli hook legacy restano il percorso più sicuro per evitare rotture nei plugin esterni durante
  la transizione
- i sottopercorsi helper esportati non sono tutti equivalenti; preferire il contratto
  ristretto e documentato, non esportazioni helper incidentali

### Forme dei plugin

OpenClaw classifica ogni plugin caricato in una forma in base al suo effettivo
comportamento di registrazione (non solo ai metadati statici):

- **plain-capability** -- registra esattamente un tipo di capacità (per esempio un
  plugin solo provider come `mistral`)
- **hybrid-capability** -- registra più tipi di capacità (per esempio
  `openai` gestisce inferenza di testo, voce, comprensione dei contenuti multimediali e generazione
  di immagini)
- **hook-only** -- registra solo hook (tipizzati o personalizzati), nessuna capacità,
  strumento, comando o servizio
- **non-capability** -- registra strumenti, comandi, servizi o route ma nessuna
  capacità

Usa `openclaw plugins inspect <id>` per vedere la forma di un plugin e la suddivisione
delle capacità. Per i dettagli, vedi il [riferimento CLI](/cli/plugins#inspect).

### Hook legacy

L'hook `before_agent_start` resta supportato come percorso di compatibilità per i
plugin solo hook. Plugin legacy reali dipendono ancora da esso.

Direzione:

- mantenerlo funzionante
- documentarlo come legacy
- preferire `before_model_resolve` per il lavoro di override di modello/provider
- preferire `before_prompt_build` per il lavoro di mutazione del prompt
- rimuoverlo solo dopo che l'utilizzo reale sarà diminuito e la copertura dei fixture dimostrerà la sicurezza della migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` o `openclaw plugins inspect <id>`, potresti vedere
una di queste etichette:

| Segnale                   | Significato                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **config valid**          | La configurazione viene analizzata correttamente e i plugin vengono risolti |
| **compatibility advisory** | Il plugin usa un modello supportato ma più vecchio (ad es. `hook-only`) |
| **legacy warning**        | Il plugin usa `before_agent_start`, che è deprecato          |
| **hard error**            | La configurazione non è valida o il plugin non è riuscito a caricarsi |

Né `hook-only` né `before_agent_start` romperanno il tuo plugin oggi --
`hook-only` è informativo, e `before_agent_start` genera solo un avviso. Questi
segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema di plugin di OpenClaw ha quattro livelli:

1. **Manifest + individuazione**
   OpenClaw trova i plugin candidati a partire dai percorsi configurati, dalle radici dello spazio di lavoro,
   dalle radici globali delle estensioni e dalle estensioni bundled. L'individuazione legge prima i manifest nativi
   `openclaw.plugin.json` insieme ai manifest bundle supportati.
2. **Abilitazione + validazione**
   Il core decide se un plugin individuato è abilitato, disabilitato, bloccato o
   selezionato per uno slot esclusivo come la memoria.
3. **Caricamento a runtime**
   I plugin nativi di OpenClaw vengono caricati in-process tramite jiti e registrano
   le capacità in un registro centrale. I bundle compatibili vengono normalizzati in
   record di registro senza importare codice di runtime.
4. **Utilizzo delle superfici**
   Il resto di OpenClaw legge il registro per esporre strumenti, canali, configurazione del provider,
   hook, route HTTP, comandi CLI e servizi.

In particolare per la CLI dei plugin, l'individuazione dei comandi root è divisa in due fasi:

- i metadati in fase di parsing provengono da `registerCli(..., { descriptors: [...] })`
- il vero modulo CLI del plugin può restare lazy e registrarsi alla prima invocazione

Questo mantiene il codice CLI posseduto dal plugin all'interno del plugin, consentendo comunque a OpenClaw
di riservare i nomi dei comandi root prima del parsing.

Il confine di progettazione importante:

- l'individuazione + la validazione della configurazione dovrebbero funzionare a partire da **metadati di manifest/schema**
  senza eseguire codice del plugin
- il comportamento nativo a runtime proviene dal percorso `register(api)` del modulo del plugin

Questa divisione consente a OpenClaw di validare la configurazione, spiegare i plugin mancanti/disabilitati e
costruire suggerimenti per UI/schema prima che il runtime completo sia attivo.

### Plugin di canale e strumento `message` condiviso

I plugin di canale non devono registrare uno strumento separato di invio/modifica/reazione per
le normali azioni di chat. OpenClaw mantiene un unico strumento `message` condiviso nel core, e
i plugin di canale gestiscono l'individuazione e l'esecuzione specifiche del canale dietro di esso.

Il confine attuale è:

- il core gestisce l'host condiviso dello strumento `message`, il collegamento al prompt, la gestione di sessione/thread
  e il dispatch dell'esecuzione
- i plugin di canale gestiscono l'individuazione delle azioni con ambito, l'individuazione delle capacità
  ed eventuali frammenti di schema specifici del canale
- i plugin di canale gestiscono la grammatica di conversazione della sessione specifica del provider, ad esempio
  il modo in cui gli ID conversazione codificano gli ID thread o ereditano dalle conversazioni padre
- i plugin di canale eseguono l'azione finale tramite il loro adapter di azione

Per i plugin di canale, la superficie SDK è
`ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata unificata di individuazione
consente a un plugin di restituire insieme le sue azioni visibili, capacità e contributi
di schema, così che questi elementi non divergano.

Quando un parametro dello strumento message specifico del canale contiene una sorgente multimediale come
un percorso locale o un URL remoto di contenuto multimediale, il plugin dovrebbe anche restituire
`mediaSourceParams` da `describeMessageTool(...)`. Il core usa questo elenco esplicito per applicare
la normalizzazione dei percorsi sandbox e gli hint di accesso ai contenuti multimediali in uscita
senza codificare rigidamente nomi di parametri posseduti dal plugin.
Preferire mappe con ambito di azione, non un unico elenco piatto a livello di canale, in modo che un
parametro multimediale solo profilo non venga normalizzato su azioni non correlate come
`send`.

Il core passa l'ambito di runtime in questo passaggio di individuazione. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` inbound attendibile

Questo è importante per i plugin sensibili al contesto. Un canale può nascondere o esporre
azioni di messaggio in base all'account attivo, alla stanza/thread/messaggio corrente o
all'identità attendibile del richiedente, senza codificare rigidamente rami specifici del canale
nello strumento `message` del core.

Per questo motivo, le modifiche di instradamento dell'embedded runner restano lavoro del plugin: il runner è
responsabile di inoltrare l'identità corrente di chat/sessione nel confine di individuazione del plugin affinché
lo strumento `message` condiviso esponga la superficie corretta, posseduta dal canale, per il turno corrente.

Per gli helper di esecuzione posseduti dal canale, i plugin bundled dovrebbero mantenere il runtime di esecuzione
all'interno dei propri moduli di estensione. Il core non gestisce più i runtime di azione dei messaggi di Discord,
Slack, Telegram o WhatsApp sotto `src/agents/tools`.
Non pubblichiamo sottopercorsi separati `plugin-sdk/*-action-runtime`, e i plugin bundled
dovrebbero importare direttamente il proprio codice di runtime locale dai loro
moduli posseduti dall'estensione.

Lo stesso confine si applica in generale ai seam SDK con nome del provider: il core non dovrebbe
importare barrel di convenienza specifici del canale per estensioni Slack, Discord, Signal,
WhatsApp o simili. Se il core ha bisogno di un comportamento, dovrebbe o consumare il
barrel `api.ts` / `runtime-api.ts` del plugin bundled oppure promuovere la necessità
a una capacità generica e ristretta nell'SDK condiviso.

Per i sondaggi in particolare, esistono due percorsi di esecuzione:

- `outbound.sendPoll` è il riferimento condiviso per i canali che rientrano nel modello comune di sondaggio
- `actions.handleAction("poll")` è il percorso preferito per semantiche di sondaggio specifiche del canale o parametri di sondaggio aggiuntivi

Il core ora rimanda il parsing condiviso dei sondaggi fino a dopo che il dispatch del sondaggio del plugin
rifiuta l'azione, in modo che gli handler di sondaggi posseduti dal plugin possano accettare campi
di sondaggio specifici del canale senza essere bloccati prima dal parser di sondaggi generico.

Vedi [Pipeline di caricamento](#load-pipeline) per la sequenza completa di avvio.

## Modello di proprietà delle capacità

OpenClaw tratta un plugin nativo come confine di proprietà per una **azienda** o una
**funzionalità**, non come un insieme eterogeneo di integrazioni non correlate.

Questo significa:

- un plugin aziendale dovrebbe di norma possedere tutte le superfici di OpenClaw rivolte a quella stessa azienda
- un plugin di funzionalità dovrebbe di norma possedere l'intera superficie della funzionalità che introduce
- i canali dovrebbero consumare capacità core condivise invece di reimplementare in modo ad hoc il comportamento del provider

Esempi:

- il plugin bundled `openai` possiede il comportamento del provider di modelli OpenAI e il comportamento OpenAI per
  voce + voce in tempo reale + comprensione dei contenuti multimediali + generazione di immagini
- il plugin bundled `elevenlabs` possiede il comportamento della voce ElevenLabs
- il plugin bundled `microsoft` possiede il comportamento della voce Microsoft
- il plugin bundled `google` possiede il comportamento del provider di modelli Google più il comportamento Google per
  comprensione dei contenuti multimediali + generazione di immagini + ricerca web
- il plugin bundled `firecrawl` possiede il comportamento di recupero web Firecrawl
- i plugin bundled `minimax`, `mistral`, `moonshot` e `zai` possiedono i loro
  backend di comprensione dei contenuti multimediali
- il plugin bundled `qwen` possiede il comportamento del provider di testo Qwen più
  il comportamento di comprensione dei contenuti multimediali e generazione di video
- il plugin `voice-call` è un plugin di funzionalità: possiede trasporto delle chiamate, strumenti,
  CLI, route e bridging del media-stream Twilio, ma consuma le capacità condivise di voce
  più trascrizione in tempo reale e voce in tempo reale invece di
  importare direttamente plugin di fornitori

Lo stato finale previsto è:

- OpenAI vive in un unico plugin anche se copre modelli di testo, voce, immagini e
  video futuri
- un altro fornitore può fare lo stesso per la propria area di superficie
- i canali non si preoccupano di quale plugin del fornitore possieda il provider; consumano il
  contratto di capacità condiviso esposto dal core

Questa è la distinzione chiave:

- **plugin** = confine di proprietà
- **capability** = contratto del core che più plugin possono implementare o consumare

Quindi, se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è
"quale provider dovrebbe codificare rigidamente la gestione del video?" La prima domanda è "qual è
il contratto di capacità video del core?" Una volta che quel contratto esiste, i plugin dei fornitori
possono registrarsi rispetto a esso e i plugin di canale/funzionalità possono consumarlo.

Se la capacità non esiste ancora, la mossa giusta di solito è:

1. definire la capacità mancante nel core
2. esporla attraverso l'API/runtime del plugin in modo tipizzato
3. collegare canali/funzionalità a quella capacità
4. lasciare che i plugin dei fornitori registrino le implementazioni

Questo mantiene esplicita la proprietà evitando al tempo stesso un comportamento del core che dipende da un
singolo fornitore o da un percorso di codice una tantum specifico del plugin.

### Stratificazione delle capacità

Usa questo modello mentale quando decidi dove deve stare il codice:

- **livello di capacità del core**: orchestrazione condivisa, policy, fallback, regole di
  unione della configurazione, semantica di consegna e contratti tipizzati
- **livello del plugin del fornitore**: API specifiche del fornitore, autenticazione, cataloghi di modelli, sintesi vocale,
  generazione di immagini, backend video futuri, endpoint di utilizzo
- **livello del plugin di canale/funzionalità**: integrazione Slack/Discord/voice-call/ecc.
  che consuma le capacità del core e le presenta su una superficie

Per esempio, il TTS segue questa forma:

- il core possiede la policy TTS al momento della risposta, l'ordine di fallback, le preferenze e la consegna sul canale
- `openai`, `elevenlabs` e `microsoft` possiedono le implementazioni di sintesi
- `voice-call` consuma l'helper di runtime TTS per la telefonia

Lo stesso schema dovrebbe essere preferito per le capacità future.

### Esempio di plugin aziendale multi-capacità

Un plugin aziendale dovrebbe apparire coeso dall'esterno. Se OpenClaw ha contratti condivisi
per modelli, voce, trascrizione in tempo reale, voce in tempo reale, comprensione dei contenuti multimediali,
generazione di immagini, generazione di video, recupero web e ricerca web,
un fornitore può possedere tutte le sue superfici in un unico posto:

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

- un plugin possiede la superficie del fornitore
- il core continua a possedere i contratti di capacità
- i plugin di canale e di funzionalità consumano gli helper `api.runtime.*`, non il codice del fornitore
- i test di contratto possono verificare che il plugin abbia registrato le capacità che
  dichiara di possedere

### Esempio di capacità: comprensione video

OpenClaw tratta già la comprensione di immagini/audio/video come un'unica
capacità condivisa. Lo stesso modello di proprietà si applica anche qui:

1. il core definisce il contratto di comprensione dei contenuti multimediali
2. i plugin dei fornitori registrano `describeImage`, `transcribeAudio` e
   `describeVideo` a seconda dei casi
3. i plugin di canale e di funzionalità consumano il comportamento condiviso del core invece di
   collegarsi direttamente al codice del fornitore

Questo evita di incorporare nel core le assunzioni video di un singolo fornitore. Il plugin possiede
la superficie del fornitore; il core possiede il contratto di capacità e il comportamento di fallback.

La generazione video usa già questa stessa sequenza: il core possiede il contratto di capacità
tipizzato e l'helper di runtime, e i plugin dei fornitori registrano
implementazioni `api.registerVideoGenerationProvider(...)` rispetto a esso.

Hai bisogno di una checklist concreta di rollout? Vedi
[Capability Cookbook](/it/plugins/architecture).

## Contratti e applicazione

La superficie API del plugin è intenzionalmente tipizzata e centralizzata in
`OpenClawPluginApi`. Questo contratto definisce i punti di registrazione supportati e
gli helper di runtime su cui un plugin può fare affidamento.

Perché è importante:

- gli autori di plugin hanno un unico standard interno stabile
- il core può rifiutare proprietà duplicate, ad esempio due plugin che registrano lo stesso
  id provider
- l'avvio può mostrare diagnostiche utili per registrazioni malformate
- i test di contratto possono imporre la proprietà dei plugin bundled ed evitare derive silenziose

Ci sono due livelli di applicazione:

1. **applicazione della registrazione a runtime**
   Il registro dei plugin convalida le registrazioni mentre i plugin vengono caricati. Esempi:
   id provider duplicati, id provider voce duplicati e registrazioni
   malformate producono diagnostiche del plugin invece di un comportamento indefinito.
2. **test di contratto**
   I plugin bundled vengono acquisiti nei registri di contratto durante le esecuzioni di test, così
   OpenClaw può verificare esplicitamente la proprietà. Oggi questo è usato per i provider di modelli,
   i provider voce, i provider di ricerca web e la proprietà di registrazione dei plugin bundled.

L'effetto pratico è che OpenClaw sa, fin da subito, quale plugin possiede quale
superficie. Questo consente al core e ai canali di comporsi senza attriti perché la proprietà è
dichiarata, tipizzata e verificabile invece che implicita.

### Cosa appartiene a un contratto

I buoni contratti di plugin sono:

- tipizzati
- piccoli
- specifici per capacità
- posseduti dal core
- riutilizzabili da più plugin
- consumabili da canali/funzionalità senza conoscenza del fornitore

I cattivi contratti di plugin sono:

- policy specifiche del fornitore nascoste nel core
- vie di fuga una tantum per plugin che aggirano il registro
- codice del canale che raggiunge direttamente un'implementazione del fornitore
- oggetti di runtime ad hoc che non fanno parte di `OpenClawPluginApi` o
  `api.runtime`

In caso di dubbio, aumenta il livello di astrazione: definisci prima la capacità, poi
lascia che i plugin vi si colleghino.

## Modello di esecuzione

I plugin nativi di OpenClaw vengono eseguiti **in-process** con il Gateway. Non sono
sandboxed. Un plugin nativo caricato ha lo stesso confine di trust a livello di processo del
codice core.

Implicazioni:

- un plugin nativo può registrare strumenti, handler di rete, hook e servizi
- un bug in un plugin nativo può causare il crash o destabilizzare il gateway
- un plugin nativo malevolo equivale a esecuzione arbitraria di codice all'interno
  del processo OpenClaw

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw attualmente li tratta
come pacchetti di metadati/contenuti. Nelle release attuali, questo significa soprattutto
Skills bundled.

Usa allowlist e percorsi espliciti di installazione/caricamento per i plugin non bundled. Tratta
i plugin dello spazio di lavoro come codice in fase di sviluppo, non come impostazioni predefinite di produzione.

Per i nomi dei pacchetti workspace bundled, mantieni l'id del plugin ancorato al nome npm:
`@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando
il pacchetto espone intenzionalmente un ruolo di plugin più ristretto.

Nota importante sul trust:

- `plugins.allow` si fida degli **id plugin**, non della provenienza della sorgente.
- Un plugin workspace con lo stesso id di un plugin bundled oscura intenzionalmente
  la copia bundled quando quel plugin workspace è abilitato/in allowlist.
- Questo è normale e utile per lo sviluppo locale, i test di patch e gli hotfix.

## Confine di esportazione

OpenClaw esporta capacità, non elementi di comodo dell'implementazione.

Mantieni pubblica la registrazione delle capacità. Riduci le esportazioni helper non contrattuali:

- sottopercorsi helper specifici dei plugin bundled
- sottopercorsi di plumbing del runtime non destinati a essere API pubbliche
- helper di comodo specifici del fornitore
- helper di setup/onboarding che sono dettagli di implementazione

Alcuni sottopercorsi helper dei plugin bundled restano ancora nella mappa di esportazione
SDK generata per compatibilità e manutenzione dei plugin bundled. Esempi attuali includono
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e diversi seam `plugin-sdk/matrix*`. Trattali come
esportazioni riservate di dettaglio implementativo, non come schema SDK consigliato per
nuovi plugin di terze parti.

## Pipeline di caricamento

All'avvio, OpenClaw fa approssimativamente questo:

1. individua le radici candidate dei plugin
2. legge i manifest nativi o i manifest dei bundle compatibili e i metadati del pacchetto
3. rifiuta i candidati non sicuri
4. normalizza la configurazione dei plugin (`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. decide l'abilitazione per ogni candidato
6. carica i moduli nativi abilitati tramite jiti
7. chiama gli hook nativi `register(api)` (o `activate(api)` — un alias legacy) e raccoglie le registrazioni nel registro dei plugin
8. espone il registro ai comandi/alle superfici di runtime

<Note>
`activate` è un alias legacy per `register` — il loader risolve quello presente (`def.register ?? def.activate`) e lo chiama nello stesso punto. Tutti i plugin bundled usano `register`; per i nuovi plugin, preferisci `register`.
</Note>

I gate di sicurezza avvengono **prima** dell'esecuzione a runtime. I candidati vengono bloccati
quando l'entry esce dalla root del plugin, il percorso è scrivibile da chiunque, oppure la proprietà del percorso appare sospetta per plugin non bundled.

### Comportamento manifest-first

Il manifest è la fonte di verità del control plane. OpenClaw lo usa per:

- identificare il plugin
- individuare canali/Skills/schema di configurazione dichiarati o capacità del bundle
- convalidare `plugins.entries.<id>.config`
- arricchire etichette/segnaposto della Control UI
- mostrare metadati di installazione/catalogo
- preservare descrittori economici di attivazione e setup senza caricare il runtime del plugin

Per i plugin nativi, il modulo di runtime è la parte data-plane. Registra il
comportamento effettivo come hook, strumenti, comandi o flussi del provider.

I blocchi opzionali `activation` e `setup` del manifest restano nel control plane.
Sono descrittori solo metadati per la pianificazione dell'attivazione e l'individuazione del setup;
non sostituiscono la registrazione a runtime, `register(...)` o `setupEntry`.
I primi consumer di attivazione live ora usano gli hint di manifest per comandi, canali e provider
per restringere il caricamento dei plugin prima della materializzazione più ampia del registro:

- il caricamento della CLI si restringe ai plugin che possiedono il comando primario richiesto
- la risoluzione del setup/plugin del canale si restringe ai plugin che possiedono l'id
  del canale richiesto
- la risoluzione esplicita del setup/runtime del provider si restringe ai plugin che possiedono l'
  id provider richiesto

L'individuazione del setup ora preferisce gli id posseduti dai descrittori come `setup.providers` e
`setup.cliBackends` per restringere i plugin candidati prima di ricorrere a
`setup-api` per i plugin che richiedono ancora hook di runtime in fase di setup. Se più di
un plugin individuato rivendica lo stesso id normalizzato di provider di setup o backend CLI,
la ricerca del setup rifiuta il proprietario ambiguo invece di basarsi sull'ordine di individuazione.

### Cosa mette in cache il loader

OpenClaw mantiene brevi cache in-process per:

- risultati di individuazione
- dati del registro dei manifest
- registri dei plugin caricati

Queste cache riducono i picchi all'avvio e l'overhead dei comandi ripetuti. È corretto
considerarle come cache di prestazioni a breve durata, non come persistenza.

Nota sulle prestazioni:

- Imposta `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` oppure
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` per disabilitare queste cache.
- Regola le finestre della cache con `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` e
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`.

## Modello di registro

I plugin caricati non mutano direttamente variabili globali casuali del core. Si registrano in un
registro centrale dei plugin.

Il registro tiene traccia di:

- record dei plugin (identità, sorgente, origine, stato, diagnostica)
- strumenti
- hook legacy e hook tipizzati
- canali
- provider
- handler RPC del Gateway
- route HTTP
- registrar CLI
- servizi in background
- comandi posseduti dal plugin

Le funzionalità del core leggono quindi da quel registro invece di parlare direttamente ai moduli
del plugin. Questo mantiene il caricamento a senso unico:

- modulo del plugin -> registrazione nel registro
- runtime del core -> consumo del registro

Questa separazione è importante per la manutenibilità. Significa che la maggior parte delle superfici del core
ha bisogno di un solo punto di integrazione: "leggere il registro", non "gestire casi speciali per ogni modulo di plugin".

## Callback di binding della conversazione

I plugin che associano una conversazione possono reagire quando un'approvazione viene risolta.

Usa `api.onConversationBindingResolved(...)` per ricevere una callback dopo che una richiesta di binding viene approvata o negata:

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
- `request`: il riepilogo della richiesta originale, l'hint di scollegamento, l'id del mittente e
  i metadati della conversazione

Questa callback è solo di notifica. Non cambia chi è autorizzato ad associare una
conversazione, e viene eseguita dopo che la gestione dell'approvazione del core è terminata.

## Hook di runtime del provider

I plugin provider ora hanno due livelli:

- metadati del manifest: `providerAuthEnvVars` per una ricerca economica dell'autenticazione del provider tramite env
  prima del caricamento del runtime, `providerAuthAliases` per varianti di provider che condividono
  l'autenticazione, `channelEnvVars` per una ricerca economica dell'env/setup del canale prima del caricamento del runtime,
  più `providerAuthChoices` per etichette economiche di onboarding/scelta dell'autenticazione e
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
  `resolveThinkingProfile`, `isBinaryThinking`, `supportsXHighThinking`,
  `resolveDefaultThinkingLevel`, `isModernModelRef`, `prepareRuntimeAuth`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `createEmbeddingProvider`,
  `buildReplayPolicy`,
  `sanitizeReplayHistory`, `validateReplayTurns`, `onModelSelected`

OpenClaw continua a possedere il loop generico dell'agente, il failover, la gestione delle trascrizioni e
la policy degli strumenti. Questi hook sono la superficie di estensione per il comportamento specifico del provider senza
richiedere un intero trasporto di inferenza personalizzato.

Usa il manifest `providerAuthEnvVars` quando il provider ha credenziali basate su env
che i percorsi generici di autenticazione/stato/selettore di modello devono vedere senza caricare il runtime del plugin.
Usa il manifest `providerAuthAliases` quando un id provider deve riutilizzare
le variabili env, i profili di autenticazione, l'autenticazione supportata dalla configurazione e la scelta di onboarding della chiave API di un altro id provider.
Usa il manifest `providerAuthChoices` quando le superfici CLI di onboarding/scelta dell'autenticazione
devono conoscere l'id di scelta del provider, le etichette di gruppo e il semplice wiring di autenticazione a flag singolo senza caricare il runtime del provider.
Mantieni `envVars` nel runtime del provider per hint rivolti all'operatore, come etichette di onboarding o variabili di setup per
client-id/client-secret OAuth.

Usa il manifest `channelEnvVars` quando un canale ha autenticazione o setup guidati da env che
i fallback generici dell'env di shell, i controlli di configurazione/stato o i prompt di setup devono vedere
senza caricare il runtime del canale.

### Ordine e utilizzo degli hook

Per i plugin di modello/provider, OpenClaw chiama gli hook approssimativamente in questo ordine.
La colonna "When to use" è la guida rapida per decidere.

| #   | Hook                              | Cosa fa                                                                                                        | Quando usarlo                                                                                                                               |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | Pubblica la configurazione del provider in `models.providers` durante la generazione di `models.json`         | Il provider possiede un catalogo o valori predefiniti di base URL                                                                           |
| 2   | `applyConfigDefaults`             | Applica valori predefiniti globali della configurazione posseduti dal provider durante la materializzazione della configurazione | I valori predefiniti dipendono dalla modalità di autenticazione, dall'env o dalla semantica della famiglia di modelli del provider         |
| --  | _(built-in model lookup)_         | OpenClaw prova prima il normale percorso di registro/catalogo                                                  | _(non è un hook del plugin)_                                                                                                                |
| 3   | `normalizeModelId`                | Normalizza alias legacy o preview degli id modello prima della ricerca                                         | Il provider possiede la pulizia degli alias prima della risoluzione del modello canonico                                                    |
| 4   | `normalizeTransport`              | Normalizza `api` / `baseUrl` della famiglia del provider prima dell'assemblaggio generico del modello         | Il provider possiede la pulizia del trasporto per id provider personalizzati nella stessa famiglia di trasporto                            |
| 5   | `normalizeConfig`                 | Normalizza `models.providers.<id>` prima della risoluzione del runtime/provider                               | Il provider ha bisogno di una pulizia della configurazione che dovrebbe stare nel plugin; gli helper bundled della famiglia Google fungono anche da fallback per le voci di configurazione Google supportate |
| 6   | `applyNativeStreamingUsageCompat` | Applica riscritture di compatibilità dell'uso dello streaming nativo ai provider di configurazione            | Il provider necessita di correzioni dei metadati di uso dello streaming nativo guidate dall'endpoint                                       |
| 7   | `resolveConfigApiKey`             | Risolve l'autenticazione con marker env per i provider di configurazione prima del caricamento dell'autenticazione a runtime | Il provider ha una risoluzione della chiave API con marker env posseduta dal provider; anche `amazon-bedrock` ha qui un resolver integrato per marker env AWS |
| 8   | `resolveSyntheticAuth`            | Espone autenticazione locale/self-hosted o supportata dalla configurazione senza persistere testo in chiaro   | Il provider può operare con un marker di credenziale sintetico/locale                                                                       |
| 9   | `resolveExternalAuthProfiles`     | Sovrappone profili di autenticazione esterni posseduti dal provider; il valore predefinito di `persistence` è `runtime-only` per credenziali possedute da CLI/app | Il provider riutilizza credenziali di autenticazione esterne senza persistere token di refresh copiati                                     |
| 10  | `shouldDeferSyntheticProfileAuth` | Abbassa la priorità dei placeholder di profilo sintetico memorizzati rispetto all'autenticazione supportata da env/config | Il provider memorizza profili placeholder sintetici che non dovrebbero avere la precedenza                                                  |
| 11  | `resolveDynamicModel`             | Fallback sincrono per id modello posseduti dal provider non ancora presenti nel registro locale               | Il provider accetta id modello upstream arbitrari                                                                                           |
| 12  | `prepareDynamicModel`             | Warm-up asincrono, poi `resolveDynamicModel` viene eseguito di nuovo                                           | Il provider ha bisogno di metadati di rete prima di risolvere id sconosciuti                                                               |
| 13  | `normalizeResolvedModel`          | Riscrittura finale prima che l'embedded runner usi il modello risolto                                          | Il provider ha bisogno di riscritture del trasporto ma continua a usare un trasporto del core                                              |
| 14  | `contributeResolvedModelCompat`   | Contribuisce con flag di compatibilità per modelli del fornitore dietro un altro trasporto compatibile        | Il provider riconosce i propri modelli su trasporti proxy senza assumere il controllo del provider                                         |
| 15  | `capabilities`                    | Metadati di trascrizione/strumenti posseduti dal provider usati dalla logica condivisa del core               | Il provider ha bisogno di peculiarità della trascrizione/famiglia del provider                                                              |
| 16  | `normalizeToolSchemas`            | Normalizza gli schemi degli strumenti prima che l'embedded runner li veda                                      | Il provider ha bisogno di pulizia dello schema della famiglia di trasporto                                                                  |
| 17  | `inspectToolSchemas`              | Espone diagnostiche dello schema possedute dal provider dopo la normalizzazione                                | Il provider vuole avvisi sulle parole chiave senza insegnare al core regole specifiche del provider                                        |
| 18  | `resolveReasoningOutputMode`      | Seleziona il contratto di output del ragionamento nativo rispetto a quello con tag                            | Il provider ha bisogno di output ragionamento/finale con tag invece dei campi nativi                                                       |
| 19  | `prepareExtraParams`              | Normalizzazione dei parametri della richiesta prima dei wrapper generici delle opzioni di stream              | Il provider ha bisogno di parametri di richiesta predefiniti o di pulizia dei parametri per provider                                       |
| 20  | `createStreamFn`                  | Sostituisce completamente il normale percorso di stream con un trasporto personalizzato                        | Il provider ha bisogno di un protocollo wire personalizzato, non solo di un wrapper                                                        |
| 21  | `wrapStreamFn`                    | Wrapper di stream dopo l'applicazione dei wrapper generici                                                     | Il provider ha bisogno di wrapper di compatibilità per header/corpo/modello della richiesta senza un trasporto personalizzato             |
| 22  | `resolveTransportTurnState`       | Collega header o metadati nativi per turno di trasporto                                                       | Il provider vuole che i trasporti generici inviino un'identità di turno nativa del provider                                                |
| 23  | `resolveWebSocketSessionPolicy`   | Collega header WebSocket nativi o una policy di cool-down della sessione                                      | Il provider vuole che i trasporti WS generici regolino header di sessione o policy di fallback                                             |
| 24  | `formatApiKey`                    | Formatter del profilo di autenticazione: il profilo memorizzato diventa la stringa `apiKey` di runtime       | Il provider memorizza metadati di autenticazione aggiuntivi e ha bisogno di una forma di token di runtime personalizzata                  |
| 25  | `refreshOAuth`                    | Override del refresh OAuth per endpoint di refresh personalizzati o policy di errore del refresh              | Il provider non rientra nei refresher condivisi `pi-ai`                                                                                    |
| 26  | `buildAuthDoctorHint`             | Hint di riparazione aggiunto quando il refresh OAuth fallisce                                                  | Il provider ha bisogno di indicazioni di riparazione dell'autenticazione possedute dal provider dopo un errore di refresh                 |
| 27  | `matchesContextOverflowError`     | Matcher dell'overflow della finestra di contesto posseduto dal provider                                        | Il provider ha errori raw di overflow che le euristiche generiche non rileverebbero                                                        |
| 28  | `classifyFailoverReason`          | Classificazione del motivo di failover posseduta dal provider                                                  | Il provider può mappare errori raw di API/trasporto a rate-limit/sovraccarico/ecc.                                                         |
| 29  | `isCacheTtlEligible`              | Policy della cache dei prompt per provider proxy/backhaul                                                      | Il provider ha bisogno di gating TTL della cache specifico del proxy                                                                        |
| 30  | `buildMissingAuthMessage`         | Sostituzione del messaggio generico di recupero per autenticazione mancante                                    | Il provider ha bisogno di un hint di recupero specifico del provider per autenticazione mancante                                           |
| 31  | `suppressBuiltInModel`            | Soppressione di modelli upstream obsoleti più eventuale hint di errore rivolto all'utente                     | Il provider ha bisogno di nascondere righe upstream obsolete o sostituirle con un hint del fornitore                                       |
| 32  | `augmentModelCatalog`             | Righe di catalogo sintetiche/finali aggiunte dopo l'individuazione                                             | Il provider ha bisogno di righe sintetiche forward-compat in `models list` e nei selettori                                                 |
| 33  | `resolveThinkingProfile`          | Imposta il livello `/think`, le etichette visualizzate e il valore predefinito specifici del modello         | Il provider espone una scala di thinking personalizzata o un'etichetta binaria per modelli selezionati                                     |
| 34  | `isBinaryThinking`                | Hook di compatibilità per il toggle di ragionamento on/off                                                     | Il provider espone solo il thinking binario acceso/spento                                                                                   |
| 35  | `supportsXHighThinking`           | Hook di compatibilità per il supporto al ragionamento `xhigh`                                                  | Il provider vuole `xhigh` solo su un sottoinsieme di modelli                                                                                |
| 36  | `resolveDefaultThinkingLevel`     | Hook di compatibilità per il livello `/think` predefinito                                                      | Il provider possiede la policy predefinita di `/think` per una famiglia di modelli                                                         |
| 37  | `isModernModelRef`                | Matcher di modello moderno per filtri di profili live e selezione smoke                                        | Il provider possiede l'abbinamento del modello preferito live/smoke                                                                         |
| 38  | `prepareRuntimeAuth`              | Scambia una credenziale configurata con il token/la chiave effettivi di runtime subito prima dell'inferenza   | Il provider ha bisogno di uno scambio di token o di una credenziale di richiesta a breve durata                                            |
| 39  | `resolveUsageAuth`                | Risolve le credenziali di utilizzo/fatturazione per `/usage` e superfici di stato correlate                   | Il provider ha bisogno di parsing personalizzato del token di utilizzo/quota o di una credenziale di utilizzo diversa                     |
| 40  | `fetchUsageSnapshot`              | Recupera e normalizza snapshot di utilizzo/quota specifici del provider dopo che l'autenticazione è stata risolta | Il provider ha bisogno di un endpoint di utilizzo specifico del provider o di un parser del payload                                        |
| 41  | `createEmbeddingProvider`         | Costruisce un adapter di embedding posseduto dal provider per memoria/ricerca                                  | Il comportamento degli embedding per la memoria appartiene al plugin del provider                                                           |
| 42  | `buildReplayPolicy`               | Restituisce una policy di replay che controlla la gestione della trascrizione per il provider                  | Il provider ha bisogno di una policy di trascrizione personalizzata (per esempio, rimozione dei blocchi di thinking)                      |
| 43  | `sanitizeReplayHistory`           | Riscrive la cronologia di replay dopo la pulizia generica della trascrizione                                   | Il provider ha bisogno di riscritture del replay specifiche del provider oltre agli helper condivisi di Compaction                        |
| 44  | `validateReplayTurns`             | Validazione finale o rimodellamento dei turni di replay prima dell'embedded runner                             | Il trasporto del provider ha bisogno di una validazione dei turni più rigorosa dopo la sanitizzazione generica                             |
| 45  | `onModelSelected`                 | Esegue effetti collaterali post-selezione posseduti dal provider                                               | Il provider ha bisogno di telemetria o stato posseduto dal provider quando un modello diventa attivo                                       |

`normalizeModelId`, `normalizeTransport` e `normalizeConfig` controllano prima il
plugin provider corrispondente, poi passano agli altri plugin provider in grado di gestire hook
finché uno non modifica effettivamente l'id del modello o il trasporto/la configurazione. Questo mantiene
funzionanti gli shim di alias/compatibilità del provider senza richiedere al chiamante di sapere quale
plugin bundled possiede la riscrittura. Se nessun hook provider riscrive una voce di configurazione supportata
della famiglia Google, il normalizzatore di configurazione Google bundled applica comunque
quella pulizia di compatibilità.

Se il provider ha bisogno di un protocollo wire completamente personalizzato o di un esecutore di richieste personalizzato,
si tratta di una classe diversa di estensione. Questi hook servono per il comportamento del provider
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

- Anthropic usa `resolveDynamicModel`, `capabilities`, `buildAuthDoctorHint`,
  `resolveUsageAuth`, `fetchUsageSnapshot`, `isCacheTtlEligible`,
  `resolveThinkingProfile`, `applyConfigDefaults`, `isModernModelRef`
  e `wrapStreamFn` perché possiede la forward-compat di Claude 4.6,
  gli hint della famiglia provider, la guida alla riparazione dell'autenticazione, l'integrazione
  dell'endpoint di utilizzo, l'idoneità della cache dei prompt, i valori predefiniti di configurazione consapevoli dell'autenticazione, la policy di thinking
  predefinita/adattiva di Claude e lo shaping dello stream specifico di Anthropic per
  header beta, `/fast` / `serviceTier` e `context1m`.
- Gli helper di stream specifici di Claude di Anthropic restano per ora nel seam
  pubblico `api.ts` / `contract-api.ts` del plugin bundled. Quella superficie del pacchetto
  esporta `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
  `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` e i builder di wrapper Anthropic
  di livello inferiore invece di ampliare l'SDK generico attorno alle regole degli header beta di un solo
  provider.
- OpenAI usa `resolveDynamicModel`, `normalizeResolvedModel` e
  `capabilities` più `buildMissingAuthMessage`, `suppressBuiltInModel`,
  `augmentModelCatalog`, `resolveThinkingProfile` e `isModernModelRef`
  perché possiede la forward-compat di GPT-5.4, la normalizzazione diretta di OpenAI
  `openai-completions` -> `openai-responses`, gli hint di autenticazione
  consapevoli di Codex, la soppressione di Spark, le righe di elenco OpenAI sintetiche e la policy di thinking /
  modello live di GPT-5; la famiglia di stream `openai-responses-defaults` possiede i
  wrapper condivisi nativi di OpenAI Responses per header di attribuzione,
  `/fast`/`serviceTier`, verbosità del testo, ricerca web Codex nativa,
  shaping del payload compatibile con il ragionamento e gestione del contesto di Responses.
- OpenRouter usa `catalog` più `resolveDynamicModel` e
  `prepareDynamicModel` perché il provider è pass-through e può esporre nuovi
  id modello prima degli aggiornamenti del catalogo statico di OpenClaw; usa anche
  `capabilities`, `wrapStreamFn` e `isCacheTtlEligible` per mantenere
  fuori dal core gli header di richiesta specifici del provider, i metadati di routing, le patch di ragionamento e
  la policy della cache dei prompt. La sua policy di replay proviene dalla famiglia
  `passthrough-gemini`, mentre la famiglia di stream `openrouter-thinking`
  possiede l'iniezione del ragionamento proxy e gli skip per modello non supportato / `auto`.
- GitHub Copilot usa `catalog`, `auth`, `resolveDynamicModel` e
  `capabilities` più `prepareRuntimeAuth` e `fetchUsageSnapshot` perché
  ha bisogno di login del dispositivo posseduto dal provider, comportamento di fallback del modello, peculiarità della trascrizione di Claude,
  uno scambio token GitHub -> token Copilot e un endpoint di utilizzo posseduto dal provider.
- OpenAI Codex usa `catalog`, `resolveDynamicModel`,
  `normalizeResolvedModel`, `refreshOAuth` e `augmentModelCatalog` più
  `prepareExtraParams`, `resolveUsageAuth` e `fetchUsageSnapshot` perché
  continua a essere eseguito sui trasporti OpenAI del core ma possiede la propria normalizzazione di trasporto/base URL,
  la policy di fallback del refresh OAuth, la scelta del trasporto predefinito,
  righe sintetiche del catalogo Codex e l'integrazione con l'endpoint di utilizzo ChatGPT; condivide
  la stessa famiglia di stream `openai-responses-defaults` di OpenAI diretto.
- Google AI Studio e Gemini CLI OAuth usano `resolveDynamicModel`,
  `buildReplayPolicy`, `sanitizeReplayHistory`,
  `resolveReasoningOutputMode`, `wrapStreamFn` e `isModernModelRef` perché la
  famiglia di replay `google-gemini` possiede il fallback forward-compat di Gemini 3.1,
  la validazione nativa del replay Gemini, la sanitizzazione del replay bootstrap, la modalità
  di output del ragionamento con tag e l'abbinamento di modelli moderni, mentre la
  famiglia di stream `google-thinking` possiede la normalizzazione del payload di thinking di Gemini;
  Gemini CLI OAuth usa anche `formatApiKey`, `resolveUsageAuth` e
  `fetchUsageSnapshot` per la formattazione del token, il parsing del token e il collegamento
  dell'endpoint quota.
- Anthropic Vertex usa `buildReplayPolicy` attraverso la
  famiglia di replay `anthropic-by-model` in modo che la pulizia del replay specifica di Claude resti
  limitata agli id Claude invece che a ogni trasporto `anthropic-messages`.
- Amazon Bedrock usa `buildReplayPolicy`, `matchesContextOverflowError`,
  `classifyFailoverReason` e `resolveThinkingProfile` perché possiede
  la classificazione specifica di Bedrock degli errori di throttle/not-ready/context-overflow
  per il traffico Anthropic-on-Bedrock; la sua policy di replay condivide comunque la stessa
  protezione `anthropic-by-model` solo-Claude.
- OpenRouter, Kilocode, Opencode e Opencode Go usano `buildReplayPolicy`
  attraverso la famiglia di replay `passthrough-gemini` perché fanno da proxy ai modelli Gemini
  tramite trasporti compatibili con OpenAI e hanno bisogno della sanitizzazione della
  thought-signature di Gemini senza validazione nativa del replay Gemini o
  riscritture bootstrap.
- MiniMax usa `buildReplayPolicy` attraverso la
  famiglia di replay `hybrid-anthropic-openai` perché un provider possiede sia
  la semantica di messaggi Anthropic sia quella compatibile con OpenAI; mantiene l'eliminazione
  dei blocchi di thinking solo-Claude sul lato Anthropic mentre sovrascrive la modalità di
  output del ragionamento tornando a quella nativa, e la famiglia di stream `minimax-fast-mode` possiede
  le riscritture del modello fast-mode sul percorso di stream condiviso.
- Moonshot usa `catalog`, `resolveThinkingProfile` e `wrapStreamFn` perché continua a usare il
  trasporto OpenAI condiviso ma ha bisogno della normalizzazione del payload di thinking posseduta dal provider; la
  famiglia di stream `moonshot-thinking` mappa configurazione più stato `/think` sul suo
  payload nativo di thinking binario.
- Kilocode usa `catalog`, `capabilities`, `wrapStreamFn` e
  `isCacheTtlEligible` perché ha bisogno di header di richiesta posseduti dal provider,
  normalizzazione del payload di ragionamento, hint di trascrizione Gemini e gating TTL della cache Anthropic; la famiglia di stream `kilocode-thinking` mantiene l'iniezione del thinking Kilo
  sul percorso di stream proxy condiviso saltando `kilo/auto` e
  altri id modello proxy che non supportano payload di ragionamento espliciti.
- Z.AI usa `resolveDynamicModel`, `prepareExtraParams`, `wrapStreamFn`,
  `isCacheTtlEligible`, `resolveThinkingProfile`, `isModernModelRef`,
  `resolveUsageAuth` e `fetchUsageSnapshot` perché possiede il fallback GLM-5,
  i valori predefiniti di `tool_stream`, l'UX del thinking binario, l'abbinamento di modelli moderni e sia
  l'autenticazione di utilizzo sia il recupero della quota; la famiglia di stream `tool-stream-default-on` mantiene
  il wrapper `tool_stream` con default attivo fuori dal glue scritto a mano per singolo provider.
- xAI usa `normalizeResolvedModel`, `normalizeTransport`,
  `contributeResolvedModelCompat`, `prepareExtraParams`, `wrapStreamFn`,
  `resolveSyntheticAuth`, `resolveDynamicModel` e `isModernModelRef`
  perché possiede la normalizzazione del trasporto nativo xAI Responses, le riscritture
  degli alias fast-mode di Grok, il valore predefinito `tool_stream`, la pulizia
  di strict-tool / payload di ragionamento, il riutilizzo dell'autenticazione di fallback per strumenti posseduti dal plugin, la risoluzione forward-compat dei modelli Grok
  e patch di compatibilità possedute dal provider come il profilo
  dello schema strumenti xAI, parole chiave di schema non supportate, `web_search` nativo e la
  decodifica degli argomenti delle chiamate strumento con entità HTML.
- Mistral, OpenCode Zen e OpenCode Go usano solo `capabilities` per mantenere
  fuori dal core le peculiarità di trascrizione/strumenti.
- I provider bundled solo catalogo come `byteplus`, `cloudflare-ai-gateway`,
  `huggingface`, `kimi-coding`, `nvidia`, `qianfan`,
  `synthetic`, `together`, `venice`, `vercel-ai-gateway` e `volcengine` usano
  solo `catalog`.
- Qwen usa `catalog` per il suo provider di testo più registrazioni condivise di comprensione dei contenuti multimediali e
  generazione video per le sue superfici multimodali.
- MiniMax e Xiaomi usano `catalog` più hook di utilizzo perché il loro comportamento `/usage`
  è posseduto dal plugin anche se l'inferenza continua a passare attraverso i trasporti condivisi.

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
- Usa la configurazione `messages.tts` del core e la selezione del provider.
- Restituisce buffer audio PCM + sample rate. I plugin devono ricampionare/codificare per i provider.
- `listVoices` è opzionale per provider. Usalo per selettori di voce posseduti dal fornitore o flussi di setup.
- Gli elenchi di voci possono includere metadati più ricchi come locale, genere e tag di personalità per selettori consapevoli del provider.
- OpenAI ed ElevenLabs supportano oggi la telefonia. Microsoft no.

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

- Mantieni nel core la policy TTS, il fallback e la consegna della risposta.
- Usa i provider voce per il comportamento di sintesi posseduto dal fornitore.
- L'input legacy Microsoft `edge` viene normalizzato nell'id provider `microsoft`.
- Il modello di proprietà preferito è orientato all'azienda: un plugin di un solo fornitore può possedere
  provider di testo, voce, immagini e futuri contenuti multimediali man mano che OpenClaw aggiunge questi
  contratti di capacità.

Per la comprensione di immagini/audio/video, i plugin registrano un unico provider tipizzato di
comprensione dei contenuti multimediali invece di un contenitore generico chiave/valore:

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

- Mantieni nel core orchestrazione, fallback, configurazione e collegamento dei canali.
- Mantieni il comportamento del fornitore nel plugin provider.
- L'espansione additiva dovrebbe restare tipizzata: nuovi metodi opzionali, nuovi
  campi risultato opzionali, nuove capacità opzionali.
- La generazione di video segue già lo stesso schema:
  - il core possiede il contratto di capacità e l'helper di runtime
  - i plugin dei fornitori registrano `api.registerVideoGenerationProvider(...)`
  - i plugin di funzionalità/canale consumano `api.runtime.videoGeneration.*`

Per gli helper di runtime di comprensione dei contenuti multimediali, i plugin possono chiamare:

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

Per la trascrizione audio, i plugin possono usare sia il runtime di comprensione dei contenuti multimediali
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

- `api.runtime.mediaUnderstanding.*` è la superficie condivisa preferita per la
  comprensione di immagini/audio/video.
- Usa la configurazione audio di comprensione dei contenuti multimediali del core (`tools.media.audio`) e l'ordine di fallback del provider.
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
- OpenClaw rispetta questi campi di override solo per chiamanti attendibili.
- Per esecuzioni di fallback possedute dal plugin, gli operatori devono aderire esplicitamente con `plugins.entries.<id>.subagent.allowModelOverride: true`.
- Usa `plugins.entries.<id>.subagent.allowedModels` per limitare i plugin attendibili a specifici target canonici `provider/model`, oppure `"*"` per consentire esplicitamente qualsiasi target.
- Le esecuzioni di subagent di plugin non attendibili continuano a funzionare, ma le richieste di override vengono rifiutate invece di ricadere silenziosamente su un fallback.

Per la ricerca web, i plugin possono consumare l'helper di runtime condiviso invece di
entrare nel wiring dello strumento dell'agente:

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
- Usa provider di ricerca web per trasporti di ricerca specifici del fornitore.
- `api.runtime.webSearch.*` è la superficie condivisa preferita per plugin di funzionalità/canale che hanno bisogno del comportamento di ricerca senza dipendere dal wrapper dello strumento dell'agente.

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
- `auth`: obbligatorio. Usa `"gateway"` per richiedere la normale autenticazione del Gateway, oppure `"plugin"` per autenticazione/verifica Webhook gestita dal plugin.
- `match`: opzionale. `"exact"` (predefinito) oppure `"prefix"`.
- `replaceExisting`: opzionale. Consente allo stesso plugin di sostituire la propria registrazione di route esistente.
- `handler`: restituisce `true` quando la route ha gestito la richiesta.

Note:

- `api.registerHttpHandler(...)` è stato rimosso e causerà un errore di caricamento del plugin. Usa invece `api.registerHttpRoute(...)`.
- Le route dei plugin devono dichiarare esplicitamente `auth`.
- I conflitti esatti `path + match` vengono rifiutati a meno che non sia impostato `replaceExisting: true`, e un plugin non può sostituire la route di un altro plugin.
- Le route sovrapposte con livelli `auth` diversi vengono rifiutate. Mantieni catene di fallthrough `exact`/`prefix` solo allo stesso livello di autenticazione.
- Le route `auth: "plugin"` **non** ricevono automaticamente scope di runtime dell'operatore. Sono pensate per Webhook/verifica della firma gestiti dal plugin, non per chiamate helper privilegiate del Gateway.
- Le route `auth: "gateway"` vengono eseguite all'interno di uno scope di runtime della richiesta Gateway, ma quello scope è intenzionalmente prudente:
  - l'autenticazione bearer con secret condiviso (`gateway.auth.mode = "token"` / `"password"`) mantiene gli scope di runtime delle route del plugin bloccati su `operator.write`, anche se il chiamante invia `x-openclaw-scopes`
  - le modalità HTTP attendibili che trasportano identità (per esempio `trusted-proxy` oppure `gateway.auth.mode = "none"` su un ingresso privato) rispettano `x-openclaw-scopes` solo quando l'header è esplicitamente presente
  - se `x-openclaw-scopes` è assente in quelle richieste di route plugin che trasportano identità, lo scope di runtime ricade su `operator.write`
- Regola pratica: non presumere che una route plugin con autenticazione gateway sia implicitamente una superficie admin. Se la tua route ha bisogno di comportamento solo admin, richiedi una modalità di autenticazione che trasporta identità e documenta il contratto esplicito dell'header `x-openclaw-scopes`.

## Percorsi di importazione dell'SDK del plugin

Usa i sottopercorsi dell'SDK invece dell'importazione monolitica `openclaw/plugin-sdk` quando
scrivi plugin:

- `openclaw/plugin-sdk/plugin-entry` per primitive di registrazione del plugin.
- `openclaw/plugin-sdk/core` per il contratto generico condiviso rivolto al plugin.
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
  `openclaw/plugin-sdk/webhook-ingress` per il wiring condiviso di setup/autenticazione/risposta/Webhook.
  `channel-inbound` è la home condivisa per debounce, matching delle menzioni,
  helper di policy delle menzioni in ingresso, formattazione dell'envelope e helper di contesto
  dell'envelope in ingresso.
  `channel-setup` è il seam di setup ristretto per installazione opzionale.
  `setup-runtime` è la superficie di setup sicura a runtime usata da `setupEntry` /
  avvio differito, inclusi gli adapter patch di setup sicuri per l'importazione.
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
  `telegram-command-config` è il seam pubblico ristretto per normalizzazione/validazione dei
  comandi personalizzati di Telegram e resta disponibile anche se la
  superficie di contratto Telegram bundled è temporaneamente non disponibile.
  `text-runtime` è il seam condiviso di testo/markdown/logging, incluso
  lo stripping del testo visibile all'assistente, helper di rendering/chunking markdown, helper di redazione,
  helper dei tag di direttiva e utility di testo sicuro.
- I seam di canale specifici per approvazione dovrebbero preferire un unico contratto
  `approvalCapability` sul plugin. Il core legge quindi autenticazione, consegna, rendering,
  native-routing e comportamento lazy del native-handler dell'approvazione attraverso quell'unica capacità
  invece di mescolare il comportamento di approvazione in campi di plugin non correlati.
- `openclaw/plugin-sdk/channel-runtime` è deprecato e rimane solo come
  shim di compatibilità per plugin più vecchi. Il nuovo codice dovrebbe importare invece le primitive generiche più ristrette, e il codice del repo non dovrebbe aggiungere nuovi import dello
  shim.
- Gli interni delle estensioni bundled restano privati. I plugin esterni dovrebbero usare solo
  i sottopercorsi `openclaw/plugin-sdk/*`. Il codice core/test di OpenClaw può usare i
  punti di ingresso pubblici del repo sotto la root di un pacchetto plugin come `index.js`, `api.js`,
  `runtime-api.js`, `setup-entry.js` e file con ambito ristretto come
  `login-qr-api.js`. Non importare mai `src/*` di un pacchetto plugin dal core o da
  un'altra estensione.
- Divisione dei punti di ingresso del repo:
  `<plugin-package-root>/api.js` è il barrel di helper/tipi,
  `<plugin-package-root>/runtime-api.js` è il barrel solo runtime,
  `<plugin-package-root>/index.js` è l'entry del plugin bundled,
  e `<plugin-package-root>/setup-entry.js` è l'entry del plugin di setup.
- Esempi attuali di provider bundled:
  - Anthropic usa `api.js` / `contract-api.js` per helper di stream Claude come
    `wrapAnthropicProviderStream`, helper per header beta e parsing di `service_tier`.
  - OpenAI usa `api.js` per builder di provider, helper di modelli predefiniti e
    builder di provider realtime.
  - OpenRouter usa `api.js` per il suo builder provider più helper di onboarding/configurazione,
    mentre `register.runtime.js` può comunque riesportare helper generici
    `plugin-sdk/provider-stream` per uso locale al repo.
- I punti di ingresso pubblici caricati tramite facade preferiscono lo snapshot di configurazione runtime attivo
  quando ne esiste uno, poi ricadono sulla configurazione risolta su disco quando
  OpenClaw non sta ancora servendo uno snapshot di runtime.
- Le primitive generiche condivise restano il contratto SDK pubblico preferito. Esiste ancora un piccolo
  insieme di compatibilità riservato di seam helper brandizzati per canali bundled. Trattali come seam di manutenzione bundled/compatibilità, non come nuovi target di importazione per terze parti; i nuovi contratti cross-channel dovrebbero comunque essere introdotti su sottopercorsi generici `plugin-sdk/*` o nei barrel locali del plugin `api.js` /
  `runtime-api.js`.

Nota sulla compatibilità:

- Evita il barrel root `openclaw/plugin-sdk` nel nuovo codice.
- Preferisci prima le primitive stabili e ristrette. I più recenti sottopercorsi setup/pairing/reply/
  feedback/contract/inbound/threading/command/secret-input/webhook/infra/
  allowlist/status/message-tool sono il contratto previsto per il nuovo
  lavoro su plugin bundled ed esterni.
  Il parsing/matching del target appartiene a `openclaw/plugin-sdk/channel-targets`.
  I gate delle azioni di messaggio e gli helper per message-id delle reazioni appartengono a
  `openclaw/plugin-sdk/channel-actions`.
- I barrel helper specifici delle estensioni bundled non sono stabili per impostazione predefinita. Se un
  helper serve solo a un'estensione bundled, tienilo dietro il seam locale
  `api.js` o `runtime-api.js` dell'estensione invece di promuoverlo in
  `openclaw/plugin-sdk/<extension>`.
- I nuovi seam helper condivisi dovrebbero essere generici, non brandizzati per canale. Il parsing condiviso
  del target appartiene a `openclaw/plugin-sdk/channel-targets`; gli interni specifici del canale
  restano dietro il seam locale `api.js` o `runtime-api.js` del plugin proprietario.
- I sottopercorsi specifici per capacità come `image-generation`,
  `media-understanding` e `speech` esistono perché i plugin bundled/nativi li usano
  oggi. La loro presenza non significa di per sé che ogni helper esportato sia un
  contratto esterno congelato a lungo termine.

## Schemi dello strumento message

I plugin dovrebbero possedere i contributi di schema `describeMessageTool(...)` specifici del canale.
Mantieni i campi specifici del provider nel plugin, non nel core condiviso.

Per frammenti di schema portabili condivisi, riutilizza gli helper generici esportati tramite
`openclaw/plugin-sdk/channel-actions`:

- `createMessageToolButtonsSchema()` per payload in stile griglia di pulsanti
- `createMessageToolCardSchema()` per payload di card strutturate

Se una forma di schema ha senso solo per un provider, definiscila nel sorgente
di quel plugin invece di promuoverla nell'SDK condiviso.

## Risoluzione del target del canale

I plugin di canale dovrebbero possedere la semantica del target specifica del canale. Mantieni generico l'host
outbound condiviso e usa la superficie dell'adapter di messaggistica per le regole del provider:

- `messaging.inferTargetChatType({ to })` decide se un target normalizzato
  deve essere trattato come `direct`, `group` o `channel` prima della ricerca nella directory.
- `messaging.targetResolver.looksLikeId(raw, normalized)` dice al core se un
  input deve saltare direttamente alla risoluzione tipo-id invece che alla ricerca nella directory.
- `messaging.targetResolver.resolveTarget(...)` è il fallback del plugin quando
  il core ha bisogno di una risoluzione finale posseduta dal provider dopo la normalizzazione o dopo un
  mancato risultato nella directory.
- `messaging.resolveOutboundSessionRoute(...)` possiede la costruzione della route di sessione specifica del provider
  una volta risolto un target.

Suddivisione consigliata:

- Usa `inferTargetChatType` per decisioni di categoria che dovrebbero avvenire prima della
  ricerca tra peer/gruppi.
- Usa `looksLikeId` per controlli del tipo "tratta questo come un id target esplicito/nativo".
- Usa `resolveTarget` per fallback di normalizzazione specifico del provider, non per
  una ricerca ampia nella directory.
- Mantieni id nativi del provider come chat id, thread id, JID, handle e room
  id all'interno dei valori `target` o nei parametri specifici del provider, non in campi SDK generici.

## Directory supportate dalla configurazione

I plugin che derivano voci di directory dalla configurazione dovrebbero mantenere questa logica nel
plugin e riutilizzare gli helper condivisi da
`openclaw/plugin-sdk/directory-runtime`.

Usa questo approccio quando un canale ha peer/gruppi supportati dalla configurazione, come:

- peer DM guidati da allowlist
- mappe configurate di canali/gruppi
- fallback statici di directory con ambito account

Gli helper condivisi in `directory-runtime` gestiscono solo operazioni generiche:

- filtro delle query
- applicazione dei limiti
- helper di deduplicazione/normalizzazione
- costruzione di `ChannelDirectoryEntry[]`

L'ispezione dell'account e la normalizzazione degli id specifiche del canale dovrebbero restare
nell'implementazione del plugin.

## Cataloghi dei provider

I plugin provider possono definire cataloghi di modelli per l'inferenza con
`registerProvider({ catalog: { run(...) { ... } } })`.

`catalog.run(...)` restituisce la stessa forma che OpenClaw scrive in
`models.providers`:

- `{ provider }` per una voce provider
- `{ providers }` per più voci provider

Usa `catalog` quando il plugin possiede id modello specifici del provider, valori predefiniti di base URL
o metadati del modello protetti da autenticazione.

`catalog.order` controlla quando il catalogo di un plugin viene unito rispetto ai
provider impliciti integrati di OpenClaw:

- `simple`: provider semplici con chiave API o guidati da env
- `profile`: provider che compaiono quando esistono profili di autenticazione
- `paired`: provider che sintetizzano più voci provider correlate
- `late`: ultimo passaggio, dopo gli altri provider impliciti

I provider successivi vincono in caso di collisione di chiave, quindi i plugin possono intenzionalmente sovrascrivere una voce provider integrata con lo stesso id provider.

Compatibilità:

- `discovery` continua a funzionare come alias legacy
- se sono registrati sia `catalog` sia `discovery`, OpenClaw usa `catalog`

## Ispezione del canale in sola lettura

Se il tuo plugin registra un canale, preferisci implementare
`plugin.config.inspectAccount(cfg, accountId)` insieme a `resolveAccount(...)`.

Perché:

- `resolveAccount(...)` è il percorso di runtime. Può presumere che le credenziali
  siano completamente materializzate e può fallire rapidamente quando mancano segreti richiesti.
- I percorsi dei comandi in sola lettura come `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve` e i flussi di doctor/riparazione
  della configurazione non dovrebbero aver bisogno di materializzare credenziali di runtime solo per
  descrivere la configurazione.

Comportamento consigliato per `inspectAccount(...)`:

- Restituisci solo uno stato descrittivo dell'account.
- Mantieni `enabled` e `configured`.
- Includi campi di origine/stato delle credenziali quando rilevanti, come:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- Non è necessario restituire valori di token raw solo per riportare la disponibilità in sola lettura. Restituire `tokenStatus: "available"` (e il corrispondente campo di origine) è sufficiente per comandi di tipo stato.
- Usa `configured_unavailable` quando una credenziale è configurata tramite SecretRef ma
  non disponibile nel percorso del comando corrente.

Questo consente ai comandi in sola lettura di riportare "configurato ma non disponibile in questo percorso di comando"
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

Ogni entry diventa un plugin. Se il pack elenca più estensioni, l'id del plugin
diventa `name/<fileBase>`.

Se il tuo plugin importa dipendenze npm, installale in quella directory in modo che
`node_modules` sia disponibile (`npm install` / `pnpm install`).

Guardrail di sicurezza: ogni entry `openclaw.extensions` deve restare all'interno della directory del plugin
dopo la risoluzione dei symlink. Le entry che escono dalla directory del pacchetto vengono
rifiutate.

Nota di sicurezza: `openclaw plugins install` installa le dipendenze del plugin con
`npm install --omit=dev --ignore-scripts` (nessuno script lifecycle, nessuna dipendenza di sviluppo a runtime). Mantieni gli alberi delle dipendenze del plugin "pure JS/TS" ed evita pacchetti che richiedono build `postinstall`.

Facoltativo: `openclaw.setupEntry` può puntare a un modulo leggero solo setup.
Quando OpenClaw ha bisogno di superfici di setup per un plugin di canale disabilitato, oppure
quando un plugin di canale è abilitato ma ancora non configurato, carica `setupEntry`
invece dell'entry completa del plugin. Questo rende avvio e setup più leggeri
quando l'entry principale del plugin collega anche strumenti, hook o altro codice solo runtime.

Facoltativo: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`
può fare opt-in di un plugin di canale allo stesso percorso `setupEntry` durante la fase di
avvio pre-listen del gateway, anche quando il canale è già configurato.

Usalo solo quando `setupEntry` copre completamente la superficie di avvio che deve esistere
prima che il gateway inizi l'ascolto. In pratica, questo significa che l'entry di setup
deve registrare ogni capacità posseduta dal canale da cui dipende l'avvio, come:

- la registrazione del canale stesso
- eventuali route HTTP che devono essere disponibili prima che il gateway inizi l'ascolto
- eventuali metodi gateway, strumenti o servizi che devono esistere durante quella stessa finestra

Se la tua entry completa possiede ancora qualche capacità di avvio richiesta, non abilitare
questo flag. Mantieni il comportamento predefinito del plugin e lascia che OpenClaw carichi la
entry completa durante l'avvio.

I canali bundled possono anche pubblicare helper di superficie contrattuale solo setup che il core
può consultare prima che il runtime completo del canale venga caricato. L'attuale superficie
di promozione del setup è:

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Il core usa questa superficie quando deve promuovere una configurazione di canale legacy a account singolo
in `channels.<id>.accounts.*` senza caricare l'entry completa del plugin.
Matrix è l'esempio bundled attuale: sposta solo chiavi di autenticazione/bootstrap in un
account promosso con nome quando esistono già account con nome, e può preservare una
chiave di account predefinita configurata non canonica invece di creare sempre
`accounts.default`.

Quegli adapter di patch del setup mantengono lazy l'individuazione della superficie contrattuale bundled. Il tempo
di importazione resta leggero; la superficie di promozione viene caricata solo al primo utilizzo invece di
rientrare nell'avvio del canale bundled all'import del modulo.

Quando quelle superfici di avvio includono metodi RPC del Gateway, mantienili su un
prefisso specifico del plugin. I namespace admin del core (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) restano riservati e vengono sempre risolti
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

I plugin di canale possono pubblicizzare metadati di setup/individuazione tramite `openclaw.channel` e
hint di installazione tramite `openclaw.install`. Questo mantiene il catalogo del core privo di dati.

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

Campi utili di `openclaw.channel` oltre l'esempio minimo:

- `detailLabel`: etichetta secondaria per superfici più ricche di catalogo/stato
- `docsLabel`: sovrascrive il testo del link per il link alla documentazione
- `preferOver`: id di plugin/canale a priorità inferiore che questa voce di catalogo dovrebbe superare
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: controlli del testo della superficie di selezione
- `markdownCapable`: contrassegna il canale come compatibile con Markdown per le decisioni di formattazione outbound
- `exposure.configured`: nasconde il canale dalle superfici di elenco dei canali configurati quando impostato su `false`
- `exposure.setup`: nasconde il canale dai selettori interattivi di setup/configurazione quando impostato su `false`
- `exposure.docs`: contrassegna il canale come interno/privato per le superfici di navigazione della documentazione
- `showConfigured` / `showInSetup`: alias legacy ancora accettati per compatibilità; preferire `exposure`
- `quickstartAllowFrom`: fa opt-in del canale al flusso standard quickstart `allowFrom`
- `forceAccountBinding`: richiede binding esplicito dell'account anche quando esiste un solo account
- `preferSessionLookupForAnnounceTarget`: preferisce la ricerca della sessione quando risolve target di annuncio

OpenClaw può anche unire **cataloghi di canali esterni** (per esempio, un'esportazione di registro
MPM). Inserisci un file JSON in uno di questi percorsi:

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

Usa questo approccio quando il tuo plugin deve sostituire o estendere la pipeline di contesto predefinita
invece di limitarsi ad aggiungere ricerca nella memoria o hook.

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
il sistema dei plugin con un accesso privato interno. Aggiungi la capacità mancante.

Sequenza consigliata:

1. definire il contratto del core
   Decidi quale comportamento condiviso deve possedere il core: policy, fallback, unione della configurazione,
   ciclo di vita, semantica rivolta al canale e forma dell'helper di runtime.
2. aggiungere superfici tipizzate di registrazione/runtime del plugin
   Estendi `OpenClawPluginApi` e/o `api.runtime` con la più piccola superficie di capacità
   tipizzata utile.
3. collegare i consumer del core + canale/funzionalità
   I plugin di canale e di funzionalità dovrebbero consumare la nuova capacità attraverso il core,
   non importando direttamente un'implementazione del fornitore.
4. registrare le implementazioni dei fornitori
   I plugin dei fornitori registrano quindi i propri backend rispetto alla capacità.
5. aggiungere copertura contrattuale
   Aggiungi test in modo che la proprietà e la forma della registrazione restino esplicite nel tempo.

È così che OpenClaw resta opinionato senza diventare codificato rigidamente secondo
la visione del mondo di un solo fornitore. Vedi il [Capability Cookbook](/it/plugins/architecture)
per una checklist concreta dei file e un esempio completo.

### Checklist per le capacità

Quando aggiungi una nuova capacità, l'implementazione di solito dovrebbe toccare insieme queste
superfici:

- tipi di contratto del core in `src/<capability>/types.ts`
- runner/helper di runtime del core in `src/<capability>/runtime.ts`
- superficie di registrazione dell'API plugin in `src/plugins/types.ts`
- wiring del registro dei plugin in `src/plugins/registry.ts`
- esposizione del runtime del plugin in `src/plugins/runtime/*` quando i plugin di funzionalità/canale
  devono consumarla
- helper di acquisizione/test in `src/test-utils/plugin-registration.ts`
- asserzioni di proprietà/contratto in `src/plugins/contracts/registry.ts`
- documentazione per operatori/plugin in `docs/`

Se manca una di queste superfici, di solito è segno che la capacità
non è ancora completamente integrata.

### Modello per le capacità

Schema minimo:

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

Schema di test del contratto:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

Questo mantiene semplice la regola:

- il core possiede il contratto di capacità + l'orchestrazione
- i plugin dei fornitori possiedono le implementazioni del fornitore
- i plugin di funzionalità/canale consumano helper di runtime
- i test di contratto mantengono esplicita la proprietà
