---
read_when:
    - Sie müssen wissen, welche Umgebungsvariablen geladen werden und in welcher Reihenfolge
    - Sie debuggen fehlende API-Schlüssel im Gateway
    - Sie dokumentieren Provider-Auth oder Bereitstellungsumgebungen
summary: Wo OpenClaw Umgebungsvariablen lädt und in welcher Prioritätsreihenfolge
title: Umgebungsvariablen
x-i18n:
    generated_at: "2026-04-24T06:40:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0538e07cc2f785224b5f061bdaee982c4c849838e9d637defcc86a5121710df
    source_path: help/environment.md
    workflow: 15
---

OpenClaw zieht Umgebungsvariablen aus mehreren Quellen. Die Regel lautet: **Vorhandene Werte niemals überschreiben**.

## Priorität (höchste → niedrigste)

1. **Prozessumgebung** (was der Gateway-Prozess bereits von der übergeordneten Shell/dem Daemon hat).
2. **`.env` im aktuellen Arbeitsverzeichnis** (dotenv-Standard; überschreibt nicht).
3. **Globale `.env`** unter `~/.openclaw/.env` (auch bekannt als `$OPENCLAW_STATE_DIR/.env`; überschreibt nicht).
4. **Konfigurationsblock `env`** in `~/.openclaw/openclaw.json` (wird nur angewendet, wenn etwas fehlt).
5. **Optionaler Login-Shell-Import** (`env.shellEnv.enabled` oder `OPENCLAW_LOAD_SHELL_ENV=1`), nur für fehlende erwartete Schlüssel angewendet.

Bei frischen Ubuntu-Installationen, die das Standard-Statusverzeichnis verwenden, behandelt OpenClaw `~/.config/openclaw/gateway.env` außerdem als Kompatibilitäts-Fallback nach der globalen `.env`. Wenn beide Dateien existieren und voneinander abweichen, behält OpenClaw `~/.openclaw/.env` bei und gibt eine Warnung aus.

Wenn die Konfigurationsdatei vollständig fehlt, wird Schritt 4 übersprungen; der Shell-Import läuft trotzdem, wenn er aktiviert ist.

## Konfigurationsblock `env`

Zwei gleichwertige Möglichkeiten, Inline-Umgebungsvariablen zu setzen (beide überschreiben nicht):

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

## Shell-Env-Import

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

Äquivalente Umgebungsvariablen:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Zur Laufzeit injizierte Umgebungsvariablen

OpenClaw injiziert außerdem Kontextmarker in gestartete Child-Prozesse:

- `OPENCLAW_SHELL=exec`: gesetzt für Befehle, die über das Tool `exec` ausgeführt werden.
- `OPENCLAW_SHELL=acp`: gesetzt für Prozessstarts des ACP-Laufzeit-Backends (zum Beispiel `acpx`).
- `OPENCLAW_SHELL=acp-client`: gesetzt für `openclaw acp client`, wenn es den ACP-Bridge-Prozess startet.
- `OPENCLAW_SHELL=tui-local`: gesetzt für lokale TUI-`!`-Shell-Befehle.

Dies sind Laufzeitmarker (keine erforderliche Benutzerkonfiguration). Sie können in Shell-/Profil-Logik
verwendet werden, um kontextspezifische Regeln anzuwenden.

## UI-Umgebungsvariablen

- `OPENCLAW_THEME=light`: erzwingt die helle TUI-Palette, wenn Ihr Terminal einen hellen Hintergrund hat.
- `OPENCLAW_THEME=dark`: erzwingt die dunkle TUI-Palette.
- `COLORFGBG`: wenn Ihr Terminal dies exportiert, verwendet OpenClaw den Hinweis zur Hintergrundfarbe, um die TUI-Palette automatisch auszuwählen.

## Ersetzung von Umgebungsvariablen in der Konfiguration

Sie können in String-Werten der Konfiguration direkt auf Umgebungsvariablen mit der Syntax `${VAR_NAME}` verweisen:

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

Siehe [Configuration: Env var substitution](/de/gateway/configuration-reference#env-var-substitution) für alle Details.

## Secret-Refs vs. `${ENV}`-Strings

OpenClaw unterstützt zwei env-gesteuerte Muster:

- String-Ersetzung `${VAR}` in Konfigurationswerten.
- SecretRef-Objekte (`{ source: "env", provider: "default", id: "VAR" }`) für Felder, die Secret-Referenzen unterstützen.

Beides wird zur Aktivierungszeit aus der Prozessumgebung aufgelöst. Details zu SecretRef sind unter [Secrets Management](/de/gateway/secrets) dokumentiert.

## Pfadbezogene Umgebungsvariablen

| Variable               | Zweck                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | Überschreibt das Home-Verzeichnis, das für alle internen Pfadauflösungen verwendet wird (`~/.openclaw/`, Agent-Verzeichnisse, Sitzungen, Anmeldedaten). Nützlich, wenn OpenClaw als dedizierter Dienstbenutzer läuft. |
| `OPENCLAW_STATE_DIR`   | Überschreibt das Statusverzeichnis (Standard `~/.openclaw`).                                                                                                                   |
| `OPENCLAW_CONFIG_PATH` | Überschreibt den Pfad der Konfigurationsdatei (Standard `~/.openclaw/openclaw.json`).                                                                                          |

## Logging

| Variable             | Zweck                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Überschreibt die Log-Stufe für Datei und Konsole (z. B. `debug`, `trace`). Hat Vorrang vor `logging.level` und `logging.consoleLevel` in der Konfiguration. Ungültige Werte werden mit einer Warnung ignoriert. |

### `OPENCLAW_HOME`

Wenn gesetzt, ersetzt `OPENCLAW_HOME` das System-Home-Verzeichnis (`$HOME` / `os.homedir()`) für alle internen Pfadauflösungen. Dies ermöglicht vollständige Dateisystem-Isolation für headless Dienstkonten.

**Priorität:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**Beispiel** (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` kann auch auf einen Tilde-Pfad gesetzt werden (z. B. `~/svc`), der vor der Verwendung mit `$HOME` expandiert wird.

## nvm-Nutzer: TLS-Fehler bei web_fetch

Wenn Node.js über **nvm** installiert wurde (nicht über den System-Paketmanager), verwendet das eingebaute `fetch()` den mit nvm gebündelten CA-Store, dem moderne Root-CAs fehlen können (ISRG Root X1/X2 für Let's Encrypt, DigiCert Global Root G2 usw.). Dadurch schlägt `web_fetch` auf den meisten HTTPS-Seiten mit `"fetch failed"` fehl.

Unter Linux erkennt OpenClaw nvm automatisch und wendet die Korrektur in der tatsächlichen Startumgebung an:

- `openclaw gateway install` schreibt `NODE_EXTRA_CA_CERTS` in die Umgebungsvariablen des systemd-Dienstes
- der CLI-Einstiegspunkt `openclaw` führt sich selbst mit gesetztem `NODE_EXTRA_CA_CERTS` erneut aus, bevor Node startet

**Manuelle Korrektur (für ältere Versionen oder direkte Starts mit `node ...`):**

Exportieren Sie die Variable vor dem Start von OpenClaw:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Verlassen Sie sich für diese Variable nicht nur auf einen Eintrag in `~/.openclaw/.env`; Node liest
`NODE_EXTRA_CA_CERTS` beim Prozessstart.

## Verwandt

- [Gateway-Konfiguration](/de/gateway/configuration)
- [FAQ: env vars and .env loading](/de/help/faq#env-vars-and-env-loading)
- [Modellübersicht](/de/concepts/models)
