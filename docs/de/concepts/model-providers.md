---
read_when:
    - Sie benötigen eine Referenz zur Modelleinrichtung je Provider
    - Sie möchten Beispielkonfigurationen oder CLI-Onboarding-Befehle für Modell-Provider
summary: Überblick über Modell-Provider mit Beispielkonfigurationen und CLI-Abläufen
title: Modell-Provider
x-i18n:
    generated_at: "2026-04-24T06:34:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac9bf48897446576d8bc339b340295691741a589863bb57b379c17a5519bffd7
    source_path: concepts/model-providers.md
    workflow: 15
---

Diese Seite behandelt **LLM-/Modell-Provider** (nicht Chat-Kanäle wie WhatsApp/Telegram).
Zu Regeln für die Modellauswahl siehe [/concepts/models](/de/concepts/models).

## Kurzregeln

- Modell-Referenzen verwenden `provider/model` (Beispiel: `opencode/claude-opus-4-6`).
- `agents.defaults.models` fungiert als Allowlist, wenn gesetzt.
- CLI-Helfer: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` sind native Modellmetadaten; `contextTokens` ist die effektive Runtime-Obergrenze.
- Fallback-Regeln, Cooldown-Probes und Persistenz von Sitzungsüberschreibungen: [Model failover](/de/concepts/model-failover).
- Routen der OpenAI-Familie sind präfixspezifisch: `openai/<model>` verwendet den direkten
  OpenAI-API-Key-Provider in PI, `openai-codex/<model>` verwendet Codex OAuth in PI,
  und `openai/<model>` plus `agents.defaults.embeddedHarness.runtime: "codex"` verwendet das native Codex-App-Server-Harness. Siehe [OpenAI](/de/providers/openai)
  und [Codex harness](/de/plugins/codex-harness).
- Die automatische Aktivierung von Plugins folgt derselben Grenze: `openai-codex/<model>` gehört
  zum OpenAI-Plugin, während das Codex-App-Server-Plugin durch
  `embeddedHarness.runtime: "codex"` oder veraltete `codex/<model>`-Referenzen aktiviert wird.
- GPT-5.5 ist derzeit über Abonnement-/OAuth-Routen verfügbar:
  `openai-codex/gpt-5.5` in PI oder `openai/gpt-5.5` mit dem Codex-App-Server-
  Harness. Die direkte API-Key-Route für `openai/gpt-5.5` wird unterstützt, sobald
  OpenAI GPT-5.5 in der öffentlichen API aktiviert; bis dahin verwenden Sie API-fähige Modelle
  wie `openai/gpt-5.4` für Setups mit `OPENAI_API_KEY`.

## Plugin-eigenes Provider-Verhalten

Die meisten provider-spezifischen Logiken liegen in Provider-Plugins (`registerProvider(...)`), während OpenClaw die generische Inferenzschleife beibehält. Plugins verwalten Onboarding, Modellkataloge, Authentifizierungszuordnung für Env-Variablen, Transport-/Konfigurationsnormalisierung, Bereinigung von Tool-Schemas, Failover-Klassifizierung, OAuth-Aktualisierung, Nutzungsberichte, Thinking-/Reasoning-Profile und mehr.

Die vollständige Liste der Hooks des Provider-SDK und Beispiele für gebündelte Plugins finden Sie unter [Provider plugins](/de/plugins/sdk-provider-plugins). Ein Provider, der einen vollständig benutzerdefinierten Request-Executor benötigt, ist eine separate, tiefere Erweiterungsoberfläche.

<Note>
Provider-Runtime-`capabilities` sind gemeinsame Runner-Metadaten (Provider-Familie, Transkript-/Tooling-Besonderheiten, Transport-/Cache-Hinweise). Das ist nicht dasselbe wie das [öffentliche Fähigkeitsmodell](/de/plugins/architecture#public-capability-model), das beschreibt, was ein Plugin registriert (Textinferenz, Sprache usw.).
</Note>

## API-Key-Rotation

- Unterstützt generische Provider-Rotation für ausgewählte Provider.
- Konfigurieren Sie mehrere Schlüssel über:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (einzelne Live-Überschreibung, höchste Priorität)
  - `<PROVIDER>_API_KEYS` (durch Komma oder Semikolon getrennte Liste)
  - `<PROVIDER>_API_KEY` (primärer Schlüssel)
  - `<PROVIDER>_API_KEY_*` (nummerierte Liste, z. B. `<PROVIDER>_API_KEY_1`)
- Für Google-Provider wird `GOOGLE_API_KEY` ebenfalls als Fallback einbezogen.
- Die Reihenfolge der Schlüsselauswahl bewahrt Priorität und dedupliziert Werte.
- Requests werden nur bei Antworten mit Rate-Limit mit dem nächsten Schlüssel wiederholt (zum
  Beispiel `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` oder periodische Nutzungslimit-Meldungen).
- Fehler, die keine Rate-Limits sind, schlagen sofort fehl; es wird keine Schlüsselrotation versucht.
- Wenn alle Kandidatenschlüssel fehlschlagen, wird der finale Fehler aus dem letzten Versuch zurückgegeben.

## Integrierte Provider (pi-ai-Katalog)

OpenClaw wird mit dem pi‑ai-Katalog ausgeliefert. Diese Provider benötigen **keine**
Konfiguration unter `models.providers`; setzen Sie einfach die Authentifizierung und wählen Sie ein Modell.

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- Optionale Rotation: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` sowie `OPENCLAW_LIVE_OPENAI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- Die direkte API-Unterstützung für GPT-5.5 ist hier zukunftsfähig, sobald OpenAI GPT-5.5 über die API bereitstellt
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Standard-Transport ist `auto` (WebSocket zuerst, SSE-Fallback)
- Überschreiben Sie pro Modell über `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- Das Warm-up von OpenAI Responses WebSocket ist standardmäßig über `params.openaiWsWarmup` (`true`/`false`) aktiviert
- OpenAI-Priority-Processing kann über `agents.defaults.models["openai/<model>"].params.serviceTier` aktiviert werden
- `/fast` und `params.fastMode` bilden direkte `openai/*`-Responses-Requests auf `service_tier=priority` auf `api.openai.com` ab
- Verwenden Sie `params.serviceTier`, wenn Sie eine explizite Stufe statt des gemeinsamen Schalters `/fast` möchten
- Verborgene OpenClaw-Attributions-Header (`originator`, `version`,
  `User-Agent`) gelten nur für nativen OpenAI-Datenverkehr zu `api.openai.com`, nicht
  für generische OpenAI-kompatible Proxys
- Native OpenAI-Routen behalten außerdem Responses-`store`, Prompt-Cache-Hinweise und
  OpenAI-Reasoning-kompatible Payload-Formung bei; Proxy-Routen tun dies nicht
- `openai/gpt-5.3-codex-spark` wird in OpenClaw absichtlich unterdrückt, weil Live-OpenAI-API-Requests es ablehnen und der aktuelle Codex-Katalog es nicht bereitstellt

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- Optionale Rotation: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` sowie `OPENCLAW_LIVE_ANTHROPIC_KEY` (einzelne Überschreibung)
- Beispielmodell: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Direkte öffentliche Anthropic-Requests unterstützen den gemeinsamen Schalter `/fast` und `params.fastMode`, einschließlich API-Key- und OAuth-authentifiziertem Datenverkehr zu `api.anthropic.com`; OpenClaw bildet dies auf Anthropic-`service_tier` ab (`auto` vs. `standard_only`)
- Hinweis zu Anthropic: Mitarbeitende von Anthropic haben uns mitgeteilt, dass die Nutzung von Claude CLI im Stil von OpenClaw wieder erlaubt ist; daher behandelt OpenClaw die Wiederverwendung von Claude CLI und die Nutzung von `claude -p` für diese Integration als zulässig, sofern Anthropic keine neue Richtlinie veröffentlicht.
- Das Anthropic-Setup-Token bleibt als unterstützter OpenClaw-Token-Pfad verfügbar, aber OpenClaw bevorzugt jetzt, wenn verfügbar, die Wiederverwendung von Claude CLI und `claude -p`.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- PI-Modellreferenz: `openai-codex/gpt-5.5`
- Native Codex-App-Server-Harness-Referenz: `openai/gpt-5.5` mit `agents.defaults.embeddedHarness.runtime: "codex"`
- Veraltete Modell-Referenzen: `codex/gpt-*`
- Plugin-Grenze: `openai-codex/*` lädt das OpenAI-Plugin; das native Codex-
  App-Server-Plugin wird nur durch die Codex-Harness-Runtime oder veraltete
  `codex/*`-Referenzen ausgewählt.
- CLI: `openclaw onboard --auth-choice openai-codex` oder `openclaw models auth login --provider openai-codex`
- Standard-Transport ist `auto` (WebSocket zuerst, SSE-Fallback)
- Überschreiben Sie pro PI-Modell über `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` oder `"auto"`)
- `params.serviceTier` wird ebenfalls bei nativen Codex-Responses-Requests weitergereicht (`chatgpt.com/backend-api`)
- Verborgene OpenClaw-Attributions-Header (`originator`, `version`,
  `User-Agent`) werden nur an nativen Codex-Datenverkehr zu
  `chatgpt.com/backend-api` angehängt, nicht an generische OpenAI-kompatible Proxys
- Teilt denselben Schalter `/fast` und dieselbe Konfiguration `params.fastMode` wie direktes `openai/*`; OpenClaw bildet dies auf `service_tier=priority` ab
- `openai-codex/gpt-5.5` behält natives `contextWindow = 1000000` und ein standardmäßiges Runtime-`contextTokens = 272000`; überschreiben Sie die Runtime-Obergrenze mit `models.providers.openai-codex.models[].contextTokens`
- Hinweis zur Richtlinie: OpenAI Codex OAuth wird für externe Tools/Workflows wie OpenClaw ausdrücklich unterstützt.
- Der aktuelle Zugriff auf GPT-5.5 verwendet diese OAuth-/Abonnement-Route, bis OpenAI GPT-5.5 in der öffentlichen API aktiviert.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Weitere gehostete Optionen im Stil eines Abonnements

- [Qwen Cloud](/de/providers/qwen): Provider-Oberfläche von Qwen Cloud plus Endpoint-Mapping für Alibaba DashScope und Coding Plan
- [MiniMax](/de/providers/minimax): MiniMax Coding Plan OAuth oder API-Key-Zugriff
- [GLM Models](/de/providers/glm): Z.AI Coding Plan oder allgemeine API-Endpoints

### OpenCode

- Auth: `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`)
- Zen-Runtime-Provider: `opencode`
- Go-Runtime-Provider: `opencode-go`
- Beispielmodelle: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API-Key)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- Optionale Rotation: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, Fallback `GOOGLE_API_KEY` und `OPENCLAW_LIVE_GEMINI_KEY` (einzelne Überschreibung)
- Beispielmodelle: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Kompatibilität: veraltete OpenClaw-Konfiguration mit `google/gemini-3.1-flash-preview` wird zu `google/gemini-3-flash-preview` normalisiert
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Direkte Gemini-Läufe akzeptieren außerdem `agents.defaults.models["google/<model>"].params.cachedContent`
  (oder veraltet `cached_content`), um ein provider-natives
  Handle `cachedContents/...` weiterzugeben; Gemini-Cache-Treffer erscheinen als OpenClaw-`cacheRead`

### Google Vertex und Gemini CLI

- Provider: `google-vertex`, `google-gemini-cli`
- Auth: Vertex verwendet gcloud ADC; Gemini CLI verwendet seinen OAuth-Flow
- Vorsicht: Gemini-CLI-OAuth in OpenClaw ist eine inoffizielle Integration. Einige Benutzer haben nach der Nutzung von Drittanbieter-Clients Einschränkungen bei Google-Konten gemeldet. Prüfen Sie die Google-Nutzungsbedingungen und verwenden Sie ein nicht kritisches Konto, wenn Sie sich dafür entscheiden.
- Gemini-CLI-OAuth wird als Teil des gebündelten `google`-Plugin ausgeliefert.
  - Installieren Sie zuerst Gemini CLI:
    - `brew install gemini-cli`
    - oder `npm install -g @google/gemini-cli`
  - Aktivieren: `openclaw plugins enable google`
  - Anmelden: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Standardmodell: `google-gemini-cli/gemini-3-flash-preview`
  - Hinweis: Sie fügen **keine** Client-ID oder Secret in `openclaw.json` ein. Der CLI-Login-Flow speichert
    Token in Auth-Profilen auf dem Gateway-Host.
  - Wenn Requests nach dem Login fehlschlagen, setzen Sie `GOOGLE_CLOUD_PROJECT` oder `GOOGLE_CLOUD_PROJECT_ID` auf dem Gateway-Host.
  - JSON-Antworten von Gemini CLI werden aus `response` geparst; die Nutzung fällt auf
    `stats` zurück, wobei `stats.cached` in OpenClaw `cacheRead` normalisiert wird.

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- Beispielmodell: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasse: `z.ai/*` und `z-ai/*` werden zu `zai/*` normalisiert
  - `zai-api-key` erkennt den passenden Z.AI-Endpoint automatisch; `zai-coding-global`, `zai-coding-cn`, `zai-global` und `zai-cn` erzwingen eine bestimmte Oberfläche

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- Beispielmodelle: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- Beispielmodell: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Basis-URL: `https://api.kilo.ai/api/gateway/`
- Der statische Fallback-Katalog wird mit `kilocode/kilo/auto` ausgeliefert; die Live-
  Discovery über `https://api.kilo.ai/api/gateway/models` kann den Runtime-
  Katalog weiter erweitern.
- Das genaue Upstream-Routing hinter `kilocode/kilo/auto` wird von Kilo Gateway verwaltet,
  nicht in OpenClaw fest codiert.

Siehe [/providers/kilocode](/de/providers/kilocode) für Details zur Einrichtung.

### Weitere gebündelte Provider-Plugins

| Provider                | Id                               | Auth-Env                                                     | Beispielmodell                                  |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` oder `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` oder `KIMICODE_API_KEY`                       | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

Wissenswerte Besonderheiten:

- **OpenRouter** wendet seine App-Attributions-Header und Anthropic-`cache_control`-Marker nur auf verifizierten `openrouter.ai`-Routen an. Als proxyartiger OpenAI-kompatibler Pfad überspringt es native, nur für OpenAI geltende Formung (`serviceTier`, Responses-`store`, Prompt-Cache-Hinweise, OpenAI-Reasoning-Kompatibilität). Gemini-gestützte Referenzen behalten nur die proxy-Gemini-Bereinigung von Thought-Signaturen bei.
- **Kilo Gateway**: Gemini-gestützte Referenzen folgen demselben Bereinigungspfad für Proxy-Gemini; `kilocode/kilo/auto` und andere Referenzen ohne unterstütztes Proxy-Reasoning überspringen die Proxy-Reasoning-Injektion.
- **MiniMax**: Das Onboarding mit API-Key schreibt explizite M2.7-Modelldefinitionen mit `input: ["text", "image"]`; der gebündelte Katalog hält Chat-Referenzen nur für Text, bis diese Konfiguration materialisiert ist.
- **xAI** verwendet den xAI-Responses-Pfad. `/fast` oder `params.fastMode: true` schreiben `grok-3`, `grok-3-mini`, `grok-4` und `grok-4-0709` auf ihre `*-fast`-Varianten um. `tool_stream` ist standardmäßig aktiviert; deaktivieren Sie es über `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras**-GLM-Modelle verwenden `zai-glm-4.7` / `zai-glm-4.6`; die OpenAI-kompatible Basis-URL ist `https://api.cerebras.ai/v1`.

## Provider über `models.providers` (benutzerdefiniert/Basis-URL)

Verwenden Sie `models.providers` (oder `models.json`), um **benutzerdefinierte** Provider oder
OpenAI-/Anthropic-kompatible Proxys hinzuzufügen.

Viele der unten aufgeführten gebündelten Provider-Plugins veröffentlichen bereits einen Standardkatalog.
Verwenden Sie explizite Einträge unter `models.providers.<id>` nur dann, wenn Sie die
Standard-Basis-URL, Header oder Modellliste überschreiben möchten.

### Moonshot AI (Kimi)

Moonshot wird als gebündeltes Provider-Plugin ausgeliefert. Verwenden Sie den integrierten Provider
standardmäßig und fügen Sie nur dann einen expliziten Eintrag `models.providers.moonshot` hinzu, wenn Sie die Basis-URL oder Modellmetadaten überschreiben müssen:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- Beispielmodell: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` oder `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi-K2-Modell-IDs:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding verwendet den Anthropic-kompatiblen Endpoint von Moonshot AI:

- Provider: `kimi`
- Auth: `KIMI_API_KEY`
- Beispielmodell: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Das veraltete `kimi/k2p5` wird weiterhin als kompatible Modell-ID akzeptiert.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) bietet Zugriff auf Doubao und andere Modelle in China.

- Provider: `volcengine` (Coding: `volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- Beispielmodell: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Das Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine Katalog `volcengine/*`
wird gleichzeitig registriert.

In Onboarding-/Configure-Modellauswahlen bevorzugt die Auth-Auswahl für Volcengine sowohl
Zeilen `volcengine/*` als auch `volcengine-plan/*`. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw auf den ungefilterten Katalog zurück, anstatt eine leere
providerspezifische Auswahl anzuzeigen.

Verfügbare Modelle:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Coding-Modelle (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (international)

BytePlus ARK bietet internationalen Benutzern Zugriff auf dieselben Modelle wie Volcano Engine.

- Provider: `byteplus` (Coding: `byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- Beispielmodell: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Das Onboarding verwendet standardmäßig die Coding-Oberfläche, aber der allgemeine Katalog `byteplus/*`
wird gleichzeitig registriert.

In Onboarding-/Configure-Modellauswahlen bevorzugt die Auth-Auswahl für BytePlus sowohl
Zeilen `byteplus/*` als auch `byteplus-plan/*`. Wenn diese Modelle noch nicht geladen sind,
fällt OpenClaw auf den ungefilterten Katalog zurück, anstatt eine leere
providerspezifische Auswahl anzuzeigen.

Verfügbare Modelle:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Coding-Modelle (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic stellt Anthropic-kompatible Modelle hinter dem Provider `synthetic` bereit:

- Provider: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- Beispielmodell: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax wird über `models.providers` konfiguriert, weil es benutzerdefinierte Endpoints verwendet:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- MiniMax API-Key (Global): `--auth-choice minimax-global-api`
- MiniMax API-Key (CN): `--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` für `minimax`; `MINIMAX_OAUTH_TOKEN` oder
  `MINIMAX_API_KEY` für `minimax-portal`

Siehe [/providers/minimax](/de/providers/minimax) für Einrichtungsdetails, Modelloptionen und Konfigurations-Snippets.

Auf dem Anthropic-kompatiblen Streaming-Pfad von MiniMax deaktiviert OpenClaw Thinking standardmäßig,
sofern Sie es nicht explizit setzen, und `/fast on` schreibt
`MiniMax-M2.7` auf `MiniMax-M2.7-highspeed` um.

Plugin-eigene Aufteilung der Fähigkeiten:

- Standards für Text/Chat bleiben auf `minimax/MiniMax-M2.7`
- Bilderzeugung ist `minimax/image-01` oder `minimax-portal/image-01`
- Bildverständnis ist Plugin-eigenes `MiniMax-VL-01` auf beiden MiniMax-Authentifizierungspfaden
- Websuche bleibt auf der Provider-ID `minimax`

### LM Studio

LM Studio wird als gebündeltes Provider-Plugin ausgeliefert und verwendet die native API:

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- Standard-Basis-URL für Inferenz: `http://localhost:1234/v1`

Setzen Sie dann ein Modell (ersetzen Sie es durch eine der IDs, die von `http://localhost:1234/api/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw verwendet standardmäßig die nativen Endpoints `/api/v1/models` und `/api/v1/models/load` von LM Studio
für Discovery + Auto-Load sowie `/v1/chat/completions` für Inferenz.
Siehe [/providers/lmstudio](/de/providers/lmstudio) für Einrichtung und Fehlerbehebung.

### Ollama

Ollama wird als gebündeltes Provider-Plugin ausgeliefert und verwendet die native API von Ollama:

- Provider: `ollama`
- Auth: Nicht erforderlich (lokaler Server)
- Beispielmodell: `ollama/llama3.3`
- Installation: [https://ollama.com/download](https://ollama.com/download)

```bash
# Installieren Sie Ollama und laden Sie dann ein Modell:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama wird lokal unter `http://127.0.0.1:11434` erkannt, wenn Sie sich mit
`OLLAMA_API_KEY` dafür entscheiden, und das gebündelte Provider-Plugin fügt Ollama direkt zu
`openclaw onboard` und zur Modellauswahl hinzu. Siehe [/providers/ollama](/de/providers/ollama)
für Onboarding, Cloud-/Lokalmodus und benutzerdefinierte Konfiguration.

### vLLM

vLLM wird als gebündeltes Provider-Plugin für lokale/self-hosted OpenAI-kompatible
Server ausgeliefert:

- Provider: `vllm`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:8000/v1`

Um sich lokal für die automatische Discovery zu entscheiden (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt):

```bash
export VLLM_API_KEY="vllm-local"
```

Setzen Sie dann ein Modell (ersetzen Sie es durch eine der IDs, die von `/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Siehe [/providers/vllm](/de/providers/vllm) für Details.

### SGLang

SGLang wird als gebündeltes Provider-Plugin für schnelle self-hosted
OpenAI-kompatible Server ausgeliefert:

- Provider: `sglang`
- Auth: Optional (abhängig von Ihrem Server)
- Standard-Basis-URL: `http://127.0.0.1:30000/v1`

Um sich lokal für die automatische Discovery zu entscheiden (jeder Wert funktioniert, wenn Ihr Server keine
Auth erzwingt):

```bash
export SGLANG_API_KEY="sglang-local"
```

Setzen Sie dann ein Modell (ersetzen Sie es durch eine der IDs, die von `/v1/models` zurückgegeben werden):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Siehe [/providers/sglang](/de/providers/sglang) für Details.

### Lokale Proxys (LM Studio, vLLM, LiteLLM usw.)

Beispiel (OpenAI-kompatibel):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Lokal" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "my-local-model",
            name: "Lokales Modell",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Hinweise:

- Für benutzerdefinierte Provider sind `reasoning`, `input`, `cost`, `contextWindow` und `maxTokens` optional.
  Wenn sie weggelassen werden, verwendet OpenClaw standardmäßig:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Empfohlen: Setzen Sie explizite Werte, die zu den Grenzen Ihres Proxy/Modells passen.
- Für `api: "openai-completions"` auf nicht nativen Endpoints (jede nicht leere `baseUrl`, deren Host nicht `api.openai.com` ist), erzwingt OpenClaw `compat.supportsDeveloperRole: false`, um 400-Fehler des Providers bei nicht unterstützten `developer`-Rollen zu vermeiden.
- Proxyartige OpenAI-kompatible Routen überspringen auch natives, nur für OpenAI geltendes Request-
  Shaping: kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise, keine
  OpenAI-Reasoning-kompatible Payload-Formung und keine verborgenen OpenClaw-Attributions-
  Header.
- Wenn `baseUrl` leer ist/fehlt, behält OpenClaw das Standardverhalten für OpenAI bei (das auf `api.openai.com` aufgelöst wird).
- Aus Sicherheitsgründen wird ein explizites `compat.supportsDeveloperRole: true` auf nicht nativen `openai-completions`-Endpoints weiterhin überschrieben.

## CLI-Beispiele

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Siehe auch: [/gateway/configuration](/de/gateway/configuration) für vollständige Konfigurationsbeispiele.

## Verwandt

- [Modelle](/de/concepts/models) — Modellkonfiguration und Aliasse
- [Model Failover](/de/concepts/model-failover) — Fallback-Ketten und Wiederholungsverhalten
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Schlüssel der Modellkonfiguration
- [Provider](/de/providers) — Einrichtungsleitfäden pro Provider
