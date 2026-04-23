---
read_when:
    - Você quer usar modelos Tencent Hy com o OpenClaw
    - Você precisa da configuração da chave de API do TokenHub
summary: Configuração do Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T05:43:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04da073973792c55dc0c2d287bfc51187bb2128bbbd5c4a483f850adeea50ab5
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

O provider Tencent Cloud dá acesso aos modelos Tencent Hy por meio do endpoint
TokenHub (`tencent-tokenhub`).

O provider usa uma API compatível com OpenAI.

## Início rápido

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## Exemplo não interativo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Providers e endpoints

| Provider           | Endpoint                      | Caso de uso             |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy via Tencent TokenHub |

## Modelos disponíveis

### tencent-tokenhub

- **hy3-preview** — Prévia do Hy3 (contexto de 256K, raciocínio, padrão)

## Observações

- As referências de modelo do TokenHub usam `tencent-tokenhub/<modelId>`.
- Sobrescreva metadados de preço e contexto em `models.providers` se necessário.

## Observação sobre ambiente

Se o Gateway rodar como daemon (launchd/systemd), verifique se `TOKENHUB_API_KEY`
está disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).

## Documentação relacionada

- [Configuração do OpenClaw](/pt-BR/gateway/configuration)
- [Providers de modelos](/pt-BR/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
