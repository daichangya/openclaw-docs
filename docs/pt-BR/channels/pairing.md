---
read_when:
    - Configurando o controle de acesso de DM
    - Pareando um novo node iOS/Android
    - Revisando a postura de segurança do OpenClaw
summary: 'Visão geral do pareamento: aprove quem pode enviar DM para você + quais nodes podem entrar'
title: Pareamento
x-i18n:
    generated_at: "2026-04-21T05:35:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4161629ead02dc0bdcd283cc125fe6579a579e03740127f4feb22dfe344bd028
    source_path: channels/pairing.md
    workflow: 15
---

# Pareamento

“Pareamento” é a etapa explícita de **aprovação do proprietário** no OpenClaw.
Ela é usada em dois lugares:

1. **Pareamento de DM** (quem tem permissão para falar com o bot)
2. **Pareamento de node** (quais dispositivos/nodes têm permissão para entrar na rede do gateway)

Contexto de segurança: [Security](/pt-BR/gateway/security)

## 1) Pareamento de DM (acesso de chat de entrada)

Quando um canal é configurado com a política de DM `pairing`, remetentes desconhecidos recebem um código curto e a mensagem deles **não é processada** até que você aprove.

As políticas de DM padrão estão documentadas em: [Security](/pt-BR/gateway/security)

Códigos de pareamento:

- 8 caracteres, maiúsculos, sem caracteres ambíguos (`0O1I`).
- **Expiram após 1 hora**. O bot só envia a mensagem de pareamento quando uma nova solicitação é criada (aproximadamente uma vez por hora por remetente).
- As solicitações pendentes de pareamento de DM têm limite padrão de **3 por canal**; solicitações adicionais são ignoradas até que uma expire ou seja aprovada.

### Aprovar um remetente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Canais compatíveis: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Onde o estado fica armazenado

Armazenado em `~/.openclaw/credentials/`:

- Solicitações pendentes: `<channel>-pairing.json`
- Armazenamento da allowlist aprovada:
  - Conta padrão: `<channel>-allowFrom.json`
  - Conta não padrão: `<channel>-<accountId>-allowFrom.json`

Comportamento do escopo por conta:

- Contas não padrão leem/escrevem apenas o arquivo de allowlist com escopo próprio.
- A conta padrão usa o arquivo de allowlist sem escopo específico do canal.

Trate esses arquivos como sensíveis (eles controlam o acesso ao seu assistente).

Importante: esse armazenamento é para acesso por DM. A autorização de grupos é separada.
Aprovar um código de pareamento de DM não permite automaticamente que esse remetente execute comandos em grupos nem controle o bot em grupos. Para acesso em grupos, configure as allowlists explícitas de grupo do canal (por exemplo `groupAllowFrom`, `groups` ou substituições por grupo/por tópico, dependendo do canal).

## 2) Pareamento de dispositivo de node (nodes iOS/Android/macOS/headless)

Nodes se conectam ao Gateway como **devices** com `role: node`. O Gateway
cria uma solicitação de pareamento de dispositivo que precisa ser aprovada.

### Parear via Telegram (recomendado para iOS)

Se você usar o Plugin `device-pair`, poderá fazer o pareamento inicial do dispositivo inteiramente pelo Telegram:

1. No Telegram, envie uma mensagem para seu bot: `/pair`
2. O bot responde com duas mensagens: uma mensagem de instrução e uma mensagem separada com o **código de configuração** (fácil de copiar/colar no Telegram).
3. No seu telefone, abra o app OpenClaw iOS → Settings → Gateway.
4. Cole o código de configuração e conecte-se.
5. De volta ao Telegram: `/pair pending` (revise os IDs de solicitação, role e scopes) e então aprove.

O código de configuração é uma carga JSON codificada em base64 que contém:

- `url`: a URL WebSocket do Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken`: um token bootstrap de dispositivo único e de curta duração usado para o handshake inicial de pareamento

Esse token bootstrap carrega o perfil bootstrap de pareamento integrado:

- o token `node` principal transferido permanece com `scopes: []`
- qualquer token `operator` transferido permanece limitado à allowlist bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- as verificações de escopo bootstrap são prefixadas por role, não um único conjunto plano de scopes:
  entradas de escopo de operator só atendem a solicitações de operator, e roles que não sejam operator
  ainda precisam solicitar scopes sob o próprio prefixo de role

Trate o código de configuração como uma senha enquanto ele for válido.

### Aprovar um dispositivo de node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Se o mesmo dispositivo tentar novamente com detalhes de autenticação diferentes (por exemplo, role/scopes/chave pública diferentes), a solicitação pendente anterior será substituída e um novo `requestId` será criado.

Importante: um dispositivo já pareado não recebe acesso mais amplo silenciosamente. Se ele se reconectar pedindo mais scopes ou uma role mais ampla, o OpenClaw mantém a aprovação existente como está e cria uma nova solicitação de upgrade pendente. Use `openclaw devices list` para comparar o acesso atualmente aprovado com o acesso recém-solicitado antes de aprovar.

### Armazenamento do estado de pareamento de node

Armazenado em `~/.openclaw/devices/`:

- `pending.json` (curta duração; solicitações pendentes expiram)
- `paired.json` (dispositivos pareados + tokens)

### Observações

- A API legada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) é um
  armazenamento de pareamento separado, pertencente ao gateway. Nodes WS ainda exigem pareamento de dispositivo.
- O registro de pareamento é a fonte de verdade durável para roles aprovadas. Tokens de
  dispositivo ativos permanecem limitados a esse conjunto de roles aprovado; uma entrada de token isolada
  fora das roles aprovadas não cria novo acesso.

## Documentação relacionada

- Modelo de segurança + injeção de prompt: [Security](/pt-BR/gateway/security)
- Atualizar com segurança (execute doctor): [Updating](/pt-BR/install/updating)
- Configurações de canais:
  - Telegram: [Telegram](/pt-BR/channels/telegram)
  - WhatsApp: [WhatsApp](/pt-BR/channels/whatsapp)
  - Signal: [Signal](/pt-BR/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/pt-BR/channels/bluebubbles)
  - iMessage (legado): [iMessage](/pt-BR/channels/imessage)
  - Discord: [Discord](/pt-BR/channels/discord)
  - Slack: [Slack](/pt-BR/channels/slack)
