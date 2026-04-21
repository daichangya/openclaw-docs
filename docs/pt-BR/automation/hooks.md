---
read_when:
    - Você quer automação orientada por eventos para `/new`, `/reset`, `/stop` e eventos do ciclo de vida do agente
    - Você quer criar, instalar ou depurar hooks
summary: 'Hooks: automação orientada por eventos para comandos e eventos do ciclo de vida'
title: Hooks
x-i18n:
    generated_at: "2026-04-21T05:35:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5269c3ca3a45d23d79232e041c0980ecaab93fd6f0f1e39e0b2a76cb4c8b5c8b
    source_path: automation/hooks.md
    workflow: 15
---

# Hooks

Hooks são pequenos scripts executados quando algo acontece dentro do Gateway. Eles podem ser descobertos a partir de diretórios e inspecionados com `openclaw hooks`. O Gateway carrega hooks internos somente depois que você habilita hooks ou configura pelo menos uma entrada de hook, hook pack, manipulador legado ou diretório extra de hooks.

Há dois tipos de hooks no OpenClaw:

- **Hooks internos** (esta página): executados dentro do Gateway quando eventos do agente ocorrem, como `/new`, `/reset`, `/stop` ou eventos de ciclo de vida.
- **Webhooks**: endpoints HTTP externos que permitem que outros sistemas acionem trabalho no OpenClaw. Consulte [Webhooks](/pt-BR/automation/cron-jobs#webhooks).

Hooks também podem ser agrupados dentro de plugins. `openclaw hooks list` mostra tanto hooks independentes quanto hooks gerenciados por plugins.

## Início rápido

```bash
# Listar hooks disponíveis
openclaw hooks list

# Habilitar um hook
openclaw hooks enable session-memory

# Verificar status dos hooks
openclaw hooks check

# Obter informações detalhadas
openclaw hooks info session-memory
```

## Tipos de evento

| Evento                   | Quando ocorre                                    |
| ------------------------ | ------------------------------------------------ |
| `command:new`            | comando `/new` emitido                           |
| `command:reset`          | comando `/reset` emitido                         |
| `command:stop`           | comando `/stop` emitido                          |
| `command`                | qualquer evento de comando (ouvinte geral)       |
| `session:compact:before` | antes de a Compaction resumir o histórico        |
| `session:compact:after`  | depois que a Compaction é concluída              |
| `session:patch`          | quando propriedades da sessão são modificadas    |
| `agent:bootstrap`        | antes de os arquivos bootstrap do workspace serem injetados |
| `gateway:startup`        | depois que os canais iniciam e os hooks são carregados |
| `message:received`       | mensagem de entrada de qualquer canal            |
| `message:transcribed`    | depois que a transcrição de áudio é concluída    |
| `message:preprocessed`   | depois que toda a compreensão de mídia e links é concluída |
| `message:sent`           | mensagem de saída entregue                       |

## Escrevendo hooks

### Estrutura do hook

Cada hook é um diretório que contém dois arquivos:

```
my-hook/
├── HOOK.md          # Metadados + documentação
└── handler.ts       # Implementação do manipulador
```

### Formato de HOOK.md

```markdown
---
name: my-hook
description: "Breve descrição do que este hook faz"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

A documentação detalhada vai aqui.
```

**Campos de metadados** (`metadata.openclaw`):

| Campo      | Descrição                                            |
| ---------- | ---------------------------------------------------- |
| `emoji`    | emoji exibido para a CLI                             |
| `events`   | array de eventos a serem monitorados                 |
| `export`   | export nomeado a ser usado (o padrão é `"default"`)  |
| `os`       | plataformas necessárias (por exemplo, `["darwin", "linux"]`) |
| `requires` | `bins`, `anyBins`, `env` ou caminhos de `config` necessários |
| `always`   | ignora verificações de elegibilidade (booleano)      |
| `install`  | métodos de instalação                                |

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

Cada evento inclui: `type`, `action`, `sessionKey`, `timestamp`, `messages` (adicione com push para enviar ao usuário) e `context` (dados específicos do evento).

### Destaques do contexto do evento

**Eventos de comando** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Eventos de mensagem** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (dados específicos do provedor, incluindo `senderId`, `senderName`, `guildId`).

**Eventos de mensagem** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Eventos de mensagem** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Eventos de mensagem** (`message:preprocessed`): `context.bodyForAgent` (corpo enriquecido final), `context.from`, `context.channelId`.

**Eventos bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (array mutável), `context.agentId`.

**Eventos de patch de sessão** (`session:patch`): `context.sessionEntry`, `context.patch` (somente campos alterados), `context.cfg`. Somente clientes privilegiados podem acionar eventos de patch.

**Eventos de Compaction**: `session:compact:before` inclui `messageCount`, `tokenCount`. `session:compact:after` adiciona `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Descoberta de hooks

Hooks são descobertos a partir destes diretórios, em ordem de precedência crescente de sobrescrita:

1. **Hooks empacotados**: enviados com o OpenClaw
2. **Hooks de plugins**: hooks agrupados dentro de plugins instalados
3. **Hooks gerenciados**: `~/.openclaw/hooks/` (instalados pelo usuário, compartilhados entre workspaces). Diretórios extras de `hooks.internal.load.extraDirs` compartilham essa precedência.
4. **Hooks do workspace**: `<workspace>/hooks/` (por agente, desabilitados por padrão até serem habilitados explicitamente)

Hooks do workspace podem adicionar novos nomes de hook, mas não podem sobrescrever hooks empacotados, gerenciados ou fornecidos por plugins com o mesmo nome.

O Gateway ignora a descoberta de hooks internos na inicialização até que hooks internos sejam configurados. Habilite um hook empacotado ou gerenciado com `openclaw hooks enable <name>`, instale um hook pack ou defina `hooks.internal.enabled=true` para ativar. Quando você habilita um hook nomeado, o Gateway carrega somente o manipulador desse hook; `hooks.internal.enabled=true`, diretórios extras de hooks e manipuladores legados ativam a descoberta ampla.

### Hook packs

Hook packs são pacotes npm que exportam hooks via `openclaw.hooks` no `package.json`. Instale com:

```bash
openclaw plugins install <path-or-spec>
```

As especificações npm são somente de registro (nome do pacote + versão exata opcional ou dist-tag). Especificações Git/URL/arquivo e intervalos semver são rejeitados.

## Hooks empacotados

| Hook                  | Eventos                        | O que faz                                             |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Salva o contexto da sessão em `<workspace>/memory/`   |
| bootstrap-extra-files | `agent:bootstrap`              | Injeta arquivos bootstrap adicionais a partir de padrões glob |
| command-logger        | `command`                      | Registra todos os comandos em `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | Executa `BOOT.md` quando o gateway inicia             |

Habilite qualquer hook empacotado:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### Detalhes de session-memory

Extrai as últimas 15 mensagens do usuário/assistente, gera um slug descritivo de nome de arquivo via LLM e salva em `<workspace>/memory/YYYY-MM-DD-slug.md`. Requer que `workspace.dir` esteja configurado.

<a id="bootstrap-extra-files"></a>

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

Os caminhos são resolvidos em relação ao workspace. Somente nomes-base bootstrap reconhecidos são carregados (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

<a id="command-logger"></a>

### Detalhes de command-logger

Registra cada comando com barra em `~/.openclaw/logs/commands.log`.

<a id="boot-md"></a>

### Detalhes de boot-md

Executa `BOOT.md` do workspace ativo quando o gateway inicia.

## Hooks de plugins

Plugins podem registrar hooks por meio do Plugin SDK para integração mais profunda: interceptar chamadas de ferramenta, modificar prompts, controlar o fluxo de mensagens e muito mais. O Plugin SDK expõe 28 hooks cobrindo resolução de modelo, ciclo de vida do agente, fluxo de mensagens, execução de ferramentas, coordenação de subagentes e ciclo de vida do gateway.

Para a referência completa de hooks de plugins, incluindo `before_tool_call`, `before_agent_reply`, `before_install` e todos os outros hooks de plugins, consulte [Plugin Architecture](/pt-BR/plugins/architecture#provider-runtime-hooks).

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
O formato legado de configuração do array `hooks.internal.handlers` ainda é compatível por retrocompatibilidade, mas novos hooks devem usar o sistema baseado em descoberta.
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

- **Mantenha os manipuladores rápidos.** Hooks são executados durante o processamento de comandos. Dispare trabalhos pesados em segundo plano sem aguardar com `void processInBackground(event)`.
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

Verifique binários ausentes (PATH), variáveis de ambiente, valores de configuração ou compatibilidade com o sistema operacional.

### Hook não está sendo executado

1. Verifique se o hook está habilitado: `openclaw hooks list`
2. Reinicie o processo do gateway para que os hooks sejam recarregados.
3. Verifique os logs do gateway: `./scripts/clawlog.sh | grep hook`

## Relacionado

- [CLI Reference: hooks](/cli/hooks)
- [Webhooks](/pt-BR/automation/cron-jobs#webhooks)
- [Plugin Architecture](/pt-BR/plugins/architecture#provider-runtime-hooks) — referência completa de hooks de plugins
- [Configuration](/pt-BR/gateway/configuration-reference#hooks)
