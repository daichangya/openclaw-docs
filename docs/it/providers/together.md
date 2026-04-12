---
read_when:
    - Vuoi usare Together AI con OpenClaw
    - Ti serve la variabile d'ambiente della chiave API o la scelta di auth della CLI
summary: Configurazione di Together AI (auth + selezione del modello)
title: Together AI
x-i18n:
    generated_at: "2026-04-12T23:32:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 33531a1646443ac2e46ee1fbfbb60ec71093611b022618106e8e5435641680ac
    source_path: providers/together.md
    workflow: 15
---

# Together AI

[Together AI](https://together.ai) fornisce accesso ai principali modelli
open-source, tra cui Llama, DeepSeek, Kimi e altri, tramite un'API unificata.

| Property | Value                         |
| -------- | ----------------------------- |
| Provider | `together`                    |
| Auth     | `TOGETHER_API_KEY`            |
| API      | Compatibile con OpenAI        |
| Base URL | `https://api.together.xyz/v1` |

## Per iniziare

<Steps>
  <Step title="Ottieni una chiave API">
    Crea una chiave API su
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Imposta un modello predefinito">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Esempio non interattivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
Il preset di onboarding imposta `together/moonshotai/Kimi-K2.5` come modello
predefinito.
</Note>

## Catalogo integrato

OpenClaw include questo catalogo Together integrato:

| Model ref                                                    | Name                                   | Input       | Context    | Notes                              |
| ------------------------------------------------------------ | -------------------------------------- | ----------- | ---------- | ---------------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                              | testo, immagine | 262,144    | Modello predefinito; ragionamento abilitato |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                            | testo       | 202,752    | Modello di testo generico          |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo           | testo       | 131,072    | Modello instruction veloce         |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct         | testo, immagine | 10,000,000 | Multimodale                        |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | testo, immagine | 20,000,000 | Multimodale                        |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                          | testo       | 131,072    | Modello di testo generico          |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                            | testo       | 131,072    | Modello di ragionamento            |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                  | testo       | 262,144    | Modello di testo Kimi secondario   |

## Generazione video

Il Plugin `together` integrato registra anche la generazione video tramite lo
strumento condiviso `video_generate`.

| Property             | Value                                 |
| -------------------- | ------------------------------------- |
| Default video model  | `together/Wan-AI/Wan2.2-T2V-A14B`     |
| Modes                | da testo a video, riferimento a immagine singola |
| Supported parameters | `aspectRatio`, `resolution`           |

Per usare Together come provider video predefinito:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
Vedi [Generazione video](/it/tools/video-generation) per i parametri dello strumento condiviso,
la selezione del provider e il comportamento di failover.
</Tip>

<AccordionGroup>
  <Accordion title="Nota sull'ambiente">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che
    `TOGETHER_API_KEY` sia disponibile per quel processo (ad esempio in
    `~/.openclaw/.env` o tramite `env.shellEnv`).

    <Warning>
    Le chiavi impostate solo nella tua shell interattiva non sono visibili ai
    processi Gateway gestiti come daemon. Usa `~/.openclaw/.env` o la configurazione `env.shellEnv` per
    una disponibilità persistente.
    </Warning>

  </Accordion>

  <Accordion title="Risoluzione dei problemi">
    - Verifica che la tua chiave funzioni: `openclaw models list --provider together`
    - Se i modelli non vengono visualizzati, conferma che la chiave API sia impostata nell'ambiente
      corretto per il tuo processo Gateway.
    - I riferimenti ai modelli usano il formato `together/<model-id>`.
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Provider di modelli" href="/it/concepts/model-providers" icon="layers">
    Regole dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri dello strumento condiviso di generazione video e selezione del provider.
  </Card>
  <Card title="Riferimento della configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo della configurazione, incluse le impostazioni del provider.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Dashboard di Together AI, documentazione API e prezzi.
  </Card>
</CardGroup>
