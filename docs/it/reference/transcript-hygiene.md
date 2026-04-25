---
read_when:
    - Stai eseguendo il debug di rifiuti delle richieste del provider legati alla forma della trascrizione
    - Stai modificando la sanitizzazione della trascrizione o la logica di riparazione delle chiamate agli strumenti
    - Stai analizzando incongruenze negli ID delle chiamate agli strumenti tra provider diversi
summary: 'Riferimento: regole specifiche del provider per sanitizzazione e riparazione della trascrizione'
title: Igiene della trascrizione
x-i18n:
    generated_at: "2026-04-25T13:57:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00cac47fb9a238e3cb8b6ea69b47210685ca6769a31973b4aeef1d18e75d78e6
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Questo documento descrive le **correzioni specifiche del provider** applicate alle trascrizioni prima di un'esecuzione (costruzione del contesto del modello). Questi passaggi di igiene sono aggiustamenti **in memoria** usati per soddisfare requisiti rigorosi dei provider. Questi passaggi di igiene **non** riscrivono la trascrizione JSONL memorizzata su disco; tuttavia, un passaggio separato di riparazione del file di sessione può riscrivere file JSONL malformati eliminando le righe non valide prima del caricamento della sessione. Quando avviene una riparazione, il file originale viene salvato come backup accanto al file di sessione.

L'ambito include:

- Contesto runtime-only del prompt tenuto fuori dai turni della trascrizione visibili all'utente
- Sanitizzazione degli ID delle chiamate agli strumenti
- Validazione degli input delle chiamate agli strumenti
- Riparazione dell'abbinamento dei risultati degli strumenti
- Validazione / ordinamento dei turni
- Pulizia della thought signature
- Sanitizzazione del payload delle immagini
- Tagging della provenienza dell'input utente (per prompt instradati tra sessioni)

Se ti servono dettagli sull'archiviazione delle trascrizioni, vedi:

- [Approfondimento sulla gestione delle sessioni](/it/reference/session-management-compaction)

---

## Regola globale: il contesto runtime non è la trascrizione utente

Il contesto runtime/system può essere aggiunto al prompt del modello per un turno, ma non è contenuto creato dall'utente finale. OpenClaw mantiene un body del prompt separato orientato alla trascrizione per risposte Gateway, followup in coda, ACP, CLI ed esecuzioni Pi integrate. I turni utente visibili memorizzati usano quel body della trascrizione invece del prompt arricchito dal runtime.

Per le sessioni legacy che hanno già persistito wrapper runtime, le superfici di cronologia Gateway applicano una proiezione di visualizzazione prima di restituire i messaggi ai client WebChat, TUI, REST o SSE.

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

I payload immagine vengono sempre sanitizzati per prevenire rifiuti lato provider dovuti a limiti di dimensione (downscale/ricompressione di immagini base64 troppo grandi).

Questo aiuta anche a controllare la pressione di token causata dalle immagini per i modelli capaci di vision.
Dimensioni massime più basse generalmente riducono l'uso dei token; dimensioni più alte preservano più dettaglio.

Implementazione:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Il lato massimo dell'immagine è configurabile tramite `agents.defaults.imageMaxDimensionPx` (predefinito: `1200`).

---

## Regola globale: chiamate agli strumenti malformate

I blocchi assistant di chiamata agli strumenti a cui mancano sia `input` sia `arguments` vengono eliminati prima della costruzione del contesto del modello. Questo previene rifiuti dei provider dovuti a chiamate agli strumenti persistite solo parzialmente (ad esempio dopo un errore di rate limit).

Implementazione:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Applicato in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regola globale: provenienza dell'input inter-sessione

Quando un agente invia un prompt in un'altra sessione tramite `sessions_send` (incluse fasi di reply/announce agente-a-agente), OpenClaw persiste il turno utente creato con:

- `message.provenance.kind = "inter_session"`

Questi metadati vengono scritti al momento dell'append alla trascrizione e non cambiano il ruolo (`role: "user"` resta per compatibilità con i provider). I lettori della trascrizione possono usarli per evitare di trattare i prompt interni instradati come istruzioni create dall'utente finale.

Durante la ricostruzione del contesto, OpenClaw antepone anche in memoria un breve marcatore `[Inter-session message]` a quei turni utente, così il modello può distinguerli dalle istruzioni esterne dell'utente finale.

---

## Matrice dei provider (comportamento attuale)

**OpenAI / OpenAI Codex**

- Solo sanitizzazione delle immagini.
- Elimina reasoning signature orfane (item reasoning standalone senza un blocco di contenuto successivo) per trascrizioni OpenAI Responses/Codex, ed elimina reasoning OpenAI riproducibile dopo un cambio di route del modello.
- Nessuna sanitizzazione degli ID delle chiamate agli strumenti.
- La riparazione dell'abbinamento dei risultati degli strumenti può spostare output reali corrispondenti e sintetizzare output `aborted` in stile Codex per chiamate agli strumenti mancanti.
- Nessuna validazione o riordinamento dei turni.
- Gli output mancanti degli strumenti della famiglia OpenAI Responses vengono sintetizzati come `aborted` per corrispondere alla normalizzazione di replay di Codex.
- Nessuna rimozione della thought signature.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Sanitizzazione degli ID delle chiamate agli strumenti: rigorosamente alfanumerica.
- Riparazione dell'abbinamento dei risultati degli strumenti e risultati sintetici degli strumenti.
- Validazione dei turni (alternanza dei turni in stile Gemini).
- Correzione dell'ordinamento dei turni Google (antepone un piccolo bootstrap utente se la cronologia inizia con assistant).
- Antigravity Claude: normalizza le thinking signature; elimina i blocchi thinking senza firma.

**Anthropic / Minimax (compatibile con Anthropic)**

- Riparazione dell'abbinamento dei risultati degli strumenti e risultati sintetici degli strumenti.
- Validazione dei turni (fonde turni utente consecutivi per soddisfare l'alternanza rigorosa).

**Mistral (incluso rilevamento basato su model-id)**

- Sanitizzazione degli ID delle chiamate agli strumenti: strict9 (alfanumerico di lunghezza 9).

**OpenRouter Gemini**

- Pulizia della thought signature: rimuove valori `thought_signature` non base64 (mantiene quelli base64).

**Tutto il resto**

- Solo sanitizzazione delle immagini.

---

## Comportamento storico (pre-2026.1.22)

Prima della release 2026.1.22, OpenClaw applicava più livelli di igiene della trascrizione:

- Un'estensione **transcript-sanitize** veniva eseguita a ogni build del contesto e poteva:
  - Riparare l'abbinamento tra uso e risultato degli strumenti.
  - Sanitizzare gli ID delle chiamate agli strumenti (inclusa una modalità non strict che preservava `_`/`-`).
- Il runner eseguiva anche sanitizzazione specifica del provider, duplicando il lavoro.
- Ulteriori mutazioni avvenivano fuori dalla policy del provider, inclusi:
  - Rimozione dei tag `<final>` dal testo assistant prima della persistenza.
  - Eliminazione di turni assistant di errore vuoti.
  - Troncamento del contenuto assistant dopo le chiamate agli strumenti.

Questa complessità causava regressioni tra provider (in particolare nell'abbinamento `openai-responses` `call_id|fc_id`). La pulizia del 2026.1.22 ha rimosso l'estensione, centralizzato la logica nel runner e reso OpenAI **intoccabile** oltre alla sanitizzazione delle immagini.

## Correlati

- [Gestione delle sessioni](/it/concepts/session)
- [Potatura delle sessioni](/it/concepts/session-pruning)
