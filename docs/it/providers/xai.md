---
read_when:
    - Vuoi usare i modelli Grok in OpenClaw
    - Stai configurando l'autenticazione xAI o gli ID dei modelli
summary: Usa i modelli xAI Grok in OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-12T23:33:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 820fef290c67d9815e41a96909d567216f67ca0f01df1d325008fd04666ad255
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw include un plugin provider integrato `xai` per i modelli Grok.

## Per iniziare

<Steps>
  <Step title="Crea una chiave API">
    Crea una chiave API nella [console xAI](https://console.x.ai/).
  </Step>
  <Step title="Imposta la tua chiave API">
    Imposta `XAI_API_KEY`, oppure esegui:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Scegli un modello">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw usa l'API xAI Responses come trasporto xAI integrato. La stessa
`XAI_API_KEY` può anche alimentare `web_search` basato su Grok, `x_search`
di prima classe e `code_execution` remoto.
Se memorizzi una chiave xAI sotto `plugins.entries.xai.config.webSearch.apiKey`,
anche il provider di modelli xAI integrato riutilizza quella chiave come fallback.
La configurazione di `code_execution` si trova sotto `plugins.entries.xai.config.codeExecution`.
</Note>

## Catalogo di modelli integrato

OpenClaw include queste famiglie di modelli xAI pronte all'uso:

| Famiglia       | ID modello                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`              |
| Grok 4         | `grok-4`, `grok-4-0709`                                                 |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                              |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                          |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                      |

Il plugin risolve anche in forward i nuovi ID `grok-4*` e `grok-code-fast*` quando
seguono la stessa forma API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` e le varianti `grok-4.20-beta-*` sono gli
attuali riferimenti Grok con capacità immagine nel catalogo integrato.
</Tip>

### Mappature della modalità fast

`/fast on` oppure `agents.defaults.models["xai/<model>"].params.fastMode: true`
riscrive le richieste xAI native come segue:

| Modello sorgente | Destinazione modalità fast |
| ---------------- | -------------------------- |
| `grok-3`         | `grok-3-fast`             |
| `grok-3-mini`    | `grok-3-mini-fast`        |
| `grok-4`         | `grok-4-fast`             |
| `grok-4-0709`    | `grok-4-fast`             |

### Alias legacy di compatibilità

Gli alias legacy continuano a normalizzarsi agli ID canonici integrati:

| Alias legacy              | ID canonico                           |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Funzionalità

<AccordionGroup>
  <Accordion title="Ricerca web">
    Il provider integrato `grok` per la ricerca web usa anch'esso `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Generazione video">
    Il plugin integrato `xai` registra la generazione video tramite lo strumento condiviso
    `video_generate`.

    - Modello video predefinito: `xai/grok-imagine-video`
    - Modalità: da testo a video, da immagine a video e flussi remoti di modifica/estensione video
    - Supporta `aspectRatio` e `resolution`

    <Warning>
    I buffer video locali non sono accettati. Usa URL remoti `http(s)` per
    input di riferimento video e di modifica.
    </Warning>

    Per usare xAI come provider video predefinito:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Vedi [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento,
    la selezione del provider e il comportamento di failover.
    </Note>

  </Accordion>

  <Accordion title="Configurazione di x_search">
    Il plugin xAI integrato espone `x_search` come strumento OpenClaw per cercare
    contenuti su X (ex Twitter) tramite Grok.

    Percorso di configurazione: `plugins.entries.xai.config.xSearch`

    | Chiave             | Tipo    | Predefinito        | Descrizione                         |
    | ------------------ | ------- | ------------------ | ----------------------------------- |
    | `enabled`          | boolean | —                  | Abilita o disabilita x_search       |
    | `model`            | string  | `grok-4-1-fast`    | Modello usato per richieste x_search |
    | `inlineCitations`  | boolean | —                  | Include citazioni inline nei risultati |
    | `maxTurns`         | number  | —                  | Numero massimo di turni di conversazione |
    | `timeoutSeconds`   | number  | —                  | Timeout della richiesta in secondi  |
    | `cacheTtlMinutes`  | number  | —                  | Tempo di vita della cache in minuti |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configurazione di code_execution">
    Il plugin xAI integrato espone `code_execution` come strumento OpenClaw per
    l'esecuzione remota di codice nell'ambiente sandbox di xAI.

    Percorso di configurazione: `plugins.entries.xai.config.codeExecution`

    | Chiave            | Tipo    | Predefinito               | Descrizione                              |
    | ----------------- | ------- | ------------------------- | ---------------------------------------- |
    | `enabled`         | boolean | `true` (se la chiave è disponibile) | Abilita o disabilita l'esecuzione del codice |
    | `model`           | string  | `grok-4-1-fast`           | Modello usato per le richieste di esecuzione codice |
    | `maxTurns`        | number  | —                         | Numero massimo di turni di conversazione |
    | `timeoutSeconds`  | number  | —                         | Timeout della richiesta in secondi       |

    <Note>
    Si tratta di esecuzione remota nella sandbox xAI, non di [`exec`](/it/tools/exec) locale.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Limiti noti">
    - L'autenticazione oggi è solo tramite chiave API. In OpenClaw non esiste ancora un flusso xAI OAuth o device-code.
    - `grok-4.20-multi-agent-experimental-beta-0304` non è supportato sul
      normale percorso del provider xAI perché richiede una diversa superficie API upstream
      rispetto al trasporto xAI standard di OpenClaw.
  </Accordion>

  <Accordion title="Note avanzate">
    - OpenClaw applica automaticamente correzioni di compatibilità specifiche di xAI
      per schema degli strumenti e chiamate agli strumenti sul percorso runner condiviso.
    - Le richieste xAI native usano per impostazione predefinita `tool_stream: true`. Imposta
      `agents.defaults.models["xai/<model>"].params.tool_stream` su `false` per
      disabilitarlo.
    - Il wrapper xAI integrato rimuove i flag strict dello schema degli strumenti non supportati e
      le chiavi di payload reasoning prima di inviare richieste xAI native.
    - `web_search`, `x_search` e `code_execution` sono esposti come strumenti OpenClaw. OpenClaw abilita lo specifico built-in xAI necessario all'interno di ogni richiesta dello strumento invece di allegare tutti gli strumenti nativi a ogni turno di chat.
    - `x_search` e `code_execution` sono gestiti dal plugin xAI integrato invece di essere codificati in modo statico nel runtime del modello core.
    - `code_execution` è esecuzione remota nella sandbox xAI, non [`exec`](/it/tools/exec) locale.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Tutti i provider" href="/it/providers/index" icon="grid-2">
    La panoramica generale dei provider.
  </Card>
  <Card title="Troubleshooting" href="/it/help/troubleshooting" icon="wrench">
    Problemi comuni e correzioni.
  </Card>
</CardGroup>
