---
read_when:
    - Sie möchten verstehen, welche Funktionen möglicherweise kostenpflichtige APIs aufrufen.
    - Sie müssen Schlüssel, Kosten und Nutzungssichtbarkeit prüfen.
    - Sie erklären die Kostenberichterstattung von /status oder /usage.
summary: Prüfen Sie, was Geld kosten kann, welche Schlüssel verwendet werden und wie Sie die Nutzung anzeigen.
title: API-Nutzung und Kosten
x-i18n:
    generated_at: "2026-04-13T08:50:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5077e74d38ef781ac7a72603e9f9e3829a628b95c5a9967915ab0f321565429
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API-Nutzung und Kosten

Dieses Dokument listet **Funktionen auf, die API-Schlüssel verwenden können**, und wo ihre Kosten angezeigt werden. Es konzentriert sich auf
OpenClaw-Funktionen, die Provider-Nutzung oder kostenpflichtige API-Aufrufe erzeugen können.

## Wo Kosten angezeigt werden (Chat + CLI)

**Kostenübersicht pro Sitzung**

- `/status` zeigt das aktuelle Sitzungsmodell, die Kontextnutzung und die Token der letzten Antwort an.
- Wenn das Modell **API-Schlüssel-Authentifizierung** verwendet, zeigt `/status` auch die **geschätzten Kosten** für die letzte Antwort an.
- Wenn Live-Sitzungsmetadaten lückenhaft sind, kann `/status` Token-/Cache-Zähler
  und die Bezeichnung des aktiven Laufzeitmodells aus dem neuesten Nutzungseintrag
  im Transkript wiederherstellen. Vorhandene Live-Werte ungleich null haben weiterhin Vorrang, und promptgroße
  Transkript-Gesamtwerte können gewinnen, wenn gespeicherte Gesamtwerte fehlen oder kleiner sind.

**Kostenfußzeile pro Nachricht**

- `/usage full` hängt an jede Antwort eine Nutzungsfußzeile an, einschließlich **geschätzter Kosten** (nur bei API-Schlüsseln).
- `/usage tokens` zeigt nur Token an; OAuth-/Token-Flows im Abonnementstil und CLI-Flows blenden Dollarkosten aus.
- Hinweis zu Gemini CLI: Wenn die CLI JSON-Ausgabe zurückgibt, liest OpenClaw die Nutzung aus
  `stats`, normalisiert `stats.cached` zu `cacheRead` und leitet bei Bedarf Eingabetoken
  aus `stats.input_tokens - stats.cached` ab.

Hinweis zu Anthropic: Anthropic-Mitarbeitende haben uns mitgeteilt, dass die Claude-CLI-Nutzung im OpenClaw-Stil
wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` als
für diese Integration zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.
Anthropic stellt weiterhin keine Schätzung der Kosten pro Nachricht in Dollar bereit, die OpenClaw
in `/usage full` anzeigen könnte.

**CLI-Nutzungsfenster (Provider-Kontingente)**

- `openclaw status --usage` und `openclaw channels list` zeigen **Nutzungsfenster** der Provider an
  (Kontingent-Snapshots, keine Kosten pro Nachricht).
- Die menschenlesbare Ausgabe wird providerübergreifend auf `X% left` normalisiert.
- Aktuelle Provider für Nutzungsfenster: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.
- Hinweis zu MiniMax: Die Rohfelder `usage_percent` / `usagePercent` bedeuten verbleibendes
  Kontingent, daher invertiert OpenClaw sie vor der Anzeige. Zählbasierte Felder haben weiterhin Vorrang,
  wenn sie vorhanden sind. Wenn der Provider `model_remains` zurückgibt, bevorzugt OpenClaw den
  Chat-Modell-Eintrag, leitet die Bezeichnung des Zeitfensters bei Bedarf aus Zeitstempeln ab und
  schließt den Modellnamen in die Planbezeichnung ein.
- Die Authentifizierung für diese Kontingentfenster stammt nach Möglichkeit aus providerspezifischen Hooks;
  andernfalls greift OpenClaw auf passende OAuth-/API-Schlüssel-
  Anmeldedaten aus Auth-Profilen, der Umgebung oder der Konfiguration zurück.

Siehe [Tokennutzung und Kosten](/de/reference/token-use) für Details und Beispiele.

## Wie Schlüssel gefunden werden

OpenClaw kann Anmeldedaten aus folgenden Quellen übernehmen:

- **Auth-Profile** (pro Agent, gespeichert in `auth-profiles.json`).
- **Umgebungsvariablen** (z. B. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Konfiguration** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), die Schlüssel in die Prozessumgebung des Skills exportieren können.

## Funktionen, die Schlüssel verwenden können

### 1) Kernmodell-Antworten (Chat + Tools)

Jede Antwort oder jeder Tool-Aufruf verwendet den **aktuellen Modell-Provider** (OpenAI, Anthropic usw.). Dies ist die
wichtigste Quelle für Nutzung und Kosten.

Dazu gehören auch gehostete Provider im Abonnementstil, die weiterhin außerhalb
der lokalen OpenClaw-Benutzeroberfläche abrechnen, wie **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** und
Anthropics OpenClaw-Claude-Login-Pfad mit aktiviertem **Extra Usage**.

Siehe [Modelle](/de/providers/models) für die Preiskonfiguration und [Tokennutzung und Kosten](/de/reference/token-use) für die Anzeige.

### 2) Medienverständnis (Audio/Bild/Video)

Eingehende Medien können zusammengefasst oder transkribiert werden, bevor die Antwort ausgeführt wird. Dabei werden Modell-/Provider-APIs verwendet.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Bild: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Siehe [Medienverständnis](/de/nodes/media-understanding).

### 3) Bild- und Videogenerierung

Gemeinsam genutzte Generierungsfunktionen können ebenfalls Provider-Schlüssel verwenden:

- Bildgenerierung: OpenAI / Google / fal / MiniMax
- Videogenerierung: Qwen

Die Bildgenerierung kann einen durch Authentifizierung gestützten Standard-Provider ableiten, wenn
`agents.defaults.imageGenerationModel` nicht gesetzt ist. Die Videogenerierung erfordert derzeit
ein explizites `agents.defaults.videoGenerationModel` wie
`qwen/wan2.6-t2v`.

Siehe [Bildgenerierung](/de/tools/image-generation), [Qwen Cloud](/de/providers/qwen)
und [Modelle](/de/concepts/models).

### 4) Memory-Einbettungen + semantische Suche

Die semantische Suche in Memory verwendet **Embedding-APIs**, wenn sie für entfernte Provider konfiguriert ist:

- `memorySearch.provider = "openai"` → OpenAI-Embeddings
- `memorySearch.provider = "gemini"` → Gemini-Embeddings
- `memorySearch.provider = "voyage"` → Voyage-Embeddings
- `memorySearch.provider = "mistral"` → Mistral-Embeddings
- `memorySearch.provider = "lmstudio"` → LM Studio-Embeddings (lokal/selbst gehostet)
- `memorySearch.provider = "ollama"` → Ollama-Embeddings (lokal/selbst gehostet; in der Regel keine gehosteten API-Abrechnungskosten)
- Optionaler Rückfall auf einen entfernten Provider, wenn lokale Embeddings fehlschlagen

Sie können es lokal halten mit `memorySearch.provider = "local"` (keine API-Nutzung).

Siehe [Memory](/de/concepts/memory).

### 5) Websuch-Tool

`web_search` kann je nach Ihrem Provider Nutzungskosten verursachen:

- **Brave Search API**: `BRAVE_API_KEY` oder `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` oder `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` oder `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` oder `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` oder `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: standardmäßig ohne Schlüssel, erfordert aber einen erreichbaren Ollama-Host plus `ollama signin`; kann auch normale Ollama-Provider-Bearer-Authentifizierung wiederverwenden, wenn der Host sie verlangt
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` oder `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` oder `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: schlüsselfreier Fallback (keine API-Abrechnung, aber inoffiziell und HTML-basiert)
- **SearXNG**: `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl` (schlüsselfrei/selbst gehostet; keine gehosteten API-Abrechnungskosten)

Veraltete Provider-Pfade unter `tools.web.search.*` werden weiterhin über den temporären Kompatibilitäts-Shim geladen, sind aber nicht mehr die empfohlene Konfigurationsoberfläche.

**Brave Search Gratisguthaben:** Jeder Brave-Tarif umfasst \$5/Monat an sich erneuerndem
Gratisguthaben. Der Search-Tarif kostet \$5 pro 1.000 Anfragen, daher deckt das Guthaben
1.000 Anfragen/Monat ohne Kosten ab. Legen Sie Ihr Nutzungslimit im Brave-Dashboard fest,
um unerwartete Kosten zu vermeiden.

Siehe [Web-Tools](/de/tools/web).

### 5) Web-Fetch-Tool (Firecrawl)

`web_fetch` kann **Firecrawl** aufrufen, wenn ein API-Schlüssel vorhanden ist:

- `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webFetch.apiKey`

Wenn Firecrawl nicht konfiguriert ist, fällt das Tool auf direktes Fetching + Readability zurück (keine kostenpflichtige API).

Siehe [Web-Tools](/de/tools/web).

### 6) Provider-Nutzungs-Snapshots (Status/Gesundheit)

Einige Statusbefehle rufen **Nutzungsendpunkte von Providern** auf, um Kontingentfenster oder den Auth-Status anzuzeigen.
Dies sind in der Regel Anfragen mit geringem Volumen, treffen aber dennoch Provider-APIs:

- `openclaw status --usage`
- `openclaw models status --json`

Siehe [Models CLI](/cli/models).

### 7) Zusammenfassungen als Compaction-Schutzmaßnahme

Die Compaction-Schutzmaßnahme kann den Sitzungsverlauf mit dem **aktuellen Modell** zusammenfassen, wodurch
bei der Ausführung Provider-APIs aufgerufen werden.

Siehe [Sitzungsverwaltung + Compaction](/de/reference/session-management-compaction).

### 8) Modellscan / Probe

`openclaw models scan` kann OpenRouter-Modelle prüfen und verwendet `OPENROUTER_API_KEY`, wenn
die Prüfung aktiviert ist.

Siehe [Models CLI](/cli/models).

### 9) Talk (Sprache)

Der Talk-Modus kann bei entsprechender Konfiguration **ElevenLabs** aufrufen:

- `ELEVENLABS_API_KEY` oder `talk.providers.elevenlabs.apiKey`

Siehe [Talk-Modus](/de/nodes/talk).

### 10) Skills (Drittanbieter-APIs)

Skills können `apiKey` in `skills.entries.<name>.apiKey` speichern. Wenn ein Skill diesen Schlüssel für externe
APIs verwendet, können entsprechend dem Provider des Skills Kosten anfallen.

Siehe [Skills](/de/tools/skills).
