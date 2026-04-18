---
read_when:
    - Você precisa explicar o espaço de trabalho do agente ou seu layout de arquivos
    - Você quer fazer backup ou migrar um espaço de trabalho do agente
summary: 'Espaço de trabalho do agente: local, layout e estratégia de backup'
title: Espaço de trabalho do agente
x-i18n:
    generated_at: "2026-04-18T05:24:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd2e74614d8d45df04b1bbda48e2224e778b621803d774d38e4b544195eb234e
    source_path: concepts/agent-workspace.md
    workflow: 15
---

# Espaço de trabalho do agente

O espaço de trabalho é a casa do agente. É o único diretório de trabalho usado para
ferramentas de arquivo e para o contexto do espaço de trabalho. Mantenha-o privado e trate-o como memória.

Isso é separado de `~/.openclaw/`, que armazena configuração, credenciais e
sessões.

**Importante:** o espaço de trabalho é o **cwd padrão**, não um sandbox rígido. As ferramentas
resolvem caminhos relativos em relação ao espaço de trabalho, mas caminhos absolutos ainda podem alcançar
outras partes do host, a menos que o sandboxing esteja ativado. Se você precisar de isolamento, use
[`agents.defaults.sandbox`](/pt-BR/gateway/sandboxing) (e/ou a configuração de sandbox por agente).
Quando o sandboxing está ativado e `workspaceAccess` não é `"rw"`, as ferramentas operam
dentro de um espaço de trabalho em sandbox em `~/.openclaw/sandboxes`, e não no seu espaço de trabalho do host.

## Local padrão

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
espaço de trabalho e preencherão os arquivos de bootstrap se eles estiverem ausentes.
Cópias de seed de sandbox aceitam apenas arquivos regulares dentro do espaço de trabalho; aliases de symlink/hardlink
que resolvem para fora do espaço de trabalho de origem são ignorados.

Se você já gerencia os arquivos do espaço de trabalho por conta própria, pode desativar a criação de arquivos de bootstrap:

```json5
{ agent: { skipBootstrap: true } }
```

## Pastas extras de espaço de trabalho

Instalações mais antigas podem ter criado `~/openclaw`. Manter vários diretórios de espaço de trabalho
pode causar deriva confusa de autenticação ou estado, porque apenas um
espaço de trabalho fica ativo por vez.

**Recomendação:** mantenha um único espaço de trabalho ativo. Se você não usa mais as
pastas extras, arquive-as ou mova-as para a Lixeira (por exemplo `trash ~/openclaw`).
Se você intencionalmente mantém vários espaços de trabalho, certifique-se de que
`agents.defaults.workspace` aponte para o ativo.

`openclaw doctor` avisa quando detecta diretórios extras de espaço de trabalho.

## Mapa de arquivos do espaço de trabalho (o que cada arquivo significa)

Estes são os arquivos padrão que o OpenClaw espera dentro do espaço de trabalho:

- `AGENTS.md`
  - Instruções operacionais para o agente e como ele deve usar a memória.
  - Carregado no início de toda sessão.
  - Bom lugar para regras, prioridades e detalhes de “como se comportar”.

- `SOUL.md`
  - Persona, tom e limites.
  - Carregado em toda sessão.
  - Guia: [Guia de personalidade do SOUL.md](/pt-BR/concepts/soul)

- `USER.md`
  - Quem é o usuário e como se dirigir a ele.
  - Carregado em toda sessão.

- `IDENTITY.md`
  - O nome, a vibe e o emoji do agente.
  - Criado/atualizado durante o ritual de bootstrap.

- `TOOLS.md`
  - Notas sobre suas ferramentas locais e convenções.
  - Não controla a disponibilidade de ferramentas; é apenas orientação.

- `HEARTBEAT.md`
  - Pequeno checklist opcional para execuções de Heartbeat.
  - Mantenha-o curto para evitar consumo de tokens.

- `BOOT.md`
  - Checklist opcional de inicialização executado na reinicialização do gateway quando hooks internos estão ativados.
  - Mantenha-o curto; use a ferramenta de mensagem para envios de saída.

- `BOOTSTRAP.md`
  - Ritual único da primeira execução.
  - Criado apenas para um espaço de trabalho totalmente novo.
  - Exclua-o depois que o ritual estiver concluído.

- `memory/YYYY-MM-DD.md`
  - Log diário de memória (um arquivo por dia).
  - Recomenda-se ler o de hoje + o de ontem no início da sessão.

- `MEMORY.md` (opcional)
  - Memória de longo prazo curada.
  - Carregue apenas na sessão principal e privada (não em contextos compartilhados/de grupo).

Consulte [Memória](/pt-BR/concepts/memory) para o fluxo de trabalho e o flush automático de memória.

- `skills/` (opcional)
  - Skills específicos do espaço de trabalho.
  - Local de Skills com maior precedência para esse espaço de trabalho.
  - Sobrescreve skills de agente do projeto, skills de agente pessoais, skills gerenciados, skills empacotados e `skills.load.extraDirs` quando os nomes entram em conflito.

- `canvas/` (opcional)
  - Arquivos da UI Canvas para exibições de Node (por exemplo `canvas/index.html`).

Se algum arquivo de bootstrap estiver ausente, o OpenClaw injeta um marcador de “arquivo ausente” na
sessão e continua. Arquivos grandes de bootstrap são truncados quando injetados;
ajuste os limites com `agents.defaults.bootstrapMaxChars` (padrão: 12000) e
`agents.defaults.bootstrapTotalMaxChars` (padrão: 60000).
`openclaw setup` pode recriar padrões ausentes sem sobrescrever
arquivos existentes.

## O que NÃO está no espaço de trabalho

Estes ficam em `~/.openclaw/` e NÃO devem ser versionados no repositório do espaço de trabalho:

- `~/.openclaw/openclaw.json` (configuração)
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (perfis de autenticação de modelo: OAuth + chaves de API)
- `~/.openclaw/credentials/` (estado de canal/provedor mais dados legados de importação OAuth)
- `~/.openclaw/agents/<agentId>/sessions/` (transcrições de sessão + metadados)
- `~/.openclaw/skills/` (skills gerenciados)

Se você precisar migrar sessões ou configuração, copie-as separadamente e mantenha-as
fora do controle de versão.

## Backup com Git (recomendado, privado)

Trate o espaço de trabalho como memória privada. Coloque-o em um repositório git **privado** para que tenha
backup e possa ser recuperado.

Execute estas etapas na máquina em que o Gateway roda (é lá que o
espaço de trabalho fica).

### 1) Inicialize o repositório

Se o git estiver instalado, espaços de trabalho totalmente novos são inicializados automaticamente. Se este
espaço de trabalho ainda não for um repositório, execute:

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md SOUL.md TOOLS.md IDENTITY.md USER.md HEARTBEAT.md memory/
git commit -m "Add agent workspace"
```

### 2) Adicione um remote privado (opções amigáveis para iniciantes)

Opção A: interface web do GitHub

1. Crie um novo repositório **privado** no GitHub.
2. Não inicialize com um README (evita conflitos de merge).
3. Copie a URL HTTPS do remote.
4. Adicione o remote e faça o push:

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
3. Copie a URL HTTPS do remote.
4. Adicione o remote e faça o push:

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

## Não versione segredos

Mesmo em um repositório privado, evite armazenar segredos no espaço de trabalho:

- Chaves de API, tokens OAuth, senhas ou credenciais privadas.
- Qualquer coisa em `~/.openclaw/`.
- Dumps brutos de chats ou anexos sensíveis.

Se você precisar armazenar referências sensíveis, use placeholders e mantenha o segredo real em outro lugar
(gerenciador de senhas, variáveis de ambiente ou `~/.openclaw/`).

Sugestão de `.gitignore` inicial:

```gitignore
.DS_Store
.env
**/*.key
**/*.pem
**/secrets*
```

## Movendo o espaço de trabalho para uma nova máquina

1. Clone o repositório para o caminho desejado (o padrão é `~/.openclaw/workspace`).
2. Defina `agents.defaults.workspace` para esse caminho em `~/.openclaw/openclaw.json`.
3. Execute `openclaw setup --workspace <path>` para preencher quaisquer arquivos ausentes.
4. Se você precisar das sessões, copie `~/.openclaw/agents/<agentId>/sessions/` da
   máquina antiga separadamente.

## Notas avançadas

- O roteamento multiagente pode usar diferentes espaços de trabalho por agente. Consulte
  [Roteamento de canais](/pt-BR/channels/channel-routing) para a configuração de roteamento.
- Se `agents.defaults.sandbox` estiver ativado, sessões que não sejam a principal podem usar
  espaços de trabalho em sandbox por sessão em `agents.defaults.sandbox.workspaceRoot`.

## Relacionados

- [Standing Orders](/pt-BR/automation/standing-orders) — instruções persistentes em arquivos do espaço de trabalho
- [Heartbeat](/pt-BR/gateway/heartbeat) — arquivo `HEARTBEAT.md` do espaço de trabalho
- [Sessão](/pt-BR/concepts/session) — caminhos de armazenamento de sessão
- [Sandboxing](/pt-BR/gateway/sandboxing) — acesso ao espaço de trabalho em ambientes com sandbox
