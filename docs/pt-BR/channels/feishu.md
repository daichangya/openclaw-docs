---
read_when:
    - Você quer conectar um bot do Feishu/Lark
    - Você está configurando o canal Feishu
summary: Visão geral, recursos e configuração do bot Feishu
title: Feishu
x-i18n:
    generated_at: "2026-04-05T12:35:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e39b6dfe3a3aa4ebbdb992975e570e4f1b5e79f3b400a555fc373a0d1889952
    source_path: channels/feishu.md
    workflow: 15
---

# Bot do Feishu

Feishu (Lark) é uma plataforma de chat para equipes usada por empresas para mensagens e colaboração. Este plugin conecta o OpenClaw a um bot do Feishu/Lark usando a assinatura de eventos WebSocket da plataforma, para que as mensagens possam ser recebidas sem expor uma URL de webhook pública.

---

## Plugin empacotado

O Feishu já vem empacotado nas versões atuais do OpenClaw, então não é
necessária uma instalação separada do plugin.

Se você estiver usando uma build mais antiga ou uma instalação personalizada que não inclua o
Feishu empacotado, instale-o manualmente:

```bash
openclaw plugins install @openclaw/feishu
```

---

## Início rápido

Há duas maneiras de adicionar o canal Feishu:

### Método 1: onboarding (recomendado)

Se você acabou de instalar o OpenClaw, execute o onboarding:

```bash
openclaw onboard
```

O assistente guia você por:

1. Criar um app no Feishu e coletar credenciais
2. Configurar as credenciais do app no OpenClaw
3. Iniciar o gateway

✅ **Depois da configuração**, verifique o status do gateway:

- `openclaw gateway status`
- `openclaw logs --follow`

### Método 2: configuração pela CLI

Se você já concluiu a instalação inicial, adicione o canal pela CLI:

```bash
openclaw channels add
```

Escolha **Feishu** e depois informe o App ID e o App Secret.

✅ **Depois da configuração**, gerencie o gateway:

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## Etapa 1: criar um app do Feishu

### 1. Abra a Feishu Open Platform

Acesse [Feishu Open Platform](https://open.feishu.cn/app) e entre na sua conta.

Tenants do Lark (global) devem usar [https://open.larksuite.com/app](https://open.larksuite.com/app) e definir `domain: "lark"` na configuração do Feishu.

### 2. Crie um app

1. Clique em **Create enterprise app**
2. Preencha o nome e a descrição do app
3. Escolha um ícone para o app

![Create enterprise app](/images/feishu-step2-create-app.png)

### 3. Copie as credenciais

Em **Credentials & Basic Info**, copie:

- **App ID** (formato: `cli_xxx`)
- **App Secret**

❗ **Importante:** mantenha o App Secret privado.

![Get credentials](/images/feishu-step3-credentials.png)

### 4. Configure as permissões

Em **Permissions**, clique em **Batch import** e cole:

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:read",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

![Configure permissions](/images/feishu-step4-permissions.png)

### 5. Habilite a capacidade de bot

Em **App Capability** > **Bot**:

1. Habilite a capacidade de bot
2. Defina o nome do bot

![Enable bot capability](/images/feishu-step5-bot-capability.png)

### 6. Configure a assinatura de eventos

⚠️ **Importante:** antes de definir a assinatura de eventos, certifique-se de que:

1. Você já executou `openclaw channels add` para o Feishu
2. O gateway está em execução (`openclaw gateway status`)

Em **Event Subscription**:

1. Escolha **Use long connection to receive events** (WebSocket)
2. Adicione o evento: `im.message.receive_v1`
3. (Opcional) Para fluxos de trabalho de comentários do Drive, adicione também: `drive.notice.comment_add_v1`

⚠️ Se o gateway não estiver em execução, a configuração de conexão longa pode não ser salva.

![Configure event subscription](/images/feishu-step6-event-subscription.png)

### 7. Publique o app

1. Crie uma versão em **Version Management & Release**
2. Envie para revisão e publique
3. Aguarde a aprovação do administrador (apps corporativos normalmente são aprovados automaticamente)

---

## Etapa 2: configurar o OpenClaw

### Configurar com o assistente (recomendado)

```bash
openclaw channels add
```

Escolha **Feishu** e cole seu App ID e App Secret.

### Configurar pelo arquivo de configuração

Edite `~/.openclaw/openclaw.json`:

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Meu assistente de IA",
        },
      },
    },
  },
}
```

Se você usar `connectionMode: "webhook"`, defina `verificationToken` e `encryptKey`. O servidor de webhook do Feishu faz bind em `127.0.0.1` por padrão; defina `webhookHost` apenas se você realmente precisar de um endereço de bind diferente.

#### Verification Token e Encrypt Key (modo webhook)

Ao usar o modo webhook, defina `channels.feishu.verificationToken` e `channels.feishu.encryptKey` na sua configuração. Para obter esses valores:

1. Na Feishu Open Platform, abra seu app
2. Vá para **Development** → **Events & Callbacks** (开发配置 → 事件与回调)
3. Abra a aba **Encryption** (加密策略)
4. Copie **Verification Token** e **Encrypt Key**

A captura de tela abaixo mostra onde encontrar o **Verification Token**. O **Encrypt Key** está listado na mesma seção **Encryption**.

![Verification Token location](/images/feishu-verification-token.png)

### Configurar por variáveis de ambiente

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Domínio do Lark (global)

Se o seu tenant estiver no Lark (internacional), defina o domínio como `lark` (ou uma string de domínio completa). Você pode defini-lo em `channels.feishu.domain` ou por conta (`channels.feishu.accounts.<id>.domain`).

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

### Flags de otimização de cota

Você pode reduzir o uso da API do Feishu com duas flags opcionais:

- `typingIndicator` (padrão `true`): quando `false`, ignora chamadas de reação de digitação.
- `resolveSenderNames` (padrão `true`): quando `false`, ignora chamadas de busca de perfil do remetente.

Defina-as no nível superior ou por conta:

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          typingIndicator: true,
          resolveSenderNames: false,
        },
      },
    },
  },
}
```

---

## Etapa 3: iniciar e testar

### 1. Inicie o gateway

```bash
openclaw gateway
```

### 2. Envie uma mensagem de teste

No Feishu, encontre seu bot e envie uma mensagem.

### 3. Aprove o pareamento

Por padrão, o bot responde com um código de pareamento. Aprove-o:

```bash
openclaw pairing approve feishu <CODE>
```

Após a aprovação, você poderá conversar normalmente.

---

## Visão geral

- **Canal de bot do Feishu**: bot do Feishu gerenciado pelo gateway
- **Roteamento determinístico**: as respostas sempre retornam ao Feishu
- **Isolamento de sessão**: DMs compartilham uma sessão principal; grupos são isolados
- **Conexão WebSocket**: conexão longa via SDK do Feishu, sem necessidade de URL pública

---

## Controle de acesso

### Mensagens diretas

- **Padrão**: `dmPolicy: "pairing"` (usuários desconhecidos recebem um código de pareamento)
- **Aprovar pareamento**:

  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```

- **Modo allowlist**: defina `channels.feishu.allowFrom` com os Open IDs permitidos

### Chats em grupo

**1. Política de grupo** (`channels.feishu.groupPolicy`):

- `"open"` = permite todos nos grupos
- `"allowlist"` = permite apenas `groupAllowFrom`
- `"disabled"` = desabilita mensagens em grupo

Padrão: `allowlist`

**2. Exigência de menção** (`channels.feishu.requireMention`, substituível por `channels.feishu.groups.<chat_id>.requireMention`):

- `true` explícito = exigir @mention
- `false` explícito = responder sem menções
- quando não definido e `groupPolicy: "open"` = o padrão é `false`
- quando não definido e `groupPolicy` não é `"open"` = o padrão é `true`

---

## Exemplos de configuração de grupo

### Permitir todos os grupos, sem exigir @mention (padrão para grupos abertos)

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Permitir todos os grupos, mas ainda exigir @mention

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Permitir apenas grupos específicos

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Os IDs de grupo (chat_id) do Feishu se parecem com: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Restringir quais remetentes podem enviar mensagem em um grupo (allowlist de remetentes)

Além de permitir o próprio grupo, **todas as mensagens** nesse grupo são controladas pelo open_id do remetente: apenas usuários listados em `groups.<chat_id>.allowFrom` têm suas mensagens processadas; mensagens de outros membros são ignoradas (isso é um controle completo no nível do remetente, não apenas para comandos de controle como /reset ou /new).

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Os IDs de usuário (open_id) do Feishu se parecem com: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Obter IDs de grupo/usuário

### IDs de grupo (chat_id)

Os IDs de grupo se parecem com `oc_xxx`.

**Método 1 (recomendado)**

1. Inicie o gateway e mencione o bot com @ no grupo
2. Execute `openclaw logs --follow` e procure `chat_id`

**Método 2**

Use o depurador de API do Feishu para listar chats em grupo.

### IDs de usuário (open_id)

Os IDs de usuário se parecem com `ou_xxx`.

**Método 1 (recomendado)**

1. Inicie o gateway e envie uma DM para o bot
2. Execute `openclaw logs --follow` e procure `open_id`

**Método 2**

Verifique solicitações de pareamento para os Open IDs dos usuários:

```bash
openclaw pairing list feishu
```

---

## Comandos comuns

| Comando   | Descrição                  |
| --------- | -------------------------- |
| `/status` | Mostrar status do bot      |
| `/reset`  | Redefinir a sessão         |
| `/model`  | Mostrar/trocar modelo      |

> Observação: o Feishu ainda não oferece suporte a menus de comandos nativos, então os comandos devem ser enviados como texto.

## Comandos de gerenciamento do gateway

| Comando                    | Descrição                    |
| -------------------------- | ---------------------------- |
| `openclaw gateway status`  | Mostrar status do gateway    |
| `openclaw gateway install` | Instalar/iniciar serviço do gateway |
| `openclaw gateway stop`    | Parar serviço do gateway     |
| `openclaw gateway restart` | Reiniciar serviço do gateway |
| `openclaw logs --follow`   | Acompanhar logs do gateway   |

---

## Solução de problemas

### O bot não responde em chats de grupo

1. Certifique-se de que o bot foi adicionado ao grupo
2. Certifique-se de mencionar o bot com @ (comportamento padrão)
3. Verifique se `groupPolicy` não está definido como `"disabled"`
4. Verifique os logs: `openclaw logs --follow`

### O bot não recebe mensagens

1. Certifique-se de que o app foi publicado e aprovado
2. Certifique-se de que a assinatura de eventos inclui `im.message.receive_v1`
3. Certifique-se de que **long connection** está habilitada
4. Certifique-se de que as permissões do app estão completas
5. Certifique-se de que o gateway está em execução: `openclaw gateway status`
6. Verifique os logs: `openclaw logs --follow`

### Vazamento do App Secret

1. Redefina o App Secret na Feishu Open Platform
2. Atualize o App Secret na sua configuração
3. Reinicie o gateway

### Falhas no envio de mensagens

1. Certifique-se de que o app tem a permissão `im:message:send_as_bot`
2. Certifique-se de que o app foi publicado
3. Verifique os logs para ver erros detalhados

---

## Configuração avançada

### Múltiplas contas

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Bot principal",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Bot de backup",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` controla qual conta do Feishu é usada quando as APIs de saída não especificam um `accountId` explicitamente.

### Limites de mensagem

- `textChunkLimit`: tamanho do bloco de texto de saída (padrão: 2000 caracteres)
- `mediaMaxMb`: limite de upload/download de mídia (padrão: 30MB)

### Streaming

O Feishu oferece suporte a respostas em streaming por meio de cartões interativos. Quando habilitado, o bot atualiza um cartão à medida que gera texto.

```json5
{
  channels: {
    feishu: {
      streaming: true, // habilita saída em streaming por cartão (padrão true)
      blockStreaming: true, // habilita streaming em nível de bloco (padrão true)
    },
  },
}
```

Defina `streaming: false` para aguardar a resposta completa antes de enviar.

### Sessões ACP

O Feishu oferece suporte a ACP para:

- DMs
- conversas de tópico em grupo

O ACP no Feishu é orientado por comandos de texto. Não há menus nativos de comandos com barra, então use mensagens `/acp ...` diretamente na conversa.

#### Bindings persistentes de ACP

Use bindings ACP tipados no nível superior para fixar uma DM do Feishu ou uma conversa de tópico em uma sessão ACP persistente.

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Geração de ACP vinculada à thread a partir do chat

Em uma DM do Feishu ou conversa de tópico, você pode gerar e vincular uma sessão ACP no próprio lugar:

```text
/acp spawn codex --thread here
```

Observações:

- `--thread here` funciona para DMs e tópicos do Feishu.
- Mensagens subsequentes na DM/tópico vinculado são roteadas diretamente para essa sessão ACP.
- A v1 não tem como alvo chats em grupo genéricos sem tópico.

### Roteamento multiagente

Use `bindings` para rotear DMs ou grupos do Feishu para agentes diferentes.

```json5
{
  agents: {
    list: [
      { id: "main" },
      {
        id: "clawd-fan",
        workspace: "/home/user/clawd-fan",
        agentDir: "/home/user/.openclaw/agents/clawd-fan/agent",
      },
      {
        id: "clawd-xi",
        workspace: "/home/user/clawd-xi",
        agentDir: "/home/user/.openclaw/agents/clawd-xi/agent",
      },
    ],
  },
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "clawd-fan",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_yyy" },
      },
    },
    {
      agentId: "clawd-xi",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Campos de roteamento:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` ou `"group"`
- `match.peer.id`: Open ID do usuário (`ou_xxx`) ou ID do grupo (`oc_xxx`)

Consulte [Get group/user IDs](#get-groupuser-ids) para dicas de localização.

---

## Referência de configuração

Configuração completa: [Gateway configuration](/gateway/configuration)

Principais opções:

| Configuração                                     | Descrição                               | Padrão           |
| ------------------------------------------------ | --------------------------------------- | ---------------- |
| `channels.feishu.enabled`                        | Habilitar/desabilitar canal             | `true`           |
| `channels.feishu.domain`                         | Domínio da API (`feishu` ou `lark`)     | `feishu`         |
| `channels.feishu.connectionMode`                 | Modo de transporte de eventos           | `websocket`      |
| `channels.feishu.defaultAccount`                 | ID da conta padrão para roteamento de saída | `default`    |
| `channels.feishu.verificationToken`              | Obrigatório para modo webhook           | -                |
| `channels.feishu.encryptKey`                     | Obrigatório para modo webhook           | -                |
| `channels.feishu.webhookPath`                    | Caminho da rota do webhook              | `/feishu/events` |
| `channels.feishu.webhookHost`                    | Host de bind do webhook                 | `127.0.0.1`      |
| `channels.feishu.webhookPort`                    | Porta de bind do webhook                | `3000`           |
| `channels.feishu.accounts.<id>.appId`            | App ID                                  | -                |
| `channels.feishu.accounts.<id>.appSecret`        | App Secret                              | -                |
| `channels.feishu.accounts.<id>.domain`           | Substituição do domínio da API por conta | `feishu`        |
| `channels.feishu.dmPolicy`                       | Política de DM                          | `pairing`        |
| `channels.feishu.allowFrom`                      | Allowlist de DM (lista de `open_id`)    | -                |
| `channels.feishu.groupPolicy`                    | Política de grupo                       | `allowlist`      |
| `channels.feishu.groupAllowFrom`                 | Allowlist de grupos                     | -                |
| `channels.feishu.requireMention`                 | Exigir @mention por padrão              | condicional      |
| `channels.feishu.groups.<chat_id>.requireMention`| Substituição de exigir @mention por grupo | herdado       |
| `channels.feishu.groups.<chat_id>.enabled`       | Habilitar grupo                         | `true`           |
| `channels.feishu.textChunkLimit`                 | Tamanho do bloco de mensagem            | `2000`           |
| `channels.feishu.mediaMaxMb`                     | Limite de tamanho de mídia              | `30`             |
| `channels.feishu.streaming`                      | Habilitar saída em streaming por cartão | `true`           |
| `channels.feishu.blockStreaming`                 | Habilitar streaming em bloco            | `true`           |

---

## Referência de dmPolicy

| Valor         | Comportamento                                                  |
| ------------- | -------------------------------------------------------------- |
| `"pairing"`   | **Padrão.** Usuários desconhecidos recebem um código de pareamento; é necessário aprovar |
| `"allowlist"` | Apenas usuários em `allowFrom` podem conversar                 |
| `"open"`      | Permitir todos os usuários (requer `"*"` em `allowFrom`)       |
| `"disabled"`  | Desabilitar DMs                                                |

---

## Tipos de mensagem compatíveis

### Receber

- ✅ Texto
- ✅ Texto rico (post)
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ✅ Vídeo/mídia
- ✅ Figurinhas

### Enviar

- ✅ Texto
- ✅ Imagens
- ✅ Arquivos
- ✅ Áudio
- ✅ Vídeo/mídia
- ✅ Cartões interativos
- ⚠️ Texto rico (formatação estilo post e cartões, não recursos arbitrários de autoria do Feishu)

### Threads e respostas

- ✅ Respostas inline
- ✅ Respostas em topic-thread quando o Feishu expõe `reply_in_thread`
- ✅ Respostas com mídia permanecem cientes da thread ao responder a uma mensagem de thread/tópico

## Comentários do Drive

O Feishu pode acionar o agente quando alguém adiciona um comentário em um documento do Feishu Drive (Docs, Sheets,
etc.). O agente recebe o texto do comentário, o contexto do documento e a thread de comentários para poder
responder na thread ou fazer edições no documento.

Requisitos:

- Assine `drive.notice.comment_add_v1` nas configurações de assinatura de eventos do seu app Feishu
  (junto com o já existente `im.message.receive_v1`)
- A ferramenta Drive é habilitada por padrão; desabilite com `channels.feishu.tools.drive: false`

A ferramenta `feishu_drive` expõe estas ações de comentário:

| Ação                   | Descrição                             |
| ---------------------- | ------------------------------------- |
| `list_comments`        | Listar comentários em um documento    |
| `list_comment_replies` | Listar respostas em uma thread de comentário |
| `add_comment`          | Adicionar um novo comentário de nível superior |
| `reply_comment`        | Responder a uma thread de comentário existente |

Quando o agente processa um evento de comentário do Drive, ele recebe:

- o texto do comentário e o remetente
- metadados do documento (título, tipo, URL)
- o contexto da thread de comentários para respostas na thread

Após fazer edições no documento, o agente é orientado a usar `feishu_drive.reply_comment` para notificar o
comentarista e então emitir o token silencioso exato `NO_REPLY` / `no_reply` para
evitar envios duplicados.

## Superfície de ações em runtime

Atualmente, o Feishu expõe estas ações em runtime:

- `send`
- `read`
- `edit`
- `thread-reply`
- `pin`
- `list-pins`
- `unpin`
- `member-info`
- `channel-info`
- `channel-list`
- `react` e `reactions` quando reações estão habilitadas na configuração
- ações de comentário `feishu_drive`: `list_comments`, `list_comment_replies`, `add_comment`, `reply_comment`

## Relacionado

- [Channels Overview](/channels) — todos os canais compatíveis
- [Pairing](/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Groups](/channels/groups) — comportamento de chat em grupo e controle por menção
- [Channel Routing](/channels/channel-routing) — roteamento de sessão para mensagens
- [Security](/gateway/security) — modelo de acesso e hardening
