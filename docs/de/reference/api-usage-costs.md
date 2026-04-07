---
read_when:
    - Sie möchten verstehen, welche Funktionen kostenpflichtige APIs aufrufen können
    - Sie müssen Schlüssel, Kosten und Sichtbarkeit der Nutzung prüfen
    - Sie erklären die Kostenanzeige von /status oder /usage
summary: Prüfen, was Geld kosten kann, welche Schlüssel verwendet werden und wie sich die Nutzung anzeigen lässt
title: API-Nutzung und Kosten
x-i18n:
    generated_at: "2026-04-07T06:19:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab6eefcde9ac014df6cdda7aaa77ef48f16936ab12eaa883d9fe69425a31a2dd
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API-Nutzung und Kosten

Dieses Dokument listet **Funktionen auf, die API-Schlüssel verwenden können**, und zeigt, wo ihre Kosten erscheinen. Es konzentriert sich auf
OpenClaw-Funktionen, die Providernutzung oder kostenpflichtige API-Aufrufe erzeugen können.

## Wo Kosten erscheinen (Chat + CLI)

**Kostenaufnahme pro Sitzung**

- `/status` zeigt das aktuelle Sitzungsmodell, die Kontextnutzung und die Token der letzten Antwort.
- Wenn das Modell **API-Key-Authentifizierung** verwendet, zeigt `/status` auch die **geschätzten Kosten** der letzten Antwort an.
- Wenn Live-Sitzungsmetadaten spärlich sind, kann `/status` Token-/Cache-
  Zähler und das aktive Laufzeit-Modelllabel aus dem neuesten Nutzungseintrag
  im Transkript wiederherstellen. Bereits vorhandene Live-Werte ungleich null haben weiterhin Vorrang, und nach Prompt-Größe
  berechnete Transkript-Gesamtwerte können gewinnen, wenn gespeicherte Gesamtwerte fehlen oder kleiner sind.

**Kostenfußzeile pro Nachricht**

- `/usage full` hängt an jede Antwort eine Nutzungsfußzeile an, einschließlich **geschätzter Kosten** (nur API-Key).
- `/usage tokens` zeigt nur Token an; abonnementartige OAuth-/tokenbasierte und CLI-Flows verbergen Kosten in Dollar.
- Hinweis zu Gemini CLI: Wenn die CLI JSON-Ausgabe zurückgibt, liest OpenClaw die Nutzung aus
  `stats`, normalisiert `stats.cached` zu `cacheRead` und leitet bei Bedarf Eingabetoken
  aus `stats.input_tokens - stats.cached` ab.

Hinweis zu Anthropic: Mitarbeitende von Anthropic haben uns mitgeteilt, dass Claude-CLI-Nutzung im Stil von OpenClaw
wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung von Claude CLI und `claude -p`
für diese Integration als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.
Anthropic stellt weiterhin keine Schätzung in Dollar pro Nachricht bereit, die OpenClaw
in `/usage full` anzeigen könnte.

**CLI-Nutzungsfenster (Provider-Kontingente)**

- `openclaw status --usage` und `openclaw channels list` zeigen **Nutzungsfenster** des Providers an
  (Kontingentaufnahmen, keine Kosten pro Nachricht).
- Lesbare Ausgabe wird providerübergreifend auf `X% left` normalisiert.
- Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.
- Hinweis zu MiniMax: Die rohen Felder `usage_percent` / `usagePercent` bedeuten verbleibendes
  Kontingent, daher invertiert OpenClaw sie vor der Anzeige. Zählbasierte Felder haben weiterhin Vorrang,
  wenn sie vorhanden sind. Wenn der Provider `model_remains` zurückgibt, bevorzugt OpenClaw den Eintrag des
  Chat-Modells, leitet das Fensterlabel bei Bedarf aus Zeitstempeln ab und
  nimmt den Modellnamen in das Planlabel auf.
- Die Nutzungsauthentifizierung für diese Kontingentfenster kommt aus provider-spezifischen Hooks, wenn verfügbar;
  andernfalls greift OpenClaw auf passende OAuth-/API-Key-
  Anmeldedaten aus Auth-Profilen, Env oder Konfiguration zurück.

Siehe [Token-Nutzung und Kosten](/de/reference/token-use) für Details und Beispiele.

## Wie Schlüssel erkannt werden

OpenClaw kann Anmeldedaten aus folgenden Quellen übernehmen:

- **Auth-Profile** (pro Agent, gespeichert in `auth-profiles.json`).
- **Umgebungsvariablen** (z. B. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Konfiguration** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), die Schlüssel in die Prozessumgebung des Skills exportieren können.

## Funktionen, die Schlüssel verbrauchen können

### 1) Antworten des Kernmodells (Chat + Tools)

Jede Antwort oder jeder Tool-Aufruf verwendet den **aktuellen Modell-Provider** (OpenAI, Anthropic usw.). Dies ist die
wichtigste Quelle für Nutzung und Kosten.

Dazu gehören auch abonnementartige gehostete Provider, die weiterhin außerhalb
der lokalen UI von OpenClaw abrechnen, wie **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** und
Anthropics Claude-Login-Pfad in OpenClaw mit aktivierter **Extra Usage**.

Siehe [Models](/de/providers/models) für die Preiskonfiguration und [Token-Nutzung und Kosten](/de/reference/token-use) für die Anzeige.

### 2) Medienverständnis (Audio/Bild/Video)

Eingehende Medien können zusammengefasst/transkribiert werden, bevor die Antwort ausgeführt wird. Dies verwendet Modell-/Provider-APIs.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Bild: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Siehe [Medienverständnis](/de/nodes/media-understanding).

### 3) Bild- und Videogenerierung

Gemeinsam genutzte Generierungsfunktionen können ebenfalls Providerschlüssel verbrauchen:

- Bildgenerierung: OpenAI / Google / fal / MiniMax
- Videogenerierung: Qwen

Die Bildgenerierung kann einen auth-gestützten Provider-Standard ableiten, wenn
`agents.defaults.imageGenerationModel` nicht gesetzt ist. Die Videogenerierung erfordert derzeit
ein explizites `agents.defaults.videoGenerationModel` wie
`qwen/wan2.6-t2v`.

Siehe [Bildgenerierung](/de/tools/image-generation), [Qwen Cloud](/de/providers/qwen)
und [Models](/de/concepts/models).

### 4) Memory-Embeddings + semantische Suche

Die semantische Memory-Suche verwendet **Embedding-APIs**, wenn sie für Remote-Provider konfiguriert ist:

- `memorySearch.provider = "openai"` → OpenAI-Embeddings
- `memorySearch.provider = "gemini"` → Gemini-Embeddings
- `memorySearch.provider = "voyage"` → Voyage-Embeddings
- `memorySearch.provider = "mistral"` → Mistral-Embeddings
- `memorySearch.provider = "ollama"` → Ollama-Embeddings (lokal/self-hosted; typischerweise keine Abrechnung über gehostete APIs)
- Optionaler Fallback auf einen Remote-Provider, wenn lokale Embeddings fehlschlagen

Sie können es mit `memorySearch.provider = "local"` lokal halten (keine API-Nutzung).

Siehe [Memory](/de/concepts/memory).

### 5) Web-Such-Tool

`web_search` kann je nach Provider Nutzungskosten verursachen:

- **Brave Search API**: `BRAVE_API_KEY` oder `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` oder `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` oder `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` oder `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` oder `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: standardmäßig ohne Schlüssel, erfordert aber einen erreichbaren Ollama-Host plus `ollama signin`; kann auch normale Ollama-Provider-Bearer-Authentifizierung wiederverwenden, wenn der Host sie erfordert
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` oder `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` oder `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: Fallback ohne Schlüssel (keine API-Abrechnung, aber inoffiziell und HTML-basiert)
- **SearXNG**: `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl` (ohne Schlüssel/self-hosted; keine Abrechnung über gehostete APIs)

Veraltete Provider-Pfade unter `tools.web.search.*` werden weiterhin über den temporären Kompatibilitäts-Shim geladen, sind aber nicht mehr die empfohlene Konfigurationsoberfläche.

**Brave Search Free Credit:** Jeder Brave-Plan enthält erneuerbare
5 USD/Monat an kostenlosem Guthaben. Der Search-Plan kostet 5 USD pro 1.000 Anfragen, sodass das Guthaben
1.000 Anfragen/Monat ohne Kosten abdeckt. Setzen Sie Ihr Nutzungslimit im Brave-Dashboard,
um unerwartete Kosten zu vermeiden.

Siehe [Web-Tools](/de/tools/web).

### 5) Web-Fetch-Tool (Firecrawl)

`web_fetch` kann **Firecrawl** aufrufen, wenn ein API-Schlüssel vorhanden ist:

- `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webFetch.apiKey`

Wenn Firecrawl nicht konfiguriert ist, greift das Tool auf direktes Fetch + Readability zurück (keine kostenpflichtige API).

Siehe [Web-Tools](/de/tools/web).

### 6) Provider-Nutzungsaufnahmen (Status/Health)

Einige Statusbefehle rufen **Provider-Nutzungsendpunkte** auf, um Kontingentfenster oder den Auth-Status anzuzeigen.
Das sind typischerweise Aufrufe mit geringem Volumen, treffen aber dennoch Provider-APIs:

- `openclaw status --usage`
- `openclaw models status --json`

Siehe [Models CLI](/cli/models).

### 7) Zusammenfassung der Kompaktierungs-Schutzmaßnahme

Die Kompaktierungs-Schutzmaßnahme kann den Sitzungsverlauf mit dem **aktuellen Modell** zusammenfassen, was
beim Ausführen Provider-APIs aufruft.

Siehe [Sitzungsverwaltung + Kompaktierung](/de/reference/session-management-compaction).

### 8) Modellscan / Probe

`openclaw models scan` kann OpenRouter-Modelle prüfen und verwendet `OPENROUTER_API_KEY`, wenn
Prüfungen aktiviert sind.

Siehe [Models CLI](/cli/models).

### 9) Talk (Sprache)

Der Talk-Modus kann **ElevenLabs** aufrufen, wenn er konfiguriert ist:

- `ELEVENLABS_API_KEY` oder `talk.providers.elevenlabs.apiKey`

Siehe [Talk-Modus](/de/nodes/talk).

### 10) Skills (APIs von Drittanbietern)

Skills können `apiKey` unter `skills.entries.<name>.apiKey` speichern. Wenn ein Skill diesen Schlüssel für externe
APIs verwendet, können entsprechend dem Provider des Skills Kosten entstehen.

Siehe [Skills](/de/tools/skills).
