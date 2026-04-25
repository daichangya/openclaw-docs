---
read_when:
    - Vuoi una configurazione guidata per gateway, workspace, autenticazione, canali e Skills
summary: Riferimento CLI per `openclaw onboard` (onboarding interattivo)
title: Onboarding
x-i18n:
    generated_at: "2026-04-25T13:44:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 234c308ea554195df1bd880bda7e30770e926af059740458d056e4a909aaeb07
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Onboarding interattivo per la configurazione del Gateway locale o remoto.

## Guide correlate

- Hub onboarding CLI: [Onboarding (CLI)](/it/start/wizard)
- Panoramica dell'onboarding: [Panoramica dell'onboarding](/it/start/onboarding-overview)
- Riferimento onboarding CLI: [Riferimento configurazione CLI](/it/start/wizard-cli-reference)
- Automazione CLI: [Automazione CLI](/it/start/wizard-cli-automation)
- Onboarding macOS: [Onboarding (app macOS)](/it/start/onboarding)

## Esempi

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--modern` avvia l'anteprima dell'onboarding conversazionale Crestodian. Senza
`--modern`, `openclaw onboard` mantiene il flusso di onboarding classico.

Per target `ws://` in rete privata in chiaro (solo reti attendibili), imposta
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` nell'ambiente del processo di onboarding.
Non esiste un equivalente in `openclaw.json` per questo meccanismo lato client
di emergenza.

Provider personalizzato non interattivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` è facoltativo in modalità non interattiva. Se omesso, l'onboarding controlla `CUSTOM_API_KEY`.

LM Studio supporta anche un flag chiave specifico del provider in modalità non interattiva:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama non interattivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` ha come valore predefinito `http://127.0.0.1:11434`. `--custom-model-id` è facoltativo; se omesso, l'onboarding usa i valori predefiniti suggeriti da Ollama. Anche gli ID modello cloud come `kimi-k2.5:cloud` funzionano qui.

Memorizza le chiavi del provider come ref invece che in chiaro:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Con `--secret-input-mode ref`, l'onboarding scrive ref supportati da env invece che valori chiave in chiaro.
Per i provider supportati da profilo di autenticazione, questo scrive voci `keyRef`; per i provider personalizzati, questo scrive `models.providers.<id>.apiKey` come ref env (ad esempio `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Contratto della modalità non interattiva `ref`:

- Imposta la variabile env del provider nell'ambiente del processo di onboarding (ad esempio `OPENAI_API_KEY`).
- Non passare flag chiave inline (ad esempio `--openai-api-key`) a meno che anche quella variabile env non sia impostata.
- Se viene passato un flag chiave inline senza la variabile env richiesta, l'onboarding fallisce immediatamente con indicazioni.

Opzioni del token Gateway in modalità non interattiva:

- `--gateway-auth token --gateway-token <token>` memorizza un token in chiaro.
- `--gateway-auth token --gateway-token-ref-env <name>` memorizza `gateway.auth.token` come env SecretRef.
- `--gateway-token` e `--gateway-token-ref-env` si escludono a vicenda.
- `--gateway-token-ref-env` richiede una variabile env non vuota nell'ambiente del processo di onboarding.
- Con `--install-daemon`, quando l'autenticazione token richiede un token, i token Gateway gestiti da SecretRef vengono convalidati ma non persistiti come testo in chiaro risolto nei metadati dell'ambiente del servizio supervisor.
- Con `--install-daemon`, se la modalità token richiede un token e il SecretRef del token configurato non è risolto, l'onboarding fallisce in modalità fail-closed con indicazioni per la risoluzione.
- Con `--install-daemon`, se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` e `gateway.auth.mode` non è impostato, l'onboarding blocca l'installazione finché la modalità non viene impostata esplicitamente.
- L'onboarding locale scrive `gateway.mode="local"` nella configurazione. Se un file di configurazione successivo non contiene `gateway.mode`, trattalo come configurazione danneggiata o modifica manuale incompleta, non come scorciatoia valida per la modalità locale.
- `--allow-unconfigured` è un meccanismo di emergenza separato del runtime Gateway. Non significa che l'onboarding possa omettere `gateway.mode`.

Esempio:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Integrità del Gateway locale non interattivo:

- A meno che non passi `--skip-health`, l'onboarding attende che un Gateway locale raggiungibile sia disponibile prima di terminare con successo.
- `--install-daemon` avvia prima il percorso di installazione del Gateway gestito. Senza di esso, devi già avere un Gateway locale in esecuzione, ad esempio `openclaw gateway run`.
- Se vuoi solo scritture di configurazione/workspace/bootstrap in automazione, usa `--skip-health`.
- Se gestisci tu stesso i file del workspace, passa `--skip-bootstrap` per impostare `agents.defaults.skipBootstrap: true` e saltare la creazione di `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` e `BOOTSTRAP.md`.
- Su Windows nativo, `--install-daemon` prova prima Scheduled Tasks e usa come fallback un elemento di accesso per utente nella cartella Startup se la creazione del task viene negata.

Comportamento dell'onboarding interattivo con modalità reference:

- Scegli **Usa riferimento segreto** quando richiesto.
- Quindi scegli una delle due opzioni:
  - Variabile d'ambiente
  - Provider segreto configurato (`file` o `exec`)
- L'onboarding esegue una rapida convalida preliminare prima di salvare il ref.
  - Se la convalida fallisce, l'onboarding mostra l'errore e ti consente di riprovare.

Scelte endpoint Z.AI non interattive:

Nota: `--auth-choice zai-api-key` ora rileva automaticamente il miglior endpoint Z.AI per la tua chiave (preferisce l'API generale con `zai/glm-5.1`).
Se vuoi specificamente gli endpoint GLM Coding Plan, scegli `zai-coding-global` o `zai-coding-cn`.

```bash
# Selezione endpoint senza prompt
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Altre scelte endpoint Z.AI:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Esempio Mistral non interattivo:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Note sui flussi:

- `quickstart`: prompt minimi, genera automaticamente un token Gateway.
- `manual`: prompt completi per porta/bind/auth (alias di `advanced`).
- Quando una scelta di autenticazione implica un provider preferito, l'onboarding prefiltra i selettori di modello predefinito e allowlist su quel provider. Per Volcengine e BytePlus, questo corrisponde anche alle varianti coding-plan
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Se il filtro del provider preferito non restituisce ancora alcun modello caricato, l'onboarding torna al catalogo non filtrato invece di lasciare il selettore vuoto.
- Nel passaggio di web search, alcuni provider possono attivare prompt di follow-up specifici del provider:
  - **Grok** può offrire la configurazione facoltativa di `x_search` con la stessa `XAI_API_KEY`
    e una scelta del modello `x_search`.
  - **Kimi** può chiedere la regione API Moonshot (`api.moonshot.ai` vs
    `api.moonshot.cn`) e il modello predefinito di web search Kimi.
- Comportamento dell'ambito DM nell'onboarding locale: [Riferimento configurazione CLI](/it/start/wizard-cli-reference#outputs-and-internals).
- Prima chat più veloce: `openclaw dashboard` (Control UI, nessuna configurazione del canale).
- Provider personalizzato: connetti qualsiasi endpoint compatibile con OpenAI o Anthropic,
  inclusi provider ospitati non elencati. Usa Unknown per il rilevamento automatico.

## Comandi di follow-up comuni

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` non implica la modalità non interattiva. Usa `--non-interactive` per gli script.
</Note>
