---
read_when:
    - Vuoi usare workflow ComfyUI locali con OpenClaw
    - Vuoi usare Comfy Cloud con workflow di immagini, video o musica
    - Hai bisogno delle chiavi di configurazione del plugin comfy integrato
summary: Configurazione di ComfyUI workflow per la generazione di immagini, video e musica in OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-12T23:30:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85db395b171f37f80b34b22f3e7707bffc1fd9138e7d10687eef13eaaa55cf24
    source_path: providers/comfy.md
    workflow: 15
---

# ComfyUI

OpenClaw include un plugin integrato `comfy` per esecuzioni ComfyUI guidate da workflow. Il plugin è interamente guidato dal workflow, quindi OpenClaw non cerca di mappare controlli generici come `size`, `aspectRatio`, `resolution`, `durationSeconds` o controlli in stile TTS sul tuo grafo.

| Proprietà      | Dettaglio                                                                        |
| -------------- | -------------------------------------------------------------------------------- |
| Provider       | `comfy`                                                                          |
| Modelli        | `comfy/workflow`                                                                 |
| Superfici condivise | `image_generate`, `video_generate`, `music_generate`                        |
| Auth           | Nessuna per ComfyUI locale; `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` per Comfy Cloud |
| API            | ComfyUI `/prompt` / `/history` / `/view` e Comfy Cloud `/api/*`                  |

## Cosa supporta

- Generazione di immagini da un workflow JSON
- Modifica di immagini con 1 immagine di riferimento caricata
- Generazione video da un workflow JSON
- Generazione video con 1 immagine di riferimento caricata
- Generazione di musica o audio tramite lo strumento condiviso `music_generate`
- Download dell'output da un nodo configurato o da tutti i nodi di output corrispondenti

## Per iniziare

Scegli tra eseguire ComfyUI sulla tua macchina oppure usare Comfy Cloud.

<Tabs>
  <Tab title="Locale">
    **Ideale per:** eseguire la tua istanza ComfyUI sulla tua macchina o sulla tua LAN.

    <Steps>
      <Step title="Avvia ComfyUI in locale">
        Assicurati che la tua istanza locale di ComfyUI sia in esecuzione (per impostazione predefinita su `http://127.0.0.1:8188`).
      </Step>
      <Step title="Prepara il tuo workflow JSON">
        Esporta o crea un file JSON di workflow ComfyUI. Annota gli ID dei nodi per il nodo di input del prompt e per il nodo di output da cui vuoi che OpenClaw legga.
      </Step>
      <Step title="Configura il provider">
        Imposta `mode: "local"` e punta al tuo file workflow. Ecco un esempio minimo per immagini:

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
      <Step title="Imposta il modello predefinito">
        Indirizza OpenClaw al modello `comfy/workflow` per la capacità che hai configurato:

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
      <Step title="Verifica">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Ideale per:** eseguire workflow su Comfy Cloud senza gestire risorse GPU locali.

    <Steps>
      <Step title="Ottieni una chiave API">
        Registrati su [comfy.org](https://comfy.org) e genera una chiave API dalla dashboard del tuo account.
      </Step>
      <Step title="Imposta la chiave API">
        Fornisci la tua chiave tramite uno di questi metodi:

        ```bash
        # Variabile d'ambiente (preferita)
        export COMFY_API_KEY="your-key"

        # Variabile d'ambiente alternativa
        export COMFY_CLOUD_API_KEY="your-key"

        # Oppure inline nella configurazione
        openclaw config set models.providers.comfy.apiKey "your-key"
        ```
      </Step>
      <Step title="Prepara il tuo workflow JSON">
        Esporta o crea un file JSON di workflow ComfyUI. Annota gli ID dei nodi per il nodo di input del prompt e per il nodo di output.
      </Step>
      <Step title="Configura il provider">
        Imposta `mode: "cloud"` e punta al tuo file workflow:

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
        In modalità cloud `baseUrl` usa per impostazione predefinita `https://cloud.comfy.org`. Devi impostare `baseUrl` solo se usi un endpoint cloud personalizzato.
        </Tip>
      </Step>
      <Step title="Imposta il modello predefinito">
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
      <Step title="Verifica">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Configurazione

Comfy supporta impostazioni di connessione condivise di primo livello più sezioni workflow per capacità (`image`, `video`, `music`):

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

### Chiavi condivise

| Chiave                | Tipo                   | Descrizione                                                                           |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` o `"cloud"`  | Modalità di connessione.                                                              |
| `baseUrl`             | string                 | Per impostazione predefinita `http://127.0.0.1:8188` in locale o `https://cloud.comfy.org` in cloud. |
| `apiKey`              | string                 | Chiave inline opzionale, alternativa alle variabili env `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | Consente un `baseUrl` privato/LAN in modalità cloud.                                  |

### Chiavi per capacità

Queste chiavi si applicano all'interno delle sezioni `image`, `video` o `music`:

| Chiave                       | Obbligatoria | Predefinito | Descrizione                                                                  |
| ---------------------------- | ------------ | ----------- | ---------------------------------------------------------------------------- |
| `workflow` o `workflowPath`  | Sì           | --          | Percorso del file JSON del workflow ComfyUI.                                 |
| `promptNodeId`               | Sì           | --          | ID del nodo che riceve il prompt testuale.                                   |
| `promptInputName`            | No           | `"text"`    | Nome dell'input sul nodo del prompt.                                         |
| `outputNodeId`               | No           | --          | ID del nodo da cui leggere l'output. Se omesso, vengono usati tutti i nodi di output corrispondenti. |
| `pollIntervalMs`             | No           | --          | Intervallo di polling in millisecondi per il completamento del job.          |
| `timeoutMs`                  | No           | --          | Timeout in millisecondi per l'esecuzione del workflow.                       |

Le sezioni `image` e `video` supportano anche:

| Chiave                | Obbligatoria                          | Predefinito | Descrizione                                         |
| --------------------- | ------------------------------------- | ----------- | --------------------------------------------------- |
| `inputImageNodeId`    | Sì (quando si passa un'immagine di riferimento) | --   | ID del nodo che riceve l'immagine di riferimento caricata. |
| `inputImageInputName` | No                                    | `"image"`   | Nome dell'input sul nodo immagine.                  |

## Dettagli del workflow

<AccordionGroup>
  <Accordion title="Workflow immagine">
    Imposta il modello immagine predefinito su `comfy/workflow`:

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

    **Esempio di modifica con immagine di riferimento:**

    Per abilitare la modifica di immagini con un'immagine di riferimento caricata, aggiungi `inputImageNodeId` alla tua configurazione immagine:

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

  <Accordion title="Workflow video">
    Imposta il modello video predefinito su `comfy/workflow`:

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

    I workflow video Comfy supportano la generazione da testo a video e da immagine a video tramite il grafo configurato.

    <Note>
    OpenClaw non passa video di input nei workflow Comfy. Come input sono supportati solo prompt testuali e singole immagini di riferimento.
    </Note>

  </Accordion>

  <Accordion title="Workflow musica">
    Il plugin integrato registra un provider di generazione musicale per output audio o musicali definiti dal workflow, esposto tramite lo strumento condiviso `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Usa la sezione di configurazione `music` per puntare al tuo JSON di workflow audio e al nodo di output.

  </Accordion>

  <Accordion title="Compatibilità retroattiva">
    La configurazione immagine esistente di primo livello (senza la sezione annidata `image`) continua a funzionare:

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

    OpenClaw tratta questa forma legacy come configurazione del workflow immagine. Non è necessario migrare subito, ma per le nuove configurazioni sono consigliate le sezioni annidate `image` / `video` / `music`.

    <Tip>
    Se usi solo la generazione di immagini, la configurazione flat legacy e la nuova sezione annidata `image` sono funzionalmente equivalenti.
    </Tip>

  </Accordion>

  <Accordion title="Test live">
    Esiste copertura live opt-in per il plugin integrato:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Il test live salta i singoli casi di immagine, video o musica a meno che non sia configurata la sezione workflow Comfy corrispondente.

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Configurazione e utilizzo dello strumento di generazione di immagini.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Configurazione e utilizzo dello strumento di generazione video.
  </Card>
  <Card title="Generazione musicale" href="/it/tools/music-generation" icon="music">
    Configurazione dello strumento per generazione musicale e audio.
  </Card>
  <Card title="Directory provider" href="/it/providers/index" icon="layers">
    Panoramica di tutti i provider e riferimenti modello.
  </Card>
  <Card title="Riferimento configurazione" href="/it/gateway/configuration-reference#agent-defaults" icon="gear">
    Riferimento completo della configurazione, inclusi i valori predefiniti dell'agente.
  </Card>
</CardGroup>
