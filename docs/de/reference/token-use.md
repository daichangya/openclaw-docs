---
read_when:
    - Erläuterung von Token-Nutzung, Kosten oder Kontextfenstern
    - Wachstum des Kontexts oder Verhalten von Compaction debuggen
summary: Wie OpenClaw Prompt-Kontext aufbaut und Token-Nutzung + Kosten meldet
title: Token-Nutzung und Kosten
x-i18n:
    generated_at: "2026-04-21T06:31:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: d26db37353941e247eb26f84bfa105896318b3239b2975d6e033c6e9ceda6b0d
    source_path: reference/token-use.md
    workflow: 15
---

# Token-Nutzung und Kosten

OpenClaw verfolgt **Tokens**, nicht Zeichen. Tokens sind modellspezifisch, aber die meisten
Modelle im Stil von OpenAI liegen im Englischen im Schnitt bei etwa 4 Zeichen pro Token.

## Wie der System-Prompt aufgebaut wird

OpenClaw setzt bei jedem Lauf seinen eigenen System-Prompt zusammen. Er enthält:

- Tool-Liste + kurze Beschreibungen
- Skills-Liste (nur Metadaten; Anweisungen werden bei Bedarf mit `read` geladen).
  Der kompakte Skills-Block wird durch `skills.limits.maxSkillsPromptChars` begrenzt,
  mit optionalem Override pro Agent unter
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Self-Update-Anweisungen
- Workspace + Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` bei neuen Workspaces sowie `MEMORY.md`, wenn vorhanden, oder `memory.md` als Fallback in Kleinbuchstaben). Große Dateien werden durch `agents.defaults.bootstrapMaxChars` gekürzt (Standard: 12000), und die gesamte Bootstrap-Injektion ist durch `agents.defaults.bootstrapTotalMaxChars` begrenzt (Standard: 60000). Tägliche Dateien `memory/*.md` sind nicht Teil des normalen Bootstrap-Prompts; bei gewöhnlichen Zügen bleiben sie über Memory-Tools on demand, aber bei reinem `/new` und `/reset` kann ein einmaliger Startup-Kontextblock mit aktueller täglicher Memory für diesen ersten Zug vorangestellt werden. Dieses Startup-Präludium wird durch `agents.defaults.startupContext` gesteuert.
- Zeit (UTC + Benutzerzeitzone)
- Reply-Tags + Heartbeat-Verhalten
- Runtime-Metadaten (Host/OS/Modell/Thinking)

Die vollständige Aufschlüsselung finden Sie unter [System Prompt](/de/concepts/system-prompt).

## Was im Kontextfenster zählt

Alles, was das Modell erhält, zählt zum Kontextlimit:

- System-Prompt (alle oben aufgeführten Abschnitte)
- Gesprächsverlauf (Benutzer- + Assistentennachrichten)
- Tool-Aufrufe und Tool-Ergebnisse
- Anhänge/Transkripte (Bilder, Audio, Dateien)
- Compaction-Zusammenfassungen und Pruning-Artefakte
- Provider-Wrapper oder Safety-Header (nicht sichtbar, zählen aber trotzdem)

Einige runtime-lastige Oberflächen haben eigene explizite Limits:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Overrides pro Agent liegen unter `agents.list[].contextLimits`. Diese Regler sind
für begrenzte Runtime-Auszüge und eingefügte runtime-eigene Blöcke gedacht. Sie sind
getrennt von Bootstrap-Limits, Startup-Kontext-Limits und Skills-Prompt-
Limits.

Für Bilder skaliert OpenClaw Bild-Payloads aus Transkripten/Tools vor Provider-Aufrufen herunter.
Verwenden Sie `agents.defaults.imageMaxDimensionPx` (Standard: `1200`), um dies anzupassen:

- Niedrigere Werte reduzieren normalerweise die Nutzung von Vision-Tokens und die Payload-Größe.
- Höhere Werte bewahren mehr visuelle Details für OCR/UI-lastige Screenshots.

Für eine praktische Aufschlüsselung (pro eingefügter Datei, Tools, Skills und Größe des System-Prompts) verwenden Sie `/context list` oder `/context detail`. Siehe [Context](/de/concepts/context).

## Wie Sie die aktuelle Token-Nutzung sehen

Verwenden Sie im Chat:

- `/status` → **emoji-reiche Statuskarte** mit Sitzungsmodell, Kontextnutzung,
  Input-/Output-Tokens der letzten Antwort und **geschätzten Kosten** (nur API-Key).
- `/usage off|tokens|full` → hängt jeder Antwort einen **Nutzungs-Footer pro Antwort** an.
  - Bleibt pro Sitzung erhalten (gespeichert als `responseUsage`).
  - OAuth-Authentifizierung **verbirgt Kosten** (nur Tokens).
- `/usage cost` → zeigt eine lokale Kostenzusammenfassung aus den OpenClaw-Sitzungslogs.

Weitere Oberflächen:

- **TUI/Web TUI:** `/status` + `/usage` werden unterstützt.
- **CLI:** `openclaw status --usage` und `openclaw channels list` zeigen
  normalisierte providerbezogene Quotenfenster (`X% left`, nicht Kosten pro Antwort).
  Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.

Nutzungsoberflächen normalisieren gängige native Feld-Aliasse von Providern vor der Anzeige.
Für OpenAI-Family-Responses-Traffic umfasst das sowohl `input_tokens` /
`output_tokens` als auch `prompt_tokens` / `completion_tokens`, sodass transport-
spezifische Feldnamen `/status`, `/usage` oder Sitzungszusammenfassungen nicht verändern.
Auch die JSON-Nutzung von Gemini CLI wird normalisiert: Antworttext stammt aus `response`, und
`stats.cached` wird auf `cacheRead` abgebildet, wobei `stats.input_tokens - stats.cached`
verwendet wird, wenn die CLI kein explizites Feld `stats.input` liefert.
Für nativen Responses-Traffic der OpenAI-Family werden WebSocket-/SSE-Nutzungsaliase
auf dieselbe Weise normalisiert, und Summen fallen auf normalisierte Eingabe + Ausgabe zurück, wenn
`total_tokens` fehlt oder `0` ist.
Wenn der aktuelle Sitzungs-Snapshot spärlich ist, können `/status` und `session_status`
auch Token-/Cache-Zähler und das aktive Runtime-Modell-Label aus dem
jüngsten Nutzungslog des Transkripts wiederherstellen. Bestehende Live-Werte ungleich null haben weiterhin
Vorrang vor Fallback-Werten aus dem Transkript, und größere promptorientierte
Transkript-Summen können gewinnen, wenn gespeicherte Summen fehlen oder kleiner sind.
Die Nutzungs-Authentifizierung für providerbezogene Quotenfenster stammt aus providerspezifischen Hooks, wenn verfügbar;
andernfalls greift OpenClaw auf passende OAuth-/API-Key-Zugangsdaten
aus Auth-Profilen, Env oder Konfiguration zurück.
Transkripteinträge des Assistenten speichern dieselbe normalisierte Nutzungsform, einschließlich
`usage.cost`, wenn für das aktive Modell Preise konfiguriert sind und der Provider Nutzungsmetadaten zurückgibt. Dadurch haben `/usage cost` und transkriptgestützter Sitzungsstatus eine stabile Quelle, selbst wenn der Live-Runtime-Zustand nicht mehr vorhanden ist.

## Kostenschätzung (wenn angezeigt)

Die Kosten werden aus Ihrer Modellpreiskonfiguration geschätzt:

```
models.providers.<provider>.models[].cost
```

Dies sind **USD pro 1 Mio. Tokens** für `input`, `output`, `cacheRead` und
`cacheWrite`. Wenn Preisangaben fehlen, zeigt OpenClaw nur Tokens an. OAuth-Tokens
zeigen niemals Dollar-Kosten an.

## Auswirkungen von Cache-TTL und Pruning

Provider-Prompt-Caching gilt nur innerhalb des Cache-TTL-Fensters. OpenClaw kann
optional **Cache-TTL-Pruning** ausführen: Es pruned die Sitzung, sobald der Cache-TTL
abgelaufen ist, und setzt dann das Cache-Fenster zurück, sodass nachfolgende Anfragen
den frisch gecachten Kontext wiederverwenden können, statt den vollständigen Verlauf erneut zu cachen. Dadurch bleiben
Cache-Schreibkosten niedriger, wenn eine Sitzung über die TTL hinaus inaktiv bleibt.

Konfigurieren Sie dies in der [Gateway-Konfiguration](/de/gateway/configuration) und lesen Sie
die Verhaltensdetails unter [Session pruning](/de/concepts/session-pruning).

Heartbeat kann den Cache über Leerlaufphasen hinweg **warm** halten. Wenn die Cache-TTL Ihres Modells
`1h` beträgt, kann das Setzen des Heartbeat-Intervalls knapp darunter (z. B. `55m`) ein
erneutes Cachen des vollständigen Prompts vermeiden und so Cache-Schreibkosten reduzieren.

In Multi-Agent-Setups können Sie eine gemeinsame Modellkonfiguration beibehalten und das Cache-Verhalten
pro Agent mit `agents.list[].params.cacheRetention` anpassen.

Eine vollständige Anleitung für alle Schalter finden Sie unter [Prompt Caching](/de/reference/prompt-caching).

Bei der Preisgestaltung der Anthropic-API sind Cache-Reads deutlich günstiger als Input-
Tokens, während Cache-Writes mit einem höheren Multiplikator berechnet werden. Die aktuellen Preise und TTL-Multiplikatoren finden Sie in Anthropics Preisangaben für Prompt Caching:
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

### Beispiel: gemischter Traffic mit Cache-Strategie pro Agent

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

`agents.list[].params` wird über die `params` des ausgewählten Modells gemergt, sodass Sie
nur `cacheRetention` überschreiben und andere Modellstandards unverändert erben können.

### Beispiel: Beta-Header für Anthropic 1M Kontext aktivieren

Das 1M-Kontextfenster von Anthropic ist derzeit durch eine Beta-Gating geschützt. OpenClaw kann den
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

Voraussetzung: Die Zugangsdaten müssen für Long-Context-Nutzung geeignet sein. Falls nicht,
antwortet Anthropic für diese Anfrage mit einem providerseitigen Rate-Limit-Fehler.

Wenn Sie Anthropic mit OAuth-/Subscription-Tokens (`sk-ant-oat-*`) authentifizieren,
überspringt OpenClaw den Beta-Header `context-1m-*`, weil Anthropic diese Kombination derzeit
mit HTTP 401 ablehnt.

## Tipps zur Verringerung des Token-Drucks

- Verwenden Sie `/compact`, um lange Sitzungen zusammenzufassen.
- Kürzen Sie große Tool-Ausgaben in Ihren Workflows.
- Senken Sie `agents.defaults.imageMaxDimensionPx` für screenshotlastige Sitzungen.
- Halten Sie Skill-Beschreibungen kurz (die Skills-Liste wird in den Prompt eingefügt).
- Bevorzugen Sie kleinere Modelle für ausführliche, explorative Arbeit.

Die genaue Formel für den Overhead der Skills-Liste finden Sie unter [Skills](/de/tools/skills).
