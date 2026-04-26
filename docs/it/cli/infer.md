---
read_when:
    - Aggiunta o modifica dei comandi `openclaw infer`
    - Progettazione di automazione headless stabile delle capacità
summary: CLI infer-first per flussi di lavoro con provider per modelli, immagini, audio, TTS, video, web ed embedding
title: CLI di inferenza
x-i18n:
    generated_at: "2026-04-26T11:25:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf07b306d80535b58d811aa33c0bbe2ecac57b22c3ab27f6f2ae6518ceb21e49
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` è la superficie headless canonica per i flussi di lavoro di inferenza supportati da provider.

Espone intenzionalmente famiglie di capacità, non nomi RPC grezzi del gateway e non ID grezzi degli strumenti agente.

## Trasforma infer in una Skill

Copia e incolla questo a un agente:

```text
Leggi https://docs.openclaw.ai/cli/infer, poi crea una Skill che instradi i miei flussi di lavoro comuni a `openclaw infer`.
Concentrati su esecuzioni di modelli, generazione di immagini, generazione di video, trascrizione audio, TTS, ricerca web ed embedding.
```

Una buona Skill basata su infer dovrebbe:

- mappare gli intent comuni degli utenti al sottocomando infer corretto
- includere alcuni esempi canonici di infer per i flussi di lavoro che copre
- preferire `openclaw infer ...` in esempi e suggerimenti
- evitare di ridocumentare l'intera superficie infer nel corpo della Skill

Copertura tipica di una Skill focalizzata su infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Perché usare infer

`openclaw infer` fornisce una CLI coerente per le attività di inferenza supportate da provider all'interno di OpenClaw.

Vantaggi:

- Usa i provider e i modelli già configurati in OpenClaw invece di collegare wrapper una tantum per ogni backend.
- Mantieni i flussi di lavoro di modello, immagine, trascrizione audio, TTS, video, web ed embedding sotto un unico albero di comandi.
- Usa una forma di output `--json` stabile per script, automazione e flussi di lavoro guidati da agenti.
- Preferisci una superficie OpenClaw first-party quando l'attività è fondamentalmente "eseguire inferenza".
- Usa il normale percorso locale senza richiedere il gateway per la maggior parte dei comandi infer.

Per i controlli end-to-end dei provider, preferisci `openclaw infer ...` una volta che i test dei provider a livello inferiore sono verdi. Esercita la CLI distribuita, il caricamento della configurazione, la risoluzione dell'agente predefinito, l'attivazione dei Plugin inclusi nel bundle, la riparazione delle dipendenze runtime e il runtime condiviso delle capacità prima che venga effettuata la richiesta al provider.

## Albero dei comandi

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## Attività comuni

Questa tabella mappa le attività di inferenza comuni al comando infer corrispondente.

| Attività                | Comando                                                               | Note                                                  |
| ----------------------- | --------------------------------------------------------------------- | ----------------------------------------------------- |
| Esegui un prompt testo/modello | `openclaw infer model run --prompt "..." --json`                      | Usa per impostazione predefinita il normale percorso locale |
| Genera un'immagine      | `openclaw infer image generate --prompt "..." --json`                 | Usa `image edit` quando parti da un file esistente    |
| Descrivi un file immagine | `openclaw infer image describe --file ./image.png --json`             | `--model` deve essere un `<provider/model>` capace di immagini |
| Trascrivi audio         | `openclaw infer audio transcribe --file ./memo.m4a --json`            | `--model` deve essere `<provider/model>`              |
| Sintetizza voce         | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` è orientato al gateway                   |
| Genera un video         | `openclaw infer video generate --prompt "..." --json`                 | Supporta hint del provider come `--resolution`        |
| Descrivi un file video  | `openclaw infer video describe --file ./clip.mp4 --json`              | `--model` deve essere `<provider/model>`              |
| Cerca sul web           | `openclaw infer web search --query "..." --json`                      |                                                       |
| Recupera una pagina web | `openclaw infer web fetch --url https://example.com --json`           |                                                       |
| Crea embedding          | `openclaw infer embedding create --text "..." --json`                 |                                                       |

## Comportamento

- `openclaw infer ...` è la superficie CLI primaria per questi flussi di lavoro.
- Usa `--json` quando l'output verrà consumato da un altro comando o script.
- Usa `--provider` o `--model provider/model` quando è richiesto un backend specifico.
- Per `image describe`, `audio transcribe` e `video describe`, `--model` deve usare la forma `<provider/model>`.
- Per `image describe`, un `--model` esplicito esegue direttamente quel provider/modello. Il modello deve supportare immagini nel catalogo modelli o nella configurazione del provider. `codex/<model>` esegue un turno limitato di comprensione immagini del Codex app-server; `openai-codex/<model>` usa il percorso provider OAuth OpenAI Codex.
- I comandi di esecuzione senza stato usano il locale per impostazione predefinita.
- I comandi con stato gestito dal gateway usano il gateway per impostazione predefinita.
- Il normale percorso locale non richiede che il gateway sia in esecuzione.
- `model run` è one-shot. I server MCP aperti tramite il runtime dell'agente per quel comando vengono ritirati dopo la risposta sia per l'esecuzione locale sia per quella con `--gateway`, quindi invocazioni ripetute da script non mantengono attivi processi figli stdio MCP.

## Model

Usa `model` per inferenza testuale supportata da provider e per l'ispezione di modello/provider.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Note:

- `model run` riusa il runtime dell'agente, quindi gli override provider/modello si comportano come nella normale esecuzione dell'agente.
- Poiché `model run` è pensato per l'automazione headless, non conserva i runtime MCP inclusi nel bundle per sessione dopo la fine del comando.
- `model auth login`, `model auth logout` e `model auth status` gestiscono lo stato di autenticazione del provider salvato.

## Image

Usa `image` per generazione, modifica e descrizione.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Note:

- Usa `image edit` quando parti da file di input esistenti.
- Usa `--size`, `--aspect-ratio` o `--resolution` con `image edit` per provider/modelli che supportano hint geometrici nelle modifiche con immagine di riferimento.
- Usa `--output-format png --background transparent` con `--model openai/gpt-image-1.5` per output PNG OpenAI con sfondo trasparente; `--openai-background` resta disponibile come alias specifico OpenAI. I provider che non dichiarano supporto per lo sfondo riportano l'hint come override ignorato.
- Usa `image providers --json` per verificare quali provider di immagini inclusi nel bundle sono rilevabili, configurati, selezionati e quali capacità di generazione/modifica espone ciascun provider.
- Usa `image generate --model <provider/model> --json` come smoke CLI live più ristretto per modifiche alla generazione di immagini. Esempio:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La risposta JSON riporta `ok`, `provider`, `model`, `attempts` e i percorsi di output scritti. Quando è impostato `--output`, l'estensione finale può seguire il tipo MIME restituito dal provider.

- Per `image describe`, `--model` deve essere un `<provider/model>` capace di immagini.
- Per i modelli vision Ollama locali, scarica prima il modello e imposta `OLLAMA_API_KEY` su un qualsiasi valore segnaposto, ad esempio `ollama-local`. Vedi [Ollama](/it/providers/ollama#vision-and-image-description).

## Audio

Usa `audio` per la trascrizione di file.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Note:

- `audio transcribe` serve per la trascrizione di file, non per la gestione di sessioni realtime.
- `--model` deve essere `<provider/model>`.

## TTS

Usa `tts` per la sintesi vocale e lo stato del provider TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Note:

- `tts status` usa il gateway per impostazione predefinita perché riflette lo stato TTS gestito dal gateway.
- Usa `tts providers`, `tts voices` e `tts set-provider` per ispezionare e configurare il comportamento TTS.

## Video

Usa `video` per generazione e descrizione.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Note:

- `video generate` accetta `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` e `--timeout-ms` e li inoltra al runtime di generazione video.
- `--model` deve essere `<provider/model>` per `video describe`.

## Web

Usa `web` per flussi di lavoro di ricerca e recupero.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Note:

- Usa `web providers` per ispezionare i provider disponibili, configurati e selezionati.

## Embedding

Usa `embedding` per la creazione di vettori e l'ispezione del provider di embedding.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Output JSON

I comandi infer normalizzano l'output JSON sotto un envelope condiviso:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

I campi di primo livello sono stabili:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Per i comandi di generazione media, `outputs` contiene i file scritti da OpenClaw. Usa `path`, `mimeType`, `size` ed eventuali dimensioni specifiche del media in quell'array per l'automazione invece di analizzare stdout leggibile da esseri umani.

## Errori comuni

```bash
# Bad
openclaw infer media image generate --prompt "friendly lobster"

# Good
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Bad
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Good
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Note

- `openclaw capability ...` è un alias di `openclaw infer ...`.

## Correlati

- [Riferimento CLI](/it/cli)
- [Modelli](/it/concepts/models)
