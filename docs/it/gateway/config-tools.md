---
read_when:
    - Configurazione dei criteri, delle allowlist o delle funzionalità sperimentali di `tools.*`
    - Registrazione di provider personalizzati o override dei base URL
    - Configurazione di endpoint self-hosted compatibili con OpenAI
summary: Configurazione degli strumenti (criteri, toggle sperimentali, strumenti supportati dal provider) e configurazione personalizzata di provider/base URL
title: Configurazione — strumenti e provider personalizzati
x-i18n:
    generated_at: "2026-04-25T13:46:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: d63b080550a6c95d714d3bb42c2b079368040aa09378d88c2e498ccd5ec113c1
    source_path: gateway/config-tools.md
    workflow: 15
---

Chiavi di configurazione `tools.*` e configurazione personalizzata di provider / base URL. Per agenti,
canali e altre chiavi di configurazione di primo livello, vedi
[Riferimento della configurazione](/it/gateway/configuration-reference).

## Strumenti

### Profili degli strumenti

`tools.profile` imposta una allowlist di base prima di `tools.allow`/`tools.deny`:

L'onboarding locale imposta per le nuove configurazioni locali il valore predefinito `tools.profile: "coding"` quando non è impostato (i profili espliciti esistenti vengono preservati).

| Profilo     | Include                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `minimal`   | solo `session_status`                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | Nessuna restrizione (uguale a non impostato)                                                                                   |

### Gruppi di strumenti

| Gruppo             | Strumenti                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` è accettato come alias di `exec`)                                             |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                    |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`   |
| `group:memory`     | `memory_search`, `memory_get`                                                                                             |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                     |
| `group:ui`         | `browser`, `canvas`                                                                                                       |
| `group:automation` | `cron`, `gateway`                                                                                                         |
| `group:messaging`  | `message`                                                                                                                 |
| `group:nodes`      | `nodes`                                                                                                                   |
| `group:agents`     | `agents_list`                                                                                                             |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                        |
| `group:openclaw`   | Tutti gli strumenti integrati (esclude i Plugin provider)                                                                 |

### `tools.allow` / `tools.deny`

Criteri globali di allow/deny degli strumenti (deny ha la precedenza). Non sensibile alle maiuscole/minuscole, supporta wildcard `*`. Applicato anche quando la sandbox Docker è disattivata.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Limita ulteriormente gli strumenti per provider o modelli specifici. Ordine: profilo base → profilo provider → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Controlla l'accesso exec elevato fuori dalla sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- L'override per agente (`agents.list[].tools.elevated`) può solo restringere ulteriormente.
- `/elevated on|off|ask|full` memorizza lo stato per sessione; le direttive inline si applicano a un singolo messaggio.
- `exec` elevato aggira il sandboxing e usa il percorso di escape configurato (`gateway` per impostazione predefinita, oppure `node` quando la destinazione exec è `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

I controlli di sicurezza dei loop degli strumenti sono **disabilitati per impostazione predefinita**. Imposta `enabled: true` per attivare il rilevamento.
Le impostazioni possono essere definite globalmente in `tools.loopDetection` e sovrascritte per agente in `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: cronologia massima delle chiamate agli strumenti mantenuta per l'analisi dei loop.
- `warningThreshold`: soglia di pattern ripetuto senza progresso per gli avvisi.
- `criticalThreshold`: soglia ripetuta più alta per bloccare loop critici.
- `globalCircuitBreakerThreshold`: soglia di arresto rigido per qualsiasi esecuzione senza progresso.
- `detectors.genericRepeat`: avvisa sulle chiamate ripetute allo stesso strumento/con gli stessi argomenti.
- `detectors.knownPollNoProgress`: avvisa/blocca sugli strumenti di polling noti (`process.poll`, `command_status`, ecc.).
- `detectors.pingPong`: avvisa/blocca su pattern a coppie alternate senza progresso.
- Se `warningThreshold >= criticalThreshold` oppure `criticalThreshold >= globalCircuitBreakerThreshold`, la validazione fallisce.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // oppure env BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // facoltativo; ometti per rilevamento automatico
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Configura la comprensione dei media in ingresso (immagine/audio/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: invia direttamente al canale musica/video asincroni completati
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Campi di voce del modello media">

**Voce provider** (`type: "provider"` oppure omesso):

- `provider`: id del provider API (`openai`, `anthropic`, `google`/`gemini`, `groq`, ecc.)
- `model`: override dell'id modello
- `profile` / `preferredProfile`: selezione del profilo `auth-profiles.json`

**Voce CLI** (`type: "cli"`):

- `command`: eseguibile da avviare
- `args`: argomenti con template (supporta `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}`, ecc.)

**Campi comuni:**

- `capabilities`: elenco facoltativo (`image`, `audio`, `video`). Valori predefiniti: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: override per singola voce.
- In caso di errore si usa come fallback la voce successiva.

L'auth del provider segue l'ordine standard: `auth-profiles.json` → variabili env → `models.providers.*.apiKey`.

**Campi di completamento asincrono:**

- `asyncCompletion.directSend`: quando `true`, le attività asincrone completate `music_generate`
  e `video_generate` provano prima la consegna diretta al canale. Predefinito: `false`
  (percorso legacy di wake/model-delivery della sessione richiedente).

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Controlla quali sessioni possono essere destinate dagli strumenti di sessione (`sessions_list`, `sessions_history`, `sessions_send`).

Predefinito: `tree` (sessione corrente + sessioni generate da essa, come i subagenti).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Note:

- `self`: solo la chiave di sessione corrente.
- `tree`: sessione corrente + sessioni generate dalla sessione corrente (subagenti).
- `agent`: qualsiasi sessione appartenente all'id dell'agente corrente (può includere altri utenti se esegui sessioni per mittente sotto lo stesso id agente).
- `all`: qualsiasi sessione. Il targeting cross-agent richiede comunque `tools.agentToAgent`.
- Limitazione sandbox: quando la sessione corrente è sandboxed e `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, la visibilità viene forzata a `tree` anche se `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Controlla il supporto degli allegati inline per `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: imposta true per consentire allegati file inline
        maxTotalBytes: 5242880, // 5 MB totali su tutti i file
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // mantiene gli allegati quando cleanup="keep"
      },
    },
  },
}
```

Note:

- Gli allegati sono supportati solo per `runtime: "subagent"`. Il runtime ACP li rifiuta.
- I file vengono materializzati nel workspace figlio in `.openclaw/attachments/<uuid>/` con un `.manifest.json`.
- Il contenuto degli allegati viene automaticamente redatto dalla persistenza del transcript.
- Gli input Base64 vengono validati con controlli rigorosi su alfabeto/padding e un controllo della dimensione prima della decodifica.
- I permessi dei file sono `0700` per le directory e `0600` per i file.
- La pulizia segue il criterio `cleanup`: `delete` rimuove sempre gli allegati; `keep` li mantiene solo quando `retainOnSessionKeep: true`.

<a id="toolsexperimental"></a>

### `tools.experimental`

Flag sperimentali degli strumenti integrati. Disattivati per impostazione predefinita, a meno che non si applichi una regola di auto-abilitazione strict-agentic GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // abilita l'update_plan sperimentale
    },
  },
}
```

Note:

- `planTool`: abilita lo strumento strutturato `update_plan` per il tracciamento di lavoro non banale in più fasi.
- Predefinito: `false` a meno che `agents.defaults.embeddedPi.executionContract` (o un override per agente) non sia impostato su `"strict-agentic"` per un'esecuzione della famiglia GPT-5 di OpenAI o OpenAI Codex. Imposta `true` per forzare l'attivazione dello strumento fuori da questo ambito, oppure `false` per mantenerlo disattivato anche per esecuzioni strict-agentic GPT-5.
- Quando è abilitato, il prompt di sistema aggiunge anche linee guida d'uso in modo che il modello lo usi solo per lavoro sostanziale e mantenga al massimo una fase `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: modello predefinito per i subagenti generati. Se omesso, i subagenti ereditano il modello del chiamante.
- `allowAgents`: allowlist predefinita degli id agente di destinazione per `sessions_spawn` quando l'agente richiedente non imposta il proprio `subagents.allowAgents` (`["*"]` = qualsiasi; predefinito: solo lo stesso agente).
- `runTimeoutSeconds`: timeout predefinito (secondi) per `sessions_spawn` quando la chiamata allo strumento omette `runTimeoutSeconds`. `0` significa nessun timeout.
- Criteri strumenti per subagente: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Provider personalizzati e base URL

OpenClaw usa il catalogo modelli integrato. Aggiungi provider personalizzati tramite `models.providers` nella configurazione o in `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (predefinito) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Usa `authHeader: true` + `headers` per esigenze auth personalizzate.
- Sovrascrivi la root di configurazione dell'agente con `OPENCLAW_AGENT_DIR` (oppure `PI_CODING_AGENT_DIR`, un alias legacy della variabile d'ambiente).
- Precedenza di merge per ID provider corrispondenti:
  - I valori `baseUrl` non vuoti di `models.json` dell'agente hanno la precedenza.
  - I valori `apiKey` non vuoti dell'agente hanno la precedenza solo quando quel provider non è gestito da SecretRef nel contesto corrente di config/profilo auth.
  - I valori `apiKey` del provider gestiti da SecretRef vengono aggiornati dai marker sorgente (`ENV_VAR_NAME` per ref env, `secretref-managed` per ref file/exec) invece di rendere persistenti i segreti risolti.
  - I valori header del provider gestiti da SecretRef vengono aggiornati dai marker sorgente (`secretref-env:ENV_VAR_NAME` per ref env, `secretref-managed` per ref file/exec).
  - `apiKey`/`baseUrl` dell'agente vuoti o mancanti usano come fallback `models.providers` nella config.
  - I valori `contextWindow`/`maxTokens` dei modelli corrispondenti usano il valore più alto tra la config esplicita e i valori impliciti del catalogo.
  - `contextTokens` dei modelli corrispondenti conserva un limite runtime esplicito quando presente; usalo per limitare il contesto effettivo senza modificare i metadati nativi del modello.
  - Usa `models.mode: "replace"` quando vuoi che la config riscriva completamente `models.json`.
  - La persistenza dei marker è autorevole rispetto alla sorgente: i marker vengono scritti dallo snapshot della config sorgente attiva (pre-risoluzione), non dai valori segreti runtime risolti.

### Dettagli dei campi provider

- `models.mode`: comportamento del catalogo provider (`merge` o `replace`).
- `models.providers`: mappa provider personalizzati indicizzata per id provider.
  - Modifiche sicure: usa `openclaw config set models.providers.<id> '<json>' --strict-json --merge` oppure `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` per aggiornamenti additivi. `config set` rifiuta sostituzioni distruttive a meno che non passi `--replace`.
- `models.providers.*.api`: adapter di richiesta (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, ecc.).
- `models.providers.*.apiKey`: credenziale del provider (preferisci la sostituzione SecretRef/env).
- `models.providers.*.auth`: strategia auth (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: per Ollama + `openai-completions`, inietta `options.num_ctx` nelle richieste (predefinito: `true`).
- `models.providers.*.authHeader`: forza il trasporto delle credenziali nell'header `Authorization` quando richiesto.
- `models.providers.*.baseUrl`: base URL dell'API upstream.
- `models.providers.*.headers`: header statici extra per instradamento proxy/tenant.
- `models.providers.*.request`: override di trasporto per le richieste HTTP del model-provider.
  - `request.headers`: header extra (uniti ai valori predefiniti del provider). I valori accettano SecretRef.
  - `request.auth`: override della strategia auth. Modalità: `"provider-default"` (usa l'auth integrata del provider), `"authorization-bearer"` (con `token`), `"header"` (con `headerName`, `value`, `prefix` facoltativo).
  - `request.proxy`: override del proxy HTTP. Modalità: `"env-proxy"` (usa le variabili env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (con `url`). Entrambe le modalità accettano un sotto-oggetto `tls` facoltativo.
  - `request.tls`: override TLS per connessioni dirette. Campi: `ca`, `cert`, `key`, `passphrase` (tutti accettano SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: quando `true`, consente HTTPS verso `baseUrl` quando il DNS si risolve in intervalli privati, CGNAT o simili, tramite la protezione SSRF del fetch HTTP del provider (opt-in dell'operatore per endpoint self-hosted compatibili con OpenAI attendibili). WebSocket usa lo stesso `request` per header/TLS ma non quella protezione SSRF del fetch. Predefinito `false`.
- `models.providers.*.models`: voci esplicite del catalogo modelli del provider.
- `models.providers.*.models.*.contextWindow`: metadati nativi della finestra di contesto del modello.
- `models.providers.*.models.*.contextTokens`: limite di contesto runtime facoltativo. Usalo quando vuoi un budget di contesto effettivo più piccolo di `contextWindow` nativo del modello; `openclaw models list` mostra entrambi i valori quando differiscono.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: hint di compatibilità facoltativo. Per `api: "openai-completions"` con `baseUrl` non vuoto e non nativo (host diverso da `api.openai.com`), OpenClaw forza questo valore a `false` a runtime. `baseUrl` vuoto/omesso mantiene il comportamento predefinito di OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: hint di compatibilità facoltativo per endpoint chat compatibili con OpenAI che accettano solo stringhe. Quando `true`, OpenClaw appiattisce gli array `messages[].content` composti solo da testo in stringhe normali prima di inviare la richiesta.
- `plugins.entries.amazon-bedrock.config.discovery`: root delle impostazioni di auto-discovery Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: attiva/disattiva l'individuazione implicita.
- `plugins.entries.amazon-bedrock.config.discovery.region`: regione AWS per l'individuazione.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filtro facoltativo per id provider per individuazione mirata.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: intervallo di polling per l'aggiornamento dell'individuazione.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: finestra di contesto di fallback per i modelli individuati.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: token massimi in uscita di fallback per i modelli individuati.

### Esempi di provider

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Usa `cerebras/zai-glm-4.7` per Cerebras; `zai/glm-4.7` per Z.AI direct.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

Imposta `OPENCODE_API_KEY` (oppure `OPENCODE_ZEN_API_KEY`). Usa riferimenti `opencode/...` per il catalogo Zen oppure riferimenti `opencode-go/...` per il catalogo Go. Scorciatoia: `openclaw onboard --auth-choice opencode-zen` oppure `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

Imposta `ZAI_API_KEY`. `z.ai/*` e `z-ai/*` sono alias accettati. Scorciatoia: `openclaw onboard --auth-choice zai-api-key`.

- Endpoint generale: `https://api.z.ai/api/paas/v4`
- Endpoint coding (predefinito): `https://api.z.ai/api/coding/paas/v4`
- Per l'endpoint generale, definisci un provider personalizzato con l'override del base URL.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Per l'endpoint Cina: `baseUrl: "https://api.moonshot.cn/v1"` oppure `openclaw onboard --auth-choice moonshot-api-key-cn`.

Gli endpoint Moonshot nativi dichiarano la compatibilità di utilizzo dello streaming sul trasporto condiviso `openai-completions`, e OpenClaw si basa sulle capacità dell'endpoint invece che solo sull'id del provider integrato.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Compatibile con Anthropic, provider integrato. Scorciatoia: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (compatibile con Anthropic)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Il base URL deve omettere `/v1` (il client Anthropic lo aggiunge). Scorciatoia: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
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
        ],
      },
    },
  },
}
```

Imposta `MINIMAX_API_KEY`. Scorciatoie:
`openclaw onboard --auth-choice minimax-global-api` oppure
`openclaw onboard --auth-choice minimax-cn-api`.
Il catalogo modelli usa come predefinito solo M2.7.
Nel percorso di streaming compatibile con Anthropic, OpenClaw disabilita il thinking di MiniMax
per impostazione predefinita a meno che tu non imposti esplicitamente `thinking`. `/fast on` oppure
`params.fastMode: true` riscrive `MiniMax-M2.7` in
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Modelli locali (LM Studio)">

Vedi [Modelli locali](/it/gateway/local-models). In breve: esegui un grande modello locale tramite LM Studio Responses API su hardware adeguato; mantieni uniti i modelli hosted per il fallback.

</Accordion>

---

## Correlati

- [Riferimento della configurazione](/it/gateway/configuration-reference) — altre chiavi di primo livello
- [Configurazione — agenti](/it/gateway/config-agents)
- [Configurazione — canali](/it/gateway/config-channels)
- [Strumenti e Plugin](/it/tools)
