---
read_when:
    - Ändern der Agent-Laufzeitumgebung, des Workspace-Bootstrap oder des Sitzungsverhaltens
summary: Agent-Laufzeitumgebung, Workspace-Vertrag und Sitzungs-Bootstrap
title: Agent-Laufzeitumgebung
x-i18n:
    generated_at: "2026-04-24T06:33:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07fe0ca3c6bc306f95ac024b97b4e6e188c2d30786b936b8bd66a5f3ec012d4e
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw führt eine **einzige eingebettete Agent-Laufzeitumgebung** aus — einen Agent-Prozess pro Gateway, mit eigenem Workspace, Bootstrap-Dateien und Sitzungsspeicher. Diese Seite behandelt diesen Laufzeitvertrag: was der Workspace enthalten muss, welche Dateien injiziert werden und wie Sitzungen dagegen gebootstrapped werden.

## Workspace (erforderlich)

OpenClaw verwendet ein einziges Agent-Workspace-Verzeichnis (`agents.defaults.workspace`) als **einziges** Arbeitsverzeichnis (`cwd`) des Agenten für Tools und Kontext.

Empfohlen: Verwenden Sie `openclaw setup`, um `~/.openclaw/openclaw.json` zu erstellen, falls es fehlt, und die Workspace-Dateien zu initialisieren.

Vollständiges Workspace-Layout + Backup-Anleitung: [Agent-Workspace](/de/concepts/agent-workspace)

Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen dies mit sitzungsspezifischen Workspaces unter `agents.defaults.sandbox.workspaceRoot` überschreiben (siehe [Gateway-Konfiguration](/de/gateway/configuration)).

## Bootstrap-Dateien (injiziert)

Innerhalb von `agents.defaults.workspace` erwartet OpenClaw diese vom Benutzer bearbeitbaren Dateien:

- `AGENTS.md` — Betriebsanweisungen + „Gedächtnis“
- `SOUL.md` — Persona, Grenzen, Ton
- `TOOLS.md` — vom Benutzer gepflegte Tool-Hinweise (z. B. `imsg`, `sag`, Konventionen)
- `BOOTSTRAP.md` — einmaliges Ritual beim ersten Start (wird nach Abschluss gelöscht)
- `IDENTITY.md` — Agent-Name/Vibe/Emoji
- `USER.md` — Benutzerprofil + bevorzugte Anrede

Beim ersten Durchlauf einer neuen Sitzung injiziert OpenClaw die Inhalte dieser Dateien direkt in den Agent-Kontext.

Leere Dateien werden übersprungen. Große Dateien werden gekürzt und mit einer Markierung abgeschnitten, damit Prompts schlank bleiben (lesen Sie die Datei für den vollständigen Inhalt).

Wenn eine Datei fehlt, injiziert OpenClaw eine einzelne Markierungszeile „missing file“ (und `openclaw setup` erstellt eine sichere Standardvorlage).

`BOOTSTRAP.md` wird nur für einen **brandneuen Workspace** erstellt (keine anderen Bootstrap-Dateien vorhanden). Wenn Sie sie nach Abschluss des Rituals löschen, sollte sie bei späteren Neustarts nicht neu erstellt werden.

Um die Erstellung von Bootstrap-Dateien vollständig zu deaktivieren (für vorbefüllte Workspaces), setzen Sie:

```json5
{ agent: { skipBootstrap: true } }
```

## Integrierte Tools

Core-Tools (read/exec/edit/write und verwandte System-Tools) sind immer verfügbar, vorbehaltlich der Tool-Richtlinie. `apply_patch` ist optional und durch `tools.exec.applyPatch` abgesichert. `TOOLS.md` steuert **nicht**, welche Tools existieren; es dient als Anleitung dafür, wie _Sie_ deren Verwendung möchten.

## Skills

OpenClaw lädt Skills aus diesen Orten (höchste Priorität zuerst):

- Workspace: `<workspace>/skills`
- Projekt-Agent-Skills: `<workspace>/.agents/skills`
- Persönliche Agent-Skills: `~/.agents/skills`
- Verwaltet/lokal: `~/.openclaw/skills`
- Gebündelt (mit der Installation ausgeliefert)
- Zusätzliche Skill-Ordner: `skills.load.extraDirs`

Skills können per Konfiguration/Umgebungsvariablen gesteuert werden (siehe `skills` in [Gateway-Konfiguration](/de/gateway/configuration)).

## Laufzeitgrenzen

Die eingebettete Agent-Laufzeitumgebung basiert auf dem Pi-Agent-Core (Modelle, Tools und Prompt-Pipeline). Sitzungsverwaltung, Erkennung, Tool-Verdrahtung und Kanalzustellung sind OpenClaw-eigene Schichten oberhalb dieses Cores.

## Sitzungen

Sitzungstranskripte werden als JSONL gespeichert unter:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Die Sitzungs-ID ist stabil und wird von OpenClaw ausgewählt.
Veraltete Sitzungsordner anderer Tools werden nicht gelesen.

## Steuern während des Streamings

Wenn der Queue-Modus `steer` ist, werden eingehende Nachrichten in die aktuelle Ausführung injiziert.
In die Warteschlange gestelltes Steering wird **nachdem der aktuelle Assistant-Durchlauf die Ausführung seiner Tool-Aufrufe beendet hat**, aber vor dem nächsten LLM-Aufruf zugestellt. Steering überspringt keine verbleibenden Tool-Aufrufe der aktuellen Assistant-Nachricht mehr; stattdessen wird die in die Warteschlange gestellte Nachricht an der nächsten Modellgrenze injiziert.

Wenn der Queue-Modus `followup` oder `collect` ist, werden eingehende Nachrichten zurückgehalten, bis der aktuelle Durchlauf endet; dann startet ein neuer Agent-Durchlauf mit den in die Warteschlange gestellten Payloads. Siehe [Queue](/de/concepts/queue) für Verhalten von Modus + Debounce/Cap.

Block-Streaming sendet abgeschlossene Assistant-Blöcke, sobald sie fertig sind; es ist standardmäßig **deaktiviert** (`agents.defaults.blockStreamingDefault: "off"`).
Passen Sie die Grenze über `agents.defaults.blockStreamingBreak` an (`text_end` vs. `message_end`; Standard ist text_end).
Steuern Sie weiches Block-Chunking mit `agents.defaults.blockStreamingChunk` (Standard
800–1200 Zeichen; bevorzugt Absatzumbrüche, dann Zeilenumbrüche; Sätze zuletzt).
Fassen Sie gestreamte Chunks mit `agents.defaults.blockStreamingCoalesce` zusammen, um
Spam aus einzelnen Zeilen zu reduzieren (Leerlauf-basiertes Zusammenführen vor dem Senden). Nicht-Telegram-Kanäle erfordern
explizit `*.blockStreaming: true`, um Block-Antworten zu aktivieren.
Ausführliche Tool-Zusammenfassungen werden beim Tool-Start ausgegeben (ohne Debounce); die Control UI
streamt Tool-Ausgabe über Agent-Ereignisse, wenn verfügbar.
Weitere Details: [Streaming + Chunking](/de/concepts/streaming).

## Modell-Refs

Modell-Refs in der Konfiguration (zum Beispiel `agents.defaults.model` und `agents.defaults.models`) werden durch Aufteilen am **ersten** `/` geparst.

- Verwenden Sie `provider/model`, wenn Sie Modelle konfigurieren.
- Wenn die Modell-ID selbst `/` enthält (im Stil von OpenRouter), schließen Sie das Provider-Präfix ein (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann eine eindeutige Übereinstimmung mit einem konfigurierten Provider für genau diese Modell-ID und greift erst danach auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw auf das erste konfigurierte Provider/Modell zurück, anstatt einen veralteten Standard eines entfernten Providers anzuzeigen.

## Konfiguration (minimal)

Mindestens festlegen:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (dringend empfohlen)

---

_Next: [Gruppenchats](/de/channels/group-messages)_ 🦞

## Verwandt

- [Agent-Workspace](/de/concepts/agent-workspace)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Sitzungsverwaltung](/de/concepts/session)
