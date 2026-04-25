---
read_when:
    - Aggiornamento di OpenClaw
    - Qualcosa si rompe dopo un aggiornamento
summary: Aggiornare OpenClaw in sicurezza (installazione globale o da sorgente), più strategia di rollback
title: Aggiornamento
x-i18n:
    generated_at: "2026-04-25T13:50:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: af88eaa285145dd5fc370b28c0f9d91069b815c75ec416df726cfce4271a6b54
    source_path: install/updating.md
    workflow: 15
---

Mantieni OpenClaw aggiornato.

## Consigliato: `openclaw update`

Il modo più rapido per aggiornare. Rileva il tuo tipo di installazione (npm o git), recupera l'ultima versione, esegue `openclaw doctor` e riavvia il gateway.

```bash
openclaw update
```

Per cambiare canale o puntare a una versione specifica:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # anteprima senza applicare
```

`--channel beta` preferisce beta, ma il runtime usa il fallback a stable/latest quando
il tag beta manca o è più vecchio dell'ultima release stable. Usa `--tag beta`
se vuoi il raw npm beta dist-tag per un aggiornamento una tantum del pacchetto.

Vedi [Canali di sviluppo](/it/install/development-channels) per la semantica dei canali.

## Alternativa: rieseguire l'installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Aggiungi `--no-onboard` per saltare l'onboarding. Per installazioni da sorgente, passa `--install-method git --no-onboard`.

## Alternativa: npm, pnpm o bun manuale

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Installazioni npm globali e dipendenze runtime

OpenClaw tratta le installazioni globali pacchettizzate come di sola lettura a runtime, anche quando la
directory del pacchetto globale è scrivibile dall'utente corrente. Le dipendenze runtime del Plugin incluse
vengono preparate in una directory runtime scrivibile invece di modificare l'
albero del pacchetto. Questo impedisce a `openclaw update` di entrare in conflitto con un gateway in esecuzione o
con un agente locale che sta riparando le dipendenze del Plugin durante la stessa installazione.

Alcune configurazioni npm su Linux installano i pacchetti globali sotto directory possedute da root come `/usr/lib/node_modules/openclaw`. OpenClaw supporta quel layout tramite lo
stesso percorso di staging esterno.

Per unit systemd hardened, imposta una directory di staging scrivibile inclusa in
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Se `OPENCLAW_PLUGIN_STAGE_DIR` non è impostata, OpenClaw usa `$STATE_DIRECTORY` quando
systemd la fornisce, poi usa come fallback `~/.openclaw/plugin-runtime-deps`.

### Dipendenze runtime del Plugin incluse

Le installazioni pacchettizzate tengono le dipendenze runtime del Plugin incluse fuori dall'
albero del pacchetto di sola lettura. All'avvio e durante `openclaw doctor --fix`, OpenClaw ripara
le dipendenze runtime solo per i Plugin inclusi che sono attivi nella configurazione, attivi
tramite configurazione canale legacy o abilitati dal valore predefinito del loro manifest incluso.

La disabilitazione esplicita ha la precedenza. Un Plugin o canale disabilitato non riceve la riparazione delle
sue dipendenze runtime solo perché esiste nel pacchetto. I Plugin esterni e i percorsi di caricamento personalizzati usano ancora `openclaw plugins install` oppure
`openclaw plugins update`.

## Auto-updater

L'auto-updater è disattivato per impostazione predefinita. Abilitalo in `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Canale   | Comportamento                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | Attende `stableDelayHours`, poi applica con jitter deterministico su `stableJitterHours` (rollout distribuito). |
| `beta`   | Controlla ogni `betaCheckIntervalHours` (predefinito: ogni ora) e applica immediatamente.                     |
| `dev`    | Nessuna applicazione automatica. Usa `openclaw update` manualmente.                                            |

Il gateway registra anche un suggerimento di aggiornamento all'avvio (disabilitalo con `update.checkOnStart: false`).

## Dopo l'aggiornamento

<Steps>

### Esegui doctor

```bash
openclaw doctor
```

Migra la configurazione, esegue l'audit delle policy DM e controlla lo stato del gateway. Dettagli: [Doctor](/it/gateway/doctor)

### Riavvia il gateway

```bash
openclaw gateway restart
```

### Verifica

```bash
openclaw health
```

</Steps>

## Rollback

### Fissa una versione (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Suggerimento: `npm view openclaw version` mostra la versione pubblicata corrente.

### Fissa un commit (sorgente)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Per tornare all'ultima versione: `git checkout main && git pull`.

## Se sei bloccato

- Esegui di nuovo `openclaw doctor` e leggi attentamente l'output.
- Per `openclaw update --channel dev` su checkout del sorgente, l'updater esegue automaticamente il bootstrap di `pnpm` quando necessario. Se vedi un errore di bootstrap pnpm/corepack, installa `pnpm` manualmente (o riabilita `corepack`) e riesegui l'aggiornamento.
- Controlla: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Chiedi su Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Correlati

- [Panoramica dell'installazione](/it/install) — tutti i metodi di installazione
- [Doctor](/it/gateway/doctor) — controlli di integrità dopo gli aggiornamenti
- [Migrazione](/it/install/migrating) — guide di migrazione per versioni major
