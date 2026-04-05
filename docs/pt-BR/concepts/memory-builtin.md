---
read_when:
    - Você quer entender o backend de memória padrão
    - Você quer configurar provedores de embeddings ou pesquisa híbrida
summary: O backend de memória padrão baseado em SQLite com pesquisa por palavra-chave, vetorial e híbrida
title: Mecanismo de memória integrado
x-i18n:
    generated_at: "2026-04-05T12:39:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 181c40a43332315bf915ff6f395d9d5fd766c889e1a8d1aa525f9ba0198d3367
    source_path: concepts/memory-builtin.md
    workflow: 15
---

# Mecanismo de memória integrado

O mecanismo integrado é o backend de memória padrão. Ele armazena seu índice de memória em
um banco de dados SQLite por agente e não precisa de dependências extras para começar.

## O que ele oferece

- **Pesquisa por palavra-chave** via indexação full-text FTS5 (pontuação BM25).
- **Pesquisa vetorial** via embeddings de qualquer provedor compatível.
- **Pesquisa híbrida** que combina ambas para obter melhores resultados.
- **Suporte a CJK** via tokenização trigram para chinês, japonês e coreano.
- **Aceleração com sqlite-vec** para consultas vetoriais no banco de dados (opcional).

## Primeiros passos

Se você tiver uma chave de API para OpenAI, Gemini, Voyage ou Mistral, o mecanismo integrado
a detecta automaticamente e ativa a pesquisa vetorial. Nenhuma configuração é necessária.

Para definir explicitamente um provedor:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Sem um provedor de embeddings, apenas a pesquisa por palavra-chave fica disponível.

## Provedores de embeddings compatíveis

| Provider | ID        | Auto-detected | Notes                               |
| -------- | --------- | ------------- | ----------------------------------- |
| OpenAI   | `openai`  | Yes           | Default: `text-embedding-3-small`   |
| Gemini   | `gemini`  | Yes           | Supports multimodal (image + audio) |
| Voyage   | `voyage`  | Yes           |                                     |
| Mistral  | `mistral` | Yes           |                                     |
| Ollama   | `ollama`  | No            | Local, set explicitly               |
| Local    | `local`   | Yes (first)   | GGUF model, ~0.6 GB download        |

A detecção automática escolhe o primeiro provedor cuja chave de API pode ser resolvida, na
ordem mostrada. Defina `memorySearch.provider` para substituir isso.

## Como a indexação funciona

O OpenClaw indexa `MEMORY.md` e `memory/*.md` em blocos (~400 tokens com
sobreposição de 80 tokens) e os armazena em um banco de dados SQLite por agente.

- **Local do índice:** `~/.openclaw/memory/<agentId>.sqlite`
- **Monitoramento de arquivos:** alterações em arquivos de memória acionam uma reindexação com debounce (1,5 s).
- **Reindexação automática:** quando o provedor de embeddings, o modelo ou a configuração de fragmentação
  mudam, todo o índice é reconstruído automaticamente.
- **Reindexar sob demanda:** `openclaw memory index --force`

<Info>
Você também pode indexar arquivos Markdown fora do workspace com
`memorySearch.extraPaths`. Consulte a
[referência de configuração](/reference/memory-config#additional-memory-paths).
</Info>

## Quando usar

O mecanismo integrado é a escolha certa para a maioria dos usuários:

- Funciona imediatamente, sem dependências extras.
- Lida bem com pesquisa por palavra-chave e vetorial.
- Oferece suporte a todos os provedores de embeddings.
- A pesquisa híbrida combina o melhor das duas abordagens de recuperação.

Considere migrar para [QMD](/concepts/memory-qmd) se precisar de reranking, expansão
de consulta ou quiser indexar diretórios fora do workspace.

Considere [Honcho](/concepts/memory-honcho) se quiser memória entre sessões com
modelagem automática de usuário.

## Solução de problemas

**Pesquisa de memória desativada?** Verifique `openclaw memory status`. Se nenhum provedor for
detectado, defina um explicitamente ou adicione uma chave de API.

**Resultados desatualizados?** Execute `openclaw memory index --force` para reconstruir. O watcher
pode perder alterações em casos raros.

**sqlite-vec não está carregando?** O OpenClaw usa automaticamente fallback para similaridade de cosseno
em processo. Verifique os logs para ver o erro de carregamento específico.

## Configuração

Para configuração de provedor de embeddings, ajuste de pesquisa híbrida (pesos, MMR, decaimento
temporal), indexação em lote, memória multimodal, sqlite-vec, caminhos extras e todos os
outros controles de configuração, consulte a
[referência de configuração de memória](/reference/memory-config).
