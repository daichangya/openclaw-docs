---
read_when:
    - Vuoi gestire gli hook dell'agente
    - Vuoi controllare la disponibilità degli hook o abilitare gli hook dello spazio di lavoro
summary: Riferimento CLI per `openclaw hooks` (hook dell'agente)
title: Hooks
x-i18n:
    generated_at: "2026-04-25T13:44:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd84cc984b24996c5509ce6b69f9bb76c61c4fa65b002809fdf5776abe67b48b
    source_path: cli/hooks.md
    workflow: 15
---

# `openclaw hooks`

Gestisci gli hook dell'agente (automazioni guidate da eventi per comandi come `/new`, `/reset` e l'avvio del gateway).

Eseguire `openclaw hooks` senza sottocomando equivale a `openclaw hooks list`.

Correlati:

- Hooks: [Hooks](/it/automation/hooks)
- Hook dei Plugin: [Plugin hooks](/it/plugins/hooks)

## Elencare tutti gli hook

```bash
openclaw hooks list
```

Elenca tutti gli hook rilevati nelle directory workspace, managed, extra e bundled.
L'avvio del gateway non carica gli handler hook interni finché non è configurato almeno un hook interno.

**Opzioni:**

- `--eligible`: Mostra solo gli hook idonei (requisiti soddisfatti)
- `--json`: Output in formato JSON
- `-v, --verbose`: Mostra informazioni dettagliate, inclusi i requisiti mancanti

**Esempio di output:**

```
Hooks (4/4 pronti)

Pronti:
  🚀 boot-md ✓ - Esegui BOOT.md all'avvio del gateway
  📎 bootstrap-extra-files ✓ - Inietta file bootstrap aggiuntivi dello spazio di lavoro durante il bootstrap dell'agente
  📝 command-logger ✓ - Registra tutti gli eventi dei comandi in un file di audit centralizzato
  💾 session-memory ✓ - Salva il contesto della sessione nella memoria quando viene emesso il comando /new o /reset
```

**Esempio (verbose):**

```bash
openclaw hooks list --verbose
```

Mostra i requisiti mancanti per gli hook non idonei.

**Esempio (JSON):**

```bash
openclaw hooks list --json
```

Restituisce JSON strutturato per uso programmatico.

## Ottenere informazioni su un hook

```bash
openclaw hooks info <name>
```

Mostra informazioni dettagliate su un hook specifico.

**Argomenti:**

- `<name>`: Nome hook o chiave hook (ad esempio `session-memory`)

**Opzioni:**

- `--json`: Output in formato JSON

**Esempio:**

```bash
openclaw hooks info session-memory
```

**Output:**

```
💾 session-memory ✓ Pronto

Salva il contesto della sessione nella memoria quando viene emesso il comando /new o /reset

Dettagli:
  Sorgente: openclaw-bundled
  Percorso: /path/to/openclaw/hooks/bundled/session-memory/HOOK.md
  Handler: /path/to/openclaw/hooks/bundled/session-memory/handler.ts
  Homepage: https://docs.openclaw.ai/automation/hooks#session-memory
  Eventi: command:new, command:reset

Requisiti:
  Config: ✓ workspace.dir
```

## Verificare l'idoneità degli hook

```bash
openclaw hooks check
```

Mostra un riepilogo dello stato di idoneità degli hook (quanti sono pronti rispetto a quanti non sono pronti).

**Opzioni:**

- `--json`: Output in formato JSON

**Esempio di output:**

```
Stato degli hook

Hook totali: 4
Pronti: 4
Non pronti: 0
```

## Abilitare un hook

```bash
openclaw hooks enable <name>
```

Abilita un hook specifico aggiungendolo alla tua configurazione (`~/.openclaw/openclaw.json` per impostazione predefinita).

**Nota:** gli hook dello spazio di lavoro sono disabilitati per impostazione predefinita finché non vengono abilitati qui o nella configurazione. Gli hook gestiti dai Plugin mostrano `plugin:<id>` in `openclaw hooks list` e non possono essere abilitati/disabilitati qui. Abilita/disabilita invece il Plugin.

**Argomenti:**

- `<name>`: Nome hook (ad esempio `session-memory`)

**Esempio:**

```bash
openclaw hooks enable session-memory
```

**Output:**

```
✓ Hook abilitato: 💾 session-memory
```

**Cosa fa:**

- Verifica che l'hook esista e sia idoneo
- Aggiorna `hooks.internal.entries.<name>.enabled = true` nella tua configurazione
- Salva la configurazione su disco

Se l'hook proviene da `<workspace>/hooks/`, questo passaggio di opt-in è richiesto prima
che il Gateway lo carichi.

**Dopo l'abilitazione:**

- Riavvia il gateway in modo che gli hook vengano ricaricati (riavvio dell'app nella barra dei menu su macOS, oppure riavvia il processo gateway in dev).

## Disabilitare un hook

```bash
openclaw hooks disable <name>
```

Disabilita un hook specifico aggiornando la tua configurazione.

**Argomenti:**

- `<name>`: Nome hook (ad esempio `command-logger`)

**Esempio:**

```bash
openclaw hooks disable command-logger
```

**Output:**

```
⏸ Hook disabilitato: 📝 command-logger
```

**Dopo la disabilitazione:**

- Riavvia il gateway in modo che gli hook vengano ricaricati

## Note

- `openclaw hooks list --json`, `info --json` e `check --json` scrivono JSON strutturato direttamente su stdout.
- Gli hook gestiti dai Plugin non possono essere abilitati o disabilitati qui; abilita o disabilita invece il Plugin proprietario.

## Installare pacchetti di hook

```bash
openclaw plugins install <package>        # ClawHub prima, poi npm
openclaw plugins install <package> --pin  # fissa la versione
openclaw plugins install <path>           # percorso locale
```

Installa pacchetti di hook tramite l'installer unificato dei Plugin.

`openclaw hooks install` funziona ancora come alias di compatibilità, ma stampa un
avviso di deprecazione e inoltra a `openclaw plugins install`.

Le specifiche npm sono **solo registro** (nome pacchetto + **versione esatta** facoltativa o
**dist-tag**). Le specifiche Git/URL/file e gli intervalli semver vengono rifiutati. Le
installazioni delle dipendenze vengono eseguite con `--ignore-scripts` per sicurezza.

Le specifiche semplici e `@latest` restano sul canale stable. Se npm risolve uno di
questi in una prerelease, OpenClaw si ferma e ti chiede di eseguire esplicitamente l'opt-in con un
tag prerelease come `@beta`/`@rc` o una versione prerelease esatta.

**Cosa fa:**

- Copia il pacchetto di hook in `~/.openclaw/hooks/<id>`
- Abilita gli hook installati in `hooks.internal.entries.*`
- Registra l'installazione in `hooks.internal.installs`

**Opzioni:**

- `-l, --link`: Collega una directory locale invece di copiarla (la aggiunge a `hooks.internal.load.extraDirs`)
- `--pin`: Registra le installazioni npm come `name@version` esatto risolto in `hooks.internal.installs`

**Archivi supportati:** `.zip`, `.tgz`, `.tar.gz`, `.tar`

**Esempi:**

```bash
# Directory locale
openclaw plugins install ./my-hook-pack

# Archivio locale
openclaw plugins install ./my-hook-pack.zip

# Pacchetto NPM
openclaw plugins install @openclaw/my-hook-pack

# Collega una directory locale senza copiarla
openclaw plugins install -l ./my-hook-pack
```

I pacchetti di hook collegati vengono trattati come hook managed da una
directory configurata dall'operatore, non come hook dello spazio di lavoro.

## Aggiornare pacchetti di hook

```bash
openclaw plugins update <id>
openclaw plugins update --all
```

Aggiorna i pacchetti di hook basati su npm tracciati tramite l'updater unificato dei Plugin.

`openclaw hooks update` funziona ancora come alias di compatibilità, ma stampa un
avviso di deprecazione e inoltra a `openclaw plugins update`.

**Opzioni:**

- `--all`: Aggiorna tutti i pacchetti di hook tracciati
- `--dry-run`: Mostra cosa cambierebbe senza scrivere

Quando esiste un hash di integrità memorizzato e l'hash dell'artefatto recuperato cambia,
OpenClaw stampa un avviso e chiede conferma prima di procedere. Usa
il `--yes` globale per bypassare i prompt in esecuzioni CI/non interattive.

## Hook bundled

### session-memory

Salva il contesto della sessione nella memoria quando emetti `/new` o `/reset`.

**Abilita:**

```bash
openclaw hooks enable session-memory
```

**Output:** `~/.openclaw/workspace/memory/YYYY-MM-DD-slug.md`

**Vedi:** [documentazione session-memory](/it/automation/hooks#session-memory)

### bootstrap-extra-files

Inietta file bootstrap aggiuntivi (ad esempio `AGENTS.md` / `TOOLS.md` locali del monorepo) durante `agent:bootstrap`.

**Abilita:**

```bash
openclaw hooks enable bootstrap-extra-files
```

**Vedi:** [documentazione bootstrap-extra-files](/it/automation/hooks#bootstrap-extra-files)

### command-logger

Registra tutti gli eventi dei comandi in un file di audit centralizzato.

**Abilita:**

```bash
openclaw hooks enable command-logger
```

**Output:** `~/.openclaw/logs/commands.log`

**Visualizza i log:**

```bash
# Comandi recenti
tail -n 20 ~/.openclaw/logs/commands.log

# Pretty-print
cat ~/.openclaw/logs/commands.log | jq .

# Filtra per azione
grep '"action":"new"' ~/.openclaw/logs/commands.log | jq .
```

**Vedi:** [documentazione command-logger](/it/automation/hooks#command-logger)

### boot-md

Esegue `BOOT.md` all'avvio del gateway (dopo l'avvio dei canali).

**Eventi**: `gateway:startup`

**Abilita**:

```bash
openclaw hooks enable boot-md
```

**Vedi:** [documentazione boot-md](/it/automation/hooks#boot-md)

## Correlati

- [Riferimento CLI](/it/cli)
- [Hook di automazione](/it/automation/hooks)
