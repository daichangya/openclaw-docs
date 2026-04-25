---
read_when:
    - Installazione o configurazione dell'harness acpx per Claude Code / Codex / Gemini CLI
    - Abilitazione del bridge MCP plugin-tools o OpenClaw-tools
    - Configurazione delle modalità di autorizzazione ACP
summary: 'Configurazione degli agenti ACP: configurazione dell''harness acpx, configurazione del Plugin, permessi'
title: Agenti ACP — configurazione
x-i18n:
    generated_at: "2026-04-25T13:57:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6c23d8245c4893c48666096a296820e003685252cedee7df41ea7a2be1f4bf0
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Per la panoramica, il runbook operativo e i concetti, vedi [Agenti ACP](/it/tools/acp-agents).

Le sezioni seguenti trattano la configurazione dell'harness acpx, la configurazione del Plugin per i bridge MCP e la configurazione dei permessi.

## Supporto dell'harness acpx (attuale)

Alias di harness integrati attuali di acpx:

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

Quando OpenClaw usa il backend acpx, preferisci questi valori per `agentId` a meno che la tua configurazione acpx non definisca alias di agenti personalizzati.
Se la tua installazione locale di Cursor espone ancora ACP come `agent acp`, sostituisci il comando dell'agente `cursor` nella tua configurazione acpx invece di modificare il valore predefinito integrato.

L'uso diretto della CLI di acpx può anche puntare ad adattatori arbitrari tramite `--agent <command>`, ma questa via di fuga diretta è una funzionalità della CLI di acpx (non il normale percorso `agentId` di OpenClaw).

## Configurazione richiesta

Baseline ACP di base:

```json5
{
  acp: {
    enabled: true,
    // Opzionale. Il valore predefinito è true; imposta false per sospendere l'instradamento ACP mantenendo i controlli /acp.
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

La configurazione del binding dei thread è specifica dell'adattatore di canale. Esempio per Discord:

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

Se l'avvio ACP vincolato al thread non funziona, verifica prima il flag di funzionalità dell'adattatore:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

I binding della conversazione corrente non richiedono la creazione di thread figli. Richiedono un contesto di conversazione attivo e un adattatore di canale che esponga i binding ACP della conversazione.

Vedi [Riferimento della configurazione](/it/gateway/configuration-reference).

## Configurazione del Plugin per il backend acpx

Le nuove installazioni distribuiscono il Plugin runtime `acpx` incluso attivato per impostazione predefinita, quindi ACP di solito funziona senza un passaggio manuale di installazione del Plugin.

Inizia con:

```text
/acp doctor
```

Se hai disattivato `acpx`, lo hai negato tramite `plugins.allow` / `plugins.deny`, o vuoi passare a un checkout di sviluppo locale, usa il percorso esplicito del Plugin:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Installazione del workspace locale durante lo sviluppo:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Quindi verifica lo stato del backend:

```text
/acp doctor
```

### Configurazione del comando e della versione di acpx

Per impostazione predefinita, il Plugin `acpx` incluso usa il proprio binario locale fissato del Plugin (`node_modules/.bin/acpx` all'interno del pacchetto del Plugin). All'avvio registra il backend come non pronto e un processo in background verifica `acpx --version`; se il binario manca o non corrisponde, esegue `npm install --omit=dev --no-save acpx@<pinned>` e verifica di nuovo. Il Gateway rimane sempre non bloccante.

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

- `command` accetta un percorso assoluto, un percorso relativo (risolto dal workspace OpenClaw) o un nome di comando.
- `expectedVersion: "any"` disattiva la corrispondenza rigorosa della versione.
- I percorsi `command` personalizzati disattivano l'installazione automatica locale del Plugin.

Vedi [Plugin](/it/tools/plugin).

### Installazione automatica delle dipendenze

Quando installi OpenClaw globalmente con `npm install -g openclaw`, le dipendenze runtime di acpx (binari specifici per piattaforma) vengono installate automaticamente tramite un hook postinstall. Se l'installazione automatica non riesce, il Gateway si avvia comunque normalmente e segnala la dipendenza mancante tramite `openclaw acp doctor`.

### Bridge MCP degli strumenti del Plugin

Per impostazione predefinita, le sessioni ACPX **non** espongono all'harness ACP gli strumenti registrati dai Plugin OpenClaw.

Se vuoi che agenti ACP come Codex o Claude Code possano chiamare strumenti dei Plugin OpenClaw installati, come memory recall/store, abilita il bridge dedicato:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-plugin-tools` nel bootstrap della sessione ACPX.
- Espone gli strumenti dei Plugin già registrati dai Plugin OpenClaw installati e attivati.
- Mantiene la funzionalità esplicita e disattivata per impostazione predefinita.

Note su sicurezza e fiducia:

- Questo amplia la superficie degli strumenti dell'harness ACP.
- Gli agenti ACP ottengono accesso solo agli strumenti dei Plugin già attivi nel Gateway.
- Consideralo lo stesso confine di fiducia del permettere a quei Plugin di essere eseguiti in OpenClaw stesso.
- Rivedi i Plugin installati prima di abilitarlo.

I `mcpServers` personalizzati continuano a funzionare come prima. Il bridge integrato plugin-tools è una comodità aggiuntiva con attivazione esplicita, non un sostituto della configurazione generica del server MCP.

### Bridge MCP degli strumenti OpenClaw

Per impostazione predefinita, anche le sessioni ACPX **non** espongono tramite MCP gli strumenti integrati di OpenClaw. Abilita il bridge separato dei core-tools quando un agente ACP ha bisogno di strumenti integrati selezionati come `cron`:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Cosa fa:

- Inietta un server MCP integrato chiamato `openclaw-tools` nel bootstrap della sessione ACPX.
- Espone strumenti integrati selezionati di OpenClaw. Il server iniziale espone `cron`.
- Mantiene l'esposizione degli strumenti core esplicita e disattivata per impostazione predefinita.

### Configurazione del timeout del runtime

Il Plugin `acpx` incluso imposta per impostazione predefinita i turni del runtime incorporato a un timeout di 120 secondi. Questo dà ad harness più lenti come Gemini CLI abbastanza tempo per completare l'avvio e l'inizializzazione ACP. Sostituiscilo se il tuo host richiede un limite runtime diverso:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Riavvia il Gateway dopo aver modificato questo valore.

### Configurazione dell'agente di probe dello stato

Il Plugin `acpx` incluso esegue il probe di un agente harness mentre decide se il backend del runtime incorporato è pronto. Se `acp.allowedAgents` è impostato, per impostazione predefinita usa il primo agente consentito; altrimenti usa `codex`. Se la tua distribuzione richiede un agente ACP diverso per i controlli di stato, imposta esplicitamente l'agente di probe:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Riavvia il Gateway dopo aver modificato questo valore.

## Configurazione dei permessi

Le sessioni ACP vengono eseguite in modo non interattivo: non c'è alcun TTY per approvare o negare i prompt di permesso per scrittura di file ed esecuzione della shell. Il Plugin acpx fornisce due chiavi di configurazione che controllano il modo in cui vengono gestiti i permessi:

Questi permessi dell'harness ACPX sono separati dalle approvazioni exec di OpenClaw e separati dai flag di bypass del vendor del backend CLI come Claude CLI `--permission-mode bypassPermissions`. ACPX `approve-all` è l'interruttore di emergenza a livello di harness per le sessioni ACP.

### `permissionMode`

Controlla quali operazioni l'agente dell'harness può eseguire senza richiedere conferma.

| Value           | Behavior                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Approva automaticamente tutte le scritture di file e i comandi shell.          |
| `approve-reads` | Approva automaticamente solo le letture; scritture ed exec richiedono prompt. |
| `deny-all`      | Nega tutti i prompt di permesso.                              |

### `nonInteractivePermissions`

Controlla cosa succede quando dovrebbe essere mostrato un prompt di permesso ma non è disponibile alcun TTY interattivo (cosa che accade sempre per le sessioni ACP).

| Value  | Behavior                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Interrompe la sessione con `AcpRuntimeError`. **(predefinito)**           |
| `deny` | Nega silenziosamente il permesso e continua (degradazione graduale). |

### Configurazione

Imposta tramite la configurazione del Plugin:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Riavvia il Gateway dopo aver modificato questi valori.

> **Importante:** OpenClaw attualmente usa come impostazioni predefinite `permissionMode=approve-reads` e `nonInteractivePermissions=fail`. Nelle sessioni ACP non interattive, qualsiasi scrittura o exec che attiva un prompt di permesso può fallire con `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`.
>
> Se hai bisogno di limitare i permessi, imposta `nonInteractivePermissions` su `deny` in modo che le sessioni si degradino in modo graduale invece di bloccarsi.

## Correlati

- [Agenti ACP](/it/tools/acp-agents) — panoramica, runbook operativo, concetti
- [Sotto-agenti](/it/tools/subagents)
- [Instradamento multi-agente](/it/concepts/multi-agent)
