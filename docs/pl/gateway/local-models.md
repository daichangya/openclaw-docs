---
read_when:
    - Chcesz udostępniać modele z własnej maszyny z GPU
    - Konfigurujesz LM Studio lub proxy zgodne z OpenAI
    - Potrzebujesz najbezpieczniejszych wskazówek dotyczących lokalnych modeli
summary: Uruchamiaj OpenClaw na lokalnych modelach LLM (LM Studio, vLLM, LiteLLM, niestandardowe endpointy OpenAI)
title: Lokalne modele
x-i18n:
    generated_at: "2026-04-15T09:51:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8778cc1c623a356ff3cf306c494c046887f9417a70ec71e659e4a8aae912a780
    source_path: gateway/local-models.md
    workflow: 15
---

# Lokalne modele

Lokalnie da się to uruchomić, ale OpenClaw oczekuje dużego kontekstu oraz silnych zabezpieczeń przed prompt injection. Małe karty obcinają kontekst i osłabiają bezpieczeństwo. Celuj wysoko: **≥2 w pełni wyposażone Mac Studio lub równoważny zestaw GPU (~30 tys. USD+)**. Pojedynczy procesor GPU z **24 GB** działa tylko przy lżejszych promptach i z większymi opóźnieniami. Używaj **największego / pełnowymiarowego wariantu modelu, jaki jesteś w stanie uruchomić**; mocno kwantyzowane lub „małe” checkpointy zwiększają ryzyko prompt injection (zobacz [Bezpieczeństwo](/pl/gateway/security)).

Jeśli chcesz najprostszej lokalnej konfiguracji, zacznij od [LM Studio](/pl/providers/lmstudio) lub [Ollama](/pl/providers/ollama) i `openclaw onboard`. Ta strona to opiniotwórczy przewodnik po bardziej zaawansowanych lokalnych stosach i niestandardowych lokalnych serwerach zgodnych z OpenAI.

## Zalecane: LM Studio + duży lokalny model (Responses API)

Obecnie najlepszy lokalny stos. Załaduj duży model w LM Studio (na przykład pełnowymiarową wersję Qwen, DeepSeek lub Llama), włącz lokalny serwer (domyślnie `http://127.0.0.1:1234`) i użyj Responses API, aby oddzielić rozumowanie od końcowego tekstu.

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
- W LM Studio pobierz **największą dostępną wersję modelu** (unikaj wariantów „small” / mocno kwantyzowanych), uruchom serwer i potwierdź, że `http://127.0.0.1:1234/v1/models` go wyświetla.
- Zastąp `my-local-model` rzeczywistym identyfikatorem modelu widocznym w LM Studio.
- Utrzymuj model załadowany; zimne ładowanie zwiększa opóźnienie startu.
- Dostosuj `contextWindow`/`maxTokens`, jeśli Twoja wersja LM Studio różni się od tej opisanej tutaj.
- W przypadku WhatsApp trzymaj się Responses API, aby wysyłany był tylko końcowy tekst.

Nawet przy pracy lokalnej zachowaj konfigurację modeli hostowanych; użyj `models.mode: "merge"`, aby fallbacki nadal były dostępne.

### Konfiguracja hybrydowa: hostowany model główny, lokalny fallback

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

Zamień kolejność modelu głównego i fallbacku; zachowaj ten sam blok providers oraz `models.mode: "merge"`, aby móc wrócić do Sonnet lub Opus, gdy lokalna maszyna będzie niedostępna.

### Hosting regionalny / trasowanie danych

- Hostowane warianty MiniMax/Kimi/GLM są też dostępne w OpenRouter z endpointami przypiętymi do regionu (np. hostowanymi w USA). Wybierz tam wariant regionalny, aby utrzymać ruch w wybranej jurysdykcji, nadal używając `models.mode: "merge"` dla fallbacków Anthropic/OpenAI.
- Tryb wyłącznie lokalny pozostaje najlepszą ścieżką pod względem prywatności; hostowane trasowanie regionalne to rozwiązanie pośrednie, gdy potrzebujesz funkcji dostawcy, ale chcesz kontrolować przepływ danych.

## Inne lokalne proxy zgodne z OpenAI

vLLM, LiteLLM, OAI-proxy lub niestandardowe Gateway działają, jeśli udostępniają endpoint `/v1` w stylu OpenAI. Zastąp powyższy blok provider swoim endpointem i identyfikatorem modelu:

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

Uwaga dotycząca działania lokalnych/proksowanych backendów `/v1`:

- OpenClaw traktuje je jako trasy proxy zgodne z OpenAI, a nie natywne endpointy OpenAI
- natywne dla OpenAI kształtowanie żądań nie ma tu zastosowania: brak
  `service_tier`, brak `store` w Responses, brak kształtowania payloadu
  zgodności z rozumowaniem OpenAI oraz brak wskazówek dla prompt cache
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
  nie są wstrzykiwane do tych niestandardowych adresów URL proxy

Uwagi o zgodności dla bardziej rygorystycznych backendów zgodnych z OpenAI:

- Niektóre serwery akceptują wyłącznie ciąg znaków w `messages[].content` w Chat Completions, a nie
  uporządkowane tablice części treści. Ustaw
  `models.providers.<provider>.models[].compat.requiresStringContent: true` dla
  takich endpointów.
- Niektóre mniejsze lub bardziej rygorystyczne lokalne backendy są niestabilne z pełnym
  kształtem promptu środowiska uruchomieniowego agenta w OpenClaw, zwłaszcza gdy dołączone są schematy narzędzi. Jeśli
  backend działa przy małych bezpośrednich wywołaniach `/v1/chat/completions`, ale nie działa przy zwykłych
  turach agenta OpenClaw, najpierw spróbuj
  `agents.defaults.localModelMode: "lean"`, aby usunąć cięższe domyślne narzędzia
  takie jak `browser`, `cron` i `message`; jeśli to nadal nie pomoże, spróbuj
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Jeśli backend nadal zawodzi tylko przy większych uruchomieniach OpenClaw,
  pozostały problem zwykle leży po stronie pojemności modelu/serwera upstream albo błędu backendu, a nie warstwy transportowej OpenClaw.

## Rozwiązywanie problemów

- Gateway może połączyć się z proxy? `curl http://127.0.0.1:1234/v1/models`.
- Model LM Studio został wyładowany? Załaduj go ponownie; zimny start to częsta przyczyna „zawieszania się”.
- OpenClaw ostrzega, gdy wykryte okno kontekstu jest mniejsze niż **32k**, i blokuje działanie poniżej **16k**. Jeśli trafiasz na ten wstępny test, zwiększ limit kontekstu serwera/modelu albo wybierz większy model.
- Błędy kontekstu? Zmniejsz `contextWindow` albo zwiększ limit serwera.
- Serwer zgodny z OpenAI zwraca `messages[].content ... expected a string`?
  Dodaj `compat.requiresStringContent: true` w tym wpisie modelu.
- Małe bezpośrednie wywołania `/v1/chat/completions` działają, ale `openclaw infer model run`
  nie działa na Gemma lub innym lokalnym modelu? Najpierw wyłącz schematy narzędzi przez
  `compat.supportsTools: false`, a potem przetestuj ponownie. Jeśli serwer nadal się wyłącza tylko
  przy większych promptach OpenClaw, traktuj to jako ograniczenie modelu/serwera upstream.
- Bezpieczeństwo: lokalne modele pomijają filtry po stronie dostawcy; utrzymuj agentów w wąskim zakresie i pozostaw Compaction włączone, aby ograniczyć zasięg prompt injection.
