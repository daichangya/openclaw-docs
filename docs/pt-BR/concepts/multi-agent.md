---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Roteamento multiagente: agentes isolados, contas de canal e bindings'
title: Roteamento multiagente
x-i18n:
    generated_at: "2026-04-05T12:40:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e8bc48f229d01aa793ca4137e5a59f2a5ceb0ba65841710aaf69f53a672be60
    source_path: concepts/multi-agent.md
    workflow: 15
---

# Roteamento multiagente

Objetivo: múltiplos agentes _isolados_ (workspace + `agentDir` + sessões separados), além de múltiplas contas de canal (por exemplo, dois WhatsApps) em um único Gateway em execução. O tráfego de entrada é roteado para um agente por meio de bindings.

## O que é "um agente"?

Um **agente** é um cérebro totalmente delimitado com seu próprio:

- **Workspace** (arquivos, AGENTS.md/SOUL.md/USER.md, notas locais, regras de persona).
- **Diretório de estado** (`agentDir`) para perfis de autenticação, registro de modelos e configuração por agente.
- **Armazenamento de sessões** (histórico de chat + estado de roteamento) em `~/.openclaw/agents/<agentId>/sessions`.

Perfis de autenticação são **por agente**. Cada agente lê de seu próprio:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history` também é o caminho mais seguro de recordação entre sessões aqui: ele retorna
uma visão limitada e higienizada, não um despejo bruto de transcrição. A recordação do assistente remove
tags de thinking, scaffolding `<relevant-memories>`, payloads XML de chamada de ferramenta em texto simples
(incluindo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocos truncados de chamada de ferramenta),
scaffolding degradado de chamada de ferramenta, tokens de controle de modelo ASCII/full-width vazados
e XML malformado de chamada de ferramenta do MiniMax antes de redação/truncamento.

As credenciais do agente principal **não** são compartilhadas automaticamente. Nunca reutilize `agentDir`
entre agentes (isso causa colisões de autenticação/sessão). Se quiser compartilhar credenciais,
copie `auth-profiles.json` para o `agentDir` do outro agente.

Skills são carregadas a partir do workspace de cada agente mais raízes compartilhadas como
`~/.openclaw/skills` e então filtradas pela allowlist efetiva de Skills do agente quando
configurada. Use `agents.defaults.skills` para uma linha de base compartilhada e
`agents.list[].skills` para substituição por agente. Consulte
[Skills: por agente vs compartilhadas](/tools/skills#per-agent-vs-shared-skills) e
[Skills: allowlists de Skills de agente](/tools/skills#agent-skill-allowlists).

O Gateway pode hospedar **um agente** (padrão) ou **muitos agentes** lado a lado.

**Observação sobre workspace:** o workspace de cada agente é o **cwd padrão**, não um
sandbox rígido. Caminhos relativos são resolvidos dentro do workspace, mas caminhos absolutos podem
alcançar outros locais do host, a menos que o sandboxing esteja ativado. Consulte
[Sandboxing](/gateway/sandboxing).

## Caminhos (mapa rápido)

- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado: `~/.openclaw` (ou `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (ou `~/.openclaw/workspace-<agentId>`)
- Diretório do agente: `~/.openclaw/agents/<agentId>/agent` (ou `agents.list[].agentDir`)
- Sessões: `~/.openclaw/agents/<agentId>/sessions`

### Modo de agente único (padrão)

Se você não fizer nada, o OpenClaw executará um único agente:

- `agentId` usa **`main`** por padrão.
- As sessões usam chaves como `agent:main:<mainKey>`.
- O workspace usa `~/.openclaw/workspace` por padrão (ou `~/.openclaw/workspace-<profile>` quando `OPENCLAW_PROFILE` está definido).
- O estado usa `~/.openclaw/agents/main/agent` por padrão.

## Auxiliar de agente

Use o assistente de agente para adicionar um novo agente isolado:

```bash
openclaw agents add work
```

Depois adicione `bindings` (ou deixe o assistente fazer isso) para rotear mensagens de entrada.

Verifique com:

```bash
openclaw agents list --bindings
```

## Início rápido

<Steps>
  <Step title="Crie o workspace de cada agente">

Use o assistente ou crie workspaces manualmente:

```bash
openclaw agents add coding
openclaw agents add social
```

Cada agente recebe seu próprio workspace com `SOUL.md`, `AGENTS.md` e `USER.md` opcional, além de um `agentDir` dedicado e armazenamento de sessões em `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Crie contas de canal">

Crie uma conta por agente nos seus canais preferidos:

- Discord: um bot por agente, ative Message Content Intent, copie cada token.
- Telegram: um bot por agente via BotFather, copie cada token.
- WhatsApp: vincule cada número de telefone por conta.

```bash
openclaw channels login --channel whatsapp --account work
```

Consulte os guias de canal: [Discord](/channels/discord), [Telegram](/channels/telegram), [WhatsApp](/channels/whatsapp).

  </Step>

  <Step title="Adicione agentes, contas e bindings">

Adicione agentes em `agents.list`, contas de canal em `channels.<channel>.accounts` e conecte tudo com `bindings` (exemplos abaixo).

  </Step>

  <Step title="Reinicie e verifique">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Múltiplos agentes = múltiplas pessoas, múltiplas personalidades

Com **múltiplos agentes**, cada `agentId` se torna uma **persona totalmente isolada**:

- **Números de telefone/contas diferentes** (por `accountId` do canal).
- **Personalidades diferentes** (por arquivos do workspace do agente, como `AGENTS.md` e `SOUL.md`).
- **Autenticação + sessões separadas** (sem interferência entre si, a menos que explicitamente ativada).

Isso permite que **múltiplas pessoas** compartilhem um servidor Gateway, mantendo seus “cérebros” e dados de IA isolados.

## Pesquisa de memória QMD entre agentes

Se um agente deve pesquisar as transcrições de sessão QMD de outro agente, adicione
coleções extras em `agents.list[].memorySearch.qmd.extraCollections`.
Use `agents.defaults.memorySearch.qmd.extraCollections` apenas quando todo agente
deve herdar as mesmas coleções compartilhadas de transcrição.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

O caminho da coleção extra pode ser compartilhado entre agentes, mas o nome da coleção
permanece explícito quando o caminho está fora do workspace do agente. Caminhos dentro do
workspace permanecem limitados ao agente, para que cada agente mantenha seu próprio conjunto de pesquisa de transcrições.

## Um número de WhatsApp, múltiplas pessoas (divisão de DM)

Você pode rotear **DMs diferentes do WhatsApp** para agentes diferentes, permanecendo em **uma única conta do WhatsApp**. Faça a correspondência pelo E.164 do remetente (como `+15551234567`) com `peer.kind: "direct"`. As respostas ainda sairão do mesmo número de WhatsApp (sem identidade de remetente por agente).

Detalhe importante: chats diretos colapsam para a **chave de sessão principal** do agente, então o isolamento verdadeiro exige **um agente por pessoa**.

Exemplo:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

Observações:

- O controle de acesso de DM é **global por conta de WhatsApp** (pairing/allowlist), não por agente.
- Para grupos compartilhados, vincule o grupo a um agente ou use [Grupos de transmissão](/channels/broadcast-groups).

## Regras de roteamento (como mensagens escolhem um agente)

Bindings são **determinísticos** e **o mais específico vence**:

1. correspondência `peer` (id exato de DM/grupo/canal)
2. correspondência `parentPeer` (herança de thread)
3. `guildId + roles` (roteamento por função no Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. correspondência `accountId` para um canal
7. correspondência em nível de canal (`accountId: "*"`)
8. fallback para o agente padrão (`agents.list[].default`, caso contrário a primeira entrada da lista, padrão: `main`)

Se múltiplos bindings corresponderem no mesmo nível, o primeiro na ordem da configuração vence.
Se um binding definir múltiplos campos de correspondência (por exemplo `peer` + `guildId`), todos os campos especificados são exigidos (semântica `AND`).

Detalhe importante sobre escopo de conta:

- Um binding que omite `accountId` corresponde apenas à conta padrão.
- Use `accountId: "*"` para um fallback em todo o canal, abrangendo todas as contas.
- Se você depois adicionar o mesmo binding para o mesmo agente com um id de conta explícito, o OpenClaw atualiza o binding existente apenas de canal para escopo de conta em vez de duplicá-lo.

## Múltiplas contas / números de telefone

Canais que oferecem suporte a **múltiplas contas** (por exemplo, WhatsApp) usam `accountId` para identificar
cada login. Cada `accountId` pode ser roteado para um agente diferente, então um único servidor pode hospedar
múltiplos números de telefone sem misturar sessões.

Se você quiser uma conta padrão em todo o canal quando `accountId` for omitido, defina
`channels.<channel>.defaultAccount` (opcional). Quando não definido, o OpenClaw faz fallback
para `default` se presente; caso contrário, usa o primeiro id de conta configurado (ordenado).

Canais comuns que oferecem suporte a esse padrão incluem:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Conceitos

- `agentId`: um “cérebro” (workspace, autenticação por agente, armazenamento de sessão por agente).
- `accountId`: uma instância de conta de canal (por exemplo, conta de WhatsApp `"personal"` vs `"biz"`).
- `binding`: roteia mensagens de entrada para um `agentId` por `(channel, accountId, peer)` e opcionalmente ids de guild/team.
- Chats diretos colapsam para `agent:<agentId>:<mainKey>` (o “main” por agente; `session.mainKey`).

## Exemplos por plataforma

### Bots do Discord por agente

Cada conta de bot do Discord é mapeada para um `accountId` único. Vincule cada conta a um agente e mantenha allowlists por bot.

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

Observações:

- Convide cada bot para a guild e ative Message Content Intent.
- Os tokens ficam em `channels.discord.accounts.<id>.token` (a conta padrão pode usar `DISCORD_BOT_TOKEN`).

### Bots do Telegram por agente

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

Observações:

- Crie um bot por agente com o BotFather e copie cada token.
- Os tokens ficam em `channels.telegram.accounts.<id>.botToken` (a conta padrão pode usar `TELEGRAM_BOT_TOKEN`).

### Números de WhatsApp por agente

Vincule cada conta antes de iniciar o gateway:

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json` (JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // Deterministic routing: first match wins (most-specific first).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Optional per-peer override (example: send a specific group to work agent).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## Exemplo: chat diário no WhatsApp + trabalho profundo no Telegram

Divida por canal: roteie o WhatsApp para um agente rápido do dia a dia e o Telegram para um agente Opus.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

Observações:

- Se você tiver múltiplas contas para um canal, adicione `accountId` ao binding (por exemplo `{ channel: "whatsapp", accountId: "personal" }`).
- Para rotear uma única DM/grupo para Opus, mantendo o restante em chat, adicione um binding `match.peer` para esse peer; correspondências de peer sempre vencem regras amplas de canal.

## Exemplo: mesmo canal, um peer para Opus

Mantenha o WhatsApp no agente rápido, mas roteie uma DM para Opus:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

Bindings de peer sempre vencem, então mantenha-os acima da regra ampla do canal.

## Agente de família vinculado a um grupo do WhatsApp

Vincule um agente de família dedicado a um único grupo do WhatsApp, com controle por menção
e uma política de ferramentas mais restrita:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

Observações:

- Listas de allow/deny de ferramentas são **ferramentas**, não Skills. Se uma skill precisar executar um
  binário, verifique se `exec` está permitido e se o binário existe no sandbox.
- Para um controle mais rígido, defina `agents.list[].groupChat.mentionPatterns` e mantenha
  as allowlists de grupo ativadas para o canal.

## Configuração de sandbox e ferramentas por agente

Cada agente pode ter seu próprio sandbox e suas próprias restrições de ferramentas:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

Observação: `setupCommand` fica em `sandbox.docker` e é executado uma vez na criação do contêiner.
Substituições por agente em `sandbox.docker.*` são ignoradas quando o escopo resolvido é `"shared"`.

**Benefícios:**

- **Isolamento de segurança**: restrinja ferramentas para agentes não confiáveis
- **Controle de recursos**: aplique sandbox a agentes específicos, mantendo outros no host
- **Políticas flexíveis**: permissões diferentes por agente

Observação: `tools.elevated` é **global** e baseado em remetente; ele não é configurável por agente.
Se você precisar de limites por agente, use `agents.list[].tools` para negar `exec`.
Para direcionamento de grupo, use `agents.list[].groupChat.mentionPatterns` para que @mentions mapeiem claramente para o agente pretendido.

Consulte [Sandbox e ferramentas multiagente](/tools/multi-agent-sandbox-tools) para exemplos detalhados.

## Relacionado

- [Roteamento de canais](/channels/channel-routing) — como as mensagens são roteadas para agentes
- [Subagentes](/tools/subagents) — iniciar execuções de agente em segundo plano
- [Agentes ACP](/tools/acp-agents) — executar harnesses externos de programação
- [Presença](/concepts/presence) — presença e disponibilidade do agente
- [Sessão](/concepts/session) — isolamento e roteamento de sessão
