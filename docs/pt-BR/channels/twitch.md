---
read_when:
    - Configurando a integração do chat da Twitch para o OpenClaw
summary: Configuração e instalação do bot de chat da Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-05T12:36:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47af9fb6edb1f462c5919850ee9d05e500a1914ddd0d64a41608fbe960e77cd6
    source_path: channels/twitch.md
    workflow: 15
---

# Twitch

Suporte a chat da Twitch via conexão IRC. O OpenClaw se conecta como um usuário da Twitch (conta de bot) para receber e enviar mensagens em canais.

## Plugin incluído

A Twitch é distribuída como um plugin incluído nas versões atuais do OpenClaw, então compilações
empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclua a Twitch, instale
manualmente:

Instalar via CLI (registro npm):

```bash
openclaw plugins install @openclaw/twitch
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Detalhes: [Plugins](/tools/plugin)

## Configuração rápida (iniciante)

1. Verifique se o plugin da Twitch está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Crie uma conta dedicada da Twitch para o bot (ou use uma conta existente).
3. Gere credenciais: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Selecione **Bot Token**
   - Verifique se os escopos `chat:read` e `chat:write` estão selecionados
   - Copie o **Client ID** e o **Access Token**
4. Encontre seu ID de usuário da Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Configure o token:
   - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (apenas conta padrão)
   - Ou config: `channels.twitch.accessToken`
   - Se ambos estiverem definidos, a config terá precedência (o fallback por env é apenas para a conta padrão).
6. Inicie o gateway.

**⚠️ Importante:** Adicione controle de acesso (`allowFrom` ou `allowedRoles`) para impedir que usuários não autorizados acionem o bot. `requireMention` usa `true` por padrão.

Configuração mínima:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Conta Twitch do bot
      accessToken: "oauth:abc123...", // OAuth Access Token (ou use a variável de ambiente OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID do Token Generator
      channel: "vevisk", // Em qual chat de canal da Twitch entrar (obrigatório)
      allowFrom: ["123456789"], // (recomendado) Apenas seu ID de usuário da Twitch - obtenha em https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## O que é

- Um canal da Twitch pertencente ao Gateway.
- Roteamento determinístico: as respostas sempre voltam para a Twitch.
- Cada conta é mapeada para uma chave de sessão isolada `agent:<agentId>:twitch:<accountName>`.
- `username` é a conta do bot (quem autentica), `channel` é qual sala de chat deve ser acessada.

## Configuração (detalhada)

### Gerar credenciais

Use [Twitch Token Generator](https://twitchtokengenerator.com/):

- Selecione **Bot Token**
- Verifique se os escopos `chat:read` e `chat:write` estão selecionados
- Copie o **Client ID** e o **Access Token**

Não é necessário registrar manualmente um app. Os tokens expiram após várias horas.

### Configurar o bot

**Variável de ambiente (apenas conta padrão):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Ou config:**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

Se env e config estiverem definidos, a config terá precedência.

### Controle de acesso (recomendado)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recomendado) Apenas seu ID de usuário da Twitch
    },
  },
}
```

Prefira `allowFrom` para uma lista de permissões rígida. Use `allowedRoles` em vez disso se quiser acesso baseado em função.

**Funções disponíveis:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Por que IDs de usuário?** Nomes de usuário podem mudar, permitindo impersonação. IDs de usuário são permanentes.

Encontre seu ID de usuário da Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Converta seu nome de usuário da Twitch em ID)

## Renovação de token (opcional)

Tokens do [Twitch Token Generator](https://twitchtokengenerator.com/) não podem ser renovados automaticamente — gere novamente quando expirarem.

Para renovação automática de token, crie seu próprio aplicativo Twitch em [Twitch Developer Console](https://dev.twitch.tv/console) e adicione à config:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

O bot renova automaticamente os tokens antes do vencimento e registra eventos de renovação em log.

## Suporte a várias contas

Use `channels.twitch.accounts` com tokens por conta. Consulte [`gateway/configuration`](/gateway/configuration) para o padrão compartilhado.

Exemplo (uma conta de bot em dois canais):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**Observação:** Cada conta precisa do próprio token (um token por canal).

## Controle de acesso

### Restrições baseadas em função

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### Lista de permissões por ID de usuário (mais seguro)

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### Acesso baseado em função (alternativa)

`allowFrom` é uma lista de permissões rígida. Quando definido, apenas esses IDs de usuário são permitidos.
Se você quiser acesso baseado em função, deixe `allowFrom` sem definir e configure `allowedRoles` em vez disso:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### Desativar a exigência de @mention

Por padrão, `requireMention` é `true`. Para desativar e responder a todas as mensagens:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## Solução de problemas

Primeiro, execute os comandos de diagnóstico:

```bash
openclaw doctor
openclaw channels status --probe
```

### O bot não responde às mensagens

**Verifique o controle de acesso:** certifique-se de que seu ID de usuário esteja em `allowFrom` ou remova temporariamente
`allowFrom` e defina `allowedRoles: ["all"]` para testar.

**Verifique se o bot está no canal:** o bot deve entrar no canal especificado em `channel`.

### Problemas com token

**"Failed to connect" ou erros de autenticação:**

- Verifique se `accessToken` é o valor do token de acesso OAuth (normalmente começa com o prefixo `oauth:`)
- Verifique se o token tem os escopos `chat:read` e `chat:write`
- Se estiver usando renovação de token, verifique se `clientSecret` e `refreshToken` estão definidos

### A renovação de token não funciona

**Verifique os logs para eventos de renovação:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Se você vir "token refresh disabled (no refresh token)":

- Verifique se `clientSecret` foi fornecido
- Verifique se `refreshToken` foi fornecido

## Config

**Config da conta:**

- `username` - nome de usuário do bot
- `accessToken` - token de acesso OAuth com `chat:read` e `chat:write`
- `clientId` - Client ID da Twitch (do Token Generator ou do seu app)
- `channel` - canal ao qual entrar (obrigatório)
- `enabled` - ativa esta conta (padrão: `true`)
- `clientSecret` - opcional: para renovação automática de token
- `refreshToken` - opcional: para renovação automática de token
- `expiresIn` - vencimento do token em segundos
- `obtainmentTimestamp` - carimbo de data/hora de obtenção do token
- `allowFrom` - lista de permissões de IDs de usuário
- `allowedRoles` - controle de acesso baseado em função (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - exige @mention (padrão: `true`)

**Opções do provider:**

- `channels.twitch.enabled` - ativar/desativar a inicialização do canal
- `channels.twitch.username` - nome de usuário do bot (config simplificada de conta única)
- `channels.twitch.accessToken` - token de acesso OAuth (config simplificada de conta única)
- `channels.twitch.clientId` - Client ID da Twitch (config simplificada de conta única)
- `channels.twitch.channel` - canal ao qual entrar (config simplificada de conta única)
- `channels.twitch.accounts.<accountName>` - config de várias contas (todos os campos de conta acima)

Exemplo completo:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Ações da ferramenta

O agente pode chamar `twitch` com a ação:

- `send` - enviar uma mensagem para um canal

Exemplo:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Segurança e operações

- **Trate tokens como senhas** - nunca faça commit de tokens no git
- **Use renovação automática de token** para bots de longa duração
- **Use listas de permissões por ID de usuário** em vez de nomes de usuário para controle de acesso
- **Monitore os logs** para eventos de renovação de token e status de conexão
- **Use o escopo mínimo para tokens** - solicite apenas `chat:read` e `chat:write`
- **Se travar**: reinicie o gateway após confirmar que nenhum outro processo possui a sessão

## Limites

- **500 caracteres** por mensagem (divididos automaticamente em limites de palavras)
- Markdown é removido antes da divisão
- Sem limitação de taxa (usa os limites de taxa integrados da Twitch)

## Relacionado

- [Channels Overview](/channels) — todos os canais compatíveis
- [Pairing](/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Groups](/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Channel Routing](/channels/channel-routing) — roteamento de sessão para mensagens
- [Security](/gateway/security) — modelo de acesso e reforço de segurança
