---
read_when:
    - Trabalhando em recursos do canal Tlon/Urbit
summary: Status de suporte do Tlon/Urbit, recursos e configuração
title: Tlon
x-i18n:
    generated_at: "2026-04-05T12:36:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 289cffb3c1b2d450a5f41e0d67117dfb5c192cec956d82039caac9df9f07496d
    source_path: channels/tlon.md
    workflow: 15
---

# Tlon

Tlon é um mensageiro descentralizado baseado em Urbit. O OpenClaw se conecta à sua ship do Urbit e pode
responder a DMs e mensagens de chat em grupo. Respostas em grupo exigem uma menção com @ por padrão e podem
ser restringidas ainda mais por allowlists.

Status: plugin incluído. DMs, menções em grupo, respostas em thread, formatação de rich text e
uploads de imagem são compatíveis. Reações e enquetes ainda não são compatíveis.

## Plugin incluído

O Tlon é distribuído como um plugin incluído nas versões atuais do OpenClaw, então builds
empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma build mais antiga ou em uma instalação personalizada que exclui o Tlon, instale-o
manualmente:

Instalar via CLI (registro npm):

```bash
openclaw plugins install @openclaw/tlon
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detalhes: [Plugins](/tools/plugin)

## Configuração

1. Verifique se o plugin Tlon está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Reúna a URL da sua ship e o código de login.
3. Configure `channels.tlon`.
4. Reinicie o gateway.
5. Envie uma DM para o bot ou mencione-o em um canal de grupo.

Configuração mínima (conta única):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Ships privadas/LAN

Por padrão, o OpenClaw bloqueia nomes de host e intervalos de IP privados/internos para proteção contra SSRF.
Se sua ship estiver em execução em uma rede privada (localhost, IP de LAN ou nome de host interno),
você deve ativar isso explicitamente:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Isso se aplica a URLs como:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Ative isso apenas se você confiar na sua rede local. Essa configuração desativa as proteções contra SSRF
para solicitações à URL da sua ship.

## Canais de grupo

A descoberta automática é ativada por padrão. Você também pode fixar canais manualmente:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Desativar descoberta automática:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Controle de acesso

Allowlist de DM (vazia = nenhuma DM permitida, use `ownerShip` para o fluxo de aprovação):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Autorização de grupo (restrita por padrão):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## Sistema de proprietário e aprovação

Defina uma ship proprietária para receber solicitações de aprovação quando usuários não autorizados tentarem interagir:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

A ship proprietária é **automaticamente autorizada em todos os lugares** — convites de DM são aceitos automaticamente e
mensagens de canal são sempre permitidas. Você não precisa adicionar o proprietário a `dmAllowlist` nem a
`defaultAuthorizedShips`.

Quando definida, a ship proprietária recebe notificações por DM para:

- solicitações de DM de ships que não estão na allowlist
- menções em canais sem autorização
- solicitações de convite para grupos

## Configurações de aceitação automática

Aceitar automaticamente convites de DM (para ships em `dmAllowlist`):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Aceitar automaticamente convites para grupos:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Destinos de entrega (CLI/cron)

Use estes com `openclaw message send` ou entrega por cron:

- DM: `~sampel-palnet` ou `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` ou `group:~host-ship/channel`

## Skill incluída

O plugin Tlon inclui uma skill incluída ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
que fornece acesso por CLI a operações do Tlon:

- **Contatos**: obter/atualizar perfis, listar contatos
- **Canais**: listar, criar, publicar mensagens, buscar histórico
- **Grupos**: listar, criar, gerenciar membros
- **DMs**: enviar mensagens, reagir a mensagens
- **Reações**: adicionar/remover reações com emoji em posts e DMs
- **Configurações**: gerenciar permissões do plugin via comandos slash

A skill fica disponível automaticamente quando o plugin é instalado.

## Recursos

| Recurso          | Status                                  |
| ---------------- | --------------------------------------- |
| Mensagens diretas | ✅ Compatível                           |
| Grupos/canais    | ✅ Compatível (controlado por menção por padrão) |
| Threads          | ✅ Compatível (respostas automáticas na thread) |
| Rich text        | ✅ Markdown convertido para o formato Tlon |
| Imagens          | ✅ Enviadas para o armazenamento do Tlon |
| Reações          | ✅ Via [skill incluída](#bundled-skill) |
| Enquetes         | ❌ Ainda não compatível                 |
| Comandos nativos | ✅ Compatível (somente proprietário por padrão) |

## Solução de problemas

Execute primeiro esta sequência:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Falhas comuns:

- **DMs ignoradas**: remetente não está em `dmAllowlist` e `ownerShip` não está configurado para o fluxo de aprovação.
- **Mensagens de grupo ignoradas**: canal não foi descoberto ou o remetente não está autorizado.
- **Erros de conexão**: verifique se a URL da ship pode ser acessada; ative `allowPrivateNetwork` para ships locais.
- **Erros de autenticação**: verifique se o código de login está atual (os códigos são rotacionados).

## Referência de configuração

Configuração completa: [Configuration](/gateway/configuration)

Opções do provedor:

- `channels.tlon.enabled`: ativa/desativa a inicialização do canal.
- `channels.tlon.ship`: nome da ship Urbit do bot (por exemplo `~sampel-palnet`).
- `channels.tlon.url`: URL da ship (por exemplo `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: código de login da ship.
- `channels.tlon.allowPrivateNetwork`: permite URLs localhost/LAN (bypass de SSRF).
- `channels.tlon.ownerShip`: ship proprietária para o sistema de aprovação (sempre autorizada).
- `channels.tlon.dmAllowlist`: ships autorizadas a enviar DM (vazia = nenhuma).
- `channels.tlon.autoAcceptDmInvites`: aceita automaticamente DMs de ships na allowlist.
- `channels.tlon.autoAcceptGroupInvites`: aceita automaticamente todos os convites para grupos.
- `channels.tlon.autoDiscoverChannels`: descobre automaticamente canais de grupo (padrão: true).
- `channels.tlon.groupChannels`: nests de canal fixados manualmente.
- `channels.tlon.defaultAuthorizedShips`: ships autorizadas para todos os canais.
- `channels.tlon.authorization.channelRules`: regras de autenticação por canal.
- `channels.tlon.showModelSignature`: acrescenta o nome do modelo às mensagens.

## Observações

- Respostas em grupo exigem uma menção (por exemplo `~your-bot-ship`) para responder.
- Respostas em thread: se a mensagem recebida estiver em uma thread, o OpenClaw responde na thread.
- Rich text: a formatação Markdown (negrito, itálico, código, cabeçalhos, listas) é convertida para o formato nativo do Tlon.
- Imagens: URLs são enviadas ao armazenamento do Tlon e incorporadas como blocos de imagem.

## Relacionado

- [Visão geral dos canais](/channels) — todos os canais compatíveis
- [Pareamento](/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/gateway/security) — modelo de acesso e reforço de segurança
