---
read_when:
    - Chcesz używać otwartych modeli w OpenClaw za darmo
    - Potrzebujesz konfiguracji NVIDIA_API_KEY
summary: Używaj zgodnego z OpenAI API NVIDIA w OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-08T02:17:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: b00f8cedaf223a33ba9f6a6dd8cf066d88cebeea52d391b871e435026182228a
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA udostępnia zgodne z OpenAI API pod adresem `https://integrate.api.nvidia.com/v1` dla otwartych modeli za darmo. Uwierzytelnij się za pomocą klucza API z [build.nvidia.com](https://build.nvidia.com/settings/api-keys).

## Konfiguracja CLI

Wyeksportuj klucz raz, a następnie uruchom onboarding i ustaw model NVIDIA:

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
```

Jeśli nadal przekazujesz `--token`, pamiętaj, że trafia on do historii powłoki i danych wyjściowych `ps`; jeśli to możliwe, preferuj zmienną środowiskową.

## Fragment konfiguracji

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## Identyfikatory modeli

| Model ref                                  | Nazwa                        | Kontekst | Maks. wynik |
| ------------------------------------------ | ---------------------------- | -------- | ----------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144  | 8,192       |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144  | 8,192       |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608  | 8,192       |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752  | 8,192       |

## Uwagi

- Zgodny z OpenAI punkt końcowy `/v1`; użyj klucza API z [build.nvidia.com](https://build.nvidia.com/).
- Dostawca włącza się automatycznie, gdy ustawiono `NVIDIA_API_KEY`.
- Dołączony katalog jest statyczny; koszty domyślnie wynoszą `0` w źródle.
