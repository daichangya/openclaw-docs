---
read_when:
    - Estendere qa-lab o qa-channel
    - Aggiungere scenari QA supportati dal repository
    - Costruire automazione QA a maggiore realismo attorno alla dashboard del Gateway
summary: Struttura dell'automazione QA privata per qa-lab, qa-channel, scenari seed e report di protocollo
title: automazione QA E2E
x-i18n:
    generated_at: "2026-04-25T13:45:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a49e0954845355667617c85340281b6dc1b043857a76d7b303cc0a8b2845a75
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Lo stack QA privato è pensato per esercitare OpenClaw in un modo più realistico,
con la forma di un canale, rispetto a quanto possa fare un singolo unit test.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggi sintetico con superfici DM, canale, thread,
  reazione, modifica ed eliminazione.
- `extensions/qa-lab`: UI di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `qa/`: asset seed supportati dal repository per il task iniziale e gli scenari QA
  di base.

L'attuale flusso dell'operatore QA è un sito QA a due pannelli:

- Sinistra: dashboard del Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo costruisce il sito QA, avvia la corsia gateway supportata da Docker ed espone la
pagina QA Lab dove un operatore o un loop di automazione può assegnare all'agente una
missione QA, osservare il comportamento reale del canale e registrare ciò che ha funzionato, fallito o
è rimasto bloccato.

Per iterare più velocemente sulla UI di QA Lab senza ricostruire ogni volta l'immagine Docker,
avvia lo stack con un bundle QA Lab montato tramite bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta tramite bind
`extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricostruisce quel bundle a ogni modifica e il browser si ricarica automaticamente quando cambia l'hash
degli asset di QA Lab.

Per una corsia smoke Matrix reale sul piano del trasporto, esegui:

```bash
pnpm openclaw qa matrix
```

Quella corsia predispone un homeserver Tuwunel usa e getta in Docker, registra
utenti temporanei driver, SUT e observer, crea una stanza privata, quindi esegue
il vero Plugin Matrix all'interno di un child gateway QA. La corsia di trasporto live mantiene
la configurazione del child limitata al trasporto in test, così Matrix viene eseguito senza
`qa-channel` nella configurazione del child. Scrive gli artifact del report strutturato e
un log combinato stdout/stderr nella directory di output Matrix QA selezionata. Per
acquisire anche l'output di build/launcher esterno di `scripts/run-node.mjs`, imposta
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` su un file di log locale al repository.
L'avanzamento Matrix viene stampato per impostazione predefinita. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` limita
l'intera esecuzione e `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` limita la pulizia così, se
lo smantellamento Docker si blocca, viene riportato l'esatto comando di ripristino invece di restare in attesa.

Per una corsia smoke Telegram reale sul piano del trasporto, esegui:

```bash
pnpm openclaw qa telegram
```

Quella corsia usa come destinazione un vero gruppo Telegram privato invece di predisporre
un server usa e getta. Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, oltre a due bot distinti nello stesso
gruppo privato. Il bot SUT deve avere uno username Telegram e l'osservazione
bot-to-bot funziona al meglio quando entrambi i bot hanno la modalità Bot-to-Bot Communication
abilitata in `@BotFather`.
Il comando termina con codice diverso da zero se uno scenario fallisce. Usa `--allow-failures` quando
vuoi gli artifact senza un codice di uscita di errore.
Il report e il riepilogo Telegram includono il RTT per risposta, dalla richiesta di invio del messaggio del driver
alla risposta SUT osservata, a partire dal canary.

Prima di usare credenziali live condivise, esegui:

```bash
pnpm openclaw qa credentials doctor
```

Il doctor controlla l'env del broker Convex, convalida le impostazioni degli endpoint e verifica
la raggiungibilità di admin/list quando è presente il segreto del maintainer. Riporta
solo lo stato presente/assente dei segreti.

Per una corsia smoke Discord reale sul piano del trasporto, esegui:

```bash
pnpm openclaw qa discord
```

Quella corsia usa come destinazione un vero canale guild Discord privato con due bot: un
bot driver controllato dall'harness e un bot SUT avviato dal child
gateway OpenClaw tramite il Plugin Discord incluso. Richiede
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
e `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` quando si usano credenziali env.
La corsia verifica la gestione delle menzioni del canale e controlla che il bot SUT abbia
registrato il comando nativo `/help` presso Discord.
Il comando termina con codice diverso da zero se uno scenario fallisce. Usa `--allow-failures` quando
vuoi gli artifact senza un codice di uscita di errore.

Le corsie live di trasporto ora condividono un unico contratto più piccolo invece di inventare
ciascuna una propria forma dell'elenco degli scenari:

`qa-channel` resta l'ampia suite sintetica di comportamento del prodotto e non fa parte
della matrice di copertura dei trasporti live.

| Corsia   | Canary | Controllo delle menzioni | Blocco allowlist | Risposta top-level | Ripresa dopo riavvio | Follow-up del thread | Isolamento del thread | Osservazione delle reazioni | Comando help | Registrazione del comando nativo |
| -------- | ------ | ------------------------ | ---------------- | ------------------ | -------------------- | -------------------- | --------------------- | --------------------------- | ------------ | -------------------------------- |
| Matrix   | x      | x                        | x                | x                  | x                    | x                    | x                     | x                           |              |                                  |
| Telegram | x      | x                        |                  |                    |                      |                      |                       |                             | x            |                                  |
| Discord  | x      | x                        |                  |                    |                      |                      |                       |                             |              | x                                |

Questo mantiene `qa-channel` come ampia suite di comportamento del prodotto mentre Matrix,
Telegram e i futuri trasporti live condividono un'unica checklist esplicita del contratto di trasporto.

Per una corsia VM Linux usa e getta senza introdurre Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia una nuova guest Multipass, installa le dipendenze, costruisce OpenClaw
all'interno della guest, esegue `qa suite`, quindi copia il normale report QA e
il riepilogo in `.artifacts/qa-e2e/...` sull'host.
Riutilizza lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
Le esecuzioni della suite sull'host e su Multipass eseguono per impostazione predefinita più scenari selezionati in parallelo
con worker gateway isolati. `qa-channel` usa per impostazione predefinita concorrenza
4, limitata dal numero di scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, oppure `--concurrency 1` per un'esecuzione seriale.
Il comando termina con codice diverso da zero se uno scenario fallisce. Usa `--allow-failures` quando
vuoi gli artifact senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per la
guest: chiavi provider basate su env, il percorso di configurazione del provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la root del repository così la guest
può scrivere di nuovo tramite il workspace montato.

## Seed supportati dal repository

Gli asset seed si trovano in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Sono intenzionalmente in git così il piano QA è visibile sia agli esseri umani sia all'
agente.

`qa-lab` dovrebbe restare un runner Markdown generico. Ogni file Markdown di scenario è
la fonte di verità per una singola esecuzione di test e dovrebbe definire:

- metadati dello scenario
- metadati facoltativi di categoria, capacità, corsia e rischio
- riferimenti alla documentazione e al codice
- requisiti facoltativi dei plugin
- patch facoltativa della configurazione del gateway
- il `qa-flow` eseguibile

La superficie runtime riutilizzabile che supporta `qa-flow` può restare generica
e trasversale. Per esempio, gli scenari Markdown possono combinare helper lato
trasporto con helper lato browser che guidano la Control UI incorporata tramite la
seam `browser.request` del Gateway senza aggiungere un runner speciale.

I file di scenario dovrebbero essere raggruppati per capacità del prodotto anziché per cartella
dell'albero dei sorgenti. Mantieni stabili gli ID di scenario quando i file si spostano; usa
`docsRefs` e `codeRefs` per la tracciabilità dell'implementazione.

L'elenco di base dovrebbe restare abbastanza ampio da coprire:

- chat DM e di canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback Cron
- richiamo della memoria
- cambio di modello
- handoff di subagent
- lettura del repository e della documentazione
- un piccolo task di build come Lobster Invaders

## Corsie mock del provider

`qa suite` ha due corsie mock locali del provider:

- `mock-openai` è il mock OpenClaw consapevole degli scenari. Resta la
  corsia mock deterministica predefinita per QA supportata dal repository e per i parity gate.
- `aimock` avvia un server provider supportato da AIMock per copertura sperimentale di protocollo,
  fixture, record/replay e caos. È additivo e non sostituisce il dispatcher di scenari `mock-openai`.

L'implementazione delle corsie provider si trova in `extensions/qa-lab/src/providers/`.
Ogni provider possiede i propri valori predefiniti, l'avvio del server locale,
la configurazione del modello gateway, le necessità di staging del profilo auth e i flag di capacità live/mock. Il codice condiviso di suite e gateway dovrebbe instradare tramite il registro dei provider invece di ramificarsi sui nomi dei provider.

## Adapter di trasporto

`qa-lab` possiede una seam di trasporto generica per gli scenari QA Markdown.
`qa-channel` è il primo adapter su questa seam, ma l'obiettivo progettuale è più ampio:
i futuri canali reali o sintetici dovrebbero collegarsi allo stesso runner di suite
invece di aggiungere un runner QA specifico del trasporto.

A livello di architettura, la divisione è:

- `qa-lab` possiede l'esecuzione generica degli scenari, la concorrenza dei worker, la scrittura degli artifact e la reportistica.
- l'adapter di trasporto possiede la configurazione del gateway, la readiness, l'osservazione in ingresso e in uscita, le azioni di trasporto e lo stato di trasporto normalizzato.
- i file di scenario Markdown sotto `qa/scenarios/` definiscono l'esecuzione di test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

La guida di adozione per maintainer per i nuovi adapter di canale si trova in
[Testing](/it/help/testing#adding-a-channel-to-qa).

## Reportistica

`qa-lab` esporta un report di protocollo Markdown dalla timeline osservata del bus.
Il report dovrebbe rispondere a:

- Cosa ha funzionato
- Cosa ha fallito
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per controlli di carattere e stile, esegui lo stesso scenario su più ref di modelli live
e scrivi un report Markdown giudicato:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
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

Il comando esegue processi child locali del gateway QA, non Docker. Gli scenari di character eval
dovrebbero impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente
come chat, aiuto nel workspace e piccoli task sui file. Al modello candidato
non dovrebbe essere detto che è in fase di valutazione. Il comando preserva ogni trascrizione
completa, registra statistiche di base dell'esecuzione, quindi chiede ai modelli judge in modalità fast con
reasoning `xhigh` dove supportato di classificare le esecuzioni per naturalezza, vibe e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del judge riceve comunque
ogni trascrizione e stato dell'esecuzione, ma i ref candidati vengono sostituiti con etichette neutre
come `candidate-01`; il report rimappa le classifiche ai ref reali dopo il parsing.

Le esecuzioni candidate usano per impostazione predefinita thinking `high`, con `medium` per GPT-5.4 e `xhigh`
per i ref di valutazione OpenAI più vecchi che lo supportano. Sostituisci un candidato specifico inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` imposta comunque un fallback
globale e la vecchia forma `--model-thinking <provider/model=level>` è mantenuta
per compatibilità.
I ref candidati OpenAI usano per impostazione predefinita la modalità fast così viene usata l'elaborazione prioritaria dove
il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un
singolo candidato o judge necessita di un override. Passa `--fast` solo quando vuoi
forzare la modalità fast per ogni modello candidato. Le durate di candidati e judge vengono
registrate nel report per l'analisi benchmark, ma i prompt dei judge indicano esplicitamente
di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e judge usano entrambe per impostazione predefinita una concorrenza pari a 16. Riduci
`--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul gateway locale
rendono un'esecuzione troppo rumorosa.
Quando non viene passato alcun candidato `--model`, la character eval usa per impostazione predefinita
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i judge usano per impostazione predefinita
`openai/gpt-5.4,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentazione correlata

- [Testing](/it/help/testing)
- [QA Channel](/it/channels/qa-channel)
- [Dashboard](/it/web/dashboard)
