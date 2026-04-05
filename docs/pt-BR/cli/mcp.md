---
read_when:
    - Conectar Codex, Claude Code ou outro cliente MCP a canais com suporte do OpenClaw
    - Executar `openclaw mcp serve`
    - Gerenciar definições de servidores MCP salvas pelo OpenClaw
summary: Expor conversas de canais do OpenClaw por MCP e gerenciar definições salvas de servidores MCP
title: mcp
x-i18n:
    generated_at: "2026-04-05T12:38:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: b35de9e14f96666eeca2f93c06cb214e691152f911d45ee778efe9cf5bf96cc2
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` tem duas funções:

- executar o OpenClaw como um servidor MCP com `openclaw mcp serve`
- gerenciar definições de servidores MCP de saída pertencentes ao OpenClaw com `list`, `show`,
  `set` e `unset`

Em outras palavras:

- `serve` é o OpenClaw atuando como servidor MCP
- `list` / `show` / `set` / `unset` é o OpenClaw atuando como um registro
  no lado do cliente MCP para outros servidores MCP que seus runtimes poderão consumir depois

Use [`openclaw acp`](/cli/acp) quando o OpenClaw deve hospedar uma sessão
de harness de codificação por conta própria e rotear esse runtime por ACP.

## OpenClaw como servidor MCP

Este é o caminho `openclaw mcp serve`.

## Quando usar `serve`

Use `openclaw mcp serve` quando:

- Codex, Claude Code ou outro cliente MCP deve se comunicar diretamente com
  conversas de canais com suporte do OpenClaw
- você já tem um Gateway OpenClaw local ou remoto com sessões roteadas
- você quer um único servidor MCP que funcione em todos os backends de canal do OpenClaw em vez
  de executar bridges separadas por canal

Use [`openclaw acp`](/cli/acp) quando o OpenClaw deve hospedar o runtime
de codificação por conta própria e manter a sessão do agente dentro do OpenClaw.

## Como funciona

`openclaw mcp serve` inicia um servidor MCP por stdio. O cliente MCP é dono desse
processo. Enquanto o cliente mantiver a sessão stdio aberta, a bridge se conecta a um
Gateway OpenClaw local ou remoto por WebSocket e expõe conversas de canais roteadas por MCP.

Ciclo de vida:

1. o cliente MCP inicia `openclaw mcp serve`
2. a bridge se conecta ao Gateway
3. sessões roteadas tornam-se conversas MCP e ferramentas de transcrição/histórico
4. eventos ao vivo são colocados em fila na memória enquanto a bridge está conectada
5. se o modo de canal do Claude estiver habilitado, a mesma sessão também poderá receber
   notificações push específicas do Claude

Comportamento importante:

- o estado da fila ao vivo começa quando a bridge se conecta
- o histórico de transcrição mais antigo é lido com `messages_read`
- notificações push do Claude existem apenas enquanto a sessão MCP estiver ativa
- quando o cliente desconecta, a bridge é encerrada e a fila ao vivo desaparece

## Escolha um modo de cliente

Use a mesma bridge de duas formas diferentes:

- Clientes MCP genéricos: apenas ferramentas MCP padrão. Use `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` e as
  ferramentas de aprovação.
- Claude Code: ferramentas MCP padrão mais o adaptador de canal específico do Claude.
  Habilite `--claude-channel-mode on` ou deixe o padrão `auto`.

Hoje, `auto` se comporta da mesma forma que `on`. Ainda não há detecção de
capacidade do cliente.

## O que `serve` expõe

A bridge usa metadados de rota de sessão existentes do Gateway para expor conversas
com suporte de canal. Uma conversa aparece quando o OpenClaw já tem estado de sessão
com uma rota conhecida, como:

- `channel`
- metadados de destinatário ou destino
- `accountId` opcional
- `threadId` opcional

Isso dá aos clientes MCP um único lugar para:

- listar conversas roteadas recentes
- ler histórico recente de transcrição
- aguardar novos eventos de entrada
- enviar uma resposta de volta pela mesma rota
- ver solicitações de aprovação que chegam enquanto a bridge está conectada

## Uso

```bash
# Gateway local
openclaw mcp serve

# Gateway remoto
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Gateway remoto com autenticação por senha
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Habilitar logs detalhados da bridge
openclaw mcp serve --verbose

# Desabilitar notificações push específicas do Claude
openclaw mcp serve --claude-channel-mode off
```

## Ferramentas da bridge

A bridge atual expõe estas ferramentas MCP:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Lista conversas recentes com suporte de sessão que já têm metadados de rota no
estado da sessão do Gateway.

Filtros úteis:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Retorna uma conversa por `session_key`.

### `messages_read`

Lê mensagens recentes da transcrição de uma conversa com suporte de sessão.

### `attachments_fetch`

Extrai blocos de conteúdo de mensagem que não sejam texto de uma mensagem da transcrição. Esta é uma
visão de metadados sobre o conteúdo da transcrição, não um armazenamento independente
e durável de blobs de anexos.

### `events_poll`

Lê eventos ao vivo enfileirados desde um cursor numérico.

### `events_wait`

Faz long-polling até que o próximo evento enfileirado correspondente chegue ou até que um tempo limite expire.

Use isso quando um cliente MCP genérico precisar de entrega quase em tempo real sem um
protocolo push específico do Claude.

### `messages_send`

Envia texto de volta pela mesma rota já registrada na sessão.

Comportamento atual:

- exige uma rota de conversa existente
- usa o canal da sessão, destinatário, id da conta e id da thread
- envia apenas texto

### `permissions_list_open`

Lista solicitações pendentes de aprovação de execução/plugin que a bridge observou desde que se
conectou ao Gateway.

### `permissions_respond`

Resolve uma solicitação pendente de aprovação de execução/plugin com:

- `allow-once`
- `allow-always`
- `deny`

## Modelo de eventos

A bridge mantém uma fila de eventos em memória enquanto está conectada.

Tipos atuais de evento:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Limites importantes:

- a fila é apenas ao vivo; ela começa quando a bridge MCP inicia
- `events_poll` e `events_wait` não reproduzem histórico mais antigo do Gateway
  por conta própria
- backlog durável deve ser lido com `messages_read`

## Notificações de canal do Claude

A bridge também pode expor notificações de canal específicas do Claude. Este é o
equivalente no OpenClaw de um adaptador de canal do Claude Code: as ferramentas MCP padrão continuam
disponíveis, mas mensagens de entrada ao vivo também podem chegar como notificações MCP
específicas do Claude.

Flags:

- `--claude-channel-mode off`: apenas ferramentas MCP padrão
- `--claude-channel-mode on`: habilita notificações de canal do Claude
- `--claude-channel-mode auto`: padrão atual; mesmo comportamento de bridge que `on`

Quando o modo de canal do Claude está habilitado, o servidor anuncia capacidades
experimentais do Claude e pode emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamento atual da bridge:

- mensagens de transcrição de entrada `user` são encaminhadas como
  `notifications/claude/channel`
- solicitações de permissão do Claude recebidas por MCP são rastreadas em memória
- se a conversa vinculada depois enviar `yes abcde` ou `no abcde`, a bridge
  converte isso em `notifications/claude/channel/permission`
- essas notificações existem apenas na sessão ao vivo; se o cliente MCP desconectar,
  não há destino para push

Isso é intencionalmente específico do cliente. Clientes MCP genéricos devem contar com as
ferramentas de polling padrão.

## Configuração do cliente MCP

Exemplo de configuração de cliente stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Para a maioria dos clientes MCP genéricos, comece com a superfície de ferramentas padrão e ignore
o modo Claude. Ative o modo Claude apenas para clientes que realmente entendam os
métodos de notificação específicos do Claude.

## Opções

`openclaw mcp serve` oferece suporte a:

- `--url <url>`: URL WebSocket do Gateway
- `--token <token>`: token do Gateway
- `--token-file <path>`: lê o token de um arquivo
- `--password <password>`: senha do Gateway
- `--password-file <path>`: lê a senha de um arquivo
- `--claude-channel-mode <auto|on|off>`: modo de notificação do Claude
- `-v`, `--verbose`: logs detalhados em stderr

Prefira `--token-file` ou `--password-file` em vez de segredos inline quando possível.

## Segurança e limite de confiança

A bridge não inventa roteamento. Ela apenas expõe conversas que o Gateway
já sabe rotear.

Isso significa:

- listas de permissões de remetentes, emparelhamento e confiança no nível do canal continuam pertencendo à
  configuração subjacente de canal do OpenClaw
- `messages_send` só pode responder por uma rota armazenada existente
- o estado de aprovação é apenas ao vivo/em memória para a sessão atual da bridge
- a autenticação da bridge deve usar os mesmos controles de token ou senha do Gateway em que você confiaria
  para qualquer outro cliente remoto do Gateway

Se uma conversa estiver ausente em `conversations_list`, a causa usual não é
a configuração do MCP. O problema é a ausência ou incompletude dos metadados de rota na
sessão subjacente do Gateway.

## Testes

O OpenClaw inclui um smoke determinístico em Docker para esta bridge:

```bash
pnpm test:docker:mcp-channels
```

Esse smoke:

- inicia um contêiner Gateway com dados semeados
- inicia um segundo contêiner que executa `openclaw mcp serve`
- verifica descoberta de conversa, leituras de transcrição, leituras de metadados de anexos,
  comportamento da fila de eventos ao vivo e roteamento de envio de saída
- valida notificações de canal e permissões no estilo Claude pela bridge MCP stdio real

Esta é a forma mais rápida de provar que a bridge funciona sem conectar uma conta real de
Telegram, Discord ou iMessage à execução de testes.

Para um contexto mais amplo de testes, consulte [Testing](/help/testing).

## Solução de problemas

### Nenhuma conversa retornada

Normalmente significa que a sessão do Gateway ainda não é roteável. Confirme se a
sessão subjacente armazenou metadados de rota de canal/provedor, destinatário e
conta/thread opcional.

### `events_poll` ou `events_wait` não capturam mensagens mais antigas

Esperado. A fila ao vivo começa quando a bridge se conecta. Leia o histórico mais antigo da transcrição
com `messages_read`.

### Notificações do Claude não aparecem

Verifique todos estes pontos:

- o cliente manteve a sessão MCP stdio aberta
- `--claude-channel-mode` está em `on` ou `auto`
- o cliente realmente entende os métodos de notificação específicos do Claude
- a mensagem de entrada ocorreu depois que a bridge se conectou

### Aprovações estão ausentes

`permissions_list_open` mostra apenas solicitações de aprovação observadas enquanto a bridge
estava conectada. Não é uma API durável de histórico de aprovações.

## OpenClaw como registro de cliente MCP

Este é o caminho `openclaw mcp list`, `show`, `set` e `unset`.

Esses comandos não expõem o OpenClaw por MCP. Eles gerenciam definições de servidores MCP
pertencentes ao OpenClaw em `mcp.servers` na configuração do OpenClaw.

Essas definições salvas são para runtimes que o OpenClaw inicia ou configura
mais tarde, como Pi incorporado e outros adaptadores de runtime. O OpenClaw armazena as
definições centralmente para que esses runtimes não precisem manter suas próprias listas MCP
duplicadas.

Comportamento importante:

- esses comandos apenas leem ou escrevem a configuração do OpenClaw
- eles não se conectam ao servidor MCP de destino
- eles não validam se o comando, a URL ou o transporte remoto está
  acessível agora
- adaptadores de runtime decidem quais formatos de transporte eles realmente suportam em
  tempo de execução

## Definições salvas de servidores MCP

O OpenClaw também armazena um registro leve de servidores MCP na configuração para superfícies
que desejam definições MCP gerenciadas pelo OpenClaw.

Comandos:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Observações:

- `list` ordena os nomes dos servidores.
- `show` sem um nome imprime o objeto completo de servidores MCP configurados.
- `set` espera um único valor de objeto JSON na linha de comando.
- `unset` falha se o servidor nomeado não existir.

Exemplos:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Exemplo de formato de configuração:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Transporte stdio

Inicia um processo filho local e se comunica por stdin/stdout.

| Campo                      | Descrição                          |
| -------------------------- | ---------------------------------- |
| `command`                  | Executável a iniciar (obrigatório) |
| `args`                     | Array de argumentos de linha de comando |
| `env`                      | Variáveis de ambiente extras       |
| `cwd` / `workingDirectory` | Diretório de trabalho do processo  |

### Transporte SSE / HTTP

Conecta-se a um servidor MCP remoto por HTTP Server-Sent Events.

| Campo                | Descrição                                                           |
| -------------------- | ------------------------------------------------------------------- |
| `url`                | URL HTTP ou HTTPS do servidor remoto (obrigatório)                  |
| `headers`            | Mapa opcional de chave-valor de cabeçalhos HTTP (por exemplo, tokens de autenticação) |
| `connectionTimeoutMs` | Tempo limite de conexão por servidor em ms (opcional)              |

Exemplo:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Valores sensíveis em `url` (userinfo) e `headers` são redigidos em logs e
saída de status.

### Transporte HTTP com streaming

`streamable-http` é uma opção adicional de transporte ao lado de `sse` e `stdio`. Ele usa streaming HTTP para comunicação bidirecional com servidores MCP remotos.

| Campo                | Descrição                                                                            |
| -------------------- | ------------------------------------------------------------------------------------ |
| `url`                | URL HTTP ou HTTPS do servidor remoto (obrigatório)                                   |
| `transport`          | Defina como `"streamable-http"` para selecionar este transporte; quando omitido, o OpenClaw usa `sse` |
| `headers`            | Mapa opcional de chave-valor de cabeçalhos HTTP (por exemplo, tokens de autenticação) |
| `connectionTimeoutMs` | Tempo limite de conexão por servidor em ms (opcional)                               |

Exemplo:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Esses comandos gerenciam apenas a configuração salva. Eles não iniciam a bridge de canal,
não abrem uma sessão de cliente MCP ao vivo nem comprovam que o servidor de destino está acessível.

## Limites atuais

Esta página documenta a bridge como ela é distribuída hoje.

Limites atuais:

- a descoberta de conversas depende de metadados de rota existentes na sessão do Gateway
- ainda não há protocolo push genérico além do adaptador específico do Claude
- ainda não há ferramentas para editar mensagens nem reagir
- o transporte HTTP/SSE/streamable-http se conecta a um único servidor remoto; ainda não há upstream multiplexado
- `permissions_list_open` inclui apenas aprovações observadas enquanto a bridge está
  conectada
