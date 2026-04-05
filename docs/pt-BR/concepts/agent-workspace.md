---
read_when:
    - Você precisa explicar o workspace do agente ou seu layout de arquivos
    - Você quer fazer backup ou migrar um workspace de agente
summary: 'Workspace do agente: localização, layout e estratégia de backup'
title: Workspace do agente
x-i18n:
    generated_at: "2026-04-05T12:39:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3735633f1098c733415369f9836fdbbc0bf869636a24ed42e95e6784610d964a
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# Workspace do agente

O workspace é a casa do agente. É o único diretório de trabalho usado para
ferramentas de arquivo e para o contexto do workspace. Mantenha-o privado e trate-o como memória.

Isso é separado de `~/.openclaw/`, que armazena configuração, credenciais e
sessões.

**Importante:** o workspace é o **cwd padrão**, não um sandbox rígido. As ferramentas
resolvem caminhos relativos em relação ao workspace, mas caminhos absolutos ainda podem alcançar
outros locais no host, a menos que o sandboxing esteja habilitado. Se você precisar de isolamento, use
[`agents.defaults.sandbox`](/gateway/sandboxing) (e/ou configuração de sandbox por agente).
Quando o sandboxing está habilitado e `workspaceAccess` não é `"rw"`, as ferramentas operam
dentro de um workspace em sandbox em `~/.openclaw/sandboxes`, e não no workspace do seu host.

## Localização padrão

- Padrão: `~/.openclaw/workspace`
- Se `OPENCLAW_PROFILE` estiver definido e não for `"default"`, o padrão passa a ser
  `~/.openclaw/workspace-<profile>`.
- Substitua em `~/.openclaw/openclaw.json`:

```json5
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
}
```

`openclaw onboard`, `openclaw configure` ou `openclaw setup` criarão o
workspace e semearão os arquivos de bootstrap se estiverem ausentes.
Cópias de semente de sandbox aceitam apenas arquivos regulares dentro do workspace; aliases de symlink/hardlink
que resolvem fora do workspace de origem são ignorados.

Se você já gerencia os arquivos do workspace por conta própria, pode desabilitar
a criação de arquivos de bootstrap:

```json5
{ agent: { skipBootstrap: true } }
```

## Pastas extras de workspace

Instalações mais antigas podem ter criado `~/openclaw`. Manter vários diretórios de workspace
pode causar divergência confusa de autenticação ou estado, porque apenas um
workspace fica ativo por vez.

**Recomendação:** mantenha um único workspace ativo. Se você não usa mais as
pastas extras, arquive-as ou mova-as para a Lixeira (por exemplo `trash ~/openclaw`).
Se você intencionalmente mantém vários workspaces, verifique se
`agents.defaults.workspace` aponta para o que está ativo.

`openclaw doctor` avisa quando detecta diretórios extras de workspace.

## Mapa de arquivos do workspace (o que cada arquivo significa)

Estes são os arquivos padrão que o OpenClaw espera dentro do workspace:

- `AGENTS.md`
  - Instruções operacionais para o agente e como ele deve usar a memória.
  - Carregado no início de cada sessão.
  - Bom lugar para regras, prioridades e detalhes de "como se comportar".

- `SOUL.md`
  - Persona, tom e limites.
  - Carregado em toda sessão.
  - Guia: [Guia de personalidade do SOUL.md](/concepts/soul)

- `USER.md`
  - Quem é o usuário e como se dirigir a ele.
  - Carregado em toda sessão.

- `IDENTITY.md`
  - O nome, a vibe e o emoji do agente.
  - Criado/atualizado durante o ritual de bootstrap.

- `TOOLS.md`
  - Observações sobre suas ferramentas locais e convenções.
  - Não controla a disponibilidade de ferramentas; é apenas orientação.

- `HEARTBEAT.md`
  - Pequena checklist opcional para execuções de heartbeat.
  - Mantenha-a curta para evitar gasto de tokens.

- `BOOT.md`
  - Checklist opcional de inicialização executada na reinicialização do gateway quando hooks internos estão habilitados.
  - Mantenha-a curta; use a ferramenta de mensagem para envios de saída.

- `BOOTSTRAP.md`
  - Ritual único da primeira execução.
  - Só é criado para um workspace totalmente novo.
  - Exclua-o depois que o ritual for concluído.

- `memory/YYYY-MM-DD.md`
  - Log diário de memória (um arquivo por dia).
  - Recomenda-se ler hoje + ontem no início da sessão.

- `MEMORY.md` (opcional)
  - Memória de longo prazo curada.
  - Carregue apenas na sessão principal e privada (não em contextos compartilhados/de grupo).

Consulte [Memória](/concepts/memory) para o fluxo de trabalho e o flush automático de memória.

- `skills/` (opcional)
  - Skills específicas do workspace.
  - Local de Skills com maior precedência para esse workspace.
  - Substitui Skills de agente do projeto, Skills pessoais do agente, Skills gerenciadas, Skills incluídas e `skills.load.extraDirs` quando há colisão de nomes.

- `canvas/` (opcional)
  - Arquivos de UI de canvas para exibições de nós (por exemplo `canvas/index.html`).

Se qualquer arquivo de bootstrap estiver ausente, o OpenClaw injeta um marcador de "arquivo ausente" na
sessão e continua. Arquivos grandes de bootstrap são truncados quando injetados;
ajuste os limites com `agents.defaults.bootstrapMaxChars` (padrão: 20000) e
`agents.defaults.bootstrapTotalMaxChars` (padrão: 150000).
`openclaw setup` pode recriar padrões ausentes sem sobrescrever arquivos
existentes.

## O que NÃO está no workspace

Estes ficam em `~/.openclaw/` e NÃO devem ser commitados no repositório do workspace:

- `~/.openclaw/openclaw.json` (configuração)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfis de autenticação de modelo: OAuth + chaves de API)
- `~/.openclaw/credentials/` (estado de canal/provedor mais dados legados de importação de OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transcrições de sessão + metadados)
- `~/.openclaw/skills/` (Skills gerenciadas)

Se você precisar migrar sessões ou configuração, copie-as separadamente e mantenha-as
fora do controle de versão.

## Backup com Git (recomendado, privado)

Trate o workspace como memória privada. Coloque-o em um repositório git **privado** para que ele tenha
backup e possa ser recuperado.

Execute estas etapas na máquina em que o Gateway é executado (é lá que o
workspace fica).

### 1) Inicialize o repositório

Se o git estiver instalado, workspaces totalmente novos são inicializados automaticamente. Se este
workspace ainda não for um repositório, execute:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Adicione um remoto privado (opções amigáveis para iniciantes)

Opção A: interface web do GitHub

1. Crie um novo repositório **privado** no GitHub.
2. Não inicialize com um README (evita conflitos de merge).
3. Copie a URL remota HTTPS.
4. Adicione o remoto e faça push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

Opção B: GitHub CLI (`gh`)

```bash
gh auth login
gh repo create openclaw-workspace --private --source . --remote origin --push
```

Opção C: interface web do GitLab

1. Crie um novo repositório **privado** no GitLab.
2. Não inicialize com um README (evita conflitos de merge).
3. Copie a URL remota HTTPS.
4. Adicione o remoto e faça push:

```bash
git branch -M main
git remote add origin <https-url>
git push -u origin main
```

### 3) Atualizações contínuas

```bash
git status
git add .
git commit -m "Update memory"
git push
```

## Não faça commit de segredos

Mesmo em um repositório privado, evite armazenar segredos no workspace:

- Chaves de API, tokens OAuth, senhas ou credenciais privadas.
- Qualquer coisa em `~/.openclaw/`.
- Dumps brutos de chats ou anexos sensíveis.

Se você precisar armazenar referências sensíveis, use placeholders e mantenha o
segredo real em outro lugar (gerenciador de senhas, variáveis de ambiente ou `~/.openclaw/`).

Sugestão de `.gitignore` inicial:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Movendo o workspace para uma nova máquina

1. Clone o repositório no caminho desejado (padrão `~/.openclaw/workspace`).
2. Defina `agents.defaults.workspace` para esse caminho em `~/.openclaw/openclaw.json`.
3. Execute `openclaw setup --workspace <path>` para semear qualquer arquivo ausente.
4. Se precisar de sessões, copie `~/.openclaw/agents/<agentId>/sessions/` da
   máquina antiga separadamente.

## Observações avançadas

- O roteamento de múltiplos agentes pode usar workspaces diferentes por agente. Consulte
  [Roteamento de canal](/channels/channel-routing) para configuração de roteamento.
- Se `agents.defaults.sandbox` estiver habilitado, sessões que não sejam a principal podem usar
  workspaces por sessão em sandbox em `agents.defaults.sandbox.workspaceRoot`.

## Relacionados

- [Standing Orders](/automation/standing-orders) — instruções persistentes em arquivos do workspace
- [Heartbeat](/gateway/heartbeat) — arquivo de workspace HEARTBEAT.md
- [Sessão](/concepts/session) — caminhos de armazenamento de sessão
- [Sandboxing](/gateway/sandboxing) — acesso ao workspace em ambientes com sandbox
