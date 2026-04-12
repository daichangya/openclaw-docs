---
read_when:
    - Sie möchten lokale ComfyUI-Workflows mit OpenClaw verwenden
    - Sie möchten Comfy Cloud mit Bild-, Video- oder Musik-Workflows verwenden
    - Sie benötigen die Konfigurationsschlüssel des gebündelten Comfy-Plugin
summary: ComfyUI-Workflow-Einrichtung für Bild-, Video- und Musikgenerierung in OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-12T23:30:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85db395b171f37f80b34b22f3e7707bffc1fd9138e7d10687eef13eaaa55cf24
    source_path: providers/comfy.md
    workflow: 15
---

# ComfyUI

OpenClaw enthält ein gebündeltes Plugin `comfy` für workflowgesteuerte ComfyUI-Läufe. Das Plugin ist vollständig workflowgesteuert, daher versucht OpenClaw nicht, generische Steuerelemente wie `size`, `aspectRatio`, `resolution`, `durationSeconds` oder TTS-ähnliche Einstellungen auf Ihren Graphen abzubilden.

| Eigenschaft      | Detail                                                                           |
| ---------------- | -------------------------------------------------------------------------------- |
| Provider         | `comfy`                                                                          |
| Modelle          | `comfy/workflow`                                                                 |
| Gemeinsame Oberflächen | `image_generate`, `video_generate`, `music_generate`                       |
| Auth             | Keine für lokales ComfyUI; `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` für Comfy Cloud |
| API              | ComfyUI `/prompt` / `/history` / `/view` und Comfy Cloud `/api/*`                |

## Was unterstützt wird

- Bildgenerierung aus einem Workflow-JSON
- Bildbearbeitung mit 1 hochgeladenen Referenzbild
- Videogenerierung aus einem Workflow-JSON
- Videogenerierung mit 1 hochgeladenen Referenzbild
- Musik- oder Audiogenerierung über das gemeinsame Tool `music_generate`
- Herunterladen der Ausgabe von einem konfigurierten Node oder allen passenden Output-Nodes

## Erste Schritte

Wählen Sie zwischen dem Ausführen von ComfyUI auf Ihrem eigenen Rechner oder der Verwendung von Comfy Cloud.

<Tabs>
  <Tab title="Lokal">
    **Am besten geeignet für:** das Ausführen Ihrer eigenen ComfyUI-Instanz auf Ihrem Rechner oder im LAN.

    <Steps>
      <Step title="ComfyUI lokal starten">
        Stellen Sie sicher, dass Ihre lokale ComfyUI-Instanz läuft (standardmäßig `http://127.0.0.1:8188`).
      </Step>
      <Step title="Ihr Workflow-JSON vorbereiten">
        Exportieren oder erstellen Sie eine ComfyUI-Workflow-JSON-Datei. Notieren Sie sich die Node-IDs für den Prompt-Eingabe-Node und den Output-Node, aus dem OpenClaw lesen soll.
      </Step>
      <Step title="Den Provider konfigurieren">
        Setzen Sie `mode: "local"` und verweisen Sie auf Ihre Workflow-Datei. Hier ist ein minimales Bildbeispiel:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "local",
                baseUrl: "http://127.0.0.1:8188",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Das Standardmodell festlegen">
        Verweisen Sie OpenClaw für die konfigurierte Fähigkeit auf das Modell `comfy/workflow`:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Überprüfen">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Am besten geeignet für:** das Ausführen von Workflows auf Comfy Cloud, ohne lokale GPU-Ressourcen verwalten zu müssen.

    <Steps>
      <Step title="Einen API-Schlüssel abrufen">
        Registrieren Sie sich unter [comfy.org](https://comfy.org) und generieren Sie einen API-Schlüssel in Ihrem Konto-Dashboard.
      </Step>
      <Step title="Den API-Schlüssel setzen">
        Stellen Sie Ihren Schlüssel über eine dieser Methoden bereit:

        ```bash
        # Umgebungsvariable (bevorzugt)
        export COMFY_API_KEY="your-key"

        # Alternative Umgebungsvariable
        export COMFY_CLOUD_API_KEY="your-key"

        # Oder inline in der Konfiguration
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="Ihr Workflow-JSON vorbereiten">
        Exportieren oder erstellen Sie eine ComfyUI-Workflow-JSON-Datei. Notieren Sie sich die Node-IDs für den Prompt-Eingabe-Node und den Output-Node.
      </Step>
      <Step title="Den Provider konfigurieren">
        Setzen Sie `mode: "cloud"` und verweisen Sie auf Ihre Workflow-Datei:

        ```json5
        {
          models: {
            providers: {
              comfy: {
                mode: "cloud",
                image: {
                  workflowPath: "./workflows/flux-api.json",
                  promptNodeId: "6",
                  outputNodeId: "9",
                },
              },
            },
          },
        }
        ```

        <Tip>
        Im Cloud-Modus ist `baseUrl` standardmäßig `https://cloud.comfy.org`. Sie müssen `baseUrl` nur setzen, wenn Sie einen benutzerdefinierten Cloud-Endpunkt verwenden.
        </Tip>
      </Step>
      <Step title="Das Standardmodell festlegen">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Überprüfen">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfiguration

Comfy unterstützt gemeinsame Verbindungseinstellungen auf oberster Ebene sowie Workflow-Abschnitte pro Fähigkeit (`image`, `video`, `music`):

```json5
{
  models: {
    providers: {
      comfy: {
        mode: "local",
        baseUrl: "http://127.0.0.1:8188",
        image: {
          workflowPath: "./workflows/flux-api.json",
          promptNodeId: "6",
          outputNodeId: "9",
        },
        video: {
          workflowPath: "./workflows/video-api.json",
          promptNodeId: "12",
          outputNodeId: "21",
        },
        music: {
          workflowPath: "./workflows/music-api.json",
          promptNodeId: "3",
          outputNodeId: "18",
        },
      },
    },
  },
}
```

### Gemeinsame Schlüssel

| Schlüssel              | Typ                    | Beschreibung                                                                          |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                 | `"local"` oder `"cloud"` | Verbindungsmodus.                                                                   |
| `baseUrl`              | string                 | Standard ist `http://127.0.0.1:8188` für lokal oder `https://cloud.comfy.org` für Cloud. |
| `apiKey`               | string                 | Optionaler Inline-Schlüssel als Alternative zu den Env-Variablen `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork`  | boolean                | Eine private/LAN-`baseUrl` im Cloud-Modus erlauben.                                   |

### Schlüssel pro Fähigkeit

Diese Schlüssel gelten innerhalb der Abschnitte `image`, `video` oder `music`:

| Schlüssel                     | Erforderlich | Standard | Beschreibung                                                               |
| ----------------------------- | ------------ | -------- | -------------------------------------------------------------------------- |
| `workflow` oder `workflowPath` | Ja          | --       | Pfad zur ComfyUI-Workflow-JSON-Datei.                                      |
| `promptNodeId`                | Ja           | --       | Node-ID, die den Text-Prompt empfängt.                                     |
| `promptInputName`             | Nein         | `"text"` | Eingabename auf dem Prompt-Node.                                           |
| `outputNodeId`                | Nein         | --       | Node-ID, aus der die Ausgabe gelesen wird. Wenn nicht gesetzt, werden alle passenden Output-Nodes verwendet. |
| `pollIntervalMs`              | Nein         | --       | Polling-Intervall in Millisekunden für den Abschluss des Jobs.             |
| `timeoutMs`                   | Nein         | --       | Timeout in Millisekunden für den Workflow-Lauf.                            |

Die Abschnitte `image` und `video` unterstützen außerdem:

| Schlüssel              | Erforderlich                              | Standard  | Beschreibung                                         |
| ---------------------- | ----------------------------------------- | --------- | --------------------------------------------------- |
| `inputImageNodeId`     | Ja (bei Übergabe eines Referenzbilds)     | --        | Node-ID, die das hochgeladene Referenzbild empfängt. |
| `inputImageInputName`  | Nein                                      | `"image"` | Eingabename auf dem Bild-Node.                       |

## Workflow-Details

<AccordionGroup>
  <Accordion title="Bild-Workflows">
    Setzen Sie das Standard-Bildmodell auf `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **Beispiel für die Bearbeitung mit Referenzbild:**

    Um die Bildbearbeitung mit einem hochgeladenen Referenzbild zu aktivieren, fügen Sie `inputImageNodeId` zu Ihrer Bildkonfiguration hinzu:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            image: {
              workflowPath: "./workflows/edit-api.json",
              promptNodeId: "6",
              inputImageNodeId: "7",
              inputImageInputName: "image",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Video-Workflows">
    Setzen Sie das Standard-Videomodell auf `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Comfy-Video-Workflows unterstützen Text-zu-Video und Bild-zu-Video über den konfigurierten Graphen.

    <Note>
    OpenClaw übergibt keine Eingabevideos an Comfy-Workflows. Als Eingaben werden nur Text-Prompts und einzelne Referenzbilder unterstützt.
    </Note>

  </Accordion>

  <Accordion title="Musik-Workflows">
    Das gebündelte Plugin registriert einen Provider für Musikgenerierung für Workflow-definierte Audio- oder Musikausgaben, bereitgestellt über das gemeinsame Tool `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Verwenden Sie den Konfigurationsabschnitt `music`, um auf Ihr Audio-Workflow-JSON und den Output-Node zu verweisen.

  </Accordion>

  <Accordion title="Abwärtskompatibilität">
    Die vorhandene Bildkonfiguration auf oberster Ebene (ohne den verschachtelten Abschnitt `image`) funktioniert weiterhin:

    ```json5
    {
      models: {
        providers: {
          comfy: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
        },
      },
    }
    ```

    OpenClaw behandelt diese Legacy-Form als Bild-Workflow-Konfiguration. Sie müssen nicht sofort migrieren, aber die verschachtelten Abschnitte `image` / `video` / `music` werden für neue Setups empfohlen.

    <Tip>
    Wenn Sie nur Bildgenerierung verwenden, sind die flache Legacy-Konfiguration und der neue verschachtelte Abschnitt `image` funktional gleichwertig.
    </Tip>

  </Accordion>

  <Accordion title="Live-Tests">
    Es gibt Opt-in-Live-Abdeckung für das gebündelte Plugin:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Der Live-Test überspringt einzelne Fälle für Bilder, Videos oder Musik, wenn der passende Comfy-Workflow-Abschnitt nicht konfiguriert ist.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Konfiguration und Verwendung des Bildgenerierungstools.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Konfiguration und Verwendung des Videogenerierungstools.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Einrichtung des Tools für Musik- und Audiogenerierung.
  </Card>
  <Card title="Provider-Verzeichnis" href="/de/providers/index" icon="layers">
    Überblick über alle Provider und Modell-Refs.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference#agent-defaults" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich Agent-Standardeinstellungen.
  </Card>
</CardGroup>
