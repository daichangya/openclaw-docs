---
read_when:
    - Você quer entender o que “contexto” significa no OpenClaw
    - Você está depurando por que o modelo “sabe” algo (ou esqueceu)
    - Você quer reduzir a sobrecarga de contexto (`/context`, `/status`, `/compact`)
summary: 'Contexto: o que o modelo vê, como ele é criado e como inspecioná-lo'
title: Contexto
x-i18n:
    generated_at: "2026-04-18T05:24:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 477ccb1d9654968d0e904b6846b32b8c14db6b6c0d3d2ec2b7409639175629f9
    source_path: concepts/context.md
    workflow: 15
---

# Contexto

“Contexto” é **tudo o que o OpenClaw envia ao modelo em uma execução**. Ele é limitado pela **janela de contexto** do modelo (limite de tokens).

Modelo mental para iniciantes:

- **Prompt de sistema** (criado pelo OpenClaw): regras, ferramentas, lista de Skills, hora/runtime e arquivos do workspace injetados.
- **Histórico da conversa**: suas mensagens + as mensagens do assistente nesta sessão.
- **Chamadas/resultados de ferramentas + anexos**: saída de comandos, leituras de arquivos, imagens/áudio etc.

Contexto _não é a mesma coisa_ que “memória”: a memória pode ser armazenada em disco e recarregada depois; o contexto é o que está dentro da janela atual do modelo.

## Início rápido (inspecionar contexto)

- `/status` → visão rápida de “quão cheia está minha janela?” + configurações da sessão.
- `/context list` → o que é injetado + tamanhos aproximados (por arquivo + totais).
- `/context detail` → detalhamento mais profundo: tamanhos por arquivo, por schema de ferramenta, por entrada de Skill e tamanho do prompt de sistema.
- `/usage tokens` → adiciona um rodapé de uso por resposta às respostas normais.
- `/compact` → resume o histórico mais antigo em uma entrada compacta para liberar espaço na janela.

Veja também: [Comandos slash](/pt-BR/tools/slash-commands), [Uso de tokens e custos](/pt-BR/reference/token-use), [Compaction](/pt-BR/concepts/compaction).

## Exemplo de saída

Os valores variam conforme o modelo, provedor, política de ferramentas e o que está no seu workspace.

### `/context list`

```
🧠 Detalhamento do contexto
Workspace: <workspaceDir>
Bootstrap máx./arquivo: 12,000 caracteres
Sandbox: mode=non-main sandboxed=false
Prompt de sistema (execução): 38,412 caracteres (~9,603 tok) (Contexto do Projeto 23,901 caracteres (~5,976 tok))

Arquivos do workspace injetados:
- AGENTS.md: OK | bruto 1,742 caracteres (~436 tok) | injetado 1,742 caracteres (~436 tok)
- SOUL.md: OK | bruto 912 caracteres (~228 tok) | injetado 912 caracteres (~228 tok)
- TOOLS.md: TRUNCADO | bruto 54,210 caracteres (~13,553 tok) | injetado 20,962 caracteres (~5,241 tok)
- IDENTITY.md: OK | bruto 211 caracteres (~53 tok) | injetado 211 caracteres (~53 tok)
- USER.md: OK | bruto 388 caracteres (~97 tok) | injetado 388 caracteres (~97 tok)
- HEARTBEAT.md: AUSENTE | bruto 0 | injetado 0
- BOOTSTRAP.md: OK | bruto 0 caracteres (~0 tok) | injetado 0 caracteres (~0 tok)

Lista de Skills (texto do prompt de sistema): 2,184 caracteres (~546 tok) (12 Skills)
Ferramentas: read, edit, write, exec, process, browser, message, sessions_send, …
Lista de ferramentas (texto do prompt de sistema): 1,032 caracteres (~258 tok)
Schemas das ferramentas (JSON): 31,988 caracteres (~7,997 tok) (contam para o contexto; não exibidos como texto)
Ferramentas: (mesmas acima)

Tokens da sessão (em cache): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Detalhamento do contexto (detalhado)
…
Principais Skills (tamanho da entrada no prompt):
- frontend-design: 412 caracteres (~103 tok)
- oracle: 401 caracteres (~101 tok)
… (+10 mais Skills)

Principais ferramentas (tamanho do schema):
- browser: 9,812 caracteres (~2,453 tok)
- exec: 6,240 caracteres (~1,560 tok)
… (+N mais ferramentas)
```

## O que conta para a janela de contexto

Tudo o que o modelo recebe conta, incluindo:

- Prompt de sistema (todas as seções).
- Histórico da conversa.
- Chamadas de ferramentas + resultados de ferramentas.
- Anexos/transcrições (imagens/áudio/arquivos).
- Resumos de Compaction e artefatos de pruning.
- “Wrappers” do provedor ou cabeçalhos ocultos (não visíveis, mas ainda contam).

## Como o OpenClaw cria o prompt de sistema

O prompt de sistema é **de propriedade do OpenClaw** e reconstruído a cada execução. Ele inclui:

- Lista de ferramentas + descrições curtas.
- Lista de Skills (somente metadados; veja abaixo).
- Localização do workspace.
- Hora (UTC + hora convertida do usuário, se configurada).
- Metadados de runtime (host/OS/modelo/thinking).
- Arquivos bootstrap do workspace injetados em **Contexto do Projeto**.

Detalhamento completo: [Prompt de sistema](/pt-BR/concepts/system-prompt).

## Arquivos do workspace injetados (Contexto do Projeto)

Por padrão, o OpenClaw injeta um conjunto fixo de arquivos do workspace (se presentes):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (somente na primeira execução)

Arquivos grandes são truncados por arquivo usando `agents.defaults.bootstrapMaxChars` (padrão `12000` caracteres). O OpenClaw também aplica um limite total de injeção de bootstrap entre arquivos com `agents.defaults.bootstrapTotalMaxChars` (padrão `60000` caracteres). `/context` mostra os tamanhos **bruto vs injetado** e se houve truncamento.

Quando ocorre truncamento, o runtime pode injetar um bloco de aviso no prompt em Contexto do Projeto. Configure isso com `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; padrão `once`).

## Skills: injetadas vs carregadas sob demanda

O prompt de sistema inclui uma **lista de Skills** compacta (nome + descrição + localização). Essa lista tem sobrecarga real.

As instruções da Skill _não_ são incluídas por padrão. Espera-se que o modelo use `read` no `SKILL.md` da Skill **somente quando necessário**.

## Ferramentas: há dois custos

As ferramentas afetam o contexto de duas maneiras:

1. **Texto da lista de ferramentas** no prompt de sistema (o que você vê como “Tooling”).
2. **Schemas de ferramentas** (JSON). Eles são enviados ao modelo para que ele possa chamar ferramentas. Eles contam para o contexto mesmo que você não os veja como texto simples.

`/context detail` detalha os maiores schemas de ferramentas para que você possa ver o que mais pesa.

## Comandos, diretivas e "atalhos inline"

Os comandos slash são tratados pelo Gateway. Há alguns comportamentos diferentes:

- **Comandos independentes**: uma mensagem que contém apenas `/...` é executada como comando.
- **Diretivas**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` são removidas antes que o modelo veja a mensagem.
  - Mensagens compostas apenas por diretivas persistem as configurações da sessão.
  - Diretivas inline em uma mensagem normal funcionam como dicas por mensagem.
- **Atalhos inline** (somente remetentes permitidos): certos tokens `/...` dentro de uma mensagem normal podem ser executados imediatamente (exemplo: “hey /status”) e são removidos antes que o modelo veja o texto restante.

Detalhes: [Comandos slash](/pt-BR/tools/slash-commands).

## Sessões, Compaction e pruning (o que persiste)

O que persiste entre mensagens depende do mecanismo:

- **Histórico normal** persiste na transcrição da sessão até ser compactado/removido por política.
- **Compaction** persiste um resumo na transcrição e mantém intactas as mensagens recentes.
- **Pruning** remove resultados antigos de ferramentas do prompt _em memória_ para uma execução, mas não reescreve a transcrição.

Docs: [Sessão](/pt-BR/concepts/session), [Compaction](/pt-BR/concepts/compaction), [Session pruning](/pt-BR/concepts/session-pruning).

Por padrão, o OpenClaw usa o mecanismo de contexto `legacy` integrado para montagem e
Compaction. Se você instalar um Plugin que forneça `kind: "context-engine"` e
selecioná-lo com `plugins.slots.contextEngine`, o OpenClaw delegará a montagem
de contexto, `/compact` e hooks relacionados do ciclo de vida do contexto de
subagentes para esse mecanismo. `ownsCompaction: false` não faz fallback
automático para o mecanismo legado; o mecanismo ativo ainda precisa implementar
`compact()` corretamente. Veja
[Context Engine](/pt-BR/concepts/context-engine) para a interface conectável
completa, hooks de ciclo de vida e configuração.

## O que `/context` realmente informa

`/context` prefere o relatório mais recente do prompt de sistema **criado na execução**, quando disponível:

- `System prompt (run)` = capturado da última execução incorporada (com capacidade de ferramenta) e persistido no armazenamento da sessão.
- `System prompt (estimate)` = calculado em tempo real quando não existe relatório de execução (ou ao executar por um backend de CLI que não gera o relatório).

De qualquer forma, ele informa tamanhos e os principais contribuintes; ele **não** mostra o prompt de sistema completo nem os schemas das ferramentas.

## Relacionados

- [Context Engine](/pt-BR/concepts/context-engine) — injeção de contexto personalizada via Plugins
- [Compaction](/pt-BR/concepts/compaction) — resumo de conversas longas
- [Prompt de sistema](/pt-BR/concepts/system-prompt) — como o prompt de sistema é criado
- [Loop do agente](/pt-BR/concepts/agent-loop) — o ciclo completo de execução do agente
