---
read_when:
    - Potrzebujesz referencji konfiguracji modeli dla każdego dostawcy z osobna
    - Chcesz przykładowych konfiguracji lub poleceń wdrożenia w CLI dla dostawców modeli
summary: Przegląd dostawców modeli z przykładowymi konfiguracjami + przepływami CLI
title: Dostawcy modeli
x-i18n:
    generated_at: "2026-04-24T15:22:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79258cb26fae7926c65b6fe0db938c7b5736a540b33bc24c1fad5ad706ac8204
    source_path: concepts/model-providers.md
    workflow: 15
---

Ta strona opisuje **dostawców LLM/modeli** (a nie kanały czatu, takie jak WhatsApp/Telegram).
Zasady wyboru modeli znajdziesz w [/concepts/models](/pl/concepts/models).

## Szybkie zasady

- Referencje modeli używają formatu `provider/model` (przykład: `opencode/claude-opus-4-6`).
- `agents.defaults.models` działa jako lista dozwolonych modeli, gdy jest ustawione.
- Pomocniki CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` to natywne metadane modelu; `contextTokens` to efektywny limit środowiska uruchomieniowego.
- Zasady awaryjnego przełączania, sond cooldown i trwałość nadpisywania sesji: [Awaryjne przełączanie modeli](/pl/concepts/model-failover).
- Trasy rodziny OpenAI są specyficzne dla prefiksu: `openai/<model>` używa bezpośredniego dostawcy z kluczem API OpenAI w PI, `openai-codex/<model>` używa OAuth Codex w PI, a `openai/<model>` wraz z `agents.defaults.embeddedHarness.runtime: "codex"` używa natywnej uprzęży app-server Codex. Zobacz [OpenAI](/pl/providers/openai) i [uprząż Codex](/pl/plugins/codex-harness).
- Automatyczne włączanie Plugin również podąża za tym samym rozgraniczeniem: `openai-codex/<model>` należy do Plugin OpenAI, podczas gdy Plugin Codex jest włączany przez `embeddedHarness.runtime: "codex"` lub starsze referencje `codex/<model>`.
- GPT-5.5 jest obecnie dostępny przez trasy subskrypcyjne/OAuth: `openai-codex/gpt-5.5` w PI lub `openai/gpt-5.5` z uprzężą app-server Codex. Bezpośrednia trasa z kluczem API dla `openai/gpt-5.5` będzie obsługiwana, gdy tylko OpenAI udostępni GPT-5.5 w publicznym API; do tego czasu używaj modeli dostępnych przez API, takich jak `openai/gpt-5.4`, w konfiguracjach `OPENAI_API_KEY`.

## Zachowanie dostawców zarządzane przez Plugin

Większość logiki specyficznej dla dostawcy znajduje się w Plugin dostawcy (`registerProvider(...)`), podczas gdy OpenClaw utrzymuje ogólną pętlę wnioskowania. Plugin odpowiadają za wdrażanie, katalogi modeli, mapowanie zmiennych środowiskowych uwierzytelniania, normalizację transportu/konfiguracji, czyszczenie schematów narzędzi, klasyfikację awaryjnego przełączania, odświeżanie OAuth, raportowanie użycia, profile myślenia/wnioskowania i nie tylko.

Pełna lista hooków SDK dostawcy i przykładów wbudowanych Plugin znajduje się w [Plugin dostawców](/pl/plugins/sdk-provider-plugins). Dostawca, który potrzebuje całkowicie niestandardowego wykonawcy żądań, wymaga osobnej, głębszej powierzchni rozszerzeń.

<Note>
Środowiskowe `capabilities` dostawcy to współdzielone metadane wykonawcy (rodzina dostawcy, niuanse transkryptu/narzędzi, wskazówki dotyczące transportu/pamięci podręcznej). To nie to samo co [publiczny model możliwości](/pl/plugins/architecture#public-capability-model), który opisuje, co rejestruje Plugin (wnioskowanie tekstowe, mowa itd.).
</Note>

## Rotacja kluczy API

- Obsługuje ogólną rotację dostawców dla wybranych dostawców.
- Skonfiguruj wiele kluczy przez:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze aktywne nadpisanie, najwyższy priorytet)
  - `<PROVIDER>_API_KEYS` (lista rozdzielana przecinkami lub średnikami)
  - `<PROVIDER>_API_KEY` (klucz główny)
  - `<PROVIDER>_API_KEY_*` (lista numerowana, np. `<PROVIDER>_API_KEY_1`)
- Dla dostawców Google `GOOGLE_API_KEY` jest również uwzględniany jako opcja zapasowa.
- Kolejność wyboru kluczy zachowuje priorytet i usuwa duplikaty wartości.
- Żądania są ponawiane z kolejnym kluczem tylko przy odpowiedziach o limicie szybkości (na przykład `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` lub okresowych komunikatach o limicie użycia).
- Błędy inne niż limit szybkości kończą się natychmiast; nie jest podejmowana próba rotacji klucza.
- Gdy wszystkie kandydackie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Wbudowani dostawcy (katalog pi-ai)

OpenClaw jest dostarczany z katalogiem pi‑ai. Ci dostawcy nie wymagają konfiguracji `models.providers`; wystarczy ustawić uwierzytelnianie i wybrać model.

### OpenAI

- Dostawca: `openai`
- Uwierzytelnianie: `OPENAI_API_KEY`
- Opcjonalna rotacja: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, plus `OPENCLAW_LIVE_OPENAI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- Bezpośrednia obsługa GPT-5.5 przez API jest tutaj przygotowana na przyszłość, gdy OpenAI udostępni GPT-5.5 w API
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Domyślny transport to `auto` (najpierw WebSocket, potem SSE)
- Zastąp dla konkretnego modelu przez `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- Rozgrzewanie OpenAI Responses WebSocket jest domyślnie włączone przez `params.openaiWsWarmup` (`true`/`false`)
- Przetwarzanie priorytetowe OpenAI można włączyć przez `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` i `params.fastMode` mapują bezpośrednie żądania Responses `openai/*` na `service_tier=priority` w `api.openai.com`
- Używaj `params.serviceTier`, jeśli chcesz ustawić jawny poziom zamiast współdzielonego przełącznika `/fast`
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`,
  `User-Agent`) są stosowane tylko w natywnym ruchu OpenAI do `api.openai.com`, a nie w ogólnych proxy zgodnych z OpenAI
- Natywne trasy OpenAI zachowują także Responses `store`, wskazówki pamięci podręcznej promptów oraz kształtowanie ładunku zgodne z rozumowaniem OpenAI; trasy proxy tego nie robią
- `openai/gpt-5.3-codex-spark` jest celowo ukryty w OpenClaw, ponieważ aktywne żądania do API OpenAI go odrzucają, a obecny katalog Codex go nie udostępnia

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Dostawca: `anthropic`
- Uwierzytelnianie: `ANTHROPIC_API_KEY`
- Opcjonalna rotacja: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, plus `OPENCLAW_LIVE_ANTHROPIC_KEY` (pojedyncze nadpisanie)
- Przykładowy model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Bezpośrednie publiczne żądania Anthropic obsługują również współdzielony przełącznik `/fast` i `params.fastMode`, w tym ruch uwierzytelniony kluczem API i OAuth wysyłany do `api.anthropic.com`; OpenClaw mapuje to na Anthropic `service_tier` (`auto` vs `standard_only`)
- Uwaga dotycząca Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako dozwolone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Token konfiguracji Anthropic nadal pozostaje wspieraną ścieżką tokenu w OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Dostawca: `openai-codex`
- Uwierzytelnianie: OAuth (ChatGPT)
- Referencja modelu PI: `openai-codex/gpt-5.5`
- Referencja natywnej uprzęży app-server Codex: `openai/gpt-5.5` z `agents.defaults.embeddedHarness.runtime: "codex"`
- Starsze referencje modeli: `codex/gpt-*`
- Granica Plugin: `openai-codex/*` ładuje Plugin OpenAI; natywny Plugin app-server Codex jest wybierany tylko przez środowisko uprzęży Codex lub starsze referencje `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` lub `openclaw models auth login --provider openai-codex`
- Domyślny transport to `auto` (najpierw WebSocket, potem SSE)
- Zastąp dla konkretnego modelu PI przez `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- `params.serviceTier` jest także przekazywane w natywnych żądaniach Codex Responses (`chatgpt.com/backend-api`)
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`,
  `User-Agent`) są dołączane tylko do natywnego ruchu Codex do
  `chatgpt.com/backend-api`, a nie do ogólnych proxy zgodnych z OpenAI
- Współdzieli ten sam przełącznik `/fast` i konfigurację `params.fastMode` co bezpośrednie `openai/*`; OpenClaw mapuje to na `service_tier=priority`
- `openai-codex/gpt-5.5` zachowuje natywne `contextWindow = 1000000` i domyślny środowiskowy `contextTokens = 272000`; zastąp limit środowiskowy przez `models.providers.openai-codex.models[].contextTokens`
- Uwaga dotycząca polityki: OpenAI Codex OAuth jest jawnie wspierany dla zewnętrznych narzędzi/przepływów pracy, takich jak OpenClaw.
- Obecny dostęp do GPT-5.5 używa tej trasy OAuth/subskrypcyjnej, dopóki OpenAI nie włączy GPT-5.5 w publicznym API.

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

### Inne hostowane opcje w stylu subskrypcyjnym

- [Qwen Cloud](/pl/providers/qwen): powierzchnia dostawcy Qwen Cloud oraz mapowanie endpointów Alibaba DashScope i Coding Plan
- [MiniMax](/pl/providers/minimax): dostęp MiniMax Coding Plan przez OAuth lub klucz API
- [GLM Models](/pl/providers/glm): endpointy Z.AI Coding Plan lub ogólne endpointy API

### OpenCode

- Uwierzytelnianie: `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`)
- Dostawca środowiska Zen: `opencode`
- Dostawca środowiska Go: `opencode-go`
- Przykładowe modele: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` lub `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (klucz API)

- Dostawca: `google`
- Uwierzytelnianie: `GEMINI_API_KEY`
- Opcjonalna rotacja: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, opcja zapasowa `GOOGLE_API_KEY` oraz `OPENCLAW_LIVE_GEMINI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Zgodność: starsza konfiguracja OpenClaw używająca `google/gemini-3.1-flash-preview` jest normalizowana do `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Bezpośrednie uruchomienia Gemini akceptują również `agents.defaults.models["google/<model>"].params.cachedContent`
  (lub starsze `cached_content`) do przekazania natywnego dla dostawcy
  uchwytu `cachedContents/...`; trafienia pamięci podręcznej Gemini są ujawniane jako OpenClaw `cacheRead`

### Google Vertex i Gemini CLI

- Dostawcy: `google-vertex`, `google-gemini-cli`
- Uwierzytelnianie: Vertex używa gcloud ADC; Gemini CLI używa własnego przepływu OAuth
- Uwaga: OAuth Gemini CLI w OpenClaw to nieoficjalna integracja. Niektórzy użytkownicy zgłaszali ograniczenia kont Google po użyciu klientów zewnętrznych. Przejrzyj warunki Google i użyj niekrytycznego konta, jeśli zdecydujesz się kontynuować.
- OAuth Gemini CLI jest dostarczany jako część wbudowanego Plugin `google`.
  - Najpierw zainstaluj Gemini CLI:
    - `brew install gemini-cli`
    - lub `npm install -g @google/gemini-cli`
  - Włącz: `openclaw plugins enable google`
  - Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Model domyślny: `google-gemini-cli/gemini-3-flash-preview`
  - Uwaga: **nie** wklejasz identyfikatora klienta ani sekretu do `openclaw.json`. Przepływ logowania CLI przechowuje
    tokeny w profilach uwierzytelniania na hoście Gateway.
  - Jeśli żądania kończą się błędem po zalogowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway.
  - Odpowiedzi JSON Gemini CLI są parsowane z `response`; użycie wraca do
    `stats`, a `stats.cached` jest normalizowane do OpenClaw `cacheRead`.

### Z.AI (GLM)

- Dostawca: `zai`
- Uwierzytelnianie: `ZAI_API_KEY`
- Przykładowy model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasy: `z.ai/*` i `z-ai/*` są normalizowane do `zai/*`
  - `zai-api-key` automatycznie wykrywa pasujący endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` i `zai-cn` wymuszają określoną powierzchnię

### Vercel AI Gateway

- Dostawca: `vercel-ai-gateway`
- Uwierzytelnianie: `AI_GATEWAY_API_KEY`
- Przykładowe modele: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Dostawca: `kilocode`
- Uwierzytelnianie: `KILOCODE_API_KEY`
- Przykładowy model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Bazowy URL: `https://api.kilo.ai/api/gateway/`
- Statyczny katalog zapasowy jest dostarczany z `kilocode/kilo/auto`; aktywne
  wykrywanie `https://api.kilo.ai/api/gateway/models` może dalej rozszerzać katalog
  środowiskowy.
- Dokładne routowanie nadrzędne za `kilocode/kilo/auto` należy do Kilo Gateway,
  a nie jest zakodowane na stałe w OpenClaw.

Szczegóły konfiguracji znajdziesz w [/providers/kilocode](/pl/providers/kilocode).

### Inne wbudowane Plugin dostawców

| Dostawca                | Id                               | Zmienne środowiskowe uwierzytelniania                         | Przykładowy model                               |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` or `KIMICODE_API_KEY`                         | `kimi/kimi-code`                                |
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

Warto znać następujące niuanse:

- **OpenRouter** stosuje swoje nagłówki atrybucji aplikacji i znaczniki Anthropic `cache_control` tylko na zweryfikowanych trasach `openrouter.ai`. Jako ścieżka proxy zgodna z OpenAI pomija kształtowanie specyficzne tylko dla natywnego OpenAI (`serviceTier`, Responses `store`, wskazówki pamięci podręcznej promptów, zgodność z rozumowaniem OpenAI). Referencje oparte na Gemini zachowują wyłącznie sanityzację sygnatur myślenia proxy-Gemini.
- **Kilo Gateway** dla referencji opartych na Gemini podąża tą samą ścieżką sanityzacji proxy-Gemini; `kilocode/kilo/auto` i inne referencje proxy bez obsługi rozumowania pomijają wstrzykiwanie rozumowania proxy.
- **MiniMax** podczas wdrożenia z kluczem API zapisuje jawne definicje modeli M2.7 z `input: ["text", "image"]`; wbudowany katalog utrzymuje referencje czatu jako tylko tekstowe, dopóki ta konfiguracja nie zostanie zmaterializowana.
- **xAI** używa ścieżki xAI Responses. `/fast` lub `params.fastMode: true` przepisuje `grok-3`, `grok-3-mini`, `grok-4` i `grok-4-0709` na ich warianty `*-fast`. `tool_stream` jest domyślnie włączone; wyłącz przez `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** modele GLM używają `zai-glm-4.7` / `zai-glm-4.6`; bazowy URL zgodny z OpenAI to `https://api.cerebras.ai/v1`.

## Dostawcy przez `models.providers` (niestandardowy/bazowy URL)

Użyj `models.providers` (lub `models.json`), aby dodać **niestandardowych** dostawców lub proxy zgodne z OpenAI/Anthropic.

Wiele z poniższych wbudowanych Plugin dostawców publikuje już domyślny katalog.
Używaj jawnych wpisów `models.providers.<id>` tylko wtedy, gdy chcesz nadpisać
domyślny bazowy URL, nagłówki lub listę modeli.

### Moonshot AI (Kimi)

Moonshot jest dostarczany jako wbudowany Plugin dostawcy. Domyślnie używaj
wbudowanego dostawcy, a jawny wpis `models.providers.moonshot` dodawaj tylko wtedy, gdy
musisz nadpisać bazowy URL lub metadane modelu:

- Dostawca: `moonshot`
- Uwierzytelnianie: `MOONSHOT_API_KEY`
- Przykładowy model: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` lub `openclaw onboard --auth-choice moonshot-api-key-cn`

Id modeli Kimi K2:

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

Kimi Coding używa endpointu Moonshot AI zgodnego z Anthropic:

- Dostawca: `kimi`
- Uwierzytelnianie: `KIMI_API_KEY`
- Przykładowy model: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

Starsze `kimi/k2p5` pozostaje akceptowane jako identyfikator modelu zgodności.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) zapewnia dostęp do Doubao i innych modeli w Chinach.

- Dostawca: `volcengine` (kodowanie: `volcengine-plan`)
- Uwierzytelnianie: `VOLCANO_ENGINE_API_KEY`
- Przykładowy model: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Wdrażanie domyślnie używa powierzchni kodowania, ale ogólny katalog `volcengine/*`
jest rejestrowany jednocześnie.

W selektorach modeli onboarding/configure wybór uwierzytelniania Volcengine preferuje zarówno
wiersze `volcengine/*`, jak i `volcengine-plan/*`. Jeśli te modele nie są jeszcze załadowane,
OpenClaw wraca do niefiltrowanego katalogu zamiast pokazywać pusty
selektor ograniczony do dostawcy.

Dostępne modele:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modele kodowania (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (międzynarodowy)

BytePlus ARK zapewnia międzynarodowym użytkownikom dostęp do tych samych modeli co Volcano Engine.

- Dostawca: `byteplus` (kodowanie: `byteplus-plan`)
- Uwierzytelnianie: `BYTEPLUS_API_KEY`
- Przykładowy model: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Wdrażanie domyślnie używa powierzchni kodowania, ale ogólny katalog `byteplus/*`
jest rejestrowany jednocześnie.

W selektorach modeli onboarding/configure wybór uwierzytelniania BytePlus preferuje zarówno
wiersze `byteplus/*`, jak i `byteplus-plan/*`. Jeśli te modele nie są jeszcze załadowane,
OpenClaw wraca do niefiltrowanego katalogu zamiast pokazywać pusty
selektor ograniczony do dostawcy.

Dostępne modele:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modele kodowania (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic udostępnia modele zgodne z Anthropic za pośrednictwem dostawcy `synthetic`:

- Dostawca: `synthetic`
- Uwierzytelnianie: `SYNTHETIC_API_KEY`
- Przykładowy model: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

MiniMax jest konfigurowany przez `models.providers`, ponieważ używa niestandardowych endpointów:

- MiniMax OAuth (globalnie): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (Chiny): `--auth-choice minimax-cn-oauth`
- Klucz API MiniMax (globalnie): `--auth-choice minimax-global-api`
- Klucz API MiniMax (Chiny): `--auth-choice minimax-cn-api`
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub
  `MINIMAX_API_KEY` dla `minimax-portal`

Szczegóły konfiguracji, opcje modeli i fragmenty konfiguracji znajdziesz w [/providers/minimax](/pl/providers/minimax).

Na ścieżce strumieniowania MiniMax zgodnej z Anthropic OpenClaw domyślnie wyłącza myślenie,
chyba że jawnie je ustawisz, a `/fast on` przepisuje
`MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.

Podział możliwości zarządzany przez Plugin:

- Domyślne ustawienia tekstu/czatu pozostają przy `minimax/MiniMax-M2.7`
- Generowanie obrazów to `minimax/image-01` lub `minimax-portal/image-01`
- Rozumienie obrazów to zarządzany przez Plugin `MiniMax-VL-01` na obu ścieżkach uwierzytelniania MiniMax
- Wyszukiwanie w sieci pozostaje przy id dostawcy `minimax`

### LM Studio

LM Studio jest dostarczany jako wbudowany Plugin dostawcy, który używa natywnego API:

- Dostawca: `lmstudio`
- Uwierzytelnianie: `LM_API_TOKEN`
- Domyślny bazowy URL wnioskowania: `http://localhost:1234/v1`

Następnie ustaw model (zastąp jednym z identyfikatorów zwróconych przez `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw domyślnie używa natywnych endpointów LM Studio `/api/v1/models` i `/api/v1/models/load`
do wykrywania i automatycznego ładowania oraz `/v1/chat/completions` do wnioskowania.
Konfigurację i rozwiązywanie problemów znajdziesz w [/providers/lmstudio](/pl/providers/lmstudio).

### Ollama

Ollama jest dostarczany jako wbudowany Plugin dostawcy i używa natywnego API Ollama:

- Dostawca: `ollama`
- Uwierzytelnianie: niewymagane (serwer lokalny)
- Przykładowy model: `ollama/llama3.3`
- Instalacja: [https://ollama.com/download](https://ollama.com/download)

```bash
# Zainstaluj Ollama, a następnie pobierz model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama jest wykrywany lokalnie pod adresem `http://127.0.0.1:11434`, gdy włączysz go za pomocą
`OLLAMA_API_KEY`, a wbudowany Plugin dostawcy dodaje Ollama bezpośrednio do
`openclaw onboard` i selektora modeli. Zobacz [/providers/ollama](/pl/providers/ollama),
aby poznać szczegóły wdrażania, trybu chmury/lokalnego i konfiguracji niestandardowej.

### vLLM

vLLM jest dostarczany jako wbudowany Plugin dostawcy dla lokalnych/samodzielnie hostowanych
serwerów zgodnych z OpenAI:

- Dostawca: `vllm`
- Uwierzytelnianie: opcjonalne (zależy od twojego serwera)
- Domyślny bazowy URL: `http://127.0.0.1:8000/v1`

Aby włączyć automatyczne wykrywanie lokalnie (dowolna wartość zadziała, jeśli twój serwer nie wymusza uwierzytelniania):

```bash
export VLLM_API_KEY="vllm-local"
```

Następnie ustaw model (zastąp jednym z identyfikatorów zwróconych przez `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Szczegóły znajdziesz w [/providers/vllm](/pl/providers/vllm).

### SGLang

SGLang jest dostarczany jako wbudowany Plugin dostawcy dla szybkich, samodzielnie hostowanych
serwerów zgodnych z OpenAI:

- Dostawca: `sglang`
- Uwierzytelnianie: opcjonalne (zależy od twojego serwera)
- Domyślny bazowy URL: `http://127.0.0.1:30000/v1`

Aby włączyć automatyczne wykrywanie lokalnie (dowolna wartość zadziała, jeśli twój serwer nie
wymusza uwierzytelniania):

```bash
export SGLANG_API_KEY="sglang-local"
```

Następnie ustaw model (zastąp jednym z identyfikatorów zwróconych przez `/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Szczegóły znajdziesz w [/providers/sglang](/pl/providers/sglang).

### Lokalne proxy (LM Studio, vLLM, LiteLLM itp.)

Przykład (zgodny z OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
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
            name: "Local Model",
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

Uwagi:

- Dla niestandardowych dostawców `reasoning`, `input`, `cost`, `contextWindow` i `maxTokens` są opcjonalne.
  Po pominięciu OpenClaw domyślnie używa:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Zalecane: ustaw jawne wartości zgodne z limitami twojego proxy/modelu.
- Dla `api: "openai-completions"` na nienatywnych endpointach (dowolny niepusty `baseUrl`, którego host nie jest `api.openai.com`) OpenClaw wymusza `compat.supportsDeveloperRole: false`, aby uniknąć błędów 400 dostawcy dla nieobsługiwanych ról `developer`.
- Trasy proxy zgodne z OpenAI pomijają również kształtowanie żądań specyficzne tylko dla natywnego OpenAI: brak `service_tier`, brak Responses `store`, brak wskazówek pamięci podręcznej promptów, brak kształtowania ładunku zgodnego z rozumowaniem OpenAI i brak ukrytych nagłówków atrybucji OpenClaw.
- Jeśli `baseUrl` jest pusty/pominięty, OpenClaw zachowuje domyślne działanie OpenAI (które wskazuje na `api.openai.com`).
- Dla bezpieczeństwa jawne `compat.supportsDeveloperRole: true` nadal jest nadpisywane na nienatywnych endpointach `openai-completions`.

## Przykłady CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Zobacz także: [/gateway/configuration](/pl/gateway/configuration), aby uzyskać pełne przykłady konfiguracji.

## Powiązane

- [Modele](/pl/concepts/models) — konfiguracja modeli i aliasy
- [Awaryjne przełączanie modeli](/pl/concepts/model-failover) — łańcuchy zapasowe i zachowanie ponawiania
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — klucze konfiguracji modeli
- [Dostawcy](/pl/providers) — przewodniki konfiguracji dla poszczególnych dostawców
