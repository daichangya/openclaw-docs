---
read_when:
    - Vuoi un'automazione guidata da eventi per `/new`, `/reset`, `/stop` e per gli eventi del ciclo di vita dell'agente
    - Vuoi creare, installare o eseguire il debug degli hook
summary: 'Hook: automazione guidata da eventi per comandi ed eventi del ciclo di vita'
title: Hook
x-i18n:
    generated_at: "2026-04-26T11:22:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf40a64449347ef750b4b0e0a83b80e2e8fdef87d92daa71f028d2bf6a3d3d22
    source_path: automation/hooks.md
    workflow: 15
---

Gli hook sono piccoli script che vengono eseguiti quando accade qualcosa all'interno del Gateway. Possono essere individuati dalle directory e ispezionati con `openclaw hooks`. Il Gateway carica gli hook interni solo dopo che hai abilitato gli hook o configurato almeno una voce hook, un hook pack, un gestore legacy o una directory hook aggiuntiva.

In OpenClaw esistono due tipi di hook:

- **Hook interni** (questa pagina): vengono eseguiti all'interno del Gateway quando si attivano eventi dell'agente, come `/new`, `/reset`, `/stop` o eventi del ciclo di vita.
- **Webhook**: endpoint HTTP esterni che consentono ad altri sistemi di attivare operazioni in OpenClaw. Vedi [Webhook](/it/automation/cron-jobs#webhooks).

Gli hook possono anche essere inclusi nei plugin. `openclaw hooks list` mostra sia gli hook standalone sia gli hook gestiti dai plugin.

## Avvio rapido

```bash
# Elenca gli hook disponibili
openclaw hooks list

# Abilita un hook
openclaw hooks enable session-memory

# Controlla lo stato degli hook
openclaw hooks check

# Ottieni informazioni dettagliate
openclaw hooks info session-memory
```

## Tipi di evento

| Evento                   | Quando si attiva                                |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | Comando `/new` emesso                           |
| `command:reset`          | Comando `/reset` emesso                         |
| `command:stop`           | Comando `/stop` emesso                          |
| `command`                | Qualsiasi evento comando (listener generale)    |
| `session:compact:before` | Prima che Compaction riassuma la cronologia     |
| `session:compact:after`  | Dopo il completamento di Compaction             |
| `session:patch`          | Quando vengono modificate le proprietà sessione |
| `agent:bootstrap`        | Prima che vengano iniettati i file bootstrap    |
| `gateway:startup`        | Dopo l'avvio dei canali e il caricamento hook   |
| `message:received`       | Messaggio in entrata da qualsiasi canale        |
| `message:transcribed`    | Dopo il completamento della trascrizione audio  |
| `message:preprocessed`   | Dopo il completamento di media e link           |
| `message:sent`           | Messaggio in uscita consegnato                  |

## Scrivere hook

### Struttura di un hook

Ogni hook è una directory che contiene due file:

```
my-hook/
├── HOOK.md          # Metadati + documentazione
└── handler.ts       # Implementazione del gestore
```

### Formato di HOOK.md

```markdown
---
name: my-hook
description: "Breve descrizione di ciò che fa questo hook"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Qui va la documentazione dettagliata.
```

**Campi dei metadati** (`metadata.openclaw`):

| Campo      | Descrizione                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji visualizzata per la CLI                        |
| `events`   | Array degli eventi da ascoltare                      |
| `export`   | Export con nome da usare (predefinito: `"default"`)  |
| `os`       | Piattaforme richieste (ad es. `["darwin", "linux"]`) |
| `requires` | `bins`, `anyBins`, `env` o percorsi `config` richiesti |
| `always`   | Ignora i controlli di idoneità (booleano)            |
| `install`  | Metodi di installazione                              |

### Implementazione del gestore

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Ogni evento include: `type`, `action`, `sessionKey`, `timestamp`, `messages` (usa push per inviare all'utente) e `context` (dati specifici dell'evento). I contesti degli hook dei plugin di agente e tool possono anche includere `trace`, un contesto di traccia diagnostica di sola lettura compatibile con W3C che i plugin possono passare nei log strutturati per la correlazione OTEL.

### Punti salienti del contesto evento

**Eventi comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventi messaggio** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dati specifici del provider, inclusi `senderId`, `senderName`, `guildId`).

**Eventi messaggio** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventi messaggio** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventi messaggio** (`message:preprocessed`): `context.bodyForAgent` (corpo finale arricchito), `context.from`, `context.channelId`.

**Eventi bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array modificabile), `context.agentId`.

**Eventi patch della sessione** (`session:patch`): `context.sessionEntry`, `context.patch` (solo i campi modificati), `context.cfg`. Solo i client con privilegi possono attivare eventi patch.

**Eventi Compaction**: `session:compact:before` include `messageCount`, `tokenCount`. `session:compact:after` aggiunge `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

`command:stop` osserva l'utente che emette `/stop`; riguarda l'annullamento/il ciclo di vita del comando, non è un punto di controllo della finalizzazione dell'agente. I plugin che devono ispezionare una risposta finale naturale e chiedere all'agente un ulteriore passaggio dovrebbero usare invece l'hook tipizzato del plugin `before_agent_finalize`. Vedi [Hook plugin](/it/plugins/hooks).

## Individuazione degli hook

Gli hook vengono individuati da queste directory, in ordine di precedenza crescente per l'override:

1. **Hook inclusi**: distribuiti con OpenClaw
2. **Hook plugin**: hook inclusi nei plugin installati
3. **Hook gestiti**: `~/.openclaw/hooks/` (installati dall'utente, condivisi tra gli spazi di lavoro). Le directory aggiuntive da `hooks.internal.load.extraDirs` condividono questa stessa precedenza.
4. **Hook workspace**: `<workspace>/hooks/` (per agente, disabilitati per impostazione predefinita finché non vengono abilitati esplicitamente)

Gli hook workspace possono aggiungere nuovi nomi di hook ma non possono sovrascrivere hook inclusi, gestiti o forniti da plugin con lo stesso nome.

Il Gateway salta l'individuazione degli hook interni all'avvio finché gli hook interni non sono configurati. Abilita un hook incluso o gestito con `openclaw hooks enable <name>`, installa un hook pack oppure imposta `hooks.internal.enabled=true` per aderire esplicitamente. Quando abiliti un hook nominato, il Gateway carica solo il gestore di quell'hook; `hooks.internal.enabled=true`, le directory hook aggiuntive e i gestori legacy attivano l'individuazione estesa.

### Hook pack

Gli hook pack sono pacchetti npm che esportano hook tramite `openclaw.hooks` in `package.json`. Installa con:

```bash
openclaw plugins install <path-or-spec>
```

Le specifiche npm sono solo da registry (nome pacchetto + versione esatta opzionale o dist-tag). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati.

## Hook inclusi

| Hook                  | Eventi                         | Cosa fa                                                |
| --------------------- | ------------------------------ | ------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset` | Salva il contesto della sessione in `<workspace>/memory/` |
| bootstrap-extra-files | `agent:bootstrap`              | Inietta file bootstrap aggiuntivi da pattern glob      |
| command-logger        | `command`                      | Registra tutti i comandi in `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Esegue `BOOT.md` all'avvio del gateway                 |

Abilita qualsiasi hook incluso:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Dettagli di session-memory

Estrae gli ultimi 15 messaggi utente/assistente, genera uno slug descrittivo per il nome file tramite LLM e lo salva in `<workspace>/memory/YYYY-MM-DD-slug.md`. Richiede che `workspace.dir` sia configurato.

<a id="bootstrap-extra-files"></a>

### Configurazione di bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

I percorsi vengono risolti in relazione al workspace. Vengono caricati solo i basename bootstrap riconosciuti (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Dettagli di command-logger

Registra ogni slash command in `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Dettagli di boot-md

Esegue `BOOT.md` dal workspace attivo all'avvio del gateway.

## Hook plugin

I plugin possono registrare hook tipizzati tramite il Plugin SDK per un'integrazione più profonda:
intercettare chiamate tool, modificare prompt, controllare il flusso dei messaggi e altro.
Usa gli hook plugin quando ti servono `before_tool_call`, `before_agent_reply`,
`before_install` o altri hook in-process del ciclo di vita.

Per il riferimento completo sugli hook plugin, vedi [Hook plugin](/it/plugins/hooks).

## Configurazione

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Variabili d'ambiente per hook:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Directory hook aggiuntive:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
Il formato di configurazione array legacy `hooks.internal.handlers` è ancora supportato per retrocompatibilità, ma i nuovi hook dovrebbero usare il sistema di individuazione.
</Note>

## Riferimento CLI

```bash
# Elenca tutti gli hook (aggiungi --eligible, --verbose o --json)
openclaw hooks list

# Mostra informazioni dettagliate su un hook
openclaw hooks info <hook-name>

# Mostra il riepilogo di idoneità
openclaw hooks check

# Abilita/disabilita
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Best practice

- **Mantieni i gestori rapidi.** Gli hook vengono eseguiti durante l'elaborazione dei comandi. Esegui in fire-and-forget il lavoro pesante con `void processInBackground(event)`.
- **Gestisci gli errori in modo elegante.** Avvolgi le operazioni rischiose in try/catch; non lanciare eccezioni così gli altri gestori possono essere eseguiti.
- **Filtra gli eventi subito.** Restituisci immediatamente se il tipo/azione dell'evento non è pertinente.
- **Usa chiavi evento specifiche.** Preferisci `"events": ["command:new"]` a `"events": ["command"]` per ridurre l'overhead.

## Risoluzione dei problemi

### Hook non individuato

```bash
# Verifica la struttura della directory
ls -la ~/.openclaw/hooks/my-hook/
# Dovrebbe mostrare: HOOK.md, handler.ts

# Elenca tutti gli hook individuati
openclaw hooks list
```

### Hook non idoneo

```bash
openclaw hooks info my-hook
```

Controlla binari mancanti (PATH), variabili d'ambiente, valori di configurazione o compatibilità del sistema operativo.

### Hook non in esecuzione

1. Verifica che l'hook sia abilitato: `openclaw hooks list`
2. Riavvia il processo gateway in modo che gli hook vengano ricaricati.
3. Controlla i log del gateway: `./scripts/clawlog.sh | grep hook`

## Correlati

- [Riferimento CLI: hooks](/it/cli/hooks)
- [Webhook](/it/automation/cron-jobs#webhooks)
- [Hook plugin](/it/plugins/hooks) — hook del ciclo di vita dei plugin in-process
- [Configurazione](/it/gateway/configuration-reference#hooks)
