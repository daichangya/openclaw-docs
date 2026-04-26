---
read_when:
    - Aggiornamento di OpenClaw
    - Qualcosa si rompe dopo un aggiornamento
summary: Aggiornare OpenClaw in sicurezza (installazione globale o dal sorgente), più strategia di rollback
title: Aggiornamento
x-i18n:
    generated_at: "2026-04-26T11:32:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: e40ff4d2db5f0b75107894d2b4959f34f3077acb55045230fb104b95795d9149
    source_path: install/updating.md
    workflow: 15
---

Mantieni OpenClaw aggiornato.

## Consigliato: `openclaw update`

Il modo più rapido per aggiornare. Rileva il tipo di installazione (npm o git), recupera la versione più recente, esegue `openclaw doctor` e riavvia il gateway.

```bash
openclaw update
```

Per cambiare canale o puntare a una versione specifica:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # anteprima senza applicare
```

`--channel beta` preferisce beta, ma il runtime ripiega su stable/latest quando
il tag beta è mancante o più vecchio dell'ultima release stabile. Usa `--tag beta`
se vuoi il dist-tag beta npm grezzo per un aggiornamento del pacchetto una tantum.

Vedi [Canali di sviluppo](/it/install/development-channels) per la semantica dei canali.

## Passare tra installazioni npm e git

Usa i canali quando vuoi cambiare il tipo di installazione. L'updater mantiene
stato, configurazione, credenziali e workspace in `~/.openclaw`; cambia solo
quale installazione del codice OpenClaw viene usata da CLI e gateway.

```bash
# installazione pacchetto npm -> checkout git modificabile
openclaw update --channel dev

# checkout git -> installazione pacchetto npm
openclaw update --channel stable
```

Esegui prima con `--dry-run` per vedere in anteprima l'esatto cambio di modalità di installazione:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

Il canale `dev` garantisce un checkout git, lo compila e installa la CLI globale
da quel checkout. I canali `stable` e `beta` usano installazioni da pacchetto. Se il
gateway è già installato, `openclaw update` aggiorna i metadati del servizio
e lo riavvia, a meno che tu non passi `--no-restart`.

## Alternativa: rieseguire l'installer

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Aggiungi `--no-onboard` per saltare l'onboarding. Per forzare un tipo di installazione specifico tramite
l'installer, passa `--install-method git --no-onboard` oppure
`--install-method npm --no-onboard`.

## Alternativa: npm, pnpm o bun manuale

```bash
npm i -g openclaw@latest
```

Quando `openclaw update` gestisce un'installazione npm globale, esegue prima il normale
comando di installazione globale. Se quel comando fallisce, OpenClaw ritenta una volta con
`--omit=optional`. Questo retry aiuta sugli host in cui le dipendenze opzionali native
non riescono a compilare, mantenendo comunque visibile l'errore originale se anche il fallback fallisce.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Installazioni npm globali e dipendenze runtime

OpenClaw tratta le installazioni globali pacchettizzate come sola lettura a runtime, anche quando la
directory del pacchetto globale è scrivibile dall'utente corrente. Le dipendenze runtime dei Plugin inclusi nel bundle
vengono preparate in una directory runtime scrivibile invece di modificare l'albero del
pacchetto. Questo evita che `openclaw update` entri in conflitto con un gateway in esecuzione o con un
agente locale che sta riparando le dipendenze dei Plugin durante la stessa installazione.

Alcune configurazioni npm Linux installano i pacchetti globali in directory di proprietà di root come
`/usr/lib/node_modules/openclaw`. OpenClaw supporta quel layout tramite lo stesso
percorso di staging esterno.

Per unità systemd hardenizzate, imposta una directory di staging scrivibile inclusa in
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Se `OPENCLAW_PLUGIN_STAGE_DIR` non è impostata, OpenClaw usa `$STATE_DIRECTORY` quando
systemd lo fornisce, poi ripiega su `~/.openclaw/plugin-runtime-deps`.
Il passaggio di riparazione tratta questo staging come una root di pacchetto locale di proprietà di OpenClaw e
ignora le impostazioni dell'utente relative a npm prefix/global, così la configurazione npm dell'installazione globale non
reindirizza le dipendenze dei Plugin inclusi nel bundle in `~/node_modules` o nell'albero dei pacchetti globali.

Prima degli aggiornamenti di pacchetto e delle riparazioni delle dipendenze runtime incluse nel bundle, OpenClaw prova a eseguire un
controllo best-effort dello spazio disco per il volume di destinazione. Lo spazio insufficiente produce un avviso
con il percorso controllato, ma non blocca l'aggiornamento perché quote filesystem,
snapshot e volumi di rete possono cambiare dopo il controllo. L'effettiva installazione npm,
la copia e la verifica post-installazione restano autorevoli.

### Dipendenze runtime dei Plugin inclusi nel bundle

Le installazioni pacchettizzate tengono le dipendenze runtime dei Plugin inclusi nel bundle fuori dall'albero
del pacchetto in sola lettura. All'avvio e durante `openclaw doctor --fix`, OpenClaw ripara
le dipendenze runtime solo per i Plugin inclusi nel bundle che sono attivi nella configurazione, attivi
tramite configurazione legacy dei canali o abilitati dal valore predefinito del loro manifest incluso nel bundle.
Il solo stato auth dei canali persistito non attiva la riparazione
delle dipendenze runtime all'avvio del Gateway.

La disabilitazione esplicita ha la precedenza. Un Plugin o canale disabilitato non riceve la
riparazione delle proprie dipendenze runtime solo perché esiste nel pacchetto. I Plugin esterni e i percorsi di caricamento personalizzati continuano a usare `openclaw plugins install` oppure
`openclaw plugins update`.

## Aggiornamento automatico

L'aggiornamento automatico è disattivato per impostazione predefinita. Abilitalo in `~/.openclaw/openclaw.json`:

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

| Canale   | Comportamento                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| `stable` | Attende `stableDelayHours`, poi applica con jitter deterministico su `stableJitterHours` (rollout distribuito). |
| `beta`   | Controlla ogni `betaCheckIntervalHours` (predefinito: ogni ora) e applica immediatamente.                         |
| `dev`    | Nessuna applicazione automatica. Usa `openclaw update` manualmente.                                                |

Il gateway registra anche un suggerimento di aggiornamento all'avvio (disabilita con `update.checkOnStart: false`).

## Dopo l'aggiornamento

<Steps>

### Esegui doctor

```bash
openclaw doctor
```

Migra la configurazione, verifica le policy DM e controlla lo stato del gateway. Dettagli: [Doctor](/it/gateway/doctor)

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

- Esegui di nuovo `openclaw doctor` e leggi con attenzione l'output.
- Per `openclaw update --channel dev` su checkout del sorgente, l'updater inizializza automaticamente `pnpm` quando necessario. Se vedi un errore di bootstrap pnpm/corepack, installa `pnpm` manualmente (oppure riabilita `corepack`) e riesegui l'aggiornamento.
- Controlla: [Risoluzione dei problemi](/it/gateway/troubleshooting)
- Chiedi su Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Correlati

- [Panoramica installazione](/it/install) — tutti i metodi di installazione
- [Doctor](/it/gateway/doctor) — controlli health dopo gli aggiornamenti
- [Migrazione](/it/install/migrating) — guide di migrazione per versioni major
