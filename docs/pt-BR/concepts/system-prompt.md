---
read_when:
    - Editando o texto do prompt de sistema, a lista de ferramentas ou as seções de hora/Heartbeat
    - Alterando o bootstrap do workspace ou o comportamento de injeção de Skills
summary: O que o prompt de sistema do OpenClaw contém e como ele é montado
title: Prompt de sistema
x-i18n:
    generated_at: "2026-04-21T05:36:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc7b887865830e29bcbfb7f88a12fe04f490eec64cb745fc4534051b63a862dc
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt de sistema

O OpenClaw cria um prompt de sistema personalizado para cada execução de agente. O prompt é **de propriedade do OpenClaw** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenClaw e injetado em cada execução de agente.

Plugins de provedor podem contribuir com orientações de prompt sensíveis a cache sem substituir o prompt completo de propriedade do OpenClaw. O runtime do provedor pode:

- substituir um pequeno conjunto de seções centrais nomeadas (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injetar um **prefixo estável** acima do limite de cache do prompt
- injetar um **sufixo dinâmico** abaixo do limite de cache do prompt

Use contribuições de propriedade do provedor para ajuste específico por família de modelos. Mantenha a mutação legada de prompt `before_prompt_build` para compatibilidade ou mudanças de prompt verdadeiramente globais, não para comportamento normal de provedor.

A sobreposição da família OpenAI GPT-5 mantém pequena a regra central de execução e adiciona orientações específicas do modelo para fixação de persona, saída concisa, disciplina no uso de ferramentas, consulta paralela, cobertura de entregáveis, verificação, contexto ausente e higiene de ferramentas terminais.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Tooling**: lembrete da fonte da verdade de ferramentas estruturadas, além de orientações de runtime para uso de ferramentas.
- **Execution Bias**: orientação compacta de continuidade: aja no turno em solicitações acionáveis, continue até concluir ou ficar bloqueado, recupere-se de resultados fracos de ferramentas, verifique estado mutável ao vivo e confirme antes de finalizar.
- **Safety**: lembrete curto de proteção para evitar comportamento de busca por poder ou de contornar supervisão.
- **Skills** (quando disponível): informa ao modelo como carregar instruções de Skills sob demanda.
- **OpenClaw Self-Update**: como inspecionar a configuração com segurança usando
  `config.schema.lookup`, aplicar patch na configuração com `config.patch`, substituir a configuração completa com `config.apply` e executar `update.run` somente mediante solicitação explícita do usuário. A ferramenta `gateway`, exclusiva do proprietário, também se recusa a reescrever
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que são normalizados para esses caminhos protegidos de exec.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentation**: caminho local para a documentação do OpenClaw (repositório ou pacote npm) e quando lê-la.
- **Workspace Files (injected)**: indica que arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando habilitado): indica runtime em sandbox, caminhos do sandbox e se exec elevado está disponível.
- **Current Date & Time**: hora local do usuário, fuso horário e formato de hora.
- **Reply Tags**: sintaxe opcional de tags de resposta para provedores compatíveis.
- **Heartbeats**: prompt e comportamento de ack de Heartbeat, quando Heartbeats estão habilitados para o agente padrão.
- **Runtime**: host, SO, node, modelo, raiz do repositório (quando detectada), nível de raciocínio (uma linha).
- **Reasoning**: nível atual de visibilidade + dica de alternância com `/reasoning`.

A seção Tooling também inclui orientações de runtime para trabalho de longa duração:

- use Cron para acompanhamento futuro (`check back later`, lembretes, trabalho recorrente) em vez de loops de `sleep` com `exec`, truques de atraso com `yieldMs` ou polling repetido de `process`
- use `exec` / `process` apenas para comandos que começam agora e continuam em execução em segundo plano
- quando o despertar automático na conclusão estiver habilitado, inicie o comando uma vez e confie no caminho de despertar baseado em push quando ele emitir saída ou falhar
- use `process` para logs, status, entrada ou intervenção quando precisar inspecionar um comando em execução
- se a tarefa for maior, prefira `sessions_spawn`; a conclusão do subagente é baseada em push e anunciada automaticamente de volta ao solicitante
- não faça polling de `subagents list` / `sessions_list` em loop apenas para aguardar a conclusão

Quando a ferramenta experimental `update_plan` está habilitada, Tooling também informa ao modelo que deve usá-la apenas para trabalho não trivial de múltiplas etapas, manter exatamente uma etapa `in_progress` e evitar repetir o plano inteiro após cada atualização.

As proteções de Safety no prompt de sistema são orientativas. Elas guiam o comportamento do modelo, mas não impõem política. Use política de ferramentas, aprovações de exec, sandboxing e listas de permissão de canais para imposição rígida; os operadores podem desativá-las por design.

Em canais com cartões/botões nativos de aprovação, o prompt de runtime agora informa ao agente para confiar primeiro nessa UI nativa de aprovação. Ele só deve incluir um comando manual `/approve` quando o resultado da ferramenta disser que aprovações no chat não estão disponíveis ou que aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw pode renderizar prompts de sistema menores para subagentes. O runtime define um
`promptMode` para cada execução (não é uma configuração voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** e **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (quando conhecido), Runtime e contexto
  injetado continuam disponíveis.
- `none`: retorna apenas a linha base de identidade.

Quando `promptMode=minimal`, prompts extras injetados são rotulados como **Subagent
Context** em vez de **Group Chat Context**.

## Injeção de bootstrap do workspace

Arquivos de bootstrap são recortados e anexados em **Project Context** para que o modelo veja contexto de identidade e perfil sem precisar de leituras explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (apenas em workspaces totalmente novos)
- `MEMORY.md` quando presente, caso contrário `memory.md` como fallback em minúsculas

Todos esses arquivos são **injetados na janela de contexto** em todo turno, a menos que uma regra específica por arquivo se aplique. `HEARTBEAT.md` é omitido em execuções normais quando Heartbeats estão desabilitados para o agente padrão ou quando
`agents.defaults.heartbeat.includeSystemPromptSection` é false. Mantenha os arquivos injetados concisos — especialmente `MEMORY.md`, que pode crescer com o tempo e levar a uso de contexto inesperadamente alto e Compaction mais frequente.

> **Observação:** arquivos diários `memory/*.md` **não** fazem parte do bootstrap normal de
> Project Context. Em turnos comuns, eles são acessados sob demanda por meio das
> ferramentas `memory_search` e `memory_get`, portanto não contam contra a
> janela de contexto a menos que o modelo os leia explicitamente. Turnos simples de `/new` e
> `/reset` são a exceção: o runtime pode antepor memória diária recente
> como um bloco único de contexto de inicialização para esse primeiro turno.

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 12000). O conteúdo total de bootstrap
injetado entre arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 60000). Arquivos ausentes injetam um marcador curto de arquivo ausente. Quando ocorre truncamento,
o OpenClaw pode injetar um bloco de aviso em Project Context; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`).

Sessões de subagente injetam apenas `AGENTS.md` e `TOOLS.md` (outros arquivos de bootstrap
são filtrados para manter pequeno o contexto do subagente).

Hooks internos podem interceptar esta etapa via `agent:bootstrap` para modificar ou substituir
os arquivos de bootstrap injetados (por exemplo, trocando `SOUL.md` por uma persona alternativa).

Se você quiser fazer o agente soar menos genérico, comece com
[SOUL.md Personality Guide](/pt-BR/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs. injetado, truncamento, mais a sobrecarga de schema de ferramentas), use `/context list` ou `/context detail`. Veja [Context](/pt-BR/concepts/context).

## Tratamento de tempo

O prompt de sistema inclui uma seção dedicada **Current Date & Time** quando o
fuso horário do usuário é conhecido. Para manter o cache do prompt estável, agora ele inclui apenas o
**fuso horário** (sem relógio dinâmico nem formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha com timestamp. A mesma ferramenta também pode opcionalmente definir uma substituição
de modelo por sessão (`model=default` a remove).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Veja [Date & Time](/pt-BR/date-time) para detalhes completos do comportamento.

## Skills

Quando existem Skills elegíveis, o OpenClaw injeta uma **lista compacta de Skills disponíveis**
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** para cada Skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no
local listado (workspace, gerenciado ou empacotado). Se nenhum Skill for elegível, a
seção Skills é omitida.

A elegibilidade inclui regras de metadados do Skill, verificações de ambiente/configuração de runtime
e a lista de permissão efetiva de Skills do agente quando `agents.defaults.skills` ou
`agents.list[].skills` está configurado.

```
<available_skills>
  <skill>
    <name>...</name>
    <description>...</description>
    <location>...</location>
  </skill>
</available_skills>
```

Isso mantém pequeno o prompt base enquanto ainda permite uso direcionado de Skills.

O orçamento da lista de Skills pertence ao subsistema de Skills:

- Padrão global: `skills.limits.maxSkillsPromptChars`
- Sobrescrita por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Trechos genéricos limitados de runtime usam outra superfície:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Essa divisão mantém o dimensionamento de Skills separado do dimensionamento de leitura/injeção de runtime, como
`memory_get`, resultados de ferramentas ao vivo e atualização de `AGENTS.md` após Compaction.

## Documentation

Quando disponível, o prompt de sistema inclui uma seção **Documentation** que aponta para o
diretório local de documentação do OpenClaw (seja `docs/` no workspace do repositório ou a documentação
empacotada no npm) e também menciona o espelho público, o repositório-fonte, o Discord da comunidade e o
ClawHub ([https://clawhub.ai](https://clawhub.ai)) para descoberta de Skills. O prompt instrui o modelo a consultar primeiro a documentação local
para comportamento, comandos, configuração ou arquitetura do OpenClaw, e a executar
`openclaw status` por conta própria quando possível (perguntando ao usuário apenas quando não tiver acesso).
