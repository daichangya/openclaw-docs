---
read_when:
    - Sie möchten Mistral-Modelle in OpenClaw verwenden
    - Sie benötigen Onboarding mit Mistral-API-Schlüssel und Modellreferenzen
summary: Mistral-Modelle und Voxtral-Transkription mit OpenClaw verwenden
title: Mistral
x-i18n:
    generated_at: "2026-04-05T12:53:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f61b9e0656dd7e0243861ddf14b1b41a07c38bff27cef9ad0815d14c8e34408
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw unterstützt Mistral sowohl für das Routing von Text-/Bildmodellen (`mistral/...`) als auch
für Audiotranskription über Voxtral im Bereich Media-Understanding.
Mistral kann auch für Memory-Embeddings verwendet werden (`memorySearch.provider = "mistral"`).

## CLI-Einrichtung

```bash
openclaw onboard --auth-choice mistral-api-key
# oder nicht interaktiv
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## Konfigurationsausschnitt (LLM-Provider)

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## Integrierter LLM-Katalog

OpenClaw liefert derzeit diesen gebündelten Mistral-Katalog aus:

| Modellreferenz                   | Eingabe     | Kontext | Max. Ausgabe | Hinweise                 |
| -------------------------------- | ----------- | ------- | ------------ | ------------------------ |
| `mistral/mistral-large-latest`   | Text, Bild  | 262,144 | 16,384       | Standardmodell           |
| `mistral/mistral-medium-2508`    | Text, Bild  | 262,144 | 8,192        | Mistral Medium 3.1       |
| `mistral/mistral-small-latest`   | Text, Bild  | 128,000 | 16,384       | Kleineres multimodales Modell |
| `mistral/pixtral-large-latest`   | Text, Bild  | 128,000 | 32,768       | Pixtral                  |
| `mistral/codestral-latest`       | Text        | 256,000 | 4,096        | Coding                   |
| `mistral/devstral-medium-latest` | Text        | 262,144 | 32,768       | Devstral 2               |
| `mistral/magistral-small`        | Text        | 128,000 | 40,000       | Mit Reasoning-Funktion   |

## Konfigurationsausschnitt (Audiotranskription mit Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

## Hinweise

- Die Mistral-Authentifizierung verwendet `MISTRAL_API_KEY`.
- Die Standard-Base-URL des Providers ist `https://api.mistral.ai/v1`.
- Das Onboarding-Standardmodell ist `mistral/mistral-large-latest`.
- Das Standard-Audiomodell für Mistral im Bereich Media-Understanding ist `voxtral-mini-latest`.
- Der Pfad für Medientranskription verwendet `/v1/audio/transcriptions`.
- Der Pfad für Memory-Embeddings verwendet `/v1/embeddings` (Standardmodell: `mistral-embed`).
