---
read_when:
    - Você quer um fallback confiável quando providers de API falham
    - Você está executando o Codex CLI ou outros CLIs locais de IA e quer reutilizá-los
    - Você quer entender a ponte de loopback MCP para acesso a ferramentas do backend de CLI
summary: 'Backends de CLI: fallback local de CLI de IA com ponte opcional de ferramenta MCP'
title: Backends de CLI
x-i18n:
    generated_at: "2026-04-23T05:38:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: d36aea09a97b980e6938e12ea3bb5c01aa5f6c4275879d51879e48d5a2225fb2
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backends de CLI (runtime de fallback)

O OpenClaw pode executar **CLIs locais de IA** como um **fallback somente de texto** quando providers de API estão fora do ar,
limitados por taxa ou temporariamente com comportamento incorreto. Isso é intencionalmente conservador:

- **As ferramentas do OpenClaw não são injetadas diretamente**, mas backends com `bundleMcp: true`
  podem receber ferramentas do gateway por meio de uma ponte MCP de loopback.
- **Streaming JSONL** para CLIs que o suportam.
- **Sessões são suportadas** (assim os turnos de continuação permanecem coerentes).
- **Imagens podem ser repassadas** se o CLI aceitar caminhos de imagem.

Isso foi projetado como uma **rede de segurança** em vez de um caminho principal. Use quando você
quiser respostas em texto que “sempre funcionam” sem depender de APIs externas.

Se você quiser um runtime completo com controles de sessão ACP, tarefas em segundo plano,
vinculação de thread/conversa e sessões externas persistentes de codificação, use
[Agentes ACP](/pt-BR/tools/acp-agents). Backends de CLI não são ACP.

## Início rápido para iniciantes

Você pode usar o Codex CLI **sem nenhuma configuração** (o Plugin OpenAI incluído
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

É só isso. Nenhuma chave, nenhuma configuração extra de autenticação além da do próprio CLI.

Se você usar um backend de CLI incluído como **provider principal de mensagens** em um
host de gateway, o OpenClaw agora carrega automaticamente o Plugin incluído proprietário quando sua configuração
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

- Se você usar `agents.defaults.models` (lista de permissões), deverá incluir seus modelos de backend de CLI lá também.
- Se o provider principal falhar (autenticação, limites de taxa, timeouts), o OpenClaw
  tentará o backend de CLI em seguida.

## Visão geral da configuração

Todos os backends de CLI ficam em:

```
agents.defaults.cliBackends
```

Cada entrada é indexada por um **id de provider** (por exemplo, `codex-cli`, `my-cli`).
O id do provider se torna o lado esquerdo da sua referência de modelo:

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

1. **Seleciona um backend** com base no prefixo do provider (`codex-cli/...`).
2. **Constrói um prompt do sistema** usando o mesmo prompt e contexto de workspace do OpenClaw.
3. **Executa o CLI** com um id de sessão (se suportado) para que o histórico permaneça consistente.
   O backend incluído `claude-cli` mantém um processo stdio do Claude ativo por
   sessão do OpenClaw e envia turnos subsequentes via stdin stream-json.
4. **Analisa a saída** (JSON ou texto simples) e retorna o texto final.
5. **Persiste ids de sessão** por backend, para que continuações reutilizem a mesma sessão do CLI.

<Note>
O backend incluído Anthropic `claude-cli` voltou a ser suportado. A equipe da Anthropic
nos disse que o uso do Claude CLI no estilo OpenClaw voltou a ser permitido, então o OpenClaw trata
o uso de `claude -p` como autorizado para esta integração, a menos que a Anthropic publique
uma nova política.
</Note>

O backend incluído OpenAI `codex-cli` passa o prompt do sistema do OpenClaw por meio da
substituição de configuração `model_instructions_file` do Codex (`-c
model_instructions_file="..."`). O Codex não expõe uma flag no estilo Claude
`--append-system-prompt`, então o OpenClaw grava o prompt montado em um
arquivo temporário para cada nova sessão do Codex CLI.

O backend incluído Anthropic `claude-cli` recebe o snapshot de Skills do OpenClaw
de duas formas: o catálogo compacto de Skills do OpenClaw no prompt de sistema anexado e
um Plugin temporário do Claude Code passado com `--plugin-dir`. O Plugin contém
apenas as Skills elegíveis para aquele agente/sessão, para que o resolvedor nativo de Skills do Claude Code
veja o mesmo conjunto filtrado que o OpenClaw anunciaria de outra forma no prompt. As substituições
de env/chave de API de Skills ainda são aplicadas pelo OpenClaw ao ambiente do processo filho para a execução.

## Sessões

- Se o CLI suportar sessões, defina `sessionArg` (por exemplo, `--session-id`) ou
  `sessionArgs` (placeholder `{sessionId}`) quando o ID precisar ser inserido
  em múltiplas flags.
- Se o CLI usar um **subcomando de retomada** com flags diferentes, defina
  `resumeArgs` (substitui `args` ao retomar) e, opcionalmente, `resumeOutput`
  (para retomadas não JSON).
- `sessionMode`:
  - `always`: sempre envia um id de sessão (novo UUID se nenhum estiver armazenado).
  - `existing`: envia um id de sessão somente se um tiver sido armazenado antes.
  - `none`: nunca envia um id de sessão.
- `claude-cli` usa por padrão `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"`, para que turnos subsequentes reutilizem o processo Claude ativo enquanto
  ele estiver ativo. Se o Gateway reiniciar ou o processo ocioso encerrar, o OpenClaw
  retoma a partir do id de sessão do Claude armazenado.
- Sessões de CLI armazenadas são continuidade controlada pelo provider. A redefinição implícita diária da sessão
  não as interrompe; `/reset` e políticas explícitas de `session.reset` ainda interrompem.

Observações sobre serialização:

- `serialize: true` mantém as execuções da mesma faixa em ordem.
- A maioria dos CLIs serializa em uma única faixa do provider.
- O OpenClaw descarta a reutilização de sessão de CLI armazenada quando a identidade de autenticação selecionada muda,
  incluindo alteração do id do perfil de autenticação, chave de API estática, token estático ou identidade de conta OAuth
  quando o CLI a expõe. A rotação do token de acesso e de atualização do OAuth não interrompe a sessão de CLI armazenada.
  Se um CLI não expuser um id de conta OAuth estável, o OpenClaw deixa que esse CLI imponha as permissões de retomada.

## Imagens (repasse)

Se o seu CLI aceitar caminhos de imagem, defina `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

O OpenClaw gravará imagens base64 em arquivos temporários. Se `imageArg` estiver definido, esses
caminhos serão passados como argumentos do CLI. Se `imageArg` estiver ausente, o OpenClaw anexa os
caminhos de arquivo ao prompt (injeção de caminho), o que é suficiente para CLIs que carregam
automaticamente arquivos locais a partir de caminhos simples.

## Entradas / saídas

- `output: "json"` (padrão) tenta analisar JSON e extrair texto + id de sessão.
- Para saída JSON do Gemini CLI, o OpenClaw lê o texto da resposta de `response` e
  o uso de `stats` quando `usage` está ausente ou vazio.
- `output: "jsonl"` analisa streams JSONL (por exemplo, Codex CLI `--json`) e extrai a mensagem final do agente, além de identificadores
  de sessão quando presentes.
- `output: "text"` trata `stdout` como a resposta final.

Modos de entrada:

- `input: "arg"` (padrão) passa o prompt como o último argumento do CLI.
- `input: "stdin"` envia o prompt via stdin.
- Se o prompt for muito longo e `maxPromptArgChars` estiver definido, stdin será usado.

## Padrões (de propriedade do Plugin)

O Plugin OpenAI incluído também registra um padrão para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

O Plugin Google incluído também registra um padrão para `google-gemini-cli`:

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
- O uso recorre a `stats` quando `usage` está ausente ou vazio.
- `stats.cached` é normalizado para `cacheRead` no OpenClaw.
- Se `stats.input` estiver ausente, o OpenClaw deriva os tokens de entrada de
  `stats.input_tokens - stats.cached`.

Substitua apenas se necessário (comum: caminho absoluto de `command`).

## Padrões de propriedade do Plugin

Os padrões de backend de CLI agora fazem parte da superfície de Plugin:

- Plugins os registram com `api.registerCliBackend(...)`.
- O `id` do backend se torna o prefixo do provider nas referências de modelo.
- A configuração do usuário em `agents.defaults.cliBackends.<id>` ainda substitui o padrão do Plugin.
- A limpeza de configuração específica do backend continua sendo de propriedade do Plugin por meio do hook opcional
  `normalizeConfig`.

Plugins que precisam de pequenos ajustes de compatibilidade de prompt/mensagem podem declarar
transformações bidirecionais de texto sem substituir um provider nem um backend de CLI:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` reescreve o prompt do sistema e o prompt do usuário passados ao CLI. `output`
reescreve deltas do assistente em streaming e o texto final analisado antes de o OpenClaw tratar
seus próprios marcadores de controle e a entrega ao canal.

Para CLIs que emitem JSONL compatível com stream-json do Claude Code, defina
`jsonlDialect: "claude-stream-json"` na configuração desse backend.

## Sobreposições MCP do bundle

Backends de CLI **não** recebem chamadas de ferramenta do OpenClaw diretamente, mas um backend pode
optar por uma sobreposição de configuração MCP gerada com `bundleMcp: true`.

Comportamento incluído atual:

- `claude-cli`: arquivo de configuração MCP estrito gerado
- `codex-cli`: substituições de configuração inline para `mcp_servers`
- `google-gemini-cli`: arquivo de configurações de sistema do Gemini gerado

Quando o bundle MCP está habilitado, o OpenClaw:

- inicia um servidor HTTP MCP de loopback que expõe ferramentas do gateway ao processo do CLI
- autentica a ponte com um token por sessão (`OPENCLAW_MCP_TOKEN`)
- limita o acesso às ferramentas à sessão, conta e contexto de canal atuais
- carrega servidores bundle-MCP habilitados para o workspace atual
- os mescla com qualquer forma existente de configuração/ajustes MCP do backend
- reescreve a configuração de inicialização usando o modo de integração de propriedade do backend da extensão proprietária

Se nenhum servidor MCP estiver habilitado, o OpenClaw ainda injeta uma configuração estrita quando um
backend optar por bundle MCP, para que execuções em segundo plano permaneçam isoladas.

## Limitações

- **Sem chamadas diretas de ferramenta do OpenClaw.** O OpenClaw não injeta chamadas de ferramenta no
  protocolo do backend de CLI. Backends só veem ferramentas do gateway quando optam por
  `bundleMcp: true`.
- **O streaming é específico do backend.** Alguns backends fazem streaming em JSONL; outros acumulam
  até a saída.
- **Saídas estruturadas** dependem do formato JSON do CLI.
- **Sessões do Codex CLI** são retomadas por saída de texto (sem JSONL), o que é menos
  estruturado do que a execução inicial com `--json`. As sessões do OpenClaw ainda funcionam
  normalmente.

## Solução de problemas

- **CLI não encontrado**: defina `command` com um caminho completo.
- **Nome de modelo incorreto**: use `modelAliases` para mapear `provider/model` → modelo do CLI.
- **Sem continuidade de sessão**: verifique se `sessionArg` está definido e se `sessionMode` não é
  `none` (atualmente, o Codex CLI não consegue retomar com saída JSON).
- **Imagens ignoradas**: defina `imageArg` (e verifique se o CLI oferece suporte a caminhos de arquivo).
