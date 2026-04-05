---
read_when:
    - Você quer usar modelos OpenAI no OpenClaw
    - Você quer autenticação por assinatura do Codex em vez de chaves de API
summary: Use o OpenAI por meio de chaves de API ou assinatura do Codex no OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-05T12:51:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537119853503d398f9136170ac12ecfdbd9af8aef3c4c011f8ada4c664bdaf6d
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

A OpenAI fornece APIs para desenvolvedores dos modelos GPT. O Codex oferece suporte a **login com ChatGPT** para acesso por assinatura
ou **login com chave de API** para acesso baseado em uso. O Codex cloud exige login com ChatGPT.
A OpenAI oferece suporte explícito ao uso de OAuth por assinatura em ferramentas/fluxos externos como o OpenClaw.

## Estilo de interação padrão

O OpenClaw adiciona por padrão uma pequena sobreposição de prompt específica da OpenAI para
execuções `openai/*` e `openai-codex/*`. A sobreposição mantém o assistente receptivo,
colaborativo, conciso e direto sem substituir o prompt base do sistema
do OpenClaw.

Chave de configuração:

`plugins.entries.openai.config.personalityOverlay`

Valores permitidos:

- `"friendly"`: padrão; ativa a sobreposição específica da OpenAI.
- `"off"`: desativa a sobreposição e usa apenas o prompt base do OpenClaw.

Escopo:

- Aplica-se a modelos `openai/*`.
- Aplica-se a modelos `openai-codex/*`.
- Não afeta outros providers.

Esse comportamento está ativado por padrão:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "friendly",
        },
      },
    },
  },
}
```

### Desativar a sobreposição de prompt da OpenAI

Se você preferir o prompt base do OpenClaw sem modificações, desative a sobreposição:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "off",
        },
      },
    },
  },
}
```

Você também pode defini-la diretamente com a CLI de configuração:

```bash
openclaw config set plugins.entries.openai.config.personalityOverlay off
```

## Opção A: chave de API da OpenAI (OpenAI Platform)

**Melhor para:** acesso direto à API e cobrança baseada em uso.
Obtenha sua chave de API no painel da OpenAI.

### Configuração da CLI

```bash
openclaw onboard --auth-choice openai-api-key
# ou não interativo
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Trecho de configuração

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

A documentação atual dos modelos da API da OpenAI lista `gpt-5.4` e `gpt-5.4-pro` para uso direto
da API da OpenAI. O OpenClaw encaminha ambos pelo caminho `openai/*` Responses.
O OpenClaw intencionalmente suprime a linha desatualizada `openai/gpt-5.3-codex-spark`,
porque chamadas diretas à API da OpenAI a rejeitam em tráfego real.

O OpenClaw **não** expõe `openai/gpt-5.3-codex-spark` no caminho direto da API da OpenAI.
O `pi-ai` ainda inclui uma linha integrada para esse modelo, mas requisições reais à API da OpenAI
atualmente o rejeitam. No OpenClaw, o Spark é tratado como exclusivo do Codex.

## Opção B: assinatura do OpenAI Code (Codex)

**Melhor para:** usar acesso por assinatura do ChatGPT/Codex em vez de uma chave de API.
O Codex cloud exige login com ChatGPT, enquanto o Codex CLI oferece suporte a login com ChatGPT ou chave de API.

### Configuração da CLI (Codex OAuth)

```bash
# Execute o OAuth do Codex no assistente
openclaw onboard --auth-choice openai-codex

# Ou execute o OAuth diretamente
openclaw models auth login --provider openai-codex
```

### Trecho de configuração (assinatura Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

A documentação atual do Codex da OpenAI lista `gpt-5.4` como o modelo atual do Codex. O OpenClaw
mapeia isso para `openai-codex/gpt-5.4` para uso de OAuth do ChatGPT/Codex.

Se o onboarding reutilizar um login existente do Codex CLI, essas credenciais continuarão
gerenciadas pelo Codex CLI. Ao expirar, o OpenClaw relê primeiro a fonte externa do Codex
e, quando o provider consegue atualizá-la, grava a credencial atualizada
de volta no armazenamento do Codex em vez de assumir a posse em uma cópia separada
somente do OpenClaw.

Se sua conta Codex tiver direito ao Codex Spark, o OpenClaw também oferece suporte a:

- `openai-codex/gpt-5.3-codex-spark`

O OpenClaw trata o Codex Spark como exclusivo do Codex. Ele não expõe um caminho direto de chave de API
`openai/gpt-5.3-codex-spark`.

O OpenClaw também preserva `openai-codex/gpt-5.3-codex-spark` quando o `pi-ai`
o detecta. Trate-o como dependente de entitlement e experimental: o Codex Spark é
separado do `/fast` do GPT-5.4, e a disponibilidade depende da conta Codex / ChatGPT conectada.

### Limite da janela de contexto do Codex

O OpenClaw trata os metadados do modelo Codex e o limite de contexto em runtime como valores
separados.

Para `openai-codex/gpt-5.4`:

- `contextWindow` nativo: `1050000`
- limite `contextTokens` padrão em runtime: `272000`

Isso mantém os metadados do modelo fiéis, preservando ao mesmo tempo a janela menor padrão de runtime
que, na prática, tem melhores características de latência e qualidade.

Se você quiser um limite efetivo diferente, defina `models.providers.<provider>.models[].contextTokens`:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

Use `contextWindow` apenas quando estiver declarando ou substituindo metadados nativos do
modelo. Use `contextTokens` quando quiser limitar o orçamento de contexto em runtime.

### Transporte padrão

O OpenClaw usa `pi-ai` para streaming de modelos. Para `openai/*` e
`openai-codex/*`, o transporte padrão é `"auto"` (WebSocket primeiro, depois
fallback para SSE).

No modo `"auto"`, o OpenClaw também tenta novamente uma falha inicial de WebSocket que possa ser repetida
antes de recorrer ao SSE. O modo `"websocket"` forçado ainda expõe erros de transporte
diretamente em vez de escondê-los atrás do fallback.

Após uma falha de conexão ou de início de turno do WebSocket no modo `"auto"`, o OpenClaw marca
o caminho WebSocket dessa sessão como degradado por cerca de 60 segundos e envia
os turnos seguintes por SSE durante esse período de espera, em vez de alternar
repetidamente entre transportes.

Para endpoints nativos da família OpenAI (`openai/*`, `openai-codex/*` e Azure
OpenAI Responses), o OpenClaw também anexa estado estável de identidade de sessão e turno
às requisições para que tentativas, reconexões e fallback para SSE permaneçam alinhados à mesma
identidade de conversa. Nas rotas nativas da família OpenAI isso inclui cabeçalhos estáveis de identidade
de requisição de sessão/turno, além de metadados de transporte correspondentes.

O OpenClaw também normaliza contadores de uso da OpenAI entre variantes de transporte antes que eles
cheguem às superfícies de sessão/status. O tráfego nativo OpenAI/Codex Responses pode
reportar uso como `input_tokens` / `output_tokens` ou
`prompt_tokens` / `completion_tokens`; o OpenClaw trata ambos como os mesmos contadores de entrada
e saída para `/status`, `/usage` e logs de sessão. Quando o tráfego WebSocket nativo
omite `total_tokens` (ou reporta `0`), o OpenClaw usa como fallback o total normalizado de entrada + saída
para que as exibições de sessão/status continuem preenchidas.

Você pode definir `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: força SSE
- `"websocket"`: força WebSocket
- `"auto"`: tenta WebSocket e depois recorre ao SSE

Para `openai/*` (API Responses), o OpenClaw também ativa por padrão o aquecimento de WebSocket
(`openaiWsWarmup: true`) quando o transporte WebSocket é usado.

Documentação relacionada da OpenAI:

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### Aquecimento de WebSocket da OpenAI

A documentação da OpenAI descreve o aquecimento como opcional. O OpenClaw o ativa por padrão para
`openai/*` para reduzir a latência do primeiro turno ao usar transporte WebSocket.

### Desativar o aquecimento

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Ativar o aquecimento explicitamente

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### Processamento prioritário da OpenAI e do Codex

A API da OpenAI expõe processamento prioritário por meio de `service_tier=priority`. No
OpenClaw, defina `agents.defaults.models["<provider>/<model>"].params.serviceTier`
para repassar esse campo em endpoints nativos OpenAI/Codex Responses.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Os valores compatíveis são `auto`, `default`, `flex` e `priority`.

O OpenClaw encaminha `params.serviceTier` tanto para requisições diretas `openai/*` Responses
quanto para requisições `openai-codex/*` Codex Responses quando esses modelos apontam
para os endpoints nativos OpenAI/Codex.

Comportamento importante:

- `openai/*` direto deve apontar para `api.openai.com`
- `openai-codex/*` deve apontar para `chatgpt.com/backend-api`
- se você rotear qualquer um dos providers por outra URL base ou proxy, o OpenClaw deixará `service_tier` inalterado

### Modo rápido da OpenAI

O OpenClaw expõe um alternador compartilhado de modo rápido para sessões `openai/*` e
`openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Configuração: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Quando o modo rápido está ativado, o OpenClaw o mapeia para o processamento prioritário da OpenAI:

- chamadas diretas `openai/*` Responses para `api.openai.com` enviam `service_tier = "priority"`
- chamadas `openai-codex/*` Responses para `chatgpt.com/backend-api` também enviam `service_tier = "priority"`
- valores existentes de `service_tier` no payload são preservados
- o modo rápido não reescreve `reasoning` nem `text.verbosity`

Exemplo:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Sobrescritas de sessão têm prioridade sobre a configuração. Limpar a sobrescrita de sessão na UI de Sessions
retorna a sessão ao padrão configurado.

### Rotas nativas OpenAI versus rotas compatíveis com OpenAI

O OpenClaw trata endpoints diretos OpenAI, Codex e Azure OpenAI de forma diferente
de proxies genéricos compatíveis com OpenAI em `/v1`:

- rotas nativas `openai/*`, `openai-codex/*` e Azure OpenAI mantêm
  `reasoning: { effort: "none" }` intacto quando você desativa explicitamente o reasoning
- rotas nativas da família OpenAI usam por padrão schemas de ferramenta em modo estrito
- cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version` e
  `User-Agent`) são anexados apenas em hosts nativos OpenAI verificados
  (`api.openai.com`) e hosts nativos Codex (`chatgpt.com/backend-api`)
- rotas nativas OpenAI/Codex mantêm modelagem de requisição exclusiva da OpenAI, como
  `service_tier`, `store` do Responses, payloads de compatibilidade de reasoning da OpenAI e
  dicas de cache de prompt
- rotas compatíveis com OpenAI no estilo proxy mantêm o comportamento de compatibilidade mais flexível e não
  forçam schemas de ferramenta estritos, modelagem de requisição exclusiva nativa nem cabeçalhos
  ocultos de atribuição OpenAI/Codex

O Azure OpenAI permanece no grupo de roteamento nativo para comportamento de transporte e compatibilidade,
mas não recebe os cabeçalhos ocultos de atribuição OpenAI/Codex.

Isso preserva o comportamento atual do OpenAI Responses nativo sem forçar
shims mais antigos compatíveis com OpenAI em backends `/v1` de terceiros.

### Compactação no servidor do OpenAI Responses

Para modelos diretos OpenAI Responses (`openai/*` usando `api: "openai-responses"` com
`baseUrl` em `api.openai.com`), o OpenClaw agora ativa automaticamente
dicas de payload de compactação no servidor da OpenAI:

- Força `store: true` (a menos que a compatibilidade do modelo defina `supportsStore: false`)
- Injeta `context_management: [{ type: "compaction", compact_threshold: ... }]`

Por padrão, `compact_threshold` é `70%` do `contextWindow` do modelo (ou `80000`
quando indisponível).

### Ativar explicitamente a compactação no servidor

Use isso quando quiser forçar a injeção de `context_management` em modelos
Responses compatíveis (por exemplo, Azure OpenAI Responses):

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Ativar com um limite personalizado

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Desativar a compactação no servidor

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` controla apenas a injeção de `context_management`.
Modelos diretos OpenAI Responses ainda forçam `store: true`, a menos que a compatibilidade defina
`supportsStore: false`.

## Observações

- Refs de modelo sempre usam `provider/model` (consulte [/concepts/models](/pt-BR/concepts/models)).
- Detalhes de autenticação + regras de reutilização estão em [/concepts/oauth](/pt-BR/concepts/oauth).
