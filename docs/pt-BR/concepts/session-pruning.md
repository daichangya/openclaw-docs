---
read_when:
    - Você quer reduzir o crescimento do contexto causado por saídas de ferramentas
    - Você quer entender a otimização do cache de prompt da Anthropic
summary: Remoção de resultados antigos de ferramentas para manter o contexto enxuto e o cache eficiente
title: Poda de sessão
x-i18n:
    generated_at: "2026-04-05T12:40:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1569a50e0018cca3e3ceefbdddaf093843df50cdf2f7bf62fe925299875cb487
    source_path: concepts/session-pruning.md
    workflow: 15
---

# Poda de sessão

A poda de sessão remove **resultados antigos de ferramentas** do contexto antes de cada
chamada ao LLM. Ela reduz o inchaço do contexto causado pelo acúmulo de saídas de ferramentas (resultados de `exec`, leituras de arquivos, resultados de busca) sem reescrever o texto normal da conversa.

<Info>
A poda ocorre apenas em memória -- ela não modifica a transcrição da sessão em disco.
Seu histórico completo é sempre preservado.
</Info>

## Por que isso importa

Sessões longas acumulam saída de ferramentas, o que infla a janela de contexto. Isso
aumenta o custo e pode forçar a [compactação](/concepts/compaction) antes do
necessário.

A poda é especialmente valiosa para o **cache de prompt da Anthropic**. Depois que o TTL do cache
expira, a próxima solicitação recria o cache do prompt completo. A poda reduz o
tamanho da gravação no cache, diminuindo diretamente o custo.

## Como funciona

1. Espera o TTL do cache expirar (padrão de 5 minutos).
2. Encontra resultados antigos de ferramentas para a poda normal (o texto da conversa é deixado intacto).
3. **Soft-trim** de resultados grandes demais -- mantém o início e o fim, inserindo `...`.
4. **Hard-clear** do restante -- substitui por um placeholder.
5. Redefine o TTL para que solicitações de acompanhamento reutilizem o cache recém-atualizado.

## Limpeza de imagens legadas

O OpenClaw também executa uma limpeza idempotente separada para sessões legadas mais antigas que
persistiram blocos brutos de imagem no histórico.

- Ele preserva os **3 turnos concluídos mais recentes** byte por byte para que os
  prefixos do cache de prompt de acompanhamentos recentes permaneçam estáveis.
- Blocos de imagem antigos já processados no histórico `user` ou `toolResult` podem ser
  substituídos por `[image data removed - already processed by model]`.
- Isso é separado da poda normal por TTL de cache. Existe para impedir que cargas repetidas
  de imagem invalidem caches de prompt em turnos posteriores.

## Padrões inteligentes

O OpenClaw ativa automaticamente a poda para perfis Anthropic:

| Tipo de perfil                                          | Poda ativada | Heartbeat |
| ------------------------------------------------------- | ------------ | --------- |
| Autenticação OAuth/token da Anthropic (incluindo reutilização da Claude CLI) | Sim | 1 hora |
| Chave de API                                            | Sim          | 30 min    |

Se você definir valores explícitos, o OpenClaw não os substitui.

## Ativar ou desativar

A poda fica desativada por padrão para provedores não Anthropic. Para ativar:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Para desativar: defina `mode: "off"`.

## Poda vs compactação

|            | Poda                 | Compactação            |
| ---------- | -------------------- | ---------------------- |
| **O que**  | Remove resultados de ferramentas | Resume a conversa |
| **É salva?** | Não (por solicitação) | Sim (na transcrição) |
| **Escopo** | Apenas resultados de ferramentas | Conversa inteira |

Elas se complementam -- a poda mantém a saída de ferramentas enxuta entre
ciclos de compactação.

## Leitura adicional

- [Compactação](/concepts/compaction) -- redução de contexto baseada em resumo
- [Configuração do gateway](/gateway/configuration) -- todos os controles de configuração de poda
  (`contextPruning.*`)
