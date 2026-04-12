---
read_when:
    - Vuoi un'unica chiave API per molti LLM
    - Hai bisogno di indicazioni per la configurazione di Baidu Qianfan
summary: Usa l'API unificata di Qianfan per accedere a molti modelli in OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-12T23:32:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d0eeee9ec24b335c2fb8ac5e985a9edc35cfc5b2641c545cb295dd2de619f50
    source_path: providers/qianfan.md
    workflow: 15
---

# Qianfan

Qianfan è la piattaforma MaaS di Baidu e fornisce un'**API unificata** che instrada le richieste verso molti modelli dietro un unico endpoint e una singola chiave API. È compatibile con OpenAI, quindi la maggior parte degli SDK OpenAI funziona cambiando l'URL di base.

| Proprietà | Valore                            |
| --------- | --------------------------------- |
| Provider  | `qianfan`                         |
| Auth      | `QIANFAN_API_KEY`                 |
| API       | Compatibile con OpenAI            |
| URL base  | `https://qianfan.baidubce.com/v2` |

## Per iniziare

<Steps>
  <Step title="Crea un account Baidu Cloud">
    Registrati o accedi alla [Console Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) e assicurati di avere abilitato l'accesso all'API Qianfan.
  </Step>
  <Step title="Genera una chiave API">
    Crea una nuova applicazione o selezionane una esistente, quindi genera una chiave API. Il formato della chiave è `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Modelli disponibili

| Riferimento modello                  | Input        | Contesto | Output max | Reasoning | Note              |
| ------------------------------------ | ------------ | -------- | ---------- | --------- | ----------------- |
| `qianfan/deepseek-v3.2`              | testo        | 98,304   | 32,768     | Sì        | Modello predefinito |
| `qianfan/ernie-5.0-thinking-preview` | testo, immagine | 119,000 | 64,000     | Sì        | Multimodale       |

<Tip>
Il riferimento di modello integrato predefinito è `qianfan/deepseek-v3.2`. Devi sovrascrivere `models.providers.qianfan` solo quando ti serve un URL base personalizzato o metadati modello personalizzati.
</Tip>

## Esempio di configurazione

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Trasporto e compatibilità">
    Qianfan usa il percorso di trasporto compatibile con OpenAI, non la composizione nativa delle richieste OpenAI. Questo significa che le funzionalità standard degli SDK OpenAI funzionano, ma i parametri specifici del provider potrebbero non essere inoltrati.
  </Accordion>

  <Accordion title="Catalogo e override">
    Il catalogo integrato attualmente include `deepseek-v3.2` e `ernie-5.0-thinking-preview`. Aggiungi o sovrascrivi `models.providers.qianfan` solo quando ti serve un URL base personalizzato o metadati modello personalizzati.

    <Note>
    I riferimenti dei modelli usano il prefisso `qianfan/` (ad esempio `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Assicurati che la tua chiave API inizi con `bce-v3/ALTAK-` e che l'accesso all'API Qianfan sia abilitato nella console Baidu Cloud.
    - Se i modelli non vengono elencati, verifica che il tuo account abbia il servizio Qianfan attivato.
    - L'URL base predefinito è `https://qianfan.baidubce.com/v2`. Modificalo solo se usi un endpoint o un proxy personalizzato.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Riferimento configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione di OpenClaw.
  </Card>
  <Card title="Configurazione dell'agente" href="/it/concepts/agent" icon="robot">
    Configurazione dei valori predefiniti dell'agente e assegnazione dei modelli.
  </Card>
  <Card title="Documentazione API Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Documentazione ufficiale dell'API Qianfan.
  </Card>
</CardGroup>
