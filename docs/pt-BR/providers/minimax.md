---
read_when:
    - Você quer modelos MiniMax no OpenClaw
    - Você precisa de orientações de configuração do MiniMax
summary: Usar modelos MiniMax no OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-05T12:51:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 353e1d9ce1b48c90ccaba6cc0109e839c473ca3e65d0c5d8ba744e9011c2bf45
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

O provedor MiniMax do OpenClaw usa por padrão o **MiniMax M2.7**.

O MiniMax também oferece:

- síntese de fala empacotada via T2A v2
- entendimento de imagens empacotado via `MiniMax-VL-01`
- `web_search` empacotado por meio da API de busca MiniMax Coding Plan

Divisão de provedores:

- `minimax`: provedor de texto com chave de API, além de geração de imagens, entendimento de imagens, fala e busca na web empacotados
- `minimax-portal`: provedor de texto com OAuth, além de geração de imagens e entendimento de imagens empacotados

## Linha de modelos

- `MiniMax-M2.7`: modelo de raciocínio hospedado padrão.
- `MiniMax-M2.7-highspeed`: camada de raciocínio M2.7 mais rápida.
- `image-01`: modelo de geração de imagens (geração e edição image-to-image).

## Geração de imagens

O plugin MiniMax registra o modelo `image-01` para a ferramenta `image_generate`. Ele oferece suporte a:

- **Geração de texto para imagem** com controle de proporção.
- **Edição image-to-image** (referência de assunto) com controle de proporção.
- Até **9 imagens de saída** por solicitação.
- Até **1 imagem de referência** por solicitação de edição.
- Proporções compatíveis: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`.

Para usar o MiniMax na geração de imagens, defina-o como provedor de geração de imagens:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

O plugin usa a mesma `MINIMAX_API_KEY` ou auth OAuth dos modelos de texto. Nenhuma configuração adicional é necessária se o MiniMax já estiver configurado.

Tanto `minimax` quanto `minimax-portal` registram `image_generate` com o mesmo
modelo `image-01`. Configurações com chave de API usam `MINIMAX_API_KEY`; configurações com OAuth podem usar
o caminho de auth empacotado `minimax-portal`.

Quando o onboarding ou a configuração com chave de API grava entradas explícitas em `models.providers.minimax`,
o OpenClaw materializa `MiniMax-M2.7` e
`MiniMax-M2.7-highspeed` com `input: ["text", "image"]`.

O catálogo de texto empacotado interno do MiniMax em si permanece como metadados somente de texto até
que essa configuração explícita do provedor exista. O entendimento de imagens é exposto separadamente
por meio do provedor de mídia `MiniMax-VL-01`, que pertence ao plugin.

## Entendimento de imagens

O plugin MiniMax registra o entendimento de imagens separadamente do
catálogo de texto:

- `minimax`: modelo de imagem padrão `MiniMax-VL-01`
- `minimax-portal`: modelo de imagem padrão `MiniMax-VL-01`

É por isso que o roteamento automático de mídia pode usar o entendimento de imagens do MiniMax mesmo
quando o catálogo empacotado do provedor de texto ainda mostra refs de chat M2.7 somente de texto.

## Busca na web

O plugin MiniMax também registra `web_search` por meio da API de busca
MiniMax Coding Plan.

- ID do provedor: `minimax`
- Resultados estruturados: títulos, URLs, snippets, consultas relacionadas
- Variável de ambiente preferida: `MINIMAX_CODE_PLAN_KEY`
- Alias de ambiente aceito: `MINIMAX_CODING_API_KEY`
- Fallback de compatibilidade: `MINIMAX_API_KEY` quando ela já aponta para um token de coding-plan
- Reutilização de região: `plugins.entries.minimax.config.webSearch.region`, depois `MINIMAX_API_HOST`, depois URLs base do provedor MiniMax
- A busca permanece no ID do provedor `minimax`; a configuração OAuth CN/global ainda pode direcionar a região indiretamente por meio de `models.providers.minimax-portal.baseUrl`

A config fica em `plugins.entries.minimax.config.webSearch.*`.
Consulte [MiniMax Search](/tools/minimax-search).

## Escolha uma configuração

### MiniMax OAuth (Coding Plan) - recomendado

**Ideal para:** configuração rápida com MiniMax Coding Plan via OAuth, sem necessidade de chave de API.

Autentique-se com a opção explícita de OAuth regional:

```bash
openclaw onboard --auth-choice minimax-global-oauth
# ou
openclaw onboard --auth-choice minimax-cn-oauth
```

Mapeamento das opções:

- `minimax-global-oauth`: usuários internacionais (`api.minimax.io`)
- `minimax-cn-oauth`: usuários na China (`api.minimaxi.com`)

Consulte o README do pacote do plugin MiniMax no repositório do OpenClaw para detalhes.

### MiniMax M2.7 (chave de API)

**Ideal para:** MiniMax hospedado com API compatível com Anthropic.

Configure via CLI:

- Onboarding interativo:

```bash
openclaw onboard --auth-choice minimax-global-api
# ou
openclaw onboard --auth-choice minimax-cn-api
```

- `minimax-global-api`: usuários internacionais (`api.minimax.io`)
- `minimax-cn-api`: usuários na China (`api.minimaxi.com`)

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
          {
            id: "MiniMax-M2.7-highspeed",
            name: "MiniMax M2.7 Highspeed",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

No caminho de streaming compatível com Anthropic, o OpenClaw agora desativa o
thinking do MiniMax por padrão, a menos que você defina `thinking` explicitamente. O endpoint
de streaming do MiniMax emite `reasoning_content` em chunks delta no estilo OpenAI
em vez de blocos thinking nativos do Anthropic, o que pode vazar raciocínio interno
na saída visível se permanecer ativado implicitamente.

### MiniMax M2.7 como fallback (exemplo)

**Ideal para:** manter seu modelo mais forte e mais recente como primário e fazer failover para o MiniMax M2.7.
O exemplo abaixo usa Opus como primário concreto; troque pelo seu modelo primário de última geração preferido.

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "primary" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
    },
  },
}
```

## Configure via `openclaw configure`

Use o assistente interativo de configuração para definir o MiniMax sem editar JSON:

1. Execute `openclaw configure`.
2. Selecione **Model/auth**.
3. Escolha uma opção de auth do **MiniMax**.
4. Escolha seu modelo padrão quando solicitado.

Opções atuais de auth MiniMax no assistente/CLI:

- `minimax-global-oauth`
- `minimax-cn-oauth`
- `minimax-global-api`
- `minimax-cn-api`

## Opções de configuração

- `models.providers.minimax.baseUrl`: prefira `https://api.minimax.io/anthropic` (compatível com Anthropic); `https://api.minimax.io/v1` é opcional para payloads compatíveis com OpenAI.
- `models.providers.minimax.api`: prefira `anthropic-messages`; `openai-completions` é opcional para payloads compatíveis com OpenAI.
- `models.providers.minimax.apiKey`: chave de API do MiniMax (`MINIMAX_API_KEY`).
- `models.providers.minimax.models`: defina `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost`.
- `agents.defaults.models`: crie aliases para modelos que você quer na allowlist.
- `models.mode`: mantenha `merge` se quiser adicionar o MiniMax junto com os provedores integrados.

## Observações

- As refs de modelo seguem o caminho de auth:
  - Configuração com chave de API: `minimax/<model>`
  - Configuração com OAuth: `minimax-portal/<model>`
- Modelo de chat padrão: `MiniMax-M2.7`
- Modelo de chat alternativo: `MiniMax-M2.7-highspeed`
- Em `api: "anthropic-messages"`, o OpenClaw injeta
  `thinking: { type: "disabled" }` a menos que o thinking já esteja definido explicitamente em
  params/config.
- `/fast on` ou `params.fastMode: true` reescreve `MiniMax-M2.7` para
  `MiniMax-M2.7-highspeed` no caminho de stream compatível com Anthropic.
- Onboarding e configuração direta com chave de API gravam definições explícitas de modelo com
  `input: ["text", "image"]` para ambas as variantes M2.7
- O catálogo do provedor empacotado atualmente expõe as refs de chat como metadados
  somente de texto até que exista uma configuração explícita do provedor MiniMax
- API de uso do Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (exige uma chave de coding plan).
- O OpenClaw normaliza o uso de coding-plan do MiniMax para a mesma exibição de `% restante`
  usada por outros provedores. Os campos brutos `usage_percent` / `usagePercent` do MiniMax representam
  cota restante, não cota consumida, portanto o OpenClaw os inverte.
  Campos baseados em contagem têm prioridade quando presentes. Quando a API retorna `model_remains`,
  o OpenClaw prefere a entrada do modelo de chat, deriva o rótulo da janela de
  `start_time` / `end_time` quando necessário e inclui o nome do modelo selecionado
  no rótulo do plano para que janelas de coding-plan sejam mais fáceis de distinguir.
- Snapshots de uso tratam `minimax`, `minimax-cn` e `minimax-portal` como a
  mesma superfície de cota MiniMax, e preferem o OAuth MiniMax armazenado antes
  de recorrer às variáveis de ambiente da chave do Coding Plan.
- Atualize os valores de preço em `models.json` se precisar de rastreamento exato de custo.
- Link de indicação para MiniMax Coding Plan (10% de desconto): [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- Consulte [/concepts/model-providers](/pt-BR/concepts/model-providers) para as regras de provedores.
- Use `openclaw models list` para confirmar o ID atual do provedor e depois altere com
  `openclaw models set minimax/MiniMax-M2.7` ou
  `openclaw models set minimax-portal/MiniMax-M2.7`.

## Solução de problemas

### "Unknown model: minimax/MiniMax-M2.7"

Isso geralmente significa que o **provedor MiniMax não está configurado** (não há uma
entrada de provedor correspondente e nenhuma chave de ambiente/perfil de auth MiniMax correspondente foi encontrada). Uma correção para essa
detecção está em **2026.1.12**. Corrija fazendo o seguinte:

- Atualize para **2026.1.12** (ou execute a partir do código-fonte `main`) e depois reinicie o gateway.
- Execute `openclaw configure` e selecione uma opção de auth do **MiniMax**, ou
- Adicione manualmente o bloco correspondente `models.providers.minimax` ou
  `models.providers.minimax-portal`, ou
- Defina `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` ou um perfil de auth MiniMax
  para que o provedor correspondente possa ser injetado.

Certifique-se de que o ID do modelo diferencia **maiúsculas de minúsculas**:

- Caminho com chave de API: `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed`
- Caminho com OAuth: `minimax-portal/MiniMax-M2.7` ou
  `minimax-portal/MiniMax-M2.7-highspeed`

Depois verifique novamente com:

```bash
openclaw models list
```
