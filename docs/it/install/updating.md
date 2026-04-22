---
read_when:
    - Aggiornamento di OpenClaw
    - Qualcosa si rompe dopo un aggiornamento
summary: Aggiornare OpenClaw in modo sicuro (installazione globale o da sorgente), più strategia di rollback
title: Aggiornamento
x-i18n:
    generated_at: "2026-04-22T04:23:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ab2b515457c64d24c830e2e1678d9fefdcf893e0489f0d99b039db3b877b3c4
    source_path: install/updating.md
    workflow: 15
---

# Aggiornamento

Mantieni OpenClaw aggiornato.

## Consigliato: `openclaw update`

Il modo più rapido per aggiornare. Rileva il tipo di installazione (npm o git), recupera la versione più recente, esegue `openclaw doctor` e riavvia il Gateway.

```bash
openclaw update
```

Per cambiare canale o scegliere una versione specifica:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # anteprima senza applicare
```

`--channel beta` preferisce la beta, ma il runtime torna a stable/latest quando
il tag beta è assente o più vecchio dell'ultima release stable. Usa `--tag beta`
se vuoi il dist-tag beta raw di npm per un aggiornamento una tantum del pacchetto.

Vedi [Canali di sviluppo](/it/install/development-channels) per la semantica dei canali.

## Alternativa: esegui di nuovo l'installer

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

### Installazioni npm globali di proprietà di root

Alcune configurazioni npm su Linux installano i pacchetti globali in directory di proprietà di root come
`/usr/lib/node_modules/openclaw`. OpenClaw supporta questo layout: il pacchetto
installato viene trattato come di sola lettura in fase di runtime, e le dipendenze
runtime dei Plugin inclusi vengono preparate in una directory runtime scrivibile invece di modificare
l'albero del pacchetto.

Per unità systemd hardenizzate, imposta una directory di staging scrivibile inclusa in
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Se `OPENCLAW_PLUGIN_STAGE_DIR` non è impostata, OpenClaw usa `$STATE_DIRECTORY` quando
systemd la fornisce, poi torna a `~/.openclaw/plugin-runtime-deps`.

## Aggiornatore automatico

L'aggiornatore automatico è disattivato per impostazione predefinita. Abilitalo in `~/.openclaw/openclaw.json`:

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

| Canale   | Comportamento                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| `stable` | Attende `stableDelayHours`, poi applica con jitter deterministico distribuito su `stableJitterHours` (rollout distribuito). |
| `beta`   | Controlla ogni `betaCheckIntervalHours` (predefinito: ogni ora) e applica immediatamente.                       |
| `dev`    | Nessuna applicazione automatica. Usa `openclaw update` manualmente.                                              |

Il Gateway registra anche un suggerimento di aggiornamento all'avvio (disattivalo con `update.checkOnStart: false`).

## Dopo l'aggiornamento

<Steps>

### Esegui doctor

```bash
openclaw doctor
```

Migra la configurazione, esegue l'audit dei criteri DM e controlla lo stato del Gateway. Dettagli: [Doctor](/it/gateway/doctor)

### Riavvia il Gateway

```bash
openclaw gateway restart
```

### Verifica

```bash
openclaw health
```

</Steps>

## Rollback

### Blocca una versione (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Suggerimento: `npm view openclaw version` mostra la versione pubblicata corrente.

### Blocca un commit (sorgente)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Per tornare all'ultima versione: `git checkout main && git pull`.

## Se sei bloccato

- Esegui di nuovo `openclaw doctor` e leggi attentamente l'output.
- Per `openclaw update --channel dev` sui checkout da sorgente, l'aggiornatore esegue automaticamente il bootstrap di `pnpm` quando necessario. Se vedi un errore di bootstrap pnpm/corepack, installa `pnpm` manualmente (oppure riattiva `corepack`) e riesegui l'aggiornamento.
- Controlla: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Chiedi su Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Correlati

- [Panoramica dell'installazione](/it/install) — tutti i metodi di installazione
- [Doctor](/it/gateway/doctor) — controlli di stato dopo gli aggiornamenti
- [Migrazione](/it/install/migrating) — guide di migrazione per le versioni principali
