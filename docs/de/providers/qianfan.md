---
read_when:
    - Sie möchten einen einzelnen API-Schlüssel für viele LLMs verwenden.
    - Sie benötigen eine Anleitung zur Einrichtung von Baidu Qianfan.
summary: Qianfans einheitliche API verwenden, um in OpenClaw auf viele Modelle zuzugreifen
title: Qianfan
x-i18n:
    generated_at: "2026-04-12T23:32:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d0eeee9ec24b335c2fb8ac5e985a9edc35cfc5b2641c545cb295dd2de619f50
    source_path: providers/qianfan.md
    workflow: 15
---

# Qianfan

Qianfan ist die MaaS-Plattform von Baidu und stellt eine **einheitliche API** bereit, die Anfragen an viele Modelle hinter einem einzigen
Endpunkt und API-Schlüssel weiterleitet. Sie ist OpenAI-kompatibel, daher funktionieren die meisten OpenAI-SDKs, wenn die Base-URL umgestellt wird.

| Eigenschaft | Wert                              |
| ----------- | --------------------------------- |
| Provider    | `qianfan`                         |
| Auth        | `QIANFAN_API_KEY`                 |
| API         | OpenAI-kompatibel                 |
| Base-URL    | `https://qianfan.baidubce.com/v2` |

## Erste Schritte

<Steps>
  <Step title="Ein Baidu-Cloud-Konto erstellen">
    Registrieren Sie sich oder melden Sie sich in der [Qianfan-Konsole](https://console.bce.baidu.com/qianfan/ais/console/apiKey) an und stellen Sie sicher, dass der Zugriff auf die Qianfan-API aktiviert ist.
  </Step>
  <Step title="Einen API-Schlüssel erzeugen">
    Erstellen Sie eine neue Anwendung oder wählen Sie eine bestehende aus und erzeugen Sie dann einen API-Schlüssel. Das Schlüsselformat lautet `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Verfügbare Modelle

| Modell-Ref                          | Eingabe     | Kontext | Maximale Ausgabe | Reasoning | Hinweise       |
| ----------------------------------- | ----------- | ------- | ---------------- | --------- | -------------- |
| `qianfan/deepseek-v3.2`             | text        | 98,304  | 32,768           | Ja        | Standardmodell |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000 | 64,000           | Ja        | Multimodal     |

<Tip>
Die standardmäßig gebündelte Modell-Ref ist `qianfan/deepseek-v3.2`. Sie müssen `models.providers.qianfan` nur überschreiben, wenn Sie eine benutzerdefinierte Base-URL oder Modellmetadaten benötigen.
</Tip>

## Konfigurationsbeispiel

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport und Kompatibilität">
    Qianfan läuft über den OpenAI-kompatiblen Transportpfad, nicht über native OpenAI-Anfrageformung. Das bedeutet, dass Standardfunktionen von OpenAI-SDKs funktionieren, provider-spezifische Parameter aber möglicherweise nicht weitergereicht werden.
  </Accordion>

  <Accordion title="Katalog und Overrides">
    Der gebündelte Katalog enthält derzeit `deepseek-v3.2` und `ernie-5.0-thinking-preview`. Fügen Sie `models.providers.qianfan` nur hinzu oder überschreiben Sie es, wenn Sie eine benutzerdefinierte Base-URL oder Modellmetadaten benötigen.

    <Note>
    Modell-Refs verwenden das Präfix `qianfan/` (zum Beispiel `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Fehlerbehebung">
    - Stellen Sie sicher, dass Ihr API-Schlüssel mit `bce-v3/ALTAK-` beginnt und der Zugriff auf die Qianfan-API in der Baidu-Cloud-Konsole aktiviert ist.
    - Wenn keine Modelle aufgeführt werden, prüfen Sie, ob der Qianfan-Dienst für Ihr Konto aktiviert ist.
    - Die Standard-Base-URL ist `https://qianfan.baidubce.com/v2`. Ändern Sie sie nur, wenn Sie einen benutzerdefinierten Endpunkt oder Proxy verwenden.
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration" icon="gear">
    Vollständige OpenClaw-Konfigurationsreferenz.
  </Card>
  <Card title="Agent-Einrichtung" href="/de/concepts/agent" icon="robot">
    Konfigurieren von Agent-Standardeinstellungen und Modellzuweisungen.
  </Card>
  <Card title="Qianfan-API-Dokumentation" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Offizielle Qianfan-API-Dokumentation.
  </Card>
</CardGroup>
