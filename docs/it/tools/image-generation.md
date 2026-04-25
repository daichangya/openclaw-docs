---
read_when:
    - Generare immagini tramite l'agente
    - Configurare provider e modelli per la generazione di immagini
    - Capire i parametri dello strumento `image_generate`
summary: Generare e modificare immagini usando provider configurati (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Generazione di immagini
x-i18n:
    generated_at: "2026-04-25T13:58:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02369928fecac147729ca586cd39e1a88791219ffe26d8e94429d0ea4b1af411
    source_path: tools/image-generation.md
    workflow: 15
---

Lo strumento `image_generate` consente all'agente di creare e modificare immagini usando i provider configurati. Le immagini generate vengono consegnate automaticamente come allegati multimediali nella risposta dell'agente.

<Note>
Lo strumento compare solo quando è disponibile almeno un provider di generazione di immagini. Se non vedi `image_generate` tra gli strumenti del tuo agente, configura `agents.defaults.imageGenerationModel`, imposta una chiave API del provider oppure esegui l'accesso con OpenAI Codex OAuth.
</Note>

## Avvio rapido

1. Imposta una chiave API per almeno un provider (per esempio `OPENAI_API_KEY`, `GEMINI_API_KEY` o `OPENROUTER_API_KEY`) oppure esegui l'accesso con OpenAI Codex OAuth.
2. Facoltativamente imposta il tuo modello preferito:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
      },
    },
  },
}
```

Codex OAuth usa lo stesso ref di modello `openai/gpt-image-2`. Quando è
configurato un profilo OAuth `openai-codex`, OpenClaw instrada le richieste di immagini
tramite quello stesso profilo OAuth invece di provare prima `OPENAI_API_KEY`.
Una configurazione immagine esplicita personalizzata di `models.providers.openai`, come una chiave API o
un base URL personalizzato/Azure, riporta invece al percorso diretto dell'API OpenAI Images.
Per endpoint LAN compatibili con OpenAI come LocalAI, mantieni il
`models.providers.openai.baseUrl` personalizzato e scegli esplicitamente di abilitarli con
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; gli endpoint
immagine privati/interni restano bloccati per impostazione predefinita.

3. Chiedi all'agente: _"Generate an image of a friendly robot mascot."_

L'agente chiama automaticamente `image_generate`. Non serve alcuna allowlist degli strumenti — è abilitato per impostazione predefinita quando è disponibile un provider.

## Percorsi comuni

| Obiettivo                                            | Ref del modello                                     | Auth                                 |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| Generazione immagini OpenAI con fatturazione API     | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                     |
| Generazione immagini OpenAI con autenticazione tramite sottoscrizione Codex | `openai/gpt-image-2`                               | OpenAI Codex OAuth                   |
| Generazione immagini OpenRouter                      | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                 |
| Generazione immagini Google Gemini                   | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` o `GOOGLE_API_KEY`  |

Lo stesso strumento `image_generate` gestisce sia text-to-image sia la
modifica tramite immagine di riferimento. Usa `image` per un riferimento o `images` per più riferimenti.
I suggerimenti di output supportati dal provider come `quality`, `outputFormat` e
`background` specifico di OpenAI vengono inoltrati quando disponibili e riportati come ignorati quando un provider non li supporta.

## Provider supportati

| Provider   | Modello predefinito                      | Supporto modifica                   | Auth                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                           | Sì (fino a 4 immagini)             | `OPENAI_API_KEY` o OpenAI Codex OAuth                 |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Sì (fino a 5 immagini di input)    | `OPENROUTER_API_KEY`                                  |
| Google     | `gemini-3.1-flash-image-preview`        | Sì                                 | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                   |
| fal        | `fal-ai/flux/dev`                       | Sì                                 | `FAL_KEY`                                             |
| MiniMax    | `image-01`                              | Sì (riferimento soggetto)          | `MINIMAX_API_KEY` o MiniMax OAuth (`minimax-portal`)  |
| ComfyUI    | `workflow`                              | Sì (1 immagine, configurato dal workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` per il cloud |
| Vydra      | `grok-imagine`                          | No                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Sì (fino a 5 immagini)             | `XAI_API_KEY`                                         |

Usa `action: "list"` per ispezionare i provider e i modelli disponibili a runtime:

```
/tool image_generate action=list
```

## Parametri dello strumento

<ParamField path="prompt" type="string" required>
Prompt per la generazione dell'immagine. Obbligatorio per `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Usa `"list"` per ispezionare provider e modelli disponibili a runtime.
</ParamField>

<ParamField path="model" type="string">
Override provider/modello, per esempio `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Percorso o URL di una singola immagine di riferimento per la modalità modifica.
</ParamField>

<ParamField path="images" type="string[]">
Più immagini di riferimento per la modalità modifica (fino a 5).
</ParamField>

<ParamField path="size" type="string">
Suggerimento di dimensione: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Aspect ratio: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Suggerimento di risoluzione.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Suggerimento di qualità quando il provider lo supporta.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Suggerimento di formato output quando il provider lo supporta.
</ParamField>

<ParamField path="count" type="number">
Numero di immagini da generare (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Timeout facoltativo della richiesta al provider in millisecondi.
</ParamField>

<ParamField path="filename" type="string">
Suggerimento per il nome del file in output.
</ParamField>

<ParamField path="openai" type="object">
Suggerimenti solo OpenAI: `background`, `moderation`, `outputCompression` e `user`.
</ParamField>

Non tutti i provider supportano tutti i parametri. Quando un provider di fallback supporta un'opzione geometrica vicina invece di quella richiesta esattamente, OpenClaw rimappa alla dimensione, all'aspect ratio o alla risoluzione supportata più vicina prima dell'invio. I suggerimenti di output non supportati come `quality` o `outputFormat` vengono eliminati per i provider che non dichiarano supporto e riportati nel risultato dello strumento.

I risultati dello strumento riportano le impostazioni applicate. Quando OpenClaw rimappa la geometria durante il fallback del provider, i valori restituiti `size`, `aspectRatio` e `resolution` riflettono ciò che è stato realmente inviato, e `details.normalization` cattura la traduzione da richiesto ad applicato.

## Configurazione

### Selezione del modello

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Ordine di selezione del provider

Quando genera un'immagine, OpenClaw prova i provider in questo ordine:

1. **Parametro `model`** dalla chiamata allo strumento (se l'agente ne specifica uno)
2. **`imageGenerationModel.primary`** dalla configurazione
3. **`imageGenerationModel.fallbacks`** in ordine
4. **Auto-rilevamento** — usa solo i predefiniti dei provider supportati dall'autenticazione:
   - prima il provider predefinito corrente
   - poi i restanti provider di generazione immagini registrati in ordine di id provider

Se un provider fallisce (errore di autenticazione, rate limit, ecc.), viene provato automaticamente il candidato configurato successivo. Se falliscono tutti, l'errore include i dettagli di ogni tentativo.

Note:

- Un override `model` per chiamata è esatto: OpenClaw prova solo quel provider/modello
  e non continua verso provider configurati come primary/fallback o provider
  auto-rilevati.
- L'auto-rilevamento è consapevole dell'autenticazione. Un provider predefinito entra nell'elenco dei candidati
  solo quando OpenClaw può effettivamente autenticare quel provider.
- L'auto-rilevamento è abilitato per impostazione predefinita. Imposta
  `agents.defaults.mediaGenerationAutoProviderFallback: false` se vuoi che la generazione immagini
  usi solo le voci esplicite `model`, `primary` e `fallbacks`.
- Usa `action: "list"` per ispezionare i provider attualmente registrati, i loro
  modelli predefiniti e i suggerimenti delle variabili env per l'autenticazione.

### Modifica delle immagini

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI e xAI supportano la modifica di immagini di riferimento. Passa un percorso o URL dell'immagine di riferimento:

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google e xAI supportano fino a 5 immagini di riferimento tramite il parametro `images`. fal, MiniMax e ComfyUI ne supportano 1.

### Modelli immagine OpenRouter

La generazione immagini OpenRouter usa la stessa `OPENROUTER_API_KEY` e instrada attraverso l'API immagini di chat completions di OpenRouter. Seleziona i modelli immagine OpenRouter con il prefisso `openrouter/`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw inoltra `prompt`, `count`, immagini di riferimento e suggerimenti `aspectRatio` / `resolution` compatibili con Gemini a OpenRouter. Le attuali scorciatoie integrate dei modelli immagine OpenRouter includono `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` e `openai/gpt-5.4-image-2`; usa `action: "list"` per vedere cosa espone il tuo Plugin configurato.

### OpenAI `gpt-image-2`

La generazione di immagini OpenAI usa come predefinito `openai/gpt-image-2`. Se è
configurato un profilo OAuth `openai-codex`, OpenClaw riusa lo stesso profilo OAuth
usato dai modelli chat con sottoscrizione Codex e invia la richiesta immagine
tramite il backend Codex Responses. I base URL legacy di Codex come
`https://chatgpt.com/backend-api` vengono canonicalizzati a
`https://chatgpt.com/backend-api/codex` per le richieste immagine. Non effettua
un fallback silenzioso a `OPENAI_API_KEY` per quella richiesta. Per forzare il percorso diretto dell'API OpenAI
Images, configura esplicitamente `models.providers.openai` con una
chiave API, base URL personalizzato o endpoint Azure. Il modello più vecchio
`openai/gpt-image-1` può ancora essere selezionato esplicitamente, ma le nuove
richieste OpenAI di generazione e modifica immagini dovrebbero usare `gpt-image-2`.

`gpt-image-2` supporta sia la generazione text-to-image sia la
modifica tramite immagini di riferimento attraverso lo stesso strumento `image_generate`. OpenClaw inoltra `prompt`,
`count`, `size`, `quality`, `outputFormat` e immagini di riferimento a OpenAI.
OpenAI non riceve direttamente `aspectRatio` o `resolution`; quando possibile
OpenClaw li mappa in un `size` supportato, altrimenti lo strumento li segnala come
override ignorati.

Le opzioni specifiche di OpenAI si trovano sotto l'oggetto `openai`:

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background` accetta `transparent`, `opaque` o `auto`; gli
output trasparenti richiedono `outputFormat` `png` o `webp`. `openai.outputCompression`
si applica agli output JPEG/WebP.

Genera un'immagine landscape 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```

Genera due immagini quadrate:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```

Modifica un'immagine di riferimento locale:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```

Modifica con più riferimenti:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Per instradare la generazione di immagini OpenAI tramite un deployment Azure OpenAI invece di `api.openai.com`, vedi [Azure OpenAI endpoints](/it/providers/openai#azure-openai-endpoints)
nella documentazione del provider OpenAI.

La generazione di immagini MiniMax è disponibile tramite entrambi i percorsi di autenticazione MiniMax inclusi:

- `minimax/image-01` per configurazioni con chiave API
- `minimax-portal/image-01` per configurazioni OAuth

## Capacità dei provider

| Capacità              | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generazione           | Sì (fino a 4)        | Sì (fino a 4)        | Sì (fino a 4)       | Sì (fino a 9)              | Sì (output definiti dal workflow)  | Sì (1)  | Sì (fino a 4)        |
| Modifica/riferimento  | Sì (fino a 5 immagini) | Sì (fino a 5 immagini) | Sì (1 immagine)   | Sì (1 immagine, riferimento soggetto) | Sì (1 immagine, configurato dal workflow) | No      | Sì (fino a 5 immagini) |
| Controllo dimensione  | Sì (fino a 4K)       | Sì                   | Sì                  | No                         | No                                 | No      | No                   |
| Aspect ratio          | No                   | Sì                   | Sì (solo generazione) | Sì                       | No                                 | No      | Sì                   |
| Risoluzione (1K/2K/4K) | No                  | Sì                   | Sì                  | No                         | No                                 | No      | Sì (1K/2K)           |

### xAI `grok-imagine-image`

Il provider xAI incluso usa `/v1/images/generations` per richieste solo prompt
e `/v1/images/edits` quando è presente `image` o `images`.

- Modelli: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Count: fino a 4
- Riferimenti: una `image` o fino a cinque `images`
- Aspect ratio: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Risoluzioni: `1K`, `2K`
- Output: restituiti come allegati immagine gestiti da OpenClaw

OpenClaw intenzionalmente non espone `quality`, `mask`, `user` o
aspect ratio extra solo nativi di xAI finché questi controlli non esisteranno nel contratto condiviso cross-provider di `image_generate`.

## Correlati

- [Panoramica degli strumenti](/it/tools) — tutti gli strumenti agente disponibili
- [fal](/it/providers/fal) — configurazione del provider immagini e video fal
- [ComfyUI](/it/providers/comfy) — configurazione del workflow locale ComfyUI e Comfy Cloud
- [Google (Gemini)](/it/providers/google) — configurazione del provider immagini Gemini
- [MiniMax](/it/providers/minimax) — configurazione del provider immagini MiniMax
- [OpenAI](/it/providers/openai) — configurazione del provider OpenAI Images
- [Vydra](/it/providers/vydra) — configurazione di immagini, video e speech Vydra
- [xAI](/it/providers/xai) — configurazione di immagini, video, ricerca, esecuzione di codice e TTS Grok
- [Riferimento configurazione](/it/gateway/config-agents#agent-defaults) — configurazione `imageGenerationModel`
- [Models](/it/concepts/models) — configurazione dei modelli e failover
