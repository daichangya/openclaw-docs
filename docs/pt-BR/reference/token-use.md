---
read_when:
    - Explicando uso de tokens, custos ou janelas de contexto
    - Depurando crescimento de contexto ou comportamento de Compaction
summary: Como o OpenClaw cria o contexto do prompt e relata uso de tokens + custos
title: Uso de tokens e custos
x-i18n:
    generated_at: "2026-04-21T05:43:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: d26db37353941e247eb26f84bfa105896318b3239b2975d6e033c6e9ceda6b0d
    source_path: reference/token-use.md
    workflow: 15
---

# Uso de tokens e custos

O OpenClaw rastreia **tokens**, não caracteres. Tokens são específicos do modelo, mas a maioria dos
modelos no estilo OpenAI tem média de ~4 caracteres por token em texto em inglês.

## Como o prompt de sistema é criado

O OpenClaw monta seu próprio prompt de sistema em cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas
- Lista de Skills (apenas metadados; instruções são carregadas sob demanda com `read`).
  O bloco compacto de Skills é limitado por `skills.limits.maxSkillsPromptChars`,
  com substituição opcional por agente em
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Instruções de autoatualização
- Workspace + arquivos de bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` quando novo, mais `MEMORY.md` quando presente ou `memory.md` como fallback em minúsculas). Arquivos grandes são truncados por `agents.defaults.bootstrapMaxChars` (padrão: 12000), e a injeção total de bootstrap é limitada por `agents.defaults.bootstrapTotalMaxChars` (padrão: 60000). Arquivos diários `memory/*.md` não fazem parte do prompt normal de bootstrap; eles permanecem sob demanda via ferramentas de memória em turns comuns, mas `/new` e `/reset` sem argumentos podem prefixar um bloco único de contexto de inicialização com memória diária recente para esse primeiro turn. Esse prelúdio de inicialização é controlado por `agents.defaults.startupContext`.
- Hora (UTC + fuso horário do usuário)
- Tags de resposta + comportamento de Heartbeat
- Metadados de runtime (host/SO/modelo/pensamento)

Veja a decomposição completa em [System Prompt](/pt-BR/concepts/system-prompt).

## O que conta na janela de contexto

Tudo o que o modelo recebe conta para o limite de contexto:

- Prompt de sistema (todas as seções listadas acima)
- Histórico de conversa (mensagens do usuário + assistente)
- Chamadas de ferramenta e resultados de ferramenta
- Anexos/transcrições (imagens, áudio, arquivos)
- Resumos de Compaction e artefatos de poda
- Wrappers de provedor ou cabeçalhos de segurança (não visíveis, mas ainda contados)

Algumas superfícies pesadas de runtime têm seus próprios limites explícitos:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Substituições por agente ficam em `agents.list[].contextLimits`. Esses controles
servem para trechos limitados de runtime e blocos injetados controlados pelo runtime. Eles são
separados dos limites de bootstrap, dos limites de contexto de inicialização e dos limites
do prompt de Skills.

Para imagens, o OpenClaw reduz a escala dos payloads de imagem de transcrição/ferramenta antes das chamadas ao provedor.
Use `agents.defaults.imageMaxDimensionPx` (padrão: `1200`) para ajustar isso:

- Valores menores geralmente reduzem o uso de tokens de vision e o tamanho do payload.
- Valores maiores preservam mais detalhes visuais para screenshots com muito OCR/UI.

Para uma decomposição prática (por arquivo injetado, ferramentas, Skills e tamanho do prompt de sistema), use `/context list` ou `/context detail`. Veja [Context](/pt-BR/concepts/context).

## Como ver o uso atual de tokens

Use estes comandos no chat:

- `/status` → **cartão de status rico em emojis** com o modelo da sessão, uso de contexto,
  tokens de entrada/saída da última resposta e **custo estimado** (apenas chave de API).
- `/usage off|tokens|full` → anexa um **rodapé de uso por resposta** a cada resposta.
  - Persiste por sessão (armazenado como `responseUsage`).
  - Autenticação OAuth **oculta o custo** (apenas tokens).
- `/usage cost` → mostra um resumo local de custos a partir dos logs de sessão do OpenClaw.

Outras superfícies:

- **TUI/Web TUI:** `/status` e `/usage` são suportados.
- **CLI:** `openclaw status --usage` e `openclaw channels list` mostram
  janelas normalizadas de cota do provedor (`X% restante`, não custos por resposta).
  Provedores atuais de janela de uso: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi e z.ai.

As superfícies de uso normalizam aliases comuns de campos nativos do provedor antes da exibição.
Para tráfego de Responses da família OpenAI, isso inclui tanto `input_tokens` /
`output_tokens` quanto `prompt_tokens` / `completion_tokens`, para que nomes de campo específicos do transporte
não alterem `/status`, `/usage` ou resumos de sessão.
O uso em JSON do Gemini CLI também é normalizado: o texto da resposta vem de `response`, e
`stats.cached` é mapeado para `cacheRead`, com `stats.input_tokens - stats.cached`
usado quando a CLI omite um campo explícito `stats.input`.
Para tráfego nativo de Responses da família OpenAI, aliases de uso de WebSocket/SSE são
normalizados da mesma forma, e os totais usam como fallback entrada + saída normalizadas quando
`total_tokens` está ausente ou é `0`.
Quando o snapshot atual da sessão é esparso, `/status` e `session_status` também podem
recuperar contadores de tokens/cache e o rótulo ativo do modelo de runtime a partir do log
de uso da transcrição mais recente. Valores ativos existentes e diferentes de zero ainda têm
precedência sobre valores recuperados da transcrição, e totais maiores orientados a prompt
da transcrição podem prevalecer quando os totais armazenados estiverem ausentes ou forem menores.
A autenticação de uso para janelas de cota do provedor vem de hooks específicos do provedor quando
disponíveis; caso contrário, o OpenClaw usa como fallback credenciais correspondentes de OAuth/chave de API
de perfis de autenticação, env ou config.
Entradas de transcrição do assistente persistem o mesmo formato normalizado de uso, incluindo
`usage.cost` quando o modelo ativo tem preços configurados e o provedor retorna metadados de uso. Isso fornece a `/usage cost` e ao status de sessão apoiado por transcrição
uma fonte estável mesmo depois que o estado de runtime ao vivo desaparece.

## Estimativa de custo (quando exibida)

Os custos são estimados a partir da sua configuração de preços do modelo:

```
models.providers.<provider>.models[].cost
```

Esses valores são em **USD por 1M de tokens** para `input`, `output`, `cacheRead` e
`cacheWrite`. Se o preço estiver ausente, o OpenClaw mostrará apenas tokens. Tokens OAuth
nunca mostram custo em dólar.

## Impacto do TTL do cache e da poda

O cache de prompt do provedor só se aplica dentro da janela TTL do cache. O OpenClaw pode
opcionalmente executar **poda por cache-ttl**: ele poda a sessão assim que o TTL do cache
expira e então redefine a janela de cache para que solicitações subsequentes possam reutilizar o
contexto recém-cacheado em vez de recachear todo o histórico. Isso mantém menores os custos
de gravação em cache quando uma sessão fica ociosa além do TTL.

Configure isso em [Configuração do Gateway](/pt-BR/gateway/configuration) e veja os
detalhes do comportamento em [Poda de sessão](/pt-BR/concepts/session-pruning).

O Heartbeat pode manter o cache **aquecido** durante intervalos ociosos. Se o TTL do cache
do seu modelo for `1h`, definir o intervalo de heartbeat um pouco abaixo disso (por exemplo, `55m`) pode evitar
recachear o prompt completo, reduzindo custos de gravação em cache.

Em configurações multiagente, você pode manter uma configuração de modelo compartilhada e ajustar o comportamento de cache
por agente com `agents.list[].params.cacheRetention`.

Para um guia completo parâmetro por parâmetro, veja [Prompt Caching](/pt-BR/reference/prompt-caching).

Para preços de API Anthropic, leituras de cache são significativamente mais baratas que
tokens de entrada, enquanto gravações de cache são cobradas com um multiplicador maior. Veja a documentação de preços
de prompt caching da Anthropic para as taxas mais recentes e multiplicadores de TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Exemplo: manter cache de 1h aquecido com Heartbeat

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

### Exemplo: tráfego misto com estratégia de cache por agente

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
        cacheRetention: "none" # evita gravações em cache para notificações em rajada
```

`agents.list[].params` é mesclado sobre `params` do modelo selecionado, então você pode
substituir apenas `cacheRetention` e herdar os outros padrões do modelo sem mudanças.

### Exemplo: habilitar cabeçalho beta de contexto Anthropic 1M

A janela de contexto Anthropic de 1M está atualmente protegida por beta. O OpenClaw pode injetar o
valor `anthropic-beta` necessário quando você habilita `context1m` em modelos Opus
ou Sonnet compatíveis.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Isso é mapeado para o cabeçalho beta `context-1m-2025-08-07` da Anthropic.

Isso se aplica apenas quando `context1m: true` está definido nessa entrada de modelo.

Requisito: a credencial deve ser elegível para uso de contexto longo. Caso contrário,
a Anthropic responde com um erro de rate limit do lado do provedor para essa solicitação.

Se você autenticar a Anthropic com tokens OAuth/subscription (`sk-ant-oat-*`),
o OpenClaw ignora o cabeçalho beta `context-1m-*` porque a Anthropic atualmente
rejeita essa combinação com HTTP 401.

## Dicas para reduzir a pressão de tokens

- Use `/compact` para resumir sessões longas.
- Reduza saídas grandes de ferramentas nos seus fluxos de trabalho.
- Diminua `agents.defaults.imageMaxDimensionPx` para sessões com muitas screenshots.
- Mantenha descrições de Skills curtas (a lista de Skills é injetada no prompt).
- Prefira modelos menores para trabalho verboso e exploratório.

Veja [Skills](/pt-BR/tools/skills) para a fórmula exata de sobrecarga da lista de Skills.
