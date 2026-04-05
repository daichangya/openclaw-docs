---
read_when:
    - Você quer configurar provedores de busca de memória ou modelos de embedding
    - Você quer configurar o backend QMD
    - Você quer ajustar busca híbrida, MMR ou decaimento temporal
    - Você quer habilitar indexação de memória multimodal
summary: Todos os ajustes de configuração para busca de memória, provedores de embeddings, QMD, busca híbrida e indexação multimodal
title: Referência de configuração de memória
x-i18n:
    generated_at: "2026-04-05T12:52:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e4c9740f71f5a47fc5e163742339362d6b95cb4757650c0c8a095cf3078caa
    source_path: reference/memory-config.md
    workflow: 15
---

# Referência de configuração de memória

Esta página lista todos os ajustes de configuração para a busca de memória do OpenClaw. Para
visões gerais conceituais, consulte:

- [Visão geral de memória](/pt-BR/concepts/memory) -- como a memória funciona
- [Engine integrado](/pt-BR/concepts/memory-builtin) -- backend SQLite padrão
- [Engine QMD](/pt-BR/concepts/memory-qmd) -- sidecar local-first
- [Busca de memória](/pt-BR/concepts/memory-search) -- pipeline de busca e ajustes

Todas as configurações de busca de memória ficam em `agents.defaults.memorySearch` no
`openclaw.json`, salvo indicação em contrário.

---

## Seleção de provedor

| Chave     | Tipo      | Padrão          | Descrição                                                                       |
| --------- | --------- | ---------------- | -------------------------------------------------------------------------------- |
| `provider` | `string`  | detectado automaticamente    | ID do adaptador de embedding: `openai`, `gemini`, `voyage`, `mistral`, `ollama`, `local` |
| `model`    | `string`  | padrão do provedor | Nome do modelo de embedding                                                      |
| `fallback` | `string`  | `"none"`         | ID do adaptador de fallback quando o primário falha                              |
| `enabled`  | `boolean` | `true`           | Habilita ou desabilita a busca de memória                                        |

### Ordem de detecção automática

Quando `provider` não está definido, o OpenClaw seleciona o primeiro disponível:

1. `local` -- se `memorySearch.local.modelPath` estiver configurado e o arquivo existir.
2. `openai` -- se uma chave OpenAI puder ser resolvida.
3. `gemini` -- se uma chave Gemini puder ser resolvida.
4. `voyage` -- se uma chave Voyage puder ser resolvida.
5. `mistral` -- se uma chave da Mistral puder ser resolvida.

`ollama` é compatível, mas não é detectado automaticamente (defina-o explicitamente).

### Resolução de chave de API

Embeddings remotos exigem uma chave de API. O OpenClaw resolve isso a partir de:
perfis de autenticação, `models.providers.*.apiKey` ou variáveis de ambiente.

| Provedor | Variável de ambiente           | Chave de configuração              |
| -------- | ------------------------------ | ---------------------------------- |
| OpenAI   | `OPENAI_API_KEY`               | `models.providers.openai.apiKey`   |
| Gemini   | `GEMINI_API_KEY`               | `models.providers.google.apiKey`   |
| Voyage   | `VOYAGE_API_KEY`               | `models.providers.voyage.apiKey`   |
| Mistral  | `MISTRAL_API_KEY`              | `models.providers.mistral.apiKey`  |
| Ollama   | `OLLAMA_API_KEY` (placeholder) | --                                 |

O OAuth do Codex cobre apenas chat/completions e não atende a solicitações de
embedding.

---

## Configuração de endpoint remoto

Para endpoints personalizados compatíveis com OpenAI ou para sobrescrever padrões do provedor:

| Chave            | Tipo     | Descrição                                     |
| ---------------- | -------- | --------------------------------------------- |
| `remote.baseUrl` | `string` | URL base personalizada da API                 |
| `remote.apiKey`  | `string` | Sobrescreve a chave de API                    |
| `remote.headers` | `object` | Headers HTTP extras (mesclados com os padrões do provedor) |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Configuração específica do Gemini

| Chave                  | Tipo     | Padrão                 | Descrição                                   |
| ---------------------- | -------- | ---------------------- | ------------------------------------------- |
| `model`                | `string` | `gemini-embedding-001` | Também oferece suporte a `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Para Embedding 2: 768, 1536 ou 3072         |

<Warning>
Alterar o modelo ou `outputDimensionality` dispara automaticamente uma reindexação completa.
</Warning>

---

## Configuração de embedding local

| Chave                 | Tipo     | Padrão                 | Descrição                          |
| --------------------- | -------- | ---------------------- | ---------------------------------- |
| `local.modelPath`     | `string` | baixado automaticamente | Caminho para o arquivo de modelo GGUF |
| `local.modelCacheDir` | `string` | padrão do node-llama-cpp | Diretório de cache para modelos baixados |

Modelo padrão: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, baixado automaticamente).
Exige build nativo: `pnpm approve-builds` e depois `pnpm rebuild node-llama-cpp`.

---

## Configuração de busca híbrida

Tudo em `memorySearch.query.hybrid`:

| Chave                 | Tipo      | Padrão | Descrição                           |
| --------------------- | --------- | ------ | ----------------------------------- |
| `enabled`             | `boolean` | `true` | Habilita busca híbrida BM25 + vetorial |
| `vectorWeight`        | `number`  | `0.7`  | Peso para pontuações vetoriais (0-1) |
| `textWeight`          | `number`  | `0.3`  | Peso para pontuações BM25 (0-1)     |
| `candidateMultiplier` | `number`  | `4`    | Multiplicador do tamanho do conjunto de candidatos |

### MMR (diversidade)

| Chave         | Tipo      | Padrão | Descrição                              |
| ------------- | --------- | ------ | -------------------------------------- |
| `mmr.enabled` | `boolean` | `false` | Habilita reranqueamento por MMR        |
| `mmr.lambda`  | `number`  | `0.7`  | 0 = máxima diversidade, 1 = máxima relevância |

### Decaimento temporal (recência)

| Chave                        | Tipo      | Padrão | Descrição                      |
| ---------------------------- | --------- | ------ | ------------------------------ |
| `temporalDecay.enabled`      | `boolean` | `false` | Habilita boost de recência     |
| `temporalDecay.halfLifeDays` | `number`  | `30`   | A pontuação cai pela metade a cada N dias |

Arquivos evergreen (`MEMORY.md`, arquivos sem data em `memory/`) nunca sofrem decaimento.

### Exemplo completo

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Caminhos adicionais de memória

| Chave        | Tipo       | Descrição                                  |
| ------------ | ---------- | ------------------------------------------ |
| `extraPaths` | `string[]` | Diretórios ou arquivos adicionais para indexar |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Os caminhos podem ser absolutos ou relativos ao workspace. Diretórios são varridos
recursivamente em busca de arquivos `.md`. O tratamento de symlinks depende do backend ativo:
o engine integrado ignora symlinks, enquanto o QMD segue o comportamento do scanner QMD subjacente.

Para busca entre transcrições de vários agentes com escopo por agente, use
`agents.list[].memorySearch.qmd.extraCollections` em vez de `memory.qmd.paths`.
Essas coleções extras seguem o mesmo formato `{ path, name, pattern? }`, mas
são mescladas por agente e podem preservar nomes compartilhados explícitos quando o caminho
aponta para fora do workspace atual.
Se o mesmo caminho resolvido aparecer em `memory.qmd.paths` e
`memorySearch.qmd.extraCollections`, o QMD mantém a primeira entrada e ignora a
duplicada.

---

## Memória multimodal (Gemini)

Indexe imagens e áudio junto com Markdown usando Gemini Embedding 2:

| Chave                     | Tipo       | Padrão     | Descrição                               |
| ------------------------- | ---------- | ---------- | --------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Habilita indexação multimodal           |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` ou `["all"]`   |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Tamanho máximo de arquivo para indexação |

Aplica-se apenas a arquivos em `extraPaths`. As raízes de memória padrão continuam apenas com Markdown.
Exige `gemini-embedding-2-preview`. `fallback` deve ser `"none"`.

Formatos compatíveis: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(imagens); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (áudio).

---

## Cache de embedding

| Chave              | Tipo      | Padrão  | Descrição                             |
| ------------------ | --------- | ------- | ------------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Armazena embeddings de chunks em cache no SQLite |
| `cache.maxEntries` | `number`  | `50000` | Máximo de embeddings em cache         |

Evita reprocessar embeddings de texto inalterado durante reindexação ou atualizações de transcrições.

---

## Indexação em lote

| Chave                         | Tipo      | Padrão  | Descrição                     |
| ----------------------------- | --------- | ------- | ----------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | Habilita a API de embedding em lote |
| `remote.batch.concurrency`    | `number`  | `2`     | Jobs em lote paralelos        |
| `remote.batch.wait`           | `boolean` | `true`  | Aguarda a conclusão do lote   |
| `remote.batch.pollIntervalMs` | `number`  | --      | Intervalo de polling          |
| `remote.batch.timeoutMinutes` | `number`  | --      | Timeout do lote               |

Disponível para `openai`, `gemini` e `voyage`. O batch do OpenAI normalmente é o
mais rápido e barato para grandes backfills.

---

## Busca de memória de sessão (experimental)

Indexe transcrições de sessão e exponha-as via `memory_search`:

| Chave                         | Tipo       | Padrão       | Descrição                                  |
| ----------------------------- | ---------- | ------------ | ------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Habilita indexação de sessão               |
| `sources`                     | `string[]` | `["memory"]` | Adicione `"sessions"` para incluir transcrições |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Limite em bytes para reindexação           |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Limite em mensagens para reindexação       |

A indexação de sessões é opt-in e roda de forma assíncrona. Os resultados podem ficar
ligeiramente desatualizados. Os logs de sessão ficam em disco, então trate o acesso ao sistema de arquivos como o limite de confiança.

---

## Aceleração vetorial SQLite (`sqlite-vec`)

| Chave                        | Tipo      | Padrão   | Descrição                            |
| ---------------------------- | --------- | -------- | ------------------------------------ |
| `store.vector.enabled`       | `boolean` | `true`   | Usa `sqlite-vec` para consultas vetoriais |
| `store.vector.extensionPath` | `string`  | empacotado | Sobrescreve o caminho do `sqlite-vec` |

Quando `sqlite-vec` não está disponível, o OpenClaw volta automaticamente para similaridade de cosseno em processo.

---

## Armazenamento de índice

| Chave                 | Tipo     | Padrão                                | Descrição                                      |
| --------------------- | -------- | ------------------------------------- | ---------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Local do índice (compatível com o token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Tokenizer FTS5 (`unicode61` ou `trigram`)      |

---

## Configuração do backend QMD

Defina `memory.backend = "qmd"` para habilitar. Todas as configurações do QMD ficam em
`memory.qmd`:

| Chave                    | Tipo      | Padrão   | Descrição                                      |
| ------------------------ | --------- | -------- | ---------------------------------------------- |
| `command`                | `string`  | `qmd`    | Caminho do executável QMD                      |
| `searchMode`             | `string`  | `search` | Comando de busca: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | Indexa automaticamente `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --       | Caminhos extras: `{ name, path, pattern? }`    |
| `sessions.enabled`       | `boolean` | `false`  | Indexa transcrições de sessão                  |
| `sessions.retentionDays` | `number`  | --       | Retenção de transcrições                       |
| `sessions.exportDir`     | `string`  | --       | Diretório de exportação                        |

### Agenda de atualização

| Chave                     | Tipo      | Padrão  | Descrição                                 |
| ------------------------- | --------- | ------- | ----------------------------------------- |
| `update.interval`         | `string`  | `5m`    | Intervalo de atualização                  |
| `update.debounceMs`       | `number`  | `15000` | Debounce de alterações em arquivos        |
| `update.onBoot`           | `boolean` | `true`  | Atualiza na inicialização                 |
| `update.waitForBootSync`  | `boolean` | `false` | Bloqueia a inicialização até a atualização terminar |
| `update.embedInterval`    | `string`  | --      | Cadência separada de embedding            |
| `update.commandTimeoutMs` | `number`  | --      | Timeout para comandos QMD                 |
| `update.updateTimeoutMs`  | `number`  | --      | Timeout para operações de atualização QMD |
| `update.embedTimeoutMs`   | `number`  | --      | Timeout para operações de embedding QMD   |

### Limites

| Chave                   | Tipo     | Padrão | Descrição                       |
| ----------------------- | -------- | ------ | ------------------------------- |
| `limits.maxResults`     | `number` | `6`    | Máximo de resultados de busca   |
| `limits.maxSnippetChars`| `number` | --     | Limita o tamanho do snippet     |
| `limits.maxInjectedChars` | `number` | --   | Limita o total de caracteres injetados |
| `limits.timeoutMs`      | `number` | `4000` | Timeout da busca                |

### Escopo

Controla quais sessões podem receber resultados de busca do QMD. Mesmo esquema de
[`session.sendPolicy`](/pt-BR/gateway/configuration-reference#session):

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

O padrão é apenas DM. `match.keyPrefix` corresponde à chave de sessão normalizada;
`match.rawKeyPrefix` corresponde à chave bruta, incluindo `agent:<id>:`.

### Citações

`memory.citations` aplica-se a todos os backends:

| Valor            | Comportamento                                          |
| ---------------- | ------------------------------------------------------ |
| `auto` (padrão)  | Inclui rodapé `Source: <path#line>` nos snippets       |
| `on`             | Sempre inclui o rodapé                                 |
| `off`            | Omite o rodapé (o caminho ainda é passado internamente ao agente) |

### Exemplo completo de QMD

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming (experimental)

O Dreaming é configurado em `plugins.entries.memory-core.config.dreaming`,
não em `agents.defaults.memorySearch`. Para detalhes conceituais e comandos de chat,
consulte [Dreaming](/pt-BR/concepts/memory-dreaming).

| Chave              | Tipo     | Padrão do preset | Descrição                                      |
| ------------------ | -------- | ---------------- | ---------------------------------------------- |
| `mode`             | `string` | `"off"`          | Preset: `off`, `core`, `rem` ou `deep`         |
| `cron`             | `string` | padrão do preset | Sobrescreve a expressão cron da agenda         |
| `timezone`         | `string` | fuso horário do usuário | Fuso horário para avaliação da agenda      |
| `limit`            | `number` | padrão do preset | Máximo de candidatos a promover por ciclo      |
| `minScore`         | `number` | padrão do preset | Pontuação ponderada mínima para promoção       |
| `minRecallCount`   | `number` | padrão do preset | Limite mínimo de contagem de recall            |
| `minUniqueQueries` | `number` | padrão do preset | Limite mínimo de contagem de consultas distintas |

### Padrões dos presets

| Modo   | Cadência        | minScore | minRecallCount | minUniqueQueries |
| ------ | --------------- | -------- | -------------- | ---------------- |
| `off`  | Desabilitado    | --       | --             | --               |
| `core` | Diariamente às 3h | 0.75   | 3              | 2                |
| `rem`  | A cada 6 horas  | 0.85     | 4              | 3                |
| `deep` | A cada 12 horas | 0.80     | 3              | 3                |

### Exemplo

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            mode: "core",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```
