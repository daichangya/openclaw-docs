---
read_when:
    - Sie möchten GLM-Modelle in OpenClaw verwenden
    - Sie benötigen die Modellbenennungskonvention und die Einrichtung
summary: Überblick über die GLM-Modellfamilie und wie sie in OpenClaw verwendet wird
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-12T23:31:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: b38f0896c900fae3cf3458ff99938d73fa46973a057d1dd373ae960cb7d2e9b5
    source_path: providers/glm.md
    workflow: 15
---

# GLM-Modelle

GLM ist eine **Modellfamilie** (kein Unternehmen), die über die Plattform Z.AI verfügbar ist. In OpenClaw wird auf GLM-Modelle
über den Provider `zai` und Modell-IDs wie `zai/glm-5` zugegriffen.

## Erste Schritte

<Steps>
  <Step title="Einen Auth-Weg wählen und Onboarding ausführen">
    Wählen Sie die Onboarding-Option, die zu Ihrem Z.AI-Plan und Ihrer Region passt:

    | Auth-Option | Am besten geeignet für |
    | ----------- | ---------------------- |
    | `zai-api-key` | Generisches API-Schlüssel-Setup mit automatischer Endpunkterkennung |
    | `zai-coding-global` | Benutzer des Coding Plan (global) |
    | `zai-coding-cn` | Benutzer des Coding Plan (Region China) |
    | `zai-global` | Allgemeine API (global) |
    | `zai-cn` | Allgemeine API (Region China) |

    ```bash
    # Beispiel: generische automatische Erkennung
    openclaw onboard --auth-choice zai-api-key

    # Beispiel: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="GLM als Standardmodell festlegen">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Prüfen, ob Modelle verfügbar sind">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Konfigurationsbeispiel

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
Mit `zai-api-key` kann OpenClaw den passenden Z.AI-Endpunkt anhand des Schlüssels erkennen und
automatisch die richtige Base-URL anwenden. Verwenden Sie die expliziten regionalen Optionen, wenn
Sie eine bestimmte Oberfläche des Coding Plan oder der allgemeinen API erzwingen möchten.
</Tip>

## Gebündelte GLM-Modelle

OpenClaw initialisiert den gebündelten Provider `zai` derzeit mit diesen GLM-Refs:

| Modell          | Modell           |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
Die standardmäßig gebündelte Modell-Ref ist `zai/glm-5.1`. GLM-Versionen und Verfügbarkeit
können sich ändern; prüfen Sie die Z.AI-Dokumentation auf den neuesten Stand.
</Note>

## Erweiterte Hinweise

<AccordionGroup>
  <Accordion title="Automatische Endpunkterkennung">
    Wenn Sie die Auth-Option `zai-api-key` verwenden, prüft OpenClaw das Format des Schlüssels,
    um die richtige Z.AI-Base-URL zu bestimmen. Explizite regionale Optionen
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) überschreiben
    die automatische Erkennung und pinnen den Endpunkt direkt fest.
  </Accordion>

  <Accordion title="Provider-Details">
    GLM-Modelle werden vom Laufzeit-Provider `zai` bereitgestellt. Für die vollständige Provider-
    Konfiguration, regionale Endpunkte und zusätzliche Funktionen siehe die
    [Z.AI-Provider-Dokumentation](/de/providers/zai).
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Z.AI-Provider" href="/de/providers/zai" icon="server">
    Vollständige Z.AI-Provider-Konfiguration und regionale Endpunkte.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
</CardGroup>
