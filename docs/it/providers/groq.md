---
read_when:
    - Vuoi usare Groq con OpenClaw
    - Hai bisogno della variabile d'ambiente della chiave API o dell'opzione di autenticazione CLI
summary: Configurazione di Groq (autenticazione + selezione del modello)
title: Groq
x-i18n:
    generated_at: "2026-04-12T23:30:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613289efc36fedd002e1ebf9366e0e7119ea1f9e14a1dae773b90ea57100baee
    source_path: providers/groq.md
    workflow: 15
---

# Groq

[Groq](https://groq.com) fornisce inferenza ultraveloce su modelli open source
(Llama, Gemma, Mistral e altri) usando hardware LPU personalizzato. OpenClaw si connette
a Groq tramite la sua API compatibile con OpenAI.

| Proprietà | Valore            |
| --------- | ----------------- |
| Provider  | `groq`            |
| Auth      | `GROQ_API_KEY`    |
| API       | Compatibile con OpenAI |

## Per iniziare

<Steps>
  <Step title="Ottieni una chiave API">
    Crea una chiave API su [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Imposta la chiave API">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Imposta un modello predefinito">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### Esempio di file di configurazione

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Modelli disponibili

Il catalogo modelli di Groq cambia frequentemente. Esegui `openclaw models list | grep groq`
per vedere i modelli attualmente disponibili, oppure controlla
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Modello                     | Note                               |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Uso generale, contesto ampio       |
| **Llama 3.1 8B Instant**    | Veloce, leggero                    |
| **Gemma 2 9B**              | Compatto, efficiente               |
| **Mixtral 8x7B**            | Architettura MoE, ragionamento solido |

<Tip>
Usa `openclaw models list --provider groq` per l'elenco più aggiornato dei
modelli disponibili nel tuo account.
</Tip>

## Trascrizione audio

Groq fornisce anche una rapida trascrizione audio basata su Whisper. Quando è configurato come
provider di comprensione dei media, OpenClaw usa il modello `whisper-large-v3-turbo` di Groq
per trascrivere i messaggi vocali tramite la superficie condivisa `tools.media.audio`.

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Dettagli della trascrizione audio">
    | Proprietà | Valore |
    |----------|-------|
    | Percorso di configurazione condiviso | `tools.media.audio` |
    | URL base predefinito   | `https://api.groq.com/openai/v1` |
    | Modello predefinito    | `whisper-large-v3-turbo` |
    | Endpoint API           | `/audio/transcriptions` compatibile con OpenAI |
  </Accordion>

  <Accordion title="Nota sull'ambiente">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `GROQ_API_KEY` sia
    disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite
    `env.shellEnv`).

    <Warning>
    Le chiavi impostate solo nella shell interattiva non sono visibili ai
    processi Gateway gestiti dal daemon. Usa `~/.openclaw/.env` o la configurazione `env.shellEnv` per
    una disponibilità persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Riferimento configurazione" href="/it/gateway/configuration-reference" icon="gear">
    Schema completo della configurazione, incluse le impostazioni dei provider e dell'audio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Dashboard Groq, documentazione API e prezzi.
  </Card>
  <Card title="Elenco modelli Groq" href="https://console.groq.com/docs/models" icon="list">
    Catalogo ufficiale dei modelli Groq.
  </Card>
</CardGroup>
