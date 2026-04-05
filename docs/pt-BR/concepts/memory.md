---
read_when:
    - Você quer entender como a memória funciona
    - Você quer saber quais arquivos de memória escrever
summary: Como o OpenClaw se lembra das coisas entre sessões
title: Visão geral da memória
x-i18n:
    generated_at: "2026-04-05T12:39:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89fbd20cf2bcdf461a9e311ee0ff43b5f69d9953519656eecd419b4a419256f8
    source_path: concepts/memory.md
    workflow: 15
---

# Visão geral da memória

O OpenClaw se lembra das coisas escrevendo **arquivos Markdown simples** no
workspace do seu agente. O modelo só "se lembra" do que é salvo em disco -- não
há estado oculto.

## Como funciona

Seu agente tem dois lugares para armazenar memórias:

- **`MEMORY.md`** -- memória de longo prazo. Fatos duráveis, preferências e
  decisões. Carregado no início de toda sessão de DM.
- **`memory/YYYY-MM-DD.md`** -- notas diárias. Contexto contínuo e observações.
  As notas de hoje e de ontem são carregadas automaticamente.

Esses arquivos ficam no workspace do agente (padrão `~/.openclaw/workspace`).

<Tip>
Se você quiser que seu agente se lembre de algo, basta pedir: "Lembre-se de que eu
prefiro TypeScript." Ele gravará isso no arquivo apropriado.
</Tip>

## Ferramentas de memória

O agente tem duas ferramentas para trabalhar com memória:

- **`memory_search`** -- encontra notas relevantes usando busca semântica, mesmo quando
  a redação difere do original.
- **`memory_get`** -- lê um arquivo de memória específico ou um intervalo de linhas.

Ambas as ferramentas são fornecidas pelo plugin de memória ativo (padrão: `memory-core`).

## Busca de memória

Quando um provider de embeddings está configurado, `memory_search` usa **busca
híbrida** -- combinando similaridade vetorial (significado semântico) com correspondência por palavras-chave
(termos exatos como IDs e símbolos de código). Isso funciona imediatamente assim que você tiver
uma chave de API para qualquer provider compatível.

<Info>
O OpenClaw detecta automaticamente seu provider de embeddings a partir das chaves de API disponíveis. Se você
tiver configurada uma chave do OpenAI, Gemini, Voyage ou Mistral, a busca de memória
será ativada automaticamente.
</Info>

Para detalhes sobre como a busca funciona, opções de ajuste e configuração de provider, consulte
[Busca de memória](/concepts/memory-search).

## Backends de memória

<CardGroup cols={3}>
<Card title="Builtin (padrão)" icon="database" href="/concepts/memory-builtin">
Baseado em SQLite. Funciona imediatamente com busca por palavras-chave, similaridade vetorial e
busca híbrida. Sem dependências extras.
</Card>
<Card title="QMD" icon="search" href="/concepts/memory-qmd">
Sidecar local-first com reranking, expansão de consulta e capacidade de indexar
diretórios fora do workspace.
</Card>
<Card title="Honcho" icon="brain" href="/concepts/memory-honcho">
Memória entre sessões nativa de IA com modelagem de usuário, busca semântica e
consciência de múltiplos agentes. Instalação por plugin.
</Card>
</CardGroup>

## Flush automático de memória

Antes que a [compactação](/concepts/compaction) resuma sua conversa, o OpenClaw
executa um turno silencioso que lembra o agente de salvar contexto importante em arquivos
de memória. Isso vem ativado por padrão -- você não precisa configurar nada.

<Tip>
O flush de memória evita perda de contexto durante a compactação. Se o seu agente tiver
fatos importantes na conversa que ainda não foram escritos em um arquivo, eles
serão salvos automaticamente antes que o resumo aconteça.
</Tip>

## Dreaming (experimental)

Dreaming é uma etapa opcional de consolidação em segundo plano para a memória. Ele revisita
recuperações de curto prazo de arquivos diários (`memory/YYYY-MM-DD.md`), atribui pontuações e
promove apenas itens qualificados para a memória de longo prazo (`MEMORY.md`).

Ele foi projetado para manter a memória de longo prazo com alto sinal:

- **Opt-in**: desativado por padrão.
- **Agendado**: quando ativado, `memory-core` gerencia a tarefa recorrente
  automaticamente.
- **Com limiar**: promoções precisam passar por critérios de pontuação, frequência de recuperação e
  diversidade de consultas.

Para comportamento dos modos (`off`, `core`, `rem`, `deep`), sinais de pontuação e parâmetros de ajuste,
consulte [Dreaming (experimental)](/concepts/memory-dreaming).

## CLI

```bash
openclaw memory status          # Verificar status do índice e provider
openclaw memory search "query"  # Buscar pela linha de comando
openclaw memory index --force   # Reconstruir o índice
```

## Leitura adicional

- [Builtin Memory Engine](/concepts/memory-builtin) -- backend SQLite padrão
- [QMD Memory Engine](/concepts/memory-qmd) -- sidecar local-first avançado
- [Honcho Memory](/concepts/memory-honcho) -- memória entre sessões nativa de IA
- [Busca de memória](/concepts/memory-search) -- pipeline de busca, providers e
  ajustes
- [Dreaming (experimental)](/concepts/memory-dreaming) -- promoção em segundo plano
  da recuperação de curto prazo para memória de longo prazo
- [Referência de configuração de memória](/reference/memory-config) -- todos os parâmetros de configuração
- [Compactação](/concepts/compaction) -- como a compactação interage com a memória
