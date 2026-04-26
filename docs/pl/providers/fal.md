---
read_when:
    - Chcesz używać generowania obrazów fal w OpenClaw
    - Potrzebujesz przepływu uwierzytelniania FAL_KEY
    - Chcesz wartości domyślne fal dla `image_generate` lub `video_generate`
summary: Konfiguracja generowania obrazów i wideo fal w OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-26T11:39:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw dostarcza dołączonego dostawcę `fal` do hostowanego generowania obrazów i wideo.

| Właściwość | Wartość                                                      |
| ---------- | ------------------------------------------------------------ |
| Dostawca   | `fal`                                                        |
| Auth       | `FAL_KEY` (kanoniczne; `FAL_API_KEY` działa również jako fallback) |
| API        | endpointy modeli fal                                         |

## Pierwsze kroki

<Steps>
  <Step title="Ustaw klucz API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Ustaw domyślny model obrazu">
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
  </Step>
</Steps>

## Generowanie obrazów

Dołączony dostawca generowania obrazów `fal` domyślnie używa
`fal/fal-ai/flux/dev`.

| Możliwość       | Wartość                    |
| --------------- | -------------------------- |
| Maks. liczba obrazów | 4 na żądanie         |
| Tryb edycji     | Włączony, 1 obraz referencyjny |
| Nadpisania rozmiaru | Obsługiwane            |
| Aspect ratio    | Obsługiwane                |
| Rozdzielczość   | Obsługiwana                |
| Format wyjściowy | `png` albo `jpeg`         |

<Warning>
Endpoint edycji obrazu fal **nie** obsługuje nadpisań `aspectRatio`.
</Warning>

Użyj `outputFormat: "png"`, gdy chcesz uzyskać wyjście PNG. fal nie deklaruje
jawnej kontroli przezroczystego tła w OpenClaw, więc `background:
"transparent"` jest zgłaszane jako zignorowane nadpisanie dla modeli fal.

Aby używać fal jako domyślnego dostawcy obrazów:

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

Dołączony dostawca generowania wideo `fal` domyślnie używa
`fal/fal-ai/minimax/video-01-live`.

| Możliwość | Wartość                                                              |
| --------- | -------------------------------------------------------------------- |
| Tryby     | Tekst-na-wideo, pojedynczy obraz referencyjny, Seedance reference-to-video |
| Runtime   | Przepływ submit/status/result oparty na kolejce dla długotrwałych zadań |

<AccordionGroup>
  <Accordion title="Dostępne modele wideo">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Przykład konfiguracji Seedance 2.0">
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
  </Accordion>

  <Accordion title="Przykład konfiguracji Seedance 2.0 reference-to-video">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    Reference-to-video akceptuje do 9 obrazów, 3 wideo i 3 referencje audio
    przez współdzielone parametry `images`, `videos` i `audioRefs` narzędzia `video_generate`,
    przy maksymalnie 12 plikach referencyjnych łącznie.

  </Accordion>

  <Accordion title="Przykład konfiguracji HeyGen video-agent">
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
  </Accordion>
</AccordionGroup>

<Tip>
Użyj `openclaw models list --provider fal`, aby zobaczyć pełną listę dostępnych modeli fal,
w tym wszelkie ostatnio dodane wpisy.
</Tip>

## Powiązane

<CardGroup cols={2}>
  <Card title="Generowanie obrazów" href="/pl/tools/image-generation" icon="image">
    Współdzielone parametry narzędzia obrazów i wybór dostawcy.
  </Card>
  <Card title="Generowanie wideo" href="/pl/tools/video-generation" icon="video">
    Współdzielone parametry narzędzia wideo i wybór dostawcy.
  </Card>
  <Card title="Dokumentacja referencyjna konfiguracji" href="/pl/gateway/config-agents#agent-defaults" icon="gear">
    Domyślne ustawienia agentów, w tym wybór modeli obrazów i wideo.
  </Card>
</CardGroup>
