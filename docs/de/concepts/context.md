---
read_when:
    - Sie verstehen möchten, was „Kontext“ in OpenClaw bedeutet
    - Sie debuggen, warum das Modell etwas „weiß“ (oder vergessen hat)
    - Sie den Kontext-Overhead verringern möchten (/context, /status, /compact)
summary: 'Kontext: was das Modell sieht, wie er aufgebaut wird und wie man ihn prüft'
title: Kontext
x-i18n:
    generated_at: "2026-04-05T12:39:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: a75b4cd65bf6385d46265b9ce1643310bc99d220e35ec4b4924096bed3ca4aa0
    source_path: concepts/context.md
    workflow: 15
---

# Kontext

„Kontext“ ist **alles, was OpenClaw für einen Lauf an das Modell sendet**. Er ist durch das **Kontextfenster** des Modells (Token-Limit) begrenzt.

Mentales Modell für Einsteiger:

- **System-Prompt** (von OpenClaw aufgebaut): Regeln, Tools, Skills-Liste, Zeit/Laufzeit und eingefügte Workspace-Dateien.
- **Konversationsverlauf**: Ihre Nachrichten + die Nachrichten des Assistenten für diese Sitzung.
- **Tool-Aufrufe/-Ergebnisse + Anhänge**: Befehlsausgaben, Dateilesevorgänge, Bilder/Audio usw.

Kontext ist _nicht dasselbe_ wie „Speicher“: Speicher kann auf der Festplatte abgelegt und später erneut geladen werden; Kontext ist das, was sich im aktuellen Fenster des Modells befindet.

## Schnellstart (Kontext prüfen)

- `/status` → schnelle Ansicht „wie voll ist mein Fenster?“ + Sitzungseinstellungen.
- `/context list` → was eingefügt wird + ungefähre Größen (pro Datei + Summen).
- `/context detail` → tiefere Aufschlüsselung: pro Datei, Größen pro Tool-Schema, Größen pro Skill-Eintrag und Größe des System-Prompts.
- `/usage tokens` → normalen Antworten eine Nutzungs-Fußzeile pro Antwort anhängen.
- `/compact` → älteren Verlauf zu einem kompakten Eintrag zusammenfassen, um Fensterplatz freizugeben.

Siehe auch: [Slash-Befehle](/tools/slash-commands), [Token-Nutzung und Kosten](/reference/token-use), [Kompaktierung](/concepts/compaction).

## Beispielausgabe

Die Werte variieren je nach Modell, Provider, Tool-Richtlinie und dem, was sich in Ihrem Workspace befindet.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 20,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## Was auf das Kontextfenster angerechnet wird

Alles, was das Modell erhält, zählt dazu, einschließlich:

- System-Prompt (alle Abschnitte).
- Konversationsverlauf.
- Tool-Aufrufe + Tool-Ergebnisse.
- Anhänge/Transkripte (Bilder/Audio/Dateien).
- Kompaktierungszusammenfassungen und Pruning-Artefakte.
- Provider-„Wrapper“ oder verborgene Header (nicht sichtbar, werden trotzdem mitgezählt).

## Wie OpenClaw den System-Prompt aufbaut

Der System-Prompt wird **von OpenClaw verwaltet** und bei jedem Lauf neu erstellt. Er enthält:

- Tool-Liste + kurze Beschreibungen.
- Skills-Liste (nur Metadaten; siehe unten).
- Workspace-Speicherort.
- Zeit (UTC + umgerechnete Benutzerzeit, falls konfiguriert).
- Laufzeit-Metadaten (Host/OS/Modell/Thinking).
- Eingefügte Workspace-Bootstrap-Dateien unter **Project Context**.

Vollständige Aufschlüsselung: [System-Prompt](/concepts/system-prompt).

## Eingefügte Workspace-Dateien (Project Context)

Standardmäßig fügt OpenClaw einen festen Satz von Workspace-Dateien ein (falls vorhanden):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur beim ersten Lauf)

Große Dateien werden pro Datei mit `agents.defaults.bootstrapMaxChars` gekürzt (Standard `20000` Zeichen). OpenClaw erzwingt außerdem eine Gesamtobergrenze für die Bootstrap-Einfügung über alle Dateien hinweg mit `agents.defaults.bootstrapTotalMaxChars` (Standard `150000` Zeichen). `/context` zeigt Größen **roh vs. eingefügt** und ob eine Kürzung stattgefunden hat.

Wenn eine Kürzung erfolgt, kann die Laufzeit einen Warnblock im Prompt unter Project Context einfügen. Konfigurieren Sie dies mit `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; Standard `once`).

## Skills: eingefügt vs. bei Bedarf geladen

Der System-Prompt enthält eine kompakte **Skills-Liste** (Name + Beschreibung + Speicherort). Diese Liste hat echten Overhead.

Skill-Anweisungen sind standardmäßig _nicht_ enthalten. Vom Modell wird erwartet, dass es die `SKILL.md` eines Skills **nur bei Bedarf** mit `read` liest.

## Tools: es gibt zwei Kostenarten

Tools beeinflussen den Kontext auf zwei Arten:

1. **Text der Tool-Liste** im System-Prompt (das, was Sie als „Tooling“ sehen).
2. **Tool-Schemas** (JSON). Diese werden an das Modell gesendet, damit es Tools aufrufen kann. Sie zählen zum Kontext, auch wenn Sie sie nicht als Klartext sehen.

`/context detail` schlüsselt die größten Tool-Schemas auf, damit Sie sehen können, was dominiert.

## Befehle, Direktiven und „Inline-Shortcuts“

Slash-Befehle werden vom Gateway verarbeitet. Es gibt einige unterschiedliche Verhaltensweisen:

- **Eigenständige Befehle**: Eine Nachricht, die nur aus `/...` besteht, wird als Befehl ausgeführt.
- **Direktiven**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` werden entfernt, bevor das Modell die Nachricht sieht.
  - Nachrichten, die nur aus Direktiven bestehen, speichern Sitzungseinstellungen dauerhaft.
  - Inline-Direktiven in einer normalen Nachricht wirken als Hinweise pro Nachricht.
- **Inline-Shortcuts** (nur für Allowlist-Absender): Bestimmte `/...`-Token innerhalb einer normalen Nachricht können sofort ausgeführt werden (Beispiel: „hey /status“) und werden entfernt, bevor das Modell den restlichen Text sieht.

Details: [Slash-Befehle](/tools/slash-commands).

## Sitzungen, Kompaktierung und Pruning (was erhalten bleibt)

Was über Nachrichten hinweg erhalten bleibt, hängt vom Mechanismus ab:

- **Normaler Verlauf** bleibt im Sitzungs-Transkript erhalten, bis er durch Richtlinien kompaktisiert/gekürzt wird.
- **Kompaktierung** speichert eine Zusammenfassung im Transkript und belässt aktuelle Nachrichten unverändert.
- **Pruning** entfernt alte Tool-Ergebnisse aus dem _In-Memory_-Prompt für einen Lauf, schreibt das Transkript aber nicht um.

Dokumentation: [Sitzung](/concepts/session), [Kompaktierung](/concepts/compaction), [Sitzungs-Pruning](/concepts/session-pruning).

Standardmäßig verwendet OpenClaw die integrierte `legacy`-Kontext-Engine für Aufbau und
Kompaktierung. Wenn Sie ein Plugin installieren, das `kind: "context-engine"` bereitstellt, und
es mit `plugins.slots.contextEngine` auswählen, delegiert OpenClaw den Kontextaufbau,
`/compact` und verwandte Lebenszyklus-Hooks für den Subagent-Kontext stattdessen an diese
Engine. `ownsCompaction: false` führt nicht automatisch zu einem Fallback auf die
`legacy`-Engine; die aktive Engine muss `compact()` weiterhin korrekt implementieren. Siehe
[Context Engine](/concepts/context-engine) für die vollständige
pluggbare Schnittstelle, Lebenszyklus-Hooks und Konfiguration.

## Was `/context` tatsächlich meldet

`/context` bevorzugt, wenn verfügbar, den neuesten Bericht über den **zur Laufzeit aufgebauten** System-Prompt:

- `System prompt (run)` = vom letzten eingebetteten Lauf (mit Tool-Unterstützung) erfasst und im Sitzungsspeicher gespeichert.
- `System prompt (estimate)` = on-the-fly berechnet, wenn kein Laufbericht existiert (oder wenn über ein CLI-Backend ausgeführt wird, das diesen Bericht nicht erzeugt).

In beiden Fällen werden Größen und die größten Beitragsfaktoren gemeldet; der vollständige System-Prompt oder die Tool-Schemas werden **nicht** ausgegeben.

## Verwandt

- [Context Engine](/concepts/context-engine) — benutzerdefinierte Kontexteinfügung über Plugins
- [Kompaktierung](/concepts/compaction) — lange Konversationen zusammenfassen
- [System-Prompt](/concepts/system-prompt) — wie der System-Prompt aufgebaut wird
- [Agent Loop](/concepts/agent-loop) — der vollständige Ausführungszyklus des Agenten
