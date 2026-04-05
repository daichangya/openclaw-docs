---
read_when:
    - Sie möchten Fireworks mit OpenClaw verwenden
    - Sie benötigen die env var für den Fireworks-API-Schlüssel oder die Standard-Modell-ID
summary: Fireworks-Einrichtung (Authentifizierung + Modellauswahl)
x-i18n:
    generated_at: "2026-04-05T12:52:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20083d5c248abd9a7223e6d188f0265ae27381940ee0067dff6d1d46d908c552
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) stellt Open-Weight- und geroutete Modelle über eine OpenAI-kompatible API bereit. OpenClaw enthält jetzt ein gebündeltes Fireworks-Provider-Plugin.

- Provider: `fireworks`
- Authentifizierung: `FIREWORKS_API_KEY`
- API: OpenAI-kompatible Chat-/Completions-API
- Base URL: `https://api.fireworks.ai/inference/v1`
- Standardmodell: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`

## Schnellstart

Richten Sie die Fireworks-Authentifizierung über das Onboarding ein:

```bash
openclaw onboard --auth-choice fireworks-api-key
```

Dadurch wird Ihr Fireworks-Schlüssel in der OpenClaw-Konfiguration gespeichert und das Fire-Pass-Startermodell als Standard festgelegt.

## Nicht interaktives Beispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Hinweis zur Umgebung

Wenn das Gateway außerhalb Ihrer interaktiven Shell läuft, stellen Sie sicher, dass `FIREWORKS_API_KEY`
auch für diesen Prozess verfügbar ist. Ein Schlüssel, der nur in `~/.profile` steht, hilft
einem `launchd`-/`systemd`-Daemon nicht, sofern diese Umgebung dort nicht ebenfalls importiert wird.

## Integrierter Katalog

| Modellreferenz                                         | Name                        | Eingabe    | Kontext | Max. Ausgabe | Hinweise                                   |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ------------ | ------------------------------------------ |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000      | Standardmäßig gebündeltes Startermodell auf Fireworks |

## Benutzerdefinierte Fireworks-Modell-IDs

OpenClaw akzeptiert auch dynamische Fireworks-Modell-IDs. Verwenden Sie die genaue Modell- oder Router-ID, die von Fireworks angezeigt wird, und stellen Sie `fireworks/` voran.

Beispiel:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

Wenn Fireworks ein neueres Modell veröffentlicht, etwa ein aktuelles Qwen- oder Gemma-Release, können Sie direkt darauf umstellen, indem Sie seine Fireworks-Modell-ID verwenden, ohne auf ein Update des gebündelten Katalogs warten zu müssen.
