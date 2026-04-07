---
read_when:
    - Erklärung von Token-Nutzung, Kosten oder Kontextfenstern
    - Debuggen von Kontextwachstum oder Kompaktierungsverhalten
summary: Wie OpenClaw Prompt-Kontext erstellt und Token-Nutzung + Kosten meldet
title: Token-Nutzung und Kosten
x-i18n:
    generated_at: "2026-04-07T06:19:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0683693d6c6fcde7d5fba236064ba97dd4b317ae6bea3069db969fcd178119d9
    source_path: reference/token-use.md
    workflow: 15
---

# Token-Nutzung und Kosten

OpenClaw verfolgt **Tokens**, nicht Zeichen. Tokens sind modellspezifisch, aber die meisten
OpenAI-artigen Modelle liegen bei englischem Text im Durchschnitt bei etwa 4 Zeichen pro Token.

## Wie der System-Prompt erstellt wird

OpenClaw setzt bei jedem Lauf seinen eigenen System-Prompt zusammen. Er enthält:

- Tool-Liste + kurze Beschreibungen
- Skills-Liste (nur Metadaten; Anweisungen werden bei Bedarf mit `read` geladen)
- Anweisungen zur Selbstaktualisierung
- Workspace- + Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, wenn neu, sowie `MEMORY.md`, wenn vorhanden, oder `memory.md` als Fallback in Kleinbuchstaben). Große Dateien werden durch `agents.defaults.bootstrapMaxChars` abgeschnitten (Standard: 20000), und die gesamte Bootstrap-Injektion ist durch `agents.defaults.bootstrapTotalMaxChars` begrenzt (Standard: 150000). `memory/*.md`-Dateien werden bei Bedarf über Memory-Tools geladen und nicht automatisch injiziert.
- Zeit (UTC + Zeitzone des Benutzers)
- Antwort-Tags + Heartbeat-Verhalten
- Laufzeit-Metadaten (Host/OS/Modell/Thinking)

Die vollständige Aufschlüsselung finden Sie unter [System Prompt](/de/concepts/system-prompt).

## Was im Kontextfenster zählt

Alles, was das Modell empfängt, zählt zum Kontextlimit:

- System-Prompt (alle oben aufgeführten Abschnitte)
- Gesprächsverlauf (Nachrichten von Benutzer + Assistant)
- Tool-Calls und Tool-Ergebnisse
- Anhänge/Transkripte (Bilder, Audio, Dateien)
- Kompaktierungszusammenfassungen und Pruning-Artefakte
- Provider-Wrapper oder Sicherheits-Header (nicht sichtbar, aber dennoch gezählt)

Für Bilder skaliert OpenClaw Bild-Payloads aus Transkripten/Tools vor Provider-Aufrufen herunter.
Verwenden Sie `agents.defaults.imageMaxDimensionPx` (Standard: `1200`), um dies anzupassen:

- Niedrigere Werte reduzieren in der Regel die Vision-Token-Nutzung und die Payload-Größe.
- Höhere Werte erhalten mehr visuelle Details für OCR/UI-lastige Screenshots.

Für eine praktische Aufschlüsselung (pro injizierter Datei, Tools, Skills und System-Prompt-Größe) verwenden Sie `/context list` oder `/context detail`. Siehe [Context](/de/concepts/context).

## So sehen Sie die aktuelle Token-Nutzung

Verwenden Sie im Chat Folgendes:

- `/status` → **statuskarte mit vielen Emojis** mit dem Sitzungsmodell, der Kontextnutzung,
  den Input-/Output-Tokens der letzten Antwort und den **geschätzten Kosten** (nur API-Key).
- `/usage off|tokens|full` → hängt an jede Antwort eine **Usage-Fußzeile pro Antwort** an.
  - Bleibt pro Sitzung bestehen (gespeichert als `responseUsage`).
  - OAuth-Auth **blendet Kosten aus** (nur Tokens).
- `/usage cost` → zeigt eine lokale Kostenzusammenfassung aus OpenClaw-Sitzungslogs.

Weitere Oberflächen:

- **TUI/Web TUI:** `/status` + `/usage` werden unterstützt.
- **CLI:** `openclaw status --usage` und `openclaw channels list` zeigen
  normalisierte Provider-Quota-Fenster (`X% left`, keine Kosten pro Antwort).
  Aktuelle Provider für Usage-Fenster: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.

Usage-Oberflächen normalisieren vor der Anzeige gängige providernative Feld-Aliasse.
Für Responses-Datenverkehr der OpenAI-Familie umfasst das sowohl `input_tokens` /
`output_tokens` als auch `prompt_tokens` / `completion_tokens`, sodass transportspezifische
Feldnamen `/status`, `/usage` oder Sitzungszusammenfassungen nicht verändern.
Auch Gemini CLI JSON-Usage wird normalisiert: Antworttext stammt aus `response`, und
`stats.cached` wird auf `cacheRead` abgebildet, wobei `stats.input_tokens - stats.cached`
verwendet wird, wenn die CLI kein explizites Feld `stats.input` bereitstellt.
Für nativen Responses-Datenverkehr der OpenAI-Familie werden WebSocket-/SSE-Usage-Aliasse
auf dieselbe Weise normalisiert, und Gesamtsummen fallen auf normalisierten Input + Output zurück, wenn
`total_tokens` fehlt oder `0` ist.
Wenn der aktuelle Sitzungs-Snapshot spärlich ist, können `/status` und `session_status`
auch Token-/Cache-Zähler und das aktive Laufzeit-Modell-Label aus dem neuesten Usage-Log des Transkripts wiederherstellen. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang vor Fallback-Werten aus dem Transkript, und größere promptorientierte
Transkript-Gesamtsummen können gewinnen, wenn gespeicherte Gesamtsummen fehlen oder kleiner sind.
Usage-Auth für Provider-Quota-Fenster stammt aus providerspezifischen Hooks, wenn verfügbar;
andernfalls greift OpenClaw auf passende OAuth-/API-Key-Anmeldedaten aus Auth-Profilen, Env oder Config zurück.

## Kostenschätzung (wenn angezeigt)

Kosten werden anhand Ihrer Konfiguration für Modellpreise geschätzt:

```
models.providers.<provider>.models[].cost
```

Dies sind **USD pro 1 Mio. Tokens** für `input`, `output`, `cacheRead` und
`cacheWrite`. Wenn Preisangaben fehlen, zeigt OpenClaw nur Tokens an. OAuth-Tokens
zeigen niemals Dollar-Kosten.

## Auswirkungen von Cache-TTL und Pruning

Provider-Prompt-Caching gilt nur innerhalb des Cache-TTL-Fensters. OpenClaw kann
optional **Cache-TTL-Pruning** ausführen: Es pruned die Sitzung, sobald die Cache-TTL
abgelaufen ist, und setzt dann das Cache-Fenster zurück, sodass nachfolgende Anfragen den
frisch gecachten Kontext wiederverwenden können, statt den vollständigen Verlauf erneut zu cachen. Dadurch bleiben die
Cache-Schreibkosten niedriger, wenn eine Sitzung länger als die TTL inaktiv bleibt.

Konfigurieren Sie dies in [Gateway-Konfiguration](/de/gateway/configuration) und lesen Sie die
Verhaltensdetails unter [Session pruning](/de/concepts/session-pruning).

Heartbeat kann den Cache über Leerlaufphasen hinweg **warm** halten. Wenn die Cache-TTL Ihres Modells
`1h` beträgt, kann das Setzen des Heartbeat-Intervalls knapp darunter (z. B. `55m`) verhindern,
dass der vollständige Prompt erneut gecacht werden muss, wodurch Cache-Schreibkosten sinken.

In Multi-Agent-Setups können Sie eine gemeinsam genutzte Modellkonfiguration beibehalten und das Cache-Verhalten
pro Agent mit `agents.list[].params.cacheRetention` anpassen.

Eine vollständige Anleitung für jede einzelne Einstellung finden Sie unter [Prompt Caching](/de/reference/prompt-caching).

Bei den API-Preisen von Anthropic sind Cache-Reads deutlich günstiger als Input-
Tokens, während Cache-Writes mit einem höheren Multiplikator berechnet werden. Die aktuellen Preise und TTL-Multiplikatoren finden Sie in Anthropics
Preisen für Prompt-Caching:
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

### Beispiel: gemischter Datenverkehr mit Cache-Strategie pro Agent

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
        cacheRetention: "none" # Cache-Writes für burstartige Benachrichtigungen vermeiden
```

`agents.list[].params` wird zusätzlich zu den `params` des ausgewählten Modells zusammengeführt, sodass Sie
nur `cacheRetention` überschreiben und andere Modell-Standards unverändert erben können.

### Beispiel: Anthropic-1M-Context-Beta-Header aktivieren

Das 1M-Kontextfenster von Anthropic ist derzeit durch Beta-Gating geschützt. OpenClaw kann den
erforderlichen Wert für `anthropic-beta` injizieren, wenn Sie `context1m` auf unterstützten Opus-
oder Sonnet-Modellen aktivieren.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Dies wird auf Anthropics Beta-Header `context-1m-2025-08-07` abgebildet.

Dies gilt nur, wenn `context1m: true` für diesen Modelleintrag gesetzt ist.

Voraussetzung: Die Anmeldedaten müssen für die Nutzung von langem Kontext berechtigt sein. Wenn nicht,
antwortet Anthropic für diese Anfrage mit einem providerseitigen Ratenlimitfehler.

Wenn Sie Anthropic mit OAuth-/Subscription-Tokens (`sk-ant-oat-*`) authentifizieren,
überspringt OpenClaw den Beta-Header `context-1m-*`, weil Anthropic diese Kombination derzeit
mit HTTP 401 ablehnt.

## Tipps zur Reduzierung von Token-Druck

- Verwenden Sie `/compact`, um lange Sitzungen zusammenzufassen.
- Kürzen Sie große Tool-Ausgaben in Ihren Workflows.
- Senken Sie `agents.defaults.imageMaxDimensionPx` für screenshotlastige Sitzungen.
- Halten Sie Skill-Beschreibungen kurz (die Skills-Liste wird in den Prompt injiziert).
- Bevorzugen Sie kleinere Modelle für ausführliche, explorative Arbeit.

Die genaue Formel für den Overhead der Skills-Liste finden Sie unter [Skills](/de/tools/skills).
