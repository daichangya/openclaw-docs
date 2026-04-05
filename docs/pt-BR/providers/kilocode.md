---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você quer executar modelos via Kilo Gateway no OpenClaw
summary: Use a API unificada do Kilo Gateway para acessar muitos modelos no OpenClaw
title: Kilo Gateway
x-i18n:
    generated_at: "2026-04-05T12:50:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 857266967b4a7553d501990631df2bae0f849d061521dc9f34e29687ecb94884
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

O Kilo Gateway fornece uma **API unificada** que roteia solicitações para muitos modelos por trás de um único
endpoint e de uma única chave de API. Ele é compatível com OpenAI, então a maioria dos SDKs OpenAI funciona trocando a base URL.

## Como obter uma chave de API

1. Vá para [app.kilo.ai](https://app.kilo.ai)
2. Faça login ou crie uma conta
3. Navegue até API Keys e gere uma nova chave

## Setup na CLI

```bash
openclaw onboard --auth-choice kilocode-api-key
```

Ou defina a variável de ambiente:

```bash
export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
```

## Trecho de configuração

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## Modelo padrão

O modelo padrão é `kilocode/kilo/auto`, um modelo de roteamento inteligente
de propriedade do provedor e gerenciado pelo Kilo Gateway.

O OpenClaw trata `kilocode/kilo/auto` como a referência padrão estável, mas não
publica um mapeamento respaldado por fonte de tarefa para modelo upstream para essa rota.

## Modelos disponíveis

O OpenClaw descobre dinamicamente os modelos disponíveis no Kilo Gateway durante a inicialização. Use
`/models kilocode` para ver a lista completa de modelos disponíveis na sua conta.

Qualquer modelo disponível no gateway pode ser usado com o prefixo `kilocode/`:

```
kilocode/kilo/auto              (padrão - roteamento inteligente)
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.4
kilocode/google/gemini-3-pro-preview
...e muitos outros
```

## Observações

- As referências de modelo são `kilocode/<model-id>` (por exemplo, `kilocode/anthropic/claude-sonnet-4`).
- Modelo padrão: `kilocode/kilo/auto`
- Base URL: `https://api.kilo.ai/api/gateway/`
- O catálogo de fallback integrado sempre inclui `kilocode/kilo/auto` (`Kilo Auto`) com
  `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`
  e `maxTokens: 128000`
- Na inicialização, o OpenClaw tenta `GET https://api.kilo.ai/api/gateway/models` e
  mescla os modelos descobertos antes do catálogo estático de fallback
- O roteamento upstream exato por trás de `kilocode/kilo/auto` pertence ao Kilo Gateway,
  não é codificado rigidamente no OpenClaw
- O Kilo Gateway é documentado no código-fonte como compatível com OpenRouter, então ele permanece
  no caminho de estilo proxy compatível com OpenAI em vez da modelagem nativa de solicitações OpenAI
- Referências Kilo com backend Gemini permanecem no caminho proxy-Gemini, então o OpenClaw mantém
  ali a sanitização de thought-signature do Gemini sem habilitar validação nativa de replay do Gemini
  nem regravações de bootstrap.
- O wrapper de stream compartilhado do Kilo adiciona o cabeçalho do app do provedor e normaliza
  payloads de reasoning de proxy para referências concretas de modelo compatíveis. `kilocode/kilo/auto`
  e outras dicas sem suporte a proxy-reasoning ignoram essa injeção de reasoning.
- Para mais opções de modelo/provedor, veja [/concepts/model-providers](/pt-BR/concepts/model-providers).
- O Kilo Gateway usa um token Bearer com sua chave de API internamente.
