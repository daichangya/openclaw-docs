---
read_when:
    - Bearbeiten von Systemaufforderungstext, Werkzeugliste oder Zeit-/Heartbeat-Abschnitten
    - Ändern des Workspace-Bootstraps oder des Verhaltens bei der Skills-Injektion
summary: Was die OpenClaw-Systemaufforderung enthält und wie sie zusammengestellt wird
title: Systemaufforderung
x-i18n:
    generated_at: "2026-04-15T19:41:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: c740e4646bc4980567338237bfb55126af0df72499ca00a48e4848d9a3608ab4
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Systemaufforderung

OpenClaw erstellt für jeden Agentenlauf eine benutzerdefinierte Systemaufforderung. Die Aufforderung wird **von OpenClaw verwaltet** und verwendet nicht die Standardaufforderung von pi-coding-agent.

Die Aufforderung wird von OpenClaw zusammengestellt und in jeden Agentenlauf eingefügt.

Provider-Plugins können cache-fähige Prompt-Hinweise beisteuern, ohne die
vollständige von OpenClaw verwaltete Aufforderung zu ersetzen. Die Provider-Laufzeit kann:

- eine kleine Menge benannter Kernabschnitte ersetzen (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- ein **stabiles Präfix** oberhalb der Prompt-Cache-Grenze einfügen
- ein **dynamisches Suffix** unterhalb der Prompt-Cache-Grenze einfügen

Verwenden Sie provider-eigene Beiträge für modellfamilien-spezifische Abstimmung. Behalten Sie die veraltete
`before_prompt_build`-Prompt-Mutation für Kompatibilität oder wirklich globale Prompt-Änderungen bei,
nicht für normales Provider-Verhalten.

## Struktur

Die Aufforderung ist bewusst kompakt und verwendet feste Abschnitte:

- **Tooling**: Erinnerung an die Quelle der Wahrheit für strukturierte Tools plus Laufzeithinweise zur Tool-Nutzung.
- **Safety**: kurze Guardrail-Erinnerung, um machtsuchendes Verhalten oder die Umgehung von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie es Skill-Anweisungen bei Bedarf lädt.
- **OpenClaw Self-Update**: wie Konfiguration sicher mit
  `config.schema.lookup` geprüft, Konfiguration mit `config.patch` gepatcht, die vollständige
  Konfiguration mit `config.apply` ersetzt und `update.run` nur auf ausdrückliche
  Benutzeranfrage ausgeführt wird. Das ausschließlich für Eigentümer verfügbare `gateway`-Tool verweigert auch das Umschreiben von
  `tools.exec.ask` / `tools.exec.security`, einschließlich veralteter `tools.bash.*`-
  Aliasse, die zu diesen geschützten Exec-Pfaden normalisiert werden.
- **Workspace**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Documentation**: lokaler Pfad zur OpenClaw-Dokumentation (Repository oder npm-Paket) und wann sie gelesen werden sollte.
- **Workspace Files (injected)**: zeigt an, dass Bootstrap-Dateien unten eingefügt sind.
- **Sandbox** (wenn aktiviert): zeigt die sandboxed Laufzeit, Sandbox-Pfade und ob erhöhte Exec-Rechte verfügbar sind.
- **Current Date & Time**: benutzerlokale Zeit, Zeitzone und Zeitformat.
- **Reply Tags**: optionale Reply-Tag-Syntax für unterstützte Provider.
- **Heartbeats**: Heartbeat-Aufforderung und Bestätigungsverhalten, wenn Heartbeats für den Standardagenten aktiviert sind.
- **Runtime**: Host, Betriebssystem, Node, Modell, Repository-Wurzel (wenn erkannt), Denkstufe (eine Zeile).
- **Reasoning**: aktuelle Sichtbarkeitsstufe + Hinweis auf Umschaltung mit /reasoning.

Der Abschnitt Tooling enthält außerdem Laufzeithinweise für lang laufende Arbeit:

- verwenden Sie Cron für spätere Nachverfolgung (`check back later`, Erinnerungen, wiederkehrende Arbeit)
  statt `exec`-Sleep-Schleifen, `yieldMs`-Verzögerungstricks oder wiederholtem `process`-
  Polling
- verwenden Sie `exec` / `process` nur für Befehle, die jetzt starten und im
  Hintergrund weiterlaufen
- wenn automatisches Abschluss-Aufwecken aktiviert ist, starten Sie den Befehl einmal und verlassen Sie sich auf
  den push-basierten Aufweckpfad, wenn er Ausgabe erzeugt oder fehlschlägt
- verwenden Sie `process` für Protokolle, Status, Eingaben oder Eingriffe, wenn Sie
  einen laufenden Befehl prüfen müssen
- wenn die Aufgabe größer ist, bevorzugen Sie `sessions_spawn`; der Abschluss von Sub-Agenten ist
  push-basiert und wird automatisch an den Anfragenden zurückgemeldet
- pollen Sie `subagents list` / `sessions_list` nicht in einer Schleife, nur um auf
  den Abschluss zu warten

Wenn das experimentelle Tool `update_plan` aktiviert ist, weist Tooling das
Modell außerdem an, es nur für nicht triviale mehrstufige Arbeit zu verwenden, genau einen
Schritt mit `in_progress` beizubehalten und nicht nach jeder Aktualisierung den gesamten Plan zu wiederholen.

Safety-Guardrails in der Systemaufforderung sind hinweisend. Sie leiten das Modellverhalten an, erzwingen aber keine Richtlinie. Verwenden Sie Tool-Richtlinien, Exec-Genehmigungen, Sandboxing und Kanal-Allowlists für harte Durchsetzung; Betreiber können diese absichtlich deaktivieren.

Auf Kanälen mit nativen Genehmigungskarten/-schaltflächen weist die Laufzeitaufforderung den
Agenten jetzt an, sich zuerst auf diese native Genehmigungs-UI zu verlassen. Sie sollte nur einen manuellen
`/approve`-Befehl enthalten, wenn das Tool-Ergebnis angibt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann kleinere Systemaufforderungen für Sub-Agenten rendern. Die Laufzeit setzt für jeden Lauf einen
`promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle obigen Abschnitte.
- `minimal`: wird für Sub-Agenten verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** und **Heartbeats** weg. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (wenn bekannt), Runtime und eingefügter
  Kontext bleiben verfügbar.
- `none`: gibt nur die Zeile mit der Basisidentität zurück.

Wenn `promptMode=minimal`, werden zusätzlich eingefügte Prompts als **Subagent
Context** statt als **Group Chat Context** beschriftet.

## Workspace-Bootstrap-Injektion

Bootstrap-Dateien werden gekürzt und unter **Project Context** angehängt, damit das Modell Identitäts- und Profilkontext sieht, ohne sie explizit lesen zu müssen:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur in brandneuen Workspaces)
- `MEMORY.md`, wenn vorhanden, andernfalls `memory.md` als Fallback in Kleinbuchstaben

Alle diese Dateien werden bei jeder Runde **in das Kontextfenster eingefügt**, sofern
keine dateispezifische Sperre gilt. `HEARTBEAT.md` wird bei normalen Läufen weggelassen, wenn
Heartbeats für den Standardagenten deaktiviert sind oder
`agents.defaults.heartbeat.includeSystemPromptSection` false ist. Halten Sie eingefügte
Dateien kurz — insbesondere `MEMORY.md`, das mit der Zeit wachsen und zu
unerwartet hoher Kontextnutzung und häufigerer Compaction führen kann.

> **Hinweis:** Tägliche Dateien in `memory/*.md` sind **nicht** Teil des normalen Bootstrap-
> Project Context. Bei gewöhnlichen Runden werden sie bei Bedarf über die
> Tools `memory_search` und `memory_get` abgerufen, sodass sie nicht gegen das
> Kontextfenster zählen, es sei denn, das Modell liest sie ausdrücklich. Reine `/new`- und
> `/reset`-Runden sind die Ausnahme: Die Laufzeit kann aktuelle tägliche Speicherinhalte
> als einmaligen Startup-Kontextblock für diese erste Runde voranstellen.

Große Dateien werden mit einer Markierung gekürzt. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` gesteuert (Standard: 20000). Der insgesamt eingefügte Bootstrap-
Inhalt über alle Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars`
begrenzt (Standard: 150000). Fehlende Dateien fügen eine kurze Markierung für fehlende Dateien ein. Wenn eine Kürzung
auftritt, kann OpenClaw einen Warnblock in Project Context einfügen; dies wird gesteuert durch
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
Standard: `once`).

Sub-Agenten-Sitzungen fügen nur `AGENTS.md` und `TOOLS.md` ein (andere Bootstrap-Dateien
werden herausgefiltert, um den Sub-Agenten-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um
die eingefügten Bootstrap-Dateien zu verändern oder zu ersetzen (zum Beispiel `SOUL.md` gegen eine alternative Persona auszutauschen).

Wenn Sie möchten, dass der Agent weniger generisch klingt, beginnen Sie mit dem
[SOUL.md Personality Guide](/de/concepts/soul).

Um zu prüfen, wie viel jede eingefügte Datei beiträgt (roh vs. eingefügt, Kürzung, plus Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Context](/de/concepts/context).

## Zeitbehandlung

Die Systemaufforderung enthält einen eigenen Abschnitt **Current Date & Time**, wenn die
Benutzerzeitzone bekannt ist. Um den Prompt cache-stabil zu halten, enthält sie jetzt nur noch die
**Zeitzone** (keine dynamische Uhrzeit oder Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Uhrzeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional eine Modellüberschreibung pro Sitzung
setzen (`model=default` löscht sie).

Konfiguration mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Siehe [Date & Time](/de/date-time) für vollständige Verhaltensdetails.

## Skills

Wenn infrage kommende Skills vorhanden sind, fügt OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`) ein, die für jeden Skill den **Dateipfad** enthält. Die
Aufforderung weist das Modell an, `read` zu verwenden, um die SKILL.md am angegebenen
Ort zu laden (Workspace, verwaltet oder gebündelt). Wenn keine infrage kommenden Skills vorhanden sind, wird der
Skills-Abschnitt weggelassen.

Die Eignung umfasst Skill-Metadaten-Sperren, Laufzeitumgebungs-/Konfigurationsprüfungen
und die effektive Agenten-Skill-Allowlist, wenn `agents.defaults.skills` oder
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

Dadurch bleibt die Basisprompt klein und ermöglicht trotzdem gezielte Skill-Nutzung.

Das Budget für die Skills-Liste gehört dem Skills-Subsystem:

- Globaler Standard: `skills.limits.maxSkillsPromptChars`
- Überschreibung pro Agent: `agents.list[].skillsLimits.maxSkillsPromptChars`

Generische begrenzte Laufzeitauszüge verwenden eine andere Oberfläche:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Diese Trennung hält die Größenbemessung für Skills getrennt von der Größenbemessung für Laufzeit-Lesen/Injektion,
wie etwa `memory_get`, Live-Tool-Ergebnissen und Aktualisierungen von AGENTS.md nach Compaction.

## Dokumentation

Wenn verfügbar, enthält die Systemaufforderung einen Abschnitt **Documentation**, der auf das
lokale OpenClaw-Dokumentationsverzeichnis verweist (entweder `docs/` im Repository-Workspace oder die gebündelte npm-
Paketdokumentation) und außerdem den öffentlichen Mirror, das Quell-Repository, die Community-Discord und
ClawHub ([https://clawhub.ai](https://clawhub.ai)) zur Skills-Entdeckung erwähnt. Die Aufforderung weist das Modell an, zuerst lokale Dokumentation zu konsultieren
für OpenClaw-Verhalten, Befehle, Konfiguration oder Architektur, und
`openclaw status` nach Möglichkeit selbst auszuführen (den Benutzer nur zu fragen, wenn kein Zugriff besteht).
