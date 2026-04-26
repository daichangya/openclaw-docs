---
read_when:
    - Chcesz używać Ollama do `web_search`
    - Chcesz dostawcę `web_search` bez klucza
    - Potrzebujesz wskazówek dotyczących konfiguracji wyszukiwania w sieci Ollama
summary: Wyszukiwanie w sieci Ollama przez skonfigurowany host Ollama
title: Wyszukiwanie w sieci Ollama
x-i18n:
    generated_at: "2026-04-26T11:43:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: dadee473d4e0674d9261b93adb1ddf77221e949d385fb522ccb630ed0e73d340
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw obsługuje **wyszukiwanie w sieci Ollama** jako dołączonego dostawcę `web_search`. Używa ono API wyszukiwania w sieci Ollama i zwraca uporządkowane wyniki z tytułami, URL-ami i fragmentami.

W przeciwieństwie do dostawcy modeli Ollama ta konfiguracja domyślnie nie wymaga klucza API. Wymaga natomiast:

- hosta Ollama dostępnego z OpenClaw
- `ollama signin`

## Konfiguracja

<Steps>
  <Step title="Uruchom Ollama">
    Upewnij się, że Ollama jest zainstalowany i uruchomiony.
  </Step>
  <Step title="Zaloguj się">
    Uruchom:

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Wybierz wyszukiwanie w sieci Ollama">
    Uruchom:

    ```bash
    openclaw configure --section web
    ```

    Następnie wybierz **Ollama Web Search** jako dostawcę.

  </Step>
</Steps>

Jeśli używasz już Ollama do modeli, wyszukiwanie w sieci Ollama użyje ponownie tego samego skonfigurowanego hosta.

## Konfiguracja

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Opcjonalne nadpisanie hosta Ollama:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

Jeśli nie ustawiono jawnego bazowego URL Ollama, OpenClaw używa `http://127.0.0.1:11434`.

Jeśli host Ollama oczekuje uwierzytelniania bearer, OpenClaw ponownie używa
`models.providers.ollama.apiKey` (lub pasującego uwierzytelniania dostawcy opartego na zmiennych środowiskowych) również dla żądań wyszukiwania w sieci.

## Uwagi

- Dla tego dostawcy nie jest wymagane żadne pole klucza API specyficzne dla wyszukiwania w sieci.
- Jeśli host Ollama jest chroniony uwierzytelnianiem, OpenClaw używa ponownie zwykłego klucza API dostawcy Ollama, jeśli jest obecny.
- OpenClaw ostrzega podczas konfiguracji, jeśli Ollama jest nieosiągalna lub użytkownik nie jest zalogowany, ale nie blokuje wyboru.
- Automatyczne wykrywanie w runtime może awaryjnie przejść do wyszukiwania w sieci Ollama, gdy nie skonfigurowano dostawcy z poświadczeniami o wyższym priorytecie.
- Dostawca używa punktu końcowego Ollama `/api/web_search`.

## Powiązane

- [Przegląd Web Search](/pl/tools/web) -- wszyscy dostawcy i automatyczne wykrywanie
- [Ollama](/pl/providers/ollama) -- konfiguracja modeli Ollama oraz tryby chmury/lokalny
