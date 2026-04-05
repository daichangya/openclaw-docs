---
read_when:
    - Configurando suporte ao iMessage
    - Depurando envio/recebimento no iMessage
summary: Suporte legado ao iMessage via imsg (JSON-RPC sobre stdio). Novas configurações devem usar BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-05T12:35:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 086d85bead49f75d12ae6b14ac917af52375b6afd28f6af1a0dcbbc7fcb628a0
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (legado: imsg)

<Warning>
Para novas implantações de iMessage, use <a href="/channels/bluebubbles">BlueBubbles</a>.

A integração `imsg` é legada e pode ser removida em uma versão futura.
</Warning>

Status: integração legada de CLI externa. O gateway inicia `imsg rpc` e se comunica por JSON-RPC em stdio (sem daemon/porta separado).

<CardGroup cols={3}>
  <Card title="BlueBubbles (recommended)" icon="message-circle" href="/channels/bluebubbles">
    Caminho preferido de iMessage para novas configurações.
  </Card>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    As DMs do iMessage usam o modo de pairing por padrão.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/gateway/configuration-reference#imessage">
    Referência completa dos campos de iMessage.
  </Card>
</CardGroup>

## Configuração rápida

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configure OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/<you>/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        As solicitações de pairing expiram após 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    O OpenClaw exige apenas um `cliPath` compatível com stdio, então você pode apontar `cliPath` para um script wrapper que faz SSH para um Mac remoto e executa `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Configuração recomendada quando anexos estão habilitados:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Se `remoteHost` não estiver definido, o OpenClaw tentará detectá-lo automaticamente ao analisar o script wrapper de SSH.
    `remoteHost` deve ser `host` ou `user@host` (sem espaços nem opções de SSH).
    O OpenClaw usa verificação estrita de chave do host para SCP, então a chave do host de retransmissão já deve existir em `~/.ssh/known_hosts`.
    Os caminhos de anexos são validados em relação às raízes permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisitos e permissões (macOS)

- O Messages deve estar autenticado no Mac que executa `imsg`.
- Full Disk Access é necessário para o contexto do processo que executa OpenClaw/`imsg` (acesso ao banco de dados do Messages).
- A permissão de Automation é necessária para enviar mensagens pelo Messages.app.

<Tip>
As permissões são concedidas por contexto de processo. Se o gateway for executado sem interface (LaunchAgent/SSH), execute um comando interativo único nesse mesmo contexto para acionar os prompts:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Controle de acesso e roteamento

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` controla mensagens diretas:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    Campo de lista de permissões: `channels.imessage.allowFrom`.

    As entradas da lista de permissões podem ser handles ou destinos de conversa (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` controla o tratamento de grupos:

    - `allowlist` (padrão quando configurado)
    - `open`
    - `disabled`

    Lista de permissões de remetentes do grupo: `channels.imessage.groupAllowFrom`.

    Fallback em tempo de execução: se `groupAllowFrom` não estiver definido, as verificações de remetente de grupo do iMessage usam `allowFrom` como fallback quando disponível.
    Observação de tempo de execução: se `channels.imessage` estiver completamente ausente, o tempo de execução usa `groupPolicy="allowlist"` como fallback e registra um aviso (mesmo que `channels.defaults.groupPolicy` esteja definido).

    Controle por menção para grupos:

    - o iMessage não tem metadados nativos de menção
    - a detecção de menção usa padrões regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - sem padrões configurados, o controle por menção não pode ser aplicado

    Comandos de controle de remetentes autorizados podem ignorar o controle por menção em grupos.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DMs usam roteamento direto; grupos usam roteamento de grupo.
    - Com o padrão `session.dmScope=main`, as DMs do iMessage são consolidadas na sessão principal do agente.
    - As sessões de grupo são isoladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - As respostas são roteadas de volta para o iMessage usando os metadados de canal/destino de origem.

    Comportamento de thread semelhante a grupo:

    Algumas threads do iMessage com vários participantes podem chegar com `is_group=false`.
    Se esse `chat_id` estiver explicitamente configurado em `channels.imessage.groups`, o OpenClaw tratará isso como tráfego de grupo (controle de grupo + isolamento de sessão de grupo).

  </Tab>
</Tabs>

## Bindings de conversa ACP

Conversas legadas do iMessage também podem ser vinculadas a sessões ACP.

Fluxo rápido para operadores:

- Execute `/acp spawn codex --bind here` dentro da DM ou da conversa em grupo permitida.
- Mensagens futuras nessa mesma conversa do iMessage serão roteadas para a sessão ACP criada.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no local.
- `/acp close` fecha a sessão ACP e remove o binding.

Bindings persistentes configurados são compatíveis por meio de entradas `bindings[]` de nível superior com `type: "acp"` e `match.channel: "imessage"`.

`match.peer.id` pode usar:

- handle de DM normalizado, como `+15555550123` ou `user@example.com`
- `chat_id:<id>` (recomendado para bindings de grupo estáveis)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

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
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Consulte [ACP Agents](/tools/acp-agents) para o comportamento compartilhado de bindings ACP.

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Use um Apple ID dedicado e um usuário dedicado do macOS para que o tráfego do bot fique isolado do seu perfil pessoal do Messages.

    Fluxo típico:

    1. Crie/faça login em um usuário dedicado do macOS.
    2. Entre no Messages com o Apple ID do bot nesse usuário.
    3. Instale `imsg` nesse usuário.
    4. Crie um wrapper SSH para que o OpenClaw possa executar `imsg` no contexto desse usuário.
    5. Aponte `channels.imessage.accounts.<id>.cliPath` e `.dbPath` para o perfil desse usuário.

    A primeira execução pode exigir aprovações na interface gráfica (Automation + Full Disk Access) nessa sessão do usuário do bot.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Topologia comum:

    - o gateway é executado em Linux/VM
    - iMessage + `imsg` é executado em um Mac na sua tailnet
    - o wrapper `cliPath` usa SSH para executar `imsg`
    - `remoteHost` habilita buscas de anexos por SCP

    Exemplo:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    Use chaves SSH para que tanto SSH quanto SCP sejam não interativos.
    Garanta primeiro que a chave do host seja confiável (por exemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` seja preenchido.

  </Accordion>

  <Accordion title="Multi-account pattern">
    O iMessage oferece suporte a configuração por conta em `channels.imessage.accounts`.

    Cada conta pode substituir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, configurações de histórico e listas de permissões de raízes de anexos.

  </Accordion>
</AccordionGroup>

## Mídia, fragmentação e destinos de entrega

<AccordionGroup>
  <Accordion title="Attachments and media">
    - a ingestão de anexos recebidos é opcional: `channels.imessage.includeAttachments`
    - caminhos de anexos remotos podem ser buscados via SCP quando `remoteHost` estiver definido
    - os caminhos dos anexos devem corresponder às raízes permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - padrão de raiz padrão: `/Users/*/Library/Messages/Attachments`
    - o SCP usa verificação estrita de chave do host (`StrictHostKeyChecking=yes`)
    - o tamanho de mídia de saída usa `channels.imessage.mediaMaxMb` (padrão de 16 MB)
  </Accordion>

  <Accordion title="Outbound chunking">
    - limite de fragmento de texto: `channels.imessage.textChunkLimit` (padrão 4000)
    - modo de fragmentação: `channels.imessage.chunkMode`
      - `length` (padrão)
      - `newline` (divisão priorizando parágrafos)
  </Accordion>

  <Accordion title="Addressing formats">
    Destinos explícitos preferidos:

    - `chat_id:123` (recomendado para roteamento estável)
    - `chat_guid:...`
    - `chat_identifier:...`

    Destinos por handle também são compatíveis:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Gravações de configuração

O iMessage permite gravações de configuração iniciadas pelo canal por padrão (para `/config set|unset` quando `commands.config: true`).

Desative:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Valide o binário e o suporte a RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Se a sondagem informar que RPC não é compatível, atualize `imsg`.

  </Accordion>

  <Accordion title="DMs are ignored">
    Verifique:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprovações de pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    Verifique:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamento da lista de permissões de `channels.imessage.groups`
    - configuração de padrões de menção (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    Verifique:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticação por chave SSH/SCP a partir do host do gateway
    - a chave do host existe em `~/.ssh/known_hosts` no host do gateway
    - legibilidade do caminho remoto no Mac que executa Messages

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Execute novamente em um terminal interativo com interface gráfica no mesmo contexto de usuário/sessão e aprove os prompts:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Confirme que Full Disk Access + Automation foram concedidos ao contexto do processo que executa OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Ponteiros para a referência de configuração

- [Configuration reference - iMessage](/gateway/configuration-reference#imessage)
- [Gateway configuration](/gateway/configuration)
- [Pairing](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)

## Relacionado

- [Channels Overview](/channels) — todos os canais compatíveis
- [Pairing](/channels/pairing) — autenticação de DM e fluxo de pairing
- [Groups](/channels/groups) — comportamento de conversa em grupo e controle por menção
- [Channel Routing](/channels/channel-routing) — roteamento de sessão para mensagens
- [Security](/gateway/security) — modelo de acesso e endurecimento
