---
read_when:
    - Sie möchten Tencent-Hunyuan-Modelle mit OpenClaw verwenden.
    - Sie benötigen die Einrichtung des TokenHub-API-Schlüssels.
summary: Einrichtung von Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T14:06:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90fce0d5957b261439cacd2b4df2362ed69511cb047af6a76ccaf54004806041
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Tencent Cloud wird in OpenClaw als **gebündelter Provider-Plugin** ausgeliefert. Er bietet Zugriff auf Tencent-Hy-Modelle über den TokenHub-Endpunkt (`tencent-tokenhub`).

Der Provider verwendet eine OpenAI-kompatible API.

## Schnellstart

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## Nicht interaktives Beispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Provider und Endpunkte

| Provider           | Endpunkt                     | Anwendungsfall          |
| ------------------ | ---------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy über Tencent TokenHub |

## Verfügbare Modelle

### tencent-tokenhub

- **hy3-preview** — Hy3-Vorschau (256K Kontext, Reasoning, Standard)

## Hinweise

- TokenHub-Modellreferenzen verwenden `tencent-tokenhub/<modelId>`.
- Das Plugin enthält integrierte Metadaten zu gestaffelten Hy3-Preisen, sodass Kostenschätzungen ohne manuelle Preisüberschreibungen ausgefüllt werden.
- Überschreiben Sie Preis- und Kontextmetadaten bei Bedarf in `models.providers`.

## Hinweis zur Umgebung

Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `TOKENHUB_API_KEY`
diesem Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).

## Verwandte Dokumentation

- [OpenClaw-Konfiguration](/de/gateway/configuration)
- [Modell-Provider](/de/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
