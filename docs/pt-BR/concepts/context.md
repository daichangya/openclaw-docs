---
read_when:
    - Você quer entender o que “contexto” significa no OpenClaw
    - Você está depurando por que o modelo “sabe” algo (ou esqueceu)
    - Você quer reduzir a sobrecarga de contexto (`/context`, `/status`, `/compact`)
summary: 'Contexto: o que o modelo vê, como ele é montado e como inspecioná-lo'
title: Contexto
x-i18n:
    generated_at: "2026-04-05T12:39:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a75b4cd65bf6385d46265b9ce1643310bc99d220e35ec4b4924096bed3ca4aa0
    source_path: concepts/context.md
    workflow: 15
---

# Contexto

“Contexto” é **tudo o que o OpenClaw envia ao modelo em uma execução**. Ele é limitado pela **janela de contexto** do modelo (limite de tokens).

Modelo mental para iniciantes:

- **Prompt de sistema** (construído pelo OpenClaw): regras, ferramentas, lista de Skills, tempo/runtime e arquivos do workspace injetados.
- **Histórico da conversa**: suas mensagens + as mensagens do assistente para esta sessão.
- **Chamadas/resultados de ferramenta + anexos**: saída de comando, leituras de arquivo, imagens/áudio etc.

Contexto _não é a mesma coisa_ que “memória”: a memória pode ser armazenada em disco e recarregada depois; contexto é o que está dentro da janela atual do modelo.

## Início rápido (inspecionar contexto)

- `/status` → visão rápida de “quão cheia está minha janela?” + configurações da sessão.
- `/context list` → o que está injetado + tamanhos aproximados (por arquivo + totais).
- `/context detail` → detalhamento mais profundo: tamanhos por arquivo, por schema de ferramenta, por entrada de Skill e tamanho do prompt de sistema.
- `/usage tokens` → acrescenta um rodapé de uso por resposta às respostas normais.
- `/compact` → resume o histórico mais antigo em uma entrada compacta para liberar espaço na janela.

Veja também: [Comandos de barra](/tools/slash-commands), [Uso de tokens e custos](/reference/token-use), [Compactação](/concepts/compaction).

## Exemplo de saída

Os valores variam por modelo, provedor, política de ferramentas e o que existe no seu workspace.

### `/context list`

```
🧠 Detalhamento do contexto
Workspace: <workspaceDir>
Bootstrap máximo/arquivo: 20,000 chars
Sandbox: mode=non-main sandboxed=false
Prompt de sistema (execução): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Arquivos de workspace injetados:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Lista de Skills (texto do prompt de sistema): 2,184 chars (~546 tok) (12 Skills)
Ferramentas: read, edit, write, exec, process, browser, message, sessions_send, …
Lista de ferramentas (texto do prompt de sistema): 1,032 chars (~258 tok)
Schemas de ferramentas (JSON): 31,988 chars (~7,997 tok) (conta no contexto; não mostrado como texto)
Ferramentas: (mesmo que acima)

Tokens da sessão (em cache): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Detalhamento do contexto (detalhado)
…
Principais Skills (tamanho da entrada no prompt):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Principais ferramentas (tamanho do schema):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

## O que conta para a janela de contexto

Tudo o que o modelo recebe conta, incluindo:

- Prompt de sistema (todas as seções).
- Histórico da conversa.
- Chamadas de ferramenta + resultados de ferramenta.
- Anexos/transcrições (imagens/áudio/arquivos).
- Resumos de compactação e artefatos de pruning.
- “Wrappers” do provedor ou cabeçalhos ocultos (não visíveis, mas ainda contabilizados).

## Como o OpenClaw monta o prompt de sistema

O prompt de sistema é **de propriedade do OpenClaw** e é reconstruído a cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas.
- Lista de Skills (somente metadados; veja abaixo).
- Localização do workspace.
- Hora (UTC + horário do usuário convertido, se configurado).
- Metadados de runtime (host/OS/modelo/thinking).
- Arquivos bootstrap do workspace injetados em **Project Context**.

Detalhamento completo: [Prompt de sistema](/concepts/system-prompt).

## Arquivos de workspace injetados (Project Context)

Por padrão, o OpenClaw injeta um conjunto fixo de arquivos do workspace (se existirem):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (somente na primeira execução)

Arquivos grandes são truncados por arquivo usando `agents.defaults.bootstrapMaxChars` (padrão `20000` chars). O OpenClaw também aplica um limite total de injeção de bootstrap entre arquivos com `agents.defaults.bootstrapTotalMaxChars` (padrão `150000` chars). `/context` mostra os tamanhos **raw vs injected** e se houve truncamento.

Quando ocorre truncamento, o runtime pode injetar um bloco de aviso dentro do prompt em Project Context. Configure isso com `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; padrão `once`).

## Skills: injetadas vs carregadas sob demanda

O prompt de sistema inclui uma **lista compacta de Skills** (nome + descrição + localização). Essa lista tem sobrecarga real.

As instruções de Skill _não_ são incluídas por padrão. Espera-se que o modelo faça `read` no `SKILL.md` da Skill **somente quando necessário**.

## Ferramentas: há dois custos

As ferramentas afetam o contexto de duas formas:

1. **Texto da lista de ferramentas** no prompt de sistema (o que você vê como “Tooling”).
2. **Schemas de ferramentas** (JSON). Eles são enviados ao modelo para que ele possa chamar ferramentas. Eles contam para o contexto mesmo que você não os veja como texto simples.

`/context detail` detalha os maiores schemas de ferramenta para que você veja o que domina.

## Comandos, diretivas e "atalhos inline"

Comandos de barra são tratados pelo Gateway. Há alguns comportamentos diferentes:

- **Comandos autônomos**: uma mensagem que é apenas `/...` é executada como comando.
- **Diretivas**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` são removidas antes de o modelo ver a mensagem.
  - Mensagens somente com diretivas persistem configurações da sessão.
  - Diretivas inline em uma mensagem normal atuam como dicas por mensagem.
- **Atalhos inline** (somente remetentes na allowlist): certos tokens `/...` dentro de uma mensagem normal podem ser executados imediatamente (exemplo: “hey /status”) e são removidos antes de o modelo ver o texto restante.

Detalhes: [Comandos de barra](/tools/slash-commands).

## Sessões, compactação e pruning (o que persiste)

O que persiste entre mensagens depende do mecanismo:

- **Histórico normal** persiste na transcrição da sessão até ser compactado/removido por política.
- **Compactação** persiste um resumo na transcrição e mantém mensagens recentes intactas.
- **Pruning** remove resultados antigos de ferramenta do prompt _em memória_ para uma execução, mas não reescreve a transcrição.

Documentação: [Sessão](/concepts/session), [Compactação](/concepts/compaction), [Pruning de sessão](/concepts/session-pruning).

Por padrão, o OpenClaw usa o mecanismo de contexto integrado `legacy` para montagem e
compactação. Se você instalar um plugin que forneça `kind: "context-engine"` e
selecioná-lo com `plugins.slots.contextEngine`, o OpenClaw delega a montagem de contexto,
`/compact` e hooks relacionados do ciclo de vida de contexto de subagente a esse
mecanismo. `ownsCompaction: false` não recai automaticamente para o mecanismo
legado; o mecanismo ativo ainda precisa implementar `compact()` corretamente. Veja
[Context Engine](/concepts/context-engine) para a interface conectável completa,
hooks de ciclo de vida e configuração.

## O que `/context` realmente informa

`/context` prefere o relatório mais recente de prompt de sistema **montado em execução**, quando disponível:

- `System prompt (run)` = capturado da última execução embutida (com suporte a ferramentas) e persistido no armazenamento da sessão.
- `System prompt (estimate)` = calculado em tempo real quando não existe relatório de execução (ou ao executar via um backend de CLI que não gera o relatório).

De qualquer forma, ele informa tamanhos e principais contribuintes; ele **não** despeja o prompt de sistema completo nem os schemas de ferramentas.

## Relacionado

- [Context Engine](/concepts/context-engine) — injeção de contexto personalizada por plugins
- [Compactação](/concepts/compaction) — resumir conversas longas
- [Prompt de sistema](/concepts/system-prompt) — como o prompt de sistema é montado
- [Loop do agente](/concepts/agent-loop) — o ciclo completo de execução do agente
