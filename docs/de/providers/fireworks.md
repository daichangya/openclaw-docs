---
read_when:
    - Sie möchten Fireworks mit OpenClaw verwenden.
    - Sie benötigen die Fireworks-API-Key-Umgebungsvariable oder die Standardmodell-ID.
summary: Einrichtung von Fireworks (Authentifizierung + Modellauswahl)
title: Fireworks
x-i18n:
    generated_at: "2026-04-24T06:53:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 15
---

[Fireworks](https://fireworks.ai) stellt Open-Weight- und geroutete Modelle über eine OpenAI-kompatible API bereit. OpenClaw enthält ein gebündeltes Fireworks-Provider-Plugin.

| Eigenschaft   | Wert                                                     |
| ------------- | -------------------------------------------------------- |
| Provider      | `fireworks`                                              |
| Auth          | `FIREWORKS_API_KEY`                                      |
| API           | OpenAI-kompatibler Chat/Completions                      |
| Base URL      | `https://api.fireworks.ai/inference/v1`                  |
| Standardmodell | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`  |

## Erste Schritte

<Steps>
  <Step title="Fireworks-Authentifizierung über Onboarding einrichten">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Dadurch wird Ihr Fireworks-Key in der OpenClaw-Konfiguration gespeichert und das Fire-Pass-Startermodell als Standard gesetzt.

  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Nicht interaktives Beispiel

Für skriptbasierte oder CI-Setups übergeben Sie alle Werte in der Befehlszeile:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Eingebauter Katalog

| Modellreferenz                                       | Name                        | Eingabe    | Kontext | Max. Ausgabe | Hinweise                                                                                                                                             |
| ---------------------------------------------------- | --------------------------- | ---------- | ------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`      | Kimi K2.6                   | text,image | 262,144 | 262,144      | Neuestes Kimi-Modell auf Fireworks. Thinking ist für Fireworks-K2.6-Anfragen deaktiviert; leiten Sie direkt über Moonshot, wenn Sie Kimi-Thinking-Ausgabe benötigen. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000      | Gebündeltes Standard-Startermodell auf Fireworks                                                                                                   |

<Tip>
Wenn Fireworks ein neueres Modell veröffentlicht, etwa ein neues Qwen- oder Gemma-Release, können Sie direkt darauf wechseln, indem Sie dessen Fireworks-Modell-ID verwenden, ohne auf ein Update des gebündelten Katalogs warten zu müssen.
</Tip>

## Benutzerdefinierte Fireworks-Modell-IDs

OpenClaw akzeptiert auch dynamische Fireworks-Modell-IDs. Verwenden Sie die exakte Modell- oder Router-ID, die von Fireworks angezeigt wird, und stellen Sie `fireworks/` voran.

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

<AccordionGroup>
  <Accordion title="Wie das Präfixing von Modell-IDs funktioniert">
    Jede Fireworks-Modellreferenz in OpenClaw beginnt mit `fireworks/`, gefolgt von der exakten ID oder dem Router-Pfad von der Fireworks-Plattform. Zum Beispiel:

    - Router-Modell: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Direktes Modell: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw entfernt das Präfix `fireworks/`, wenn die API-Anfrage erstellt wird, und sendet den verbleibenden Pfad an den Fireworks-Endpunkt.

  </Accordion>

  <Accordion title="Hinweis zur Umgebung">
    Wenn das Gateway außerhalb Ihrer interaktiven Shell läuft, stellen Sie sicher, dass `FIREWORKS_API_KEY` auch diesem Prozess zur Verfügung steht.

    <Warning>
    Ein Schlüssel, der nur in `~/.profile` liegt, hilft einem launchd/systemd-Daemon nicht, sofern diese Umgebung dort nicht ebenfalls importiert wird. Setzen Sie den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv`, damit der Gateway-Prozess ihn lesen kann.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
