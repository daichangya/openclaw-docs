---
read_when:
    - Editar o texto do prompt do sistema, a lista de ferramentas ou as seções de hora/Heartbeat
    - Alterar o comportamento de bootstrap do workspace ou de injeção de Skills
summary: O que o prompt do sistema do OpenClaw contém e como ele é montado
title: Prompt do sistema
x-i18n:
    generated_at: "2026-04-18T05:24:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: e60705994cebdd9768926168cb1c6d17ab717d7ff02353a5d5e7478ba8191cab
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt do sistema

O OpenClaw cria um prompt do sistema personalizado para cada execução de agente. O prompt é **de propriedade do OpenClaw** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenClaw e injetado em cada execução de agente.

Plugins de provedor podem contribuir com orientações de prompt sensíveis ao cache sem substituir todo o prompt de propriedade do OpenClaw. O runtime do provedor pode:

- substituir um pequeno conjunto de seções principais nomeadas (`interaction_style`,
  `tool_call_style`, `execution_bias`)
- injetar um **prefixo estável** acima do limite de cache do prompt
- injetar um **sufixo dinâmico** abaixo do limite de cache do prompt

Use contribuições de propriedade do provedor para ajustes específicos por família de modelo. Mantenha a mutação legada de prompt `before_prompt_build` para compatibilidade ou mudanças de prompt realmente globais, e não para comportamento normal de provedor.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Ferramentas**: lembrete da fonte da verdade para ferramentas estruturadas, além de orientações de uso de ferramentas em tempo de execução.
- **Segurança**: lembrete curto de proteção para evitar comportamento de busca por poder ou desvio de supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de skill sob demanda.
- **Autoatualização do OpenClaw**: como inspecionar a configuração com segurança usando
  `config.schema.lookup`, aplicar patch na configuração com `config.patch`, substituir a configuração completa com `config.apply` e executar `update.run` apenas sob solicitação explícita do usuário. A ferramenta `gateway`, exclusiva do proprietário, também se recusa a reescrever
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que são normalizados para esses caminhos protegidos de exec.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentação**: caminho local para a documentação do OpenClaw (repositório ou pacote npm) e quando lê-la.
- **Arquivos do Workspace (injetados)**: indica que os arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando habilitado): indica runtime em sandbox, caminhos do sandbox e se exec com privilégios elevados está disponível.
- **Data e hora atuais**: hora local do usuário, fuso horário e formato de hora.
- **Tags de resposta**: sintaxe opcional de tags de resposta para provedores compatíveis.
- **Heartbeats**: prompt de heartbeat e comportamento de ack, quando heartbeats estão habilitados para o agente padrão.
- **Runtime**: host, SO, node, raiz do repositório (quando detectada), nível de raciocínio (uma linha).
- **Raciocínio**: nível atual de visibilidade + dica do alternador `/reasoning`.

A seção Ferramentas também inclui orientações de runtime para trabalho de longa duração:

- use cron para acompanhamento futuro (`verifique novamente mais tarde`, lembretes, trabalho recorrente)
  em vez de loops de sleep com `exec`, truques de atraso com `yieldMs` ou polling repetido de `process`
- use `exec` / `process` apenas para comandos que começam agora e continuam em execução
  em segundo plano
- quando a ativação automática por conclusão estiver habilitada, inicie o comando uma vez e confie
  no caminho de ativação baseado em push quando ele emitir saída ou falhar
- use `process` para logs, status, entrada ou intervenção quando precisar
  inspecionar um comando em execução
- se a tarefa for maior, prefira `sessions_spawn`; a conclusão de subagente é
  baseada em push e se anuncia automaticamente de volta ao solicitante
- não faça polling de `subagents list` / `sessions_list` em loop apenas para esperar
  pela conclusão

Quando a ferramenta experimental `update_plan` está habilitada, Ferramentas também informa ao
modelo para usá-la apenas em trabalho não trivial com várias etapas, manter exatamente uma etapa
`in_progress` e evitar repetir o plano inteiro após cada atualização.

As proteções de segurança no prompt do sistema são consultivas. Elas orientam o comportamento do modelo, mas não impõem política. Use política de ferramenta, aprovações de exec, sandboxing e listas de permissão de canal para imposição rígida; operadores podem desabilitá-las por design.

Em canais com cartões/botões de aprovação nativos, o prompt de runtime agora informa ao
agente para confiar primeiro nessa UI nativa de aprovação. Ele só deve incluir um comando manual
`/approve` quando o resultado da ferramenta disser que aprovações no chat não estão disponíveis ou
que a aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw pode renderizar prompts do sistema menores para subagentes. O runtime define um
`promptMode` para cada execução (não é uma configuração voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Skills**, **Recuperação de memória**, **Autoatualização do OpenClaw**, **Aliases de modelo**, **Identidade do usuário**, **Tags de resposta**,
  **Mensagens**, **Respostas silenciosas** e **Heartbeats**. Ferramentas, **Segurança**,
  Workspace, Sandbox, Data e hora atuais (quando conhecidas), Runtime e contexto
  injetado permanecem disponíveis.
- `none`: retorna apenas a linha base de identidade.

Quando `promptMode=minimal`, prompts extras injetados são rotulados como **Contexto do subagente**
em vez de **Contexto do chat em grupo**.

## Injeção de bootstrap do workspace

Arquivos de bootstrap são aparados e anexados em **Contexto do projeto** para que o modelo veja o contexto de identidade e perfil sem precisar de leituras explícitas:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (apenas em workspaces totalmente novos)
- `MEMORY.md` quando presente; caso contrário, `memory.md` como fallback em minúsculas

Todos esses arquivos são **injetados na janela de contexto** em cada turno, a menos que
um bloqueio específico do arquivo se aplique. `HEARTBEAT.md` é omitido em execuções normais quando
heartbeats estão desabilitados para o agente padrão ou
`agents.defaults.heartbeat.includeSystemPromptSection` é false. Mantenha os arquivos injetados concisos — especialmente `MEMORY.md`, que pode crescer com o tempo e levar a uso de contexto inesperadamente alto e compaction mais frequente.

> **Observação:** arquivos diários `memory/*.md` **não** fazem parte do bootstrap normal de
> Contexto do projeto. Em turnos comuns, eles são acessados sob demanda por meio das
> ferramentas `memory_search` e `memory_get`, então não contam contra a
> janela de contexto a menos que o modelo os leia explicitamente. Turnos simples `/new` e
> `/reset` são a exceção: o runtime pode prefixar memória diária recente
> como um bloco único de contexto de inicialização para esse primeiro turno.

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 12000). O conteúdo total de bootstrap injetado
entre os arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 60000). Arquivos ausentes injetam um marcador curto de arquivo ausente. Quando ocorre
truncamento, o OpenClaw pode injetar um bloco de aviso em Contexto do projeto; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`).

Sessões de subagente injetam apenas `AGENTS.md` e `TOOLS.md` (outros arquivos de bootstrap
são filtrados para manter pequeno o contexto do subagente).

Hooks internos podem interceptar esta etapa via `agent:bootstrap` para mutar ou substituir
os arquivos de bootstrap injetados (por exemplo, trocar `SOUL.md` por uma persona alternativa).

Se você quiser fazer o agente soar menos genérico, comece com
[Guia de personalidade do SOUL.md](/pt-BR/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs. injetado, truncamento, além da sobrecarga do schema de ferramentas), use `/context list` ou `/context detail`. Veja [Contexto](/pt-BR/concepts/context).

## Tratamento de tempo

O prompt do sistema inclui uma seção dedicada **Data e hora atuais** quando o
fuso horário do usuário é conhecido. Para manter o cache do prompt estável, ele agora inclui apenas
o **fuso horário** (sem relógio dinâmico nem formato de hora).

Use `session_status` quando o agente precisar da hora atual; o cartão de status
inclui uma linha de timestamp. A mesma ferramenta pode opcionalmente definir uma substituição de modelo por sessão
(`model=default` a limpa).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Veja [Data e hora](/pt-BR/date-time) para detalhes completos do comportamento.

## Skills

Quando existem skills elegíveis, o OpenClaw injeta uma **lista compacta de skills disponíveis**
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** para cada skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no local listado
(workspace, gerenciado ou empacotado). Se não houver skills elegíveis, a
seção Skills é omitida.

A elegibilidade inclui bloqueios de metadados da skill, verificações de ambiente/configuração em runtime
e a allowlist efetiva de skills do agente quando `agents.defaults.skills` ou
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

Isso mantém pequeno o prompt base e ainda possibilita uso direcionado de skills.

O orçamento da lista de skills pertence ao subsistema de skills:

- Padrão global: `skills.limits.maxSkillsPromptChars`
- Substituição por agente: `agents.list[].skillsLimits.maxSkillsPromptChars`

Trechos genéricos limitados de runtime usam uma superfície diferente:

- `agents.defaults.contextLimits.*`
- `agents.list[].contextLimits.*`

Essa divisão mantém o dimensionamento de skills separado do dimensionamento de leitura/injeção do runtime, como
`memory_get`, resultados de ferramentas ao vivo e atualizações de `AGENTS.md` após compaction.

## Documentação

Quando disponível, o prompt do sistema inclui uma seção **Documentação** que aponta para o
diretório local de documentação do OpenClaw (seja `docs/` no workspace do repositório ou a documentação do
pacote npm empacotado) e também menciona o espelho público, o repositório-fonte, o Discord da comunidade e o
ClawHub ([https://clawhub.ai](https://clawhub.ai)) para descoberta de skills. O prompt instrui o modelo a consultar primeiro a documentação local
para comportamento, comandos, configuração ou arquitetura do OpenClaw, e a executar
`openclaw status` por conta própria quando possível (perguntando ao usuário apenas quando não tiver acesso).
