---
read_when:
    - Sie möchten Volcano Engine oder Doubao-Modelle mit OpenClaw verwenden
    - Sie benötigen die Einrichtung des Volcengine-API-Schlüssels
summary: Volcano-Engine-Einrichtung (Doubao-Modelle, allgemeine und Coding-Endpunkte)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-24T06:56:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6091da50fbab3a01cdc4337a496f361987f1991a2e2b7764e7a9c8c464e9757a
    source_path: providers/volcengine.md
    workflow: 15
---

Der Provider Volcengine bietet Zugriff auf Doubao-Modelle und Modelle von Drittanbietern,
die auf Volcano Engine gehostet werden, mit separaten Endpunkten für allgemeine und Coding-
Workloads.

| Detail    | Wert                                                |
| --------- | --------------------------------------------------- |
| Provider  | `volcengine` (allgemein) + `volcengine-plan` (Coding) |
| Auth      | `VOLCANO_ENGINE_API_KEY`                            |
| API       | OpenAI-kompatibel                                   |

## Erste Schritte

<Steps>
  <Step title="Den API-Schlüssel setzen">
    Führen Sie das interaktive Onboarding aus:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Dadurch werden sowohl die allgemeinen Provider (`volcengine`) als auch die Coding-Provider (`volcengine-plan`) mit einem einzigen API-Schlüssel registriert.

  </Step>
  <Step title="Ein Standardmodell setzen">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Prüfen, dass das Modell verfügbar ist">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Für nicht-interaktive Einrichtung (CI, Skripting) übergeben Sie den Schlüssel direkt:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Provider und Endpunkte

| Provider           | Endpunkt                                  | Anwendungsfall  |
| ------------------ | ----------------------------------------- | --------------- |
| `volcengine`       | `ark.cn-beijing.volces.com/api/v3`        | Allgemeine Modelle |
| `volcengine-plan`  | `ark.cn-beijing.volces.com/api/coding/v3` | Coding-Modelle  |

<Note>
Beide Provider werden aus einem einzigen API-Schlüssel konfiguriert. Das Setup registriert beide automatisch.
</Note>

## Integrierter Katalog

<Tabs>
  <Tab title="Allgemein (volcengine)">
    | Modell-Ref                                   | Name                            | Eingabe     | Kontext |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | Text, Bild  | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | Text, Bild  | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | Text, Bild  | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | Text, Bild  | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | Text, Bild  | 128,000 |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Modell-Ref                                        | Name                      | Eingabe | Kontext |
    | ------------------------------------------------- | ------------------------- | ------- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan           | Text    | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code          | Text    | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding            | Text    | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking          | Text    | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding          | Text    | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview  | Text    | 256,000 |
  </Tab>
</Tabs>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Standardmodell nach dem Onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` setzt derzeit
    `volcengine-plan/ark-code-latest` als Standardmodell und registriert gleichzeitig
    den allgemeinen Katalog `volcengine`.
  </Accordion>

  <Accordion title="Fallback-Verhalten des Modell-Pickers">
    Bei der Auswahl von Modellen während Onboarding/Konfiguration bevorzugt die Volcengine-Auth-Auswahl
    sowohl Zeilen `volcengine/*` als auch `volcengine-plan/*`. Wenn diese Modelle noch
    nicht geladen sind, fällt OpenClaw auf den ungefilterten Katalog zurück, statt einen
    leeren providerbezogenen Picker anzuzeigen.
  </Accordion>

  <Accordion title="Umgebungsvariablen für Daemon-Prozesse">
    Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass
    `VOLCANO_ENGINE_API_KEY` diesem Prozess zur Verfügung steht (zum Beispiel in
    `~/.openclaw/.env` oder über `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Wenn OpenClaw als Hintergrunddienst läuft, werden Umgebungsvariablen aus Ihrer
interaktiven Shell nicht automatisch übernommen. Siehe den Daemon-Hinweis oben.
</Warning>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider, Modell-Refs und Failover-Verhalten auswählen.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Debugging-Schritte.
  </Card>
  <Card title="FAQ" href="/de/help/faq" icon="circle-question">
    Häufig gestellte Fragen zur OpenClaw-Einrichtung.
  </Card>
</CardGroup>
