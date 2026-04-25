---
read_when:
    - Generazione di musica o audio tramite l'agente
    - Configurazione dei provider e dei modelli per la generazione musicale
    - Comprendere i parametri dello strumento `music_generate`
summary: Generare musica con provider condivisi, inclusi i Plugin supportati da workflow
title: Generazione musicale
x-i18n:
    generated_at: "2026-04-25T13:59:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe66c6dfb54c71b1d08a486c574e8a86cf3731d5339b44b9eef121f045c13cb8
    source_path: tools/music-generation.md
    workflow: 15
---

Lo strumento `music_generate` consente all'agente di creare musica o audio tramite la
capacità condivisa di generazione musicale con provider configurati come Google,
MiniMax e ComfyUI configurato tramite workflow.

Per le sessioni agente supportate da provider condivisi, OpenClaw avvia la generazione musicale come
attività in background, la traccia nel registro delle attività, quindi riattiva l'agente quando
la traccia è pronta in modo che l'agente possa pubblicare l'audio completato di nuovo nel
canale originale.

<Note>
Lo strumento condiviso integrato compare solo quando è disponibile almeno un provider di generazione musicale. Se non vedi `music_generate` negli strumenti del tuo agente, configura `agents.defaults.musicGenerationModel` o imposta una chiave API del provider.
</Note>

## Avvio rapido

### Generazione supportata da provider condivisi

1. Imposta una chiave API per almeno un provider, ad esempio `GEMINI_API_KEY` o
   `MINIMAX_API_KEY`.
2. Facoltativamente, imposta il modello preferito:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

3. Chiedi all'agente: _"Genera una traccia synthpop energica su una guida notturna
   attraverso una città al neon."_

L'agente chiama automaticamente `music_generate`. Non è necessaria alcuna allow-list degli strumenti.

Per contesti sincroni diretti senza un'esecuzione agente supportata da sessione, lo strumento integrato
usa comunque la generazione inline come fallback e restituisce il percorso finale del media nel
risultato dello strumento.

Esempi di prompt:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Generazione Comfy guidata da workflow

Il Plugin `comfy` incluso si collega allo strumento condiviso `music_generate` tramite
il registro dei provider di generazione musicale.

1. Configura `plugins.entries.comfy.config.music` con un workflow JSON e
   nodi di prompt/output.
2. Se usi Comfy Cloud, imposta `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY`.
3. Chiedi musica all'agente o richiama direttamente lo strumento.

Esempio:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Supporto condiviso dei provider inclusi

| Provider | Modello predefinito   | Input di riferimento | Controlli supportati                                      | Chiave API                             |
| -------- | --------------------- | -------------------- | --------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`            | Fino a 1 immagine    | Musica o audio definiti dal workflow                      | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Fino a 10 immagini  | `lyrics`, `instrumental`, `format`                        | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`           | Nessuno              | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY`                      |

### Matrice delle capacità dichiarate

Questo è il contratto esplicito di modalità usato da `music_generate`, dai test di contratto
e dallo sweep live condiviso.

| Provider | `generate` | `edit` | Limite modifica | Lane live condivise                                                      |
| -------- | ---------- | ------ | --------------- | ------------------------------------------------------------------------ |
| ComfyUI  | Sì         | Sì     | 1 immagine      | Non nello sweep condiviso; coperto da `extensions/comfy/comfy.live.test.ts` |
| Google   | Sì         | Sì     | 10 immagini     | `generate`, `edit`                                                       |
| MiniMax  | Sì         | No     | Nessuno         | `generate`                                                               |

Usa `action: "list"` per ispezionare i provider e i modelli condivisi disponibili
a runtime:

```text
/tool music_generate action=list
```

Usa `action: "status"` per ispezionare l'attività musicale attiva supportata dalla sessione:

```text
/tool music_generate action=status
```

Esempio di generazione diretta:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parametri dello strumento integrato

| Parametro         | Tipo     | Descrizione                                                                                         |
| ----------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt per la generazione musicale (obbligatorio per `action: "generate"`)                         |
| `action`          | string   | `"generate"` (predefinito), `"status"` per l'attività della sessione corrente, o `"list"` per ispezionare i provider |
| `model`           | string   | Override provider/modello, ad esempio `google/lyria-3-pro-preview` o `comfy/workflow`              |
| `lyrics`          | string   | Testo facoltativo del testo cantato quando il provider supporta input esplicito di lyrics          |
| `instrumental`    | boolean  | Richiede output solo strumentale quando il provider lo supporta                                     |
| `image`           | string   | Percorso o URL di una singola immagine di riferimento                                               |
| `images`          | string[] | Più immagini di riferimento (fino a 10)                                                             |
| `durationSeconds` | number   | Durata target in secondi quando il provider supporta suggerimenti sulla durata                      |
| `timeoutMs`       | number   | Timeout facoltativo della richiesta al provider in millisecondi                                     |
| `format`          | string   | Suggerimento sul formato di output (`mp3` o `wav`) quando il provider lo supporta                  |
| `filename`        | string   | Suggerimento per il nome del file di output                                                         |

Non tutti i provider supportano tutti i parametri. OpenClaw valida comunque i limiti rigidi
come il numero di input prima dell'invio. Quando un provider supporta la durata ma
usa un massimo inferiore al valore richiesto, OpenClaw limita automaticamente
al valore supportato più vicino. I suggerimenti facoltativi realmente non supportati vengono ignorati
con un avviso quando il provider o il modello selezionato non possono rispettarli.

I risultati dello strumento riportano le impostazioni applicate. Quando OpenClaw limita la durata durante il fallback del provider, il `durationSeconds` restituito riflette il valore inviato e `details.normalization.durationSeconds` mostra la mappatura da richiesto ad applicato.

## Comportamento asincrono per il percorso supportato da provider condivisi

- Esecuzioni agente supportate da sessione: `music_generate` crea un'attività in background, restituisce immediatamente una risposta started/task e pubblica la traccia completata più tardi in un messaggio di follow-up dell'agente.
- Prevenzione dei duplicati: mentre l'attività in background è ancora `queued` o `running`, le chiamate successive a `music_generate` nella stessa sessione restituiscono lo stato dell'attività invece di avviare un'altra generazione.
- Ricerca dello stato: usa `action: "status"` per ispezionare l'attività musicale attiva supportata dalla sessione senza avviare una nuova generazione.
- Tracciamento delle attività: usa `openclaw tasks list` o `openclaw tasks show <taskId>` per ispezionare lo stato queued, running e terminale della generazione.
- Risveglio al completamento: OpenClaw inietta un evento di completamento interno nella stessa sessione in modo che il modello possa scrivere autonomamente il follow-up rivolto all'utente.
- Suggerimento per il prompt: i turni successivi dell'utente/manuali nella stessa sessione ricevono un piccolo suggerimento runtime quando un'attività musicale è già in corso, così il modello non richiama ciecamente `music_generate`.
- Fallback senza sessione: i contesti diretti/locali senza una vera sessione agente continuano a essere eseguiti inline e restituiscono il risultato audio finale nello stesso turno.

### Ciclo di vita dell'attività

Ogni richiesta `music_generate` attraversa quattro stati:

1. **queued** -- attività creata, in attesa che il provider la accetti.
2. **running** -- il provider sta elaborando (in genere da 30 secondi a 3 minuti a seconda del provider e della durata).
3. **succeeded** -- traccia pronta; l'agente si riattiva e la pubblica nella conversazione.
4. **failed** -- errore del provider o timeout; l'agente si riattiva con i dettagli dell'errore.

Controlla lo stato dalla CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prevenzione dei duplicati: se un'attività musicale è già `queued` o `running` per la sessione corrente, `music_generate` restituisce lo stato dell'attività esistente invece di avviarne una nuova. Usa `action: "status"` per controllare esplicitamente senza attivare una nuova generazione.

## Configurazione

### Selezione del modello

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Ordine di selezione del provider

Quando genera musica, OpenClaw prova i provider in questo ordine:

1. parametro `model` dalla chiamata dello strumento, se l'agente ne specifica uno
2. `musicGenerationModel.primary` dalla configurazione
3. `musicGenerationModel.fallbacks` in ordine
4. rilevamento automatico usando solo i provider predefiniti supportati da auth:
   - prima il provider predefinito corrente
   - poi i restanti provider di generazione musicale registrati in ordine di id provider

Se un provider fallisce, il candidato successivo viene provato automaticamente. Se falliscono tutti, l'errore include dettagli di ogni tentativo.

Imposta `agents.defaults.mediaGenerationAutoProviderFallback: false` se vuoi che
la generazione musicale usi solo le voci esplicite `model`, `primary` e `fallbacks`.

## Note sui provider

- Google usa la generazione batch Lyria 3. Il flusso incluso attuale supporta
  prompt, testo facoltativo per `lyrics` e immagini di riferimento facoltative.
- MiniMax usa l'endpoint batch `music_generation`. Il flusso incluso attuale
  supporta prompt, `lyrics` facoltative, modalità strumentale, regolazione della durata e
  output mp3.
- Il supporto ComfyUI è guidato da workflow e dipende dal grafo configurato più
  la mappatura dei nodi per i campi prompt/output.

## Modalità di capacità del provider

Il contratto condiviso di generazione musicale ora supporta dichiarazioni esplicite delle modalità:

- `generate` per la generazione basata solo sul prompt
- `edit` quando la richiesta include una o più immagini di riferimento

Le nuove implementazioni dei provider dovrebbero preferire blocchi di modalità espliciti:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

I campi legacy flat come `maxInputImages`, `supportsLyrics` e
`supportsFormat` non sono sufficienti per dichiarare il supporto `edit`. I provider dovrebbero
dichiarare esplicitamente `generate` ed `edit` in modo che i test live, i test di contratto e
lo strumento condiviso `music_generate` possano validare in modo deterministico il supporto delle modalità.

## Scegliere il percorso giusto

- Usa il percorso supportato da provider condivisi quando vuoi selezione del modello, failover del provider e il flusso asincrono integrato task/status.
- Usa un percorso Plugin come ComfyUI quando hai bisogno di un grafo workflow personalizzato o di un provider che non fa parte della capacità musicale condivisa inclusa.
- Se stai eseguendo il debug di un comportamento specifico di ComfyUI, vedi [ComfyUI](/it/providers/comfy). Se stai eseguendo il debug del comportamento dei provider condivisi, inizia da [Google (Gemini)](/it/providers/google) o [MiniMax](/it/providers/minimax).

## Test live

Copertura live opt-in per i provider inclusi condivisi:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper del repository:

```bash
pnpm test:live:media music
```

Questo file live carica le env var provider mancanti da `~/.profile`, preferisce
per impostazione predefinita le chiavi API live/env rispetto ai profili auth memorizzati ed esegue sia
la copertura `generate` sia quella `edit` dichiarata quando il provider abilita la modalità edit.

Oggi questo significa:

- `google`: `generate` più `edit`
- `minimax`: solo `generate`
- `comfy`: copertura live Comfy separata, non nello sweep dei provider condivisi

Copertura live opt-in per il percorso musicale ComfyUI incluso:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Il file live Comfy copre anche i workflow comfy per immagini e video quando quelle
sezioni sono configurate.

## Correlati

- [Background Tasks](/it/automation/tasks) - tracciamento delle attività per esecuzioni `music_generate` scollegate
- [Configuration Reference](/it/gateway/config-agents#agent-defaults) - configurazione `musicGenerationModel`
- [ComfyUI](/it/providers/comfy)
- [Google (Gemini)](/it/providers/google)
- [MiniMax](/it/providers/minimax)
- [Models](/it/concepts/models) - configurazione del modello e failover
- [Panoramica degli strumenti](/it/tools)
