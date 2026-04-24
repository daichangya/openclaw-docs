---
read_when:
    - Você quer usar o harness app-server do Codex empacotado
    - Você precisa de referências de modelo do Codex e exemplos de configuração
    - Você quer desativar o fallback de Pi para implantações somente com Codex
summary: Executar turns de agente embutido do OpenClaw por meio do harness app-server do Codex empacotado
title: Harness do Codex
x-i18n:
    generated_at: "2026-04-24T08:59:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c02b1e6cbaaefee858db7ebd7e306261683278ed9375bca6fe74855ca84eabd8
    source_path: plugins/codex-harness.md
    workflow: 15
---

O `Plugin` empacotado `codex` permite que o OpenClaw execute turns de agente embutido por meio do
app-server do Codex em vez do harness de Pi integrado.

Use isso quando você quiser que o Codex seja responsável pela sessão de agente de baixo nível: descoberta
de modelos, retomada nativa de thread, Compaction nativa e execução pelo app-server.
O OpenClaw continua responsável por canais de chat, arquivos de sessão, seleção de modelo, ferramentas,
aprovações, entrega de mídia e o espelhamento visível da transcrição.

Os turns nativos do Codex mantêm os hooks de Plugin do OpenClaw como camada pública de compatibilidade.
Esses são hooks em processo do OpenClaw, não hooks de comando `hooks.json` do Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- `before_message_write` para registros de transcrição espelhados
- `agent_end`

Plugins empacotados também podem registrar uma factory de extensão do app-server do Codex para adicionar
middleware assíncrono de `tool_result`. Esse middleware é executado para ferramentas dinâmicas do OpenClaw
depois que o OpenClaw executa a ferramenta e antes de o resultado ser retornado ao Codex. Ele é separado
do hook público de Plugin `tool_result_persist`, que transforma gravações de resultado de ferramenta na
transcrição controlada pelo OpenClaw.

O harness vem desativado por padrão. Novas configs devem manter referências de modelo OpenAI
canônicas como `openai/gpt-*` e forçar explicitamente
`embeddedHarness.runtime: "codex"` ou `OPENCLAW_AGENT_RUNTIME=codex` quando
quiserem execução nativa pelo app-server. Referências legadas `codex/*` ainda selecionam
automaticamente o harness por compatibilidade.

## Escolha o prefixo de modelo correto

Rotas da família OpenAI são específicas por prefixo. Use `openai-codex/*` quando quiser
OAuth do Codex por meio do Pi; use `openai/*` quando quiser acesso direto à API OpenAI ou
quando estiver forçando o harness nativo do app-server do Codex:

| Referência do modelo                                  | Caminho de runtime                            | Use quando                                                                |
| ----------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | Provider OpenAI por meio do encanamento OpenClaw/Pi | Você quer o acesso direto atual à API da Plataforma OpenAI com `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                                | OAuth do OpenAI Codex por meio do OpenClaw/Pi | Você quer autenticação de assinatura do ChatGPT/Codex com o runner Pi padrão. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness do app-server do Codex                | Você quer execução nativa pelo app-server do Codex para o turn de agente embutido. |

Atualmente, GPT-5.5 é somente assinatura/OAuth no OpenClaw. Use
`openai-codex/gpt-5.5` para OAuth via Pi, ou `openai/gpt-5.5` com o harness do
app-server do Codex. O acesso direto por chave de API para `openai/gpt-5.5` será suportado
quando a OpenAI habilitar GPT-5.5 na API pública.

Referências legadas `codex/gpt-*` continuam aceitas como aliases de compatibilidade. Novas configs
de OAuth do Pi Codex devem usar `openai-codex/gpt-*`; novas configs do harness nativo do
app-server devem usar `openai/gpt-*` mais a entrada explícita `embeddedHarness.runtime:
"codex"`.

`agents.defaults.imageModel` segue a mesma divisão de prefixo. Use
`openai-codex/gpt-*` quando a compreensão de imagem deve ser executada pelo caminho de provider
OpenAI Codex OAuth. Use `codex/gpt-*` quando a compreensão de imagem deve ser executada
por um turn limitado do app-server do Codex. O modelo do app-server do Codex precisa
anunciar suporte a entrada de imagem; modelos Codex somente texto falham antes de o turn de mídia
começar.

Use `/status` para confirmar o harness efetivo da sessão atual. Se a
seleção parecer inesperada, ative log de depuração para o subsistema `agents/harness`
e inspecione o registro estruturado `agent harness selected` do gateway. Ele
inclui o id do harness selecionado, o motivo da seleção, a política de runtime/fallback e,
no modo `auto`, o resultado de suporte de cada candidato de Plugin.

A seleção do harness não é um controle de sessão ao vivo. Quando um turn embutido é executado,
o OpenClaw registra o id do harness selecionado nessa sessão e continua usando-o
em turns posteriores no mesmo id de sessão. Altere a config `embeddedHarness` ou
`OPENCLAW_AGENT_RUNTIME` quando quiser que sessões futuras usem outro harness;
use `/new` ou `/reset` para iniciar uma sessão nova antes de alternar uma conversa existente
entre Pi e Codex. Isso evita reproduzir uma transcrição por dois sistemas nativos
de sessão incompatíveis.

Sessões legadas criadas antes dos pins de harness são tratadas como fixadas em Pi assim que
têm histórico de transcrição. Use `/new` ou `/reset` para fazer essa conversa aderir ao
Codex depois de alterar a config.

`/status` mostra o harness efetivo não-Pi ao lado de `Fast`, por exemplo
`Fast · codex`. O harness Pi padrão continua sendo `Runner: pi (embedded)` e não
adiciona um badge de harness separado.

## Requisitos

- OpenClaw com o `Plugin` empacotado `codex` disponível.
- App-server do Codex `0.118.0` ou mais recente.
- Autenticação do Codex disponível para o processo do app-server.

O Plugin bloqueia handshakes de app-server mais antigos ou sem versão. Isso mantém
o OpenClaw na superfície de protocolo contra a qual ele foi testado.

Para testes smoke ao vivo e em Docker, a autenticação geralmente vem de `OPENAI_API_KEY`, mais
arquivos opcionais da CLI do Codex como `~/.codex/auth.json` e
`~/.codex/config.toml`. Use o mesmo material de autenticação que o seu app-server local do Codex usa.

## Config mínima

Use `openai/gpt-5.5`, ative o Plugin empacotado e force o harness `codex`:

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
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Se a sua config usa `plugins.allow`, inclua `codex` nela também:

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

Configs legadas que definem `agents.defaults.model` ou um modelo de agente como
`codex/<model>` ainda ativam automaticamente o Plugin empacotado `codex`. Novas configs devem
preferir `openai/<model>` mais a entrada explícita `embeddedHarness` acima.

## Adicionar Codex sem substituir outros modelos

Mantenha `runtime: "auto"` quando quiser que referências legadas `codex/*` selecionem Codex e
Pi para todo o resto. Para novas configs, prefira `runtime: "codex"` explícito nos
agentes que devem usar o harness.

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
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

Com esse formato:

- `/model gpt` ou `/model openai/gpt-5.5` usa o harness do app-server do Codex para esta config.
- `/model opus` usa o caminho do provider Anthropic.
- Se um modelo não-Codex for selecionado, o Pi continua sendo o harness de compatibilidade.

## Implantações somente com Codex

Desative o fallback para Pi quando precisar comprovar que todo turn de agente embutido usa
o harness do Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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
se o app-server for antigo demais ou se o app-server não puder iniciar.

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
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Use comandos normais de sessão para trocar agentes e modelos. `/new` cria uma sessão nova
do OpenClaw e o harness do Codex cria ou retoma sua thread sidecar do app-server
conforme necessário. `/reset` limpa o vínculo da sessão OpenClaw para essa thread
e deixa o próximo turn resolver o harness a partir da config atual novamente.

## Descoberta de modelos

Por padrão, o Plugin Codex consulta o app-server para obter os modelos disponíveis. Se
a descoberta falhar ou expirar, ele usa um catálogo fallback empacotado para:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

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

Desative a descoberta quando quiser que a inicialização evite consultar o Codex e use
apenas o catálogo fallback:

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

Por padrão, o OpenClaw inicia sessões locais do harness Codex em modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Essa é a postura confiável de operador local usada
para Heartbeats autônomos: o Codex pode usar ferramentas de shell e rede sem
parar em prompts nativos de aprovação que ninguém está por perto para responder.

Para optar por aprovações revisadas por guardian do Codex, defina `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Guardian é um revisor nativo de aprovações do Codex. Quando o Codex pede para sair do sandbox, gravar fora do workspace ou adicionar permissões como acesso de rede, o Codex encaminha essa solicitação de aprovação para um subagente revisor em vez de um prompt humano. O revisor aplica o framework de risco do Codex e aprova ou nega a solicitação específica. Use Guardian quando quiser mais guardrails do que no modo YOLO, mas ainda precisar que agentes desacompanhados continuem avançando.

O preset `guardian` é expandido para `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"` e `sandbox: "workspace-write"`. Campos individuais de política ainda substituem `mode`, então implantações avançadas podem combinar o preset com escolhas explícitas.

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

| Campo               | Padrão                                   | Significado                                                                                              |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` inicia o Codex; `"websocket"` conecta a `url`.                                                 |
| `command`           | `"codex"`                                | Executável para o transporte stdio.                                                                      |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para o transporte stdio.                                                                      |
| `url`               | não definido                             | URL do app-server WebSocket.                                                                             |
| `authToken`         | não definido                             | Token Bearer para o transporte WebSocket.                                                                |
| `headers`           | `{}`                                     | Headers extras de WebSocket.                                                                             |
| `requestTimeoutMs`  | `60000`                                  | Timeout para chamadas do plano de controle do app-server.                                                |
| `mode`              | `"yolo"`                                 | Preset para execução YOLO ou com aprovação revisada por guardian.                                        |
| `approvalPolicy`    | `"never"`                                | Política nativa de aprovação do Codex enviada para iniciar/retomar/executar a thread.                   |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo do Codex enviado ao iniciar/retomar a thread.                                        |
| `approvalsReviewer` | `"user"`                                 | Use `"guardian_subagent"` para deixar o Codex Guardian revisar prompts.                                  |
| `serviceTier`       | não definido                             | Camada de serviço opcional do app-server Codex: `"fast"`, `"flex"` ou `null`. Valores legados inválidos são ignorados. |

As variáveis de ambiente antigas ainda funcionam como fallback para testes locais quando
o campo de config correspondente não está definido:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` foi removida. Use
`plugins.entries.codex.config.appServer.mode: "guardian"` no lugar, ou
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para testes locais pontuais. Config é
preferível para implantações reproduzíveis porque mantém o comportamento do Plugin no
mesmo arquivo revisado que o restante da configuração do harness do Codex.

## Receitas comuns

Codex local com o transporte stdio padrão:

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

Validação de harness somente Codex, com fallback para Pi desativado:

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

Aprovações do Codex revisadas por Guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
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

App-server remoto com headers explícitos:

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
a uma thread Codex existente, o próximo turn envia novamente o modelo OpenAI atualmente
selecionado, o provider, a política de aprovação, o sandbox e a camada de serviço para o
app-server. Trocar de `openai/gpt-5.5` para `openai/gpt-5.2` mantém o vínculo com a
thread, mas pede ao Codex para continuar com o modelo recém-selecionado.

## Comando Codex

O Plugin empacotado registra `/codex` como um comando slash autorizado. Ele é
genérico e funciona em qualquer canal que suporte comandos de texto do OpenClaw.

Formas comuns:

- `/codex status` mostra conectividade ao vivo com o app-server, modelos, conta, limites de taxa, servidores MCP e Skills.
- `/codex models` lista os modelos ao vivo do app-server do Codex.
- `/codex threads [filter]` lista threads recentes do Codex.
- `/codex resume <thread-id>` anexa a sessão atual do OpenClaw a uma thread Codex existente.
- `/codex compact` pede ao app-server do Codex para fazer Compaction da thread anexada.
- `/codex review` inicia a revisão nativa do Codex para a thread anexada.
- `/codex account` mostra o status da conta e do limite de taxa.
- `/codex mcp` lista o status dos servidores MCP do app-server do Codex.
- `/codex skills` lista as Skills do app-server do Codex.

`/codex resume` grava o mesmo arquivo de vínculo sidecar que o harness usa para
turns normais. Na próxima mensagem, o OpenClaw retoma essa thread Codex, passa o
modelo OpenClaw atualmente selecionado para o app-server e mantém o histórico
estendido ativado.

A superfície de comando requer app-server do Codex `0.118.0` ou mais recente. Métodos
de controle individuais são reportados como `unsupported by this Codex app-server` se um
app-server futuro ou personalizado não expuser esse método JSON-RPC.

## Limites de hooks

O harness do Codex tem três camadas de hooks:

| Camada                                | Responsável               | Objetivo                                                            |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hooks de Plugin do OpenClaw           | OpenClaw                  | Compatibilidade de produto/plugin entre os harnesses Pi e Codex.    |
| Middleware de extensão do app-server Codex | Plugins empacotados do OpenClaw | Comportamento de adaptador por turn em torno de ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                     | Ciclo de vida de baixo nível do Codex e política nativa de ferramentas a partir da config do Codex. |

O OpenClaw não usa arquivos `hooks.json` globais nem de projeto do Codex para rotear
o comportamento de Plugin do OpenClaw. Hooks nativos do Codex são úteis para operações
controladas pelo Codex, como política de shell, revisão nativa de resultado de ferramenta, tratamento de parada e ciclo de vida nativo de Compaction/modelo, mas não são a API de Plugin do OpenClaw.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta depois que o Codex solicita a
chamada, então o OpenClaw dispara o comportamento de Plugin e middleware que ele controla no
adaptador do harness. Para ferramentas nativas do Codex, o Codex controla o registro canônico da ferramenta.
O OpenClaw pode espelhar eventos selecionados, mas não pode reescrever a thread nativa do Codex
a menos que o Codex exponha essa operação por meio do app-server ou callbacks de hook nativos.

Quando builds mais novos do app-server do Codex expuserem eventos nativos de hook de Compaction e ciclo de vida de modelo, o OpenClaw deverá fazer version-gate desse suporte de protocolo e mapear os
eventos para o contrato de hooks existente do OpenClaw onde a semântica for fiel.
Até lá, os eventos `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` do OpenClaw são observações no nível do adaptador, não capturas byte a byte
da requisição interna do Codex ou do payload de Compaction.

Notificações nativas do app-server `hook/started` e `hook/completed` do Codex são
projetadas como eventos de agente `codex_app_server.hook` para trajetória e depuração.
Elas não invocam hooks de Plugin do OpenClaw.

## Ferramentas, mídia e Compaction

O harness do Codex altera apenas o executor de agente embutido de baixo nível.

O OpenClaw continua montando a lista de ferramentas e recebendo resultados de ferramentas dinâmicas do
harness. Texto, imagens, vídeo, música, TTS, aprovações e saída de ferramenta de mensagens
continuam pelo caminho normal de entrega do OpenClaw.

Solicitações de aprovação de ferramenta MCP do Codex são roteadas pelo fluxo de aprovação
de Plugin do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Prompts `request_user_input` do Codex são enviados de volta para o
chat de origem, e a próxima mensagem de acompanhamento enfileirada responde a essa solicitação
nativa do servidor em vez de ser direcionada como contexto extra. Outras solicitações de elicitação MCP continuam falhando de forma fechada.

Quando o modelo selecionado usa o harness do Codex, a Compaction nativa da thread é delegada ao
app-server do Codex. O OpenClaw mantém um espelho da transcrição para histórico do canal,
busca, `/new`, `/reset` e futura troca de modelo ou harness. O espelho inclui o prompt do usuário,
o texto final do assistente e registros leves de raciocínio ou plano do Codex quando o
app-server os emite. Hoje, o OpenClaw registra apenas sinais nativos de início e conclusão de Compaction. Ele ainda não expõe um resumo legível por humanos da Compaction nem uma lista auditável de quais entradas o Codex manteve após a Compaction.

Como o Codex controla a thread nativa canônica, `tool_result_persist` atualmente não
reescreve registros de resultado de ferramenta nativos do Codex. Ele só se aplica quando o
OpenClaw está gravando um resultado de ferramenta em uma transcrição de sessão controlada pelo OpenClaw.

A geração de mídia não exige Pi. Geração de imagem, vídeo, música, PDF, TTS e
compreensão de mídia continuam usando as configurações correspondentes de provider/modelo, como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` e
`messages.tts`.

## Solução de problemas

**Codex não aparece em `/model`:** ative `plugins.entries.codex.enabled`,
selecione um modelo `openai/gpt-*` com `embeddedHarness.runtime: "codex"` (ou uma
referência legada `codex/*`) e verifique se `plugins.allow` exclui `codex`.

**O OpenClaw usa Pi em vez de Codex:** se nenhum harness Codex assumir a execução,
o OpenClaw pode usar Pi como backend de compatibilidade. Defina
`embeddedHarness.runtime: "codex"` para forçar a seleção do Codex durante os testes, ou
`embeddedHarness.fallback: "none"` para falhar quando nenhum harness de Plugin corresponder. Depois
que o app-server do Codex for selecionado, suas falhas aparecem diretamente sem
configuração extra de fallback.

**O app-server é rejeitado:** atualize o Codex para que o handshake do app-server
informe a versão `0.118.0` ou superior.

**A descoberta de modelo é lenta:** reduza `plugins.entries.codex.config.discovery.timeoutMs`
ou desative a descoberta.

**O transporte WebSocket falha imediatamente:** verifique `appServer.url`, `authToken`
e se o app-server remoto fala a mesma versão de protocolo do app-server do Codex.

**Um modelo não-Codex usa Pi:** isso é esperado, a menos que você tenha forçado
`embeddedHarness.runtime: "codex"` (ou selecionado uma referência legada `codex/*`). Referências simples
`openai/gpt-*` e de outros providers permanecem em seu caminho normal de provider.

## Relacionado

- [Plugins de Agent Harness](/pt-BR/plugins/sdk-agent-harness)
- [Providers de modelo](/pt-BR/concepts/model-providers)
- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Testes](/pt-BR/help/testing-live#live-codex-app-server-harness-smoke)
