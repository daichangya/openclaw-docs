---
read_when:
    - Sie möchten verstehen, was „Kontext“ in OpenClaw bedeutet.
    - Sie debuggen, warum das Modell etwas „weiß“ (oder es vergessen hat).
    - Sie möchten den Kontext-Overhead reduzieren (`/context`, `/status`, `/compact`).
summary: 'Kontext: was das Modell sieht, wie es erstellt wird und wie es untersucht werden kann'
title: Kontext
x-i18n:
    generated_at: "2026-04-12T23:27:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3620db1a8c1956d91a01328966df491388d3a32c4003dc4447197eb34316c77d
    source_path: concepts/context.md
    workflow: 15
---

# Kontext

„Kontext“ ist **alles, was OpenClaw für einen Durchlauf an das Modell sendet**. Er ist durch das **Kontextfenster** des Modells (Token-Limit) begrenzt.

Ein mentales Modell für Einsteiger:

- **System Prompt** (von OpenClaw erstellt): Regeln, Tools, Skills-Liste, Zeit/Laufzeit und injizierte Workspace-Dateien.
- **Konversationsverlauf**: Ihre Nachrichten + die Nachrichten des Assistenten für diese Sitzung.
- **Tool-Aufrufe/-Ergebnisse + Anhänge**: Befehlsausgabe, gelesene Dateien, Bilder/Audio usw.

Kontext ist _nicht dasselbe_ wie „Memory“: Memory kann auf der Festplatte gespeichert und später erneut geladen werden; Kontext ist das, was sich im aktuellen Fenster des Modells befindet.

## Schnellstart (Kontext untersuchen)

- `/status` → schnelle Ansicht „wie voll ist mein Fenster?“ + Sitzungseinstellungen.
- `/context list` → was injiziert ist + grobe Größen (pro Datei + Summen).
- `/context detail` → detailliertere Aufschlüsselung: Größen pro Datei, pro Tool-Schema, pro Skills-Eintrag und Größe des System Prompt.
- `/usage tokens` → hängt einen Nutzungs-Footer pro Antwort an normale Antworten an.
- `/compact` → fasst älteren Verlauf zu einem kompakten Eintrag zusammen, um Platz im Fenster freizugeben.

Siehe auch: [Slash-Befehle](/de/tools/slash-commands), [Token-Nutzung & Kosten](/de/reference/token-use), [Compaction](/de/concepts/compaction).

## Beispielausgabe

Die Werte variieren je nach Modell, Provider, Tool-Richtlinie und dem, was sich in Ihrem Workspace befindet.

### `/context list`

```
🧠 Aufschlüsselung des Kontexts
Workspace: <workspaceDir>
Bootstrap-Maximum/Datei: 20,000 Zeichen
Sandbox: mode=non-main sandboxed=false
System Prompt (Durchlauf): 38,412 Zeichen (~9,603 Tok) (Project Context 23,901 Zeichen (~5,976 Tok))

Injizierte Workspace-Dateien:
- AGENTS.md: OK | roh 1,742 Zeichen (~436 Tok) | injiziert 1,742 Zeichen (~436 Tok)
- SOUL.md: OK | roh 912 Zeichen (~228 Tok) | injiziert 912 Zeichen (~228 Tok)
- TOOLS.md: TRUNCATED | roh 54,210 Zeichen (~13,553 Tok) | injiziert 20,962 Zeichen (~5,241 Tok)
- IDENTITY.md: OK | roh 211 Zeichen (~53 Tok) | injiziert 211 Zeichen (~53 Tok)
- USER.md: OK | roh 388 Zeichen (~97 Tok) | injiziert 388 Zeichen (~97 Tok)
- HEARTBEAT.md: MISSING | roh 0 | injiziert 0
- BOOTSTRAP.md: OK | roh 0 Zeichen (~0 Tok) | injiziert 0 Zeichen (~0 Tok)

Skills-Liste (System-Prompt-Text): 2,184 Zeichen (~546 Tok) (12 Skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool-Liste (System-Prompt-Text): 1,032 Zeichen (~258 Tok)
Tool-Schemas (JSON): 31,988 Zeichen (~7,997 Tok) (zählen zum Kontext; werden nicht als Text angezeigt)
Tools: (wie oben)

Sitzungs-Token (im Cache): 14,250 insgesamt / ctx=32,000
```

### `/context detail`

```
🧠 Aufschlüsselung des Kontexts (detailliert)
…
Größte Skills (Eintragsgröße im Prompt):
- frontend-design: 412 Zeichen (~103 Tok)
- oracle: 401 Zeichen (~101 Tok)
… (+10 weitere Skills)

Größte Tools (Schema-Größe):
- browser: 9,812 Zeichen (~2,453 Tok)
- exec: 6,240 Zeichen (~1,560 Tok)
… (+N weitere Tools)
```

## Was auf das Kontextfenster angerechnet wird

Alles, was das Modell erhält, wird angerechnet, einschließlich:

- System Prompt (alle Abschnitte).
- Konversationsverlauf.
- Tool-Aufrufe + Tool-Ergebnisse.
- Anhänge/Transkripte (Bilder/Audio/Dateien).
- Compaction-Zusammenfassungen und Pruning-Artefakte.
- Provider-„Wrapper“ oder verborgene Header (nicht sichtbar, werden trotzdem angerechnet).

## Wie OpenClaw den System Prompt erstellt

Der System Prompt gehört **OpenClaw** und wird bei jedem Durchlauf neu erstellt. Er enthält:

- Tool-Liste + kurze Beschreibungen.
- Skills-Liste (nur Metadaten; siehe unten).
- Workspace-Speicherort.
- Zeit (UTC + konvertierte Benutzerzeit, falls konfiguriert).
- Laufzeit-Metadaten (Host/OS/Modell/Thinking).
- Injizierte Workspace-Bootstrap-Dateien unter **Project Context**.

Vollständige Aufschlüsselung: [System Prompt](/de/concepts/system-prompt).

## Injizierte Workspace-Dateien (Project Context)

Standardmäßig injiziert OpenClaw eine feste Menge von Workspace-Dateien (falls vorhanden):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur beim ersten Durchlauf)

Große Dateien werden pro Datei mit `agents.defaults.bootstrapMaxChars` abgeschnitten (Standard: `20000` Zeichen). OpenClaw erzwingt außerdem eine Gesamtobergrenze für Bootstrap-Injektionen über alle Dateien hinweg mit `agents.defaults.bootstrapTotalMaxChars` (Standard: `150000` Zeichen). `/context` zeigt **Roh- vs. injizierte** Größen und ob eine Abschneidung stattgefunden hat.

Wenn eine Abschneidung erfolgt, kann die Laufzeit einen Warnblock direkt im Prompt unter Project Context injizieren. Konfigurieren Sie dies mit `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; Standard: `once`).

## Skills: injiziert vs. bei Bedarf geladen

Der System Prompt enthält eine kompakte **Skills-Liste** (Name + Beschreibung + Speicherort). Diese Liste verursacht realen Overhead.

Skill-Anweisungen sind standardmäßig _nicht_ enthalten. Es wird erwartet, dass das Modell die `SKILL.md` des Skills **nur bei Bedarf** mit `read` liest.

## Tools: es gibt zwei Kostenarten

Tools beeinflussen den Kontext auf zwei Arten:

1. **Text der Tool-Liste** im System Prompt (was Sie als „Tooling“ sehen).
2. **Tool-Schemas** (JSON). Diese werden an das Modell gesendet, damit es Tools aufrufen kann. Sie zählen zum Kontext, auch wenn Sie sie nicht als Klartext sehen.

`/context detail` schlüsselt die größten Tool-Schemas auf, damit Sie sehen können, was dominiert.

## Befehle, Direktiven und „Inline-Kurzbefehle“

Slash-Befehle werden vom Gateway verarbeitet. Es gibt einige unterschiedliche Verhaltensweisen:

- **Eigenständige Befehle**: Eine Nachricht, die nur aus `/...` besteht, wird als Befehl ausgeführt.
- **Direktiven**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` werden entfernt, bevor das Modell die Nachricht sieht.
  - Nachrichten, die nur aus Direktiven bestehen, speichern Sitzungseinstellungen dauerhaft.
  - Inline-Direktiven in einer normalen Nachricht wirken als Hinweise pro Nachricht.
- **Inline-Kurzbefehle** (nur für Sender auf der Allowlist): Bestimmte `/...`-Token innerhalb einer normalen Nachricht können sofort ausgeführt werden (Beispiel: „hey /status“) und werden entfernt, bevor das Modell den verbleibenden Text sieht.

Details: [Slash-Befehle](/de/tools/slash-commands).

## Sitzungen, Compaction und Pruning (was erhalten bleibt)

Was zwischen Nachrichten erhalten bleibt, hängt vom Mechanismus ab:

- **Normaler Verlauf** bleibt im Sitzungs-Transkript erhalten, bis er gemäß Richtlinie kompaktisiert/beschnitten wird.
- **Compaction** speichert eine Zusammenfassung im Transkript und lässt aktuelle Nachrichten unverändert.
- **Pruning** entfernt alte Tool-Ergebnisse aus dem _In-Memory_-Prompt für einen Durchlauf, schreibt das Transkript aber nicht um.

Dokumentation: [Session](/de/concepts/session), [Compaction](/de/concepts/compaction), [Session-Pruning](/de/concepts/session-pruning).

Standardmäßig verwendet OpenClaw für die Zusammenstellung und
Compaction die integrierte `legacy`-Kontext-Engine. Wenn Sie ein Plugin
installieren, das `kind: "context-engine"` bereitstellt, und es mit
`plugins.slots.contextEngine` auswählen, delegiert OpenClaw die
Kontextzusammenstellung, `/compact` und zugehörige Kontext-Lifecycle-Hooks
für Subagents stattdessen an diese Engine. `ownsCompaction: false` führt
nicht automatisch zu einem Fallback auf die Legacy-Engine; die aktive Engine
muss `compact()` weiterhin korrekt implementieren. Siehe
[Context Engine](/de/concepts/context-engine) für die vollständige
steckbare Schnittstelle, Lifecycle-Hooks und Konfiguration.

## Was `/context` tatsächlich meldet

`/context` bevorzugt, wenn verfügbar, den neuesten Bericht zum **beim Durchlauf erstellten** System Prompt:

- `System prompt (run)` = aus dem letzten eingebetteten (tool-fähigen) Durchlauf übernommen und im Sitzungsspeicher persistiert.
- `System prompt (estimate)` = on-the-fly berechnet, wenn kein Durchlaufbericht existiert (oder wenn ein CLI-Backend verwendet wird, das den Bericht nicht erzeugt).

In beiden Fällen meldet es Größen und die größten Beiträge; es gibt **nicht** den vollständigen System Prompt oder die Tool-Schemas aus.

## Verwandt

- [Context Engine](/de/concepts/context-engine) — benutzerdefinierte Kontextinjektion über Plugins
- [Compaction](/de/concepts/compaction) — Zusammenfassen langer Unterhaltungen
- [System Prompt](/de/concepts/system-prompt) — wie der System Prompt erstellt wird
- [Agent Loop](/de/concepts/agent-loop) — der vollständige Ausführungszyklus des Agenten
