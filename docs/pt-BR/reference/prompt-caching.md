---
read_when:
    - Você quer reduzir os custos de tokens de prompt com retenção de cache
    - Você precisa de comportamento de cache por agente em configurações com múltiplos agentes
    - Você está ajustando heartbeat e poda de cache-ttl em conjunto
summary: Controles de cache de prompt, ordem de merge, comportamento de provider e padrões de ajuste
title: Cache de prompt
x-i18n:
    generated_at: "2026-04-05T12:52:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 13d5f3153b6593ae22cd04a6c2540e074cf15df9f1990fc5b7184fe803f4a1bd
    source_path: reference/prompt-caching.md
    workflow: 15
---

# Cache de prompt

Cache de prompt significa que o provider do modelo pode reutilizar prefixos de prompt inalterados (geralmente instruções de sistema/desenvolvedor e outro contexto estável) entre turnos, em vez de reprocessá-los toda vez. O OpenClaw normaliza o uso do provider em `cacheRead` e `cacheWrite` quando a API upstream expõe esses contadores diretamente.

As superfícies de status também podem recuperar contadores de cache do log de uso
mais recente do transcript quando o snapshot da sessão ao vivo não os contém, para que `/status` continue
mostrando uma linha de cache após perda parcial dos metadados da sessão. Valores de cache ao vivo
existentes e diferentes de zero ainda têm precedência sobre valores de fallback do transcript.

Por que isso importa: menor custo de tokens, respostas mais rápidas e desempenho mais previsível em sessões de longa duração. Sem cache, prompts repetidos pagam o custo total do prompt em cada turno, mesmo quando a maior parte da entrada não mudou.

Esta página cobre todos os controles relacionados a cache que afetam a reutilização de prompts e o custo de tokens.

Referências de providers:

- Cache de prompt da Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Cache de prompt da OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Headers da API OpenAI e IDs de requisição: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- IDs de requisição e erros da Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Controles principais

### `cacheRetention` (padrão global, modelo e por agente)

Defina a retenção de cache como padrão global para todos os modelos:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Substitua por modelo:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Substituição por agente:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Ordem de merge da configuração:

1. `agents.defaults.params` (padrão global — aplica-se a todos os modelos)
2. `agents.defaults.models["provider/model"].params` (substituição por modelo)
3. `agents.list[].params` (id do agente correspondente; substitui por chave)

### `contextPruning.mode: "cache-ttl"`

Remove o contexto antigo de resultados de tool após janelas TTL de cache para que requisições após inatividade não recoloquem em cache um histórico grande demais.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Consulte [Session Pruning](/pt-BR/concepts/session-pruning) para o comportamento completo.

### Heartbeat para manter aquecido

O heartbeat pode manter janelas de cache aquecidas e reduzir gravações repetidas em cache após intervalos de inatividade.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat por agente é compatível em `agents.list[].heartbeat`.

## Comportamento do provider

### Anthropic (API direta)

- `cacheRetention` é compatível.
- Com perfis de autenticação de API key da Anthropic, o OpenClaw define `cacheRetention: "short"` para refs de modelo Anthropic quando não configurado.
- Respostas nativas de Anthropic Messages expõem tanto `cache_read_input_tokens` quanto `cache_creation_input_tokens`, então o OpenClaw pode mostrar `cacheRead` e `cacheWrite`.
- Para requisições nativas da Anthropic, `cacheRetention: "short"` mapeia para o cache efêmero padrão de 5 minutos, e `cacheRetention: "long"` sobe para o TTL de 1 hora apenas em hosts diretos `api.anthropic.com`.

### OpenAI (API direta)

- O cache de prompt é automático em modelos recentes compatíveis. O OpenClaw não precisa injetar marcadores de cache em nível de bloco.
- O OpenClaw usa `prompt_cache_key` para manter o roteamento do cache estável entre turnos e usa `prompt_cache_retention: "24h"` somente quando `cacheRetention: "long"` é selecionado em hosts diretos da OpenAI.
- Respostas da OpenAI expõem tokens de prompt em cache por `usage.prompt_tokens_details.cached_tokens` (ou `input_tokens_details.cached_tokens` em eventos da API Responses). O OpenClaw mapeia isso para `cacheRead`.
- A OpenAI não expõe um contador separado de tokens gravados em cache, então `cacheWrite` permanece `0` em caminhos OpenAI mesmo quando o provider está aquecendo um cache.
- A OpenAI retorna headers úteis de rastreamento e limite de taxa, como `x-request-id`, `openai-processing-ms` e `x-ratelimit-*`, mas a contabilização de acertos de cache deve vir do payload de uso, não dos headers.
- Na prática, a OpenAI frequentemente se comporta como um cache de prefixo inicial, e não como uma reutilização móvel de histórico completo no estilo Anthropic. Turnos de texto estáveis com prefixo longo podem ficar perto de um platô de `4864` tokens em cache em sondagens live atuais, enquanto transcripts pesados em tools ou no estilo MCP frequentemente se estabilizam perto de `4608` tokens em cache mesmo em repetições exatas.

### Anthropic Vertex

- Modelos Anthropic no Vertex AI (`anthropic-vertex/*`) oferecem suporte a `cacheRetention` da mesma forma que a Anthropic direta.
- `cacheRetention: "long"` mapeia para o TTL real de 1 hora do cache de prompt em endpoints do Vertex AI.
- A retenção de cache padrão para `anthropic-vertex` corresponde aos padrões da Anthropic direta.
- Requisições do Vertex são roteadas por modelagem de cache com reconhecimento de limites para que a reutilização de cache permaneça alinhada ao que os providers realmente recebem.

### Amazon Bedrock

- Refs de modelo Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) oferecem suporte a repasse explícito de `cacheRetention`.
- Modelos Bedrock não Anthropic são forçados para `cacheRetention: "none"` em runtime.

### Modelos Anthropic no OpenRouter

Para refs de modelo `openrouter/anthropic/*`, o OpenClaw injeta
`cache_control` da Anthropic nos blocos de prompt de sistema/desenvolvedor para melhorar a reutilização
do cache de prompt somente quando a requisição ainda está apontando para uma rota OpenRouter verificada
(`openrouter` em seu endpoint padrão, ou qualquer provider/base URL que resolva
para `openrouter.ai`).

Se você redirecionar o modelo para uma URL arbitrária de proxy compatível com OpenAI, o OpenClaw
para de injetar esses marcadores de cache Anthropic específicos do OpenRouter.

### Outros providers

Se o provider não oferecer suporte a esse modo de cache, `cacheRetention` não terá efeito.

### API direta do Google Gemini

- O transporte direto do Gemini (`api: "google-generative-ai"`) relata acertos de cache
  por `cachedContentTokenCount` do upstream; o OpenClaw mapeia isso para `cacheRead`.
- Quando `cacheRetention` é definido em um modelo Gemini direto, o OpenClaw automaticamente
  cria, reutiliza e atualiza recursos `cachedContents` para prompts de sistema
  em execuções do Google AI Studio. Isso significa que você não precisa mais criar manualmente
  um identificador de cached content.
- Você ainda pode passar um identificador Gemini de cached content já existente em
  `params.cachedContent` (ou o legado `params.cached_content`) no modelo
  configurado.
- Isso é separado do cache de prefixo de prompt da Anthropic/OpenAI. Para Gemini,
  o OpenClaw gerencia um recurso nativo de provider `cachedContents` em vez de
  injetar marcadores de cache na requisição.

### Uso JSON do Gemini CLI

- A saída JSON do Gemini CLI também pode expor acertos de cache por `stats.cached`;
  o OpenClaw mapeia isso para `cacheRead`.
- Se a CLI omitir um valor direto de `stats.input`, o OpenClaw deriva os tokens de entrada
  de `stats.input_tokens - stats.cached`.
- Isso é apenas normalização de uso. Não significa que o OpenClaw esteja criando
  marcadores de cache de prompt no estilo Anthropic/OpenAI para Gemini CLI.

## Limite de cache do prompt de sistema

O OpenClaw divide o prompt de sistema em um **prefixo estável** e um **sufixo
volátil**, separados por um limite interno de prefixo de cache. O conteúdo acima do
limite (definições de tools, metadados de skills, arquivos do workspace e outro
contexto relativamente estático) é ordenado para permanecer idêntico em bytes entre turnos.
O conteúdo abaixo do limite (por exemplo `HEARTBEAT.md`, timestamps de runtime e
outros metadados por turno) pode mudar sem invalidar o prefixo em cache.

Principais escolhas de design:

- Arquivos estáveis de contexto de projeto do workspace são ordenados antes de `HEARTBEAT.md`, para
  que a variação do heartbeat não invalide o prefixo estável.
- O limite é aplicado em Anthropic-family, OpenAI-family, Google e modelagem de transporte da CLI, para que todos os providers compatíveis se beneficiem da mesma
  estabilidade de prefixo.
- Requisições Codex Responses e Anthropic Vertex são roteadas por
  modelagem de cache com reconhecimento de limites para que a reutilização de cache permaneça alinhada ao que os providers realmente recebem.
- As impressões digitais do prompt de sistema são normalizadas (espaços em branco, finais de linha,
  contexto adicionado por hooks, ordenação de capacidades de runtime) para que prompts semanticamente inalterados compartilhem KV/cache entre turnos.

Se você vir picos inesperados de `cacheWrite` após uma mudança de configuração ou de workspace,
verifique se a mudança fica acima ou abaixo do limite de cache. Mover
conteúdo volátil para baixo do limite (ou estabilizá-lo) geralmente resolve o
problema.

## Proteções do OpenClaw para estabilidade de cache

O OpenClaw também mantém determinísticos vários formatos de payload sensíveis a cache antes
que a requisição chegue ao provider:

- Catálogos de tools MCP de bundle são ordenados deterministicamente antes do
  registro das tools, para que mudanças na ordem de `listTools()` não alterem o bloco de tools nem invalidem prefixos de cache de prompt.
- Sessões legadas com blocos de imagem persistidos mantêm os **3 turnos concluídos
  mais recentes** intactos; blocos de imagem mais antigos já processados podem ser
  substituídos por um marcador para que acompanhamentos pesados em imagem não continuem reenviando grandes
  payloads obsoletos.

## Padrões de ajuste

### Tráfego misto (padrão recomendado)

Mantenha uma base de longa duração no seu agente principal e desative o cache em agentes notificadores com tráfego em rajada:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Base focada em custo

- Defina a base com `cacheRetention: "short"`.
- Habilite `contextPruning.mode: "cache-ttl"`.
- Mantenha o heartbeat abaixo do seu TTL apenas para agentes que se beneficiem de caches aquecidos.

## Diagnósticos de cache

O OpenClaw expõe diagnósticos dedicados de rastreamento de cache para execuções de agente embutido.

Para diagnósticos normais voltados ao usuário, `/status` e outros resumos de uso podem usar
a entrada de uso mais recente do transcript como fonte de fallback para `cacheRead` /
`cacheWrite` quando a entrada da sessão ao vivo não tiver esses contadores.

## Testes de regressão live

O OpenClaw mantém um único gate combinado de regressão live de cache para prefixos repetidos, turnos com tools, turnos com imagem, transcripts de tools no estilo MCP e um controle sem cache da Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Execute o gate live estreito com:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

O arquivo de baseline armazena os números live observados mais recentemente, além dos pisos de regressão específicos do provider usados pelo teste.
O runner também usa IDs de sessão novos por execução e namespaces de prompt novos para que estados de cache anteriores não contaminem a amostra de regressão atual.

Esses testes intencionalmente não usam critérios de sucesso idênticos entre providers.

### Expectativas live da Anthropic

- Espere gravações explícitas de aquecimento via `cacheWrite`.
- Espere reutilização de quase todo o histórico em turnos repetidos, porque o controle de cache da Anthropic avança o ponto de quebra de cache ao longo da conversa.
- As asserções live atuais ainda usam limites altos de taxa de acerto para caminhos estáveis, de tools e de imagem.

### Expectativas live da OpenAI

- Espere apenas `cacheRead`. `cacheWrite` permanece `0`.
- Trate a reutilização de cache em turnos repetidos como um platô específico do provider, não como a reutilização móvel de histórico completo no estilo Anthropic.
- As asserções live atuais usam verificações conservadoras de piso derivadas do comportamento live observado em `gpt-5.4-mini`:
  - prefixo estável: `cacheRead >= 4608`, taxa de acerto `>= 0.90`
  - transcript de tool: `cacheRead >= 4096`, taxa de acerto `>= 0.85`
  - transcript de imagem: `cacheRead >= 3840`, taxa de acerto `>= 0.82`
  - transcript no estilo MCP: `cacheRead >= 4096`, taxa de acerto `>= 0.85`

A verificação live combinada mais recente em 2026-04-04 chegou a:

- prefixo estável: `cacheRead=4864`, taxa de acerto `0.966`
- transcript de tool: `cacheRead=4608`, taxa de acerto `0.896`
- transcript de imagem: `cacheRead=4864`, taxa de acerto `0.954`
- transcript no estilo MCP: `cacheRead=4608`, taxa de acerto `0.891`

O tempo local de wall-clock recente para o gate combinado foi de cerca de `88s`.

Por que as asserções diferem:

- A Anthropic expõe pontos explícitos de quebra de cache e reutilização móvel do histórico da conversa.
- O cache de prompt da OpenAI ainda é sensível a prefixos exatos, mas o prefixo reutilizável efetivo no tráfego live de Responses pode estabilizar antes do prompt completo.
- Por causa disso, comparar Anthropic e OpenAI por um único limite percentual entre providers cria regressões falsas.

### Configuração `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Padrões:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Alternâncias de env (depuração pontual)

- `OPENCLAW_CACHE_TRACE=1` habilita o rastreamento de cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` substitui o caminho de saída.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` ativa/desativa a captura completa do payload de mensagens.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` ativa/desativa a captura de texto do prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` ativa/desativa a captura do prompt de sistema.

### O que inspecionar

- Eventos de rastreamento de cache são JSONL e incluem snapshots em etapas como `session:loaded`, `prompt:before`, `stream:context` e `session:after`.
- O impacto de tokens de cache por turno é visível nas superfícies normais de uso via `cacheRead` e `cacheWrite` (por exemplo `/usage full` e resumos de uso da sessão).
- Para Anthropic, espere `cacheRead` e `cacheWrite` quando o cache estiver ativo.
- Para OpenAI, espere `cacheRead` em acertos de cache e `cacheWrite` permanecendo `0`; a OpenAI não publica um campo separado para tokens gravados em cache.
- Se você precisar de rastreamento de requisição, registre IDs de requisição e headers de limite de taxa separadamente das métricas de cache. A saída atual de cache-trace do OpenClaw é focada em formato de prompt/sessão e uso normalizado de tokens, não em headers brutos de resposta do provider.

## Solução rápida de problemas

- `cacheWrite` alto na maioria dos turnos: verifique entradas voláteis no prompt de sistema e confirme se o modelo/provider oferece suporte às suas configurações de cache.
- `cacheWrite` alto na Anthropic: geralmente significa que o ponto de quebra de cache está caindo em conteúdo que muda a cada requisição.
- `cacheRead` baixo na OpenAI: verifique se o prefixo estável está no início, se o prefixo repetido tem pelo menos 1024 tokens e se a mesma `prompt_cache_key` é reutilizada nos turnos que devem compartilhar um cache.
- Nenhum efeito de `cacheRetention`: confirme se a chave do modelo corresponde a `agents.defaults.models["provider/model"]`.
- Requisições Bedrock Nova/Mistral com configurações de cache: a força para `none` em runtime é esperada.

Documentos relacionados:

- [Anthropic](/providers/anthropic)
- [Token Use and Costs](/reference/token-use)
- [Session Pruning](/pt-BR/concepts/session-pruning)
- [Gateway Configuration Reference](/pt-BR/gateway/configuration-reference)
