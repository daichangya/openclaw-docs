---
read_when:
    - Vuoi usare Fireworks con OpenClaw
    - Hai bisogno della variabile env della chiave API Fireworks o dell'ID del modello predefinito
summary: Configurazione di Fireworks (autenticazione + selezione del modello)
title: Fireworks
x-i18n:
    generated_at: "2026-04-12T23:30:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a85d9507c19e275fdd846a303d844eda8045d008774d4dde1eae408e8716b6f
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) espone modelli open-weight e instradati tramite un'API compatibile con OpenAI. OpenClaw include un Plugin provider Fireworks bundle.

| Proprietà     | Valore                                                 |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | chat/completions compatibili con OpenAI                |
| URL di base   | `https://api.fireworks.ai/inference/v1`                |
| Modello predefinito | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Per iniziare

<Steps>
  <Step title="Configura l'autenticazione Fireworks tramite onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Questo memorizza la tua chiave Fireworks nella configurazione di OpenClaw e imposta il modello iniziale Fire Pass come predefinito.

  </Step>
  <Step title="Verifica che il modello sia disponibile">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Esempio non interattivo

Per configurazioni scriptate o CI, passa tutti i valori sulla riga di comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catalogo integrato

| Riferimento modello                                    | Nome                        | Input      | Contesto | Output massimo | Note                                           |
| ------------------------------------------------------ | --------------------------- | ---------- | -------- | -------------- | ---------------------------------------------- |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000  | 256,000        | Modello iniziale bundle predefinito su Fireworks |

<Tip>
Se Fireworks pubblica un modello più recente, ad esempio una nuova release di Qwen o Gemma, puoi passare direttamente a quel modello usando il suo ID modello Fireworks senza attendere un aggiornamento del catalogo bundle.
</Tip>

## ID modello Fireworks personalizzati

OpenClaw accetta anche ID modello Fireworks dinamici. Usa l'ID esatto del modello o del router mostrato da Fireworks e anteponi `fireworks/`.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Come funziona il prefisso dell'ID modello">
    Ogni riferimento modello Fireworks in OpenClaw inizia con `fireworks/` seguito dall'ID esatto o dal percorso del router della piattaforma Fireworks. Per esempio:

    - Modello router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modello diretto: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw rimuove il prefisso `fireworks/` quando costruisce la richiesta API e invia il percorso rimanente all'endpoint Fireworks.

  </Accordion>

  <Accordion title="Nota sull'ambiente">
    Se il Gateway viene eseguito fuori dalla tua shell interattiva, assicurati che `FIREWORKS_API_KEY` sia disponibile anche per quel processo.

    <Warning>
    Una chiave presente solo in `~/.profile` non aiuterà un daemon launchd/systemd a meno che quell'ambiente non venga importato anche lì. Imposta la chiave in `~/.openclaw/.env` o tramite `env.shellEnv` per garantire che il processo gateway possa leggerla.
    </Warning>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
