---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você precisa de orientações de configuração do Baidu Qianfan
summary: Use a API unificada do Qianfan para acessar muitos modelos no OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-05T12:51:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 965d83dd968563447ce3571a73bd71c6876275caff8664311a852b2f9827e55b
    source_path: providers/qianfan.md
    workflow: 15
---

# Guia do provedor Qianfan

O Qianfan é a plataforma MaaS da Baidu e fornece uma **API unificada** que encaminha solicitações para muitos modelos por trás de um único
endpoint e de uma única chave de API. Ela é compatível com OpenAI, então a maioria dos SDKs da OpenAI funciona apenas trocando a base URL.

## Pré-requisitos

1. Uma conta do Baidu Cloud com acesso à API do Qianfan
2. Uma chave de API do console do Qianfan
3. OpenClaw instalado no seu sistema

## Como obter sua chave de API

1. Acesse o [Console do Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey)
2. Crie uma nova aplicação ou selecione uma existente
3. Gere uma chave de API (formato: `bce-v3/ALTAK-...`)
4. Copie a chave de API para usá-la com o OpenClaw

## Configuração da CLI

```bash
openclaw onboard --auth-choice qianfan-api-key
```

## Trecho de configuração

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

## Observações

- Ref de modelo empacotada padrão: `qianfan/deepseek-v3.2`
- Base URL padrão: `https://qianfan.baidubce.com/v2`
- O catálogo empacotado atualmente inclui `deepseek-v3.2` e `ernie-5.0-thinking-preview`
- Adicione ou substitua `models.providers.qianfan` apenas quando precisar de uma base URL personalizada ou de metadados de modelo personalizados
- O Qianfan roda pelo caminho de transporte compatível com OpenAI, não pela formatação nativa de solicitações da OpenAI

## Documentação relacionada

- [Configuração do OpenClaw](/pt-BR/gateway/configuration)
- [Provedores de modelo](/pt-BR/concepts/model-providers)
- [Configuração do agente](/pt-BR/concepts/agent)
- [Documentação da API do Qianfan](https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb)
