---
read_when:
    - Sie möchten verstehen, was „Kontext“ in OpenClaw bedeutet
    - Sie debuggen, warum das Modell etwas „weiß“ (oder es vergessen hat)
    - Sie möchten den Kontext-Overhead verringern (`/context`, `/status`, `/compact`)
summary: 'Kontext: was das Modell sieht, wie er aufgebaut ist und wie man ihn untersucht'
title: Kontext
x-i18n:
    generated_at: "2026-04-07T06:13:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: a75b4cd65bf6385d46265b9ce1643310bc99d220e35ec4b4924096bed3ca4aa0
    source_path: concepts/context.md
    workflow: 15
---

# Kontext

„Kontext“ ist **alles, was OpenClaw bei einem Lauf an das Modell sendet**. Er ist durch das **Kontextfenster** des Modells (Token-Limit) begrenzt.

Ein einfaches mentales Modell für Einsteiger:

- **System-Prompt** (von OpenClaw erstellt): Regeln, Tools, Skills-Liste, Zeit/Laufzeit und injizierte Workspace-Dateien.
- **Gesprächsverlauf**: Ihre Nachrichten + die Nachrichten des Assistenten für diese Sitzung.
- **Tool-Aufrufe/-Ergebnisse + Anhänge**: Befehlsausgabe, Dateilesungen, Bilder/Audio usw.

Kontext ist _nicht dasselbe_ wie „Speicher“: Speicher kann auf der Festplatte gespeichert und später erneut geladen werden; Kontext ist das, was sich im aktuellen Fenster des Modells befindet.

## Schnellstart (Kontext untersuchen)

- `/status` → schnelle Ansicht „wie voll ist mein Fenster?“ + Sitzungseinstellungen.
- `/context list` → was injiziert wird + ungefähre Größen (pro Datei + Summen).
- `/context detail` → detailliertere Aufschlüsselung: pro Datei, Größen pro Tool-Schema, Größen pro Skill-Eintrag und Größe des System-Prompts.
- `/usage tokens` → hängt an normale Antworten eine Nutzungs-Fußzeile pro Antwort an.
- `/compact` → fasst älteren Verlauf zu einem kompakten Eintrag zusammen, um Fensterplatz freizugeben.

Siehe auch: [Slash-Befehle](/de/tools/slash-commands), [Token-Nutzung und Kosten](/de/reference/token-use), [Kompaktierung](/de/concepts/compaction).

## Beispielausgabe

Die Werte variieren je nach Modell, Provider, Tool-Richtlinie und dem Inhalt Ihres Workspace.

### `/context list`

```
🧠 Aufschlüsselung des Kontexts
Workspace: <workspaceDir>
Bootstrap-Maximum/Datei: 20.000 Zeichen
Sandbox: mode=non-main sandboxed=false
System-Prompt (Lauf): 38.412 Zeichen (~9.603 Token) (Project Context 23.901 Zeichen (~5.976 Token))

Injizierte Workspace-Dateien:
- AGENTS.md: OK | roh 1.742 Zeichen (~436 Token) | injiziert 1.742 Zeichen (~436 Token)
- SOUL.md: OK | roh 912 Zeichen (~228 Token) | injiziert 912 Zeichen (~228 Token)
- TOOLS.md: GEKÜRZT | roh 54.210 Zeichen (~13.553 Token) | injiziert 20.962 Zeichen (~5.241 Token)
- IDENTITY.md: OK | roh 211 Zeichen (~53 Token) | injiziert 211 Zeichen (~53 Token)
- USER.md: OK | roh 388 Zeichen (~97 Token) | injiziert 388 Zeichen (~97 Token)
- HEARTBEAT.md: FEHLT | roh 0 | injiziert 0
- BOOTSTRAP.md: OK | roh 0 Zeichen (~0 Token) | injiziert 0 Zeichen (~0 Token)

Skills-Liste (Text im System-Prompt): 2.184 Zeichen (~546 Token) (12 Skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool-Liste (Text im System-Prompt): 1.032 Zeichen (~258 Token)
Tool-Schemas (JSON): 31.988 Zeichen (~7.997 Token) (zählt zum Kontext; wird nicht als Text angezeigt)
Tools: (wie oben)

Sitzungs-Token (zwischengespeichert): 14.250 gesamt / ctx=32.000
```

### `/context detail`

```
🧠 Aufschlüsselung des Kontexts (detailliert)
…
Größte Skills (Größe des Prompt-Eintrags):
- frontend-design: 412 Zeichen (~103 Token)
- oracle: 401 Zeichen (~101 Token)
… (+10 weitere Skills)

Größte Tools (Schema-Größe):
- browser: 9.812 Zeichen (~2.453 Token)
- exec: 6.240 Zeichen (~1.560 Token)
… (+N weitere Tools)
```

## Was auf das Kontextfenster angerechnet wird

Alles, was das Modell erhält, wird angerechnet, darunter:

- System-Prompt (alle Abschnitte).
- Gesprächsverlauf.
- Tool-Aufrufe + Tool-Ergebnisse.
- Anhänge/Transkripte (Bilder/Audio/Dateien).
- Kompaktierungszusammenfassungen und Pruning-Artefakte.
- „Wrapper“ oder versteckte Header des Providers (nicht sichtbar, werden trotzdem angerechnet).

## Wie OpenClaw den System-Prompt erstellt

Der System-Prompt liegt **in der Verantwortung von OpenClaw** und wird bei jedem Lauf neu erstellt. Er enthält:

- Tool-Liste + kurze Beschreibungen.
- Skills-Liste (nur Metadaten; siehe unten).
- Workspace-Speicherort.
- Zeit (UTC + umgerechnete Benutzerzeit, falls konfiguriert).
- Laufzeitmetadaten (Host/OS/Modell/Thinking).
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

Große Dateien werden pro Datei anhand von `agents.defaults.bootstrapMaxChars` (Standard: `20000` Zeichen) gekürzt. OpenClaw erzwingt außerdem eine Gesamtobergrenze für alle Bootstrap-Injektionen über Dateien hinweg mit `agents.defaults.bootstrapTotalMaxChars` (Standard: `150000` Zeichen). `/context` zeigt **roh vs. injiziert** sowie an, ob eine Kürzung stattgefunden hat.

Wenn eine Kürzung erfolgt, kann die Laufzeit im Prompt einen Warnblock unter Project Context injizieren. Konfigurieren Sie dies mit `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; Standard: `once`).

## Skills: injiziert vs. bei Bedarf geladen

Der System-Prompt enthält eine kompakte **Skills-Liste** (Name + Beschreibung + Speicherort). Diese Liste verursacht echten Overhead.

Skill-Anweisungen sind standardmäßig _nicht_ enthalten. Vom Modell wird erwartet, dass es die `SKILL.md` eines Skills **nur bei Bedarf** mit `read` liest.

## Tools: Es gibt zwei Kostenarten

Tools beeinflussen den Kontext auf zwei Arten:

1. **Tool-Listentext** im System-Prompt (das, was Sie als „Tooling“ sehen).
2. **Tool-Schemas** (JSON). Diese werden an das Modell gesendet, damit es Tools aufrufen kann. Sie zählen zum Kontext, auch wenn Sie sie nicht als Klartext sehen.

`/context detail` schlüsselt die größten Tool-Schemas auf, damit Sie sehen können, was den größten Anteil ausmacht.

## Befehle, Direktiven und „Inline-Kurzbefehle“

Slash-Befehle werden vom Gateway verarbeitet. Es gibt einige unterschiedliche Verhaltensweisen:

- **Eigenständige Befehle**: Eine Nachricht, die nur aus `/...` besteht, wird als Befehl ausgeführt.
- **Direktiven**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` werden entfernt, bevor das Modell die Nachricht sieht.
  - Nachrichten, die nur Direktiven enthalten, speichern Sitzungseinstellungen dauerhaft.
  - Inline-Direktiven in einer normalen Nachricht wirken als Hinweise pro Nachricht.
- **Inline-Kurzbefehle** (nur für Sender auf der Allowlist): Bestimmte `/...`-Token innerhalb einer normalen Nachricht können sofort ausgeführt werden (Beispiel: „hey /status“) und werden entfernt, bevor das Modell den restlichen Text sieht.

Details: [Slash-Befehle](/de/tools/slash-commands).

## Sitzungen, Kompaktierung und Pruning (was erhalten bleibt)

Was über Nachrichten hinweg erhalten bleibt, hängt vom Mechanismus ab:

- **Normaler Verlauf** bleibt im Sitzungsprotokoll erhalten, bis er durch Richtlinien kompaktisiert/geprunt wird.
- **Kompaktierung** speichert eine Zusammenfassung im Protokoll und behält aktuelle Nachrichten intakt.
- **Pruning** entfernt alte Tool-Ergebnisse aus dem _In-Memory_-Prompt für einen Lauf, schreibt das Protokoll aber nicht um.

Dokumentation: [Sitzung](/de/concepts/session), [Kompaktierung](/de/concepts/compaction), [Session-Pruning](/de/concepts/session-pruning).

Standardmäßig verwendet OpenClaw die integrierte `legacy`-Kontext-Engine für Assemblierung und
Kompaktierung. Wenn Sie ein Plugin installieren, das `kind: "context-engine"` bereitstellt, und
es mit `plugins.slots.contextEngine` auswählen, delegiert OpenClaw die Kontext-
Assemblierung, `/compact` und zugehörige Lifecycle-Hooks für den Subagenten-Kontext an diese
Engine. `ownsCompaction: false` führt nicht automatisch zu einem Fallback auf die Legacy-
Engine; die aktive Engine muss `compact()` weiterhin korrekt implementieren. Siehe
[Context Engine](/de/concepts/context-engine) für die vollständige
pluggbare Schnittstelle, Lifecycle-Hooks und Konfiguration.

## Was `/context` tatsächlich meldet

`/context` bevorzugt, falls verfügbar, den neuesten **zur Laufzeit erstellten** System-Prompt-Bericht:

- `System prompt (run)` = aus dem letzten eingebetteten Lauf (mit Tool-Unterstützung) erfasst und im Sitzungsspeicher persistent gespeichert.
- `System prompt (estimate)` = bei Bedarf berechnet, wenn kein Laufbericht vorhanden ist (oder wenn über ein CLI-Backend ausgeführt wird, das keinen Bericht erzeugt).

In beiden Fällen meldet es Größen und die größten Beiträge; es gibt **nicht** den vollständigen System-Prompt oder Tool-Schemas aus.

## Verwandt

- [Context Engine](/de/concepts/context-engine) — benutzerdefinierte Kontext-Injektion über Plugins
- [Kompaktierung](/de/concepts/compaction) — Zusammenfassen langer Unterhaltungen
- [System-Prompt](/de/concepts/system-prompt) — wie der System-Prompt aufgebaut wird
- [Agent Loop](/de/concepts/agent-loop) — der vollständige Ausführungszyklus des Agenten
