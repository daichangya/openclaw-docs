---
read_when:
    - SecretRefs für Provider-Credentials und `auth-profiles.json`-Refs konfigurieren
    - '`reload`, `audit`, `configure` und `apply` für Secrets sicher in Produktion betreiben'
    - Startup-Fail-Fast, Inactive-Surface-Filterung und Last-Known-Good-Verhalten verstehen
summary: 'Secrets-Management: SecretRef-Vertrag, Verhalten von Runtime-Snapshots und sichere einseitige Bereinigung'
title: Secrets Management
x-i18n:
    generated_at: "2026-04-05T12:44:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: b91778cb7801fe24f050c15c0a9dd708dda91cb1ce86096e6bae57ebb6e0d41d
    source_path: gateway/secrets.md
    workflow: 15
---

# Secrets Management

OpenClaw unterstützt additive SecretRefs, sodass unterstützte Credentials nicht als Klartext in der Konfiguration gespeichert werden müssen.

Klartext funktioniert weiterhin. SecretRefs sind pro Credential ein Opt-in.

## Ziele und Runtime-Modell

Secrets werden in einen In-Memory-Runtime-Snapshot aufgelöst.

- Die Auflösung erfolgt eager während der Aktivierung, nicht lazy auf Request-Pfaden.
- Der Start schlägt schnell fehl, wenn ein effektiv aktiver SecretRef nicht aufgelöst werden kann.
- Reload verwendet einen atomaren Austausch: vollständiger Erfolg oder Beibehaltung des zuletzt bekannten funktionierenden Snapshots.
- Verstöße gegen die SecretRef-Richtlinie (zum Beispiel Auth-Profile im OAuth-Modus in Kombination mit SecretRef-Eingaben) lassen die Aktivierung vor dem Austausch des Runtime-Snapshots fehlschlagen.
- Runtime-Requests lesen nur aus dem aktiven In-Memory-Snapshot.
- Nach der ersten erfolgreichen Konfigurationsaktivierung/-ladung lesen Runtime-Codepfade weiter aus diesem aktiven In-Memory-Snapshot, bis ein erfolgreicher Reload ihn austauscht.
- Pfade für ausgehende Zustellung lesen ebenfalls aus diesem aktiven Snapshot (zum Beispiel Discord-Antwort-/Thread-Zustellung und Telegram-Aktionssendungen); sie lösen SecretRefs nicht bei jeder Sendung neu auf.

Dadurch bleiben Ausfälle von Secret-Providern von heißen Request-Pfaden fern.

## Active-Surface-Filterung

SecretRefs werden nur auf effektiv aktiven Oberflächen validiert.

- Aktivierte Oberflächen: Nicht aufgelöste Refs blockieren Start/Reload.
- Inaktive Oberflächen: Nicht aufgelöste Refs blockieren Start/Reload nicht.
- Inaktive Refs erzeugen nicht fatale Diagnosen mit dem Code `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Beispiele für inaktive Oberflächen:

- Deaktivierte Kanal-/Kontoeinträge.
- Credentials auf oberster Kanalschicht, die kein aktiviertes Konto erbt.
- Deaktivierte Tool-/Feature-Oberflächen.
- Websuch-spezifische Provider-Schlüssel, die nicht von `tools.web.search.provider` ausgewählt sind.
  Im Auto-Modus (Provider nicht gesetzt) werden Schlüssel entsprechend ihrer Priorität für die automatische Provider-Erkennung konsultiert, bis einer erfolgreich aufgelöst wird.
  Nach der Auswahl werden Schlüssel nicht ausgewählter Provider als inaktiv behandelt, bis sie ausgewählt werden.
- SSH-Auth-Material für Sandboxen (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData` sowie Überschreibungen pro Agent) ist nur aktiv,
  wenn das effektive Sandbox-Backend `ssh` für den Standard-Agenten oder einen aktivierten Agenten ist.
- SecretRefs für `gateway.remote.token` / `gateway.remote.password` sind aktiv, wenn eine dieser Bedingungen wahr ist:
  - `gateway.mode=remote`
  - `gateway.remote.url` ist konfiguriert
  - `gateway.tailscale.mode` ist `serve` oder `funnel`
  - Im lokalen Modus ohne diese Remote-Oberflächen:
    - `gateway.remote.token` ist aktiv, wenn Token-Auth gewinnen kann und kein Env-/Auth-Token konfiguriert ist.
    - `gateway.remote.password` ist nur aktiv, wenn Passwort-Auth gewinnen kann und kein Env-/Auth-Passwort konfiguriert ist.
- SecretRefs für `gateway.auth.token` sind für die Startup-Auth-Auflösung inaktiv, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist, weil Eingaben über Env-Tokens für diese Runtime Vorrang haben.

## Diagnosen der Gateway-Auth-Oberfläche

Wenn ein SecretRef auf `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` oder `gateway.remote.password` konfiguriert ist, protokolliert Gateway-Startup/Reload den
Status der Oberfläche explizit:

- `active`: Der SecretRef ist Teil der effektiven Auth-Oberfläche und muss aufgelöst werden.
- `inactive`: Der SecretRef wird für diese Runtime ignoriert, weil eine andere Auth-Oberfläche gewinnt oder
  weil Remote-Auth deaktiviert/nicht aktiv ist.

Diese Einträge werden mit `SECRETS_GATEWAY_AUTH_SURFACE` protokolliert und enthalten den durch die
Active-Surface-Richtlinie verwendeten Grund, sodass Sie sehen können, warum ein Credential als aktiv oder inaktiv behandelt wurde.

## Preflight für Onboarding-Referenzen

Wenn das Onboarding im interaktiven Modus läuft und Sie SecretRef-Speicherung wählen, führt OpenClaw vor dem Speichern eine Preflight-Validierung aus:

- Env-Refs: validiert den Namen der Env-Variable und bestätigt, dass während des Setups ein nicht leerer Wert sichtbar ist.
- Provider-Refs (`file` oder `exec`): validiert die Providerauswahl, löst `id` auf und prüft den Typ des aufgelösten Werts.
- Quickstart-Wiederverwendungspfad: Wenn `gateway.auth.token` bereits ein SecretRef ist, löst das Onboarding ihn vor Probe-/Dashboard-Bootstrap auf (für `env`-, `file`- und `exec`-Refs) unter Verwendung derselben Fail-Fast-Grenze.

Wenn die Validierung fehlschlägt, zeigt das Onboarding den Fehler an und lässt Sie es erneut versuchen.

## SecretRef-Vertrag

Verwenden Sie überall dieselbe Objektform:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

### `source: "env"`

```json5
{ source: "env", provider: "default", id: "OPENAI_API_KEY" }
```

Validierung:

- `provider` muss `^[a-z][a-z0-9_-]{0,63}$` entsprechen
- `id` muss `^[A-Z][A-Z0-9_]{0,127}$` entsprechen

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

Validierung:

- `provider` muss `^[a-z][a-z0-9_-]{0,63}$` entsprechen
- `id` muss ein absoluter JSON-Pointer sein (`/...`)
- RFC6901-Escaping in Segmenten: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Validierung:

- `provider` muss `^[a-z][a-z0-9_-]{0,63}$` entsprechen
- `id` muss `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$` entsprechen
- `id` darf `.` oder `..` nicht als slash-getrennte Pfadsegmente enthalten (zum Beispiel wird `a/../b` abgelehnt)

## Provider-Konfiguration

Definieren Sie Provider unter `secrets.providers`:

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // oder "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

### Env-Provider

- Optionale Allowlist über `allowlist`.
- Fehlende/leere Env-Werte lassen die Auflösung fehlschlagen.

### File-Provider

- Liest lokale Datei aus `path`.
- `mode: "json"` erwartet ein JSON-Objekt als Payload und löst `id` als Pointer auf.
- `mode: "singleValue"` erwartet die Ref-ID `"value"` und gibt den Dateiinhalt zurück.
- Der Pfad muss Eigentums-/Berechtigungsprüfungen bestehen.
- Hinweis zu Windows-Fail-Closed: Wenn die ACL-Verifizierung für einen Pfad nicht verfügbar ist, schlägt die Auflösung fehl. Setzen Sie `allowInsecurePath: true` nur für vertrauenswürdige Pfade auf diesem Provider, um die Pfadsicherheitsprüfungen zu umgehen.

### Exec-Provider

- Führt den konfigurierten absoluten Binärpfad ohne Shell aus.
- Standardmäßig muss `command` auf eine reguläre Datei zeigen (kein Symlink).
- Setzen Sie `allowSymlinkCommand: true`, um Symlink-Befehlspfade zuzulassen (zum Beispiel Homebrew-Shims). OpenClaw validiert den aufgelösten Zielpfad.
- Kombinieren Sie `allowSymlinkCommand` mit `trustedDirs` für Paketmanager-Pfade (zum Beispiel `["/opt/homebrew"]`).
- Unterstützt Timeout, Timeout bei fehlender Ausgabe, Limits für Ausgabebytes, Env-Allowlist und vertrauenswürdige Verzeichnisse.
- Hinweis zu Windows-Fail-Closed: Wenn die ACL-Verifizierung für den Befehlspfad nicht verfügbar ist, schlägt die Auflösung fehl. Setzen Sie `allowInsecurePath: true` nur für vertrauenswürdige Pfade auf diesem Provider, um die Pfadsicherheitsprüfungen zu umgehen.

Request-Payload (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Response-Payload (stdout):

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

Optionale Fehler pro ID:

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

## Beispiele für Exec-Integrationen

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // für über Homebrew verlinkte Binärdateien erforderlich
        trustedDirs: ["/opt/homebrew"],
        args: ["read", "op://Personal/OpenClaw QA API Key/password"],
        passEnv: ["HOME"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
      },
    },
  },
}
```

### HashiCorp Vault CLI

```json5
{
  secrets: {
    providers: {
      vault_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/vault",
        allowSymlinkCommand: true, // für über Homebrew verlinkte Binärdateien erforderlich
        trustedDirs: ["/opt/homebrew"],
        args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
        passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "vault_openai", id: "value" },
      },
    },
  },
}
```

### `sops`

```json5
{
  secrets: {
    providers: {
      sops_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/sops",
        allowSymlinkCommand: true, // für über Homebrew verlinkte Binärdateien erforderlich
        trustedDirs: ["/opt/homebrew"],
        args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
        passEnv: ["SOPS_AGE_KEY_FILE"],
        jsonOnly: false,
      },
    },
  },
  models: {
    providers: {
      openai: {
        baseUrl: "https://api.openai.com/v1",
        models: [{ id: "gpt-5", name: "gpt-5" }],
        apiKey: { source: "exec", provider: "sops_openai", id: "value" },
      },
    },
  },
}
```

## MCP-Server-Umgebungsvariablen

MCP-Server-Env-Variablen, die über `plugins.entries.acpx.config.mcpServers` konfiguriert werden, unterstützen SecretInput. Dadurch bleiben API-Keys und Tokens aus der Klartextkonfiguration heraus:

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

Klartext-String-Werte funktionieren weiterhin. Env-Template-Refs wie `${MCP_SERVER_API_KEY}` und SecretRef-Objekte werden während der Gateway-Aktivierung aufgelöst, bevor der MCP-Server-Prozess gestartet wird. Wie bei anderen SecretRef-Oberflächen blockieren nicht aufgelöste Refs die Aktivierung nur, wenn das `acpx`-Plugin effektiv aktiv ist.

## SSH-Auth-Material für Sandboxen

Das Core-`ssh`-Sandbox-Backend unterstützt ebenfalls SecretRefs für SSH-Auth-Material:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

Runtime-Verhalten:

- OpenClaw löst diese Refs während der Sandbox-Aktivierung auf, nicht lazy bei jedem SSH-Aufruf.
- Aufgelöste Werte werden in temporäre Dateien mit restriktiven Berechtigungen geschrieben und in der generierten SSH-Konfiguration verwendet.
- Wenn das effektive Sandbox-Backend nicht `ssh` ist, bleiben diese Refs inaktiv und blockieren den Start nicht.

## Unterstützte Credential-Oberfläche

Kanonisch unterstützte und nicht unterstützte Credentials sind aufgeführt unter:

- [SecretRef Credential Surface](/reference/secretref-credential-surface)

Zur Runtime geprägte oder rotierende Credentials sowie OAuth-Refresh-Material sind absichtlich von der schreibgeschützten SecretRef-Auflösung ausgeschlossen.

## Erforderliches Verhalten und Priorität

- Feld ohne Ref: unverändert.
- Feld mit Ref: auf aktiven Oberflächen während der Aktivierung erforderlich.
- Wenn sowohl Klartext als auch Ref vorhanden sind, hat auf unterstützten Prioritätspfaden der Ref Vorrang.
- Das Redaction-Sentinel `__OPENCLAW_REDACTED__` ist für interne Konfigurations-Redaktion/Wiederherstellung reserviert und wird als wörtlich eingereichte Konfigurationsdaten abgelehnt.

Warn- und Audit-Signale:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (Runtime-Warnung)
- `REF_SHADOWED` (Audit-Finding, wenn Credentials in `auth-profiles.json` Vorrang vor Refs in `openclaw.json` haben)

Kompatibilitätsverhalten für Google Chat:

- `serviceAccountRef` hat Vorrang vor Klartext-`serviceAccount`.
- Der Klartextwert wird ignoriert, wenn ein benachbarter Ref gesetzt ist.

## Aktivierungsauslöser

Die Secret-Aktivierung läuft bei:

- Startup (Preflight plus finale Aktivierung)
- Hot-Apply-Pfad beim Reload der Konfiguration
- Restart-Check-Pfad beim Reload der Konfiguration
- Manuellem Reload über `secrets.reload`
- Gateway-Konfigurationsschreib-RPC-Preflight (`config.set` / `config.apply` / `config.patch`) für die Auflösbarkeit von SecretRefs auf aktiven Oberflächen innerhalb des übermittelten Konfigurations-Payloads vor dem Persistieren der Änderungen

Aktivierungsvertrag:

- Erfolg tauscht den Snapshot atomar aus.
- Startup-Fehler bricht den Gateway-Start ab.
- Runtime-Reload-Fehler behält den zuletzt bekannten funktionierenden Snapshot bei.
- Write-RPC-Preflight-Fehler lehnt die übermittelte Konfiguration ab und lässt sowohl die Datenträgerkonfiguration als auch den aktiven Runtime-Snapshot unverändert.
- Das Bereitstellen eines expliziten kanalspezifischen Tokens pro Aufruf für einen ausgehenden Helper-/Tool-Aufruf löst keine SecretRef-Aktivierung aus; Aktivierungspunkte bleiben Startup, Reload und explizites `secrets.reload`.

## Signale für degraded und recovered

Wenn die Aktivierung zur Reload-Zeit nach einem gesunden Zustand fehlschlägt, wechselt OpenClaw in einen degraded-Secrets-Zustand.

Einmalige Systemereignis- und Log-Codes:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Verhalten:

- Degraded: Die Runtime behält den zuletzt bekannten funktionierenden Snapshot bei.
- Recovered: Wird genau einmal nach der nächsten erfolgreichen Aktivierung ausgegeben.
- Wiederholte Fehler, während bereits degraded, protokollieren Warnungen, spammen aber keine Ereignisse.
- Startup-Fail-Fast erzeugt keine degraded-Ereignisse, weil die Runtime nie aktiv wurde.

## Auflösung auf Befehlspfaden

Befehlspfade können sich über Gateway-Snapshot-RPC für unterstützte SecretRef-Auflösung entscheiden.

Es gibt zwei grobe Verhaltensweisen:

- Strikte Befehlspfade (zum Beispiel Remote-memory-Pfade von `openclaw memory` und `openclaw qr --remote`, wenn es Remote-Shared-Secret-Refs benötigt) lesen aus dem aktiven Snapshot und schlagen schnell fehl, wenn ein erforderlicher SecretRef nicht verfügbar ist.
- Schreibgeschützte Befehlspfade (zum Beispiel `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` und schreibgeschützte Doctor-/Config-Repair-Abläufe) bevorzugen ebenfalls den aktiven Snapshot, degradieren aber statt abzubrechen, wenn ein gezielter SecretRef auf diesem Befehlspfad nicht verfügbar ist.

Verhalten bei schreibgeschützten Pfaden:

- Wenn das Gateway läuft, lesen diese Befehle zuerst aus dem aktiven Snapshot.
- Wenn die Gateway-Auflösung unvollständig ist oder das Gateway nicht verfügbar ist, versuchen sie einen gezielten lokalen Fallback für die spezifische Befehlsoberfläche.
- Wenn ein gezielter SecretRef weiterhin nicht verfügbar ist, läuft der Befehl mit degradierter schreibgeschützter Ausgabe und expliziten Diagnosen weiter, wie „konfiguriert, aber auf diesem Befehlspfad nicht verfügbar“.
- Dieses degradierte Verhalten ist nur befehlslokal. Es schwächt nicht Runtime-Startup, Reload oder Sende-/Auth-Pfade.

Weitere Hinweise:

- Die Aktualisierung des Snapshots nach Rotation von Backend-Secrets erfolgt über `openclaw secrets reload`.
- Die von diesen Befehlspfaden verwendete Gateway-RPC-Methode ist `secrets.resolve`.

## Audit- und Configure-Workflow

Standardablauf für Operatoren:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Findings umfassen:

- Klartextwerte im Ruhezustand (`openclaw.json`, `auth-profiles.json`, `.env` und generierte `agents/*/agent/models.json`)
- Klartext-Rückstände sensibler Provider-Header in generierten `models.json`-Einträgen
- nicht aufgelöste Refs
- Prioritätsabschattung (`auth-profiles.json` hat Vorrang vor Refs in `openclaw.json`)
- veraltete Rückstände (`auth.json`, OAuth-Erinnerungen)

Hinweis zu Exec:

- Standardmäßig überspringt Audit Auflösbarkeitsprüfungen für Exec-SecretRefs, um Seiteneffekte von Befehlen zu vermeiden.
- Verwenden Sie `openclaw secrets audit --allow-exec`, um Exec-Provider während des Audits auszuführen.

Hinweis zu Header-Rückständen:

- Die Erkennung sensibler Provider-Header basiert heuristisch auf Namen (gängige Auth-/Credential-Headernamen und Fragmente wie `authorization`, `x-api-key`, `token`, `secret`, `password` und `credential`).

### `secrets configure`

Interaktiver Helfer, der:

- zuerst `secrets.providers` konfiguriert (`env`/`file`/`exec`, hinzufügen/bearbeiten/entfernen)
- Sie unterstützte Felder mit Secrets in `openclaw.json` plus `auth-profiles.json` für einen Agent-Bereich auswählen lässt
- im Ziel-Picker direkt eine neue `auth-profiles.json`-Zuordnung erstellen kann
- SecretRef-Details erfasst (`source`, `provider`, `id`)
- Preflight-Auflösung ausführt
- sofort anwenden kann

Hinweis zu Exec:

- Preflight überspringt Exec-SecretRef-Prüfungen, sofern `--allow-exec` nicht gesetzt ist.
- Wenn Sie direkt aus `configure --apply` anwenden und der Plan Exec-Refs/-Provider enthält, lassen Sie `--allow-exec` auch für den Apply-Schritt gesetzt.

Hilfreiche Modi:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Standardwerte für `configure apply`:

- passende statische Credentials aus `auth-profiles.json` für Ziel-Provider bereinigen
- veraltete statische `api_key`-Einträge aus `auth.json` bereinigen
- passende bekannte Secret-Zeilen aus `<config-dir>/.env` bereinigen

### `secrets apply`

Einen gespeicherten Plan anwenden:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Hinweis zu Exec:

- Dry-Run überspringt Exec-Prüfungen, sofern `--allow-exec` nicht gesetzt ist.
- Der Schreibmodus lehnt Pläne mit Exec-SecretRefs/-Providern ab, sofern `--allow-exec` nicht gesetzt ist.

Für Details zum strikten Ziel-/Pfadvertrag und die genauen Ablehnungsregeln siehe:

- [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)

## Einseitige Sicherheitsrichtlinie

OpenClaw schreibt absichtlich keine Rollback-Backups, die historische Klartext-Secret-Werte enthalten.

Sicherheitsmodell:

- Preflight muss vor dem Schreibmodus erfolgreich sein
- Runtime-Aktivierung wird vor dem Commit validiert
- Apply aktualisiert Dateien über atomaren Dateiersatz und Best-Effort-Wiederherstellung bei Fehlern

## Hinweise zur Legacy-Auth-Kompatibilität

Für statische Credentials hängt die Runtime nicht mehr von veralteter Auth-Speicherung im Klartext ab.

- Runtime-Quelle für Credentials ist der aufgelöste In-Memory-Snapshot.
- Veraltete statische `api_key`-Einträge werden bereinigt, wenn sie gefunden werden.
- OAuth-bezogenes Kompatibilitätsverhalten bleibt getrennt.

## Hinweis zur Web-UI

Einige SecretInput-Unions lassen sich im Raw-Editor-Modus leichter konfigurieren als im Formularmodus.

## Zugehörige Dokumentation

- CLI-Befehle: [secrets](/cli/secrets)
- Details zum Planvertrag: [Secrets Apply Plan Contract](/gateway/secrets-plan-contract)
- Credential-Oberfläche: [SecretRef Credential Surface](/reference/secretref-credential-surface)
- Auth-Setup: [Authentication](/gateway/authentication)
- Sicherheitslage: [Security](/gateway/security)
- Env-Priorität: [Environment Variables](/help/environment)
