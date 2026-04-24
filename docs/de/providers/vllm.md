---
read_when:
    - Sie möchten OpenClaw gegen einen lokalen vLLM-Server ausführen
    - Sie möchten OpenAI-kompatible `/v1`-Endpunkte mit Ihren eigenen Modellen verwenden
summary: OpenClaw mit vLLM ausführen (OpenAI-kompatibler lokaler Server)
title: vLLM
x-i18n:
    generated_at: "2026-04-24T06:56:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0296422a926c83b1ab5ffdac7857e34253b624f0d8756c02d49f8805869a219
    source_path: providers/vllm.md
    workflow: 15
---

vLLM kann Open-Source-Modelle (und einige benutzerdefinierte Modelle) über eine **OpenAI-kompatible** HTTP-API bereitstellen. OpenClaw verbindet sich mit vLLM über die API `openai-completions`.

OpenClaw kann verfügbare Modelle aus vLLM auch **automatisch erkennen**, wenn Sie sich dafür mit `VLLM_API_KEY` entscheiden (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt) und Sie keinen expliziten Eintrag `models.providers.vllm` definieren.

OpenClaw behandelt `vllm` als lokalen OpenAI-kompatiblen Provider, der
gestreamtes Usage-Accounting unterstützt, sodass Status-/Kontext-Token-Anzahlen aus
Antworten von `stream_options.include_usage` aktualisiert werden können.

| Eigenschaft      | Wert                                     |
| ---------------- | ---------------------------------------- |
| Provider-ID      | `vllm`                                   |
| API              | `openai-completions` (OpenAI-kompatibel) |
| Auth             | Umgebungsvariable `VLLM_API_KEY`         |
| Standard-Base-URL | `http://127.0.0.1:8000/v1`              |

## Erste Schritte

<Steps>
  <Step title="vLLM mit einem OpenAI-kompatiblen Server starten">
    Ihre Base-URL sollte Endpunkte unter `/v1` bereitstellen (z. B. `/v1/models`, `/v1/chat/completions`). vLLM läuft häufig unter:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Die Umgebungsvariable für den API-Schlüssel setzen">
    Jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Ein Modell auswählen">
    Ersetzen Sie dies durch eine Ihrer vLLM-Modell-IDs:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Modell-Discovery (impliziter Provider)

Wenn `VLLM_API_KEY` gesetzt ist (oder ein Authentifizierungsprofil existiert) und Sie **nicht** `models.providers.vllm` definieren, fragt OpenClaw ab:

```
GET http://127.0.0.1:8000/v1/models
```

und wandelt die zurückgegebenen IDs in Modelleinträge um.

<Note>
Wenn Sie `models.providers.vllm` explizit setzen, wird die automatische Discovery übersprungen und Sie müssen Modelle manuell definieren.
</Note>

## Explizite Konfiguration (manuelle Modelle)

Verwenden Sie explizite Konfiguration, wenn:

- vLLM auf einem anderen Host oder Port läuft
- Sie `contextWindow`- oder `maxTokens`-Werte anheften möchten
- Ihr Server einen echten API-Schlüssel erfordert (oder Sie Header steuern möchten)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Verhalten im Stil eines Proxys">
    vLLM wird als `/v1`-Backend im Stil eines OpenAI-kompatiblen Proxys behandelt, nicht als nativer
    OpenAI-Endpunkt. Das bedeutet:

    | Verhalten | Angewendet? |
    |----------|-------------|
    | Native OpenAI-Formung von Requests | Nein |
    | `service_tier` | Wird nicht gesendet |
    | Responses `store` | Wird nicht gesendet |
    | Prompt-Cache-Hints | Werden nicht gesendet |
    | OpenAI-Reasoning-Kompatibilitätsformung der Payload | Wird nicht angewendet |
    | Versteckte OpenClaw-Attributions-Header | Werden bei benutzerdefinierten Base-URLs nicht injiziert |

  </Accordion>

  <Accordion title="Benutzerdefinierte Base-URL">
    Wenn Ihr vLLM-Server auf einem nicht standardmäßigen Host oder Port läuft, setzen Sie `baseUrl` in der expliziten Provider-Konfiguration:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Server nicht erreichbar">
    Prüfen Sie, ob der vLLM-Server läuft und erreichbar ist:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Wenn Sie einen Verbindungsfehler sehen, prüfen Sie Host, Port und dass vLLM im OpenAI-kompatiblen Servermodus gestartet wurde.

  </Accordion>

  <Accordion title="Authentifizierungsfehler bei Requests">
    Wenn Requests mit Authentifizierungsfehlern fehlschlagen, setzen Sie einen echten `VLLM_API_KEY`, der zu Ihrer Serverkonfiguration passt, oder konfigurieren Sie den Provider explizit unter `models.providers.vllm`.

    <Tip>
    Wenn Ihr vLLM-Server keine Authentifizierung erzwingt, funktioniert jeder nicht leere Wert für `VLLM_API_KEY` als Opt-in-Signal für OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Keine Modelle entdeckt">
    Die automatische Discovery erfordert, dass `VLLM_API_KEY` gesetzt ist **und** kein expliziter Konfigurationseintrag `models.providers.vllm` vorhanden ist. Wenn Sie den Provider manuell definiert haben, überspringt OpenClaw die Discovery und verwendet nur Ihre deklarierten Modelle.
  </Accordion>
</AccordionGroup>

<Warning>
Mehr Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Warning>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="OpenAI" href="/de/providers/openai" icon="bolt">
    Nativer OpenAI-Provider und Verhalten auf OpenAI-kompatiblen Routen.
  </Card>
  <Card title="OAuth und Authentifizierung" href="/de/gateway/authentication" icon="key">
    Details zu Authentifizierung und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und wie sie behoben werden.
  </Card>
</CardGroup>
