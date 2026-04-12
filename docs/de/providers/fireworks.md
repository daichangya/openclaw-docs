---
read_when:
    - Sie möchten Fireworks mit OpenClaw verwenden.
    - Sie benötigen die Fireworks-API-Schlüssel-Umgebungsvariable oder die Standardmodell-ID.
summary: Fireworks-Einrichtung (Authentifizierung + Modellauswahl)
title: Fireworks
x-i18n:
    generated_at: "2026-04-12T23:30:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a85d9507c19e275fdd846a303d844eda8045d008774d4dde1eae408e8716b6f
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) stellt Open-Weight- und geroutete Modelle über eine OpenAI-kompatible API bereit. OpenClaw enthält ein gebündeltes Fireworks-Provider-Plugin.

| Eigenschaft   | Wert                                                   |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | OpenAI-kompatible chat/completions                     |
| Base-URL      | `https://api.fireworks.ai/inference/v1`                |
| Standardmodell | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Erste Schritte

<Steps>
  <Step title="Fireworks-Authentifizierung über das Onboarding einrichten">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Dadurch wird Ihr Fireworks-Schlüssel in der OpenClaw-Konfiguration gespeichert und das Fire-Pass-Startmodell als Standard festgelegt.

  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Nicht-interaktives Beispiel

Für skriptgesteuerte oder CI-Setups übergeben Sie alle Werte in der Befehlszeile:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Integrierter Katalog

| Modell-Ref                                            | Name                         | Eingabe    | Kontext | Maximale Ausgabe | Hinweise                                     |
| ----------------------------------------------------- | ---------------------------- | ---------- | ------- | ---------------- | -------------------------------------------- |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000          | Standardmäßig gebündeltes Startmodell auf Fireworks |

<Tip>
Wenn Fireworks ein neueres Modell veröffentlicht, etwa eine neue Qwen- oder Gemma-Version, können Sie direkt dorthin wechseln, indem Sie dessen Fireworks-Modell-ID verwenden, ohne auf ein Update des gebündelten Katalogs warten zu müssen.
</Tip>

## Benutzerdefinierte Fireworks-Modell-IDs

OpenClaw akzeptiert auch dynamische Fireworks-Modell-IDs. Verwenden Sie die genaue Modell- oder Router-ID, die Fireworks anzeigt, und stellen Sie `fireworks/` davor.

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
  <Accordion title="So funktioniert das Präfix für Modell-IDs">
    Jede Fireworks-Modell-Ref in OpenClaw beginnt mit `fireworks/`, gefolgt von der genauen ID oder dem Router-Pfad von der Fireworks-Plattform. Zum Beispiel:

    - Router-Modell: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Direktes Modell: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw entfernt das Präfix `fireworks/`, wenn die API-Anfrage erstellt wird, und sendet den verbleibenden Pfad an den Fireworks-Endpunkt.

  </Accordion>

  <Accordion title="Hinweis zur Umgebung">
    Wenn das Gateway außerhalb Ihrer interaktiven Shell läuft, stellen Sie sicher, dass `FIREWORKS_API_KEY` auch diesem Prozess zur Verfügung steht.

    <Warning>
    Ein Schlüssel, der nur in `~/.profile` liegt, hilft einem launchd/systemd-Daemon nicht, sofern diese Umgebung nicht ebenfalls dort importiert wird. Setzen Sie den Schlüssel in `~/.openclaw/.env` oder über `env.shellEnv`, damit der Gateway-Prozess ihn lesen kann.
    </Warning>

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
