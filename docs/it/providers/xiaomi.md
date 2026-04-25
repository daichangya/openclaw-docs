---
read_when:
    - Vuoi usare i modelli Xiaomi MiMo in OpenClaw
    - Ti serve la configurazione di `XIAOMI_API_KEY`
summary: Usa i modelli Xiaomi MiMo con OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-25T13:56:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo è la piattaforma API per i modelli **MiMo**. OpenClaw usa l'endpoint compatibile con OpenAI di Xiaomi con autenticazione tramite chiave API.

| Proprietà | Valore                          |
| --------- | ------------------------------- |
| Provider  | `xiaomi`                        |
| Auth      | `XIAOMI_API_KEY`                |
| API       | Compatibile con OpenAI          |
| URL base  | `https://api.xiaomimimo.com/v1` |

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

## Catalogo integrato

| Riferimento modello   | Input       | Contesto  | Output max | Reasoning | Note          |
| --------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | testo      | 262,144   | 8,192      | No        | Modello predefinito |
| `xiaomi/mimo-v2-pro`   | testo      | 1,048,576 | 32,000     | Sì        | Contesto ampio |
| `xiaomi/mimo-v2-omni`  | testo, immagine | 262,144 | 32,000     | Sì        | Multimodale   |

<Tip>
Il riferimento modello predefinito è `xiaomi/mimo-v2-flash`. Il provider viene inserito automaticamente quando `XIAOMI_API_KEY` è impostata o esiste un profilo di autenticazione.
</Tip>

## Sintesi vocale

Il Plugin `xiaomi` incluso registra anche Xiaomi MiMo come provider vocale per
`messages.tts`. Chiama il contratto TTS chat-completions di Xiaomi con il testo come
messaggio `assistant` e indicazioni di stile facoltative come messaggio `user`.

| Proprietà | Valore                                   |
| --------- | ---------------------------------------- |
| ID TTS    | `xiaomi` (`mimo` alias)                  |
| Auth      | `XIAOMI_API_KEY`                         |
| API       | `POST /v1/chat/completions` con `audio`  |
| Predefinito | `mimo-v2.5-tts`, voce `mimo_default`   |
| Output    | MP3 per impostazione predefinita; WAV se configurato |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Le voci integrate supportate includono `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` e `Dean`. `mimo-v2-tts` è supportato per gli account MiMo
TTS meno recenti; l'impostazione predefinita usa l'attuale modello TTS MiMo-V2.5. Per le destinazioni di note vocali
come Feishu e Telegram, OpenClaw ricodifica l'output Xiaomi in Opus a 48kHz
con `ffmpeg` prima della consegna.

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
    Il provider `xiaomi` viene inserito automaticamente quando `XIAOMI_API_KEY` è impostata nel tuo ambiente o esiste un profilo di autenticazione. Non è necessario configurare manualmente il provider a meno che tu non voglia sovrascrivere i metadati del modello o l'URL base.
  </Accordion>

  <Accordion title="Dettagli del modello">
    - **mimo-v2-flash** — leggero e veloce, ideale per attività di testo generiche. Nessun supporto per il reasoning.
    - **mimo-v2-pro** — supporta il reasoning con una finestra di contesto da 1M token per carichi di lavoro su documenti lunghi.
    - **mimo-v2-omni** — modello multimodale con reasoning abilitato che accetta input sia di testo sia di immagini.

    <Note>
    Tutti i modelli usano il prefisso `xiaomi/` (ad esempio `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Se i modelli non compaiono, conferma che `XIAOMI_API_KEY` sia impostata e valida.
    - Quando il Gateway è in esecuzione come demone, assicurati che la chiave sia disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite `env.shellEnv`).

    <Warning>
    Le chiavi impostate solo nella shell interattiva non sono visibili ai processi Gateway gestiti come demone. Usa `~/.openclaw/.env` o la configurazione `env.shellEnv` per una disponibilità persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Riferimento completo della configurazione di OpenClaw.
  </Card>
  <Card title="Console Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Dashboard Xiaomi MiMo e gestione delle chiavi API.
  </Card>
</CardGroup>
