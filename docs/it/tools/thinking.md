---
read_when:
    - Regolazione dell'analisi delle direttive o dei valori predefiniti per thinking, modalità rapida o verbose
summary: Sintassi delle direttive per /think, /fast, /verbose, /trace e visibilità del ragionamento
title: Livelli di thinking
x-i18n:
    generated_at: "2026-04-21T13:35:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b0217f6e5a5cb3400090f31ad5271ca61848a40f77d3f942851e7c2f2352886
    source_path: tools/thinking.md
    workflow: 15
---

# Livelli di thinking (direttive `/think`)

## Cosa fa

- Direttiva inline in qualsiasi corpo in ingresso: `/t <level>`, `/think:<level>` o `/thinking <level>`.
- Livelli (alias): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → “think”
  - low → “think hard”
  - medium → “think harder”
  - high → “ultrathink” (budget massimo)
  - xhigh → “ultrathink+” (GPT-5.2 + modelli Codex e sforzo Anthropic Claude Opus 4.7)
  - adaptive → thinking adattivo gestito dal provider (supportato per Claude 4.6 su Anthropic/Bedrock e Anthropic Claude Opus 4.7)
  - max → ragionamento massimo del provider (attualmente Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` e `extra_high` vengono mappati a `xhigh`.
  - `highest` viene mappato a `high`.
- Note sui provider:
  - I menu e i selettori di thinking sono guidati dal profilo provider. I plugin provider dichiarano l'insieme esatto di livelli per il modello selezionato, incluse etichette come il valore binario `on`.
  - `adaptive`, `xhigh` e `max` vengono pubblicizzati solo per i profili provider/modello che li supportano. Le direttive digitate per livelli non supportati vengono rifiutate con le opzioni valide di quel modello.
  - I livelli non supportati già memorizzati, inclusi i vecchi valori `max` dopo un cambio di modello, vengono rimappati al livello supportato più alto per il modello selezionato.
  - I modelli Anthropic Claude 4.6 usano `adaptive` per impostazione predefinita quando non è impostato alcun livello di thinking esplicito.
  - Anthropic Claude Opus 4.7 non usa thinking adattivo per impostazione predefinita. Il valore predefinito dello sforzo API resta di proprietà del provider finché non imposti esplicitamente un livello di thinking.
  - Anthropic Claude Opus 4.7 mappa `/think xhigh` a thinking adattivo più `output_config.effort: "xhigh"`, perché `/think` è una direttiva di thinking e `xhigh` è l'impostazione di sforzo di Opus 4.7.
  - Anthropic Claude Opus 4.7 espone anche `/think max`; viene mappato allo stesso percorso di sforzo massimo di proprietà del provider.
  - I modelli OpenAI GPT mappano `/think` tramite il supporto allo sforzo specifico del modello nella Responses API. `/think off` invia `reasoning.effort: "none"` solo quando il modello di destinazione lo supporta; altrimenti OpenClaw omette il payload di reasoning disabilitato invece di inviare un valore non supportato.
  - MiniMax (`minimax/*`) sul percorso di streaming compatibile con Anthropic usa per impostazione predefinita `thinking: { type: "disabled" }` a meno che tu non imposti esplicitamente il thinking nei parametri del modello o della richiesta. Questo evita delta `reasoning_content` trapelati dal formato di stream Anthropic non nativo di MiniMax.
  - Z.AI (`zai/*`) supporta solo thinking binario (`on`/`off`). Qualsiasi livello diverso da `off` viene trattato come `on` (mappato a `low`).
  - Moonshot (`moonshot/*`) mappa `/think off` a `thinking: { type: "disabled" }` e qualsiasi livello diverso da `off` a `thinking: { type: "enabled" }`. Quando il thinking è abilitato, Moonshot accetta solo `tool_choice` `auto|none`; OpenClaw normalizza i valori incompatibili in `auto`.

## Ordine di risoluzione

1. Direttiva inline nel messaggio (si applica solo a quel messaggio).
2. Sostituzione della sessione (impostata inviando un messaggio contenente solo una direttiva).
3. Valore predefinito per agente (`agents.list[].thinkingDefault` nella configurazione).
4. Valore predefinito globale (`agents.defaults.thinkingDefault` nella configurazione).
5. Fallback: valore predefinito dichiarato dal provider quando disponibile, `low` per altri modelli del catalogo contrassegnati come capaci di reasoning, `off` altrimenti.

## Impostazione di un valore predefinito di sessione

- Invia un messaggio che sia **solo** la direttiva (spazi consentiti), per esempio `/think:medium` o `/t high`.
- Questo resta valido per la sessione corrente (per mittente per impostazione predefinita); viene cancellato con `/think:off` o con il reset per inattività della sessione.
- Viene inviata una risposta di conferma (`Thinking level set to high.` / `Thinking disabled.`). Se il livello non è valido (per esempio `/thinking big`), il comando viene rifiutato con un suggerimento e lo stato della sessione resta invariato.
- Invia `/think` (o `/think:`) senza argomento per vedere il livello di thinking corrente.

## Applicazione per agente

- **Pi embedded**: il livello risolto viene passato al runtime dell'agente Pi in-process.

## Modalità rapida (`/fast`)

- Livelli: `on|off`.
- Un messaggio contenente solo la direttiva attiva o disattiva una sostituzione della modalità rapida di sessione e risponde con `Fast mode enabled.` / `Fast mode disabled.`.
- Invia `/fast` (o `/fast status`) senza modalità per vedere lo stato effettivo corrente della modalità rapida.
- OpenClaw risolve la modalità rapida in questo ordine:
  1. `/fast on|off` inline/con sola direttiva
  2. Sostituzione della sessione
  3. Valore predefinito per agente (`agents.list[].fastModeDefault`)
  4. Configurazione per modello: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Per `openai/*`, la modalità rapida viene mappata all'elaborazione prioritaria OpenAI inviando `service_tier=priority` nelle richieste Responses supportate.
- Per `openai-codex/*`, la modalità rapida invia lo stesso flag `service_tier=priority` su Codex Responses. OpenClaw mantiene un unico interruttore `/fast` condiviso tra entrambi i percorsi di autenticazione.
- Per le richieste pubbliche dirette `anthropic/*`, incluso il traffico autenticato OAuth inviato a `api.anthropic.com`, la modalità rapida viene mappata ai service tier Anthropic: `/fast on` imposta `service_tier=auto`, `/fast off` imposta `service_tier=standard_only`.
- Per `minimax/*` sul percorso compatibile con Anthropic, `/fast on` (o `params.fastMode: true`) riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed`.
- I parametri di modello espliciti Anthropic `serviceTier` / `service_tier` hanno la precedenza sul valore predefinito della modalità rapida quando entrambi sono impostati. OpenClaw continua comunque a saltare l'iniezione del service tier Anthropic per URL base proxy non Anthropic.

## Direttive verbose (`/verbose` o `/v`)

- Livelli: `on` (minimo) | `full` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva o disattiva il verbose di sessione e risponde con `Verbose logging enabled.` / `Verbose logging disabled.`; i livelli non validi restituiscono un suggerimento senza cambiare stato.
- `/verbose off` memorizza una sostituzione esplicita di sessione; cancellala tramite l'interfaccia Sessioni scegliendo `inherit`.
- La direttiva inline influisce solo su quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/verbose` (o `/verbose:`) senza argomento per vedere il livello verbose corrente.
- Quando verbose è attivo, gli agenti che emettono risultati strutturati dei tool (Pi, altri agenti JSON) rimandano ogni chiamata di tool come proprio messaggio solo metadati, con prefisso `<emoji> <tool-name>: <arg>` quando disponibile (percorso/comando). Questi riepiloghi dei tool vengono inviati non appena ogni tool inizia (bolle separate), non come delta di streaming.
- I riepiloghi dei fallimenti dei tool restano visibili in modalità normale, ma i suffissi con i dettagli grezzi degli errori sono nascosti a meno che verbose non sia `on` o `full`.
- Quando verbose è `full`, anche gli output dei tool vengono inoltrati dopo il completamento (bolla separata, troncata a una lunghezza sicura). Se attivi `/verbose on|full|off` mentre un'esecuzione è in corso, le bolle dei tool successive rispettano la nuova impostazione.

## Direttive di traccia dei plugin (`/trace`)

- Livelli: `on` | `off` (predefinito).
- Un messaggio contenente solo la direttiva attiva o disattiva l'output di traccia dei plugin della sessione e risponde con `Plugin trace enabled.` / `Plugin trace disabled.`.
- La direttiva inline influisce solo su quel messaggio; altrimenti si applicano i valori predefiniti di sessione/globali.
- Invia `/trace` (o `/trace:`) senza argomento per vedere il livello di traccia corrente.
- `/trace` è più ristretto di `/verbose`: espone solo righe di traccia/debug di proprietà dei plugin, come i riepiloghi di debug di Active Memory.
- Le righe di traccia possono comparire in `/status` e come messaggio diagnostico di follow-up dopo la normale risposta dell'assistente.

## Visibilità del reasoning (`/reasoning`)

- Livelli: `on|off|stream`.
- Un messaggio contenente solo la direttiva attiva o disattiva la visualizzazione dei blocchi di thinking nelle risposte.
- Quando è abilitato, il reasoning viene inviato come **messaggio separato** con prefisso `Reasoning:`.
- `stream` (solo Telegram): trasmette il reasoning nella bozza di Telegram mentre la risposta viene generata, poi invia la risposta finale senza reasoning.
- Alias: `/reason`.
- Invia `/reasoning` (o `/reasoning:`) senza argomento per vedere il livello di reasoning corrente.
- Ordine di risoluzione: direttiva inline, poi sostituzione della sessione, poi valore predefinito per agente (`agents.list[].reasoningDefault`), poi fallback (`off`).

## Correlati

- La documentazione sulla modalità elevata si trova in [Modalità elevata](/it/tools/elevated).

## Heartbeat

- Il corpo della probe Heartbeat è il prompt heartbeat configurato (predefinito: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Le direttive inline in un messaggio heartbeat si applicano come di consueto (ma evita di cambiare i valori predefiniti di sessione dai heartbeat).
- Il recapito Heartbeat usa per impostazione predefinita solo il payload finale. Per inviare anche il messaggio separato `Reasoning:` (quando disponibile), imposta `agents.defaults.heartbeat.includeReasoning: true` o per agente `agents.list[].heartbeat.includeReasoning: true`.

## Interfaccia web della chat

- Il selettore thinking della chat web rispecchia il livello memorizzato della sessione dal relativo archivio/configurazione della sessione in ingresso quando la pagina viene caricata.
- Scegliere un altro livello scrive immediatamente la sostituzione della sessione tramite `sessions.patch`; non aspetta l'invio successivo e non è una sostituzione una tantum `thinkingOnce`.
- La prima opzione è sempre `Default (<resolved level>)`, dove il valore predefinito risolto proviene dal profilo thinking del provider del modello attivo della sessione.
- Il selettore usa `thinkingOptions` restituito dalla riga di sessione del gateway. L'interfaccia browser non mantiene una propria lista regex dei provider; i plugin possiedono gli insiemi di livelli specifici del modello.
- `/think:<level>` continua a funzionare e aggiorna lo stesso livello di sessione memorizzato, così le direttive della chat e il selettore restano sincronizzati.

## Profili provider

- I plugin provider possono esporre `resolveThinkingProfile(ctx)` per definire i livelli supportati dal modello e il valore predefinito.
- Ogni livello del profilo ha un `id` canonico memorizzato (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` o `max`) e può includere una `label` di visualizzazione. I provider binari usano `{ id: "low", label: "on" }`.
- Gli hook legacy pubblicati (`supportsXHighThinking`, `isBinaryThinking` e `resolveDefaultThinkingLevel`) restano come adattatori di compatibilità, ma i nuovi insiemi di livelli personalizzati devono usare `resolveThinkingProfile`.
- Le righe Gateway espongono `thinkingOptions` e `thinkingDefault` affinché i client ACP/chat mostrino lo stesso profilo usato dalla convalida runtime.
