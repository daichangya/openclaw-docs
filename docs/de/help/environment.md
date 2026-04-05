---
read_when:
    - Sie müssen wissen, welche env-Variablen geladen werden und in welcher Reihenfolge
    - Sie debuggen fehlende API-Schlüssel im Gateway
    - Sie dokumentieren Provider-Authentifizierung oder Bereitstellungsumgebungen
summary: Wo OpenClaw Umgebungsvariablen lädt und in welcher Reihenfolge sie Vorrang haben
title: Umgebungsvariablen
x-i18n:
    generated_at: "2026-04-05T12:44:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a80aea69ca2ffe19a4e93140f05dd81fd576955562ff9913135d38a685a0353c
    source_path: help/environment.md
    workflow: 15
---

# Umgebungsvariablen

OpenClaw bezieht Umgebungsvariablen aus mehreren Quellen. Die Regel lautet: **Vorhandene Werte niemals überschreiben**.

## Vorrang (höchster → niedrigster)

1. **Prozessumgebung** (was der Gateway-Prozess bereits von der übergeordneten Shell/dem Daemon hat).
2. **`.env` im aktuellen Arbeitsverzeichnis** (dotenv-Standard; überschreibt nicht).
3. **Globale `.env`** unter `~/.openclaw/.env` (auch `$OPENCLAW_STATE_DIR/.env`; überschreibt nicht).
4. **Konfigurationsblock `env`** in `~/.openclaw/openclaw.json` (wird nur angewendet, wenn Werte fehlen).
5. **Optionaler Import aus der Login-Shell** (`env.shellEnv.enabled` oder `OPENCLAW_LOAD_SHELL_ENV=1`), wird nur auf fehlende erwartete Schlüssel angewendet.

Bei frischen Ubuntu-Installationen, die das Standard-Zustandsverzeichnis verwenden, behandelt OpenClaw `~/.config/openclaw/gateway.env` außerdem als Kompatibilitäts-Fallback nach der globalen `.env`. Wenn beide Dateien existieren und voneinander abweichen, behält OpenClaw `~/.openclaw/.env` bei und gibt eine Warnung aus.

Wenn die Konfigurationsdatei vollständig fehlt, wird Schritt 4 übersprungen; der Shell-Import läuft weiterhin, wenn er aktiviert ist.

## Konfigurationsblock `env`

Zwei gleichwertige Möglichkeiten, Inline-env-Variablen zu setzen (beide überschreiben nicht):

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## Import aus der Shell-Umgebung

`env.shellEnv` führt Ihre Login-Shell aus und importiert nur **fehlende** erwartete Schlüssel:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Entsprechende env-Variablen:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Zur Laufzeit injizierte env-Variablen

OpenClaw injiziert auch Kontextmarker in gestartete untergeordnete Prozesse:

- `OPENCLAW_SHELL=exec`: gesetzt für Befehle, die über das Tool `exec` ausgeführt werden.
- `OPENCLAW_SHELL=acp`: gesetzt für Prozessstarts des ACP-Laufzeit-Backends (zum Beispiel `acpx`).
- `OPENCLAW_SHELL=acp-client`: gesetzt für `openclaw acp client`, wenn es den ACP-Bridge-Prozess startet.
- `OPENCLAW_SHELL=tui-local`: gesetzt für lokale TUI-`!`-Shell-Befehle.

Dies sind Laufzeitmarker (keine erforderliche Benutzerkonfiguration). Sie können in Shell-/Profil-Logik verwendet werden,
um kontextspezifische Regeln anzuwenden.

## UI-env-Variablen

- `OPENCLAW_THEME=light`: die helle TUI-Palette erzwingen, wenn Ihr Terminal einen hellen Hintergrund hat.
- `OPENCLAW_THEME=dark`: die dunkle TUI-Palette erzwingen.
- `COLORFGBG`: wenn Ihr Terminal dies exportiert, verwendet OpenClaw den Hinweis zur Hintergrundfarbe, um die TUI-Palette automatisch auszuwählen.

## Ersetzung von env-Variablen in der Konfiguration

Sie können in String-Werten der Konfiguration direkt auf env-Variablen mit der Syntax `${VAR_NAME}` verweisen:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

Siehe [Configuration: Env var substitution](/gateway/configuration-reference#env-var-substitution) für alle Details.

## SecretRefs vs `${ENV}`-Strings

OpenClaw unterstützt zwei env-gesteuerte Muster:

- String-Ersetzung `${VAR}` in Konfigurationswerten.
- SecretRef-Objekte (`{ source: "env", provider: "default", id: "VAR" }`) für Felder, die Secret-Referenzen unterstützen.

Beide werden zur Aktivierungszeit aus der Prozessumgebung aufgelöst. Details zu SecretRefs sind unter [Secrets Management](/gateway/secrets) dokumentiert.

## Pfadbezogene env-Variablen

| Variable               | Zweck                                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | Überschreibt das Home-Verzeichnis, das für die gesamte interne Pfadauflösung verwendet wird (`~/.openclaw/`, Agent-Verzeichnisse, Sitzungen, Anmeldedaten). Nützlich, wenn OpenClaw als dedizierter Service-Benutzer ausgeführt wird. |
| `OPENCLAW_STATE_DIR`   | Überschreibt das Zustandsverzeichnis (Standard `~/.openclaw`).                                                                                                           |
| `OPENCLAW_CONFIG_PATH` | Überschreibt den Pfad der Konfigurationsdatei (Standard `~/.openclaw/openclaw.json`).                                                                                    |

## Protokollierung

| Variable             | Zweck                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Überschreibt das Log-Level sowohl für Datei als auch Konsole (z. B. `debug`, `trace`). Hat Vorrang vor `logging.level` und `logging.consoleLevel` in der Konfiguration. Ungültige Werte werden mit einer Warnung ignoriert. |

### `OPENCLAW_HOME`

Wenn gesetzt, ersetzt `OPENCLAW_HOME` das System-Home-Verzeichnis (`$HOME` / `os.homedir()`) für die gesamte interne Pfadauflösung. Dies ermöglicht vollständige Dateisystemisolation für headless Service-Konten.

**Vorrang:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Beispiel** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` kann auch auf einen Tilde-Pfad gesetzt werden (z. B. `~/svc`), der vor der Verwendung mit `$HOME` erweitert wird.

## nvm-Benutzer: `web_fetch`-TLS-Fehler

Wenn Node.js über **nvm** installiert wurde (nicht über den Paketmanager des Systems), verwendet das integrierte `fetch()`
den mit nvm gebündelten CA-Speicher, dem moderne Root-CAs fehlen können (ISRG Root X1/X2 für Let's Encrypt,
DigiCert Global Root G2 usw.). Dadurch schlägt `web_fetch` auf den meisten HTTPS-Seiten mit `"fetch failed"` fehl.

Unter Linux erkennt OpenClaw nvm automatisch und wendet die Korrektur in der tatsächlichen Startumgebung an:

- `openclaw gateway install` schreibt `NODE_EXTRA_CA_CERTS` in die Umgebungsvariablen des systemd-Service
- der CLI-Einstiegspunkt `openclaw` führt sich selbst mit gesetztem `NODE_EXTRA_CA_CERTS` erneut aus, bevor Node startet

**Manuelle Korrektur (für ältere Versionen oder direkte `node ...`-Starts):**

Exportieren Sie die Variable, bevor Sie OpenClaw starten:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Verlassen Sie sich bei dieser Variablen nicht darauf, sie nur in `~/.openclaw/.env` zu schreiben; Node liest
`NODE_EXTRA_CA_CERTS` beim Prozessstart.

## Verwandt

- [Gateway-Konfiguration](/gateway/configuration)
- [FAQ: env vars and .env loading](/help/faq#env-vars-and-env-loading)
- [Modellübersicht](/concepts/models)
