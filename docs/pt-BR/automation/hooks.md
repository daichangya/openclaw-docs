---
read_when:
    - Você quer automação orientada a eventos para /new, /reset, /stop e eventos do ciclo de vida do agente
    - Você quer criar, instalar ou depurar hooks
summary: 'Hooks: automação orientada a eventos para comandos e eventos do ciclo de vida'
title: Hooks
x-i18n:
    generated_at: "2026-04-05T12:34:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eb75bb2b3b2ad229bf3da24fdb0fe021ed08f812fd1d13c69b3bd9df0218e5
    source_path: automation/hooks.md
    workflow: 15
---

# Hooks

Hooks são pequenos scripts executados quando algo acontece dentro do Gateway. Eles são descobertos automaticamente em diretórios e podem ser inspecionados com `openclaw hooks`.

Existem dois tipos de hooks no OpenClaw:

- **Hooks internos** (esta página): executados dentro do Gateway quando eventos do agente são disparados, como `/new`, `/reset`, `/stop` ou eventos do ciclo de vida.
- **Webhooks**: endpoints HTTP externos que permitem que outros sistemas acionem trabalho no OpenClaw. Consulte [Webhooks](/automation/cron-jobs#webhooks).

Hooks também podem ser empacotados dentro de plugins. `openclaw hooks list` mostra tanto hooks independentes quanto hooks gerenciados por plugins.

## Início rápido

```bash
# Listar hooks disponíveis
openclaw hooks list

# Habilitar um hook
openclaw hooks enable session-memory

# Verificar o status do hook
openclaw hooks check

# Obter informações detalhadas
openclaw hooks info session-memory
```

## Tipos de evento

| Evento                   | Quando é disparado                              |
| ------------------------ | ----------------------------------------------- |
| `command:new`            | Comando `/new` emitido                          |
| `command:reset`          | Comando `/reset` emitido                        |
| `command:stop`           | Comando `/stop` emitido                         |
| `command`                | Qualquer evento de comando (listener geral)     |
| `session:compact:before` | Antes de a compactação resumir o histórico      |
| `session:compact:after`  | Depois de a compactação ser concluída           |
| `session:patch`          | Quando propriedades da sessão são modificadas   |
| `agent:bootstrap`        | Antes de os arquivos bootstrap do workspace serem injetados |
| `gateway:startup`        | Depois que os canais são iniciados e os hooks são carregados |
| `message:received`       | Mensagem de entrada de qualquer canal           |
| `message:transcribed`    | Depois que a transcrição de áudio é concluída   |
| `message:preprocessed`   | Depois que todo o entendimento de mídia e links é concluído |
| `message:sent`           | Mensagem de saída entregue                      |

## Escrevendo hooks

### Estrutura de hook

Cada hook é um diretório contendo dois arquivos:

```
my-hook/
├── HOOK.md          # Metadados + documentação
└── handler.ts       # Implementação do manipulador
```

### Formato de HOOK.md

```markdown
---
name: my-hook
description: "Descrição curta do que este hook faz"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

A documentação detalhada vai aqui.
```

**Campos de metadados** (`metadata.openclaw`):

| Campo      | Descrição                                            |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Emoji exibido para a CLI                             |
| `events`   | Array de eventos para escutar                        |
| `export`   | Export nomeado a usar (o padrão é `"default"`)       |
| `os`       | Plataformas exigidas (por exemplo, `["darwin", "linux"]`) |
| `requires` | `bins`, `anyBins`, `env` ou caminhos `config` exigidos |
| `always`   | Ignorar verificações de elegibilidade (booleano)     |
| `install`  | Métodos de instalação                                |

### Implementação do manipulador

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Cada evento inclui: `type`, `action`, `sessionKey`, `timestamp`, `messages` (faça push para enviar ao usuário) e `context` (dados específicos do evento).

### Destaques do contexto do evento

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensagem** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dados específicos do provedor, incluindo `senderId`, `senderName`, `guildId`).

**Eventos de mensagem** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensagem** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensagem** (`message:preprocessed`): `context.bodyForAgent` (corpo final enriquecido), `context.from`, `context.channelId`.

**Eventos de bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutável), `context.agentId`.

**Eventos de patch de sessão** (`session:patch`): `context.sessionEntry`, `context.patch` (somente campos alterados), `context.cfg`. Somente clientes privilegiados podem disparar eventos de patch.

**Eventos de compactação**: `session:compact:before` inclui `messageCount`, `tokenCount`. `session:compact:after` adiciona `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Descoberta de hooks

Os hooks são descobertos nestes diretórios, em ordem de precedência crescente para sobrescrita:

1. **Hooks empacotados**: distribuídos com o OpenClaw
2. **Hooks de plugins**: hooks empacotados dentro de plugins instalados
3. **Hooks gerenciados**: `~/.openclaw/hooks/` (instalados pelo usuário, compartilhados entre workspaces). Diretórios extras de `hooks.internal.load.extraDirs` compartilham essa precedência.
4. **Hooks de workspace**: `<workspace>/hooks/` (por agente, desabilitados por padrão até serem explicitamente habilitados)

Hooks de workspace podem adicionar novos nomes de hook, mas não podem sobrescrever hooks empacotados, gerenciados ou fornecidos por plugin com o mesmo nome.

### Pacotes de hooks

Pacotes de hooks são pacotes npm que exportam hooks via `openclaw.hooks` em `package.json`. Instale com:

```bash
openclaw plugins install <path-or-spec>
```

Especificações npm são apenas de registro (nome do pacote + versão exata opcional ou dist-tag). Especificações Git/URL/arquivo e intervalos semver são rejeitados.

## Hooks empacotados

| Hook                  | Eventos                        | O que faz                                            |
| --------------------- | ------------------------------ | ---------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Salva o contexto da sessão em `<workspace>/memory/`  |
| bootstrap-extra-files | `agent:bootstrap`              | Injeta arquivos bootstrap adicionais a partir de padrões glob |
| command-logger        | `command`                      | Registra todos os comandos em `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Executa `BOOT.md` quando o gateway é iniciado        |

Habilite qualquer hook empacotado:

```bash
openclaw hooks enable <hook-name>
```

### Detalhes de session-memory

Extrai as últimas 15 mensagens de usuário/assistente, gera um slug de nome de arquivo descritivo via LLM e salva em `<workspace>/memory/YYYY-MM-DD-slug.md`. Requer que `workspace.dir` esteja configurado.

### Configuração de bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Os caminhos são resolvidos em relação ao workspace. Somente nomes base bootstrap reconhecidos são carregados (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

## Hooks de plugins

Plugins podem registrar hooks por meio do Plugin SDK para integração mais profunda: interceptar chamadas de ferramenta, modificar prompts, controlar o fluxo de mensagens e muito mais. O Plugin SDK expõe 28 hooks que cobrem resolução de modelo, ciclo de vida do agente, fluxo de mensagens, execução de ferramentas, coordenação de subagentes e ciclo de vida do gateway.

Para a referência completa de hooks de plugin, incluindo `before_tool_call`, `before_agent_reply`, `before_install` e todos os outros hooks de plugin, consulte [Plugin Architecture](/plugins/architecture#provider-runtime-hooks).

## Configuração

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

Variáveis de ambiente por hook:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

Diretórios extras de hooks:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
O formato legado de configuração de array `hooks.internal.handlers` ainda é compatível por retrocompatibilidade, mas hooks novos devem usar o sistema baseado em descoberta.
</Note>

## Referência da CLI

```bash
# Listar todos os hooks (adicione --eligible, --verbose ou --json)
openclaw hooks list

# Mostrar informações detalhadas sobre um hook
openclaw hooks info <hook-name>

# Mostrar resumo de elegibilidade
openclaw hooks check

# Habilitar/desabilitar
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## Boas práticas

- **Mantenha os manipuladores rápidos.** Hooks são executados durante o processamento de comandos. Faça fire-and-forget de trabalho pesado com `void processInBackground(event)`.
- **Trate erros com elegância.** Envolva operações arriscadas em try/catch; não lance exceções para que outros manipuladores possam ser executados.
- **Filtre eventos cedo.** Retorne imediatamente se o tipo/ação do evento não for relevante.
- **Use chaves de evento específicas.** Prefira `"events": ["command:new"]` em vez de `"events": ["command"]` para reduzir a sobrecarga.

## Solução de problemas

### Hook não descoberto

```bash
# Verificar a estrutura do diretório
ls -la ~/.openclaw/hooks/my-hook/
# Deve mostrar: HOOK.md, handler.ts

# Listar todos os hooks descobertos
openclaw hooks list
```

### Hook não elegível

```bash
openclaw hooks info my-hook
```

Verifique se há binários ausentes (PATH), variáveis de ambiente, valores de configuração ou compatibilidade com o SO.

### Hook não está sendo executado

1. Verifique se o hook está habilitado: `openclaw hooks list`
2. Reinicie o processo do gateway para que os hooks sejam recarregados.
3. Verifique os logs do gateway: `./scripts/clawlog.sh | grep hook`

## Relacionado

- [CLI Reference: hooks](/cli/hooks)
- [Webhooks](/automation/cron-jobs#webhooks)
- [Plugin Architecture](/plugins/architecture#provider-runtime-hooks) — referência completa de hooks de plugin
- [Configuration](/gateway/configuration-reference#hooks)
