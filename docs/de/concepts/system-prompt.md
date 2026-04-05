---
read_when:
    - Beim Bearbeiten von System-Prompt-Text, Tool-Liste oder Zeit-/Heartbeat-Abschnitten
    - Beim Ändern des Workspace-Bootstraps oder des Verhaltens der Skills-Injektion
summary: Was der OpenClaw-System-Prompt enthält und wie er zusammengesetzt wird
title: System-Prompt
x-i18n:
    generated_at: "2026-04-05T12:41:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86b2fa496b183b64e86e6ddc493e4653ff8c9727d813fe33c8f8320184d022f
    source_path: concepts/system-prompt.md
    workflow: 15
---

# System-Prompt

OpenClaw erstellt für jede Agent-Ausführung einen benutzerdefinierten System-Prompt. Der Prompt wird **von OpenClaw verwaltet** und verwendet nicht den Standard-Prompt von pi-coding-agent.

Der Prompt wird von OpenClaw zusammengesetzt und in jede Agent-Ausführung injiziert.

## Struktur

Der Prompt ist absichtlich kompakt und verwendet feste Abschnitte:

- **Tooling**: aktuelle Tool-Liste + kurze Beschreibungen.
- **Safety**: kurze Erinnerung an Schutzleitplanken, um machtsuchendes Verhalten oder das Umgehen von Aufsicht zu vermeiden.
- **Skills** (wenn verfügbar): erklärt dem Modell, wie Skill-Anweisungen bei Bedarf geladen werden.
- **OpenClaw Self-Update**: wie die Konfiguration sicher mit
  `config.schema.lookup` geprüft, die Konfiguration mit `config.patch` gepatcht, die vollständige
  Konfiguration mit `config.apply` ersetzt und `update.run` nur auf ausdrückliche Benutzer-
  anfrage ausgeführt wird. Das nur für den Owner verfügbare Tool `gateway` verweigert außerdem das Umschreiben von
  `tools.exec.ask` / `tools.exec.security`, einschließlich Legacy-`tools.bash.*`-
  Aliassen, die auf diese geschützten Exec-Pfade normalisiert werden.
- **Workspace**: Arbeitsverzeichnis (`agents.defaults.workspace`).
- **Documentation**: lokaler Pfad zur OpenClaw-Dokumentation (Repo oder npm-Paket) und wann sie gelesen werden soll.
- **Workspace Files (injected)**: zeigt an, dass Bootstrap-Dateien unten eingefügt sind.
- **Sandbox** (wenn aktiviert): zeigt sandboxed Laufzeit, Sandbox-Pfade und an, ob erhöhter Exec verfügbar ist.
- **Current Date & Time**: benutzerlokale Zeit, Zeitzone und Zeitformat.
- **Reply Tags**: optionale Reply-Tag-Syntax für unterstützte Provider.
- **Heartbeats**: Heartbeat-Prompt und Ack-Verhalten.
- **Runtime**: Host, OS, Node, Modell, Repo-Root (wenn erkannt), Thinking-Level (eine Zeile).
- **Reasoning**: aktuelles Sichtbarkeitsniveau + `/reasoning`-Toggle-Hinweis.

Der Abschnitt Tooling enthält außerdem Laufzeithinweise für lang laufende Arbeiten:

- Cron für zukünftige Nachverfolgung verwenden (`check back later`, Erinnerungen, wiederkehrende Arbeiten)
  statt `exec`-Sleep-Schleifen, `yieldMs`-Delay-Tricks oder wiederholtem `process`-
  Polling
- `exec` / `process` nur für Befehle verwenden, die jetzt starten und im
  Hintergrund weiterlaufen
- wenn automatisches Aufwecken bei Abschluss aktiviert ist, den Befehl einmal starten und sich auf
  den pushbasierten Wake-Pfad verlassen, wenn er Ausgabe erzeugt oder fehlschlägt
- `process` für Logs, Status, Eingaben oder Eingriffe verwenden, wenn Sie einen laufenden Befehl
  prüfen müssen
- wenn die Aufgabe größer ist, `sessions_spawn` bevorzugen; der Abschluss von Sub-Agents ist
  pushbasiert und wird automatisch an den Anforderer angekündigt
- `subagents list` / `sessions_list` nicht in einer Schleife pollen, nur um auf den
  Abschluss zu warten

Safety-Leitplanken im System-Prompt sind beratend. Sie leiten das Modellverhalten, erzwingen aber keine Richtlinie. Verwenden Sie Tool-Richtlinien, Exec-Genehmigungen, Sandboxing und Kanal-Allowlists für harte Durchsetzung; Betreiber können diese absichtlich deaktivieren.

Auf Kanälen mit nativen Genehmigungskarten/-Buttons sagt der Laufzeit-Prompt dem
Agent jetzt, sich zuerst auf diese native Genehmigungs-UI zu verlassen. Er sollte nur dann einen manuellen
`/approve`-Befehl einfügen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder
manuelle Genehmigung der einzige Weg ist.

## Prompt-Modi

OpenClaw kann kleinere System-Prompts für Sub-Agents rendern. Die Laufzeit setzt für jede
Ausführung einen `promptMode` (keine benutzerseitige Konfiguration):

- `full` (Standard): enthält alle oben genannten Abschnitte.
- `minimal`: wird für Sub-Agents verwendet; lässt **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** und **Heartbeats** weg. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (wenn bekannt), Runtime und injizierter
  Kontext bleiben verfügbar.
- `none`: gibt nur die Basis-Identitätszeile zurück.

Wenn `promptMode=minimal`, werden zusätzliche injizierte Prompts als **Subagent
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
- `MEMORY.md`, wenn vorhanden, andernfalls `memory.md` als kleingeschriebener Fallback

All diese Dateien werden bei jedem Turn **in das Kontextfenster injiziert**, was
bedeutet, dass sie Tokens verbrauchen. Halten Sie sie kurz — insbesondere `MEMORY.md`, das
mit der Zeit wachsen kann und zu unerwartet hoher Kontextnutzung und häufigerer
Kompaktierung führen kann.

> **Hinweis:** Tägliche Dateien `memory/*.md` werden **nicht** automatisch injiziert. Sie
> werden bei Bedarf über die Tools `memory_search` und `memory_get` aufgerufen, sodass sie
> nicht gegen das Kontextfenster zählen, sofern das Modell sie nicht ausdrücklich liest.

Große Dateien werden mit einem Marker gekürzt. Die maximale Größe pro Datei wird durch
`agents.defaults.bootstrapMaxChars` (Standard: 20000) gesteuert. Der insgesamt injizierte Bootstrap-
Inhalt über alle Dateien hinweg ist durch `agents.defaults.bootstrapTotalMaxChars`
(Standard: 150000) begrenzt. Fehlende Dateien injizieren einen kurzen Marker für fehlende Dateien. Wenn eine Kürzung
erfolgt, kann OpenClaw einen Warnblock in Project Context injizieren; steuern Sie dies mit
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
Standard: `once`).

Sub-Agent-Sitzungen injizieren nur `AGENTS.md` und `TOOLS.md` (andere Bootstrap-Dateien
werden herausgefiltert, um den Sub-Agent-Kontext klein zu halten).

Interne Hooks können diesen Schritt über `agent:bootstrap` abfangen, um die
injizierten Bootstrap-Dateien zu verändern oder zu ersetzen (zum Beispiel `SOUL.md` gegen eine alternative Persona auszutauschen).

Wenn Sie den Agenten weniger generisch klingen lassen möchten, beginnen Sie mit dem
[SOUL.md Personality Guide](/concepts/soul).

Um zu prüfen, wie viel jede injizierte Datei beiträgt (roh vs. injiziert, Kürzung plus Tool-Schema-Overhead), verwenden Sie `/context list` oder `/context detail`. Siehe [Context](/concepts/context).

## Zeitbehandlung

Der System-Prompt enthält einen eigenen Abschnitt **Current Date & Time**, wenn die
Benutzerzeitzone bekannt ist. Um den Prompt-Cache stabil zu halten, enthält er jetzt nur noch
die **Zeitzone** (keine dynamische Uhrzeit oder Zeitformat).

Verwenden Sie `session_status`, wenn der Agent die aktuelle Zeit benötigt; die Statuskarte
enthält eine Zeitstempelzeile. Dasselbe Tool kann optional eine Modellüberschreibung pro Sitzung
setzen (`model=default` löscht sie).

Konfigurieren mit:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Siehe [Date & Time](/date-time) für vollständige Verhaltensdetails.

## Skills

Wenn zulässige Skills existieren, injiziert OpenClaw eine kompakte **Liste verfügbarer Skills**
(`formatSkillsForPrompt`), die für jeden Skill den **Dateipfad** enthält. Der
Prompt weist das Modell an, `read` zu verwenden, um die `SKILL.md` am aufgeführten
Speicherort (Workspace, verwaltet oder gebündelt) zu laden. Wenn keine Skills zulässig sind, wird der
Abschnitt Skills weggelassen.

Die Zulässigkeit umfasst Skill-Metadaten-Gates, Laufzeitumgebungs-/Konfigurationsprüfungen
und die effektive Allowlist der Agent-Skills, wenn `agents.defaults.skills` oder
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

Dadurch bleibt der Basis-Prompt klein und ermöglicht dennoch gezielte Skill-Nutzung.

## Dokumentation

Wenn verfügbar, enthält der System-Prompt einen Abschnitt **Documentation**, der auf das
lokale OpenClaw-Dokumentationsverzeichnis verweist (entweder `docs/` im Repo-Workspace oder die gebündelte npm-
Paketdokumentation) und außerdem den öffentlichen Mirror, das Source-Repo, die Community auf Discord und
ClawHub ([https://clawhub.ai](https://clawhub.ai)) für die Skills-Suche erwähnt. Der Prompt weist das Modell an, zuerst die lokale Dokumentation zu konsultieren
für OpenClaw-Verhalten, Befehle, Konfiguration oder Architektur und
nach Möglichkeit `openclaw status` selbst auszuführen (den Benutzer nur zu fragen, wenn ihm der Zugriff fehlt).
