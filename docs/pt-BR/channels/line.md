---
read_when:
    - Você quer conectar o OpenClaw ao LINE
    - Você precisa configurar webhook + credenciais do LINE
    - Você quer opções de mensagem específicas do LINE
summary: Configuração, opções e uso do plugin da API de Mensagens do LINE
title: LINE
x-i18n:
    generated_at: "2026-04-05T12:35:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4782b2aa3e8654505d7f1fd6fc112adf125b5010fc84d655d033688ded37414
    source_path: channels/line.md
    workflow: 15
---

# LINE

O LINE se conecta ao OpenClaw pela API de Mensagens do LINE. O plugin é executado como um receptor de webhook
no gateway e usa seu token de acesso do canal + segredo do canal para
autenticação.

Status: plugin incluído. Mensagens diretas, chats em grupo, mídia, localizações, mensagens Flex,
mensagens de modelo e respostas rápidas são compatíveis. Reações e threads
não são compatíveis.

## Plugin incluído

O LINE é distribuído como um plugin incluído nas versões atuais do OpenClaw, então compilações
empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclua LINE, instale-o
manualmente:

```bash
openclaw plugins install @openclaw/line
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Configuração inicial

1. Crie uma conta no LINE Developers e abra o Console:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Crie (ou escolha) um Provider e adicione um canal de **Messaging API**.
3. Copie o **Channel access token** e o **Channel secret** das configurações do canal.
4. Ative **Use webhook** nas configurações da Messaging API.
5. Defina a URL do webhook para o endpoint do seu gateway (HTTPS obrigatório):

```
https://gateway-host/line/webhook
```

O gateway responde à verificação de webhook do LINE (GET) e a eventos de entrada (POST).
Se você precisar de um caminho personalizado, defina `channels.line.webhookPath` ou
`channels.line.accounts.<id>.webhookPath` e atualize a URL adequadamente.

Observação de segurança:

- A verificação de assinatura do LINE depende do corpo da requisição (HMAC sobre o corpo bruto), então o OpenClaw aplica limites rígidos de corpo pré-autenticação e timeout antes da verificação.
- O OpenClaw processa eventos de webhook a partir dos bytes brutos da requisição verificada. Valores `req.body` transformados por middleware upstream são ignorados por segurança de integridade da assinatura.

## Configurar

Configuração mínima:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Variáveis de ambiente (apenas conta padrão):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Arquivos de token/segredo:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` e `secretFile` devem apontar para arquivos regulares. Links simbólicos são rejeitados.

Múltiplas contas:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Controle de acesso

Mensagens diretas usam pareamento por padrão. Remetentes desconhecidos recebem um código de pareamento e suas
mensagens são ignoradas até serem aprovadas.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Listas de permissões e políticas:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: IDs de usuário LINE permitidos para DMs
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: IDs de usuário LINE permitidos para grupos
- Substituições por grupo: `channels.line.groups.<groupId>.allowFrom`
- Observação de runtime: se `channels.line` estiver completamente ausente, o runtime volta para `groupPolicy="allowlist"` em verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

Os IDs do LINE diferenciam maiúsculas de minúsculas. IDs válidos têm esta aparência:

- Usuário: `U` + 32 caracteres hexadecimais
- Grupo: `C` + 32 caracteres hexadecimais
- Sala: `R` + 32 caracteres hexadecimais

## Comportamento das mensagens

- O texto é dividido em blocos de até 5000 caracteres.
- A formatação Markdown é removida; blocos de código e tabelas são convertidos em cartões Flex
  quando possível.
- Respostas em streaming são armazenadas em buffer; o LINE recebe blocos completos com uma animação
  de carregamento enquanto o agente trabalha.
- Downloads de mídia são limitados por `channels.line.mediaMaxMb` (padrão 10).

## Dados do canal (mensagens avançadas)

Use `channelData.line` para enviar respostas rápidas, localizações, cartões Flex ou mensagens
de modelo.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

O plugin do LINE também inclui um comando `/card` para predefinições de mensagens Flex:

```
/card info "Welcome" "Thanks for joining!"
```

## Suporte a ACP

O LINE oferece suporte a vínculos de conversa ACP (Agent Communication Protocol):

- `/acp spawn <agent> --bind here` vincula o chat atual do LINE a uma sessão ACP sem criar uma thread filha.
- Vínculos ACP configurados e sessões ACP ativas vinculadas à conversa funcionam no LINE como em outros canais de conversa.

Consulte [ACP agents](/tools/acp-agents) para mais detalhes.

## Mídia de saída

O plugin do LINE oferece suporte ao envio de imagens, vídeos e arquivos de áudio por meio da ferramenta de mensagem do agente. A mídia é enviada pelo caminho de entrega específico do LINE, com tratamento adequado de visualização e rastreamento:

- **Imagens**: enviadas como mensagens de imagem do LINE com geração automática de visualização.
- **Vídeos**: enviados com visualização explícita e tratamento de content-type.
- **Áudio**: enviado como mensagens de áudio do LINE.

Envios genéricos de mídia recorrem ao caminho existente apenas para imagens quando um caminho específico do LINE não está disponível.

## Solução de problemas

- **A verificação do webhook falha:** verifique se a URL do webhook usa HTTPS e se o
  `channelSecret` corresponde ao console do LINE.
- **Nenhum evento de entrada:** confirme se o caminho do webhook corresponde a `channels.line.webhookPath`
  e se o gateway pode ser acessado pelo LINE.
- **Erros de download de mídia:** aumente `channels.line.mediaMaxMb` se a mídia exceder o
  limite padrão.

## Relacionado

- [Channels Overview](/channels) — todos os canais compatíveis
- [Pairing](/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Groups](/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Channel Routing](/channels/channel-routing) — roteamento de sessão para mensagens
- [Security](/gateway/security) — modelo de acesso e reforço de segurança
