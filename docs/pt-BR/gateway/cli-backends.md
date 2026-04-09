---
read_when:
    - Você quer um fallback confiável quando os provedores de API falham
    - Você está executando Codex CLI ou outras CLIs de IA locais e quer reutilizá-las
    - Você quer entender a bridge MCP de loopback para acesso a ferramentas do backend de CLI
summary: 'Backends de CLI: fallback de IA local com bridge de ferramenta MCP opcional'
title: Backends de CLI
x-i18n:
    generated_at: "2026-04-09T01:27:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9b458f9fe6fa64c47864c8c180f3dedfd35c5647de470a2a4d31c26165663c20
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends de CLI (runtime de fallback)

O OpenClaw pode executar **CLIs de IA locais** como um **fallback somente de texto** quando os provedores de API estão fora do ar,
com limite de taxa, ou temporariamente se comportando mal. Isso é intencionalmente conservador:

- **As ferramentas do OpenClaw não são injetadas diretamente**, mas backends com `bundleMcp: true`
  podem receber ferramentas do gateway por meio de uma bridge MCP de loopback.
- **Streaming JSONL** para CLIs que o suportam.
- **Sessões são suportadas** (para que os turnos de acompanhamento permaneçam coerentes).
- **Imagens podem ser repassadas** se a CLI aceitar caminhos de imagem.

Isso foi projetado como uma **rede de segurança** em vez de um caminho principal. Use quando você
quiser respostas de texto que “sempre funcionam” sem depender de APIs externas.

Se você quiser um runtime harness completo com controles de sessão ACP, tarefas em segundo plano,
vinculação de thread/conversa e sessões externas de codificação persistentes, use
[ACP Agents](/pt-BR/tools/acp-agents). Backends de CLI não são ACP.

## Início rápido para iniciantes

Você pode usar Codex CLI **sem nenhuma configuração** (o plugin OpenAI incluído
registra um backend padrão):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Se o seu gateway estiver em execução sob launchd/systemd e o PATH for mínimo, adicione apenas o
caminho do comando:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

É só isso. Nenhuma chave, nenhuma configuração extra de autenticação além da própria CLI.

Se você usar um backend de CLI incluído como o **provedor principal de mensagens** em um
host de gateway, o OpenClaw agora carrega automaticamente o plugin incluído proprietário quando sua configuração
referencia explicitamente esse backend em uma referência de modelo ou em
`agents.defaults.cliBackends`.

## Usando como fallback

Adicione um backend de CLI à sua lista de fallback para que ele só seja executado quando os modelos primários falharem:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

Observações:

- Se você usar `agents.defaults.models` (lista de permissões), deverá incluir seus modelos de backend de CLI ali também.
- Se o provedor primário falhar (autenticação, limites de taxa, timeouts), o OpenClaw
  tentará o backend de CLI em seguida.

## Visão geral da configuração

Todos os backends de CLI ficam em:

```
agents.defaults.cliBackends
```

Cada entrada é indexada por um **id de provedor** (por exemplo, `codex-cli`, `my-cli`).
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
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
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
          // CLIs no estilo Codex podem apontar para um arquivo de prompt em vez disso:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
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

1. **Seleciona um backend** com base no prefixo do provedor (`codex-cli/...`).
2. **Monta um prompt de sistema** usando o mesmo prompt do OpenClaw + contexto do workspace.
3. **Executa a CLI** com um id de sessão (se suportado) para que o histórico permaneça consistente.
4. **Analisa a saída** (`JSON` ou texto simples) e retorna o texto final.
5. **Persiste ids de sessão** por backend, para que acompanhamentos reutilizem a mesma sessão da CLI.

<Note>
O backend `claude-cli` incluído da Anthropic voltou a ser suportado. A equipe da Anthropic
nos disse que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata
o uso de `claude -p` como autorizado para essa integração, a menos que a Anthropic publique
uma nova política.
</Note>

O backend `codex-cli` incluído da OpenAI passa o prompt de sistema do OpenClaw
pela substituição de configuração `model_instructions_file` do Codex (`-c
model_instructions_file="..."`). O Codex não expõe uma flag no estilo Claude
`--append-system-prompt`, então o OpenClaw grava o prompt montado em um
arquivo temporário para cada nova sessão do Codex CLI.

## Sessões

- Se a CLI suportar sessões, defina `sessionArg` (por exemplo, `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) quando o ID precisar ser inserido
  em várias flags.
- Se a CLI usar um **subcomando de retomada** com flags diferentes, defina
  `resumeArgs` (substitui `args` ao retomar) e opcionalmente `resumeOutput`
  (para retomadas sem JSON).
- `sessionMode`:
  - `always`: sempre envia um id de sessão (novo UUID se nenhum estiver armazenado).
  - `existing`: envia um id de sessão apenas se um já tiver sido armazenado antes.
  - `none`: nunca envia um id de sessão.

Observações sobre serialização:

- `serialize: true` mantém execuções da mesma faixa em ordem.
- A maioria das CLIs serializa em uma faixa de provedor.
- O OpenClaw descarta a reutilização de sessão de CLI armazenada quando o estado de autenticação do backend muda, incluindo novo login, rotação de token ou mudança na credencial do perfil de autenticação.

## Imagens (repasse)

Se a sua CLI aceitar caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw gravará imagens em base64 em arquivos temporários. Se `imageArg` estiver definido, esses
caminhos serão passados como argumentos da CLI. Se `imageArg` estiver ausente, o OpenClaw acrescentará os
caminhos dos arquivos ao prompt (injeção de caminho), o que é suficiente para CLIs que carregam
automaticamente arquivos locais a partir de caminhos simples.

## Entradas / saídas

- `output: "json"` (padrão) tenta analisar JSON e extrair texto + id de sessão.
- Para a saída JSON do Gemini CLI, o OpenClaw lê o texto da resposta de `response` e
  o uso de `stats` quando `usage` estiver ausente ou vazio.
- `output: "jsonl"` analisa streams JSONL (por exemplo, Codex CLI `--json`) e extrai a mensagem final do agente, além de identificadores de sessão
  quando presentes.
- `output: "text"` trata stdout como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último argumento da CLI.
- `input: "stdin"` envia o prompt via stdin.
- Se o prompt for muito longo e `maxPromptArgChars` estiver definido, stdin será usado.

## Padrões (de propriedade do plugin)

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
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Pré-requisito: o Gemini CLI local deve estar instalado e disponível como
`gemini` no `PATH` (`brew install gemini-cli` ou
`npm install -g @google/gemini-cli`).

Observações sobre JSON do Gemini CLI:

- O texto da resposta é lido do campo JSON `response`.
- O uso recorre a `stats` quando `usage` estiver ausente ou vazio.
- `stats.cached` é normalizado para `cacheRead` do OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva tokens de entrada de
  `stats.input_tokens - stats.cached`.

Substitua apenas se necessário (comum: caminho absoluto de `command`).

## Padrões de propriedade do plugin

Os padrões de backend de CLI agora fazem parte da superfície do plugin:

- Plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend se torna o prefixo do provedor em referências de modelo.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda substitui o padrão do plugin.
- A limpeza de configuração específica do backend continua sendo de propriedade do plugin por meio do hook opcional
  `normalizeConfig`.

## Sobreposições Bundle MCP

Backends de CLI **não** recebem chamadas de ferramentas do OpenClaw diretamente, mas um backend pode
optar por uma sobreposição de configuração MCP gerada com `bundleMcp: true`.

Comportamento incluído atual:

- `claude-cli`: arquivo de configuração MCP estrito gerado
- `codex-cli`: substituições de configuração inline para `mcp_servers`
- `google-gemini-cli`: arquivo de configurações de sistema Gemini gerado

Quando o bundle MCP está habilitado, o OpenClaw:

- inicia um servidor MCP HTTP de loopback que expõe ferramentas do gateway ao processo da CLI
- autentica a bridge com um token por sessão (`OPENCLAW_MCP_TOKEN`)
- limita o acesso às ferramentas à sessão, conta e contexto de canal atuais
- carrega servidores bundle-MCP habilitados para o workspace atual
- os mescla com qualquer formato existente de configuração/definições MCP do backend
- reescreve a configuração de inicialização usando o modo de integração de propriedade do backend da extensão proprietária

Se nenhum servidor MCP estiver habilitado, o OpenClaw ainda injeta uma configuração estrita quando um
backend optar por bundle MCP para que execuções em segundo plano permaneçam isoladas.

## Limitações

- **Sem chamadas diretas de ferramentas do OpenClaw.** O OpenClaw não injeta chamadas de ferramentas no
  protocolo do backend de CLI. Os backends só veem ferramentas do gateway quando optam por
  `bundleMcp: true`.
- **O streaming é específico do backend.** Alguns backends fazem streaming JSONL; outros armazenam em buffer
  até sair.
- **Saídas estruturadas** dependem do formato JSON da CLI.
- **As sessões do Codex CLI** retomam via saída de texto (sem JSONL), o que é menos
  estruturado do que a execução inicial com `--json`. As sessões do OpenClaw ainda funcionam
  normalmente.

## Solução de problemas

- **CLI não encontrada**: defina `command` com um caminho completo.
- **Nome de modelo incorreto**: use `modelAliases` para mapear `provider/model` → modelo da CLI.
- **Sem continuidade de sessão**: verifique se `sessionArg` está definido e se `sessionMode` não é
  `none` (o Codex CLI atualmente não consegue retomar com saída JSON).
- **Imagens ignoradas**: defina `imageArg` (e verifique se a CLI suporta caminhos de arquivo).
