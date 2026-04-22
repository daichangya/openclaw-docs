---
read_when:
    - Você quer usar modelos Tencent Hy com OpenClaw
    - Você precisa da chave de API do TokenHub ou da configuração do plano de tokens (LKEAP)
summary: Configuração do Tencent Cloud TokenHub e do plano de tokens (chaves separadas)
title: Tencent Cloud (TokenHub + plano de tokens)
x-i18n:
    generated_at: "2026-04-22T05:34:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: c0f04fcfcb6e14b17c3bc8f3c7ca3f20f8dabfaa89813a0566c0672439d4afff
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub + plano de tokens)

O provedor Tencent Cloud dá acesso aos modelos Tencent Hy por meio de dois endpoints
com chaves de API separadas:

- **TokenHub** (`tencent-tokenhub`) — chama o Hy pelo Gateway do Tencent TokenHub
- **Plano de tokens** (`tencent-token-plan`) — chama o Hy pelo endpoint de
  plano de tokens do LKEAP

Ambos os provedores usam APIs compatíveis com OpenAI.

## Início rápido

TokenHub:

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

Plano de tokens:

```bash
openclaw onboard --auth-choice tencent-token-plan-api-key
```

## Exemplo não interativo

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# Token Plan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tencent-token-plan-api-key \
  --tencent-token-plan-api-key "$LKEAP_API_KEY" \
  --skip-health \
  --accept-risk
```

## Provedores e endpoints

| Provedor             | Endpoint                              | Caso de uso             |
| -------------------- | ------------------------------------- | ----------------------- |
| `tencent-tokenhub`   | `tokenhub.tencentmaas.com/v1`         | Hy via Tencent TokenHub |
| `tencent-token-plan` | `api.lkeap.cloud.tencent.com/plan/v3` | Hy via plano de tokens do LKEAP |

Cada provedor usa sua própria chave de API. A configuração registra apenas o provedor selecionado.

## Modelos disponíveis

### tencent-tokenhub

- **hy3-preview** — prévia do Hy3 (contexto de 256K, raciocínio, padrão)

### tencent-token-plan

- **hy3-preview** — prévia do Hy3 (contexto de 256K, raciocínio, padrão)

## Observações

- As referências de modelo do TokenHub usam `tencent-tokenhub/<modelId>`. As referências de modelo do plano de tokens
  usam `tencent-token-plan/<modelId>`.
- Substitua os metadados de preço e contexto em `models.providers` se necessário.

## Observação sobre ambiente

Se o Gateway for executado como daemon (`launchd`/`systemd`), verifique se `TOKENHUB_API_KEY`
ou `LKEAP_API_KEY` está disponível para esse processo (por exemplo, em
`~/.openclaw/.env` ou via `env.shellEnv`).

## Documentação relacionada

- [Configuração do OpenClaw](/pt-BR/gateway/configuration)
- [Provedores de modelos](/pt-BR/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
- [API do plano de tokens da Tencent](https://cloud.tencent.com/document/product/1823/130060)
