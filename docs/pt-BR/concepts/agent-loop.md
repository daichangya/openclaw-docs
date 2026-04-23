---
read_when:
    - Você precisa de um passo a passo exato do loop do agente ou dos eventos do ciclo de vida
    - Você está alterando o enfileiramento de sessões, as gravações de transcrição ou o comportamento do bloqueio de gravação da sessão
summary: Ciclo de vida do loop do agente, streams e semântica de espera
title: Loop do Agente
x-i18n:
    generated_at: "2026-04-23T05:38:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 439b68446cc75db3ded7a7d20df8e074734e6759ecf989a41299d1b84f1ce79c
    source_path: concepts/agent-loop.md
    workflow: 15
---

# Loop do Agente (OpenClaw)

Um loop agêntico é a execução “real” completa de um agente: entrada → montagem de contexto → inferência do modelo →
execução de ferramentas → respostas em streaming → persistência. É o caminho autoritativo que transforma uma mensagem
em ações e em uma resposta final, mantendo o estado da sessão consistente.

No OpenClaw, um loop é uma única execução serializada por sessão que emite eventos de ciclo de vida e de stream
enquanto o modelo pensa, chama ferramentas e transmite saída em streaming. Este documento explica como esse loop autêntico
é conectado de ponta a ponta.

## Pontos de entrada

- Gateway RPC: `agent` e `agent.wait`.
- CLI: comando `agent`.

## Como funciona (visão geral)

1. O RPC `agent` valida os parâmetros, resolve a sessão (`sessionKey`/`sessionId`), persiste os metadados da sessão e retorna `{ runId, acceptedAt }` imediatamente.
2. `agentCommand` executa o agente:
   - resolve os padrões de modelo + thinking/verbose/trace
   - carrega o snapshot de Skills
   - chama `runEmbeddedPiAgent` (runtime do pi-agent-core)
   - emite **lifecycle end/error** se o loop embutido não emitir um deles
3. `runEmbeddedPiAgent`:
   - serializa execuções por meio de filas por sessão e global
   - resolve o perfil de modelo + autenticação e constrói a sessão do Pi
   - inscreve-se nos eventos do Pi e transmite deltas de assistente/ferramenta
   - aplica timeout -> aborta a execução se for excedido
   - retorna payloads + metadados de uso
4. `subscribeEmbeddedPiSession` faz a ponte entre eventos do pi-agent-core e o stream `agent` do OpenClaw:
   - eventos de ferramenta => `stream: "tool"`
   - deltas de assistente => `stream: "assistant"`
   - eventos de ciclo de vida => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` usa `waitForAgentRun`:
   - espera por **lifecycle end/error** para `runId`
   - retorna `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## Enfileiramento + concorrência

- As execuções são serializadas por chave de sessão (faixa da sessão) e, opcionalmente, por uma faixa global.
- Isso evita condições de corrida entre ferramentas/sessão e mantém o histórico da sessão consistente.
- Canais de mensagens podem escolher modos de fila (collect/steer/followup) que alimentam esse sistema de faixas.
  Consulte [Fila de Comandos](/pt-BR/concepts/queue).
- As gravações da transcrição também são protegidas por um bloqueio de gravação da sessão no arquivo da sessão. O bloqueio
  reconhece processos e é baseado em arquivo, portanto captura gravadores que ignoram a fila em processo ou vêm de
  outro processo.
- Os bloqueios de gravação de sessão não são reentrantes por padrão. Se um helper aninhar intencionalmente a aquisição
  do mesmo bloqueio preservando um único gravador lógico, ele deve optar explicitamente por isso com
  `allowReentrant: true`.

## Preparação da sessão + workspace

- O workspace é resolvido e criado; execuções em sandbox podem redirecionar para uma raiz de workspace em sandbox.
- Skills são carregadas (ou reutilizadas a partir de um snapshot) e injetadas no ambiente e no prompt.
- Arquivos de bootstrap/contexto são resolvidos e injetados no relatório do prompt do sistema.
- Um bloqueio de gravação da sessão é adquirido; `SessionManager` é aberto e preparado antes do streaming. Qualquer
  regravação, Compaction ou truncamento posterior da transcrição deve adquirir o mesmo bloqueio antes de abrir ou
  modificar o arquivo da transcrição.

## Montagem do prompt + prompt do sistema

- O prompt do sistema é construído a partir do prompt base do OpenClaw, do prompt de Skills, do contexto de bootstrap e das substituições por execução.
- Limites específicos do modelo e tokens reservados para Compaction são aplicados.
- Consulte [Prompt do sistema](/pt-BR/concepts/system-prompt) para ver o que o modelo recebe.

## Pontos de hook (onde você pode interceptar)

O OpenClaw tem dois sistemas de hooks:

- **Hooks internos** (hooks do Gateway): scripts orientados a eventos para comandos e eventos de ciclo de vida.
- **Hooks de Plugin**: pontos de extensão dentro do ciclo de vida do agente/ferramenta e do pipeline do gateway.

### Hooks internos (hooks do Gateway)

- **`agent:bootstrap`**: executa enquanto os arquivos de bootstrap estão sendo construídos, antes de o prompt do sistema ser finalizado.
  Use isso para adicionar/remover arquivos de contexto de bootstrap.
- **Hooks de comando**: `/new`, `/reset`, `/stop` e outros eventos de comando (consulte o documento de Hooks).

Consulte [Hooks](/pt-BR/automation/hooks) para configuração e exemplos.

### Hooks de Plugin (ciclo de vida do agente + gateway)

Eles executam dentro do loop do agente ou do pipeline do gateway:

- **`before_model_resolve`**: executa antes da sessão (sem `messages`) para substituir deterministicamente provider/model antes da resolução do modelo.
- **`before_prompt_build`**: executa após o carregamento da sessão (com `messages`) para injetar `prependContext`, `systemPrompt`, `prependSystemContext` ou `appendSystemContext` antes do envio do prompt. Use `prependContext` para texto dinâmico por turno e campos de contexto do sistema para orientações estáveis que devem ficar no espaço do prompt do sistema.
- **`before_agent_start`**: hook legado de compatibilidade que pode executar em qualquer fase; prefira os hooks explícitos acima.
- **`before_agent_reply`**: executa após ações inline e antes da chamada ao LLM, permitindo que um Plugin assuma o turno e retorne uma resposta sintética ou silencie totalmente o turno.
- **`agent_end`**: inspeciona a lista final de mensagens e os metadados da execução após a conclusão.
- **`before_compaction` / `after_compaction`**: observam ou anotam ciclos de Compaction.
- **`before_tool_call` / `after_tool_call`**: interceptam parâmetros/resultados de ferramentas.
- **`before_install`**: inspeciona descobertas de varredura internas e pode opcionalmente bloquear instalações de Skills ou Plugins.
- **`tool_result_persist`**: transforma de forma síncrona resultados de ferramentas antes de serem gravados na transcrição da sessão.
- **`message_received` / `message_sending` / `message_sent`**: hooks de mensagens de entrada + saída.
- **`session_start` / `session_end`**: limites do ciclo de vida da sessão.
- **`gateway_start` / `gateway_stop`**: eventos de ciclo de vida do gateway.

Regras de decisão dos hooks para proteções de saída/ferramenta:

- `before_tool_call`: `{ block: true }` é terminal e interrompe handlers de prioridade inferior.
- `before_tool_call`: `{ block: false }` não faz nada e não desfaz um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal e interrompe handlers de prioridade inferior.
- `before_install`: `{ block: false }` não faz nada e não desfaz um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal e interrompe handlers de prioridade inferior.
- `message_sending`: `{ cancel: false }` não faz nada e não desfaz um cancelamento anterior.

Consulte [Hooks de Plugin](/pt-BR/plugins/architecture#provider-runtime-hooks) para a API de hooks e os detalhes de registro.

## Streaming + respostas parciais

- Deltas do assistente são transmitidos do pi-agent-core e emitidos como eventos `assistant`.
- O streaming por bloco pode emitir respostas parciais em `text_end` ou `message_end`.
- O streaming de raciocínio pode ser emitido como um stream separado ou como respostas em bloco.
- Consulte [Streaming](/pt-BR/concepts/streaming) para comportamento de fragmentação e resposta em bloco.

## Execução de ferramentas + ferramentas de mensagens

- Eventos de início/atualização/fim de ferramenta são emitidos no stream `tool`.
- Resultados de ferramentas são higienizados em relação a tamanho e payloads de imagem antes de registrar/emitir.
- Envios de ferramentas de mensagens são rastreados para suprimir confirmações duplicadas do assistente.

## Formatação da resposta + supressão

- Os payloads finais são montados a partir de:
  - texto do assistente (e raciocínio opcional)
  - resumos inline de ferramentas (quando verbose + permitido)
  - texto de erro do assistente quando o modelo falha
- O token silencioso exato `NO_REPLY` / `no_reply` é filtrado dos
  payloads de saída.
- Duplicatas de ferramentas de mensagens são removidas da lista final de payloads.
- Se não restarem payloads renderizáveis e uma ferramenta tiver falhado, uma resposta de fallback de erro de ferramenta será emitida
  (a menos que uma ferramenta de mensagens já tenha enviado uma resposta visível para o usuário).

## Compaction + novas tentativas

- A Compaction automática emite eventos de stream `compaction` e pode acionar uma nova tentativa.
- Na nova tentativa, buffers em memória e resumos de ferramentas são redefinidos para evitar saída duplicada.
- Consulte [Compaction](/pt-BR/concepts/compaction) para o pipeline de Compaction.

## Streams de eventos (hoje)

- `lifecycle`: emitido por `subscribeEmbeddedPiSession` (e como fallback por `agentCommand`)
- `assistant`: deltas em streaming do pi-agent-core
- `tool`: eventos de ferramenta em streaming do pi-agent-core

## Tratamento do canal de chat

- Deltas do assistente são armazenados em buffer em mensagens de chat `delta`.
- Um chat `final` é emitido em **lifecycle end/error**.

## Timeouts

- Padrão de `agent.wait`: 30s (apenas a espera). O parâmetro `timeoutMs` substitui isso.
- Runtime do agente: padrão `agents.defaults.timeoutSeconds` é 172800s (48 horas); aplicado no timer de aborto de `runEmbeddedPiAgent`.
- Timeout de inatividade do LLM: `agents.defaults.llm.idleTimeoutSeconds` aborta uma requisição ao modelo quando nenhum chunk de resposta chega antes da janela de inatividade. Defina isso explicitamente para modelos locais lentos ou providers de raciocínio/chamada de ferramenta; defina como 0 para desabilitar. Se não estiver definido, o OpenClaw usa `agents.defaults.timeoutSeconds` quando configurado, caso contrário 120s. Execuções acionadas por Cron sem timeout explícito de LLM ou agente desabilitam o watchdog de inatividade e dependem do timeout externo do Cron.

## Onde as coisas podem terminar mais cedo

- Timeout do agente (aborto)
- AbortSignal (cancelamento)
- Desconexão do Gateway ou timeout de RPC
- Timeout de `agent.wait` (apenas espera, não interrompe o agente)

## Relacionados

- [Ferramentas](/pt-BR/tools) — ferramentas de agente disponíveis
- [Hooks](/pt-BR/automation/hooks) — scripts orientados a eventos acionados por eventos do ciclo de vida do agente
- [Compaction](/pt-BR/concepts/compaction) — como conversas longas são resumidas
- [Aprovações de Exec](/pt-BR/tools/exec-approvals) — barreiras de aprovação para comandos de shell
- [Thinking](/pt-BR/tools/thinking) — configuração do nível de thinking/raciocínio
