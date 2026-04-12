---
read_when:
    - Sie möchten OpenClaw mit einem lokalen inferrs-Server ausführen
    - Sie stellen Gemma oder ein anderes Modell über inferrs bereit
    - Sie benötigen die genauen OpenClaw-Kompatibilitäts-Flags für inferrs
summary: OpenClaw über inferrs ausführen (OpenAI-kompatibler lokaler Server)
title: inferrs
x-i18n:
    generated_at: "2026-04-12T23:31:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 847dcc131fe51dfe163dcd60075dbfaa664662ea2a5c3986ccb08ddd37e8c31f
    source_path: providers/inferrs.md
    workflow: 15
---

# inferrs

[inferrs](https://github.com/ericcurtin/inferrs) kann lokale Modelle hinter einer
OpenAI-kompatiblen `/v1`-API bereitstellen. OpenClaw funktioniert mit `inferrs` über den generischen
Pfad `openai-completions`.

`inferrs` sollte derzeit am besten als benutzerdefiniertes selbstgehostetes OpenAI-kompatibles
Backend behandelt werden, nicht als dediziertes OpenClaw-Provider-Plugin.

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
  <Step title="Prüfen, ob der Server erreichbar ist">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Einen OpenClaw-Providereintrag hinzufügen">
    Fügen Sie einen expliziten Providereintrag hinzu und verweisen Sie Ihr Standardmodell darauf. Das vollständige Konfigurationsbeispiel finden Sie unten.
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

## Erweitert

<AccordionGroup>
  <Accordion title="Warum requiresStringContent wichtig ist">
    Einige `inferrs`-Chat-Completions-Routen akzeptieren nur Zeichenfolgen in
    `messages[].content`, nicht strukturierte Content-Part-Arrays.

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

    OpenClaw reduziert reine Text-Content-Parts vor dem Senden
    der Anfrage zu einfachen Zeichenfolgen.

  </Accordion>

  <Accordion title="Gemma- und Tool-Schema-Einschränkung">
    Einige aktuelle Kombinationen aus `inferrs` + Gemma akzeptieren kleine direkte
    `/v1/chat/completions`-Anfragen, schlagen aber weiterhin bei vollständigen OpenClaw-Agent-Laufzeit-
    Turns fehl.

    Wenn das passiert, versuchen Sie zuerst Folgendes:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    Dadurch wird die Tool-Schema-Oberfläche von OpenClaw für das Modell deaktiviert und kann den Prompt-
    Druck auf strengeren lokalen Backends verringern.

    Wenn winzige direkte Anfragen weiterhin funktionieren, normale OpenClaw-Agent-Turns aber weiterhin
    innerhalb von `inferrs` abstürzen, liegt das verbleibende Problem normalerweise eher am Verhalten des Upstream-Modells/Servers als an der Transportschicht von OpenClaw.

  </Accordion>

  <Accordion title="Manueller Smoke-Test">
    Nach der Konfiguration testen Sie beide Ebenen:

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

  <Accordion title="Proxy-ähnliches Verhalten">
    `inferrs` wird als proxyartiges OpenAI-kompatibles `/v1`-Backend behandelt, nicht als
    nativer OpenAI-Endpunkt.

    - Native nur-OpenAI-Anfrageformung gilt hier nicht
    - Kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise und keine
      OpenAI-Reasoning-kompatible Payload-Formung
    - Versteckte OpenClaw-Attributions-Header (`originator`, `version`, `User-Agent`)
      werden bei benutzerdefinierten `inferrs`-Base-URLs nicht eingefügt

  </Accordion>
</AccordionGroup>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="curl /v1/models schlägt fehl">
    `inferrs` läuft nicht, ist nicht erreichbar oder ist nicht an den erwarteten
    Host/Port gebunden. Stellen Sie sicher, dass der Server gestartet ist und auf der von Ihnen
    konfigurierten Adresse lauscht.
  </Accordion>

  <Accordion title="messages[].content erwartet eine Zeichenfolge">
    Setzen Sie `compat.requiresStringContent: true` im Modelleintrag. Siehe den
    Abschnitt `requiresStringContent` oben für Details.
  </Accordion>

  <Accordion title="Direkte /v1/chat/completions-Aufrufe funktionieren, aber openclaw infer model run schlägt fehl">
    Versuchen Sie, `compat.supportsTools: false` zu setzen, um die Tool-Schema-Oberfläche zu deaktivieren.
    Siehe die Gemma-Tool-Schema-Einschränkung oben.
  </Accordion>

  <Accordion title="inferrs stürzt bei größeren Agent-Turns weiterhin ab">
    Wenn OpenClaw keine Schemafehler mehr erhält, `inferrs` aber bei größeren
    Agent-Turns weiterhin abstürzt, behandeln Sie dies als Einschränkung von Upstream-`inferrs` oder des Modells. Reduzieren
    Sie den Prompt-Druck oder wechseln Sie zu einem anderen lokalen Backend oder Modell.
  </Accordion>
</AccordionGroup>

<Tip>
Allgemeine Hilfe finden Sie unter [Fehlerbehebung](/de/help/troubleshooting) und [FAQ](/de/help/faq).
</Tip>

## Siehe auch

<CardGroup cols={2}>
  <Card title="Lokale Modelle" href="/de/gateway/local-models" icon="server">
    OpenClaw mit lokalen Modellservern ausführen.
  </Card>
  <Card title="Gateway-Fehlerbehebung" href="/de/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    Debuggen lokaler OpenAI-kompatibler Backends, die Probes bestehen, aber bei Agent-Läufen fehlschlagen.
  </Card>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Provider, Modell-Refs und Failover-Verhalten.
  </Card>
</CardGroup>
