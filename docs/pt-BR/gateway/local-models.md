---
read_when:
    - Você quer servir modelos a partir da sua própria máquina com GPU.
    - Você está configurando o LM Studio ou um proxy compatível com OpenAI.
    - Você precisa das orientações mais seguras para modelos locais.
summary: Execute o OpenClaw em LLMs locais (LM Studio, vLLM, LiteLLM, endpoints OpenAI personalizados)
title: Modelos locais
x-i18n:
    generated_at: "2026-04-13T08:50:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ecb61b3e6e34d3666f9b688cd694d92c5fb211cf8c420fa876f7ccf5789154a
    source_path: gateway/local-models.md
    workflow: 15
---

# Modelos locais

Local é viável, mas o OpenClaw espera contexto grande + defesas robustas contra injeção de prompt. Placas menores truncam o contexto e enfraquecem a segurança. Mire alto: **≥2 Mac Studios no máximo ou rig de GPU equivalente (~US$ 30 mil+)**. Uma única GPU de **24 GB** funciona apenas para prompts mais leves, com latência mais alta. Use a **maior / variante de tamanho completo do modelo que você conseguir executar**; checkpoints agressivamente quantizados ou “small” aumentam o risco de injeção de prompt (veja [Segurança](/pt-BR/gateway/security)).

Se você quiser a configuração local com menos atrito, comece com [LM Studio](/pt-BR/providers/lmstudio) ou [Ollama](/pt-BR/providers/ollama) e `openclaw onboard`. Esta página é o guia opinativo para stacks locais mais avançadas e servidores locais personalizados compatíveis com OpenAI.

## Recomendado: LM Studio + modelo local grande (API Responses)

Melhor stack local no momento. Carregue um modelo grande no LM Studio (por exemplo, uma build completa de Qwen, DeepSeek ou Llama), ative o servidor local (padrão `http://127.0.0.1:1234`) e use a API Responses para manter o raciocínio separado do texto final.

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
            name: “Modelo Local”,
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
- No LM Studio, baixe a **maior build de modelo disponível** (evite variantes “small”/fortemente quantizadas), inicie o servidor e confirme que `http://127.0.0.1:1234/v1/models` o lista.
- Substitua `my-local-model` pelo ID real do modelo mostrado no LM Studio.
- Mantenha o modelo carregado; o carregamento a frio adiciona latência de inicialização.
- Ajuste `contextWindow`/`maxTokens` se a sua build do LM Studio for diferente.
- Para WhatsApp, mantenha a API Responses para que apenas o texto final seja enviado.

Mantenha modelos hospedados configurados mesmo ao executar localmente; use `models.mode: "merge"` para que os fallbacks continuem disponíveis.

### Configuração híbrida: primário hospedado, fallback local

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
            name: "Modelo Local",
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

### Local primeiro com rede de segurança hospedada

Troque a ordem do primário e dos fallbacks; mantenha o mesmo bloco de providers e `models.mode: "merge"` para poder recorrer a Sonnet ou Opus quando a máquina local estiver fora do ar.

### Hospedagem regional / roteamento de dados

- Variantes hospedadas de MiniMax/Kimi/GLM também existem no OpenRouter com endpoints fixados por região (por exemplo, hospedados nos EUA). Escolha a variante regional lá para manter o tráfego na jurisdição desejada enquanto ainda usa `models.mode: "merge"` para fallbacks de Anthropic/OpenAI.
- Somente local continua sendo o caminho mais forte em privacidade; roteamento regional hospedado é o meio-termo quando você precisa de recursos do provider, mas quer controlar o fluxo de dados.

## Outros proxies locais compatíveis com OpenAI

vLLM, LiteLLM, OAI-proxy ou gateways personalizados funcionam se expuserem um endpoint `/v1` no estilo OpenAI. Substitua o bloco do provider acima pelo seu endpoint e ID do modelo:

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
            name: "Modelo Local",
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

Mantenha `models.mode: "merge"` para que os modelos hospedados continuem disponíveis como fallbacks.

Observação de comportamento para backends `/v1` locais/com proxy:

- O OpenClaw trata esses backends como rotas compatíveis com OpenAI no estilo proxy, não como endpoints OpenAI nativos
- a formatação de requisição exclusiva do OpenAI nativo não se aplica aqui: sem `service_tier`, sem `store` da Responses, sem formatação de payload de compatibilidade de raciocínio do OpenAI e sem dicas de cache de prompt
- cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`) não são injetados nessas URLs de proxy personalizadas

Notas de compatibilidade para backends compatíveis com OpenAI mais rígidos:

- Alguns servidores aceitam apenas `messages[].content` como string em Chat Completions, e não arrays estruturados de partes de conteúdo. Defina `models.providers.<provider>.models[].compat.requiresStringContent: true` para esses endpoints.
- Alguns backends locais menores ou mais rígidos são instáveis com o formato completo de prompt do runtime de agentes do OpenClaw, especialmente quando esquemas de ferramentas estão incluídos. Se o backend funcionar para chamadas diretas pequenas de `/v1/chat/completions`, mas falhar em turnos normais de agentes do OpenClaw, tente primeiro `models.providers.<provider>.models[].compat.supportsTools: false`.
- Se o backend ainda falhar apenas em execuções maiores do OpenClaw, o problema restante normalmente é capacidade do modelo/servidor upstream ou um bug do backend, não da camada de transporte do OpenClaw.

## Solução de problemas

- O Gateway consegue alcançar o proxy? `curl http://127.0.0.1:1234/v1/models`.
- Modelo do LM Studio descarregado? Recarregue; inicialização a frio é uma causa comum de “travamento”.
- Erros de contexto? Reduza `contextWindow` ou aumente o limite do seu servidor.
- O servidor compatível com OpenAI retorna `messages[].content ... expected a string`?
  Adicione `compat.requiresStringContent: true` nessa entrada de modelo.
- Chamadas diretas pequenas de `/v1/chat/completions` funcionam, mas `openclaw infer model run` falha em Gemma ou outro modelo local? Desative primeiro os esquemas de ferramentas com `compat.supportsTools: false` e teste novamente. Se o servidor ainda travar apenas em prompts maiores do OpenClaw, trate isso como uma limitação do servidor/modelo upstream.
- Segurança: modelos locais ignoram filtros do provider; mantenha os agentes restritos e a Compaction ativada para limitar o raio de impacto da injeção de prompt.
