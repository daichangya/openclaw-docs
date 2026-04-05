---
read_when:
    - Sie möchten ereignisgesteuerte Automatisierung für /new, /reset, /stop und Agent-Lifecycle-Ereignisse
    - Sie möchten Hooks erstellen, installieren oder debuggen
summary: 'Hooks: ereignisgesteuerte Automatisierung für Befehle und Lifecycle-Ereignisse'
title: Hooks
x-i18n:
    generated_at: "2026-04-05T12:34:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eb75bb2b3b2ad229bf3da24fdb0fe021ed08f812fd1d13c69b3bd9df0218e5
    source_path: automation/hooks.md
    workflow: 15
---

# Hooks

Hooks sind kleine Skripte, die ausgeführt werden, wenn innerhalb des Gateway etwas passiert. Sie werden automatisch aus Verzeichnissen erkannt und können mit `openclaw hooks` geprüft werden.

Es gibt zwei Arten von Hooks in OpenClaw:

- **Interne Hooks** (diese Seite): werden innerhalb des Gateway ausgeführt, wenn Agent-Ereignisse ausgelöst werden, zum Beispiel `/new`, `/reset`, `/stop` oder Lifecycle-Ereignisse.
- **Webhooks**: externe HTTP-Endpunkte, über die andere Systeme Arbeit in OpenClaw auslösen können. Siehe [Webhooks](/automation/cron-jobs#webhooks).

Hooks können auch in Plugins gebündelt sein. `openclaw hooks list` zeigt sowohl eigenständige Hooks als auch von Plugins verwaltete Hooks an.

## Schnellstart

```bash
# Verfügbare Hooks auflisten
openclaw hooks list

# Einen Hook aktivieren
openclaw hooks enable session-memory

# Hook-Status prüfen
openclaw hooks check

# Detaillierte Informationen abrufen
openclaw hooks info session-memory
```

## Ereignistypen

| Ereignis                 | Wann es ausgelöst wird                           |
| ------------------------ | ------------------------------------------------ |
| `command:new`            | `/new`-Befehl ausgeführt                         |
| `command:reset`          | `/reset`-Befehl ausgeführt                       |
| `command:stop`           | `/stop`-Befehl ausgeführt                        |
| `command`                | Beliebiges Befehlsereignis (allgemeiner Listener) |
| `session:compact:before` | Bevor die Komprimierung den Verlauf zusammenfasst |
| `session:compact:after`  | Nachdem die Komprimierung abgeschlossen ist      |
| `session:patch`          | Wenn Sitzungseigenschaften geändert werden       |
| `agent:bootstrap`        | Bevor Workspace-Bootstrap-Dateien eingefügt werden |
| `gateway:startup`        | Nachdem Kanäle gestartet wurden und Hooks geladen sind |
| `message:received`       | Eingehende Nachricht aus einem beliebigen Kanal  |
| `message:transcribed`    | Nachdem die Audiotranskription abgeschlossen ist |
| `message:preprocessed`   | Nachdem die gesamte Medien- und Link-Verarbeitung abgeschlossen ist |
| `message:sent`           | Ausgehende Nachricht zugestellt                  |

## Hooks schreiben

### Hook-Struktur

Jeder Hook ist ein Verzeichnis mit zwei Dateien:

```
my-hook/
├── HOOK.md          # Metadaten + Dokumentation
└── handler.ts       # Handler-Implementierung
```

### HOOK.md-Format

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Metadatenfelder** (`metadata.openclaw`):

| Feld       | Beschreibung                                        |
| ---------- | --------------------------------------------------- |
| `emoji`    | Anzuzeigendes Emoji für CLI                         |
| `events`   | Array der zu überwachenden Ereignisse               |
| `export`   | Zu verwendender benannter Export (Standard ist `"default"`) |
| `os`       | Erforderliche Plattformen (z. B. `["darwin", "linux"]`) |
| `requires` | Erforderliche `bins`, `anyBins`, `env` oder `config`-Pfade |
| `always`   | Eignungsprüfungen umgehen (boolesch)                |
| `install`  | Installationsmethoden                               |

### Handler-Implementierung

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Jedes Ereignis enthält: `type`, `action`, `sessionKey`, `timestamp`, `messages` (zum Senden an den Benutzer per `push`) und `context` (ereignisspezifische Daten).

### Wichtige Punkte zum Ereigniskontext

**Befehlsereignisse** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Nachrichtenereignisse** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (anbieterspezifische Daten einschließlich `senderId`, `senderName`, `guildId`).

**Nachrichtenereignisse** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Nachrichtenereignisse** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Nachrichtenereignisse** (`message:preprocessed`): `context.bodyForAgent` (endgültig angereicherter Inhalt), `context.from`, `context.channelId`.

**Bootstrap-Ereignisse** (`agent:bootstrap`): `context.bootstrapFiles` (veränderbares Array), `context.agentId`.

**Session-Patch-Ereignisse** (`session:patch`): `context.sessionEntry`, `context.patch` (nur geänderte Felder), `context.cfg`. Nur privilegierte Clients können Patch-Ereignisse auslösen.

**Komprimierungsereignisse**: `session:compact:before` enthält `messageCount`, `tokenCount`. `session:compact:after` ergänzt `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Hook-Erkennung

Hooks werden aus diesen Verzeichnissen erkannt, in Reihenfolge steigender Überschreibungspriorität:

1. **Gebündelte Hooks**: mit OpenClaw ausgeliefert
2. **Plugin-Hooks**: Hooks, die in installierten Plugins gebündelt sind
3. **Verwaltete Hooks**: `~/.openclaw/hooks/` (vom Benutzer installiert, gemeinsam für alle Workspaces). Zusätzliche Verzeichnisse aus `hooks.internal.load.extraDirs` haben dieselbe Priorität.
4. **Workspace-Hooks**: `<workspace>/hooks/` (pro Agent, standardmäßig deaktiviert, bis sie ausdrücklich aktiviert werden)

Workspace-Hooks können neue Hook-Namen hinzufügen, aber keine gebündelten, verwalteten oder von Plugins bereitgestellten Hooks mit demselben Namen überschreiben.

### Hook-Pakete

Hook-Pakete sind npm-Pakete, die Hooks über `openclaw.hooks` in `package.json` exportieren. Installation mit:

```bash
openclaw plugins install <path-or-spec>
```

Npm-Spezifikationen sind nur für die Registry zulässig (Paketname + optionale exakte Version oder Dist-Tag). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt.

## Gebündelte Hooks

| Hook                  | Ereignisse                     | Was er tut                                           |
| --------------------- | ------------------------------ | ---------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Speichert Sitzungskontext in `<workspace>/memory/`   |
| bootstrap-extra-files | `agent:bootstrap`              | Fügt zusätzliche Bootstrap-Dateien aus Glob-Mustern ein |
| command-logger        | `command`                      | Protokolliert alle Befehle in `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Führt `BOOT.md` aus, wenn das Gateway startet        |

Aktivieren Sie einen beliebigen gebündelten Hook:

```bash
openclaw hooks enable <hook-name>
```

### session-memory-Details

Extrahiert die letzten 15 Benutzer-/Assistenten-Nachrichten, erstellt per LLM einen beschreibenden Dateinamen-Slug und speichert ihn unter `<workspace>/memory/YYYY-MM-DD-slug.md`. Erfordert, dass `workspace.dir` konfiguriert ist.

### bootstrap-extra-files-Konfiguration

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Pfade werden relativ zum Workspace aufgelöst. Es werden nur erkannte Bootstrap-Basisdateinamen geladen (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

## Plugin-Hooks

Plugins können Hooks über das Plugin SDK registrieren, um eine tiefere Integration zu ermöglichen: das Abfangen von Tool-Aufrufen, das Ändern von Prompts, die Steuerung des Nachrichtenflusses und mehr. Das Plugin SDK stellt 28 Hooks bereit, die Modellauflösung, Agent-Lifecycle, Nachrichtenfluss, Tool-Ausführung, Subagent-Koordination und Gateway-Lifecycle abdecken.

Die vollständige Referenz für Plugin-Hooks einschließlich `before_tool_call`, `before_agent_reply`, `before_install` und aller anderen Plugin-Hooks finden Sie unter [Plugin Architecture](/plugins/architecture#provider-runtime-hooks).

## Konfiguration

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Umgebungsvariablen pro Hook:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Zusätzliche Hook-Verzeichnisse:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
Das veraltete Konfigurationsformat `hooks.internal.handlers` als Array wird aus Gründen der Abwärtskompatibilität weiterhin unterstützt, aber neue Hooks sollten das erkennungsgestützte System verwenden.
</Note>

## CLI-Referenz

```bash
# Alle Hooks auflisten (fügen Sie --eligible, --verbose oder --json hinzu)
openclaw hooks list

# Detaillierte Informationen zu einem Hook anzeigen
openclaw hooks info <hook-name>

# Eignungsübersicht anzeigen
openclaw hooks check

# Aktivieren/deaktivieren
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Best Practices

- **Handler schnell halten.** Hooks werden während der Befehlsverarbeitung ausgeführt. Starten Sie aufwendige Arbeit im Hintergrund ohne Warten mit `void processInBackground(event)`.
- **Fehler sauber behandeln.** Kapseln Sie riskante Operationen in try/catch; werfen Sie keine Fehler, damit andere Handler weiterlaufen können.
- **Ereignisse früh filtern.** Kehren Sie sofort zurück, wenn Ereignistyp/-aktion nicht relevant ist.
- **Spezifische Ereignisschlüssel verwenden.** Bevorzugen Sie `"events": ["command:new"]` statt `"events": ["command"]`, um Overhead zu reduzieren.

## Fehlerbehebung

### Hook wird nicht erkannt

```bash
# Verzeichnisstruktur prüfen
ls -la ~/.openclaw/hooks/my-hook/
# Sollte anzeigen: HOOK.md, handler.ts

# Alle erkannten Hooks auflisten
openclaw hooks list
```

### Hook ist nicht geeignet

```bash
openclaw hooks info my-hook
```

Prüfen Sie auf fehlende Binärdateien (PATH), Umgebungsvariablen, Konfigurationswerte oder OS-Kompatibilität.

### Hook wird nicht ausgeführt

1. Prüfen Sie, ob der Hook aktiviert ist: `openclaw hooks list`
2. Starten Sie Ihren Gateway-Prozess neu, damit Hooks neu geladen werden.
3. Prüfen Sie die Gateway-Protokolle: `./scripts/clawlog.sh | grep hook`

## Verwandt

- [CLI Reference: hooks](/cli/hooks)
- [Webhooks](/automation/cron-jobs#webhooks)
- [Plugin Architecture](/plugins/architecture#provider-runtime-hooks) — vollständige Referenz für Plugin-Hooks
- [Configuration](/gateway/configuration-reference#hooks)
