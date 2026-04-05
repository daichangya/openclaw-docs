---
read_when:
    - Explicar uso de tokens, custos ou janelas de contexto
    - Depurar crescimento de contexto ou comportamento de compactação
summary: Como o OpenClaw monta o contexto do prompt e informa uso de tokens + custos
title: Uso de tokens e custos
x-i18n:
    generated_at: "2026-04-05T12:53:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 14e7a0ac0311298cf1484d663799a3f5a9687dd5afc9702233e983aba1979f1d
    source_path: reference/token-use.md
    workflow: 15
---

# Uso de tokens e custos

O OpenClaw rastreia **tokens**, não caracteres. Os tokens são específicos do modelo, mas a maioria
dos modelos no estilo OpenAI tem média de ~4 caracteres por token em textos em inglês.

## Como o prompt do sistema é montado

O OpenClaw monta seu próprio prompt do sistema em cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas
- Lista de Skills (somente metadados; as instruções são carregadas sob demanda com `read`)
- Instruções de autoatualização
- Arquivos do workspace + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando novo, além de `MEMORY.md` quando presente ou `memory.md` como fallback em minúsculas). Arquivos grandes são truncados por `agents.defaults.bootstrapMaxChars` (padrão: 20000), e a injeção total de bootstrap é limitada por `agents.defaults.bootstrapTotalMaxChars` (padrão: 150000). Arquivos `memory/*.md` ficam sob demanda via ferramentas de memória e não são injetados automaticamente.
- Hora (UTC + fuso horário do usuário)
- Tags de resposta + comportamento de heartbeat
- Metadados de runtime (host/SO/model/thinking)

Veja a decomposição completa em [Prompt do sistema](/pt-BR/concepts/system-prompt).

## O que conta na janela de contexto

Tudo que o modelo recebe conta para o limite de contexto:

- Prompt do sistema (todas as seções listadas acima)
- Histórico da conversa (mensagens do usuário + do assistente)
- Chamadas de ferramenta e resultados de ferramenta
- Anexos/transcrições (imagens, áudio, arquivos)
- Resumos de compactação e artefatos de poda
- Wrappers do provedor ou headers de segurança (não visíveis, mas ainda contados)

Para imagens, o OpenClaw reduz a escala de payloads de imagem de transcrição/ferramenta antes das chamadas ao provedor.
Use `agents.defaults.imageMaxDimensionPx` (padrão: `1200`) para ajustar isso:

- Valores menores normalmente reduzem o uso de vision-tokens e o tamanho do payload.
- Valores maiores preservam mais detalhes visuais para OCR/capturas de tela com muita interface.

Para uma decomposição prática (por arquivo injetado, ferramentas, Skills e tamanho do prompt do sistema), use `/context list` ou `/context detail`. Consulte [Contexto](/pt-BR/concepts/context).

## Como ver o uso atual de tokens

Use estes comandos no chat:

- `/status` → **cartão de status rico em emojis** com o modelo da sessão, uso de contexto,
  tokens de entrada/saída da última resposta e **custo estimado** (somente chave de API).
- `/usage off|tokens|full` → adiciona um **rodapé de uso por resposta** a cada resposta.
  - Persiste por sessão (armazenado como `responseUsage`).
  - Auth por OAuth **oculta o custo** (somente tokens).
- `/usage cost` → mostra um resumo local de custo a partir dos logs de sessão do OpenClaw.

Outras superfícies:

- **TUI/Web TUI:** `/status` + `/usage` têm suporte.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostram
  janelas normalizadas de cota do provedor (`X% restante`, não custos por resposta).
  Provedores atuais com janela de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

As superfícies de uso normalizam aliases comuns dos campos nativos do provedor antes da exibição.
Para tráfego de Responses da família OpenAI, isso inclui tanto `input_tokens` /
`output_tokens` quanto `prompt_tokens` / `completion_tokens`, para que nomes de campo
específicos do transporte não alterem `/status`, `/usage` nem os resumos de sessão.
O uso de JSON do Gemini CLI também é normalizado: o texto da resposta vem de `response`, e
`stats.cached` é mapeado para `cacheRead`, com `stats.input_tokens - stats.cached`
usado quando a CLI omite um campo explícito `stats.input`.
Para tráfego nativo de Responses da família OpenAI, aliases de uso de WebSocket/SSE são
normalizados da mesma forma, e os totais recorrem à soma normalizada de entrada + saída quando
`total_tokens` está ausente ou é `0`.
Quando o snapshot atual da sessão é esparso, `/status` e `session_status` também podem
recuperar contadores de tokens/cache e o rótulo do modelo ativo de runtime a partir do log de uso
mais recente da transcrição. Valores ativos não zero já existentes ainda têm
precedência sobre valores de fallback da transcrição, e totais maiores
orientados ao prompt da transcrição podem prevalecer quando os totais armazenados estiverem ausentes ou menores.
A auth de uso para janelas de cota do provedor vem de hooks específicos do provedor quando
disponíveis; caso contrário, o OpenClaw recorre a credenciais correspondentes de OAuth/chave de API
de perfis de auth, env ou config.

## Estimativa de custo (quando exibida)

Os custos são estimados a partir da sua config de preços do modelo:

```
models.providers.<provider>.models[].cost
```

Esses valores são em **USD por 1M de tokens** para `input`, `output`, `cacheRead` e
`cacheWrite`. Se o preço estiver ausente, o OpenClaw mostra apenas tokens. Tokens OAuth
nunca mostram custo em dólar.

## Impacto do TTL de cache e da poda

O cache de prompt do provedor só se aplica dentro da janela de TTL do cache. O OpenClaw pode
opcionalmente executar **poda por cache-ttl**: ele poda a sessão quando o TTL do cache
expira e depois redefine a janela de cache para que solicitações subsequentes possam reutilizar o
contexto recém-cacheado, em vez de recachear todo o histórico. Isso mantém os custos de
gravação de cache mais baixos quando uma sessão fica ociosa além do TTL.

Configure isso em [Configuração do Gateway](/pt-BR/gateway/configuration) e veja os
detalhes do comportamento em [Poda de sessão](/pt-BR/concepts/session-pruning).

O heartbeat pode manter o cache **aquecido** durante períodos de ociosidade. Se o TTL do cache do seu modelo
for `1h`, definir o intervalo de heartbeat um pouco abaixo disso (por exemplo, `55m`) pode evitar
recachear o prompt completo, reduzindo os custos de gravação de cache.

Em configurações com vários agentes, você pode manter uma config de modelo compartilhada e ajustar o comportamento do cache
por agent com `agents.list[].params.cacheRetention`.

Para um guia completo opção por opção, consulte [Prompt Caching](/reference/prompt-caching).

Para preços da API da Anthropic, leituras de cache são significativamente mais baratas do que
tokens de entrada, enquanto gravações de cache são cobradas com um multiplicador mais alto. Consulte os preços mais recentes e os multiplicadores de TTL do prompt caching da Anthropic:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemplo: manter o cache de 1h aquecido com heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Exemplo: tráfego misto com estratégia de cache por agent

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # baseline padrão para a maioria dos agentes
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # mantém o cache longo aquecido para sessões profundas
    - id: "alerts"
      params:
        cacheRetention: "none" # evita gravações de cache para notificações em rajada
```

`agents.list[].params` é mesclado por cima de `params` do modelo selecionado, então você pode
substituir apenas `cacheRetention` e herdar os outros padrões do modelo sem alterações.

### Exemplo: ativar o header beta de contexto 1M da Anthropic

A janela de contexto de 1M da Anthropic atualmente depende de beta. O OpenClaw pode injetar o
valor `anthropic-beta` necessário quando você ativa `context1m` em modelos Opus
ou Sonnet compatíveis.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Isso corresponde ao header beta `context-1m-2025-08-07` da Anthropic.

Isso só se aplica quando `context1m: true` estiver definido nessa entrada de modelo.

Requisito: a credencial deve ser elegível para uso de contexto longo (cobrança por chave de API
ou o caminho de login Claude do OpenClaw com Extra Usage ativado). Caso contrário,
a Anthropic responde
com `HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Se você autenticar a Anthropic com tokens OAuth/assinatura (`sk-ant-oat-*`),
o OpenClaw ignora o header beta `context-1m-*` porque a Anthropic atualmente
rejeita essa combinação com HTTP 401.

## Dicas para reduzir a pressão de tokens

- Use `/compact` para resumir sessões longas.
- Reduza saídas grandes de ferramenta nos seus fluxos de trabalho.
- Diminua `agents.defaults.imageMaxDimensionPx` em sessões com muitas capturas de tela.
- Mantenha as descrições de Skills curtas (a lista de Skills é injetada no prompt).
- Prefira modelos menores para trabalho verboso e exploratório.

Consulte [Skills](/tools/skills) para a fórmula exata de overhead da lista de Skills.
