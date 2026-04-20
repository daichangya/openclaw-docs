---
read_when:
    - Estendere qa-lab o qa-channel
    - Aggiunta di scenari QA supportati dal repository
    - Creazione di automazione QA a maggiore realismo attorno alla dashboard del Gateway
summary: Forma dell'automazione QA privata per qa-lab, qa-channel, scenari con seed e report di protocollo
title: Automazione QA end-to-end
x-i18n:
    generated_at: "2026-04-20T08:30:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34245ce871356caeab0d9e0eeeaa9fb4e408920a4a97ad27567fa365d8db17c7
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automazione QA end-to-end

Lo stack QA privato è pensato per esercitare OpenClaw in un modo più realistico,
con una forma simile ai canali, rispetto a quanto possa fare un singolo test unitario.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggistica sintetico con superfici per messaggi diretti, canale, thread,
  reazioni, modifiche ed eliminazioni.
- `extensions/qa-lab`: interfaccia debugger e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `qa/`: risorse seed supportate dal repository per il task iniziale e gli scenari QA
  di base.

L'attuale flusso operativo QA è un sito QA a due pannelli:

- Sinistra: dashboard del Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo compila il sito QA, avvia la corsia gateway supportata da Docker ed espone la
pagina QA Lab dove un operatore o un ciclo di automazione può assegnare all'agente una
missione QA, osservare il comportamento reale del canale e registrare cosa ha funzionato, cosa è fallito o
cosa è rimasto bloccato.

Per iterazioni più rapide dell'interfaccia di QA Lab senza ricompilare ogni volta l'immagine Docker,
avvia lo stack con un bundle QA Lab montato tramite bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta tramite bind
`extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricompila quel bundle a ogni modifica e il browser si ricarica automaticamente quando cambia l'hash
delle risorse di QA Lab.

Per una corsia smoke Matrix con trasporto reale, esegui:

```bash
pnpm openclaw qa matrix
```

Questa corsia effettua il provisioning di un homeserver Tuwunel usa e getta in Docker, registra
utenti temporanei driver, SUT e observer, crea una stanza privata, quindi esegue
il vero plugin Matrix all'interno di un processo figlio QA del gateway. La corsia con trasporto live mantiene
la configurazione figlia limitata al trasporto in test, così Matrix viene eseguito senza
`qa-channel` nella configurazione figlia. Scrive gli artefatti di report strutturati e
un log combinato stdout/stderr nella directory di output Matrix QA selezionata. Per
acquisire anche l'output esterno di build/launcher di `scripts/run-node.mjs`, imposta
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` su un file di log locale al repository.

Per una corsia smoke Telegram con trasporto reale, esegui:

```bash
pnpm openclaw qa telegram
```

Questa corsia punta a un gruppo privato Telegram reale invece di effettuare il provisioning di un
server usa e getta. Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, oltre a due bot distinti nello stesso
gruppo privato. Il bot SUT deve avere un nome utente Telegram, e l'osservazione tra bot
funziona al meglio quando entrambi i bot hanno la modalità di comunicazione Bot-to-Bot
abilitata in `@BotFather`.
Il comando termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi ottenere gli artefatti senza un codice di uscita di errore.

Le corsie live di trasporto ora condividono un contratto più piccolo invece di inventare
ognuna una propria forma per l'elenco degli scenari:

`qa-channel` rimane la suite ampia di comportamento di prodotto sintetico e non fa parte
della matrice di copertura del trasporto live.

| Corsia   | Canary | Blocco menzioni | Blocco allowlist | Risposta di primo livello | Ripresa dopo riavvio | Follow-up del thread | Isolamento del thread | Osservazione reazioni | Comando help |
| -------- | ------ | --------------- | ---------------- | ------------------------- | -------------------- | ------------------- | --------------------- | --------------------- | ------------ |
| Matrix   | x      | x               | x                | x                         | x                    | x                   | x                     | x                     |              |
| Telegram | x      |                 |                  |                           |                      |                     |                       |                       | x            |

Questo mantiene `qa-channel` come suite ampia di comportamento del prodotto, mentre Matrix,
Telegram e i futuri trasporti live condividono una checklist esplicita di contratto di trasporto.

Per una corsia VM Linux usa e getta senza portare Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass pulito, installa le dipendenze, compila OpenClaw
all'interno del guest, esegue `qa suite`, quindi copia il normale report QA e il
riepilogo di nuovo in `.artifacts/qa-e2e/...` sull'host.
Riutilizza lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
Le esecuzioni host e Multipass della suite eseguono in parallelo per impostazione predefinita
più scenari selezionati con worker gateway isolati. `qa-channel` usa come valore predefinito la concorrenza
4, limitata dal numero di scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, oppure `--concurrency 1` per l'esecuzione seriale.
Il comando termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi ottenere gli artefatti senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il
guest: chiavi provider basate su variabili d'ambiente, il percorso di configurazione del provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la root del repository in modo che il guest
possa scrivere di ritorno attraverso il workspace montato.

## Seed supportati dal repository

Le risorse seed si trovano in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Queste sono intenzionalmente in git così che il piano QA sia visibile sia agli esseri umani sia
all'agente.

`qa-lab` dovrebbe rimanere un runner Markdown generico. Ogni file Markdown di scenario è
la fonte di verità per una singola esecuzione di test e dovrebbe definire:

- metadati dello scenario
- metadati facoltativi di categoria, capacità, corsia e rischio
- riferimenti a documentazione e codice
- requisiti facoltativi dei plugin
- patch facoltativa della configurazione Gateway
- il `qa-flow` eseguibile

La superficie runtime riutilizzabile che supporta `qa-flow` può rimanere generica
e trasversale. Ad esempio, gli scenari Markdown possono combinare helper lato trasporto
con helper lato browser che guidano la Control UI incorporata tramite la seam
Gateway `browser.request` senza aggiungere un runner con casi speciali.

I file di scenario dovrebbero essere raggruppati per capacità del prodotto invece che per cartella
dell'albero sorgente. Mantieni stabili gli ID degli scenari quando i file vengono spostati; usa `docsRefs` e `codeRefs`
per la tracciabilità dell'implementazione.

L'elenco di base dovrebbe rimanere abbastanza ampio da coprire:

- chat in DM e canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback Cron
- richiamo della memoria
- cambio modello
- handoff ai subagenti
- lettura del repository e della documentazione
- un piccolo task di build come Lobster Invaders

## Corsie mock del provider

`qa suite` ha due corsie mock locali del provider:

- `mock-openai` è il mock OpenClaw consapevole dello scenario. Rimane la corsia mock deterministica
  predefinita per la QA supportata dal repository e per i gate di parità.
- `aimock` avvia un server provider basato su AIMock per copertura sperimentale di protocollo,
  fixture, record/replay e chaos. È aggiuntivo e non sostituisce il dispatcher
  di scenari `mock-openai`.

L'implementazione della corsia provider si trova in `extensions/qa-lab/src/providers/`.
Ogni provider possiede i propri valori predefiniti, l'avvio del server locale, la configurazione
del modello gateway, le esigenze di staging del profilo auth e i flag di capacità live/mock. Il codice condiviso della suite e del gateway dovrebbe instradare attraverso il registro dei provider invece di ramificare sui nomi dei provider.

## Adattatori di trasporto

`qa-lab` possiede una seam di trasporto generica per gli scenari QA Markdown.
`qa-channel` è il primo adattatore su quella seam, ma l'obiettivo di progettazione è più ampio:
i futuri canali reali o sintetici dovrebbero collegarsi allo stesso runner di suite
invece di aggiungere un runner QA specifico per il trasporto.

A livello di architettura, la suddivisione è:

- `qa-lab` possiede l'esecuzione generica degli scenari, la concorrenza dei worker, la scrittura degli artefatti e la reportistica.
- l'adattatore di trasporto possiede la configurazione gateway, la readiness, l'osservazione in ingresso e in uscita, le azioni di trasporto e lo stato di trasporto normalizzato.
- i file di scenario Markdown sotto `qa/scenarios/` definiscono l'esecuzione di test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

Le linee guida di adozione rivolte ai maintainer per i nuovi adattatori di canale si trovano in
[Testing](/it/help/testing#adding-a-channel-to-qa).

## Reportistica

`qa-lab` esporta un report di protocollo Markdown dalla timeline del bus osservata.
Il report dovrebbe rispondere a:

- Cosa ha funzionato
- Cosa è fallito
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per i controlli di carattere e stile, esegui lo stesso scenario su più riferimenti di modelli live
e scrivi un report Markdown valutato:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Il comando esegue processi figli locali del gateway QA, non Docker. Gli scenari di valutazione del carattere
dovrebbero impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente
come chat, aiuto nel workspace e piccoli task sui file. Al modello candidato
non dovrebbe essere detto che sta venendo valutato. Il comando conserva ogni trascrizione
completa, registra statistiche di base dell'esecuzione, quindi chiede ai modelli giudici in modalità fast con
ragionamento `xhigh` di classificare le esecuzioni per naturalezza, atmosfera e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del giudice riceve comunque
ogni trascrizione e stato di esecuzione, ma i riferimenti candidati vengono sostituiti con etichette
neutre come `candidate-01`; il report rimappa le classifiche ai riferimenti reali dopo
il parsing.
Le esecuzioni dei candidati usano per impostazione predefinita il thinking `high`, con `xhigh` per i modelli OpenAI che
lo supportano. Sostituisci un candidato specifico inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` imposta comunque
un fallback globale, e la vecchia forma `--model-thinking <provider/model=level>` viene
mantenuta per compatibilità.
I riferimenti candidati OpenAI usano per impostazione predefinita la modalità fast così da usare l'elaborazione prioritaria dove
il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un
singolo candidato o giudice necessita di un override. Passa `--fast` solo quando vuoi
forzare la modalità fast per ogni modello candidato. Le durate di candidati e giudici vengono
registrate nel report per l'analisi comparativa, ma i prompt dei giudici specificano esplicitamente
di non classificare in base alla velocità.
Le esecuzioni sia dei modelli candidati sia di quelli giudici usano entrambe per impostazione predefinita la concorrenza 16. Riduci
`--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul gateway locale
rendono un'esecuzione troppo rumorosa.
Quando non viene passato alcun `--model` candidato, la valutazione del carattere usa per impostazione predefinita
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i giudici usano per impostazione predefinita
`openai/gpt-5.4,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentazione correlata

- [Testing](/it/help/testing)
- [QA Channel](/it/channels/qa-channel)
- [Dashboard](/web/dashboard)
