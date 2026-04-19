---
read_when:
    - Configurare una nuova macchina
    - Vuoi il “più recente e migliore” senza compromettere la tua configurazione personale
summary: Configurazione avanzata e flussi di lavoro di sviluppo per OpenClaw
title: Configurazione
x-i18n:
    generated_at: "2026-04-19T08:09:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 773cdbef5f38b069303b5e13fca5fcdc28f082746869f17b8b92aab1610b95a8
    source_path: start/setup.md
    workflow: 15
---

# Configurazione

<Note>
Se stai configurando per la prima volta, inizia con [Introduzione](/it/start/getting-started).
Per i dettagli sull'onboarding, vedi [Onboarding (CLI)](/it/start/wizard).
</Note>

## In breve

- **La personalizzazione si trova fuori dal repository:** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (configurazione).
- **Flusso di lavoro stabile:** installa l'app macOS; lascia che esegua il Gateway incluso.
- **Flusso di lavoro all'avanguardia:** esegui tu stesso il Gateway tramite `pnpm gateway:watch`, poi lascia che l'app macOS si colleghi in modalità Local.

## Prerequisiti (dal codice sorgente)

- Node 24 consigliato (Node 22 LTS, attualmente `22.14+`, ancora supportato)
- `pnpm` preferito (oppure Bun se usi intenzionalmente il [flusso di lavoro Bun](/it/install/bun))
- Docker (facoltativo; solo per configurazione/containerizzata ed e2e — vedi [Docker](/it/install/docker))

## Strategia di personalizzazione (così gli aggiornamenti non fanno danni)

Se vuoi qualcosa di “100% su misura per me” _e_ aggiornamenti semplici, mantieni la tua personalizzazione in:

- **Configurazione:** `~/.openclaw/openclaw.json` (stile JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompt, memorie; rendilo un repository git privato)

Inizializza una volta:

```bash
openclaw setup
```

Da dentro questo repository, usa il punto di ingresso locale della CLI:

```bash
openclaw setup
```

Se non hai ancora un'installazione globale, eseguilo tramite `pnpm openclaw setup` (oppure `bun run openclaw setup` se stai usando il flusso di lavoro Bun).

## Eseguire il Gateway da questo repository

Dopo `pnpm build`, puoi eseguire direttamente la CLI pacchettizzata:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flusso di lavoro stabile (prima l'app macOS)

1. Installa e avvia **OpenClaw.app** (barra dei menu).
2. Completa la checklist di onboarding/autorizzazioni (prompt TCC).
3. Assicurati che il Gateway sia **Local** e in esecuzione (l'app lo gestisce).
4. Collega le superfici di messaggistica (esempio: WhatsApp):

```bash
openclaw channels login
```

5. Controllo rapido:

```bash
openclaw health
```

Se l'onboarding non è disponibile nella tua build:

- Esegui `openclaw setup`, poi `openclaw channels login`, quindi avvia manualmente il Gateway (`openclaw gateway`).

## Flusso di lavoro all'avanguardia (Gateway in un terminale)

Obiettivo: lavorare sul Gateway TypeScript, ottenere il ricaricamento a caldo e mantenere collegata l'interfaccia dell'app macOS.

### 0) (Facoltativo) Esegui anche l'app macOS dal codice sorgente

Se vuoi anche l'app macOS all'avanguardia:

```bash
./scripts/restart-mac.sh
```

### 1) Avvia il Gateway di sviluppo

```bash
pnpm install
# Solo alla prima esecuzione (o dopo aver reimpostato la configurazione/workspace locale di OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` esegue il gateway in modalità watch e si ricarica quando rileva modifiche rilevanti al codice sorgente, alla configurazione e ai metadati dei Plugin inclusi.
`pnpm openclaw setup` è il passaggio una tantum di inizializzazione della configurazione/workspace locale per un checkout pulito.
`pnpm gateway:watch` non ricompila `dist/control-ui`, quindi esegui di nuovo `pnpm ui:build` dopo modifiche in `ui/` oppure usa `pnpm ui:dev` durante lo sviluppo della Control UI.

Se stai usando intenzionalmente il flusso di lavoro Bun, i comandi equivalenti sono:

```bash
bun install
# Solo alla prima esecuzione (o dopo aver reimpostato la configurazione/workspace locale di OpenClaw)
bun run openclaw setup
bun run gateway:watch
```

### 2) Punta l'app macOS al tuo Gateway in esecuzione

In **OpenClaw.app**:

- Modalità di connessione: **Local**
  L'app si collegherà al gateway in esecuzione sulla porta configurata.

### 3) Verifica

- Nell'app, lo stato del Gateway dovrebbe mostrare **“Using existing gateway …”**
- Oppure tramite CLI:

```bash
openclaw health
```

### Errori comuni

- **Porta sbagliata:** il WS del Gateway usa per impostazione predefinita `ws://127.0.0.1:18789`; mantieni app + CLI sulla stessa porta.
- **Dove si trova lo stato:**
  - Stato dei canali/provider: `~/.openclaw/credentials/`
  - Profili di autenticazione del modello: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessioni: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Mappa dell'archiviazione delle credenziali

Usa questa sezione durante il debug dell'autenticazione o per decidere cosa salvare nel backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token del bot Telegram**: config/env oppure `channels.telegram.tokenFile` (solo file normali; i collegamenti simbolici vengono rifiutati)
- **Token del bot Discord**: config/env oppure SecretRef (provider env/file/exec)
- **Token Slack**: config/env (`channels.slack.*`)
- **Allowlist di pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (account predefinito)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (account non predefiniti)
- **Profili di autenticazione del modello**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload dei secret basati su file (facoltativo)**: `~/.openclaw/secrets.json`
- **Importazione OAuth legacy**: `~/.openclaw/credentials/oauth.json`
  Maggiori dettagli: [Sicurezza](/it/gateway/security#credential-storage-map).

## Aggiornare (senza distruggere la tua configurazione)

- Mantieni `~/.openclaw/workspace` e `~/.openclaw/` come “la tua roba”; non mettere prompt/configurazioni personali nel repository `openclaw`.
- Aggiornamento dal codice sorgente: `git pull` + il passaggio di installazione del gestore di pacchetti scelto (`pnpm install` per impostazione predefinita; `bun install` per il flusso di lavoro Bun) + continua a usare il comando `gateway:watch` corrispondente.

## Linux (servizio utente systemd)

Le installazioni Linux usano un servizio **utente** systemd. Per impostazione predefinita, systemd arresta i servizi utente quando esci dalla sessione o durante l'inattività, il che termina il Gateway. L'onboarding prova ad abilitare il lingering per te (potrebbe richiedere sudo). Se è ancora disattivato, esegui:

```bash
sudo loginctl enable-linger $USER
```

Per server sempre attivi o multiutente, valuta invece un servizio **di sistema** anziché un servizio utente (non è necessario il lingering). Vedi il [runbook del Gateway](/it/gateway) per le note su systemd.

## Documentazione correlata

- [Runbook del Gateway](/it/gateway) (flag, supervisione, porte)
- [Configurazione del Gateway](/it/gateway/configuration) (schema della configurazione + esempi)
- [Discord](/it/channels/discord) e [Telegram](/it/channels/telegram) (tag di risposta + impostazioni `replyToMode`)
- [Configurazione dell'assistente OpenClaw](/it/start/openclaw)
- [app macOS](/it/platforms/macos) (ciclo di vita del gateway)
