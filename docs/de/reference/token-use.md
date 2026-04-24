---
read_when:
    - Tokennutzung, Kosten oder Kontextfenster erklären
    - Wachstum des Kontexts oder Verhalten von Compaction debuggen
summary: Wie OpenClaw Prompt-Kontext aufbaut und Tokennutzung + Kosten meldet
title: Tokennutzung und Kosten
x-i18n:
    generated_at: "2026-04-24T06:59:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a95e7592a06bd750c0bfc9303d8cec2a538756e95f35c3001dc960cfebcadbf
    source_path: reference/token-use.md
    workflow: 15
---

# Tokennutzung und Kosten

OpenClaw verfolgt **Tokens**, nicht Zeichen. Tokens sind modellspezifisch, aber die meisten
Modelle im OpenAI-Stil liegen im Englischen im Schnitt bei ~4 Zeichen pro Token.

## Wie der System-Prompt aufgebaut wird

OpenClaw erstellt seinen eigenen System-Prompt bei jedem Lauf. Er enthält:

- Tool-Liste + Kurzbeschreibungen
- Skills-Liste (nur Metadaten; Anweisungen werden bei Bedarf mit `read` geladen).
  Der kompakte Skills-Block ist durch `skills.limits.maxSkillsPromptChars`
  begrenzt, mit optionaler Überschreibung pro Agent unter
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Anweisungen zur Selbstaktualisierung
- Workspace- + Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` bei neuen Workspaces sowie `MEMORY.md`, wenn vorhanden). Eine kleingeschriebene Root-Datei `memory.md` wird nicht eingebunden; sie ist Legacy-Reparatureingabe für `openclaw doctor --fix`, wenn sie zusammen mit `MEMORY.md` vorkommt. Große Dateien werden durch `agents.defaults.bootstrapMaxChars` abgeschnitten (Standard: 12000), und die gesamte Bootstrap-Einbindung ist durch `agents.defaults.bootstrapTotalMaxChars` begrenzt (Standard: 60000). Tagesdateien unter `memory/*.md` sind nicht Teil des normalen Bootstrap-Prompts; sie bleiben in normalen Turnussen on-demand über Memory-Tools verfügbar, aber nackte `/new`- und `/reset`-Aufrufe können für den ersten Turnus einen einmaligen Startup-Kontextblock mit aktueller täglicher Memory voranstellen. Dieses Startup-Präludium wird über `agents.defaults.startupContext` gesteuert.
- Zeit (UTC + Zeitzone des Benutzers)
- Antwort-Tags + Heartbeat-Verhalten
- Laufzeitmetadaten (Host/OS/Modell/Thinking)

Siehe die vollständige Aufschlüsselung unter [System Prompt](/de/concepts/system-prompt).

## Was im Kontextfenster zählt

Alles, was das Modell erhält, zählt zum Kontextlimit:

- System-Prompt (alle oben aufgeführten Abschnitte)
- Gesprächsverlauf (Benutzer- + Assistant-Nachrichten)
- Tool-Aufrufe und Tool-Ergebnisse
- Anhänge/Transkripte (Bilder, Audio, Dateien)
- Compaction-Zusammenfassungen und Pruning-Artefakte
- Provider-Wrapper oder Sicherheits-Header (nicht sichtbar, zählen aber trotzdem)

Einige laufzeitlastige Oberflächen haben eigene explizite Grenzen:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Überschreibungen pro Agent befinden sich unter `agents.list[].contextLimits`. Diese Stellschrauben
gelten für begrenzte Laufzeitauszüge und eingebundene laufzeiteigene Blöcke. Sie sind
getrennt von Bootstrap-Limits, Startup-Kontext-Limits und Skills-Prompt-Limits.

Für Bilder skaliert OpenClaw Bild-Payloads aus Transkripten/Tools vor Provider-Aufrufen herunter.
Verwenden Sie `agents.defaults.imageMaxDimensionPx` (Standard: `1200`), um dies abzustimmen:

- Niedrigere Werte reduzieren in der Regel Vision-Token-Nutzung und Payload-Größe.
- Höhere Werte erhalten mehr visuelle Details für OCR/UI-lastige Screenshots.

Für eine praktische Aufschlüsselung (pro eingebundener Datei, Tools, Skills und Größe des System-Prompts) verwenden Sie `/context list` oder `/context detail`. Siehe [Context](/de/concepts/context).

## Wie Sie die aktuelle Tokennutzung sehen

Verwenden Sie dazu im Chat:

- `/status` → **emoji-reiche Statuskarte** mit Sitzungsmodell, Kontextnutzung,
  Input-/Output-Tokens der letzten Antwort und **geschätzten Kosten** (nur bei API-Schlüssel).
- `/usage off|tokens|full` → hängt an jede Antwort einen **Nutzungs-Footer pro Antwort** an.
  - Persistiert pro Sitzung (gespeichert als `responseUsage`).
  - OAuth-Authentifizierung **verbirgt Kosten** (nur Tokens).
- `/usage cost` → zeigt eine lokale Kostenzusammenfassung aus den OpenClaw-Sitzungslogs.

Weitere Oberflächen:

- **TUI/Web TUI:** `/status` + `/usage` werden unterstützt.
- **CLI:** `openclaw status --usage` und `openclaw channels list` zeigen
  normalisierte Provider-Quotenfenster (`X% left`, nicht Kosten pro Antwort).
  Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.

Nutzungsoberflächen normalisieren vor der Anzeige gängige providernative Feldaliase.
Für Responses-Datenverkehr der OpenAI-Familie umfasst das sowohl `input_tokens` /
`output_tokens` als auch `prompt_tokens` / `completion_tokens`, sodass transportspezifische
Feldnamen `/status`, `/usage` oder Sitzungszusammenfassungen nicht verändern.
Die JSON-Nutzung von Gemini CLI wird ebenfalls normalisiert: Antworttext kommt aus `response`, und
`stats.cached` wird auf `cacheRead` abgebildet, wobei `stats.input_tokens - stats.cached`
verwendet wird, wenn die CLI kein explizites Feld `stats.input` liefert.
Für nativen Responses-Datenverkehr der OpenAI-Familie werden WebSocket-/SSE-Nutzungsaliase auf dieselbe Weise
normalisiert, und Gesamtsummen fallen auf normalisierte Eingabe + Ausgabe zurück, wenn
`total_tokens` fehlt oder `0` ist.
Wenn der aktuelle Sitzungs-Snapshot spärlich ist, können `/status` und `session_status`
außerdem Token-/Cache-Zähler und das aktive Laufzeit-Modelllabel aus dem
neuesten Nutzungslog des Transkripts wiederherstellen. Vorhandene Live-Werte ungleich null haben weiterhin
Vorrang vor Fallback-Werten aus dem Transkript, und größere promptorientierte
Transkript-Gesamtsummen können gewinnen, wenn gespeicherte Gesamtsummen fehlen oder kleiner sind.
Nutzungs-Auth für Provider-Quotenfenster stammt aus providerspezifischen Hooks, wenn
verfügbar; andernfalls greift OpenClaw auf passende OAuth-/API-Key-Anmeldedaten
aus Auth-Profilen, Umgebung oder Konfiguration zurück.
Assistant-Transkripteinträge speichern dieselbe normalisierte Nutzungsform, einschließlich
`usage.cost`, wenn das aktive Modell Preisangaben konfiguriert hat und der Provider
Nutzungsmetadaten zurückgibt. Das gibt `/usage cost` und transkriptgestütztem Sitzungsstatus
eine stabile Quelle, selbst wenn der Live-Laufzeitzustand nicht mehr vorhanden ist.

## Kostenschätzung (wenn angezeigt)

Kosten werden aus Ihrer Modellpreis-Konfiguration geschätzt:

```
models.providers.<provider>.models[].cost
```

Dies sind **USD pro 1 Mio. Tokens** für `input`, `output`, `cacheRead` und
`cacheWrite`. Wenn Preisangaben fehlen, zeigt OpenClaw nur Tokens an. OAuth-Tokens
zeigen niemals Dollar-Kosten.

## Auswirkungen von Cache-TTL und Pruning

Provider-Prompt-Caching gilt nur innerhalb des Cache-TTL-Fensters. OpenClaw kann
optional **Cache-TTL-Pruning** ausführen: Es schneidet die Sitzung zurück, sobald die Cache-TTL
abgelaufen ist, und setzt dann das Cache-Fenster zurück, sodass nachfolgende Anfragen den
frisch gecachten Kontext erneut verwenden können, statt den gesamten Verlauf erneut zu cachen. Das hält Cache-
Schreibkosten niedriger, wenn eine Sitzung über die TTL hinaus untätig bleibt.

Konfigurieren Sie dies in [Gateway configuration](/de/gateway/configuration) und siehe die
Verhaltensdetails unter [Session pruning](/de/concepts/session-pruning).

Heartbeat kann den Cache über Leerlaufphasen hinweg **warm** halten. Wenn die Cache-TTL
Ihres Modells `1h` beträgt, kann ein Heartbeat-Intervall knapp darunter (z. B. `55m`) das
erneute Cachen des vollständigen Prompts vermeiden und so Cache-Schreibkosten senken.

In Multi-Agent-Setups können Sie eine gemeinsame Modellkonfiguration beibehalten und das Cache-Verhalten
pro Agent mit `agents.list[].params.cacheRetention` abstimmen.

Eine vollständige Anleitung zu allen Stellschrauben finden Sie unter [Prompt Caching](/de/reference/prompt-caching).

Bei der Anthropic-API-Bepreisung sind Cache-Lesevorgänge deutlich günstiger als Input-
Tokens, während Cache-Schreibvorgänge mit einem höheren Multiplikator berechnet werden. Die aktuellen Preise und TTL-Multiplikatoren finden Sie in den Prompt-Caching-Preisen von Anthropic:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Beispiel: 1h-Cache mit Heartbeat warm halten

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Beispiel: gemischter Verkehr mit Cache-Strategie pro Agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # Standard-Basislinie für die meisten Agenten
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # langen Cache für tiefe Sitzungen warm halten
    - id: "alerts"
      params:
        cacheRetention: "none" # Cache-Schreibvorgänge für burstige Benachrichtigungen vermeiden
```

`agents.list[].params` wird über `params` des ausgewählten Modells zusammengeführt, sodass Sie
nur `cacheRetention` überschreiben und andere Modellstandards unverändert erben können.

### Beispiel: Anthropic-1M-Kontext-Beta-Header aktivieren

Das 1M-Kontextfenster von Anthropic ist derzeit beta-gated. OpenClaw kann den
erforderlichen Wert für `anthropic-beta` einfügen, wenn Sie `context1m` bei unterstützten Opus-
oder Sonnet-Modellen aktivieren.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Dies wird auf den Beta-Header `context-1m-2025-08-07` von Anthropic abgebildet.

Dies gilt nur, wenn `context1m: true` bei diesem Modelleintrag gesetzt ist.

Voraussetzung: Die Anmeldedaten müssen für Long-Context-Nutzung geeignet sein. Wenn nicht,
antwortet Anthropic für diese Anfrage mit einem providerseitigen Rate-Limit-Fehler.

Wenn Sie Anthropic mit OAuth-/Subscription-Tokens (`sk-ant-oat-*`) authentifizieren,
überspringt OpenClaw den Beta-Header `context-1m-*`, weil Anthropic diese Kombination derzeit
mit HTTP 401 ablehnt.

## Tipps zur Reduzierung von Tokendruck

- Verwenden Sie `/compact`, um lange Sitzungen zusammenzufassen.
- Kürzen Sie große Tool-Ausgaben in Ihren Workflows.
- Verringern Sie `agents.defaults.imageMaxDimensionPx` für screenshotlastige Sitzungen.
- Halten Sie Skill-Beschreibungen kurz (die Skills-Liste wird in den Prompt eingebunden).
- Bevorzugen Sie kleinere Modelle für ausführliche, explorative Arbeit.

Siehe [Skills](/de/tools/skills) für die genaue Formel zum Overhead der Skills-Liste.

## Verwandt

- [API usage and costs](/de/reference/api-usage-costs)
- [Prompt caching](/de/reference/prompt-caching)
- [Usage tracking](/de/concepts/usage-tracking)
