---
read_when:
    - Text des System-Prompts, Tool-Liste oder Abschnitte zu Zeit/Heartbeat bearbeiten
    - Verhalten beim Workspace-Bootstrap oder bei der Skills-Injektion ändern
summary: Was der OpenClaw-System-Prompt enthält und wie er zusammengesetzt wird
title: System-Prompt
x-i18n:
    generated_at: "2026-04-24T06:35:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: ff0498b99974f1a75fc9b93ca46cc0bf008ebf234b429c05ee689a4a150d29f1
    source_path: concepts/system-prompt.md
    workflow: 15
---

OpenClaw erstellt für jeden Agentenlauf einen benutzerdefinierten System-Prompt. Der Prompt wird **von OpenClaw verwaltet** und verwendet nicht den Standard-Prompt von pi-coding-agent.

Der Prompt wird von OpenClaw zusammengesetzt und in jeden Agentenlauf eingefügt.

Anbieter-Plugins können Cache-bewusste Prompt-Hinweise beitragen, ohne den
vollständigen, von OpenClaw verwalteten Prompt zu ersetzen. Die Anbieter-Runtime kann:

- eine kleine Menge benannter Kernabschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze einfügen
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze einfügen

Verwenden Sie anbieterbezogene Beiträge für modellfamilien-spezifisches Tuning. Behalten Sie die Legacy-
Prompt-Mutation `before_prompt_build` für Kompatibilität oder wirklich globale Prompt-
Änderungen bei, nicht für normales Anbieterverhalten.

Das Overlay der OpenAI-GPT-5-Familie hält die Kernregel für die Ausführung klein und fügt
modellspezifische Hinweise zu Persona-Verankerung, knapper Ausgabe, Tool-Disziplin,
paralleler Suche, Abdeckung von Ergebnissen, Verifikation, fehlendem Kontext und
sauberem Umgang mit Terminal-Tools hinzu.

## Struktur

Der Prompt ist absichtlich kompakt und verwendet feste Abschnitte:

- **Tooling**: Erinnerung an die strukturierten Tools als Source of Truth plus Laufzeithinweise zur Tool-Nutzung.
- **Execution Bias**: kompakte Anleitung zum Dranbleiben: bei umsetzbaren Anfragen im
  aktuellen Turn handeln, fortfahren bis zur Erledigung oder bis eine Blockade besteht, sich von schwachen Tool-
  Ergebnissen erholen, veränderbaren Zustand live prüfen und vor dem Abschließen verifizieren.
- **Safety**: kurze Guardrail-Erinnerung, machtsuchendes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie es Skill-Anweisungen bei Bedarf lädt.
- **OpenClaw Self-Update**: wie Konfiguration sicher mit
  `config.schema.lookup` geprüft, mit `config.patch` gepatcht, die vollständige
  Konfiguration mit `config.apply` ersetzt und `update.run` nur auf ausdrückliche Benutzeranfrage
  ausgeführt wird. Das nur für Eigentümer verfügbare Tool `gateway` verweigert auch das Umschreiben von
  `tools.exec.ask` / `tools.exec.security`, einschließlich Legacy-Aliasen `tools.bash.*`,
  die auf diese geschützten Exec-Pfade normalisiert werden.
- **Workspace**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Documentation**: lokaler Pfad zur OpenClaw-Dokumentation (Repo oder npm-Paket) und wann sie gelesen werden soll.
- **Workspace Files (injected)**: zeigt an, dass Bootstrap-Dateien unten eingefügt sind.
- **Sandbox** (wenn aktiviert): zeigt die sandboxierte Runtime, Sandbox-Pfade und ob erhöhter exec verfügbar ist.
- **Current Date & Time**: Benutzerlokalzeit, Zeitzone und Zeitformat.
- **Reply Tags**: optionale Reply-Tag-Syntax für unterstützte Anbieter.
- **Heartbeats**: Heartbeat-Prompt und Ack-Verhalten, wenn Heartbeats für den Standardagenten aktiviert sind.
- **Runtime**: Host, OS, Node, Modell, Repo-Root (wenn erkannt), Thinking-Level (eine Zeile).
- **Reasoning**: aktuelles Sichtbarkeitsniveau + Hinweis auf `/reasoning`-Umschaltung.

Der Abschnitt Tooling enthält auch Laufzeithinweise für lang laufende Arbeit:

- Cron für künftige Nachverfolgung verwenden (`später noch einmal prüfen`, Erinnerungen, wiederkehrende Arbeit)
  statt `exec`-sleep-Schleifen, `yieldMs`-Verzögerungstricks oder wiederholtem `process`-
  Polling
- `exec` / `process` nur für Befehle verwenden, die jetzt starten und im
  Hintergrund weiterlaufen
- wenn die automatische Completion-Aufweckung aktiviert ist, den Befehl einmal starten und sich auf
  den push-basierten Aufweckpfad verlassen, wenn er Ausgabe erzeugt oder fehlschlägt
- `process` für Logs, Status, Eingabe oder Eingriffe verwenden, wenn Sie einen laufenden Befehl
  prüfen müssen
- wenn die Aufgabe größer ist, `sessions_spawn` bevorzugen; die Fertigstellung von Unteragenten ist
  push-basiert und wird automatisch an den Anforderer zurückgemeldet
- `subagents list` / `sessions_list` nicht in einer Schleife pollen, nur um auf
  Fertigstellung zu warten

Wenn das experimentelle Tool `update_plan` aktiviert ist, weist Tooling das
Modell außerdem an, es nur für nicht triviale, mehrstufige Arbeit zu verwenden, genau einen
Schritt mit `in_progress` zu behalten und nicht nach jeder Aktualisierung den gesamten
Plan zu wiederholen.

Sicherheits-Guardrails im System-Prompt sind beratend. Sie lenken das Modellverhalten, setzen aber keine Richtlinie durch. Verwenden Sie Tool-Richtlinien, Exec-Genehmigungen, Sandboxing und Channel-Allowlists für harte Durchsetzung; Operatoren können diese absichtlich deaktivieren.

Auf Channels mit nativen Genehmigungskarten/-schaltflächen weist der Runtime-Prompt den
Agenten jetzt an, sich zuerst auf diese native Genehmigungs-UI zu verlassen. Er sollte nur dann einen manuellen
Befehl `/approve` einfügen, wenn das Tool-Ergebnis angibt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann für Unteragenten kleinere System-Prompts rendern. Die Runtime setzt für
jeden Lauf einen `promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle oben genannten Abschnitte.
- `minimal`: wird für Unteragenten verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** und **Heartbeats** weg. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (wenn bekannt), Runtime und eingefügter
  Kontext bleiben verfügbar.
- `none`: gibt nur die Basis-Identitätszeile zurück.

Wenn `promptMode=minimal` gilt, werden zusätzlich eingefügte Prompts als **Subagent
Context** statt als **Group Chat Context** bezeichnet.

## Workspace-Bootstrap-Injektion

Bootstrap-Dateien werden gekürzt und unter **Project Context** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne explizite Lesevorgänge zu benötigen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur in brandneuen Workspaces)
- `MEMORY.md`, wenn vorhanden

Alle diese Dateien werden in **jedem Turn in das Kontextfenster eingefügt**, sofern
keine dateispezifische Sperre gilt. `HEARTBEAT.md` wird bei normalen Läufen weggelassen, wenn
Heartbeats für den Standardagenten deaktiviert sind oder
`agents.defaults.heartbeat.includeSystemPromptSection` false ist. Halten Sie eingefügte
Dateien knapp — besonders `MEMORY.md`, das mit der Zeit wachsen und zu
unerwartet hoher Kontextnutzung und häufigerer Compaction führen kann.

> **Hinweis:** tägliche Dateien in `memory/*.md` sind **kein** Teil des normalen Bootstrap-
> Project Context. In gewöhnlichen Turns wird auf sie bei Bedarf über die
> Tools `memory_search` und `memory_get` zugegriffen, sodass sie nicht gegen das
> Kontextfenster zählen, sofern das Modell sie nicht ausdrücklich liest. Reine `/new`- und
> `/reset`-Turns sind die Ausnahme: Die Runtime kann aktuellen täglichen Memory-
> Inhalt als einmaligen Startup-Kontextblock für diesen ersten Turn voranstellen.

Große Dateien werden mit einer Markierung gekürzt. Die maximale Größe pro Datei wird über
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 12000). Der insgesamt eingefügte Bootstrap-
Inhalt über alle Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars`
begrenzt (Standard: 60000). Fehlende Dateien fügen eine kurze Markierung für fehlende Dateien ein. Wenn eine Kürzung
erfolgt, kann OpenClaw einen Warnblock in Project Context einfügen; steuern Sie dies mit
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
Standard: `once`).

Unteragenten-Sitzungen fügen nur `AGENTS.md` und `TOOLS.md` ein (andere Bootstrap-Dateien
werden herausgefiltert, um den Unteragenten-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um
die eingefügten Bootstrap-Dateien zu verändern oder zu ersetzen (zum Beispiel `SOUL.md` gegen eine alternative Persona auszutauschen).

Wenn Sie möchten, dass der Agent weniger generisch klingt, beginnen Sie mit dem
[SOUL.md Personality Guide](/de/concepts/soul).

Um zu prüfen, wie viel jede eingefügte Datei beiträgt (roh vs. eingefügt, Kürzung, plus Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## Zeitbehandlung

Der System-Prompt enthält einen eigenen Abschnitt **Current Date & Time**, wenn die
Zeitzone des Benutzers bekannt ist. Um den Prompt cache-stabil zu halten, enthält er jetzt nur noch die
**Zeitzone** (keine dynamische Uhrzeit und kein Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Zeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional auch eine modellbezogene Überschreibung pro Sitzung setzen
(`model=default` löscht sie).

Konfiguration mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Siehe [Date & Time](/de/date-time) für vollständige Verhaltensdetails.

## Skills

Wenn passende Skills vorhanden sind, fügt OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`) ein, die für jeden Skill den **Dateipfad** enthält. Der
Prompt weist das Modell an, mit `read` die SKILL.md am angegebenen
Ort zu laden (Workspace, verwaltet oder gebündelt). Wenn keine passenden Skills vorhanden sind, wird der
Abschnitt Skills weggelassen.

Die Eignung umfasst Skill-Metadaten-Gates, Laufzeitumgebungs-/Konfigurationsprüfungen
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

So bleibt der Basis-Prompt klein und ermöglicht dennoch gezielte Skill-Nutzung.

Das Budget für die Skills-Liste gehört dem Skills-Subsystem:

- Globaler Standard: `skills.limits.maxSkillsPromptChars`
- Überschreibung pro Agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generische begrenzte Laufzeitauszüge verwenden eine andere Oberfläche:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Diese Trennung hält die Größensteuerung von Skills getrennt von der Größensteuerung für Laufzeit-Lese-/Injektionsvorgänge wie
`memory_get`, Live-Tool-Ergebnisse und Aktualisierungen von AGENTS.md nach der Compaction.

## Documentation

Wenn verfügbar, enthält der System-Prompt einen Abschnitt **Documentation**, der auf das
lokale OpenClaw-Dokumentationsverzeichnis verweist (entweder `docs/` im Repo-Workspace oder die gebündelte npm-
Paketdokumentation) und außerdem den öffentlichen Mirror, das Source-Repo, die Community Discord und
ClawHub ([https://clawhub.ai](https://clawhub.ai)) zur Skills-Erkennung erwähnt. Der Prompt weist das Modell an, zuerst die lokale Dokumentation
für OpenClaw-Verhalten, Befehle, Konfiguration oder Architektur zu konsultieren und
`openclaw status` nach Möglichkeit selbst auszuführen (den Benutzer nur dann zu fragen, wenn ihm der Zugriff fehlt).

## Verwandt

- [Agent runtime](/de/concepts/agent)
- [Agent workspace](/de/concepts/agent-workspace)
- [Context engine](/de/concepts/context-engine)
