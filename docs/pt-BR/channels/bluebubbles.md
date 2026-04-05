---
read_when:
    - Configurar o canal BlueBubbles
    - Solucionar problemas de emparelhamento por webhook
    - Configurar o iMessage no macOS
summary: iMessage via servidor macOS do BlueBubbles (envio/recebimento por REST, digitação, reações, emparelhamento, ações avançadas).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-05T12:35:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed8e59a165bdfb8fd794ee2ad6e4dacd44aa02d512312c5f2fd7d15f863380bb
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (REST no macOS)

Status: plugin incluído que se comunica com o servidor macOS do BlueBubbles por HTTP. **Recomendado para integração com iMessage** devido à sua API mais rica e à configuração mais simples em comparação com o canal imsg legado.

## Plugin incluído

As versões atuais do OpenClaw incluem o BlueBubbles, então compilações empacotadas normais não
precisam de uma etapa separada de `openclaw plugins install`.

## Visão geral

- É executado no macOS por meio do app auxiliar BlueBubbles ([bluebubbles.app](https://bluebubbles.app)).
- Recomendado/testado: macOS Sequoia (15). O macOS Tahoe (26) funciona; a edição está quebrada no momento no Tahoe, e atualizações de ícone de grupo podem reportar sucesso, mas não sincronizar.
- O OpenClaw se comunica com ele por meio de sua API REST (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Mensagens recebidas chegam via webhooks; respostas enviadas, indicadores de digitação, confirmações de leitura e tapbacks são chamadas REST.
- Anexos e stickers são ingeridos como mídia de entrada (e expostos ao agente quando possível).
- Emparelhamento/lista de permissões funciona da mesma forma que em outros canais (`/channels/pairing` etc.) com `channels.bluebubbles.allowFrom` + códigos de emparelhamento.
- Reações são expostas como eventos de sistema, assim como no Slack/Telegram, para que agentes possam "mencioná-las" antes de responder.
- Recursos avançados: editar, cancelar envio, encadeamento de respostas, efeitos de mensagem, gerenciamento de grupo.

## Início rápido

1. Instale o servidor BlueBubbles no seu Mac (siga as instruções em [bluebubbles.app/install](https://bluebubbles.app/install)).
2. Na configuração do BlueBubbles, habilite a API web e defina uma senha.
3. Execute `openclaw onboard` e selecione BlueBubbles, ou configure manualmente:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. Aponte os webhooks do BlueBubbles para o seu gateway (exemplo: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Inicie o gateway; ele registrará o manipulador de webhook e iniciará o emparelhamento.

Observação de segurança:

- Sempre defina uma senha para o webhook.
- A autenticação do webhook é sempre obrigatória. O OpenClaw rejeita solicitações de webhook do BlueBubbles, a menos que incluam uma senha/guid que corresponda a `channels.bluebubbles.password` (por exemplo `?password=<password>` ou `x-password`), independentemente da topologia de loopback/proxy.
- A autenticação por senha é verificada antes de ler/analisar corpos completos de webhook.

## Mantendo o Messages.app ativo (VM / configurações headless)

Algumas configurações de VM do macOS / sempre ligadas podem acabar com o Messages.app ficando “ocioso” (eventos de entrada param até que o app seja aberto/trazido para primeiro plano). Uma solução simples é **cutucar o Messages a cada 5 minutos** usando um AppleScript + LaunchAgent.

### 1) Salve o AppleScript

Salve isto como:

- `~/Scripts/poke-messages.scpt`

Exemplo de script (não interativo; não rouba o foco):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2) Instale um LaunchAgent

Salve isto como:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Observações:

- Isso é executado **a cada 300 segundos** e **ao iniciar sessão**.
- A primeira execução pode acionar prompts de **Automação** do macOS (`osascript` → Messages). Aprove-os na mesma sessão de usuário que executa o LaunchAgent.

Carregue-o:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

O BlueBubbles está disponível no onboarding interativo:

```
openclaw onboard
```

O assistente solicita:

- **URL do servidor** (obrigatório): endereço do servidor BlueBubbles (ex.: `http://192.168.1.100:1234`)
- **Senha** (obrigatório): senha da API nas configurações do servidor BlueBubbles
- **Caminho do webhook** (opcional): o padrão é `/bluebubbles-webhook`
- **Política de DM**: emparelhamento, lista de permissões, aberto ou desabilitado
- **Lista de permissões**: números de telefone, e-mails ou destinos de chat

Você também pode adicionar o BlueBubbles via CLI:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Controle de acesso (DMs + grupos)

DMs:

- Padrão: `channels.bluebubbles.dmPolicy = "pairing"`.
- Remetentes desconhecidos recebem um código de emparelhamento; as mensagens são ignoradas até serem aprovadas (os códigos expiram após 1 hora).
- Aprovar via:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Emparelhamento é a troca de token padrão. Detalhes: [Emparelhamento](/channels/pairing)

Grupos:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (padrão: `allowlist`).
- `channels.bluebubbles.groupAllowFrom` controla quem pode acionar em grupos quando `allowlist` está definido.

### Enriquecimento de nomes de contato (macOS, opcional)

Os webhooks de grupo do BlueBubbles frequentemente incluem apenas endereços brutos de participantes. Se você quiser que o contexto `GroupMembers` mostre nomes de contatos locais em vez disso, pode optar pelo enriquecimento com Contatos locais no macOS:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` habilita a consulta. Padrão: `false`.
- As consultas são executadas somente depois que o acesso ao grupo, a autorização de comando e o controle por menção permitirem a passagem da mensagem.
- Apenas participantes de telefone sem nome são enriquecidos.
- Números de telefone brutos permanecem como fallback quando nenhuma correspondência local é encontrada.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Controle por menção (grupos)

O BlueBubbles oferece suporte a controle por menção para chats em grupo, correspondendo ao comportamento do iMessage/WhatsApp:

- Usa `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`) para detectar menções.
- Quando `requireMention` está habilitado para um grupo, o agente só responde quando é mencionado.
- Comandos de controle de remetentes autorizados ignoram o controle por menção.

Configuração por grupo:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // padrão para todos os grupos
        "iMessage;-;chat123": { requireMention: false }, // substituição para grupo específico
      },
    },
  },
}
```

### Controle de comandos

- Comandos de controle (ex.: `/config`, `/model`) exigem autorização.
- Usa `allowFrom` e `groupAllowFrom` para determinar a autorização de comandos.
- Remetentes autorizados podem executar comandos de controle mesmo sem mencionar em grupos.

## Vínculos de conversa ACP

Chats do BlueBubbles podem ser transformados em workspaces ACP duráveis sem alterar a camada de transporte.

Fluxo rápido para operadores:

- Execute `/acp spawn codex --bind here` dentro da DM ou do chat em grupo permitido.
- Mensagens futuras nessa mesma conversa do BlueBubbles serão roteadas para a sessão ACP criada.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no local.
- `/acp close` fecha a sessão ACP e remove o vínculo.

Vínculos persistentes configurados também são compatíveis por meio de entradas `bindings[]` de nível superior com `type: "acp"` e `match.channel: "bluebubbles"`.

`match.peer.id` pode usar qualquer forma de destino BlueBubbles compatível:

- identificador de DM normalizado, como `+15555550123` ou `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Para vínculos estáveis de grupo, prefira `chat_id:*` ou `chat_identifier:*`.

Exemplo:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Consulte [Agentes ACP](/tools/acp-agents) para o comportamento compartilhado de vínculos ACP.

## Digitação + confirmações de leitura

- **Indicadores de digitação**: enviados automaticamente antes e durante a geração da resposta.
- **Confirmações de leitura**: controladas por `channels.bluebubbles.sendReadReceipts` (padrão: `true`).
- **Indicadores de digitação**: o OpenClaw envia eventos de início de digitação; o BlueBubbles limpa a digitação automaticamente no envio ou no tempo limite (parada manual via DELETE não é confiável).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // desabilitar confirmações de leitura
    },
  },
}
```

## Ações avançadas

O BlueBubbles oferece suporte a ações avançadas de mensagem quando habilitadas na configuração:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapbacks (padrão: true)
        edit: true, // editar mensagens enviadas (macOS 13+, quebrado no macOS 26 Tahoe)
        unsend: true, // cancelar envio de mensagens (macOS 13+)
        reply: true, // encadeamento de respostas por GUID da mensagem
        sendWithEffect: true, // efeitos de mensagem (slam, loud etc.)
        renameGroup: true, // renomear chats em grupo
        setGroupIcon: true, // definir ícone/foto do chat em grupo (instável no macOS 26 Tahoe)
        addParticipant: true, // adicionar participantes a grupos
        removeParticipant: true, // remover participantes de grupos
        leaveGroup: true, // sair de chats em grupo
        sendAttachment: true, // enviar anexos/mídia
      },
    },
  },
}
```

Ações disponíveis:

- **react**: adicionar/remover reações tapback (`messageId`, `emoji`, `remove`)
- **edit**: editar uma mensagem enviada (`messageId`, `text`)
- **unsend**: cancelar o envio de uma mensagem (`messageId`)
- **reply**: responder a uma mensagem específica (`messageId`, `text`, `to`)
- **sendWithEffect**: enviar com efeito do iMessage (`text`, `to`, `effectId`)
- **renameGroup**: renomear um chat em grupo (`chatGuid`, `displayName`)
- **setGroupIcon**: definir o ícone/foto de um chat em grupo (`chatGuid`, `media`) — instável no macOS 26 Tahoe (a API pode retornar sucesso, mas o ícone não sincroniza).
- **addParticipant**: adicionar alguém a um grupo (`chatGuid`, `address`)
- **removeParticipant**: remover alguém de um grupo (`chatGuid`, `address`)
- **leaveGroup**: sair de um chat em grupo (`chatGuid`)
- **upload-file**: enviar mídia/arquivos (`to`, `buffer`, `filename`, `asVoice`)
  - Memorandos de voz: defina `asVoice: true` com áudio **MP3** ou **CAF** para enviar como mensagem de voz do iMessage. O BlueBubbles converte MP3 → CAF ao enviar memorandos de voz.
- Alias legado: `sendAttachment` ainda funciona, mas `upload-file` é o nome canônico da ação.

### IDs de mensagem (curto vs completo)

O OpenClaw pode expor IDs de mensagem _curtos_ (ex.: `1`, `2`) para economizar tokens.

- `MessageSid` / `ReplyToId` podem ser IDs curtos.
- `MessageSidFull` / `ReplyToIdFull` contêm os IDs completos do provedor.
- IDs curtos ficam em memória; eles podem expirar após reinicialização ou remoção do cache.
- As ações aceitam `messageId` curto ou completo, mas IDs curtos gerarão erro se não estiverem mais disponíveis.

Use IDs completos para automações e armazenamento duráveis:

- Templates: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Contexto: `MessageSidFull` / `ReplyToIdFull` em payloads de entrada

Consulte [Configuração](/gateway/configuration) para variáveis de template.

## Streaming em blocos

Controle se as respostas são enviadas como uma única mensagem ou transmitidas em blocos:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // habilitar streaming em blocos (desativado por padrão)
    },
  },
}
```

## Mídia + limites

- Anexos recebidos são baixados e armazenados no cache de mídia.
- Limite de mídia via `channels.bluebubbles.mediaMaxMb` para mídia de entrada e saída (padrão: 8 MB).
- O texto de saída é dividido em partes conforme `channels.bluebubbles.textChunkLimit` (padrão: 4000 caracteres).

## Referência de configuração

Configuração completa: [Configuração](/gateway/configuration)

Opções do provedor:

- `channels.bluebubbles.enabled`: habilita/desabilita o canal.
- `channels.bluebubbles.serverUrl`: URL base da API REST do BlueBubbles.
- `channels.bluebubbles.password`: senha da API.
- `channels.bluebubbles.webhookPath`: caminho do endpoint de webhook (padrão: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: `pairing`).
- `channels.bluebubbles.allowFrom`: lista de permissões de DMs (identificadores, e-mails, números E.164, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (padrão: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: lista de permissões de remetentes de grupos.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: no macOS, enriquece opcionalmente participantes de grupo sem nome a partir dos Contatos locais depois que as regras de controle são atendidas. Padrão: `false`.
- `channels.bluebubbles.groups`: configuração por grupo (`requireMention` etc.).
- `channels.bluebubbles.sendReadReceipts`: envia confirmações de leitura (padrão: `true`).
- `channels.bluebubbles.blockStreaming`: habilita streaming em blocos (padrão: `false`; necessário para respostas com streaming).
- `channels.bluebubbles.textChunkLimit`: tamanho do bloco de saída em caracteres (padrão: 4000).
- `channels.bluebubbles.chunkMode`: `length` (padrão) divide apenas quando excede `textChunkLimit`; `newline` divide em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- `channels.bluebubbles.mediaMaxMb`: limite de mídia de entrada/saída em MB (padrão: 8).
- `channels.bluebubbles.mediaLocalRoots`: lista de permissões explícita de diretórios locais absolutos permitidos para caminhos de mídia local de saída. O envio por caminho local é negado por padrão, a menos que isso seja configurado. Substituição por conta: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: máximo de mensagens de grupo para contexto (0 desabilita).
- `channels.bluebubbles.dmHistoryLimit`: limite de histórico de DM.
- `channels.bluebubbles.actions`: habilita/desabilita ações específicas.
- `channels.bluebubbles.accounts`: configuração de múltiplas contas.

Opções globais relacionadas:

- `agents.list[].groupChat.mentionPatterns` (ou `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Endereçamento / destinos de entrega

Prefira `chat_guid` para roteamento estável:

- `chat_guid:iMessage;-;+15555550123` (preferido para grupos)
- `chat_id:123`
- `chat_identifier:...`
- Identificadores diretos: `+15555550123`, `user@example.com`
  - Se um identificador direto não tiver um chat de DM existente, o OpenClaw criará um via `POST /api/v1/chat/new`. Isso exige que a API privada do BlueBubbles esteja habilitada.

## Segurança

- Solicitações de webhook são autenticadas comparando parâmetros de consulta ou cabeçalhos `guid`/`password` com `channels.bluebubbles.password`.
- Mantenha a senha da API e o endpoint de webhook em segredo (trate-os como credenciais).
- Não há bypass de localhost para autenticação de webhook do BlueBubbles. Se você usar proxy para o tráfego de webhook, mantenha a senha do BlueBubbles na solicitação de ponta a ponta. `gateway.trustedProxies` não substitui `channels.bluebubbles.password` aqui. Consulte [Segurança do gateway](/gateway/security#reverse-proxy-configuration).
- Habilite HTTPS + regras de firewall no servidor BlueBubbles se for expô-lo fora da sua LAN.

## Solução de problemas

- Se eventos de digitação/leitura pararem de funcionar, verifique os logs de webhook do BlueBubbles e confirme se o caminho do gateway corresponde a `channels.bluebubbles.webhookPath`.
- Códigos de emparelhamento expiram após uma hora; use `openclaw pairing list bluebubbles` e `openclaw pairing approve bluebubbles <code>`.
- Reações exigem a API privada do BlueBubbles (`POST /api/v1/message/react`); verifique se a versão do servidor a expõe.
- Editar/cancelar envio exigem macOS 13+ e uma versão compatível do servidor BlueBubbles. No macOS 26 (Tahoe), editar está quebrado no momento devido a alterações na API privada.
- Atualizações de ícone de grupo podem ser instáveis no macOS 26 (Tahoe): a API pode retornar sucesso, mas o novo ícone não sincroniza.
- O OpenClaw oculta automaticamente ações sabidamente quebradas com base na versão do macOS do servidor BlueBubbles. Se editar ainda aparecer no macOS 26 (Tahoe), desabilite manualmente com `channels.bluebubbles.actions.edit=false`.
- Para informações de status/integridade: `openclaw status --all` ou `openclaw status --deep`.

Para referência geral do fluxo de trabalho de canais, consulte [Canais](/channels) e o guia de [Plugins](/tools/plugin).

## Relacionados

- [Visão geral dos canais](/channels) — todos os canais compatíveis
- [Emparelhamento](/channels/pairing) — autenticação de DM e fluxo de emparelhamento
- [Grupos](/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canal](/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/gateway/security) — modelo de acesso e fortalecimento
