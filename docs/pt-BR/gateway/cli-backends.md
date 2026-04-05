---
read_when:
    - Você quer um fallback confiável quando provedores de API falham
    - Você está executando Claude CLI ou outras CLIs locais de IA e quer reutilizá-las
    - Você quer entender a bridge local loopback MCP para acesso a ferramentas do backend de CLI
summary: 'Backends de CLI: fallback local de CLI de IA com bridge de ferramenta MCP opcional'
title: Backends de CLI
x-i18n:
    generated_at: "2026-04-05T12:41:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 823f3aeea6be50e5aa15b587e0944e79e862cecb7045f9dd44c93c544024bce1
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends de CLI (runtime de fallback)

O OpenClaw pode executar **CLIs locais de IA** como um **fallback somente de texto** quando provedores de API estão fora do ar,
limitados por taxa ou temporariamente com comportamento incorreto. Isso é intencionalmente conservador:

- **As ferramentas do OpenClaw não são injetadas diretamente**, mas backends com `bundleMcp: true`
  (o padrão do Claude CLI) podem receber ferramentas do gateway por uma bridge MCP local loopback.
- **Streaming JSONL** (o Claude CLI usa `--output-format stream-json` com
  `--include-partial-messages`; os prompts são enviados via stdin).
- **Sessões são compatíveis** (para que turnos de acompanhamento permaneçam coerentes).
- **Imagens podem ser repassadas** se a CLI aceitar caminhos de imagem.

Isso foi projetado como uma **rede de segurança** e não como caminho principal. Use quando você
quiser respostas de texto “sempre funciona” sem depender de APIs externas.

Se você quiser um runtime harness completo com controles de sessão ACP, tarefas em segundo plano,
binding de thread/conversa e sessões persistentes externas de programação, use
[Agentes ACP](/tools/acp-agents). Backends de CLI não são ACP.

## Início rápido para iniciantes

Você pode usar o Claude CLI **sem nenhuma configuração** (o plugin Anthropic incluído
registra um backend padrão):

```bash
openclaw agent --message "hi" --model claude-cli/claude-sonnet-4-6
```

O Codex CLI também funciona imediatamente (via o plugin OpenAI incluído):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Se o seu gateway for executado em launchd/systemd e o PATH for mínimo, adicione apenas o
caminho do comando:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

É só isso. Não são necessárias chaves nem configuração extra de autenticação além da própria CLI.

Se você usar um backend de CLI incluído como **provedor principal de mensagens** em um
host do gateway, o OpenClaw agora carrega automaticamente o plugin incluído proprietário quando sua configuração
faz referência explícita a esse backend em uma referência de modelo ou em
`agents.defaults.cliBackends`.

## Usando como fallback

Adicione um backend de CLI à sua lista de fallback para que ele só seja executado quando os modelos primários falharem:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6", "claude-cli/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
        "claude-cli/claude-opus-4-6": {},
      },
    },
  },
}
```

Observações:

- Se você usar `agents.defaults.models` (allowlist), deverá incluir `claude-cli/...`.
- Se o provedor principal falhar (autenticação, limites de taxa, timeouts), o OpenClaw
  tentará o backend de CLI em seguida.
- O backend incluído do Claude CLI ainda aceita aliases mais curtos como
  `claude-cli/opus`, `claude-cli/opus-4.6` ou `claude-cli/sonnet`, mas a documentação
  e os exemplos de configuração usam as referências canônicas `claude-cli/claude-*`.

## Visão geral da configuração

Todos os backends de CLI ficam em:

```
agents.defaults.cliBackends
```

Cada entrada é indexada por um **id de provedor** (por exemplo `claude-cli`, `my-cli`).
O id do provedor se torna o lado esquerdo da sua referência de modelo:

```
<provider>/<model>
```

### Exemplo de configuração

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Como funciona

1. **Seleciona um backend** com base no prefixo do provedor (`claude-cli/...`).
2. **Constrói um prompt de sistema** usando o mesmo prompt do OpenClaw + contexto do workspace.
3. **Executa a CLI** com um id de sessão (se compatível), para que o histórico permaneça consistente.
4. **Analisa a saída** (JSON ou texto simples) e retorna o texto final.
5. **Persiste ids de sessão** por backend, para que turnos de acompanhamento reutilizem a mesma sessão da CLI.

## Sessões

- Se a CLI oferecer suporte a sessões, defina `sessionArg` (por exemplo `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) quando o id precisar ser inserido
  em várias flags.
- Se a CLI usar um **subcomando de retomada** com flags diferentes, defina
  `resumeArgs` (substitui `args` ao retomar) e opcionalmente `resumeOutput`
  (para retomadas sem JSON).
- `sessionMode`:
  - `always`: sempre envia um id de sessão (novo UUID se nenhum estiver armazenado).
  - `existing`: só envia um id de sessão se um já tiver sido armazenado antes.
  - `none`: nunca envia um id de sessão.

Observações sobre serialização:

- `serialize: true` mantém execuções da mesma faixa em ordem.
- A maioria das CLIs serializa em uma única faixa de provedor.
- `claude-cli` é mais restrito: execuções retomadas serializam por id de sessão do Claude, e execuções novas serializam por caminho do workspace. Workspaces independentes podem ser executados em paralelo.
- O OpenClaw descarta a reutilização de sessão de CLI armazenada quando o estado de autenticação do backend muda, incluindo novo login, rotação de token ou alteração de credencial do perfil de autenticação.

## Imagens (repasse)

Se sua CLI aceitar caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw gravará imagens base64 em arquivos temporários. Se `imageArg` estiver definido, esses
caminhos serão passados como argumentos da CLI. Se `imageArg` estiver ausente, o OpenClaw acrescentará os
caminhos dos arquivos ao prompt (injeção de caminho), o que é suficiente para CLIs que carregam
automaticamente arquivos locais a partir de caminhos simples (comportamento do Claude CLI).

## Entradas / saídas

- `output: "json"` (padrão) tenta analisar JSON e extrair texto + id de sessão.
- Para saída JSON do Gemini CLI, o OpenClaw lê o texto da resposta de `response` e
  o uso de `stats` quando `usage` está ausente ou vazio.
- `output: "jsonl"` analisa streams JSONL (por exemplo Claude CLI `stream-json`
  e Codex CLI `--json`) e extrai a mensagem final do agente mais identificadores
  de sessão quando presentes.
- `output: "text"` trata stdout como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último argumento da CLI.
- `input: "stdin"` envia o prompt via stdin.
- Se o prompt for muito longo e `maxPromptArgChars` estiver definido, stdin será usado.

## Padrões (de propriedade do plugin)

O plugin Anthropic incluído registra um padrão para `claude-cli`:

- `command: "claude"`
- `args: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

O plugin OpenAI incluído também registra um padrão para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

O plugin Google incluído também registra um padrão para `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--prompt", "--output-format", "json"]`
- `resumeArgs: ["--resume", "{sessionId}", "--prompt", "--output-format", "json"]`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Pré-requisito: o Gemini CLI local deve estar instalado e disponível como
`gemini` no `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Observações sobre JSON do Gemini CLI:

- O texto da resposta é lido do campo JSON `response`.
- O uso usa `stats` como fallback quando `usage` está ausente ou vazio.
- `stats.cached` é normalizado para `cacheRead` do OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva tokens de entrada de
  `stats.input_tokens - stats.cached`.

Substitua apenas se necessário (o caso comum é caminho `command` absoluto).

## Padrões de propriedade do plugin

Os padrões de backend de CLI agora fazem parte da superfície de plugin:

- Os plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend se torna o prefixo do provedor nas referências de modelo.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda substitui o padrão do plugin.
- A limpeza de configuração específica do backend permanece de propriedade do plugin por meio do hook
  opcional `normalizeConfig`.

## Overlays MCP incluídos

Backends de CLI **não** recebem chamadas de ferramenta do OpenClaw diretamente, mas um backend pode
optar por um overlay de configuração MCP gerado com `bundleMcp: true`.

Comportamento incluído atual:

- `claude-cli`: `bundleMcp: true` (padrão)
- `codex-cli`: sem overlay MCP incluído
- `google-gemini-cli`: sem overlay MCP incluído

Quando o MCP incluído está ativado, o OpenClaw:

- inicia um servidor MCP HTTP local loopback que expõe ferramentas do gateway ao processo da CLI
- autentica a bridge com um token por sessão (`OPENCLAW_MCP_TOKEN`)
- delimita o acesso às ferramentas à sessão, conta e contexto de canal atuais
- carrega servidores MCP incluídos ativados para o workspace atual
- os mescla com qualquer `--mcp-config` já existente no backend
- reescreve os argumentos da CLI para passar `--strict-mcp-config --mcp-config <generated-file>`

A flag `--strict-mcp-config` impede que o Claude CLI herde servidores MCP ambientais
em nível de usuário ou globais. Se nenhum servidor MCP estiver ativado, o OpenClaw ainda
injeta uma configuração vazia estrita para que execuções em segundo plano permaneçam isoladas.

## Limitações

- **Sem chamadas diretas de ferramenta do OpenClaw.** O OpenClaw não injeta chamadas de ferramenta no
  protocolo do backend de CLI. No entanto, backends com `bundleMcp: true` (o
  padrão do Claude CLI) recebem ferramentas do gateway por uma bridge MCP local loopback,
  de modo que o Claude CLI pode invocar ferramentas do OpenClaw por seu suporte MCP nativo.
- **O streaming é específico do backend.** O Claude CLI usa streaming JSONL
  (`stream-json` com `--include-partial-messages`); outros backends de CLI podem
  continuar em buffer até a saída.
- **Saídas estruturadas** dependem do formato JSON da CLI.
- **Sessões do Codex CLI** retomam via saída de texto (sem JSONL), o que é menos
  estruturado do que a execução inicial com `--json`. As sessões do OpenClaw ainda funcionam
  normalmente.

## Solução de problemas

- **CLI não encontrada**: defina `command` como um caminho completo.
- **Nome de modelo incorreto**: use `modelAliases` para mapear `provider/model` → modelo da CLI.
- **Sem continuidade de sessão**: verifique se `sessionArg` está definido e se `sessionMode` não é
  `none` (o Codex CLI atualmente não consegue retomar com saída JSON).
- **Imagens ignoradas**: defina `imageArg` (e verifique se a CLI oferece suporte a caminhos de arquivo).
