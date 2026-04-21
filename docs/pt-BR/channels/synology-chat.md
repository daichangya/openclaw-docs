---
read_when:
    - Configurando o Synology Chat com o OpenClaw
    - Depurando o roteamento do Webhook do Synology Chat
summary: Configuração do Webhook do Synology Chat e configuração do OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-21T19:20:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7288e2aa873ee1a1f57861d839cfb44ff324e3d40a7f36da07c6ba43cbe1e6e6
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Status: plugin empacotado de canal de mensagem direta usando Webhooks do Synology Chat.
O plugin aceita mensagens de entrada de Webhooks de saída do Synology Chat e envia respostas
por meio de um Webhook de entrada do Synology Chat.

## Plugin empacotado

O Synology Chat é distribuído como um plugin empacotado nas versões atuais do OpenClaw, então compilações
empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui o Synology Chat,
instale-o manualmente:

Instalar a partir de um checkout local:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

1. Certifique-se de que o plugin do Synology Chat esteja disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente a partir de um checkout do código-fonte com o comando acima.
   - `openclaw onboard` agora mostra o Synology Chat na mesma lista de configuração de canais que `openclaw channels add`.
   - Configuração não interativa: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Nas integrações do Synology Chat:
   - Crie um Webhook de entrada e copie sua URL.
   - Crie um Webhook de saída com seu token secreto.
3. Aponte a URL do Webhook de saída para o seu Gateway do OpenClaw:
   - `https://gateway-host/webhook/synology` por padrão.
   - Ou seu `channels.synology-chat.webhookPath` personalizado.
4. Conclua a configuração no OpenClaw.
   - Guiado: `openclaw onboard`
   - Direto: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Reinicie o Gateway e envie uma DM para o bot do Synology Chat.

Detalhes de autenticação do Webhook:

- O OpenClaw aceita o token do Webhook de saída de `body.token`, depois
  `?token=...`, depois cabeçalhos.
- Formas de cabeçalho aceitas:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Tokens vazios ou ausentes falham de forma fechada.

Configuração mínima:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Variáveis de ambiente

Para a conta padrão, você pode usar variáveis de ambiente:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (separados por vírgula)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Os valores de configuração substituem as variáveis de ambiente.

## Política de DM e controle de acesso

- `dmPolicy: "allowlist"` é o padrão recomendado.
- `allowedUserIds` aceita uma lista (ou string separada por vírgulas) de IDs de usuário do Synology.
- No modo `allowlist`, uma lista `allowedUserIds` vazia é tratada como configuração incorreta e a rota do Webhook não será iniciada (use `dmPolicy: "open"` para permitir todos).
- `dmPolicy: "open"` permite qualquer remetente.
- `dmPolicy: "disabled"` bloqueia DMs.
- O vínculo do destinatário da resposta permanece no `user_id` numérico estável por padrão. `channels.synology-chat.dangerouslyAllowNameMatching: true` é um modo de compatibilidade emergencial que reativa a busca mutável por nome de usuário/apelido para entrega de respostas.
- As aprovações de pareamento funcionam com:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Entrega de saída

Use IDs numéricos de usuário do Synology Chat como destinos.

Exemplos:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Envios de mídia são suportados por entrega de arquivo baseada em URL.
URLs de arquivo de saída devem usar `http` ou `https`, e alvos de rede privados ou bloqueados de outra forma são rejeitados antes que o OpenClaw encaminhe a URL para o Webhook do NAS.

## Várias contas

Várias contas do Synology Chat são suportadas em `channels.synology-chat.accounts`.
Cada conta pode substituir token, URL de entrada, caminho do Webhook, política de DM e limites.
As sessões de mensagem direta são isoladas por conta e usuário, então o mesmo `user_id` numérico
em duas contas diferentes do Synology não compartilha o estado da transcrição.
Dê a cada conta habilitada um `webhookPath` distinto. O OpenClaw agora rejeita caminhos exatos duplicados
e se recusa a iniciar contas nomeadas que apenas herdam um caminho de Webhook compartilhado em configurações com várias contas.
Se você intencionalmente precisar de herança legada para uma conta nomeada, defina
`dangerouslyAllowInheritedWebhookPath: true` nessa conta ou em `channels.synology-chat`,
mas caminhos exatos duplicados ainda são rejeitados com falha fechada. Prefira caminhos explícitos por conta.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Observações de segurança

- Mantenha `token` em segredo e faça sua rotação se houver vazamento.
- Mantenha `allowInsecureSsl: false` a menos que você confie explicitamente em um certificado local autoassinado do NAS.
- Solicitações de Webhook de entrada são verificadas por token e limitadas por taxa por remetente.
- Verificações de token inválido usam comparação de segredos em tempo constante e falham de forma fechada.
- Prefira `dmPolicy: "allowlist"` em produção.
- Mantenha `dangerouslyAllowNameMatching` desativado, a menos que você precise explicitamente da entrega de respostas legada baseada em nome de usuário.
- Mantenha `dangerouslyAllowInheritedWebhookPath` desativado, a menos que você aceite explicitamente o risco de roteamento por caminho compartilhado em uma configuração com várias contas.

## Solução de problemas

- `Missing required fields (token, user_id, text)`:
  - a carga útil do Webhook de saída está sem um dos campos obrigatórios
  - se o Synology enviar o token em cabeçalhos, verifique se o Gateway/proxy preserva esses cabeçalhos
- `Invalid token`:
  - o segredo do Webhook de saída não corresponde a `channels.synology-chat.token`
  - a solicitação está atingindo a conta/caminho de Webhook errado
  - um proxy reverso removeu o cabeçalho do token antes de a solicitação chegar ao OpenClaw
- `Rate limit exceeded`:
  - muitas tentativas de token inválido da mesma origem podem bloquear temporariamente essa origem
  - remetentes autenticados também têm um limite de taxa separado de mensagens por usuário
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` está habilitado, mas nenhum usuário foi configurado
- `User not authorized`:
  - o `user_id` numérico do remetente não está em `allowedUserIds`

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais suportados
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
