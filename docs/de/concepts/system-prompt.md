---
read_when:
    - System-Prompt-Text, Tool-Liste oder Zeit-/Heartbeat-Abschnitte bearbeiten
    - Verhalten für Workspace-Bootstrap oder Skills-Injektion ändern
summary: Was der OpenClaw-System-Prompt enthält und wie er zusammengesetzt wird
title: System-Prompt
x-i18n:
    generated_at: "2026-04-21T06:24:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc7b887865830e29bcbfb7f88a12fe04f490eec64cb745fc4534051b63a862dc
    source_path: concepts/system-prompt.md
    workflow: 15
---

# System-Prompt

OpenClaw erstellt für jeden Agent-Lauf einen benutzerdefinierten System-Prompt. Der Prompt wird **von OpenClaw verwaltet** und verwendet nicht den Standard-Prompt von pi-coding-agent.

Der Prompt wird von OpenClaw zusammengesetzt und in jeden Agent-Lauf eingefügt.

Provider-Plugins können cache-fähige Prompt-Hinweise beisteuern, ohne den
vollständigen von OpenClaw verwalteten Prompt zu ersetzen. Die Provider-Runtime kann:

- eine kleine Menge benannter Core-Abschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze einfügen
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze einfügen

Verwenden Sie provider-eigene Beiträge für modellspezifische Feinabstimmung je
Modellfamilie. Behalten Sie die Legacy-Prompt-Mutation `before_prompt_build` für
Kompatibilität oder wirklich globale Prompt-Änderungen bei, nicht für normales
Provider-Verhalten.

Das Overlay für die OpenAI-GPT-5-Familie hält die Core-Ausführungsregel klein und
ergänzt modellspezifische Hinweise für Persona-Fixierung, knappe Ausgaben,
Tool-Disziplin, parallele Abfragen, Abdeckung von Ergebnissen, Verifizierung,
fehlenden Kontext und Hygiene bei Terminal-Tools.

## Struktur

Der Prompt ist bewusst kompakt und verwendet feste Abschnitte:

- **Tooling**: strukturierte Erinnerung an die Single Source of Truth für Tools plus Runtime-Hinweise zur Tool-Nutzung.
- **Execution Bias**: kompakte Hinweise zum Dranbleiben: bei umsetzbaren Anfragen
  im aktuellen Zug handeln, weitermachen bis abgeschlossen oder blockiert, sich von schwachen Tool-Ergebnissen erholen,
  veränderlichen Zustand live prüfen und vor dem Abschluss verifizieren.
- **Safety**: kurze Guardrail-Erinnerung, um machtsuchendes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie Skill-Anweisungen bei Bedarf geladen werden.
- **OpenClaw Self-Update**: wie Konfiguration sicher mit
  `config.schema.lookup` geprüft, Konfiguration mit `config.patch` gepatcht, die vollständige
  Konfiguration mit `config.apply` ersetzt und `update.run` nur auf ausdrückliche Benutzeranfrage ausgeführt wird.
  Das nur für Owner verfügbare Tool `gateway` verweigert außerdem das Umschreiben von
  `tools.exec.ask` / `tools.exec.security`, einschließlich der Legacy-Aliasse `tools.bash.*`,
  die auf diese geschützten Exec-Pfade normalisiert werden.
- **Workspace**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Documentation**: lokaler Pfad zur OpenClaw-Dokumentation (Repo oder npm-Paket) und wann sie gelesen werden soll.
- **Workspace Files (injected)**: weist darauf hin, dass Bootstrap-Dateien unten eingefügt sind.
- **Sandbox** (wenn aktiviert): weist auf die sandboxierte Runtime, Sandbox-Pfade und darauf hin, ob erhöhte Exec-Rechte verfügbar sind.
- **Current Date & Time**: benutzerlokale Zeit, Zeitzone und Zeitformat.
- **Reply Tags**: optionale Reply-Tag-Syntax für unterstützte Provider.
- **Heartbeats**: Heartbeat-Prompt- und Ack-Verhalten, wenn Heartbeats für den Standard-Agent aktiviert sind.
- **Runtime**: Host, OS, Node, Modell, Repo-Root (wenn erkannt), Thinking-Level (eine Zeile).
- **Reasoning**: aktuelles Sichtbarkeitsniveau + Hinweis auf `/reasoning` zum Umschalten.

Der Abschnitt Tooling enthält außerdem Runtime-Hinweise für langlaufende Arbeit:

- Cron für zukünftige Nachverfolgung verwenden (`check back later`, Erinnerungen, wiederkehrende Arbeit)
  statt `exec`-Sleep-Schleifen, `yieldMs`-Delay-Tricks oder wiederholtem `process`-Polling
- `exec` / `process` nur für Befehle verwenden, die jetzt starten und im Hintergrund weiterlaufen
- wenn automatisches Aufwecken bei Abschluss aktiviert ist, den Befehl einmal starten und sich
  auf den Push-basierten Wake-Pfad verlassen, wenn er Ausgabe erzeugt oder fehlschlägt
- `process` für Logs, Status, Eingaben oder Eingriffe verwenden, wenn Sie einen laufenden Befehl prüfen müssen
- wenn die Aufgabe größer ist, `sessions_spawn` bevorzugen; der Abschluss von Subagenten ist Push-basiert und
  wird automatisch an den Anfordernden zurückgemeldet
- `subagents list` / `sessions_list` nicht in einer Schleife pollen, nur um auf
  den Abschluss zu warten

Wenn das experimentelle Tool `update_plan` aktiviert ist, weist Tooling das
Modell außerdem an, es nur für nicht triviale mehrstufige Arbeit zu verwenden,
genau einen Schritt mit `in_progress` zu halten und nicht nach jeder Aktualisierung den
gesamten Plan zu wiederholen.

Safety-Guardrails im System-Prompt sind beratend. Sie leiten das Modellverhalten, setzen jedoch keine Richtlinie durch. Verwenden Sie Tool-Richtlinien, Exec-Genehmigungen, Sandboxing und Channel-Allowlists für harte Durchsetzung; Betreiber können diese bewusst deaktivieren.

In Channels mit nativen Genehmigungskarten/-buttons weist der Runtime-Prompt den
Agenten nun an, sich zuerst auf diese native Genehmigungs-UI zu verlassen. Er soll
einen manuellen Befehl `/approve` nur dann einfügen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann kleinere System-Prompts für Subagenten rendern. Die Runtime setzt
für jeden Lauf einen `promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle obigen Abschnitte.
- `minimal`: wird für Subagenten verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** und **Heartbeats** weg. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (wenn bekannt), Runtime und eingefügter
  Kontext bleiben verfügbar.
- `none`: gibt nur die Basis-Identitätszeile zurück.

Wenn `promptMode=minimal`, werden zusätzlich eingefügte Prompts als **Subagent
Context** statt **Group Chat Context** bezeichnet.

## Workspace-Bootstrap-Injektion

Bootstrap-Dateien werden gekürzt und unter **Project Context** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne explizite Lesevorgänge zu benötigen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur in brandneuen Workspaces)
- `MEMORY.md`, wenn vorhanden, sonst `memory.md` als Fallback in Kleinbuchstaben

Alle diese Dateien werden **bei jedem Zug in das Kontextfenster eingefügt**,
sofern kein dateispezifisches Gate gilt. `HEARTBEAT.md` wird bei normalen Läufen
weggelassen, wenn Heartbeats für den Standard-Agent deaktiviert sind oder
`agents.defaults.heartbeat.includeSystemPromptSection` false ist. Halten Sie eingefügte
Dateien knapp — insbesondere `MEMORY.md`, das mit der Zeit wachsen und zu
unerwartet hoher Kontextnutzung und häufigerer Compaction führen kann.

> **Hinweis:** tägliche Dateien `memory/*.md` sind **nicht** Teil des normalen Bootstrap-
> Project Context. Bei gewöhnlichen Zügen wird auf sie bei Bedarf über die
> Tools `memory_search` und `memory_get` zugegriffen, sodass sie nicht gegen das
> Kontextfenster zählen, es sei denn, das Modell liest sie ausdrücklich. Reine `/new`- und
> `/reset`-Züge sind die Ausnahme: Die Runtime kann aktuelle tägliche Memory-Dateien
> als einmaligen Startup-Kontextblock für diesen ersten Zug voranstellen.

Große Dateien werden mit einem Marker gekürzt. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 12000). Der insgesamt eingefügte Bootstrap-
Inhalt über alle Dateien hinweg wird durch `agents.defaults.bootstrapTotalMaxChars`
begrenzt (Standard: 60000). Fehlende Dateien fügen einen kurzen Marker für fehlende Dateien ein. Wenn Kürzung
auftritt, kann OpenClaw einen Warnblock in Project Context einfügen; das wird über
`agents.defaults.bootstrapPromptTruncationWarning` gesteuert (`off`, `once`, `always`;
Standard: `once`).

Subagent-Sitzungen fügen nur `AGENTS.md` und `TOOLS.md` ein (andere Bootstrap-Dateien
werden herausgefiltert, um den Subagent-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um
die eingefügten Bootstrap-Dateien zu ändern oder zu ersetzen (zum Beispiel `SOUL.md`
durch eine alternative Persona zu ersetzen).

Wenn Sie möchten, dass der Agent weniger generisch klingt, beginnen Sie mit dem
[SOUL.md Personality Guide](/de/concepts/soul).

Um zu prüfen, wie viel jede eingefügte Datei beiträgt (roh vs. eingefügt, Kürzung, plus Overhead des Tool-Schemas), verwenden Sie `/context list` oder `/context detail`. Siehe [Context](/de/concepts/context).

## Zeitbehandlung

Der System-Prompt enthält einen eigenen Abschnitt **Current Date & Time**, wenn die
Benutzerzeitzone bekannt ist. Um den Prompt Cache-stabil zu halten, enthält er jetzt nur noch
die **Zeitzone** (keine dynamische Uhrzeit und kein Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional auch eine Modellüberschreibung
pro Sitzung setzen (`model=default` entfernt sie).

Konfiguration über:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Siehe [Date & Time](/de/date-time) für vollständige Verhaltensdetails.

## Skills

Wenn geeignete Skills existieren, fügt OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`) ein, die den **Dateipfad** für jeden Skill enthält. Der
Prompt weist das Modell an, `read` zu verwenden, um die SKILL.md am aufgeführten
Ort zu laden (Workspace, verwaltet oder gebündelt). Wenn keine geeigneten Skills vorhanden sind, wird der
Abschnitt Skills weggelassen.

Zur Eignung gehören Skill-Metadaten-Gates, Prüfungen der Runtime-Umgebung/-Konfiguration
und die effektive Skill-Allowlist des Agenten, wenn `agents.defaults.skills` oder
`agents.list[].skills` konfiguriert ist.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Dadurch bleibt der Basis-Prompt klein und ermöglicht dennoch eine gezielte Nutzung von Skills.

Das Budget für die Skills-Liste gehört dem Skills-Subsystem:

- Globaler Standard: `skills.limits.maxSkillsPromptChars`
- Pro-Agent-Überschreibung: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generische begrenzte Runtime-Auszüge verwenden eine andere Oberfläche:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Diese Trennung hält die Größe von Skills getrennt von der Größensteuerung für Runtime-Lese-/Injektionsvorgänge wie
`memory_get`, Live-Tool-Ergebnisse und AGENTS.md-Aktualisierungen nach Compaction.

## Dokumentation

Wenn verfügbar, enthält der System-Prompt einen Abschnitt **Documentation**, der auf das
lokale OpenClaw-Dokumentationsverzeichnis verweist (entweder `docs/` im Repo-Workspace oder die gebündelte npm-
Paket-Dokumentation) und außerdem den öffentlichen Mirror, das Source-Repo, die Community-Discord und
ClawHub ([https://clawhub.ai](https://clawhub.ai)) für die Entdeckung von Skills nennt. Der Prompt weist das Modell an, zuerst die lokalen Dokumente zu konsultieren
für OpenClaw-Verhalten, Befehle, Konfiguration oder Architektur und
wenn möglich `openclaw status` selbst auszuführen (den Benutzer nur zu fragen, wenn kein Zugriff besteht).
