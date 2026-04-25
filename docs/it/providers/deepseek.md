---
read_when:
    - Vuoi usare DeepSeek con OpenClaw
    - Hai bisogno della variabile env della chiave API o della scelta auth CLI
summary: Configurazione di DeepSeek (auth + selezione del modello)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-25T13:55:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fd89511faea8b961b7d6c5175143b9b8f0ba606ae24a49f276d9346de1cb8c3
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) fornisce potenti modelli AI con un'API compatibile con OpenAI.

| Proprietà | Valore                     |
| --------- | -------------------------- |
| Provider  | `deepseek`                 |
| Auth      | `DEEPSEEK_API_KEY`         |
| API       | Compatibile con OpenAI     |
| Base URL  | `https://api.deepseek.com` |

## Per iniziare

<Steps>
  <Step title="Ottieni la tua chiave API">
    Crea una chiave API su [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Questo ti chiederà la tua chiave API e imposterà `deepseek/deepseek-v4-flash` come modello predefinito.

  </Step>
  <Step title="Verifica che i modelli siano disponibili">
    ```bash
    openclaw models list --provider deepseek
    ```

    Per ispezionare il catalogo statico incluso senza richiedere un Gateway in esecuzione,
    usa:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configurazione non interattiva">
    Per installazioni scriptate o headless, passa direttamente tutti i flag:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `DEEPSEEK_API_KEY`
sia disponibile a quel processo (ad esempio in `~/.openclaw/.env` o tramite
`env.shellEnv`).
</Warning>

## Catalogo integrato

| Ref modello                  | Nome              | Input | Contesto  | Output max | Note                                       |
| ---------------------------- | ----------------- | ----- | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text  | 1,000,000 | 384,000    | Modello predefinito; superficie V4 con capability di thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text  | 1,000,000 | 384,000    | Superficie V4 con capability di thinking   |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text  | 131,072   | 8,192      | Superficie non-thinking DeepSeek V3.2      |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text  | 131,072   | 65,536     | Superficie V3.2 con reasoning abilitato    |

<Tip>
I modelli V4 supportano il controllo `thinking` di DeepSeek. OpenClaw riproduce anche
`reasoning_content` di DeepSeek nei turni successivi così le sessioni di thinking con chiamate agli
strumenti possono continuare.
</Tip>

## Thinking e strumenti

Le sessioni di thinking DeepSeek V4 hanno un contratto di replay più rigido rispetto alla maggior parte dei
provider compatibili con OpenAI: quando un messaggio assistant con thinking abilitato include
chiamate agli strumenti, DeepSeek si aspetta che il precedente `reasoning_content` dell'assistant venga
reinviato nella richiesta successiva. OpenClaw gestisce questo all'interno del Plugin DeepSeek,
quindi il normale uso multi-turn degli strumenti funziona con `deepseek/deepseek-v4-flash` e
`deepseek/deepseek-v4-pro`.

Se passi una sessione esistente da un altro provider compatibile con OpenAI a un
modello DeepSeek V4, i turni più vecchi di chiamata strumenti dell'assistant potrebbero non avere il nativo
`reasoning_content` di DeepSeek. OpenClaw riempie quel campo mancante per le richieste DeepSeek V4
con thinking così il provider può accettare la cronologia di chiamata strumenti riprodotta
senza richiedere `/new`.

Quando il thinking è disabilitato in OpenClaw (inclusa la selezione **None** nella UI),
OpenClaw invia DeepSeek `thinking: { type: "disabled" }` e rimuove il
`reasoning_content` riprodotto dalla cronologia in uscita. Questo mantiene le sessioni con
thinking disabilitato sul percorso DeepSeek senza thinking.

Usa `deepseek/deepseek-v4-flash` per il percorso veloce predefinito. Usa
`deepseek/deepseek-v4-pro` quando vuoi il modello V4 più forte e puoi accettare
costo o latenza maggiori.

## Test live

La suite live diretta dei modelli include DeepSeek V4 nel set dei modelli moderni. Per
eseguire solo i controlli direct-model di DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Questo controllo live verifica che entrambi i modelli V4 possano completare e che i turni successivi di thinking/strumenti preservino il payload di replay richiesto da DeepSeek.

## Esempio di configurazione

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, ref dei modelli e comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione per agenti, modelli e provider.
  </Card>
</CardGroup>
