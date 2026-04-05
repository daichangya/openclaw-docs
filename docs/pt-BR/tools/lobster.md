---
read_when:
    - Você quer workflows determinísticos de várias etapas com aprovações explícitas
    - Você precisa retomar um workflow sem executar novamente as etapas anteriores
summary: Runtime de workflow tipado para o OpenClaw com gates de aprovação retomáveis.
title: Lobster
x-i18n:
    generated_at: "2026-04-05T12:55:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82718c15d571406ad6f1507de22a528fdab873edfc6aafae10742e500f6a5eda
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster é um shell de workflow que permite ao OpenClaw executar sequências de ferramentas em várias etapas como uma única operação determinística com checkpoints de aprovação explícitos.

O Lobster fica uma camada de autoria acima do trabalho destacado em segundo plano. Para orquestração de fluxo acima de tarefas individuais, consulte [Task Flow](/pt-BR/automation/taskflow) (`openclaw tasks flow`). Para o razão de atividade de tarefas, consulte [`openclaw tasks`](/pt-BR/automation/tasks).

## Hook

Seu assistente pode criar as ferramentas que o gerenciam. Peça um workflow e, 30 minutos depois, você terá uma CLI mais pipelines que são executados em uma única chamada. O Lobster é a peça que faltava: pipelines determinísticos, aprovações explícitas e estado retomável.

## Por quê

Hoje, workflows complexos exigem muitas chamadas de ferramenta de ida e volta. Cada chamada custa tokens, e o LLM precisa orquestrar cada etapa. O Lobster move essa orquestração para um runtime tipado:

- **Uma chamada em vez de várias**: o OpenClaw executa uma única chamada de ferramenta do Lobster e recebe um resultado estruturado.
- **Aprovações integradas**: efeitos colaterais, como enviar e-mail ou publicar comentário, interrompem o workflow até serem explicitamente aprovados.
- **Retomável**: workflows interrompidos retornam um token; aprove e retome sem executar tudo novamente.

## Por que uma DSL em vez de programas comuns?

O Lobster é intencionalmente pequeno. O objetivo não é “uma nova linguagem”, e sim uma especificação de pipeline previsível e amigável para IA, com aprovações e tokens de retomada como recursos de primeira classe.

- **Aprovar/retomar é integrado**: um programa comum pode solicitar confirmação humana, mas não consegue _pausar e retomar_ com um token durável sem que você mesmo crie esse runtime.
- **Determinismo + auditabilidade**: pipelines são dados, então são fáceis de registrar, diferenciar, reproduzir e revisar.
- **Superfície restrita para IA**: uma gramática pequena + encadeamento JSON reduz caminhos de código “criativos” e torna a validação realista.
- **Política de segurança incorporada**: timeouts, limites de saída, verificações de sandbox e allowlists são aplicados pelo runtime, não por cada script.
- **Ainda programável**: cada etapa pode chamar qualquer CLI ou script. Se quiser JS/TS, gere arquivos `.lobster` a partir de código.

## Como funciona

O OpenClaw inicia a CLI local `lobster` em **modo tool** e analisa um envelope JSON do stdout.
Se o pipeline pausar para aprovação, a ferramenta retorna um `resumeToken` para que você possa continuar depois.

## Padrão: CLI pequena + pipes JSON + aprovações

Crie comandos pequenos que falem JSON e depois encadeie-os em uma única chamada do Lobster. (Os nomes de comandos abaixo são exemplos — troque pelos seus.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Se o pipeline solicitar aprovação, retome com o token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

A IA dispara o workflow; o Lobster executa as etapas. Os gates de aprovação mantêm os efeitos colaterais explícitos e auditáveis.

Exemplo: mapear itens de entrada em chamadas de ferramenta:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Etapas de LLM somente JSON (`llm-task`)

Para workflows que precisam de uma **etapa estruturada de LLM**, habilite a ferramenta opcional de plugin `llm-task` e chame-a a partir do Lobster. Isso mantém o workflow determinístico enquanto ainda permite classificar/resumir/redigir com um modelo.

Habilite a ferramenta:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

Use-a em um pipeline:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Consulte [LLM Task](/tools/llm-task) para detalhes e opções de configuração.

## Arquivos de workflow (`.lobster`)

O Lobster pode executar arquivos de workflow YAML/JSON com campos `name`, `args`, `steps`, `env`, `condition` e `approval`. Em chamadas de ferramenta do OpenClaw, defina `pipeline` como o caminho do arquivo.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Observações:

- `stdin: $step.stdout` e `stdin: $step.json` passam a saída de uma etapa anterior.
- `condition` (ou `when`) pode controlar etapas com base em `$step.approved`.

## Instalar o Lobster

Instale a CLI do Lobster no **mesmo host** que executa o Gateway do OpenClaw (consulte o [repositório do Lobster](https://github.com/openclaw/lobster)) e garanta que `lobster` esteja no `PATH`.

## Habilitar a ferramenta

O Lobster é uma ferramenta **opcional** de plugin, não habilitada por padrão.

Recomendado (aditivo e seguro):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Ou por agente:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

Evite usar `tools.allow: ["lobster"]`, a menos que você pretenda executar no modo restritivo de allowlist.

Observação: allowlists são opt-in para plugins opcionais. Se a sua allowlist nomear apenas
ferramentas de plugin, como `lobster`, o OpenClaw mantém as ferramentas centrais habilitadas. Para restringir ferramentas centrais, inclua também na allowlist as ferramentas ou grupos centrais desejados.

## Exemplo: triagem de e-mail

Sem Lobster:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Com Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Retorna um envelope JSON (truncado):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

O usuário aprova → retomar:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Um workflow. Determinístico. Seguro.

## Parâmetros da ferramenta

### `run`

Executa um pipeline em modo tool.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Executar um arquivo de workflow com args:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Continua um workflow interrompido após aprovação.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Entradas opcionais

- `cwd`: diretório de trabalho relativo para o pipeline (deve permanecer dentro do diretório de trabalho atual do processo).
- `timeoutMs`: encerra o subprocesso se ele exceder essa duração (padrão: 20000).
- `maxStdoutBytes`: encerra o subprocesso se o stdout exceder esse tamanho (padrão: 512000).
- `argsJson`: string JSON passada para `lobster run --args-json` (apenas arquivos de workflow).

## Envelope de saída

O Lobster retorna um envelope JSON com um de três status:

- `ok` → concluído com sucesso
- `needs_approval` → pausado; `requiresApproval.resumeToken` é necessário para retomar
- `cancelled` → negado explicitamente ou cancelado

A ferramenta expõe o envelope tanto em `content` (JSON formatado) quanto em `details` (objeto bruto).

## Aprovações

Se `requiresApproval` estiver presente, inspecione o prompt e decida:

- `approve: true` → retoma e continua os efeitos colaterais
- `approve: false` → cancela e finaliza o workflow

Use `approve --preview-from-stdin --limit N` para anexar uma prévia JSON a solicitações de aprovação sem cola personalizada com jq/heredoc. Os tokens de retomada agora são compactos: o Lobster armazena o estado de retomada do workflow sob seu diretório de estado e retorna uma pequena chave de token.

## OpenProse

O OpenProse combina bem com o Lobster: use `/prose` para orquestrar a preparação com vários agentes e depois execute um pipeline Lobster para aprovações determinísticas. Se um programa Prose precisar de Lobster, permita a ferramenta `lobster` para subagentes por meio de `tools.subagents.tools`. Consulte [OpenProse](/prose).

## Segurança

- **Apenas subprocesso local** — nenhuma chamada de rede é feita pelo próprio plugin.
- **Sem segredos** — o Lobster não gerencia OAuth; ele chama ferramentas do OpenClaw que fazem isso.
- **Compatível com sandbox** — desabilitado quando o contexto da ferramenta está em sandbox.
- **Protegido** — nome de executável fixo (`lobster`) no `PATH`; timeouts e limites de saída são aplicados.

## Solução de problemas

- **`lobster subprocess timed out`** → aumente `timeoutMs` ou divida um pipeline longo.
- **`lobster output exceeded maxStdoutBytes`** → aumente `maxStdoutBytes` ou reduza o tamanho da saída.
- **`lobster returned invalid JSON`** → garanta que o pipeline rode em modo tool e imprima apenas JSON.
- **`lobster failed (code …)`** → execute o mesmo pipeline em um terminal para inspecionar o stderr.

## Saiba mais

- [Plugins](/tools/plugin)
- [Autoria de ferramentas de plugin](/plugins/building-plugins#registering-agent-tools)

## Estudo de caso: workflows da comunidade

Um exemplo público: uma CLI de “second brain” + pipelines Lobster que gerenciam três cofres Markdown (pessoal, parceiro, compartilhado). A CLI emite JSON para estatísticas, listagens de inbox e varreduras de itens obsoletos; o Lobster encadeia esses comandos em workflows como `weekly-review`, `inbox-triage`, `memory-consolidation` e `shared-task-sync`, cada um com gates de aprovação. A IA lida com julgamento, como categorização, quando disponível e volta para regras determinísticas quando não está.

- Tópico: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositório: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Relacionado

- [Automação e Tasks](/pt-BR/automation) — agendamento de workflows do Lobster
- [Visão geral da automação](/pt-BR/automation) — todos os mecanismos de automação
- [Visão geral das ferramentas](/tools) — todas as ferramentas disponíveis para agentes
