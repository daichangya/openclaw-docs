---
read_when:
    - Chcesz udostępniać modele z własnej maszyny GPU
    - Konfigurujesz LM Studio lub proxy zgodne z OpenAI
    - Potrzebujesz najbezpieczniejszych wskazówek dotyczących modeli lokalnych
summary: Uruchamianie OpenClaw na lokalnych modelach LLM (LM Studio, vLLM, LiteLLM, niestandardowe endpointy OpenAI)
title: Modele lokalne
x-i18n:
    generated_at: "2026-04-08T02:14:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: d619d72b0e06914ebacb7e9f38b746caf1b9ce8908c9c6638c3acdddbaa025e8
    source_path: gateway/local-models.md
    workflow: 15
---

# Modele lokalne

Uruchamianie lokalne jest możliwe, ale OpenClaw oczekuje dużego kontekstu oraz silnych zabezpieczeń przed prompt injection. Małe karty skracają kontekst i osłabiają bezpieczeństwo. Celuj wysoko: **≥2 w pełni wyposażone Mac Studio lub równoważny zestaw GPU (~30 tys. USD+)**. Pojedynczy procesor GPU **24 GB** sprawdzi się tylko przy lżejszych promptach i większych opóźnieniach. Używaj **największego / pełnowymiarowego wariantu modelu, jaki możesz uruchomić**; agresywnie kwantyzowane lub „małe” checkpointy zwiększają ryzyko prompt injection (zobacz [Bezpieczeństwo](/pl/gateway/security)).

Jeśli chcesz skonfigurować lokalne środowisko z jak najmniejszym tarciem, zacznij od [Ollama](/pl/providers/ollama) i `openclaw onboard`. Ta strona to opiniotwórczy przewodnik po bardziej zaawansowanych lokalnych stosach oraz niestandardowych lokalnych serwerach zgodnych z OpenAI.

## Zalecane: LM Studio + duży model lokalny (Responses API)

Obecnie najlepszy lokalny stos. Załaduj duży model do LM Studio (na przykład pełnowymiarową kompilację Qwen, DeepSeek lub Llama), włącz lokalny serwer (domyślnie `http://127.0.0.1:1234`) i użyj Responses API, aby oddzielić rozumowanie od tekstu końcowego.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Lista kontrolna konfiguracji**

- Zainstaluj LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- W LM Studio pobierz **największą dostępną kompilację modelu** (unikaj wariantów „small” / mocno kwantyzowanych), uruchom serwer i potwierdź, że `http://127.0.0.1:1234/v1/models` go wyświetla.
- Zastąp `my-local-model` rzeczywistym identyfikatorem modelu widocznym w LM Studio.
- Utrzymuj model załadowany; zimne ładowanie zwiększa opóźnienie startu.
- Dostosuj `contextWindow`/`maxTokens`, jeśli Twoja kompilacja LM Studio się różni.
- W przypadku WhatsApp trzymaj się Responses API, aby wysyłany był tylko tekst końcowy.

Nawet przy uruchamianiu lokalnym pozostaw skonfigurowane modele hostowane; użyj `models.mode: "merge"`, aby fallbacki pozostały dostępne.

### Konfiguracja hybrydowa: hostowany model podstawowy, lokalny fallback

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Najpierw lokalnie, z hostowaną siatką bezpieczeństwa

Zamień kolejność modelu podstawowego i fallbacku; zachowaj ten sam blok providerów oraz `models.mode: "merge"`, aby móc przełączyć się awaryjnie na Sonnet lub Opus, gdy lokalna maszyna będzie niedostępna.

### Hosting regionalny / routing danych

- Hostowane warianty MiniMax/Kimi/GLM są również dostępne w OpenRouter z endpointami przypiętymi do regionu (np. hostowanymi w USA). Wybierz tam wariant regionalny, aby utrzymać ruch w wybranej jurysdykcji, nadal używając `models.mode: "merge"` dla fallbacków Anthropic/OpenAI.
- Tryb wyłącznie lokalny pozostaje najmocniejszą ścieżką pod względem prywatności; hostowany routing regionalny to rozwiązanie pośrednie, gdy potrzebujesz funkcji dostawcy, ale chcesz zachować kontrolę nad przepływem danych.

## Inne lokalne proxy zgodne z OpenAI

vLLM, LiteLLM, OAI-proxy lub niestandardowe bramy działają, jeśli udostępniają endpoint `/v1` w stylu OpenAI. Zastąp powyższy blok providera swoim endpointem i identyfikatorem modelu:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Zachowaj `models.mode: "merge"`, aby hostowane modele nadal były dostępne jako fallbacki.

Uwagi dotyczące działania dla lokalnych / proxowanych backendów `/v1`:

- OpenClaw traktuje je jako trasy proxy zgodne z OpenAI, a nie natywne endpointy OpenAI
- natywne kształtowanie żądań tylko dla OpenAI nie ma tu zastosowania: brak
  `service_tier`, brak Responses `store`, brak kształtowania payloadu zgodności z rozumowaniem OpenAI
  oraz brak wskazówek dotyczących cache promptów
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
  nie są wstrzykiwane dla tych niestandardowych adresów URL proxy

Uwagi o zgodności dla bardziej rygorystycznych backendów zgodnych z OpenAI:

- Niektóre serwery akceptują w Chat Completions tylko string `messages[].content`, a nie
  ustrukturyzowane tablice części treści. Ustaw
  `models.providers.<provider>.models[].compat.requiresStringContent: true` dla
  takich endpointów.
- Niektóre mniejsze lub bardziej rygorystyczne lokalne backendy są niestabilne przy pełnym
  kształcie promptu środowiska uruchomieniowego agenta OpenClaw, szczególnie gdy dołączone są schematy narzędzi. Jeśli
  backend działa dla małych bezpośrednich wywołań `/v1/chat/completions`, ale nie działa przy zwykłych
  turach agenta OpenClaw, najpierw spróbuj
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Jeśli backend nadal zawodzi tylko przy większych uruchomieniach OpenClaw, pozostały problem
  zwykle leży po stronie przepustowości modelu/serwera upstream albo błędu backendu, a nie warstwy
  transportowej OpenClaw.

## Rozwiązywanie problemów

- Brama może połączyć się z proxy? `curl http://127.0.0.1:1234/v1/models`.
- Model LM Studio został wyładowany? Załaduj go ponownie; zimny start jest częstą przyczyną „zawieszania się”.
- Błędy kontekstu? Obniż `contextWindow` lub zwiększ limit serwera.
- Serwer zgodny z OpenAI zwraca `messages[].content ... expected a string`?
  Dodaj `compat.requiresStringContent: true` do wpisu tego modelu.
- Bezpośrednie małe wywołania `/v1/chat/completions` działają, ale `openclaw infer model run`
  nie działa na Gemma lub innym modelu lokalnym? Najpierw wyłącz schematy narzędzi za pomocą
  `compat.supportsTools: false`, a następnie przetestuj ponownie. Jeśli serwer nadal ulega awarii tylko
  przy większych promptach OpenClaw, traktuj to jako ograniczenie modelu/serwera upstream.
- Bezpieczeństwo: modele lokalne pomijają filtry po stronie dostawcy; utrzymuj agentów w wąskim zakresie i włącz kompaktowanie, aby ograniczyć zasięg prompt injection.
