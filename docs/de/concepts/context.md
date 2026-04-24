---
read_when:
    - Sie möchten verstehen, was „Kontext“ in OpenClaw bedeutet
    - Sie debuggen, warum das Modell etwas „weiß“ (oder vergessen hat)
    - Sie möchten den Kontext-Overhead reduzieren (`/context`, `/status`, `/compact`)
summary: 'Kontext: was das Modell sieht, wie er aufgebaut wird und wie man ihn untersucht'
title: Kontext
x-i18n:
    generated_at: "2026-04-24T06:33:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537c989d1578a186a313698d3b97d75111fedb641327fb7a8b72e47b71b84b85
    source_path: concepts/context.md
    workflow: 15
---

„Kontext“ ist **alles, was OpenClaw für einen Lauf an das Modell sendet**. Er ist durch das **Kontextfenster** des Modells (Token-Limit) begrenzt.

Einsteiger-Modell:

- **System-Prompt** (von OpenClaw erstellt): Regeln, Tools, Skills-Liste, Zeit/Laufzeit und injizierte Workspace-Dateien.
- **Konversationsverlauf**: Ihre Nachrichten + die Nachrichten des Assistenten für diese Sitzung.
- **Tool-Aufrufe/-Ergebnisse + Anhänge**: Befehlsausgabe, Dateilesevorgänge, Bilder/Audio usw.

Kontext ist _nicht dasselbe_ wie „Memory“: Memory kann auf Datenträger gespeichert und später erneut geladen werden; Kontext ist das, was sich im aktuellen Fenster des Modells befindet.

## Schnellstart (Kontext untersuchen)

- `/status` → schnelle Ansicht „wie voll ist mein Fenster?“ + Sitzungseinstellungen.
- `/context list` → was injiziert wird + grobe Größen (pro Datei + Summen).
- `/context detail` → tiefere Aufschlüsselung: pro Datei, Größen pro Tool-Schema, Größen pro Skill-Eintrag und Größe des System-Prompts.
- `/usage tokens` → fügt normalen Antworten eine Fußzeile zur Nutzung pro Antwort hinzu.
- `/compact` → fasst älteren Verlauf zu einem kompakten Eintrag zusammen, um Fensterplatz freizugeben.

Siehe auch: [Slash-Befehle](/de/tools/slash-commands), [Token-Nutzung & Kosten](/de/reference/token-use), [Compaction](/de/concepts/compaction).

## Beispielausgabe

Die Werte variieren je nach Modell, Provider, Tool-Richtlinie und Inhalt Ihres Workspace.

### `/context list`

```
🧠 Kontextaufschlüsselung
Workspace: <workspaceDir>
Bootstrap-Maximum/Datei: 12.000 Zeichen
Sandbox: mode=non-main sandboxed=false
System-Prompt (Lauf): 38.412 Zeichen (~9.603 Tok) (Project Context 23.901 Zeichen (~5.976 Tok))

Injizierte Workspace-Dateien:
- AGENTS.md: OK | roh 1.742 Zeichen (~436 Tok) | injiziert 1.742 Zeichen (~436 Tok)
- SOUL.md: OK | roh 912 Zeichen (~228 Tok) | injiziert 912 Zeichen (~228 Tok)
- TOOLS.md: TRUNCATED | roh 54.210 Zeichen (~13.553 Tok) | injiziert 20.962 Zeichen (~5.241 Tok)
- IDENTITY.md: OK | roh 211 Zeichen (~53 Tok) | injiziert 211 Zeichen (~53 Tok)
- USER.md: OK | roh 388 Zeichen (~97 Tok) | injiziert 388 Zeichen (~97 Tok)
- HEARTBEAT.md: MISSING | roh 0 | injiziert 0
- BOOTSTRAP.md: OK | roh 0 Zeichen (~0 Tok) | injiziert 0 Zeichen (~0 Tok)

Skills-Liste (System-Prompt-Text): 2.184 Zeichen (~546 Tok) (12 Skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool-Liste (System-Prompt-Text): 1.032 Zeichen (~258 Tok)
Tool-Schemas (JSON): 31.988 Zeichen (~7.997 Tok) (zählt zum Kontext; wird nicht als Text angezeigt)
Tools: (wie oben)

Sitzungs-Token (zwischengespeichert): 14.250 gesamt / ctx=32.000
```

### `/context detail`

```
🧠 Kontextaufschlüsselung (detailliert)
…
Top-Skills (Größe des Prompt-Eintrags):
- frontend-design: 412 Zeichen (~103 Tok)
- oracle: 401 Zeichen (~101 Tok)
… (+10 weitere Skills)

Top-Tools (Schema-Größe):
- browser: 9.812 Zeichen (~2.453 Tok)
- exec: 6.240 Zeichen (~1.560 Tok)
… (+N weitere Tools)
```

## Was zum Kontextfenster zählt

Alles, was das Modell erhält, zählt mit, darunter:

- System-Prompt (alle Abschnitte).
- Konversationsverlauf.
- Tool-Aufrufe + Tool-Ergebnisse.
- Anhänge/Transkripte (Bilder/Audio/Dateien).
- Compaction-Zusammenfassungen und Pruning-Artefakte.
- Provider-„Wrapper“ oder versteckte Header (nicht sichtbar, zählen trotzdem).

## Wie OpenClaw den System-Prompt aufbaut

Der System-Prompt gehört **OpenClaw** und wird bei jedem Lauf neu aufgebaut. Er enthält:

- Tool-Liste + Kurzbeschreibungen.
- Skills-Liste (nur Metadaten; siehe unten).
- Workspace-Speicherort.
- Zeit (UTC + umgerechnete Benutzerzeit, falls konfiguriert).
- Laufzeit-Metadaten (Host/OS/Modell/Thinking).
- Injizierte Workspace-Bootstrap-Dateien unter **Project Context**.

Vollständige Aufschlüsselung: [System-Prompt](/de/concepts/system-prompt).

## Injizierte Workspace-Dateien (Project Context)

Standardmäßig injiziert OpenClaw einen festen Satz von Workspace-Dateien (falls vorhanden):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur beim ersten Lauf)

Große Dateien werden pro Datei mit `agents.defaults.bootstrapMaxChars` gekürzt (Standard `12000` Zeichen). OpenClaw erzwingt außerdem über Dateien hinweg ein Gesamtlimit für Bootstrap-Injektionen mit `agents.defaults.bootstrapTotalMaxChars` (Standard `60000` Zeichen). `/context` zeigt **roh vs. injiziert** sowie, ob eine Kürzung stattgefunden hat.

Wenn eine Kürzung erfolgt, kann die Laufzeit einen Warnblock im Prompt unter Project Context injizieren. Konfigurieren Sie dies mit `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; Standard `once`).

## Skills: injiziert vs. bei Bedarf geladen

Der System-Prompt enthält eine kompakte **Skills-Liste** (Name + Beschreibung + Speicherort). Diese Liste hat realen Overhead.

Skill-Anweisungen sind standardmäßig _nicht_ enthalten. Es wird erwartet, dass das Modell die `SKILL.md` eines Skills **nur bei Bedarf** mit `read` liest.

## Tools: Es gibt zwei Kostenarten

Tools beeinflussen den Kontext auf zwei Arten:

1. **Tool-Listentext** im System-Prompt (das, was Sie als „Tooling“ sehen).
2. **Tool-Schemas** (JSON). Diese werden an das Modell gesendet, damit es Tools aufrufen kann. Sie zählen zum Kontext, obwohl Sie sie nicht als Klartext sehen.

`/context detail` schlüsselt die größten Tool-Schemas auf, damit Sie sehen können, was dominiert.

## Befehle, Direktiven und „Inline-Shortcuts“

Slash-Befehle werden vom Gateway verarbeitet. Es gibt einige unterschiedliche Verhaltensweisen:

- **Eigenständige Befehle**: Eine Nachricht, die nur aus `/...` besteht, wird als Befehl ausgeführt.
- **Direktiven**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` werden entfernt, bevor das Modell die Nachricht sieht.
  - Nachrichten, die nur aus Direktiven bestehen, persistieren Sitzungseinstellungen.
  - Inline-Direktiven in einer normalen Nachricht wirken als Hinweise pro Nachricht.
- **Inline-Shortcuts** (nur für Sender auf der Allowlist): Bestimmte `/...`-Tokens innerhalb einer normalen Nachricht können sofort ausgeführt werden (Beispiel: „hey /status“) und werden entfernt, bevor das Modell den übrigen Text sieht.

Details: [Slash-Befehle](/de/tools/slash-commands).

## Sitzungen, Compaction und Pruning (was bestehen bleibt)

Was über Nachrichten hinweg bestehen bleibt, hängt vom Mechanismus ab:

- **Normaler Verlauf** bleibt im Sitzungs-Transkript bestehen, bis er durch Richtlinien compacted/gepruned wird.
- **Compaction** persistiert eine Zusammenfassung im Transkript und behält aktuelle Nachrichten intakt.
- **Pruning** entfernt alte Tool-Ergebnisse aus dem _In-Memory_-Prompt, um Platz im Kontextfenster freizugeben, schreibt das Sitzungs-Transkript aber nicht um — der vollständige Verlauf bleibt auf Datenträger untersuchbar.

Dokumentation: [Sitzung](/de/concepts/session), [Compaction](/de/concepts/compaction), [Session-Pruning](/de/concepts/session-pruning).

Standardmäßig verwendet OpenClaw für Zusammenstellung und
Compaction die eingebaute `legacy`-Kontext-Engine. Wenn Sie ein Plugin installieren, das `kind: "context-engine"` bereitstellt, und
es mit `plugins.slots.contextEngine` auswählen, delegiert OpenClaw die Kontext-
Zusammenstellung, `/compact` und zugehörige Kontext-Lebenszyklus-Hooks für Subagenten stattdessen an diese
Engine. `ownsCompaction: false` führt nicht automatisch zum Fallback auf die Legacy-
Engine; die aktive Engine muss `compact()` weiterhin korrekt implementieren. Siehe
[Context Engine](/de/concepts/context-engine) für die vollständige
Plugin-Schnittstelle, Lebenszyklus-Hooks und Konfiguration.

## Was `/context` tatsächlich meldet

`/context` bevorzugt den neuesten **im Lauf aufgebauten** System-Prompt-Bericht, wenn verfügbar:

- `System prompt (run)` = aus dem letzten eingebetteten Lauf (toolfähig) erfasst und im Sitzungs-Store persistiert.
- `System prompt (estimate)` = on the fly berechnet, wenn kein Lauf-Bericht existiert (oder wenn über ein CLI-Backend ausgeführt wird, das den Bericht nicht erzeugt).

In beiden Fällen werden Größen und die größten Verursacher gemeldet; der vollständige System-Prompt oder die Tool-Schemas werden **nicht** ausgegeben.

## Verwandt

- [Context Engine](/de/concepts/context-engine) — benutzerdefinierte Kontext-Injektion über Plugins
- [Compaction](/de/concepts/compaction) — lange Unterhaltungen zusammenfassen
- [System-Prompt](/de/concepts/system-prompt) — wie der System-Prompt aufgebaut wird
- [Agent Loop](/de/concepts/agent-loop) — der vollständige Agent-Ausführungszyklus
