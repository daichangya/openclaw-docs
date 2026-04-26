---
read_when:
    - Estensione di qa-lab o qa-channel
    - Aggiunta di scenari QA supportati dal repository
    - Creazione di automazione QA a maggiore realismo attorno alla dashboard del Gateway
summary: Forma dell'automazione QA privata per qa-lab, qa-channel, scenari con seed e report di protocollo
title: Automazione QA E2E
x-i18n:
    generated_at: "2026-04-26T11:27:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3803f2bc5cdf2368c3af59b412de8ef732708995a54f7771d3f6f16e8be0592b
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Lo stack QA privato è pensato per esercitare OpenClaw in un modo più realistico,
con forma di canale, di quanto possa fare un singolo test unitario.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggistica sintetico con superfici DM, canale, thread,
  reazione, modifica ed eliminazione.
- `extensions/qa-lab`: UI di debug e bus QA per osservare il transcript,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `qa/`: risorse seed supportate dal repository per l'attività iniziale e gli
  scenari QA di base.

L'attuale flusso operativo QA è un sito QA a due pannelli:

- Sinistra: dashboard del Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra il transcript in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo compila il sito QA, avvia il lane gateway supportato da Docker ed espone la
pagina QA Lab dove un operatore o un ciclo di automazione può assegnare all'agente una missione QA,
osservare il comportamento reale del canale e registrare cosa ha funzionato, cosa è fallito o
cosa è rimasto bloccato.

Per iterare più rapidamente sulla UI di QA Lab senza ricompilare ogni volta l'immagine Docker,
avvia lo stack con un bundle QA Lab montato tramite bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta tramite bind
`extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricompila quel bundle a ogni modifica, e il browser si ricarica automaticamente quando cambia l'hash
delle risorse di QA Lab.

Per un test locale smoke di trace OpenTelemetry, esegui:

```bash
pnpm qa:otel:smoke
```

Questo script avvia un ricevitore locale di trace OTLP/HTTP, esegue lo
scenario QA `otel-trace-smoke` con il Plugin `diagnostics-otel` abilitato, quindi
decodifica gli span protobuf esportati e verifica la forma critica per il rilascio:
devono essere presenti `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery`;
le chiamate al modello non devono esportare `StreamAbandoned` nei turni riusciti; gli ID diagnostici grezzi e
gli attributi `openclaw.content.*` devono restare fuori dalla trace. Scrive
`otel-smoke-summary.json` accanto agli artefatti della suite QA.

Per un lane smoke Matrix reale a livello di trasporto, esegui:

```bash
pnpm openclaw qa matrix
```

Questo lane crea un homeserver Tuwunel usa e getta in Docker, registra utenti
temporanei driver, SUT e osservatore, crea una stanza privata, quindi esegue
il vero Plugin Matrix all'interno di un processo figlio QA del gateway. Il lane di trasporto live mantiene
la configurazione figlia limitata al trasporto in test, quindi Matrix viene eseguito senza
`qa-channel` nella configurazione figlia. Scrive gli artefatti del report strutturato e
un log combinato stdout/stderr nella directory di output QA Matrix selezionata. Per
acquisire anche l'output esterno di compilazione/avvio di `scripts/run-node.mjs`, imposta
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` su un file di log locale al repository.
L'avanzamento di Matrix viene stampato per impostazione predefinita.
`OPENCLAW_QA_MATRIX_TIMEOUT_MS` limita l'intera esecuzione, e `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` limita la pulizia così uno smantellamento Docker bloccato segnala l'esatto comando di recupero invece di bloccarsi.

Per un lane smoke Telegram reale a livello di trasporto, esegui:

```bash
pnpm openclaw qa telegram
```

Questo lane punta a un vero gruppo Telegram privato invece di creare un server
usa e getta. Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, più due bot distinti nello stesso
gruppo privato. Il bot SUT deve avere un nome utente Telegram e l'osservazione
bot-to-bot funziona meglio quando entrambi i bot hanno la modalità Bot-to-Bot Communication Mode
abilitata in `@BotFather`.
Il comando termina con valore diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi gli artefatti senza un codice di uscita di errore.
Il report e il riepilogo Telegram includono l'RTT per risposta dal momento della richiesta di
invio del messaggio del driver fino alla risposta osservata del SUT, a partire dal canary.

Prima di usare credenziali live condivise, esegui:

```bash
pnpm openclaw qa credentials doctor
```

Doctor controlla l'env del broker Convex, valida le impostazioni degli endpoint e verifica
la raggiungibilità admin/list quando è presente il segreto del maintainer. Segnala per i segreti solo lo stato impostato/mancante.

Per un lane smoke Discord reale a livello di trasporto, esegui:

```bash
pnpm openclaw qa discord
```

Questo lane punta a un vero canale guild Discord privato con due bot: un
bot driver controllato dall'harness e un bot SUT avviato dal gateway figlio
OpenClaw tramite il Plugin Discord incluso. Richiede
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
e `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` quando si usano credenziali env.
Il lane verifica la gestione delle menzioni del canale e controlla che il bot SUT abbia
registrato con Discord il comando nativo `/help`.
Il comando termina con valore diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi gli artefatti senza un codice di uscita di errore.

I lane di trasporto live ora condividono un unico contratto più piccolo invece di inventare ciascuno
la propria forma di elenco di scenari.

`qa-channel` resta la suite ampia di comportamento sintetico del prodotto e non fa parte
della matrice di copertura del trasporto live.

| Lane     | Canary | Gating per menzione | Blocco allowlist | Risposta top-level | Ripresa dopo riavvio | Follow-up thread | Isolamento thread | Osservazione reazione | Comando help | Registrazione comando nativo |
| -------- | ------ | ------------------- | ---------------- | ------------------ | -------------------- | ---------------- | ----------------- | --------------------- | ------------- | ---------------------------- |
| Matrix   | x      | x                   | x                | x                  | x                    | x                | x                 | x                     |               |                              |
| Telegram | x      | x                   |                  |                    |                      |                  |                   |                       | x             |                              |
| Discord  | x      | x                   |                  |                    |                      |                  |                   |                       |               | x                            |

Questo mantiene `qa-channel` come ampia suite di comportamento del prodotto mentre Matrix,
Telegram e i futuri trasporti live condividono una checklist esplicita del contratto di trasporto.

Per un lane VM Linux usa e getta senza introdurre Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass pulito, installa le dipendenze, compila OpenClaw
all'interno del guest, esegue `qa suite`, quindi copia il normale report e
riepilogo QA in `.artifacts/qa-e2e/...` sull'host.
Riutilizza lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
Le esecuzioni della suite su host e Multipass eseguono per impostazione predefinita
più scenari selezionati in parallelo con worker gateway isolati. `qa-channel` usa per impostazione predefinita una concorrenza di
4, limitata dal numero di scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, oppure `--concurrency 1` per l'esecuzione seriale.
Il comando termina con valore diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi gli artefatti senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il
guest: chiavi provider basate su env, il percorso della configurazione provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la radice del repository così il guest
può scrivere indietro tramite il workspace montato.

## Seed supportati dal repository

Le risorse seed si trovano in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Questi file sono intenzionalmente in git così il piano QA è visibile sia agli esseri umani sia
all'agente.

`qa-lab` deve restare un esecutore Markdown generico. Ogni file Markdown di scenario è
la fonte di verità per una singola esecuzione di test e deve definire:

- metadati dello scenario
- metadati facoltativi di categoria, capacità, lane e rischio
- riferimenti a documentazione e codice
- requisiti facoltativi del Plugin
- patch di configurazione facoltativa del gateway
- il `qa-flow` eseguibile

La superficie runtime riutilizzabile che supporta `qa-flow` può restare generica
e trasversale. Per esempio, gli scenari Markdown possono combinare helper lato trasporto
con helper lato browser che pilotano la Control UI incorporata tramite la
seam `browser.request` del Gateway senza aggiungere un esecutore speciale per casi specifici.

I file di scenario devono essere raggruppati per capacità del prodotto piuttosto che per cartella
dell'albero del codice sorgente. Mantieni stabili gli ID degli scenari quando i file vengono spostati; usa `docsRefs` e `codeRefs`
per la tracciabilità dell'implementazione.

L'elenco di base deve restare sufficientemente ampio da coprire:

- chat DM e canale
- comportamento dei thread
- ciclo di vita delle azioni del messaggio
- callback cron
- richiamo della memoria
- cambio modello
- handoff del subagent
- lettura del repository e lettura della documentazione
- una piccola attività di compilazione come Lobster Invaders

## Lane mock del provider

`qa suite` ha due lane mock locali del provider:

- `mock-openai` è il mock OpenClaw consapevole dello scenario. Resta il
  lane mock deterministico predefinito per QA supportata dal repository e gate di parità.
- `aimock` avvia un server provider basato su AIMock per copertura sperimentale di protocollo,
  fixture, record/replay e caos. È additivo e non sostituisce il dispatcher
  degli scenari `mock-openai`.

L'implementazione del lane provider si trova sotto `extensions/qa-lab/src/providers/`.
Ogni provider possiede i propri valori predefiniti, l'avvio del server locale, la configurazione del modello gateway,
le esigenze di staging del profilo di autenticazione e i flag di capacità live/mock. Il codice condiviso della suite e del gateway deve instradare tramite il registro dei provider invece di ramificare sui nomi dei provider.

## Adattatori di trasporto

`qa-lab` possiede una seam di trasporto generica per scenari QA Markdown.
`qa-channel` è il primo adattatore su questa seam, ma l'obiettivo progettuale è più ampio:
canali futuri reali o sintetici dovrebbero collegarsi allo stesso esecutore di suite invece di aggiungere un esecutore QA specifico per trasporto.

A livello di architettura, la suddivisione è:

- `qa-lab` possiede l'esecuzione generica degli scenari, la concorrenza dei worker, la scrittura degli artefatti e il reporting.
- l'adattatore di trasporto possiede configurazione gateway, prontezza, osservazione in ingresso e in uscita, azioni di trasporto e stato di trasporto normalizzato.
- i file di scenario Markdown sotto `qa/scenarios/` definiscono l'esecuzione del test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

La guida di adozione per i maintainer degli adattatori di nuovi canali si trova in
[Testing](/it/help/testing#adding-a-channel-to-qa).

## Reporting

`qa-lab` esporta un report di protocollo Markdown dalla timeline del bus osservato.
Il report deve rispondere a:

- Cosa ha funzionato
- Cosa è fallito
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per controlli di carattere e stile, esegui lo stesso scenario con più riferimenti live di modello
e scrivi un report Markdown giudicato:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Il comando esegue processi figli locali del gateway QA, non Docker. Gli scenari di valutazione del carattere
devono impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente
come chat, aiuto nel workspace e piccole attività su file. Al modello candidato
non deve essere detto che è in fase di valutazione. Il comando conserva ogni transcript
completo, registra statistiche di base dell'esecuzione, quindi chiede ai modelli giudici in modalità fast con
ragionamento `xhigh` dove supportato di classificare le esecuzioni per naturalezza, vibe e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del giudice riceve comunque
ogni transcript e stato di esecuzione, ma i riferimenti dei candidati vengono sostituiti con
etichette neutre come `candidate-01`; il report rimappa le classifiche ai riferimenti reali dopo
il parsing.
Le esecuzioni dei candidati usano per impostazione predefinita thinking `high`, con `medium` per GPT-5.5 e `xhigh`
per i riferimenti di valutazione OpenAI meno recenti che lo supportano. Sovrascrivi un candidato specifico inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` continua a impostare un
fallback globale, e la forma precedente `--model-thinking <provider/model=level>` viene
mantenuta per compatibilità.
I riferimenti candidati OpenAI usano per impostazione predefinita la modalità fast così viene utilizzata l'elaborazione prioritaria
laddove il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un
singolo candidato o giudice ha bisogno di un override. Passa `--fast` solo quando vuoi
forzare la modalità fast per ogni modello candidato. Le durate dei candidati e dei giudici vengono
registrate nel report per l'analisi dei benchmark, ma i prompt dei giudici dicono esplicitamente
di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e dei giudici usano entrambe per impostazione predefinita una concorrenza di 16. Riduci
`--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul gateway locale
rendono l'esecuzione troppo rumorosa.
Quando non viene passato alcun `--model` candidato, la valutazione del carattere usa per impostazione predefinita
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i giudici usano per impostazione predefinita
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documenti correlati

- [Testing](/it/help/testing)
- [Canale QA](/it/channels/qa-channel)
- [Dashboard](/it/web/dashboard)
