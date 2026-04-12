---
read_when:
    - Vuoi i modelli Xiaomi MiMo in OpenClaw
    - Hai bisogno della configurazione di `XIAOMI_API_KEY`
summary: Usa i modelli Xiaomi MiMo con OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-12T23:33:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd5a526764c796da7e1fff61301bc2ec618e1cf3857894ba2ef4b6dd9c4dc339
    source_path: providers/xiaomi.md
    workflow: 15
---

# Xiaomi MiMo

Xiaomi MiMo è la piattaforma API per i modelli **MiMo**. OpenClaw usa l'endpoint
Xiaomi compatibile con OpenAI con autenticazione tramite chiave API.

| Proprietà | Valore                          |
| --------- | ------------------------------- |
| Provider  | `xiaomi`                        |
| Auth      | `XIAOMI_API_KEY`                |
| API       | compatibile con OpenAI          |
| URL di base | `https://api.xiaomimimo.com/v1` |

## Per iniziare

<Steps>
  <Step title="Ottieni una chiave API">
    Crea una chiave API nella [console Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    Oppure passa direttamente la chiave:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Modelli disponibili

| Model ref              | Input       | Contesto  | Output massimo | Ragionamento | Note             |
| ---------------------- | ----------- | --------- | -------------- | ------------ | ---------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192          | No           | Modello predefinito |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000         | Sì           | Contesto ampio   |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000         | Sì           | Multimodale      |

<Tip>
Il model ref predefinito è `xiaomi/mimo-v2-flash`. Il provider viene inserito automaticamente quando `XIAOMI_API_KEY` è impostato o esiste un profilo di autenticazione.
</Tip>

## Esempio di configurazione

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Comportamento di inserimento automatico">
    Il provider `xiaomi` viene inserito automaticamente quando `XIAOMI_API_KEY` è impostato nel tuo ambiente o esiste un profilo di autenticazione. Non devi configurare manualmente il provider a meno che tu non voglia sovrascrivere i metadati del modello o l'URL di base.
  </Accordion>

  <Accordion title="Dettagli dei modelli">
    - **mimo-v2-flash** — leggero e veloce, ideale per attività di testo generiche. Nessun supporto al ragionamento.
    - **mimo-v2-pro** — supporta il ragionamento con una finestra di contesto di 1M token per carichi di lavoro su documenti lunghi.
    - **mimo-v2-omni** — modello multimodale con ragionamento abilitato che accetta input sia testuali sia di immagini.

    <Note>
    Tutti i modelli usano il prefisso `xiaomi/` (per esempio `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Se i modelli non compaiono, verifica che `XIAOMI_API_KEY` sia impostato e valido.
    - Quando il Gateway è in esecuzione come daemon, assicurati che la chiave sia disponibile a quel processo (per esempio in `~/.openclaw/.env` o tramite `env.shellEnv`).

    <Warning>
    Le chiavi impostate solo nella tua shell interattiva non sono visibili ai processi gateway gestiti come daemon. Usa `~/.openclaw/.env` o la configurazione `env.shellEnv` per una disponibilità persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, model ref e comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration" icon="gear">
    Riferimento completo della configurazione OpenClaw.
  </Card>
  <Card title="Console Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Dashboard Xiaomi MiMo e gestione delle chiavi API.
  </Card>
</CardGroup>
