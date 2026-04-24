---
read_when:
    - Sie möchten OpenClaw gegen einen lokalen inferrs-Server ausführen
    - Sie stellen Gemma oder ein anderes Modell über inferrs bereit
    - Sie benötigen die genauen OpenClaw-Compat-Flags für inferrs
summary: OpenClaw über inferrs ausführen (OpenAI-kompatibler lokaler Server)
title: Inferrs
x-i18n:
    generated_at: "2026-04-24T06:54:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53547c48febe584cf818507b0bf879db0471c575fa8a3ebfec64c658a7090675
    source_path: providers/inferrs.md
    workflow: 15
---

[inferrs](https://github.com/ericcurtin/inferrs) kann lokale Modelle hinter einer
OpenAI-kompatiblen `/v1`-API bereitstellen. OpenClaw arbeitet mit `inferrs` über den generischen
Pfad `openai-completions`.

`inferrs` wird derzeit am besten als benutzerdefiniertes selbstgehostetes OpenAI-kompatibles
Backend behandelt, nicht als dediziertes OpenClaw-Provider-Plugin.

## Erste Schritte

<Steps>
  <Step title="inferrs mit einem Modell starten">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Überprüfen, ob der Server erreichbar ist">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Einen OpenClaw-Provider-Eintrag hinzufügen">
    Fügen Sie einen expliziten Provider-Eintrag hinzu und zeigen Sie mit Ihrem Standardmodell darauf. Das vollständige Konfigurationsbeispiel finden Sie unten.
  </Step>
</Steps>

## Vollständiges Konfigurationsbeispiel

Dieses Beispiel verwendet Gemma 4 auf einem lokalen `inferrs`-Server.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Warum requiresStringContent wichtig ist">
    Einige `inferrs`-Routen für Chat Completions akzeptieren nur
    `messages[].content` als Zeichenfolge, nicht strukturierte Content-Part-Arrays.

    <Warning>
    Wenn OpenClaw-Läufe mit einem Fehler wie diesem fehlschlagen:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    setzen Sie `compat.requiresStringContent: true` in Ihrem Modelleintrag.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw flacht dann reine Text-Content-Parts in einfache Zeichenfolgen ab, bevor
    die Anfrage gesendet wird.

  </Accordion>

  <Accordion title="Caveat zu Gemma und Tool-Schema">
    Einige aktuelle Kombinationen aus `inferrs` + Gemma akzeptieren kleine direkte
    `/v1/chat/completions`-Anfragen, schlagen aber weiterhin bei vollständigen Agenten-Runtime-
    Turns von OpenClaw fehl.

    Wenn das passiert, versuchen Sie zuerst Folgendes:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Dadurch wird die Tool-Schema-Oberfläche von OpenClaw für das Modell deaktiviert und der Druck auf den Prompt bei strengeren lokalen Backends reduziert.

    Wenn kleine direkte Anfragen weiterhin funktionieren, normale OpenClaw-Agenten-Turns aber
    weiterhin innerhalb von `inferrs` abstürzen, liegt das verbleibende Problem normalerweise im Verhalten
    des Upstream-Modells/Servers und nicht in der Transportschicht von OpenClaw.

  </Accordion>

  <Accordion title="Manueller Smoke-Test">
    Testen Sie nach der Konfiguration beide Ebenen:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    Wenn der erste Befehl funktioniert, der zweite aber fehlschlägt, prüfen Sie den Abschnitt zur Fehlerbehebung unten.

  </Accordion>

  <Accordion title="Verhalten im Proxy-Stil">
    `inferrs` wird als OpenAI-kompatibles `/v1`-Backend im Proxy-Stil behandelt, nicht als
    nativer OpenAI-Endpunkt.

    - Native, nur für OpenAI geltende Request-Formung greift hier nicht
    - Kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise und keine
      OpenAI-Reasoning-kompatible Payload-Formung
    - Versteckte OpenClaw-Attributions-Header (`originator`, `version`, `User-Agent`)
      werden bei benutzerdefinierten `inferrs`-Base-URLs nicht eingefügt

  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="curl /v1/models schlägt fehl">
    `inferrs` läuft nicht, ist nicht erreichbar oder nicht an den erwarteten
    Host/Port gebunden. Stellen Sie sicher, dass der Server gestartet ist und auf der Adresse lauscht, die Sie
    konfiguriert haben.
  </Accordion>

  <Accordion title="messages[].content expected a string">
    Setzen Sie `compat.requiresStringContent: true` im Modelleintrag. Siehe den
    obigen Abschnitt `requiresStringContent` für Details.
  </Accordion>

  <Accordion title="Direkte Aufrufe an /v1/chat/completions funktionieren, aber openclaw infer model run schlägt fehl">
    Versuchen Sie, `compat.supportsTools: false` zu setzen, um die Tool-Schema-Oberfläche zu deaktivieren.
    Siehe oben den Caveat zu Gemma und Tool-Schema.
  </Accordion>

  <Accordion title="inferrs stürzt bei größeren Agenten-Turns weiterhin ab">
    Wenn OpenClaw keine Schemafehler mehr erhält, `inferrs` aber bei größeren
    Agenten-Turns weiterhin abstürzt, behandeln Sie dies als Einschränkung von `inferrs` oder des Upstream-Modells. Reduzieren Sie den Druck auf den Prompt oder wechseln Sie zu einem anderen lokalen Backend oder Modell.
  </Accordion>
</AccordionGroup>

<Tip>
Allgemeine Hilfe finden Sie unter [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Tip>

## Verwandt

<CardGroup cols={2}>
  <Card title="Lokale Modelle" href="/de/gateway/local-models" icon="server">
    OpenClaw gegen lokale Modellserver ausführen.
  </Card>
  <Card title="Fehlerbehebung für Gateway" href="/de/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Lokale OpenAI-kompatible Backends debuggen, die direkte Probes bestehen, aber bei Agenten-Läufen fehlschlagen.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Anbieter, Modellreferenzen und Failover-Verhalten.
  </Card>
</CardGroup>
