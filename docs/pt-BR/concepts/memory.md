---
read_when:
    - Você quer entender como a memória funciona
    - Você quer saber quais arquivos de memória escrever
summary: Como o OpenClaw se lembra das coisas entre sessões
title: Visão geral da memória
x-i18n:
    generated_at: "2026-04-09T01:27:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2fe47910f5bf1c44be379e971c605f1cb3a29befcf2a7ee11fb3833cbe3b9059
    source_path: concepts/memory.md
    workflow: 15
---

# Visão geral da memória

O OpenClaw se lembra das coisas gravando **arquivos Markdown simples** no espaço
de trabalho do seu agente. O modelo só "se lembra" do que é salvo no disco --
não há estado oculto.

## Como funciona

Seu agente tem três arquivos relacionados à memória:

- **`MEMORY.md`** -- memória de longo prazo. Fatos duráveis, preferências e
  decisões. Carregado no início de cada sessão de DM.
- **`memory/YYYY-MM-DD.md`** -- notas diárias. Contexto contínuo e observações.
  As notas de hoje e de ontem são carregadas automaticamente.
- **`DREAMS.md`** (experimental, opcional) -- Diário dos Sonhos e resumos de
  varreduras de dreaming para revisão humana, incluindo entradas de backfill
  histórico fundamentado.

Esses arquivos ficam no espaço de trabalho do agente (padrão `~/.openclaw/workspace`).

<Tip>
Se você quiser que seu agente se lembre de algo, basta pedir: "Lembre-se de que
eu prefiro TypeScript." Ele gravará isso no arquivo apropriado.
</Tip>

## Ferramentas de memória

O agente tem duas ferramentas para trabalhar com memória:

- **`memory_search`** -- encontra notas relevantes usando busca semântica, mesmo
  quando a redação difere da original.
- **`memory_get`** -- lê um arquivo de memória específico ou um intervalo de linhas.

Ambas as ferramentas são fornecidas pelo plugin de memória ativo (padrão: `memory-core`).

## Plugin complementar Memory Wiki

Se você quiser que a memória durável funcione mais como uma base de conhecimento
mantida do que apenas notas brutas, use o plugin integrado `memory-wiki`.

O `memory-wiki` compila conhecimento durável em um cofre wiki com:

- estrutura de página determinística
- declarações e evidências estruturadas
- rastreamento de contradições e atualização
- painéis gerados
- resumos compilados para consumidores do agente/runtime
- ferramentas nativas de wiki como `wiki_search`, `wiki_get`, `wiki_apply` e `wiki_lint`

Ele não substitui o plugin de memória ativo. O plugin de memória ativo ainda
controla recordação, promoção e dreaming. O `memory-wiki` adiciona uma
camada de conhecimento rica em proveniência ao lado dele.

Veja [Memory Wiki](/pt-BR/plugins/memory-wiki).

## Busca de memória

Quando um provedor de embeddings está configurado, o `memory_search` usa **busca
híbrida** -- combinando similaridade vetorial (significado semântico) com
correspondência por palavras-chave (termos exatos como IDs e símbolos de código).
Isso funciona imediatamente assim que você tiver uma chave de API para qualquer
provedor compatível.

<Info>
O OpenClaw detecta automaticamente seu provedor de embeddings a partir das
chaves de API disponíveis. Se você tiver uma chave OpenAI, Gemini, Voyage ou
Mistral configurada, a busca de memória será ativada automaticamente.
</Info>

Para detalhes sobre como a busca funciona, opções de ajuste e configuração de
provedor, consulte [Memory Search](/pt-BR/concepts/memory-search).

## Backends de memória

<CardGroup cols={3}>
<Card title="Integrado (padrão)" icon="database" href="/pt-BR/concepts/memory-builtin">
Baseado em SQLite. Funciona imediatamente com busca por palavras-chave,
similaridade vetorial e busca híbrida. Sem dependências extras.
</Card>
<Card title="QMD" icon="search" href="/pt-BR/concepts/memory-qmd">
Sidecar local-first com reordenação, expansão de consulta e a capacidade de
indexar diretórios fora do espaço de trabalho.
</Card>
<Card title="Honcho" icon="brain" href="/pt-BR/concepts/memory-honcho">
Memória entre sessões nativa de IA com modelagem de usuário, busca semântica e
consciência de múltiplos agentes. Instalação de plugin.
</Card>
</CardGroup>

## Camada de wiki de conhecimento

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/pt-BR/plugins/memory-wiki">
Compila memória durável em um cofre wiki rico em proveniência com declarações,
painéis, modo bridge e fluxos de trabalho compatíveis com Obsidian.
</Card>
</CardGroup>

## Descarga automática de memória

Antes que a [compactação](/pt-BR/concepts/compaction) resuma sua conversa, o OpenClaw
executa um turno silencioso que lembra o agente de salvar contexto importante
nos arquivos de memória. Isso vem ativado por padrão -- você não precisa
configurar nada.

<Tip>
A descarga de memória evita perda de contexto durante a compactação. Se o seu
agente tiver fatos importantes na conversa que ainda não foram gravados em um
arquivo, eles serão salvos automaticamente antes que o resumo aconteça.
</Tip>

## Dreaming (experimental)

Dreaming é uma etapa opcional de consolidação de memória em segundo plano. Ele
coleta sinais de curto prazo, pontua candidatos e promove apenas itens
qualificados para a memória de longo prazo (`MEMORY.md`).

Ele foi projetado para manter a memória de longo prazo com alto sinal:

- **Opt-in**: desativado por padrão.
- **Agendado**: quando ativado, o `memory-core` gerencia automaticamente um job
  recorrente de cron para uma varredura completa de dreaming.
- **Com limiar**: promoções precisam passar por critérios de pontuação,
  frequência de recordação e diversidade de consulta.
- **Revisável**: resumos de fase e entradas do diário são gravados em `DREAMS.md`
  para revisão humana.

Para o comportamento das fases, sinais de pontuação e detalhes do Diário dos
Sonhos, consulte [Dreaming (experimental)](/pt-BR/concepts/dreaming).

## Backfill fundamentado e promoção ao vivo

O sistema de dreaming agora tem duas trilhas de revisão intimamente relacionadas:

- **Dreaming ao vivo** funciona a partir do armazenamento de dreaming de curto
  prazo em `memory/.dreams/` e é o que a fase profunda normal usa ao decidir o
  que pode ser promovido para `MEMORY.md`.
- **Backfill fundamentado** lê notas históricas `memory/YYYY-MM-DD.md` como
  arquivos de dia independentes e grava saída de revisão estruturada em `DREAMS.md`.

O backfill fundamentado é útil quando você quer reproduzir notas antigas e
inspecionar o que o sistema considera durável sem editar manualmente o
`MEMORY.md`.

Quando você usa:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

os candidatos duráveis fundamentados não são promovidos diretamente. Eles são
preparados no mesmo armazenamento de dreaming de curto prazo que a fase profunda
normal já usa. Isso significa que:

- `DREAMS.md` continua sendo a superfície de revisão humana.
- o armazenamento de curto prazo continua sendo a superfície de classificação voltada para a máquina.
- `MEMORY.md` ainda só é gravado pela promoção profunda.

Se você decidir que a reprodução não foi útil, pode remover os artefatos
preparados sem tocar nas entradas normais do diário nem no estado normal de
recordação:

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # Verificar status do índice e provedor
openclaw memory search "query"  # Pesquisar pela linha de comando
openclaw memory index --force   # Reconstruir o índice
```

## Leitura adicional

- [Builtin Memory Engine](/pt-BR/concepts/memory-builtin) -- backend SQLite padrão
- [QMD Memory Engine](/pt-BR/concepts/memory-qmd) -- sidecar local-first avançado
- [Honcho Memory](/pt-BR/concepts/memory-honcho) -- memória entre sessões nativa de IA
- [Memory Wiki](/pt-BR/plugins/memory-wiki) -- cofre de conhecimento compilado e ferramentas nativas de wiki
- [Memory Search](/pt-BR/concepts/memory-search) -- pipeline de busca, provedores e
  ajuste
- [Dreaming (experimental)](/pt-BR/concepts/dreaming) -- promoção em segundo plano
  da recordação de curto prazo para a memória de longo prazo
- [Referência de configuração de memória](/pt-BR/reference/memory-config) -- todos os ajustes de configuração
- [Compactação](/pt-BR/concepts/compaction) -- como a compactação interage com a memória
