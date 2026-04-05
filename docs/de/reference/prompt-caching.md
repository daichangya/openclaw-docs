---
read_when:
    - Sie möchten Prompt-Token-Kosten mit Cache-Aufbewahrung senken
    - Sie benötigen agentenspezifisches Cache-Verhalten in Multi-Agent-Setups
    - Sie stimmen Heartbeat und cache-ttl-Pruning gemeinsam ab
summary: Schalter für Prompt-Caching, Merge-Reihenfolge, Provider-Verhalten und Tuning-Muster
title: Prompt-Caching
x-i18n:
    generated_at: "2026-04-05T12:55:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13d5f3153b6593ae22cd04a6c2540e074cf15df9f1990fc5b7184fe803f4a1bd
    source_path: reference/prompt-caching.md
    workflow: 15
---

# Prompt-Caching

Prompt-Caching bedeutet, dass der Modell-Provider unveränderte Prompt-Präfixe (normalerweise System-/Developer-Anweisungen und anderen stabilen Kontext) über mehrere Turns hinweg wiederverwenden kann, statt sie jedes Mal neu zu verarbeiten. OpenClaw normalisiert die Provider-Nutzung zu `cacheRead` und `cacheWrite`, wenn die Upstream-API diese Zähler direkt bereitstellt.

Statusoberflächen können Cache-Zähler auch aus dem neuesten Nutzungsprotokoll des Transkripts wiederherstellen, wenn sie im Live-Sitzungs-Snapshot fehlen, sodass `/status` weiterhin eine Cache-Zeile anzeigen kann, auch wenn Sitzungsmetadaten teilweise verloren gegangen sind. Bereits vorhandene Live-Cache-Werte ungleich null haben weiterhin Vorrang vor Fallback-Werten aus dem Transkript.

Warum das wichtig ist: geringere Token-Kosten, schnellere Antworten und besser vorhersehbare Leistung für lang laufende Sitzungen. Ohne Caching zahlen wiederholte Prompts bei jedem Turn die vollen Prompt-Kosten, selbst wenn sich der größte Teil der Eingabe nicht geändert hat.

Diese Seite behandelt alle cachebezogenen Schalter, die die Prompt-Wiederverwendung und Token-Kosten beeinflussen.

Provider-Referenzen:

- Anthropic Prompt-Caching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI Prompt-Caching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI-API-Header und Request-IDs: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic-Request-IDs und Fehler: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Primäre Schalter

### `cacheRetention` (globaler Standard, Modell und pro Agent)

Legen Sie die Cache-Aufbewahrung als globalen Standard für alle Modelle fest:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Pro Modell überschreiben:

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

Konfigurations-Merge-Reihenfolge:

1. `agents.defaults.params` (globaler Standard — gilt für alle Modelle)
2. `agents.defaults.models["provider/model"].params` (modellspezifische Überschreibung)
3. `agents.list[].params` (passende Agent-ID; überschreibt nach Schlüssel)

### `contextPruning.mode: "cache-ttl"`

Entfernt alten Tool-Ergebnis-Kontext nach Cache-TTL-Fenstern, damit Anfragen nach Leerlaufphasen keinen übergroßen Verlauf erneut cachen.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Vollständiges Verhalten siehe [Sitzungs-Pruning](/de/concepts/session-pruning).

### Heartbeat zum Warmhalten

Heartbeat kann Cache-Fenster warm halten und wiederholte Cache-Schreibvorgänge nach Leerlaufphasen reduzieren.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Agentenspezifischer Heartbeat wird unter `agents.list[].heartbeat` unterstützt.

## Provider-Verhalten

### Anthropic (direkte API)

- `cacheRetention` wird unterstützt.
- Bei Anthropic-Auth-Profilen mit API-Schlüssel setzt OpenClaw `cacheRetention: "short"` für Anthropic-Modellreferenzen, wenn kein Wert gesetzt ist.
- Native Anthropic-Messages-Antworten geben sowohl `cache_read_input_tokens` als auch `cache_creation_input_tokens` aus, sodass OpenClaw sowohl `cacheRead` als auch `cacheWrite` anzeigen kann.
- Für native Anthropic-Anfragen entspricht `cacheRetention: "short"` dem standardmäßigen kurzlebigen 5-Minuten-Cache, und `cacheRetention: "long"` erweitert nur auf direkten Hosts unter `api.anthropic.com` auf die 1-Stunden-TTL.

### OpenAI (direkte API)

- Prompt-Caching erfolgt auf unterstützten aktuellen Modellen automatisch. OpenClaw muss keine Cache-Marker auf Blockebene einfügen.
- OpenClaw verwendet `prompt_cache_key`, um das Cache-Routing über mehrere Turns stabil zu halten, und verwendet `prompt_cache_retention: "24h"` nur dann, wenn `cacheRetention: "long"` auf direkten OpenAI-Hosts ausgewählt ist.
- OpenAI-Antworten geben gecachte Prompt-Token über `usage.prompt_tokens_details.cached_tokens` aus (oder `input_tokens_details.cached_tokens` bei Responses-API-Ereignissen). OpenClaw ordnet dies `cacheRead` zu.
- OpenAI gibt keinen separaten Zähler für Cache-Schreib-Token aus, daher bleibt `cacheWrite` auf OpenAI-Pfaden auch dann `0`, wenn der Provider einen Cache aufwärmt.
- OpenAI gibt nützliche Tracing- und Rate-Limit-Header wie `x-request-id`, `openai-processing-ms` und `x-ratelimit-*` zurück, aber die Berechnung von Cache-Treffern sollte aus dem Usage-Payload kommen, nicht aus Headern.
- In der Praxis verhält sich OpenAI oft eher wie ein Anfangs-Präfix-Cache als wie eine Anthropic-artige Wiederverwendung des vollständigen beweglichen Verlaufs. Stabile Text-Turns mit langem Präfix landen in aktuellen Live-Probes oft nahe einem Plateau von `4864` gecachten Tokens, während tool-lastige oder MCP-artige Transkripte selbst bei exakten Wiederholungen oft eher bei `4608` gecachten Tokens plateauieren.

### Anthropic Vertex

- Anthropic-Modelle auf Vertex AI (`anthropic-vertex/*`) unterstützen `cacheRetention` genauso wie direktes Anthropic.
- `cacheRetention: "long"` entspricht auf Vertex-AI-Endpunkten der echten 1-Stunden-TTL für Prompt-Caches.
- Die Standard-Cache-Aufbewahrung für `anthropic-vertex` entspricht den direkten Anthropic-Standards.
- Vertex-Anfragen werden durch boundary-bewusstes Cache-Shaping geleitet, sodass die Cache-Wiederverwendung mit dem übereinstimmt, was Provider tatsächlich erhalten.

### Amazon Bedrock

- Anthropic-Claude-Modellreferenzen (`amazon-bedrock/*anthropic.claude*`) unterstützen die explizite Durchreichung von `cacheRetention`.
- Nicht-Anthropic-Bedrock-Modelle werden zur Laufzeit auf `cacheRetention: "none"` erzwungen.

### OpenRouter-Anthropic-Modelle

Für Modellreferenzen vom Typ `openrouter/anthropic/*` fügt OpenClaw Anthropic-
`cache_control` in Blöcke des System-/Developer-Prompts ein, um die Wiederverwendung des Prompt-Caches zu verbessern, jedoch nur dann, wenn die Anfrage weiterhin auf eine verifizierte OpenRouter-Route zeigt (`openrouter` auf dem Standardendpunkt oder beliebige Provider-/Base-URL, die zu `openrouter.ai` aufgelöst wird).

Wenn Sie das Modell auf eine beliebige andere OpenAI-kompatible Proxy-URL umstellen, fügt OpenClaw diese OpenRouter-spezifischen Anthropic-Cache-Marker nicht mehr ein.

### Andere Provider

Wenn der Provider diesen Cache-Modus nicht unterstützt, hat `cacheRetention` keine Wirkung.

### Google-Gemini-Direkt-API

- Der direkte Gemini-Transport (`api: "google-generative-ai"`) meldet Cache-Treffer über das Upstream-Feld `cachedContentTokenCount`; OpenClaw ordnet dies `cacheRead` zu.
- Wenn `cacheRetention` für ein direktes Gemini-Modell gesetzt ist, erstellt, verwendet und aktualisiert OpenClaw automatisch `cachedContents`-Ressourcen für System-Prompts bei Google-AI-Studio-Läufen. Sie müssen also keinen Handle für gecachte Inhalte mehr manuell vorab erstellen.
- Sie können weiterhin einen bereits vorhandenen Gemini-Handle für gecachte Inhalte als `params.cachedContent` (oder legacy `params.cached_content`) für das konfigurierte Modell durchreichen.
- Das ist getrennt vom Anthropic-/OpenAI-Prompt-Präfix-Caching. Bei Gemini verwaltet OpenClaw eine providereigene `cachedContents`-Ressource, statt Cache-Marker in die Anfrage einzufügen.

### Gemini-CLI-JSON-Nutzung

- Die Gemini-CLI-JSON-Ausgabe kann Cache-Treffer auch über `stats.cached` anzeigen; OpenClaw ordnet dies `cacheRead` zu.
- Wenn die CLI keinen direkten Wert für `stats.input` ausgibt, leitet OpenClaw die Eingabe-Tokens aus `stats.input_tokens - stats.cached` ab.
- Dies ist nur eine Nutzungsnormalisierung. Es bedeutet nicht, dass OpenClaw Anthropic-/OpenAI-artige Prompt-Cache-Marker für Gemini CLI erstellt.

## Cache-Grenze für System-Prompts

OpenClaw teilt den System-Prompt in ein **stabiles Präfix** und ein **volatiles Suffix**, getrennt durch eine interne Cache-Präfix-Grenze. Inhalte oberhalb der Grenze (Tool-Definitionen, Skills-Metadaten, Workspace-Dateien und anderer relativ statischer Kontext) werden so angeordnet, dass sie über mehrere Turns hinweg bytegenau identisch bleiben. Inhalte unterhalb der Grenze (zum Beispiel `HEARTBEAT.md`, Runtime-Zeitstempel und andere Metadaten pro Turn) dürfen sich ändern, ohne das gecachte Präfix zu invalidieren.

Wichtige Designentscheidungen:

- Stabile Workspace-Dateien des Projektkontexts werden vor `HEARTBEAT.md` angeordnet, damit Heartbeat-Änderungen das stabile Präfix nicht zerstören.
- Die Grenze wird über Anthropic-Familie, OpenAI-Familie, Google und CLI-Transport-Shaping hinweg angewendet, sodass alle unterstützten Provider von derselben Präfix-Stabilität profitieren.
- Codex-Responses- und Anthropic-Vertex-Anfragen werden durch boundary-bewusstes Cache-Shaping geleitet, damit die Cache-Wiederverwendung mit dem übereinstimmt, was Provider tatsächlich erhalten.
- Fingerprints von System-Prompts werden normalisiert (Whitespace, Zeilenenden, durch Hooks hinzugefügter Kontext, Reihenfolge von Runtime-Fähigkeiten), sodass semantisch unveränderte Prompts KV-/Cache über mehrere Turns hinweg gemeinsam nutzen.

Wenn Sie nach einer Konfigurations- oder Workspace-Änderung unerwartete `cacheWrite`-Spitzen sehen, prüfen Sie, ob die Änderung oberhalb oder unterhalb der Cache-Grenze liegt. Volatile Inhalte unter die Grenze zu verschieben (oder sie zu stabilisieren) löst das Problem oft.

## OpenClaw-Schutzmechanismen für Cache-Stabilität

OpenClaw hält außerdem mehrere cacheempfindliche Payload-Formen deterministisch, bevor die Anfrage den Provider erreicht:

- Gebündelte MCP-Tool-Kataloge werden vor der Tool-Registrierung deterministisch sortiert, sodass Änderungen in der Reihenfolge von `listTools()` den Tool-Block nicht verändern und Prompt-Cache-Präfixe nicht zerstören.
- Legacy-Sitzungen mit persistenten Image-Blöcken behalten die **3 neuesten abgeschlossenen Turns** unverändert bei; ältere, bereits verarbeitete Image-Blöcke können durch einen Marker ersetzt werden, damit bildlastige Folgeanfragen nicht weiterhin große veraltete Payloads erneut senden.

## Tuning-Muster

### Gemischter Verkehr (empfohlener Standard)

Behalten Sie eine langlebige Basis auf Ihrem Haupt-Agenten bei und deaktivieren Sie Caching auf burstigen Benachrichtigungs-Agenten:

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

- Setzen Sie als Basis `cacheRetention: "short"`.
- Aktivieren Sie `contextPruning.mode: "cache-ttl"`.
- Halten Sie den Heartbeat nur bei den Agenten unter Ihrer TTL, die von warmen Caches profitieren.

## Cache-Diagnose

OpenClaw stellt dedizierte Cache-Trace-Diagnosen für eingebettete Agent-Läufe bereit.

Für normale nutzerseitige Diagnose können `/status` und andere Nutzungszusammenfassungen den neuesten Nutzungseintrag des Transkripts als Fallback-Quelle für `cacheRead` / `cacheWrite` verwenden, wenn diese Zähler im Live-Sitzungseintrag fehlen.

## Live-Regressionstests

OpenClaw führt ein kombiniertes Live-Regression-Gate für wiederholte Präfixe, Tool-Turns, Image-Turns, MCP-artige Tool-Transkripte und ein Anthropic-No-Cache-Control.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Führen Sie das schmale Live-Gate aus mit:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Die Baseline-Datei speichert die zuletzt beobachteten Live-Werte sowie die providerspezifischen Regressions-Untergrenzen, die vom Test verwendet werden.
Der Runner verwendet außerdem frische Sitzungs-IDs und Prompt-Namespaces pro Lauf, damit vorheriger Cache-Status die aktuelle Regressions-Stichprobe nicht verfälscht.

Diese Tests verwenden absichtlich keine identischen Erfolgskriterien für alle Provider.

### Anthropic-Live-Erwartungen

- Erwarten Sie explizite Aufwärm-Schreibvorgänge über `cacheWrite`.
- Erwarten Sie bei wiederholten Turns eine Wiederverwendung nahezu des gesamten Verlaufs, da Anthropic-Cache-Control den Cache-Breakpoint durch die Konversation verschiebt.
- Aktuelle Live-Assertions verwenden weiterhin hohe Trefferquoten-Schwellenwerte für stabile, Tool- und Image-Pfade.

### OpenAI-Live-Erwartungen

- Erwarten Sie nur `cacheRead`. `cacheWrite` bleibt `0`.
- Behandeln Sie die Cache-Wiederverwendung bei wiederholten Turns als providerspezifisches Plateau, nicht als Anthropic-artige Wiederverwendung des vollständigen beweglichen Verlaufs.
- Aktuelle Live-Assertions verwenden konservative Untergrenzen, die aus beobachtetem Live-Verhalten auf `gpt-5.4-mini` abgeleitet sind:
  - stabiles Präfix: `cacheRead >= 4608`, Trefferquote `>= 0.90`
  - Tool-Transkript: `cacheRead >= 4096`, Trefferquote `>= 0.85`
  - Image-Transkript: `cacheRead >= 3840`, Trefferquote `>= 0.82`
  - MCP-artiges Transkript: `cacheRead >= 4096`, Trefferquote `>= 0.85`

Die aktuelle kombinierte Live-Verifikation vom 2026-04-04 ergab:

- stabiles Präfix: `cacheRead=4864`, Trefferquote `0.966`
- Tool-Transkript: `cacheRead=4608`, Trefferquote `0.896`
- Image-Transkript: `cacheRead=4864`, Trefferquote `0.954`
- MCP-artiges Transkript: `cacheRead=4608`, Trefferquote `0.891`

Die aktuelle lokale Wall-Clock-Zeit für das kombinierte Gate lag bei etwa `88s`.

Warum sich die Assertions unterscheiden:

- Anthropic stellt explizite Cache-Breakpoints und eine bewegliche Wiederverwendung des Konversationsverlaufs bereit.
- OpenAI-Prompt-Caching bleibt weiterhin sensitiv gegenüber exakten Präfixen, aber das effektiv wiederverwendbare Präfix in Live-Responses-Datenverkehr kann früher plateauieren als der vollständige Prompt.
- Deshalb erzeugt ein Vergleich von Anthropic und OpenAI mit einem einzigen providerübergreifenden Prozent-Schwellenwert falsche Regressionen.

### Konfiguration `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Standardwerte:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Env-Schalter (einmaliges Debugging)

- `OPENCLAW_CACHE_TRACE=1` aktiviert Cache-Trace.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` überschreibt den Ausgabepfad.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` schaltet die Erfassung vollständiger Nachrichten-Payloads um.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` schaltet die Erfassung von Prompt-Text um.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` schaltet die Erfassung von System-Prompts um.

### Was Sie prüfen sollten

- Cache-Trace-Ereignisse sind JSONL und enthalten gestufte Snapshots wie `session:loaded`, `prompt:before`, `stream:context` und `session:after`.
- Die Cache-Token-Auswirkung pro Turn ist in normalen Nutzungsoberflächen über `cacheRead` und `cacheWrite` sichtbar (zum Beispiel `/usage full` und Sitzungsnutzungszusammenfassungen).
- Für Anthropic erwarten Sie sowohl `cacheRead` als auch `cacheWrite`, wenn Caching aktiv ist.
- Für OpenAI erwarten Sie `cacheRead` bei Cache-Treffern und `cacheWrite` bleibt `0`; OpenAI veröffentlicht kein separates Feld für Cache-Schreib-Tokens.
- Wenn Sie Request-Tracing benötigen, protokollieren Sie Request-IDs und Rate-Limit-Header getrennt von Cache-Metriken. Die aktuelle Cache-Trace-Ausgabe von OpenClaw konzentriert sich auf Prompt-/Sitzungsform und normalisierte Token-Nutzung statt auf rohe Provider-Antwort-Header.

## Schnelle Fehlerbehebung

- Hohes `cacheWrite` in den meisten Turns: prüfen Sie auf volatile Eingaben im System-Prompt und verifizieren Sie, dass Modell/Provider Ihre Cache-Einstellungen unterstützt.
- Hohes `cacheWrite` bei Anthropic: bedeutet oft, dass der Cache-Breakpoint auf Inhalt landet, der sich bei jeder Anfrage ändert.
- Niedriges `cacheRead` bei OpenAI: prüfen Sie, ob das stabile Präfix am Anfang steht, das wiederholte Präfix mindestens 1024 Tokens lang ist und derselbe `prompt_cache_key` für Turns wiederverwendet wird, die sich einen Cache teilen sollen.
- Keine Wirkung von `cacheRetention`: bestätigen Sie, dass der Modellschlüssel mit `agents.defaults.models["provider/model"]` übereinstimmt.
- Bedrock-Nova-/Mistral-Anfragen mit Cache-Einstellungen: erwartete Erzwingung zur Laufzeit auf `none`.

Verwandte Docs:

- [Anthropic](/providers/anthropic)
- [Token-Nutzung und Kosten](/reference/token-use)
- [Sitzungs-Pruning](/de/concepts/session-pruning)
- [Referenz der Gateway-Konfiguration](/de/gateway/configuration-reference)
