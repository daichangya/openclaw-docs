---
read_when:
    - Sie möchten die Kosten für Prompt-Tokens mit Cache-Aufbewahrung reduzieren
    - Sie benötigen verhaltensspezifisches Caching pro Agent in Multi-Agent-Setups
    - Sie stimmen Heartbeat und Cache-TTL-Pruning gemeinsam ab
summary: Einstellungen für Prompt-Caching, Merge-Reihenfolge, Provider-Verhalten und Tuning-Muster
title: Prompt-Caching
x-i18n:
    generated_at: "2026-04-24T06:57:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534a5648db39dae0979bd8b84263f83332fbaa2dc2c0675409c307fa991c7c8
    source_path: reference/prompt-caching.md
    workflow: 15
---

Prompt-Caching bedeutet, dass der Modell-Provider unveränderte Prompt-Präfixe (normalerweise System-/Developer-Anweisungen und anderen stabilen Kontext) über mehrere Durchläufe hinweg wiederverwenden kann, statt sie jedes Mal erneut vollständig zu verarbeiten. OpenClaw normalisiert die Provider-Nutzung zu `cacheRead` und `cacheWrite`, wenn die Upstream-API diese Zähler direkt bereitstellt.

Statusoberflächen können Cache-Zähler auch aus dem neuesten Usage-Log im Transkript wiederherstellen, wenn sie im Live-Sitzungs-Snapshot fehlen, sodass `/status` auch nach teilweisem Verlust von Sitzungsmetadaten weiterhin eine Cache-Zeile anzeigen kann. Bereits vorhandene nicht nullwertige Live-Cache-Werte haben weiterhin Vorrang vor Fallback-Werten aus dem Transkript.

Warum das wichtig ist: geringere Token-Kosten, schnellere Antworten und vorhersehbarere Leistung bei lang laufenden Sitzungen. Ohne Caching zahlen wiederholte Prompts bei jedem Durchlauf die vollen Prompt-Kosten, selbst wenn sich der Großteil der Eingabe nicht geändert hat.

Diese Seite behandelt alle cachebezogenen Einstellungen, die die Wiederverwendung von Prompts und Token-Kosten beeinflussen.

Provider-Referenzen:

- Anthropic Prompt-Caching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI Prompt-Caching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI-API-Header und Anfrage-IDs: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic-Anfrage-IDs und Fehler: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Primäre Einstellungen

### `cacheRetention` (globaler Standard, Modell und pro Agent)

Setzen Sie die Cache-Aufbewahrung als globalen Standard für alle Modelle:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Überschreibung pro Modell:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Überschreibung pro Agent:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Merge-Reihenfolge der Konfiguration:

1. `agents.defaults.params` (globaler Standard — gilt für alle Modelle)
2. `agents.defaults.models["provider/model"].params` (Überschreibung pro Modell)
3. `agents.list[].params` (passende Agent-ID; überschreibt pro Schlüssel)

### `contextPruning.mode: "cache-ttl"`

Entfernt alten Tool-Ergebnis-Kontext nach Cache-TTL-Fenstern, damit Anfragen nach Leerlauf keinen übergroßen Verlauf erneut cachen.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Siehe [Session Pruning](/de/concepts/session-pruning) für das vollständige Verhalten.

### Heartbeat warm halten

Heartbeat kann Cache-Fenster warm halten und wiederholte Cache-Schreibvorgänge nach Leerlaufphasen reduzieren.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat pro Agent wird unter `agents.list[].heartbeat` unterstützt.

## Provider-Verhalten

### Anthropic (direkte API)

- `cacheRetention` wird unterstützt.
- Bei Anthropic-Auth-Profilen mit API-Key setzt OpenClaw standardmäßig `cacheRetention: "short"` für Anthropic-Modell-Refs, wenn es nicht gesetzt ist.
- Native Anthropic-Messages-Antworten stellen sowohl `cache_read_input_tokens` als auch `cache_creation_input_tokens` bereit, sodass OpenClaw sowohl `cacheRead` als auch `cacheWrite` anzeigen kann.
- Für native Anthropic-Anfragen bildet `cacheRetention: "short"` den standardmäßigen ephemeren 5-Minuten-Cache ab, und `cacheRetention: "long"` erhöht nur auf direkten `api.anthropic.com`-Hosts auf die 1-Stunden-TTL.

### OpenAI (direkte API)

- Prompt-Caching ist bei unterstützten aktuellen Modellen automatisch. OpenClaw muss keine Cache-Marker auf Blockebene injizieren.
- OpenClaw verwendet `prompt_cache_key`, um das Cache-Routing über mehrere Durchläufe hinweg stabil zu halten, und verwendet `prompt_cache_retention: "24h"` nur dann, wenn `cacheRetention: "long"` auf direkten OpenAI-Hosts ausgewählt ist.
- OpenAI-Antworten stellen gecachte Prompt-Tokens über `usage.prompt_tokens_details.cached_tokens` bereit (oder `input_tokens_details.cached_tokens` bei Responses-API-Ereignissen). OpenClaw ordnet das `cacheRead` zu.
- OpenAI stellt keinen separaten Token-Zähler für Cache-Schreibvorgänge bereit, daher bleibt `cacheWrite` auf OpenAI-Pfaden `0`, selbst wenn der Provider gerade einen Cache aufwärmt.
- OpenAI gibt nützliche Tracing- und Rate-Limit-Header wie `x-request-id`, `openai-processing-ms` und `x-ratelimit-*` zurück, aber die Erfassung von Cache-Treffern sollte aus der Usage-Payload stammen, nicht aus Headern.
- In der Praxis verhält sich OpenAI oft eher wie ein Initial-Präfix-Cache als wie eine Anthropic-artige gleitende Wiederverwendung des vollständigen Verlaufs. Stabile Textdurchläufe mit langem Präfix landen in aktuellen Live-Probes oft in der Nähe eines Plateaus von `4864` gecachten Tokens, während tool-lastige oder MCP-artige Transkripte oft selbst bei exakten Wiederholungen bei etwa `4608` gecachten Tokens plateauieren.

### Anthropic Vertex

- Anthropic-Modelle auf Vertex AI (`anthropic-vertex/*`) unterstützen `cacheRetention` genauso wie direktes Anthropic.
- `cacheRetention: "long"` bildet auf Vertex-AI-Endpunkten die echte 1-Stunden-TTL des Prompt-Caches ab.
- Die Standard-Cache-Aufbewahrung für `anthropic-vertex` entspricht den direkten Anthropic-Standards.
- Vertex-Anfragen werden durch ein boundary-bewusstes Cache-Shaping geleitet, sodass die Cache-Wiederverwendung mit dem übereinstimmt, was Provider tatsächlich erhalten.

### Amazon Bedrock

- Anthropic-Claude-Modell-Refs (`amazon-bedrock/*anthropic.claude*`) unterstützen explizites Durchreichen von `cacheRetention`.
- Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` gezwungen.

### OpenRouter-Anthropic-Modelle

Für Modell-Refs `openrouter/anthropic/*` injiziert OpenClaw Anthropic-
`cache_control` in System-/Developer-Prompt-Blöcke, um die Wiederverwendung des Prompt-Caches zu verbessern, jedoch nur dann, wenn die Anfrage weiterhin auf eine verifizierte OpenRouter-Route zielt
(`openrouter` auf seinem Standard-Endpunkt oder ein beliebiger Provider/eine beliebige Base-URL, die auf `openrouter.ai` aufgelöst wird).

Wenn Sie das Modell auf eine beliebige andere OpenAI-kompatible Proxy-URL umleiten, hört OpenClaw
auf, diese OpenRouter-spezifischen Anthropic-Cache-Marker zu injizieren.

### Andere Provider

Wenn der Provider diesen Cache-Modus nicht unterstützt, hat `cacheRetention` keine Wirkung.

### Direkte Google-Gemini-API

- Der direkte Gemini-Transport (`api: "google-generative-ai"`) meldet Cache-Treffer
  über Upstream-`cachedContentTokenCount`; OpenClaw ordnet dies `cacheRead` zu.
- Wenn `cacheRetention` auf einem direkten Gemini-Modell gesetzt ist, erstellt,
  verwendet und aktualisiert OpenClaw automatisch `cachedContents`-Ressourcen für System-Prompts
  bei Google-AI-Studio-Läufen. Das bedeutet, dass Sie keinen
  Cached-Content-Handle mehr manuell vorerstellen müssen.
- Sie können weiterhin einen bereits bestehenden Gemini-Cached-Content-Handle
  als `params.cachedContent` (oder veraltet `params.cached_content`) am konfigurierten
  Modell durchreichen.
- Das ist getrennt von Anthropic-/OpenAI-Prompt-Präfix-Caching. Für Gemini
  verwaltet OpenClaw eine provider-native Ressource `cachedContents`, statt
  Cache-Marker in die Anfrage zu injizieren.

### Gemini-CLI-JSON-Usage

- Gemini-CLI-JSON-Ausgabe kann Cache-Treffer auch über `stats.cached` anzeigen;
  OpenClaw ordnet dies `cacheRead` zu.
- Wenn die CLI keinen direkten `stats.input`-Wert ausgibt, leitet OpenClaw
  Eingabe-Tokens aus `stats.input_tokens - stats.cached` ab.
- Dies ist nur Usage-Normalisierung. Es bedeutet nicht, dass OpenClaw
  Anthropic-/OpenAI-artige Prompt-Cache-Marker für Gemini CLI erstellt.

## Cache-Grenze des System-Prompts

OpenClaw teilt den System-Prompt in ein **stabiles Präfix** und ein **volatiles
Suffix**, getrennt durch eine interne Cache-Präfix-Grenze. Inhalte oberhalb der
Grenze (Tool-Definitionen, Skills-Metadaten, Workspace-Dateien und anderer
relativ statischer Kontext) werden so geordnet, dass sie über mehrere Durchläufe hinweg byteidentisch bleiben.
Inhalte unterhalb der Grenze (zum Beispiel `HEARTBEAT.md`, Laufzeit-Zeitstempel und
andere Metadaten pro Durchlauf) dürfen sich ändern, ohne das gecachte
Präfix ungültig zu machen.

Wichtige Designentscheidungen:

- Stabile Projektkontext-Dateien im Workspace werden vor `HEARTBEAT.md` geordnet, sodass
  Heartbeat-Änderungen das stabile Präfix nicht ungültig machen.
- Die Grenze wird über Cache-Shaping für Anthropic-Familie, OpenAI-Familie, Google und
  CLI-Transport angewendet, sodass alle unterstützten Provider von derselben Präfix-
  Stabilität profitieren.
- Codex-Responses- und Anthropic-Vertex-Anfragen werden durch
  boundary-bewusstes Cache-Shaping geleitet, sodass die Cache-Wiederverwendung mit dem
  übereinstimmt, was Provider tatsächlich erhalten.
- Fingerprints von System-Prompts werden normalisiert (Whitespace, Zeilenenden,
  durch Hooks hinzugefügter Kontext, Reihenfolge von Laufzeitfähigkeiten), sodass semantisch unveränderte
  Prompts sich KV/Cache über mehrere Durchläufe teilen.

Wenn Sie unerwartete `cacheWrite`-Spitzen nach einer Konfigurations- oder Workspace-Änderung sehen,
prüfen Sie, ob die Änderung oberhalb oder unterhalb der Cache-Grenze liegt. Das Verschieben
volatiler Inhalte unter die Grenze (oder ihre Stabilisierung) löst das Problem häufig.

## Cache-Stabilitäts-Schutzmechanismen von OpenClaw

OpenClaw hält auch mehrere cache-sensitive Payload-Formen deterministisch, bevor
die Anfrage den Provider erreicht:

- Gebündelte MCP-Tool-Kataloge werden vor der Tool-
  Registrierung deterministisch sortiert, sodass Änderungen an der Reihenfolge von `listTools()` den Tool-Block
  nicht verändern und Prompt-Cache-Präfixe nicht ungültig machen.
- Veraltete Sitzungen mit persistierten Bildblöcken behalten die **3 neuesten
  abgeschlossenen Durchläufe** intakt; ältere bereits verarbeitete Bildblöcke können
  durch eine Markierung ersetzt werden, sodass bildlastige Follow-ups nicht immer wieder große
  veraltete Payloads erneut senden.

## Tuning-Muster

### Gemischter Verkehr (empfohlener Standard)

Behalten Sie eine langlebige Basis auf Ihrem Hauptagenten bei und deaktivieren Sie Caching auf burstigen Benachrichtigungsagenten:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Kostenorientierte Basis

- Setzen Sie die Basis auf `cacheRetention: "short"`.
- Aktivieren Sie `contextPruning.mode: "cache-ttl"`.
- Halten Sie Heartbeat nur bei Agenten unterhalb Ihrer TTL, die von warmen Caches profitieren.

## Cache-Diagnose

OpenClaw stellt dedizierte Cache-Trace-Diagnosen für eingebettete Agent-Läufe bereit.

Für normale benutzerseitige Diagnosen können `/status` und andere Usage-Zusammenfassungen
den neuesten Usage-Eintrag aus dem Transkript als Fallback-Quelle für `cacheRead` /
`cacheWrite` verwenden, wenn der Live-Sitzungseintrag diese Zähler nicht hat.

## Live-Regressionstests

OpenClaw hält ein kombiniertes Live-Regression-Gate für Cache für wiederholte Präfixe, Tool-Durchläufe, Bild-Durchläufe, MCP-artige Tool-Transkripte und eine Anthropic-Kontrolle ohne Cache.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Führen Sie das schmale Live-Gate aus mit:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Die Baseline-Datei speichert die zuletzt beobachteten Live-Zahlen sowie die providerspezifischen Regressionsuntergrenzen, die vom Test verwendet werden.
Der Runner verwendet außerdem frische Sitzungs-IDs und Prompt-Namensräume pro Lauf, sodass vorheriger Cache-Status die aktuelle Regressionsprobe nicht verfälscht.

Diese Tests verwenden absichtlich keine identischen Erfolgskriterien über Provider hinweg.

### Anthropic-Live-Erwartungen

- Erwarten Sie explizite Aufwärm-Schreibvorgänge über `cacheWrite`.
- Erwarten Sie nahezu vollständige Wiederverwendung des gesamten Verlaufs bei wiederholten Durchläufen, da die Anthropic-Cache-Steuerung den Cache-Breakpoint durch die Unterhaltung fortschiebt.
- Die aktuellen Live-Assertions verwenden weiterhin hohe Trefferquotenschwellen für stabile, Tool- und Bild-Pfade.

### OpenAI-Live-Erwartungen

- Erwarten Sie nur `cacheRead`. `cacheWrite` bleibt `0`.
- Behandeln Sie die Cache-Wiederverwendung bei wiederholten Durchläufen als providerspezifisches Plateau, nicht als Anthropic-artige gleitende Wiederverwendung des gesamten Verlaufs.
- Aktuelle Live-Assertions verwenden konservative Untergrenzen, die aus beobachtetem Live-Verhalten auf `gpt-5.4-mini` abgeleitet wurden:
  - stabiles Präfix: `cacheRead >= 4608`, Trefferquote `>= 0.90`
  - Tool-Transkript: `cacheRead >= 4096`, Trefferquote `>= 0.85`
  - Bild-Transkript: `cacheRead >= 3840`, Trefferquote `>= 0.82`
  - MCP-artiges Transkript: `cacheRead >= 4096`, Trefferquote `>= 0.85`

Die frische kombinierte Live-Verifikation am 2026-04-04 ergab:

- stabiles Präfix: `cacheRead=4864`, Trefferquote `0.966`
- Tool-Transkript: `cacheRead=4608`, Trefferquote `0.896`
- Bild-Transkript: `cacheRead=4864`, Trefferquote `0.954`
- MCP-artiges Transkript: `cacheRead=4608`, Trefferquote `0.891`

Die jüngste lokale Wall-Clock-Zeit für das kombinierte Gate lag bei etwa `88s`.

Warum sich die Assertions unterscheiden:

- Anthropic stellt explizite Cache-Breakpoints und gleitende Wiederverwendung des Gesprächsverlaufs bereit.
- OpenAI-Prompt-Caching ist weiterhin exakt präfixsensitiv, aber das effektiv wiederverwendbare Präfix im Live-Responses-Verkehr kann früher plateauieren als der vollständige Prompt.
- Deshalb erzeugt der Vergleich von Anthropic und OpenAI mit einem einzigen providerübergreifenden Prozentschwellenwert falsche Regressionen.

### Konfiguration `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # Standard true
    includePrompt: false # Standard true
    includeSystem: false # Standard true
```

Standardwerte:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Env-Schalter (einmaliges Debugging)

- `OPENCLAW_CACHE_TRACE=1` aktiviert Cache-Tracing.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` überschreibt den Ausgabepfad.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` schaltet die Erfassung vollständiger Nachrichten-Payloads um.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` schaltet die Erfassung von Prompt-Text um.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` schaltet die Erfassung von System-Prompts um.

### Was zu prüfen ist

- Cache-Trace-Ereignisse sind JSONL und enthalten gestufte Snapshots wie `session:loaded`, `prompt:before`, `stream:context` und `session:after`.
- Die Auswirkung von Cache-Tokens pro Durchlauf ist in normalen Usage-Oberflächen über `cacheRead` und `cacheWrite` sichtbar (zum Beispiel `/usage full` und Zusammenfassungen zur Sitzungsnutzung).
- Bei Anthropic erwarten Sie sowohl `cacheRead` als auch `cacheWrite`, wenn Caching aktiv ist.
- Bei OpenAI erwarten Sie bei Cache-Treffern `cacheRead`, während `cacheWrite` `0` bleibt; OpenAI veröffentlicht kein separates Feld für Cache-Schreib-Tokens.
- Wenn Sie Request-Tracing benötigen, protokollieren Sie Anfrage-IDs und Rate-Limit-Header getrennt von Cache-Metriken. Die aktuelle Cache-Trace-Ausgabe von OpenClaw konzentriert sich auf Prompt-/Sitzungsform und normalisierte Token-Nutzung statt auf rohe Antwort-Header des Providers.

## Schnelle Fehlerbehebung

- Hoher `cacheWrite` bei den meisten Durchläufen: prüfen Sie auf volatile Eingaben im System-Prompt und verifizieren Sie, dass Modell/Provider Ihre Cache-Einstellungen unterstützt.
- Hoher `cacheWrite` bei Anthropic: bedeutet oft, dass der Cache-Breakpoint auf Inhalt landet, der sich bei jeder Anfrage ändert.
- Niedriger `cacheRead` bei OpenAI: verifizieren Sie, dass das stabile Präfix am Anfang steht, das wiederholte Präfix mindestens 1024 Tokens umfasst und derselbe `prompt_cache_key` für Durchläufe wiederverwendet wird, die sich einen Cache teilen sollen.
- Keine Wirkung von `cacheRetention`: bestätigen Sie, dass der Modellschlüssel zu `agents.defaults.models["provider/model"]` passt.
- Bedrock-Nova-/Mistral-Anfragen mit Cache-Einstellungen: erwartetes Erzwingen auf `none` zur Laufzeit.

Verwandte Dokumentation:

- [Anthropic](/de/providers/anthropic)
- [Token Use and Costs](/de/reference/token-use)
- [Session Pruning](/de/concepts/session-pruning)
- [Gateway Configuration Reference](/de/gateway/configuration-reference)

## Verwandt

- [Token use and costs](/de/reference/token-use)
- [API usage and costs](/de/reference/api-usage-costs)
