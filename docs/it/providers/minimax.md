---
read_when:
    - Vuoi i modelli MiniMax in OpenClaw
    - Hai bisogno di indicazioni per la configurazione di MiniMax
summary: Usa i modelli MiniMax in OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-12T23:31:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee9c89faf57384feb66cda30934000e5746996f24b59122db309318f42c22389
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

Il provider MiniMax di OpenClaw usa per impostazione predefinita **MiniMax M2.7**.

MiniMax fornisce anche:

- Sintesi vocale integrata tramite T2A v2
- Comprensione immagini integrata tramite `MiniMax-VL-01`
- Generazione musicale integrata tramite `music-2.5+`
- `web_search` integrato tramite l'API di ricerca MiniMax Coding Plan

Suddivisione dei provider:

| ID provider      | Auth    | Capacità                                                       |
| ---------------- | ------- | -------------------------------------------------------------- |
| `minimax`        | Chiave API | Testo, generazione immagini, comprensione immagini, voce, ricerca web |
| `minimax-portal` | OAuth   | Testo, generazione immagini, comprensione immagini            |

## Gamma di modelli

| Modello                  | Tipo             | Descrizione                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning) | Modello di reasoning ospitato predefinito |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Tier di reasoning M2.7 più veloce        |
| `MiniMax-VL-01`          | Vision           | Modello di comprensione immagini         |
| `image-01`               | Generazione immagini | Da testo a immagine e modifica da immagine a immagine |
| `music-2.5+`             | Generazione musicale | Modello musicale predefinito           |
| `music-2.5`              | Generazione musicale | Tier precedente di generazione musicale |
| `music-2.0`              | Generazione musicale | Tier legacy di generazione musicale    |
| `MiniMax-Hailuo-2.3`     | Generazione video | Flussi da testo a video e con immagine di riferimento |

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
    Le configurazioni OAuth usano l'id provider `minimax-portal`. I riferimenti dei modelli seguono il formato `minimax-portal/MiniMax-M2.7`.
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

            Questo configura `api.minimax.io` come URL base.
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

            Questo configura `api.minimaxi.com` come URL base.
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
                input: ["text", "image"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text", "image"],
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
    Sul percorso di streaming compatibile con Anthropic, OpenClaw disabilita per impostazione predefinita il thinking di MiniMax a meno che tu non imposti esplicitamente `thinking`. L'endpoint di streaming di MiniMax emette `reasoning_content` in blocchi delta in stile OpenAI invece dei blocchi di thinking nativi di Anthropic, il che può esporre il reasoning interno nell'output visibile se lasciato implicitamente abilitato.
    </Warning>

    <Note>
    Le configurazioni con chiave API usano l'id provider `minimax`. I riferimenti dei modelli seguono il formato `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configurazione tramite `openclaw configure`

Usa la procedura guidata interattiva di configurazione per impostare MiniMax senza modificare JSON:

<Steps>
  <Step title="Avvia la procedura guidata">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Seleziona Modello/auth">
    Scegli **Model/auth** dal menu.
  </Step>
  <Step title="Scegli un'opzione di autenticazione MiniMax">
    Seleziona una delle opzioni MiniMax disponibili:

    | Auth choice | Descrizione |
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

## Capacità

### Generazione di immagini

Il plugin MiniMax registra il modello `image-01` per lo strumento `image_generate`. Supporta:

- **Generazione da testo a immagine** con controllo del rapporto d'aspetto
- **Modifica da immagine a immagine** (riferimento del soggetto) con controllo del rapporto d'aspetto
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

Il plugin usa la stessa autenticazione `MINIMAX_API_KEY` o OAuth dei modelli di testo. Non è necessaria alcuna configurazione aggiuntiva se MiniMax è già configurato.

Sia `minimax` sia `minimax-portal` registrano `image_generate` con lo stesso
modello `image-01`. Le configurazioni con chiave API usano `MINIMAX_API_KEY`; le configurazioni OAuth possono usare invece il percorso di autenticazione integrato `minimax-portal`.

Quando l'onboarding o la configurazione con chiave API scrivono voci esplicite `models.providers.minimax`,
OpenClaw materializza `MiniMax-M2.7` e
`MiniMax-M2.7-highspeed` con `input: ["text", "image"]`.

Il catalogo testuale MiniMax integrato resta invece metadato solo testo fino a quando non esiste quella configurazione esplicita del provider. La comprensione delle immagini è esposta separatamente tramite il provider multimediale `MiniMax-VL-01` gestito dal plugin.

<Note>
Vedi [Generazione di immagini](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

### Generazione musicale

Il plugin integrato `minimax` registra anche la generazione musicale tramite lo strumento condiviso
`music_generate`.

- Modello musicale predefinito: `minimax/music-2.5+`
- Supporta anche `minimax/music-2.5` e `minimax/music-2.0`
- Controlli del prompt: `lyrics`, `instrumental`, `durationSeconds`
- Formato di output: `mp3`
- Le esecuzioni supportate da sessione vengono scollegate tramite il flusso condiviso task/status, incluso `action: "status"`

Per usare MiniMax come provider musicale predefinito:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
Vedi [Generazione musicale](/it/tools/music-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

### Generazione video

Il plugin integrato `minimax` registra anche la generazione video tramite lo strumento condiviso
`video_generate`.

- Modello video predefinito: `minimax/MiniMax-Hailuo-2.3`
- Modalità: da testo a video e flussi con singola immagine di riferimento
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

Il plugin MiniMax registra la comprensione delle immagini separatamente dal catalogo di testo:

| ID provider      | Modello immagine predefinito |
| ---------------- | ---------------------------- |
| `minimax`        | `MiniMax-VL-01`              |
| `minimax-portal` | `MiniMax-VL-01`              |

Ecco perché l'instradamento automatico dei media può usare la comprensione immagini MiniMax anche
quando il catalogo integrato del provider testuale mostra ancora solo i riferimenti chat M2.7 di solo testo.

### Ricerca web

Il plugin MiniMax registra anche `web_search` tramite l'API di ricerca MiniMax Coding Plan.

- ID provider: `minimax`
- Risultati strutturati: titoli, URL, snippet, query correlate
- Variabile env preferita: `MINIMAX_CODE_PLAN_KEY`
- Alias env accettato: `MINIMAX_CODING_API_KEY`
- Fallback di compatibilità: `MINIMAX_API_KEY` quando punta già a un token coding-plan
- Riutilizzo della regione: `plugins.entries.minimax.config.webSearch.region`, poi `MINIMAX_API_HOST`, poi gli URL base del provider MiniMax
- La ricerca resta sull'id provider `minimax`; la configurazione OAuth CN/globale può comunque indirizzare indirettamente la regione tramite `models.providers.minimax-portal.baseUrl`

La configurazione si trova sotto `plugins.entries.minimax.config.webSearch.*`.

<Note>
Vedi [MiniMax Search](/it/tools/minimax-search) per la configurazione completa della ricerca web e per l'utilizzo.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Opzioni di configurazione">
    | Opzione | Descrizione |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Preferisci `https://api.minimax.io/anthropic` (compatibile con Anthropic); `https://api.minimax.io/v1` è facoltativo per payload compatibili con OpenAI |
    | `models.providers.minimax.api` | Preferisci `anthropic-messages`; `openai-completions` è facoltativo per payload compatibili con OpenAI |
    | `models.providers.minimax.apiKey` | Chiave API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definisce `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Alias dei modelli che vuoi nell'allowlist |
    | `models.mode` | Mantieni `merge` se vuoi aggiungere MiniMax accanto ai provider integrati |
  </Accordion>

  <Accordion title="Valori predefiniti di thinking">
    Su `api: "anthropic-messages"`, OpenClaw inserisce `thinking: { type: "disabled" }` a meno che il thinking non sia già impostato esplicitamente in params/config.

    Questo impedisce all'endpoint di streaming di MiniMax di emettere `reasoning_content` in chunk delta in stile OpenAI, che esporrebbero il reasoning interno nell'output visibile.

  </Accordion>

  <Accordion title="Modalità fast">
    `/fast on` o `params.fastMode: true` riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` sul percorso stream compatibile con Anthropic.
  </Accordion>

  <Accordion title="Esempio di fallback">
    **Ideale per:** mantenere come primario il tuo modello più forte di ultima generazione ed effettuare il failover su MiniMax M2.7. L'esempio seguente usa Opus come primario concreto; sostituiscilo con il tuo modello primario di ultima generazione preferito.

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
    - API di utilizzo di Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (richiede una chiave coding plan).
    - OpenClaw normalizza l'utilizzo del coding plan di MiniMax nello stesso formato di visualizzazione `% left` usato dagli altri provider. I campi raw `usage_percent` / `usagePercent` di MiniMax rappresentano la quota rimanente, non la quota consumata, quindi OpenClaw li inverte. I campi basati sul conteggio hanno priorità quando presenti.
    - Quando l'API restituisce `model_remains`, OpenClaw preferisce la voce del modello chat, ricava l'etichetta della finestra da `start_time` / `end_time` quando necessario e include il nome del modello selezionato nell'etichetta del piano così le finestre del coding plan sono più facili da distinguere.
    - Le istantanee di utilizzo trattano `minimax`, `minimax-cn` e `minimax-portal` come la stessa superficie di quota MiniMax e preferiscono l'OAuth MiniMax memorizzato prima di ricorrere alle variabili env della chiave Coding Plan.
  </Accordion>
</AccordionGroup>

## Note

- I riferimenti dei modelli seguono il percorso di autenticazione:
  - Configurazione con chiave API: `minimax/<model>`
  - Configurazione OAuth: `minimax-portal/<model>`
- Modello chat predefinito: `MiniMax-M2.7`
- Modello chat alternativo: `MiniMax-M2.7-highspeed`
- L'onboarding e la configurazione diretta con chiave API scrivono definizioni esplicite dei modelli con `input: ["text", "image"]` per entrambe le varianti M2.7
- Il catalogo del provider integrato attualmente espone i riferimenti chat come metadati solo testo finché non esiste una configurazione esplicita del provider MiniMax
- Aggiorna i valori di prezzo in `models.json` se ti serve un tracciamento preciso dei costi
- Usa `openclaw models list` per confermare l'id provider attuale, poi passa con `openclaw models set minimax/MiniMax-M2.7` oppure `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Link referral per MiniMax Coding Plan (10% di sconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Vedi [Provider di modelli](/it/concepts/model-providers) per le regole dei provider.
</Note>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title='"Modello sconosciuto: minimax/MiniMax-M2.7"'>
    Questo di solito significa che il **provider MiniMax non è configurato** (nessuna voce provider corrispondente e nessun profilo/env key di autenticazione MiniMax trovato). Una correzione per questo rilevamento è presente nella **2026.1.12**. Risolvi in questo modo:

    - Aggiorna alla **2026.1.12** (oppure esegui dal sorgente `main`), quindi riavvia il gateway.
    - Esegui `openclaw configure` e seleziona un'opzione di autenticazione **MiniMax**, oppure
    - Aggiungi manualmente il blocco corrispondente `models.providers.minimax` o `models.providers.minimax-portal`, oppure
    - Imposta `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` o un profilo di autenticazione MiniMax in modo che il provider corrispondente possa essere inserito.

    Assicurati che l'id del modello sia **sensibile a maiuscole e minuscole**:

    - Percorso con chiave API: `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed`
    - Percorso OAuth: `minimax-portal/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7-highspeed`

    Poi ricontrolla con:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Altro aiuto: [Troubleshooting](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, riferimenti modello e comportamento di failover.
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
  <Card title="Troubleshooting" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
