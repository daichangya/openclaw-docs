---
read_when:
    - Vuoi una diagnosi rapida dello stato del canale e dei destinatari recenti della sessione
    - Vuoi uno stato “all” copiabile per il debug
summary: Riferimento CLI per `openclaw status` (diagnostica, probe, snapshot di utilizzo)
title: Stato
x-i18n:
    generated_at: "2026-04-25T13:44:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: b191b8d78d43fb9426bfad495815fd06ab7188b413beff6fb7eb90f811b6d261
    source_path: cli/status.md
    workflow: 15
---

# `openclaw status`

Diagnostica per canali + sessioni.

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

Note:

- `--deep` esegue probe live (WhatsApp Web + Telegram + Discord + Slack + Signal).
- `--usage` stampa finestre di utilizzo del provider normalizzate come `X% left`.
- L'output dello stato della sessione separa `Execution:` da `Runtime:`. `Execution` è il percorso sandbox (`direct`, `docker/*`), mentre `Runtime` indica se la sessione sta usando `OpenClaw Pi Default`, `OpenAI Codex`, un backend CLI o un backend ACP come `codex (acp/acpx)`. Vedi [Agent runtimes](/it/concepts/agent-runtimes) per la distinzione provider/modello/runtime.
- I campi raw `usage_percent` / `usagePercent` di MiniMax rappresentano la quota residua, quindi OpenClaw li inverte prima della visualizzazione; i campi basati sul conteggio hanno la precedenza quando presenti. Le risposte `model_remains` preferiscono la voce del modello chat, derivano l'etichetta della finestra temporale dai timestamp quando necessario e includono il nome del modello nell'etichetta del piano.
- Quando lo snapshot della sessione corrente è scarno, `/status` può ricostruire i contatori di token e cache dal log di utilizzo del transcript più recente. I valori live esistenti diversi da zero hanno comunque la precedenza rispetto ai valori di fallback del transcript.
- Il fallback del transcript può anche recuperare l'etichetta del modello runtime attivo quando manca nella voce della sessione live. Se quel modello del transcript differisce dal modello selezionato, status risolve la finestra di contesto rispetto al modello runtime recuperato invece che a quello selezionato.
- Per il conteggio della dimensione del prompt, il fallback del transcript preferisce il totale orientato al prompt più grande quando i metadati della sessione mancano o sono inferiori, in modo che le sessioni con provider personalizzato non collassino a visualizzazioni di `0` token.
- L'output include store di sessione per agente quando sono configurati più agenti.
- La panoramica include stato di installazione/runtime del Gateway + del servizio host node quando disponibile.
- La panoramica include canale di aggiornamento + git SHA (per checkout dal sorgente).
- Le informazioni di aggiornamento compaiono nella panoramica; se è disponibile un aggiornamento, status stampa un suggerimento per eseguire `openclaw update` (vedi [Updating](/it/install/updating)).
- Le superfici di stato in sola lettura (`status`, `status --json`, `status --all`) risolvono i SecretRef supportati per i percorsi di configurazione interessati quando possibile.
- Se un SecretRef di un canale supportato è configurato ma non disponibile nel percorso del comando corrente, status resta in sola lettura e riporta un output degradato invece di andare in crash. L'output per umani mostra avvisi come “configured token unavailable in this command path”, e l'output JSON include `secretDiagnostics`.
- Quando la risoluzione locale al comando di SecretRef riesce, status preferisce lo snapshot risolto e rimuove gli indicatori transitori di canale “secret unavailable” dall'output finale.
- `status --all` include una riga di panoramica Secrets e una sezione di diagnosi che riepiloga la diagnostica dei secret (troncata per leggibilità) senza interrompere la generazione del report.

## Correlati

- [Riferimento CLI](/it/cli)
- [Doctor](/it/gateway/doctor)
