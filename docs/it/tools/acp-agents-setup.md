---
read_when:
    - Installazione o configurazione dell'harness acpx per Claude Code / Codex / Gemini CLI
    - Abilitare il bridge MCP plugin-tools o OpenClaw-tools
    - Configurazione delle modalità di autorizzazione ACP
summary: 'Configurazione degli agenti ACP: configurazione dell''harness acpx, impostazione del Plugin, autorizzazioni'
title: Agenti ACP — configurazione
x-i18n:
    generated_at: "2026-04-26T11:38:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c7a638dd26b9343ea5a183954dd3ce3822b904bd2f46dd24f13a6785a646ea3
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Per la panoramica, il runbook operativo e i concetti, vedi [Agenti ACP](/it/tools/acp-agents).

Le sezioni seguenti coprono la configurazione dell'harness acpx, l'impostazione del Plugin per i bridge MCP e la configurazione delle autorizzazioni.

Usa questa pagina solo quando stai configurando il percorso ACP/acpx. Per la configurazione runtime nativa app-server di Codex, usa [Harness Codex](/it/plugins/codex-harness). Per le chiavi API OpenAI o la configurazione del provider di modelli OAuth di Codex, usa [OpenAI](/it/providers/openai).

Codex ha due percorsi OpenClaw:

| Percorso                  | Configurazione/comando                                  | Pagina di configurazione                |
| ------------------------- | ------------------------------------------------------ | --------------------------------------- |
| App-server nativo Codex   | `/codex ...`, `agentRuntime.id: "codex"`               | [Harness Codex](/it/plugins/codex-harness) |
| Adapter ACP esplicito Codex | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Questa pagina                           |

Preferisci il percorso nativo a meno che tu non abbia esplicitamente bisogno del comportamento ACP/acpx.

## Supporto dell'harness acpx (attuale)

Alias degli harness integrati attuali di acpx:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

Quando OpenClaw usa il backend acpx, preferisci questi valori per `agentId` a meno che la tua configurazione acpx non definisca alias agente personalizzati.
Se la tua installazione locale di Cursor espone ancora ACP come `agent acp`, sostituisci il comando dell'agente `cursor` nella tua configurazione acpx invece di cambiare il valore predefinito integrato.

L'uso diretto della CLI acpx può anche puntare ad adapter arbitrari tramite `--agent <command>`, ma questa escape hatch grezza è una funzionalità della CLI acpx (non il normale percorso `agentId` di OpenClaw).

Il controllo del modello dipende dalle capacità dell'adapter. I riferimenti al modello Codex ACP vengono normalizzati da OpenClaw prima dell'avvio. Altri harness richiedono il supporto ACP `models` più `session/set_model`; se un harness non espone né tale capacità ACP né il proprio flag di modello all'avvio, OpenClaw/acpx non può forzare la selezione di un modello.

## Configurazione richiesta

Baseline ACP core:

```json5
{
  acp: {
    enabled: true,
    // Facoltativo. Il valore predefinito è true; imposta false per mettere in pausa il dispatch ACP mantenendo i controlli /acp.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

La configurazione del binding del thread è specifica dell'adapter del canale. Esempio per Discord:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

Se l'avvio ACP associato al thread non funziona, verifica prima il flag di funzionalità dell'adapter:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

I binding della conversazione corrente non richiedono la creazione di thread figlio. Richiedono un contesto di conversazione attivo e un adapter di canale che esponga i binding di conversazione ACP.

Vedi [Riferimento configurazione](/it/gateway/configuration-reference).

## Impostazione del Plugin per il backend acpx

Le installazioni nuove includono il Plugin runtime `acpx` integrato abilitato per impostazione predefinita, quindi ACP di solito funziona senza un passaggio manuale di installazione del Plugin.

Inizia con:

```text
/acp doctor
```

Se hai disabilitato `acpx`, lo hai negato tramite `plugins.allow` / `plugins.deny`, oppure vuoi passare a un checkout di sviluppo locale, usa il percorso esplicito del Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installazione workspace locale durante lo sviluppo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Poi verifica lo stato del backend:

```text
/acp doctor
```

### Configurazione del comando e della versione di acpx

Per impostazione predefinita, il Plugin `acpx` integrato registra il backend ACP incorporato senza avviare un agente ACP durante l'avvio del Gateway. Esegui `/acp doctor` per una verifica live esplicita. Imposta `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` solo quando hai bisogno che il Gateway verifichi l'agente configurato all'avvio.

Sostituisci il comando o la versione nella configurazione del Plugin:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command` accetta un percorso assoluto, un percorso relativo (risolto a partire dal workspace OpenClaw) o un nome comando.
- `expectedVersion: "any"` disabilita la verifica rigorosa della versione.
- I percorsi `command` personalizzati disabilitano l'installazione automatica locale del Plugin.

Vedi [Plugin](/it/tools/plugin).

### Installazione automatica delle dipendenze

Quando installi OpenClaw globalmente con `npm install -g openclaw`, le dipendenze runtime di acpx (binari specifici per piattaforma) vengono installate automaticamente tramite un hook postinstall. Se l'installazione automatica fallisce, il gateway continua comunque ad avviarsi normalmente e segnala la dipendenza mancante tramite `openclaw acp doctor`.

### Bridge MCP degli strumenti Plugin

Per impostazione predefinita, le sessioni ACPX **non** espongono all'harness ACP gli strumenti registrati dai Plugin OpenClaw.

Se vuoi che agenti ACP come Codex o Claude Code possano chiamare strumenti dei Plugin OpenClaw installati, come richiamo/memorizzazione della memoria, abilita il bridge dedicato:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-plugin-tools` nel bootstrap della sessione ACPX.
- Espone gli strumenti Plugin già registrati dai Plugin OpenClaw installati e abilitati.
- Mantiene la funzionalità esplicita e disattivata per impostazione predefinita.

Note su sicurezza e fiducia:

- Questo amplia la superficie degli strumenti dell'harness ACP.
- Gli agenti ACP ottengono accesso solo agli strumenti Plugin già attivi nel gateway.
- Tratta questo come lo stesso confine di fiducia che consente a quei Plugin di essere eseguiti in OpenClaw stesso.
- Controlla i Plugin installati prima di abilitarlo.

I `mcpServers` personalizzati continuano a funzionare come prima. Il bridge integrato plugin-tools è una comodità aggiuntiva opzionale, non un sostituto della configurazione generica del server MCP.

### Bridge MCP degli strumenti OpenClaw

Per impostazione predefinita, le sessioni ACPX inoltre **non** espongono tramite MCP gli strumenti OpenClaw integrati. Abilita il bridge separato degli strumenti core quando un agente ACP ha bisogno di strumenti integrati selezionati come `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-tools` nel bootstrap della sessione ACPX.
- Espone strumenti OpenClaw integrati selezionati. Il server iniziale espone `cron`.
- Mantiene l'esposizione degli strumenti core esplicita e disattivata per impostazione predefinita.

### Configurazione del timeout runtime

Il Plugin `acpx` integrato imposta per impostazione predefinita un timeout di 120 secondi per i turni del runtime incorporato. Questo dà ad harness più lenti come Gemini CLI tempo sufficiente per completare l'avvio e l'inizializzazione ACP. Sostituiscilo se il tuo host richiede un limite runtime diverso:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Riavvia il gateway dopo aver modificato questo valore.

### Configurazione dell'agente per la verifica dello stato

Quando `/acp doctor` o la verifica opzionale all'avvio controllano il backend, il Plugin `acpx` integrato verifica un agente harness. Se `acp.allowedAgents` è impostato, usa per impostazione predefinita il primo agente consentito; altrimenti usa `codex`. Se la tua distribuzione richiede un agente ACP diverso per i controlli di stato, imposta esplicitamente l'agente di verifica:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Riavvia il gateway dopo aver modificato questo valore.

## Configurazione delle autorizzazioni

Le sessioni ACP vengono eseguite in modalità non interattiva — non esiste alcun TTY per approvare o negare i prompt di autorizzazione per scrittura file ed esecuzione shell. Il Plugin acpx fornisce due chiavi di configurazione che controllano come vengono gestite le autorizzazioni:

Queste autorizzazioni dell'harness ACPX sono separate dalle approvazioni di esecuzione di OpenClaw e separate dai flag di bypass specifici del vendor del backend CLI, come Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` è l'interruttore break-glass a livello di harness per le sessioni ACP.

### `permissionMode`

Controlla quali operazioni l'agente harness può eseguire senza prompt.

| Value           | Behavior                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Approva automaticamente tutte le scritture di file e i comandi shell. |
| `approve-reads` | Approva automaticamente solo le letture; scritture ed esecuzione richiedono prompt. |
| `deny-all`      | Nega tutti i prompt di autorizzazione.                    |

### `nonInteractivePermissions`

Controlla cosa succede quando dovrebbe essere mostrato un prompt di autorizzazione ma non è disponibile un TTY interattivo (cosa che vale sempre per le sessioni ACP).

| Value  | Behavior                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Interrompe la sessione con `AcpRuntimeError`. **(predefinito)**   |
| `deny` | Nega silenziosamente l'autorizzazione e continua (degradazione graduale). |

### Configurazione

Imposta tramite la configurazione del Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Riavvia il gateway dopo aver modificato questi valori.

> **Importante:** OpenClaw attualmente usa come impostazioni predefinite `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Nelle sessioni ACP non interattive, qualsiasi scrittura o esecuzione che attivi un prompt di autorizzazione può fallire con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se hai bisogno di limitare le autorizzazioni, imposta `nonInteractivePermissions` su `deny` così le sessioni si degradano in modo graduale invece di bloccarsi.

## Correlati

- [Agenti ACP](/it/tools/acp-agents) — panoramica, runbook operativo, concetti
- [Sub-agenti](/it/tools/subagents)
- [Instradamento multi-agente](/it/concepts/multi-agent)
