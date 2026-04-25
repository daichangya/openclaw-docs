---
read_when:
    - Vuoi leggere o modificare la configurazione in modo non interattivo
summary: Riferimento CLI per `openclaw config` (get/set/unset/file/schema/validate)
title: Config
x-i18n:
    generated_at: "2026-04-25T13:43:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60567d39174d7214461f995d32f3064777d7437ff82226961eab404cd7fec5c4
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Helper Config per modifiche non interattive in `openclaw.json`: get/set/unset/file/schema/validate
dei valori per percorso e stampa del file di configurazione attivo. Esegui senza un sottocomando per
aprire la procedura guidata di configurazione (uguale a `openclaw configure`).

Opzioni root:

- `--section <section>`: filtro ripetibile delle sezioni della configurazione guidata quando esegui `openclaw config` senza un sottocomando

Sezioni guidate supportate:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Esempi

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Stampa lo schema JSON generato per `openclaw.json` su stdout come JSON.

Cosa include:

- Lo schema della configurazione root corrente, più un campo stringa root `$schema` per gli strumenti dell'editor
- I metadati di documentazione dei campi `title` e `description` usati dalla Control UI
- I nodi oggetto annidati, wildcard (`*`) e item array (`[]`) ereditano gli stessi metadati `title` / `description` quando esiste documentazione corrispondente del campo
- Anche i rami `anyOf` / `oneOf` / `allOf` ereditano gli stessi metadati di documentazione quando esiste documentazione corrispondente del campo
- Metadati dello schema di Plugin + canale live best-effort quando i manifest runtime possono essere caricati
- Uno schema di fallback pulito anche quando la configurazione corrente non è valida

RPC runtime correlata:

- `config.schema.lookup` restituisce un percorso di configurazione normalizzato con un nodo schema superficiale (`title`, `description`, `type`, `enum`, `const`, limiti comuni), metadati di hint UI corrispondenti e riepiloghi dei figli immediati. Usalo per il drill-down con ambito percorso nella Control UI o in client personalizzati.

```bash
openclaw config schema
```

Invialo tramite pipe in un file quando vuoi ispezionarlo o validarlo con altri strumenti:

```bash
openclaw config schema > openclaw.schema.json
```

### Percorsi

I percorsi usano la notazione con punto o con parentesi:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Usa l'indice della lista agent per selezionare un agente specifico:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Valori

I valori vengono analizzati come JSON5 quando possibile; altrimenti vengono trattati come stringhe.
Usa `--strict-json` per richiedere l'analisi JSON5. `--json` resta supportato come alias legacy.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` stampa il valore grezzo come JSON invece che come testo formattato per il terminale.

L'assegnazione di oggetti sostituisce per impostazione predefinita il percorso di destinazione. I percorsi mappa/lista protetti
che spesso contengono voci aggiunte dall'utente, come `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` e
`auth.profiles`, rifiutano sostituzioni che rimuoverebbero voci esistenti a meno
che tu non passi `--replace`.

Usa `--merge` quando aggiungi voci a queste mappe:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Usa `--replace` solo quando vuoi intenzionalmente che il valore fornito diventi
l'intero valore di destinazione.

## Modalità di `config set`

`openclaw config set` supporta quattro stili di assegnazione:

1. Modalità valore: `openclaw config set <path> <value>`
2. Modalità builder SecretRef:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Modalità builder provider (solo per il percorso `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Modalità batch (`--batch-json` o `--batch-file`):

```bash
openclaw config set --batch-json '[
  {
    "path": "secrets.providers.default",
    "provider": { "source": "env" }
  },
  {
    "path": "channels.discord.token",
    "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
  }
]'
```

```bash
openclaw config set --batch-file ./config-set.batch.json --dry-run
```

Nota sui criteri:

- Le assegnazioni SecretRef vengono rifiutate sulle superfici mutable a runtime non supportate (ad esempio `hooks.token`, `commands.ownerDisplaySecret`, i token Webhook di thread-binding Discord e il JSON delle credenziali WhatsApp). Vedi [SecretRef Credential Surface](/it/reference/secretref-credential-surface).

L'analisi batch usa sempre il payload batch (`--batch-json`/`--batch-file`) come fonte di verità.
`--strict-json` / `--json` non modificano il comportamento di analisi batch.

La modalità JSON path/value resta supportata sia per SecretRef sia per i provider:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Flag del builder provider

Le destinazioni del builder provider devono usare `secrets.providers.<alias>` come percorso.

Flag comuni:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Provider env (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (ripetibile)

Provider file (`--provider-source file`):

- `--provider-path <path>` (obbligatorio)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Provider exec (`--provider-source exec`):

- `--provider-command <path>` (obbligatorio)
- `--provider-arg <arg>` (ripetibile)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (ripetibile)
- `--provider-pass-env <ENV_VAR>` (ripetibile)
- `--provider-trusted-dir <path>` (ripetibile)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Esempio di provider exec rafforzato:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Dry run

Usa `--dry-run` per validare le modifiche senza scrivere `openclaw.json`.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

Comportamento del dry-run:

- Modalità builder: esegue i controlli di risolvibilità SecretRef per ref/provider modificati.
- Modalità JSON (`--strict-json`, `--json` o modalità batch): esegue la validazione dello schema più i controlli di risolvibilità SecretRef.
- La validazione dei criteri viene eseguita anche per superfici target SecretRef note ma non supportate.
- I controlli dei criteri valutano l'intera configurazione post-modifica, quindi le scritture su oggetti parent (ad esempio impostare `hooks` come oggetto) non possono aggirare la validazione delle superfici non supportate.
- I controlli SecretRef exec vengono saltati per impostazione predefinita durante il dry-run per evitare effetti collaterali dei comandi.
- Usa `--allow-exec` con `--dry-run` per scegliere di eseguire i controlli SecretRef exec (questo può eseguire i comandi del provider).
- `--allow-exec` è solo per il dry-run e genera errore se usato senza `--dry-run`.

`--dry-run --json` stampa un report leggibile da macchina:

- `ok`: se il dry-run è riuscito
- `operations`: numero di assegnazioni valutate
- `checks`: se i controlli schema/risolvibilità sono stati eseguiti
- `checks.resolvabilityComplete`: se i controlli di risolvibilità sono stati completati (false quando i ref exec vengono saltati)
- `refsChecked`: numero di ref effettivamente risolti durante il dry-run
- `skippedExecRefs`: numero di ref exec saltati perché `--allow-exec` non era impostato
- `errors`: errori strutturati di schema/risolvibilità quando `ok=false`

### Forma dell'output JSON

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // presente per errori di risolvibilità
    },
  ],
}
```

Esempio di successo:

```json
{
  "ok": true,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0
}
```

Esempio di errore:

```json
{
  "ok": false,
  "operations": 1,
  "configPath": "~/.openclaw/openclaw.json",
  "inputModes": ["builder"],
  "checks": {
    "schema": false,
    "resolvability": true,
    "resolvabilityComplete": true
  },
  "refsChecked": 1,
  "skippedExecRefs": 0,
  "errors": [
    {
      "kind": "resolvability",
      "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
      "ref": "env:default:MISSING_TEST_SECRET"
    }
  ]
}
```

Se il dry-run fallisce:

- `config schema validation failed`: la forma della tua configurazione post-modifica non è valida; correggi il percorso/valore o la forma dell'oggetto provider/ref.
- `Config policy validation failed: unsupported SecretRef usage`: riporta quella credenziale a un input plaintext/string e mantieni SecretRef solo sulle superfici supportate.
- `SecretRef assignment(s) could not be resolved`: il provider/ref referenziato al momento non può essere risolto (variabile env mancante, puntatore file non valido, errore del provider exec o mancata corrispondenza provider/source).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: il dry-run ha saltato i ref exec; esegui di nuovo con `--allow-exec` se hai bisogno della validazione di risolvibilità exec.
- Per la modalità batch, correggi le voci che falliscono ed esegui di nuovo `--dry-run` prima di scrivere.

## Sicurezza in scrittura

`openclaw config set` e gli altri writer di configurazione gestiti da OpenClaw validano l'intera
configurazione post-modifica prima di salvarla su disco. Se il nuovo payload fallisce la
validazione dello schema o sembra una sovrascrittura distruttiva, la configurazione attiva resta invariata
e il payload rifiutato viene salvato accanto a essa come `openclaw.json.rejected.*`.
Il percorso della configurazione attiva deve essere un file regolare. I layout
`openclaw.json` con symlink non sono supportati per le scritture; usa `OPENCLAW_CONFIG_PATH` per puntare direttamente
al file reale.

Preferisci le scritture CLI per piccole modifiche:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Se una scrittura viene rifiutata, ispeziona il payload salvato e correggi l'intera forma della configurazione:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Le scritture dirette dall'editor sono ancora consentite, ma il Gateway in esecuzione le tratta come
non attendibili finché non vengono validate. Le modifiche dirette non valide possono essere ripristinate
dall'ultimo backup noto valido durante l'avvio o il reload a caldo. Vedi
[Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-restored-last-known-good-config).

Il recupero dell'intero file è riservato a configurazioni globalmente rotte, come
errori di parsing, errori di schema a livello root, errori di migrazione legacy o errori misti
di plugin e root. Se la validazione fallisce solo sotto `plugins.entries.<id>...`,
OpenClaw mantiene attivo `openclaw.json` e segnala invece il problema locale del plugin
senza ripristinare `.last-good`. Questo impedisce che modifiche allo schema del plugin o
disallineamenti di `minHostVersion` ripristinino impostazioni utente non correlate come modelli,
provider, profili auth, canali, esposizione del gateway, strumenti, memoria, browser o
configurazione Cron.

## Sottocomandi

- `config file`: stampa il percorso del file di configurazione attivo (risolto da `OPENCLAW_CONFIG_PATH` o dalla posizione predefinita). Il percorso deve indicare un file regolare, non un symlink.

Riavvia il gateway dopo le modifiche.

## Validate

Valida la configurazione corrente rispetto allo schema attivo senza avviare il
gateway.

```bash
openclaw config validate
openclaw config validate --json
```

Dopo che `openclaw config validate` va a buon fine, puoi usare la TUI locale per far sì che
un agente incorporato confronti la configurazione attiva con la documentazione mentre validi
ogni modifica dallo stesso terminale:

Se la validazione sta già fallendo, inizia con `openclaw configure` oppure
`openclaw doctor --fix`. `openclaw chat` non aggira la protezione contro la
configurazione non valida.

```bash
openclaw chat
```

Poi all'interno della TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Ciclo tipico di riparazione:

- Chiedi all'agente di confrontare la tua configurazione corrente con la pagina della documentazione pertinente e di suggerire la correzione più piccola.
- Applica modifiche mirate con `openclaw config set` oppure `openclaw configure`.
- Esegui di nuovo `openclaw config validate` dopo ogni modifica.
- Se la validazione va a buon fine ma il runtime è ancora non sano, esegui `openclaw doctor` oppure `openclaw doctor --fix` per assistenza con migrazione e riparazione.

## Correlati

- [Riferimento CLI](/it/cli)
- [Configurazione](/it/gateway/configuration)
