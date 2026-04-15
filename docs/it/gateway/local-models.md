---
read_when:
    - Vuoi servire modelli dal tuo server GPU personale
    - Stai configurando LM Studio o un proxy compatibile con OpenAI
    - Hai bisogno della guida più sicura per i modelli locali
summary: Esegui OpenClaw su LLM locali (LM Studio, vLLM, LiteLLM, endpoint OpenAI personalizzati)
title: Modelli locali
x-i18n:
    generated_at: "2026-04-15T08:18:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8778cc1c623a356ff3cf306c494c046887f9417a70ec71e659e4a8aae912a780
    source_path: gateway/local-models.md
    workflow: 15
---

# Modelli locali

Usare modelli locali è fattibile, ma OpenClaw si aspetta un contesto ampio e difese solide contro la prompt injection. Le schede più piccole troncano il contesto e indeboliscono la sicurezza. Punta in alto: **≥2 Mac Studio al massimo della configurazione o una workstation GPU equivalente (~$30k+)**. Una singola GPU da **24 GB** funziona solo per prompt più leggeri con latenza più alta. Usa la **variante di modello più grande / full-size che riesci a eseguire**; checkpoint fortemente quantizzati o “small” aumentano il rischio di prompt injection (vedi [Sicurezza](/it/gateway/security)).

Se vuoi la configurazione locale con meno attrito, inizia con [LM Studio](/it/providers/lmstudio) o [Ollama](/it/providers/ollama) e `openclaw onboard`. Questa pagina è la guida con indicazioni precise per stack locali di fascia alta e server locali personalizzati compatibili con OpenAI.

## Consigliato: LM Studio + modello locale grande (API Responses)

Il miglior stack locale attuale. Carica un modello grande in LM Studio (per esempio, una build full-size di Qwen, DeepSeek o Llama), abilita il server locale (predefinito `http://127.0.0.1:1234`) e usa l'API Responses per mantenere il ragionamento separato dal testo finale.

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
            name: “Local Model”,
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
- In LM Studio, scarica la **build del modello più grande disponibile** (evita varianti “small”/fortemente quantizzate), avvia il server e conferma che `http://127.0.0.1:1234/v1/models` lo elenchi.
- Sostituisci `my-local-model` con l'ID effettivo del modello mostrato in LM Studio.
- Mantieni il modello caricato; il caricamento a freddo aggiunge latenza di avvio.
- Regola `contextWindow`/`maxTokens` se la tua build di LM Studio è diversa.
- Per WhatsApp, resta sull'API Responses così viene inviato solo il testo finale.

Mantieni configurati anche i modelli ospitati anche quando esegui modelli locali; usa `models.mode: "merge"` così i fallback restano disponibili.

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
            name: "Local Model",
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

### Priorità al locale con rete di sicurezza ospitata

Inverti l'ordine di primario e fallback; mantieni lo stesso blocco `providers` e `models.mode: "merge"` così puoi ripiegare su Sonnet o Opus quando il sistema locale non è disponibile.

### Hosting regionale / instradamento dei dati

- Varianti ospitate di MiniMax/Kimi/GLM esistono anche su OpenRouter con endpoint vincolati alla regione (ad esempio ospitati negli Stati Uniti). Scegli lì la variante regionale per mantenere il traffico nella giurisdizione scelta continuando a usare `models.mode: "merge"` per i fallback Anthropic/OpenAI.
- Solo locale resta il percorso più forte per la privacy; l'instradamento regionale ospitato è il compromesso intermedio quando ti servono funzionalità del provider ma vuoi controllare il flusso dei dati.

## Altri proxy locali compatibili con OpenAI

vLLM, LiteLLM, OAI-proxy o gateway personalizzati funzionano se espongono un endpoint `/v1` in stile OpenAI. Sostituisci il blocco provider sopra con il tuo endpoint e l'ID del modello:

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
            name: "Local Model",
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

Nota sul comportamento per backend locali/proxati `/v1`:

- OpenClaw li tratta come route proxy in stile OpenAI compatibili, non come endpoint OpenAI nativi
- il formato delle richieste riservato a OpenAI nativo non si applica qui: niente
  `service_tier`, niente `store` di Responses, niente formattazione del payload di compatibilità del ragionamento OpenAI
  e nessun suggerimento per la cache del prompt
- gli header nascosti di attribuzione di OpenClaw (`originator`, `version`, `User-Agent`)
  non vengono iniettati su questi URL proxy personalizzati

Note di compatibilità per backend compatibili con OpenAI più rigidi:

- Alcuni server accettano solo `messages[].content` come stringa su Chat Completions, non
  array strutturati di parti di contenuto. Imposta
  `models.providers.<provider>.models[].compat.requiresStringContent: true` per
  quegli endpoint.
- Alcuni backend locali più piccoli o più rigidi sono instabili con la forma completa
  del prompt del runtime agente di OpenClaw, specialmente quando sono inclusi gli schema degli strumenti. Se il
  backend funziona per piccole chiamate dirette a `/v1/chat/completions` ma fallisce nei normali
  turni agente di OpenClaw, prova prima
  `agents.defaults.localModelMode: "lean"` per rimuovere gli strumenti predefiniti più pesanti
  come `browser`, `cron` e `message`; se ancora non funziona, prova
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Se il backend continua a fallire solo in esecuzioni OpenClaw più grandi, il problema restante
  di solito è la capacità del modello/server a monte o un bug del backend, non il layer di trasporto di OpenClaw.

## Risoluzione dei problemi

- Il Gateway riesce a raggiungere il proxy? `curl http://127.0.0.1:1234/v1/models`.
- Il modello LM Studio è stato scaricato dalla memoria? Ricaricalo; l'avvio a freddo è una causa comune di “blocco”.
- OpenClaw avvisa quando la finestra di contesto rilevata è sotto **32k** e blocca sotto **16k**. Se incontri quel controllo preliminare, aumenta il limite di contesto del server/modello o scegli un modello più grande.
- Errori di contesto? Riduci `contextWindow` o aumenta il limite del tuo server.
- Il server compatibile con OpenAI restituisce `messages[].content ... expected a string`?
  Aggiungi `compat.requiresStringContent: true` in quella voce del modello.
- Piccole chiamate dirette a `/v1/chat/completions` funzionano, ma `openclaw infer model run`
  fallisce con Gemma o un altro modello locale? Disabilita prima gli schema degli strumenti con
  `compat.supportsTools: false`, poi riprova. Se il server continua a bloccarsi solo
  con prompt OpenClaw più grandi, trattalo come un limite del modello/server a monte.
- Sicurezza: i modelli locali saltano i filtri lato provider; mantieni gli agenti limitati e Compaction attivo per ridurre il raggio d'azione della prompt injection.
