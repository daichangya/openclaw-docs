---
read_when:
    - SecretRefs für Provider-Zugangsdaten und `auth-profiles.json`-Referenzen konfigurieren
    - Secrets-Reload, Audit, Konfiguration und Apply sicher in Produktion betreiben
    - Start-Fail-Fast, Filterung inaktiver Oberflächen und Last-Known-Good-Verhalten verstehen
summary: 'Secrets Management: SecretRef-Vertrag, Verhalten von Runtime-Snapshots und sicheres einseitiges Scrubbing'
title: Secrets Management
x-i18n:
    generated_at: "2026-04-24T06:39:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18e21f63bbf1815b7166dfe123900575754270de94113b446311d73dfd4f2343
    source_path: gateway/secrets.md
    workflow: 15
---

OpenClaw unterstützt additive SecretRefs, damit unterstützte Zugangsdaten nicht als Klartext in der Konfiguration gespeichert werden müssen.

Klartext funktioniert weiterhin. SecretRefs sind pro Zugangsdatenfeld ein Opt-in.

## Ziele und Runtime-Modell

Secrets werden in einen Runtime-Snapshot im Arbeitsspeicher aufgelöst.

- Die Auflösung erfolgt eager während der Aktivierung, nicht lazy auf Request-Pfaden.
- Der Start schlägt sofort fehl, wenn ein effektiv aktiver SecretRef nicht aufgelöst werden kann.
- Reload verwendet einen atomaren Austausch: vollständiger Erfolg oder Beibehaltung des Last-Known-Good-Snapshots.
- Verstöße gegen die SecretRef-Richtlinie (zum Beispiel Auth-Profile im OAuth-Modus kombiniert mit SecretRef-Eingaben) lassen die Aktivierung vor dem Runtime-Swap fehlschlagen.
- Runtime-Requests lesen nur aus dem aktiven Snapshot im Arbeitsspeicher.
- Nach der ersten erfolgreichen Aktivierung/Ladung der Konfiguration lesen Runtime-Codepfade weiterhin aus diesem aktiven Snapshot im Arbeitsspeicher, bis ein erfolgreicher Reload ihn austauscht.
- Pfade für ausgehende Zustellung lesen ebenfalls aus diesem aktiven Snapshot (zum Beispiel Discord-Reply-/Thread-Zustellung und Telegram-Aktionssendungen); sie lösen SecretRefs nicht bei jedem Senden erneut auf.

So bleiben Ausfälle von Secret-Providern von heißen Request-Pfaden fern.

## Filterung aktiver Oberflächen

SecretRefs werden nur auf effektiv aktiven Oberflächen validiert.

- Aktivierte Oberflächen: nicht aufgelöste Referenzen blockieren Start/Reload.
- Inaktive Oberflächen: nicht aufgelöste Referenzen blockieren Start/Reload nicht.
- Inaktive Referenzen erzeugen nicht fatale Diagnosen mit dem Code `SECRETS_REF_IGNORED_INACTIVE_SURFACE`.

Beispiele für inaktive Oberflächen:

- Deaktivierte Kanal-/Kontoeinträge.
- Zugangsdaten eines Kanals auf oberster Ebene, die von keinem aktivierten Konto geerbt werden.
- Deaktivierte Tool-/Feature-Oberflächen.
- Providerspezifische Schlüssel für die Websuche, die nicht von `tools.web.search.provider` ausgewählt werden.
  Im Auto-Modus (Provider nicht gesetzt) werden Schlüssel in Prioritätsreihenfolge für die automatische Provider-Erkennung geprüft, bis einer aufgelöst wird.
  Nach der Auswahl werden Schlüssel nicht ausgewählter Provider als inaktiv behandelt, bis sie ausgewählt werden.
- SSH-Authentifizierungsmaterial für die Sandbox (`agents.defaults.sandbox.ssh.identityData`,
  `certificateData`, `knownHostsData` sowie Überschreibungen pro Agent) ist nur aktiv,
  wenn das effektive Sandbox-Backend für den Standardagenten oder einen aktivierten Agenten `ssh` ist.
- SecretRefs unter `gateway.remote.token` / `gateway.remote.password` sind aktiv, wenn eine dieser Bedingungen wahr ist:
  - `gateway.mode=remote`
  - `gateway.remote.url` ist konfiguriert
  - `gateway.tailscale.mode` ist `serve` oder `funnel`
  - Im lokalen Modus ohne diese Remote-Oberflächen:
    - `gateway.remote.token` ist aktiv, wenn Token-Authentifizierung gewinnen kann und kein Env-/Auth-Token konfiguriert ist.
    - `gateway.remote.password` ist nur aktiv, wenn Passwortauthentifizierung gewinnen kann und kein Env-/Auth-Passwort konfiguriert ist.
- SecretRef unter `gateway.auth.token` ist für die Auflösung der Start-Authentifizierung inaktiv, wenn `OPENCLAW_GATEWAY_TOKEN` gesetzt ist, weil die Token-Eingabe aus der Umgebung für diese Runtime Vorrang hat.

## Diagnosen zur Gateway-Authentifizierungsoberfläche

Wenn ein SecretRef unter `gateway.auth.token`, `gateway.auth.password`,
`gateway.remote.token` oder `gateway.remote.password` konfiguriert ist, protokolliert Gateway beim Start/Reload den
Zustand der Oberfläche explizit:

- `active`: der SecretRef ist Teil der effektiven Authentifizierungsoberfläche und muss aufgelöst werden.
- `inactive`: der SecretRef wird für diese Runtime ignoriert, weil eine andere Authentifizierungsoberfläche gewinnt oder
  weil Remote-Authentifizierung deaktiviert/nicht aktiv ist.

Diese Einträge werden mit `SECRETS_GATEWAY_AUTH_SURFACE` protokolliert und enthalten den vom
Active-Surface-Policy verwendeten Grund, sodass Sie sehen können, warum ein Credential als aktiv oder inaktiv behandelt wurde.

## Vorabprüfung von Referenzen beim Onboarding

Wenn das Onboarding im interaktiven Modus läuft und Sie SecretRef-Speicherung wählen, führt OpenClaw vor dem Speichern eine Vorabvalidierung aus:

- Env-Referenzen: validiert den Namen der Umgebungsvariablen und bestätigt, dass während der Einrichtung ein nicht leerer Wert sichtbar ist.
- Provider-Referenzen (`file` oder `exec`): validiert die Provider-Auswahl, löst `id` auf und prüft den Typ des aufgelösten Werts.
- Wiederverwendung über Quickstart-Pfad: wenn `gateway.auth.token` bereits ein SecretRef ist, löst OpenClaw ihn vor Probe-/Dashboard-Bootstrap auf (für Referenzen `env`, `file` und `exec`) und verwendet dabei dieselbe Fail-Fast-Schranke.

Wenn die Validierung fehlschlägt, zeigt das Onboarding den Fehler an und ermöglicht einen erneuten Versuch.

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

- `provider` muss auf `^[a-z][a-z0-9_-]{0,63}$` passen
- `id` muss auf `^[A-Z][A-Z0-9_]{0,127}$` passen

### `source: "file"`

```json5
{ source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
```

Validierung:

- `provider` muss auf `^[a-z][a-z0-9_-]{0,63}$` passen
- `id` muss ein absoluter JSON-Pointer sein (`/...`)
- RFC6901-Escaping in Segmenten: `~` => `~0`, `/` => `~1`

### `source: "exec"`

```json5
{ source: "exec", provider: "vault", id: "providers/openai/apiKey" }
```

Validierung:

- `provider` muss auf `^[a-z][a-z0-9_-]{0,63}$` passen
- `id` muss auf `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$` passen
- `id` darf keine mit Slashes getrennten Pfadsegmente `.` oder `..` enthalten (zum Beispiel wird `a/../b` abgelehnt)

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
- Fehlende/leere Umgebungswerte lassen die Auflösung fehlschlagen.

### File-Provider

- Liest lokale Datei aus `path`.
- `mode: "json"` erwartet eine JSON-Objektnutzlast und löst `id` als Pointer auf.
- `mode: "singleValue"` erwartet die Referenz-ID `"value"` und gibt den Dateiinhalt zurück.
- Der Pfad muss Prüfungen zu Eigentümerschaft/Berechtigungen bestehen.
- Hinweis zu Windows mit Fail-Closed: Wenn ACL-Prüfung für einen Pfad nicht verfügbar ist, schlägt die Auflösung fehl. Nur für vertrauenswürdige Pfade können Sie auf diesem Provider `allowInsecurePath: true` setzen, um Pfadsicherheitsprüfungen zu umgehen.

### Exec-Provider

- Führt den konfigurierten absoluten Binärpfad aus, ohne Shell.
- Standardmäßig muss `command` auf eine reguläre Datei zeigen (kein Symlink).
- Setzen Sie `allowSymlinkCommand: true`, um Pfade zu Befehlen mit Symlink zuzulassen (zum Beispiel Homebrew-Shims). OpenClaw validiert den aufgelösten Zielpfad.
- Kombinieren Sie `allowSymlinkCommand` mit `trustedDirs` für Paketmanager-Pfade (zum Beispiel `["/opt/homebrew"]`).
- Unterstützt Timeout, Timeout bei fehlender Ausgabe, Byte-Limits für Ausgabe, Env-Allowlist und vertrauenswürdige Verzeichnisse.
- Hinweis zu Windows mit Fail-Closed: Wenn ACL-Prüfung für den Befehlspfad nicht verfügbar ist, schlägt die Auflösung fehl. Nur für vertrauenswürdige Pfade können Sie auf diesem Provider `allowInsecurePath: true` setzen, um Pfadsicherheitsprüfungen zu umgehen.

Request-Nutzlast (stdin):

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

Response-Nutzlast (stdout):

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

## Beispiele für Exec-Integration

### 1Password CLI

```json5
{
  secrets: {
    providers: {
      onepassword_openai: {
        source: "exec",
        command: "/opt/homebrew/bin/op",
        allowSymlinkCommand: true, // erforderlich für Homebrew-binärdateien mit Symlink
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
        allowSymlinkCommand: true, // erforderlich für Homebrew-binärdateien mit Symlink
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
        allowSymlinkCommand: true, // erforderlich für Homebrew-binärdateien mit Symlink
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

## Umgebungsvariablen für MCP-Server

Über `plugins.entries.acpx.config.mcpServers` konfigurierte Umgebungsvariablen von MCP-Servern unterstützen SecretInput. So bleiben API-Keys und Tokens aus der Klartextkonfiguration heraus:

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

Klartext-String-Werte funktionieren weiterhin. Env-Template-Referenzen wie `${MCP_SERVER_API_KEY}` und SecretRef-Objekte werden während der Gateway-Aktivierung aufgelöst, bevor der MCP-Server-Prozess gestartet wird. Wie bei anderen SecretRef-Oberflächen blockieren nicht aufgelöste Referenzen die Aktivierung nur dann, wenn das Plugin `acpx` effektiv aktiv ist.

## SSH-Authentifizierungsmaterial für die Sandbox

Das Core-Backend `ssh` für die Sandbox unterstützt ebenfalls SecretRefs für SSH-Authentifizierungsmaterial:

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

- OpenClaw löst diese Referenzen während der Sandbox-Aktivierung auf, nicht lazy bei jedem SSH-Aufruf.
- Aufgelöste Werte werden mit restriktiven Berechtigungen in temporäre Dateien geschrieben und in der generierten SSH-Konfiguration verwendet.
- Wenn das effektive Sandbox-Backend nicht `ssh` ist, bleiben diese Referenzen inaktiv und blockieren den Start nicht.

## Unterstützte Credential-Oberfläche

Kanonische unterstützte und nicht unterstützte Zugangsdaten sind aufgeführt unter:

- [SecretRef Credential Surface](/de/reference/secretref-credential-surface)

Zur Laufzeit erzeugte oder rotierende Zugangsdaten und OAuth-Refresh-Material sind absichtlich von der schreibgeschützten SecretRef-Auflösung ausgeschlossen.

## Erforderliches Verhalten und Priorität

- Feld ohne Referenz: unverändert.
- Feld mit Referenz: auf aktiven Oberflächen während der Aktivierung erforderlich.
- Wenn sowohl Klartext als auch Referenz vorhanden sind, hat die Referenz auf unterstützten Prioritätspfaden Vorrang.
- Das Redaction-Sentinel `__OPENCLAW_REDACTED__` ist für interne Konfigurations-Redaction/-Wiederherstellung reserviert und wird als wörtlich eingereichte Konfigurationsdaten abgelehnt.

Warn- und Audit-Signale:

- `SECRETS_REF_OVERRIDES_PLAINTEXT` (Runtime-Warnung)
- `REF_SHADOWED` (Audit-Befund, wenn Zugangsdaten in `auth-profiles.json` Vorrang vor Referenzen in `openclaw.json` haben)

Kompatibilitätsverhalten für Google Chat:

- `serviceAccountRef` hat Vorrang vor Klartext-`serviceAccount`.
- Der Klartextwert wird ignoriert, wenn die benachbarte Referenz gesetzt ist.

## Aktivierungsauslöser

Secret-Aktivierung läuft bei:

- Start (Vorabprüfung plus endgültige Aktivierung)
- Hot-Apply-Pfad beim Konfigurations-Reload
- Restart-Check-Pfad beim Konfigurations-Reload
- Manuellem Reload über `secrets.reload`
- Vorabprüfung bei Gateway-Konfigurations-Schreib-RPC (`config.set` / `config.apply` / `config.patch`) für die Auflösbarkeit von SecretRefs auf aktiven Oberflächen innerhalb der übergebenen Konfigurationsnutzlast, bevor Änderungen persistiert werden

Aktivierungsvertrag:

- Erfolg tauscht den Snapshot atomar aus.
- Ein Fehler beim Start bricht den Gateway-Start ab.
- Ein Fehler beim Runtime-Reload behält den Last-Known-Good-Snapshot bei.
- Ein Fehler bei der Vorabprüfung im Write-RPC lehnt die übermittelte Konfiguration ab und lässt sowohl die Konfiguration auf der Festplatte als auch den aktiven Runtime-Snapshot unverändert.
- Das Bereitstellen eines expliziten kanalbezogenen Tokens pro Aufruf für einen Outbound-Helper-/Tool-Aufruf löst keine SecretRef-Aktivierung aus; Aktivierungspunkte bleiben Start, Reload und explizites `secrets.reload`.

## Signale für degradierten und wiederhergestellten Zustand

Wenn die Aktivierung beim Reload nach einem gesunden Zustand fehlschlägt, geht OpenClaw in einen degradierten Secrets-Zustand über.

Einmalige System-Event- und Log-Codes:

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

Verhalten:

- Degradiert: Die Runtime behält den Last-Known-Good-Snapshot bei.
- Wiederhergestellt: Wird einmal nach der nächsten erfolgreichen Aktivierung ausgegeben.
- Wiederholte Fehler, während bereits ein degradierter Zustand vorliegt, protokollieren Warnungen, erzeugen aber keine Event-Flut.
- Das Fail-Fast-Verhalten beim Start erzeugt keine degradierten Events, weil die Runtime nie aktiv wurde.

## Auflösung auf Befehlspfaden

Befehlspfade können sich per Gateway-Snapshot-RPC für die unterstützte SecretRef-Auflösung anmelden.

Es gibt zwei grobe Verhaltensweisen:

- Strikte Befehlspfade (zum Beispiel Remote-Memory-Pfade von `openclaw memory` und `openclaw qr --remote`, wenn gemeinsam genutzte Secret-Referenzen des Remotes benötigt werden) lesen aus dem aktiven Snapshot und schlagen sofort fehl, wenn ein erforderlicher SecretRef nicht verfügbar ist.
- Schreibgeschützte Befehlspfade (zum Beispiel `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, `openclaw security audit` und schreibgeschützte Doctor-/Config-Repair-Abläufe) bevorzugen ebenfalls den aktiven Snapshot, degradieren aber statt abzubrechen, wenn ein gezielter SecretRef in diesem Befehlspfad nicht verfügbar ist.

Schreibgeschütztes Verhalten:

- Wenn das Gateway läuft, lesen diese Befehle zuerst aus dem aktiven Snapshot.
- Wenn die Gateway-Auflösung unvollständig ist oder das Gateway nicht verfügbar ist, versuchen sie einen gezielten lokalen Fallback für die jeweilige Befehlsoberfläche.
- Wenn ein gezielter SecretRef weiterhin nicht verfügbar ist, läuft der Befehl mit degradierter schreibgeschützter Ausgabe weiter und mit expliziten Diagnosen wie „konfiguriert, aber in diesem Befehlspfad nicht verfügbar“.
- Dieses degradierte Verhalten gilt nur lokal für den Befehl. Es schwächt nicht Start, Reload oder Pfade für Senden/Auth der Runtime.

Weitere Hinweise:

- Die Aktualisierung des Snapshots nach einer Rotation von Backend-Secrets erfolgt über `openclaw secrets reload`.
- Von diesen Befehlspfaden verwendete Gateway-RPC-Methode: `secrets.resolve`.

## Workflow für Audit und Konfiguration

Standardablauf für Operatoren:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

### `secrets audit`

Befunde umfassen:

- Klartextwerte im Ruhezustand (`openclaw.json`, `auth-profiles.json`, `.env` und generierte `agents/*/agent/models.json`)
- Rückstände sensibler Provider-Header im Klartext in generierten Einträgen von `models.json`
- nicht aufgelöste Referenzen
- Schattenbildung durch Priorität (`auth-profiles.json` hat Vorrang vor Referenzen in `openclaw.json`)
- Legacy-Rückstände (`auth.json`, OAuth-Erinnerungen)

Hinweis zu Exec:

- Standardmäßig überspringt Audit die Prüfung der Auflösbarkeit von Exec-SecretRefs, um Seiteneffekte durch Befehle zu vermeiden.
- Verwenden Sie `openclaw secrets audit --allow-exec`, um Exec-Provider während des Audits auszuführen.

Hinweis zu Header-Rückständen:

- Die Erkennung sensibler Provider-Header basiert heuristisch auf Namen (gängige Auth-/Credential-Headernamen und Fragmente wie `authorization`, `x-api-key`, `token`, `secret`, `password` und `credential`).

### `secrets configure`

Interaktive Hilfe, die:

- zuerst `secrets.providers` konfiguriert (`env`/`file`/`exec`, hinzufügen/bearbeiten/entfernen)
- Sie unterstützte Felder mit Secrets in `openclaw.json` sowie `auth-profiles.json` für einen Agenten-Scope auswählen lässt
- direkt in der Zielauswahl eine neue Zuordnung in `auth-profiles.json` erstellen kann
- Details für SecretRef erfasst (`source`, `provider`, `id`)
- die Auflösung per Vorabprüfung ausführt
- sofort anwenden kann

Hinweis zu Exec:

- Die Vorabprüfung überspringt Exec-SecretRef-Prüfungen, sofern `--allow-exec` nicht gesetzt ist.
- Wenn Sie direkt aus `configure --apply` anwenden und der Plan Exec-Referenzen/-Provider enthält, lassen Sie `--allow-exec` auch für den Apply-Schritt gesetzt.

Nützliche Modi:

- `openclaw secrets configure --providers-only`
- `openclaw secrets configure --skip-provider-setup`
- `openclaw secrets configure --agent <id>`

Standardverhalten von `configure` beim Anwenden:

- entfernt passende statische Zugangsdaten aus `auth-profiles.json` für die ausgewählten Provider
- entfernt Legacy-Einträge `api_key` im Klartext aus `auth.json`
- entfernt passende bekannte Secret-Zeilen aus `<config-dir>/.env`

### `secrets apply`

Einen gespeicherten Plan anwenden:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
```

Hinweis zu Exec:

- `dry-run` überspringt Exec-Prüfungen, sofern `--allow-exec` nicht gesetzt ist.
- Der Schreibmodus lehnt Pläne ab, die Exec-SecretRefs/-Provider enthalten, sofern `--allow-exec` nicht gesetzt ist.

Für Details zum strikten Ziel-/Pfadvertrag und zu exakten Ablehnungsregeln siehe:

- [Secrets Apply Plan Contract](/de/gateway/secrets-plan-contract)

## Richtlinie für Einweg-Sicherheit

OpenClaw schreibt absichtlich keine Rollback-Backups, die frühere Klartext-Secret-Werte enthalten.

Sicherheitsmodell:

- Die Vorabprüfung muss vor dem Schreibmodus erfolgreich sein
- Runtime-Aktivierung wird vor dem Commit validiert
- Apply aktualisiert Dateien mit atomarem Dateiersatz und Best-Effort-Wiederherstellung bei Fehlern

## Hinweise zur Legacy-Auth-Kompatibilität

Für statische Zugangsdaten hängt die Runtime nicht mehr von Legacy-Auth-Speicherung im Klartext ab.

- Die Credential-Quelle der Runtime ist der aufgelöste Snapshot im Arbeitsspeicher.
- Legacy-Einträge `api_key` im Klartext werden entfernt, wenn sie gefunden werden.
- Kompatibilitätsverhalten rund um OAuth bleibt getrennt.

## Hinweis zur Web UI

Einige SecretInput-Unionen lassen sich im Roheditor-Modus einfacher konfigurieren als im Formularmodus.

## Verwandte Dokumentation

- CLI-Befehle: [secrets](/de/cli/secrets)
- Details zum Planvertrag: [Secrets Apply Plan Contract](/de/gateway/secrets-plan-contract)
- Credential-Oberfläche: [SecretRef Credential Surface](/de/reference/secretref-credential-surface)
- Einrichtung von Auth: [Authentifizierung](/de/gateway/authentication)
- Sicherheitslage: [Sicherheit](/de/gateway/security)
- Priorität von Umgebungen: [Umgebungsvariablen](/de/help/environment)
