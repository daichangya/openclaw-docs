---
read_when:
    - Chcesz uruchamiać OpenClaw z modelami open source przez LM Studio
    - Chcesz skonfigurować i ustawić LM Studio
summary: Uruchamianie OpenClaw z LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-23T10:07:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 062b26cf10631e74f4e1917ea9011133eb4433f5fb7ee85748d00080a6ca212d
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio to przyjazna, a jednocześnie potężna aplikacja do uruchamiania modeli open-weight na własnym sprzęcie. Pozwala uruchamiać modele llama.cpp (GGUF) lub MLX (Apple Silicon). Dostępna jest jako pakiet GUI albo daemon headless (`llmster`). Dokumentację produktu i konfiguracji znajdziesz na [lmstudio.ai](https://lmstudio.ai/).

## Szybki start

1. Zainstaluj LM Studio (desktop) lub `llmster` (headless), a następnie uruchom lokalny serwer:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Uruchom serwer

Upewnij się, że albo uruchomisz aplikację desktopową, albo uruchomisz daemon za pomocą następującego polecenia:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Jeśli używasz aplikacji, upewnij się, że masz włączone JIT, aby uzyskać płynne działanie. Więcej informacji znajdziesz w [przewodniku LM Studio JIT i TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw wymaga wartości tokenu LM Studio. Ustaw `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Jeśli uwierzytelnianie LM Studio jest wyłączone, użyj dowolnej niepustej wartości tokenu:

```bash
export LM_API_TOKEN="placeholder-key"
```

Szczegóły konfiguracji uwierzytelniania LM Studio znajdziesz tutaj: [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Uruchom onboarding i wybierz `LM Studio`:

```bash
openclaw onboard
```

5. W onboardingu użyj promptu `Default model`, aby wybrać model LM Studio.

Możesz też ustawić go lub zmienić później:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Klucze modeli LM Studio mają format `author/model-name` (np. `qwen/qwen3.5-9b`). OpenClaw
dodaje do referencji modelu prefiks nazwy providera: `lmstudio/qwen/qwen3.5-9b`. Dokładny klucz
modelu możesz znaleźć, uruchamiając `curl http://localhost:1234/api/v1/models` i sprawdzając pole `key`.

## Onboarding non-interactive

Użyj onboardingu non-interactive, gdy chcesz oskryptować konfigurację (CI, provisioning, zdalny bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Lub podaj base URL albo model z kluczem API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` przyjmuje klucz modelu zwracany przez LM Studio (np. `qwen/qwen3.5-9b`), bez
prefiksu providera `lmstudio/`.

Onboarding non-interactive wymaga `--lmstudio-api-key` (lub `LM_API_TOKEN` w env).
Dla nieuwierzytelnionych serwerów LM Studio działa dowolna niepusta wartość tokenu.

`--custom-api-key` nadal jest obsługiwane dla zgodności, ale dla LM Studio preferowane jest `--lmstudio-api-key`.

To zapisuje `models.providers.lmstudio`, ustawia model domyślny na
`lmstudio/<custom-model-id>` i zapisuje profil auth `lmstudio:default`.

Interaktywna konfiguracja może zapytać o opcjonalną preferowaną długość kontekstu ładowania i zastosuje ją do wykrytych modeli LM Studio zapisywanych do konfiguracji.

## Konfiguracja

### Zgodność streaming usage

LM Studio jest zgodne ze streaming usage. Gdy nie emituje obiektu `usage`
w kształcie OpenAI, OpenClaw odzyskuje liczniki tokenów z metadanych w stylu llama.cpp
`timings.prompt_n` / `timings.predicted_n`.

To samo zachowanie dotyczy tych lokalnych backendów zgodnych z OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Jawna konfiguracja

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Rozwiązywanie problemów

### LM Studio nie zostało wykryte

Upewnij się, że LM Studio działa i że ustawiono `LM_API_TOKEN` (dla nieuwierzytelnionych serwerów działa dowolna niepusta wartość tokenu):

```bash
# Uruchom przez aplikację desktopową albo w trybie headless:
lms server start --port 1234
```

Sprawdź, czy API jest dostępne:

```bash
curl http://localhost:1234/api/v1/models
```

### Błędy uwierzytelniania (HTTP 401)

Jeśli konfiguracja zgłasza HTTP 401, sprawdź klucz API:

- Sprawdź, czy `LM_API_TOKEN` odpowiada kluczowi skonfigurowanemu w LM Studio.
- Szczegóły konfiguracji uwierzytelniania LM Studio znajdziesz tutaj: [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Jeśli Twój serwer nie wymaga uwierzytelniania, użyj dowolnej niepustej wartości tokenu dla `LM_API_TOKEN`.

### Ładowanie modeli just-in-time

LM Studio obsługuje ładowanie modeli just-in-time (JIT), gdzie modele są ładowane przy pierwszym żądaniu. Upewnij się, że masz to włączone, aby uniknąć błędów „Model not loaded”.
