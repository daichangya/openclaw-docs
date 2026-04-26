---
read_when:
    - Ottimizzazione delle impostazioni predefinite degli agenti (modelli, thinking, workspace, Heartbeat, media, Skills)
    - Configurazione dell'instradamento e delle associazioni multi-agente
    - Regolazione del comportamento di sessione, recapito dei messaggi e modalità talk
summary: Impostazioni predefinite degli agenti, instradamento multi-agente, sessione, messaggi e configurazione talk
title: Configurazione — agenti
x-i18n:
    generated_at: "2026-04-26T11:28:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e99e1548c708e62156b3743028eaa5ee705b5f4967bffdab59c3cb342dfa724
    source_path: gateway/config-agents.md
    workflow: 15
---

Chiavi di configurazione con scope agente sotto `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` e `talk.*`. Per canali, strumenti, runtime Gateway e altre
chiavi di primo livello, vedi [Riferimento configurazione](/it/gateway/configuration-reference).

## Impostazioni predefinite degli agenti

### `agents.defaults.workspace`

Predefinito: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Root del repository facoltativa mostrata nella riga Runtime del prompt di sistema. Se non impostata, OpenClaw la rileva automaticamente risalendo dal workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Allowlist predefinita facoltativa di Skills per gli agenti che non impostano
`agents.list[].skills`.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // eredita github, weather
      { id: "docs", skills: ["docs-search"] }, // sostituisce i predefiniti
      { id: "locked-down", skills: [] }, // nessuna Skills
    ],
  },
}
```

- Ometti `agents.defaults.skills` per Skills senza restrizioni per impostazione predefinita.
- Ometti `agents.list[].skills` per ereditare i valori predefiniti.
- Imposta `agents.list[].skills: []` per nessuna Skills.
- Un elenco non vuoto `agents.list[].skills` è l'insieme finale per quell'agente; non
  viene unito ai valori predefiniti.

### `agents.defaults.skipBootstrap`

Disabilita la creazione automatica dei file bootstrap del workspace (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Controlla quando i file bootstrap del workspace vengono iniettati nel prompt di sistema. Predefinito: `"always"`.

- `"continuation-skip"`: i turni di continuazione sicuri (dopo una risposta assistente completata) saltano la reiniezione del bootstrap del workspace, riducendo la dimensione del prompt. Le esecuzioni Heartbeat e i retry post-Compaction ricostruiscono comunque il contesto.
- `"never"`: disabilita l'iniezione del bootstrap del workspace e dei file di contesto a ogni turno. Usalo solo per agenti che gestiscono interamente il proprio ciclo di vita del prompt (motori di contesto personalizzati, runtime nativi che costruiscono da soli il proprio contesto o flussi di lavoro specializzati senza bootstrap). Anche i turni Heartbeat e di recupero da Compaction saltano l'iniezione.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Numero massimo di caratteri per file bootstrap del workspace prima del troncamento. Predefinito: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Numero massimo totale di caratteri iniettati in tutti i file bootstrap del workspace. Predefinito: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Controlla il testo di avviso visibile all'agente quando il contesto bootstrap viene troncato.
Predefinito: `"once"`.

- `"off"`: non iniettare mai testo di avviso nel prompt di sistema.
- `"once"`: inietta l'avviso una volta per ogni firma di troncamento univoca (consigliato).
- `"always"`: inietta l'avviso a ogni esecuzione quando esiste un troncamento.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Mappa di proprietà del budget di contesto

OpenClaw ha più budget di prompt/contesto ad alto volume e sono
intenzionalmente suddivisi per sottosistema invece di fluire tutti attraverso
un'unica manopola generica.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale iniezione bootstrap del workspace.
- `agents.defaults.startupContext.*`:
  preludio di avvio one-shot di `/new` e `/reset`, inclusi i recenti file
  giornalieri `memory/*.md`.
- `skills.limits.*`:
  l'elenco compatto di Skills iniettato nel prompt di sistema.
- `agents.defaults.contextLimits.*`:
  estratti di runtime limitati e blocchi iniettati di proprietà del runtime.
- `memory.qmd.limits.*`:
  dimensionamento dello snippet di ricerca memory indicizzato e dell'iniezione.

Usa l'override per agente corrispondente solo quando un agente necessita di un
budget diverso:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Controlla il preludio di contesto del primo turno iniettato nelle esecuzioni
nude `/new` e `/reset`.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Valori predefiniti condivisi per le superfici di contesto runtime limitate.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: limite predefinito dell'estratto `memory_get` prima che vengano aggiunti i
  metadati di troncamento e l'avviso di continuazione.
- `memoryGetDefaultLines`: finestra di righe predefinita di `memory_get` quando `lines` è
  omesso.
- `toolResultMaxChars`: limite del risultato dello strumento live usato per i risultati persistiti e
  il recupero da overflow.
- `postCompactionMaxChars`: limite dell'estratto AGENTS.md usato durante l'iniezione di aggiornamento
  post-Compaction.

#### `agents.list[].contextLimits`

Override per agente per le manopole condivise `contextLimits`. I campi omessi ereditano
da `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Limite globale per l'elenco compatto di Skills iniettato nel prompt di sistema. Questo
non influisce sulla lettura dei file `SKILL.md` su richiesta.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Override per agente per il budget del prompt delle Skills.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Dimensione massima in pixel del lato più lungo dell'immagine nei blocchi immagine di transcript/strumento prima delle chiamate al provider.
Predefinito: `1200`.

Valori più bassi di solito riducono l'uso di vision-token e la dimensione del payload della richiesta nelle esecuzioni ricche di screenshot.
Valori più alti preservano più dettaglio visivo.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Fuso orario per il contesto del prompt di sistema (non per i timestamp dei messaggi). Usa come fallback il fuso orario dell'host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Formato orario nel prompt di sistema. Predefinito: `auto` (preferenza del sistema operativo).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // parametri provider predefiniti globali
      agentRuntime: {
        id: "pi", // pi | auto | id harness registrato, ad esempio codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - La forma stringa imposta solo il modello primary.
  - La forma oggetto imposta il primary più i modelli di failover ordinati.
- `imageModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dal percorso dello strumento `image` come configurazione del suo modello vision.
  - Usato anche come instradamento di fallback quando il modello selezionato/predefinito non può accettare input immagine.
- `imageGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione immagini e da qualsiasi futura superficie tool/plugin che generi immagini.
  - Valori tipici: `google/gemini-3.1-flash-image-preview` per la generazione immagini nativa Gemini, `fal/fal-ai/flux/dev` per fal, `openai/gpt-image-2` per OpenAI Images, oppure `openai/gpt-image-1.5` per output OpenAI PNG/WebP con sfondo trasparente.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione provider corrispondente (ad esempio `GEMINI_API_KEY` o `GOOGLE_API_KEY` per `google/*`, `OPENAI_API_KEY` o OAuth OpenAI Codex per `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` per `fal/*`).
  - Se omesso, `image_generate` può comunque dedurre un provider predefinito supportato dall'autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione immagini registrati in ordine di id provider.
- `musicGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione musicale e dallo strumento incorporato `music_generate`.
  - Valori tipici: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` o `minimax/music-2.6`.
  - Se omesso, `music_generate` può comunque dedurre un provider predefinito supportato dall'autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione musicale registrati in ordine di id provider.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione/chiave API del provider corrispondente.
- `videoGenerationModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dalla capacità condivisa di generazione video e dallo strumento incorporato `video_generate`.
  - Valori tipici: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` o `qwen/wan2.7-r2v`.
  - Se omesso, `video_generate` può comunque dedurre un provider predefinito supportato dall'autenticazione. Prova prima il provider predefinito corrente, poi i restanti provider di generazione video registrati in ordine di id provider.
  - Se selezioni direttamente un provider/modello, configura anche l'autenticazione/chiave API del provider corrispondente.
  - Il provider incluso di generazione video Qwen supporta fino a 1 video di output, 1 immagine di input, 4 video di input, durata di 10 secondi e opzioni a livello provider `size`, `aspectRatio`, `resolution`, `audio` e `watermark`.
- `pdfModel`: accetta una stringa (`"provider/model"`) oppure un oggetto (`{ primary, fallbacks }`).
  - Usato dallo strumento `pdf` per l'instradamento del modello.
  - Se omesso, lo strumento PDF usa come fallback `imageModel`, poi il modello di sessione/predefinito risolto.
- `pdfMaxBytesMb`: limite di dimensione PDF predefinito per lo strumento `pdf` quando `maxBytesMb` non viene passato al momento della chiamata.
- `pdfMaxPages`: numero massimo di pagine considerato dalla modalità fallback di estrazione nello strumento `pdf`.
- `verboseDefault`: livello verbose predefinito per gli agenti. Valori: `"off"`, `"on"`, `"full"`. Predefinito: `"off"`.
- `elevatedDefault`: livello predefinito di output elevato per gli agenti. Valori: `"off"`, `"on"`, `"ask"`, `"full"`. Predefinito: `"on"`.
- `model.primary`: formato `provider/model` (ad esempio `openai/gpt-5.5` per accesso con chiave API oppure `openai-codex/gpt-5.5` per OAuth Codex). Se ometti il provider, OpenClaw prova prima un alias, poi una corrispondenza univoca con provider configurato per quell'esatto id modello e solo dopo usa come fallback il provider predefinito configurato (comportamento di compatibilità deprecato, quindi preferisci `provider/model` esplicito). Se quel provider non espone più il modello predefinito configurato, OpenClaw usa come fallback il primo provider/modello configurato invece di esporre un valore predefinito obsoleto di un provider rimosso.
- `models`: il catalogo modelli configurato e la allowlist per `/model`. Ogni voce può includere `alias` (scorciatoia) e `params` (specifici del provider, ad esempio `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`).
  - Modifiche sicure: usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` per aggiungere voci. `config set` rifiuta sostituzioni che rimuoverebbero voci esistenti della allowlist a meno che tu non passi `--replace`.
  - I flussi di configurazione/onboarding con scope provider uniscono in questa mappa i modelli del provider selezionato e preservano i provider non correlati già configurati.
  - Per i modelli diretti OpenAI Responses, la Compaction lato server è abilitata automaticamente. Usa `params.responsesServerCompaction: false` per interrompere l'iniezione di `context_management`, oppure `params.responsesCompactThreshold` per sovrascrivere la soglia. Vedi [Compaction lato server OpenAI](/it/providers/openai#server-side-compaction-responses-api).
- `params`: parametri provider predefiniti globali applicati a tutti i modelli. Impostati in `agents.defaults.params` (ad esempio `{ cacheRetention: "long" }`).
- Precedenza di unione di `params` (configurazione): `agents.defaults.params` (base globale) viene sovrascritto da `agents.defaults.models["provider/model"].params` (per modello), poi `agents.list[].params` (id agente corrispondente) sovrascrive per chiave. Vedi [Caching dei prompt](/it/reference/prompt-caching) per i dettagli.
- `params.extra_body`/`params.extraBody`: JSON avanzato pass-through unito nei corpi della richiesta `api: "openai-completions"` per proxy compatibili con OpenAI. Se entra in collisione con chiavi di richiesta generate, l'extra body prevale; i percorsi completions non nativi continuano comunque a rimuovere dopo l'unione l'elemento OpenAI-only `store`.
- `params.chat_template_kwargs`: argomenti di chat template compatibili con vLLM/OpenAI uniti nei corpi di richiesta di primo livello `api: "openai-completions"`. Per `vllm/nemotron-3-*` con thinking disattivato, OpenClaw invia automaticamente `enable_thinking: false` e `force_nonempty_content: true`; `chat_template_kwargs` espliciti sovrascrivono questi valori predefiniti, e `extra_body.chat_template_kwargs` mantiene comunque la precedenza finale.
- `params.preserveThinking`: opt-in solo Z.AI per il thinking preservato. Quando abilitato e il thinking è attivo, OpenClaw invia `thinking.clear_thinking: false` e ripropone `reasoning_content` precedente; vedi [Thinking Z.AI e thinking preservato](/it/providers/zai#thinking-and-preserved-thinking).
- `agentRuntime`: policy runtime dell'agente di basso livello predefinita. Se l'id è omesso, il valore predefinito è OpenClaw Pi. Usa `id: "pi"` per forzare l'harness PI incorporato, `id: "auto"` per lasciare che harness plugin registrati rivendichino i modelli supportati, un id harness registrato come `id: "codex"` oppure un alias di backend CLI supportato come `id: "claude-cli"`. Imposta `fallback: "none"` per disabilitare il fallback automatico a PI. I runtime di plugin espliciti come `codex` falliscono in modalità fail-closed per impostazione predefinita, a meno che tu non imposti `fallback: "pi"` nello stesso scope di override. Mantieni i riferimenti ai modelli canonici come `provider/model`; seleziona Codex, Claude CLI, Gemini CLI e altri backend di esecuzione tramite la configurazione runtime invece dei prefissi legacy del provider runtime. Vedi [Runtime degli agenti](/it/concepts/agent-runtimes) per capire in cosa differisce dalla selezione provider/modello.
- I writer di configurazione che modificano questi campi (ad esempio `/models set`, `/models set-image` e i comandi add/remove di fallback) salvano la forma oggetto canonica e preservano gli elenchi di fallback esistenti quando possibile.
- `maxConcurrent`: numero massimo di esecuzioni parallele di agenti tra le sessioni (ogni sessione resta comunque serializzata). Predefinito: 4.

### `agents.defaults.agentRuntime`

`agentRuntime` controlla quale esecutore di basso livello esegue i turni agente. La maggior
parte delle installazioni dovrebbe mantenere il runtime OpenClaw Pi predefinito. Usalo quando un plugin
affidabile fornisce un harness nativo, come l'harness app-server Codex incluso,
oppure quando vuoi un backend CLI supportato come Claude CLI. Per il modello
concettuale, vedi [Runtime degli agenti](/it/concepts/agent-runtimes).

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, un id harness plugin registrato o un alias backend CLI supportato. Il plugin Codex incluso registra `codex`; il plugin Anthropic incluso fornisce il backend CLI `claude-cli`.
- `fallback`: `"pi"` o `"none"`. In `id: "auto"`, il fallback omesso ha come valore predefinito `"pi"` così le vecchie configurazioni possono continuare a usare PI quando nessun harness plugin gestisce un'esecuzione. Nella modalità runtime di plugin esplicita, come `id: "codex"`, il fallback omesso ha come valore predefinito `"none"` così un harness mancante fallisce invece di usare silenziosamente PI. Gli override del runtime non ereditano il fallback da uno scope più ampio; imposta `fallback: "pi"` insieme al runtime esplicito quando vuoi intenzionalmente quel fallback di compatibilità. I fallimenti dell'harness plugin selezionato vengono sempre esposti direttamente.
- Override di ambiente: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` sovrascrive `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` sovrascrive il fallback per quel processo.
- Per installazioni solo Codex, imposta `model: "openai/gpt-5.5"` e `agentRuntime.id: "codex"`. Puoi anche impostare esplicitamente `agentRuntime.fallback: "none"` per leggibilità; è il valore predefinito per i runtime plugin espliciti.
- Per installazioni Claude CLI, preferisci `model: "anthropic/claude-opus-4-7"` più `agentRuntime.id: "claude-cli"`. I riferimenti modello legacy `claude-cli/claude-opus-4-7` continuano a funzionare per compatibilità, ma la nuova configurazione dovrebbe mantenere canonica la selezione provider/modello e mettere il backend di esecuzione in `agentRuntime.id`.
- Le chiavi più vecchie della policy runtime vengono riscritte in `agentRuntime` da `openclaw doctor --fix`.
- La scelta dell'harness viene fissata per id sessione dopo la prima esecuzione incorporata. I cambi di configurazione/env influenzano le sessioni nuove o reimpostate, non un transcript esistente. Le sessioni legacy con cronologia transcript ma senza un pin registrato vengono trattate come fissate su PI. `/status` riporta il runtime effettivo, ad esempio `Runtime: OpenClaw Pi Default` o `Runtime: OpenAI Codex`.
- Questo controlla solo l'esecuzione dei turni testuali dell'agente. Generazione media, vision, PDF, musica, video e TTS continuano a usare le rispettive impostazioni provider/modello.

**Alias shorthand incorporati** (si applicano solo quando il modello si trova in `agents.defaults.models`):

| Alias               | Modello                                   |
| ------------------- | ----------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`               |
| `sonnet`            | `anthropic/claude-sonnet-4-6`             |
| `gpt`               | `openai/gpt-5.5` o `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                     |
| `gpt-nano`          | `openai/gpt-5.4-nano`                     |
| `gemini`            | `google/gemini-3.1-pro-preview`           |
| `gemini-flash`      | `google/gemini-3-flash-preview`           |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`    |

Gli alias configurati da te hanno sempre la precedenza su quelli predefiniti.

I modelli Z.AI GLM-4.x abilitano automaticamente la modalità thinking a meno che tu non imposti `--thinking off` o definisca tu stesso `agents.defaults.models["zai/<model>"].params.thinking`.
I modelli Z.AI abilitano `tool_stream` per impostazione predefinita per lo streaming delle chiamate agli strumenti. Imposta `agents.defaults.models["zai/<model>"].params.tool_stream` su `false` per disabilitarlo.
I modelli Anthropic Claude 4.6 usano `adaptive` come thinking predefinito quando non è impostato alcun livello di thinking esplicito.

### `agents.defaults.cliBackends`

Backend CLI facoltativi per esecuzioni di fallback solo testo (senza chiamate agli strumenti). Utili come backup quando i provider API falliscono.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // Oppure usa systemPromptFileArg quando la CLI accetta un flag per il file del prompt.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- I backend CLI sono orientati prima di tutto al testo; gli strumenti sono sempre disabilitati.
- Le sessioni sono supportate quando è impostato `sessionArg`.
- Il pass-through delle immagini è supportato quando `imageArg` accetta percorsi di file.

### `agents.defaults.systemPromptOverride`

Sostituisce l'intero prompt di sistema assemblato da OpenClaw con una stringa fissa. Impostalo al livello predefinito (`agents.defaults.systemPromptOverride`) o per agente (`agents.list[].systemPromptOverride`). I valori per agente hanno la precedenza; un valore vuoto o contenente solo spazi viene ignorato. Utile per esperimenti controllati sul prompt.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

Overlay di prompt indipendenti dal provider applicati per famiglia di modelli. Gli id modello della famiglia GPT-5 ricevono il contratto di comportamento condiviso tra provider; `personality` controlla solo il layer di stile d'interazione amichevole.

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (predefinito) e `"on"` abilitano il layer di stile d'interazione amichevole.
- `"off"` disabilita solo il layer amichevole; il contratto di comportamento GPT-5 taggato resta abilitato.
- Il valore legacy `plugins.entries.openai.config.personality` continua a essere letto quando questa impostazione condivisa non è impostata.

### `agents.defaults.heartbeat`

Esecuzioni periodiche Heartbeat.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disabilita
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // predefinito: true; false omette la sezione Heartbeat dal prompt di sistema
        lightContext: false, // predefinito: false; true mantiene solo HEARTBEAT.md tra i file bootstrap del workspace
        isolatedSession: false, // predefinito: false; true esegue ogni heartbeat in una sessione nuova (senza cronologia conversazione)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (predefinito) | block
        target: "none", // predefinito: none | opzioni: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: stringa di durata (ms/s/m/h). Predefinito: `30m` (autenticazione con chiave API) oppure `1h` (autenticazione OAuth). Imposta `0m` per disabilitare.
- `includeSystemPromptSection`: quando false, omette la sezione Heartbeat dal prompt di sistema e salta l'iniezione di `HEARTBEAT.md` nel contesto bootstrap. Predefinito: `true`.
- `suppressToolErrorWarnings`: quando true, sopprime i payload di avviso errore degli strumenti durante le esecuzioni Heartbeat.
- `timeoutSeconds`: tempo massimo in secondi consentito per un turno agente Heartbeat prima che venga interrotto. Lascialo non impostato per usare `agents.defaults.timeoutSeconds`.
- `directPolicy`: policy di recapito diretto/DM. `allow` (predefinito) consente il recapito diretto alla destinazione. `block` sopprime il recapito diretto alla destinazione ed emette `reason=dm-blocked`.
- `lightContext`: quando true, le esecuzioni Heartbeat usano un contesto bootstrap leggero e mantengono solo `HEARTBEAT.md` tra i file bootstrap del workspace.
- `isolatedSession`: quando true, ogni Heartbeat viene eseguito in una sessione nuova senza cronologia di conversazione precedente. Stesso schema di isolamento di Cron `sessionTarget: "isolated"`. Riduce il costo di token per Heartbeat da ~100K a ~2-5K token.
- Per agente: imposta `agents.list[].heartbeat`. Quando qualunque agente definisce `heartbeat`, **solo quegli agenti** eseguono heartbeat.
- Gli Heartbeat eseguono turni agente completi — intervalli più brevi consumano più token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id di un plugin provider di Compaction registrato (facoltativo)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // usato quando identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disabilita la reiniezione
        model: "openrouter/anthropic/claude-sonnet-4-6", // override facoltativo del modello solo per Compaction
        notifyUser: true, // invia brevi avvisi all'utente quando la Compaction inizia e termina (predefinito: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` oppure `safeguard` (riassunto a blocchi per cronologie lunghe). Vedi [Compaction](/it/concepts/compaction).
- `provider`: id di un plugin provider di Compaction registrato. Quando impostato, viene chiamato `summarize()` del provider invece del riassunto LLM incorporato. In caso di errore usa il comportamento incorporato come fallback. Impostare un provider forza `mode: "safeguard"`. Vedi [Compaction](/it/concepts/compaction).
- `timeoutSeconds`: numero massimo di secondi consentiti per una singola operazione di Compaction prima che OpenClaw la interrompa. Predefinito: `900`.
- `keepRecentTokens`: budget del punto di taglio Pi per mantenere verbatim la coda più recente del transcript. Il comando manuale `/compact` lo rispetta quando è impostato esplicitamente; altrimenti la Compaction manuale è un checkpoint rigido.
- `identifierPolicy`: `strict` (predefinito), `off` oppure `custom`. `strict` antepone le istruzioni incorporate per la conservazione di identificatori opachi durante il riassunto della Compaction.
- `identifierInstructions`: testo facoltativo personalizzato per la conservazione degli identificatori usato quando `identifierPolicy=custom`.
- `qualityGuard`: controlli di retry su output malformato per i riepiloghi safeguard. Abilitato per impostazione predefinita in modalità safeguard; imposta `enabled: false` per saltare l'audit.
- `postCompactionSections`: nomi facoltativi di sezioni AGENTS.md H2/H3 da reiniettare dopo la Compaction. Il valore predefinito è `["Session Startup", "Red Lines"]`; imposta `[]` per disabilitare la reiniezione. Quando non è impostato o è impostato esplicitamente su quella coppia predefinita, vengono accettate anche le vecchie intestazioni `Every Session`/`Safety` come fallback legacy.
- `model`: override facoltativo `provider/model-id` solo per il riassunto della Compaction. Usalo quando la sessione principale deve mantenere un modello ma i riepiloghi di Compaction devono essere eseguiti con un altro; quando non è impostato, Compaction usa il modello primary della sessione.
- `notifyUser`: quando `true`, invia brevi avvisi all'utente quando la Compaction inizia e quando termina (ad esempio "Compacting context..." e "Compaction complete"). Disabilitato per impostazione predefinita per mantenere silenziosa la Compaction.
- `memoryFlush`: turno agentico silenzioso prima della Compaction automatica per memorizzare memorie persistenti. Saltato quando il workspace è di sola lettura.

### `agents.defaults.contextPruning`

Pota i **vecchi risultati degli strumenti** dal contesto in memoria prima dell'invio all'LLM. **Non** modifica la cronologia della sessione su disco.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // durata (ms/s/m/h), unità predefinita: minuti
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Comportamento della modalità cache-ttl">

- `mode: "cache-ttl"` abilita i passaggi di potatura.
- `ttl` controlla ogni quanto la potatura può essere eseguita di nuovo (dopo l'ultimo tocco della cache).
- La potatura esegue prima un soft-trim dei risultati degli strumenti troppo grandi, poi un hard-clear dei risultati degli strumenti più vecchi se necessario.

**Soft-trim** mantiene l'inizio + la fine e inserisce `...` nel mezzo.

**Hard-clear** sostituisce l'intero risultato dello strumento con il segnaposto.

Note:

- I blocchi immagine non vengono mai troncati/cancellati.
- I rapporti sono basati sui caratteri (approssimativi), non su conteggi esatti di token.
- Se esistono meno di `keepLastAssistants` messaggi assistente, la potatura viene saltata.

</Accordion>

Vedi [Potatura della sessione](/it/concepts/session-pruning) per i dettagli del comportamento.

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (usa minMs/maxMs)
    },
  },
}
```

- I canali non Telegram richiedono `*.blockStreaming: true` esplicito per abilitare le risposte a blocchi.
- Override per canale: `channels.<channel>.blockStreamingCoalesce` (e varianti per account). Signal/Slack/Discord/Google Chat usano come predefinito `minChars: 1500`.
- `humanDelay`: pausa casuale tra risposte a blocchi. `natural` = 800–2500 ms. Override per agente: `agents.list[].humanDelay`.

Vedi [Streaming](/it/concepts/streaming) per dettagli su comportamento + chunking.

### Indicatori di digitazione

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Valori predefiniti: `instant` per chat dirette/menzioni, `message` per chat di gruppo senza menzione.
- Override per sessione: `session.typingMode`, `session.typingIntervalSeconds`.

Vedi [Indicatori di digitazione](/it/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing facoltativo per l'agente incorporato. Vedi [Sandboxing](/it/gateway/sandboxing) per la guida completa.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // Sono supportati anche SecretRef / contenuti inline:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Dettagli del sandbox">

**Backend:**

- `docker`: runtime Docker locale (predefinito)
- `ssh`: runtime remoto generico basato su SSH
- `openshell`: runtime OpenShell

Quando è selezionato `backend: "openshell"`, le impostazioni specifiche del runtime vengono spostate in
`plugins.entries.openshell.config`.

**Configurazione backend SSH:**

- `target`: destinazione SSH nel formato `user@host[:port]`
- `command`: comando del client SSH (predefinito: `ssh`)
- `workspaceRoot`: root remota assoluta usata per i workspace per scope
- `identityFile` / `certificateFile` / `knownHostsFile`: file locali esistenti passati a OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: contenuti inline o SecretRef che OpenClaw materializza in file temporanei a runtime
- `strictHostKeyChecking` / `updateHostKeys`: manopole della policy delle chiavi host OpenSSH

**Precedenza dell'autenticazione SSH:**

- `identityData` ha la precedenza su `identityFile`
- `certificateData` ha la precedenza su `certificateFile`
- `knownHostsData` ha la precedenza su `knownHostsFile`
- I valori `*Data` supportati da SecretRef vengono risolti dallo snapshot runtime attivo dei segreti prima dell'avvio della sessione sandbox

**Comportamento del backend SSH:**

- inizializza il workspace remoto una volta dopo create o recreate
- poi mantiene canonico il workspace SSH remoto
- instrada `exec`, gli strumenti sui file e i percorsi media tramite SSH
- non sincronizza automaticamente sull'host le modifiche remote
- non supporta contenitori browser sandbox

**Accesso al workspace:**

- `none`: workspace sandbox per scope sotto `~/.openclaw/sandboxes`
- `ro`: workspace sandbox in `/workspace`, workspace agente montato in sola lettura in `/agent`
- `rw`: workspace agente montato in lettura/scrittura in `/workspace`

**Scope:**

- `session`: contenitore + workspace per sessione
- `agent`: un contenitore + workspace per agente (predefinito)
- `shared`: contenitore e workspace condivisi (nessun isolamento tra sessioni)

**Configurazione Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // facoltativo
          gatewayEndpoint: "https://lab.example", // facoltativo
          policy: "strict", // id di policy OpenShell facoltativo
          providers: ["openai"], // facoltativo
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**Modalità OpenShell:**

- `mirror`: inizializza il remoto dal locale prima di exec, sincronizza di nuovo dopo exec; il workspace locale resta canonico
- `remote`: inizializza il remoto una volta quando viene creato il sandbox, poi mantiene canonico il workspace remoto

In modalità `remote`, le modifiche locali sull'host fatte al di fuori di OpenClaw non vengono sincronizzate automaticamente nel sandbox dopo il passaggio di inizializzazione.
Il trasporto avviene tramite SSH nel sandbox OpenShell, ma il Plugin possiede il ciclo di vita del sandbox e l'eventuale sincronizzazione mirror.

**`setupCommand`** viene eseguito una volta dopo la creazione del contenitore (tramite `sh -lc`). Richiede egress di rete, root scrivibile e utente root.

**I contenitori usano per impostazione predefinita `network: "none"`** — imposta `"bridge"` (o una rete bridge personalizzata) se l'agente ha bisogno di accesso in uscita.
`"host"` è bloccato. `"container:<id>"` è bloccato per impostazione predefinita a meno che tu non imposti esplicitamente
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass).

**Gli allegati in ingresso** vengono messi in staging in `media/inbound/*` nel workspace attivo.

**`docker.binds`** monta directory host aggiuntive; i bind globali e per agente vengono uniti.

**Browser sandbox** (`sandbox.browser.enabled`): Chromium + CDP in un contenitore. L'URL noVNC viene iniettato nel prompt di sistema. Non richiede `browser.enabled` in `openclaw.json`.
L'accesso osservatore noVNC usa per impostazione predefinita l'autenticazione VNC e OpenClaw emette un URL con token a breve durata (invece di esporre la password nell'URL condiviso).

- `allowHostControl: false` (predefinito) blocca le sessioni sandbox dal prendere come destinazione il browser host.
- `network` usa come predefinito `openclaw-sandbox-browser` (rete bridge dedicata). Impostalo su `bridge` solo quando vuoi esplicitamente connettività bridge globale.
- `cdpSourceRange` limita facoltativamente l'ingresso CDP al bordo del contenitore a un intervallo CIDR (ad esempio `172.21.0.1/32`).
- `sandbox.browser.binds` monta directory host aggiuntive solo nel contenitore del browser sandbox. Quando è impostato (incluso `[]`), sostituisce `docker.binds` per il contenitore browser.
- I valori predefiniti di avvio sono definiti in `scripts/sandbox-browser-entrypoint.sh` e ottimizzati per host container:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (abilitato per impostazione predefinita)
  - `--disable-3d-apis`, `--disable-software-rasterizer` e `--disable-gpu` sono
    abilitati per impostazione predefinita e possono essere disabilitati con
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` se l'uso di WebGL/3D lo richiede.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` riabilita le estensioni se il tuo flusso di lavoro
    dipende da esse.
  - `--renderer-process-limit=2` può essere modificato con
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; imposta `0` per usare il
    limite di processi predefinito di Chromium.
  - più `--no-sandbox` quando `noSandbox` è abilitato.
  - I valori predefiniti sono la baseline dell'immagine del contenitore; usa un'immagine browser personalizzata con un entrypoint personalizzato per cambiare i valori predefiniti del contenitore.

</Accordion>

Il sandboxing del browser e `sandbox.docker.binds` sono solo per Docker.

Costruisci le immagini:

```bash
scripts/sandbox-setup.sh           # immagine sandbox principale
scripts/sandbox-browser-setup.sh   # immagine browser facoltativa
```

### `agents.list` (override per agente)

Usa `agents.list[].tts` per assegnare a un agente il proprio provider TTS, voce, modello,
stile o modalità TTS automatica. Il blocco agente esegue un deep-merge su
`messages.tts` globale, quindi le credenziali condivise possono restare in un solo posto mentre i singoli
agenti sovrascrivono solo i campi voce o provider di cui hanno bisogno. L'override
dell'agente attivo si applica alle risposte vocali automatiche, `/tts audio`, `/tts status` e
allo strumento agente `tts`. Vedi [Text-to-speech](/it/tools/tts#per-agent-voice-overrides)
per esempi di provider e precedenza.

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // oppure { primary, fallbacks }
        thinkingDefault: "high", // override del livello di thinking per agente
        reasoningDefault: "on", // override della visibilità del reasoning per agente
        fastModeDefault: false, // override della fast mode per agente
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // sovrascrive per chiave i params corrispondenti di defaults.models
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // sostituisce agents.defaults.skills quando impostato
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: id agente stabile (obbligatorio).
- `default`: quando ne sono impostati più di uno, vince il primo (viene registrato un warning). Se non ne è impostato nessuno, la prima voce dell'elenco è quella predefinita.
- `model`: la forma stringa sovrascrive solo `primary`; la forma oggetto `{ primary, fallbacks }` sovrascrive entrambi (`[]` disabilita i fallback globali). I job Cron che sovrascrivono solo `primary` continuano comunque a ereditare i fallback predefiniti a meno che tu non imposti `fallbacks: []`.
- `params`: parametri stream per agente uniti sopra la voce del modello selezionato in `agents.defaults.models`. Usali per override specifici dell'agente come `cacheRetention`, `temperature` o `maxTokens` senza duplicare l'intero catalogo modelli.
- `tts`: override text-to-speech facoltativi per agente. Il blocco esegue un deep-merge su `messages.tts`, quindi mantieni in `messages.tts` le credenziali provider condivise e la policy di fallback, e imposta qui solo valori specifici della persona come provider, voce, modello, stile o modalità automatica.
- `skills`: allowlist facoltativa di Skills per agente. Se omessa, l'agente eredita `agents.defaults.skills` quando impostato; un elenco esplicito sostituisce i valori predefiniti invece di unirli, e `[]` significa nessuna Skills.
- `thinkingDefault`: livello di thinking predefinito facoltativo per agente (`off | minimal | low | medium | high | xhigh | adaptive | max`). Sovrascrive `agents.defaults.thinkingDefault` per questo agente quando non è impostato alcun override per messaggio o sessione. Il profilo del provider/modello selezionato controlla quali valori sono validi; per Google Gemini, `adaptive` mantiene il thinking dinamico gestito dal provider (`thinkingLevel` omesso su Gemini 3/3.1, `thinkingBudget: -1` su Gemini 2.5).
- `reasoningDefault`: visibilità del reasoning predefinita facoltativa per agente (`on | off | stream`). Si applica quando non è impostato alcun override reasoning per messaggio o sessione.
- `fastModeDefault`: valore predefinito facoltativo per agente per la fast mode (`true | false`). Si applica quando non è impostato alcun override fast-mode per messaggio o sessione.
- `agentRuntime`: override facoltativo della policy runtime di basso livello per agente. Usa `{ id: "codex" }` per rendere un agente solo Codex mentre gli altri agenti mantengono il fallback PI predefinito in modalità `auto`.
- `runtime`: descrittore runtime facoltativo per agente. Usa `type: "acp"` con i valori predefiniti `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) quando l'agente deve usare per impostazione predefinita sessioni harness ACP.
- `identity.avatar`: percorso relativo al workspace, URL `http(s)` oppure URI `data:`.
- `identity` deriva valori predefiniti: `ackReaction` da `emoji`, `mentionPatterns` da `name`/`emoji`.
- `subagents.allowAgents`: allowlist di id agente per `sessions_spawn` (`["*"]` = qualunque; predefinito: solo lo stesso agente).
- Guard di ereditarietà sandbox: se la sessione richiedente è in sandbox, `sessions_spawn` rifiuta destinazioni che verrebbero eseguite senza sandbox.
- `subagents.requireAgentId`: quando true, blocca le chiamate `sessions_spawn` che omettono `agentId` (forza la selezione esplicita del profilo; predefinito: false).

---

## Instradamento multi-agente

Esegui più agenti isolati dentro un unico Gateway. Vedi [Multi-Agent](/it/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Campi di corrispondenza del binding

- `type` (facoltativo): `route` per l'instradamento normale (tipo mancante = valore predefinito route), `acp` per associazioni persistenti di conversazione ACP.
- `match.channel` (obbligatorio)
- `match.accountId` (facoltativo; `*` = qualunque account; omesso = account predefinito)
- `match.peer` (facoltativo; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (facoltativo; specifico del canale)
- `acp` (facoltativo; solo per voci `type: "acp"`): `{ mode, label, cwd, backend }`

**Ordine di corrispondenza deterministico:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (esatto, senza peer/guild/team)
5. `match.accountId: "*"` (a livello di canale)
6. Agente predefinito

All'interno di ciascun livello, vince la prima voce `bindings` corrispondente.

Per le voci `type: "acp"`, OpenClaw risolve in base all'identità esatta della conversazione (`match.channel` + account + `match.peer.id`) e non usa l'ordine a livelli del route binding sopra.

### Profili di accesso per agente

<Accordion title="Accesso completo (senza sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Strumenti + workspace in sola lettura">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Nessun accesso al filesystem (solo messaggistica)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Vedi [Sandbox e strumenti Multi-Agent](/it/tools/multi-agent-sandbox-tools) per i dettagli di precedenza.

---

## Sessione

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // salta il fork del thread padre sopra questo conteggio di token (0 disabilita)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // durata oppure false
      maxDiskBytes: "500mb", // hard budget facoltativo
      highWaterBytes: "400mb", // target di cleanup facoltativo
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // auto-unfocus predefinito per inattività in ore (`0` disabilita)
      maxAgeHours: 0, // età massima rigida predefinita in ore (`0` disabilita)
    },
    mainKey: "main", // legacy (il runtime usa sempre "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Dettagli dei campi della sessione">

- **`scope`**: strategia base di raggruppamento della sessione per i contesti di chat di gruppo.
  - `per-sender` (predefinito): ogni mittente ottiene una sessione isolata all'interno di un contesto canale.
  - `global`: tutti i partecipanti in un contesto canale condividono un'unica sessione (usalo solo quando è previsto un contesto condiviso).
- **`dmScope`**: come vengono raggruppati i DM.
  - `main`: tutti i DM condividono la sessione principale.
  - `per-peer`: isola per id mittente tra i canali.
  - `per-channel-peer`: isola per canale + mittente (consigliato per inbox multiutente).
  - `per-account-channel-peer`: isola per account + canale + mittente (consigliato per multi-account).
- **`identityLinks`**: mappa degli id canonici ai peer con prefisso provider per la condivisione della sessione cross-channel.
- **`reset`**: policy primaria di reset. `daily` reimposta a `atHour` nell'ora locale; `idle` reimposta dopo `idleMinutes`. Quando entrambi sono configurati, vince quello che scade per primo. La freschezza del reset giornaliero usa `sessionStartedAt` della riga sessione; la freschezza del reset idle usa `lastInteractionAt`. Le scritture di background/eventi di sistema come Heartbeat, risvegli Cron, notifiche exec e bookkeeping Gateway possono aggiornare `updatedAt`, ma non mantengono fresche le sessioni giornaliere/idle.
- **`resetByType`**: override per tipo (`direct`, `group`, `thread`). Il valore legacy `dm` è accettato come alias di `direct`.
- **`parentForkMaxTokens`**: massimo `totalTokens` della sessione padre consentito quando si crea una sessione di thread forkata (predefinito `100000`).
  - Se `totalTokens` del padre supera questo valore, OpenClaw avvia una sessione thread nuova invece di ereditare la cronologia transcript del padre.
  - Imposta `0` per disabilitare questo guard e consentire sempre il forking dal padre.
- **`mainKey`**: campo legacy. Il runtime usa sempre `"main"` per il bucket principale della chat diretta.
- **`agentToAgent.maxPingPongTurns`**: numero massimo di turni di risposta reciproca tra agenti durante scambi agent-to-agent (intero, intervallo: `0`–`5`). `0` disabilita il chaining ping-pong.
- **`sendPolicy`**: corrispondenza per `channel`, `chatType` (`direct|group|channel`, con alias legacy `dm`), `keyPrefix` oppure `rawKeyPrefix`. Il primo deny vince.
- **`maintenance`**: controlli di cleanup + retention dello store sessione.
  - `mode`: `warn` emette solo warning; `enforce` applica il cleanup.
  - `pruneAfter`: soglia di età per voci obsolete (predefinito `30d`).
  - `maxEntries`: numero massimo di voci in `sessions.json` (predefinito `500`).
  - `rotateBytes`: ruota `sessions.json` quando supera questa dimensione (predefinito `10mb`).
  - `resetArchiveRetention`: retention per archivi transcript `*.reset.<timestamp>`. Usa come predefinito `pruneAfter`; imposta `false` per disabilitare.
  - `maxDiskBytes`: budget disco facoltativo per la directory sessions. In modalità `warn` registra warning; in modalità `enforce` rimuove prima gli artifact/sessioni più vecchi.
  - `highWaterBytes`: target facoltativo dopo il cleanup del budget. Predefinito: `80%` di `maxDiskBytes`.
- **`threadBindings`**: valori predefiniti globali per le funzionalità di sessione associate ai thread.
  - `enabled`: interruttore master predefinito (i provider possono sovrascriverlo; Discord usa `channels.discord.threadBindings.enabled`)
  - `idleHours`: auto-unfocus predefinito per inattività in ore (`0` disabilita; i provider possono sovrascrivere)
  - `maxAgeHours`: età massima rigida predefinita in ore (`0` disabilita; i provider possono sovrascrivere)

</Accordion>

---

## Messaggi

```json5
{
  messages: {
    responsePrefix: "🦞", // oppure "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disabilita
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Prefisso di risposta

Override per canale/account: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Risoluzione (vince il più specifico): account → canale → globale. `""` disabilita e interrompe la cascata. `"auto"` deriva `[{identity.name}]`.

**Variabili di template:**

| Variabile         | Descrizione                  | Esempio                     |
| ----------------- | ---------------------------- | --------------------------- |
| `{model}`         | Nome breve del modello       | `claude-opus-4-6`           |
| `{modelFull}`     | Identificatore completo del modello | `anthropic/claude-opus-4-6` |
| `{provider}`      | Nome del provider            | `anthropic`                 |
| `{thinkingLevel}` | Livello di thinking corrente | `high`, `low`, `off`        |
| `{identity.name}` | Nome identità dell'agente    | (uguale a `"auto"`)         |

Le variabili non distinguono tra maiuscole e minuscole. `{think}` è un alias di `{thinkingLevel}`.

### Reazione di conferma

- Il valore predefinito è `identity.emoji` dell'agente attivo, altrimenti `"👀"`. Imposta `""` per disabilitare.
- Override per canale: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Ordine di risoluzione: account → canale → `messages.ackReaction` → fallback dell'identità.
- Scope: `group-mentions` (predefinito), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: rimuove la conferma dopo la risposta nei canali che supportano reazioni come Slack, Discord, Telegram, WhatsApp e BlueBubbles.
- `messages.statusReactions.enabled`: abilita le reazioni di stato del ciclo di vita su Slack, Discord e Telegram.
  Su Slack e Discord, se non impostato, mantiene abilitate le reazioni di stato quando sono attive le reazioni di conferma.
  Su Telegram, impostalo esplicitamente su `true` per abilitare le reazioni di stato del ciclo di vita.

### Debounce in ingresso

Raggruppa messaggi rapidi solo testo dallo stesso mittente in un unico turno agente. Media/allegati vengono scaricati immediatamente. I comandi di controllo bypassano il debounce.

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` controlla la modalità auto-TTS predefinita: `off`, `always`, `inbound` oppure `tagged`. `/tts on|off` può sovrascrivere le preferenze locali e `/tts status` mostra lo stato effettivo.
- `summaryModel` sovrascrive `agents.defaults.model.primary` per il riepilogo automatico.
- `modelOverrides` è abilitato per impostazione predefinita; `modelOverrides.allowProvider` usa come predefinito `false` (opt-in).
- Le chiavi API usano come fallback `ELEVENLABS_API_KEY`/`XI_API_KEY` e `OPENAI_API_KEY`.
- I provider vocali inclusi sono di proprietà del Plugin. Se `plugins.allow` è impostato, includi ogni Plugin provider TTS che vuoi usare, ad esempio `microsoft` per Edge TTS. L'id provider legacy `edge` è accettato come alias di `microsoft`.
- `providers.openai.baseUrl` sovrascrive l'endpoint TTS OpenAI. L'ordine di risoluzione è configurazione, poi `OPENAI_TTS_BASE_URL`, poi `https://api.openai.com/v1`.
- Quando `providers.openai.baseUrl` punta a un endpoint non OpenAI, OpenClaw lo tratta come un server TTS compatibile con OpenAI e allenta la validazione di modello/voce.

---

## Talk

Valori predefiniti per la modalità Talk (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` deve corrispondere a una chiave in `talk.providers` quando sono configurati più provider Talk.
- Le chiavi Talk flat legacy (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) sono solo per compatibilità e vengono migrate automaticamente in `talk.providers.<provider>`.
- Gli id voce usano come fallback `ELEVENLABS_VOICE_ID` oppure `SAG_VOICE_ID`.
- `providers.*.apiKey` accetta stringhe plaintext oppure oggetti SecretRef.
- Il fallback `ELEVENLABS_API_KEY` si applica solo quando non è configurata alcuna chiave API Talk.
- `providers.*.voiceAliases` consente alle direttive Talk di usare nomi amichevoli.
- `providers.mlx.modelId` seleziona il repository Hugging Face usato dall'helper MLX locale di macOS. Se omesso, macOS usa `mlx-community/Soprano-80M-bf16`.
- La riproduzione MLX su macOS passa attraverso l'helper incluso `openclaw-mlx-tts` quando presente, oppure un eseguibile su `PATH`; `OPENCLAW_MLX_TTS_BIN` sovrascrive il percorso dell'helper per lo sviluppo.
- `speechLocale` imposta l'id locale BCP 47 usato dal riconoscimento vocale Talk su iOS/macOS. Lascialo non impostato per usare il valore predefinito del dispositivo.
- `silenceTimeoutMs` controlla per quanto tempo la modalità Talk attende dopo il silenzio dell'utente prima di inviare la trascrizione. Se non impostato, mantiene la finestra di pausa predefinita della piattaforma (`700 ms su macOS e Android, 900 ms su iOS`).

---

## Correlati

- [Riferimento configurazione](/it/gateway/configuration-reference) — tutte le altre chiavi di configurazione
- [Configurazione](/it/gateway/configuration) — attività comuni e configurazione rapida
- [Esempi di configurazione](/it/gateway/configuration-examples)
