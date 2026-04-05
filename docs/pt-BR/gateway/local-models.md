---
read_when:
    - Você quer servir modelos a partir da sua própria máquina com GPU
    - Você está conectando o LM Studio ou um proxy compatível com OpenAI
    - Você precisa da orientação mais segura para modelos locais
summary: Execute o OpenClaw com LLMs locais (LM Studio, vLLM, LiteLLM, endpoints OpenAI personalizados)
title: Modelos locais
x-i18n:
    generated_at: "2026-04-05T12:41:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b99c8fb57f65c0b765fc75bd36933221b5aeb94c4a3f3428f92640ae064f8b6
    source_path: gateway/local-models.md
    workflow: 15
---

# Modelos locais

Executar localmente é viável, mas o OpenClaw espera contexto grande + defesas fortes contra injeção de prompt. Placas pequenas truncam contexto e enfraquecem a segurança. Mire alto: **≥2 Mac Studios no máximo ou equipamento de GPU equivalente (~US$ 30 mil+)**. Uma única GPU de **24 GB** funciona apenas para prompts mais leves com maior latência. Use a **maior variante / variante completa do modelo que você conseguir executar**; checkpoints agressivamente quantizados ou “small” aumentam o risco de injeção de prompt (consulte [Security](/gateway/security)).

Se você quiser a configuração local com menos atrito, comece com [Ollama](/providers/ollama) e `openclaw onboard`. Esta página é o guia opinativo para stacks locais mais avançados e servidores locais personalizados compatíveis com OpenAI.

## Recomendado: LM Studio + modelo local grande (Responses API)

A melhor stack local atual. Carregue um modelo grande no LM Studio (por exemplo, uma compilação completa de Qwen, DeepSeek ou Llama), ative o servidor local (padrão `http://127.0.0.1:1234`) e use a Responses API para manter o raciocínio separado do texto final.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Modelo local”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Checklist de configuração**

- Instale o LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- No LM Studio, baixe a **maior compilação de modelo disponível** (evite variantes “small”/fortemente quantizadas), inicie o servidor e confirme que `http://127.0.0.1:1234/v1/models` o lista.
- Substitua `my-local-model` pelo ID real do modelo mostrado no LM Studio.
- Mantenha o modelo carregado; o carregamento a frio adiciona latência na inicialização.
- Ajuste `contextWindow`/`maxTokens` se sua compilação do LM Studio for diferente.
- Para o WhatsApp, mantenha a Responses API para que apenas o texto final seja enviado.

Mantenha modelos hospedados configurados mesmo ao executar localmente; use `models.mode: "merge"` para que fallbacks continuem disponíveis.

### Config híbrida: primário hospedado, fallback local

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Modelo local",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Local-first com rede de segurança hospedada

Troque a ordem do primário e dos fallbacks; mantenha o mesmo bloco de providers e `models.mode: "merge"` para poder recorrer a Sonnet ou Opus quando a máquina local estiver indisponível.

### Hospedagem regional / roteamento de dados

- Variantes hospedadas de MiniMax/Kimi/GLM também existem no OpenRouter com endpoints fixados por região (por exemplo, hospedados nos EUA). Escolha a variante regional lá para manter o tráfego na jurisdição desejada e ainda usar `models.mode: "merge"` para fallbacks de Anthropic/OpenAI.
- Local-only continua sendo o caminho de privacidade mais forte; roteamento regional hospedado é o meio-termo quando você precisa de recursos do provider, mas quer controlar o fluxo de dados.

## Outros proxies locais compatíveis com OpenAI

vLLM, LiteLLM, OAI-proxy ou gateways personalizados funcionam se expuserem um endpoint `/v1` no estilo OpenAI. Substitua o bloco de provider acima pelo seu endpoint e ID de modelo:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Modelo local",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Mantenha `models.mode: "merge"` para que modelos hospedados continuem disponíveis como fallbacks.

Observação de comportamento para backends locais/proxy `/v1`:

- O OpenClaw os trata como rotas em estilo proxy compatíveis com OpenAI, não como endpoints OpenAI nativos
- a modelagem de requisição exclusiva da OpenAI nativa não se aplica aqui: sem
  `service_tier`, sem `store` de Responses, sem modelagem de payload de compatibilidade de raciocínio OpenAI e sem dicas de cache de prompt
- cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
  não são injetados nessas URLs de proxy personalizadas

## Solução de problemas

- O gateway consegue alcançar o proxy? `curl http://127.0.0.1:1234/v1/models`.
- O modelo do LM Studio foi descarregado? Carregue-o novamente; inicialização a frio é uma causa comum de “travamento”.
- Erros de contexto? Reduza `contextWindow` ou aumente o limite do seu servidor.
- Segurança: modelos locais ignoram filtros do lado do provider; mantenha agentes restritos e a compactação ativada para limitar o raio de impacto da injeção de prompt.
