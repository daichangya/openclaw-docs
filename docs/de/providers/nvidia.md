---
read_when:
    - Sie möchten NVIDIA-Modelle in OpenClaw verwenden
    - Sie benötigen die Einrichtung von NVIDIA_API_KEY
summary: Die OpenAI-kompatible API von NVIDIA in OpenClaw verwenden
title: NVIDIA
x-i18n:
    generated_at: "2026-04-05T12:53:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: a24c5e46c0cf0fbc63bf09c772b486dd7f8f4b52e687d3b835bb54a1176b28da
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

NVIDIA stellt unter `https://integrate.api.nvidia.com/v1` eine OpenAI-kompatible API für Nemotron- und NeMo-Modelle bereit. Authentifizieren Sie sich mit einem API-Schlüssel von [NVIDIA NGC](https://catalog.ngc.nvidia.com/).

## CLI-Einrichtung

Exportieren Sie den Schlüssel einmal, führen Sie dann das Onboarding aus und legen Sie ein NVIDIA-Modell fest:

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

Wenn Sie weiterhin `--token` übergeben, denken Sie daran, dass es im Shell-Verlauf und in der `ps`-Ausgabe landet; bevorzugen Sie nach Möglichkeit die env var.

## Konfigurations-Snippet

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
      model: { primary: "nvidia/nvidia/llama-3.1-nemotron-70b-instruct" },
    },
  },
}
```

## Modell-IDs

| Modellreferenz                                       | Name                                     | Kontext | Max. Ausgabe |
| ---------------------------------------------------- | ---------------------------------------- | ------- | ------------ |
| `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`      | NVIDIA Llama 3.1 Nemotron 70B Instruct   | 131,072 | 4,096        |
| `nvidia/meta/llama-3.3-70b-instruct`                 | Meta Llama 3.3 70B Instruct              | 131,072 | 4,096        |
| `nvidia/nvidia/mistral-nemo-minitron-8b-8k-instruct` | NVIDIA Mistral NeMo Minitron 8B Instruct | 8,192   | 2,048        |

## Hinweise

- OpenAI-kompatibler `/v1`-Endpunkt; verwenden Sie einen API-Schlüssel von NVIDIA NGC.
- Der Provider wird automatisch aktiviert, wenn `NVIDIA_API_KEY` gesetzt ist.
- Der gebündelte Katalog ist statisch; Kosten sind im Quellcode standardmäßig auf `0` gesetzt.
