---
read_when:
    - Você quer executar ou escrever workflows `.prose`
    - Você quer habilitar o plugin OpenProse
    - Você precisa entender o armazenamento de estado
summary: 'OpenProse: workflows `.prose`, comandos de barra e estado no OpenClaw'
title: OpenProse
x-i18n:
    generated_at: "2026-04-05T12:50:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95f86ed3029c5599b6a6bed1f75b2e10c8808cf7ffa5e33dbfb1801a7f65f405
    source_path: prose.md
    workflow: 15
---

# OpenProse

OpenProse é um formato de workflow portátil, markdown-first, para orquestrar sessões de IA. No OpenClaw, ele é distribuído como um plugin que instala um pacote de Skills do OpenProse e um comando de barra `/prose`. Os programas ficam em arquivos `.prose` e podem gerar vários subagentes com fluxo de controle explícito.

Site oficial: [https://www.prose.md](https://www.prose.md)

## O que ele pode fazer

- Pesquisa + síntese com vários agentes e paralelismo explícito.
- Workflows repetíveis e seguros para aprovações (revisão de código, triagem de incidentes, pipelines de conteúdo).
- Programas `.prose` reutilizáveis que você pode executar em runtimes de agente compatíveis.

## Instalar + habilitar

Plugins empacotados ficam desabilitados por padrão. Habilite o OpenProse:

```bash
openclaw plugins enable open-prose
```

Reinicie o Gateway após habilitar o plugin.

Checkout local/de desenvolvimento: `openclaw plugins install ./path/to/local/open-prose-plugin`

Documentação relacionada: [Plugins](/tools/plugin), [Manifesto de Plugin](/plugins/manifest), [Skills](/tools/skills).

## Comando de barra

O OpenProse registra `/prose` como um comando de skill invocável pelo usuário. Ele é roteado para as instruções da VM do OpenProse e usa ferramentas do OpenClaw nos bastidores.

Comandos comuns:

```
/prose help
/prose run <file.prose>
/prose run <handle/slug>
/prose run <https://example.com/file.prose>
/prose compile <file.prose>
/prose examples
/prose update
```

## Exemplo: um arquivo `.prose` simples

```prose
# Research + synthesis with two agents running in parallel.

input topic: "What should we research?"

agent researcher:
  model: sonnet
  prompt: "You research thoroughly and cite sources."

agent writer:
  model: opus
  prompt: "You write a concise summary."

parallel:
  findings = session: researcher
    prompt: "Research {topic}."
  draft = session: writer
    prompt: "Summarize {topic}."

session "Merge the findings + draft into a final answer."
context: { findings, draft }
```

## Locais dos arquivos

O OpenProse mantém o estado em `.prose/` no seu workspace:

```
.prose/
├── .env
├── runs/
│   └── {YYYYMMDD}-{HHMMSS}-{random}/
│       ├── program.prose
│       ├── state.md
│       ├── bindings/
│       └── agents/
└── agents/
```

Agentes persistentes em nível de usuário ficam em:

```
~/.prose/agents/
```

## Modos de estado

O OpenProse oferece suporte a vários backends de estado:

- **filesystem** (padrão): `.prose/runs/...`
- **in-context**: transitório, para programas pequenos
- **sqlite** (experimental): requer o binário `sqlite3`
- **postgres** (experimental): requer `psql` e uma string de conexão

Observações:

- sqlite/postgres são opt-in e experimentais.
- As credenciais do postgres fluem para os logs do subagente; use um banco de dados dedicado com o menor privilégio possível.

## Programas remotos

`/prose run <handle/slug>` é resolvido para `https://p.prose.md/<handle>/<slug>`.
URLs diretas são buscadas como estão. Isso usa a ferramenta `web_fetch` (ou `exec` para POST).

## Mapeamento para o runtime do OpenClaw

Os programas do OpenProse são mapeados para primitivas do OpenClaw:

| Conceito do OpenProse     | Ferramenta do OpenClaw |
| ------------------------- | ---------------------- |
| Gerar sessão / ferramenta Task | `sessions_spawn` |
| Leitura/gravação de arquivo | `read` / `write` |
| Web fetch                 | `web_fetch`            |

Se a allowlist de ferramentas bloquear essas ferramentas, os programas do OpenProse falharão. Consulte [Configuração de Skills](/tools/skills-config).

## Segurança + aprovações

Trate arquivos `.prose` como código. Revise antes de executar. Use allowlists de ferramentas do OpenClaw e gates de aprovação para controlar efeitos colaterais.

Para workflows determinísticos com aprovação controlada, compare com [Lobster](/tools/lobster).
