---
read_when:
    - Vuoi eseguire OpenClaw con modelli open source tramite LM Studio
    - Vuoi configurare e impostare LM Studio
summary: Esegui OpenClaw con LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-13T08:27:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11264584e8277260d4215feb7c751329ce04f59e9228da1c58e147c21cd9ac2c
    source_path: providers/lmstudio.md
    workflow: 15
---

# LM Studio

LM Studio è un'app intuitiva ma potente per eseguire modelli open-weight sul tuo hardware. Ti consente di eseguire modelli llama.cpp (GGUF) o MLX (Apple Silicon). È disponibile come pacchetto GUI o come demone headless (`llmster`). Per la documentazione del prodotto e della configurazione, vedi [lmstudio.ai](https://lmstudio.ai/).

## Guida rapida

1. Installa LM Studio (desktop) oppure `llmster` (headless), quindi avvia il server locale:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Avvia il server

Assicurati di avviare l'app desktop oppure di eseguire il demone con il seguente comando:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Se stai usando l'app, assicurati di avere JIT abilitato per un'esperienza fluida. Scopri di più nella [guida JIT e TTL di LM Studio](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw richiede un valore di token LM Studio. Imposta `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Se l'autenticazione di LM Studio è disabilitata, usa qualsiasi valore di token non vuoto:

```bash
export LM_API_TOKEN="placeholder-key"
```

Per i dettagli sulla configurazione dell'autenticazione di LM Studio, vedi [Autenticazione di LM Studio](https://lmstudio.ai/docs/developer/core/authentication).

4. Esegui l'onboarding e scegli `LM Studio`:

```bash
openclaw onboard
```

5. Durante l'onboarding, usa il prompt `Default model` per scegliere il tuo modello LM Studio.

Puoi anche impostarlo o modificarlo in seguito:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Le chiavi dei modelli LM Studio seguono il formato `author/model-name` (ad esempio `qwen/qwen3.5-9b`). I riferimenti ai modelli di OpenClaw antepongono il nome del provider: `lmstudio/qwen/qwen3.5-9b`. Puoi trovare la chiave esatta di un modello eseguendo `curl http://localhost:1234/api/v1/models` e cercando il campo `key`.

## Onboarding non interattivo

Usa l'onboarding non interattivo quando vuoi automatizzare la configurazione (CI, provisioning, bootstrap remoto):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Oppure specifica URL di base o modello con chiave API:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` accetta la chiave del modello restituita da LM Studio (ad esempio `qwen/qwen3.5-9b`), senza il prefisso provider `lmstudio/`.

L'onboarding non interattivo richiede `--lmstudio-api-key` (oppure `LM_API_TOKEN` nell'ambiente).
Per i server LM Studio senza autenticazione, va bene qualsiasi valore di token non vuoto.

`--custom-api-key` rimane supportato per compatibilità, ma per LM Studio è preferibile `--lmstudio-api-key`.

Questo scrive `models.providers.lmstudio`, imposta il modello predefinito su
`lmstudio/<custom-model-id>` e scrive il profilo di autenticazione `lmstudio:default`.

La configurazione interattiva può richiedere una lunghezza di contesto di caricamento preferita facoltativa e la applica ai modelli LM Studio rilevati che salva nella configurazione.

## Configurazione

### Configurazione esplicita

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Risoluzione dei problemi

### LM Studio non rilevato

Assicurati che LM Studio sia in esecuzione e di avere impostato `LM_API_TOKEN` (per i server senza autenticazione, va bene qualsiasi valore di token non vuoto):

```bash
# Avvia tramite l'app desktop oppure in modalità headless:
lms server start --port 1234
```

Verifica che l'API sia accessibile:

```bash
curl http://localhost:1234/api/v1/models
```

### Errori di autenticazione (HTTP 401)

Se la configurazione segnala HTTP 401, verifica la tua chiave API:

- Controlla che `LM_API_TOKEN` corrisponda alla chiave configurata in LM Studio.
- Per i dettagli sulla configurazione dell'autenticazione di LM Studio, vedi [Autenticazione di LM Studio](https://lmstudio.ai/docs/developer/core/authentication).
- Se il tuo server non richiede autenticazione, usa qualsiasi valore di token non vuoto per `LM_API_TOKEN`.

### Caricamento del modello just-in-time

LM Studio supporta il caricamento dei modelli just-in-time (JIT), in cui i modelli vengono caricati alla prima richiesta. Assicurati di averlo abilitato per evitare errori di tipo "Model not loaded".
