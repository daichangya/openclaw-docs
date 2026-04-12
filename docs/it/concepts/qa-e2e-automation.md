---
read_when:
    - Estendere qa-lab o qa-channel
    - Aggiungere scenari QA supportati dal repository
    - Creare automazione QA a maggiore realismo attorno alla dashboard del Gateway
summary: Forma dell'automazione QA privata per qa-lab, qa-channel, scenari con seed e report del protocollo
title: Automazione QA end-to-end
x-i18n:
    generated_at: "2026-04-12T23:28:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9fe27dc049823d5e3eb7ae1eac6aad21ed9e917425611fb1dbcb28ab9210d5e
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Automazione QA end-to-end

Lo stack QA privato serve a testare OpenClaw in modo più realistico e aderente ai canali rispetto a quanto possa fare un singolo test unitario.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggistica sintetico con superfici per DM, canale, thread, reazione, modifica ed eliminazione.
- `extensions/qa-lab`: interfaccia utente di debug e bus QA per osservare la trascrizione, iniettare messaggi in ingresso ed esportare un report Markdown.
- `qa/`: asset seed supportati dal repository per l'attività iniziale e gli scenari QA di base.

L'attuale flusso operativo QA è un sito QA a due pannelli:

- Sinistra: dashboard del Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo costruisce il sito QA, avvia la lane del Gateway basata su Docker ed espone la pagina QA Lab in cui un operatore o un ciclo di automazione può assegnare all'agente una missione QA, osservare il comportamento reale del canale e registrare cosa ha funzionato, cosa è fallito o cosa è rimasto bloccato.

Per iterare più velocemente sull'interfaccia utente di QA Lab senza ricostruire ogni volta l'immagine Docker, avvia lo stack con un bundle QA Lab montato tramite bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta tramite bind `extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch` ricostruisce quel bundle a ogni modifica e il browser si ricarica automaticamente quando cambia l'hash degli asset di QA Lab.

Per una lane smoke Matrix reale a livello di trasporto, esegui:

```bash
pnpm openclaw qa matrix
```

Questa lane predispone un homeserver Tuwunel usa e getta in Docker, registra utenti temporanei driver, SUT e observer, crea una stanza privata e poi esegue il vero plugin Matrix all'interno di un processo figlio QA del Gateway. La lane di trasporto live mantiene la configurazione figlia limitata al trasporto sotto test, quindi Matrix viene eseguito senza `qa-channel` nella configurazione figlia.

Per una lane smoke Telegram reale a livello di trasporto, esegui:

```bash
pnpm openclaw qa telegram
```

Questa lane usa un vero gruppo privato Telegram invece di predisporre un server usa e getta. Richiede `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, oltre a due bot distinti nello stesso gruppo privato. Il bot SUT deve avere un nome utente Telegram e l'osservazione bot-to-bot funziona al meglio quando entrambi i bot hanno la modalità Bot-to-Bot Communication Mode abilitata in `@BotFather`.

Le lane di trasporto live ora condividono un unico contratto più piccolo invece di definire ognuna una propria forma per l'elenco degli scenari.

`qa-channel` rimane la suite ampia di comportamento sintetico del prodotto e non fa parte della matrice di copertura del trasporto live.

| Lane     | Canary | Gating delle menzioni | Blocco allowlist | Risposta di primo livello | Ripresa dopo riavvio | Follow-up nel thread | Isolamento del thread | Osservazione delle reazioni | Comando help |
| -------- | ------ | --------------------- | ---------------- | ------------------------- | -------------------- | -------------------- | --------------------- | --------------------------- | ------------ |
| Matrix   | x      | x                     | x                | x                         | x                    | x                    | x                     | x                           |              |
| Telegram | x      |                       |                  |                           |                      |                      |                       |                             | x            |

Questo mantiene `qa-channel` come suite ampia di comportamento del prodotto, mentre Matrix, Telegram e i futuri trasporti live condividono un'unica checklist esplicita del contratto di trasporto.

Per una lane VM Linux usa e getta senza introdurre Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia una nuova istanza Multipass, installa le dipendenze, costruisce OpenClaw all'interno dell'istanza, esegue `qa suite`, quindi copia il normale report QA e il riepilogo in `.artifacts/qa-e2e/...` sull'host.
Riutilizza lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
Le esecuzioni della suite su host e Multipass eseguono per impostazione predefinita in parallelo più scenari selezionati con worker Gateway isolati, fino a 64 worker o al numero di scenari selezionati. Usa `--concurrency <count>` per regolare il numero di worker oppure `--concurrency 1` per l'esecuzione seriale.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati e pratici per l'istanza: chiavi provider basate su env, il percorso di configurazione del provider live QA e `CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la radice del repository in modo che l'istanza possa scrivere indietro tramite il workspace montato.

## Seed supportati dal repository

Gli asset seed si trovano in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Questi sono intenzionalmente in git affinché il piano QA sia visibile sia agli esseri umani sia all'agente.

`qa-lab` deve rimanere un runner Markdown generico. Ogni file Markdown di scenario è la fonte di verità per una singola esecuzione di test e dovrebbe definire:

- metadati dello scenario
- riferimenti a documentazione e codice
- requisiti opzionali dei plugin
- patch opzionale della configurazione del Gateway
- il `qa-flow` eseguibile

L'elenco di base deve rimanere abbastanza ampio da coprire:

- chat DM e di canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback Cron
- richiamo della memoria
- cambio di modello
- handoff del subagente
- lettura del repository e della documentazione
- una piccola attività di build come Lobster Invaders

## Adattatori di trasporto

`qa-lab` gestisce una seam di trasporto generica per scenari QA in Markdown.
`qa-channel` è il primo adattatore su questa seam, ma l'obiettivo di progettazione è più ampio:
i futuri canali reali o sintetici dovrebbero collegarsi allo stesso runner di suite invece di aggiungere un runner QA specifico per il trasporto.

A livello di architettura, la suddivisione è:

- `qa-lab` gestisce l'esecuzione generica degli scenari, la concorrenza dei worker, la scrittura degli artifact e il reporting.
- l'adattatore di trasporto gestisce la configurazione del Gateway, la readiness, l'osservazione in ingresso e in uscita, le azioni di trasporto e lo stato di trasporto normalizzato.
- i file di scenario Markdown sotto `qa/scenarios/` definiscono l'esecuzione del test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

Le linee guida di adozione rivolte ai maintainer per i nuovi adattatori di canale si trovano in
[Testing](/it/help/testing#adding-a-channel-to-qa).

## Reporting

`qa-lab` esporta un report del protocollo in Markdown dalla timeline osservata del bus.
Il report dovrebbe rispondere a:

- Cosa ha funzionato
- Cosa è fallito
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per controlli di carattere e stile, esegui lo stesso scenario su più riferimenti di modelli live e scrivi un report Markdown valutato:

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

Il comando esegue processi figli locali del Gateway QA, non Docker. Gli scenari di character eval dovrebbero impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente come chat, aiuto sul workspace e piccole attività sui file. Al modello candidato non dovrebbe essere detto che è in fase di valutazione. Il comando conserva ogni trascrizione completa, registra statistiche di base dell'esecuzione e poi chiede ai modelli giudice in modalità fast con ragionamento `xhigh` di classificare le esecuzioni per naturalezza, vibe e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del giudice riceve comunque ogni trascrizione e stato dell'esecuzione, ma i riferimenti dei candidati vengono sostituiti con etichette neutrali come `candidate-01`; il report rimappa le classifiche ai riferimenti reali dopo il parsing.
Le esecuzioni dei candidati usano per impostazione predefinita `high` thinking, con `xhigh` per i modelli OpenAI che lo supportano. Sostituisci un candidato specifico inline con `--model provider/model,thinking=<level>`. `--thinking <level>` continua a impostare un fallback globale e la forma meno recente `--model-thinking <provider/model=level>` viene mantenuta per compatibilità.
I riferimenti candidati OpenAI usano per impostazione predefinita la modalità fast, così viene utilizzata l'elaborazione prioritaria dove il provider la supporta. Aggiungi inline `,fast`, `,no-fast` o `,fast=false` quando un singolo candidato o giudice ha bisogno di un override. Passa `--fast` solo quando vuoi forzare la modalità fast per ogni modello candidato. Le durate dei candidati e dei giudici vengono registrate nel report per l'analisi comparativa, ma i prompt dei giudici indicano esplicitamente di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e giudici usano entrambe per impostazione predefinita una concorrenza di 16. Riduci `--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul Gateway locale rendono un'esecuzione troppo rumorosa.
Quando non viene passato alcun `--model` candidato, la character eval usa per impostazione predefinita
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview`.
Quando non viene passato alcun `--judge-model`, i giudici usano per impostazione predefinita
`openai/gpt-5.4,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentazione correlata

- [Testing](/it/help/testing)
- [QA Channel](/it/channels/qa-channel)
- [Dashboard](/web/dashboard)
