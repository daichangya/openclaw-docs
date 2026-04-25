---
read_when:
    - Vuoi eseguire un turno agente da script (con consegna facoltativa della risposta)
summary: Riferimento CLI per `openclaw agent` (invia un turno agente tramite il Gateway)
title: Agente
x-i18n:
    generated_at: "2026-04-25T13:43:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: e06681ffbed56cb5be05c7758141e784eac8307ed3c6fc973f71534238b407e1
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Esegui un turno agente tramite il Gateway (usa `--local` per la modalità incorporata).
Usa `--agent <id>` per indirizzare direttamente un agente configurato.

Passa almeno un selettore di sessione:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Correlati:

- Strumento di invio agente: [Agent send](/it/tools/agent-send)

## Opzioni

- `-m, --message <text>`: corpo del messaggio richiesto
- `-t, --to <dest>`: destinatario usato per derivare la chiave di sessione
- `--session-id <id>`: id sessione esplicito
- `--agent <id>`: id agente; sovrascrive i binding di instradamento
- `--thinking <level>`: livello di ragionamento dell'agente (`off`, `minimal`, `low`, `medium`, `high`, oltre a livelli personalizzati supportati dal provider come `xhigh`, `adaptive` o `max`)
- `--verbose <on|off>`: mantiene il livello verbose per la sessione
- `--channel <channel>`: canale di consegna; omettilo per usare il canale della sessione principale
- `--reply-to <target>`: sovrascrittura della destinazione di consegna
- `--reply-channel <channel>`: sovrascrittura del canale di consegna
- `--reply-account <id>`: sovrascrittura dell'account di consegna
- `--local`: esegui direttamente l'agente incorporato (dopo il preload del registro Plugin)
- `--deliver`: invia la risposta al canale/destinazione selezionato
- `--timeout <seconds>`: sovrascrive il timeout dell'agente (predefinito 600 o valore di configurazione)
- `--json`: output JSON

## Esempi

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Note

- La modalità Gateway usa come fallback l'agente incorporato quando la richiesta al Gateway fallisce. Usa `--local` per forzare subito l'esecuzione incorporata.
- `--local` esegue comunque prima il preload del registro Plugin, così provider, strumenti e canali forniti dai Plugin restano disponibili durante le esecuzioni incorporate.
- Ogni invocazione di `openclaw agent` è trattata come esecuzione una tantum. I server MCP inclusi o configurati dall'utente aperti per quell'esecuzione vengono ritirati dopo la risposta, anche quando il comando usa il percorso Gateway, quindi i processi figli stdio MCP non restano attivi tra invocazioni da script.
- `--channel`, `--reply-channel` e `--reply-account` influiscono sulla consegna della risposta, non sull'instradamento della sessione.
- `--json` mantiene stdout riservato alla risposta JSON. Le diagnostiche del Gateway, del Plugin e del fallback incorporato vengono instradate a stderr così gli script possono analizzare direttamente stdout.
- Quando questo comando attiva la rigenerazione di `models.json`, le credenziali del provider gestite da SecretRef vengono mantenute come marcatori non segreti (per esempio nomi di variabili d'ambiente, `secretref-env:ENV_VAR_NAME` o `secretref-managed`), non come testo in chiaro dei segreti risolti.
- Le scritture dei marcatori sono autorevoli rispetto alla sorgente: OpenClaw mantiene i marcatori dallo snapshot della configurazione sorgente attiva, non dai valori segreti risolti a runtime.

## Correlati

- [Riferimento CLI](/it/cli)
- [Runtime dell'agente](/it/concepts/agent)
