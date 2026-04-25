---
read_when:
    - Vuoi i modelli MiniMax in OpenClaw
    - Hai bisogno di indicazioni per configurare MiniMax
summary: Usare i modelli MiniMax in OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T13:55:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 666e8fd958a2566a66bc2262a1b23e3253f4ed1367c4e684380041fd935ab4af
    source_path: providers/minimax.md
    workflow: 15
---

Il provider MiniMax di OpenClaw usa per impostazione predefinita **MiniMax M2.7**.

MiniMax fornisce anche:

- Sintesi vocale integrata tramite T2A v2
- Comprensione delle immagini integrata tramite `MiniMax-VL-01`
- Generazione musicale integrata tramite `music-2.6`
- `web_search` integrato tramite l'API di ricerca MiniMax Coding Plan

Suddivisione del provider:

| ID provider      | Auth         | Capability                                                     |
| ---------------- | ------------ | -------------------------------------------------------------- |
| `minimax`        | Chiave API   | Testo, generazione immagini, comprensione immagini, voce, web search |
| `minimax-portal` | OAuth        | Testo, generazione immagini, comprensione immagini, voce       |

## Catalogo integrato

| Modello                  | Tipo              | Descrizione                               |
| ------------------------ | ----------------- | ----------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning)  | Modello reasoning ospitato predefinito    |
| `MiniMax-M2.7-highspeed` | Chat (reasoning)  | Tier reasoning M2.7 più veloce            |
| `MiniMax-VL-01`          | Vision            | Modello di comprensione delle immagini    |
| `image-01`               | Generazione immagini | Text-to-image e modifica image-to-image |
| `music-2.6`              | Generazione musicale | Modello musicale predefinito            |
| `music-2.5`              | Generazione musicale | Tier precedente di generazione musicale |
| `music-2.0`              | Generazione musicale | Tier legacy di generazione musicale     |
| `MiniMax-Hailuo-2.3`     | Generazione video | Flussi text-to-video e image reference    |

## Per iniziare

Scegli il metodo di autenticazione che preferisci e segui i passaggi di configurazione.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Ideale per:** configurazione rapida con MiniMax Coding Plan tramite OAuth, senza chiave API.

    <Tabs>
      <Tab title="Internazionale">
        <Steps>
          <Step title="Esegui l'onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Questo esegue l'autenticazione su `api.minimax.io`.
          </Step>
          <Step title="Verifica che il modello sia disponibile">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Cina">
        <Steps>
          <Step title="Esegui l'onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Questo esegue l'autenticazione su `api.minimaxi.com`.
          </Step>
          <Step title="Verifica che il modello sia disponibile">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Le configurazioni OAuth usano l'id provider `minimax-portal`. Le ref dei modelli seguono la forma `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Link referral per MiniMax Coding Plan (10% di sconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="Chiave API">
    **Ideale per:** MiniMax ospitato con API compatibile con Anthropic.

    <Tabs>
      <Tab title="Internazionale">
        <Steps>
          <Step title="Esegui l'onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Questo configura `api.minimax.io` come base URL.
          </Step>
          <Step title="Verifica che il modello sia disponibile">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Cina">
        <Steps>
          <Step title="Esegui l'onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Questo configura `api.minimaxi.com` come base URL.
          </Step>
          <Step title="Verifica che il modello sia disponibile">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Esempio di configurazione

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    Sul percorso di streaming compatibile con Anthropic, OpenClaw disabilita per impostazione predefinita il thinking di MiniMax a meno che tu non imposti esplicitamente `thinking`. L'endpoint di streaming di MiniMax emette `reasoning_content` in blocchi delta in stile OpenAI invece che in blocchi di thinking nativi Anthropic, il che può esporre il reasoning interno nell'output visibile se lasciato implicitamente abilitato.
    </Warning>

    <Note>
    Le configurazioni con chiave API usano l'id provider `minimax`. Le ref dei modelli seguono la forma `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configurare tramite `openclaw configure`

Usa il wizard di configurazione interattivo per impostare MiniMax senza modificare JSON:

<Steps>
  <Step title="Avvia il wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Seleziona Modello/auth">
    Scegli **Model/auth** dal menu.
  </Step>
  <Step title="Scegli un'opzione auth MiniMax">
    Scegli una delle opzioni MiniMax disponibili:

    | Scelta auth | Descrizione |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internazionale (Coding Plan) |
    | `minimax-cn-oauth` | OAuth Cina (Coding Plan) |
    | `minimax-global-api` | Chiave API internazionale |
    | `minimax-cn-api` | Chiave API Cina |

  </Step>
  <Step title="Scegli il tuo modello predefinito">
    Seleziona il tuo modello predefinito quando richiesto.
  </Step>
</Steps>

## Capability

### Generazione di immagini

Il Plugin MiniMax registra il modello `image-01` per lo strumento `image_generate`. Supporta:

- **Generazione text-to-image** con controllo del rapporto d'aspetto
- **Modifica image-to-image** (riferimento del soggetto) con controllo del rapporto d'aspetto
- Fino a **9 immagini in output** per richiesta
- Fino a **1 immagine di riferimento** per richiesta di modifica
- Rapporti d'aspetto supportati: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Per usare MiniMax per la generazione di immagini, impostalo come provider di generazione immagini:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Il Plugin usa la stessa `MINIMAX_API_KEY` o autenticazione OAuth dei modelli di testo. Non è necessaria alcuna configurazione aggiuntiva se MiniMax è già impostato.

Sia `minimax` sia `minimax-portal` registrano `image_generate` con lo stesso
modello `image-01`. Le configurazioni con chiave API usano `MINIMAX_API_KEY`; le configurazioni OAuth possono usare
invece il percorso auth incluso `minimax-portal`.

Quando l'onboarding o la configurazione con chiave API scrivono voci esplicite `models.providers.minimax`,
OpenClaw materializza `MiniMax-M2.7` e
`MiniMax-M2.7-highspeed` come modelli chat solo testo. La comprensione delle immagini viene
esposta separatamente tramite il provider media `MiniMax-VL-01` di proprietà del Plugin.

<Note>
Vedi [Generazione di immagini](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

### Text-to-speech

Il Plugin `minimax` incluso registra MiniMax T2A v2 come provider speech per
`messages.tts`.

- Modello TTS predefinito: `speech-2.8-hd`
- Voce predefinita: `English_expressive_narrator`
- Gli id di modello inclusi supportati comprendono `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` e `speech-01-turbo`.
- La risoluzione auth è `messages.tts.providers.minimax.apiKey`, poi
  profili auth OAuth/token `minimax-portal`, poi chiavi env Token Plan
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), poi `MINIMAX_API_KEY`.
- Se non è configurato alcun host TTS, OpenClaw riusa l'host OAuth `minimax-portal`
  configurato e rimuove suffissi di percorso compatibili con Anthropic
  come `/anthropic`.
- I normali allegati audio restano MP3.
- Le destinazioni dei messaggi vocali come Feishu e Telegram vengono transcodificate da MP3 MiniMax
  a Opus 48kHz con `ffmpeg`, perché l'API file Feishu/Lark accetta solo
  `file_type: "opus"` per i messaggi audio nativi.
- MiniMax T2A accetta `speed` e `vol` frazionari, ma `pitch` viene inviato come
  intero; OpenClaw tronca i valori frazionari di `pitch` prima della richiesta API.

| Impostazione                             | Variabile env          | Predefinito                   | Descrizione                          |
| ---------------------------------------- | ---------------------- | ----------------------------- | ------------------------------------ |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host API MiniMax T2A.                |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Id del modello TTS.                  |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Id della voce usata per l'output vocale. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Velocità di riproduzione, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Volume, `(0, 10]`.                   |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Shift di intonazione intero, `-12..12`. |

### Generazione musicale

Il Plugin `minimax` incluso registra anche la generazione musicale tramite lo
strumento condiviso `music_generate`.

- Modello musicale predefinito: `minimax/music-2.6`
- Supporta anche `minimax/music-2.5` e `minimax/music-2.0`
- Controlli del prompt: `lyrics`, `instrumental`, `durationSeconds`
- Formato di output: `mp3`
- Le esecuzioni supportate da sessione vengono scollegate tramite il flusso condiviso di attività/stato, incluso `action: "status"`

Per usare MiniMax come provider musicale predefinito:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Vedi [Generazione musicale](/it/tools/music-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

### Generazione video

Il Plugin `minimax` incluso registra anche la generazione video tramite lo
strumento condiviso `video_generate`.

- Modello video predefinito: `minimax/MiniMax-Hailuo-2.3`
- Modalità: flussi text-to-video e con riferimento a immagine singola
- Supporta `aspectRatio` e `resolution`

Per usare MiniMax come provider video predefinito:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Vedi [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

### Comprensione delle immagini

Il Plugin MiniMax registra la comprensione delle immagini separatamente dal
catalogo di testo:

| ID provider      | Modello immagine predefinito |
| ---------------- | ---------------------------- |
| `minimax`        | `MiniMax-VL-01`              |
| `minimax-portal` | `MiniMax-VL-01`              |

Questo è il motivo per cui l'instradamento automatico dei media può usare la comprensione delle immagini di MiniMax anche
quando il catalogo incluso del provider testuale continua a mostrare ref chat M2.7 solo testo.

### Web search

Il Plugin MiniMax registra anche `web_search` tramite l'API di ricerca MiniMax Coding Plan.

- ID provider: `minimax`
- Risultati strutturati: titoli, URL, snippet, query correlate
- Variabile env preferita: `MINIMAX_CODE_PLAN_KEY`
- Alias env accettato: `MINIMAX_CODING_API_KEY`
- Fallback di compatibilità: `MINIMAX_API_KEY` quando punta già a un token coding-plan
- Riuso della regione: `plugins.entries.minimax.config.webSearch.region`, poi `MINIMAX_API_HOST`, poi i base URL del provider MiniMax
- La ricerca resta sull'id provider `minimax`; la configurazione OAuth CN/global può comunque orientare indirettamente la regione tramite `models.providers.minimax-portal.baseUrl`

La configurazione si trova sotto `plugins.entries.minimax.config.webSearch.*`.

<Note>
Vedi [MiniMax Search](/it/tools/minimax-search) per la configurazione completa e l'utilizzo della ricerca web.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Opzioni di configurazione">
    | Opzione | Descrizione |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Preferisci `https://api.minimax.io/anthropic` (compatibile con Anthropic); `https://api.minimax.io/v1` è facoltativo per payload compatibili con OpenAI |
    | `models.providers.minimax.api` | Preferisci `anthropic-messages`; `openai-completions` è facoltativo per payload compatibili con OpenAI |
    | `models.providers.minimax.apiKey` | Chiave API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definisci `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Alias dei modelli che vuoi nell'allowlist |
    | `models.mode` | Mantieni `merge` se vuoi aggiungere MiniMax insieme ai provider integrati |
  </Accordion>

  <Accordion title="Valori predefiniti del thinking">
    Su `api: "anthropic-messages"`, OpenClaw inietta `thinking: { type: "disabled" }` a meno che il thinking non sia già impostato esplicitamente in params/config.

    Questo impedisce all'endpoint di streaming di MiniMax di emettere `reasoning_content` in blocchi delta in stile OpenAI, che esporrebbero il reasoning interno nell'output visibile.

  </Accordion>

  <Accordion title="Modalità fast">
    `/fast on` o `params.fastMode: true` riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` sul percorso stream compatibile con Anthropic.
  </Accordion>

  <Accordion title="Esempio di fallback">
    **Ideale per:** mantenere come primario il tuo modello di ultima generazione più forte e usare il fallback a MiniMax M2.7. L'esempio qui sotto usa Opus come primario concreto; sostituiscilo con il tuo modello primario di ultima generazione preferito.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Dettagli di utilizzo di Coding Plan">
    - API di utilizzo di Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (richiede una coding plan key).
    - OpenClaw normalizza l'utilizzo coding-plan di MiniMax alla stessa visualizzazione `% left` usata dagli altri provider. I campi raw `usage_percent` / `usagePercent` di MiniMax rappresentano quota residua, non quota consumata, quindi OpenClaw li inverte. I campi basati sul conteggio hanno la precedenza quando presenti.
    - Quando l'API restituisce `model_remains`, OpenClaw preferisce la voce del modello chat, ricava l'etichetta della finestra da `start_time` / `end_time` quando necessario e include il nome del modello selezionato nell'etichetta del piano così le finestre coding-plan sono più facili da distinguere.
    - Le snapshot di utilizzo trattano `minimax`, `minimax-cn` e `minimax-portal` come la stessa superficie di quota MiniMax e preferiscono l'OAuth MiniMax memorizzato prima di usare il fallback alle chiavi env di Coding Plan.
  </Accordion>
</AccordionGroup>

## Note

- Le ref dei modelli seguono il percorso auth:
  - Configurazione con chiave API: `minimax/<model>`
  - Configurazione OAuth: `minimax-portal/<model>`
- Modello chat predefinito: `MiniMax-M2.7`
- Modello chat alternativo: `MiniMax-M2.7-highspeed`
- L'onboarding e la configurazione diretta con chiave API scrivono definizioni di modello solo testo per entrambe le varianti M2.7
- La comprensione delle immagini usa il provider media `MiniMax-VL-01` di proprietà del Plugin
- Aggiorna i valori di prezzo in `models.json` se hai bisogno di un tracciamento esatto dei costi
- Usa `openclaw models list` per confermare l'id provider corrente, poi cambia con `openclaw models set minimax/MiniMax-M2.7` o `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Link referral per MiniMax Coding Plan (10% di sconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Vedi [Provider di modelli](/it/concepts/model-providers) per le regole dei provider.
</Note>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Questo di solito significa che il **provider MiniMax non è configurato** (nessuna voce provider corrispondente e nessun profilo auth MiniMax/chiave env rilevato). Una correzione per questo rilevamento è presente in **2026.1.12**. Risolvi in questo modo:

    - Aggiorna a **2026.1.12** (oppure esegui dal sorgente `main`), poi riavvia il gateway.
    - Esegui `openclaw configure` e seleziona un'opzione auth **MiniMax**, oppure
    - Aggiungi manualmente il blocco corrispondente `models.providers.minimax` o `models.providers.minimax-portal`, oppure
    - Imposta `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` o un profilo auth MiniMax così il provider corrispondente possa essere iniettato.

    Assicurati che l'id del modello sia **case-sensitive**:

    - Percorso chiave API: `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed`
    - Percorso OAuth: `minimax-portal/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7-highspeed`

    Poi ricontrolla con:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Altro aiuto: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, ref dei modelli e comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagine e selezione del provider.
  </Card>
  <Card title="Generazione musicale" href="/it/tools/music-generation" icon="music">
    Parametri condivisi dello strumento musicale e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="MiniMax Search" href="/it/tools/minimax-search" icon="magnifying-glass">
    Configurazione della ricerca web tramite MiniMax Coding Plan.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
