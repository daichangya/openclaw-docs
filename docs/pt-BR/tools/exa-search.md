---
read_when:
    - Você quer usar o Exa para `web_search`
    - Você precisa de uma `EXA_API_KEY`
    - Você quer busca neural ou extração de conteúdo
summary: Busca Exa AI -- busca neural e por palavras-chave com extração de conteúdo
title: Busca Exa
x-i18n:
    generated_at: "2026-04-05T12:54:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 307b727b4fb88756cac51c17ffd73468ca695c4481692e03d0b4a9969982a2a8
    source_path: tools/exa-search.md
    workflow: 15
---

# Busca Exa

O OpenClaw oferece suporte ao [Exa AI](https://exa.ai/) como provider de `web_search`. O Exa
oferece modos de busca neural, por palavras-chave e híbrida com
extração de conteúdo integrada (destaques, texto, resumos).

## Obtenha uma chave de API

<Steps>
  <Step title="Crie uma conta">
    Cadastre-se em [exa.ai](https://exa.ai/) e gere uma chave de API no seu
    painel.
  </Step>
  <Step title="Armazene a chave">
    Defina `EXA_API_KEY` no ambiente do Gateway ou configure por meio de:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Configuração

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // opcional se EXA_API_KEY estiver definida
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**Alternativa por ambiente:** defina `EXA_API_KEY` no ambiente do Gateway.
Para uma instalação de gateway, coloque-a em `~/.openclaw/.env`.

## Parâmetros da ferramenta

| Parâmetro     | Descrição                                                                    |
| ------------- | ---------------------------------------------------------------------------- |
| `query`       | Consulta de busca (obrigatório)                                              |
| `count`       | Resultados a retornar (1-100)                                                |
| `type`        | Modo de busca: `auto`, `neural`, `fast`, `deep`, `deep-reasoning` ou `instant` |
| `freshness`   | Filtro de tempo: `day`, `week`, `month` ou `year`                            |
| `date_after`  | Resultados após esta data (YYYY-MM-DD)                                       |
| `date_before` | Resultados antes desta data (YYYY-MM-DD)                                     |
| `contents`    | Opções de extração de conteúdo (veja abaixo)                                 |

### Extração de conteúdo

O Exa pode retornar conteúdo extraído junto com os resultados da busca. Passe um objeto `contents`
para ativar:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // texto completo da página
    highlights: { numSentences: 3 }, // frases principais
    summary: true, // resumo por IA
  },
});
```

| Opção de `contents` | Tipo                                                                  | Descrição                 |
| --------------- | --------------------------------------------------------------------- | ------------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | Extrai o texto completo da página |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | Extrai frases principais  |
| `summary`       | `boolean \| { query }`                                                | Resumo gerado por IA      |

### Modos de busca

| Modo             | Descrição                            |
| ---------------- | ------------------------------------ |
| `auto`           | O Exa escolhe o melhor modo (padrão) |
| `neural`         | Busca semântica/baseada em significado |
| `fast`           | Busca rápida por palavras-chave      |
| `deep`           | Busca profunda detalhada             |
| `deep-reasoning` | Busca profunda com reasoning         |
| `instant`        | Resultados mais rápidos              |

## Observações

- Se nenhuma opção `contents` for fornecida, o Exa usa por padrão `{ highlights: true }`
  para que os resultados incluam trechos com frases principais
- Os resultados preservam os campos `highlightScores` e `summary` da
  resposta da API Exa quando disponíveis
- As descrições dos resultados são resolvidas primeiro a partir de destaques, depois de resumo e por fim
  de texto completo — o que estiver disponível
- `freshness` e `date_after`/`date_before` não podem ser combinados — use um
  único modo de filtro temporal
- Até 100 resultados podem ser retornados por consulta (sujeito aos limites
  do tipo de busca do Exa)
- Os resultados são armazenados em cache por 15 minutos por padrão (configurável por meio de
  `cacheTtlMinutes`)
- O Exa é uma integração oficial de API com respostas JSON estruturadas

## Relacionados

- [Visão geral do Web Search](/tools/web) -- todos os providers e detecção automática
- [Brave Search](/tools/brave-search) -- resultados estruturados com filtros de país/idioma
- [Perplexity Search](/tools/perplexity-search) -- resultados estruturados com filtragem de domínio
