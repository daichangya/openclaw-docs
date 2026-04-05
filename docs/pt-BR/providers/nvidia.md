---
read_when:
    - Você quer usar modelos da NVIDIA no OpenClaw
    - Você precisa configurar `NVIDIA_API_KEY`
summary: Use a API compatível com OpenAI da NVIDIA no OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-05T12:51:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a24c5e46c0cf0fbc63bf09c772b486dd7f8f4b52e687d3b835bb54a1176b28da
    source_path: providers/nvidia.md
    workflow: 15
---

# NVIDIA

A NVIDIA fornece uma API compatível com OpenAI em `https://integrate.api.nvidia.com/v1` para modelos Nemotron e NeMo. Autentique-se com uma chave de API do [NVIDIA NGC](https://catalog.ngc.nvidia.com/).

## Configuração da CLI

Exporte a chave uma vez, depois execute o onboarding e defina um modelo da NVIDIA:

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

Se você ainda passar `--token`, lembre-se de que ele vai para o histórico do shell e para a saída de `ps`; prefira a variável de ambiente quando possível.

## Trecho de configuração

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

## IDs de modelo

| Referência do modelo                                  | Nome                                     | Contexto | Saída máxima |
| ----------------------------------------------------- | ---------------------------------------- | -------- | ------------ |
| `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`      | NVIDIA Llama 3.1 Nemotron 70B Instruct   | 131,072  | 4,096        |
| `nvidia/meta/llama-3.3-70b-instruct`                 | Meta Llama 3.3 70B Instruct              | 131,072  | 4,096        |
| `nvidia/nvidia/mistral-nemo-minitron-8b-8k-instruct` | NVIDIA Mistral NeMo Minitron 8B Instruct | 8,192    | 2,048        |

## Observações

- Endpoint `/v1` compatível com OpenAI; use uma chave de API do NVIDIA NGC.
- O provedor é habilitado automaticamente quando `NVIDIA_API_KEY` está definido.
- O catálogo empacotado é estático; os custos assumem o valor padrão `0` no código-fonte.
