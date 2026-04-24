---
read_when:
    - Sie möchten verstehen, welche Funktionen kostenpflichtige APIs aufrufen können.
    - Sie möchten Schlüssel, Kosten und Sichtbarkeit der Nutzung prüfen.
    - Sie erklären die Berichterstattung von /status oder /usage cost.
summary: Prüfen, was Geld ausgeben kann, welche Schlüssel verwendet werden und wie sich Nutzung anzeigen lässt
title: API-Nutzung und Kosten
x-i18n:
    generated_at: "2026-04-24T06:57:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: d44b34a782a4090a074c49b91df3fa9733f13f16b3d39258b6cf57cf24043f43
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API-Nutzung & Kosten

Dieses Dokument listet **Funktionen auf, die API-Keys verwenden können**, und wo deren Kosten erscheinen. Es konzentriert sich auf
OpenClaw-Funktionen, die Providernutzung oder kostenpflichtige API-Aufrufe erzeugen können.

## Wo Kosten erscheinen (Chat + CLI)

**Kosten-Snapshot pro Sitzung**

- `/status` zeigt das aktuelle Sitzungsmodell, die Kontextnutzung und die Tokens der letzten Antwort.
- Wenn das Modell **API-Key-Authentifizierung** verwendet, zeigt `/status` auch die **geschätzten Kosten** für die letzte Antwort.
- Wenn Live-Metadaten der Sitzung spärlich sind, kann `/status` Token-/Cache-
  Zähler und das Label des aktiven Runtime-Modells aus dem neuesten Usage-
  Eintrag des Transcripts wiederherstellen. Bestehende von null verschiedene Live-Werte haben weiterhin Vorrang, und Summen aus dem Transcript in Prompt-Größe können gewinnen, wenn gespeicherte Summen fehlen oder kleiner sind.

**Kosten-Footer pro Nachricht**

- `/usage full` hängt an jede Antwort einen Usage-Footer an, einschließlich **geschätzter Kosten** (nur bei API-Key).
- `/usage tokens` zeigt nur Tokens an; abonnementartige OAuth-/Token- und CLI-Flows blenden Dollar-Kosten aus.
- Hinweis zu Gemini CLI: Wenn die CLI JSON-Ausgabe zurückgibt, liest OpenClaw die Nutzung aus
  `stats`, normalisiert `stats.cached` zu `cacheRead` und leitet Eingabe-Tokens
  bei Bedarf aus `stats.input_tokens - stats.cached` ab.

Hinweis zu Anthropic: Mitarbeitende von Anthropic haben uns mitgeteilt, dass die Nutzung von Claude CLI im Stil von OpenClaw
wieder erlaubt ist, daher behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` als
zulässig für diese Integration, sofern Anthropic keine neue Richtlinie veröffentlicht.
Anthropic stellt weiterhin keine Dollar-Schätzung pro Nachricht bereit, die OpenClaw
in `/usage full` anzeigen könnte.

**CLI-Usage-Fenster (Provider-Kontingente)**

- `openclaw status --usage` und `openclaw channels list` zeigen **Usage-Fenster**
  von Providern an (Kontingent-Snapshots, keine Kosten pro Nachricht).
- Die menschenlesbare Ausgabe wird providerübergreifend auf `X% left` normalisiert.
- Aktuelle Provider mit Usage-Fenstern: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.
- Hinweis zu MiniMax: Die Rohfelder `usage_percent` / `usagePercent` bedeuten verbleibendes
  Kontingent, daher invertiert OpenClaw sie vor der Anzeige. Zählbasierte Felder haben weiterhin Vorrang,
  wenn sie vorhanden sind. Wenn der Provider `model_remains` zurückgibt, bevorzugt OpenClaw den Eintrag
  des Chat-Modells, leitet das Fenster-Label bei Bedarf aus Zeitstempeln ab und
  enthält den Modellnamen im Plan-Label.
- Usage-Authentifizierung für diese Kontingentfenster stammt, sofern verfügbar, aus providerspezifischen Hooks;
  andernfalls fällt OpenClaw auf passende OAuth-/API-Key-
  Zugangsdaten aus Auth-Profilen, der Umgebung oder der Konfiguration zurück.

Details und Beispiele finden Sie unter [Token use & costs](/de/reference/token-use).

## Wie Schlüssel erkannt werden

OpenClaw kann Zugangsdaten aus folgenden Quellen übernehmen:

- **Auth-Profilen** (pro Agent, gespeichert in `auth-profiles.json`).
- **Umgebungsvariablen** (z. B. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Konfiguration** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), die Schlüssel in die Prozessumgebung des Skills exportieren können.

## Funktionen, die Schlüssel verbrauchen können

### 1) Kern-Modellantworten (Chat + Tools)

Jede Antwort oder jeder Tool-Aufruf verwendet den **aktuellen Modell-Provider** (OpenAI, Anthropic usw.). Dies ist die
primäre Quelle für Nutzung und Kosten.

Dazu gehören auch abonnementartige gehostete Provider, die weiterhin außerhalb der lokalen UI
von OpenClaw abrechnen, wie **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** und
der OpenClaw-Claude-Login-Pfad von Anthropic mit aktiviertem **Extra Usage**.

Siehe [Models](/de/providers/models) für die Preis-Konfiguration und [Token use & costs](/de/reference/token-use) für die Anzeige.

### 2) Medienverständnis (Audio/Bild/Video)

Eingehende Medien können zusammengefasst/transkribiert werden, bevor die Antwort ausgeführt wird. Dabei werden Modell-/Provider-APIs verwendet.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Bild: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Siehe [Media understanding](/de/nodes/media-understanding).

### 3) Bild- und Videogenerierung

Gemeinsame Generierungsfunktionen können ebenfalls Provider-Keys verbrauchen:

- Bildgenerierung: OpenAI / Google / fal / MiniMax
- Videogenerierung: Qwen

Die Bildgenerierung kann einen auth-gestützten Standardprovider ableiten, wenn
`agents.defaults.imageGenerationModel` nicht gesetzt ist. Für Videogenerierung
ist derzeit ein explizites `agents.defaults.videoGenerationModel` erforderlich, z. B.
`qwen/wan2.6-t2v`.

Siehe [Image generation](/de/tools/image-generation), [Qwen Cloud](/de/providers/qwen)
und [Models](/de/concepts/models).

### 4) Memory-Embeddings + semantische Suche

Semantische Memory-Suche verwendet **Embedding-APIs**, wenn sie für Remote-Provider konfiguriert ist:

- `memorySearch.provider = "openai"` → OpenAI-Embeddings
- `memorySearch.provider = "gemini"` → Gemini-Embeddings
- `memorySearch.provider = "voyage"` → Voyage-Embeddings
- `memorySearch.provider = "mistral"` → Mistral-Embeddings
- `memorySearch.provider = "lmstudio"` → LM-Studio-Embeddings (lokal/selbst gehostet)
- `memorySearch.provider = "ollama"` → Ollama-Embeddings (lokal/selbst gehostet; normalerweise keine gehostete API-Abrechnung)
- Optionaler Fallback auf einen Remote-Provider, wenn lokale Embeddings fehlschlagen

Mit `memorySearch.provider = "local"` können Sie dies lokal halten (keine API-Nutzung).

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
- **Ollama Web Search**: standardmäßig ohne Schlüssel, erfordert aber einen erreichbaren Ollama-Host plus `ollama signin`; kann auch normale Bearer-Authentifizierung des Ollama-Providers wiederverwenden, wenn der Host sie verlangt
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` oder `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` oder `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: schlüsselfreier Fallback (keine API-Abrechnung, aber inoffiziell und HTML-basiert)
- **SearXNG**: `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl` (schlüsselfrei/selbst gehostet; keine gehostete API-Abrechnung)

Ältere Provider-Pfade `tools.web.search.*` werden weiterhin über den temporären Kompatibilitätssh im geladen, sind aber nicht mehr die empfohlene Oberfläche für die Konfiguration.

**Brave Search Free Credit:** Jeder Brave-Plan enthält \$5/Monat als erneuerbares
Freikontingent. Der Search-Plan kostet \$5 pro 1.000 Anfragen, sodass das Freikontingent
1.000 Anfragen/Monat ohne Kosten abdeckt. Setzen Sie Ihr Nutzungslimit im Brave-Dashboard,
um unerwartete Kosten zu vermeiden.

Siehe [Web tools](/de/tools/web).

### 5) Web-Fetch-Tool (Firecrawl)

`web_fetch` kann **Firecrawl** aufrufen, wenn ein API-Key vorhanden ist:

- `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webFetch.apiKey`

Wenn Firecrawl nicht konfiguriert ist, fällt das Tool auf direktes Fetch + Readability zurück (keine kostenpflichtige API).

Siehe [Web tools](/de/tools/web).

### 6) Provider-Usage-Snapshots (Status/Health)

Einige Statusbefehle rufen **Provider-Usage-Endpunkte** auf, um Kontingentfenster oder Auth-Health anzuzeigen.
Dies sind typischerweise Aufrufe mit geringem Volumen, treffen aber trotzdem Provider-APIs:

- `openclaw status --usage`
- `openclaw models status --json`

Siehe [Models CLI](/de/cli/models).

### 7) Zusammenfassung durch Compaction Safeguard

Die Compaction-Safeguard kann den Sitzungsverlauf mit dem **aktuellen Modell** zusammenfassen, was
Provider-APIs aufruft, wenn sie läuft.

Siehe [Session management + compaction](/de/reference/session-management-compaction).

### 8) Model-Scan / Probe

`openclaw models scan` kann OpenRouter-Modelle prüfen und verwendet `OPENROUTER_API_KEY`, wenn
Prüfung aktiviert ist.

Siehe [Models CLI](/de/cli/models).

### 9) Talk (Sprache)

Der Talk-Modus kann bei entsprechender Konfiguration **ElevenLabs** aufrufen:

- `ELEVENLABS_API_KEY` oder `talk.providers.elevenlabs.apiKey`

Siehe [Talk mode](/de/nodes/talk).

### 10) Skills (APIs von Drittanbietern)

Skills können `apiKey` in `skills.entries.<name>.apiKey` speichern. Wenn ein Skill diesen Schlüssel für externe
APIs verwendet, können entsprechend dem Provider des Skills Kosten entstehen.

Siehe [Skills](/de/tools/skills).

## Verwandt

- [Token use and costs](/de/reference/token-use)
- [Prompt caching](/de/reference/prompt-caching)
- [Usage tracking](/de/concepts/usage-tracking)
