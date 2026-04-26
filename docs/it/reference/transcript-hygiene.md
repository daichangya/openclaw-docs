---
read_when:
    - Stai eseguendo il debug di rifiuti di richieste del provider legati alla struttura della trascrizione
    - Stai modificando la logica di sanitizzazione della trascrizione o di riparazione delle tool-call
    - Stai analizzando incongruenze degli ID delle tool-call tra provider
summary: 'Riferimento: regole specifiche del provider per la sanitizzazione e la riparazione della trascrizione'
title: Igiene della trascrizione
x-i18n:
    generated_at: "2026-04-26T11:38:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: e380be2b011afca5fedf89579e702c6d221d42e777c23bd766c8df07ff05ed18
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Questo documento descrive le **correzioni specifiche del provider** applicate alle trascrizioni prima di un'esecuzione
(costruzione del contesto del modello). La maggior parte di queste sono regolazioni **in memoria** usate per soddisfare
requisiti rigorosi del provider. Un passaggio separato di riparazione del file di sessione può anche riscrivere il
JSONL archiviato prima che la sessione venga caricata, eliminando righe JSONL malformate oppure riparando turni
persistiti che sono sintatticamente validi ma noti per essere rifiutati da un provider durante il replay. Quando
avviene una riparazione, il file originale viene salvato come backup accanto al file di sessione.

L'ambito include:

- Contesto del prompt solo runtime che resta fuori dai turni della trascrizione visibili all'utente
- Sanitizzazione degli ID delle tool-call
- Validazione dell'input delle tool-call
- Riparazione dell'associazione dei risultati dei tool
- Validazione / ordinamento dei turni
- Pulizia della firma dei pensieri
- Pulizia della firma di thinking
- Sanitizzazione del payload delle immagini
- Tagging della provenienza dell'input utente (per prompt instradati tra sessioni)
- Riparazione dei turni assistant di errore vuoti per il replay Bedrock Converse

Se ti servono dettagli sull'archiviazione delle trascrizioni, vedi:

- [Approfondimento sulla gestione delle sessioni e Compaction](/it/reference/session-management-compaction)

---

## Regola globale: il contesto runtime non è trascrizione utente

Il contesto runtime/sistema può essere aggiunto al prompt del modello per un turno, ma
non è contenuto scritto dall'utente finale. OpenClaw mantiene un corpo prompt separato
orientato alla trascrizione per le risposte Gateway, i follow-up in coda, ACP, CLI e le
esecuzioni Pi incorporate. I turni utente visibili archiviati usano quel corpo di trascrizione
invece del prompt arricchito dal runtime.

Per le sessioni legacy che hanno già persistito wrapper runtime, le superfici della cronologia
Gateway applicano una proiezione di visualizzazione prima di restituire i messaggi a client
WebChat, TUI, REST o SSE.

---

## Dove viene eseguito

Tutta l'igiene della trascrizione è centralizzata nell'embedded runner:

- Selezione della policy: `src/agents/transcript-policy.ts`
- Applicazione della sanitizzazione/riparazione: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

La policy usa `provider`, `modelApi` e `modelId` per decidere cosa applicare.

Separatamente dall'igiene della trascrizione, i file di sessione vengono riparati (se necessario) prima del caricamento:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Chiamato da `run/attempt.ts` e `compact.ts` (embedded runner)

---

## Regola globale: sanitizzazione delle immagini

I payload delle immagini vengono sempre sanitizzati per prevenire il rifiuto lato provider dovuto a limiti
di dimensione (ridimensionamento/ricompressione di immagini base64 troppo grandi).

Questo aiuta anche a controllare la pressione sui token generata dalle immagini per i modelli con capacità Vision.
Dimensioni massime più basse generalmente riducono l'uso di token; dimensioni più alte preservano più dettaglio.

Implementazione:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Il lato massimo dell'immagine è configurabile tramite `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`).

---

## Regola globale: tool-call malformate

I blocchi assistant di tool-call a cui mancano sia `input` sia `arguments` vengono eliminati
prima che venga costruito il contesto del modello. Questo previene i rifiuti del provider dovuti a
tool-call parzialmente persistite, ad esempio dopo un errore di rate limit.

Implementazione:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Applicato in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regola globale: provenienza dell'input tra sessioni

Quando un agente invia un prompt in un'altra sessione tramite `sessions_send` (incluse
le fasi di reply/announce da agente ad agente), OpenClaw persiste il turno utente creato con:

- `message.provenance.kind = "inter_session"`

Questi metadati vengono scritti al momento dell'aggiunta alla trascrizione e non cambiano il ruolo
(`role: "user"` resta per la compatibilità con il provider). I lettori della trascrizione possono usarli
per evitare di trattare i prompt interni instradati come istruzioni scritte dall'utente finale.

Durante la ricostruzione del contesto, OpenClaw antepone anche un breve marker `[Inter-session message]`
a quei turni utente in memoria così il modello può distinguerli dalle istruzioni esterne dell'utente finale.

---

## Matrice dei provider (comportamento attuale)

**OpenAI / OpenAI Codex**

- Solo sanitizzazione delle immagini.
- Elimina le firme di reasoning orfane (elementi di reasoning standalone senza un blocco di contenuto successivo) per le trascrizioni OpenAI Responses/Codex, ed elimina il reasoning OpenAI riproducibile dopo un cambio di route del modello.
- Nessuna sanitizzazione degli ID delle tool-call.
- La riparazione dell'associazione dei risultati dei tool può spostare output reali corrispondenti e sintetizzare output `aborted` in stile Codex per tool-call mancanti.
- Nessuna validazione o riordinamento dei turni.
- Gli output mancanti della famiglia OpenAI Responses vengono sintetizzati come `aborted` per corrispondere alla normalizzazione di replay di Codex.
- Nessuna rimozione della firma dei pensieri.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitizzazione degli ID delle tool-call: alfanumerico rigoroso.
- Riparazione dell'associazione dei risultati dei tool e risultati sintetici dei tool.
- Validazione dei turni (alternanza dei turni in stile Gemini).
- Correzione dell'ordinamento dei turni Google (antepone un piccolo bootstrap utente se la cronologia inizia con assistant).
- Antigravity Claude: normalizza le firme di thinking; elimina i blocchi di thinking senza firma.

**Anthropic / Minimax (compatibile con Anthropic)**

- Riparazione dell'associazione dei risultati dei tool e risultati sintetici dei tool.
- Validazione dei turni (unisce turni utente consecutivi per soddisfare l'alternanza rigorosa).
- I blocchi di thinking con firme di replay mancanti, vuote o bianche vengono rimossi
  prima della conversione per il provider. Se questo svuota un turno assistant, OpenClaw mantiene
  la forma del turno con un testo non vuoto di reasoning omesso.
- I vecchi turni assistant solo-thinking che devono essere rimossi vengono sostituiti con
  un testo non vuoto di reasoning omesso così gli adattatori provider non eliminano il turno di replay.

**Amazon Bedrock (API Converse)**

- I turni assistant vuoti di errore stream vengono riparati con un blocco di testo fallback non vuoto
  prima del replay. Bedrock Converse rifiuta i messaggi assistant con `content: []`, quindi
  i turni assistant persistiti con `stopReason: "error"` e contenuto vuoto vengono anche
  riparati su disco prima del caricamento.
- I blocchi Claude thinking con firme di replay mancanti, vuote o bianche vengono
  rimossi prima del replay Converse. Se questo svuota un turno assistant, OpenClaw mantiene
  la forma del turno con un testo non vuoto di reasoning omesso.
- I vecchi turni assistant solo-thinking che devono essere rimossi vengono sostituiti con
  un testo non vuoto di reasoning omesso così il replay Converse mantiene la forma rigorosa del turno.
- Il replay filtra i turni assistant di delivery-mirror di OpenClaw e quelli iniettati dal Gateway.
- La sanitizzazione delle immagini si applica tramite la regola globale.

**Mistral (incluso il rilevamento basato su model-id)**

- Sanitizzazione degli ID delle tool-call: strict9 (alfanumerico di lunghezza 9).

**OpenRouter Gemini**

- Pulizia della firma dei pensieri: rimuove i valori `thought_signature` non base64 (mantiene base64).

**Tutto il resto**

- Solo sanitizzazione delle immagini.

---

## Comportamento storico (pre-2026.1.22)

Prima della release 2026.1.22, OpenClaw applicava più livelli di igiene della trascrizione:

- Un'estensione **transcript-sanitize** veniva eseguita a ogni costruzione del contesto e poteva:
  - Riparare l'associazione tra uso del tool e risultato.
  - Sanitizzare gli ID delle tool-call (inclusa una modalità non rigorosa che preservava `_`/`-`).
- Il runner eseguiva anche sanitizzazione specifica del provider, duplicando il lavoro.
- Ulteriori mutazioni avvenivano al di fuori della policy del provider, incluse:
  - Rimozione dei tag `<final>` dal testo assistant prima della persistenza.
  - Eliminazione dei turni assistant di errore vuoti.
  - Taglio del contenuto assistant dopo le tool-call.

Questa complessità ha causato regressioni tra provider (in particolare nell'associazione
`call_id|fc_id` di `openai-responses`). La pulizia della 2026.1.22 ha rimosso l'estensione, centralizzato
la logica nel runner e reso OpenAI **no-touch** oltre alla sanitizzazione delle immagini.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Riduzione delle sessioni](/it/concepts/session-pruning)
