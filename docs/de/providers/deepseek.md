---
read_when:
    - Sie möchten DeepSeek mit OpenClaw verwenden.
    - Sie benötigen die API-Schlüssel-Umgebungsvariable oder die CLI-Option zur Authentifizierungsauswahl.
summary: DeepSeek-Einrichtung (Authentifizierung + Modellauswahl)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-12T23:30:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad06880bd1ab89f72f9e31f4927e2c099dcf6b4e0ff2b3fcc91a24468fbc089d
    source_path: providers/deepseek.md
    workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com) bietet leistungsstarke KI-Modelle mit einer OpenAI-kompatiblen API.

| Eigenschaft | Wert                       |
| ----------- | -------------------------- |
| Provider    | `deepseek`                 |
| Auth        | `DEEPSEEK_API_KEY`         |
| API         | OpenAI-kompatibel          |
| Base-URL    | `https://api.deepseek.com` |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Erstellen Sie einen API-Schlüssel unter [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Dadurch werden Sie nach Ihrem API-Schlüssel gefragt und `deepseek/deepseek-chat` als Standardmodell festgelegt.

  </Step>
  <Step title="Prüfen, ob Modelle verfügbar sind">
    ```bash
    openclaw models list --provider deepseek
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Nicht-interaktive Einrichtung">
    Für skriptgesteuerte oder Headless-Installationen übergeben Sie alle Flags direkt:

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

| Modell-Ref                  | Name               | Eingabe | Kontext | Maximale Ausgabe | Hinweise                                          |
| --------------------------- | ------------------ | ------- | ------- | ---------------- | ------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat      | Text    | 131,072 | 8,192            | Standardmodell; DeepSeek-V3.2-Oberfläche ohne Thinking |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner  | Text    | 131,072 | 65,536           | Reasoning-fähige V3.2-Oberfläche                  |

<Tip>
Beide gebündelten Modelle deklarieren derzeit im Quellcode Kompatibilität mit Streaming-Nutzung.
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
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
</CardGroup>
