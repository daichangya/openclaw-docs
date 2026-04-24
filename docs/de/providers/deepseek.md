---
read_when:
    - Sie möchten DeepSeek mit OpenClaw verwenden
    - Sie benötigen die API-Key-Umgebungsvariable oder die CLI-Auth-Auswahl
summary: DeepSeek-Einrichtung (Auth + Modellauswahl)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-24T06:53:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: ead407c67c05bd8700db1cba36defdd9d47bdc9a071c76a07c4b4fb82f6b80e2
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) bietet leistungsstarke KI-Modelle mit einer OpenAI-kompatiblen API.

| Eigenschaft | Wert                       |
| ----------- | -------------------------- |
| Provider    | `deepseek`                 |
| Auth        | `DEEPSEEK_API_KEY`         |
| API         | OpenAI-kompatibel          |
| Base URL    | `https://api.deepseek.com` |

## Erste Schritte

<Steps>
  <Step title="Ihren API-Schlüssel holen">
    Erstellen Sie einen API-Schlüssel unter [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Dadurch werden Sie nach Ihrem API-Schlüssel gefragt, und `deepseek/deepseek-chat` wird als Standardmodell gesetzt.

  </Step>
  <Step title="Prüfen, dass Modelle verfügbar sind">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Nicht-interaktive Einrichtung">
    Für skriptgesteuerte oder headless Installationen übergeben Sie alle Flags direkt:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `DEEPSEEK_API_KEY`
diesem Prozess zur Verfügung steht (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).
</Warning>

## Integrierter Katalog

| Modell-Ref                   | Name                | Eingabe | Kontext | Max. Ausgabe | Hinweise                                             |
| ---------------------------- | ------------------- | ------- | ------- | ------------ | ---------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat       | Text    | 131,072 | 8,192        | Standardmodell; DeepSeek V3.2 ohne Thinking-Oberfläche |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner   | Text    | 131,072 | 65,536       | Thinking-fähige V3.2-Oberfläche                      |

<Tip>
Beide gebündelten Modelle weisen derzeit in der Quelle Streaming-Usage-Kompatibilität aus.
</Tip>

## Konfigurationsbeispiel

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
    },
  },
}
```

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
