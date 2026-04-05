---
read_when:
    - Ändern der Agent-Runtime, des Workspace-Bootstrap oder des Sitzungsverhaltens
summary: Agent-Runtime, Workspace-Vertrag und Sitzungs-Bootstrap
title: Agent Runtime
x-i18n:
    generated_at: "2026-04-05T12:39:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2ff39f4114f009e5b1f86894ea4bb29b1c9512563b70d063f09ca7cde5e8948
    source_path: concepts/agent.md
    workflow: 15
---

# Agent Runtime

OpenClaw führt eine einzelne eingebettete Agent-Runtime aus.

## Workspace (erforderlich)

OpenClaw verwendet ein einzelnes Agent-Workspace-Verzeichnis (`agents.defaults.workspace`) als **einziges** Arbeitsverzeichnis (`cwd`) des Agenten für Tools und Kontext.

Empfohlen: Verwenden Sie `openclaw setup`, um `~/.openclaw/openclaw.json` zu erstellen, falls es fehlt, und die Workspace-Dateien zu initialisieren.

Vollständiges Workspace-Layout + Backup-Leitfaden: [Agent workspace](/concepts/agent-workspace)

Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen dies mit
Workspace-Verzeichnissen pro Sitzung unter `agents.defaults.sandbox.workspaceRoot` überschreiben (siehe
[Gateway configuration](/gateway/configuration)).

## Bootstrap-Dateien (eingefügt)

Innerhalb von `agents.defaults.workspace` erwartet OpenClaw diese vom Benutzer bearbeitbaren Dateien:

- `AGENTS.md` — Betriebsanweisungen + „memory“
- `SOUL.md` — Persona, Grenzen, Ton
- `TOOLS.md` — vom Benutzer gepflegte Tool-Hinweise (z. B. `imsg`, `sag`, Konventionen)
- `BOOTSTRAP.md` — einmaliges Ritual beim ersten Start (wird nach Abschluss gelöscht)
- `IDENTITY.md` — Agent-Name/Vibe/Emoji
- `USER.md` — Benutzerprofil + bevorzugte Anrede

Im ersten Zug einer neuen Sitzung fügt OpenClaw den Inhalt dieser Dateien direkt in den Agent-Kontext ein.

Leere Dateien werden übersprungen. Große Dateien werden gekürzt und mit einer Markierung abgeschnitten, damit Prompts schlank bleiben (lesen Sie die Datei für den vollständigen Inhalt).

Wenn eine Datei fehlt, fügt OpenClaw eine einzelne Marker-Zeile für „fehlende Datei“ ein (und `openclaw setup` erstellt eine sichere Standardvorlage).

`BOOTSTRAP.md` wird nur für einen **brandneuen Workspace** erstellt (keine anderen Bootstrap-Dateien vorhanden). Wenn Sie sie nach Abschluss des Rituals löschen, sollte sie bei späteren Neustarts nicht erneut erstellt werden.

Um die Erstellung von Bootstrap-Dateien vollständig zu deaktivieren (für vorinitialisierte Workspaces), setzen Sie:

```json5
{ agent: { skipBootstrap: true } }
```

## Integrierte Tools

Core-Tools (read/exec/edit/write und verwandte System-Tools) sind immer verfügbar,
vorbehaltlich der Tool-Richtlinie. `apply_patch` ist optional und wird durch
`tools.exec.applyPatch` gesteuert. `TOOLS.md` steuert **nicht**, welche Tools existieren; es ist
eine Anleitung dafür, wie _Sie_ deren Verwendung wünschen.

## Skills

OpenClaw lädt Skills aus diesen Orten (höchste Priorität zuerst):

- Workspace: `<workspace>/skills`
- Projekt-Agent-Skills: `<workspace>/.agents/skills`
- Persönliche Agent-Skills: `~/.agents/skills`
- Verwaltet/lokal: `~/.openclaw/skills`
- Gebündelt (mit der Installation ausgeliefert)
- Zusätzliche Skill-Ordner: `skills.load.extraDirs`

Skills können durch Konfiguration/Umgebung gesteuert werden (siehe `skills` in [Gateway configuration](/gateway/configuration)).

## Runtime-Grenzen

Die eingebettete Agent-Runtime basiert auf dem Pi-Agent-Core (Modelle, Tools und
Prompt-Pipeline). Sitzungsverwaltung, Erkennung, Tool-Verdrahtung und Kanal-
Zustellung sind OpenClaw-eigene Ebenen oberhalb dieses Cores.

## Sitzungen

Sitzungstranskripte werden als JSONL gespeichert unter:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Die Sitzungs-ID ist stabil und wird von OpenClaw gewählt.
Veraltete Sitzungsordner aus anderen Tools werden nicht gelesen.

## Steuern während des Streamings

Wenn der Queue-Modus `steer` ist, werden eingehende Nachrichten in den aktuellen Lauf eingespeist.
In die Warteschlange gestelltes Steering wird **nachdem der aktuelle Assistant-Zug seine Tool-Aufrufe ausgeführt hat** zugestellt,
noch vor dem nächsten LLM-Aufruf. Steering überspringt keine
verbleibenden Tool-Aufrufe aus der aktuellen Assistant-Nachricht mehr; stattdessen wird die in die Warteschlange gestellte
Nachricht an der nächsten Modellgrenze eingespeist.

Wenn der Queue-Modus `followup` oder `collect` ist, werden eingehende Nachrichten bis zum
Ende des aktuellen Zuges gehalten, dann startet ein neuer Agent-Zug mit den eingereihten Payloads. Siehe
[Queue](/concepts/queue) für Modus- sowie Debounce-/Cap-Verhalten.

Block-Streaming sendet abgeschlossene Assistant-Blöcke, sobald sie fertig sind; es ist
**standardmäßig deaktiviert** (`agents.defaults.blockStreamingDefault: "off"`).
Stellen Sie die Grenze über `agents.defaults.blockStreamingBreak` ein (`text_end` vs `message_end`; Standard ist text_end).
Steuern Sie das weiche Chunking von Blöcken mit `agents.defaults.blockStreamingChunk` (standardmäßig
800–1200 Zeichen; bevorzugt Absatzumbrüche, dann Zeilenumbrüche; Sätze zuletzt).
Fassen Sie gestreamte Chunks mit `agents.defaults.blockStreamingCoalesce` zusammen, um
Spam aus einzelnen Zeilen zu reduzieren (zusammenführen basierend auf Leerlauf vor dem Senden). Nicht-Telegram-Kanäle erfordern
explizit `*.blockStreaming: true`, um Block-Antworten zu aktivieren.
Ausführliche Tool-Zusammenfassungen werden beim Tool-Start ausgegeben (ohne Debounce); die Control UI
streamt Tool-Ausgabe über Agent-Ereignisse, wenn verfügbar.
Weitere Details: [Streaming + chunking](/concepts/streaming).

## Modell-Refs

Modell-Refs in der Konfiguration (zum Beispiel `agents.defaults.model` und `agents.defaults.models`) werden geparst, indem am **ersten** `/` getrennt wird.

- Verwenden Sie `provider/model`, wenn Sie Modelle konfigurieren.
- Wenn die Modell-ID selbst `/` enthält (im OpenRouter-Stil), fügen Sie das Provider-Präfix hinzu (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann einen eindeutigen
  Treffer auf einen konfigurierten Provider für genau diese Modell-ID und fällt erst dann auf
  den konfigurierten Standard-Provider zurück. Wenn dieser Provider das
  konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw auf das erste konfigurierte
  Provider-/Modell-Paar zurück, anstatt einen veralteten entfernten Provider-Standard anzuzeigen.

## Konfiguration (minimal)

Mindestens setzen:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (dringend empfohlen)

---

_Next: [Group Chats](/channels/group-messages)_ 🦞
