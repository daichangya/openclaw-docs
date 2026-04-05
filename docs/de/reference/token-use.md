---
read_when:
    - Token-Nutzung, Kosten oder Kontextfenster erklären
    - Wachstum des Kontexts oder Kompaktierungsverhalten debuggen
summary: Wie OpenClaw Prompt-Kontext aufbaut und Token-Nutzung + Kosten meldet
title: Token-Nutzung und Kosten
x-i18n:
    generated_at: "2026-04-05T12:55:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e7a0ac0311298cf1484d663799a3f5a9687dd5afc9702233e983aba1979f1d
    source_path: reference/token-use.md
    workflow: 15
---

# Token-Nutzung und Kosten

OpenClaw verfolgt **Tokens**, nicht Zeichen. Tokens sind modellspezifisch, aber die meisten
Modelle im OpenAI-Stil liegen bei englischem Text im Durchschnitt bei ~4 Zeichen pro Token.

## Wie der System-Prompt aufgebaut wird

OpenClaw setzt seinen eigenen System-Prompt bei jeder Ausführung zusammen. Er enthält:

- Tool-Liste + kurze Beschreibungen
- Skills-Liste (nur Metadaten; Anweisungen werden bei Bedarf mit `read` geladen)
- Anweisungen zur Selbstaktualisierung
- Arbeitsbereichs- + Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, wenn neu, plus `MEMORY.md`, wenn vorhanden, oder `memory.md` als Fallback in Kleinbuchstaben). Große Dateien werden durch `agents.defaults.bootstrapMaxChars` (Standard: 20000) abgeschnitten, und die gesamte Bootstrap-Injektion ist durch `agents.defaults.bootstrapTotalMaxChars` (Standard: 150000) begrenzt. `memory/*.md`-Dateien werden bei Bedarf über Memory-Tools geladen und nicht automatisch injiziert.
- Zeit (UTC + Benutzerzeitzone)
- Antwort-Tags + Heartbeat-Verhalten
- Laufzeit-Metadaten (Host/OS/Modell/Thinking)

Die vollständige Aufschlüsselung finden Sie unter [System Prompt](/de/concepts/system-prompt).

## Was im Kontextfenster zählt

Alles, was das Modell erhält, zählt zum Kontextlimit:

- System-Prompt (alle oben aufgeführten Abschnitte)
- Gesprächsverlauf (Benutzer- + Assistentennachrichten)
- Tool-Calls und Tool-Ergebnisse
- Anhänge/Transkripte (Bilder, Audio, Dateien)
- Kompaktierungszusammenfassungen und Pruning-Artefakte
- Provider-Wrapper oder Sicherheits-Header (nicht sichtbar, zählen aber trotzdem)

Bei Bildern skaliert OpenClaw Bild-Nutzlasten aus Transkripten/Tools vor Provider-Aufrufen herunter.
Verwenden Sie `agents.defaults.imageMaxDimensionPx` (Standard: `1200`), um dies abzustimmen:

- Niedrigere Werte reduzieren in der Regel die Nutzung von Vision-Tokens und die Nutzlastgröße.
- Höhere Werte bewahren mehr visuelle Details für OCR-/UI-lastige Screenshots.

Eine praktische Aufschlüsselung (pro injizierter Datei, Tools, Skills und System-Prompt-Größe) erhalten Sie mit `/context list` oder `/context detail`. Siehe [Kontext](/de/concepts/context).

## So sehen Sie die aktuelle Token-Nutzung

Verwenden Sie dazu im Chat:

- `/status` → **statuskarte mit vielen Emojis** mit Sitzungsmodell, Kontextnutzung,
  Input-/Output-Tokens der letzten Antwort und **geschätzten Kosten** (nur API-Schlüssel).
- `/usage off|tokens|full` → hängt an jede Antwort eine **Nutzungsfußzeile pro Antwort** an.
  - Wird pro Sitzung persistent gespeichert (gespeichert als `responseUsage`).
  - OAuth-Authentifizierung **blendet Kosten aus** (nur Tokens).
- `/usage cost` → zeigt eine lokale Kostenzusammenfassung aus den OpenClaw-Sitzungsprotokollen.

Weitere Oberflächen:

- **TUI/Web-TUI:** `/status` + `/usage` werden unterstützt.
- **CLI:** `openclaw status --usage` und `openclaw channels list` zeigen
  normalisierte Provider-Quotenfenster (`X% left`, keine Kosten pro Antwort).
  Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.

Nutzungsoberflächen normalisieren allgemeine aliasierte Felder nativer Provider vor der Anzeige.
Für OpenAI-Family-Responses-Datenverkehr umfasst das sowohl `input_tokens` /
`output_tokens` als auch `prompt_tokens` / `completion_tokens`, sodass transportspezifische
Feldnamen `/status`, `/usage` oder Sitzungszusammenfassungen nicht verändern.
Auch die JSON-Nutzung von Gemini CLI wird normalisiert: Antworttext kommt aus `response`, und
`stats.cached` wird auf `cacheRead` abgebildet, wobei `stats.input_tokens - stats.cached`
verwendet wird, wenn die CLI kein explizites Feld `stats.input` ausgibt.
Für nativen OpenAI-Family-Responses-Datenverkehr werden WebSocket-/SSE-Nutzungsaliase auf dieselbe Weise
normalisiert, und Summen greifen auf normalisierte Input- + Output-Werte zurück, wenn
`total_tokens` fehlt oder `0` ist.
Wenn der aktuelle Sitzungs-Snapshot spärlich ist, können `/status` und `session_status`
auch Token-/Cache-Zähler und das aktive Laufzeitmodell-Label aus dem neuesten Nutzungsprotokoll des Transkripts wiederherstellen. Bestehende Live-Werte ungleich null haben weiterhin Vorrang vor Fallback-Werten aus dem Transkript, und größere promptorientierte
Transkript-Gesamtsummen können gewinnen, wenn gespeicherte Summen fehlen oder kleiner sind.
Die Nutzungsauthentifizierung für Provider-Quotenfenster stammt aus providerspezifischen Hooks, wenn verfügbar;
andernfalls greift OpenClaw auf passende OAuth-/API-Key-Anmeldedaten aus Authentifizierungsprofilen, Umgebung oder Konfiguration zurück.

## Kostenschätzung (wenn angezeigt)

Kosten werden aus Ihrer Preiskonfiguration für Modelle geschätzt:

```
models.providers.<provider>.models[].cost
```

Dies sind **USD pro 1 Mio. Tokens** für `input`, `output`, `cacheRead` und
`cacheWrite`. Wenn Preisangaben fehlen, zeigt OpenClaw nur Tokens an. OAuth-Tokens
zeigen niemals Dollarkosten an.

## Auswirkungen von Cache-TTL und Pruning

Provider-Prompt-Caching gilt nur innerhalb des Cache-TTL-Fensters. OpenClaw kann
optional **Cache-TTL-Pruning** ausführen: Die Sitzung wird gekürzt, sobald die Cache-TTL
abgelaufen ist, und danach wird das Cache-Fenster zurückgesetzt, sodass nachfolgende Anfragen
den frisch gecachten Kontext wiederverwenden können, anstatt den gesamten Verlauf erneut zu cachen. Dadurch bleiben die Cache-Schreibkosten niedriger, wenn eine Sitzung über die TTL hinaus untätig bleibt.

Konfigurieren Sie dies unter [Gateway-Konfiguration](/de/gateway/configuration) und lesen Sie
die Verhaltensdetails unter [Session-Pruning](/de/concepts/session-pruning).

Heartbeat kann den Cache über Leerlaufphasen hinweg **warm** halten. Wenn Ihr Modell-Cache-TTL
`1h` beträgt, kann das Setzen des Heartbeat-Intervalls knapp darunter (z. B. `55m`) ein erneutes
Cachen des vollständigen Prompts vermeiden und so Cache-Schreibkosten reduzieren.

In Multi-Agent-Setups können Sie eine gemeinsame Modellkonfiguration beibehalten und das Cache-Verhalten
pro Agent mit `agents.list[].params.cacheRetention` abstimmen.

Eine vollständige, schalterweise Anleitung finden Sie unter [Prompt Caching](/reference/prompt-caching).

Bei den Anthropic-API-Preisen sind Cache-Lesevorgänge deutlich günstiger als Input-
Tokens, während Cache-Schreibvorgänge mit einem höheren Multiplikator berechnet werden. Die aktuellen Preise und TTL-Multiplikatoren finden Sie in den Anthropic-Preisen für Prompt-Caching:
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
          cacheRetention: "long" # Standardbasis für die meisten Agenten
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # langen Cache für tiefe Sitzungen warm halten
    - id: "alerts"
      params:
        cacheRetention: "none" # Cache-Schreibvorgänge für sprunghafte Benachrichtigungen vermeiden
```

`agents.list[].params` wird über `params` des ausgewählten Modells zusammengeführt, sodass Sie nur `cacheRetention`
überschreiben und andere Modellstandards unverändert erben können.

### Beispiel: Anthropic-1M-Kontext-Beta-Header aktivieren

Das 1M-Kontextfenster von Anthropic ist derzeit durch Beta-Zugriff eingeschränkt. OpenClaw kann den
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

Dies wird auf den Anthropic-Beta-Header `context-1m-2025-08-07` abgebildet.

Dies gilt nur, wenn `context1m: true` für diesen Modelleintrag gesetzt ist.

Anforderung: Die Anmeldedaten müssen für Long-Context-Nutzung berechtigt sein (API-Key-
Abrechnung oder der Claude-Login-Pfad von OpenClaw mit aktiviertem Extra Usage). Andernfalls
antwortet Anthropic
mit `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Wenn Sie Anthropic mit OAuth-/Abonnement-Tokens (`sk-ant-oat-*`) authentifizieren,
überspringt OpenClaw den Beta-Header `context-1m-*`, weil Anthropic diese Kombination derzeit
mit HTTP 401 ablehnt.

## Tipps zur Verringerung des Token-Drucks

- Verwenden Sie `/compact`, um lange Sitzungen zusammenzufassen.
- Kürzen Sie große Tool-Ausgaben in Ihren Workflows.
- Senken Sie `agents.defaults.imageMaxDimensionPx` für sitzungen mit vielen Screenshots.
- Halten Sie Skill-Beschreibungen kurz (die Skills-Liste wird in den Prompt injiziert).
- Verwenden Sie für ausführliche, explorative Arbeit lieber kleinere Modelle.

Siehe [Skills](/tools/skills) für die genaue Formel des Overheads der Skills-Liste.
