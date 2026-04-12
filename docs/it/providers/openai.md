---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi l'autenticazione con abbonamento Codex invece delle chiavi API
    - Hai bisogno di un comportamento di esecuzione degli agenti GPT-5 più rigoroso
summary: Usa OpenAI tramite chiavi API o abbonamento Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-12T00:18:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7aa06fba9ac901e663685a6b26443a2f6aeb6ec3589d939522dc87cbb43497b4
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI fornisce API per sviluppatori per i modelli GPT. Codex supporta l'**accesso con ChatGPT** per l'accesso tramite abbonamento
oppure l'accesso con **chiave API** per l'accesso basato sul consumo. Codex cloud richiede l'accesso con ChatGPT.
OpenAI supporta esplicitamente l'uso dell'OAuth dell'abbonamento in strumenti/workflow esterni come OpenClaw.

## Stile di interazione predefinito

OpenClaw può aggiungere un piccolo overlay di prompt specifico per OpenAI sia per le esecuzioni `openai/*` sia per
quelle `openai-codex/*`. Per impostazione predefinita, l'overlay mantiene l'assistente cordiale,
collaborativo, conciso, diretto e un po' più espressivo dal punto di vista emotivo
senza sostituire il prompt di sistema base di OpenClaw. L'overlay cordiale
consente anche l'emoji occasionale quando si adatta in modo naturale, mantenendo comunque
l'output complessivamente conciso.

Chiave di configurazione:

`plugins.entries.openai.config.personality`

Valori consentiti:

- `"friendly"`: predefinito; abilita l'overlay specifico per OpenAI.
- `"on"`: alias di `"friendly"`.
- `"off"`: disabilita l'overlay e usa solo il prompt base di OpenClaw.

Ambito:

- Si applica ai modelli `openai/*`.
- Si applica ai modelli `openai-codex/*`.
- Non influisce su altri provider.

Questo comportamento è attivo per impostazione predefinita. Mantieni `"friendly"` esplicitamente se vuoi che
sopravviva a future modifiche locali della configurazione:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "friendly",
        },
      },
    },
  },
}
```

### Disabilitare l'overlay di prompt OpenAI

Se vuoi il prompt base non modificato di OpenClaw, imposta l'overlay su `"off"`:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "off",
        },
      },
    },
  },
}
```

Puoi anche impostarlo direttamente con la CLI di configurazione:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

OpenClaw normalizza questa impostazione in modo non sensibile alle maiuscole/minuscole in fase di esecuzione, quindi valori come
`"Off"` disabilitano comunque l'overlay cordiale.

## Opzione A: chiave API OpenAI (OpenAI Platform)

**Ideale per:** accesso API diretto e fatturazione basata sul consumo.
Ottieni la tua chiave API dalla dashboard di OpenAI.

Riepilogo dei percorsi:

- `openai/gpt-5.4` = percorso API diretto di OpenAI Platform
- Richiede `OPENAI_API_KEY` (o una configurazione equivalente del provider OpenAI)
- In OpenClaw, l'accesso ChatGPT/Codex passa tramite `openai-codex/*`, non `openai/*`

### Configurazione CLI

```bash
openclaw onboard --auth-choice openai-api-key
# oppure non interattivo
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Frammento di configurazione

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

La documentazione attuale dei modelli API di OpenAI elenca `gpt-5.4` e `gpt-5.4-pro` per l'uso diretto
tramite API OpenAI. OpenClaw inoltra entrambi attraverso il percorso Responses `openai/*`.
OpenClaw sopprime intenzionalmente la riga obsoleta `openai/gpt-5.3-codex-spark`,
perché le chiamate API dirette a OpenAI la rifiutano nel traffico reale.

OpenClaw **non** espone `openai/gpt-5.3-codex-spark` nel percorso API diretto di OpenAI.
`pi-ai` include ancora una riga integrata per quel modello, ma le richieste API OpenAI reali
attualmente la rifiutano. In OpenClaw, Spark è trattato solo come Codex.

## Generazione di immagini

Il plugin `openai` incluso registra anche la generazione di immagini tramite lo strumento condiviso
`image_generate`.

- Modello di immagini predefinito: `openai/gpt-image-1`
- Generazione: fino a 4 immagini per richiesta
- Modalità modifica: abilitata, fino a 5 immagini di riferimento
- Supporta `size`
- Avvertenza specifica attuale di OpenAI: oggi OpenClaw non inoltra gli override `aspectRatio` o
  `resolution` all'API OpenAI Images

Per usare OpenAI come provider di immagini predefinito:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

Vedi [Generazione di immagini](/it/tools/image-generation) per i parametri dello strumento condiviso,
la selezione del provider e il comportamento di failover.

## Generazione di video

Il plugin `openai` incluso registra anche la generazione di video tramite lo strumento condiviso
`video_generate`.

- Modello video predefinito: `openai/sora-2`
- Modalità: text-to-video, image-to-video e flussi di riferimento/modifica con singolo video
- Limiti attuali: 1 immagine o 1 input video di riferimento
- Avvertenza specifica attuale di OpenAI: OpenClaw attualmente inoltra solo gli override `size`
  per la generazione video nativa di OpenAI. Gli override opzionali non supportati
  come `aspectRatio`, `resolution`, `audio` e `watermark` vengono ignorati
  e riportati come avviso dello strumento.

Per usare OpenAI come provider video predefinito:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openai/sora-2",
      },
    },
  },
}
```

Vedi [Generazione di video](/it/tools/video-generation) per i parametri dello strumento condiviso,
la selezione del provider e il comportamento di failover.

## Opzione B: abbonamento OpenAI Code (Codex)

**Ideale per:** usare l'accesso tramite abbonamento ChatGPT/Codex invece di una chiave API.
Codex cloud richiede l'accesso con ChatGPT, mentre la CLI di Codex supporta l'accesso con ChatGPT o chiave API.

Riepilogo dei percorsi:

- `openai-codex/gpt-5.4` = percorso OAuth ChatGPT/Codex
- Usa l'accesso ChatGPT/Codex, non una chiave API diretta di OpenAI Platform
- I limiti lato provider per `openai-codex/*` possono differire dall'esperienza web/app di ChatGPT

### Configurazione CLI (OAuth Codex)

```bash
# Esegui l'OAuth Codex nella procedura guidata
openclaw onboard --auth-choice openai-codex

# Oppure esegui direttamente l'OAuth
openclaw models auth login --provider openai-codex
```

### Frammento di configurazione (abbonamento Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

La documentazione attuale di OpenAI per Codex elenca `gpt-5.4` come modello Codex corrente. OpenClaw
lo mappa a `openai-codex/gpt-5.4` per l'uso con OAuth ChatGPT/Codex.

Questo percorso è intenzionalmente separato da `openai/gpt-5.4`. Se vuoi il
percorso API diretto di OpenAI Platform, usa `openai/*` con una chiave API. Se vuoi
l'accesso con ChatGPT/Codex, usa `openai-codex/*`.

Se l'onboarding riutilizza un accesso esistente della CLI di Codex, tali credenziali restano
gestite dalla CLI di Codex. Alla scadenza, OpenClaw rilegge prima la fonte Codex esterna
e, quando il provider può aggiornarla, riscrive la credenziale aggiornata
nell'archiviazione di Codex invece di assumerne la gestione in una copia separata solo OpenClaw.

Se il tuo account Codex ha diritto a Codex Spark, OpenClaw supporta anche:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw tratta Codex Spark come solo Codex. Non espone un percorso diretto
`openai/gpt-5.3-codex-spark` con chiave API.

OpenClaw conserva anche `openai-codex/gpt-5.3-codex-spark` quando `pi-ai`
lo rileva. Trattalo come dipendente dai diritti e sperimentale: Codex Spark è
separato da GPT-5.4 `/fast`, e la disponibilità dipende dall'account Codex /
ChatGPT connesso.

### Limite della finestra di contesto di Codex

OpenClaw tratta i metadati del modello Codex e il limite di contesto a runtime come
valori separati.

Per `openai-codex/gpt-5.4`:

- `contextWindow` nativo: `1050000`
- limite `contextTokens` predefinito a runtime: `272000`

Questo mantiene fedeli i metadati del modello preservando al tempo stesso la finestra
predefinita più piccola a runtime, che in pratica ha caratteristiche migliori di latenza e qualità.

Se vuoi un limite effettivo diverso, imposta `models.providers.<provider>.models[].contextTokens`:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

Usa `contextWindow` solo quando stai dichiarando o sovrascrivendo i metadati nativi
del modello. Usa `contextTokens` quando vuoi limitare il budget di contesto a runtime.

### Trasporto predefinito

OpenClaw usa `pi-ai` per lo streaming del modello. Per `openai/*` e
`openai-codex/*`, il trasporto predefinito è `"auto"` (prima WebSocket, poi fallback
SSE).

In modalità `"auto"`, OpenClaw ritenta anche un errore WebSocket iniziale e ripetibile
prima di passare a SSE. La modalità `"websocket"` forzata continua invece a mostrare
direttamente gli errori di trasporto invece di nasconderli dietro il fallback.

Dopo un errore WebSocket di connessione o nelle prime fasi del turno in modalità `"auto"`, OpenClaw contrassegna
il percorso WebSocket di quella sessione come degradato per circa 60 secondi e invia
i turni successivi tramite SSE durante il periodo di raffreddamento invece di oscillare
continuamente tra i trasporti.

Per gli endpoint nativi della famiglia OpenAI (`openai/*`, `openai-codex/*` e Azure
OpenAI Responses), OpenClaw allega anche uno stato stabile di identità di sessione e turno
alle richieste in modo che retry, riconnessioni e fallback SSE restino allineati alla stessa
identità di conversazione. Nei percorsi nativi della famiglia OpenAI questo include intestazioni di identità
stabili di richiesta di sessione/turno insieme a metadati di trasporto corrispondenti.

OpenClaw normalizza anche i contatori di utilizzo di OpenAI tra le varianti di trasporto prima
che raggiungano le superfici di sessione/stato. Il traffico nativo OpenAI/Codex Responses può
riportare l'utilizzo come `input_tokens` / `output_tokens` oppure
`prompt_tokens` / `completion_tokens`; OpenClaw li tratta come gli stessi contatori di input
e output per `/status`, `/usage` e i log di sessione. Quando il traffico nativo
WebSocket omette `total_tokens` (o riporta `0`), OpenClaw usa come fallback
il totale normalizzato input + output così che le visualizzazioni di sessione/stato restino popolate.

Puoi impostare `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: forza SSE
- `"websocket"`: forza WebSocket
- `"auto"`: prova WebSocket, poi passa a SSE

Per `openai/*` (API Responses), OpenClaw abilita anche per impostazione predefinita il warm-up WebSocket
(`openaiWsWarmup: true`) quando viene usato il trasporto WebSocket.

Documentazione OpenAI correlata:

- [API Realtime con WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming delle risposte API (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### Warm-up WebSocket OpenAI

La documentazione di OpenAI descrive il warm-up come facoltativo. OpenClaw lo abilita per impostazione predefinita per
`openai/*` per ridurre la latenza del primo turno quando si usa il trasporto WebSocket.

### Disabilitare il warm-up

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Abilitare esplicitamente il warm-up

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### Elaborazione prioritaria OpenAI e Codex

L'API di OpenAI espone l'elaborazione prioritaria tramite `service_tier=priority`. In
OpenClaw, imposta `agents.defaults.models["<provider>/<model>"].params.serviceTier`
per inoltrare quel campo sugli endpoint nativi OpenAI/Codex Responses.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

I valori supportati sono `auto`, `default`, `flex` e `priority`.

OpenClaw inoltra `params.serviceTier` sia alle richieste dirette `openai/*` Responses
sia alle richieste `openai-codex/*` Codex Responses quando tali modelli puntano
agli endpoint nativi OpenAI/Codex.

Comportamento importante:

- `openai/*` diretto deve puntare a `api.openai.com`
- `openai-codex/*` deve puntare a `chatgpt.com/backend-api`
- se instradi uno dei due provider tramite un altro URL di base o proxy, OpenClaw lascia `service_tier` invariato

### Modalità veloce OpenAI

OpenClaw espone un interruttore condiviso della modalità veloce sia per le sessioni `openai/*` sia per
quelle `openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Config: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Quando la modalità veloce è abilitata, OpenClaw la mappa all'elaborazione prioritaria di OpenAI:

- le chiamate dirette `openai/*` Responses a `api.openai.com` inviano `service_tier = "priority"`
- anche le chiamate `openai-codex/*` Responses a `chatgpt.com/backend-api` inviano `service_tier = "priority"`
- i valori `service_tier` già presenti nel payload vengono preservati
- la modalità veloce non riscrive `reasoning` o `text.verbosity`

Per GPT 5.4 in particolare, la configurazione più comune è:

- inviare `/fast on` in una sessione che usa `openai/gpt-5.4` o `openai-codex/gpt-5.4`
- oppure impostare `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true`
- se usi anche l'OAuth Codex, imposta anche `agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true`

Esempio:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Le sostituzioni a livello di sessione hanno la precedenza sulla configurazione. La rimozione della sostituzione della sessione nell'interfaccia Sessions UI
riporta la sessione al valore predefinito configurato.

### Percorsi OpenAI nativi rispetto ai percorsi compatibili con OpenAI

OpenClaw tratta gli endpoint diretti OpenAI, Codex e Azure OpenAI in modo diverso
dai proxy generici compatibili con OpenAI `/v1`:

- i percorsi nativi `openai/*`, `openai-codex/*` e Azure OpenAI mantengono
  `reasoning: { effort: "none" }` intatto quando disabiliti esplicitamente il ragionamento
- i percorsi nativi della famiglia OpenAI impostano per default gli schemi degli strumenti in modalità rigorosa
- le intestazioni nascoste di attribuzione di OpenClaw (`originator`, `version` e
  `User-Agent`) vengono allegate solo agli host OpenAI nativi verificati
  (`api.openai.com`) e agli host Codex nativi (`chatgpt.com/backend-api`)
- i percorsi nativi OpenAI/Codex mantengono la formattazione delle richieste specifica di OpenAI, come
  `service_tier`, `store` di Responses, payload di compatibilità del ragionamento OpenAI e
  suggerimenti per la cache del prompt
- i percorsi compatibili con OpenAI in stile proxy mantengono il comportamento di compatibilità più permissivo e non
  forzano schemi degli strumenti rigorosi, formattazione delle richieste solo nativa o intestazioni nascoste di attribuzione
  OpenAI/Codex

Azure OpenAI resta nel gruppo dei percorsi nativi per il comportamento di trasporto e compatibilità,
ma non riceve le intestazioni nascoste di attribuzione OpenAI/Codex.

Questo preserva l'attuale comportamento nativo di OpenAI Responses senza imporre shim
compatibili con OpenAI più vecchi ai backend `/v1` di terze parti.

### Modalità GPT agentica rigorosa

Per le esecuzioni GPT-5-family `openai/*` e `openai-codex/*`, OpenClaw può usare un
contratto di esecuzione Pi incorporato più rigoroso:

```json5
{
  agents: {
    defaults: {
      embeddedPi: {
        executionContract: "strict-agentic",
      },
    },
  },
}
```

Con `strict-agentic`, OpenClaw non tratta più un turno dell'assistente che contiene solo un piano come
un progresso riuscito quando è disponibile un'azione concreta tramite strumento. Ritenta il
turno con un orientamento ad agire subito, abilita automaticamente lo strumento strutturato `update_plan` per
lavori sostanziali e mostra uno stato di blocco esplicito se il modello continua
a pianificare senza agire.

La modalità è limitata alle esecuzioni GPT-5-family di OpenAI e OpenAI Codex. Gli altri provider
e le famiglie di modelli meno recenti mantengono il comportamento Pi incorporato predefinito, a meno che tu non li abiliti
esplicitamente con altre impostazioni di runtime.

### Compattazione lato server di OpenAI Responses

Per i modelli OpenAI Responses diretti (`openai/*` che usano `api: "openai-responses"` con
`baseUrl` su `api.openai.com`), OpenClaw ora abilita automaticamente i suggerimenti di payload per la compattazione lato server di OpenAI:

- Forza `store: true` (a meno che la compatibilità del modello imposti `supportsStore: false`)
- Inserisce `context_management: [{ type: "compaction", compact_threshold: ... }]`

Per impostazione predefinita, `compact_threshold` è il `70%` di `contextWindow` del modello (oppure `80000`
se non disponibile).

### Abilitare esplicitamente la compattazione lato server

Usalo quando vuoi forzare l'inserimento di `context_management` su modelli Responses compatibili (ad esempio Azure OpenAI Responses):

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Abilitare con una soglia personalizzata

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Disabilitare la compattazione lato server

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` controlla solo l'inserimento di `context_management`.
I modelli OpenAI Responses diretti continuano comunque a forzare `store: true` a meno che la compatibilità non imposti
`supportsStore: false`.

## Note

- I riferimenti ai modelli usano sempre `provider/model` (vedi [/concepts/models](/it/concepts/models)).
- I dettagli di autenticazione e le regole di riutilizzo sono in [/concepts/oauth](/it/concepts/oauth).
