---
read_when:
    - Vuoi usare Qwen con OpenClaw
    - Hai usato in precedenza Qwen OAuth
summary: Usa Qwen Cloud tramite il provider qwen integrato di OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-12T23:32:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5247f851ef891645df6572d748ea15deeea47cd1d75858bc0d044a2930065106
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**Qwen OAuth è stato rimosso.** L’integrazione OAuth del livello gratuito
(`qwen-portal`) che usava gli endpoint `portal.qwen.ai` non è più disponibile.
Consulta [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) per il
contesto.

</Warning>

OpenClaw ora considera Qwen come un provider integrato di prima classe con ID canonico
`qwen`. Il provider integrato è destinato agli endpoint Qwen Cloud / Alibaba DashScope e
Coding Plan e mantiene funzionanti gli ID legacy `modelstudio` come alias di
compatibilità.

- Provider: `qwen`
- Variabile d’ambiente preferita: `QWEN_API_KEY`
- Accettate anche per compatibilità: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Stile API: compatibile con OpenAI

<Tip>
Se vuoi `qwen3.6-plus`, preferisci l’endpoint **Standard (pay-as-you-go)**.
Il supporto del Coding Plan può essere in ritardo rispetto al catalogo pubblico.
</Tip>

## Per iniziare

Scegli il tuo tipo di piano e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Coding Plan (abbonamento)">
    **Ideale per:** accesso in abbonamento tramite il Qwen Coding Plan.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea o copia una chiave API da [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Esegui l’onboarding">
        Per l’endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Per l’endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Gli ID `auth-choice` legacy `modelstudio-*` e i riferimenti di modello `modelstudio/...` continuano a
    funzionare come alias di compatibilità, ma i nuovi flussi di configurazione dovrebbero preferire gli ID
    `auth-choice` canonici `qwen-*` e i riferimenti di modello `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Ideale per:** accesso pay-as-you-go tramite l’endpoint Standard Model Studio, inclusi modelli come `qwen3.6-plus` che potrebbero non essere disponibili nel Coding Plan.

    <Steps>
      <Step title="Ottieni la tua chiave API">
        Crea o copia una chiave API da [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Esegui l’onboarding">
        Per l’endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Per l’endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Gli ID `auth-choice` legacy `modelstudio-*` e i riferimenti di modello `modelstudio/...` continuano a
    funzionare come alias di compatibilità, ma i nuovi flussi di configurazione dovrebbero preferire gli ID
    `auth-choice` canonici `qwen-*` e i riferimenti di modello `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Tipi di piano ed endpoint

| Plan                       | Region | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (abbonamento)  | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (abbonamento)  | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Il provider seleziona automaticamente l’endpoint in base alla tua scelta di autenticazione. Le scelte
canoniche usano la famiglia `qwen-*`; `modelstudio-*` resta solo per compatibilità.
Puoi sostituire questo comportamento con un `baseUrl` personalizzato nella configurazione.

<Tip>
**Gestisci le chiavi:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentazione:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catalogo integrato

OpenClaw al momento include questo catalogo Qwen integrato. Il catalogo configurato è
consapevole dell’endpoint: le configurazioni Coding Plan omettono i modelli che sono noti per funzionare solo
sull’endpoint Standard.

| Model ref                   | Input       | Context   | Notes                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Modello predefinito                                |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Preferisci gli endpoint Standard quando ti serve questo modello |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Linea Qwen Max                                     |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | Reasoning abilitato                                |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI tramite Alibaba                        |

<Note>
La disponibilità può comunque variare in base all’endpoint e al piano di fatturazione anche quando un modello è
presente nel catalogo integrato.
</Note>

## Componenti aggiuntivi multimodali

L’estensione `qwen` espone anche capacità multimodali sugli endpoint DashScope **Standard**
(non sugli endpoint Coding Plan):

- **Comprensione video** tramite `qwen-vl-max-latest`
- **Generazione video Wan** tramite `wan2.6-t2v` (predefinito), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Per usare Qwen come provider video predefinito:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Consulta [Video Generation](/it/tools/video-generation) per i parametri condivisi degli strumenti, la selezione del provider e il comportamento di failover.
</Note>

## Avanzate

<AccordionGroup>
  <Accordion title="Comprensione di immagini e video">
    Il plugin Qwen integrato registra il media understanding per immagini e video
    sugli endpoint DashScope **Standard** (non sugli endpoint Coding Plan).

    | Property      | Value                 |
    | ------------- | --------------------- |
    | Model         | `qwen-vl-max-latest`  |
    | Supported input | Immagini, video     |

    Il media understanding viene risolto automaticamente a partire dall’autenticazione Qwen configurata: non è
    necessaria alcuna configurazione aggiuntiva. Assicurati di usare un endpoint Standard (pay-as-you-go)
    per il supporto al media understanding.

  </Accordion>

  <Accordion title="Disponibilità di Qwen 3.6 Plus">
    `qwen3.6-plus` è disponibile sugli endpoint Standard (pay-as-you-go) Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Se gli endpoint del Coding Plan restituiscono un errore "unsupported model" per
    `qwen3.6-plus`, passa allo Standard (pay-as-you-go) invece che alla coppia
    endpoint/chiave del Coding Plan.

  </Accordion>

  <Accordion title="Piano delle capacità">
    L’estensione `qwen` viene posizionata come la sede del vendor per l’intera superficie Qwen
    Cloud, non solo per i modelli di coding/testo.

    - **Modelli testo/chat:** integrati ora
    - **Tool calling, output strutturato, thinking:** ereditati dal trasporto compatibile con OpenAI
    - **Generazione di immagini:** pianificata al livello del provider-plugin
    - **Comprensione di immagini/video:** integrata ora sull’endpoint Standard
    - **Speech/audio:** pianificata al livello del provider-plugin
    - **Embedding/reranking della memoria:** pianificati tramite la superficie dell’adapter di embedding
    - **Generazione video:** integrata ora tramite la capacità condivisa di video-generation

  </Accordion>

  <Accordion title="Dettagli sulla generazione video">
    Per la generazione video, OpenClaw mappa la regione Qwen configurata all’host
    DashScope AIGC corrispondente prima di inviare il job:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Questo significa che un normale `models.providers.qwen.baseUrl` che punta a uno dei
    host Qwen Coding Plan o Standard mantiene comunque la generazione video sul corretto
    endpoint video DashScope regionale.

    Limiti attuali della generazione video Qwen integrata:

    - Fino a **1** video di output per richiesta
    - Fino a **1** immagine di input
    - Fino a **4** video di input
    - Durata fino a **10 secondi**
    - Supporta `size`, `aspectRatio`, `resolution`, `audio` e `watermark`
    - La modalità immagine/video di riferimento attualmente richiede **URL http(s) remoti**. I percorsi di file locali vengono rifiutati in anticipo perché l’endpoint video DashScope non
      accetta buffer locali caricati per quei riferimenti.

  </Accordion>

  <Accordion title="Compatibilità dell’uso in streaming">
    Gli endpoint nativi Model Studio pubblicizzano la compatibilità dell’uso in streaming sul
    trasporto condiviso `openai-completions`. OpenClaw ora la basa sulle capacità dell’endpoint,
    quindi gli ID provider personalizzati compatibili con DashScope che puntano agli stessi host nativi ereditano lo stesso comportamento di utilizzo in streaming invece di
    richiedere specificamente l’ID provider integrato `qwen`.

    La compatibilità dell’utilizzo in streaming nativo si applica sia agli host Coding Plan sia
    agli host Standard compatibili con DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regioni degli endpoint multimodali">
    Le superfici multimodali (comprensione video e generazione video Wan) usano gli
    endpoint DashScope **Standard**, non gli endpoint Coding Plan:

    - URL di base Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL di base Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Configurazione dell’ambiente e del daemon">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `QWEN_API_KEY` sia
    disponibile per quel processo (ad esempio, in `~/.openclaw/.env` o tramite
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti di modello e del comportamento di failover.
  </Card>
  <Card title="Video generation" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/it/providers/alibaba" icon="cloud">
    Provider legacy ModelStudio e note sulla migrazione.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
