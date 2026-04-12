---
read_when:
    - Sie möchten OpenClaw mit einem lokalen vLLM-Server ausführen
    - Sie möchten OpenAI-kompatible `/v1`-Endpunkte mit Ihren eigenen Modellen verwenden
summary: OpenClaw mit vLLM ausführen (OpenAI-kompatibler lokaler Server)
title: vLLM
x-i18n:
    generated_at: "2026-04-12T23:33:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: a43be9ae879158fcd69d50fb3a47616fd560e3c6fe4ecb3a109bdda6a63a6a80
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM kann Open-Source-Modelle (und einige benutzerdefinierte Modelle) über eine **OpenAI-kompatible** HTTP-API bereitstellen. OpenClaw verbindet sich mit vLLM über die API `openai-completions`.

OpenClaw kann verfügbare Modelle aus vLLM auch **automatisch erkennen**, wenn Sie mit `VLLM_API_KEY` optieren (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt) und Sie keinen expliziten Eintrag `models.providers.vllm` definieren.

| Eigenschaft       | Wert                                     |
| ----------------- | ---------------------------------------- |
| Provider-ID       | `vllm`                                   |
| API               | `openai-completions` (OpenAI-kompatibel) |
| Auth              | Umgebungsvariable `VLLM_API_KEY`         |
| Standard-`baseUrl` | `http://127.0.0.1:8000/v1`              |

## Erste Schritte

<Steps>
  <Step title="vLLM mit einem OpenAI-kompatiblen Server starten">
    Ihre `baseUrl` sollte `/v1`-Endpunkte bereitstellen (z. B. `/v1/models`, `/v1/chat/completions`). vLLM läuft häufig auf:

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

## Modellerkennung (impliziter Provider)

Wenn `VLLM_API_KEY` gesetzt ist (oder ein Auth-Profil existiert) und Sie **nicht** `models.providers.vllm` definieren, fragt OpenClaw ab:

```
GET http://127.0.0.1:8000/v1/models
```

und wandelt die zurückgegebenen IDs in Modelleintrage um.

<Note>
Wenn Sie `models.providers.vllm` explizit setzen, wird die automatische Erkennung übersprungen, und Sie müssen Modelle manuell definieren.
</Note>

## Explizite Konfiguration (manuelle Modelle)

Verwenden Sie eine explizite Konfiguration, wenn:

- vLLM auf einem anderen Host oder Port läuft
- Sie Werte für `contextWindow` oder `maxTokens` festlegen möchten
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

## Erweiterte Hinweise

<AccordionGroup>
  <Accordion title="Verhalten im Proxy-Stil">
    vLLM wird als OpenAI-kompatibles `/v1`-Backend im Proxy-Stil behandelt, nicht als nativer
    OpenAI-Endpunkt. Das bedeutet:

    | Verhalten | Angewendet? |
    |----------|-------------|
    | Native OpenAI-Anfrageformung | Nein |
    | `service_tier` | Nicht gesendet |
    | Responses `store` | Nicht gesendet |
    | Prompt-Cache-Hinweise | Nicht gesendet |
    | Formung der OpenAI-Reasoning-Kompatibilitäts-Payload | Nicht angewendet |
    | Versteckte OpenClaw-Attribution-Header | Bei benutzerdefinierten `baseUrl` nicht eingefügt |

  </Accordion>

  <Accordion title="Benutzerdefinierte baseUrl">
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

    Wenn Sie einen Verbindungsfehler sehen, überprüfen Sie Host, Port und ob vLLM im OpenAI-kompatiblen Servermodus gestartet wurde.

  </Accordion>

  <Accordion title="Auth-Fehler bei Anfragen">
    Wenn Anfragen mit Auth-Fehlern fehlschlagen, setzen Sie einen echten `VLLM_API_KEY`, der zu Ihrer Serverkonfiguration passt, oder konfigurieren Sie den Provider explizit unter `models.providers.vllm`.

    <Tip>
    Wenn Ihr vLLM-Server keine Authentifizierung erzwingt, funktioniert jeder nicht leere Wert für `VLLM_API_KEY` als Opt-in-Signal für OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Keine Modelle erkannt">
    Für die automatische Erkennung muss `VLLM_API_KEY` gesetzt sein **und** darf kein expliziter Konfigurationseintrag `models.providers.vllm` vorhanden sein. Wenn Sie den Provider manuell definiert haben, überspringt OpenClaw die Erkennung und verwendet nur Ihre deklarierten Modelle.
  </Accordion>
</AccordionGroup>

<Warning>
Weitere Hilfe: [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Warning>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="OpenAI" href="/de/providers/openai" icon="bolt">
    Nativer OpenAI-Provider und OpenAI-kompatibles Routenverhalten.
  </Card>
  <Card title="OAuth und Auth" href="/de/gateway/authentication" icon="key">
    Details zur Authentifizierung und Regeln zur Wiederverwendung von Anmeldedaten.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und wie sie gelöst werden können.
  </Card>
</CardGroup>
