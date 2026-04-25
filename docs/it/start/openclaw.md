---
read_when:
    - Onboarding di una nuova istanza dell'assistente
    - Revisione delle implicazioni di sicurezza/permessi
summary: Guida end-to-end per eseguire OpenClaw come assistente personale con avvertenze di sicurezza
title: Configurazione dell'assistente personale
x-i18n:
    generated_at: "2026-04-25T13:57:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1647b78e8cf23a3a025969c52fbd8a73aed78df27698abf36bbf62045dc30e3b
    source_path: start/openclaw.md
    workflow: 15
---

# Creare un assistente personale con OpenClaw

OpenClaw è un gateway self-hosted che collega Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo e altri canali ad agenti AI. Questa guida copre la configurazione “assistente personale”: un numero WhatsApp dedicato che si comporta come il tuo assistente AI sempre attivo.

## ⚠️ Sicurezza prima di tutto

Stai mettendo un agente nella posizione di poter:

- eseguire comandi sulla tua macchina (a seconda dei criteri degli strumenti)
- leggere/scrivere file nel tuo workspace
- inviare messaggi in uscita tramite WhatsApp/Telegram/Discord/Mattermost e altri canali inclusi

Inizia in modo conservativo:

- Imposta sempre `channels.whatsapp.allowFrom` (non eseguire mai una configurazione aperta al mondo sul tuo Mac personale).
- Usa un numero WhatsApp dedicato per l'assistente.
- Heartbeat ora usa per impostazione predefinita ogni 30 minuti. Disabilitalo finché non ti fidi della configurazione impostando `agents.defaults.heartbeat.every: "0m"`.

## Prerequisiti

- OpenClaw installato e con onboarding completato — vedi [Per iniziare](/it/start/getting-started) se non l'hai ancora fatto
- Un secondo numero di telefono (SIM/eSIM/prepagata) per l'assistente

## Configurazione con due telefoni (consigliata)

Ti serve questa configurazione:

```mermaid
flowchart TB
    A["<b>Il tuo telefono (personale)<br></b><br>Il tuo WhatsApp<br>+1-555-YOU"] -- messaggio --> B["<b>Secondo telefono (assistente)<br></b><br>WhatsApp assistente<br>+1-555-ASSIST"]
    B -- collegato tramite QR --> C["<b>Il tuo Mac (openclaw)<br></b><br>Agente AI"]
```

Se colleghi il tuo WhatsApp personale a OpenClaw, ogni messaggio che ricevi diventa “input dell'agente”. Raramente è ciò che vuoi.

## Avvio rapido in 5 minuti

1. Abbina WhatsApp Web (mostra un QR; scansionalo con il telefono dell'assistente):

```bash
openclaw channels login
```

2. Avvia il Gateway (lascialo in esecuzione):

```bash
openclaw gateway --port 18789
```

3. Inserisci una configurazione minima in `~/.openclaw/openclaw.json`:

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Ora invia un messaggio al numero dell'assistente dal tuo telefono in allowlist.

Quando l'onboarding termina, OpenClaw apre automaticamente la dashboard e stampa un link pulito (senza token). Se la dashboard richiede auth, incolla il segreto condiviso configurato nelle impostazioni della Control UI. L'onboarding usa un token per impostazione predefinita (`gateway.auth.token`), ma funziona anche l'auth con password se hai cambiato `gateway.auth.mode` in `password`. Per riaprire in seguito: `openclaw dashboard`.

## Dai all'agente un workspace (AGENTS)

OpenClaw legge le istruzioni operative e la “memoria” dalla sua directory workspace.

Per impostazione predefinita, OpenClaw usa `~/.openclaw/workspace` come workspace dell'agente e lo crea automaticamente (insieme ai file iniziali `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) durante la configurazione/prima esecuzione dell'agente. `BOOTSTRAP.md` viene creato solo quando il workspace è completamente nuovo (non dovrebbe ricomparire dopo che lo elimini). `MEMORY.md` è facoltativo (non viene creato automaticamente); quando presente, viene caricato per le sessioni normali. Le sessioni subagent iniettano solo `AGENTS.md` e `TOOLS.md`.

Suggerimento: tratta questa cartella come la “memoria” di OpenClaw e rendila un repo git (idealmente privato) così i tuoi file `AGENTS.md` + memoria hanno un backup. Se git è installato, i workspace completamente nuovi vengono inizializzati automaticamente.

```bash
openclaw setup
```

Struttura completa del workspace + guida backup: [Workspace dell'agente](/it/concepts/agent-workspace)
Flusso di lavoro della memoria: [Memory](/it/concepts/memory)

Facoltativo: scegli un workspace diverso con `agents.defaults.workspace` (supporta `~`).

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Se distribuisci già i tuoi file workspace da un repo, puoi disabilitare completamente la creazione dei file bootstrap:

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## La configurazione che lo trasforma in “un assistente”

OpenClaw usa per impostazione predefinita una buona configurazione da assistente, ma in genere vorrai regolare:

- persona/istruzioni in [`SOUL.md`](/it/concepts/soul)
- valori predefiniti di thinking (se desiderato)
- Heartbeat (una volta che ti fidi della configurazione)

Esempio:

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Inizia da 0; abilita più tardi.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## Sessioni e memoria

- File di sessione: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Metadati della sessione (uso token, ultima route, ecc.): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (legacy: `~/.openclaw/sessions/sessions.json`)
- `/new` o `/reset` avvia una nuova sessione per quella chat (configurabile tramite `resetTriggers`). Se inviato da solo, l'agente risponde con un breve saluto per confermare il reset.
- `/compact [instructions]` esegue la Compaction del contesto della sessione e riporta il budget di contesto rimanente.

## Heartbeat (modalità proattiva)

Per impostazione predefinita, OpenClaw esegue un Heartbeat ogni 30 minuti con il prompt:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Imposta `agents.defaults.heartbeat.every: "0m"` per disabilitarlo.

- Se `HEARTBEAT.md` esiste ma è di fatto vuoto (solo righe vuote e intestazioni markdown come `# Heading`), OpenClaw salta l'esecuzione Heartbeat per risparmiare chiamate API.
- Se il file manca, Heartbeat viene comunque eseguito e il modello decide cosa fare.
- Se l'agente risponde con `HEARTBEAT_OK` (facoltativamente con un breve padding; vedi `agents.defaults.heartbeat.ackMaxChars`), OpenClaw sopprime la consegna in uscita per quell'Heartbeat.
- Per impostazione predefinita, la consegna Heartbeat verso target in stile DM `user:<id>` è consentita. Imposta `agents.defaults.heartbeat.directPolicy: "block"` per sopprimere la consegna a target diretti mantenendo attive le esecuzioni Heartbeat.
- Gli Heartbeat eseguono turni completi dell'agente — intervalli più brevi consumano più token.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## Media in entrata e in uscita

Gli allegati in ingresso (immagini/audio/documenti) possono essere esposti al tuo comando tramite template:

- `{{MediaPath}}` (percorso file temporaneo locale)
- `{{MediaUrl}}` (pseudo-URL)
- `{{Transcript}}` (se la trascrizione audio è abilitata)

Allegati in uscita dall'agente: includi `MEDIA:<path-or-url>` su una propria riga (senza spazi). Esempio:

```
Ecco lo screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw li estrae e li invia come media insieme al testo.

Il comportamento dei percorsi locali segue lo stesso modello di fiducia di lettura file dell'agente:

- Se `tools.fs.workspaceOnly` è `true`, i percorsi locali in uscita `MEDIA:` restano limitati alla root temporanea di OpenClaw, alla cache media, ai percorsi del workspace dell'agente e ai file generati dalla sandbox.
- Se `tools.fs.workspaceOnly` è `false`, `MEDIA:` in uscita può usare file locali dell'host che l'agente è già autorizzato a leggere.
- Gli invii locali dell'host consentono comunque solo media e tipi di documento sicuri (immagini, audio, video, PDF e documenti Office). Testo normale e file simili a segreti non vengono trattati come media inviabili.

Questo significa che immagini/file generati fuori dal workspace ora possono essere inviati quando i tuoi criteri fs consentono già quelle letture, senza riaprire l'esfiltrazione arbitraria di allegati testuali dall'host.

## Checklist operativa

```bash
openclaw status          # stato locale (credenziali, sessioni, eventi in coda)
openclaw status --all    # diagnosi completa (sola lettura, incollabile)
openclaw status --deep   # chiede al gateway un health probe live con probe dei canali quando supportato
openclaw health --json   # snapshot di salute del gateway (WS; il valore predefinito può restituire uno snapshot aggiornato in cache)
```

I log si trovano sotto `/tmp/openclaw/` (predefinito: `openclaw-YYYY-MM-DD.log`).

## Passaggi successivi

- WebChat: [WebChat](/it/web/webchat)
- Operazioni Gateway: [Runbook Gateway](/it/gateway)
- Cron + wakeup: [Cron jobs](/it/automation/cron-jobs)
- Companion della barra dei menu macOS: [App macOS OpenClaw](/it/platforms/macos)
- App Node iOS: [App iOS](/it/platforms/ios)
- App Node Android: [App Android](/it/platforms/android)
- Stato Windows: [Windows (WSL2)](/it/platforms/windows)
- Stato Linux: [App Linux](/it/platforms/linux)
- Sicurezza: [Sicurezza](/it/gateway/security)

## Correlati

- [Per iniziare](/it/start/getting-started)
- [Setup](/it/start/setup)
- [Panoramica dei canali](/it/channels)
