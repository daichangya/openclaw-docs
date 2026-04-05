---
read_when:
    - Você quer uma única chave de API para muitos LLMs
    - Você quer executar modelos via OpenRouter no OpenClaw
summary: Use a API unificada do OpenRouter para acessar muitos modelos no OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-05T12:51:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8dd354ba060bcb47724c89ae17c8e2af8caecac4bd996fcddb584716c1840b87
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

O OpenRouter fornece uma **API unificada** que encaminha solicitações para muitos modelos por trás de um único
endpoint e de uma única chave de API. Ela é compatível com OpenAI, então a maioria dos SDKs da OpenAI funciona apenas trocando a base URL.

## Configuração da CLI

```bash
openclaw onboard --auth-choice openrouter-api-key
```

## Trecho de configuração

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Observações

- As refs de modelo são `openrouter/<provider>/<model>`.
- O onboarding usa `openrouter/auto` por padrão. Mude depois para um modelo concreto com
  `openclaw models set openrouter/<provider>/<model>`.
- Para mais opções de modelo/provedor, consulte [/concepts/model-providers](/pt-BR/concepts/model-providers).
- O OpenRouter usa internamente um token Bearer com sua chave de API.
- Em solicitações reais ao OpenRouter (`https://openrouter.ai/api/v1`), o OpenClaw também
  adiciona os headers de atribuição de app documentados pelo OpenRouter:
  `HTTP-Referer: https://openclaw.ai`, `X-OpenRouter-Title: OpenClaw` e
  `X-OpenRouter-Categories: cli-agent`.
- Em rotas verificadas do OpenRouter, refs de modelo Anthropic também mantêm os
  marcadores `cache_control` específicos do OpenRouter que o OpenClaw usa para
  melhor reutilização do cache de prompt em blocos de prompt system/developer.
- Se você redirecionar o provedor OpenRouter para algum outro proxy/base URL, o OpenClaw
  não injeta esses headers específicos do OpenRouter nem marcadores de cache Anthropic.
- O OpenRouter ainda roda pelo caminho compatível com OpenAI no estilo proxy, então
  formatações de solicitação nativas exclusivas da OpenAI, como `serviceTier`, `store` de Responses,
  payloads de compatibilidade de raciocínio da OpenAI e dicas de cache de prompt, não são encaminhadas.
- Refs do OpenRouter baseadas em Gemini permanecem no caminho proxy-Gemini: o OpenClaw mantém
  ali a sanitização de assinatura de pensamento do Gemini, mas não habilita validação nativa de replay do Gemini
  nem reescritas de bootstrap.
- Em rotas compatíveis diferentes de `auto`, o OpenClaw mapeia o nível de pensamento selecionado para payloads de raciocínio proxy do OpenRouter. Dicas de modelo não compatíveis e
  `openrouter/auto` ignoram essa injeção de raciocínio.
- Se você passar roteamento do provedor OpenRouter em parâmetros do modelo, o OpenClaw o encaminha
  como metadados de roteamento do OpenRouter antes de os encapsulamentos de stream compartilhados serem executados.
