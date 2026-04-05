---
read_when:
    - Você quer usar modelos Anthropic no OpenClaw
    - Você quer reutilizar a autenticação de assinatura do Claude CLI no host do gateway
summary: Use o Anthropic Claude por meio de chaves de API ou Claude CLI no OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-05T12:50:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80f2b614eba4563093522e5157848fc54a16770a2fae69f17c54f1b9bfff624f
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

A Anthropic cria a família de modelos **Claude** e fornece acesso por meio de uma API.
No OpenClaw, novas configurações da Anthropic devem usar uma chave de API ou o
backend local do Claude CLI. Perfis legados existentes de token Anthropic ainda são respeitados em runtime
se já estiverem configurados.

<Warning>
A documentação pública do Claude Code da Anthropic documenta explicitamente o uso não interativo da CLI
como `claude -p`. Com base nessa documentação, acreditamos que o fallback local do Claude Code CLI,
gerenciado pelo usuário, provavelmente é permitido.

Separadamente, a Anthropic notificou os usuários do OpenClaw em **4 de abril de 2026 às 12:00 PM
PT / 8:00 PM BST** que o **OpenClaw conta como um third-party harness**. Sua
política declarada é que o tráfego de login do Claude conduzido pelo OpenClaw não usa mais o
pool de assinatura Claude incluído e, em vez disso, exige **Extra Usage**
(pagamento por uso, cobrado separadamente da assinatura).

Essa distinção de política é sobre a **reutilização do Claude CLI conduzida pelo OpenClaw**, não
sobre executar `claude` diretamente no seu próprio terminal. Ainda assim, a política da Anthropic sobre
third-party harnesses ainda deixa ambiguidade suficiente em torno
do uso com base em assinatura em produtos externos para que não recomendemos esse caminho
para produção.

A documentação pública atual da Anthropic:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)

- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

Se você quiser o caminho de cobrança mais claro, use uma chave de API da Anthropic.
O OpenClaw também oferece suporte a outras opções no estilo assinatura, incluindo [OpenAI
Codex](/providers/openai), [Qwen Cloud Coding Plan](/providers/qwen),
[MiniMax Coding Plan](/providers/minimax) e [Z.AI / GLM Coding
Plan](/providers/glm).
</Warning>

## Opção A: chave de API da Anthropic

**Melhor para:** acesso padrão à API e cobrança baseada em uso.
Crie sua chave de API no Anthropic Console.

### Configuração da CLI

```bash
openclaw onboard
# choose: Anthropic API key

# ou não interativo
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### Trecho de configuração do Claude CLI

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Padrões de thinking (Claude 4.6)

- Os modelos Anthropic Claude 4.6 usam `adaptive` thinking por padrão no OpenClaw quando nenhum nível explícito de thinking é definido.
- Você pode substituir isso por mensagem (`/think:<level>`) ou nos params do modelo:
  `agents.defaults.models["anthropic/<model>"].params.thinking`.
- Documentação relacionada da Anthropic:
  - [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
  - [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

## Modo rápido (API da Anthropic)

O alternador compartilhado `/fast` do OpenClaw também oferece suporte ao tráfego público direto da Anthropic, incluindo requisições autenticadas por chave de API e OAuth enviadas para `api.anthropic.com`.

- `/fast on` mapeia para `service_tier: "auto"`
- `/fast off` mapeia para `service_tier: "standard_only"`
- Padrão de configuração:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-6": {
          params: { fastMode: true },
        },
      },
    },
  },
}
```

Limites importantes:

- O OpenClaw só injeta service tiers da Anthropic para requisições diretas a `api.anthropic.com`. Se você rotear `anthropic/*` por um proxy ou gateway, `/fast` deixará `service_tier` inalterado.
- Os params explícitos de modelo `serviceTier` ou `service_tier` da Anthropic substituem o padrão de `/fast` quando ambos estão definidos.
- A Anthropic informa o tier efetivo na resposta em `usage.service_tier`. Em contas sem capacidade de Priority Tier, `service_tier: "auto"` ainda pode resultar em `standard`.

## Cache de prompt (API da Anthropic)

O OpenClaw oferece suporte ao recurso de cache de prompt da Anthropic. Isso é **somente API**; a autenticação legada por token Anthropic não respeita configurações de cache.

### Configuração

Use o parâmetro `cacheRetention` na configuração do seu modelo:

| Valor   | Duração do cache | Descrição              |
| ------- | -------------- | ------------------------ |
| `none`  | Sem cache     | Desabilita o cache   |
| `short` | 5 minutos      | Padrão para autenticação por API Key |
| `long`  | 1 hora         | Cache estendido           |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

### Padrões

Ao usar autenticação por Anthropic API Key, o OpenClaw aplica automaticamente `cacheRetention: "short"` (cache de 5 minutos) para todos os modelos Anthropic. Você pode substituir isso definindo explicitamente `cacheRetention` na sua configuração.

### Sobrescritas de `cacheRetention` por agente

Use params no nível do modelo como base e depois sobrescreva agentes específicos por meio de `agents.list[].params`.

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-opus-4-6" },
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" }, // base para a maioria dos agentes
        },
      },
    },
    list: [
      { id: "research", default: true },
      { id: "alerts", params: { cacheRetention: "none" } }, // sobrescrita apenas para este agente
    ],
  },
}
```

Ordem de merge da configuração para params relacionados a cache:

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params` (correspondendo a `id`, sobrescreve por chave)

Isso permite que um agente mantenha um cache de longa duração enquanto outro agente no mesmo modelo desabilita o cache para evitar custos de escrita em tráfego em rajadas/com baixa reutilização.

### Observações sobre Bedrock Claude

- Os modelos Anthropic Claude no Bedrock (`amazon-bedrock/*anthropic.claude*`) aceitam passthrough de `cacheRetention` quando configurados.
- Modelos Bedrock que não são Anthropic são forçados a `cacheRetention: "none"` em runtime.
- Os padrões inteligentes de Anthropic API Key também inicializam `cacheRetention: "short"` para refs de modelo Claude-on-Bedrock quando nenhum valor explícito é definido.

## Janela de contexto de 1M (beta da Anthropic)

A janela de contexto de 1M da Anthropic é controlada por beta. No OpenClaw, ative-a por modelo
com `params.context1m: true` para modelos Opus/Sonnet compatíveis.

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { context1m: true },
        },
      },
    },
  },
}
```

O OpenClaw mapeia isso para `anthropic-beta: context-1m-2025-08-07` em requisições da Anthropic.

Isso só é ativado quando `params.context1m` é explicitamente definido como `true` para
esse modelo.

Requisito: a Anthropic precisa permitir uso de contexto longo nessa credencial
(normalmente cobrança por chave de API ou o caminho de login Claude do OpenClaw / autenticação legada por token
com Extra Usage habilitado). Caso contrário, a Anthropic retorna:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

Observação: atualmente a Anthropic rejeita requisições beta `context-1m-*` ao usar
autenticação legada por token Anthropic (`sk-ant-oat-*`). Se você configurar
`context1m: true` com esse modo de autenticação legado, o OpenClaw registra um aviso e
recorre à janela de contexto padrão pulando o cabeçalho beta de context1m
enquanto mantém os betas OAuth exigidos.

## Opção B: Claude CLI como provider de mensagens

**Melhor para:** um host de gateway de usuário único que já tenha o Claude CLI instalado
e autenticado, como fallback local em vez do caminho de produção recomendado.

Observação sobre cobrança: acreditamos que o fallback do Claude Code CLI provavelmente é permitido para automação local,
gerenciada pelo usuário, com base na documentação pública da CLI da Anthropic. Ainda assim,
a política da Anthropic sobre third-party harnesses cria ambiguidade suficiente em torno
do uso com base em assinatura em produtos externos para que não o recomendemos para
produção. A Anthropic também informou aos usuários do OpenClaw que o uso do Claude
CLI **conduzido pelo OpenClaw** é tratado como tráfego de third-party harness e, desde **4 de abril de 2026
às 12:00 PM PT / 8:00 PM BST**, exige **Extra Usage** em vez dos
limites de assinatura Claude incluídos.

Esse caminho usa o binário local `claude` para inferência de modelo em vez de chamar
diretamente a API da Anthropic. O OpenClaw o trata como um **provider de backend CLI**
com refs de modelo como:

- `claude-cli/claude-sonnet-4-6`
- `claude-cli/claude-opus-4-6`

Como funciona:

1. O OpenClaw inicia `claude -p --output-format stream-json --include-partial-messages ...`
   no **host do gateway** e envia o prompt por stdin.
2. O primeiro turno envia `--session-id <uuid>`.
3. Turnos seguintes reutilizam a sessão Claude armazenada via `--resume <sessionId>`.
4. Suas mensagens de chat ainda passam pelo pipeline normal de mensagens do OpenClaw, mas
   a resposta real do modelo é produzida pelo Claude CLI.

### Requisitos

- Claude CLI instalado no host do gateway e disponível no PATH, ou configurado
  com um caminho absoluto para o comando.
- Claude CLI já autenticado nesse mesmo host:

```bash
claude auth status
```

- O OpenClaw carrega automaticamente o plugin Anthropic empacotado na inicialização do gateway quando sua
  configuração referencia explicitamente `claude-cli/...` ou configuração de backend `claude-cli`.

### Trecho de configuração

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "claude-cli/claude-sonnet-4-6",
      },
      models: {
        "claude-cli/claude-sonnet-4-6": {},
      },
      sandbox: { mode: "off" },
    },
  },
}
```

Se o binário `claude` não estiver no PATH do host do gateway:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

### O que você recebe

- Autenticação de assinatura Claude reutilizada a partir da CLI local (lida em runtime, não persistida)
- Roteamento normal de mensagens/sessão do OpenClaw
- Continuidade de sessão do Claude CLI entre turnos (invalidada em mudanças de autenticação)
- Ferramentas do Gateway expostas ao Claude CLI por meio de uma bridge MCP de loopback
- Streaming JSONL com progresso ao vivo de mensagens parciais

### Migrar da autenticação Anthropic para Claude CLI

Se você atualmente usa `anthropic/...` com um perfil legado de token ou chave de API e quer
mudar o mesmo host do gateway para Claude CLI, o OpenClaw oferece suporte a isso como um caminho normal
de migração de autenticação de provider.

Pré-requisitos:

- Claude CLI instalado no **mesmo host do gateway** que executa o OpenClaw
- Claude CLI já autenticado ali: `claude auth login`

Depois execute:

```bash
openclaw models auth login --provider anthropic --method cli --set-default
```

Ou, no onboarding:

```bash
openclaw onboard --auth-choice anthropic-cli
```

`openclaw onboard` e `openclaw configure` interativos agora priorizam primeiro **Anthropic
Claude CLI** e depois **Anthropic API key**.

O que isso faz:

- verifica se o Claude CLI já está autenticado no host do gateway
- muda o modelo padrão para `claude-cli/...`
- reescreve fallbacks do modelo padrão da Anthropic como `anthropic/claude-opus-4-6`
  para `claude-cli/claude-opus-4-6`
- adiciona entradas correspondentes `claude-cli/...` a `agents.defaults.models`

Verificação rápida:

```bash
openclaw models status
```

Você deve ver o modelo primário resolvido em `claude-cli/...`.

O que isso **não** faz:

- excluir seus perfis de autenticação Anthropic existentes
- remover toda referência antiga de configuração `anthropic/...` fora do caminho principal de
  modelo/allowlist padrão

Isso torna o rollback simples: altere o modelo padrão de volta para `anthropic/...` se
você precisar.

### Limites importantes

- Este **não** é o provider da API Anthropic. É o runtime local da CLI.
- O OpenClaw não injeta chamadas de ferramenta diretamente. O Claude CLI recebe ferramentas do gateway
  por meio de uma bridge MCP de loopback (`bundleMcp: true`, o padrão).
- O Claude CLI transmite respostas por JSONL (`stream-json` com
  `--include-partial-messages`). Prompts são enviados por stdin, não por argv.
- A autenticação é lida em runtime a partir de credenciais ativas do Claude CLI e não é persistida
  em perfis do OpenClaw. Prompts do keychain são suprimidos em contextos não interativos.
- A reutilização de sessão é rastreada por metadados `cliSessionBinding`. Quando o estado
  de login do Claude CLI muda (novo login, rotação de token), as sessões armazenadas são
  invalidadas e uma nova sessão é iniciada.
- Melhor para um host de gateway pessoal, não para configurações compartilhadas de cobrança multiusuário.

Mais detalhes: [/gateway/cli-backends](/pt-BR/gateway/cli-backends)

## Observações

- A documentação pública do Claude Code da Anthropic ainda documenta uso direto da CLI como
  `claude -p`. Acreditamos que o fallback local gerenciado pelo usuário provavelmente é permitido, mas
  o aviso separado da Anthropic aos usuários do OpenClaw diz que o caminho de login Claude do **OpenClaw**
  é uso de third-party harness e exige **Extra Usage**
  (pagamento por uso cobrado separadamente da assinatura). Para produção, nós
  recomendamos chaves de API da Anthropic.
- O setup-token da Anthropic está disponível novamente no OpenClaw como um caminho legado/manual. O aviso de cobrança específico da Anthropic para OpenClaw ainda se aplica, então use-o esperando que a Anthropic exija **Extra Usage** para esse caminho.
- Detalhes de autenticação + regras de reutilização estão em [/concepts/oauth](/pt-BR/concepts/oauth).

## Solução de problemas

**Erros 401 / token repentinamente inválido**

- A autenticação legada por token Anthropic pode expirar ou ser revogada.
- Para novas configurações, migre para uma chave de API da Anthropic ou para o caminho local do Claude CLI no host do gateway.

**Nenhuma chave de API encontrada para o provider "anthropic"**

- A autenticação é **por agente**. Novos agentes não herdam as chaves do agente principal.
- Execute o onboarding novamente para esse agente, ou configure uma chave de API no host do gateway
  e então verifique com `openclaw models status`.

**Nenhuma credencial encontrada para o perfil `anthropic:default`**

- Execute `openclaw models status` para ver qual perfil de autenticação está ativo.
- Execute o onboarding novamente, ou configure uma chave de API ou Claude CLI para esse caminho de perfil.

**Nenhum perfil de autenticação disponível (todos em cooldown/indisponíveis)**

- Verifique `openclaw models status --json` para `auth.unusableProfiles`.
- Cooldowns de limite de taxa da Anthropic podem ser específicos por modelo, então um modelo Anthropic relacionado
  ainda pode ser utilizável mesmo quando o atual estiver em cooldown.
- Adicione outro perfil Anthropic ou aguarde o cooldown.

Mais: [/gateway/troubleshooting](/pt-BR/gateway/troubleshooting) e [/help/faq](/help/faq).
