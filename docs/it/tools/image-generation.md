---
read_when:
    - Generazione di immagini tramite l'agente
    - Configurazione dei provider e dei modelli di generazione immagini
    - Comprendere i parametri dello strumento `image_generate`
summary: Genera e modifica immagini usando i provider configurati (OpenAI, Google Gemini, fal, MiniMax, ComfyUI, Vydra)
title: Generazione di immagini
x-i18n:
    generated_at: "2026-04-22T04:27:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e365cd23f4f8d8c9ce88d57e65f06ac5ae5285b8b7f9ea37f0b08ab5f6ff7235
    source_path: tools/image-generation.md
    workflow: 15
---

# Generazione di immagini

Lo strumento `image_generate` consente all'agente di creare e modificare immagini usando i provider configurati. Le immagini generate vengono consegnate automaticamente come allegati multimediali nella risposta dell'agente.

<Note>
Lo strumento appare solo quando è disponibile almeno un provider di generazione immagini. Se non vedi `image_generate` tra gli strumenti dell'agente, configura `agents.defaults.imageGenerationModel` o imposta una chiave API del provider.
</Note>

## Avvio rapido

1. Imposta una chiave API per almeno un provider (ad esempio `OPENAI_API_KEY` o `GEMINI_API_KEY`).
2. Facoltativamente imposta il modello preferito:

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

3. Chiedi all'agente: _"Genera un'immagine di una simpatica mascotte aragosta."_

L'agente chiama automaticamente `image_generate`. Non è necessaria alcuna allow-list degli strumenti: è abilitato per impostazione predefinita quando è disponibile un provider.

## Provider supportati

| Provider | Modello predefinito              | Supporto modifica                   | Chiave API                                             |
| -------- | -------------------------------- | ----------------------------------- | ------------------------------------------------------ |
| OpenAI   | `gpt-image-2`                    | Sì (fino a 5 immagini)              | `OPENAI_API_KEY`                                       |
| Google   | `gemini-3.1-flash-image-preview` | Sì                                  | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                    |
| fal      | `fal-ai/flux/dev`                | Sì                                  | `FAL_KEY`                                              |
| MiniMax  | `image-01`                       | Sì (riferimento del soggetto)       | `MINIMAX_API_KEY` o OAuth MiniMax (`minimax-portal`)   |
| ComfyUI  | `workflow`                       | Sì (1 immagine, configurata dal workflow) | `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY` per cloud |
| Vydra    | `grok-imagine`                   | No                                  | `VYDRA_API_KEY`                                        |

Usa `action: "list"` per controllare i provider e i modelli disponibili a runtime:

```
/tool image_generate action=list
```

## Parametri dello strumento

| Parametro     | Tipo     | Descrizione                                                                           |
| ------------- | -------- | ------------------------------------------------------------------------------------- |
| `prompt`      | string   | Prompt di generazione immagine (obbligatorio per `action: "generate"`)                |
| `action`      | string   | `"generate"` (predefinito) oppure `"list"` per controllare i provider                 |
| `model`       | string   | Override provider/modello, ad esempio `openai/gpt-image-2`                            |
| `image`       | string   | Singolo percorso immagine di riferimento o URL per la modalità modifica               |
| `images`      | string[] | Immagini di riferimento multiple per la modalità modifica (fino a 5)                  |
| `size`        | string   | Hint dimensione: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`      |
| `aspectRatio` | string   | Rapporto d'aspetto: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9` |
| `resolution`  | string   | Hint risoluzione: `1K`, `2K` o `4K`                                                   |
| `count`       | number   | Numero di immagini da generare (1–4)                                                  |
| `filename`    | string   | Hint per il nome del file di output                                                   |

Non tutti i provider supportano tutti i parametri. Quando un provider di fallback supporta un'opzione geometrica vicina invece di quella richiesta esatta, OpenClaw rimappa alla dimensione, al rapporto d'aspetto o alla risoluzione supportati più vicini prima dell'invio. Gli override realmente non supportati vengono comunque riportati nel risultato dello strumento.

I risultati dello strumento riportano le impostazioni applicate. Quando OpenClaw rimappa la geometria durante il fallback del provider, i valori restituiti di `size`, `aspectRatio` e `resolution` riflettono ciò che è stato effettivamente inviato e `details.normalization` cattura la traduzione da richiesto ad applicato.

## Configurazione

### Selezione del modello

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### Ordine di selezione del provider

Quando genera un'immagine, OpenClaw prova i provider in questo ordine:

1. Parametro **`model`** dalla chiamata dello strumento (se l'agente ne specifica uno)
2. **`imageGenerationModel.primary`** dalla configurazione
3. **`imageGenerationModel.fallbacks`** in ordine
4. **Rilevamento automatico** — usa solo i valori predefiniti del provider supportati da autenticazione:
   - prima il provider predefinito corrente
   - poi i restanti provider di generazione immagini registrati in ordine di provider-id

Se un provider fallisce (errore auth, rate limit, ecc.), il candidato successivo viene provato automaticamente. Se falliscono tutti, l'errore include i dettagli di ogni tentativo.

Note:

- Il rilevamento automatico è consapevole dell'autenticazione. Un valore predefinito del provider entra nell'elenco dei candidati solo
  quando OpenClaw può effettivamente autenticare quel provider.
- Il rilevamento automatico è abilitato per impostazione predefinita. Imposta
  `agents.defaults.mediaGenerationAutoProviderFallback: false` se vuoi che la
  generazione di immagini usi solo le voci esplicite `model`, `primary` e `fallbacks`.
- Usa `action: "list"` per controllare i provider attualmente registrati, i loro
  modelli predefiniti e gli hint delle env var di autenticazione.

### Modifica delle immagini

OpenAI, Google, fal, MiniMax e ComfyUI supportano la modifica di immagini di riferimento. Passa un percorso o un URL di un'immagine di riferimento:

```
"Genera una versione acquerello di questa foto" + image: "/path/to/photo.jpg"
```

OpenAI e Google supportano fino a 5 immagini di riferimento tramite il parametro `images`. fal, MiniMax e ComfyUI ne supportano 1.

### OpenAI `gpt-image-2`

La generazione di immagini OpenAI usa per impostazione predefinita `openai/gpt-image-2`. Il vecchio
modello `openai/gpt-image-1` può ancora essere selezionato esplicitamente, ma le nuove richieste OpenAI
di generazione e modifica immagini dovrebbero usare `gpt-image-2`.

`gpt-image-2` supporta sia la generazione text-to-image sia la
modifica di immagini di riferimento tramite lo stesso strumento `image_generate`. OpenClaw inoltra `prompt`,
`count`, `size` e le immagini di riferimento a OpenAI. OpenAI non riceve
direttamente `aspectRatio` o `resolution`; quando possibile OpenClaw li mappa a una
`size` supportata, altrimenti lo strumento li riporta come override ignorati.

Genera un'immagine panoramica 4K:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Un poster editoriale pulito per la generazione di immagini OpenClaw" size=3840x2160 count=1
```

Genera due immagini quadrate:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Due direzioni visive per l'icona di un'app di produttività calma" size=1024x1024 count=2
```

Modifica un'immagine di riferimento locale:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Mantieni il soggetto, sostituisci lo sfondo con un allestimento da studio luminoso" image=/path/to/reference.png size=1024x1536
```

Modifica con riferimenti multipli:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combina l'identità del personaggio della prima immagine con la palette colori della seconda" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

La generazione immagini MiniMax è disponibile tramite entrambi i percorsi auth MiniMax inclusi:

- `minimax/image-01` per configurazioni con chiave API
- `minimax-portal/image-01` per configurazioni OAuth

## Capacità del provider

| Capacità              | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| Generazione           | Sì (fino a 4)        | Sì (fino a 4)        | Sì (fino a 4)       | Sì (fino a 9)              | Sì (output definiti dal workflow)  | Sì (1)  |
| Modifica/riferimento  | Sì (fino a 5 immagini) | Sì (fino a 5 immagini) | Sì (1 immagine)   | Sì (1 immagine, rif. soggetto) | Sì (1 immagine, configurata dal workflow) | No |
| Controllo dimensione  | Sì (fino a 4K)       | Sì                   | Sì                  | No                         | No                                 | No      |
| Rapporto d'aspetto    | No                   | Sì                   | Sì (solo generazione) | Sì                       | No                                 | No      |
| Risoluzione (1K/2K/4K) | No                  | Sì                   | Sì                  | No                         | No                                 | No      |

## Correlati

- [Panoramica degli strumenti](/it/tools) — tutti gli strumenti agente disponibili
- [fal](/it/providers/fal) — configurazione del provider immagini e video fal
- [ComfyUI](/it/providers/comfy) — configurazione del workflow locale ComfyUI e Comfy Cloud
- [Google (Gemini)](/it/providers/google) — configurazione del provider immagini Gemini
- [MiniMax](/it/providers/minimax) — configurazione del provider immagini MiniMax
- [OpenAI](/it/providers/openai) — configurazione del provider OpenAI Images
- [Vydra](/it/providers/vydra) — configurazione immagini, video e voce Vydra
- [Riferimento della configurazione](/it/gateway/configuration-reference#agent-defaults) — configurazione `imageGenerationModel`
- [Modelli](/it/concepts/models) — configurazione del modello e failover
