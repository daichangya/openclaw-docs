---
read_when:
    - Você quer usar o harness app-server do Codex incluído
    - Você precisa de referências de modelo do Codex e exemplos de config
    - Você quer desativar o fallback de PI para implantações somente com Codex
summary: Execute os turnos de agente incorporado do OpenClaw por meio do harness app-server do Codex incluído
title: Harness do Codex
x-i18n:
    generated_at: "2026-04-21T05:39:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f0cdaf68be3b2257de1046103ff04f53f9d3a65ffc15ab7af5ab1f425643d6c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Harness do Codex

O Plugin `codex` incluído permite que o OpenClaw execute turnos de agente incorporado por meio do
app-server do Codex em vez do harness de PI integrado.

Use isso quando você quiser que o Codex seja responsável pela sessão de agente de baixo nível: descoberta
de modelo, retomada nativa de thread, Compaction nativa e execução pelo app-server.
O OpenClaw ainda é responsável pelos canais de chat, arquivos de sessão, seleção de modelo, ferramentas,
aprovações, entrega de mídia e pelo espelho visível da transcrição.

O harness vem desativado por padrão. Ele é selecionado somente quando o Plugin `codex` está
ativado e o modelo resolvido é um modelo `codex/*`, ou quando você força explicitamente
`embeddedHarness.runtime: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex`.
Se você nunca configurar `codex/*`, execuções existentes de PI, OpenAI, Anthropic, Gemini, locais
e de provedores personalizados mantêm o comportamento atual.

## Escolha o prefixo de modelo correto

O OpenClaw tem rotas separadas para acesso no formato OpenAI e Codex:

| Ref de modelo         | Caminho de runtime                            | Use quando                                                              |
| --------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`      | Provedor OpenAI por meio do fluxo OpenClaw/PI | Você quer acesso direto à API da OpenAI Platform com `OPENAI_API_KEY`.  |
| `openai-codex/gpt-5.4` | Provedor OpenAI Codex OAuth por meio de PI   | Você quer ChatGPT/Codex OAuth sem o harness app-server do Codex.        |
| `codex/gpt-5.4`       | Provedor Codex incluído mais harness do Codex | Você quer execução nativa do app-server do Codex para o turno de agente incorporado. |

O harness do Codex só assume refs de modelo `codex/*`. Refs existentes `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, locais e de provedores personalizados mantêm
seus caminhos normais.

## Requisitos

- OpenClaw com o Plugin `codex` incluído disponível.
- App-server do Codex `0.118.0` ou mais recente.
- Autenticação do Codex disponível para o processo do app-server.

O Plugin bloqueia handshakes de app-server mais antigos ou sem versão. Isso mantém o
OpenClaw na superfície de protocolo com a qual ele foi testado.

Para smoke tests ao vivo e em Docker, a autenticação normalmente vem de `OPENAI_API_KEY`, além
de arquivos opcionais da CLI do Codex como `~/.codex/auth.json` e
`~/.codex/config.toml`. Use o mesmo material de autenticação que seu app-server local do Codex
usa.

## Config mínima

Use `codex/gpt-5.4`, ative o Plugin incluído e force o harness `codex`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Se sua config usa `plugins.allow`, inclua `codex` nela também:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Definir `agents.defaults.model` ou um modelo de agente como `codex/<model>` também
ativa automaticamente o Plugin `codex` incluído. A entrada explícita do Plugin ainda é
útil em configs compartilhadas porque deixa clara a intenção da implantação.

## Adicionar Codex sem substituir outros modelos

Mantenha `runtime: "auto"` quando você quiser Codex para modelos `codex/*` e PI para
todo o restante:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

Com essa estrutura:

- `/model codex` ou `/model codex/gpt-5.4` usa o harness app-server do Codex.
- `/model gpt` ou `/model openai/gpt-5.4` usa o caminho do provedor OpenAI.
- `/model opus` usa o caminho do provedor Anthropic.
- Se um modelo não Codex for selecionado, PI permanece como harness de compatibilidade.

## Implantações somente com Codex

Desative o fallback de PI quando precisar comprovar que todo turno de agente incorporado usa
o harness do Codex:

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Substituição por ambiente:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

Com o fallback desativado, o OpenClaw falha cedo se o Plugin Codex estiver desativado,
se o modelo solicitado não for uma ref `codex/*`, se o app-server for antigo demais ou se o
app-server não puder iniciar.

## Codex por agente

Você pode tornar um agente somente Codex enquanto o agente padrão mantém a
seleção automática normal:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Use comandos normais de sessão para trocar de agentes e modelos. `/new` cria uma
nova sessão do OpenClaw, e o harness do Codex cria ou retoma sua thread sidecar de app-server
conforme necessário. `/reset` limpa o binding da sessão do OpenClaw para essa thread.

## Descoberta de modelo

Por padrão, o Plugin Codex pede ao app-server os modelos disponíveis. Se a
descoberta falhar ou atingir timeout, ele usa o catálogo de fallback incluído:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

Você pode ajustar a descoberta em `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Desative a descoberta quando quiser que a inicialização evite sondar o Codex e use apenas o
catálogo de fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Conexão e política do app-server

Por padrão, o Plugin inicia o Codex localmente com:

```bash
codex app-server --listen stdio://
```

Por padrão, o OpenClaw pede ao Codex que solicite aprovações nativas. Você pode ajustar essa
política ainda mais, por exemplo tornando-a mais restrita e roteando revisões pelo
guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Para um app-server já em execução, use transporte WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Campos `appServer` compatíveis:

| Campo               | Padrão                                   | Significado                                                             |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.               |
| `command`           | `"codex"`                                | Executável para transporte stdio.                                       |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                       |
| `url`               | não definido                             | URL WebSocket do app-server.                                            |
| `authToken`         | não definido                             | Token Bearer para transporte WebSocket.                                 |
| `headers`           | `{}`                                     | Cabeçalhos WebSocket extras.                                            |
| `requestTimeoutMs`  | `60000`                                  | Timeout para chamadas do plano de controle do app-server.               |
| `approvalPolicy`    | `"on-request"`                           | Política de aprovação nativa do Codex enviada para início/retomada/turno da thread. |
| `sandbox`           | `"workspace-write"`                      | Modo sandbox nativo do Codex enviado para início/retomada da thread.    |
| `approvalsReviewer` | `"user"`                                 | Use `"guardian_subagent"` para permitir que o guardian do Codex revise aprovações nativas. |
| `serviceTier`       | não definido                             | Nível de serviço opcional do Codex, por exemplo `"priority"`.           |

As variáveis de ambiente antigas ainda funcionam como fallback para testes locais quando
o campo correspondente de config não está definido:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

A config é preferível para implantações reproduzíveis.

## Receitas comuns

Codex local com transporte stdio padrão:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Validação de harness somente Codex, com fallback de PI desativado:

```json5
{
  embeddedHarness: {
    fallback: "none",
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Aprovações do Codex revisadas pelo guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

App-server remoto com cabeçalhos explícitos:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

A troca de modelo continua sendo controlada pelo OpenClaw. Quando uma sessão do OpenClaw está anexada
a uma thread existente do Codex, o próximo turno envia novamente ao
app-server o modelo `codex/*`, provedor, política de aprovação, sandbox e nível de serviço
selecionados no momento. Alternar de `codex/gpt-5.4` para `codex/gpt-5.2` mantém o
binding da thread, mas pede ao Codex que continue com o modelo recém-selecionado.

## Comando Codex

O Plugin incluído registra `/codex` como um comando slash autorizado. Ele é
genérico e funciona em qualquer canal que ofereça suporte a comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` mostra conectividade em tempo real com o app-server, modelos, conta, limites de taxa, servidores MCP e Skills.
- `/codex models` lista modelos em tempo real do app-server do Codex.
- `/codex threads [filter]` lista threads recentes do Codex.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma thread existente do Codex.
- `/codex compact` pede ao app-server do Codex para fazer Compaction da thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex account` mostra o status da conta e dos limites de taxa.
- `/codex mcp` lista o status dos servidores MCP do app-server do Codex.
- `/codex skills` lista Skills do app-server do Codex.

`/codex resume` grava o mesmo arquivo de binding sidecar que o harness usa para
turnos normais. Na próxima mensagem, o OpenClaw retoma essa thread do Codex, passa o
modelo `codex/*` do OpenClaw atualmente selecionado para o app-server e mantém o
histórico estendido ativado.

A superfície de comandos exige Codex app-server `0.118.0` ou mais recente. Métodos
de controle individuais são reportados como `unsupported by this Codex app-server` se um
app-server futuro ou personalizado não expuser esse método JSON-RPC.

## Ferramentas, mídia e Compaction

O harness do Codex altera apenas o executor de agente incorporado de baixo nível.

O OpenClaw ainda monta a lista de ferramentas e recebe resultados dinâmicos de ferramentas do
harness. Texto, imagens, vídeo, música, TTS, aprovações e a saída de ferramentas de mensagens
continuam pelo caminho normal de entrega do OpenClaw.

Quando o modelo selecionado usa o harness do Codex, a Compaction nativa da thread é
delegada ao app-server do Codex. O OpenClaw mantém um espelho da transcrição para histórico
de canal, busca, `/new`, `/reset` e futuras trocas de modelo ou harness. O
espelho inclui o prompt do usuário, o texto final do assistente e registros leves de raciocínio
ou plano do Codex quando o app-server os emite.

A geração de mídia não exige PI. Geração de imagem, vídeo, música, PDF, TTS e
interpretação de mídia continuam usando as configurações correspondentes de provedor/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Solução de problemas

**Codex não aparece em `/model`:** ative `plugins.entries.codex.enabled`,
defina uma ref de modelo `codex/*` ou verifique se `plugins.allow` exclui `codex`.

**O OpenClaw recorre a PI:** defina `embeddedHarness.fallback: "none"` ou
`OPENCLAW_AGENT_HARNESS_FALLBACK=none` durante os testes.

**O app-server é rejeitado:** atualize o Codex para que o handshake do app-server
informe a versão `0.118.0` ou mais recente.

**A descoberta de modelo é lenta:** reduza `plugins.entries.codex.config.discovery.timeoutMs`
ou desative a descoberta.

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`
e se o app-server remoto fala a mesma versão do protocolo app-server do Codex.

**Um modelo não Codex usa PI:** isso é esperado. O harness do Codex só assume
refs de modelo `codex/*`.

## Relacionados

- [Agent Harness Plugins](/pt-BR/plugins/sdk-agent-harness)
- [Model Providers](/pt-BR/concepts/model-providers)
- [Configuration Reference](/pt-BR/gateway/configuration-reference)
- [Testing](/pt-BR/help/testing#live-codex-app-server-harness-smoke)
