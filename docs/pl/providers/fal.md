---
read_when:
    - Chcesz używać generowania obrazów fal w OpenClaw
    - Potrzebujesz przepływu auth `FAL_KEY`
    - Chcesz używać domyślnych ustawień fal dla `image_generate` lub `video_generate`
summary: Konfiguracja generowania obrazów i wideo fal w OpenClaw
title: fal
x-i18n:
    generated_at: "2026-04-11T02:47:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9bfe4f69124e922a79a516a1bd78f0c00f7a45f3c6f68b6d39e0d196fa01beb3
    source_path: providers/fal.md
    workflow: 15
---

# fal

OpenClaw zawiera wbudowanego providera `fal` do hostowanego generowania obrazów i wideo.

- Provider: `fal`
- Auth: `FAL_KEY` (kanoniczne; `FAL_API_KEY` działa również jako fallback)
- API: endpointy modeli fal

## Szybki start

1. Ustaw klucz API:

```bash
openclaw onboard --auth-choice fal-api-key
```

2. Ustaw domyślny model obrazów:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Generowanie obrazów

Wbudowany provider generowania obrazów `fal` domyślnie używa
`fal/fal-ai/flux/dev`.

- Generowanie: do 4 obrazów na żądanie
- Tryb edycji: włączony, 1 obraz referencyjny
- Obsługuje `size`, `aspectRatio` i `resolution`
- Aktualne zastrzeżenie dotyczące edycji: endpoint edycji obrazów fal **nie** obsługuje nadpisań `aspectRatio`

Aby używać fal jako domyślnego providera obrazów:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## Generowanie wideo

Wbudowany provider generowania wideo `fal` domyślnie używa
`fal/fal-ai/minimax/video-01-live`.

- Tryby: text-to-video i przepływy z pojedynczym obrazem referencyjnym
- Runtime: przepływ submit/status/result oparty na kolejce dla długotrwałych zadań
- Odwołanie do modelu HeyGen video-agent:
  - `fal/fal-ai/heygen/v2/video-agent`
- Odwołania do modeli Seedance 2.0:
  - `fal/bytedance/seedance-2.0/fast/text-to-video`
  - `fal/bytedance/seedance-2.0/fast/image-to-video`
  - `fal/bytedance/seedance-2.0/text-to-video`
  - `fal/bytedance/seedance-2.0/image-to-video`

Aby używać Seedance 2.0 jako domyślnego modelu wideo:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
      },
    },
  },
}
```

Aby używać HeyGen video-agent jako domyślnego modelu wideo:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/fal-ai/heygen/v2/video-agent",
      },
    },
  },
}
```

## Powiązane

- [Generowanie obrazów](/pl/tools/image-generation)
- [Generowanie wideo](/pl/tools/video-generation)
- [Dokumentacja konfiguracji](/pl/gateway/configuration-reference#agent-defaults)
