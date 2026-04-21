---
read_when:
    - Vuoi attivare le esecuzioni dell'agente dagli script o dalla riga di comando
    - Devi recapitare programmaticamente le risposte dell'agente a un canale di chat
summary: Esegui i turni dell'agente dalla CLI e, facoltativamente, recapita le risposte ai canali
title: Invio dell'agente
x-i18n:
    generated_at: "2026-04-21T13:35:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0550ad38efb2711f267a62b905fd150987a98801247de780ed3df97f27245704
    source_path: tools/agent-send.md
    workflow: 15
---

# Invio dell'agente

`openclaw agent` esegue un singolo turno dell'agente dalla riga di comando senza richiedere
un messaggio di chat in ingresso. Usalo per flussi di lavoro scriptati, test e
recapito programmatico.

## Guida rapida

<Steps>
  <Step title="Esegui un semplice turno dell'agente">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Questo invia il messaggio tramite il Gateway e stampa la risposta.

  </Step>

  <Step title="Indirizza a un agente o a una sessione specifici">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Recapita la risposta a un canale">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Flag

| Flag                          | Descrizione                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Messaggio da inviare (obbligatorio)                         |
| `--to \<dest\>`               | Ricava la chiave di sessione da una destinazione (telefono, id chat) |
| `--agent \<id\>`              | Indirizza a un agente configurato (usa la sua sessione `main`) |
| `--session-id \<id\>`         | Riutilizza una sessione esistente tramite id                |
| `--local`                     | Forza il runtime embedded locale (salta il Gateway)         |
| `--deliver`                   | Invia la risposta a un canale di chat                       |
| `--channel \<name\>`          | Canale di recapito (whatsapp, telegram, discord, slack, ecc.) |
| `--reply-to \<target\>`       | Sostituzione della destinazione di recapito                 |
| `--reply-channel \<name\>`    | Sostituzione del canale di recapito                         |
| `--reply-account \<id\>`      | Sostituzione dell'id account di recapito                    |
| `--thinking \<level\>`        | Imposta il livello di thinking per il profilo modello selezionato |
| `--verbose \<on\|full\|off\>` | Imposta il livello di verbosità                             |
| `--timeout \<seconds\>`       | Sostituisce il timeout dell'agente                          |
| `--json`                      | Produce JSON strutturato                                    |

## Comportamento

- Per impostazione predefinita, la CLI passa **attraverso il Gateway**. Aggiungi `--local` per forzare il
  runtime embedded sulla macchina corrente.
- Se il Gateway non è raggiungibile, la CLI **ripiega** sull'esecuzione embedded locale.
- Selezione della sessione: `--to` ricava la chiave di sessione (le destinazioni di gruppo/canale
  preservano l'isolamento; le chat dirette convergono su `main`).
- I flag thinking e verbose vengono mantenuti nell'archivio sessioni.
- Output: testo normale per impostazione predefinita, oppure `--json` per payload strutturato + metadati.

## Esempi

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## Correlati

- [Riferimento della CLI dell'agente](/cli/agent)
- [Sub-agents](/it/tools/subagents) — generazione di sub-agent in background
- [Sessioni](/it/concepts/session) — come funzionano le chiavi di sessione
