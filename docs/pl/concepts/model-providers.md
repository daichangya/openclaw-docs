---
read_when:
    - Potrzebujesz dokumentacji konfiguracji modeli provider po providerze
    - Chcesz zobaczyć przykładowe konfiguracje lub polecenia onboardingu CLI dla providerów modeli
summary: Przegląd providerów modeli z przykładowymi konfiguracjami i przepływami CLI
title: Providery modeli
x-i18n:
    generated_at: "2026-04-25T13:45:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe2871809711608b3e1d996084b834978b15f21dfeea1ac767dce4c1299be0aa
    source_path: concepts/model-providers.md
    workflow: 15
---

Dokumentacja **providerów LLM/modeli** (nie kanałów czatu, takich jak WhatsApp/Telegram). Zasady wyboru modeli znajdziesz w [Models](/pl/concepts/models).

## Szybkie zasady

- Referencje modeli używają formatu `provider/model` (przykład: `opencode/claude-opus-4-6`).
- `agents.defaults.models` działa jako allowlista, jeśli jest ustawione.
- Pomocniki CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
- `models.providers.*.models[].contextWindow` to natywne metadane modelu; `contextTokens` to efektywny limit runtime.
- Zasady fallbacku, próby cooldown i utrwalanie nadpisań sesji: [Model failover](/pl/concepts/model-failover).
- Trasy rodziny OpenAI są rozdzielane według prefiksu: `openai/<model>` używa bezpośredniego
  providera klucza API OpenAI w Pi, `openai-codex/<model>` używa OAuth Codex w Pi,
  a `openai/<model>` wraz z `agents.defaults.embeddedHarness.runtime: "codex"` używa natywnego harnessu serwera aplikacji Codex. Zobacz [OpenAI](/pl/providers/openai)
  i [Codex harness](/pl/plugins/codex-harness). Jeśli rozdział provider/runtime jest
  mylący, najpierw przeczytaj [Agent runtimes](/pl/concepts/agent-runtimes).
- Automatyczne włączanie Pluginów podąża za tym samym rozgraniczeniem: `openai-codex/<model>` należy
  do Plugin OpenAI, podczas gdy Plugin Codex jest włączany przez
  `embeddedHarness.runtime: "codex"` lub starsze referencje `codex/<model>`.
- Runtime CLI używają tego samego podziału: wybieraj kanoniczne referencje modeli, takie jak
  `anthropic/claude-*`, `google/gemini-*` lub `openai/gpt-*`, a następnie ustaw
  `agents.defaults.embeddedHarness.runtime` na `claude-cli`,
  `google-gemini-cli` lub `codex-cli`, gdy chcesz użyć lokalnego backendu CLI.
  Starsze referencje `claude-cli/*`, `google-gemini-cli/*` i `codex-cli/*` są migrowane
  z powrotem do kanonicznych referencji providerów, a runtime jest zapisywany osobno.
- GPT-5.5 jest dostępny przez `openai-codex/gpt-5.5` w Pi, natywny
  harness serwera aplikacji Codex oraz publiczne API OpenAI, gdy dołączony katalog PI
  udostępnia `openai/gpt-5.5` dla Twojej instalacji.

## Zachowanie providerów należące do Pluginów

Większość logiki specyficznej dla providera znajduje się w Pluginach providerów (`registerProvider(...)`), podczas gdy OpenClaw utrzymuje ogólną pętlę inferencji. Pluginy odpowiadają za onboarding, katalogi modeli, mapowanie zmiennych środowiskowych uwierzytelniania, normalizację transportu/konfiguracji, porządkowanie schematów narzędzi, klasyfikację failoveru, odświeżanie OAuth, raportowanie użycia, profile myślenia/wnioskowania i inne elementy.

Pełna lista hooków SDK providerów i przykłady dołączonych Pluginów znajduje się w [Provider plugins](/pl/plugins/sdk-provider-plugins). Provider wymagający całkowicie własnego executora żądań to osobna, głębsza powierzchnia rozszerzeń.

<Note>
`capabilities` runtime providera to współdzielone metadane wykonawcy (rodzina providera, osobliwości transkryptu/narzędzi, wskazówki transportu/cache). To nie to samo co [public capability model](/pl/plugins/architecture#public-capability-model), który opisuje, co rejestruje Plugin (inferencję tekstu, mowę itd.).
</Note>

## Rotacja kluczy API

- Obsługuje ogólną rotację providerów dla wybranych providerów.
- Skonfiguruj wiele kluczy przez:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY` (pojedyncze nadpisanie live, najwyższy priorytet)
  - `<PROVIDER>_API_KEYS` (lista rozdzielana przecinkami lub średnikami)
  - `<PROVIDER>_API_KEY` (klucz główny)
  - `<PROVIDER>_API_KEY_*` (lista numerowana, np. `<PROVIDER>_API_KEY_1`)
- Dla providerów Google jako fallback uwzględniany jest również `GOOGLE_API_KEY`.
- Kolejność wyboru kluczy zachowuje priorytet i usuwa duplikaty wartości.
- Żądania są ponawiane z następnym kluczem tylko przy odpowiedziach o limicie szybkości (na
  przykład `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many
concurrent requests`, `ThrottlingException`, `concurrency limit reached`,
  `workers_ai ... quota limit exceeded` lub okresowych komunikatach o limicie użycia).
- Błędy inne niż limity szybkości kończą się natychmiastowym niepowodzeniem; nie jest podejmowana próba rotacji kluczy.
- Gdy wszystkie kandydackie klucze zawiodą, zwracany jest końcowy błąd z ostatniej próby.

## Wbudowani providery (katalog pi-ai)

OpenClaw jest dostarczany z katalogiem pi‑ai. Ci providery **nie**
wymagają konfiguracji `models.providers`; wystarczy ustawić uwierzytelnianie i wybrać model.

### OpenAI

- Provider: `openai`
- Uwierzytelnianie: `OPENAI_API_KEY`
- Opcjonalna rotacja: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2` oraz `OPENCLAW_LIVE_OPENAI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `openai/gpt-5.5`, `openai/gpt-5.4`, `openai/gpt-5.4-mini`
- Obsługa bezpośredniego API GPT-5.5 zależy od wersji dołączonego katalogu PI dla
  Twojej instalacji; zweryfikuj przez `openclaw models list --provider openai` przed
  użyciem `openai/gpt-5.5` bez runtime serwera aplikacji Codex.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Domyślny transport to `auto` (najpierw WebSocket, fallback do SSE)
- Nadpisanie per model przez `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- Rozgrzewanie OpenAI Responses WebSocket jest domyślnie włączone przez `params.openaiWsWarmup` (`true`/`false`)
- Priorytetowe przetwarzanie OpenAI można włączyć przez `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` i `params.fastMode` mapują bezpośrednie żądania `openai/*` Responses na `service_tier=priority` w `api.openai.com`
- Używaj `params.serviceTier`, gdy chcesz jawnie ustawić poziom zamiast współdzielonego przełącznika `/fast`
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`,
  `User-Agent`) są stosowane tylko w natywnym ruchu OpenAI do `api.openai.com`, a nie
  do ogólnych proxy zgodnych z OpenAI
- Natywne trasy OpenAI zachowują również `store` Responses, wskazówki prompt-cache oraz
  kształtowanie ładunków zgodne z rozumowaniem OpenAI; trasy proxy tego nie robią
- `openai/gpt-5.3-codex-spark` jest celowo ukryty w OpenClaw, ponieważ żądania do live API OpenAI go odrzucają, a bieżący katalog Codex go nie udostępnia

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Uwierzytelnianie: `ANTHROPIC_API_KEY`
- Opcjonalna rotacja: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2` oraz `OPENCLAW_LIVE_ANTHROPIC_KEY` (pojedyncze nadpisanie)
- Przykładowy model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Bezpośrednie publiczne żądania Anthropic obsługują współdzielony przełącznik `/fast` i `params.fastMode`, w tym ruch uwierzytelniony kluczem API i OAuth wysyłany do `api.anthropic.com`; OpenClaw mapuje to na Anthropic `service_tier` (`auto` vs `standard_only`)
- Uwaga dotycząca Anthropic: pracownicy Anthropic poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje ponowne użycie Claude CLI i użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje nową politykę.
- Token konfiguracji Anthropic nadal pozostaje obsługiwaną ścieżką tokenu OpenClaw, ale OpenClaw preferuje teraz ponowne użycie Claude CLI i `claude -p`, gdy są dostępne.

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth OpenAI Codex

- Provider: `openai-codex`
- Uwierzytelnianie: OAuth (ChatGPT)
- Referencja modelu PI: `openai-codex/gpt-5.5`
- Referencja natywnego harnessu serwera aplikacji Codex: `openai/gpt-5.5` z `agents.defaults.embeddedHarness.runtime: "codex"`
- Dokumentacja natywnego harnessu serwera aplikacji Codex: [Codex harness](/pl/plugins/codex-harness)
- Starsze referencje modeli: `codex/gpt-*`
- Granica Plugin: `openai-codex/*` ładuje Plugin OpenAI; natywny Plugin serwera aplikacji Codex
  jest wybierany tylko przez runtime Codex harness lub starsze
  referencje `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` lub `openclaw models auth login --provider openai-codex`
- Domyślny transport to `auto` (najpierw WebSocket, fallback do SSE)
- Nadpisanie per model PI przez `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"` lub `"auto"`)
- `params.serviceTier` jest również przekazywane w natywnych żądaniach Codex Responses (`chatgpt.com/backend-api`)
- Ukryte nagłówki atrybucji OpenClaw (`originator`, `version`,
  `User-Agent`) są dołączane tylko w natywnym ruchu Codex do
  `chatgpt.com/backend-api`, a nie do ogólnych proxy zgodnych z OpenAI
- Współdzieli ten sam przełącznik `/fast` i konfigurację `params.fastMode` co bezpośrednie `openai/*`; OpenClaw mapuje to na `service_tier=priority`
- `openai-codex/gpt-5.5` używa natywnego `contextWindow = 400000` z katalogu Codex i domyślnego runtime `contextTokens = 272000`; nadpisz limit runtime przez `models.providers.openai-codex.models[].contextTokens`
- Uwaga dotycząca zasad: OAuth OpenAI Codex jest jawnie obsługiwany dla zewnętrznych narzędzi/przepływów pracy, takich jak OpenClaw.
- Użyj `openai-codex/gpt-5.5`, gdy chcesz użyć ścieżki Codex OAuth/subskrypcji; użyj `openai/gpt-5.5`, gdy Twoja konfiguracja klucza API i lokalny katalog udostępniają trasę publicznego API.

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

- [Qwen Cloud](/pl/providers/qwen): powierzchnia providera Qwen Cloud oraz mapowanie endpointów Alibaba DashScope i Coding Plan
- [MiniMax](/pl/providers/minimax): dostęp MiniMax Coding Plan przez OAuth lub klucz API
- [GLM models](/pl/providers/glm): endpointy Z.AI Coding Plan lub ogólnego API

### OpenCode

- Uwierzytelnianie: `OPENCODE_API_KEY` (lub `OPENCODE_ZEN_API_KEY`)
- Provider runtime Zen: `opencode`
- Provider runtime Go: `opencode-go`
- Przykładowe modele: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` lub `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (klucz API)

- Provider: `google`
- Uwierzytelnianie: `GEMINI_API_KEY`
- Opcjonalna rotacja: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, fallback `GOOGLE_API_KEY` oraz `OPENCLAW_LIVE_GEMINI_KEY` (pojedyncze nadpisanie)
- Przykładowe modele: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Zgodność: starsza konfiguracja OpenClaw używająca `google/gemini-3.1-flash-preview` jest normalizowana do `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Myślenie: `/think adaptive` używa dynamicznego myślenia Google. Gemini 3/3.1 pomijają stałe
  `thinkingLevel`; Gemini 2.5 wysyła `thinkingBudget: -1`.
- Bezpośrednie uruchomienia Gemini akceptują również `agents.defaults.models["google/<model>"].params.cachedContent`
  (lub starsze `cached_content`) do przekazania natywnego dla providera
  uchwytu `cachedContents/...`; trafienia cache Gemini są ujawniane jako OpenClaw `cacheRead`

### Google Vertex i Gemini CLI

- Providery: `google-vertex`, `google-gemini-cli`
- Uwierzytelnianie: Vertex używa gcloud ADC; Gemini CLI używa własnego przepływu OAuth
- Uwaga: OAuth Gemini CLI w OpenClaw to nieoficjalna integracja. Niektórzy użytkownicy zgłaszali ograniczenia kont Google po użyciu klientów zewnętrznych. Zapoznaj się z warunkami Google i użyj niekrytycznego konta, jeśli zdecydujesz się kontynuować.
- OAuth Gemini CLI jest dostarczany jako część dołączonego Plugin `google`.
  - Najpierw zainstaluj Gemini CLI:
    - `brew install gemini-cli`
    - lub `npm install -g @google/gemini-cli`
  - Włącz: `openclaw plugins enable google`
  - Zaloguj się: `openclaw models auth login --provider google-gemini-cli --set-default`
  - Model domyślny: `google-gemini-cli/gemini-3-flash-preview`
  - Uwaga: **nie** wklejasz client id ani secret do `openclaw.json`. Przepływ logowania CLI zapisuje
    tokeny w profilach uwierzytelniania na hoście Gateway.
  - Jeśli żądania kończą się niepowodzeniem po zalogowaniu, ustaw `GOOGLE_CLOUD_PROJECT` lub `GOOGLE_CLOUD_PROJECT_ID` na hoście Gateway.
  - Odpowiedzi JSON Gemini CLI są analizowane z `response`; użycie jako fallback pobierane jest ze
    `stats`, a `stats.cached` jest normalizowane do OpenClaw `cacheRead`.

### Z.AI (GLM)

- Provider: `zai`
- Uwierzytelnianie: `ZAI_API_KEY`
- Przykładowy model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Aliasy: `z.ai/*` i `z-ai/*` są normalizowane do `zai/*`
  - `zai-api-key` automatycznie wykrywa pasujący endpoint Z.AI; `zai-coding-global`, `zai-coding-cn`, `zai-global` i `zai-cn` wymuszają określoną powierzchnię

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Uwierzytelnianie: `AI_GATEWAY_API_KEY`
- Przykładowe modele: `vercel-ai-gateway/anthropic/claude-opus-4.6`,
  `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Uwierzytelnianie: `KILOCODE_API_KEY`
- Przykładowy model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Bazowy URL: `https://api.kilo.ai/api/gateway/`
- Statyczny katalog awaryjny zawiera `kilocode/kilo/auto`; live
  odkrywanie przez `https://api.kilo.ai/api/gateway/models` może dalej rozszerzać
  katalog runtime.
- Dokładny routing upstream za `kilocode/kilo/auto` należy do Kilo Gateway,
  a nie jest zakodowany na stałe w OpenClaw.

Zobacz [/providers/kilocode](/pl/providers/kilocode), aby poznać szczegóły konfiguracji.

### Inne dołączone Pluginy providerów

| Provider                | Id                               | Zmienna env uwierzytelniania                                  | Przykładowy model                               |
| ----------------------- | -------------------------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                            | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                            | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                               | —                                               |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                            | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`          | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                                | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` lub `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                            | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` lub `KIMICODE_API_KEY`                         | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                     | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                             | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                            | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                              | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                          | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                             | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY`  | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                             | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                            | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                              | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                          | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                      | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                 | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                              | `xiaomi/mimo-v2-flash`                          |

Warto znać następujące osobliwości:

- **OpenRouter** stosuje swoje nagłówki atrybucji aplikacji i znaczniki Anthropic `cache_control` tylko na zweryfikowanych trasach `openrouter.ai`. Referencje DeepSeek, Moonshot i ZAI kwalifikują się do TTL cache dla zarządzanego przez OpenRouter prompt caching, ale nie otrzymują znaczników cache Anthropic. Jako ścieżka proxy zgodna z OpenAI pomija kształtowanie specyficzne tylko dla natywnego OpenAI (`serviceTier`, Responses `store`, wskazówki prompt-cache, zgodność z rozumowaniem OpenAI). Referencje oparte na Gemini zachowują tylko sanityzację thought-signature proxy-Gemini.
- **Kilo Gateway** dla referencji opartych na Gemini podąża tą samą ścieżką sanityzacji proxy-Gemini; `kilocode/kilo/auto` i inne referencje proxy bez obsługi rozumowania pomijają wstrzykiwanie rozumowania proxy.
- **MiniMax** onboarding klucza API zapisuje jawne definicje modeli czatu M2.7 tylko dla tekstu; rozumienie obrazów pozostaje na należącym do Plugin providerze multimediów `MiniMax-VL-01`.
- **xAI** używa ścieżki xAI Responses. `/fast` lub `params.fastMode: true` przepisuje `grok-3`, `grok-3-mini`, `grok-4` i `grok-4-0709` na ich warianty `*-fast`. `tool_stream` jest domyślnie włączone; wyłącz przez `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
- **Cerebras** modele GLM używają `zai-glm-4.7` / `zai-glm-4.6`; bazowy URL zgodny z OpenAI to `https://api.cerebras.ai/v1`.

## Providery przez `models.providers` (własny/base URL)

Użyj `models.providers` (lub `models.json`), aby dodać **własnych** providerów lub
proxy zgodne z OpenAI/Anthropic.

Wiele z poniższych dołączonych Pluginów providerów publikuje już domyślny katalog.
Używaj jawnych wpisów `models.providers.<id>` tylko wtedy, gdy chcesz nadpisać
domyślny bazowy URL, nagłówki lub listę modeli.

### Moonshot AI (Kimi)

Moonshot jest dostarczany jako dołączony Plugin providera. Domyślnie używaj wbudowanego providera,
a jawny wpis `models.providers.moonshot` dodawaj tylko wtedy, gdy
musisz nadpisać bazowy URL lub metadane modelu:

- Provider: `moonshot`
- Uwierzytelnianie: `MOONSHOT_API_KEY`
- Przykładowy model: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` lub `openclaw onboard --auth-choice moonshot-api-key-cn`

Identyfikatory modeli Kimi K2:

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

- Provider: `kimi`
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

Starsze `kimi/k2p5` pozostaje akceptowane jako zgodny wstecz identyfikator modelu.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) zapewnia dostęp do Doubao i innych modeli w Chinach.

- Provider: `volcengine` (coding: `volcengine-plan`)
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

Onboarding domyślnie używa powierzchni coding, ale ogólny katalog `volcengine/*`
jest rejestrowany jednocześnie.

W selektorach modeli onboardingu/konfiguracji wybór uwierzytelniania Volcengine preferuje zarówno
wiersze `volcengine/*`, jak i `volcengine-plan/*`. Jeśli te modele nie są jeszcze załadowane,
OpenClaw wraca do niefiltrowanego katalogu zamiast pokazywać pusty
selektor ograniczony do providera.

Dostępne modele:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

Modele coding (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus (międzynarodowy)

BytePlus ARK zapewnia dostęp do tych samych modeli co Volcano Engine dla użytkowników międzynarodowych.

- Provider: `byteplus` (coding: `byteplus-plan`)
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

Onboarding domyślnie używa powierzchni coding, ale ogólny katalog `byteplus/*`
jest rejestrowany jednocześnie.

W selektorach modeli onboardingu/konfiguracji wybór uwierzytelniania BytePlus preferuje zarówno
wiersze `byteplus/*`, jak i `byteplus-plan/*`. Jeśli te modele nie są jeszcze załadowane,
OpenClaw wraca do niefiltrowanego katalogu zamiast pokazywać pusty
selektor ograniczony do providera.

Dostępne modele:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

Modele coding (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic udostępnia modele zgodne z Anthropic za providerem `synthetic`:

- Provider: `synthetic`
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

MiniMax jest konfigurowany przez `models.providers`, ponieważ używa własnych endpointów:

- MiniMax OAuth (Global): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Klucz API MiniMax (Global): `--auth-choice minimax-global-api`
- Klucz API MiniMax (CN): `--auth-choice minimax-cn-api`
- Uwierzytelnianie: `MINIMAX_API_KEY` dla `minimax`; `MINIMAX_OAUTH_TOKEN` lub
  `MINIMAX_API_KEY` dla `minimax-portal`

Zobacz [/providers/minimax](/pl/providers/minimax), aby poznać szczegóły konfiguracji, opcje modeli i fragmenty konfiguracji.

Na ścieżce streamingu zgodnej z Anthropic w MiniMax OpenClaw domyślnie wyłącza myślenie,
chyba że jawnie je ustawisz, a `/fast on` przepisuje
`MiniMax-M2.7` na `MiniMax-M2.7-highspeed`.

Podział capabilities należący do Plugin:

- Domyślne ustawienia tekstu/czatu pozostają na `minimax/MiniMax-M2.7`
- Generowanie obrazów to `minimax/image-01` lub `minimax-portal/image-01`
- Rozumienie obrazów jest należącym do Plugin `MiniMax-VL-01` na obu ścieżkach uwierzytelniania MiniMax
- Wyszukiwanie w sieci pozostaje na identyfikatorze providera `minimax`

### LM Studio

LM Studio jest dostarczane jako dołączony Plugin providera, który używa natywnego API:

- Provider: `lmstudio`
- Uwierzytelnianie: `LM_API_TOKEN`
- Domyślny bazowy URL inferencji: `http://localhost:1234/v1`

Następnie ustaw model (zastąp jednym z identyfikatorów zwróconych przez `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw używa natywnych endpointów LM Studio `/api/v1/models` i `/api/v1/models/load`
do wykrywania + automatycznego ładowania oraz domyślnie `/v1/chat/completions` do inferencji.
Zobacz [/providers/lmstudio](/pl/providers/lmstudio), aby poznać konfigurację i rozwiązywanie problemów.

### Ollama

Ollama jest dostarczana jako dołączony Plugin providera i używa natywnego API Ollama:

- Provider: `ollama`
- Uwierzytelnianie: nie jest wymagane (serwer lokalny)
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

Ollama jest wykrywana lokalnie pod adresem `http://127.0.0.1:11434`, gdy włączysz ją przez
`OLLAMA_API_KEY`, a dołączony Plugin providera dodaje Ollama bezpośrednio do
`openclaw onboard` i selektora modeli. Zobacz [/providers/ollama](/pl/providers/ollama),
aby poznać onboarding, tryb chmurowy/lokalny i konfigurację niestandardową.

### vLLM

vLLM jest dostarczane jako dołączony Plugin providera dla lokalnych/hostowanych samodzielnie serwerów
zgodnych z OpenAI:

- Provider: `vllm`
- Uwierzytelnianie: opcjonalne (zależy od Twojego serwera)
- Domyślny bazowy URL: `http://127.0.0.1:8000/v1`

Aby lokalnie włączyć automatyczne wykrywanie (dowolna wartość działa, jeśli Twój serwer nie wymusza uwierzytelniania):

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

SGLang jest dostarczane jako dołączony Plugin providera dla szybkich, hostowanych samodzielnie
serwerów zgodnych z OpenAI:

- Provider: `sglang`
- Uwierzytelnianie: opcjonalne (zależy od Twojego serwera)
- Domyślny bazowy URL: `http://127.0.0.1:30000/v1`

Aby lokalnie włączyć automatyczne wykrywanie (dowolna wartość działa, jeśli Twój serwer nie
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

- Dla własnych providerów `reasoning`, `input`, `cost`, `contextWindow` i `maxTokens` są opcjonalne.
  Po pominięciu OpenClaw używa domyślnie:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- Zalecane: ustaw jawne wartości zgodne z limitami Twojego proxy/modelu.
- Dla `api: "openai-completions"` na nienatywnych endpointach (dowolny niepusty `baseUrl`, którego host nie jest `api.openai.com`) OpenClaw wymusza `compat.supportsDeveloperRole: false`, aby uniknąć błędów providera 400 dla nieobsługiwanych ról `developer`.
- Trasy w stylu proxy zgodne z OpenAI pomijają także kształtowanie żądań specyficzne tylko dla natywnego OpenAI: bez `service_tier`, bez Responses `store`, bez Completions `store`, bez wskazówek prompt-cache, bez kształtowania ładunków zgodnych z rozumowaniem OpenAI i bez ukrytych nagłówków atrybucji OpenClaw.
- Dla proxy Completions zgodnych z OpenAI, które potrzebują pól specyficznych dla dostawcy, ustaw `agents.defaults.models["provider/model"].params.extra_body` (lub `extraBody`), aby scalić dodatkowy JSON z wychodzącym ciałem żądania.
- Jeśli `baseUrl` jest puste/pominięte, OpenClaw zachowuje domyślne zachowanie OpenAI (które rozwiązuje się do `api.openai.com`).
- Dla bezpieczeństwa jawne `compat.supportsDeveloperRole: true` nadal jest nadpisywane na nienatywnych endpointach `openai-completions`.

## Przykłady CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Zobacz także: [Konfiguracja](/pl/gateway/configuration), aby poznać pełne przykłady konfiguracji.

## Powiązane

- [Models](/pl/concepts/models) — konfiguracja modeli i aliasy
- [Model failover](/pl/concepts/model-failover) — łańcuchy fallbacku i zachowanie ponawiania
- [Dokumentacja konfiguracji](/pl/gateway/config-agents#agent-defaults) — klucze konfiguracji modeli
- [Providery](/pl/providers) — przewodniki konfiguracji per provider
