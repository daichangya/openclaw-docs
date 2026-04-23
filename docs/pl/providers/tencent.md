---
read_when:
    - Chcesz używać modeli Tencent Hy z OpenClaw
    - Potrzebujesz konfiguracji klucza API TokenHub
summary: Konfiguracja Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T10:08:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90fce0d5957b261439cacd2b4df2362ed69511cb047af6a76ccaf54004806041
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Tencent Cloud jest dostarczany jako **bundled Plugin dostawcy** w OpenClaw. Zapewnia dostęp do modeli Tencent Hy przez endpoint TokenHub (`tencent-tokenhub`).

Dostawca używa API zgodnego z OpenAI.

## Szybki start

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## Przykład nieinteraktywny

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Dostawcy i endpointy

| Dostawca          | Endpoint                      | Przypadek użycia        |
| ----------------- | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy przez Tencent TokenHub |

## Dostępne modele

### tencent-tokenhub

- **hy3-preview** — Podgląd Hy3 (kontekst 256K, rozumowanie, domyślny)

## Uwagi

- Odwołania do modeli TokenHub używają formatu `tencent-tokenhub/<modelId>`.
- Plugin jest dostarczany z wbudowanymi metadanymi warstwowych cen Hy3, więc szacunki kosztów są wypełniane bez ręcznych nadpisań cen.
- W razie potrzeby nadpisz metadane cen i kontekstu w `models.providers`.

## Uwaga dotycząca środowiska

Jeśli Gateway działa jako daemon (`launchd/systemd`), upewnij się, że `TOKENHUB_API_KEY`
jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` albo przez
`env.shellEnv`).

## Powiązana dokumentacja

- [Konfiguracja OpenClaw](/pl/gateway/configuration)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
