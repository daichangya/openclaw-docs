---
read_when:
    - Sie möchten verstehen, welche Features kostenpflichtige APIs aufrufen können
    - Sie müssen Schlüssel, Kosten und Sichtbarkeit der Nutzung prüfen
    - Sie erklären die Kostenberichterstattung von /status oder /usage
summary: Prüfen, was Kosten verursachen kann, welche Schlüssel verwendet werden und wie die Nutzung angezeigt wird
title: API-Nutzung und Kosten
x-i18n:
    generated_at: "2026-04-05T12:54:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 71789950fe54dcdcd3e34c8ad6e3143f749cdfff5bbc2f14be4b85aaa467b14c
    source_path: reference/api-usage-costs.md
    workflow: 15
---

# API-Nutzung und Kosten

Dieses Dokument listet **Features auf, die API-Schlüssel verwenden können**, und zeigt, wo ihre Kosten erscheinen. Es konzentriert sich auf
OpenClaw-Features, die Provider-Nutzung oder kostenpflichtige API-Aufrufe erzeugen können.

## Wo Kosten angezeigt werden (Chat + CLI)

**Kostenübersicht pro Sitzung**

- `/status` zeigt das aktuelle Sitzungs-Model, die Kontextnutzung und die Tokens der letzten Antwort.
- Wenn das Model **API-Key-Authentifizierung** verwendet, zeigt `/status` auch die **geschätzten Kosten** für die letzte Antwort.
- Wenn Live-Metadaten der Sitzung lückenhaft sind, kann `/status` Token-/Cache-
  Zähler und die aktive Runtime-Model-Bezeichnung aus dem neuesten Nutzungseintrag des Transkripts wiederherstellen.
  Bereits vorhandene Live-Werte ungleich null haben weiterhin Vorrang, und Summen aus dem promptgroßen
  Transkript können gewinnen, wenn gespeicherte Summen fehlen oder kleiner sind.

**Kostenfußzeile pro Nachricht**

- `/usage full` hängt an jede Antwort eine Nutzungsfußzeile an, einschließlich **geschätzter Kosten** (nur bei API-Key).
- `/usage tokens` zeigt nur Tokens an; abonnementartige OAuth-/Token- und CLI-Abläufe verbergen Dollar-Kosten.
- Hinweis zu Gemini CLI: Wenn die CLI JSON-Ausgabe zurückgibt, liest OpenClaw die Nutzung aus
  `stats`, normalisiert `stats.cached` zu `cacheRead` und leitet Eingabe-Tokens
  bei Bedarf aus `stats.input_tokens - stats.cached` ab.

Hinweis zu Anthropic: Die öffentlichen Claude-Code-Dokumente von Anthropic rechnen die direkte Claude-
Code-Nutzung im Terminal weiterhin auf die Claude-Tarifgrenzen an. Separat teilte Anthropic OpenClaw-
Benutzern mit, dass ab **4. April 2026 um 12:00 PM PT / 8:00 PM BST** der
**OpenClaw**-Pfad für Claude-Login als Nutzung über Drittanbieter-Harnesses zählt und
**Extra Usage** erfordert, die getrennt vom Abonnement abgerechnet wird. Anthropic
stellt keine Dollar-Schätzung pro Nachricht bereit, die OpenClaw in
`/usage full` anzeigen könnte.

**CLI-Nutzungsfenster (Provider-Kontingente)**

- `openclaw status --usage` und `openclaw channels list` zeigen **Nutzungsfenster** der Provider an
  (Kontingent-Snapshots, keine Kosten pro Nachricht).
- Für Menschen lesbare Ausgabe wird providerübergreifend zu `X% left` normalisiert.
- Aktuelle Provider mit Nutzungsfenstern: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi und z.ai.
- Hinweis zu MiniMax: Die rohen Felder `usage_percent` / `usagePercent` bedeuten verbleibendes
  Kontingent, daher invertiert OpenClaw sie vor der Anzeige. Zählbasierte Felder haben weiterhin Vorrang,
  wenn sie vorhanden sind. Wenn der Provider `model_remains` zurückgibt, bevorzugt OpenClaw den
  Chat-Model-Eintrag, leitet bei Bedarf die Bezeichnung des Fensters aus Zeitstempeln ab und
  schließt den Model-Namen in die Tarifbezeichnung ein.
- Die Usage-Authentifizierung für diese Kontingentfenster stammt aus providerspezifischen Hooks, wenn verfügbar;
  andernfalls greift OpenClaw auf passende OAuth-/API-Key-
  Zugangsdaten aus Auth-Profilen, der Umgebung oder der Konfiguration zurück.

Details und Beispiele finden Sie unter [Token-Nutzung und Kosten](/reference/token-use).

## Wie Schlüssel erkannt werden

OpenClaw kann Zugangsdaten aus folgenden Quellen übernehmen:

- **Auth-Profile** (pro Agent, gespeichert in `auth-profiles.json`).
- **Umgebungsvariablen** (z. B. `OPENAI_API_KEY`, `BRAVE_API_KEY`, `FIRECRAWL_API_KEY`).
- **Konfiguration** (`models.providers.*.apiKey`, `plugins.entries.*.config.webSearch.apiKey`,
  `plugins.entries.firecrawl.config.webFetch.apiKey`, `memorySearch.*`,
  `talk.providers.*.apiKey`).
- **Skills** (`skills.entries.<name>.apiKey`), die Schlüssel in die Prozessumgebung des Skills exportieren können.

## Features, die Schlüssel verwenden und Kosten verursachen können

### 1) Kern-Model-Antworten (Chat + Tools)

Jede Antwort oder jeder Tool-Aufruf verwendet den **aktuellen Model-Provider** (OpenAI, Anthropic usw.). Dies ist die
wichtigste Quelle für Nutzung und Kosten.

Dazu gehören auch abonnementartige gehostete Provider, die weiterhin außerhalb
der lokalen OpenClaw-UI abrechnen, wie **OpenAI Codex**, **Alibaba Cloud Model Studio
Coding Plan**, **MiniMax Coding Plan**, **Z.AI / GLM Coding Plan** und
der Claude-Login-Pfad von Anthropic in OpenClaw mit aktiviertem **Extra Usage**.

Siehe [Models](/providers/models) für die Preiskonfiguration und [Token-Nutzung und Kosten](/reference/token-use) für die Anzeige.

### 2) Media Understanding (Audio/Bild/Video)

Eingehende Medien können zusammengefasst/transkribiert werden, bevor die Antwort ausgeführt wird. Dabei werden Model-/Provider-APIs verwendet.

- Audio: OpenAI / Groq / Deepgram / Google / Mistral.
- Bild: OpenAI / OpenRouter / Anthropic / Google / MiniMax / Moonshot / Qwen / Z.AI.
- Video: Google / Qwen / Moonshot.

Siehe [Media Understanding](/de/nodes/media-understanding).

### 3) Bild- und Videogenerierung

Gemeinsame Generierungsfähigkeiten können ebenfalls Provider-Schlüssel verwenden und Kosten verursachen:

- Bildgenerierung: OpenAI / Google / fal / MiniMax
- Videogenerierung: Qwen

Die Bildgenerierung kann einen authentifizierungsgestützten Standard-Provider ableiten, wenn
`agents.defaults.imageGenerationModel` nicht gesetzt ist. Die Videogenerierung erfordert derzeit
ein explizites `agents.defaults.videoGenerationModel`, zum Beispiel
`qwen/wan2.6-t2v`.

Siehe [Bildgenerierung](/tools/image-generation), [Qwen Cloud](/providers/qwen)
und [Models](/de/concepts/models).

### 4) Memory-Embeddings + semantische Suche

Die semantische Memory-Suche verwendet **Embedding-APIs**, wenn sie für Remote-Provider konfiguriert ist:

- `memorySearch.provider = "openai"` → OpenAI-Embeddings
- `memorySearch.provider = "gemini"` → Gemini-Embeddings
- `memorySearch.provider = "voyage"` → Voyage-Embeddings
- `memorySearch.provider = "mistral"` → Mistral-Embeddings
- `memorySearch.provider = "ollama"` → Ollama-Embeddings (lokal/selbst gehostet; normalerweise keine Abrechnung gehosteter APIs)
- Optionaler Fallback auf einen Remote-Provider, wenn lokale Embeddings fehlschlagen

Sie können dies lokal halten mit `memorySearch.provider = "local"` (keine API-Nutzung).

Siehe [Memory](/de/concepts/memory).

### 5) Websuch-Tool

`web_search` kann je nach Provider Nutzungskosten verursachen:

- **Brave Search API**: `BRAVE_API_KEY` oder `plugins.entries.brave.config.webSearch.apiKey`
- **Exa**: `EXA_API_KEY` oder `plugins.entries.exa.config.webSearch.apiKey`
- **Firecrawl**: `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webSearch.apiKey`
- **Gemini (Google Search)**: `GEMINI_API_KEY` oder `plugins.entries.google.config.webSearch.apiKey`
- **Grok (xAI)**: `XAI_API_KEY` oder `plugins.entries.xai.config.webSearch.apiKey`
- **Kimi (Moonshot)**: `KIMI_API_KEY`, `MOONSHOT_API_KEY` oder `plugins.entries.moonshot.config.webSearch.apiKey`
- **MiniMax Search**: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, `MINIMAX_API_KEY` oder `plugins.entries.minimax.config.webSearch.apiKey`
- **Ollama Web Search**: standardmäßig ohne Schlüssel, erfordert aber einen erreichbaren Ollama-Host plus `ollama signin`; kann auch die normale Bearer-Authentifizierung des Ollama-Providers wiederverwenden, wenn der Host sie erfordert
- **Perplexity Search API**: `PERPLEXITY_API_KEY`, `OPENROUTER_API_KEY` oder `plugins.entries.perplexity.config.webSearch.apiKey`
- **Tavily**: `TAVILY_API_KEY` oder `plugins.entries.tavily.config.webSearch.apiKey`
- **DuckDuckGo**: schlüsselfreier Fallback (keine API-Abrechnung, aber inoffiziell und HTML-basiert)
- **SearXNG**: `SEARXNG_BASE_URL` oder `plugins.entries.searxng.config.webSearch.baseUrl` (schlüsselfrei/selbst gehostet; keine Abrechnung gehosteter APIs)

Veraltete Provider-Pfade `tools.web.search.*` werden über den temporären Kompatibilitäts-Shim weiterhin geladen, sind aber nicht mehr die empfohlene Konfigurationsoberfläche.

**Kostenloses Brave-Search-Guthaben:** Jeder Brave-Tarif enthält monatlich erneuerbares
kostenloses Guthaben in Höhe von \$5. Der Search-Tarif kostet \$5 pro 1.000 Requests, daher deckt dieses
Guthaben 1.000 Requests/Monat ohne Kosten ab. Setzen Sie Ihr Nutzungslimit im Brave-Dashboard,
um unerwartete Kosten zu vermeiden.

Siehe [Web-Tools](/tools/web).

### 5) Web-Fetch-Tool (Firecrawl)

`web_fetch` kann **Firecrawl** aufrufen, wenn ein API-Key vorhanden ist:

- `FIRECRAWL_API_KEY` oder `plugins.entries.firecrawl.config.webFetch.apiKey`

Wenn Firecrawl nicht konfiguriert ist, fällt das Tool auf direktes Fetch + Readability zurück (keine kostenpflichtige API).

Siehe [Web-Tools](/tools/web).

### 6) Provider-Nutzungs-Snapshots (Status/Health)

Einige Statusbefehle rufen **Provider-Nutzungsendpunkte** auf, um Kontingentfenster oder Auth-Health anzuzeigen.
Dies sind normalerweise Aufrufe mit geringem Volumen, treffen aber dennoch Provider-APIs:

- `openclaw status --usage`
- `openclaw models status --json`

Siehe [Models CLI](/cli/models).

### 7) Zusammenfassung als Schutzmaßnahme bei Kompaktierung

Die Schutzmaßnahme bei der Kompaktierung kann den Sitzungsverlauf mit dem **aktuellen Model** zusammenfassen, was
beim Ausführen Provider-APIs aufruft.

Siehe [Sitzungsverwaltung + Kompaktierung](/reference/session-management-compaction).

### 8) Model-Scan / Probe

`openclaw models scan` kann OpenRouter-Models prüfen und verwendet `OPENROUTER_API_KEY`, wenn
Prüfungen aktiviert sind.

Siehe [Models CLI](/cli/models).

### 9) Talk (Sprache)

Der Talk-Modus kann **ElevenLabs** aufrufen, wenn es konfiguriert ist:

- `ELEVENLABS_API_KEY` oder `talk.providers.elevenlabs.apiKey`

Siehe [Talk-Modus](/de/nodes/talk).

### 10) Skills (APIs von Drittanbietern)

Skills können `apiKey` in `skills.entries.<name>.apiKey` speichern. Wenn ein Skill diesen Schlüssel für externe
APIs verwendet, kann er entsprechend dem Provider des Skills Kosten verursachen.

Siehe [Skills](/tools/skills).
