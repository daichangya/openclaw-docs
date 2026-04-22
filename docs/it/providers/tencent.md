---
read_when:
    - Vuoi usare i modelli Tencent Hy con OpenClaw
    - Hai bisogno della configurazione della chiave API di TokenHub
summary: Configurazione di Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-22T08:20:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04da073973792c55dc0c2d287bfc51187bb2128bbbd5c4a483f850adeea50ab5
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Il provider Tencent Cloud consente l'accesso ai modelli Tencent Hy tramite l'endpoint TokenHub (`tencent-tokenhub`).

Il provider usa un'API compatibile con OpenAI.

## Avvio rapido

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## Esempio non interattivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Provider ed endpoint

| Provider           | Endpoint                      | Caso d'uso              |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy tramite Tencent TokenHub |

## Modelli disponibili

### tencent-tokenhub

- **hy3-preview** — Anteprima di Hy3 (contesto 256K, ragionamento, predefinito)

## Note

- I riferimenti modello TokenHub usano `tencent-tokenhub/<modelId>`.
- Se necessario, sostituisci i metadati di prezzo e contesto in `models.providers`.

## Nota sull'ambiente

Se il Gateway è in esecuzione come demone (launchd/systemd), assicurati che `TOKENHUB_API_KEY` sia disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite `env.shellEnv`).

## Documentazione correlata

- [Configurazione di OpenClaw](/it/gateway/configuration)
- [Provider di modelli](/it/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
