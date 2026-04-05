---
read_when:
    - Editando o texto do prompt de sistema, a lista de ferramentas ou as seções de horário/heartbeat
    - Alterando o comportamento de bootstrap do workspace ou de injeção de Skills
summary: O que o prompt de sistema do OpenClaw contém e como ele é montado
title: Prompt de sistema
x-i18n:
    generated_at: "2026-04-05T12:40:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: f86b2fa496b183b64e86e6ddc493e4653ff8c9727d813fe33c8f8320184d022f
    source_path: concepts/system-prompt.md
    workflow: 15
---

# Prompt de sistema

O OpenClaw cria um prompt de sistema personalizado para cada execução do agente. O prompt é **de propriedade do OpenClaw** e não usa o prompt padrão do pi-coding-agent.

O prompt é montado pelo OpenClaw e injetado em cada execução do agente.

## Estrutura

O prompt é intencionalmente compacto e usa seções fixas:

- **Tooling**: lista atual de ferramentas + descrições curtas.
- **Safety**: lembrete curto de proteção para evitar comportamento de busca de poder ou de contornar supervisão.
- **Skills** (quando disponíveis): informa ao modelo como carregar instruções de Skills sob demanda.
- **OpenClaw Self-Update**: como inspecionar a configuração com segurança usando
  `config.schema.lookup`, aplicar patches na configuração com `config.patch`, substituir a configuração completa com `config.apply` e executar `update.run` somente mediante solicitação explícita do usuário. A ferramenta `gateway`, restrita ao proprietário, também se recusa a reescrever
  `tools.exec.ask` / `tools.exec.security`, incluindo aliases legados `tools.bash.*`
  que são normalizados para esses caminhos protegidos de exec.
- **Workspace**: diretório de trabalho (`agents.defaults.workspace`).
- **Documentation**: caminho local para a documentação do OpenClaw (repositório ou pacote npm) e quando lê-la.
- **Workspace Files (injected)**: indica que arquivos de bootstrap estão incluídos abaixo.
- **Sandbox** (quando ativado): indica runtime em sandbox, caminhos do sandbox e se exec elevado está disponível.
- **Current Date & Time**: horário local do usuário, fuso horário e formato de hora.
- **Reply Tags**: sintaxe opcional de tags de resposta para provedores compatíveis.
- **Heartbeats**: prompt de heartbeat e comportamento de ack.
- **Runtime**: host, SO, node, modelo, raiz do repositório (quando detectada), nível de thinking (uma linha).
- **Reasoning**: nível atual de visibilidade + dica para alternar com /reasoning.

A seção Tooling também inclui orientação de runtime para trabalho de longa duração:

- use cron para acompanhamentos futuros (`check back later`, lembretes, trabalho recorrente)
  em vez de loops de espera com `exec`, truques de atraso com `yieldMs` ou polling repetido de `process`
- use `exec` / `process` apenas para comandos que começam agora e continuam em execução
  em segundo plano
- quando o despertar automático ao concluir estiver ativado, inicie o comando uma vez e dependa do
  caminho de despertar baseado em push quando ele emitir saída ou falhar
- use `process` para logs, status, entrada ou intervenção quando precisar
  inspecionar um comando em execução
- se a tarefa for maior, prefira `sessions_spawn`; a conclusão do subagente é
  baseada em push e é anunciada automaticamente de volta ao solicitante
- não faça polling de `subagents list` / `sessions_list` em loop apenas para aguardar
  a conclusão

As proteções de segurança no prompt de sistema são consultivas. Elas orientam o comportamento do modelo, mas não impõem política. Use política de ferramentas, aprovações de exec, sandbox e listas de permissões de canais para aplicação rígida; por design, operadores podem desativar essas proteções.

Em canais com cards/botões de aprovação nativos, o prompt de runtime agora informa ao
agente para depender primeiro dessa UI nativa de aprovação. Ele só deve incluir um comando manual
`/approve` quando o resultado da ferramenta disser que aprovações no chat não estão disponíveis ou
que a aprovação manual é o único caminho.

## Modos de prompt

O OpenClaw pode renderizar prompts de sistema menores para subagentes. O runtime define um
`promptMode` para cada execução (não é uma configuração voltada ao usuário):

- `full` (padrão): inclui todas as seções acima.
- `minimal`: usado para subagentes; omite **Skills**, **Memory Recall**, **OpenClaw
  Self-Update**, **Model Aliases**, **User Identity**, **Reply Tags**,
  **Messaging**, **Silent Replies** e **Heartbeats**. Tooling, **Safety**,
  Workspace, Sandbox, Current Date & Time (quando conhecido), Runtime e contexto
  injetado permanecem disponíveis.
- `none`: retorna apenas a linha base de identidade.

Quando `promptMode=minimal`, prompts extras injetados são rotulados como **Subagent
Context** em vez de **Group Chat Context**.

## Injeção de bootstrap do workspace

Arquivos de bootstrap são recortados e anexados em **Project Context** para que o modelo veja contexto de identidade e perfil sem precisar lê-los explicitamente:

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (somente em workspaces totalmente novos)
- `MEMORY.md` quando presente; caso contrário, `memory.md` como fallback em minúsculas

Todos esses arquivos são **injetados na janela de contexto** em cada turno, o que
significa que consomem tokens. Mantenha-os concisos — especialmente `MEMORY.md`, que pode
crescer com o tempo e levar a uso de contexto inesperadamente alto e compactação mais frequente.

> **Observação:** arquivos diários `memory/*.md` **não** são injetados automaticamente. Eles
> são acessados sob demanda via as ferramentas `memory_search` e `memory_get`, portanto não
> contam contra a janela de contexto a menos que o modelo os leia explicitamente.

Arquivos grandes são truncados com um marcador. O tamanho máximo por arquivo é controlado por
`agents.defaults.bootstrapMaxChars` (padrão: 20000). O conteúdo total injetado de bootstrap
entre os arquivos é limitado por `agents.defaults.bootstrapTotalMaxChars`
(padrão: 150000). Arquivos ausentes injetam um pequeno marcador de arquivo ausente. Quando ocorre truncamento,
o OpenClaw pode injetar um bloco de aviso em Project Context; controle isso com
`agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`;
padrão: `once`).

Sessões de subagente injetam apenas `AGENTS.md` e `TOOLS.md` (outros arquivos de bootstrap
são filtrados para manter o contexto do subagente pequeno).

Hooks internos podem interceptar esta etapa via `agent:bootstrap` para mutar ou substituir
os arquivos de bootstrap injetados (por exemplo, trocar `SOUL.md` por uma persona alternativa).

Se você quiser fazer o agente soar menos genérico, comece com o
[Guia de personalidade do SOUL.md](/concepts/soul).

Para inspecionar quanto cada arquivo injetado contribui (bruto vs injetado, truncamento, além da sobrecarga do esquema de ferramentas), use `/context list` ou `/context detail`. Consulte [Context](/concepts/context).

## Tratamento de horário

O prompt de sistema inclui uma seção dedicada **Current Date & Time** quando o
fuso horário do usuário é conhecido. Para manter o cache do prompt estável, ele agora inclui apenas
o **fuso horário** (sem relógio dinâmico nem formato de hora).

Use `session_status` quando o agente precisar da hora atual; o card de status
inclui uma linha com timestamp. A mesma ferramenta também pode opcionalmente definir uma
substituição de modelo por sessão (`model=default` a limpa).

Configure com:

- `agents.defaults.userTimezone`
- `agents.defaults.timeFormat` (`auto` | `12` | `24`)

Consulte [Date & Time](/date-time) para os detalhes completos de comportamento.

## Skills

Quando existem Skills elegíveis, o OpenClaw injeta uma **lista compacta de Skills disponíveis**
(`formatSkillsForPrompt`) que inclui o **caminho do arquivo** para cada Skill. O
prompt instrui o modelo a usar `read` para carregar o SKILL.md no local listado
(workspace, gerenciado ou integrado). Se não houver Skills elegíveis, a
seção Skills será omitida.

A elegibilidade inclui verificadores de metadados de Skills, verificações de ambiente/configuração de runtime
e a lista efetiva de permissões de Skills do agente quando `agents.defaults.skills` ou
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

Isso mantém o prompt base pequeno, ainda permitindo uso direcionado de Skills.

## Documentation

Quando disponível, o prompt de sistema inclui uma seção **Documentation** que aponta para o
diretório local da documentação do OpenClaw (seja `docs/` no workspace do repositório ou a documentação integrada
do pacote npm) e também menciona o espelho público, o repositório de origem, o Discord da comunidade e o
ClawHub ([https://clawhub.ai](https://clawhub.ai)) para descoberta de Skills. O prompt instrui o modelo a consultar primeiro a documentação local
para comportamento, comandos, configuração ou arquitetura do OpenClaw e a executar
`openclaw status` por conta própria quando possível (perguntando ao usuário apenas quando não tiver acesso).
