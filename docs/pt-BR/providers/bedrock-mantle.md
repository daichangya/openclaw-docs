---
read_when:
    - Você quer usar modelos OSS hospedados no Bedrock Mantle com OpenClaw
    - Você precisa do endpoint compatível com OpenAI do Mantle para GPT-OSS, Qwen, Kimi ou GLM
summary: Use modelos Amazon Bedrock Mantle (compatíveis com OpenAI) com OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-05T12:50:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2efe61261fbb430f63be9f5025c0654c44b191dbe96b3eb081d7ccbe78458907
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

O OpenClaw inclui um provedor empacotado **Amazon Bedrock Mantle** que se conecta
ao endpoint compatível com OpenAI do Mantle. O Mantle hospeda modelos de código aberto e
de terceiros (GPT-OSS, Qwen, Kimi, GLM e similares) por meio de uma superfície padrão
`/v1/chat/completions` sustentada pela infraestrutura do Bedrock.

## O que o OpenClaw oferece

- Provedor: `amazon-bedrock-mantle`
- API: `openai-completions` (compatível com OpenAI)
- Autenticação: bearer token via `AWS_BEARER_TOKEN_BEDROCK`
- Região: `AWS_REGION` ou `AWS_DEFAULT_REGION` (padrão: `us-east-1`)

## Descoberta automática de modelos

Quando `AWS_BEARER_TOKEN_BEDROCK` está definido, o OpenClaw descobre automaticamente
os modelos Mantle disponíveis consultando o endpoint regional `/v1/models`.
Os resultados da descoberta ficam em cache por 1 hora.

Regiões com suporte: `us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Onboarding

1. Defina o bearer token no **host do gateway**:

```bash
export AWS_BEARER_TOKEN_BEDROCK="..."
# Opcional (o padrão é us-east-1):
export AWS_REGION="us-west-2"
```

2. Verifique se os modelos foram descobertos:

```bash
openclaw models list
```

Os modelos descobertos aparecem sob o provedor `amazon-bedrock-mantle`. Nenhuma
configuração adicional é necessária, a menos que você queira substituir os padrões.

## Configuração manual

Se você preferir uma configuração explícita em vez de descoberta automática:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Observações

- O Mantle atualmente exige um bearer token. Credenciais IAM simples (funções de instância,
  SSO, chaves de acesso) não são suficientes sem um token.
- O bearer token é o mesmo `AWS_BEARER_TOKEN_BEDROCK` usado pelo provedor padrão
  [Amazon Bedrock](/providers/bedrock).
- O suporte a raciocínio é inferido a partir de ids de modelo que contêm padrões como
  `thinking`, `reasoner` ou `gpt-oss-120b`.
- Se o endpoint do Mantle não estiver disponível ou não retornar modelos, o provedor será
  ignorado silenciosamente.
