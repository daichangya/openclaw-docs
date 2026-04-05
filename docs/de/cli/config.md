---
read_when:
    - Sie möchten die Konfiguration nicht interaktiv lesen oder bearbeiten
summary: CLI-Referenz für `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: config
x-i18n:
    generated_at: "2026-04-05T12:38:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4de30f41e15297019151ad1a5b306cb331fd5c2beefd5ce5b98fcc51e95f0de
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Konfigurationshilfen für nicht interaktive Bearbeitungen in `openclaw.json`: Werte per Pfad mit `get`/`set`/`unset`/`file`/`schema`/`validate`
lesen, setzen oder entfernen und die aktive Konfigurationsdatei ausgeben. Ohne Subcommand ausgeführt,
wird der Konfigurationsassistent geöffnet (wie bei `openclaw configure`).

Root-Optionen:

- `--section <section>`: wiederholbarer Abschnittsfilter für die geführte Einrichtung, wenn Sie `openclaw config` ohne Subcommand ausführen

Unterstützte geführte Abschnitte:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

## Beispiele

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Gibt das generierte JSON-Schema für `openclaw.json` als JSON auf stdout aus.

Was es enthält:

- Das aktuelle Root-Konfigurationsschema sowie ein Root-String-Feld `$schema` für Editor-Tooling
- Dokumentationsmetadaten `title` und `description`, die von der Control UI verwendet werden
- Verschachtelte Objekte, Wildcard-Knoten (`*`) und Array-Elementknoten (`[]`) übernehmen dieselben Metadaten `title` / `description`, wenn passende Felddokumentation vorhanden ist
- Auch Zweige mit `anyOf` / `oneOf` / `allOf` übernehmen dieselben Dokumentationsmetadaten, wenn passende Felddokumentation vorhanden ist
- Best-Effort-Live-Metadaten für Plugin- + Kanal-Schemas, wenn Runtime-Manifeste geladen werden können
- Ein sauberes Fallback-Schema, selbst wenn die aktuelle Konfiguration ungültig ist

Verwandtes Runtime-RPC:

- `config.schema.lookup` gibt einen normalisierten Konfigurationspfad mit einem flachen
  Schemaknoten (`title`, `description`, `type`, `enum`, `const`, allgemeine Grenzen),
  passenden UI-Hinweismetadaten und Zusammenfassungen der direkten untergeordneten Elemente zurück. Verwenden Sie dies für
  pfadbezogenes Drill-down in der Control UI oder in benutzerdefinierten Clients.

```bash
openclaw config schema
```

Leiten Sie die Ausgabe in eine Datei um, wenn Sie sie mit anderen Tools prüfen oder validieren möchten:

```bash
openclaw config schema > openclaw.schema.json
```

### Pfade

Pfade verwenden Punkt- oder Klammernotation:

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

Verwenden Sie den Index in der Agentenliste, um einen bestimmten Agenten anzusprechen:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Werte

Werte werden nach Möglichkeit als JSON5 geparst, andernfalls als Strings behandelt.
Verwenden Sie `--strict-json`, um JSON5-Parsing zu erzwingen. `--json` wird weiterhin als Legacy-Alias unterstützt.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` gibt den Rohwert als JSON statt als terminalformatierter Text aus.

## Modi von `config set`

`openclaw config set` unterstützt vier Zuweisungsarten:

1. Wertmodus: `openclaw config set <path> <value>`
2. SecretRef-Builder-Modus:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Provider-Builder-Modus (nur für den Pfad `secrets.providers.<alias>`):

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. Batch-Modus (`--batch-json` oder `--batch-file`):

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

Hinweis zur Richtlinie:

- SecretRef-Zuweisungen werden auf nicht unterstützten, zur Laufzeit veränderbaren Oberflächen abgelehnt (zum Beispiel `hooks.token`, `commands.ownerDisplaySecret`, Discord-Webhook-Tokens für Thread-Bindings und WhatsApp-Creds-JSON). Siehe [SecretRef Credential Surface](/reference/secretref-credential-surface).

Das Batch-Parsing verwendet immer die Batch-Payload (`--batch-json`/`--batch-file`) als Quelle der Wahrheit.
`--strict-json` / `--json` ändern das Verhalten des Batch-Parsings nicht.

Der JSON-Pfad-/Wertmodus bleibt sowohl für SecretRefs als auch für Provider unterstützt:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider-Builder-Flags

Ziele des Provider-Builders müssen `secrets.providers.<alias>` als Pfad verwenden.

Gemeinsame Flags:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env-Provider (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (wiederholbar)

File-Provider (`--provider-source file`):

- `--provider-path <path>` (erforderlich)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

Exec-Provider (`--provider-source exec`):

- `--provider-command <path>` (erforderlich)
- `--provider-arg <arg>` (wiederholbar)
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>` (wiederholbar)
- `--provider-pass-env <ENV_VAR>` (wiederholbar)
- `--provider-trusted-dir <path>` (wiederholbar)
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

Beispiel für gehärteten Exec-Provider:

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

## Dry Run

Verwenden Sie `--dry-run`, um Änderungen zu validieren, ohne `openclaw.json` zu schreiben.

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

Verhalten von Dry Run:

- Builder-Modus: führt SecretRef-Auflösbarkeitsprüfungen für geänderte Refs/Provider aus.
- JSON-Modus (`--strict-json`, `--json` oder Batch-Modus): führt Schemaprüfung plus SecretRef-Auflösbarkeitsprüfungen aus.
- Richtlinienvalidierung wird ebenfalls für bekannte nicht unterstützte SecretRef-Zieloberflächen ausgeführt.
- Richtlinienprüfungen bewerten die vollständige Konfiguration nach der Änderung, sodass Schreibvorgänge auf Elternobjektebene (zum Beispiel das Setzen von `hooks` als Objekt) die Validierung nicht unterstützter Oberflächen nicht umgehen können.
- Exec-SecretRef-Prüfungen werden standardmäßig während Dry Run übersprungen, um Nebeneffekte von Befehlen zu vermeiden.
- Verwenden Sie `--allow-exec` zusammen mit `--dry-run`, um Exec-SecretRef-Prüfungen zu aktivieren (dies kann Provider-Befehle ausführen).
- `--allow-exec` gilt nur für Dry Run und erzeugt einen Fehler, wenn es ohne `--dry-run` verwendet wird.

`--dry-run --json` gibt einen maschinenlesbaren Bericht aus:

- `ok`: ob der Dry Run erfolgreich war
- `operations`: Anzahl der ausgewerteten Zuweisungen
- `checks`: ob Schema-/Auflösbarkeitsprüfungen ausgeführt wurden
- `checks.resolvabilityComplete`: ob Auflösbarkeitsprüfungen vollständig ausgeführt wurden (`false`, wenn Exec-Refs übersprungen werden)
- `refsChecked`: Anzahl der Refs, die während Dry Run tatsächlich aufgelöst wurden
- `skippedExecRefs`: Anzahl der Exec-Refs, die übersprungen wurden, weil `--allow-exec` nicht gesetzt war
- `errors`: strukturierte Schema-/Auflösbarkeitsfehler, wenn `ok=false`

### Form der JSON-Ausgabe

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
      ref?: string, // present for resolvability errors
    },
  ],
}
```

Beispiel für Erfolg:

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

Beispiel für Fehler:

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

Wenn der Dry Run fehlschlägt:

- `config schema validation failed`: Die Form Ihrer Konfiguration nach der Änderung ist ungültig; korrigieren Sie Pfad/Wert oder die Form des Provider-/Ref-Objekts.
- `Config policy validation failed: unsupported SecretRef usage`: Verschieben Sie diese Anmeldedaten zurück zu Klartext-/String-Eingaben und verwenden Sie SecretRefs nur auf unterstützten Oberflächen.
- `SecretRef assignment(s) could not be resolved`: Der referenzierte Provider/Ref kann derzeit nicht aufgelöst werden (fehlende Env var, ungültiger Dateizeiger, Fehler im Exec-Provider oder Provider-/Quellen-Mismatch).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: Dry Run hat Exec-Refs übersprungen; führen Sie ihn mit `--allow-exec` erneut aus, wenn Sie die Auflösbarkeit von Exec prüfen müssen.
- Im Batch-Modus: Korrigieren Sie die fehlschlagenden Einträge und führen Sie `--dry-run` erneut aus, bevor Sie schreiben.

## Subcommands

- `config file`: Gibt den aktiven Pfad der Konfigurationsdatei aus (aufgelöst aus `OPENCLAW_CONFIG_PATH` oder dem Standardpfad).

Starten Sie das Gateway nach Änderungen neu.

## Validieren

Validieren Sie die aktuelle Konfiguration gegen das aktive Schema, ohne das
Gateway zu starten.

```bash
openclaw config validate
openclaw config validate --json
```
