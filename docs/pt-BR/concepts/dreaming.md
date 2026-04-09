---
read_when:
    - Você quer que a promoção de memória seja executada automaticamente
    - Você quer entender o que cada fase do dreaming faz
    - Você quer ajustar a consolidação sem poluir o `MEMORY.md`
summary: Consolidação de memória em segundo plano com fases leve, profunda e REM, além de um Diário de Sonhos
title: Dreaming (experimental)
x-i18n:
    generated_at: "2026-04-09T01:27:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26476eddb8260e1554098a6adbb069cf7f5e284cf2e09479c6d9d8f8b93280ef
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming (experimental)

Dreaming é o sistema de consolidação de memória em segundo plano no `memory-core`.
Ele ajuda o OpenClaw a mover sinais fortes de curto prazo para memória durável, enquanto
mantém o processo explicável e revisável.

Dreaming é **opt-in** e fica desativado por padrão.

## O que o dreaming grava

O Dreaming mantém dois tipos de saída:

- **Estado da máquina** em `memory/.dreams/` (armazenamento de recall, sinais de fase, checkpoints de ingestão, locks).
- **Saída legível por humanos** em `DREAMS.md` (ou `dreams.md`, se já existir) e arquivos opcionais de relatório de fase em `memory/dreaming/<phase>/YYYY-MM-DD.md`.

A promoção para longo prazo ainda grava somente em `MEMORY.md`.

## Modelo de fases

Dreaming usa três fases cooperativas:

| Fase | Finalidade | Gravação durável |
| ----- | ---------- | ---------------- |
| Leve | Classificar e preparar material recente de curto prazo | Não |
| Profunda | Pontuar e promover candidatos duráveis | Sim (`MEMORY.md`) |
| REM | Refletir sobre temas e ideias recorrentes | Não |

Essas fases são detalhes internos de implementação, não "modos"
separados configurados pelo usuário.

### Fase leve

A fase leve ingere sinais recentes de memória diária e rastros de recall, remove duplicatas
e prepara linhas candidatas.

- Lê do estado de recall de curto prazo, de arquivos recentes de memória diária e de transcrições de sessão redigidas, quando disponíveis.
- Grava um bloco gerenciado `## Light Sleep` quando o armazenamento inclui saída inline.
- Registra sinais de reforço para classificação profunda posterior.
- Nunca grava em `MEMORY.md`.

### Fase profunda

A fase profunda decide o que se torna memória de longo prazo.

- Classifica candidatos usando pontuação ponderada e limites mínimos.
- Exige que `minScore`, `minRecallCount` e `minUniqueQueries` sejam atingidos.
- Reidrata trechos a partir de arquivos diários ativos antes de gravar, para que trechos obsoletos ou excluídos sejam ignorados.
- Acrescenta entradas promovidas a `MEMORY.md`.
- Grava um resumo `## Deep Sleep` em `DREAMS.md` e, opcionalmente, grava em `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

A fase REM extrai padrões e sinais reflexivos.

- Constrói resumos de temas e reflexões a partir de rastros recentes de curto prazo.
- Grava um bloco gerenciado `## REM Sleep` quando o armazenamento inclui saída inline.
- Registra sinais de reforço de REM usados pela classificação profunda.
- Nunca grava em `MEMORY.md`.

## Ingestão de transcrições de sessão

Dreaming pode ingerir transcrições de sessão redigidas no corpus do dreaming. Quando
as transcrições estão disponíveis, elas são alimentadas na fase leve junto com sinais
de memória diária e rastros de recall. Conteúdo pessoal e sensível é redigido
antes da ingestão.

## Diário de Sonhos

Dreaming também mantém um **Diário de Sonhos** narrativo em `DREAMS.md`.
Depois que cada fase tem material suficiente, o `memory-core` executa uma rodada em segundo plano
de subagente em modo best-effort (usando o modelo de runtime padrão) e acrescenta uma entrada curta ao diário.

Este diário é para leitura humana na interface Dreams, não uma fonte de promoção.

Também existe um fluxo fundamentado de preenchimento histórico para trabalho de revisão e recuperação:

- `memory rem-harness --path ... --grounded` mostra uma prévia da saída fundamentada do diário a partir de notas históricas `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` grava entradas fundamentadas e reversíveis no diário em `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prepara candidatos duráveis fundamentados no mesmo armazenamento de evidências de curto prazo que a fase profunda normal já usa.
- `memory rem-backfill --rollback` e `--rollback-short-term` removem esses artefatos preparados de backfill sem tocar nas entradas normais do diário nem no recall ativo de curto prazo.

A Control UI expõe o mesmo fluxo de backfill/redefinição do diário para que você possa inspecionar
os resultados na cena Dreams antes de decidir se os candidatos fundamentados
merecem promoção. A cena também mostra uma faixa fundamentada distinta para que você veja
quais entradas preparadas de curto prazo vieram de replay histórico, quais itens promovidos
foram guiados por conteúdo fundamentado e limpe apenas as entradas preparadas exclusivamente fundamentadas sem
tocar no estado normal ativo de curto prazo.

## Sinais de classificação profunda

A classificação profunda usa seis sinais-base ponderados mais reforço de fase:

| Sinal | Peso | Descrição |
| ------ | ---- | --------- |
| Frequência | 0.24 | Quantos sinais de curto prazo a entrada acumulou |
| Relevância | 0.30 | Qualidade média de recuperação da entrada |
| Diversidade de consultas | 0.15 | Contextos distintos de consulta/dia que a revelaram |
| Recência | 0.15 | Pontuação de atualização com decaimento temporal |
| Consolidação | 0.10 | Força de recorrência em múltiplos dias |
| Riqueza conceitual | 0.06 | Densidade de tags conceituais do trecho/caminho |

Acertos das fases leve e REM adicionam um pequeno reforço com decaimento temporal a partir de
`memory/.dreams/phase-signals.json`.

## Agendamento

Quando ativado, o `memory-core` gerencia automaticamente um job cron para uma varredura completa
de dreaming. Cada varredura executa as fases em ordem: leve -> REM -> profunda.

Comportamento de cadência padrão:

| Configuração | Padrão |
| ------------ | ------ |
| `dreaming.frequency` | `0 3 * * *` |

## Início rápido

Ative o dreaming:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Ative o dreaming com uma cadência personalizada de varredura:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Comando de barra

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Fluxo de trabalho da CLI

Use a promoção pela CLI para prévia ou aplicação manual:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

O `memory promote` manual usa os limites da fase profunda por padrão, a menos que sejam substituídos
com flags da CLI.

Explique por que um candidato específico seria ou não promovido:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Visualize reflexões REM, verdades candidatas e a saída de promoção profunda sem
gravar nada:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Valores padrão principais

Todas as configurações ficam em `plugins.entries.memory-core.config.dreaming`.

| Chave | Padrão |
| ----- | ------ |
| `enabled` | `false` |
| `frequency` | `0 3 * * *` |

Política de fases, limites e comportamento de armazenamento são detalhes internos de implementação
(não configuração voltada ao usuário).

Consulte a [referência de configuração de memória](/pt-BR/reference/memory-config#dreaming-experimental)
para ver a lista completa de chaves.

## Interface Dreams

Quando ativada, a aba **Dreams** do Gateway mostra:

- estado atual de ativação do dreaming
- status em nível de fase e presença de varredura gerenciada
- contagens de curto prazo, fundamentadas, de sinais e promovidas hoje
- horário da próxima execução agendada
- uma faixa Scene fundamentada distinta para entradas preparadas de replay histórico
- um leitor expansível do Diário de Sonhos com base em `doctor.memory.dreamDiary`

## Relacionado

- [Memory](/pt-BR/concepts/memory)
- [Memory Search](/pt-BR/concepts/memory-search)
- [CLI de memory](/cli/memory)
- [referência de configuração de memória](/pt-BR/reference/memory-config)
