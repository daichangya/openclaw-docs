---
read_when:
    - Sie möchten OpenClaw mit einem lokalen SGLang-Server ausführen
    - Sie möchten OpenAI-kompatible `/v1`-Endpunkte mit Ihren eigenen Modellen verwenden
summary: OpenClaw mit SGLang ausführen (OpenAI-kompatibler selbstgehosteter Server)
title: SGLang
x-i18n:
    generated_at: "2026-04-12T23:33:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0a2e50a499c3d25dcdc3af425fb023c6e3f19ed88f533ecf0eb8a2cb7ec8b0d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang kann Open-Source-Modelle über eine **OpenAI-kompatible** HTTP-API bereitstellen.
OpenClaw kann über die API `openai-completions` eine Verbindung zu SGLang herstellen.

OpenClaw kann verfügbare Modelle aus SGLang auch **automatisch erkennen**, wenn Sie
mit `SGLANG_API_KEY` zustimmen (jeder Wert funktioniert, wenn Ihr Server keine Authentifizierung erzwingt)
und Sie keinen expliziten Eintrag `models.providers.sglang` definieren.

## Erste Schritte

<Steps>
  <Step title="SGLang starten">
    Starten Sie SGLang mit einem OpenAI-kompatiblen Server. Ihre Base-URL sollte
    `/v1`-Endpunkte bereitstellen (zum Beispiel `/v1/models`, `/v1/chat/completions`). SGLang
    läuft üblicherweise unter:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Einen API-Schlüssel setzen">
    Jeder Wert funktioniert, wenn auf Ihrem Server keine Authentifizierung konfiguriert ist:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Onboarding ausführen oder ein Modell direkt setzen">
    ```bash
    openclaw onboard
    ```

    Oder das Modell manuell konfigurieren:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Modellerkennung (impliziter Provider)

Wenn `SGLANG_API_KEY` gesetzt ist (oder ein Auth-Profil existiert) und Sie **nicht**
`models.providers.sglang` definieren, fragt OpenClaw Folgendes ab:

- `GET http://127.0.0.1:30000/v1/models`

und wandelt die zurückgegebenen IDs in Modelleinträge um.

<Note>
Wenn Sie `models.providers.sglang` explizit setzen, wird die automatische Erkennung übersprungen und
Sie müssen Modelle manuell definieren.
</Note>

## Explizite Konfiguration (manuelle Modelle)

Verwenden Sie explizite Konfiguration, wenn:

- SGLang auf einem anderen Host/Port läuft.
- Sie Werte für `contextWindow`/`maxTokens` festlegen möchten.
- Ihr Server einen echten API-Schlüssel erfordert (oder Sie Header steuern möchten).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Lokales SGLang-Modell",
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
  <Accordion title="Proxy-artiges Verhalten">
    SGLang wird als proxyartiges OpenAI-kompatibles `/v1`-Backend behandelt, nicht als
    nativer OpenAI-Endpunkt.

    | Verhalten | SGLang |
    |----------|--------|
    | Nur-OpenAI-Anfrageformung | Nicht angewendet |
    | `service_tier`, Responses-`store`, Prompt-Cache-Hinweise | Nicht gesendet |
    | Reasoning-kompatible Payload-Formung | Nicht angewendet |
    | Versteckte Attributions-Header (`originator`, `version`, `User-Agent`) | Werden bei benutzerdefinierten SGLang-Base-URLs nicht eingefügt |

  </Accordion>

  <Accordion title="Fehlerbehebung">
    **Server nicht erreichbar**

    Überprüfen Sie, ob der Server läuft und antwortet:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Auth-Fehler**

    Wenn Anfragen mit Auth-Fehlern fehlschlagen, setzen Sie ein echtes `SGLANG_API_KEY`, das zu
    Ihrer Serverkonfiguration passt, oder konfigurieren Sie den Provider explizit unter
    `models.providers.sglang`.

    <Tip>
    Wenn Sie SGLang ohne Authentifizierung ausführen, reicht ein beliebiger nicht leerer Wert für
    `SGLANG_API_KEY` aus, um der Modellerkennung zuzustimmen.
    </Tip>

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Providereinträgen.
  </Card>
</CardGroup>
