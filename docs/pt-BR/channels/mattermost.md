---
read_when:
    - Configurando o Mattermost
    - Depurando o roteamento do Mattermost
summary: Configuração do bot Mattermost e configuração do OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-05T12:36:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: f21dc7543176fda0b38b00fab60f0daae38dffcf68fa1cf7930a9f14ec57cb5a
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Status: plugin empacotado (token de bot + eventos WebSocket). Canais, grupos e DMs são compatíveis.
Mattermost é uma plataforma de mensagens em equipe que pode ser hospedada por você; consulte o site oficial em
[mattermost.com](https://mattermost.com) para detalhes do produto e downloads.

## Plugin empacotado

O Mattermost é distribuído como um plugin empacotado nas versões atuais do OpenClaw, então builds
empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma build mais antiga ou em uma instalação personalizada que exclua o Mattermost,
instale-o manualmente:

Instalar via CLI (registro npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Detalhes: [Plugins](/tools/plugin)

## Configuração rápida

1. Verifique se o plugin Mattermost está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Crie uma conta de bot no Mattermost e copie o **token do bot**.
3. Copie a **URL base** do Mattermost (por exemplo, `https://chat.example.com`).
4. Configure o OpenClaw e inicie o gateway.

Configuração mínima:

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
    },
  },
}
```

## Comandos slash nativos

Os comandos slash nativos são opt-in. Quando ativados, o OpenClaw registra comandos slash `oc_*` via
a API do Mattermost e recebe callbacks POST no servidor HTTP do gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use quando o Mattermost não puder alcançar o gateway diretamente (proxy reverso/URL pública).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Observações:

- `native: "auto"` vem desativado por padrão para Mattermost. Defina `native: true` para ativar.
- Se `callbackUrl` for omitido, o OpenClaw deriva um valor a partir de host/porta do gateway + `callbackPath`.
- Em configurações com várias contas, `commands` pode ser definido no nível superior ou em
  `channels.mattermost.accounts.<id>.commands` (os valores da conta substituem os campos do nível superior).
- Os callbacks de comando são validados com os tokens por comando retornados pelo
  Mattermost quando o OpenClaw registra comandos `oc_*`.
- Os callbacks slash falham de forma segura quando o registro falhou, a inicialização foi parcial ou
  o token de callback não corresponde a um dos comandos registrados.
- Requisito de alcance: o endpoint de callback precisa estar acessível a partir do servidor Mattermost.
  - Não defina `callbackUrl` como `localhost` a menos que o Mattermost seja executado no mesmo host/namespace de rede que o OpenClaw.
  - Não defina `callbackUrl` como sua URL base do Mattermost a menos que essa URL faça proxy reverso de `/api/channels/mattermost/command` para o OpenClaw.
  - Uma verificação rápida é `curl https://<gateway-host>/api/channels/mattermost/command`; um GET deve retornar `405 Method Not Allowed` do OpenClaw, não `404`.
- Requisito de allowlist de saída do Mattermost:
  - Se seu callback apontar para endereços privados/tailnet/internos, defina em
    Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` para incluir o host/domínio do callback.
  - Use entradas de host/domínio, não URLs completas.
    - Correto: `gateway.tailnet-name.ts.net`
    - Incorreto: `https://gateway.tailnet-name.ts.net`

## Variáveis de ambiente (conta padrão)

Defina estas variáveis no host do gateway se preferir usar variáveis de ambiente:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

As variáveis de ambiente se aplicam apenas à conta **padrão** (`default`). Outras contas devem usar valores de configuração.

## Modos de chat

O Mattermost responde automaticamente a DMs. O comportamento em canais é controlado por `chatmode`:

- `oncall` (padrão): responde apenas quando mencionado com @ em canais.
- `onmessage`: responde a toda mensagem no canal.
- `onchar`: responde quando uma mensagem começa com um prefixo de gatilho.

Exemplo de configuração:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Observações:

- `onchar` ainda responde a menções @ explícitas.
- `channels.mattermost.requireMention` é respeitado para configurações legadas, mas `chatmode` é o preferido.

## Threads e sessões

Use `channels.mattermost.replyToMode` para controlar se respostas em canais e grupos permanecem no
canal principal ou iniciam uma thread sob a postagem que disparou a ação.

- `off` (padrão): responde em thread apenas quando a postagem recebida já está em uma.
- `first`: para postagens de canal/grupo de nível superior, inicia uma thread sob essa postagem e roteia a
  conversa para uma sessão com escopo de thread.
- `all`: hoje, para Mattermost, tem o mesmo comportamento que `first`.
- Mensagens diretas ignoram essa configuração e permanecem sem thread.

Exemplo de configuração:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Observações:

- Sessões com escopo de thread usam o ID da postagem acionadora como raiz da thread.
- `first` e `all` são equivalentes no momento porque, quando o Mattermost já tem uma raiz de thread,
  blocos de continuação e mídia de acompanhamento continuam nessa mesma thread.

## Controle de acesso (DMs)

- Padrão: `channels.mattermost.dmPolicy = "pairing"` (remetentes desconhecidos recebem um código de pairing).
- Aprovar via:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DMs públicas: `channels.mattermost.dmPolicy="open"` mais `channels.mattermost.allowFrom=["*"]`.

## Canais (grupos)

- Padrão: `channels.mattermost.groupPolicy = "allowlist"` (com gating por menção).
- Coloque remetentes na allowlist com `channels.mattermost.groupAllowFrom` (IDs de usuário são recomendados).
- Substituições de menção por canal ficam em `channels.mattermost.groups.<channelId>.requireMention`
  ou `channels.mattermost.groups["*"].requireMention` para um padrão.
- A correspondência por `@username` é mutável e só é ativada quando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canais abertos: `channels.mattermost.groupPolicy="open"` (com gating por menção).
- Observação de runtime: se `channels.mattermost` estiver completamente ausente, o runtime usa `groupPolicy="allowlist"` para verificações de grupo (mesmo se `channels.defaults.groupPolicy` estiver definido).

Exemplo:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Destinos para entrega de saída

Use estes formatos de destino com `openclaw message send` ou cron/webhooks:

- `channel:<id>` para um canal
- `user:<id>` para uma DM
- `@username` para uma DM (resolvido via a API do Mattermost)

IDs opacos sem prefixo (como `64ifufp...`) são **ambíguos** no Mattermost (ID de usuário vs ID de canal).

O OpenClaw os resolve com **prioridade para usuário**:

- Se o ID existir como usuário (`GET /api/v4/users/<id>` tiver sucesso), o OpenClaw envia uma **DM** resolvendo o canal direto via `/api/v4/channels/direct`.
- Caso contrário, o ID é tratado como um **ID de canal**.

Se você precisar de comportamento determinístico, sempre use os prefixos explícitos (`user:<id>` / `channel:<id>`).

## Nova tentativa de canal de DM

Quando o OpenClaw envia para um destino de DM do Mattermost e precisa resolver primeiro o canal direto,
ele repete falhas transitórias de criação de canal direto por padrão.

Use `channels.mattermost.dmChannelRetry` para ajustar esse comportamento globalmente para o plugin Mattermost,
ou `channels.mattermost.accounts.<id>.dmChannelRetry` para uma conta específica.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Observações:

- Isso se aplica apenas à criação de canal de DM (`/api/v4/channels/direct`), não a toda chamada de API do Mattermost.
- As novas tentativas se aplicam a falhas transitórias como limites de taxa, respostas 5xx e erros de rede ou timeout.
- Erros de cliente 4xx, exceto `429`, são tratados como permanentes e não são repetidos.

## Reações (ferramenta de mensagem)

- Use `message action=react` com `channel=mattermost`.
- `messageId` é o ID da postagem no Mattermost.
- `emoji` aceita nomes como `thumbsup` ou `:+1:` (os dois-pontos são opcionais).
- Defina `remove=true` (booleano) para remover uma reação.
- Eventos de adicionar/remover reação são encaminhados como eventos de sistema para a sessão do agente roteado.

Exemplos:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuração:

- `channels.mattermost.actions.reactions`: ativa/desativa ações de reação (padrão true).
- Substituição por conta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botões interativos (ferramenta de mensagem)

Envie mensagens com botões clicáveis. Quando um usuário clica em um botão, o agente recebe a
seleção e pode responder.

Ative botões adicionando `inlineButtons` às capacidades do canal:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Use `message action=send` com um parâmetro `buttons`. Os botões são um array 2D (linhas de botões):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Campos do botão:

- `text` (obrigatório): rótulo exibido.
- `callback_data` (obrigatório): valor enviado de volta ao clicar (usado como ID da ação).
- `style` (opcional): `"default"`, `"primary"` ou `"danger"`.

Quando um usuário clica em um botão:

1. Todos os botões são substituídos por uma linha de confirmação (por exemplo, "✓ **Yes** selected by @user").
2. O agente recebe a seleção como mensagem recebida e responde.

Observações:

- Callbacks de botão usam verificação HMAC-SHA256 (automática, sem necessidade de configuração).
- O Mattermost remove os dados de callback de suas respostas de API (recurso de segurança), então todos os botões
  são removidos ao clicar — remoção parcial não é possível.
- IDs de ação contendo hífens ou sublinhados são sanitizados automaticamente
  (limitação de roteamento do Mattermost).

Configuração:

- `channels.mattermost.capabilities`: array de strings de capacidade. Adicione `"inlineButtons"` para
  ativar a descrição da ferramenta de botões no prompt de sistema do agente.
- `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para callbacks
  de botão (por exemplo `https://gateway.example.com`). Use isso quando o Mattermost não puder
  alcançar o gateway diretamente em seu host de bind.
- Em configurações com várias contas, você também pode definir o mesmo campo em
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Se `interactions.callbackBaseUrl` for omitido, o OpenClaw deriva a URL de callback a partir de
  `gateway.customBindHost` + `gateway.port`, e depois usa `http://localhost:<port>` como fallback.
- Regra de alcance: a URL de callback do botão precisa estar acessível a partir do servidor Mattermost.
  `localhost` só funciona quando Mattermost e OpenClaw são executados no mesmo host/namespace de rede.
- Se o destino do callback for privado/tailnet/interno, adicione seu host/domínio a
  `ServiceSettings.AllowedUntrustedInternalConnections` do Mattermost.

### Integração direta com API (scripts externos)

Scripts externos e webhooks podem postar botões diretamente via a API REST do Mattermost
em vez de passar pela ferramenta `message` do agente. Use `buildButtonAttachments()` da
extensão quando possível; se postar JSON bruto, siga estas regras:

**Estrutura do payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // somente alfanumérico — veja abaixo
            type: "button", // obrigatório, ou os cliques são ignorados silenciosamente
            name: "Approve", // rótulo exibido
            style: "primary", // opcional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // deve corresponder ao id do botão (para busca do nome)
                action: "approve",
                // ... quaisquer campos personalizados ...
                _token: "<hmac>", // veja a seção HMAC abaixo
              },
            },
          },
        ],
      },
    ],
  },
}
```

**Regras críticas:**

1. Attachments vão em `props.attachments`, não em `attachments` no nível superior (ignorado silenciosamente).
2. Toda action precisa de `type: "button"` — sem isso, os cliques são engolidos silenciosamente.
3. Toda action precisa de um campo `id` — o Mattermost ignora actions sem IDs.
4. O `id` da action deve ser **somente alfanumérico** (`[a-zA-Z0-9]`). Hífens e sublinhados quebram
   o roteamento de action no lado do servidor do Mattermost (retorna 404). Remova-os antes de usar.
5. `context.action_id` deve corresponder ao `id` do botão para que a mensagem de confirmação mostre o
   nome do botão (por exemplo, "Approve") em vez de um ID bruto.
6. `context.action_id` é obrigatório — o manipulador de interação retorna 400 sem ele.

**Geração de token HMAC:**

O gateway verifica cliques em botões com HMAC-SHA256. Scripts externos devem gerar tokens
que correspondam à lógica de verificação do gateway:

1. Derive o segredo a partir do token do bot:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Construa o objeto de contexto com todos os campos **exceto** `_token`.
3. Serialize com **chaves ordenadas** e **sem espaços** (o gateway usa `JSON.stringify`
   com chaves ordenadas, que produz uma saída compacta).
4. Assine: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Adicione o digest hexadecimal resultante como `_token` no contexto.

Exemplo em Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

Armadilhas comuns de HMAC:

- `json.dumps` do Python adiciona espaços por padrão (`{"key": "val"}`). Use
  `separators=(",", ":")` para corresponder à saída compacta do JavaScript (`{"key":"val"}`).
- Sempre assine **todos** os campos de contexto (menos `_token`). O gateway remove `_token` e então
  assina tudo o que sobra. Assinar apenas um subconjunto causa falha silenciosa na verificação.
- Use `sort_keys=True` — o gateway ordena as chaves antes de assinar, e o Mattermost pode
  reordenar os campos de contexto ao armazenar o payload.
- Derive o segredo a partir do token do bot (determinístico), não de bytes aleatórios. O segredo
  precisa ser o mesmo no processo que cria os botões e no gateway que verifica.

## Adaptador de diretório

O plugin Mattermost inclui um adaptador de diretório que resolve nomes de canais e usuários
via a API do Mattermost. Isso ativa destinos `#channel-name` e `@username` em
`openclaw message send` e entregas via cron/webhook.

Nenhuma configuração é necessária — o adaptador usa o token do bot da configuração da conta.

## Várias contas

O Mattermost oferece suporte a várias contas em `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Solução de problemas

- Sem respostas em canais: verifique se o bot está no canal e mencione-o (oncall), use um prefixo de gatilho (onchar) ou defina `chatmode: "onmessage"`.
- Erros de autenticação: verifique o token do bot, a URL base e se a conta está ativada.
- Problemas com várias contas: variáveis de ambiente se aplicam apenas à conta `default`.
- Comandos slash nativos retornam `Unauthorized: invalid command token.`: o OpenClaw
  não aceitou o token de callback. Causas típicas:
  - o registro do comando slash falhou ou foi concluído apenas parcialmente na inicialização
  - o callback está atingindo o gateway/conta errado
  - o Mattermost ainda tem comandos antigos apontando para um destino de callback anterior
  - o gateway reiniciou sem reativar os comandos slash
- Se os comandos slash nativos pararem de funcionar, verifique nos logs:
  `mattermost: failed to register slash commands` ou
  `mattermost: native slash commands enabled but no commands could be registered`.
- Se `callbackUrl` for omitido e os logs avisarem que o callback foi resolvido para
  `http://127.0.0.1:18789/...`, essa URL provavelmente só está acessível quando
  o Mattermost é executado no mesmo host/namespace de rede que o OpenClaw. Defina
  um `commands.callbackUrl` explícito e acessível externamente.
- Botões aparecem como caixas brancas: o agente pode estar enviando dados de botão malformados. Verifique se cada botão tem os campos `text` e `callback_data`.
- Os botões são renderizados, mas os cliques não fazem nada: verifique se `AllowedUntrustedInternalConnections` na configuração do servidor Mattermost inclui `127.0.0.1 localhost` e se `EnablePostActionIntegration` é `true` em `ServiceSettings`.
- Botões retornam 404 ao clicar: o `id` do botão provavelmente contém hífens ou sublinhados. O roteador de actions do Mattermost falha com IDs não alfanuméricos. Use apenas `[a-zA-Z0-9]`.
- O gateway registra `invalid _token`: incompatibilidade de HMAC. Verifique se você assina todos os campos de contexto (não apenas um subconjunto), usa chaves ordenadas e usa JSON compacto (sem espaços). Consulte a seção HMAC acima.
- O gateway registra `missing _token in context`: o campo `_token` não está no contexto do botão. Verifique se ele está incluído ao montar o payload de integração.
- A confirmação mostra o ID bruto em vez do nome do botão: `context.action_id` não corresponde ao `id` do botão. Defina ambos com o mesmo valor sanitizado.
- O agente não sabe sobre botões: adicione `capabilities: ["inlineButtons"]` à configuração do canal Mattermost.

## Relacionado

- [Visão geral dos canais](/channels) — todos os canais compatíveis
- [Pairing](/channels/pairing) — autenticação por DM e fluxo de pairing
- [Grupos](/channels/groups) — comportamento de chat em grupo e gating por menção
- [Roteamento de Canais](/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/gateway/security) — modelo de acesso e hardening
