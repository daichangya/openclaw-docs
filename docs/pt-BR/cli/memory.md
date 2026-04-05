---
read_when:
    - Você quer indexar ou pesquisar memória semântica
    - Você está depurando disponibilidade ou indexação de memória
    - Você quer promover memória de curto prazo recuperada para `MEMORY.md`
summary: Referência da CLI para `openclaw memory` (status/index/search/promote)
title: memory
x-i18n:
    generated_at: "2026-04-05T12:38:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a89e3a819737bb63521128ae63d9e25b5cd9db35c3ea4606d087a8ad48b41eab
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Gerencie a indexação e a pesquisa de memória semântica.
Fornecido pelo plugin de memória ativo (padrão: `memory-core`; defina `plugins.slots.memory = "none"` para desativar).

Relacionado:

- Conceito de memória: [Memory](/concepts/memory)
- Plugins: [Plugins](/tools/plugin)

## Exemplos

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Opções

`memory status` e `memory index`:

- `--agent <id>`: limita a um único agente. Sem isso, esses comandos são executados para cada agente configurado; se nenhuma lista de agentes estiver configurada, eles recorrem ao agente padrão.
- `--verbose`: emite logs detalhados durante sondagens e indexação.

`memory status`:

- `--deep`: verifica a disponibilidade de vetor + embedding.
- `--index`: executa uma reindexação se o armazenamento estiver sujo (implica `--deep`).
- `--fix`: corrige locks de recuperação obsoletos e normaliza metadados de promoção.
- `--json`: imprime saída JSON.

`memory index`:

- `--force`: força uma reindexação completa.

`memory search`:

- Entrada de consulta: passe `[query]` posicional ou `--query <text>`.
- Se ambos forem fornecidos, `--query` prevalece.
- Se nenhum for fornecido, o comando sai com erro.
- `--agent <id>`: limita a um único agente (padrão: o agente padrão).
- `--max-results <n>`: limita o número de resultados retornados.
- `--min-score <n>`: filtra correspondências com pontuação baixa.
- `--json`: imprime resultados em JSON.

`memory promote`:

Visualize e aplique promoções de memória de curto prazo.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- grava promoções em `MEMORY.md` (padrão: somente visualização).
- `--limit <n>` -- limita o número de candidatos mostrados.
- `--include-promoted` -- inclui entradas já promovidas em ciclos anteriores.

Opções completas:

- Classifica candidatos de curto prazo de `memory/YYYY-MM-DD.md` usando sinais ponderados de recuperação (`frequency`, `relevance`, `query diversity`, `recency`).
- Usa eventos de recuperação capturados quando `memory_search` retorna resultados de memória diária.
- Modo opcional de dreaming automático: quando `plugins.entries.memory-core.config.dreaming.mode` é `core`, `deep` ou `rem`, `memory-core` gerencia automaticamente um job cron que aciona a promoção em segundo plano (não é necessário `openclaw cron add` manual).
- `--agent <id>`: limita a um único agente (padrão: o agente padrão).
- `--limit <n>`: número máximo de candidatos a retornar/aplicar.
- `--min-score <n>`: pontuação mínima ponderada para promoção.
- `--min-recall-count <n>`: contagem mínima de recuperação exigida para um candidato.
- `--min-unique-queries <n>`: contagem mínima de consultas distintas exigida para um candidato.
- `--apply`: acrescenta candidatos selecionados a `MEMORY.md` e os marca como promovidos.
- `--include-promoted`: inclui na saída candidatos já promovidos.
- `--json`: imprime saída JSON.

## Dreaming (experimental)

Dreaming é a etapa de reflexão noturna para memória. Ela é chamada de "dreaming" porque o sistema revisita o que foi recuperado durante o dia e decide o que vale a pena manter no longo prazo.

- É opt-in e vem desativada por padrão.
- Ative com `plugins.entries.memory-core.config.dreaming.mode`.
- Você pode alternar modos pelo chat com `/dreaming off|core|rem|deep`. Execute `/dreaming` (ou `/dreaming options`) para ver o que cada modo faz.
- Quando ativado, `memory-core` cria e mantém automaticamente um job cron gerenciado.
- Defina `dreaming.limit` como `0` se quiser o dreaming ativado, mas com a promoção automática efetivamente pausada.
- A classificação usa sinais ponderados: frequência de recuperação, relevância da recuperação, diversidade de consultas e recência temporal (recuperações recentes decaem com o tempo).
- A promoção para `MEMORY.md` só acontece quando os limites de qualidade são atendidos, para que a memória de longo prazo permaneça com alto sinal em vez de acumular detalhes pontuais.

Predefinições de modo padrão:

- `core`: diariamente em `0 3 * * *`, `minScore=0.75`, `minRecallCount=3`, `minUniqueQueries=2`
- `deep`: a cada 12 horas (`0 */12 * * *`), `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`
- `rem`: a cada 6 horas (`0 */6 * * *`), `minScore=0.85`, `minRecallCount=4`, `minUniqueQueries=3`

Exemplo:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "mode": "core"
          }
        }
      }
    }
  }
}
```

Observações:

- `memory index --verbose` imprime detalhes por fase (provedor, modelo, fontes, atividade de lote).
- `memory status` inclui quaisquer caminhos extras configurados via `memorySearch.extraPaths`.
- Se os campos de chave de API remota de memória efetivamente ativos estiverem configurados como SecretRefs, o comando resolve esses valores a partir do snapshot ativo do gateway. Se o gateway não estiver disponível, o comando falha rapidamente.
- Observação sobre incompatibilidade de versão do gateway: este caminho de comando requer um gateway que ofereça suporte a `secrets.resolve`; gateways mais antigos retornam um erro de método desconhecido.
- A cadência de dreaming usa por padrão a agenda predefinida de cada modo. Substitua a cadência com `plugins.entries.memory-core.config.dreaming.frequency` como uma expressão cron (por exemplo `0 3 * * *`) e faça ajustes finos com `timezone`, `limit`, `minScore`, `minRecallCount` e `minUniqueQueries`.
