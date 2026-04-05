---
read_when:
    - Você quer usar modelos da Mistral no OpenClaw
    - Você precisa do onboarding com chave de API da Mistral e referências de modelo
summary: Use modelos da Mistral e transcrição Voxtral com o OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-05T12:51:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f61b9e0656dd7e0243861ddf14b1b41a07c38bff27cef9ad0815d14c8e34408
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

O OpenClaw oferece suporte à Mistral tanto para roteamento de modelos de texto/imagem (`mistral/...`) quanto para
transcrição de áudio via Voxtral em compreensão de mídia.
A Mistral também pode ser usada para embeddings de memória (`memorySearch.provider = "mistral"`).

## Configuração da CLI

```bash
openclaw onboard --auth-choice mistral-api-key
# or non-interactive
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Trecho de configuração (provedor de LLM)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Catálogo de LLM integrado

Atualmente, o OpenClaw inclui este catálogo Mistral empacotado:

| Ref. do modelo                   | Entrada     | Contexto | Saída máx. | Observações              |
| -------------------------------- | ----------- | -------- | ---------- | ------------------------ |
| `mistral/mistral-large-latest`   | text, image | 262,144  | 16,384     | Modelo padrão            |
| `mistral/mistral-medium-2508`    | text, image | 262,144  | 8,192      | Mistral Medium 3.1       |
| `mistral/mistral-small-latest`   | text, image | 128,000  | 16,384     | Modelo multimodal menor  |
| `mistral/pixtral-large-latest`   | text, image | 128,000  | 32,768     | Pixtral                  |
| `mistral/codestral-latest`       | text        | 256,000  | 4,096      | Programação              |
| `mistral/devstral-medium-latest` | text        | 262,144  | 32,768     | Devstral 2               |
| `mistral/magistral-small`        | text        | 128,000  | 40,000     | Raciocínio habilitado    |

## Trecho de configuração (transcrição de áudio com Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

## Observações

- A autenticação da Mistral usa `MISTRAL_API_KEY`.
- A URL base do provedor é, por padrão, `https://api.mistral.ai/v1`.
- O modelo padrão do onboarding é `mistral/mistral-large-latest`.
- O modelo de áudio padrão para compreensão de mídia da Mistral é `voxtral-mini-latest`.
- O caminho de transcrição de mídia usa `/v1/audio/transcriptions`.
- O caminho de embeddings de memória usa `/v1/embeddings` (modelo padrão: `mistral-embed`).
