---
read_when:
    - Adicionar ou modificar skills
    - Alterar o gating de skills ou regras de carregamento
summary: 'Skills: gerenciadas vs workspace, regras de gating e conexão de config/env'
title: Skills
x-i18n:
    generated_at: "2026-04-05T12:56:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6bb0e2e7c2ff50cf19c759ea1da1fd1886dc11f94adc77cbfd816009f75d93ee
    source_path: tools/skills.md
    workflow: 15
---

# Skills (OpenClaw)

O OpenClaw usa pastas de skill **compatíveis com [AgentSkills](https://agentskills.io)** para ensinar o agente a usar ferramentas. Cada skill é um diretório que contém um `SKILL.md` com frontmatter YAML e instruções. O OpenClaw carrega **skills empacotadas** mais substituições locais opcionais, e as filtra no momento do carregamento com base em ambiente, config e presença de binários.

## Locais e precedência

O OpenClaw carrega skills destas fontes:

1. **Pastas extras de skill**: configuradas com `skills.load.extraDirs`
2. **Skills empacotadas**: enviadas com a instalação (pacote npm ou OpenClaw.app)
3. **Skills gerenciadas/locais**: `~/.openclaw/skills`
4. **Skills pessoais do agente**: `~/.agents/skills`
5. **Skills do agente do projeto**: `<workspace>/.agents/skills`
6. **Skills do workspace**: `<workspace>/skills`

Se houver conflito de nome de skill, a precedência é:

`<workspace>/skills` (mais alta) → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → skills empacotadas → `skills.load.extraDirs` (mais baixa)

## Skills por agente vs compartilhadas

Em configurações **multi-agent**, cada agente tem seu próprio workspace. Isso significa:

- **Skills por agente** ficam em `<workspace>/skills` apenas para esse agente.
- **Skills do agente do projeto** ficam em `<workspace>/.agents/skills` e se aplicam a
  esse workspace antes da pasta normal `skills/` do workspace.
- **Skills pessoais do agente** ficam em `~/.agents/skills` e se aplicam entre
  workspaces nessa máquina.
- **Skills compartilhadas** ficam em `~/.openclaw/skills` (gerenciadas/locais) e são visíveis
  para **todos os agentes** na mesma máquina.
- **Pastas compartilhadas** também podem ser adicionadas via `skills.load.extraDirs` (precedência
  mais baixa) se você quiser um pacote comum de skills usado por vários agentes.

Se o mesmo nome de skill existir em mais de um lugar, a precedência usual
se aplica: workspace vence, depois skills do agente do projeto, depois skills pessoais do agente,
depois gerenciadas/locais, depois empacotadas, depois dirs extras.

## Listas de permissão de skill por agente

A **localização** da skill e a **visibilidade** da skill são controles separados.

- Localização/precedência decide qual cópia de uma skill com o mesmo nome vence.
- Listas de permissão do agente decidem quais skills visíveis um agente pode realmente usar.

Use `agents.defaults.skills` para uma base compartilhada, depois substitua por agente com
`agents.list[].skills`:

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // herda github, weather
      { id: "docs", skills: ["docs-search"] }, // substitui os padrões
      { id: "locked-down", skills: [] }, // sem skills
    ],
  },
}
```

Regras:

- Omita `agents.defaults.skills` para skills irrestritas por padrão.
- Omita `agents.list[].skills` para herdar `agents.defaults.skills`.
- Defina `agents.list[].skills: []` para nenhuma skill.
- Uma lista não vazia em `agents.list[].skills` é o conjunto final para esse agente; ela
  não é mesclada com os padrões.

O OpenClaw aplica o conjunto efetivo de skills do agente em toda a construção do prompt, descoberta de slash commands de skill, sincronização de sandbox e snapshots de skill.

## Plugins + skills

Plugins podem enviar suas próprias skills ao listar diretórios `skills` em
`openclaw.plugin.json` (caminhos relativos à raiz do plugin). As skills do plugin são carregadas
quando o plugin está habilitado. Hoje, esses diretórios são mesclados no mesmo
caminho de baixa precedência que `skills.load.extraDirs`, então uma skill empacotada,
gerenciada, de agente ou de workspace com o mesmo nome os substitui.
Você pode controlá-las via `metadata.openclaw.requires.config` na entrada de config
do plugin. Veja [Plugins](/tools/plugin) para descoberta/config e [Tools](/pt-BR/tools) para a
superfície de ferramentas que essas skills ensinam.

## ClawHub (instalação + sincronização)

ClawHub é o registro público de skills para OpenClaw. Navegue em
[https://clawhub.ai](https://clawhub.ai). Use os comandos nativos `openclaw skills`
para descobrir/instalar/atualizar skills, ou a CLI separada `clawhub` quando
você precisar de fluxos de publicação/sincronização.
Guia completo: [ClawHub](/pt-BR/tools/clawhub).

Fluxos comuns:

- Instalar uma skill no seu workspace:
  - `openclaw skills install <skill-slug>`
- Atualizar todas as skills instaladas:
  - `openclaw skills update --all`
- Sincronizar (varredura + publicar atualizações):
  - `clawhub sync --all`

O `openclaw skills install` nativo instala no diretório `skills/` do workspace ativo.
A CLI separada `clawhub` também instala em `./skills` sob seu
diretório de trabalho atual (ou usa como fallback o workspace do OpenClaw configurado).
O OpenClaw reconhece isso como `<workspace>/skills` na próxima sessão.

## Notas de segurança

- Trate skills de terceiros como **código não confiável**. Leia-as antes de habilitar.
- Prefira execuções em sandbox para entradas não confiáveis e ferramentas arriscadas. Veja [Sandboxing](/pt-BR/gateway/sandboxing).
- A descoberta de skills em workspace e diretórios extras aceita apenas raízes de skill e arquivos `SKILL.md` cujo realpath resolvido permaneça dentro da raiz configurada.
- Instalações de dependências de skill com suporte do Gateway (`skills.install`, onboarding e a interface de configurações de Skills) executam o scanner integrado de código perigoso antes de executar metadados do instalador. Achados `critical` bloqueiam por padrão, a menos que o chamador defina explicitamente a substituição de perigoso; achados suspeitos ainda apenas emitem aviso.
- `openclaw skills install <slug>` é diferente: ele baixa uma pasta de skill do ClawHub para o workspace e não usa o caminho de metadados do instalador acima.
- `skills.entries.*.env` e `skills.entries.*.apiKey` injetam segredos no processo **host**
  para aquela rodada do agente (não no sandbox). Mantenha segredos fora de prompts e logs.
- Para um modelo de ameaça mais amplo e checklists, veja [Security](/pt-BR/gateway/security).

## Formato (AgentSkills + compatível com Pi)

`SKILL.md` deve incluir pelo menos:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

Notas:

- Seguimos a especificação AgentSkills para layout/intenção.
- O parser usado pelo agente embutido suporta apenas chaves de frontmatter em **uma única linha**.
- `metadata` deve ser um **objeto JSON em uma única linha**.
- Use `{baseDir}` nas instruções para referenciar o caminho da pasta da skill.
- Chaves opcionais de frontmatter:
  - `homepage` — URL exibida como “Website” na interface de Skills do macOS (também suportada via `metadata.openclaw.homepage`).
  - `user-invocable` — `true|false` (padrão: `true`). Quando `true`, a skill é exposta como um slash command do usuário.
  - `disable-model-invocation` — `true|false` (padrão: `false`). Quando `true`, a skill é excluída do prompt do modelo (ainda disponível via invocação do usuário).
  - `command-dispatch` — `tool` (opcional). Quando definido como `tool`, o slash command ignora o modelo e despacha diretamente para uma ferramenta.
  - `command-tool` — nome da ferramenta a invocar quando `command-dispatch: tool` estiver definido.
  - `command-arg-mode` — `raw` (padrão). Para despacho de ferramenta, encaminha a string bruta de args para a ferramenta (sem parsing pelo core).

    A ferramenta é invocada com params:
    `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.

## Gating (filtros no momento do carregamento)

O OpenClaw **filtra skills no momento do carregamento** usando `metadata` (JSON em uma única linha):

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

Campos em `metadata.openclaw`:

- `always: true` — sempre incluir a skill (ignora outros gates).
- `emoji` — emoji opcional usado pela interface de Skills do macOS.
- `homepage` — URL opcional mostrada como “Website” na interface de Skills do macOS.
- `os` — lista opcional de plataformas (`darwin`, `linux`, `win32`). Se definida, a skill é elegível apenas nesses SOs.
- `requires.bins` — lista; cada item deve existir no `PATH`.
- `requires.anyBins` — lista; pelo menos um item deve existir no `PATH`.
- `requires.env` — lista; a variável de ambiente deve existir **ou** ser fornecida na config.
- `requires.config` — lista de caminhos em `openclaw.json` que devem ser truthy.
- `primaryEnv` — nome da variável de ambiente associada a `skills.entries.<name>.apiKey`.
- `install` — array opcional de especificações de instalador usado pela interface de Skills do macOS (brew/node/go/uv/download).

Observação sobre sandboxing:

- `requires.bins` é verificado no **host** no momento do carregamento da skill.
- Se um agente estiver em sandbox, o binário também deve existir **dentro do container**.
  Instale-o via `agents.defaults.sandbox.docker.setupCommand` (ou uma imagem personalizada).
  `setupCommand` é executado uma vez após a criação do container.
  Instalações de pacotes também exigem saída de rede, FS raiz gravável e um usuário root no sandbox.
  Exemplo: a skill `summarize` (`skills/summarize/SKILL.md`) precisa da CLI `summarize`
  no container sandbox para ser executada lá.

Exemplo de instalador:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

Notas:

- Se vários instaladores estiverem listados, o gateway escolhe uma única opção **preferida** (brew quando disponível, caso contrário node).
- Se todos os instaladores forem `download`, o OpenClaw lista cada entrada para que você possa ver os artefatos disponíveis.
- As especificações do instalador podem incluir `os: ["darwin"|"linux"|"win32"]` para filtrar opções por plataforma.
- Instalações Node respeitam `skills.install.nodeManager` em `openclaw.json` (padrão: npm; opções: npm/pnpm/yarn/bun).
  Isso afeta apenas **instalações de skill**; o runtime do Gateway ainda deve ser Node
  (Bun não é recomendado para WhatsApp/Telegram).
- A seleção de instalador com suporte do Gateway é orientada por preferência, não apenas por node:
  quando as especificações de instalação misturam tipos, o OpenClaw prefere Homebrew quando
  `skills.install.preferBrew` está habilitado e `brew` existe, depois `uv`, depois o
  gerenciador node configurado, depois outros fallbacks como `go` ou `download`.
- Se toda especificação de instalação for `download`, o OpenClaw exibe todas as opções de download
  em vez de reduzi-las a um único instalador preferido.
- Instalações Go: se `go` estiver ausente e `brew` estiver disponível, o gateway instala Go via Homebrew primeiro e define `GOBIN` para o `bin` do Homebrew quando possível.
- Instalações por download: `url` (obrigatório), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (padrão: automático quando um arquivo for detectado), `stripComponents`, `targetDir` (padrão: `~/.openclaw/tools/<skillKey>`).

Se `metadata.openclaw` não estiver presente, a skill sempre será elegível (a menos que
esteja desabilitada na config ou bloqueada por `skills.allowBundled` para skills empacotadas).

## Substituições de config (`~/.openclaw/openclaw.json`)

Skills empacotadas/gerenciadas podem ser ativadas/desativadas e receber valores de env:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // ou string em texto simples
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

Observação: se o nome da skill contiver hífens, coloque a chave entre aspas (JSON5 permite chaves entre aspas).

Se você quiser geração/edição de imagens padrão dentro do próprio OpenClaw, use a
ferramenta core `image_generate` com `agents.defaults.imageGenerationModel` em vez de uma
skill empacotada. Os exemplos de skill aqui são para fluxos personalizados ou de terceiros.

Para análise nativa de imagens, use a ferramenta `image` com `agents.defaults.imageModel`.
Para geração/edição nativa de imagens, use `image_generate` com
`agents.defaults.imageGenerationModel`. Se você escolher `openai/*`, `google/*`,
`fal/*` ou outro modelo de imagem específico de provedor, adicione também a auth/chave de API
desse provedor.

As chaves de config correspondem ao **nome da skill** por padrão. Se uma skill definir
`metadata.openclaw.skillKey`, use essa chave em `skills.entries`.

Regras:

- `enabled: false` desabilita a skill mesmo que ela esteja empacotada/instalada.
- `env`: injetado **somente se** a variável ainda não estiver definida no processo.
- `apiKey`: conveniência para skills que declaram `metadata.openclaw.primaryEnv`.
  Suporta string em texto simples ou objeto SecretRef (`{ source, provider, id }`).
- `config`: bag opcional para campos personalizados por skill; chaves personalizadas devem ficar aqui.
- `allowBundled`: lista de permissão opcional apenas para **skills empacotadas**. Se definida, somente
  skills empacotadas na lista serão elegíveis (skills gerenciadas/workspace não são afetadas).

## Injeção de ambiente (por execução de agente)

Quando uma execução de agente começa, o OpenClaw:

1. Lê os metadados da skill.
2. Aplica qualquer `skills.entries.<key>.env` ou `skills.entries.<key>.apiKey` a
   `process.env`.
3. Constrói o prompt do sistema com as skills **elegíveis**.
4. Restaura o ambiente original após o término da execução.

Isso é **limitado à execução do agente**, não a um ambiente de shell global.

## Snapshot de sessão (desempenho)

O OpenClaw cria um snapshot das skills elegíveis **quando uma sessão começa** e reutiliza essa lista para rodadas subsequentes na mesma sessão. Mudanças em skills ou config entram em vigor na próxima nova sessão.

As skills também podem ser atualizadas no meio da sessão quando o watcher de skills está habilitado ou quando um novo nó remoto elegível aparece (veja abaixo). Pense nisso como um **hot reload**: a lista atualizada é usada na próxima rodada do agente.

Se a lista de permissão efetiva de skills do agente mudar para aquela sessão, o OpenClaw
atualiza o snapshot para que as skills visíveis permaneçam alinhadas com o
agente atual.

## Nós remotos macOS (gateway Linux)

Se o Gateway estiver em execução no Linux, mas um **nó macOS** estiver conectado **com `system.run` permitido** (aprovações de Exec security não definidas como `deny`), o OpenClaw pode tratar skills exclusivas de macOS como elegíveis quando os binários necessários estiverem presentes nesse nó. O agente deve executar essas skills via a ferramenta `exec` com `host=node`.

Isso depende de o nó informar seu suporte a comandos e de uma sondagem de binários via `system.run`. Se o nó macOS ficar offline depois, as skills permanecem visíveis; as invocações podem falhar até que o nó se reconecte.

## Watcher de skills (atualização automática)

Por padrão, o OpenClaw observa pastas de skill e atualiza o snapshot de skills quando arquivos `SKILL.md` mudam. Configure isso em `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

## Impacto em tokens (lista de skills)

Quando as skills são elegíveis, o OpenClaw injeta uma lista XML compacta das skills disponíveis no prompt do sistema (via `formatSkillsForPrompt` em `pi-coding-agent`). O custo é determinístico:

- **Sobrecarga base (somente quando ≥1 skill):** 195 caracteres.
- **Por skill:** 97 caracteres + o comprimento dos valores `<name>`, `<description>` e `<location>` com escape XML.

Fórmula (caracteres):

```
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Notas:

- O escape XML expande `& < > " '` em entidades (`&amp;`, `&lt;`, etc.), aumentando o comprimento.
- A contagem de tokens varia conforme o tokenizer do modelo. Uma estimativa aproximada no estilo OpenAI é ~4 caracteres/token, então **97 caracteres ≈ 24 tokens** por skill, além dos comprimentos reais dos seus campos.

## Ciclo de vida das skills gerenciadas

O OpenClaw envia um conjunto base de skills como **skills empacotadas** como parte da
instalação (pacote npm ou OpenClaw.app). `~/.openclaw/skills` existe para
substituições locais (por exemplo, fixar/aplicar patch a uma skill sem alterar a cópia
empacotada). Skills de workspace pertencem ao usuário e substituem ambas em caso de conflito de nome.

## Referência de config

Veja [Skills config](/tools/skills-config) para o esquema completo de configuração.

## Procurando mais skills?

Navegue em [https://clawhub.ai](https://clawhub.ai).

---

## Relacionados

- [Creating Skills](/pt-BR/tools/creating-skills) — criar skills personalizadas
- [Skills Config](/tools/skills-config) — referência de configuração de skill
- [Slash Commands](/tools/slash-commands) — todos os slash commands disponíveis
- [Plugins](/tools/plugin) — visão geral do sistema de plugins
