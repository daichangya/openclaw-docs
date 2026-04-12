---
read_when:
    - Modifica del parsing o dei valori predefiniti delle direttive di thinking, fast-mode o verbose
summary: Sintassi delle direttive per `/think`, `/fast`, `/verbose`, `/trace` e visibilità del ragionamento
title: Livelli di thinking
x-i18n:
    generated_at: "2026-04-12T23:33:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3b1341281f07ba4e9061e3355845dca234be04cc0d358594312beeb7676e68
    source_path: tools/thinking.md
    workflow: 15
---

# Livelli di thinking (direttive `/think`)

## Cosa fa

- Direttiva inline in qualsiasi corpo di messaggio in ingresso: `/t <level>`, `/think:<level>` oppure `/thinking <level>`.
- Livelli (alias): `off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (budget massimo)
  - xhigh → “ultrathink+” (solo GPT-5.2 + modelli Codex)
  - adaptive → budget di ragionamento adattivo gestito dal provider (supportato per la famiglia di modelli Anthropic Claude 4.6)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` vengono mappati a `xhigh`.
  - `highest`, `max` vengono mappati a `high`.
- Note sui provider:
  - I modelli Anthropic Claude 4.6 usano `adaptive` come predefinito quando non è impostato alcun livello di thinking esplicito.
  - MiniMax (`minimax/*`) sul percorso di streaming compatibile con Anthropic usa come predefinito `thinking: { type: "disabled" }`, a meno che tu non imposti esplicitamente il thinking nei parametri del modello o della richiesta. Questo evita delta `reasoning_content` trapelati dal formato di stream Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo thinking binario (`on`/`off`). Qualsiasi livello diverso da `off` viene trattato come `on` (mappato a `low`).
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello diverso da `off` a `thinking: { type: "enabled" }`. Quando il thinking è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili a `auto`.

## Ordine di risoluzione

1. Direttiva inline nel messaggio (si applica solo a quel messaggio).
2. Override della sessione (impostato inviando un messaggio contenente solo la direttiva).
3. Predefinito per agente (`agents.list[].thinkingDefault` nella configurazione).
4. Predefinito globale (`agents.defaults.thinkingDefault` nella configurazione).
5. Fallback: `adaptive` per i modelli Anthropic Claude 4.6, `low` per gli altri modelli che supportano il ragionamento, `off` altrimenti.

## Impostare un valore predefinito di sessione

- Invia un messaggio che sia **solo** la direttiva (spazi consentiti), ad esempio `/think:medium` o `/t high`.
- Questo resta valido per la sessione corrente (per mittente per impostazione predefinita); viene cancellato da `/think:off` o dal reset per inattività della sessione.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (ad esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione resta invariato.
- Invia `/think` (o `/think:`) senza argomento per vedere il livello di thinking corrente.

## Applicazione per agente

- **Pi incorporato**: il livello risolto viene passato al runtime dell'agente Pi in-process.

## Modalità veloce (`/fast`)

- Livelli: `on|off`.
- Un messaggio contenente solo la direttiva attiva o disattiva un override della modalità veloce di sessione e risponde con `Fast mode enabled.` / `Fast mode disabled.`.
- Invia `/fast` (o `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità veloce.
- OpenClaw risolve la modalità veloce in questo ordine:
  1. Direttiva inline/solo-direttiva `/fast on|off`
  2. Override della sessione
  3. Predefinito per agente (`agents.list[].fastModeDefault`)
  4. Configurazione per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Per `openai/*`, la modalità veloce viene mappata all'elaborazione prioritaria OpenAI inviando `service_tier=priority` sulle richieste Responses supportate.
- Per `openai-codex/*`, la modalità veloce invia lo stesso flag `service_tier=priority` su Codex Responses. OpenClaw mantiene un unico interruttore `/fast` condiviso tra entrambi i percorsi di autenticazione.
- Per le richieste dirette pubbliche `anthropic/*`, incluso il traffico autenticato OAuth inviato a `api.anthropic.com`, la modalità veloce viene mappata ai service tier Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile con Anthropic, `/fast on` (oppure `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I parametri espliciti del modello Anthropic `serviceTier` / `service_tier` sovrascrivono il valore predefinito della modalità veloce quando entrambi sono impostati. OpenClaw continua comunque a saltare l'iniezione del service tier Anthropic per URL base proxy non Anthropic.

## Direttive verbose (`/verbose` o `/v`)

- Livelli: `on` (minimo) | `full` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva o disattiva il verbose di sessione e risponde con `Verbose logging enabled.` / `Verbose logging disabled.`; i livelli non validi restituiscono un suggerimento senza cambiare lo stato.
- `/verbose off` memorizza un override esplicito della sessione; cancellalo tramite l'interfaccia Sessions scegliendo `inherit`.
- La direttiva inline si applica solo a quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomento per vedere il livello verbose corrente.
- Quando il verbose è attivo, gli agenti che emettono risultati strutturati degli strumenti (Pi, altri agenti JSON) inviano ogni chiamata strumento come un proprio messaggio contenente solo metadati, con prefisso `<emoji> <tool-name>: <arg>` quando disponibile (percorso/comando). Questi riepiloghi degli strumenti vengono inviati non appena ogni strumento inizia (bubble separate), non come delta in streaming.
- I riepiloghi di errore degli strumenti restano visibili in modalità normale, ma i suffissi con i dettagli grezzi dell'errore vengono nascosti a meno che verbose non sia `on` o `full`.
- Quando verbose è `full`, anche gli output degli strumenti vengono inoltrati dopo il completamento (bubble separata, troncata a una lunghezza sicura). Se cambi `/verbose on|full|off` mentre un'esecuzione è in corso, le bubble successive degli strumenti rispetteranno la nuova impostazione.

## Direttive di trace del Plugin (`/trace`)

- Livelli: `on` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva o disattiva l'output di trace del Plugin per la sessione e risponde con `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline si applica solo a quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/trace` (o `/trace:`) senza argomento per vedere il livello di trace corrente.
- `/trace` è più ristretto di `/verbose`: espone solo righe di trace/debug possedute dal Plugin, come i riepiloghi di debug di Active Memory.
- Le righe di trace possono apparire in `/status` e come messaggio diagnostico successivo dopo la normale risposta dell'assistente.

## Visibilità del ragionamento (`/reasoning`)

- Livelli: `on|off|stream`.
- Un messaggio contenente solo la direttiva attiva o disattiva la visualizzazione dei blocchi di thinking nelle risposte.
- Quando è abilitato, il ragionamento viene inviato come **messaggio separato** con prefisso `Reasoning:`.
- `stream` (solo Telegram): invia il ragionamento in streaming nella bubble bozza di Telegram mentre la risposta viene generata, poi invia la risposta finale senza il ragionamento.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomento per vedere il livello di ragionamento corrente.
- Ordine di risoluzione: direttiva inline, poi override della sessione, poi predefinito per agente (`agents.list[].reasoningDefault`), poi fallback (`off`).

## Correlati

- La documentazione della modalità elevata si trova in [Modalità elevata](/it/tools/elevated).

## Heartbeat

- Il corpo della probe Heartbeat è il prompt Heartbeat configurato (predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio Heartbeat si applicano come di consueto (ma evita di cambiare i valori predefiniti della sessione dagli Heartbeat).
- La consegna dell'Heartbeat usa come predefinito solo il payload finale. Per inviare anche il messaggio separato `Reasoning:` (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` oppure per agente `agents.list[].heartbeat.includeReasoning: true`.

## Interfaccia web chat

- Il selettore di thinking della web chat rispecchia il livello memorizzato della sessione dal session store/configurazione in ingresso quando la pagina viene caricata.
- Selezionare un altro livello scrive immediatamente l'override della sessione tramite `sessions.patch`; non aspetta il prossimo invio e non è un override one-shot `thinkingOnce`.
- La prima opzione è sempre `Default (<resolved level>)`, dove il valore predefinito risolto deriva dal modello attivo della sessione: `adaptive` per Claude 4.6 su Anthropic/Bedrock, `low` per gli altri modelli che supportano il ragionamento, `off` altrimenti.
- Il selettore resta consapevole del provider:
  - la maggior parte dei provider mostra `off | minimal | low | medium | high | adaptive`
  - Z.AI mostra il formato binario `off | on`
- `/think:<level>` continua a funzionare e aggiorna lo stesso livello di sessione memorizzato, quindi le direttive della chat e il selettore restano sincronizzati.
