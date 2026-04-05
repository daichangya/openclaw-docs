---
read_when:
    - Você quer que a promoção de memória seja executada automaticamente
    - Você quer entender os modos e limites do dreaming
    - Você quer ajustar a consolidação sem poluir o MEMORY.md
summary: Promoção em segundo plano da recordação de curto prazo para a memória de longo prazo
title: Dreaming (experimental)
x-i18n:
    generated_at: "2026-04-05T12:39:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9dbb29e9b49e940128c4e08c3fd058bb6ebb0148ca214b78008e3d5763ef1ab
    source_path: concepts/memory-dreaming.md
    workflow: 15
---

# Dreaming (experimental)

Dreaming é a etapa em segundo plano de consolidação de memória em `memory-core`.

Ele é chamado de "dreaming" porque o sistema revisita o que surgiu durante o dia
e decide o que vale a pena manter como contexto durável.

Dreaming é **experimental**, **opt-in** e **desativado por padrão**.

## O que o dreaming faz

1. Rastreia eventos de recordação de curto prazo a partir de ocorrências de `memory_search` em
   `memory/YYYY-MM-DD.md`.
2. Pontua esses candidatos de recordação com sinais ponderados.
3. Promove apenas candidatos qualificados para `MEMORY.md`.

Isso mantém a memória de longo prazo focada em contexto durável e repetido, em vez de
detalhes pontuais.

## Sinais de promoção

Dreaming combina quatro sinais:

- **Frequência**: com que frequência o mesmo candidato foi recordado.
- **Relevância**: quão fortes foram as pontuações de recordação quando ele foi recuperado.
- **Diversidade de consulta**: quantas intenções de consulta distintas o trouxeram à tona.
- **Recência**: ponderação temporal sobre recordações recentes.

A promoção exige que todos os limites configurados sejam atendidos, não apenas um sinal.

### Pesos dos sinais

| Sinal      | Peso | Descrição                                           |
| ---------- | ---- | --------------------------------------------------- |
| Frequência | 0.35 | Com que frequência a mesma entrada foi recordada    |
| Relevância | 0.35 | Média das pontuações de recordação quando recuperada |
| Diversidade | 0.15 | Contagem de intenções de consulta distintas que a trouxeram à tona |
| Recência   | 0.15 | Decaimento temporal (meia-vida de 14 dias)          |

## Como funciona

1. **Rastreamento de recordação** -- Cada ocorrência de `memory_search` é registrada em
   `memory/.dreams/short-term-recall.json` com contagem de recordações, pontuações e hash
   da consulta.
2. **Pontuação agendada** -- Na cadência configurada, os candidatos são classificados
   usando sinais ponderados. Todos os limites devem ser atendidos simultaneamente.
3. **Promoção** -- Entradas qualificadas são anexadas a `MEMORY.md` com um
   timestamp de promoção.
4. **Limpeza** -- Entradas já promovidas são filtradas dos ciclos futuros. Um
   bloqueio de arquivo evita execuções simultâneas.

## Modos

`dreaming.mode` controla a cadência e os limites padrão:

| Modo   | Cadência        | minScore | minRecallCount | minUniqueQueries |
| ------ | --------------- | -------- | -------------- | ---------------- |
| `off`  | Desabilitado    | --       | --             | --               |
| `core` | Diariamente às 3h | 0.75   | 3              | 2                |
| `rem`  | A cada 6 horas  | 0.85     | 4              | 3                |
| `deep` | A cada 12 horas | 0.80     | 3              | 3                |

## Modelo de agendamento

Quando o dreaming está habilitado, `memory-core` gerencia a programação recorrente
automaticamente. Você não precisa criar manualmente uma tarefa cron para esse recurso.

Você ainda pode ajustar o comportamento com substituições explícitas, como:

- `dreaming.frequency` (expressão cron)
- `dreaming.timezone`
- `dreaming.limit`
- `dreaming.minScore`
- `dreaming.minRecallCount`
- `dreaming.minUniqueQueries`

## Configurar

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

## Comandos de chat

Alterne modos e verifique o status pelo chat:

```
/dreaming core          # Alterna para o modo core (noturno)
/dreaming rem           # Alterna para o modo rem (a cada 6h)
/dreaming deep          # Alterna para o modo deep (a cada 12h)
/dreaming off           # Desabilita o dreaming
/dreaming status        # Mostra a configuração e a cadência atuais
/dreaming help          # Mostra o guia de modos
```

## Comandos da CLI

Visualize e aplique promoções pela linha de comando:

```bash
# Preview promotion candidates
openclaw memory promote

# Apply promotions to MEMORY.md
openclaw memory promote --apply

# Limit preview count
openclaw memory promote --limit 5

# Include already-promoted entries
openclaw memory promote --include-promoted

# Check dreaming status
openclaw memory status --deep
```

Consulte a [CLI de memory](/cli/memory) para a referência completa de flags.

## UI de Dreams

Quando o dreaming está habilitado, a barra lateral do Gateway mostra uma guia **Dreams** com
estatísticas de memória (contagem de curto prazo, contagem de longo prazo, contagem de promovidos) e o horário do próximo
ciclo agendado.

## Leitura adicional

- [Memória](/concepts/memory)
- [Pesquisa de memória](/concepts/memory-search)
- [CLI de memory](/cli/memory)
- [Referência de configuração de memória](/reference/memory-config)
