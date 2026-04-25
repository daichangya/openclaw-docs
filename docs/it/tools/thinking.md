---
read_when:
    - Regolare parsing o valori predefiniti di thinking, modalità veloce o direttive verbose
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e visibilità del reasoning
title: Livelli di reasoning
x-i18n:
    generated_at: "2026-04-25T13:59:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0537f10d3dd3251ac41590bebd2d83ba8b2562725c322040b20f32547c8af88d
    source_path: tools/thinking.md
    workflow: 15
---

## Cosa fa

- Direttiva inline in qualunque corpo in ingresso: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Livelli (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (budget massimo)
  - xhigh → “ultrathink+” (modelli GPT-5.2+ e Codex, più effort Anthropic Claude Opus 4.7)
  - adaptive → reasoning adattivo gestito dal provider (supportato per Claude 4.6 su Anthropic/Bedrock, Anthropic Claude Opus 4.7 e thinking dinamico Google Gemini)
  - max → reasoning massimo del provider (attualmente Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` vengono mappati a `xhigh`.
  - `highest` viene mappato a `high`.
- Note sui provider:
  - Menu e selettori del reasoning sono guidati dal profilo provider. I Plugin provider dichiarano l'insieme esatto di livelli per il modello selezionato, incluse etichette come `on` binario.
  - `adaptive`, `xhigh` e `max` vengono pubblicizzati solo per i profili provider/modello che li supportano. Le direttive digitate per livelli non supportati vengono rifiutate con le opzioni valide per quel modello.
  - I livelli non supportati già memorizzati vengono rimappati in base al rango del profilo provider. `adaptive` torna a `medium` sui modelli non adattivi, mentre `xhigh` e `max` tornano al livello non-off più alto supportato per il modello selezionato.
  - I modelli Anthropic Claude 4.6 usano `adaptive` come predefinito quando non è impostato alcun livello di reasoning esplicito.
  - Anthropic Claude Opus 4.7 non usa il thinking adattivo come predefinito. Il suo effort API predefinito resta di proprietà del provider a meno che tu non imposti esplicitamente un livello di reasoning.
  - Anthropic Claude Opus 4.7 mappa `/think xhigh` a thinking adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva di thinking e `xhigh` è l'impostazione effort di Opus 4.7.
  - Anthropic Claude Opus 4.7 espone anche `/think max`; viene mappato allo stesso percorso di effort massimo di proprietà del provider.
  - I modelli OpenAI GPT mappano `/think` tramite il supporto effort specifico del modello nella Responses API. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; altrimenti OpenClaw omette il payload di reasoning disabilitato invece di inviare un valore non supportato.
  - Google Gemini mappa `/think adaptive` al thinking dinamico di proprietà del provider di Gemini. Le richieste Gemini 3 omettono un `thinkingLevel` fisso, mentre le richieste Gemini 2.5 inviano `thinkingBudget: -1`; i livelli fissi continuano a essere mappati al `thinkingLevel` o al budget Gemini più vicino per quella famiglia di modelli.
  - MiniMax (`minimax/*`) sul percorso di streaming compatibile con Anthropic usa come predefinito `thinking: { type: "disabled" }` a meno che tu non imposti esplicitamente il thinking nei parametri del modello o della richiesta. Questo evita delta `reasoning_content` trapelati dal formato stream Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo thinking binario (`on`/`off`). Qualunque livello diverso da `off` viene trattato come `on` (mappato a `low`).
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualunque livello diverso da `off` a `thinking: { type: "enabled" }`. Quando il thinking è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili in `auto`.

## Ordine di risoluzione

1. Direttiva inline nel messaggio (si applica solo a quel messaggio).
2. Override di sessione (impostato inviando un messaggio contenente solo direttive).
3. Predefinito per agente (`agents.list[].thinkingDefault` nella configurazione).
4. Predefinito globale (`agents.defaults.thinkingDefault` nella configurazione).
5. Fallback: predefinito dichiarato dal provider quando disponibile; altrimenti i modelli capaci di reasoning si risolvono in `medium` o nel livello non-`off` supportato più vicino per quel modello, mentre i modelli non di reasoning restano su `off`.

## Impostare un valore predefinito di sessione

- Invia un messaggio che sia **solo** la direttiva (spazi ammessi), per esempio `/think:medium` o `/t high`.
- Questo resta valido per la sessione corrente (per impostazione predefinita per mittente); viene cancellato da `/think:off` o dal reset per inattività della sessione.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (per esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione resta invariato.
- Invia `/think` (o `/think:`) senza argomenti per vedere il livello di thinking corrente.

## Applicazione per agente

- **Embedded Pi**: il livello risolto viene passato al runtime agente Pi in-process.

## Modalità veloce (/fast)

- Livelli: `on|off`.
- Un messaggio contenente solo la direttiva attiva/disattiva un override di sessione della modalità veloce e risponde `Fast mode enabled.` / `Fast mode disabled.`.
- Invia `/fast` (o `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità veloce.
- OpenClaw risolve la modalità veloce in questo ordine:
  1. `/fast on|off` inline/solo direttiva
  2. Override di sessione
  3. Predefinito per agente (`agents.list[].fastModeDefault`)
  4. Configurazione per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Per `openai/*`, la modalità veloce viene mappata al processamento prioritario di OpenAI inviando `service_tier=priority` nelle richieste Responses supportate.
- Per `openai-codex/*`, la modalità veloce invia lo stesso flag `service_tier=priority` su Codex Responses. OpenClaw mantiene un unico toggle `/fast` condiviso su entrambi i percorsi di autenticazione.
- Per le richieste dirette pubbliche `anthropic/*`, incluso il traffico autenticato via OAuth inviato a `api.anthropic.com`, la modalità veloce viene mappata ai service tier Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile con Anthropic, `/fast on` (o `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I parametri espliciti del modello Anthropic `serviceTier` / `service_tier` hanno priorità sul valore predefinito della modalità veloce quando entrambi sono impostati. OpenClaw continua comunque a saltare l'iniezione del service tier Anthropic per base URL proxy non Anthropic.
- `/status` mostra `Fast` solo quando la modalità veloce è abilitata.

## Direttive verbose (/verbose o /v)

- Livelli: `on` (minimo) | `full` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva verbose di sessione e risponde `Verbose logging enabled.` / `Verbose logging disabled.`; i livelli non validi restituiscono un suggerimento senza cambiare stato.
- `/verbose off` memorizza un override esplicito di sessione; cancellalo tramite la UI Sessions scegliendo `inherit`.
- La direttiva inline influisce solo su quel messaggio; altrimenti si applicano i predefiniti di sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomenti per vedere il livello verbose corrente.
- Quando verbose è attivo, gli agenti che emettono risultati strutturati degli strumenti (Pi, altri agenti JSON) rimandano ogni chiamata agli strumenti come messaggio separato contenente solo metadati, prefissato con `<emoji> <tool-name>: <arg>` quando disponibile (percorso/comando). Questi riepiloghi degli strumenti vengono inviati non appena ogni strumento inizia (bubble separate), non come delta in streaming.
- I riepiloghi dei fallimenti degli strumenti restano visibili in modalità normale, ma i suffissi con i dettagli grezzi dell'errore vengono nascosti a meno che verbose non sia `on` o `full`.
- Quando verbose è `full`, anche gli output degli strumenti vengono inoltrati dopo il completamento (bubble separata, troncata a una lunghezza sicura). Se attivi `/verbose on|full|off` mentre un'esecuzione è in corso, le bubble degli strumenti successive rispettano la nuova impostazione.

## Direttive di traccia del Plugin (/trace)

- Livelli: `on` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva/disattiva l'output di traccia dei Plugin della sessione e risponde `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline influisce solo su quel messaggio; altrimenti si applicano i predefiniti di sessione/globali.
- Invia `/trace` (o `/trace:`) senza argomenti per vedere il livello di trace corrente.
- `/trace` è più ristretto di `/verbose`: espone solo righe di trace/debug di proprietà dei Plugin come i riepiloghi debug di Active Memory.
- Le righe di trace possono comparire in `/status` e come messaggio diagnostico successivo alla normale risposta dell'assistente.

## Visibilità del reasoning (/reasoning)

- Livelli: `on|off|stream`.
- Un messaggio contenente solo la direttiva attiva/disattiva la visualizzazione dei blocchi di thinking nelle risposte.
- Quando è abilitato, il reasoning viene inviato come **messaggio separato** prefissato con `Reasoning:`.
- `stream` (solo Telegram): trasmette il reasoning nella bubble draft di Telegram mentre la risposta viene generata, poi invia la risposta finale senza reasoning.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomenti per vedere il livello corrente del reasoning.
- Ordine di risoluzione: direttiva inline, poi override di sessione, poi predefinito per agente (`agents.list[].reasoningDefault`), poi fallback (`off`).

## Correlati

- La documentazione della modalità elevated si trova in [Elevated mode](/it/tools/elevated).

## Heartbeat

- Il corpo del probe Heartbeat è il prompt Heartbeat configurato (predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio Heartbeat si applicano come al solito (ma evita di cambiare i valori predefiniti della sessione dagli Heartbeat).
- La consegna di Heartbeat usa come predefinito solo il payload finale. Per inviare anche il messaggio separato `Reasoning:` (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` o per agente `agents.list[].heartbeat.includeReasoning: true`.

## UI della chat web

- Il selettore di thinking della chat web rispecchia il livello memorizzato della sessione dal session store/config in ingresso quando la pagina si carica.
- Scegliere un altro livello scrive immediatamente l'override della sessione tramite `sessions.patch`; non attende l'invio successivo e non è un override one-shot `thinkingOnce`.
- La prima opzione è sempre `Default (<resolved level>)`, dove il valore predefinito risolto deriva dal profilo di thinking del provider del modello della sessione attiva più la stessa logica di fallback usata da `/status` e `session_status`.
- Il selettore usa `thinkingLevels` restituiti dalla riga/default del gateway session, con `thinkingOptions` mantenuto come elenco legacy di etichette. La UI del browser non mantiene un proprio elenco regex dei provider; i Plugin possiedono gli insiemi di livelli specifici del modello.
- `/think:<level>` continua a funzionare e aggiorna lo stesso livello memorizzato di sessione, così direttive chat e selettore restano sincronizzati.

## Profili provider

- I Plugin provider possono esporre `resolveThinkingProfile(ctx)` per definire i livelli supportati dal modello e il valore predefinito.
- Ogni livello del profilo ha un `id` canonico memorizzato (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) e può includere una `label` di visualizzazione. I provider binari usano `{ id: "low", label: "on" }`.
- Gli hook legacy pubblicati (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) restano come adattatori di compatibilità, ma i nuovi insiemi di livelli personalizzati dovrebbero usare `resolveThinkingProfile`.
- Le righe/default del Gateway espongono `thinkingLevels`, `thinkingOptions` e `thinkingDefault` così i client ACP/chat visualizzano gli stessi id e le stesse etichette del profilo che la validazione runtime usa.
