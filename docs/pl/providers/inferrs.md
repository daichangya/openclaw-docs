---
read_when:
    - Chcesz uruchomić OpenClaw z lokalnym serwerem inferrs
    - Udostępniasz Gemma lub inny model przez inferrs
    - Potrzebujesz dokładnych flag zgodności OpenClaw dla inferrs
summary: Uruchamianie OpenClaw przez inferrs (lokalny serwer zgodny z OpenAI)
title: inferrs
x-i18n:
    generated_at: "2026-04-08T02:17:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: d84f660d49a682d0c0878707eebe1bc1e83dd115850687076ea3938b9f9c86c6
    source_path: providers/inferrs.md
    workflow: 15
---

# inferrs

[inferrs](https://github.com/ericcurtin/inferrs) może udostępniać lokalne modele za
interfejsem API `/v1` zgodnym z OpenAI. OpenClaw współpracuje z `inferrs` przez ogólną
ścieżkę `openai-completions`.

`inferrs` najlepiej obecnie traktować jako niestandardowy, samodzielnie hostowany backend
zgodny z OpenAI, a nie dedykowaną wtyczkę dostawcy OpenClaw.

## Szybki start

1. Uruchom `inferrs` z modelem.

Przykład:

```bash
inferrs serve gg-hf-gg/gemma-4-E2B-it \
  --host 127.0.0.1 \
  --port 8080 \
  --device metal
```

2. Sprawdź, czy serwer jest osiągalny.

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/v1/models
```

3. Dodaj jawny wpis dostawcy OpenClaw i skieruj na niego swój model domyślny.

## Pełny przykład konfiguracji

Ten przykład używa Gemma 4 na lokalnym serwerze `inferrs`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/gg-hf-gg/gemma-4-E2B-it" },
      models: {
        "inferrs/gg-hf-gg/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "gg-hf-gg/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Dlaczego `requiresStringContent` ma znaczenie

Niektóre ścieżki Chat Completions w `inferrs` akceptują tylko ciąg znaków w
`messages[].content`, a nie strukturalne tablice części treści.

Jeśli uruchomienia OpenClaw kończą się błędem takim jak:

```text
messages[1].content: invalid type: sequence, expected a string
```

ustaw:

```json5
compat: {
  requiresStringContent: true
}
```

OpenClaw spłaszczy części treści zawierające wyłącznie tekst do zwykłych ciągów znaków przed wysłaniem
żądania.

## Zastrzeżenie dotyczące Gemma i schematu narzędzi

Niektóre obecne kombinacje `inferrs` + Gemma akceptują małe, bezpośrednie
żądania `/v1/chat/completions`, ale nadal kończą się niepowodzeniem przy pełnych turach
runtime agenta OpenClaw.

Jeśli tak się dzieje, najpierw spróbuj tego:

```json5
compat: {
  requiresStringContent: true,
  supportsTools: false
}
```

To wyłącza powierzchnię schematu narzędzi OpenClaw dla modelu i może zmniejszyć presję promptu
na bardziej restrykcyjnych lokalnych backendach.

Jeśli małe bezpośrednie żądania nadal działają, ale zwykłe tury agenta OpenClaw wciąż
powodują awarie wewnątrz `inferrs`, pozostały problem zwykle leży po stronie zachowania modelu/serwera upstream, a nie warstwy transportowej OpenClaw.

## Ręczny test smoke

Po konfiguracji przetestuj obie warstwy:

```bash
curl http://127.0.0.1:8080/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"gg-hf-gg/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'

openclaw infer model run \
  --model inferrs/gg-hf-gg/gemma-4-E2B-it \
  --prompt "What is 2 + 2? Reply with one short sentence." \
  --json
```

Jeśli pierwsze polecenie działa, ale drugie kończy się niepowodzeniem, skorzystaj z poniższych uwag
dotyczących rozwiązywania problemów.

## Rozwiązywanie problemów

- `curl /v1/models` kończy się niepowodzeniem: `inferrs` nie działa, nie jest osiągalny lub nie
  jest powiązany z oczekiwanym hostem/portem.
- `messages[].content ... expected a string`: ustaw
  `compat.requiresStringContent: true`.
- Bezpośrednie małe wywołania `/v1/chat/completions` przechodzą, ale `openclaw infer model run`
  kończy się niepowodzeniem: spróbuj `compat.supportsTools: false`.
- OpenClaw nie dostaje już błędów schematu, ale `inferrs` nadal ulega awarii przy większych
  turach agenta: potraktuj to jako ograniczenie `inferrs` lub modelu upstream i zmniejsz
  presję promptu albo zmień lokalny backend/model.

## Zachowanie w stylu proxy

`inferrs` jest traktowany jako backend `/v1` zgodny z OpenAI w stylu proxy, a nie
natywny endpoint OpenAI.

- natywne kształtowanie żądań tylko dla OpenAI nie ma tu zastosowania
- brak `service_tier`, brak `store` dla Responses, brak wskazówek prompt-cache i brak
  kształtowania ładunku zgodności reasoning OpenAI
- ukryte nagłówki atrybucji OpenClaw (`originator`, `version`, `User-Agent`)
  nie są wstrzykiwane do niestandardowych adresów `inferrs` base URLs

## Zobacz też

- [Modele lokalne](/pl/gateway/local-models)
- [Rozwiązywanie problemów z gatewayem](/pl/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)
- [Dostawcy modeli](/pl/concepts/model-providers)
