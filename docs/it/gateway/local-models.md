---
read_when:
    - Vuoi servire modelli dal tuo box GPU personale
    - Stai configurando LM Studio o un proxy compatibile con OpenAI
    - Hai bisogno della guida più sicura per i modelli locali
summary: Esegui OpenClaw su LLM locali (LM Studio, vLLM, LiteLLM, endpoint OpenAI personalizzati)
title: Modelli locali
x-i18n:
    generated_at: "2026-04-13T08:27:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ecb61b3e6e34d3666f9b688cd694d92c5fb211cf8c420fa876f7ccf5789154a
    source_path: gateway/local-models.md
    workflow: 15
---

# Modelli locali

Il locale è fattibile, ma OpenClaw si aspetta un contesto ampio + forti difese contro il prompt injection. Le schede piccole troncano il contesto e indeboliscono la sicurezza. Punta in alto: **≥2 Mac Studio al massimo della configurazione o una macchina GPU equivalente (~30.000$+)**. Una singola GPU da **24 GB** funziona solo per prompt più leggeri con latenza più alta. Usa la **variante di modello più grande / a dimensione piena che puoi eseguire**; checkpoint fortemente quantizzati o “small” aumentano il rischio di prompt injection (vedi [Sicurezza](/it/gateway/security)).

Se vuoi la configurazione locale con meno attrito, inizia con [LM Studio](/it/providers/lmstudio) o [Ollama](/it/providers/ollama) e `openclaw onboard`. Questa pagina è la guida con opinioni precise per stack locali di fascia più alta e server locali personalizzati compatibili con OpenAI.

## Consigliato: LM Studio + grande modello locale (API Responses)

La migliore stack locale attuale. Carica un modello grande in LM Studio (per esempio, una build completa di Qwen, DeepSeek o Llama), abilita il server locale (predefinito `http://127.0.0.1:1234`), e usa l’API Responses per mantenere il ragionamento separato dal testo finale.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Modello locale”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Checklist di configurazione**

- Installa LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- In LM Studio, scarica la **build del modello più grande disponibile** (evita varianti “small”/fortemente quantizzate), avvia il server, conferma che `http://127.0.0.1:1234/v1/models` lo elenchi.
- Sostituisci `my-local-model` con l’ID modello effettivo mostrato in LM Studio.
- Mantieni il modello caricato; il caricamento a freddo aggiunge latenza di avvio.
- Regola `contextWindow`/`maxTokens` se la tua build di LM Studio è diversa.
- Per WhatsApp, mantieni l’API Responses così viene inviato solo il testo finale.

Mantieni configurati anche i modelli ospitati quando esegui in locale; usa `models.mode: "merge"` così i fallback restano disponibili.

### Configurazione ibrida: primario ospitato, fallback locale

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Modello locale",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Locale come prima scelta con rete di sicurezza ospitata

Inverti l’ordine di primario e fallback; mantieni lo stesso blocco `providers` e `models.mode: "merge"` così puoi ripiegare su Sonnet o Opus quando la macchina locale non è disponibile.

### Hosting regionale / instradamento dei dati

- Varianti MiniMax/Kimi/GLM ospitate esistono anche su OpenRouter con endpoint vincolati alla regione (ad esempio ospitati negli Stati Uniti). Scegli lì la variante regionale per mantenere il traffico nella giurisdizione desiderata continuando a usare `models.mode: "merge"` per i fallback Anthropic/OpenAI.
- Solo locale resta il percorso più forte per la privacy; l’instradamento regionale ospitato è la via di mezzo quando ti servono funzionalità del provider ma vuoi controllare il flusso dei dati.

## Altri proxy locali compatibili con OpenAI

vLLM, LiteLLM, OAI-proxy o gateway personalizzati funzionano se espongono un endpoint `/v1` in stile OpenAI. Sostituisci il blocco provider sopra con il tuo endpoint e il tuo ID modello:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Modello locale",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Mantieni `models.mode: "merge"` così i modelli ospitati restano disponibili come fallback.

Nota sul comportamento per backend locali/proxy `/v1`:

- OpenClaw li tratta come route proxy compatibili con OpenAI, non come endpoint OpenAI nativi
- qui non si applica il modellamento delle richieste riservato a OpenAI nativo: niente `service_tier`, niente `store` di Responses, niente modellamento del payload di compatibilità del ragionamento OpenAI e niente suggerimenti per la cache dei prompt
- gli header di attribuzione nascosti di OpenClaw (`originator`, `version`, `User-Agent`) non vengono iniettati su questi URL proxy personalizzati

Note di compatibilità per backend compatibili con OpenAI più restrittivi:

- Alcuni server accettano solo `messages[].content` come stringa nelle Chat Completions, non array strutturati di content part. Imposta `models.providers.<provider>.models[].compat.requiresStringContent: true` per quegli endpoint.
- Alcuni backend locali più piccoli o più restrittivi sono instabili con la forma completa del prompt del runtime agent di OpenClaw, soprattutto quando sono inclusi schemi di tool. Se il backend funziona per piccole chiamate dirette a `/v1/chat/completions` ma fallisce nei normali turni agente di OpenClaw, prova prima con `models.providers.<provider>.models[].compat.supportsTools: false`.
- Se il backend continua a fallire solo su esecuzioni OpenClaw più grandi, il problema rimanente di solito è la capacità del modello/server a monte o un bug del backend, non il livello di trasporto di OpenClaw.

## Risoluzione dei problemi

- Il Gateway riesce a raggiungere il proxy? `curl http://127.0.0.1:1234/v1/models`.
- Modello LM Studio scaricato dalla memoria? Ricaricalo; l’avvio a freddo è una causa comune di “blocco”.
- Errori di contesto? Riduci `contextWindow` o aumenta il limite del tuo server.
- Il server compatibile con OpenAI restituisce `messages[].content ... expected a string`? Aggiungi `compat.requiresStringContent: true` a quella voce del modello.
- Piccole chiamate dirette a `/v1/chat/completions` funzionano, ma `openclaw infer model run` fallisce su Gemma o un altro modello locale? Disabilita prima gli schemi di tool con `compat.supportsTools: false`, poi riprova. Se il server continua a bloccarsi solo su prompt OpenClaw più grandi, trattalo come un limite del server/modello a monte.
- Sicurezza: i modelli locali saltano i filtri lato provider; mantieni gli agenti limitati e Compaction attivo per ridurre il raggio d’impatto del prompt injection.
