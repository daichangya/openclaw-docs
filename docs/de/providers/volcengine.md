---
read_when:
    - Sie möchten Volcano Engine oder Doubao-Modelle mit OpenClaw verwenden
    - Sie benötigen die Einrichtung des Volcengine-API-Schlüssels
summary: Einrichtung von Volcano Engine (Doubao-Modelle, allgemeine und Coding-Endpunkte)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-12T23:33:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: a21f390da719f79c88c6d55a7d952d35c2ce5ff26d910c9f10020132cd7d2f4c
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Der Volcengine-Provider bietet Zugriff auf Doubao-Modelle und Drittanbieter-Modelle,
die auf Volcano Engine gehostet werden, mit separaten Endpunkten für allgemeine und Coding-
Workloads.

| Detail      | Wert                                                |
| ----------- | --------------------------------------------------- |
| Provider    | `volcengine` (allgemein) + `volcengine-plan` (Coding) |
| Auth        | `VOLCANO_ENGINE_API_KEY`                            |
| API         | OpenAI-kompatibel                                   |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    Führen Sie das interaktive Onboarding aus:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Dadurch werden sowohl die allgemeinen (`volcengine`) als auch die Coding-Provider (`volcengine-plan`) mit einem einzigen API-Schlüssel registriert.

  </Step>
  <Step title="Ein Standardmodell festlegen">
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
  <Step title="Prüfen, ob das Modell verfügbar ist">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Für nicht interaktives Setup (CI, Skripting) übergeben Sie den Schlüssel direkt:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Provider und Endpunkte

| Provider          | Endpunkt                                  | Anwendungsfall   |
| ----------------- | ----------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Allgemeine Modelle |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Coding-Modelle   |

<Note>
Beide Provider werden mit einem einzigen API-Schlüssel konfiguriert. Das Setup registriert beide automatisch.
</Note>

## Verfügbare Modelle

<Tabs>
  <Tab title="Allgemein (`volcengine`)">
    | Modell-Ref                                   | Name                            | Eingabe     | Kontext |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | Text, Bild  | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | Text, Bild  | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | Text, Bild  | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | Text, Bild  | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | Text, Bild  | 128,000 |
  </Tab>
  <Tab title="Coding (`volcengine-plan`)">
    | Modell-Ref                                        | Name                     | Eingabe | Kontext |
    | ------------------------------------------------- | ------------------------ | ------- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | Text    | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | Text    | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | Text    | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | Text    | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | Text    | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | Text    | 256,000 |
  </Tab>
</Tabs>

## Erweiterte Hinweise

<AccordionGroup>
  <Accordion title="Standardmodell nach dem Onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` setzt derzeit
    `volcengine-plan/ark-code-latest` als Standardmodell und registriert gleichzeitig
    den allgemeinen Katalog `volcengine`.
  </Accordion>

  <Accordion title="Fallback-Verhalten der Modellauswahl">
    Während der Onboarding-/Konfigurationsauswahl des Modells bevorzugt die Volcengine-Auth-Auswahl
    sowohl Zeilen `volcengine/*` als auch `volcengine-plan/*`. Wenn diese Modelle noch
    nicht geladen sind, fällt OpenClaw auf den ungefilterten Katalog zurück, statt eine
    leere providerbezogene Auswahl anzuzeigen.
  </Accordion>

  <Accordion title="Umgebungsvariablen für Daemon-Prozesse">
    Wenn das Gateway als Daemon läuft (`launchd`/`systemd`), stellen Sie sicher, dass
    `VOLCANO_ENGINE_API_KEY` für diesen Prozess verfügbar ist (zum Beispiel in
    `~/.openclaw/.env` oder über `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Wenn OpenClaw als Hintergrunddienst läuft, werden in Ihrer
interaktiven Shell gesetzte Umgebungsvariablen nicht automatisch übernommen. Siehe den obigen Hinweis zu Daemons.
</Warning>

## Verwandte Themen

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
    Häufig gestellte Fragen zum OpenClaw-Setup.
  </Card>
</CardGroup>
