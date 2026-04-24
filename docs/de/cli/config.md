---
read_when:
    - Sie möchten die Konfiguration nicht interaktiv lesen oder bearbeiten
summary: CLI-Referenz für `openclaw config` (`get`/`set`/`unset`/`file`/`schema`/`validate`)
title: Konfiguration
x-i18n:
    generated_at: "2026-04-24T06:30:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15e2eb75cc415df52ddcd104d8e5295d8d7b84baca65b4368deb3f06259f6bcd
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

Konfigurationshilfen für nicht interaktive Bearbeitungen in `openclaw.json`: Werte per Pfad mit
get/set/unset/file/schema/validate abrufen, setzen, entfernen, und die aktive Konfigurationsdatei ausgeben.
Ohne Unterbefehl ausgeführt, wird der Konfigurationsassistent geöffnet (wie bei `openclaw configure`).

Root-Optionen:

- `--section <section>`: wiederholbarer Filter für Abschnitte der geführten Einrichtung, wenn Sie `openclaw config` ohne Unterbefehl ausführen

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
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

Gibt das generierte JSON-Schema für `openclaw.json` als JSON auf stdout aus.

Was enthalten ist:

- Das aktuelle Root-Konfigurationsschema sowie ein Root-Stringfeld `$schema` für Editor-Tooling
- Feldmetadaten `title` und `description`, wie sie von der Control-UI verwendet werden
- Verschachtelte Objekt-, Wildcard- (`*`) und Array-Element- (`[]`) Knoten übernehmen dieselben Metadaten für `title` / `description`, wenn passende Felddokumentation vorhanden ist
- Zweige von `anyOf` / `oneOf` / `allOf` übernehmen ebenfalls dieselben Dokumentationsmetadaten, wenn passende Felddokumentation vorhanden ist
- Best-Effort-Live-Metadaten für Plugin- und Kanal-Schemas, wenn Runtime-Manifeste geladen werden können
- Ein sauberes Fallback-Schema, selbst wenn die aktuelle Konfiguration ungültig ist

Verwandte Runtime-RPC:

- `config.schema.lookup` gibt einen normalisierten Konfigurationspfad mit einem flachen
  Schemaknoten (`title`, `description`, `type`, `enum`, `const`, gemeinsame Grenzen),
  passenden UI-Hinweismetadaten und Zusammenfassungen der direkten Kindknoten zurück. Verwenden Sie dies für
  pfadbezogenes Drill-down in der Control-UI oder in benutzerdefinierten Clients.

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

Verwenden Sie den Index der Agentenliste, um einen bestimmten Agenten anzusprechen:

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Werte

Werte werden, wenn möglich, als JSON5 geparst; andernfalls werden sie als Strings behandelt.
Verwenden Sie `--strict-json`, um JSON5-Parsing zu erzwingen. `--json` wird weiterhin als veralteter Alias unterstützt.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` gibt den Rohwert als JSON statt als terminalformatierten Text aus.

Objektzuweisungen ersetzen standardmäßig den Zielpfad. Geschützte Map-/Listenpfade,
die häufig benutzerdefinierte Einträge enthalten, wie `agents.defaults.models`,
`models.providers`, `models.providers.<id>.models`, `plugins.entries` und
`auth.profiles`, verweigern Ersetzungen, durch die bestehende Einträge entfernt würden, sofern
Sie nicht `--replace` angeben.

Verwenden Sie `--merge`, wenn Sie diesen Maps Einträge hinzufügen:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

Verwenden Sie `--replace` nur dann, wenn der angegebene Wert
absichtlich zum vollständigen Zielwert werden soll.

## Modi von `config set`

`openclaw config set` unterstützt vier Zuweisungsstile:

1. Wertmodus: `openclaw config set <path> <value>`
2. SecretRef-Buildmodus:

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. Provider-Buildmodus (nur für den Pfad `secrets.providers.<alias>`):

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

- SecretRef-Zuweisungen werden auf nicht unterstützten, zur Laufzeit mutierbaren Oberflächen abgelehnt (zum Beispiel `hooks.token`, `commands.ownerDisplaySecret`, Webhook-Token für Discord-Thread-Bindungen und WhatsApp-creds-JSON). Siehe [SecretRef Credential Surface](/de/reference/secretref-credential-surface).

Das Batch-Parsing verwendet immer die Batch-Payload (`--batch-json`/`--batch-file`) als Source of Truth.
`--strict-json` / `--json` ändern das Verhalten des Batch-Parsings nicht.

Der Modus für JSON-Pfad/Wert bleibt sowohl für SecretRefs als auch für Provider unterstützt:

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider-Build-Flags

Ziele des Provider-Builders müssen `secrets.providers.<alias>` als Pfad verwenden.

Allgemeine Flags:

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>` (`file`, `exec`)

Env-Provider (`--provider-source env`):

- `--provider-allowlist <ENV_VAR>` (wiederholbar)

Datei-Provider (`--provider-source file`):

- `--provider-path <path>` (erforderlich)
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

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

Beispiel für einen gehärteten Exec-Provider:

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

- Buildmodus: führt Prüfungen der SecretRef-Auflösbarkeit für geänderte Refs/Provider aus.
- JSON-Modus (`--strict-json`, `--json` oder Batch-Modus): führt Schema-Validierung plus Prüfungen der SecretRef-Auflösbarkeit aus.
- Richtlinienvalidierung wird ebenfalls für bekannte nicht unterstützte SecretRef-Zieloberflächen ausgeführt.
- Richtlinienprüfungen werten die vollständige Konfiguration nach der Änderung aus, sodass Schreibvorgänge auf übergeordnete Objekte (zum Beispiel das Setzen von `hooks` als Objekt) die Validierung nicht unterstützter Oberflächen nicht umgehen können.
- Prüfungen von Exec-SecretRefs werden standardmäßig während Dry Run übersprungen, um Seiteneffekte von Befehlen zu vermeiden.
- Verwenden Sie `--allow-exec` zusammen mit `--dry-run`, um Exec-SecretRef-Prüfungen zu aktivieren (dies kann Provider-Befehle ausführen).
- `--allow-exec` ist nur für Dry Run verfügbar und führt zu einem Fehler, wenn es ohne `--dry-run` verwendet wird.

`--dry-run --json` gibt einen maschinenlesbaren Bericht aus:

- `ok`: ob der Dry Run erfolgreich war
- `operations`: Anzahl der ausgewerteten Zuweisungen
- `checks`: ob Schema-/Auflösbarkeitsprüfungen ausgeführt wurden
- `checks.resolvabilityComplete`: ob die Auflösbarkeitsprüfungen vollständig ausgeführt wurden (`false`, wenn Exec-Refs übersprungen werden)
- `refsChecked`: Anzahl der während Dry Run tatsächlich aufgelösten Refs
- `skippedExecRefs`: Anzahl der übersprungenen Exec-Refs, weil `--allow-exec` nicht gesetzt war
- `errors`: strukturierte Schema-/Auflösbarkeitsfehler, wenn `ok=false`

### JSON-Ausgabeform

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

Erfolgsbeispiel:

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

Fehlerbeispiel:

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

Wenn Dry Run fehlschlägt:

- `config schema validation failed`: Die Form Ihrer Konfiguration nach der Änderung ist ungültig; korrigieren Sie Pfad/Wert oder die Form von Provider-/Ref-Objekten.
- `Config policy validation failed: unsupported SecretRef usage`: Verschieben Sie diese Zugangsdaten zurück zu Klartext-/String-Eingaben und verwenden Sie SecretRefs nur auf unterstützten Oberflächen.
- `SecretRef assignment(s) could not be resolved`: Der referenzierte Provider/Ref kann derzeit nicht aufgelöst werden (fehlende Env-Variable, ungültiger Dateizeiger, Fehler im Exec-Provider oder Nichtübereinstimmung von Provider/Quelle).
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: Dry Run hat Exec-Refs übersprungen; führen Sie den Befehl mit `--allow-exec` erneut aus, wenn Sie die Auflösbarkeit von Exec-Refs validieren müssen.
- Korrigieren Sie im Batch-Modus fehlschlagende Einträge und führen Sie `--dry-run` erneut aus, bevor Sie schreiben.

## Schreibsicherheit

`openclaw config set` und andere von OpenClaw verwaltete Konfigurationsschreiber validieren die vollständige
Konfiguration nach der Änderung, bevor sie auf die Festplatte geschrieben wird. Wenn die neue Payload die Schema-
Validierung nicht besteht oder wie ein destruktives Überschreiben aussieht, bleibt die aktive Konfiguration unverändert
und die abgelehnte Payload wird daneben als `openclaw.json.rejected.*` gespeichert.
Der aktive Konfigurationspfad muss eine reguläre Datei sein. Symlinkte `openclaw.json`-
Layouts werden für Schreibvorgänge nicht unterstützt; verwenden Sie stattdessen `OPENCLAW_CONFIG_PATH`, um direkt
auf die tatsächliche Datei zu verweisen.

Bevorzugen Sie für kleine Änderungen CLI-Schreibvorgänge:

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

Wenn ein Schreibvorgang abgelehnt wird, prüfen Sie die gespeicherte Payload und korrigieren Sie die vollständige Konfigurationsform:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

Direkte Schreibvorgänge im Editor sind weiterhin zulässig, aber das laufende Gateway behandelt sie als
nicht vertrauenswürdig, bis sie validiert sind. Ungültige direkte Bearbeitungen können beim Start oder beim Hot-Reload aus dem
Backup des zuletzt bekannten gültigen Zustands wiederhergestellt werden. Siehe
[Fehlerbehebung für das Gateway](/de/gateway/troubleshooting#gateway-restored-last-known-good-config).

## Unterbefehle

- `config file`: Gibt den Pfad der aktiven Konfigurationsdatei aus (aufgelöst aus `OPENCLAW_CONFIG_PATH` oder dem Standardspeicherort). Der Pfad sollte eine reguläre Datei bezeichnen, keinen Symlink.

Starten Sie das Gateway nach Bearbeitungen neu.

## Validieren

Validiert die aktuelle Konfiguration gegen das aktive Schema, ohne das
Gateway zu starten.

```bash
openclaw config validate
openclaw config validate --json
```

Nachdem `openclaw config validate` erfolgreich ist, können Sie die lokale TUI verwenden, damit
ein eingebetteter Agent die aktive Konfiguration mit der Dokumentation vergleicht, während Sie
jede Änderung aus demselben Terminal validieren:

Wenn die Validierung bereits fehlschlägt, beginnen Sie mit `openclaw configure` oder
`openclaw doctor --fix`. `openclaw chat` umgeht die Sperre für ungültige Konfigurationen
nicht.

```bash
openclaw chat
```

Dann innerhalb der TUI:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

Typische Reparaturschleife:

- Bitten Sie den Agenten, Ihre aktuelle Konfiguration mit der relevanten Dokumentationsseite zu vergleichen und die kleinste Korrektur vorzuschlagen.
- Wenden Sie gezielte Änderungen mit `openclaw config set` oder `openclaw configure` an.
- Führen Sie `openclaw config validate` nach jeder Änderung erneut aus.
- Wenn die Validierung erfolgreich ist, aber die Runtime weiterhin ungesund ist, führen Sie `openclaw doctor` oder `openclaw doctor --fix` aus, um Hilfe bei Migration und Reparatur zu erhalten.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Konfiguration](/de/gateway/configuration)
