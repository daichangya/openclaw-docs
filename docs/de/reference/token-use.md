---
read_when:
    - Erklärung von Token-Nutzung, Kosten oder Kontextfenstern
    - Kontextwachstum oder Compaction-Verhalten debuggen
summary: Wie OpenClaw Prompt-Kontext erstellt und Token-Nutzung sowie Kosten meldet
title: Token-Nutzung und Kosten
x-i18n:
    generated_at: "2026-04-15T19:41:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a706d3df8b2ea1136b3535d216c6b358e43aee2a31a4759824385e1345e6fe5
    source_path: reference/token-use.md
    workflow: 15
---

# Token-Nutzung und Kosten

OpenClaw erfasst **Token**, nicht Zeichen. Token sind modellspezifisch, aber die meisten
OpenAI-ähnlichen Modelle haben im Durchschnitt etwa 4 Zeichen pro Token für englischen Text.

## Wie der System-Prompt erstellt wird

OpenClaw setzt seinen eigenen System-Prompt bei jeder Ausführung zusammen. Er enthält:

- Tool-Liste + kurze Beschreibungen
- Skills-Liste (nur Metadaten; Anweisungen werden bei Bedarf mit `read` geladen).
  Der kompakte Skills-Block ist durch `skills.limits.maxSkillsPromptChars`
  begrenzt, mit optionaler agentenspezifischer Überschreibung unter
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Anweisungen zur Selbstaktualisierung
- Workspace- und Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, wenn neu, sowie `MEMORY.md`, wenn vorhanden, oder `memory.md` als Fallback in Kleinbuchstaben). Große Dateien werden durch `agents.defaults.bootstrapMaxChars` abgeschnitten (Standard: 12000), und die gesamte Bootstrap-Injektion ist durch `agents.defaults.bootstrapTotalMaxChars` begrenzt (Standard: 60000). Tägliche Dateien in `memory/*.md` sind nicht Teil des normalen Bootstrap-Prompts; sie bleiben in normalen Turns bei Bedarf über Memory-Tools verfügbar, aber ein einfaches `/new` und `/reset` kann für den ersten Turn einen einmaligen Startup-Kontextblock mit aktuellem täglichem Memory voranstellen. Dieses Startup-Präludium wird durch `agents.defaults.startupContext` gesteuert.
- Zeit (UTC + Benutzerzeitzone)
- Antwort-Tags + Heartbeat-Verhalten
- Laufzeitmetadaten (Host/OS/Modell/Thinking)

Die vollständige Aufschlüsselung finden Sie unter [System Prompt](/de/concepts/system-prompt).

## Was im Kontextfenster zählt

Alles, was das Modell erhält, zählt zum Kontextlimit:

- System-Prompt (alle oben aufgeführten Abschnitte)
- Gesprächsverlauf (Benutzer- und Assistentennachrichten)
- Tool-Aufrufe und Tool-Ergebnisse
- Anhänge/Transkripte (Bilder, Audio, Dateien)
- Compaction-Zusammenfassungen und Pruning-Artefakte
- Provider-Wrapper oder Sicherheits-Header (nicht sichtbar, werden aber trotzdem mitgezählt)

Einige laufzeitintensive Bereiche haben eigene explizite Begrenzungen:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Agentenspezifische Überschreibungen befinden sich unter `agents.list[].contextLimits`. Diese Regler sind
für begrenzte Laufzeitauszüge und injizierte laufzeiteigene Blöcke gedacht. Sie sind
getrennt von Bootstrap-Limits, Startup-Kontext-Limits und Skills-Prompt-
Limits.

Bei Bildern skaliert OpenClaw Transkript-/Tool-Bild-Payloads vor Provider-Aufrufen herunter.
Verwenden Sie `agents.defaults.imageMaxDimensionPx` (Standard: `1200`), um dies abzustimmen:

- Niedrigere Werte reduzieren normalerweise die Vision-Token-Nutzung und die Payload-Größe.
- Höhere Werte bewahren mehr visuelle Details für OCR-/UI-lastige Screenshots.

Für eine praktische Aufschlüsselung (pro injizierter Datei, Tools, Skills und Größe des System-Prompts) verwenden Sie `/context list` oder `/context detail`. Siehe [Context](/de/concepts/context).

## So sehen Sie die aktuelle Token-Nutzung

Verwenden Sie diese Befehle im Chat:

- `/status` → **statuskarte mit vielen Emojis** mit dem Sitzungsmodell, der Kontextnutzung,
  den Input-/Output-Token der letzten Antwort und den **geschätzten Kosten** (nur API-Schlüssel).
- `/usage off|tokens|full` → hängt an jede Antwort eine **Nutzungs-Fußzeile pro Antwort** an.
  - Bleibt pro Sitzung bestehen (gespeichert als `responseUsage`).
  - OAuth-Authentifizierung **blendet Kosten aus** (nur Token).
- `/usage cost` → zeigt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungsprotokollen an.

Weitere Oberflächen:

- **TUI/Web TUI:** `/status` und `/usage` werden unterstützt.
- **CLI:** `openclaw status --usage` und `openclaw channels list` zeigen
  normalisierte Provider-Quotenfenster an (`X% left`, nicht Kosten pro Antwort).
  Aktuelle Provider mit Nutzungsfenster: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.

Nutzungsoberflächen normalisieren vor der Anzeige gängige providernative Feldaliase.
Für OpenAI-Family-Responses-Traffic umfasst dies sowohl `input_tokens` /
`output_tokens` als auch `prompt_tokens` / `completion_tokens`, sodass transportspezifische
Feldnamen `/status`, `/usage` oder Sitzungszusammenfassungen nicht ändern.
Auch die JSON-Nutzung von Gemini CLI wird normalisiert: Antworttext kommt aus `response`, und
`stats.cached` wird auf `cacheRead` abgebildet, wobei `stats.input_tokens - stats.cached`
verwendet wird, wenn die CLI kein explizites Feld `stats.input` bereitstellt.
Für nativen OpenAI-Family-Responses-Traffic werden WebSocket-/SSE-Nutzungsaliase
auf dieselbe Weise normalisiert, und Summen greifen auf normalisierte Input- + Output-Werte zurück, wenn
`total_tokens` fehlt oder `0` ist.
Wenn der aktuelle Sitzungssnapshot nur spärlich ist, können `/status` und `session_status`
außerdem Token-/Cache-Zähler und das aktive Laufzeitmodell-Label aus dem
aktuellsten Nutzungsprotokoll des Transkripts wiederherstellen. Vorhandene von null verschiedene Live-Werte
haben weiterhin Vorrang vor Transkript-Fallback-Werten, und größere promptorientierte
Transkript-Summen können gewinnen, wenn gespeicherte Summen fehlen oder kleiner sind.
Die Nutzungsauthentifizierung für Provider-Quotenfenster stammt aus providerspezifischen Hooks, wenn
verfügbar; andernfalls greift OpenClaw auf passende OAuth-/API-Key-Zugangsdaten
aus Auth-Profilen, der Umgebung oder der Konfiguration zurück.

## Kostenschätzung (wenn angezeigt)

Die Kosten werden anhand Ihrer Modellpreis-Konfiguration geschätzt:

```
models.providers.<provider>.models[].cost
```

Dies sind **USD pro 1 Mio. Token** für `input`, `output`, `cacheRead` und
`cacheWrite`. Wenn die Preisangaben fehlen, zeigt OpenClaw nur Token an. OAuth-Token
zeigen niemals Dollarkosten an.

## Auswirkungen von Cache-TTL und Pruning

Provider-Prompt-Caching gilt nur innerhalb des Cache-TTL-Fensters. OpenClaw kann
optional **Cache-TTL-Pruning** ausführen: Es beschneidet die Sitzung, sobald die Cache-TTL
abgelaufen ist, und setzt dann das Cache-Fenster zurück, sodass nachfolgende Anfragen den
frisch gecachten Kontext wiederverwenden können, anstatt den vollständigen Verlauf erneut zu cachen.
Dadurch bleiben die Cache-Schreibkosten niedriger, wenn eine Sitzung nach Ablauf der TTL untätig wird.

Konfigurieren Sie dies in [Gateway configuration](/de/gateway/configuration) und lesen Sie die
Verhaltensdetails unter [Session pruning](/de/concepts/session-pruning).

Heartbeat kann den Cache über Leerlaufphasen hinweg **warm** halten. Wenn die Cache-TTL
Ihres Modells `1h` beträgt, kann das Setzen des Heartbeat-Intervalls knapp darunter (z. B. `55m`)
verhindern, dass der vollständige Prompt erneut gecacht werden muss, wodurch sich Cache-Schreibkosten verringern.

In Multi-Agent-Setups können Sie eine gemeinsam genutzte Modellkonfiguration beibehalten und das Cache-Verhalten
pro Agent mit `agents.list[].params.cacheRetention` abstimmen.

Eine vollständige Anleitung zu allen Reglern finden Sie unter [Prompt Caching](/de/reference/prompt-caching).

Bei den Anthropic-API-Preisen sind Cache-Lesevorgänge deutlich günstiger als Input-
Token, während Cache-Schreibvorgänge mit einem höheren Multiplikator abgerechnet werden. Die aktuellen Preise und TTL-Multiplikatoren finden Sie in der Anthropic-Dokumentation zur Preisgestaltung für Prompt-Caching:
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

### Beispiel: gemischter Traffic mit agentenspezifischer Cache-Strategie

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` wird über `params` des ausgewählten Modells zusammengeführt, sodass Sie
nur `cacheRetention` überschreiben und andere Modellstandards unverändert übernehmen können.

### Beispiel: Anthropic-1M-Kontext-Beta-Header aktivieren

Das 1M-Kontextfenster von Anthropic ist derzeit beta-gesteuert. OpenClaw kann den
erforderlichen Wert für `anthropic-beta` injizieren, wenn Sie `context1m` bei unterstützten Opus-
oder Sonnet-Modellen aktivieren.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Dies wird dem Beta-Header `context-1m-2025-08-07` von Anthropic zugeordnet.

Dies gilt nur, wenn `context1m: true` für diesen Modelleintrag gesetzt ist.

Voraussetzung: Die Zugangsdaten müssen für die Nutzung mit langem Kontext berechtigt sein. Andernfalls
antwortet Anthropic für diese Anfrage mit einem providerseitigen Rate-Limit-Fehler.

Wenn Sie Anthropic mit OAuth-/Subscription-Token (`sk-ant-oat-*`) authentifizieren,
überspringt OpenClaw den Beta-Header `context-1m-*`, weil Anthropic diese Kombination derzeit
mit HTTP 401 ablehnt.

## Tipps zur Reduzierung des Token-Drucks

- Verwenden Sie `/compact`, um lange Sitzungen zusammenzufassen.
- Kürzen Sie große Tool-Ausgaben in Ihren Workflows.
- Reduzieren Sie `agents.defaults.imageMaxDimensionPx` für screenshotlastige Sitzungen.
- Halten Sie Skill-Beschreibungen kurz (die Skills-Liste wird in den Prompt injiziert).
- Bevorzugen Sie kleinere Modelle für ausführliche, explorative Arbeit.

Unter [Skills](/de/tools/skills) finden Sie die genaue Formel für den Overhead der Skills-Liste.
