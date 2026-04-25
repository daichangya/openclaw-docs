---
read_when:
    - Creazione o debug di Plugin OpenClaw nativi
    - Comprendere il modello di capacità dei Plugin o i confini di ownership
    - Lavorare sulla pipeline di caricamento o sul registry dei Plugin
    - Implementazione di hook runtime del provider o Plugin canale
sidebarTitle: Internals
summary: 'Interni dei Plugin: modello di capacità, ownership, contratti, pipeline di caricamento e helper runtime'
title: Interni dei Plugin
x-i18n:
    generated_at: "2026-04-25T13:51:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1fd7d9192c8c06aceeb6e8054a740bba27c94770e17eabf064627adda884e77
    source_path: plugins/architecture.md
    workflow: 15
---

Questo è il **riferimento architetturale approfondito** per il sistema Plugin di OpenClaw. Per
guide pratiche, inizia da una delle pagine mirate qui sotto.

<CardGroup cols={2}>
  <Card title="Installare e usare Plugin" icon="plug" href="/it/tools/plugin">
    Guida per l'utente finale all'aggiunta, abilitazione e risoluzione dei problemi dei Plugin.
  </Card>
  <Card title="Creare Plugin" icon="rocket" href="/it/plugins/building-plugins">
    Tutorial del primo Plugin con il manifest funzionante più piccolo.
  </Card>
  <Card title="Plugin canale" icon="comments" href="/it/plugins/sdk-channel-plugins">
    Crea un Plugin canale di messaggistica.
  </Card>
  <Card title="Plugin provider" icon="microchip" href="/it/plugins/sdk-provider-plugins">
    Crea un Plugin provider di modelli.
  </Card>
  <Card title="Panoramica SDK" icon="book" href="/it/plugins/sdk-overview">
    Mappa degli import e riferimento API di registrazione.
  </Card>
</CardGroup>

## Modello di capacità pubblico

Le capacità sono il modello pubblico dei **Plugin nativi** all'interno di OpenClaw. Ogni
Plugin OpenClaw nativo si registra rispetto a uno o più tipi di capacità:

| Capacità               | Metodo di registrazione                         | Plugin di esempio                    |
| ---------------------- | ----------------------------------------------- | ------------------------------------ |
| Inferenza testo        | `api.registerProvider(...)`                     | `openai`, `anthropic`                |
| Backend inferenza CLI  | `api.registerCliBackend(...)`                   | `openai`, `anthropic`                |
| Voce                   | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`            |
| Trascrizione realtime  | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                            |
| Voce realtime          | `api.registerRealtimeVoiceProvider(...)`        | `openai`                             |
| Comprensione media     | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                   |
| Generazione immagini   | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Generazione musicale   | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                  |
| Generazione video      | `api.registerVideoGenerationProvider(...)`      | `qwen`                               |
| Recupero web           | `api.registerWebFetchProvider(...)`             | `firecrawl`                          |
| Ricerca web            | `api.registerWebSearchProvider(...)`            | `google`                             |
| Canale / messaggistica | `api.registerChannel(...)`                      | `msteams`, `matrix`                  |
| Rilevamento Gateway    | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                            |

Un Plugin che registra zero capacità ma fornisce hook, strumenti, servizi di rilevamento
o servizi in background è un Plugin **legacy solo hook**. Questo pattern
è ancora pienamente supportato.

### Posizione sulla compatibilità esterna

Il modello di capacità è integrato nel core e usato oggi dai Plugin nativi/inclusi,
ma la compatibilità dei Plugin esterni richiede ancora una soglia più rigorosa di “è esportato, quindi è congelato”.

| Situazione del Plugin                           | Indicazione                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Plugin esterni esistenti                        | Mantieni funzionanti le integrazioni basate su hook; questa è la baseline di compatibilità.     |
| Nuovi Plugin nativi/inclusi                     | Preferisci la registrazione esplicita di capacità a reach-in specifici del vendor o a nuovi design solo hook. |
| Plugin esterni che adottano la registrazione di capacità | Consentito, ma tratta le superfici helper specifiche della capacità come in evoluzione a meno che la documentazione non le segni come stabili. |

La registrazione di capacità è la direzione prevista. Gli hook legacy restano il
percorso più sicuro senza rotture per i Plugin esterni durante la transizione. I sottopercorsi helper esportati
non sono tutti equivalenti: preferisci contratti documentati e stretti rispetto a esportazioni helper incidentali.

### Forme dei Plugin

OpenClaw classifica ogni Plugin caricato in una forma in base al suo reale
comportamento di registrazione (non solo ai metadati statici):

- **plain-capability**: registra esattamente un tipo di capacità (ad esempio un
  Plugin solo provider come `mistral`).
- **hybrid-capability**: registra più tipi di capacità (ad esempio
  `openai` possiede inferenza testo, voce, comprensione media e generazione immagini).
- **hook-only**: registra solo hook (tipizzati o personalizzati), nessuna capacità,
  strumento, comando o servizio.
- **non-capability**: registra strumenti, comandi, servizi o route ma nessuna
  capacità.

Usa `openclaw plugins inspect <id>` per vedere la forma di un Plugin e la ripartizione delle capacità. Vedi [Riferimento CLI](/it/cli/plugins#inspect) per i dettagli.

### Hook legacy

L'hook `before_agent_start` resta supportato come percorso di compatibilità per
Plugin solo hook. Plugin legacy del mondo reale dipendono ancora da esso.

Direzione:

- mantenerlo funzionante
- documentarlo come legacy
- preferire `before_model_resolve` per il lavoro di override di modello/provider
- preferire `before_prompt_build` per il lavoro di mutazione del prompt
- rimuoverlo solo quando l'uso reale cala e la copertura dei fixture dimostra la sicurezza della migrazione

### Segnali di compatibilità

Quando esegui `openclaw doctor` o `openclaw plugins inspect <id>`, potresti vedere
una di queste etichette:

| Segnale                    | Significato                                                   |
| -------------------------- | ------------------------------------------------------------- |
| **config valid**           | La configurazione viene analizzata correttamente e i Plugin vengono risolti |
| **compatibility advisory** | Il Plugin usa un pattern supportato ma più vecchio (ad es. `hook-only`) |
| **legacy warning**         | Il Plugin usa `before_agent_start`, che è deprecato           |
| **hard error**             | La configurazione non è valida o il Plugin non è riuscito a caricarsi |

Né `hook-only` né `before_agent_start` romperanno oggi il tuo Plugin:
`hook-only` è solo advisory e `before_agent_start` attiva solo un warning. Questi
segnali compaiono anche in `openclaw status --all` e `openclaw plugins doctor`.

## Panoramica dell'architettura

Il sistema Plugin di OpenClaw ha quattro livelli:

1. **Manifest + rilevamento**
   OpenClaw trova i Plugin candidati da percorsi configurati, root di workspace,
   root globali dei Plugin e Plugin inclusi. Il rilevamento legge prima i manifest
   nativi `openclaw.plugin.json` più i manifest bundle supportati.
2. **Abilitazione + convalida**
   Il core decide se un Plugin rilevato è abilitato, disabilitato, bloccato o
   selezionato per uno slot esclusivo come la memoria.
3. **Caricamento runtime**
   I Plugin OpenClaw nativi vengono caricati in-process tramite jiti e registrano
   capacità in un registry centrale. I bundle compatibili vengono normalizzati in
   record del registry senza importare codice runtime.
4. **Consumo delle superfici**
   Il resto di OpenClaw legge il registry per esporre strumenti, canali, setup provider,
   hook, route HTTP, comandi CLI e servizi.

Per la CLI dei Plugin in particolare, il rilevamento dei comandi root è diviso in due fasi:

- i metadati di parse-time provengono da `registerCli(..., { descriptors: [...] })`
- il vero modulo CLI del Plugin può restare lazy e registrarsi alla prima invocazione

Questo mantiene il codice CLI di proprietà del Plugin all'interno del Plugin pur permettendo a OpenClaw
di riservare i nomi dei comandi root prima del parsing.

Il confine di progettazione importante:

- la convalida manifest/config dovrebbe funzionare da metadati **manifest/schema**
  senza eseguire codice del Plugin
- il rilevamento nativo delle capacità può caricare il codice entry del Plugin attendibile per costruire una
  snapshot del registry non attivante
- il comportamento runtime nativo deriva dal percorso `register(api)` del modulo Plugin
  con `api.registrationMode === "full"`

Questa separazione consente a OpenClaw di convalidare la config, spiegare Plugin mancanti/disabilitati e
costruire hint di UI/schema prima che il runtime completo sia attivo.

### Pianificazione dell'attivazione

La pianificazione dell'attivazione fa parte del control plane. I chiamanti possono chiedere quali Plugin
sono rilevanti per un comando, provider, canale, route, harness agente o
capacità concreti prima di caricare registry runtime più ampi.

Il planner mantiene compatibile l'attuale comportamento del manifest:

- i campi `activation.*` sono hint espliciti del planner
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` e gli hook restano fallback di ownership del manifest
- l'API planner solo-id resta disponibile per i chiamanti esistenti
- l'API plan riporta etichette di motivo così la diagnostica può distinguere gli hint espliciti
  dal fallback di ownership

Non trattare `activation` come hook del ciclo di vita o come sostituto di
`register(...)`. Sono metadati usati per restringere il caricamento. Preferisci i campi ownership
quando descrivono già la relazione; usa `activation` solo per hint aggiuntivi del planner.

### Plugin canale e lo strumento message condiviso

I Plugin canale non devono registrare uno strumento separato send/edit/react per
le normali azioni di chat. OpenClaw mantiene un unico strumento `message` condiviso nel core, e
i Plugin canale possiedono il rilevamento e l'esecuzione specifici del canale dietro di esso.

Il confine attuale è:

- il core possiede l'host dello strumento `message` condiviso, il wiring del prompt, il bookkeeping
  di sessione/thread e il dispatch di esecuzione
- i Plugin canale possiedono il rilevamento delle azioni con ambito, il rilevamento delle capacità e qualsiasi
  frammento di schema specifico del canale
- i Plugin canale possiedono la grammatica di conversazione della sessione specifica del provider, ad esempio
  come gli id conversazione codificano gli id thread o ereditano dalle conversazioni genitore
- i Plugin canale eseguono l'azione finale tramite il proprio adattatore di azione

Per i Plugin canale, la superficie SDK è
`ChannelMessageActionAdapter.describeMessageTool(...)`. Questa chiamata di rilevamento unificata
consente a un Plugin di restituire insieme le proprie azioni visibili, capacità e contributi di schema
così questi elementi non divergono.

Quando un parametro dello strumento message specifico del canale trasporta una sorgente media come un
percorso locale o un URL media remoto, il Plugin dovrebbe anche restituire
`mediaSourceParams` da `describeMessageTool(...)`. Il core usa questo elenco esplicito
per applicare la normalizzazione dei percorsi sandbox e gli hint di accesso ai media in uscita
senza hardcodare nomi di parametri posseduti dal Plugin.
Preferisci mappe con ambito d'azione lì, non un unico elenco piatto a livello di canale, così un
parametro media solo profilo non viene normalizzato su azioni non correlate come
`send`.

Il core passa l'ambito runtime in quel passaggio di rilevamento. I campi importanti includono:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- `requesterSenderId` trusted in entrata

Questo è importante per i Plugin sensibili al contesto. Un canale può nascondere o esporre
azioni dello strumento message in base all'account attivo, alla stanza/thread/messaggio corrente o
all'identità trusted del richiedente in entrata senza hardcodare branch specifici del canale nello
strumento `message` del core.

Per questo motivo i cambiamenti di routing dell'embedded-runner sono ancora lavoro del Plugin: il runner è
responsabile di inoltrare l'identità chat/sessione corrente al confine di rilevamento del Plugin così lo
strumento `message` condiviso espone la giusta superficie posseduta dal canale per il turno corrente.

Per gli helper di esecuzione posseduti dal canale, i Plugin inclusi dovrebbero mantenere il runtime di esecuzione
all'interno dei propri moduli di estensione. Il core non possiede più i runtime delle azioni message di Discord,
Slack, Telegram o WhatsApp sotto `src/agents/tools`.
Non pubblichiamo sottopercorsi separati `plugin-sdk/*-action-runtime`, e i Plugin inclusi
dovrebbero importare direttamente il proprio codice runtime locale dai propri moduli
di estensione.

Lo stesso confine si applica in generale alle superfici SDK nominate per provider: il core non dovrebbe
importare barrel di convenienza specifici del canale per estensioni Slack, Discord, Signal,
WhatsApp o simili. Se il core ha bisogno di un comportamento, deve o consumare il barrel
`api.ts` / `runtime-api.ts` del Plugin incluso stesso oppure promuovere l'esigenza
in una capacità generica stretta nello SDK condiviso.

Per i poll in particolare, ci sono due percorsi di esecuzione:

- `outbound.sendPoll` è la baseline condivisa per i canali che rientrano nel modello
  comune dei poll
- `actions.handleAction("poll")` è il percorso preferito per semantiche di poll specifiche del canale o parametri extra dei poll

Il core ora rimanda il parsing condiviso dei poll finché il dispatch dei poll del Plugin non rifiuta
l'azione, così i gestori poll posseduti dal Plugin possono accettare campi di poll specifici del canale
senza essere bloccati prima dal parser generico dei poll.

Vedi [Interni dell'architettura dei Plugin](/it/plugins/architecture-internals) per la sequenza di avvio completa.

## Modello di ownership delle capacità

OpenClaw tratta un Plugin nativo come il confine di ownership per una **azienda** o una
**funzionalità**, non come un insieme eterogeneo di integrazioni non correlate.

Questo significa che:

- un Plugin aziendale dovrebbe di solito possedere tutte le superfici OpenClaw-facing di quell'azienda
- un Plugin funzionalità dovrebbe di solito possedere l'intera superficie della funzionalità che introduce
- i canali dovrebbero consumare capacità condivise del core invece di reimplementare
  il comportamento del provider in modo ad hoc

<Accordion title="Esempi di pattern di ownership nei Plugin inclusi">
  - **Vendor multi-capability**: `openai` possiede inferenza testo, voce, voce
    realtime, comprensione media e generazione immagini. `google` possiede inferenza testo
    più comprensione media, generazione immagini e ricerca web.
    `qwen` possiede inferenza testo più comprensione media e generazione video.
  - **Vendor single-capability**: `elevenlabs` e `microsoft` possiedono la voce;
    `firecrawl` possiede il recupero web; `minimax` / `mistral` / `moonshot` / `zai` possiedono
    i backend di comprensione media.
  - **Plugin funzionalità**: `voice-call` possiede il trasporto delle chiamate, strumenti, CLI, route
    e il bridging Twilio media-stream, ma consuma le capacità condivise di voce, realtime
    transcription e realtime voice invece di importare direttamente Plugin vendor.
</Accordion>

Lo stato finale previsto è:

- OpenAI vive in un unico Plugin anche se copre modelli di testo, voce, immagini e
  in futuro video
- un altro vendor può fare lo stesso per la propria area funzionale
- i canali non si preoccupano di quale Plugin vendor possiede il provider; consumano il
  contratto di capacità condiviso esposto dal core

Questa è la distinzione chiave:

- **plugin** = confine di ownership
- **capability** = contratto del core che più Plugin possono implementare o consumare

Quindi se OpenClaw aggiunge un nuovo dominio come il video, la prima domanda non è
“quale provider dovrebbe hardcodare la gestione del video?”. La prima domanda è “qual è
il contratto di capacità video del core?”. Una volta che quel contratto esiste, i Plugin vendor
possono registrarsi rispetto ad esso e i Plugin canale/funzionalità possono consumarlo.

Se la capacità non esiste ancora, la mossa giusta di solito è:

1. definire nel core la capacità mancante
2. esporla tramite l'API/runtime Plugin in modo tipizzato
3. collegare canali/funzionalità a quella capacità
4. lasciare che i Plugin vendor registrino le implementazioni

Questo mantiene esplicita l'ownership evitando al contempo comportamenti del core che dipendono da un
singolo vendor o da un percorso di codice specifico di un solo Plugin.

### Stratificazione delle capacità

Usa questo modello mentale quando decidi dove deve stare il codice:

- **livello di capacità core**: orchestrazione condivisa, policy, fallback, regole di merge
  della config, semantica di consegna e contratti tipizzati
- **livello Plugin vendor**: API specifiche del vendor, auth, cataloghi modelli, sintesi
  vocale, generazione immagini, futuri backend video, endpoint di utilizzo
- **livello Plugin canale/funzionalità**: integrazione Slack/Discord/voice-call/ecc.
  che consuma capacità core e le presenta su una superficie

Ad esempio, il TTS segue questa forma:

- il core possiede la policy TTS al momento della risposta, l'ordine di fallback, le preferenze e la consegna sul canale
- `openai`, `elevenlabs` e `microsoft` possiedono le implementazioni di sintesi
- `voice-call` consuma l'helper runtime TTS di telefonia

Lo stesso pattern dovrebbe essere preferito per le capacità future.

### Esempio di Plugin aziendale multi-capability

Un Plugin aziendale dovrebbe apparire coeso dall'esterno. Se OpenClaw ha contratti condivisi
per modelli, voce, trascrizione realtime, voce realtime, comprensione media,
generazione immagini, generazione video, recupero web e ricerca web,
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

- un Plugin possiede la superficie del vendor
- il core continua a possedere i contratti di capacità
- i Plugin canale e funzionalità consumano helper `api.runtime.*`, non codice vendor
- i contract test possono verificare che il Plugin abbia registrato le capacità che
  dichiara di possedere

### Esempio di capacità: comprensione video

OpenClaw tratta già la comprensione di immagini/audio/video come un'unica
capacità condivisa. Anche qui si applica lo stesso modello di ownership:

1. il core definisce il contratto di comprensione media
2. i Plugin vendor registrano `describeImage`, `transcribeAudio` e
   `describeVideo` secondo il caso
3. i Plugin canale e funzionalità consumano il comportamento condiviso del core invece di
   collegarsi direttamente al codice vendor

Questo evita di incorporare nel core le ipotesi video di un singolo provider. Il Plugin possiede
la superficie del vendor; il core possiede il contratto di capacità e il comportamento di fallback.

La generazione video usa già questa stessa sequenza: il core possiede il contratto tipizzato
di capacità e l'helper runtime, e i Plugin vendor registrano
implementazioni `api.registerVideoGenerationProvider(...)` rispetto ad esso.

Hai bisogno di una checklist concreta di rollout? Vedi
[Capability Cookbook](/it/plugins/architecture).

## Contratti e enforcement

La superficie API dei Plugin è intenzionalmente tipizzata e centralizzata in
`OpenClawPluginApi`. Quel contratto definisce i punti di registrazione supportati e
gli helper runtime su cui un Plugin può fare affidamento.

Perché questo è importante:

- gli autori di Plugin ottengono uno standard interno stabile
- il core può rifiutare ownership duplicate come due Plugin che registrano lo stesso
  id provider
- l'avvio può mostrare diagnostica azionabile per registrazioni malformate
- i contract test possono far rispettare l'ownership dei Plugin inclusi e prevenire drift silenzioso

Esistono due livelli di enforcement:

1. **enforcement della registrazione runtime**
   Il registry dei Plugin convalida le registrazioni mentre i Plugin vengono caricati. Esempi:
   id provider duplicati, id provider voce duplicati e registrazioni malformate
   producono diagnostica del Plugin invece di comportamento indefinito.
2. **contract test**
   I Plugin inclusi vengono acquisiti nei registry dei contratti durante le esecuzioni di test così
   OpenClaw può verificare esplicitamente l'ownership. Oggi questo è usato per i
   provider di modelli, i provider voce, i provider di ricerca web e l'ownership di registrazione inclusa.

L'effetto pratico è che OpenClaw sa, in anticipo, quale Plugin possiede quale
superficie. Questo consente al core e ai canali di comporsi senza attriti perché l'ownership è
dichiarata, tipizzata e testabile anziché implicita.

### Cosa appartiene a un contratto

I buoni contratti Plugin sono:

- tipizzati
- piccoli
- specifici per capacità
- posseduti dal core
- riutilizzabili da più Plugin
- consumabili da canali/funzionalità senza conoscenza del vendor

I cattivi contratti Plugin sono:

- policy specifiche del vendor nascoste nel core
- vie di fuga ad hoc di un singolo Plugin che aggirano il registry
- codice del canale che entra direttamente in un'implementazione vendor
- oggetti runtime ad hoc che non fanno parte di `OpenClawPluginApi` o
  `api.runtime`

In caso di dubbio, alza il livello di astrazione: definisci prima la capacità, poi
lascia che i Plugin vi si colleghino.

## Modello di esecuzione

I Plugin OpenClaw nativi vengono eseguiti **in-process** con il Gateway. Non sono
in sandbox. Un Plugin nativo caricato ha lo stesso confine di fiducia a livello di processo del codice core.

Implicazioni:

- un Plugin nativo può registrare strumenti, handler di rete, hook e servizi
- un bug di un Plugin nativo può far crashare o destabilizzare il gateway
- un Plugin nativo malevolo equivale a esecuzione arbitraria di codice all'interno del
  processo OpenClaw

I bundle compatibili sono più sicuri per impostazione predefinita perché OpenClaw attualmente li tratta
come pacchetti di metadati/contenuti. Nelle release attuali, questo significa soprattutto
Skills incluse.

Usa allowlist e percorsi espliciti di installazione/caricamento per Plugin non inclusi. Tratta
i Plugin del workspace come codice di sviluppo, non come predefiniti di produzione.

Per i nomi di pacchetto del workspace inclusi, mantieni l'id del Plugin ancorato nel nome npm:
`@openclaw/<id>` per impostazione predefinita, oppure un suffisso tipizzato approvato come
`-provider`, `-plugin`, `-speech`, `-sandbox` o `-media-understanding` quando
il pacchetto espone intenzionalmente un ruolo Plugin più ristretto.

Nota importante sulla fiducia:

- `plugins.allow` si fida degli **id Plugin**, non della provenienza della sorgente.
- Un Plugin del workspace con lo stesso id di un Plugin incluso oscura intenzionalmente
  la copia inclusa quando quel Plugin del workspace è abilitato/in allowlist.
- Questo è normale e utile per sviluppo locale, test di patch e hotfix.
- La fiducia nei Plugin inclusi viene risolta dallo snapshot della sorgente — il manifest e
  il codice su disco al momento del caricamento — anziché dai metadati di installazione. Un record di installazione corrotto
  o sostituito non può ampliare silenziosamente la superficie di fiducia di un Plugin incluso
  oltre ciò che la sorgente reale dichiara.

## Confine di esportazione

OpenClaw esporta capacità, non comodità di implementazione.

Mantieni pubblica la registrazione di capacità. Riduci le esportazioni helper non contrattuali:

- sottopercorsi helper specifici del Plugin incluso
- sottopercorsi di plumbing runtime non pensati come API pubblica
- helper di convenienza specifici del vendor
- helper di setup/onboarding che sono dettagli di implementazione

Alcuni sottopercorsi helper dei Plugin inclusi restano ancora nella mappa di esportazione SDK generata
per compatibilità e manutenzione dei Plugin inclusi. Esempi attuali includono
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` e diverse superfici `plugin-sdk/matrix*`. Trattali come
esportazioni riservate di dettaglio implementativo, non come il pattern SDK consigliato per
nuovi Plugin di terze parti.

## Interni e riferimento

Per la pipeline di caricamento, il modello di registry, gli hook runtime dei provider, le route HTTP del Gateway,
gli schemi degli strumenti message, la risoluzione dei target del canale, i cataloghi provider,
i Plugin motore di contesto e la guida per aggiungere una nuova capacità, vedi
[Interni dell'architettura dei Plugin](/it/plugins/architecture-internals).

## Correlati

- [Creare Plugin](/it/plugins/building-plugins)
- [Setup SDK Plugin](/it/plugins/sdk-setup)
- [Manifest del Plugin](/it/plugins/manifest)
