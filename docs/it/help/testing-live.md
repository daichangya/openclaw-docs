---
read_when:
    - Esecuzione di smoke test live per matrice dei modelli / backend CLI / ACP / provider media
    - Debug della risoluzione delle credenziali nei test live
    - Aggiunta di un nuovo test live specifico per provider
sidebarTitle: Live tests
summary: 'Test live (con accesso alla rete): matrice dei modelli, backend CLI, ACP, provider media, credenziali'
title: 'Test: suite live'
x-i18n:
    generated_at: "2026-04-26T11:31:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 669d68dc80d0bf86942635c792f64f1edc7a23684c880cb66799401dee3d127f
    source_path: help/testing-live.md
    workflow: 15
---

Per un avvio rapido, runner QA, suite unit/integration e flussi Docker, vedi
[Testing](/it/help/testing). Questa pagina copre le suite di test **live** (con accesso alla rete):
matrice dei modelli, backend CLI, ACP e test live dei provider media, oltre alla
gestione delle credenziali.

## Live: comandi smoke del profilo locale

Esegui `source ~/.profile` prima di controlli live ad hoc così che le chiavi provider e i percorsi degli strumenti locali
corrispondano alla tua shell:

```bash
source ~/.profile
```

Smoke sicuro per media:

```bash
pnpm openclaw infer tts convert --local --json \
  --text "OpenClaw live smoke." \
  --output /tmp/openclaw-live-smoke.mp3
```

Smoke sicuro per la verifica di prontezza delle chiamate vocali:

```bash
pnpm openclaw voicecall setup --json
pnpm openclaw voicecall smoke --to "+15555550123"
```

`voicecall smoke` è una simulazione salvo che sia presente anche `--yes`. Usa `--yes` solo
quando vuoi intenzionalmente effettuare una vera chiamata di notifica. Per Twilio, Telnyx e
Plivo, un controllo di prontezza riuscito richiede un URL Webhook pubblico; i fallback solo locali
loopback/privati vengono rifiutati per progettazione.

## Live: sweep delle capacità del Node Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Obiettivo: invocare **ogni comando attualmente pubblicizzato** da un Node Android connesso e verificare il comportamento del contratto dei comandi.
- Ambito:
  - Configurazione manuale/precondizionata (la suite non installa/esegue/abbina l'app).
  - Validazione `node.invoke` del gateway comando per comando per il Node Android selezionato.
- Pre-setup richiesto:
  - App Android già connessa e abbinata al gateway.
  - App mantenuta in primo piano.
  - Permessi/consenso di acquisizione concessi per le capacità che ti aspetti passino.
- Override facoltativi del target:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Dettagli completi della configurazione Android: [App Android](/it/platforms/android)

## Live: smoke dei modelli (chiavi profilo)

I test live sono suddivisi in due livelli così da poter isolare i guasti:

- “Modello diretto” ci dice se il provider/modello riesce a rispondere del tutto con la chiave data.
- “Gateway smoke” ci dice se l'intera pipeline gateway+agente funziona per quel modello (sessioni, cronologia, strumenti, policy sandbox, ecc.).

### Livello 1: completamento diretto del modello (senza gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Obiettivo:
  - Enumerare i modelli scoperti
  - Usare `getApiKeyForModel` per selezionare i modelli per cui hai credenziali
  - Eseguire un piccolo completamento per modello (e regressioni mirate dove necessario)
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Imposta `OPENCLAW_LIVE_MODELS=modern` (o `all`, alias di modern) per eseguire davvero questa suite; altrimenti viene saltata per mantenere `pnpm test:live` focalizzato sul gateway smoke
- Come selezionare i modelli:
  - `OPENCLAW_LIVE_MODELS=modern` per eseguire l'allowlist moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` è un alias dell'allowlist moderna
  - oppure `OPENCLAW_LIVE_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,..."` (allowlist separata da virgole)
  - Gli sweep modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_MAX_MODELS=0` per uno sweep moderno esaustivo o un numero positivo per un limite più piccolo.
  - Gli sweep esaustivi usano `OPENCLAW_LIVE_TEST_TIMEOUT_MS` per il timeout dell'intero test diretto del modello. Predefinito: 60 minuti.
  - Le sonde direct-model vengono eseguite con parallelismo 20 per impostazione predefinita; imposta `OPENCLAW_LIVE_MODEL_CONCURRENCY` per sovrascriverlo.
- Come selezionare i provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separata da virgole)
- Da dove arrivano le chiavi:
  - Per impostazione predefinita: archivio profili e fallback env
  - Imposta `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per imporre **solo** l'archivio profili
- Perché esiste:
  - Separa “la API del provider è guasta / la chiave non è valida” da “la pipeline agente del gateway è guasta”
  - Contiene piccole regressioni isolate (esempio: flussi di reasoning replay + tool-call di OpenAI Responses/Codex Responses)

### Livello 2: smoke del Gateway + agente dev (quello che fa davvero "@openclaw")

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Obiettivo:
  - Avviare un gateway in-process
  - Creare/modificare una sessione `agent:dev:*` (override del modello per esecuzione)
  - Iterare sui modelli con chiavi e verificare:
    - risposta “significativa” (senza strumenti)
    - una vera invocazione di strumento funziona (sonda read)
    - sonde strumenti extra facoltative (sonda exec+read)
    - i percorsi di regressione OpenAI (solo tool-call → follow-up) continuano a funzionare
- Dettagli delle sonde (così puoi spiegare rapidamente i guasti):
  - sonda `read`: il test scrive un file nonce nel workspace e chiede all'agente di `read`-arlo e restituire il nonce.
  - sonda `exec+read`: il test chiede all'agente di scrivere un nonce in un file temporaneo con `exec`, quindi di leggerlo di nuovo con `read`.
  - sonda immagine: il test allega un PNG generato (gatto + codice casuale) e si aspetta che il modello restituisca `cat <CODE>`.
  - Riferimento implementativo: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Come abilitarlo:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
- Come selezionare i modelli:
  - Predefinito: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.2 + Codex, Gemini 3, DeepSeek V4, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` è un alias dell'allowlist moderna
  - Oppure imposta `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o elenco separato da virgole) per restringere
  - Gli sweep gateway modern/all usano per impostazione predefinita un limite curato ad alto segnale; imposta `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` per uno sweep moderno esaustivo o un numero positivo per un limite più piccolo.
- Come selezionare i provider (evita “OpenRouter tutto”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separata da virgole)
- Le sonde strumenti + immagine sono sempre attive in questo test live:
  - sonda `read` + sonda `exec+read` (stress degli strumenti)
  - la sonda immagine viene eseguita quando il modello pubblicizza il supporto per input immagine
  - Flusso (alto livello):
    - Il test genera un piccolo PNG con “CAT” + codice casuale (`src/gateway/live-image-probe.ts`)
    - Lo invia tramite `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Il Gateway analizza gli allegati in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - L'agente incorporato inoltra un messaggio utente multimodale al modello
    - Verifica: la risposta contiene `cat` + il codice (tolleranza OCR: piccoli errori ammessi)

Suggerimento: per vedere cosa puoi testare sulla tua macchina (e gli ID esatti `provider/model`), esegui:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke del backend CLI (Claude, Codex, Gemini o altre CLI locali)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Obiettivo: validare la pipeline Gateway + agente usando un backend CLI locale, senza toccare la tua configurazione predefinita.
- I valori predefiniti smoke specifici del backend si trovano nella definizione `cli-backend.ts` dell'extension proprietaria.
- Abilitazione:
  - `pnpm test:live` (oppure `OPENCLAW_LIVE_TEST=1` se invochi Vitest direttamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valori predefiniti:
  - Provider/modello predefinito: `claude-cli/claude-sonnet-4-6`
  - Comportamento di comando/argomenti/immagine proveniente dai metadati del Plugin backend CLI proprietario.
- Override (facoltativi):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` per inviare un vero allegato immagine (i percorsi vengono iniettati nel prompt). Le ricette Docker lo tengono disattivato per impostazione predefinita salvo richiesta esplicita.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` per passare i percorsi dei file immagine come argomenti CLI invece dell'iniezione nel prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) per controllare come vengono passati gli argomenti immagine quando è impostato `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` per inviare un secondo turno e validare il flusso di resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=1` per attivare la sonda di continuità nella stessa sessione Claude Sonnet -> Opus quando il modello selezionato supporta un target di switch. Le ricette Docker la tengono disattivata per impostazione predefinita per affidabilità complessiva.
  - `OPENCLAW_LIVE_CLI_BACKEND_MCP_PROBE=1` per attivare la sonda MCP/tool loopback. Le ricette Docker la tengono disattivata per impostazione predefinita salvo richiesta esplicita.

Esempio:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.2" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Smoke economico della configurazione Gemini MCP:

```bash
OPENCLAW_LIVE_TEST=1 \
  pnpm test:live src/agents/cli-runner/bundle-mcp.gemini.live.test.ts
```

Questo non chiede a Gemini di generare una risposta. Scrive le stesse
impostazioni di sistema che OpenClaw fornisce a Gemini, poi esegue `gemini --debug mcp list` per dimostrare che un
server salvato `transport: "streamable-http"` viene normalizzato nella forma HTTP MCP di Gemini
e può connettersi a un server MCP streamable-HTTP locale.

Ricetta Docker:

```bash
pnpm test:docker:live-cli-backend
```

Ricette Docker per singolo provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Note:

- Il runner Docker si trova in `scripts/test-live-cli-backend-docker.sh`.
- Esegue lo smoke live del backend CLI dentro l'immagine Docker del repository come utente non root `node`.
- Risolve i metadati smoke CLI dall'extension proprietaria, poi installa il pacchetto CLI Linux corrispondente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) in un prefisso scrivibile in cache in `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predefinito: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` richiede OAuth portabile dell'abbonamento Claude Code tramite `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` oppure `CLAUDE_CODE_OAUTH_TOKEN` da `claude setup-token`. Per prima cosa dimostra `claude -p` diretto in Docker, poi esegue due turni Gateway CLI-backend senza conservare le variabili env della chiave API Anthropic. Questa lane di abbonamento disabilita per impostazione predefinita le sonde Claude MCP/tool e immagine perché Claude attualmente instrada l'uso di app di terze parti tramite fatturazione extra-usage invece dei normali limiti del piano di abbonamento.
- Lo smoke live del backend CLI ora esercita lo stesso flusso end-to-end per Claude, Codex e Gemini: turno testuale, turno di classificazione immagine, poi chiamata allo strumento MCP `cron` verificata tramite la CLI del gateway.
- Lo smoke predefinito di Claude modifica anche la sessione da Sonnet a Opus e verifica che la sessione ripresa ricordi ancora una nota precedente.

## Live: smoke ACP bind (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Obiettivo: validare il vero flusso ACP di binding della conversazione con un agente ACP live:
  - inviare `/acp spawn <agent> --bind here`
  - associare sul posto una conversazione sintetica di canale messaggi
  - inviare un normale follow-up su quella stessa conversazione
  - verificare che il follow-up arrivi nel transcript della sessione ACP associata
- Abilitazione:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valori predefiniti:
  - Agenti ACP in Docker: `claude,codex,gemini`
  - Agente ACP per `pnpm test:live ...` diretto: `claude`
  - Canale sintetico: contesto di conversazione in stile DM Slack
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=droid`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=opencode`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.2`
  - `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL=opencode/kimi-k2.6`
  - `OPENCLAW_LIVE_ACP_BIND_REQUIRE_TRANSCRIPT=1`
  - `OPENCLAW_LIVE_ACP_BIND_PARENT_MODEL=openai/gpt-5.2`
- Note:
  - Questa lane usa la superficie gateway `chat.send` con campi sintetici di originating-route riservati agli admin così che i test possano allegare il contesto del canale messaggi senza fingere una consegna esterna.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` non è impostato, il test usa il registro agenti integrato del Plugin `acpx` incorporato per l'agente harness ACP selezionato.

Esempio:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Ricetta Docker:

```bash
pnpm test:docker:live-acp-bind
```

Ricette Docker a singolo agente:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:droid
pnpm test:docker:live-acp-bind:gemini
pnpm test:docker:live-acp-bind:opencode
```

Note Docker:

- Il runner Docker si trova in `scripts/test-live-acp-bind-docker.sh`.
- Per impostazione predefinita, esegue lo smoke ACP bind sugli agenti CLI live aggregati in sequenza: `claude`, `codex`, poi `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=droid`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` o `OPENCLAW_LIVE_ACP_BIND_AGENTS=opencode` per restringere la matrice.
- Esegue `source ~/.profile`, prepara nel container il materiale di autenticazione CLI corrispondente, quindi installa la CLI live richiesta (`@anthropic-ai/claude-code`, `@openai/codex`, Factory Droid tramite `https://app.factory.ai/cli`, `@google/gemini-cli` o `opencode-ai`) se mancante. Il backend ACP stesso è il pacchetto `acpx/runtime` incorporato del Plugin `acpx`.
- La variante Docker Droid prepara `~/.factory` per le impostazioni, inoltra `FACTORY_API_KEY` e richiede quella chiave API perché l'autenticazione locale Factory OAuth/keyring non è portabile nel container. Usa la voce di registro integrata di ACPX `droid exec --output-format acp`.
- La variante Docker OpenCode è una lane di regressione rigorosa a singolo agente. Scrive un modello predefinito temporaneo `OPENCODE_CONFIG_CONTENT` da `OPENCLAW_LIVE_ACP_BIND_OPENCODE_MODEL` (predefinito `opencode/kimi-k2.6`) dopo `source ~/.profile`, e `pnpm test:docker:live-acp-bind:opencode` richiede un transcript assistente associato invece di accettare lo skip generico post-bind.
- Le chiamate CLI dirette `acpx` sono solo un percorso manuale/di workaround per confrontare il comportamento fuori dal Gateway. Lo smoke ACP bind Docker esercita il backend runtime `acpx` incorporato di OpenClaw.

## Live: smoke dell'harness Codex app-server

- Obiettivo: validare l'harness Codex gestito dal Plugin tramite il normale
  metodo gateway `agent`:
  - caricare il Plugin `codex` incluso nel bundle
  - selezionare `OPENCLAW_AGENT_RUNTIME=codex`
  - inviare un primo turno agente gateway a `openai/gpt-5.2` con l'harness Codex forzato
  - inviare un secondo turno alla stessa sessione OpenClaw e verificare che il thread app-server
    possa riprendere
  - eseguire `/codex status` e `/codex models` tramite lo stesso percorso di
    comando del gateway
  - facoltativamente eseguire due sonde shell elevate revisionate da Guardian: un
    comando benigno che dovrebbe essere approvato e un finto upload di segreto che dovrebbe essere
    negato così che l'agente chieda conferma
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modello predefinito: `openai/gpt-5.2`
- Sonda immagine facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda MCP/tool facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonda Guardian facoltativa: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- Lo smoke imposta `OPENCLAW_AGENT_HARNESS_FALLBACK=none` così che un harness Codex guasto
  non possa passare ricadendo silenziosamente su PI.
- Auth: autenticazione Codex app-server dal login locale all'abbonamento Codex. Gli
  smoke Docker possono anche fornire `OPENAI_API_KEY` per sonde non-Codex quando applicabile,
  più eventuali copie di `~/.codex/auth.json` e `~/.codex/config.toml`.

Ricetta locale:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=openai/gpt-5.2 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Ricetta Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Note Docker:

- Il runner Docker si trova in `scripts/test-live-codex-harness-docker.sh`.
- Esegue `source` del `~/.profile` montato, passa `OPENAI_API_KEY`, copia i file di auth della CLI Codex
  quando presenti, installa `@openai/codex` in un prefisso npm montato e scrivibile,
  prepara l'albero sorgente, quindi esegue solo il test live dell'harness Codex.
- Docker abilita per impostazione predefinita le sonde immagine, MCP/tool e Guardian. Imposta
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando hai bisogno di un'esecuzione di debug più ristretta.
- Docker esporta anche `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, in linea con la configurazione del test live così che alias legacy o fallback PI non possano nascondere una regressione dell'harness Codex.

### Ricette live consigliate

Allowlist ristrette ed esplicite sono le più rapide e meno soggette a instabilità:

- Modello singolo, diretto (senza gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.2" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modello singolo, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling su più provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Focus Google (chiave API Gemini + Antigravity):
  - Gemini (chiave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Smoke del thinking adattivo Google:
  - Se le chiavi locali vivono nel profilo shell: `source ~/.profile`
  - Predefinito dinamico Gemini 3: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-3.1-pro-preview --alt-model google/gemini-3.1-pro-preview --message '/think adaptive Reply exactly: GEMINI_ADAPTIVE_OK' --timeout-ms 180000`
  - Budget dinamico Gemini 2.5: `pnpm openclaw qa manual --provider-mode live-frontier --model google/gemini-2.5-flash --alt-model google/gemini-2.5-flash --message '/think adaptive Reply exactly: GEMINI25_ADAPTIVE_OK' --timeout-ms 180000`

Note:

- `google/...` usa l'API Gemini (chiave API).
- `google-antigravity/...` usa il bridge OAuth Antigravity (endpoint agente in stile Cloud Code Assist).
- `google-gemini-cli/...` usa la CLI Gemini locale sulla tua macchina (autenticazione separata + particolarità degli strumenti).
- Gemini API vs Gemini CLI:
  - API: OpenClaw chiama l'API Gemini ospitata da Google via HTTP (autenticazione con chiave API / profilo); questo è ciò che la maggior parte degli utenti intende con “Gemini”.
  - CLI: OpenClaw esegue un binario `gemini` locale; ha una sua autenticazione e può comportarsi in modo diverso (supporto streaming/tool/version skew).

## Live: matrice dei modelli (cosa copriamo)

Non esiste una “lista modelli CI” fissa (i live sono opt-in), ma questi sono i modelli **consigliati** da coprire regolarmente su una macchina di sviluppo con chiavi.

### Set smoke moderno (tool calling + immagine)

Questa è l'esecuzione dei “modelli comuni” che ci aspettiamo continui a funzionare:

- OpenAI (non-Codex): `openai/gpt-5.2`
- OAuth OpenAI Codex: `openai-codex/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evita i vecchi modelli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- DeepSeek: `deepseek/deepseek-v4-flash` e `deepseek/deepseek-v4-pro`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Esegui gateway smoke con strumenti + immagine:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.2,openai-codex/gpt-5.2,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,deepseek/deepseek-v4-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: tool calling (Read + Exec facoltativo)

Scegline almeno uno per famiglia di provider:

- OpenAI: `openai/gpt-5.2`
- Anthropic: `anthropic/claude-opus-4-6` (oppure `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oppure `google/gemini-3.1-pro-preview`)
- DeepSeek: `deepseek/deepseek-v4-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Copertura aggiuntiva facoltativa (utile da avere):

- xAI: `xai/grok-4` (o l'ultima disponibile)
- Mistral: `mistral/`… (scegli un modello compatibile con gli strumenti che hai abilitato)
- Cerebras: `cerebras/`… (se hai accesso)
- LM Studio: `lmstudio/`… (locale; il tool calling dipende dalla modalità API)

### Vision: invio immagine (allegato → messaggio multimodale)

Includi almeno un modello capace di immagini in `OPENCLAW_LIVE_GATEWAY_MODELS` (varianti con supporto vision di Claude/Gemini/OpenAI, ecc.) per esercitare la sonda immagine.

### Aggregatori / gateway alternativi

Se hai chiavi abilitate, supportiamo anche i test tramite:

- OpenRouter: `openrouter/...` (centinaia di modelli; usa `openclaw models scan` per trovare candidati compatibili con tool+immagine)
- OpenCode: `opencode/...` per Zen e `opencode-go/...` per Go (auth tramite `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Altri provider che puoi includere nella matrice live (se hai credenziali/configurazione):

- Incorporati: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Tramite `models.providers` (endpoint personalizzati): `minimax` (cloud/API), più qualsiasi proxy compatibile OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, ecc.)

Suggerimento: non cercare di codificare rigidamente “tutti i modelli” nella documentazione. L'elenco autorevole è qualunque cosa `discoverModels(...)` restituisca sulla tua macchina + qualunque chiave sia disponibile.

## Credenziali (mai fare commit)

I test live scoprono le credenziali nello stesso modo in cui lo fa la CLI. Implicazioni pratiche:

- Se la CLI funziona, i test live dovrebbero trovare le stesse chiavi.
- Se un test live dice “no creds”, fai debug nello stesso modo in cui faresti debug di `openclaw models list` / selezione del modello.

- Profili auth per agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (questo è ciò che nei test live significa “chiavi profilo”)
- Configurazione: `~/.openclaw/openclaw.json` (oppure `OPENCLAW_CONFIG_PATH`)
- Dir di stato legacy: `~/.openclaw/credentials/` (copiata nella home live temporanea quando presente, ma non è l'archivio principale delle chiavi profilo)
- Le esecuzioni live locali copiano per impostazione predefinita la configurazione attiva, i file `auth-profiles.json` per agente, `credentials/` legacy e le dir auth CLI esterne supportate in una home di test temporanea; le home live preparate saltano `workspace/` e `sandboxes/`, e gli override di percorso `agents.*.workspace` / `agentDir` vengono rimossi così che le sonde restino fuori dal tuo vero workspace host.

Se vuoi affidarti alle chiavi env (ad esempio esportate nel tuo `~/.profile`), esegui i test locali dopo `source ~/.profile`, oppure usa i runner Docker qui sotto (possono montare `~/.profile` nel container).

## Live: Deepgram (trascrizione audio)

- Test: `extensions/deepgram/audio.live.test.ts`
- Abilitazione: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live: piano di coding BytePlus

- Test: `extensions/byteplus/live.test.ts`
- Abilitazione: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Override facoltativo del modello: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live: media workflow ComfyUI

- Test: `extensions/comfy/comfy.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Ambito:
  - Esercita i percorsi immagine, video e `music_generate` di comfy inclusi nel bundle
  - Salta ogni capacità a meno che `plugins.entries.comfy.config.<capability>` non sia configurato
  - Utile dopo modifiche a invio workflow comfy, polling, download o registrazione del Plugin

## Live: generazione di immagini

- Test: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Ambito:
  - Enumera ogni Plugin provider di generazione immagini registrato
  - Carica le variabili env provider mancanti dalla tua shell di login (`~/.profile`) prima della sonda
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili auth memorizzati, così che chiavi di test obsolete in `auth-profiles.json` non mascherino le vere credenziali della shell
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue ogni provider configurato tramite il runtime condiviso di generazione immagini:
    - `<provider>:generate`
    - `<provider>:edit` quando il provider dichiara supporto per edit
- Provider inclusi nel bundle attualmente coperti:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `openrouter`
  - `vydra`
  - `xai`
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,openrouter,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,openrouter/google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,openrouter:generate,xai:default-generate,xai:default-edit"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l'auth dell'archivio profili e ignorare gli override solo env

Per il percorso CLI distribuito, aggiungi uno smoke `infer` dopo che il test live provider/runtime è passato:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_INFER_CLI_TEST=1 pnpm test:live -- test/image-generation.infer-cli.live.test.ts
openclaw infer image providers --json
openclaw infer image generate \
  --model google/gemini-3.1-flash-image-preview \
  --prompt "Minimal flat test image: one blue square on a white background, no text." \
  --output ./openclaw-infer-image-smoke.png \
  --json
```

Questo copre il parsing degli argomenti CLI, la risoluzione della config/dell'agente predefinito, l'attivazione dei Plugin inclusi nel bundle, la riparazione on-demand delle dipendenze runtime incluse nel bundle, il runtime condiviso di generazione immagini e la richiesta live al provider.

## Live: generazione musicale

- Test: `extensions/music-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Ambito:
  - Esercita il percorso condiviso dei provider di generazione musicale inclusi nel bundle
  - Attualmente copre Google e MiniMax
  - Carica le variabili env provider dalla tua shell di login (`~/.profile`) prima della sonda
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili auth memorizzati, così che chiavi di test obsolete in `auth-profiles.json` non mascherino le vere credenziali della shell
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue entrambe le modalità runtime dichiarate quando disponibili:
    - `generate` con input solo prompt
    - `edit` quando il provider dichiara `capabilities.edit.enabled`
  - Copertura attuale della lane condivisa:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy separato, non questo sweep condiviso
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.6"`
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l'auth dell'archivio profili e ignorare gli override solo env

## Live: generazione video

- Test: `extensions/video-generation-providers.live.test.ts`
- Abilitazione: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Ambito:
  - Esercita il percorso condiviso dei provider di generazione video inclusi nel bundle
  - Per impostazione predefinita usa il percorso smoke sicuro per le release: provider non-FAL, una richiesta text-to-video per provider, prompt da un secondo con aragosta e un limite operativo per provider da `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` per impostazione predefinita)
  - Salta FAL per impostazione predefinita perché la latenza della coda lato provider può dominare i tempi di release; passa `--video-providers fal` o `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` per eseguirlo esplicitamente
  - Carica le variabili env provider dalla tua shell di login (`~/.profile`) prima della sonda
  - Usa per impostazione predefinita le chiavi API live/env prima dei profili auth memorizzati, così che chiavi di test obsolete in `auth-profiles.json` non mascherino le vere credenziali della shell
  - Salta i provider senza auth/profilo/modello utilizzabili
  - Esegue solo `generate` per impostazione predefinita
  - Imposta `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` per eseguire anche le modalità di trasformazione dichiarate quando disponibili:
    - `imageToVideo` quando il provider dichiara `capabilities.imageToVideo.enabled` e il provider/modello selezionato accetta input immagine locale basato su buffer nello sweep condiviso
    - `videoToVideo` quando il provider dichiara `capabilities.videoToVideo.enabled` e il provider/modello selezionato accetta input video locale basato su buffer nello sweep condiviso
  - Provider `imageToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `vydra` perché `veo3` incluso nel bundle è solo testuale e `kling` incluso nel bundle richiede un URL immagine remoto
  - Copertura specifica provider Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - quel file esegue `veo3` text-to-video più una lane `kling` che usa per impostazione predefinita una fixture URL immagine remota
  - Copertura live attuale `videoToVideo`:
    - `runway` solo quando il modello selezionato è `runway/gen4_aleph`
  - Provider `videoToVideo` attualmente dichiarati ma saltati nello sweep condiviso:
    - `alibaba`, `qwen`, `xai` perché questi percorsi richiedono attualmente URL di riferimento remoti `http(s)` / MP4
    - `google` perché l'attuale lane condivisa Gemini/Veo usa input locale basato su buffer e quel percorso non è accettato nello sweep condiviso
    - `openai` perché l'attuale lane condivisa non garantisce l'accesso specifico per organizzazione al video inpaint/remix
- Restrizione facoltativa:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` per includere ogni provider nello sweep predefinito, incluso FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` per ridurre il limite operativo di ogni provider in una smoke run aggressiva
- Comportamento auth facoltativo:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` per forzare l'auth dell'archivio profili e ignorare gli override solo env

## Harness media live

- Comando: `pnpm test:live:media`
- Scopo:
  - Esegue le suite live condivise di immagini, musica e video tramite un unico entrypoint nativo del repository
  - Carica automaticamente le variabili env provider mancanti da `~/.profile`
  - Restringe automaticamente per impostazione predefinita ogni suite ai provider che attualmente hanno auth utilizzabile
  - Riusa `scripts/test-live.mjs`, così Heartbeat e comportamento quiet-mode restano coerenti
- Esempi:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Correlati

- [Testing](/it/help/testing) — suite unit, integration, QA e Docker
