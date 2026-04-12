---
read_when:
    - Sie möchten Mistral-Modelle in OpenClaw verwenden
    - Sie benötigen das Onboarding für den Mistral-API-Schlüssel und Modell-Refs
summary: Verwenden Sie Mistral-Modelle und Voxtral-Transkription mit OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-12T23:31:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0474f55587909ce9bbdd47b881262edbeb1b07eb3ed52de1090a8ec4d260c97b
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw unterstützt Mistral sowohl für Text-/Bild-Modellrouting (`mistral/...`) als auch
für Audio-Transkription über Voxtral im Medienverständnis.
Mistral kann auch für Memory-Embeddings verwendet werden (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel in der [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Oder übergeben Sie den Schlüssel direkt:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Ein Standardmodell festlegen">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Integrierter LLM-Katalog

OpenClaw enthält derzeit diesen gebündelten Mistral-Katalog:

| Modell-Ref                       | Eingabe     | Kontext | Maximale Ausgabe | Hinweise                                                        |
| -------------------------------- | ----------- | ------- | ---------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | Text, Bild  | 262,144 | 16,384           | Standardmodell                                                   |
| `mistral/mistral-medium-2508`    | Text, Bild  | 262,144 | 8,192            | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | Text, Bild  | 128,000 | 16,384           | Mistral Small 4; anpassbares Reasoning über API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | Text, Bild  | 128,000 | 32,768           | Pixtral                                                          |
| `mistral/codestral-latest`       | Text        | 256,000 | 4,096            | Coding                                                           |
| `mistral/devstral-medium-latest` | Text        | 262,144 | 32,768           | Devstral 2                                                       |
| `mistral/magistral-small`        | Text        | 128,000 | 40,000           | Reasoning aktiviert                                              |

## Audio-Transkription (Voxtral)

Verwenden Sie Voxtral für Audio-Transkription über die Medienverständnis-Pipeline.

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

<Tip>
Der Pfad für Medien-Transkription verwendet `/v1/audio/transcriptions`. Das Standard-Audiomodell für Mistral ist `voxtral-mini-latest`.
</Tip>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Anpassbares Reasoning (`mistral-small-latest`)">
    `mistral/mistral-small-latest` wird Mistral Small 4 zugeordnet und unterstützt [anpassbares Reasoning](https://docs.mistral.ai/capabilities/reasoning/adjustable) in der Chat-Completions-API über `reasoning_effort` (`none` minimiert zusätzliches Denken in der Ausgabe; `high` zeigt vollständige Thinking-Traces vor der endgültigen Antwort an).

    OpenClaw ordnet die Session-Stufe für **thinking** der Mistral-API zu:

    | OpenClaw-Thinking-Stufe                         | Mistral `reasoning_effort` |
    | ----------------------------------------------- | -------------------------- |
    | **off** / **minimal**                           | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** | `high`         |

    <Note>
    Andere Modelle im gebündelten Mistral-Katalog verwenden diesen Parameter nicht. Verwenden Sie weiterhin `magistral-*`-Modelle, wenn Sie Mistrals natives, reasoning-orientiertes Verhalten wünschen.
    </Note>

  </Accordion>

  <Accordion title="Memory-Embeddings">
    Mistral kann Memory-Embeddings über `/v1/embeddings` bereitstellen (Standardmodell: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth und Base URL">
    - Mistral-Auth verwendet `MISTRAL_API_KEY`.
    - Die Base URL des Providers ist standardmäßig `https://api.mistral.ai/v1`.
    - Das Standardmodell beim Onboarding ist `mistral/mistral-large-latest`.
    - Z.AI verwendet Bearer-Auth mit Ihrem API-Schlüssel.
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Medienverständnis" href="/tools/media-understanding" icon="microphone">
    Einrichtung der Audio-Transkription und Providerauswahl.
  </Card>
</CardGroup>
