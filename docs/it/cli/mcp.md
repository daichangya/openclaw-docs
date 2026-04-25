---
read_when:
    - Collegare Codex, Claude Code o un altro client MCP a canali supportati da OpenClaw
    - Esecuzione di `openclaw mcp serve`
    - Gestione delle definizioni dei server MCP salvate da OpenClaw
summary: Esporre le conversazioni dei canali OpenClaw tramite MCP e gestire le definizioni salvate dei server MCP
title: MCP
x-i18n:
    generated_at: "2026-04-25T13:44:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca2a76d1dbca71b4048659c21ac7ff98a01cc6095f6baad67df5347f45cd32e6
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` ha due funzioni:

- eseguire OpenClaw come server MCP con `openclaw mcp serve`
- gestire le definizioni dei server MCP in uscita di proprietà di OpenClaw con `list`, `show`,
  `set` e `unset`

In altre parole:

- `serve` è OpenClaw che agisce come server MCP
- `list` / `show` / `set` / `unset` è OpenClaw che agisce come registro lato client MCP
  per altri server MCP che i suoi runtime potrebbero poi usare

Usa [`openclaw acp`](/it/cli/acp) quando OpenClaw deve ospitare esso stesso una
sessione coding harness e instradare quel runtime tramite ACP.

## OpenClaw come server MCP

Questo è il percorso `openclaw mcp serve`.

## Quando usare `serve`

Usa `openclaw mcp serve` quando:

- Codex, Claude Code o un altro client MCP devono parlare direttamente con
  conversazioni di canale supportate da OpenClaw
- hai già un Gateway OpenClaw locale o remoto con sessioni instradate
- vuoi un server MCP unico che funzioni attraverso i backend canale di OpenClaw invece
  di eseguire bridge separati per ogni canale

Usa invece [`openclaw acp`](/it/cli/acp) quando OpenClaw deve ospitare il
runtime coding stesso e mantenere la sessione dell'agente all'interno di OpenClaw.

## Come funziona

`openclaw mcp serve` avvia un server MCP stdio. Il client MCP possiede quel
processo. Finché il client mantiene aperta la sessione stdio, il bridge si connette a un
Gateway OpenClaw locale o remoto tramite WebSocket ed espone conversazioni di canale
instradate tramite MCP.

Ciclo di vita:

1. il client MCP avvia `openclaw mcp serve`
2. il bridge si connette al Gateway
3. le sessioni instradate diventano conversazioni MCP e strumenti di transcript/cronologia
4. gli eventi live vengono accodati in memoria mentre il bridge è connesso
5. se la modalità canale Claude è abilitata, la stessa sessione può ricevere anche
   notifiche push specifiche di Claude

Comportamenti importanti:

- lo stato della coda live inizia quando il bridge si connette
- la cronologia transcript precedente viene letta con `messages_read`
- le notifiche push Claude esistono solo mentre la sessione MCP è attiva
- quando il client si disconnette, il bridge termina e la coda live scompare
- i punti di ingresso agente one-shot come `openclaw agent` e
  `openclaw infer model run` ritirano tutti i runtime MCP integrati che aprono quando la
  risposta è completata, così esecuzioni scriptate ripetute non accumulano processi
  figlio MCP stdio
- i server MCP stdio avviati da OpenClaw (integrati o configurati dall'utente) vengono chiusi
  come albero di processi all'arresto, così i sottoprocessi figlio avviati dal
  server non sopravvivono dopo l'uscita del client stdio padre
- eliminare o reimpostare una sessione elimina i client MCP di quella sessione tramite
  il percorso condiviso di pulizia del runtime, quindi non ci sono connessioni stdio residue
  legate a una sessione rimossa

## Scegliere una modalità client

Usa lo stesso bridge in due modi diversi:

- Client MCP generici: solo strumenti MCP standard. Usa `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` e gli
  strumenti di approvazione.
- Claude Code: strumenti MCP standard più l'adattatore canale specifico di Claude.
  Abilita `--claude-channel-mode on` o lascia il valore predefinito `auto`.

Oggi, `auto` si comporta come `on`. Non esiste ancora il rilevamento delle capacità del client.

## Cosa espone `serve`

Il bridge usa i metadati di instradamento sessione esistenti del Gateway per esporre
conversazioni supportate da canale. Una conversazione appare quando OpenClaw ha già stato
di sessione con un percorso noto come:

- `channel`
- metadati destinatario o destinazione
- `accountId` facoltativo
- `threadId` facoltativo

Questo offre ai client MCP un unico punto in cui:

- elencare le conversazioni instradate recenti
- leggere la cronologia transcript recente
- attendere nuovi eventi in ingresso
- inviare una risposta indietro tramite lo stesso percorso
- vedere le richieste di approvazione che arrivano mentre il bridge è connesso

## Utilizzo

```bash
# Gateway locale
openclaw mcp serve

# Gateway remoto
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Gateway remoto con autenticazione tramite password
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Abilita log verbosi del bridge
openclaw mcp serve --verbose

# Disabilita le notifiche push specifiche di Claude
openclaw mcp serve --claude-channel-mode off
```

## Strumenti del bridge

Il bridge attuale espone questi strumenti MCP:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Elenca le conversazioni recenti supportate da sessione che hanno già metadati di instradamento nello
stato di sessione del Gateway.

Filtri utili:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Restituisce una conversazione tramite `session_key`.

### `messages_read`

Legge i messaggi transcript recenti per una conversazione supportata da sessione.

### `attachments_fetch`

Estrae i blocchi di contenuto del messaggio non testuali da un messaggio transcript. Questa è una
vista metadati del contenuto del transcript, non un archivio blob allegati durevole autonomo.

### `events_poll`

Legge gli eventi live accodati a partire da un cursore numerico.

### `events_wait`

Esegue un long-poll finché non arriva il successivo evento accodato corrispondente oppure scade un timeout.

Usalo quando un client MCP generico ha bisogno di consegna quasi in tempo reale senza un
protocollo push specifico di Claude.

### `messages_send`

Invia testo indietro tramite lo stesso percorso già registrato sulla sessione.

Comportamento attuale:

- richiede un percorso di conversazione esistente
- usa il canale, il destinatario, l'ID account e l'ID thread della sessione
- invia solo testo

### `permissions_list_open`

Elenca le richieste di approvazione exec/Plugin in sospeso che il bridge ha osservato da quando si è
connesso al Gateway.

### `permissions_respond`

Risolve una richiesta di approvazione exec/Plugin in sospeso con:

- `allow-once`
- `allow-always`
- `deny`

## Modello degli eventi

Il bridge mantiene una coda eventi in memoria mentre è connesso.

Tipi di eventi attuali:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Limiti importanti:

- la coda è solo live; inizia quando il bridge MCP si avvia
- `events_poll` e `events_wait` non ripropongono da soli la cronologia precedente del Gateway
- l'arretrato durevole va letto con `messages_read`

## Notifiche canale Claude

Il bridge può anche esporre notifiche canale specifiche di Claude. Questo è l'equivalente OpenClaw
di un adattatore canale Claude Code: gli strumenti MCP standard rimangono disponibili,
ma i messaggi live in ingresso possono anche arrivare come notifiche MCP specifiche di Claude.

Flag:

- `--claude-channel-mode off`: solo strumenti MCP standard
- `--claude-channel-mode on`: abilita notifiche canale Claude
- `--claude-channel-mode auto`: valore predefinito attuale; stesso comportamento bridge di `on`

Quando la modalità canale Claude è abilitata, il server pubblicizza capacità sperimentali Claude
e può emettere:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamento attuale del bridge:

- i messaggi transcript `user` in ingresso vengono inoltrati come
  `notifications/claude/channel`
- le richieste di permesso Claude ricevute tramite MCP vengono tracciate in memoria
- se la conversazione collegata invia successivamente `yes abcde` o `no abcde`, il bridge
  lo converte in `notifications/claude/channel/permission`
- queste notifiche valgono solo per la sessione live; se il client MCP si disconnette,
  non esiste una destinazione push

Questo è intenzionalmente specifico del client. I client MCP generici dovrebbero basarsi sugli
strumenti di polling standard.

## Configurazione del client MCP

Esempio di configurazione client stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Per la maggior parte dei client MCP generici, inizia con la superficie strumenti standard e ignora
la modalità Claude. Attiva la modalità Claude solo per i client che comprendono davvero i
metodi di notifica specifici di Claude.

## Opzioni

`openclaw mcp serve` supporta:

- `--url <url>`: URL WebSocket del Gateway
- `--token <token>`: token Gateway
- `--token-file <path>`: legge il token da file
- `--password <password>`: password Gateway
- `--password-file <path>`: legge la password da file
- `--claude-channel-mode <auto|on|off>`: modalità notifiche Claude
- `-v`, `--verbose`: log verbosi su stderr

Quando possibile, preferisci `--token-file` o `--password-file` ai secret inline.

## Sicurezza e confine di attendibilità

Il bridge non inventa l'instradamento. Espone solo conversazioni che il Gateway
sa già come instradare.

Questo significa:

- allowlist dei mittenti, pairing e attendibilità a livello canale appartengono ancora alla
  configurazione del canale OpenClaw sottostante
- `messages_send` può rispondere solo tramite un percorso memorizzato esistente
- lo stato di approvazione è solo live/in memoria per la sessione bridge corrente
- l'autenticazione del bridge dovrebbe usare gli stessi controlli token o password Gateway di cui
  ti fideresti per qualsiasi altro client Gateway remoto

Se una conversazione manca da `conversations_list`, la causa abituale non è la configurazione
MCP. Sono metadati di instradamento mancanti o incompleti nella sessione
Gateway sottostante.

## Test

OpenClaw include uno smoke Docker deterministico per questo bridge:

```bash
pnpm test:docker:mcp-channels
```

Questo smoke:

- avvia un container Gateway inizializzato
- avvia un secondo container che esegue `openclaw mcp serve`
- verifica rilevamento conversazioni, letture transcript, letture metadati allegati,
  comportamento della coda eventi live e instradamento degli invii in uscita
- convalida notifiche canale e di permesso in stile Claude tramite il vero
  bridge MCP stdio

Questo è il modo più rapido per dimostrare che il bridge funziona senza collegare un account
Telegram, Discord o iMessage reale all'esecuzione del test.

Per un contesto di test più ampio, vedi [Testing](/it/help/testing).

## Risoluzione dei problemi

### Nessuna conversazione restituita

Di solito significa che la sessione Gateway non è già instradabile. Conferma che la
sessione sottostante abbia memorizzato i metadati di instradamento canale/provider, destinatario e
account/thread facoltativi.

### `events_poll` o `events_wait` non trovano messaggi più vecchi

Previsto. La coda live inizia quando il bridge si connette. Leggi la cronologia transcript più vecchia con `messages_read`.

### Le notifiche Claude non compaiono

Controlla tutti questi punti:

- il client ha mantenuto aperta la sessione MCP stdio
- `--claude-channel-mode` è `on` o `auto`
- il client comprende davvero i metodi di notifica specifici di Claude
- il messaggio in ingresso è avvenuto dopo la connessione del bridge

### Mancano le approvazioni

`permissions_list_open` mostra solo le richieste di approvazione osservate mentre il bridge
era connesso. Non è un'API durevole della cronologia delle approvazioni.

## OpenClaw come registro client MCP

Questo è il percorso `openclaw mcp list`, `show`, `set` e `unset`.

Questi comandi non espongono OpenClaw tramite MCP. Gestiscono le definizioni dei server MCP di proprietà di OpenClaw
sotto `mcp.servers` nella configurazione OpenClaw.

Quelle definizioni salvate servono ai runtime che OpenClaw avvia o configura
successivamente, come Pi integrato e altri adattatori runtime. OpenClaw memorizza le
definizioni in modo centralizzato così quei runtime non devono mantenere i propri elenchi
duplicati di server MCP.

Comportamenti importanti:

- questi comandi leggono o scrivono solo la configurazione OpenClaw
- non si connettono al server MCP di destinazione
- non convalidano se il comando, l'URL o il trasporto remoto sono
  raggiungibili in questo momento
- gli adattatori runtime decidono quali forme di trasporto supportano davvero al
  momento dell'esecuzione
- Pi integrato espone gli strumenti MCP configurati nei normali profili strumenti `coding` e `messaging`; `minimal` continua a nasconderli, e `tools.deny: ["bundle-mcp"]`
  li disabilita esplicitamente
- i runtime MCP integrati con ambito sessione vengono eliminati dopo `mcp.sessionIdleTtlMs`
  millisecondi di inattività (predefinito 10 minuti; imposta `0` per disabilitare) e
  le esecuzioni integrate one-shot li puliscono al termine dell'esecuzione

## Definizioni salvate dei server MCP

OpenClaw memorizza anche un registro leggero di server MCP nella configurazione per le superfici
che vogliono definizioni MCP gestite da OpenClaw.

Comandi:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Note:

- `list` ordina i nomi dei server.
- `show` senza un nome stampa l'intero oggetto server MCP configurato.
- `set` si aspetta un singolo valore oggetto JSON sulla riga di comando.
- `unset` fallisce se il server nominato non esiste.

Esempi:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Esempio di forma della configurazione:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Trasporto stdio

Avvia un processo figlio locale e comunica tramite stdin/stdout.

| Campo                      | Descrizione                             |
| -------------------------- | --------------------------------------- |
| `command`                  | Eseguibile da avviare (obbligatorio)    |
| `args`                     | Array di argomenti della riga di comando |
| `env`                      | Variabili d'ambiente aggiuntive         |
| `cwd` / `workingDirectory` | Directory di lavoro del processo        |

#### Filtro di sicurezza env stdio

OpenClaw rifiuta le chiavi env di avvio dell'interprete che possono alterare il modo in cui un server MCP stdio si avvia prima della prima RPC, anche se compaiono nel blocco `env` di un server. Le chiavi bloccate includono `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` e variabili simili di controllo del runtime. L'avvio le rifiuta con un errore di configurazione così non possono iniettare un preambolo implicito, sostituire l'interprete o abilitare un debugger contro il processo stdio. Le normali variabili env di credenziali, proxy e specifiche del server (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizzati, ecc.) non sono interessate.

Se il tuo server MCP ha davvero bisogno di una delle variabili bloccate, impostala sul processo host del gateway invece che sotto `env` del server stdio.

### Trasporto SSE / HTTP

Si connette a un server MCP remoto tramite HTTP Server-Sent Events.

| Campo                 | Descrizione                                                           |
| --------------------- | --------------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del server remoto (obbligatorio)                     |
| `headers`             | Mappa facoltativa chiave-valore di header HTTP (ad esempio token auth) |
| `connectionTimeoutMs` | Timeout di connessione per server in ms (facoltativo)                 |

Esempio:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

I valori sensibili in `url` (userinfo) e `headers` vengono oscurati nei log e
nell'output di stato.

### Trasporto HTTP streamable

`streamable-http` è un'opzione di trasporto aggiuntiva insieme a `sse` e `stdio`. Usa lo streaming HTTP per la comunicazione bidirezionale con server MCP remoti.

| Campo                 | Descrizione                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del server remoto (obbligatorio)                                           |
| `transport`           | Imposta `"streamable-http"` per selezionare questo trasporto; se omesso, OpenClaw usa `sse` |
| `headers`             | Mappa facoltativa chiave-valore di header HTTP (ad esempio token auth)                      |
| `connectionTimeoutMs` | Timeout di connessione per server in ms (facoltativo)                                       |

Esempio:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Questi comandi gestiscono solo la configurazione salvata. Non avviano il bridge di canale,
non aprono una sessione client MCP live e non dimostrano che il server di destinazione sia raggiungibile.

## Limiti attuali

Questa pagina documenta il bridge così come è distribuito oggi.

Limiti attuali:

- il rilevamento delle conversazioni dipende dai metadati di instradamento della sessione Gateway esistenti
- nessun protocollo push generico oltre all'adattatore specifico di Claude
- ancora nessuno strumento per modificare messaggi o reagire
- il trasporto HTTP/SSE/streamable-http si connette a un singolo server remoto; nessun upstream multiplexato per ora
- `permissions_list_open` include solo le approvazioni osservate mentre il bridge è
  connesso

## Correlati

- [Riferimento CLI](/it/cli)
- [Plugin](/it/cli/plugins)
