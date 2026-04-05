---
read_when:
    - Configurando o controle de acesso por DM
    - Pareando um novo nó iOS/Android
    - Revisando a postura de segurança do OpenClaw
summary: 'Visão geral do pareamento: aprove quem pode enviar DM para você + quais nós podem entrar'
title: Pareamento
x-i18n:
    generated_at: "2026-04-05T12:35:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bd99240b3530def23c05a26915d07cf8b730565c2822c6338437f8fb3f285c9
    source_path: channels/pairing.md
    workflow: 15
---

# Pareamento

“Pareamento” é a etapa explícita de **aprovação do proprietário** do OpenClaw.
Ela é usada em dois lugares:

1. **Pareamento de DM** (quem tem permissão para falar com o bot)
2. **Pareamento de nó** (quais dispositivos/nós têm permissão para entrar na rede do gateway)

Contexto de segurança: [Security](/gateway/security)

## 1) Pareamento de DM (acesso de chat de entrada)

Quando um canal é configurado com a política de DM `pairing`, remetentes desconhecidos recebem um código curto e a mensagem deles **não é processada** até que você a aprove.

As políticas padrão de DM estão documentadas em: [Security](/gateway/security)

Códigos de pareamento:

- 8 caracteres, em maiúsculas, sem caracteres ambíguos (`0O1I`).
- **Expiram após 1 hora**. O bot envia a mensagem de pareamento apenas quando uma nova solicitação é criada (aproximadamente uma vez por hora por remetente).
- As solicitações pendentes de pareamento de DM são limitadas a **3 por canal** por padrão; solicitações adicionais são ignoradas até que uma expire ou seja aprovada.

### Aprovar um remetente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Canais compatíveis: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Onde o estado fica

Armazenado em `~/.openclaw/credentials/`:

- Solicitações pendentes: `<channel>-pairing.json`
- Armazenamento da lista de permissões aprovada:
  - Conta padrão: `<channel>-allowFrom.json`
  - Conta não padrão: `<channel>-<accountId>-allowFrom.json`

Comportamento do escopo por conta:

- Contas não padrão leem/gravam apenas seu arquivo de lista de permissões com escopo.
- A conta padrão usa o arquivo de lista de permissões sem escopo, no escopo do canal.

Trate esses arquivos como sensíveis (eles controlam o acesso ao seu assistente).

Importante: esse armazenamento é para acesso por DM. A autorização de grupo é separada.
Aprovar um código de pareamento de DM não permite automaticamente que esse remetente execute comandos de grupo ou controle o bot em grupos. Para acesso em grupo, configure as listas de permissões explícitas do canal para grupos (por exemplo, `groupAllowFrom`, `groups` ou substituições por grupo/por tópico, dependendo do canal).

## 2) Pareamento de dispositivo de nó (nós iOS/Android/macOS/headless)

Os nós se conectam ao Gateway como **dispositivos** com `role: node`. O Gateway
cria uma solicitação de pareamento de dispositivo que precisa ser aprovada.

### Parear via Telegram (recomendado para iOS)

Se você usar o plugin `device-pair`, poderá fazer o pareamento inicial do dispositivo inteiramente pelo Telegram:

1. No Telegram, envie para o seu bot: `/pair`
2. O bot responde com duas mensagens: uma mensagem de instrução e uma mensagem separada com o **código de configuração** (fácil de copiar/colar no Telegram).
3. No seu telefone, abra o app OpenClaw para iOS → Configurações → Gateway.
4. Cole o código de configuração e conecte.
5. De volta ao Telegram: `/pair pending` (revise IDs de solicitação, função e escopos) e então aprove.

O código de configuração é uma carga JSON codificada em base64 que contém:

- `url`: a URL WebSocket do Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken`: um token de bootstrap temporário de dispositivo único usado para o handshake inicial de pareamento

Esse token de bootstrap carrega o perfil de bootstrap de pareamento integrado:

- o token `node` principal transferido continua com `scopes: []`
- qualquer token `operator` transferido continua limitado à lista de permissões de bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- as verificações de escopo de bootstrap usam prefixo por função, não um único conjunto plano de escopos:
  entradas de escopo de operador satisfazem apenas solicitações de operador, e funções que não são de operador
  ainda precisam solicitar escopos sob o próprio prefixo de função

Trate o código de configuração como uma senha enquanto ele for válido.

### Aprovar um dispositivo de nó

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Se o mesmo dispositivo tentar novamente com detalhes de autenticação diferentes (por exemplo,
função/escopos/chave pública diferentes), a solicitação pendente anterior será substituída e um novo
`requestId` será criado.

### Armazenamento do estado de pareamento de nó

Armazenado em `~/.openclaw/devices/`:

- `pending.json` (curta duração; solicitações pendentes expiram)
- `paired.json` (dispositivos pareados + tokens)

### Observações

- A API legada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) é um
  armazenamento de pareamento separado, de propriedade do gateway. Nós WS ainda exigem pareamento de dispositivo.
- O registro de pareamento é a fonte de verdade durável para funções aprovadas. Tokens ativos
  de dispositivo permanecem limitados a esse conjunto de funções aprovadas; uma entrada de token isolada
  fora das funções aprovadas não cria novo acesso.

## Documentação relacionada

- Modelo de segurança + injeção de prompt: [Security](/gateway/security)
- Atualização segura (execute doctor): [Updating](/install/updating)
- Configurações de canal:
  - Telegram: [Telegram](/channels/telegram)
  - WhatsApp: [WhatsApp](/channels/whatsapp)
  - Signal: [Signal](/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/channels/imessage)
  - Discord: [Discord](/channels/discord)
  - Slack: [Slack](/channels/slack)
