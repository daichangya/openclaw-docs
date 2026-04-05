---
x-i18n:
    generated_at: "2026-04-05T12:34:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: adff26fa8858af2759b231ea48bfc01f89c110cd9b3774a8f783e282c16f77fb
    source_path: .i18n/README.md
    workflow: 15
---

# Recursos de i18n da documentação do OpenClaw

Esta pasta armazena a configuração de tradução para o repositório de origem da documentação.

As árvores de locale geradas e a memória de tradução ativa agora ficam no repositório de publicação:

- repositório: `openclaw/docs`
- checkout local: `~/Projects/openclaw-docs`

## Fonte da verdade

- A documentação em inglês é criada em `openclaw/openclaw`.
- A árvore da documentação de origem fica em `docs/`.
- O repositório de origem não mantém mais árvores de locale geradas com commit, como `docs/zh-CN/**`, `docs/ja-JP/**`, `docs/es/**`, `docs/pt-BR/**`, `docs/ko/**`, `docs/de/**`, `docs/fr/**` ou `docs/ar/**`.

## Fluxo de ponta a ponta

1. Edite a documentação em inglês em `openclaw/openclaw`.
2. Envie para `main`.
3. `openclaw/openclaw/.github/workflows/docs-sync-publish.yml` espelha a árvore de documentação em `openclaw/docs`.
4. O script de sincronização reescreve o `docs/docs.json` de publicação para que os blocos gerados do seletor de locale existam ali, mesmo que não estejam mais com commit no repositório de origem.
5. `openclaw/docs/.github/workflows/translate-zh-cn.yml` atualiza `docs/zh-CN/**` uma vez por dia, sob demanda e após despachos de release do repositório de origem.
6. `openclaw/docs/.github/workflows/translate-ja-jp.yml` faz o mesmo para `docs/ja-JP/**`.
7. `openclaw/docs/.github/workflows/translate-es.yml`, `translate-pt-br.yml`, `translate-ko.yml`, `translate-de.yml`, `translate-fr.yml` e `translate-ar.yml` fazem o mesmo para `docs/es/**`, `docs/pt-BR/**`, `docs/ko/**`, `docs/de/**`, `docs/fr/**` e `docs/ar/**`.

## Por que essa separação existe

- Mantém a saída de locale gerada fora do repositório principal do produto.
- Mantém o Mintlify em uma única árvore de documentação publicada.
- Preserva o alternador de idioma integrado, permitindo que o repositório de publicação seja o responsável pelas árvores de locale geradas.

## Arquivos nesta pasta

- `glossary.<lang>.json` — mapeamentos de termos preferidos usados como orientação no prompt.
- `ar-navigation.json`, `de-navigation.json`, `es-navigation.json`, `fr-navigation.json`, `ja-navigation.json`, `ko-navigation.json`, `pt-BR-navigation.json`, `zh-Hans-navigation.json` — blocos do seletor de locale do Mintlify reinseridos no repositório de publicação durante a sincronização.
- `<lang>.tm.jsonl` — memória de tradução indexada por workflow + modelo + hash do texto.

Neste repositório, arquivos TM de locale gerados como `docs/.i18n/zh-CN.tm.jsonl`, `docs/.i18n/ja-JP.tm.jsonl`, `docs/.i18n/es.tm.jsonl`, `docs/.i18n/pt-BR.tm.jsonl`, `docs/.i18n/ko.tm.jsonl`, `docs/.i18n/de.tm.jsonl`, `docs/.i18n/fr.tm.jsonl` e `docs/.i18n/ar.tm.jsonl` intencionalmente não são mais mantidos com commit.

## Formato do glossário

`glossary.<lang>.json` é uma matriz de entradas:

```json
{
  "source": "troubleshooting",
  "target": "故障排除"
}
```

Campos:

- `source`: frase em inglês (ou no idioma de origem) a ser preferida.
- `target`: saída de tradução preferida.

## Mecânica da tradução

- `scripts/docs-i18n` ainda é responsável pela geração da tradução.
- O modo de documentação grava `x-i18n.source_hash` em cada página traduzida.
- Cada workflow de publicação pré-calcula uma lista de arquivos pendentes comparando o hash atual da origem em inglês com o `x-i18n.source_hash` armazenado no locale.
- Se a contagem de pendentes for `0`, a etapa cara de tradução será totalmente ignorada.
- Se houver arquivos pendentes, o workflow traduz apenas esses arquivos.
- O workflow de publicação tenta novamente em caso de falhas transitórias de formato do modelo, mas os arquivos inalterados continuam sendo ignorados porque a mesma verificação de hash é executada em cada nova tentativa.
- O repositório de origem também despacha atualizações de zh-CN, ja-JP, es, pt-BR, ko, de, fr e ar após releases publicadas no GitHub para que a documentação de release possa ser atualizada sem esperar pelo cron diário.

## Observações operacionais

- Os metadados de sincronização são gravados em `.openclaw-sync/source.json` no repositório de publicação.
- Segredo do repositório de origem: `OPENCLAW_DOCS_SYNC_TOKEN`
- Segredo do repositório de publicação: `OPENCLAW_DOCS_I18N_OPENAI_API_KEY`
- Se a saída de locale parecer desatualizada, verifique primeiro o workflow `Translate <locale>` correspondente em `openclaw/docs`.
