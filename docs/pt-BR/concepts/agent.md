---
read_when:
    - Alterando o runtime do agente, o bootstrap do workspace ou o comportamento da sessão
summary: Runtime do agente, contrato de workspace e bootstrap de sessão
title: Runtime do agente
x-i18n:
    generated_at: "2026-04-05T12:39:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2ff39f4114f009e5b1f86894ea4bb29b1c9512563b70d063f09ca7cde5e8948
    source_path: concepts/agent.md
    workflow: 15
---

# Runtime do agente

O OpenClaw executa um único runtime de agente embutido.

## Workspace (obrigatório)

O OpenClaw usa um único diretório de workspace do agente (`agents.defaults.workspace`) como o **único** diretório de trabalho (`cwd`) do agente para ferramentas e contexto.

Recomendado: use `openclaw setup` para criar `~/.openclaw/openclaw.json` se ele estiver ausente e inicializar os arquivos do workspace.

Layout completo do workspace + guia de backup: [Agent workspace](/concepts/agent-workspace)

Se `agents.defaults.sandbox` estiver habilitado, sessões não principais poderão substituir isso com
workspaces por sessão em `agents.defaults.sandbox.workspaceRoot` (consulte
[Gateway configuration](/gateway/configuration)).

## Arquivos bootstrap (injetados)

Dentro de `agents.defaults.workspace`, o OpenClaw espera estes arquivos editáveis pelo usuário:

- `AGENTS.md` — instruções operacionais + “memória”
- `SOUL.md` — persona, limites, tom
- `TOOLS.md` — observações sobre ferramentas mantidas pelo usuário (por exemplo `imsg`, `sag`, convenções)
- `BOOTSTRAP.md` — ritual único da primeira execução (excluído após a conclusão)
- `IDENTITY.md` — nome/vibe/emoji do agente
- `USER.md` — perfil do usuário + forma de tratamento preferida

No primeiro turno de uma nova sessão, o OpenClaw injeta o conteúdo desses arquivos diretamente no contexto do agente.

Arquivos em branco são ignorados. Arquivos grandes são aparados e truncados com um marcador para que os prompts permaneçam enxutos (leia o arquivo para ver o conteúdo completo).

Se um arquivo estiver ausente, o OpenClaw injeta uma única linha marcadora de “arquivo ausente” (e `openclaw setup` criará um template padrão seguro).

`BOOTSTRAP.md` só é criado para um **workspace totalmente novo** (sem outros arquivos bootstrap presentes). Se você excluí-lo após concluir o ritual, ele não deverá ser recriado em reinicializações posteriores.

Para desabilitar completamente a criação de arquivos bootstrap (para workspaces pré-populados), defina:

```json5
{ agent: { skipBootstrap: true } }
```

## Ferramentas integradas

As ferramentas principais (read/exec/edit/write e ferramentas de sistema relacionadas) estão sempre disponíveis,
sujeitas à política de ferramentas. `apply_patch` é opcional e controlado por
`tools.exec.applyPatch`. `TOOLS.md` **não** controla quais ferramentas existem; ele é
uma orientação sobre como _você_ quer que elas sejam usadas.

## Skills

O OpenClaw carrega Skills destes locais (maior precedência primeiro):

- Workspace: `<workspace>/skills`
- Skills de agente do projeto: `<workspace>/.agents/skills`
- Skills pessoais do agente: `~/.agents/skills`
- Gerenciadas/locais: `~/.openclaw/skills`
- Empacotadas (enviadas com a instalação)
- Pastas extras de Skills: `skills.load.extraDirs`

Skills podem ser controladas por config/env (consulte `skills` em [Gateway configuration](/gateway/configuration)).

## Limites do runtime

O runtime de agente embutido é construído sobre o núcleo do agente Pi (modelos, ferramentas e
pipeline de prompts). Gerenciamento de sessão, descoberta, integração de ferramentas e entrega por canal
são camadas de propriedade do OpenClaw sobre esse núcleo.

## Sessões

As transcrições de sessão são armazenadas como JSONL em:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

O ID da sessão é estável e escolhido pelo OpenClaw.
Pastas legadas de sessão de outras ferramentas não são lidas.

## Condução durante streaming

Quando o modo de fila é `steer`, mensagens recebidas são injetadas na execução atual.
A condução enfileirada é entregue **depois que o turno atual do assistente termina
de executar suas chamadas de ferramenta**, antes da próxima chamada de LLM. A condução não ignora mais
as chamadas de ferramenta restantes da mensagem atual do assistente; em vez disso, injeta a mensagem
enfileirada no próximo limite do modelo.

Quando o modo de fila é `followup` ou `collect`, as mensagens recebidas são mantidas até o
turno atual terminar, então um novo turno do agente começa com as cargas enfileiradas. Consulte
[Queue](/concepts/queue) para o comportamento de modo + debounce/limite.

O block streaming envia blocos completos do assistente assim que terminam; ele fica
**desabilitado por padrão** (`agents.defaults.blockStreamingDefault: "off"`).
Ajuste o limite com `agents.defaults.blockStreamingBreak` (`text_end` vs `message_end`; o padrão é text_end).
Controle a divisão suave em blocos com `agents.defaults.blockStreamingChunk` (o padrão é
800–1200 caracteres; prefere quebras de parágrafo, depois novas linhas; frases por último).
Faça coalescência de blocos em streaming com `agents.defaults.blockStreamingCoalesce` para reduzir
spam de linha única (mesclagem baseada em ociosidade antes do envio). Canais que não sejam
Telegram exigem `*.blockStreaming: true` explícito para habilitar respostas em bloco.
Resumos detalhados de ferramentas são emitidos no início da ferramenta (sem debounce); a UI de controle
faz streaming da saída da ferramenta via eventos do agente quando disponível.
Mais detalhes: [Streaming + chunking](/concepts/streaming).

## Refs de modelo

Refs de modelo na configuração (por exemplo `agents.defaults.model` e `agents.defaults.models`) são analisadas dividindo na **primeira** `/`.

- Use `provider/model` ao configurar modelos.
- Se o próprio ID do modelo contiver `/` (estilo OpenRouter), inclua o prefixo do provedor (exemplo: `openrouter/moonshotai/kimi-k2`).
- Se você omitir o provedor, o OpenClaw tenta primeiro um alias, depois uma
  correspondência única de provedor configurado para aquele id de modelo exato, e só então usa
  o fallback para o provedor padrão configurado. Se esse provedor não expuser mais o
  modelo padrão configurado, o OpenClaw usa como fallback o primeiro
  provedor/modelo configurado em vez de exibir um padrão obsoleto de provedor removido.

## Configuração (mínima)

No mínimo, defina:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (fortemente recomendado)

---

_Próximo: [Group Chats](/channels/group-messages)_ 🦞
